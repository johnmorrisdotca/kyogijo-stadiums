// The wrestling mats: the UWW's (freestyle and Greco-Roman: a circle of 9 m, a protection area of 1.5 m, an orange passivity band of 1 m, a central circle, a platform) and the folkstyle mats of the NCAA and the NFHS (a circle, a matted
// area, the line that outlines the circle, a circle of 10 feet, two starting lines closed by a green and a red line). The figures, the options and their refusals, the words in both languages and the 3D view: a platform that is
// a solid block when there is one, the order the parts are drawn in from every side, and a scene that stays inside its box.
import { describe, expect, it } from "vitest";
import { budoPlan, lookNames } from "./budo-entry.ts";
import { drawKyogijo, SPORTS } from "./draw.ts";
import { FEATURES } from "./features.ts";
import { NCAA_MAT, NFHS_MAT, UWW_MAT, WRESTLING_LEAGUES } from "./leagues/combat.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { buildTurn, eyeDistance, layoutOf, project } from "./turn-entry.ts";
import { depthOf } from "./turn.camera.ts";
import type { Plane } from "./turn.kit.ts";
import { parseXml, withClass } from "./xml.fixture.ts";

const FT = 0.3048;
const IN = 0.0254;
const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);
const plan = (budo?: Record<string, unknown>, league?: string) => budoPlan({ sport: "wrestling", budo, ...(league === undefined ? {} : { league }) } as Parameters<typeof budoPlan>[0]);
const middleOf = (model: ReturnType<typeof buildTurn>, p: Plane): [number, number, number] => [(p.o[0] + (p.u[0] + p.v[0]) / 2 - model.centre[0]) * model.scale, (p.o[1] + (p.u[1] + p.v[1]) / 2 - model.centre[1]) * model.scale, (p.o[2] + (p.u[2] + p.v[2]) / 2) * model.scale];

describe("the mats' figures", () => {
  it("are the UWW's: a 9 m circle, a 1.5 m border, a passivity band of 1 m, a central circle of 1 m with a band of 10 cm, a platform of 0.8 to 1.1 m with 1 m round the mat", () => {
    expect(UWW_MAT.circle).toMatchObject({ min: 9, max: 9 });
    expect(UWW_MAT.border.drawn).toBe(1.5);
    expect(UWW_MAT.passivity).toBe(1);
    expect(UWW_MAT.centre).toEqual({ diameter: 1, band: 0.1 });
    expect(UWW_MAT.platform.height).toMatchObject({ max: 1.1, drawn: 1 });
    expect(UWW_MAT.platform.least).toBe(0.8);
    expect(UWW_MAT.platform.around).toBe(1);
    expect(UWW_MAT.lines).toBeNull();
  });

  it("are the NCAA's: a circle of 32 to 42 feet, a matted area of at least 5 feet, a 2 inch line, no circle in the middle, starting lines of 1 inch, 3 feet long, 10 inches apart", () => {
    expect(NCAA_MAT.circle.min / FT).toBeCloseTo(32, 9);
    expect(NCAA_MAT.circle.max / FT).toBeCloseTo(42, 9);
    expect(NCAA_MAT.border.min / FT).toBeCloseTo(5, 9);
    expect(NCAA_MAT.rim / IN).toBeCloseTo(2, 9);
    expect(NCAA_MAT.centre).toBeNull();
    expect(NCAA_MAT.lines).toMatchObject({ length: 3 * FT, width: 1 * IN, apart: 10 * IN });
  });

  it("are the high schools': a circle of at least 28 feet, a safety mat of about 5 feet, a circle of 10 feet in the middle, the same starting lines", () => {
    expect(NFHS_MAT.circle.min / FT).toBeCloseTo(28, 9);
    expect(NFHS_MAT.border.drawn / FT).toBeCloseTo(5, 9);
    expect(NFHS_MAT.centre!.diameter / FT).toBeCloseTo(10, 9);
    expect(NFHS_MAT.lines).toEqual(NCAA_MAT.lines);
  });

  it("have three leagues with their sources listed", () => {
    expect(WRESTLING_LEAGUES.map((l) => l.id)).toEqual(["uww", "ncaa-wrestling", "nfhs-wrestling"]);
    for (const league of WRESTLING_LEAGUES) for (const id of league.sources) expect(LEAGUE_SOURCES[id], id).toBeDefined();
  });
});

describe("the mats' plans", () => {
  it("make the UWW's mat a square of 12 m round a circle of 9 m, a central surface of 7 m inside the band, on a platform a metre wider each side", () => {
    const L = plan().wrestling!;
    expect(L.mat.x1 - L.mat.x0).toBe(12);
    expect(L.circle).toBe(9);
    expect(L.inner).toBe(7);
    expect(L.border).toBe(1.5);
    expect(L.height).toBe(1);
    expect(L.platform).toEqual({ x0: -1, y0: -1, x1: 13, y1: 13 });
    expect(L.start).toBeUndefined();
    expect(L.parts.areas.map((a) => a.id)).toEqual(["platform", "border", "circle", "passivity"]);
  });

  it("make a folkstyle mat a circle in a square with the matted area round it, the starting lines at the middle with their ends", () => {
    const L = plan(undefined, "ncaa-wrestling").wrestling!;
    expect(L.circle / FT).toBeCloseTo(32, 9);
    expect(L.mat.x1 - L.mat.x0).toBeCloseTo(32 * FT + 10 * FT, 9);
    expect(L.height).toBe(0);
    expect(L.platform).toBeUndefined();
    // The two starting lines are 3 feet long and 10 inches apart, the ends 12 inches outside to outside.
    const ids = L.parts.shapes.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["start-line-1", "start-line-2", "start-green", "start-red", "rim"]));
    expect(L.start!.x1 - L.start!.x0).toBeCloseTo(3 * FT, 9);
    expect(L.start!.y1 - L.start!.y0).toBeCloseTo(12 * IN, 9);
    expect(L.parts.shapes.some((s) => s.id === "centre-circle")).toBe(false);
    expect(plan(undefined, "nfhs-wrestling").wrestling!.parts.shapes.some((s) => s.id === "centre-circle")).toBe(true);
  });

  it("take the circle, the platform, the circle in the middle and the lines from the options, within the league's range", () => {
    expect(plan({ size: 12 }, "ncaa-wrestling").wrestling!.circle).toBe(12);
    expect(plan({ height: 0.8 }).wrestling!.height).toBe(0.8);
    expect(plan({ height: 0 }).wrestling!.platform).toBeUndefined();
    expect(plan({ height: 0.5 }, "nfhs-wrestling").wrestling!.platform).toBeDefined();
    expect(plan({ circle: false }, "nfhs-wrestling").wrestling!.parts.shapes.some((s) => s.id === "centre-circle")).toBe(false);
    expect(plan({ start: false }, "ncaa-wrestling").wrestling!.start).toBeUndefined();
    expect(() => plan({ size: 10 })).toThrow(/UWW/);
    expect(() => plan({ size: 9 * 1.2 }, "ncaa-wrestling")).not.toThrow();
    expect(() => plan({ size: 8 }, "ncaa-wrestling")).toThrow(RangeError);
    expect(() => plan({ size: 8 }, "nfhs-wrestling")).toThrow(/NFHS/);
    expect(() => plan({ height: 1.2 })).toThrow(/platform/);
    expect(() => plan({ height: 0.5 })).toThrow(/none, or 0.8 m to 1.1 m/);
    expect(() => plan({ circle: "no" })).toThrow(/true or false/);
    expect(() => plan(undefined, "nba")).toThrow(/Unknown league "nba" for "wrestling"/);
  });
});

describe("the mats' drawings", () => {
  it("are the same text for the same options, in three looks, light and dark", () => {
    expect(drawKyogijo({ sport: "wrestling", id: "a" })).toBe(drawKyogijo({ sport: "wrestling", id: "a" }));
    expect(lookNames("wrestling")).toEqual(["blue-red", "green-beige", "yellow-blue"]);
    for (const name of lookNames("wrestling")) expect(drawKyogijo({ sport: "wrestling", budo: { look: name } })).toContain(`data-look="${name}"`);
    expect(() => drawKyogijo({ sport: "wrestling", budo: { look: "gold" } })).toThrow(/Unknown look "gold" for "wrestling"/);
  });

  it("draw the circle, the border, the passivity band (the UWW's), the green and red ends (folkstyle) and name every part for the features", () => {
    const uww = parseXml(drawKyogijo({ sport: "wrestling", id: "u" }));
    for (const cls of ["ky-bud-t1", "ky-bud-t2", "ky-bud-t3", "ky-bud-platform", "ky-bud-line"]) expect(withClass(uww, cls).length, cls).toBeGreaterThan(0);
    const folk = parseXml(drawKyogijo({ sport: "wrestling", league: "ncaa-wrestling", id: "n" }));
    for (const cls of ["ky-bud-green-fill", "ky-bud-red-fill", "ky-bud-white-fill"]) expect(withClass(folk, cls).length, cls).toBeGreaterThan(0);
    expect(drawKyogijo({ sport: "judo" })).not.toContain("ky-bud-green-fill");
    for (const league of ["uww", "ncaa-wrestling", "nfhs-wrestling"]) {
      const featureColors = Object.fromEntries(FEATURES.wrestling.map((name) => [name, "#123456"]));
      const svg = drawKyogijo({ sport: "wrestling", league, id: "f", featureColors, budo: { height: league === "uww" ? 1 : 0.5 } });
      const used = FEATURES.wrestling.filter((name) => withClass(parseXml(svg), `ky-f-${name}`).length > 0);
      expect(used.length, league).toBeGreaterThanOrEqual(5);
    }
  });

  it("say what they are, in English and in Japanese, with their figures", () => {
    const en = drawKyogijo({ sport: "wrestling" });
    expect(en).toContain("a wrestling mat of the UWW, for freestyle and Greco-Roman wrestling: a circle 9 metres across in a protection area 1.5 metres wide, with an orange passivity band 1 metre wide inside the circle, on a platform 1 metres high");
    expect(en).toContain("A circle 1 metres across marks the middle.");
    const folk = drawKyogijo({ sport: "wrestling", league: "ncaa-wrestling" });
    expect(folk).toContain("a folkstyle wrestling mat: a circle 32 feet (9.75 metres) across in a matted area 5 feet wide, on the floor of the hall");
    expect(folk).toContain("closed at their ends by a green line and a red line");
    expect(drawKyogijo({ sport: "wrestling", language: "ja" })).toContain("UWWのレスリングマット");
    expect(drawKyogijo({ sport: "wrestling", league: "ncaa-wrestling", language: "ja" })).toContain("フォークスタイルのレスリングマット");
  });

  it("label their parts with words in both languages, and are surfaces of the package with ranges that crop", () => {
    for (const league of ["uww", "nfhs-wrestling"]) {
      for (const mark of plan(undefined, league).wrestling!.marks) {
        expect(KYOGIJO_STRINGS.en.notes.names[mark.id], mark.id).toMatch(/\S/);
        expect(KYOGIJO_STRINGS.ja.notes.names[mark.id], mark.id).toMatch(/[぀-ヿ一-鿿]/u);
      }
    }
    expect(SPORTS).toContain("wrestling");
    const whole = parseXml(drawKyogijo({ sport: "wrestling" })).attrs.viewBox.split(" ").map(Number);
    for (const r of ["start", "passivity", "half"] as const) {
      const part = parseXml(drawKyogijo({ sport: "wrestling", range: r })).attrs.viewBox.split(" ").map(Number);
      expect(part[2] * part[3], r).toBeLessThan(whole[2] * whole[3]);
    }
    expect(() => drawKyogijo({ sport: "wrestling", league: "ncaa-wrestling", range: "passivity" })).toThrow(/has no range/);
  });
});

describe("the UWW's mat in 3D", () => {
  const model = buildTurn({ sport: "wrestling" }, {});
  const deckTop = model.planes.find((p) => p.id === "deck-top")!;

  it("stands on a solid platform of 1 m (3.28 feet): four sides to the floor and a flat top that is the drawing's own mat", () => {
    const sides = model.planes.filter((p) => /^deck-\d$/.test(p.id));
    expect(sides).toHaveLength(4);
    expect(deckTop.crop).toBe(true);
    expect(deckTop.o[2]).toBeCloseTo(1 / FT, 6);
    for (const s of sides) expect(s.o[2] + s.v[2]).toBeCloseTo(0, 6);
    expect(model.uprights.whole).toBe(true);
    expect(model.standing).toContain("platform 1 metres");
    expect(model.planes.some((p) => p.svg.includes("<text"))).toBe(false);
  });

  it("draws the far sides before the top and the near sides after it at every turn and tip, and keeps the whole floor in the box", () => {
    const sides = model.planes.filter((p) => /^deck-\d$/.test(p.id));
    const topIndex = model.planes.indexOf(deckTop) + 1;
    for (const pitch of [20, 45, 62, 70, 84]) {
      for (const yaw of range(0, 355, 5)) {
        const view = { yaw, pitch, zoom: 1 };
        const layout = layoutOf(model, view, 960, 600);
        const topDepth = depthOf(middleOf(model, deckTop), view, layout.at);
        for (const side of sides) {
          const d = depthOf(middleOf(model, side), view, layout.at);
          if (Math.abs(d - topDepth) < 1e-6) continue;
          expect(layout.stack[model.planes.indexOf(side) + 1] < layout.stack[topIndex], `${side.id} yaw ${yaw} pitch ${pitch}`).toBe(d < topDepth);
        }
      }
    }
    const v = model.viewBox;
    const floor = [[v.x, v.y], [v.x + v.w, v.y], [v.x + v.w, v.y + v.h], [v.x, v.y + v.h]].map(([x, y]): [number, number, number] => [(x - model.centre[0]) * model.scale, (y - model.centre[1]) * model.scale, 0]);
    for (const [w, h] of [[960, 600], [390, 300]]) {
      const d = eyeDistance(w, h);
      for (const pitch of [0, 30, 62, 84]) {
        for (const yaw of range(0, 355, 15)) {
          const view = { yaw, pitch, zoom: 1 };
          const at = layoutOf(model, view, w, h).at;
          for (const point of floor) {
            const [x, y] = project(point, view, at, d);
            expect(Math.abs(x)).toBeLessThanOrEqual(w / 2);
            expect(Math.abs(y)).toBeLessThanOrEqual(h / 2);
          }
        }
      }
    }
  });

  it("has nothing standing on a folkstyle mat, which lies on the floor, and a platform when one is asked for", () => {
    expect(buildTurn({ sport: "wrestling", league: "ncaa-wrestling" }, {}).planes.filter((p) => p.kind !== "ground")).toHaveLength(0);
    expect(buildTurn({ sport: "wrestling", league: "nfhs-wrestling", budo: { height: 0.6 } }, {}).planes.some((p) => p.id === "deck-top")).toBe(true);
  });
});
