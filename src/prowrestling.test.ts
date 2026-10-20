// The professional wrestling ring: the same ring as a boxing ring but for three ropes that are not tied together, an apron of a foot and steel steps at two corners. No rulebook gives its figures, so each is typical (from the sources
// named in `LEAGUE_SOURCES`) and the tests hold what the package draws: the plan, the options, the words in both languages and the 3D view.
import { describe, expect, it } from "vitest";
import { budoPlan, lookNames } from "./budo-entry.ts";
import { drawKyogijo, SPORTS } from "./draw.ts";
import { FEATURES } from "./features.ts";
import { PRO_RING, PRO_WRESTLING_LEAGUES } from "./leagues/combat.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { buildTurn, layoutOf } from "./turn-entry.ts";
import { depthOf } from "./turn.camera.ts";
import type { Plane } from "./turn.kit.ts";
import { parseXml, withClass } from "./xml.fixture.ts";

const FT = 0.3048;
const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);
const plan = (budo?: Record<string, unknown>) => budoPlan({ sport: "prowrestling", budo } as Parameters<typeof budoPlan>[0]);
const model = buildTurn({ sport: "prowrestling" }, {});
const heightOf = (p: Plane): number => Math.max(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]);
const lowOf = (p: Plane): number => Math.min(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]);

describe("the wrestling ring's figures", () => {
  it("are typical, and say so: 14 to 20 feet, three ropes at about 1, 3 and 5 feet that are not tied together, a platform of 40 inches, an apron of a foot, steps at two corners", () => {
    expect(PRO_RING.size.min / FT).toBeCloseTo(14, 9);
    expect(PRO_RING.size.max / FT).toBeCloseTo(20, 9);
    expect(PRO_RING.size.drawn / FT).toBeCloseTo(20, 9);
    expect(PRO_RING.ropes.count).toBe(3);
    expect(PRO_RING.ropes.heights.map((h) => Math.round(h / FT))).toEqual([1, 3, 5]);
    expect(PRO_RING.ties).toBe(false);
    expect(PRO_RING.boxerCorners).toBe(false);
    expect(PRO_RING.platform.height.drawn / 0.0254).toBeCloseTo(40, 9);
    expect(PRO_RING.platform.steps.sets).toBe(2);
    expect(PRO_WRESTLING_LEAGUES.map((l) => l.id)).toEqual(["pro-ring"]);
    for (const id of PRO_WRESTLING_LEAGUES[0].sources) expect(LEAGUE_SOURCES[id], id).toBeDefined();
    expect(LEAGUE_SOURCES["wp-wrestling-ring"].note).toContain("typical, not a rule");
  });
});

describe("the wrestling ring's plan and drawing", () => {
  it("is a square of 20 feet inside the ropes on a platform with an apron of a foot at least, and four corners without boxers' colours", () => {
    const L = plan().prowrestling!;
    expect(L.size / FT).toBeCloseTo(20, 9);
    expect(L.apron).toBeGreaterThanOrEqual(FT - 1e-9);
    expect(L.platform.x1 - L.platform.x0).toBeCloseTo(L.size + 2 * L.apron, 9);
    expect(L.corners).toHaveLength(4);
    expect(L.steps.map((s) => s.corner)).toEqual([3, 1]);
    expect(L.marks.some((m) => m.id === "ring-red-corner")).toBe(false);
    expect(L.marks.some((m) => m.id === "ring-platform")).toBe(true);
    expect(L.marks.length).toBeGreaterThanOrEqual(6);
  });

  it("takes the size (14 to 20 feet), the platform (0 to 6 feet) and the steps from the options, and refuses outside them", () => {
    expect(plan({ size: 18 * FT }).prowrestling!.size / FT).toBeCloseTo(18, 9);
    expect(plan({ height: 0 }).prowrestling!.steps).toHaveLength(0);
    expect(plan({ steps: false }).prowrestling!.steps).toHaveLength(0);
    expect(() => plan({ size: 13 * FT })).toThrow(RangeError);
    expect(() => plan({ size: 21 * FT })).toThrow(/typically made/);
    expect(() => plan({ height: 2 })).toThrow(/platform/);
  });

  it("is the same text for the same options, in the ring's three looks, with its words in both languages", () => {
    expect(drawKyogijo({ sport: "prowrestling", id: "a" })).toBe(drawKyogijo({ sport: "prowrestling", id: "a" }));
    expect(lookNames("prowrestling")).toEqual(["white", "blue", "black"]);
    const en = drawKyogijo({ sport: "prowrestling" });
    expect(en).toContain("a professional wrestling ring: a square of 6.1 metres (20 feet) inside three ropes, on a canvas with an apron 30.5 centimetres wide beyond them and a padded post in each corner, on a platform 101.6 centimetres high");
    expect(en).toContain("The three ropes are not tied together.");
    expect(en).toContain("Steel steps stand beside the platform at two corners.");
    expect(drawKyogijo({ sport: "prowrestling", language: "ja" })).toContain("プロレスのリング");
    expect(drawKyogijo({ sport: "prowrestling", language: "ja" })).toContain("各辺に3本のロープが張られています");
    for (const mark of plan().prowrestling!.marks) {
      expect(KYOGIJO_STRINGS.en.notes.names[mark.id], mark.id).toMatch(/\S/);
      expect(KYOGIJO_STRINGS.ja.notes.names[mark.id], mark.id).toMatch(/[぀-ヿ一-鿿]/u);
    }
    expect(SPORTS).toContain("prowrestling");
    const featureColors = Object.fromEntries(FEATURES.prowrestling.map((name) => [name, "#123456"]));
    const svg = drawKyogijo({ sport: "prowrestling", id: "f", featureColors });
    for (const name of FEATURES.prowrestling) expect(withClass(parseXml(svg), `ky-f-${name}`).length, name).toBeGreaterThan(0);
  });
});

describe("the wrestling ring in 3D", () => {
  const deckTop = model.planes.find((p) => p.id === "deck-top")!;
  const h0 = deckTop.o[2];

  it("stands on a solid platform of 40 inches with four posts, three ropes at 1, 3 and 5 feet, extensions to the posts and no ties", () => {
    expect(model.planes.filter((p) => /^deck-\d$/.test(p.id))).toHaveLength(4);
    expect(h0).toBeCloseTo(40 / 12, 6);
    expect(model.planes.filter((p) => p.kind === "post")).toHaveLength(8);
    const ropes = model.planes.filter((p) => /^rope-\d-(\d|ext-\d)/.test(p.id));
    expect(ropes).toHaveLength(3 * 8 * 2);
    const levels = [...new Set(ropes.map((p) => Math.round(((lowOf(p) + heightOf(p)) / 2 - h0) * 100) / 100))].sort((a, b) => a - b);
    expect(levels).toEqual([1, 3, 5]);
    expect(model.planes.some((p) => p.id.startsWith("tie-"))).toBe(false);
    expect(model.standing).toContain("platform");
    for (const p of model.planes) expect(p.svg).not.toContain("<text");
  });

  it("draws the platform's far sides before its top and its near sides after it, and the posts and ropes over the top, at every turn and tip", () => {
    const middle = (p: Plane): [number, number, number] => [(p.o[0] + (p.u[0] + p.v[0]) / 2 - model.centre[0]) * model.scale, (p.o[1] + (p.u[1] + p.v[1]) / 2 - model.centre[1]) * model.scale, (p.o[2] + (p.u[2] + p.v[2]) / 2) * model.scale];
    const sides = model.planes.filter((p) => /^deck-\d$/.test(p.id));
    const standing = model.planes.filter((p) => p.kind === "post" || p.kind === "rail");
    const topIndex = model.planes.indexOf(deckTop) + 1;
    for (const pitch of [20, 45, 62, 70, 84]) {
      for (const yaw of range(0, 355, 5)) {
        const view = { yaw, pitch, zoom: 1 };
        const layout = layoutOf(model, view, 960, 600);
        const topDepth = depthOf(middle(deckTop), view, layout.at);
        for (const side of sides) {
          const d = depthOf(middle(side), view, layout.at);
          if (Math.abs(d - topDepth) < 1e-6) continue;
          expect(layout.stack[model.planes.indexOf(side) + 1] < layout.stack[topIndex], `${side.id} yaw ${yaw} pitch ${pitch}`).toBe(d < topDepth);
        }
        for (const part of standing) if (depthOf(middle(part), view, layout.at) > topDepth + 1e-6) expect(layout.stack[model.planes.indexOf(part) + 1], `${part.id} yaw ${yaw} pitch ${pitch}`).toBeGreaterThan(layout.stack[topIndex]);
      }
    }
  });
});
