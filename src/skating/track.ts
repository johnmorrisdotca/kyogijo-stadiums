// The geometry of the standard 400 m speed skating track as the ISU's Special Regulations and Technical Rules Speed Skating lay it out (Rules 203, 226, 227 and 254 and "H. Track": the layout plan and the
// measurements of standard 400 m speed skating tracks), in metres. The origin is the middle of the track, x along the straights (positive to the right as the track is drawn wide), y down the page. The
// skaters go counter-clockwise (Rule 254.1): to the right along the finishing straight at the bottom, round the right-hand curve, to the left along the crossing straight at the top. A skater changes lanes
// once a lap, on the crossing straight (Rule 254.5a), so that a lap is a straight, an inner curve, a straight, an outer curve and the crossing, 400 m on the line measured 0.5 m outside each lane's inner
// edge (Rule 227.1). Nothing here draws.
import { ISU_LONG_TRACK, type LongTrackFigures } from "../leagues/skating.ts";

/** The lane of a skater on the finishing straight: the inner or the outer (the one on the left, nearer the infield). */
export type Lane = 0 | 1;

/** The shape of a long track, from the radius of the inner edge, the width of the outer lane and the lap. */
export interface LongOval {
  /** The radius of the inner edge of the inner lane (a in the table). */
  a: number;
  /** The widths of the inner lane and of the outer lane. */
  w1: number;
  w2: number;
  /** The radii of the lines each lane is measured on (d and e in the table): 0.5 m outside the inner edge of the lane. */
  d: number;
  e: number;
  /** The length of each straight, from the end of one curve to the beginning of the next (f in the table). */
  straight: number;
  /** The crossing: from the inner lane's line at one end of the straight to the outer lane's at the other. */
  crossing: number;
  lap: number;
}

/**
 * The track for an inner radius `a` and an outer lane `w2` wide: the straight is the one that makes a lap 400 m, f + sqrt(f^2 + w1^2) + pi (d + e) = lap, where f is the straight skated twice a lap (once
 * on the finishing straight and once crossing). For a = 25 m, 25.5 m and 26 m with lanes of 4 m this is the table's 113.57 m, 112.00 m and 110.43 m.
 * @throws RangeError for a radius or a lane outside what Rule 203 allows.
 */
export function longOval(a = ISU_LONG_TRACK.innerRadius.drawn, w2 = ISU_LONG_TRACK.outerLane.drawn, fig: LongTrackFigures = ISU_LONG_TRACK): LongOval {
  if (typeof a !== "number" || !Number.isFinite(a) || a < fig.innerRadius.min || a > fig.innerRadius.max) throw new RangeError(`The inner radius of ${String(a)} m is outside what Rule 203 allows: ${fig.innerRadius.min} m to ${fig.innerRadius.max} m`);
  if (typeof w2 !== "number" || !Number.isFinite(w2) || w2 < fig.outerLane.min || w2 > fig.outerLane.max) throw new RangeError(`The outer lane of ${String(w2)} m is outside what Rule 203 allows: ${fig.outerLane.min} m to ${fig.outerLane.max} m`);
  const w1 = fig.innerLane;
  const d = a + fig.measure;
  const e = a + w1 + fig.measure;
  const need = fig.lap - Math.PI * (d + e);
  // f + sqrt(f^2 + w1^2) rises with f: bisect.
  let lo = 1;
  let hi = fig.lap;
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (mid + Math.hypot(mid, w1) < need) lo = mid;
    else hi = mid;
  }
  const f = (lo + hi) / 2;
  return { a, w1, w2, d, e, straight: f, crossing: Math.hypot(f, w1), lap: fig.lap };
}

/** The radius of the line a lane is measured on: 0 inner, 1 outer. */
export const laneRadius = (o: LongOval, lane: Lane): number => (lane === 0 ? o.d : o.e);

/** The radius of the edges of the lanes, from the inner edge of the warm-up lane out to the outer edge of the outer lane: the warm-up lane's inner edge, the inner edge, the line between the lanes, the outer edge. */
export const laneEdges = (o: LongOval, warmUp: number): { warmUp: number; inner: number; between: number; outer: number } => ({ warmUp: o.a - warmUp, inner: o.a, between: o.a + o.w1, outer: o.a + o.w1 + o.w2 });

/** The radius of the outer edge of the outer lane. */
export const outerEdge = (o: LongOval): number => o.a + o.w1 + o.w2;

const mod2 = (n: number): Lane => ((((n % 2) + 2) % 2) as Lane);

/** Where a skater is: a point of the track, the heading (0 is to the right, growing clockwise as the eye sees it), the part of the lap and how far across the lanes (0 on the inner line, 1 on the outer). */
export interface Pose {
  x: number;
  y: number;
  heading: number;
  part: "finishing-straight" | "first-curve" | "crossing" | "second-curve";
  /** The lap's number, from the lap the coordinate zero begins. */
  lap: number;
  /** 0 on the inner lane's line, 1 on the outer's, between on the crossing. */
  across: number;
}

/**
 * The pose `v` metres along the skater's own way, `v` measured from the beginning of the finishing straight (its left end, x = -f/2) of the lap the skater starts in, the lap 0. `lane` is the skater's
 * lane there; it alternates every lap (Rule 254.5a). In a lap the skater skates the finishing straight and the first curve in the lap's lane, the crossing from it to the other lane, and the second
 * curve in the other. With `noChange` the crossing of the lap 0 keeps the lane, as the first straight of the 1000 m and the 1500 m does (Rule 254.5b): the lap 0 has one lane, and the laps alternate on.
 */
export function pose(o: LongOval, lane: Lane, v: number, noChange = false): Pose {
  const f = o.straight;
  const laneOfLap = (j: number): Lane => (noChange ? (j <= 0 ? lane : mod2(lane + j - 1)) : mod2(lane + j));
  const first = laneRadius(o, lane);
  // The lap 0 of a noChange race is two straights and two curves in one lane; every other lap is the standard 400 m.
  const L0 = noChange ? 2 * f + 2 * Math.PI * first : o.lap;
  const lapNo = v < L0 ? 0 : 1 + Math.floor((v - L0) / o.lap);
  let s = lapNo === 0 ? v : v - L0 - (lapNo - 1) * o.lap;
  const laneIn = laneOfLap(lapNo);
  const laneOut = laneOfLap(lapNo + 1);
  const rIn = laneRadius(o, laneIn);
  const rOut = laneRadius(o, laneOut);
  const across = (r: number): number => (r === o.d ? 0 : 1);
  if (s < f) return { x: -f / 2 + s, y: rIn, heading: 0, part: "finishing-straight", lap: lapNo, across: across(rIn) };
  s -= f;
  if (s < Math.PI * rIn) {
    const t = s / rIn;
    return { x: f / 2 + rIn * Math.sin(t), y: rIn * Math.cos(t), heading: -t, part: "first-curve", lap: lapNo, across: across(rIn) };
  }
  s -= Math.PI * rIn;
  const cross = rIn === rOut ? f : o.crossing;
  if (s < cross) {
    const t = s / cross;
    return { x: f / 2 - f * t, y: -(rIn + (rOut - rIn) * t), heading: Math.PI + Math.atan2(rIn - rOut, f) * -1, part: "crossing", lap: lapNo, across: across(rIn) + (across(rOut) - across(rIn)) * t };
  }
  s -= cross;
  const t = Math.min(Math.PI, s / rOut);
  return { x: -f / 2 - rOut * Math.sin(t), y: -rOut * Math.cos(t), heading: Math.PI - t, part: "second-curve", lap: lapNo, across: across(rOut) };
}

/** The coordinate of the finishing line on the lap 0's finishing straight, from the straight's beginning: the 400 m mark is 100 m on (Rule 227.2 and the layout plan: h = f - 100). */
export const finishAt = (o: LongOval, line: "400m" | "1000m"): number => (line === "400m" ? 100 : o.straight / 2);

/** The x of a coordinate on a straight of the lap 0 (the finishing straight), or `undefined` where it is not on it. */
export const xOfFinishing = (o: LongOval, u: number): number => -o.straight / 2 + u;

/**
 * Where a skater in lane `lane` starts a race of `distance` metres that finishes at `finish` metres along the finishing straight (`finishAt`): back from the finishing line along the skater's own way.
 * `noChange` says the race's first straight keeps its lane (the 1000 m and the 1500 m, Rule 254.5b). Returns the skater's coordinate `v0` at the start, inside the lap it starts in, and the pose there; a
 * skater who has skated `s` metres is at `pose(o, lane, v0 + s, noChange)`.
 */
export function startOf(o: LongOval, lane: Lane, distance: number, finish: number, noChange = false): { v0: number; pose: Pose } {
  const L0 = noChange ? 2 * o.straight + 2 * Math.PI * laneRadius(o, lane) : o.lap;
  // The finishing line is on the finishing straight of the lap n, which begins at T(n); the start is `distance` before it.
  const T = (n: number): number => (n === 0 ? 0 : L0 + o.lap * (n - 1));
  let n = 0;
  while (T(n) + finish - distance < 0) n += 1;
  const v0 = T(n) + finish - distance;
  return { v0, pose: pose(o, lane, v0, noChange) };
}
