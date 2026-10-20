// Writes src/stadiums.data.ts, src/stadiums.osm.data.ts and the table of docs/stadiums.md from scripts/stadiums.data.json and the dated files under data-sources/stadiums/ (`pnpm stadiums`).
//
// The two data files are kept apart because their licences are, as the venues' are (scripts/build-venues.mjs): src/stadiums.data.ts holds facts (the seats of each configuration, the number of bowls, the kind of
// roof and its opening) with the Wikidata item or the English Wikipedia article and revision each was read from, and no text; src/stadiums.osm.data.ts holds what was read from OpenStreetMap (the building's
// outline, the roof's opening, the heights), which is ODbL 1.0 data, "(c) OpenStreetMap contributors", and says so at its head and on every entry. Nothing else is copied. The way the field lies is worked out from the
// opening (`smallestBox`) and is a derived fact of the same data. See docs/stadiums.md and NOTICE.md.
//
// The raw responses (`pnpm stadiums:fetch`) stay in data-sources/stadiums/<date>/ as they were returned, and this script reads the newest date (or the one given: `pnpm stadiums 2026-10-20`).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { areaOf, centroidOf, coreOf, lonLatFrom, metresFrom, middleOf, simplified, smallestBox } from "../src/venues.geo.ts";

const read = (name) => JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url), "utf8"));
const source = read("stadiums.data.json");
const grounds = read("grounds.data.json");
const root = new URL("../data-sources/stadiums/", import.meta.url);
const day = process.argv[2] ?? readdirSync(root).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().at(-1);
if (day === undefined) throw new Error("no data-sources/stadiums/<date>/ to read: run `pnpm stadiums:fetch` first");
const dir = new URL(`${day}/`, root);
const load = (name) => JSON.parse(readFileSync(new URL(name, dir), "utf8"));
const wikidata = load("wikidata.json").entities;
const wikipedia = load("wikipedia.json").articles;
const fail = (message) => {
  throw new Error(message);
};

const BASES = ["documented", "plausible"];
const ROOFS = ["cable", "fixed"];
const SOURCES = ["wikipedia", "wikidata"];
const CONFIGS = ["cfl", "soccer"];
const stadiums = source.stadiums;

/** The capacities of an item as Wikidata gives them (P1083). */
const capacities = (entity) => (entity.claims?.P1083 ?? []).map((claim) => Number(claim.mainsnak?.datavalue?.value?.amount));
/** The numbers of an infobox's capacity line, in the order it lists them. */
const listed = (line) => [...(line ?? "").matchAll(/\d{1,3}(?:,\d{3})+/g)].map((m) => Number(m[0].replace(/,/g, "")));

const ids = new Set();
for (const v of stadiums) {
  if (ids.has(v.id)) fail(`${v.id} is listed twice`);
  ids.add(v.id);
  const ground = grounds.find((g) => g.id === v.ground);
  if (ground === undefined) fail(`${v.id}: ${v.ground} is not a ground of scripts/grounds.data.json`);
  if (ground.wikidata !== v.wikidata) fail(`${v.id}: ${v.wikidata} is not the ground's item (${ground.wikidata})`);
  if (Math.abs(ground.lat - v.lat) > 1e-4 || Math.abs(ground.lon - v.lon) > 1e-4) fail(`${v.id}: the coordinates are not the ground's`);
  const item = wikidata[v.wikidata];
  if (item === undefined || item.missing !== undefined) fail(`${v.id}: Wikidata has no ${v.wikidata}`);
  if (item.sitelinks?.enwiki?.title !== v.en.title) fail(`${v.id}: the item's English article is ${item.sitelinks?.enwiki?.title}, not ${v.en.title}`);
  const article = wikipedia[v.id];
  if (article === undefined || article.title !== v.en.title) fail(`${v.id}: the archive has no article ${v.en.title}`);
  if (article.revision !== v.en.revision) fail(`${v.id}: the facts cite revision ${v.en.revision} but the archive read ${article.revision}`);
  const numbers = listed(article.infoboxCapacity);
  for (const key of CONFIGS) {
    const c = v.configs[key];
    if (c === undefined || c.sport !== key) fail(`${v.id}: configuration ${key}`);
    if (!(Number.isInteger(c.seats) && c.seats > 20000 && c.seats < 100000)) fail(`${v.id}/${key}: seats`);
    if (!SOURCES.includes(c.source) || typeof c.read !== "string" || c.read === "") fail(`${v.id}/${key}: source and read`);
    // A figure is on the infobox's capacity line (or is Wikidata's, where it says so).
    if (!(c.source === "wikidata" ? capacities(item).includes(c.seats) : numbers.includes(c.seats))) fail(`${v.id}/${key}: ${c.seats} is not what ${c.source} gives (${c.source === "wikidata" ? capacities(item).join(", ") : numbers.join(", ")})`);
  }
  if (!capacities(item).includes(v.configs.cfl.seats)) fail(`${v.id}: Wikidata gives ${capacities(item).join(", ")}, not ${v.configs.cfl.seats}`);
  const { tiers, roof } = v;
  if (![1, 2, 3].includes(tiers.count) || !BASES.includes(tiers.basis) || typeof tiers.read !== "string") fail(`${v.id}: tiers`);
  if (tiers.lowerSeats !== undefined && !(tiers.count > 1 && numbers.includes(tiers.lowerSeats) && tiers.lowerSeats < Math.min(...CONFIGS.map((k) => v.configs[k].seats)) * 0.8)) fail(`${v.id}: lowerSeats`);
  if (!ROOFS.includes(roof.kind) || !BASES.includes(roof.basis) || typeof roof.read !== "string") fail(`${v.id}: roof`);
}

// ---- What OpenStreetMap gave. ----
const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;
const osm = {};
for (const v of stadiums) {
  const file = `osm-${v.id}.json`;
  if (!existsSync(new URL(file, dir))) fail(`${v.id}: ${file} is not in ${day}: run \`pnpm stadiums:fetch\``);
  const raw = load(file);
  if (raw.wikidata !== v.wikidata) fail(`${v.id}: ${file} is for ${raw.wikidata}`);
  const closed = (g) => Array.isArray(g) && g.length > 3 && g[0].lat === g.at(-1).lat && g[0].lon === g.at(-1).lon;
  const ringOf = (g) => g.slice(0, -1).map((p) => [p.lon, p.lat]);
  const building = raw.elements.filter((e) => e.type === "way" && e.tags?.wikidata === v.wikidata && closed(e.geometry));
  if (building.length !== 1) fail(`${v.id}: ${building.length} closed ways carry ${v.wikidata}; a relation or a split building needs a rule of its own`);
  const outline = building[0];
  const origin = middleOf(ringOf(outline.geometry));
  const metres = metresFrom(origin, ringOf(outline.geometry));
  const kept = simplified(metres, 1);
  const lonlat = (g, o, tolerance) => {
    const m = metresFrom(o, ringOf(g));
    const k = simplified(m, tolerance);
    return ringOf(g).filter((_, i) => k.some((p) => p === m[i])).map(([lon, lat]) => [round(lon, 6), round(lat, 6)]);
  };
  const ring = ringOf(outline.geometry).filter((_, i) => kept.some((k) => k === metres[i])).map(([lon, lat]) => [round(lon, 6), round(lat, 6)]);
  // The roof: a multipolygon of its band (outer) and the opening over the field (inner).
  const relation = raw.elements.find((e) => e.type === "relation" && e.id === v.roofRelation);
  if (v.roofRelation !== undefined && relation === undefined) fail(`${v.id}: the roof relation ${v.roofRelation} is not in ${file}`);
  const opening = relation?.members?.find((m) => m.role === "inner" && closed(m.geometry));
  const roofOuter = relation?.members?.find((m) => m.role === "outer" && closed(m.geometry));
  const height = Number(relation?.tags?.height ?? outline.tags.height);
  const roofHeight = Number(relation?.tags?.["roof:height"]);
  // The axis: from the opening where OpenStreetMap maps it (the article says it is the field's size), else the building's main hall, else none.
  let axis;
  if (opening !== undefined) {
    const m = metresFrom(origin, ringOf(opening.geometry));
    const box = smallestBox(m);
    axis = { heading: round(box.heading, 1), basis: "opening", strength: round(coreOf(metres).strength, 2), elongation: round(box.length / box.width, 2), centre: lonLatFrom(origin, centroidOf(m)).map((x) => round(x, 6)) };
    const openingSize = { length: box.length, width: box.width };
    const said = v.roof.opening;
    if (said !== undefined && (Math.abs(openingSize.length - said.length) / said.length > 0.05 || Math.abs(openingSize.width - said.width) / said.width > 0.05)) fail(`${v.id}: the mapped opening is ${openingSize.length.toFixed(1)} by ${openingSize.width.toFixed(1)} m, the article says ${said.length} by ${said.width}`);
  } else {
    const core = coreOf(metresFrom(origin, ring));
    axis = { heading: round(core.heading, 1), basis: core.strength >= 1.25 ? "building" : "none", strength: round(core.strength, 2), elongation: round(core.length / core.width, 2), centre: lonLatFrom(origin, core.centre).map((x) => round(x, 6)) };
  }
  osm[v.id] = {
    source: `way/${outline.id}`,
    read: raw.read,
    base: raw.osmBase,
    ring,
    ...(relation === undefined ? {} : { roof: { source: `relation/${relation.id}`, height: Number.isFinite(height) ? height : undefined, rise: Number.isFinite(roofHeight) ? roofHeight : undefined, outer: roofOuter === undefined ? undefined : `way/${roofOuter.ref}`, opening: opening === undefined ? undefined : { source: `way/${opening.ref}`, ring: lonlat(opening.geometry, origin, 1) } } }),
    axis,
  };
}

// ---- The data files. ----
const q = (value) => JSON.stringify(value).replace(/":/g, '": ').replace(/,"/g, ', "');
const FACT_KEYS = ["id", "wikidata", "ground", "en", "configs", "tiers", "roof"];
const factsText = `// Made by scripts/build-stadiums.mjs from scripts/stadiums.data.json: do not edit by hand.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/stadiums.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in stadiums.osm.data.ts, apart, because it is ODbL.
import type { RealStadiumData } from "./stadiums.ts";

export const STADIUM_DATA: RealStadiumData[] = [
${stadiums.map((v) => `  {\n${FACT_KEYS.map((key) => `    "${key}": ${q(v[key])},`).join("\n")}\n  },`).join("\n")}
];
`;
writeFileSync(new URL("../src/stadiums.data.ts", import.meta.url), factsText);

const clean = (value) => JSON.parse(JSON.stringify(value));
const osmText = `// Made by scripts/build-stadiums.mjs from the files of data-sources/stadiums/${day}/: do not edit by hand.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each stadium's building outline (the way OpenStreetMap tags with the
// stadium's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the roof OpenStreetMap maps over it (its heights and the opening in it) and the axis worked out from them. The package is
// MIT; this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (\`VENUE_ATTRIBUTION\`). Nothing in a CC0 or
// CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/stadiums/.
import type { StadiumOsm } from "./stadiums.ts";

export const STADIUM_OSM: Record<string, StadiumOsm> = {
${stadiums.map((v) => {
  const o = clean(osm[v.id]);
  const ringText = (ring, pad) => `[\n${ring.map(([lon, lat]) => `${pad}  [${lon}, ${lat}]`).join(",\n")},\n${pad}]`;
  const roof = o.roof === undefined ? "" : `\n    "roof": {\n      "source": ${q(o.roof.source)},${o.roof.height === undefined ? "" : `\n      "height": ${o.roof.height},`}${o.roof.rise === undefined ? "" : `\n      "rise": ${o.roof.rise},`}${o.roof.outer === undefined ? "" : `\n      "outer": ${q(o.roof.outer)},`}${o.roof.opening === undefined ? "" : `\n      "opening": { "source": ${q(o.roof.opening.source)}, "ring": ${ringText(o.roof.opening.ring, "      ")} },`}\n    },`;
  return `  "${v.id}": {\n    "source": ${q(o.source)},\n    "read": ${q(o.read)},\n    "base": ${q(o.base)},\n    "licence": "ODbL-1.0",\n    "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",\n    "axis": ${q(o.axis)},${roof}\n    "ring": ${ringText(o.ring, "    ")},\n  },`;
}).join("\n")}
};
`;
writeFileSync(new URL("../src/stadiums.osm.data.ts", import.meta.url), osmText);

// docs/stadiums.md: the table of the stadiums between its markers; the rest of the page is written by hand.
const m2 = (ring) => Math.round(areaOf(metresFrom(middleOf(ring), ring)));
const how = (a) => (a.basis === "none" ? "not known" : `along ${a.heading}° (${a.basis === "opening" ? "from the roof's opening" : "inferred"})`);
const name = (v) => grounds.find((g) => g.id === v.ground).name;
const table = `| Key | Stadium | City | Wikidata | CFL football | Soccer | Bowls | Roof | The field | Outline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${stadiums.map((v) => {
  const g = grounds.find((x) => x.id === v.ground);
  const o = osm[v.id];
  const roof = v.roof.kind === "cable" ? `retractable, cable-supported (${v.roof.basis})` : `fixed (${v.roof.basis})`;
  return `| \`${v.id}\` | ${name(v)} | ${g.city}, Canada | ${v.wikidata} | ${v.configs.cfl.seats.toLocaleString("en-US")} | ${v.configs.soccer.seats.toLocaleString("en-US")} | ${v.tiers.count}, ${v.tiers.basis} | ${roof} | ${how(o.axis)} | ${o.source.replace("way/", "way ")}, ${m2(o.ring.map(([a, b]) => [a, b])).toLocaleString("en-US")} m² |`;
}).join("\n")}`;
const page = new URL("../docs/stadiums.md", import.meta.url);
if (existsSync(page)) {
  const text = readFileSync(page, "utf8");
  const marked = /<!-- stadiums-table -->[\s\S]*?<!-- \/stadiums-table -->/;
  if (!marked.test(text)) fail("docs/stadiums.md has no <!-- stadiums-table --> markers");
  writeFileSync(page, text.replace(marked, () => `<!-- stadiums-table -->\n${table}\n<!-- /stadiums-table -->`));
}
console.log(`src/stadiums.data.ts, src/stadiums.osm.data.ts: ${stadiums.length} stadium(s), read ${day}`);
