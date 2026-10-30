// Writes src/grounds.data.ts, docs/grounds.md and docs/grounds.ja.md from scripts/grounds.data.json and scripts/grounds.editions.json.
//
// The grounds are listed by hand, as the parks are: a fact (a name, a place, a year, a capacity, a pitch's length and width) is
// read from the English Wikipedia article of each ground at the revision the entry names (and the Japanese article for the name in
// Japanese), its Wikidata item is the one that article is linked to (checked against the item's labels by scripts/check-grounds.mjs),
// and its coordinates are Wikidata's (P625, CC0). No text, table or picture of the articles is copied. The editions file lists, for
// each World Cup, the grounds of this list that staged matches and where the final was played, read from the venue section of the
// tournament's article at the revision it names; the tournaments of each ground are made from it. FIFA's own pages are not used. The names: `name` is the everyday
// name in English, `nameJa` in Japanese (with `readingJa` in kana where it has kanji), `localName` the everyday name in the language of the place, `names` the names
// the ground had for some years, and `aliases` every other name with where it was read; scripts/fetch-names.mjs writes the evidence (Wikidata, CC0) in scripts/names.wikidata.json
// and scripts/names-lib.mjs holds each entry to the rules of docs/grounds.md ("Names").
// See docs/references.md and NOTICE.md.
import { readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";
import { checkNames } from "./names-lib.mjs";
import { writeVenueFiles } from "./venue-files.mjs";

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
  checkNames(g, fail);
  if (!(typeof g.lat === "number" && g.lat >= -90 && g.lat <= 90 && typeof g.lon === "number" && g.lon >= -180 && g.lon <= 180)) fail(`${g.id}: the coordinates are out of range`);
  if (!["current", "past"].includes(g.status)) fail(`${g.id}: status ${g.status}`);
  if (g.from !== undefined && !isYear(g.from)) fail(`${g.id}: from`);
  if (g.to !== undefined && !(isYear(g.to) && g.from !== undefined && g.from <= g.to)) fail(`${g.id}: to`);
  if (g.status === "past" && g.to === undefined) fail(`${g.id}: a past ground gives the year it closed`);
  if (g.status === "current" && g.to !== undefined) fail(`${g.id}: a current ground has no closing year`);
  if (g.capacity !== undefined && !(Number.isInteger(g.capacity) && g.capacity > 1000 && g.capacity < 200000)) fail(`${g.id}: capacity`);
  // A running track round the pitch, where Wikidata (property P641, sport) lists athletics for the ground: drawn by the athletics stadium (`sport: "athletics"`, `ground`).
  if (g.track !== undefined && (g.track !== true || typeof g.trackSource !== "string" || g.trackSource === "")) fail(`${g.id}: track is true and says where it was read`);
  if (g.trackSource !== undefined && g.track !== true) fail(`${g.id}: trackSource without track`);
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
const field = (key, value) => `    "${key}": ${(key === "names" || key === "tournaments" || key === "aliases") && value.length > 0 ? `[\n${value.map((v) => `      ${line(v)}`).join(",\n")}\n    ]` : line(value)}`;
const KEYS = ["id", "wikidata", "track", "trackSource", "name", "names", "nameJa", "readingJa", "localName", "localLanguage", "aliases", "city", "country", "lat", "lon", "status", "from", "to", "capacity", "pitchSize", "pitch", "pitchNote", "note", "en", "ja", "tournaments"];
const entry = (g) => {
  for (const key of Object.keys(g)) if (!KEYS.includes(key)) fail(`${g.id}: unknown field ${key}`);
  return `  {\n${KEYS.filter((key) => g[key] !== undefined && !(key === "names" && g[key].length === 0)).map((key) => field(key, g[key])).join(",\n")},\n  }`;
};
const text = `// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand.
// The facts are those of the articles each entry cites; see docs/references.md.
import type { GroundData } from "./grounds.core.ts";

export const GROUND_DATA: GroundData[] = [
${data.map(entry).join(",\n")},
];
`;
writeFileSync(new URL("../src/grounds.data.ts", import.meta.url), text);
writeVenueFiles({ kind: "grounds", type: "GroundData", constant: "GROUND", index: "GROUND_INDEX", records: data, text: entry, by: "scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json" });

// docs/grounds.md: every ground, for people.
const COUNTRY = { UY: "Uruguay", IT: "Italy", FR: "France", BR: "Brazil", CH: "Switzerland", SE: "Sweden", CL: "Chile", GB: "United Kingdom", MX: "Mexico", DE: "Germany", AR: "Argentina", ES: "Spain", US: "United States", JP: "Japan", ZA: "South Africa", RU: "Russia", QA: "Qatar", CA: "Canada", CN: "China", AU: "Australia", PT: "Portugal", KR: "South Korea", NL: "Netherlands" };
const cup = (t) => `${t.competition === "world-cup" ? "WC" : "WWC"} ${t.year}${t.final ? " (final)" : ""}`;
const size = (g) => (g.pitchSize === "published" ? `${g.pitch.length} × ${g.pitch.width} ${g.pitch.unit}` : "default, 105 × 68 m");
const years = (g) => (g.status === "past" ? `${g.from}–${g.to}` : g.from === undefined ? "" : `${g.from}–`);
const CJK = /[\u3040-\u30ff\u3400-\u9fff]/u;
// The English page shows a local name in Latin or Cyrillic letters; a name in Japanese or Chinese characters is on the Japanese page.
const name = (g) => (g.localName !== undefined && g.localName !== g.name && !CJK.test(g.localName) ? `${g.name} (${g.localName})` : g.name);
const fixed = grounds.filter((g) => g.pitchSize === "default");
const official = (g, lang) => g.aliases?.find((a) => a.kind === "official" && a.lang === lang && a.to === undefined)?.name ?? "";
const differ = data.filter((g) => g.name !== g.en.title);
const differJa = data.filter((g) => g.nameJa !== g.ja.title);
const md = `# The grounds

[日本語](grounds.ja.md) · English

Made by \`pnpm grounds\` from \`scripts/grounds.data.json\` and \`scripts/grounds.editions.json\`; do not edit by hand. ${grounds.length} grounds, ${
  grounds.length - fixed.length
} with a published pitch size and ${fixed.length} drawn at the default 105 by 68 m. Every figure is a fact read from the English Wikipedia article named in [NOTICE.md](../NOTICE.md) at the revision named there (the pitch from its infobox), the coordinates are Wikidata's (CC0), and the tournaments are read from the venue sections of the tournaments' articles, also listed there. Each ground in \`GROUNDS\` has its city and country, its Wikidata item and coordinates, the names it had with their years (\`year\` picks one: \`groundNameIn\`), its name in the place's language and in Japanese, the years it was open, its capacity, the World Cups it staged and the article and revision each fact was read from. \`drawKyogijo({ sport: "soccer", ground })\` draws the pitch at the size in the Pitch column. \`WC\` is the men's World Cup, \`WWC\` the Women's; only the grounds of this list are named, so a tournament's other venues are not here.

| Key | Ground | City | Wikidata | Open | Capacity | Pitch | Tournaments |
| --- | --- | --- | --- | --- | --- | --- | --- |
${data
  .map((g) => `| \`${g.id}\` | ${name(g)} | ${g.city}, ${COUNTRY[g.country] ?? g.country} | ${g.wikidata} | ${years(g)} | ${g.capacity?.toLocaleString("en-US") ?? ""} | ${size(g)} | ${g.tournaments.map(cup).join(", ")} |`)
  .join("\n")}

## Names

A ground has the name people use and every other name it answers to, each with where it was read.

- \`name\` is the **everyday name in English**, the one English sports media use (\`Groupama Stadium\`, \`San Siro\`, \`Etihad Stadium\`), with the current sponsor's name where that is what people say. It is not always the title of the article that was cited: that title is an alias.
- \`nameJa\` is the **everyday name in Japanese**, as Japanese media say it (\`日産スタジアム\`, \`サン・シーロ\`, \`マラカナン\`), and \`readingJa\` its reading in kana wherever it has kanji (\`にっさんスタジアム\`).
- \`localName\` and \`localLanguage\` are the everyday name in the language of the place (\`San Siro\`, \`it\`; \`Maracanã\`, \`pt\`; a ground of an English-speaking place has none).
- \`names\` are the names the ground had for some years, as before; \`groundNameIn(ground, year)\` picks the one of a year, and the everyday name follows them where one covers the year.
- \`aliases\` are the others, \`{ name, lang, kind, from?, to?, source?, revision? }\`. \`kind\` is \`wikipedia\` (the title of a cited article, with its \`revision\`: no citation is lost), \`official\` (what the owner or operator calls it, when that is not the everyday name), \`sponsor\` (a naming-rights name), \`former\` or \`nickname\`; \`from\` and \`to\` are the years a source gives, and \`source\` says where the name was read (an article and its revision, or a Wikidata item and property).
- \`groundByName(name)\` (and \`groundsByName\`, the others that answer too) finds a ground by any of these names, in English, Japanese or the place's language, ignoring case, accents, spaces and punctuation, full-width and half-width, hiragana and katakana and the long vowel mark: \`groundByName("サンシーロ")\` and \`groundByName("Meazza Stadium")\` are both \`san-siro\`. The atlas search reads them too.
- A drawing is titled with the everyday name in its language and, where the official name is another, says so in its description (\`Its official name is Parc Olympique Lyonnais.\`, \`正式名称はパルク・オリンピック・リヨンです。\`).

Where the everyday name is not the title of the article that was cited (names that are not in this table are the titles):

| Key | Everyday name | English article | Official name |
| --- | --- | --- | --- |
${differ.map((g) => `| \`${g.id}\` | ${g.name} | ${g.en.title} | ${official(g, "en")} |`).join("\n")}

The same table for the names in Japanese, with the readings, is in [Japanese](./grounds.ja.md#名前).

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

// docs/grounds.ja.md: the same list in Japanese, from the same data.
const COUNTRY_JA = { UY: "ウルグアイ", IT: "イタリア", FR: "フランス", BR: "ブラジル", CH: "スイス", SE: "スウェーデン", CL: "チリ", GB: "イギリス", MX: "メキシコ", DE: "ドイツ", AR: "アルゼンチン", ES: "スペイン", US: "アメリカ合衆国", JP: "日本", ZA: "南アフリカ", RU: "ロシア", QA: "カタール", CA: "カナダ", CN: "中国", AU: "オーストラリア", PT: "ポルトガル", KR: "韓国", NL: "オランダ" };
const cupJa = (t) => `${t.competition === "world-cup" ? "男子W杯" : "女子W杯"} ${t.year}${t.final ? "（決勝）" : ""}`;
const sizeJa = (g) => (g.pitchSize === "published" ? `${g.pitch.length} × ${g.pitch.width} ${g.pitch.unit}` : "既定 105 × 68 m");
const yearsJa = (g) => years(g).replace("–", "〜");
const mdJa = `# 競技場（サッカー）

日本語 · [English](grounds.md)

\`pnpm grounds\` が \`scripts/grounds.data.json\` と \`scripts/grounds.editions.json\` から作るページです。手で書き換えないでください。${grounds.length}か所のサッカー競技場のうち、ピッチの大きさが公表されているものが ${grounds.length - fixed.length}、既定の 105 × 68 m で描くものが ${fixed.length} です。数値や事実はすべて、[NOTICE.md](../NOTICE.md) に挙げた英語版ウィキペディアの記事を、そこに書いた版で読み取ったもの（ピッチは記事の基本情報欄から）で、座標は Wikidata（CC0）のものです。大会は、各大会の記事の会場の節から読み取りました。\`GROUNDS\` の各競技場には、国、Wikidata の項目と座標、年ごとの名前（\`year\` で選べます：\`groundNameIn\`）、その土地の言語での名前と日本語の名前、開場していた年、収容人数、開催したワールドカップ、それぞれの事実を読み取った記事とその版が付いています。\`drawKyogijo({ sport: "soccer", ground })\` は、「ピッチ」の列の大きさでピッチを描きます。「大会」の列の「男子W杯」は男子ワールドカップ、「女子W杯」は女子ワールドカップです。この一覧にある競技場だけを載せているので、大会のほかの会場は載っていません。

| キー | 競技場 | 国 | Wikidata | 開場 | 収容人数 | ピッチ | 大会 |
| --- | --- | --- | --- | --- | --- | --- | --- |
${data
  .map((g) => `| \`${g.id}\` | ${g.nameJa} | ${COUNTRY_JA[g.country] ?? g.country} | ${g.wikidata} | ${yearsJa(g)} | ${g.capacity?.toLocaleString("en-US") ?? ""} | ${sizeJa(g)} | ${g.tournaments.map(cupJa).join("、")} |`)
  .join("\n")}

## 名前

競技場には、人びとが使う名前と、それ以外に呼ばれるすべての名前があり、どれにも、その名前を読み取った出典が付いています。

- \`name\` は**英語の通称**で、英語のスポーツメディアが使う名前です（\`Groupama Stadium\`、\`San Siro\`、\`Etihad Stadium\`）。企業名が付いていて、人びとがその名で呼ぶ場合は、現在の企業名を採ります。引用した記事の題名と同じとはかぎらず、その題名は別名（alias）になります。
- \`nameJa\` は**日本語の通称**で、日本のメディアが使う名前です（\`日産スタジアム\`、\`サン・シーロ\`、\`マラカナン\`）。\`readingJa\` は、漢字を含む名前の読み（かな）です（\`にっさんスタジアム\`）。
- \`localName\` と \`localLanguage\` は、その土地の言語での通称です（\`San Siro\` と \`it\`、\`Maracanã\` と \`pt\`）。英語圏の競技場にはありません。
- \`names\` は、何年かのあいだ使われた名前です。\`groundNameIn(ground, year)\` は、その年の名前を返します。その年を含む \`names\` があれば、通称もそれに従います。
- \`aliases\` はそれ以外の名前で、\`{ name, lang, kind, from?, to?, source?, revision? }\` の形をしています。\`kind\` は \`wikipedia\`（引用した記事の題名。\`revision\` が付くので出典は失われません）、\`official\`（所有者や運営者が呼ぶ名前で、通称と違うもの）、\`sponsor\`（命名権による名前）、\`former\`、\`nickname\` のいずれかです。\`from\` と \`to\` は出典が示す年で、\`source\` は名前を読み取った場所（記事とその版、または Wikidata の項目とプロパティ）を示します。
- \`groundByName(name)\`（と、名前に当てはまるほかの競技場も返す \`groundsByName\`）は、これらのどの名前でも、英語・日本語・その土地の言語で競技場を探します。大文字小文字、アクセント、空白と記号、全角と半角、ひらがなとカタカナ、長音符の違いは区別しません。\`groundByName("サンシーロ")\` と \`groundByName("Meazza Stadium")\` は、どちらも \`san-siro\` です。地図の検索もこれらの名前を読みます。
- 図のタイトルは、その言語での通称です。正式名称が別にある場合は、説明文でそう伝えます（\`正式名称はパルク・オリンピック・リヨンです。\`）。

日本語の通称が、引用した日本語版の記事の題名と違う競技場です（この表にない競技場は、記事の題名が通称です）。

| キー | 通称 | 読み | 日本語版の記事 | 正式名称 |
| --- | --- | --- | --- | --- |
${differJa.map((g) => `| \`${g.id}\` | ${g.nameJa} | ${g.readingJa ?? ""} | ${g.ja.title} | ${official(g, "ja")} |`).join("\n")}

## 既定の大きさの競技場

サッカーのピッチの大きさが記事に載っていない競技場（または、国際試合のピッチにはなりえない大きさのもの）は、国際試合の 105 × 68 m で描き、\`pitchSize: "default"\` と記します。大きさを推測することはありません。理由は[英語版](grounds.md#grounds-at-the-default-size)に書いてあります。

${fixed.map((g) => `- \`${g.id}\`、${g.nameJa}`).join("\n")}

## ワールドカップ

| 大会 | 決勝 | この一覧にある会場 |
| --- | --- | --- |
${[...editions]
  .sort(order)
  .map((e) => `| ${e.competition === "world-cup" ? "男子" : "女子"} ${e.year} | ${e.final === null ? "なし（決勝リーグ）" : grounds.find((g) => g.id === e.final).nameJa} | ${e.grounds.map((id) => grounds.find((g) => g.id === id).nameJa).join("、")} |`)
  .join("\n")}
`;
writeFileSync(new URL("../docs/grounds.ja.md", import.meta.url), mdJa);

console.log(`src/grounds.data.ts: ${grounds.length} grounds, ${editions.length} tournaments; docs/grounds.md, docs/grounds.ja.md`);
