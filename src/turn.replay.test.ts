// A replay on the 3D view, as data: the floor is the frame without the players, the players stand up as discs, and it is pure.
import { describe, expect, it } from "vitest";

import { drawFrame } from "./replay.ts";
import type { ReplayTimeline } from "./replay.types.ts";
import { buildTurn } from "./turn.model.ts";
import { boardKey, hungBoardPlanes, hungBoards } from "./turn.replay.board.ts";
import { discMarkup, discSize, keepOnFloor, moveDisc, playingArea, replayTurnModel } from "./turn.replay.ts";

const timeline: ReplayTimeline = {
  from: "nhl-api",
  frames: [0, 1, 2, 3].map((t) => ({
    t,
    objects: [
      { id: "h9", team: "home", number: 9, x: 10 + t * 12, y: 5 },
      { id: "a4", team: "away", number: 4, x: 40 - t * 5, y: -8 },
      ...(t >= 2 ? [{ id: "ref", team: "official" as const, x: 0, y: 30 }] : []),
      { id: "puck", team: "puck", x: 10 + t * 12, y: 5 },
    ],
  })),
  events: [{ t: 2, kind: "goal", team: "home", x: 34, y: 5, x2: 89, y2: 0 }],
};
const model = buildTurn({ sport: "nhl" });

describe("a replay on the 3D view, as data", () => {
  it("is pure: the same model, timeline and time give the same model, and the model given is not changed", () => {
    const before = JSON.stringify(model);
    const a = replayTurnModel(model, timeline, 2.5);
    expect(JSON.stringify(a.model)).toBe(JSON.stringify(replayTurnModel(model, timeline, 2.5).model));
    expect(JSON.stringify(model)).toBe(before);
    expect(JSON.stringify(replayTurnModel(model, timeline, 1).model)).not.toBe(JSON.stringify(a.model));
  });

  it("stands every player and official up as a disc after the model's own planes, and says who is not on the surface yet", () => {
    const laid = replayTurnModel(model, timeline, 1);
    expect([...laid.discs.keys()]).toEqual(["h9", "a4", "ref"]);
    expect(laid.discs.get("ref")?.on).toBe(false);
    expect(laid.discs.get("h9")?.on).toBe(true);
    expect(laid.model.planes.slice(0, model.planes.length)).toEqual(model.planes);
    const disc = laid.discs.get("h9")!.plane;
    expect(disc).toMatchObject({ kind: "player", billboard: true, lean: true, id: "replay-h9" });
    // Its middle over the player's place, its lower edge on the floor.
    expect(disc.o[2] + disc.v[2]).toBeCloseTo(model.uprights.lift, 6);
  });

  it("draws the floor without the players, their numbers and the officials, and with the puck, its trail and the goal", () => {
    const laid = replayTurnModel(model, timeline, 2.5);
    expect(laid.model.floor).not.toMatch(/-replay-players"/);
    expect(laid.model.floor).not.toMatch(/-replay-numbers"/);
    expect(laid.model.floor).not.toMatch(/-replay-officials"/);
    expect(laid.model.floor).toMatch(/-replay-ball"/);
    expect(laid.model.floor).toMatch(/-replay-trails"/);
    expect(laid.model.floor).toMatch(/-replay-events"/);
    expect(keepOnFloor({ id: "replay-players" })).toBe(false);
    expect(keepOnFloor({ id: "replay-ball" })).toBe(true);
  });

  it("with `stand: false` keeps the players flat on the floor, as the flat replay draws them, and stands nothing up", () => {
    const laid = replayTurnModel(model, timeline, 2.5, { stand: false });
    expect(laid.discs.size).toBe(0);
    expect(laid.model.planes).toEqual(model.planes);
    expect(laid.model.floor).toBe(drawFrame(laid.floorOptions, timeline, 2.5));
  });

  it("sizes a disc by the playing surface, not the ground round it: about 6.5 feet on a rink, scaled by the look", () => {
    expect(discSize(playingArea(model))).toBeCloseTo(6.5, 0);
    expect(discSize(playingArea(model), { scale: 2 })).toBeCloseTo(2 * discSize(playingArea(model)), 6);
    const arena = buildTurn({ sport: "nhl", arena: "climate-pledge-arena", crowd: { real: true } } as never);
    expect(discSize(playingArea(arena))).toBeLessThan(10);
  });

  it("draws each side's mark in the flat replay's classes, and escapes a number from outside", () => {
    expect(discMarkup({ team: "home", number: 9 }, 6, "nhl", undefined, "")).toMatch(/<circle class="ky-h"/);
    expect(discMarkup({ team: "away", number: 4 }, 6, "nhl", "dark", "--ky-layer-away:#123456")).toMatch(/<rect class="ky-a".*data-theme="dark"|data-theme="dark".*<rect class="ky-a"/);
    const hostile = discMarkup({ team: "home", number: '<script>alert(1)</script>"' }, 6, "nhl", undefined, '--x:1"><script>');
    expect(hostile).not.toContain("<script>");
    expect(hostile).toContain("&lt;script&gt;");
  });

  it("moves a disc in place, so that a page moving many makes no new planes", () => {
    const laid = replayTurnModel(model, timeline, 0);
    const plane = laid.discs.get("h9")!.plane;
    moveDisc(plane, 50, 7, laid.size, 0);
    expect(plane.o[0] + plane.u[0] / 2).toBeCloseTo(50, 6);
    expect(plane.o[1]).toBe(7);
  });
});

describe("a replay on the scoreboard hung over the surface", () => {
  const game: ReplayTimeline = { ...timeline, periods: [{ start: 0, end: 3, length: 1200 }] };
  const arena = buildTurn({ sport: "nhl", crowd: { real: true, boards: { score: [3, 2] } } }, { venue: true });
  const faces = (m: { planes: { id: string; svg: string }[] }): string[] => m.planes.filter((p) => /^centre-board-(south|north|east|west)$/.test(p.id)).map((p) => p.svg);

  it("finds the board the venue hung, with what it was made from", () => {
    expect(hungBoards(arena)).toHaveLength(1);
    expect(hungBoards(model)).toHaveLength(0);
    expect(hungBoards(buildTurn({ sport: "nhl", crowd: { real: true } }, { venue: true }))).toHaveLength(0);
  });

  it("draws the faces with the replay's score and clock instead of the options', in the same planes", () => {
    const at0 = replayTurnModel(arena, game, 0);
    const at3 = replayTurnModel(arena, game, 3);
    expect(at0.board).toEqual({ score: [0, 0], period: 1, clock: "20:00" });
    expect(at3.board).toEqual({ score: [1, 0], period: 1, clock: "0:00" });
    expect(boardKey(at0.board!)).toBe("0-0 1 20:00");
    // The same planes, in the same order and places: only the faces' drawings differ.
    expect(at0.model.planes.map((p) => p.id)).toEqual(arena.planes.map((p) => p.id).concat(at0.model.planes.map((p) => p.id).slice(arena.planes.length)));
    expect(at0.model.planes.slice(0, arena.planes.length).map((p) => p.o.join())).toEqual(arena.planes.map((p) => p.o.join()));
    expect(faces(at0.model)).toHaveLength(4);
    expect(faces(at0.model)).not.toEqual(faces(arena));
    expect(faces(at0.model)).not.toEqual(faces(at3.model));
    // A time with the same board is the same drawing.
    expect(faces(replayTurnModel(arena, game, 0.0001).model)).toEqual(faces(at0.model));
  });

  it("does not change the model it is given, and a model with no board is as it was", () => {
    const before = JSON.stringify(arena);
    replayTurnModel(arena, game, 2);
    expect(JSON.stringify(arena)).toBe(before);
    expect(replayTurnModel(model, game, 2).board).toBeUndefined();
    expect(replayTurnModel(arena, game, 2, { board: false }).board).toBeUndefined();
    expect(faces(replayTurnModel(arena, game, 2, { board: false }).model)).toEqual(faces(arena));
  });

  it("writes only digits and a colon for the clock, and no text", () => {
    const [hung] = hungBoards(arena);
    const south = hungBoardPlanes(hung, { score: [0, 0], period: 1, clock: "<script>" }).find((p) => p.id === "centre-board-south")!;
    expect(south.svg).not.toContain("<script");
    const live = hungBoardPlanes(hung, { score: [10, 2], period: 3, clock: "19:20" }).find((p) => p.id === "centre-board-south")!;
    expect(live.svg).not.toContain("<text");
    expect(live.svg.length).toBeGreaterThan(south.svg.length);
  });
});
