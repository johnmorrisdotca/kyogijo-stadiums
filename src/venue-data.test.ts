// The venues' data is one file each, and a page that draws a venue reads that venue's. This holds the two ways of having it to the same drawing: the lean district, which holds only what `loadVenueDataFor` has read, draws every district
// of the demo to the last character as the district entry does with every venue's data held, and every entry that has always had the venues has them still.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ARENA_INDEX } from "./arenas.index.ts";
import { GROUND_INDEX } from "./grounds.index.ts";
import { PARK_INDEX } from "./parks.index.ts";
import { PARK_IDS_WITHOUT_WALLS } from "./parks.walls.ts";
import { ARENA_DATA } from "./arenas.data.ts";
import { GROUND_DATA } from "./grounds.data.ts";
import { PARK_DATA } from "./parks.data.ts";

/** The districts the demo opens (the same as `scripts/bundle-lib.mjs`). */
const PRESETS: Record<string, string[]> = {
  pair: ["bc-place:cfl", "rogers-arena"],
  alone: ["rogers-arena"],
  soccer: ["bc-place:soccer", "rogers-arena"],
  seattlecenter: ["climate-pledge-arena"],
  sodo: ["t-mobile-park:mlb", "lumen-field:nfl"],
  seattle: ["t-mobile-park:mlb", "lumen-field:nfl", "climate-pledge-arena"],
  tokyo: ["tokyo-dome:mlb", "korakuen-hall:boxing"],
  tokyokodokan: ["tokyo-dome:mlb", "korakuen-hall:boxing", "kodokan"],
  kodokan: ["kodokan"],
  koshien: ["hanshin-koshien-stadium:mlb"],
};

beforeEach(() => vi.resetModules());

describe("the indexes", () => {
  it("list every record of the tables, in their order, with the names the records have", () => {
    expect(Object.keys(ARENA_INDEX)).toEqual(ARENA_DATA.map((a) => a.id));
    expect(Object.keys(PARK_INDEX)).toEqual(PARK_DATA.map((p) => p.id));
    expect(Object.keys(GROUND_INDEX)).toEqual(GROUND_DATA.map((g) => g.id));
    for (const [index, data] of [[ARENA_INDEX, ARENA_DATA], [PARK_INDEX, PARK_DATA], [GROUND_INDEX, GROUND_DATA]] as const) {
      for (const record of data) expect([index[record.id].name, index[record.id].nameJa], record.id).toEqual([record.name, record.nameJa]);
    }
  });

  it("read each record from its own file, the record of the table", async () => {
    for (const record of ARENA_DATA) expect((await ARENA_INDEX[record.id].load()).ARENA, record.id).toEqual(record);
    for (const record of PARK_DATA) expect((await PARK_INDEX[record.id].load()).PARK, record.id).toEqual(record);
    for (const record of GROUND_DATA) expect((await GROUND_INDEX[record.id].load()).GROUND, record.id).toEqual(record);
  });

  it("name the parks with no wall height as the table does", () => {
    expect([...PARK_IDS_WITHOUT_WALLS]).toEqual(PARK_DATA.filter((p) => (p.walls ?? []).length === 0).map((p) => p.id));
  });
});

describe("the parts of a drawing", () => {
  it("are held by the full entries, and a lean page that asks for one it does not carry is told which and how to have it", async () => {
    const lean = await import("./draw.parts.ts");
    expect(lean.hasPart("layers")).toBe(false);
    const { drawKyogijo } = await import("./draw.ts");
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "legend" }] as never })).toThrow(/the layers option needs the layers part.*main entry/);
    // With no layers asked for, nothing is needed.
    expect(drawKyogijo({ sport: "nhl", layers: [] })).toContain("<svg");
    await import("./full.ts");
    expect(lean.hasPart("layers")).toBe(true);
    expect(drawKyogijo({ sport: "nhl", layers: [{ kind: "legend" }] as never })).toContain("<svg");
  });
});

describe("the lean district", () => {
  it("names every venue it lists as the member does, with no record read", async () => {
    const lean = await import("./district-lean-entry.ts");
    const names = Object.fromEntries(lean.DISTRICT_IDS.flatMap((id) => ["en", "ja"].map((language) => [`${id}/${language}`, lean.venueName(id, language as "en" | "ja")])));
    for (const key of Object.keys(names)) expect(names[key], key).toBeTypeOf("string");
    expect(lean.venueName("not-a-venue")).toBeUndefined();
    const full = await import("./district-entry.ts");
    for (const id of full.DISTRICT_IDS) {
      const config = id === "kodokan" ? undefined : (full.districtMember as (key: string, language: "en" | "ja") => { config?: string })(id, "en").config;
      const key = config === undefined ? id : `${id}:${config}`;
      for (const language of ["en", "ja"] as const) expect(names[`${id}/${language}`], `${key} ${language}`).toBe(full.districtMember(key, language).name[language]);
    }
  });

  it("asks for the records of the venues it shows and no others", async () => {
    const { venueDataKeysFor } = await import("./venue-data.ts");
    expect(venueDataKeysFor(PRESETS.pair)).toEqual({ arenas: ["rogers-arena"], parks: [], grounds: ["bc-place"] });
    expect(venueDataKeysFor(PRESETS.sodo)).toEqual({ arenas: [], parks: ["t-mobile-park"], grounds: ["lumen-field"] });
    expect(venueDataKeysFor(PRESETS.tokyokodokan)).toEqual({ arenas: [], parks: ["tokyo-dome"], grounds: [] });
    expect(venueDataKeysFor(PRESETS.kodokan)).toEqual({ arenas: [], parks: [], grounds: [] });
    expect(venueDataKeysFor(["nowhere", "constructor"])).toEqual({ arenas: [], parks: [], grounds: [] });
  });

  it("refuses a key there is no record for, naming the ones there are, whatever the key is", async () => {
    const { loadArena, loadGround, loadPark } = await import("./venue-data.ts");
    for (const key of ["", "nowhere", "constructor", "__proto__", "toString"]) {
      await expect(loadArena(key), key).rejects.toThrow(/no arena.*rogers-arena/);
      await expect(loadPark(key), key).rejects.toThrow(/no park.*fenway-park/);
      await expect(loadGround(key), key).rejects.toThrow(/no ground.*old-trafford/);
    }
  });

  it("reads a record once and answers the same promise after", async () => {
    const { loadArena } = await import("./venue-data.ts");
    expect(loadArena("rogers-arena")).toBe(loadArena("rogers-arena"));
  });

  for (const [name, venues] of Object.entries(PRESETS)) {
    it(`draws ${name} in 2D and in 3D as the district entry does, with its surroundings and its crowd outside`, async () => {
      const base = { venues, mode: venues.length > 2 ? ("city" as const) : ("neighbours" as const), language: "en" as const };
      const lean = await import("./district-lean-entry.ts");
      await lean.loadVenueDataFor(venues);
      const context = await lean.loadAreasFor(venues);
      const variants = (api: typeof lean) => [base, { ...base, language: "ja" as const }, { ...base, context, outside: { level: 50 as const } }].flatMap((options) => [api.drawDistrict(options), api.districtTurnMarkup(options)]);
      const leanDrawn = variants(lean);
      const leanCrowd = lean.outsideCrowd(lean.planDistrict({ ...base, outside: { level: 50 } }));
      vi.resetModules();
      const full = await import("./district-entry.ts");
      const fullDrawn = variants(full as typeof lean);
      const fullCrowd = full.outsideCrowd(full.planDistrict({ ...base, outside: { level: 50 } }));
      for (let i = 0; i < fullDrawn.length; i += 1) expect(leanDrawn[i] === fullDrawn[i], `${name} ${i}`).toBe(true);
      expect(fullDrawn[0].length).toBeGreaterThan(1000);
      expect(leanCrowd?.count, name).toBe(fullCrowd?.count);
      expect(leanCrowd === undefined ? [] : [...leanCrowd.x.slice(0, 50)], name).toEqual(fullCrowd === undefined ? [] : [...fullCrowd.x.slice(0, 50)]);
    });
  }
});
