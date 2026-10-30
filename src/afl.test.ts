// The Australian football ground, each figure held to Law 3 of the Laws of Australian Football 2026 and to the length and width each venue's page prints (metres, as both print them).
import { describe, expect, it } from "vitest";
import { arcMeetsBoundary } from "./fields/afl.ts";
import { dotsIn, linesIn, m, named, planOf } from "./fields.fixture.ts";
import { inOutline } from "./fields.kit.ts";
import type { ArcShape, PathShape, PolyShape, RingShape } from "./fields.types.ts";
import { AFL_GROUNDS, LEAGUES, aflOf } from "./leagues.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";
import { drawKyogijo } from "./draw.ts";

const close = (a: number, b: number, places = 2): void => expect(a).toBeCloseTo(b, places);

describe("the Australian football ground (Law 3, 2026)", () => {
  const plan = planOf("afl");

  it("is an oval 135 to 185 m long and 110 to 155 m wide (3.2): the MCG's 160 by 141 m is drawn, and a size is held to the range", () => {
    expect(plan.outline.kind).toBe("oval");
    close(m(plan.length), 160);
    close(m(plan.width), 141);
    close(m(planOf("afl", "afl", { units: "m", field: { length: 135, width: 110 } }).length), 135);
    close(m(planOf("afl", "afl", { units: "m", field: { length: 185, width: 155 } }).width), 155);
    expect(() => planOf("afl", "afl", { units: "m", field: { length: 134 } })).toThrow(/135 to 185 m/);
    expect(() => planOf("afl", "afl", { units: "m", field: { length: 186 } })).toThrow(RangeError);
    expect(() => planOf("afl", "afl", { units: "m", field: { width: 109 } })).toThrow(/110 to 155 m/);
    expect(() => planOf("afl", "afl", { units: "m", field: { width: 156 } })).toThrow(/110 to 155 m/);
  });

  it("is cut at each end by the goal line and the behind lines, 6.4 m between the goal posts and 6.4 m more on each side to the behind posts (3.3.1), so 19.2 m across", () => {
    const goal = linesIn(plan, "goal-line");
    expect(goal).toHaveLength(2);
    for (const [x0, y0, x1, y1] of goal) {
      close(x0, x1);
      close(y1 - y0, 6.4);
    }
    const behind = linesIn(plan, "behind-line");
    expect(behind).toHaveLength(4);
    for (const [, y0, , y1] of behind) close(Math.abs(y1 - y0), 6.4);
    const posts = dotsIn(plan, "goal-post");
    close(posts[1][1] - posts[0][1], 6.4);
    const bposts = dotsIn(plan, "behind-post").filter(([x]) => x < 1).map(([, y]) => y).sort((a, b) => a - b);
    expect(bposts).toHaveLength(2);
    close(bposts[1] - bposts[0], 19.2);
    const cy = m(plan.width) / 2;
    close(cy - bposts[0], 9.6);
  });

  it("draws the Boundary Line as the arc from one behind post to the other, and the oval meets the ends exactly at the behind posts", () => {
    const arcs = named(plan, "boundary-line") as PathShape[];
    expect(arcs).toHaveLength(2);
    // The oval's edge at the goal line is 9.6 m either side of the middle, and it is inside the oval everywhere on the line.
    const nine = 9.6 / 0.3048;
    expect(plan.outline.kind === "oval" && inOutline(plan.length, plan.width, plan.outline, 0, plan.width / 2 - nine + 0.01)).toBe(true);
    expect(plan.outline.kind === "oval" && inOutline(plan.length, plan.width, plan.outline, 0, plan.width / 2 - nine - 0.5)).toBe(false);
    expect(plan.outline.kind === "oval" && inOutline(plan.length, plan.width, plan.outline, plan.length / 2, 0)).toBe(true);
  });

  it("has a goal square: two lines at right angles to the goal line for 9 m from each goal post, joined by the kick-off line (3.4), so 6.4 m wide and 9 m deep", () => {
    const squares = named(plan, "goal-square") as PolyShape[];
    expect(squares).toHaveLength(2);
    const pts = squares[0].points.map(([x, y]) => [m(x), m(y)]);
    close(pts[1][0] - pts[0][0], 9);
    close(pts[2][1] - pts[1][1], 6.4);
  });

  it("has a centre square of 50 by 50 m in the middle, a Centre Circle 3 m across and a Ten Metre Circle 10 m across, both divided by a line parallel to the goal lines (3.5)", () => {
    const [square] = named(plan, "centre-square");
    expect(square.kind).toBe("box");
    if (square.kind === "box") {
      close(m(square.x1 - square.x0), 50);
      close(m(square.y1 - square.y0), 50);
      close(m((square.x0 + square.x1) / 2), 80);
    }
    const rings = ["centre-circle", "ten-metre-circle"].map((id) => (named(plan, id)[0] as RingShape).rx);
    close(m(rings[0]) * 2, 3);
    close(m(rings[1]) * 2, 10);
    const [divider] = linesIn(plan, "centre-circle-line");
    close(divider[3] - divider[1], 10);
    close(divider[0], 80);
  });

  it("has a Fifty Metre Arc at each end, 50 m from the middle of the goal line, from boundary to boundary (the definition, Diagram 1)", () => {
    const arcs = named(plan, "fifty-metre-arc") as ArcShape[];
    expect(arcs).toHaveLength(2);
    for (const arc of arcs) close(m(arc.r), 50);
    // Each end of the arc is on the Boundary Line: the oval is left there.
    const arc = arcs[0];
    const x = arc.cx + arc.r * Math.cos((arc.a1 * Math.PI) / 180);
    const y = arc.cy + arc.r * Math.sin((arc.a1 * Math.PI) / 180);
    expect(plan.outline.kind === "oval" && inOutline(plan.length, plan.width, plan.outline, x, y)).toBe(true);
    const outside = arc.cx + arc.r * Math.cos(((arc.a1 + 1) * Math.PI) / 180);
    const outsideY = arc.cy + arc.r * Math.sin(((arc.a1 + 1) * Math.PI) / 180);
    expect(plan.outline.kind === "oval" && inOutline(plan.length, plan.width, plan.outline, outside, outsideY)).toBe(false);
    // A circle that never leaves the oval meets it nowhere.
    expect(arcMeetsBoundary(1000, 100, 1500, 50)).toBe(90);
  });

  it("draws the posts and the lines inside the oval whatever the size", () => {
    for (const [length, width] of [[135, 110], [185, 155], [135, 155], [185, 110]]) {
      const drawn = planOf("afl", "afl", { units: "m", field: { length, width } });
      expect(drawn.shapes.length).toBeGreaterThan(20);
    }
  });
});

describe("the named grounds, as the AFL's venue pages print them (read 2026-10-13)", () => {
  it("are MCG 160 by 141, Optus Stadium 165 by 130, the Gabba 156 by 138, the SCG 149 by 136, Marvel Stadium 159.5 by 128.8 and GMHBA Stadium 170 by 114 metres", () => {
    expect(AFL_GROUNDS.map((ground) => [ground.id, ground.length, ground.width])).toEqual([
      ["mcg", 160, 141],
      ["optus-stadium", 165, 130],
      ["gabba", 156, 138],
      ["scg", 149, 136],
      ["marvel-stadium", 159.5, 128.8],
      ["gmhba-stadium", 170, 114],
    ]);
    for (const ground of AFL_GROUNDS) {
      expect(LEAGUE_SOURCES[ground.source].url, ground.id).toMatch(/^https:\/\/www\.afl\.com\.au\/venues\/\d+$/);
      expect(ground.name.ja).toMatch(/[぀-ヿ一-鿿]/u);
    }
  });

  it("each draws at its size, which is within the Laws' range", () => {
    for (const ground of AFL_GROUNDS) {
      const plan = planOf("afl", "afl", { field: { ground: ground.id } });
      close(m(plan.length), ground.length, 2);
      close(m(plan.width), ground.width, 2);
    }
    // A length and a width of the options win over the ground's.
    const mixed = planOf("afl", "afl", { units: "m", field: { ground: "mcg", width: 120 } });
    close(m(mixed.length), 160);
    close(m(mixed.width), 120);
    expect(() => planOf("afl", "afl", { field: { ground: "adelaide-oval" } })).toThrow(/Unknown ground "adelaide-oval": use one of mcg, optus-stadium/);
  });

  it("leave Adelaide Oval out: its page prints 190 m, which the Laws' 185 m does not allow", () => {
    expect(AFL_GROUNDS.map((ground) => ground.id)).not.toContain("adelaide-oval");
    expect(aflOf(LEAGUES.afl[0] as never).length.max).toBeCloseTo(185 / 0.3048, 8);
  });
});

describe("the ground drawn", () => {
  it("is within the size budget, bare and with a score, tall and wide", () => {
    const game = { away: { name: "A", score: 1, goals: 1, behinds: 1 }, home: { name: "B", score: 2 } };
    expect(drawKyogijo({ sport: "afl" }).length).toBeLessThan(17_500);
    expect(drawKyogijo({ sport: "afl", ...game, orientation: "portrait" }).length).toBeLessThan(17_500);
  });
});
