// The cricket ground, each figure held to the Laws of Cricket (MCC, 2017 Code, 4th Edition 2026) and to the ICC's playing conditions (effective from October 2026), in yards and feet as the Laws print them.
import { describe, expect, it } from "vitest";
import { cricketBoardMarkup, totalText } from "./cricket.board.ts";
import { linesIn, named, planOf, yd } from "./fields.fixture.ts";
import type { PathShape, RingShape } from "./fields.types.ts";
import { drawKyogijo, statusLabel, winnerOf } from "./draw.ts";
import { LEAGUES, LEAGUE_SOURCES, cricketOf } from "./leagues.ts";
import { parseXml, walk } from "./xml.fixture.ts";

const close = (a: number, b: number, places = 2): void => expect(a).toBeCloseTo(b, places);
const ft = (feet: number): number => feet;
const plan = planOf("cricket");

describe("the pitch, the creases and the wickets (the Laws, 6 to 8)", () => {
  const [pitch] = plan.areas;

  it("is a rectangle 22 yards long and 10 feet wide, bounded at its ends by the bowling creases (6.1)", () => {
    expect(pitch.id).toBe("pitch");
    const [x0, y0, x1, y1] = pitch.rect as [number, number, number, number];
    close(yd(x1 - x0), 22);
    close(ft(y1 - y0), 10);
    close((x0 + x1) / 2, plan.length / 2);
    close((y0 + y1) / 2, plan.width / 2);
  });

  it("has a bowling crease 8 ft 8 in long at each end of the pitch (7.2)", () => {
    const creases = linesIn(plan, "bowling-crease").map(([x0, y0, x1, y1]) => [x0 / 0.3048, y0 / 0.3048, x1 / 0.3048, y1 / 0.3048]);
    expect(creases).toHaveLength(2);
    for (const [x0, y0, x1, y1] of creases) {
      close(x0, x1);
      close(y1 - y0, 8 + 8 / 12);
    }
    close(creases[1][0] - creases[0][0], 66);
  });

  it("has a popping crease 4 ft in front of each bowling crease, marked at least 6 ft either side of the line of the middle stumps in the Laws and at least 25 ft in the ICC's conditions (7.3)", () => {
    const length = (id: string): number => {
      const [x0, y0, , y1] = linesIn(planOf("cricket", id), "popping-crease")[0].map((v) => v / 0.3048) as [number, number, number, number];
      return (y1 - y0) / 2 + 0 * x0;
    };
    close(length("mcc"), 6);
    close(length("icc-men"), 25);
    close(length("icc-women"), 25);
    const popping = linesIn(plan, "popping-crease").map(([x]) => x / 0.3048);
    const bowling = linesIn(plan, "bowling-crease").map(([x]) => x / 0.3048);
    close(popping[0] - bowling[0], 4);
    close(bowling[1] - popping[1], 4);
  });

  it("has return creases at right angles to the popping crease, their inside edges 4 ft 4 in either side of the line of the middle stumps, marked 8 ft behind it (7.4)", () => {
    const returns = linesIn(plan, "return-crease").map(([x0, y0, x1, y1]) => [x0 / 0.3048, y0 / 0.3048, x1 / 0.3048, y1 / 0.3048]);
    expect(returns).toHaveLength(4);
    const cy = plan.width / 2;
    for (const [x0, y0, x1, y1] of returns) {
      close(y0, y1);
      close(Math.abs(x1 - x0), 8);
      // The line's inside edge: its centre less half its width, 2 in.
      close(Math.abs(y0 - cy) - 1 / 12, 4 + 4 / 12, 2);
    }
    // They run from the popping crease towards and past the bowling crease.
    const [left] = returns;
    close(left[2] - left[0], -8);
  });

  it("has a set of wickets 9 in wide in the middle of each bowling crease (8.1)", () => {
    const wickets = named(plan, "wicket");
    expect(wickets).toHaveLength(2);
    for (const wicket of wickets) {
      expect(wicket.kind).toBe("bar");
      if (wicket.kind === "bar") close(wicket.y1 - wicket.y0, 0.75);
      if (wicket.kind === "bar") close((wicket.y0 + wicket.y1) / 2, plan.width / 2);
    }
    close(cricketOf(LEAGUES.cricket[0] as never).wicket, 0.75);
  });

  it("draws the creases thin beside the ground, white lines (7.1) whose width the Laws do not print", () => {
    const creases = named(plan, "popping-crease");
    expect(creases[0].kind === "line" && creases[0].least).toBeLessThan(plan.drawnLine);
    close(plan.lineWidth * 12, 2);
  });
});

describe("the boundary and the circle (the ICC's conditions)", () => {
  it("is a parameter: a distance from the centre of the pitch, 65 to 90 yards for the men (19.1.3) and 60 to 70 yards for the women, a circle or an ellipse", () => {
    const circle = planOf("cricket", "icc-men", { units: "yd", field: { boundary: 80 } });
    close(yd(circle.length), 160);
    close(yd(circle.width), 160);
    const oval = planOf("cricket", "icc-men", { units: "yd", field: { boundary: { straight: 90, square: 65 } } });
    close(yd(oval.length), 180);
    close(yd(oval.width), 130);
    expect(oval.outline).toEqual({ kind: "ellipse" });
    expect(() => planOf("cricket", "icc-men", { units: "yd", field: { boundary: 64 } })).toThrow(/65 to 90 yd/);
    expect(() => planOf("cricket", "icc-men", { units: "yd", field: { boundary: 91 } })).toThrow(RangeError);
    expect(() => planOf("cricket", "icc-women", { units: "yd", field: { boundary: 71 } })).toThrow(/60 to 70 yd/);
    expect(() => planOf("cricket", "icc-women", { units: "yd", field: { boundary: { straight: 59, square: 65 } } })).toThrow(/60 to 70 yd/);
    close(yd(planOf("cricket", "icc-women", { units: "yd", field: { boundary: 70 } }).length), 140);
    // The Laws give no size: any boundary, but not zero.
    close(yd(planOf("cricket", "mcc", { units: "yd", field: { boundary: 40 } }).length), 80);
    expect(() => planOf("cricket", "mcc", { units: "yd", field: { boundary: 0 } })).toThrow(/above zero/);
  });

  it("draws the fielding restriction as two semicircles of 30 yards about the middle stumps, joined by two parallel lines (28.7.2.1), and of 25.15 yards for the women", () => {
    for (const [league, radius] of [["icc-men", 30], ["icc-women", 25.15]] as const) {
      const drawn = planOf("cricket", league);
      const [circle] = named(drawn, "circle") as PathShape[];
      const cx = drawn.length / 2;
      const half = 11 * 3;
      // The path runs along y = cy - r from the left stump to the right stump, then round.
      const numbers = circle.d.match(/-?[\d.]+/g)?.map(Number) as number[];
      close(numbers[0], cx - half, 1);
      close(numbers[1], drawn.width / 2 - radius * 3, 1);
      close(numbers[2], cx + half, 1);
      expect(circle.d).toContain(`A${Math.round(radius * 3 * 100) / 100} ${Math.round(radius * 3 * 100) / 100}`);
    }
    expect(named(planOf("cricket", "mcc"), "circle")).toHaveLength(0);
    expect(named(planOf("cricket", "icc-men", { field: { circle: false } }), "circle")).toHaveLength(0);
  });

  it("has a boundary rope that is the ellipse of the ground", () => {
    const [rope] = named(plan, "boundary") as RingShape[];
    close(rope.rx, plan.length / 2);
    close(rope.ry, plan.width / 2);
  });

  it("names the Laws and the conditions it was read in", () => {
    expect(LEAGUE_SOURCES["mcc-laws"].edition).toMatch(/4th Edition, 2026/);
    expect(LEAGUE_SOURCES["icc-men-odi"].edition).toMatch(/October 2026/);
    expect(LEAGUES.cricket.map((league) => league.id)).toEqual(["icc-men", "icc-women", "mcc"]);
  });

  it("refuses a range that the league does not mark: the Laws have no circle", () => {
    expect(() => drawKyogijo({ sport: "cricket", league: "mcc", range: "circle" })).toThrow(/no range "circle"/);
    expect(drawKyogijo({ sport: "cricket", range: "circle" })).toContain('data-range="circle"');
    expect(drawKyogijo({ sport: "cricket", range: "pitch" })).toContain('data-range="pitch"');
  });
});

describe("a cricket score is a board: runs, wickets and overs, innings by innings", () => {
  const away = { name: "Harbour City Gulls", abbr: "HCG", score: 245, wickets: 6, overs: "50", color: "#1f5fa8", innings: [245] };
  const home = { name: "Prairie Ridge Bison", abbr: "PRB", score: 187, wickets: 10, overs: "41.2", color: "#b5452c", innings: [187] };

  it("writes each team's runs and wickets as 245/6, its overs and its innings on the board, and says them in the description", () => {
    const svg = drawKyogijo({ sport: "cricket", away, home, status: "final", id: "c" });
    const text = walk(parseXml(svg)).filter((node) => node.name === "text").map((node) => node.text);
    expect(text).toEqual(expect.arrayContaining(["245/6", "187/10", "50", "41.2", "1", "Total", "Ov"]));
    expect(svg).toContain("Harbour City Gulls: 245 runs for 6 wickets in 50 overs.");
    expect(svg).toContain("By innings, Prairie Ridge Bison: 187.");
    expect(svg).toContain('data-winner="away"');
  });

  it("has one column for each innings a team gives, and a Test's four", () => {
    const test = { sport: "cricket" as const, away: { ...away, innings: ["312", "178/4"], score: 490, wickets: 4 }, home: { ...home, innings: ["263", "301"], score: 564, wickets: 10 }, status: "innings-4", id: "t" };
    const svg = drawKyogijo(test);
    const text = walk(parseXml(svg)).filter((node) => node.name === "text").map((node) => node.text);
    expect(text).toEqual(expect.arrayContaining(["312", "178/4", "263", "301", "490/4", "564/10", "1", "2"]));
    expect(svg).toContain("Innings 4");
  });

  it("draws the board below the pitch, in the ground, and the badge with the ground as its picture", () => {
    const svg = drawKyogijo({ sport: "cricket", away, home, id: "b", size: "badge" });
    expect(svg).toContain("ky-glyph");
    expect(drawKyogijo({ sport: "cricket", away, home, id: "c", size: "compact" })).toContain("ky-strip");
  });

  it("writes an innings as a status in both languages", () => {
    expect(statusLabel("innings-2")).toBe("Innings 2");
    expect(statusLabel("Innings 3", "en")).toBe("Innings 3");
    expect(statusLabel("innings-2", "ja")).toBe("第2イニング");
    expect(statusLabel("第4イニング", "en")).toBe("Innings 4");
  });

  it("finds the winner by the runs", () => {
    expect(winnerOf({ sport: "cricket", home, away, status: "final" })).toBe("away");
    expect(winnerOf({ sport: "cricket", home: { ...home, score: 245 }, away, status: "final" })).toBe("none");
    expect(totalText({ score: "152", wickets: "4" })).toBe("152/4");
    expect(totalText({ score: "152", wickets: undefined })).toBe("152");
  });

  it("is within the budget", () => {
    expect(drawKyogijo({ sport: "cricket", away, home }).length).toBeLessThan(17_500);
    expect(cricketBoardMarkup).toBeTypeOf("function");
  });
});
