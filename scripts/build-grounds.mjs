// Writes src/grounds.data.ts and docs/grounds.md from scripts/grounds.data.json and scripts/grounds.editions.json.
//
// The grounds are listed by hand, as the parks are: a fact (a name, a place, a year, a capacity, a pitch's length and width) is
// read from the English Wikipedia article of each ground at the revision the entry names (and the Japanese article for the name in
// Japanese), its Wikidata item is the one that article is linked to (checked against the item's labels by scripts/check-grounds.mjs),
// and its coordinates are Wikidata's (P625, CC0). No text, table or picture of the articles is copied. The editions file lists, for
// each World Cup, the grounds of this list that staged matches and where the final was played, read from the venue section of the
// tournament's article at the revision it names; the tournaments of each ground are made from it. FIFA's own pages are not used.
// See docs/references.md and NOTICE.md.
import { readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";

const grounds = JSON.parse(readFileSync(new URL("./grounds.data.json", import.meta.url), "utf8"));
const editions = JSON.parse(readFileSync(new URL("./grounds.editions.json", import.meta.url), "utf8"));

const COMPETITIONS = ["world-cup", "womens-world-cup"];
const ids = new Set();
const items = new Set();
const fail = (message) => {
  throw new Error(message);
};
const isYear = (value) => Number.isInteger(value) && value > 1800 && value < 2200;
const inRange = (value, [low, high]) => value >= low && value <= high;
const UNIT = { m: 1, yd: 0.9144 };

for (const g of grounds) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.id ?? "")) fail(`${g.id}: the key is a slug`);
  if (ids.has(g.id)) fail(`${g.id} is listed twice`);
  ids.add(g.id);
  if (!/^Q[1-9]\d*$/.test(g.wikidata ?? "")) fail(`${g.id} needs its Wikidata item`);
  if (items.has(g.wikidata)) fail(`${g.id}: ${g.wikidata} is another ground's item`);
  items.add(g.wikidata);
  if (typeof g.name !== "string" || g.name === "") fail(`${g.id} needs a name`);
  if (!/^[A-Z]{2}$/.test(g.country ?? "")) fail(`${g.id}: the country is an ISO 3166-1 alpha-2 code`);
  if (typeof g.city !== "string" || g.city === "") fail(`${g.id} needs a city`);
  if ((g.nameLocal === undefined) !== (g.localLanguage === undefined)) fail(`${g.id}: nameLocal and localLanguage go together`);
  if (!(typeof g.lat === "number" && g.lat >= -90 && g.lat <= 90 && typeof g.lon === "number" && g.lon >= -180 && g.lon <= 180)) fail(`${g.id}: the coordinates are out of range`);
  if (!["current", "past"].includes(g.status)) fail(`${g.id}: status ${g.status}`);
  if (g.from !== undefined && !isYear(g.from)) fail(`${g.id}: from`);
  if (g.to !== undefined && !(isYear(g.to) && g.from !== undefined && g.from <= g.to)) fail(`${g.id}: to`);
  if (g.status === "past" && g.to === undefined) fail(`${g.id}: a past ground gives the year it closed`);
  if (g.status === "current" && g.to !== undefined) fail(`${g.id}: a current ground has no closing year`);
  if (g.capacity !== undefined && !(Number.isInteger(g.capacity) && g.capacity > 1000 && g.capacity < 200000)) fail(`${g.id}: capacity`);
  if (!g.en?.title || !(g.en.revision > 1000)) fail(`${g.id} cites no English article`);
  if (g.ja !== undefined && !(g.ja.title && g.ja.revision > 1000)) fail(`${g.id}: the Japanese article`);
  if (g.nameJa === undefined || g.ja === undefined) fail(`${g.id} needs its name in Japanese and the article it was read from`);
  // The names in order of time. Where two share a year the later one is the name at the end of it, and an entry further down overrides one above it.
  for (const period of g.names ?? []) {
    if (typeof period.name !== "string" || !isYear(period.from) || !isYear(period.to) || period.from > period.to) fail(`${g.id}: a name gives its first and last year`);
  }
  // The pitch: a size the article gives, which is a pitch for international matches (Law 1.4: 100 to 110 by 64 to 75 m), or the default and no size.
  if (g.pitchSize === "published") {
    const p = g.pitch;
    if (!p || !(p.length > p.width && UNIT[p.unit] !== undefined)) fail(`${g.id}: a published pitch has a length, a width and a unit`);
    const length = p.length * UNIT[p.unit];
    const width = p.width * UNIT[p.unit];
    if (!inRange(length, [100, 110]) || !inRange(width, [64, 75])) fail(`${g.id}: ${p.length} by ${p.width} ${p.unit} is not a size for international matches; list the ground at the default and say why in pitchNote`);
  } else if (g.pitchSize === "default") {
    if (g.pitch !== undefined) fail(`${g.id}: a ground at the default size has no pitch`);
  } else fail(`${g.id}: pitchSize`);
}

// The tournaments.
const seen = new Set();
for (const e of editions) {
  if (!COMPETITIONS.includes(e.competition) || !isYear(e.year)) fail(`edition ${e.competition} ${e.year}`);
  const key = `${e.competition}-${e.year}`;
  if (seen.has(key)) fail(`${key} is listed twice`);
  seen.add(key);
  if (!e.article?.title || !(e.article.revision > 1000)) fail(`${key} cites no article`);
  if (!Array.isArray(e.grounds) || e.grounds.length === 0) fail(`${key} lists no ground`);
  for (const id of [...e.grounds, ...(e.final === null ? [] : [e.final])]) if (!ids.has(id)) fail(`${key}: ${id} is not a ground`);
  if (e.final !== null && !e.grounds.includes(e.final)) fail(`${key}: the final ground is one of its grounds`);
  if (new Set(e.grounds).size !== e.grounds.length) fail(`${key}: a ground twice`);
}
const order = (a, b) => COMPETITIONS.indexOf(a.competition) - COMPETITIONS.indexOf(b.competition) || a.year - b.year;
const data = grounds.map((g) => {
  const tournaments = editions
    .filter((e) => e.grounds.includes(g.id))
    .map((e) => ({ competition: e.competition, year: e.year, ...(e.final === g.id ? { final: true } : {}) }))
    .sort(order);
  return { ...g, tournaments };
});
// A ground the tournaments pass over is still a ground: it is a club's or a stadium of note.

const line = (value) => JSON.stringify(value).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/\},\{/g, "}, {");
const field = (key, value) => `    "${key}": ${(key === "names" || key === "tournaments") && value.length > 0 ? `[\n${value.map((v) => `      ${line(v)}`).join(",\n")}\n    ]` : line(value)}`;
const KEYS = ["id", "wikidata", "name", "names", "nameLocal", "localLanguage", "nameJa", "city", "country", "lat", "lon", "status", "from", "to", "capacity", "pitchSize", "pitch", "pitchNote", "note", "en", "ja", "tournaments"];
const entry = (g) => {
  for (const key of Object.keys(g)) if (!KEYS.includes(key)) fail(`${g.id}: unknown field ${key}`);
  return `  {\n${KEYS.filter((key) => g[key] !== undefined && !(key === "names" && g[key].length === 0)).map((key) => field(key, g[key])).join(",\n")},\n  }`;
};
const text = `// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand.
// The facts are those of the articles each entry cites; see docs/references.md.
import type { GroundData } from "./grounds.ts";

export const GROUND_DATA: GroundData[] = [
${data.map(entry).join(",\n")},
];
`;
writeFileSync(new URL("../src/grounds.data.ts", import.meta.url), text);

// docs/grounds.md: every ground, for people.
const COUNTRY = { UY: "Uruguay", IT: "Italy", FR: "France", BR: "Brazil", CH: "Switzerland", SE: "Sweden", CL: "Chile", GB: "United Kingdom", MX: "Mexico", DE: "Germany", AR: "Argentina", ES: "Spain", US: "United States", JP: "Japan", ZA: "South Africa", RU: "Russia", QA: "Qatar", CA: "Canada", CN: "China", AU: "Australia", PT: "Portugal", KR: "South Korea", NL: "Netherlands" };
const cup = (t) => `${t.competition === "world-cup" ? "WC" : "WWC"} ${t.year}${t.final ? " (final)" : ""}`;
const size = (g) => (g.pitchSize === "published" ? `${g.pitch.length} × ${g.pitch.width} ${g.pitch.unit}` : "default, 105 × 68 m");
const years = (g) => (g.status === "past" ? `${g.from}–${g.to}` : g.from === undefined ? "" : `${g.from}–`);
const name = (g) => (g.nameLocal !== undefined && g.nameLocal !== g.name ? `${g.name} (${g.nameLocal})` : g.name);
const fixed = grounds.filter((g) => g.pitchSize === "default");
const md = `# The grounds

Made by \`pnpm grounds\` from \`scripts/grounds.data.json\` and \`scripts/grounds.editions.json\`; do not edit by hand. ${grounds.length} grounds, ${
  grounds.length - fixed.length
} with a published pitch size and ${fixed.length} drawn at the default 105 by 68 m. Every figure is a fact read from the English Wikipedia article named in [NOTICE.md](../NOTICE.md) at the revision named there (the pitch from its infobox), the coordinates are Wikidata's (CC0), and the tournaments are read from the venue sections of the tournaments' articles, also listed there. Each ground in \`GROUNDS\` has its city and country, its Wikidata item and coordinates, the names it had with their years (\`year\` picks one: \`groundNameIn\`), its name in the place's language and in Japanese, the years it was open, its capacity, the World Cups it staged and the article and revision each fact was read from. \`drawKyogijo({ sport: "soccer", ground })\` draws the pitch at the size in the Pitch column. \`WC\` is the men's World Cup, \`WWC\` the Women's; only the grounds of this list are named, so a tournament's other venues are not here.

| Key | Ground | City | Wikidata | Open | Capacity | Pitch | Tournaments |
| --- | --- | --- | --- | --- | --- | --- | --- |
${data
  .map((g) => `| \`${g.id}\` | ${name(g)} | ${g.city}, ${COUNTRY[g.country] ?? g.country} | ${g.wikidata} | ${years(g)} | ${g.capacity?.toLocaleString("en-US") ?? ""} | ${size(g)} | ${g.tournaments.map(cup).join(", ")} |`)
  .join("\n")}

## Grounds at the default size

A ground whose article gives no pitch size for football (or one that cannot be a pitch for international matches) is drawn at the international 105 by 68 m and marked \`pitchSize: "default"\`. No size is ever guessed.

${fixed.map((g) => `- \`${g.id}\`, ${g.name}${g.pitchNote ? `: ${g.pitchNote}` : ""}`).join("\n")}

## The World Cups

| Tournament | Final | Grounds of this list |
| --- | --- | --- |
${[...editions]
  .sort(order)
  .map((e) => `| ${e.competition === "world-cup" ? "Men's" : "Women's"} ${e.year} | ${e.final === null ? "none (a final round)" : grounds.find((g) => g.id === e.final).name} | ${e.grounds.map((id) => grounds.find((g) => g.id === id).name).join(", ")} |`)
  .join("\n")}
`;
writeFileSync(new URL("../docs/grounds.md", import.meta.url), md);
console.log(`src/grounds.data.ts: ${grounds.length} grounds, ${editions.length} tournaments; docs/grounds.md`);
