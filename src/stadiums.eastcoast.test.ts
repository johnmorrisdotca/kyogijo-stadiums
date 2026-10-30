// The venues of the east coast: New York's and New Jersey's (Yankee Stadium, Citi Field, MetLife Stadium, Barclays Center, with Madison Square Garden and UBS Arena of the NHL's venues) and Montreal's (the Olympic Stadium with
// its tower, the Bell Centre), each drawn in its own building from OpenStreetMap, placed in a district, with their surroundings read only when shown.
import { describe, expect, it } from "vitest";
import { areaKeysFor, loadArea, loadAreasFor } from "./areas.ts";
import { CITYCTX_AREAS } from "./cityctx.data.ts";
import { describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { drawDistrict, planDistrict } from "./district.ts";
import { STADIUMS, stadiumBowlInside, stadiumConfigs, stadiumKind, stadiumNames, stadiumOrientation, stadiumSeats } from "./stadiums.ts";
import { buildTurn } from "./turn-entry.ts";
import { buildDistrictTurn } from "./district.turn.ts";
import { metresFrom } from "./venues.geo.ts";

const FEET = 3.28084;
const NEW_YORK = ["madison-square-garden", "barclays-center:nba", "yankee-stadium:mlb", "citi-field:mlb", "metlife-stadium:nfl", "ubs-arena"];

describe("the facts of the five new stadiums", () => {
  it("are a ballpark each for Yankee Stadium, Citi Field and the Olympic Stadium, a football stadium and a hall of basketball, with the seats their articles give", () => {
    expect(stadiumKind(STADIUMS["yankee-stadium"])).toBe("park");
    expect(stadiumKind(STADIUMS["citi-field"])).toBe("park");
    expect(stadiumKind(STADIUMS["olympic-stadium-montreal"])).toBe("park");
    expect(stadiumKind(STADIUMS["metlife-stadium"])).toBe("stadium");
    expect(stadiumKind(STADIUMS["barclays-center"])).toBe("hall");
    expect(stadiumSeats(STADIUMS["yankee-stadium"], "mlb")).toBe(46537);
    expect(stadiumSeats(STADIUMS["citi-field"], "mlb")).toBe(41922);
    expect(stadiumSeats(STADIUMS["olympic-stadium-montreal"], "mlb")).toBe(49757);
    expect(stadiumSeats(STADIUMS["metlife-stadium"], "nfl")).toBe(82500);
    expect(stadiumSeats(STADIUMS["metlife-stadium"], "soccer")).toBe(80663);
    expect(stadiumSeats(STADIUMS["barclays-center"], "nba")).toBe(17732);
    expect(stadiumConfigs(STADIUMS["metlife-stadium"])).toEqual(["nfl", "soccer"]);
    expect(stadiumNames(STADIUMS["barclays-center"])).toEqual({ en: "Barclays Center", ja: "バークレイズ・センター" });
    expect(stadiumNames(STADIUMS["olympic-stadium-montreal"]).en).toBe("Olympic Stadium");
  });

  it("say how each field lies, from what OpenStreetMap maps, and where it maps nothing say so", () => {
    expect(stadiumOrientation(STADIUMS["yankee-stadium"])).toMatchObject({ basis: "infield", heading: 75.6 });
    expect(stadiumOrientation(STADIUMS["citi-field"])).toMatchObject({ basis: "pitch", heading: 14.5 });
    expect(STADIUMS["citi-field"].osm.axis.rms).toBeLessThan(4);
    expect(stadiumOrientation(STADIUMS["metlife-stadium"])).toMatchObject({ basis: "pitch", heading: 166.5 });
    expect(stadiumOrientation(STADIUMS["olympic-stadium-montreal"]).basis).toBe("none");
    expect(stadiumOrientation(STADIUMS["barclays-center"]).basis).toBe("building");
    for (const id of ["yankee-stadium", "citi-field", "metlife-stadium", "olympic-stadium-montreal", "barclays-center"]) {
      expect(STADIUMS[id].osm.licence).toBe("ODbL-1.0");
      expect(STADIUMS[id].osm.read).toBe("2026-10-30");
    }
  });

  it("have the roofs the articles give: none over MetLife Stadium, Citi Field and Yankee Stadium's field, a fixed one over the Olympic Stadium and Barclays Center", () => {
    expect(STADIUMS["metlife-stadium"].roof).toMatchObject({ kind: "open", basis: "documented" });
    expect(STADIUMS["citi-field"].roof).toMatchObject({ kind: "open", basis: "documented" });
    expect(STADIUMS["yankee-stadium"].roof.kind).toBe("open");
    expect(STADIUMS["olympic-stadium-montreal"].roof).toMatchObject({ kind: "fixed", basis: "documented" });
    expect(STADIUMS["barclays-center"].roof).toMatchObject({ kind: "fixed", basis: "documented" });
  });

  it("give the Montreal Tower its height and its lean, with the footprint OpenStreetMap maps and an axis that leans over the stadium", () => {
    const o = STADIUMS["olympic-stadium-montreal"];
    expect(o.tower).toMatchObject({ height: 165, angle: 45, basis: "documented" });
    expect(o.osm.tower).toMatchObject({ source: "way/20213158", height: 165 });
    const [[bx, by], [tx, ty]] = metresFrom([o.osm.axis.centre[0], o.osm.axis.centre[1]], [o.osm.tower!.base, o.osm.tower!.top]);
    // 165 metres up at 45 degrees is about 165 metres across (the funicular line on the shaft runs 158), the foot outside the building and the top, the observatory, inside it.
    expect(Math.hypot(tx - bx, ty - by)).toBeGreaterThan(150);
    expect(Math.hypot(tx - bx, ty - by)).toBeLessThan(170);
    expect(Math.hypot(tx, ty)).toBeLessThan(Math.hypot(bx, by));
    expect(o.osm.tower!.source).toBe("way/20213158");
  });
});

describe("the new venues drawn", () => {
  const draw = (o: Record<string, unknown>) => drawKyogijo({ crowd: { real: true }, ...o } as never);

  it("each lies in its own building with a bowl of its seats, in 2D", () => {
    for (const o of [{ sport: "mlb", park: "yankee-stadium" }, { sport: "mlb", park: "citi-field" }, { sport: "mlb", park: "olympic-stadium-montreal" }, { sport: "nfl", stadium: "metlife-stadium" }, { sport: "soccer", stadium: "metlife-stadium" }, { sport: "nba", stadium: "barclays-center", arena: "barclays-center" }]) {
      const svg = draw(o);
      expect(svg, JSON.stringify(o)).toContain("ky-cr-shell");
      expect(svg, JSON.stringify(o)).toContain("(c) OpenStreetMap contributors");
    }
  });

  it("draws Barclays Center's basketball court in the hall, says so in English and in Japanese, and names the building's axis as an inference", () => {
    const o = { sport: "nba", stadium: "barclays-center", arena: "barclays-center", crowd: { real: true } } as never;
    const en = describeDrawing(o).description;
    expect(en).toContain("Barclays Center");
    expect(en).toContain("The court is set along the building's long axis, which is an inference");
    const ja = describeDrawing({ ...(o as object), language: "ja" } as never).description;
    expect(ja).toContain("バークレイズ・センター");
    expect(ja).toContain("コートは建物の長軸に沿って");
  });

  it("keeps MetLife Stadium's two configurations in one frame, with the mapped pitch's way as the field's", () => {
    const [a, b] = ["nfl", "soccer"].map((sport) => draw({ sport, stadium: "metlife-stadium" }));
    const view = (svg: string) => /viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(3).map(Number);
    expect(view(a)).toEqual(view(b));
    expect(stadiumBowlInside).toBeDefined();
  });
});

describe("the new venues in 3D, roof on and off", () => {
  const options = [
    ["yankee-stadium", { sport: "mlb", park: "yankee-stadium" }],
    ["citi-field", { sport: "mlb", park: "citi-field" }],
    ["olympic-stadium-montreal", { sport: "mlb", park: "olympic-stadium-montreal" }],
    ["metlife-stadium", { sport: "nfl", stadium: "metlife-stadium" }],
    ["barclays-center", { sport: "nba", stadium: "barclays-center", arena: "barclays-center" }],
  ] as const;

  it("builds every one with the roof asked for and without it, walls and stands in both", () => {
    for (const [id, o] of options) {
      const on = buildTurn({ ...o, crowd: { real: true } } as never, { venue: { roof: true } });
      const off = buildTurn({ ...o, crowd: { real: true } } as never, { venue: { roof: false, walls: true } });
      expect(on.uprights.items.find((i) => i.kind === "walls"), id).toBeDefined();
      expect(off.uprights.items.find((i) => i.kind === "walls"), id).toBeDefined();
      expect(off.uprights.items.find((i) => i.kind === "roof"), id).toBeUndefined();
      expect(on.planes.length, id).toBeGreaterThan(off.planes.length - 1);
    }
  });

  it("gives the open-air stadiums no roof and the others a lid", () => {
    const roofOf = (o: Record<string, unknown>) => buildTurn({ ...o, crowd: { real: true } } as never, { venue: { roof: true } }).uprights.items.find((i) => i.kind === "roof");
    expect(roofOf({ sport: "nfl", stadium: "metlife-stadium" })).toBeUndefined();
    expect(roofOf({ sport: "mlb", park: "citi-field" })).toBeUndefined();
    expect(roofOf({ sport: "mlb", park: "yankee-stadium" })).toBeUndefined();
    expect(roofOf({ sport: "nba", stadium: "barclays-center" })).toBeDefined();
    expect(roofOf({ sport: "mlb", park: "olympic-stadium-montreal" })).toBeDefined();
  });

  it("raises the Montreal Tower as four faces to 165 metres over the ground, leaning towards the stadium", () => {
    const roof = buildTurn({ sport: "mlb", park: "olympic-stadium-montreal", crowd: { real: true } } as never, { venue: { roof: true } }).uprights.items.find((i) => i.kind === "roof")!;
    const tower = roof.planes.filter((p) => p.id.startsWith("tower-") && !p.id.startsWith("tower-cable"));
    // Twelve rings of four faces, a plinth of five planes and an observatory of five.
    expect(tower).toHaveLength(12 * 4 + 5 + 5);
    // (The shaft's sections are horizontal: the observatory's roof is level at 165 metres, the plinth stands on the ground and nothing goes under it.)
    const tops = tower.filter((p) => p.id === "tower-cap-top").map((p) => p.o[2]);
    expect(tops).toHaveLength(1);
    expect(tops[0]).toBeCloseTo(165 * FEET, 0);
    expect(Math.min(...tower.map((p) => Math.min(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2])))).toBeCloseTo(0, 5);
    expect(Math.max(...tower.map((p) => Math.max(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2])))).toBeCloseTo(165 * FEET, 0);
    // It narrows: the first ring is broad and the last narrow, and the shaft has slits down its back and cables to the roof.
    const width = (id: string) => { const p = tower.find((q) => q.id === id)!; return Math.hypot(p.v[0], p.v[1]); };
    expect(width("tower-0-0")).toBeGreaterThan(2.5 * width("tower-11-0"));
    expect(tower.filter((p) => p.svg.includes("u-tower-slit")).length).toBeGreaterThan(5);
    expect(roof.planes.filter((p) => p.id.startsWith("tower-cable")).length).toBe(6);
    expect(tower.every((p) => p.kind === "wall")).toBe(true);
    // Over the bowl: the observatory stands inside the building's outline and the foot outside it.
    const cap = tower.find((p) => p.id === "tower-cap-0")!;
    const foot = tower.find((p) => p.id === "tower-foot-0")!;
    expect(Math.hypot(cap.o[0], cap.o[1])).toBeLessThan(Math.hypot(foot.o[0], foot.o[1]));
  });
});

describe("the east coast in a district", () => {
  it("places New York's six venues at their real distances, the two across the East River as the crow flies", () => {
    const plan = planDistrict({ venues: NEW_YORK, mode: "city" });
    expect(plan.members.map((m) => m.member.key)).toEqual(["madison-square-garden", "barclays-center:nba", "yankee-stadium:mlb", "citi-field:mlb", "metlife-stadium:nfl", "ubs-arena"]);
    const metres = (a: string, b: string) => plan.between.find((x) => [x.a, x.b].sort().join() === [a, b].sort().join())!.metres;
    expect(metres("madison-square-garden", "barclays-center:nba")).toBeGreaterThan(7500);
    expect(metres("madison-square-garden", "barclays-center:nba")).toBeLessThan(8000);
    expect(metres("madison-square-garden", "yankee-stadium:mlb")).toBeGreaterThan(9500);
    expect(metres("madison-square-garden", "yankee-stadium:mlb")).toBeLessThan(11000);
    expect(metres("metlife-stadium:nfl", "ubs-arena")).toBeGreaterThan(30000);
    expect(drawDistrict({ venues: NEW_YORK, mode: "city" })).toContain('data-venue="barclays-center:nba"');
  });

  it("places Montreal's two venues six or seven kilometres apart", () => {
    const plan = planDistrict({ venues: ["bell-centre", "olympic-stadium-montreal:mlb"], mode: "city" });
    expect(plan.between[0].metres).toBeGreaterThan(6500);
    expect(plan.between[0].metres).toBeLessThan(7500);
  });

  it("raises New York's six venues in 3D", () => {
    const model = buildDistrictTurn({ venues: NEW_YORK, mode: "city" } as never);
    expect(model.planes.length).toBeGreaterThan(500);
  });
});

describe("the surroundings, read only for the venues shown", () => {
  it("name each venue's own area, Montreal's city when both of its venues are shown, and none for more than two of New York's", () => {
    expect(areaKeysFor(["madison-square-garden"])).toEqual(["nyc-midtown"]);
    expect(areaKeysFor(["yankee-stadium:mlb"])).toEqual(["nyc-bronx"]);
    expect(areaKeysFor(["citi-field:mlb"])).toEqual(["nyc-flushing"]);
    expect(areaKeysFor(["barclays-center:nba"])).toEqual(["nyc-brooklyn"]);
    expect(areaKeysFor(["metlife-stadium:nfl"])).toEqual(["meadowlands"]);
    expect(areaKeysFor(["ubs-arena"])).toEqual(["belmont-park"]);
    expect(areaKeysFor(["bell-centre"])).toEqual(["montreal-downtown"]);
    expect(areaKeysFor(["olympic-stadium-montreal:mlb"])).toEqual(["montreal-olympic"]);
    expect(areaKeysFor(["bell-centre", "olympic-stadium-montreal:mlb"])).toEqual(["montreal-city"]);
    expect(areaKeysFor(["yankee-stadium:mlb", "citi-field:mlb"])).toEqual(["nyc-bronx", "nyc-flushing"]);
    expect(areaKeysFor(NEW_YORK)).toEqual([]);
  });

  it("are one file each, read by their own key, each within a budget of bytes as data", () => {
    const sizes: Record<string, number> = {};
    for (const key of ["nyc-midtown", "nyc-bronx", "nyc-flushing", "nyc-brooklyn", "meadowlands", "belmont-park", "montreal-downtown", "montreal-olympic", "montreal-city"]) {
      expect(CITYCTX_AREAS[key], key).toBeDefined();
      sizes[key] = JSON.stringify(CITYCTX_AREAS[key]).length;
      expect(sizes[key], key).toBeLessThan(200_000);
    }
    expect(Object.keys(sizes)).toHaveLength(9);
  });

  it("give New York's buildings the City's roof heights and credit it, and the others OpenStreetMap alone", async () => {
    const midtown = await loadArea("nyc-midtown");
    expect(midtown.layers.buildings!.rows.length).toBeGreaterThan(900);
    expect(midtown.layers.buildings!.attribution.en).toContain("City of New York, Building Footprints, NYC Open Data");
    expect(midtown.layers.buildings!.licence).toContain("Administrative Code 23-502");
    const park = await loadArea("belmont-park");
    expect(park.layers.buildings!.attribution.en).not.toContain("New York");
    expect(park.layers.buildings!.attribution.en).toContain("OpenStreetMap contributors");
    const plan = planDistrict({ venues: ["madison-square-garden"], context: await loadAreasFor(["madison-square-garden"]) });
    expect(plan.context!.attribution.en.join(" ")).toContain("City of New York");
    expect(Math.max(...plan.context!.blocks.map((b) => b.height / FEET))).toBeGreaterThan(150);
  });

  it("leave the Montreal Tower out of Olympic Park's buildings, because the stadium draws it leaning", async () => {
    const area = await loadArea("montreal-olympic");
    const heights = area.layers.buildings!.rows.map((row) => row[0] * area.grid);
    expect(heights.filter((h) => h > 140)).toHaveLength(0);
  });
});
