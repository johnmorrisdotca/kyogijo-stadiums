import { describe, expect, it } from "vitest";

import { CITYCTX_AREAS } from "./cityctx.data.ts";
import { thinTrees, type ContextTree } from "./context.ts";
import { buildDistrictTurn, districtTurnMarkup } from "./district.turn.ts";
import { areaKeysFor, loadAreasFor } from "./areas.ts";
import { layoutOf } from "./turn.markup.ts";
import { GOVERNOR_TUNING, QUALITIES, QUALITY_TIERS, TIER_PROFILES, createGovernor, handheld, higher, layerBudget, lower, qualityOf, rasterOf, rasterShares, tierOf, type Governor, type QualityTier } from "./quality.ts";

describe("the tiers", () => {
  it("are high, medium and low, and `auto` is the mode that chooses among them", () => {
    expect(QUALITY_TIERS).toEqual(["high", "medium", "low"]);
    expect(QUALITIES).toEqual(["auto", "high", "medium", "low"]);
    expect(qualityOf("medium")).toBe("medium");
    expect(qualityOf("ultra")).toBe("auto");
    expect(qualityOf(undefined, "high")).toBe("high");
    expect(tierOf("auto")).toBe("high");
    expect(tierOf(undefined)).toBe("high");
    expect(tierOf("low")).toBe("low");
    expect(lower("high")).toBe("medium");
    expect(lower("low")).toBe("low");
    expect(higher("low")).toBe("medium");
    expect(higher("high")).toBe("high");
  });

  it("draw less and less, and `high` leaves everything as it was", () => {
    const [high, medium, low] = QUALITY_TIERS.map((tier) => TIER_PROFILES[tier]);
    expect(high).toMatchObject({ blocks: 130, trees: 1, proxy: 0, simple: false, outside: { people: 1, width: 1 } });
    expect(high.ratio.handheld).toBe(Infinity);
    expect(high.ratio.other).toBe(Infinity);
    expect(medium.blocks).toBeLessThan(high.blocks);
    expect(low.blocks).toBe(0);
    expect(medium.trees).toBeLessThan(high.trees);
    expect(low.trees).toBeLessThan(medium.trees);
    expect(low.outside.people).toBe(0);
    expect(medium.outside.people).toBeGreaterThan(0);
    expect(medium.outside.people).toBeLessThan(1);
    expect(low.proxy).toBeGreaterThan(medium.proxy);
    expect(low.ratio.handheld).toBeLessThanOrEqual(medium.ratio.handheld);
  });
});

describe("a phone or a tablet", () => {
  const win = (coarse: boolean, screen: [number, number], inner = screen[0]) => ({ matchMedia: (q: string) => ({ matches: coarse && q.includes("coarse") }), screen: { width: screen[0], height: screen[1] }, innerWidth: inner });
  it("has a coarse pointer, or a small screen, whatever the browser calls itself", () => {
    expect(handheld(win(true, [390, 844]))).toBe(true);
    expect(handheld(win(true, [1366, 1024]))).toBe(true);
    expect(handheld(win(false, [390, 844]))).toBe(true);
    expect(handheld(win(false, [1920, 1080], 1280))).toBe(false);
    expect(handheld(win(false, [1920, 1080], 700))).toBe(true);
    expect(handheld(null)).toBe(false);
    expect(handheld({})).toBe(false);
  });
});

describe("the pixels of the layers", () => {
  it("are the device's own when `high` is asked for by name, and are never made more", () => {
    expect(rasterOf("high", "high", 3, true)).toBe(1);
    expect(rasterOf("high", "high", 3, false)).toBe(1);
    expect(rasterOf("auto", "high", 1, true)).toBe(1);
    expect(rasterOf("auto", "high", 2, true)).toBe(1);
  });

  it("are capped at a ratio of 2 for `auto` on a phone or a tablet, and not on a desk", () => {
    expect(rasterOf("auto", "high", 3, true)).toBeCloseTo(2 / 3, 3);
    expect(rasterOf("auto", "high", 3, false)).toBe(1);
  });

  it("are capped lower in the lower tiers, so that a layer holds the square of the share as many pixels", () => {
    expect(rasterOf("medium", "medium", 3, true)).toBe(0.5);
    expect(rasterOf("low", "low", 3, true)).toBeCloseTo(1 / 3, 3);
    expect(rasterOf("auto", "low", 3, false)).toBeCloseTo(1 / 3, 3);
    expect(rasterOf("medium", "medium", 2, false)).toBe(1);
    expect(rasterOf("low", "low", 1, false)).toBe(1);
    // A ratio of 3 at a share of a half holds a quarter of the pixels; of two thirds, 4/9 of them.
    expect(0.5 ** 2).toBe(0.25);
  });
});

describe("the biggest layers", () => {
  it("are held to a budget of device pixels in the lower tiers, and not at `high`", () => {
    expect(layerBudget("high", true)).toBe(Infinity);
    expect(layerBudget("medium", true)).toBeLessThan(layerBudget("medium", false));
    expect(layerBudget("low", true)).toBeLessThan(layerBudget("medium", true));
  });

  it("are made smaller than the share every layer is made at, never bigger, and never under a fifth", () => {
    // The Kodokan's plates: 1114 by 1186 pixels at a ratio of 3 are 11.9 megapixels.
    const sizes: [number, number][] = [[1114, 1186], [200, 100], [10, 10], [4000, 4000]];
    const shares = rasterShares(sizes, 0.5, 3, 1e6);
    expect(shares[0]).toBeCloseTo(Math.sqrt(1e6 / (1114 * 1186 * 9)), 2);
    expect(shares[1]).toBe(0.5);
    expect(shares[2]).toBe(0.5);
    expect(shares[3]).toBe(0.2);
    // A layer at that share holds about the budget.
    expect(1114 * 1186 * 9 * shares[0] ** 2).toBeLessThan(1.01e6);
    // With no budget, every layer is made at the share.
    expect(rasterShares(sizes, 0.5, 3, Infinity)).toEqual([0.5, 0.5, 0.5, 0.5]);
    expect(rasterShares(sizes, 1, 1, Infinity)).toEqual([1, 1, 1, 1]);
  });
});

/** A device in which each tier costs the given milliseconds a frame: feed its frames to a governor for `seconds` and say each step it takes (the time in seconds, the tier it goes to). */
function simulate(costs: Record<QualityTier, number>, seconds: number, start: QualityTier = "high", tuning = {}, noise = 0, display = 16.667): { steps: [number, QualityTier][]; governor: Governor } {
  const governor = createGovernor(start, tuning);
  governor.display(display);
  const steps: [number, QualityTier][] = [];
  let now = 1000;
  let seed = 7;
  const random = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
  while (now < 1000 + seconds * 1000) {
    // A display refreshes at 60 Hz (or at `display`): a frame takes the work it holds, rounded up to the next refresh.
    const work = costs[governor.tier] + noise * random();
    const interval = Math.max(1, Math.ceil(work / display)) * display;
    now += interval;
    const next = governor.frame(interval, now);
    if (next !== undefined) steps.push([Math.round((now - 1000) / 100) / 10, next]);
  }
  return { steps, governor };
}

describe("the governor", () => {
  it("leaves a device that holds 60 frames a second on `high`, for as long as it turns", () => {
    const { steps, governor } = simulate({ high: 12, medium: 8, low: 4 }, 300);
    expect(steps).toEqual([]);
    expect(governor.tier).toBe("high");
  });

  it("steps down when the frames run over budget for a while, and not on a slow frame or two", () => {
    const { steps } = simulate({ high: 60, medium: 30, low: 10 }, 20);
    expect(steps[0][1]).toBe("medium");
    expect(steps[0][0]).toBeGreaterThanOrEqual(0.7);
    expect(steps[0][0]).toBeLessThan(3);
    const governor = createGovernor("high");
    let now = 0;
    // A hitch in a steady run: one frame of 200 ms among 60 of 16.7.
    for (let i = 0; i < 120; i += 1) {
      const interval = i === 40 ? 200 : 16.667;
      now += interval;
      expect(governor.frame(interval, now), `frame ${i}`).toBeUndefined();
    }
  });

  it("goes on stepping down until the frames are within budget, and stops there", () => {
    const { steps, governor } = simulate({ high: 90, medium: 50, low: 16 }, 30);
    expect(steps.map((s) => s[1]).slice(0, 2)).toEqual(["medium", "low"]);
    expect(governor.tier).toBe("low");
  });

  it("settles on the highest tier that holds the budget, and is not drawn out of it by itself", () => {
    const { steps, governor } = simulate({ high: 90, medium: 14, low: 8 }, 30);
    expect(governor.tier).toBe("medium");
    expect(steps[0][1]).toBe("medium");
    // Medium is steady, so after the wait it tries high, finds it over budget and goes back: nothing else happens in that half minute but those tries.
    expect(steps.every(([, tier]) => tier === "medium" || tier === "high")).toBe(true);
  });

  it("steps back up when the frames have been steady for the wait, and keeps the tier above if it holds", () => {
    // The device was slow for a while (so the governor went down) and is now fast at every tier.
    const governor = createGovernor("high", { upAfterMs: 4000 });
    let now = 0;
    const run = (cost: number, ms: number): QualityTier[] => {
      const out: QualityTier[] = [];
      const end = now + ms;
      while (now < end) {
        const interval = Math.max(1, Math.ceil(cost / 16.667)) * 16.667;
        now += interval;
        const next = governor.frame(interval, now);
        if (next !== undefined) out.push(next);
      }
      return out;
    };
    expect(run(70, 9000)).toEqual(["medium", "low"]);
    // Released: every frame is 16.7 ms. After the wait it tries medium, then high, and holds them.
    expect(run(10, 20000)).toEqual(["medium", "high"]);
    expect(governor.tier).toBe("high");
    expect(run(10, 20000)).toEqual([]);
  });

  it("never flickers: a device on the edge between two tiers settles on the lower one, the tries come further and further apart, and they stop", () => {
    // High costs 30 ms (over budget), medium 12: a try of high always fails.
    const { steps } = simulate({ high: 30, medium: 12, low: 8 }, 600);
    expect(steps[0][1]).toBe("medium");
    const ups = steps.filter(([, tier]) => tier === "high").map(([t]) => t);
    const downs = steps.filter(([, tier], i) => i > 0 && tier === "medium").map(([t]) => t);
    // The tries upward are spaced further apart each time...
    const gaps = ups.slice(1).map((t, i) => t - ups[i]);
    // (until the wait reaches its ceiling, five minutes, which a try then takes as its own gap)
    gaps.slice(1).forEach((gap, i) => expect(gap, `gap ${i}`).toBeGreaterThanOrEqual(Math.min(gaps[i] * 1.5, 250)));
    // ...so in ten minutes there are few of them, and the view spends nearly all of the time on one tier.
    expect(ups.length).toBeLessThanOrEqual(7);
    expect(ups.length).toBeGreaterThanOrEqual(4);
    expect(ups.length).toBe(downs.length);
    // And each try upward lasts about a second (the time to judge it), never longer.
    ups.forEach((up, i) => expect(downs[i] - up).toBeLessThan(3));
  });

  it("is not fooled by noise in the frames that does not change their mean", () => {
    const { steps } = simulate({ high: 14, medium: 8, low: 4 }, 120, "high", {}, 1.5);
    expect(steps).toEqual([]);
  });

  it("takes a display that refreshes at 30 Hz, once the page has measured it, for what it is, and does not run down to `low` on it", () => {
    const { steps, governor } = simulate({ high: 20, medium: 12, low: 8 }, 120, "high", {}, 0, 33.333);
    expect(steps).toEqual([]);
    expect(governor.tier).toBe("high");
    // The same frames from a display that is not known to be slow are over budget.
    const unknown = createGovernor("high");
    let now = 0;
    const out: QualityTier[] = [];
    for (let i = 0; i < 200; i += 1) {
      now += 33.333;
      const next = unknown.frame(33.333, now);
      if (next !== undefined) out.push(next);
    }
    expect(out[0]).toBe("medium");
  });

  it("learns a faster display too: at 120 Hz a view that holds 60 frames a second is not over budget", () => {
    const { steps } = simulate({ high: 12, medium: 8, low: 4 }, 60, "high", {}, 0, 8.333);
    expect(steps).toEqual([]);
  });

  it("forgets the frames before a pause, which is a stopped turn or a hidden page and not a slow frame", () => {
    const governor = createGovernor("high");
    let now = 0;
    for (let i = 0; i < 20; i += 1) {
      now += 60;
      expect(governor.frame(60, now)).toBeUndefined();
    }
    governor.pause();
    now += 5000;
    // The first frame back is the gap itself, which is ignored, and the window starts afresh.
    expect(governor.frame(5000, now)).toBeUndefined();
    for (let i = 0; i < 10; i += 1) {
      now += 60;
      expect(governor.frame(60, now)).toBeUndefined();
    }
  });

  it("is put on a tier by a page, and holds still for a moment after any step while the view is drawn again", () => {
    const governor = createGovernor("high");
    governor.set("low", 0);
    expect(governor.tier).toBe("low");
    let now = 0;
    for (let i = 0; i < 20; i += 1) {
      now += 80;
      expect(governor.frame(80, now)).toBeUndefined();
    }
    expect(GOVERNOR_TUNING.quietMs).toBeGreaterThan(0);
  });
});

describe("trees thinned", () => {
  const trees: ContextTree[] = Array.from({ length: 100 }, (_, i) => ({ at: [i, 0], r: 2 }));
  it("keep every tree at 1, none at 0, and spread the rest evenly, the same trees every time", () => {
    expect(thinTrees(trees, 1)).toHaveLength(100);
    expect(thinTrees(trees, 0)).toHaveLength(0);
    expect(thinTrees(trees, 0.5)).toHaveLength(50);
    expect(thinTrees(trees, 0.25)).toHaveLength(25);
    expect(thinTrees(trees, 0.5).map((t) => t.at[0])).toEqual(thinTrees(trees, 0.5).map((t) => t.at[0]));
    // Every other one, so no part of the lot is bare.
    expect(thinTrees(trees, 0.5).map((t) => t.at[0]).slice(0, 4)).toEqual([1, 3, 5, 7]);
  });
});

const ASKS: Record<string, { venues: string[]; mode?: "city" }> = {
  alone: { venues: ["rogers-arena"] },
  pair: { venues: ["bc-place:cfl", "rogers-arena"] },
  seattlecenter: { venues: ["climate-pledge-arena"] },
  sodo: { venues: ["t-mobile-park:mlb", "lumen-field:nfl"] },
  seattle: { venues: ["t-mobile-park:mlb", "lumen-field:nfl", "climate-pledge-arena"], mode: "city" },
  tokyo: { venues: ["tokyo-dome:mlb", "korakuen-hall:boxing"] },
  tokyokodokan: { venues: ["tokyo-dome:mlb", "korakuen-hall:boxing", "kodokan"] },
};

describe("a district at each tier", () => {
  it("is the same as it always was at `high`, and at a quality left out", async () => {
    for (const [name, ask] of Object.entries(ASKS)) {
      const context = await loadAreasFor(ask.venues);
      const options = { ...ask, context };
      const before = buildDistrictTurn(options);
      const high = buildDistrictTurn(options, { quality: "high" });
      const auto = buildDistrictTurn(options, { quality: "auto" });
      expect(high.planes.map((p) => `${p.id}|${p.svg.length}`), name).toEqual(before.planes.map((p) => `${p.id}|${p.svg.length}`));
      expect(auto.floor, name).toBe(before.floor);
      expect(high.floor, name).toBe(before.floor);
      expect(districtTurnMarkup(options, { quality: "high" }), name).toBe(districtTurnMarkup(options));
    }
  });

  it("has fewer planes at each lower tier, and every tier draws every preset", async () => {
    for (const [name, ask] of Object.entries(ASKS)) {
      const context = await loadAreasFor(ask.venues);
      const counts = QUALITY_TIERS.map((tier) => buildDistrictTurn({ ...ask, context }, { quality: tier }).planes.length);
      expect(counts[1], `${name} medium ${counts}`).toBeLessThanOrEqual(counts[0]);
      expect(counts[2], `${name} low ${counts}`).toBeLessThan(counts[1] + 1);
      expect(counts[2], `${name} low ${counts}`).toBeLessThan(counts[0] * 0.6);
      for (const tier of QUALITY_TIERS) expect(districtTurnMarkup({ ...ask, context }, { quality: tier }).length, `${name} ${tier}`).toBeGreaterThan(1000);
    }
  });

  it("stands up the biggest of the buildings round it at `medium`, and none at `low`, whose footprints stay on the floor", async () => {
    const ask = ASKS.seattle;
    const context = await loadAreasFor(ask.venues);
    const raised = (tier: QualityTier): number => new Set(buildDistrictTurn({ ...ask, context }, { quality: tier }).planes.map((p) => /^c-(.+)-w?\d+/.exec(p.id)?.[0]?.replace(/-(w\d+|top|r\d+)$/, "")).filter((id) => id !== undefined)).size;
    expect(raised("high")).toBe(130);
    expect(raised("medium")).toBe(24);
    expect(raised("low")).toBe(0);
    // The footprints are on the floor at every tier.
    for (const tier of QUALITY_TIERS) expect(buildDistrictTurn({ ...ask, context }, { quality: tier }).floor).toContain("ky-dist-block");
  });

  it("draws a small venue as a block and a bigger one as a ring of walls at `low`, in the venue's own group, never as a blob with nothing round it", async () => {
    const context = await loadAreasFor(ASKS.pair.venues);
    const low = buildDistrictTurn({ ...ASKS.pair, context }, { quality: "low" });
    const proxy = low.planes.filter((p) => p.id.includes("proxy-"));
    // The two venues are rings (open at the top, so that the field shows): walls only, each seen from both sides.
    expect(proxy.length).toBeGreaterThan(20);
    expect(proxy.every((p) => p.id.includes("-w") && p.cull === undefined && p.group !== undefined)).toBe(true);
    expect(new Set(proxy.map((p) => p.group)).size).toBe(2);
    expect(proxy.every((p) => /u-proxy/.test(p.svg))).toBe(true);
    // At `medium` a venue of this size keeps its stands.
    const medium = buildDistrictTurn({ ...ASKS.pair, context }, { quality: "medium" });
    expect(medium.planes.some((p) => p.id.includes("proxy-"))).toBe(false);
    const city = buildDistrictTurn({ ...ASKS.seattle, context: await loadAreasFor(ASKS.seattle.venues) }, { quality: "medium" });
    // In a city a venue is small on the plan: a closed block, walls and a roof.
    expect(city.planes.filter((p) => p.id.includes("proxy-")).some((p) => p.id.endsWith("top") || /-r\d+$/.test(p.id))).toBe(true);
  });

  it("thins the trees on the floor at each lower tier, and leaves the flat drawing alone", async () => {
    const context = await loadAreasFor(ASKS.pair.venues);
    const dots = (floor: string): number => (floor.match(/h0/g) ?? []).length;
    const [high, medium, low] = QUALITY_TIERS.map((tier) => buildDistrictTurn({ ...ASKS.pair, context }, { quality: tier }));
    expect(dots(high.floor)).toBeGreaterThan(100);
    expect(dots(medium.floor)).toBeLessThan(dots(high.floor) * 0.6);
    expect(dots(low.floor)).toBeLessThan(dots(medium.floor));
    expect(low.flat).toBe(high.flat);
  });

  it("leaves out the small parts of a venue (benches, glass, goals, posts) and draws its crowd plain, when it is drawn in full at `medium`", async () => {
    const [high, medium] = (["high", "medium"] as const).map((tier) => buildDistrictTurn({ venues: ["rogers-arena"] }, { quality: tier }));
    const kinds = (m: typeof high): Set<string> => new Set(m.planes.map((p) => p.kind));
    expect(kinds(high).has("bench")).toBe(true);
    expect(kinds(medium).has("bench")).toBe(false);
    expect(kinds(medium).has("glass")).toBe(false);
    expect(kinds(medium).has("seats")).toBe(true);
    expect(kinds(medium).has("roof")).toBe(true);
    expect(medium.planes.map((p) => p.svg.length).reduce((a, b) => a + b, 0)).toBeLessThan(high.planes.map((p) => p.svg.length).reduce((a, b) => a + b, 0));
  });

  it("keeps the context of the areas it was given, and the areas are the ones the venues name", async () => {
    expect(areaKeysFor(ASKS.seattle.venues).length).toBeGreaterThan(0);
    expect(Object.keys(CITYCTX_AREAS).length).toBeGreaterThan(0);
  });
});

describe("a layer at a share of its size", () => {
  it("is the same picture: its matrix widens it back, and its box is the share of the size", async () => {
    const context = await loadAreasFor(ASKS.pair.venues);
    const model = buildDistrictTurn({ ...ASKS.pair, context });
    const view = { yaw: 30, pitch: 58, zoom: 1 };
    const whole = layoutOf(model, view, 960, 600);
    const half = layoutOf(model, view, 960, 600, undefined, false, 0.5);
    expect(half.transforms).toHaveLength(whole.transforms.length);
    const numbers = (t: string): number[] => /matrix3d\((.*)\)/.exec(t)![1].split(",").map(Number);
    for (const i of [0, 1, 50, 400]) {
      const [a, b] = [numbers(whole.transforms[i]), numbers(half.transforms[i])];
      // The columns that carry the plane's own x and y are doubled; the rest (its depth, its place) are the same.
      for (let k = 0; k < 8; k += 1) expect(b[k], `${i}:${k}`).toBeCloseTo(a[k] * 2, 3);
      for (let k = 8; k < 16; k += 1) expect(b[k], `${i}:${k}`).toBeCloseTo(a[k], 3);
    }
    expect(half.stack).toEqual(whole.stack);
  });
});
