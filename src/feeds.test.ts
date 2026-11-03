// Feeds read into a replay: kyogijo's open timeline and an NHL-style play-by-play, every value checked; the fetch by the reader's browser and a live follow. Every answer here is made up: no test makes a request.
import { afterEach, describe, expect, it, vi } from "vitest";

import { FEED_LIMITS, FeedError } from "./feeds.core.ts";
import { feedAddress, fetchFeedText, loadFeed } from "./feeds.fetch.ts";
import { NHL_OVERTIME, NHL_PERIOD, nhlPlayByPlay } from "./feeds.nhl.ts";
import { feedFormatOf, kyogijoFeed, readFeed, readFeedText } from "./feeds.ts";
import "./feeds.dom.ts";
import { withFeeds } from "./replay.feed.ts";
import { replayBoard } from "./replay.board.ts";
import type { KyogijoReplay } from "./mount.ts";
import type { ReplaySettings, ReplayTimeline } from "./replay.types.ts";

/** A made-up NHL-style play-by-play: two invented sides, a few plays of each period. */
function stubPlayByPlay(over: Record<string, unknown> = {}) {
  const play = (number: number, time: string, type: string, details: Record<string, unknown> = {}, sortOrder = 0, periodType = number > 3 ? "OT" : "REG") => ({ periodDescriptor: { number, periodType }, timeInPeriod: time, typeDescKey: type, sortOrder, details });
  return {
    gameState: "LIVE",
    gameType: 2,
    homeTeam: { id: 101, abbrev: "MTH", commonName: { default: "Moths" }, placeName: { default: "Lakeside" } },
    awayTeam: { id: 202, abbrev: "OWL", commonName: { default: "Owls" } },
    rosterSpots: [
      { teamId: 101, playerId: 7, sweaterNumber: 17, firstName: { default: "Ada" }, lastName: { default: "Example" } },
      { teamId: 202, playerId: 8, sweaterNumber: 8, firstName: { default: "Ben" }, lastName: { default: "Sample" } },
      { teamId: 999, playerId: 9, sweaterNumber: 99, firstName: { default: "Nobody" } },
    ],
    plays: [
      play(1, "00:00", "period-start", {}, 1),
      play(1, "00:00", "faceoff", { xCoord: 0, yCoord: 0 }, 2),
      play(1, "01:30", "shot-on-goal", { xCoord: 70, yCoord: -10, eventOwnerTeamId: 101, shootingPlayerId: 7 }, 4),
      // Out of order in the list: the sort order says it came first.
      play(1, "01:00", "hit", { xCoord: 30, yCoord: 40 }, 3),
      play(1, "02:10", "goal", { xCoord: 82, yCoord: 3, eventOwnerTeamId: 101, scoringPlayerId: 7 }, 5),
      play(1, "05:00", "stoppage", {}, 6),
      play(2, "03:00", "goal", { xCoord: -500, yCoord: 99, eventOwnerTeamId: 202, scoringPlayerId: 8 }, 7),
      play(3, "19:59", "missed-shot", { xCoord: -60, yCoord: 5, eventOwnerTeamId: 202 }, 8),
      play(4, "02:00", "goal", { xCoord: 80, yCoord: 0, eventOwnerTeamId: 101, scoringPlayerId: 7 }, 9),
      play(5, "00:00", "goal", { xCoord: 80, yCoord: 0, eventOwnerTeamId: 202 }, 10, "SO"),
    ],
    ...over,
  };
}

describe("kyogijo's own open timeline", () => {
  it("reads a bare timeline as it is", () => {
    const bare = readFeed({ from: "nhl-api", frames: [{ t: 0, objects: [{ id: "puck", team: "puck", x: 0, y: 0 }] }], events: [{ t: 0, kind: "whistle" }] });
    expect(bare.format).toBe("kyogijo");
    expect(bare.timeline).toEqual({ from: "nhl-api", frames: [{ t: 0, objects: [{ id: "puck", team: "puck", x: 0, y: 0 }] }], events: [{ t: 0, kind: "whistle" }] });
  });

  it("leaves out what is not of the format, and keeps text only as text", () => {
    const game = kyogijoFeed({
      from: "not a frame name!",
      frames: [
        { t: 0, objects: [{ id: "a", team: "home", x: 1, y: 2, label: "\u0000<b>Ana</b>\u0007", number: "<99999>" }, { id: "b", team: "nobody", x: 1, y: 1 }, { id: "c", team: "away", x: "1", y: 2 }, null] },
        { t: "soon", objects: [] },
        "frame",
      ],
      events: [{ t: 1, kind: "goal", team: "home", points: 2, by: { evil: true } }, { t: "x", kind: "goal" }, { t: 2 }],
      periods: [{ number: 1, start: 0, end: 10, length: "long" }, { number: 2, start: 10, end: 5 }, { start: 10, end: 20, length: 1200 }],
      clock: "sideways",
      teams: { home: { abbr: "AB<C>", color: "javascript:alert(1)" } },
    });
    expect(game.timeline.from).toBeUndefined();
    expect(game.timeline.frames).toEqual([{ t: 0, objects: [{ id: "a", team: "home", x: 1, y: 2, label: "<b>Ana</b>", number: "<999" }] }]);
    expect(game.timeline.events).toEqual([{ t: 1, kind: "goal", team: "home" }]);
    expect(game.timeline.periods).toEqual([{ number: 1, start: 0, end: 10 }, { start: 10, end: 20, length: 1200 }]);
    expect(game.timeline.clock).toBeUndefined();
    expect(game.teams).toEqual({ home: { abbr: "AB<C>" }, away: {} });
  });

  it("caps every list, so that a hostile answer cannot hold the page", () => {
    const frames = Array.from({ length: 3 }, (_, t) => ({ t, objects: Array.from({ length: FEED_LIMITS.objects + 10 }, (_, i) => ({ id: `p${i}`, team: "home", x: i, y: 0 })) }));
    expect(kyogijoFeed({ frames }).timeline.frames[0].objects).toHaveLength(FEED_LIMITS.objects);
  });

  it("says what was wrong in plain words", () => {
    const kind = (fn: () => unknown): string | undefined => {
      try {
        fn();
      } catch (error) {
        return error instanceof FeedError ? error.kind : "other";
      }
      return undefined;
    };
    expect(kind(() => readFeed([]))).toBe("format");
    expect(kind(() => readFeed({ frames: [] }))).toBe("empty");
    expect(kind(() => readFeed({ hello: 1 }))).toBe("format");
    expect(kind(() => readFeedText("{not json"))).toBe("format");
    expect(kind(() => readFeed({ frames: [] }, "nhl"))).toBe("format");
  });

  it("tells the formats apart", () => {
    expect(feedFormatOf({ kind: "kyogijo-game", timeline: {} })).toBe("kyogijo");
    expect(feedFormatOf({ frames: [] })).toBe("kyogijo");
    expect(feedFormatOf(stubPlayByPlay())).toBe("nhl");
    expect(feedFormatOf({ plays: [] })).toBeUndefined();
    expect(feedFormatOf("text")).toBeUndefined();
  });
});

describe("an NHL-style play-by-play", () => {
  const game = nhlPlayByPlay(stubPlayByPlay());

  it("puts each play on the game's clock: twenty minutes a period, five of overtime in the regular season, the shoot-out left out", () => {
    expect(game.timeline.periods).toEqual([
      { number: 1, start: 0, end: NHL_PERIOD },
      { number: 2, start: NHL_PERIOD, end: 2 * NHL_PERIOD },
      { number: 3, start: 2 * NHL_PERIOD, end: 3 * NHL_PERIOD },
      { number: 4, start: 3 * NHL_PERIOD, end: 3 * NHL_PERIOD + NHL_OVERTIME },
    ]);
    expect(game.timeline.events?.map((e) => `${e.t} ${e.kind} ${e.team ?? ""}`)).toEqual(["90 shot home", "130 goal home", "300 whistle ", "1380 goal away", "3599 shot away", "3720 goal home"]);
    // In the playoffs an overtime is twenty minutes.
    expect(nhlPlayByPlay(stubPlayByPlay({ gameType: 3 })).timeline.periods?.[3]).toMatchObject({ end: 3 * NHL_PERIOD + NHL_PERIOD });
  });

  it("moves the puck through the plays in their order, held to the rink, from centre ice at a period's start", () => {
    const at = game.timeline.frames.map((f) => [f.t, f.objects[0].x, f.objects[0].y]);
    expect(at.slice(0, 4)).toEqual([[0, 0, 0], [60, 30, 40], [90, 70, -10], [130, 82, 3]]);
    expect(at).toContainEqual([1380, -100, 42.5]);
    expect(game.timeline.from).toBe("nhl-api");
  });

  it("names the sides and the players from the feed, at run time, and counts the score from its goals", () => {
    expect(game.teams).toEqual({ home: { abbr: "MTH", name: "Moths" }, away: { abbr: "OWL", name: "Owls" } });
    expect(game.players).toEqual({ p7: { side: "home", number: 17, name: "Ada Example" }, p8: { side: "away", number: 8, name: "Ben Sample" } });
    expect(game.timeline.events?.find((e) => e.kind === "goal")?.by).toBe("p7");
    expect(replayBoard(game.timeline, 4000).score).toEqual([2, 1]);
    // The board's clock is the game's: ten minutes left in the third period, and four in the overtime.
    expect(replayBoard(game.timeline, 3000)).toEqual({ score: [1, 1], period: 3, clock: "10:00" });
    expect(replayBoard(game.timeline, 3660)).toEqual({ score: [1, 1], period: 4, clock: "4:00" });
  });

  it("is over when the feed says so, and not while it is live", () => {
    expect(game.ended).toBe(false);
    expect(nhlPlayByPlay(stubPlayByPlay({ gameState: "OFF" })).ended).toBe(true);
    expect(nhlPlayByPlay(stubPlayByPlay({ gameState: "FINAL" })).ended).toBe(true);
  });

  it("is an error with no play that has a place, and for an answer of another shape", () => {
    expect(() => nhlPlayByPlay(stubPlayByPlay({ plays: [] }))).toThrow(FeedError);
    expect(() => nhlPlayByPlay({ games: [] })).toThrow(/no list of plays/);
  });
});

/** A made-up answer. */
const answer = (body: string, status = 200, headers: Record<string, string> = {}) => new Response(body, { status, headers });

describe("a feed fetched by the reader's browser", () => {
  it("asks with no cookie, no referrer and no cache, and reads the answer", async () => {
    const asked: [string, RequestInit | undefined][] = [];
    const game = await loadFeed("https://feeds.example/game.json", { fetch: async (url, init) => (asked.push([url, init]), answer(JSON.stringify(stubPlayByPlay()))) });
    expect(game.format).toBe("nhl");
    expect(asked[0][0]).toBe("https://feeds.example/game.json");
    expect(asked[0][1]).toMatchObject({ credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", mode: "cors" });
  });

  it("reads only http and https addresses, a relative one against the page's, and never one with a login", () => {
    expect(feedAddress("examples/games/canada-japan.json", "https://site.example/kyogijo/").href).toBe("https://site.example/kyogijo/examples/games/canada-japan.json");
    for (const bad of ["javascript:alert(1)", "file:///etc/passwd", "data:application/json,{}", "https://user:secret@feeds.example/x", "not an address"]) expect(() => feedAddress(bad, bad === "not an address" ? undefined : "https://site.example/"), bad).toThrow(FeedError);
  });

  it("says why it could not: a refusal of the browser (CORS), a status, an answer too large", async () => {
    const reason = (fetcher: () => Promise<Response>, most?: number) => fetchFeedText("https://feeds.example/x", { fetch: fetcher, most }).then(() => "read", (error: FeedError) => `${error.kind} ${error.status ?? ""}`.trim());
    expect(await reason(async () => Promise.reject(new TypeError("Failed to fetch")))).toBe("cors");
    expect(await reason(async () => answer("", 429))).toBe("http 429");
    expect(await reason(async () => answer("", 404))).toBe("http 404");
    expect(await reason(async () => answer("12345", 200, { "content-length": "999999" }), 1000)).toBe("too-large");
    expect(await reason(async () => answer("123456789", 200), 4)).toBe("too-large");
    expect(await reason(async () => answer("{}"))).toBe("read");
  });
});

describe("a replay's fromUrl", () => {
  afterEach(() => vi.useRealTimers());
  /** A replay that only remembers what it was given. */
  const fakePlay = () => {
    const made: { timeline: ReplayTimeline; settings: ReplaySettings | undefined; destroyed: boolean }[] = [];
    const play = (timeline: ReplayTimeline, settings?: ReplaySettings): KyogijoReplay => {
      const one = { timeline, settings, destroyed: false };
      made.push(one);
      const end = timeline.frames.at(-1)!.t;
      return { state: () => ({ t: end, start: 0, end, playing: false, ended: false, speed: 1, loop: false, motion: "smooth" }), destroy: () => void (one.destroyed = true) } as unknown as KyogijoReplay;
    };
    return { made, replay: withFeeds(play) };
  };

  it("plays a feed from an address, with the game it was read into", async () => {
    const { made, replay } = fakePlay();
    const played = await replay.fromUrl("https://feeds.example/pbp", { fetch: async () => answer(JSON.stringify(stubPlayByPlay())), settings: { speed: 2 } });
    expect(played.feed.format).toBe("nhl");
    expect(made).toHaveLength(1);
    expect(made[0].settings).toEqual({ speed: 2 });
    await expect(replay.fromUrl("ftp://feeds.example/x")).rejects.toThrow(FeedError);
  });
});
