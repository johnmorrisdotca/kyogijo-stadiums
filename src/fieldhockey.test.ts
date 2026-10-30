// The field hockey pitch, each figure held to the FIH's Rules of Hockey (effective 1 March 2026), Rule 1 and the Field and Equipment Specifications, in metres as the rules print them.
import { describe, expect, it } from "vitest";
import { dotsIn, linesIn, m, named, placesOf, planOf } from "./fields.fixture.ts";
import type { ArcShape, PathShape } from "./fields.types.ts";
import { drawKyogijo } from "./draw.ts";
import { LEAGUES, fieldHockeyOf } from "./leagues.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";

const close = (a: number, b: number, places = 2): void => expect(a).toBeCloseTo(b, places);
const plan = planOf("fieldhockey");
const w = 0.075;

describe("the FIH's pitch (Rules of Hockey, 2026)", () => {
  it("is 91.40 m long and 55.00 m wide, to the outer edges of its lines, which are 75 mm wide (Spec 1.1, 1.2 b)", () => {
    close(m(plan.length), 91.4);
    close(m(plan.width), 55);
    close(m(plan.lineWidth) * 1000, 75, 1);
    expect(() => planOf("fieldhockey", undefined, { units: "m", field: { length: 90 } })).toThrow(/91.4 to 91.4 m/);
    const [boundary] = named(plan, "boundary");
    expect(boundary.kind).toBe("box");
    if (boundary.kind === "box") [m(boundary.x0), m(boundary.y0), m(boundary.x1), m(boundary.y1)].forEach((n, i) => close(n, [w / 2, w / 2, 91.4 - w / 2, 55 - w / 2][i], 6));
  });

  it("has a centre line across the middle and the 23-metre lines 22.90 m from each back-line, between the furthest edges (Spec 1.3 d, e)", () => {
    close(placesOf(plan, "centre-line", "x")[0] * 1, 45.7, 2);
    // The line's far edge is 22.90 m from the back-line's outer edge.
    const [near, far] = placesOf(plan, "twenty-three-line", "x");
    close(near + w / 2, 22.9, 2);
    close(far - w / 2, 91.4 - 22.9, 2);
  });

  it("has circles: a line 3.66 m long, its outside edge 14.63 m from the back-line, continued by quarter-circles about the inside front corners of the posts (Spec 1.4 a to c)", () => {
    const lines = linesIn(plan, "circle-line");
    expect(lines).toHaveLength(2);
    const [x0, y0, x1, y1] = lines[0];
    close(y1 - y0, 3.66);
    close(x0 + w / 2, 14.63, 3);
    close(x0, x1);
    close((y0 + y1) / 2, 27.5);
    const arcs = named(plan, "circle-arc") as ArcShape[];
    expect(arcs).toHaveLength(4);
    for (const arc of arcs) close(m(arc.r) + w / 2, 14.63, 3);
    // The arcs are centred 1.83 m either side of the middle: the posts' inside corners, 3.66 m apart.
    close(Math.abs(m(arcs[0].cy) - m(arcs[1].cy)), 3.66);
    expect(m(arcs[0].cx)).toBeCloseTo(0, 6);
    expect([arcs[0].a0, arcs[0].a1, arcs[1].a0, arcs[1].a1]).toEqual([-90, 0, 0, 90]);
  });

  it("has a broken line outside each circle, its outer edge 5 m from the circle line's, in solid sections of 300 mm with gaps of 3 m, starting at the top centre (Spec 1.4 d)", () => {
    const paths = named(plan, "broken-circle-line") as PathShape[];
    expect(paths).toHaveLength(4);
    expect(paths[0].dash && [m(paths[0].dash[0]), m(paths[0].dash[1])].map((n) => Math.round(n * 1000) / 1000)).toEqual([0.3, 3]);
    // It starts on the pitch's axis, 14.63 + 5 m from the back-line.
    expect(paths[0].d.startsWith(`M${Math.round((19.63 - w / 2) / 0.3048 * 100) / 100} `)).toBe(true);
    expect(paths[0].d).toMatch(/^M[\d.]+ 90\.2/);
    expect(named(planOf("fieldhockey", undefined, { detail: "simple" }), "broken-circle-line")).toHaveLength(0);
  });

  it("has penalty spots 150 mm across, the centre 6.40 m from the inner edge of the goal-line (Rule 1; Spec 1.3 i says 6.475 m from the outer edge)", () => {
    const [spot] = named(plan, "penalty-spot");
    expect(spot.kind === "dot" && Math.round(m(spot.r) * 2 * 1000)).toBe(150);
    const spots = dotsIn(plan, "penalty-spot");
    close(spots[0][0], 6.475, 3);
    close(spots[1][0], 91.4 - 6.475, 3);
  });

  it("has goals 3.66 m between the posts and 2.14 m under the crossbar, outside the pitch touching the back-line, their nets at least 1.20 m deep at the ground (Spec 1.5 d, e)", () => {
    expect(plan.goals).toHaveLength(2);
    close(m(plan.goals[0].width), 3.66);
    close(m(plan.goals[0].depth), 1.2);
    expect(plan.goals[0].out).toBe(-1);
    expect(plan.goals[1].out).toBe(1);
    close(m(plan.goals[0].x), 0);
    close(m(fieldHockeyOf(LEAGUES.fieldhockey[0] as never).goalHeight), 2.14);
  });

  it("has marks of 300 mm outside the pitch: on each side-line at the circle's distance, and on each back-line at 5 and 10 m from the nearer goal-post (Spec 1.3 f, g), and flag-posts at the corners (1.8)", () => {
    const side = linesIn(plan, "side-line-mark");
    expect(side).toHaveLength(4);
    for (const [, y0, , y1] of side) close(Math.abs(y1 - y0), 0.3);
    const back = linesIn(plan, "back-line-mark");
    expect(back).toHaveLength(8);
    for (const [x0, , x1] of back) close(Math.abs(x1 - x0), 0.3);
    const ys = [...new Set(back.map(([, y]) => Math.round(Math.abs(y - 27.5) * 1000) / 1000))].sort((a, b) => a - b);
    // The posts are 3.66 m apart inside and 50 mm thick: the marks stand 5 and 10 m from their outer edges.
    expect(ys[0]).toBeCloseTo(1.83 + 0.05 + 5 - w / 2, 1);
    expect(ys[1]).toBeCloseTo(1.83 + 0.05 + 10 - w / 2, 1);
    expect(dotsIn(plan, "flag-post")).toHaveLength(4);
  });

  it("names the rules it was read in, and is drawn within the budget, tall and wide", () => {
    for (const id of LEAGUES.fieldhockey[0].sources) expect(LEAGUE_SOURCES[id].edition).toMatch(/1 March 2026/);
    expect(drawKyogijo({ sport: "fieldhockey" }).length).toBeLessThan(17_500);
    expect(drawKyogijo({ sport: "fieldhockey", orientation: "portrait" }).length).toBeLessThan(17_500);
    expect(Object.keys(plan.ranges)).toEqual(["half", "circle", "twenty-three"]);
  });
});
