// The judo kata area (IJF SOR 21 January 2026, B1.8 and the judges' article; the Kata Commission's Tournament Handbook 2024): the centre tape and the two white tapes 3 m from it either side, a safety area of
// 2 m between and round the areas, the five judges on the shomen side 1.25 m apart with the central judge at the centre, the coach's chair opposite, and `budo.style` which asks for all of it.
import { describe, expect, it } from "vitest";

import { budoPlan } from "./budo/plan.ts";
import { drawKyogijo } from "./draw.ts";
import { IJF_KATA } from "./leagues/budo.ts";

/** The boxes of the paths of one class in a drawing, in metres as the plan has them: `M x0 y0 H x1 V y1 H x0 Z`. */
function boxes(svg: string, cls: string): { x0: number; y0: number; x1: number; y1: number }[] {
  const out = [];
  for (const m of svg.matchAll(new RegExp(`<path class="${cls}" d="M(-?[\\d.]+) (-?[\\d.]+)H(-?[\\d.]+)V(-?[\\d.]+)H`, "g"))) out.push({ x0: Number(m[1]), y0: Number(m[2]), x1: Number(m[3]), y1: Number(m[4]) });
  return out;
}
const centreOf = (b: { x0: number; x1: number; y0: number; y1: number }): [number, number] => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
const kata = { sport: "judo", budo: { style: "kata" } } as const;

describe("the kata area's figures", () => {
  it("are the IJF's: 10 m or 8 m, a safety area of 2 m, two tapes 5 cm by 50 cm 3 m from the centre, a centre tape, five judges 1.25 m apart", () => {
    expect(IJF_KATA).toMatchObject({ kata: true, common: 2, marks: { width: 0.05, length: 0.5, fromCentre: 3 }, centre: { width: 0.05, length: 0.5 }, panel: { count: 5, apart: 1.25 } });
    expect(IJF_KATA.contest).toMatchObject({ min: 8, max: 10, drawn: 10 });
    expect(IJF_KATA.safety).toMatchObject({ min: 2, drawn: 2 });
  });

  it("are not in a contest area: no centre tape, no panel", () => {
    const plan = budoPlan({ sport: "judo" });
    expect((plan.figures as typeof IJF_KATA).centre).toBeNull();
    expect((plan.figures as typeof IJF_KATA).panel).toBeNull();
  });
});

describe("a kata area's plan", () => {
  it("is 10 m in a safety area of 2 m, or 8 m when asked, and 2 m between two areas", () => {
    const one = budoPlan(kata);
    expect(one.league).toBe("ijf-kata");
    expect(one.box).toMatchObject({ x1: 14, y1: 14 });
    const eight = budoPlan({ sport: "judo", budo: { style: "kata", size: 8 } });
    expect(eight.box).toMatchObject({ x1: 12, y1: 12 });
    const two = budoPlan({ sport: "judo", budo: { style: "kata", areas: 2 } });
    expect(two.judo?.gap).toBe(2);
    expect(two.box.x1).toBe(2 * 10 + 2 + 2 * 2);
    // A contest area keeps its 4 m.
    expect(budoPlan({ sport: "judo", budo: { areas: 2 } }).judo?.gap).toBe(4);
  });

  it("refuses a size outside 8 m to 10 m and a safety area under 2 m", () => {
    expect(() => budoPlan({ sport: "judo", budo: { style: "kata", size: 11 } })).toThrow(RangeError);
    expect(() => budoPlan({ sport: "judo", budo: { style: "kata", safety: 1.5 } })).toThrow(RangeError);
  });

  it("is what `league: ijf-kata` draws, and `style: shiai` is what it always drew", () => {
    // The ids inside a drawing are a hash of the options, so they are set aside.
    const same = (a: string, b: string): void => expect(a.replace(/ky-[0-9a-z]{6,8}-/g, "ky-")).toBe(b.replace(/ky-[0-9a-z]{6,8}-/g, "ky-"));
    same(drawKyogijo({ ...kata }), drawKyogijo({ sport: "judo", league: "ijf-kata" }));
    same(drawKyogijo({ sport: "judo", budo: { style: "shiai" } }), drawKyogijo({ sport: "judo" }));
    same(drawKyogijo({ sport: "judo", league: "ajjf", budo: { style: "shiai" } }), drawKyogijo({ sport: "judo", league: "ajjf" }));
  });

  it("refuses a style that is not one, and a style that contradicts the league", () => {
    expect(() => budoPlan({ sport: "judo", budo: { style: "kumite" as never } })).toThrow(TypeError);
    expect(() => budoPlan({ sport: "judo", league: "ajjf", budo: { style: "kata" } })).toThrow(/ijf-kata/);
    expect(() => budoPlan({ sport: "judo", league: "ijf-kata", budo: { style: "shiai" } })).toThrow(/does not go with/);
  });

  it("has no referee's place, since the pair is judged by five judges and no one referees", () => {
    const ids = (o: object) => budoPlan({ sport: "judo", ...o }).marks.map((m) => m.id);
    expect(ids({})).toContain("referee-position");
    expect(ids(kata)).not.toContain("referee-position");
    expect(ids(kata)).toEqual(expect.arrayContaining(["centre-tape", "start-mark", "kata-entry"]));
  });
});

describe("a kata area's picture", () => {
  const svg = drawKyogijo({ ...kata });
  const tapes = boxes(svg, "ky-bud-white-fill");

  it("has three white tapes of 5 cm by 50 cm: the centre and one 3 m either side of it, on the line across the area", () => {
    expect(tapes).toHaveLength(3);
    const cx = 7;
    const cy = 7;
    const middles = tapes.map(centreOf).sort((a, b) => a[0] - b[0]);
    expect(middles[0][0]).toBeCloseTo(cx - 3, 1);
    expect(middles[1][0]).toBeCloseTo(cx, 1);
    expect(middles[2][0]).toBeCloseTo(cx + 3, 1);
    for (const [, y] of middles) expect(y).toBeCloseTo(cy, 1);
    for (const t of tapes) expect(t.y1 - t.y0).toBeCloseTo(0.5, 1);
  });

  it("are drawn at their true 5 cm by 50 cm with `exactLines`, and at least 0.75 % of the plan's width across, their length the rule's, without it", () => {
    const exact = boxes(drawKyogijo({ ...kata, exactLines: true }), "ky-bud-white-fill");
    for (const t of exact) {
      expect(t.x1 - t.x0).toBeCloseTo(0.05, 1);
      expect(t.y1 - t.y0).toBeCloseTo(0.5, 1);
    }
    // A plan of 14 m: the floor is 10.5 cm, about 4 pixels on a plan 560 pixels across.
    for (const [i, t] of tapes.entries()) {
      expect(t.x1 - t.x0).toBeCloseTo(0.14 * 0.75, 1);
      expect(t.y1 - t.y0).toBeCloseTo(0.5, 6);
      expect(centreOf(t)[0]).toBeCloseTo(centreOf(exact[i])[0], 1);
      expect(centreOf(t)[1]).toBeCloseTo(centreOf(exact[i])[1], 1);
    }
    // A contest's start tapes get the same floor.
    for (const t of boxes(drawKyogijo({ sport: "judo" }), "ky-bud-white-fill")) expect(t.x1 - t.x0).toBeGreaterThanOrEqual(0.18 * 0.75 - 0.006);
  });

  it("has no blue tape, where a contest area's two tapes are blue and white", () => {
    expect(svg).not.toContain('class="ky-bud-blue-fill"');
    const shiai = drawKyogijo({ sport: "judo" });
    expect(boxes(shiai, "ky-bud-white-fill")).toHaveLength(1);
    expect(boxes(shiai, "ky-bud-blue-fill")).toHaveLength(1);
  });

  it("has no judges' seats unless the officials are asked for", () => {
    expect(boxes(svg, "ky-bud-seat")).toHaveLength(0);
    expect(svg).not.toContain('class="ky-bud-desk"');
  });

  it("puts five judges' seats 1.25 m apart on the shomen side, the central one at the centre, and the coach's chair opposite", () => {
    const withOfficials = drawKyogijo({ sport: "judo", budo: { style: "kata", officials: true } });
    const seats = boxes(withOfficials, "ky-bud-seat");
    expect(seats).toHaveLength(6);
    const judges = seats.slice(0, 5).map(centreOf);
    const coach = centreOf(seats[5]);
    for (let i = 1; i < 5; i += 1) expect(judges[i][0] - judges[i - 1][0]).toBeCloseTo(1.25, 1);
    expect(judges[2][0]).toBeCloseTo(7, 1);
    // The judges are above the area (the top is the shomen side), the coach below it, both at its centre line.
    for (const [, y] of judges) expect(y).toBeLessThan(0);
    expect(coach[0]).toBeCloseTo(7, 1);
    expect(coach[1]).toBeGreaterThan(14);
    // The table is the judges', the length of the seats, and there is no technical table.
    const [table] = boxes(withOfficials, "ky-bud-desk");
    expect(table.x1 - table.x0).toBeCloseTo(6.25, 1);
    expect(centreOf(table)[0]).toBeCloseTo(7, 1);
    expect(budoPlan({ sport: "judo", budo: { style: "kata", officials: true } }).marks.map((m) => m.id)).toEqual(expect.arrayContaining(["kata-judges", "coach-chair"]));
    expect(budoPlan({ sport: "judo", budo: { style: "kata", officials: true } }).marks.map((m) => m.id)).not.toContain("technical-table");
  });

  it("has a panel for each area of a row and a coach's chair for each of the last row", () => {
    const plan = budoPlan({ sport: "judo", budo: { style: "kata", areas: { across: 2, down: 2 }, officials: true } });
    expect(plan.judo?.judges.tables).toHaveLength(2);
    expect(plan.judo?.judges.seats).toHaveLength(10);
    expect(plan.judo?.judges.coaches).toHaveLength(2);
  });

  it("is in the plan's extent, so that no chair is cut off", () => {
    const plan = budoPlan({ sport: "judo", budo: { style: "kata", officials: true } });
    for (const b of [...(plan.judo?.judges.seats ?? []), ...(plan.judo?.judges.coaches ?? [])]) {
      expect(b.y0).toBeGreaterThanOrEqual(plan.extent.y0);
      expect(b.y1).toBeLessThanOrEqual(plan.extent.y1);
    }
  });

  it("is drawn in both languages, in light and dark, with the new parts named", () => {
    const named = drawKyogijo({ ...kata, budo: { style: "kata", officials: true }, landmarks: true, language: "ja" });
    expect(named).toContain("中央のテープ");
    expect(drawKyogijo({ ...kata, budo: { style: "kata", officials: true }, landmarks: true })).toContain("Coach's chair");
    expect(drawKyogijo({ ...kata, theme: "dark" })).toContain("ky-bud-white-fill");
  });
});
