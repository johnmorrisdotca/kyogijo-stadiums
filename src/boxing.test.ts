// The boxing ring: a square raised platform with its canvas, four ropes and a post and a pad in each corner, from the Nevada Rules of Unarmed Combat (2.050), Wisconsin's SPS 192.38 and the WBC Amateur rules. The figures,
// the options that change them, the refusals, the words in both languages, and the 3D view: a platform that is a solid block, solid posts in the corner colours, thin ropes that leave the canvas in sight, the order the
// parts are drawn in from every side, and a scene that stays inside its box.
import { describe, expect, it } from "vitest";
import { budoPlan, lookNames } from "./budo-entry.ts";
import { BUDO_LOOKS } from "./budo/looks.ts";
import { drawKyogijo, SPORTS } from "./draw.ts";
import { FEATURES } from "./features.ts";
import { BOXING_LEAGUES, NRUC_RING, WBC_AMATEUR_RING, WISCONSIN_RING } from "./leagues/combat.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { buildTurn, eyeDistance, layoutOf, project, turnMarkup } from "./turn-entry.ts";
import { depthOf } from "./turn.camera.ts";
import type { Plane } from "./turn.kit.ts";
import { parseXml, withClass } from "./xml.fixture.ts";

const FT = 0.3048;
const IN = 0.0254;
const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);
const plan = (budo?: Record<string, unknown>, extra: Record<string, unknown> = {}) => budoPlan({ sport: "boxing", budo, ...extra } as Parameters<typeof budoPlan>[0]);
const model = buildTurn({ sport: "boxing" }, {});
const middleOf = (p: Plane): [number, number, number] => [(p.o[0] + (p.u[0] + p.v[0]) / 2 - model.centre[0]) * model.scale, (p.o[1] + (p.u[1] + p.v[1]) / 2 - model.centre[1]) * model.scale, (p.o[2] + (p.u[2] + p.v[2]) / 2) * model.scale];
const heightOf = (p: Plane): number => Math.max(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]);
const lowOf = (p: Plane): number => Math.min(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]);

describe("the ring's figures", () => {
  it("are Nevada's: 20 feet within the ropes, a platform of at most 5 feet, posts of 58 inches at least 18 inches from the ropes, ropes of at least 1 inch, the lowest 18 inches up", () => {
    expect(NRUC_RING.size.min / FT).toBeCloseTo(20, 9);
    expect(NRUC_RING.size.max / FT).toBeCloseTo(20, 9);
    expect(NRUC_RING.platform.height.max / FT).toBeCloseTo(5, 9);
    expect(NRUC_RING.apron.min / IN).toBeCloseTo(18, 9);
    expect(NRUC_RING.post.height / IN).toBeCloseTo(58, 9);
    expect(NRUC_RING.post.fromRopes / IN).toBeCloseTo(18, 9);
    expect(NRUC_RING.post.diameter / IN).toBeCloseTo(3, 9);
    expect(NRUC_RING.ropes.diameter.min / IN).toBeCloseTo(1, 9);
    expect(NRUC_RING.ropes.heights[0] / IN).toBeCloseTo(18, 9);
    expect(NRUC_RING.ropes.count).toBe(4);
  });

  it("are Wisconsin's: 16 to 20 feet, a platform of at most 4 feet, three sets of steps, ropes at 18, 30, 42 and 54 inches", () => {
    expect(WISCONSIN_RING.size.min / FT).toBeCloseTo(16, 9);
    expect(WISCONSIN_RING.size.max / FT).toBeCloseTo(20, 9);
    expect(WISCONSIN_RING.platform.height.max / FT).toBeCloseTo(4, 9);
    expect(WISCONSIN_RING.platform.steps.sets).toBe(3);
    expect(WISCONSIN_RING.ropes.heights.map((h) => Math.round(h / IN))).toEqual([18, 30, 42, 54]);
  });

  it("are the WBC Amateur rules': 4.5 to 6.1 m, a platform of 0.9 to 1.2 m, an apron of at least 0.5 m, ropes of 3 to 5 cm at 41, 71, 102 and 132 cm", () => {
    expect(WBC_AMATEUR_RING.size).toMatchObject({ min: 4.5, max: 6.1 });
    expect(WBC_AMATEUR_RING.platform.height).toMatchObject({ min: 0.9, max: 1.2 });
    expect(WBC_AMATEUR_RING.apron.min).toBe(0.5);
    expect(WBC_AMATEUR_RING.ropes.diameter).toMatchObject({ min: 0.03, max: 0.05 });
    expect(WBC_AMATEUR_RING.ropes.heights).toEqual([0.41, 0.71, 1.02, 1.32]);
  });

  it("have three leagues with their sources listed, and name no federation's or promotion's mark", () => {
    expect(BOXING_LEAGUES.map((l) => l.id)).toEqual(["nruc-ring", "wisconsin", "wbc-amateur"]);
    for (const league of BOXING_LEAGUES) for (const id of league.sources) expect(LEAGUE_SOURCES[id], id).toBeDefined();
    expect(LEAGUE_SOURCES["ontario-amateur-boxing"].url).toContain("ontario.ca");
  });
});

describe("the ring's plan", () => {
  it("is a square of 20 feet inside the ropes on a platform with an apron, the ropes reaching four posts that stand 18 inches off them", () => {
    const L = plan().boxing!;
    expect(L.size / FT).toBeCloseTo(20, 9);
    const side = L.platform.x1 - L.platform.x0;
    expect(side).toBeCloseTo(L.size + 2 * L.apron, 9);
    expect(L.apron).toBeGreaterThanOrEqual(2 * FT - 1e-9);
    expect(L.ring.x1 - L.ring.x0).toBeCloseTo(L.size, 9);
    expect(L.corners).toHaveLength(4);
    for (const c of L.corners) {
      // Each post is 18 inches outside the ropes on both sides it is between.
      expect(Math.abs(c.post[0] - c.rope[0])).toBeCloseTo(18 * IN, 3);
      expect(Math.abs(c.post[1] - c.rope[1])).toBeCloseTo(18 * IN, 3);
    }
  });

  it("has a red corner at the bottom left, a blue one at the top right and two white ones, and three sets of steps (red, blue, neutral)", () => {
    const L = plan().boxing!;
    expect(L.corners.map((c) => c.colour)).toEqual(["white", "blue", "white", "red"]);
    expect(L.corners[3].post[0]).toBeLessThan(L.centre[0]);
    expect(L.corners[3].post[1]).toBeGreaterThan(L.centre[1]);
    expect(L.corners[1].post[0]).toBeGreaterThan(L.centre[0]);
    expect(L.corners[1].post[1]).toBeLessThan(L.centre[1]);
    expect(L.steps.map((s) => s.corner)).toEqual([3, 1, 2]);
    expect(L.parts.areas.filter((a) => a.id.startsWith("step-"))).toHaveLength(9);
  });

  it("takes the side and the height from the options within what the league allows, and refuses outside it", () => {
    expect(plan({ size: 16 * FT }, { league: "wisconsin" }).boxing!.size / FT).toBeCloseTo(16, 9);
    expect(plan({ size: 5 }, { league: "wbc-amateur" }).boxing!.size).toBe(5);
    expect(plan({ height: 0 }).boxing!.height).toBe(0);
    expect(plan({ height: 1.5 }).boxing!.height).toBe(1.5);
    expect(() => plan({ size: 18 * FT })).toThrow(/Nevada/);
    expect(() => plan({ size: 15 * FT }, { league: "wisconsin" })).toThrow(RangeError);
    expect(() => plan({ size: 7 }, { league: "wbc-amateur" })).toThrow(/WBC Amateur/);
    expect(() => plan({ height: 1.6 })).toThrow(/platform/);
    expect(() => plan({ height: 1.3 }, { league: "wisconsin" })).toThrow(RangeError);
    expect(() => plan({ size: "big" })).toThrow(TypeError);
    expect(() => plan({ corners: "yes" })).toThrow(/true or false/);
  });

  it("leaves the steps out for a ring on the floor or when asked, and the corners plain", () => {
    expect(plan({ steps: false }).boxing!.steps).toHaveLength(0);
    expect(plan({ height: 0 }).boxing!.steps).toHaveLength(0);
    const plain = plan({ corners: false }).boxing!;
    expect(plain.parts.areas.filter((a) => a.id.startsWith("corner-")).every((a) => a.cls === "ky-bud-pad")).toBe(true);
    expect(plan().boxing!.parts.areas.filter((a) => a.id.startsWith("corner-")).map((a) => a.cls)).toEqual(["ky-bud-corner-white", "ky-bud-corner-blue", "ky-bud-corner-white", "ky-bud-corner-red"]);
  });

  it("is Nevada's ring unless another is asked for, and refuses a league it has not got", () => {
    expect(plan().league).toBe("nruc-ring");
    expect(plan(undefined, { league: "wbc-amateur" }).league).toBe("wbc-amateur");
    expect(() => plan(undefined, { league: "nba" })).toThrow(/Unknown league "nba" for "boxing"/);
  });
});

describe("the ring's drawing", () => {
  it("is the same text for the same options, in three looks, light and dark", () => {
    expect(drawKyogijo({ sport: "boxing", id: "a" })).toBe(drawKyogijo({ sport: "boxing", id: "a" }));
    expect(lookNames("boxing")).toEqual(["white", "blue", "black"]);
    for (const name of lookNames("boxing")) {
      const svg = drawKyogijo({ sport: "boxing", budo: { look: name }, id: "l" });
      expect(svg).toContain(`data-look="${name}"`);
      expect(svg).toContain("--ky-bud-rope:");
      expect(BUDO_LOOKS.boxing[name].dark.surface).not.toBe(BUDO_LOOKS.boxing[name].light.surface);
    }
    expect(() => drawKyogijo({ sport: "boxing", budo: { look: "gold" } })).toThrow(/Unknown look "gold" for "boxing"/);
  });

  it("draws the canvas, the ropes, four pads in their colours and the steps, with every part named for the features", () => {
    const tree = parseXml(drawKyogijo({ sport: "boxing", id: "d" }));
    for (const cls of ["ky-bud-t1", "ky-bud-rope", "ky-bud-corner-red", "ky-bud-corner-blue", "ky-bud-corner-white", "ky-bud-step"]) expect(withClass(tree, cls).length, cls).toBeGreaterThan(0);
    const featureColors = Object.fromEntries(FEATURES.boxing.map((name) => [name, "#123456"]));
    const svg = drawKyogijo({ sport: "boxing", id: "f", featureColors });
    for (const name of FEATURES.boxing) expect(withClass(parseXml(svg), `ky-f-${name}`).length, name).toBeGreaterThan(0);
  });

  it("says what it is, in English and in Japanese, with its figures", () => {
    const en = drawKyogijo({ sport: "boxing" });
    expect(en).toContain("a boxing ring: a square of 6.1 metres (20 feet) inside four ropes, on a canvas with an apron 62.7 centimetres wide beyond them and a padded post in each corner, on a platform 121.9 centimetres high");
    expect(en).toContain("The corners are red and blue for the two boxers and white for the neutral ones.");
    expect(en).toContain("Three sets of steps lead up to the platform");
    const ja = drawKyogijo({ sport: "boxing", language: "ja" });
    expect(ja).toContain("ボクシングのリング");
    expect(ja).toContain("一辺20フィート（約6.1m）の正方形で、各辺に4本のロープが張られています");
    expect(drawKyogijo({ sport: "boxing", budo: { height: 0 } })).toContain("at floor level");
  });

  it("labels its parts, each with words in both languages", () => {
    const L = plan().boxing!;
    expect(L.marks.length).toBeGreaterThanOrEqual(6);
    for (const mark of L.marks) {
      expect(KYOGIJO_STRINGS.en.notes.names[mark.id], mark.id).toMatch(/\S/);
      expect(KYOGIJO_STRINGS.ja.notes.names[mark.id], mark.id).toMatch(/[぀-ヿ一-鿿]/u);
    }
    expect(drawKyogijo({ sport: "boxing", landmarks: true })).toContain("Labelled parts");
  });

  it("is a surface of the package, with a unit of feet, no home side and ranges for the ropes and a corner", () => {
    expect(SPORTS).toContain("boxing");
    for (const range of ["ropes", "corner", "half"] as const) {
      const whole = parseXml(drawKyogijo({ sport: "boxing" })).attrs.viewBox.split(" ").map(Number);
      const part = parseXml(drawKyogijo({ sport: "boxing", range })).attrs.viewBox.split(" ").map(Number);
      expect(part[2] * part[3], range).toBeLessThan(whole[2] * whole[3]);
    }
  });

  it("leaves the other combat and budō drawings as they were", () => {
    expect(drawKyogijo({ sport: "mma" })).not.toContain("ky-bud-rope");
    expect(drawKyogijo({ sport: "judo" })).not.toContain("ky-bud-corner");
  });
});

describe("the ring in 3D", () => {
  const deckTop = model.planes.find((p) => p.id === "deck-top")!;
  const h0 = deckTop.o[2];

  it("raises the platform as a solid block: four sides from the floor of the hall to the canvas and a flat top at the platform's height, 4 feet", () => {
    const sides = model.planes.filter((p) => /^deck-\d$/.test(p.id));
    expect(sides).toHaveLength(4);
    expect(deckTop.crop).toBe(true);
    expect(h0).toBeCloseTo(4, 6);
    for (const s of sides) {
      expect(s.o[2]).toBeCloseTo(h0, 6);
      expect(s.o[2] + s.v[2]).toBeCloseTo(0, 6);
    }
    expect(model.uprights.lift).toBe(0);
    expect(model.uprights.whole).toBe(true);
    const markup = turnMarkup({ sport: "boxing" }, {});
    const piece = /<div class="ky-up ky-up-platform"[^>]*data-part="deck-top"[^>]*>(.*?)<\/div><div class="ky-up|<div class="ky-up ky-up-platform"[^>]*data-part="deck-top"[^>]*>(.*)/s.exec(markup)!;
    expect(piece[1] ?? piece[2]).toContain("ky-bud-rope");
  });

  it("has four solid posts in the corner colours, 58 inches over the ring floor", () => {
    const posts = model.planes.filter((p) => p.kind === "post");
    expect(posts).toHaveLength(8);
    for (const p of posts) {
      expect(p.svg).toMatch(/u-corner-(red|blue|white)/);
      expect(lowOf(p)).toBeCloseTo(h0, 6);
      expect(heightOf(p)).toBeCloseTo(h0 + 58 / 12, 6);
    }
    for (const colour of ["red", "blue", "white"]) expect(posts.some((p) => p.svg.includes(`u-corner-${colour}`)), colour).toBe(true);
  });

  it("has four ropes a side at 18, 30, 42 and 54 inches, each turning to its post by an extension, and two ties a side", () => {
    const ropes = model.planes.filter((p) => /^rope-\d-(\d|ext-\d)/.test(p.id));
    // Four levels, four sides and four extensions, each a bar of two crossed strips.
    expect(ropes).toHaveLength(4 * 8 * 2);
    const levels = [...new Set(ropes.map((p) => Math.round(((lowOf(p) + heightOf(p)) / 2 - h0) * 12)))].sort((a, b) => a - b);
    expect(levels).toEqual([18, 30, 42, 54]);
    for (const rope of ropes) expect(rope.svg).toContain("u-rope");
    expect(model.planes.filter((p) => p.id.startsWith("tie-"))).toHaveLength(8 * 2);
    // Thin, with no fill that hides the canvas: no plane of the ropes is as wide as a hand.
    for (const rope of ropes) expect(Math.min(Math.hypot(...rope.u), Math.hypot(...rope.v))).toBeLessThan(0.2);
  });

  it("draws the platform's far sides before its top and its near sides after it, and the posts and the ropes over the top, at every turn and every tip", () => {
    const sides = model.planes.filter((p) => /^deck-\d$/.test(p.id));
    const standing = model.planes.filter((p) => p.kind === "post" || p.kind === "rail");
    const topIndex = model.planes.indexOf(deckTop) + 1;
    for (const pitch of [20, 45, 62, 70, 84]) {
      for (const yaw of range(0, 355, 5)) {
        const view = { yaw, pitch, zoom: 1 };
        const layout = layoutOf(model, view, 960, 600);
        const topDepth = depthOf(middleOf(deckTop), view, layout.at);
        for (const side of sides) {
          const sideDepth = depthOf(middleOf(side), view, layout.at);
          if (Math.abs(sideDepth - topDepth) < 1e-6) continue;
          expect(layout.stack[model.planes.indexOf(side) + 1] < layout.stack[topIndex], `${side.id} yaw ${yaw} pitch ${pitch}`).toBe(sideDepth < topDepth);
        }
        for (const part of standing) {
          const index = model.planes.indexOf(part) + 1;
          if (depthOf(middleOf(part), view, layout.at) > topDepth + 1e-6) expect(layout.stack[index], `${part.id} yaw ${yaw} pitch ${pitch}`).toBeGreaterThan(layout.stack[topIndex]);
        }
        expect(layout.stack[0]).toBe(1);
      }
    }
  });

  it("keeps the whole floor, the posts and the ropes inside the container at every turn and tip, desk and phone", () => {
    const v = model.viewBox;
    const floor = [[v.x, v.y], [v.x + v.w, v.y], [v.x + v.w, v.y + v.h], [v.x, v.y + v.h]].map(([x, y]): [number, number, number] => [(x - model.centre[0]) * model.scale, (y - model.centre[1]) * model.scale, 0]);
    const standing = model.planes.flatMap((p) => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]): [number, number, number] => [(p.o[0] + a * p.u[0] + b * p.v[0] - model.centre[0]) * model.scale, (p.o[1] + a * p.u[1] + b * p.v[1] - model.centre[1]) * model.scale, (p.o[2] + a * p.u[2] + b * p.v[2]) * model.scale]));
    for (const [w, h] of [[960, 600], [390, 300]]) {
      const d = eyeDistance(w, h);
      for (const pitch of [0, 30, 62, 84]) {
        for (const yaw of range(0, 355, 5)) {
          const view = { yaw, pitch, zoom: 1 };
          const at = layoutOf(model, view, w, h).at;
          for (const point of [...floor, ...standing]) {
            const [x, y] = project(point, view, at, d);
            expect(Math.abs(x), `x at yaw ${yaw} pitch ${pitch} ${w}x${h}`).toBeLessThanOrEqual(w / 2);
            expect(Math.abs(y), `y at yaw ${yaw} pitch ${pitch} ${w}x${h}`).toBeLessThanOrEqual(h / 2);
          }
        }
      }
    }
  });

  it("writes no text on any plane, and says in words what stands on it", () => {
    for (const p of model.planes) expect(p.svg).not.toContain("<text");
    expect(model.standing).toContain("platform 4 feet, corner posts 4.8 feet, ropes 4.5 feet");
    expect(buildTurn({ sport: "boxing", language: "ja" }, {}).standing).toContain("コーナーポスト");
  });

  it("follows the league and the options: a ring on the floor has no steps, the amateurs' ropes are at their heights", () => {
    const low = buildTurn({ sport: "boxing", budo: { height: 0 } }, {});
    expect(low.planes.some((p) => p.id.startsWith("step-"))).toBe(false);
    expect(low.planes.find((p) => p.id === "deck-top")!.o[2]).toBe(0);
    const amateur = buildTurn({ sport: "boxing", league: "wbc-amateur" }, {});
    const h = amateur.planes.find((p) => p.id === "deck-top")!.o[2];
    const rope = amateur.planes.find((p) => p.id === "rope-4-1")!;
    expect((lowOf(rope) - h) * 0.3048).toBeCloseTo(1.32 - 0.04 * 0.5 / 1, 1);
  });
});
