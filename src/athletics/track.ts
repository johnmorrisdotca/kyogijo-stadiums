// The geometry of an oval athletics track, in metres, as plain data. Nothing here draws: the plan (plan.ts) and the drawing (surfaces/athletics.ts) read it, and the tests check the figures
// the World Athletics Track and Field Facilities Manual (2019 edition, 2.2.1) prints against it.
//
// The frame: the origin is the middle of the track, x runs along the straights (to the right, as the oval is drawn wide) and y across them, down the page. The athletes run
// counter-clockwise as the eye sees it (left-hand inside, Technical Rule 17.2.1), so the finish straight is the bottom one, running to the right, and the finish line A stands on
// the axis through the right-hand semicircle's centre CP2 (Manual 2.2.1.4: "the prolongation of diameter D-A"). A lane's own length `s` is measured along its running line from the
// finish line, forward.
import { num } from "../format.ts";

/** An oval track: two straights of `straight` metres joined by two semicircles whose kerb radius is `radius` (Manual 2.2.1.1; Technical Rule 14.1). */
export interface Oval {
  /** The length of each straight, which is also the distance between the centres of the semicircles. */
  straight: number;
  /** The radius of the semicircles at the kerb: the track's inside edge. */
  radius: number;
  /** The width of a lane, the 50 mm line on its right included (Rule 14.4). */
  lane: number;
  /** How many lanes the oval has. */
  lanes: number;
  /** The width of the lines. */
  line: number;
  /** Where the running line is measured: lane 1's from the kerb, every other lane's from the outer edge of the line on its left (Rule 14.2). */
  inner: number;
  outer: number;
}

/** A point on the track and the way the athlete is facing there (radians, clockwise from the right, as the eye sees it: 0 faces right, π/2 down). */
export interface Pose {
  x: number;
  y: number;
  heading: number;
}

/** The radius of lane `n`'s running line (Rule 14.2, Manual 2.2.1.1): the kerb radius and 0.30 m for lane 1, and 0.20 m outside the line on the left for the others. */
export const laneRadius = (o: Oval, n: number): number => (n <= 1 ? o.radius + o.inner : o.radius + (n - 1) * o.lane + o.outer);

/** The radius of the outer edge of lane `n`'s line. */
export const laneEdge = (o: Oval, n: number): number => o.radius + n * o.lane;

/** The length of lane `n`'s running line: one lap. */
export const lap = (o: Oval, n: number): number => 2 * o.straight + 2 * Math.PI * laneRadius(o, n);

/** A point on the running line of radius `r`, `s` metres from the finish line. A distance beyond a lap goes round again. */
export function pose(o: Oval, r: number, s: number): Pose {
  const S = o.straight;
  const L = 2 * S + 2 * Math.PI * r;
  const d = ((s % L) + L) % L;
  const bend = Math.PI * r;
  if (d <= bend) {
    const f = d / r;
    return { x: S / 2 + r * Math.sin(f), y: r * Math.cos(f), heading: -f };
  }
  if (d <= bend + S) return { x: S / 2 - (d - bend), y: -r, heading: Math.PI };
  if (d <= 2 * bend + S) {
    const f = (d - bend - S) / r;
    return { x: -S / 2 - r * Math.sin(f), y: -r * Math.cos(f), heading: Math.PI - f };
  }
  return { x: -S / 2 + (d - 2 * bend - S), y: r, heading: 0 };
}

/** The staggered start of a lane: how far ahead of lane 1's start line it is, for a race run in lanes round `bends` bends, `bends` half-turns of π(r - r₁) each (Manual Table 2.2.1.6a). */
export function stagger(o: Oval, n: number, bends: number): number {
  return bends * Math.PI * (laneRadius(o, n) - laneRadius(o, 1));
}

/** The distance along the running line of radius `r` from the finish line of the point of it nearest to (x, y): the inverse of `pose`. */
export function distanceOn(o: Oval, r: number, x: number, y: number): number {
  const S = o.straight;
  const bend = Math.PI * r;
  if (x >= S / 2) return r * Math.atan2(x - S / 2, y);
  if (x <= -S / 2) return bend + S + r * Math.atan2(-(x + S / 2), -y);
  return y < 0 ? bend + (S / 2 - x) : 2 * bend + S + (x + S / 2);
}

/** The bend the athletes run: `right` is the first, round CP2, and `left` the second, round CP1. */
type Side = "right" | "left";

/** The point of a bend's running line at the angle `f` (radians from the bend's entry), with the way the athlete faces. */
export function bendPoint(o: Oval, side: Side, r: number, f: number): Pose {
  const S = o.straight;
  return side === "right"
    ? { x: S / 2 + r * Math.sin(f), y: r * Math.cos(f), heading: -f }
    : { x: -S / 2 - r * Math.sin(f), y: -r * Math.cos(f), heading: Math.PI - f };
}

/**
 * A point of an involute of the lane-1 running circle of a bend: the curve a tight wire makes when it is unwound from the pins round the kerb, which is how the Manual has the
 * start lines and the breakline marked (2.2.1.6, "Marking for Curved Start Lines" and "Marking for the 800m Breakline"). Every point of it is the same distance from the finish by
 * the shortest permitted route: a straight line to the circle and then round it. `wire` is the length of the wire already unwound where it touches the circle at the bend's entry
 * (0 for a start on the bend, the distance back along the straight for one before it, 84.39 m for the 800 m breakline), and `f` the angle of the tangent point from the entry.
 */
export function involutePoint(o: Oval, side: Side, a: number, wire: number, f: number): [number, number] {
  const T = bendPoint(o, side, a, f);
  const l = wire + a * f;
  return [T.x - l * Math.cos(T.heading), T.y - l * Math.sin(T.heading)];
}

/**
 * The start of a race of `distance` metres run in lanes' own staggers, and the breakline of the 800 m: the stagger of lane `n` over lane 1's, from the involute of the breakline
 * (Manual Tables 2.2.1.6a and 2.2.1.6b). The breakline is the involute of lane 1's second-bend circle through the end of the first bend; a lane's runner is equal to lane 1's when
 * the lane's run to the breakline is one semicircle of lane 1's length.
 */
export function breaklineStagger(o: Oval, n: number): number {
  const a = laneRadius(o, 1);
  const r = laneRadius(o, n);
  if (n <= 1) return 0;
  // The breakline: tangent points of the second bend's circle, wire 84.39 m at the bend's entry C. Find where it meets lane n's circle about CP2 (the first bend's).
  const S = o.straight;
  const lo0 = 0;
  const f = (t: number): number => {
    const [x, y] = involutePoint(o, "left", a, S, t);
    return Math.hypot(x - S / 2, y) - r;
  };
  let lo = lo0;
  let hi = 1.5;
  // The radius from CP2 grows with t: bisect.
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  const [x, y] = involutePoint(o, "left", a, S, t);
  // The angle of the point about CP2 from the top (the end of the first bend), growing towards the finish line (so that a point beyond the line of the diameter is negative).
  const behind = Math.atan2(x - S / 2, -y);
  const arc = r * (Math.PI - behind);
  return arc - Math.PI * a;
}

/** The path of an arc of the circle (cx, cy, r) from the heading-free angle `a0` to `a1` (radians clockwise from the right as the eye sees it, y down). */
export function arcD(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number): string => `${num(cx + r * Math.cos(a))} ${num(cy + r * Math.sin(a))}`;
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${p(a0)}A${num(r)} ${num(r)} 0 ${large} ${sweep} ${p(a1)}`;
}

