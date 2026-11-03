// The made-up game's generator, on a tiny invented play-by-play: nothing of a real game is in the repository, and nothing of the source survives in the game but the kinds of its events.
import { describe, expect, it } from "vitest";

import { fictionGame, rosterOf, SIDES } from "./game-fiction.mjs";

const TEAM_A = 501;
const TEAM_B = 502;
const play = (period, clock, typeDescKey, owner, x, y, side = "left") => ({ sortOrder: 0, periodDescriptor: { number: period }, timeInPeriod: clock, typeDescKey, homeTeamDefendingSide: side, details: x === undefined ? { eventOwnerTeamId: owner } : { xCoord: x, yCoord: y, eventOwnerTeamId: owner, shootingPlayerId: 99999 } });
const plays = [
  play(1, "00:00", "faceoff", TEAM_A, 0, 0),
  play(1, "00:20", "shot-on-goal", TEAM_A, 60, 10),
  play(1, "00:40", "giveaway", TEAM_B, -30, -20),
  play(1, "01:10", "goal", TEAM_B, -70, 5),
  play(1, "01:10", "faceoff", TEAM_A, 0, 0),
  play(1, "02:00", "stoppage", undefined),
  play(2, "00:00", "faceoff", TEAM_B, 0, 0, "right"),
  play(2, "00:30", "takeaway", TEAM_A, 20, 15, "right"),
  play(2, "00:45", "missed-shot", TEAM_A, 70, -12, "right"),
  play(3, "00:00", "faceoff", TEAM_A, 0, 0),
  play(3, "01:00", "goal", TEAM_A, 75, 2),
  play(3, "02:00", "goal", TEAM_B, -80, 0),
  play(4, "01:00", "goal", TEAM_A, 80, 0),
].map((p, i) => ({ ...p, sortOrder: i }));
const pbp = { homeTeam: { id: TEAM_A }, awayTeam: { id: TEAM_B }, plays };

describe("the made-up game", () => {
  const game = fictionGame(pbp);

  it("is the same every time from the same play-by-play and seed, and another seed gives another", () => {
    expect(JSON.stringify(fictionGame(pbp))).toBe(JSON.stringify(game));
    expect(JSON.stringify(fictionGame(pbp, { seed: 7 }))).not.toBe(JSON.stringify(game));
  });

  it("has three periods and no overtime, each opening at centre ice, and the frames run forward", () => {
    expect(game.periods.map((p) => p.number)).toEqual([1, 2, 3]);
    const times = game.timeline.frames.map((f) => f.t);
    expect(times.every((t, i) => i === 0 || t > times[i - 1])).toBe(true);
    for (const p of game.periods) {
      const first = game.timeline.frames.find((f) => f.t === p.start);
      expect(first.objects.find((o) => o.id === "puck")).toMatchObject({ x: 0, y: 0 });
    }
  });

  it("keeps the kinds of the events, turns the last goal of the away side into a save, and leaves the overtime out", () => {
    const kinds = new Set(game.timeline.events.map((e) => e.kind));
    for (const kind of kinds) expect(["pass", "shot", "goal", "whistle"]).toContain(kind);
    // The play-by-play's away side is the made-up home side; its goals stand, the other side's last one is saved, and the overtime goal is gone.
    expect(game.score).toMatchObject({ home: 2, away: 0 });
    expect(game.timeline.events.filter((e) => e.kind === "goal").map((e) => e.team)).toEqual(["home", "home"]);
  });

  it("puts five skaters and a goaltender of each side on the ice in every frame, with numbers from the invented rosters, on the rink", () => {
    const numbers = new Set([...rosterOf("home"), ...rosterOf("away")].map((p) => p.id));
    for (const frame of game.timeline.frames) {
      expect(frame.objects).toHaveLength(13);
      for (const o of frame.objects) {
        if (o.id !== "puck") expect(numbers.has(o.id)).toBe(true);
        expect(Math.abs(o.x)).toBeLessThanOrEqual(97);
        expect(Math.abs(o.y)).toBeLessThanOrEqual(40);
      }
      const goalies = frame.objects.filter((o) => o.id === "c30" || o.id === "j1");
      for (const g of goalies) expect(Math.abs(g.x)).toBe(85);
    }
  });

  it("re-times the game: no gap of the source survives, and it plays in seconds, not minutes", () => {
    expect(game.periods.at(-1).end).toBeLessThan(60);
    const shot = game.timeline.events.find((e) => e.kind === "shot");
    expect(shot.t).not.toBe(20);
  });

  it("says nothing of the source: no id, clock or team of it is in the file, and the sides are invented", () => {
    const text = JSON.stringify(game);
    for (const word of [String(TEAM_A), String(TEAM_B), "99999", "00:20", "timeInPeriod", "typeDescKey"]) expect(text).not.toContain(word);
    expect(game.teams.home.name).toEqual(SIDES.home.name);
    expect(game.rosters.home.every((p) => typeof p.name.en === "string" && typeof p.name.ja === "string")).toBe(true);
  });
});
