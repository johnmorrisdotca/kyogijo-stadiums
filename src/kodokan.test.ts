import { describe, expect, it } from "vitest";
import { dojo } from "./budo/dojo.api.ts";
import { describeDistrict, districtId, districtMember, drawDistrict, isDistrictId, planDistrict, unknownVenues, DISTRICT_IDS, type DistrictOptions } from "./district.ts";
import { buildDistrictTurn } from "./district.turn.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { KODOKAN, KODOKAN_DOJO, KODOKAN_FLOOR_HEIGHT, KODOKAN_ROOM_HEIGHT, kodokanMember } from "./kodokan.ts";
import { PLATEAU_ATTRIBUTION, TOKYO_DOME_CITY } from "./plateau.data.ts";
import { eyeDistance, layoutOf, project } from "./turn-entry.ts";
import { APART, type Plane } from "./turn.kit.ts";
import { inside } from "./venues.geo.ts";

const ALONE: DistrictOptions = { venues: ["kodokan"] };
const TOKYO: DistrictOptions = { venues: ["tokyo-dome", "korakuen-hall", "kodokan"], context: [TOKYO_DOME_CITY] };
const corners = (p: Plane): number[][] => [[...p.o], [p.o[0] + p.u[0], p.o[1] + p.u[1], p.o[2] + p.u[2]], [p.o[0] + p.v[0], p.o[1] + p.v[1], p.o[2] + p.v[2]], [p.o[0] + p.u[0] + p.v[0], p.o[1] + p.u[1] + p.v[1], p.o[2] + p.u[2] + p.v[2]]];

describe("the Kodokan's data", () => {
  it("is PLATEAU's building: eight storeys and 43.1 metres, the outline of ten points, and a room 31.8 metres square put in it", () => {
    expect(PLATEAU_ATTRIBUTION.en).toContain("Project PLATEAU");
    expect(KODOKAN).toMatchObject({ height: 43.1, storeys: 8, mats: 420, seats: 900 });
    expect(KODOKAN.source).toMatch(/^bldg_[0-9a-f-]{36}$/);
    expect(KODOKAN.ring.length).toBe(10);
    expect(KODOKAN.room.side).toBe(31.8);
    expect(KODOKAN.room.heading).toBeGreaterThanOrEqual(0);
    expect(KODOKAN.room.heading).toBeLessThan(180);
    // The building's outline is the one OpenStreetMap maps (way 170598646, 8 levels): within a few metres of the point English Wikipedia's infobox gives.
    const [lon, lat] = [KODOKAN.ring.reduce((s, p) => s + p[0], 0) / 10, KODOKAN.ring.reduce((s, p) => s + p[1], 0) / 10];
    expect(Math.abs(lon - 139.7534)).toBeLessThan(0.0004);
    expect(Math.abs(lat - 35.7076)).toBeLessThan(0.0004);
  });

  it("puts the main dojo on the 7th floor, six storeys up, with its room under the roof, the floor 420 jō with four contest areas", () => {
    expect((6 * KODOKAN.height) / KODOKAN.storeys).toBeCloseTo(32.3, 1);
    expect(KODOKAN_FLOOR_HEIGHT).toBeLessThanOrEqual((6 * KODOKAN.height) / KODOKAN.storeys);
    expect(KODOKAN_FLOOR_HEIGHT + KODOKAN_ROOM_HEIGHT).toBeLessThanOrEqual(KODOKAN.height + 1e-9);
    expect(KODOKAN_DOJO.surround).toBe(0);
    expect(KODOKAN_DOJO.areas).toEqual({ across: 2, down: 2 });
    const floor = dojo(KODOKAN_DOJO);
    expect(Math.round(floor.jo)).toBeGreaterThanOrEqual(419);
    expect(Math.round(floor.jo)).toBeLessThanOrEqual(422);
  });

  it("is a member of a district: a hall with its floor in the air, the building it stands in, and the credit", () => {
    expect(isDistrictId("kodokan")).toBe(true);
    expect(DISTRICT_IDS).toContain("kodokan");
    expect(unknownVenues(["kodokan", "nowhere"])).toEqual(["nowhere"]);
    const m = districtMember("kodokan");
    expect(m).toMatchObject({ key: "kodokan", kind: "hall", seats: 900, basis: "building" });
    expect(m.name).toEqual({ en: "Kodokan", ja: "講道館" });
    expect(m.elevation).toBeCloseTo(KODOKAN_FLOOR_HEIGHT * FEET_PER_METRE, 9);
    expect(m.shell).toEqual({ height: KODOKAN.height * FEET_PER_METRE, storeys: 8 });
    expect(m.attribution).toBe(PLATEAU_ATTRIBUTION);
    expect(districtMember("kodokan", "ja").options).toMatchObject({ language: "ja", sport: "dojo" });
    expect(kodokanMember("en").options).toMatchObject({ sport: "dojo", dojo: KODOKAN_DOJO });
    expect(() => districtMember("kodokan:main-dojo")).toThrow(/one configuration/);
    expect(districtMember("tokyo-dome").elevation).toBeUndefined();
  });
});

describe("the Kodokan in a district", () => {
  const model = buildDistrictTurn(ALONE);

  it("stands its room inside the building's outline, whichever way the map is turned", () => {
    for (const turn of [0, 90, 200]) {
      const plan = planDistrict({ ...ALONE, turn });
      const ring = plan.members[0].footprint;
      const m = buildDistrictTurn({ ...ALONE, turn });
      const room = m.planes.filter((p) => p.group === 0 && !p.id.includes("shell-") && p.kind !== "floor");
      expect(room.length).toBeGreaterThan(40);
      for (const p of room) for (const c of corners(p)) expect(inside(ring, [c[0], c[1]]), `${p.id} at turn ${turn}`).toBe(true);
    }
  });

  it("raises every plane of the room and its floor to the 7th floor and no plane below it", () => {
    const lift = KODOKAN_FLOOR_HEIGHT * FEET_PER_METRE;
    const room = model.planes.filter((p) => !p.id.includes("shell-"));
    for (const p of room) for (const c of corners(p)) expect(c[2]).toBeGreaterThanOrEqual(lift - 0.2);
    const floor = model.planes.find((p) => p.id === "m0-floor")!;
    expect(floor.kind).toBe("floor");
    expect(floor.o[2]).toBeCloseTo(lift, 9);
    expect(floor.svg).toContain("ky-dojo");
    expect(floor.svg).toContain("<svg");
    expect(Math.max(...room.flatMap(corners).map((c) => c[2])) / FEET_PER_METRE).toBeLessThanOrEqual(KODOKAN.height + 0.1);
  });

  it("leaves the ground under it bare in 3D and draws the room in the plan", () => {
    expect(model.floor).not.toContain('data-venue="kodokan"');
    expect(model.floor).toContain('data-shell="kodokan"');
    const flat = drawDistrict(ALONE);
    expect(flat).toContain('data-venue="kodokan"');
    expect(flat).toContain("ky-dojo");
  });

  it("draws the building see-through by default (walls that give way from the room outwards, a roof nearly clear), solid or not at all as asked", () => {
    const shell = (m: ReturnType<typeof buildDistrictTurn>) => m.planes.filter((p) => p.id.includes("shell-"));
    const xray = shell(model);
    const walls = xray.filter((p) => p.id.includes("-w"));
    expect(walls.length).toBe(10);
    for (const w of walls) expect(w.shy && Math.hypot(...w.shy)).toBeCloseTo(1, 6);
    for (const w of walls) expect(w).toMatchObject({ fadeTo: 0.06, fadeSide: true });
    const roof = xray.filter((p) => p.id.endsWith("-top"));
    expect(roof.length).toBe(1);
    expect(roof[0]).toMatchObject({ shy: [0, 0], fadeTo: 0.1 });
    expect(Math.max(...xray.flatMap(corners).map((c) => c[2])) / FEET_PER_METRE).toBeCloseTo(KODOKAN.height, 1);
    const solid = shell(buildDistrictTurn({ ...ALONE, building: "solid" }));
    expect(solid.length).toBe(xray.length);
    for (const p of solid) expect(p.shy).toBeUndefined();
    expect(shell(buildDistrictTurn({ ...ALONE, building: "none" }))).toEqual([]);
    expect(drawDistrict({ ...ALONE, building: "none" })).not.toContain("data-shell");
    expect(drawDistrict({ ...ALONE, building: "solid" })).toMatch(/data-shell="kodokan"[^>]*/);
    expect(drawDistrict({ ...ALONE, building: "solid" })).toContain("ky-dist-b2");
    expect(drawDistrict(ALONE)).toContain("ky-dist-ghost");
  });

  it("fades the building's near walls as the eye comes round and looks in, and not the far ones", () => {
    const m = buildDistrictTurn({ ...ALONE, turn: 0 });
    const walls = m.planes.filter((p) => p.id.includes("shell-") && p.id.includes("-w"));
    // The wall nearest the south (down the page) and the wall farthest from it, seen from the south at a low angle.
    const south = walls.reduce((a, b) => (a.shy![1] > b.shy![1] ? a : b));
    const north = walls.reduce((a, b) => (a.shy![1] < b.shy![1] ? a : b));
    const layout = layoutOf(m, { ...m.view, yaw: 0, pitch: 25 }, 1200, 800);
    const at = (p: Plane): number => layout.fade[m.planes.indexOf(p) + 1];
    expect(at(south)).toBeLessThan(0.3);
    expect(at(north)).toBe(1);
  });

  it("shows the dojo through the building at every turn and tilt: no wall that is not faded is drawn over the dojo's floor, and the ones that are not between the eye and it are behind it", () => {
    for (const context of [undefined, [TOKYO_DOME_CITY]]) {
      const m = buildDistrictTurn({ venues: ["kodokan"], ...(context === undefined ? {} : { context }) });
      const [width, height] = [1200, 800];
      const distance = eyeDistance(width, height, m.lens);
      const floor = m.planes.find((p) => p.id === "m0-floor")!;
      const floorAt = m.planes.indexOf(floor);
      const shell = m.planes.map((p, i) => ({ p, i })).filter(({ p }) => p.id.startsWith("m0-shell-"));
      const point = (v: readonly number[], view: typeof m.view, at: Parameters<typeof project>[2]): [number, number] => {
        const r = project([(v[0] - m.centre[0]) * m.scale, (v[1] - m.centre[1]) * m.scale, v[2] * m.scale], view, at, distance);
        return [r[0], r[1]];
      };
      for (const pitch of [12, 25, 35, 55, 75, 88]) {
        for (let yaw = 0; yaw < 360; yaw += 15) {
          const view = { ...m.view, yaw, pitch, zoom: 1 };
          const layout = layoutOf(m, view, width, height);
          // Nine points of the dojo's floor, seen from this side.
          const seen = [0.25, 0.5, 0.75].flatMap((a) => [0.25, 0.5, 0.75].map((b) => point([floor.o[0] + a * floor.u[0] + b * floor.v[0], floor.o[1] + a * floor.u[1] + b * floor.v[1], floor.o[2]], view, layout.at)));
          for (const { p, i } of shell) {
            const outline = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => point([p.o[0] + a * p.u[0] + b * p.v[0], p.o[1] + a * p.u[1] + b * p.v[1], p.o[2] + a * p.u[2] + b * p.v[2]], view, layout.at));
            if (!seen.some((s) => inside(outline, s))) continue;
            const fade = layout.fade[i + 1];
            // Over the floor on the screen: clear enough to see through, or painted before the floor, behind it.
            const clear = fade <= 0.12;
            const behind = layout.stack[i + 1] < layout.stack[floorAt + 1];
            expect(clear || behind, `${p.id} at yaw ${yaw}, pitch ${pitch}: fade ${fade}, stack ${layout.stack[i + 1]} against the floor's ${layout.stack[floorAt + 1]}`).toBe(true);
          }
        }
      }
    }
  });

  it("is a venue like the others: the frame takes in its building, the group order holds, the credit is in the description without any context", () => {
    const plan = planDistrict(TOKYO);
    const ring = plan.members[2].footprint;
    for (const [x, y] of ring) {
      expect(x).toBeGreaterThanOrEqual(plan.view.x);
      expect(x).toBeLessThanOrEqual(plan.view.x + plan.view.w);
      expect(y).toBeGreaterThanOrEqual(plan.view.y);
      expect(y).toBeLessThanOrEqual(plan.view.y + plan.view.h);
    }
    expect(describeDistrict(ALONE).description).toContain("Project PLATEAU");
    expect(describeDistrict({ ...ALONE, language: "ja" }).description).toContain("国土交通省");
    expect(describeDistrict({ venues: ["tokyo-dome"] }).description).not.toContain("PLATEAU");
    const both = buildDistrictTurn(TOKYO);
    for (const yaw of [0, 77, 190, 300]) {
      const layout = layoutOf(both, { ...both.view, yaw }, 1200, 800);
      const stack = layout.stack.slice(1);
      expect(new Set(stack).size).toBe(stack.length);
    }
  });

  it("takes the Kodokan's building out of the context, whatever the building option: the venue draws it", () => {
    const plan = planDistrict(TOKYO);
    const without = planDistrict({ ...TOKYO, venues: ["tokyo-dome", "korakuen-hall"] });
    expect(plan.context!.owned).toBeGreaterThan(without.context!.owned);
    const m = buildDistrictTurn(TOKYO);
    const kodokanWalls = m.planes.filter((p) => p.id.startsWith("m2-shell-"));
    expect(kodokanWalls.length).toBeGreaterThan(10);
    expect(m.planes.some((p) => p.group === APART)).toBe(true);
    const none = buildDistrictTurn({ ...TOKYO, building: "none" });
    expect(none.planes.filter((p) => p.id.startsWith("m2-shell-"))).toEqual([]);
    // Another venue's building (Korakuen Hall's) is still a ghost of the context.
    expect(planDistrict({ ...TOKYO, building: "none" }).context!.blocks.some((b) => b.ghost)).toBe(true);
  });

  it("changes the district's id with the building option and not otherwise", () => {
    expect(districtId({ ...ALONE, building: "solid" })).not.toBe(districtId(ALONE));
    expect(districtId({ ...ALONE, building: "xray" })).not.toBe(districtId({ ...ALONE, building: "solid" }));
    expect(districtId(ALONE)).toBe(districtId({ venues: ["kodokan"] }));
  });
});
