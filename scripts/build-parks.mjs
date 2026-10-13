// Writes src/parks.data.ts from scripts/parks.data.json.
//
// The JSON is made by hand from the fence distances that the English and Japanese Wikipedia articles of each ballpark
// publish (a distance is a fact; no text, table or picture of the articles is copied), at the revision each entry names.
// Each point is [angle, distance]: the angle from dead centre field (negative to the left field line, positive to the
// right) that our reading of the figure's label gives, and the distance at the unit the entry names. The articles give
// distances, not directions, so the angles are ours. Every park carries its Wikidata item (`wikidata`), the key to join it
// to other data; a past MLB park carries the first and last season an MLB club called it home (`from`, `to`), and the
// fences an article dates as `periods`. See docs/references.md and NOTICE.md.
import { readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";

const parks = JSON.parse(readFileSync(new URL("./parks.data.json", import.meta.url), "utf8"));
const ids = new Set();
const items = new Set();
const checkFence = (park, points, what) => {
  const angles = points.map((point) => point[0]);
  if (angles.some((angle, i) => i > 0 && angle <= angles[i - 1])) throw new Error(`${park.id}: the angles of ${what} must rise`);
  if (angles[0] !== -45 || angles.at(-1) !== 45) throw new Error(`${park.id}: ${what} runs from line to line`);
};
for (const park of parks) {
  if (ids.has(park.id)) throw new Error(`${park.id} is listed twice`);
  ids.add(park.id);
  if (!/^Q[1-9]\d*$/.test(park.wikidata ?? "")) throw new Error(`${park.id} needs its Wikidata item`);
  if (items.has(park.wikidata)) throw new Error(`${park.id}: ${park.wikidata} is another park's item`);
  items.add(park.wikidata);
  if (!["current", "secondary", "past"].includes(park.status)) throw new Error(`${park.id}: status ${park.status}`);
  if (!(park.en || park.ja)) throw new Error(`${park.id} cites no source`);
  checkFence(park, park.points, "the fence");
  if (park.league === "MLB" && park.status === "past" && !(Number.isInteger(park.from) && Number.isInteger(park.to) && park.from <= park.to)) throw new Error(`${park.id}: a past MLB park gives the seasons it was used`);
  let last = -Infinity;
  for (const period of park.periods ?? []) {
    if (!(Number.isInteger(period.from) && Number.isInteger(period.to) && period.from <= period.to)) throw new Error(`${park.id}: a period gives its first and last season`);
    if (period.from <= last) throw new Error(`${park.id}: the periods must follow one another`);
    if (park.from !== undefined && (period.from < park.from || period.to > park.to)) throw new Error(`${park.id}: a period lies outside the seasons the park was used`);
    last = period.to;
    checkFence(park, period.points, `the fence of ${period.from}`);
  }
}
const compact = (json) => json.replace(/\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g, "[$1, $2]");
const text = `// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand.
// Fence distances are facts published in the articles each entry cites; see docs/references.md.
import type { ParkData } from "./parks.ts";

export const PARK_DATA: ParkData[] = ${compact(JSON.stringify(parks, null, 2))};
`;
writeFileSync(new URL("../src/parks.data.ts", import.meta.url), text);
console.log(`src/parks.data.ts: ${parks.length} parks`);
