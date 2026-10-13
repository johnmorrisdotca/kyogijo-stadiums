import { describe, expect, it } from "vitest";
import { describe as describeDrawing, drawBadge, drawKyogijo, statusLabel, statusText, winnerOf } from "./draw.ts";
import { SURFACE_UNITS, dimensionsOf, surfaceSize } from "./geometry-entry.ts";
import { SOCCER, SOCCER_PITCHES, SOCCER_PITCH_IDS, fullPitch, goalAreaWidth, penaltyAreaWidth, soccerPitchClass, soccerSpec } from "./surfaces/soccer-spec.ts";
import type { ScoreOptions } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const away = { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" };
const home = { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" };
const game = (extra: Partial<ScoreOptions> = {}): ScoreOptions => ({ sport: "soccer", away, home, status: "final", ...extra });
const parse = (svg: string): Node => parseXml(svg);
const box = (svg: Node): number[] => svg.attrs.viewBox.split(" ").map(Number);
const FEET = 3.280839895;
/** The bare pitch with no ground round it, so that coordinates are the pitch's own, in metres inside the scaling group. */
const bare = (extra: Partial<ScoreOptions> = {}): Node => parse(drawKyogijo({ sport: "soccer", margin: 0, id: "t", ...extra } as never));
const lines = (svg: Node): string[] => withClass(svg, "ky-line").map((n) => n.attrs.d ?? "");

describe("the Laws' figures", () => {
  it("are those of Law 1: areas of 5.5 and 16.5 m, a mark at 11 m, arcs and a centre circle of 9.15 m, corners of 1 m, a goal of 7.32 by 2.44 m", () => {
    expect([SOCCER.goalAreaReach, SOCCER.penaltyReach, SOCCER.spot, SOCCER.centreRadius, SOCCER.arcRadius, SOCCER.cornerRadius]).toEqual([5.5, 16.5, 11, 9.15, 9.15, 1]);
    expect([SOCCER.goalWidth, SOCCER.goalHeight, SOCCER.lineWidth]).toEqual([7.32, 2.44, 0.12]);
    expect(penaltyAreaWidth()).toBeCloseTo(40.32, 9);
    expect(goalAreaWidth()).toBeCloseTo(18.32, 9);
  });

  it("agree with the yards the Laws give beside them: 6, 18, 12, 10 and 8 yards, and 8 feet", () => {
    const yard = 0.9144;
    expect(Math.abs(6 * yard - SOCCER.goalAreaReach)).toBeLessThan(0.02);
    expect(Math.abs(18 * yard - SOCCER.penaltyReach)).toBeLessThan(0.05);
    expect(Math.abs(12 * yard - SOCCER.spot)).toBeLessThan(0.03);
    expect(Math.abs(10 * yard - SOCCER.centreRadius)).toBeLessThan(0.01);
    expect(Math.abs(8 * yard - SOCCER.goalWidth)).toBeLessThan(0.01);
    expect(Math.abs(8 * 0.3048 - SOCCER.goalHeight)).toBeLessThan(0.01);
  });

  it("put a pitch in a class: international, within the Laws, or outside them", () => {
    expect(soccerPitchClass(105, 68)).toBe("international");
    expect(soccerPitchClass(100, 64)).toBe("international");
    expect(soccerPitchClass(110, 75)).toBe("international");
    expect(soccerPitchClass(90, 45)).toBe("within-laws");
    expect(soccerPitchClass(120, 90)).toBe("within-laws");
    expect(soccerPitchClass(111, 68)).toBe("within-laws");
    expect(soccerPitchClass(89, 60)).toBe("outside-laws");
    expect(soccerPitchClass(121, 60)).toBe("outside-laws");
    expect(soccerPitchClass(100, 100)).toBe("outside-laws");
    expect(soccerPitchClass(Number.NaN, 60)).toBe("outside-laws");
  });
});

describe("the pitches", () => {
  it("have a preset for each id, every one longer than it is wide, with its markings inside it", () => {
    expect(Object.keys(SOCCER_PITCHES).sort()).toEqual([...SOCCER_PITCH_IDS].sort());
    for (const id of SOCCER_PITCH_IDS) {
      const p = SOCCER_PITCHES[id];
      expect(p.id).toBe(id);
      expect(p.length, id).toBeGreaterThan(p.width);
      expect(p.penaltyWidth, id).toBeLessThan(p.width);
      expect(p.penaltyDepth * 2, id).toBeLessThan(p.length);
      expect(p.centreRadius * 2, id).toBeLessThan(p.width);
      expect(p.goalWidth, id).toBeLessThan(p.penaltyWidth);
    }
  });

  it("are the MLS's least size of 110 by 70 yards and the NCAA's best of 120 by 75 yards", () => {
    expect(SOCCER_PITCHES.mls.length).toBeCloseTo(100.584, 3);
    expect(SOCCER_PITCHES.mls.width).toBeCloseTo(64.008, 3);
    expect(SOCCER_PITCHES.ncaa.length).toBeCloseTo(109.728, 3);
    expect(SOCCER_PITCHES.ncaa.width).toBeCloseTo(68.58, 3);
    expect(soccerPitchClass(SOCCER_PITCHES.mls.length, SOCCER_PITCHES.mls.width)).toBe("international");
    expect(soccerPitchClass(SOCCER_PITCHES.ncaa.length, SOCCER_PITCHES.ncaa.width)).toBe("international");
  });

  it("are the international pitch of 105 by 68 m, and the least and the most the Laws allow", () => {
    expect([SOCCER_PITCHES.fifa.length, SOCCER_PITCHES.fifa.width]).toEqual([105, 68]);
    expect([SOCCER_PITCHES["law-min"].length, SOCCER_PITCHES["law-min"].width]).toEqual([90, 45]);
    expect([SOCCER_PITCHES["law-max"].length, SOCCER_PITCHES["law-max"].width]).toEqual([120, 90]);
    for (const id of ["fifa", "uefa", "law-min", "law-max"] as const) expect(SOCCER_PITCHES[id].format).toBe("11");
  });

  it("are futsal's: 40 by 20 m, areas of quarter circles of 6 m, marks at 6 and 10 m, a centre circle of 3 m, a goal of 3 by 2 m", () => {
    const f = SOCCER_PITCHES.futsal;
    expect([f.length, f.width, f.penaltyDepth, f.spot, f.secondSpot, f.centreRadius, f.goalWidth, f.goalHeight]).toEqual([40, 20, 6, 6, 10, 3, 3, 2]);
    expect(f.area).toBe("arcs");
    expect(f.areaLine).toBe(3.16);
    expect(f.lineWidth).toBe(0.08);
  });

  it("take a size in metres, yards or feet, with the Laws' markings", () => {
    const yards = soccerSpec({ length: 110, width: 70, unit: "yd" });
    expect(yards.length).toBeCloseTo(100.584, 3);
    expect(yards.width).toBeCloseTo(64.008, 3);
    expect(yards.penaltyDepth).toBe(16.5);
    expect(soccerSpec({ length: 328, width: 213, unit: "ft" }).length).toBeCloseTo(99.97, 1);
    expect(soccerSpec({ length: 100, width: 64 }).id).toBe("custom");
    expect(soccerPitchClass(yards.length, yards.width)).toBe("international");
  });

  it("hold the markings of a small custom pitch to what fits, and make a bad request the international pitch", () => {
    const small = soccerSpec({ length: 40, width: 25 });
    expect(small.penaltyWidth).toBeLessThan(25);
    expect(small.penaltyDepth * 2).toBeLessThan(40);
    expect(small.centreRadius * 2).toBeLessThan(25);
    for (const bad of [undefined, "no-such-pitch", { length: -1, width: 10 }, { length: Number.NaN, width: 10 }, { length: 1e9, width: 10 }, 5, null, { length: "1", width: "2" }]) expect(soccerSpec(bad as never).id, JSON.stringify(bad)).toBe("fifa");
    expect(soccerSpec("toString").id).toBe("fifa");
  });

  it("make a full pitch of any size with the Laws' areas", () => {
    const p = fullPitch("x", "X", 100, 64);
    expect([p.penaltyDepth, p.goalAreaDepth, p.spot]).toEqual([16.5, 5.5, 11]);
  });
});

describe("the soccer pitch", () => {
  it("is well-formed SVG, 105 by 68 m which is 344.49 by 223.1 feet with no ground round it", () => {
    const svg = bare();
    expect(svg.name).toBe("svg");
    expect(svg.attrs["data-sport"]).toBe("soccer");
    expect(box(svg)).toEqual([0, 0, 344.49, 223.1]);
    expect(box(svg)[2]).toBeCloseTo(105 * FEET, 1);
    expect(box(svg)[3]).toBeCloseTo(68 * FEET, 1);
  });

  it("has 15 feet of ground round it by default, and takes the margin it is given", () => {
    expect(box(parse(drawKyogijo({ sport: "soccer" })))).toEqual([-15, -15, 374.49, 253.1]);
    expect(box(parse(drawKyogijo({ sport: "soccer", margin: 6 })))[0]).toBe(-6);
  });

  it("draws the touchlines and goal lines, the halfway line and the centre circle of 9.15 m with its mark", () => {
    const svg = bare();
    const rect = withClass(svg, "ky-line").find((n) => n.name === "rect")!;
    expect(rect.attrs).toMatchObject({ x: "0", y: "0", width: "105", height: "68" });
    expect(lines(svg)).toContain("M52.5 0V68");
    const circle = withClass(svg, "ky-line").find((n) => n.name === "circle")!;
    expect(circle.attrs).toMatchObject({ cx: "52.5", cy: "34", r: "9.15" });
    expect(withClass(svg, "ky-fill-line").some((n) => n.attrs.cx === "52.5" && n.attrs.cy === "34")).toBe(true);
  });

  it("draws both penalty areas 16.5 m deep and 40.32 m wide, and both goal areas 5.5 m deep and 18.32 m wide", () => {
    const d = lines(bare()).join(" ");
    expect(d).toContain("M0 13.84H16.5V54.16H0");
    expect(d).toContain("M105 13.84H88.5V54.16H105");
    expect(d).toContain("M0 24.84H5.5V43.16H0");
    expect(d).toContain("M105 24.84H99.5V43.16H105");
  });

  it("puts the penalty marks 11 m from the goal lines and draws the arcs of 9.15 m outside the areas", () => {
    const svg = bare();
    const marks = withClass(svg, "ky-fill-line").filter((n) => n.attrs.cy === "34" && n.attrs.cx !== "52.5").map((n) => n.attrs.cx);
    expect(marks).toEqual(["11", "94"]);
    // The arc runs from the penalty line to itself, 9.15 m from the mark: its ends are sqrt(9.15² − 5.5²) = 7.31 m either side.
    const d = lines(svg).join(" ");
    expect(d).toContain("M16.5 26.69A9.15 9.15 0 0 1 16.5 41.31");
    expect(d).toContain("M88.5 26.69A9.15 9.15 0 0 1 88.5 41.31");
    expect(Math.hypot(16.5 - 11, 34 - 26.69)).toBeCloseTo(9.15, 2);
  });

  it("has four corner arcs of 1 m and the marks off the field 9.15 m from them", () => {
    const d = lines(bare());
    const corners = d.find((x) => x.startsWith("M1 0A1 1"))!;
    expect((corners.match(/A1 1 0 0 1/g) ?? []).length).toBe(4);
    expect(d.join(" ")).toContain("M0 10.15h-0.4");
    expect(d.join(" ")).toContain("M10.15 0v-0.4");
  });

  it("draws lines at the Laws' width when told to, and thicker otherwise", () => {
    expect(withClass(bare({ exactLines: true }), "ky-line")[0].attrs["stroke-width"]).toBe("0.12");
    expect(Number(withClass(bare(), "ky-line")[0].attrs["stroke-width"])).toBeGreaterThan(0.12);
  });

  it("leaves out the marks off the field, the flags and the small markings in the simple detail", () => {
    const simple = bare({ detail: "simple" });
    expect(lines(simple).join(" ")).not.toContain("M0 10.15h-0.4");
    expect(withClass(simple, "ky-flag")).toHaveLength(0);
    expect(withClass(bare(), "ky-flag")).toHaveLength(4);
    expect(withClass(bare({ cornerFlags: false }), "ky-flag")).toHaveLength(0);
    expect(withClass(bare({ detail: "simple", cornerFlags: true }), "ky-flag")).toHaveLength(4);
  });

  it("draws a pitch of any size within the Laws, the markings the same", () => {
    const svg = bare({ pitch: { length: 100, width: 64 } });
    expect(box(svg)[2]).toBeCloseTo(100 * FEET, 1);
    expect(lines(svg)).toContain("M50 0V64");
    expect(lines(svg).join(" ")).toContain("M0 11.84H16.5V52.16H0");
  });
});

describe("the goals", () => {
  const goals = (style?: "box" | "line" | "strip" | "none"): Node => bare({ goals: style });
  it("are boxes behind the goal lines by default: 7.32 m between the posts, a net 2 m deep, two posts each", () => {
    const svg = goals();
    expect(withClass(svg, "ky-goal").some((n) => n.attrs.d === "M0 30.34h-2v7.32h2")).toBe(true);
    expect(withClass(svg, "ky-goal").some((n) => n.attrs.d === "M105 30.34h2v7.32h-2")).toBe(true);
    expect(withClass(svg, "ky-post-end").filter((n) => n.attrs.cx === "0" && (n.attrs.cy === "30.34" || n.attrs.cy === "37.66"))).toHaveLength(2);
    expect(withClass(svg, "ky-goal-net")).toHaveLength(2);
  });

  it("can be a line on the goal line between the posts, a strip, or nothing", () => {
    expect(withClass(goals("line"), "ky-goal").map((n) => n.attrs.d)).toEqual(["M0 30.34V37.66", "M105 30.34V37.66"]);
    expect(withClass(goals("strip"), "ky-goal-strip").map((n) => n.attrs.d)).toEqual(["M0 30.34h-0.6v7.32h0.6z", "M105 30.34h0.6v7.32h-0.6z"]);
    const none = goals("none");
    expect(withClass(none, "ky-goal")).toHaveLength(0);
    expect(withClass(none, "ky-goal-strip")).toHaveLength(0);
  });

  it("ignore a style that is not one", () => {
    expect(drawKyogijo({ sport: "soccer", id: "g", goals: "net" as never })).toBe(drawKyogijo({ sport: "soccer", id: "g" }));
  });
});

describe("the mown stripes", () => {
  const stripe = (o: Partial<ScoreOptions>): Node | undefined => withClass(bare(o), "ky-stripe")[0];
  const count = (d: string): number => (d.match(/M/g) ?? []).length;

  it("are 19 bands across the pitch by default, nine of them cut, so that both ends are alike", () => {
    const d = stripe({})!.attrs.d;
    expect(count(d)).toBe(9);
    expect(d.startsWith("M5.53 0h5.53v68")).toBe(true);
  });

  it("come in bands wide and narrow, lengthwise, in checks and on the diagonal", () => {
    expect(count(stripe({ stripePattern: "wide" })!.attrs.d)).toBe(4);
    expect(count(stripe({ stripePattern: "narrow" })!.attrs.d)).toBe(19);
    expect(count(stripe({ stripePattern: "lengthwise" })!.attrs.d)).toBe(5);
    expect(count(stripe({ stripePattern: "checks" })!.attrs.d)).toBe((19 * 11 - 1) / 2);
    const diagonal = bare({ stripePattern: "diagonal" });
    expect(withClass(diagonal, "ky-stripe")[0].attrs["clip-path"]).toBe("url(#t-turf)");
    expect(walk(diagonal).filter((n) => n.name === "clipPath").map((n) => n.attrs.id)).toEqual(["t-turf"]);
  });

  it("are not drawn with stripes off, pattern none, or on a futsal court", () => {
    expect(stripe({ stripes: false })).toBeUndefined();
    expect(stripe({ stripePattern: "none" })).toBeUndefined();
    expect(stripe({ pitch: "futsal" })).toBeUndefined();
  });

  it("fall back to the bands for a pattern that is not one", () => {
    expect(drawKyogijo({ sport: "soccer", id: "s", stripePattern: "plaid" as never })).toBe(drawKyogijo({ sport: "soccer", id: "s" }));
  });
});

describe("a half pitch", () => {
  it("shows the left half to the halfway line, or the right, wide or tall", () => {
    const left = box(bare({ half: "left" }));
    expect(left[0]).toBe(0);
    expect(left[2]).toBeCloseTo((52.5 + 0.35) * FEET, 1);
    const right = box(bare({ half: "right" }));
    expect(right[0]).toBeCloseTo((52.5 - 0.35) * FEET, 1);
    expect(right[0] + right[2]).toBeCloseTo(105 * FEET, 1);
    const tall = box(bare({ half: "left", orientation: "portrait" }));
    expect(tall[2]).toBeCloseTo(left[3], 1);
    expect(tall[3]).toBeCloseTo(left[2], 1);
    expect(tall[2]).toBeGreaterThan(tall[3]);
  });

  it("is ignored when the drawing has teams, which always lie on the whole pitch", () => {
    expect(box(parse(drawKyogijo(game({ half: "left", id: "h" }))))).toEqual(box(parse(drawKyogijo(game({ id: "h" })))));
    expect(box(parse(drawKyogijo(game({ half: "left", size: "compact", id: "h" }))))[2]).toBe(box(parse(drawKyogijo(game({ size: "compact", id: "h" }))))[2]);
  });

  it("says so in its description", () => {
    expect(describeDrawing({ sport: "soccer", half: "left" }).description).toContain("Half of it is shown.");
    expect(describeDrawing({ sport: "soccer" }).description).not.toContain("Half of it");
  });
});

describe("futsal and the small-sided pitches", () => {
  it("draw futsal's areas as two quarter circles of 6 m and a line of 3.16 m, the marks at 6 and 10 m", () => {
    const svg = bare({ pitch: "futsal" });
    const d = lines(svg).join(" ");
    // The left area: a quarter circle round each post to the line 6 m out, 3.16 m long.
    expect(d).toContain("M0 2.42A6 6 0 0 1 6 8.42V11.58A6 6 0 0 1 0 17.58");
    expect(d).toContain("M40 2.42A6 6 0 0 0 34 8.42V11.58A6 6 0 0 0 40 17.58");
    expect(d).toContain("M5.25 -0.05v-0.4");
    expect(d).toContain("M30 19.6v0.8");
    const marks = withClass(svg, "ky-fill-line").filter((n) => n.attrs.cy === "10").map((n) => n.attrs.cx);
    expect(marks.sort((a, b) => Number(a) - Number(b))).toEqual(["6", "10", "20", "30", "34"]);
    expect(withClass(svg, "ky-pitch")[0].attrs.class).toContain("ky-pitch-futsal");
    expect(box(svg)[2]).toBeCloseTo(40 * FEET, 1);
  });

  it("draw the FA's 5- and 7-a-side pitches with a semicircle of 6 m round the middle of each goal line, and the 9-a-side's with a box", () => {
    for (const id of ["5-a-side", "7-a-side"] as const) {
      const svg = bare({ pitch: id });
      const w = SOCCER_PITCHES[id].width;
      expect(lines(svg).join(" "), id).toContain(`M0 ${Math.round((w / 2 - 6) * 100) / 100}A6 6 0 0 1 0 ${Math.round((w / 2 + 6) * 100) / 100}`);
      expect(box(svg)[2]).toBeCloseTo(SOCCER_PITCHES[id].length * FEET, 1);
      expect(withClass(svg, "ky-fill-line").some((n) => n.attrs.cx === "6")).toBe(true);
    }
    expect(lines(bare({ pitch: "9-a-side" })).some((d) => /^M0 [\d.]+H11V[\d.]+H0/.test(d))).toBe(true);
  });

  it("give the FA's goals: 12 by 6 feet for 5- and 7-a-side, 16 by 7 feet for 9-a-side", () => {
    expect(SOCCER_PITCHES["5-a-side"].goalWidth).toBeCloseTo(3.6576, 4);
    expect(SOCCER_PITCHES["7-a-side"].goalHeight).toBeCloseTo(1.8288, 4);
    expect(SOCCER_PITCHES["9-a-side"].goalWidth).toBeCloseTo(4.8768, 4);
    expect(SOCCER_PITCHES["9-a-side"].goalHeight).toBeCloseTo(2.1336, 4);
  });

  it("name futsal a court in the title and the description", () => {
    const { title, description } = describeDrawing({ sport: "soccer", pitch: "futsal" });
    expect(title).toBe("Futsal court");
    expect(description).toContain("a futsal court, 40 by 20 metres");
    expect(describeDrawing({ sport: "soccer", pitch: "futsal", language: "ja" }).title).toBe("フットサルのコート");
  });
});

describe("a soccer score", () => {
  it("puts the teams at their ends, in their colours, and the score at the middle", () => {
    const svg = parse(drawKyogijo(game({ competition: "Cup Final", date: "May 24", id: "g" })));
    expect(withClass(svg, "ky-zone-left")).toHaveLength(1);
    expect(withClass(svg, "ky-zone-right")).toHaveLength(1);
    expect(withClass(svg, "ky-zone-left")[0].attrs).toMatchObject({ x: "0", y: "13.84", width: "16.5", height: "40.32" });
    const banners = withClass(svg, "ky-banner");
    expect(banners.map((n) => n.attrs["data-team"])).toEqual(["away", "home"]);
    expect(banners[0].attrs.transform).toContain("rotate(-90)");
    expect(banners[1].attrs.transform).toContain("rotate(90)");
    const text = walk(svg).filter((n) => n.name === "text").map((n) => n.text);
    expect(text).toContain("3");
    expect(text).toContain("2");
    expect(text).toContain("HCG");
    expect(text).toContain("Cup Final");
    expect(text).toContain("Final · May 24");
    expect(text.join(" ")).toContain("BISON");
    expect(svg.attrs["data-winner"]).toBe("away");
  });

  it("draws the teams over the pitch's lines, so that the names are whole", () => {
    const svg = parse(drawKyogijo(game({ id: "g" })));
    const groups = svg.children.find((n) => n.attrs.class === "ky-surface-group")!.children.map((n) => n.attrs.class ?? n.name);
    expect(groups.findIndex((c) => c.includes("ky-banner"))).toBeGreaterThan(groups.findIndex((c) => c === "ky-pitch ky-pitch-11"));
    const lineGroup = svg.children.find((n) => n.attrs.class === "ky-surface-group")!.children;
    const iBanner = lineGroup.findIndex((n) => (n.attrs.class ?? "").includes("ky-banner"));
    const iLines = lineGroup.findIndex((n) => n.name === "g" && n.attrs.class === undefined);
    expect(iBanner).toBeGreaterThan(iLines);
  });

  it("lies tall, the teams top and bottom and every word upright", () => {
    const wide = box(parse(drawKyogijo(game({ id: "g" }))));
    const tall = box(parse(drawKyogijo(game({ id: "g", orientation: "portrait" }))));
    expect(tall[2]).toBeCloseTo(wide[3], 1);
    expect(tall[3]).toBeCloseTo(wide[2], 1);
    const svg = parse(drawKyogijo(game({ id: "g", orientation: "portrait" })));
    expect(withClass(svg, "ky-banner")[0].attrs.transform).toContain("rotate(-90)");
    expect(withClass(svg, "ky-plate")[0].attrs.transform).toContain("rotate(-90)");
  });

  it("makes a compact card and a badge like every sport", () => {
    expect(withClass(parse(drawKyogijo(game({ size: "compact" }))), "ky-strip")).toHaveLength(1);
    expect(box(parse(drawBadge(game())))).toEqual([0, 0, 440, 64]);
    expect(drawBadge(game())).toContain("M-18 -10H18V10H-18Z");
  });

  it("fits a name of any length, and fills in a team that has a logo or none", () => {
    const long = { ...home, name: "The Very Long Name of the Prairie Ridge Association Football Club" };
    expect(() => drawKyogijo(game({ home: long }))).not.toThrow();
    expect(drawKyogijo(game({ home: { ...home, logo: "https://example.com/bison.svg" } }))).toContain("https://example.com/bison.svg");
  });

  it("stays within its size budget", () => {
    expect(drawKyogijo(game()).length).toBeLessThan(18_000);
    expect(drawKyogijo({ sport: "soccer" }).length).toBeLessThan(15_000);
  });
});

describe("the end of a soccer game", () => {
  const level = (extra: Partial<ScoreOptions> = {}): ScoreOptions => game({ away: { ...away, score: 2 }, home: { ...home, score: 2 }, ...extra });

  it("says after extra time and on penalties", () => {
    expect(statusLabel("final-aet")).toBe("Final/AET");
    expect(statusLabel("final-pens")).toBe("Final/Pens");
    expect(statusLabel("extra-time")).toBe("Extra time");
    expect(statusLabel("penalties")).toBe("Penalties");
    expect(statusLabel("final-aet", "ja")).toBe("試合終了（延長戦）");
    expect(statusLabel("final-pens", "ja")).toBe("試合終了（PK戦）");
    expect(statusLabel("extra-time", "ja")).toBe("延長戦");
  });

  it("writes the shoot-out beside the status in the order of the sides: away first, or home first when home is on the left", () => {
    const pens = level({ status: "final-pens", away: { ...away, score: 2, penalties: 4 }, home: { ...home, score: 2, penalties: 2 } });
    expect(statusText(pens)).toBe("Final · 4-2 pens");
    expect(statusText({ ...pens, homeSide: "left" })).toBe("Final · 2-4 pens");
    expect(statusText({ ...pens, language: "ja" } as never, "ja")).toBe("試合終了 · PK戦 4-2");
    expect(statusText({ ...pens, status: "final-aet" })).toBe("Final/AET · 4-2 pens");
    expect(statusText(level({ status: "final-pens" }))).toBe("Final/Pens");
    expect(statusText(level({ status: "final-aet" }))).toBe("Final/AET");
  });

  it("puts it on the plate's foot and in the badge", () => {
    const o = level({ status: "final-pens", date: "May 24", away: { ...away, score: 2, penalties: 4 }, home: { ...home, score: 2, penalties: 2 } });
    const text = walk(parse(drawKyogijo(o))).filter((n) => n.name === "text").map((n) => n.text);
    expect(text).toContain("Final · 4-2 pens · May 24");
    expect(walk(parse(drawBadge(o))).some((n) => n.name === "text" && n.text === "Final · 4-2 pens")).toBe(true);
  });

  it("names the winner of a level game by its shoot-out, and none when the shoot-out is level or missing", () => {
    const pens = (a: number | string | undefined, h: number | string | undefined): ScoreOptions => level({ status: "final-pens", away: { ...away, score: 2, penalties: a }, home: { ...home, score: 2, penalties: h } });
    expect(winnerOf(pens(4, 2))).toBe("away");
    expect(winnerOf(pens(3, 5))).toBe("home");
    expect(winnerOf(pens(3, 3))).toBe("none");
    expect(winnerOf(pens(3, undefined))).toBe("none");
    expect(winnerOf(pens("x", 2))).toBe("none");
    expect(winnerOf({ ...pens(4, 2), status: "live" })).toBe("none");
    expect(winnerOf({ ...pens(4, 2), status: "live", winner: "leader" })).toBe("away");
    expect(winnerOf(level({ status: "final-aet" }))).toBe("none");
    expect(parse(drawKyogijo(pens(4, 2))).attrs["data-winner"]).toBe("away");
  });

  it("says who won on penalties, and still says who won a game decided on goals", () => {
    const o = level({ status: "final-pens", away: { ...away, score: 2, penalties: 2 }, home: { ...home, score: 2, penalties: 4 } });
    const { title, description } = describeDrawing(o);
    expect(title).toBe("Harbour City Gulls 2, Prairie Ridge Bison 2, Final · 2-4 pens");
    expect(description).toContain("Prairie Ridge Bison won 4-2 on penalties.");
    expect(description).not.toContain("The game is level.");
    expect(describeDrawing(game()).description).toContain("Harbour City Gulls won.");
    expect(describeDrawing({ ...o, language: "ja" }).description).toContain("Prairie Ridge BisonがPK戦を4-2で制しました。");
    expect(describeDrawing(level({ status: "final-aet" })).description).toContain("The game is level.");
  });
});

describe("the words of a soccer pitch", () => {
  it("title a bare pitch and describe it with its size, in English and in Japanese", () => {
    const en = describeDrawing({ sport: "soccer" });
    expect(en.title).toBe("Soccer pitch");
    expect(en.description).toContain("a soccer pitch, 105 by 68 metres");
    const ja = describeDrawing({ sport: "soccer", language: "ja", pitch: { length: 100.55, width: 64, unit: "m" } });
    expect(ja.title).toBe("サッカーのピッチ");
    expect(ja.description).toContain("100.6m×64m");
  });
});

describe("soccer in any unit", () => {
  it("keeps the Laws' unit, metres, and gives the pitch's size and its dimensions in any other", () => {
    expect(SURFACE_UNITS.soccer).toBe("m");
    expect(surfaceSize("soccer")).toEqual({ length: 105, width: 68, unit: "m" });
    expect(surfaceSize("soccer", "ft").length).toBeCloseTo(344.49, 2);
    expect(surfaceSize("soccer", "yd").width).toBeCloseTo(74.37, 2);
    expect(dimensionsOf("soccer").penaltyReach).toBe(16.5);
    expect(dimensionsOf("soccer", "yd").penaltyReach).toBeCloseTo(18.04, 2);
    expect(dimensionsOf("soccer", "ft").goalWidth).toBeCloseTo(24.02, 2);
    expect(dimensionsOf("soccer", "cm").limits.length.map(Math.round)).toEqual([9000, 12000]);
  });

  it("takes the margin and a size without a unit in the options' units", () => {
    expect(box(parse(drawKyogijo({ sport: "soccer", margin: 5, units: "m" })))[0]).toBeCloseTo(-5 * FEET, 1);
    const yards = parse(drawKyogijo({ sport: "soccer", margin: 0, units: "yd", pitch: { length: 110, width: 70 } }));
    expect(box(yards)[2]).toBeCloseTo(330, 1);
    expect(box(parse(drawKyogijo({ sport: "soccer", margin: 0, units: "yd", pitch: { length: 110, width: 70, unit: "m" } })))[2]).toBeCloseTo(110 * FEET, 1);
    expect(() => drawKyogijo({ sport: "soccer", units: "mile" as never })).toThrow(/Unknown units/);
  });
});
