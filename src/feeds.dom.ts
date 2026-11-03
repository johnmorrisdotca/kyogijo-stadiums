// A feed played on a mount or a 3D view: `replay.fromUrl` fetches it once and plays it. Loaded by the `/feeds` entry, it
// puts its code into every `replay` (`replay.feed.ts`).
import { loadFeed } from "./feeds.fetch.ts";
import { useFeedKit, type FeedKit } from "./replay.feed.ts";

const kit: FeedKit = {
  async fromUrl(play, url, options = {}) {
    const feed = await loadFeed(url, options);
    return Object.assign(play(feed.timeline, options.settings), { feed });
  },
};

useFeedKit(kit);
