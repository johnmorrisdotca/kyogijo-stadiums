// Writes scripts/arenas.wikidata.json: what Wikidata (CC0) and the English Wikipedia (CC BY-SA, the infobox and the sentences that give a rink or a court size, at the revision
// named) hold about every arena of scripts/arenas.data.json (`pnpm arenas:fetch`). It needs the network and is not part of `pnpm check`; run it when an arena is added, then read the
// file when you write the arena's facts in scripts/arenas.data.json.
//
// For each item: the labels and aliases in English and Japanese, the official name (P1448), the names it had (P2561, with their years), the coordinates (P625), the years it opened
// (P1619, P571), closed (P3999) and was demolished (P576), the capacities (P1083) with what each applies to (P518) and when (P585), the place it stands in (P131, to the city) and
// its country (P17, by P297), and the titles of its English and Japanese articles. For each article: the revision, the infobox parameters that matter (capacity, opened, closed,
// demolished, former names, location, dimensions, surface) and the sentences that give a size in feet or metres next to the word rink, ice, court or floor. Nothing here is a fact of the
// data until a person has read it and written it in scripts/arenas.data.json with the source: this file is the evidence. A request at a time, a pause between them, and a User-Agent
// that names the project and a way to reach its author, as Wikimedia asks.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const here = (name) => new URL(`./${name}`, import.meta.url);
const arenas = JSON.parse(readFileSync(here("arenas.data.json"), "utf8"));
const USER_AGENT = "kyogijo-arenas/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const get = async (url) => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
    if (response.ok) {
      await pause(1500);
      return response.json();
    }
    if (response.status !== 429 && response.status < 500) throw new Error(`${response.status} for ${url.slice(0, 120)}`);
    await pause(10000 * (attempt + 1));
  }
  throw new Error(`gave up on ${url.slice(0, 120)}`);
};
const wikidata = async (ids, props, languages = "en|ja") => {
  const out = {};
  for (let i = 0; i < ids.length; i += 40) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.slice(i, i + 40).join("|")}&props=${props}&languages=${languages}&sitefilter=enwiki|jawiki&format=json&formatversion=2&redirects=yes`;
    Object.assign(out, (await get(url)).entities);
  }
  return out;
};
const value = (claim) => claim?.mainsnak?.datavalue?.value;
const ids = (e, property) => (e.claims?.[property] ?? []).map((c) => value(c)?.id).filter(Boolean);
const yearOf = (time) => (time === undefined || time.precision < 9 ? undefined : Number(/^[+-]?(\d+)-/.exec(time.time)?.[1]));
const yearsOf = (e, property) => (e.claims?.[property] ?? []).map((c) => yearOf(value(c))).filter((y) => y !== undefined);
const qualifierYear = (c, key) => yearOf(c.qualifiers?.[key]?.[0]?.datavalue?.value);
const monolingual = (claims) => (claims ?? []).map((c) => value(c)).filter(Boolean).map((v) => ({ text: v.text, lang: v.language }));

const entities = await wikidata(arenas.map((a) => a.wikidata), "labels|aliases|claims|sitelinks");
// Labels of the items the claims point to: the places the arenas stand in, the countries, and what a capacity applies to.
const pointed = new Set();
for (const e of Object.values(entities)) {
  for (const id of [...ids(e, "P131"), ...ids(e, "P17"), ...(e.claims?.P1083 ?? []).flatMap((c) => [...(c.qualifiers?.P518 ?? []), ...(c.qualifiers?.P641 ?? [])].map((q) => q.datavalue?.value?.id).filter(Boolean))]) pointed.add(id);
}
const targets = await wikidata([...pointed], "labels|claims");
const label = (id) => targets[id]?.labels?.en?.value;
const iso = (id) => value(targets[id]?.claims?.P297?.[0]);

/** The value of a parameter of the first infobox in wikitext, read by counting braces and brackets. */
function infoboxParameters(text) {
  const open = /\{\{\s*infobox[^|{}]*/i.exec(text);
  if (open === null) return {};
  const found = {};
  let depth = 0;
  let i = open.index;
  let start = -1;
  let name = "";
  const close = () => {
    if (name !== "" && start >= 0) found[name] = text.slice(start, i).trim();
  };
  for (; i < text.length; i += 1) {
    const two = text.slice(i, i + 2);
    if (two === "{{" || two === "[[") { depth += 1; i += 1; continue; }
    if (two === "}}" || two === "]]") { depth -= 1; if (depth === 0) { close(); break; } i += 1; continue; }
    if (text[i] === "|" && depth === 1) {
      close();
      const eq = text.indexOf("=", i);
      name = eq > 0 ? text.slice(i + 1, eq).trim().toLowerCase() : "";
      start = eq + 1;
    }
  }
  return found;
}
const KEEP = ["capacity", "opened", "closed", "demolished", "built", "broke_ground", "former_names", "name", "fullname", "location", "address", "coordinates", "surface", "dimensions", "tenants", "owner", "operator", "architect", "built_for"];
/** The words of a piece of wikitext: links read as their text, templates and references cut out. */
const plain = (text) =>
  text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/\{\{\s*(?:start|end)[ -]date(?: and age)?\s*\|\s*(\d{4})(?:\|\s*(\d{1,2}))?(?:\|\s*(\d{1,2}))?[^{}]*\}\}/gi, "$1")
    .replace(/\{\{\s*(?:convert|cvt)\s*\|([^{}|]*)\|([^{}|]*)(?:\|[^{}]*)?\}\}/gi, "$1 $2")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** The sentences that give a size in feet, yards or metres near the word rink, ice, court or floor. */
function sizeSentences(text) {
  const prose = plain(text.replace(/^\{\{[\s\S]*?\n\}\}\n/m, ""));
  const out = [];
  for (const sentence of prose.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
    if (!/\b(?:rink|ice surface|ice sheet|ice|court|floor|playing surface|hardwood)\b/i.test(sentence)) continue;
    // A size: two numbers joined by "by", "x" or a multiplication sign, with a foot or a metre somewhere in the sentence; or a length or a width in feet.
    if (!/\b\d{2,3}(?:\.\d+)?\s*(?:ft|feet|foot|m|metres|meters|')?\s*(?:by|×|x)\s*\d{2,3}(?:\.\d+)?\b/i.test(sentence) && !/\b\d{2,3}(?:\.\d+)?[\s-]*(?:ft|feet|foot)\b[^.]{0,30}\b(?:long|wide|length|width)\b/i.test(sentence)) continue;
    if (!/\b(?:ft|feet|foot|m|metres|meters)\b/i.test(sentence)) continue;
    out.push(sentence.length > 400 ? `${sentence.slice(0, 400)}…` : sentence);
  }
  return out;
}

const articles = {};
const titled = arenas.filter((a) => a.en?.title !== undefined);
for (let i = 0; i < titled.length; i += 10) {
  const batch = titled.slice(i, i + 10);
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids|content&rvslots=main&titles=${encodeURIComponent(batch.map((a) => a.en.title).join("|"))}&redirects=1&format=json&formatversion=2`;
  const answer = (await get(url)).query;
  const redirected = new Map([...(answer.normalized ?? []), ...(answer.redirects ?? [])].map((r) => [r.from, r.to]));
  const resolve = (title) => { let t = title; for (let n = 0; n < 4 && redirected.has(t); n += 1) t = redirected.get(t); return t; };
  for (const arena of batch) {
    const page = answer.pages.find((p) => p.title === resolve(arena.en.title));
    const revision = page?.revisions?.[0];
    if (revision === undefined) { console.log(`${arena.id}: no article ${arena.en.title}`); continue; }
    const content = revision.slots.main.content;
    const box = infoboxParameters(content);
    articles[arena.id] = {
      title: page.title,
      revision: revision.revid,
      infobox: Object.fromEntries(KEEP.filter((k) => box[k] !== undefined).map((k) => [k, plain(box[k])]).filter(([, v]) => v !== "")),
      sizes: sizeSentences(content),
    };
  }
}
console.log(`${Object.keys(articles).length} articles`);

const items = {};
for (const arena of arenas) {
  const e = entities[arena.wikidata];
  if (e === undefined || e.missing !== undefined) { console.log(`${arena.id} (${arena.wikidata}): not found`); continue; }
  const at = value(e.claims?.P625?.[0]);
  items[arena.id] = {
    wikidata: e.id,
    labels: Object.fromEntries(Object.entries(e.labels ?? {}).map(([lang, v]) => [lang, v.value])),
    aliases: Object.fromEntries(Object.entries(e.aliases ?? {}).map(([lang, list]) => [lang, list.map((v) => v.value)])),
    official: monolingual(e.claims?.P1448),
    names: (e.claims?.P2561 ?? []).map((c) => ({ ...(value(c) === undefined ? {} : { text: value(c).text, lang: value(c).language }), ...(qualifierYear(c, "P580") === undefined ? {} : { from: qualifierYear(c, "P580") }), ...(qualifierYear(c, "P582") === undefined ? {} : { to: qualifierYear(c, "P582") }) })),
    ...(at === undefined ? {} : { lat: at.latitude, lon: at.longitude }),
    years: { opened: yearsOf(e, "P1619"), inception: yearsOf(e, "P571"), closed: yearsOf(e, "P3999"), ended: yearsOf(e, "P576") },
    capacity: (e.claims?.P1083 ?? []).map((c) => ({ amount: Number(value(c)?.amount), ...(qualifierYear(c, "P585") === undefined ? {} : { year: qualifierYear(c, "P585") }), ...((c.qualifiers?.P641 ?? []).length === 0 ? {} : { sport: c.qualifiers.P641.map((q) => label(q.datavalue?.value?.id)).filter(Boolean) }), ...((c.qualifiers?.P518 ?? []).length === 0 ? {} : { applies: c.qualifiers.P518.map((q) => label(q.datavalue?.value?.id)).filter(Boolean) }) })).filter((c) => Number.isFinite(c.amount)),
    places: ids(e, "P131").map((id) => label(id)).filter(Boolean),
    country: ids(e, "P17").map((id) => iso(id)).filter(Boolean),
    ...(e.sitelinks?.enwiki === undefined ? {} : { enwiki: e.sitelinks.enwiki.title }),
    ...(e.sitelinks?.jawiki === undefined ? {} : { jawiki: e.sitelinks.jawiki.title }),
  };
}
const body = { read: new Date().toISOString().slice(0, 10), licence: "Wikidata CC0; the infoboxes and sentences of English Wikipedia CC BY-SA 4.0", items, articles };
writeFileSync(here("arenas.wikidata.json"), `${JSON.stringify(body, null, 1)}\n`);
console.log(`${Object.keys(items).length} items, ${Object.keys(articles).length} articles, ${Object.values(articles).filter((a) => a.sizes.length > 0).length} with a size`);
process.exit(0);
