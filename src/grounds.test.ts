import { describe, expect, it } from "vitest";
import { drawKyogijo, describe as describeDrawing } from "./draw.ts";
import { optionsFromAttributes } from "./element.ts";
import { GROUNDS, GROUND_IDS, groundById, groundByWikidata, groundNameIn, groundSourceUrl, groundsHosting } from "./grounds.ts";
import { soccerPitchClass } from "./surfaces/soccer-spec.ts";

const all = Object.values(GROUNDS);

/** Rough boxes round each country: [south, north, west, east]. A sign slipped in a coordinate puts a ground in the sea. */
const BOXES: Record<string, [number, number, number, number]> = {
  UY: [-35.1, -30, -58.5, -53], IT: [36, 47.2, 6.5, 18.6], FR: [41, 51.2, -5.5, 9.7], BR: [-34, 5.5, -74, -34], CH: [45.7, 47.9, 5.9, 10.6], SE: [55, 69.1, 10.9, 24.2],
  CL: [-56, -17, -76, -66], GB: [49.8, 60.9, -8.7, 1.8], MX: [14.5, 32.8, -118.5, -86.5], DE: [47.2, 55.1, 5.8, 15.1], AR: [-55.1, -21.7, -73.6, -53.6], ES: [36, 43.9, -9.4, 3.4],
  US: [24.4, 49.5, -125, -66.9], JP: [24, 45.6, 122.9, 146], ZA: [-35, -22, 16.4, 33], RU: [41, 82, 27, 180], QA: [24.4, 26.2, 50.7, 51.7], CA: [41.6, 83.2, -141, -52.5],
  CN: [18, 53.6, 73.5, 135.1], AU: [-44, -10, 112, 154], PT: [36.9, 42.2, -9.6, -6.1], KR: [33, 38.7, 124.5, 132], NL: [50.7, 53.6, 3.3, 7.3],
};

describe("the grounds", () => {
  it("number sixty-four: 28 hosts of a final, 13 other venues of 2026 and 23 club and other grounds", () => {
    expect(all).toHaveLength(64);
    expect(new Set(GROUND_IDS).size).toBe(64);
    const finals = all.filter((g) => g.tournaments.some((t) => t.final));
    const in2026 = (g: (typeof all)[number]): boolean => g.tournaments.some((t) => t.competition === "world-cup" && t.year === 2026);
    expect(all.filter((g) => g.tournaments.some((t) => t.competition === "world-cup" && t.final))).toHaveLength(21);
    expect(finals).toHaveLength(28);
    expect(all.filter((g) => !finals.includes(g) && in2026(g))).toHaveLength(13);
    expect(all.filter((g) => !finals.includes(g) && !in2026(g))).toHaveLength(23);
  });

  it("list the venues of 2026 and the finals of every World Cup, men's and Women's", () => {
    expect(groundsHosting("world-cup", 2026)).toHaveLength(16);
    expect(groundsHosting("world-cup", 2026).map((g) => g.id)).toEqual(expect.arrayContaining(["metlife-stadium", "bc-place", "estadio-azteca", "bmo-field", "estadio-bbva"]));
    const finalOf = (competition: "world-cup" | "womens-world-cup", year: number): string | undefined => all.find((g) => g.tournaments.some((t) => t.competition === competition && t.year === year && t.final))?.id;
    const men = [1930, 1934, 1938, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026];
    for (const year of men) expect(finalOf("world-cup", year), String(year)).toBeDefined();
    // 1950 had a final round and no final: the ground is there, the final is not.
    expect(finalOf("world-cup", 1950)).toBeUndefined();
    expect(groundsHosting("world-cup", 1950).map((g) => g.id)).toEqual(["maracana"]);
    for (const year of [1991, 1995, 1999, 2003, 2007, 2011, 2015, 2019, 2023]) expect(finalOf("womens-world-cup", year), String(year)).toBeDefined();
    expect(finalOf("world-cup", 1930)).toBe("estadio-centenario");
    expect(finalOf("world-cup", 1966)).toBe("wembley-1923");
    expect(finalOf("world-cup", 2002)).toBe("nissan-stadium-yokohama");
    expect(finalOf("world-cup", 2010)).toBe("soccer-city");
    expect(finalOf("world-cup", 2022)).toBe("lusail");
    expect(finalOf("world-cup", 2026)).toBe("metlife-stadium");
    expect(finalOf("womens-world-cup", 2003)).toBe("dignity-health-sports-park");
    expect(finalOf("womens-world-cup", 2023)).toBe("stadium-australia");
    // One final to a tournament, and a final ground is one of its tournament's grounds.
    for (const g of all) for (const t of g.tournaments) expect(groundsHosting(t.competition, t.year)).toContain(g);
  });

  it("each have a key, a Wikidata item no other ground has, a city and a country", () => {
    for (const g of all) {
      expect(g.id, g.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(g.wikidata, g.id).toMatch(/^Q[1-9]\d*$/);
      expect(g.city.length, g.id).toBeGreaterThan(1);
      expect(g.country, g.id).toMatch(/^[A-Z]{2}$/);
      expect(Object.keys(BOXES), g.id).toContain(g.country);
    }
    expect(new Set(all.map((g) => g.wikidata)).size).toBe(all.length);
    expect(groundByWikidata("Q155174")?.id).toBe("maracana");
    expect(groundByWikidata("Q498245")?.id).toBe("estadio-centenario");
    expect(groundByWikidata("Q10862290")?.id).toBe("metlife-stadium");
    expect(groundByWikidata("Q1186333")?.id).toBe("lusail");
    expect(groundByWikidata("Q43279")?.id).toBe("wembley-1923");
    expect(groundByWikidata("Q128468")?.id).toBe("wembley");
    expect(groundByWikidata("Q1")).toBeUndefined();
    expect(groundByWikidata(undefined)).toBeUndefined();
    expect(groundById("maracana")?.name).toBe("Maracanã Stadium");
    expect(groundById("nope")).toBeUndefined();
    expect(groundById(undefined)).toBeUndefined();
    expect(groundById("constructor")).toBeUndefined();
  });

  it("each have coordinates in range, and inside a box round their country", () => {
    for (const g of all) {
      expect(g.lat, g.id).toBeGreaterThanOrEqual(-90);
      expect(g.lat, g.id).toBeLessThanOrEqual(90);
      expect(g.lon, g.id).toBeGreaterThanOrEqual(-180);
      expect(g.lon, g.id).toBeLessThanOrEqual(180);
      const [south, north, west, east] = BOXES[g.country];
      expect(g.lat, `${g.id} lat`).toBeGreaterThanOrEqual(south);
      expect(g.lat, `${g.id} lat`).toBeLessThanOrEqual(north);
      expect(g.lon, `${g.id} lon`).toBeGreaterThanOrEqual(west);
      expect(g.lon, `${g.id} lon`).toBeLessThanOrEqual(east);
    }
    expect(GROUNDS["maracana"].lat).toBeCloseTo(-22.912, 2);
    expect(GROUNDS["maracana"].lon).toBeCloseTo(-43.23, 2);
  });

  it("each have a pitch at its own size, or are marked as at the default size", () => {
    for (const g of all) {
      expect(g.pitch.length, g.id).toBeGreaterThan(g.pitch.width);
      expect(g.pitch.width, g.id).toBeGreaterThan(0);
      if (g.pitchSize === "published") {
        // A published size is a pitch for international matches, to the centimetre.
        expect(soccerPitchClass(g.pitch.length, g.pitch.width), g.id).toBe("international");
        expect(Math.round(g.pitch.length * 100) / 100, g.id).toBe(g.pitch.length);
      } else {
        expect(g.pitchSize, g.id).toBe("default");
        expect(g.pitch, g.id).toEqual({ length: 105, width: 68 });
        expect(g.pitchUnit, g.id).toBe("m");
      }
    }
    expect(all.filter((g) => g.pitchSize === "default")).toHaveLength(22);
    expect(all.filter((g) => g.pitchSize === "published")).toHaveLength(42);
    // Sizes the articles publish, in the unit they publish them in.
    expect(GROUNDS["anfield"].pitch).toEqual({ length: 101, width: 68 });
    expect(GROUNDS["monumental"].pitch).toEqual({ length: 105, width: 70 });
    expect(GROUNDS["wembley"].pitch).toEqual({ length: 105.16, width: 67.67 });
    expect(GROUNDS["wembley"].pitchUnit).toBe("yd");
    expect(GROUNDS["stamford-bridge"].pitch).toEqual({ length: 103, width: 67.5 });
    expect(GROUNDS["lumen-field"].pitchUnit).toBe("yd");
    // A figure that is not a pitch, or not one for an international match, is not used and the note says why.
    for (const id of ["rose-bowl", "stade-de-france", "stadium-australia", "kashima-soccer-stadium"]) {
      expect(GROUNDS[id].pitchSize, id).toBe("default");
      expect(GROUNDS[id].pitchNote, id).toMatch(/not used|\.$/);
    }
    // No size is guessed: a ground with no figure in its article is at the default.
    for (const id of ["lusail", "metlife-stadium", "wankdorf", "wembley-1923", "seoul-world-cup-stadium", "parc-des-princes"]) expect(GROUNDS[id].pitchSize, id).toBe("default");
  });

  it("each cite an English article and a revision of it, and the Japanese article of their name in Japanese", () => {
    for (const g of all) {
      expect(g.en.title.length, g.id).toBeGreaterThan(2);
      expect(g.en.revision, g.id).toBeGreaterThan(1000);
      expect(g.ja.revision, g.id).toBeGreaterThan(1000);
      expect(g.nameJa, g.id).toMatch(/[぀-ヿ一-鿿A-Za-z]/u);
      expect(groundSourceUrl(g.en)).toMatch(new RegExp(`^https://en\\.wikipedia\\.org/w/index\\.php\\?title=[^&]+&oldid=${g.en.revision}$`));
      expect(groundSourceUrl(g.ja, "ja")).toMatch(new RegExp(`^https://ja\\.wikipedia\\.org/w/index\\.php\\?title=[^&]+&oldid=${g.ja.revision}$`));
    }
  });

  it("have the name in the language of the place where it is not English, and Japanese for the grounds of Japan", () => {
    expect(GROUNDS["maracana"].localName).toBe("Maracanã");
    expect(GROUNDS["maracana"].localLanguage).toBe("pt");
    expect(GROUNDS["santiago-bernabeu"].localName).toBe("Estadio Santiago Bernabéu");
    expect(GROUNDS["signal-iduna-park"].localLanguage).toBe("de");
    expect(GROUNDS["luzhniki"].localLanguage).toBe("ru");
    expect(GROUNDS["tianhe-stadium"].localLanguage).toBe("zh");
    expect(GROUNDS["seoul-world-cup-stadium"].localName).toBe("서울월드컵경기장");
    for (const id of all.filter((g) => g.country === "JP").map((g) => g.id)) {
      expect(GROUNDS[id].localLanguage, id).toBe("ja");
      expect(GROUNDS[id].localName, id).toBe(GROUNDS[id].nameJa);
    }
    expect(GROUNDS["saitama-stadium-2002"].localName).toBe("埼玉スタジアム2002");
    expect(GROUNDS["nissan-stadium-yokohama"].localName).toBe("日産スタジアム");
    expect(GROUNDS["san-siro"].localName).toBe("San Siro");
    // The English-speaking places have none, and a name is not given twice for the same language.
    for (const id of ["old-trafford", "rose-bowl", "bmo-field", "stadium-australia", "soccer-city"]) expect(GROUNDS[id].localName, id).toBeUndefined();
    for (const g of all) expect(g.localName === undefined, g.id).toBe(g.localLanguage === undefined);
  });

  it("know the names a ground had, in the year", () => {
    expect(groundNameIn(GROUNDS["soccer-city"], 2010)).toBe("Soccer City");
    expect(groundNameIn(GROUNDS["soccer-city"], 2012)).toBe("FNB Stadium");
    expect(groundNameIn(GROUNDS["soccer-city"])).toBe("FNB Stadium");
    expect(groundNameIn(GROUNDS["nissan-stadium-yokohama"], 2002)).toBe("International Stadium Yokohama");
    expect(groundNameIn(GROUNDS["nissan-stadium-yokohama"], 2005)).toBe("Nissan Stadium");
    expect(groundNameIn(GROUNDS["hard-rock-stadium"], 1994)).toBe("Joe Robbie Stadium");
    expect(groundNameIn(GROUNDS["hard-rock-stadium"], 2005)).toBe("Dolphins Stadium");
    expect(groundNameIn(GROUNDS["hard-rock-stadium"], 2020)).toBe("Hard Rock Stadium");
    expect(groundNameIn(GROUNDS["hard-rock-stadium"], 2026)).toBe("Miami Stadium");
    expect(groundNameIn(GROUNDS["metlife-stadium"], 2026)).toBe("New York New Jersey Stadium");
    expect(groundNameIn(GROUNDS["metlife-stadium"], 2025)).toBe("MetLife Stadium");
    expect(groundNameIn(GROUNDS["lumen-field"], 2008)).toBe("Qwest Field");
    expect(groundNameIn(GROUNDS["estadio-azteca"], 1998)).toBe("Estadio Guillermo Cañedo");
    expect(groundNameIn(GROUNDS["estadio-azteca"], 1986)).toBe("Estadio Azteca");
    expect(groundNameIn(GROUNDS["waldstadion-frankfurt"], 1974)).toBe("Waldstadion");
    expect(groundNameIn(GROUNDS["waldstadion-frankfurt"], 2006)).toBe("FIFA World Cup Stadium Frankfurt");
    expect(groundNameIn(GROUNDS["waldstadion-frankfurt"], 2011)).toBe("FIFA Women's World Cup Stadium Frankfurt");
    expect(groundNameIn(GROUNDS["waldstadion-frankfurt"], 2015)).toBe("Commerzbank-Arena");
    expect(groundNameIn(GROUNDS["waldstadion-frankfurt"], 2024)).toBe("Deutsche Bank Park");
    expect(groundNameIn(GROUNDS["estadio-nacional-santiago"], 1962)).toBe("Estadio Nacional");
    expect(groundNameIn(GROUNDS["maracana"], 1950)).toBe("Estádio Municipal");
    expect(groundNameIn(GROUNDS["maracana"], 2014)).toBe("Maracanã Stadium");
    expect(groundNameIn(GROUNDS["maracana"], Number.NaN)).toBe("Maracanã Stadium");
    // In Japanese a ground has one name for every year.
    expect(groundNameIn(GROUNDS["soccer-city"], 2010, "ja")).toBe(GROUNDS["soccer-city"].nameJa);
    for (const g of all) {
      let last = 0;
      for (const period of g.names ?? []) {
        expect(period.from, g.id).toBeLessThanOrEqual(period.to);
        expect(period.from, `${g.id} ${period.name}`).toBeGreaterThanOrEqual(last);
        last = period.from;
      }
    }
  });

  it("have years that fit: a ground opens before it closes, and a past one closed", () => {
    for (const g of all) {
      if (g.status === "past") {
        expect(g.to, g.id).toBeGreaterThanOrEqual(g.from ?? 0);
        expect(g.to, g.id).toBeLessThan(2026);
      } else expect(g.to, g.id).toBeUndefined();
      for (const t of g.tournaments) if (g.from !== undefined) expect(t.year, `${g.id} ${t.year}`).toBeGreaterThanOrEqual(g.from);
      if (g.to !== undefined) for (const t of g.tournaments) expect(t.year, `${g.id} ${t.year}`).toBeLessThanOrEqual(g.to);
    }
    expect(GROUNDS["wembley-1923"]).toMatchObject({ status: "past", from: 1923, to: 2000 });
    expect(GROUNDS["wembley"]).toMatchObject({ status: "current", from: 2007 });
    expect(GROUNDS["wankdorf"].status).toBe("past");
    expect(GROUNDS["rasunda"].status).toBe("past");
  });
});

describe("drawing a ground", () => {
  const draw = (o: Record<string, unknown>): string => drawKyogijo({ sport: "soccer", id: "g", ...o });

  it("draws the pitch at the ground's size, as a pitch of that size would be", () => {
    const sized = (id: string, length: number, width: number): void => {
      const a = draw({ ground: id, title: "t", description: "d" });
      const b = draw({ pitch: { length, width, unit: "m" }, title: "t", description: "d" });
      expect(a, id).toBe(b);
    };
    sized("anfield", 101, 68);
    sized("monumental", 105, 70);
    sized("stamford-bridge", 103, 67.5);
    sized("nissan-stadium-yokohama", 107, 72);
    // A ground with no published size is drawn as the international pitch.
    expect(draw({ ground: "lusail", title: "t", description: "d" })).toBe(draw({ title: "t", description: "d" }));
    expect(draw({ ground: "anfield" })).not.toBe(draw({ ground: "old-trafford" }));
  });

  it("names the drawing for the ground, and for its name in the year", () => {
    expect(describeDrawing({ sport: "soccer", ground: "maracana" }).title).toBe("Maracanã Stadium, soccer pitch");
    expect(describeDrawing({ sport: "soccer", ground: "maracana", year: 1950 }).title).toBe("Estádio Municipal, soccer pitch");
    expect(describeDrawing({ sport: "soccer", ground: "metlife-stadium", year: 2026 }).title).toBe("New York New Jersey Stadium, soccer pitch");
    expect(describeDrawing({ sport: "soccer", ground: "soccer-city", year: 2010, language: "en" }).title).toBe("Soccer City, soccer pitch");
    expect(describeDrawing({ sport: "soccer", ground: "maracana", language: "ja" }).title).toBe(`${GROUNDS["maracana"].nameJa}のピッチ`);
    expect(draw({ ground: "maracana" })).toContain("<title");
    expect(draw({ ground: "maracana" })).toContain("Maracanã Stadium, soccer pitch");
    expect(describeDrawing({ sport: "soccer", ground: "maracana", title: "Mine" }).title).toBe("Mine");
  });

  it("says in the description whether the size is the published one", () => {
    expect(describeDrawing({ sport: "soccer", ground: "anfield" }).description).toContain("101 by 68 metres");
    expect(describeDrawing({ sport: "soccer", ground: "anfield" }).description).toContain("The pitch follows the size published for Anfield.");
    expect(describeDrawing({ sport: "soccer", ground: "metlife-stadium" }).description).toContain("No pitch size is published for MetLife Stadium, so the pitch has the international size of 105 by 68 metres.");
    expect(describeDrawing({ sport: "soccer", ground: "anfield", language: "ja" }).description).toContain("公表されている広さ");
    expect(describeDrawing({ sport: "soccer", ground: "metlife-stadium", language: "ja" }).description).toContain("公表されていない");
    // In a score the title is the score, and the description still names the size.
    const score = describeDrawing({ sport: "soccer", ground: "anfield", away: { name: "Away", score: 1 }, home: { name: "Home", score: 0 } });
    expect(score.title).toBe("Home 0, Away 1");
    expect(score.description).toContain("follows the size published for Anfield");
  });

  it("lets a pitch of the caller's win over the ground's size, and ignores what is not a ground", () => {
    const own = draw({ ground: "anfield", pitch: { length: 100, width: 64, unit: "m" } });
    expect(own).toContain("100 by 64 metres");
    expect(own).not.toContain("follows the size published");
    expect(own).toContain("Anfield, soccer pitch");
    expect(draw({ ground: "nowhere" })).toBe(draw({}));
    expect(draw({ ground: "constructor" })).toBe(draw({}));
    // A small-sided pitch or a futsal court keeps its own name.
    expect(describeDrawing({ sport: "soccer", ground: "anfield", pitch: "futsal" }).title).toBe("Futsal court");
    expect(describeDrawing({ sport: "soccer", ground: "anfield", pitch: "7-a-side" }).title).toBe("Soccer pitch");
    // Only soccer has grounds.
    expect(drawKyogijo({ sport: "nhl", id: "g", ground: "anfield" })).toBe(drawKyogijo({ sport: "nhl", id: "g" }));
  });

  it("is read from the element's ground attribute", () => {
    const attrs: Record<string, string> = { sport: "soccer", ground: "anfield", year: "1990" };
    const options = optionsFromAttributes((name) => attrs[name] ?? null);
    expect(options).toMatchObject({ sport: "soccer", ground: "anfield", year: 1990 });
  });
});
