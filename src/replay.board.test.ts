// The scoreboard of a replay: the score, the period and the game clock at a time, from the goals and the periods of the timeline. Pure, so a seek back finds the score as it was.
import { describe, expect, it } from "vitest";

import { boardClock, replayBoard, replayPeriods } from "./replay.board.ts";
import type { ReplayTimeline } from "./replay.types.ts";

const frames = [0, 60, 120, 180].map((t) => ({ t, objects: [{ id: "puck", team: "puck" as const, x: 0, y: 0 }] }));
const game: ReplayTimeline = {
  frames,
  events: [
    { t: 30, kind: "goal", team: "home" },
    { t: 45, kind: "shot", team: "away" },
    { t: 70, kind: "goal", team: "away" },
    { t: 100, kind: "goal", team: "away" },
    { t: 150, kind: "goal", team: "home" },
    { t: 160, kind: "goal" },
  ],
  periods: [
    { start: 0, end: 60, length: 1200 },
    { start: 60, end: 120, length: 1200 },
    { start: 120, end: 180, length: 1200 },
  ],
};

describe("the scoreboard of a replay", () => {
  it("reads 0-0, the first period and the full clock at the start", () => {
    expect(replayBoard(game, 0)).toEqual({ score: [0, 0], period: 1, clock: "20:00" });
    expect(replayBoard(game, 7)).toEqual({ score: [0, 0], period: 1, clock: "17:40" });
  });

  it("counts the goals at or before the time, for the side that scored, and nothing else", () => {
    expect(replayBoard(game, 29.9).score).toEqual([0, 0]);
    expect(replayBoard(game, 30).score).toEqual([1, 0]);
    expect(replayBoard(game, 99).score).toEqual([1, 1]);
    expect(replayBoard(game, 100).score).toEqual([1, 2]);
    // (A goal with no side, and a shot, are not counted.)
    expect(replayBoard(game, 180).score).toEqual([2, 2]);
  });

  it("goes back: the same time gives the same board however it was reached", () => {
    const later = replayBoard(game, 150);
    expect(later.score).toEqual([2, 2]);
    expect(replayBoard(game, 20).score).toEqual([0, 0]);
    expect(replayBoard(game, 150)).toEqual(later);
  });

  it("is in the period the clock has reached, and holds the last one through the gap between two", () => {
    expect(replayBoard(game, 59.9).period).toBe(1);
    expect(replayBoard(game, 60).period).toBe(2);
    expect(replayBoard(game, 119).period).toBe(2);
    expect(replayBoard(game, 125).period).toBe(3);
    const gap: ReplayTimeline = { ...game, periods: [{ start: 0, end: 50, length: 1200 }, { start: 70, end: 120, length: 1200 }] };
    expect(replayBoard(gap, 60)).toEqual({ score: [1, 0], period: 1, clock: "0:00" });
    expect(replayBoard(gap, 70).period).toBe(2);
  });

  it("runs the clock down through each period, whole seconds, to nothing at the end", () => {
    expect(replayBoard(game, 30).clock).toBe("10:00");
    expect(replayBoard(game, 59.999).clock).toBe("0:01");
    expect(replayBoard(game, 90).clock).toBe("10:00");
  });

  it("counts up when the timeline says so, and runs in the timeline's own seconds without a length", () => {
    expect(replayBoard({ ...game, clock: "up" }, 30).clock).toBe("10:00");
    expect(replayBoard({ ...game, clock: "up" }, 0).clock).toBe("0:00");
    const plain: ReplayTimeline = { ...game, periods: [{ start: 0, end: 600 }, { start: 600, end: 1200 }] };
    expect(replayBoard(plain, 100).clock).toBe("8:20");
    expect(replayBoard({ ...plain, clock: "up" }, 100).clock).toBe("1:40");
  });

  it("numbers the periods by their place, or by the number the timeline gives, in time order", () => {
    expect(replayPeriods({ ...game, periods: [{ start: 60, end: 120 }, { start: 0, end: 60 }] }).map((p) => p.number)).toEqual([1, 2]);
    expect(replayBoard({ ...game, periods: [{ number: 4, start: 0, end: 180 }] }, 10).period).toBe(4);
  });

  it("with no periods is the whole replay as one, with no period number", () => {
    const board = replayBoard({ frames, events: game.events }, 90);
    expect(board).toEqual({ score: [1, 1], clock: "1:30" });
    expect("period" in board).toBe(false);
  });

  it("ignores a period that is not one", () => {
    const odd = { ...game, periods: [{ start: Number.NaN, end: 5 }, { start: 10, end: 5 }] } as unknown as ReplayTimeline;
    expect(replayPeriods(odd)).toHaveLength(1);
  });

  it("writes a clock a board can show: two digits of minutes at most", () => {
    expect(boardClock(0)).toBe("0:00");
    expect(boardClock(1200)).toBe("20:00");
    expect(boardClock(5999)).toBe("99:59");
    expect(boardClock(7200)).toBe("99:59");
    expect(boardClock(-5)).toBe("0:00");
    expect(boardClock(Number.NaN)).toBe("0:00");
  });
});
