// Feeds: a game from a file or pasted text, read into a replay. kyogijo's own open timeline, and adapters (pure functions) for common play-by-play shapes.
export { FEED_FORMATS, FEED_LIMITS, FeedError, feedFormatOf, feedText, kyogijoFeed, readFeed, readFeedText } from "./feeds.ts";
export type { FeedFormat, FeedGame, FeedPlayer, FeedSide } from "./feeds.ts";
export { NHL_OVERTIME, NHL_PERIOD, nhlPlayByPlay } from "./feeds.nhl.ts";
