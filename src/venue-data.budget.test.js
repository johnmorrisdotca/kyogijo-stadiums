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

  it("are the only way to the lists: nothing else imports a table of every venue, so that the lean district reaches none", () => {
    for (const data of ["arenas.data.ts", "parks.data.ts", "grounds.data.ts"]) {
      expect(reaches("district-lean-entry.ts", data), `district-lean-entry reaches ${data}`).toBe(false);
    }
    for (const full of ["arenas.ts", "parks.ts", "grounds.ts", "full.ts"]) expect(reaches("district-lean-entry.ts", full), `district-lean-entry reaches ${full}`).toBe(false);
  });
});
