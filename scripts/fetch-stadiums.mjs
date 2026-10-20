// Fetches what the real stadiums are drawn from and keeps it, dated, under data-sources/stadiums/<date>/ (`pnpm stadiums:fetch [date]`). It needs the network and is not part of `pnpm check`; run it when a
// stadium is added, then read the files when you write the stadium's facts in scripts/stadiums.data.json. A request at a time, a pause between them, and a User-Agent that names the project and a way to
// reach its author, as the services ask. A file that is already there is not fetched again.
//
//   osm-<id>.json      OpenStreetMap through the Overpass API (ODbL 1.0, "(c) OpenStreetMap contributors"): the building tagged with the stadium's Wikidata item, and the roof OpenStreetMap maps over it (a
//                      multipolygon of the roof's band and the opening in it), as OSM returned them (geometry and tags). Kept apart from every other file here: it is ODbL data, and src/stadiums.osm.data.ts says so.
//   wikidata.json      Wikidata (CC0): the claims of each stadium's item, as the API returned them.
//   wikipedia.json     English Wikipedia (CC BY-SA 4.0): the revision of each stadium's article and the sentences that speak of its seats, its bowls, its roof and its field, as evidence for a person to read; a fact
//                      is in scripts/stadiums.data.json in our own words, with the article and the revision.
//
// Overpass is polite use only: one query per stadium, 10 seconds apart, a back-off on 429, 502, 503 and 504 and the second public gateway when the first is busy.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const here = (name) => new URL(`./${name}`, import.meta.url);
const stadiums = JSON.parse(readFileSync(here("stadiums.data.json"), "utf8")).stadiums;
const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const out = new URL(`../data-sources/stadiums/${day}/`, import.meta.url);
mkdirSync(out, { recursive: true });
const USER_AGENT = "kyogijo-venues/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
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
  const ids = stadiums.map((v) => v.wikidata).join("|");
  const body = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=labels|claims|sitelinks&languages=en|ja&format=json&formatversion=2`);
  writeFileSync(wikidataFile, `${JSON.stringify({ read: day, licence: "Wikidata, CC0", entities: body.entities }, null, 1)}\n`);
  console.log("wikidata.json written");
  await pause(2000);
}

// ---- English Wikipedia. ----
const wikipediaFile = new URL("wikipedia.json", out);
const TOPIC = /\b(?:capacity|seats|football|soccer|pitch|field|levels?|tiers?|decks?|bowls?|roof|retractable|cables?|opening|pod|concourse|suites?|seating|rows?|steel|dome|domed)\b/i;
const plain = (text) =>
  text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/\{\{\s*(?:convert|cvt)\s*\|([^{}|]*)\|([^{}|]*)(?:\|[^{}]*)?\}\}/gi, "$1 $2")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
if (!existsSync(wikipediaFile)) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids|timestamp|content&rvslots=main&titles=${encodeURIComponent(stadiums.map((v) => v.en.title).join("|"))}&redirects=1&format=json&formatversion=2`;
  const answer = (await getJson(url)).query;
  const redirected = new Map([...(answer.normalized ?? []), ...(answer.redirects ?? [])].map((r) => [r.from, r.to]));
  const resolve = (title) => {
    let t = title;
    for (let i = 0; i < 4 && redirected.has(t); i += 1) t = redirected.get(t);
    return t;
  };
  const articles = {};
  for (const v of stadiums) {
    const page = answer.pages.find((p) => p.title === resolve(v.en.title));
    const revision = page?.revisions?.[0];
    if (revision === undefined) {
      console.log(`${v.id}: no article ${v.en.title}`);
      continue;
    }
    const content = revision.slots.main.content;
    // The infobox's capacity line is a fact worth keeping whole (the figures for the other configurations are in it); the prose is kept as the sentences that speak of the topics.
    const capacity = /\|\s*capacity\s*=\s*([^\n]*)/.exec(content)?.[1]?.replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1");
    const prose = plain(content);
    const sentences = prose.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((s) => TOPIC.test(s) && s.length < 500);
    articles[v.id] = { title: page.title, revision: revision.revid, timestamp: revision.timestamp, infoboxCapacity: capacity, sentences };
  }
  writeFileSync(wikipediaFile, `${JSON.stringify({ read: day, licence: "English Wikipedia, CC BY-SA 4.0: sentences kept as evidence only", articles }, null, 1)}\n`);
  console.log(`wikipedia.json written (${Object.keys(articles).length} articles)`);
  await pause(2000);
}

// ---- OpenStreetMap, through Overpass. ----
let gateway = 0;
for (const v of stadiums) {
  const file = new URL(`osm-${v.id}.json`, out);
  if (existsSync(file)) continue;
  // The building tagged with the stadium's Wikidata item, and the roof mapped over it (a multipolygon of the band and its opening; the relation's own ways come with it).
  const query = `[out:json][timeout:60];(nwr["wikidata"="${v.wikidata}"];${v.roofRelation === undefined ? "" : `rel(${v.roofRelation});`});out geom;`;
  let answer;
  for (let attempt = 0; attempt < 8 && answer === undefined; attempt += 1) {
    const url = GATEWAYS[gateway % GATEWAYS.length];
    try {
      const response = await fetch(url, { method: "POST", headers: { "user-agent": USER_AGENT, "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: `data=${encodeURIComponent(query)}` });
      const text = await response.text();
      if (response.ok && text.startsWith("{")) {
        const json = JSON.parse(text);
        if (json.remark === undefined || !/runtime error|timed out/i.test(json.remark)) answer = { gateway: url, json };
      }
      if (answer === undefined) {
        console.log(`${v.id}: ${response.status} from ${url}, waiting`);
        gateway += 1;
        await pause(30000 * (1 + Math.floor(attempt / 2)));
      }
    } catch (error) {
      console.log(`${v.id}: ${String(error).slice(0, 80)}, waiting`);
      gateway += 1;
      await pause(30000);
    }
  }
  if (answer === undefined) {
    console.log(`${v.id}: no answer, run again later`);
    continue;
  }
  const { json } = answer;
  writeFileSync(file, `${JSON.stringify({ read: day, licence: "ODbL 1.0, (c) OpenStreetMap contributors, openstreetmap.org/copyright", gateway: answer.gateway, query, osmBase: json.osm3s?.timestamp_osm_base, wikidata: v.wikidata, elements: json.elements }, null, 1)}\n`);
  console.log(`${v.id}: ${json.elements.length} elements, OSM data of ${json.osm3s?.timestamp_osm_base}`);
  await pause(10000);
}
process.exit(0);
