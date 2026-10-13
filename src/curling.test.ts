// Curling, held to its two rule books: World Curling's The Rules of Curling and Rules of Competition (1 September 2026, R1, R2, R6, R12) and
// Curling Canada's Rules of Curling for General Play (September 2022 to August 2026, Rules 3, 4, 12 and 13). Each figure is the rule's, read
// off the drawing; the rule numbers are in docs/sources.md.
import { describe, expect, it } from "vitest";
import { curlingScore, curlingStones } from "./charts.curling.ts";
import { describe as describeDrawing, drawKyogijo, statusLabel, winnerOf } from "./draw.ts";
import { endLabel, endCount } from "./curling.board.ts";
import { toSurface, fromSurface, convert } from "./frames.ts";
import "./frames.providers.ts";
import { CURLING, STONE_DIAMETER, dimensionsOf, surfaceSize } from "./geometry.ts";
import { layerTable } from "./layers.ts";
import { LEAGUES, chooseLeague, leagueById, leagueFigures, leagueSize, sheetOf } from "./leagues.ts";
import { CURLING_CANADA_SHEET, WCF_SHEET } from "./leagues/curling.ts";
import { buildZoneSet } from "./heat.zones.ts";
import { outlineOf } from "./outline.ts";
import { sheetFor } from "./sheet.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { SURFACE_UNITS } from "./units.ts";
import type { ScoreOptions } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const FT_PER_M = 1 / 0.3048;
const parse = (svg: string): Node => parseXml(svg);
const viewBox = (svg: Node): number[] => svg.attrs.viewBox.split(" ").map(Number);
/** A sheet as drawn wide, true widths, no ground: every figure is then where the rules put it. */
const sheet = (extra: Record<string, unknown> = {}): Node => parse(drawKyogijo({ sport: "curling", orientation: "landscape", margin: 0, exactLines: true, id: "t", style: "none", ...extra } as never));
const circles = (svg: Node, cls: string): Node[] => withClass(svg, cls);
const num = (node: Node, name: string): number => Number(node.attrs[name]);
/** The numbers of a path, in order. */
const numbers = (d: string): number[] => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

const gull = { name: "Harbour City Gulls", abbr: "HCG", score: 5, color: "#1d4f91", ends: [0, 1, 0, 2, 0, 0, 1, 0, 1, "X"] };
const bison = { name: "Prairie Ridge Bison", abbr: "PRB", score: 4, color: "#a8452c", hammer: true, ends: [1, 0, 2, 0, 1, 0, 0, 1, 0] };
const game: ScoreOptions = { sport: "curling", away: gull, home: bison, status: "end-10", competition: "Final", date: "Mar 8", id: "g" };

describe("the figures of the two rule books", () => {
  it("World Curling R1: 150 ft by 15 ft 7 in at most (45.720 by 4.750 m), 146 ft and 14 ft 6 in in an existing facility", () => {
    expect([WCF_SHEET.length, WCF_SHEET.width, WCF_SHEET.lengthMin, WCF_SHEET.widthMin]).toEqual([45.72, 4.75, 44.501, 4.42]);
    expect(WCF_SHEET.length * FT_PER_M).toBeCloseTo(150, 3);
    expect(WCF_SHEET.lengthMin * FT_PER_M).toBeCloseTo(146, 2);
    expect(WCF_SHEET.width * FT_PER_M).toBeCloseTo(15 + 7 / 12, 2);
    expect(WCF_SHEET.widthMin * FT_PER_M).toBeCloseTo(14.5, 2);
  });

  it("Curling Canada Rule 3(1): 146 to 150 ft long, 14 ft 2 in to 15 ft 7 in wide", () => {
    expect([CURLING_CANADA_SHEET.length, CURLING_CANADA_SHEET.lengthMin]).toEqual([150, 146]);
    expect(CURLING_CANADA_SHEET.width).toBeCloseTo(15 + 7 / 12, 10);
    expect(CURLING_CANADA_SHEET.widthMin).toBeCloseTo(14 + 2 / 12, 10);
    expect(CURLING_CANADA_SHEET.widthMin * 0.3048).toBeCloseTo(4.318, 3);
  });

  it("agree with each other: the same figures in metres and in feet, to the thousandth of a foot the books print", () => {
    const wcf = sheetOf(leagueById("curling", "wcf") as never);
    const cc = sheetOf(leagueById("curling", "curling-canada") as never);
    for (const key of ["length", "lengthMin", "teeFromMiddle", "backLine", "hogLine", "centreBeyondTee"] as const) expect(wcf[key], key).toBeCloseTo(cc[key], 2);
    expect(wcf.width).toBeCloseTo(cc.width, 2);
    wcf.rings.forEach((r, i) => expect(r, `ring ${i}`).toBeCloseTo(cc.rings[i], 2));
    expect(wcf.hack.insideFromCentre).toBeCloseTo(cc.hack.insideFromCentre, 2);
    expect(wcf.hack.depth).toBeCloseTo(cc.hack.depth, 2);
    expect(wcf.lineWidths.hog).toBeCloseTo(cc.lineWidths.hog, 2);
    // What only World Curling prints: the hack line (R1(b)V, 457 mm) and the courtesy lines (R1(b)VI, 152 mm, 1.219 m).
    expect(wcf.hackLine).toBeCloseTo(1.5, 2);
    expect(wcf.courtesy?.length).toBeCloseTo(0.5, 2);
    expect(wcf.courtesy?.outsideHog).toBeCloseTo(4, 2);
    expect(cc.hackLine).toBeNull();
    expect(cc.courtesy).toBeNull();
  });

  it("are in `CURLING` in feet: 114 ft from tee to tee, the back line 6 ft, the hog line 21 ft, the centre line 12 ft beyond the tee, rings of 6, 4 and 2 ft and a button of 6 in (Rule 3(3), (2), (4))", () => {
    expect(CURLING.teeFromMiddle * 2).toBe(114);
    expect([CURLING.backLine, CURLING.hogLine, CURLING.centreBeyondTee]).toEqual([6, 21, 12]);
    expect(CURLING.rings).toEqual({ twelve: 6, eight: 4, four: 2, button: 0.5 });
    expect(CURLING.hogLineWidth).toBeCloseTo(4 / 12, 10);
    expect(CURLING.lineWidth).toBeCloseTo(0.5 / 12, 10);
    expect(CURLING.hack).toEqual({ insideFromCentre: 0.25, width: 0.5, depth: 8 / 12 });
    // The tee is 18 ft from the backboard on a 150-ft sheet and 16 ft on a 146-ft one (Rule 3(3)(a)).
    expect(CURLING.length / 2 - CURLING.teeFromMiddle).toBe(18);
    expect(CURLING.lengthMin / 2 - CURLING.teeFromMiddle).toBe(16);
  });

  it("a stone's circumference is at most 36 in (R2(a), Rule 4(2)): drawn 11.46 in across", () => {
    expect(STONE_DIAMETER * Math.PI).toBeCloseTo(3, 10);
    expect(STONE_DIAMETER * 12).toBeCloseTo(11.459, 3);
  });

  it("are the sheet's size in a unit: metres for World Curling, feet for Curling Canada", () => {
    expect(SURFACE_UNITS.curling).toBe("m");
    expect(surfaceSize("curling", "ft")).toEqual({ length: 150, width: 15 + 7 / 12, unit: "ft" });
    expect(surfaceSize("curling").length).toBeCloseTo(45.72, 6);
    expect(leagueSize("curling", "wcf")).toMatchObject({ unit: "m" });
    expect(leagueSize("curling", "wcf").width).toBeCloseTo(4.75, 3);
    expect(leagueSize("curling", "curling-canada")).toMatchObject({ unit: "ft", length: 150 });
    expect(dimensionsOf("curling", "m").teeFromMiddle).toBeCloseTo(17.374, 2);
  });

  it("are listed in words, in the unit the rulebook prints", () => {
    const wcf = Object.fromEntries(leagueFigures(LEAGUES.curling[0]));
    expect(wcf.sheet).toBe("45.72 m by 4.75 m");
    expect(wcf["hog line"]).toBe("6.401 m from the tee");
    const cc = Object.fromEntries(leagueFigures(LEAGUES.curling[1]));
    expect(cc.sheet).toBe("150 ft by 15 ft 7 in");
    expect(cc["tee to tee"]).toBe("114 ft");
    expect(cc.house).toBe("circles of 6 ft, 4 ft and 2 ft radius, a button of 6 in");
    expect(cc["courtesy line"]).toBe("none");
  });

  it("have World Curling as the sport's own league and Curling Canada's as a variant", () => {
    expect(LEAGUES.curling.map((league) => league.id)).toEqual(["wcf", "curling-canada"]);
    expect(LEAGUES.curling[0].builtIn).toBe(true);
    expect(chooseLeague({ sport: "curling", league: "wcf" }).league).toBeUndefined();
    expect(chooseLeague({ sport: "curling", league: "curling-canada" }).league?.id).toBe("curling-canada");
    expect(() => chooseLeague({ sport: "curling", league: "fiba" })).toThrow(/is a basketball league/);
  });
});

describe("the sheet as drawn", () => {
  const svg = sheet();
  const [tl, tr] = [18, 132];
  const cy = (15 + 7 / 12) / 2;

  it("is 150 ft by 15 ft 7 in, with nothing round it when the margin is 0", () => {
    expect(viewBox(svg)).toEqual([0, 0, 150, 15.58]);
    const box = outlineOf({ sport: "curling" }).box;
    expect([box.x, box.y]).toEqual([0, 0]);
    expect(box.w).toBeCloseTo(150, 3);
    expect(box.h).toBeCloseTo(15 + 7 / 12, 2);
    expect(outlineOf({ sport: "curling", sheet: { length: 146 } }).box.w).toBe(146);
  });

  it("has a house at each end: circles of 6, 4, 2 and 0.5 ft round the tee, 57 ft either side of the middle (R1(b)I, R1(d); Rule 3(3)(a), (4))", () => {
    for (const [cls, r] of [["ky-rg-o", 6], ["ky-rg-m", 4], ["ky-rg-i", 2], ["ky-rg-b", 0.5]] as const) {
      const found = circles(svg, cls);
      expect(found, cls).toHaveLength(2);
      expect(found.map((c) => num(c, "cx")), cls).toEqual([tl, tr]);
      for (const c of found) {
        expect(num(c, "r"), cls).toBe(r);
        expect(num(c, "cy"), cls).toBeCloseTo(cy, 2);
      }
    }
    expect(tr - tl).toBe(114);
  });

  it("puts the tee line across the sheet at each tee (it stops short of the button), and the back line 6 ft from the tee (R1(b)II, Rule 3(3)(b))", () => {
    const lines = withClass(svg, "ky-line").map((n) => n.attrs.d);
    expect(lines[0]).toBe("M18 0V7.29M18 8.29V15.58M132 0V7.29M132 8.29V15.58");
    // The back line's outside edge is at 12 and 138; the line is a hair wide, centred half its width in.
    const back = numbers(lines[1]).filter((_, i) => i % 3 === 0);
    expect(back[0]).toBeCloseTo(18 - 6, 1);
    expect(back[1]).toBeCloseTo(132 + 6, 1);
  });

  it("puts the hog line's inside edge 21 ft from the tee, 4 in wide, red (R1(b)III, Rule 3(3)(c))", () => {
    const hog = withClass(svg, "ky-hog")[0].attrs.d;
    expect(hog).toBe("M39 0h0.33V15.58h-0.33ZM111 0h-0.33V15.58h0.33Z");
    expect(39 - tl).toBe(21);
    expect(tr - 111).toBe(21);
    expect(0.33).toBeCloseTo(4 / 12, 2);
    expect(KYOGIJO_STRINGS.en.surface.curling).toBe("Curling sheet");
  });

  it("runs the centre line from 12 ft behind one tee to 12 ft behind the other, and leaves the button clear (R1(b)IV, R1(d); Rule 3(2), (4)(e))", () => {
    const d = withClass(svg, "ky-line")[2].attrs.d;
    const xs = numbers(d).filter((_, i) => i % 3 === 0 || i % 3 === 2);
    expect(Math.min(...xs)).toBeCloseTo(18 - 12, 1);
    expect(Math.max(...xs)).toBeCloseTo(132 + 12, 1);
    expect(d).toContain("H17.5M18.49");
  });

  it("draws two hacks at each end, their inside edge 3 in from the centre line, 6 in wide, 8 in deep, the back edge 12 ft from the tee (R1(e); Rule 3(6))", () => {
    const hacks = withClass(svg, "ky-hack")[0].attrs.d.split("z").filter((part) => part !== "");
    expect(hacks).toHaveLength(4);
    // M5.99 7.04h0.67v0.5h-0.67: x from 6 (12 ft behind the tee at 18), 0.67 (8 in) deep, 0.5 (6 in) wide, 7.04 + 0.5 = 7.54 = 3 in off the centre line (7.79).
    expect(hacks[0]).toBe("M5.99 7.04h0.67v0.5h-0.67");
    expect(cy - (7.04 + 0.5)).toBeCloseTo(0.25, 1);
    expect(8.04 - cy).toBeCloseTo(0.25, 1);
    expect(0.67).toBeCloseTo(8 / 12, 1);
  });

  it("draws World Curling's hack line (1 ft 6 in) and courtesy lines (6 in, 4 ft outside each hog line), and Curling Canada's book none", () => {
    const wcf = withClass(svg, "ky-line").map((n) => n.attrs.d);
    expect(wcf).toContain("M5.99 7.04V8.54M144.01 7.04V8.54");
    expect(wcf).toContain("M43.33 0v0.5M43.33 15.58v-0.5M106.67 0v0.5M106.67 15.58v-0.5");
    const cc = withClass(sheet({ league: "curling-canada" }), "ky-line").map((n) => n.attrs.d);
    expect(cc).toHaveLength(3);
    expect(cc.join("")).not.toContain("43.33");
    // The same house in both.
    expect(circles(sheet({ league: "curling-canada" }), "ky-rg-o").map((c) => num(c, "r"))).toEqual([6, 6]);
  });

  it("leaves the small marks out when the detail is simple", () => {
    const simple = sheet({ detail: "simple" });
    expect(withClass(simple, "ky-hack")).toHaveLength(0);
    expect(withClass(simple, "ky-line")).toHaveLength(3);
    expect(withClass(simple, "ky-hog")).toHaveLength(1);
  });

  it("is within the rules' range, and refuses a size outside it with the range", () => {
    expect(viewBox(sheet({ sheet: { length: 146 } }))[2]).toBe(146);
    expect(circles(sheet({ sheet: { length: 146 } }), "ky-rg-b").map((c) => num(c, "cx"))).toEqual([16, 130]);
    expect(viewBox(sheet({ sheet: { width: 14.5 } }))[3]).toBe(14.5);
    expect(viewBox(sheet({ league: "curling-canada", sheet: { width: 14 + 2 / 12 } }))[3]).toBeCloseTo(14.17, 2);
    expect(() => drawKyogijo({ sport: "curling", sheet: { length: 140 } })).toThrow(/length must be 146 to 150 feet/);
    expect(() => drawKyogijo({ sport: "curling", sheet: { width: 14.3 } })).toThrow(/width must be 14\.5 to 15\.58 feet/);
    expect(() => drawKyogijo({ sport: "curling", league: "curling-canada", sheet: { width: 14.3 } })).not.toThrow();
    expect(() => drawKyogijo({ sport: "curling", sheet: { length: 151 } })).toThrow(RangeError);
    // In metres.
    expect(viewBox(sheet({ units: "m", sheet: { length: 45, width: 4.5 } }))[2]).toBeCloseTo(45 * FT_PER_M, 1);
    expect(sheetFor({ sport: "curling", units: "m", sheet: { length: 45.72 } }).spec.length).toBeCloseTo(150, 2);
  });

  it("lies tall by default, with the far house at the top, and wide when asked", () => {
    const tall = parse(drawKyogijo({ sport: "curling", id: "t", margin: 0 }));
    expect(tall.attrs["data-orientation"]).toBe("portrait");
    expect(viewBox(tall).slice(2)).toEqual([15.58, 150]);
    expect(parse(drawKyogijo({ sport: "curling", orientation: "landscape" })).attrs["data-orientation"]).toBe("landscape");
    // The quarter turn puts the left end at the top.
    const turn = walk(tall).find((n) => n.attrs.transform?.startsWith("matrix("))?.attrs.transform;
    expect(turn).toBe("matrix(0 1 -1 0 15.58 0)");
  });

  it("shows the half from the hog line to the back line, or the house, at either end", () => {
    const view = (show: string, end?: string) => viewBox(parse(drawKyogijo({ sport: "curling", orientation: "landscape", margin: 0, sheet: { show, end } } as never)));
    const left = view("half", "left");
    expect(left[0]).toBeCloseTo(18 - 6 - 1.5, 1);
    expect(left[0] + left[2]).toBeCloseTo(18 + 21 + 0.33 + 1.5, 1);
    const right = view("half", "right");
    expect(right[0]).toBeCloseTo(132 - 21 - 0.33 - 1.5, 1);
    expect(right[0] + right[2]).toBeCloseTo(132 + 6 + 1.5, 1);
    const house = view("house");
    expect(house[2]).toBeCloseTo(6 + 6 + 3, 1);
    expect(view("house", "right")[0]).toBeCloseTo(132 - 6 - 1.5, 1);
    // A tall drawing of the left house is at the top and as wide as the sheet.
    const tall = viewBox(parse(drawKyogijo({ sport: "curling", margin: 0, sheet: { show: "half" } })));
    expect(tall[2]).toBeCloseTo(15.58, 2);
    expect(tall[3]).toBeCloseTo(left[2], 2);
    // A score shows it all.
    expect(viewBox(parse(drawKyogijo({ ...game, sheet: { show: "house" } })))[3]).toBeGreaterThan(100);
  });

  it("paints the house in the colours asked, and the ice's pebble and the free guard zone when asked", () => {
    const custom = drawKyogijo({ sport: "curling", sheet: { rings: { outer: "#0b6e4f", middle: "white", inner: "#d4a017", button: "rgb(1, 2, 3)" } } });
    for (const part of ["--ky-rg-o:#0b6e4f", "--ky-rg-m:white", "--ky-rg-i:#d4a017", "--ky-rg-b:rgb(1, 2, 3)"]) expect(custom).toContain(part);
    expect(drawKyogijo({ sport: "curling", sheet: { rings: { outer: "red; background:url(x)" } } })).not.toContain("url(x)");
    const plain = sheet();
    expect(withClass(plain, "ky-pebble")).toHaveLength(0);
    expect(withClass(plain, "ky-fgz")).toHaveLength(0);
    const textured = sheet({ sheet: { pebble: true, guardZone: true } });
    expect(withClass(textured, "ky-pebble")[0].attrs.fill).toBe("url(#t-pebble)");
    expect(walk(textured).some((n) => n.name === "pattern" && n.attrs.id === "t-pebble")).toBe(true);
    // The free guard zone is the ground between each tee line and hog line (R6(a); Rule 12(1)): 21 ft of it at each end.
    expect(withClass(textured, "ky-fgz")[0].attrs.d).toBe("M18 0H39V15.58H18ZM132 0H111V15.58H132Z");
  });

  it("carries its own colours in its stylesheet, and no other sport's drawing does", () => {
    expect(drawKyogijo({ sport: "curling" })).toContain("--ky-rg-o:#2a5db0");
    expect(drawKyogijo({ sport: "nhl" })).not.toContain("--ky-rg-o");
    expect(drawKyogijo({ sport: "curling", style: "none" })).not.toContain("<style>");
  });

  it("is described in the unit of its rules, and named for its league", () => {
    expect(describeDrawing({ sport: "curling" })).toEqual({ title: "Curling sheet", description: "Drawn as: a curling sheet, 45.72 by 4.75 metres, with a house at each end (the 12-, 8- and 4-foot circles round the button), the tee, back, hog and centre lines and the hacks." });
    expect(describeDrawing({ sport: "curling", league: "curling-canada" }).title).toBe("Curling Canada sheet");
    expect(describeDrawing({ sport: "curling", league: "curling-canada" }).description).toContain("150 by 15.58 feet");
    expect(describeDrawing({ sport: "curling", language: "ja" }).title).toBe("カーリングのシート");
    expect(describeDrawing({ sport: "curling", language: "ja" }).description).toContain("ティーライン");
  });
});

describe("the frame", () => {
  const size = { length: 150, width: 15 + 7 / 12 };

  it("puts the button of the right house at the origin, and of the left house with attacking: left", () => {
    expect(toSurface([[0, 0]], { from: "curling", size })[0][0]).toBe(132);
    expect(toSurface([[0, 0]], { from: "curling", size })[0][1]).toBeCloseTo(size.width / 2, 6);
    expect(toSurface([[0, 0]], { from: "curling", size, attacking: "left" })[0][0]).toBe(18);
  });

  it("measures y towards the back line and x to the thrower's right, as the drawing shows them (tall, the house at the top)", () => {
    // At the left house: 6 ft towards the back line is the back line (x = 12), 21 ft towards the thrower is the hog line (x = 39).
    expect(toSurface([[0, 6]], { from: "curling", size, attacking: "left" })[0][0]).toBe(12);
    expect(toSurface([[0, -21]], { from: "curling", size, attacking: "left" })[0][0]).toBe(39);
    // The thrower looks down the sheet from the bottom of a tall drawing, so his right is the right of the page: a landscape y that is smaller.
    const right = toSurface([[2, 0]], { from: "curling", size, attacking: "left" })[0][1];
    expect(right).toBeCloseTo(size.width / 2 - 2, 6);
  });

  it("fits a sheet of 146 ft, where the tee is still 57 ft from the middle, and goes back", () => {
    expect(toSurface([[0, 0]], { from: "curling", size: { length: 146, width: 15 }, attacking: "left" })[0][0]).toBe(16);
    const point: [number, number] = [1.25, -3.5];
    const there = toSurface([point], { from: "curling", size, attacking: "left" });
    const back = fromSurface(there, { to: "curling", size, attacking: "left" })[0];
    expect(back[0]).toBeCloseTo(1.25, 9);
    expect(back[1]).toBeCloseTo(-3.5, 9);
    // In metres.
    expect(toSurface([[0, 0]], { from: "curling", size, units: "m" })[0][0]).toBeCloseTo(132 * 0.3048, 6);
    expect(() => toSurface([[0, 0]], { from: "curling" })).toThrow(/give the size/);
  });

  it("converts to itself, and a layer in it is placed on the sheet drawn", () => {
    const same = convert("curling", "curling", { size })([[1, 2]])[0];
    expect(same[0]).toBeCloseTo(1, 9);
    expect(same[1]).toBeCloseTo(2, 9);
    const svg = drawKyogijo({ sport: "curling", orientation: "landscape", id: "t", style: "none", layers: [{ kind: "points", from: "curling", attacking: "left", data: [{ x: 0, y: 0 }], style: { size: 1 } }] });
    const c = withClass(parse(svg), "ky-pts")[0].children.find((n) => n.name === "circle");
    expect(num(c as Node, "cx")).toBeCloseTo(18, 1);
    expect(num(c as Node, "cy")).toBeCloseTo(7.79, 1);
  });
});

describe("the score", () => {
  it("writes the teams, the score, each end, the totals and the status on a board between the hog lines", () => {
    const svg = parse(drawKyogijo(game));
    const text = walk(svg).filter((n) => n.name === "text").map((n) => n.text);
    for (const word of ["HCG", "PRB", "HARBOUR", "CITY GULLS", "RIDGE BISON", "Final", "End 10", "Total", "5", "4", "X"]) expect(text.join(" | "), word).toContain(word);
    // The ends of the home team: 1 0 2 0 1 0 0 1 0, in its column.
    const board = withClass(svg, "ky-scoreboard")[0];
    expect(board).toBeDefined();
    expect(withClass(board, "ky-score").filter((n) => /^[0-9X]$/.test(n.text))).toHaveLength(10 + 9 + 2);
    expect(withClass(svg, "ky-banner")).toHaveLength(0);
    expect(withClass(svg, "ky-plate")).toHaveLength(1);
  });

  it("lies tall by default, with the ends down the board, and wide with the ends across it", () => {
    const tall = parse(drawKyogijo(game));
    const wide = parse(drawKyogijo({ ...game, orientation: "landscape" }));
    expect(tall.attrs["data-orientation"]).toBe("portrait");
    const labels = (svg: Node): string[] => withClass(svg, "ky-foot").map((n) => n.text);
    for (const svg of [tall, wide]) for (let end = 1; end <= 10; end += 1) expect(labels(svg)).toContain(String(end));
    const rect = (svg: Node): Node => withClass(withClass(svg, "ky-scoreboard")[0], "ky-plate-bg")[0];
    // A tall board is taller than it is wide, a wide board wider than it is tall (the group turns the tall one back upright).
    expect(num(rect(tall), "height")).toBeGreaterThan(num(rect(tall), "width"));
    expect(num(rect(wide), "width")).toBeGreaterThan(num(rect(wide), "height"));
  });

  it("marks the team with the hammer with a stone beside its name, on the board and on the badge", () => {
    const svg = parse(drawKyogijo(game));
    expect(withClass(svg, "ky-hammer")).toHaveLength(1);
    const badge = parse(drawKyogijo({ ...game, size: "badge" }));
    expect(withClass(badge, "ky-hammer")).toHaveLength(1);
    expect(withClass(badge, "ky-badge-hammer-right")).toHaveLength(1);
    expect(withClass(parse(drawKyogijo({ ...game, away: { ...gull, hammer: true }, home: { ...bison, hammer: false }, size: "badge" })), "ky-badge-hammer-left")).toHaveLength(1);
    expect(withClass(parse(drawKyogijo({ ...game, home: { ...bison, hammer: false }, size: "badge" })), "ky-hammer")).toHaveLength(0);
  });

  it("goes on to extra ends: E for the eleventh, and a column for each more", () => {
    expect([1, 10, 11, 12].map(endLabel)).toEqual(["1", "10", "E", "E2"]);
    expect(endCount(["0"], undefined)).toBe(10);
    expect(endCount(new Array(12).fill("1"), ["0"])).toBe(12);
    expect(endCount(undefined, undefined)).toBe(0);
    const extra = parse(drawKyogijo({ ...game, away: { ...gull, score: 6, ends: [0, 1, 0, 2, 0, 0, 1, 0, 1, 0, 1] }, home: { ...bison, score: 5, ends: [1, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0] }, status: "extra-end", orientation: "landscape" }));
    expect(withClass(extra, "ky-foot").map((n) => n.text)).toContain("E");
    expect(withClass(extra, "ky-foot").some((n) => n.text.startsWith("Extra end"))).toBe(true);
  });

  it("has no board when no end is given, only the totals", () => {
    const svg = parse(drawKyogijo({ sport: "curling", away: { name: "A", score: 3 }, home: { name: "B", score: 2 }, status: "final", orientation: "landscape" }));
    expect(withClass(svg, "ky-foot").map((n) => n.text)).not.toContain("1");
    expect(withClass(svg, "ky-score").map((n) => n.text)).toEqual(expect.arrayContaining(["3", "2"]));
    expect(withClass(svg, "ky-hammer")).toHaveLength(0);
  });

  it("turns a status into an end, in both languages", () => {
    expect(statusLabel("end-6")).toBe("End 6");
    expect(statusLabel("End 6")).toBe("End 6");
    expect(statusLabel("end6")).toBe("End 6");
    expect(statusLabel("extra-end")).toBe("Extra end");
    expect(statusLabel("end-6", "ja")).toBe("第6エンド");
    expect(statusLabel("第6エンド", "ja")).toBe("第6エンド");
    expect(statusLabel("extra-end", "ja")).toMatch(/エンド/);
    expect(statusLabel("Endgame")).toBe("Endgame");
  });

  it("decides the winner as in any game, after a final", () => {
    expect(winnerOf({ away: { name: "a", score: 5 }, home: { name: "b", score: 4 }, status: "final" })).toBe("away");
    expect(drawKyogijo({ ...game, status: "final" })).toContain('data-winner="away"');
  });

  it("says the hammer and each end in the description, and the board's words in Japanese", () => {
    const { description } = describeDrawing(game);
    expect(description).toContain("Prairie Ridge Bison has the hammer.");
    expect(description).toContain("By end, Harbour City Gulls: 0, 1, 0, 2, 0, 0, 1, 0, 1, X.");
    expect(description).toContain("By end, Prairie Ridge Bison: 1, 0, 2, 0, 1, 0, 0, 1, 0.");
    const ja = describeDrawing({ ...game, language: "ja" }).description;
    expect(ja).toContain("エンドごとの得点");
    expect(ja).toContain("ハンマー");
    expect(drawKyogijo({ ...game, language: "ja" })).toContain("第10エンド");
  });

  it("makes a compact card of a wide sheet with the strip under it, and of a tall sheet the board", () => {
    const wide = parse(drawKyogijo({ ...game, orientation: "landscape", size: "compact" }));
    expect(wide.attrs["data-size"]).toBe("compact");
    expect(withClass(wide, "ky-strip")).toHaveLength(1);
    const tall = parse(drawKyogijo({ ...game, size: "compact" }));
    expect(tall.attrs["data-size"]).toBe("full");
    expect(withClass(tall, "ky-strip")).toHaveLength(0);
    expect(withClass(tall, "ky-scoreboard")).toHaveLength(1);
  });

  it("is within its size budget with the stylesheet, a board and a badge", () => {
    expect(drawKyogijo(game).length).toBeLessThan(17_500);
    expect(drawKyogijo({ sport: "curling" }).length).toBeLessThan(12_500);
    expect(drawKyogijo({ ...game, size: "badge" }).length).toBeLessThan(12_500);
    expect(drawKyogijo({ ...game, orientation: "landscape" }).length).toBeLessThan(17_500);
  });
});

describe("scoring an end by the rules", () => {
  const home = (x: number, y: number) => ({ x, y, team: "home" as const });
  const away = (x: number, y: number) => ({ x, y, team: "away" as const });

  it("scores one point for each stone nearer the button than every stone of the other team (R12(b); Rule 13(10))", () => {
    const end = curlingScore([home(0.3, 0.2), home(-1.5, 1), away(2, -2), home(3, 3), away(0, 5)]);
    expect(end.scoring).toBe("home");
    expect(end.points).toBe(2);
    expect(end.shot).toBe(0);
    expect(end.results.filter((r) => r.counting).map((r) => r.index)).toEqual([0, 1]);
    expect(end.blank).toBe(false);
  });

  it("counts a stone whose edge touches the house, and not one wholly outside it (R12(b) 'in or touching'; Rule 13(9) 'any part within six feet')", () => {
    const r = STONE_DIAMETER / 2;
    expect(curlingScore([home(6 + r - 0.001, 0)]).points).toBe(1);
    expect(curlingScore([home(6 + r + 0.001, 0)]).points).toBe(0);
    expect(curlingScore([home(6 + r + 0.001, 0)]).blank).toBe(true);
    expect(curlingScore([home(0, 6 + r - 0.001)]).inPlay === undefined).toBe(false);
    expect(curlingScore([home(0, -(6 + r - 0.001))]).points).toBe(1);
  });

  it("counts none of the stones that are as near as the other team's nearest, and blanks the end when the two nearest are equal (R12(f); Rule 13(12))", () => {
    expect(curlingScore([home(1, 0), away(0, 1)]).blank).toBe(true);
    expect(curlingScore([home(1, 0), away(0, 1)]).points).toBe(0);
    expect(curlingScore([home(1, 0), away(0, 1)]).scoring).toBeNull();
    const second = curlingScore([home(0.5, 0), away(0, 2), home(2, 0)]);
    expect(second.points).toBe(1);
    expect(second.scoring).toBe("home");
    expect(second.results[2].counting).toBe(false);
    // Two stones of one team as near as each other are both nearer than the other team's.
    expect(curlingScore([home(1, 0), home(0, 1), away(3, 0)]).points).toBe(2);
  });

  it("scores all of a team's stones when the other has none in the house", () => {
    const end = curlingScore([away(0.1, 0), away(5, 0), away(-3, -3), home(0, -12), home(0, 30)]);
    expect(end).toMatchObject({ scoring: "away", points: 3, blank: false, inPlay: 4, out: 1 });
  });

  it("takes off the stones that are out of play: a sideline, short of the hog line, past the back line (R2(f) to (h); Rule 13(1), (5), (6))", () => {
    const r = STONE_DIAMETER / 2;
    const half = (15 + 7 / 12) / 2;
    const one = (x: number, y: number) => curlingScore([home(x, y)]).results[0];
    expect(one(half - r - 0.01, 0).inPlay).toBe(true);
    expect(one(half - r + 0.01, 0).inPlay).toBe(false);
    expect(one(-(half - r + 0.01), 0).inPlay).toBe(false);
    expect(one(0, -21 + r + 0.01).inPlay).toBe(true);
    expect(one(0, -21 + r - 0.01).inPlay).toBe(false);
    expect(one(0, 6 + r - 0.01).inPlay).toBe(true);
    expect(one(0, 6 + r + 0.01).inPlay).toBe(false);
    // A stone out of play cannot score, even at the button.
    expect(curlingScore([home(0, 0), away(7.5, 0)]).points).toBe(1);
    expect(curlingScore([home(7.5, 0)]).blank).toBe(true);
    // A narrower sheet puts the sideline closer.
    expect(curlingScore([home(7, 0)], { width: 14.5 }).out).toBe(1);
  });

  it("takes places in feet, or the unit given, and leaves out a stone with no place", () => {
    expect(curlingScore([{ x: 0.1, y: 0.1, team: "home" }, { x: null, y: 2 }, { x: 1, y: undefined as never }]).skipped).toBe(2);
    expect(curlingScore([{ x: 30, y: 30, team: "home" }], { units: "cm" }).results[0].distance).toBeCloseTo(Math.hypot(30, 30) / 30.48, 9);
    expect(() => curlingScore([], { units: "furlong" as never })).toThrow(/Unknown units/);
    expect(() => curlingScore("x" as never)).toThrow(TypeError);
    expect(curlingScore([]).blank).toBe(true);
    expect(curlingScore([]).shot).toBeNull();
    // A stone with no team is the home team's.
    expect(curlingScore([{ x: 0, y: 0 }]).scoring).toBe("home");
  });
});

describe("the stones chart", () => {
  const stones = [
    { x: 0.4, y: 0.3, team: "home" as const, number: 8 },
    { x: -1.2, y: -0.8, team: "home" as const, number: 6 },
    { x: 1.9, y: 1.1, team: "away" as const, number: 7 },
    { x: -2.6, y: 2.8, team: "away" as const, number: 5 },
    { x: 0.2, y: -9, team: "away" as const, number: 3 },
    { x: 8.5, y: 0, team: "home" as const, number: 1 },
  ];
  const chart = curlingStones(stones, { end: 6, hammer: "home", names: { home: "Prairie Ridge", away: "Harbour City" }, id: "c" });

  it("gives the layers, the totals and a sentence, as the other charts do", () => {
    expect(chart.title).toBe("Curling stones, End 6");
    expect(chart.totals).toMatchObject({ stones: 6, inPlay: 5, out: 1, counting: 2, points: 2, scoring: "home", shot: 0, blank: false, skipped: 0 });
    expect(chart.summary).toBe("5 stones in play. Prairie Ridge scores 2. 1 out of play. Prairie Ridge has the hammer.");
    expect(chart.layers.map((layer) => layer.id)).toEqual(["shot-rock", "counting", "granite", "stones", "numbers", "key-marks", "key-text"]);
    expect(chart.key.map((k) => k.label)).toEqual(["Stone", "Counting stone", "Shot rock"]);
  });

  it("draws the stones to size, at the left house, over the half of the sheet with the guard zone", () => {
    const svg = parse(chart.draw());
    expect(svg.attrs["data-orientation"]).toBe("portrait");
    expect(withClass(svg, "ky-fgz")).toHaveLength(1);
    const granite = walk(svg).find((n) => n.attrs.id === "c-granite") as Node;
    expect(granite.children.filter((n) => n.name === "circle")).toHaveLength(5);
    expect(num(granite.children.find((n) => n.name === "circle") as Node, "r")).toBeCloseTo(STONE_DIAMETER / 2, 1);
    // The first stone is 0.4 ft towards the thrower's right and 0.3 ft towards the back line of the left house, at (18 - 0.3, 7.79 - 0.4).
    const first = granite.children.filter((n) => n.name === "circle")[0];
    expect(num(first, "cx")).toBeCloseTo(17.7, 1);
    expect(num(first, "cy")).toBeCloseTo(15.58 / 2 - 0.4, 1);
    // The stone out of play is not drawn, and the home stones carry the home colour.
    const handles = (walk(svg).find((n) => n.attrs.id === "c-stones") as Node).children.filter((n) => n.name === "circle");
    expect(handles.map((n) => n.attrs.class)).toEqual(["ky-h", "ky-h", "ky-a", "ky-a", "ky-a"]);
    expect(svg.attrs.style).toContain("--ky-layer-home:#cf2e2e");
    expect(svg.attrs.style).toContain("--ky-layer-away:#f2c230");
  });

  it("rings the stones that score once and the shot rock twice, and says so in the tooltips and the table", () => {
    const svg = parse(chart.draw());
    expect(walk(svg).find((n) => n.attrs.id === "c-counting")?.children.filter((n) => n.name === "circle")).toHaveLength(2);
    expect(walk(svg).find((n) => n.attrs.id === "c-shot-rock")?.children.filter((n) => n.name === "circle")).toHaveLength(1);
    const table = chart.table();
    expect(table).toContain("Prairie Ridge 8: 0.5 ft from the button, the shot rock");
    expect(table).toContain("Prairie Ridge 6: 1.44 ft from the button, counting");
    expect(table).toContain("Harbour City 7: 2.2 ft from the button");
    expect(table).not.toContain("Prairie Ridge 1");
    expect(table).toContain("<th scope=\"col\">Value</th>");
    expect(layerTable(chart.layers.filter((layer) => layer.id === "stones"))).toContain("5 stones");
  });

  it("shows the right house with house: right, and a wide drawing with its key", () => {
    const right = curlingStones(stones, { house: "right", id: "r" });
    const svg = parse(right.draw({ orientation: "landscape" }));
    const first = withClass(walk(svg).find((n) => n.attrs.id === "r-stones") as Node, "ky-h")[0];
    expect(num(first, "cx")).toBeCloseTo(132 + 0.3, 1);
    expect(num(first, "cy")).toBeCloseTo(15.58 / 2 + 0.4, 1);
    expect(walk(svg).filter((n) => n.attrs.id === "r-key-text")).toHaveLength(1);
    // A tall drawing has no key above it.
    expect(walk(parse(right.draw())).some((n) => n.attrs.id === "r-key-text")).toBe(false);
  });

  it("is in Japanese when asked, with the Japanese units and words", () => {
    const ja = curlingStones(stones, { language: "ja", end: 6, id: "j" });
    expect(ja.title).toBe("カーリングのストーンの位置、第6エンド");
    expect(ja.summary).toContain("プレー中のストーンは5個です。");
    expect(ja.table()).toContain("ボタンから");
  });

  it("blanks the end and draws no rings when nothing is in the house", () => {
    const blank = curlingStones([{ x: 0, y: -12, team: "home" }, { x: 3, y: -9, team: "away" }], { id: "b" });
    expect(blank.totals).toMatchObject({ blank: true, points: 0, scoring: null, shot: null });
    expect(blank.summary).toBe("2 stones in play. No one scores: the end is blanked.");
    expect(blank.layers.map((layer) => layer.id)).not.toContain("counting");
    expect(blank.key.map((k) => k.outcome)).toEqual(["stone"]);
  });

  it("takes the options of the drawing over its own, and refuses what is not a list", () => {
    const own = curlingStones(stones, { surface: { sheet: { show: "house", guardZone: false }, colors: { layerHome: "#123456" }, theme: "dark" }, id: "o" });
    const svg = parse(own.draw());
    expect(withClass(svg, "ky-fgz")).toHaveLength(0);
    expect(svg.attrs.style).toContain("--ky-layer-home:#123456");
    expect(svg.attrs.style).toContain("--ky-layer-away:#f2c230");
    expect(svg.attrs["data-theme"]).toBe("dark");
    expect(() => curlingStones("x" as never)).toThrow(TypeError);
    expect(curlingStones(stones, { numbers: false }).layers.map((layer) => layer.id)).not.toContain("numbers");
    expect(curlingStones(stones, { key: false }).layers.map((layer) => layer.id)).not.toContain("key-marks");
  });

  it("takes stones in another unit, and a title of its own for a stone", () => {
    const m = curlingStones([{ x: 0.1219, y: 0, team: "home", title: "Skip's last stone" }], { units: "m" });
    expect(m.table()).toContain("Skip&#39;s last stone".replace("&#39;", "'"));
    expect(m.totals.results[0].distance).toBeCloseTo(0.1219 / 0.3048, 6);
  });
});

describe("the zones of the house", () => {
  const ctx = (end: "left" | "right" | "both" = "both") => ({ o: { sport: "curling" as const }, outline: outlineOf({ sport: "curling" }), direction: "right" as const, end, los: undefined, bats: undefined, words: KYOGIJO_STRINGS.en.layers.zones });
  const set = buildZoneSet("curling-house", ctx());
  const zoneAt = (x: number, y: number): string | undefined => set.zones[set.which(x, y)]?.id;

  it("counts a point into the button, the 4-, 8- and 12-foot rings and the free guard zone of the end it is at (R1(d), R6(a))", () => {
    const mid = (15 + 7 / 12) / 2;
    expect(zoneAt(18, mid)).toBe("button-left");
    expect(zoneAt(18, mid + 1)).toBe("four-foot-left");
    expect(zoneAt(18, mid + 3)).toBe("eight-foot-left");
    expect(zoneAt(18, mid + 5)).toBe("twelve-foot-left");
    expect(zoneAt(132 + 5.9, mid)).toBe("twelve-foot-right");
    expect(zoneAt(132, mid - 0.4)).toBe("button-right");
    // The ground between the tee line and the hog line, outside the house: guard zone. Short of the hog line and behind the tee: none.
    expect(zoneAt(18 + 10, mid + 5)).toBe("guard-zone-left");
    expect(zoneAt(18 + 20.9, mid)).toBe("guard-zone-left");
    expect(zoneAt(18 + 21.5, mid)).toBeUndefined();
    expect(zoneAt(18 - 8, mid)).toBeUndefined();
    expect(zoneAt(18 + 3, 1)).toBe("guard-zone-left");
  });

  it("has the rings as holes in the rings that hold them, so that the zones do not overlap", () => {
    for (const zone of set.zones.slice(0, 5)) expect(zone.d, zone.id).toMatch(/^M/);
    expect(set.zones.find((z) => z.id === "twelve-foot-left")?.d.match(/M/g)).toHaveLength(2);
    expect(buildZoneSet("curling-house", ctx("left")).zones.map((z) => z.id)).toEqual(["guard-zone", "twelve-foot", "eight-foot", "four-foot", "button"]);
    expect(() => buildZoneSet("nhl-slot", ctx())).toThrow(/is for nhl/);
  });
});
