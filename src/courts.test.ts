// The net sports' courts, each held to its rulebook: the ITF's Rules of Tennis (2026, Rule 1 and Appendix X), the FIVB's Official Volleyball Rules and Official
// Beach Volleyball Rules (2025-2028, Rules 1 and 2), the BWF's Laws of Badminton (as amended 26 April 2025, Law 1 and Diagram A), USA Pickleball's rulebook (2026,
// Section 3) and the ITTF's Laws of Table Tennis (2026 statutes, 2.1 and 2.2). Each figure is the rule's, read off the geometry the drawing is made from and, for a few,
// off the drawing; the rule numbers are in docs/sources.md.
import { describe, expect, it } from "vitest";
import { courtFor, courtGeometry, courtSize, isNetSport, LOOKS, type CourtGeometry, type Rect } from "./court.ts";
import { COURT_LOOKS, KYOGIJO_COURTS_STYLE } from "./courts.style.ts";
import { describe as describeDrawing, drawKyogijo, statusLabel, winnerOf } from "./draw.ts";
import { convert, fromSurface, toSurface } from "./frames.ts";
import "./frames.providers.ts";
import { BEACH_VOLLEYBALL, PICKLEBALL, TABLE_TENNIS, TENNIS, dimensionsOf, surfaceSize } from "./geometry.ts";
import { buildZoneSet } from "./heat.zones.ts";
import { layerTable } from "./layers.ts";
import { LEAGUES, LEAGUE_SOURCES, chooseLeague, leagueById, leagueFigures, leagueSize, netOf } from "./leagues.ts";
import { BWF_BADMINTON, FIVB_BEACH, FIVB_INDOOR, ITF_TENNIS, ITTF_TABLE, USAP_PICKLEBALL } from "./leagues/courts.ts";
import { outlineOf } from "./outline.ts";
import { setCount } from "./sets.board.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { SURFACE_UNITS } from "./units.ts";
import type { ScoreOptions, Sport, SurfaceOptions } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const FT_PER_M = 1 / 0.3048;
const parse = (svg: string): Node => parseXml(svg);
const viewBox = (svg: Node): number[] => svg.attrs.viewBox.split(" ").map(Number);
const geometry = (o: Pick<SurfaceOptions, "sport" | "league" | "net">): CourtGeometry => courtGeometry(courtFor(o));
/** True when a rectangle (feet) is among the lines, to a hundredth of an inch. */
const near = (a: Rect, b: Rect): boolean => a.every((v, i) => Math.abs(v - b[i]) < 0.0009);
const has = (rects: readonly Rect[], r: Rect): boolean => rects.some((x) => near(x, r));
/** A rectangle in metres, as feet. */
const m = (...r: [number, number, number, number]): Rect => r.map((v) => v * FT_PER_M) as unknown as Rect;
const inch = (n: number): number => n / 12;

const GULLS = { name: "Harbour City Gulls", abbr: "HCG", score: 1, color: "#1d4f91", sets: [6, 6, 2], tiebreaks: [5, null, null], points: "40", serving: true };
const BISON = { name: "Prairie Ridge Bison", abbr: "PRB", score: 1, color: "#a8452c", sets: [7, 3, 3], points: "30" };
const match = (sport: Sport, extra: Partial<ScoreOptions> = {}): ScoreOptions => ({ sport, away: GULLS, home: BISON, status: "set-3", competition: "Final", id: "g", ...extra }) as ScoreOptions;

const NET_SPORTS = ["tennis", "volleyball", "badminton", "pickleball", "tabletennis"] as const;

describe("tennis: the ITF's Rules of Tennis, Rule 1", () => {
  it("the court is 78 feet (23.77 m) long, 27 feet (8.23 m) wide for singles and 36 feet (10.97 m) for doubles", () => {
    expect([ITF_TENNIS.length, ITF_TENNIS.widthSingles, ITF_TENNIS.widthDoubles]).toEqual([78, 27, 36]);
    expect(78 * 0.3048).toBeCloseTo(23.77, 2);
    expect(27 * 0.3048).toBeCloseTo(8.23, 2);
    expect(36 * 0.3048).toBeCloseTo(10.97, 2);
    expect(courtSize(courtFor({ sport: "tennis" }))).toEqual({ length: 78, width: 36 });
    expect(TENNIS.length).toBe(78);
  });

  it("the net is 3 feet 6 inches (1.07 m) at the posts and 3 feet (0.914 m) at the centre", () => {
    expect(ITF_TENNIS.net.heightPosts).toBe(3.5);
    expect(ITF_TENNIS.net.heightCentre).toBe(3);
    expect(3.5 * 0.3048).toBeCloseTo(1.07, 2);
    expect(3 * 0.3048).toBeCloseTo(0.914, 3);
  });

  it("the centres of the posts are 3 feet outside the doubles court, and singles sticks' 3 feet outside the singles court (Appendix X: 21 and 16.5 feet from the middle of the net)", () => {
    const g = geometry({ sport: "tennis", net: { sticks: true } });
    expect(g.posts.map((p) => [p.x, p.y])).toEqual([[39, -3], [39, 39]]);
    expect(g.net).toEqual({ x: 39, y0: -3, y1: 39 });
    expect(g.sticks.map((p) => [p.x, p.y])).toEqual([[39, 1.5], [39, 34.5]]);
    // From the middle of the net (y = 18): the posts 21 feet, the sticks 16.5 feet.
    expect(g.posts.map((p) => Math.abs(p.y - 18))).toEqual([21, 21]);
    expect(g.sticks.map((p) => Math.abs(p.y - 18))).toEqual([16.5, 16.5]);
    expect(geometry({ sport: "tennis" }).sticks).toEqual([]);
  });

  it("the posts are at most 6 inches square, singles sticks at most 3 inches", () => {
    const g = geometry({ sport: "tennis", net: { sticks: true } });
    expect(g.posts[0].size).toBe(0.5);
    expect(g.sticks[0].size).toBe(0.25);
    expect(g.posts[0].shape).toBe("square");
  });

  it("the service lines are 21 feet (6.40 m) from the net, between the singles sidelines, and the centre service line is half way between them", () => {
    const g = geometry({ sport: "tennis" });
    const w = inch(2);
    // To the outside of the line: the one at the left from x = 39 - 21 = 18 to 18 + 2 in.
    expect(has(g.lines, [18, 4.5, 18 + w, 31.5])).toBe(true);
    expect(has(g.lines, [60 - w, 4.5, 60, 31.5])).toBe(true);
    expect(has(g.lines, [18, 18 - w / 2, 60, 18 + w / 2])).toBe(true);
    expect(21 * 0.3048).toBeCloseTo(6.4, 2);
  });

  it("the singles sidelines are 4 feet 6 inches inside the doubles sidelines (27 feet between their outside edges)", () => {
    const g = geometry({ sport: "tennis" });
    const w = inch(2);
    expect(has(g.lines, [0, 4.5, 78, 4.5 + w])).toBe(true);
    expect(has(g.lines, [0, 31.5 - w, 78, 31.5])).toBe(true);
  });

  it("the centre mark is 4 inches long and 2 inches wide, drawn inside the court from the baseline", () => {
    const g = geometry({ sport: "tennis" });
    const w = inch(2);
    expect(has(g.lines, [w, 18 - w / 2, w + inch(4), 18 + w / 2])).toBe(true);
    expect(has(g.lines, [78 - w - inch(4), 18 - w / 2, 78 - w, 18 + w / 2])).toBe(true);
    expect(ITF_TENNIS.centreMark).toEqual({ length: inch(4), width: inch(2) });
  });

  it("the lines are 2 inches wide (the rule allows 1 to 2, the baselines up to 4) and every court measurement is to the outside of the lines", () => {
    expect(ITF_TENNIS.lineWidth).toBeCloseTo(inch(2), 10);
    expect(ITF_TENNIS.baselineWidthMax).toBeCloseTo(inch(4), 10);
    const g = geometry({ sport: "tennis" });
    const w = inch(2);
    expect(has(g.lines, [0, 0, w, 36])).toBe(true);
    expect(has(g.lines, [78 - w, 0, 78, 36])).toBe(true);
    for (const r of g.lines) expect(r[0] >= 0 && r[1] >= 0 && r[2] <= 78 + 1e-9 && r[3] <= 36 + 1e-9).toBe(true);
  });

  it("Appendix X recommends 21 feet behind the baselines and 12 beside the sidelines for international play, 18 and 10 for clubs", () => {
    expect(courtFor({ sport: "tennis" }).zone).toEqual({ side: 12, end: 21 });
    expect(courtFor({ sport: "tennis", net: { free: "least" } }).zone).toEqual({ side: 10, end: 18 });
    expect(courtFor({ sport: "tennis", net: { free: "none" } }).zone).toBeNull();
  });
});

describe("volleyball: the FIVB's Official Volleyball Rules 2025-2028, Rules 1 and 2", () => {
  it("1.1: the court is 18 by 9 m, with a free zone of at least 3 m (5 m beside the side lines and 6.5 m behind the end lines for the FIVB's competitions)", () => {
    expect([FIVB_INDOOR.length, FIVB_INDOOR.width]).toEqual([18, 9]);
    expect(courtSize(courtFor({ sport: "volleyball" })).length).toBeCloseTo(18 * FT_PER_M, 6);
    expect(courtFor({ sport: "volleyball" }).zone?.side).toBeCloseTo(5 * FT_PER_M, 6);
    expect(courtFor({ sport: "volleyball" }).zone?.end).toBeCloseTo(6.5 * FT_PER_M, 6);
    expect(courtFor({ sport: "volleyball", net: { free: "least" } }).zone?.side).toBeCloseTo(3 * FT_PER_M, 6);
    expect(courtFor({ sport: "volleyball", net: { free: "least" } }).zone?.end).toBeCloseTo(3 * FT_PER_M, 6);
  });

  it("1.3.1 and 1.3.2: the lines are 5 cm wide and drawn inside the dimensions of the court", () => {
    const g = geometry({ sport: "volleyball" });
    const w = 0.05;
    expect(has(g.lines, m(0, 0, w, 9))).toBe(true);
    expect(has(g.lines, m(18 - w, 0, 18, 9))).toBe(true);
    expect(has(g.lines, m(0, 0, 18, w))).toBe(true);
    expect(has(g.lines, m(0, 9 - w, 18, 9))).toBe(true);
  });

  it("1.3.3: the axis of the centre line divides the court into two of 9 by 9 m", () => {
    const g = geometry({ sport: "volleyball" });
    expect(has(g.lines, m(9 - 0.025, 0, 9 + 0.025, 9))).toBe(true);
    expect(g.net.x).toBeCloseTo(9 * FT_PER_M, 6);
  });

  it("1.3.4: each attack line's rear edge is 3 m from the axis of the centre line", () => {
    const g = geometry({ sport: "volleyball" });
    expect(has(g.lines, m(6, 0, 6.05, 9))).toBe(true);
    expect(has(g.lines, m(11.95, 0, 12, 9))).toBe(true);
    // The front zone is between the axis and the attack line's rear edge, on each side.
    expect(has(g.areas, m(6, 0, 9, 9))).toBe(true);
    expect(has(g.areas, m(9, 0, 12, 9))).toBe(true);
  });

  it("1.3.4: for the FIVB's competitions the attack line is extended by five 15 cm lines 5 cm wide, 20 cm from each other, to a total length of 1.75 m", () => {
    const g = geometry({ sport: "volleyball" });
    // On the left attack line, above the court: the first dash starts 20 cm from the side line.
    const above = g.small.filter((r) => r[0] < 9 * FT_PER_M && r[3] <= 0).sort((a, b) => b[3] - a[3]);
    expect(above).toHaveLength(5);
    above.forEach((r, i) => {
      expect(r[3] - r[1], `dash ${i}`).toBeCloseTo(0.15 * FT_PER_M, 6);
      expect(-r[3], `gap ${i}`).toBeCloseTo((0.2 + i * 0.35) * FT_PER_M, 6);
      expect(r[2] - r[0]).toBeCloseTo(0.05 * FT_PER_M, 6);
    });
    expect(-above[4][1]).toBeCloseTo(1.75 * FT_PER_M, 6);
    // Four extensions in all (two attack lines, above and below), and none when only the least is drawn.
    expect(g.small.filter((r) => r[3] <= 0 || r[1] >= 9 * FT_PER_M).length).toBe(20);
    expect(geometry({ sport: "volleyball", net: { free: "least" } }).small.filter((r) => r[3] < -0.5 || r[1] > 9 * FT_PER_M + 0.5)).toHaveLength(0);
  });

  it("1.4.2: the service zone is limited by two lines 15 cm long, 20 cm behind the end line, in the side lines' extensions", () => {
    const g = geometry({ sport: "volleyball" });
    const w = 0.05;
    expect(has(g.small, m(-0.35, 0, -0.2, w))).toBe(true);
    expect(has(g.small, m(-0.35, 9 - w, -0.2, 9))).toBe(true);
    expect(has(g.small, m(18.2, 0, 18.35, w))).toBe(true);
    expect(has(g.small, m(18.2, 9 - w, 18.35, 9))).toBe(true);
    expect(FIVB_INDOOR.serviceZone).toBe(9);
  });

  it("2.1 to 2.5: the net is 1 m wide and 9.50 to 10 m long, 2.43 m (men) or 2.24 m (women) high; antennae 1.80 m long and 10 mm across at the outer edge of the side bands; posts 0.50 to 1.00 m outside the side lines, 1 m for the FIVB's competitions", () => {
    const n = FIVB_INDOOR.net;
    expect([n.width, n.length, n.heightMen, n.heightWomen, n.postsOutside, n.postsOutsideLeast]).toEqual([1, 10, 2.43, 2.24, 1, 0.5]);
    expect(n.antenna).toEqual({ length: 1.8, diameter: 0.01 });
    const g = geometry({ sport: "volleyball" });
    expect(g.net.y1 - g.net.y0).toBeCloseTo(10 * FT_PER_M, 6);
    expect(g.net.y0).toBeCloseTo(-0.5 * FT_PER_M, 6);
    expect(g.posts.map((p) => p.y)).toEqual([-1 * FT_PER_M, 10 * FT_PER_M].map((v) => expect.closeTo(v, 6)));
    expect(geometry({ sport: "volleyball", net: { free: "least" } }).posts[0].y).toBeCloseTo(-0.5 * FT_PER_M, 6);
    // Each antenna is over a side line's outer edge, on the net.
    expect(g.antennae.map((a) => a.y)).toEqual([0, 9 * FT_PER_M].map((v) => expect.closeTo(v, 6)));
    expect(g.antennae.every((a) => a.x === g.net.x)).toBe(true);
  });
});

describe("beach volleyball: the FIVB's Official Beach Volleyball Rules 2025-2028, Rules 1 and 2", () => {
  it("1.1.1: the court is 16 by 8 m inside a free zone of at least 3 m (at least 5 m for the FIVB's competitions)", () => {
    expect([FIVB_BEACH.length, FIVB_BEACH.width]).toEqual([16, 8]);
    const plan = courtFor({ sport: "volleyball", league: "fivb-beach" });
    expect(plan.sport === "volleyball" && plan.league.id).toBe("fivb-beach");
    expect(courtSize(plan).length).toBeCloseTo(16 * FT_PER_M, 6);
    expect(plan.zone?.side).toBeCloseTo(5 * FT_PER_M, 6);
    expect(courtFor({ sport: "volleyball", league: "fivb-beach", net: { free: "least" } }).zone?.side).toBeCloseTo(3 * FT_PER_M, 6);
    expect(BEACH_VOLLEYBALL.length).toBeCloseTo(16 * FT_PER_M, 6);
  });

  it("1.3.2: the lines are 5 cm wide, inside the dimensions, and there is no centre line (and so no attack line)", () => {
    const g = geometry({ sport: "volleyball", league: "fivb-beach" });
    expect(g.lines).toHaveLength(4);
    expect(has(g.lines, m(0, 0, 0.05, 8))).toBe(true);
    expect(g.areas).toEqual([]);
    expect(g.small).toEqual([]);
  });

  it("2.2: the net is 8.5 m long; 2.5.1: the posts are 0.70 to 1.00 m outside the side lines, 1 m for the FIVB's competitions", () => {
    expect(FIVB_BEACH.net.length).toBe(8.5);
    expect([FIVB_BEACH.net.postsOutside, FIVB_BEACH.net.postsOutsideLeast]).toEqual([1, 0.7]);
    const g = geometry({ sport: "volleyball", league: "fivb-beach" });
    expect(g.net.y1 - g.net.y0).toBeCloseTo(8.5 * FT_PER_M, 6);
    expect(g.posts[0].y).toBeCloseTo(-1 * FT_PER_M, 6);
    expect(geometry({ sport: "volleyball", league: "fivb-beach", net: { free: "least" } }).posts[0].y).toBeCloseTo(-0.7 * FT_PER_M, 6);
  });

  it("is the volleyball league `fivb-beach`, and the indoor court is the sport's own", () => {
    expect(LEAGUES.volleyball.map((l) => l.id)).toEqual(["fivb", "fivb-beach"]);
    expect(chooseLeague({ sport: "volleyball", league: "fivb-beach" }).league?.id).toBe("fivb-beach");
    expect(chooseLeague({ sport: "volleyball", league: "fivb" }).league).toBeUndefined();
    expect(() => drawKyogijo({ sport: "volleyball", league: "bwf" })).toThrow(/is a badminton league/);
  });
});

describe("badminton: the BWF's Laws of Badminton, Law 1 and Diagram A", () => {
  const g = geometry({ sport: "badminton" });
  const w = 0.04;

  it("Diagram A: 13 400 by 6 100 mm overall, lines 40 mm wide (1.1), the lines part of the area they define (1.3)", () => {
    expect([BWF_BADMINTON.length, BWF_BADMINTON.width, BWF_BADMINTON.lineWidth]).toEqual([13.4, 6.1, 0.04]);
    expect(has(g.lines, m(0, 0, w, 6.1))).toBe(true);
    expect(has(g.lines, m(13.4 - w, 0, 13.4, 6.1))).toBe(true);
    expect(has(g.lines, m(0, 0, 13.4, w))).toBe(true);
    expect(has(g.lines, m(0, 6.1 - w, 13.4, 6.1))).toBe(true);
  });

  it("Diagram A: the singles side lines are 460 mm inside the doubles side lines (40 + 420), 5.18 m apart outside to outside", () => {
    expect(has(g.lines, m(0, 0.46, 13.4, 0.5))).toBe(true);
    expect(has(g.lines, m(0, 6.1 - 0.5, 13.4, 6.1 - 0.46))).toBe(true);
    expect(6.1 - 2 * BWF_BADMINTON.singlesInset).toBeCloseTo(5.18, 10);
  });

  it("Diagram A: the doubles long service lines are 760 mm inside the back boundary lines (40 + 720)", () => {
    expect(has(g.lines, m(0.76, 0, 0.8, 6.1))).toBe(true);
    expect(has(g.lines, m(13.4 - 0.8, 0, 13.4 - 0.76, 6.1))).toBe(true);
  });

  it("Diagram A: the back boundary line is the singles long service line, and the line 760 mm in from it is the doubles long service line: the labelled parts say so", () => {
    const names = KYOGIJO_STRINGS.en.notes.names as Record<string, string>;
    const svg = drawKyogijo({ sport: "badminton", landmarks: true });
    expect(svg).toContain("Doubles long service line");
    expect(svg).toContain("Back boundary line (the singles long service line)");
    expect(names["long-service-line"]).toBeUndefined();
  });

  it("Diagram A: the short service lines are 1 980 mm from the net, and the centre lines run from them to the back boundary lines", () => {
    expect(has(g.lines, m(6.7 - 1.98 - w, 0, 6.7 - 1.98, 6.1))).toBe(true);
    expect(has(g.lines, m(6.7 + 1.98, 0, 6.7 + 1.98 + w, 6.1))).toBe(true);
    expect(has(g.lines, m(0, 3.05 - w / 2, 6.7 - 1.98 - w, 3.05 + w / 2))).toBe(true);
    expect(has(g.lines, m(6.7 + 1.98 + w, 3.05 - w / 2, 13.4, 3.05 + w / 2))).toBe(true);
  });

  it("1.4, 1.5, 1.7 and 1.10: posts 1.55 m high on the doubles side lines; the net 760 mm deep and at least 6.1 m wide, 1.524 m high at the centre and 1.55 m over the side lines", () => {
    expect(BWF_BADMINTON.net).toEqual({ postHeight: 1.55, heightCentre: 1.524, heightSides: 1.55, depth: 0.76, widthMin: 6.1 });
    expect(g.net.y1 - g.net.y0).toBeCloseTo(6.1 * FT_PER_M, 6);
    // The posts stand on the side lines and do not reach into the court beyond them.
    for (const post of g.posts) {
      const inner = post.y < 3.05 * FT_PER_M ? post.y + post.size / 2 : post.y - post.size / 2;
      expect(post.y < 3.05 * FT_PER_M ? inner <= w * FT_PER_M + 1e-9 : inner >= (6.1 - w) * FT_PER_M - 1e-9).toBe(true);
    }
    expect(courtFor({ sport: "badminton" }).zone).toBeNull();
  });
});

describe("pickleball: USA Pickleball's 2026 rulebook, Section 3", () => {
  const g = geometry({ sport: "pickleball" });
  const w = inch(2);

  it("3.A.1 and 3.A.2: 20 by 44 feet (6.10 by 13.41 m), measured to the outside edge of the lines", () => {
    expect([USAP_PICKLEBALL.length, USAP_PICKLEBALL.width]).toEqual([44, 20]);
    expect(44 * 0.3048).toBeCloseTo(13.41, 2);
    expect(20 * 0.3048).toBeCloseTo(6.1, 2);
    expect(has(g.lines, [0, 0, w, 20])).toBe(true);
    expect(has(g.lines, [44 - w, 0, 44, 20])).toBe(true);
    expect(has(g.lines, [0, 0, 44, w])).toBe(true);
    expect(PICKLEBALL.length).toBe(44);
  });

  it("3.A.4.c: the non-volley zone is 7 feet (2.13 m) from the net on each side, the whole width of the court", () => {
    expect(has(g.lines, [22 - 7, 0, 22 - 7 + w, 20])).toBe(true);
    expect(has(g.lines, [22 + 7 - w, 0, 22 + 7, 20])).toBe(true);
    expect(g.areas).toEqual([[15, 0, 22, 20], [22, 0, 29, 20]]);
    expect(7 * 0.3048).toBeCloseTo(2.13, 2);
  });

  it("3.A.4.d: the centerline runs down the middle from each non-volley zone line to the baseline", () => {
    expect(has(g.lines, [0, 10 - w / 2, 15, 10 + w / 2])).toBe(true);
    expect(has(g.lines, [29, 10 - w / 2, 44, 10 + w / 2])).toBe(true);
  });

  it("3.A.4.e: all the lines are 2 inches (5.08 cm) wide", () => {
    expect(USAP_PICKLEBALL.lineWidth).toBeCloseTo(inch(2), 10);
    expect(2 * 2.54).toBeCloseTo(5.08, 10);
  });

  it("3.B.2, 3.B.3, 3.B.6, 3.B.7: posts 22 feet apart inside to inside and at most 3 inches across; the net at least 21 feet 9 inches long, 36 inches high at the sidelines and 34 at the center", () => {
    const n = USAP_PICKLEBALL.net;
    expect(n.postsInside).toBe(22);
    expect(n.postDiameter).toBeCloseTo(inch(3), 10);
    expect(n.lengthMin).toBeCloseTo(21.75, 10);
    expect(n.heightSides).toBe(3);
    expect(n.heightCentre).toBeCloseTo(34 / 12, 10);
    // The inside of each post is 1 foot outside a sideline, so the net between them is 22 feet.
    expect(g.net.y1 - g.net.y0).toBe(22);
    expect(g.net.y1 - g.net.y0).toBeGreaterThanOrEqual(n.lengthMin);
    expect(g.posts.map((p) => p.y - p.size / 2 + (p.y < 10 ? p.size : 0))).toEqual([-1, 21]);
  });

  it("3.A.3: a playing surface of at least 30 by 60 feet; 34 by 64 recommended for tournaments", () => {
    expect(courtFor({ sport: "pickleball" }).zone).toEqual({ side: 7, end: 10 });
    expect(courtFor({ sport: "pickleball", net: { free: "least" } }).zone).toEqual({ side: 5, end: 8 });
    expect(20 + 2 * 5).toBe(30);
    expect(44 + 2 * 8).toBe(60);
    expect(20 + 2 * 7).toBe(34);
    expect(44 + 2 * 10).toBe(64);
  });
});

describe("table tennis: the ITTF's Laws of Table Tennis, 2.1 and 2.2", () => {
  const g = geometry({ sport: "tabletennis" });

  it("2.1.1: the playing surface is 2.74 m long and 1.525 m wide, 76 cm above the floor", () => {
    expect([ITTF_TABLE.length, ITTF_TABLE.width, ITTF_TABLE.height]).toEqual([2.74, 1.525, 0.76]);
    expect(courtSize(courtFor({ sport: "tabletennis" })).length).toBeCloseTo(2.74 * FT_PER_M, 6);
    expect(courtSize(courtFor({ sport: "tabletennis" })).width).toBeCloseTo(1.525 * FT_PER_M, 6);
    expect(TABLE_TENNIS.width).toBeCloseTo(1.525 * FT_PER_M, 6);
  });

  it("2.1.4: a white side line and end line 2 cm wide; 2.1.6: a centre line 3 mm wide", () => {
    expect(has(g.lines, m(0, 0, 2.74, 0.02))).toBe(true);
    expect(has(g.lines, m(0, 1.525 - 0.02, 2.74, 1.525))).toBe(true);
    expect(has(g.lines, m(0, 0, 0.02, 1.525))).toBe(true);
    expect(has(g.lines, m(2.74 - 0.02, 0, 2.74, 1.525))).toBe(true);
    expect(has(g.lines, m(0, 1.525 / 2 - 0.0015, 2.74, 1.525 / 2 + 0.0015))).toBe(true);
    expect([ITTF_TABLE.edgeLine, ITTF_TABLE.centreLine]).toEqual([0.02, 0.003]);
  });

  it("2.1.5: the net divides the surface into two equal courts, parallel with the end lines", () => {
    expect(g.net.x).toBeCloseTo(1.37 * FT_PER_M, 6);
  });

  it("2.2.2 and 2.2.3: the net is 15.25 cm above the playing surface, on posts 15.25 cm high whose outside limits are 15.25 cm outside the side line", () => {
    expect(ITTF_TABLE.net).toEqual({ height: 0.1525, postHeight: 0.1525, postOutside: 0.1525 });
    const outside = g.posts.map((p) => (p.y < 0.76 * FT_PER_M ? -(p.y - p.size / 2) : p.y + p.size / 2 - 1.525 * FT_PER_M));
    for (const reach of outside) expect(reach).toBeCloseTo(0.1525 * FT_PER_M, 6);
  });
});

describe("the sports and their leagues", () => {
  it("are five more surfaces, each a family with its own league, the sport's own first", () => {
    for (const sport of NET_SPORTS) {
      expect(isNetSport(sport)).toBe(true);
      expect(LEAGUES[sport].length).toBeGreaterThan(0);
      expect(LEAGUES[sport][0].builtIn, sport).toBe(true);
      expect(LEAGUES[sport][0].family, sport).toBe(sport);
      for (const league of LEAGUES[sport]) for (const id of league.sources) expect(LEAGUE_SOURCES[id], id).toBeDefined();
    }
    expect(isNetSport("curling")).toBe(false);
    expect(LEAGUES.tennis.map((l) => l.id)).toEqual(["itf"]);
    expect(LEAGUES.badminton.map((l) => l.id)).toEqual(["bwf"]);
    expect(LEAGUES.pickleball.map((l) => l.id)).toEqual(["usap"]);
    expect(LEAGUES.tabletennis.map((l) => l.id)).toEqual(["ittf"]);
  });

  it("keep each rulebook's own unit: feet for the ITF and USA Pickleball, metres for the FIVB, the BWF and the ITTF", () => {
    expect(SURFACE_UNITS).toMatchObject({ tennis: "ft", pickleball: "ft", volleyball: "m", badminton: "m", tabletennis: "m" });
    for (const sport of NET_SPORTS) for (const league of LEAGUES[sport]) expect(league.unit, league.id).toBe(SURFACE_UNITS[sport]);
  });

  it("give the size of their court in the rulebook's unit and any other", () => {
    expect(leagueSize("tennis", "itf")).toEqual({ length: 78, width: 36, unit: "ft" });
    expect(leagueSize("volleyball", "fivb").length).toBeCloseTo(18, 6);
    expect(leagueSize("volleyball", "fivb-beach", "ft").length).toBeCloseTo(16 * FT_PER_M, 6);
    expect(leagueSize("badminton", "bwf").width).toBeCloseTo(6.1, 6);
    expect(leagueSize("pickleball", "usap")).toEqual({ length: 44, width: 20, unit: "ft" });
    expect(leagueSize("tabletennis", "ittf").length).toBeCloseTo(2.74, 6);
    expect(surfaceSize("tennis", "ft")).toEqual({ length: 78, width: 36, unit: "ft" });
    expect(surfaceSize("volleyball").length).toBeCloseTo(18, 6);
    expect(netOf(LEAGUES.tennis[0] as never)).toEqual(TENNIS);
  });

  it("say their key figures in words, each in the unit of its rulebook", () => {
    const say = (sport: Sport, id: string): string => leagueFigures(leagueById(sport, id) as never).map(([k, v]) => `${k}: ${v}`).join("; ");
    expect(say("tennis", "itf")).toContain("court: 78 ft by 36 ft (singles 27 ft wide)");
    expect(say("tennis", "itf")).toContain("service line: 21 ft from the net");
    expect(say("volleyball", "fivb")).toContain("attack line: 3 m from the centre line");
    expect(say("volleyball", "fivb-beach")).toContain("attack line: none");
    expect(say("badminton", "bwf")).toContain("short service line: 1.98 m from the net");
    expect(say("pickleball", "usap")).toContain("non-volley zone: 7 ft from the net");
    expect(say("tabletennis", "ittf")).toContain("table: 2.74 m by 1.525 m, 0.76 m high");
  });

  it("give every sport dimensions in a unit, kept in the same shape", () => {
    expect(dimensionsOf("tennis", "ft")).toEqual(TENNIS);
    expect(dimensionsOf("pickleball", "m").length).toBeCloseTo(44 * 0.3048, 6);
    expect(dimensionsOf("volleyball", "m").length).toBeCloseTo(18, 6);
    expect(dimensionsOf("badminton", "m").shortServiceLine).toBeCloseTo(1.98, 6);
    expect(dimensionsOf("tabletennis", "m").height).toBeCloseTo(0.76, 6);
    // The number of lines in a set is not a length: the attack line's extension has none (it is the total over the length and the gap).
    expect(FIVB_INDOOR.attackExtension).toEqual({ length: 0.15, gap: 0.2, total: 1.75 });
    expect(Math.round(1.75 / (0.15 + 0.2))).toBe(5);
  });

  it("have an outline that is the court", () => {
    expect(outlineOf({ sport: "tennis" }).box).toEqual({ x: 0, y: 0, w: 78, h: 36 });
    expect(outlineOf({ sport: "volleyball", league: "fivb-beach" }).box.w).toBeCloseTo(16 * FT_PER_M, 6);
    expect(outlineOf({ sport: "pickleball" }).contains(10, 10)).toBe(true);
    expect(outlineOf({ sport: "pickleball" }).contains(10, 21)).toBe(false);
  });
});

describe("the drawings", () => {
  const draw = (o: Record<string, unknown>): Node => parse(drawKyogijo({ margin: 0, exactLines: true, id: "t", style: "none", ...o } as never));

  it("lie wide by default and tall when asked, each as its true shape", () => {
    for (const sport of NET_SPORTS) {
      const wide = viewBox(parse(drawKyogijo({ sport, margin: 0, net: { free: "none" } })));
      const tall = viewBox(parse(drawKyogijo({ sport, margin: 0, net: { free: "none" }, orientation: "portrait" })));
      expect(wide[2], sport).toBeGreaterThan(wide[3]);
      expect(tall[3], sport).toBeGreaterThan(tall[2]);
      expect(tall[2], sport).toBeCloseTo(wide[3], 1);
      expect(parse(drawKyogijo({ sport })).attrs["data-orientation"], sport).toBe("landscape");
    }
  });

  it("say the sport and the look, and have the right size when there is no ground and no free zone", () => {
    const tennis = draw({ sport: "tennis", net: { free: "none" } });
    expect(tennis.attrs["data-sport"]).toBe("tennis");
    expect(tennis.attrs["data-look"]).toBe("hard-blue");
    // The posts stand 3 feet outside the doubles court, 6 inches square: the drawing reaches to their outer edge.
    expect(viewBox(tennis).slice(2)).toEqual([78, 42.5]);
    expect(draw({ sport: "volleyball", net: { free: "none" } }).attrs["data-look"]).toBe("wood");
    expect(draw({ sport: "volleyball", league: "fivb-beach" }).attrs["data-look"]).toBe("sand");
    expect(draw({ sport: "volleyball", league: "fivb-beach" }).attrs["data-league"]).toBe("fivb-beach");
    expect(draw({ sport: "badminton" }).attrs["data-look"]).toBe("green");
    expect(draw({ sport: "pickleball" }).attrs["data-look"]).toBe("blue-green");
    expect(draw({ sport: "tabletennis" }).attrs["data-look"]).toBe("blue");
  });

  it("draw the free zone round the court when the rulebook gives one, and the court's lines as one path of rectangles", () => {
    const svg = draw({ sport: "tennis" });
    const free = withClass(svg, "ky-free");
    expect(free).toHaveLength(1);
    expect([free[0].attrs.x, free[0].attrs.y, free[0].attrs.width, free[0].attrs.height].map(Number)).toEqual([-21, -12, 120, 60]);
    expect(withClass(draw({ sport: "tennis", net: { free: "none" } }), "ky-free")).toHaveLength(0);
    expect(withClass(draw({ sport: "badminton" }), "ky-free")).toHaveLength(0);
    const lines = withClass(svg, "ky-fill-line");
    expect(lines).toHaveLength(1);
    expect(lines[0].attrs.d.split("Z").length - 1).toBe(geometry({ sport: "tennis" }).lines.length);
  });

  it("draw the non-volley zones and the front zones as painted areas, and none on a court that has none", () => {
    expect(withClass(draw({ sport: "pickleball" }), "ky-area")).toHaveLength(1);
    expect(withClass(draw({ sport: "volleyball" }), "ky-area")).toHaveLength(1);
    expect(withClass(draw({ sport: "tennis" }), "ky-area")).toHaveLength(0);
    expect(withClass(draw({ sport: "volleyball", league: "fivb-beach" }), "ky-area")).toHaveLength(0);
  });

  it("draw the net with its posts, the antennae of volleyball in the full detail only, and the tennis singles sticks when asked", () => {
    expect(withClass(draw({ sport: "tennis" }), "ky-nt-line")).toHaveLength(1);
    expect(withClass(draw({ sport: "tennis" }), "ky-nt-post")).toHaveLength(2);
    expect(withClass(draw({ sport: "tennis", net: { sticks: true } }), "ky-nt-post")).toHaveLength(4);
    expect(withClass(draw({ sport: "volleyball" }), "ky-red-fill")).toHaveLength(2);
    expect(withClass(draw({ sport: "volleyball", detail: "simple" }), "ky-red-fill")).toHaveLength(0);
    expect(withClass(draw({ sport: "badminton" }), "ky-red-fill")).toHaveLength(0);
  });

  it("draw every line of the indoor volleyball court: the boundary, the centre line and the two attack lines, the ten attack line extensions and the four service zone marks (the full detail), and the beach court's four boundary lines only", () => {
    const count = (svg: Node): number => withClass(svg, "ky-fill-line")[0].attrs.d.split("Z").length - 1;
    // 4 boundary lines + the centre line + 2 attack lines, then 2 attack lines x 2 sides x 5 dashes, then 2 ends x 2 marks.
    expect(count(draw({ sport: "volleyball" }))).toBe(4 + 1 + 2 + 20 + 4);
    expect(count(draw({ sport: "volleyball", detail: "simple" }))).toBe(4 + 1 + 2);
    expect(count(draw({ sport: "volleyball", net: { free: "least" } }))).toBe(4 + 1 + 2 + 4);
    expect(count(draw({ sport: "volleyball", league: "fivb-beach" }))).toBe(4);
    expect(count(draw({ sport: "volleyball", league: "fivb-beach", detail: "simple" }))).toBe(4);
  });

  it("draw the indoor centre line over the net, between the net's edges, and no such line over the beach net", () => {
    const rect = (n: Node): { x0: number; x1: number; y0: number; y1: number } => ({ x0: Number(n.attrs.x), x1: Number(n.attrs.x) + Number(n.attrs.width), y0: Number(n.attrs.y), y1: Number(n.attrs.y) + Number(n.attrs.height) });
    const indoor = draw({ sport: "volleyball" });
    const [net] = withClass(indoor, "ky-nt-line").map(rect);
    const over = withClass(indoor, "ky-fill-line").filter((n) => n.name === "rect").map(rect);
    // One rectangle, the width of the line, centred on the net and running from side line to side line: it is drawn after the net, so it shows through it.
    expect(over).toHaveLength(1);
    expect((over[0].x0 + over[0].x1) / 2).toBeCloseTo((net.x0 + net.x1) / 2, 1);
    expect(over[0].x1 - over[0].x0).toBeCloseTo(0.05 * FT_PER_M, 1);
    expect(over[0].x1 - over[0].x0).toBeLessThan(net.x1 - net.x0);
    expect([over[0].y0, over[0].y1]).toEqual([0, 9 * FT_PER_M].map((v) => expect.closeTo(v, 1)));
    const svg = drawKyogijo({ sport: "volleyball", margin: 0, exactLines: true, id: "t", style: "none" });
    expect(svg.indexOf("ky-nt-line")).toBeLessThan(svg.lastIndexOf("ky-fill-line"));
    expect(withClass(draw({ sport: "volleyball", league: "fivb-beach" }), "ky-fill-line").filter((n) => n.name === "rect")).toHaveLength(0);
  });

  it("draw lines a little thicker than painted, and at their true widths with `exactLines`", () => {
    const rects = (svg: Node): number[] => withClass(svg, "ky-fill-line")[0].attrs.d.split("Z").filter(Boolean).map((part) => {
      const [x0, y0] = part.slice(1).split("H")[0].split(" ").map(Number);
      const x1 = Number(part.split("H")[1].split("V")[0]);
      const y1 = Number(part.split("V")[1].split("H")[0]);
      return Math.min(x1 - x0, y1 - y0);
    });
    const true_ = Math.min(...rects(parse(drawKyogijo({ sport: "tennis", exactLines: true, margin: 0 }))));
    const thick = Math.min(...rects(parse(drawKyogijo({ sport: "tennis", margin: 0 }))));
    expect(true_).toBeCloseTo(inch(2), 1);
    expect(thick).toBeGreaterThan(true_);
  });

  it("refuse a look or a free zone the sport does not have, naming the ones it has", () => {
    expect(() => drawKyogijo({ sport: "tennis", net: { look: "ice" } })).toThrow(/Unknown look "ice" for tennis: use one of hard-blue, hard-green, clay, grass/);
    expect(() => drawKyogijo({ sport: "tabletennis", net: { look: "sand" } })).toThrow(/use one of blue, green/);
    expect(() => drawKyogijo({ sport: "tennis", net: { free: "wide" as never } })).toThrow(/Unknown free zone/);
  });

  it("have every look in light and in dark, written into the drawing for its own look only", () => {
    for (const sport of NET_SPORTS) {
      expect(Object.keys(COURT_LOOKS[sport]).sort(), sport).toEqual([...LOOKS[sport]].sort());
      for (const look of LOOKS[sport]) {
        const svg = drawKyogijo({ sport, net: { look } });
        expect(svg, `${sport} ${look}`).toContain(`[data-sport=${sport}][data-look=${look}]`);
        expect(svg, `${sport} ${look}`).toContain("prefers-color-scheme:dark");
        expect(svg, `${sport} ${look}`).toContain("data-theme=dark");
        for (const other of LOOKS[sport].filter((name) => name !== look)) expect(svg, `${sport} ${look} has not ${other}`).not.toContain(`[data-look=${other}]`);
        expect(KYOGIJO_COURTS_STYLE).toContain(`[data-sport=${sport}][data-look=${look}]`);
      }
    }
    expect(drawKyogijo({ sport: "tennis", style: "none" })).not.toContain("<style>");
    expect(drawKyogijo({ sport: "nba" })).not.toContain("data-look");
    expect(drawKyogijo({ sport: "nba" })).not.toContain("ky-nt-line");
  });

  it("take the colours of the page over the look's, and a theme forced", () => {
    expect(drawKyogijo({ sport: "tennis", colors: { surface: "#123456" } })).toContain("--ky-surface:#123456");
    expect(drawKyogijo({ sport: "tennis", theme: "dark" })).toContain('data-theme="dark"');
  });

  it("are the same text for the same options", () => {
    for (const sport of NET_SPORTS) expect(drawKyogijo(match(sport))).toBe(drawKyogijo(match(sport)));
  });
});

describe("a score", () => {
  it("has a board with each team's name, sets, tie-break, points and sets won, and the status and competition", () => {
    const svg = parse(drawKyogijo(match("tennis")));
    const text = walk(svg).filter((n) => n.name === "text").map((n) => n.text);
    // A long name may be set on two lines: the lines read as the name.
    const said = text.join(" ");
    expect(said).toContain("HARBOUR");
    expect(said).toContain("BISON");
    for (const word of ["6", "7", "3", "2", "5", "40", "30", "1", "Sets", "Pts", "Set 3", "Final"]) expect(text, word).toContain(word);
    expect(withClass(svg, "ky-scoreboard")).toHaveLength(1);
    // Harbour City is serving: one ball on the board.
    expect(withClass(svg, "ky-serve")).toHaveLength(1);
    // The tie-break's 5 is written small.
    expect(withClass(svg, "ky-tb").map((n) => n.text)).toEqual(["5"]);
    // The columns for the sets a match can run to: three, and a column for the points.
    expect(text.filter((word) => /^[123]$/.test(word)).length).toBeGreaterThanOrEqual(3);
  });

  it("dims the lower of the two scores in a set, and writes no column for a game's points when neither team has any", () => {
    const svg = parse(drawKyogijo(match("tennis", { away: { ...GULLS, points: undefined }, home: { ...BISON, points: undefined } })));
    const text = walk(svg).filter((n) => n.name === "text").map((n) => n.text);
    expect(text).not.toContain("Pts");
    // 6-7, 6-3, 2-3: the first and the third sets are lost by the away team, the second by the home team.
    const lost = walk(svg).filter((n) => n.name === "text" && (n.attrs.class ?? "").includes("ky-lose"));
    expect(lost.map((n) => n.text).sort()).toEqual(["2", "3", "6"]);
  });

  it("has as many columns as the sets a match can run to, and more when a team has played more", () => {
    expect(setCount(undefined, undefined, 3)).toBe(3);
    expect(setCount(["6", "4"], ["3", "6", "2", "6", "4"], 3)).toBe(5);
    const five = parse(drawKyogijo(match("tennis", { away: { ...GULLS, sets: [6, 4, 6, 3, 7] }, home: { ...BISON, sets: [3, 6, 4, 6, 5] } })));
    expect(walk(five).filter((n) => n.name === "text").map((n) => n.text).filter((word) => word === "5").length).toBeGreaterThanOrEqual(2);
    const volley = parse(drawKyogijo(match("volleyball", { away: { ...GULLS, sets: [25, 22, 25], tiebreaks: undefined, points: undefined }, home: { ...BISON, sets: [21, 25, 20], points: undefined } })));
    const heads = walk(volley).filter((n) => n.name === "text" && (n.attrs.class ?? "").includes("ky-foot")).map((n) => n.text);
    expect(heads).toEqual(expect.arrayContaining(["1", "2", "3", "4", "5", "Sets"]));
    const beach = parse(drawKyogijo({ ...match("volleyball", { league: "fivb-beach", away: { ...GULLS, sets: [21, 23], points: undefined, tiebreaks: undefined }, home: { ...BISON, sets: [18, 21], points: undefined } }) }));
    expect(walk(beach).filter((n) => n.name === "text" && (n.attrs.class ?? "").includes("ky-foot")).map((n) => n.text)).not.toContain("4");
    expect(walk(parse(drawKyogijo(match("pickleball")))).filter((n) => n.name === "text").map((n) => n.text)).toContain("Games");
    expect(walk(parse(drawKyogijo(match("badminton")))).filter((n) => n.name === "text").map((n) => n.text)).toContain("Games");
    expect(walk(parse(drawKyogijo(match("volleyball")))).filter((n) => n.name === "text").map((n) => n.text)).toContain("Sets");
  });

  it("is well formed for every sport, wide, tall, compact and as a badge, in both languages, with no NaN", () => {
    for (const sport of NET_SPORTS) {
      for (const extra of [{}, { orientation: "portrait" }, { size: "compact" }, { size: "badge" }, { language: "ja" }, { theme: "dark" }, { homeSide: "left" }, { uppercase: false }] as Partial<ScoreOptions>[]) {
        const svg = drawKyogijo(match(sport, extra));
        expect(() => parse(svg), `${sport} ${JSON.stringify(extra)}`).not.toThrow();
        expect(svg, `${sport} ${JSON.stringify(extra)}`).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });

  it("has the strip with the sport's court as its picture, and the serving ball in the corner of its team's block", () => {
    for (const sport of NET_SPORTS) {
      const badge = parse(drawKyogijo(match(sport, { size: "badge" })));
      expect(withClass(badge, "ky-glyph"), sport).toHaveLength(1);
      expect(withClass(badge, "ky-serve"), sport).toHaveLength(1);
      expect(viewBox(badge).slice(2)).toEqual([440, 64]);
    }
    const none = parse(drawKyogijo(match("tennis", { size: "badge", away: { ...GULLS, serving: false } })));
    expect(withClass(none, "ky-serve")).toHaveLength(0);
  });

  it("is a compact card: the court with the strip under it, wide or tall", () => {
    for (const orientation of ["landscape", "portrait"] as const) {
      const svg = parse(drawKyogijo(match("tennis", { size: "compact", orientation })));
      expect(withClass(svg, "ky-strip")).toHaveLength(1);
      expect(withClass(svg, "ky-scoreboard")).toHaveLength(0);
    }
  });

  it("is turned back upright on a tall court: the board is rotated against the court", () => {
    const svg = drawKyogijo(match("tennis", { orientation: "portrait" }));
    expect(svg).toContain("rotate(-90)");
    expect(drawKyogijo(match("tennis"))).not.toContain("rotate(-90)");
  });

  it("names the winner of a finished match by the sets or games it won, and the leader of one in play only when asked", () => {
    const done = match("tennis", { status: "final", away: { ...GULLS, score: 2 }, home: { ...BISON, score: 1 } });
    expect(winnerOf(done)).toBe("away");
    expect(parse(drawKyogijo(done)).attrs["data-winner"]).toBe("away");
    expect(withClass(parse(drawKyogijo(done)), "ky-winbar")).toHaveLength(1);
    expect(winnerOf(match("tennis", { away: { ...GULLS, score: 2 }, home: { ...BISON, score: 1 } }))).toBe("none");
    expect(winnerOf(match("tennis", { status: "retired", away: { ...GULLS, score: 2 }, home: { ...BISON, score: 1 }, winner: "leader" }))).toBe("away");
  });
});

describe("the words", () => {
  it("say a set, a game and a tie-break as a status, in English and in Japanese", () => {
    expect(statusLabel("set-3")).toBe("Set 3");
    expect(statusLabel("Set 2")).toBe("Set 2");
    expect(statusLabel("game-2")).toBe("Game 2");
    expect(statusLabel("tiebreak")).toBe("Tiebreak");
    expect(statusLabel("match-tiebreak")).toBe("Match tiebreak");
    expect(statusLabel("retired")).toBe("Retired");
    expect(statusLabel("walkover")).toBe("Walkover");
    expect(statusLabel("set-3", "ja")).toBe("第3セット");
    expect(statusLabel("第2セット", "ja")).toBe("第2セット");
    expect(statusLabel("game-2", "ja")).toBe("第2ゲーム");
    expect(statusLabel("tiebreak", "ja")).toBe("タイブレーク");
    expect(statusLabel("set-100")).toBe("set-100");
  });

  it("describe a court by its figures, and a score by who serves, each set and the game", () => {
    expect(describeDrawing({ sport: "tennis" }).title).toBe("Tennis court");
    expect(describeDrawing({ sport: "tennis" }).description).toContain("78 by 36 feet");
    expect(describeDrawing({ sport: "tabletennis" }).title).toBe("Table tennis table");
    expect(describeDrawing({ sport: "volleyball", league: "fivb-beach" }).title).toBe("FIVB beach volleyball court");
    expect(describeDrawing({ sport: "volleyball", league: "fivb-beach" }).description).toContain("16 by 8 metres");
    const said = describeDrawing(match("tennis")).description;
    expect(said).toContain("Harbour City Gulls is serving.");
    expect(said).toContain("By set, Harbour City Gulls: 6 (5), 6, 2.");
    expect(said).toContain("By set, Prairie Ridge Bison: 7, 3, 3.");
    expect(said).toContain("In the current game, Harbour City Gulls has 40.");
    expect(describeDrawing(match("pickleball")).description).toContain("By game, Harbour City Gulls");
    expect(describeDrawing(match("tennis", { language: "ja" })).description).toContain("Harbour City Gulls");
    expect(describeDrawing(match("tennis", { language: "ja" })).description).toContain("のサーブです。");
    expect(describeDrawing({ sport: "badminton", language: "ja" }).title).toBe("バドミントンコート");
  });

  it("have the same words in both languages for every sport", () => {
    for (const sport of NET_SPORTS) {
      expect(KYOGIJO_STRINGS.en.surface[sport]).toBeTruthy();
      expect(KYOGIJO_STRINGS.ja.surface[sport]).toBeTruthy();
      expect(KYOGIJO_STRINGS.en.about[sport]).toBeTruthy();
      expect(KYOGIJO_STRINGS.ja.about[sport]).toBeTruthy();
      expect(KYOGIJO_STRINGS.en.league[sport]).toContain("{size}");
      expect(KYOGIJO_STRINGS.ja.league[sport]).toContain("{size}");
    }
  });
});

describe("the frames", () => {
  const FRAMES = ["tennis", "volleyball", "badminton", "pickleball", "tabletennis"] as const;

  it("start at the centre of the net: x along the court, y across it, the unit the rulebook prints first", () => {
    expect(toSurface([[0, 0]], { from: "tennis" })[0]).toEqual([39, 18]);
    // The right service line is 21 feet from the net.
    expect(toSurface([[21, 0]], { from: "tennis" })[0]).toEqual([60, 18]);
    expect(toSurface([[0, 18]], { from: "tennis" })[0][1]).toBeCloseTo(0, 6);
    expect(toSurface([[7, 0]], { from: "pickleball" })[0]).toEqual([29, 10]);
    const [x, y] = toSurface([[3, 0]], { from: "volleyball", size: { length: 18, width: 9, unit: "m" } })[0];
    expect(x).toBeCloseTo((9 + 3) * FT_PER_M, 6);
    expect(y).toBeCloseTo(4.5 * FT_PER_M, 6);
    const [bx] = toSurface([[1.98, 0]], { from: "badminton" })[0];
    expect(bx).toBeCloseTo((6.7 + 1.98) * FT_PER_M, 6);
    const [tx] = toSurface([[1.37, 0]], { from: "tabletennis" })[0];
    expect(tx).toBeCloseTo(2.74 * FT_PER_M, 6);
  });

  it("are registered with a fixed size, except volleyball's (a court is indoor or beach), and read back", () => {
    for (const name of FRAMES) {
      const point: [number, number] = [2, 1];
      const size = name === "volleyball" ? { length: 16, width: 8, unit: "m" as const } : undefined;
      const there = toSurface([point], { from: name, size });
      const back = fromSurface(there, { to: name, size });
      expect(back[0][0], name).toBeCloseTo(2, 6);
      expect(back[0][1], name).toBeCloseTo(1, 6);
    }
    expect(() => toSurface([[0, 0]], { from: "volleyball" })).toThrow(/give the size/);
  });

  it("put a mark on a layer at the right place on the court, and a table row at the frame's numbers", () => {
    const svg = parse(drawKyogijo({ sport: "tennis", id: "p", layers: [{ kind: "points", name: "T", from: "tennis", data: [{ x: 21, y: 0, title: "the T" }] }] }));
    const circles = walk(svg).filter((n) => n.name === "circle" && n.attrs.cx !== undefined && Math.abs(Number(n.attrs.cx) - 60) < 0.01);
    expect(circles.length).toBeGreaterThan(0);
    const table = layerTable([{ kind: "points", name: "T", from: "tennis", data: [{ x: 21, y: 0 }] }], { surface: { sport: "tennis" } });
    expect(String(table)).toContain("21");
  });

  it("convert a spot from a frame to itself, through the court of the size it is given", () => {
    const [spot] = convert("volleyball", "volleyball", { size: { length: 18, width: 9, unit: "m" } })([[3, 0.5]]);
    expect(spot[0]).toBeCloseTo(3, 6);
    expect(spot[1]).toBeCloseTo(0.5, 6);
  });
});

describe("the zones of each side of the net", () => {
  const ctx = (sport: Sport, league?: string, end: "left" | "right" | "both" = "both") => ({
    o: { sport, league },
    outline: outlineOf({ sport, league }),
    direction: "right" as const,
    end,
    los: undefined,
    bats: undefined,
    words: KYOGIJO_STRINGS.en.layers.zones,
  });

  it("split each side at the court's own line: tennis's service line (21 ft), volleyball's attack line (3 m), badminton's short service line (1.98 m), pickleball's non-volley line (7 ft)", () => {
    const place = (sport: Sport, front: number, perFt = 1): void => {
      const set = buildZoneSet("net-court", ctx(sport));
      expect(set.zones.map((z) => z.id), sport).toEqual(["front-court-left", "back-court-left", "front-court-right", "back-court-right"]);
      const cx = ctx(sport).outline.box.w / 2;
      const y = ctx(sport).outline.box.h / 2;
      const f = front * perFt;
      expect(set.zones[set.which(cx + f / 2, y)].id, sport).toBe("front-court-right");
      expect(set.zones[set.which(cx + f + 0.5, y)].id, sport).toBe("back-court-right");
      expect(set.zones[set.which(cx - f / 2, y)].id, sport).toBe("front-court-left");
      expect(set.zones[set.which(cx - f - 0.5, y)].id, sport).toBe("back-court-left");
      expect(set.which(cx + 2 * cx, y)).toBe(-1);
    };
    place("tennis", 21);
    place("volleyball", 3, FT_PER_M);
    place("badminton", 1.98, FT_PER_M);
    place("pickleball", 7);
  });

  it("make one zone of a side where the court has no such line: beach volleyball and table tennis", () => {
    expect(buildZoneSet("net-court", ctx("volleyball", "fivb-beach")).zones.map((z) => z.id)).toEqual(["half-court-left", "half-court-right"]);
    expect(buildZoneSet("net-court", ctx("tabletennis")).zones.map((z) => z.id)).toEqual(["half-court-left", "half-court-right"]);
    expect(buildZoneSet("net-court", ctx("tennis", undefined, "right")).zones.map((z) => z.id)).toEqual(["front-court", "back-court"]);
  });

  it("are for the net sports only", () => {
    expect(() => buildZoneSet("net-court", ctx("nhl"))).toThrow(/is for tennis/);
    expect(() => buildZoneSet("nhl-slot", ctx("tennis"))).toThrow(/is for nhl/);
  });

  it("count the marks of a heat layer on a court and name the zones in Japanese", () => {
    const data = Array.from({ length: 30 }, (_, i) => ({ x: ((i * 7) % 30) - 15, y: ((i * 3) % 10) - 5 }));
    const svg = drawKyogijo({ sport: "tennis", language: "ja", layers: [{ kind: "zones", name: "balls", zones: "net-court", from: "tennis", data, labels: true }] });
    expect(svg).toContain("フロントコート");
    expect(parse(svg).name).toBe("svg");
  });
});

describe("the drawings' size", () => {
  const budget = 17_500;
  it("is within the budget for a court bare and with a score, with the stylesheet in it", () => {
    for (const sport of NET_SPORTS) {
      expect(drawKyogijo({ sport }).length, sport).toBeLessThan(budget);
      expect(drawKyogijo(match(sport)).length, `${sport} with a score`).toBeLessThan(budget);
      expect(drawKyogijo(match(sport, { size: "badge" })).length, `${sport} badge`).toBeLessThan(budget);
    }
    expect(drawKyogijo({ sport: "volleyball", league: "fivb-beach" }).length).toBeLessThan(budget);
  });
});
