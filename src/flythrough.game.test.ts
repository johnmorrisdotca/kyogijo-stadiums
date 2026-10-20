import { describe, expect, it } from "vitest";
import { activeEvents, replayEvents, replayInfo } from "./replay.ts";
import { ILLUSTRATIVE_PLAY, PLAY_FADE, PLAY_PERIOD, PLAY_SECONDS, PLAY_STILL, at, playAlpha, playMarkup, playMoment, puckAt } from "./flythrough.game.ts";
import { FLYTHROUGH_WORDS } from "./flythrough.words.ts";

const frames = ILLUSTRATIVE_PLAY.frames;
const objects = (t: number) => frames[Math.round(t * 10)].objects;

describe("the play on the ice", () => {
  it("is a replay's timeline of 101 frames a tenth of a second apart, with six a side and the puck in each", () => {
    expect(frames).toHaveLength(PLAY_SECONDS * 10 + 1);
    frames.forEach((frame, i) => expect(frame.t).toBeCloseTo(i / 10, 9));
    for (const frame of frames) {
      expect(frame.objects).toHaveLength(13);
      expect(frame.objects.filter((o) => o.team === "home")).toHaveLength(6);
      expect(frame.objects.filter((o) => o.team === "away")).toHaveLength(6);
      expect(frame.objects.filter((o) => o.team === "puck")).toHaveLength(1);
    }
    const info = replayInfo(ILLUSTRATIVE_PLAY);
    expect(info).toMatchObject({ start: 0, end: PLAY_SECONDS, frames: 101, objects: 13, events: 4 });
  });

  it("is made up: only shirt numbers name anyone, every one different on a team, and no label of a real player or a team", () => {
    for (const team of ["home", "away"] as const) {
      const numbers = frames[0].objects.filter((o) => o.team === team).map((o) => o.number);
      expect(new Set(numbers).size).toBe(6);
      for (const n of numbers) expect(typeof n).toBe("number");
    }
    for (const frame of frames) for (const o of frame.objects) expect(o.label, o.id).toBeUndefined();
    for (const e of replayEvents(ILLUSTRATIVE_PLAY)) expect(e.label).toBeUndefined();
    expect(JSON.stringify(ILLUSTRATIVE_PLAY)).not.toMatch(/NHL|logo|crest|emblem/i);
  });

  it("stays on the ice: every skater, goalie and the puck is inside the rink (200 by 85 feet) at every frame", () => {
    for (const frame of frames) for (const o of frame.objects) {
      expect(o.x, `${o.id} x at ${frame.t}`).toBeGreaterThanOrEqual(5);
      expect(o.x, `${o.id} x at ${frame.t}`).toBeLessThanOrEqual(195);
      expect(o.y, `${o.id} y at ${frame.t}`).toBeGreaterThanOrEqual(5);
      expect(o.y, `${o.id} y at ${frame.t}`).toBeLessThanOrEqual(80);
    }
  });

  it("moves like hockey: a skater never faster than 40 feet a second and never jumps, the puck never faster than 110", () => {
    for (let i = 1; i < frames.length; i += 1) {
      for (const o of frames[i].objects) {
        const before = frames[i - 1].objects.find((one) => one.id === o.id)!;
        const speed = Math.hypot(o.x - before.x, o.y - before.y) / 0.1;
        expect(speed, `${o.id} at ${frames[i].t}`).toBeLessThanOrEqual(o.team === "puck" ? 110 : 40);
      }
    }
  });

  it("has the home team carry the puck up the ice to the right and score in the away net, with the puck on the stick of whoever has it", () => {
    const puck = (t: number) => objects(t).find((o) => o.team === "puck")!;
    expect(puck(0).x).toBeLessThan(40);
    expect(puck(5).x).toBeGreaterThan(130);
    expect(puck(7)).toMatchObject({ x: 189, y: 42.5 });
    for (const frame of frames) {
      if (typeof frame.possession !== "string") continue;
      const holder = frame.objects.find((o) => o.id === frame.possession)!;
      const p = frame.objects.find((o) => o.team === "puck")!;
      expect(Math.hypot(p.x - holder.x, p.y - holder.y), `puck at ${frame.t}`).toBeLessThan(4);
      expect(holder.team).toBe("home");
    }
    // Two passes, a shot and the goal, in order, between players of the home team.
    const events = replayEvents(ILLUSTRATIVE_PLAY);
    expect(events.map((e) => e.kind)).toEqual(["pass", "pass", "shot", "goal"]);
    expect(events.every((e) => e.team === "home")).toBe(true);
    expect([...events].sort((a, b) => a.t - b.t)).toEqual([...events]);
    for (const e of events) {
      for (const id of [e.by, e.to]) if (id !== undefined) expect(frames[0].objects.some((o) => o.id === id), id).toBe(true);
    }
  });

  it("gives the same place at the same time, in a way that is smooth through each waypoint and never leaves the way", () => {
    expect(at([[0, 0, 0], [2, 20, 10], [4, 30, 30]], 2)).toEqual([20, 10]);
    expect(at([[0, 0, 0], [2, 20, 10]], -1)).toEqual([0, 0]);
    expect(at([[0, 0, 0], [2, 20, 10]], 5)).toEqual([20, 10]);
    expect(puckAt(3)).toEqual(puckAt(3));
    let last = at([[0, 0, 0], [1, 10, 0], [2, 10, 10], [3, 0, 10]], 0);
    for (let t = 0.01; t <= 3; t += 0.01) {
      const next = at([[0, 0, 0], [1, 10, 0], [2, 10, 10], [3, 0, 10]], t);
      expect(Math.hypot(next[0] - last[0], next[1] - last[1])).toBeLessThan(0.2);
      last = next;
    }
  });
});

describe("the run of the play", () => {
  it("loops: a moment is brought into one period, forwards and back", () => {
    expect(playMoment(0)).toBe(0);
    expect(playMoment(PLAY_PERIOD)).toBe(0);
    expect(playMoment(PLAY_PERIOD + 2.5)).toBeCloseTo(2.5, 9);
    expect(playMoment(-1)).toBeCloseTo(PLAY_PERIOD - 1, 9);
    expect(PLAY_PERIOD).toBeGreaterThan(PLAY_SECONDS);
  });

  it("fades in at the start of a run and out at its end, so that the dots never jump back in view", () => {
    expect(playAlpha(0)).toBe(0);
    expect(playAlpha(PLAY_PERIOD)).toBe(0);
    expect(playAlpha(PLAY_FADE)).toBe(1);
    expect(playAlpha(PLAY_PERIOD / 2)).toBe(1);
    expect(playAlpha(PLAY_FADE / 2)).toBeCloseTo(0.5, 9);
    for (let m = 0; m < PLAY_PERIOD; m += 0.05) expect(Math.abs(playAlpha(m + 0.05) - playAlpha(m))).toBeLessThanOrEqual(0.05 / PLAY_FADE + 1e-9);
    // The play is back at its start while it is hidden.
    expect(playAlpha(PLAY_PERIOD - 0.01)).toBeLessThan(0.05);
  });
});

describe("the play as markup", () => {
  it("is the replay's own layers: the dots with their numbers, the puck and its trail, and the events on the ice", () => {
    const svg = playMarkup(PLAY_STILL, { id: "t" });
    expect(svg.startsWith("<g")).toBe(true);
    expect(svg).toContain("ky-layers");
    expect(svg).toContain("replay-players");
    expect(svg).toContain("replay-numbers");
    expect(svg).toContain("replay-ball");
    expect(svg).toContain("replay-trails");
    // The shot has just been taken: its line and its mark are on the ice.
    expect(svg).toContain("replay-event-lines");
    expect(activeEvents(ILLUSTRATIVE_PLAY, PLAY_STILL, 1.5).map((a) => a.event.kind)).toContain("shot");
    // Twelve numbers, one for each player.
    expect(svg.match(/<text\b/g)!.length).toBeGreaterThanOrEqual(12);
  });

  it("is the same string at the same moment, another at another, and a bare ice before the first event", () => {
    expect(playMarkup(3.3, { id: "t" })).toBe(playMarkup(3.3, { id: "t" }));
    expect(playMarkup(3.3, { id: "t" })).not.toBe(playMarkup(3.4, { id: "t" }));
    expect(playMarkup(0.3, { id: "t" })).not.toContain("replay-events");
    // The loop's moment counts: a run later it is the same frame.
    expect(playMarkup(3.3 + PLAY_PERIOD, { id: "t" })).toBe(playMarkup(3.3, { id: "t" }));
    // The hold at the end of the run is the last frame of the play.
    expect(playMarkup(PLAY_SECONDS + 1, { id: "t" })).toBe(playMarkup(PLAY_SECONDS, { id: "t" }));
  });

  it("draws in either language without a word of a team or a league", () => {
    for (const language of ["en", "ja"] as const) {
      const svg = playMarkup(PLAY_STILL, { id: "t", language });
      expect(svg).not.toMatch(/NHL|logo|crest|emblem/i);
    }
    expect(playMarkup(PLAY_STILL, { id: "t", language: "ja" })).not.toBe(playMarkup(PLAY_STILL, { id: "t", language: "en" }));
  });

  it("is said to be made up, in both languages, wherever it is shown", () => {
    for (const language of ["en", "ja"] as const) {
      const words = FLYTHROUGH_WORDS[language];
      expect(words.illustrative.length).toBeGreaterThan(0);
      expect(words.stage.game.text.length).toBeGreaterThan(20);
    }
    expect(FLYTHROUGH_WORDS.en.illustrative).toMatch(/illustrative/i);
    expect(FLYTHROUGH_WORDS.en.stage.game.text).toMatch(/illustrative, not a real game's data/);
    expect(FLYTHROUGH_WORDS.ja.stage.game.text).toMatch(/模擬/);
    expect(FLYTHROUGH_WORDS.ja.stage.game.text).toMatch(/実際の試合のデータではありません/);
  });
});
