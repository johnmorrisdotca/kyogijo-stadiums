// The walkable mask of a district: the cells of a fine grid on the ground where a person may stand, worked out from the features OpenStreetMap maps round the venues (`walk.data.ts`, ODbL 1.0): the paths, sidewalks,
// plazas, squares, parks and platforms people stand on, the apron of each venue's own ground, minus what stops a crowd (carriageways at the width their lanes give them, cycle tracks, railways, water and every building).
// Pure arithmetic on typed arrays, in Node or in a page: data in, a grid out. Nothing is drawn here; the roads are never drawn, and the shape of a crowd on this mask is what shows where they are.
import { WALK_DATA, WALK_UNIT } from "./walk.data.ts";
import type { LonLat } from "./venues.geo.ts";
import type { Pt } from "./crowd.ts";

/** What a district's mask is made from, as `walk.data.ts` holds it: lines (`[width in tenths of a metre, first point, steps...]`) and areas (rings, the first the outside, in whole quarter-metres). */
export interface WalkData {
  /** The raw file the data was made from, and the day it was read and the time of OpenStreetMap's data. */
  source: string;
  read: string;
  base: string;
  licence: "ODbL-1.0";
  attribution: string;
  /** The venues the district was made for: the keys of `VENUES` and `STADIUMS` with the configuration, as a district names them. */
  venues: readonly string[];
  /** The `[longitude, latitude]` the metres are measured from. */
  origin: LonLat;
  /** The box the data covers, `[west, south, east, north]` in metres from the origin. */
  box: readonly [number, number, number, number];
  walkLines: readonly (readonly number[])[];
  walkAreas: readonly (readonly (readonly number[])[])[];
  blockLines: readonly (readonly number[])[];
  blockAreas: readonly (readonly (readonly number[])[])[];
}

/** The side of a cell of the mask, in metres: half a metre, finer than the narrowest path and a person's width. */
export const WALK_CELL = 0.5;

/** The grid of a mask: `cells[row * width + column]` is 1 where a person may stand. Cell `(0, 0)` has its corner at `(x0, y0)` metres east and north of `origin`. */
export interface WalkMask {
  id: string;
  origin: LonLat;
  cell: number;
  x0: number;
  y0: number;
  width: number;
  height: number;
  cells: Uint8Array;
  /** How many cells are walkable. */
  walkable: number;
}

/** The districts there are masks for. */
export const WALK_IDS: readonly string[] = Object.freeze(Object.keys(WALK_DATA));

/** A path from its packed form: the first point, then the step to each next one, in metres. */
export function unpack(packed: readonly number[], from = 0): Pt[] {
  const out: Pt[] = [];
  let [x, y] = [0, 0];
  for (let i = from; i + 1 < packed.length; i += 2) {
    x += packed[i];
    y += packed[i + 1];
    out.push([x * WALK_UNIT, y * WALK_UNIT]);
  }
  return out;
}

/** Fill the cells inside a polygon (its rings, the even-odd rule: a ring inside another is a hole) with `value`. */
function fillPolygon(mask: WalkMask, rings: readonly (readonly Pt[])[], value: 0 | 1): void {
  const { cell, x0, y0, width, height, cells } = mask;
  let [lo, hi] = [Infinity, -Infinity];
  for (const ring of rings) for (const p of ring) [lo, hi] = [Math.min(lo, p[1]), Math.max(hi, p[1])];
  const first = Math.max(0, Math.floor((lo - y0) / cell));
  const last = Math.min(height - 1, Math.ceil((hi - y0) / cell));
  const crossings: number[] = [];
  for (let row = first; row <= last; row += 1) {
    const y = y0 + (row + 0.5) * cell;
    crossings.length = 0;
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y) crossings.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
      }
    }
    crossings.sort((a, b) => a - b);
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(0, Math.ceil((crossings[k] - x0) / cell - 0.5));
      const to = Math.min(width - 1, Math.floor((crossings[k + 1] - x0) / cell - 0.5));
      if (to >= from) cells.fill(value, row * width + from, row * width + to + 1);
    }
  }
}

/** Set the cells within `half` metres of a line (round at the ends) to `value`. */
function strokeLine(mask: WalkMask, line: readonly Pt[], half: number, value: 0 | 1): void {
  const { cell, x0, y0, width, height, cells } = mask;
  const r2 = half * half;
  for (let s = 0; s + 1 < line.length || (s === 0 && line.length === 1); s += 1) {
    const [ax, ay] = line[s];
    const [bx, by] = line[Math.min(s + 1, line.length - 1)];
    const [dx, dy] = [bx - ax, by - ay];
    const len2 = dx * dx + dy * dy;
    const c0 = Math.max(0, Math.floor((Math.min(ax, bx) - half - x0) / cell));
    const c1 = Math.min(width - 1, Math.ceil((Math.max(ax, bx) + half - x0) / cell));
    const r0 = Math.max(0, Math.floor((Math.min(ay, by) - half - y0) / cell));
    const r1 = Math.min(height - 1, Math.ceil((Math.max(ay, by) + half - y0) / cell));
    for (let row = r0; row <= r1; row += 1) {
      const y = y0 + (row + 0.5) * cell;
      for (let col = c0; col <= c1; col += 1) {
        const x = x0 + (col + 0.5) * cell;
        const t = len2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
        const [ex, ey] = [x - (ax + t * dx), y - (ay + t * dy)];
        if (ex * ex + ey * ey <= r2) cells[row * width + col] = value;
      }
    }
  }
}

/** What a mask is given besides the data: rings in metres from the mask's origin that stop a crowd (the venues' own buildings), and rings whose surroundings are the venues' own ground. */
export interface WalkExtras {
  /** The outline of each venue's building: stops a crowd, and a band `apron` metres wide round it is ground a crowd may stand on. */
  buildings: readonly (readonly Pt[])[];
  /** The width of the venue's own ground round its building, in metres. */
  apron: number;
}

const masks = new Map<string, WalkMask>();

/**
 * The mask of a district, rasterised from `WALK_DATA` (and kept for the next call): the walkable areas and the paths at their width, the apron round each venue, then the carriageways, cycle tracks, railways, water and buildings cut out
 * of them, and the venues' own buildings last. A person stands in a cell with value 1, and nowhere else.
 */
export function walkMask(id: string, extras: WalkExtras): WalkMask {
  const key = `${id}:${extras.apron}:${extras.buildings.map((b) => b.length).join(",")}`;
  const kept = masks.get(key);
  if (kept !== undefined) return kept;
  const data = WALK_DATA[id];
  if (data === undefined) throw new Error(`no walkable mask ${id}: the masks are ${WALK_IDS.join(", ")}`);
  const [west, south, east, north] = data.box;
  const width = Math.ceil((east - west) / WALK_CELL);
  const height = Math.ceil((north - south) / WALK_CELL);
  const mask: WalkMask = { id, origin: data.origin, cell: WALK_CELL, x0: west, y0: south, width, height, cells: new Uint8Array(width * height), walkable: 0 };
  const polygon = (rings: readonly (readonly number[])[]): Pt[][] => rings.map((ring) => unpack(ring));
  for (const area of data.walkAreas) fillPolygon(mask, polygon(area), 1);
  for (const line of data.walkLines) strokeLine(mask, unpack(line, 1), line[0] / 20, 1);
  // The venue's own ground: a band round its building.
  for (const ring of extras.buildings) strokeLine(mask, [...ring, ring[0]], extras.apron, 1);
  for (const line of data.blockLines) strokeLine(mask, unpack(line, 1), line[0] / 20, 0);
  for (const area of data.blockAreas) fillPolygon(mask, polygon(area), 0);
  for (const ring of extras.buildings) fillPolygon(mask, [ring], 0);
  let walkable = 0;
  for (let i = 0; i < mask.cells.length; i += 1) walkable += mask.cells[i];
  mask.walkable = walkable;
  masks.set(key, mask);
  return mask;
}

/** Whether a point (metres east and north of the mask's origin) is in a walkable cell. */
export function walkable(mask: WalkMask, x: number, y: number): boolean {
  const col = Math.floor((x - mask.x0) / mask.cell);
  const row = Math.floor((y - mask.y0) / mask.cell);
  return col >= 0 && row >= 0 && col < mask.width && row < mask.height && mask.cells[row * mask.width + col] === 1;
}

/** The mask a set of venues stand on, if there is one: the first mask that names one of them (by id, whatever configuration). */
export const walkIdFor = (venueIds: readonly string[]): string | undefined => WALK_IDS.find((id) => WALK_DATA[id].venues.some((key) => venueIds.includes(key.split(":")[0])));
