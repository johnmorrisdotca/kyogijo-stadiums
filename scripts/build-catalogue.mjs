// Writes the catalogue (`pnpm catalogue`, after `pnpm build`): src/catalogue.data.ts, catalogue.json and the tables of docs/catalogue.md and docs/catalogue.ja.md, from three things and nothing else:
//
//   - the package's own data, for every venue it draws today (the atlas's PLACES, the real stadiums and the real NHL venues, read from the built package): never typed again here;
//   - scripts/catalogue.data.json, for the venues it does not draw yet: a title of the English Wikipedia (or an exact English label of Wikidata), a city, the sports, the teams of a league;
//   - the raw answers of Wikidata and Wikipedia kept by `pnpm catalogue:fetch` in data-sources/catalogue/<date>/, from which every other fact is read: the item, the names in English and Japanese, the
//     country, the coordinates, the capacity, the city checked against the places the item is located in, a team's home venue, and the season and list articles a league's or a calendar's venue is in.
//
// A fact the answers do not give is left out, and the entry says why (`missing`). The build fails on a venue the answers do not name, a duplicate id or item, and a venue of a league or a calendar the
// articles do not list; it prints every other gap. Run it again after `pnpm catalogue:fetch` and after a version bump (the JSON names the package's version).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { catalogueTables, replaceBlocks } from "./catalogue-docs.mjs";

const here = (name) => new URL(name, import.meta.url);
const data = JSON.parse(readFileSync(here("./catalogue.data.json"), "utf8"));
const pkg = JSON.parse(readFileSync(here("../package.json"), "utf8"));
const day = readdirSync(here("../data-sources/catalogue/")).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().at(-1);
const raw = (name) => JSON.parse(readFileSync(here(`../data-sources/catalogue/${day}/${name}`), "utf8"));
const titles = raw("wikipedia-titles.json");
const lists = raw("wikipedia-lists.json");
const searches = raw("wikidata-search.json");
const items = raw("wikidata.json").entities;
const places = raw("wikidata-places.json").entities;
const entity = (id) => items[id] ?? places[id];

const fail = (message) => {
  console.error(`catalogue: ${message}`);
  process.exit(1);
};
const gaps = [];
const gap = (id, field, why) => gaps.push(`${id}: ${field}: ${why}`);

// ---- What the raw answers say. ----
const landing = new Map();
for (const answer of titles.answers) {
  const query = answer.query ?? {};
  const step = new Map([...(query.normalized ?? []), ...(query.redirects ?? [])].map((one) => [one.from, one.to]));
  const pages = new Map((query.pages ?? []).map((page) => [page.title, page]));
  for (const title of titles.asked) {
    let at = title;
    for (let i = 0; i < 4 && step.has(at); i += 1) at = step.get(at);
    const page = pages.get(at);
    if (page !== undefined && page.missing !== true && page.pageprops?.wikibase_item !== undefined) landing.set(title, { title: at, wikidata: page.pageprops.wikibase_item });
  }
}
const listRedirect = new Map((lists.redirects ?? []).map((one) => [one.from, one.to]));
const followed = (title) => {
  let at = title;
  for (let i = 0; i < 4 && listRedirect.has(at); i += 1) at = listRedirect.get(at);
  return at;
};
/** Whether an article's table links a page (under its own title or a title that redirects to it). */
const listed = (article, title, key = "linked") => (lists.articles[article]?.[key] ?? []).some((linked) => linked === title || followed(linked) === title);

/** The statements of a property that count: the preferred ones if any, else the normal ones. */
const best = (one, property) => {
  const claims = (one?.claims?.[property] ?? []).filter((claim) => claim.rank !== "deprecated" && claim.mainsnak?.snaktype === "value");
  const preferred = claims.filter((claim) => claim.rank === "preferred");
  return preferred.length > 0 ? preferred : claims;
};
const ids = (one, property) => best(one, property).map((claim) => claim.mainsnak.datavalue.value.id);
/** A label; in English, the item's default label (`mul`) where it has no English one of its own. */
const label = (one, language) => one?.labels?.[language]?.value ?? (language === "en" ? one?.labels?.mul?.value : undefined);
const round5 = (value) => Math.round(value * 1e5) / 1e5;
/** The ISO code of a country item, or of the country it is in (the Netherlands is a country of the Kingdom of the Netherlands, which holds the code). */
const isoOf = (id, depth = 0) => best(entity(id), "P297")[0]?.mainsnak.datavalue.value ?? (depth < 1 ? ids(entity(id), "P17").filter((up) => up !== id).map((up) => isoOf(up, depth + 1)).find(Boolean) : undefined);
const countryOf = (one) => {
  const codes = [...new Set(ids(one, "P17").map((id) => isoOf(id)).filter(Boolean))];
  return codes.length === 1 ? codes[0] : undefined;
};
const coordinatesOf = (one) => {
  const value = best(one, "P625")[0]?.mainsnak.datavalue.value;
  return value === undefined ? undefined : { lat: round5(value.latitude), lon: round5(value.longitude) };
};
const capacityOf = (one) => {
  const values = [...new Set(best(one, "P1083").map((claim) => Number(claim.mainsnak.datavalue.value.amount)))];
  return values.length === 1 && Number.isInteger(values[0]) && values[0] > 0 ? values[0] : undefined;
};
/** A name in Japanese, from Wikidata: its Japanese label, else the title of its Japanese article without a qualifier in brackets. */
const japaneseOf = (one) => {
  const ja = label(one, "ja");
  if (ja !== undefined && /[぀-ヿ㐀-鿿]/.test(ja)) return { nameJa: ja, from: "wikidata" };
  const link = one?.sitelinks?.jawiki?.title;
  if (link !== undefined) return { nameJa: link.replace(/\s*[（(][^）)]*[）)]$/, ""), from: "jawiki" };
  return undefined;
};
const plain = (text) => text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^(city|town|municipality|borough|village|county) of /, "").replace(/[^a-z0-9]+/g, " ").trim();
/** The city a venue is in, as Wikidata's places say: the place `city` names, found among the places the item is located in (P131, three steps up), with its Japanese label. */
const cityOf = (one, city) => {
  const wanted = plain(city);
  let step = ids(one, "P131");
  const seen = new Set();
  for (let level = 0; level < 4 && step.length > 0; level += 1) {
    for (const id of step) {
      const place = entity(id);
      const en = label(place, "en");
      if (en !== undefined && (plain(en) === wanted || plain(en).replace(/ city$/, "") === wanted)) return { city, cityJa: label(place, "ja"), wikidata: id };
    }
    for (const id of step) seen.add(id);
    step = [...new Set(step.flatMap((id) => ids(entity(id), "P131")))].filter((id) => !seen.has(id));
  }
  return undefined;
};
/** The city of a venue of a league's list or a season's calendar, from the article's own row: the row that links the venue also links the place it is in (`Paradise, Nevada`, `Madrid`). */
const cityInRow = (articles, title, city) => {
  const wanted = plain(city);
  for (const article of articles) {
    for (const row of lists.articles[article]?.rows ?? []) {
      if (!row.some((linked) => linked === title || followed(linked) === title)) continue;
      const hit = row.find((linked) => plain(linked.split(",")[0].replace(/\s*\([^)]*\)$/, "")) === wanted);
      if (hit !== undefined) return { city, article, revision: lists.articles[article].revision };
    }
  }
  return undefined;
};

// ---- The package's own venues. ----
const dist = (name) => here(`../dist/${name}`).href;
const { PLACES, surfaceOf } = await import(dist("atlas-entry.js"));
const { STADIUMS, STADIUM_IDS, stadiumConfigs, stadiumNames } = await import(dist("stadiums-entry.js"));
const { VENUES, VENUE_IDS } = await import(dist("venues-entry.js"));
const { circuitById } = await import(dist("circuits-entry.js"));
const SITE = "https://johnmorrisdotca.github.io/kyogijo-stadiums/";
const TENANT = Object.fromEntries(data.leagues.map((league) => [league.tenant, league.id]));
const LEAGUE_SPORT = Object.fromEntries(data.leagues.map((league) => [league.id, league.sport]));
const PLACE_SPORT = { baseball: "baseball", soccer: "soccer", hockey: "hockey", basketball: "basketball", budo: "budo" };
const CONFIG_SPORT = { cfl: "canadian-football", nfl: "american-football", soccer: "soccer", mlb: "baseball", boxing: "boxing", nba: "basketball" };

const entries = new Map();
const add = (entry) => {
  if (entries.has(entry.id)) fail(`${entry.id} is listed twice`);
  entries.set(entry.id, entry);
};
const supportedExtra = { "korakuen-hall": { city: "Tokyo" } };
/** The name of a city in Japanese where the reviewer changed Wikidata's label (a council area's or a province's label where the city is meant), by the city's English name. */
const CITY_JA = data.cityJa ?? {};

for (const place of PLACES) {
  const stadium = STADIUM_IDS.includes(place.id) ? STADIUMS[place.id] : undefined;
  const venue = VENUE_IDS.includes(place.id) ? VENUES[place.id] : undefined;
  const sports = [...new Set([...place.sports.map((sport) => PLACE_SPORT[sport]), ...(stadium === undefined ? [] : stadiumConfigs(stadium).map((config) => CONFIG_SPORT[config]))])];
  // The clubs that play there this season: a place of the past has none, whatever its data says of a club's last year.
  const current = place.status === "past" ? [] : place.tenants.filter((tenant) => tenant.to === undefined && TENANT[tenant.league] !== undefined);
  const teams = current.map((tenant) => ({ name: tenant.club, ...(tenant.clubJa === undefined ? {} : { nameJa: tenant.clubJa }), league: TENANT[tenant.league] }));
  const city = cityOf(entity(place.wikidata), place.city);
  add({
    id: place.id,
    status: "supported",
    drawn: stadium !== undefined || venue !== undefined ? "outline" : "surface",
    kind: stadium !== undefined ? "stadium" : venue !== undefined ? "venue" : place.kind,
    name: place.name,
    nameJa: place.nameJa,
    nameJaFrom: "package",
    city: place.city,
    ...((CITY_JA[place.city] ?? city?.cityJa) === undefined ? {} : { cityJa: CITY_JA[place.city] ?? city.cityJa }),
    country: place.country,
    lat: place.lat,
    lon: place.lon,
    // The sports it is drawn for, then the sports of the leagues that play there this season (an NFL stadium the package draws as a soccer ground is a football stadium too).
    sports: [...new Set([...sports, ...teams.map((team) => LEAGUE_SPORT[team.league])])],
    wikidata: place.wikidata,
    era: place.status,
    ...(teams.length === 0 ? {} : { leagues: [...new Set(teams.map((team) => team.league))], teams }),
    groups: [],
    draw: stadium !== undefined ? { sport: stadiumConfigs(stadium)[0], [place.kind === "park" ? "park" : "stadium"]: place.id, crowd: { real: true } } : venue !== undefined ? { sport: "nhl", arena: place.id, crowd: { real: true } } : surfaceOf(place),
    demo: stadium !== undefined ? `stadiums.html?stadium=${place.id}` : venue !== undefined ? `venues.html?venue=${place.id}` : `?place=${place.id}#atlas`,
  });
}
for (const id of STADIUM_IDS.filter((one) => !entries.has(one))) {
  const stadium = STADIUMS[id];
  const item = entity(stadium.wikidata);
  if (item === undefined) fail(`${id}: ${stadium.wikidata} is not in the raw answers`);
  const names = stadiumNames(stadium);
  const city = cityOf(item, supportedExtra[id]?.city ?? "");
  if (city === undefined) fail(`${id}: its city is not among the places its item is located in`);
  add({
    id,
    status: "supported",
    drawn: "outline",
    kind: "stadium",
    name: names.en,
    nameJa: names.ja,
    nameJaFrom: "package",
    city: city.city,
    ...((CITY_JA[city.city] ?? city.cityJa) === undefined ? {} : { cityJa: CITY_JA[city.city] ?? city.cityJa }),
    country: countryOf(item),
    ...coordinatesOf(item),
    sports: stadiumConfigs(stadium).map((config) => CONFIG_SPORT[config]),
    wikidata: stadium.wikidata,
    era: "current",
    groups: [],
    draw: { sport: stadiumConfigs(stadium)[0], stadium: id, crowd: { real: true } },
    demo: `stadiums.html?stadium=${id}`,
  });
}

// ---- The venues it does not draw yet. ----
const SEASON_ARTICLE = Object.fromEntries(data.seasons.map((season) => [season.id, season.article]));
const groupOf = new Map();
for (const group of data.groups) for (const [rank, id] of group.ids.entries()) groupOf.set(id, { group, rank });
for (const venue of data.venues) {
  const placed = groupOf.get(venue.id);
  const item = venue.enwiki !== undefined ? landing.get(venue.enwiki) : { title: undefined, wikidata: searches.answers[venue.search]?.search?.find((hit) => hit.label === venue.search)?.id };
  if (item?.wikidata === undefined) fail(`${venue.id}: ${venue.enwiki ?? venue.search} names no Wikidata item in the raw answers`);
  const one = items[item.wikidata];
  if (one === undefined) fail(`${venue.id}: ${item.wikidata} is not in the raw answers`);
  // A name in Japanese written in the data was checked by a reviewer: it stands where Wikidata has none, or where its label is out of date or wrong (the reviewer said which).
  const japanese = venue.nameJa !== undefined ? { nameJa: venue.nameJa, from: "reviewed" } : japaneseOf(one);
  const coordinates = coordinatesOf(one);
  const country = countryOf(one);
  const rowArticles = [...(venue.league === undefined ? [] : [data.leagues.find((league) => league.id === venue.league).check]), ...(placed?.group.id === "f1" ? [SEASON_ARTICLE.f1] : []), ...(venue.motogp === true ? [SEASON_ARTICLE.motogp] : [])];
  const city = cityOf(one, venue.city) ?? cityInRow(rowArticles, item.title, venue.city);
  const capacity = capacityOf(one);
  const missing = {};
  if (japanese === undefined) missing.nameJa = "Wikidata has no Japanese label and the Japanese Wikipedia no article";
  if (coordinates === undefined) missing.coordinates = "Wikidata gives no coordinates (P625)";
  if (country === undefined) missing.country = "Wikidata gives no one country (P17)";
  if (city === undefined) missing.city = `${venue.city} is neither among the places Wikidata says the venue is in (P131) nor in the venue's row of a list article`;
  for (const [field, why] of Object.entries(missing)) gap(venue.id, field, why);
  let teams;
  if (venue.league !== undefined) {
    const league = data.leagues.find((one) => one.id === venue.league);
    const article = league.check;
    if (!listed(article, item.title)) fail(`${venue.id}: ${item.title} is not in the table of ${article}`);
    teams = venue.teams.map((title) => {
      const team = items[landing.get(title)?.wikidata];
      if (team === undefined) fail(`${venue.id}: the team ${title} names no item in the raw answers`);
      if (!listed(article, landing.get(title).title)) fail(`${venue.id}: ${title} is not in the table of ${article}`);
      if (!ids(team, "P115").includes(item.wikidata)) gap(venue.id, "team", `${title}'s home venue (P115) on Wikidata is not ${item.wikidata}; the list article's row is what says so`);
      return { name: label(team, "en") ?? title, ...(japaneseOf(team) === undefined ? {} : { nameJa: japaneseOf(team).nameJa }), league: venue.league };
    });
  }
  if (placed?.group.id === "f1" && !listed(SEASON_ARTICLE.f1, item.title, "circuits")) fail(`${venue.id}: ${item.title} is not a circuit of the calendar of ${SEASON_ARTICLE.f1}`);
  if (venue.motogp === true && !listed(SEASON_ARTICLE.motogp, item.title)) fail(`${venue.id}: ${item.title} is not on the calendar of ${SEASON_ARTICLE.motogp}`);
  // A circuit the package draws (`CIRCUITS`): supported, drawn as a circuit with no stands; its names and country are the package's, its place and coordinates Wikidata's.
  if (venue.package === "circuits") {
    const circuit = circuitById(venue.id);
    if (circuit === undefined) fail(`${venue.id} is not a key of CIRCUITS`);
    if (circuit.wikidata !== item.wikidata) fail(`${venue.id}: CIRCUITS says ${circuit.wikidata}, the article ${item.wikidata}`);
    add({
      id: circuit.id,
      status: "supported",
      drawn: "circuit",
      kind: "circuit",
      name: circuit.names.en,
      nameJa: circuit.names.ja,
      nameJaFrom: "package",
      ...(city === undefined ? {} : { city: city.city, ...((CITY_JA[city.city] ?? city.cityJa) === undefined ? {} : { cityJa: CITY_JA[city.city] ?? city.cityJa }) }),
      country: circuit.country,
      ...coordinates,
      sports: venue.sports,
      wikidata: circuit.wikidata,
      era: "current",
      groups: [],
      demo: `circuits.html?circuit=${circuit.id}`,
      ...(Object.keys(missing).length === 0 ? {} : { missing }),
    });
    continue;
  }
  const status = placed?.group.status ?? "wanted";
  add({
    id: venue.id,
    status,
    want: "venue",
    ...(placed?.group.needs === undefined ? {} : { needs: placed.group.needs }),
    // The name English sports media use: the title of the English article, without a qualifier in brackets (Wikidata's label can be a former or a formal name).
    name: venue.name ?? item.title?.replace(/\s*\([^)]*\)$/, "") ?? label(one, "en"),
    ...(japanese === undefined ? {} : { nameJa: japanese.nameJa, nameJaFrom: japanese.from }),
    ...(city === undefined ? {} : { city: city.city, ...((venue.cityJa ?? CITY_JA[city.city] ?? city.cityJa) === undefined ? {} : { cityJa: venue.cityJa ?? CITY_JA[city.city] ?? city.cityJa }) }),
    ...(country === undefined ? {} : { country }),
    ...coordinates,
    sports: venue.sports,
    wikidata: item.wikidata,
    ...(capacity === undefined ? {} : { capacity }),
    ...(teams === undefined ? {} : { leagues: [venue.league], teams }),
    groups: [],
    ...(status === "working-on" ? { ticket: data.workingOnTicket } : {}),
    ...(Object.keys(missing).length === 0 ? {} : { missing }),
  });
}

// ---- The groups, and what is wanted of a venue the package draws as a surface only. ----
const groups = [];
for (const league of data.leagues) {
  const members = [...entries.values()].filter((entry) => entry.leagues?.includes(league.id));
  const order = { outline: 0, surface: 1, undefined: 2 };
  members.sort((a, b) => order[a.drawn] - order[b.drawn] || a.name.localeCompare(b.name, "en"));
  groups.push({ id: league.id, kind: "league", sport: league.sport, season: league.season, ids: members.map((entry) => entry.id) });
}
for (const group of data.groups) {
  for (const id of group.ids) if (!entries.has(id)) fail(`the group ${group.id} names ${id}, which is in neither the package nor scripts/catalogue.data.json`);
  groups.push({ id: group.id, kind: "collection", ...(group.status === undefined ? {} : { status: group.status }), ...(group.needs === undefined ? {} : { needs: group.needs }), ids: group.ids });
}
for (const group of groups) {
  for (const id of group.ids) {
    const entry = entries.get(id);
    entry.groups.push(group.id);
    if (entry.status === "supported" && entry.drawn === "surface") entry.want = "outline";
  }
}
const items2 = new Map();
for (const entry of entries.values()) {
  if (items2.has(entry.wikidata)) fail(`${entry.id} and ${items2.get(entry.wikidata)} are the same item, ${entry.wikidata}`);
  items2.set(entry.wikidata, entry.id);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.id)) fail(`${entry.id}: an id is kebab case`);
  if (entry.status !== "supported" && items[entry.wikidata] === undefined) fail(`${entry.id}: ${entry.wikidata} is not in the raw answers`);
}

// A city named the same in the same country is one city: where one venue's place gave its Japanese name and another's did not, the other takes it.
{
  const known = new Map();
  for (const entry of entries.values()) if (entry.city !== undefined && entry.cityJa !== undefined && !known.has(`${entry.country}|${entry.city}`)) known.set(`${entry.country}|${entry.city}`, entry.cityJa);
  for (const entry of entries.values()) if (entry.city !== undefined && entry.cityJa === undefined && known.has(`${entry.country}|${entry.city}`)) entry.cityJa = known.get(`${entry.country}|${entry.city}`);
}

// The countries' names, from their items.
const countries = {};
for (const one of Object.values(places)) {
  const code = best(one, "P297")[0]?.mainsnak.datavalue.value;
  if (code === undefined || countries[code] !== undefined) continue;
  countries[code] = { en: label(one, "en"), ja: label(one, "ja") };
}
const CATALOGUE = [...entries.values()];
const STATUS = { supported: 0, "working-on": 1, wanted: 2 };
CATALOGUE.sort((a, b) => STATUS[a.status] - STATUS[b.status]);
const usedCountries = Object.fromEntries([...new Set(CATALOGUE.map((entry) => entry.country).filter(Boolean))].sort().map((code) => {
  if (countries[code] === undefined) fail(`no item of the raw answers has the country code ${code}`);
  return [code, countries[code]];
}));

// ---- What is written. ----
const words = data.words;
const counts = {
  supported: CATALOGUE.filter((entry) => entry.status === "supported").length,
  outline: CATALOGUE.filter((entry) => entry.drawn === "outline").length,
  surface: CATALOGUE.filter((entry) => entry.drawn === "surface").length,
  circuit: CATALOGUE.filter((entry) => entry.drawn === "circuit").length,
  workingOn: CATALOGUE.filter((entry) => entry.status === "working-on").length,
  wanted: CATALOGUE.filter((entry) => entry.status === "wanted").length,
  outlineWanted: CATALOGUE.filter((entry) => entry.want === "outline").length,
};
const source = {
  read: day,
  rawAnswers: `data-sources/catalogue/${day}/`,
  articles: Object.fromEntries(Object.entries(lists.articles).map(([title, article]) => [title, article.revision])),
};
const licence =
  "The facts are Wikidata's (CC0): items, names, coordinates, countries, capacities and places. Which venues a league plays in and which circuits a calendar races at were checked against the English Wikipedia articles and revisions in `source.articles` (CC BY-SA 4.0); no text of an article is copied. The supported venues' facts are the package's own (see its NOTICE.md). The catalogue itself is MIT, as the package is.";
const json = { schemaVersion: 1, generatedAt: day, package: { name: pkg.name, version: pkg.version }, address: `${SITE}catalogue.json`, site: SITE, licence, source, counts, sports: words.sports, groups: groups.map((group) => ({ ...group, en: words.groups[group.id].en, ja: words.groups[group.id].ja })), countries: usedCountries, venues: CATALOGUE };
/** The JSON with one venue to a line: readable, diffable and not three times its size. */
const lines = (value) => {
  const { venues, ...rest } = value;
  const head = JSON.stringify(rest, null, 1);
  return `${head.slice(0, -2)},\n "venues": [\n${venues.map((venue) => `  ${JSON.stringify(venue)}`).join(",\n")}\n ]\n}`;
};
writeFileSync(here("../catalogue.json"), `${lines(json)}\n`);
writeFileSync(
  here("../src/catalogue.data.ts"),
  `// Made by \`pnpm catalogue\` (scripts/build-catalogue.mjs) from the package's own data, scripts/catalogue.data.json and the raw answers in data-sources/catalogue/${day}/; do not edit by hand.\n// ${licence}\nimport type { CatalogueData } from "./catalogue.types.ts";\n\nexport const CATALOGUE_DATA: CatalogueData = ${lines(json)};\n`,
);
for (const [file, language] of [["../docs/catalogue.md", "en"], ["../docs/catalogue.ja.md", "ja"]]) {
  const text = readFileSync(here(file), "utf8");
  writeFileSync(here(file), replaceBlocks(text, catalogueTables(json, language)));
}
console.log(`catalogue: ${CATALOGUE.length} venues: ${counts.supported} supported (${counts.outline} in their buildings, ${counts.surface} as a surface, ${counts.circuit} as a circuit), ${counts.workingOn} working on, ${counts.wanted} wanted; ${counts.outlineWanted} outlines wanted`);
for (const group of groups) console.log(`  ${group.id}: ${group.ids.length}`);
if (gaps.length > 0) console.log(`left blank (${gaps.length}):\n  ${gaps.join("\n  ")}`);
