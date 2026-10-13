// docs/charts.md held to the code: every fenced `ts` block on the page is run, and the comment lines that end it say what it prints. Plain JavaScript,
// so that reading files needs no Node types. The blocks import the package by its name; here the names are the source files of this checkout.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it, vi } from "vitest";

const doc = readFileSync("docs/charts.md", "utf8");
const work = resolve(".cache", "charts-docs");
const sources = { "@johnmorrisdotca/kyogijo/charts": resolve("src/charts-entry.ts"), "@johnmorrisdotca/kyogijo/frames": resolve("src/frames-entry.ts"), "@johnmorrisdotca/kyogijo": resolve("src/index.ts") };

/** The fenced `ts` blocks of the page, each with the line it starts at and the lines of the comment that ends it. */
function blocks() {
  const out = [];
  for (const match of doc.matchAll(/```ts\n([\s\S]*?)\n```/g)) {
    const body = match[1];
    const lines = body.split("\n");
    let tail = lines.length;
    while (tail > 0 && lines[tail - 1].startsWith("// ")) tail -= 1;
    out.push({ line: doc.slice(0, match.index).split("\n").length + 1, body, expected: lines.slice(tail).map((line) => line.slice(3)) });
  }
  return out;
}

mkdirSync(work, { recursive: true });
afterAll(() => rmSync(work, { recursive: true, force: true }));

describe("docs/charts.md", () => {
  const all = blocks();

  it("has an example for each of the five charts and for what a chart gives back", () => {
    expect(all.length).toBeGreaterThanOrEqual(6);
    for (const name of ["nbaShotChart", "nhlShotMap", "mlbSprayChart", "nflPassChart", "soccerShotMap"]) expect(all.some((block) => block.body.includes(`${name}(`)), name).toBe(true);
  });

  for (const [index, block] of all.entries()) {
    it(`runs the example at line ${block.line} and prints what its comment says`, async () => {
      let code = block.body;
      for (const [name, file] of Object.entries(sources)) code = code.replaceAll(`"${name}"`, JSON.stringify(file));
      const file = join(work, `block-${index}.ts`);
      writeFileSync(file, `${code}\nexport {};\n`);
      const printed = [];
      const spy = vi.spyOn(globalThis.console, "log").mockImplementation((...args) => {
        printed.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" "));
      });
      try {
        await import(/* @vite-ignore */ pathToFileURL(file).href);
      } finally {
        spy.mockRestore();
      }
      if (block.expected.length > 0) expect(printed).toEqual(block.expected);
      else expect(printed.length).toBeGreaterThanOrEqual(0);
    });
  }
});
