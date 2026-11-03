// Hockey's penalties: the rules on the game clock (`hockeyPenaltyEnds`: the minutes of each kind, power-play goals, coincidental penalties, never fewer than three skaters), the kinds of the NHL's
// play-by-play, the box, and what a timeline's penalties give the board: each side's strength and each penalty's time left, counted on the game clock that stops in a stoppage.
import { describe, expect, it } from "vitest";

import { penaltiesAt, replayBoard, replayGameTime } from "./replay.board.ts";
import { HOCKEY_PENALTY_MINUTES, hockeyPenaltyBox, hockeyPenaltyEnds, hockeyPenaltyKind } from "./replay.hockey.ts";
import type { ReplayTimeline } from "./replay.types.ts";

const ends = (calls: Parameters<typeof hockeyPenaltyEnds>[0], goals: Parameters<typeof hockeyPenaltyEnds>[1] = []) => hockeyPenaltyEnds(calls, goals).map((s) => [s.from, s.to, s.short, s.byGoal]);

describe("hockey's penalties on the game clock", () => {
  it("serves each kind for its minutes", () => {
    expect(HOCKEY_PENALTY_MINUTES).toEqual({ minor: 2, "bench-minor": 2, "double-minor": 4, major: 5, misconduct: 10 });
    for (const kind of ["minor", "double-minor", "major", "misconduct"] as const) expect(ends([{ team: "away", kind, at: 100 }])).toEqual([[100, 100 + HOCKEY_PENALTY_MINUTES[kind] * 60, kind !== "misconduct", false]]);
  });

  it("ends a minor at a power-play goal, but not a major, and takes one part off a double minor", () => {
    expect(ends([{ team: "away", kind: "minor", at: 100 }], [{ team: "home", at: 160 }])).toEqual([[100, 160, true, true]]);
    expect(ends([{ team: "away", kind: "major", at: 100 }], [{ team: "home", at: 160 }])).toEqual([[100, 400, true, false]]);
    expect(ends([{ team: "away", kind: "double-minor", at: 0 }], [{ team: "home", at: 30 }])).toEqual([[0, 150, true, false]]);
    expect(ends([{ team: "away", kind: "double-minor", at: 0 }], [{ team: "home", at: 30 }, { team: "home", at: 100 }])).toEqual([[0, 100, true, true]]);
    // A goal by the side that is short, or at even strength, ends nothing; a goal at the moment of the call comes before it.
    expect(ends([{ team: "away", kind: "minor", at: 100 }], [{ team: "away", at: 160 }])).toEqual([[100, 220, true, false]]);
    expect(ends([{ team: "away", kind: "minor", at: 100 }], [{ team: "home", at: 100 }])).toEqual([[100, 220, true, false]]);
    // Two minors against one side: the goal ends the one with less time left.
    expect(ends([{ team: "away", kind: "minor", at: 0 }, { team: "away", kind: "minor", at: 30 }], [{ team: "home", at: 60 }])).toEqual([[0, 60, true, true], [30, 150, true, false]]);
  });

  it("keeps a side at three skaters at least: a third penalty's time waits for one of the first two to end", () => {
    expect(ends([{ team: "away", kind: "minor", at: 0 }, { team: "away", kind: "minor", at: 10 }, { team: "away", kind: "minor", at: 20 }])).toEqual([[0, 120, true, false], [10, 130, true, false], [120, 240, true, false]]);
  });

  it("keeps the strength even for coincidental penalties and a misconduct", () => {
    expect(ends([{ team: "away", kind: "minor", at: 0 }, { team: "home", kind: "minor", at: 0 }], [{ team: "home", at: 30 }])).toEqual([[0, 120, false, false], [0, 120, false, false]]);
    expect(ends([{ team: "away", kind: "misconduct", at: 0 }], [{ team: "home", at: 30 }])).toEqual([[0, 600, false, false]]);
  });

  it("reads the NHL's kinds, and puts each side's box across the ice from the benches", () => {
    expect([hockeyPenaltyKind("MIN", 2), hockeyPenaltyKind("MIN", 4), hockeyPenaltyKind("BEN", 2), hockeyPenaltyKind("MAJ", 5), hockeyPenaltyKind("MIS", 10), hockeyPenaltyKind("PS", 0), hockeyPenaltyKind(undefined, 5)]).toEqual(["minor", "double-minor", "bench-minor", "major", "misconduct", undefined, "major"]);
    const [home, away] = [hockeyPenaltyBox("home"), hockeyPenaltyBox("away")];
    expect(home[1]).toBeGreaterThan(42.5);
    expect(away[1]).toBeGreaterThan(42.5);
    expect(home[0]).toBeLessThan(0);
    expect(away[0]).toBeGreaterThan(0);
  });
});

describe("a timeline's penalties", () => {
  // A period of 72 s on the replay's clock with 12 s of stoppages: 60 s of play that are 20 minutes of game clock (20 game seconds a second). A minor called at 10 s (play stops till 12 s) runs 6 s of play,
  // 2 before a goal's stoppage from 14 to 24 s and 4 after it.
  const timeline: ReplayTimeline = {
    frames: [{ t: 0, objects: [] }, { t: 72, objects: [] }],
    periods: [{ start: 0, end: 72, length: 1200 }],
    stoppages: [{ start: 10, end: 12 }, { start: 14, end: 24, reason: "goal" }],
    penalties: [{ team: "away", by: "a4", start: 10, end: 28, minutes: 2 }],
  };

  it("counts its time on the game clock: it stands still in a stoppage", () => {
    expect(replayGameTime(timeline, 28) - replayGameTime(timeline, 10)).toBeCloseTo(120, 5);
    expect(penaltiesAt(timeline, 11).served[0].left).toBe(120);
    expect(penaltiesAt(timeline, 13).served[0].left).toBeCloseTo(100, 9);
    expect(penaltiesAt(timeline, 15).served[0].left).toBe(penaltiesAt(timeline, 23).served[0].left);
  });

  it("gives the board each side's strength and the penalty's clock, and nothing once he is out", () => {
    expect(replayBoard(timeline, 13)).toMatchObject({ strength: [5, 4], penalties: [{ team: "away", left: "1:40", short: true }] });
    expect(replayBoard(timeline, 28)).toMatchObject({ strength: [5, 5], penalties: [] });
    // A timeline with no penalties has no strength on its board.
    expect(replayBoard({ ...timeline, penalties: undefined }, 13).strength).toBeUndefined();
  });

  it("never counts fewer than three skaters, and none short for a penalty that is not", () => {
    const many: ReplayTimeline = { ...timeline, penalties: [0, 1, 2].map((i) => ({ team: "home" as const, start: 1 + i, end: 60, minutes: 2 })) };
    expect(penaltiesAt(many, 5).strength).toEqual([3, 5]);
    const even: ReplayTimeline = { ...timeline, penalties: [{ team: "home", start: 1, end: 60, minutes: 10, short: false }] };
    expect(penaltiesAt(even, 5).strength).toEqual([5, 5]);
  });
});
