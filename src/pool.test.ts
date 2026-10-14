// The pools, held to World Aquatics' Competition Regulations (in force as from 25 June 2025): Part Two, Article 16 (the swimming pool; FR 2 of the Facilities Rules before it), Part Four, Article 13 and Appendix 2
// (diving), Part Six, Article 18 and Appendix 4 (water polo) and Part Seven, Article 27 (artistic swimming). Each figure is the rule's, read off the drawing; the rule numbers are in docs/sources.md.
import { describe, expect, it } from "vitest";
import { splitsChart } from "./charts.pool.ts";
import { describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { FRAMES, toSurface } from "./frames.ts";
import "./frames.providers.ts";
import { dimensionsOf, FEET_PER_METRE, surfaceSize } from "./geometry.ts";
import { buildZoneSet } from "./heat.zones.ts";
import { outlineOf } from "./outline.ts";
import { POOL_SPORTS, artisticPlan, divePlan, isPoolSport, laneWidths, poolBox, poolPlan, poloPlan, ropeColour, swimPlan, venueLayout } from "./pool.ts";
import { ARTISTIC, DIVING, SWIMMING, WATER_POLO } from "./pool.figures.ts";
import { formatTime, parseTime, racePlan } from "./pool.race.ts";
import { alongPool, distanceAt, progressOf, raceTimeline } from "./pool.replay.ts";
import { drawFrame } from "./replay.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import type { PoolRace, Swimmer } from "./pool.types.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const FT = FEET_PER_METRE;
const parse = (svg: string): Node => parseXml(svg);
/** A pool as drawn wide, with true widths and no ground, so that every figure is where the rules put it. */
const pool = (extra: Partial<SurfaceOptions> = {}, sport: SurfaceOptions["sport"] = "swimming"): Node => parse(drawKyogijo({ sport, orientation: "landscape", margin: 0, exactLines: true, id: "t", style: "none", ...extra } as SurfaceOptions));
const numbers = (d: string): number[] => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const near = (a: number, b: number, places = 1): void => expect(a).toBeCloseTo(b, places);
/** The number of subpaths of a path. */
const subpaths = (d: string): number => (d.match(/M/g) ?? []).length;

const flag = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="20" fill="#c2410c"/></svg>';
const swimmers = (n = 8): Swimmer[] =>
  Array.from({ length: n }, (_, i) => ({ lane: i + 1, name: `Swimmer ${i + 1}`, abbr: "AUR", flag, splits: [25 + i * 0.3, 52 + i * 0.5, 79.5 + i * 0.7, 107 + i], reaction: 0.6 + i * 0.01, seed: 108.37 + i }));
const race = (extra: Partial<PoolRace> = {}): PoolRace => ({ event: "Men's 200 m freestyle", distance: 200, swimmers: swimmers(), ...extra });

describe("the figures of the rules", () => {
  it("CR 16.1.1: 50.000 and 25.000 m between the touch panels; 16.2.15: lane markings 46 m and 21 m long, ending 2 m from the wall in a cross line 1 m long", () => {
    expect([SWIMMING.longCourse, SWIMMING.shortCourse]).toEqual([50, 25]);
    expect(SWIMMING.laneLine).toMatchObject({ longLength: 46, shortLength: 21, endGap: 2, cross: 1 });
    expect(SWIMMING.laneLine.width).toBeGreaterThanOrEqual(0.2);
    expect(SWIMMING.laneLine.width).toBeLessThanOrEqual(0.3);
    expect(SWIMMING.longCourse - 2 * SWIMMING.laneLine.endGap).toBe(SWIMMING.laneLine.longLength);
    expect(SWIMMING.shortCourse - 2 * SWIMMING.laneLine.endGap).toBe(SWIMMING.laneLine.shortLength);
  });

  it("CR 16.1.10, 16.1.12, 16.2.8, 16.3.4: flags 5 m from the walls, 1.8 m up; false start rope 15 m from the start, 1.2 m up; blocks 0.5 by 0.6 m; panels 2.4 by 0.9 m", () => {
    expect(SWIMMING.flags).toEqual({ at: 5, height: 1.8, side: 0.4, apart: 0.25 });
    expect(SWIMMING.falseStart).toEqual({ at: 15, height: 1.2 });
    expect([SWIMMING.block.width, SWIMMING.block.length]).toEqual([0.5, 0.6]);
    expect([SWIMMING.block.heightLeast, SWIMMING.block.heightMost]).toEqual([0.5, 0.75]);
    expect(SWIMMING.pad).toMatchObject({ width: 2.4, height: 0.9, above: 0.3, below: 0.6 });
    expect(SWIMMING.pad.above + SWIMMING.pad.below).toBeCloseTo(SWIMMING.pad.height, 10);
  });

  it("CR 16.1.4 and 16.2.4: 1.35 m deep from 1 to 6 m from a wall with blocks; 2.5 m at the Olympic Games, 2.0 m for the 25 m World Championships, 3 m shared with artistic swimming", () => {
    expect(SWIMMING.depth).toMatchObject({ least: 1, atBlocks: 1.35, blocksFrom: 1, blocksTo: 6, olympic: 2.5, shortWorld: 2, shared: 3 });
    expect(SWIMMING.poolsApart).toBe(8);
    expect(SWIMMING.poolsApartPreferred).toBe(10);
  });

  it("Part Six: a water polo field of 25 by 20 m, 3 m between the posts, the crossbar 0.9 m up, a re-entry area of 2.0 by 1.08 m, platforms 1 m wide", () => {
    expect([WATER_POLO.length, WATER_POLO.width]).toEqual([25, 20]);
    expect(WATER_POLO.goal).toMatchObject({ width: 3, crossbarHeight: 0.9, netClear: 0.3 });
    expect(WATER_POLO.reEntry).toMatchObject({ length: 2, depth: 1.08 });
    expect([WATER_POLO.twoMetre, WATER_POLO.fiveMetre, WATER_POLO.sixMetre]).toEqual([2, 5, 6]);
    expect(WATER_POLO.half).toBe(WATER_POLO.length / 2);
    expect(WATER_POLO.platform.width).toBe(1);
  });

  it("Part Four, Appendix 2: the springboard 4.88 by 0.50 m, the platforms' lengths and widths, the distances A to D, H = 5 m under every board at most", () => {
    expect(DIVING.springboard).toEqual({ length: 4.88, width: 0.5 });
    expect(DIVING.platforms["10"]).toMatchObject({ length: 6, height: 10 });
    expect(DIVING.platforms["10"].width[0]).toBe(3);
    expect(DIVING.platforms["5"].width).toEqual([2.9, 2.9]);
    expect(DIVING.platforms["7.5"].width).toEqual([2, 2]);
    expect(DIVING.A.platform10).toEqual([1.5, 1.5]);
    expect(DIVING.A.springboard3).toEqual([2.22, 2.22]);
    expect(DIVING.B.platform10[0]).toBe(5.75);
    expect(DIVING.C.platform75[0]).toBe(2.75);
    expect(DIVING.D.platform10[0]).toBe(13.5);
    expect(DIVING.H.platform10).toEqual([5, 5]);
    expect(DIVING.lines).toMatchObject({ length: 21, apart: 2.5 });
  });

  it("Part Seven: 30 by 20 m, 3 m deep; the least is 25 by 15 m with 12 by 12 m of it 3 m deep", () => {
    expect(ARTISTIC.olympic).toEqual({ length: 30, width: 20, depth: 3 });
    expect(ARTISTIC.minimum).toMatchObject({ length: 25, width: 15, deepLength: 12, deepWidth: 12, deepDepth: 3, depth: 2 });
    expect(ARTISTIC.start.heightOlympic).toBe(0.7);
    expect(ARTISTIC.judges).toMatchObject({ height: 0.6, fromEdge: 2 });
  });

  it("are given in any unit by dimensionsOf, in metres by default, and surfaceSize gives each pool's size", () => {
    expect(dimensionsOf("swimming").longCourse).toBe(50);
    near(dimensionsOf("swimming", "ft").longCourse, 50 * FT, 3);
    expect(dimensionsOf("diving").platforms["10"].height).toBe(10);
    expect(dimensionsOf("waterpolo").length).toBe(25);
    near(dimensionsOf("artisticswimming", "cm").olympic.length, 3000, 6);
    expect(surfaceSize("swimming")).toEqual({ length: 50, width: 25, unit: "m" });
    near(surfaceSize("waterpolo").length, 25.6, 6);
    expect(surfaceSize("artisticswimming")).toEqual({ length: 30, width: 20, unit: "m" });
  });
});

describe("the swimming pool's lanes", () => {
  it("is 25 m wide for eight lanes of 2.5 m with spaces of 2.5 m (CR 16.2.6.2), and 21 m for the short course's eight with spaces of 0.5 m", () => {
    expect(laneWidths("long", 8, false)).toEqual({ width: 25, space: 2.5, edge: 2.5 });
    expect(laneWidths("short", 8, false)).toEqual({ width: 21, space: 0.5, edge: 2.5 });
    expect(laneWidths("short", 6, false)).toEqual({ width: 16, space: 0.5, edge: 2.5 });
  });

  it("is 25 m wide for ten lanes, lanes 0 and 9 being 2.4 m with spaces of 0.1 m (CR 16.2.6.3), 26 m for a temporary pool with spaces of 0.5 m", () => {
    expect(laneWidths("long", 10, false)).toEqual({ width: 25, space: 0.1, edge: 2.4 });
    expect(laneWidths("long", 10, true)).toEqual({ width: 26, space: 0.5, edge: 2.5 });
    const permanent = swimPlan({ sport: "swimming", pool: { lanes: 10 } });
    expect(permanent.lanes.map((l) => l.number)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    // The marking of lane 0 is 1.25 m from the wall, and the markings are 2.5 m apart (CR 16.2.15).
    const ys = permanent.lanes.map((l) => l.y);
    for (let i = 1; i < ys.length; i += 1) near(ys[i] - ys[i - 1], 2.5, 6);
    near(permanent.width - ys[ys.length - 1], 1.25, 6);
    const temporary = swimPlan({ sport: "swimming", pool: { lanes: 10, temporary: true } });
    expect(temporary.width).toBe(26);
    near(temporary.width - temporary.lanes[temporary.lanes.length - 1].y, 0.5 + 1.25, 6);
  });

  it("numbers eight lanes 1 to 8 with lane 1 on the right facing the course from the start, which is the bottom of a wide drawing, and ten lanes 0 to 9", () => {
    const eight = swimPlan({ sport: "swimming", pool: {} });
    expect(eight.lanes.map((l) => l.number)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(eight.lanes[eight.lanes.length - 1].y).toBeGreaterThan(eight.lanes[0].y);
  });

  it("colours the ropes green, blue, yellow, blue, green for the outside to the middle (CR 16.1.7.1): two green, four blue and three yellow for eight lanes; two, six and three for ten", () => {
    const count = (lanes: number): Record<string, number> => {
      const colours = Array.from({ length: lanes + 1 }, (_, i) => ropeColour(i, lanes));
      return { green: colours.filter((c) => c === "green").length, blue: colours.filter((c) => c === "blue").length, yellow: colours.filter((c) => c === "yellow").length };
    };
    expect(count(8)).toEqual({ green: 2, blue: 4, yellow: 3 });
    expect(count(10)).toEqual({ green: 2, blue: 6, yellow: 3 });
    expect(Array.from({ length: 9 }, (_, i) => ropeColour(i, 8))).toEqual(["green", "blue", "blue", "yellow", "yellow", "yellow", "blue", "blue", "green"]);
    // The yellow ropes are those of lanes 4 and 5: the ropes at each of their sides.
    const plan = swimPlan({ sport: "swimming", pool: {} });
    const yellow = plan.ropes.filter((r) => r.colour === "yellow");
    expect(yellow).toHaveLength(3);
    for (const lane of [4, 5]) {
      const l = plan.lanes.find((one) => one.number === lane)!;
      expect(yellow.some((r) => Math.abs(r.y - l.top) < 1e-9)).toBe(true);
      expect(yellow.some((r) => Math.abs(r.y - l.bottom) < 1e-9)).toBe(true);
    }
  });

  it("takes from one to ten lanes and says what is wrong with another number", () => {
    expect(swimPlan({ sport: "swimming", pool: { lanes: 1 } }).lanes).toHaveLength(1);
    expect(() => swimPlan({ sport: "swimming", pool: { lanes: 0 } })).toThrow(/number of lanes/);
    expect(() => swimPlan({ sport: "swimming", pool: { lanes: 11 } })).toThrow(/1 to 10/);
    expect(() => swimPlan({ sport: "swimming", pool: { look: "glass" as never } })).toThrow(/Unknown pool look/);
    expect(() => swimPlan({ sport: "swimming", pool: { deck: "marble" as never } })).toThrow(/Unknown deck/);
  });
});

describe("the swimming pool drawn", () => {
  const svg = pool();
  const L = 50 * FT;
  const W = 25 * FT;

  it("is 50 by 25 m of water, wide, with the pool's box as its outline", () => {
    const water = withClass(svg, "ky-surface").find((n) => n.name === "rect")!;
    near(Number(water.attrs.width), L, 2);
    near(Number(water.attrs.height), W, 2);
    const o = outlineOf({ sport: "swimming" });
    near(o.box.w, L, 2);
    near(o.box.h, W, 2);
    expect(o.contains(L / 2, W / 2)).toBe(true);
    expect(o.contains(-1, 5)).toBe(false);
  });

  it("draws a lane marking in each lane, 46 m long from 2 m off each wall, with a cross line 1 m long at each end", () => {
    const d = withClass(svg, "ky-line").find((n) => n.attrs.d?.startsWith(`M${(2 * FT).toFixed(2).replace(/\.?0+$/, "")} `))!.attrs.d;
    const parts = d.split("M").filter((p) => p !== "");
    // Eight lane lines, then eight pairs of cross lines, then the cross lines at 15 m.
    const lines = parts.filter((p) => p.includes("H"));
    expect(lines).toHaveLength(8);
    for (const line of lines) {
      const [x0, , x1] = numbers(line.replace("H", " "));
      near(x0, 2 * FT, 1);
      near(x1 - x0, 46 * FT, 1);
    }
    const ends = parts.filter((p) => p.includes("V"));
    expect(ends.length).toBeGreaterThanOrEqual(16);
    const first = numbers(ends[0].replace("V", " "));
    near(first[2] - first[1], 1 * FT, 1);
  });

  it("puts the touch panels on both walls in every lane, 2.4 m wide, and the starting blocks behind both walls, numbered", () => {
    const pads = withClass(svg, "ky-pl-pad")[0];
    expect(subpaths(pads.attrs.d)).toBe(16);
    const blocks = withClass(svg, "ky-pl-bk")[0];
    expect(subpaths(blocks.attrs.d)).toBe(16);
    const labels = withClass(svg, "ky-pl-bn").map((n) => n.text);
    expect(labels).toHaveLength(16);
    expect([...new Set(labels)].sort()).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
    // The pad is 2.4 m across: the height of the first sub-path of the pads' path.
    const first = numbers(pads.attrs.d.split("M")[1].replace(/[hvHVZ]/g, " "));
    near(first[3], 2.4 * FT, 2);
  });

  it("stretches the backstroke flags 5 m from each wall and the false start rope 15 m from the start, over the whole width", () => {
    const flags = withClass(svg, "ky-pl-fa");
    expect(flags).toHaveLength(2);
    const at = (d: string): number[] => d.split("M").filter((p) => p !== "").map((p) => numbers(p.replace("V", " "))[0]);
    near(at(flags[0].attrs.d)[0], 5 * FT, 1);
    near(at(flags[1].attrs.d)[0], 45 * FT, 1);
    const rope = withClass(svg, "ky-pl-fs")[0];
    near(at(rope.attrs.d)[0], 15 * FT, 1);
    expect(subpaths(rope.attrs.d)).toBe(1);
    // The rope covers all the lanes: from beyond one side wall to beyond the other.
    const ys = numbers(rope.attrs.d.replace("V", " "));
    expect(ys[1]).toBeLessThan(0);
    expect(ys[2]).toBeGreaterThan(W);
  });

  it("draws the ropes in the rules' colours, nine of them, red within 5 m of each wall, with a distinct run at 15 m and 25 m from the walls", () => {
    const run = (colour: string): Node => withClass(svg, `ky-pl-r-${colour}`)[0];
    // One run of floats for each rope in its colour from 5 m to 45 m: two green, four blue, three yellow.
    expect(subpaths(run("green").attrs.d)).toBe(2);
    expect(subpaths(run("blue").attrs.d)).toBe(4);
    expect(subpaths(run("yellow").attrs.d)).toBe(3);
    // The red floats: both ends of all nine ropes.
    expect(subpaths(run("red").attrs.d)).toBe(18);
    // The marks: 15 m, 35 m and 25 m on all nine.
    expect(subpaths(run("white").attrs.d)).toBe(27);
    const red = run("red").attrs.d.split("M").filter((p) => p !== "");
    const widths = red.map((p) => numbers(p.replace("H", " ")));
    near(Math.min(...widths.map((w) => w[2] - w[0])), 5 * FT, 1);
    // The marks in a 25 m pool are at 15 m from each end and not at 25.
    const short = pool({ pool: { course: "short" } });
    expect(subpaths(withClass(short, "ky-pl-r-white")[0].attrs.d)).toBe(18);
  });

  it("is drawn with a short course 25 m long, with a lane marking of 21 m", () => {
    const s = pool({ pool: { course: "short" } });
    const d = withClass(s, "ky-line")[0].attrs.d;
    const [x0, , x1] = numbers(d.split("M")[1].replace("H", " "));
    near(x1 - x0, 21 * FT, 1);
    const water = withClass(s, "ky-surface").find((n) => n.name === "rect")!;
    near(Number(water.attrs.width), 25 * FT, 2);
    near(Number(water.attrs.height), 21 * FT, 2);
  });

  it("leaves out the blocks, the flags and the false start rope of a warm-up pool, and puts them back when asked", () => {
    const warm = pool({ pool: { kind: "warm-up" } });
    expect(withClass(warm, "ky-pl-bk")).toHaveLength(0);
    expect(withClass(warm, "ky-pl-fa")).toHaveLength(0);
    expect(withClass(warm, "ky-pl-fs")).toHaveLength(0);
    expect(withClass(warm, "ky-pl-pad")).toHaveLength(0);
    expect(withClass(warm, "ky-pl-r-green").length).toBeGreaterThan(0);
    const back = pool({ pool: { kind: "warm-up", blocks: true, flags: true } });
    expect(withClass(back, "ky-pl-bk")).toHaveLength(1);
    expect(withClass(back, "ky-pl-fa")).toHaveLength(2);
  });

  it("draws a side section with the depth, the flags and the false start rope, and says so in the description", () => {
    const text = drawKyogijo({ sport: "swimming", id: "s", pool: { section: true } });
    const root = parse(text);
    const section = withClass(root, "ky-pl-section");
    expect(section).toHaveLength(1);
    expect(walk(section[0]).filter((n) => n.name === "text").map((n) => n.text)).toEqual(expect.arrayContaining(["5 m", "15 m", "1.35 m", "2.5 m"]));
    expect(describeDrawing({ sport: "swimming", pool: { section: true } }).description).toContain("2.5 metres deep");
    expect(drawKyogijo({ sport: "swimming", id: "s", pool: { section: { depth: 3 } } })).toContain("3 m");
    const short = drawKyogijo({ sport: "swimming", id: "s", pool: { course: "short", section: true } });
    expect(short).toContain("2 m");
    expect(() => drawKyogijo({ sport: "swimming", pool: { section: { depth: 20 } } })).toThrow(/depth/);
  });

  it("is the same text every time, wide and tall, light and dark", () => {
    for (const options of [{}, { orientation: "portrait" }, { theme: "dark" }, { pool: { look: "water" } }, { pool: { look: "tiled", deck: "tiled", section: true } }] as Partial<SurfaceOptions>[]) {
      expect(drawKyogijo({ sport: "swimming", ...options })).toBe(drawKyogijo({ sport: "swimming", ...options }));
    }
    const tall = parse(drawKyogijo({ sport: "swimming", orientation: "portrait", id: "p" }));
    expect(tall.attrs["data-orientation"]).toBe("portrait");
    expect(tall.attrs["data-sport"]).toBe("swimming");
  });
});

describe("the looks of the water and the deck", () => {
  it("draws the water flat by default with no pattern at all, and a pattern of light, a gradient and tiles for the other looks", () => {
    const flat = drawKyogijo({ sport: "swimming", id: "l" });
    expect(flat).not.toContain("<pattern");
    expect(flat).not.toContain("linearGradient");
    const water = parse(drawKyogijo({ sport: "swimming", id: "l", pool: { look: "water" } }));
    expect(walk(water).filter((n) => n.name === "pattern")).toHaveLength(1);
    expect(walk(water).filter((n) => n.name === "linearGradient")).toHaveLength(1);
    const tiled = parse(drawKyogijo({ sport: "swimming", id: "l", pool: { look: "tiled", deck: "tiled" } }));
    expect(walk(tiled).filter((n) => n.name === "pattern")).toHaveLength(3);
  });

  it("makes the light on the water from a seed: the same seed the same light, another seed another", () => {
    const a = drawKyogijo({ sport: "swimming", id: "l", pool: { look: "water", seed: 7 } });
    expect(drawKyogijo({ sport: "swimming", id: "l", pool: { look: "water", seed: 7 } })).toBe(a);
    expect(drawKyogijo({ sport: "swimming", id: "l", pool: { look: "water", seed: 8 } })).not.toBe(a);
    // The light is defined once and used once for each pool: the pattern is small.
    const d = withClass(parse(a), "ky-pl-lt")[0].attrs.d;
    expect(d.length).toBeLessThan(9000);
    expect(a.match(/ky-pl-lt/g)?.length).toBeGreaterThanOrEqual(2);
    expect(() => drawKyogijo({ sport: "swimming", pool: { seed: Number.NaN } })).toThrow(/seed/);
  });

  it("repeats the light without a seam: the cells at the tile's edge are drawn on the far side too", () => {
    const d = withClass(parse(drawKyogijo({ sport: "swimming", id: "l", pool: { look: "water" } })), "ky-pl-lt")[0].attrs.d;
    const cells = d.split("M").filter((p) => p !== "");
    expect(cells.length).toBeGreaterThan(16);
    expect(cells.every((c) => c.endsWith("Z"))).toBe(true);
  });

  it("changes the colours with the named looks: the water, the deck and the lines, and keeps the ropes' colours", () => {
    for (const look of ["grass", "night", "chalkboard", "blueprint", "print", "broadcast", "high-contrast"] as const) {
      const svg = drawKyogijo({ sport: "swimming", id: "l", look });
      expect(svg).toContain(`data-palette="${look}"`);
      expect(svg).toContain("--ky-pg:");
    }
  });
});

describe("a race on the pool", () => {
  it("reads and writes times: 26.12, 1:46.91, 14:31.02, to the hundredth, carrying into the minute", () => {
    expect(parseTime(26.12)).toBe(26.12);
    expect(parseTime("26.12")).toBe(26.12);
    near(parseTime("1:46.91")!, 106.91, 6);
    near(parseTime("14:31.02")!, 871.02, 6);
    expect(parseTime("DQ")).toBeUndefined();
    expect(parseTime(-1)).toBeUndefined();
    expect(parseTime(Number.NaN)).toBeUndefined();
    expect(formatTime(26.121)).toBe("26.12");
    expect(formatTime(106.9)).toBe("1:46.90");
    expect(formatTime(59.996)).toBe("1:00.00");
    expect(formatTime(871.02)).toBe("14:31.02");
    expect(formatTime(0)).toBe("0.00");
  });

  it("places each swimmer in a lane of the pool, takes the places from the times when none is given, and shares a place between equal times", () => {
    const plan = swimPlan({ sport: "swimming", pool: { race: race() } });
    const rows = plan.race!.rows;
    expect(rows.map((r) => r.lane)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(rows.map((r) => r.place)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    const tie = swimPlan({ sport: "swimming", pool: { race: { swimmers: [{ lane: 1, name: "A", time: 50 }, { lane: 2, name: "B", time: 50 }, { lane: 3, name: "C", time: 51 }, { lane: 4, name: "D", status: "dq", time: 40 }] } } }).race!;
    expect(tie.rows.map((r) => [r.lane, r.place])).toEqual([[4, undefined], [3, 3], [2, 1], [1, 1]]);
    const given = swimPlan({ sport: "swimming", pool: { race: { swimmers: [{ lane: 1, name: "A", time: 50, place: 2 }, { lane: 2, name: "B", time: 49, place: 1 }] } } }).race!;
    expect(given.rows.map((r) => r.place)).toEqual([1, 2]);
  });

  it("works the distance out from the splits, with a split every 50 m in a long course pool and every 25 m in a short one, and holds the splits to the swimmers' own", () => {
    const four = swimPlan({ sport: "swimming", pool: { race: { swimmers: [{ lane: 1, name: "A", splits: [25, 52, 80, 107] }] } } }).race!;
    expect(four.distance).toBe(200);
    expect(four.splitEvery).toBe(50);
    const short = swimPlan({ sport: "swimming", pool: { course: "short", race: { swimmers: [{ lane: 1, name: "A", splits: [11, 23, 36, 48] }] } } }).race!;
    expect(short.distance).toBe(100);
    expect(short.splitEvery).toBe(25);
    expect(swimPlan({ sport: "swimming", pool: { race: { distance: 400, splitEvery: 100, swimmers: [{ lane: 1, name: "A", splits: [50, 100] }] } } }).race!.splitEvery).toBe(100);
  });

  it("says what is wrong with a lane the pool does not have, with two swimmers in a lane and with something that is not a race", () => {
    expect(() => swimPlan({ sport: "swimming", pool: { race: { swimmers: [{ lane: 9, name: "A" }] } } })).toThrow(/no lane 9/);
    expect(() => swimPlan({ sport: "swimming", pool: { race: { swimmers: [{ lane: 1, name: "A" }, { lane: 1, name: "B" }] } } })).toThrow(/two swimmers/);
    expect(() => swimPlan({ sport: "swimming", pool: { race: {} as never } })).toThrow(TypeError);
    expect(() => racePlan({ swimmers: [{ lane: 0, name: "A" }] }, [1, 2], { splitEvery: 50, length: 50 })).toThrow(/lanes are 1 to 2/);
    expect(() => swimPlan({ sport: "swimming", pool: { lanes: 10, race: { swimmers: [{ lane: 0, name: "A" }, { lane: 9, name: "B" }] } } })).not.toThrow();
  });

  it("draws a plate for each swimmer at the start with the flag, the name, the letters and the lane, and at the finish the place, the time, the reaction time and the splits", () => {
    const root = parse(drawKyogijo({ sport: "swimming", id: "r", pool: { race: race() } }));
    const rows = withClass(root, "ky-pl-row");
    expect(rows).toHaveLength(16);
    const names = withClass(root, "ky-pl-nm").map((n) => n.text);
    expect(names).toHaveLength(8);
    expect(names).toContain("Swimmer 4");
    const times = withClass(root, "ky-pl-tm").map((n) => n.text);
    expect(times).toHaveLength(8);
    expect(times).toContain("1:47.00");
    expect(walk(root).filter((n) => n.name === "text" && n.text.startsWith("RT "))).toHaveLength(8);
    expect(withClass(root, "ky-pl-sp")).toHaveLength(8);
    expect(walk(root).filter((n) => n.name === "image")).toHaveLength(8);
    // Three medals: gold, silver, bronze; the others have a disc of their own colour.
    expect(withClass(root, "ky-pl-mm")).toHaveLength(3);
  });

  it("leaves out what the data does not have, and what the race says not to show", () => {
    const bare = parse(drawKyogijo({ sport: "swimming", id: "r", pool: { race: { swimmers: [{ lane: 4, name: "A" }, { lane: 5, name: "B" }] } } }));
    expect(withClass(bare, "ky-pl-tm")).toHaveLength(0);
    expect(withClass(bare, "ky-pl-nm")).toHaveLength(2);
    const hidden = parse(drawKyogijo({ sport: "swimming", id: "r", pool: { race: race({ show: { splits: false, reaction: false, medals: false, flags: false } }) } }));
    expect(withClass(hidden, "ky-pl-sp")).toHaveLength(0);
    expect(walk(hidden).filter((n) => n.name === "text" && n.text.startsWith("RT "))).toHaveLength(0);
    expect(withClass(hidden, "ky-pl-mm")).toHaveLength(0);
    expect(walk(hidden).filter((n) => n.name === "image")).toHaveLength(0);
    // The entry times are for a start list and are left out once there are results.
    const start = parse(drawKyogijo({ sport: "swimming", id: "r", pool: { race: { swimmers: swimmers().map((s) => ({ lane: s.lane, name: s.name, abbr: s.abbr, flag: s.flag, seed: s.seed })) } } }));
    expect(walk(start).filter((n) => n.name === "text" && /^1:48\.37/.test(n.text)).length).toBeGreaterThan(0);
    const results = drawKyogijo({ sport: "swimming", id: "r", pool: { race: race() } });
    expect(results).not.toContain(">1:48.37<");
    const seeded = drawKyogijo({ sport: "swimming", id: "r", pool: { race: race({ show: { seeds: true } }) } });
    expect(seeded).toContain(">1:48.37<");
  });

  it("writes a DQ, a DNS or a DNF in place of a time and no medal for it", () => {
    const text = drawKyogijo({ sport: "swimming", id: "r", pool: { race: { swimmers: [{ lane: 4, name: "A", time: 50 }, { lane: 5, name: "B", status: "dq", time: 49 }, { lane: 6, name: "C", status: "dns" }, { lane: 3, name: "D", status: "dnf" }] } } });
    const root = parse(text);
    expect(withClass(root, "ky-pl-tm").map((n) => n.text).sort()).toEqual(["50.00", "DNF", "DNS", "DQ"]);
    expect(withClass(root, "ky-pl-mm")).toHaveLength(1);
  });

  it("draws pace bars: one per split, as long as the split's share of the race, from the field's fastest colour to its slowest, with the time on each", () => {
    const root = parse(drawKyogijo({ sport: "swimming", id: "r", pool: { race: race({ pace: true }) } }));
    const bars = withClass(root, "ky-pl-pb");
    expect(bars).toHaveLength(32);
    const widths = new Set(bars.map((b) => Number(b.attrs.width).toFixed(2)));
    expect(widths.size).toBe(1);
    const colours = bars.map((b) => b.attrs.fill);
    expect(colours).toContain("#fde725");
    expect(colours).toContain("#440154");
    expect(withClass(root, "ky-pl-pt").length).toBe(32);
    // Without labels there are no times on the bars; the axis names the distances.
    const plain = parse(drawKyogijo({ sport: "swimming", id: "r", pool: { race: race({ pace: { labels: false } }) } }));
    expect(withClass(plain, "ky-pl-pt")).toHaveLength(0);
    expect(withClass(plain, "ky-pl-ax").map((n) => n.text)).toEqual(["0 m", "50 m", "100 m", "150 m", "200 m"]);
  });

  it("describes the race to a reader who cannot see it: the event, each lane with its place, medal, time, reaction time and splits, and the pace", () => {
    const { description } = describeDrawing({ sport: "swimming", pool: { race: race({ pace: true }) } });
    expect(description).toContain("Men's 200 m freestyle.");
    expect(description).toContain("Lane 1: Swimmer 1 (AUR), place 1, gold medal, time 1:47.00, reaction time 0.60, splits 25.00, 52.00, 1:19.50, 1:47.00.");
    expect(description).toContain("Lane 3: Swimmer 3 (AUR), place 3, bronze medal");
    expect(description).toContain("pace of each split");
    const ja = describeDrawing({ sport: "swimming", language: "ja", pool: { race: race() } }).description;
    expect(ja).toContain("第1レーン：Swimmer 1（AUR）、1位、金メダル、タイム1:47.00");
  });

  it("makes an unsafe name, flag or colour harmless", () => {
    const hostile: Swimmer = { lane: 4, name: '<script>alert(1)</script>"&', abbr: "<b>", flag: "javascript:alert(1)", color: "red;fill:url(x)", time: 50 };
    const svg = drawKyogijo({ sport: "swimming", id: "h", pool: { race: { event: "<img onerror=x>", swimmers: [hostile] } } });
    expect(() => parse(svg)).not.toThrow();
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("javascript:");
    expect(svg).not.toContain("<img");
    expect(svg).not.toContain("url(x)");
  });

  it("puts the labels beside the pool in a tall drawing too, with the numbers in the discs upright", () => {
    const wide = parse(drawKyogijo({ sport: "swimming", id: "r", pool: { race: race() } }));
    const tall = parse(drawKyogijo({ sport: "swimming", id: "r", orientation: "portrait", pool: { race: race() } }));
    const [, , w1, h1] = wide.attrs.viewBox.split(" ").map(Number);
    const [, , w2, h2] = tall.attrs.viewBox.split(" ").map(Number);
    near(w1, h2, 2);
    near(h1, w2, 2);
    const numbersOf = withClass(tall, "ky-pl-dn");
    expect(numbersOf.length).toBeGreaterThan(8);
    for (const n of numbersOf) expect(n.attrs.transform).toMatch(/^rotate\(-90 /);
  });
});

describe("the race replay by lane", () => {
  const pool = { race: race() };

  it("works out the progress of a swimmer from the splits, the reaction time first", () => {
    const row = swimPlan({ sport: "swimming", pool }).race!.rows.find((r) => r.lane === 4)!;
    const progress = progressOf(row, 200, 50, 0.7);
    expect(progress.swims).toBe(true);
    expect(progress.points[0]).toEqual([row.reaction, 0]);
    expect(progress.points.map((p) => p[1])).toEqual([0, 50, 100, 150, 200]);
    expect(distanceAt(progress, 0)).toBe(0);
    expect(distanceAt(progress, 1000)).toBe(200);
    near(distanceAt(progress, (row.reaction! + row.splits[0]) / 2 + row.reaction! / 2 * 0 + 0.0001) > 0 ? 1 : 0, 1, 0);
    near(distanceAt(progress, row.splits[1]), 100, 6);
    expect(progressOf({ ...row, status: "dns" }, 200, 50, 0.7).swims).toBe(false);
  });

  it("goes down the first length and back the next: the wall at 50 m, the start again at 100 m", () => {
    expect([0, 25, 50, 75, 100, 125, 150, 200].map((d) => alongPool(d, 50))).toEqual([0, 25, 50, 25, 0, 25, 50, 0]);
    expect(alongPool(60, 25)).toBe(10);
  });

  it("makes a timeline in the pool's frame with a frame for each tenth of a second, the swimmers in their lanes, and the turns and the finishes as events", () => {
    const timeline = raceTimeline({ pool });
    expect(timeline.from).toBe("swimming");
    expect(timeline.units).toBe("m");
    const first = timeline.frames[0];
    expect(first.objects).toHaveLength(8);
    expect(first.objects.map((o) => o.number)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    // On the blocks before the signal: behind the starting wall, at the left of the frame.
    for (const o of first.objects) expect(o.x).toBeLessThan(-25);
    expect(timeline.frames[1].t).toBeCloseTo(0.1, 6);
    const kinds = timeline.events.map((e) => e.kind);
    expect(kinds.filter((k) => k === "turn")).toHaveLength(24);
    expect(kinds.filter((k) => k === "finish")).toHaveLength(8);
    expect(kinds[0]).toBe("start");
    const last = timeline.frames[timeline.frames.length - 1];
    // After the finish an even number of lengths later the swimmers are at the starting wall.
    for (const o of last.objects) near(o.x, -25, 1);
    // Lane 8 is at the top of the frame (y up) and lane 1 at the bottom.
    const ys = first.objects.map((o) => o.y);
    expect(ys).toEqual([...ys].sort((a, b) => b - a));
    expect(timeline.events.find((e) => e.kind === "finish")!.label).toContain("1:47");
  });

  it("is a replay the package's own functions play: a frame of it is a drawing with a mark for each swimmer, the same every time", () => {
    const timeline = raceTimeline({ pool }, { fps: 4 });
    const svg = drawFrame({ sport: "swimming", pool: { race: race({ show: { results: false } }) }, id: "f" }, timeline, 60);
    expect(svg).toBe(drawFrame({ sport: "swimming", pool: { race: race({ show: { results: false } }) }, id: "f" }, timeline, 60));
    const root = parse(svg);
    expect(withClass(root, "ky-layer").length).toBeGreaterThan(0);
    expect(svg).toContain("8 tracked objects");
  });

  it("says what a race it cannot play is missing", () => {
    expect(() => raceTimeline({ pool: {} })).toThrow(/needs a race/);
    expect(() => raceTimeline({ pool: { race: { swimmers: [{ lane: 1, name: "A" }] } } })).toThrow(/splits or a time/);
  });

  it("plays a short course race from splits every 25 m", () => {
    const timeline = raceTimeline({ pool: { course: "short", race: { swimmers: [{ lane: 4, name: "A", splits: [11.5, 23.7, 35.8, 47.9] }, { lane: 5, name: "B", splits: [11.8, 24.1, 36.4, 48.9] }] } } });
    expect(timeline.events.filter((e) => e.kind === "turn")).toHaveLength(6);
    expect(timeline.events.filter((e) => e.kind === "finish")).toHaveLength(2);
  });

  it("registers a frame for each pool, in metres from the middle of the water, which puts lane 1 at the bottom", () => {
    for (const sport of POOL_SPORTS) {
      const frame = FRAMES[sport];
      expect(frame.unit).toBe("m");
      expect(frame.size).toBe("variable");
      expect(frame.yDirection).toBe("up");
    }
    const [[x, y]] = toSurface([[0, 0]], { from: "swimming", size: { length: 50 * FT, width: 25 * FT, unit: "ft" } });
    near(x, 25 * FT, 2);
    near(y, 12.5 * FT, 2);
    const [[, below]] = toSurface([[0, -10]], { from: "swimming", size: { length: 50 * FT, width: 25 * FT, unit: "ft" } });
    expect(below).toBeGreaterThan(y);
  });
});

describe("the splits chart", () => {
  it("lays each split out as a pace bar, sums the race up and lists every split in a table", () => {
    const chart = splitsChart(race());
    expect(chart.totals.swimmers).toBe(8);
    expect(chart.totals.distance).toBe(200);
    expect(chart.totals.splitEvery).toBe(50);
    expect(chart.totals.rows[0].splits).toHaveLength(4);
    expect(chart.totals.fastest).toMatchObject({ lane: 1, split: 1, seconds: 25 });
    expect(chart.totals.fastest!.pace).toBe(50);
    expect(chart.totals.slowest!.pace).toBeGreaterThan(chart.totals.fastest!.pace);
    expect(chart.title).toBe("Split pace, Men's 200 m freestyle");
    expect(chart.summary).toContain("8 swimmers");
    const svg = chart.draw();
    expect(svg.startsWith("<svg")).toBe(true);
    expect(parse(svg).attrs["data-sport"]).toBe("swimming");
    expect(withClass(parse(svg), "ky-pl-pb")).toHaveLength(32);
    const table = chart.table();
    expect(table).toContain('data-kind="splits"');
    expect(table.match(/<tr>/g)).toHaveLength(9);
    expect(chart.layers).toEqual([]);
  });

  it("is in a short course pool and in Japanese when asked, and says what a chart with no race is", () => {
    const chart = splitsChart({ swimmers: [{ lane: 1, name: "A", splits: [11, 23] }] }, { pool: { course: "short" }, language: "ja" });
    expect(chart.totals.splitEvery).toBe(25);
    expect(chart.totals.distance).toBe(50);
    expect(chart.title).toBe("スプリットのペース");
    expect(() => splitsChart(undefined as never)).toThrow(TypeError);
  });
});

describe("the water polo field", () => {
  const svg = pool({}, "waterpolo");
  const L = 25.6 * FT;

  it("is 25 m between the goal lines in a pool 0.3 m longer at each end, 20 m wide", () => {
    const plan = poloPlan({ pool: {} });
    near(plan.length, 25.6, 6);
    expect(plan.width).toBe(20);
    const water = withClass(svg, "ky-surface").find((n) => n.name === "rect")!;
    near(Number(water.attrs.width), L, 2);
    near(Number(water.attrs.height), 20 * FT, 2);
  });

  it("marks the goal lines white, 2 m red, 6 m yellow and 5 m with a dashed red line, and the half distance line white (Appendix 4, 20.4.1.5)", () => {
    const at = (cls: string): number[] => withClass(svg, cls).map((n) => numbers(n.attrs.d)[0]);
    const goal = at("ky-pl-wl-white");
    near(goal[0], 0.3 * FT, 1);
    near(goal[1], (0.3 + 25) * FT, 1);
    near(goal[2], (0.3 + 12.5) * FT, 1);
    const red = withClass(svg, "ky-pl-wl-red");
    const redAt = red.filter((n) => !n.attrs["stroke-dasharray"] && n.attrs.d.includes("V")).map((n) => numbers(n.attrs.d)[0]);
    near(redAt[0], (0.3 + 2) * FT, 1);
    near(redAt[1], (0.3 + 25 - 2) * FT, 1);
    const five = red.filter((n) => n.attrs["stroke-dasharray"] !== undefined).map((n) => numbers(n.attrs.d)[0]);
    near(five[0], (0.3 + 5) * FT, 1);
    const yellow = withClass(svg, "ky-pl-wl-yellow").map((n) => numbers(n.attrs.d)[0]);
    near(yellow[0], (0.3 + 6) * FT, 1);
    near(yellow[1], (0.3 + 19) * FT, 1);
  });

  it("colours the ropes' floats red to 2 m, yellow from 2 to 6 m, green from 6 m to the half distance line, with white marks (CR 18.3.1)", () => {
    expect(withClass(svg, "ky-pl-r-green").length).toBe(1);
    expect(withClass(svg, "ky-pl-r-yellow").length).toBe(1);
    expect(withClass(svg, "ky-pl-r-red").length).toBe(1);
    const platforms = withClass(svg, "ky-pl-rp");
    expect(platforms).toHaveLength(12);
    expect(withClass(svg, "ky-pl-rp-red")).toHaveLength(4);
    const width = Number(withClass(svg, "ky-pl-rp-red")[0].attrs.width);
    near(width, 2 * FT, 2);
    near(Number(withClass(svg, "ky-pl-rp-yellow")[0].attrs.width), 4 * FT, 2);
    near(Number(withClass(svg, "ky-pl-rp-green")[0].attrs.width), 6.5 * FT, 2);
    near(Number(withClass(svg, "ky-pl-rp-red")[0].attrs.height), 1 * FT, 2);
  });

  it("stands a goal 3 m between the posts on each goal line, the goal areas' 2 m lines from the posts, and a re-entry area of 2.0 by 1.08 m in the corners away from the table", () => {
    const posts = withClass(svg, "ky-pl-gp");
    expect(posts).toHaveLength(4);
    const ys = posts.slice(0, 2).map((p) => Number(p.attrs.y) + Number(p.attrs.height) / 2);
    near(Math.abs(ys[1] - ys[0]), (3 + 0.08) * FT, 1);
    const bars = withClass(svg, "ky-pl-gb");
    const bar = numbers(bars[0].attrs.d);
    near(bar[2] - bar[1], 3 * FT, 1);
    const lines = withClass(svg, "ky-pl-wl-red").filter((n) => n.attrs.d.includes("H"));
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      const n = numbers(line.attrs.d);
      near(Math.abs(n[2] - n[0]), 2 * FT, 1);
    }
    const areas = withClass(svg, "ky-pl-ra");
    expect(areas).toHaveLength(2);
    near(Number(areas[0].attrs.height), 2 * FT, 1);
    near(Number(areas[0].attrs.width), 1.08 * FT, 1);
    // On the side away from the table: with the table at the bottom, the top corners; with it at the top, the bottom ones.
    const top = pool({ pool: { table: "top" } }, "waterpolo");
    expect(Number(withClass(top, "ky-pl-ra")[0].attrs.y)).toBeGreaterThan(Number(areas[0].attrs.y));
  });

  it("puts the official table on its own side, with the flying substitution areas in the teams' colours", () => {
    expect(withClass(svg, "ky-pl-tb")).toHaveLength(1);
    expect(withClass(parse(drawKyogijo({ sport: "waterpolo", id: "w", pool: { table: "top" } })), "ky-pl-tb")).toHaveLength(0);
    const full = parse(drawKyogijo({ sport: "waterpolo", id: "w" }));
    expect(withClass(full, "ky-pl-sa-l")).toHaveLength(1);
    expect(withClass(full, "ky-pl-sa-r")).toHaveLength(1);
    near(Number(withClass(full, "ky-pl-sa-l")[0].attrs.height), 0.5 * FT, 2);
  });

  it("takes a score: the home team on the left, as the other sports that list the home team first do, with the names on the decks at the ends", () => {
    const game: ScoreOptions = { sport: "waterpolo", id: "g", away: { name: "Harbour City Gulls", abbr: "HCG", score: 9 }, home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 11 }, status: "final" };
    const root = parse(drawKyogijo(game));
    expect(withClass(root, "ky-banner")).toHaveLength(2);
    expect(withClass(root, "ky-banner-left")[0].attrs["data-team"]).toBe("home");
    expect(describeDrawing(game).title).toContain("Prairie Ridge Bison 11");
  });
});

describe("the diving well", () => {
  it("stands the 5, 7.5 and 10 m platforms and the 1 and 3 m springboards, two of each, at the preferred distances from the wall and from each other", () => {
    const plan = divePlan({ pool: {} });
    const platforms = plan.boards.filter((b) => b.kind === "platform");
    expect(platforms.map((b) => b.height)).toEqual([10, 7.5, 5]);
    const ten = platforms[0];
    // B, from the plummet to the wall at the side: 5.75 m; A, the plummet beyond the pool wall: 1.50 m.
    near(plan.width - ten.y, 5.75, 6);
    expect(ten.x).toBe(1.5);
    expect([ten.length, ten.width]).toEqual([6, 3]);
    // C, from plummet to plummet: 3.00 m from the 10 to the 7.5 m, 2.75 m from the 7.5 to the 5 m.
    near(platforms[0].y - platforms[1].y, 3, 6);
    near(platforms[1].y - platforms[2].y, 2.75, 6);
    const boards = plan.boards.filter((b) => b.kind === "springboard");
    expect(boards.map((b) => b.height)).toEqual([3, 3, 1, 1]);
    for (const b of boards) {
      expect(b.length).toBe(4.88);
      expect(b.width).toBe(0.5);
      expect(b.x).toBe(2.22);
    }
    near(boards[0].y, 3.5, 6);
    near(boards[1].y - boards[0].y, 2.6, 6);
    expect(plan.width).toBe(25);
    expect(plan.length).toBe(21);
  });

  it("takes the platforms asked for, widens the well if the boards need more room, and says what is wrong with a platform the rules do not have", () => {
    const all = divePlan({ pool: { platforms: [1, 3, 5, 7.5, 10] } });
    expect(all.boards.filter((b) => b.kind === "platform").map((b) => b.height)).toEqual([10, 7.5, 5, 3, 1]);
    expect(all.width).toBeGreaterThan(25);
    expect(divePlan({ pool: { platforms: [10], springboards: false } }).boards).toHaveLength(1);
    expect(divePlan({ pool: { boards: 1 } }).boards.filter((b) => b.kind === "springboard")).toHaveLength(2);
    expect(() => divePlan({ pool: { platforms: [4 as never] } })).toThrow(/no 4 m platform/);
    expect(() => divePlan({ pool: { boards: 9 } })).toThrow(/boards of each height/);
  });

  it("draws the three lines across the well 2.5 m apart, the first under the plummet of the 3 m springboard, 21 m long", () => {
    const svg = pool({}, "diving");
    const d = withClass(svg, "ky-line")[0].attrs.d;
    const parts = d.split("M").filter((p) => p !== "").map((p) => numbers(p.replace("V", " ")));
    expect(parts).toHaveLength(3);
    near(parts[0][0], 2.22 * FT, 1);
    near(parts[1][0] - parts[0][0], 2.5 * FT, 1);
    near(parts[0][2] - parts[0][1], 21 * FT, 1);
  });

  it("draws each platform as a rectangle of the table's size with its front edge beyond the wall, and each springboard 4.88 by 0.50 m", () => {
    const svg = pool({}, "diving");
    const platforms = withClass(svg, "ky-pl-pf");
    expect(platforms).toHaveLength(3);
    const ten = platforms.find((p) => Math.abs(Number(p.attrs.height) - 3 * FT) < 0.05)!;
    near(Number(ten.attrs.width), 6 * FT, 1);
    near(Number(ten.attrs.x) + Number(ten.attrs.width), 1.5 * FT, 1);
    const boards = withClass(svg, "ky-pl-spb");
    expect(boards).toHaveLength(4);
    near(Number(boards[0].attrs.width), 4.88 * FT, 1);
    near(Number(boards[0].attrs.height), 0.5 * FT, 1);
    near(Number(boards[0].attrs.x) + Number(boards[0].attrs.width), 2.22 * FT, 1);
    expect(walk(svg).filter((n) => n.name === "text").map((n) => n.text)).toEqual(expect.arrayContaining(["10 m", "7.5 m", "5 m", "3 m", "1 m"]));
  });
});

describe("the artistic swimming area", () => {
  it("is 30 by 20 m for the Olympic Games, 25 by 15 m with a deep part of 12 by 12 m for the least, and the lines along the floor 2.5 m apart", () => {
    const olympic = artisticPlan({ pool: {} });
    expect([olympic.length, olympic.width, olympic.deep]).toEqual([30, 20, undefined]);
    const least = artisticPlan({ pool: { area: "minimum" } });
    expect([least.length, least.width]).toEqual([25, 15]);
    expect(least.deep).toEqual({ x: 6.5, y: 1.5, length: 12, width: 12 });
    const svg = pool({}, "artisticswimming");
    const d = withClass(svg, "ky-line")[0].attrs.d;
    expect(d.split("H")).toHaveLength(9);
    expect(withClass(parse(drawKyogijo({ sport: "artisticswimming", id: "a", pool: { area: "minimum" } })), "ky-pl-dp")).toHaveLength(1);
    expect(withClass(svg, "ky-pl-dp")).toHaveLength(0);
  });

  it("puts the judges' platform within 2 m of the pool's edge and the starting platform at centre stage", () => {
    const svg = pool({}, "artisticswimming");
    const judges = withClass(svg, "ky-pl-jp")[0];
    const gap = -(Number(judges.attrs.y) + Number(judges.attrs.height));
    expect(gap / FT).toBeLessThanOrEqual(ARTISTIC.judges.fromEdge + 1e-6);
    const start = withClass(svg, "ky-pl-sp2")[0];
    near(Number(start.attrs.x) + Number(start.attrs.width) / 2, 15 * FT, 1);
  });
});

describe("the natatorium", () => {
  it("lays the pools of a hall out to scale, each at least 8 m from the next, 10 m by default, with the deck and the names", () => {
    const layout = venueLayout({ venue: "natatorium" })!;
    expect(layout.items.map((i) => i.plan.sport)).toEqual(["swimming", "diving", "swimming"]);
    expect(layout.apart).toBe(10);
    for (const [i, a] of layout.items.entries()) {
      for (const b of layout.items.slice(i + 1)) {
        const gap = Math.max(a.x - (b.x + b.plan.length), b.x - (a.x + a.plan.length), a.y - (b.y + b.plan.width), b.y - (a.y + a.plan.width));
        expect(gap).toBeGreaterThanOrEqual(10 - 1e-9);
      }
    }
    expect(layout.items[0].x).toBe(0);
    expect(layout.items[2].plan.sport === "swimming" && layout.items[2].plan.kind).toBe("warm-up");
    const box = poolBox({ sport: "swimming", pool: { venue: "natatorium" } });
    near(box.w, layout.width * FT, 2);
    near(box.h, layout.height * FT, 2);
    const root = parse(drawKyogijo({ sport: "swimming", id: "v", pool: { venue: "natatorium" } }));
    const names = withClass(root, "ky-pl-vn").map((n) => n.text);
    expect(names).toEqual(expect.arrayContaining(["Competition pool", "Diving well", "Warm-up pool", "Spectators"]));
    expect(root.attrs["data-sport"]).toBe("swimming");
    const flat = drawKyogijo({ sport: "swimming", id: "v", pool: { venue: "natatorium" } });
    expect(flat.match(/<pattern/g)).toBeNull();
    const lit = drawKyogijo({ sport: "swimming", id: "v", pool: { venue: "natatorium", look: "water" } });
    expect(lit.match(/<pattern/g)).toHaveLength(1);
  });

  it("takes pools of its own, with places or in rows, and refuses two nearer than the rules keep a swimming pool and a diving well", () => {
    const layout = venueLayout({ venue: { pools: [{ sport: "swimming", course: "short", lanes: 6 }, { sport: "waterpolo" }, { sport: "artisticswimming" }], apart: 12, labels: false, seating: false } })!;
    expect(layout.apart).toBe(12);
    expect(layout.labels).toBe(false);
    expect(layout.items).toHaveLength(3);
    expect(() => venueLayout({ venue: { pools: [{ sport: "swimming", x: 0, y: 0 }, { sport: "diving", x: 52, y: 0 }] } })).toThrow(/nearer than 10 m/);
    expect(() => venueLayout({ venue: { pools: [{ sport: "swimming" }], apart: 3 } })).toThrow(/between pools/);
    expect(() => venueLayout({ venue: { pools: [] } })).toThrow(TypeError);
    expect(() => venueLayout({ venue: { pools: [{ sport: "curling" as never }] } })).toThrow(TypeError);
    expect(venueLayout({})).toBeUndefined();
  });

  it("is a drawing of the whole hall for the outline, the layers and the description", () => {
    const o = outlineOf({ sport: "swimming", pool: { venue: "natatorium" } });
    expect(o.box.w).toBeGreaterThan(50 * FT);
    expect(describeDrawing({ sport: "swimming", pool: { venue: "natatorium" } }).description).toContain("A hall with 3 pools to scale: Competition pool, Diving well and Warm-up pool.");
    const tall = parse(drawKyogijo({ sport: "swimming", id: "v", orientation: "portrait", pool: { venue: "natatorium" } }));
    expect(tall.attrs["data-orientation"]).toBe("portrait");
  });
});

describe("what every pool shares with the other sports", () => {
  it("is a sport of its own, a pool, with the words in both languages and no leagues", () => {
    expect(POOL_SPORTS).toEqual(["swimming", "waterpolo", "diving", "artisticswimming"]);
    for (const sport of POOL_SPORTS) {
      expect(isPoolSport(sport)).toBe(true);
      expect(KYOGIJO_STRINGS.en.surface[sport].length).toBeGreaterThan(4);
      expect(KYOGIJO_STRINGS.ja.surface[sport].length).toBeGreaterThan(3);
      expect(() => drawKyogijo({ sport, league: "x" })).toThrow(/no leagues/);
      expect(poolPlan({ sport, pool: {} }).sport).toBe(sport);
    }
    expect(isPoolSport("curling")).toBe(false);
    expect(() => poolPlan({ sport: "curling" as never, pool: {} })).toThrow(/not a pool sport/);
    expect(describeDrawing({ sport: "diving" }).description).toContain("platforms at 5, 7.5 and 10 metres");
    expect(describeDrawing({ sport: "waterpolo", language: "ja" }).title).toBe("水球のフィールド");
  });

  it("counts a point in a zone: lanes for swimming, the goal area and the ground to 6 m for water polo, thirds for diving and artistic swimming", () => {
    const ctx = (sport: "swimming" | "waterpolo" | "diving" | "artisticswimming"): Parameters<typeof buildZoneSet>[1] => ({ o: { sport }, outline: outlineOf({ sport }), direction: "right", end: "both", los: undefined, bats: undefined, words: KYOGIJO_STRINGS.en.layers.zones });
    const lanes = buildZoneSet("pool-lanes", ctx("swimming"));
    expect(lanes.zones).toHaveLength(8);
    expect(lanes.zones[0].name).toBe("Lane 8");
    const lane4 = lanes.zones.findIndex((z) => z.id === "lane-4");
    const plan = swimPlan({ sport: "swimming", pool: {} });
    expect(lanes.which(10, plan.lanes.find((l) => l.number === 4)!.y * FT)).toBe(lane4);
    const polo = buildZoneSet("water-polo-areas", ctx("waterpolo"));
    expect(polo.zones).toHaveLength(6);
    expect(polo.zones[polo.which(1 * FT, 10 * FT)].id).toBe("goal-area-left");
    expect(polo.zones[polo.which(4 * FT, 10 * FT)].id).toBe("two-to-six-left");
    expect(polo.zones[polo.which(12.8 * FT - 0.1, 10 * FT)].id).toBe("beyond-six-left");
    expect(() => buildZoneSet("pool-lanes", ctx("diving"))).toThrow(/is for swimming/);
    expect(buildZoneSet("pool-thirds", ctx("diving")).zones).toHaveLength(3);
  });

  it("has a score drawing on each pool, with the home team on the right for swimming, diving and artistic swimming and on the left for water polo", () => {
    for (const sport of POOL_SPORTS) {
      const game: ScoreOptions = { sport, id: "g", away: { name: "Away", abbr: "AWY", score: 1 }, home: { name: "Home", abbr: "HOM", score: 2 }, status: "final" };
      const root = parse(drawKyogijo(game));
      expect(withClass(root, "ky-plate")).toHaveLength(1);
      expect(withClass(root, "ky-banner")).toHaveLength(2);
      const homeSide = withClass(root, "ky-banner").find((b) => b.attrs["data-team"] === "home")!.attrs.class;
      expect(homeSide).toContain(sport === "waterpolo" ? "ky-banner-left" : "ky-banner-right");
      expect(drawKyogijo({ ...game, size: "badge" })).toContain("ky-badge");
    }
  });
});
