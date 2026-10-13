import { describe, expect, it } from "vitest";
import { DEFAULT_FENCE, FEET_PER_METRE, FOOTBALL, GOALPOST_WIDTH, MLB, NBA, NHL, boardsY, fenceAt, fencePoints, footballLength, secondBase, skinJoin, threePointJoin } from "./geometry-entry.ts";

describe("the football fields", () => {
  it("are the NFL's 360 by 160 feet (120 by 53⅓ yards) with ten-yard end zones", () => {
    expect(footballLength(FOOTBALL.nfl)).toBe(360);
    expect(FOOTBALL.nfl.width).toBe(160);
    expect(FOOTBALL.nfl.endZone).toBe(30);
    expect(FOOTBALL.nfl.length).toBe(300);
  });

  it("put the NFL's hash marks 70 feet 9 inches from each sideline, which is the goal posts' width apart", () => {
    expect(FOOTBALL.nfl.hash).toBeCloseTo(70.75, 6);
    expect(FOOTBALL.nfl.width - 2 * FOOTBALL.nfl.hash).toBeCloseTo(GOALPOST_WIDTH, 6);
  });

  it("are the CFL's 150 by 65 yards with twenty-yard end zones, the hash marks 28 yards in and the posts on the goal lines", () => {
    expect(footballLength(FOOTBALL.cfl) / 3).toBe(150);
    expect(FOOTBALL.cfl.width / 3).toBe(65);
    expect(FOOTBALL.cfl.length / 3).toBe(110);
    expect(FOOTBALL.cfl.endZone / 3).toBe(20);
    expect(FOOTBALL.cfl.hash / 3).toBe(28);
    expect(FOOTBALL.cfl.posts).toBe("goal-line");
  });

  it("are the IFAF's: the hash marks 60 feet from each sideline and the numbers' tops 27 feet from it", () => {
    expect(FOOTBALL.ifaf.hash).toBe(60);
    expect(FOOTBALL.ifaf.numbers[1]).toBe(27);
    expect(footballLength(FOOTBALL.ifaf)).toBe(360);
    expect(FOOTBALL.ifaf.posts).toBe("end-line");
  });

  it("have the NFL's numbers 6 feet tall, their bottom edge 12 yards from the sideline", () => {
    expect(FOOTBALL.nfl.numbers).toEqual([36, 42]);
  });
});

describe("the NHL rink", () => {
  it("is 200 by 85 feet with a 28-foot corner radius, the goal lines 11 feet and the blue lines 75 feet from the end boards", () => {
    expect([NHL.length, NHL.width, NHL.cornerRadius, NHL.goalLine, NHL.blueLine]).toEqual([200, 85, 28, 11, 75]);
    expect(NHL.length / 2 - NHL.blueLine).toBe(25);
  });

  it("puts the end-zone spots 20 feet from the goal line and 22 feet either side of the middle, 44 feet apart", () => {
    expect(NHL.goalLine + NHL.endSpotFromGoalLine).toBe(31);
    expect(2 * NHL.spotOffset).toBe(44);
    expect(NHL.circleRadius).toBe(15);
  });

  it("has a crease of 6-foot radius whose straight sides, 8 feet apart, run 4.5 feet from the goal line", () => {
    expect(NHL.crease.radius).toBe(6);
    expect(2 * NHL.crease.halfWidth).toBe(8);
    expect(Math.sqrt(36 - 16)).toBeCloseTo(NHL.crease.depth, 1);
  });

  it("has a trapezoid 22 feet wide at the goal line (18 until 2013-14) and 28 at the end boards", () => {
    expect(NHL.trapezoid).toEqual({ atBoards: 28, atGoalLine: 22 });
  });

  it("meets the boards' curve where a circle of the corner's radius does", () => {
    expect(boardsY(NHL.cornerRadius)).toBe(0);
    expect(boardsY(0)).toBeCloseTo(NHL.cornerRadius, 6);
    const y = boardsY(NHL.goalLine);
    expect((NHL.cornerRadius - y) ** 2 + (NHL.cornerRadius - NHL.goalLine) ** 2).toBeCloseTo(NHL.cornerRadius ** 2, 6);
  });
});

describe("the NBA court", () => {
  it("is 94 by 50 feet with a 16-foot key whose free-throw line is 19 feet from the baseline", () => {
    expect([NBA.length, NBA.width, NBA.lane, NBA.freeThrowLine]).toEqual([94, 50, 16, 19]);
    expect(NBA.freeThrowLine - NBA.backboard.fromBaseline).toBe(15);
  });

  it("joins the three-point arc, 23 feet 9 inches from the basket, to the corner lines 3 feet from the sidelines at 14.2 feet", () => {
    expect(NBA.threePoint.radius).toBe(23.75);
    expect(NBA.width / 2 - NBA.threePoint.corner).toBe(NBA.threePoint.sideInset);
    expect(threePointJoin()).toBeCloseTo(14.2, 1);
  });

  it("puts the basket 63 inches from the baseline", () => {
    expect(NBA.basket * 12).toBe(63);
  });
});

describe("the baseball field", () => {
  it("has a diagonal of 127.28 feet from home to second base", () => {
    expect(secondBase()).toBeCloseTo(127.28, 2);
  });

  it("cuts the infield by an arc of 95 feet round the pitcher's plate, 60.5 feet from home, meeting the foul lines at about 127.6 feet", () => {
    expect([MLB.skinRadius, MLB.pitcher]).toEqual([95, 60.5]);
    const along = skinJoin();
    expect(along).toBeGreaterThan(127);
    expect(along).toBeLessThan(128);
    const u = along * Math.SQRT1_2;
    expect(Math.hypot(u, u - MLB.pitcher)).toBeCloseTo(95, 6);
  });
});

describe("the fence", () => {
  const points = fencePoints(DEFAULT_FENCE);

  it("is the given distance at each of its points", () => {
    expect(fenceAt(points, -45)).toBe(330);
    expect(fenceAt(points, -22.5)).toBeCloseTo(375, 6);
    expect(fenceAt(points, 0)).toBeCloseTo(400, 6);
    expect(fenceAt(points, 45)).toBe(330);
  });

  it("never swings out past the figures it is made from", () => {
    for (let a = -45; a <= 45; a += 0.5) {
      const d = fenceAt(points, a);
      expect(d).toBeGreaterThanOrEqual(330 - 1e-9);
      expect(d).toBeLessThanOrEqual(400 + 1e-9);
    }
  });

  it("holds the end distance beyond its points and rises toward the middle", () => {
    expect(fenceAt(points, -60)).toBe(330);
    expect(fenceAt(points, -30)).toBeLessThan(fenceAt(points, -10));
  });

  it("converts metres to feet", () => {
    expect(100 * FEET_PER_METRE).toBeCloseTo(328.08, 2);
  });
});
