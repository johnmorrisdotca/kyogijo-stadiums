// Writes src/tenants.data.ts from scripts/tenants.wikidata.json (the evidence `pnpm tenants:fetch` read) and scripts/tenants.curated.json (the leagues, and the
// few decisions a person made). `--report` lists what was left out and why, `--list` every tenant.
//
// A tenant is a club that plays, or played, its home matches in a place, in a league of the table in scripts/tenants.curated.json. The club comes from Wikidata (CC0: the place's
// occupants, P466, and the clubs' home venues, P115) and from the `tenants` line of the infobox of the place's English Wikipedia article (CC BY-SA 4.0) at the revision named. The
// years are Wikidata's (the qualifiers start time P580 and end time P582 of the statements) where Wikidata has them and the article gives none or the same; where the two differ the
// article's, because a reader can check it at the revision named; and where only the article has them, the article's. A year is never guessed: a tenant neither gives years for has
// none. A club that plays only some of its games there (the article says select, part-time or intermittent), a national team, a college team, a bowl game and an event are not
// tenants. See docs/atlas.md ("Tenants").
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { readEntry, tenantEntries } from "./tenants-lib.mjs";

const here = (name) => new URL(`./${name}`, import.meta.url);
const read = (name) => JSON.parse(readFileSync(here(name), "utf8"));
const evidence = read("tenants.wikidata.json");
const curated = read("tenants.curated.json");
// The everyday Japanese form of a club's name where Wikidata's label is not it, by the club's Wikidata item, with a source note for each (scripts/tenants.names-ja.json).
const namesJa = read("tenants.names-ja.json").names;
const parks = read("parks.data.json");
const grounds = read("grounds.data.json");
const places = [...parks, ...grounds];
const argv = new Set(process.argv.slice(2));
const fail = (message) => {
  throw new Error(message);
};

const plain = (text) => text.normalize("NFKC").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]/gu, "");
const SPORTS = ["baseball", "soccer", "american-football", "canadian-football", "basketball", "ice-hockey", "rugby-union", "rugby-league", "australian-football", "lacrosse", "cricket"];

// ----- The leagues: by the title of their English article, their short forms (where two leagues share one it names neither) and their Wikidata items or labels.
const byTitle = new Map();
const byItem = new Map();
const byLabel = new Map();
const byAbbr = new Map();
for (const [code, league] of Object.entries(curated.leagues)) {
  if (league.drop === undefined && !SPORTS.includes(league.sport)) fail(`${code}: sport ${league.sport}`);
  for (const title of league.titles ?? []) byTitle.set(plain(title), code);
  for (const item of league.items ?? []) byItem.set(item, code);
  for (const label of league.labels ?? []) byLabel.set(plain(label), code);
  for (const abbr of league.abbr ?? []) byAbbr.set(plain(abbr), byAbbr.has(plain(abbr)) && byAbbr.get(plain(abbr)) !== code ? null : code);
}
const leagueOfText = (text) => {
  if (text === undefined) return undefined;
  const title = byTitle.get(plain(text));
  if (title !== undefined) return title;
  return text.split(/\s*[/,]\s*/).map((part) => byAbbr.get(plain(part)) ?? byTitle.get(plain(part))).filter(Boolean).pop();
};
const labelOf = (id) => evidence.labels[id]?.en;
/** A club's name in Japanese: the curated everyday form where there is one (Wikidata's label kept as an alias), else Wikidata's label. */
const japanese = (id, label) => {
  const row = namesJa[id];
  if (row === undefined) return label === undefined ? {} : { clubJa: label };
  const aliases = [...(label === undefined || label === row.ja ? [] : [label]), ...(row.aliases ?? [])];
  return { clubJa: row.ja, ...(aliases.length === 0 ? {} : { aliasesJa: aliases }) };
};
const leagueOfItem = (id) => byItem.get(id) ?? byLabel.get(plain(labelOf(id) ?? ""));

// ----- Years.
/** Wikidata's years for a statement: the starts and the ends paired in order, a last start without an end being open. */
function pairs(statement) {
  const starts = statement.starts ?? [];
  const ends = statement.ends ?? [];
  if (starts.length === 0 && ends.length === 0) return [];
  if (starts.length === ends.length || starts.length === ends.length + 1) return starts.map((from, i) => [from, ends[i]]);
  if (starts.length === 0) return [[undefined, ends[ends.length - 1]]];
  return undefined;
}
/** From the first year to the last of a list of stretches, with no end if one of them is open. */
function span(list) {
  if (list.length === 0) return undefined;
  const froms = list.map(([f]) => f).filter((f) => f !== undefined);
  const tos = list.map(([, t]) => t).filter((t) => t !== undefined);
  const open = list.some(([, t]) => t === undefined);
  return { ...(froms.length === 0 ? {} : { from: Math.min(...froms) }), ...(open || tos.length === 0 ? {} : { to: Math.max(...tos) }) };
}

const report = { conflicts: [], dropped: [], left: new Map(), noLeague: [], dated: 0 };
const rules = curated.tenants ?? [];
const lastWord = (text) => plain(text.replace(/\s*\([^)]*\)\s*$/, "").split(/\s+/).pop() ?? "");
/** The name an infobox gives a club: the title of its article without the disambiguation, or the words it shows when that is a history page. */
const infoboxName = (entry) => {
  const target = entry.club ?? entry.clubText;
  if (/^(history|list|timeline|seasons?) of /i.test(target)) return entry.clubText;
  return target.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

const result = {};
const articles = {};
for (const place of places) {
  const article = evidence.articles[place.id];
  const candidates = new Map();
  const slot = (id) => {
    if (!candidates.has(id)) candidates.set(id, { id, statements: [], entries: [] });
    return candidates.get(id);
  };
  for (const statement of evidence.statements.filter((s) => s.place === place.id)) slot(statement.club).statements.push(statement);
  const lines = article?.tenants === undefined ? [] : tenantEntries(article.tenants).map(readEntry).filter(Boolean);
  const known = new Map([...candidates.values()].map((c) => [plain(evidence.clubs[c.id]?.en ?? ""), c.id]));
  for (const entry of lines) {
    // An entry the article links is joined to its Wikidata item by the title of the article; one it does not link, by the name.
    const id = (entry.linked ? evidence.links[entry.club] : undefined) ?? known.get(plain(entry.clubText));
    if (id === undefined) continue;
    slot(id).entries.push(entry);
  }
  const hasLine = lines.length > 0;

  const out = [];
  for (const candidate of candidates.values()) {
    const club = evidence.clubs[candidate.id];
    if (club === undefined) continue;
    const wdName = club.en;
    const entry = candidate.entries[0];
    const shown = entry !== undefined ? infoboxName(entry) : wdName;
    if (shown === undefined || shown === "") continue;
    const rule = rules.find((r) => r.place === place.id && (r.club === candidate.id || r.club === shown));
    const name = rule?.name ?? shown;
    if (rule?.drop !== undefined) { report.dropped.push(`${place.id}: ${name} (${rule.drop})`); continue; }
    // Only a club or a team plays home matches: not a season, an event, a national team, a college team.
    const kinds = club.instance.map((id) => labelOf(id) ?? "");
    if (kinds.some((k) => /season|edition|final|match|event|tournament|championship|national|college|university|federation|museum|business|company|organi[sz]ation|article/i.test(k)) && !kinds.some((k) => /\b(club|franchise)\b|professional/i.test(k))) continue;
    // A club the article says plays only some of its games there is not a tenant.
    if (candidate.entries.length > 0 && candidate.entries.every((e) => e.note === "partial")) continue;

    // The years.
    const wd = [];
    let wdBad = false;
    for (const statement of candidate.statements) {
      const p = pairs(statement);
      if (p === undefined) wdBad = true;
      else wd.push(...p);
    }
    const wdYears = span(wd);
    const wpList = candidate.entries.flatMap((e) => e.years);
    const wpYears = span(wpList);
    let years = wdYears?.from !== undefined || wdYears?.to !== undefined ? wdYears : wpYears;
    let yearsFrom = years === undefined ? undefined : years === wdYears ? "wikidata" : "wikipedia";
    if (wdBad && wpYears !== undefined) { years = wpYears; yearsFrom = "wikipedia"; }
    if (wdYears !== undefined && wpYears !== undefined && (wdYears.from !== wpYears.from || wdYears.to !== wpYears.to)) {
      report.conflicts.push(`${place.id}: ${name}: wikidata ${wdYears.from ?? ""}–${wdYears.to ?? ""}, wikipedia ${wpYears.from ?? ""}–${wpYears.to ?? ""}`);
      years = wpYears;
      yearsFrom = "wikipedia";
    }
    if (rule?.years !== undefined) { years = rule.years; yearsFrom = "wikipedia"; }
    // A club only Wikidata names, for no years, is not enough to go on when the article lists tenants without it.
    if (candidate.entries.length === 0 && (years === undefined || (years.from === undefined && years.to === undefined))) continue;
    const when = years ?? {};
    if (when.from !== undefined && when.to !== undefined && when.from > when.to) { report.conflicts.push(`${place.id}: ${name}: ${when.from}–${when.to} is backwards`); continue; }

    // The league. The article's, where it names one (the last of two: `AFL/NFL` is the NFL), else Wikidata's that was the club's during the years.
    let code;
    for (const e of candidate.entries) {
      const found = (e.leagues.length > 0 ? e.leagues : [e.leagueText]).map(leagueOfText).filter(Boolean);
      if (found.length > 0) { code = found[found.length - 1]; break; }
    }
    if (rule?.league !== undefined) code = rule.league;
    if (code === undefined) {
      const periods = club.leagues.map((l) => ({ code: leagueOfItem(l.league), from: l.from, to: l.to })).filter((l) => l.code !== undefined);
      const during = periods.filter((l) => (l.from === undefined || l.from <= (when.to ?? 9999)) && (l.to === undefined || l.to >= (when.from ?? 0)));
      during.sort((a, b) => (b.to === undefined) - (a.to === undefined) || (b.from ?? 0) - (a.from ?? 0));
      // A club that has no league for the years (before the leagues began) is given the one it plays in today.
      code = (during.length > 0 ? during : periods.sort((a, b) => (b.to === undefined) - (a.to === undefined) || (b.from ?? 0) - (a.from ?? 0)))[0]?.code;
    }
    if (code === undefined) {
      const texts = [...candidate.entries.flatMap((e) => [e.league, e.leagueText]), ...club.leagues.map((l) => labelOf(l.league) ?? l.league)].filter(Boolean);
      for (const t of texts) report.left.set(t, [...(report.left.get(t) ?? []), `${place.id}: ${name}`]);
      if (texts.length === 0) report.noLeague.push(`${place.id}: ${name}`);
      continue;
    }
    const league = curated.leagues[code];
    if (league.drop !== undefined) continue;
    const wikidataProps = [...new Set(candidate.statements.map((t) => t.prop))];
    out.push({
      club: name,
      ...japanese(candidate.id, club.ja === undefined || plain(name) !== plain(wdName ?? "") ? undefined : club.ja),
      league: code,
      sport: league.sport,
      ...(when.from === undefined ? {} : { from: when.from }),
      ...(when.to === undefined ? {} : { to: when.to }),
      wikidata: candidate.id,
      ...(wikidataProps.length === 0 ? {} : { statements: wikidataProps.join(" ") }),
      ...(candidate.entries.length === 0 || article === undefined ? {} : { listed: true }),
      ...(yearsFrom === undefined ? {} : { years: yearsFrom }),
    });
  }

  // The same franchise under two names: a club only Wikidata names (under its name today) is left out when the article names it under the name of the time (`Boston Braves` for
  // `Atlanta Braves`), which is the same last word, the same league and the same years.
  const kept = out.filter((t) => !(t.listed === undefined && out.some((o) => o !== t && o.listed !== undefined && o.league === t.league && lastWord(o.club) === lastWord(t.club) && o.from === t.from)));
  const seen = new Set();
  const unique = kept.filter((t) => {
    const key = [plain(t.club), t.league, t.from, t.to].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  void hasLine;
  if (unique.length > 0) {
    // The current tenants first, by the year they came; then those that have left, the latest to leave first.
    unique.sort((a, b) => (a.to === undefined ? 0 : 1) - (b.to === undefined ? 0 : 1) || (a.to === undefined ? (a.from ?? 9999) - (b.from ?? 9999) : (b.to ?? 0) - (a.to ?? 0)) || a.club.localeCompare(b.club));
    result[place.id] = unique;
    if (unique.some((t) => t.listed) && article !== undefined) articles[place.id] = { title: article.title, revision: article.revision };
  }
}

// Every curated name belongs to a club that is a tenant: a row for a club that is not is a mistake (or a club left out), and is said.
const used = new Set(Object.values(result).flatMap((list) => list.map((t) => t.wikidata)));
for (const id of Object.keys(namesJa)) if (!used.has(id)) fail(`scripts/tenants.names-ja.json: ${id} (${namesJa[id].club}) is not a tenant`);

// ----- The data file.
const KEYS = ["club", "clubJa", "aliasesJa", "league", "sport", "from", "to", "wikidata", "statements", "listed", "years"];
const line = (value) => JSON.stringify(value).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/\},\{/g, "}, {");
const tenant = (t) => {
  for (const key of Object.keys(t)) if (!KEYS.includes(key)) fail(`unknown field ${key}`);
  return `    { ${KEYS.filter((k) => t[k] !== undefined).map((k) => `"${k}": ${line(t[k])}`).join(", ")} }`;
};
const text = `// Made by scripts/build-tenants.mjs from scripts/tenants.wikidata.json and scripts/tenants.curated.json: do not edit by hand.
// The clubs are Wikidata's (CC0) and the tenants lines of the English Wikipedia articles cited (CC BY-SA 4.0); see docs/atlas.md ("Tenants") and docs/references.md.
import type { TenantArticle, TenantData, TenantNameJa } from "./tenants.ts";

/** The article of English Wikipedia, at the revision read, that the tenants of a place are listed in. */
export const TENANT_ARTICLES: Readonly<Record<string, TenantArticle>> = {
${Object.entries(articles).map(([id, a]) => `  "${id}": ${line(a)}`).join(",\n")},
};

/** The leagues whose field or court is not the one the package draws for their sport (arena football, a basketball league that played on another court): their clubs ask for no surface. */
export const TENANT_NO_SURFACE: readonly string[] = ${line(Object.entries(curated.leagues).filter(([, l]) => l.surface === false).map(([code]) => code))};

/** The clubs whose name in Japanese is not Wikidata's label, by the club's Wikidata item: the everyday form, why Wikidata's label is not it, and the source of each. See scripts/tenants.names-ja.json. */
export const TENANT_NAMES_JA: Readonly<Record<string, TenantNameJa>> = {
${Object.entries(namesJa).map(([id, r]) => `  "${id}": ${line({ ja: r.ja, kind: r.kind, note: r.note })}`).join(",\n")},
};

export const TENANT_DATA: Readonly<Record<string, TenantData[]>> = {
${Object.entries(result).map(([id, list]) => `  "${id}": [\n${list.map(tenant).join(",\n")},\n  ]`).join(",\n")},
};
`;
const total = Object.values(result).reduce((n, list) => n + list.length, 0);
if (!argv.has("--no-write")) writeFileSync(here("../src/tenants.data.ts"), text);

if (argv.has("--report")) {
  console.log("LEFT OUT FOR WANT OF A LEAGUE THE TABLE KNOWS");
  for (const [league, who] of [...report.left].sort((a, b) => b[1].length - a[1].length)) console.log(`${who.length}\t${league}\t${who.slice(0, 3).join("; ")}`);
  console.log("NO LEAGUE AT ALL", report.noLeague);
  console.log("YEARS THE TWO DISAGREE ON", report.conflicts.length);
  for (const l of report.conflicts) console.log(`  ${l}`);
  console.log("DROPPED BY A RULE", report.dropped);
  console.log(`${Object.keys(result).length} places, ${total} tenants`);
}
if (argv.has("--list")) for (const [id, list] of Object.entries(result)) {
  console.log(id);
  for (const t of list) console.log(`   ${t.club} [${t.league}] ${t.from ?? ""}–${t.to ?? ""} ${t.years ?? "-"}/${t.statements ?? "-"}${t.listed ? "/wp" : ""}`);
}
process.exit(0);
