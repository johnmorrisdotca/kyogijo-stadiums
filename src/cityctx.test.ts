import { describe, expect, it } from "vitest";
import { CITYCTX_AREAS, SEATTLE_CENTER, SEATTLE_CITY, SEATTLE_SODO, VANCOUVER_NATURE } from "./cityctx.data.ts";
import { CITYCTX_VENUES, contextFor } from "./cityctx.ts";
import { CONTEXT_BLOCKS, contextFloor, contextUprights, decodeBuilding, placeContext, type ContextArea } from "./context.ts";
import { describeDistrict, drawDistrict, planDistrict, type DistrictOptions } from "./district.ts";
import { buildDistrictTurn } from "./district.turn.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { VANCOUVER_CENTRE } from "./osm.context.data.ts";

const AREAS = [VANCOUVER_NATURE, SEATTLE_SODO, SEATTLE_CENTER, SEATTLE_CITY];
const withContext = (venues: string[], mode: "neighbours" | "city" = "neighbours"): DistrictOptions => ({ venues, mode, context: contextFor(venues) });
const VANCOUVER = withContext(["bc-place:cfl", "rogers-arena"]);
const SODO = withContext(["t-mobile-park:mlb", "lumen-field:nfl"]);
const CENTER = withContext(["climate-pledge-arena"]);
const CITY = withContext(["t-mobile-park:mlb", "lumen-field:nfl", "climate-pledge-arena"], "city");
const bytesOf = (area: ContextArea): number => JSON.stringify(area).length;

describe("the areas round the venues of Vancouver and Seattle", () => {
  it("are four frames, each with its origin, radius and grid, and every area by its key", () => {
    expect(Object.keys(CITYCTX_AREAS)).toEqual(["vancouver-nature", "seattle-sodo", "seattle-center", "seattle-city"]);
    for (const area of AREAS) expect(CITYCTX_AREAS[area.key]).toBe(area);
    // Vancouver's has the middle of downtown Vancouver's own area, which has its buildings and streets.
    expect(VANCOUVER_NATURE).toMatchObject({ origin: VANCOUVER_CENTRE.origin, radius: 450, grid: 0.5 });
    expect(SEATTLE_SODO).toMatchObject({ radius: 650, grid: 0.5 });
    expect(SEATTLE_CENTER).toMatchObject({ radius: 550, grid: 0.5 });
    expect(SEATTLE_CITY).toMatchObject({ radius: 3000, grid: 2 });
  });

  it("have the layers of the format: Vancouver's land cover and trees beside its buildings and streets, Seattle's all four round the venues and no trees in the city's", () => {
    expect(Object.keys(VANCOUVER_NATURE.layers)).toEqual(["landCover", "trees"]);
    expect(VANCOUVER_NATURE.layers.landCover!.rows.length).toBeGreaterThan(10);
    for (const area of [SEATTLE_SODO, SEATTLE_CENTER, SEATTLE_CITY]) {
      expect(area.layers.buildings!.rows.length).toBeGreaterThan(200);
      expect(area.layers.streets!.rows.length).toBeGreaterThan(400);
    }
    for (const area of [VANCOUVER_NATURE, SEATTLE_SODO, SEATTLE_CENTER]) expect(area.layers.trees!.rows[0].length).toBeGreaterThan(3 * 500);
    expect(SEATTLE_CITY.layers.trees).toBeUndefined();
    expect(SEATTLE_CITY.layers.landCover!.rows.length).toBeGreaterThan(20);
    expect(Object.keys(SEATTLE_CENTER.layers)).toEqual(["buildings", "streets", "landCover", "trees"]);
  });

  it("say where each layer came from and under what terms, and credit it in English and in Japanese", () => {
    for (const area of AREAS) {
      for (const layer of Object.values(area.layers)) {
        expect(layer.source.length).toBeGreaterThan(10);
        expect(layer.read).toBe("2026-10-22");
        expect(layer.licence).toMatch(/ODbL 1\.0/);
        expect(layer.attribution.en).not.toBeUndefined();
        expect(layer.attribution.ja).not.toBeUndefined();
      }
    }
    expect(VANCOUVER_NATURE.layers.trees!.attribution.en).toContain("City of Vancouver open data, Public trees");
    expect(VANCOUVER_NATURE.layers.trees!.attribution.en).toContain("Open Government Licence - Vancouver");
    expect(VANCOUVER_NATURE.layers.trees!.attribution.ja).toContain("バンクーバー市");
    expect(VANCOUVER_NATURE.layers.landCover!.attribution.en).toContain("VoxCity (MIT)");
    for (const area of [SEATTLE_SODO, SEATTLE_CENTER, SEATTLE_CITY]) {
      const b = area.layers.buildings!;
      expect(b.attribution.en).toContain("(c) OpenStreetMap contributors, ODbL 1.0");
      expect(b.attribution.en).toContain("simplified and edited by Kyogijo Stadiums");
      expect(b.attribution.en).toMatch(/City of Seattle.*no warranty.*USGS/);
      expect(b.attribution.ja).toContain("© OpenStreetMap contributors（ODbL 1.0）");
      expect(b.attribution.ja).toContain("加工して作成");
      expect(b.licence).toContain("Open Data Policy");
      // The streets' credit is the buildings': said once.
      expect(area.layers.streets!.attribution).toEqual({ en: "", ja: "" });
    }
    expect(SEATTLE_CENTER.layers.trees!.attribution.en).toContain("City of Seattle, Combined Tree Point");
  });

  it("hold rows in the shapes the format says: believable heights, outlines of three points or more, kinds and widths in range, one row of trees in whole steps", () => {
    for (const area of AREAS) {
      const reach = area.radius + 150;
      for (const row of area.layers.buildings?.rows ?? []) {
        const b = decodeBuilding(area, row);
        expect(b.height).toBeGreaterThanOrEqual(2);
        expect(b.height).toBeLessThan(400);
        expect(b.ring.length).toBeGreaterThanOrEqual(3);
        expect(Math.hypot(...b.ring[0])).toBeLessThan(reach);
        expect(row.every(Number.isInteger)).toBe(true);
      }
      for (const row of area.layers.streets?.rows ?? []) {
        expect([0, 1, 2, 3]).toContain(row[0]);
        expect(row[1]).toBeGreaterThanOrEqual(1);
        expect(row.length).toBeGreaterThanOrEqual(6);
        expect(row.length % 2).toBe(0);
      }
      for (const row of area.layers.landCover?.rows ?? []) {
        expect([0, 1, 2]).toContain(row[0]);
        expect(row.length).toBeGreaterThanOrEqual(7);
      }
      for (const row of area.layers.trees?.rows ?? []) {
        expect(row.length % 3).toBe(0);
        for (let i = 2; i < row.length; i += 3) expect(row[i]).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("stay small: tens of kilobytes an area, a hundred and some for the city", () => {
    // State bytes, the area as JSON (the file's text is a little more, and compresses to about a third).
    const [van, sodo, center, city] = AREAS.map(bytesOf);
    expect(van).toBeLessThan(20_000);
    expect(sodo).toBeLessThan(100_000);
    expect(center).toBeLessThan(115_000);
    expect(city).toBeLessThan(190_000);
  });
});

describe("contextFor", () => {
  it("gives Vancouver's buildings, streets and nature for BC Place and Rogers Arena, SoDo's for the two Seattle grounds, Seattle Center's for the arena, and the city's for a district that holds both", () => {
    expect(contextFor(["bc-place:cfl", "rogers-arena"])).toEqual([VANCOUVER_CENTRE, VANCOUVER_NATURE]);
    expect(contextFor(["rogers-arena"])).toEqual([VANCOUVER_CENTRE, VANCOUVER_NATURE]);
    expect(contextFor(["t-mobile-park:mlb", "lumen-field:nfl"])).toEqual([SEATTLE_SODO]);
    expect(contextFor(["lumen-field:soccer"])).toEqual([SEATTLE_SODO]);
    expect(contextFor(["climate-pledge-arena"])).toEqual([SEATTLE_CENTER]);
    expect(contextFor(["t-mobile-park:mlb", "lumen-field:nfl", "climate-pledge-arena"])).toEqual([SEATTLE_CITY]);
    expect(contextFor(["lumen-field:nfl", "climate-pledge-arena"])).toEqual([SEATTLE_CITY]);
    expect(contextFor(["tokyo-dome:mlb", "korakuen-hall:boxing"])).toEqual([]);
    expect(contextFor([])).toEqual([]);
    expect(Object.values(CITYCTX_VENUES).flat().sort()).toEqual(["bc-place", "climate-pledge-arena", "lumen-field", "rogers-arena", "t-mobile-park"]);
  });
});

describe("a district among its streets, buildings, water and trees", () => {
  it("lays every layer in the frame: streets, buildings and trees reach it, a venue's own building is left out, and nothing is far outside", () => {
    for (const options of [VANCOUVER, SODO, CENTER, CITY]) {
      const plan = planDistrict(options);
      const c = plan.context!;
      expect(c.blocks.length).toBeGreaterThan(14);
      expect(c.streets!.length).toBeGreaterThan(50);
      expect(c.owned).toBeGreaterThan(0);
      const { x, y, w, h } = plan.view;
      for (const t of c.trees!) {
        expect(t.at[0]).toBeGreaterThanOrEqual(x);
        expect(t.at[0]).toBeLessThanOrEqual(x + w);
        expect(t.at[1]).toBeGreaterThanOrEqual(y);
        expect(t.at[1]).toBeLessThanOrEqual(y + h);
        expect(t.r).toBeGreaterThan(0);
      }
      for (const s of c.streets!) for (const p of s.points) expect(Number.isFinite(p[0]) && Number.isFinite(p[1])).toBe(true);
    }
    expect(planDistrict(VANCOUVER).context!.trees!.length).toBeGreaterThan(100);
    expect(planDistrict(CITY).context!.trees!.length).toBe(0);
    expect(planDistrict(CITY).context!.land!.some((s) => s.cls === 0)).toBe(true);
    expect(planDistrict(VANCOUVER).context!.land!.length).toBeGreaterThan(0);
  });

  it("draws them flat on the floor, under the venues: water, green and wood, then the streets, the trees as dots, then the buildings in tones", () => {
    const plan = planDistrict(SODO);
    const svg = drawDistrict(SODO, plan);
    const floor = contextFloor(plan.context!);
    for (const cls of ["ky-dist-street-0", "ky-dist-tree", "ky-dist-b0"]) expect(floor).toContain(cls);
    // Each lies under the next, and all under the venues.
    const city = contextFloor(planDistrict(CITY).context!);
    expect(city.indexOf("ky-dist-water")).toBeLessThan(city.indexOf("ky-dist-street"));
    expect(floor.indexOf("ky-dist-street")).toBeLessThan(floor.indexOf("ky-dist-tree"));
    expect(floor.indexOf("ky-dist-tree")).toBeLessThan(floor.indexOf("ky-dist-b0"));
    expect(svg.indexOf("ky-dist-streets")).toBeLessThan(svg.indexOf("data-venue"));
    expect(city).toContain('fill-rule="evenodd"');
    // A tree is a dot (a round cap on a line of no length), not an element each.
    expect(floor).toMatch(/class="ky-dist-tree" stroke-width="\d+" d="M[\d. -]+h0M/);
    expect(floor.match(/<path/g)!.length).toBeLessThan(30);
    expect(contextFloor({ blocks: [], owned: 0, attribution: { en: [], ja: [] } })).toBe("");
  });

  it("is the same drawing every time, and a district that does not ask carries none of it", () => {
    expect(drawDistrict({ ...SODO, id: "v" })).toBe(drawDistrict({ ...SODO, id: "v" }));
    const bare = drawDistrict({ venues: SODO.venues, id: "v" });
    expect(bare).not.toContain('<path class="ky-dist-street');
    expect(bare).not.toContain('<path class="ky-dist-tree');
  });

  it("credits OpenStreetMap, the City and VoxCity once, in the description, in English and in Japanese", () => {
    const seattle = describeDistrict(CITY, planDistrict(CITY)).description;
    expect(seattle).toMatch(/City of Seattle, Building Outlines 2015.*USGS 3D Elevation Program/);
    expect(seattle).toContain("(c) OpenStreetMap contributors");
    const en = describeDistrict(CENTER, planDistrict(CENTER)).description;
    expect(en).toContain("Trees: City of Seattle, Combined Tree Point");
    expect(en).toContain("VoxCity (MIT)");
    const ja = describeDistrict({ ...VANCOUVER, language: "ja" }, planDistrict({ ...VANCOUVER, language: "ja" })).description;
    expect(ja).toContain("バンクーバー市オープンデータ");
    expect(ja).toContain("VoxCity");
    const van = describeDistrict(VANCOUVER, planDistrict(VANCOUVER)).description;
    expect(van).toContain("Buildings and streets: (c) OpenStreetMap contributors");
    expect(van).toContain("Trees: City of Vancouver open data, Public trees");
  });

  it("raises the biggest buildings in 3D and costs a bounded number of planes: no more than the PLATEAU district's blocks", () => {
    for (const options of [VANCOUVER, SODO, CENTER, CITY]) {
      const plan = planDistrict(options);
      const items = contextUprights(plan.context!);
      expect(items.length).toBeLessThanOrEqual(CONTEXT_BLOCKS);
      const planes = items.reduce((sum, item) => sum + item.planes.length, 0);
      expect(planes).toBeLessThan(1300);
      // The streets, trees and water are the floor's own: they add no plane.
      const model = buildDistrictTurn(options);
      const bare = buildDistrictTurn({ venues: options.venues, mode: options.mode });
      expect(model.planes.length - bare.planes.length).toBe(planes);
    }
  });

  it("keeps the floor to what a page can hold: about 250 KB of markup for the whole city, less for a venue", () => {
    expect(buildDistrictTurn(CITY).floor.length).toBeLessThan(260_000);
    for (const options of [VANCOUVER, SODO, CENTER]) expect(buildDistrictTurn(options).floor.length).toBeLessThan(160_000);
  });

  it("places an outline and a row of trees by the format: grid steps from the area's origin, turned and moved into the frame", () => {
    const area: ContextArea = {
      key: "t", name: { en: "T", ja: "T" }, origin: [0, 0], radius: 100, grid: 2,
      layers: {
        landCover: { source: "s", read: "r", licence: "l", attribution: { en: "w", ja: "w" }, rows: [[0, 0, 0, 10, 0, 0, 10, -10, 0]] },
        trees: { source: "s", read: "r", licence: "l", attribution: { en: "t", ja: "t" }, rows: [[1, 1, 2, 3, 0, 1]] },
        streets: { source: "s", read: "r", licence: "l", attribution: { en: "", ja: "" }, rows: [[0, 2, 0, 0, 5, 0, 5, 5]] },
      },
    };
    const plan = placeContext([area], [0, 0], 0, { x: -1000, y: -1000, w: 2000, h: 2000 }, []);
    const f = 2 * FEET_PER_METRE;
    expect(plan.land).toHaveLength(1);
    expect(plan.land![0].ring).toHaveLength(4);
    // East is to the right, north up the page (y down).
    expect(plan.land![0].ring.map((p) => [Math.round(p[0] / f) + 0, Math.round(-p[1] / f) + 0])).toEqual([[0, 0], [10, 0], [10, 10], [0, 10]]);
    expect(plan.trees!.map((t) => [Math.round(t.at[0] / f), Math.round(t.at[1] / f), Math.round(t.r / f)])).toEqual([[1, -1, 2], [4, -1, 1]]);
    // Empty credits are left out, the others said once.
    expect(plan.attribution.en).toEqual(["w", "t"]);
    // An outline wholly outside the frame is not kept.
    expect(placeContext([area], [0, 0], 0, { x: 500, y: 500, w: 10, h: 10 }, []).land).toHaveLength(0);
  });
});
