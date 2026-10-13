// The team handball court: the IHF's Rules of the Game for Indoor Handball (edition of 1 July 2025), Rule 1, in metres.
import type { Unit } from "../units.ts";
import { fixed, type Span } from "./fields.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The figures of the court, in the unit of the table they are in. */
export interface HandballFigures {
  length: Span;
  width: Span;
  /** The goal: inside width and height, and the depth of its net behind the goal line (at the ground). */
  goalWidth: number;
  goalHeight: number;
  goalDepth: number;
  /** The goal-area line (6 m): its straight part's length, and its distance from the rear edge of the goal line to its front edge; the arcs' radius is that distance. */
  areaLine: number;
  areaDistance: number;
  /** The free-throw line (9 m): its distance outside the goal-area line, and the length of each segment and each space (15 cm). */
  freeThrowOutside: number;
  freeThrowDash: number;
  /** The 7-metre line: its length and its front edge's distance from the goal line; the 4-metre line likewise. */
  sevenLine: number;
  sevenDistance: number;
  fourLine: number;
  fourDistance: number;
  /** The throw-off area's diameter, the substitution line's length from the centre line and the mark that ends it (inside and outside the side line). */
  throwOff: number;
  substitution: number;
  substitutionMark: number;
  /** The width of the lines, and of the goal line between the posts. */
  lineWidth: number;
  goalLineWidth: number;
}

/** The court as the drawing wants it: the figures with every length in feet. */
export type HandballSpec = HandballFigures;

/** The court's figures in feet, from the unit the rules give them in. */
export const handballInFeet = (figures: HandballFigures, unit: Unit): HandballSpec => inFeet(figures, unit) as unknown as HandballSpec;

/** A league with a handball court of its own. */
export type HandballLeague = LeagueBase<"handball", HandballFigures>;

/**
 * The IHF's court, from Rule 1 of the Rules of the Game for Indoor Handball (1 July 2025): 40 by 20 m (1:1); the goal 3 m wide and 2 m high (1:2); lines 5 cm, the goal line between the posts 8 cm (1:3); the
 * goal-area line a 3 m line 6 m from the goal line with quarter circles of 6 m about the posts' rear inner corners (1:4); the free-throw line broken, 3 m outside it, segments and spaces of 15 cm (1:5); the 7-metre line 1 m
 * long (1:6); the 4-metre line 15 cm long (1:7); the throw-off area 4 m across (1:9); the substitution line 4.5 m from the centre line, ended by a mark 15 cm either side of the side line (1:10). The net's 1.1 m
 * depth at the ground is from the Guidelines for Playing Courts and Goals (V h), which are not part of the rules.
 */
export const IHF_COURT: HandballFigures = {
  length: fixed(40),
  width: fixed(20),
  goalWidth: 3,
  goalHeight: 2,
  goalDepth: 1.1,
  areaLine: 3,
  areaDistance: 6,
  freeThrowOutside: 3,
  freeThrowDash: 0.15,
  sevenLine: 1,
  sevenDistance: 7,
  fourLine: 0.15,
  fourDistance: 4,
  throwOff: 4,
  substitution: 4.5,
  substitutionMark: 0.15,
  lineWidth: 0.05,
  goalLineWidth: 0.08,
};

/** The handball leagues. */
export const HANDBALL_LEAGUES: readonly HandballLeague[] = [{ id: "ihf", family: "handball", name: { en: "IHF handball court", ja: "IHFのハンドボールコート" }, unit: "m", dimensions: IHF_COURT, sources: ["ihf-rules"], builtIn: true }];
