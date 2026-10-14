// Writes scripts/names.wikidata.json: what Wikidata (CC0) holds about the names of every ballpark and ground (`pnpm names:fetch`). It needs the network and is not part
// of `pnpm check`; run it when a place is added or renamed, then read the file when you write the place's names in scripts/parks.data.json or scripts/grounds.data.json.
//
// For each item: the labels in English, Japanese and the place's own language; the aliases in the same languages; the official name (P1448), the nickname (P1449), the
// name (P2561, with its years), the short name (P1813), the name in kana (P1814); and the titles of the English and Japanese Wikipedia articles it is linked to.
// Nothing here is a name until a person has read it and chosen: this file is the evidence the names of the data cite. A request at a time, a pause between them, and a
// User-Agent that names the project and a way to reach its author, as Wikimedia asks.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const here = (name) => new URL(`./${name}`, import.meta.url);
const parks = JSON.parse(readFileSync(here("parks.data.json"), "utf8"));
const grounds = JSON.parse(readFileSync(here("grounds.data.json"), "utf8"));
const USER_AGENT = "kyogijo-names/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ask = async (ids, languages) => {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=labels|aliases|claims|sitelinks&languages=${languages.join("|")}&sitefilter=enwiki|jawiki&format=json&formatversion=2&redirects=yes`;
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}`);
  await pause(1500);
  return (await response.json()).entities;
};

const places = [...parks.map((p) => ({ id: p.id, wikidata: p.wikidata })), ...grounds.map((g) => ({ id: g.id, wikidata: g.wikidata }))];
const languages = [...new Set(["en", "ja", ...grounds.map((g) => g.localLanguage).filter(Boolean)])];
const entities = {};
for (let i = 0; i < places.length; i += 20) Object.assign(entities, await ask(places.slice(i, i + 20).map((p) => p.wikidata), languages));

const text = (claim) => claim?.mainsnak?.datavalue?.value;
const monolingual = (claims) => (claims ?? []).map((claim) => text(claim)).filter(Boolean).map((v) => ({ text: v.text, lang: v.language }));
const year = (claim, key) => {
  const time = claim.qualifiers?.[key]?.[0]?.datavalue?.value;
  return time !== undefined && time.precision >= 9 ? Number(/^[+-]?(\d+)-/.exec(time.time)?.[1]) : undefined;
};
const out = {};
let missing = 0;
for (const place of places) {
  const e = entities[place.wikidata];
  if (e === undefined || e.missing !== undefined) {
    missing += 1;
    console.log(`${place.id} (${place.wikidata}): not found`);
    continue;
  }
  const labels = Object.fromEntries(Object.entries(e.labels ?? {}).map(([lang, v]) => [lang, v.value]));
  const aliases = Object.fromEntries(Object.entries(e.aliases ?? {}).map(([lang, list]) => [lang, list.map((v) => v.value)]));
  const named = (e.claims?.P2561 ?? []).map((claim) => {
    const v = text(claim);
    return v === undefined ? undefined : { text: v.text, lang: v.language, ...(year(claim, "P580") === undefined ? {} : { from: year(claim, "P580") }), ...(year(claim, "P582") === undefined ? {} : { to: year(claim, "P582") }) };
  }).filter(Boolean);
  out[place.id] = {
    wikidata: place.wikidata,
    labels,
    aliases,
    official: monolingual(e.claims?.P1448),
    nickname: monolingual(e.claims?.P1449),
    names: named,
    short: monolingual(e.claims?.P1813),
    kana: (e.claims?.P1814 ?? []).map((claim) => text(claim)).filter((v) => typeof v === "string"),
    enwiki: e.sitelinks?.enwiki?.title,
    jawiki: e.sitelinks?.jawiki?.title,
  };
}
writeFileSync(here("names.wikidata.json"), `${JSON.stringify({ read: new Date().toISOString().slice(0, 10), licence: "CC0", items: out }, null, 1)}\n`);
console.log(`${Object.keys(out).length} of ${places.length} places read`);
process.exit(missing === 0 ? 0 : 1);
