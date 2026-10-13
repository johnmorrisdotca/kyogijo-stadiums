// The documents and the demo, held to the source. Plain JavaScript, so that reading files needs no Node types.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { describe, expect, it } from "vitest";

import { ERA_SPORTS, eraChanges, eraStates } from "./eras.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { PARK_IDS, PARKS } from "./parks.ts";
import { VERSION } from "./version.ts";
import { WORDS } from "../demo/words.js";

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
  const en = Object.fromEntries(Object.entries(KYOGIJO_STRINGS.en).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : Object.entries(value).flatMap(([a, b]) => (typeof b === "string" ? [[`${key}.${a}`, b]] : Object.entries(b).map(([c, d]) => [`${key}.${a}.${c}`, d]))))));
  const ja = Object.fromEntries(Object.entries(KYOGIJO_STRINGS.ja).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : Object.entries(value).flatMap(([a, b]) => (typeof b === "string" ? [[`${key}.${a}`, b]] : Object.entries(b).map(([c, d]) => [`${key}.${a}.${c}`, d]))))));
  for (const key of Object.keys(en)) lines.push(`| \`${key}\` | ${en[key].replace(/\|/g, "\\|")} | ${ja[key].replace(/\|/g, "\\|")} |`);
  lines.push("", "## The demo's words (`WORDS`)", "", "| Key | English | 日本語 |", "| --- | --- | --- |");
  for (const key of Object.keys(WORDS.en)) lines.push(`| \`${key}\` | ${WORDS.en[key].replace(/\|/g, "\\|")} | ${WORDS.ja[key].replace(/\|/g, "\\|")} |`);
  lines.push("", "## The surfaces through the years (`eraChanges`)", "", "| Change | English | 日本語 |", "| --- | --- | --- |");
  for (const sport of ERA_SPORTS) for (const change of [...eraStates(sport), ...eraChanges(sport)]) lines.push(`| \`${change.id}\` | ${change.what.replace(/\|/g, "\\|")} | ${change.ja.replace(/\|/g, "\\|")} |`);
  lines.push("", "## The parks' Japanese names", "", "| Key | English | 日本語 | Team |", "| --- | --- | --- | --- |");
  for (const id of PARK_IDS) if (PARKS[id].nameJa) lines.push(`| \`${id}\` | ${PARKS[id].name} | ${PARKS[id].nameJa} | ${PARKS[id].teamJa ?? ""} |`);
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

describe("the package's own numbers", () => {
  it("name one version: package.json's, the source's", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("have a README that says what the code holds: ninety-four parks, six sports", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(PARK_IDS).toHaveLength(94);
    expect(readme).toContain("The 30 current MLB parks and 44 that MLB clubs have left");
    expect(readme).toContain("the 12 home parks");
    expect(readme).toContain("| Ballparks | 94 (30 current MLB, 44 past MLB, 12 NPB home parks, 8 other NPB grounds) | `PARKS` |");
  });

  it("list every park's source in NOTICE.md", () => {
    const notice = readFileSync("NOTICE.md", "utf8");
    for (const id of PARK_IDS) {
      const park = PARKS[id];
      expect(notice, id).toContain(`| ${park.name} |`);
      for (const source of [park.en, park.ja]) if (source) expect(notice, id).toContain(String(source.revision));
    }
  });

  it("have a sentence in docs/references.md for each reference John sent", () => {
    const refs = readFileSync("docs/references.md", "utf8");
    for (const link of ["athlyticz.substack.com", "athlyticz.com/demo/nfl-d3", "FieldDiagrams.pdf", "mlb_field_equations.py", "theringer.com", "nba.com/news/nba-debuts-in-season-tournament", "grantland.com"]) expect(refs, link).toContain(link);
  });
});
