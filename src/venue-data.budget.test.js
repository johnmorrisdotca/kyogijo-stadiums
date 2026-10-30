// The entries that have always had every arena, park and ground have them still, and the lean district has none until it reads them. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => vi.resetModules());

/** What each entry had before the data was split, by the kinds of record it holds. Every entry not named here had all three; these are the lean ones and the ones that never had them. */
const KINDS = {
  "arenas-entry.ts": ["arena"], "parks-entry.ts": ["park"], "grounds-entry.ts": ["ground"],
  "areas-entry.ts": [], "cityctx-entry.ts": [], "osm-entry.ts": [], "plateau-entry.ts": [], "eras-entry.ts": [], "frames-entry.ts": [], "geometry-entry.ts": [], "leagues-entry.ts": [],
  "district-lean-entry.ts": [], "venue-data-entry.ts": [],
};
/** The entries that have always had the real venues of the NHL's arenas (the others never did, and the lean district has none until it reads them). */
const VENUE_ENTRIES = ["index.ts", "mount-entry.ts", "react-entry.ts", "element-entry.ts", "venues-entry.ts", "stadiums-entry.ts", "district-entry.ts", "athletics-entry.ts", "skating-entry.ts", "budo-entry.ts", "judging-entry.ts", "charts-entry.ts", "layouts-entry.ts", "multi-entry.ts", "replay-entry.ts", "scene-entry.ts", "canvas-entry.ts", "d3-entry.ts", "plot-entry.ts", "geojson-entry.ts", "png-entry.ts", "turn-entry.ts", "flythrough-entry.ts"];
const entries = [...new Set(readFileSync("package.json", "utf8").match(/"\.\/dist\/[a-z0-9.-]+-entry\.js"/g).map((file) => `${file.replace(/"\.\/dist\/|\.js"/g, "")}.ts`))];
const read = (file) => readFileSync(`src/${file}`, "utf8");

/** Whether a source file reaches another by its imports (and re-exports); a dynamic `import()` is not followed. Names are relative to src/. */
function reaches(file, target, seen = new Set()) {
  if (seen.has(file)) return false;
  seen.add(file);
  for (const match of read(file).matchAll(/^(?:import|export)\s[^;]*?from "(\.{1,2}\/[^"]+)"|^import "(\.{1,2}\/[^"]+)"/gm)) {
    const next = normalize(join(dirname(file), match[1] ?? match[2]));
    if (next === target || reaches(next, target, seen)) return true;
  }
  return false;
}

describe("the entries that have the venues", () => {
  it("are all of them found", () => {
    expect(entries.length).toBeGreaterThan(40);
    expect(entries).toContain("district-entry.ts");
    expect(entries).toContain("district-lean-entry.ts");
  });

  it("hold every arena, park and ground there is data for, as they always did", async () => {
    const lacking = [];
    for (const entry of ["index.ts", ...entries]) {
      vi.resetModules();
      await import(/* @vite-ignore */ `./${entry}`);
      const arenas = await import("./arenas.core.ts");
      const parks = await import("./parks.core.ts");
      const grounds = await import("./grounds.core.ts");
      const held = { arena: arenas.heldArena("rogers-arena") !== undefined, park: parks.heldPark("fenway-park") !== undefined, ground: grounds.heldGround("old-trafford") !== undefined };
      const wanted = KINDS[entry] ?? ["arena", "park", "ground"];
      for (const kind of ["arena", "park", "ground"]) if (wanted.includes(kind) !== held[kind]) lacking.push(`${entry}: ${kind} ${held[kind] ? "held" : "not held"}`);
    }
    expect(lacking).toEqual([]);
  }, 120_000);

  it("name the registration in their source, so that a bundler keeps it: every entry that holds the venues imports full.ts, or the three lists themselves", () => {
    for (const entry of ["index.ts", ...entries]) {
      if (KINDS[entry] !== undefined) continue;
      const own = ["arenas.ts", "parks.ts", "grounds.ts"].every((file) => reaches(entry, file));
      expect(reaches(entry, "full.ts") || own, entry).toBe(true);
    }
  });

  it("hold the walkable ground of every district in the district entry alone, as only it did, and the lean district none until loadOutside reads it", async () => {
    for (const entry of ["index.ts", ...entries]) {
      vi.resetModules();
      await import(/* @vite-ignore */ `./${entry}`);
      const walk = await import("./walk.ts");
      expect(walk.heldWalk("vancouver") !== undefined, entry).toBe(entry === "district-entry.ts");
    }
  }, 120_000);

  it("hold the real venues of the NHL's arenas in the entries that always had them, and the lean district none until it reads them", async () => {
    const lacking = [];
    for (const entry of ["index.ts", ...entries]) {
      vi.resetModules();
      await import(/* @vite-ignore */ `./${entry}`);
      const { VENUES, VENUE_IDS } = await import("./venues.ts");
      const held = Object.keys(VENUES).length;
      const wanted = VENUE_ENTRIES.includes(entry) ? VENUE_IDS.length : 0;
      if (held !== wanted) lacking.push(`${entry}: ${held} of ${wanted} venues`);
    }
    expect(lacking).toEqual([]);
  }, 120_000);

  it("hold the words in both languages, as they always did, in every entry but the three that load: the lean district, the venue data and the areas", async () => {
    const lacking = [];
    for (const entry of ["index.ts", ...entries]) {
      vi.resetModules();
      await import(/* @vite-ignore */ `./${entry}`);
      const { hasStrings } = await import("./strings.core.ts");
      const wanted = !["district-lean-entry.ts", "venue-data-entry.ts", "areas-entry.ts"].includes(entry);
      for (const language of ["en", "ja"]) if (hasStrings(language) !== wanted) lacking.push(`${entry}: ${language} ${hasStrings(language) ? "held" : "not held"}`);
    }
    expect(lacking).toEqual([]);
  }, 120_000);

  it("name the words in their source, so that a bundler keeps them: every entry that holds them imports strings.ts, or full.ts, which does", () => {
    for (const entry of ["index.ts", ...entries]) {
      if (["district-lean-entry.ts", "venue-data-entry.ts", "areas-entry.ts"].includes(entry)) continue;
      expect(reaches(entry, "strings.ts"), entry).toBe(true);
    }
  });

  it("are the only way to the lists: nothing else imports a table of every venue, so that the lean district reaches none", () => {
    for (const data of ["arenas.data.ts", "parks.data.ts", "grounds.data.ts"]) {
      expect(reaches("district-lean-entry.ts", data), `district-lean-entry reaches ${data}`).toBe(false);
    }
    for (const full of ["arenas.ts", "parks.ts", "grounds.ts", "full.ts"]) expect(reaches("district-lean-entry.ts", full), `district-lean-entry reaches ${full}`).toBe(false);
    for (const walk of ["walk.data.ts", "walk.full.ts", "walk/vancouver.data.ts"]) expect(reaches("district-lean-entry.ts", walk), `district-lean-entry reaches ${walk}`).toBe(false);
    expect(reaches("district-entry.ts", "walk.full.ts")).toBe(true);
    for (const words of ["strings.ts", "strings.en.ts", "strings.ja.ts"]) expect(reaches("district-lean-entry.ts", words), `district-lean-entry reaches ${words}`).toBe(false);
    for (const venues of ["venues.data.ts", "venues.osm.data.ts", "venues.all.ts", "venues/honda-center.data.ts", "venues/honda-center.osm.data.ts"]) expect(reaches("district-lean-entry.ts", venues), `district-lean-entry reaches ${venues}`).toBe(false);
    for (const entry of ["venue-data-entry.ts", "areas-entry.ts"]) for (const venues of ["venues.data.ts", "venues.osm.data.ts", "venues.all.ts"]) expect(reaches(entry, venues), `${entry} reaches ${venues}`).toBe(false);
    for (const entry of VENUE_ENTRIES) expect(reaches(entry, "venues.all.ts"), `${entry} reaches venues.all.ts`).toBe(true);
    for (const entry of ["venue-data-entry.ts", "areas-entry.ts"]) for (const words of ["strings.ts", "strings.en.ts", "strings.ja.ts"]) expect(reaches(entry, words), `${entry} reaches ${words}`).toBe(false);
  });
});
