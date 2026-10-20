// The plain geometry a real venue is drawn from: a building outline given in degrees of longitude and latitude, laid flat in metres, its long axis found, and turned into the drawing's own frame (feet, the rink's long
// side along x). Pure arithmetic: no data, no page. A bearing is degrees clockwise from north.
import type { Pt } from "./crowd.ts";

/** A point as `[longitude, latitude]`, in degrees, the order OpenStreetMap's GeoJSON gives. */
export type LonLat = readonly [number, number];

const EARTH = 6371008.8;
const RAD = Math.PI / 180;

/** Points in degrees as `[east, north]` metres from `origin`, on a plane tangent to the earth there (good to a few centimetres over a building's size). */
export function metresFrom(origin: LonLat, ring: readonly LonLat[]): Pt[] {
  const k = Math.cos(origin[1] * RAD);
  return ring.map(([lon, lat]): Pt => [(lon - origin[0]) * RAD * EARTH * k, (lat - origin[1]) * RAD * EARTH]);
}

/** The inverse of `metresFrom`: a point given as east and north metres from `origin`, in degrees. */
export function lonLatFrom(origin: LonLat, [east, north]: Pt): LonLat {
  return [origin[0] + east / (RAD * EARTH * Math.cos(origin[1] * RAD)), origin[1] + north / (RAD * EARTH)];
}

/** A point as OpenStreetMap's Overpass API returns it. */
export interface OsmPoint {
  lat: number;
  lon: number;
}

/** An element as Overpass returns it with its geometry (`out geom`): a way's points, or a relation's members, each with theirs. */
export interface OsmElement {
  type: string;
  id: number;
  geometry?: readonly OsmPoint[];
  members?: readonly { type: string; ref: number; role: string; geometry?: readonly OsmPoint[] }[];
}

const same = (a: OsmPoint, b: OsmPoint): boolean => a.lat === b.lat && a.lon === b.lon;

/**
 * The closed outline an OpenStreetMap element is, as its points with the first repeated at the end, or `undefined`: a closed way is its own; a multipolygon relation is its outer members joined end to end into one
 * ring (a building drawn in two or more ways); a relation with two outer rings or an outer way that does not close is not an outline (the caller says what rule it needs). Inner members are courtyards and are left out.
 */
export function outerRingOf(element: OsmElement): OsmPoint[] | undefined {
  if (element.type === "way") {
    const g = element.geometry;
    return g !== undefined && g.length > 3 && same(g[0], g[g.length - 1]) ? [...g] : undefined;
  }
  if (element.type !== "relation" || element.members === undefined) return undefined;
  const parts = element.members.filter((m) => m.type === "way" && m.role === "outer" && m.geometry !== undefined && m.geometry.length > 1).map((m) => [...(m.geometry as OsmPoint[])]);
  if (parts.length === 0) return undefined;
  const ring = parts.shift() as OsmPoint[];
  while (!same(ring[0], ring[ring.length - 1]) && parts.length > 0) {
    const tail = ring[ring.length - 1];
    const next = parts.findIndex((part) => same(part[0], tail) || same(part[part.length - 1], tail));
    if (next < 0) return undefined;
    const [part] = parts.splice(next, 1);
    if (!same(part[0], tail)) part.reverse();
    ring.push(...part.slice(1));
  }
  return parts.length === 0 && ring.length > 3 && same(ring[0], ring[ring.length - 1]) ? ring : undefined;
}

/** The mean of a ring's longitudes and latitudes: a point to measure from. */
export const middleOf = (ring: readonly LonLat[]): LonLat => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];

/** The area of a polygon, unsigned. */
export function areaOf(points: readonly Pt[]): number {
  let s = 0;
  points.forEach(([x, y], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    s += x * y2 - x2 * y;
  });
  return Math.abs(s) / 2;
}

/** The centre of mass of a polygon's area. */
export function centroidOf(points: readonly Pt[]): Pt {
  let a = 0;
  let cx = 0;
  let cy = 0;
  points.forEach(([x, y], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    const f = x * y2 - x2 * y;
    a += f;
    cx += (x + x2) * f;
    cy += (y + y2) * f;
  });
  return a === 0 ? [points[0][0], points[0][1]] : [cx / (3 * a), cy / (3 * a)];
}

/** The convex hull of some points (Andrew's monotone chain), counter-clockwise. */
export function hullOf(points: readonly Pt[]): Pt[] {
  const sorted = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o: Pt, a: Pt, b: Pt): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: readonly Pt[]): Pt[] => {
    const out: Pt[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

/** The heading, in degrees clockwise from north, of a direction given as east and north components, taken modulo 180 (an axis has no head): 0 to under 180. */
export const axisHeading = (east: number, north: number): number => (((Math.atan2(east, north) / RAD) % 180) + 180) % 180;

/** The smallest rectangle (by area) that encloses some points: its long side's heading, its length and its width, in the units of the points. */
export function smallestBox(points: readonly Pt[]): { heading: number; length: number; width: number } {
  const hull = hullOf(points);
  let best: { area: number; heading: number; length: number; width: number } | undefined;
  hull.forEach((p, i) => {
    const q = hull[(i + 1) % hull.length];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < 1e-9) return;
    const ux = (q[0] - p[0]) / d;
    const uy = (q[1] - p[1]) / d;
    let lo = Infinity;
    let hi = -Infinity;
    let left = Infinity;
    let right = -Infinity;
    for (const [x, y] of hull) {
      const along = x * ux + y * uy;
      const across = -x * uy + y * ux;
      lo = Math.min(lo, along);
      hi = Math.max(hi, along);
      left = Math.min(left, across);
      right = Math.max(right, across);
    }
    const [a, b] = [hi - lo, right - left];
    if (best === undefined || a * b < best.area - 1e-9) best = a >= b ? { area: a * b, heading: axisHeading(ux, uy), length: a, width: b } : { area: a * b, heading: axisHeading(-uy, ux), length: b, width: a };
  });
  if (best === undefined) throw new Error("a rectangle needs points that are not all the same");
  return { heading: best.heading, length: best.length, width: best.width };
}

/**
 * A point given as east and north metres, in the drawing's frame, for a rink whose long side runs along `heading` (degrees clockwise from north, 0 to under 180): x along the rink's long side, y across it and down the page,
 * so that the picture is the map turned and not mirrored. Metres stay metres.
 */
export function turnedTo(heading: number, [east, north]: Pt): Pt {
  const a = heading * RAD;
  return [east * Math.sin(a) + north * Math.cos(a), east * Math.cos(a) - north * Math.sin(a)];
}

/** The way north points in the drawing, in degrees clockwise from the top of the page, for a rink along `heading`. 90 less the heading: a rink that runs east-west has north at the top. */
export const northOn = (heading: number): number => 90 - heading;

/** A ring with points that lie within `tolerance` of the line between their neighbours taken out (Douglas and Peucker), the ends kept: a ring is a list of points not repeating its first. */
export function simplified(ring: readonly Pt[], tolerance: number): Pt[] {
  const keep = new Array<boolean>(ring.length).fill(false);
  // The two farthest-apart points anchor the ring; each half is then simplified as a line.
  let [a, b, far] = [0, 0, -1];
  ring.forEach((p, i) => ring.forEach((q, j) => {
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (j > i && d > far) [a, b, far] = [i, j, d];
  }));
  keep[a] = true;
  keep[b] = true;
  const run = (from: number, to: number, step: (i: number) => number): void => {
    const [p, q] = [ring[from], ring[to]];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    let at = -1;
    let most = tolerance;
    for (let i = step(from); i !== to; i = step(i)) {
      const r = ring[i];
      const d = len < 1e-9 ? Math.hypot(r[0] - p[0], r[1] - p[1]) : Math.abs((q[0] - p[0]) * (p[1] - r[1]) - (p[0] - r[0]) * (q[1] - p[1])) / len;
      if (d > most) [at, most] = [i, d];
    }
    if (at >= 0) {
      keep[at] = true;
      run(from, at, step);
      run(at, to, step);
    }
  };
  const next = (i: number): number => (i + 1) % ring.length;
  run(a, b, next);
  run(b, a, next);
  return ring.filter((_, i) => keep[i]);
}

/** Whether a point is in a polygon (even-odd). */
export function inside(points: readonly Pt[], [x, y]: Pt): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** The smallest box round some points. */
export function boxOf(points: readonly Pt[]): { x0: number; y0: number; x1: number; y1: number } {
  return { x0: Math.min(...points.map((p) => p[0])), y0: Math.min(...points.map((p) => p[1])), x1: Math.max(...points.map((p) => p[0])), y1: Math.max(...points.map((p) => p[1])) };
}

/** The distance from a point to the nearest edge of a polygon. */
export function edgeDistance(points: readonly Pt[], [x, y]: Pt): number {
  let best = Infinity;
  points.forEach(([ax, ay], i) => {
    const [bx, by] = points[(i + 1) % points.length];
    const [dx, dy] = [bx - ax, by - ay];
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  });
  return best;
}

/** What `coreOf` finds: the building's main hall, as the largest rectangle that lies inside its outline. */
export interface Core {
  /** The heading of the rectangle's long side, 0 to under 180, degrees clockwise from north. */
  heading: number;
  /** The rectangle's long and short sides, in the units of the points. */
  length: number;
  width: number;
  /** The middle of the rectangle, as east and north from the points' origin. */
  centre: Pt;
  /** How much the best direction beats the worst: the largest rectangle's area over the smallest, over every direction. A round building has 1; a building with a direction has more. */
  strength: number;
}

/** How coarse the raster `coreOf` lays on the outline is, in the units of the points, and how many degrees apart the directions it tries are. */
const CELL = 2;
const STEP = 3;

/** The largest rectangle with its sides along x and y inside a polygon: width, height and the middle, found on a raster of `CELL` (the largest rectangle in each row's histogram). */
function largestRectangle(poly: readonly Pt[]): { w: number; h: number; at: Pt } {
  const b = boxOf(poly);
  const nx = Math.max(1, Math.ceil((b.x1 - b.x0) / CELL));
  const ny = Math.max(1, Math.ceil((b.y1 - b.y0) / CELL));
  const column = new Array<number>(nx).fill(0);
  let best = { area: 0, w: 0, h: 0, at: [0, 0] as Pt };
  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) column[i] = inside(poly, [b.x0 + (i + 0.5) * CELL, b.y0 + (j + 0.5) * CELL]) ? column[i] + 1 : 0;
    const stack: [number, number][] = [];
    for (let i = 0; i <= nx; i += 1) {
      const h = i === nx ? 0 : column[i];
      let start = i;
      while (stack.length > 0 && stack[stack.length - 1][1] >= h) {
        const [from, height] = stack.pop() as [number, number];
        const area = height * (i - from);
        if (area > best.area) best = { area, w: (i - from) * CELL, h: height * CELL, at: [b.x0 + (from + (i - from) / 2) * CELL, b.y0 + (j + 1 - height / 2) * CELL] };
        start = from;
      }
      stack.push([start, h]);
    }
  }
  return { w: best.w, h: best.h, at: best.at };
}

/**
 * The main hall of a building: the largest rectangle inside its outline over every direction (`STEP` degrees apart), which does not see a wing, a plaza or a ramp that a rectangle cannot fill. Its long side is the
 * building's axis, its middle the middle of the hall, and `strength` how much of a direction the building has (a round one has none). Ties between a direction and the one at a right angle go to the longer rectangle.
 */
export function coreOf(points: readonly Pt[]): Core {
  const areas: number[] = [];
  let best: { area: number; angle: number; w: number; h: number; at: Pt } | undefined;
  for (let angle = 0; angle < 180; angle += STEP) {
    const a = angle * RAD;
    // The outline turned so that the direction `angle` (counter-clockwise from east) lies along x.
    const turned = points.map(([x, y]): Pt => [x * Math.cos(a) + y * Math.sin(a), -x * Math.sin(a) + y * Math.cos(a)]);
    const { w, h, at } = largestRectangle(turned);
    areas.push(w * h);
    if (best === undefined || w * h > best.area * 1.005 || (w * h >= best.area * 0.995 && w / h > best.w / best.h)) best = { area: w * h, angle, w, h, at };
  }
  if (best === undefined || best.area === 0) throw new Error("a building needs room for a rectangle");
  const a = best.angle * RAD;
  const centre: Pt = [best.at[0] * Math.cos(a) - best.at[1] * Math.sin(a), best.at[0] * Math.sin(a) + best.at[1] * Math.cos(a)];
  // The long side runs along `angle` when it is the width, and at a right angle to it when it is the height; a heading is clockwise from north.
  const along = best.w >= best.h ? best.angle : best.angle + 90;
  return { heading: (((90 - along) % 180) + 180) % 180, length: Math.max(best.w, best.h), width: Math.min(best.w, best.h), centre, strength: Math.max(...areas) / Math.min(...areas) };
}
