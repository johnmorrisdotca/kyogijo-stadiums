// How grass is mown: the lighter tone of a pattern as one path, for a rectangle of turf (a football field, a soccer pitch) and for the fair ground of a
// ballpark. Written from the patterns themselves (alternate bands, a chequerboard, 45-degree bands, rings and wedges); a pattern is cells of one tone laid
// on the other, and every cell is a plain rectangle, polygon or annulus.
import { num } from "./format.ts";
import type { StripePattern } from "./types.ts";

/** A rectangle of turf. */
export interface Turf {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The lighter tone of a mowing pattern: one path, whether it must be cut to the turf, and whether its rings are cut out of each other (`fill-rule: evenodd`). */
export interface Mown {
  path: string;
  /** True when the path runs past the turf and a clip path of the turf must cut it. */
  clip: boolean;
  evenodd: boolean;
}

const NONE: Mown = { path: "", clip: false, evenodd: false };

/** An odd whole number of cells nearest to a length over a cell: odd, so that both ends of the turf are mown alike. */
export const oddCells = (length: number, cell: number): number => Math.max(3, 2 * Math.round((length / cell - 1) / 2) + 1);

/** A convex polygon from its corners, as a closed subpath. */
const poly = (corners: readonly (readonly [number, number])[]): string => `M${corners.map(([px, py]) => `${num(px)} ${num(py)}`).join("L")}z`;

/** The corners of the square of a lattice turned a quarter of a right angle: the cell between `a0` and `a1` along the first axis `(ex, ey)` and `b0` and `b1` along the second, from the origin `(ox, oy)`. */
const lattice = (ox: number, oy: number, ex: number, ey: number, fx: number, fy: number, a0: number, a1: number, b0: number, b1: number): [number, number][] =>
  [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].map(([a, b]) => [ox + a * ex + b * fx, oy + a * ey + b * fy]);

const box = (x: number, y: number, w: number, h: number): string => `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}z`;

/** An annulus between two radii about a centre, as two circles of one path. */
const ring = (cx: number, cy: number, inner: number, outer: number): string => {
  const circle = (r: number): string => `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0z`;
  return inner <= 0 ? circle(outer) : `${circle(outer)}${circle(inner)}`;
};

/**
 * The lighter tone of a pattern on a rectangle of turf. `band` is the width of the usual stripe, along x; `wide` and `narrow` are twice and half of it.
 * `bands` run across the turf (side by side along x), `lengthwise` along it, `checks` are squares of about `band`, `diagonal` are 45-degree stripes
 * `band` wide across, `diamonds` are the squares of `checks` turned 45 degrees (the crosshatch of a ballpark's outfield: two passes of 45-degree stripes, `band` wide
 * across, crossing), laid so that a diamond is centred on the turf and both ends are mown alike, and `circles` are rings `band` wide about the middle. A pattern that is not one of these (`none`, `rings`, `fan`) has no tone here.
 */
export function mowTurf(pattern: StripePattern, turf: Turf, band: number): Mown {
  const { x, y, w, h } = turf;
  const parts: string[] = [];
  switch (pattern) {
    case "bands":
    case "wide":
    case "narrow": {
      const b = pattern === "wide" ? band * 2 : pattern === "narrow" ? band / 2 : band;
      for (let k = 1; k * b < w - 1e-6; k += 2) parts.push(box(x + k * b, y, Math.min(b, w - k * b), h));
      return { path: parts.join(""), clip: false, evenodd: false };
    }
    case "lengthwise": {
      const rows = oddCells(h, band);
      for (let j = 1; j < rows; j += 2) parts.push(box(x, y + (h / rows) * j, w, h / rows));
      return { path: parts.join(""), clip: false, evenodd: false };
    }
    case "checks": {
      const cols = oddCells(w, band);
      const rows = oddCells(h, band);
      for (let i = 0; i < cols; i += 1) for (let j = 0; j < rows; j += 1) if ((i + j) % 2 === 1) parts.push(box(x + (w / cols) * i, y + (h / rows) * j, w / cols, h / rows));
      return { path: parts.join(""), clip: false, evenodd: false };
    }
    case "diagonal": {
      const across = band * Math.SQRT2;
      for (let a = x - h; a < x + w; a += 2 * across) parts.push(`M${num(a)} ${num(y + h)}L${num(a + h)} ${num(y)}L${num(a + h + across)} ${num(y)}L${num(a + across)} ${num(y + h)}z`);
      return { path: parts.join(""), clip: true, evenodd: false };
    }
    case "diamonds": {
      // A lattice of squares of side `band` turned 45 degrees, one square centred on the turf: both ends of the turf then have the same tone, whatever its size.
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.SQRT1_2;
      const reach = Math.ceil((Math.hypot(w, h) / 2) / band) + 1;
      for (let i = -reach; i <= reach; i += 1) {
        for (let j = -reach; j <= reach; j += 1) {
          if (Math.abs(i + j) % 2 !== 1) continue;
          const corners = lattice(cx, cy, r, r, -r, r, (i - 0.5) * band, (i + 0.5) * band, (j - 0.5) * band, (j + 0.5) * band);
          const xs = corners.map((c) => c[0]);
          const ys = corners.map((c) => c[1]);
          if (Math.max(...xs) <= x || Math.min(...xs) >= x + w || Math.max(...ys) <= y || Math.min(...ys) >= y + h) continue;
          parts.push(poly(corners));
        }
      }
      return { path: parts.join(""), clip: true, evenodd: false };
    }
    case "circles": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const reach = Math.hypot(w / 2, h / 2);
      for (let k = 1; k * band < reach; k += 2) parts.push(ring(cx, cy, k * band, (k + 1) * band));
      return { path: parts.join(""), clip: true, evenodd: true };
    }
    default:
      return NONE;
  }
}

/** A ballpark's fair ground, as the field of its stripes: how far it reaches either side of the line to centre field and how far out. */
export interface Park {
  umin: number;
  umax: number;
  vmax: number;
}

/**
 * The lighter tone of a pattern on a ballpark: coordinates are the field's screen frame (x across, y minus the distance out from home plate). `band` is
 * 30 feet, the width of a stripe of the usual rings. `bands` run across the field at fixed distances out from home, `lengthwise` along the line to centre
 * field, `checks` are squares, `diagonal` run at 45 degrees, `diamonds` are squares of `band` with their sides along the foul lines (two passes of stripes parallel to the
 * lines, crossing, from home plate out), `fan` is wedges out from home plate, 6 degrees each. `rings` and `circles` are the park's own
 * arcs about home plate (drawn by the field itself) and `none` is plain, so they have no tone here. The path runs past the fence and must be cut to the fair ground.
 */
export function mowPark(pattern: StripePattern, park: Park, band = 30): Mown {
  const { umin, umax, vmax } = park;
  const parts: string[] = [];
  const reach = vmax + band;
  const b = pattern === "wide" ? band * 2 : pattern === "narrow" ? band / 2 : band;
  switch (pattern) {
    case "bands":
    case "wide":
    case "narrow":
      for (let k = 1; k * b < reach; k += 2) parts.push(box(umin - band, -(k + 1) * b, umax - umin + 2 * band, b));
      return { path: parts.join(""), clip: true, evenodd: false };
    case "lengthwise":
      for (let k = Math.floor(umin / b); k * b < umax; k += 1) if (Math.abs(k) % 2 === 1) parts.push(box(k * b, -reach, b, reach));
      return { path: parts.join(""), clip: true, evenodd: false };
    case "checks":
      for (let i = Math.floor(umin / band); i * band < umax; i += 1) for (let j = 0; j * band < reach; j += 1) if ((Math.abs(i) + j) % 2 === 1) parts.push(box(i * band, -(j + 1) * band, band, band));
      return { path: parts.join(""), clip: true, evenodd: false };
    case "diagonal": {
      const across = band * Math.SQRT2;
      for (let a = umin - reach; a < umax; a += 2 * across) parts.push(`M${num(a)} 0L${num(a + reach)} ${num(-reach)}L${num(a + reach + across)} ${num(-reach)}L${num(a + across)} 0z`);
      return { path: parts.join(""), clip: true, evenodd: false };
    }
    case "diamonds": {
      // The foul lines are the axes: a cell is `band` along each, from home plate, and the cells either side of a corner alternate.
      const r = Math.SQRT1_2;
      const last = Math.ceil((reach * Math.SQRT2) / band) + 1;
      for (let i = 0; i < last; i += 1) {
        for (let j = 0; j < last; j += 1) {
          if ((i + j) % 2 !== 1) continue;
          const corners = lattice(0, 0, r, -r, -r, -r, i * band, (i + 1) * band, j * band, (j + 1) * band);
          const xs = corners.map((c) => c[0]);
          const ys = corners.map((c) => c[1]);
          if (Math.max(...xs) < umin - band || Math.min(...xs) > umax + band || Math.min(...ys) > band || Math.max(...ys) < -reach) continue;
          parts.push(poly(corners));
        }
      }
      return { path: parts.join(""), clip: true, evenodd: false };
    }
    case "fan": {
      const step = (6 * Math.PI) / 180;
      const R = reach * 1.5;
      const at = (angle: number): string => `${num(R * Math.sin(angle))} ${num(-R * Math.cos(angle))}`;
      for (let k = 0; k < 15; k += 1) if (k % 2 === 1) parts.push(`M0 0L${at(-Math.PI / 4 + k * step)}L${at(-Math.PI / 4 + (k + 1) * step)}z`);
      return { path: parts.join(""), clip: true, evenodd: false };
    }
    default:
      return NONE;
  }
}
