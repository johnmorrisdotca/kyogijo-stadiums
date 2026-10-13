// The Gaelic games' field, each figure held to Rule 1 of the GAA's Official Guide Part 2 (effective 27 March 2026), in metres as the Guide prints them.
import { describe, expect, it } from "vitest";
import { dotsIn, linesIn, m, named, placesOf, planOf } from "./fields.fixture.ts";
import type { ArcShape, PolyShape } from "./fields.types.ts";
import { drawKyogijo } from "./draw.ts";
import { LEAGUES, LEAGUE_SOURCES, gaelicOf } from "./leagues.ts";

const close = (a: number, b: number, places = 2): void => expect(a).toBeCloseTo(b, places);
const football = planOf("gaelic");
const hurling = planOf("gaelic", "gaa-hurling");

describe("the GAA's field, for football and for hurling (Rule 1)", () => {
  it("is rectangular, 130 to 145 m long and 80 to 90 m wide, the greatest drawn (1.1)", () => {
    for (const plan of [football, hurling]) {
      close(m(plan.length), 145);
      close(m(plan.width), 90);
      expect(plan.outline).toEqual({ kind: "rect" });
    }
    close(m(planOf("gaelic", "gaa-football", { units: "m", field: { length: 130, width: 80 } }).length), 130);
    expect(() => planOf("gaelic", "gaa-football", { units: "m", field: { length: 129 } })).toThrow(/130 to 145 m/);
    expect(() => planOf("gaelic", "gaa-hurling", { units: "m", field: { length: 146 } })).toThrow(RangeError);
    expect(() => planOf("gaelic", "gaa-football", { units: "m", field: { width: 79 } })).toThrow(/80 to 90 m/);
    expect(() => planOf("gaelic", "gaa-football", { units: "m", field: { width: 91 } })).toThrow(/80 to 90 m/);
  });

  it("has lines across at 13, 20 and 45 m from each end line, and in hurling at 65 m too (1.2 (i))", () => {
    expect(placesOf(football, "distance-line", "x")).toEqual([13, 20, 45, 145 - 45, 145 - 20, 145 - 13].map((x) => expect.closeTo(x, 2)));
    expect(placesOf(hurling, "distance-line", "x")).toEqual([13, 20, 45, 65, 145 - 65, 145 - 45, 145 - 20, 145 - 13].map((x) => expect.closeTo(x, 2)));
    for (const [, y0, , y1] of linesIn(football, "distance-line")) expect([Math.round(y0), Math.round(y1)]).toEqual([0, 90]);
  });

  it("has a midline 10 m long in the centre of the pitch, with lines of 5 m marked out from it at intervals of 5 m (1.2 (i))", () => {
    const [mid] = linesIn(football, "midline");
    close(mid[3] - mid[1], 10);
    close(mid[0], 72.5);
    close((mid[1] + mid[3]) / 2, 45);
    const dashes = linesIn(football, "midline-dash");
    expect(dashes).toHaveLength(8);
    for (const [, y0, , y1] of dashes) close(y1 - y0, 5);
    const starts = dashes.map(([, y0]) => y0).filter((y) => y > 45).sort((a, b) => a - b);
    expect(starts.slice(0, 3).map((y) => Math.round(y * 100) / 100)).toEqual([50, 60, 70]);
  });

  it("has the goalposts 6.5 m apart on the end line, the crossbar 2.5 m up (1.3 (i), (ii))", () => {
    const posts = dotsIn(football, "goalpost");
    expect(posts).toHaveLength(4);
    close(posts[1][1] - posts[0][1], 6.5);
    close(posts[0][0], 0);
    close(m(gaelicOf(LEAGUES.gaelic[0] as never).crossbar), 2.5);
    close(m(gaelicOf(LEAGUES.gaelic[0] as never).postsApart), 6.5);
  });

  it("has a rectangle 14 by 4.5 m, its lines 3.75 m outside each post, and a rectangle 19 by 13 m, 6.25 m outside each (1.3 (a), (b), (c))", () => {
    const [small] = named(football, "small-rectangle") as PolyShape[];
    const s = small.points.map(([x, y]) => [m(x), m(y)]);
    close(s[1][0] - s[0][0], 4.5);
    close(s[3][1] - s[0][1], 14);
    close(s[0][1], 45 - 3.25 - 3.75);
    const [large] = named(football, "large-rectangle") as PolyShape[];
    const l = large.points.map(([x, y]) => [m(x), m(y)]);
    close(l[1][0] - l[0][0], 13);
    close(l[3][1] - l[0][1], 19);
    close(l[0][1], 45 - 3.25 - 6.25);
    expect(named(hurling, "small-rectangle")).toHaveLength(2);
  });

  it("has a semicircular arc of 13 m radius centred on the middle of each 20 m line, outside it (1.4)", () => {
    const arcs = named(football, "thirteen-metre-arc") as ArcShape[];
    expect(arcs).toHaveLength(2);
    for (const arc of arcs) close(m(arc.r), 13);
    close(m(arcs[0].cx), 20);
    close(m(arcs[1].cx), 125);
    expect([arcs[0].a0, arcs[0].a1]).toEqual([-90, 90]);
    expect(named(hurling, "thirteen-metre-arc")).toHaveLength(2);
  });

  it("has, for football only, a semicircular arc of 40 m centred on the middle of the goal line, outside the 20 m line, and a penalty point 11 m from the middle of the goal line (1.4, 1.5)", () => {
    const arcs = named(football, "forty-metre-arc") as ArcShape[];
    expect(arcs).toHaveLength(2);
    for (const arc of arcs) close(m(arc.r), 40);
    // It leaves the 20 m line at the angle whose cosine is 20 over 40.
    close(arcs[0].a1, 60);
    close(m(arcs[0].cx), 0);
    const [point] = dotsIn(football, "penalty-point");
    close(point[0], 11);
    close(point[1], 45);
    expect(named(hurling, "forty-metre-arc")).toHaveLength(0);
    expect(named(hurling, "penalty-point")).toHaveLength(0);
  });

  it("has lines 90 mm wide (1.2 (ii)), and flags where the lines meet the sidelines and end lines", () => {
    close(m(football.lineWidth) * 1000, 90, 0);
    expect(dotsIn(football, "flag").length).toBe(12);
    expect(dotsIn(planOf("gaelic", "gaa-hurling"), "flag").length).toBe(16);
    expect(dotsIn(planOf("gaelic", "gaa-football", { detail: "simple" }), "flag")).toHaveLength(0);
  });

  it("names the Guide it was read in, and is drawn within the budget", () => {
    for (const league of LEAGUES.gaelic) for (const id of league.sources) expect(LEAGUE_SOURCES[id].edition).toMatch(/27 March 2026/);
    expect(drawKyogijo({ sport: "gaelic" }).length).toBeLessThan(17_500);
    expect(Object.keys(football.ranges)).toEqual(["half", "large-rectangle"]);
  });
});
