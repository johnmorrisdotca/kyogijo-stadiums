import { describe, expect, it } from "vitest";
import { drawKyogijo, SURFACE_UNITS as FROM_MAIN } from "./index.ts";
import { FOOTBALL, MLB, NBA, NHL, SURFACE_UNITS, UNITS, convertLength, convertPoint, dimensionsOf, fenceIn, fencePoints, DEFAULT_FENCE, isUnit, lengthsIn, surfaceSize } from "./geometry-entry.ts";
import { PARK_IDS, PARKS, parkUnit } from "./parks-entry.ts";

describe("units", () => {
  it("convert a length to every unit and back", () => {
    expect(convertLength(100, "yd", "ft")).toBe(300);
    expect(convertLength(200, "ft", "m")).toBeCloseTo(60.96, 10);
    expect(convertLength(1, "m", "cm")).toBeCloseTo(100, 10);
    expect(convertLength(1, "m", "mm")).toBeCloseTo(1000, 10);
    expect(convertLength(12, "in", "ft")).toBe(1);
    for (const a of UNITS) for (const b of UNITS) expect(convertLength(convertLength(123.456, a, b), b, a)).toBeCloseTo(123.456, 9);
  });

  it("refuse a unit that is not one", () => {
    expect(isUnit("furlong")).toBe(false);
    // @ts-expect-error a unit the package does not know
    expect(() => convertLength(1, "furlong", "ft")).toThrow(/Unknown unit/);
    // @ts-expect-error a unit the package does not know
    expect(() => lengthsIn({ a: 1 }, "furlong")).toThrow(/Unknown unit/);
  });

  it("keep each surface's rulebook unit: NFL and CFL in yards, NHL, NBA and baseball in feet, soccer, curling, volleyball, badminton and table tennis in metres, tennis and pickleball in feet, athletics in metres, the field sports in metres and cricket in yards", () => {
    expect(SURFACE_UNITS).toEqual({ nfl: "yd", cfl: "yd", ifaf: "yd", nhl: "ft", nba: "ft", mlb: "ft", soccer: "m", curling: "m", tennis: "ft", volleyball: "m", badminton: "m", pickleball: "ft", tabletennis: "m", athletics: "m", skating: "m", lacrosse: "m", rugby: "m", afl: "m", gaelic: "m", cricket: "yd", fieldhockey: "m", handball: "m" });
    expect(FROM_MAIN).toBe(SURFACE_UNITS);
  });

  it("give the size of a surface in its own unit, or in any", () => {
    expect(surfaceSize("nfl")).toEqual({ length: 120, width: 160 / 3, unit: "yd" });
    expect(surfaceSize("cfl").length).toBe(150);
    expect(surfaceSize("nhl")).toEqual({ length: 200, width: 85, unit: "ft" });
    expect(surfaceSize("nba", "yd").length).toBeCloseTo(94 / 3, 10);
    expect(surfaceSize("nhl", "m").width).toBeCloseTo(25.908, 10);
    // @ts-expect-error a ballpark has no fixed size
    expect(() => surfaceSize("mlb")).toThrow(/fence/);
  });

  it("round-trip a whole table of dimensions across units", () => {
    for (const unit of UNITS) {
      const there = lengthsIn(NHL, unit);
      const back = lengthsIn(there, "ft", unit);
      expect(back.length).toBeCloseTo(NHL.length, 9);
      expect(back.crease.radius).toBeCloseTo(NHL.crease.radius, 9);
      expect(back.net.depth).toBeCloseTo(NHL.net.depth, 9);
      expect(back.circleRadius).toBeCloseTo(15, 9);
    }
    const nba = dimensionsOf("nba", "m");
    expect(nba.length).toBeCloseTo(28.6512, 6);
    expect(nba.laneMarks).toHaveLength(4);
    expect(nba.laneMarks[0]).toBeCloseTo(7 * 0.3048, 9);
    expect(dimensionsOf("mlb", "m").pitcher).toBeCloseTo(60.5 * 0.3048, 9);
    expect(lengthsIn(MLB, "ft")).toEqual(MLB);
  });

  it("keep a football spec's names and flags, and the rulebook unit by default", () => {
    const nfl = dimensionsOf("nfl");
    expect(nfl.id).toBe("nfl");
    expect(nfl.posts).toBe("end-line");
    expect(nfl.length).toBe(100);
    expect(nfl.endZone).toBe(10);
    expect(nfl.width).toBeCloseTo(160 / 3, 10);
    expect(nfl.numbers[0]).toBeCloseTo(12, 10);
    expect(FOOTBALL.nfl.length).toBe(300);
  });

  it("leave the table that was given as it was", () => {
    const before = JSON.stringify(NBA);
    lengthsIn(NBA, "m");
    expect(JSON.stringify(NBA)).toBe(before);
  });

  it("convert a point, and a fence's distances but not its angles", () => {
    expect(convertPoint([3, 6], "yd", "ft")).toEqual([9, 18]);
    const fence = fenceIn(fencePoints(DEFAULT_FENCE), "m");
    expect(fence.map(([angle]) => angle)).toEqual([-45, -22.5, 0, 22.5, 45]);
    expect(fence[2][1]).toBeCloseTo(121.92, 10);
    expect(fenceIn(fence, "ft", "m")[2][1]).toBeCloseTo(400, 9);
  });

  it("know which parks were measured in metres, and which in feet", () => {
    expect(parkUnit("hanshin-koshien-stadium")).toBe("m");
    expect(parkUnit("fenway-park")).toBe("ft");
    expect(parkUnit("nowhere")).toBeUndefined();
    expect(PARK_IDS.filter((id) => parkUnit(id) === "m").every((id) => PARKS[id].country === "JP")).toBe(true);
  });
});

describe("the drawing's units option", () => {
  const base = { sport: "mlb", id: "u", style: "none" } as const;

  it("takes the margin in its unit: 3.048 metres is the same drawing as 10 feet", () => {
    expect(drawKyogijo({ ...base, margin: 3.048, units: "m" }).replace(/ data-version="[^"]*"/, "")).toBe(drawKyogijo({ ...base, margin: 10 }).replace(/ data-version="[^"]*"/, ""));
  });

  it("takes the fence in its unit: a 95-metre line and a 122-metre middle are the feet they convert to", () => {
    const metres = drawKyogijo({ ...base, fence: { left: 95, right: 95, center: 122 }, units: "m" });
    const feet = drawKyogijo({ ...base, fence: { left: 95 / 0.3048, right: 95 / 0.3048, center: 122 / 0.3048 } });
    expect(metres).toBe(feet);
    expect(metres).not.toBe(drawKyogijo({ ...base, fence: { left: 95, right: 95, center: 122 } }));
  });

  it("draws the same with units: feet as with none", () => {
    expect(drawKyogijo({ ...base, margin: 10, units: "ft" })).toBe(drawKyogijo({ ...base, margin: 10 }));
  });

  it("takes yards for a football field's margin", () => {
    expect(drawKyogijo({ sport: "nfl", id: "u", margin: 4, units: "yd" })).toBe(drawKyogijo({ sport: "nfl", id: "u", margin: 12 }));
  });

  it("refuses a unit it does not know instead of drawing in feet", () => {
    // @ts-expect-error a unit the package does not know
    expect(() => drawKyogijo({ ...base, units: "furlong" })).toThrow(/Unknown units/);
  });
});
