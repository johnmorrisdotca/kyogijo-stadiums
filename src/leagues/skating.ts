// The ice skating rinks and tracks of the International Skating Union: the standard 400 m speed skating track (Special Regulations and Technical Rules Speed Skating, Rules 203, 205, 226 and 227, and the
// layout plan and measurements of "H. Track"), the short track speed skating oval of 111.12 m on a rink of 60 by 30 m (Special Regulations and Technical Rules Short Track Speed Skating, Rule 280 and
// its diagram) and the rink of figure skating (Special Regulations and Technical Rules Single and Pair Skating and Ice Dance, Rule 342), with every figure in metres. Nothing here draws.
import { convertLength, type Unit } from "../units.ts";
import type { LeagueBase } from "./types.ts";

/** The figures of the standard 400 m speed skating track, in metres. */
export interface LongTrackFigures {
  kind: "long-track";
  /** The radius of the inner edge of the inner lane: 25 m to 26 m (Rule 203.1); 25 m drawn. */
  innerRadius: { min: number; max: number; drawn: number };
  /** The width of the inner competition lane (Rule 203.3). */
  innerLane: number;
  /** The width of the outer competition lane: at least 4 m (Rule 203.3), 4 m drawn. */
  outerLane: { min: number; max: number; drawn: number };
  /** The warm-up lane inside the competition lanes: at least 4 m wide (Rules 205 and 206). */
  warmUpLane: number;
  /** The length of a lap, measured 0.5 m outside the inner edge (Rule 227.1), the lane alternating at the crossing: at most 400 m (Rule 203.1). */
  lap: number;
  /** How far outside a lane's inner edge it is measured: 0.5 m (Rule 227.1). */
  measure: number;
  /** The width of the lane lines (fully painted, Rule 226) and of the starting and finishing lines (not more than 5 cm, Rule 227.2). */
  line: number;
  /** The blocks of a curve: 50 cm apart for the first 15 m, 2 m apart after (Rule 226). */
  blocks: { near: number; nearLength: number; far: number; height: number };
  /** The pre-start line before a starting line, and how much of the finishing line is marked by the metre (Rule 227.2). */
  preStart: number;
  finishMetres: number;
  /** The coaches' area on the crossing straight: a line 1 m from the outside edge, from 25 m after the end of one curve to 10 m before the next (Rule 227.3). */
  coaches: { offset: number; after: number; before: number };
  /** The padding round the track: at least 80 cm high, 30 cm thick, and any fixed object at least 3 m from the edge (Rule 228.2). */
  padding: { thick: number; clear: number };
}

/** The figures of the short track speed skating oval, in metres. */
export interface ShortTrackFigures {
  kind: "short-track";
  /** The length of a lap (Rule 280.1a and the diagram): 2 x S + 2 x C x pi. */
  lap: number;
  /** The distance between the centres of the curves, S, and the radius of the track's line, C (the diagram). */
  straight: number;
  radius: number;
  /** The radius of the blocks: the line of the track is 0.5 m outside them (R8.00 in the diagram). */
  blocks: number;
  /** The blocks of a curve: seven (Rule 280.4). */
  blocksPerCurve: number;
  /** The least width of the straight, from the blocks to the barrier, and from the apex block to the barrier (Rule 280.1b and 280.1c). */
  straightWidth: number;
  apexClear: number;
  /** The least size of the rink for ISU events (Rule 280.1a). */
  rink: { length: number; width: number };
  /** The other tracks laid out beside the standard one (Rule 280.1e and the diagram): how many, how far each is moved along the straight, and the distance between starting lines. */
  tracks: { five: { shift: number; lines: number }; seven: { shift: number; lines: number } };
  /** The finishing line is the width of the straight and this much more; the lines are not more than 2 cm wide (Rule 280.2). */
  finishExtra: number;
  line: number;
  /** The starting positions of the 500 m and the 1000 m: five dots of 2 cm every 1.3 m, from 50 cm out from the inner side of the track (Rule 280.2c). */
  dots: { count: number; step: number; from: number; diameter: number };
  /** The laps of each distance (the diagram). */
  laps: { "500m": number; "1000m": number; "1500m": number; "2000m": number; "3000m": number; "5000m": number };
  /** The inner surface of the track, coloured, lies this far inside the blocks (the diagram: the finishing line reaches 1.5 m in). */
  inner: number;
}

/** The figures of a figure skating rink, in metres. */
export interface FigureRinkFigures {
  kind: "figure";
  /** The skating area: if possible 60 m by 30 m, not larger and not less than 56 m by 26 m (Rule 342.1). */
  length: { min: number; max: number; drawn: number };
  width: { min: number; max: number; drawn: number };
  /** The radius of the corners, which the Rules do not give: ours. */
  corner: number;
  /** The boards' thickness as drawn, and the depth of a judges' station and of the technical panel's table, which the Rules do not give: ours. */
  boards: number;
}

/** The figures of a skating league. */
export type SkatingFigures = LongTrackFigures | ShortTrackFigures | FigureRinkFigures;

/** A league with a skating surface of its own. */
export type SkatingLeague = LeagueBase<"skating", SkatingFigures>;

/** The figures in feet, as the drawing's units are: the lengths only, not the counts, the laps or the angles. */
export function skatingInFeet(figures: SkatingFigures, unit: Unit): SkatingFigures {
  const k = (v: number): number => convertLength(v, unit, "ft");
  const span = (s: { min: number; max: number; drawn: number }): { min: number; max: number; drawn: number } => ({ min: k(s.min), max: k(s.max), drawn: k(s.drawn) });
  if (figures.kind === "long-track") {
    return { ...figures, innerRadius: span(figures.innerRadius), innerLane: k(figures.innerLane), outerLane: span(figures.outerLane), warmUpLane: k(figures.warmUpLane), lap: k(figures.lap), measure: k(figures.measure), line: k(figures.line), blocks: { near: k(figures.blocks.near), nearLength: k(figures.blocks.nearLength), far: k(figures.blocks.far), height: k(figures.blocks.height) }, preStart: k(figures.preStart), finishMetres: k(figures.finishMetres), coaches: { offset: k(figures.coaches.offset), after: k(figures.coaches.after), before: k(figures.coaches.before) }, padding: { thick: k(figures.padding.thick), clear: k(figures.padding.clear) } };
  }
  if (figures.kind === "short-track") {
    return { ...figures, lap: k(figures.lap), straight: k(figures.straight), radius: k(figures.radius), blocks: k(figures.blocks), straightWidth: k(figures.straightWidth), apexClear: k(figures.apexClear), rink: { length: k(figures.rink.length), width: k(figures.rink.width) }, tracks: { five: { shift: k(figures.tracks.five.shift), lines: k(figures.tracks.five.lines) }, seven: { shift: k(figures.tracks.seven.shift), lines: k(figures.tracks.seven.lines) } }, finishExtra: k(figures.finishExtra), line: k(figures.line), dots: { ...figures.dots, step: k(figures.dots.step), from: k(figures.dots.from), diameter: k(figures.dots.diameter) }, inner: k(figures.inner) };
  }
  return { ...figures, length: span(figures.length), width: span(figures.width), corner: k(figures.corner), boards: k(figures.boards) };
}

/**
 * The standard 400 m speed skating track (Rules 203 and 227 and "Measurements of standard 400m speed skating tracks"): two lanes, the inner 4 m wide and the outer at least 4 m, the inner curve of radius
 * 25 m to 26 m, the track measured 0.5 m outside the inner edge of each lane, a lap of 400 m made of two straights, an inner curve, an outer curve and the crossing, since a skater changes lanes once a lap.
 */
export const ISU_LONG_TRACK: LongTrackFigures = {
  kind: "long-track",
  innerRadius: { min: 25, max: 26, drawn: 25 },
  innerLane: 4,
  outerLane: { min: 4, max: 6, drawn: 4 },
  warmUpLane: 4,
  lap: 400,
  measure: 0.5,
  line: 0.05,
  blocks: { near: 0.5, nearLength: 15, far: 2, height: 0.05 },
  preStart: 2,
  finishMetres: 5,
  coaches: { offset: 1, after: 25, before: 10 },
  padding: { thick: 0.3, clear: 3 },
};

/** The short track oval (Rule 280 and the diagram "Track numbers"): S = 28.85 m, C = R8.50 m, a lap of 111.12 m on a rink of 60 by 30 m at the least. */
export const ISU_SHORT_TRACK: ShortTrackFigures = {
  kind: "short-track",
  lap: 111.12,
  straight: 28.85,
  radius: 8.5,
  blocks: 8,
  blocksPerCurve: 7,
  straightWidth: 7,
  apexClear: 4,
  rink: { length: 60, width: 30 },
  tracks: { five: { shift: 1, lines: 2 }, seven: { shift: 0.7, lines: 1.4 } },
  finishExtra: 1.5,
  line: 0.02,
  dots: { count: 5, step: 1.3, from: 0.5, diameter: 0.02 },
  laps: { "500m": 4.5, "1000m": 9, "1500m": 13.5, "2000m": 18, "3000m": 27, "5000m": 45 },
  inner: 1.5,
};

/** The figure skating rink (Rule 342.1): 60 m by 30 m if possible, 56 m by 26 m at the least. The corners and the boards are ours. */
export const ISU_FIGURE_RINK: FigureRinkFigures = {
  kind: "figure",
  length: { min: 56, max: 60, drawn: 60 },
  width: { min: 26, max: 30, drawn: 30 },
  corner: 8.5,
  boards: 0.3,
};

/** The measurements of the three options of the standard 400 m track (the table "Measurements of standard 400m speed skating tracks"): the half of the mean axis (the straight, f) and the lengths a skater skates. */
export const ISU_LONG_TRACK_TABLE: Readonly<Record<"25m" | "25.5m" | "26m", { radius: number; straight: number; crossing: number }>> = Object.freeze({
  "25m": { radius: 25, straight: 113.57, crossing: 113.64 },
  "25.5m": { radius: 25.5, straight: 112, crossing: 112.07 },
  "26m": { radius: 26, straight: 110.43, crossing: 110.5 },
});

/** The skating leagues: the long track (the sport's own), the short track and the figure skating rink. */
export const SKATING_LEAGUES: readonly SkatingLeague[] = [
  { id: "isu-long-track", family: "skating", name: { en: "ISU 400 m speed skating track", ja: "ISU 400mスピードスケートのリンク" }, unit: "m", dimensions: ISU_LONG_TRACK, sources: ["isu-speed-skating-rules"], builtIn: true },
  { id: "isu-short-track", family: "skating", name: { en: "ISU 111.12 m short track speed skating oval", ja: "ISU 111.12mショートトラックのリンク" }, unit: "m", dimensions: ISU_SHORT_TRACK, sources: ["isu-short-track-rules"] },
  { id: "isu-figure", family: "skating", name: { en: "ISU figure skating rink", ja: "ISUフィギュアスケートのリンク" }, unit: "m", dimensions: ISU_FIGURE_RINK, sources: ["isu-figure-skating-rules"] },
];
