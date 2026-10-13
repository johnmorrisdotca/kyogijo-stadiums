// The README's table and docs/sources.md held to the data they sum up, so that neither can part from src/eras.ts. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ERA_SOURCES, ERA_SPORTS, eraChanges } from "./eras.ts";

describe("docs/eras.md, the table of the years", () => {
  const table = readFileSync("docs/eras.md", "utf8");
  const label = {
    centreLine: "centre red line", goalLine: "goal lines", blueLine: "blue lines", trapezoid: "trapezoid", keyWidth: "lane", threePoint: "three-point line",
    restrictedArea: "restricted area", hash: "hash marks", posts: "goal posts", postShape: "goal posts", endZone: "end zones", length: "field", pitcher: "pitcher",
    battersBox: "batter's boxes", plateShape: "home plate", platePlacement: "home plate", moundHeight: "mound height",
  };

  it("has a row for every marking, and each row names the season of every change to it", () => {
    for (const sport of ERA_SPORTS) {
      for (const change of eraChanges(sport)) {
        const row = table.split("\n").find((line) => line.startsWith(`| \`${sport}\` | ${label[change.feature]} |`));
        expect(row, `${change.id}: a row for ${label[change.feature]}`).toBeDefined();
        expect(row, `${change.id}: the row names ${change.from}`).toContain(String(change.from));
      }
    }
  });
});

describe("docs/sources.md", () => {
  const sources = readFileSync("docs/sources.md", "utf8");

  it("names every page a change was read from, with its address and, for Wikipedia, its revision", () => {
    for (const source of Object.values(ERA_SOURCES)) {
      expect(sources.includes(source.title), `${source.id}: "${source.title}"`).toBe(true);
      expect(sources.includes(source.url), `${source.id}: its address`).toBe(true);
      if (source.revision !== undefined) expect(sources.includes(`revision ${source.revision}`), `${source.id}: its revision`).toBe(true);
    }
  });
});
