// The crowd outside held to OpenStreetMap's own answer, not to the mask built from it: every person of the crowd at 100 percent is checked against the raw features of data-sources/walk/ with the rules of
// scripts/walk-rules.mjs and plain geometry. The mask is rasterised half a metre at a time from lines simplified to 30 centimetres and written in quarter-metres, so a person may stand up to a metre inside what
// would otherwise stop them, and no more.
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { describe, expect, it } from "vitest";
import { classify } from "../scripts/walk-rules.mjs";
import { districtMember, planDistrict } from "./district.ts";
import { outsideCrowd } from "./outside.ts";
import { WALK_DATA } from "./walk.data.ts";
import { metresFrom } from "./venues.geo.ts";

const FEET = 3.28084;
/** How far past an edge a person may stand because the mask is made of half-metre cells from simplified lines, in metres. */
const SLACK = 1;

const data = WALK_DATA.vancouver;
const raw = JSON.parse(readFileSync(new URL(`../${data.source}`, import.meta.url), "utf8"));
const flat = (points) => metresFrom(data.origin, points.map((p) => [p.lon, p.lat]));

/** The rings of a way or a multipolygon relation: the way if it is closed; the outer and inner members joined end to end. */
function ringsOf(element) {
  const same = (a, b) => a.lat === b.lat && a.lon === b.lon;
  if (element.type === "way") {
    const g = element.geometry ?? [];
    return g.length > 3 && same(g[0], g[g.length - 1]) ? [{ role: "outer", points: flat(g) }] : [];
  }
  const out = [];
  for (const role of ["outer", "inner"]) {
    const pool = (element.members ?? []).filter((m) => m.type === "way" && m.role === role && (m.geometry ?? []).length > 1).map((m) => [...m.geometry]);
    while (pool.length > 0) {
      const ring = pool.shift();
      while (!same(ring[0], ring[ring.length - 1])) {
        const tail = ring[ring.length - 1];
        const next = pool.findIndex((part) => same(part[0], tail) || same(part[part.length - 1], tail));
        if (next < 0) break;
        const [part] = pool.splice(next, 1);
        if (!same(part[0], tail)) part.reverse();
        ring.push(...part.slice(1));
      }
      if (same(ring[0], ring[ring.length - 1]) && ring.length > 3) out.push({ role, points: flat(ring) });
    }
  }
  return out;
}

/** The features of the raw answer by what a crowd does with them: lines with a half width, and polygons (every ring, a point is inside by the even-odd rule). */
const features = { walkLines: [], walkAreas: [], blockLines: [], blockAreas: [] };
for (const element of raw.elements) {
  const tags = element.tags ?? {};
  const closed = element.type === "way" && (element.geometry ?? []).length > 3 && element.geometry[0].lat === element.geometry.at(-1).lat && element.geometry[0].lon === element.geometry.at(-1).lon;
  const verdict = classify(tags, closed);
  if (verdict === null) continue;
  if (verdict.kind.endsWith("-line")) features[verdict.kind === "walk-line" ? "walkLines" : "blockLines"].push({ points: flat(element.geometry ?? []), half: verdict.width / 2 });
  else {
    const rings = ringsOf(element);
    if (rings.length > 0) features[verdict.kind === "walk-area" ? "walkAreas" : "blockAreas"].push(rings.map((r) => r.points));
  }
}

const distanceToSegment = (px, py, [ax, ay], [bx, by]) => {
  const [dx, dy] = [bx - ax, by - ay];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
const insideRing = (ring, x, y) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const edgeDistance = (ring, x, y) => Math.min(...ring.map((p, i) => distanceToSegment(x, y, ring[(i + ring.length - 1) % ring.length], p)));

/** A grid of 25-metre cells over line segments, so that a person is tested against the lines near it only. */
function indexed(lines) {
  const cells = new Map();
  for (const line of lines) {
    for (let i = 0; i + 1 < line.points.length; i += 1) {
      const [a, b] = [line.points[i], line.points[i + 1]];
      const reach = line.half + SLACK + 1;
      for (let cx = Math.floor((Math.min(a[0], b[0]) - reach) / 25); cx <= Math.floor((Math.max(a[0], b[0]) + reach) / 25); cx += 1) {
        for (let cy = Math.floor((Math.min(a[1], b[1]) - reach) / 25); cy <= Math.floor((Math.max(a[1], b[1]) + reach) / 25); cy += 1) {
          const key = `${cx},${cy}`;
          if (!cells.has(key)) cells.set(key, []);
          cells.get(key).push({ a, b, half: line.half });
        }
      }
    }
  }
  return (x, y) => cells.get(`${Math.floor(x / 25)},${Math.floor(y / 25)}`) ?? [];
}
/** Polygons (lists of rings) with their boxes; `insidePolygon` is the even-odd rule over every ring, and `edgeOf` the distance to the nearest edge of any ring. */
const polygons = (list) => list.map((rings) => ({ rings, x0: Math.min(...rings.flat().map((p) => p[0])), x1: Math.max(...rings.flat().map((p) => p[0])), y0: Math.min(...rings.flat().map((p) => p[1])), y1: Math.max(...rings.flat().map((p) => p[1])) }));
const nearPolygons = (list, x, y, margin) => list.filter((r) => x >= r.x0 - margin && x <= r.x1 + margin && y >= r.y0 - margin && y <= r.y1 + margin);
const insidePolygon = (poly, x, y) => poly.rings.reduce((inside, ring) => (insideRing(ring, x, y) ? !inside : inside), false);
const edgeOf = (poly, x, y) => Math.min(...poly.rings.map((ring) => edgeDistance(ring, x, y)));

const plan = planDistrict({ venues: ["bc-place", "rogers-arena"] });
const crowd = outsideCrowd(plan);
const [shiftX, shiftY] = metresFrom(plan.origin, [data.origin])[0];
/** The people in metres east and north of the mask's origin. */
const people = Array.from({ length: crowd.count }, (_, i) => [crowd.x[i] / FEET - shiftX, -crowd.y[i] / FEET - shiftY]);
const venueRings = polygons(data.venues.map((key) => [metresFrom(data.origin, districtMember(key).ring)]));
const buildings = [...polygons(features.blockAreas), ...venueRings];

describe("the raw answer of OpenStreetMap the mask was made from", () => {
  it("has the features the rules look for: carriageways, buildings, sidewalks and paths, plazas", () => {
    expect(features.blockLines.length).toBeGreaterThan(300);
    expect(features.blockAreas.length).toBeGreaterThan(150);
    expect(features.walkLines.length).toBeGreaterThan(400);
    expect(features.walkAreas.length).toBeGreaterThan(20);
  });
});

describe("the crowd at 100 percent, against what OpenStreetMap maps", () => {
  it("never stands on a carriageway, a cycle track or a railway", () => {
    const near = indexed(features.blockLines);
    const on = people.filter(([x, y]) => near(x, y).some(({ a, b, half }) => distanceToSegment(x, y, a, b) < half - SLACK));
    expect(on).toHaveLength(0);
  });

  it("never stands inside a building (the venues' own included) or in water", () => {
    const inside = people.filter(([x, y]) => nearPolygons(buildings, x, y, 0).some((b) => insidePolygon(b, x, y) && edgeOf(b, x, y) > SLACK));
    expect(inside).toHaveLength(0);
  });

  it("stands on ground someone may stand on: within a path's width, inside a plaza, square, park or platform, or in the band round a venue", () => {
    const near = indexed(features.walkLines);
    const areas = polygons(features.walkAreas);
    const off = people.filter(([x, y]) => {
      if (near(x, y).some(({ a, b, half }) => distanceToSegment(x, y, a, b) <= half + SLACK)) return false;
      if (nearPolygons(areas, x, y, SLACK).some((r) => insidePolygon(r, x, y) || edgeOf(r, x, y) <= SLACK)) return false;
      return !venueRings.some((v) => edgeOf(v, x, y) <= 5 + SLACK);
    });
    expect(off).toHaveLength(0);
  });
});
