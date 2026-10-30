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
import { VENUE_DATA } from "./venues.data.ts";
import { VENUE_INDEX } from "./venues.index.ts";
import { VENUE_OSM } from "./venues.osm.data.ts";
import { WALK_INDEX } from "./walk.index.ts";
import { WALK_DATA } from "./walk.data.ts";

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

  it("list the real venues of the tables, and read each from its two files, the facts and the outline of the tables", async () => {
    expect(Object.keys(VENUE_INDEX)).toEqual(VENUE_DATA.map((v) => v.id));
    expect(Object.keys(VENUE_OSM)).toEqual(VENUE_DATA.map((v) => v.id));
    for (const record of VENUE_DATA) {
      const [facts, outline] = await VENUE_INDEX[record.id].load();
      expect(facts.VENUE, record.id).toEqual(record);
      expect(outline.OSM, record.id).toEqual(VENUE_OSM[record.id]);
    }
  });

  it("list the districts of the walkable ground, with the venues the tables name, and read each from its own file", async () => {
    expect(Object.keys(WALK_INDEX)).toEqual(Object.keys(WALK_DATA));
    for (const id of Object.keys(WALK_DATA)) {
      expect(WALK_INDEX[id].venues, id).toEqual(WALK_DATA[id].venues);
      expect((await WALK_INDEX[id].load()).WALK, id).toEqual(WALK_DATA[id]);
    }
  });

  it("name the parks with no wall height as the table does", () => {
    expect([...PARK_IDS_WITHOUT_WALLS]).toEqual(PARK_DATA.filter((p) => (p.walls ?? []).length === 0).map((p) => p.id));
  });
});

describe("the parts of a drawing", () => {
  it("are held by the full entries, and a lean page that asks for one it does not carry is told which and how to have it", async () => {
    const lean = await import("./draw.parts.ts");
    await (await import("./strings.core.ts")).loadStrings("en");
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
      await lean.loadOutside(venues);
      await Promise.all([lean.loadStrings("en"), lean.loadStrings("ja")]);
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
      // The whole crowd, every person's place and venue, is the district entry's to the last bit.
      expect(leanCrowd === undefined, name).toBe(fullCrowd === undefined);
      if (leanCrowd !== undefined && fullCrowd !== undefined) {
        expect(leanCrowd.mask, name).toBe(fullCrowd.mask);
        expect(leanCrowd.venues, name).toEqual(fullCrowd.venues);
        for (const part of ["x", "y", "venue"] as const) expect(Array.from(leanCrowd[part]).join(",") === Array.from(fullCrowd[part]).join(","), `${name} ${part}`).toBe(true);
      }
    });
  }

  it("holds the walkable ground of no district until loadOutside has read it, says so where a crowd is asked for before, and reads nothing for venues no mask names", async () => {
    const lean = await import("./district-lean-entry.ts");
    const walk = await import("./walk.ts");
    expect(lean.WALK_IDS).toEqual(["vancouver"]);
    expect(lean.OUTSIDE_VENUES).toEqual(["bc-place", "rogers-arena"]);
    await lean.loadVenueDataFor(PRESETS.pair);
    // The plan, and whether there is a crowd to show, need no data: the index says which venues stand on a mask.
    const plan = lean.planDistrict({ venues: PRESETS.pair, outside: { level: 25 } });
    expect(lean.hasOutside(plan)).toBe(true);
    expect(walk.heldWalk("vancouver")).toBeUndefined();
    expect(() => lean.outsideCrowd(plan)).toThrow(/vancouver is not read yet.*loadOutside/);
    for (const [name, venues] of Object.entries(PRESETS)) {
      if (lean.OUTSIDE_VENUES.some((id) => venues.some((key) => key.split(":")[0] === id))) continue;
      await lean.loadOutside(venues);
      expect(walk.heldWalk("vancouver"), name).toBeUndefined();
    }
    const read = lean.loadOutside(PRESETS.pair);
    await expect(lean.loadOutside(PRESETS.pair)).resolves.toBeUndefined();
    await read;
    expect(walk.heldWalk("vancouver")?.venues).toEqual(["bc-place:cfl", "rogers-arena"]);
    expect(lean.outsideCrowd(plan)?.count).toBeGreaterThan(1000);
    await expect(walk.loadWalk("nowhere")).rejects.toThrow(/no walkable mask nowhere.*vancouver/);
    await expect(walk.loadWalk("constructor")).rejects.toThrow(/no walkable mask/);
  });

  it("reads a real venue of an arena from its two files with the arena's record, and no other venue", async () => {
    const lean = await import("./district-lean-entry.ts");
    const venues = await import("./venues.ts");
    expect(Object.keys(venues.VENUES)).toEqual([]);
    expect(venues.VENUE_IDS).toHaveLength(32);
    expect(lean.DISTRICT_IDS).toContain("honda-center");
    expect(venues.venueById("not-an-arena")).toBeUndefined();
    expect(venues.venueById("constructor")).toBeUndefined();
    expect(() => venues.venueById("rogers-arena")).toThrow(/venue rogers-arena is not read yet.*loadVenueDataFor/);
    await lean.loadVenueDataFor(PRESETS.pair);
    expect(Object.keys(venues.VENUES)).toEqual(["rogers-arena"]);
    expect(venues.venueById("rogers-arena")?.osm.axis.centre).toHaveLength(2);
    await expect(venues.loadVenue("rogers-arena")).resolves.toBe(venues.VENUES["rogers-arena"]);
    await expect(venues.loadVenue("nowhere")).rejects.toThrow(/no venue "nowhere".*rogers-arena/);
    await expect(venues.loadVenue("constructor")).rejects.toThrow(/no venue/);
    const held = JSON.stringify(venues.VENUES["rogers-arena"]);
    vi.resetModules();
    await import("./full.ts");
    await import("./venues.all.ts");
    const all = await import("./venues.ts");
    expect(Object.keys(all.VENUES)).toEqual([...all.VENUE_IDS]);
    expect(JSON.stringify(all.VENUES["rogers-arena"])).toBe(held);
  });

  it("keeps a crowd outside out of the buildings of the venues that are not shown too: BC Place alone has Rogers Arena's outline read with the ground, and the crowd is the district entry's", async () => {
    const venues = ["bc-place:cfl"];
    const lean = await import("./district-lean-entry.ts");
    await lean.loadVenueDataFor(venues);
    await lean.loadOutside(venues);
    await lean.loadStrings("en");
    const crowd = lean.outsideCrowd(lean.planDistrict({ venues, outside: { level: 50 } }));
    vi.resetModules();
    const full = await import("./district-entry.ts");
    const fullCrowd = full.outsideCrowd(full.planDistrict({ venues, outside: { level: 50 } }));
    expect(crowd?.count).toBeGreaterThan(1000);
    expect(crowd?.count).toBe(fullCrowd?.count);
    expect(Array.from(crowd!.x).join(",") === Array.from(fullCrowd!.x).join(",")).toBe(true);
  });

  it("reads the walkable ground once: the same promise while it is read, and the data after", async () => {
    const walk = await import("./walk.ts");
    expect(walk.loadWalk("vancouver")).toBe(walk.loadWalk("vancouver"));
    const data = await walk.loadWalk("vancouver");
    expect(await walk.loadWalk("vancouver")).toBe(data);
  });
});

describe("the words, one language to a file", () => {
  it("are held by the lean district in no language until loadStrings has read it, and a draw before says which and how", async () => {
    const lean = await import("./district-lean-entry.ts");
    const { KYOGIJO_STRINGS, hasStrings } = await import("./strings.core.ts");
    expect([hasStrings("en"), hasStrings("ja")]).toEqual([false, false]);
    expect(() => KYOGIJO_STRINGS.en).toThrow(/English words are not read yet.*loadStrings\("en"\)/);
    await lean.loadVenueDataFor(PRESETS.alone);
    expect(() => lean.drawDistrict({ venues: PRESETS.alone })).toThrow(/loadStrings\("en"\)/);
    expect(() => lean.drawDistrict({ venues: PRESETS.alone, language: "ja" })).toThrow(/Japanese words are not read yet.*loadStrings\("ja"\)/);
  });

  it("are read one language at a time, once, and a language read is drawn in at once, with the other still unread", async () => {
    const lean = await import("./district-lean-entry.ts");
    const { hasStrings } = await import("./strings.core.ts");
    await lean.loadVenueDataFor(PRESETS.alone);
    expect(lean.loadStrings("en")).toBe(lean.loadStrings("en"));
    await lean.loadStrings("en");
    expect([hasStrings("en"), hasStrings("ja")]).toEqual([true, false]);
    expect(lean.drawDistrict({ venues: PRESETS.alone })).toContain("Rogers Arena");
    expect(() => lean.drawDistrict({ venues: PRESETS.alone, language: "ja" })).toThrow(/loadStrings\("ja"\)/);
    // Switching language in the middle of a session: read the other, and both are drawn.
    await lean.loadStrings("ja");
    expect([hasStrings("en"), hasStrings("ja")]).toEqual([true, true]);
    expect(lean.drawDistrict({ venues: PRESETS.alone, language: "ja" })).toContain("ロジャーズ");
    expect(lean.drawDistrict({ venues: PRESETS.alone })).toContain("Rogers Arena");
    await expect(lean.loadStrings("ja")).resolves.toBeUndefined();
    await expect(lean.loadStrings("fr" as never)).rejects.toThrow(/no words in "fr": the languages are en, ja/);
  });

  it("are the words the full entries have, every key and every character", async () => {
    const lean = await import("./district-lean-entry.ts");
    const { KYOGIJO_STRINGS } = await import("./strings.core.ts");
    await Promise.all([lean.loadStrings("en"), lean.loadStrings("ja")]);
    const leanWords = JSON.stringify(KYOGIJO_STRINGS);
    vi.resetModules();
    await import("./strings.ts");
    const full = (await import("./strings.core.ts")).KYOGIJO_STRINGS;
    expect(JSON.stringify(full)).toBe(leanWords);
    expect(Object.keys(full)).toEqual(["en", "ja"]);
    expect(full.ja.surface.nhl).toMatch(/[぀-ヿ]/u);
    // The full table is plain data once read: the same object every time.
    expect(full.en).toBe(full.en);
  });
});

