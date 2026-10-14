// The docs are single-language (CONTRIBUTING.md, "Docs pages are single-language"): an English page has no Japanese outside code, a Japanese page
// (`<name>.ja.md`) has no English prose outside code, and the two of a pair link to each other at the top. What is allowed to be otherwise is
// listed in ALLOWED, each with its reason; an entry that no longer applies fails, so the list cannot go stale.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";

/** @typedef {{ file: string, reason: string, both?: boolean, quoted?: string[], between?: [string, string] }} Allowed An exception to the rule. `both`: the page is about the translations themselves and may show both languages side by side. `quoted`: Japanese (or English, on a Japanese page) strings that are proper names or titles and stay as they are. `between`: a generated block, from one marker to the other, that is the family's own text. */

/** @type {Allowed[]} */
const ALLOWED = [
  {
    file: "README.md",
    between: ["<!-- family:start", "<!-- family:end -->"],
    reason: "The list of the family is made by scripts/family-readme.mjs from the family's own template, the same in every package; each sibling is listed with its own Japanese name, a proper noun.",
  },
  {
    file: "README.md",
    quoted: ["<sub>競技場</sub>", "(競技場)"],
    reason: "The package's own name in Japanese, in the title and in the note on the rename.",
  },
  {
    file: "README.md",
    between: ["## The name\n", "## Where it comes from"],
    reason: "The section that says what the package's name means: the Japanese words of the name are its subject.",
  },
  {
    file: "docs/strings-ja.md",
    both: true,
    reason: "The page is about the translations themselves: every word of the package and the demo, English beside Japanese, made from the source by pnpm docs:make.",
  },
  {
    file: "docs/terminology.md",
    both: true,
    reason: "The page is a terminology reference: the Japanese words of the rule books that the docs rest on, beside the English.",
  },
  {
    file: "NOTICE.md",
    quoted: ["大会運営ガイドブック2023", "相撲規則", "土俵規定", "第一条", "大相撲クイズ", "弓道競技運営要領", "施設のご案内", "日本武道館建物等概要"],
    reason: "Titles of Japanese-language rule books, guides and pages that the facts were read from, as their publishers print them; a title is a proper noun and is not translated.",
  },
  {
    file: "docs/sources.md",
    quoted: ["大会運営ガイドブック2023", "相撲規則", "土俵規定", "第一条", "大相撲クイズ", "弓道競技運営要領", "講道館", "施設のご案内", "所在地", "日本武道館建物等概要"],
    reason: "Titles of Japanese-language rule books, guides and pages that the dimensions were read from, as their publishers print them; a title is a proper noun and is not translated.",
  },
  {
    file: "docs/references.md",
    quoted: ["競技規則", "陸上競技場公認に関する細則", "室内陸上競技場公認に関する細則", "スピードスケート指導教本", "大会要項", "大会運営ガイドブック2023", "相撲規則", "弓道競技運営要領", "競技実施要項", "施設のご案内", "所在地", "日本武道館建物等概要", "畳", "旧武徳殿"],
    reason: "Titles of Japanese-language rule books, guides and pages that were read, as their publishers print them; a title is a proper noun and is not translated.",
  },
  {
    file: "docs/variants.md",
    quoted: ["大会運営ガイドブック2023", "畳", "試合場", "開始線と選手の位置", "公益財団法人全日本柔道連盟", "相撲規則", "土俵規定", "第一条", "笹川スポーツ財団", "高さ34から60センチ", "一辺6メートル70", "円の直径4メートル55", "二十俵", "日本相撲協会", "大相撲クイズ", "弓道競技運営要領", "運営マニュアル", "第6条", "射場の設営", "公益財団法人全日本弓道連盟", "平成28年4月1日改訂", "国民体育大会", "弓道競技実施要項", "競技種目", "近的競技", "射距離28m", "霞的", "標的の中心は安土敷より27cm", "傾斜5度", "遠的競技", "射距離60m", "得点的", "標的の中心は地上97cm", "傾斜15度", "和歌山県", "全日本弓道連盟"],
    reason: "The page is made from the leagues' sources, and the title of a Japanese-language source, with the words quoted from it for the figure, is as its publisher prints it; a title is a proper noun and is not translated.",
  },
];

const JAPANESE = /[\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;
/** Four Latin words in a row are English prose; a name of one to three words (`Dougu Sports`, `World Aquatics Rules`) is not. */
const ENGLISH_PROSE = /[A-Za-z][A-Za-z'’-]*(?:[ ,.;:!?]+[A-Za-z][A-Za-z'’-]*){3,}/;

const SKIP_DIRECTORIES = new Set(["node_modules", "dist", "site", "test-results", "playwright-report", ".git", ".github", ".readme-examples", "scripts"]);

/** The Markdown files whose language is held: the root's, and everything under docs/ and src/. */
function pages(directory = ".", out = []) {
  for (const name of readdirSync(directory)) {
    const path = directory === "." ? name : join(directory, name).split("\\").join("/");
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRECTORIES.has(name)) pages(path, out);
    } else if (name.endsWith(".md")) out.push(path);
  }
  return out;
}

/** The text a reader reads: without fenced code, code spans, comments, link addresses, bare addresses and tag attributes that are addresses. */
function proseOf(text, allowed) {
  let source = text.replace(/\r\n/g, "\n");
  for (const { between } of allowed) {
    if (!between) continue;
    const start = source.indexOf(between[0]);
    const end = source.indexOf(between[1], start);
    if (start >= 0 && end > start) source = source.slice(0, start) + source.slice(end + between[1].length);
  }
  for (const name of allowed.flatMap((entry) => entry.quoted ?? []).sort((x, y) => y.length - x.length)) source = source.split(name).join(" ");
  const lines = [];
  let fence = "";
  let comment = false;
  for (const raw of source.split("\n")) {
    const mark = /^\s*(```+|~~~+)/.exec(raw)?.[1];
    if (fence) {
      if (mark && mark[0] === fence[0] && mark.length >= fence.length) fence = "";
      lines.push("");
      continue;
    }
    if (mark) {
      fence = mark;
      lines.push("");
      continue;
    }
    let line = raw;
    if (comment) {
      const end = line.indexOf("-->");
      if (end < 0) {
        lines.push("");
        continue;
      }
      line = line.slice(end + 3);
      comment = false;
    }
    line = line.replace(/<!--.*?-->/g, "");
    if (line.includes("<!--")) {
      line = line.slice(0, line.indexOf("<!--"));
      comment = true;
    }
    line = line
      .replace(/\[日本語\]\([^)]*\.ja\.md\)/g, "")
      .replace(/(``+)[^]*?\1/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\]\([^)]*\)/g, "]")
      .replace(/\b(?:href|src|srcset|id|class|style)="[^"]*"/g, "")
      .replace(/https?:\/\/[^\s)>\]"]+/g, "")
      .replace(/<\/?[a-z][a-z0-9-]*/gi, "");
    lines.push(line);
  }
  return lines;
}

const all = pages();
const japanesePages = all.filter((file) => file.endsWith(".ja.md"));
const allowedOf = (file) => ALLOWED.filter((entry) => entry.file === file);

describe("the docs are single-language", () => {
  it("find the Markdown pages", () => {
    assert.ok(all.includes("README.md"), "the README is held");
  });

  it("have an English page with no Japanese outside code, except what ALLOWED names", () => {
    const found = [];
    for (const file of all) {
      if (file.endsWith(".ja.md")) continue;
      const allowed = allowedOf(file);
      if (allowed.some((entry) => entry.both)) continue;
      proseOf(readFileSync(file, "utf8"), allowed).forEach((line, index) => {
        if (JAPANESE.test(line)) found.push(`${file}:${index + 1}: ${line.trim().slice(0, 100)}`);
      });
    }
    assert.deepEqual(found, [], "Japanese in an English page: move it to the page's .ja.md twin, put it in a code span if it is an identifier, or add the page to ALLOWED with a reason");
  });

  it("have a Japanese page with no English prose outside code, except what ALLOWED names", () => {
    const found = [];
    for (const file of japanesePages) {
      const allowed = allowedOf(file);
      if (allowed.some((entry) => entry.both)) continue;
      proseOf(readFileSync(file, "utf8"), allowed).forEach((line, index) => {
        const prose = ENGLISH_PROSE.exec(line);
        if (prose) found.push(`${file}:${index + 1}: ${prose[0].slice(0, 80)}`);
      });
    }
    assert.deepEqual(found, [], "English prose in a Japanese page: write it in Japanese, or add it to ALLOWED with a reason");
  });

  it("link the two pages of a pair to each other, at the top", () => {
    const found = [];
    for (const file of japanesePages) {
      const twin = file.replace(/\.ja\.md$/, ".md");
      if (!existsSync(twin)) {
        found.push(`${file} has no English twin ${twin}`);
        continue;
      }
      const top = (path) => readFileSync(path, "utf8").split("\n").slice(0, 8).join("\n");
      const base = (path) => path.split("/").pop();
      if (!top(twin).includes(`(${base(file)})`) && !top(twin).includes(`(./${base(file)})`)) found.push(`${twin} does not link to ${base(file)} in its first lines`);
      if (!top(file).includes(`(${base(twin)})`) && !top(file).includes(`(./${base(twin)})`)) found.push(`${file} does not link to ${base(twin)} in its first lines`);
    }
    assert.deepEqual(found, []);
  });

  it("keep ALLOWED to what still applies", () => {
    const stale = [];
    for (const entry of ALLOWED) {
      assert.ok(entry.reason.length > 20, `${entry.file} gives a reason`);
      if (!existsSync(entry.file)) {
        stale.push(`${entry.file} does not exist`);
        continue;
      }
      const text = readFileSync(entry.file, "utf8");
      if (entry.both && !JAPANESE.test(text)) stale.push(`${entry.file} is allowed both languages but holds no Japanese`);
      for (const quoted of entry.quoted ?? []) if (!text.includes(quoted)) stale.push(`${entry.file} no longer holds "${quoted}"`);
      if (entry.between && !(text.includes(entry.between[0]) && text.includes(entry.between[1]))) stale.push(`${entry.file} no longer holds its generated block`);
    }
    assert.deepEqual(stale, []);
  });
});
