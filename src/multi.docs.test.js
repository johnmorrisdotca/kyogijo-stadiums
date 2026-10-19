// docs/multi.md, held to the data: a row for every preset with the floor it needs, and a row for every hall. Plain JavaScript, so that reading a file needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { MULTI_PRESETS, MULTI_VENUES } from "./multi.data.ts";
import { multiLayout } from "./multi.ts";

const page = readFileSync("docs/multi.md", "utf8");
const lines = page.split("\n");

describe("the page of tournament layouts", () => {
  it("has a row for every preset: its rows and columns, the surfaces, the floor it needs and its basis", () => {
    for (const spec of MULTI_PRESETS) {
      const { needs } = multiLayout({ preset: spec.id });
      const row = lines.find((line) => line.startsWith(`| \`${spec.id}\` |`));
      expect(row, spec.id).toBeDefined();
      const grid = `${spec.rows} x ${spec.columns}`;
      expect(row, spec.id).toContain(`| ${grid} | ${needs.surfaces} | ${needs.length} by ${needs.width} | ${needs.area} | ${spec.basis} |`);
    }
  });

  it("has a row for every hall", () => {
    for (const venue of MULTI_VENUES) expect(lines.some((line) => line.startsWith(`| \`${venue.id}\` |`)), venue.id).toBe(true);
  });
});
