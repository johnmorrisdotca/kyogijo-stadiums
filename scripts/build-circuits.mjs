// Writes src/circuits.data.ts and src/circuits.osm.data.ts from scripts/circuits.data.json and the dated files under data-sources/circuits/ (`pnpm circuits`).
//
// The two data files are kept apart because their licences are, as the venues' are (scripts/build-venues.mjs): src/circuits.data.ts holds facts (the length of a lap, the number of corners, the day it opened, which way
// it runs) with the Wikidata item or the article and revision each was read from, and no text; src/circuits.osm.data.ts holds what was read from OpenStreetMap (the lap, the pit lane, the circuit's ground, the turns'
// numbers, the start and the finish, the pit building), which is ODbL 1.0 data, "(c) OpenStreetMap contributors", and says so at its head and on every entry. Nothing else is copied.
//
// Every documented fact is checked against the raw answers: the infobox line it names, the sentence it names, the Wikidata claim. The lap is the relation's ways with the role `forward` or `backward`, in the
// relation's order, each turned the way it is driven, and must join end to end into one ring; the turns are its nodes tagged junction=yes with ref 1 to the number of corners, and must lie on the lap in their order;
// the measured length of the lap must be within 3 percent of the published one. The build stops at the first that is not so. See docs/circuits.md.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { lineLength, nearestOn, simplifyLine, simplifyLoop } from "../src/circuits.geo.ts";
import { inside, metresFrom, lonLatFrom } from "../src/venues.geo.ts";

const source = JSON.parse(readFileSync(new URL("./circuits.data.json", import.meta.url), "utf8"));
const root = new URL("../data-sources/circuits/", import.meta.url);
const day = process.argv[2] ?? readdirSync(root).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().at(-1);
if (day === undefined) throw new Error("no data-sources/circuits/<date>/ to read: run `pnpm circuits:fetch` first");
const read = (name) => JSON.parse(readFileSync(new URL(`${day}/${name}`, root), "utf8"));
const wikidata = read("wikidata.json").entities;
const wikipedia = read("wikipedia.json").articles;
const fail = (message) => {
  throw new Error(message);
};

/** The tolerance the lap and the lines are simplified to, in metres: a tenth of the narrowest thing drawn. */
const TOLERANCE = 0.5;
/** How far the measured lap may be from the published length. */
const LENGTH_SLACK = 0.03;
const round = (x, places) => Math.round(x * 10 ** places) / 10 ** places;
const lonlat6 = (points) => points.map(([lon, lat]) => [round(lon, 6), round(lat, 6)]);
const BASES = ["documented", "plausible"];

const facts = [];
const osm = {};
for (const c of source.circuits) {
  const item = wikidata[c.wikidata] ?? fail(`${c.id}: Wikidata has no ${c.wikidata} in wikidata.json`);
  for (const lang of ["en", "ja"]) {
    if (item.labels[lang]?.value !== c.names[lang].value) fail(`${c.id}: the ${lang} name is not Wikidata's label (${item.labels[lang]?.value})`);
    const article = wikipedia[`${c.id}-${lang}`] ?? fail(`${c.id}: no ${lang} article in wikipedia.json`);
    if (article.revision !== c[lang].revision || article.title !== c[lang].title) fail(`${c.id}: the ${lang} article read is ${article.title} revision ${article.revision}, not ${c[lang].title} ${c[lang].revision}`);
  }
  const claim = (p) => (item.claims[p] ?? []).map((x) => x.mainsnak.datavalue?.value);
  if (!claim("P17").some((v) => v?.id === "Q30" && c.country.value === "US")) fail(`${c.id}: the country is not Wikidata's P17`);
  if (!claim("P1619").some((v) => v?.time?.startsWith(`+${c.opened.value}`))) fail(`${c.id}: the opening day is not Wikidata's P1619`);
  const en = wikipedia[`${c.id}-en`];
  const ja = wikipedia[`${c.id}-ja`];
  for (const key of ["opened", "length", "corners", "direction", "width", "pitLaneWidth"]) if (!BASES.includes(c[key].basis)) fail(`${c.id}: ${key} has no basis`);
  if (c.length.basis === "documented") {
    if (!en.infobox.includes(c.length.infobox)) fail(`${c.id}: the English infobox has no "${c.length.infobox}"`);
    if (Math.round(Number(c.length.infobox.split("=")[1]) * 1000) !== c.length.value) fail(`${c.id}: the length is not the infobox's`);
    if (!ja.infobox.some((line) => line.toLowerCase() === c.length.infobox.toLowerCase())) fail(`${c.id}: the Japanese infobox does not give the same length`);
  }
  if (c.corners.basis === "documented") {
    if (!en.infobox.includes(c.corners.infobox) || Number(c.corners.infobox.split("=")[1]) !== c.corners.value) fail(`${c.id}: the English infobox has no "${c.corners.infobox}"`);
  }
  if (c.direction.basis === "documented" && !en.sentences.some((s) => s.includes(c.direction.sentence))) fail(`${c.id}: no sentence says "${c.direction.sentence}"`);

  // ---- OpenStreetMap. ----
  const answer = read(`osm-${c.id}.json`);
  const elements = answer.osm.elements;
  const relation = elements.find((e) => e.type === "relation" && e.id === c.osm.relation) ?? fail(`${c.id}: no relation ${c.osm.relation}`);
  if (relation.tags.wikidata !== c.wikidata) fail(`${c.id}: the relation is not tagged with ${c.wikidata}`);
  const ways = new Map(elements.filter((e) => e.type === "way").map((e) => [e.id, e]));
  const nodes = new Map(elements.filter((e) => e.type === "node").map((e) => [e.id, e]));
  const toLonLat = (g) => g.map((p) => [p.lon, p.lat]);
  // The lap: the ways of the relation that are driven, in order, each turned the way it runs.
  const lapWays = relation.members.filter((m) => m.type === "way" && (m.role === "forward" || m.role === "backward"));
  const joined = [];
  for (const m of lapWays) {
    const way = ways.get(m.ref) ?? fail(`${c.id}: way ${m.ref} of the lap has no geometry`);
    const line = toLonLat(way.geometry);
    if (m.role === "backward") line.reverse();
    if (joined.length > 0) {
      const [a, b] = [joined.at(-1), line[0]];
      if (a[0] !== b[0] || a[1] !== b[1]) fail(`${c.id}: way ${m.ref} does not begin where the lap before it ends`);
      line.shift();
    }
    joined.push(...line);
  }
  const [first, last] = [joined[0], joined.at(-1)];
  if (first[0] !== last[0] || first[1] !== last[1]) fail(`${c.id}: the lap does not close`);
  joined.pop();
  const node = (role) => {
    const m = relation.members.find((x) => x.type === "node" && x.role === role) ?? fail(`${c.id}: the relation has no ${role} node`);
    const e = nodes.get(m.ref) ?? fail(`${c.id}: node ${m.ref} has no place`);
    return { source: `node/${e.id}`, at: [e.lon, e.lat] };
  };
  const start = node("start");
  const finish = node("finish");
  // The lap begins at the start: the ring is turned so that the point nearest the start node is first.
  const origin = [...start.at];
  const metres = metresFrom(origin, joined);
  const near = nearestOn(metres, [0, 0], true);
  const fromStart = [...joined.slice(near.i + 1), ...joined.slice(0, near.i + 1)];
  fromStart.unshift(lonLatFrom(origin, near.at));
  const rawLength = lineLength(metresFrom(origin, fromStart), true);
  const simple = simplifyLoop(metresFrom(origin, fromStart), TOLERANCE);
  const lap = lonlat6(simple.map((p) => lonLatFrom(origin, p)));
  const measured = lineLength(metresFrom(origin, lap), true);
  const off = measured / c.length.value - 1;
  if (Math.abs(off) > LENGTH_SLACK) fail(`${c.id}: the lap measures ${measured.toFixed(0)} m against the published ${c.length.value} m`);
  console.log(`${c.id}: the lap is ${joined.length} points, ${rawLength.toFixed(1)} m; simplified to ${lap.length} points, ${measured.toFixed(1)} m (${(off * 100).toFixed(2)} % from ${c.length.value} m)`);
  // The turns: the nodes tagged junction=yes with a ref, in the order of the lap.
  const lapMetres = metresFrom(origin, lap);
  const turns = relation.members
    .filter((m) => m.type === "node" && m.role === "" && nodes.get(m.ref)?.tags?.ref !== undefined)
    .map((m) => nodes.get(m.ref))
    .map((e) => ({ n: Number(e.tags.ref), source: `node/${e.id}`, at: [round(e.lon, 6), round(e.lat, 6)] }))
    .sort((a, b) => a.n - b.n);
  if (turns.length !== c.corners.value || turns.some((t, i) => t.n !== i + 1)) fail(`${c.id}: OpenStreetMap numbers ${turns.length} turns, not 1 to ${c.corners.value}`);
  let previous = -1;
  for (const t of turns) {
    const at = nearestOn(lapMetres, metresFrom(origin, [t.at])[0], true);
    if (at.d > 2) fail(`${c.id}: turn ${t.n} is ${at.d.toFixed(1)} m off the lap`);
    if (at.along <= previous) fail(`${c.id}: turn ${t.n} is not after turn ${t.n - 1} round the lap`);
    previous = at.along;
  }
  // The pit lane.
  const pitMember = relation.members.find((m) => m.type === "way" && m.role === "pit_lane") ?? fail(`${c.id}: the relation has no pit lane`);
  const pitWay = ways.get(pitMember.ref) ?? fail(`${c.id}: the pit lane has no geometry`);
  const pitLine = lonlat6(simplifyLine(metresFrom(origin, toLonLat(pitWay.geometry)), TOLERANCE).map((p) => lonLatFrom(origin, p)));
  // The circuit's ground, and the pit building inside it.
  const areaWay = ways.get(c.osm.area) ?? fail(`${c.id}: no area way ${c.osm.area}`);
  const areaRing = toLonLat(areaWay.geometry).slice(0, -1);
  const area = lonlat6(simplifyLoop(metresFrom(origin, areaRing), TOLERANCE).map((p) => lonLatFrom(origin, p)));
  let pitBuilding;
  if (c.osm.pitBuilding !== undefined) {
    const b = ways.get(c.osm.pitBuilding) ?? fail(`${c.id}: no building ${c.osm.pitBuilding}`);
    if (b.tags.building === undefined || b.tags.height === undefined) fail(`${c.id}: way ${b.id} is not a building with a height`);
    const ring = toLonLat(b.geometry).slice(0, -1);
    const m = metresFrom(origin, ring);
    const middle = m.reduce((s, p) => [s[0] + p[0] / m.length, s[1] + p[1] / m.length], [0, 0]);
    if (!inside(metresFrom(origin, areaRing), middle)) fail(`${c.id}: the pit building is not inside the circuit's ground`);
    const pitNear = Math.min(...m.map((p) => nearestOn(metresFrom(origin, pitLine), p, false).d));
    if (pitNear > 40) fail(`${c.id}: the pit building is ${pitNear.toFixed(0)} m from the pit lane`);
    pitBuilding = { source: `way/${b.id}`, ring: lonlat6(simplifyLoop(m, TOLERANCE).map((p) => lonLatFrom(origin, p))), height: Number(b.tags.height), ...(b.tags["building:levels"] === undefined ? {} : { levels: Number(b.tags["building:levels"]) }) };
  }
  osm[c.id] = {
    source: `relation/${relation.id}`,
    read: answer.read,
    base: answer.osm.osm3s.timestamp_osm_base,
    licence: "ODbL-1.0",
    attribution: "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
    lap,
    points: joined.length,
    tolerance: TOLERANCE,
    pitLane: { source: `way/${pitWay.id}`, line: pitLine },
    area: { source: `way/${areaWay.id}`, ring: area },
    turns,
    start: { source: start.source, at: lonlat6([start.at])[0] },
    finish: { source: finish.source, at: lonlat6([finish.at])[0] },
    ...(pitBuilding === undefined ? {} : { pitBuilding }),
  };
  facts.push({
    id: c.id,
    wikidata: c.wikidata,
    en: c.en,
    ja: c.ja,
    names: { en: c.names.en.value, ja: c.names.ja.value },
    country: c.country.value,
    opened: c.opened,
    length: c.length,
    corners: c.corners,
    direction: c.direction,
    width: c.width,
    pitLaneWidth: c.pitLaneWidth,
    turnNumbers: c.turnNumbers,
    pitBuilding: c.pitBuilding,
  });
}

const q = (value) => JSON.stringify(value);
const strip = ({ infobox, sentence, ...rest }) => (void infobox, void sentence, rest);
const factsText = `// Made by scripts/build-circuits.mjs from scripts/circuits.data.json and data-sources/circuits/${day}/: do not edit by hand.
// The facts are those of the Wikidata items and the English and Japanese Wikipedia articles (revisions) each entry cites, in our own words; see docs/circuits.md and NOTICE.md. Wikidata is CC0; the facts read from
// Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in circuits.osm.data.ts, apart, because it is ODbL.
import type { CircuitData } from "./circuits.types.ts";

export const CIRCUIT_DATA: CircuitData[] = [
${facts.map((c) => `  {\n${Object.entries(c).map(([key, value]) => `    ${q(key)}: ${q(typeof value === "object" && value !== null && "basis" in value ? strip(value) : value)},`).join("\n")}\n  },`).join("\n")}
];
`;
writeFileSync(new URL("../src/circuits.data.ts", import.meta.url), factsText);

const points = (list, pad) => `[\n${list.map((p) => `${pad}  ${q(p)}`).join(",\n")},\n${pad}]`;
const osmText = `// Made by scripts/build-circuits.mjs from the files of data-sources/circuits/${day}/: do not edit by hand.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each circuit's lap (the ways of its relation joined in the order and the direction
// they are driven, simplified to half a metre), its pit lane, its ground, the turns' numbers, the start and the finish and the pit building, longitude and latitude to six decimals. The package is MIT; this file is a
// derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (\`CIRCUIT_ATTRIBUTION\`). Nothing in a CC0 or CC BY-SA file of the
// package is copied from here or into here. The raw responses are in data-sources/circuits/.
import type { CircuitOsm } from "./circuits.types.ts";

export const CIRCUIT_OSM: Record<string, CircuitOsm> = {
${Object.entries(osm).map(([id, o]) => `  ${q(id)}: {
    "source": ${q(o.source)},
    "read": ${q(o.read)},
    "base": ${q(o.base)},
    "licence": "ODbL-1.0",
    "attribution": ${q(o.attribution)},
    "points": ${o.points},
    "tolerance": ${o.tolerance},
    "start": ${q(o.start)},
    "finish": ${q(o.finish)},
    "turns": ${points(o.turns, "    ")},
    "pitLane": { "source": ${q(o.pitLane.source)}, "line": ${points(o.pitLane.line, "    ")} },
    "area": { "source": ${q(o.area.source)}, "ring": ${points(o.area.ring, "    ")} },
${o.pitBuilding === undefined ? "" : `    "pitBuilding": { "source": ${q(o.pitBuilding.source)}, "height": ${o.pitBuilding.height},${o.pitBuilding.levels === undefined ? "" : ` "levels": ${o.pitBuilding.levels},`} "ring": ${points(o.pitBuilding.ring, "    ")} },\n`}    "lap": ${points(o.lap, "    ")},
  },`).join("\n")}
};
`;
writeFileSync(new URL("../src/circuits.osm.data.ts", import.meta.url), osmText);
console.log(`src/circuits.data.ts and src/circuits.osm.data.ts written from data-sources/circuits/${day}/`);
