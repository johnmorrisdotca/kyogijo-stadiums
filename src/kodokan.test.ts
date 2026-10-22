import { describe, expect, it } from "vitest";
import { dojo } from "./budo/dojo.api.ts";
import { describeDistrict, districtId, districtMember, drawDistrict, isDistrictId, planDistrict, unknownVenues, DISTRICT_IDS, type DistrictOptions } from "./district.ts";
import { buildDistrictTurn } from "./district.turn.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { KODOKAN, KODOKAN_DOJO, KODOKAN_FLOOR_HEIGHT, KODOKAN_FLOOR_IDS, KODOKAN_FLOORS, KODOKAN_GALLERY_LEVEL, KODOKAN_ROOM_HEIGHT, kodokanLevel, kodokanMember, kodokanSlabLevel } from "./kodokan.ts";
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
    const room = model.planes.filter((p) => !p.id.includes("shell-") && !p.id.includes("slab-s") && !p.id.includes("plate-f"));
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
      for (const pitch of [12, 25, 35, 55, 75, 84, 88]) {
        // Every 15 degrees round, and the angle a reader sent in (yaw -121.5, pitch 84, zoom 0.83) as well.
        for (const yaw of [...Array.from({ length: 24 }, (_, k) => k * 15), 238.5]) {
          const view = { ...m.view, yaw, pitch, zoom: 0.83 };
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

describe("the floors of the Kodokan", () => {
  const F = FEET_PER_METRE;

  it("are the nine of the Kodokan's floor guide, from the basement up, with the counts it gives and the 1st floor from Wikipedia", () => {
    expect(KODOKAN_FLOORS.map((f) => f.floor)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(KODOKAN_FLOORS.map((f) => f.label.en)).toEqual(["B1", "1F", "2F", "3F", "4F", "5F", "6F", "7F", "8F"]);
    const rooms = Object.fromEntries(KODOKAN_FLOORS.filter((f) => f.rooms.length > 0).map((f) => [f.floor, f.rooms.map((r) => `${r.id} ${r.mats ?? "none"}`)]));
    expect(rooms).toEqual({ 5: ["womens 240", "boys 114", "special none"], 6: ["school 240", "international 192"], 7: ["main 420"] });
    expect(KODOKAN_FLOORS.find((f) => f.floor === 5)!.rooms.find((r) => r.id === "special")).toMatchObject({ mats: null, drawn: 40 });
    expect(KODOKAN_FLOORS.filter((f) => f.source === "wikipedia").map((f) => f.floor)).toEqual([1]);
    expect(KODOKAN_FLOORS.find((f) => f.floor === 0)!.drawn).toBe("none");
    expect(KODOKAN_FLOORS.find((f) => f.floor === 8)!.drawn).toBe("gallery");
    for (const f of KODOKAN_FLOORS) expect(f.lists.ja.length).toBeGreaterThan(1);
    expect(KODOKAN_FLOOR_IDS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("put a floor's level at its storeys of the building's own height, and take a floor that is not there as a mistake", () => {
    expect(kodokanLevel(1)).toBe(0);
    expect(kodokanLevel(7)).toBeCloseTo((6 * 43.1) / 8, 9);
    expect(kodokanLevel(6)).toBeCloseTo((5 * 43.1) / 8, 9);
    for (const bad of [-1, 9, 2.5, Number.NaN]) expect(() => kodokanMember("en", bad)).toThrow(/floors 0, 1, 2/);
    expect(kodokanMember("en").parts).toBeUndefined();
    expect(kodokanMember("en").plate).toBeUndefined();
  });

  it("draw the dojos of the 5th and 6th floors at their counts, in the dojo builder's own shape for each", () => {
    for (const [floor, jos] of [[6, [240, 192]], [5, [240, 114, 40]]] as const) {
      const m = kodokanMember("en", floor);
      expect(m.parts!.map((p) => Math.round(dojo((p.options as { dojo: Parameters<typeof dojo>[0] }).dojo).jo))).toEqual(jos);
      for (const p of m.parts!) expect(p.elevation).toBeCloseTo(kodokanLevel(floor) * F, 9);
      expect(m.plate).toEqual({ floor, level: kodokanLevel(floor) * F });
    }
    expect(kodokanMember("en", 7).parts!.map((p) => p.show)).toEqual(["room"]);
    expect(kodokanMember("en", 8).parts!.map((p) => p.show)).toEqual(["gallery"]);
    for (const f of [0, 1, 2, 3, 4]) expect(kodokanMember("en", f).parts).toEqual([]);
    expect(kodokanMember("en", 0).plate).toBeUndefined();
    expect(kodokanMember("en", 4).plate).toEqual({ floor: 4, level: kodokanLevel(4) * F });
  });

  it("stand the rooms of each floor inside the building's outline, none over another, whichever way the map is turned", () => {
    for (const floor of [5, 6]) {
      for (const turn of [0, 90, 200]) {
        const plan = planDistrict({ venues: ["kodokan"], floor, turn });
        const ring = plan.members[0].footprint;
        const m = buildDistrictTurn({ venues: ["kodokan"], floor, turn });
        const rooms = plan.members[0].parts;
        expect(rooms.length).toBe(floor === 6 ? 2 : 3);
        for (const p of m.planes.filter((q) => !q.id.includes("shell-") && !q.id.includes("plate") && q.kind !== "floor")) for (const c of corners(p)) expect(inside(ring, [c[0], c[1]]), `${p.id} on floor ${floor} at turn ${turn}`).toBe(true);
        // Each room's mats as a rectangle on the plan.
        const outline = rooms.map((r) => {
          const d = dojo((r.part.options as { dojo: Parameters<typeof dojo>[0] }).dojo);
          const [w, l] = [d.width * F, d.length * F];
          const a = (r.angle * Math.PI) / 180;
          return [[-w / 2, -l / 2], [w / 2, -l / 2], [w / 2, l / 2], [-w / 2, l / 2]].map(([x, y]): [number, number] => [r.at[0] + x * Math.cos(a) - y * Math.sin(a), r.at[1] + x * Math.sin(a) + y * Math.cos(a)]);
        });
        outline.forEach((a, i) => outline.forEach((b, j) => {
          if (i === j) return;
          for (const p of a) expect(inside(b, p), `room ${i} over room ${j} on floor ${floor}`).toBe(false);
        }));
      }
    }
  });

  it("draw only the chosen floor: its rooms and its plate picked out at its level, and nothing of the other floors", () => {
    for (const floor of [1, 4, 5, 6, 7, 8]) {
      const m = buildDistrictTurn({ venues: ["kodokan"], floor });
      const plate = m.planes.find((p) => p.id === "m0-plate")!;
      // The great dojo's floor is a little under its storey's level, so that the room stays under the roof; the gallery's is that floor and the room's wall height.
      const level = floor === 7 ? KODOKAN_FLOOR_HEIGHT * F : floor === 8 ? KODOKAN_FLOOR_HEIGHT * F + KODOKAN_GALLERY_LEVEL : kodokanLevel(floor) * F;
      expect(plate.o[2]).toBeCloseTo(level, 6);
      expect(plate.svg).toContain("u-floorplate");
      expect(m.planes.some((p) => p.id === "m0-plate-name")).toBe(true);
      const storey = (KODOKAN.height / KODOKAN.storeys) * F;
      for (const p of m.planes.filter((q) => !q.id.includes("shell-") && !q.id.includes("plate-name") && !q.id.includes("plate-s") && !q.id.includes("plate-f"))) {
        for (const c of corners(p)) {
          expect(c[2], `${p.id} on floor ${floor}`).toBeGreaterThanOrEqual(Math.min(level, KODOKAN_FLOOR_HEIGHT * F) - 0.2);
          if (floor !== 7 && floor !== 8) expect(c[2], `${p.id} above floor ${floor}`).toBeLessThanOrEqual(level + storey + 0.2);
        }
      }
    }
    // The 7th floor has the great dojo's room and not its gallery, the 8th the gallery and not the room.
    const seven = buildDistrictTurn({ venues: ["kodokan"], floor: 7 });
    const eight = buildDistrictTurn({ venues: ["kodokan"], floor: 8 });
    const whole = buildDistrictTurn(ALONE);
    const low = (p: Plane): number => Math.min(...corners(p).map((c) => c[2])) - KODOKAN_FLOOR_HEIGHT * F;
    const mine = (m: ReturnType<typeof buildDistrictTurn>): Plane[] => m.planes.filter((p) => !p.id.includes("shell-") && !p.id.includes("plate") && !p.id.includes("slab"));
    for (const p of mine(seven)) expect(low(p)).toBeLessThan(KODOKAN_GALLERY_LEVEL);
    for (const p of mine(eight)) expect(low(p)).toBeGreaterThanOrEqual(KODOKAN_GALLERY_LEVEL - 1e-6);
    expect(mine(seven).length + mine(eight).length).toBeGreaterThanOrEqual(mine(whole).length - 1);
    expect(mine(seven).some((p) => p.id === "m0-floor")).toBe(true);
    expect(mine(eight).some((p) => p.id === "m0-floor")).toBe(false);
    // The basement is under the ground: no plate and no room.
    const basement = buildDistrictTurn({ venues: ["kodokan"], floor: 0 });
    expect(basement.planes.every((p) => p.id.includes("shell-") || p.id.includes("plate-f"))).toBe(true);
    // A plate-only floor has no room.
    expect(buildDistrictTurn({ venues: ["kodokan"], floor: 3 }).planes.filter((p) => !p.id.includes("shell-") && !p.id.includes("plate") && !p.id.includes("slab")).length).toBe(0);
  });

  it("draw the plate of a floor under the rooms that stand on it, at every turn and tilt", () => {
    for (const floor of [5, 6, 7]) {
      const m = buildDistrictTurn({ venues: ["kodokan"], floor });
      const plate = m.planes.findIndex((p) => p.id === "m0-plate");
      const rooms = m.planes.map((p, i) => ({ p, i })).filter(({ p }) => p.kind === "floor" && p.id.endsWith("-floor"));
      expect(rooms.length).toBeGreaterThan(0);
      for (const pitch of [15, 40, 85]) {
        for (let yaw = 0; yaw < 360; yaw += 20) {
          const layout = layoutOf(m, { ...m.view, yaw, pitch, zoom: 1 }, 1200, 800);
          for (const { p, i } of rooms) expect(layout.stack[plate + 1], `${p.id} on floor ${floor} at yaw ${yaw}, pitch ${pitch}`).toBeLessThan(layout.stack[i + 1]);
        }
      }
    }
  });

  it("draw every floor as a slab with an edge, never a sheet: sides shaded by the way they face, thick enough to see from any side", () => {
    const F2 = FEET_PER_METRE;
    const sideHeight = (p: Plane): number => Math.hypot(...p.v);
    const pixels = (m: ReturnType<typeof buildDistrictTurn>): number => 1000 / Math.max(m.viewBox.w, m.viewBox.h);
    // The great dojo's floor, seen with every floor: a slab round its mats, with four sides at least ten pixels thick at the page's own size and not more than half a storey.
    const whole = buildDistrictTurn(ALONE);
    const sides = whole.planes.filter((p) => p.id.startsWith("m0-slab-s"));
    expect(sides.length).toBe(4);
    for (const p of sides) {
      expect(sideHeight(p) * pixels(whole)).toBeGreaterThanOrEqual(9.99);
      expect(sideHeight(p)).toBeLessThanOrEqual(0.5 * (KODOKAN.height / KODOKAN.storeys) * F2 + 1e-9);
      expect(p.o[2]).toBeCloseTo(KODOKAN_FLOOR_HEIGHT * F2, 6);
      expect(p.o[2] + p.v[2]).toBeLessThan(KODOKAN_FLOOR_HEIGHT * F2);
      expect(p.svg).toMatch(/class="u-slab u-slab-[abc]"/);
    }
    expect(whole.planes.some((p) => p.id === "m0-slab-top")).toBe(false);
    // The other storeys are faint slabs, and the 7th is the dojo's own.
    const faint = (m: ReturnType<typeof buildDistrictTurn>, n: number) => m.planes.filter((p) => p.id.startsWith(`m0-plate-f${n}-`));
    for (const n of [1, 2, 3, 4, 5, 6, 8]) {
      const planes = faint(whole, n);
      expect(planes.length, `floor ${n}`).toBeGreaterThan(10);
      for (const p of planes) expect(p).toMatchObject({ shy: [0, 0], fadeTo: 0.18 });
      expect(planes.find((p) => p.id.endsWith("-top"))!.o[2]).toBeCloseTo(kodokanSlabLevel(n) * F2, 6);
    }
    expect(faint(whole, 7)).toEqual([]);
    // A chosen floor: its plate with sides all round, solid; the other storeys faint; the 7th floor then faint too.
    const six = buildDistrictTurn({ venues: ["kodokan"], floor: 6 });
    expect(six.planes.filter((p) => p.id.startsWith("m0-plate-s")).length).toBe(10);
    for (const p of six.planes.filter((q) => q.id.startsWith("m0-plate-s"))) {
      expect(p.shy).toBeUndefined();
      expect(sideHeight(p) * pixels(six)).toBeGreaterThanOrEqual(9.99);
    }
    expect(faint(six, 6)).toEqual([]);
    expect(faint(six, 7).length).toBeGreaterThan(10);
    // A building left out has no storey slabs, a solid one hides them; the dojo's own slab stays.
    expect(buildDistrictTurn({ ...ALONE, building: "none" }).planes.some((p) => p.id.includes("plate-f"))).toBe(false);
    expect(buildDistrictTurn({ ...ALONE, building: "none" }).planes.filter((p) => p.id.startsWith("m0-slab-s")).length).toBe(4);
    expect(buildDistrictTurn({ ...ALONE, building: "solid" }).planes.some((p) => p.id.includes("plate-f"))).toBe(false);
    // The plate of a floor is under the room whatever the thickness, and the thickness is the same everywhere in a view.
    expect(new Set(sides.map((p) => Math.round(sideHeight(p) * 1000))).size).toBe(1);
  });

  it("show the chosen floor in the plan, picked out, and keep the other choices as they were", () => {
    const flat = drawDistrict({ venues: ["kodokan"], floor: 6 });
    expect(flat).toContain('data-floor="6"');
    expect(flat).toContain("ky-dist-floor");
    expect((flat.match(/data-venue="kodokan"/g) ?? []).length).toBe(2);
    expect(flat).toContain('data-part="international"');
    expect(drawDistrict({ venues: ["kodokan"], floor: 3 })).not.toContain('data-venue="kodokan"');
    expect(drawDistrict(ALONE)).not.toContain("data-floor");
    expect(districtId({ ...ALONE, floor: 6 })).not.toBe(districtId(ALONE));
    expect(districtId({ ...ALONE, floor: 6 })).not.toBe(districtId({ ...ALONE, floor: 5 }));
    // The same building: the credit, the frame, the building option.
    expect(describeDistrict({ ...ALONE, floor: 6 }).description).toContain("Project PLATEAU");
    expect(planDistrict({ ...ALONE, floor: 6 }).view).toEqual(planDistrict(ALONE).view);
    expect(buildDistrictTurn({ ...ALONE, floor: 6, building: "none" }).planes.filter((p) => p.id.includes("shell-")).length).toBe(0);
    expect(buildDistrictTurn({ ...ALONE, floor: 6 }).planes.filter((p) => p.id.includes("shell-")).length).toBeGreaterThan(10);
  });

  it("show the chosen floor through the building at every turn and tilt, as the great dojo is", () => {
    for (const floor of [5, 6, 7]) {
      const m = buildDistrictTurn({ venues: ["kodokan"], floor });
      const [width, height] = [1200, 800];
      const distance = eyeDistance(width, height, m.lens);
      const floors = m.planes.map((p, i) => ({ p, i })).filter(({ p }) => p.kind === "floor" && p.id.endsWith("-floor"));
      expect(floors.length).toBeGreaterThan(0);
      const shell = m.planes.map((p, i) => ({ p, i })).filter(({ p }) => p.id.startsWith("m0-shell-"));
      const point = (v: readonly number[], view: typeof m.view, at: Parameters<typeof project>[2]): [number, number] => {
        const r = project([(v[0] - m.centre[0]) * m.scale, (v[1] - m.centre[1]) * m.scale, v[2] * m.scale], view, at, distance);
        return [r[0], r[1]];
      };
      for (const pitch of [15, 35, 75]) {
        for (let yaw = 0; yaw < 360; yaw += 30) {
          const view = { ...m.view, yaw, pitch, zoom: 1 };
          const layout = layoutOf(m, view, width, height);
          for (const { p: room, i: at } of floors) {
            // The middle of the room's mats, in the rooms' own floor plane (a point that is mats, not wall).
            const mid = (a: number, b: number) => [room.o[0] + a * room.u[0] + b * room.v[0], room.o[1] + a * room.u[1] + b * room.v[1], room.o[2]];
            const seen = [0.45, 0.5, 0.55].map((a) => point(mid(a, 0.5), view, layout.at));
            for (const { p, i } of shell) {
              const outline = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => point([p.o[0] + a * p.u[0] + b * p.v[0], p.o[1] + a * p.u[1] + b * p.v[1], p.o[2] + a * p.u[2] + b * p.v[2]], view, layout.at));
              if (!seen.some((s) => inside(outline, s))) continue;
              expect(layout.fade[i + 1] <= 0.12 || layout.stack[i + 1] < layout.stack[at + 1], `${p.id} over ${room.id} at yaw ${yaw}, pitch ${pitch}, floor ${floor}`).toBe(true);
            }
          }
        }
      }
    }
  });
});
