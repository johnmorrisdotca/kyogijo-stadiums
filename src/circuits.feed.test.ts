// A race from a feed: the open race timeline read strictly, turned into a race that plays like a simulated one (on every circuit, every dot on the road), location samples laid on the circuit's line, the OpenF1-style
// adapter, and a feed read from an address and followed, all on made-up stubs: no test makes a real request.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CIRCUIT_IDS,
  FOLLOW_EVERY,
  RaceFeedError,
  feedFromText,
  followRaceFeed,
  loadRaceFeed,
  openF1Feed,
  openF1Siblings,
  raceAt,
  raceBoard,
  raceFromFeed,
  racePoint,
  raceToFeed,
  readRaceFeed,
  simulateRace,
  type RaceFeed,
} from "./circuits-entry.ts";
import { nearestOn } from "./circuits.geo.ts";

/** A made-up feed: two cars, three laps, a pit stop. */
const STUB: RaceFeed = {
  kind: "kyogijo-race",
  version: 1,
  circuit: "las-vegas",
  laps: 3,
  cars: [{ id: "a", code: "AAA", name: "Made-up A", team: "Made-up Team", colour: "#3366cc" }, { id: "b", code: "BBB", name: "<b>B</b>" }],
  crossings: [
    { car: "a", lap: 1, t: 100 },
    { car: "b", lap: 1, t: 101 },
    { car: "a", lap: 2, t: 197 },
    { car: "b", lap: 2, t: 220 },
    { car: "a", lap: 3, t: 294 },
    { car: "b", lap: 3, t: 318 },
  ],
  pits: [{ car: "b", in: 195, out: 218, stop: 2.4 }],
};

const onRoad = (race: ReturnType<typeof raceFromFeed>): void => {
  for (let t = 0; t <= race.duration; t += 3) {
    for (let c = 0; c < race.cars.length; c += 1) {
      const at = racePoint(race, c, t);
      expect(Math.min(nearestOn(race.plan.lap, at, true).d, nearestOn(race.plan.pitLane, at, false).d), `${race.cars[c].id} at ${t}`).toBeLessThan(1);
    }
  }
};

describe("reading a feed", () => {
  it("takes the open race timeline and refuses anything else, in words", () => {
    expect(readRaceFeed(STUB).ok).toBe(true);
    expect(readRaceFeed([])).toEqual({ ok: false, error: "A race feed is a JSON object." });
    expect(readRaceFeed({ kind: "kyogijo-game" }).ok).toBe(false);
    expect(readRaceFeed({ ...STUB, version: 2 }).ok).toBe(false);
    expect(readRaceFeed({ ...STUB, cars: [] }).ok).toBe(false);
    expect(readRaceFeed({ ...STUB, cars: [{ id: "a" }, { id: "a" }] }).ok).toBe(false);
    expect(readRaceFeed({ ...STUB, crossings: [] }).ok).toBe(false);
    expect(readRaceFeed({ ...STUB, crossings: "no" }).ok).toBe(false);
    expect(readRaceFeed({ ...STUB, cars: Array.from({ length: 41 }, (_, i) => ({ id: `c${i}` })) }).ok).toBe(false);
  });

  it("leaves behind what the format does not name, and rows of cars it does not have", () => {
    const read = readRaceFeed({ ...STUB, extra: "x", cars: [{ id: "a", colour: "red", secret: 1 }], crossings: [{ car: "a", lap: 1, t: 90 }, { car: "z", lap: 1, t: 91 }, { car: "a", lap: "2", t: 180 }] });
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.feed).not.toHaveProperty("extra");
    expect(read.feed.cars).toEqual([{ id: "a" }]);
    expect(read.feed.crossings).toEqual([{ car: "a", lap: 1, t: 90 }]);
  });

  it("reads pasted text: the open timeline, OpenF1-style lap rows, and says why not", () => {
    expect(feedFromText(JSON.stringify(STUB)).ok).toBe(true);
    expect(feedFromText('[{"driver_number":7,"lap_number":1,"date_start":"2030-01-01T20:00:00Z","lap_duration":100}]').ok).toBe(true);
    expect(feedFromText("{")).toEqual({ ok: false, error: "This is not JSON." });
  });
});

describe("a race from a feed", () => {
  it("plays the feed's laps: the order, the gaps, the stop and the flag", () => {
    const race = raceFromFeed(STUB);
    expect(race.laps).toBe(3);
    expect(race.crossings).toEqual([[100, 197, 294], [101, 220, 318]]);
    const end = raceAt(race, race.duration);
    expect(end.flag).toBe(true);
    expect(end.standings.map((s) => s.car.driver.code)).toEqual(["AAA", "BBB"]);
    expect(end.standings[1].gap).toBe(24);
    expect(end.standings[1].stops).toBe(1);
    expect(raceAt(race, 205).standings.find((s) => s.car.id === "b")?.status).toBe("pit");
    onRoad(race);
  });

  it("writes the feed's names as text, never markup", () => {
    const table = raceBoard(raceAt(raceFromFeed(STUB), 300));
    expect(table).toContain("&lt;b&gt;B&lt;/b&gt;");
    expect(table).not.toContain("<b>B</b>");
  });

  it("gives back a simulated race written as a feed: the same laps, the same order", () => {
    const sim = simulateRace({ circuit: "las-vegas", laps: 6, cars: 8, seed: 9 });
    const race = raceFromFeed(raceToFeed(sim));
    race.crossings.forEach((cr, c) => cr.forEach((t, k) => expect(t).toBeCloseTo(sim.crossings[sim.cars.findIndex((x) => x.id === race.cars[c].id)][k], 2)));
    expect(raceAt(race, race.duration).standings.map((s) => s.car.id)).toEqual(raceAt(sim, sim.duration).standings.filter((s) => s.status !== "out").map((s) => s.car.id).concat(raceAt(sim, sim.duration).standings.filter((s) => s.status === "out").map((s) => s.car.id)));
  });

  for (const id of CIRCUIT_IDS) {
    it(`${id}: keeps a feed's every dot on the road or in the pit lane`, () => onRoad(raceFromFeed({ ...STUB, circuit: id })));
  }

  it("lays location samples on the circuit's own line by how far round the lap they are", () => {
    // Made-up samples: a circle in the feed's own frame (another size, another way up), the car going round it once every 100 seconds.
    const positions = Array.from({ length: 300 }, (_, i) => {
      const t = i;
      const a = (2 * Math.PI * (t % 100)) / 100;
      return { car: "a", t, x: 5000 + 900 * Math.cos(a), y: -300 + 900 * Math.sin(a) };
    });
    const feed: RaceFeed = { kind: "kyogijo-race", version: 1, cars: [{ id: "a" }], crossings: [{ car: "a", lap: 1, t: 100 }, { car: "a", lap: 2, t: 200 }, { car: "a", lap: 3, t: 300 }], positions };
    const race = raceFromFeed(feed, "las-vegas");
    // Half way round the circle in time is half way round the lap in distance, whatever the lap's speeds.
    const half = race.distance[0][150] - race.distance[0][100];
    expect(half / race.lapLength).toBeGreaterThan(0.45);
    expect(half / race.lapLength).toBeLessThan(0.55);
    for (let j = 1; j < race.distance[0].length; j += 1) expect(race.distance[0][j]).toBeGreaterThanOrEqual(race.distance[0][j - 1]);
    onRoad(race);
  });

  it("goes on round, at its last lap's pace, while a live race has no newer lap", () => {
    const race = raceFromFeed({ ...STUB, live: true });
    expect(race.flag).toBeGreaterThan(race.duration);
    expect(raceAt(race, race.duration).flag).toBe(false);
  });
});

describe("the OpenF1-style adapter", () => {
  const laps = [
    { driver_number: 81, lap_number: 1, date_start: "2030-05-01T20:00:00Z", lap_duration: 100 },
    { driver_number: 81, lap_number: 2, date_start: "2030-05-01T20:01:40Z", lap_duration: 95.5 },
    { driver_number: 9, lap_number: 1, date_start: "2030-05-01T20:00:00.5Z", lap_duration: 101 },
    { driver_number: 9, lap_number: 2, date_start: "2030-05-01T20:01:41.5Z", lap_duration: null },
    { driver_number: 9, lap_number: 3, date_start: "2030-05-01T20:03:20Z", lap_duration: 97 },
  ];
  it("makes the crossings from each lap's start and duration, or from the next lap's start", () => {
    const feed = openF1Feed({ laps, drivers: [{ driver_number: 9, name_acronym: "NIN", last_name: "Madeup", team_name: "Invented", team_colour: "AA2200" }], pit: [{ driver_number: 81, date: "2030-05-01T20:03:10Z", lane_duration: 21, stop_duration: 2.5 }] });
    expect(feed.crossings.filter((c) => c.car === "9").map((c) => c.t)).toEqual([101.5, 200, 297]);
    expect(feed.crossings.filter((c) => c.car === "81").map((c) => c.t)).toEqual([100, 195.5]);
    expect(feed.cars.find((c) => c.id === "9")).toEqual({ id: "9", code: "NIN", name: "Madeup", team: "Invented", colour: "#aa2200" });
    expect(feed.cars.find((c) => c.id === "81")?.code).toBe("81");
    expect(feed.pits).toEqual([{ car: "81", in: 190, out: 211, stop: 2.5 }]);
    expect(readRaceFeed(feed).ok).toBe(true);
  });

  it("finds the same source's pit and driver lists for a lap address", () => {
    expect(openF1Siblings(new URL("https://api.example.test/v1/laps?session_key=123&driver_number=4"))).toEqual({ pit: "https://api.example.test/v1/pit?session_key=123", drivers: "https://api.example.test/v1/drivers?session_key=123" });
    expect(openF1Siblings(new URL("https://api.example.test/v1/sessions?year=2030"))).toBeUndefined();
  });
});

/** A made-up source: answers by address, and remembers what it was asked. */
function source(answers: Record<string, () => Response | Promise<Response>>) {
  const asked: string[] = [];
  const fetcher = async (url: string): Promise<Response> => {
    asked.push(url);
    const answer = answers[url];
    if (answer === undefined) return new Response("", { status: 404 });
    return answer();
  };
  return { fetcher, asked };
}
const json = (value: unknown): Response => new Response(JSON.stringify(value), { status: 200 });

describe("a feed from an address", () => {
  it("reads the open timeline, and an OpenF1-style lap list with its pit stops and drivers from the same source", async () => {
    const a = source({ "https://feed.example.test/race.json": () => json(STUB) });
    expect((await loadRaceFeed("https://feed.example.test/race.json", { fetch: a.fetcher })).cars).toHaveLength(2);
    const lapUrl = "https://api.example.test/v1/laps?session_key=55";
    const b = source({
      [lapUrl]: () => json([{ driver_number: 3, lap_number: 1, date_start: "2030-01-01T00:00:00Z", lap_duration: 99 }]),
      "https://api.example.test/v1/pit?session_key=55": () => json([]),
      "https://api.example.test/v1/drivers?session_key=55": () => json([{ driver_number: 3, name_acronym: "THR" }]),
    });
    const feed = await loadRaceFeed(lapUrl, { fetch: b.fetcher });
    expect(feed.cars[0].code).toBe("THR");
    expect(b.asked).toEqual([lapUrl, "https://api.example.test/v1/pit?session_key=55", "https://api.example.test/v1/drivers?session_key=55"]);
  });

  it("says what went wrong in words: not an address, a source that will not let a page read it, a refusal, too many requests, not JSON, not a feed", async () => {
    const fail = async (address: string, answer: () => Response | Promise<Response>): Promise<RaceFeedError> => {
      try {
        await loadRaceFeed(address, { fetch: source({ [address]: answer }).fetcher });
      } catch (error) {
        return error as RaceFeedError;
      }
      throw new Error("no error");
    };
    expect((await fail("ftp://x.example.test/a", () => json(STUB))).kind).toBe("address");
    const blocked = await fail("https://x.example.test/a", () => Promise.reject(new TypeError("Failed to fetch")));
    expect([blocked.kind, blocked.message]).toEqual(["blocked", expect.stringContaining("CORS")]);
    expect((await fail("https://x.example.test/a", () => new Response("", { status: 403 }))).kind).toBe("refused");
    expect((await fail("https://x.example.test/a", () => new Response("", { status: 429 }))).kind).toBe("busy");
    expect((await fail("https://x.example.test/a", () => new Response("<html>", { status: 200 }))).kind).toBe("json");
    expect((await fail("https://x.example.test/a", () => json({ kind: "other" }))).kind).toBe("format");
  });
});

describe("following a race", () => {
  afterEach(() => vi.useRealTimers());
  const page = (): { doc: Document; hide(hidden: boolean): void } => {
    let state = "visible";
    const target = new EventTarget();
    Object.defineProperty(target, "visibilityState", { get: () => state });
    const doc = target as unknown as Document;
    return { doc, hide: (hidden) => { state = hidden ? "hidden" : "visible"; target.dispatchEvent(new Event("visibilitychange")); } };
  };

  it("asks every 15 seconds, never while the page is hidden, and stops when the race is over", async () => {
    vi.useFakeTimers();
    const live = { ...STUB, live: true };
    let over = false;
    const a = source({ "https://x.example.test/live": () => json(over ? STUB : live) });
    const { doc, hide } = page();
    const seen: RaceFeed[] = [];
    const stops: string[] = [];
    const follow = followRaceFeed("https://x.example.test/live", (f) => seen.push(f), { fetch: a.fetcher, doc, onStop: (why) => stops.push(why) });
    await vi.advanceTimersByTimeAsync(0);
    expect(a.asked).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(14_000);
    expect(a.asked).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(a.asked).toHaveLength(2);
    hide(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(a.asked).toHaveLength(2);
    hide(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(a.asked).toHaveLength(3);
    over = true;
    await vi.advanceTimersByTimeAsync(15_000);
    expect(stops).toEqual(["over"]);
    expect(follow.following).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(a.asked).toHaveLength(4);
    expect(seen).toHaveLength(4);
  });

  it("never asks faster than every 10 seconds, waits longer after a failure, and stops on 429", async () => {
    vi.useFakeTimers();
    let status = 500;
    const a = source({ "https://x.example.test/live": () => (status === 200 ? json({ ...STUB, live: true }) : new Response("", { status })) });
    const stops: string[] = [];
    followRaceFeed("https://x.example.test/live", () => undefined, { fetch: a.fetcher, doc: page().doc, every: 1000, onStop: (why) => stops.push(why) });
    await vi.advanceTimersByTimeAsync(0);
    expect(FOLLOW_EVERY.least).toBe(10_000);
    // A failure: the next ask waits twice the 10 seconds.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(a.asked).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(a.asked).toHaveLength(2);
    status = 429;
    await vi.advanceTimersByTimeAsync(40_000);
    expect(a.asked).toHaveLength(3);
    expect(stops).toEqual(["refused"]);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(a.asked).toHaveLength(3);
  });
});
