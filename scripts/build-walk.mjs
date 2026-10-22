// Writes src/walk.data.ts from the dated files under data-sources/walk/ and scripts/walk.data.json (`pnpm walk`): for each district, the walkable mask its crowds outside the venues stand on.
//
// THE MASK IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It is made from what OpenStreetMap maps within `radiusMetres` of the district's venues
// (the raw answer is kept as it came in data-sources/walk/<date>/osm-<district>.json) by the rules of scripts/walk-rules.mjs: the paths, sidewalks, plazas, squares, parks and platforms people stand on, and what stops a
// crowd (carriageways at the width their lanes give them, cycle tracks, railways, water, buildings). The features are laid flat in metres from the district's origin, simplified to 30 centimetres and written as whole
// quarter-metres, as lines with a width and as rings, with nothing else copied (no name, no id, no tag). The mask itself (the cells people may stand in) is worked out from them when a crowd is asked for
// (src/outside.mask.ts). Nothing here is drawn on a page: the roads are never drawn, and the crowd's shape is what shows them.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";
import { districtMember } from "../src/district.ts";
import { metresFrom, middleOf, simplified } from "../src/venues.geo.ts";
import { classify } from "./walk-rules.mjs";

const config = JSON.parse(readFileSync(new URL("./walk.data.json", import.meta.url), "utf8"));
const root = new URL("../data-sources/walk/", import.meta.url);
const UNIT = 0.25;
const TOLERANCE = 0.3;
const fail = (message) => {
  throw new Error(message);
};

/** The newest day under data-sources/walk/ that holds the district's file. */
function newest(id) {
  const days = readdirSync(root).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && existsSync(new URL(`${d}/osm-${id}.json`, root))).sort();
  if (days.length === 0) fail(`no data-sources/walk/<date>/osm-${id}.json: run \`pnpm walk:fetch\``);
  return days[days.length - 1];
}

/** The rings a way or a relation is: a closed way is one; a multipolygon's outer and inner ways are joined end to end. Lines (open ways) are `lines`. */
function geometryOf(element) {
  const point = (p) => [p.lon, p.lat];
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  if (element.type === "way") {
    const line = (element.geometry ?? []).map(point);
    return line.length > 3 && same(line[0], line[line.length - 1]) ? { rings: [{ role: "outer", points: line }], line } : { rings: [], line };
  }
  const parts = { outer: [], inner: [] };
  for (const m of element.members ?? []) if (m.type === "way" && (m.role === "outer" || m.role === "inner") && (m.geometry ?? []).length > 1) parts[m.role].push(m.geometry.map(point));
  const rings = [];
  for (const role of ["outer", "inner"]) {
    const pool = parts[role];
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
      if (same(ring[0], ring[ring.length - 1]) && ring.length > 3) rings.push({ role, points: ring });
    }
  }
  return { rings, line: [] };
}

/** Douglas-Peucker on an open line, in metres. */
function simplifiedLine(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const run = (from, to) => {
    const [p, q] = [points[from], points[to]];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    let at = -1;
    let most = tolerance;
    for (let i = from + 1; i < to; i += 1) {
      const r = points[i];
      const d = len < 1e-9 ? Math.hypot(r[0] - p[0], r[1] - p[1]) : Math.abs((q[0] - p[0]) * (p[1] - r[1]) - (p[0] - r[0]) * (q[1] - p[1])) / len;
      if (d > most) [at, most] = [i, d];
    }
    if (at >= 0) {
      keep[at] = true;
      run(from, at);
      run(at, to);
    }
  };
  run(0, points.length - 1);
  return points.filter((_, i) => keep[i]);
}

/** Whole units from the first point, then the step from each point to the next: `[x0, y0, dx, dy, ...]`. */
function packed(points) {
  const whole = points.map(([x, y]) => [Math.round(x / UNIT), Math.round(y / UNIT)]);
  const out = [];
  let prev = [0, 0];
  whole.forEach((p, i) => {
    if (i === 0 || p[0] !== prev[0] || p[1] !== prev[1]) out.push(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  });
  return out;
}

const built = {};
const days = new Set();
for (const district of config.districts) {
  const day = newest(district.id);
  days.add(day);
  const raw = JSON.parse(readFileSync(new URL(`${day}/osm-${district.id}.json`, root), "utf8"));
  const members = district.venues.map((key) => districtMember(key));
  const origin = middleOf(members.map((m) => m.centre));
  const roundedOrigin = origin.map((x) => Math.round(x * 1e6) / 1e6);
  const flat = (points) => metresFrom(roundedOrigin, points);
  const corners = flat([[raw.box[1], raw.box[0]], [raw.box[3], raw.box[2]]]);
  const box = [Math.floor(corners[0][0]), Math.floor(corners[0][1]), Math.ceil(corners[1][0]), Math.ceil(corners[1][1])];
  const touches = (points, margin) => points.some(([x, y]) => x >= box[0] - margin && x <= box[2] + margin && y >= box[1] - margin && y <= box[3] + margin);
  const out = { walkLines: [], walkAreas: [], blockLines: [], blockAreas: [] };
  const counted = {};
  for (const element of raw.elements) {
    const tags = element.tags ?? {};
    const { rings, line } = geometryOf(element);
    const closed = rings.length > 0 && element.type === "way";
    const verdict = classify(tags, closed);
    if (verdict === null) continue;
    counted[verdict.kind] = (counted[verdict.kind] ?? 0) + 1;
    if (verdict.kind.endsWith("-line")) {
      // A closed ring tagged as a line (a loop path) stays a line.
      const points = line.length > 0 ? line : rings.flatMap((r) => r.points);
      const metres = flat(points);
      if (!touches(metres, verdict.width)) continue;
      out[verdict.kind === "walk-line" ? "walkLines" : "blockLines"].push([Math.round(verdict.width * 10), ...packed(simplifiedLine(metres, TOLERANCE))]);
    } else {
      const outers = rings.filter((r) => r.role === "outer");
      if (outers.length === 0) continue;
      // Each outer ring with the inner rings inside it (a multipolygon with several outers is several polygons; inners go with the outer that holds them).
      const polygons = outers.map((outer) => ({ outer: flat(outer.points), inners: [] }));
      for (const inner of rings.filter((r) => r.role === "inner")) {
        const ring = flat(inner.points);
        const home = polygons.find((p) => insideRing(p.outer, ring[0])) ?? polygons[0];
        home.inners.push(ring);
      }
      for (const polygon of polygons) {
        if (!touches(polygon.outer, 0)) continue;
        const ring = (points) => packed(simplified(points, TOLERANCE));
        out[verdict.kind === "walk-area" ? "walkAreas" : "blockAreas"].push([ring(polygon.outer), ...polygon.inners.map(ring)]);
      }
    }
  }
  function insideRing(points, [x, y]) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  built[district.id] = { source: `data-sources/walk/${day}/osm-${district.id}.json`, read: raw.read, base: raw.osmBase, venues: district.venues, origin: roundedOrigin, box, ...out };
  console.log(`${district.id}: ${Object.entries(counted).map(([k, n]) => `${n} ${k}`).join(", ")}; kept ${out.walkLines.length} walk lines, ${out.walkAreas.length} walk areas, ${out.blockLines.length} block lines, ${out.blockAreas.length} block areas`);
}

const entry = (id, d) => `  ${JSON.stringify(id)}: {
    "source": ${JSON.stringify(d.source)},
    "read": ${JSON.stringify(d.read)},
    "base": ${JSON.stringify(d.base)},
    "licence": "ODbL-1.0",
    "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
    "venues": ${JSON.stringify(d.venues)},
    "origin": ${JSON.stringify(d.origin)},
    "box": ${JSON.stringify(d.box)},
    "walkLines": [
${d.walkLines.map((l) => `      ${JSON.stringify(l)}`).join(",\n")}
    ],
    "walkAreas": [
${d.walkAreas.map((l) => `      ${JSON.stringify(l)}`).join(",\n")}
    ],
    "blockLines": [
${d.blockLines.map((l) => `      ${JSON.stringify(l)}`).join(",\n")}
    ],
    "blockAreas": [
${d.blockAreas.map((l) => `      ${JSON.stringify(l)}`).join(",\n")}
    ],
  },`;

const text = `// Made by scripts/build-walk.mjs from the files of data-sources/walk/ (read ${[...days].join(", ")}): do not edit by hand.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds, for each district, what a crowd outside its venues is stopped by or can stand on, as
// OpenStreetMap maps it within ${config.radiusMetres} metres of the venues: lines with a width (the paths and sidewalks people walk on; the carriageways, cycle tracks and railways that stop a crowd) and areas (the plazas, squares, parks
// and platforms people stand on; the buildings and the water that stop it), laid flat in metres from the district's origin, simplified to 30 centimetres and written in whole quarter-metres: a feature is its
// first point and then the step to each next one. The package is MIT; this file is a derived database under the ODbL, offered under it with the credit above. The crowds and drawings made from it are produced works
// and need only the credit (\`VENUE_ATTRIBUTION\`). Nothing in a CC0 or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/walk/.
import type { WalkData } from "./walk.ts";

/** The metres one whole number of the mask's coordinates is. */
export const WALK_UNIT = ${UNIT};

export const WALK_DATA: Record<string, WalkData> = {
${Object.entries(built).map(([id, d]) => entry(id, d)).join("\n")}
};
`;
writeFileSync(new URL("../src/walk.data.ts", import.meta.url), text);
console.log(`src/walk.data.ts written, ${Math.round(text.length / 1024)} kB`);
