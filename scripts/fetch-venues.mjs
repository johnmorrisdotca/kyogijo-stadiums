// Fetches what the real venues are drawn from and keeps it, dated, under data-sources/venues/<date>/ (`pnpm venues:fetch <date> <division>`: the venues of one division, which scripts/venues.data.json lists). It needs the network and is not part of `pnpm check`; run it when a
// venue is added, then read the files when you write the venue's facts in scripts/venues.data.json. A request at a time, a pause between them, and a User-Agent that names the project and a way to
// reach its author, as the services ask.
//
//   osm-<id>.json      OpenStreetMap through the Overpass API (ODbL 1.0, "(c) OpenStreetMap contributors"): the building tagged with the venue's Wikidata item, and any ice rink or ice hockey pitch
//                      mapped round it, as OSM returned them (geometry and tags). Kept apart from every other file here: it is ODbL data, and src/venues.osm.data.ts says so.
//   wikidata-<division>.json   Wikidata (CC0): the claims of each venue's item, as the API returned them.
//   wikipedia-<division>.json  English Wikipedia (CC BY-SA 4.0): the revision of each venue's article and the sentences that speak of its seating levels, its roof and its bowl, as evidence for a person
//                      to read; a fact is in scripts/venues.data.json in our own words, with the article and the revision.
//
// Overpass is polite use only: one query per venue, 10 seconds apart, a back-off on 429, 502, 503 and 504 and the second public gateway when the first is busy. A file that is already there is not fetched again.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const here = (name) => new URL(`./${name}`, import.meta.url);
const source = JSON.parse(readFileSync(here("venues.data.json"), "utf8"));
const arenas = JSON.parse(readFileSync(here("arenas.data.json"), "utf8"));
const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const division = process.argv[3];
if (source.divisions[division] === undefined) throw new Error(`usage: pnpm venues:fetch <date> <division>, a division of ${Object.keys(source.divisions).join(", ")}`);
// The division's venues: the arena's own data gives the Wikidata item, the coordinates and the article (the facts of a venue are written after the files are read).
const venues = source.divisions[division].venues.map((id) => {
  const arena = arenas.find((a) => a.id === id);
  if (arena === undefined) throw new Error(`${id} is not an arena of scripts/arenas.data.json`);
  return { id, wikidata: arena.wikidata, lat: arena.lat, lon: arena.lon, en: { title: arena.en.title } };
});
const out = new URL(`../data-sources/venues/${day}/`, import.meta.url);
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
const wikidataFile = new URL(`wikidata-${division}.json`, out);
if (!existsSync(wikidataFile)) {
  const ids = venues.map((v) => v.wikidata).join("|");
  const body = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=labels|claims|sitelinks&languages=en|ja&format=json&formatversion=2`);
  writeFileSync(wikidataFile, `${JSON.stringify({ read: day, licence: "Wikidata, CC0", entities: body.entities }, null, 1)}\n`);
  console.log(`wikidata-${division}.json written`);
  await pause(2000);
}

// ---- English Wikipedia. ----
const wikipediaFile = new URL(`wikipedia-${division}.json`, out);
const TOPIC = /\b(?:capacity|seats|hockey|levels?|tiers?|decks?|bowl|roof|dome|domed|retractable|canopy|saddle|concourse|suites?|seating|seats|rows?|steel|trusses|truss|arch|arched|ceiling)\b/i;
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
/** The infobox's `capacity` line, as the article has it (an infobox lists the seats by sport and by year, and a sentence of the prose does not always carry them). Evidence for a person to read, like the sentences. */
const infoboxOf = (wikitext) => {
  const found = /\|\s*(?:seating_capacity|capacity)\s*=\s*([\s\S]*?)(?=\n\s*\|\s*[\w ]+=|\n\}\})/i.exec(wikitext);
  if (found === null) return {};
  const cleaned = found[1]
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/\{\{\s*(?:plainlist|unbulleted list|ubl|bulleted list|hlist|nowrap|flatlist)\s*\|/gi, "")
    .replace(/\{\{\s*(?:convert|cvt)\s*\|([^{}|]*)\|([^{}|]*)(?:\|[^{}]*)?\}\}/gi, "$1 $2")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/<br\s*\/?>/gi, "; ")
    .replace(/^\s*[*|]\s*/gm, "; ")
    .replace(/[{}]/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[;\s]+/, "")
    .trim();
  return { capacity: cleaned };
};
if (!existsSync(wikipediaFile)) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids|timestamp|content&rvslots=main&titles=${encodeURIComponent(venues.map((v) => v.en.title).join("|"))}&redirects=1&format=json&formatversion=2`;
  const answer = (await getJson(url)).query;
  const redirected = new Map([...(answer.normalized ?? []), ...(answer.redirects ?? [])].map((r) => [r.from, r.to]));
  const resolve = (title) => {
    let t = title;
    for (let i = 0; i < 4 && redirected.has(t); i += 1) t = redirected.get(t);
    return t;
  };
  const articles = {};
  for (const v of venues) {
    const page = answer.pages.find((p) => p.title === resolve(v.en.title));
    const revision = page?.revisions?.[0];
    if (revision === undefined) {
      console.log(`${v.id}: no article ${v.en.title}`);
      continue;
    }
    const prose = plain(revision.slots.main.content);
    const sentences = prose.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((s) => TOPIC.test(s) && s.length < 500);
    articles[v.id] = { title: page.title, revision: revision.revid, timestamp: revision.timestamp, infobox: infoboxOf(revision.slots.main.content), sentences };
  }
  writeFileSync(wikipediaFile, `${JSON.stringify({ read: day, licence: "English Wikipedia, CC BY-SA 4.0: sentences kept as evidence only", articles }, null, 1)}\n`);
  console.log(`wikipedia-${division}.json written (${Object.keys(articles).length} articles)`);
  await pause(2000);
}

// ---- OpenStreetMap, through Overpass. ----
let gateway = 0;
for (const v of venues) {
  const file = new URL(`osm-${v.id}.json`, out);
  if (existsSync(file)) continue;
  // `out geom` (not `out geom tags`) so that a building mapped as a relation comes with its members and their geometry (the Pacific division's files were made with `out geom tags`; each file keeps its own query).
  // The building (or buildings and parts) tagged with the venue's Wikidata item, and the ice round it: a rink, or a pitch of ice hockey.
  const query = `[out:json][timeout:60];(nwr["wikidata"="${v.wikidata}"];nwr(around:300,${v.lat},${v.lon})["sport"="ice_hockey"];nwr(around:300,${v.lat},${v.lon})["leisure"="ice_rink"];);out geom;`;
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
