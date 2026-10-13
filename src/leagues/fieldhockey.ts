// The field hockey pitch: the FIH's Rules of Hockey (effective 1 March 2026), Rule 1 and the Field and Equipment Specifications, in metres. Lines are measured as the rules measure them: the pitch to the
// outer edges of the back-lines and side-lines, the 22.90 m lines "between the furthest edges", the circle's outside edge.
import type { Unit } from "../units.ts";
import { fixed, type Span } from "./fields.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The figures of the pitch, in the unit of the table they are in. */
export interface FieldHockeyFigures {
  length: Span;
  width: Span;
  /** The width of the lines. */
  lineWidth: number;
  /** The distance from the back-line to the 22.90 m lines (the 23-metre lines), edge to edge. */
  twentyThree: number;
  /** The goal-posts' inside distance, the height under the crossbar, and the net's depth at the ground (the least the rules allow). */
  goalWidth: number;
  goalHeight: number;
  goalDepth: number;
  /** The circle: the straight line's length, and the distance from the back-line to its outside edge (the quarter-circles' radius). */
  circleLine: number;
  circleRadius: number;
  /** The broken line outside the circle: its distance from the circle (outer edges), the length of each solid section and of each gap. */
  broken: { outside: number; solid: number; gap: number };
  /** The penalty spot's diameter, and its centre's distance from the inner edge of the goal-line. */
  spot: number;
  spotFrom: number;
  /** The marks outside the pitch: their length, their distance from the goal-post on the back-lines (the corner marks at 5 and 10 m). */
  mark: number;
  cornerMarks: number[];
  /** The flag-posts' height (at least). */
  flag: number;
}

/** The pitch as the drawing wants it: the figures with every length in feet. */
export type FieldHockeySpec = FieldHockeyFigures;

/** The pitch's figures in feet, from the unit the rules give them in. */
export const fieldHockeyInFeet = (figures: FieldHockeyFigures, unit: Unit): FieldHockeySpec => inFeet(figures, unit) as unknown as FieldHockeySpec;

/** A league with a hockey pitch of its own. */
export type FieldHockeyLeague = LeagueBase<"fieldhockey", FieldHockeyFigures>;

/**
 * The FIH's pitch, from the Rules of Hockey (effective 1 March 2026), Field and Equipment Specifications 1.1 to 1.8: 91.40 by 55.00 m; lines 75 mm; the 22.90 m lines (1.3e); the circle (1.4): a 3.66 m
 * line whose outside edge is 14.63 m from the back-line, continued by quarter-circles centred on the inside front corners of the posts; the broken line 5 m outside it, solid sections of 300 mm and gaps of 3 m
 * (1.4d); the penalty spot 150 mm across, its centre 6.40 m from the inner edge of the goal-line (Rule 1; 6.475 m from the outer edge, 1.3i); the goal 3.66 m between the posts and 2.14 m under the crossbar
 * (1.5d), its net at least 1.20 m deep at the ground (1.5e); marks of 300 mm outside the pitch at 5 and 10 m from the goal-posts (1.3g); flag-posts of 1.20 to 1.50 m (1.8).
 */
export const FIH_PITCH: FieldHockeyFigures = {
  length: fixed(91.4),
  width: fixed(55),
  lineWidth: 0.075,
  twentyThree: 22.9,
  goalWidth: 3.66,
  goalHeight: 2.14,
  goalDepth: 1.2,
  circleLine: 3.66,
  circleRadius: 14.63,
  broken: { outside: 5, solid: 0.3, gap: 3 },
  spot: 0.15,
  spotFrom: 6.4,
  mark: 0.3,
  cornerMarks: [5, 10],
  flag: 1.2,
};

/** The field hockey leagues. */
export const FIELD_HOCKEY_LEAGUES: readonly FieldHockeyLeague[] = [{ id: "fih", family: "fieldhockey", name: { en: "FIH hockey pitch", ja: "FIHのフィールドホッケーのピッチ" }, unit: "m", dimensions: FIH_PITCH, sources: ["fih-rules"], builtIn: true }];
