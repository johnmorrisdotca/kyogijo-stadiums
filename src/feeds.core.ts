// What every reader of a feed shares: the formats, the game a feed is read into, the error that says why one could not be read, the limits, and text read from a feed. Pure.
import type { ReplayTimeline } from "./replay.types.ts";

/** The shapes a feed can be read in: `kyogijo` (the open timeline, or a game file), `nhl` (a play-by-play shaped as the NHL's public one), or `auto` to tell them apart. */
export type FeedFormat = "auto" | "kyogijo" | "nhl";

/** The formats there are, `auto` first. */
export const FEED_FORMATS: readonly FeedFormat[] = ["auto", "kyogijo", "nhl"];

/** A player a feed names: its side, its number and its name, as the feed gives them (at run time only). */
export interface FeedPlayer {
  side: "home" | "away";
  number?: number | string;
  name?: string;
}

/** A side of a feed's game, as the feed names it (at run time only): its letters, its name and its colour. */
export interface FeedSide {
  abbr?: string;
  name?: string;
  color?: string;
}

/** A feed read into a game. */
export interface FeedGame {
  /** The format it was read in. */
  format: Exclude<FeedFormat, "auto">;
  /** The sport whose surface it is played on, when the feed says (`nhl`). */
  sport?: string;
  /** The replay: frames, events, and the periods for a scoreboard. */
  timeline: ReplayTimeline;
  /** The two sides as the feed names them. */
  teams: { home: FeedSide; away: FeedSide };
  /** Whether the feed says the game is over: a live follow stops then. */
  ended: boolean;
  /** The players the feed names, by the id the events use in `by`. */
  players: Record<string, FeedPlayer>;
}

/** Why a feed could not be read. */
export class FeedError extends Error {
  /** `format`: not a feed of the format; `empty`: nothing to play; `cors`, `network`, `http`, `too-large`, `address`: from the fetch (`feeds.fetch.ts`). */
  readonly kind: "format" | "empty" | "cors" | "network" | "http" | "too-large" | "address";
  /** The HTTP status, for `http`. */
  readonly status?: number;
  constructor(kind: FeedError["kind"], message: string, status?: number) {
    super(message);
    this.name = "FeedError";
    this.kind = kind;
    if (status !== undefined) this.status = status;
  }
}

/** The most a feed may hold: more is cut off, so that a hostile or broken answer cannot hold the page. */
export const FEED_LIMITS = { frames: 200_000, objects: 64, events: 50_000, periods: 20, text: 80 } as const;

/** Text from a feed: a string, without control characters, cut to a length. */
export const feedText = (value: unknown, most: number = FEED_LIMITS.text): string | undefined => {
  if (typeof value !== "string") return undefined;
  const clean = [...value].filter((ch) => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127).join("").trim().slice(0, most);
  return clean === "" ? undefined : clean;
};
