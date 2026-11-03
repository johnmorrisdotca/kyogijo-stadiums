// A feed played on a mount or a 3D view: `replay.fromUrl` fetches it once and plays it, `replay.follow` follows it live and plays each answer that changed, from where the reader was. Loaded by the `/feeds` entry, it
// puts its code into every `replay` (`replay.feed.ts`).
import { followFeed, loadFeed } from "./feeds.fetch.ts";
import type { KyogijoReplay } from "./mount.ts";
import { useFeedKit, type FeedKit, type ReplayFollow } from "./replay.feed.ts";

const kit: FeedKit = {
  async fromUrl(play, url, options = {}) {
    const feed = await loadFeed(url, options);
    return Object.assign(play(feed.timeline, options.settings), { feed });
  },
  follow(play, url, options = {}): ReplayFollow {
    let replay: KyogijoReplay | undefined;
    const follow = followFeed(url, {
      ...options,
      onGame(game) {
        // From where the reader was; at the newest moment when it was there (or when it is the first answer).
        const at = replay?.state();
        const edge = at === undefined || at.t >= at.end - 0.5;
        replay?.destroy();
        replay = play(game.timeline, { ...options.settings, ...(edge ? { start: Number.MAX_SAFE_INTEGER } : { start: at.t - at.start, speed: at.speed }) });
        if (at?.playing === true && !edge) replay.play();
        options.onGame?.(game, replay);
      },
      onError: options.onError,
      onState: options.onState,
    });
    return {
      replay: () => replay,
      state: follow.state,
      stop: follow.stop,
    };
  },
};

useFeedKit(kit);
