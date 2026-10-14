// The oval, the straight that runs on beyond it and the finish: the surface of the track between its kerb and its outer edge, the lane lines, the kerb, the finish line and the lane numbers
// before it. Every figure is the Track and Field Facilities Manual's (2019 edition, 2.2.1 and 2.2.2) or Technical Rule 14's of Book C2.1, in metres. Nothing here draws SVG: it makes the shapes.
import { line, path } from "../fields.kit.ts";
import type { Area, Shape } from "../fields.types.ts";
import { num } from "../format.ts";
import type { AthleticsFigures } from "../leagues/athletics.ts";
import { laneEdge, type Oval } from "./track.ts";

/** A string of lane numbers painted on the track: the digits, how tall, where they are centred. They stand upright whatever way the page is turned. */
export interface Digits {
  id: string;
  feature: string;
  text: string;
  x: number;
  y: number;
  h: number;
  /** Drawn on a disc of the plate's colour, in the plate's ink, at a size that reads in a close-up (a tag), not painted on the track. */
  tag?: boolean;
  /** For a number behind a start line: the point of the line in this lane and the unit vector the athlete runs along, so that a tag can be moved back to clear the line. */
  from?: readonly [x: number, y: number, fx: number, fy: number];
}

/** What a part of a plan adds: shapes and areas in painter's order, and digits. */
export interface Parts {
  areas: Area[];
  shapes: Shape[];
  digits: Digits[];
}

export const emptyParts = (): Parts => ({ areas: [], shapes: [], digits: [] });

/** Add `more` to `into`. */
export function addParts(into: Parts, more: Parts): void {
  into.areas.push(...more.areas);
  into.shapes.push(...more.shapes);
  into.digits.push(...more.digits);
}

/** The path of a stadium: two semicircles of radius `r` joined by straights of length `s`, about the origin. */
export const stadiumD = (s: number, r: number): string => `M${num(-s / 2)} ${num(-r)}H${num(s / 2)}A${num(r)} ${num(r)} 0 0 1 ${num(s / 2)} ${num(r)}H${num(-s / 2)}A${num(r)} ${num(r)} 0 0 1 ${num(-s / 2)} ${num(-r)}Z`;

/**
 * A lane line of the oval, cut where the straight's surface lies over its bends (the straight runs on beyond the oval's, and the Marking Plan draws only the straight's own lines there): the bottom
 * straight between the bends, the east bend from where it leaves the straight's run-out round to the top, the top straight, and the west bend as far as the straight's starting area.
 */
export function laneLineD(o: Oval, r: number, straight: StraightPlan | undefined): string {
  if (straight === undefined) return stadiumD(o.straight, r);
  const S = o.straight;
  const R = o.radius;
  const wEast = straight.x1 - S / 2;
  const wWest = -S / 2 - straight.x0;
  // East bend, from the bottom (f = 0): inside the straight while its depth below the kerb line is positive and it is no further out than the run-out.
  const fEast = Math.min(Math.acos(Math.min(1, R / r)), Math.asin(Math.min(1, wEast / r)));
  // West bend, from the top: inside the straight from where it comes back below the kerb line and within the starting area.
  const fWest = Math.max(Math.PI - Math.acos(Math.min(1, R / r)), Math.PI - Math.asin(Math.min(1, wWest / r)));
  const e = [S / 2 + r * Math.sin(fEast), r * Math.cos(fEast)];
  const w = [-S / 2 - r * Math.sin(fWest), -r * Math.cos(fWest)];
  return `M${num(e[0])} ${num(e[1])}A${num(r)} ${num(r)} 0 0 0 ${num(S / 2)} ${num(-r)}H${num(-S / 2)}A${num(r)} ${num(r)} 0 0 0 ${num(w[0])} ${num(w[1])}M${num(-S / 2)} ${num(r)}H${num(S / 2)}`;
}

/** The radius of the outer edge of an oval's last lane. */
export const outerRadius = (o: Oval): number => laneEdge(o, o.lanes);

/** The straight's geometry: its first and last x (the starting area before the longest race, the run-out beyond the finish line), its lanes and how wide each is. */
export interface StraightPlan {
  lanes: number;
  lane: number;
  x0: number;
  x1: number;
  /** The start of the longest race of the straight, in metres before the finish line. */
  longest: number;
  /** The straight's inside edge (the top of lane 1) and its finish line, in the plan's frame: the oval's finish straight runs on, the covered track's lies inside it. */
  y0: number;
  finish: number;
}

/** The straight that runs on beyond the oval's finish straight (Manual 2.2.2.1): at least six lanes, a starting area of 3 m before its longest race and a run-out of 17 m. */
export function straightOf(o: Oval, fig: AthleticsFigures, lanes: number, longest: number): StraightPlan {
  return { lanes, lane: fig.straightLane, x0: o.straight / 2 - longest - fig.startArea, x1: o.straight / 2 + fig.runOut, longest, y0: o.radius, finish: o.straight / 2 };
}

/**
 * The straight of a covered track (Rules 41.3 and 42; the Marking Plan for the Standard Short Track): lanes 1.22 m wide inside the oval, parallel to its straights, with a starting area of 3 m before a
 * 60 m start line and a run-out beyond the finish line. Its place in the infield is ours: the Rules and the plan give its lanes and its length, not where it lies.
 */
export function indoorStraightOf(o: Oval, fig: AthleticsFigures, lanes: number, length: number): StraightPlan {
  const total = fig.startArea + length + fig.runOut;
  const x0 = -total / 2;
  const width = lanes * fig.straightLane;
  return { lanes, lane: fig.straightLane, x0, x1: x0 + total, longest: length, y0: -width / 2, finish: x0 + fig.startArea + length };
}

/** The infield straight of a covered track: its surface, its lane lines, its start area's and run-out's ends and its finish line, and the lane numbers before the finish. */
export function indoorStraightParts(st: StraightPlan, numbers: boolean, w: number): Parts {
  const parts = emptyParts();
  const edge = st.y0 + st.lanes * st.lane;
  parts.areas.push({ id: "infield-straight", feature: "track", cls: "ky-ath-track", d: `M${num(st.x0)} ${num(st.y0)}H${num(st.x1)}V${num(edge)}H${num(st.x0)}Z` });
  for (let k = 0; k <= st.lanes; k += 1) {
    const y = k === 0 ? st.y0 : st.y0 + k * st.lane - w / 2;
    parts.shapes.push(line_("straight-line", st.x0, y, st.x1, y, w));
  }
  parts.shapes.push(line_("straight-end", st.x0, st.y0, st.x0, edge, w), line_("straight-end", st.x1, st.y0, st.x1, edge, w));
  parts.shapes.push(line_("finish-line", st.finish, st.y0, st.finish, edge, w));
  for (let n = 1; n <= st.lanes; n += 1) {
    const y = st.y0 + (n - 0.5) * st.lane;
    parts.shapes.push(line("finish-tick", "finish-line", st.finish - 1, y - 0.4, st.finish - 1, y + 0.4, { w: 0.03, least: 0.08 }));
    if (numbers) parts.digits.push({ id: "finish-number", feature: "lane-numbers", text: String(n), x: st.finish - 2.6, y, h: Math.min(0.6, st.lane * 0.55) });
  }
  return parts;
}

const line_ = (id: string, x0: number, y0: number, x1: number, y1: number, w: number): Shape => line(id, "lane-lines", x0, y0, x1, y1, { w });

/** The surface of the oval and of the straight, the kerb, the lane lines, the finish line and the numbers before it. */
export function ovalParts(o: Oval, fig: AthleticsFigures, straight: StraightPlan | undefined, numbers: boolean, hole?: string): Parts {
  const parts = emptyParts();
  const S = o.straight;
  const R = o.radius;
  const Rout = outerRadius(o);
  const w = o.line;
  // The surface: the ring between the kerb and the outer edge, and the straight's.
  // The surface is one shape: the oval's outer edge less the turf's (or, with none, the kerb's) outline, so that the synthetic surface of the segments joins the oval's with no seam.
  parts.areas.push({ id: "track", feature: "track", cls: "ky-ath-track", d: stadiumD(S, Rout) + (hole ?? stadiumD(S, R)), evenodd: true });
  if (straight !== undefined) {
    const edge = R + straight.lanes * straight.lane;
    parts.areas.push({ id: "straight", feature: "track", cls: "ky-ath-track", d: `M${num(straight.x0)} ${num(R)}H${num(straight.x1)}V${num(edge)}H${num(straight.x0)}Z` });
  }
  // The lane lines: the line on the right of each lane, whose outer edge is at the lane's edge (Rule 14.4), so that a line's middle is half its width inside.
  for (let k = 1; k <= o.lanes; k += 1) parts.shapes.push(path(`lane-line-${k}`, "lane-lines", laneLineD(o, laneEdge(o, k) - w / 2, straight), { w }));
  // The kerb, 50 mm wide at the least (Rule 14.1); the rules allow it as wide as 250 mm, and it is drawn a little wider than the lines when the drawing is not at true widths.
  parts.shapes.push(path("kerb", "kerb", stadiumD(S, R - fig.kerb / 2), { w: fig.kerb, least: fig.kerb * 3 }));
  if (straight !== undefined) {
    const sl = straight.lane;
    for (let k = 0; k <= straight.lanes; k += 1) {
      // The inside line of lane 1 is the straight's inside edge; each other line is the outer edge of the lane before it.
      const y = k === 0 ? R : R + k * sl - w / 2;
      if (k <= o.lanes && sl === o.lane) {
        // Between the bends these are the oval's own lines; the straight's run on beyond them.
        parts.shapes.push(line(`straight-line-${k}`, "lane-lines", straight.x0, y, -S / 2, y, { w }), line(`straight-line-${k}`, "lane-lines", S / 2, y, straight.x1, y, { w }));
      } else parts.shapes.push(line(`straight-line-${k}`, "lane-lines", straight.x0, y, straight.x1, y, { w }));
    }
    // The ends of the straight, across it.
    parts.shapes.push(line("straight-end", "lane-lines", straight.x0, R, straight.x0, R + straight.lanes * sl, { w }), line("straight-end", "lane-lines", straight.x1, R, straight.x1, R + straight.lanes * sl, { w }));
  }
  // The finish line: all lanes, at right angles to the lane lines, on the axis through the centre of the second semicircle (Manual 2.2.1.1).
  const lanesAt = straight === undefined ? o.lanes : straight.lanes;
  const sl = straight === undefined ? o.lane : straight.lane;
  parts.shapes.push(line("finish-line", "finish-line", S / 2, R, S / 2, R + lanesAt * sl, { w }));
  // A white line 0.03 m wide and 0.80 m long may be marked in each lane 1 m before the finish line (Manual 2.2.1.6, "Finish Line").
  for (let n = 1; n <= lanesAt; n += 1) {
    const y = R + (n - 0.5) * sl;
    parts.shapes.push(line("finish-tick", "finish-line", S / 2 - 1, y - 0.4, S / 2 - 1, y + 0.4, { w: 0.03, least: 0.08 }));
    if (numbers) parts.digits.push({ id: "finish-number", feature: "lane-numbers", text: String(n), x: S / 2 - 2.6, y, h: Math.min(0.6, sl * 0.55) });
  }
  return parts;
}
