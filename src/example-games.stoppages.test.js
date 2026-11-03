// The example game (examples/games/canada-japan.json) held to hockey's rules of dead time (replay.hockey.ts): the game clock never moves in a stoppage, the dead puck never moves, every face-off is on
// one of the nine spots, after every goal the next is at centre ice, the players are in their places before the drop and never glide faster than the rules' speed, and the board reads the game clock.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { boardClock, replayBoard, replayGameClock } from "./replay.board.ts";
import { replayStoppages } from "./replay.deadtime.ts";
import { HOCKEY_DEAD_TIME, isHockeyDot } from "./replay.hockey.ts";
import { interpolate } from "./replay.ts";

const game = JSON.parse(readFileSync("examples/games/canada-japan.json", "utf8"));
const timeline = { ...game.timeline, periods: game.periods.map((p) => ({ ...p, length: 1200 })) };
const stoppages = replayStoppages(timeline);
const puckAt = (t) => interpolate(timeline, t).find((o) => o.id === "puck");
const playersAt = (t) => interpolate(timeline, t).filter((o) => o.team === "home" || o.team === "away");
/** Moments through a stoppage, from its start to just before its drop. */
const through = (s, n = 24) => Array.from({ length: n }, (_, i) => s.start + ((s.end - s.start - 0.001) * i) / (n - 1));

describe("the example game plays its stoppages by hockey's rules", () => {
  it("has its stoppages: one at every whistle, goal and period's start and end", () => {
    const kinds = new Set(stoppages.map((s) => s.reason));
    for (const reason of ["goal", "save", "icing", "offside", "penalty", "whistle", "period-start", "period-end"]) expect(kinds).toContain(reason);
    expect(stoppages.filter((s) => s.reason === "goal")).toHaveLength(game.timeline.events.filter((e) => e.kind === "goal").length);
  });

  it("never moves the game clock in a stoppage, and moves it everywhere else", () => {
    for (const s of stoppages) {
      const at = through(s).map((t) => replayGameClock(timeline, t).played);
      expect(new Set(at).size).toBe(1);
      for (const t of through(s)) expect(replayGameClock(timeline, t).running).toBe(false);
    }
    const live = stoppages.slice(0, -1).map((s, i) => [s.end, stoppages[i + 1].start]).filter(([a, b]) => b - a > 1);
    for (const [a, b] of live) {
      if (replayGameClock(timeline, a).period !== replayGameClock(timeline, b).period) continue;
      expect(replayGameClock(timeline, (a + b) / 2).running).toBe(true);
      expect(replayGameClock(timeline, b).played).toBeGreaterThan(replayGameClock(timeline, a).played);
    }
  });

  it("never moves the dead puck: it stays where play stopped, then is out of sight until the drop", () => {
    for (const s of stoppages) {
      const there = puckAt(s.start);
      let gone = false;
      for (const t of through(s, 40)) {
        const puck = puckAt(t);
        if (puck === undefined) gone = true;
        else {
          // Once out of sight it does not come back before the drop.
          expect(gone).toBe(false);
          expect([puck.x, puck.y]).toEqual([there?.x, there?.y]);
        }
      }
      if (s.reason !== "period-end") expect(gone).toBe(true);
    }
  });

  it("drops every face-off on one of the nine spots, the puck on it at the drop", () => {
    const faceoffs = game.timeline.events.filter((e) => e.kind === "faceoff");
    expect(faceoffs.length).toBeGreaterThan(40);
    for (const f of faceoffs) {
      expect(isHockeyDot(f.x, f.y)).toBe(true);
      expect(puckAt(f.t)).toMatchObject({ x: f.x, y: f.y });
      // A drop is the end of a stoppage.
      expect(stoppages.some((s) => Math.abs(s.end - f.t) < 1e-6)).toBe(true);
    }
  });

  it("drops the puck at centre ice after every goal", () => {
    const events = game.timeline.events;
    for (const goal of events.filter((e) => e.kind === "goal")) {
      const next = events.find((e) => e.kind === "faceoff" && e.t > goal.t);
      expect(next).toMatchObject({ x: 0, y: 0 });
    }
  });

  it("has the players in the line-up before the drop: still, a centre of each side on the dot, nobody else in the circle, the goaltenders in their crease", () => {
    for (const s of stoppages.filter((one) => one.reason !== "period-end")) {
      const at = playersAt(s.end);
      expect(at).toHaveLength(12);
      expect(playersAt(s.end - HOCKEY_DEAD_TIME.hold + 0.01)).toEqual(at);
      const near = at.filter((o) => Math.hypot(o.x - (s.x ?? 0), o.y - (s.y ?? 0)) <= 15);
      expect(near.map((o) => o.team).sort()).toEqual(["away", "home"]);
      for (const o of near) expect(Math.hypot(o.x - (s.x ?? 0), o.y - (s.y ?? 0))).toBeLessThanOrEqual(3);
      const goalies = at.filter((o) => Math.abs(o.x) === 85);
      expect(goalies.map((o) => o.y)).toEqual([0, 0]);
    }
  });

  it("skates them there no faster than a glide", () => {
    let fastest = 0;
    for (const s of stoppages) {
      const times = [s.start, ...timeline.frames.map((f) => f.t).filter((t) => t > s.start && t < s.end), s.end];
      for (let i = 1; i < times.length; i += 1) {
        const a = new Map(playersAt(times[i - 1]).map((o) => [o.id, o]));
        for (const b of playersAt(times[i])) {
          const was = a.get(b.id);
          if (was !== undefined && times[i] - times[i - 1] > 0.05) fastest = Math.max(fastest, Math.hypot(b.x - was.x, b.y - was.y) / (times[i] - times[i - 1]));
        }
      }
    }
    expect(fastest).toBeGreaterThan(HOCKEY_DEAD_TIME.speed * 0.8);
    expect(fastest).toBeLessThanOrEqual(HOCKEY_DEAD_TIME.speed + 0.5);
  });

  it("shows the game clock on the board at every moment, the same all through a stoppage", () => {
    const end = game.periods.at(-1).end + 2;
    for (let t = 0; t <= end; t += 1.37) {
      const clock = replayGameClock(timeline, t);
      expect(replayBoard(timeline, t).clock).toBe(boardClock(Math.ceil(clock.left - 1e-9)));
      expect(replayBoard(timeline, t).period).toBe(clock.period);
    }
    for (const s of stoppages) expect(new Set(through(s).map((t) => replayBoard(timeline, t).clock)).size).toBe(1);
    // A period's clock reads its full twenty minutes until the opening drop, and nothing at its end.
    for (const p of game.periods) {
      expect(replayBoard(timeline, p.start).clock).toBe("20:00");
      expect(replayBoard(timeline, p.start + HOCKEY_DEAD_TIME.lineUp - 0.01).clock).toBe("20:00");
      expect(replayBoard(timeline, p.end).clock).toBe("0:00");
    }
  });
});
