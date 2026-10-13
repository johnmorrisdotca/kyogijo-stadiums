import { describe, expect, it } from "vitest";
import { FEET_PER_METRE } from "./geometry.ts";
import { PARKS, PARK_IDS, fenceFor, parkById, parkByWikidata, parkPointsIn, parkSourceUrl } from "./parks.ts";
import { PARK_DATA } from "./parks.data.ts";

describe("the ballparks", () => {
  const all = Object.values(PARKS);

  it("are the thirty current MLB parks, forty-four past ones, the twelve NPB home parks and eight secondary or past grounds", () => {
    expect(all.filter((p) => p.league === "MLB" && p.status === "current")).toHaveLength(30);
    expect(all.filter((p) => p.league === "MLB" && p.status === "past")).toHaveLength(44);
    expect(all.filter((p) => p.league === "MLB")).toHaveLength(74);
    expect(all.filter((p) => p.league === "NPB" && p.status === "current")).toHaveLength(12);
    expect(all.filter((p) => p.league === "NPB" && p.status !== "current")).toHaveLength(8);
    expect(all).toHaveLength(94);
    expect(new Set(PARK_IDS).size).toBe(PARK_IDS.length);
  });

  it("list the current MLB parks first, then the past ones by their first season, then the NPB's", () => {
    const leagues = PARK_IDS.map((id) => PARKS[id].league);
    expect(leagues.indexOf("NPB")).toBe(74);
    expect(PARK_IDS.slice(0, 30).every((id) => PARKS[id].status === "current")).toBe(true);
    const firsts = PARK_IDS.slice(30, 74).map((id) => PARKS[id].from ?? 0);
    expect(firsts).toEqual([...firsts].sort((a, b) => a - b));
  });

  it("each carry the Wikidata item of the ground, and no two share one", () => {
    for (const p of all) expect(p.wikidata, p.id).toMatch(/^Q[1-9]\d*$/);
    expect(new Set(all.map((p) => p.wikidata)).size).toBe(all.length);
    expect(parkByWikidata("Q49136")?.id).toBe("fenway-park");
    expect(parkByWikidata("Q1276360")?.id).toBe("polo-grounds");
    expect(parkByWikidata("Q733748")?.id).toBe("tokyo-dome");
    expect(parkByWikidata("Q8012748")?.id).toBe("hiroshima-municipal-stadium");
    expect(parkByWikidata("Q1")).toBeUndefined();
    expect(parkByWikidata(undefined)).toBeUndefined();
  });

  it("each cite an article of Wikipedia and a revision of it", () => {
    for (const p of all) {
      expect(p.en !== undefined || p.ja !== undefined, p.id).toBe(true);
      for (const [language, source] of [["en", p.en], ["ja", p.ja]] as const) {
        if (source === undefined) continue;
        expect(source.revision, p.id).toBeGreaterThan(1000);
        expect(parkSourceUrl(source, language)).toMatch(new RegExp(`^https://${language}\\.wikipedia\\.org/w/index\\.php\\?title=[^&]+&oldid=${source.revision}$`));
      }
    }
  });

  it("each have a fence from line to line whose angles rise and whose distances are those of a ballpark", () => {
    for (const p of all) {
      const angles = p.points.map((point) => point[0]);
      expect(angles[0], p.id).toBe(-45);
      expect(angles.at(-1), p.id).toBe(45);
      angles.forEach((a, i) => i > 0 && expect(a, p.id).toBeGreaterThan(angles[i - 1]));
      for (const [, feet] of p.points) {
        expect(feet, p.id).toBeGreaterThan(240);
        expect(feet, p.id).toBeLessThan(640);
      }
      // A park that stands today has a fence within the rules' limits.
      if (p.status === "current") {
        for (const [, feet] of p.points) {
          expect(feet, p.id).toBeGreaterThan(280);
          expect(feet, p.id).toBeLessThan(430);
        }
      }
    }
  });

  it("name each Japanese park in Japanese", () => {
    for (const p of all.filter((one) => one.league === "NPB")) {
      expect(p.nameJa, p.id).toMatch(/\S/);
      expect(p.teamJa, p.id).toMatch(/\S/);
    }
  });

  it("keep the published figures: Fenway's 310 and 302 feet, Tokyo Dome's 100 metres and 122 metres", () => {
    expect(parkById("fenway-park")?.points[0]).toEqual([-45, 310]);
    expect(parkById("fenway-park")?.points.at(-1)).toEqual([45, 302]);
    const dome = parkById("tokyo-dome");
    expect(dome?.points[0][1]).toBeCloseTo(100 * FEET_PER_METRE, 0);
    expect(dome?.points.find(([angle]) => angle === 0)?.[1]).toBeCloseTo(122 * FEET_PER_METRE, 0);
  });

  it("keep their unit in the data and convert to feet once", () => {
    const raw = PARK_DATA.find((p) => p.id === "tokyo-dome");
    expect(raw?.unit).toBe("m");
    expect(raw?.points[0][1]).toBe(100);
  });

  it("have a fence with a given distance laid over the park's, and the usual 330, 375, 400, 375 and 330 feet without a park", () => {
    expect(fenceFor(undefined, undefined).map((p) => p[1])).toEqual([330, 375, 400, 375, 330]);
    const wider = fenceFor(parkById("fenway-park"), { center: 420 });
    expect(wider.find(([a]) => a === 0)?.[1]).toBe(420);
    expect(wider[0]).toEqual([-45, 310]);
    expect(fenceFor(parkById("fenway-park"), { center: -5 })).toEqual(parkById("fenway-park")?.points);
  });

  // Each past MLB park: [key, Wikidata item, first season, last season, left field line, center field, right field line, points, periods].
  const PAST: [string, string, number, number, number, number, number, number, number][] = [
    ["baker-bowl", "Q4849117", 1887, 1938, 341, 408, 280, 4, 0],
    ["exposition-park-pittsburgh", "Q5421611", 1891, 1909, 400, 450, 400, 3, 0],
    ["polo-grounds", "Q1276360", 1891, 1963, 279, 483, 258, 13, 2],
    ["south-end-grounds", "Q6646308", 1894, 1914, 250, 440, 255, 6, 0],
    ["huntington-avenue-grounds", "Q1056422", 1901, 1911, 350, 635, 320, 4, 1],
    ["league-park-cleveland", "Q870897", 1901, 1946, 375, 420, 290, 6, 0],
    ["sportsmans-park", "Q7579980", 1902, 1966, 351, 422, 310, 6, 0],
    ["hilltop-park", "Q5764114", 1903, 1912, 365, 420, 385, 5, 0],
    ["forbes-field", "Q1963954", 1909, 1970, 365, 442, 300, 7, 1],
    ["shibe-park", "Q7496044", 1909, 1970, 334, 410, 329, 5, 3],
    ["comiskey-park", "Q1114772", 1910, 1990, 347, 409, 347, 5, 1],
    ["griffith-stadium", "Q5608924", 1911, 1961, 388, 421, 320, 5, 0],
    ["crosley-field", "Q3003747", 1912, 1970, 328, 387, 366, 5, 1],
    ["tiger-stadium", "Q1750255", 1912, 1999, 340, 440, 325, 5, 0],
    ["ebbets-field", "Q1278537", 1913, 1957, 348, 399, 297, 5, 1],
    ["braves-field", "Q11335096", 1915, 1952, 337, 390, 319, 5, 0],
    ["yankee-stadium-1923", "Q675214", 1923, 2008, 318, 408, 314, 5, 0],
    ["cleveland-stadium", "Q2113078", 1932, 1993, 322, 400, 322, 5, 0],
    ["milwaukee-county-stadium", "Q3314569", 1953, 2000, 315, 402, 315, 7, 0],
    ["baltimore-memorial-stadium", "Q2748739", 1954, 1991, 309, 405, 309, 5, 2],
    ["municipal-stadium-kansas-city", "Q6936283", 1955, 1972, 369, 421, 338, 5, 0],
    ["seals-stadium", "Q7440659", 1958, 1959, 361, 400, 348, 5, 1],
    ["candlestick-park", "Q1033076", 1960, 1999, 335, 400, 328, 5, 0],
    ["wrigley-field-los-angeles", "Q3297716", 1961, 1961, 340, 412, 339, 5, 0],
    ["metropolitan-stadium", "Q1415967", 1961, 1981, 343, 402, 330, 5, 0],
    ["colt-stadium", "Q5149429", 1962, 1964, 360, 420, 360, 7, 0],
    ["robert-f-kennedy-memorial-stadium", "Q153312", 1962, 2007, 335, 410, 335, 5, 0],
    ["shea-stadium", "Q1056326", 1964, 2008, 338, 410, 338, 9, 1],
    ["astrodome", "Q1025406", 1965, 1999, 325, 400, 325, 5, 0],
    ["atlanta-fulton-county-stadium", "Q641243", 1966, 1996, 330, 402, 330, 5, 2],
    ["busch-memorial-stadium", "Q1017286", 1966, 2005, 330, 402, 330, 5, 1],
    ["oakland-coliseum", "Q1147732", 1968, 2024, 330, 400, 330, 5, 0],
    ["sicks-stadium", "Q6127401", 1969, 1969, 305, 402, 325, 3, 0],
    ["jarry-park-stadium", "Q3495641", 1969, 1976, 340, 420, 340, 5, 0],
    ["three-rivers-stadium", "Q1189339", 1970, 2000, 335, 400, 335, 5, 0],
    ["riverfront-stadium", "Q153824", 1970, 2002, 330, 404, 330, 5, 0],
    ["veterans-stadium", "Q1545870", 1971, 2003, 330, 408, 330, 5, 0],
    ["arlington-stadium", "Q2861657", 1972, 1993, 330, 400, 330, 5, 0],
    ["exhibition-stadium", "Q1383747", 1977, 1989, 330, 400, 330, 5, 0],
    ["olympic-stadium-montreal", "Q285467", 1977, 2004, 325, 404, 325, 5, 1],
    ["metrodome", "Q1072186", 1982, 2009, 343, 408, 327, 5, 0],
    ["mile-high-stadium", "Q1934586", 1993, 1994, 333, 423, 370, 5, 0],
    ["globe-life-park-in-arlington", "Q1634492", 1994, 2019, 332, 400, 325, 5, 0],
    ["turner-field", "Q1150936", 1997, 2016, 335, 400, 330, 5, 0],
  ];

  it("keep the key figures of each of the forty-four past MLB parks", () => {
    expect(PAST).toHaveLength(44);
    for (const [id, wikidata, from, to, left, center, right, count, periods] of PAST) {
      const p = PARKS[id];
      expect(p, id).toBeDefined();
      expect(p.status, id).toBe("past");
      expect(p.league, id).toBe("MLB");
      expect(p.wikidata, id).toBe(wikidata);
      expect([p.from, p.to], id).toEqual([from, to]);
      expect(p.points[0], id).toEqual([-45, left]);
      expect(p.points.find(([angle]) => angle === 0)?.[1], id).toBe(center);
      expect(p.points.at(-1), id).toEqual([45, right]);
      expect(p.points, id).toHaveLength(count);
      expect(p.periods?.length ?? 0, id).toBe(periods);
      expect(p.en, id).toBeDefined();
      expect(p.country, id).toMatch(/^(US|CA)$/);
    }
    expect(PARK_IDS.filter((id) => PARKS[id].league === "MLB" && PARKS[id].status === "past").sort()).toEqual(PAST.map((row) => row[0]).sort());
  });

  it("give a past park's seasons, and its periods within them in order", () => {
    for (const p of all.filter((one) => one.status === "past" && one.league === "MLB")) {
      expect(p.from, p.id).toBeLessThanOrEqual(p.to as number);
      let last = -Infinity;
      for (const period of p.periods ?? []) {
        expect(period.from, p.id).toBeGreaterThan(last);
        expect(period.to, p.id).toBeGreaterThanOrEqual(period.from);
        expect(period.from, p.id).toBeGreaterThanOrEqual(p.from as number);
        expect(period.to, p.id).toBeLessThanOrEqual(p.to as number);
        expect(period.points[0][0], p.id).toBe(-45);
        expect(period.points.at(-1)?.[0], p.id).toBe(45);
        last = period.to;
      }
    }
  });

  it("move a fence with the season: the Polo Grounds' 500 feet to center until 1910, 433 to 1922 and 483 after", () => {
    const polo = parkById("polo-grounds") as NonNullable<ReturnType<typeof parkById>>;
    const centre = (points: readonly (readonly [number, number])[]): number | undefined => points.find(([angle]) => angle === 0)?.[1];
    expect(centre(parkPointsIn(polo, 1905))).toBe(500);
    expect(centre(parkPointsIn(polo, 1915))).toBe(433);
    expect(parkPointsIn(polo, 1915)[0]).toEqual([-45, 277]);
    expect(parkPointsIn(polo, 1930)).toBe(polo.points);
    expect(centre(parkPointsIn(polo, 1930))).toBe(483);
    expect(parkPointsIn(polo, undefined)).toBe(polo.points);
    expect(parkPointsIn(polo, Number.NaN)).toBe(polo.points);
    // A park whose fence the article gives once has nothing to choose.
    const fenway = parkById("fenway-park") as NonNullable<ReturnType<typeof parkById>>;
    expect(parkPointsIn(fenway, 1950)).toBe(fenway.points);
  });

  it("read the dated fences of Shibe Park, Huntington Avenue, Atlanta and Memorial Stadium as the articles date them", () => {
    const shibe = parkById("shibe-park") as NonNullable<ReturnType<typeof parkById>>;
    expect(parkPointsIn(shibe, 1912)[0]).toEqual([-45, 378]);
    expect(parkPointsIn(shibe, 1930).map((p) => p[1])).toEqual([334, 468, 331]);
    expect(parkPointsIn(shibe, 1960).map((p) => p[1])).toEqual([334, 420, 447, 405, 329]);
    expect(parkPointsIn(shibe, 1969).map((p) => p[1])).toEqual([334, 387, 410, 390, 329]);
    const huntington = parkById("huntington-avenue-grounds") as NonNullable<ReturnType<typeof parkById>>;
    expect(parkPointsIn(huntington, 1903).map((p) => p[1])).toEqual([350, 440, 530, 280]);
    expect(parkPointsIn(huntington, 1909).map((p) => p[1])).toEqual([350, 440, 635, 320]);
    const atlanta = parkById("atlanta-fulton-county-stadium") as NonNullable<ReturnType<typeof parkById>>;
    expect(parkPointsIn(atlanta, 1967).map((p) => p[1])).toEqual([330, 385, 402, 385, 330]);
    expect(parkPointsIn(atlanta, 1970).map((p) => p[1])).toEqual([330, 375, 402, 375, 330]);
    expect(parkPointsIn(atlanta, 1973).map((p) => p[1])).toEqual([330, 375, 402, 385, 330]);
    expect(parkPointsIn(atlanta, 1990).map((p) => p[1])).toEqual([330, 385, 402, 385, 330]);
    const memorial = parkById("baltimore-memorial-stadium") as NonNullable<ReturnType<typeof parkById>>;
    expect(parkPointsIn(memorial, 1960).map((p) => p[1])).toEqual([309, 446, 445, 446, 309]);
    expect(parkPointsIn(memorial, 1985).map((p) => p[1])).toEqual([309, 446, 405, 446, 309]);
    expect(parkPointsIn(memorial, 1991).map((p) => p[1])).toEqual([309, 378, 405, 378, 309]);
  });

  it("draw a past park in a season with that season's fence, and lay the caller's distances over it", () => {
    const polo = parkById("polo-grounds") as NonNullable<ReturnType<typeof parkById>>;
    expect(fenceFor(polo, undefined, 1915)).toBe(parkPointsIn(polo, 1915));
    expect(fenceFor(polo, undefined)).toBe(polo.points);
    expect(fenceFor(polo, { center: 400 }, 1915).find(([a]) => a === 0)?.[1]).toBe(400);
    expect(fenceFor(polo, { center: 400 }, 1915)[0]).toEqual([-45, 277]);
  });
});
