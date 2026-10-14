// The marks of the races: where each starts and how its start line is made (a straight line across the lane, a staggered one, a curved one), the breakline of the 800 m, the group starts of
// the long races, the takeover zones of the relays and the hurdles' marks. The distances are the Track and Field Facilities Manual's (2019 edition, 2.2.1.6, 2.2.3 and Tables 2.2.1.6a, 2.2.1.6b
// and 2.2.3.1) and Book C2.1's Technical Rules (Rules 14.3, 16.1, 17.5, 22 and 24 in the edition in force from 1 July 2026). Everything is metres, in the frame of track.ts.
import { line, poly } from "../fields.kit.ts";
import type { AthleticsMark, Shape } from "../fields.types.ts";
import { WA_SHORT_STAGGER_TABLE, type AthleticsFigures } from "../leagues/athletics.ts";
import { emptyParts, outerRadius, type Parts, type StraightPlan } from "./oval.ts";
import { distanceOn, involutePoint, laneEdge, laneRadius, lap, pose, stagger, breaklineStagger, type Oval } from "./track.ts";
import type { RaceInfo } from "./types.ts";

/** Where a lane's start line stands. */
export interface StartPlacement {
  lane: number;
  /** The distance of the start along the lane's running line from the finish line, forward. */
  s: number;
  /** Where the lane's running line crosses the start line, and the way the athlete faces there. */
  x: number;
  y: number;
  heading: number;
  /** How far ahead of lane 1's start it is, on the running line. */
  stagger: number;
}

/** A point of the plan. */
export type Pt = [number, number];

/** One race's marks as data, for the description, the replay and the tests. */
export interface RaceMarks {
  race: RaceInfo;
  /** The distance of lane 1's start line from the finish line along its running line: the least that is round whole laps to the distance of the race. */
  s1: number;
  /** The start line of each lane (a staggered start's, or a straight's: `x` is then the line's). Empty for a curved start. */
  starts: StartPlacement[];
  /** The curved start line from the kerb out across the track. */
  curve?: Pt[];
  /** The outer group's curved start line. */
  group?: Pt[];
  /** The breakline, from lane 2's inside to the outer edge. */
  breakline?: Pt[];
  /** The takeover zones: for each lane and change, where the zone starts and ends and the scratch line stands, as distances along the lane. */
  zones?: { lane: number; change: number; start: number; scratch: number; end: number }[];
  /** The hurdles: for each lane, the distances along its running line (or, on the straight, the x) of the marks. */
  hurdles?: { lane: number; at: number[] }[];
  /** What is drawn. */
  parts: Parts;
}

/** What the marks of a race are made in. */
export interface RaceContext {
  oval: Oval;
  fig: AthleticsFigures;
  /** The oval's lanes that are used, and the straight's. */
  lanes: number;
  straight: StraightPlan | undefined;
  /** True to put the lane numbers on the track behind each start line. */
  numbers: boolean;
  /** The height of those numbers. */
  numberHeight: number;
}

/** The unit normal of a heading, pointing out from the middle of the track: to the right of the athlete. */
export const outward = (heading: number): Pt => [-Math.sin(heading), Math.cos(heading)];
/** The unit vector of a heading. */
export const ahead = (heading: number): Pt => [Math.cos(heading), Math.sin(heading)];

/** The ends of the line across lane `n` at distance `s` of its running line, from radius `ra` to radius `rb` (measured as the track's radii are: outward from the middle of a bend). */
export function across(o: Oval, n: number, s: number, ra: number, rb: number): [Pt, Pt] {
  const r = laneRadius(o, n);
  const p = pose(o, r, s);
  const [nx, ny] = outward(p.heading);
  return [
    [p.x + (ra - r) * nx, p.y + (ra - r) * ny],
    [p.x + (rb - r) * nx, p.y + (rb - r) * ny],
  ];
}

/** Where a point `back` metres behind `s` on lane `n` is, and the unit vector out from the middle there. */
export function atLane(o: Oval, n: number, s: number, side = 0): { x: number; y: number; heading: number } {
  const r = laneRadius(o, n);
  const p = pose(o, r + side, s);
  return p;
}

/** The inside and the outside radius of the paintable width of lane `n`: between the line on its left and the line on its right (1.17 m of a 1.22 m lane). */
export function laneSpan(o: Oval, n: number): [number, number] {
  return [laneEdge(o, n - 1), laneEdge(o, n) - o.line];
}

/** The distance of lane 1's start from the finish line for a race of `distance` metres: the least start that is a whole number of laps before the finish line, round to the distance (Rule 14.3). */
export function firstStart(o: Oval, distance: number, nominal?: number): number {
  const L = nominal ?? lap(o, 1);
  const k = Math.ceil(distance / L - 1e-9);
  return k * L - distance;
}

/** The stagger of lane `n` for a race run in lanes round `bends` bends, with the breakline's correction where the race has one (Manual Tables 2.2.1.6a and 2.2.1.6b). */
export function staggerOf(o: Oval, n: number, bends: number, breakline: boolean, fig: AthleticsFigures): number {
  if (n <= 1) return 0;
  if (fig.banking !== null) {
    // The covered track's own table (Marking Plan, 1 January 2026).
    const row = bends === 1 ? WA_SHORT_STAGGER_TABLE["one-bend"] : bends === 3 ? WA_SHORT_STAGGER_TABLE["three-bends"] : WA_SHORT_STAGGER_TABLE["two-bends"];
    return row[n - 2] ?? stagger(o, n, bends);
  }
  return breakline ? (bends - 1) * stagger(o, n, 1) + breaklineStagger(o, n) : stagger(o, n, bends);
}

/** Where a curved start line begins on a circle of radius `a`, from its distance `s` along that circle's running line: the bend it is on or runs into, the angle there, and the wire already unwound. */
export function curveOrigin(o: Oval, a: number, s: number): { side: "right" | "left"; f0: number; wire: number } {
  const S = o.straight;
  const L = 2 * S + 2 * Math.PI * a;
  const d = ((s % L) + L) % L;
  const bend = Math.PI * a;
  if (d < bend) return { side: "right", f0: d / a, wire: 0 };
  if (d < bend + S) return { side: "left", f0: 0, wire: bend + S - d };
  if (d <= 2 * bend + S) return { side: "left", f0: (d - bend - S) / a, wire: 0 };
  return { side: "right", f0: 0, wire: L - d };
}

/** The distance of a point out from the circle of radius `a` of the track, whichever part of the track it is over. */
function offsetOf(o: Oval, a: number, x: number, y: number): number {
  const S = o.straight;
  if (x >= S / 2) return Math.hypot(x - S / 2, y) - a;
  if (x <= -S / 2) return Math.hypot(x + S / 2, y) - a;
  return Math.abs(y) - a;
}

/**
 * A curved start line, or a breakline, as points: the involute of the circle of radius `a` (see `involutePoint`) that starts where `origin` says, from `rIn` out to `rOut` (radii about the bend's
 * centre; a start line on the straight is the same curve). Where `rIn` is less than `a` a short run in to the kerb along the line across the track joins it.
 */
export function curveAcross(o: Oval, origin: { side: "right" | "left"; f0: number; wire: number }, a: number, rIn: number, rOut: number, steps = 30): Pt[] {
  const w0 = origin.wire - a * origin.f0;
  const at = (f: number): Pt => involutePoint(o, origin.side, a, w0, f);
  const out: Pt[] = [];
  const f0 = origin.f0;
  if (rIn < a - 1e-9) {
    const p0 = at(f0);
    const nx = origin.side === "right" ? Math.sin(f0) : -Math.sin(f0);
    const ny = origin.side === "right" ? Math.cos(f0) : -Math.cos(f0);
    out.push([p0[0] + (rIn - a) * nx, p0[1] + (rIn - a) * ny]);
  }
  const solve = (d: number): number => {
    let lo = f0;
    let hi = f0 + 2.4;
    for (let i = 0; i < 60; i += 1) {
      const mid = (lo + hi) / 2;
      const [x, y] = at(mid);
      if (offsetOf(o, a, x, y) < d) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const d0 = Math.max(rIn - a, 0);
  const d1 = rOut - a;
  for (let i = 0; i <= steps; i += 1) out.push(at(solve(d0 + ((d1 - d0) * i) / steps)));
  return out;
}

const W = 0.05;

/** A line across a lane at distance `s`, from radius `ra` to `rb`. */
function crossLine(o: Oval, id: string, feature: string, n: number, s: number, ra: number, rb: number, w: number, cls?: AthleticsMark): Shape {
  const [a, b] = across(o, n, s, ra, rb);
  return line(id, feature, a[0], a[1], b[0], b[1], { w, ...(cls === undefined ? {} : { cls }) });
}

/** A takeover zone's line: `len` metres across the lane from its inside line, with a hook of 0.15 m turned 45 degrees, to point into the zone (`into` = +1: ahead of the line). */
function zoneLine(o: Oval, id: string, cls: AthleticsMark, n: number, s: number, len: number, into: 1 | -1): Shape {
  const [ra] = laneSpan(o, n);
  const r = laneRadius(o, n);
  const p = pose(o, r, s);
  const [fx, fy] = ahead(p.heading);
  const [nx, ny] = outward(p.heading);
  const base: Pt = [p.x + (ra - r) * nx, p.y + (ra - r) * ny];
  const tip: Pt = [base[0] + len * nx, base[1] + len * ny];
  const k = 0.15 * Math.SQRT1_2;
  return poly(id, "relay-zones", [base, tip, [tip[0] - k * nx + into * k * fx, tip[1] - k * ny + into * k * fy]], { w: W, cls });
}

/** A mark in the middle of a lane, `len` long across it, at distance `s`. */
function middleLine(o: Oval, id: string, feature: string, n: number, s: number, len: number, cls?: AthleticsMark): Shape {
  const r = laneRadius(o, n);
  const [lo, hi] = laneSpan(o, n);
  const mid = (lo + hi) / 2;
  void r;
  return crossLine(o, id, feature, n, s, mid - len / 2, mid + len / 2, W, cls);
}

/** The marks of one race on the oval or the straight. */
export function markRace(ctx: RaceContext, race: RaceInfo): RaceMarks {
  const { oval: o, fig, lanes } = ctx;
  const parts = emptyParts();
  const out: RaceMarks = { race, s1: 0, starts: [], parts };
  const S = o.straight;
  const R = o.radius;
  const Rout = outerRadius(o);
  const kind = race.kind;
  const digitAt = (n: number, s: number): void => {
    if (!ctx.numbers) return;
    const p = pose(o, laneRadius(o, n), s - ctx.numberHeight * 1.2);
    const q = pose(o, laneRadius(o, n), s);
    parts.digits.push({ id: "start-number", feature: "lane-numbers", text: String(n), x: p.x, y: p.y, h: ctx.numberHeight, from: [q.x, q.y, Math.cos(q.heading), Math.sin(q.heading)] });
  };
  if (kind === "straight") {
    const st = ctx.straight;
    const sl = st?.lane ?? o.lane;
    const n = st?.lanes ?? lanes;
    const top = st?.y0 ?? R;
    const x = (st?.finish ?? S / 2) - race.distance;
    for (let k = 1; k <= n; k += 1) {
      const y0 = top + (k - 1) * sl;
      const y1 = top + k * sl - W;
      parts.shapes.push(line("start-line", "start-lines", x, y0, x, y1, { w: W }));
      out.starts.push({ lane: k, s: lap(o, 1) - race.distance, x, y: (y0 + y1) / 2, heading: 0, stagger: 0 });
      if (ctx.numbers) parts.digits.push({ id: "start-number", feature: "lane-numbers", text: String(k), x: x - ctx.numberHeight * 1.2, y: (y0 + y1) / 2, h: ctx.numberHeight });
    }
    if (race.hurdles === true) addStraightHurdles(parts, out, race, st?.finish ?? S / 2, top, sl, n);
    return out;
  }
  // The covered track's running line is 200.000 m by the plan, which counts its banking's transitions; the circle drawn here is a little shorter, so a start is a whole number of nominal laps back.
  const indoor = fig.banking !== null;
  const s1 = firstStart(o, race.distance, indoor ? 200 : undefined);
  out.s1 = s1;
  if (kind === "stagger") {
    const bends = indoor ? 2 : (race.bends ?? 2);
    for (let n = 1; n <= lanes; n += 1) {
      const st = staggerOf(o, n, bends, race.breakline === true, fig);
      const s = s1 + st;
      const p = pose(o, laneRadius(o, n), s);
      out.starts.push({ lane: n, s, x: p.x, y: p.y, heading: p.heading, stagger: st });
      const [ra, rb] = laneSpan(o, n);
      parts.shapes.push(crossLine(o, "start-line", "start-lines", n, s, ra, rb, W));
      digitAt(n, s);
    }
    if (race.breakline === true) {
      const a = laneRadius(o, 1);
      // Outdoors the 800 m's breakline is at the end of the first bend, the involute of the second bend's circle; on the covered track it is at the end of the second bend (Rule 44), the first bend's.
      out.breakline = curveAcross(o, { side: indoor ? "right" : "left", f0: 0, wire: S }, a, laneEdge(o, 1), Rout);
      parts.shapes.push(poly("breakline", "breakline", out.breakline, { w: W, cls: "ky-ath-g" }));
    }
    if (race.legs !== undefined) relayZones(ctx, race, out);
    if (race.hurdles === true) oval400Hurdles(ctx, race, out);
    return out;
  }
  if (kind === "curved") {
    const a = laneRadius(o, 1);
    const origin = curveOrigin(o, a, s1);
    out.curve = curveAcross(o, origin, a, R, Rout);
    parts.shapes.push(poly("start-line", "start-lines", out.curve, { w: W }));
    // The number of each lane, behind the curved line where it crosses the lane's middle.
    if (ctx.numbers) {
      for (let n = 1; n <= lanes; n += 1) {
        const r = laneRadius(o, n);
        const [lo, hi] = laneSpan(o, n);
        const mid = (lo + hi) / 2;
        const [px, py] = curveAcross(o, origin, a, mid, mid, 1)[0];
        const sMid = distanceOn(o, mid, px, py);
        const p = pose(o, mid, sMid - ctx.numberHeight * 1.2);
        void r;
        const q = pose(o, mid, sMid);
        parts.digits.push({ id: "start-number", feature: "lane-numbers", text: String(n), x: p.x, y: p.y, h: ctx.numberHeight, from: [q.x, q.y, Math.cos(q.heading), Math.sin(q.heading)] });
      }
    }
    // Where each lane's middle crosses the line: for the athletes' places, and the replay's.
    for (let n = 1; n <= lanes; n += 1) {
      const r = laneRadius(o, n);
      const [px, py] = curveAcross(o, origin, a, r, r, 1)[0];
      const sRun = distanceOn(o, r, px, py);
      const p = pose(o, r, sRun);
      out.starts.push({ lane: n, s: sRun, x: px, y: py, heading: p.heading, stagger: sRun - s1 });
    }
    if (race.group === true) {
      // The outer half starts from lane 5 (lane 4 on a six-lane track), a line of its own whose inside is 0.20 m outside the line between lanes 4 and 5 (Rule 17.5.2, Manual 2.2.1.6).
      const gl = lanes <= 6 ? 4 : 5;
      const ag = laneRadius(o, gl);
      const sg = s1 + breaklineStagger(o, gl);
      out.group = curveAcross(o, curveOrigin(o, ag, sg), ag, laneEdge(o, gl - 1), Rout);
      parts.shapes.push(poly("group-start-line", "start-lines", out.group, { w: W }));
    }
    return out;
  }
  return out;
}

/** The hurdles' marks of the sprint hurdles on the finish straight (Manual Table 2.2.3.1; Rule 22.2). */
function addStraightHurdles(parts: Parts, out: RaceMarks, race: RaceInfo, finish: number, R: number, sl: number, lanes: number): void {
  const men = race.id === "110m-hurdles" || race.id === "60m-hurdles";
  const first = men ? 13.72 : 13;
  const between = men ? 9.14 : 8.5;
  const cls: AthleticsMark = men ? "ky-ath-b" : "ky-ath-y";
  const xs: number[] = [];
  // Ten hurdles in 100 and 110 m, five in the covered track's 60 m (Table 2.2.3.1; the Marking Plan for the Standard Short Track).
  const count = race.distance <= 60 ? 5 : 10;
  for (let k = 0; k < count; k += 1) xs.push(finish - race.distance + first + between * k);
  out.hurdles = [];
  for (let n = 1; n <= lanes; n += 1) {
    const y0 = R + (n - 1) * sl;
    const y1 = R + n * sl - W;
    for (const x of xs) {
      // Two marks, 0.05 m by 0.10 m, one each side of the lane, on the line the hurdle's nearer face stands on (Rule 22.3).
      parts.shapes.push(line("hurdle-mark", "hurdle-marks", x + 0.025, y0 + W, x + 0.025, y0 + W + 0.1, { w: W, cls }), line("hurdle-mark", "hurdle-marks", x + 0.025, y1 - 0.1, x + 0.025, y1, { w: W, cls }));
    }
    out.hurdles.push({ lane: n, at: xs });
  }
}

/** The 400 m hurdles' marks on the oval: ten hurdles in each lane, the first 45 m from the start, then every 35 m (Table 2.2.3.1; Rule 22.2). */
function oval400Hurdles(ctx: RaceContext, race: RaceInfo, out: RaceMarks): void {
  const o = ctx.oval;
  out.hurdles = [];
  for (const st of out.starts) {
    const at: number[] = [];
    for (let k = 0; k < 10; k += 1) at.push(st.s + 45 + 35 * k);
    out.hurdles.push({ lane: st.lane, at });
    const [ra, rb] = laneSpan(o, st.lane);
    for (const s of at) out.parts.shapes.push(crossLine(o, "hurdle-mark", "hurdle-marks", st.lane, s + 0.025, ra + W, ra + W + 0.1, W, "ky-ath-g"), crossLine(o, "hurdle-mark", "hurdle-marks", st.lane, s + 0.025, rb - 0.1, rb, W, "ky-ath-g"));
  }
  void race;
}

/** The takeover zones of a relay: the 4 x 100 m's (30 m long, the scratch line 20 m from the zone's start) and the 4 x 400 m's (20 m long, the scratch line in the middle). Rule 24.3. */
function relayZones(ctx: RaceContext, race: RaceInfo, out: RaceMarks): void {
  const { oval: o, lanes } = ctx;
  const sprint = race.id === "4x100m";
  const long = sprint ? 30 : 20;
  const before = sprint ? 20 : 10;
  const cls: AthleticsMark = sprint ? "ky-ath-y" : "ky-ath-b";
  const len = sprint ? 1.1 : 0.8;
  out.zones = [];
  const shapes = out.parts.shapes;
  for (const st of out.starts) {
    const n = st.lane;
    const legs = race.legs as readonly number[];
    let scratch = st.s;
    for (let change = 1; change <= 3; change += 1) {
      scratch += legs[change - 1];
      // A 4 x 400 m's second and third takeovers are not in lanes: they stand across the track either side of the finish line (Manual 2.2.1.6, Marking Plan) and are marked below.
      if (!sprint && change >= 2) continue;
      const zs = scratch - before;
      const ze = zs + long;
      out.zones.push({ lane: n, change, start: zs, scratch, end: ze });
      shapes.push(zoneLine(o, "zone-start", cls, n, zs, len, 1), zoneLine(o, "zone-end", cls, n, ze, len, -1));
      shapes.push(middleLine(o, "scratch-line", "relay-zones", n, scratch, 0.4));
    }
  }
  if (!sprint) {
    // Across the track, 10 m before the finish line in lanes 2 to 8 and 10 m after it in lanes 2 to 5: a mark 0.80 m long in the middle of the lane, parallel to the finish line.
    const S = o.straight;
    for (let n = 2; n <= lanes; n += 1) {
      const [lo, hi] = laneSpan(o, n);
      const mid = (lo + hi) / 2;
      const before10 = lap(o, n) - 10;
      shapes.push(crossLine(o, "zone-start", "relay-zones", n, before10, mid - 0.4, mid + 0.4, W, cls));
      if (n <= 5) shapes.push(crossLine(o, "zone-end", "relay-zones", n, 10, mid - 0.4, mid + 0.4, W, cls));
    }
    void S;
  }
}

/** Every point that makes the start of a race: the ends of each lane's start line, the curved lines, the breakline. For a close-up's window. */
export function startPoints(o: Oval, marks: RaceMarks, straight: StraightPlan | undefined): Pt[] {
  const out: Pt[] = [];
  if (marks.race.kind === "curved") {
    if (marks.curve !== undefined) out.push(...marks.curve);
    if (marks.group !== undefined) out.push(...marks.group);
    return out;
  }
  const R = o.radius;
  if (marks.race.kind === "straight") {
    const sl = straight?.lane ?? o.lane;
    const n = straight?.lanes ?? o.lanes;
    for (const st of marks.starts) out.push([st.x, R], [st.x, R + n * sl]);
    return out;
  }
  for (const st of marks.starts) {
    const [ra, rb] = laneSpan(o, st.lane);
    out.push(...across(o, st.lane, st.s, ra, rb));
  }
  if (marks.curve !== undefined) out.push(...marks.curve);
  if (marks.group !== undefined) out.push(...marks.group);
  return out;
}

/** The pivot of a start's close-up: where the view is turned about, and the way the athletes face there. */
export function startPivot(o: Oval, marks: RaceMarks): { x: number; y: number; heading: number } {
  if (marks.race.kind === "straight") {
    const first = marks.starts[0];
    const mid = marks.starts[Math.floor(marks.starts.length / 2)] ?? first;
    return { x: mid.x, y: mid.y, heading: 0 };
  }
  if (marks.starts.length > 0) {
    const mid = marks.starts[Math.floor((marks.starts.length - 1) / 2)];
    return { x: mid.x, y: mid.y, heading: mid.heading };
  }
  const c = marks.curve as Pt[];
  const a = laneRadius(o, 1);
  const origin = curveOrigin(o, a, marks.s1);
  const p0 = pose(o, a, marks.s1);
  void origin;
  const mid = c[Math.floor(c.length / 2)];
  return { x: mid[0], y: mid[1], heading: p0.heading };
}
