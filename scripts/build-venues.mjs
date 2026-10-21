// Writes src/venues.data.ts, src/venues.osm.data.ts, the tables of docs/venues.md and NOTICE.md from scripts/venues.data.json and the dated files under data-sources/venues/ (`pnpm venues`).
//
// The two data files are kept apart because their licences are: src/venues.data.ts holds facts (a number of seats, a number of seating levels, a kind of roof) with the Wikidata item or the English
// Wikipedia article and revision each was read from, and no text; src/venues.osm.data.ts holds what was read from OpenStreetMap (a building's outline, the ice where it is mapped, the building's height),
// which is ODbL 1.0 data, "(c) OpenStreetMap contributors", and says so at its head and on every entry. The outline is the way OpenStreetMap tags with the venue's Wikidata item, simplified to a metre
// and written to six decimals of a degree; nothing else is copied. The axis is worked out from it (`coreOf`, src/venues.geo.ts) and is a derived fact of the same data. See docs/venues.md and NOTICE.md.
//
// The raw responses (`pnpm venues:fetch <date> <division>`) stay in data-sources/venues/<date>/ as they were returned; each venue names the day it was read (`read`) and this script reads that day's files, the
// division's `wikidata-<division>.json` and `wikipedia-<division>.json` and the venue's own `osm-<id>.json`.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";
import { areaOf, centroidOf, coreOf, inside, lonLatFrom, metresFrom, middleOf, outerRingOf, simplified, smallestBox } from "../src/venues.geo.ts";

const read = (name) => JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url), "utf8"));
const source = read("venues.data.json");
const arenas = read("arenas.data.json");
const root = new URL("../data-sources/venues/", import.meta.url);
const fail = (message) => {
  throw new Error(message);
};
const loadFrom = (day, name) => {
  const file = new URL(`${day}/${name}`, root);
  if (!existsSync(file)) fail(`${name} is not in data-sources/venues/${day}/: run \`pnpm venues:fetch ${day} <division>\``);
  return JSON.parse(readFileSync(file, "utf8"));
};
const days = new Set();

const DIVISIONS = ["pacific", "central", "atlantic", "metropolitan"];
const CONFERENCES = { pacific: "western", central: "western", atlantic: "eastern", metropolitan: "eastern" };
/** How much of a direction the building must have (the largest rectangle's area in its best direction over its smallest) and how much longer than wide its main hall must be, for its axis to be said. */
const STRENGTH = 1.25;
const ELONGATION = 1.1;
const BASES = ["documented", "plausible"];
const ROOFS = ["fixed", "saddle"];
const SOURCES = ["wikipedia", "wikidata"];
const venues = source.venues;
for (const [name, division] of Object.entries(source.divisions)) {
  if (!DIVISIONS.includes(name) || CONFERENCES[name] !== division.conference) fail(`division ${name}`);
  const listed = venues.filter((v) => v.division === name).map((v) => v.id);
  if (JSON.stringify(listed) !== JSON.stringify(division.venues)) fail(`${name}: the venues are ${listed.join(", ")}, the division lists ${division.venues.join(", ")}`);
}
if (venues.some((v) => source.divisions[v.division] === undefined)) fail("a venue of a division the file does not list");

/** The capacities of an item as Wikidata gives them: the numbers of P1083, with the sport each applies to (P641) where it has one. */
const capacities = (entity) => (entity.claims?.P1083 ?? []).map((claim) => ({ amount: Number(claim.mainsnak?.datavalue?.value?.amount), sport: claim.qualifiers?.P641?.[0]?.datavalue?.value?.id, from: claim.qualifiers?.P580?.[0]?.datavalue?.value?.time ?? "" }));
const ICE_HOCKEY = "Q41466";

const ids = new Set();
for (const v of venues) {
  if (ids.has(v.id)) fail(`${v.id} is listed twice`);
  ids.add(v.id);
  const arena = arenas.find((a) => a.id === v.id);
  if (arena === undefined) fail(`${v.id} is not an arena of scripts/arenas.data.json`);
  if (arena.wikidata !== v.wikidata) fail(`${v.id}: ${v.wikidata} is not the arena's item (${arena.wikidata})`);
  if (arena.status !== "current") fail(`${v.id}: a venue is a current arena`);
  if (Math.abs(arena.lat - v.lat) > 1e-4 || Math.abs(arena.lon - v.lon) > 1e-4) fail(`${v.id}: the coordinates are not the arena's`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.read)) fail(`${v.id}: read`);
  days.add(v.read);
  const wikidata = loadFrom(v.read, `wikidata-${v.division}.json`).entities;
  const wikipedia = loadFrom(v.read, `wikipedia-${v.division}.json`).articles;
  const item = wikidata[v.wikidata];
  if (item === undefined || item.missing !== undefined) fail(`${v.id}: Wikidata has no ${v.wikidata}`);
  if (item.sitelinks?.enwiki?.title !== v.en.title) fail(`${v.id}: the item's English article is ${item.sitelinks?.enwiki?.title}, not ${v.en.title}`);
  const article = wikipedia[v.id];
  if (article === undefined || article.title !== v.en.title) fail(`${v.id}: the archive has no article ${v.en.title}`);
  if (article.revision !== v.en.revision) fail(`${v.id}: the facts cite revision ${v.en.revision} but the archive read ${article.revision}`);
  const { seats, tiers, roof } = v;
  if (!(Number.isInteger(seats.hockey) && seats.hockey > 8000 && seats.hockey < 25000)) fail(`${v.id}: seats`);
  if (!SOURCES.includes(seats.source)) fail(`${v.id}: seats.source`);
  const given = capacities(item);
  // Wikidata's own capacity is kept beside the figure used; an item that gives none has `null`.
  if (given.length === 0 ? seats.wikidata !== null : !given.some((c) => c.amount === seats.wikidata)) fail(`${v.id}: Wikidata gives ${given.map((c) => c.amount).join(", ") || "no capacity"}, not ${seats.wikidata}`);
  // Wikidata's own figure for ice hockey wins where the item has one; else the figure is the article's.
  // Where it has several (a capacity changed in some year: P580 says from when), the latest is the present one.
  const hockey = given.filter((c) => c.sport === ICE_HOCKEY).sort((a, b) => b.from.localeCompare(a.from))[0];
  if (seats.source === "wikidata" ? hockey?.amount !== seats.hockey : hockey !== undefined) fail(`${v.id}: ${seats.source} is not where the hockey seats come from`);
  if (typeof seats.read !== "string" || seats.read === "") fail(`${v.id}: seats say what was read`);
  if (![1, 2, 3].includes(tiers.count) || !BASES.includes(tiers.basis) || typeof tiers.read !== "string") fail(`${v.id}: tiers`);
  if (tiers.lowerShare !== undefined && !(tiers.count > 1 && tiers.lowerShare > 0.3 && tiers.lowerShare < 0.8)) fail(`${v.id}: lowerShare`);
  if (!ROOFS.includes(roof.kind) || !BASES.includes(roof.basis) || typeof roof.read !== "string") fail(`${v.id}: roof`);
}

// ---- What OpenStreetMap gave. ----
const osm = {};
for (const v of venues) {
  const file = `osm-${v.id}.json`;
  const raw = loadFrom(v.read, file);
  if (raw.wikidata !== v.wikidata) fail(`${v.id}: ${file} is for ${raw.wikidata}`);
  // A closed way, or a multipolygon relation whose outer ways join into one ring (a building drawn in two ways), is an outline.
  const closed = (e) => outerRingOf(e) !== undefined;
  const ringOf = (e) => outerRingOf(e).slice(0, -1).map((p) => [p.lon, p.lat]);
  // Where more than one outline carries the item (a building and a sports centre drawn over it), the one tagged `building` is the building.
  let building = raw.elements.filter((e) => e.tags?.wikidata === v.wikidata && closed(e));
  if (building.length > 1) building = building.filter((e) => e.tags.building !== undefined);
  if (building.length !== 1) fail(`${v.id}: ${building.length} outlines carry ${v.wikidata}; a split building needs a rule of its own`);
  const outline = building[0];
  const origin = middleOf(ringOf(outline));
  const metres = metresFrom(origin, ringOf(outline));
  const kept = simplified(metres, 1);
  const ring = ringOf(outline).filter((_, i) => kept.some((k) => k === metres[i])).map(([lon, lat]) => [Math.round(lon * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6]);
  // The ice: a closed way tagged as a rink or a pitch of ice hockey, the size of a rink, with its middle inside the building.
  const ice = raw.elements.filter((e) => e !== outline && closed(e) && (e.tags?.leisure === "ice_rink" || e.tags?.sport === "ice_hockey")).flatMap((e) => {
    const m = metresFrom(origin, ringOf(e));
    const area = areaOf(m);
    return area > 1000 && area < 2600 && inside(metresFrom(origin, ringOf(outline)), centroidOf(m)) ? [{ id: `${e.type}/${e.id}`, ring: ringOf(e).map(([lon, lat]) => [Math.round(lon * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6]), shape: smallestBox(m) }] : [];
  });
  if (ice.length > 1) fail(`${v.id}: ${ice.length} ice candidates inside the building`);
  const height = Number(outline.tags.height);
  // The axis: the ice where OpenStreetMap maps it; else the building's own, from its main hall (the largest rectangle inside the outline), if the hall has a direction and is longer than wide; else none.
  const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;
  const core = coreOf(metresFrom(origin, ring));
  let axis;
  if (ice.length === 1 && ice[0].shape.length / ice[0].shape.width >= 1.5) {
    const m = metresFrom(origin, ice[0].ring);
    axis = { heading: round(ice[0].shape.heading, 1), basis: "mapped", strength: round(core.strength, 2), elongation: round(ice[0].shape.length / ice[0].shape.width, 2), centre: lonLatFrom(origin, centroidOf(m)) };
  } else {
    const basis = core.strength >= STRENGTH && core.length / core.width >= ELONGATION ? "building" : "none";
    axis = { heading: basis === "none" ? 90 : round(core.heading, 1), basis, strength: round(core.strength, 2), elongation: round(core.length / core.width, 2), centre: lonLatFrom(origin, core.centre) };
  }
  axis.centre = axis.centre.map((v) => round(v, 6));
  osm[v.id] = { source: `${outline.type}/${outline.id}`, read: raw.read, base: raw.osmBase, ring, height: Number.isFinite(height) && height > 5 && height < 120 ? height : undefined, ice: ice.length === 1 ? { source: ice[0].id, ring: ice[0].ring } : undefined, axis };
}

// ---- The data files. ----
const q = (value) => JSON.stringify(value).replace(/":/g, '": ').replace(/,"/g, ', "');
const FACT_KEYS = ["id", "wikidata", "division", "en", "seats", "tiers", "roof"];
const readDays = [...days].sort().join(", ");
const factsText = `// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "./venues.ts";

export const VENUE_DATA: RealVenueData[] = [
${venues.map((v) => `  {\n${FACT_KEYS.map((key) => `    "${key}": ${q(v[key])},`).join("\n")}\n  },`).join("\n")}
];
`;
writeFileSync(new URL("../src/venues.data.ts", import.meta.url), factsText);

const osmText = `// Made by scripts/build-venues.mjs from the files of data-sources/venues/ (read ${readDays}): do not edit by hand.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each venue's building outline (the way OpenStreetMap tags with the
// venue's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the building's height where OpenStreetMap maps one, and the ice where OpenStreetMap maps it. The package is MIT;
// this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (\`VENUE_ATTRIBUTION\`). Nothing in a CC0
// or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/venues/.
import type { VenueOsm } from "./venues.ts";

/** The credit the ODbL asks for, wherever a drawing made from this data is shown. */
export const VENUE_ATTRIBUTION = "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright";

export const VENUE_OSM: Record<string, VenueOsm> = {
${venues.map((v) => {
  const o = osm[v.id];
  const ring = `[\n${o.ring.map(([lon, lat]) => `      [${lon}, ${lat}]`).join(",\n")},\n    ]`;
  const ice = o.ice === undefined ? "" : `\n    "ice": { "source": ${q(o.ice.source)}, "ring": [${o.ice.ring.map(([lon, lat]) => `[${lon}, ${lat}]`).join(", ")}] },`;
  return `  "${v.id}": {\n    "source": ${q(o.source)},\n    "read": ${q(o.read)},\n    "base": ${q(o.base)},\n    "licence": "ODbL-1.0",\n    "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",\n${o.height === undefined ? "" : `    "height": ${o.height},\n`}    "axis": ${q(o.axis)},\n    "ring": ${ring},${ice}\n  },`;
}).join("\n")}
};
`;
writeFileSync(new URL("../src/venues.osm.data.ts", import.meta.url), osmText);

// docs/venues.md: the table of the venues between its markers; the rest of the page is written by hand.
const COUNTRY = { US: "United States", CA: "Canada" };
const m2 = (o) => Math.round(areaOf(metresFrom(middleOf(o.ring), o.ring)));
const how = (a) => (a.basis === "none" ? "not known" : `along ${a.heading}° (${a.basis === "mapped" ? "mapped" : "inferred"})`);
const table = `| Key | Arena | Division | City | Wikidata | Seats for hockey | Tiers | Roof | The rink | Outline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${venues.map((v) => {
  const arena = arenas.find((a) => a.id === v.id);
  const seats = `${v.seats.hockey.toLocaleString("en-US")} (${v.seats.source === "wikidata" ? "Wikidata" : "Wikipedia"}; Wikidata's capacity ${v.seats.wikidata === null ? "none" : v.seats.wikidata.toLocaleString("en-US")})`;
  return `| \`${v.id}\` | ${arena.name} | ${v.division[0].toUpperCase()}${v.division.slice(1)} | ${arena.city}, ${COUNTRY[arena.country] ?? arena.country} | ${v.wikidata} | ${seats} | ${v.tiers.count}, ${v.tiers.basis} | ${v.roof.kind}, ${v.roof.basis} | ${how(osm[v.id].axis)} | ${osm[v.id].source.replace("/", " ")}, ${m2(osm[v.id]).toLocaleString("en-US")} m² |`;
}).join("\n")}`;
const page = new URL("../docs/venues.md", import.meta.url);
const text = readFileSync(page, "utf8");
const marked = /<!-- venues-table -->[\s\S]*?<!-- \/venues-table -->/;
if (!marked.test(text)) fail("docs/venues.md has no <!-- venues-table --> markers");
writeFileSync(page, text.replace(marked, () => `<!-- venues-table -->\n${table}\n<!-- /venues-table -->`));
// NOTICE.md: the table of what each venue was read from, between its markers.
const notice = new URL("../NOTICE.md", import.meta.url);
const noticeText = readFileSync(notice, "utf8");
const noticeMarked = /<!-- venues-notice -->[\s\S]*?<!-- \/venues-notice -->/;
if (!noticeMarked.test(noticeText)) fail("NOTICE.md has no <!-- venues-notice --> markers");
const noticeTable = `| Arena | Wikidata item | OpenStreetMap element | English article and revision |
| --- | --- | --- | --- |
${venues.map((v) => `| ${arenas.find((a) => a.id === v.id).name} | ${v.wikidata} | ${osm[v.id].source} | ${v.en.title}, ${v.en.revision} |`).join("\n")}`;
writeFileSync(notice, noticeText.replace(noticeMarked, () => `<!-- venues-notice -->\n${noticeTable}\n<!-- /venues-notice -->`));
console.log(`src/venues.data.ts, src/venues.osm.data.ts: ${venues.length} venues of the ${Object.keys(source.divisions).join(", ")} divisions, read ${readDays}`);
