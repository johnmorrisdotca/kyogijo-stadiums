import { describe, expect, it } from "vitest";
import { crowdStands, drawKyogijo } from "./draw.ts";
import { dojoRoom } from "./budo/room.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { buildTurn, layoutOf, planesOf, turnMarkup, uprightsFor, type Plane, type Upright } from "./turn-entry.ts";
import { fadeOf } from "./turn.kit.ts";
import { areaOf, clipAround, clipConvex, clipOutside, clipSegment, raked, slopeOf, stripsOf, tidy } from "./venue.geom.ts";
import type { Pt } from "./crowd.ts";
import type { SurfaceOptions } from "./types.ts";

const venue = { id: "t" } as const;
const raise = (o: SurfaceOptions, extra: { roof?: boolean; detail?: "low" | "auto" | "high" } = {}) => uprightsFor(o, { venue: { ...venue, ...extra } });
const item = (items: Upright[], kind: string): Upright => items.find((i) => i.kind === kind)!;
/** The corners of a plane in the scene, in feet. */
const corners = (p: Plane): [number, number, number][] => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => [p.o[0] + a * p.u[0] + b * p.v[0], p.o[1] + a * p.u[1] + b * p.v[1], p.o[2] + a * p.u[2] + b * p.v[2]]);
const zRange = (planes: readonly Plane[]): [number, number] => {
  const zs = planes.flatMap((p) => corners(p).map((c) => c[2]));
  return [Math.min(...zs), Math.max(...zs)];
};
const tags = (html: string): number => (html.match(/<[a-z]/g) ?? []).length;

describe("the geometry of a ring of stands", () => {
  const rrect = (x0: number, y0: number, x1: number, y1: number, r: number) => ({ kind: "rrect", x0, y0, x1, y1, r }) as const;

  it("cuts a rounded rectangle into quads of one length on both edges, the area of the band", () => {
    const outer = rrect(-100, -80, 300, 200, 90);
    const inner = rrect(-30, -10, 230, 130, 20);
    const areas: number[] = [];
    for (const cut of ["low", "auto", "high"] as const) {
      const [strip] = stripsOf(outer, inner, [], cut);
      expect(strip.inner.length).toBe(strip.outer.length);
      let area = 0;
      for (let i = 0; i + 1 < strip.inner.length; i += 1) area += Math.abs(areaOf(tidy([strip.inner[i], strip.inner[i + 1], strip.outer[i + 1], strip.outer[i]])));
      // The facets of an arc lie inside it, so the sum is a little under the band's own area.
      const exact = 400 * 280 - (4 - Math.PI) * 90 * 90 - (260 * 140 - (4 - Math.PI) * 20 * 20);
      expect(area).toBeLessThan(exact);
      expect(area).toBeGreaterThan(exact * (cut === "low" ? 0.85 : cut === "auto" ? 0.95 : 0.98));
      areas.push(area);
    }
    // The finer the cut, the nearer the arcs.
    expect(areas[0]).toBeLessThan(areas[1]);
    expect(areas[1]).toBeLessThan(areas[2]);
  });

  it("cuts an oval and a polygon the same way", () => {
    const [oval] = stripsOf({ kind: "ellipse", cx: 0, cy: 0, rx: 200, ry: 120 }, { kind: "ellipse", cx: 0, cy: 0, rx: 140, ry: 70 }, [], "auto");
    expect(oval.inner.length).toBe(oval.outer.length);
    expect(oval.inner[0]).toEqual(oval.inner[oval.inner.length - 1]);
    const [poly] = stripsOf({ kind: "poly", points: [[0, 0], [10, 0], [20, 5], [20, 25], [10, 20], [0, 20]] }, null, [], "auto");
    expect(poly.inner).toEqual([[0, 0], [10, 0], [20, 5]]);
    expect(poly.outer).toEqual([[0, 20], [10, 20], [20, 25]]);
  });

  it("takes a box out of a polygon without losing or gaining any of the rest", () => {
    const square: Pt[] = [[0, 0], [100, 0], [100, 100], [0, 100]];
    const left = clipOutside(square, [-10, -10, 30, 110]);
    expect(left.reduce((sum, p) => sum + Math.abs(areaOf(p)), 0)).toBeCloseTo(7000, 3);
    const hole = clipOutside(square, [20, 20, 60, 60]);
    expect(hole.reduce((sum, p) => sum + Math.abs(areaOf(p)), 0)).toBeCloseTo(10000 - 1600, 3);
    expect(clipOutside(square, [-5, -5, 105, 105])).toEqual([]);
    expect(clipAround(square, [[-10, -10, 30, 110], [70, -10, 110, 110]]).reduce((sum, p) => sum + Math.abs(areaOf(p)), 0)).toBeCloseTo(4000, 3);
  });

  it("clips a polygon and a segment to a convex one", () => {
    const clip: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const part = clipConvex([[5, 5], [15, 5], [15, 15], [5, 15]], clip);
    expect(Math.abs(areaOf(tidy(part)))).toBeCloseTo(25, 6);
    expect(clipSegment([-5, 5], [15, 5], clip)).toEqual([[0, 5], [10, 5]]);
    expect(clipSegment([-5, 20], [15, 20], clip)).toBeUndefined();
  });

  it("makes a raked plane of a quad whose corners lie on the slope", () => {
    const quad: [Pt, Pt, Pt, Pt] = [[0, 0], [40, 0], [40, 30], [0, 30]];
    const s = slopeOf(quad, 5, 35)!;
    expect(s.out[0]).toBeCloseTo(0, 9);
    expect(s.out[1]).toBeCloseTo(1, 9);
    const p = raked("r", "seats", quad, s.slope, s.along, () => "")!;
    const zs = corners(p).map((c) => Math.round(c[2] * 1000) / 1000).sort((a, b) => a - b);
    expect(zs).toEqual([5, 5, 35, 35]);
    // A rake of 45 degrees: 30 feet up in 30 across.
    expect(Math.atan2(p.v[2], Math.hypot(p.v[0], p.v[1])) * (180 / Math.PI)).toBeCloseTo(45, 3);
    // The plane's own x runs along the band.
    expect(Math.abs(p.u[0]) / Math.hypot(...p.u)).toBeCloseTo(1, 6);
  });
});

describe("the stands raised round a pitch", () => {
  const options: SurfaceOptions = { sport: "soccer", crowd: true };
  const stands = crowdStands(options)!;
  const raised = raise(options);
  const seats = item(raised.items, "stands");

  it("has a tier of raked planes for each ring, first row to last row at the heights the data gives", () => {
    for (const ring of stands.rings) {
      const mine = seats.planes.filter((p) => p.id.startsWith(`${ring.id}-`) && p.kind === "seats");
      expect(mine.length, ring.id).toBeGreaterThanOrEqual(12);
      const [low, high] = zRange(mine);
      expect(low, ring.id).toBeCloseTo(ring.height[0], 3);
      expect(high, ring.id).toBeCloseTo(ring.height[1], 3);
    }
    expect(seats.height).toBeCloseTo(Math.max(...stands.rings.map((r) => r.height[1])), 3);
  });

  it("rakes each straight side at the ring's own angle", () => {
    for (const ring of stands.rings) {
      const long = seats.planes.filter((p) => p.id.startsWith(`${ring.id}-`) && p.kind === "seats").sort((a, b) => Math.hypot(...b.u) - Math.hypot(...a.u))[0];
      const angle = Math.abs(Math.atan2(long.v[2], Math.hypot(long.v[0], long.v[1])) * (180 / Math.PI));
      expect(angle, ring.id).toBeCloseTo(ring.rake, 0);
    }
  });

  it("stands the walks between the tiers on the lower tier's top and the upper's first row, and a low wall under the first", () => {
    const walk = seats.planes.filter((p) => p.kind === "concourse");
    expect(walk.length).toBeGreaterThanOrEqual(12);
    const [low, high] = zRange(walk);
    expect(low).toBeCloseTo(stands.rings[0].height[1], 3);
    expect(high).toBeCloseTo(stands.rings[1].height[0], 3);
    const fascia = seats.planes.filter((p) => p.kind === "fascia");
    expect(fascia.length).toBeGreaterThan(8);
    const [floor, top] = zRange(fascia);
    expect(floor).toBe(0);
    expect(top).toBeCloseTo(stands.rings[0].height[0], 3);
  });

  it("faces every plane away from the surface, so that the near ones can give way to the eye", () => {
    const centre = [stands.box.x + stands.box.w / 2, stands.box.y + stands.box.h / 2];
    for (const p of seats.planes) {
      expect(p.shy, p.id).toBeDefined();
      const middle = [p.o[0] + (p.u[0] + p.v[0]) / 2, p.o[1] + (p.u[1] + p.v[1]) / 2];
      expect(p.shy![0] * (middle[0] - centre[0]) + p.shy![1] * (middle[1] - centre[1]), p.id).toBeGreaterThan(0);
    }
    const model = buildTurn(options, { preset: "corner" });
    const near = model.planes.filter((p) => p.kind === "seats" && fadeOf(p, -38, 70) < 0.2);
    const far = model.planes.filter((p) => p.kind === "seats" && fadeOf(p, -38, 70) === 1);
    expect(near.length).toBeGreaterThan(8);
    expect(far.length).toBeGreaterThan(8);
    // Straight overhead nothing is cut away, and from the other side the others are.
    expect(model.planes.every((p) => fadeOf(p, 0, 0) === 1)).toBe(true);
    const behind = model.planes.filter((p) => p.kind === "seats" && fadeOf(p, 142, 70) < 0.2);
    expect(behind.length).toBeGreaterThan(8);
    expect(behind.some((p) => near.includes(p))).toBe(false);
    // The layout writes them as an opacity.
    const layout = layoutOf(model, model.view, 960, 600);
    expect(layout.fade.filter((f) => f < 0.2).length).toBeGreaterThanOrEqual(near.length);
  });

  it("leaves out the places the stands are left open: the ends of two sides, the open end of a horseshoe", () => {
    const sides = crowdStands({ sport: "soccer", crowd: { shape: "sides" } })!;
    const planes = item(raise({ sport: "soccer", crowd: { shape: "sides" } }).items, "stands").planes.filter((p) => p.kind === "seats");
    expect(planes.length).toBeGreaterThan(0);
    for (const p of planes) {
      const mx = p.o[0] + (p.u[0] + p.v[0]) / 2;
      const my = p.o[1] + (p.u[1] + p.v[1]) / 2;
      expect(sides.covers.some(([x0, y0, x1, y1]) => mx > x0 + 1 && mx < x1 - 1 && my > y0 && my < y1), p.id).toBe(false);
    }
    const full = planesOf(raised).filter((p) => p.kind === "seats").length;
    expect(planes.length).toBeLessThan(full);
    const horseshoe = crowdStands({ sport: "nhl", crowd: { shape: "horseshoe" } })!;
    for (const p of item(raise({ sport: "nhl", crowd: { shape: "horseshoe" } }).items, "stands").planes.filter((q) => q.kind === "seats")) {
      const mx = p.o[0] + (p.u[0] + p.v[0]) / 2;
      expect(horseshoe.covers.some(([x0, , x1]) => mx > x0 + 1 && mx < x1 - 1), p.id).toBe(false);
    }
  });

  it("textures a plane with the crowd's pattern, its visitors' block and its aisles, all read by id from one set of patterns", () => {
    expect(raised.defs).toContain("t-v-cr-h");
    expect(raised.defs).toContain("t-v-cr-a");
    expect(raised.defs).toContain("ky-cr-row");
    const svg = seats.planes.map((p) => p.svg).join("");
    expect(svg).toContain("url(#t-v-cr-h)");
    expect(svg).toContain("url(#t-v-cr-a)");
    expect(svg).toContain("ky-cr-aisle");
    for (const [, id] of svg.matchAll(/url\(#([^)]+)\)/g)) expect(raised.defs).toContain(`id="${id}"`);
    // The tifo has its own pattern.
    expect(raise({ sport: "soccer", crowd: { tifo: "home" } }).defs).toContain("t-v-cr-th");
    // Plain detail is blocks of colour and no patterns.
    const plain = raise({ sport: "soccer", crowd: { detail: "plain" } });
    expect(plain.defs ?? "").toBe("");
    expect(item(plain.items, "stands").planes.map((p) => p.svg).join("")).toContain("u-blk");
  });

  it("adds a roof over the top tier on request: a canopy in the open, a lid over a hall, none where the crowd says no", () => {
    expect(raised.items.some((i) => i.kind === "roof")).toBe(false);
    const roofed = raise(options, { roof: true });
    const roof = item(roofed.items, "roof");
    expect(roof.planes.length).toBeGreaterThanOrEqual(12);
    const top = Math.max(...stands.rings.map((r) => r.height[1]));
    expect(zRange(roof.planes)[0]).toBeGreaterThan(top);
    expect(roof.planes.every((p) => p.shy !== undefined)).toBe(true);
    // The canopy's inner edge drops; a hall's lid rises.
    const hall = item(raise({ sport: "nhl", crowd: true }, { roof: true }).items, "roof");
    const nhlTop = Math.max(...crowdStands({ sport: "nhl", crowd: true })!.rings.map((r) => r.height[1]));
    expect(zRange(hall.planes)[1]).toBeGreaterThan(nhlTop + 40);
    expect(raise({ sport: "soccer", crowd: { roof: false } }, { roof: true }).items.some((i) => i.kind === "roof")).toBe(false);
  });

  it("lifts the stands with a surface that stands over the ground", () => {
    const sumo = raise({ sport: "sumo", crowd: true });
    const ring = crowdStands({ sport: "sumo", crowd: true })!.rings[0];
    const lift = uprightsFor({ sport: "sumo" }).lift;
    expect(lift).toBeGreaterThan(0.5);
    expect(zRange(item(sumo.items, "stands").planes.filter((p) => p.kind === "seats" && p.id.startsWith(`${ring.id}-`)))[0]).toBeCloseTo(lift + ring.height[0], 3);
  });
});

describe("a ballpark's stands", () => {
  const options: SurfaceOptions = { sport: "mlb", park: "fenway-park", crowd: true };

  it("raises the grandstands and the bleachers, and the seats on top of the Green Monster at its wall's height", () => {
    const built = raise(options);
    const stands = crowdStands(options)!;
    expect(item(built.items, "stands").planes.filter((p) => p.id.startsWith("lower-")).length).toBeGreaterThan(12);
    expect(item(built.items, "stands").planes.some((p) => p.id.startsWith("bleachers-"))).toBe(true);
    const seats = item(built.items, "wall-seats");
    const ring = stands.rings.find((r) => r.tier === "wall")!;
    expect(zRange(seats.planes)[0]).toBeCloseTo(ring.height[0], 3);
    expect(zRange(seats.planes)[1]).toBeCloseTo(ring.height[1], 3);
    // The wall under them is the fence's own, as high as the seats start (37 feet 2 inches).
    const fence = item(built.items, "fence");
    expect(Math.max(...zRange(fence.planes))).toBeCloseTo(ring.height[0], 2);
    expect(ring.height[0]).toBeCloseTo(37.167, 2);
  });

  it("leaves a gap at the batter's eye", () => {
    const planes = item(raise(options).items, "stands").planes.filter((p) => p.id.startsWith("bleachers-"));
    const eye = planes.filter((p) => Math.abs(p.o[0] + (p.u[0] + p.v[0]) / 2) < 6);
    expect(eye.length).toBe(0);
  });
});

describe("a dojo's room", () => {
  const options: SurfaceOptions = { sport: "dojo", dojo: { jo: 20, dais: true, banner: true, balcony: true, kamiza: "north" } };
  const room = dojoRoom(options)!;
  const built = raise(options);

  it("raises its walls with the doors and windows drawn in them, at the heights the room gives", () => {
    const walls = item(built.items, "walls");
    expect(walls.planes.length).toBe(room.walls.length);
    // A dojo with a gallery is a storey high: its walls are as high as the gallery's floor (4.5 m, ours); one with none has walls of 3 m.
    expect(walls.height).toBeCloseTo(4.5 / 0.3048, 3);
    expect(room.walls.every((w) => w.height === 4.5)).toBe(true);
    expect(item(raise({ sport: "dojo", dojo: { jo: 20, dais: true } }).items, "walls").height).toBeCloseTo(3 / 0.3048, 3);
    expect(built.items.filter((i) => i.kind === "walls").length).toBe(1);
    const doors = walls.planes.map((p) => p.svg).join("").match(/u-door/g) ?? [];
    expect(doors.length).toBe(room.doors.length);
  });

  it("stands the dais, the banner and the shrine on the floor", () => {
    const dais = item(built.items, "dais");
    expect(zRange(dais.planes)[1]).toBeCloseTo(room.platforms[0].height / 0.3048, 3);
    expect(dais.planes.length).toBe(5);
    const banner = item(built.items, "banner");
    const [bottom, top] = zRange(banner.planes);
    expect(bottom).toBeCloseTo(room.banners[0].bottom / 0.3048, 3);
    expect(top).toBeCloseTo(room.banners[0].top / 0.3048, 3);
    const shrined = raise({ sport: "dojo", dojo: { jo: 20, shinzen: true } });
    expect(shrined.items.some((i) => i.kind === "shrine")).toBe(true);
  });

  it("raises the balconies as steps: a tread of seats to each row, from a step over the gallery's floor up to the last row's height, with a rail in front", () => {
    const gallery = item(built.items, "gallery");
    const b = room.balconies[0];
    const seats = gallery.planes.filter((p) => p.kind === "seats");
    expect(seats.length).toBe(room.balconies.length * b.rows);
    const [low, high] = zRange(seats);
    expect(low).toBeCloseTo((b.height + b.rowRise) / 0.3048, 3);
    expect(high).toBeCloseTo((b.height + b.rows * b.rowRise) / 0.3048, 3);
    expect(gallery.height).toBeCloseTo((b.height + b.rows * b.rowRise) / 0.3048, 3);
    // Each tread is flat, a row deep, and has a riser of one row's rise under its front edge.
    const tread = seats.find((p) => p.id === "gallery-north-2")!;
    expect(tread.u[2]).toBe(0);
    expect(tread.v[2]).toBe(0);
    expect(Math.abs(tread.v[1])).toBeCloseTo(b.depth / b.rows / 0.3048, 3);
    const risers = gallery.planes.filter((p) => p.id.startsWith("gallery-north-riser"));
    expect(risers.length).toBe(b.rows);
    expect(zRange(risers)[0]).toBeCloseTo(b.height / 0.3048, 3);
    // The rail stands on the gallery's floor, a metre high, along the edge nearest the room.
    const rail = gallery.planes.find((p) => p.id === "rail-north")!;
    expect(zRange([rail])[0]).toBeCloseTo(b.height / 0.3048, 3);
    expect(zRange([rail])[1] - zRange([rail])[0]).toBeCloseTo(b.rail / 0.3048, 3);
    expect(gallery.planes.filter((p) => p.kind === "rail").length).toBe(room.balconies.length);
    // The gallery's floor is level with the top of the walls, a storey up: it overlooks the floor over them.
    expect(item(built.items, "walls").height).toBeCloseTo(b.height / 0.3048, 3);
    expect(b.height).toBeGreaterThanOrEqual(4);
    expect(b.height).toBeLessThanOrEqual(5);
    expect(built.reach).toBeGreaterThan(0);
  });

  it("is a proper balcony: a floor slab projecting over the room, rows of seats read as seats, and a white rail on the slab's edge", () => {
    const gallery = item(built.items, "gallery");
    const b = room.balconies[0];
    const slab = gallery.planes.find((p) => p.id === "gallery-north-slab")!;
    expect(slab.kind).toBe("platform");
    expect(zRange([slab])).toEqual([b.height / 0.3048, b.height / 0.3048]);
    // Its edge is the wall's thickness and half a metre in front of the first row, with the slab's own thickness showing under it.
    const edge = gallery.planes.find((p) => p.id === "gallery-north-slab-edge")!;
    const first = gallery.planes.find((p) => p.id === "gallery-north-1")!;
    expect(Math.abs(edge.o[1] - first.o[1])).toBeCloseTo((room.walls[0].thickness + 0.5) / 0.3048, 6);
    expect(zRange([edge])[1] - zRange([edge])[0]).toBeCloseTo(0.35 / 0.3048, 6);
    const rail = gallery.planes.find((p) => p.id === "rail-north")!;
    expect(rail.o[1]).toBeCloseTo(edge.o[1], 6);
    expect(rail.svg).toContain("u-railline");
    // Three or four tiers, each with the tile of seats (a cushion and its back, a seat every 0.6 m).
    expect(b.rows).toBeGreaterThanOrEqual(3);
    expect(b.rows).toBeLessThanOrEqual(4);
    expect(built.defs).toContain('id="t-v-north-seat"');
    expect(built.defs).toContain("u-seatcush");
    expect(first.svg).toContain("url(#t-v-north-seat)");
  });

  it("panels the walls under a gallery in honey wood, the others cream over a wainscot, and gives way to the eye down to a hundredth", () => {
    const walls = item(built.items, "walls");
    for (const p of walls.planes) {
      expect(p.svg).toContain("u-wainscot");
      expect(p.svg).toContain("u-panel");
      expect(p.svg).not.toContain("u-room");
      expect(p.fadeTo).toBe(0.01);
    }
    // A dojo with no gallery has a cream wall over a wainscot of wood a belt high.
    const plain = item(raise({ sport: "dojo", dojo: { jo: 20, dais: true } }).items, "walls");
    for (const p of plain.planes) {
      expect(p.svg).toContain("u-room");
      expect(p.svg).toContain("u-wainscot");
    }
    // Cut away altogether, a plane of the room is a hundredth left; a wall of a rink is still 0.08.
    const north = walls.planes.find((p) => p.id === "wall-north")!;
    expect(fadeOf(north, 180, 70)).toBe(0.01);
    expect(fadeOf({ shy: [0, -1] }, 180, 70)).toBe(0.08);
    expect(fadeOf(north, 0, 0)).toBe(1);
    for (const p of item(built.items, "gallery").planes) expect(p.shy, p.id).toBeDefined();
  });

  it("has the kamiza on its wall: an alcove of darker wood with a white-framed shrine and a scroll, a plain purple banner beside it, and a clock and doors on the wall above the seats", () => {
    const north = item(built.items, "walls").planes.find((p) => p.id === "wall-north")!;
    for (const part of ["u-alcove", "u-frame", "u-shrinef", "u-scroll", "u-purple"]) expect(north.svg, part).toContain(part);
    // No emblem on the purple banner: a plain rectangle.
    expect(/<rect class="u-purple"[^>]*\/>/.test(north.svg)).toBe(true);
    const upper = item(built.items, "gallery").planes.find((p) => p.id === "gallery-back-north")!;
    expect(upper.svg).toContain("u-clockface");
    expect((upper.svg.match(/u-door/g) ?? []).length).toBe(2);
    expect(upper.svg).toContain("u-room");
    expect(item(built.items, "gallery").planes.find((p) => p.id === "gallery-back-south")!.svg).not.toContain("u-clockface");
  });

  it("paints the room in the look of the floor, which is the drawing's own: the Kodokan's main dojo has pale yellow contest areas on green", () => {
    const kodokan: SurfaceOptions = { sport: "dojo", dojo: { mats: { width: 26.4, length: 26.4 }, surround: 1, areas: { across: 2, down: 2 }, dais: true, banner: true, balcony: true, kamiza: "north", eras: [{ name: "earlier", nameJa: "以前", from: null, to: null, look: "green-orange", outline: true }, { name: "current", nameJa: "現在", from: null, to: null, look: "yellow-green" }] } };
    const model = buildTurn(kodokan);
    expect(model.look).toEqual({ sport: "dojo", look: "yellow-green" });
    expect(model.floor).toBe(drawKyogijo(model.options));
    expect(turnMarkup(kodokan)).toContain('class="ky-turn-world kyogijo" data-sport="dojo" data-look="yellow-green"');
    expect(turnMarkup({ sport: "soccer" })).toContain('<div class="ky-turn-world">');
    expect(buildTurn({ sport: "dojo", theme: "dark" } as SurfaceOptions).look).toEqual({ sport: "dojo", look: "green-beige" });
  });

  it("puts the walls far out, with wood between them and the mats, in the Kodokan's main dojo", () => {
    const kodokan: SurfaceOptions = { sport: "dojo", dojo: { mats: { width: 26.4, length: 26.4 }, surround: 4, areas: { across: 2, down: 2 }, dais: true, banner: true, balcony: true, kamiza: "north" } };
    const r = dojoRoom(kodokan)!;
    expect(r.surround!.width).toBe(4);
    // The walls stand 4 m beyond the mats on every side.
    const north = r.walls.find((w) => w.side === "north")!;
    expect(r.floor.y0 - north.from[1]).toBeCloseTo(4 + north.thickness / 2, 6);
    // The balconies lie beyond the walls, so that the seats are in the upper gallery and not at the mats.
    for (const b of r.balconies) expect(b.height).toBeGreaterThanOrEqual(4);
    expect(r.balconies.every((b) => (b.side === "north" ? r.floor.y0 - b.box.y1 : b.side === "south" ? b.box.y0 - r.floor.y1 : b.side === "west" ? r.floor.x0 - b.box.x1 : b.box.x0 - r.floor.x1) >= 4)).toBe(true);
    expect(r.notes.join(" ")).toContain("(ours)");
  });

  it("has large windows high in the wall behind the gallery on one side, and a pale ceiling over the galleries on request", () => {
    expect(room.upperWindows.length).toBe(3);
    expect(new Set(room.upperWindows.map((w) => w.side))).toEqual(new Set(["east"]));
    expect(room.ceiling!.height).toBeGreaterThan(room.balconies[0].height + room.balconies[0].rows * room.balconies[0].rowRise);
    const back = item(built.items, "gallery").planes.find((p) => p.id === "gallery-back-east")!;
    expect((back.svg.match(/u-window/g) ?? []).length).toBe(3);
    expect(item(built.items, "gallery").planes.find((p) => p.id === "gallery-back-north")!.svg).not.toContain("u-window");
    expect(built.items.some((i) => i.kind === "roof")).toBe(false);
    const roofed = raise(options, { roof: true });
    const ceiling = item(roofed.items, "roof");
    expect(ceiling.planes.length).toBe(room.balconies.length);
    expect(zRange(ceiling.planes)[0]).toBeCloseTo(room.ceiling!.height / 0.3048, 3);
    expect(ceiling.planes.every((p) => p.shy !== undefined && p.svg.includes("u-ceiling"))).toBe(true);
  });

  it("has plain empty seats in three rows, in blocks of 5, 8, 8, 8 and 5 seats with an aisle between them, and a crowd only when one is asked for", () => {
    const kodokan: SurfaceOptions = { sport: "dojo", dojo: { mats: { width: 26.4, length: 26.4 }, surround: 4, balcony: { rows: 3, sections: [5, 8, 8, 8, 5] }, dais: true, banner: true, kamiza: "north" }, crowd: true };
    const r = dojoRoom(kodokan)!;
    for (const b of r.balconies) {
      expect(b.rows).toBe(3);
      expect(b.sections).toEqual([5, 8, 8, 8, 5]);
      expect(b.sectionsBasis).toBe("given");
      expect(b.sections.reduce((a, k) => a + k, 0)).toBe(34);
      const length = b.side === "north" || b.side === "south" ? b.box.x1 - b.box.x0 : b.box.y1 - b.box.y0;
      // The seats and the four aisles of 1.2 m fill the side.
      expect(b.seatWidth * 34 + 4 * b.aisle).toBeCloseTo(length, 6);
      expect(b.aisles).toHaveLength(4);
      expect(b.aisles[0]).toBeCloseTo((5 * b.seatWidth + b.aisle / 2) / length, 6);
    }
    // Without sections the blocks are cut by us, about 9 m long.
    expect(dojoRoom({ sport: "dojo", dojo: { jo: 50, balcony: true } })!.balconies[0].sectionsBasis).toBe("ours");

    const empty = raise(kodokan);
    expect(empty.defs).not.toContain("-v-cr-h");
    const seats = item(empty.items, "gallery").planes.filter((p) => p.kind === "seats");
    expect(seats.length).toBe(r.balconies.length * 3);
    for (const p of seats) {
      expect(p.svg).toMatch(/url\(#t-v-(north|south|east|west)-seat\)/);
      expect(p.svg).not.toContain("t-v-cr-h");
    }
    // The blocks are one path of rectangles, a whole number of seats wide, with the aisle of 1.2 m between each and the next, and the aisles are another path.
    const north = seats.find((p) => p.id === "gallery-north-1")!;
    const b = r.balconies.find((x) => x.side === "north")!;
    const d = /fill="url\(#t-v-north-seat\)" d="([^"]*)"/.exec(north.svg)![1];
    const blocks = [...d.matchAll(/M([\d.-]+) 0h([\d.]+)v/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    expect(blocks).toHaveLength(5);
    expect(blocks.map(([, w]) => Math.round(w / (b.seatWidth / 0.3048)))).toEqual([5, 8, 8, 8, 5]);
    for (let i = 1; i < blocks.length; i += 1) expect(blocks[i][0] - (blocks[i - 1][0] + blocks[i - 1][1])).toBeCloseTo(1.2 / 0.3048, 2);
    expect((/class="u-aisle" d="([^"]*)"/.exec(north.svg)![1].match(/M/g) ?? []).length).toBe(4);
    // The stairs of the aisles are in the risers too.
    expect(item(empty.items, "gallery").planes.find((p) => p.id === "gallery-north-riser-1")!.svg).toContain("u-stair");
    // A density asks for a crowd, laid over the seats.
    const crowded = raise({ ...kodokan, crowd: { density: 0.6 } });
    expect(crowded.defs).toContain("-v-cr-h");
    const svg = item(crowded.items, "gallery").planes.map((p) => p.svg).join("");
    expect(svg).toContain("url(#t-v-cr-h)");
    expect(svg).toContain("url(#t-v-north-seat)");
  });
});

describe("the venue in the 3D view", () => {
  const game = { home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#a8452c" }, away: { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" }, status: "final" } as const;

  it("is on for a drawing with a crowd and for a dojo, and off for the rest", () => {
    expect(buildTurn({ sport: "soccer", crowd: true }).venue).toBe(true);
    expect(buildTurn({ sport: "dojo" }).venue).toBe(true);
    expect(buildTurn({ sport: "soccer" }).venue).toBe(false);
    expect(buildTurn({ sport: "judo" }).venue).toBe(false);
    expect(buildTurn({ sport: "soccer", crowd: true }, { venue: false }).venue).toBe(false);
    expect(buildTurn({ sport: "soccer" }, { venue: true }).venue).toBe(true);
    expect(buildTurn({ sport: "soccer", crowd: true }, { uprights: false }).venue).toBe(false);
    expect(buildTurn({ sport: "soccer", crowd: true }, { uprights: false, venue: true }).planes.some((p) => p.kind === "seats")).toBe(true);
    expect(buildTurn({ sport: "soccer", crowd: true, ...game, size: "badge" }).venue).toBe(false);
  });

  it("draws the floor without the crowd when the stands stand, and with it when they do not", () => {
    expect(buildTurn({ sport: "soccer", crowd: true }).floor).not.toContain("ky-crowd");
    expect(buildTurn({ sport: "soccer", crowd: true }, { venue: false }).floor).toContain("ky-crowd");
    // The ground is still as wide as the stands.
    const wide = buildTurn({ sport: "soccer", crowd: true }).viewBox;
    const bare = buildTurn({ sport: "soccer" }).viewBox;
    expect(wide.w).toBeGreaterThan(bare.w * 1.5);
    expect(buildTurn({ sport: "soccer", crowd: true }, { venue: false }).planes.some((p) => p.kind === "seats")).toBe(false);
  });

  it("carries the crowd's colours to the patterns, from the teams", () => {
    const model = buildTurn({ sport: "soccer", crowd: true, ...game });
    expect(model.crowdStyle).toContain("--ky-cr-home");
    expect(model.crowdStyle).toContain("#a8452c");
    expect(turnMarkup({ sport: "soccer", crowd: true, ...game })).toContain('class="ky-turn-defs"');
    expect(turnMarkup({ sport: "soccer" })).not.toContain('class="ky-turn-defs"');
  });

  it("says what stands in the venue, with its heights, in both languages", () => {
    expect(buildTurn({ sport: "soccer", crowd: true }).standing).toMatch(/stands 35\.97 metres/);
    expect(buildTurn({ sport: "soccer", crowd: true }, { venue: { roof: true } }).standing).toMatch(/roof 43\.89 metres/);
    expect(buildTurn({ sport: "dojo", language: "ja" }).standing).toContain(KYOGIJO_STRINGS.ja.turn.parts.walls);
    for (const language of ["en", "ja"] as const) for (const kind of ["stands", "wall-seats", "roof", "gallery", "dais", "banner", "shrine", "mat-edge"] as const) expect(KYOGIJO_STRINGS[language].turn.parts[kind], `${language} ${kind}`).not.toBe("");
  });

  it("fits the whole venue in the box, so that every viewpoint shows the stands", () => {
    const plain = buildTurn({ sport: "soccer" });
    const model = buildTurn({ sport: "soccer", crowd: true });
    const feet = (m: typeof plain, side: "x" | "z"): number => (side === "x" ? m.box.x1 - m.box.x0 : m.box.z1) / m.scale;
    expect(feet(model, "x")).toBeGreaterThan(feet(plain, "x") * 1.8);
    expect(feet(model, "z")).toBeGreaterThan(100);
    expect(feet(plain, "z")).toBeLessThan(10);
  });
});

describe("how many elements a venue costs", () => {
  // A seat is never an element: rows are texture, and a tier is a handful of planes however many seats it holds.
  it("is a few hundred for a full soccer bowl and under a thousand for the biggest", () => {
    const soccer = turnMarkup({ sport: "soccer", crowd: true }, { venue: { roof: true } });
    expect(tags(soccer)).toBeLessThan(650);
    expect(tags(soccer)).toBeGreaterThan(200);
    expect((soccer.match(/class="ky-up /g) ?? []).length).toBeLessThan(140);
    for (const sport of ["nhl", "nba", "nfl", "tennis"] as const) expect(tags(turnMarkup({ sport, crowd: true }, { venue: { roof: true } })), sport).toBeLessThan(700);
    for (const o of [{ sport: "athletics", crowd: true }, { sport: "mlb", park: "fenway-park", crowd: true }] as SurfaceOptions[]) expect(tags(turnMarkup(o, { venue: { roof: true } })), String(o.sport)).toBeLessThan(1000);
    expect(soccer.length).toBeLessThan(150_000);
  });

  it("gives fewer planes at a lower level of detail and more at a higher one, the same stands", () => {
    const count = (detail: "low" | "auto" | "high"): number => item(raise({ sport: "soccer", crowd: true }, { detail }).items, "stands").planes.length;
    expect(count("low")).toBeLessThan(count("auto"));
    expect(count("auto")).toBeLessThan(count("high"));
    expect(count("low")).toBeLessThan(40);
    const heights = (detail: "low" | "high"): number => item(raise({ sport: "soccer", crowd: true }, { detail }).items, "stands").height;
    expect(heights("low")).toBeCloseTo(heights("high"), 3);
  });

  it("grows with the number of tiers and not with the number of seats", () => {
    const planes = (o: SurfaceOptions): number => item(raise(o).items, "stands").planes.length;
    const few = planes({ sport: "soccer", crowd: { density: 0.1 } });
    const full = planes({ sport: "soccer", crowd: { density: 1 } });
    expect(few).toBe(full);
    expect(planes({ sport: "soccer", crowd: true, capacity: 90_000 } as SurfaceOptions)).toBe(planes({ sport: "soccer", crowd: true }));
  });
});
