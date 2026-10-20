// Writes src/stadiums.data.ts, src/stadiums.osm.data.ts and the table of docs/stadiums.md from scripts/stadiums.data.json and the dated files under data-sources/stadiums/ (`pnpm stadiums`).
//
// The two data files are kept apart because their licences are, as the venues' are (scripts/build-venues.mjs): src/stadiums.data.ts holds facts (the seats of each configuration, the number of bowls, the kind of
// roof) with the Wikidata item or the English Wikipedia article and revision each was read from, and no text; src/stadiums.osm.data.ts holds what was read from OpenStreetMap (a building's outline, the roof, the
// pitches and the infield where they are mapped), which is ODbL 1.0 data, "(c) OpenStreetMap contributors", and says so at its head and on every entry. Nothing else is copied. The way the field lies is worked out
// from the roof's opening, the pitch or the infield (and, for a ballpark, the outline) and is a derived fact of the same data. See docs/stadiums.md and NOTICE.md.
//
// The raw responses (`pnpm stadiums:fetch`) stay in data-sources/stadiums/<date>/ as they were returned, and this script reads the newest date (or the one given: `pnpm stadiums 2026-10-20`).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { areaOf, centroidOf, coreOf, inside, lonLatFrom, metresFrom, middleOf, simplified, smallestBox } from "../src/venues.geo.ts";

const read = (name) => JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url), "utf8"));
const source = read("stadiums.data.json");
const grounds = read("grounds.data.json");
const parks = read("parks.data.json");
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
const ROOFS = ["cable", "fixed", "canopy", "panels"];
const SOURCES = ["wikipedia", "wikidata"];
const CONFIGS = { stadium: ["cfl", "nfl", "soccer"], park: ["mlb"] };
const SPORT_OF_TAG = { american_football: ["nfl", "cfl"], canadian_football: ["cfl"], soccer: ["soccer"], baseball: ["mlb"] };
const stadiums = source.stadiums;
const kindOf = (v) => v.kind ?? "stadium";

/** The capacities of an item as Wikidata gives them (P1083). */
const capacities = (entity) => (entity.claims?.P1083 ?? []).map((claim) => Number(claim.mainsnak?.datavalue?.value?.amount));
/** The numbers of an infobox's capacity line, in the order it lists them. */
const listed = (line) => [...(line ?? "").matchAll(/\d{1,3}(?:,\d{3})+/g)].map((m) => Number(m[0].replace(/,/g, "")));
const grouped = (n) => n.toLocaleString("en-US");

const ids = new Set();
const facts = [];
for (const v of stadiums) {
  if (ids.has(v.id)) fail(`${v.id} is listed twice`);
  ids.add(v.id);
  const kind = kindOf(v);
  const place = kind === "park" ? parks.find((p) => p.id === v.park) : grounds.find((g) => g.id === v.ground);
  if (place === undefined) fail(`${v.id}: ${v.park ?? v.ground} is not a ${kind === "park" ? "park" : "ground"} of the package`);
  if (place.wikidata !== v.wikidata) fail(`${v.id}: ${v.wikidata} is not the place's item (${place.wikidata})`);
  if (Math.abs(place.lat - v.lat) > 1e-4 || Math.abs(place.lon - v.lon) > 1e-4) fail(`${v.id}: the coordinates are not the place's`);
  const item = wikidata[v.wikidata];
  if (item === undefined || item.missing !== undefined) fail(`${v.id}: Wikidata has no ${v.wikidata}`);
  if (item.sitelinks?.enwiki?.title !== v.en.title) fail(`${v.id}: the item's English article is ${item.sitelinks?.enwiki?.title}, not ${v.en.title}`);
  const article = wikipedia[v.id];
  if (article === undefined || article.title !== v.en.title) fail(`${v.id}: the archive has no article ${v.en.title}`);
  if (article.revision !== v.en.revision) fail(`${v.id}: the facts cite revision ${v.en.revision} but the archive read ${article.revision}`);
  if (place.en?.revision !== v.en.revision && kind === "stadium") fail(`${v.id}: the ground's article is at revision ${place.en?.revision}, not ${v.en.revision}`);
  const numbers = listed(article.infoboxCapacity);
  const keys = Object.keys(v.configs);
  if (keys.length === 0 || !keys.every((key) => CONFIGS[kind].includes(key))) fail(`${v.id}: configurations ${keys.join(", ")}`);
  for (const key of keys) {
    const c = v.configs[key];
    if (c.sport !== key) fail(`${v.id}: configuration ${key}`);
    if (!(Number.isInteger(c.seats) && c.seats > 20000 && c.seats < 100000)) fail(`${v.id}/${key}: seats`);
    if (!SOURCES.includes(c.source) || typeof c.read !== "string" || c.read === "") fail(`${v.id}/${key}: source and read`);
    // A figure is on the infobox's capacity line (or is Wikidata's, where it says so).
    if (!(c.source === "wikidata" ? capacities(item).includes(c.seats) : numbers.includes(c.seats))) fail(`${v.id}/${key}: ${c.seats} is not what ${c.source} gives (${c.source === "wikidata" ? capacities(item).join(", ") : numbers.join(", ")})`);
  }
  if (v.bowlSeats !== undefined && !(Number.isInteger(v.bowlSeats) && v.bowlSeats >= Math.max(...keys.map((k) => v.configs[k].seats)))) fail(`${v.id}: bowlSeats`);
  if (kind === "stadium" && !["cfl", "nfl"].includes(v.gridiron ?? "cfl")) fail(`${v.id}: gridiron`);
  const { tiers, roof } = v;
  if (![1, 2, 3, 4].includes(tiers.count) || !BASES.includes(tiers.basis) || typeof tiers.read !== "string") fail(`${v.id}: tiers`);
  if (tiers.lowerSeats !== undefined && !(tiers.count > 1 && numbers.includes(tiers.lowerSeats) && tiers.lowerSeats < Math.min(...keys.map((k) => v.configs[k].seats)) * 0.8)) fail(`${v.id}: lowerSeats must be on the infobox's line and under 80 percent of every configuration's`);
  // A ballpark's tiers by their seats: each figure is in the article's sentences, and they add up to within 5 percent of the capacity (some places are standing ones and the like).
  if (tiers.tierSeats !== undefined) {
    const prose = article.sentences.join(" ");
    const total = Object.values(tiers.tierSeats).reduce((a, b) => a + b, 0);
    if (Math.abs(total - Math.max(...keys.map((k) => v.configs[k].seats))) / total > 0.05) fail(`${v.id}: the tiers hold ${total}, not about the capacity`);
    if (tiers.read.match(/\d{1,3}(?:,\d{3})+/g)?.some((n) => !prose.includes(n))) fail(`${v.id}: a figure of tiers.read is not in the article's sentences`);
  }
  if (!ROOFS.includes(roof.kind) || !BASES.includes(roof.basis) || typeof roof.read !== "string") fail(`${v.id}: roof`);
  facts.push({ ...v, wikidataSeats: capacities(item) });
}

// ---- What OpenStreetMap gave. ----
const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;
const closed = (g) => Array.isArray(g) && g.length > 3 && g[0].lat === g.at(-1).lat && g[0].lon === g.at(-1).lon;
const ringOf = (g) => g.slice(0, -1).map((p) => [p.lon, p.lat]);
const lonlat6 = (ring) => ring.map(([lon, lat]) => [round(lon, 6), round(lat, 6)]);
const same = (a, b) => a.lat === b.lat && a.lon === b.lon;
/** The outer ways of a relation joined end to end into closed rings (a ring may be several ways, each the next one's start): a way already closed is a ring of its own. */
function chained(members) {
  const rings = members.filter((m) => closed(m.geometry)).map((m) => ({ ref: m.ref, geometry: m.geometry }));
  const open = members.filter((m) => !closed(m.geometry) && m.geometry.length > 1).map((m) => ({ ref: m.ref, geometry: [...m.geometry] }));
  while (open.length > 0) {
    const chain = open.shift();
    let again = true;
    while (again && !same(chain.geometry[0], chain.geometry.at(-1))) {
      again = false;
      const at = open.findIndex((w) => same(w.geometry[0], chain.geometry.at(-1)) || same(w.geometry.at(-1), chain.geometry.at(-1)));
      if (at >= 0) {
        const [next] = open.splice(at, 1);
        const ordered = same(next.geometry[0], chain.geometry.at(-1)) ? next.geometry : [...next.geometry].reverse();
        chain.geometry = [...chain.geometry, ...ordered.slice(1)];
        again = true;
      }
    }
    if (closed(chain.geometry)) rings.push(chain);
  }
  return rings;
}
/** Every closed outline of an element: a closed way's, or the rings the relation's outer ways make, with the first way's id. */
const outlines = (e) => (e.type === "way" ? (closed(e.geometry) ? [{ ref: e.id, geometry: e.geometry }] : []) : chained((e.members ?? []).filter((m) => m.type === "way" && m.role === "outer" && m.geometry)));
const find = (raw, spec, label) => {
  const [type, id] = spec.split("/");
  return raw.elements.find((e) => e.type === type && String(e.id) === id) ?? fail(`${label}: ${spec} is not in the archive`);
};
/** The outline of an element with the most area (a relation of several outer ways holds the building and its annexes). */
const largest = (e, origin) => outlines(e).reduce((best, o) => (best === undefined || areaOf(metresFrom(origin, ringOf(o.geometry))) > areaOf(metresFrom(origin, ringOf(best.geometry))) ? o : best), undefined);

const osm = {};
for (const v of stadiums) {
  const file = `osm-${v.id}.json`;
  if (!existsSync(new URL(file, dir))) fail(`${v.id}: ${file} is not in ${day}: run \`pnpm stadiums:fetch\``);
  const raw = load(file);
  if (raw.wikidata !== v.wikidata) fail(`${v.id}: ${file} is for ${raw.wikidata}`);
  const kind = kindOf(v);
  let outline;
  let outlineSource;
  let height;
  if (v.osm === undefined) {
    // The building tagged with the stadium's Wikidata item (BC Place's).
    const building = raw.elements.filter((e) => e.type === "way" && e.tags?.wikidata === v.wikidata && closed(e.geometry));
    if (building.length !== 1) fail(`${v.id}: ${building.length} closed ways carry ${v.wikidata}; name the building in "osm"`);
    outline = building[0].geometry;
    outlineSource = `way/${building[0].id}`;
    height = Number(building[0].tags.height);
  } else {
    const e = find(raw, v.osm.building, v.id);
    const first = outlines(e)[0] ?? fail(`${v.id}: ${v.osm.building} has no closed outer way`);
    outline = largest(e, middleOf(ringOf(first.geometry))).geometry;
    outlineSource = `${e.type}/${e.id}`;
    height = Number(e.tags?.height);
  }
  const origin = middleOf(ringOf(outline));
  const metres = metresFrom(origin, ringOf(outline));
  const kept = simplified(metres, 1);
  const ring = lonlat6(ringOf(outline).filter((_, i) => kept.some((k) => k === metres[i])));
  const simple = (g) => {
    const m = metresFrom(origin, ringOf(g));
    const k = simplified(m, 1);
    return lonlat6(ringOf(g).filter((_, i) => k.some((p) => p === m[i])));
  };

  let axis;
  let roof;
  let canopies;
  if (v.osm === undefined) {
    // BC Place: the roof is a multipolygon of its band and the opening over the field, which the article says is the field's size.
    const relation = raw.elements.find((e) => e.type === "relation" && e.id === v.roofRelation);
    if (v.roofRelation !== undefined && relation === undefined) fail(`${v.id}: the roof relation ${v.roofRelation} is not in ${file}`);
    const opening = relation?.members?.find((m) => m.role === "inner" && closed(m.geometry));
    const roofOuter = relation?.members?.find((m) => m.role === "outer" && closed(m.geometry));
    const roofHeight = Number(relation?.tags?.["roof:height"]);
    const top = Number(relation?.tags?.height);
    if (opening !== undefined) {
      const m = metresFrom(origin, ringOf(opening.geometry));
      const box = smallestBox(m);
      axis = { heading: round(box.heading, 1), basis: "opening", strength: round(coreOf(metres).strength, 2), elongation: round(box.length / box.width, 2), centre: lonLatFrom(origin, centroidOf(m)).map((x) => round(x, 6)) };
      const said = v.roof.opening;
      if (said !== undefined && (Math.abs(box.length - said.length) / said.length > 0.05 || Math.abs(box.width - said.width) / said.width > 0.05)) fail(`${v.id}: the mapped opening is ${box.length.toFixed(1)} by ${box.width.toFixed(1)} m, the article says ${said.length} by ${said.width}`);
    } else {
      const core = coreOf(metres);
      axis = { heading: round(core.heading, 1), basis: core.strength >= 1.25 ? "building" : "none", strength: round(core.strength, 2), elongation: round(core.length / core.width, 2), centre: lonLatFrom(origin, core.centre).map((x) => round(x, 6)) };
    }
    if (relation !== undefined) roof = { source: `relation/${relation.id}`, height: Number.isFinite(top) ? top : undefined, rise: Number.isFinite(roofHeight) ? roofHeight : undefined, outer: roofOuter === undefined ? undefined : `way/${roofOuter.ref}`, opening: opening === undefined ? undefined : { source: `way/${opening.ref}`, ring: simple(opening.geometry) } };
    height = Number.isFinite(top) ? top : height;
  } else if (kind === "stadium") {
    // The pitches OpenStreetMap maps in the stadium, one for each sport; the field lies as they do (and they agree with each other).
    const pitches = (v.osm.pitches ?? []).map((spec) => find(raw, spec, v.id));
    if (pitches.length === 0) fail(`${v.id}: a stadium with no pitch mapped needs another way to say how its field lies`);
    const boxes = pitches.map((e) => {
      const m = metresFrom(origin, ringOf(outlines(e)[0].geometry));
      return { e, box: smallestBox(m), centre: centroidOf(m) };
    });
    const headings = boxes.map((b) => b.box.heading);
    const off = (h) => Math.abs((((h - headings[0] + 90) % 180) + 180) % 180 - 90);
    if (Math.max(...headings.map(off)) > 3) fail(`${v.id}: the pitches do not lie the same way (${headings.join(", ")})`);
    for (const key of Object.keys(v.configs)) if (!boxes.some((b) => (SPORT_OF_TAG[b.e.tags?.sport] ?? []).includes(key))) fail(`${v.id}: no pitch mapped for ${key}`);
    const mean = [boxes.reduce((s, b) => s + b.centre[0], 0) / boxes.length, boxes.reduce((s, b) => s + b.centre[1], 0) / boxes.length];
    axis = { heading: round(headings[0], 1), basis: "pitch", strength: round(coreOf(metres).strength, 2), elongation: round(boxes[0].box.length / boxes[0].box.width, 2), centre: lonLatFrom(origin, mean).map((x) => round(x, 6)) };
    if (v.osm.roofs !== undefined) {
      canopies = v.osm.roofs.map((spec) => {
        const e = find(raw, spec, v.id);
        return { source: `${e.type}/${e.id}`, height: Number(e.tags?.height), rise: Number(e.tags?.["roof:height"]), ring: simple(outlines(e)[0].geometry) };
      });
      for (const c of canopies) if (!Number.isFinite(c.height) || !Number.isFinite(c.rise)) fail(`${v.id}: ${c.source} has no height and roof height`);
    }
  } else {
    // A ballpark: the infield OpenStreetMap maps (the grass inside the base paths: a square whose sides are the baselines) says how the baselines run; which way is out to centre field is the one of the four that
    // keeps the park's fence, and the stands behind it, inside the building's outline.
    const infield = find(raw, v.osm.infield, v.id);
    const piece = (infield.members ?? []).find((m) => m.ref === v.osm.infieldWay) ?? fail(`${v.id}: way ${v.osm.infieldWay} is not a member of ${v.osm.infield}`);
    const m = metresFrom(origin, ringOf(piece.geometry));
    const box = smallestBox(m);
    const centre = centroidOf(m);
    if (Math.abs(box.length / box.width - 1) > 0.05 || Math.abs(Math.sqrt(areaOf(m)) - 25.5) > 4) fail(`${v.id}: the infield is not the square of grass inside the base paths (${box.length.toFixed(1)} by ${box.width.toFixed(1)} m)`);
    const place = parks.find((p) => p.id === v.park);
    const unit = place.unit === "m" ? 1 : 0.3048;
    const fence = place.points.map(([a, d]) => [d * unit * Math.sin((a * Math.PI) / 180), d * unit * Math.cos((a * Math.PI) / 180)]);
    const outlineM = metresFrom(origin, ringOf(outline));
    const score = (h) => {
      const a = (h * Math.PI) / 180;
      const dir = [Math.sin(a), Math.cos(a)];
      const right = [Math.cos(a), -Math.sin(a)];
      const home = [centre[0] - 19.4 * dir[0], centre[1] - 19.4 * dir[1]];
      const pts = fence.map(([u, w]) => [home[0] + u * right[0] + w * dir[0], home[1] + u * right[1] + w * dir[1]]);
      const behind = pts.map(([x, y]) => [x + ((x - home[0]) / Math.hypot(x - home[0], y - home[1])) * 20, y + ((y - home[1]) / Math.hypot(x - home[0], y - home[1])) * 20]);
      return [...pts, ...behind].filter((p) => !inside(outlineM, p)).length;
    };
    // The baselines lie along the box's sides; home plate is at one of its four corners, so the way to centre field is 45 degrees from a side, and one of four.
    const candidates = [0, 1, 2, 3].map((k) => (((box.heading + 45 + 90 * k) % 360) + 360) % 360);
    const scored = candidates.map((h) => ({ h, bad: score(h) })).sort((a, b) => a.bad - b.bad);
    if (scored[0].bad !== 0 || scored[1].bad < 2) fail(`${v.id}: the outline does not choose one way to centre field (${scored.map((s) => `${s.h.toFixed(1)}:${s.bad}`).join(" ")})`);
    const h = scored[0].h;
    const a = (h * Math.PI) / 180;
    // Home plate is 90 feet times the root of two over two (19.4 m) back from the middle of the infield.
    const home = [centre[0] - 19.4 * Math.sin(a), centre[1] - 19.4 * Math.cos(a)];
    axis = { heading: round(h, 1), basis: "infield", strength: round(coreOf(metres).strength, 2), elongation: 1, centre: lonLatFrom(origin, home).map((x) => round(x, 6)) };
  }
  osm[v.id] = { source: outlineSource, read: raw.read, base: raw.osmBase, ring, ...(Number.isFinite(height) && height > 5 && height < 120 ? { height } : {}), ...(roof === undefined ? {} : { roof }), ...(canopies === undefined ? {} : { canopies }), axis };
}

// ---- The data files. ----
const q = (value) => JSON.stringify(value).replace(/":/g, '": ').replace(/,"/g, ', "');
const FACT_KEYS = ["id", "kind", "wikidata", "ground", "park", "gridiron", "en", "configs", "bowlSeats", "wikidataSeats", "tiers", "roof"];
const factsText = `// Made by scripts/build-stadiums.mjs from scripts/stadiums.data.json: do not edit by hand.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/stadiums.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in stadiums.osm.data.ts, apart, because it is ODbL.
import type { RealStadiumData } from "./stadiums.ts";

export const STADIUM_DATA: RealStadiumData[] = [
${facts.map((v) => `  {\n${FACT_KEYS.filter((key) => v[key] !== undefined).map((key) => `    "${key}": ${q(v[key])},`).join("\n")}\n  },`).join("\n")}
];
`;
writeFileSync(new URL("../src/stadiums.data.ts", import.meta.url), factsText);

const clean = (value) => JSON.parse(JSON.stringify(value));
const ringText = (ring, pad) => `[\n${ring.map(([lon, lat]) => `${pad}  [${lon}, ${lat}]`).join(",\n")},\n${pad}]`;
const osmText = `// Made by scripts/build-stadiums.mjs from the files of data-sources/stadiums/${day}/: do not edit by hand.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each stadium's building outline (the way or relation OpenStreetMap maps it as, simplified
// to a metre, longitude and latitude to six decimals), the roof OpenStreetMap maps over it (its heights, the opening or the canopies) and the axis worked out from the roof's opening, the pitch or the infield. The package
// is MIT; this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (\`VENUE_ATTRIBUTION\`). Nothing in a CC0 or
// CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/stadiums/.
import type { StadiumOsm } from "./stadiums.ts";

export const STADIUM_OSM: Record<string, StadiumOsm> = {
${stadiums.map((v) => {
  const o = clean(osm[v.id]);
  const roof = o.roof === undefined ? "" : `\n    "roof": {\n      "source": ${q(o.roof.source)},${o.roof.height === undefined ? "" : `\n      "height": ${o.roof.height},`}${o.roof.rise === undefined ? "" : `\n      "rise": ${o.roof.rise},`}${o.roof.outer === undefined ? "" : `\n      "outer": ${q(o.roof.outer)},`}${o.roof.opening === undefined ? "" : `\n      "opening": { "source": ${q(o.roof.opening.source)}, "ring": ${ringText(o.roof.opening.ring, "      ")} },`}\n    },`;
  const canopies = o.canopies === undefined ? "" : `\n    "canopies": [\n${o.canopies.map((c) => `      { "source": ${q(c.source)}, "height": ${c.height}, "rise": ${c.rise}, "ring": ${ringText(c.ring, "      ")} },`).join("\n")}\n    ],`;
  return `  "${v.id}": {\n    "source": ${q(o.source)},\n    "read": ${q(o.read)},\n    "base": ${q(o.base)},\n    "licence": "ODbL-1.0",\n    "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",\n${o.height === undefined ? "" : `    "height": ${o.height},\n`}    "axis": ${q(o.axis)},${roof}${canopies}\n    "ring": ${ringText(o.ring, "    ")},\n  },`;
}).join("\n")}
};
`;
writeFileSync(new URL("../src/stadiums.osm.data.ts", import.meta.url), osmText);

// docs/stadiums.md: the table of the stadiums between its markers; the rest of the page is written by hand.
const m2 = (ring) => Math.round(areaOf(metresFrom(middleOf(ring), ring)));
const HOW = { opening: "from the roof's opening", pitch: "as OpenStreetMap maps the pitch", infield: "from the mapped infield and the outline", building: "inferred" };
const how = (a, v) => (a.basis === "none" ? "not known" : kindOf(v) === "park" ? `home to centre field ${a.heading}° (${HOW[a.basis]})` : `along ${a.heading}° (${HOW[a.basis]})`);
const COUNTRY = { US: "United States", CA: "Canada" };
const roofText = (v) => `${{ cable: "retractable, cable-supported", fixed: "fixed", canopy: `canopy over ${Math.round((v.roof.cover ?? 0) * 100)} percent of the seats`, panels: "retractable, in four sections" }[v.roof.kind]} (${v.roof.basis})`;
const seatsText = (v) => Object.entries(v.configs).map(([k, c]) => `${grouped(c.seats)} (${k})`).join(", ");
const table = `| Key | Stadium | City | Wikidata | Seats | Bowls | Roof | The field | Outline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${stadiums.map((v) => {
  const place = kindOf(v) === "park" ? parks.find((p) => p.id === v.park) : grounds.find((x) => x.id === v.ground);
  const o = osm[v.id];
  return `| \`${v.id}\` | ${place.name} | ${place.city}, ${COUNTRY[place.country] ?? place.country} | ${v.wikidata} | ${seatsText(v)} | ${v.tiers.count}, ${v.tiers.basis} | ${roofText(v)} | ${how(o.axis, v)} | ${o.source.replace("way/", "way ").replace("relation/", "relation ")}, ${m2(o.ring.map(([a, b]) => [a, b])).toLocaleString("en-US")} m² |`;
}).join("\n")}`;
const page = new URL("../docs/stadiums.md", import.meta.url);
if (existsSync(page)) {
  const text = readFileSync(page, "utf8");
  const marked = /<!-- stadiums-table -->[\s\S]*?<!-- \/stadiums-table -->/;
  if (!marked.test(text)) fail("docs/stadiums.md has no <!-- stadiums-table --> markers");
  writeFileSync(page, text.replace(marked, () => `<!-- stadiums-table -->\n${table}\n<!-- /stadiums-table -->`));
}
console.log(`src/stadiums.data.ts, src/stadiums.osm.data.ts: ${stadiums.length} stadium(s), read ${day}`);
