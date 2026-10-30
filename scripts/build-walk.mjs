// Writes src/walk/<district>.data.ts (one file for each district), src/walk.index.ts (every district with its venues and the import() of its file) and src/walk.data.ts (the table of them all) from the dated files under data-sources/walk/ and scripts/walk.data.json (`pnpm walk`): for each district, the walkable mask its crowds outside the venues stand on.
//
// THE MASK IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It is made from what OpenStreetMap maps within `radiusMetres` of the district's venues
// (the raw answer is kept as it came in data-sources/walk/<date>/osm-<district>.json) by the rules of scripts/walk-rules.mjs: the paths, sidewalks, plazas, squares, parks and platforms people stand on, and what stops a
// crowd (carriageways at the width their lanes give them, cycle tracks, railways, water, buildings). The features are laid flat in metres from the district's origin, simplified to 30 centimetres and written as whole
// quarter-metres, as lines with a width and as rings, with nothing else copied (no name, no id, no tag). The mask itself (the cells people may stand in) is worked out from them when a crowd is asked for
// (src/outside.mask.ts). Nothing here is drawn on a page: the roads are never drawn, and the crowd's shape is what shows them.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { URL } from "node:url";
// The venues the districts are made of, held for the drawing (the lean district holds none until it reads them); not the walk data, which this script writes.
import "../src/arenas.ts";
import "../src/parks.ts";
import "../src/grounds.ts";
import { districtMember } from "../src/district.ts";
import { WALK_UNIT } from "../src/walk.ts";
import { metresFrom, middleOf, simplified } from "../src/venues.geo.ts";
import { geometryOf, packed, simplifiedLine } from "./osm-geometry.mjs";
import { classify } from "./walk-rules.mjs";

const config = JSON.parse(readFileSync(new URL("./walk.data.json", import.meta.url), "utf8"));
const root = new URL("../data-sources/walk/", import.meta.url);
const UNIT = WALK_UNIT;
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
      out[verdict.kind === "walk-line" ? "walkLines" : "blockLines"].push([Math.round(verdict.width * 10), ...packed(simplifiedLine(metres, TOLERANCE), UNIT)]);
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
        const ring = (points) => packed(simplified(points, TOLERANCE), UNIT);
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

const entry = (d) => `{
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
  }`;

const licence = () => `// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds, for each district, what a crowd outside its venues is stopped by or can stand on, as
// OpenStreetMap maps it within ${config.radiusMetres} metres of the venues: lines with a width (the paths and sidewalks people walk on; the carriageways, cycle tracks and railways that stop a crowd) and areas (the plazas, squares, parks
// and platforms people stand on; the buildings and the water that stop it), laid flat in metres from the district's origin, simplified to 30 centimetres and written in whole quarter-metres: a feature is its
// first point and then the step to each next one. The package is MIT; this file is a derived database under the ODbL, offered under it with the credit above. The crowds and drawings made from it are produced works
// and need only the credit (\`VENUE_ATTRIBUTION\`). Nothing in a CC0 or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/walk/.`;
const ident = (id) => `walk_${id.replace(/\W/g, "_")}`;
const by = `scripts/build-walk.mjs from the files of data-sources/walk/ (read ${[...days].join(", ")})`;

// One file for each district: a page that draws one reads that district's file and not the others' (\`loadOutside\`, walk.ts).
const dir = new URL("../src/walk/", import.meta.url);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (const [id, d] of Object.entries(built)) {
  writeFileSync(new URL(`${id}.data.ts`, dir), `// Made by ${by}: do not edit by hand. One district of src/walk.data.ts, for a page that draws it.\n//\n${licence()}\nimport type { WalkData } from "../walk.ts";\n\nexport const WALK: WalkData = ${entry(d)};\n`);
}
writeFileSync(
  new URL("../src/walk.index.ts", import.meta.url),
  `// Made by ${by}: do not edit by hand.
// Every district there is a walkable mask for, with the venues it was made for and the one file that holds its data (\`walk/<district>.data.ts\`), read with a dynamic import() when a crowd outside is to be shown (see \`loadOutside\` in walk.ts).
import type { WalkData } from "./walk.ts";

export const WALK_INDEX: Readonly<Record<string, { readonly venues: readonly string[]; readonly load: () => Promise<{ readonly WALK: WalkData }> }>> = {
${Object.entries(built).map(([id, d]) => `  ${JSON.stringify(id)}: { venues: ${JSON.stringify(d.venues)}, load: () => import(${JSON.stringify(`./walk/${id}.data.ts`)}) },`).join("\n")}
};
`,
);

const text = `// Made by ${by}: do not edit by hand.
//
// Every district's data in one table, for the entries that have always had it (the lean district reads one district's file when it is asked to: \`loadOutside\`). The data is in \`walk/<district>.data.ts\`, one file each.
//
${licence()}
import { WALK_UNIT } from "./walk.ts";
import type { WalkData } from "./walk.ts";
${Object.keys(built).map((id) => `import { WALK as ${ident(id)} } from ${JSON.stringify(`./walk/${id}.data.ts`)};`).join("\n")}

export { WALK_UNIT };

export const WALK_DATA: Record<string, WalkData> = {
${Object.keys(built).map((id) => `  ${JSON.stringify(id)}: ${ident(id)},`).join("\n")}
};
`;
writeFileSync(new URL("../src/walk.data.ts", import.meta.url), text);
console.log(`src/walk.data.ts, src/walk.index.ts and src/walk/: ${Object.keys(built).length} district(s), ${Object.entries(built).map(([id, d]) => `${id} ${Math.round(entry(d).length / 1024)} kB`).join(", ")}`);
