// The MMA cage: an eight-sided fenced area on a platform, drawn from the Nevada Rules of Unarmed Combat (5.010 3) and the IMMAF's rules for amateur competition. The figures, the options that change them, the
// refusals, the words in both languages, and the 3D view: a platform that is a solid block, a fence of mesh that leaves the canvas in sight, solid posts, the order the parts are drawn in from every side, and
// a scene that stays inside its box.
import { describe, expect, it } from "vitest";
import { budoPlan, lookNames } from "./budo-entry.ts";
import { BUDO_LOOKS } from "./budo/looks.ts";
import { drawKyogijo, SPORTS } from "./draw.ts";
import { IMMAF_CAGE, MMA_LEAGUES, NRUC_CAGE } from "./leagues/combat.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";
import { FEATURES } from "./features.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { buildTurn, eyeDistance, layoutOf, project, turnMarkup } from "./turn-entry.ts";
import { depthOf } from "./turn.camera.ts";
import type { Plane } from "./turn.kit.ts";
import { parseXml, walk, withClass } from "./xml.fixture.ts";

const FT = 0.3048;
const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);
const plan = (budo?: Record<string, unknown>, extra: Record<string, unknown> = {}) => budoPlan({ sport: "mma", budo, ...extra } as Parameters<typeof budoPlan>[0]);
const model = buildTurn({ sport: "mma" }, {});
const byKind = (kind: string): Plane[] => model.planes.filter((p) => p.kind === kind);
const middleOf = (p: Plane): [number, number, number] => [(p.o[0] + (p.u[0] + p.v[0]) / 2 - model.centre[0]) * model.scale, (p.o[1] + (p.u[1] + p.v[1]) / 2 - model.centre[1]) * model.scale, (p.o[2] + (p.u[2] + p.v[2]) / 2) * model.scale];

describe("the cage's figures", () => {
  it("are the commissions' and the IMMAF's: 20 to 32 feet wide, a platform of at most 4 feet, posts of 5 to 7 feet, two gates, a foam floor", () => {
    for (const fig of [NRUC_CAGE, IMMAF_CAGE]) {
      expect(fig.width.min / FT).toBeCloseTo(20, 9);
      expect(fig.width.max / FT).toBeCloseTo(32, 9);
      expect(fig.width.drawn / FT).toBeCloseTo(30, 9);
      expect(fig.platform.height.max / FT).toBeCloseTo(4, 9);
      expect(fig.fence.min / FT).toBeCloseTo(5, 9);
      expect(fig.fence.max / FT).toBeCloseTo(7, 9);
      expect(fig.fence.drawn / FT).toBeCloseTo(6, 9);
      expect(fig.post.diameter / FT).toBeCloseTo(0.5, 9);
      expect(fig.gates.count).toBe(2);
      expect(fig.sides).toBe(8);
    }
    // 1 inch of foam in Nevada, 40 millimetres in the IMMAF's rules.
    expect(NRUC_CAGE.foam).toBeCloseTo(0.0254, 9);
    expect(IMMAF_CAGE.foam).toBeCloseTo(0.04, 9);
  });

  it("have two leagues, each with sources that are listed", () => {
    expect(MMA_LEAGUES.map((l) => l.id)).toEqual(["nruc", "immaf"]);
    for (const league of MMA_LEAGUES) {
      expect(league.unit).toBe("ft");
      for (const id of league.sources) expect(LEAGUE_SOURCES[id], id).toBeDefined();
    }
  });

  it("never name a promotion: the cage is named for what it is", () => {
    const words = JSON.stringify([KYOGIJO_STRINGS.en.surface.mma, KYOGIJO_STRINGS.ja.surface.mma, MMA_LEAGUES.map((l) => l.name), KYOGIJO_STRINGS.en.budo.mma, KYOGIJO_STRINGS.en.about.mma, drawKyogijo({ sport: "mma" })]);
    expect(words).not.toMatch(/UFC|ufc|Octagon|octagon™|Zuffa/);
  });
});

describe("the cage's plan", () => {
  it("is a regular octagon of 30 feet across the flats, standing in a square platform with an apron of 1.2 m", () => {
    const L = plan().mma!;
    expect(L.width / FT).toBeCloseTo(30, 9);
    expect(L.posts).toHaveLength(8);
    const [cx, cy] = L.centre;
    for (const [x, y] of L.posts) expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(L.corner, 2);
    // Each side is the width times the tangent of an eighth of a turn, and all eight are the same.
    for (let i = 0; i < 8; i += 1) {
      const p = L.posts[i];
      const q = L.posts[(i + 1) % 8];
      expect(Math.hypot(q[0] - p[0], q[1] - p[1])).toBeCloseTo(L.width * Math.tan(Math.PI / 8), 2);
    }
    expect(L.platform.x1 - L.platform.x0).toBeCloseTo(L.width + 2.4, 9);
    expect(L.platform.y1 - L.platform.y0).toBeCloseTo(L.width + 2.4, 9);
    // The apothem is half the width: the flats face the four sides of the platform.
    expect(Math.max(...L.posts.map((p) => p[0])) - Math.min(...L.posts.map((p) => p[0]))).toBeCloseTo(2 * L.corner * Math.cos(Math.PI / 8), 2);
  });

  it("has two gates opposite each other, 0.9 m wide, each with three treads of steps at the platform's edge", () => {
    const L = plan().mma!;
    expect(L.gates.map((g) => g.side)).toEqual(["north", "south"]);
    for (const g of L.gates) expect(Math.hypot(g.to[0] - g.from[0], g.to[1] - g.from[1])).toBeCloseTo(0.9, 2);
    expect(L.steps).toHaveLength(2);
    expect(L.steps[0].y1).toBeCloseTo(0, 9);
    expect(L.steps[1].y0).toBeCloseTo(L.platform.y1, 9);
    expect(L.parts.areas.filter((a) => a.id.startsWith("step-"))).toHaveLength(6);
  });

  it("takes the width, the platform's height and the fence's height from the options, within what the rules allow", () => {
    const small = plan({ size: 25 * FT, height: 1, fence: 5.5 * FT }).mma!;
    expect(small.width / FT).toBeCloseTo(25, 9);
    expect(small.height).toBe(1);
    expect(small.fence / FT).toBeCloseTo(5.5, 9);
    expect(plan({ size: 20 * FT }).mma!.width / FT).toBeCloseTo(20, 9);
    expect(plan({ size: 32 * FT }).mma!.width / FT).toBeCloseTo(32, 9);
    expect(plan({ height: 0 }).mma!.height).toBe(0);
    expect(() => plan({ size: 19 * FT })).toThrow(/20 feet|6\.096/);
    expect(() => plan({ size: 33 * FT })).toThrow(RangeError);
    expect(() => plan({ height: 1.3 })).toThrow(/platform/);
    expect(() => plan({ fence: 1.4 })).toThrow(/fence/);
    expect(() => plan({ fence: 2.2 })).toThrow(RangeError);
    expect(() => plan({ size: "big" })).toThrow(TypeError);
    expect(() => plan({ gates: "yes" })).toThrow(/true or false/);
  });

  it("leaves the gates and the steps out when asked, and the fence is then whole", () => {
    const bare = plan({ gates: false }).mma!;
    expect(bare.gates).toHaveLength(0);
    expect(bare.steps).toHaveLength(0);
    expect(plan({ steps: false }).mma!.steps).toHaveLength(0);
    expect(plan({ steps: false }).mma!.gates).toHaveLength(2);
    expect(bare.parts.shapes.filter((s) => s.feature === "fence")).toHaveLength(8);
    expect(plan().mma!.parts.shapes.filter((s) => s.feature === "fence")).toHaveLength(10);
  });

  it("is the nruc's cage unless the IMMAF's is asked for, and refuses a league it has not got", () => {
    expect(plan().league).toBe("nruc");
    expect(plan(undefined, { league: "immaf" }).league).toBe("immaf");
    expect(() => plan(undefined, { league: "nba" })).toThrow(/Unknown league "nba" for "mma"/);
  });
});

describe("the cage's drawing", () => {
  it("is the same text for the same options, in three looks, light and dark", () => {
    expect(drawKyogijo({ sport: "mma", id: "a" })).toBe(drawKyogijo({ sport: "mma", id: "a" }));
    expect(lookNames("mma")).toEqual(["grey", "black", "blue"]);
    for (const name of lookNames("mma")) {
      const svg = drawKyogijo({ sport: "mma", look: undefined, budo: { look: name }, id: "l" });
      expect(svg).toContain(`data-look="${name}"`);
      expect(svg).toContain("prefers-color-scheme:dark");
      expect(BUDO_LOOKS.mma[name].dark.surface).not.toBe(BUDO_LOOKS.mma[name].light.surface);
    }
    expect(() => drawKyogijo({ sport: "mma", budo: { look: "gold" } })).toThrow(/Unknown look "gold" for "mma"/);
  });

  it("draws the platform, the canvas, eight padded posts, the fence and the gates' swing, with every part named for the features", () => {
    const tree = parseXml(drawKyogijo({ sport: "mma", id: "d" }));
    for (const cls of ["ky-bud-platform", "ky-bud-t1", "ky-bud-pad", "ky-bud-step", "ky-bud-ink"]) expect(withClass(tree, cls).length, cls).toBeGreaterThan(0);
    const featureColors = Object.fromEntries(FEATURES.mma.map((name) => [name, "#123456"]));
    const svg = drawKyogijo({ sport: "mma", id: "f", featureColors });
    for (const name of FEATURES.mma) expect(withClass(parseXml(svg), `ky-f-${name}`).length, name).toBeGreaterThan(0);
  });

  it("says what it is, in English and in Japanese, with its figures", () => {
    const en = drawKyogijo({ sport: "mma" });
    expect(en).toContain("an MMA cage: an eight-sided fenced area 9.14 metres across (30 feet), with a fence 182.9 centimetres high and eight padded posts, on a platform 121.9 centimetres high");
    expect(en).toContain("It has two gates, opposite each other.");
    expect(en).toContain("Steps lead up to the platform at each gate.");
    const ja = drawKyogijo({ sport: "mma", language: "ja" });
    expect(ja).toContain("総合格闘技のケージ");
    expect(ja).toContain("対辺間の距離が30フィート（約9.14m）");
    expect(drawKyogijo({ sport: "mma", budo: { height: 0, gates: false } })).toContain("at floor level");
  });

  it("labels its parts, each with words in both languages", () => {
    const L = plan().mma!;
    expect(L.marks.length).toBeGreaterThanOrEqual(6);
    for (const mark of L.marks) {
      expect(KYOGIJO_STRINGS.en.notes.names[mark.id], mark.id).toMatch(/\S/);
      expect(KYOGIJO_STRINGS.ja.notes.names[mark.id], mark.id).toMatch(/[぀-ヿ一-鿿]/u);
    }
    expect(drawKyogijo({ sport: "mma", landmarks: true })).toContain("Labelled parts");
  });

  it("is a surface of the package: listed, with a unit of feet, no home side, and a range for the cage and the gate", () => {
    expect(SPORTS).toContain("mma");
    for (const range of ["cage", "gate", "half"] as const) {
      const whole = parseXml(drawKyogijo({ sport: "mma" })).attrs.viewBox.split(" ").map(Number);
      const part = parseXml(drawKyogijo({ sport: "mma", range })).attrs.viewBox.split(" ").map(Number);
      expect(part[2] * part[3], range).toBeLessThan(whole[2] * whole[3]);
    }
  });

  it("stays the same text for the budō: no cage rule is in a judo drawing", () => {
    expect(drawKyogijo({ sport: "judo" })).not.toContain("ky-bud-pad");
    expect(drawKyogijo({ sport: "sumo" })).not.toContain("ky-bud-step");
  });
});

describe("the cage in 3D", () => {
  const heightOf = (p: Plane): number => Math.max(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]);
  const lowOf = (p: Plane): number => Math.min(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]);
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
    // The top is exactly what the sides enclose, and it is the floor's own drawing: the canvas, the fence's line and the posts are on it.
    const xs = sides.flatMap((p) => [p.o[0], p.o[0] + p.u[0]]);
    expect(deckTop.o[0]).toBeCloseTo(Math.min(...xs), 6);
    expect(deckTop.u[0]).toBeCloseTo(Math.max(...xs) - Math.min(...xs), 6);
    const markup = turnMarkup({ sport: "mma" }, {});
    const piece = /<div class="ky-up ky-up-platform"[^>]*data-part="deck-top"[^>]*>(.*?)<\/div><div class="ky-up|<div class="ky-up ky-up-platform"[^>]*data-part="deck-top"[^>]*>(.*)/s.exec(markup)!;
    expect(piece[1] ?? piece[2]).toContain("ky-bud-pad");
    expect(piece[1] ?? piece[2]).toContain('aria-hidden="true"');
  });

  it("stands the fence on the platform: panels of mesh, eight flats and the two gates, as high as the fence, with a pad along the top", () => {
    const meshes = model.planes.filter((p) => p.kind === "net");
    // Six flats whole, and the two with a gate in two pieces and a lintel each.
    expect(meshes).toHaveLength(6 + 2 * 3);
    for (const m of meshes) {
      expect(lowOf(m)).toBeGreaterThanOrEqual(h0 - 1e-9);
      expect(heightOf(m)).toBeLessThanOrEqual(h0 + 6 + 1e-6);
      expect(m.svg).toContain("u-mesh");
      // Mesh and a faint tint, no opaque fill: the canvas is seen through it.
      expect(m.svg).toContain("u-netfill");
      expect(m.svg).not.toMatch(/class="u-(wall|board|cagepad|wood|clay)"/);
      expect(m.shy).toBeDefined();
    }
    const tops = model.planes.filter((p) => /^fence-top-\d$/.test(p.id));
    expect(tops).toHaveLength(8);
    for (const t of tops) expect(heightOf(t)).toBeCloseTo(h0 + 6, 6);
    expect(model.planes.filter((p) => p.id.startsWith("gate-"))).toHaveLength(2);
  });

  it("has eight solid posts, each two crossed strips as wide as the pad, from the platform to a little over the fence", () => {
    const posts = byKind("post");
    expect(posts).toHaveLength(16);
    for (const p of posts) {
      expect(p.svg).toContain("u-cagepad");
      expect(p.svg).not.toContain("u-mesh");
      expect(lowOf(p)).toBeCloseTo(h0, 6);
      expect(heightOf(p)).toBeGreaterThan(h0 + 6);
      expect(p.shy).toBeUndefined();
    }
    // Over the canvas the posts are a little higher than the fence, 6 feet and a hand's breadth.
    expect(model.uprights.items.find((i) => i.kind === "cage-posts")!.height).toBeCloseTo(6 + 0.15 / FT, 6);
    expect(model.uprights.items.find((i) => i.kind === "cage-fence")!.height).toBeCloseTo(6, 6);
  });

  it("leaves the floor in sight: a fence plane gives way when it lies between the eye and the cage, never below 30 per cent, and a far one stays whole", () => {
    const fence = model.planes.find((p) => p.id === "fence-3")!;
    const near = layoutOf(model, { yaw: 0, pitch: 25, zoom: 1 }, 960, 600).fade;
    const fades = model.planes.map((p, i) => ({ p, f: near[i + 1] })).filter((x) => x.p.kind === "net");
    expect(Math.min(...fades.map((x) => x.f))).toBeGreaterThanOrEqual(0.3);
    expect(Math.min(...fades.map((x) => x.f))).toBeLessThan(1);
    expect(Math.max(...fades.map((x) => x.f))).toBe(1);
    expect(fence.fadeTo).toBe(0.3);
    // From straight above nothing is cut away.
    const above = layoutOf(model, { yaw: 40, pitch: 0, zoom: 1 }, 960, 600).fade;
    for (const f of above) expect(f).toBe(1);
  });

  it("draws the platform's far sides before its top and its near sides after it, and the fence and posts after the top, at every turn and every tip", () => {
    const sides = model.planes.filter((p) => /^deck-\d$/.test(p.id));
    const standing = model.planes.filter((p) => p.kind === "net" || p.kind === "post" || p.kind === "rail");
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
        // What stands on the platform is never under it: whatever is nearer the eye than the top's middle is drawn after it, and what stands on its far part before it only where the two do not overlap on the screen.
        for (const part of standing) {
          const index = model.planes.indexOf(part) + 1;
          const d = depthOf(middleOf(part), view, layout.at);
          if (d > topDepth + 1e-6) expect(layout.stack[index], `${part.id} yaw ${yaw} pitch ${pitch}`).toBeGreaterThan(layout.stack[topIndex]);
        }
        // The floor is on the ground, under every plane.
        expect(layout.stack[0]).toBe(1);
      }
    }
  });

  it("draws the steps in order from every side: each tread after the platform's side it leans on when the eye is on its side", () => {
    const treads = model.planes.filter((p) => /^step-north-3-top$/.test(p.id));
    expect(model.planes.filter((p) => /^step-(north|south)-\d-top$/.test(p.id))).toHaveLength(6);
    expect(treads).toHaveLength(1);
    // The highest tread touches the platform's edge and is as high as the platform.
    expect(treads[0].o[2]).toBeCloseTo(h0, 6);
    const low = model.planes.find((p) => p.id === "step-north-1-top")!;
    expect(low.o[2]).toBeCloseTo(h0 / 3, 6);
  });

  it("keeps the whole floor, the fence and the posts inside the container at every turn and tip, desk and phone", () => {
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

  it("writes no text on any plane, so none can be stretched, and says in words what stands on it", () => {
    for (const p of model.planes) expect(p.svg).not.toContain("<text");
    expect(model.standing).toContain("platform 4 feet, fence 6 feet, padded posts 6.5 feet");
    const ja = buildTurn({ sport: "mma", language: "ja" }, {});
    expect(ja.standing).toContain("パッド付き支柱");
  });

  it("follows the options: a platform at the floor has no steps and a lower fence is lower", () => {
    const low = buildTurn({ sport: "mma", budo: { height: 0, fence: 5 * FT, gates: false } }, {});
    expect(low.planes.some((p) => p.id.startsWith("step-"))).toBe(false);
    expect(low.planes.filter((p) => p.kind === "net")).toHaveLength(8);
    const top = low.planes.find((p) => /^fence-top-1$/.test(p.id))!;
    expect(Math.max(top.o[2], top.o[2] + top.v[2])).toBeCloseTo(5, 6);
    expect(low.planes.find((p) => p.id === "deck-top")!.o[2]).toBe(0);
  });
});

describe("walk and root", () => {
  it("is a well-formed picture", () => {
    expect(walk(parseXml(drawKyogijo({ sport: "mma" }))).length).toBeGreaterThan(20);
  });
});
