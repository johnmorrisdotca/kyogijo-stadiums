// The `replay` of a mount and of a 3D view, with two ways to play a feed from an address the reader gives: `replay.fromUrl(url, options)` plays it once, and `replay.follow(url, options)` follows it live. Their code is
// in `feeds.dom.ts`, which the `/feeds` entry loads: a page that never plays a feed carries none of it, and one that does imports `/feeds` once.
import type { FeedFormat, FeedGame } from "./feeds.core.ts";
import type { FeedError } from "./feeds.core.ts";
import type { FeedFollowState } from "./feeds.fetch.ts";
import type { KyogijoReplay } from "./mount.ts";
import type { ReplaySettings, ReplayTimeline } from "./replay.types.ts";

/** What a feed played from an address can be told: its format, the replay's settings, and for a test the function that fetches. */
export interface FeedReplayOptions {
  format?: FeedFormat;
  settings?: ReplaySettings;
  base?: string;
  signal?: AbortSignal;
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}

/** A replay of a feed: the replay's controller, and the game the feed was read into. */
export type FeedReplay = KyogijoReplay & { feed: FeedGame };

/** What a live follow can be told, beyond `FeedReplayOptions`. */
export interface ReplayFollowOptions extends FeedReplayOptions {
  /** Seconds between asks: 15 by default, never less than 10. */
  every?: number;
  /** Each new answer, after it is played. */
  onGame?: (game: FeedGame, replay: KyogijoReplay) => void;
  onError?: (error: FeedError) => void;
  onState?: (state: FeedFollowState) => void;
  /** The document whose visibility it follows: the page's by default. */
  doc?: Document;
}

/** A replay that follows a feed live: the replay playing now (a new one on each answer that changed), the follow's state, and `stop`, which stops asking and leaves the replay. */
export interface ReplayFollow {
  replay(): KyogijoReplay | undefined;
  state(): FeedFollowState;
  stop(): void;
}

/** A mount's or a view's `replay`: play a timeline, or a feed from an address. */
export interface ReplayCall {
  (timeline: ReplayTimeline, settings?: ReplaySettings): KyogijoReplay;
  /**
   * Fetch a feed from an address, by the reader's browser (no server of ours, no cookie, nothing kept), read it (`readFeed`: kyogijo's open timeline, or an NHL-style play-by-play) and play it. Rejects with a
   * `FeedError` that says what was wrong: a server that does not let the page read it (`cors`), a status (`http`), an answer that is not a feed (`format`).
   */
  fromUrl(url: string, options?: FeedReplayOptions): Promise<FeedReplay>;
  /** Follow a feed live: ask it every 15 seconds or more while the page is shown, play each answer that changed from where the replay was (or at its newest moment, when it was there), and stop when the game is over or the server says no. */
  follow(url: string, options?: ReplayFollowOptions): ReplayFollow;
}

/** What `feeds.dom.ts` lends a `replay`. */
export interface FeedKit {
  fromUrl(play: (timeline: ReplayTimeline, settings?: ReplaySettings) => KyogijoReplay, url: string, options?: FeedReplayOptions): Promise<FeedReplay>;
  follow(play: (timeline: ReplayTimeline, settings?: ReplaySettings) => KyogijoReplay, url: string, options?: ReplayFollowOptions): ReplayFollow;
}

let kit: FeedKit | undefined;

/** Put the feeds' code in: called once by `feeds.dom.ts`. */
export function useFeedKit(next: FeedKit): void {
  kit = next;
}

const need = (): FeedKit => {
  if (kit === undefined) throw new Error("the feeds are not loaded: import \"@johnmorrisdotca/kyogijo-stadiums/feeds\" once, before replay.fromUrl or replay.follow");
  return kit;
};

/** A `replay` with `fromUrl` and `follow` on it. */
export function withFeeds(play: (timeline: ReplayTimeline, settings?: ReplaySettings) => KyogijoReplay): ReplayCall {
  return Object.assign(play, {
    fromUrl: (url: string, options?: FeedReplayOptions) => need().fromUrl(play, url, options),
    follow: (url: string, options?: ReplayFollowOptions) => need().follow(play, url, options),
  });
}
