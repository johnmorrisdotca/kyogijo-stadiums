// Checks scripts/parks.data.json against Wikidata (`pnpm parks:check`). It needs the network and is not part of `pnpm check`.
//
// For each park it reads the Wikidata item the entry names and checks that: the item's English article, when it is not the one the entry
// cites (an article is moved now and then), is named in a note; the item's coordinates (P625) are the entry's; and the item's country (P17), by its ISO 3166-1 alpha-2 code
// (P297), is the entry's; and the years it opened and closed are Wikidata's where it gives them. A request at a time, with a User-Agent that names the project and a way to reach its author, as Wikimedia
// asks. Wikidata's data is CC0.
import { readFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const parks = JSON.parse(readFileSync(new URL("./parks.data.json", import.meta.url), "utf8"));
const USER_AGENT = "kyogijo-parks-check/0.1 (https://github.com/johnmorrisdotca/kyogijo; john@johnmorris.ca)";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ask = async (ids, props) => {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=${props}&format=json&formatversion=2&redirects=yes`;
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}`);
  await pause(1500);
  return (await response.json()).entities;
};
const plain = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const entities = {};
for (let i = 0; i < parks.length; i += 25) Object.assign(entities, await ask(parks.slice(i, i + 25).map((p) => p.wikidata), "claims|sitelinks"));
const countries = new Set(Object.values(entities).flatMap((e) => (e.claims?.P17 ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id)).filter(Boolean));
const iso = {};
for (const [id, entity] of Object.entries(await ask([...countries], "claims"))) iso[id] = entity.claims?.P297?.[0]?.mainsnak?.datavalue?.value;

let problems = 0;
const report = (p, text) => {
  problems += 1;
  console.log(`${p.id} (${p.wikidata}): ${text}`);
};
for (const p of parks) {
  const e = entities[p.wikidata];
  if (e === undefined || e.missing !== undefined) {
    report(p, "no such item");
    continue;
  }
  if (e.id !== p.wikidata) report(p, `the item is now ${e.id}`);
  const site = e.sitelinks?.enwiki?.title;
  // An article that has been moved since the revision the entry cites is a note and not a problem: the revision still names the article.
  if (p.en !== undefined && (site === undefined || plain(site) !== plain(p.en.title))) console.log(`note: ${p.id} (${p.wikidata}): its English article is now ${site}, and the entry cites ${p.en.title}`);
  const at = e.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  if (at === undefined) report(p, "the item has no coordinates");
  else if (Math.abs(at.latitude - p.lat) > 0.0005 || Math.abs(at.longitude - p.lon) > 0.0005) report(p, `its coordinates are ${at.latitude}, ${at.longitude}, not ${p.lat}, ${p.lon}`);
  // The years it opened and closed, where Wikidata gives them to the year; a year the entry has and Wikidata lacks was read from an article.
  for (const [key, claims] of [["opened", [e.claims?.P1619, e.claims?.P571]], ["closed", [e.claims?.P3999, e.claims?.P576]]]) {
    const years = claims.map((c) => c?.[0]?.mainsnak?.datavalue?.value).filter((v) => v !== undefined && v.precision >= 9).map((v) => Number(/^[+-]?(\d+)-/.exec(v.time)?.[1]));
    if (years.length > 0 && p[key] !== years[0]) report(p, `Wikidata gives ${key} ${years[0]}, not ${p[key]}`);
  }
  const country = (e.claims?.P17 ?? []).map((claim) => iso[claim.mainsnak?.datavalue?.value?.id]).filter(Boolean);
  if (!country.includes(p.country)) report(p, `its country is ${country.join(", ")}, not ${p.country}`);
}
console.log(problems === 0 ? `${parks.length} parks agree with Wikidata` : `${problems} problems`);
process.exit(problems === 0 ? 0 : 1);
