import { describe, expect, it } from "vitest";
import { FRAMES, RETROSHEET_ZONES, attackingIn, convert, convertPoints, flipEnds, frameByName, framesOf, fromSurface, piecewise, registerFrame, span, toSurface, zoneAt, zoneToPoint, type Frame, type Point } from "./frames-entry.ts";
import { NBA, NHL, threePointJoin } from "./geometry-entry.ts";

const near = (actual: readonly number[], expected: readonly number[], digits = 6): void => {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((value, i) => expect(actual[i]).toBeCloseTo(value, digits));
};

/** A point both ways: onto the surface and back. */
function both(name: string, point: Point, surface: Point, options: { digits?: number } = {}): void {
  near(toSurface([point], { from: name })[0], surface, options.digits ?? 6);
  near(fromSurface([surface], { to: name })[0], point, options.digits ?? 6);
}

describe("the piecewise mapper", () => {
  it("is straight between two landmarks, and goes on beyond them", () => {
    const m = piecewise(span(0, 600, 0, 200));
    expect(m.forward(300)).toBe(100);
    expect(m.forward(-30)).toBe(-10);
    expect(m.inverse(250)).toBe(750);
  });

  it("bends at each landmark, and undoes itself, rising or falling", () => {
    const rising = piecewise([[0, 0], [50, 10], [100, 100]]);
    expect(rising.forward(25)).toBe(5);
    expect(rising.forward(75)).toBe(55);
    expect(rising.inverse(55)).toBe(75);
    const falling = piecewise([[0, 100], [10, 50], [20, 0]]);
    expect(falling.forward(5)).toBe(75);
    expect(falling.inverse(75)).toBe(5);
    expect(piecewise([[100, 100], [0, 0], [50, 10]]).forward(25)).toBe(5);
  });

  it("refuses landmarks that cannot be undone", () => {
    expect(() => piecewise([[0, 0]])).toThrow(/two landmarks/);
    expect(() => piecewise([[0, 0], [0, 5]])).toThrow(/stand at 0/);
    expect(() => piecewise([[0, 0], [1, 5], [2, 3]])).toThrow(/rise or all fall/);
    expect(() => piecewise([[0, 0], [1, 0]])).toThrow(/rise or all fall/);
    expect(() => piecewise([[0, 0], [1, NaN]])).toThrow(/finite/);
  });
});

describe("the NHL API's frame (feet from centre ice)", () => {
  it("puts centre ice in the middle of the rink and the corners at the corners", () => {
    both("nhl-api", [0, 0], [100, 42.5]);
    both("nhl-api", [-100, 42.5], [0, 0]);
    both("nhl-api", [100, -42.5], [200, 85]);
  });

  it("puts the end-zone face-off dots 69 feet from centre ice and 22 feet either side", () => {
    both("nhl-api", [69, 22], [100 + 69, 42.5 - 22]);
    // The dot is 20 feet out from the goal line, which is 11 feet from the end boards: 31 feet from the end, 169 from the other.
    expect(toSurface([[69, 22]], { from: "nhl-api" })[0][0]).toBe(NHL.length - NHL.goalLine - NHL.endSpotFromGoalLine);
    expect(toSurface([[69, 22]], { from: "nhl-api" })[0][1]).toBe(NHL.width / 2 - NHL.spotOffset);
  });

  it("puts a blue line 25 feet from centre ice", () => {
    expect(toSurface([[25, 0]], { from: "nhl-api" })[0][0]).toBe(NHL.length - NHL.blueLine);
  });
});

describe("HockeyTech's 600 by 300 canvas", () => {
  it("puts the canvas's middle at centre ice and its corners at the boards", () => {
    both("hockeytech", [300, 150], [100, 42.5]);
    both("hockeytech", [0, 0], [0, 0]);
    both("hockeytech", [600, 300], [200, 85]);
  });

  it("puts a face-off dot where the NHL API puts it", () => {
    // 69 feet on is 300 + 207 along the canvas; 22 feet across is 22 * 300 / 85 canvas units.
    both("hockeytech", [507, 150 - (22 * 300) / 85], [169, 42.5 - 22]);
  });

  it("converts to the NHL API's frame and back", () => {
    near(convert("hockeytech", "nhl-api")([[300, 150]])[0], [0, 0]);
    near(convert("hockeytech", "nhl-api")([[600, 0]])[0], [100, 42.5]);
    near(convertPoints([[100, 42.5]], "nhl-api", "hockeytech")[0], [600, 0]);
  });
});

describe("the NBA's legacy shot coordinates (tenths of a foot from the hoop)", () => {
  const basket = NBA.length - NBA.basket;

  it("puts the hoop at the basket attacked and the baseline behind it", () => {
    both("nba-stats", [0, 0], [basket, NBA.width / 2]);
    both("nba-stats", [0, -52.5], [NBA.length, NBA.width / 2]);
  });

  it("puts the free-throw line 19 feet from the baseline, centred", () => {
    both("nba-stats", [0, 137.5], [NBA.length - NBA.freeThrowLine, 25]);
  });

  it("puts a corner three on the three-point line's straight, 3 feet from the sideline, on the shooter's left at a negative x", () => {
    const [x, y] = toSurface([[-220, 0]], { from: "nba-stats" })[0];
    near([x, y], [basket, NBA.threePoint.sideInset]);
    near(toSurface([[220, 0]], { from: "nba-stats" })[0], [basket, NBA.width - NBA.threePoint.sideInset]);
  });

  it("puts the top of the arc 23 feet 9 inches from the basket", () => {
    both("nba-stats", [0, 237.5], [basket - NBA.threePoint.radius, 25]);
    expect(threePointJoin()).toBeGreaterThan(14);
  });

  it("puts a shot at the other basket when the team attacks left", () => {
    near(toSurface([[0, 0]], { from: "nba-stats", attacking: "left" })[0], [NBA.basket, NBA.width / 2]);
    near(toSurface([[-220, 0]], { from: "nba-stats", attacking: "left" })[0], [NBA.basket, NBA.width - NBA.threePoint.sideInset]);
    near(fromSurface([[NBA.basket, 25]], { to: "nba-stats", attacking: "left" })[0], [0, 0]);
  });
});

describe("NFL tracking data (yards)", () => {
  it("puts the middle of the field at its middle", () => {
    both("nfl-tracking", [60, 160 / 6], [180, 80]);
  });

  it("puts the corners at the corners: the origin is the bottom left, y up", () => {
    both("nfl-tracking", [0, 0], [0, 160]);
    both("nfl-tracking", [120, 160 / 3], [360, 0]);
  });

  it("puts the goal lines at 10 and 110 and a hash mark where the rulebook does", () => {
    both("nfl-tracking", [10, 0], [30, 160]);
    both("nfl-tracking", [110, 0], [330, 160]);
    // 70 feet 9 inches in from the near sideline.
    near(toSurface([[60, 70.75 / 3]], { from: "nfl-tracking" })[0], [180, 160 - 70.75]);
  });

  it("is turned a half turn when the team attacks left", () => {
    near(toSurface([[10, 0]], { from: "nfl-tracking", attacking: "left" })[0], [330, 0]);
  });
});

describe("MLBAM and Statcast hit coordinates", () => {
  it("puts home plate at the origin", () => {
    both("mlbam", [125.42, 198.27], [0, 0]);
  });

  it("puts a ball hit straight out (smaller hc_y) in front of the plate, towards the fence", () => {
    // 2.5 feet a unit: 100 units up the image is 250 feet out, as minus on the surface.
    both("mlbam", [125.42, 98.27], [0, -250]);
  });

  it("puts a ball hit to right field (larger hc_x) at a positive x", () => {
    both("mlbam", [225.42, 198.27], [250, 0]);
    expect(toSurface([[100, 100]], { from: "mlbam" })[0][0]).toBeLessThan(0);
  });

  it("puts a ball at the middle of the image up the middle", () => {
    expect(toSurface([[125.42, 120]], { from: "mlbam" })[0][0]).toBe(0);
  });

  it("has no ends to attack", () => {
    expect(() => toSurface([[125, 100]], { from: "mlbam", attacking: "left" })).toThrow(/no ends/);
  });
});

describe("Retrosheet's hit locations", () => {
  it("has a place for every zone of the diagram, with its centre in the right sector", () => {
    expect(Object.keys(RETROSHEET_ZONES)).toHaveLength(68);
    expect(zoneToPoint("8D")).toEqual([0, 330]);
    expect(zoneToPoint("8d")).toEqual([0, 330]);
    expect(zoneToPoint("nowhere")).toBeUndefined();
    expect(zoneToPoint("2")).toEqual([0, 13]);
    // Left field is to the left, first base to the right.
    expect(zoneToPoint("7")![0]).toBeLessThan(0);
    expect(zoneToPoint("9")![0]).toBeGreaterThan(0);
    expect(zoneToPoint("3")![0]).toBeGreaterThan(0);
    expect(zoneToPoint("5")![0]).toBeLessThan(0);
    expect(zoneToPoint("1")![1]).toBe(60.5);
  });

  it("is symmetrical: a zone's mirror is the same distance on the other side", () => {
    const pairs = [["5", "3"], ["56", "34"], ["6", "4"], ["5S", "3S"], ["56S", "34S"], ["6S", "4S"], ["6MS", "4MS"], ["6M", "4M"], ["6MD", "4MD"], ["56D", "34D"], ["6D", "4D"], ["5D", "3D"], ["5F", "3F"], ["5DF", "3DF"], ["25", "23"], ["25F", "23F"], ["15", "13"], ["7", "9"], ["7S", "9S"], ["7D", "9D"], ["7L", "9L"], ["7LS", "9LS"], ["7LD", "9LD"], ["78", "89"], ["78S", "89S"], ["78D", "89D"], ["78XD", "89XD"], ["7LF", "9LF"], ["7LSF", "9LSF"], ["7LDF", "9LDF"]];
    for (const [left, right] of pairs) {
      const [lx, ly] = zoneToPoint(left)!;
      const [rx, ry] = zoneToPoint(right)!;
      expect(rx, `${left} and ${right}`).toBeCloseTo(-lx, 1);
      expect(ry, `${left} and ${right}`).toBeCloseTo(ly, 1);
    }
  });

  it("keeps every outfield zone inside a park of 330 feet down the lines and 405 to centre, and every infield zone inside the diamond's arc", () => {
    for (const [code, [x, y]] of Object.entries(RETROSHEET_ZONES)) {
      if (/F$/.test(code)) continue;
      expect(Math.hypot(x, y), code).toBeLessThan(405);
    }
  });

  it("finds the zone a point lies in", () => {
    expect(zoneAt([0, 335])).toBe("8D");
    expect(zoneAt([0, 10])).toBe("2");
    expect(zoneAt([-300, 50])).not.toBe("8D");
    for (const code of Object.keys(RETROSHEET_ZONES)) expect(zoneAt(zoneToPoint(code)!)).toBe(code);
  });

  it("lies on the surface as feet from home plate, with y out as minus", () => {
    both("retrosheet", [0, 330], [0, -330]);
    both("retrosheet", [90 * Math.SQRT1_2, 90 * Math.SQRT1_2], [90 * Math.SQRT1_2, -90 * Math.SQRT1_2]);
    near(toSurface([zoneToPoint("8D")!], { from: "retrosheet" })[0], [0, -330]);
  });

  it("converts to Statcast's frame: second base is up the middle, 127.28 feet out", () => {
    const [hx, hy] = convert("retrosheet", "mlbam")([[0, 90 * Math.SQRT2]])[0];
    near([hx, hy], [125.42, 198.27 - (90 * Math.SQRT2) / 2.5]);
  });
});

describe("converting between frames", () => {
  it("goes through the surface: NFL tracking has one frame and no other here", () => {
    expect(() => convert("nfl-tracking", "nhl-api")).toThrow(/share no surface/);
  });

  it("flips the ends of either frame", () => {
    const to = convert("nhl-api", "hockeytech", { attacking: "left" });
    near(to([[69, 22]])[0], [600 - 507, 300 - (150 - (22 * 300) / 85)]);
    near(convert("nhl-api", "hockeytech", { toAttacking: "left" })([[69, 22]])[0], to([[69, 22]])[0]);
  });
});

describe("units and anchors", () => {
  it("give the surface in any unit: a point in metres lands where the same point in feet does", () => {
    const feet = toSurface([[69, 22], [0, 0]], { from: "nhl-api" });
    const metres = toSurface([[69, 22], [0, 0]], { from: "nhl-api", units: "m" });
    feet.forEach((p, i) => near(metres[i], [p[0] * 0.3048, p[1] * 0.3048], 9));
    const yards = toSurface([[69, 22]], { from: "nhl-api", units: "yd" });
    near(yards[0], [feet[0][0] / 3, feet[0][1] / 3]);
  });

  it("round-trip across units, both ways", () => {
    for (const units of ["ft", "yd", "m", "cm", "mm", "in"] as const) {
      const there = toSurface([[69, 22], [-12, 40]], { from: "nhl-api", units });
      const back = fromSurface(there, { to: "nhl-api", units });
      near(back[0], [69, 22], 6);
      near(back[1], [-12, 40], 6);
    }
    const asMetres = toSurface([[69, 22]], { from: "nhl-api", units: "m" });
    near(fromSurface(asMetres, { to: "nhl-api", units: "m" })[0], [69, 22], 9);
    // The same surface place given in feet and in metres is the same frame point.
    near(fromSurface([[169, 20.5]], { to: "nhl-api" })[0], fromSurface([[169 * 0.3048, 20.5 * 0.3048]], { to: "nhl-api", units: "m" })[0], 9);
  });

  it("convert the anchors too: landmarks given in metres are the landmarks given in feet", () => {
    const feet = toSurface([[300, 150]], { from: "hockeytech", anchors: { x: [[0, 10], [600, 190]], y: [[0, 5], [300, 80]] } });
    const metres = toSurface([[300, 150]], { from: "hockeytech", units: "m", anchors: { x: [[0, 10 * 0.3048], [600, 190 * 0.3048]], y: [[0, 5 * 0.3048], [300, 80 * 0.3048]] } });
    near(feet[0], [100, 42.5]);
    near(metres[0], [100 * 0.3048, 42.5 * 0.3048], 9);
    near(toSurface([[0, 0]], { from: "hockeytech", anchors: { x: [[0, 10], [600, 190]] } })[0], [10, 0]);
  });

  it("convert the limits too: a point is kept on the surface, in whatever unit", () => {
    expect(toSurface([[500, 50]], { from: "nhl-api", limits: "surface" })[0]).toEqual([200, 0]);
    const kept = toSurface([[500, 50]], { from: "nhl-api", units: "m", limits: "surface" })[0];
    near(kept, [200 * 0.3048, 0], 9);
    const box = toSurface([[0, 0], [90, 0]], { from: "nhl-api", units: "m", limits: { x: [20, 40] } });
    near(box[0], [30.48, 12.954], 9);
    expect(box[1][0]).toBe(40);
    const boxFeet = toSurface([[0, 0], [90, 0]], { from: "nhl-api", limits: { x: [20 / 0.3048, 40 / 0.3048] } });
    near(boxFeet[1], [40 / 0.3048, 42.5], 9);
  });

  it("refuse a unit, an end or a point that is not one", () => {
    // @ts-expect-error a unit the package does not know
    expect(() => toSurface([[0, 0]], { from: "nhl-api", units: "furlong" })).toThrow(/Unknown units/);
    // @ts-expect-error not an end
    expect(() => toSurface([[0, 0]], { from: "nhl-api", attacking: "up" })).toThrow(/left/);
    // @ts-expect-error not a point
    expect(() => toSurface([[0]], { from: "nhl-api" })).toThrow(/two finite/);
    expect(() => toSurface([[NaN, 0]], { from: "nhl-api" })).toThrow(/two finite/);
    expect(() => toSurface([[0, 0]], { from: "no-such-frame" })).toThrow(/Unknown frame/);
  });
});

describe("the ends a team attacks", () => {
  it("turns a play a half turn about the middle of the surface", () => {
    expect(flipEnds([[169, 20.5]], { length: 200, width: 85 })).toEqual([[31, 64.5]]);
    expect(flipEnds(flipEnds([[169, 20.5]], { length: 200, width: 85 }), { length: 200, width: 85 })).toEqual([[169, 20.5]]);
    expect(toSurface([[69, 22]], { from: "nhl-api", attacking: "left" })[0]).toEqual(flipEnds(toSurface([[69, 22]], { from: "nhl-api" }), { length: 200, width: 85 })[0]);
  });

  it("is undone by fromSurface with the same ends", () => {
    const p = toSurface([[69, 22]], { from: "nhl-api", attacking: "left" });
    near(fromSurface(p, { to: "nhl-api", attacking: "left" })[0], [69, 22]);
  });

  it("changes in hockey every period, in football after the first and the third quarters, in basketball at the half", () => {
    expect([1, 2, 3, 4].map((p) => attackingIn("nhl", p, "right"))).toEqual(["right", "left", "right", "left"]);
    expect([1, 2, 3, 4].map((p) => attackingIn("nfl", p, "right"))).toEqual(["right", "left", "left", "right"]);
    expect([1, 2, 3, 4, 5, 6].map((p) => attackingIn("nba", p, "left"))).toEqual(["left", "left", "right", "right", "right", "right"]);
    expect(attackingIn("nhl", 4, "left")).toBe("right");
  });

  it("leaves a period no rule settles to the caller", () => {
    expect(() => attackingIn("nfl", 5, "right")).toThrow(/changedAfter/);
    expect(() => attackingIn("rugby", 2, "right")).toThrow(/changedAfter/);
    expect(attackingIn("rugby", 2, "right", [1])).toBe("left");
    expect(attackingIn("nfl", 5, "right", [1, 3, 4])).toBe("left");
    expect(() => attackingIn("nhl", 0, "right")).toThrow(/whole number/);
  });
});

describe("the registry", () => {
  const sample: Frame = { name: "test-grid", title: "A test", sport: "nhl", unit: "ft", x: [0, 1], y: [0, 1], origin: "the corner", yDirection: "down", size: "fixed", ends: "fixed", source: "test", landmarks: { x: span(0, 1, 0, 200), y: span(0, 1, 0, 85) } };

  it("holds the frames of the ice, the court, the gridiron and the diamond", () => {
    expect(Object.keys(FRAMES)).toEqual(expect.arrayContaining(["nhl-api", "hockeytech", "nba-stats", "nfl-tracking", "mlbam", "retrosheet"]));
    expect(framesOf("nhl").map((f) => f.name)).toEqual(["nhl-api", "hockeytech"]);
    expect(framesOf("mlb").map((f) => f.name)).toEqual(["mlbam", "retrosheet"]);
  });

  it("describes each frame with a unit, a range, an origin, a direction, a size and a source", () => {
    for (const frame of Object.values(FRAMES)) {
      expect(frame.title.length, frame.name).toBeGreaterThan(5);
      expect(frame.origin.length, frame.name).toBeGreaterThan(3);
      expect(["up", "down"]).toContain(frame.yDirection);
      // A soccer pitch has any size within the Laws, a curling sheet 146 to 150 feet and a volleyball court is indoor or beach and a field sport's surface has a range of sizes, so their frames are variable; every other surface has one.
      expect(frame.size).toBe(frame.sport === "soccer" || frame.sport === "curling" || frame.sport === "volleyball" || ["lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"].includes(frame.sport) ? "variable" : "fixed");
      expect(frame.x[0]).toBeLessThan(frame.x[1]);
      expect(frame.y[0]).toBeLessThan(frame.y[1]);
      expect(frame.source.length).toBeGreaterThan(3);
    }
  });

  it("says which way y grows, and the landmarks agree", () => {
    for (const frame of Object.values(FRAMES)) {
      if (frame.name === "retrosheet" || frame.name === "mlbam") continue;
      const size = frame.size === "variable" ? (frame.sport === "curling" ? { length: 150, width: 15.5, unit: "ft" as const } : frame.sport === "volleyball" ? { length: 18, width: 9, unit: "m" as const } : { length: 105, width: 68, unit: "m" as const }) : undefined;
      const [a, b] = [frame.y[0], frame.y[1]].map((y) => toSurface([[frame.x[0], y]], { from: frame, size }));
      const along = (typeof frame.landmarks === "function" ? frame.landmarks({ length: 105, width: 68 }) : frame.landmarks) as { swap?: boolean };
      // On the surface, y down is the page's down: a frame whose y goes up has its larger y at a smaller surface y (or, swapped, at a smaller surface x), one whose y goes down at a larger.
      const index = along.swap === true ? 0 : 1;
      expect(a[0][index] < b[0][index], frame.name).toBe(frame.yDirection === "down");
    }
    expect(toSurface([[0, 0]], { from: "mlbam" })[0][1]).toBeLessThan(toSurface([[0, 100]], { from: "mlbam" })[0][1]);
  });

  it("takes a frame of another sport by name, and refuses a name already taken", () => {
    registerFrame(sample);
    expect(frameByName("test-grid")).toBe(sample);
    near(toSurface([[0.5, 0.5]], { from: "test-grid" })[0], [100, 42.5]);
    expect(() => registerFrame(sample)).toThrow(/registered already/);
    registerFrame({ ...sample, title: "A changed test" }, true);
    expect(FRAMES["test-grid"].title).toBe("A changed test");
    delete FRAMES["test-grid"];
  });

  it("takes a frame of a surface whose size varies, given the size of the one it is placed on", () => {
    const variable: Frame = {
      name: "test-pitch",
      title: "A test pitch",
      sport: "test-pitch-sport",
      unit: "percent",
      x: [0, 100],
      y: [0, 100],
      origin: "the bottom left",
      yDirection: "up",
      size: "variable",
      ends: "fixed",
      source: "test",
      landmarks: ({ length, width }) => ({ x: span(0, 100, 0, length), y: span(0, 100, width, 0) }),
    };
    registerFrame(variable);
    near(toSurface([[50, 50]], { from: "test-pitch", size: { length: 105, width: 68, unit: "m" }, units: "m" })[0], [52.5, 34], 9);
    near(toSurface([[50, 50]], { from: "test-pitch", size: { length: 344.5, width: 223 } })[0], [172.25, 111.5], 9);
    expect(() => toSurface([[50, 50]], { from: "test-pitch" })).toThrow(/give the size/);
    near(toSurface([[100, 0]], { from: "test-pitch", size: { length: 100, width: 60 }, attacking: "left" })[0], [0, 0]);
    near(fromSurface([[0, 0]], { to: "test-pitch", size: { length: 100, width: 60 }, attacking: "left" })[0], [100, 0]);
    delete FRAMES["test-pitch"];
  });

  it("refuses a fixed frame with landmarks as a function, and a variable one without", () => {
    expect(() => registerFrame({ ...sample, name: "bad-1", landmarks: () => ({ x: [], y: [] }) })).toThrow(/as a function/);
    expect(() => registerFrame({ ...sample, name: "bad-2", size: "variable" })).toThrow(/function of the surface's size/);
    expect(() => registerFrame({ ...sample, name: "" })).toThrow(/needs a name/);
  });
});
