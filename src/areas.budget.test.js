// The areas of context are one file of data each, and a page that does not ask for an area does not carry it: this holds the import graph to that (which files each entry reaches by `import` and `export ... from`, not by `import()`),
// and holds the loader to the data (the same objects the entries export, and the same venues choosing them). Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { describe, expect, it } from "vitest";

import { AREA_KEYS, areaKeysFor, loadArea, loadAreasFor } from "./areas.ts";
import { CITYCTX_AREAS } from "./cityctx.data.ts";
import { contextFor } from "./cityctx.ts";
import { OSM_AREAS } from "./osm.context.data.ts";
import { PLATEAU_AREAS } from "./plateau.data.ts";

const read = (file) => readFileSync(`src/${file}`, "utf8");
const DATA = ["osm.context.data.ts", "plateau.data.ts", "cityctx.data.ts", "cityctx.vancouver-nature.data.ts", "cityctx.seattle-sodo.data.ts", "cityctx.seattle-center.data.ts", "cityctx.seattle-city.data.ts"];

/** The files a source file reaches by its imports (and re-exports), itself included; a dynamic `import()` is not followed. Names are relative to src/. */
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const match of read(file).matchAll(/^(?:import|export)\s[^;]*?from "(\.{1,2}\/[^"]+)"|^import "(\.{1,2}\/[^"]+)"/gm)) closure(normalize(join(dirname(file), match[1] ?? match[2])), seen);
  return seen;
}

describe("the areas of context, one file each", () => {
  it("are reached by no entry that does not ask for them: not the main entry, nor the district's, nor the loader's", () => {
    for (const entry of ["index.ts", "district-entry.ts", "areas-entry.ts", "turn-entry.ts", "venues-entry.ts", "stadiums-entry.ts"]) {
      expect([...closure(entry)].filter((file) => DATA.includes(file)), `${entry} reaches an area's data`).toEqual([]);
    }
  });

  it("are each reached by the entry that exports them, and the entries `cityctx`, `osm` and `plateau` still export every one", () => {
    expect([...closure("cityctx-entry.ts")].filter((file) => file.startsWith("cityctx.") && file.endsWith(".data.ts")).sort()).toEqual(DATA.filter((file) => file.startsWith("cityctx.")).sort());
    expect(Object.keys(CITYCTX_AREAS).sort()).toEqual(["seattle-center", "seattle-city", "seattle-sodo", "vancouver-nature"]);
    expect(Object.keys(OSM_AREAS)).toEqual(["vancouver"]);
    expect(Object.keys(PLATEAU_AREAS)).toEqual(["tokyo-dome-city"]);
  });

  it("are one file each: no file holds two areas, and the loader reads each from the file of its own", () => {
    const loader = read("areas.ts");
    for (const key of AREA_KEYS) expect(loader, key).toContain(`"${key}": async () => (await import("./`);
    for (const file of ["cityctx.vancouver-nature.data.ts", "cityctx.seattle-sodo.data.ts", "cityctx.seattle-center.data.ts", "cityctx.seattle-city.data.ts", "plateau.data.ts", "osm.context.data.ts"]) {
      expect((read(file).match(/^export const [A-Z_]+: ContextArea\b/gm) ?? []).length, file).toBeGreaterThanOrEqual(1);
    }
    for (const file of ["cityctx.vancouver-nature.data.ts", "cityctx.seattle-sodo.data.ts", "cityctx.seattle-center.data.ts", "cityctx.seattle-city.data.ts"]) {
      expect((read(file).match(/^export const /gm) ?? []).length, file).toBe(1);
    }
  });
});

describe("the loader", () => {
  it("gives the objects the entries export, for every key", async () => {
    const all = { ...CITYCTX_AREAS, ...OSM_AREAS, ...PLATEAU_AREAS };
    expect([...AREA_KEYS].sort()).toEqual(Object.keys(all).sort());
    for (const key of AREA_KEYS) expect(await loadArea(key), key).toBe(all[key]);
  });

  it("asks for an area once and answers the same promise after", () => {
    expect(loadArea("seattle-sodo")).toBe(loadArea("seattle-sodo"));
  });

  it("refuses a key that is not an area, naming the ones there are, whatever the key is", async () => {
    for (const key of ["", "seattle", "constructor", "__proto__", "toString"]) await expect(loadArea(key), key).rejects.toThrow(/no area of context.*seattle-sodo/);
  });

  it("chooses the areas contextFor chooses, in the same order, and Tokyo Dome City's for the Tokyo venues", async () => {
    const asks = [
      ["bc-place:cfl", "rogers-arena"],
      ["rogers-arena"],
      ["lumen-field:nfl", "t-mobile-park:mlb"],
      ["climate-pledge-arena"],
      ["t-mobile-park:mlb", "lumen-field:nfl", "climate-pledge-arena"],
      ["nothing-here"],
      [],
    ];
    for (const venues of asks) {
      expect(areaKeysFor(venues), venues.join()).toEqual(contextFor(venues).map((area) => area.key));
      expect(await loadAreasFor(venues), venues.join()).toEqual(contextFor(venues));
    }
    for (const venues of [["tokyo-dome:mlb", "korakuen-hall:boxing"], ["kodokan"], ["tokyo-dome", "kodokan", "rogers-arena"]]) {
      expect(areaKeysFor(venues), venues.join()).toEqual(["tokyo-dome-city"]);
      expect(await loadAreasFor(venues)).toEqual([PLATEAU_AREAS["tokyo-dome-city"]]);
    }
  });
});
