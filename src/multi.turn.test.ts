// A tournament layout in 3D: each surface stands where the layout puts it and as it stands on its own page, the surrounds, chairs and scoreboards stand on the floor, the stands of the stadium round it, the tables
// are tops on legs that are drawn in the right order from every side, and the whole floor is in the box at every angle.
import { describe, expect, it } from "vitest";
import { MULTI_PRESETS } from "./multi.data.ts";
import { multiLayout } from "./multi.ts";
import { SURROUND_HEIGHT, buildMultiTurn, multiPresets, multiTurnMarkup } from "./multi.turn.ts";
import { multiDrawing } from "./multi.draw.ts";
import { drawMulti } from "./multi-entry.ts";
import { presetOf, type TurnModel } from "./turn-entry.ts";
import { fadeOf, type Plane } from "./turn.kit.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import type { MultiOptions } from "./multi.types.ts";

const corners = (p: Plane): [number, number, number][] => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]): [number, number, number] => [p.o[0] + a * p.u[0] + b * p.v[0], p.o[1] + a * p.u[1] + b * p.v[1], p.o[2] + a * p.u[2] + b * p.v[2]]);
const byId = (model: TurnModel, id: string): Plane => {
  const found = model.planes.find((p) => p.id === id);
  if (found === undefined) throw new Error(`no plane ${id}`);
  return found;
};
const itemsOf = (model: TurnModel, kind: string) => model.uprights.items.filter((item) => item.kind === kind);

describe("every preset stands up in 3D", () => {
  it("makes a model with planes that are all finite, uniquely named, on or over the floor, and a flat drawing for a browser that cannot", () => {
    for (const spec of MULTI_PRESETS) {
      for (const stadium of [false, true]) {
        const options: MultiOptions = { preset: spec.id, stadium };
        const model = buildMultiTurn(options);
        const where = `${spec.id} stadium ${stadium}`;
        const ids = model.planes.map((p) => p.id);
        expect(new Set(ids).size, where).toBe(ids.length);
        for (const p of model.planes) {
          expect([...p.o, ...p.u, ...p.v].every(Number.isFinite), `${where} ${p.id}`).toBe(true);
          expect(Math.min(...corners(p).map((c) => c[2])), `${where} ${p.id} is not under the floor`).toBeGreaterThanOrEqual(-1e-9);
        }
        expect(model.floor.startsWith("<svg"), where).toBe(true);
        expect(model.flat, where).toBe(drawMulti(options));
        expect(model.turnable).toBe(true);
        expect(model.uprights.lift).toBe(0);
        expect(model.title.length).toBeGreaterThan(0);
        // The floor draws no crowd and no table, the 3D view stands them: the flat drawing has the crowd.
        expect(model.floor.includes("ky-crowd"), where).toBe(false);
        expect(model.flat?.includes("ky-crowd") === true, where).toBe(stadium);
      }
    }
  });

  it("is made of the surfaces the layout has, one for each cell, standing as they do on their own page", () => {
    for (const [id, nets, perCell] of [["tabletennis-4", 4, 8], ["tabletennis-8", 8, 8], ["pickleball-2x4", 8, 0], ["badminton-1x4", 4, 0], ["tennis-1x3", 3, 0]] as const) {
      const model = buildMultiTurn({ preset: id });
      expect(itemsOf(model, "net"), id).toHaveLength(nets);
      expect(itemsOf(model, "netposts"), id).toHaveLength(nets);
      // A table has four legs, each two crossed strips, and they stand on the floor.
      const legs = model.planes.filter((p) => p.kind === "leg");
      expect(legs, id).toHaveLength(nets * perCell);
      for (const leg of legs) expect(Math.min(...corners(leg).map((c) => c[2])), `${id} ${leg.id}`).toBeCloseTo(0, 6);
    }
    // Nothing stands on a judo, a karate or a curling floor: it is flat, as on its own page.
    for (const id of ["judo-1x3", "karate-2x4", "curling-1x4"]) expect(buildMultiTurn({ preset: id }).planes, id).toHaveLength(0);
  });

  it("puts each table's top at the table's height over the cell's rectangle, with the table's own drawing on it, and draws the table nowhere else", () => {
    const layout = multiLayout({ preset: "tabletennis-4" });
    const model = buildMultiTurn({ preset: "tabletennis-4" });
    for (const cell of layout.cells) {
      const top = byId(model, `c${cell.n}-table-top`);
      expect(top.o[0], `x ${cell.n}`).toBeCloseTo(cell.x, 6);
      expect(top.o[1], `y ${cell.n}`).toBeCloseTo(cell.y, 6);
      expect(top.u).toEqual([expect.closeTo(cell.w, 6), expect.closeTo(0, 9), expect.closeTo(0, 9)]);
      expect(top.v[1]).toBeCloseTo(cell.h, 6);
      // 76 cm, the table's height.
      expect(top.o[2] / FEET_PER_METRE).toBeCloseTo(0.76, 2);
      expect(top.svg).toContain("ky-nt-line");
      // The net is over the middle of the top, across it.
      const net = byId(model, `c${cell.n}-net`);
      expect(net.o[0] + net.u[0] / 2).toBeCloseTo(cell.x + cell.w / 2, 6);
      expect(Math.abs(net.u[0])).toBeLessThan(1e-9);
    }
    // The floor carries a shadow in each table's place, and the drawing of the table is in the top and nowhere else: one net line to a table in the whole view.
    expect(model.floor.match(/class="ky-mu-shadow"/g)).toHaveLength(4);
    expect(model.floor.includes('class="ky-nt-line"')).toBe(false);
    expect(multiTurnMarkup({ preset: "tabletennis-4" }).match(/class="ky-nt-line"/g)).toHaveLength(4);
  });

  it("turns a court a quarter, and the net with it, where the layout stands its surfaces across", () => {
    const layout = multiLayout({ preset: "badminton-1x4" });
    const model = buildMultiTurn({ preset: "badminton-1x4" });
    expect(layout.cells.every((cell) => cell.turn)).toBe(true);
    for (const cell of layout.cells) {
      const net = byId(model, `c${cell.n}-net`);
      // The net of a court that stands across the layout runs along it, at the middle of the court's length.
      expect(Math.abs(net.u[1]), `net ${cell.n}`).toBeLessThan(1e-9);
      expect(Math.abs(net.u[0]), `net ${cell.n}`).toBeGreaterThan(15);
      const [x0, x1] = [Math.min(net.o[0], net.o[0] + net.u[0]), Math.max(net.o[0], net.o[0] + net.u[0])];
      expect(x0).toBeGreaterThanOrEqual(cell.x - 0.01);
      expect(x1).toBeLessThanOrEqual(cell.x + cell.w + 0.01);
      expect(net.o[1]).toBeCloseTo(cell.y + cell.h / 2, 3);
    }
  });

  it("keeps every surface inside the hall, whichever way the hall turns the layout", () => {
    // A hall of 20 m by 40 m takes badminton's 39.4 m by 17.4 m only turned a quarter.
    const options: MultiOptions = { preset: "badminton-1x4", venue: { length: 20, width: 40 } };
    const drawing = multiDrawing(options, true);
    expect(drawing.frame.turned).toBe(true);
    const model = buildMultiTurn(options);
    const { w, h } = drawing.frame.hall;
    for (const p of model.planes.filter((one) => one.kind !== "chair" && one.kind !== "desk")) {
      for (const [x, y] of corners(p)) {
        expect(x, p.id).toBeGreaterThanOrEqual(-0.01);
        expect(x, p.id).toBeLessThanOrEqual(w + 0.01);
        expect(y, p.id).toBeGreaterThanOrEqual(-0.01);
        expect(y, p.id).toBeLessThanOrEqual(h + 0.01);
      }
    }
    // The court's length is now along x, so the net runs along y.
    const net = byId(model, "c1-net");
    expect(Math.abs(net.u[0])).toBeLessThan(1e-9);
    expect(Math.abs(net.u[1])).toBeGreaterThan(15);
    // And the net is still over the middle of its court's length: both nets stand inside the floor the layout takes in the hall.
    const [x, y] = [net.o[0], net.o[1]];
    expect(x).toBeGreaterThan(drawing.frame.ox);
    expect(x).toBeLessThan(drawing.frame.ox + drawing.frame.lw);
    expect(y).toBeGreaterThan(drawing.frame.oy - 0.01);
  });
});

describe("what only a layout has stands on its floor", () => {
  const model = buildMultiTurn({ preset: "tabletennis-4" });

  it("puts a surround of 75 cm round each area, in short pieces, that gives way only to an eye nearly level on its side", () => {
    const surrounds = model.planes.filter((p) => p.kind === "surround");
    expect(surrounds.length).toBeGreaterThan(16);
    for (const p of surrounds) {
      expect(Math.max(...corners(p).map((c) => c[2])), p.id).toBeCloseTo(SURROUND_HEIGHT, 6);
      expect(Math.min(...corners(p).map((c) => c[2])), p.id).toBeCloseTo(0, 6);
      expect(Math.hypot(...p.u), p.id).toBeLessThanOrEqual(10 + 1e-9);
      expect(p.shy, p.id).toBeDefined();
      // Seen from overhead it is whole; from nearly level on the side it faces, it is partly cut away, and from the far side it is whole.
      expect(fadeOf(p, 0, 0), p.id).toBe(1);
      const [sx, sy] = p.shy!;
      const towardEye = (Math.atan2(sx, sy) * 180) / Math.PI;
      expect(fadeOf(p, towardEye, 84)).toBeLessThan(1);
      expect(fadeOf(p, towardEye, 84)).toBeGreaterThanOrEqual(0.35);
      expect(fadeOf(p, towardEye + 180, 84)).toBe(1);
      // Nor does it fade at a broadcast tip: a low wall hides nothing from there.
      expect(fadeOf(p, towardEye, 54), p.id).toBe(1);
    }
    expect(itemsOf(model, "surrounds")).toHaveLength(1);
    expect(model.standing).toContain("surrounds 0.75 metres");
  });

  it("puts a chair and a score table at each table, on the floor, and a scoreboard hung over the middle, facing the eye", () => {
    for (const n of [1, 2, 3, 4]) {
      expect(Math.max(...corners(byId(model, `c${n}-chair-top`)).map((c) => c[2]))).toBeCloseTo(1.5, 6);
      expect(Math.max(...corners(byId(model, `c${n}-desk-top`)).map((c) => c[2]))).toBeCloseTo(2.5, 6);
    }
    const board = byId(model, "scoreboard");
    expect(board.billboard).toBe(true);
    // Its lower edge is 13 feet up, and it hangs over the middle of the floor.
    expect(Math.min(...corners(board).map((c) => c[2]))).toBeCloseTo(13 + 0, 6);
    expect(itemsOf(model, "scoreboard")[0].height).toBe(13);
    const layout = multiLayout({ preset: "tabletennis-4" });
    expect(board.o[0] + board.u[0] / 2).toBeCloseTo(layout.floor.w / 2, 6);
  });

  it("has none of these in a layout whose preset has none", () => {
    for (const id of ["pickleball-2x4", "tennis-1x3", "badminton-1x4-min", "judo-1x3"]) {
      const m = buildMultiTurn({ preset: id });
      expect(m.planes.filter((p) => p.kind === "surround" || p.kind === "screen"), id).toHaveLength(0);
    }
  });

  it("leaves the barriers and the rest flat on the floor when the floor alone is asked for, and the tables flat with them", () => {
    const alone = buildMultiTurn({ preset: "tabletennis-4" }, { uprights: false });
    expect(alone.planes).toHaveLength(0);
    expect(alone.floor).toContain("ky-mu-barrier");
    expect(alone.floor).toContain('class="ky-nt-line"');
    expect(alone.floor).not.toContain('class="ky-mu-shadow"');
    const noBoards = buildMultiTurn({ preset: "tabletennis-4" }, { uprights: { boards: false } });
    expect(noBoards.planes.some((p) => p.kind === "surround")).toBe(false);
    expect(noBoards.planes.some((p) => p.kind === "leg")).toBe(true);
  });
});

describe("the stadium round the floor", () => {
  it("raises the stands of the hall, in the same frame as the floor, with their patterns, and a roof only when asked", () => {
    const off = buildMultiTurn({ preset: "tabletennis-4" });
    expect(itemsOf(off, "stands")).toHaveLength(0);
    expect(off.defs).toBe("");
    expect(off.venue).toBe(false);
    const on = buildMultiTurn({ preset: "tabletennis-4", stadium: true });
    const stands = itemsOf(on, "stands");
    expect(stands).toHaveLength(1);
    expect(stands[0].planes.length).toBeGreaterThan(30);
    expect(on.defs).toContain("<pattern");
    expect(on.venue).toBe(true);
    expect(itemsOf(on, "roof")).toHaveLength(0);
    const roofed = buildMultiTurn({ preset: "tabletennis-4", stadium: true }, { venue: { roof: true } });
    expect(itemsOf(roofed, "roof")).toHaveLength(1);
    expect(buildMultiTurn({ preset: "tabletennis-4", stadium: { roof: true } }).uprights.items.some((item) => item.kind === "roof")).toBe(true);
    // The stands stand on the floor's ground and the view's box takes them in, to their top.
    const top = Math.max(...on.planes.filter((p) => p.kind === "seats").flatMap((p) => corners(p).map((c) => c[2])));
    expect(on.box.z1).toBeGreaterThanOrEqual(top * on.scale - 1e-6);
    for (const p of stands[0].planes) for (const [x, y] of corners(p)) {
      expect((x - on.centre[0]) * on.scale).toBeGreaterThanOrEqual(on.box.x0 - 1e-6);
      expect((x - on.centre[0]) * on.scale).toBeLessThanOrEqual(on.box.x1 + 1e-6);
      expect((y - on.centre[1]) * on.scale).toBeGreaterThanOrEqual(on.box.y0 - 1e-6);
      expect((y - on.centre[1]) * on.scale).toBeLessThanOrEqual(on.box.y1 + 1e-6);
    }
    // No stadium for a view that asks for none, even if the layout has one.
    expect(buildMultiTurn({ preset: "tabletennis-4", stadium: true }, { venue: false }).venue).toBe(false);
  });
});

describe("the viewpoints of a layout", () => {
  it("look along the nets of a net sport's surfaces and turn a quarter where the surfaces or the floor stand across the picture", () => {
    const tt = multiPresets("tabletennis", { w: 91.86, h: 45.93 }, true);
    expect(tt.overhead.yaw).toBe(0);
    expect(tt.end).toMatchObject({ yaw: -90, pitch: 74 });
    // Courts turned across the layout: the end-on view looks along them, the other way round.
    const badminton = multiPresets("badminton", { w: 129, h: 57 }, false);
    expect(badminton.end.yaw).toBe(0);
    // A floor taller than it is wide is turned, so that its long way runs across the screen.
    const curling = multiPresets("curling", { w: 62, h: 150 }, false);
    expect(curling.overhead.yaw).toBe(90);
    expect(curling.broadcast.yaw).toBe(70);
    const model = buildMultiTurn({ preset: "badminton-1x4" });
    expect(model.presets).toBeDefined();
    // It opens on the low corner, as every 3D view does.
    expect(presetOf(model.view, model.presets)).toBe("corner");
    expect(buildMultiTurn({ preset: "tabletennis-4" }, { preset: "end" }).view.yaw).toBe(-90);
    expect(buildMultiTurn({ preset: "badminton-1x4" }, { preset: "end" }).view.yaw).toBe(0);
  });
});

describe("the markup of a layout's 3D view", () => {
  it("is a view of the layout, named and described, with its controls, and says what stands on it in both languages", () => {
    const html = multiTurnMarkup({ preset: "tabletennis-4", id: "hall" });
    expect(html).toContain('id="hall-turn"');
    expect(html).toContain('data-part="c1-net"');
    expect(html).toContain('data-part="scoreboard"');
    expect(html).toContain("ky-turn-controls");
    expect(html).toContain("Low corner");
    expect(html).toContain("kyogijo");
    expect(html).toMatch(/Standing on it, in the 3D view: .*surrounds 0\.75 metres/);
    const ja = multiTurnMarkup({ preset: "tabletennis-4", language: "ja" });
    expect(ja).toContain('lang="ja"');
    expect(ja).toContain("競技エリアのフェンス");
    expect(ja).toContain("審判席と記録台");
    // The same options give the same markup.
    expect(multiTurnMarkup({ preset: "tabletennis-4", id: "hall" })).toBe(html);
  });

  it("follows a forced theme, and leaves the stylesheet to the page when asked", () => {
    expect(multiTurnMarkup({ preset: "judo-1x3", theme: "dark" })).toContain('data-theme="dark"');
    expect(multiTurnMarkup({ preset: "judo-1x3", style: "none" })).not.toContain("<style>");
  });
});
