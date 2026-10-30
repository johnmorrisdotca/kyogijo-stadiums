// Writes src/parks.data.ts from scripts/parks.data.json.
//
// The JSON is made by hand from the fence distances that the English and Japanese Wikipedia articles of each ballpark
// publish (a distance is a fact; no text, table or picture of the articles is copied), at the revision each entry names.
// Each point is [angle, distance]: the angle from dead centre field (negative to the left field line, positive to the
// right) that our reading of the figure's label gives, and the distance at the unit the entry names. The articles give
// distances, not directions, so the angles are ours. Every park carries its Wikidata item (`wikidata`), the key to join it
// to other data; a past MLB park carries the first and last season an MLB club called it home (`from`, `to`), and the
// fences an article dates as `periods`. Its coordinates (`lat`, `lon`) and the years it opened and closed (`opened`, `closed`) are
// Wikidata's (P625, P1619 or P571, P3999 or P576; CC0), written by scripts/fetch-park-coordinates.mjs. A park may also carry what its article
// gives beyond the distances, each fact read at the same revision: `labels` (the words the article uses for the points its text adds), `walls`
// (how high the fence stands along a stretch, in the park's unit), `quirks` (a hill, an overhang, a pole, the bullpens, ivy), `track_ft` and
// `backstop_ft` (the warning track's width and the distance to the backstop), and `dugouts` (the sides). Where an article has no figure the
// park has no such key and keeps the plain drawing. The names: `name` is the everyday name in English and `nameJa` in Japanese (with `readingJa` in kana where it
// has kanji), `localName` the everyday name in the language of the place, and `aliases` every other name with where it was read (the titles of the articles the park
// cites, its official, sponsor and former names with their years, its nicknames); scripts/fetch-names.mjs writes the evidence in scripts/names.wikidata.json and
// scripts/names-lib.mjs holds each entry to the rules of docs/ballparks.md ("Names"). See docs/references.md and NOTICE.md.
import { readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";
import { checkNames } from "./names-lib.mjs";
import { writeVenueFiles } from "./venue-files.mjs";

const parks = JSON.parse(readFileSync(new URL("./parks.data.json", import.meta.url), "utf8"));
const ids = new Set();
const items = new Set();
const checkFence = (park, points, what) => {
  const angles = points.map((point) => point[0]);
  if (angles.some((angle, i) => i > 0 && angle <= angles[i - 1])) throw new Error(`${park.id}: the angles of ${what} must rise`);
  if (angles[0] !== -45 || angles.at(-1) !== 45) throw new Error(`${park.id}: ${what} runs from line to line`);
};
const seasons = (park, thing, what) => {
  for (const key of ["first", "last"]) if (thing[key] !== undefined && !(Number.isInteger(thing[key]) && thing[key] >= 1850 && thing[key] <= 2100)) throw new Error(`${park.id}: ${what} gives a season as ${key}`);
  if (thing.first !== undefined && thing.last !== undefined && thing.first > thing.last) throw new Error(`${park.id}: ${what} ends before it starts`);
};
const angle = (park, value, what) => {
  if (!(typeof value === "number" && value >= -45 && value <= 45)) throw new Error(`${park.id}: ${what} is an angle from -45 to 45`);
};
const positive = (park, value, what) => {
  if (!(typeof value === "number" && Number.isFinite(value) && value > 0)) throw new Error(`${park.id}: ${what} is a positive number`);
};
const PLACES = ["outfield", "left", "leftCenter", "center", "deadCenter", "rightCenter", "right", "leftToCenter", "centerToRight", "leftCorner", "rightCorner"];
const QUIRKS = { hill: ["angle", "feet", "width_ft"], overhang: ["from", "to", "depth_ft"], pole: ["angle", "feet"], flagpole: ["angle", "feet"], bullpen: ["angle", "feet"], ivy: ["from", "to"], basket: ["from", "to"] };
const checkExtras = (park) => {
  for (const [at, words] of park.labels ?? []) {
    angle(park, at, "a label");
    if (!park.points.some((point) => point[0] === at)) throw new Error(`${park.id}: the label at ${at} names no point`);
    if (typeof words !== "string" || words.trim() === "") throw new Error(`${park.id}: the label at ${at} is words`);
  }
  if (park.labels !== undefined && park.points.length !== park.labels.length) throw new Error(`${park.id}: a park that labels its points labels every one`);
  for (const wall of park.walls ?? []) {
    angle(park, wall.from, "a wall's start");
    angle(park, wall.to, "a wall's end");
    if (wall.from >= wall.to) throw new Error(`${park.id}: a wall runs from the left to the right`);
    positive(park, wall.height, "a wall's height");
    seasons(park, wall, "a wall");
    if (wall.place !== undefined && !PLACES.includes(wall.place)) throw new Error(`${park.id}: a wall's place is one of ${PLACES.join(", ")}`);
  }
  for (const quirk of park.quirks ?? []) {
    if (!Object.hasOwn(QUIRKS, quirk.kind)) throw new Error(`${park.id}: quirk ${quirk.kind}`);
    for (const key of QUIRKS[quirk.kind]) {
      if (key === "angle" || key === "from" || key === "to") angle(park, quirk[key], `a ${quirk.kind}'s ${key}`);
      else positive(park, quirk[key], `a ${quirk.kind}'s ${key}`);
    }
    if (park.unit !== "ft") throw new Error(`${park.id}: quirks are in feet`);
    if (quirk.side !== undefined && !(quirk.kind === "bullpen" && ["home", "visitors"].includes(quirk.side))) throw new Error(`${park.id}: only a bullpen is home's or the visitors'`);
    seasons(park, quirk, `a ${quirk.kind}`);
  }
  for (const key of ["track_ft", "backstop_ft"]) if (park[key] !== undefined) positive(park, park[key], key);
  for (const [who, side] of Object.entries(park.dugouts ?? {})) if (!["home", "visitors"].includes(who) || !["first", "third"].includes(side)) throw new Error(`${park.id}: dugouts name home and visitors and the first or the third base line`);
};
for (const park of parks) {
  if (ids.has(park.id)) throw new Error(`${park.id} is listed twice`);
  ids.add(park.id);
  if (!/^Q[1-9]\d*$/.test(park.wikidata ?? "")) throw new Error(`${park.id} needs its Wikidata item`);
  if (items.has(park.wikidata)) throw new Error(`${park.id}: ${park.wikidata} is another park's item`);
  items.add(park.wikidata);
  if (!(typeof park.lat === "number" && park.lat >= -90 && park.lat <= 90 && typeof park.lon === "number" && park.lon >= -180 && park.lon <= 180)) throw new Error(`${park.id}: the coordinates are missing or out of range (pnpm parks:coordinates fetches them)`);
  for (const key of ["opened", "closed"]) if (park[key] !== undefined && !(Number.isInteger(park[key]) && park[key] >= 1800 && park[key] <= 2100)) throw new Error(`${park.id}: ${key} is a year`);
  if (park.opened !== undefined && park.closed !== undefined && park.opened > park.closed) throw new Error(`${park.id}: it closed before it opened`);
  if (!["current", "secondary", "past"].includes(park.status)) throw new Error(`${park.id}: status ${park.status}`);
  if (!(park.en || park.ja)) throw new Error(`${park.id} cites no source`);
  checkNames(park, (message) => {
    throw new Error(message);
  });
  checkFence(park, park.points, "the fence");
  checkExtras(park);
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
const alias = (entry) => `{ ${Object.entries(entry).map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(", ")} }`;
// An alias is one line; the rest is JSON as it is laid out.
const layout = (value) => {
  const stash = [];
  return compact(JSON.stringify(value, (key, part) => (key === "aliases" && Array.isArray(part) ? part.map((entry) => `@@${stash.push(alias(entry)) - 1}@@`) : part), 2).replace(/"@@(\d+)@@"/g, (_, n) => stash[Number(n)]));
};
const json = layout(parks);
const text = `// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand.
// Fence distances are facts published in the articles each entry cites; see docs/references.md.
import type { ParkData } from "./parks.core.ts";

export const PARK_DATA: ParkData[] = ${json};
`;
writeFileSync(new URL("../src/parks.data.ts", import.meta.url), text);
// The parks none of whose fence has a wall height the article gives: `PARKS_WITHOUT_WALL_HEIGHTS`, which needs the key and not the table.
const without = parks.filter((park) => (park.walls ?? []).length === 0).map((park) => park.id);
writeVenueFiles({
  kind: "parks", type: "ParkData", constant: "PARK", index: "PARK_INDEX", records: parks, text: layout, by: "scripts/build-parks.mjs from scripts/parks.data.json",
  extra: `\n/** The keys of the parks whose article gives no wall height anywhere on the fence. */\nexport const PARK_IDS_WITHOUT_WALLS: readonly string[] = ${JSON.stringify(without)};\n`,
});
console.log(`src/parks.data.ts: ${parks.length} parks`);
