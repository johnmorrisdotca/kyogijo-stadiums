// A judging assignment in 3D: the judges' table and chairs stand where the plan has them, a name card stands on the table in front of every judge whose name fits one (and a badge in front of the others), the mat's name is
// on a sign over the table, the cards turn to face the eye and are drawn in front of what is behind them from every side, and the view keeps its size through a whole turn (as every 3D view does, 0.12.2 and 0.13.0).
import { describe, expect, it } from "vitest";

import { drawJudging, judgingDrawing } from "./judging.draw.ts";
import { JUDGING_HEIGHTS, JUDGING_PRESETS, buildJudgingTurn, judgingTurnMarkup } from "./judging.turn.ts";
import { judgingPlan } from "./judging.ts";
import type { JudgingOptions } from "./judging.types.ts";
import { FEET_PER_METRE as M } from "./geometry.ts";
import { PITCH_MAX, eyeDistance, fit, layoutOf, presetOf, project, TURN_PRESET_NAMES, type TurnModel } from "./turn-entry.ts";
import { covered } from "./turn.camera.ts";
import { facing, size, type Plane } from "./turn.kit.ts";
import { depthOf } from "./turn.camera.ts";

const FIVE = [
  { seat: 1, name: "Aiko Mori", id: "J-1042" },
  { seat: 2, name: "Daniel Okafor", id: "J-0377" },
  { seat: 3, name: "Sofia Lindqvist-Hernandez", id: "J-2210" },
  { seat: 4, name: "Kenji Watanabe", id: "J-0918" },
  { seat: 5, name: "Marta Kowalczyk", id: "J-1555" },
] as const;
const TWO: JudgingOptions["mats"] = [{ officials: FIVE }, { label: "Final", officials: [{ seat: 1, name: "Li Wei", id: "J-3001" }, { seat: "central", name: "Priya Raman", id: "J-0042" }] }];
const kata = (mats: JudgingOptions["mats"] = [{ officials: FIVE }], rest: Partial<JudgingOptions> = {}): JudgingOptions => ({ style: "kata", mats, seatNames: true, ...rest });
const byId = (model: TurnModel, id: string): Plane => {
  const found = model.planes.find((p) => p.id === id);
  if (found === undefined) throw new Error(`no plane ${id}`);
  return found;
};
const has = (model: TurnModel, id: string): boolean => model.planes.some((p) => p.id === id);
const corners = (p: Plane): [number, number, number][] => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]): [number, number, number] => [p.o[0] + a * p.u[0] + b * p.v[0], p.o[1] + a * p.u[1] + b * p.v[1], p.o[2] + a * p.u[2] + b * p.v[2]]);
const middle = (p: Plane, model: TurnModel): [number, number, number] => [(p.o[0] + (p.u[0] + p.v[0]) / 2 - model.centre[0]) * model.scale, (p.o[1] + (p.u[1] + p.v[1]) / 2 - model.centre[1]) * model.scale, (p.o[2] + (p.u[2] + p.v[2]) / 2) * model.scale];
const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);

describe("a judging assignment as a 3D model", () => {
  const model = buildJudgingTurn(kata(TWO));

  it("is a turnable model of the judo floor, every plane finite, uniquely named and on or over the floor, with the flat picture for a browser that cannot turn it", () => {
    const ids = model.planes.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of model.planes) {
      expect([...p.o, ...p.u, ...p.v].every(Number.isFinite), p.id).toBe(true);
      expect(Math.min(...corners(p).map((c) => c[2])), `${p.id} is not under the floor`).toBeGreaterThanOrEqual(-1e-9);
    }
    expect(model.turnable).toBe(true);
    expect(model.uprights.lift).toBe(0);
    expect(model.floor.startsWith("<svg")).toBe(true);
    expect(model.floor).toContain('data-league="ijf-kata"');
    expect(model.flat).toBe(drawJudging(kata(TWO)));
    expect(model.look).toEqual({ sport: "judo", look: "yellow-red" });
    expect(model.title).toBe(judgingDrawing(kata(TWO)).title);
    expect(model.description).toContain("Judge 1 Aiko Mori, ID J-1042");
    expect(model.description).toContain("name card");
    expect(model.language).toBe("en");
  });

  it("has a table, five chairs, a sign and its poles for each mat, on the floor where the plan has them", () => {
    const plan = judgingPlan("kata");
    for (const [mat, shift] of [[1, 0], [2, 2 * 10 + 2 + 2 * 2 - 14 + 14 - 14 + 0]] as const) {
      void shift;
      for (const id of ["table-1", "table-top", "chair-1-1", "chair-3-top", "chair-5-4", "sign", "sign-pole-1", "sign-pole-2"]) expect(has(model, `m${mat}-${id}`), `m${mat}-${id}`).toBe(true);
    }
    // The first mat's table: the plan's own table in feet, 75 cm high.
    const top = byId(model, "m1-table-top");
    expect(top.o[0] / M).toBeCloseTo(plan.table.x0, 6);
    expect(top.o[1] / M).toBeCloseTo(plan.table.y0, 6);
    expect(top.u[0] / M).toBeCloseTo(plan.table.x1 - plan.table.x0, 6);
    expect(top.o[2] / M).toBeCloseTo(JUDGING_HEIGHTS.table, 6);
    // Each chair's top is where the plan puts the chair, 45 cm high.
    plan.chairs.forEach((c, i) => {
      const t = byId(model, `m1-chair-${i + 1}-top`);
      expect(t.o[0] / M).toBeCloseTo(c.x0, 6);
      expect(t.o[2] / M).toBeCloseTo(JUDGING_HEIGHTS.chair, 6);
    });
    // The second mat is a mat's width further along.
    expect(byId(model, "m2-table-top").o[0]).toBeGreaterThan(byId(model, "m1-table-top").o[0] + 10 * M);
    expect(byId(model, "m2-table-top").o[1]).toBeCloseTo(byId(model, "m1-table-top").o[1], 9);
  });

  it("stands a card on the table in front of each judge whose name fits one and a badge where it does not, and says which in its name", () => {
    expect(has(model, "m1-card-1")).toBe(true);
    expect(has(model, "m1-card-2")).toBe(true);
    expect(has(model, "m1-card-3")).toBe(false);
    expect(has(model, "m1-badge-3")).toBe(true);
    expect(has(model, "m1-card-4") && has(model, "m1-card-5")).toBe(true);
    // A seat with nobody in it has a (hollow) badge; its number is on it.
    expect(has(model, "m2-badge-2")).toBe(true);
    expect(byId(model, "m2-badge-2").svg).toContain("u-card-badge-empty");
    expect(byId(model, "m2-card-1").svg).toContain("Li");
    expect(byId(model, "m2-card-1").svg).toContain("J-3001");
    // The card stands on the table's top, over the seat's own place, and is a billboard that turns to the eye.
    const card = byId(model, "m1-card-2");
    const top = byId(model, "m1-table-top");
    expect(card.billboard).toBe(true);
    expect(card.o[2] + card.v[2]).toBeCloseTo(top.o[2], 9);
    const [cx] = [card.o[0] + card.u[0] / 2];
    expect(cx / M).toBeCloseTo(judgingPlan("kata").chairs[1].x0 + 0.25, 6);
    expect(card.o[1]).toBeGreaterThan(top.o[1]);
    expect(card.o[1]).toBeLessThan(top.o[1] + top.v[1]);
  });

  it("sets each card's type no smaller than the floor, in the box the card has, and one size across the mat's cards", () => {
    const sizes = (id: string): number[] => [...byId(model, id).svg.matchAll(/class="u-card-name"[^>]* font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    const m1 = [1, 2, 4, 5].flatMap((n) => sizes(`m1-card-${n}`));
    expect(Math.min(...m1)).toBeGreaterThanOrEqual(0.62 - 1e-9);
    expect(new Set(m1).size).toBe(1);
    // On the screen at the opening view of a 960 by 600 view, close up on the bench, the type is big enough to read: about 11 pixels or more.
    const near = buildJudgingTurn(kata(undefined, { mat: 1, focus: "bench" }));
    const at = layoutOf(near, near.view, 960, 600).at;
    const px = sizes("m1-card-1")[0] * near.scale * at.k;
    expect(px).toBeGreaterThan(10);
    // A card is as wide as a seat is apart, less a little, and its text lies inside it.
    const [w, h] = size(byId(near, "m1-card-1"));
    expect(w / M).toBeCloseTo(1.25 - 0.06, 6);
    expect(h / M).toBeCloseTo(JUDGING_HEIGHTS.card, 6);
  });

  it("names the mat on a sign over its table, whole whatever its name", () => {
    expect(byId(model, "m1-sign").svg).toContain(">Mat 1<");
    expect(byId(model, "m2-sign").svg).toContain(">Final<");
    const long = buildJudgingTurn(kata([{ label: "Championship Final, Kata Division", officials: [] }]));
    const text = [...byId(long, "m1-sign").svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(" ");
    expect(text.replace(/\s+/g, "")).toBe("ChampionshipFinal,KataDivision".replace(/\s+/g, ""));
    expect(byId(long, "m1-sign").billboard).toBe(true);
  });

  it("builds one mat alone with `mat`, as the tab of a page does, and the mats side by side without it", () => {
    const one = buildJudgingTurn(kata(TWO, { mat: 2 }));
    expect(one.planes.some((p) => p.id.startsWith("m1-"))).toBe(false);
    expect(has(one, "m2-card-1")).toBe(true);
    expect(byId(one, "m2-sign").svg).toContain(">Final<");
    expect(one.viewBox.w).toBeLessThan(model.viewBox.w);
    expect(one.floor).toContain('data-league="ijf-kata"');
  });

  it("is in Japanese when asked, the card's words and the mat's name; and escapes a name that is markup", () => {
    const ja = buildJudgingTurn(kata([{ officials: [{ seat: 1, name: "山田 花子", id: "J-9" }] }], { language: "ja" }));
    expect(ja.language).toBe("ja");
    expect(byId(ja, "m1-sign").svg).toContain("第1試合場");
    expect(ja.description).toContain("名札");
    const html = judgingTurnMarkup(kata([{ officials: [{ seat: 1, name: "<a>", id: '"><b>' }] }], { focus: "bench" }), { controls: false });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<a>");
    expect(html).toContain("&lt;a&gt;");
    expect(html).toContain("ID &quot;&gt;&lt;b&gt;");
  });

  it("opens from the mat side at a pitch where the type is not squashed, with four viewpoints named as every 3D view's", () => {
    expect(TURN_PRESET_NAMES.every((name) => JUDGING_PRESETS[name] !== undefined)).toBe(true);
    expect(model.presets).toBe(JUDGING_PRESETS);
    expect(presetOf(model.view, model.presets)).toBe("broadcast");
    expect(JUDGING_PRESETS.broadcast.pitch).toBeLessThanOrEqual(45);
    expect(JUDGING_PRESETS.overhead.pitch).toBe(0);
    // A view asked for opens on that one.
    expect(presetOf(buildJudgingTurn(kata(), { preset: "corner" }).view, JUDGING_PRESETS)).toBe("corner");
  });

  it("is markup that is a still view of the floor and the planes, the cards among them", () => {
    const html = judgingTurnMarkup(kata(TWO, { mat: 1 }), { size: { width: 960, height: 600 } });
    expect(html).toContain('class="ky-turn"');
    expect(html).toContain('data-part="m1-card-1"');
    expect(html).toContain('data-part="m1-sign"');
    expect(html).toContain("u-card-name");
    expect(html).toContain("--ky-ju-card");
    expect(html).toContain('data-mode="3d"');
    expect(html).toBe(judgingTurnMarkup(kata(TWO, { mat: 1 }), { size: { width: 960, height: 600 } }));
  });
});

describe("the bench close up", () => {
  const whole = buildJudgingTurn(kata(TWO));
  const near = buildJudgingTurn(kata(TWO, { focus: "bench" }));

  it("fits the view to the judges' bench and turns about it, with every card in the box", () => {
    const plan = judgingPlan("kata");
    expect(near.box.x1 - near.box.x0).toBeLessThan(whole.box.x1 - whole.box.x0);
    expect(near.box.y1 - near.box.y0).toBeLessThan(whole.box.y1 - whole.box.y0);
    const one = buildJudgingTurn(kata(undefined, { focus: "bench" }));
    expect(one.centre[0] / M).toBeCloseTo((plan.bench.x0 + plan.bench.x1) / 2, 6);
    for (const p of one.planes.filter((q) => /-(card|badge|sign)/.test(q.id))) {
      for (const [x, y] of corners(p)) {
        expect((x - one.centre[0]) * one.scale, p.id).toBeGreaterThanOrEqual(one.box.x0 - 1e-6);
        expect((x - one.centre[0]) * one.scale, p.id).toBeLessThanOrEqual(one.box.x1 + 1e-6);
        expect((y - one.centre[1]) * one.scale, p.id).toBeGreaterThanOrEqual(one.box.y0 - 1e-6);
        expect((y - one.centre[1]) * one.scale, p.id).toBeLessThanOrEqual(one.box.y1 + 1e-6);
      }
    }
    // The cards are bigger on the screen than in the whole floor's view.
    const px = (m: TurnModel): number => layoutOf(m, m.view, 960, 600).at.k * m.scale;
    expect(px(one)).toBeGreaterThan(1.5 * px(buildJudgingTurn(kata(undefined, { mat: 1 }))));
  });

  it("holds the whole floor in the box when it is not close up, at every angle", () => {
    for (const p of whole.planes) {
      for (const [x, y] of corners(p)) {
        expect((x - whole.centre[0]) * whole.scale, p.id).toBeGreaterThanOrEqual(whole.box.x0 - 1e-6);
        expect((x - whole.centre[0]) * whole.scale, p.id).toBeLessThanOrEqual(whole.box.x1 + 1e-6);
        expect((y - whole.centre[1]) * whole.scale, p.id).toBeGreaterThanOrEqual(whole.box.y0 - 1e-6);
        expect((y - whole.centre[1]) * whole.scale, p.id).toBeLessThanOrEqual(whole.box.y1 + 1e-6);
      }
    }
    const f = whole.viewBox;
    expect(whole.box.x1 - whole.box.x0).toBeCloseTo(f.w * whole.scale, 6);
  });
});

describe("the cards turn to the eye and are drawn in the right order", () => {
  const model = buildJudgingTurn(kata(TWO));

  it("keep their width across the screen whatever the yaw, so that a card is read from every side", () => {
    const card = byId(model, "m1-card-1");
    const [w] = size(card);
    for (const yaw of range(0, 350, 10)) {
      const f = facing(card, yaw);
      const a = (yaw * Math.PI) / 180;
      expect(f.u[0] * Math.cos(a) - f.u[1] * Math.sin(a)).toBeCloseTo(w, 6);
      expect(Math.hypot(...f.v)).toBeCloseTo(size(card)[1], 9);
    }
  });

  it("are drawn in the order of their depth with everything else, at every turn and every tip", () => {
    for (const pitch of [0, 20, 42, 62, PITCH_MAX]) {
      for (const yaw of range(0, 355, 5)) {
        const view = { yaw, pitch, zoom: 1 };
        const layout = layoutOf(model, view, 960, 600);
        const planes = model.planes.map((p) => facing(p, yaw));
        const order = planes.map((p, i) => ({ id: p.id, stack: layout.stack[i + 1], depth: depthOf(middle(p, model), view, layout.at) })).sort((a, b) => a.stack - b.stack);
        for (let i = 1; i < order.length; i += 1) expect(order[i].depth, `${pitch}/${yaw}: ${order[i - 1].id} then ${order[i].id}`).toBeGreaterThanOrEqual(order[i - 1].depth - 1e-6);
      }
    }
  });

  it("are in front of the table when the eye is on the mat's side, and behind the sign", () => {
    const view = { yaw: 0, pitch: 42, zoom: 1 };
    const layout = layoutOf(model, view, 960, 600);
    const stack = (id: string): number => layout.stack[model.planes.findIndex((p) => p.id === id) + 1];
    // From the mat side the table's near wall hides nothing behind it that the card needs, and the card is drawn after the table's top.
    expect(stack("m1-card-2")).toBeGreaterThan(stack("m1-table-top"));
    expect(stack("m1-sign")).toBeGreaterThan(stack("m1-card-2"));
  });
});

describe("the view keeps its size through a whole turn", () => {
  const MODELS: readonly (readonly [string, TurnModel])[] = [
    ["one mat", buildJudgingTurn(kata(undefined, { mat: 1 }))],
    ["two mats", buildJudgingTurn(kata(TWO))],
    ["six mats", buildJudgingTurn(kata(Array.from({ length: 6 }, () => ({ officials: FIVE.slice(0, 2) }))))],
    ["the bench", buildJudgingTurn(kata(TWO, { focus: "bench" }))],
    ["one mat's bench", buildJudgingTurn(kata(undefined, { mat: 1, focus: "bench" }))],
    ["a contest", buildJudgingTurn({ style: "shiai", mats: [{ officials: [{ seat: "referee", name: "Hana Ito" }, { seat: "side-judge-2", name: "Kim Park" }] }, {}], sideJudges: true, seatNames: true })],
    ["a contest's bench", buildJudgingTurn({ style: "shiai", mats: [{ officials: [{ seat: "timekeeper", name: "Sam Cole" }] }], focus: "bench" })],
  ];
  const CONTAINERS: readonly (readonly [number, number])[] = [[1280, 900], [1180, 820], [390, 700]];
  const parse = (t: string): number[] => t.slice("matrix3d(".length, -1).split(",").map(Number);
  const shoelace = (pts: readonly (readonly number[])[]): number => Math.abs(pts.reduce((s, p, i) => s + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0)) / 2;
  /** The areas on the screen of the floor, or of the table's top (`which` its id), a view every `by` degrees round the whole circle, as the browser would draw the written matrix. */
  const areas = (model: TurnModel, pitch: number, [w, h]: readonly [number, number], by: number, which = "floor"): number[] => {
    const index = which === "floor" ? 0 : model.planes.findIndex((p) => p.id === which) + 1;
    const [fw, fh] = which === "floor" ? [model.viewBox.w * model.scale, model.viewBox.h * model.scale] : size(model.planes[index - 1]).map((v) => v * model.scale);
    const out: number[] = [];
    for (let yaw = 0; yaw < 360; yaw += by) {
      const m = parse(layoutOf(model, { yaw, pitch, zoom: 1 }, w, h).transforms[index]);
      out.push(shoelace([[0, 0], [fw, 0], [fw, fh], [0, fh]].map(([x, y]) => {
        const q = m[3] * x + m[7] * y + m[15];
        return [(m[0] * x + m[4] * y + m[12]) / q, (m[1] * x + m[5] * y + m[13]) / q];
      })));
    }
    return out;
  };
  const spread = (l: readonly number[]): number => Math.max(...l) / Math.min(...l);
  const jump = (l: readonly number[]): number => Math.max(...l.map((a, i) => Math.max(a, l[(i + 1) % l.length]) / Math.min(a, l[(i + 1) % l.length])));

  // The scene turns about the middle of what it is fitted to. The whole floor is that, so its area is steady to the little the perspective adds. Close up on the benches the floor is mostly out of view and what is seen is
  // the tables: it is the table of the first bench that is measured. With several benches it stands off the axis, so that the view has a longer lens of its own (`TurnModel.lens`), which flattens what swings toward the eye.
  const LIMITS: Record<string, readonly [number, number]> = { "one mat's bench": [1.03, 1.004], "the bench": [1.03, 1.004], "a contest's bench": [1.03, 1.004] };
  it("has one area of the floor at every turn, at every tip, in desk, tablet and phone boxes (close up, the table's top)", () => {
    for (const [name, model] of MODELS) {
      const pitches = [...new Set([...Object.values(JUDGING_PRESETS).map((v) => v.pitch), 45, PITCH_MAX])].filter((p) => p > 0);
      const bench = LIMITS[name] !== undefined;
      for (const c of CONTAINERS) for (const pitch of pitches) expect(spread(areas(model, pitch, c, 10, bench ? "m1-table-top" : "floor")), `${name} ${c.join("x")} pitch ${pitch}`).toBeLessThan(bench ? LIMITS[name][0] : 1.02);
    }
  });

  it("changes smoothly: no step between two views three degrees apart", () => {
    for (const [name, model] of MODELS) {
      const bench = LIMITS[name] !== undefined;
      for (const c of CONTAINERS) for (const pitch of [42, 62, PITCH_MAX]) expect(jump(areas(model, pitch, c, 3, bench ? "m1-table-top" : "floor")), `${name} ${c.join("x")} pitch ${pitch}`).toBeLessThan(bench ? LIMITS[name][1] : 1.004);
    }
  });

  it("fits at one scale and one place at every yaw, and cuts nothing off at any angle", () => {
    for (const [name, model] of MODELS) {
      for (const [w, h] of CONTAINERS) {
        const d = eyeDistance(w, h, model.lens);
        for (const pitch of [0, 30, 42, 60, PITCH_MAX]) {
          const first = fit(model.box, { yaw: 0, pitch, zoom: 1 }, w, h, d);
          let x0 = Infinity;
          let x1 = -Infinity;
          let y0 = Infinity;
          let y1 = -Infinity;
          for (const yaw of range(-180, 175, 5)) {
            expect(fit(model.box, { yaw, pitch, zoom: 1 }, w, h, d), `${name} ${w}x${h} ${pitch} ${yaw}`).toEqual(first);
            const r = covered(model.box, { yaw, pitch, zoom: 1 }, first, d);
            x0 = Math.min(x0, r.x0);
            x1 = Math.max(x1, r.x1);
            y0 = Math.min(y0, r.y0);
            y1 = Math.max(y1, r.y1);
          }
          expect(x0, `${name} ${w}x${h} ${pitch}`).toBeGreaterThanOrEqual(-w / 2);
          expect(x1).toBeLessThanOrEqual(w / 2);
          expect(y0).toBeGreaterThanOrEqual(-h / 2);
          expect(y1).toBeLessThanOrEqual(h / 2);
        }
      }
    }
  });
});

describe("a contest in 3D", () => {
  const officials = [{ seat: "referee", name: "Hana Ito", id: "R-204" }, { seat: "timekeeper", name: "Sam Cole", id: "T-11" }, { seat: "scorekeeper", name: "Ana Ruiz", id: "T-12" }, { seat: "supervisor", name: "Peter Lindqvist-Haraldsson", id: "S-3" }, { seat: "side-judge-1", name: "Kim Park", id: "J-7" }];
  const contest = (rest: Partial<JudgingOptions> = {}): JudgingOptions => ({ style: "shiai", mats: [{ officials }], seatNames: true, ...rest });
  const model = buildJudgingTurn(contest());

  it("stands the technical table with its chairs, a card on it for each official at it, the referee's card on a post on the mat and a side judge's in the corner", () => {
    const ids = model.planes.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["m1-table-top", "m1-chair-2-top", "m1-chair-3-top", "m1-chair-4-top", "m1-chair-5-top", "m1-card-1", "m1-card-2", "m1-card-3", "m1-badge-4", "m1-card-5", "m1-post-1", "m1-post-5", "m1-sign"]) expect(has(model, id), id).toBe(true);
    // The referee stands: no chair.
    expect(has(model, "m1-chair-1-top")).toBe(false);
    const g = judgingPlan("shiai");
    const table = byId(model, "m1-table-top");
    expect(byId(model, "m1-card-2").o[2] + byId(model, "m1-card-2").v[2]).toBeCloseTo(table.o[2], 9);
    // The referee's card is on a post at 1 m, over the place 2 m back from the line the athletes start on.
    const card = byId(model, "m1-card-1");
    expect(card.billboard).toBe(true);
    expect(card.o[2] + card.v[2]).toBeCloseTo(JUDGING_HEIGHTS.post * M, 9);
    expect((card.o[0] + card.u[0] / 2) / M).toBeCloseTo((g.places[0].card.x0 + g.places[0].card.x1) / 2, 6);
    expect((card.o[1]) / M).toBeCloseTo((g.places[0].card.y0 + g.places[0].card.y1) / 2, 6);
    for (const p of model.planes) expect(Math.min(...corners(p).map((c) => c[2])), p.id).toBeGreaterThanOrEqual(-1e-9);
    expect(model.floor).toContain('data-league="ijf"');
    expect(model.flat).toBe(drawJudging(contest()));
    expect(model.description).toContain("Referee Hana Ito, ID R-204");
  });

  it("is drawn in the right order from every side, and keeps its size through a turn, whole floor and close up", () => {
    for (const m of [model, buildJudgingTurn(contest({ focus: "bench" }))]) {
      for (const pitch of [0, 42, 62, PITCH_MAX]) {
        for (const yaw of range(0, 355, 15)) {
          const view = { yaw, pitch, zoom: 1 };
          const layout = layoutOf(m, view, 960, 600);
          const order = m.planes.map((p, i) => ({ stack: layout.stack[i + 1], depth: depthOf(middle(facing(p, yaw), m), view, layout.at) })).sort((a, b) => a.stack - b.stack);
          for (let i = 1; i < order.length; i += 1) expect(order[i].depth).toBeGreaterThanOrEqual(order[i - 1].depth - 1e-6);
        }
      }
    }
    const d = eyeDistance(1180, 820, model.lens);
    const first = fit(model.box, { yaw: 0, pitch: 42, zoom: 1 }, 1180, 820, d);
    for (const yaw of range(-180, 175, 5)) expect(fit(model.box, { yaw, pitch: 42, zoom: 1 }, 1180, 820, d)).toEqual(first);
  });

  it("is close up on the table alone: the referee and the side judges are not stood up (their names are in the chart), and the box is the bench", () => {
    const near = buildJudgingTurn(contest({ focus: "bench" }));
    expect(near.planes.some((p) => p.id.startsWith("m1-post-"))).toBe(false);
    expect(has(near, "m1-card-1") || has(near, "m1-badge-1")).toBe(false);
    expect(has(near, "m1-card-2")).toBe(true);
    expect(near.box.x1 - near.box.x0).toBeLessThan(model.box.x1 - model.box.x0);
    const g = judgingPlan("shiai");
    expect(near.centre[0] / M).toBeCloseTo((g.bench.x0 + g.bench.x1) / 2, 0);
  });

  it("has mats side by side, each with its own seats, and the side judges on every mat when one names them", () => {
    const two = buildJudgingTurn({ style: "shiai", mats: [{ officials }, { officials: [{ seat: "referee", name: "Li Wei" }] }], seatNames: true });
    expect(has(two, "m2-card-1")).toBe(true);
    expect(has(two, "m2-badge-5")).toBe(true);
    expect(byId(two, "m2-table-top").o[0]).toBeGreaterThan(byId(two, "m1-table-top").o[0] + 10 * M);
  });
});

describe("nothing is squeezed in 3D", () => {
  const model = buildJudgingTurn({ style: "kata", mats: [{ officials: FIVE }], seatNames: true });
  const badges = buildJudgingTurn({ style: "kata", mats: [{ officials: FIVE }] });

  it("leans each badge, card and sign back to face the eye squarely, turned and never stretched, at every turn and tip", () => {
    for (const m of [model, badges]) {
      for (const p of m.planes.filter((q) => /-(card|badge)-\d+$|-sign$/.test(q.id))) expect(p.lean, p.id).toBe(true);
      for (const pitch of [0, 20, 42, 62, PITCH_MAX]) {
        for (const yaw of range(0, 345, 15)) {
          const view = { yaw, pitch, zoom: 1 };
          const at = layoutOf(m, view, 960, 600).at;
          const d = eyeDistance(960, 600);
          for (const p of m.planes.filter((q) => q.lean === true)) {
            const f = facing(p, yaw, pitch);
            const [w, h] = size(p);
            expect(Math.hypot(...f.u), p.id).toBeCloseTo(w, 6);
            expect(Math.hypot(...f.v), p.id).toBeCloseTo(h, 6);
            // Square to the eye: its sides are at right angles, and its normal is the way to the eye.
            expect(f.u[0] * f.v[0] + f.u[1] * f.v[1] + f.u[2] * f.v[2], p.id).toBeCloseTo(0, 6);
            const eye = [Math.sin((pitch * Math.PI) / 180) * Math.sin((yaw * Math.PI) / 180), Math.sin((pitch * Math.PI) / 180) * Math.cos((yaw * Math.PI) / 180), Math.cos((pitch * Math.PI) / 180)];
            const normal = [f.u[1] * f.v[2] - f.u[2] * f.v[1], f.u[2] * f.v[0] - f.u[0] * f.v[2], f.u[0] * f.v[1] - f.u[1] * f.v[0]];
            const len = Math.hypot(...normal);
            expect(Math.abs((normal[0] * eye[0] + normal[1] * eye[1] + normal[2] * eye[2]) / len), `${p.id} ${pitch}/${yaw}`).toBeCloseTo(1, 6);
            // Its shape on the screen is its shape: the width and the height on the screen are in the proportion of its own (the perspective, with a long lens, changes it by a few percent at most).
            const corner = (a: number, b: number): [number, number] => {
              const point: [number, number, number] = [(f.o[0] + a * f.u[0] + b * f.v[0] - m.centre[0]) * m.scale, (f.o[1] + a * f.u[1] + b * f.v[1] - m.centre[1]) * m.scale, (f.o[2] + a * f.u[2] + b * f.v[2]) * m.scale];
              const q = project(point, view, at, d);
              return [q[0], q[1]];
            };
            const [p0, px, py] = [corner(0, 0), corner(1, 0), corner(0, 1)];
            const across = Math.hypot(px[0] - p0[0], px[1] - p0[1]);
            const down = Math.hypot(py[0] - p0[0], py[1] - p0[1]);
            if (pitch === 0 && p.id.includes("sign")) continue;
            expect((down / across) / (h / w), `${p.id} ${pitch}/${yaw}`).toBeGreaterThan(0.95);
            expect((down / across) / (h / w), `${p.id} ${pitch}/${yaw}`).toBeLessThan(1.05);
          }
        }
      }
    }
  });

  it("has no squeezing in its markup either: no textLength, no lengthAdjust, no scale of two numbers on a plane's drawing", () => {
    for (const html of [judgingTurnMarkup({ style: "kata", mats: [{ officials: FIVE }], seatNames: true }), judgingTurnMarkup({ style: "shiai", mats: [{ officials: [{ seat: "referee", name: "Hana Ito" }] }] })]) {
      expect(html).not.toMatch(/textLength|lengthAdjust|scaleX|scaleY/);
      for (const m of html.matchAll(/scale\(([^)]*)\)/g)) expect(m[1].trim().split(/[ ,]+/), m[0]).toHaveLength(1);
    }
  });

  it("makes the badges large: a seat's badge is bigger than the 0.55 foot of the first release, and the descriptions say a badge stands there", () => {
    expect(size(byId(badges, "m1-badge-1"))[0]).toBeGreaterThanOrEqual(1.7);
    expect(badges.description).toContain("numbered badge");
    expect(model.description).toContain("name card");
    expect(buildJudgingTurn({ style: "kata", mats: [{ officials: FIVE }], language: "ja" }).description).toContain("番号の丸い札");
  });
});
