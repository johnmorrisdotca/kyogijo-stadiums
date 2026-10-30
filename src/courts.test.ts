// The net sports' courts, each held to its rulebook: the ITF's Rules of Tennis (2026, Rule 1 and Appendix X), the FIVB's Official Volleyball Rules and Official
// Beach Volleyball Rules (2025-2028, Rules 1 and 2), the BWF's Laws of Badminton (as amended 26 April 2025, Law 1 and Diagram A), USA Pickleball's rulebook (2026,
// Section 3) and the ITTF's Laws of Table Tennis (2026 statutes, 2.1 and 2.2). Each figure is the rule's, read off the geometry the drawing is made from and, for a few,
// off the drawing; the rule numbers are in docs/sources.md.
import { describe, expect, it } from "vitest";
import { courtFor, courtGeometry, courtSize, isNetSport, LOOKS, type CourtGeometry, type NetLine, type Rect } from "./court.ts";
import { COURT_LOOKS, KYOGIJO_COURTS_STYLE } from "./courts.style.ts";
import { describe as describeDrawing, drawKyogijo, statusLabel, winnerOf } from "./draw.ts";
import { convert, fromSurface, toSurface } from "./frames.ts";
import "./frames.providers.ts";
import { BEACH_VOLLEYBALL, PICKLEBALL, TABLE_TENNIS, TENNIS, dimensionsOf, surfaceSize } from "./geometry.ts";
import { buildZoneSet } from "./heat.zones.ts";
import { layerTable } from "./layers.ts";
import { LEAGUES, chooseLeague, leagueById, leagueFigures, leagueSize, netOf } from "./leagues.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";
import { BWF_BADMINTON, FIP_PADEL, FITEQ_TEQBALL, FIVB_BEACH, FIVB_INDOOR, IRF_RACQUETBALL, IRF_ROUNDNET, ISTAF_SEPAK_TAKRAW, ITF_TENNIS, ITTF_TABLE, USAP_PICKLEBALL, WN_NETBALL, WPV_SITTING, WSF_SQUASH, WSF_SQUASH_DOUBLES, WSF_SQUASH_WIDE } from "./leagues/courts.ts";
import { outlineOf } from "./outline.ts";
import { setCount } from "./sets.board.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { SURFACE_UNITS } from "./units.ts";
import type { ScoreOptions, Sport, SurfaceOptions } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const FT_PER_M = 1 / 0.3048;
const parse = (svg: string): Node => parseXml(svg);
const viewBox = (svg: Node): number[] => svg.attrs.viewBox.split(" ").map(Number);
/** The geometry of a court that has a net. */
const geometry = (o: Pick<SurfaceOptions, "sport" | "league" | "net">): CourtGeometry & { net: NetLine } => {
  const g = courtGeometry(courtFor(o));
  if (g.net === null) throw new Error(`${String(o.sport)} has no net`);
  return g as CourtGeometry & { net: NetLine };
};
/** The geometry of any court, with or without a net. */
const anyGeometry = (o: Pick<SurfaceOptions, "sport" | "league" | "net">): CourtGeometry => courtGeometry(courtFor(o));
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
    expect(LEAGUES.volleyball.map((l) => l.id)).toEqual(["fivb", "fivb-beach", "wpv-sitting"]);
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
    // The space round the court is the BWF's facilities specification's (the Laws give none): 2 m behind the baselines, 1.5 m beside the side lines.
    expect(courtFor({ sport: "badminton" }).zone).toEqual({ side: 1.5 * FT_PER_M, end: 2 * FT_PER_M });
    expect(courtFor({ sport: "badminton", net: { free: "none" } }).zone).toBeNull();
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

describe("sitting volleyball: World ParaVolley's Official Sitting Volleyball Rules 2025-2028, Rules 1 and 2", () => {
  const sitting = { sport: "volleyball", league: "wpv-sitting" } as const;
  const g = geometry(sitting);

  it("is the volleyball league `wpv-sitting`, drawn as a volleyball court", () => {
    expect(chooseLeague(sitting).league?.id).toBe("wpv-sitting");
    expect(courtFor(sitting).sport).toBe("volleyball");
    expect(drawKyogijo(sitting)).toContain('data-league="wpv-sitting"');
  });

  it("1.1: the court is 10 by 6 m, a free zone of at least 3 m (4 m beside the side lines and 6 m behind the end lines for World ParaVolley's competitions)", () => {
    expect(courtSize(courtFor(sitting)).length).toBeCloseTo(10 * FT_PER_M, 6);
    expect(courtSize(courtFor(sitting)).width).toBeCloseTo(6 * FT_PER_M, 6);
    expect(courtFor(sitting).zone?.side).toBeCloseTo(4 * FT_PER_M, 6);
    expect(courtFor(sitting).zone?.end).toBeCloseTo(6 * FT_PER_M, 6);
    expect(courtFor({ ...sitting, net: { free: "least" } }).zone?.side).toBeCloseTo(3 * FT_PER_M, 6);
  });

  it("1.3.3 and 1.3.4: the centre line's axis halves the court (6 by 5 m) and each attack line's rear edge is 2 m from it, extended for those competitions by five 15 cm lines to 1.75 m", () => {
    expect(has(g.lines, m(5 - 0.025, 0, 5.025, 6))).toBe(true);
    expect(has(g.lines, m(3, 0, 3.05, 6))).toBe(true);
    expect(has(g.lines, m(6.95, 0, 7, 6))).toBe(true);
    expect(g.small.filter((r) => r[0] < 3.05 * FT_PER_M && r[2] > 3 * FT_PER_M && (r[3] < 0 || r[1] > 6 * FT_PER_M))).toHaveLength(10);
  });

  it("1.4.2: the service zone is 6 m wide, limited by two 15 cm lines 20 cm behind each end line", () => {
    expect(has(g.small, m(-0.35, 0, -0.2, 0.05))).toBe(true);
    expect(has(g.small, m(-0.35, 6 - 0.05, -0.2, 6))).toBe(true);
  });

  it("2.1 to 2.5: the net is 0.80 m wide and 7 m long, 1.15 m (men) or 1.05 m (women) high; antennae 1.60 m long; posts 1 m outside the side lines (0.5 m at the least)", () => {
    expect([FIVB_INDOOR.net.heightMen, WPV_SITTING.net.heightMen, WPV_SITTING.net.heightWomen, WPV_SITTING.net.width, WPV_SITTING.net.length, WPV_SITTING.net.antenna.length]).toEqual([2.43, 1.15, 1.05, 0.8, 7, 1.6]);
    expect(g.net.y1 - g.net.y0).toBeCloseTo(7 * FT_PER_M, 6);
    expect(g.posts[0].y).toBeCloseTo(-1 * FT_PER_M, 6);
    expect(geometry({ ...sitting, net: { free: "least" } }).posts[0].y).toBeCloseTo(-0.5 * FT_PER_M, 6);
  });
});

describe("padel: the FIP's Rules of Padel (review of application 1 January 2026), The Court", () => {
  const g = geometry({ sport: "padel" });

  it("Dimensions: 10 m wide by 20 m long inside the walls, lines 5 cm wide, with no line round the court", () => {
    expect([FIP_PADEL.length, FIP_PADEL.width, FIP_PADEL.lineWidth]).toEqual([20, 10, 0.05]);
    expect(courtSize(courtFor({ sport: "padel" })).length).toBeCloseTo(20 * FT_PER_M, 6);
    expect(g.lines).toHaveLength(3);
  });

  it("Dimensions: the service lines are 6.95 m from the net, and the central service line runs between them, 20 cm past each", () => {
    expect(has(g.lines, m(10 - 6.95, 0, 10 - 6.95 + 0.05, 10))).toBe(true);
    expect(has(g.lines, m(10 + 6.95 - 0.05, 0, 10 + 6.95, 10))).toBe(true);
    expect(has(g.lines, m(10 - 7.15, 5 - 0.025, 10 + 7.15, 5 + 0.025))).toBe(true);
  });

  it("Net: 10 m long, 0.88 m high at the centre and 0.92 m at the ends, on posts at most 1.05 m high whose outer sides are the court's lateral limits", () => {
    expect(FIP_PADEL.net).toEqual({ length: 10, heightCentre: 0.88, heightEnds: 0.92, postHeight: 1.05 });
    expect(g.net.y1 - g.net.y0).toBeCloseTo(10 * FT_PER_M, 6);
    for (const post of g.posts) expect(post.y - post.size / 2 >= -1e-9 && post.y + post.size / 2 <= g.width + 1e-9).toBe(true);
  });

  it("Enclosures: the end walls and a wall 4 m long at each end of each side are solid, the fence between them is 12 m", () => {
    const solid = g.bands.filter((b) => b.kind === "wall");
    const mesh = g.bands.filter((b) => b.kind === "mesh");
    expect(solid).toHaveLength(6);
    expect(mesh).toHaveLength(2);
    for (const b of mesh) expect(b.rect[2] - b.rect[0]).toBeCloseTo(12 * FT_PER_M, 6);
    expect(solid.filter((b) => b.rect[2] - b.rect[0] <= 1).length).toBe(2);
    expect(solid.filter((b) => Math.abs(b.rect[2] - b.rect[0] - 4 * FT_PER_M) < 1e-6)).toHaveLength(4);
  });

  it("Ground surface: green, blue or terracotta, the first the default", () => {
    expect(LOOKS.padel).toEqual(["blue", "green", "terracotta"]);
  });
});

describe("squash: World Squash's Specifications for Squash Courts (28 November 2017), clauses 4 and 5 and Appendices 1 and 2", () => {
  const g = anyGeometry({ sport: "squash" });
  const L = 9.75;
  const w = 0.05;

  it("4.01 to 4.03: a singles court 9,750 by 6,400 mm, a doubles court 7,620 mm wide and the competition width 8,420 mm", () => {
    expect([WSF_SQUASH.length, WSF_SQUASH.width, WSF_SQUASH_DOUBLES.width, WSF_SQUASH_WIDE.width]).toEqual([9.75, 6.4, 7.62, 8.42]);
    expect(courtSize(courtFor({ sport: "squash" })).width).toBeCloseTo(6.4 * FT_PER_M, 6);
    expect(courtSize(courtFor({ sport: "squash", league: "wsf-doubles" })).width).toBeCloseTo(7.62 * FT_PER_M, 6);
    expect(courtSize(courtFor({ sport: "squash", league: "wsf-doubles-wide" })).width).toBeCloseTo(8.42 * FT_PER_M, 6);
    expect(LEAGUES.squash.map((l) => l.id)).toEqual(["wsf", "wsf-doubles", "wsf-doubles-wide"]);
  });

  it("5.05.01: the short line's nearest edge is 4,260 mm from the back wall, across the whole width", () => {
    expect(has(g.lines, m(L - 4.26 - w, 0, L - 4.26, 6.4))).toBe(true);
  });

  it("5.05.02: the half court line runs from the back wall to the short line, equidistant from the side walls", () => {
    expect(has(g.lines, m(L - 4.26 - w, 3.2 - w / 2, L, 3.2 + w / 2))).toBe(true);
  });

  it("5.05.03: each service box is a square of 1,600 mm inside its lines, behind the short line and against a side wall", () => {
    const near = L - 4.26;
    expect(has(g.lines, m(near + 1.6, 0, near + 1.6 + w, 1.6 + w))).toBe(true);
    expect(has(g.lines, m(near, 1.6, near + 1.6 + w, 1.6 + w))).toBe(true);
    expect(has(g.lines, m(near + 1.6, 6.4 - 1.6 - w, near + 1.6 + w, 6.4))).toBe(true);
    expect(has(g.lines, m(near, 6.4 - 1.6 - w, near + 1.6 + w, 6.4 - 1.6))).toBe(true);
  });

  it("5.02: the front wall is laid flat beside the court: the front wall line 4,570 mm and the service line 1,780 mm up, the tin 480 mm (330 mm for the competition width)", () => {
    expect(WSF_SQUASH.wall).toEqual({ tin: 0.48, serviceLine: 1.78, frontWallLine: 4.57, backWallLine: 2.13 });
    expect(WSF_SQUASH_WIDE.wall.tin).toBe(0.33);
    expect(has(g.wallLines, m(-4.57 - w, 0, -4.57, 6.4))).toBe(true);
    expect(has(g.wallLines, m(-1.78 - w, 0, -1.78, 6.4))).toBe(true);
    expect(has(g.wallLines, m(-0.48, 0, -0.43, 6.4))).toBe(true);
    expect(g.bands.find((b) => b.kind === "tin")?.rect[0]).toBeCloseTo(-0.48 * FT_PER_M, 6);
    expect(g.net).toBeNull();
  });

  it("5.01.01: every marking is 50 mm wide, and the other three walls stand round the court", () => {
    expect(WSF_SQUASH.lineWidth).toBe(0.05);
    expect(g.bands.filter((b) => b.kind === "wall")).toHaveLength(3);
  });
});

/** The contrast ratio of two #rrggbb colours (WCAG 2). */
function contrast(a: string, b: string): number {
  const lum = (hex: string): number => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("the colours the rulebooks ask for", () => {
  it("squash: markings contrast with the surfaces beside them (5.01.01, 10.13), and the lines of the front wall may differ from the floor's: red, and 3:1 on the floor, the wall and the tin in both modes", () => {
    for (const [name, pair] of Object.entries(COURT_LOOKS.squash)) {
      for (const mode of ["light", "dark"] as const) {
        const look = pair[mode];
        expect(look.wallLine, `${name} ${mode}`).toBeDefined();
        expect(contrast(look.wallLine as string, look.face as string), `${name} ${mode} wall`).toBeGreaterThanOrEqual(3);
        expect(contrast(look.wallLine as string, look.tin as string), `${name} ${mode} tin`).toBeGreaterThanOrEqual(3);
        const floor = look.line ?? (mode === "light" ? "#ffffff" : "#e9ece6");
        expect(contrast(floor, look.surface), `${name} ${mode} floor`).toBeGreaterThanOrEqual(3);
      }
    }
    expect(COURT_LOOKS.squash.wood.light.line).toBe(COURT_LOOKS.squash.wood.light.wallLine);
    const svg = drawKyogijo({ sport: "squash", id: "c" });
    expect(svg).toContain("--ky-wall-line:#a8201a");
    expect(svg).toContain("ky-wall-line");
  });

  it("racquetball: bright red lines, blue (or black) on a convertible court (the IRF's court specifications, Section Three, Application), 3:1 on the floor", () => {
    expect(COURT_LOOKS.racquetball.wood.light.line).toBe("#c8372d");
    expect(COURT_LOOKS.racquetball.convertible.light.line).toBe("#2a5db0");
    for (const [name, pair] of Object.entries(COURT_LOOKS.racquetball)) for (const mode of ["light", "dark"] as const) expect(contrast(pair[mode].line as string, pair[mode].surface), `${name} ${mode}`).toBeGreaterThanOrEqual(3);
  });

  it("padel (lines preferably white or black), netball (lines preferably white), teqball (lines unlike the floor; table, floor and surrounds all unlike) and sitting volleyball (white lines, a light floor, a free zone unlike it): white lines and the differences asked for", () => {
    for (const sport of ["padel", "netball", "teqball", "sepaktakraw"] as const) for (const pair of Object.values(COURT_LOOKS[sport])) expect(pair.light.line, sport).toBeUndefined();
    for (const pair of Object.values(COURT_LOOKS.teqball)) for (const mode of ["light", "dark"] as const) {
      const look = pair[mode];
      expect(new Set([look.surface, look.table, look.wall]).size).toBe(3);
      expect(contrast("#ffffff", look.surface)).toBeGreaterThanOrEqual(3);
    }
    const sitting = { sport: "volleyball", league: "wpv-sitting" } as const;
    expect(courtFor(sitting).look).toBe("wood");
    expect(() => courtFor({ ...sitting, net: { look: "sand" } })).toThrow(/use one of wood/);
    expect(() => courtFor({ ...sitting, net: { look: "blue" } })).toThrow(/Unknown look/);
    expect(COURT_LOOKS.volleyball.wood.light.line).toBeUndefined();
    expect(COURT_LOOKS.volleyball.wood.light.surface).not.toBe(COURT_LOOKS.volleyball.wood.light.free);
  });
});

describe("racquetball: the IRF's Official Rules 2026-2028, Rule 2.1, and its Court Specifications (2025)", () => {
  const g = anyGeometry({ sport: "racquetball" });
  const w = 1.5 / 12;

  it("2.1(a): 20 feet wide, 40 feet long and 20 feet high; the lines 1 1/2 inches wide", () => {
    expect([IRF_RACQUETBALL.length, IRF_RACQUETBALL.width, IRF_RACQUETBALL.height, IRF_RACQUETBALL.lineWidth]).toEqual([40, 20, 20, w]);
    expect(courtSize(courtFor({ sport: "racquetball" }))).toEqual({ length: 40, width: 20 });
  });

  it("2.1(b)1 and 2: the short line's back edge is 20 feet from the back wall, the service line's front edge 5 feet in front of it", () => {
    expect(has(g.lines, [20 - w, 0, 20, 20])).toBe(true);
    expect(has(g.lines, [15, 0, 15 + w, 20])).toBe(true);
  });

  it("2.1(b)4 and 5: a service box's line is 18 inches from the side wall and a drive serve line 3 feet, to the edge nearest the centre, across the service zone", () => {
    expect(has(g.lines, [15, 1.5 - w, 20, 1.5])).toBe(true);
    expect(has(g.lines, [15, 20 - 1.5, 20, 20 - 1.5 + w])).toBe(true);
    expect(has(g.lines, [15, 3 - w, 20, 3])).toBe(true);
    expect(has(g.lines, [15, 17, 20, 17 + w])).toBe(true);
  });

  it("2.1(b)6: the receiving line's back edge is 5 feet behind the short line's, a 21 inch segment from each wall and sixteen 6 inch lines between 6 inch spaces", () => {
    const rear = g.lines.filter((r) => Math.abs(r[2] - 25) < 1e-9);
    expect(rear).toHaveLength(18);
    expect(rear.filter((r) => Math.abs(r[3] - r[1] - 21 / 12) < 1e-9)).toHaveLength(2);
    expect(rear.filter((r) => Math.abs(r[3] - r[1] - 0.5) < 1e-9)).toHaveLength(16);
    const total = rear.reduce((sum, r) => sum + (r[3] - r[1]), 0);
    expect(total + 17 * 0.5).toBeCloseTo(20, 9);
  });

  it("has no net, and the walls stand round the court", () => {
    expect(g.net).toBeNull();
    expect(g.bands).toHaveLength(4);
    expect(COURT_LOOKS.racquetball.wood.light.line).toBe("#c8372d");
  });
});

describe("sepak takraw: the ISTAF's Law of the Game (2013), Laws 1 to 3", () => {
  const g = geometry({ sport: "sepaktakraw" });
  const w = 0.04;

  it("1.1: the court is 13.4 by 6.1 m, the boundary lines drawn inwards and at most 0.04 m wide", () => {
    expect([ISTAF_SEPAK_TAKRAW.length, ISTAF_SEPAK_TAKRAW.width, ISTAF_SEPAK_TAKRAW.lineWidth]).toEqual([13.4, 6.1, 0.04]);
    expect(has(g.lines, m(0, 0, w, 6.1))).toBe(true);
    expect(has(g.lines, m(13.4 - w, 0, 13.4, 6.1))).toBe(true);
    expect(has(g.lines, m(0, 6.1 - w, 13.4, 6.1))).toBe(true);
  });

  it("1.2: the centre line is 0.02 m wide, across the middle of the court under the net", () => {
    expect(has(g.lines, m(6.7 - 0.01, 0, 6.7 + 0.01, 6.1))).toBe(true);
    expect(g.underNet).toBeCloseTo(0.02 * FT_PER_M, 9);
  });

  it("1.3: a quarter circle of 0.9 m radius at each end of the centre line, inside the court on each side of the net", () => {
    const quarters = g.rings.filter((r) => r.a0 !== undefined);
    expect(quarters).toHaveLength(4);
    for (const q of quarters) expect([q.r, (q.a1 as number) - (q.a0 as number)]).toEqual([0.9 * FT_PER_M, Math.PI / 2]);
    expect(quarters.map((q) => q.cy).sort()).toEqual([0, 0, 6.1 * FT_PER_M, 6.1 * FT_PER_M]);
  });

  it("1.4: a service circle of 0.3 m radius and 0.04 m width on each side, its centre 2.45 m from the back line and 3.05 m from the sidelines", () => {
    const circles = g.rings.filter((r) => r.a0 === undefined);
    expect(circles).toHaveLength(2);
    expect(circles.map((c) => c.cx).sort((a, b) => a - b)).toEqual([2.45 * FT_PER_M, (13.4 - 2.45) * FT_PER_M].map((v) => v));
    for (const c of circles) expect([c.r, c.w, c.cy]).toEqual([0.3 * FT_PER_M, 0.04 * FT_PER_M, 3.05 * FT_PER_M]);
  });

  it("1.5, 2 and 3: a free zone of 3.0 m; the posts 0.3 m from the sidelines, in line with the centre line; the net 0.7 m wide and at least 6.1 m long, 1.52 m (men) or 1.42 m (women) high", () => {
    expect(courtFor({ sport: "sepaktakraw" }).zone?.side).toBeCloseTo(3 * FT_PER_M, 6);
    expect(g.posts.map((p) => p.y)).toEqual([-0.3 * FT_PER_M, (6.1 + 0.3) * FT_PER_M]);
    expect(g.posts[0].x).toBeCloseTo(6.7 * FT_PER_M, 9);
    expect(ISTAF_SEPAK_TAKRAW.net).toMatchObject({ width: 0.7, length: 6.1, heightMen: 1.52, heightWomen: 1.42, postMen: 1.55, postWomen: 1.45 });
    expect(g.net.y1 - g.net.y0).toBeGreaterThanOrEqual(6.1 * FT_PER_M);
  });
});

describe("teqball: the FITEQ's Official Rules and Regulations of Teqball (2026), sections 1 and 2", () => {
  const g = geometry({ sport: "teqball" });

  it("1.1 and 1.2: the table is 3,000 by 1,500 mm and the net 1,700 mm wide, 20 mm thick and 140 mm high", () => {
    expect(FITEQ_TEQBALL.table).toEqual({ length: 3, width: 1.5, widthWithNet: 1.7, height: 0.9 });
    expect(FITEQ_TEQBALL.net).toEqual({ width: 1.7, thickness: 0.02, height: 0.14 });
    expect(g.net.y1 - g.net.y0).toBeCloseTo(1.7 * FT_PER_M, 9);
  });

  it("2.1.1.3 and 2.1.4: the table is in the exact middle of a court of 16 by 12 m, with the net parallel to the shorter sides (it runs across the 12 m)", () => {
    expect([FITEQ_TEQBALL.length, FITEQ_TEQBALL.width]).toEqual([16, 12]);
    const table = g.solids[0];
    expect(table.kind).toBe("table");
    if (table.kind === "table") expect(table.rect.map((v) => v / FT_PER_M).map((v) => Math.round(v * 1e6) / 1e6)).toEqual([6.5, 5.25, 9.5, 6.75]);
    expect(g.net.x).toBeCloseTo(8 * FT_PER_M, 9);
  });

  it("2.1.2 and 2.1.3: the halfway line is in the middle, and a service line each side is 3.5 m from the middle of the table; each is 20 to 50 mm wide", () => {
    expect(has(g.lines, m(8 - 0.025, 0, 8 + 0.025, 12))).toBe(true);
    expect(has(g.lines, m(8 - 3.5 - 0.025, 0, 8 - 3.5 + 0.025, 12))).toBe(true);
    expect(has(g.lines, m(8 + 3.5 - 0.025, 0, 8 + 3.5 + 0.025, 12))).toBe(true);
    expect(FITEQ_TEQBALL.lineWidth).toBeGreaterThanOrEqual(0.02);
    expect(FITEQ_TEQBALL.lineWidth).toBeLessThanOrEqual(0.05);
  });
});

describe("roundnet: the International Roundnet Federation's Rules (adopted 21 October 2022), Chapter 1", () => {
  const g = anyGeometry({ sport: "roundnet" });

  it("1.1.2 and 1.2.2: a set 91.4 cm across and 20.3 cm high, in a court of at least 10 by 10 m with no out of bounds", () => {
    expect(IRF_ROUNDNET.set).toEqual({ diameter: 0.914, height: 0.203 });
    expect(courtSize(courtFor({ sport: "roundnet" })).length).toBeCloseTo(10 * FT_PER_M, 6);
    const set = g.solids[0];
    expect(set.kind === "set" && set.r).toBeCloseTo(0.457 * FT_PER_M, 9);
  });

  it("1.2.3 and 1.2.4: the serving line is a circle 2.6 m from the centre of the set (2.13 m from its edge), the no hit zone line one of 0.9 m", () => {
    expect(g.rings.map((r) => r.r)).toEqual([0.9 * FT_PER_M, 2.6 * FT_PER_M]);
    expect(2.6 - 0.914 / 2).toBeCloseTo(2.13, 1);
    for (const r of g.rings) expect([r.cx, r.cy]).toEqual([5 * FT_PER_M, 5 * FT_PER_M]);
  });

  it("3.8.1 and 3.8.2: a mark at each of four service positions, 90 degrees apart, along the court's axes", () => {
    expect(g.lines).toHaveLength(4);
    const centre = 5 * FT_PER_M;
    const at = g.lines.map((r) => [(r[0] + r[2]) / 2 - centre, (r[1] + r[3]) / 2 - centre].map((v) => Math.round((v / FT_PER_M) * 1e6) / 1e6));
    expect(at.sort()).toEqual([[-2.6, 0], [0, -2.6], [0, 2.6], [2.6, 0]]);
  });

  it("has no net and no sides: it lies the same tall or wide, and the board lies below the circles", () => {
    expect(g.net).toBeNull();
    const view = (o: SurfaceOptions): number[] => viewBox(parse(drawKyogijo(o)));
    expect(view({ sport: "roundnet", orientation: "portrait" })).toEqual(view({ sport: "roundnet" }));
  });
});

describe("netball: World Netball's Rules of Netball (2024 edition), Rule 1", () => {
  const g = anyGeometry({ sport: "netball" });

  it("items 2 and 3: the side lines are 30.5 m (100 ft) and the goal lines 15.25 m (50 ft)", () => {
    expect([WN_NETBALL.length, WN_NETBALL.width]).toEqual([30.5, 15.25]);
    expect(courtSize(courtFor({ sport: "netball" })).length).toBeCloseTo(100.0656, 3);
  });

  it("item 4 and 7: two transverse lines divide the court into three equal areas, and all lines are 50 mm wide", () => {
    const third = (30.5 / 3) * FT_PER_M;
    expect(g.lines.filter((r) => Math.abs((r[0] + r[2]) / 2 - third) < 1e-6 || Math.abs((r[0] + r[2]) / 2 - 2 * third) < 1e-6)).toHaveLength(2);
    expect(WN_NETBALL.lineWidth).toBe(0.05);
  });

  it("items 5 and 6: a centre circle 0.9 m across, and goal circles of 4.9 m radius, semicircles centred on the middle of the outside of each goal line", () => {
    const centre = g.rings.find((r) => r.a0 === undefined && Math.abs(r.cx - (30.5 / 2) * FT_PER_M) < 1e-9);
    expect(centre?.r).toBeCloseTo(0.45 * FT_PER_M, 9);
    const goals = g.rings.filter((r) => Math.abs(r.r - 4.9 * FT_PER_M) < 1e-9);
    expect(goals).toHaveLength(2);
    expect(goals.map((r) => r.cx).sort((a, b) => a - b)).toEqual([0, 30.5 * FT_PER_M]);
    for (const r of goals) expect((r.a1 as number) - (r.a0 as number)).toBeCloseTo(Math.PI, 12);
  });

  it("items 8, 13 and 14: a court surround of 3.05 m, and a goalpost at the middle of each goal line with the back of its pole at the outer edge", () => {
    expect(courtFor({ sport: "netball" }).zone?.side).toBeCloseTo(3.05 * FT_PER_M, 9);
    expect(g.posts).toHaveLength(2);
    expect(g.posts[0].x - g.posts[0].size / 2).toBeCloseTo(0, 9);
    expect(g.posts[0].y).toBeCloseTo((15.25 / 2) * FT_PER_M, 9);
    expect(WN_NETBALL.post.height).toBe(3.05);
  });

  it("is scored as a goals sport: the usual score, the teams named in the goal thirds, the home team on the left", () => {
    const svg = drawKyogijo({ sport: "netball", away: { name: "Harbour City Gulls", abbr: "HCG", score: 41, color: "#1d4f91" }, home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 38, color: "#a8452c" }, status: "final", id: "n" });
    const root = parse(svg);
    expect(withClass(root, "ky-banner").length).toBe(2);
    expect(svg).not.toContain("ky-scoreboard");
    expect(courtFor({ sport: "netball" }).sport).toBe("netball");
  });
});

describe("the sports added after the first five", () => {
  const ADDED = ["padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"] as const;

  it("are net sports with a family and a league of their own, the sport's own first, each with sources that are listed", () => {
    for (const sport of ADDED) {
      expect(isNetSport(sport), sport).toBe(true);
      expect(LEAGUES[sport].length, sport).toBeGreaterThan(0);
      expect(LEAGUES[sport][0].builtIn, sport).toBe(true);
      for (const league of LEAGUES[sport]) for (const id of league.sources) expect(LEAGUE_SOURCES[id], `${sport} ${id}`).toBeDefined();
    }
    for (const id of LEAGUES.volleyball.find((l) => l.id === "wpv-sitting")?.sources ?? []) expect(LEAGUE_SOURCES[id]).toBeDefined();
  });

  it("keep the unit of their rulebooks: feet for the IRF's racquetball, metres for the rest", () => {
    for (const sport of ADDED) expect(SURFACE_UNITS[sport], sport).toBe(sport === "racquetball" ? "ft" : "m");
  });

  it("have every look in light and in dark, with the looks of the sport named, and refuse another", () => {
    for (const sport of ADDED) {
      expect(Object.keys(COURT_LOOKS[sport]), sport).toEqual(LOOKS[sport]);
      for (const look of LOOKS[sport]) {
        const svg = drawKyogijo({ sport, net: { look } });
        expect(svg, `${sport} ${look}`).toContain(`data-look="${look}"`);
        expect(KYOGIJO_COURTS_STYLE).toContain(`[data-sport=${sport}][data-look=${look}]`);
      }
      expect(() => drawKyogijo({ sport, net: { look: "nothing" } }), sport).toThrow(/Unknown look/);
    }
  });

  it("describe the court in English and in Japanese, with the same words for the same options", () => {
    for (const sport of ADDED) {
      const en = describeDrawing({ sport });
      const ja = describeDrawing({ sport, language: "ja" });
      expect(en.title, sport).toBe(KYOGIJO_STRINGS.en.surface[sport]);
      expect(ja.title, sport).toBe(KYOGIJO_STRINGS.ja.surface[sport]);
      expect(ja.description, sport).toMatch(/[぀-ヿ一-鿿]/u);
      expect(drawKyogijo({ sport })).toBe(drawKyogijo({ sport }));
    }
    expect(describeDrawing({ sport: "volleyball", league: "wpv-sitting" }).description).toContain("sitting volleyball court, 10 by 6 metres");
    expect(describeDrawing({ sport: "squash", league: "wsf-doubles", language: "ja" }).description).toContain("7.62");
  });

  it("lie wide, and tall when asked (but for the square roundnet court), each as its true shape", () => {
    for (const sport of ADDED) {
      const wide = viewBox(parse(drawKyogijo({ sport })));
      const tall = viewBox(parse(drawKyogijo({ sport, orientation: "portrait" })));
      if (sport === "roundnet") expect(wide).toEqual(tall);
      else {
        expect(wide[2], sport).toBeGreaterThan(wide[3]);
        expect(tall[3], sport).toBeGreaterThan(tall[2]);
        expect(tall[2], sport).toBeCloseTo(wide[3], 1);
      }
    }
  });

  it("make room for their walls beyond the court: the squash court's front wall, laid flat, on its left only", () => {
    const view = viewBox(parse(drawKyogijo({ sport: "squash" })));
    const length = 9.75 * FT_PER_M;
    const left = -view[0];
    const right = view[0] + view[2] - length;
    expect(left - right).toBeGreaterThan(4.4 * FT_PER_M);
    expect(anyGeometry({ sport: "squash" }).bands.some((band) => band.rect[0] < -4 * FT_PER_M)).toBe(true);
    expect(courtFor({ sport: "squash" }).zone).toBeNull();
  });

  it("write the board of a score for each with its columns: the best of five games for squash and racquetball", () => {
    for (const sport of ["padel", "sepaktakraw", "teqball", "roundnet", "squash", "racquetball"] as const) {
      const svg = drawKyogijo(match(sport, { status: "final", away: { ...GULLS, sets: [11, 7] }, home: { ...BISON, sets: [8, 11] } }));
      expect(svg, sport).toContain("ky-scoreboard");
      const columns = withClass(parse(svg), "ky-foot").map((n) => n.text);
      expect(columns, sport).toContain(String(sport === "squash" || sport === "racquetball" ? 5 : 3));
      expect(columns, sport).toContain(sport === "padel" || sport === "sepaktakraw" || sport === "teqball" ? "Sets" : "Games");
    }
  });

  it("have zones: the net-court zones for padel, sepak takraw and teqball, the wall-court zones for squash and racquetball, the rings of roundnet and thirds for netball", () => {
    const zones = (sport: "padel" | "squash" | "roundnet" | "netball" | "teqball" | "sepaktakraw" | "racquetball", id: "net-court" | "wall-court" | "roundnet-rings" | "field-thirds"): string[] =>
      buildZoneSet(id, { o: { sport }, outline: outlineOf({ sport }), direction: "right", end: "both", los: undefined, bats: undefined, words: KYOGIJO_STRINGS.en.layers.zones }).zones.map((zone) => zone.id);
    expect(zones("padel", "net-court")).toEqual(["front-court-left", "back-court-left", "front-court-right", "back-court-right"]);
    expect(zones("teqball", "net-court")).toEqual(["front-court-left", "back-court-left", "front-court-right", "back-court-right"]);
    expect(zones("sepaktakraw", "net-court")).toEqual(["half-court-left", "half-court-right"]);
    expect(zones("squash", "wall-court")).toEqual(["front-court", "back-court"]);
    expect(zones("racquetball", "wall-court")).toEqual(["front-court", "back-court"]);
    expect(zones("roundnet", "roundnet-rings")).toEqual(["outside-circles", "serving-ring", "no-hit-zone"]);
    expect(zones("netball", "field-thirds")).toHaveLength(3);
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
    expect(withClass(draw({ sport: "badminton", net: { free: "none" } }), "ky-free")).toHaveLength(0);
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
