// The geometry and the colour of the marks of a data layer: shapes, bowed and wavy lines, arrowheads, the outline of a comet, and
// a colour run through stops. Pure functions of numbers and text; nothing here knows a sport. Written for this package from the
// plain geometry (quadratic curves, offsets along a normal); no code of any plotting library is used.
import { rgbOf, safeColour } from "./colour.ts";
import { num } from "./format.ts";
import type { MarkShape } from "./layers.types.ts";

/** A place, `[x, y]`, in the drawing's frame. */
export type P = readonly [number, number];

const hex2 = (n: number): string => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");

/**
 * A colour a fraction `t` (0 to 1) of the way through `stops`, as a hex colour, or the nearest stop when one cannot be read without a
 * browser (`var(--x)`, a name that is not a common one). Stops that are not colours are ignored; with none left, `undefined`.
 */
export function rampColour(stops: readonly string[], t: number): string | undefined {
  const safe = stops.map((stop) => safeColour(stop)).filter((stop): stop is string => stop !== undefined);
  if (safe.length === 0) return undefined;
  const at = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0)) * (safe.length - 1);
  const k = Math.min(Math.floor(at), safe.length - 2);
  if (safe.length === 1) return safe[0];
  const a = rgbOf(safe[k]);
  const b = rgbOf(safe[k + 1]);
  if (a === undefined || b === undefined) return safe[Math.round(at)];
  const f = at - k;
  return `#${hex2(a[0] + (b[0] - a[0]) * f)}${hex2(a[1] + (b[1] - a[1]) * f)}${hex2(a[2] + (b[2] - a[2]) * f)}`;
}

/** The corners of each shape for a mark of radius 1, as offsets from its centre, with y down. A circle has none. */
const CORNERS: Record<Exclude<MarkShape, "circle">, readonly P[]> = (() => {
  const plus = (arm: number, half: number): P[] => [
    [-half, -arm], [half, -arm], [half, -half], [arm, -half], [arm, half], [half, half], [half, arm], [-half, arm], [-half, half], [-arm, half], [-arm, -half], [-half, -half],
  ];
  const star: P[] = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? 1.28 : 0.52;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    star.push([Math.round(r * Math.cos(a) * 1000) / 1000, Math.round(r * Math.sin(a) * 1000) / 1000]);
  }
  const turn45 = (list: P[]): P[] => list.map(([x, y]): P => [Math.round((x - y) * Math.SQRT1_2 * 1000) / 1000, Math.round((x + y) * Math.SQRT1_2 * 1000) / 1000]);
  return {
    square: [[-0.88, -0.88], [0.88, -0.88], [0.88, 0.88], [-0.88, 0.88]],
    triangle: [[0, -1.2], [1.05, 0.62], [-1.05, 0.62]],
    diamond: [[0, -1.25], [1.25, 0], [0, 1.25], [-1.25, 0]],
    cross: plus(1.2, 0.4),
    x: turn45(plus(1.2, 0.4)),
    star,
  };
})();

/**
 * The path of a polygon shape of width `width` centred on `(cx, cy)`. When the surface is turned a quarter, the corners are turned
 * back so that the shape stands upright as the eye sees it.
 */
export function shapePath(shape: Exclude<MarkShape, "circle">, cx: number, cy: number, width: number, turned: boolean): string {
  const r = width / 2;
  const corners = CORNERS[shape];
  let d = "";
  for (let i = 0; i < corners.length; i += 1) {
    const [ox, oy] = corners[i];
    const x = turned ? oy * r : ox * r;
    const y = turned ? -ox * r : oy * r;
    d += `${i === 0 ? "M" : "L"}${num(cx + x)} ${num(cy + y)}`;
  }
  return `${d}Z`;
}

/** True for a shape drawn as a polygon, not a circle. */
export const isPolygon = (shape: string): shape is Exclude<MarkShape, "circle"> => Object.prototype.hasOwnProperty.call(CORNERS, shape);

const length = (a: P, b: P): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** A line from one place to another, straight or bowed, that can be walked by distance. */
export interface Curve {
  from: P;
  to: P;
  /** The control point of the bow, or `undefined` for a straight line. */
  control?: P;
  /** The length of the line. */
  length: number;
  /** The place a distance `s` along the line. */
  at(s: number): P;
  /** The unit direction of the line a distance `s` along it. */
  tangent(s: number): P;
  /** The same line with its last `by` cut off (so that an arrowhead's tip can stand where the line was to end). */
  trim(by: number): Curve;
}

function straight(from: P, to: P): Curve {
  const chord = length(from, to);
  const u: P = chord === 0 ? [1, 0] : [(to[0] - from[0]) / chord, (to[1] - from[1]) / chord];
  const at = (s: number): P => [from[0] + u[0] * s, from[1] + u[1] * s];
  return { from, to, length: chord, at, tangent: () => u, trim: (by) => straight(from, at(Math.max(0, chord - Math.min(by, chord * 0.9)))) };
}

function bowed(from: P, control: P, to: P): Curve {
  const STEPS = 40;
  const point = (t: number): P => [(1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * control[0] + t * t * to[0], (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * control[1] + t * t * to[1]];
  const along: number[] = [0];
  let previous = point(0);
  for (let i = 1; i <= STEPS; i += 1) {
    const here = point(i / STEPS);
    along.push(along[i - 1] + length(previous, here));
    previous = here;
  }
  const total = along[STEPS];
  const param = (s: number): number => {
    const target = Math.max(0, Math.min(total, s));
    let k = 0;
    while (k < STEPS - 1 && along[k + 1] < target) k += 1;
    const span = along[k + 1] - along[k];
    return (k + (span === 0 ? 0 : (target - along[k]) / span)) / STEPS;
  };
  return {
    from,
    to,
    control,
    length: total,
    at: (s) => point(param(s)),
    tangent: (s) => {
      const t = param(s);
      const dx = 2 * (1 - t) * (control[0] - from[0]) + 2 * t * (to[0] - control[0]);
      const dy = 2 * (1 - t) * (control[1] - from[1]) + 2 * t * (to[1] - control[1]);
      const m = Math.hypot(dx, dy) || 1;
      return [dx / m, dy / m];
    },
    // Cutting a quadratic curve at a parameter leaves a quadratic curve: its control point is the same fraction of the way to the old one.
    trim: (by) => {
      const t = param(total - Math.min(by, total * 0.9));
      return bowed(from, [from[0] + (control[0] - from[0]) * t, from[1] + (control[1] - from[1]) * t], point(t));
    },
  };
}

/** A line from `from` to `to` bowed by `bow` times its length (zero for straight). Positive bows to the right of the way it goes as the surface is drawn wide. */
export function curveBetween(from: P, to: P, bow: number): Curve {
  if (length(from, to) === 0 || !Number.isFinite(bow) || bow === 0) return straight(from, to);
  return bowed(from, [(from[0] + to[0]) / 2 - (to[1] - from[1]) * bow, (from[1] + to[1]) / 2 + (to[0] - from[0]) * bow], to);
}

/** The path of a straight or bowed line. */
export function curvePath(curve: Curve): string {
  const to = curve.to;
  const head = `M${num(curve.from[0])} ${num(curve.from[1])}`;
  return curve.control === undefined ? `${head}L${num(to[0])} ${num(to[1])}` : `${head}Q${num(curve.control[0])} ${num(curve.control[1])} ${num(to[0])} ${num(to[1])}`;
}

/**
 * A wave along a line: a chain of quadratic curves, each half a wavelength long, that leans to one side and then the other, so
 * that it starts and ends on the line. The wavelength is stretched a little so that a whole number of waves fits.
 */
export function wavePath(curve: Curve, amplitude: number, wavelength: number): string {
  const L = curve.length;
  const halves = Math.max(2, 2 * Math.round(L / Math.max(wavelength, L / 400)));
  const first = curve.at(0);
  let d = `M${num(first[0])} ${num(first[1])}`;
  for (let k = 0; k < halves; k += 1) {
    const mid = curve.at(((k + 0.5) / halves) * L);
    const t = curve.tangent(((k + 0.5) / halves) * L);
    const end = curve.at(((k + 1) / halves) * L);
    if (k === 0) {
      // The first half bows to the left of the way it goes; each next one is its reflection, which `T` makes.
      d += `Q${num(mid[0] - t[1] * 2 * amplitude)} ${num(mid[1] + t[0] * 2 * amplitude)} ${num(end[0])} ${num(end[1])}`;
    } else d += `T${num(end[0])} ${num(end[1])}`;
  }
  return d;
}

/** The path of a head at `tip`, pointing along the unit direction `u`: a filled triangle (closed) or an open chevron. */
export function headPath(tip: P, u: P, headLength: number, halfWidth: number, open: boolean): string {
  const base: P = [tip[0] - u[0] * headLength, tip[1] - u[1] * headLength];
  const left: P = [base[0] - u[1] * halfWidth, base[1] + u[0] * halfWidth];
  const right: P = [base[0] + u[1] * halfWidth, base[1] - u[0] * halfWidth];
  const corner = (p: P): string => `${num(p[0])} ${num(p[1])}`;
  return open ? `M${corner(left)}L${corner(tip)}L${corner(right)}` : `M${corner(tip)}L${corner(left)}L${corner(right)}Z`;
}

/** The outline of a comet along a line: a shape that grows from a point at the start to `widest` wide at the end. */
export function taperPath(curve: Curve, widest: number, steps = 14): string {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const s = (i / steps) * curve.length;
    const p = curve.at(s);
    const t = curve.tangent(s);
    const half = (widest * (0.08 + 0.92 * (i / steps))) / 2;
    left.push(`${num(p[0] - t[1] * half)} ${num(p[1] + t[0] * half)}`);
    right.push(`${num(p[0] + t[1] * half)} ${num(p[1] - t[0] * half)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}

/** A polyline's path. */
export const polylinePath = (points: readonly P[], last?: P): string => points.map((p, i) => `${i === 0 ? "M" : "L"}${num(i === points.length - 1 && last !== undefined ? last[0] : p[0])} ${num(i === points.length - 1 && last !== undefined ? last[1] : p[1])}`).join("");
