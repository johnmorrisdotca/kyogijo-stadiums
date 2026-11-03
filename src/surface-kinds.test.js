// The playground's surface picker (demo/surface-kinds.js): every surface in one kind, each kind's sports A to Z in both languages, the football
// fields as one sport with its three surfaces, and the address's surface key kept: a key gives a choice, and the choice gives the key back.
import { URLSearchParams } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { SPORTS } from "./index.ts";
import { READING_JA, SURFACE_GROUPS, SURFACE_KINDS, choiceOf, groupOf, kindOf, orderedChips, pickerHtml, sportChips, surfaceOf } from "../demo/surface-kinds.js";
import { WORDS } from "../demo/words.js";

// The page's model, as the page loads it: its imports of the built package are the package's source here (the tests run before the build).
vi.mock("../demo/dist/index.js", () => import("./index.ts"));
vi.mock("../demo/dist/layers-entry.js", () => import("./layers-entry.ts"));
vi.mock("../demo/emblems.js", () => ({ EMBLEM_GROUPS: { crest: ["crest:shield", "crest:roundel"], sport: [], trophy: ["trophy:soccer-globe"], medal: [], award: [], ball: [], gear: [] } }));

const sayIn = (lang) => (key) => {
  if (!(key in WORDS[lang])) throw new Error(`no ${lang} word for ${key}`);
  return WORDS[lang][key];
};
const KANA = /^[ぁ-ゖァ-ヺー・]+$/u;

describe("the kinds", () => {
  it("put every surface in exactly one kind, and every kind has a surface", () => {
    for (const sport of SPORTS) expect(SURFACE_KINDS).toContain(kindOf(sport));
    const chips = sportChips(SPORTS);
    expect(chips.flatMap((chip) => chip.surfaces).sort()).toEqual([...SPORTS].sort());
    for (const kind of SURFACE_KINDS) expect(chips.some((chip) => chip.kind === kind)).toBe(true);
  });

  it("have their words in both languages, as have the chips", () => {
    for (const lang of ["en", "ja"]) {
      const say = sayIn(lang);
      for (const key of ["surfaceKinds", "surfaceVariant", "surfaceGame", ...SURFACE_KINDS.map((kind) => `surfaceKind_${kind}`)]) expect(say(key)).not.toBe("");
      for (const chip of sportChips(SPORTS)) expect(say(chip.word)).not.toBe("");
    }
  });

  it("are where a reader looks for each surface", () => {
    expect(Object.fromEntries(SURFACE_KINDS.map((kind) => [kind, sportChips(SPORTS).filter((chip) => chip.kind === kind).map((chip) => chip.id).sort()]))).toEqual({
      field: ["afl", "cricket", "fieldhockey", "football", "gaelic", "lacrosse", "mlb", "rugby", "soccer"],
      court: ["badminton", "handball", "nba", "netball", "padel", "pickleball", "racquetball", "roundnet", "sepaktakraw", "squash", "tabletennis", "tennis", "teqball", "volleyball"],
      ice: ["curling", "nhl", "skating"],
      pool: ["artisticswimming", "diving", "swimming", "waterpolo"],
      track: ["athletics"],
      budo: ["dojo", "judo", "karate", "kendo", "kyudo", "sumo"],
      ring: ["boxing", "mma", "prowrestling", "wrestling"],
    });
  });
});

describe("the sports of a kind", () => {
  const names = (lang, kind) => orderedChips(SPORTS, sayIn(lang), lang).filter((chip) => chip.kind === kind).map((chip) => sayIn(lang)(chip.word));

  it("come kind by kind in the row's order", () => {
    for (const lang of ["en", "ja"]) {
      const kinds = orderedChips(SPORTS, sayIn(lang), lang).map((chip) => chip.kind);
      expect(kinds).toEqual([...kinds].sort((a, b) => SURFACE_KINDS.indexOf(a) - SURFACE_KINDS.indexOf(b)));
    }
  });

  it("are A to Z by the English name", () => {
    const collator = new Intl.Collator("en", { sensitivity: "base" });
    for (const kind of SURFACE_KINDS) {
      const shown = names("en", kind);
      expect(shown).toEqual([...shown].sort(collator.compare));
    }
    expect(names("en", "ice")).toEqual(["Curling", "Ice hockey", "Ice skating"]);
    expect(names("en", "field")).toEqual(["Australian football", "Baseball", "Cricket", "Field hockey", "Gaelic games", "Gridiron football", "Lacrosse", "Rugby", "Soccer"]);
  });

  it("are in gojūon order by reading in Japanese, a name in kanji by the reading the table gives it", () => {
    const say = sayIn("ja");
    for (const chip of sportChips(SPORTS)) {
      const name = say(chip.word).replace(/[・ー]/g, "");
      if (!KANA.test(say(chip.word)) || name === "") expect(READING_JA[chip.id], `${chip.id} (${say(chip.word)}) needs a reading`).toMatch(KANA);
    }
    for (const reading of Object.values(READING_JA)) expect(reading).toMatch(KANA);
    const collator = new Intl.Collator("ja");
    for (const kind of SURFACE_KINDS) {
      const chips = orderedChips(SPORTS, say, "ja").filter((chip) => chip.kind === kind);
      const readings = chips.map((chip) => READING_JA[chip.id] ?? say(chip.word));
      expect(readings).toEqual([...readings].sort(collator.compare));
    }
    expect(names("ja", "budo")).toEqual(["空手", "弓道", "剣道", "柔道", "相撲", "道場"]);
    expect(names("ja", "field")).toEqual(["アメリカンフットボール", "オーストラリアンフットボール", "クリケット", "ゲーリック・ゲームズ", "サッカー", "フィールドホッケー", "野球", "ラグビー", "ラクロス"]);
    const court = names("ja", "court");
    expect(court.slice(court.indexOf("セパタクロー"), court.indexOf("セパタクロー") + 4)).toEqual(["セパタクロー", "卓球", "テックボール", "テニス"]);
  });
});

describe("a sport of several surfaces", () => {
  it("is one chip, with its surfaces in the package's order under it", () => {
    const football = sportChips(SPORTS).find((chip) => chip.id === "football");
    expect(football).toMatchObject({ kind: "field", surfaces: ["nfl", "cfl", "ifaf"], word: "surfaceSport_football" });
    expect(sportChips(SPORTS).filter((chip) => ["nfl", "cfl", "ifaf"].includes(chip.id))).toEqual([]);
    for (const sport of ["nfl", "cfl", "ifaf"]) expect(groupOf(sport)).toBe("football");
    expect(groupOf("nhl")).toBeNull();
    // Every surface of a group is a surface of the package.
    for (const surfaces of Object.values(SURFACE_GROUPS)) for (const one of surfaces) expect(SPORTS).toContain(one);
  });

  it("chooses its first surface when it is pressed, and keeps the one on show when that is one of its own", () => {
    expect(surfaceOf({ chip: "football", variant: "nhl" })).toBe("nfl");
    expect(surfaceOf({ chip: "football", variant: "ifaf" })).toBe("ifaf");
    expect(surfaceOf({ chip: "tennis", variant: "cfl" })).toBe("tennis");
  });
});

describe("the address", () => {
  it("gives a choice for every surface key, and the choice gives the key back", () => {
    for (const sport of SPORTS) {
      const choice = choiceOf(sport);
      expect(choice.kind).toBe(kindOf(sport));
      expect(surfaceOf(choice)).toBe(sport);
    }
  });

  it("round trips every surface key through the page's state and the address it writes", async () => {
    const model = await import("../demo/model.js");
    for (const sport of SPORTS) {
      const state = model.makeState(new URLSearchParams(`sport=${sport}`), null);
      model.loadGame(state, state.sport, "en");
      const pairs = new URLSearchParams(model.urlPairs(state, "en").filter(([, value]) => value !== null));
      expect(pairs.get("sport")).toBe(sport);
      const again = model.makeState(pairs, null);
      expect(again.sport).toBe(sport);
      expect(surfaceOf(choiceOf(again.sport))).toBe(sport);
    }
  });
});

describe("the markup", () => {
  const say = sayIn("en");
  const count = (html, pattern) => (html.match(pattern) ?? []).length;

  it("has the address's kind and sport checked, the other kinds' sports hidden, and the group's row only for the group", () => {
    const html = pickerHtml(SPORTS, "cfl", say);
    expect(count(html, /role="radio"/g)).toBe(SURFACE_KINDS.length + sportChips(SPORTS).length + 3);
    expect(html).toMatch(/data-kind="field" aria-checked="true" tabindex="0"/);
    expect(html).toMatch(/data-chip="football" data-surfaces="nfl cfl ifaf" aria-checked="true"/);
    expect(html).toMatch(/data-group="football" data-value="cfl" aria-checked="true"/);
    expect(count(html, /aria-checked="true"/g)).toBe(3);
    expect(count(html, /data-kind="court"[^>]*hidden/g)).toBe(14);
    expect(pickerHtml(SPORTS, "nhl", say)).toMatch(/id="surface-variants"[^>]*hidden/);
  });

  it("marks only the surfaces the games' index names", () => {
    const marked = (html) => [...html.matchAll(/data-chip="([a-z]+)"[^>]*>(?:(?!<\/button>).)*?class="sk-game"[^>]*?(hidden)?>/g)].filter((m) => m[2] === undefined).map((m) => m[1]);
    expect(marked(pickerHtml(SPORTS, "nhl", say, ["nhl"]))).toEqual(["nhl"]);
    expect(marked(pickerHtml(SPORTS, "nhl", say, ["nhl", "cfl"])).sort()).toEqual(["football", "nhl"]);
    expect(marked(pickerHtml(SPORTS, "nhl", say, []))).toEqual([]);
  });
});
