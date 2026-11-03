// Fetches what the catalogue is checked against and keeps it, dated, under data-sources/catalogue/<date>/ (`pnpm catalogue:fetch [date]`). It needs the network and the built package (`pnpm build`), and
// is not part of `pnpm check`; run it when a venue is added to scripts/catalogue.data.json, then `pnpm catalogue`. One request at a time, three seconds apart, with a User-Agent that names the package and a
// way to reach its author, as the services ask. A file that is already there is not fetched again.
//
//   wikipedia-titles.json   English Wikipedia (the API's answers, no article text): each title of scripts/catalogue.data.json (venues, teams and the season and list articles), the redirect it follows
//                           and the Wikidata item its page names (pageprops), in batches of 50.
//   wikidata-search.json    Wikidata (CC0): the answers of wbsearchentities for a venue named by its English label (`search`), where it has no English article of its own; the item whose label is exactly that.
//   wikipedia-lists.json    English Wikipedia (CC BY-SA 4.0), evidence only: for each season or list article the catalogue leans on, its revision, the heading of the section read and the titles linked
//                           from the rows of that section's first table, row by row. No text of an article is kept.
//   wikidata.json           Wikidata (CC0): each item's English, Japanese and default (`mul`) labels, its English and Japanese Wikipedia sitelinks, and its claims for the properties the catalogue reads (P17 country, P31
//                           instance of, P131 located in, P625 coordinates, P1083 capacity, P115 home venue, P118 league), as the API returned them, in batches of 50. The items are the new venues, their
//                           teams and every venue the package draws today.
//   wikidata-places.json    Wikidata (CC0): the countries (P297, the ISO code) and the places the venues are located in (P131), two steps up, with their labels.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const data = JSON.parse(readFileSync(new URL("./catalogue.data.json", import.meta.url), "utf8"));
const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const out = new URL(`../data-sources/catalogue/${day}/`, import.meta.url);
mkdirSync(out, { recursive: true });
const USER_AGENT = "kyogijo-stadiums-catalogue/0.50 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CLAIMS = ["P17", "P31", "P131", "P625", "P1083", "P115", "P118", "P297"];

let first = true;
const getJson = async (url) => {
  if (!first) await pause(3000);
  first = false;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`${response.status} for ${url.slice(0, 160)}`);
    await pause(15000 * (attempt + 1));
  }
  throw new Error(`gave up on ${url.slice(0, 160)}`);
};
const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));
const write = (name, value) => writeFileSync(new URL(name, out), `${JSON.stringify(value, null, 1)}\n`);
const read = (name) => (existsSync(new URL(name, out)) ? JSON.parse(readFileSync(new URL(name, out), "utf8")) : undefined);

// ---- English Wikipedia: titles to items. ----
const teamTitles = data.venues.flatMap((venue) => venue.teams ?? []);
const listTitles = [...data.leagues.flatMap((league) => (league.check === undefined ? [] : [league.check])), ...data.seasons.map((season) => season.article)];
const titles = [...new Set([...data.venues.flatMap((venue) => (venue.enwiki === undefined ? [] : [venue.enwiki])), ...teamTitles, ...listTitles])];
let titleFile = read("wikipedia-titles.json");
if (titleFile === undefined || titles.some((title) => !titleFile.asked.includes(title))) {
  const answers = [];
  for (const batch of chunks(titles, 50)) {
    answers.push(await getJson(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(batch.join("|"))}`));
  }
  titleFile = { read: day, source: "en.wikipedia.org API (action=query, prop=pageprops)", asked: titles, answers };
  write("wikipedia-titles.json", titleFile);
  console.log(`wikipedia-titles.json: ${titles.length} titles`);
}
/** Where a title lands (normalised, redirects followed) and the item of its page. */
const landing = new Map();
for (const answer of titleFile.answers) {
  const query = answer.query ?? {};
  const step = new Map([...(query.normalized ?? []), ...(query.redirects ?? [])].map((one) => [one.from, one.to]));
  const pages = new Map((query.pages ?? []).map((page) => [page.title, page]));
  for (const title of titleFile.asked) {
    let at = title;
    for (let i = 0; i < 4 && step.has(at); i += 1) at = step.get(at);
    const page = pages.get(at);
    if (page !== undefined && page.missing !== true) landing.set(title, { title: at, wikidata: page.pageprops?.wikibase_item });
  }
}

// ---- Wikidata: a venue with no English article of its own (a court the article of its grounds covers) is found by its English label, exactly (wbsearchentities). ----
let searches = read("wikidata-search.json") ?? { read: day, source: "Wikidata API (wbsearchentities), CC0", answers: {} };
for (const label of data.venues.flatMap((venue) => (venue.search === undefined ? [] : [venue.search]))) {
  if (searches.answers[label] !== undefined) continue;
  searches = { ...searches, answers: { ...searches.answers, [label]: await getJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(label)}&language=en&type=item&limit=5&format=json`) } };
  write("wikidata-search.json", searches);
  console.log(`wikidata-search.json: ${label}`);
}
const found = (label) => searches.answers[label]?.search?.find((hit) => hit.label === label)?.id;

// ---- English Wikipedia: the season and list articles, the links of one table. ----
const LINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
const titleOf = (link) => link.trim().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
/** Wikitext without `<ref>`s and `{{efn}}` notes (their braces counted, as notes hold templates). */
const withoutNotes = (text) => {
  let out = text.replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  for (let at = out.search(/\{\{\s*efn/i); at >= 0; at = out.search(/\{\{\s*efn/i)) {
    let depth = 0;
    let i = at;
    for (; i < out.length - 1; i += 1) {
      if (out.startsWith("{{", i)) { depth += 1; i += 1; } else if (out.startsWith("}}", i)) { depth -= 1; i += 1; if (depth === 0) break; }
    }
    out = out.slice(0, at) + out.slice(i + 1);
  }
  return out;
};
const SECTION = { "List of current National Football League stadiums": /^Current$/i, "List of Canadian Football League stadiums": /^Current stadiums$/i, "2026 Formula One World Championship": /^Calendar$/i, "2026 MotoGP World Championship": /^(Calendar|Race calendar)$/i };
let lists = read("wikipedia-lists.json");
if (lists === undefined) {
  lists = { read: day, source: "en.wikipedia.org API (action=parse); CC BY-SA 4.0; only the titles linked from the rows of one table are kept, as evidence", articles: {} };
  for (const title of listTitles) {
    const sections = await getJson(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=sections|revid&redirects=1&format=json&formatversion=2`);
    const section = sections.parse.sections.find((one) => SECTION[title].test(one.line.replace(/<[^>]+>/g, "").trim()));
    if (section === undefined) {
      lists.articles[title] = { revision: sections.parse.revid, error: `no section matching ${SECTION[title]}`, sections: sections.parse.sections.map((one) => one.line) };
      continue;
    }
    const text = await getJson(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext|revid&section=${section.index}&redirects=1&format=json&formatversion=2`);
    const wikitext = text.parse.wikitext;
    const start = wikitext.indexOf("{|");
    let depth = 0;
    let end = -1;
    for (let i = start; i >= 0 && i < wikitext.length - 1; i += 1) {
      if (wikitext.startsWith("{|", i)) depth += 1;
      else if (wikitext.startsWith("|}", i)) {
        depth -= 1;
        if (depth === 0) { end = i; break; }
      }
    }
    // The table, without its notes and references: a note may name a place the row does not (a race moved elsewhere).
    const table = withoutNotes(start < 0 ? "" : wikitext.slice(start, end < 0 ? undefined : end));
    const linked = [...new Set([...table.matchAll(LINK)].map((match) => titleOf(match[1])))];
    // A season's calendar: the circuit of each row is the first link after the row's flag.
    const rows = [...table.matchAll(/\{\{flagicon\|[^}]*\}\}\s*\[\[([^\]|#]+)/g)].map((match) => titleOf(match[1]));
    // Each row's links, in order: the venue, its teams and the place it is in are links of one row.
    const byRow = table.split(/\n\|-[^\n]*/).slice(1).map((row) => [...row.matchAll(LINK)].map((match) => titleOf(match[1]))).filter((row) => row.length > 0);
    lists.articles[title] = { revision: text.parse.revid, section: section.line, linked, rows: byRow, ...(title.includes("Championship") ? { circuits: [...new Set(rows)] } : {}) };
  }
  write("wikipedia-lists.json", lists);
  console.log(`wikipedia-lists.json: ${listTitles.length} articles`);
  // The links' own redirects: a row may link a former name.
}
{
  const linkedTitles = [...new Set(Object.values(lists.articles).flatMap((article) => article.linked ?? []))];
  if (lists.redirects === undefined) {
    lists.redirects = [];
    for (const batch of chunks(linkedTitles, 50)) {
      const answer = await getJson(`https://en.wikipedia.org/w/api.php?action=query&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(batch.join("|"))}`);
      lists.redirects.push(...(answer.query?.normalized ?? []), ...(answer.query?.redirects ?? []));
    }
    write("wikipedia-lists.json", lists);
    console.log(`wikipedia-lists.json: the redirects of ${linkedTitles.length} linked titles`);
  }
}

// ---- Wikidata: the items. ----
const dist = (name) => new URL(`../dist/${name}`, import.meta.url).href;
const { PLACES } = await import(dist("atlas-entry.js"));
const { STADIUMS } = await import(dist("stadiums-entry.js"));
const { VENUES } = await import(dist("venues-entry.js"));
const packageItems = [...PLACES.map((place) => place.wikidata), ...Object.values(STADIUMS).map((stadium) => stadium.wikidata), ...Object.values(VENUES).map((venue) => venue.wikidata)];
const wanted = [...new Set([...titles.map((title) => landing.get(title)?.wikidata).filter(Boolean), ...data.venues.map((venue) => found(venue.search)).filter(Boolean), ...packageItems])];
// The claims the catalogue reads, each as returned less its references (which can be many times its size).
const trim = (entity, kept = CLAIMS) => ({ ...entity, claims: Object.fromEntries(Object.entries(entity.claims ?? {}).filter(([property]) => kept.includes(property)).map(([property, claims]) => [property, claims.map((claim) => Object.fromEntries(Object.entries(claim).filter(([key]) => key !== "references")))])) });
const fetchEntities = async (ids, props = "labels|claims|sitelinks", kept = CLAIMS) => {
  const entities = {};
  for (const batch of chunks(ids, 50)) {
    const answer = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join("|")}&props=${props}&languages=mul|en|ja&sitefilter=enwiki|jawiki&format=json&formatversion=2`);
    for (const [id, entity] of Object.entries(answer.entities)) entities[id] = trim(entity, kept);
  }
  return entities;
};
let items = read("wikidata.json");
const missingItems = wanted.filter((id) => items?.entities[id] === undefined);
if (missingItems.length > 0) {
  items = { read: day, source: "Wikidata API (wbgetentities), CC0; claims kept for P17, P31, P131, P625, P1083, P115, P118 only, each as returned less its references", entities: { ...(items?.entities ?? {}), ...(await fetchEntities(missingItems)) } };
  write("wikidata.json", items);
  console.log(`wikidata.json: ${missingItems.length} items`);
}

// ---- Wikidata: the countries and the places, two steps up. ----
const targets = (entity, property) => (entity.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
let places = read("wikidata-places.json") ?? { read: day, source: "Wikidata API (wbgetentities), CC0; claims kept for P17, P131, P297 only, each as returned less its references", entities: {} };
let step = [...new Set(Object.values(items.entities).flatMap((entity) => [...targets(entity, "P17"), ...targets(entity, "P131")]))];
for (let level = 0; level < 3; level += 1) {
  const missing = step.filter((id) => places.entities[id] === undefined);
  if (missing.length > 0) {
    places = { ...places, entities: { ...places.entities, ...(await fetchEntities(missing, "labels|claims", ["P17", "P131", "P297"])) } };
    write("wikidata-places.json", places);
    console.log(`wikidata-places.json: ${missing.length} places (step ${level + 1})`);
  }
  step = [...new Set(step.flatMap((id) => (places.entities[id] === undefined ? [] : [...targets(places.entities[id], "P131"), ...targets(places.entities[id], "P17")])))];
}
console.log(`done: data-sources/catalogue/${day}/`);
