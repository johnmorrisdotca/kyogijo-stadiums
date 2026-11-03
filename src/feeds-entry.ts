// Feeds: a game from a file, pasted text or an address the reader gives, read into a replay. kyogijo's own open timeline, and adapters (pure functions) for common play-by-play shapes; the fetch is the reader's browser's,
// Loading this entry also gives every mount's and 3D view's `replay` its `fromUrl`.
import "./feeds.dom.ts";
export { FEED_FORMATS, FEED_LIMITS, FeedError, feedFormatOf, feedText, kyogijoFeed, readFeed, readFeedText } from "./feeds.ts";
export type { FeedFormat, FeedGame, FeedPlayer, FeedSide } from "./feeds.ts";
export { NHL_OVERTIME, NHL_PERIOD, nhlPlayByPlay } from "./feeds.nhl.ts";
export { FEED_MOST, feedAddress, fetchFeedText, loadFeed } from "./feeds.fetch.ts";
export type { FeedFetchOptions } from "./feeds.fetch.ts";
export type { FeedReplay, FeedReplayOptions, ReplayCall } from "./replay.feed.ts";
