// Writes scripts/tenants.wikidata.json: what Wikidata (CC0) and the English Wikipedia (CC BY-SA, the tenants line of each infobox, at the revision named) hold about the clubs
// that play, or played, in every ballpark and ground (`pnpm tenants:fetch`). It needs the network and is not part of `pnpm check`; run it when a place is added, then `pnpm tenants`.
//
// For each place: the clubs it lists as occupants (P466) and the clubs that list it as their home venue (P115), each with the years of its start (P580) and end (P582) qualifiers
// when Wikidata has them, and the text of the `tenants` parameter of its article's infobox. For each club: its labels in English and Japanese, its sport (P641), its instance
// (P31) and its leagues (P118) with their years. For each league and sport its labels. Nothing here is a tenant until scripts/build-tenants.mjs has held it to the rules of
// docs/atlas.md ("Tenants"). A request at a time, a pause between them, and a User-Agent that names the project and a way to reach its author, as Wikimedia asks.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const here = (name) => new URL(`./${name}`, import.meta.url);
const parks = JSON.parse(readFileSync(here("parks.data.json"), "utf8"));
const grounds = JSON.parse(readFileSync(here("grounds.data.json"), "utf8"));
const arenas = JSON.parse(readFileSync(here("arenas.data.json"), "utf8"));
// `--arenas` reads the arenas only and adds them to what the file already holds (the parks' and grounds' evidence stays as it was read).
const onlyArenas = process.argv.includes("--arenas");
const USER_AGENT = "kyogijo-tenants/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
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

const places = [...(onlyArenas ? [] : [...parks, ...grounds]), ...arenas].map((p) => ({ id: p.id, wikidata: p.wikidata, title: p.en?.title }));
const byItem = new Map(places.map((p) => [p.wikidata, p.id]));
const year = (value) => Number(/^[+-]?(\d+)-/.exec(value)?.[1]);
const qid = (uri) => uri.slice(uri.lastIndexOf("/") + 1);
const wikidata = async (ids, props, languages = "en|ja") => {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.slice(i, i + 50).join("|")}&props=${props}&languages=${languages}&format=json&formatversion=2&redirects=yes`;
    Object.assign(out, (await get(url)).entities);
  }
  return out;
};
const claimIds = (e, property) => (e.claims?.[property] ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
/** The years of a qualifier (a year or finer; a decade or a century is not a year). */
const qualifierYears = (c, key) => (c.qualifiers?.[key] ?? []).map((q) => q.datavalue?.value).filter((v) => v !== undefined && v.precision >= 9).map((v) => year(v.time)).sort((a, b) => a - b);
const period = (c) => ({ ...(qualifierYears(c, "P580").length === 0 ? {} : { starts: qualifierYears(c, "P580") }), ...(qualifierYears(c, "P582").length === 0 ? {} : { ends: qualifierYears(c, "P582") }) });

// The occupants each place lists (P466).
const statements = [];
const venueEntities = await wikidata(places.map((p) => p.wikidata), "claims");
for (const place of places) {
  const e = venueEntities[place.wikidata];
  for (const c of e?.claims?.P466 ?? []) {
    const club = c.mainsnak?.datavalue?.value?.id;
    if (club !== undefined) statements.push({ place: place.id, club, prop: "P466", ...period(c) });
  }
}
console.log(`${statements.length} occupant statements`);

// The clubs that list a place as their home venue (P115), found with one query for each 25 places; the statements are read from the clubs' own items.
const homeClubs = new Set();
for (let i = 0; i < places.length; i += 25) {
  const values = places.slice(i, i + 25).map((p) => `wd:${p.wikidata}`).join(" ");
  const sparql = `SELECT DISTINCT ?club WHERE { VALUES ?venue { ${values} } ?club wdt:P115 ?venue }`;
  const answer = await get(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`);
  for (const b of answer.results.bindings) homeClubs.add(qid(b.club.value));
}
console.log(`${homeClubs.size} clubs with a home venue here`);

const clubIds = [...new Set([...statements.map((r) => r.club), ...homeClubs])].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
const clubEntities = await wikidata(clubIds, "labels|claims|sitelinks");
const clubs = {};
for (const id of clubIds) {
  const e = clubEntities[id];
  if (e === undefined || e.missing !== undefined) continue;
  for (const c of e.claims?.P115 ?? []) {
    const venue = byItem.get(c.mainsnak?.datavalue?.value?.id);
    if (venue !== undefined) statements.push({ place: venue, club: e.id, prop: "P115", ...period(c) });
  }
  clubs[e.id] = {
    en: e.labels?.en?.value,
    ...(e.labels?.ja === undefined ? {} : { ja: e.labels.ja.value }),
    sport: claimIds(e, "P641"),
    instance: claimIds(e, "P31"),
    leagues: (e.claims?.P118 ?? []).map((c) => ({ league: c.mainsnak?.datavalue?.value?.id, ...(qualifierYears(c, "P580")[0] === undefined ? {} : { from: qualifierYears(c, "P580")[0] }), ...(qualifierYears(c, "P582")[0] === undefined ? {} : { to: qualifierYears(c, "P582")[0] }) })).filter((l) => l.league !== undefined),
    ...(e.sitelinks?.enwiki === undefined ? {} : { enwiki: e.sitelinks.enwiki.title }),
  };
}
const labelled = [...new Set(Object.values(clubs).flatMap((c) => [...c.sport, ...c.instance, ...c.leagues.map((l) => l.league)]))];
const labelEntities = await wikidata(labelled, "labels|claims");
const labels = {};
for (const id of labelled) {
  const e = labelEntities[id];
  if (e === undefined || e.missing !== undefined) continue;
  labels[id] = { en: e.labels?.en?.value, ...(e.labels?.ja === undefined ? {} : { ja: e.labels.ja.value }), ...(claimIds(e, "P641").length === 0 ? {} : { sport: claimIds(e, "P641") }) };
}
console.log(`${statements.length} statements, ${Object.keys(clubs).length} clubs, ${Object.keys(labels).length} labels`);

// The tenants line of each place's English article (the infobox parameter `tenants`), at the revision read.
/** The value of a parameter of the first infobox in wikitext, read by counting braces and brackets. */
function infoboxParameter(text, names) {
  const open = /\{\{\s*infobox[^|{}]*/i.exec(text);
  if (open === null) return undefined;
  let depth = 0;
  let i = open.index;
  let start = -1;
  let name = "";
  for (; i < text.length; i += 1) {
    const two = text.slice(i, i + 2);
    if (two === "{{" || two === "[[") { depth += 1; i += 1; continue; }
    if (two === "}}" || two === "]]") { depth -= 1; i += 1; if (depth === 0) break; continue; }
    if (text[i] === "|" && depth === 1) {
      if (start >= 0 && names.includes(name)) return text.slice(start, i).trim();
      const eq = text.indexOf("=", i);
      name = eq > 0 ? text.slice(i + 1, eq).trim().toLowerCase() : "";
      start = eq + 1;
    }
  }
  return start >= 0 && names.includes(name) ? text.slice(start, i).trim() : undefined;
}
const articles = {};
const titled = places.filter((p) => p.title !== undefined);
for (let i = 0; i < titled.length; i += 10) {
  const batch = titled.slice(i, i + 10);
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids|content&rvslots=main&titles=${encodeURIComponent(batch.map((p) => p.title).join("|"))}&redirects=1&format=json&formatversion=2`;
  const answer = (await get(url)).query;
  const redirected = new Map([...(answer.normalized ?? []), ...(answer.redirects ?? [])].map((r) => [r.from, r.to]));
  const resolve = (title) => { let t = title; for (let n = 0; n < 4 && redirected.has(t); n += 1) t = redirected.get(t); return t; };
  for (const place of batch) {
    const page = answer.pages.find((p) => p.title === resolve(place.title));
    const revision = page?.revisions?.[0];
    if (revision === undefined) { console.log(`${place.id}: no article ${place.title}`); continue; }
    const tenants = infoboxParameter(revision.slots.main.content, ["tenants", "tenant"]);
    articles[place.id] = { title: page.title, revision: revision.revid, ...(tenants === undefined ? {} : { tenants }) };
  }
}
console.log(`${Object.keys(articles).length} articles, ${Object.values(articles).filter((a) => a.tenants !== undefined).length} with a tenants line`);

// The clubs the tenants lines link to, joined to their Wikidata items by the title of their English article.
const known = new Map(Object.entries(clubs).filter(([, c]) => c.enwiki !== undefined).map(([id, c]) => [c.enwiki, id]));
const linked = new Set();
for (const a of Object.values(articles)) for (const m of (a.tenants ?? "").matchAll(/\[\[([^\]|#]+)/g)) if (!known.has(m[1].trim())) linked.add(m[1].trim());
const titles = [...linked];
// A link can be to a redirect (`Montreal Concordes`): the English Wikipedia says which article it leads to.
const finalTitle = new Map();
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50);
  const answer = (await get(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(batch.join("|"))}&redirects=1&format=json&formatversion=2`)).query;
  const step = new Map([...(answer.normalized ?? []), ...(answer.redirects ?? [])].map((r) => [r.from, r.to]));
  for (const title of batch) { let t = title; for (let n = 0; n < 4 && step.has(t); n += 1) t = step.get(t); finalTitle.set(title, t); }
}
const finals = [...new Set(finalTitle.values())];
const extra = {};
for (let i = 0; i < finals.length; i += 40) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${encodeURIComponent(finals.slice(i, i + 40).join("|"))}&props=labels|claims|sitelinks&languages=en|ja&format=json&formatversion=2&redirects=yes`;
  Object.assign(extra, (await get(url)).entities ?? {});
}
const links = Object.fromEntries([...known]);
const more = Object.values(extra).filter((e) => e.id !== undefined && e.missing === undefined);
for (const e of more) {
  if (clubs[e.id] === undefined) {
    clubs[e.id] = {
      en: e.labels?.en?.value,
      ...(e.labels?.ja === undefined ? {} : { ja: e.labels.ja.value }),
      sport: claimIds(e, "P641"),
      instance: claimIds(e, "P31"),
      leagues: (e.claims?.P118 ?? []).map((c) => ({ league: c.mainsnak?.datavalue?.value?.id, ...(qualifierYears(c, "P580")[0] === undefined ? {} : { from: qualifierYears(c, "P580")[0] }), ...(qualifierYears(c, "P582")[0] === undefined ? {} : { to: qualifierYears(c, "P582")[0] }) })).filter((l) => l.league !== undefined),
      ...(e.sitelinks?.enwiki === undefined ? {} : { enwiki: e.sitelinks.enwiki.title }),
    };
  }
  if (e.sitelinks?.enwiki !== undefined) links[e.sitelinks.enwiki.title] = e.id;
}
for (const [title, final] of finalTitle) if (links[final] !== undefined) links[title] = links[final];
const extraLabelled = [...new Set(Object.values(clubs).flatMap((c) => [...c.sport, ...c.instance, ...c.leagues.map((l) => l.league)]))].filter((id) => labels[id] === undefined);
const extraLabels = await wikidata(extraLabelled, "labels|claims");
for (const id of extraLabelled) {
  const e = extraLabels[id];
  if (e === undefined || e.missing !== undefined) continue;
  labels[id] = { en: e.labels?.en?.value, ...(e.labels?.ja === undefined ? {} : { ja: e.labels.ja.value }), ...(claimIds(e, "P641").length === 0 ? {} : { sport: claimIds(e, "P641") }) };
}
let body = { read: new Date().toISOString().slice(0, 10), licence: "Wikidata CC0; the tenants lines of English Wikipedia CC BY-SA 4.0", statements, clubs, labels, links, articles };
if (onlyArenas) {
  const have = JSON.parse(readFileSync(here("tenants.wikidata.json"), "utf8"));
  const mine = new Set(arenas.map((a) => a.id));
  body = {
    ...have,
    statements: [...have.statements.filter((s) => !mine.has(s.place)), ...statements],
    clubs: { ...have.clubs, ...clubs },
    labels: { ...have.labels, ...labels },
    links: { ...have.links, ...links },
    articles: { ...Object.fromEntries(Object.entries(have.articles).filter(([id]) => !mine.has(id))), ...articles },
  };
}
writeFileSync(here("tenants.wikidata.json"), `${JSON.stringify(body, null, 1)}\n`);
console.log(`${statements.length} statements, ${Object.keys(clubs).length} clubs, ${Object.keys(labels).length} labels, ${Object.keys(links).length} linked titles`);
process.exit(0);
