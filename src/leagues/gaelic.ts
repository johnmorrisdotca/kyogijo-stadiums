// The Gaelic games' field: Rule 1 of the Official Guide Part 2 of the GAA, which gives one field for football and hurling, in metres. Each code's own marks are in the figures.
import type { Unit } from "../units.ts";
import { span, type Span } from "./fields.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The figures of the field, in the unit of the table they are in. `null` is what a code does not have. */
export interface GaelicFigures {
  /** `football` or `hurling`. */
  code: "football" | "hurling";
  /** End line to end line, and across; the size drawn is the greatest. */
  length: Span;
  width: Span;
  /** The lines across the field, in metres from each end line: 13, 20, 45 and, for hurling, 65. */
  lines: number[];
  /** The posts' distance apart and the crossbar's height above the ground. */
  postsApart: number;
  crossbar: number;
  /** The small rectangle (14 by 4.5 m) and the large one (19 by 13 m): how far each side line stands outside a post's inside edge, and how deep it is. */
  small: { outside: number; depth: number };
  large: { outside: number; depth: number };
  /** The radius of the arc on the 20 m line (centred on its middle), the radius of the football arc centred on the middle of the goal line, and the penalty point's distance from it. */
  arc: number;
  footballArc: number | null;
  penaltyPoint: number | null;
  /** The half-way line: the length of the solid midline, and the length of the dashes marked out from it at intervals of the same length across the field. */
  midline: number;
  dash: number;
  /** The width of the lines. */
  lineWidth: number;
}

/** The field as the drawing wants it: the figures with every length in feet. */
export type GaelicSpec = GaelicFigures;

/** The field's figures in feet, from the unit the Guide gives them in. */
export const gaelicInFeet = (figures: GaelicFigures, unit: Unit): GaelicSpec => inFeet(figures, unit) as unknown as GaelicSpec;

/** A league with a Gaelic field of its own. */
export type GaelicLeague = LeagueBase<"gaelic", GaelicFigures>;

const common = {
  length: span(130, 145),
  width: span(80, 90),
  postsApart: 6.5,
  crossbar: 2.5,
  small: { outside: 3.75, depth: 4.5 },
  large: { outside: 6.25, depth: 13 },
  arc: 13,
  midline: 10,
  dash: 5,
  lineWidth: 0.09,
} as const;

/**
 * The field for Gaelic football, from Rule 1 of the Official Guide Part 2 (effective 27 March 2026): 130 to 145 m by 80 to 90 m; lines across at 13, 20 and 45 m from each end line; the posts
 * 6.5 m apart on the end line, the crossbar 2.5 m up; the small rectangle 14 by 4.5 m (its sides 3.75 m outside the posts' inside edges) and the large one 19 by 13 m (6.25 m); a 13 m arc on
 * each 20 m line; for football, a 40 m arc centred on the middle of the goal line and the penalty point 11 m from it; the 10 m midline with dashes of 5 m at intervals of 5 m; lines 90 mm wide.
 */
export const GAA_FOOTBALL_FIELD: GaelicFigures = { code: "football", ...common, lines: [13, 20, 45], footballArc: 40, penaltyPoint: 11 };

/** The field for hurling, the same field: the 65 m lines (marked "Hurling") and no football arc or penalty point. */
export const GAA_HURLING_FIELD: GaelicFigures = { code: "hurling", ...common, lines: [13, 20, 45, 65], footballArc: null, penaltyPoint: null };

/** The Gaelic leagues, football first. */
export const GAELIC_LEAGUES: readonly GaelicLeague[] = [
  { id: "gaa-football", family: "gaelic", name: { en: "GAA field for Gaelic football", ja: "GAAのゲーリック・フットボールのフィールド" }, unit: "m", dimensions: GAA_FOOTBALL_FIELD, sources: ["gaa-guide"], builtIn: true },
  { id: "gaa-hurling", family: "gaelic", name: { en: "GAA field for hurling", ja: "GAAのハーリングのフィールド" }, unit: "m", dimensions: GAA_HURLING_FIELD, sources: ["gaa-guide"] },
];
