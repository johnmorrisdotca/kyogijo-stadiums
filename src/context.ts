// The buildings round a district, drawn low in detail so that a district stands in its streets and not on a bare grid: each is the outline of its roof edge, a height and, for some, a pitched roof, cut down at build time from
// Project PLATEAU's 3D city model (`scripts/build-plateau.mjs`, `plateau.data.ts`). Nothing here reads a tile or makes a request: an area is plain data a caller passes in (`context: [TOKYO_DOME_CITY]`), so a page that does not
// ask for one carries none. This file places an area's buildings in a district's frame, takes out the ones that are a venue's own (a venue is drawn from its own outline and shell), and draws the rest: flat on the district's
// floor, shaded by height, and the biggest and tallest as blocks standing on it in the 3D view. Pure: data in, markup and planes out.
import { FEET_PER_METRE } from "./geometry.ts";
import { boxOf, hullOf, inside, metresFrom, type LonLat } from "./venues.geo.ts";
import { n, shy, wall, type Plane, type Upright } from "./turn.kit.ts";
import { pointList, raked, type Slope } from "./venue.geom.ts";
import type { Pt } from "./crowd.ts";

/** One layer of an area's data: its rows, and where they came from and under what terms, since a layer has a source of its own (buildings from PLATEAU; trees and land cover from another). */
export interface ContextLayer {
  /** What it was made from: the dataset and its page. */
  source: string;
  /** The day the source was read. */
  read: string;
  licence: string;
  /** The credit that goes with a drawing made from this layer, in English and in Japanese. */
  attribution: { en: string; ja: string };
  /** The layer's rows, each a list of whole numbers in grid steps of the area's frame (the row format is the layer's own, said at its name in `ContextArea.layers`). */
  rows: readonly (readonly number[])[];
}

/**
 * An area of context round a district: ONE coordinate frame (the origin, the grid step and the radius, in metres east and north of the origin) and separate layers laid in it, each with its own source and licence. A layer an
 * area lacks is simply not drawn. The rows of each layer, all in grid steps from the origin:
 * - `buildings`: the height and the rise of the roof (0 for a flat one), then the first point (east, north) and each step to the next.
 * - `streets`: the kind (0 a carriageway at street level, 1 one on a viaduct or a bridge, 2 a railway, 3 a sidewalk or a path) and the width in grid steps, then the first point and each step to the next, a line.
 * - `landCover`: the class (0 water, 1 green, 2 wood), then the first point and each step to the next, an outline (a hole is an outline of its own, filled even-odd).
 * - `trees`: one row: the first tree's east, north and crown radius, then each next tree's step in east and north from the one before and its crown radius.
 */
export interface ContextArea {
  key: string;
  name: { en: string; ja: string };
  /** The middle of the area, `[longitude, latitude]`: the point the rows' coordinates are measured from. */
  origin: readonly [number, number];
  /** How far from the middle the data reaches, in metres. */
  radius: number;
  /** The step the coordinates and the heights are counted in, in metres (a half). */
  grid: number;
  /** A building this tall, in metres, is a landmark that the plan's frame grows to take in; `CONTEXT_LANDMARK` when missing. A city of many tall buildings (Vancouver's downtown) sets it above them, so that the frame stays round the venues. */
  landmark?: number;
  layers: { buildings?: ContextLayer; streets?: ContextLayer; trees?: ContextLayer; landCover?: ContextLayer };
}

/** One building as the district holds it: its outline in feet in the district's frame (x to the right, y down the page), its height and the rise of its roof in feet. */
export interface ContextBlock {
  /** A name for the building that is the same on every run: the area's key and its place in the area's list. */
  id: string;
  ring: Pt[];
  /** The height of its top above the ground, in feet. */
  height: number;
  /** How far a pitched roof rises over its eaves, in feet: 0 for a flat roof. */
  rise: number;
  /** Its ground area, in square feet. */
  area: number;
  /** A venue stands in this building (Korakuen Hall's building, which would hide it): it is drawn as a ghost. */
  ghost: boolean;
  /** The middle a see-through building's walls give way from, in feet: the venue raised in it (the Kodokan's main dojo). Set only by `shellBlock`. */
  xray?: Pt;
  /** Whether the building lies wholly inside the plan's frame: only such a building stands up in the 3D view, one the frame cuts is a part of the floor. */
  whole: boolean;
}

/** One street of the `streets` layer as the district holds it: its kind (0 a carriageway at street level, 1 a carriageway on a viaduct or a bridge, 2 a railway, 3 a sidewalk or a path), its width in feet and its line in feet in the district's frame. */
export interface ContextStreet {
  kind: 0 | 1 | 2 | 3;
  width: number;
  points: Pt[];
}

/** A water, green or wood outline in feet in the district's frame (a hole is an outline of its own). */
export interface ContextShape {
  /** 0 water, 1 green, 2 wood. */
  cls: number;
  ring: Pt[];
}

/** A tree in feet in the district's frame, its crown's radius in feet. */
export interface ContextTree {
  at: Pt;
  r: number;
}

/** What a district's context is: the buildings kept, and how many were left out because they are a venue's own. */
export interface ContextPlan {
  blocks: ContextBlock[];
  /** The streets, from a `streets` layer: drawn flat on the floor, under the buildings. */
  streets?: ContextStreet[];
  /** The water, green and wood outlines of a `landCover` layer that reach the frame: drawn flat, under the streets. */
  land?: ContextShape[];
  /** The trees of a `trees` layer inside the frame: drawn as dots, over the streets and under the buildings. */
  trees?: ContextTree[];
  /** The buildings of the model that are a venue (the Dome's own parts), left out: the venue draws them. */
  owned: number;
  /** The credits of the areas used, in each language. */
  attribution: { en: string[]; ja: string[] };
}

/** How many buildings are raised as blocks in the 3D view (the biggest and the tallest of those on the plan): the rest are the floor's own, flat. Every block is a few elements of the page. */
export const CONTEXT_BLOCKS = 130;
/** Feet of the plan's frame beyond the venues' buildings that a district with context shows, so that the streets round them are in it: 150 metres. */
export const CONTEXT_REACH = 150 * FEET_PER_METRE;
/** A building this tall, in metres, is a landmark: the plan's frame grows to take it in when it stands within `CONTEXT_LANDMARK_REACH` metres of the venues' buildings (Tokyo Dome Hotel, 155 metres, 370 metres from Korakuen Hall). */
export const CONTEXT_LANDMARK = 100;
export const CONTEXT_LANDMARK_REACH = 400;
/** The heights, in metres, that divide the buildings into four tones: low, middle, high and tall. */
export const CONTEXT_TONES: readonly number[] = [15, 45, 100];

const RAD = Math.PI / 180;
const rotate = ([x, y]: Pt, degrees: number): Pt => [x * Math.cos(degrees * RAD) - y * Math.sin(degrees * RAD), x * Math.sin(degrees * RAD) + y * Math.cos(degrees * RAD)];
const centroid = (ring: readonly Pt[]): Pt => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
/** The signed area of a ring: positive going clockwise on a page with y down. */
const signedArea = (ring: readonly Pt[]): number => ring.reduce((s, [x, y], i) => s + (x * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * y), 0) / 2;

/** A building of an area, decoded: its outline in metres east and north of the area's origin, its height and the rise of its roof in metres. */
export function decodeBuilding(area: Pick<ContextArea, "grid">, row: readonly number[]): { ring: Pt[]; height: number; rise: number } {
  const g = area.grid;
  const ring: Pt[] = [];
  let [x, y] = [row[2], row[3]];
  ring.push([x * g, y * g]);
  for (let i = 4; i + 1 < row.length; i += 2) {
    x += row[i];
    y += row[i + 1];
    ring.push([x * g, y * g]);
  }
  return { ring, height: row[0] * g, rise: row[1] * g };
}

/** A street of a `streets` layer, decoded: its line in metres east and north of the area's origin. The row is the kind, the width in grid steps, then the first point and each step to the next in grid steps. */
export function decodeStreet(area: Pick<ContextArea, "grid">, row: readonly number[]): Pt[] {
  const g = area.grid;
  const line: Pt[] = [];
  let [x, y] = [row[2], row[3]];
  line.push([x * g, y * g]);
  for (let i = 4; i + 1 < row.length; i += 2) {
    x += row[i];
    y += row[i + 1];
    line.push([x * g, y * g]);
  }
  return line;
}

/**
 * The box a district with context is framed to, in feet in the district's frame: the venues' box widened by `CONTEXT_REACH` on every side, and grown to take in every landmark (a building of `CONTEXT_LANDMARK` metres or more) that stands within
 * `CONTEXT_LANDMARK_REACH` metres of the venues' box, with a margin of its own. `box` is the venues' own.
 */
export function contextFrame(areas: readonly ContextArea[], origin: LonLat, turn: number, box: { x0: number; y0: number; x1: number; y1: number }): { x0: number; y0: number; x1: number; y1: number } {
  let frame = { x0: box.x0 - CONTEXT_REACH, y0: box.y0 - CONTEXT_REACH, x1: box.x1 + CONTEXT_REACH, y1: box.y1 + CONTEXT_REACH };
  const far = CONTEXT_LANDMARK_REACH * FEET_PER_METRE;
  const near = { x0: box.x0 - far, y0: box.y0 - far, x1: box.x1 + far, y1: box.y1 + far };
  for (const area of areas) {
    const [east, north] = metresFrom(origin, [area.origin as LonLat])[0];
    for (const row of area.layers.buildings?.rows ?? []) {
      if (row[0] * area.grid < (area.landmark ?? CONTEXT_LANDMARK)) continue;
      const b = decodeBuilding(area, row);
      const ring = b.ring.map(([e, nn]): Pt => rotate([(e + east) * FEET_PER_METRE, -(nn + north) * FEET_PER_METRE], turn));
      const at = boxOf(ring);
      if (at.x1 < near.x0 || at.x0 > near.x1 || at.y1 < near.y0 || at.y0 > near.y1) continue;
      const m = 30 * FEET_PER_METRE;
      frame = { x0: Math.min(frame.x0, at.x0 - m), y0: Math.min(frame.y0, at.y0 - m), x1: Math.max(frame.x1, at.x1 + m), y1: Math.max(frame.y1, at.y1 + m) };
    }
  }
  return frame;
}

/** A venue as the context needs it: its building's outline in the district's frame. */
export interface ContextVenue {
  footprint: readonly Pt[];
  /** The footprint is a building the venue draws itself (the Kodokan's, with its dojo in the air in it): the building of the model that is the same is the venue's, left out. */
  shell?: boolean;
}

/**
 * The buildings of some areas placed in a district: turned as the plan is, kept where they stand in the frame, and sorted into the venues' own (a building most of which lies inside a venue's outline is the venue's: it is left out, the
 * venue draws it) and the ghosts (a building that holds a venue inside it). `origin` is the district's own origin (`[longitude, latitude]`), `turn` the degrees the map is turned, `frame` the plan's box in feet.
 */
export function placeContext(areas: readonly ContextArea[], origin: LonLat, turn: number, frame: { x: number; y: number; w: number; h: number }, venues: readonly ContextVenue[]): ContextPlan {
  const blocks: ContextBlock[] = [];
  let owned = 0;
  const hulls = venues.map((v) => hullOf([...v.footprint]));
  const [fx0, fy0, fx1, fy1] = [frame.x, frame.y, frame.x + frame.w, frame.y + frame.h];
  for (const area of areas) {
    const [east, north] = metresFrom(origin, [area.origin as LonLat])[0];
    (area.layers.buildings?.rows ?? []).forEach((row, index) => {
      const b = decodeBuilding(area, row);
      const ring = b.ring.map(([e, nn]): Pt => rotate([(e + east) * FEET_PER_METRE, -(nn + north) * FEET_PER_METRE], turn));
      const box = boxOf(ring);
      // Wholly outside the frame: not drawn at all.
      if (box.x1 < fx0 || box.x0 > fx1 || box.y1 < fy0 || box.y0 > fy1) return;
      const middle = centroid(ring);
      const share = (poly: readonly Pt[]): number => ring.filter((p) => inside(poly, p)).length / ring.length;
      // A venue inside the building (its middle and at least half of its outline's points): the building is a ghost round it.
      const holds = venues.some((v) => v.shell !== true && inside(ring, centroid(v.footprint)) && v.footprint.filter((p) => inside(ring, p)).length * 2 >= v.footprint.length);
      if (!holds && hulls.some((hull) => inside(hull, middle) || share(hull) >= 0.7)) {
        owned += 1;
        return;
      }
      blocks.push({ id: `${area.key}-${index}`, ring, height: b.height * FEET_PER_METRE, rise: b.rise * FEET_PER_METRE, area: Math.abs(signedArea(ring)), ghost: holds, whole: box.x0 >= fx0 && box.x1 <= fx1 && box.y0 >= fy0 && box.y1 <= fy1 });
    });
  }
  // The streets of the areas: each a line with a width, kept where it reaches into the frame.
  const streets: ContextStreet[] = [];
  for (const area of areas) {
    const [east, north] = metresFrom(origin, [area.origin as LonLat])[0];
    for (const row of area.layers.streets?.rows ?? []) {
      const points = decodeStreet(area, row).map(([e, nn]): Pt => rotate([(e + east) * FEET_PER_METRE, -(nn + north) * FEET_PER_METRE], turn));
      const box = boxOf(points);
      if (box.x1 < fx0 || box.x0 > fx1 || box.y1 < fy0 || box.y0 > fy1) continue;
      streets.push({ kind: row[0] as ContextStreet["kind"], width: row[1] * area.grid * FEET_PER_METRE, points });
    }
  }
  // The water, green and wood of the areas, and their trees.
  const land: ContextShape[] = [];
  const trees: ContextTree[] = [];
  for (const area of areas) {
    const [east, north] = metresFrom(origin, [area.origin as LonLat])[0];
    const g = area.grid;
    const put = (x: number, y: number): Pt => rotate([(x * g + east) * FEET_PER_METRE, -(y * g + north) * FEET_PER_METRE], turn);
    for (const row of area.layers.landCover?.rows ?? []) {
      const ring: Pt[] = [];
      let [x, y] = [row[1], row[2]];
      ring.push(put(x, y));
      for (let i = 3; i + 1 < row.length; i += 2) {
        x += row[i];
        y += row[i + 1];
        ring.push(put(x, y));
      }
      const box = boxOf(ring);
      if (!(box.x1 < fx0 || box.x0 > fx1 || box.y1 < fy0 || box.y0 > fy1)) land.push({ cls: row[0], ring });
    }
    for (const row of area.layers.trees?.rows ?? []) {
      let [x, y] = [row[0], row[1]];
      for (let i = 0; i + 2 < row.length; i += 3) {
        if (i > 0) {
          x += row[i];
          y += row[i + 1];
        }
        const at = put(x, y);
        if (at[0] >= fx0 && at[0] <= fx1 && at[1] >= fy0 && at[1] <= fy1) trees.push({ at, r: row[i + 2] * g * FEET_PER_METRE });
      }
    }
  }
  // An empty credit (a layer whose credit another layer of the area has said) adds nothing.
  const layers = areas.flatMap((a) => Object.values(a.layers));
  const credits = (language: "en" | "ja"): string[] => [...new Set(layers.map((l) => l.attribution[language]).filter((text) => text !== ""))];
  return { blocks, streets, land, trees, owned, attribution: { en: credits("en"), ja: credits("ja") } };
}

/** The tone (0 low to 3 tall) of a building of `feet` height. */
export const toneOf = (feet: number): number => CONTEXT_TONES.filter((m) => feet / FEET_PER_METRE >= m).length;

const num = (value: number): string => String(Math.round(value * 100) / 100);

/** The streets flat on the floor, under the buildings: a path for each kind and width (a foot), widest and lowest kinds first, so that a sidewalk lies over the carriageway beside it and a viaduct's deck over the street under it. */
export function streetsFloor(streets: readonly ContextStreet[]): string {
  if (streets.length === 0) return "";
  const groups = new Map<string, string[]>();
  for (const s of streets) {
    const key = `${s.kind} ${Math.max(1, Math.round(s.width))}`;
    const list = groups.get(key) ?? [];
    list.push(`M${s.points.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}`);
    groups.set(key, list);
  }
  // Under: street-level carriageways, then railways, then sidewalks and paths, then viaducts (which cross over the rest).
  const order = [0, 2, 3, 1];
  const keys = [...groups.keys()].sort((a, b) => order.indexOf(Number(a.split(" ")[0])) - order.indexOf(Number(b.split(" ")[0])) || Number(b.split(" ")[1]) - Number(a.split(" ")[1]));
  return `<g class="ky-dist-streets" aria-hidden="true" fill="none">${keys.map((key) => `<path class="ky-dist-street ky-dist-street-${key.split(" ")[0]}" stroke-width="${key.split(" ")[1]}" d="${groups.get(key)!.join("")}"/>`).join("")}</g>`;
}

const one = (value: number): string => String(Math.round(value * 10) / 10);

/** Water, green and wood flat on the floor, the lowest of what a context draws: one path for each class, filled even-odd so that a hole is a hole. */
export function landFloor(land: readonly ContextShape[]): string {
  const classes = ["ky-dist-water", "ky-dist-green", "ky-dist-wood"];
  return classes.map((cls, i) => {
    const rings = land.filter((s) => s.cls === i);
    return rings.length === 0 ? "" : `<path class="ky-dist-land ${cls}" fill-rule="evenodd" d="${rings.map((s) => `M${s.ring.map(([x, y]) => `${one(x)} ${one(y)}`).join("L")}Z`).join("")}"/>`;
  }).join("");
}

/** Trees as dots: one path for each of three sizes (the crown's diameter on the floor, in feet), a dot being a round cap on a line of no length, so that a thousand trees are three elements. */
export function treesFloor(trees: readonly ContextTree[]): string {
  const sizes = [[0, 11, 9], [11, 17, 14], [17, Infinity, 20]] as const;
  return sizes.map(([from, to, width]) => {
    const dots = trees.filter((t) => t.r * 2 >= from && t.r * 2 < to);
    return dots.length === 0 ? "" : `<path class="ky-dist-tree" stroke-width="${width}" d="${dots.map((t) => `M${one(t.at[0])} ${one(t.at[1])}h0`).join("")}"/>`;
  }).join("");
}

/**
 * What lies flat on the floor of a district under the venues, from the lowest up: water, green and wood, the streets, the trees as dots, and the buildings in four tones by height with the ghosts. All of it faint, so that a crowd
 * reads on it. Empty for a district with no context.
 */
export function contextFloor(plan: ContextPlan): string {
  const under = `${landFloor(plan.land ?? [])}${streetsFloor(plan.streets ?? [])}${treesFloor(plan.trees ?? [])}`;
  if (plan.blocks.length === 0) return under;
  const paths: string[][] = [[], [], [], [], []];
  for (const b of plan.blocks) paths[b.ghost ? 4 : toneOf(b.height)].push(`M${b.ring.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z`);
  const classes = ["ky-dist-b0", "ky-dist-b1", "ky-dist-b2", "ky-dist-b3", "ky-dist-ghost"];
  return `${under}<g class="ky-dist-context" aria-hidden="true">${paths.map((d, i) => (d.length === 0 ? "" : `<path class="ky-dist-block ${classes[i]}" d="${d.join("")}"/>`)).join("")}</g>`;
}

// ---- The blocks of the 3D view. ----

/** How much a building matters to the view: tall and wide first. */
const weight = (b: ContextBlock): number => b.height * Math.sqrt(b.area);

/** The principal axis of a ring, as a unit direction, and the extent of the ring along it and across it, from its middle. */
function axisOf(ring: readonly Pt[]): { along: Pt; t0: number; t1: number; s0: number; s1: number } {
  const [mx, my] = centroid(ring);
  let [sxx, sxy, syy] = [0, 0, 0];
  for (const [x, y] of ring) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
    syy += (y - my) ** 2;
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const along: Pt = [Math.cos(angle), Math.sin(angle)];
  const across: Pt = [-along[1], along[0]];
  const ts = ring.map(([x, y]) => (x - mx) * along[0] + (y - my) * along[1]);
  const ss = ring.map(([x, y]) => (x - mx) * across[0] + (y - my) * across[1]);
  return { along, t0: Math.min(...ts), t1: Math.max(...ts), s0: Math.min(...ss), s1: Math.max(...ss) };
}

/** Whether a ring is convex (either way round). */
const convex = (ring: readonly Pt[]): boolean => {
  let sign = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [a, b, c] = [ring[i], ring[(i + 1) % ring.length], ring[(i + 2) % ring.length]];
    const k = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(k) < 1e-9) continue;
    if (sign === 0) sign = Math.sign(k);
    else if (Math.sign(k) !== sign) return false;
  }
  return true;
};

/** The plane a set of points with heights lies nearest to (least squares), as a slope. */
function slopeThrough(points: readonly (readonly [number, number, number])[]): Slope {
  const m = points.length;
  const [mx, my, mz] = [points.reduce((s, p) => s + p[0], 0) / m, points.reduce((s, p) => s + p[1], 0) / m, points.reduce((s, p) => s + p[2], 0) / m];
  let [sxx, sxy, syy, sxz, syz] = [0, 0, 0, 0, 0];
  for (const [x, y, z] of points) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
    syy += (y - my) ** 2;
    sxz += (x - mx) * (z - mz);
    syz += (y - my) * (z - mz);
  }
  const det = sxx * syy - sxy * sxy;
  const [gx, gy] = Math.abs(det) < 1e-9 ? [0, 0] : [(sxz * syy - syz * sxy) / det, (syz * sxx - sxz * sxy) / det];
  return { x0: mx, y0: my, z0: mz, gx, gy };
}

/** The faces of a hip roof over a ring: from each edge of the ring (at the eaves) up to a ridge along the ring's long axis (at the top). A face is a quad or a triangle. */
function hipFaces(ring: readonly Pt[], eave: number, top: number): { poly: Pt[]; heights: number[] }[] {
  const { along, t0, t1, s0, s1 } = axisOf(ring);
  const [mx, my] = centroid(ring);
  const across: Pt = [-along[1], along[0]];
  const half = (s1 - s0) / 2;
  const sm = (s0 + s1) / 2;
  const tm = (t0 + t1) / 2;
  // The ridge runs between t0 + half and t1 - half (a point at the middle where the ring is no longer than it is wide).
  const [r0, r1] = t1 - t0 > 2 * half ? [t0 + half, t1 - half] : [tm, tm];
  const at = (t: number): Pt => [mx + along[0] * t + across[0] * sm, my + along[1] * t + across[1] * sm];
  const nearest = (p: Pt): Pt => at(Math.max(r0, Math.min(r1, (p[0] - mx) * along[0] + (p[1] - my) * along[1])));
  const faces: { poly: Pt[]; heights: number[] }[] = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const [ra, rb] = [nearest(a), nearest(b)];
    const poly: Pt[] = [a, b];
    const heights = [eave, eave];
    if (Math.hypot(rb[0] - b[0], rb[1] - b[1]) > 1e-6) {
      poly.push(rb);
      heights.push(top);
    }
    if (Math.hypot(ra[0] - rb[0], ra[1] - rb[1]) > 1e-6) {
      poly.push(ra);
      heights.push(top);
    }
    if (poly.length >= 3) faces.push({ poly, heights });
  });
  return faces;
}

/** The light on a wall by the way it faces on the district's plan: three tones, from the side the light comes from (up the page and to the left) to the side in shadow. */
const sideOf = (a: Pt, b: Pt, wound: number): 0 | 1 | 2 => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const long = Math.hypot(dx, dy) || 1;
  // On a page with y down, the outward normal of a ring wound clockwise is to the left of the walk from a to b, of one wound counter-clockwise to the right.
  const [nx, ny] = wound > 0 ? [dy / long, -dx / long] : [-dy / long, dx / long];
  const lit = nx * -0.45 + ny * -0.55;
  return lit > 0.25 ? 0 : lit > -0.2 ? 1 : 2;
};

const SIDES = ["u-block-a", "u-block-b", "u-block-c"] as const;

/** One building as the planes of a block: its walls up to the eaves, and over them a flat roof, or a hip roof where it has a pitched one. A ghost's planes are always mostly cut away, so that a venue inside it shows. */
export function blockPlanes(b: ContextBlock, prefix: string): Plane[] {
  const planes: Plane[] = [];
  const wound = signedArea(b.ring);
  const pitched = b.rise > 3 && b.ring.length <= 8 && convex(b.ring);
  const eave = pitched ? Math.max(b.height - b.rise, 3) : b.height;
  const ghost = (p: Plane): Plane => (b.ghost ? { ...p, shy: [0, 0], fadeAt: -10, fadeTo: 0.16 } : p);
  // A see-through building: each wall gives way as the eye comes round to its side and looks in, to a trace of itself, and the roof is always nearly clear.
  const xray = b.xray;
  const wall1 = (p: Plane): Plane => (xray === undefined ? ghost(p) : { ...shy(p, xray), fadeTo: 0.06, fadeSide: true });
  const roof1 = (p: Plane): Plane => (xray === undefined ? ghost(p) : { ...p, shy: [0, 0], fadeAt: -10, fadeTo: 0.1 });
  b.ring.forEach((p, i) => {
    const q = b.ring[(i + 1) % b.ring.length];
    const long = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (long < 3) return;
    planes.push(wall1(wall(`${prefix}w${i}`, "block", p[0], p[1], q[0], q[1], 0, eave, `<rect class="u-block ${SIDES[sideOf(p, q, wound)]}" width="${n(long)}" height="${n(eave)}"/>`)));
  });
  const roof = (id: string, poly: Pt[], slope: Slope, along: Pt): void => {
    const p = raked(id, "block", poly, slope, along, (corners) => `<polygon class="u-block-roof" points="${pointList(corners)}"/>`);
    if (p !== undefined) planes.push(roof1(p));
  };
  if (!pitched) {
    roof(`${prefix}top`, b.ring, { x0: b.ring[0][0], y0: b.ring[0][1], z0: b.height, gx: 0, gy: 0 }, [1, 0]);
    return planes;
  }
  hipFaces(b.ring, eave, b.height).forEach((face, i) => {
    const [p, q] = face.poly;
    const long = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    roof(`${prefix}r${i}`, face.poly, slopeThrough(face.poly.map((pt, k) => [pt[0], pt[1], face.heights[k]] as const)), [(q[0] - p[0]) / long, (q[1] - p[1]) / long]);
  });
  return planes;
}

/** The blocks of the 3D view: the `most` buildings that matter most (the tallest and widest, by height times the side of their ground), each a few planes, in the order the plan lists them. */
export function contextUprights(plan: ContextPlan, most = CONTEXT_BLOCKS): Upright[] {
  const wanted = new Set(plan.blocks.filter((b) => b.whole).sort((a, b) => weight(b) - weight(a) || (a.id < b.id ? -1 : 1)).slice(0, Math.max(0, most)).map((b) => b.id));
  const items: Upright[] = [];
  for (const b of plan.blocks) {
    if (!wanted.has(b.id)) continue;
    const planes = blockPlanes(b, `c-${b.id}-`);
    if (planes.length === 0) continue;
    const [x, y] = centroid(b.ring);
    items.push({ id: `c-${b.id}`, kind: "blocks", at: [x, y], height: b.height, planes });
  }
  return items;
}

/** The building a raised venue stands in as a block: its outline in feet, its height, `xray` the middle its walls give way from (or none for a solid one). */
export function shellBlock(key: string, ring: readonly Pt[], height: number, xray: Pt | undefined): ContextBlock {
  return { id: `shell-${key}`, ring: [...ring], height, rise: 0, area: Math.abs(signedArea(ring)), ghost: false, whole: true, ...(xray === undefined ? {} : { xray }) };
}
