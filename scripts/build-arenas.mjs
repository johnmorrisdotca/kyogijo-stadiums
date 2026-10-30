// Writes src/arenas.data.ts and docs/arenas.md from scripts/arenas.data.json (`pnpm arenas`).
//
// The arenas are listed by hand, as the grounds are: a fact (a name, a place, a year, a number of seats, the size of a rink) is read from the English Wikipedia article of each
// arena at the revision the entry names (and the Japanese name from the Japanese article's title), its Wikidata item is the one that article is linked to (checked against the
// item's labels by scripts/check-arenas.mjs), and its coordinates are Wikidata's (P625, CC0). scripts/fetch-arenas.mjs writes the evidence in scripts/arenas.wikidata.json. No text,
// table or picture of the articles is copied. An arena is listed when a club of the NHL, the NBA (the BAA before it), the WNBA or the PWHL has played its home games there: the
// tenants (scripts/build-tenants.mjs) say which. A size is given only where an article gives one that differs from the league's (the NHL's rink is 200 by 85 feet, the NBA's court
// 94 by 50), and says where. See docs/arenas.md and docs/references.md.
import { readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";
import { checkNames } from "./names-lib.mjs";
import { writeVenueFiles } from "./venue-files.mjs";

const read = (name) => JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url), "utf8"));
const arenas = read("arenas.data.json");
const others = new Set([...read("parks.data.json"), ...read("grounds.data.json")].flatMap((p) => [p.id, p.wikidata]));

const ids = new Set();
const items = new Set();
const fail = (message) => {
  throw new Error(message);
};
const isYear = (value) => Number.isInteger(value) && value > 1800 && value < 2200;
const UNITS = ["ft", "m"];

for (const a of arenas) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.id ?? "")) fail(`${a.id}: the key is a slug`);
  if (ids.has(a.id) || others.has(a.id)) fail(`${a.id} is listed twice, or is a park's or a ground's key`);
  ids.add(a.id);
  if (!/^Q[1-9]\d*$/.test(a.wikidata ?? "")) fail(`${a.id} needs its Wikidata item`);
  if (items.has(a.wikidata) || others.has(a.wikidata)) fail(`${a.id}: ${a.wikidata} is another place's item`);
  items.add(a.wikidata);
  if (typeof a.name !== "string" || a.name === "") fail(`${a.id} needs a name`);
  if (!/^[A-Z]{2}$/.test(a.country ?? "")) fail(`${a.id}: the country is an ISO 3166-1 alpha-2 code`);
  if (typeof a.city !== "string" || a.city === "") fail(`${a.id} needs a city`);
  checkNames(a, fail);
  if (!(typeof a.lat === "number" && a.lat >= -90 && a.lat <= 90 && typeof a.lon === "number" && a.lon >= -180 && a.lon <= 180)) fail(`${a.id}: the coordinates are out of range`);
  if (!["current", "past"].includes(a.status)) fail(`${a.id}: status ${a.status}`);
  for (const key of ["from", "to", "closed", "demolished"]) if (a[key] !== undefined && !isYear(a[key])) fail(`${a.id}: ${key}`);
  if (a.from !== undefined && a.to !== undefined && a.from > a.to) fail(`${a.id}: it ends before it opens`);
  if (a.status === "current" && a.to !== undefined) fail(`${a.id}: an arena in use has no last year`);
  for (const [sport, seats] of Object.entries(a.capacity ?? {})) if (!["hockey", "basketball"].includes(sport) || !(Number.isInteger(seats) && seats > 500 && seats < 30000)) fail(`${a.id}: capacity ${sport}`);
  for (const key of ["rink", "court"]) {
    const sizes = a[key];
    if (sizes === undefined) continue;
    if (!Array.isArray(sizes) || sizes.length === 0) fail(`${a.id}: ${key} is a list of sizes`);
    for (const size of sizes) {
      if (!(size.length > size.width && size.width > 20 && size.length < 300 && UNITS.includes(size.unit))) fail(`${a.id}: a ${key} has a length, a width and a unit`);
      for (const bound of ["from", "to"]) if (size[bound] !== undefined && !isYear(size[bound])) fail(`${a.id}: ${key} ${bound}`);
      if (typeof size.source !== "string" || size.source === "") fail(`${a.id}: a ${key} says where it was read`);
    }
    // At most one size at a time.
    const sorted = [...sizes].sort((x, y) => (x.from ?? 0) - (y.from ?? 0));
    for (let i = 1; i < sorted.length; i += 1) if ((sorted[i - 1].to ?? 9999) >= (sorted[i].from ?? 0)) fail(`${a.id}: two ${key} sizes overlap`);
  }
  if (a.rinkUnknown !== undefined && (a.rinkUnknown !== true || a.rink !== undefined)) fail(`${a.id}: rinkUnknown is true, and for a rink with no size`);
  if (!a.en?.title || !(a.en.revision > 1000)) fail(`${a.id} cites no English article`);
  if (typeof a.nameJa !== "string" || a.nameJa === "") fail(`${a.id} needs its name in Japanese`);
  for (const period of a.names ?? []) if (typeof period.name !== "string" || !isYear(period.from) || !isYear(period.to) || period.from > period.to) fail(`${a.id}: a name gives its first and last year`);
}

const line = (value) => JSON.stringify(value).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/\},\{/g, "}, {");
const field = (key, value) => `    "${key}": ${["names", "aliases", "rink", "court"].includes(key) && value.length > 0 ? `[\n${value.map((v) => `      ${line(v)}`).join(",\n")}\n    ]` : line(value)}`;
const KEYS = ["id", "wikidata", "name", "names", "nameJa", "readingJa", "localName", "localLanguage", "aliases", "city", "country", "lat", "lon", "status", "from", "to", "closed", "demolished", "capacity", "rink", "rinkUnknown", "court", "note", "en", "ja"];
const entry = (a) => {
  for (const key of Object.keys(a)) if (!KEYS.includes(key)) fail(`${a.id}: unknown field ${key}`);
  return `  {\n${KEYS.filter((key) => a[key] !== undefined).map((key) => field(key, a[key])).join(",\n")},\n  }`;
};
const text = `// Made by scripts/build-arenas.mjs from scripts/arenas.data.json: do not edit by hand.
// The facts are those of the articles each entry cites; see docs/references.md.
import type { ArenaData } from "./arenas.core.ts";

export const ARENA_DATA: ArenaData[] = [
${arenas.map(entry).join(",\n")},
];
`;
writeFileSync(new URL("../src/arenas.data.ts", import.meta.url), text);
writeVenueFiles({ kind: "arenas", type: "ArenaData", constant: "ARENA", index: "ARENA_INDEX", records: arenas, text: entry, by: "scripts/build-arenas.mjs from scripts/arenas.data.json" });

// docs/arenas.md: every arena, for people.
const COUNTRY = { US: "United States", CA: "Canada" };
const seats = (a) => [a.capacity?.hockey === undefined ? "" : `${a.capacity.hockey.toLocaleString("en-US")} hockey`, a.capacity?.basketball === undefined ? "" : `${a.capacity.basketball.toLocaleString("en-US")} basketball`].filter(Boolean).join(", ");
const years = (a) => (a.status === "past" ? `${a.from ?? ""}–${a.to ?? ""}` : a.from === undefined ? "" : `${a.from}–`);
const feet = (s) => `${s.unit === "m" ? Math.round((s.length / 0.3048) * 10) / 10 : s.length} × ${s.unit === "m" ? Math.round((s.width / 0.3048) * 10) / 10 : s.width} ft`;
const sizes = (list) => (list === undefined ? "" : list.map((s) => `${feet(s)}${s.from === undefined && s.to === undefined ? "" : ` (${s.from ?? ""}–${s.to ?? ""})`}`).join("; "));
const nameCell = (a) => (a.localName !== undefined && a.localName !== a.name ? `${a.name} (${a.localName})` : a.name);
const current = arenas.filter((a) => a.status === "current");
const withRink = arenas.filter((a) => a.rink !== undefined);
const withNote = arenas.filter((a) => a.note !== undefined);
const differ = arenas.filter((a) => a.name !== a.en.title);
const md = `# The arenas

Made by \`pnpm arenas\` from \`scripts/arenas.data.json\`; do not edit by hand. ${arenas.length} arenas: ${current.length} that a club of the NHL, the NBA, the WNBA or the PWHL plays in today and ${arenas.length - current.length} of the past. Every fact is read from the English Wikipedia article named in [NOTICE.md](../NOTICE.md) at the revision named there, the coordinates are Wikidata's (CC0), and the clubs that played there are the tenants of [the atlas](./atlas.md#tenants). An arena is listed when a club of those leagues has played its home games there (the BAA, the NBA's first league, counts as the NBA); a practice rink, a hall that only staged a game or a college gym whose only link is a game is not. Each arena in \`ARENAS\` has its city and country, its Wikidata item and coordinates, the names it had with their years (\`year\` picks one: \`arenaNameIn\`), its name in Japanese, the years it opened and closed or was pulled down, the seats the article gives for hockey and for basketball, the size of its rink where an article gives one other than the NHL's, and the article and revision each fact was read from. \`drawKyogijo({ sport: "nhl", arena })\` draws the rink at the size in the Rink column and \`{ sport: "nba", arena }\` the court; an arena with neither draws the league's.

| Key | Arena | City | Wikidata | Open | Seats | Rink |
| --- | --- | --- | --- | --- | --- | --- |
${arenas.map((a) => `| \`${a.id}\` | ${nameCell(a)} | ${a.city}, ${COUNTRY[a.country] ?? a.country} | ${a.wikidata} | ${years(a)} | ${seats(a)} | ${sizes(a.rink)} |`).join("\n")}

## What \`from\` and \`to\` are

\`from\` is the year the arena opened (the infobox's, else Wikidata's). A current arena has no \`to\`. For an arena of the past \`to\` is the last year a club of the leagues played its home games there, as a park's is its last MLB season (the arena may have stood longer: the Montreal Forum, the Kia Forum and the Nassau Coliseum still stand); where the tenants give no year it is the year the arena closed or was pulled down. \`closed\` and \`demolished\` are the years the article gives for the building itself, where it gives them. \`status\` is \`current\` when a club of the leagues plays there today and \`past\` otherwise.

## Rinks and courts of another size

The NHL's rink is 200 by 85 feet and the NBA's court 94 by 50, and an arena is drawn at those sizes unless an article gives its own. ${withRink.length} arenas have a rink of their own, each with the article and revision and in a few words what it says:

${withRink.map((a) => `- \`${a.id}\`, ${a.name}: ${a.rink.map((s) => `${feet(s)}${s.from === undefined && s.to === undefined ? "" : ` (${s.from ?? "from the start"}${s.to === undefined ? " on" : ` to ${s.to}`})`} (${s.source})`).join("; ")}`).join("\n")}

No article gives the size of any court. Three arenas are said to have had a rink shorter than the NHL's with no figure (the Chicago Stadium, Buffalo's Memorial Auditorium and the Cow Palace); they are drawn at the NHL's size, and the description of the drawing says so. The size of a rink changes with the year: \`drawKyogijo({ sport: "nhl", arena: "matthews-arena", year: 1926 })\` is the 220 by 90 feet ice of the first years and \`year: 1972\` the 200 by 80 feet of the Whalers.

## Notes

${withNote.map((a) => `- \`${a.id}\`: ${a.note}`).join("\n")}

## Names

An arena has the name people used when the league played there and every other name it answers to, each with where it was read: \`name\` is the everyday name in English, \`nameJa\` in Japanese (with \`readingJa\` in kana where it has kanji), \`names\` the names it had for some years (\`arenaNameIn(arena, year)\` picks the one of a year), and \`aliases\` the others, \`{ name, lang, kind, from?, to?, source?, revision? }\` as for [grounds](./grounds.md#names). \`arenaByName(name)\` finds an arena by any of them in English or Japanese. Where the everyday name is not the title of the article cited (it is a name of the time the league played there, or the article's title carries a disambiguation) the article is an alias:

| Key | Everyday name | English article |
| --- | --- | --- |
${differ.map((a) => `| \`${a.id}\` | ${a.name} | ${a.en.title} |`).join("\n")}
`;
writeFileSync(new URL("../docs/arenas.md", import.meta.url), md);
console.log(`src/arenas.data.ts: ${arenas.length} arenas (${current.length} current, ${withRink.length} with a rink of their own); docs/arenas.md`);
