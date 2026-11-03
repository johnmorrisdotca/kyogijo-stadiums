// A replay on the 3D view, as data: the floor is the frame without the players, the players stand up as discs, and it is pure.
import { describe, expect, it } from "vitest";

import { drawFrame } from "./replay.ts";
import type { ReplayTimeline } from "./replay.types.ts";
import { buildTurn } from "./turn.model.ts";
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
