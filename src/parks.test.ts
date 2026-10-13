import { describe, expect, it } from "vitest";
import { FEET_PER_METRE } from "./geometry.ts";
import { PARKS, PARK_IDS, fenceFor, parkById, parkSourceUrl } from "./parks.ts";
import { PARK_DATA } from "./parks.data.ts";

describe("the ballparks", () => {
  const all = Object.values(PARKS);

  it("are the thirty MLB parks, the twelve NPB home parks and eight secondary or historic grounds", () => {
    expect(all.filter((p) => p.league === "MLB")).toHaveLength(30);
    expect(all.filter((p) => p.league === "NPB" && p.status === "current")).toHaveLength(12);
    expect(all.filter((p) => p.league === "NPB" && p.status !== "current")).toHaveLength(8);
    expect(new Set(PARK_IDS).size).toBe(PARK_IDS.length);
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
        expect(feet, p.id).toBeGreaterThan(280);
        expect(feet, p.id).toBeLessThan(430);
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
});
