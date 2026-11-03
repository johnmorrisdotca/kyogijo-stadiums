// The example game's penalties held to hockey's rules: each penalized player sits in his side's box for exactly the penalty's time on the game clock (or until a power-play goal ends his minor), his side
// plays a skater short meanwhile, the skaters on the ice always match the strength, and the board's penalty clock counts the game clock down.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { boardClock, penaltiesAt, replayBoard, replayGameTime } from "./replay.board.ts";
import { replayStoppages, stoppageAt } from "./replay.deadtime.ts";
import { hockeyPenaltyBox } from "./replay.hockey.ts";
import { interpolate } from "./replay.ts";

const game = JSON.parse(readFileSync("examples/games/canada-japan.json", "utf8"));
const timeline = { ...game.timeline, periods: game.periods.map((p) => ({ ...p, length: 1200 })) };
const penalties = game.timeline.penalties;
const stoppages = replayStoppages(timeline);
const goalies = new Set([...game.rosters.home, ...game.rosters.away].filter((p) => p.position === "G").map((p) => p.id));
const at = (id, t) => interpolate(timeline, t).find((o) => o.id === id);
const inBox = (o, team) => o !== undefined && Math.abs(o.y - hockeyPenaltyBox(team)[1]) < 0.01 && Math.abs(o.x - hockeyPenaltyBox(team)[0]) <= 3;
/** The drop after a call: the end of the stoppage it was called in. */
const dropAfter = (t) => stoppages.find((s) => s.start <= t && t < s.end)?.end ?? t;
const goalStop = (t, team) => stoppages.some((s) => s.reason === "goal" && Math.abs(s.start - t) < 0.01 && game.timeline.events.some((e) => e.kind === "goal" && e.team === team && e.t <= s.start && e.t > s.start - 1));

describe("the example game's penalties", () => {
  it("has its penalties, each served by a player of its side", () => {
    expect(penalties.length).toBeGreaterThan(4);
    for (const p of penalties) expect(game.rosters[p.team].some((r) => r.id === p.by)).toBe(true);
  });

  it("keeps a penalized player in his box for exactly the penalty's time on the game clock, or until a power-play goal ends his minor", () => {
    let byGoal = 0;
    for (const p of penalties) {
      const time = replayGameTime(timeline, p.end) - replayGameTime(timeline, p.start);
      if (Math.abs(time - p.minutes * 60) > 0.5) {
        // Ended early: by a goal of the other side, at its stoppage, while his side was short.
        expect(time).toBeLessThan(p.minutes * 60);
        expect(goalStop(p.end, p.team === "home" ? "away" : "home")).toBe(true);
        byGoal += 1;
      }
      // On the ice when he is called, in the box from the drop until his time is up, and out of it after.
      expect(inBox(at(p.by, p.start), p.team)).toBe(false);
      const from = dropAfter(p.start);
      for (let k = 0; k <= 20; k += 1) expect(inBox(at(p.by, from + ((p.end - from - 0.02) * k) / 20), p.team)).toBe(true);
      // Out by the drop when his time ends in a stoppage (a power-play goal), else a moment after it.
      const out = Math.max(p.end + 1.5, dropAfter(p.end) + 0.01);
      expect(inBox(at(p.by, out), p.team)).toBe(false);
    }
    expect(byGoal).toBeGreaterThan(0);
  });

  it("has as many skaters of each side on the ice as its strength, at every moment of play", () => {
    const end = game.periods.at(-1).end;
    let short = 0;
    for (let t = 0.3; t < end; t += 0.73) {
      if (stoppageAt(timeline, t) !== undefined) continue;
      // A moment after a player leaves the box he is still on his way to the ice.
      if (penalties.some((p) => t >= p.end && t < p.end + 1.5)) continue;
      const { strength } = penaltiesAt(timeline, t);
      const on = interpolate(timeline, t).filter((o) => (o.team === "home" || o.team === "away") && !goalies.has(o.id) && Math.abs(o.y) <= 42.5);
      expect([on.filter((o) => o.team === "home").length, on.filter((o) => o.team === "away").length], `at ${t.toFixed(2)}`).toEqual(strength);
      if (strength[0] !== strength[1]) short += 1;
    }
    expect(short).toBeGreaterThan(20);
  });

  it("shows each penalty's clock on the board, counting down the game clock from the drop", () => {
    for (const p of penalties) {
      const from = dropAfter(p.start);
      for (let k = 0; k < 10; k += 1) {
        const t = from + ((p.end - from) * k) / 10;
        const left = p.minutes * 60 - (replayGameTime(timeline, t) - replayGameTime(timeline, p.start));
        const board = replayBoard(timeline, t);
        // To the second: the end is on the replay's clock to a hundredth of a second, a few hundredths of a second of game clock.
        const seconds = (clock) => Number(clock.split(":")[0]) * 60 + Number(clock.split(":")[1]);
        expect(board.penalties?.some((q) => q.team === p.team && Math.abs(seconds(q.left) - seconds(boardClock(Math.ceil(left - 1e-9)))) <= 1)).toBe(true);
        expect(board.strength).toEqual(penaltiesAt(timeline, t).strength);
      }
    }
  });
});
