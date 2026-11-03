// The `replay` of a mount and of a 3D view, with a way to play a feed from an address the reader gives: `replay.fromUrl(url, options)`. Its code is
// in `feeds.dom.ts`, which the `/feeds` entry loads: a page that never plays a feed carries none of it, and one that does imports `/feeds` once.
import type { FeedFormat, FeedGame } from "./feeds.core.ts";
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

/** A mount's or a view's `replay`: play a timeline, or a feed from an address. */
export interface ReplayCall {
  (timeline: ReplayTimeline, settings?: ReplaySettings): KyogijoReplay;
  /**
   * Fetch a feed from an address, by the reader's browser (no server of ours, no cookie, nothing kept), read it (`readFeed`: kyogijo's open timeline, or an NHL-style play-by-play) and play it. Rejects with a
   * `FeedError` that says what was wrong: a server that does not let the page read it (`cors`), a status (`http`), an answer that is not a feed (`format`).
   */
  fromUrl(url: string, options?: FeedReplayOptions): Promise<FeedReplay>;
}

/** What `feeds.dom.ts` lends a `replay`. */
export interface FeedKit {
  fromUrl(play: (timeline: ReplayTimeline, settings?: ReplaySettings) => KyogijoReplay, url: string, options?: FeedReplayOptions): Promise<FeedReplay>;
}

let kit: FeedKit | undefined;

/** Put the feeds' code in: called once by `feeds.dom.ts`. */
export function useFeedKit(next: FeedKit): void {
  kit = next;
}

const need = (): FeedKit => {
  if (kit === undefined) throw new Error("the feeds are not loaded: import \"@johnmorrisdotca/kyogijo-stadiums/feeds\" once, before replay.fromUrl");
  return kit;
};

/** A `replay` with `fromUrl` on it. */
export function withFeeds(play: (timeline: ReplayTimeline, settings?: ReplaySettings) => KyogijoReplay): ReplayCall {
  return Object.assign(play, {
    fromUrl: (url: string, options?: FeedReplayOptions) => need().fromUrl(play, url, options),
  });
}
