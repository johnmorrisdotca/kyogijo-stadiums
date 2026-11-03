// `pnpm docs:check`, after a build: the documentation held to what it promises, in one command.
//
//   1. The guides (docs/guides/<name>.md, listed in GUIDES in docs-nav.mjs): at least ten, each with one `#` title, a Japanese twin in docs/guides/ja/ with the same blocks of code
//      in the same order, the two linking to each other in their first lines, every picture and link they name there, and the Japanese twin in Japanese.
//   2. The README: its sections, its code blocks and the pictures it shows (from docs/images), and a CHANGELOG whose every release has its date.
//   3. The tests that hold the pages: the contents, the links, the site built from them, the language of each page (src/docs.pages.test.js, src/docs-language.test.js,
//      src/docs.guides.test.js) and the examples of the README, the pages and the guides run against the source (src/docs.examples.test.js).
//   4. The examples run against the built package, as an installed one is used (`pnpm test:readme`, scripts/check-readme-examples.mjs).
//
// Every fault is listed with its file, and the exit code is 1 when there is one. It writes nothing.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { GUIDES } from "./docs-nav.mjs";
import { headingsOf } from "./docs-pages.mjs";
import { parts } from "./readme-lint.mjs";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");
const faults = [];
const fault = (file, text) => faults.push(`${file}: ${text}`);

/** The fenced blocks of a page as `{ language, console }`: the language of each, and how many `console.log` calls it makes. */
const blocksOf = (markdown) => parts(markdown).filter((part) => part.type === "code").map((part) => ({ language: part.info.split(/\s+/)[0], logs: (part.body.match(/console\.log\(/g) ?? []).length }));
/** Every address a Markdown text links or shows as a picture: `[text](address)` and `![alt](address)`. */
const addressesOf = (markdown) => [...markdown.replace(/^```[\s\S]*?^```/gm, "").matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((match) => match[1]);

// 1. The guides.
const MOST_GUIDES = 10;
if (GUIDES.length < MOST_GUIDES) fault("scripts/docs-nav.mjs", `${GUIDES.length} guides are listed; the family's standard is ${MOST_GUIDES} at least`);
const english = readdirSync(join(root, "docs/guides")).filter((name) => name.endsWith(".md")).sort();
const japanese = readdirSync(join(root, "docs/guides/ja")).filter((name) => name.endsWith(".md")).sort();
const listed = GUIDES.map((guide) => `${guide.name}.md`).sort();
for (const name of english) if (!listed.includes(name)) fault(`docs/guides/${name}`, "is not in GUIDES (scripts/docs-nav.mjs), so the site has no page for it");
for (const name of listed) {
  if (!english.includes(name)) fault(`docs/guides/${name}`, "is listed in GUIDES and is not there");
  if (!japanese.includes(name)) fault(`docs/guides/ja/${name}`, "is missing: every guide has a Japanese twin");
}
for (const name of japanese) if (!english.includes(name)) fault(`docs/guides/ja/${name}`, "has no English guide of the same name");
for (const name of english.filter((one) => japanese.includes(one))) {
  const en = read(`docs/guides/${name}`);
  const ja = read(`docs/guides/ja/${name}`);
  if (headingsOf(en).filter((heading) => heading.depth === 1).length !== 1) fault(`docs/guides/${name}`, "needs exactly one # heading, its title");
  if (headingsOf(ja).filter((heading) => heading.depth === 1).length !== 1) fault(`docs/guides/ja/${name}`, "needs exactly one # heading, its title");
  if (en.split(/\s+/).length < 350) fault(`docs/guides/${name}`, "is under 350 words: a guide is written for a developer, with what the code does and where it stops");
  if (!/\p{Script=Han}|\p{Script=Hiragana}/u.test(ja)) fault(`docs/guides/ja/${name}`, "has no Japanese in it");
  const a = blocksOf(en);
  const b = blocksOf(ja);
  if (JSON.stringify(a) !== JSON.stringify(b)) fault(`docs/guides/ja/${name}`, `has different blocks of code from the English guide (${a.map((one) => one.language).join(",")} against ${b.map((one) => one.language).join(",")}): the code is the same in both`);
  if (a.length < 2) fault(`docs/guides/${name}`, "has fewer than two blocks of code");
  for (const [file, text] of [[`docs/guides/${name}`, en], [`docs/guides/ja/${name}`, ja]]) {
    const folder = file.slice(0, file.lastIndexOf("/"));
    for (const address of addressesOf(text)) {
      if (/^(https?:|mailto:|#)/.test(address)) continue;
      const path = address.split("#")[0];
      if (path !== "" && !existsSync(join(root, folder, path))) fault(file, `links ${address}, which is not a file`);
    }
  }
}

// 2. The README and the changelog.
const readme = read("README.md");
const sections = [...readme.matchAll(/^## (.+)$/gm)].length;
const blocks = (readme.match(/^```/gm) ?? []).length / 2;
if (sections < 20) fault("README.md", `${sections} sections; the family's standard is 20 or more`);
if (blocks < 25) fault("README.md", `${blocks} blocks of code; the family's standard is 25 or more`);
const pictures = new Set([...readme.matchAll(/docs\/images\/([\w.-]+\.(?:webp|png|jpg|gif|svg))/g)].map((match) => match[1]));
for (const name of pictures) if (!existsSync(join(root, "docs/images", name))) fault("README.md", `shows docs/images/${name}, which is not a file`);
if (pictures.size < 16) fault("README.md", `shows ${pictures.size} pictures from docs/images; the family's standard is 16 or more`);
if (readme.length >= 64000) fault("README.md", `is ${readme.length} characters; npm keeps the first 64,000: move detail into the guides and link it`);
const changelog = read("CHANGELOG.md");
for (const heading of changelog.matchAll(/^## \[?(\d+\.\d+\.\d+)\]?(.*)$/gm)) if (!/^\]? ?[-–—] \d{4}-\d\d-\d\d$/.test(heading[2]) && !/^ [-–—] \d{4}-\d\d-\d\d$/.test(heading[2])) fault("CHANGELOG.md", `the release ${heading[1]} has no date (## X.Y.Z - YYYY-MM-DD)`);

// 3 and 4. The tests that hold the pages, and the examples against the built package.
if (faults.length > 0) {
  console.error(`${faults.length} fault${faults.length === 1 ? "" : "s"} in the documentation:\n${faults.map((one) => `  ${one}`).join("\n")}`);
  process.exit(1);
}
console.log(`ok   ${GUIDES.length} guides with their Japanese twins; the README has ${sections} sections, ${blocks} blocks of code and ${pictures.size} pictures`);
const run = (command, args, label) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`FAIL ${label}`);
    process.exit(result.status ?? 1);
  }
  console.log(`ok   ${label}`);
};
run("pnpm", ["exec", "vitest", "run", "src/docs.pages.test.js", "src/docs-language.test.js", "src/docs.guides.test.js", "src/docs.examples.test.js"], "the contents, the links, the site built from the pages, their language and their examples");
run(process.execPath, [join(root, "scripts/check-readme-examples.mjs")], "the examples of the README, the pages and the guides against the built package");
