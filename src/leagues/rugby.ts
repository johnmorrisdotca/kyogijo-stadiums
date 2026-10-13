// The rugby fields: World Rugby's (union), the NRL's and the IRL's (league). Every figure is the rulebook's, in metres, the unit all three print; docs/sources.md says
// which rule. Where a rulebook gives a range, the range is kept and a size inside it is drawn.
import type { Unit } from "../units.ts";
import { fixed, span, type Span } from "./fields.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The figures of a rugby field. Lengths, in the unit of the table they are in. `null` and `[]` are what a code does not have. */
export interface RugbyFigures {
  /** `union` or `league`: the lines each code marks differ. */
  code: "union" | "league";
  /** Try line to try line (goal line to goal line), and across. */
  length: Span;
  width: Span;
  /** The depth of each in-goal area, try line to dead-ball line. */
  inGoal: Span;
  /** The width of the lines, as drawn at true width. */
  lineWidth: number;
  /** The goal posts: apart, and the crossbar's top edge above the ground. */
  postsApart: number;
  crossbar: number;
  /** Union: the 22-metre line's distance from the try line, and the 10-metre lines' from the half-way line (dash lines). */
  twentyTwo: number | null;
  tenFromHalfway: number | null;
  /** Union: the length of each dash, the dash lines parallel to the touchlines (from them), the dash line parallel to each try line (from it), and the half-way mark's length. */
  dash: number | null;
  dashFromTouch: number[];
  dashFromTry: number | null;
  halfwayMark: number | null;
  /** Union: the flag posts outside the touchlines, in line with the 22-metre lines and the half-way line. */
  flagsOutside: number | null;
  /** League: lines across the field at this step from each goal line to the half-way line, the distances of the lines marked red, and the scrum lines in from each touchline. */
  step: number | null;
  red: number[];
  scrum: number[];
  scrumWidth: number | null;
}

/** A rugby field as the drawing wants it: the figures with every length in feet. */
export type RugbySpec = RugbyFigures;

/** A rugby field's figures in feet, from the unit its rulebook gives them in. */
export const rugbyInFeet = (figures: RugbyFigures, unit: Unit): RugbySpec => inFeet(figures, unit) as unknown as RugbySpec;

/** A league with a rugby field of its own. */
export type RugbyLeague = LeagueBase<"rugby", RugbyFigures>;

const none = (): Pick<RugbyFigures, "twentyTwo" | "tenFromHalfway" | "dash" | "dashFromTouch" | "dashFromTry" | "halfwayMark" | "flagsOutside"> => ({ twentyTwo: null, tenFromHalfway: null, dash: null, dashFromTouch: [], dashFromTry: null, halfwayMark: null, flagsOutside: null });
const noLeague = (): Pick<RugbyFigures, "step" | "red" | "scrum" | "scrumWidth"> => ({ step: null, red: [], scrum: [], scrumWidth: null });

/**
 * World Rugby's field, from Law 1 of the Laws of the Game, Rugby Union, 2026: the field of play 94 to 100 m between the try lines and 68 to 70 m wide; each in-goal 6 to 22 m deep
 * (10 m is drawn: the Laws name none); the 22-metre lines 22 m from the try lines; the 10-metre dash lines 10 m either side of the half-way line; dash lines 5 m and 15 m from the touchlines and 5 m
 * from the try lines, each dash 5 m; the half-way mark 0.5 m long; the goal posts 5.6 m apart on the try line, the crossbar 3 m to its top edge; flags 2 m outside the touchlines. Law 1 gives
 * no width for the lines: 0.1 m is drawn.
 */
export const WORLD_RUGBY_FIELD: RugbyFigures = {
  code: "union",
  length: span(94, 100),
  width: span(68, 70),
  inGoal: span(6, 22, 10),
  lineWidth: 0.1,
  postsApart: 5.6,
  crossbar: 3,
  twentyTwo: 22,
  tenFromHalfway: 10,
  dash: 5,
  dashFromTouch: [5, 15],
  dashFromTry: 5,
  halfwayMark: 0.5,
  flagsOutside: 2,
  ...noLeague(),
};

/**
 * The NRL's field, from Section 1 and Section 18 of the Rugby League Laws of the Game, International Level (2023 edition): 100 m between the goal lines, 68 m wide, in-goal areas 68 by 8 m,
 * goal posts 5.5 m apart and 16 m high, lines 15 cm wide, white, at every 10 m from each goal line to the half-way line, those at 20 m and 40 m red; scrum lines 10 m and 20 m in from each touchline
 * (10 cm). The section also prints a media line 1.5 m outside each touchline, which is not drawn: it gives no length. The crossbar's height, 3 m, is the plan's label in Section 1.
 */
export const NRL_FIELD: RugbyFigures = {
  code: "league",
  length: fixed(100),
  width: fixed(68),
  inGoal: fixed(8),
  lineWidth: 0.15,
  postsApart: 5.5,
  crossbar: 3,
  ...none(),
  step: 10,
  red: [20, 40],
  scrum: [10, 20],
  scrumWidth: 0.1,
};

/**
 * The IRL's field, from Section 1 of the International Laws of the Game (2024): 100 m between the goal lines, 68 m wide, in-goal 6 to 11 m (8 m, the NRL's, is drawn), goal posts 5.5 m apart
 * with the crossbar 3 m up, a line across the field at every 10 m from each goal line to the half-way line. The book prints no line width and no red lines: the NRL's 15 cm is drawn, in white.
 */
export const IRL_FIELD: RugbyFigures = {
  code: "league",
  length: fixed(100),
  width: fixed(68),
  inGoal: span(6, 11, 8),
  lineWidth: 0.15,
  postsApart: 5.5,
  crossbar: 3,
  ...none(),
  step: 10,
  red: [],
  scrum: [],
  scrumWidth: null,
};

/** The rugby leagues, World Rugby's first. */
export const RUGBY_LEAGUES: readonly RugbyLeague[] = [
  { id: "world-rugby", family: "rugby", name: { en: "World Rugby field (rugby union)", ja: "ワールドラグビーのグラウンド（ラグビーユニオン）" }, unit: "m", dimensions: WORLD_RUGBY_FIELD, sources: ["world-rugby-laws"], builtIn: true },
  { id: "nrl", family: "rugby", name: { en: "NRL field (rugby league)", ja: "NRLのグラウンド（ラグビーリーグ）" }, unit: "m", dimensions: NRL_FIELD, sources: ["nrl-laws"] },
  { id: "irl", family: "rugby", name: { en: "International Rugby League field", ja: "国際ラグビーリーグ連盟のグラウンド" }, unit: "m", dimensions: IRL_FIELD, sources: ["irl-laws"] },
];
