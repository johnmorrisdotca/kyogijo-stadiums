// The guides held to the contents: each guide of docs/guides/ is listed once in GUIDES (docs-nav.mjs) with its title in Japanese, has its Japanese twin in docs/guides/ja/, and the
// two link to each other in their first lines. What `pnpm docs:check` says of them (blocks of code, pictures, links) is held by scripts/docs-check.mjs, which this test runs on the repository.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { GUIDES, NAV } from "../scripts/docs-nav.mjs";
import { GUIDE_TWINS, PAGE_LIST, fileOf, titleOf } from "../scripts/docs-pages.mjs";

const read = (path) => readFileSync(path, "utf8");

describe("the guides", () => {
  it("are at least ten, listed once, and the first group of the contents", () => {
    expect(GUIDES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(GUIDES.map((guide) => guide.name)).size).toBe(GUIDES.length);
    expect(NAV[0].id).toBe("guides");
    expect(NAV[0].pages.map((page) => page.slug)).toEqual(GUIDES.map((guide) => `guides/${guide.name}`));
    expect(PAGE_LIST.filter((page) => page.guide)).toHaveLength(GUIDES.length);
  });

  it("are the files of docs/guides/, and their twins the files of docs/guides/ja/", () => {
    const files = (folder) => readdirSync(folder).filter((name) => name.endsWith(".md")).sort();
    expect(files("docs/guides")).toEqual(GUIDES.map((guide) => `${guide.name}.md`).sort());
    expect(files("docs/guides/ja")).toEqual(GUIDES.map((guide) => `${guide.name}.md`).sort());
    expect(GUIDE_TWINS.map((twin) => fileOf(twin.slug)).sort()).toEqual(files("docs/guides/ja").map((name) => `docs/guides/ja/${name}`));
  });

  for (const guide of GUIDES) {
    it(`${guide.name}: has a title in each language, the Japanese one the contents' own, and the pair link each other at the top`, () => {
      const en = read(`docs/guides/${guide.name}.md`);
      const ja = read(`docs/guides/ja/${guide.name}.md`);
      expect(titleOf(en)).not.toBe("");
      expect(titleOf(ja)).toBe(guide.ja);
      expect(en.split("\n").slice(0, 4).join("\n")).toContain(`(ja/${guide.name}.md)`);
      expect(ja.split("\n").slice(0, 4).join("\n")).toContain(`(../${guide.name}.md)`);
    });
  }
});
