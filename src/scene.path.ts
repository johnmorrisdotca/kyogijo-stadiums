// Path data and transforms as numbers: a path read into absolute segments (an arc becomes cubic curves), a transform attribute into a matrix, and a shape's
// segments flattened to points, for the renderers that have only points (GeoJSON) and for the bounds of a shape.
import type { Matrix, PathCommand, SceneShape } from "./scene.types.ts";

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** The matrix that does `b` first and then `a`'s frame: the transform of a child inside a parent. */
export const multiply = (a: Matrix, b: Matrix): Matrix => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];

/** The matrix that undoes `m`, or the identity when `m` flattens the plane. */
export function invert(m: Matrix): Matrix {
  const det = m[0] * m[3] - m[1] * m[2];
  if (det === 0) return IDENTITY;
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
}

export const isIdentity = (m: Matrix): boolean => m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;

/** A point moved by a matrix. */
export const apply = (m: Matrix, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/** A `transform` attribute (`matrix`, `translate`, `scale`, `rotate`, in any run) as one matrix. */
export function parseTransform(text: string | undefined): Matrix {
  if (text === undefined || text.trim() === "") return IDENTITY;
  let m: Matrix = IDENTITY;
  for (const part of text.matchAll(/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g)) {
    const n = part[2].split(/[\s,]+/).filter((v) => v !== "").map(Number);
    let t: Matrix;
    switch (part[1]) {
      case "matrix":
        t = [n[0], n[1], n[2], n[3], n[4], n[5]];
        break;
      case "translate":
        t = [1, 0, 0, 1, n[0], n[1] ?? 0];
        break;
      case "scale":
        t = [n[0], 0, 0, n[1] ?? n[0], 0, 0];
        break;
      case "rotate": {
        const a = (n[0] * Math.PI) / 180;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const r: Matrix = [c, s, -s, c, 0, 0];
        t = n.length >= 3 ? multiply(multiply([1, 0, 0, 1, n[1], n[2]], r), [1, 0, 0, 1, -n[1], -n[2]]) : r;
        break;
      }
      case "skewX":
        t = [1, 0, Math.tan((n[0] * Math.PI) / 180), 1, 0, 0];
        break;
      default:
        t = [1, Math.tan((n[0] * Math.PI) / 180), 0, 1, 0, 0];
    }
    if (t.some((v) => !Number.isFinite(v))) throw new Error(`Cannot read the transform "${text}"`);
    m = multiply(m, t);
  }
  return m;
}

/** An SVG elliptical arc as cubic curves (the endpoint parametrisation of the SVG specification, appendix F.6). */
function arcToCurves(x0: number, y0: number, rx: number, ry: number, rotation: number, large: boolean, sweep: boolean, x: number, y: number): PathCommand[] {
  if ((x0 === x && y0 === y) || rx === 0 || ry === 0) return [["L", x, y]];
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x0 - x) / 2;
  const dy = (y0 - y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cx1 = (k * rx * y1) / ry;
  const cy1 = (-k * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (x0 + x) / 2;
  const cy = sin * cx1 + cos * cy1 + (y0 + y) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const start = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let sweepBy = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && sweepBy > 0) sweepBy -= 2 * Math.PI;
  else if (sweep && sweepBy < 0) sweepBy += 2 * Math.PI;
  const pieces = Math.max(1, Math.ceil(Math.abs(sweepBy) / (Math.PI / 2) - 1e-9));
  const step = sweepBy / pieces;
  const t = (4 / 3) * Math.tan(step / 4);
  const out: PathCommand[] = [];
  const at = (a: number): [number, number, number, number] => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    return [ca, sa, -sa, ca];
  };
  for (let i = 0; i < pieces; i += 1) {
    const a1 = start + i * step;
    const a2 = a1 + step;
    const [c1, s1] = at(a1);
    const [c2, s2] = at(a2);
    const p = (ux: number, uy: number): [number, number] => [cos * rx * ux - sin * ry * uy + cx, sin * rx * ux + cos * ry * uy + cy];
    const [q1x, q1y] = p(c1 - t * s1, s1 + t * c1);
    const [q2x, q2y] = p(c2 + t * s2, s2 - t * c2);
    const [ex, ey] = i === pieces - 1 ? [x, y] : p(c2, s2);
    out.push(["C", q1x, q1y, q2x, q2y, ex, ey]);
  }
  return out;
}

const ARGS: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

/**
 * Path data as absolute segments: `M`, `L`, `C`, `Q` and `Z`. Relative commands, `H`, `V`, `S` and `T` are worked out, and an arc is cubic curves.
 * @example
 * ```ts
 * import { pathCommands } from "@johnmorrisdotca/kyogijo/scene";
 * console.log(pathCommands("M0 0h10v5H0Z").map((c) => c.join(" ")));
 * // [ 'M 0 0', 'L 10 0', 'L 10 5', 'L 0 5', 'Z' ]
 * ```
 */
export function pathCommands(d: string): PathCommand[] {
  const out: PathCommand[] = [];
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?|[01](?=[01]\b)/g) ?? [];
  let i = 0;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cmd = "";
  let lastCubic: [number, number] | undefined;
  let lastQuad: [number, number] | undefined;
  // The two flags of an arc may be written without a space (`a1 1 0 011 1`): flags are read one digit at a time.
  const flag = (): number => {
    const t = tokens[i];
    if (t === "0" || t === "1") {
      i += 1;
      return Number(t);
    }
    const first = t[0];
    tokens[i] = t.slice(1);
    return Number(first);
  };
  const next = (): number => {
    const v = Number(tokens[i]);
    if (!Number.isFinite(v)) throw new Error(`Cannot read the path "${d.slice(0, 60)}"`);
    i += 1;
    return v;
  };
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) {
      cmd = tokens[i];
      i += 1;
      if (cmd === "Z" || cmd === "z") {
        out.push(["Z"]);
        x = sx;
        y = sy;
        lastCubic = lastQuad = undefined;
        continue;
      }
    } else if (cmd === "" || cmd === "Z" || cmd === "z") throw new Error(`Cannot read the path "${d.slice(0, 60)}"`);
    const up = cmd.toUpperCase();
    const rel = cmd !== up;
    if (ARGS[up] === undefined) throw new Error(`Unknown path command "${cmd}"`);
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    let nextCubic: [number, number] | undefined;
    let nextQuad: [number, number] | undefined;
    switch (up) {
      case "M": {
        x = ox + next();
        y = oy + next();
        sx = x;
        sy = y;
        out.push(["M", x, y]);
        // More pairs after a move are lines.
        cmd = rel ? "l" : "L";
        break;
      }
      case "L":
        x = ox + next();
        y = oy + next();
        out.push(["L", x, y]);
        break;
      case "H":
        x = (rel ? x : 0) + next();
        out.push(["L", x, y]);
        break;
      case "V":
        y = (rel ? y : 0) + next();
        out.push(["L", x, y]);
        break;
      case "C": {
        const c: PathCommand = ["C", ox + next(), oy + next(), ox + next(), oy + next(), ox + next(), oy + next()];
        out.push(c);
        nextCubic = [c[3], c[4]];
        x = c[5];
        y = c[6];
        break;
      }
      case "S": {
        const [c2x, c2y, ex, ey] = [ox + next(), oy + next(), ox + next(), oy + next()];
        const c1: [number, number] = lastCubic === undefined ? [x, y] : [2 * x - lastCubic[0], 2 * y - lastCubic[1]];
        out.push(["C", c1[0], c1[1], c2x, c2y, ex, ey]);
        nextCubic = [c2x, c2y];
        x = ex;
        y = ey;
        break;
      }
      case "Q": {
        const c: PathCommand = ["Q", ox + next(), oy + next(), ox + next(), oy + next()];
        out.push(c);
        nextQuad = [c[1], c[2]];
        x = c[3];
        y = c[4];
        break;
      }
      case "T": {
        const [ex, ey] = [ox + next(), oy + next()];
        const c: [number, number] = lastQuad === undefined ? [x, y] : [2 * x - lastQuad[0], 2 * y - lastQuad[1]];
        out.push(["Q", c[0], c[1], ex, ey]);
        nextQuad = c;
        x = ex;
        y = ey;
        break;
      }
      default: {
        const rx = next();
        const ry = next();
        const rotation = next();
        const large = flag() === 1;
        const sweep = flag() === 1;
        const ex = ox + next();
        const ey = oy + next();
        out.push(...arcToCurves(x, y, rx, ry, rotation, large, sweep, ex, ey));
        x = ex;
        y = ey;
      }
    }
    lastCubic = nextCubic;
    lastQuad = nextQuad;
  }
  return out;
}

/** The segments of a shape in its own frame: a rectangle, circle, ellipse, line, polygon, polyline or path as path commands. */
export function shapeCommands(shape: SceneShape): PathCommand[] {
  switch (shape.kind) {
    case "path":
      return [...shape.commands];
    case "rect": {
      const { x, y, width: w, height: h } = shape;
      const r = Math.min(shape.rx, w / 2, h / 2);
      if (r <= 0) return [["M", x, y], ["L", x + w, y], ["L", x + w, y + h], ["L", x, y + h], ["Z"]];
      return [["M", x + r, y], ["L", x + w - r, y], ...arcToCurves(x + w - r, y, r, r, 0, false, true, x + w, y + r), ["L", x + w, y + h - r], ...arcToCurves(x + w, y + h - r, r, r, 0, false, true, x + w - r, y + h), ["L", x + r, y + h], ...arcToCurves(x + r, y + h, r, r, 0, false, true, x, y + h - r), ["L", x, y + r], ...arcToCurves(x, y + r, r, r, 0, false, true, x + r, y), ["Z"]];
    }
    case "circle":
      return ellipseCommands(shape.cx, shape.cy, shape.r, shape.r);
    case "ellipse":
      return ellipseCommands(shape.cx, shape.cy, shape.rx, shape.ry);
    case "line":
      return [["M", shape.x1, shape.y1], ["L", shape.x2, shape.y2]];
    default: {
      const [first, ...rest] = shape.points;
      if (first === undefined) return [];
      return [["M", first[0], first[1]], ...rest.map((p): PathCommand => ["L", p[0], p[1]]), ...(shape.kind === "polygon" ? ([["Z"]] as PathCommand[]) : [])];
    }
  }
}

function ellipseCommands(cx: number, cy: number, rx: number, ry: number): PathCommand[] {
  return [["M", cx + rx, cy], ...arcToCurves(cx + rx, cy, rx, ry, 0, false, true, cx, cy + ry), ...arcToCurves(cx, cy + ry, rx, ry, 0, false, true, cx - rx, cy), ...arcToCurves(cx - rx, cy, rx, ry, 0, false, true, cx, cy - ry), ...arcToCurves(cx, cy - ry, rx, ry, 0, false, true, cx + rx, cy), ["Z"]];
}

/** A run of points, and whether it was closed. */
export interface Ring {
  points: [number, number][];
  closed: boolean;
}

/**
 * Segments as runs of points, curves cut into straight pieces no further than `tolerance` (in the same units) from the curve. `matrix` moves every
 * point first.
 */
export function flatten(commands: readonly PathCommand[], matrix: Matrix = IDENTITY, tolerance = 0.05): Ring[] {
  const rings: Ring[] = [];
  let ring: Ring | undefined;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const add = (px: number, py: number): void => {
    (ring as Ring).points.push(apply(matrix, px, py));
    x = px;
    y = py;
  };
  const begin = (px: number, py: number): void => {
    ring = { points: [], closed: false };
    rings.push(ring);
    startX = px;
    startY = py;
    add(px, py);
  };
  const steps = (length: number): number => Math.max(2, Math.min(64, Math.ceil(Math.sqrt(length / tolerance) / 2) * 2));
  for (const c of commands) {
    if (c[0] === "M") {
      begin(c[1], c[2]);
      continue;
    }
    if (c[0] === "Z") {
      if (ring !== undefined) ring.closed = true;
      x = startX;
      y = startY;
      continue;
    }
    // A segment after a close starts a new run at the point the close came back to.
    if (ring === undefined || ring.closed) begin(x, y);
    if (c[0] === "L") add(c[1], c[2]);
    else if (c[0] === "C") {
      const [, x1, y1, x2, y2, ex, ey] = c;
      const n = steps(Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(ex - x2, ey - y2));
      const [x0, y0] = [x, y];
      for (let k = 1; k <= n; k += 1) {
        const t = k / n;
        const u = 1 - t;
        add(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey);
      }
    } else {
      const [, x1, y1, ex, ey] = c;
      const n = steps(Math.hypot(x1 - x, y1 - y) + Math.hypot(ex - x1, ey - y1));
      const [x0, y0] = [x, y];
      for (let k = 1; k <= n; k += 1) {
        const t = k / n;
        const u = 1 - t;
        add(u * u * x0 + 2 * u * t * x1 + t * t * ex, u * u * y0 + 2 * u * t * y1 + t * t * ey);
      }
    }
  }
  return rings;
}

/** The box round a shape's outline (not its stroke) after `matrix`, or undefined for a shape with no points. */
export function boundsOf(shape: SceneShape, matrix: Matrix = IDENTITY): { x: number; y: number; w: number; h: number } | undefined {
  const points = flatten(shapeCommands(shape), matrix, 0.5).flatMap((ring) => ring.points);
  if (points.length === 0) return undefined;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
