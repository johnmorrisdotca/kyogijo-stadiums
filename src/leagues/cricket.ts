// The cricket ground: the pitch, the creases and the wickets from the Laws of Cricket (MCC, 2017 Code, 4th Edition 2026, Laws 6 to 8), and, in the ICC's playing conditions (effective from October 2026), the
// 30-yard circle and the limits on the size of the boundary. The Laws give no size for the boundary: it is a parameter of the drawing, the figure here is the range the ICC allows. Yards, as the Laws print them first.
import type { Unit } from "../units.ts";
import { span, type Span } from "./fields.ts";
import { inFeet, type LeagueBase } from "./types.ts";

const yds = (ft: number, inches = 0): number => (ft * 12 + inches) / 36;

/** The figures of the ground, in the unit of the table they are in (yards). */
export interface CricketFigures {
  /** The pitch: its length (the distance between the bowling creases, which are its ends) and its width (5 feet either side of the line of the middle stumps). */
  pitchLength: number;
  pitchWidth: number;
  /** The bowling crease's length; the popping crease's distance in front of it; how far the popping crease is marked either side of the line of the middle stumps (the creases are unlimited in length). */
  bowlingCrease: number;
  poppingCrease: number;
  poppingEach: number;
  /** The return creases: their inside edges' distance either side of that line, and how far they are marked behind the popping crease. */
  returnOutside: number;
  returnBehind: number;
  /** A set of wickets' width. */
  wicket: number;
  /** The boundary, as its distance from the centre of the pitch: the range the rules allow and the one drawn. */
  boundary: Span;
  /** The radius of the semicircles of the fielding restriction (the 30-yard circle) about each middle stump, or none. */
  circle: number | null;
  /** The width of the lines: the Laws print none. */
  lineWidth: number;
}

/** The ground as the drawing wants it: the figures with every length in feet. */
export type CricketSpec = CricketFigures;

/** The ground's figures in feet, from the unit the Laws give them in. */
export const cricketInFeet = (figures: CricketFigures, unit: Unit): CricketSpec => inFeet(figures, unit) as unknown as CricketSpec;

/** A league with a cricket ground of its own. */
export type CricketLeague = LeagueBase<"cricket", CricketFigures>;

const pitch = {
  pitchLength: 22,
  pitchWidth: yds(10),
  bowlingCrease: yds(8, 8),
  poppingCrease: yds(4),
  returnOutside: yds(4, 4),
  returnBehind: yds(8),
  wicket: yds(0, 9),
  lineWidth: yds(0, 2),
} as const;

/**
 * The Laws of Cricket (MCC, 2017 Code, 4th Edition 2026): the pitch 22 yards by 10 feet (6.1); the bowling crease 8 ft 8 in (7.2); the popping crease 4 ft in front of it and marked at least 6 ft either side of
 * the line of the middle stumps (7.3); the return creases 4 ft 4 in either side of that line (inside edges), marked 8 ft behind the popping crease (7.4); a set of wickets 9 in wide (8.1). No boundary size
 * and no circle: the Laws have none (19), so the boundary is any size, 75 yards by default. The Laws print no width for the creases: 2 inches is drawn.
 */
export const MCC_GROUND: CricketFigures = { ...pitch, poppingEach: yds(6), boundary: span(0, Infinity, 75), circle: null };

/**
 * The ICC men's playing conditions (effective from October 2026): the Laws' pitch and creases (6.1, 7.2 to 7.4, 8.1), the popping crease marked at least 25 ft either side (7.3), a boundary no longer than 90 yards
 * and not shorter than 65 yards from the centre of the pitch (19.1.3), and the two semicircles of 30 yards about the middle stumps, linked by two parallel lines (28.7.2.1). 75 yards is drawn.
 */
export const ICC_MEN_GROUND: CricketFigures = { ...pitch, poppingEach: yds(25), boundary: span(65, 90, 75), circle: 30 };

/** The ICC women's playing conditions (ODI, effective from October 2026): a boundary of 60 to 70 yards (19.1.3) and semicircles of 25.15 yards (23 m, 28.7.2.1). 65 yards is drawn. */
export const ICC_WOMEN_GROUND: CricketFigures = { ...pitch, poppingEach: yds(25), boundary: span(60, 70, 65), circle: 25.15 };

/** The cricket leagues: the ICC men's conditions first (the ground with the 30-yard circle), then the women's and the Laws. */
export const CRICKET_LEAGUES: readonly CricketLeague[] = [
  { id: "icc-men", family: "cricket", name: { en: "ICC men's ground", ja: "ICC男子のグラウンド" }, unit: "yd", dimensions: ICC_MEN_GROUND, sources: ["mcc-laws", "icc-men-odi"], builtIn: true },
  { id: "icc-women", family: "cricket", name: { en: "ICC women's ground", ja: "ICC女子のグラウンド" }, unit: "yd", dimensions: ICC_WOMEN_GROUND, sources: ["mcc-laws", "icc-women-odi"] },
  { id: "mcc", family: "cricket", name: { en: "Laws of Cricket ground (MCC)", ja: "クリケット規則（MCC）のグラウンド" }, unit: "yd", dimensions: MCC_GROUND, sources: ["mcc-laws"] },
];
