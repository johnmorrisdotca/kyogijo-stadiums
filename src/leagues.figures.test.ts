// The key figures of every league, held to its rulebook: the figure in the rulebook's own unit, the rule it is from, and what the
// drawing shows of it. The rule numbers are in docs/sources.md.
import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { FOOTBALL, MLB } from "./geometry.ts";
import { LEAGUES, chooseLeague, courtOf, diamondOf, fieldOf, leagueAt, leagueById, leagueChanges, leagueSize, rinkOf, type BaseballLeague, type BasketballLeague, type CourtFigures, type FootballLeague, type HockeyLeague, type RinkFigures } from "./leagues.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const ft = (feet: number, inches = 0): number => feet + inches / 12;
const parse = (svg: string): Node => parseXml(svg);
const m = (metres: number): number => metres * FEET_PER_METRE;
const basketball = (id: string): BasketballLeague => leagueById("nba", id) as BasketballLeague;
const hockey = (id: string): HockeyLeague => leagueById("nhl", id) as HockeyLeague;
const football = (id: string): FootballLeague => leagueById("nfl", id) as FootballLeague;
const baseball = (id: string): BaseballLeague => leagueById("mlb", id) as BaseballLeague;
/** A league's figures in a season, typed as its family's. */
const figs = <T>(sport: "nba" | "nhl", id: string, year: number): T => leagueAt(sport, id, year).figures as unknown as T;
const near = (a: number, b: number): void => expect(a).toBeCloseTo(b, 6);
/** A length read off the drawing, which writes two decimals. */
const drawn = (a: number, b: number): void => expect(a).toBeCloseTo(b, 1);
const draw = (sport: "nba" | "nhl" | "nfl" | "mlb", league: string, extra: Record<string, unknown> = {}): Node => parse(drawKyogijo({ sport, league, margin: 0, id: "t", ...extra } as never));
const viewBox = (svg: Node): number[] => svg.attrs.viewBox.split(" ").map(Number);

describe("basketball courts", () => {
  it("FIBA: 28 by 15 m, lane 4.90 m, free-throw line 5.80 m, three-point 6.75 m with straights 0.90 m in, basket 1.575 m, no-charge arc 1.30 m (Rule Two, Art. 2.1, 2.5)", () => {
    const f = basketball("fiba").dimensions;
    expect([f.length, f.width, f.laneWidth, f.freeThrowLine, f.freeThrowRadius, f.centreRadius]).toEqual([28, 15, 4.9, 5.8, 1.8, 1.8]);
    expect(f.threePoint).toEqual({ radius: 6.75, sideInset: 0.9 });
    expect([f.basket, f.backboard.fromBaseline, f.restricted]).toEqual([1.575, 1.2, 1.3]);
    expect(leagueSize("nba", "fiba")).toEqual({ length: 28, width: 15, unit: "m" });
    const svg = draw("nba", "fiba");
    expect(viewBox(svg)[2]).toBeCloseTo(m(28), 1);
    expect(viewBox(svg)[3]).toBeCloseTo(m(15), 1);
    const key = withClass(svg, "ky-key-left")[0];
    drawn(Number(key.attrs.height), m(4.9));
    // The three-point arc's radius is 6.75 m.
    expect(withClass(svg, "ky-line").some((n) => n.attrs.d?.includes(`A${Math.round(m(6.75) * 100) / 100} `))).toBe(true);
  });

  it("WNBA: the NBA's court with the three-point line at 22 ft 1¾ in (Rule 1, I-d), a lane of 16 feet since 2004", () => {
    const w = basketball("wnba").dimensions;
    near(w.threePoint!.radius, ft(22, 1.75));
    expect([w.length, w.width, w.laneWidth, w.threePoint!.sideInset, w.restricted]).toEqual([94, 50, 16, 3, 4]);
    expect(figs<CourtFigures>("nba", "wnba", 2003).laneWidth).toBe(12);
    expect(figs<CourtFigures>("nba", "wnba", 2004).laneWidth).toBe(16);
    expect(withClass(draw("nba", "wnba", { year: 2003 }), "ky-key-left")[0].attrs.height).toBe("12");
  });

  it("NCAA: a 12-foot lane, three-point 22 ft 1¾ in with 21 ft 7⅞ in corners (1-6-1, 1-7-1); the women's restricted area has no arc since 2023-24", () => {
    for (const id of ["ncaa-men", "ncaa-women"]) {
      const c = basketball(id).dimensions;
      expect([c.length, c.width, c.laneWidth, c.freeThrowLine, c.basket]).toEqual([94, 50, 12, 19, 5.25]);
      near(c.threePoint!.radius, ft(22, 1.75));
      near(25 - c.threePoint!.sideInset, ft(21, 7.875));
    }
    expect(basketball("ncaa-men").dimensions.restricted).toBe(4);
    expect(basketball("ncaa-women").dimensions.restricted).toBeNull();
    expect(figs<CourtFigures>("nba", "ncaa-men", 2010).restricted).toBeNull();
    expect(figs<CourtFigures>("nba", "ncaa-men", 2011).restricted).toBe(3);
    expect(figs<CourtFigures>("nba", "ncaa-men", 2015).restricted).toBe(4);
    expect(figs<CourtFigures>("nba", "ncaa-women", 2017).restricted).toBe(4);
    expect(figs<CourtFigures>("nba", "ncaa-women", 2023).restricted).toBeNull();
    expect(leagueChanges("nba", "ncaa-women").map((c) => c.from)).toEqual([null, 2011, 2017, 2023]);
  });

  it("NFHS: an 84 by 50 foot court, a 12-foot lane, the three-point semicircle 19 ft 9 in with straights to the end line, no restricted area (Rule 1)", () => {
    const c = basketball("nfhs").dimensions;
    expect([c.length, c.width, c.laneWidth, c.restricted]).toEqual([84, 50, 12, null]);
    expect(c.threePoint).toEqual({ radius: ft(19, 9), sideInset: 25 - ft(19, 9) });
    const svg = draw("nba", "nfhs");
    expect(viewBox(svg).slice(2)).toEqual([84, 50]);
    expect(withClass(svg, "ky-line").some((n) => n.attrs.d?.includes("A19.75 19.75"))).toBe(true);
  });

  it("the G League plays on the NBA's court", () => {
    expect(courtOf(basketball("gleague"))).toEqual(courtOf(basketball("nba")));
  });
});

describe("ice rinks", () => {
  it("IIHF: 60 m long, goal line 4.0 m, blue line 22.50 m, circles 4.50 m, spots 6.00 and 7.00 m, trapezoid 6.80 and 8.60 m, crease radius 1.83 m (Rule 1)", () => {
    const r = hockey("iihf").dimensions;
    expect([r.length, r.goalLine, r.blueLine, r.circleRadius, r.endSpotFromGoalLine, r.spotOffset, r.neutralSpotFromBlue, r.refereeCrease]).toEqual([60, 4, 22.5, 4.5, 6, 7, 1.5, 3]);
    expect(r.trapezoid).toEqual({ atBoards: 8.6, atGoalLine: 6.8 });
    expect(r.crease.radius).toBe(1.83);
    expect(r.width).toBeGreaterThanOrEqual(26);
    expect(r.width).toBeLessThanOrEqual(30);
    const svg = draw("nhl", "iihf");
    drawn(viewBox(svg)[2], m(60));
    expect(withClass(svg, "ky-blue").some((n) => n.attrs.d?.startsWith(`M${Math.round(m(22.5) * 100) / 100} 0`))).toBe(true);
    // The history the IIHF's own books date: the blue line, and the goalkeepers' restricted area from 2021/22.
    expect(figs<RinkFigures>("nhl", "iihf", 2019).blueLine).toBe(22.86);
    expect(figs<RinkFigures>("nhl", "iihf", 2019).trapezoid).toBeNull();
    expect(figs<RinkFigures>("nhl", "iihf", 2021).trapezoid).not.toBeNull();
    expect(figs<RinkFigures>("nhl", "iihf", 2022).blueLine).toBe(22.5);
  });

  it("the NCAA: 200 by 85 feet with corners of 20 feet; the men's trapezoid from 2026-27, none for the women (Rule 1.2, 1.6)", () => {
    for (const id of ["ncaa-men", "ncaa-women"]) {
      const r = hockey(id).dimensions;
      expect([r.length, r.width, r.cornerRadius, r.goalLine, r.blueLine]).toEqual([200, 85, 20, 11, 75]);
    }
    expect(hockey("ncaa-men").dimensions.trapezoid).toEqual({ atBoards: 28, atGoalLine: 22 });
    expect(hockey("ncaa-women").dimensions.trapezoid).toBeNull();
    expect(figs<RinkFigures>("nhl", "ncaa-men", 2025).trapezoid).toBeNull();
    expect(figs<RinkFigures>("nhl", "ncaa-men", 2026).trapezoid).not.toBeNull();
    // Rounder corners are drawn with a smaller radius: the boards' path differs from the NHL's.
    expect(drawKyogijo({ sport: "nhl", league: "ncaa-men", id: "t" })).not.toBe(drawKyogijo({ sport: "nhl", id: "t" }));
  });

  it("the leagues whose Rule 1 is the NHL's draw the NHL's rink: AHL, ECHL, OHL, WHL, QMJHL", () => {
    for (const id of ["ahl", "echl", "ohl", "whl", "qmjhl"]) {
      const r = hockey(id).dimensions;
      expect([r.length, r.width, r.cornerRadius, r.goalLine, r.blueLine, r.circleRadius]).toEqual([200, 85, 28, 11, 75, 15]);
    }
    expect(hockey("qmjhl").dimensions.hash).toEqual({ length: 2, apart: 5 });
    // The AHL moved its blue lines 4 feet towards centre ice for 2005-06.
    expect(figs<RinkFigures>("nhl", "ahl", 2004).blueLine).toBe(71);
    expect(figs<RinkFigures>("nhl", "ahl", 2005).blueLine).toBe(75);
  });

  it("the USHL (the USA Hockey Junior rink) and the PWHL have no goalkeepers' trapezoid", () => {
    expect(hockey("ushl").dimensions.trapezoid).toBeNull();
    expect(hockey("pwhl").dimensions.trapezoid).toBeNull();
    expect(withClass(draw("nhl", "pwhl"), "ky-red").some((n) => /L0 /.test(n.attrs.d ?? ""))).toBe(false);
    expect(rinkOf(hockey("nhl")).trapezoid).not.toBeNull();
  });
});

describe("football fields", () => {
  const key = (id: string): [number, number, number, number, number, number | undefined] => {
    const f = football(id).dimensions;
    return [f.length / 3, f.endZone / 3, f.width, f.hash, f.numbers[1], f.postWidth];
  };

  it("NCAA: 100 yards between the goal lines, 160 feet wide, hash marks 60 feet from the sidelines, numbers' tops 27 feet in, posts 18 ft 6 in (1-2, 2-12, Appendix D)", () => {
    expect(key("ncaa")).toEqual([100, 10, 160, 60, 27, 18.5]);
    const svg = draw("nfl", "ncaa");
    expect(viewBox(svg)).toEqual([0, 0, 360, 160]);
  });

  it("NFHS: hash marks 53 ft 4 in, posts 23 ft 4 in apart (1-2-3e, 1-2-5c)", () => {
    const k = key("nfhs");
    expect(k.slice(0, 3)).toEqual([100, 10, 160]);
    near(k[3], ft(53, 4));
    near(k[5]!, ft(23, 4));
    expect(fieldOf(football("nfhs")).hash).toBeCloseTo(53.3333, 3);
  });

  it("9, 8 and 6 players: 80 by 40 yards with hash marks 48 ft 4 in, 45 feet and 45 feet from the sidelines (the NFHS diagrams)", () => {
    for (const [id, hash] of [["nfhs-9", ft(48, 4)], ["nfhs-8", 45], ["nfhs-6", 45]] as const) {
      const k = key(id);
      expect(k.slice(0, 3)).toEqual([80, 10, 120]);
      near(k[3], hash);
      near(k[4], 21);
      expect(viewBox(draw("nfl", id))).toEqual([0, 0, 300, 120]);
    }
  });

  it("Texas six-man: 80 by 40 yards, hash marks 40 feet from the sidelines, posts 25 feet apart (the UIL's exceptions to the NCAA rules)", () => {
    expect(key("uil-6")).toEqual([80, 10, 120, 40, 27, 25]);
  });

  it("the Indoor Football League: 50 by 28 yards with 8-yard end zones, the wide hash marks 30 feet apart, posts 10 feet apart, no numbers and no pylons (Rule 1, Art. 2, 3, 5)", () => {
    const f = football("ifl").dimensions;
    expect([f.length / 3, f.endZone / 3, f.width / 3, f.width - 2 * f.hash, f.postWidth]).toEqual([50, 8, 28, 30, 10]);
    const svg = draw("nfl", "ifl");
    expect(viewBox(svg)).toEqual([0, 0, 198, 84]);
    expect(withClass(svg, "ky-num")).toHaveLength(0);
    expect(withClass(svg, "ky-pylon")).toHaveLength(0);
  });

  it("a league that is a sport of its own is that sport, and the sport's own spec is not changed", () => {
    expect(chooseLeague({ sport: "nfl", league: "ifaf" }).sport).toBe("ifaf");
    expect(FOOTBALL.nfl.hash).toBeCloseTo(70.75, 6);
    expect(LEAGUES.nfl.find((l) => l.id === "ncaa")).toBeDefined();
  });
});

describe("baseball and softball fields", () => {
  const key = (id: string): [number, number, number | undefined] => {
    const d = baseball(id).dimensions;
    return [d.base, d.pitcher, d.fence.left];
  };

  it("Little League: 60-foot bases, the pitcher 46 feet, a fence of 200 feet; Intermediate 70 and 50", () => {
    expect(key("little-league")).toEqual([60, 46, 200]);
    expect(key("little-league-intermediate")).toEqual([70, 50, 200]);
    const svg = draw("mlb", "little-league");
    // The foul lines end at the fence: 200 feet out on the diagonal.
    expect(viewBox(svg)[2]).toBeGreaterThan(280);
    expect(viewBox(svg)[2]).toBeLessThan(300);
  });

  it("PONY: 80 feet and 54 for the Pony division, 70 and 50 for the Bronco, 60 and 46 for the Mustang (Rule 7)", () => {
    expect(key("pony")).toEqual([80, 54, 275]);
    expect(key("pony-bronco")).toEqual([70, 50, 225]);
    expect(key("pony-mustang")).toEqual([60, 46, 175]);
  });

  it("NFHS, NCAA and MiLB: 90-foot bases and the plate at 60 ft 6 in, each with its own fence and the NCAA's and NFHS's 15-inch bases (OBR 2.01, NCAA 1-2, NFHS 1-2)", () => {
    expect(key("ncaa")).toEqual([90, 60.5, 330]);
    expect(key("nfhs")).toEqual([90, 60.5, 300]);
    expect(key("milb")).toEqual([90, 60.5, 325]);
    expect(baseball("milb").dimensions.fence.center).toBe(400);
    expect(baseball("nfhs").dimensions.moundCentre).toBe(59);
    expect(baseball("ncaa").dimensions.baseSize).toBe(1.25);
    expect(baseball("milb").dimensions.baseSize).toBe(1.5);
    expect(baseball("mlb").dimensions.base).toBe(MLB.base);
  });

  it("softball: 60 feet and 43 for the NCAA, the high schools and fast pitch; 70 and 50 for USA slow pitch; 65 and 50 for the WBSC's", () => {
    expect(key("ncaa-softball")).toEqual([60, 43, 200]);
    expect(key("nfhs-softball")).toEqual([60, 43, 185]);
    expect(key("fastpitch")).toEqual([60, 43, 200]);
    expect(key("slowpitch")).toEqual([70, 50, 265]);
    expect(key("slowpitch-wbsc")).toEqual([65, 50, 275]);
    for (const id of ["ncaa-softball", "fastpitch", "slowpitch"]) {
      const d = baseball(id).dimensions;
      expect(d.boxes).toEqual({ batterWidth: 3, batterLength: 7, gap: 0.5 });
      expect(diamondOf(baseball(id)).moundRadius).toBe(8);
    }
    // A softball field is a different drawing from a baseball field of the same fence.
    expect(drawKyogijo({ sport: "mlb", league: "fastpitch", id: "t" })).not.toBe(drawKyogijo({ sport: "mlb", league: "little-league", id: "t" }));
    expect(walk(draw("mlb", "fastpitch")).some((n) => n.name === "path")).toBe(true);
  });
});
