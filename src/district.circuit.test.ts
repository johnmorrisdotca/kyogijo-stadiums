// A circuit on a district's ground (`circuit`), and the landmarks of an area of context: the Las Vegas Strip Circuit beside T-Mobile Arena among the Strip's hotels, with the Sphere, the High Roller and the Fountains of Bellagio.
// The circuit lies where OpenStreetMap maps it, turned as it lies; the landmarks stand by their own shapes at published sizes; and the whole stays inside the district's budgets of planes and bytes.
import { describe, expect, it } from "vitest";
import { areaKeysFor, loadAreasFor } from "./areas.ts";
import { circuitById, circuitPlan } from "./circuits.ts";
import { contextFor } from "./cityctx.ts";
import { LAS_VEGAS } from "./cityctx.las-vegas.data.ts";
import { contextUprights } from "./context.ts";
import { buildDistrictTurn, circuitPointIn, describeDistrict, districtTurnMarkup, drawDistrict, planDistrict, type DistrictOptions } from "./district-entry.ts";
import { DOME_CUT, FOUNTAIN_JETS, WHEEL_CUT, domePlanes, landmarkUprights, wheelPlanes } from "./landmarks.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";
import { inside, metresFrom } from "./venues.geo.ts";
import type { Pt } from "./crowd.ts";

const LV = (more: Partial<DistrictOptions> = {}): DistrictOptions => ({ venues: ["t-mobile-arena"], circuit: "las-vegas", context: contextFor(["t-mobile-arena"], "las-vegas"), labels: true, ...more });

describe("a circuit on a district's ground", () => {
  const plan = planDistrict({ venues: ["t-mobile-arena"], circuit: "las-vegas" });
  const own = circuitPlan(circuitById("las-vegas")!);

  it("lies where OpenStreetMap maps it: every point of the lap at its own longitude and latitude, turned as the map is", () => {
    // The circuit's start, put through the district's placing, is where its node is on the district's ground (east, down the page), within a metre.
    const [east, north] = metresFrom(plan.origin as [number, number], [circuitById("las-vegas")!.osm.start.at])[0];
    const start = circuitPointIn(plan.circuit!, own.start.at);
    expect(Math.hypot(start[0] - east * FT, start[1] + north * FT) / FT).toBeLessThan(1);
    // Turned, the same: north up the page stays north.
    const turned = planDistrict({ venues: ["t-mobile-arena"], circuit: "las-vegas", turn: 90 });
    const s2 = circuitPointIn(turned.circuit!, own.start.at);
    // (Turned a quarter clockwise, east is down the page and north to the right.)
    expect(Math.hypot(s2[0] - north * FT, s2[1] - east * FT) / FT).toBeLessThan(1);
  });

  it("stands T-Mobile Arena about 790 metres south-west of the nearest point of the lap, as the circuits page says", () => {
    const arena = plan.members[0].at;
    const lap = own.lap.map((p) => circuitPointIn(plan.circuit!, p));
    const nearest = Math.min(...lap.map((p) => Math.hypot(p[0] - arena[0], p[1] - arena[1]))) / FT;
    expect(nearest).toBeGreaterThan(700);
    expect(nearest).toBeLessThan(900);
    // South-west: to the left of the lap and below it on a plan with north up.
    expect(arena[0]).toBeLessThan(Math.min(...lap.map((p) => p[0])));
    expect(arena[1]).toBeGreaterThan(Math.max(...lap.map((p) => p[1])));
  });

  it("frames the lap and the venue together, and draws the circuit without its own frame, under the venue", () => {
    const svg = drawDistrict({ venues: ["t-mobile-arena"], circuit: "las-vegas" });
    expect(svg).toContain('data-circuit="las-vegas"');
    expect(svg.indexOf('data-circuit="las-vegas"')).toBeLessThan(svg.indexOf('data-venue="t-mobile-arena"'));
    expect(svg).toContain('data-part="lap"');
    // The circuit's own ground, north arrow, scale and credit are the district's to draw once.
    expect(svg).not.toContain("ky-ci-compass");
    expect(svg).not.toContain("ky-ci-scalebar");
    expect(svg).not.toContain('class="ky-ci-ground"');
    for (const p of plan.circuit!.footprint) {
      expect(p[0]).toBeGreaterThanOrEqual(plan.view.x);
      expect(p[0]).toBeLessThanOrEqual(plan.view.x + plan.view.w);
      expect(p[1]).toBeGreaterThanOrEqual(plan.view.y);
      expect(p[1]).toBeLessThanOrEqual(plan.view.y + plan.view.h);
    }
  });

  it("says what it is, in English and Japanese, with the circuit's sentence and the credit", () => {
    const en = describeDistrict({ venues: ["t-mobile-arena"], circuit: "las-vegas" });
    expect(en.title).toBe("Las Vegas Strip Circuit and T-Mobile Arena: where they stand");
    expect(en.description).toContain("Las Vegas Strip Circuit, a lap of 6.201 km, lies on the same ground");
    expect(en.description).toContain("OpenStreetMap contributors");
    const ja = describeDistrict({ venues: ["t-mobile-arena"], circuit: "las-vegas", language: "ja" });
    expect(ja.title).toContain("ラスベガス・ストリップ・サーキット");
    expect(ja.description).toContain("1周6.201 km");
  });

  it("can be a circuit alone, and refuses one it does not know, naming the circuits", () => {
    const alone = planDistrict({ venues: [], circuit: "las-vegas" });
    expect(alone.members).toEqual([]);
    expect(describeDistrict({ venues: [], circuit: "las-vegas" }).title).toBe("Las Vegas Strip Circuit and its surroundings");
    expect(() => planDistrict({ venues: [], circuit: "nowhere" })).toThrow(/the circuits are las-vegas/);
    expect(() => planDistrict({ venues: [] })).toThrow(/a venue or a circuit/);
  });

  it("stands the pit building and the turns' numbers up in 3D, where the district puts the circuit", () => {
    const model = buildDistrictTurn({ venues: ["t-mobile-arena"], circuit: "las-vegas" });
    const turns = model.planes.filter((p) => /^ci-turn-\d+$/.test(p.id));
    expect(turns).toHaveLength(17);
    const pit = model.planes.filter((p) => p.id.startsWith("ci-pit-"));
    expect(Math.max(...pit.map((p) => p.o[2]))).toBeCloseTo(19.5 * FT, 3);
    // The floor has the lap and no numbers on it (they stand up).
    expect(model.floor).toContain('data-part="lap"');
    expect(model.floor).not.toContain("data-turn=");
  });
});

describe("the surroundings of Las Vegas", () => {
  it("are one area of OpenStreetMap's, read only for the circuit or the arena beside it", async () => {
    expect(areaKeysFor(["t-mobile-arena"])).toEqual(["las-vegas"]);
    expect(areaKeysFor([], "las-vegas")).toEqual(["las-vegas"]);
    expect(areaKeysFor(["rogers-arena"], undefined)).not.toContain("las-vegas");
    expect((await loadAreasFor([], "las-vegas"))[0]).toBe(LAS_VEGAS);
    expect(LAS_VEGAS.layers.buildings!.attribution.en).toContain("OpenStreetMap");
    // The budget of bytes: the area's data as JSON, before gzip.
    expect(JSON.stringify(LAS_VEGAS).length).toBeLessThan(90_000);
  });

  it("have four landmarks with their names and published figures, and say where each was read", () => {
    const by = Object.fromEntries((LAS_VEGAS.landmarks ?? []).map((l) => [l.key, l]));
    expect(Object.keys(by)).toEqual(["sphere", "high-roller", "fountains-of-bellagio", "caesars-palace"]);
    expect([by.sphere.shape, by.sphere.height, by.sphere.width, by.sphere.name.en, by.sphere.name.ja]).toEqual(["dome", 111.6, 157.3, "Sphere", "スフィア"]);
    expect([by["high-roller"].shape, by["high-roller"].height, by["high-roller"].width]).toEqual(["wheel", 167.6, 158.5]);
    expect([by["fountains-of-bellagio"].shape, by["fountains-of-bellagio"].height]).toEqual(["fountains", 140.2]);
    expect(by["caesars-palace"].shape).toBe("named");
    for (const l of LAS_VEGAS.landmarks ?? []) expect(l.read.length, l.key).toBeGreaterThan(20);
  });

  it("leave the Sphere's own building out of the blocks (the dome draws it), and raise the named landmarks' buildings", () => {
    const plan = planDistrict(LV());
    const sphere = plan.context!.landmarks!.find((l) => l.key === "sphere")!;
    const centre = (ring: readonly Pt[]): Pt => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
    expect(plan.context!.blocks.filter((b) => inside(sphere.ring, centre(b.ring)))).toEqual([]);
    const named = plan.context!.landmarks!.filter((l) => l.shape === "named");
    const raised = contextUprights(plan.context!, 100);
    for (const l of named) expect(raised.some((item) => inside(l.ring, [item.at[0], item.at[1]])), l.key).toBe(true);
    // A tier that raises none raises none.
    expect(contextUprights(plan.context!, 0)).toEqual([]);
  });
});

describe("the landmarks' shapes", () => {
  it("make a dome of facets that face out, with its top at the height and its widest at the width", () => {
    const planes = domePlanes("t-", [0, 0], 111.6 * FT, 157.3 * FT, DOME_CUT.high);
    expect(planes).toHaveLength(DOME_CUT.high.sides * DOME_CUT.high.bands);
    const zs = planes.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]]);
    expect(Math.max(...zs)).toBeLessThanOrEqual(111.6 * FT + 1e-6);
    expect(Math.min(...zs)).toBeGreaterThan(-1);
    expect(planes.every((p) => p.cull === 1 || p.cull === -1)).toBe(true);
    expect(domePlanes("t-", [0, 0], 111.6 * FT, 157.3 * FT, DOME_CUT.simple).length).toBeLessThan(planes.length);
  });

  it("stand a wheel upright along its long way, its top at the height", () => {
    const planes = wheelPlanes("w-", [0, 0], [0, 1], 167.6 * FT, 158.5 * FT, WHEEL_CUT.high);
    const zs = planes.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]]);
    // (The top of the rim at the height, and its bars' own half thickness over it.)
    expect(Math.max(...zs)).toBeGreaterThan(167.6 * FT - 1);
    expect(Math.max(...zs)).toBeLessThan(167.6 * FT + 158.5 * FT * 0.025);
    // Upright along y: the rim stays on the line x = 0, within its own thickness.
    const rim = planes.filter((p) => p.id.includes("rim"));
    expect(Math.max(...rim.map((p) => Math.abs(p.o[0])))).toBeLessThan(158.5 * FT * 0.03);
  });

  it("are cut more coarsely in a simple tier, and the fountains' jets are left out of it", () => {
    const plan = planDistrict(LV());
    const high = landmarkUprights(plan.context!.landmarks!, false);
    const simple = landmarkUprights(plan.context!.landmarks!, true);
    const count = (items: typeof high): number => items.reduce((s, i) => s + i.planes.length, 0);
    expect(count(simple)).toBeLessThan(count(high));
    expect(high.find((i) => i.id === "lm-fountains-of-bellagio")!.planes).toHaveLength(FOUNTAIN_JETS.length * 2);
    expect(simple.find((i) => i.id === "lm-fountains-of-bellagio")).toBeUndefined();
  });
});

describe("the district of Las Vegas in 3D", () => {
  it("stays inside the district's budget of planes, a little under Seattle's three venues, and names each landmark", () => {
    const model = buildDistrictTurn(LV());
    // Seattle's three venues are held to 2,300 planes (e2e/perf.demo.mjs); this district is held to 2,100.
    expect(model.planes.length).toBeLessThanOrEqual(2100);
    for (const key of ["sphere", "high-roller", "fountains-of-bellagio", "caesars-palace"]) expect(model.planes.some((p) => p.id === `lm-${key}-name`), key).toBe(true);
    expect(model.planes.some((p) => p.id === "ci-name")).toBe(true);
    expect(model.planes.filter((p) => p.id.startsWith("lm-sphere-d"))).toHaveLength(DOME_CUT.high.sides * DOME_CUT.high.bands);
    const low = buildDistrictTurn(LV(), { quality: "low" });
    expect(low.planes.length).toBeLessThan(model.planes.length / 2);
  });

  it("is markup a server can make, the same every time", () => {
    const a = districtTurnMarkup(LV(), { preset: "corner" });
    expect(districtTurnMarkup(LV(), { preset: "corner" })).toBe(a);
    expect(a).toContain('data-part="lm-sphere-d0-0"');
  });

  it("keeps the 2D plan light enough: under 160 kilobytes of markup", () => {
    expect(drawDistrict(LV()).length).toBeLessThan(160_000);
  });
});
