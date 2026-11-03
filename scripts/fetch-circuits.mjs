// Fetches what the circuits are drawn from and keeps it, dated, under data-sources/circuits/<date>/ (`pnpm circuits:fetch <date> [circuit]`: every circuit of scripts/circuits.data.json, or the one named). It needs the
// network and is not part of `pnpm check`; run it when a circuit is added, then read the files when you write the circuit's facts in scripts/circuits.data.json. A request at a time, a pause between them, and a
// User-Agent that names the project and a way to reach its author, as the services ask.
//
//   osm-<id>.json        OpenStreetMap through the Overpass API (ODbL 1.0, "(c) OpenStreetMap contributors"): the circuit's relation with its members (the ways of the lap, the pit lane, the start and finish
//                        nodes), each way's geometry, the area of the circuit, every building inside that area, and any kerb, run-off, gravel or sand mapped within 60 metres of the lap. Kept apart from every
//                        other file here: it is ODbL data, and src/circuits.osm.data.ts says so.
//   wikidata.json        Wikidata (CC0): the claims, labels and sitelinks of each circuit's item, as the API returned them.
//   wikipedia.json       English and Japanese Wikipedia (CC BY-SA 4.0): the revision of each circuit's article, its infobox lines and the sentences that speak of its length, its corners, its width and its
//                        pit building, as evidence for a person to read; a fact is in scripts/circuits.data.json in our own words, with the article and the revision.
//
// Overpass is polite use only: one query per circuit, a back-off on 429, 502, 503 and 504 and another public gateway when the first is busy. A file that is already there is not fetched again.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const source = JSON.parse(readFileSync(new URL("./circuits.data.json", import.meta.url), "utf8"));
const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const only = process.argv[3];
const circuits = source.circuits.filter((c) => only === undefined || c.id === only);
if (circuits.length === 0) throw new Error(`usage: pnpm circuits:fetch <date> [circuit], a circuit of ${source.circuits.map((c) => c.id).join(", ")}`);
const out = new URL(`../data-sources/circuits/${day}/`, import.meta.url);
mkdirSync(out, { recursive: true });
const USER_AGENT = "kyogijo-circuits/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
const GATEWAYS = ["https://overpass-api.de/api/interpreter", "https://lambert.openstreetmap.de/api/interpreter"];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJson = async (url) => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`${response.status} for ${url.slice(0, 120)}`);
    await pause(10000 * (attempt + 1));
  }
  throw new Error(`gave up on ${url.slice(0, 120)}`);
};

// ---- Wikidata. ----
const wikidataFile = new URL("wikidata.json", out);
if (!existsSync(wikidataFile)) {
  const ids = circuits.map((c) => c.wikidata).join("|");
  const body = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=labels|claims|sitelinks&languages=en|ja&format=json&formatversion=2`);
  writeFileSync(wikidataFile, `${JSON.stringify({ read: day, licence: "Wikidata, CC0", entities: body.entities }, null, 1)}\n`);
  console.log("wikidata.json written");
  await pause(2000);
}

// ---- English and Japanese Wikipedia: the infobox's lines and the sentences that speak of the lap, as evidence. ----
const TOPIC = /\b(?:length|long|km|kilometres?|kilometers?|miles?|turns?|corners?|wide|width|metres|meters|pit|paddock|grandstands?|bridge|anti-clockwise|counter-clockwise|clockwise|opened|first)\b|全長|コーナー|ターン|幅|ピット|周回|反時計回り|時計回り/i;
const INFOBOX = /^\s*\|\s*(length_km|length_mi|length|turns|record_time|opened|surface|major_events|events|layout|area|address|coordinates|ground|construction|owner|operator|direction)\s*=\s*(.*)$/gim;
const plain = (text) =>
  text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/\{\{\s*(?:convert|cvt)\s*\|([^{}|]*)\|([^{}|]*)(?:\|[^{}]*)?\}\}/gi, "$1 $2")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:File|Image|Category|ファイル|画像):[^\]]*\]\]/gi, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const wikipediaFile = new URL("wikipedia.json", out);
if (!existsSync(wikipediaFile)) {
  const articles = {};
  for (const lang of ["en", "ja"]) {
    const wanted = circuits.filter((c) => c[lang]?.title !== undefined);
    if (wanted.length === 0) continue;
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids|timestamp|content&rvslots=main&titles=${encodeURIComponent(wanted.map((c) => c[lang].title).join("|"))}&redirects=1&format=json&formatversion=2`;
    const answer = (await getJson(url)).query;
    const redirected = new Map([...(answer.normalized ?? []), ...(answer.redirects ?? [])].map((r) => [r.from, r.to]));
    const resolve = (title) => {
      let t = title;
      for (let i = 0; i < 4 && redirected.has(t); i += 1) t = redirected.get(t);
      return t;
    };
    for (const c of wanted) {
      const page = answer.pages.find((p) => p.title === resolve(c[lang].title));
      const revision = page?.revisions?.[0];
      if (revision === undefined) {
        console.log(`${c.id}: no ${lang} article ${c[lang].title}`);
        continue;
      }
      const text = revision.slots.main.content;
      const infobox = [...text.matchAll(INFOBOX)].map((m) => `${m[1]} = ${plain(m[2])}`);
      const prose = plain(text);
      const sentences = prose.split(lang === "ja" ? /(?<=。)/ : /(?<=[.!?])\s+(?=[A-Z])/).filter((s) => TOPIC.test(s) && s.length < 500);
      articles[`${c.id}-${lang}`] = { title: page.title, revision: revision.revid, timestamp: revision.timestamp, infobox, sentences };
    }
    await pause(2000);
  }
  writeFileSync(wikipediaFile, `${JSON.stringify({ read: day, licence: "English and Japanese Wikipedia, CC BY-SA 4.0: lines kept as evidence only", articles }, null, 1)}\n`);
  console.log(`wikipedia.json written (${Object.keys(articles).length} articles)`);
}

// ---- OpenStreetMap, through Overpass: one query per circuit. ----
let gateway = 0;
for (const c of circuits) {
  const file = new URL(`osm-${c.id}.json`, out);
  if (existsSync(file)) continue;
  // The relation (its members with their roles), the nodes it names (start, finish) with their tags, every way of it with its geometry, the area of the circuit, the buildings inside that area, and the kerbs,
  // run-off, gravel and sand mapped within 60 metres of the lap.
  const query = [
    "[out:json][timeout:120];",
    `relation(${c.osm.relation})->.r;`,
    ".r out body;",
    "node(r.r);out body;",
    "way(r.r)->.lap;",
    ".lap out tags geom;",
    `way(${c.osm.area})->.a;`,
    ".a out tags geom;",
    ".a map_to_area->.inside;",
    "(way(area.inside)[building];relation(area.inside)[building];)->.b;",
    ".b out tags geom;",
    "(nwr(around.lap:60)[barrier=kerb];nwr(around.lap:60)[kerb];nwr(around.lap:60)[raceway~\"^(runoff|kerb|gravel_trap|escape)$\"];nwr(around.lap:60)[surface~\"^(gravel|sand|fine_gravel)$\"][!highway];nwr(around.lap:60)[natural=sand];nwr(around.lap:60)[landuse=gravel];)->.k;",
    ".k out tags geom;",
  ].join("");
  let answer;
  for (let attempt = 0; attempt < 8 && answer === undefined; attempt += 1) {
    const url = GATEWAYS[gateway % GATEWAYS.length];
    const response = await fetch(url, { method: "POST", headers: { "user-agent": USER_AGENT, "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: `data=${encodeURIComponent(query)}` });
    const text = await response.text();
    if (response.ok && text.startsWith("{")) {
      const json = JSON.parse(text);
      if (json.remark === undefined || !/runtime error|timed out/i.test(json.remark)) answer = { gateway: url, json };
    }
    if (answer === undefined) {
      gateway += 1;
      await pause(15000 * (attempt + 1));
    }
  }
  if (answer === undefined) throw new Error(`Overpass gave no answer for ${c.id}`);
  writeFileSync(file, `${JSON.stringify({ read: day, licence: "OpenStreetMap, ODbL 1.0, (c) OpenStreetMap contributors, openstreetmap.org/copyright", gateway: answer.gateway, query, osm: answer.json }, null, 1)}\n`);
  console.log(`osm-${c.id}.json written (${answer.json.elements.length} elements)`);
  await pause(10000);
}
