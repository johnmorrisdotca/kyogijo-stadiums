// The long track: the ice, the padding, the lanes and the warm-up lane, the blocks of the curves, the coaches' area, the finishing lines and the starting lines of each race. Every figure is the ISU's
// (Special Regulations and Technical Rules Speed Skating, Rules 203, 205, 226, 227, 228, 253, 254 and 256 to 257, and "H. Track"), in metres. Nothing here draws SVG: it makes the shapes.
import { line, poly } from "../fields.kit.ts";
import type { Shape } from "../fields.types.ts";
import { ISU_LONG_TRACK, type LongTrackFigures } from "../leagues/skating.ts";
import { LONG_TRACK_RACES } from "./events.ts";
import { addParts, blocksOf, emptyParts, stadiumD, type MBox, type Parts } from "./parts.ts";
import { finishAt, laneEdges, laneRadius, outerEdge, pose, startOf, type Lane, type LongOval, type Pose } from "./track.ts";
import type { LongTrackRace, SkatingInfield } from "./types.ts";

/** Where a skater starts: the lane (or `both` for a line across both lanes) and the point of the start. */
export interface StartPlacement {
  lane: Lane | "both";
  /** The coordinate along the skater's own way, from the beginning of the finishing straight of the lap the start is in. */
  v0: number;
  x: number;
  y: number;
  heading: number;
}

/** What a race marks: the lines where it starts, the finishing line it ends at, and how its first straight is skated. */
export interface RaceMarks {
  race: LongTrackRace;
  /** The finishing line: the 400 m mark at the end of the finishing straight or the 1000 m mark in the middle of it. */
  finish: "400m" | "1000m";
  /** True when the first straight keeps its lane (the 1000 m and the 1500 m, Rule 254.5b). */
  noChange: boolean;
  /** The starting lines: one for each lane, or one across both. */
  starts: StartPlacement[];
}

/** How each race starts. `at` is the finishing line's mark, `middle` a start in the middle of the straights (Rules 256 and 257). */
const SPEC: Readonly<Record<LongTrackRace, { finish: "400m" | "1000m"; distance: number; noChange: boolean; start?: "middle" | "both-straights" }>> = {
  "500m": { finish: "400m", distance: 500, noChange: false },
  "1000m": { finish: "1000m", distance: 1000, noChange: true },
  "1500m": { finish: "400m", distance: 1500, noChange: true },
  "3000m": { finish: "400m", distance: 3000, noChange: false },
  "5000m": { finish: "400m", distance: 5000, noChange: false },
  "10000m": { finish: "400m", distance: 10000, noChange: false },
  "mass-start": { finish: "400m", distance: 0, noChange: false, start: "middle" },
  "team-pursuit": { finish: "1000m", distance: 0, noChange: false, start: "both-straights" },
  "team-sprint": { finish: "1000m", distance: 0, noChange: false, start: "both-straights" },
};

/** The marks of a race on the oval. */
export function markRace(o: LongOval, race: LongTrackRace): RaceMarks {
  const spec = SPEC[race];
  const finish = finishAt(o, spec.finish);
  const place = (lane: Lane | "both", v0: number, p: Pose): StartPlacement => ({ lane, v0, x: p.x, y: p.y, heading: p.heading });
  if (spec.start === "middle") {
    const p = pose(o, 0, o.straight / 2);
    return { race, finish: spec.finish, noChange: false, starts: [place("both", o.straight / 2, { ...p, y: o.d })] };
  }
  if (spec.start === "both-straights") {
    const bottom = pose(o, 0, o.straight / 2);
    const top = pose(o, 0, o.straight + Math.PI * o.d + o.crossing / 2);
    return { race, finish: spec.finish, noChange: false, starts: [place(0, o.straight / 2, bottom), place(0, 0, { ...top, y: -o.d })] };
  }
  const starts = ([0, 1] as const).map((lane) => {
    const s = startOf(o, lane, spec.distance, finish, spec.noChange);
    return place(lane, s.v0, s.pose);
  });
  // A line across both lanes where the two lanes start at the same place (the 500 m, the 10,000 m).
  const same = Math.abs(starts[0].x - starts[1].x) < 1e-6 && Math.abs(starts[0].y * starts[1].y) > 0 && Math.sign(starts[0].y) === Math.sign(starts[1].y);
  return { race, finish: spec.finish, noChange: spec.noChange, starts: same ? [{ ...starts[0], lane: "both" }] : starts };
}

/** The y-range of a lane's band on the top or the bottom side at x, from the edges' radii: on a straight the band is the radii themselves; past the end of a curve's start, the circle's. */
function bandAt(f: number, x: number, rA: number, rB: number, side: 1 | -1): [number, number] {
  const out = Math.abs(x) - f / 2;
  const y = (r: number): number => (out <= 0 ? r : Math.sqrt(Math.max(0, r * r - out * out)));
  return [side * y(rA), side * y(rB)];
}

/** What the long track adds: everything from the ice to the lines. */
export interface LongOptions {
  fig: LongTrackFigures;
  warmUp: boolean;
  infield: SkatingInfield;
  blocks: boolean;
  coaches: boolean;
  padding: boolean;
  races: readonly LongTrackRace[];
}

export const LONG_DEFAULTS = { warmUp: true, infield: "floor" as SkatingInfield, blocks: true, coaches: true, padding: true };

/** The ice's outer radius: the outer edge of the outer lane and the 3 m the Rules keep clear (Rule 228.2). */
export const iceRadius = (o: LongOval, fig: LongTrackFigures = ISU_LONG_TRACK): number => outerEdge(o) + fig.padding.clear;

/** The parts of the long track. */
export function longParts(o: LongOval, opt: LongOptions): { parts: Parts; marks: RaceMarks[]; box: MBox } {
  const { fig } = opt;
  const f = o.straight;
  const edges = laneEdges(o, opt.warmUp ? fig.warmUpLane : 0);
  const R = iceRadius(o, fig);
  const parts = emptyParts();
  const L = fig.line;
  // The ice, the infield and the padding: the ice out to the padding, the padding a band 0.3 m thick at its edge, and what lies inside the warm-up lane.
  parts.areas.push({ id: "ice", feature: "ice", cls: "ky-ska-ice", d: stadiumD(f, R) });
  if (opt.padding) parts.areas.push({ id: "padding", feature: "padding", cls: "ky-ska-pad", d: `${stadiumD(f, R + fig.padding.thick)}${stadiumD(f, R)}`, evenodd: true });
  if (opt.warmUp) parts.areas.push({ id: "warm-up", feature: "warm-up", cls: "ky-ska-warm", d: `${stadiumD(f, edges.inner)}${stadiumD(f, edges.warmUp)}`, evenodd: true });
  parts.areas.push({ id: "infield", feature: "infield", cls: opt.infield === "ice" ? "ky-ska-ice" : "ky-ska-floor", d: stadiumD(f, edges.warmUp) });
  // The lanes' lines (Rule 226): fully painted, 5 cm wide, in the straights and in the curves.
  const radii = [...(opt.warmUp ? [edges.warmUp] : []), edges.inner, edges.between, edges.outer];
  radii.forEach((r, i) => parts.shapes.push({ kind: "path", id: `lane-line-${i}`, feature: "lane-lines", d: stadiumD(f, r), w: L, cls: "ky-ska-b" }));
  // The blocks (Rule 226): inside the painted lines of the inner lane's edge and of the line between the lanes, 50 cm apart for the first 15 m of a curve and 2 m after.
  if (opt.blocks) {
    for (const [name, r] of [["inner", edges.inner], ["between", edges.between]] as const) {
      const rb = r - L - fig.blocks.height;
      for (const side of ["right", "left"] as const) parts.shapes.push(...blocksOf(`blocks-${name}-${side}`, f, side, rb, fig.blocks.near, fig.blocks.nearLength, fig.blocks.far, 0.12));
    }
  }
  // The coaches' area (Rule 227.3): a line 2 cm wide, 1 m from the outside edge of the track, from 25 m after the end of the curve to 10 m before the next, on the crossing straight.
  if (opt.coaches) {
    const y = -(edges.outer + fig.coaches.offset);
    parts.shapes.push(line("coaches-area", "coaches-area", f / 2 - fig.coaches.after, y, -f / 2 + fig.coaches.before, y, { w: 0.02, cls: "ky-ska-r" }));
  }
  // The finishing lines and the last 5 m before them, marked by the metre (Rule 227.2).
  const marks = opt.races.map((r) => markRace(o, r));
  const finishes = new Set<"400m" | "1000m">(["400m"]);
  for (const m of marks) finishes.add(m.finish);
  const bottom = bandAt(f, 0, edges.inner, edges.outer, 1);
  for (const which of finishes) {
    const x = -f / 2 + finishAt(o, which);
    parts.shapes.push(line(`finish-${which}`, "finish-line", x, bottom[0], x, bottom[1], { w: L, cls: "ky-ska-r" }));
    for (let m = 1; m <= fig.finishMetres; m += 1) parts.shapes.push(line(`finish-${which}-metre-${m}`, "finish-marks", x - m, bottom[0], x - m, bottom[1], { w: 0.02, cls: "ky-ska-b" }));
  }
  // The starting lines, each 2 m after a pre-start line (Rule 227.2 and 253.3): across the lane, or across both lanes.
  for (const m of marks) {
    for (const s of m.starts) {
      const side: 1 | -1 = s.y >= 0 ? 1 : -1;
      const lanes: [number, number] = s.lane === "both" ? [edges.inner, edges.outer] : s.lane === 0 ? [edges.inner, edges.between] : [edges.between, edges.outer];
      const [y0, y1] = bandAt(f, s.x, lanes[0], lanes[1], side);
      parts.shapes.push(line(`start-${m.race}-${String(s.lane)}`, "start-lines", s.x, y0, s.x, y1, { w: L, cls: "ky-ska-r" }));
      // Behind the line: to the left on the finishing straight, to the right on the crossing straight.
      const px = s.x + (side === 1 ? -fig.preStart : fig.preStart);
      const [q0, q1] = bandAt(f, px, lanes[0], lanes[1], side);
      parts.shapes.push(line(`pre-start-${m.race}-${String(s.lane)}`, "pre-start-lines", px, q0, px, q1, { w: 0.02, cls: "ky-ska-b" }));
    }
  }
  void poly;
  const out = R + fig.padding.thick;
  return { parts, marks, box: { x0: -f / 2 - out, y0: -out, x1: f / 2 + out, y1: out } };
}

export { addParts, laneRadius, LONG_TRACK_RACES };
export type { Shape };
