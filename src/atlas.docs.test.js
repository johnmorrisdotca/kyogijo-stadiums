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
    expect(made.match(/class="atlas-mark /g)).toHaveLength(PLACES.length + 4);
    expect(made).toContain("<title>");
    expect(readFileSync("docs/atlas.md", "utf8")).toContain("./atlas-map.svg");
  });
});
