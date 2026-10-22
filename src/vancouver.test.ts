import { describe, expect, it } from "vitest";
import { drawDistrict, planDistrict } from "./district.ts";
import { buildDistrictTurn } from "./district.turn.ts";
import { GATE_FACTS, GATE_VENUES, venueGates } from "./gates.ts";
import { VANCOUVER_CENTRE, OSM_ATTRIBUTION } from "./osm.context.data.ts";
import { decodeBuilding, decodeStreet } from "./context.ts";
import { STADIUMS } from "./stadiums.ts";
import { MAST_LEAN, rimPoint } from "./venue.real.ts";
import { buildTurn } from "./turn.model.ts";
import { districtMember } from "./district.ts";
import { edgeDistance, metresFrom } from "./venues.geo.ts";
import { VENUES } from "./venues.ts";
import type { Pt } from "./crowd.ts";

const FEET = 3.28084;
const bc = (roof: object) => buildTurn({ sport: "cfl", stadium: "bc-place", crowd: { real: true } } as never, { venue: { roof: true, ...roof } });
const item = (m: ReturnType<typeof buildTurn>, kind: string) => m.uprights.items.find((i) => i.kind === kind)!;

describe("BC Place's masts", () => {
  const roof = item(bc({}), "roof");
  const masts = roof.planes.filter((p) => p.kind === "mast");

  it("are the thirty-six the engineering article counts, each rising 47.5 metres over the rim, two crossed strips to a mast", () => {
    expect(STADIUMS["bc-place"].roof.masts).toMatchObject({ count: 36, height: 47.5, unit: "m" });
    expect(STADIUMS["bc-place"].roof.masts!.source).toContain("structuremag.org");
    expect(masts).toHaveLength(72);
    expect(new Set(masts.map((p) => p.id.split("-")[1])).size).toBe(36);
    for (const p of masts.filter((q) => q.id.endsWith("-a"))) {
      expect(Math.hypot(...p.u), p.id).toBeCloseTo(47.5 * FEET, 0);
      // It rises by the height times the cosine of its lean, and leans out.
      expect(p.u[2], p.id).toBeCloseTo(47.5 * FEET * Math.cos((MAST_LEAN * Math.PI) / 180), 0);
    }
  });

  it("stand on the rim of the roof, at its edge height, and lean away from the middle", () => {
    const a = masts.filter((p) => p.id.endsWith("-a"));
    const edge = Math.min(...roof.planes.filter((p) => p.id.startsWith("roof-")).flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]]));
    for (const p of a) {
      expect(p.o[2] + 0, p.id).toBeGreaterThan(edge - 6);
      // The top is farther from the building's middle than the foot.
      const foot = Math.hypot(p.o[0] + p.v[0] / 2, p.o[1] + p.v[1] / 2);
      const top = Math.hypot(p.o[0] + p.v[0] / 2 + p.u[0], p.o[1] + p.v[1] / 2 + p.u[1]);
      expect(top, p.id).toBeGreaterThan(foot);
    }
  });

  it("are the roof's: gone with it, and still there open", () => {
    expect(item(bc({}), "roof").planes.filter((p) => p.kind === "mast")).toHaveLength(72);
    expect(item(bc({ roofOpen: true }), "roof").planes.filter((p) => p.kind === "mast")).toHaveLength(72);
    expect(bc({ roof: false }).uprights.items.some((i) => i.kind === "roof")).toBe(false);
  });

  it("belong to no other stadium: the retractable roof of T-Mobile Park and the canopies of Lumen Field have none", () => {
    for (const [id, config] of [["lumen-field", "nfl"], ["t-mobile-park", "mlb"]] as const) {
      const model = buildTurn({ sport: config === "mlb" ? "mlb" : "nfl", ...(config === "mlb" ? { park: id } : { stadium: id }), crowd: { real: true } } as never, { venue: { roof: true } });
      expect(model.planes.some((p) => p.kind === "mast"), id).toBe(false);
    }
  });

  it("find the rim where the building has its walls: on the hall's outline or the building's", () => {
    const [x, y] = rimPoint({ hall: { kind: "rrect", x0: -100, y0: -80, x1: 100, y1: 80, r: 20 }, footprint: [[-120, -90], [120, -90], [120, 90], [-120, 90]] }, [0, 0], 0);
    expect(x).toBeCloseTo(100, 3);
    expect(y).toBeCloseTo(0, 3);
  });
});

describe("the retractable roof of BC Place, open and closed", () => {
  it("is the fabric between the pod and the opening's edge, closed, and the pod alone when it is open", () => {
    const closed = item(bc({}), "roof").planes;
    const open = item(bc({ roofOpen: true }), "roof").planes;
    expect(closed.filter((p) => p.id.startsWith("fabric-")).length).toBeGreaterThan(20);
    expect(open.filter((p) => p.id.startsWith("fabric-"))).toHaveLength(0);
    expect(open.some((p) => p.id.startsWith("pod-"))).toBe(true);
    expect(closed.length).toBeGreaterThan(open.length);
  });

  it("is opened in a district by the venue's `roofOpen`, for BC Place only, without the other venue changing", () => {
    const planes = (settings: object) => buildDistrictTurn({ venues: ["bc-place", "rogers-arena"] }, settings).planes;
    const closed = planes({});
    const open = planes({ venue: { roofOpen: true } });
    expect(closed.filter((p) => p.id.startsWith("m0-fabric-")).length).toBeGreaterThan(20);
    expect(open.filter((p) => p.id.startsWith("m0-fabric-"))).toHaveLength(0);
    expect(closed.filter((p) => p.id.startsWith("m1-")).length).toBe(open.filter((p) => p.id.startsWith("m1-")).length);
  });
});

describe("Rogers Arena's roof and facade", () => {
  const model = buildTurn({ sport: "nhl", arena: "rogers-arena", crowd: { real: true } } as never, { venue: { roof: true } });
  const roof = item(model, "roof").planes;

  it("is closed in the middle with a long skylight along the rink, ours and said so; no other arena has one", () => {
    expect(VENUES["rogers-arena"].roof).toMatchObject({ skylight: true, basis: "plausible" });
    expect(VENUES["rogers-arena"].roof.read).toContain("ours");
    const glass = roof.find((p) => p.id === "skylight")!;
    expect(glass).toBeDefined();
    // Long and thin, and long along the rink (x of the drawing).
    expect(Math.abs(glass.u[0])).toBeGreaterThan(5 * Math.abs(glass.v[1]));
    expect(roof.some((p) => p.id === "cap")).toBe(true);
    for (const v of Object.values(VENUES).filter((x) => x.id !== "rogers-arena")) expect(v.roof.skylight, v.id).toBeUndefined();
  });

  it("has its walls in two bands, a podium under a ledge and a band of glazing, where the venue has a podium; BC Place too, and no one else", () => {
    expect(VENUES["rogers-arena"].facade).toMatchObject({ podium: 38, basis: "plausible" });
    expect(STADIUMS["bc-place"].facade).toMatchObject({ podium: 40, basis: "plausible" });
    for (const m of [model, bc({})]) {
      const walls = item(m, "walls").planes;
      expect(walls.every((p) => p.svg.includes("u-podium") && p.svg.includes("u-ledge") && p.svg.includes("u-glazing")), m.id).toBe(true);
    }
    const plain = buildTurn({ sport: "nhl", arena: "td-garden", crowd: { real: true } } as never, { venue: { roof: true } });
    expect(item(plain, "walls").planes.some((p) => p.svg.includes("u-podium"))).toBe(false);
  });
});

describe("the gates of a venue", () => {
  it("are eight for BC Place, one of them Gate G on the south side, which the Wikipedia article names, and four for Rogers Arena, on the Pat Quinn Way side and at the north-west", () => {
    expect(GATE_VENUES).toEqual(["bc-place", "rogers-arena"]);
    const bcGates = venueGates("bc-place");
    expect(bcGates.map((g) => g.id)).toEqual(["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"]);
    expect(bcGates.filter((g) => g.basis === "documented").map((g) => g.name.en)).toEqual(["Gate G"]);
    expect(bcGates.find((g) => g.id === "south")).toMatchObject({ key: "bc-place:south", bearing: 180, name: { en: "Gate G", ja: "ゲートG" } });
    expect(GATE_FACTS["bc-place"].find((g) => g.id === "south")!.read).toContain("1372065649");
    expect(venueGates("rogers-arena").map((g) => g.id)).toEqual(["south", "south-west", "south-east", "north-west"]);
    expect(venueGates("td-garden")).toEqual([]);
    expect(venueGates("nowhere")).toEqual([]);
  });

  it("stand on the building's outline, each within half a metre of it, facing the way a ray from the middle met it", () => {
    for (const id of GATE_VENUES) {
      const member = districtMember(id);
      for (const g of venueGates(id)) {
        const ring = metresFrom(g.at, member.ring as [number, number][]);
        expect(edgeDistance(ring, [0, 0]), g.key).toBeLessThan(0.5);
        // From the middle of the surface, the gate lies on its bearing.
        const [e, n] = metresFrom(member.centre as [number, number], [g.at])[0];
        const bearing = ((Math.atan2(e, n) * 180) / Math.PI + 360) % 360;
        expect(Math.abs(((bearing - g.bearing + 540) % 360) - 180), g.key).toBeLessThan(0.5);
        expect(g.read.length, g.key).toBeGreaterThan(10);
      }
    }
  });

  it("are named in English and Japanese, a side's name where no source names the gate", () => {
    const south = venueGates("rogers-arena").find((g) => g.id === "south-west")!;
    expect(south.name).toEqual({ en: "South-west gate", ja: "南西ゲート" });
  });

  it("are marked on a district's plan when asked, a door's bar and a stub for each, filled where a source names the gate, and are not otherwise", () => {
    const plain = drawDistrict({ venues: ["bc-place", "rogers-arena"] });
    const marked = drawDistrict({ venues: ["bc-place", "rogers-arena"], gates: true });
    expect(plain).not.toContain("data-gate");
    expect((marked.match(/data-gate="/g) ?? []).length).toBe(12);
    expect((marked.match(/ky-dist-gate-documented/g) ?? []).length).toBe(1);
    const plan = planDistrict({ venues: ["bc-place", "rogers-arena"], gates: true, turn: "auto" });
    expect(plan.gates).toHaveLength(12);
    // Turned with the map: the way a gate faces on the page is its bearing and the map's turn.
    const south = plan.gates.find((g) => g.key === "bc-place:south")!;
    expect(south.angle).toBeCloseTo((180 + plan.turn) % 360, 6);
    expect(planDistrict({ venues: ["t-mobile-park"], gates: true }).gates).toEqual([]);
  });
});

describe("downtown Vancouver round the venues", () => {
  const area = VANCOUVER_CENTRE;

  it("is OpenStreetMap's, ODbL, with the credit, in two layers: the buildings and the streets", () => {
    expect(area).toMatchObject({ key: "vancouver", grid: 0.5, radius: 350 });
    expect(Object.keys(area.layers)).toEqual(["buildings", "streets"]);
    for (const layer of Object.values(area.layers)) {
      expect(layer!.licence).toBe("ODbL-1.0");
      expect(layer!.attribution).toBe(OSM_ATTRIBUTION);
      expect(layer!.source).toContain("data-sources/walk/2026-10-22/osm-vancouver.json");
    }
    expect(OSM_ATTRIBUTION.en).toContain("OpenStreetMap contributors");
  });

  it("holds the buildings with the heights OpenStreetMap maps, the towers the tallest, and a height of ours where none is mapped", () => {
    const heights = area.layers.buildings!.rows.map((row) => decodeBuilding(area, row).height);
    expect(heights.length).toBeGreaterThan(150);
    expect(Math.max(...heights)).toBeCloseTo(115.2, 0);
    // A building with no height mapped is 10 metres: ours.
    expect(heights.filter((h) => h === 10).length).toBeGreaterThan(30);
    for (const h of heights) expect(h).toBeGreaterThan(0);
  });

  it("holds the streets as lines with a width: carriageways, viaducts, railways, sidewalks", () => {
    const kinds = new Set(area.layers.streets!.rows.map((row) => row[0]));
    expect([...kinds].sort()).toEqual([0, 1, 2, 3]);
    for (const row of area.layers.streets!.rows) {
      expect(row[1], "a width").toBeGreaterThanOrEqual(1);
      expect(decodeStreet(area, row).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("is laid on the plan and in 3D when the district asks for it: streets flat on the floor under the buildings, the tall ones standing, the frame kept round the venues", () => {
    const plan = planDistrict({ venues: ["bc-place", "rogers-arena"], context: [area] });
    expect(plan.context!.blocks.length).toBeGreaterThan(30);
    expect(plan.context!.streets!.length).toBeGreaterThan(300);
    // A venue's own building is the venue's: left out.
    expect(plan.context!.owned).toBeGreaterThanOrEqual(2);
    // The frame is the venues' plus the context's reach, not the towers' (Vancouver's are many and tall).
    expect(plan.view.w / FEET).toBeLessThan(900);
    const svg = drawDistrict({ venues: ["bc-place", "rogers-arena"], context: [area] }, plan);
    expect(svg).toContain("ky-dist-streets");
    expect(svg.indexOf("ky-dist-streets")).toBeLessThan(svg.indexOf("ky-dist-context"));
    expect(svg).toContain("OpenStreetMap contributors");
    const model = buildDistrictTurn({ venues: ["bc-place", "rogers-arena"], context: [area] });
    expect(model.uprights.items.filter((i) => i.kind === "blocks").length).toBeGreaterThan(20);
    // No district without a context is changed.
    expect(drawDistrict({ venues: ["bc-place", "rogers-arena"] })).not.toContain("ky-dist-streets");
  });

  it("lies where the walkable mask does: no sidewalk of the streets is far from a walkable cell, none is inside a venue", () => {
    const plan = planDistrict({ venues: ["bc-place", "rogers-arena"], context: [area] });
    const inVenue = (p: Pt) => plan.members.some((m) => m.footprint.length > 2 && edgeDistance(m.footprint, p) < 0.01);
    expect(plan.context!.streets!.filter((s) => s.kind === 3).length).toBeGreaterThan(100);
    expect(plan.context!.streets!.filter((s) => s.points.some(inVenue)).length).toBe(0);
  });
});
