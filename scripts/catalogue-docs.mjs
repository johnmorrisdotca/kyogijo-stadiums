// The tables of docs/catalogue.md and docs/catalogue.ja.md, made from the catalogue (the JSON that scripts/build-catalogue.mjs writes, or `CATALOGUE_DATA`): one function, so that the build writes them and
// src/catalogue.docs.test.js holds the pages to them. Each table sits between `<!-- name -->` and `<!-- /name -->`; nothing else of a page is touched.

const WORDS = {
  en: {
    section: "Section", venues: "Venues", supported: "Supported", outline: "drawn in its building", surface: "drawn as a field, court or floor only", workingOn: "Working on", wanted: "Wanted", outlineWanted: "of them, the building's outline is wanted",
    league: "League", season: "Season", inBuilding: "In its building", fieldOnly: "As a field only", notYet: "Not drawn yet", coverage: "{drawn} of {all} drawn in its building",
    key: "Key", venue: "Venue", city: "City", drawn: "Drawn", item: "Wikidata", ticket: "Ticket", rank: "#", want: "Wanted", capacity: "Capacity", teams: "Teams", sport: "Sport",
    drawnOutline: "in its building", drawnSurface: "field only", wantOutline: "the building's outline", wantVenue: "the venue", needsCircuit: "the venue (a circuit surface first)", past: "past",
  },
  ja: {
    section: "区分", venues: "会場数", supported: "対応済み", outline: "建物ごと描ける", surface: "競技面のみ描ける", workingOn: "制作中", wanted: "今後追加したい会場", outlineWanted: "うち、建物の輪郭を追加したいもの",
    league: "リーグ", season: "シーズン", inBuilding: "建物ごと", fieldOnly: "競技面のみ", notYet: "未対応", coverage: "{all}会場中{drawn}会場を建物ごと描画",
    key: "キー", venue: "会場", city: "都市", drawn: "描き方", item: "Wikidata", ticket: "チケット", rank: "番号", want: "追加したいもの", capacity: "収容人数", teams: "チーム", sport: "競技",
    drawnOutline: "建物ごと", drawnSurface: "競技面のみ", wantOutline: "建物の輪郭", wantVenue: "会場", needsCircuit: "会場（先にサーキットの描画が必要）", past: "過去の会場",
  },
};

const cell = (text) => String(text ?? "").replace(/\|/g, "\\|");
const number = (value, language) => (value === undefined ? "" : value.toLocaleString(language === "ja" ? "ja-JP" : "en-US"));
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => String(values[key]));
/** A colon and brackets in the language's own form: full width in Japanese. */
const PUNCT = { en: { colon: ": ", open: " (", close: ")" }, ja: { colon: "：", open: "（", close: "）" } };

/** The tables of the catalogue's page in a language, by the name of their markers. */
export function catalogueTables(catalogue, language) {
  const w = WORDS[language];
  const p = PUNCT[language];
  const bracket = (text) => `${p.open}${text}${p.close}`;
  const byId = new Map(catalogue.venues.map((venue) => [venue.id, venue]));
  const name = (venue) => (language === "ja" ? venue.nameJa ?? venue.name : venue.name);
  const country = (code) => (code === undefined ? "" : catalogue.countries[code]?.[language] ?? code);
  const place = (venue) => [language === "ja" ? venue.cityJa ?? venue.city : venue.city, country(venue.country)].filter(Boolean).join(language === "ja" ? "、" : ", ");
  const sportName = (sport) => catalogue.sports[sport][language];
  const groupName = (group) => group[language];
  const item = (venue) => `[${venue.wikidata}](https://www.wikidata.org/wiki/${venue.wikidata})`;
  const drawn = (venue) => (venue.drawn === "outline" ? w.drawnOutline : `${w.drawnSurface}${venue.era === "past" ? bracket(w.past) : ""}`);
  const want = (venue) => (venue.want === "outline" ? w.wantOutline : venue.needs === "circuit-surface" ? w.needsCircuit : w.wantVenue);
  const table = (head, rows) => [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`)].join("\n");
  const blocks = {};

  const all = catalogue.venues;
  blocks["catalogue-counts"] = table(
    [w.section, w.venues],
    [
      [w.supported, number(catalogue.counts.supported, language)],
      [`${w.supported}${p.colon}${w.outline}`, number(catalogue.counts.outline, language)],
      [`${w.supported}${p.colon}${w.surface}`, number(catalogue.counts.surface, language)],
      [`${w.supported}${p.colon}${w.outlineWanted}`, number(all.filter((venue) => venue.status === "supported" && venue.want === "outline").length, language)],
      [w.workingOn, number(catalogue.counts.workingOn, language)],
      [w.wanted, number(catalogue.counts.wanted, language)],
    ],
  );

  const leagues = catalogue.groups.filter((group) => group.kind === "league");
  blocks["catalogue-leagues"] = table(
    [w.league, w.season, w.venues, w.inBuilding, w.fieldOnly, w.notYet, ""].slice(0, 6),
    leagues.map((group) => {
      const members = group.ids.map((id) => byId.get(id));
      return [groupName(group), group.season, number(members.length, language), number(members.filter((venue) => venue.drawn === "outline").length, language), number(members.filter((venue) => venue.drawn === "surface").length, language), number(members.filter((venue) => venue.status !== "supported").length, language)];
    }),
  );
  // One table per league: every venue of its season, with its teams and how it is drawn.
  blocks["catalogue-league-venues"] = leagues
    .map((group) => {
      const members = group.ids.map((id) => byId.get(id));
      const drawnNow = members.filter((venue) => venue.drawn === "outline").length;
      const heading = `### ${groupName(group)}${p.colon}${fill(w.coverage, { drawn: drawnNow, all: members.length })}`;
      const rows = members.map((venue) => [`\`${venue.id}\``, name(venue), place(venue), venue.teams.filter((team) => team.league === group.id).map((team) => (language === "ja" ? team.nameJa ?? team.name : team.name)).join(language === "ja" ? "、" : ", "), venue.status === "supported" ? drawn(venue) : w.notYet, item(venue)]);
      return `${heading}\n\n${table([w.key, w.venue, w.city, w.teams, w.drawn, w.item], rows)}`;
    })
    .join("\n\n");

  // The supported venues, by the first sport each is drawn for.
  const supported = all.filter((venue) => venue.status === "supported");
  const sports = [...new Set(supported.map((venue) => venue.sports[0]))];
  blocks["catalogue-supported"] = sports
    .map((sport) => {
      const members = supported.filter((venue) => venue.sports[0] === sport);
      return `### ${sportName(sport)}${bracket(number(members.length, language))}\n\n${table([w.key, w.venue, w.city, w.drawn, w.item], members.map((venue) => [`\`${venue.id}\``, name(venue), place(venue), drawn(venue), item(venue)]))}`;
    })
    .join("\n\n");

  const workingOn = all.filter((venue) => venue.status === "working-on");
  blocks["catalogue-working-on"] = table([w.key, w.venue, w.city, w.sport, w.ticket, w.item], workingOn.map((venue) => [`\`${venue.id}\``, name(venue), place(venue), venue.sports.map(sportName).join(language === "ja" ? "、" : ", "), venue.ticket, item(venue)]));

  // The wanted venues, by group, in the group's order: new venues, and the venues drawn today as a field only whose building is wanted.
  blocks["catalogue-wanted"] = catalogue.groups
    .filter((group) => group.kind === "collection" && group.status !== "working-on")
    .map((group) => {
      const members = group.ids.map((id) => byId.get(id));
      const rows = members.map((venue, index) => [number(index + 1, language), `\`${venue.id}\``, name(venue), place(venue), venue.sports.map(sportName).join(language === "ja" ? "、" : ", "), want(venue), number(venue.capacity, language), item(venue)]);
      return `### ${groupName(group)}${bracket(number(members.length, language))}\n\n${table([w.rank, w.key, w.venue, w.city, w.sport, w.want, w.capacity, w.item], rows)}`;
    })
    .join("\n\n");
  return blocks;
}

/** A page with each `<!-- name -->` ... `<!-- /name -->` block replaced by its table. A marker that is missing is an error. */
export function replaceBlocks(text, blocks) {
  let out = text;
  for (const [name, body] of Object.entries(blocks)) {
    const open = `<!-- ${name} -->`;
    const close = `<!-- /${name} -->`;
    const start = out.indexOf(open);
    const end = out.indexOf(close);
    if (start < 0 || end < start) throw new Error(`the page has no ${open} ... ${close}`);
    out = `${out.slice(0, start + open.length)}\n${body}\n${out.slice(end)}`;
  }
  return out;
}
