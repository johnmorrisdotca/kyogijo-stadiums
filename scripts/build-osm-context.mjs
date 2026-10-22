// Writes src/osm.context.data.ts from the dated files under data-sources/walk/ (`pnpm osm-context`): the buildings and the streets round a district, as the `context` a district takes (src/context.ts), made from OpenStreetMap.
//
// THE DATA IS ODbL 1.0 FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It is the same raw answer the walkable mask is made from (scripts/fetch-walk.mjs: everything mapped within
// 350 metres of the venues), read a second way. `buildings` holds each building's outline (simplified to 60 centimetres, on a half-metre grid) and its height: the `height` OpenStreetMap maps, else its `building:levels` at
// 3.2 metres, else 10 metres, which is ours (and `docs/district.md` says so). `streets` holds the carriageways, the viaducts and bridges, the railways and the sidewalks and paths, each a line with a width, for the district's
// floor. No name, id or tag is copied. A venue's own building is in the answer too, and the district leaves out whatever is a venue's.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";
import { districtMember } from "../src/district.ts";
import { metresFrom, middleOf, simplified } from "../src/venues.geo.ts";
import { geometryOf, packed, simplifiedLine } from "./osm-geometry.mjs";
import { buildingHeight, classify, streetOf } from "./walk-rules.mjs";

const config = JSON.parse(readFileSync(new URL("./walk.data.json", import.meta.url), "utf8"));
const root = new URL("../data-sources/walk/", import.meta.url);
const GRID = 0.5;
/** The height of a building that maps neither a height nor its levels, in metres: ours. */
const DEFAULT_HEIGHT = 10;
const NAMES = { vancouver: { en: "Downtown Vancouver, round BC Place and Rogers Arena", ja: "バンクーバーのダウンタウン（BCプレイスとロジャーズ・アリーナの周辺）" } };

const newest = (id) => {
  const days = readdirSync(root).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && existsSync(new URL(`${d}/osm-${id}.json`, root))).sort();
  if (days.length === 0) throw new Error(`no data-sources/walk/<date>/osm-${id}.json: run \`pnpm walk:fetch\``);
  return days[days.length - 1];
};

const areas = {};
for (const district of config.districts) {
  const day = newest(district.id);
  const raw = JSON.parse(readFileSync(new URL(`${day}/osm-${district.id}.json`, root), "utf8"));
  const origin = middleOf(district.venues.map((key) => districtMember(key).centre)).map((x) => Math.round(x * 1e6) / 1e6);
  const flat = (points) => metresFrom(origin, points);
  const buildings = [];
  const streets = [];
  let untagged = 0;
  for (const element of raw.elements) {
    const tags = element.tags ?? {};
    const { rings, line } = geometryOf(element);
    if (tags.building !== undefined && classify(tags, true)?.kind === "block-area") {
      const outer = rings.find((r) => r.role === "outer");
      if (outer === undefined) continue;
      let height = buildingHeight(tags);
      if (height === null) {
        height = DEFAULT_HEIGHT;
        untagged += 1;
      }
      const ring = simplified(flat(outer.points), 0.6);
      if (ring.length < 3) continue;
      buildings.push([Math.round(height / GRID), 0, ...packed(ring, GRID)]);
      continue;
    }
    const street = streetOf(tags);
    if (street === null || line.length < 2) continue;
    streets.push([street.kind, Math.max(1, Math.round(street.width / GRID)), ...packed(simplifiedLine(flat(line), 0.6), GRID)]);
  }
  areas[district.id] = { day, raw, origin, buildings, streets, untagged };
  console.log(`${district.id}: ${buildings.length} buildings (${untagged} with no height mapped), ${streets.length} streets`);
}

const entry = (id, a) => `  ${JSON.stringify(id)}: {
    key: ${JSON.stringify(id)},
    name: ${JSON.stringify(NAMES[id])},
    origin: ${JSON.stringify(a.origin)},
    radius: ${config.radiusMetres},
    grid: ${GRID},
    landmark: 1000,
    layers: {
      buildings: {
        source: ${JSON.stringify(`OpenStreetMap through the Overpass API, data-sources/walk/${a.day}/osm-${id}.json: the buildings (a height, else levels at 3.2 metres, else ${DEFAULT_HEIGHT} metres, ours)`)},
        read: ${JSON.stringify(a.raw.read)},
        licence: "ODbL-1.0",
        attribution: OSM_ATTRIBUTION,
        rows: [
${a.buildings.map((r) => `          ${JSON.stringify(r)}`).join(",\n")}
        ],
      },
      streets: {
        source: ${JSON.stringify(`OpenStreetMap through the Overpass API, data-sources/walk/${a.day}/osm-${id}.json: the carriageways, viaducts and bridges, railways, sidewalks and paths (kind 0 to 3, then the width, in grid steps)`)},
        read: ${JSON.stringify(a.raw.read)},
        licence: "ODbL-1.0",
        attribution: OSM_ATTRIBUTION,
        rows: [
${a.streets.map((r) => `          ${JSON.stringify(r)}`).join(",\n")}
        ],
      },
    },
  },`;

const text = `// Made by scripts/build-osm-context.mjs from the files of data-sources/walk/ (read ${[...new Set(Object.values(areas).map((a) => a.day))].join(", ")}): do not edit by hand.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds the buildings (outline, height) and the streets (carriageways, viaducts, railways, sidewalks and paths,
// each a line with a width) within ${config.radiusMetres} metres of a district's venues, as data a district takes in its \`context\` option (\`src/context.ts\`). Nothing is a tile or a request. The package is MIT; this file is a derived database under the ODbL,
// offered under it with the credit above, kept apart from every CC0 and CC BY-SA file of the package and from the PLATEAU data of Tokyo. The raw responses are in data-sources/walk/.
import type { ContextArea } from "./context.ts";

/** The credit that goes with a drawing made from these buildings and streets, in each language. */
export const OSM_ATTRIBUTION = { en: "Buildings and streets: (c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright", ja: "建物と道路：(c) OpenStreetMap contributors（ODbL 1.0、openstreetmap.org/copyright）" };

/** The buildings and streets round each district that has a mask, by key. */
export const OSM_AREAS: Record<string, ContextArea> = {
${Object.entries(areas).map(([id, a]) => entry(id, a)).join("\n")}
};

/** Downtown Vancouver round BC Place and Rogers Arena. */
export const VANCOUVER_CENTRE: ContextArea = OSM_AREAS.vancouver;
`;
writeFileSync(new URL("../src/osm.context.data.ts", import.meta.url), text);
console.log(`src/osm.context.data.ts written, ${Math.round(text.length / 1024)} kB`);
