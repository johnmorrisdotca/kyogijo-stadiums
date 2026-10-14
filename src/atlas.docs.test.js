import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

import { atlasMapSvg } from "../scripts/atlas-map.mjs";
import { PLACES } from "./atlas.ts";

const chizu = dirname(dirname(createRequire(import.meta.url).resolve("@johnmorrisdotca/chizu")));
const load = (path) => import(pathToFileURL(join(chizu, "dist", path)).href);

describe("the atlas's picture", () => {
  it("is the one docs/atlas.md shows, made by `pnpm site` from the places", async () => {
    const made = atlasMapSvg({ places: PLACES, world: (await load("world-entry.js")).default, drawChizu: (await load("draw-entry.js")).drawChizu, projectPoint: (await load("index.js")).projectPoint });
    expect(readFileSync("docs/atlas-map.svg", "utf8")).toBe(made);
    expect(made.match(/class="atlas-mark /g)).toHaveLength(PLACES.length + 5);
    expect(made).toContain("<title>");
    expect(readFileSync("docs/atlas.md", "utf8")).toContain("./atlas-map.svg");
  });
});

describe("the tenants the docs count", () => {
  it("are the clubs the data holds", async () => {
    const text = readFileSync("docs/atlas.md", "utf8");
    const withTenants = PLACES.filter((place) => place.tenants.length > 0);
    const tenants = PLACES.flatMap((place) => place.tenants);
    expect(text).toContain(`the ${tenants.length} clubs (${new Set(tenants.map((t) => t.wikidata)).size} of them different) that played their home matches in ${withTenants.length} of them`);
    expect(readFileSync("CHANGELOG.md", "utf8")).toContain(`${tenants.length} tenants (${new Set(tenants.map((t) => t.wikidata)).size} clubs) at ${withTenants.length} of the 158 places, ${tenants.filter((t) => t.to === undefined).length} of them still there`);
    expect(text).toContain(`a club whose years neither gives has none (${tenants.filter((t) => t.from === undefined && t.to === undefined).length} do)`);
  });
});
