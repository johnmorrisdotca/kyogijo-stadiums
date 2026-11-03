// Dead time in hockey: the rule set (where play starts again, the line-up, the speeds), `addDeadTime` that writes it into a timeline, and the game clock that stands still through it. The example
// game made with them is held to the rules in example-games.stoppages.test.js.
import { describe, expect, it } from "vitest";

import { replayBoard, replayGameClock } from "./replay.board.ts";
import { addDeadTime, deadSeconds, replayStoppages, restartsBetween, stoppageAt } from "./replay.deadtime.ts";
import { HOCKEY_DEAD_TIME, HOCKEY_DOTS, HOCKEY_RULES, hockeyFaceoffDot, hockeyFormation, hockeyStopOf, isHockeyDot } from "./replay.hockey.ts";
import { interpolate, trails } from "./replay.ts";
import type { ReplayObject, ReplayTimeline } from "./replay.types.ts";

/** Moments through a stoppage, from its start to just before its drop. */
const through = (s: { start: number; end: number }, n = 24): number[] => Array.from({ length: n }, (_, i) => s.start + ((s.end - s.start - 0.001) * i) / (n - 1));

describe("hockey's rules: where play starts again", () => {
  it("has the nine spots of Rule 1.9", () => {
    expect(HOCKEY_DOTS).toHaveLength(9);
    for (const [x, y] of HOCKEY_DOTS) expect(isHockeyDot(x, y)).toBe(true);
    expect(isHockeyDot(0, 22)).toBe(false);
  });

  it("puts each kind of stoppage on its spot", () => {
    expect(hockeyFaceoffDot({ reason: "goal", x: 89, y: 1 })).toEqual([0, 0]);
    expect(hockeyFaceoffDot({ reason: "period-start" })).toEqual([0, 0]);
    expect(hockeyFaceoffDot({ reason: "save", x: 80, y: -5 })).toEqual([69, -22]);
    expect(hockeyFaceoffDot({ reason: "frozen", x: -88, y: 10 })).toEqual([-69, 22]);
    // Icing: the end the side that iced it defends, wherever the puck went.
    expect(hockeyFaceoffDot({ reason: "icing", x: 90, y: 20, defends: -1 })).toEqual([-69, 22]);
    expect(hockeyFaceoffDot({ reason: "penalty", x: 0, y: -1, defends: 1 })).toEqual([69, -22]);
    // Offside: just outside the zone the offending side attacks.
    expect(hockeyFaceoffDot({ reason: "offside", x: 30, y: -9, defends: -1 })).toEqual([20, -22]);
    expect(hockeyFaceoffDot({ reason: "offside", x: -30, y: 9, defends: 1 })).toEqual([-20, 22]);
    // Any other whistle: the zone where play stopped, never centre ice.
    expect(hockeyFaceoffDot({ reason: "whistle", x: 50, y: 3 })).toEqual([69, 22]);
    expect(hockeyFaceoffDot({ reason: "whistle", x: -5, y: -3 })).toEqual([-20, -22]);
    expect(hockeyFaceoffDot({ reason: "whistle", x: 0, y: 0 })).toEqual([20, 22]);
    for (const reason of ["goal", "save", "frozen", "icing", "offside", "penalty", "whistle", "anything"]) {
      for (const x of [-95, -50, -10, 0, 10, 50, 95]) for (const y of [-40, 0, 40]) expect(isHockeyDot(...hockeyFaceoffDot({ reason, x, y, defends: x > 0 ? 1 : -1 }))).toBe(true);
    }
  });

  it("lines a side up by Rule 76 at every spot: the centres on the dot, nobody else in the circle, the goaltenders in their crease, everyone on the ice", () => {
    for (const dot of HOCKEY_DOTS) {
      const sides = [hockeyFormation(dot, 1), hockeyFormation(dot, -1)];
      for (const [n, f] of sides.entries()) {
        const attacks = n === 0 ? 1 : -1;
        expect(Math.hypot(f.C[0] - dot[0], f.C[1] - dot[1])).toBeLessThanOrEqual(3);
        // The centre stands on his own side of the dot.
        expect(Math.sign(f.C[0] - dot[0])).toBe(-attacks);
        for (const role of ["LW", "RW", "LD", "RD"] as const) {
          expect(Math.hypot(f[role][0] - dot[0], f[role][1] - dot[1])).toBeGreaterThan(15);
          // Every skater is on his own side of the dot (Rule 76), and on the ice.
          expect(Math.sign(f[role][0] - dot[0])).toBe(-attacks);
          expect(Math.abs(f[role][0])).toBeLessThan(89);
          expect(Math.abs(f[role][1])).toBeLessThan(42.5);
        }
        expect(f.G).toEqual([-85 * attacks, 0]);
      }
    }
  });

  it("reads the NHL's words for a stoppage", () => {
    expect(hockeyStopOf("stoppage", "goalie-stopped-after-sog")).toBe("save");
    expect(hockeyStopOf("stoppage", "puck-frozen")).toBe("frozen");
    expect(hockeyStopOf("stoppage", "offside")).toBe("offside");
    expect(hockeyStopOf("stoppage", "tv-timeout")).toBe("whistle");
    expect(hockeyStopOf("penalty")).toBe("penalty");
    expect(hockeyStopOf("goal")).toBe("goal");
    expect(hockeyStopOf("hit")).toBeUndefined();
    expect(hockeyStopOf("delayed-penalty")).toBeUndefined();
  });
});

describe("dead time written into a timeline", () => {
  const skater = (id: string, team: "home" | "away", x: number, y: number): ReplayObject => ({ id, team, x, y });
  // A goal at 10 s: the puck in the net, two skaters near it; the restart at 10.04 with them lined up at centre, and a new skater on for one of them.
  const before: ReplayTimeline = {
    frames: [
      { t: 0, objects: [skater("h1", "home", 0, 0), skater("h2", "home", 10, 5), skater("a1", "away", 5, 0), { id: "puck", team: "puck", x: 0, y: 0 }] },
      { t: 10, objects: [skater("h1", "home", 80, 0), skater("h2", "home", 70, 5), skater("a1", "away", 75, 0), { id: "puck", team: "puck", x: 90, y: 0 }] },
      { t: 10.04, objects: [skater("h1", "home", -2.5, 0), skater("h3", "home", -5, 17), skater("a1", "away", 2.5, 0), { id: "puck", team: "puck", x: 0, y: 0 }] },
      { t: 20, objects: [skater("h1", "home", 20, 0), skater("h3", "home", 20, 17), skater("a1", "away", 20, 0), { id: "puck", team: "puck", x: 25, y: 0 }] },
    ],
    events: [{ t: 9.5, kind: "goal", team: "home" }, { t: 10.04, kind: "faceoff", x: 0, y: 0 }, { t: 15, kind: "shot", team: "away", until: 16 }],
    periods: [{ start: 0, end: 20, length: 1200 }],
  };
  const after = addDeadTime(before, [{ t: 10, until: 10.04, reason: "goal", x: 0, y: 0 }], HOCKEY_RULES);
  const stop = replayStoppages(after)[0];

  it("opens the instant into a stoppage, and moves what came after it on by as much", () => {
    expect(stop).toMatchObject({ start: 10, reason: "goal", x: 0, y: 0 });
    const dead = stop.end - stop.start;
    expect(dead).toBeGreaterThan(HOCKEY_DEAD_TIME.pause.goal + HOCKEY_DEAD_TIME.least);
    expect(after.events?.map((e) => [e.kind, e.t])).toEqual([["goal", 9.5], ["faceoff", stop.end], ["shot", Math.round((15 - 0.04 + dead) * 100) / 100]]);
    expect(after.periods?.[0]).toMatchObject({ start: 0, length: 1200 });
    expect(after.frames.at(-1)?.t).toBeCloseTo(20 - 0.04 + dead, 5);
  });

  it("keeps the game clock as it was: frozen through the stoppage, and the same before and after it", () => {
    // The instant between the play and the restart (0.04 s here) becomes part of the stoppage: the game clock is the same to a second or so of game time.
    const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(2.5);
    const frozen = new Set(through(stop).map((t) => replayBoard(after, t).clock));
    expect(frozen.size).toBe(1);
    near(replayGameClock(after, stop.start).played, replayGameClock(before, 10).played);
    near(replayGameClock(after, 5).played, replayGameClock(before, 5).played);
    near(replayGameClock(after, stop.end + 5).played, replayGameClock(before, 15.04).played);
    expect(replayGameClock(after, stop.start + 1).running).toBe(false);
    expect(replayGameClock(after, stop.end).running).toBe(true);
    expect(deadSeconds(after, 0, 100)).toBeCloseTo(stop.end - stop.start, 5);
  });

  it("leaves the puck where it stopped, then out of sight, then on the dot at the drop, and its trail does not cross the gap", () => {
    for (const t of through(stop)) {
      const puck = interpolate(after, t).find((o) => o.id === "puck");
      if (puck !== undefined) expect([puck.x, puck.y]).toEqual([90, 0]);
    }
    expect(interpolate(after, stop.end - 0.5).find((o) => o.id === "puck")).toBeUndefined();
    expect(interpolate(after, stop.end).find((o) => o.id === "puck")).toMatchObject({ x: 0, y: 0 });
    const trail = trails(after, stop.end + 0.5, 2, { teams: ["puck"] })[0];
    expect(trail.points.every(([x]) => x < 10)).toBe(true);
  });

  it("takes a player going off to his bench and brings the next one on from it, and has everyone in place before the drop", () => {
    const bench = HOCKEY_DEAD_TIME.bench.home;
    const seen = (id: string, t: number) => interpolate(after, t).find((o) => o.id === id);
    const times = after.frames.map((f) => f.t).filter((t) => t >= stop.start && t <= stop.end);
    const last = Math.max(...times.filter((t) => seen("h2", t) !== undefined));
    expect([seen("h2", last)?.x, seen("h2", last)?.y]).toEqual([...bench]);
    const first = Math.min(...times.filter((t) => seen("h3", t) !== undefined));
    expect([seen("h3", first)?.x, seen("h3", first)?.y]).toEqual([...bench]);
    expect(first).toBeGreaterThan(last);
    for (const id of ["h1", "h3", "a1"]) expect(seen(id, stop.end - HOCKEY_DEAD_TIME.hold)).toEqual(seen(id, stop.end));
  });

  it("is told the restarts as they go by", () => {
    expect(restartsBetween(after, 0, stop.end - 0.01)).toEqual([]);
    expect(restartsBetween(after, stop.end - 0.01, stop.end)).toHaveLength(1);
    expect(stoppageAt(after, stop.start)).toBeDefined();
    expect(stoppageAt(after, stop.end)).toBeUndefined();
  });
});
