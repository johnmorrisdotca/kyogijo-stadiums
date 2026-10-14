// The parts of docs/*.md that are made from the source (the table of frames, of units and of limits) held to it: each sits between
// `<!-- made:name -->` and `<!-- /made:name -->`, and `pnpm docs:make` rewrites what is between them. Plain JavaScript, so that reading
// files needs no Node types.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

import { libraryFrom } from "../scripts/docs-gallery.mjs";
import { MADE, withMade } from "../scripts/docs-made.mjs";

const lib = await libraryFrom(resolve("src"), ".ts", (file) => import(/* @vite-ignore */ file));
const pages = readdirSync("docs").filter((file) => file.endsWith(".md") && readFileSync(`docs/${file}`, "utf8").includes("<!-- made:"));

describe("the parts of the docs made from the source", () => {
  it("are in the pages that say so: the frames, the units and the limits", () => {
    const names = new Set(pages.flatMap((file) => [...readFileSync(`docs/${file}`, "utf8").matchAll(/<!-- made:([\w-]+) -->/g)].map((match) => match[1])));
    expect([...names].sort()).toEqual(Object.keys(MADE).sort());
  });

  for (const file of pages) {
    it(`docs/${file} holds what the source makes`, () => {
      const text = readFileSync(`docs/${file}`, "utf8");
      const made = withMade(text, lib);
      expect(made.unknown).toEqual([]);
      if (process.env.UPDATE_DOCS === "1") writeFileSync(`docs/${file}`, made.text);
      expect(text, `docs/${file} is out of date: run \`pnpm docs:make\``).toBe(made.text);
    });
  }

  it("has a row for every frame, every sport and every league, and counts the code's own numbers", () => {
    const frames = MADE.frames(lib);
    for (const name of Object.keys(lib["@johnmorrisdotca/kyogijo-stadiums/frames"].FRAMES)) expect(frames).toContain(`| \`${name}\` |`);
    const units = MADE.units(lib);
    for (const sport of lib["@johnmorrisdotca/kyogijo-stadiums"].SPORTS) expect(units).toContain(`| \`${sport}\` | the sport's own |`);
    expect(units).toContain("| `nba` | `fiba` |");
    const limits = MADE.limits(lib);
    expect(limits).toContain("| Ballparks | 94 (30 current MLB, 44 past MLB, 12 NPB home parks, 8 other NPB grounds) | `PARKS` |");
    expect(limits).toContain("| Grounds | 64 | `GROUNDS` |");
  });
});
