// The plain geometry of a lap: its length, a line made simpler, the way it runs at a point, the place nearest a point and how far round the lap that is. Pure arithmetic on points in metres or feet: no data, no page.
import type { Pt } from "./crowd.ts";

/** The length of a line, closed into a ring when `closed`. */
export function lineLength(points: readonly Pt[], closed: boolean): number {
  let sum = 0;
  const last = closed ? points.length : points.length - 1;
  for (let i = 0; i < last; i += 1) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    sum += Math.hypot(q[0] - p[0], q[1] - p[1]);
  }
  return sum;
}

/** The distance from `p` to the segment from `a` to `b`, and how far along it (0 to 1) the nearest point is. */
function toSegment(p: Pt, a: Pt, b: Pt): { d: number; t: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return { d: Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]), t };
}

/** An open line with the points that lie within `tolerance` of the line between their neighbours taken out (Douglas and Peucker); the two ends are kept. */
export function simplifyLine(points: readonly Pt[], tolerance: number): Pt[] {
  if (points.length < 3) return [...points];
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [from, to] = stack.pop()!;
    let at = -1;
    let most = tolerance;
    for (let i = from + 1; i < to; i += 1) {
      const { d } = toSegment(points[i], points[from], points[to]);
      if (d > most) [at, most] = [i, d];
    }
    if (at >= 0) {
      keep[at] = true;
      stack.push([from, at], [at, to]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** A ring (the first point not repeated) made simpler as a line from its first point round to it again, so that the first point, the start of a lap, stays where it is. */
export function simplifyLoop(points: readonly Pt[], tolerance: number): Pt[] {
  const line = simplifyLine([...points, points[0]], tolerance);
  return line.slice(0, -1);
}

/** Where on a line (closed when `closed`) the point nearest `p` is: the segment it is on (from point `i` to the next), how far round from the first point that is, the point itself and the distance to it. */
export function nearestOn(points: readonly Pt[], p: Pt, closed: boolean): { i: number; along: number; at: Pt; d: number } {
  let best = { i: 0, along: 0, at: points[0], d: Infinity };
  let walked = 0;
  const last = closed ? points.length : points.length - 1;
  for (let i = 0; i < last; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const { d, t } = toSegment(p, a, b);
    if (d < best.d) best = { i, along: walked + t * long, at: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])], d };
    walked += long;
  }
  return best;
}

/** The point and the unit direction of a ring `along` units round from its first point (wrapped round the lap). */
export function pointAlong(points: readonly Pt[], along: number): { at: Pt; dir: Pt } {
  const total = lineLength(points, true);
  let left = ((along % total) + total) % total;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= long || i === points.length - 1) {
      const t = long === 0 ? 0 : Math.min(1, left / long);
      return { at: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])], dir: long === 0 ? [1, 0] : [(b[0] - a[0]) / long, (b[1] - a[1]) / long] };
    }
    left -= long;
  }
  return { at: points[0], dir: [1, 0] };
}

/**
 * Which way a ring bends at `along`, worked out over `reach` either side: the unit direction of travel there and the side the bend turns to (`1` to the left of travel in a frame whose y grows down the page, as an SVG's does,
 * `-1` to the right, `0` straight).
 */
export function bendAt(points: readonly Pt[], along: number, reach: number): { dir: Pt; side: -1 | 0 | 1 } {
  const before = pointAlong(points, along - reach).at;
  const here = pointAlong(points, along);
  const after = pointAlong(points, along + reach).at;
  const a: Pt = [here.at[0] - before[0], here.at[1] - before[1]];
  const b: Pt = [after[0] - here.at[0], after[1] - here.at[1]];
  const cross = a[0] * b[1] - a[1] * b[0];
  const scale = Math.hypot(...a) * Math.hypot(...b);
  const side = scale === 0 || Math.abs(cross / scale) < 0.02 ? 0 : cross < 0 ? 1 : -1;
  return { dir: here.dir, side };
}

/** The signed area of a ring (the shoelace sum, halved): positive when it runs clockwise on a page whose y grows down. */
export function signedAreaOf(points: readonly Pt[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    sum += p[0] * q[1] - q[0] * p[1];
  }
  return sum / 2;
}
