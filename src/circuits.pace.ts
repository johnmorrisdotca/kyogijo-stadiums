// How fast a racing car can go round a lap: a speed for every few metres of the drawn line, from the bends alone. A bend's radius gives the fastest speed its grip allows (more grip the faster the car goes, as
// wings press it down); a pass forward holds each speed to what the engine can reach from the one before, and a pass backward to what the brakes can shed before the next. Pure: a plan in, numbers out. The
// figures (`RACE_PACE`) are generic, a modern single-seater's, guided by public timing data of a race at Las Vegas read once and kept outside the package: no time, driver or team of any real race is in them.
import type { Pt } from "./crowd.ts";
import type { CircuitPlan } from "./circuits.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";

/** The figures of the model, in metres and seconds. */
export const RACE_PACE = Object.freeze({
  /** The fastest the car goes on a straight: 94 m/s, about 338 km/h. */
  top: 94,
  /** Grip across the car: `grip + downforce × v²` metres a second squared at a speed `v`, about 2.4 g in a hairpin and 5 g in a fast bend. */
  grip: 22,
  downforce: 0.0036,
  /** How hard it brakes, and how hard it pulls away at rest; the pull falls to nothing at `top`. */
  brake: 34,
  launch: 17,
  /** The line is read every `step` metres, and a bend is measured over `reach` either side: a racing car does not follow the middle of the road, so a short kink of it is not a bend. */
  step: 5,
  reach: 32,
  /** The speed limit of the pit lane: 80 km/h. */
  pitLimit: 80 / 3.6,
});

/** A lap's speeds: one each `step` metres round the line from its first point, the time at each, and the lap's time and length. */
export interface PaceProfile {
  /** Metres between two samples. */
  step: number;
  /** The length of the line, in metres. */
  length: number;
  /** The speed at each sample, metres a second, and the seconds from the line's first point to each (one more than the speeds: the last is the lap's time). */
  speed: Float64Array;
  time: Float64Array;
  /** The time of a flying lap, in seconds. */
  lap: number;
}

/** The cumulative length of a ring at each of its points (the first 0, one more than the points: the last is the whole length). */
export function ringLengths(points: readonly Pt[]): Float64Array {
  const out = new Float64Array(points.length + 1);
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    out[i + 1] = out[i] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return out;
}

/** The point of a ring `along` units round it from its first point (wrapped), from its lengths (`ringLengths`): found by halving, so a page can ask for twenty a frame. */
export function ringPoint(points: readonly Pt[], lengths: Float64Array, along: number): Pt {
  const total = lengths[lengths.length - 1];
  if (!(total > 0)) return points[0];
  const d = ((along % total) + total) % total;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lengths[mid] <= d) lo = mid;
    else hi = mid - 1;
  }
  const a = points[lo];
  const b = points[(lo + 1) % points.length];
  const long = lengths[lo + 1] - lengths[lo];
  const t = long > 0 ? (d - lengths[lo]) / long : 0;
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

/** The same for an open line: held to its ends. */
export function linePoint(points: readonly Pt[], lengths: Float64Array, along: number): Pt {
  const total = lengths[points.length - 1];
  const d = Math.min(Math.max(along, 0), total);
  let lo = 0;
  let hi = points.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lengths[mid] <= d) lo = mid;
    else hi = mid - 1;
  }
  const a = points[lo];
  const b = points[Math.min(lo + 1, points.length - 1)];
  const long = lengths[lo + 1] - lengths[lo];
  const t = long > 0 ? (d - lengths[lo]) / long : 0;
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

/** The radius of the circle through three points, or Infinity when they lie in a line. */
function radius(a: Pt, b: Pt, c: Pt): number {
  const ab = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const ca = Math.hypot(a[0] - c[0], a[1] - c[1]);
  const cross = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  return cross < 1e-9 ? Infinity : (ab * bc * ca) / (2 * cross);
}

/** The fastest speed a bend of radius `r` metres allows: `v² = r × (grip + downforce × v²)`, and the top speed where the downforce holds it at any speed. */
export function cornerSpeed(r: number, pace = RACE_PACE): number {
  const room = 1 - pace.downforce * r;
  if (!(r < Infinity) || room <= 0) return pace.top;
  return Math.min(pace.top, Math.sqrt((pace.grip * r) / room));
}

/** How hard the car can pull away at a speed: `launch` at rest, nothing at the top speed. */
export const pullAt = (v: number, pace = RACE_PACE): number => Math.max(0.4, pace.launch * (1 - (v / pace.top) ** 2));

/**
 * A plan's speeds round its lap (`circuitPlan`), from its line alone: the bends' radii give each sample's fastest speed, and two passes round (twice, so that the lap closes on itself) hold it to the engine and the
 * brakes. The same plan always gives the same profile.
 * @example
 * ```ts
 * import { circuitById, circuitPlan, paceProfile } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const pace = paceProfile(circuitPlan(circuitById("las-vegas")!));
 * console.log(pace.lap > 90 && pace.lap < 105, Math.max(...pace.speed) * 3.6 > 300);
 * // true true
 * ```
 */
export function paceProfile(plan: CircuitPlan, pace = RACE_PACE): PaceProfile {
  const metres: Pt[] = plan.lap.map(([x, y]) => [x / FT, y / FT]);
  const lengths = ringLengths(metres);
  const length = lengths[lengths.length - 1];
  const n = Math.max(8, Math.round(length / pace.step));
  const step = length / n;
  const limit = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const s = i * step;
    limit[i] = cornerSpeed(radius(ringPoint(metres, lengths, s - pace.reach), ringPoint(metres, lengths, s), ringPoint(metres, lengths, s + pace.reach)), pace);
  }
  const speed = Float64Array.from(limit);
  for (let round = 0; round < 2; round += 1) {
    for (let k = 1; k <= n; k += 1) {
      const i = k % n;
      const before = speed[(k - 1) % n];
      speed[i] = Math.min(speed[i], Math.sqrt(before * before + 2 * pullAt(before, pace) * step));
    }
    for (let k = n - 1; k >= 0; k -= 1) {
      const after = speed[(k + 1) % n];
      speed[k] = Math.min(speed[k], Math.sqrt(after * after + 2 * pace.brake * step));
    }
  }
  const time = new Float64Array(n + 1);
  for (let i = 0; i < n; i += 1) time[i + 1] = time[i] + (2 * step) / (speed[i] + speed[(i + 1) % n]);
  return { step, length, speed, time, lap: time[n] };
}

/** The speed at `along` metres round the lap from the line's first point (wrapped), between the two samples either side. */
export function speedAt(profile: PaceProfile, along: number): number {
  const n = profile.speed.length;
  const d = ((along % profile.length) + profile.length) % profile.length;
  const i = Math.floor(d / profile.step) % n;
  const t = d / profile.step - Math.floor(d / profile.step);
  return profile.speed[i] + t * (profile.speed[(i + 1) % n] - profile.speed[i]);
}
