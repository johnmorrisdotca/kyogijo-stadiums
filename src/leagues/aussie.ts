// The Australian football ground: the Laws' figures (Law 3 of the Laws of Australian Football 2026, and its Diagram 1) in metres, and a few named grounds with the length and
// width the AFL prints on each venue's page. The Laws give a range of sizes, not a size; the ground is drawn at the size of the one asked for, the MCG's by default.
import type { Unit } from "../units.ts";
import { span, type Span } from "./fields.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The figures of the ground, in the unit of the table they are in. */
export interface AflFigures {
  /** The Playing Surface's length (goal line to goal line) and width, as the Laws allow; the size drawn is the MCG's. */
  length: Span;
  width: Span;
  /** The goal posts' distance apart, and the behind posts' distance from each goal post on either side. */
  goalPosts: number;
  behindPosts: number;
  /** The goal square: the depth of the two lines drawn at right angles to the goal line from each goal post. */
  goalSquareDepth: number;
  /** The centre square's side, the centre circle's diameter and the Ten Metre Circle's. */
  centreSquare: number;
  centreCircle: number;
  tenMetreCircle: number;
  /** The Fifty Metre Arc: its radius, from the middle of the goal line. */
  fiftyArc: number;
  /** The width the lines are drawn at: the Laws print none. */
  lineWidth: number;
}

/** The ground as the drawing wants it: the figures with every length in feet. */
export type AflSpec = AflFigures;

/** The ground's figures in feet, from the unit the Laws give them in. */
export const aflInFeet = (figures: AflFigures, unit: Unit): AflSpec => inFeet(figures, unit) as unknown as AflSpec;

/** The league with the Laws' ground. */
export type AflLeague = LeagueBase<"afl", AflFigures>;

/**
 * Law 3 of the Laws of Australian Football 2026: oval, 135 to 185 m long and 110 to 155 m wide; goal posts 6.4 m apart and behind posts 6.4 m on each side of them, in a line (3.3.1); the goal
 * square 9 m deep from each goal post (3.4); the centre square 50 by 50 m, the Centre Circle 3 m across and the Ten Metre Circle 10 m (3.5); a Fifty Metre Arc at each end, 50 m from the middle of
 * the goal line (the definition, and Diagram 1). The length is measured as the Playing Surface is defined, inside the Boundary Line, Goal Line and Behind Line, so from goal line to goal line. The size
 * drawn is the MCG's (160 by 141 m, its venue page). The Laws print no line width: 0.1 m is drawn.
 */
export const AFL_GROUND: AflFigures = {
  length: span(135, 185, 160),
  width: span(110, 155, 141),
  goalPosts: 6.4,
  behindPosts: 6.4,
  goalSquareDepth: 9,
  centreSquare: 50,
  centreCircle: 3,
  tenMetreCircle: 10,
  fiftyArc: 50,
  lineWidth: 0.1,
};

/** The AFL league: the Laws' ground. */
export const AFL_LEAGUES: readonly AflLeague[] = [{ id: "afl", family: "afl", name: { en: "Australian football ground (AFL)", ja: "オーストラリアンフットボールのグラウンド（AFL）" }, unit: "m", dimensions: AFL_GROUND, sources: ["afl-laws"], builtIn: true }];

/** A ground the AFL publishes the size of. */
export interface AflGround {
  id: string;
  name: { en: string; ja: string };
  /** Metres, as the venue's page prints them: length by width. */
  length: number;
  width: number;
  /** The page it was read on (a key of `LEAGUE_SOURCES`). */
  source: string;
  /** What else is published, when it disagrees. */
  note?: string;
}

/**
 * The grounds whose length and width the AFL's venue pages print (read 2026-10-13), each within the Laws' range. The AFL's page for Adelaide Oval prints 190 by 125 m, a length beyond
 * the 185 m the Laws allow, so that ground is not here.
 */
export const AFL_GROUNDS: readonly AflGround[] = [
  { id: "mcg", name: { en: "Melbourne Cricket Ground", ja: "メルボルン・クリケット・グラウンド" }, length: 160, width: 141, source: "afl-venue-mcg", note: "an AFL article of 2018 printed 161 by 138 m" },
  { id: "optus-stadium", name: { en: "Optus Stadium", ja: "オプタス・スタジアム" }, length: 165, width: 130, source: "afl-venue-optus", note: "the stadium's own page says this is boundary line to boundary line" },
  { id: "gabba", name: { en: "The Gabba", ja: "ガバ" }, length: 156, width: 138, source: "afl-venue-gabba" },
  { id: "scg", name: { en: "Sydney Cricket Ground", ja: "シドニー・クリケット・グラウンド" }, length: 149, width: 136, source: "afl-venue-scg", note: "an AFL article of 2018 printed 155 by 136 m" },
  { id: "marvel-stadium", name: { en: "Marvel Stadium", ja: "マーベル・スタジアム" }, length: 159.5, width: 128.8, source: "afl-venue-marvel" },
  { id: "gmhba-stadium", name: { en: "GMHBA Stadium", ja: "GMHBAスタジアム" }, length: 170, width: 114, source: "afl-venue-gmhba", note: "an AFL article of 2018 printed 170 by 116 m" },
];
