// The rugby fields, each figure held to its rulebook: World Rugby's Law 1 (2026), the NRL's Sections 1 and 18 (2023) and the IRL's Section 1 (2024). A figure is read back from the plan in metres.
import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { dotsIn, linesIn, m, named, placesOf, planOf } from "./fields.fixture.ts";
import { LEAGUES, LEAGUE_SOURCES, leagueFigures, leagueSize, rugbyOf } from "./leagues.ts";
import { parseXml, walk } from "./xml.fixture.ts";

const close = (a: number, b: number, places = 2): void => expect(a).toBeCloseTo(b, places);

describe("rugby union, World Rugby Law 1 (2026)", () => {
  const plan = planOf("rugby");
  const ing = 10; // the in-goal depth drawn: Law 1 gives a range of 6 to 22 m and no depth
  const t0 = ing;
  const t1 = ing + 100;

  it("the field of play is at most 100 m between the try lines and at most 70 m wide, and each in-goal at most 22 m deep (1.3 table)", () => {
    close(m(plan.length), 100 + 2 * ing);
    close(m(plan.width), 70);
    const field = rugbyOf(LEAGUES.rugby[0] as never);
    expect([field.length.max, field.length.min, field.width.max, field.width.min, field.inGoal.max, field.inGoal.min].map(m)).toEqual([expect.closeTo(100, 5), expect.closeTo(94, 5), expect.closeTo(70, 5), expect.closeTo(68, 5), expect.closeTo(22, 5), expect.closeTo(6, 5)]);
  });

  it("holds a size asked for to the range: 94 to 100 m, 68 to 70 m, an in-goal of 6 to 22 m", () => {
    close(m(planOf("rugby", undefined, { units: "m", field: { length: 94, width: 68, inGoal: 22 } }).length), 94 + 44);
    expect(() => planOf("rugby", undefined, { units: "m", field: { length: 93 } })).toThrow(/outside what the rules allow: 94 to 100 m/);
    expect(() => planOf("rugby", undefined, { units: "m", field: { length: 101 } })).toThrow(RangeError);
    expect(() => planOf("rugby", undefined, { units: "m", field: { width: 67.9 } })).toThrow(/68 to 70 m/);
    expect(() => planOf("rugby", undefined, { units: "m", field: { inGoal: 5 } })).toThrow(/6 to 22 m/);
    expect(() => planOf("rugby", undefined, { units: "m", field: { inGoal: 23 } })).toThrow(/6 to 22 m/);
  });

  it("the try lines stand at the ends of the field of play, across its whole width", () => {
    expect(placesOf(plan, "try-line", "x").map((x) => Math.round(x))).toEqual([t0, t1]);
    for (const [, y0, , y1] of linesIn(plan, "try-line")) expect([Math.round(y0), Math.round(y1)]).toEqual([0, 70]);
  });

  it("the 22-metre lines are 22 m from the try lines and the half-way line is in the middle (1.4 c and d, diagram)", () => {
    expect(placesOf(plan, "twenty-two-line", "x")).toEqual([t0 + 22, t1 - 22].map((x) => expect.closeTo(x, 2)));
    close(placesOf(plan, "halfway-line", "x")[0], (100 + 2 * ing) / 2);
  });

  it("the dash lines are 5 m from and parallel to each touchline, 15 m from each, 10 m either side of the half-way line and 5 m from each try line, every dash 5 m long (1.5)", () => {
    const along = linesIn(plan, "dash-line");
    // Along the field: at 5 m and 15 m from each touchline.
    expect([...new Set(along.map(([, y]) => Math.round(y * 100) / 100))].sort((a, b) => a - b)).toEqual([5, 15, 55, 65]);
    for (const [x0, , x1] of along) close(x1 - x0, 5);
    // Across the field: at 10 m either side of the half-way line, and 5 m from each try line.
    expect(placesOf(plan, "ten-metre-line", "x")).toEqual([expect.closeTo(50, 2), expect.closeTo(70, 2)]);
    expect(placesOf(plan, "five-metre-line", "x")).toEqual([expect.closeTo(t0 + 5, 2), expect.closeTo(t1 - 5, 2)]);
    for (const id of ["ten-metre-line", "five-metre-line"]) for (const [, y0, , y1] of linesIn(plan, id)) close(y1 - y0, 5);
  });

  it("each dash line along the field has its first dash at the 5 m line and its last 5 m from the far try line, with one over each 22-metre line, 10-metre line and the half-way line (the ground diagram)", () => {
    const first = linesIn(plan, "dash-line").filter(([, y]) => Math.abs(y - 5) < 1e-6).sort((a, b) => a[0] - b[0]);
    expect(first).toHaveLength(7);
    close(first[0][0], t0 + 5);
    close(first[0][2], t0 + 10);
    close(first[6][2], t1 - 5);
    // The middle dashes are centred on the lines they cross.
    const centres = first.slice(1, 6).map(([x0, , x1]) => (x0 + x1) / 2);
    expect(centres.map((x) => Math.round(x * 100) / 100)).toEqual([t0 + 22, 60 - 10, 60, 60 + 10, t1 - 22]);
  });

  it("a line 0.5 m long crosses the middle of the half-way line (1.6)", () => {
    const [mark] = linesIn(plan, "halfway-mark");
    close(mark[2] - mark[0], 0.5);
    close((mark[0] + mark[2]) / 2, 60);
    close(mark[1], 35);
  });

  it("the goal posts stand on the try lines, 5.6 m apart, and the crossbar's top edge is 3 m up (the goal posts diagram)", () => {
    const posts = dotsIn(plan, "goal-post");
    expect(posts).toHaveLength(4);
    for (const x of [t0, t1]) {
      const here = posts.filter(([px]) => Math.abs(px - x) < 1e-6);
      expect(here).toHaveLength(2);
      close(here[1][1] - here[0][1], 5.6);
    }
    close(m(rugbyOf(LEAGUES.rugby[0] as never).crossbar), 3);
  });

  it("there are 14 flag posts: one at each of the eight corners, and six in line with the 22-metre lines and the half-way line, 2 m outside the touchlines (1.8 to 1.10)", () => {
    const flags = dotsIn(plan, "flag-post");
    expect(flags).toHaveLength(14);
    expect(flags.filter(([, y]) => y < -1.9 || y > 71.9)).toHaveLength(6);
    for (const [, y] of flags.filter(([, y]) => y < 0)) close(y, -2);
    expect(dotsIn(planOf("rugby", undefined, { detail: "simple" }), "flag-post")).toHaveLength(0);
  });

  it("reduces the 22-metre and 10-metre lines in proportion on a shorter field, and the 15-metre lines on a narrower one (1.3 c and d say that they are reduced, not by how much)", () => {
    const short = planOf("rugby", undefined, { units: "m", field: { length: 94, width: 68, inGoal: 10 } });
    close(placesOf(short, "twenty-two-line", "x")[0] - 10, 22 * 0.94);
    const ys = [...new Set(linesIn(short, "dash-line").map(([, y]) => Math.round(y * 100) / 100))].sort((a, b) => a - b);
    expect(ys).toEqual([5, expect.closeTo(15 * (68 / 70), 2), expect.closeTo(68 - 15 * (68 / 70), 2), 63]);
  });

  it("is a rectangle, drawn with the in-goal areas painted in each team's colour on a score and its range names", () => {
    const svg = drawKyogijo({ sport: "rugby", away: { name: "A", score: 1, color: "#123456" }, home: { name: "B", score: 2, color: "#654321" } });
    expect(svg).toContain("ky-zone-left");
    expect(svg).toContain("ky-zone-right");
    expect(Object.keys(plan.ranges)).toEqual(["half", "twenty-two", "in-goal"]);
  });
});

describe("rugby league, the NRL's Sections 1 and 18 (2023) and the IRL's Section 1 (2024)", () => {
  const nrl = planOf("rugby", "nrl");
  const irl = planOf("rugby", "irl");

  it("the NRL field is 100 m between the goal lines and 68 m wide, with in-goal areas of 8 m (Section 18)", () => {
    close(m(nrl.length), 100 + 16);
    close(m(nrl.width), 68);
    close(m(nrl.length) - 100, 16);
    expect(() => planOf("rugby", "nrl", { units: "m", field: { length: 99 } })).toThrow(/100 to 100 m/);
  });

  it("the IRL field is the same size, its in-goal areas 6 to 11 m deep (Section 1 plan)", () => {
    close(m(irl.width), 68);
    close(m(irl.length), 100 + 16);
    expect(() => planOf("rugby", "irl", { units: "m", field: { inGoal: 5 } })).toThrow(/6 to 11 m/);
    expect(() => planOf("rugby", "irl", { units: "m", field: { inGoal: 12 } })).toThrow(/6 to 11 m/);
    close(m(planOf("rugby", "irl", { units: "m", field: { inGoal: 11 } }).length), 100 + 22);
  });

  it("has a line across the field at every 10 m from each goal line to the half-way line, the 20 m and 40 m lines red where the NRL says so (Section 18 (a))", () => {
    const tens = placesOf(nrl, "ten-metre-line", "x").concat(placesOf(nrl, "red-line", "x")).sort((a, b) => a - b);
    expect(tens.map((x) => Math.round((x - 8) * 100) / 100)).toEqual([10, 20, 30, 40, 60, 70, 80, 90]);
    expect(placesOf(nrl, "red-line", "x").map((x) => Math.round((x - 8) * 100) / 100)).toEqual([20, 40, 60, 80]);
    close(placesOf(nrl, "halfway-line", "x")[0], 58);
    // The IRL's book prints no colours: every line is white.
    expect(placesOf(irl, "red-line", "x")).toEqual([]);
    expect(placesOf(irl, "ten-metre-line", "x").map((x) => Math.round((x - 8) * 100) / 100)).toEqual([10, 20, 30, 40, 60, 70, 80, 90]);
  });

  it("the lines are 15 cm wide, the scrum lines 10 cm and 10 m and 20 m in from the touchlines (Section 18 (a) and (d))", () => {
    close(m(nrl.lineWidth) * 100, 15, 1);
    const scrum = named(nrl, "scrum-line");
    expect(scrum.length).toBeGreaterThan(100);
    for (const shape of scrum) if (shape.kind === "line") close(m(shape.w ?? 0) * 100, 10, 1);
    expect([...new Set(linesIn(nrl, "scrum-line").map(([, y]) => Math.round(y * 100) / 100))].sort((a, b) => a - b)).toEqual([10, 20, 48, 58]);
    expect(named(irl, "scrum-line")).toHaveLength(0);
  });

  it("the goal posts are 5.5 m apart on the goal lines (Section 1 plan, Section 18)", () => {
    for (const plan of [nrl, irl]) {
      const posts = dotsIn(plan, "goal-post");
      close(posts[1][1] - posts[0][1], 5.5);
      expect(posts.map(([x]) => Math.round(x))).toEqual([8, 8, 108, 108]);
    }
    expect(rugbyOf(LEAGUES.rugby[1] as never).postsApart).toBeCloseTo(5.5 / 0.3048, 8);
  });

  it("draws the red lines with the red class and says what it is", () => {
    const svg = drawKyogijo({ sport: "rugby", league: "nrl" });
    expect(svg).toContain('class="ky-red"');
    expect(walk(parseXml(svg)).filter((node) => node.attrs.class === "ky-red").length).toBeGreaterThan(0);
    expect(leagueFigures(LEAGUES.rugby[1]).map(([name]) => name)).toContain("lines across");
    expect(leagueSize("rugby", "nrl", "m")).toEqual({ length: expect.closeTo(116, 6), width: expect.closeTo(68, 6), unit: "m" });
  });

  it("names the rulebooks it was read in", () => {
    for (const league of LEAGUES.rugby) for (const id of league.sources) expect(LEAGUE_SOURCES[id].url, id).toMatch(/^https?:\/\//);
    expect(LEAGUE_SOURCES["world-rugby-laws"].edition).toMatch(/2026/);
    expect(LEAGUE_SOURCES["nrl-laws"].edition).toMatch(/2023/);
    expect(LEAGUE_SOURCES["irl-laws"].edition).toMatch(/2024/);
  });
});
