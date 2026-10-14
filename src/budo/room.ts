// The room round a budō surface as plain data, for a later 3D view to raise, as `crowdStands()` gives the stands: the walls with their heights, the wood surround, the raised platform of the seat of honour,
// the banner, the balconies with their rows, the doors and windows, the thickness of the mats and, for the Nippon Budokan's floor, the octagon of the hall. In metres, from the top left corner of the
// surface's box (the mats of a competition area, a dojo's floor, the dohyō's clay), x to the right and y down. Nothing here draws.
import type { SurfaceOptions } from "../types.ts";
import { dojoSpecOf } from "./dojo.ts";
import type { MBox } from "./parts.ts";
import { BUDOKAN_ARENA, budoPlan } from "./plan.ts";
import type { Compass, Side4 } from "./types.ts";

/** Where a figure of the room comes from: a `source` (a rule or a published figure), the `plan` (it follows from the drawn layout) or `ours` (a plausible figure of ours, no source gives it). */
export type RoomBasis = "source" | "plan" | "ours";

/** A wall: its centre line, thickness and height. */
export interface RoomWall {
  id: string;
  side: Compass | "octagon";
  from: readonly [number, number];
  to: readonly [number, number];
  thickness: number;
  height: number | undefined;
  basis: RoomBasis;
}

/** A door or a window cut in a wall: the footprint in the wall, the sill (the height of its bottom) and the head (the height of its top). */
export interface RoomOpening {
  id: string;
  wall: Compass;
  box: MBox;
  sill: number;
  head: number;
}

/** A balcony: the strip of floor it covers, its height above the mats, and its rows of seats, from the rail outwards, each higher than the one before. */
export interface RoomBalcony {
  side: Compass;
  box: MBox;
  /** The height of the balcony's front edge above the mats. */
  height: number;
  depth: number;
  rows: number;
  rowDepth: number;
  rowRise: number;
  /** The height of the rail along the front edge. */
  rail: number;
  /** The seats in each block of a row, from one end of the side to the other: an aisle lies between one block and the next. The same in every row. */
  sections: number[];
  /** How wide a seat is, in metres: the side's length less its aisles, over its seats (a seat is 0.6 m or a little more). */
  seatWidth: number;
  /** The width of an aisle, in metres (ours). */
  aisle: number;
  /** Where the aisles' middles lie along the side, as shares of its length from 0 to 1. */
  aisles: number[];
  /** Whether the blocks of seats are the options' (`given`) or cut by us from the side's length. */
  sectionsBasis: "given" | "ours";
}

/** The room round a budō surface. */
export interface DojoRoom {
  sport: string;
  unit: "m";
  /** The surface's box: the mats of a competition area, the floor of a dojo, the dohyō's platform, the range of a kyūdōjō. */
  floor: MBox;
  /** The mats: `thickness` is the height of a mat's top above the floor under it, and `edge` how its edge is shaped (a competition mat is covered in vinyl and its edge is rounded), where a competition area's mat stands up at the safety area's outer edge. */
  mats: { thickness: number; edge: "rounded" | "square"; basis: RoomBasis } | undefined;
  /** The wood round the mats, between them and the walls. */
  surround: { outer: MBox; inner: MBox; width: number; material: "wood" } | undefined;
  walls: RoomWall[];
  /** The raised platforms: a dojo's seat of honour, the sumo dohyō. */
  platforms: { id: string; box: MBox; height: number; basis: RoomBasis }[];
  /** The banners: a plain dark vertical banner on a wall (no emblem is drawn), `bottom` and `top` its heights. */
  banners: { id: string; wall: Compass; box: MBox; width: number; bottom: number; top: number; basis: RoomBasis }[];
  balconies: RoomBalcony[];
  doors: RoomOpening[];
  windows: RoomOpening[];
  /** The windows high in the wall behind a gallery (a clerestory): the side, the stretch along the wall from its start (metres), the sill and the head, ours. */
  upperWindows: { side: Compass; from: number; to: number; sill: number; head: number }[];
  /** How high the room goes above a gallery's floor, for a ceiling over the gallery, and the height of that floor: undefined for a room with no gallery (ours). */
  ceiling: { gallery: number; height: number } | undefined;
  /** The shrine of a dojo (the shinzen), with its height. */
  shrine: { box: MBox; height: number } | undefined;
  /** The Budokan's octagon floor: its centre, apothem and corners, going round. */
  hall: { id: "budokan"; centre: readonly [number, number]; apothem: number; corners: readonly (readonly [number, number])[] } | undefined;
  /** The figures of this room that are ours, and not a source's: the heights of walls and banners, the dais, the balcony. */
  notes: string[];
}

/** The gallery of a dojo for the crowd: where its first row is from the mats, its depth and the heights of its first and last rows, in metres, from the room's balcony data. */
export interface DojoGallery {
  offset: number;
  depth: number;
  rows: number;
  /** The seats in each block of a row, and where the aisles lie along a side (shares of its length). */
  sections: number[];
  aisles: number[];
  height: [number, number];
}

/** Our heights, in metres, where no source gives one. */
export const ROOM_HEIGHTS = Object.freeze({ wall: 3, dais: 0.3, bannerBottom: 1, bannerTop: 3, door: 2, windowSill: 1, windowHead: 2.4, shrine: 1.2, rail: 1, balcony: 4.5, ceiling: 4.5, mat: 0.05, rowRise: 0.4, rowDepth: 0.8, balconyDepth: 2.4, balconyRows: 3, aisle: 1.2, seat: 0.6, blockLength: 9.14 });

/** The blocks of a row along a side `length` metres long: the options' `given`, else as many as a block of about 9 m allows (two at least), each as many seats as fit at 0.6 m with the aisles between. */
export function sectionsFor(length: number, given?: readonly number[]): number[] {
  if (given !== undefined && given.length > 0 && given.every((k) => Number.isInteger(k) && k > 0)) return [...given];
  const blocks = Math.max(2, Math.round(length / ROOM_HEIGHTS.blockLength));
  const seats = Math.max(1, Math.floor((length - (blocks - 1) * ROOM_HEIGHTS.aisle) / blocks / ROOM_HEIGHTS.seat));
  return Array.from({ length: blocks }, () => seats);
}

const SIDES: readonly Compass[] = ["north", "east", "south", "west"];
const COMPASS: Readonly<Record<string, Compass>> = { north: "north", south: "south", east: "east", west: "west", top: "north", bottom: "south", left: "west", right: "east" };

/**
 * The room of a budō surface as data: what a 3D view raises. A dojo has its walls (3 m, ours), wood surround, dais, banner, balconies, doors, windows and shrine as its spec asks for them; the other
 * surfaces have what they have (the mats' thickness, the dohyō's platform at its height, the Budokan's octagon). Heights that no source gives are ours and are listed in `notes`.
 * @example
 * ```ts
 * import { dojoRoom } from "@johnmorrisdotca/kyogijo-stadiums/budo";
 * const room = dojoRoom({ sport: "dojo", dojo: { jo: 20, dais: true, banner: true } });
 * console.log(room?.walls.length, room?.platforms[0]?.height, room?.banners.length);
 * // 4 0.3 1
 * ```
 */
export function dojoRoom(o: Pick<SurfaceOptions, "sport" | "league" | "budo" | "dojo" | "range">): DojoRoom | undefined {
  if (o.sport !== "judo" && o.sport !== "karate" && o.sport !== "kendo" && o.sport !== "sumo" && o.sport !== "kyudo" && o.sport !== "dojo") return undefined;
  const plan = budoPlan({ ...o, detail: "full" });
  const ox = plan.box.x0;
  const oy = plan.box.y0;
  const mv = (b: MBox): MBox => ({ x0: b.x0 - ox, y0: b.y0 - oy, x1: b.x1 - ox, y1: b.y1 - oy });
  const floor = mv(plan.box);
  const notes: string[] = [];
  const room: DojoRoom = { sport: o.sport, unit: "m", floor, mats: undefined, surround: undefined, walls: [], platforms: [], banners: [], balconies: [], doors: [], windows: [], upperWindows: [], ceiling: undefined, shrine: undefined, hall: undefined, notes };
  if (plan.judo !== undefined) {
    const fig = plan.figures as { tatami: { thickness: number } };
    room.mats = { thickness: fig.tatami.thickness, edge: "rounded", basis: "source" };
  }
  if (plan.dojo !== undefined) {
    const L = plan.dojo;
    const spec = dojoSpecOf(o.dojo);
    room.mats = { thickness: ROOM_HEIGHTS.mat, edge: "square", basis: "ours" };
    if (L.surround > 0) room.surround = { outer: mv(L.room), inner: mv(L.floor), width: L.surround, material: "wood" };
    // A dojo with a gallery is a storey high: the gallery's floor is level with the top of the walls, and the walls are as high as the gallery's floor (4.5 m, ours).
    const gallery = spec.balcony !== undefined && spec.balcony !== false;
    const galleryOwn = typeof spec.balcony === "object" && spec.balcony !== null ? spec.balcony : {};
    const wallHeight = gallery ? galleryOwn.height ?? ROOM_HEIGHTS.balcony : ROOM_HEIGHTS.wall;
    if (L.wall > 0) {
      const r = mv(L.room);
      const w = L.wall;
      const ring: [Compass, [number, number], [number, number]][] = [
        ["north", [r.x0 - w / 2, r.y0 - w / 2], [r.x1 + w / 2, r.y0 - w / 2]],
        ["east", [r.x1 + w / 2, r.y0 - w / 2], [r.x1 + w / 2, r.y1 + w / 2]],
        ["south", [r.x1 + w / 2, r.y1 + w / 2], [r.x0 - w / 2, r.y1 + w / 2]],
        ["west", [r.x0 - w / 2, r.y1 + w / 2], [r.x0 - w / 2, r.y0 - w / 2]],
      ];
      for (const [side, from, to] of ring) room.walls.push({ id: `wall-${side}`, side, from, to, thickness: w, height: wallHeight, basis: "ours" });
      notes.push(`The walls are ${wallHeight} m high (ours)${gallery ? ", a storey: the gallery's floor is level with their tops" : ""}.`);
    }
    if (L.dais !== undefined) {
      room.platforms.push({ id: "dais", box: mv(L.dais), height: ROOM_HEIGHTS.dais, basis: "ours" });
      notes.push(`The dais is ${ROOM_HEIGHTS.dais} m high and 1.5 m deep at most (ours).`);
    }
    if (L.banner !== undefined) {
      room.banners.push({ id: "banner", wall: L.kamiza, box: mv(L.banner), width: L.banner.x1 - L.banner.x0 > L.banner.y1 - L.banner.y0 ? L.banner.x1 - L.banner.x0 : L.banner.y1 - L.banner.y0, bottom: ROOM_HEIGHTS.bannerBottom, top: ROOM_HEIGHTS.bannerTop, basis: "ours" });
      notes.push("The banner is a plain dark vertical band, from 1 m to 3 m up the wall (ours).");
    }
    if (L.shrine !== undefined) room.shrine = { box: mv(L.shrine), height: ROOM_HEIGHTS.shrine };
    L.entrances.forEach((e, i) => room.doors.push({ id: `door-${i + 1}`, wall: e.wall, box: mv(e.box), sill: 0, head: ROOM_HEIGHTS.door }));
    L.windows.forEach((e, i) => room.windows.push({ id: `window-${i + 1}`, wall: e.wall, box: mv(e.box), sill: ROOM_HEIGHTS.windowSill, head: ROOM_HEIGHTS.windowHead }));
    const b = spec.balcony;
    if (b !== undefined && b !== false) {
      const own = typeof b === "object" && b !== null ? b : {};
      const sides: readonly Compass[] = own.sides === undefined ? SIDES : own.sides.map((s: Side4) => COMPASS[String(s)]).filter((s): s is Compass => s !== undefined);
      const depth = own.depth ?? ROOM_HEIGHTS.balconyDepth;
      const r = mv(L.room);
      const outer = { x0: r.x0 - L.wall, y0: r.y0 - L.wall, x1: r.x1 + L.wall, y1: r.y1 + L.wall };
      for (const side of sides) {
        const box: MBox = side === "north" ? { x0: outer.x0 - depth, y0: outer.y0 - depth, x1: outer.x1 + depth, y1: outer.y0 } : side === "south" ? { x0: outer.x0 - depth, y0: outer.y1, x1: outer.x1 + depth, y1: outer.y1 + depth } : side === "west" ? { x0: outer.x0 - depth, y0: outer.y0, x1: outer.x0, y1: outer.y1 } : { x0: outer.x1, y0: outer.y0, x1: outer.x1 + depth, y1: outer.y1 };
        const rows = own.rows ?? ROOM_HEIGHTS.balconyRows;
        // The blocks of seats along the side, the seats spread over its length with an aisle between the blocks.
        const length = side === "north" || side === "south" ? box.x1 - box.x0 : box.y1 - box.y0;
        const sections = sectionsFor(length, own.sections);
        const seats = sections.reduce((a, k) => a + k, 0);
        const aisle = ROOM_HEIGHTS.aisle;
        const seatWidth = (length - (sections.length - 1) * aisle) / seats;
        let run = 0;
        const aisles = sections.slice(0, -1).map((k, i) => {
          run += k * seatWidth;
          return (run + i * aisle + aisle / 2) / length;
        });
        room.balconies.push({ side, box, height: own.height ?? ROOM_HEIGHTS.balcony, depth, rows, rowDepth: depth / rows, rowRise: ROOM_HEIGHTS.rowRise, rail: ROOM_HEIGHTS.rail, sections, seatWidth, aisle, aisles, sectionsBasis: own.sections === undefined ? "ours" : "given" });
      }
      // The windows above the gallery, on the east side (ours): three tall panes high in the wall behind its last row.
      const east = room.balconies.find((x) => x.side === "east");
      if (east !== undefined) {
        const along = east.box.y1 - east.box.y0;
        const top = east.height + east.rows * east.rowRise + east.rail;
        for (let i = 0; i < 3; i += 1) room.upperWindows.push({ side: "east", from: along * (0.12 + i * 0.29), to: along * (0.12 + i * 0.29 + 0.25), sill: top + 0.4, head: top + ROOM_HEIGHTS.ceiling - 0.6 });
      }
      room.ceiling = { gallery: own.height ?? ROOM_HEIGHTS.balcony, height: (own.height ?? ROOM_HEIGHTS.balcony) + (own.rows ?? ROOM_HEIGHTS.balconyRows) * ROOM_HEIGHTS.rowRise + ROOM_HEIGHTS.rail + ROOM_HEIGHTS.ceiling };
      notes.push("The balcony's height (4.5 m, a storey), depth and its 3 rows are ours, as are the windows above it and the ceiling, 4.5 m over its last row; where a source gives its seats (the Kodokan's gallery, about 900) the atlas hall says so.");
    }
  }
  if (plan.sumo !== undefined) room.platforms.push({ id: "dohyo", box: floor, height: plan.sumo.height, basis: "source" });
  if (plan.hall === "budokan") {
    const cx = (plan.box.x0 + plan.box.x1) / 2 - ox;
    const cy = (plan.box.y0 + plan.box.y1) / 2 - oy;
    const a = BUDOKAN_ARENA;
    const k = a * (Math.SQRT2 - 1);
    const pts: [number, number][] = [[cx - k, cy - a], [cx + k, cy - a], [cx + a, cy - k], [cx + a, cy + k], [cx + k, cy + a], [cx - k, cy + a], [cx - a, cy + k], [cx - a, cy - k]];
    room.hall = { id: "budokan", centre: [cx, cy], apothem: a, corners: pts };
    pts.forEach((p, i) => room.walls.push({ id: `arena-${i + 1}`, side: "octagon", from: p, to: pts[(i + 1) % pts.length], thickness: 0, height: undefined, basis: "plan" }));
    notes.push("The octagon is 55 m across the flats (the Budokan's leaflet); no height of its wall is given.");
  }
  if (room.mats !== undefined && plan.judo !== undefined) notes.push("A competition mat's top stands 5 cm above the floor (the IJF's tatami): at the outer edge of the safety area its thickness shows.");
  return room;
}

/**
 * The gallery a dojo's crowd sits in, from the same balcony data as `dojoRoom()`, so that the 2D stands and a 3D view agree: a thin band of 4 rows (ours) close to the walls, just beyond the wood
 * surround. A dojo that asks for no balcony still has the default one when it has a crowd; `balcony: false` asks for none, and the sport's own stands are drawn. Not a dojo: nothing.
 */
export function dojoGallery(o: Pick<SurfaceOptions, "sport" | "league" | "budo" | "dojo" | "range">): DojoGallery | undefined {
  if (o.sport !== "dojo") return undefined;
  const spec = dojoSpecOf(o.dojo);
  if (spec.balcony === false) return undefined;
  const room = dojoRoom({ ...o, dojo: { ...spec, eras: undefined, era: undefined, year: undefined, balcony: spec.balcony ?? true } });
  const b = room?.balconies[0];
  if (room === undefined || b === undefined) return undefined;
  const f = room.floor;
  const offset = Math.min(...room.balconies.map((x) => (x.side === "north" ? f.y0 - x.box.y1 : x.side === "south" ? x.box.y0 - f.y1 : x.side === "west" ? f.x0 - x.box.x1 : x.box.x0 - f.x1)));
  return { offset, depth: b.depth, rows: b.rows, sections: b.sections, aisles: b.aisles, height: [b.height, b.height + b.rows * b.rowRise] };
}
