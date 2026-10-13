// Writes src/parks.data.ts from scripts/parks.data.json.
//
// The JSON is made by hand from the fence distances that the English and Japanese Wikipedia articles of each ballpark
// publish (a distance is a fact; no text, table or picture of the articles is copied), at the revision each entry names.
// Each point is [angle, distance]: the angle from dead centre field (negative to the left field line, positive to the
// right) that our reading of the figure's label gives, and the distance at the unit the entry names. The articles give
// distances, not directions, so the angles are ours. See docs/references.md and NOTICE.md.
import { readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";

const parks = JSON.parse(readFileSync(new URL("./parks.data.json", import.meta.url), "utf8"));
const ids = new Set();
for (const park of parks) {
  if (ids.has(park.id)) throw new Error(`${park.id} is listed twice`);
  ids.add(park.id);
  if (!(park.en || park.ja)) throw new Error(`${park.id} cites no source`);
  const angles = park.points.map((point) => point[0]);
  if (angles.some((angle, i) => i > 0 && angle <= angles[i - 1])) throw new Error(`${park.id}: the angles must rise`);
  if (angles[0] !== -45 || angles.at(-1) !== 45) throw new Error(`${park.id}: a fence runs from line to line`);
}
const compact = (json) => json.replace(/\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g, "[$1, $2]");
const text = `// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand.
// Fence distances are facts published in the articles each entry cites; see docs/references.md.
import type { ParkData } from "./parks.ts";

export const PARK_DATA: ParkData[] = ${compact(JSON.stringify(parks, null, 2))};
`;
writeFileSync(new URL("../src/parks.data.ts", import.meta.url), text);
console.log(`src/parks.data.ts: ${parks.length} parks`);
