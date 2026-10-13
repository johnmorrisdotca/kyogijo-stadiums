// The lacrosse surfaces, each figure held to its rulebook: World Lacrosse's men's field (2025-2027), women's field (2025-2026) and box floor (2026-2028), the NCAA's men's (2027-28) and women's (2026-27) fields, the PLL's
// (2024) and the NLL's floor (2025-26). A figure is read back from the plan in metres, yards, feet or inches, in the unit its book prints.
import { describe, expect, it } from "vitest";
import { fortyFiveMeeting } from "./fields/lacrosse.ts";
import { dotsIn, inch, linesIn, m, named, placesOf, planOf, yd } from "./fields.fixture.ts";
import type { ArcShape, RingShape } from "./fields.types.ts";
import { LEAGUES, LEAGUE_SOURCES, lacrosseOf } from "./leagues.ts";
import { drawKyogijo } from "./draw.ts";

const close = (a: number, b: number, places = 2): void => expect(a).toBeCloseTo(b, places);
const arcOf = (plan: ReturnType<typeof planOf>, id: string): ArcShape[] => named(plan, id).filter((shape): shape is ArcShape => shape.kind === "arc");
const ringOf = (plan: ReturnType<typeof planOf>, id: string): RingShape[] => named(plan, id).filter((shape): shape is RingShape => shape.kind === "ring");
const wide = (plan: ReturnType<typeof planOf>, id: string): number[] => named(plan, id).map((shape) => ("w" in shape ? (shape.w ?? plan.lineWidth) : plan.lineWidth));

describe("World Lacrosse's men's field (2025-2027)", () => {
  const plan = planOf("lacrosse");

  it("is 91.4 to 100 m long and 50 to 60 m wide, the greatest drawn (1.1)", () => {
    close(m(plan.length), 100);
    close(m(plan.width), 60);
    expect(() => planOf("lacrosse", "world-men", { units: "m", field: { length: 91.3 } })).toThrow(/91.4 to 100 m/);
    expect(() => planOf("lacrosse", "world-men", { units: "m", field: { width: 61 } })).toThrow(/50 to 60 m/);
    close(m(planOf("lacrosse", "world-men", { units: "m", field: { length: 91.4, width: 50 } }).length), 91.4);
  });

  it("has the goal 12 m from each end line, centred, its posts 1.83 m apart and its net 2.1 m deep (2.1, 2.2, 4.1)", () => {
    const posts = dotsIn(plan, "goal-post");
    expect(posts).toHaveLength(4);
    close(posts[0][0], 12);
    close(posts[1][1] - posts[0][1], 1.83);
    close((posts[0][1] + posts[1][1]) / 2, 30);
    close(m(plan.goals[0].depth), 2.1);
    close(m(plan.goals[0].width), 1.83);
    expect(plan.goals.map((goal) => goal.end)).toEqual(["left", "right"]);
    close(m(plan.goals[1].x), 88);
  });

  it("has a crease that is a circle of 3 m radius about the middle of the goal line (3.1)", () => {
    const [crease] = ringOf(plan, "crease");
    close(m(crease.rx), 3);
    close(m(crease.cx), 12);
  });

  it("has the goal area lines 22 m from the goal line, side line to side line (5.1)", () => {
    expect(placesOf(plan, "restraining-line", "x")).toEqual([expect.closeTo(34, 2), expect.closeTo(66, 2)]);
    for (const [, y0, , y1] of linesIn(plan, "restraining-line")) expect([Math.round(y0), Math.round(y1)]).toEqual([0, 60]);
  });

  it("has wing lines 18 m from the centre of the field, extending 10 m either side of the centre line (7.1)", () => {
    const lines = linesIn(plan, "wing-line");
    expect(lines.map(([, y]) => Math.round(y * 100) / 100)).toEqual([12, 48]);
    for (const [x0, , x1] of lines) {
      close(x0, 40);
      close(x1, 60);
    }
  });

  it("has lines 5 cm wide and a centre line 10 cm wide (12.1)", () => {
    close(m(plan.lineWidth) * 100, 5, 1);
    close(m(wide(plan, "centre-line")[0]) * 100, 10, 1);
    close(m(wide(plan, "wing-line")[0]) * 100, 5, 1);
  });

  it("has an X at the centre (6.1)", () => {
    expect(named(plan, "centre-x")).toHaveLength(2);
  });
});

describe("World Lacrosse's women's field (2025-2026)", () => {
  const plan = planOf("lacrosse", "world-women");

  it("is 91.4 to 100 m by 50 to 60 m, the goal line 12 m from the end lines and 1.83 m long (1.A.2, 1.A.5)", () => {
    close(m(plan.length), 100);
    close(m(plan.width), 60);
    close(m(plan.goals[0].x), 12);
    close(m(plan.goals[0].width), 1.83);
    expect(() => planOf("lacrosse", "world-women", { units: "m", field: { length: 101 } })).toThrow(/91.4 to 100 m/);
  });

  it("has a goal circle of 3 m radius, a 15 m marking area to each goal line extended and an 11 m marking area (1.A.6 to 1.A.8)", () => {
    close(m(ringOf(plan, "goal-circle")[0].rx), 3);
    const [semi] = arcOf(plan, "marking-area");
    close(m(semi.r), 15);
    expect([semi.a0, semi.a1]).toEqual([-90, 90]);
    const [fan] = arcOf(plan, "fan");
    close(m(fan.r), 11);
  });

  it("ends the 11 m marking area at lines from where the goal line extended meets the goal circle, at 45 degrees to it (1.A.7)", () => {
    const lines = linesIn(plan, "forty-five-line");
    expect(lines).toHaveLength(4);
    for (const [x0, y0, x1, y1] of lines.slice(0, 2)) {
      close(Math.abs(y0 - 30), 3);
      close(Math.abs(x1 - x0), Math.abs(Math.abs(y1 - 30) - 3), 2);
    }
    // The line's end is 11 m from the middle of the goal line.
    const [x0, y0, x1, y1] = lines[0];
    close(Math.hypot(x1 - 12, y1 - 30), 11);
    expect(Math.hypot(x1 - x0, y1 - y0)).toBeGreaterThan(7);
    const meeting = fortyFiveMeeting(3, 11);
    close(meeting.along, Math.hypot(x1 - x0, y1 - y0), 1);
  });

  it("has the restraining lines 22 m from each goal line, the centre circle of 9 m radius and a centre line of 3 m (1.A.9 to 1.A.11)", () => {
    expect(placesOf(plan, "restraining-line", "x")).toEqual([expect.closeTo(34, 2), expect.closeTo(66, 2)]);
    close(m(ringOf(plan, "centre-circle")[0].rx), 9);
    const [mark] = linesIn(plan, "centre-mark-line");
    close(mark[3] - mark[1], 3);
  });

  it("marks the goal line extended from the goal circle to the marking area, 3 m to 15 m (1.A.5)", () => {
    const lines = linesIn(plan, "goal-line-extended");
    expect(lines).toHaveLength(4);
    close(Math.abs(lines[0][3] - lines[0][1]), 12);
  });
});

describe("the NCAA's fields", () => {
  const men = planOf("lacrosse", "ncaa-men");
  const women = planOf("lacrosse", "ncaa-women");

  it("men's: 110 by 60 yards, the goal 6 ft by 6 ft, 15 yards from each end line (1-2, 1-3)", () => {
    close(yd(men.length), 110);
    close(yd(men.width), 60);
    close(yd(men.goals[0].x), 15);
    close(men.goals[0].width, 6);
    expect(() => planOf("lacrosse", "ncaa-men", { units: "yd", field: { length: 109 } })).toThrow(/110 to 110 yd/);
  });

  it("men's: a crease of 9 ft radius, a goal mouth of 6 ft radius and a net 7 ft back (1-4, 1-5)", () => {
    close(ringOf(men, "crease")[0].rx, 9);
    const [mouth] = arcOf(men, "goal-mouth");
    close(mouth.r, 6);
    expect([mouth.a0, mouth.a1]).toEqual([-90, 90]);
    close(men.goals[0].depth, 7);
  });

  it("men's: the attack-area line is 40 yards long, centred, 20 yards from the goal line and joined to the end lines; the defensive-area line is 20 yards from the goal line, sideline to sideline (1-6, 1-7)", () => {
    const restraining = linesIn(men, "restraining-line");
    close(restraining[0][0] / 0.9144, 35);
    const attack = linesIn(men, "attack-area-line");
    expect(attack).toHaveLength(4);
    for (const [x0, y0, x1, y1] of attack.slice(0, 2)) {
      close(x0 / 0.9144, 35);
      close(x1, 0);
      close(y0, y1);
    }
    const ys = attack.map(([, y]) => y / 0.9144);
    close(Math.max(...ys) - Math.min(...ys), 40);
    for (const [, y0, , y1] of restraining) expect([Math.round(y0 / 0.9144), Math.round(y1 / 0.9144)]).toEqual([0, 60]);
  });

  it("men's: wing lines 20 yards from the centre of the field, 10 yards either side of the centre line; lines 2 in wide, the centre line 4 in (1-2, 1-8)", () => {
    const lines = linesIn(men, "wing-line");
    close(Math.abs(lines[0][1] - 27.432) / 0.9144, 20);
    close((lines[0][2] - lines[0][0]) / 0.9144, 20);
    close(inch(men.lineWidth), 2, 1);
    close(inch(wide(men, "centre-line")[0]), 4, 1);
  });

  it("women's: 110 by 60 m (101 to 110 by 55 to 64 m), the goals 92 m apart, 9 m behind each goal line (1-1)", () => {
    close(m(women.length), 110);
    close(m(women.width), 60);
    close(m(women.goals[0].x), 9);
    close(m(women.goals[1].x) - m(women.goals[0].x), 92);
    expect(() => planOf("lacrosse", "ncaa-women", { units: "m", field: { length: 100 } })).toThrow(/101 to 110 m/);
    expect(() => planOf("lacrosse", "ncaa-women", { units: "m", field: { width: 65 } })).toThrow(/55 to 64 m/);
    close(m(planOf("lacrosse", "ncaa-women", { units: "m", field: { length: 101, width: 64 } }).length), 101);
  });

  it("women's: a goal circle of 2.6 m radius, a restraining line 27 m from each goal line, a centre circle of 9 m radius and a 3 m line through the centre (1-4, 1-5, 1-21)", () => {
    close(m(ringOf(women, "goal-circle")[0].rx), 2.6);
    expect(placesOf(women, "restraining-line", "x")).toEqual([expect.closeTo(36, 2), expect.closeTo(74, 2)]);
    close(m(ringOf(women, "centre-circle")[0].rx), 9);
    const [mark] = linesIn(women, "centre-mark-line");
    close(mark[3] - mark[1], 3);
  });

  it("women's: a fan of 12 m and an arc of 8 m from the goal circle, so 14.6 m and 10.6 m from the middle of the goal line, the arc ending at lines at 45 degrees to the goal line extended, 8.58 m long (1-6, Diagram 2)", () => {
    close(m(arcOf(women, "fan")[0].r), 10.6);
    close(m(arcOf(women, "marking-area")[0].r), 14.6);
    expect([arcOf(women, "marking-area")[0].a0, arcOf(women, "marking-area")[0].a1]).toEqual([-90, 90]);
    const [x0, y0, x1, y1] = linesIn(women, "forty-five-line")[0];
    expect(Math.abs(Math.hypot(x1 - x0, y1 - y0) - 8.58)).toBeLessThan(0.05);
    close(Math.abs(y0 - 30), 2.6);
  });
});

describe("the PLL's field (2024)", () => {
  const plan = planOf("lacrosse", "pll");

  it("is 100 by 60 yards, the goal 15 yards from each end line, a crease of 9 ft radius (II A, D, E)", () => {
    close(yd(plan.length), 100);
    close(yd(plan.width), 60);
    close(yd(plan.goals[0].x), 15);
    close(ringOf(plan, "crease")[0].rx, 9);
  });

  it("has the two-point arc 13 yards from the middle of the goal line at the goal line extended, parallel to the sideline until it is 15 yards from it, an arc of 15 yards across, and lines to the end line (II G)", () => {
    const lines = linesIn(plan, "two-point-line");
    expect(lines).toHaveLength(4);
    const [x0, y0, x1, y1] = lines[0];
    close(Math.abs(y0 - 27.432) / 0.9144, 13);
    close(y0, y1);
    close(x0, 0);
    close(x1 / 0.9144, 15 + Math.sqrt(15 * 15 - 13 * 13));
    // It ends 15 yards from the middle of the goal line.
    close(Math.hypot(x1 - 13.716, y1 - 27.432) / 0.9144, 15);
    const [arc] = arcOf(plan, "two-point-arc");
    close(arc.r / 3, 15);
  });

  it("has wing lines 19 yards from the centre, 10 yards either side, and a centre line and an arc 4 in wide (II A, H)", () => {
    const wings = linesIn(plan, "wing-line");
    close(Math.abs(wings[0][1] - 27.432) / 0.9144, 19);
    close((wings[0][2] - wings[0][0]) / 0.9144, 20);
    close(inch(wide(plan, "centre-line")[0]), 4, 1);
    close(inch(wide(plan, "two-point-arc")[0]), 4, 1);
  });
});

describe("the box floor: the NLL's (2025-26) and World Lacrosse's (2026-2028)", () => {
  const nll = planOf("lacrosse", "nll");
  const box = planOf("lacrosse", "world-box");
  const ft = (feet: number): number => feet;

  it("is 180 to 200 feet by 85, the greatest drawn, with corners of 28 ft radius (Diagram A)", () => {
    close(ft(nll.length), 200);
    close(ft(nll.width), 85);
    expect(nll.outline).toEqual({ kind: "rect", radius: 28 });
    expect(() => planOf("lacrosse", "nll", { units: "ft", field: { length: 179 } })).toThrow(/180 to 200 ft/);
    close(planOf("lacrosse", "nll", { units: "ft", field: { length: 180 } }).length, 180);
    expect(() => planOf("lacrosse", "world-box", { units: "ft", field: { length: 190 } })).toThrow(/200 to 200 ft/);
    close(box.length, 200);
  });

  it("has the goal line 12 ft from the end boards and the goal 4 ft 9 in wide and 4 ft high (2.1)", () => {
    close(nll.goals[0].x, 12);
    close(nll.goals[0].width, 4.75);
    close(lacrosseOf(LEAGUES.lacrosse.find((league) => league.id === "nll") as never).goalHeight, 4);
    close(nll.goals[1].x, 188);
  });

  it("has poles of 4 ft 6 in running back from the posts' bases until they meet, so the net is as deep as that triangle (2.2)", () => {
    close(nll.goals[0].depth, Math.sqrt(4.5 * 4.5 - 2.375 * 2.375));
  });

  it("has a crease that is a circle of 9 ft 3 in radius about the middle of the goal line, cut by a straight line 1 ft behind the apex of the goal (3.1, Diagram B), its line 5 in wide", () => {
    const [crease] = arcOf(nll, "crease");
    // The radius is to the outside edge of the line, which is 5 in wide.
    close(crease.r + 5 / 24, 9.25, 3);
    const apex = Math.sqrt(4.5 * 4.5 - 2.375 * 2.375);
    const [flat] = linesIn(nll, "crease-flat");
    close(flat[0] / 0.3048, 12 - apex - 1);
    close(inch((named(nll, "crease")[0] as ArcShape).w ?? 0), 5, 1);
  });

  it("has the restraining lines 42 ft 6 in either side of the centre line, side to side (1.5), and all lines 2 in wide (World Lacrosse 1.1.3)", () => {
    expect(placesOf(nll, "restraining-line", "x").map((x) => x / 0.3048)).toEqual([expect.closeTo(100 - 42.5, 2), expect.closeTo(100 + 42.5, 2)]);
    close(inch(nll.lineWidth), 2, 1);
    close(inch(box.lineWidth), 2, 1);
  });

  it("has the face-off circle of 11 ft radius with a dotted circle of 17 in at the centre, and corner face-off spots 5 yards from the boards and 5 yards inside the restraining lines (6.1, 6.2)", () => {
    close(ringOf(nll, "face-off-circle")[0].rx, 11);
    close(inch(ringOf(nll, "face-off-dotted-circle")[0].rx), 17, 1);
    const spots = dotsIn(nll, "face-off-spot").map(([x, y]) => [x / 0.3048, y / 0.3048]);
    expect(spots).toHaveLength(4);
    for (const [, y] of spots) expect([15, 70]).toContain(Math.round(y * 100) / 100);
    expect(spots.map(([x]) => Math.round(x * 10) / 10).sort((a, b) => a - b)).toEqual([42.5, 42.5, 157.5, 157.5]);
  });

  it("is bounded by boards drawn as a frame, not a line", () => {
    expect(named(nll, "dasher-boards")).toHaveLength(0);
    expect(nll.areas.map((area) => area.id)).toContain("boards");
    expect(named(planOf("lacrosse"), "boundary")).toHaveLength(1);
  });
});

describe("every lacrosse league", () => {
  it("has a unique id, names in both languages and sources that are listed with an address", () => {
    const ids = LEAGUES.lacrosse.map((league) => league.id);
    expect(ids).toEqual(["world-men", "world-women", "ncaa-men", "ncaa-women", "pll", "nll", "world-box"]);
    for (const league of LEAGUES.lacrosse) {
      expect(league.name.ja).toMatch(/[぀-ヿ一-鿿]/u);
      for (const id of league.sources) expect(LEAGUE_SOURCES[id].url, id).toMatch(/^https:\/\//);
    }
    expect(LEAGUE_SOURCES["pll-2024"].edition).toMatch(/2024/);
  });

  it("draws every one, wide and tall, with a score, at a size under the budget", () => {
    for (const league of LEAGUES.lacrosse) {
      expect(drawKyogijo({ sport: "lacrosse", league: league.id }).length, league.id).toBeLessThan(17_500);
      expect(drawKyogijo({ sport: "lacrosse", league: league.id, orientation: "portrait", away: { name: "A", score: 1 }, home: { name: "B", score: 2 } }).length, league.id).toBeLessThan(17_500);
    }
  });
});
