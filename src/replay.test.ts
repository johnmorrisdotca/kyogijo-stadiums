import { describe, expect, it } from "vitest";
import { replayPlay } from "../demo/replay-data.js";
import { drawKyogijo } from "./draw.ts";
import { REPLAY_SPEEDS, activeEvents, createReplay, describeEvent, drawFrame, eventsBetween, interpolate, possession, replayClock, replayInfo, replayLayers, replaySnapshot, replaySummary, replayTable, trails } from "./replay-entry.ts";
import { replayGroups } from "./replay.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import type { ReplayFrame, ReplayObject, ReplayTimeline } from "./replay-entry.ts";

const obj = (id: string, team: ReplayObject["team"], x: number, y: number, extra: Partial<ReplayObject> = {}): ReplayObject => ({ id, team, x, y, ...extra });

/** A ball moving along x at 10 per second, a home player standing still and an away player that leaves after 2 seconds. */
function simple(): ReplayTimeline {
  const frames: ReplayFrame[] = [0, 1, 2, 3, 4].map((t) => ({
    t,
    objects: [obj("ball", "ball", t * 10, 20), obj("h1", "home", 50, 20, { number: 9, label: "Rivera" }), ...(t <= 2 ? [obj("a1", "away", 60, 30 - t)] : [])],
  }));
  return { frames, events: [{ t: 1, kind: "pass", team: "home", by: "h1", x2: 30, y2: 20 }, { t: 3, kind: "goal", team: "home" }] };
}

describe("interpolate", () => {
  it("moves an object in a straight line between two frames", () => {
    const [ball] = interpolate(simple(), 1.25);
    expect(ball).toMatchObject({ id: "ball", x: 12.5, y: 20 });
  });

  it("gives the frame itself on a frame's time, and holds the first and last moments beyond the data", () => {
    const timeline = simple();
    expect(interpolate(timeline, 2).find((o) => o.id === "ball")?.x).toBe(20);
    expect(interpolate(timeline, -5).find((o) => o.id === "ball")?.x).toBe(0);
    expect(interpolate(timeline, 99).find((o) => o.id === "ball")?.x).toBe(40);
    expect(interpolate(timeline, Number.NaN).find((o) => o.id === "ball")?.x).toBe(0);
  });

  it("keeps an object that leaves where it was until the next frame, and shows one that comes only when its frame does", () => {
    const timeline = simple();
    expect(interpolate(timeline, 2.5).map((o) => o.id)).toEqual(["ball", "h1", "a1"]);
    expect(interpolate(timeline, 2.5).find((o) => o.id === "a1")?.y).toBe(28);
    expect(interpolate(timeline, 3).map((o) => o.id)).toEqual(["ball", "h1"]);
    const late: ReplayTimeline = { frames: [{ t: 0, objects: [obj("a", "home", 0, 0)] }, { t: 2, objects: [obj("a", "home", 4, 0), obj("b", "away", 9, 9)] }] };
    expect(interpolate(late, 1).map((o) => o.id)).toEqual(["a"]);
    expect(interpolate(late, 2).map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("keeps the order of first appearance, whatever order a frame lists its objects in", () => {
    const timeline: ReplayTimeline = { frames: [{ t: 0, objects: [obj("a", "home", 0, 0), obj("b", "away", 1, 1)] }, { t: 1, objects: [obj("b", "away", 2, 2), obj("a", "home", 3, 3)] }] };
    expect(interpolate(timeline, 0.5).map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("does not change what it was given, and carries the label and the number", () => {
    const timeline = simple();
    const before = JSON.stringify(timeline);
    const out = interpolate(timeline, 1.5);
    out[0].x = -1;
    expect(JSON.stringify(timeline)).toBe(before);
    expect(out.find((o) => o.id === "h1")).toMatchObject({ number: 9, label: "Rivera" });
  });

  it("sorts frames that are out of order and drops objects without a place", () => {
    const timeline: ReplayTimeline = { frames: [{ t: 2, objects: [obj("a", "home", 20, 0)] }, { t: 0, objects: [obj("a", "home", 0, 0), { id: "x", team: "away", x: Number.NaN, y: 0 }, { team: "away", x: 1, y: 1 } as unknown as ReplayObject] }] };
    expect(interpolate(timeline, 1)).toEqual([obj("a", "home", 10, 0)]);
  });

  it("curves through the frames with smooth, passing through each frame, and is the straight line without it", () => {
    const corner: ReplayTimeline = { frames: [{ t: 0, objects: [obj("a", "home", 0, 0)] }, { t: 1, objects: [obj("a", "home", 10, 0)] }, { t: 2, objects: [obj("a", "home", 10, 10)] }, { t: 3, objects: [obj("a", "home", 0, 10)] }] };
    const straight = interpolate(corner, 1.5)[0];
    expect([straight.x, straight.y]).toEqual([10, 5]);
    const round = interpolate(corner, 1.5, { smooth: true })[0];
    expect(round.x).toBeGreaterThan(10);
    expect(interpolate(corner, 2, { smooth: true })[0]).toMatchObject({ x: 10, y: 10 });
    expect(interpolate(corner, 1.5, { smooth: 0 })[0]).toEqual(straight);
    const half = interpolate(corner, 1.5, { smooth: 0.5 })[0];
    expect(half.x).toBeGreaterThan(10);
    expect(half.x).toBeLessThan(round.x);
  });

  it("refuses data that is not a timeline", () => {
    expect(() => interpolate({ frames: [] }, 0)).toThrow(TypeError);
    expect(() => interpolate({ frames: [{ t: Number.NaN, objects: [] }] }, 0)).toThrow(RangeError);
    expect(() => interpolate({ frames: [{ t: 0 }] } as unknown as ReplayTimeline, 0)).toThrow(TypeError);
    expect(() => interpolate(null as unknown as ReplayTimeline, 0)).toThrow(TypeError);
  });
});

describe("trails", () => {
  it("run from the place a number of seconds ago to the place now, through the frames between", () => {
    const [ball] = trails(simple(), 3, 2, { teams: ["ball"] });
    expect(ball.points.map((p) => p[0])).toEqual([10, 20, 30]);
    const [mid] = trails(simple(), 3.5, 1.5, { teams: ["ball"] });
    expect(mid.points.map((p) => p[0])).toEqual([20, 30, 35]);
  });

  it("are one place long at the start, at no seconds, and for an object that does not move", () => {
    expect(trails(simple(), 0, 2, { teams: ["ball"] })[0].points).toEqual([[0, 20]]);
    expect(trails(simple(), 3, 0, { teams: ["ball"] })[0].points).toEqual([[30, 20]]);
    expect(trails(simple(), 3, 2, { ids: ["h1"] })[0].points.every(([x, y]) => x === 50 && y === 20)).toBe(true);
  });

  it("are for the objects that are there at the time, chosen by team or by id", () => {
    expect(trails(simple(), 3, 2).map((trail) => trail.id)).toEqual(["ball", "h1"]);
    expect(trails(simple(), 1, 2, { teams: ["away"] }).map((trail) => trail.id)).toEqual(["a1"]);
    expect(trails(simple(), 3, 2, { teams: ["away"] })).toEqual([]);
  });
});

describe("possession", () => {
  const timeline: ReplayTimeline = {
    frames: [
      { t: 0, objects: [obj("h7", "home", 1, 1), obj("a2", "away", 5, 5)], possession: "h7" },
      { t: 1, objects: [obj("h7", "home", 1, 1), obj("a2", "away", 5, 5)] },
      { t: 2, objects: [obj("h7", "home", 1, 1), obj("a2", "away", 5, 5)], possession: null },
      { t: 3, objects: [obj("h7", "home", 1, 1), obj("a2", "away", 5, 5)], possession: "away" },
      { t: 4, objects: [obj("h7", "home", 1, 1), obj("a2", "away", 5, 5)], possession: "a2" },
    ],
  };
  it("is the latest thing the data says, until it says another", () => {
    expect(possession(timeline, 0)).toEqual({ holder: "h7", team: "home" });
    expect(possession(timeline, 1.5)).toEqual({ holder: "h7", team: "home" });
    expect(possession(timeline, 2.5)).toBeUndefined();
    expect(possession(timeline, 3)).toEqual({ team: "away" });
    expect(possession(timeline, 4)).toEqual({ holder: "a2", team: "away" });
  });
  it("is nothing when the data does not say", () => {
    expect(possession(simple(), 2)).toBeUndefined();
  });
});

describe("events", () => {
  it("are on the surface from their time until the hold has passed, and have their places worked out", () => {
    const timeline = simple();
    expect(activeEvents(timeline, 0.5)).toEqual([]);
    const [pass] = activeEvents(timeline, 1.5);
    expect(pass).toMatchObject({ index: 0, x: 50, y: 20, x2: 30, y2: 20 });
    expect(activeEvents(timeline, 3.9).map((a) => a.event.kind)).toEqual(["pass", "goal"]);
    expect(activeEvents(timeline, 4).map((a) => a.event.kind)).toEqual(["goal"]);
    // The goal has no place of its own: it is where the ball is.
    expect(activeEvents(timeline, 3).find((a) => a.event.kind === "goal")).toMatchObject({ x: 30, y: 20 });
    expect(activeEvents(timeline, 3.5, 0.2)).toEqual([]);
  });

  it("find the receiver at the time the pass ends", () => {
    const timeline: ReplayTimeline = { frames: [{ t: 0, objects: [obj("a", "home", 0, 0), obj("b", "home", 100, 0)] }, { t: 10, objects: [obj("a", "home", 0, 0), obj("b", "home", 100, 50)] }], events: [{ t: 0, kind: "pass", by: "a", to: "b", until: 5 }] };
    expect(activeEvents(timeline, 1)[0]).toMatchObject({ x: 0, y: 0, x2: 100, y2: 25 });
  });

  it("go by in order, and are told with the moment a clock passes them", () => {
    expect(eventsBetween(simple(), 0, 1).map((e) => e.kind)).toEqual(["pass"]);
    expect(eventsBetween(simple(), 1, 3).map((e) => e.kind)).toEqual(["goal"]);
    expect(eventsBetween(simple(), 3, 4)).toEqual([]);
  });

  it("are said in English and in Japanese, and by their own label when they have one", () => {
    expect(describeEvent({ t: 72, kind: "goal", team: "home" })).toBe("Goal, home, 1:12");
    expect(describeEvent({ t: 72, kind: "goal", team: "away" }, "ja")).toBe("アウェイのゴール、1分12秒");
    expect(describeEvent({ t: 5, kind: "whistle" })).toBe("Whistle, 0:05");
    expect(describeEvent({ t: 5, kind: "offside", team: "home" })).toBe("offside, home, 0:05");
    expect(describeEvent({ t: 65, kind: "goal", label: "Goal, Rivera" }, "en", 5)).toBe("Goal, Rivera, 1:00");
  });
});

describe("a frame", () => {
  const timeline = replayPlay("hockey", { seconds: 14 });
  const options = { sport: "nhl" as const, id: "rink" };

  it("draws the same string every time, and another at another time", () => {
    expect(drawFrame(options, timeline, 5)).toBe(drawFrame(options, timeline, 5));
    expect(drawFrame(options, timeline, 5)).not.toBe(drawFrame(options, timeline, 5.5));
    expect(drawFrame(options, timeline, 5).startsWith("<svg")).toBe(true);
  });

  it("is the drawing of the surface with the replay's layers on it, the numbers and the ball among them", () => {
    const svg = drawFrame(options, timeline, 5);
    for (const id of ["rink-replay-players", "rink-replay-numbers", "rink-replay-ball", "rink-replay-officials"]) expect(svg).toContain(`id="${id}"`);
    expect((svg.match(/<text class="ky-lt/g) ?? []).length).toBe(12);
    expect(svg).toContain(">91<");
    expect(svg).toBe(drawKyogijo({ ...options, description: svg.match(/<desc id="rink-d">([^<]*)</)?.[1].replace(/&amp;/g, "&"), layers: replayLayers(timeline, 5) }));
  });

  it("keeps the same ids and the same description at every time, so that a page's references hold", () => {
    const ids = (svg: string): string[] => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]).filter((id) => id.includes("replay"));
    const first = drawFrame({ sport: "nhl" }, timeline, 1);
    const later = drawFrame({ sport: "nhl" }, timeline, 11);
    expect(ids(first).length).toBeGreaterThan(3);
    expect(ids(first).filter((id) => !id.includes("event"))).toEqual(ids(later).filter((id) => !id.includes("event")));
    const desc = (svg: string): string => svg.match(/<desc[^>]*>([^<]*)</)?.[1] ?? "";
    expect(desc(first)).toBe(desc(later));
    expect(desc(first)).toContain("Replay, 0:14.");
    expect(desc(first)).toContain("14 tracked objects.");
    expect(desc(first)).toContain("By team: home 6, away 6, puck 1, official 1.");
  });

  it("describes itself in Japanese when the drawing is Japanese", () => {
    const svg = drawFrame({ ...options, language: "ja" }, timeline, 2);
    expect(svg).toContain("リプレイ（再生時間14秒）。");
    expect(svg).toContain("追跡対象は14個。");
    expect(svg).toContain("背番号");
  });

  it("keeps the caller's own layers and description, and lays the replay on top", () => {
    const own = { kind: "text" as const, id: "mine", data: [{ x: 100, y: 42, text: "Mine" }] };
    const svg = drawFrame({ ...options, layers: [own] }, timeline, 3);
    expect(svg.indexOf('id="rink-mine"')).toBeGreaterThan(0);
    expect(svg.indexOf('id="rink-mine"')).toBeLessThan(svg.indexOf('id="rink-replay-players"'));
    expect(svg).toContain("Mine");
    expect(drawFrame({ ...options, description: "My words" }, timeline, 3)).toContain("<desc id=\"rink-d\">My words</desc>");
  });

  it("draws on a bare surface, a score and a tall drawing, and the numbers stay upright when tall", () => {
    const pitch = replayPlay("soccer", { seconds: 6 });
    const wide = drawFrame({ sport: "soccer", id: "p" }, pitch, 2);
    const tall = drawFrame({ sport: "soccer", id: "p", orientation: "portrait" }, pitch, 2);
    expect(wide).not.toContain("rotate(-90");
    expect(tall).toContain("rotate(-90");
    const score = drawFrame({ sport: "soccer", id: "p", away: { name: "Northern Owls", score: 0 }, home: { name: "Lakeshore Anchors", score: 1, color: "#0f7a7a" } }, pitch, 2);
    expect(score).toContain(">LAKESHORE<");
    expect(score).toContain("--ky-layer-home:#0f7a7a");
  });

  it("escapes what the data says", () => {
    const hostile: ReplayTimeline = { frames: [{ t: 0, objects: [obj("a", "home", 5, 5, { label: "<img src=x onerror=alert(1)>", number: "<b>" })] }], events: [{ t: 0, kind: "<script>", label: "</title><script>alert(1)</script>", x: 5, y: 5 }] };
    const svg = drawFrame({ sport: "nhl" }, hostile, 0);
    expect(svg).not.toContain("<img");
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("<b>");
    expect(replayTable(hostile)).not.toContain("<script");
  });

  it("is a snapshot of what is on the surface, and its groups say which marks move", () => {
    const snap = replaySnapshot(timeline, 5);
    expect(snap.objects).toHaveLength(14);
    expect(snap.trails.map((line) => line.id)).toEqual(["puck"]);
    const groups = replayGroups(timeline, snap, {}, "en");
    expect(groups.filter((g) => g.moving).map((g) => g.id)).toEqual(["replay-trails", "replay-officials", "replay-players", "replay-numbers", "replay-ball"]);
    expect(groups.find((g) => g.id === "replay-players")?.keys).toHaveLength(12);
    // At the start nothing has moved yet, so there is no trail; an event adds its own groups.
    expect(replaySnapshot(timeline, 0).trails).toEqual([]);
    expect(replayGroups(timeline, replaySnapshot(timeline, 7), {}, "en").map((g) => g.id)).toContain("replay-event-lines");
  });

  it("leaves out what the look says: no trail, no numbers, a bigger mark", () => {
    const look = replayGroups(timeline, replaySnapshot(timeline, 5, { trail: 0 }), { trail: 0, numbers: false }, "en").map((g) => g.id);
    expect(look).not.toContain("replay-trails");
    expect(look).not.toContain("replay-numbers");
    const big = replayLayers(timeline, 5, { scale: 2 }).find((l) => l.id === "replay-players");
    expect(big).toMatchObject({ style: { scale: 4.6 } });
    expect(replayLayers(timeline, 5, { trail: 5, trailOf: ["home"] }).find((l) => l.id === "replay-trails")).toBeDefined();
  });
});

describe("the summary and the table", () => {
  it("sum the replay up without the time in it", () => {
    expect(replaySummary(simple())).toBe("Replay, 0:04. 3 tracked objects. By team: home 1, away 1, ball 1. 2 events.");
    expect(replaySummary(simple(), "ja")).toBe("リプレイ（再生時間4秒）。追跡対象は3個。チーム別：ホーム 1件、アウェイ 1件、ボール 1件。イベント2件。");
  });
  it("list the events as a table for a reader who cannot see the drawing", () => {
    const html = replayTable(simple());
    expect(html).toContain('<caption>2 events</caption>');
    expect(html).toContain("<td>0:01</td><td>Pass</td><td>home</td><td>Pass, home, 0:01</td>");
    expect((html.match(/<tr>/g) ?? []).length).toBe(3);
  });
  it("know their length, their frames and their gap", () => {
    expect(replayInfo(simple())).toEqual({ start: 0, end: 4, duration: 4, frames: 5, objects: 3, events: 2, step: 1 });
    expect(replayClock(65)).toBe("1:05");
    expect(replayClock(3725)).toBe("1:02:05");
    expect(replayClock(-3)).toBe("0:00");
  });
});

describe("the strings of a replay", () => {
  it("are in both languages with every placeholder the English has", () => {
    // The padded forms ({mm}, {ss}) and the plain ones ({m}, {s}) of the spoken lengths are each language's choice: 0:05 in English, 5秒 in Japanese.
    const holes = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1].replace(/^(m|s)\1$/, "$1")).sort();
    for (const [key, text] of Object.entries(KYOGIJO_STRINGS.en.replay)) {
      const ja = (KYOGIJO_STRINGS.ja.replay as Record<string, string>)[key];
      expect(ja, key).toMatch(/\S/);
      expect(holes(ja), key).toEqual(holes(text));
    }
  });
});

describe("the controller", () => {
  const events = simple();
  it("plays at its speed, stops at the end, and starts again from the start when played at the end", () => {
    const replay = createReplay(events, { speed: 2 });
    expect(replay.state()).toMatchObject({ t: 0, playing: false, ended: false, speed: 2, loop: false, motion: "smooth" });
    replay.advance(1);
    expect(replay.state().t).toBe(0);
    replay.play();
    replay.advance(1);
    expect(replay.state().t).toBe(2);
    replay.advance(10);
    expect(replay.state()).toMatchObject({ t: 4, playing: false, ended: true });
    replay.play();
    expect(replay.state()).toMatchObject({ t: 0, playing: true, ended: false });
    replay.pause();
    replay.advance(1);
    expect(replay.state().t).toBe(0);
  });

  it("loops: the clock goes round from the start, and says what went by on the way", () => {
    const told: string[][] = [];
    const replay = createReplay(events, { loop: true, start: 3 });
    replay.subscribe((change) => told.push(change.crossed.map((e) => e.kind)));
    replay.play();
    replay.advance(2);
    expect(replay.state()).toMatchObject({ t: 1, playing: true, ended: false });
    // The goal at 3 was passed after 3, and the pass at 1 on the way round.
    expect(told.at(-1)).toEqual(["pass"]);
    replay.advance(1.5);
    expect(replay.state().t).toBe(2.5);
    const onceMore = createReplay(events, { loop: true, start: 3.5 });
    onceMore.play();
    onceMore.advance(0.5);
    expect(onceMore.state().t).toBe(4);
    expect(onceMore.state().playing).toBe(true);
  });

  it("seeks within the timeline, and does not mind what it is not given", () => {
    const replay = createReplay(events);
    replay.seek(2.5);
    expect(replay.state().t).toBe(2.5);
    replay.seek(99);
    expect(replay.state().t).toBe(4);
    replay.seek(-9);
    expect(replay.state().t).toBe(0);
    replay.seek(Number.NaN);
    expect(replay.state().t).toBe(0);
    replay.jump(1.5);
    replay.jump(-0.5);
    expect(replay.state().t).toBe(1);
  });

  it("steps a frame at a time, pausing, and says what a step forward went past", () => {
    const told: { reason: string; kinds: string[] }[] = [];
    const replay = createReplay(events, { start: 0.5 });
    replay.subscribe((change) => told.push({ reason: change.reason, kinds: change.crossed.map((e) => e.kind) }));
    replay.play();
    replay.step(1);
    expect(replay.state()).toMatchObject({ t: 1, playing: false });
    expect(told.at(-1)).toEqual({ reason: "step", kinds: ["pass"] });
    replay.step(1);
    replay.step(-1);
    expect(replay.state().t).toBe(1);
    expect(told.at(-1)).toEqual({ reason: "step", kinds: [] });
    replay.seek(0);
    replay.step(-1);
    expect(replay.state().t).toBe(0);
    replay.seek(4);
    const count = told.length;
    replay.step(1);
    expect(told.length).toBe(count);
  });

  it("keeps its speed between 0.25 and 4, and offers five", () => {
    const replay = createReplay(events);
    replay.setSpeed(100);
    expect(replay.state().speed).toBe(4);
    replay.setSpeed(0);
    expect(replay.state().speed).toBe(0.25);
    replay.setSpeed(Number.NaN);
    expect(replay.state().speed).toBe(0.25);
    expect(REPLAY_SPEEDS).toEqual([0.25, 0.5, 1, 2, 4]);
    expect(createReplay(events, { speed: 9 }).state().speed).toBe(4);
  });

  it("is told of every change, once, until it stops listening", () => {
    const replay = createReplay(events);
    const reasons: string[] = [];
    const stop = replay.subscribe((change) => reasons.push(change.reason));
    replay.play();
    replay.play();
    replay.advance(0.5);
    replay.setSpeed(2);
    replay.setSpeed(2);
    replay.setLoop(true);
    replay.setLoop(true);
    replay.pause();
    replay.pause();
    replay.seek(1);
    stop();
    replay.seek(2);
    expect(reasons).toEqual(["play", "tick", "speed", "loop", "pause", "seek"]);
  });

  it("in step mode never plays by itself: play moves one step of the seconds asked, and the clock does nothing", () => {
    const replay = createReplay(events, { motion: "step", stepSeconds: 1.5 });
    expect(replay.state().motion).toBe("step");
    replay.play();
    expect(replay.state()).toMatchObject({ t: 1.5, playing: false });
    replay.advance(10);
    expect(replay.state().t).toBe(1.5);
    replay.step(-1);
    expect(replay.state().t).toBe(0);
    replay.step(1);
    replay.step(1);
    replay.step(1);
    expect(replay.state().t).toBe(4);
    const smooth = createReplay(events);
    smooth.play();
    smooth.setMotion("step");
    expect(smooth.state()).toMatchObject({ playing: false, motion: "step" });
  });

  it("works on a timeline with one frame", () => {
    const replay = createReplay({ frames: [{ t: 5, objects: [obj("a", "home", 1, 1)] }] });
    replay.play();
    replay.advance(1);
    expect(replay.state()).toMatchObject({ t: 5, ended: true, playing: false });
  });
});

describe("the budget: 22 players and a ball for 60 seconds at 25 frames a second", () => {
  const timeline = replayPlay("soccer", { seconds: 60, fps: 25 });
  const options = { sport: "soccer" as const, id: "pitch" };

  it("is the size the budget says", () => {
    const info = replayInfo(timeline);
    expect(info.frames).toBe(1501);
    expect(info.objects).toBeGreaterThanOrEqual(23);
    expect(info.step).toBeCloseTo(0.04, 6);
  });

  it("answers a position, a trail, a snapshot and a whole frame within the time the page has between two frames", () => {
    const run = (fn: (i: number) => unknown, times: number): number => {
      const start = performance.now();
      for (let i = 0; i < times; i += 1) fn(i);
      return (performance.now() - start) / times;
    };
    drawFrame(options, timeline, 1);
    // A frame at 25 a second is 40 ms; at 60 it is 16.7. The budgets are a tenth of that, for a slow machine.
    expect(run((i) => interpolate(timeline, 1 + i * 0.037), 200)).toBeLessThan(1.5);
    expect(run((i) => trails(timeline, 5 + i * 0.037, 2), 100)).toBeLessThan(3);
    expect(run((i) => replayGroups(timeline, replaySnapshot(timeline, 5 + i * 0.037), {}, "en"), 100)).toBeLessThan(3);
    expect(run((i) => drawFrame(options, timeline, 5 + i * 0.037), 30)).toBeLessThan(8);
  });

  it("draws a frame in a string of a size that stays the same from frame to frame", () => {
    const sizes = [1, 20, 40, 59].map((t) => drawFrame(options, timeline, t).length);
    for (const size of sizes) expect(size).toBeLessThan(40_000);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThan(4_000);
  });
});
