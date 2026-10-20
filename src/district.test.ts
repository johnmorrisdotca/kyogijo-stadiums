import { describe, expect, it } from "vitest";
import { crowdStands } from "./draw.ts";
import { DISTRICT_IDS, DISTRICT_MARGIN, districtMember, describeDistrict, drawDistrict, isDistrictId, metresText, planDistrict, scaleOf, unknownVenues, type DistrictOptions } from "./district.ts";
import { buildDistrictTurn, districtPresets, districtTurnMarkup } from "./district.turn.ts";
import { STADIUMS, planStadium, stadiumSeats } from "./stadiums.ts";
import { VENUES, VENUE_ATTRIBUTION, planVenue } from "./venues.ts";
import { areaOf, hullOf, metresFrom, middleOf } from "./venues.geo.ts";
import { PITCH_MAX, eyeDistance, layoutOf, project, type TurnModel } from "./turn-entry.ts";
import { groupRanks } from "./turn.markup.ts";

const PAIR: DistrictOptions = { venues: ["bc-place", "rogers-arena"] };
const FEET = 3.28084;
const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);
const lonLat = (ring: readonly (readonly [number, number])[]): [number, number][] => ring.map(([lon, lat]) => [lon, lat]);
const EARTH = 6371008.8;
const haversine = (a: readonly number[], b: readonly number[]): number => {
  const rad = Math.PI / 180;
  const h = Math.sin(((b[1] - a[1]) * rad) / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(((b[0] - a[0]) * rad) / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.sqrt(h));
};

describe("a district's venues", () => {
  it("are any key of the arenas and the stadiums, a stadium in the configuration named or its first, and nothing else", () => {
    expect(DISTRICT_IDS).toContain("rogers-arena");
    expect(DISTRICT_IDS).toContain("bc-place");
    expect(isDistrictId("bc-place")).toBe(true);
    expect(isDistrictId("maracana")).toBe(false);
    expect(districtMember("rogers-arena")).toMatchObject({ key: "rogers-arena", kind: "arena", seats: 18871 });
    expect(districtMember("bc-place")).toMatchObject({ key: "bc-place:cfl", kind: "stadium", config: "cfl", seats: 54500 });
    expect(districtMember("bc-place:soccer")).toMatchObject({ key: "bc-place:soccer", config: "soccer", seats: 52497 });
    expect(districtMember({ id: "bc-place", config: "soccer" }).key).toBe("bc-place:soccer");
    expect(districtMember("bc-place").name).toEqual({ en: "BC Place", ja: "BCプレイス" });
    expect(districtMember("rogers-arena").name.en).toBe("Rogers Arena");
    expect(unknownVenues(["bc-place", "nowhere:cfl", { id: "rogers-arena" }])).toEqual(["nowhere"]);
  });

  it("throw, naming what there is, for a key or a configuration that does not exist, and a district with none or one twice", () => {
    expect(() => districtMember("nowhere")).toThrow(/no venue nowhere.*bc-place/);
    expect(() => districtMember("bc-place:hockey")).toThrow(/no configuration hockey/);
    expect(() => districtMember("rogers-arena:cfl")).toThrow(/one configuration/);
    expect(() => planDistrict({ venues: [] })).toThrow(/needs a venue/);
    expect(() => planDistrict({ venues: ["bc-place", "bc-place:cfl"] })).toThrow(/twice/);
    expect(() => planDistrict({ venues: ["rogers-arena", "rogers-arena"] })).toThrow(/twice/);
    // The same stadium in its two configurations is two venues of a district (a comparison), not a twin.
    expect(planDistrict({ venues: ["bc-place:cfl", "bc-place:soccer"] }).members).toHaveLength(2);
  });

  it("are drawn from the options of their own pages, so that nothing is drawn a second way", () => {
    expect(districtMember("rogers-arena").options).toMatchObject({ sport: "nhl", arena: "rogers-arena", crowd: { real: true } });
    expect(districtMember("bc-place:soccer").options).toMatchObject({ sport: "soccer", stadium: "bc-place", crowd: { real: true } });
  });

  it("hold their seats in the district as they do alone: BC Place's 54,500 and 52,497, Rogers Arena's 18,871, each in the bowl of its own plan", () => {
    const stands = (key: string) => crowdStands(districtMember(key).options)!;
    expect(stands("bc-place:cfl").seats).toBe(54500);
    expect(stands("bc-place:soccer").seats).toBe(52497);
    expect(stands("rogers-arena").seats).toBe(18871);
    for (const [key, total] of [["bc-place:cfl", planStadium(STADIUMS["bc-place"], "cfl", stands("bc-place:cfl").box).total], ["rogers-arena", planVenue(VENUES["rogers-arena"], stands("rogers-arena").box).total]] as const) {
      expect(total, key).toBe(districtMember(key).seats);
    }
    expect(stadiumSeats(STADIUMS["bc-place"], "soccer")).toBe(52497);
  });
});

describe("the plan of a district", () => {
  const plan = planDistrict(PAIR);
  const [bc, rogers] = plan.members;

  it("places each surface where it is on the ground: the distance between middles is the great-circle distance of their coordinates, to a metre", () => {
    const a = STADIUMS["bc-place"].osm.axis.centre;
    const b = VENUES["rogers-arena"].osm.axis.centre;
    expect(plan.between).toHaveLength(1);
    expect(Math.abs(plan.between[0].metres - haversine(a, b))).toBeLessThan(1);
    const feet = Math.hypot(rogers.at[0] - bc.at[0], rogers.at[1] - bc.at[1]);
    expect(Math.abs(feet / FEET - haversine(a, b))).toBeLessThan(1);
    expect(plan.between[0].metres).toBeGreaterThan(200);
    expect(plan.between[0].metres).toBeLessThan(350);
  });

  it("puts Rogers Arena north-east of BC Place, as the coordinates say, with north at the top of the page", () => {
    const a = STADIUMS["bc-place"].osm.axis.centre;
    const b = VENUES["rogers-arena"].osm.axis.centre;
    const [east, north] = metresFrom(a as [number, number], [b as [number, number]])[0];
    expect(east).toBeGreaterThan(0);
    expect(north).toBeGreaterThan(0);
    expect((rogers.at[0] - bc.at[0]) / FEET).toBeCloseTo(east, 0);
    // The page's y grows downwards: north is up.
    expect(-(rogers.at[1] - bc.at[1]) / FEET).toBeCloseTo(north, 0);
    expect(plan.turn).toBe(0);
    expect(plan.north).toBe(0);
  });

  it("turns each drawing to lie as it does in the world: its field's heading less a quarter turn, plus the map's turn", () => {
    expect(bc.angle).toBeCloseTo(STADIUMS["bc-place"].osm.axis.heading - 90, 5);
    expect(rogers.angle).toBeCloseTo(VENUES["rogers-arena"].osm.axis.heading - 90, 5);
    const turned = planDistrict({ ...PAIR, turn: 30 });
    expect(turned.turn).toBe(30);
    expect(turned.members[0].angle).toBeCloseTo(bc.angle + 30, 5);
    // Turning the map keeps every distance.
    expect(turned.between[0].metres).toBe(plan.between[0].metres);
    const feet = Math.hypot(turned.members[1].at[0] - turned.members[0].at[0], turned.members[1].at[1] - turned.members[0].at[1]);
    expect(feet / FEET).toBeCloseTo(plan.between[0].metres, 0);
  });

  it("keeps each building the shape and the size of its outline: the footprint's area is the outline's, in feet", () => {
    for (const [placed, ring] of [[bc, STADIUMS["bc-place"].osm.ring], [rogers, VENUES["rogers-arena"].osm.ring]] as const) {
      const metres = areaOf(metresFrom(middleOf(lonLat(ring)), lonLat(ring)));
      expect(areaOf(placed.footprint) / (FEET * FEET) / metres).toBeCloseTo(1, 2);
      expect(placed.hull.length).toBeGreaterThan(5);
    }
    expect(areaOf(hullOf(bc.footprint))).toBeGreaterThanOrEqual(areaOf(bc.footprint) - 1);
  });

  it("fits the frame to the buildings with the margin of its mode: tight for neighbours, wider for a city, every footprint inside", () => {
    for (const mode of ["neighbours", "city"] as const) {
      const p = planDistrict({ ...PAIR, mode });
      expect(p.mode).toBe(mode);
      const xs = p.members.flatMap((m) => m.footprint.map((q) => q[0]));
      const ys = p.members.flatMap((m) => m.footprint.map((q) => q[1]));
      const long = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      expect(p.view.x).toBeCloseTo(Math.min(...xs) - long * DISTRICT_MARGIN[mode], 5);
      expect(p.view.y).toBeCloseTo(Math.min(...ys) - long * DISTRICT_MARGIN[mode], 5);
      expect(p.view.x + p.view.w).toBeCloseTo(Math.max(...xs) + long * DISTRICT_MARGIN[mode], 5);
      expect(p.view.y + p.view.h).toBeCloseTo(Math.max(...ys) + long * DISTRICT_MARGIN[mode], 5);
    }
    expect(DISTRICT_MARGIN.neighbours).toBeLessThan(DISTRICT_MARGIN.city);
  });

  it("turns itself so that the district's long way lies across the page when asked (`auto`), and keeps north up otherwise", () => {
    const auto = planDistrict({ ...PAIR, turn: "auto" });
    const width = (p: typeof plan): number => p.view.w / p.view.h;
    expect(width(auto)).toBeGreaterThanOrEqual(width(plan) - 0.01);
    expect(Math.abs(((auto.turn + 180) % 360) - 180)).toBeLessThanOrEqual(90);
    expect(planDistrict({ venues: ["rogers-arena"], turn: "auto" }).turn).toBe(0);
    expect(planDistrict({ ...PAIR, turn: -30 }).turn).toBe(330);
  });

  it("is generic: one venue is a district, and any number of venues in any order is placed by the same sums, the same plan every time", () => {
    const one = planDistrict({ venues: ["rogers-arena"] });
    expect(one.members).toHaveLength(1);
    expect(one.between).toEqual([]);
    expect(one.members[0].at).toEqual([0, 0]);
    const reversed = planDistrict({ venues: ["rogers-arena", "bc-place"] });
    expect(reversed.between[0].metres).toBe(plan.between[0].metres);
    expect(JSON.stringify(planDistrict(PAIR))).toBe(JSON.stringify(plan));
    const three = planDistrict({ venues: ["bc-place:cfl", "rogers-arena", "bc-place:soccer"] });
    expect(three.between).toHaveLength(3);
  });
});

describe("a district drawn in 2D", () => {
  const svg = drawDistrict(PAIR);

  it("is one SVG with each venue's own drawing in its place, turned as it lies, and one arrow, one scale and a grid of its own", () => {
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('class="kyogijo ky-district"');
    expect((svg.match(/data-venue="/g) ?? []).length).toBe(2);
    expect(svg).toContain('data-venue="bc-place:cfl"');
    expect(svg).toContain('data-venue="rogers-arena"');
    expect((svg.match(/class="ky-cr-shell"/g) ?? []).length).toBe(2);
    // The venues' own arrows and aprons are taken out: the district has one arrow and one ground.
    expect(svg).not.toContain('class="ky-cr-north"');
    expect(svg).not.toContain('class="ky-apron"');
    expect((svg.match(/class="ky-dist-north"/g) ?? []).length).toBe(1);
    expect((svg.match(/class="ky-dist-scale"/g) ?? []).length).toBe(1);
    expect(svg).toContain('class="ky-dist-grid"');
    expect(svg).toContain("rotate(");
  });

  it("is the same text every time and differs with the venues, the turn and the mode", () => {
    expect(drawDistrict(PAIR)).toBe(svg);
    expect(drawDistrict({ ...PAIR, turn: 20 })).not.toBe(svg);
    expect(drawDistrict({ ...PAIR, mode: "city" })).not.toBe(svg);
    expect(drawDistrict({ venues: ["bc-place:soccer", "rogers-arena"] })).not.toBe(svg);
  });

  it("has ids that belong to the district: no id twice, so that two on a page do not take each other's patterns", () => {
    const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    const two = drawDistrict({ ...PAIR, id: "a" }) + drawDistrict({ ...PAIR, id: "b" });
    const all = [...two.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(all).size).toBe(all.length);
    expect(drawDistrict({ ...PAIR, id: "a" })).toContain('id="a-t"');
  });

  it("says what it is in both languages, with the distance between the middles and the credit, and names no club, league or tournament", () => {
    const en = describeDistrict(PAIR);
    expect(en.title).toBe("BC Place and Rogers Arena: where they stand");
    expect(en.description).toContain("2 real venues");
    expect(en.description).toContain("metres apart");
    expect(en.description).toContain(VENUE_ATTRIBUTION);
    const ja = describeDistrict({ ...PAIR, language: "ja" });
    expect(ja.title).toBe(`${districtMember("bc-place").name.ja}と${districtMember("rogers-arena").name.ja}の位置関係`);
    expect(ja.description).toContain("OpenStreetMap");
    expect(ja.description).toContain("m離れています");
    for (const word of ["FIFA", "World Cup", "Lions", "Canucks", "Whitecaps", "NHL", "Grey Cup"]) expect(svg, word).not.toContain(word);
    expect(drawDistrict({ ...PAIR, language: "ja", labels: true })).toContain("BCプレイス");
  });

  it("draws names beside the buildings in a city and none among neighbours, unless asked", () => {
    expect(svg).not.toContain(">BC Place</text>");
    expect(drawDistrict({ ...PAIR, labels: true })).toContain(">BC Place</text>");
    expect(drawDistrict({ ...PAIR, mode: "city" })).toContain(">Rogers Arena</text>");
    expect(drawDistrict({ ...PAIR, mode: "city", labels: false })).not.toContain(">Rogers Arena</text>");
  });

  it("has a grid of a hundred metres among neighbours and a kilometre in a city, and a scale of a round length", () => {
    expect(scaleOf({ w: 1000 * FEET })).toBe(200);
    expect(scaleOf({ w: 20000 * FEET })).toBe(2000);
    expect(scaleOf({ w: 10 })).toBe(50);
    expect(metresText(200)).toBe("200 m");
    expect(metresText(2000)).toBe("2 km");
    const lines = (s: string): number => (/class="ky-dist-grid"[^>]*d="([^"]*)"/.exec(s)![1].match(/M/g) ?? []).length;
    expect(lines(drawDistrict({ ...PAIR, mode: "city" }))).toBeLessThan(lines(svg));
    expect(svg).toContain(">50 m<");
  });

  it("is dark and light by the page's properties, with no colour of its own beyond the venues'", () => {
    const style = /<style>([\s\S]*?)<\/style>/.exec(drawDistrict({ venues: ["rogers-arena"] }))![1];
    expect(style).toContain("prefers-color-scheme:dark");
    expect(drawDistrict({ ...PAIR, theme: "dark" })).toContain('data-theme="dark"');
    expect(drawDistrict({ ...PAIR, style: "none" })).not.toContain("ky-dist-ground{");
  });

  it("keeps every footprint inside the viewBox, at every turn", () => {
    for (const turn of [0, 25, 90, 200, "auto"] as const) {
      const p = planDistrict({ ...PAIR, turn });
      for (const m of p.members) for (const [x, y] of m.footprint) {
        expect(x).toBeGreaterThanOrEqual(p.view.x);
        expect(x).toBeLessThanOrEqual(p.view.x + p.view.w);
        expect(y).toBeGreaterThanOrEqual(p.view.y);
        expect(y).toBeLessThanOrEqual(p.view.y + p.view.h);
      }
    }
  });
});

/** The area of the floor on the screen over a turn, as the browser draws the matrix written for it (see turn.size.test.ts). */
function floorAreas(model: TurnModel, pitch: number, [w, h]: readonly [number, number], by: number): number[] {
  const width = model.viewBox.w * model.scale;
  const height = model.viewBox.h * model.scale;
  const shoelace = (points: readonly (readonly number[])[]): number => Math.abs(points.reduce((sum, p, i) => sum + p[0] * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * p[1], 0)) / 2;
  return range(0, 359, by).map((yaw) => {
    const t = layoutOf(model, { yaw, pitch, zoom: 1 }, w, h).transforms[0];
    const m = t.slice("matrix3d(".length, -1).split(",").map(Number);
    return shoelace([[0, 0], [width, 0], [width, height], [0, height]].map(([x, y]) => {
      const q = m[3] * x + m[7] * y + m[15];
      return [(m[0] * x + m[4] * y + m[12]) / q, (m[1] * x + m[5] * y + m[13]) / q];
    }));
  });
}

describe("a district in 3D", () => {
  const model = buildDistrictTurn(PAIR, {});
  const labelled = buildDistrictTurn({ ...PAIR, labels: true }, {});
  const city = buildDistrictTurn({ ...PAIR, mode: "city" }, {});
  const groupOf = (m: TurnModel, g: number) => m.planes.filter((p) => p.group === g);

  it("is a model like any other: a floor that is the plan with each building, and the planes of every venue, each of one building", () => {
    expect(model.turnable).toBe(true);
    expect(model.floor).toContain('class="kyogijo ky-district"');
    expect((model.floor.match(/class="ky-cr-shell"/g) ?? []).length).toBe(2);
    expect(model.floor).not.toMatch(/class="ky-cr-(people|bed)"/);
    expect(model.floor).not.toContain("</text>>");
    expect(model.groups).toHaveLength(2);
    expect(model.planes.every((p) => p.group === 0 || p.group === 1)).toBe(true);
    expect(groupOf(model, 0).length).toBeGreaterThan(300);
    expect(groupOf(model, 1).length).toBeGreaterThan(150);
    expect(new Set(model.planes.map((p) => p.id)).size).toBe(model.planes.length);
    expect(model.planes.length).toBeLessThan(1400);
    expect(model.flat).toBe(drawDistrict(PAIR));
    expect(model.description).toContain("metres apart");
  });

  it("raises each building where the plan puts it, each turned about its own middle: the stands, the walls and the roof, the goals and the posts", () => {
    const [bc, rogers] = planDistrict(PAIR).members;
    for (const [g, placed] of [[0, bc], [1, rogers]] as const) {
      const planes = groupOf(model, g);
      const kinds = new Set(planes.map((p) => p.kind));
      expect(kinds.has("seats"), `${g}`).toBe(true);
      expect(kinds.has("wall"), `${g}`).toBe(true);
      expect(kinds.has("roof"), `${g}`).toBe(true);
      // Every plane stands over its building's hull, to the metre or so.
      const xs = planes.filter((p) => p.kind === "seats").flatMap((p) => [p.o[0], p.o[0] + p.u[0] + p.v[0]]);
      const ys = planes.filter((p) => p.kind === "seats").flatMap((p) => [p.o[1], p.o[1] + p.u[1] + p.v[1]]);
      const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
      expect(Math.hypot(cx - placed.at[0], cy - placed.at[1]) / FEET).toBeLessThan(25);
    }
    expect(groupOf(model, 0).some((p) => p.kind === "goal" || p.kind === "post" || p.id.includes("goal"))).toBe(true);
  });

  it("puts a roof on every venue by default, the retractable one closed, and opens it with `roofOpen`", () => {
    expect(groupOf(model, 0).some((p) => p.id.includes("fabric-"))).toBe(true);
    const open = buildDistrictTurn(PAIR, { venue: { roof: true, roofOpen: true } });
    expect(groupOf(open, 0).some((p) => p.id.includes("fabric-"))).toBe(false);
    expect(groupOf(open, 0).some((p) => p.id.includes("pod-"))).toBe(true);
  });

  it("names the venues on signs that face the eye, in the district's language, when it has labels", () => {
    expect(model.planes.some((p) => p.kind === "sign")).toBe(false);
    const signs = labelled.planes.filter((p) => p.kind === "sign");
    expect(signs).toHaveLength(2);
    for (const s of signs) {
      expect(s.billboard).toBe(true);
      expect(s.lean).toBe(true);
    }
    expect(signs.map((s) => s.svg).join("")).toContain("BC Place");
    expect(city.planes.filter((p) => p.kind === "sign")).toHaveLength(2);
    expect(buildDistrictTurn({ ...PAIR, labels: true, language: "ja" }, {}).planes.filter((p) => p.kind === "sign").map((s) => s.svg).join("")).toContain("BCプレイス");
  });

  it("keeps the floor's size steady as the view turns: one area at every turn, in desk and phone boxes, at every tip, for neighbours and a city", () => {
    for (const [name, m] of [["neighbours", model], ["city", city]] as const) {
      const pitches = [...new Set([...Object.values(districtPresets(planDistrict(PAIR))).map((v) => v.pitch), 45, PITCH_MAX])].filter((pitch) => pitch > 0);
      for (const container of [[1280, 900], [390, 700]] as const) {
        for (const pitch of pitches) {
          const a = floorAreas(m, pitch, container, 10);
          expect(Math.max(...a) / Math.min(...a), `${name} ${container.join("x")} pitch ${pitch}`).toBeLessThan(1.02);
        }
      }
      const step = floorAreas(m, 62, [1280, 900], 3);
      expect(Math.max(...step.map((x, i) => Math.max(x, step[(i + 1) % step.length]) / Math.min(x, step[(i + 1) % step.length]))), `${name} steps`).toBeLessThan(1.004);
    }
  });

  it("holds the same placement and scale at every turn: the camera is steady, it only turns", () => {
    const base = layoutOf(model, { yaw: 0, pitch: 62, zoom: 1 }, 960, 600).at;
    for (const yaw of range(-180, 180, 20)) expect(layoutOf(model, { yaw, pitch: 62, zoom: 1 }, 960, 600).at).toEqual(base);
  });

  it("keeps both buildings, walls and roofs, inside the container at every angle: the scene is fitted to the district", () => {
    const [w, h] = [960, 600];
    const d = eyeDistance(w, h, model.lens);
    for (const pitch of [0, 30, 62, 84]) {
      for (const yaw of range(0, 355, 15)) {
        const view = { yaw, pitch, zoom: 1 };
        const at = layoutOf(model, view, w, h).at;
        for (const p of model.planes.filter((q) => q.kind === "wall" || q.kind === "roof")) {
          for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            const pt: [number, number, number] = [(p.o[0] + a * p.u[0] + b * p.v[0] - model.centre[0]) * model.scale, (p.o[1] + a * p.u[1] + b * p.v[1] - model.centre[1]) * model.scale, (p.o[2] + a * p.u[2] + b * p.v[2]) * model.scale];
            const [x, y] = project(pt, view, at, d);
            expect(Math.abs(x), `x yaw ${yaw} pitch ${pitch}`).toBeLessThanOrEqual(w / 2 + 1);
            expect(Math.abs(y), `y yaw ${yaw} pitch ${pitch}`).toBeLessThanOrEqual(h / 2 + 1);
          }
        }
      }
    }
  });

  it("draws one building before the other, the far one first, from every side: no plane of the near building is under a plane of the far one", () => {
    const [bc, rogers] = planDistrict(PAIR).members;
    // The line between the buildings: from one middle to the other.
    const axis = [rogers.at[0] - bc.at[0], rogers.at[1] - bc.at[1]];
    const length = Math.hypot(axis[0], axis[1]);
    for (const pitch of [30, 62, 84]) {
      for (const yaw of range(-180, 175, 5)) {
        const layout = layoutOf(model, { yaw, pitch, zoom: 1 }, 960, 600);
        const a = (yaw * Math.PI) / 180;
        // The eye is towards (sin yaw, cos yaw) on the plan; Rogers Arena is nearer when the way to it has a positive part along that.
        const nearer = ((axis[0] / length) * Math.sin(a) + (axis[1] / length) * Math.cos(a)) > 0 ? 1 : 0;
        // Where the two are nearly side by side from the eye, either order is the right one: only a clear difference is tested.
        if (Math.abs((axis[0] / length) * Math.sin(a) + (axis[1] / length) * Math.cos(a)) < 0.35) continue;
        const stackOf = (g: number): number[] => model.planes.flatMap((p, i) => (p.group === g ? [layout.stack[i + 1]] : []));
        const [near, far] = [stackOf(nearer), stackOf(1 - nearer)];
        expect(Math.min(...near), `yaw ${yaw} pitch ${pitch}`).toBeGreaterThan(Math.max(...far));
      }
    }
  });

  it("stacks every plane in a place of its own, above the floor, so that nothing shares a place", () => {
    for (const pitch of [30, 62]) {
      for (const yaw of [-150, -60, 0, 45, 120]) {
        const layout = layoutOf(model, { yaw, pitch, zoom: 1 }, 960, 600);
        const ranks = layout.stack.slice(1);
        expect(new Set(ranks).size).toBe(ranks.length);
        expect(Math.min(...ranks)).toBeGreaterThan(layout.stack[0]);
      }
    }
  });

  it("is turned with the map: the viewpoints turn with it, and the opening view is the broadcast one the model names", () => {
    const turned = buildDistrictTurn({ ...PAIR, turn: 40 }, {});
    expect(districtPresets({ turn: 40 }).overhead.yaw).toBe(40);
    expect(turned.view.yaw).toBeCloseTo(40 - 38, 5);
    expect(turned.presets).toEqual(districtPresets({ turn: 40 }));
    expect(model.view).toEqual(districtPresets({ turn: 0 }).corner);
  });

  it("makes the markup of a still 3D view with controls, an id of its own and the credit in what it says", () => {
    const html = districtTurnMarkup(PAIR, { size: { width: 900, height: 560 } });
    expect(html).toContain('class="ky-turn"');
    expect(html).toContain('class="ky-turn-controls"');
    expect(html).toContain("metres apart");
    expect(html).toContain(VENUE_ATTRIBUTION);
    expect(districtTurnMarkup(PAIR, { size: { width: 900, height: 560 }, controls: false })).not.toContain('class="ky-turn-controls"');
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the order buildings are drawn in", () => {
  const square = (cx: number, cy: number, r: number): [number, number][] => [[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]];
  const groups = [{ hull: square(0, 0, 100) }, { hull: square(300, 0, 100) }];

  it("puts the building on the eye's side of the line between them last: the far one first", () => {
    // The eye is towards (sin yaw, cos yaw): at yaw 90 it is towards +x, so the building at x = 300 is the near one.
    expect(groupRanks(groups, 90)).toEqual([0, 1]);
    expect(groupRanks(groups, -90)).toEqual([1, 0]);
  });

  it("goes by the nearer middle when no line can be put between them", () => {
    const overlap = [{ hull: square(0, 0, 100) }, { hull: square(50, 0, 100) }];
    expect(groupRanks(overlap, 90)).toEqual([0, 1]);
    expect(groupRanks(overlap, -90)).toEqual([1, 0]);
  });

  it("orders three in a row from the eye, and a lone building has no rank but the first", () => {
    const row = [{ hull: square(0, 0, 40) }, { hull: square(200, 0, 40) }, { hull: square(400, 0, 40) }];
    expect(groupRanks(row, 90)).toEqual([0, 1, 2]);
    expect(groupRanks(row, -90)).toEqual([2, 1, 0]);
    expect(groupRanks([{ hull: square(0, 0, 5) }], 33)).toEqual([0]);
  });

  it("is a line between them at any slant: two buildings side by side in y are ordered by a view from the south", () => {
    const stacked = [{ hull: square(0, 0, 100) }, { hull: square(0, 300, 100) }];
    // At yaw 0 the eye is towards +y (down the page): the building at y = 300 is the near one.
    expect(groupRanks(stacked, 0)).toEqual([0, 1]);
    expect(groupRanks(stacked, 180)).toEqual([1, 0]);
  });
});
