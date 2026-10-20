// A raised surface stands on its ground as a solid thing. A dohyō is a block of clay with a flat top (the drawing's own clay and ring of bales, lifted to the mound's height) and four sides; a table tennis table
// is a top on legs over a floor. Whichever way the view is turned, the parts on the far side are drawn first and the top over them, the parts on the near side after it, and the whole floor round the
// raised part stays inside the box. (The dohyō used to be drawn as walls round a sunken floor, because the whole floor was lifted and always drawn under every wall, and the table's far legs showed
// through its top for the same reason.)
import { describe, expect, it } from "vitest";
import { buildTurn, eyeDistance, layoutOf, project, type TurnModel } from "./turn-entry.ts";
import { turnMarkup } from "./turn-entry.ts";
import { depthOf } from "./turn.camera.ts";
import type { Plane } from "./turn.kit.ts";

const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);
const middleOf = (p: Plane, model: TurnModel): [number, number, number] => [
  (p.o[0] + (p.u[0] + p.v[0]) / 2 - model.centre[0]) * model.scale,
  (p.o[1] + (p.u[1] + p.v[1]) / 2 - model.centre[1]) * model.scale,
  (p.o[2] + (p.u[2] + p.v[2]) / 2) * model.scale,
];

describe("a dohyō is a solid block", () => {
  const model = buildTurn({ sport: "sumo" }, {});
  const sides = model.planes.filter((p) => /^mound-\d$/.test(p.id));
  const top = model.planes.find((p) => p.id === "mound-top")!;
  const height = model.uprights.items.find((item) => item.kind === "mound")!.height;

  it("has four sides from the hall's floor up to the clay, and a flat top at the clay's height", () => {
    expect(sides).toHaveLength(4);
    expect(top.crop).toBe(true);
    for (const side of sides) {
      expect(side.o[2]).toBeCloseTo(height, 6);
      expect(side.o[2] + side.v[2]).toBeCloseTo(0, 6);
    }
    // 34 to 60 centimetres.
    expect(height / 3.2808399).toBeGreaterThanOrEqual(0.34);
    expect(height / 3.2808399).toBeLessThanOrEqual(0.6);
    expect(top.o[2]).toBeCloseTo(height, 6);
    expect(top.u[2]).toBe(0);
    expect(top.v[2]).toBe(0);
    // The top is exactly what the four sides enclose.
    const xs = sides.flatMap((p) => [p.o[0], p.o[0] + p.u[0]]);
    const ys = sides.flatMap((p) => [p.o[1], p.o[1] + p.u[1]]);
    expect(top.o[0]).toBeCloseTo(Math.min(...xs), 6);
    expect(top.o[1]).toBeCloseTo(Math.min(...ys), 6);
    expect(top.u[0]).toBeCloseTo(Math.max(...xs) - Math.min(...xs), 6);
    expect(top.v[1]).toBeCloseTo(Math.max(...ys) - Math.min(...ys), 6);
  });

  it("leaves the hall's floor on the ground, and the top is the floor's own drawing in the clay's rectangle", () => {
    expect(model.uprights.lift).toBe(0);
    const markup = turnMarkup({ sport: "sumo" }, {});
    const piece = /<div class="ky-up ky-up-platform"[^>]*data-part="mound-top"[^>]*>(.*?)<\/div><div class="ky-up|<div class="ky-up ky-up-platform"[^>]*data-part="mound-top"[^>]*>(.*)/s.exec(markup);
    expect(piece).not.toBeNull();
    const picture = piece![1] ?? piece![2];
    // The ring of straw bales is on it, and it is a picture only: no second description of the surface.
    expect(picture).toContain("ky-bud-tawara");
    expect(picture).toContain('aria-hidden="true"');
    expect(picture).not.toContain("<title");
    expect(picture).toContain(`viewBox="${Math.round(top.o[0] * 1000) / 1000} ${Math.round(top.o[1] * 1000) / 1000} `);
  });

  it("draws the sides on the far side before the top and the sides on the near side after it, at every turn and every tip", () => {
    for (const pitch of [20, 45, 62, 70, 84]) {
      for (const yaw of range(0, 355, 5)) {
        const view = { yaw, pitch, zoom: 1 };
        const layout = layoutOf(model, view, 960, 600);
        const at = layout.at;
        const topIndex = model.planes.indexOf(top) + 1;
        for (const side of sides) {
          const index = model.planes.indexOf(side) + 1;
          // The side faces away from the eye when the middle of the block is nearer the eye than the side is: the side is then behind the top.
          const sideDepth = depthOf(middleOf(side, model), view, at);
          const topDepth = depthOf(middleOf(top, model), view, at);
          if (Math.abs(sideDepth - topDepth) < 1e-6) continue;
          expect(layout.stack[index] < layout.stack[topIndex], `${side.id} yaw ${yaw} pitch ${pitch}`).toBe(sideDepth < topDepth);
        }
      }
    }
  });

  it("keeps the whole floor round it inside the container at every angle (it used to be cut off at the edges)", () => {
    const [w, h] = [960, 600];
    const d = eyeDistance(w, h);
    const v = model.viewBox;
    const corners = [[v.x, v.y], [v.x + v.w, v.y], [v.x + v.w, v.y + v.h], [v.x, v.y + v.h]].map(([x, y]): [number, number, number] => [(x - model.centre[0]) * model.scale, (y - model.centre[1]) * model.scale, 0]);
    for (const pitch of [0, 30, 62, 84]) {
      for (const yaw of range(0, 355, 5)) {
        const view = { yaw, pitch, zoom: 1 };
        const at = layoutOf(model, view, w, h).at;
        for (const corner of corners) {
          const [x, y] = project(corner, view, at, d);
          expect(Math.abs(x), `x at yaw ${yaw} pitch ${pitch}`).toBeLessThanOrEqual(w / 2);
          expect(Math.abs(y), `y at yaw ${yaw} pitch ${pitch}`).toBeLessThanOrEqual(h / 2);
        }
      }
    }
  });
});

describe("a table tennis table is a top on legs, over a floor", () => {
  const model = buildTurn({ sport: "tabletennis" }, {});
  const legs = model.planes.filter((p) => p.kind === "leg");
  const skirts = model.planes.filter((p) => /^table-(side|end)-/.test(p.id));

  it("has legs that stand on the floor plane, and a shadow under the table on it", () => {
    expect(legs).toHaveLength(8);
    for (const leg of legs) expect(Math.min(leg.o[2], leg.o[2] + leg.u[2], leg.o[2] + leg.v[2])).toBeCloseTo(0, 6);
    const ground = model.planes.find((p) => p.id === "ground")!;
    expect(ground.o[2]).toBe(0);
    expect(model.planes.some((p) => p.id === "table-shadow" && p.o[2] > 0 && p.o[2] < 0.05)).toBe(true);
    expect(model.uprights.lift).toBeGreaterThan(0);
  });

  it("draws what is under the top on the far side before it and what is on the near side after it, at every turn", () => {
    const lift = model.uprights.lift;
    for (const pitch of [30, 62, 70]) {
      for (const yaw of range(0, 355, 5)) {
        const view = { yaw, pitch, zoom: 1 };
        const layout = layoutOf(model, view, 960, 600);
        const floorDepth = depthOf([0, 0, lift * model.scale], view, layout.at);
        for (const part of [...legs, ...skirts]) {
          const index = model.planes.indexOf(part) + 1;
          const depth = depthOf(middleOf(part, model), view, layout.at);
          if (Math.abs(depth - floorDepth) < 1e-6) continue;
          expect(layout.stack[index] < layout.stack[0], `${part.id} yaw ${yaw} pitch ${pitch}`).toBe(depth < floorDepth);
        }
        // Never a leg drawn over the top whose middle is behind it: the far legs are under the top.
        expect(layout.stack[0], `floor yaw ${yaw}`).toBeGreaterThan(1);
      }
    }
  });
});

describe("no raised surface of any sport is drawn over by what is under it", () => {
  it("sorts a lifted floor with the rest: the floor is under the planes only when it is lowest", () => {
    for (const sport of ["tabletennis", "teqball", "sumo", "judo", "dojo", "kyudo"] as const) {
      const model = buildTurn({ sport }, {});
      const lifted = model.uprights.lift > 0;
      const stacks = new Set<number>();
      for (const yaw of range(0, 355, 15)) {
        const layout = layoutOf(model, { yaw, pitch: 62, zoom: 1 }, 960, 600);
        stacks.add(layout.stack[0]);
        if (!lifted) expect(layout.stack[0], `${sport} floor is the lowest`).toBe(1);
      }
      if (lifted) expect(stacks.size, `${sport} floor takes its turn in the order`).toBeGreaterThan(1);
    }
  });
});
