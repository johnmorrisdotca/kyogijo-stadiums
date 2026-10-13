// Checks scripts/grounds.data.json against Wikidata (`pnpm grounds:check`). It needs the network and is not part of `pnpm check`.
//
// For each ground it reads the Wikidata item the entry names and checks that: the item's English article is the article the entry
// cites; one of the ground's names (the English one, the local one, a name it had, or the article's title) is a label or an alias of
// the item, in any language, ignoring accents, case and punctuation; the item's coordinates (P625) are the entry's; and the item's
// country (P17), by its ISO 3166-1 alpha-2 code (P297), is the entry's; and every alias that says it was read from Wikidata is still a label, an alias or a name
// (P1448, P1449, P2561, P1813) of the item. A request at a time, with a User-Agent that names the
// project and a way to reach its author, as Wikimedia asks. Wikidata's data is CC0.
import { readFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";
import { checkWikidataAliases } from "./names-lib.mjs";

const grounds = JSON.parse(readFileSync(new URL("./grounds.data.json", import.meta.url), "utf8"));
const USER_AGENT = "kyogijo-grounds-check/0.1 (https://github.com/johnmorrisdotca/kyogijo; john@johnmorris.ca)";
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
for (let i = 0; i < grounds.length; i += 25) Object.assign(entities, await ask(grounds.slice(i, i + 25).map((g) => g.wikidata), "labels|aliases|claims|sitelinks"));
const countries = new Set(Object.values(entities).flatMap((e) => (e.claims?.P17 ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id)).filter(Boolean));
const iso = {};
for (const [id, entity] of Object.entries(await ask([...countries], "claims"))) iso[id] = entity.claims?.P297?.[0]?.mainsnak?.datavalue?.value;

let problems = 0;
const report = (g, text) => {
  problems += 1;
  console.log(`${g.id} (${g.wikidata}): ${text}`);
};
for (const g of grounds) {
  const e = entities[g.wikidata];
  if (e === undefined || e.missing !== undefined) {
    report(g, "no such item");
    continue;
  }
  if (e.id !== g.wikidata) report(g, `the item is now ${e.id}`);
  const site = e.sitelinks?.enwiki?.title;
  if (site === undefined || plain(site) !== plain(g.en.title)) report(g, `its English article is ${site}, not ${g.en.title}`);
  const known = new Set([...Object.values(e.labels ?? {}).map((l) => plain(l.value)), ...Object.values(e.aliases ?? {}).flat().map((a) => plain(a.value))]);
  const names = [g.name, g.localName, g.en.title, g.nameJa, ...(g.names ?? []).map((n) => n.name)].filter(Boolean);
  // A name that carries a disambiguation in brackets, such as "Wembley Stadium (1923)", is a label without it.
  if (!names.some((name) => known.has(plain(name)) || known.has(plain(name.replace(/\s*\(.*\)\s*$/, ""))))) report(g, `none of ${names.join("; ")} is a label of the item (${e.labels?.en?.value})`);
  checkWikidataAliases(e, g, report);
  const at = e.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  if (at === undefined) report(g, "the item has no coordinates");
  else if (Math.abs(at.latitude - g.lat) > 0.0005 || Math.abs(at.longitude - g.lon) > 0.0005) report(g, `its coordinates are ${at.latitude}, ${at.longitude}, not ${g.lat}, ${g.lon}`);
  const country = (e.claims?.P17 ?? []).map((claim) => iso[claim.mainsnak?.datavalue?.value?.id]).filter(Boolean);
  if (!country.includes(g.country)) report(g, `its country is ${country.join(", ")}, not ${g.country}`);
}
console.log(problems === 0 ? `${grounds.length} grounds agree with Wikidata` : `${problems} problems`);
process.exit(problems === 0 ? 0 : 1);
