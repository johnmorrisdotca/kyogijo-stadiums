import { describe, expect, it, vi } from "vitest";
import { OUTSIDE_ROOM, describeDistrict, drawDistrict, planDistrict, type DistrictOptions } from "./district.ts";
import { buildDistrictTurn, districtTurnMarkup } from "./district.turn.ts";
import { OUTSIDE_DENSITY, OUTSIDE_LEVELS, OUTSIDE_VENUES, hasOutside, isOutsideLevel, outsideCount, outsideCrowd, outsideLevelOf, seeded, standsOnWalkable } from "./outside.ts";
import { DOTS_FROM, PERSON_METRES, frameOf, rasterOutside } from "./outside.paint.ts";
import { WALK_DATA, WALK_UNIT } from "./walk.data.ts";
import { WALK_CELL, WALK_IDS, unpack, walkMask, walkable } from "./walk.ts";
import { districtMember } from "./district.ts";
import { metresFrom } from "./venues.geo.ts";
import { VENUE_ATTRIBUTION } from "./venues.ts";

const PAIR: DistrictOptions = { venues: ["bc-place", "rogers-arena"] };
const FEET = 3.28084;
const plan = planDistrict(PAIR);
const crowd = outsideCrowd(plan)!;

/** A checksum of a typed array's bytes (FNV-1a), to compare two crowds without holding both. */
const sum = (a: Float32Array | Uint8Array | Uint8ClampedArray): number => {
  const bytes = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) h = Math.imul(h ^ bytes[i], 0x01000193);
  return h >>> 0;
};

describe("the walkable mask", () => {
  it("is made from OpenStreetMap's features for the venues of a district, with the credit and the day it was read", () => {
    expect(WALK_IDS).toEqual(["vancouver"]);
    expect(OUTSIDE_VENUES).toEqual(["bc-place", "rogers-arena"]);
    const data = WALK_DATA.vancouver;
    expect(data.venues).toEqual(["bc-place:cfl", "rogers-arena"]);
    expect(data.licence).toBe("ODbL-1.0");
    expect(data.attribution).toContain("OpenStreetMap contributors");
    expect(data.source).toMatch(/^data-sources\/walk\/\d{4}-\d{2}-\d{2}\/osm-vancouver\.json$/);
    expect(data.walkLines.length + data.walkAreas.length).toBeGreaterThan(400);
    expect(data.blockLines.length + data.blockAreas.length).toBeGreaterThan(400);
  });

  it("unpacks a feature from its first point and its steps, in quarter-metres", () => {
    expect(WALK_UNIT).toBe(0.25);
    expect(unpack([40, 0, 4, 4, -8, 0])).toEqual([[10, 0], [11, 1], [9, 1]]);
    // A line's first number is its width, in tenths of a metre, and its points follow.
    expect(unpack([24, 40, 0, 4, 4], 1)).toEqual([[10, 0], [11, 1]]);
  });

  it("has no walkable cell inside a venue's own building, but ground round it", () => {
    const data = WALK_DATA.vancouver;
    const buildings = data.venues.map((key) => metresFrom(data.origin, districtMember(key).ring as [number, number][]));
    const mask = walkMask("vancouver", { buildings, apron: 5 });
    expect(mask.cell).toBe(WALK_CELL);
    expect(mask.walkable).toBeGreaterThan(300_000);
    // The middle of each building, and a point just outside its wall.
    for (const ring of buildings) {
      const x = ring.reduce((s, p) => s + p[0], 0) / ring.length;
      const y = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      expect(walkable(mask, x, y)).toBe(false);
    }
    const [bx, by] = buildings[0][0];
    const [cx, cy] = [buildings[0].reduce((s, p) => s + p[0], 0) / buildings[0].length, buildings[0].reduce((s, p) => s + p[1], 0) / buildings[0].length];
    const [dx, dy] = [bx - cx, by - cy];
    const len = Math.hypot(dx, dy);
    expect(walkable(mask, bx + (dx / len) * 2, by + (dy / len) * 2)).toBe(true);
  });

  it("is made the same way twice", () => {
    const data = WALK_DATA.vancouver;
    const buildings = data.venues.map((key) => metresFrom(data.origin, districtMember(key).ring as [number, number][]));
    const a = walkMask("vancouver", { buildings, apron: 5 });
    const b = walkMask("vancouver", { buildings, apron: 4 });
    expect(a).not.toBe(b);
    expect(sum(walkMask("vancouver", { buildings, apron: 5 }).cells)).toBe(sum(a.cells));
    expect(() => walkMask("nowhere", { buildings, apron: 5 })).toThrow(/no walkable mask nowhere.*vancouver/);
  });
});

describe("the crowd outside", () => {
  it("is one list of the venues' seats: 54,500 for BC Place and 18,871 for Rogers Arena, all placed", () => {
    expect(hasOutside(plan)).toBe(true);
    expect(crowd.venues).toEqual([
      { key: "bc-place:cfl", seats: 54500, placed: 54500 },
      { key: "rogers-arena", seats: 18871, placed: 18871 },
    ]);
    expect(crowd.count).toBe(73371);
    expect(crowd.x).toHaveLength(73371);
    expect(crowd.venue).toHaveLength(73371);
  });

  it("has a level for a prefix of its list: 0, 25, 50, 75 and 100 percent, each level's people the first of the next", () => {
    expect(OUTSIDE_LEVELS).toEqual([0, 25, 50, 75, 100]);
    expect(OUTSIDE_LEVELS.map((level) => outsideCount(crowd, level))).toEqual([0, 18343, 36686, 55028, 73371]);
    // Prefixes of one list: the people at a level are the same people at the next, in the same order, and each level adds only the ones after.
    const at = (level: (typeof OUTSIDE_LEVELS)[number]) => outsideCount(crowd, level);
    for (let i = 1; i < OUTSIDE_LEVELS.length; i += 1) expect(at(OUTSIDE_LEVELS[i])).toBeGreaterThan(at(OUTSIDE_LEVELS[i - 1]));
    const first = rasterOutside(crowd, 25, frameOf(plan.view, 1200), [0, 0, 0]);
    expect(first.stats.people).toBe(at(25));
  });

  it("holds each venue's share at every level, to a person: a prefix is a quarter of BC Place's crowd and a quarter of Rogers Arena's", () => {
    for (const level of OUTSIDE_LEVELS) {
      const taken = outsideCount(crowd, level);
      const counts = [0, 0];
      for (let i = 0; i < taken; i += 1) counts[crowd.venue[i]] += 1;
      crowd.venues.forEach((v, k) => expect(Math.abs(counts[k] - (v.placed * level) / 100), `${v.key} at ${level}`).toBeLessThanOrEqual(1));
    }
  });

  it("puts every person on the mask's walkable ground and none off it", () => {
    let off = 0;
    for (let i = 0; i < crowd.count; i += 1) if (!standsOnWalkable(plan, crowd.mask, [crowd.x[i], crowd.y[i]])) off += 1;
    expect(off).toBe(0);
    // Turned with the map the crowd turns with it, and is on the ground still.
    const turned = planDistrict({ ...PAIR, turn: "auto" });
    const other = outsideCrowd(turned)!;
    expect(turned.turn).not.toBe(0);
    for (let i = 0; i < other.count; i += 997) expect(standsOnWalkable(turned, other.mask, [other.x[i], other.y[i]])).toBe(true);
  });

  it("never has more than the density to a square metre, a block of 5 metres by 5 at most", () => {
    const bins = new Map<string, number>();
    for (let i = 0; i < crowd.count; i += 1) {
      const key = `${Math.floor(crowd.x[i] / FEET / 5)},${Math.floor(crowd.y[i] / FEET / 5)}`;
      bins.set(key, (bins.get(key) ?? 0) + 1);
    }
    // Two crowds can meet on a street between the venues: the most is the density's, with room for the two.
    expect(Math.max(...bins.values()) / 25).toBeLessThanOrEqual(OUTSIDE_DENSITY * 1.35);
    expect(bins.size).toBeGreaterThan(5000);
  });

  it("is thicker by a venue than far from it", () => {
    const [bc] = plan.members;
    const near = (limit: number, from: number): number => {
      let n = 0;
      for (let i = 0; i < crowd.count; i += 1) if (crowd.venue[i] === 0) {
        const d = Math.hypot(crowd.x[i] - bc.at[0], crowd.y[i] - bc.at[1]) / FEET;
        if (d >= from && d < limit) n += 1;
      }
      return n;
    };
    // People to a square metre of ring: the ring a hundred metres out has far more ground than the one by the wall, yet fewer people on each metre of it.
    const wall = near(130, 90) / (Math.PI * (130 ** 2 - 90 ** 2));
    const far = near(430, 390) / (Math.PI * (430 ** 2 - 390 ** 2));
    expect(wall).toBeGreaterThan(far);
  });

  it("is the same list every time: the same seed and the same arithmetic, in a fresh copy of the module", async () => {
    vi.resetModules();
    await import("./full.ts");
    const fresh = await import("./outside.ts");
    const freshPlan = (await import("./district.ts")).planDistrict(PAIR);
    const again = fresh.outsideCrowd(freshPlan)!;
    expect(again.count).toBe(crowd.count);
    expect(sum(again.x)).toBe(sum(crowd.x));
    expect(sum(again.y)).toBe(sum(crowd.y));
    expect(sum(again.venue)).toBe(sum(crowd.venue));
    const a = seeded(7);
    const b = seeded(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seeded(8)()).not.toBe(seeded(7)());
  });

  it("does not depend on which venues are shown: Rogers Arena's people are its own, and BC Place alone has BC Place's", () => {
    const alone = outsideCrowd(planDistrict({ venues: ["rogers-arena"] }))!;
    expect(alone.venues).toEqual([{ key: "rogers-arena", seats: 18871, placed: 18871 }]);
    const soccer = outsideCrowd(planDistrict({ venues: ["bc-place:soccer", "rogers-arena"] }))!;
    expect(soccer.venues.map((v) => v.seats)).toEqual([52497, 18871]);
  });

  it("has none for a district with no mask (Seattle, Tokyo): nothing is drawn and the plan does not change", () => {
    for (const venues of [["t-mobile-park", "lumen-field"], ["tokyo-dome", "korakuen-hall"]]) {
      const plain = planDistrict({ venues });
      const asked = planDistrict({ venues, outside: { level: 100 } });
      expect(hasOutside(asked)).toBe(false);
      expect(outsideCrowd(asked)).toBeUndefined();
      expect(asked.view).toEqual(plain.view);
      expect(buildDistrictTurn({ venues, outside: { level: 100 } }).outside).toBeUndefined();
    }
  });

  it("refuses a level that is not one of the five", () => {
    expect(outsideLevelOf(undefined)).toBe(0);
    expect(outsideLevelOf({})).toBe(0);
    expect(outsideLevelOf({ outside: { level: 75 } })).toBe(75);
    expect(isOutsideLevel(30)).toBe(false);
    expect(() => outsideLevelOf({ outside: { level: 30 as 25 } })).toThrow(/levels are 0, 25, 50, 75, 100/);
  });
});

describe("the plan with a crowd outside", () => {
  it("is left as it was when none is asked, and makes room round the buildings when one is, at every level alike", () => {
    expect(planDistrict(PAIR).view.w).toBeCloseTo(1634.8, 0);
    const views = OUTSIDE_LEVELS.map((level) => planDistrict({ ...PAIR, outside: { level } }).view);
    for (const view of views) expect(view).toEqual(views[0]);
    expect(views[0].w).toBeGreaterThan(plan.view.w + 2 * OUTSIDE_ROOM * FEET * 0.5);
    // At least the room's width of ground on every side of the buildings.
    const asked = planDistrict({ ...PAIR, outside: { level: 0 } });
    const xs = asked.members.flatMap((m) => m.footprint.map((p) => p[0]));
    expect(Math.min(...xs) - asked.view.x).toBeGreaterThanOrEqual(OUTSIDE_ROOM * FEET - 1);
  });

  it("is drawn with no element for a person: the SVG says the level and in words who stands outside, and grows by a sentence", () => {
    const plain = drawDistrict(PAIR);
    const full = drawDistrict({ ...PAIR, outside: { level: 100 } });
    expect(full).toContain('data-outside="100"');
    expect(drawDistrict({ ...PAIR, outside: { level: 0 } })).not.toContain("data-outside");
    expect(describeDistrict({ ...PAIR, outside: { level: 50 } }).description).toContain("People outside: 50 percent of the seats of the venues, 36,686 people");
    expect(describeDistrict({ ...PAIR, outside: { level: 50 }, language: "ja" }).description).toContain("会場の外の人出：会場の全座席数の50％にあたる36,686人");
    expect(describeDistrict(PAIR).description).not.toContain("People outside");
    expect(full.length - plain.length).toBeLessThan(1500);
    expect((full.match(/<circle/g) ?? []).length).toBe((plain.match(/<circle/g) ?? []).length);
    expect(full).toContain(VENUE_ATTRIBUTION);
  });

  it("is the same 3D scene with the crowd as a canvas the mount paints: no plane, no element, in the markup", () => {
    const plain = buildDistrictTurn(PAIR);
    const asked = buildDistrictTurn({ ...PAIR, outside: { level: 100 } });
    expect(asked.planes).toHaveLength(plain.planes.length);
    expect(asked.outside).toMatchObject({ level: 100, viewBox: asked.viewBox });
    expect(districtTurnMarkup({ ...PAIR, outside: { level: 100 } })).not.toContain("<canvas");
    expect(asked.outside!.crowd()).toBe(asked.outside!.crowd());
  });
});

describe("the crowd as pixels", () => {
  const ink: [number, number, number] = [194, 65, 12];

  it("is nothing at level 0, and every pixel of a level is one colour with the alpha of how many stand there", () => {
    const frame = frameOf(plan.view, 800);
    expect(rasterOutside(crowd, 0, frame, ink).rgba.every((b) => b === 0)).toBe(true);
    const { rgba, stats } = rasterOutside(crowd, 100, frame, ink);
    expect(stats.people).toBe(73371);
    let drawn = 0;
    for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 3] > 0) {
      drawn += 1;
      expect([rgba[i], rgba[i + 1], rgba[i + 2]]).toEqual(ink);
    }
    expect(drawn).toBeGreaterThan(5000);
    expect(drawn).toBeLessThanOrEqual(stats.stamps);
  });

  it("draws a person as one pixel of density where a person is narrower than a pixel and a fifth, and as a disc where wider", () => {
    const far = frameOf(plan.view, 600);
    const near = frameOf(plan.view, 3000);
    expect(PERSON_METRES * far.scale * FEET).toBeLessThan(DOTS_FROM);
    expect(rasterOutside(crowd, 100, far, ink).stats.mode).toBe("density");
    expect(rasterOutside(crowd, 100, far, ink).stats.stamps).toBeLessThanOrEqual(crowd.count);
    expect(rasterOutside(crowd, 100, near, ink).stats.mode).toBe("dots");
  });

  it("is the same bytes every time", () => {
    const frame = frameOf(plan.view, 1000);
    expect(sum(rasterOutside(crowd, 75, frame, ink).rgba)).toBe(sum(rasterOutside(crowd, 75, frame, ink).rgba));
    expect(sum(rasterOutside(crowd, 75, frame, ink).rgba)).not.toBe(sum(rasterOutside(crowd, 50, frame, ink).rgba));
  });

  it("stays in budget at 100 percent for both venues: no more than 13 stamps a person at any size the views use, and each size painted in well under a quarter of a second", () => {
    for (const width of [800, 1960, 3072]) {
      const frame = frameOf(plan.view, width);
      let best = Infinity;
      let stats = rasterOutside(crowd, 100, frame, ink).stats;
      for (let i = 0; i < 3; i += 1) {
        const started = performance.now();
        stats = rasterOutside(crowd, 100, frame, ink).stats;
        best = Math.min(best, performance.now() - started);
      }
      expect(stats.stamps, `${width} px`).toBeLessThanOrEqual(crowd.count * 13);
      expect(best, `${width} px`).toBeLessThan(250);
    }
  });

  it("is worked out once: the crowd of a plan is the same object the second time, and its first work stays under two seconds", () => {
    expect(outsideCrowd(plan)).toBe(crowd);
    vi.resetModules();
    return Promise.all([import("./outside.ts"), import("./district.ts"), import("./full.ts")]).then(([fresh, district]) => {
      const started = performance.now();
      fresh.outsideCrowd(district.planDistrict(PAIR));
      expect(performance.now() - started).toBeLessThan(2000);
    });
  });
});
