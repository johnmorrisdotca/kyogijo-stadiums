// The types of the road-to-the-final chart: what `roadToFinal` takes (the two finalists and the matches on their way) and what it gives back. Plain data.
import type { EmblemRenderer } from "./emblems-source.ts";
import type { Language, Team } from "./types.ts";

/** A match's score from the finalist's side: `[for, against]` (numbers, or text such as a series' `4`), or one text, `"4-2"`, that is split at its dash. */
export type RoadScore = readonly [number | string, number | string] | string;

/** How a match was decided: `ft` (full time, the default), `aet` (after extra time) or `pens` (a shoot-out after extra time). */
export type RoadDecided = "ft" | "aet" | "pens";

/** One match on a finalist's way. */
export interface RoadMatch {
  /** The round, as a key. `round-of-32`, `round-of-16`, `quarter-final` and `semi-final` have words in English and Japanese; any other key is written as it is, or as `options.labels` names it. */
  round: string;
  /** The team it played: its name, abbreviation, `logo` (the flag or the crest) and `color`. */
  opponent: Team;
  /** The score, the finalist's first: `[2, 1]` is a 2-1 win. */
  score: RoadScore;
  /** How it was decided: `ft` by default, or `pens` when `pens` is given. Written under the score: FT, AET, or the shoot-out. */
  decidedBy?: RoadDecided;
  /** The shoot-out, the finalist's first: `[4, 3]`. */
  pens?: readonly [number | string, number | string];
  /** The order of the pair, left to right: `true` the finalist first, `false` its opponent first. By default the finalist is at the outer edge of its side, so that the two paths mirror each other. */
  homeFirst?: boolean;
  /** Words to write under the score in place of FT, AET or the shoot-out (`Game 6`, `OT`). An empty text writes nothing. */
  note?: string;
}

/** One match of the group stage: as a knockout match, without a round. */
export type RoadGroupMatch = Omit<RoadMatch, "round"> & { round?: string };

/** A finalist: a team and the matches it played on the way, the earliest first. */
export interface RoadFinalist extends Team {
  /** The knockout matches before the final, the earliest first. */
  path: readonly RoadMatch[];
  /** The group stage, in the order played. A row of small marks, codes and scores at the foot. */
  group?: readonly RoadGroupMatch[];
}

/** The final, when it has been played. */
export interface RoadFinal {
  /** The score, the first finalist's first. */
  score: RoadScore;
  decidedBy?: RoadDecided;
  /** The shoot-out, the first finalist's first. */
  pens?: readonly [number | string, number | string];
  note?: string;
}

/** The sizes of the chart: `card` 1080 by 1350 (a tall post), `square` 1080 by 1080, `wide` 1200 by 675 (the finalists at the two ends) and `phone` 390 wide and as tall as it needs. */
export type RoadSize = "card" | "square" | "wide" | "phone";

/** What `roadToFinal` takes besides the finalists. */
export interface RoadOptions {
  /** The words of the chart: its title, the rounds' names, how a match was decided and the table. English by default. */
  language?: Language;
  /** A prefix for the ids inside the drawing. Made from the chart when missing, so that two charts on a page do not share ids. */
  id?: string;
  /** A renderer of ready-made emblems for this chart alone, so that a finalist's `logo` may be an emblem's id. Over the one the page plugged in with `useEmblems`. */
  emblems?: EmblemRenderer;
  /** The tournament, set large at the top. "Road to the final" when missing. */
  title?: string;
  /** The line under it. "Road to the final" when a `title` is given. */
  subtitle?: string;
  /** The final, if it has been played: its score is written between the two big marks, the winner is brighter, and the table has a row for it. */
  final?: RoadFinal;
  /** The names of the rounds, by key, over the package's own words. Any key a match uses may be named here: `{ "first-round": "First round" }`. */
  labels?: Readonly<Record<string, string>>;
  /** The group stage's name, over the package's own. */
  groupLabel?: string;
  /** `card` (the default), `square`, `wide` or `phone`. */
  size?: RoadSize;
  /** `light` or `dark` to force one; `auto` (the default) follows the device and the page. */
  theme?: "auto" | "light" | "dark";
  /** Who is brighter: `auto` (the default) the side that won each match, `none` nobody. */
  winner?: "auto" | "none";
  /** Write the opponent's three-letter code under its mark. On by default. */
  codes?: boolean;
  /** A line at the foot: a source, a credit, "Made-up results". */
  endnote?: string;
  /** A class for the root. */
  className?: string;
  /** `none` leaves the stylesheet to the page (`KYOGIJO_STYLE` has every rule). */
  style?: "embed" | "none";
}

/** One finalist's record on the way. */
export interface RoadRecord {
  name: string;
  /** Matches played in the group and the knockout rounds (not the final), and how many it won, drew and lost. */
  matches: number;
  won: number;
  drawn: number;
  lost: number;
  /** The goals it scored and let in over the matches whose score is a pair of numbers. */
  scored: number;
  conceded: number;
}

/** The numbers behind a road chart. */
export interface RoadTotals {
  finalists: [RoadRecord, RoadRecord];
  /** The rounds of the chart, the earliest first, as keys. */
  rounds: string[];
  /** The final has a score. */
  played: boolean;
  /** The winner of the final, or null when it has not been played or is level. */
  champion: string | null;
}

/** The size in pixels a size draws at, and what it is for. */
export interface RoadSizeInfo {
  readonly width: number;
  /** `undefined` for a size that is as tall as the rounds need. */
  readonly height: number | undefined;
  readonly about: string;
}

/** What `roadToFinal` gives back. */
export interface RoadChart {
  /** The options the chart was made with, with the finalists: pass changes to `draw`. */
  options: RoadOptions;
  /** The chart's accessible name, in the chart's language. */
  title: string;
  /** What the chart shows, in a sentence or two, for a caption. */
  summary: string;
  /** The numbers behind it. */
  totals: RoadTotals;
  /** The drawing as an SVG string. `extra` is laid over the options (`size`, `theme`, `language`, `labels`, `final`...). */
  draw(extra?: Partial<RoadOptions>): string;
  /** One HTML table with a row for every match: the table that stands for the drawing for a screen reader. */
  table(options?: { className?: string; language?: Language }): string;
}
