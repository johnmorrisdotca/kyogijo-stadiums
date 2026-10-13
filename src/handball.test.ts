// The handball court, each figure held to Rule 1 of the IHF's Rules of the Game for Indoor Handball (edition of 1 July 2025), in metres as the rules print them.
import { describe, expect, it } from "vitest";
import { dotsIn, linesIn, m, named, planOf } from "./fields.fixture.ts";
import type { ArcShape, PathShape, RingShape } from "./fields.types.ts";
import { drawKyogijo } from "./draw.ts";
import { LEAGUES, LEAGUE_SOURCES } from "./leagues.ts";
import { parseXml, withClass } from "./xml.fixture.ts";

const close = (a: number, b: number, places = 2): void => expect(a).toBeCloseTo(b, places);
const plan = planOf("handball");
const w = 0.05;

describe("the IHF's court (Rule 1, 2025)", () => {
  it("is a rectangle 40 m long and 20 m wide (1:1), to the outer edges of its lines, which are 5 cm wide and the goal lines 8 cm between the posts (1:3)", () => {
    close(m(plan.length), 40);
    close(m(plan.width), 20);
    close(m(plan.lineWidth) * 100, 5, 1);
    const goal = named(plan, "goal-line");
    expect(goal).toHaveLength(2);
    for (const line of goal) expect(line.kind === "line" && Math.round(m(line.w ?? 0) * 100)).toBe(8);
    expect(() => planOf("handball", undefined, { units: "m", field: { length: 39 } })).toThrow(/40 to 40 m/);
  });

  it("has the goal in the centre of each outer goal line, 3 m wide and 2 m high (1:2), its posts 8 cm square", () => {
    expect(plan.goals).toHaveLength(2);
    close(m(plan.goals[0].width), 3);
    close(m(plan.goals[0].y), 10);
    close(m(plan.goals[0].depth), 1.1);
    const posts = dotsIn(plan, "goal-post");
    close(posts[1][1] - posts[0][1], 3);
  });

  it("has a goal-area line (6 m): a line 3 m long, 6 m from the goal line to its front edge, and quarter circles of 6 m radius about the posts' rear inner corners (1:4)", () => {
    const [line] = linesIn(plan, "goal-area-line");
    close(line[3] - line[1], 3);
    close(line[0] + w / 2, 6, 3);
    const arcs = named(plan, "goal-area-arc") as ArcShape[];
    expect(arcs).toHaveLength(4);
    for (const arc of arcs) close(m(arc.r) + w / 2, 6, 3);
    // About the posts' inner corners, 1.5 m either side of the middle.
    close(Math.abs(m(arcs[0].cy) - m(arcs[1].cy)), 3);
    close(m(arcs[0].cx), 0, 6);
  });

  it("has a goal area 15 m wide on the goal line (the Guidelines' check)", () => {
    const [area] = plan.areas;
    expect(area.d).toBeDefined();
    const arcs = named(plan, "goal-area-arc") as ArcShape[];
    // The arcs' outer edges stand 6 m from the posts' inner corners, so the area is 3 + 2 x 6 m across at the goal line.
    const top = m(arcs[0].cy) - m(arcs[0].r) - w / 2;
    close(2 * (10 - top), 15, 3);
  });

  it("has a broken free-throw line (9 m) 3 m outside the goal-area line, its segments and spaces 15 cm (1:5), run on to the side lines", () => {
    const paths = named(plan, "free-throw-line") as PathShape[];
    expect(paths).toHaveLength(4);
    expect(paths[0].dash && [m(paths[0].dash[0]), m(paths[0].dash[1])].map((n) => Math.round(n * 1000) / 1000)).toEqual([0.15, 0.15]);
    // It starts in the middle, 9 m from the goal line to its front edge.
    expect(paths[0].d.startsWith(`M${Math.round(((9 - w / 2) / 0.3048) * 100) / 100} `)).toBe(true);
    // The court is 20 m wide, so the arc, 15 m of goal area and 3 m either side, reaches the side line.
    const end = /A[\d. ]+0 0 \d ([-\d.]+) ([-\d.]+)$/.exec(paths[0].d);
    expect(end).not.toBeNull();
    close(Number(end?.[2]), 0, 1);
  });

  it("has a 7-metre line 1 m long and a 4-metre line 15 cm long, their front edges 7 m and 4 m from the goal line (1:6, 1:7)", () => {
    const [seven] = linesIn(plan, "seven-metre-line");
    close(seven[3] - seven[1], 1);
    close(seven[0] + w / 2, 7, 3);
    close(((seven[1] + seven[3]) / 2), 10);
    const [four] = linesIn(plan, "four-metre-line");
    close(four[3] - four[1], 0.15);
    close(four[0] + w / 2, 4, 3);
  });

  it("has the centre line joining the middles of the side lines, and a throw-off area 4 m across in the middle of it (1:8, 1:9)", () => {
    const [centre] = linesIn(plan, "centre-line");
    close(centre[0], 20);
    close(centre[3] - centre[1], 20);
    const [circle] = named(plan, "throw-off-area") as RingShape[];
    close(m(circle.rx) * 2, 4);
    close(m(circle.cx), 20);
  });

  it("has the substitution lines end 4.5 m from the centre line, by a mark 15 cm inside the side line and 15 cm outside (1:10)", () => {
    const marks = linesIn(plan, "substitution-line");
    expect(marks).toHaveLength(2);
    expect(marks.map(([x]) => Math.round(x * 100) / 100).sort((a, b) => a - b)).toEqual([15.5, 24.5]);
    for (const [, y0, , y1] of marks) close(y1 - y0, 0.3 + w, 3);
    expect(named(planOf("handball", undefined, { detail: "simple" }), "substitution-line")).toHaveLength(0);
  });

  it("is painted as a floor: a floor feature, and the goal areas in a paint of their own", () => {
    const svg = drawKyogijo({ sport: "handball" });
    expect(svg).toContain("ky-key");
    expect(withClass(parseXml(svg), "ky-stripe")).toHaveLength(0);
    expect(plan.band).toBe(0);
    expect(plan.surfaceFeature).toBe("floor");
  });

  it("names the rules it was read in, and is drawn within the budget, tall and wide", () => {
    for (const id of LEAGUES.handball[0].sources) expect(LEAGUE_SOURCES[id].edition).toBe("1 July 2025");
    expect(drawKyogijo({ sport: "handball" }).length).toBeLessThan(17_500);
    expect(drawKyogijo({ sport: "handball", orientation: "portrait" }).length).toBeLessThan(17_500);
    expect(Object.keys(plan.ranges)).toEqual(["half", "goal-area"]);
  });
});
