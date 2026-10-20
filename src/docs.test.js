// The documents and the demo, held to the source. Plain JavaScript, so that reading files needs no Node types.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { describe, expect, it } from "vitest";

import { ERA_SPORTS, eraChanges, eraStates } from "./eras.ts";
import { FORMATIONS, POSITION_NAMES } from "./formations.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { EVENT_IDS, EVENTS } from "./events.ts";
import { ARENA_IDS, ARENAS } from "./arenas.ts";
import { GROUND_IDS, GROUNDS, groundsHosting } from "./grounds.ts";
import { LEAGUES, LEAGUE_SOURCES, leagueChanges, leagueFigures } from "./leagues.ts";
import { PARK_IDS, PARKS } from "./parks.ts";
import { VERSION } from "./version.ts";
import { WORDS } from "../demo/words.js";
import { DOCS_WORDS, NAV, readPages } from "../scripts/docs-pages.mjs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

const rows = (words) => Object.entries(words).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : Object.entries(value).map(([inner, text]) => [`${key}.${inner}`, text])));

/** docs/strings-ja.md: every word of the package beside its English, made from the source. */
function stringsDocument() {
  const lines = [
    "# The Japanese of Kyogijo",
    "",
    "Made from `src/strings.ts` and `demo/words.js` by `pnpm docs:make`; a test holds this file to them. The Japanese has not yet been read by a native reader: a correction is welcome as a *Fix a translation* issue.",
    "",
    "## The drawing's words (`KYOGIJO_STRINGS`)",
    "",
    "| Key | English | 日本語 |",
    "| --- | --- | --- |",
  ];
  const flat = (words, prefix = "") => Object.entries(words).flatMap(([key, value]) => (typeof value === "string" ? [[`${prefix}${key}`, value]] : flat(value, `${prefix}${key}.`)));
  const en = Object.fromEntries(flat(KYOGIJO_STRINGS.en));
  const ja = Object.fromEntries(flat(KYOGIJO_STRINGS.ja));
  for (const key of Object.keys(en)) lines.push(`| \`${key}\` | ${en[key].replace(/\|/g, "\\|")} | ${ja[key].replace(/\|/g, "\\|")} |`);
  lines.push("", "## The demo's words (`WORDS`)", "", "| Key | English | 日本語 |", "| --- | --- | --- |");
  for (const key of Object.keys(WORDS.en)) lines.push(`| \`${key}\` | ${WORDS.en[key].replace(/\|/g, "\\|")} | ${WORDS.ja[key].replace(/\|/g, "\\|")} |`);
  const docsWords = (words) => Object.entries(words).filter(([, text]) => text !== "");
  lines.push("", "## The docs site's words (`DOCS_WORDS`)", "", "| Key | English | 日本語 |", "| --- | --- | --- |");
  for (const [key, text] of docsWords(DOCS_WORDS.en)) lines.push(`| \`${key}\` | ${text.replace(/\|/g, "\\|")} | ${DOCS_WORDS.ja[key].replace(/\|/g, "\\|")} |`);
  const titles = Object.fromEntries(readPages().map((page) => [page.slug, page.headings.find((heading) => heading.depth === 1).text]));
  lines.push("", "## The docs site's contents (`NAV`)", "", "| Group or page | English | 日本語 |", "| --- | --- | --- |");
  for (const group of NAV) {
    lines.push(`| group \`${group.id}\` | ${group.en} | ${group.ja} |`);
    for (const page of group.pages) lines.push(`| page \`${page.slug}\` | ${page.en ?? titles[page.slug]} | ${page.ja} |`);
  }
  lines.push("", "## The surfaces through the years (`eraChanges`)", "", "| Change | English | 日本語 |", "| --- | --- | --- |");
  for (const sport of ERA_SPORTS) for (const change of [...eraStates(sport), ...eraChanges(sport)]) lines.push(`| \`${change.id}\` | ${change.what.replace(/\|/g, "\\|")} | ${change.ja.replace(/\|/g, "\\|")} |`);
  lines.push("", "## The leagues (`LEAGUES`)", "", "| League | English | 日本語 |", "| --- | --- | --- |");
  for (const sport of ["nba", "nhl", "nfl", "mlb", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"]) for (const league of LEAGUES[sport]) if (!league.builtIn) lines.push(`| \`${league.id}\` | ${league.name.en} | ${league.name.ja} |`);
  lines.push("", "## The leagues' dated changes (`leagueChanges`)", "", "| Change | English | 日本語 |", "| --- | --- | --- |");
  for (const sport of ["nba", "nhl", "nfl", "mlb", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"]) for (const league of LEAGUES[sport]) if (!league.builtIn) for (const change of leagueChanges(sport, league.id)) lines.push(`| \`${change.id}\` | ${change.what.replace(/\|/g, "\\|")} | ${change.ja.replace(/\|/g, "\\|")} |`);
  lines.push("", "## The parks' Japanese names", "", "| Key | English | 日本語 | Team |", "| --- | --- | --- | --- |");
  for (const id of PARK_IDS) if (PARKS[id].nameJa) lines.push(`| \`${id}\` | ${PARKS[id].name} | ${PARKS[id].nameJa} | ${PARKS[id].teamJa ?? ""} |`);
  lines.push("", "## The grounds' Japanese names", "", "| Key | English | 日本語 | Name in the place's language |", "| --- | --- | --- | --- |");
  for (const id of GROUND_IDS) lines.push(`| \`${id}\` | ${GROUNDS[id].name} | ${GROUNDS[id].nameJa} | ${GROUNDS[id].localName ?? ""} |`);
  lines.push("", "## The special games (`EVENTS`)", "", "| Game | English | 日本語 | Venue, English | Venue, 日本語 |", "| --- | --- | --- | --- | --- |");
  for (const id of EVENT_IDS) lines.push(`| \`${id}\` | ${EVENTS[id].name.en} | ${EVENTS[id].name.ja} | ${EVENTS[id].venue.en} | ${EVENTS[id].venue.ja} |`);
  lines.push("", "## What the special games say of where their surface stands", "", "| Game | English | 日本語 |", "| --- | --- | --- |");
  for (const id of EVENT_IDS) {
    const { basis, note } = EVENTS[id];
    if (basis.kind === "published") lines.push(`| \`${id}\` | ${basis.note.en.replace(/\|/g, "\\|")} | ${basis.note.ja.replace(/\|/g, "\\|")} |`);
    if (note !== undefined) lines.push(`| \`${id}\` (note) | ${note.en.replace(/\|/g, "\\|")} | ${note.ja.replace(/\|/g, "\\|")} |`);
  }
  lines.push("", "## The formations (`FORMATIONS`)", "", "| Formation | English | 日本語 |", "| --- | --- | --- |");
  for (const f of Object.values(FORMATIONS)) lines.push(`| \`${f.id}\` | ${f.name.en.replace(/\|/g, "\\|")}. ${f.about.en.replace(/\|/g, "\\|")} | ${f.name.ja.replace(/\|/g, "\\|")}。${f.about.ja.replace(/\|/g, "\\|")} |`);
  lines.push("", "## The positions' names (`POSITION_NAMES`)", "", "| Position | English | 日本語 |", "| --- | --- | --- |");
  for (const [sport, names] of Object.entries(POSITION_NAMES)) for (const [id, name] of Object.entries(names)) lines.push(`| \`${sport}.${id}\` | ${name.en} | ${name.ja} |`);
  return `${lines.join("\n")}\n`;
}

const FAMILY_TITLES = { basketball: ["Basketball", "nba"], hockey: ["Ice hockey", "nhl"], football: ["Football", "nfl"], baseball: ["Baseball and softball", "mlb"], curling: ["Curling", "curling"], tennis: ["Tennis", "tennis"], volleyball: ["Volleyball, beach volleyball and sitting volleyball", "volleyball"], badminton: ["Badminton", "badminton"], pickleball: ["Pickleball", "pickleball"], tabletennis: ["Table tennis", "tabletennis"], padel: ["Padel", "padel"], squash: ["Squash", "squash"], racquetball: ["Racquetball", "racquetball"], sepaktakraw: ["Sepak takraw", "sepaktakraw"], teqball: ["Teqball", "teqball"], roundnet: ["Roundnet", "roundnet"], netball: ["Netball", "netball"], lacrosse: ["Lacrosse", "lacrosse"], rugby: ["Rugby", "rugby"], afl: ["Australian football", "afl"], gaelic: ["Gaelic football and hurling", "gaelic"], cricket: ["Cricket", "cricket"], fieldhockey: ["Field hockey", "fieldhockey"], handball: ["Handball", "handball"], judo: ["Judo", "judo"], karate: ["Karate", "karate"], kendo: ["Kendo", "kendo"], sumo: ["Sumo", "sumo"], kyudo: ["Kyūdō", "kyudo"], dojo: ["Dojo mats", "dojo"], mma: ["The MMA cage", "mma"], boxing: ["The boxing ring", "boxing"] };

/** docs/variants.md: every league, its figures and its sources, made from the source. */
function variantsDocument() {
  const lines = [
    "# League variants",
    "",
    "[日本語](variants.ja.md) · English",
    "",
    "`league` in the options draws a surface as one league's rulebook marks it; `sport` names the family (`nba` for basketball, `nhl` for hockey, `nfl`, `cfl` or `ifaf` for football, `mlb` for baseball and softball, `curling` for a curling sheet, `tennis`, `volleyball`, `badminton`, `pickleball`, `tabletennis`, `padel`, `squash`, `racquetball`, `sepaktakraw`, `teqball`, `roundnet` and `netball` for the net, racket and court sports, `lacrosse`, `rugby`, `afl`, `gaelic`, `cricket`, `fieldhockey` and `handball` for the field sports). This page is made from `src/leagues/` by `pnpm docs:make`; a test holds it to them. Each figure is the rulebook's, in its own unit, and each league's sources, with the edition and the address read on 2026-10-13, are listed under its table. What a figure is and where it is ours is in [sources.md](./sources.md#league-variants); what could not be cited is in [references.md](./references.md#league-variants-not-drawn).",
    "",
    "A `year` draws a league's markings of that season only where a source dates a change (the history under each table); for any other league it is ignored, and the drawing is of the rulebook as it is now. The sport's own league (the NBA, the NHL, the NFL, the CFL, the IFAF, MLB, World Curling, the ITF, the FIVB's indoor court, the BWF, USA Pickleball, the ITTF, the FIP, World Squash's singles court, the IRF, the ISTAF, the FITEQ, the International Roundnet Federation and World Netball) keeps the history of [`year`](./eras.md).",
    "",
  ];
  for (const [title, sport] of Object.values(FAMILY_TITLES)) {
    lines.push(`## ${title}`, "", `\`sport: "${sport}"\``, "", "| `league` | Name | Key figures |", "| --- | --- | --- |");
    for (const league of LEAGUES[sport]) {
      const figures = leagueFigures(league).map(([k, v]) => `${k} ${v}`).join("; ");
      lines.push(`| \`${league.id}\`${league.builtIn ? " (the sport's own)" : ""} | ${league.name.en} | ${figures} |`);
    }
    lines.push("");
    const used = [...new Set(LEAGUES[sport].flatMap((league) => league.sources))];
    lines.push("Sources:", "");
    for (const id of used) {
      const source = LEAGUE_SOURCES[id];
      lines.push(`- \`${id}\`: ${source.title}, ${source.by}, ${source.edition}. <${source.url}>`);
    }
    const history = LEAGUES[sport].flatMap((league) => (league.builtIn ? [] : leagueChanges(sport, league.id)));
    if (history.length > 0) {
      lines.push("", "History a source dates:", "", "| Change | What changed |", "| --- | --- |");
      for (const change of history) lines.push(`| \`${change.id}\` | ${change.what} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

const FAMILY_TITLES_JA = { basketball: "バスケットボール", hockey: "アイスホッケー", football: "アメリカンフットボールとカナディアンフットボール", baseball: "野球とソフトボール", curling: "カーリング", tennis: "テニス", volleyball: "バレーボール、ビーチバレー、シッティングバレーボール", badminton: "バドミントン", pickleball: "ピックルボール", tabletennis: "卓球", padel: "パデル", squash: "スカッシュ", racquetball: "ラケットボール", sepaktakraw: "セパタクロー", teqball: "テックボール", roundnet: "ラウンドネット", netball: "ネットボール", lacrosse: "ラクロス", rugby: "ラグビー", afl: "オーストラリアンフットボール", gaelic: "ゲーリック・フットボールとハーリング", cricket: "クリケット", fieldhockey: "フィールドホッケー", handball: "ハンドボール", judo: "柔道", karate: "空手", kendo: "剣道", sumo: "相撲", kyudo: "弓道", dojo: "道場の畳", mma: "総合格闘技のケージ", boxing: "ボクシングのリング" };

/** docs/variants.ja.md: the leagues' Japanese names, their sources and their dated changes in Japanese, made from the same source. */
function variantsDocumentJa() {
  const lines = [
    "# リーグごとの違い",
    "",
    "日本語 · [English](variants.md)",
    "",
    "オプションの `league` は、あるリーグの規則書どおりに競技場を描きます。`sport` は競技の系統を指します（バスケットボールは `nba`、アイスホッケーは `nhl`、アメリカンフットボールとカナディアンフットボールは `nfl`・`cfl`・`ifaf`、野球とソフトボールは `mlb`、カーリングのシートは `curling`、ネット型・ラケット型などのコート競技は `tennis`・`volleyball`・`badminton`・`pickleball`・`tabletennis`・`padel`・`squash`・`racquetball`・`sepaktakraw`・`teqball`・`roundnet`・`netball`、フィールド球技は `lacrosse`・`rugby`・`afl`・`gaelic`・`cricket`・`fieldhockey`・`handball`）。このページは `src/leagues/` から `pnpm docs:make` で作られ、テストがそれとの一致を確かめます。各リーグの寸法（規則書の値を、規則書の単位で載せたもの）と出典の書名や版は、[英語版](variants.md)の表にあります。ここには、リーグの日本語名と、出典の URL（2026-10-13 に読み取ったもの）と、日付のわかる変更の日本語の説明を載せています。",
    "",
    "`year` は、出典が変更の日付を示している場合にかぎり、そのシーズンのリーグの描き方になります（各表の下の「日付のわかる変更」）。それ以外のリーグでは `year` は無視され、現在の規則書のとおりに描きます。その競技の標準のリーグ（NBA、NHL、NFL、CFL、IFAF、MLB、World Curling、ITF、FIVB の屋内コート、BWF、USA Pickleball、ITTF、FIP、World Squash のシングルスコート、IRF、ISTAF、FITEQ、International Roundnet Federation、World Netball）は、[`year`](./eras.md) で年ごとの変遷を描けます。",
    "",
  ];
  for (const [family, [, sport]] of Object.entries(FAMILY_TITLES)) {
    lines.push(`## ${FAMILY_TITLES_JA[family]}`, "", `\`sport: "${sport}"\``, "", "| `league` | 名前 |", "| --- | --- |");
    for (const league of LEAGUES[sport]) lines.push(`| \`${league.id}\`${league.builtIn ? "（その競技の標準）" : ""} | ${league.name.ja} |`);
    lines.push("");
    const used = [...new Set(LEAGUES[sport].flatMap((league) => league.sources))];
    lines.push("出典の URL：", "");
    for (const id of used) lines.push(`- \`${id}\`: <${LEAGUE_SOURCES[id].url}>`);
    const history = LEAGUES[sport].flatMap((league) => (league.builtIn ? [] : leagueChanges(sport, league.id)));
    if (history.length > 0) {
      lines.push("", "日付のわかる変更：", "", "| 変更 | 内容 |", "| --- | --- |");
      for (const change of history) lines.push(`| \`${change.id}\` | ${change.ja} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

describe("the words", () => {
  it("are in both languages, every key", () => {
    const shape = (words) => Object.entries(words).flatMap(([key, value]) => (typeof value === "string" ? [key] : Object.entries(value).flatMap(([a, b]) => (typeof b === "string" ? [`${key}.${a}`] : Object.keys(b).map((c) => `${key}.${a}.${c}`))))).sort();
    expect(shape(KYOGIJO_STRINGS.ja)).toEqual(shape(KYOGIJO_STRINGS.en));
    expect(Object.keys(WORDS.ja).sort()).toEqual(Object.keys(WORDS.en).sort());
    for (const language of ["en", "ja"]) for (const [key, text] of rows(WORDS[language])) expect(text, `${language} ${key}`).toMatch(/\S/);
  });

  it("have no Japanese text left in the English or English-only text in the Japanese of a sentence", () => {
    for (const [key, text] of rows(WORDS.en)) if (key !== "name") expect(text, key).not.toMatch(/[぀-ヿ一-鿿]/u);
    for (const key of ["pitch", "tryText", "embedText", "parksText", "courtText"]) expect(WORDS.ja[key], key).toMatch(/[぀-ヿ]/u);
  });

  it("are listed in docs/strings-ja.md, which is made from them", () => {
    const made = stringsDocument();
    if (process.env.UPDATE_DOCS === "1") writeFileSync("docs/strings-ja.md", made);
    expect(existsSync("docs/strings-ja.md"), "run `pnpm docs:make`").toBe(true);
    expect(readFileSync("docs/strings-ja.md", "utf8"), "docs/strings-ja.md is out of date: run `pnpm docs:make`").toBe(made);
  });
});

describe("the leagues", () => {
  for (const [file, make] of [["variants.md", variantsDocument], ["variants.ja.md", variantsDocumentJa]]) {
    it(`are listed in docs/${file}, which is made from them`, () => {
      const made = make();
      if (process.env.UPDATE_DOCS === "1") writeFileSync(`docs/${file}`, made);
      expect(existsSync(`docs/${file}`), "run `pnpm docs:make`").toBe(true);
      expect(readFileSync(`docs/${file}`, "utf8"), `docs/${file} is out of date: run \`pnpm docs:make\``).toBe(made);
    });
  }
});

describe("the package's own numbers", () => {
  it("name one version: package.json's, the source's", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("have a README that says what the code holds, and a limits page made from it: ninety-four parks, seven sports", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(PARK_IDS).toHaveLength(94);
    expect(readme).toContain("The 30 current MLB parks and 44 that MLB clubs have left");
    expect(readme).toContain("the 12 home parks");
    expect(readFileSync("docs/limits.md", "utf8")).toContain("| Ballparks | 94 (30 current MLB, 44 past MLB, 12 NPB home parks, 8 other NPB grounds) | `PARKS` |");
  });

  it("list every park's source in NOTICE.md", () => {
    const notice = readFileSync("NOTICE.md", "utf8");
    const noticeJa = readFileSync("NOTICE.ja.md", "utf8");
    for (const id of PARK_IDS) {
      const park = PARKS[id];
      expect(notice, id).toContain(`| ${park.name} |`);
      if (park.en) expect(notice, id).toContain(String(park.en.revision));
      if (park.ja) expect(noticeJa, id).toContain(`| ${park.wikidata} | ${park.ja.title}, ${park.ja.revision} |`);
    }
  });

  it("have a README that says what the grounds hold, and a docs/grounds.md made by the build that lists every one", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(GROUND_IDS).toHaveLength(64);
    expect(readme).toContain("64 soccer grounds");
    expect(readFileSync("docs/limits.md", "utf8")).toContain("| Grounds | 64 | `GROUNDS` |");
    const list = readFileSync("docs/grounds.md", "utf8");
    for (const id of GROUND_IDS) expect(list, id).toContain(`| \`${id}\` |`);
  });

  it("have grounds that are the file they are built from, and tournaments that are the editions' file", () => {
    const json = JSON.parse(readFileSync("scripts/grounds.data.json", "utf8"));
    expect(json.map((g) => g.id)).toEqual([...GROUND_IDS]);
    const editions = JSON.parse(readFileSync("scripts/grounds.editions.json", "utf8"));
    expect(editions).toHaveLength(32);
    for (const e of editions) {
      expect(e.article.revision).toBeGreaterThan(1000);
      expect(groundsHosting(e.competition, e.year).map((g) => g.id).sort()).toEqual([...e.grounds].sort());
    }
  });

  it("list every ground's sources in NOTICE.md, and every World Cup article the tournaments were read from", () => {
    const notice = readFileSync("NOTICE.md", "utf8");
    const noticeJa = readFileSync("NOTICE.ja.md", "utf8");
    for (const id of GROUND_IDS) {
      const ground = GROUNDS[id];
      expect(notice, id).toContain(`| ${ground.name} | ${ground.wikidata} |`);
      expect(notice, id).toContain(String(ground.en.revision));
      expect(noticeJa, id).toContain(`| ${ground.wikidata} | ${ground.ja.title}, ${ground.ja.revision} |`);
    }
    const editions = JSON.parse(readFileSync("scripts/grounds.editions.json", "utf8"));
    for (const e of editions) expect(notice, `${e.competition} ${e.year}`).toContain(`${e.article.title}, ${e.article.revision}`);
  });

  it("list every arena's sources in NOTICE.md", () => {
    const notice = readFileSync("NOTICE.md", "utf8");
    for (const id of ARENA_IDS) {
      const arena = ARENAS[id];
      expect(notice, id).toContain(`| ${arena.name} | ${arena.wikidata} | ${arena.en.title}, ${arena.en.revision} |`);
    }
  });

  it("have a help text for the demo's sport selector that names all the sports, in both languages", () => {
    const page = readFileSync("scripts/site.mjs", "utf8");
    const line = page.split("\n").find((text) => text.includes('seg("sport", "sport"')) ?? "";
    const en = ["football fields", "hockey rink", "basketball court", "baseball field", "soccer pitch", "curling sheet", "tennis", "volleyball", "badminton", "pickleball", "table tennis", "athletics", "ice skating", "padel", "squash", "racquetball", "sepak takraw", "teqball", "roundnet", "netball", "lacrosse", "rugby", "Australian football", "Gaelic", "cricket", "field hockey", "handball", "swimming", "water polo", "diving", "artistic swimming", "judo", "karate", "kendo", "sumo", "kyudo", "dojo", "mixed martial arts", "boxing"];
    const ja = ["アメリカンフットボール", "アイスホッケー", "バスケットボール", "野球", "サッカー", "カーリング", "テニス", "バレーボール", "バドミントン", "ピックルボール", "パデル", "スカッシュ", "ラケットボール", "セパタクロー", "テックボール", "ラウンドネット", "ネットボール", "卓球", "陸上競技", "スケート", "ラクロス", "ラグビー", "オーストラリアンフットボール", "ゲーリック", "クリケット", "フィールドホッケー", "ハンドボール", "競泳", "水球", "飛込", "アーティスティックスイミング", "柔道", "空手", "剣道", "相撲", "弓道", "道場", "総合格闘技", "ボクシング"];
    for (const word of en) expect(line, word).toContain(word);
    for (const word of ja) expect(line, word).toContain(word);
    // Twenty-seven-four-two sports on the selector, and each is in the words of the help.
    expect(WORDS.en).toHaveProperty("sport_handball");
    expect(Object.keys(WORDS.en).filter((key) => key.startsWith("sport_"))).toHaveLength(41);
  });

  it("have a sentence in docs/references.md for each reference John sent", () => {
    const refs = readFileSync("docs/references.md", "utf8");
    for (const link of ["athlyticz.substack.com", "athlyticz.com/demo/nfl-d3", "FieldDiagrams.pdf", "mlb_field_equations.py", "theringer.com", "nba.com/news/nba-debuts-in-season-tournament", "grantland.com"]) expect(refs, link).toContain(link);
  });
});
