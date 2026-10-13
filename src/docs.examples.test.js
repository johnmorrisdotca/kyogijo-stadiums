// Every example in the README and in every page of docs/ held to the code: each fenced `ts` and `js` block is written to its own file, run against the
// source of this checkout (the package's name is the source's files here), and what it prints is compared with the comment lines that follow each
// `console.log`: `// true true`, or the several lines of a longer output. A block flagged `no-run` (it needs a browser or a server) or `no-check` (an
// excerpt) is left to `pnpm test:readme`, which type-checks it against the built package. Plain JavaScript, so that reading files needs no Node types.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { format } from "node:util";
import { afterAll, describe, expect, it, vi } from "vitest";

import { blocksOf, matched } from "../scripts/docs-examples.mjs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const work = resolve(".cache", "docs-examples");
mkdirSync(work, { recursive: true });
afterAll(() => rmSync(work, { recursive: true, force: true }));

/** The package's names for its entry points, and the source file each is made from in this checkout. */
const sources = Object.fromEntries(
  Object.entries(pkg.exports).map(([key, entry]) => [key === "." ? pkg.name : `${pkg.name}/${key.slice(2)}`, resolve(entry.default.replace("./dist/", "src/").replace(/\.js$/, ".ts"))]),
);

const files = ["README.md", ...readdirSync("docs").filter((file) => file.endsWith(".md")).map((file) => `docs/${file}`)];
let counter = 0;

describe("the examples of the README and of every page of docs/", () => {
  it("are many: every page that has a ts block is in the list", () => {
    const withBlocks = files.filter((file) => blocksOf(readFileSync(file, "utf8")).length > 0);
    for (const file of ["README.md", "docs/getting-started.md", "docs/surfaces.md", "docs/score.md", "docs/soccer.md", "docs/ballparks.md", "docs/units.md", "docs/frames.md", "docs/layers.md", "docs/charts.md", "docs/eras.md", "docs/atlas.md", "docs/theming.md"]) expect(withBlocks, file).toContain(file);
  });

  it("has an example for each of the five charts and for what a chart gives back", () => {
    const blocks = blocksOf(readFileSync("docs/charts.md", "utf8"));
    expect(blocks.length).toBeGreaterThanOrEqual(6);
    for (const name of ["nbaShotChart", "nhlShotMap", "mlbSprayChart", "nflPassChart", "soccerShotMap"]) expect(blocks.some((block) => block.body.includes(`${name}(`)), name).toBe(true);
  });

  for (const file of files) {
    const blocks = blocksOf(readFileSync(file, "utf8"));
    if (blocks.length === 0) continue;
    describe(file, () => {
      for (const block of blocks) {
        it(`runs the example at line ${block.line}${block.expected.length > 0 ? " and prints what its comment says" : ""}`, async () => {
          let code = block.body;
          for (const [name, source] of Object.entries(sources).sort((a, b) => b[0].length - a[0].length)) code = code.replaceAll(`"${name}"`, JSON.stringify(source));
          counter += 1;
          const path = join(work, `block-${counter}.${block.language === "ts" ? "ts" : "mjs"}`);
          writeFileSync(path, `${code}\nexport {};\n`);
          const printed = [];
          const spy = vi.spyOn(globalThis.console, "log").mockImplementation((...args) => {
            printed.push(format(...args));
          });
          try {
            await import(/* @vite-ignore */ pathToFileURL(path).href);
          } finally {
            spy.mockRestore();
          }
          if (block.expected.length > 0) {
            const lines = printed.join("\n").split("\n");
            expect(matched(block.expected, lines), `what the example prints, and the comment lines that say so`).toEqual(lines);
          }
        });
      }
    });
  }
});
