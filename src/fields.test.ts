// What the field sports share: the scores that are written their own way (Australian football's goals and behinds, Gaelic games' goals and points), every sport and every league drawn wide and tall, bare and with a score,
// within a size budget; the looks, the features, the landmarks, the ranges, the frames, the zones and the outline; and the drawings of every other sport left as they were.
import { describe, expect, it } from "vitest";
import { describe as describeDrawing, drawKyogijo, SPORTS, winnerOf } from "./draw.ts";
import { fieldScoreText, fieldTotal } from "./field.score.ts";
import { fieldPlan, FIELD_SPORTS, isFieldSport } from "./fields.ts";
import { FEATURES } from "./features.ts";
import { FRAMES } from "./frames.ts";
import "./frames.providers.ts";
import { toSurface, fromSurface } from "./frames.ts";
import { KYOGIJO_BASE_STYLE, KYOGIJO_STYLE } from "./style.ts";
import { fieldsStyle } from "./fields.style.ts";
import { LEAGUES, chooseLeague, leagueFigures, leagueSize } from "./leagues.ts";
import { LOOK_NAMES, contrastOf, lookPalette } from "./look.ts";
import { outlineOf } from "./outline.ts";
import { RANGES } from "./ranges.names.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import type { FieldSport, ScoreOptions, SurfaceOptions } from "./types.ts";
import { parseXml, walk, withClass } from "./xml.fixture.ts";

const away = { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" };
const home = { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" };
const game = { away, home, status: "final", id: "g" } as const;
const every = FIELD_SPORTS.flatMap((sport) => LEAGUES[sport].map((league) => ({ sport, league: league.id })));

describe("Australian football's score is goals, behinds and the total", () => {
  const afl = { sport: "afl" as const, id: "a", status: "final", away: { name: "Harbour City Gulls", abbr: "HCG", goals: 10, behinds: 12, color: "#1f5fa8" }, home: { name: "Prairie Ridge Bison", abbr: "PRB", goals: 9, behinds: 14, color: "#b5452c" } };

  it("writes 10.12 (72) and works the total out: a goal is 6 and a behind 1", () => {
    expect(fieldScoreText("afl", afl.away)).toBe("10.12 (72)");
    expect(fieldScoreText("afl", afl.home)).toBe("9.14 (68)");
    expect(fieldTotal("afl", afl.away)).toBe(72);
    const text = walk(parseXml(drawKyogijo(afl))).filter((node) => node.name === "text").map((node) => node.text);
    expect(text).toEqual(expect.arrayContaining(["10.12 (72)", "9.14 (68)"]));
  });

  it("says each team's goals and behinds in the description, and who won", () => {
    const { description, title } = describeDrawing(afl);
    expect(description).toContain("Harbour City Gulls scored 10 goals and 12 behinds.");
    expect(title).toBe("Prairie Ridge Bison 9.14 (68), Harbour City Gulls 10.12 (72), Final");
    expect(winnerOf({ ...afl })).toBe("away");
    expect(drawKyogijo(afl)).toContain('data-winner="away"');
  });

  it("takes the score the team gives when it gives one, and writes a team that gives none of goals and behinds as it always did", () => {
    expect(fieldScoreText("afl", { score: 80, goals: 10, behinds: 12 })).toBe("10.12 (80)");
    expect(fieldTotal("afl", { score: 80, goals: 10, behinds: 12 })).toBe(80);
    expect(fieldScoreText("afl", { score: 72 })).toBeUndefined();
    expect(fieldScoreText("afl", { goals: 10 })).toBeUndefined();
    expect(fieldScoreText("afl", { goals: -1, behinds: 2 })).toBeUndefined();
    expect(fieldScoreText("afl", { goals: 1.5, behinds: 2 })).toBeUndefined();
    expect(fieldScoreText("nhl", { goals: 3, behinds: 2 })).toBeUndefined();
    expect(fieldScoreText("afl", { goals: "7", behinds: "3" })).toBe("7.3 (45)");
    expect(drawKyogijo({ sport: "afl", ...game })).toContain(">3<");
  });
});

describe("a Gaelic games score is goals and points: 2-14 (20)", () => {
  const gaelic = { sport: "gaelic" as const, id: "gg", status: "final", away: { name: "Harbour City Gulls", goals: 2, points: 14 }, home: { name: "Prairie Ridge Bison", goals: 1, points: 15 } };

  it("writes the goals and the points and works the total out: a goal is 3 and a point 1", () => {
    expect(fieldScoreText("gaelic", gaelic.away)).toBe("2-14 (20)");
    expect(fieldScoreText("gaelic", gaelic.home)).toBe("1-15 (18)");
    expect(describeDrawing(gaelic).description).toContain("Harbour City Gulls scored 2 goals and 14 points.");
    expect(winnerOf(gaelic)).toBe("away");
    expect(winnerOf({ ...gaelic, away: { ...gaelic.away, goals: 1, points: 15 } })).toBe("none");
  });

  it("a level game is level, and the hurling field takes the same score", () => {
    const level = { ...gaelic, home: { ...gaelic.away, name: "Prairie Ridge Bison" }, league: "gaa-hurling" };
    expect(describeDrawing(level).description).toContain("The game is level.");
    expect(drawKyogijo(level)).toContain("2-14 (20)");
  });
});

describe("every field sport and every league", () => {
  for (const { sport, league } of every) {
    it(`${sport} ${league}: is drawn bare, tall, with a score, as a badge and in a compact strip, well-formed, with a title and a description, within the budget`, () => {
      const options = { sport, league } as SurfaceOptions;
      for (const svg of [drawKyogijo(options), drawKyogijo({ ...options, orientation: "portrait" }), drawKyogijo({ ...options, ...game } as ScoreOptions), drawKyogijo({ ...options, ...game, size: "badge" } as ScoreOptions), drawKyogijo({ ...options, ...game, size: "compact" } as ScoreOptions)]) {
        const root = parseXml(svg);
        expect(root.name).toBe("svg");
        expect(root.attrs["data-sport"]).toBe(sport);
        expect(root.attrs.viewBox.split(" ").map(Number).every(Number.isFinite)).toBe(true);
        expect(svg.length).toBeLessThan(17_500);
      }
      const { title, description } = describeDrawing(options);
      expect(title.length).toBeGreaterThan(5);
      expect(description.length).toBeGreaterThan(40);
      expect(describeDrawing({ ...options, language: "ja" }).description).toMatch(/[぀-ヿ一-鿿]/u);
      expect(drawKyogijo({ ...options, language: "ja" })).toMatch(/[぀-ヿ一-鿿]/u);
    });

    it(`${sport} ${league}: draws the same text for the same options, the whole surface in the box of its view, and a tall drawing as the wide one turned`, () => {
      const options = { sport, league, id: "t" } as SurfaceOptions;
      expect(drawKyogijo(options)).toBe(drawKyogijo(options));
      const wide = parseXml(drawKyogijo(options)).attrs.viewBox.split(" ").map(Number);
      const tall = parseXml(drawKyogijo({ ...options, orientation: "portrait" })).attrs.viewBox.split(" ").map(Number);
      expect(tall[2]).toBeCloseTo(wide[3], 1);
      expect(tall[3]).toBeCloseTo(wide[2], 1);
    });

    it(`${sport} ${league}: lists its figures in words and its size in a unit`, () => {
      const found = LEAGUES[sport].find((one) => one.id === league);
      expect(found).toBeDefined();
      const figures = leagueFigures(found as never);
      expect(figures.length).toBeGreaterThanOrEqual(3);
      for (const [name, value] of figures) {
        expect(name).toMatch(/\S/);
        expect(value).toMatch(/\d|no size given|^none$/);
        expect(value).not.toContain("NaN");
      }
      const size = leagueSize(sport, league);
      expect(size.length).toBeGreaterThan(5);
      expect(size.width).toBeGreaterThan(5);
    });
  }

  it("knows which sports are field sports, and lists them after the others", () => {
    expect(FIELD_SPORTS).toEqual(["lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"]);
    expect(SPORTS.slice(-7)).toEqual(FIELD_SPORTS);
    expect(isFieldSport("rugby")).toBe(true);
    expect(isFieldSport("soccer")).toBe(false);
    expect(() => fieldPlan({ sport: "soccer" })).toThrow(/not a field sport/);
  });

  it("refuses a league of another sport, and an unknown one, saying what to use", () => {
    expect(() => chooseLeague({ sport: "rugby", league: "nba" })).toThrow(/"nba" is a basketball league: use sport "nba"/);
    expect(() => chooseLeague({ sport: "rugby", league: "afl" })).toThrow(/"afl" is a afl league: use sport "afl"/);
    expect(() => chooseLeague({ sport: "rugby", league: "union" })).toThrow(/Unknown league "union" for "rugby": use one of world-rugby, nrl, irl/);
    expect(chooseLeague({ sport: "rugby", league: "world-rugby" }).league).toBeUndefined();
    expect(chooseLeague({ sport: "rugby", league: "nrl" }).league?.id).toBe("nrl");
  });
});

describe("the other sports' drawings are as they were", () => {
  it("leave the base stylesheet alone: a field sport's colours are in a block of its own, and only for the sports that differ from grass", () => {
    expect(KYOGIJO_BASE_STYLE).not.toContain("data-sport=rugby");
    expect(KYOGIJO_BASE_STYLE).not.toContain("handball");
    expect(fieldsStyle("rugby")).toBe("");
    expect(fieldsStyle("nhl")).toBe("");
    expect(fieldsStyle("handball")).toContain("[data-sport=handball]");
    expect(fieldsStyle("fieldhockey")).toContain("--ky-surface:#2d79b8");
    expect(drawKyogijo({ sport: "handball", id: "h" })).toContain("[data-sport=handball]");
    expect(drawKyogijo({ sport: "rugby", id: "h" })).not.toContain("data-sport=handball");
    expect(drawKyogijo({ sport: "nhl", id: "h" })).not.toContain("handball");
    expect(KYOGIJO_STYLE).toContain("[data-sport=handball]");
  });

  it("have no field sport's words in them", () => {
    for (const sport of SPORTS.filter((one) => !isFieldSport(one))) {
      const svg = drawKyogijo({ sport, id: "o" });
      expect(svg, sport).not.toContain("ky-dirt".repeat(0) + "in-goal");
      expect(svg, sport).not.toContain("ky-f-");
    }
  });
});

describe("the looks", () => {
  it("paint a field sport from the look's base, and every pair of what is painted on what reads, in every look and both modes", () => {
    for (const look of LOOK_NAMES) {
      for (const mode of ["light", "dark"] as const) {
        for (const sport of FIELD_SPORTS) {
          const palette = lookPalette(look, mode, sport);
          expect(contrastOf(palette.ink, palette.apron), `${look} ${mode} ink`).toBeGreaterThanOrEqual(4.5);
          expect(contrastOf(palette.line, palette.surface), `${look} ${mode} ${sport} line on surface`).toBeGreaterThanOrEqual(3);
          expect(contrastOf(palette.line, palette.alt), `${look} ${mode} ${sport} line on mowing`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("are written into a drawing of a field sport, and a named look overrides the handball floor's own colours", () => {
    const svg = drawKyogijo({ sport: "handball", look: "blueprint", id: "l" });
    expect(svg).toContain('data-palette="blueprint"');
    expect(svg.indexOf("[data-sport=handball]")).toBeLessThan(svg.indexOf("data-palette=blueprint]"));
    expect(drawKyogijo({ sport: "rugby", look: "chalkboard", id: "l" })).toContain('data-palette="chalkboard"');
  });
});

describe("the features", () => {
  it("are listed for every field sport and name every element a plan draws", () => {
    for (const { sport, league } of every) {
      const plan = fieldPlan({ sport, league });
      const names = FEATURES[sport];
      expect(names, sport).toBeDefined();
      const used = new Set([...plan.shapes.map((shape) => shape.feature), ...plan.areas.map((area) => area.feature), "apron", plan.surfaceFeature ?? "turf"]);
      for (const feature of used) expect(names, `${sport} ${league}: ${feature}`).toContain(feature);
    }
  });

  it("colour a feature of a field sport's drawing, and refuse a name the sport does not have", () => {
    const svg = drawKyogijo({ sport: "rugby", league: "nrl", id: "f", featureColors: { "red-lines": "#00ff00" } });
    expect(svg).toContain("--ky-f-red-lines:#00ff00");
    expect(withClass(parseXml(svg), "ky-f-red-lines").length).toBeGreaterThan(0);
    expect(() => drawKyogijo({ sport: "rugby", featureColors: { "blue-lines": "#000" } })).toThrow(/Unknown feature "blue-lines" for rugby: use one of apron, turf, mowing, in-goal-left/);
  });
});

describe("the ranges", () => {
  it("crop every named range of every league, wide and tall, bare and with a score, to less than the whole", () => {
    for (const { sport, league } of every) {
      const whole = parseXml(drawKyogijo({ sport, league })).attrs.viewBox.split(" ").map(Number);
      for (const info of RANGES[sport]) {
        if (info.leagues !== undefined && !info.leagues.includes(league)) {
          expect(() => drawKyogijo({ sport, league, range: info.id }), `${league} ${info.id}`).toThrow(/has no range/);
          continue;
        }
        for (const orientation of ["landscape", "portrait"] as const) {
          const svg = drawKyogijo({ sport, league, range: info.id, orientation });
          const box = parseXml(svg).attrs.viewBox.split(" ").map(Number);
          const full = parseXml(drawKyogijo({ sport, league, orientation })).attrs.viewBox.split(" ").map(Number);
          expect(box[2] * box[3], `${sport} ${league} ${info.id}`).toBeLessThan(full[2] * full[3]);
          expect(drawKyogijo({ sport, league, range: info.id, orientation, ...game } as ScoreOptions)).toContain(`data-range="${info.id}"`);
        }
      }
      expect(whole.every(Number.isFinite)).toBe(true);
    }
  });

  it("have their names in both languages", () => {
    for (const sport of FIELD_SPORTS) {
      for (const info of RANGES[sport]) {
        expect(KYOGIJO_STRINGS.en.ranges.names[info.id], info.id).toMatch(/\S/);
        expect(KYOGIJO_STRINGS.ja.ranges.names[info.id], info.id).toMatch(/[぀-ヿ一-鿿]/u);
      }
    }
  });

  it("put the rugby 22 at one end of the field: it is the area between a try line and the 22-metre line, 22 m deep", () => {
    const plan = fieldPlan({ sport: "rugby" });
    const left = plan.ranges["twenty-two"] as { left: { x: number; w: number }; right: { x: number; w: number } };
    expect(left.left.w * 0.3048).toBeCloseTo(22, 2);
    expect(left.left.x * 0.3048).toBeCloseTo(10, 2);
  });
});

describe("the landmarks, the direction and the axes", () => {
  it("label the parts of every field sport's surface, every one with words in both languages", () => {
    for (const { sport, league } of every) {
      const plan = fieldPlan({ sport, league });
      expect(plan.marks.length, `${sport} ${league}`).toBeGreaterThanOrEqual(5);
      for (const mark of plan.marks) {
        expect(KYOGIJO_STRINGS.en.notes.names[mark.id], `${sport} ${league} ${mark.id}`).toMatch(/\S/);
        expect(KYOGIJO_STRINGS.ja.notes.names[mark.id], `${sport} ${league} ${mark.id}`).toMatch(/[぀-ヿ一-鿿]/u);
        // A label stands on the surface or at a goal just beyond it.
        expect(mark.x).toBeGreaterThanOrEqual(-10);
        expect(mark.x).toBeLessThanOrEqual(plan.length + 10);
      }
      const svg = drawKyogijo({ sport, league, landmarks: true });
      expect(svg).toContain("Labelled parts");
    }
  });

  it("draw the way each team attacks for the sports that have ends, and refuse it for a cricket ground", () => {
    for (const sport of ["lacrosse", "rugby", "afl", "gaelic", "fieldhockey", "handball"] as const) expect(drawKyogijo({ sport, direction: { home: "right", away: "left" }, ...game } as ScoreOptions)).toContain("attacks the right end");
    expect(() => drawKyogijo({ sport: "cricket", direction: { home: "right" } })).toThrow(/no ends to attack/);
    for (const sport of FIELD_SPORTS) expect(drawKyogijo({ sport, axes: {} })).toContain("Axes in the drawing's own numbers");
  });
});

describe("the frames", () => {
  it("fit the surface they are placed on: the centre is the middle, x runs to the right end, y up", () => {
    for (const sport of FIELD_SPORTS) {
      const frame = FRAMES[sport];
      expect(frame, sport).toBeDefined();
      const plan = fieldPlan({ sport });
      const size = { length: plan.length, width: plan.width, unit: "ft" as const };
      const [centre] = toSurface([[0, 0]], { from: sport, size });
      expect(centre[0]).toBeCloseTo(plan.length / 2, 6);
      expect(centre[1]).toBeCloseTo(plan.width / 2, 6);
      const unit = frame.unit === "yd" ? 3 : 1 / 0.3048;
      const [right] = toSurface([[plan.length / unit / 2, plan.width / unit / 2]], { from: sport, size });
      expect(right[0]).toBeCloseTo(plan.length, 6);
      expect(right[1]).toBeCloseTo(0, 6);
      const back = fromSurface([[plan.length, 0]], { to: sport, size })[0];
      expect(back[0]).toBeCloseTo(plan.length / unit / 2, 6);
    }
  });

  it("put a layer in a field sport's frame on its surface", () => {
    const svg = drawKyogijo({ sport: "rugby", id: "p", layers: [{ kind: "points", name: "tries", from: "rugby", data: [{ x: 50, y: 0 }, { x: -59, y: 34 }] }] });
    expect(withClass(parseXml(svg), "ky-pts").length).toBeGreaterThan(0);
  });
});

describe("the outline", () => {
  it("is the oval of an Australian football ground and the ellipse of a cricket ground, so that data outside them is cut", () => {
    const afl = outlineOf({ sport: "afl" });
    expect(afl.contains(afl.box.w / 2, afl.box.h / 2)).toBe(true);
    expect(afl.contains(2, 2)).toBe(false);
    expect(afl.contains(afl.box.w / 2, 0.2)).toBe(true);
    const cricket = outlineOf({ sport: "cricket" });
    expect(cricket.contains(2, 2)).toBe(false);
    expect(cricket.contains(cricket.box.w / 2, cricket.box.h / 2)).toBe(true);
    const nll = outlineOf({ sport: "lacrosse", league: "nll" });
    expect(nll.contains(1, 1)).toBe(false);
    expect(nll.contains(40, 40)).toBe(true);
    const rugby = outlineOf({ sport: "rugby" });
    expect(rugby.contains(1, 1)).toBe(true);
    expect(rugby.d).toMatch(/^M0 0/);
  });

  it("cuts a layer to it", () => {
    const svg = drawKyogijo({ sport: "afl", id: "c", layers: [{ kind: "points", data: [{ x: 262, y: 231 }, { x: 3, y: 3 }] }] });
    const root = parseXml(svg);
    expect(walk(root).filter((node) => node.name === "clipPath").length).toBeGreaterThan(0);
  });
});

describe("the zones", () => {
  it("count the thirds of a field and the pitch, the circle and the outfield of a cricket ground", () => {
    const thirds = drawKyogijo({ sport: "rugby", id: "z", layers: [{ kind: "zones", zones: "field-thirds", data: [{ x: 20, y: 100 }, { x: 200, y: 100 }, { x: 380, y: 100 }] }] });
    expect(thirds).toContain("Defensive third");
    const ground = drawKyogijo({ sport: "cricket", id: "z", layers: [{ kind: "zones", zones: "cricket-ground", data: [{ x: 225, y: 225 }, { x: 225, y: 150 }, { x: 225, y: 40 }] }] });
    expect(ground).toContain("Pitch");
    expect(ground).toContain("Inside the circle");
    expect(ground).toContain("Outfield");
    expect(drawKyogijo({ sport: "cricket", league: "mcc", id: "z", layers: [{ kind: "zones", zones: "cricket-ground", data: [{ x: 225, y: 225 }] }] })).not.toContain("Inside the circle");
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "zones", zones: "field-thirds", data: [{ x: 1, y: 1 }] }] })).toThrow(/is for lacrosse, rugby/);
  });
});

describe("the options of every drawing", () => {
  it("take a size in units: a length in metres and a length in feet are the same", () => {
    const metres = fieldPlan({ sport: "gaelic", units: "m", field: { length: 140, width: 85 } });
    const feet = fieldPlan({ sport: "gaelic", units: "ft", field: { length: 140 / 0.3048, width: 85 / 0.3048 } });
    expect(metres.length).toBeCloseTo(feet.length, 6);
    expect(metres.width).toBeCloseTo(feet.width, 6);
    expect(() => fieldPlan({ sport: "gaelic", field: { length: Number.NaN } })).toThrow(/above zero/);
    expect(() => fieldPlan({ sport: "gaelic", field: { length: -3 } })).toThrow(/above zero/);
  });

  it("take lines of another width and dashes, and colours, as every surface does", () => {
    const svg = drawKyogijo({ sport: "gaelic", id: "o", lineWidth: 2, lineDash: "dashed", lineOpacity: 0.5, colors: { surface: "#123456" } });
    expect(svg).toContain("stroke-dasharray");
    expect(svg).toContain("stroke-opacity");
    expect(svg).toContain("--ky-surface:#123456");
  });

  it("draw the goals as the options ask, or by a function of the caller's", () => {
    const some = (goals: "box" | "line" | "strip" | "none"): string => drawKyogijo({ sport: "handball", id: "g", goals });
    const classes = (goals: "box" | "line" | "strip" | "none"): string[] => walk(parseXml(some(goals))).map((node) => node.attrs.class ?? "");
    expect(classes("box")).toContain("ky-goal");
    expect(classes("strip")).toContain("ky-goal-strip");
    expect(classes("none").filter((name) => name.startsWith("ky-goal"))).toEqual([]);
    const seen: string[] = [];
    drawKyogijo({ sport: "fieldhockey", id: "g", goalMarkup: (goal) => (seen.push(`${goal.sport} ${goal.end}`), "<g/>") });
    expect(seen).toEqual(["fieldhockey left", "fieldhockey right"]);
  });

  it("are not asked for by a sport that has none: a `field` on another sport is ignored", () => {
    expect(drawKyogijo({ sport: "nhl", id: "i", field: { length: 5 } })).toBe(drawKyogijo({ sport: "nhl", id: "i" }));
  });
});

describe("the score of every field sport", () => {
  it("names the teams on the surface for the sports that paint them, and on a board for a cricket ground", () => {
    for (const sport of ["lacrosse", "rugby", "afl", "gaelic", "fieldhockey", "handball"] as const) {
      const text = walk(parseXml(drawKyogijo({ sport, ...game }))).filter((node) => node.name === "text").map((node) => node.text);
      expect(text, sport).toEqual(expect.arrayContaining(["HCG", "PRB", "3", "2"]));
    }
    expect(withClass(parseXml(drawKyogijo({ sport: "rugby", ...game })), "ky-zone-left").length).toBeGreaterThan(0);
    expect(withClass(parseXml(drawKyogijo({ sport: "afl", ...game })), "ky-zone-left")).toHaveLength(0);
  });
});

export type { FieldSport };
