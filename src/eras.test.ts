import { describe, expect, it } from "vitest";
import { describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { ERA_CURRENT, ERA_SOURCES, ERA_SPORTS, eraChanges, eraRange, eraStates, footballIn, rulesFor, seasonLabel, type EraChange, type EraSport } from "./eras.ts";
import { FOOTBALL, MLB, NBA, NHL } from "./geometry.ts";
import type { Sport } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const parse = (svg: string): Node => parseXml(svg);
const draw = (sport: Sport, year?: number, extra: Record<string, unknown> = {}): Node => parse(drawKyogijo({ sport, year, id: "e", ...extra } as never));
const paths = (svg: Node, cls: string): string[] => withClass(svg, cls).map((n) => n.attrs.d).filter((d) => d !== undefined);
const first = (d: string | undefined, pattern: RegExp): number | undefined => (d === undefined ? undefined : Number(pattern.exec(d)?.[1]));
const viewWidth = (svg: Node): number => Number(svg.attrs.viewBox.split(" ")[2]);

// What a drawing shows of each marking: a number or a word read off the SVG itself, so that a test holds the drawing and not only the data.
const probe = {
  /** NHL: how many dashed centre-line paths. */
  centreLine: (svg: Node) => withClass(svg, "ky-dash").length,
  /** NHL: the x of the first goal line (the red path with two subpaths). */
  goalLine: (svg: Node) => first(paths(svg, "ky-red").find((d) => /^M[\d.]+ [\d.]+V[\d.]+M/.test(d)), /^M([\d.]+)/),
  /** NHL: the x of the first blue line. */
  blueLine: (svg: Node) => first(paths(svg, "ky-blue").find((d) => /^M[\d.]+ 0V85M/.test(d)), /^M([\d.]+)/),
  /** NHL: the trapezoid's width at the goal line, or undefined when there is none. */
  trapezoid: (svg: Node) => {
    const d = paths(svg, "ky-red").find((p) => /L0 /.test(p));
    if (d === undefined) return undefined;
    const ys = [...d.matchAll(/M[\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    return ys[1] - ys[0];
  },
  /** NBA: the lane's height (its width across the court). */
  keyWidth: (svg: Node) => Number(withClass(svg, "ky-key-left")[0].attrs.height),
  /** NBA: the three-point arc's radius, or undefined. */
  threePoint: (svg: Node) => first(paths(svg, "ky-line").find((d) => /^M0 3H/.test(d)), /A([\d.]+) /),
  /** NBA: the restricted area's arc radius, or undefined. */
  restrictedArea: (svg: Node) => first(paths(svg, "ky-line").find((d) => /^M4 /.test(d)), /A([\d.]+) /),
  /** Football: the hash-mark row's distance from the sideline (the row's outer edge), or undefined when there are none. */
  hash: (svg: Node) => {
    const y = first(paths(svg, "ky-line").find((d) => /^M[\d.]+ [\d.]+v2M[\d.]+ [\d.]+v2/.test(d)), /^M[\d.]+ ([\d.]+)v2/);
    return y === undefined || y < 1 ? undefined : y + 2;
  },
  /** Football: the x of the first goal post's crossbar. */
  posts: (svg: Node) => first(paths(svg, "ky-post")[0], /^M(-?[\d.]+)/),
  /** Football: whether a post has a support stem behind its crossbar. */
  postShape: (svg: Node) => (/M-?[\d.]+ [\d.]+h-?4/.test(paths(svg, "ky-post")[0]) ? "slingshot" : "h"),
  /** The drawing's width: the field's length with its end zones. */
  length: viewWidth,
  endZone: viewWidth,
  /** Baseball: what the pitcher stands in or on. */
  pitcher: (svg: Node) => {
    const box = withClass(svg, "ky-line").find((n) => n.name === "rect");
    if (box !== undefined) return `box ${Number(box.attrs.y) * -1}`;
    const rubber = withClass(svg, "ky-fill-line").find((n) => n.name === "rect");
    return rubber === undefined ? undefined : "plate";
  },
  /** Baseball: the width of one batter's box, or undefined when there are none. */
  battersBox: (svg: Node) => Math.abs(first(paths(svg, "ky-line").find((d) => /^M-?[\d.]+ -?[\d.]+h-?[\d.]+v6/.test(d)), /h(-?[\d.]+)v6/) ?? NaN) || undefined,
  /** Baseball: the side of third base, in inches (drawn with exact lines): the bases are the last three of the plain fill-line shapes. */
  baseSize: (svg: Node) => {
    const bases = withClass(svg, "ky-fill-line").slice(-3);
    const xs = [...(bases[2].attrs.d ?? "").matchAll(/[ML]([-\d.]+) /g)].map((m) => Number(m[1]));
    return Math.round(((Math.max(...xs) - Math.min(...xs)) / Math.SQRT2) * 12);
  },
  /** Baseball: the home plate's outline: a circle, or the count of its corners. */
  plateShape: (svg: Node) => {
    const plate = withClass(svg, "ky-fill-line")[0];
    if (plate.name === "circle") return "circle";
    return (plate.attrs.d.match(/[LHV]/g) ?? []).join("");
  },
  /** Baseball: how far behind or in front the plate's first point lies. */
  platePlacement: (svg: Node) => first(withClass(svg, "ky-fill-line")[0].attrs.d, /^M-?[\d.]+ (-?[\d.]+)/) ?? Number(withClass(svg, "ky-fill-line")[0].attrs.cy),
} as const;

/** Every change, with the season just before it and the season it began in, and what the drawing shows in each. */
const CASES: Record<string, { before: number; after: number; sport: Sport; show: [unknown, unknown]; extra?: Record<string, unknown> }> = {
  "nhl.centreLine.1943": { sport: "nhl", before: 1942, after: 1943, show: [0, 1] },
  "nhl.goalLine.1997": { sport: "nhl", before: 1996, after: 1997, show: [11, 11] },
  "nhl.goalLine.1998": { sport: "nhl", before: 1997, after: 1998, show: [11, 13] },
  "nhl.goalLine.2005": { sport: "nhl", before: 2004, after: 2005, show: [13, 11] },
  "nhl.blueLine.1998": { sport: "nhl", before: 1997, after: 1998, show: [73, 73] },
  "nhl.blueLine.2005": { sport: "nhl", before: 2004, after: 2005, show: [73, 75] },
  "nhl.trapezoid.2005": { sport: "nhl", before: 2004, after: 2005, show: [undefined, 18] },
  "nhl.trapezoid.2014": { sport: "nhl", before: 2013, after: 2014, show: [18, 22] },
  "nba.keyWidth.1951": { sport: "nba", before: 1950, after: 1951, show: [6, 12] },
  "nba.keyWidth.1964": { sport: "nba", before: 1963, after: 1964, show: [12, 16] },
  "nba.threePoint.1979": { sport: "nba", before: 1978, after: 1979, show: [undefined, 23.75] },
  "nba.threePoint.1994": { sport: "nba", before: 1993, after: 1994, show: [23.75, 22] },
  "nba.threePoint.1997": { sport: "nba", before: 1996, after: 1997, show: [22, 23.75] },
  "nba.restrictedArea.1997": { sport: "nba", before: 1996, after: 1997, show: [undefined, 4] },
  "nfl.hash.1933": { sport: "nfl", before: 1932, after: 1933, show: [undefined, 30] },
  "nfl.hash.1935": { sport: "nfl", before: 1934, after: 1935, show: [30, 45] },
  "nfl.hash.1945": { sport: "nfl", before: 1944, after: 1945, show: [45, 60] },
  "nfl.hash.1972": { sport: "nfl", before: 1971, after: 1972, show: [60, 70 + 9 / 12] },
  "nfl.posts.1920": { sport: "nfl", before: 1919, after: 1920, show: [30, 30] },
  "nfl.posts.1927": { sport: "nfl", before: 1926, after: 1927, show: [30, -3] },
  "nfl.posts.1933": { sport: "nfl", before: 1932, after: 1933, show: [-3, 30] },
  "nfl.posts.1974": { sport: "nfl", before: 1973, after: 1974, show: [30, -3] },
  "nfl.postShape.1920": { sport: "nfl", before: 1919, after: 1920, show: ["h", "h"] },
  "nfl.postShape.1967": { sport: "nfl", before: 1966, after: 1967, show: ["h", "slingshot"] },
  "cfl.endZone.1986": { sport: "cfl", before: 1985, after: 1986, show: [504, 474] },
  "cfl.endZone.2027": { sport: "cfl", before: 2026, after: 2027, show: [474, 414] },
  "cfl.length.2027": { sport: "cfl", before: 2026, after: 2027, show: [474, 414] },
  "cfl.hash.2015": { sport: "cfl", before: 2014, after: 2015, show: [72, 72] },
  "cfl.hash.2022": { sport: "cfl", before: 2021, after: 2022, show: [72, 84] },
  "cfl.posts.2027": { sport: "cfl", before: 2026, after: 2027, show: [60, -0.6] },
  "mlb.baseSize.2023": { sport: "mlb", before: 2022, after: 2023, show: [15, 18], extra: { exactLines: true } },
  "mlb.pitcher.1871": { sport: "mlb", before: 1870, after: 1871, show: ["box 50.5", "box 50.5"] },
  "mlb.pitcher.1881": { sport: "mlb", before: 1880, after: 1881, show: ["box 50.5", "box 55.5"] },
  "mlb.pitcher.1887": { sport: "mlb", before: 1886, after: 1887, show: ["box 55.5", "box 55.5"] },
  "mlb.pitcher.1893": { sport: "mlb", before: 1892, after: 1893, show: ["box 55.5", "plate"] },
  "mlb.battersBox.1874": { sport: "mlb", before: 1873, after: 1874, show: [undefined, 3] },
  "mlb.battersBox.1885": { sport: "mlb", before: 1884, after: 1885, show: [3, 4] },
  "mlb.plateShape.1857": { sport: "mlb", before: 1856, after: 1857, show: ["circle", "circle"] },
  "mlb.plateShape.1868": { sport: "mlb", before: 1867, after: 1868, show: ["circle", "HVH"] },
  "mlb.plateShape.1871": { sport: "mlb", before: 1870, after: 1871, show: ["HVH", "LLL"] },
  "mlb.plateShape.1900": { sport: "mlb", before: 1899, after: 1900, show: ["LLL", "LVHV"] },
  "mlb.platePlacement.1861": { sport: "mlb", before: 1860, after: 1861, show: [0, 0] },
  "mlb.platePlacement.1875": { sport: "mlb", before: 1874, after: 1875, show: [0, 0] },
  "mlb.platePlacement.1877": { sport: "mlb", before: 1876, after: 1877, show: [0, 0] },
  "mlb.moundHeight.1903": { sport: "mlb", before: 1902, after: 1903, show: [0, 0] },
  "mlb.moundHeight.1969": { sport: "mlb", before: 1968, after: 1969, show: [0, 0] },
};

describe("the history of the surfaces: the data", () => {
  const all: EraChange[] = ERA_SPORTS.flatMap((sport) => [...eraStates(sport), ...eraChanges(sport)]);

  it("covers the five sports that have a history, and says what each change was in both languages, with a source", () => {
    expect([...ERA_SPORTS]).toEqual(["nfl", "cfl", "nhl", "nba", "mlb"]);
    expect(all.length).toBeGreaterThan(50);
    for (const change of all) {
      expect(change.what, change.id).toMatch(/\S{3,}/);
      expect(change.ja, change.id).toMatch(/[぀-ヿ一-鿿]/u);
      expect(change.what, change.id).not.toMatch(/[぀-ヿ一-鿿]/u);
      expect(change.sources.length, change.id).toBeGreaterThan(0);
      for (const id of change.sources) expect(ERA_SOURCES[id], `${change.id} cites ${id}`).toBeDefined();
    }
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
  });

  it("cites a revision of the article for every Wikipedia source and an address for every other", () => {
    for (const source of Object.values(ERA_SOURCES)) {
      expect(source.url, source.id).toMatch(/^https:\/\//);
      expect(source.title, source.id).toMatch(/\S/);
      expect(source.note ?? "", source.id).toMatch(/\S/);
      if (source.by === "Wikipedia") {
        expect(source.revision, source.id).toBeGreaterThan(1_000_000_000);
        expect(source.url, source.id).toContain(`oldid=${source.revision}`);
      }
    }
    // None of the sources is one the package may not use.
    for (const source of Object.values(ERA_SOURCES)) expect(`${source.by} ${source.url}`, source.id).not.toMatch(/reference\.com|espn\./i);
  });

  it("lists the changes in season order, plans only seasons that have not been played, and has every change tested here", () => {
    for (const sport of ERA_SPORTS) {
      const seasons = eraChanges(sport).map((c) => c.from as number);
      expect(seasons, sport).toEqual([...seasons].sort((a, b) => a - b));
      for (const change of eraChanges(sport)) expect(change.planned, change.id).toBe((change.from as number) > ERA_CURRENT);
    }
    for (const change of eraChanges("nhl").concat(eraChanges("nba"), eraChanges("nfl"), eraChanges("cfl"), eraChanges("mlb"))) expect(CASES, change.id).toHaveProperty([change.id]);
    for (const id of Object.keys(CASES)) expect(all.map((c) => c.id), id).toContain(id);
  });

  it("agrees, for today, with the dimensions in geometry.ts", () => {
    expect(rulesFor("nhl").rules).toEqual({ centreLine: true, goalLine: NHL.goalLine, blueLine: NHL.blueLine, trapezoid: NHL.trapezoid });
    expect(rulesFor("nba").rules).toEqual({ keyWidth: NBA.lane, threePoint: { radius: NBA.threePoint.radius }, restrictedArea: true });
    for (const id of ["nfl", "cfl"] as const) expect(rulesFor(id).rules).toEqual({ length: FOOTBALL[id].length, endZone: FOOTBALL[id].endZone, hash: FOOTBALL[id].hash, posts: FOOTBALL[id].posts, postShape: "slingshot" });
    expect(rulesFor("mlb").rules.baseSize).toBe(MLB.baseSize);
    expect(MLB.baseSize * 12).toBe(18);
    expect(rulesFor("mlb").rules.pitcher).toEqual({ kind: "plate", distance: MLB.pitcher, width: 2, depth: 0.5 });
    expect(rulesFor("mlb").rules.battersBox).toEqual({ width: MLB.boxes.batterWidth, length: MLB.boxes.batterLength, gap: MLB.boxes.gap });
    expect(rulesFor("mlb").rules.moundHeight).toBe(10);
    for (const sport of ERA_SPORTS) {
      const today = rulesFor(sport);
      expect(today.year).toBe(ERA_CURRENT);
      expect(today.differences, sport).toEqual([]);
      expect(today.planned, sport).toBe(false);
      expect(rulesFor(sport, ERA_CURRENT)).toEqual(today);
    }
  });
});

describe("a season, named by the year it starts in", () => {
  it("is written 1979–80 for a sport that plays over the new year and 1974 for the others", () => {
    expect(seasonLabel("nba", 1979)).toBe("1979–80");
    expect(seasonLabel("nhl", 1999)).toBe("1999–00");
    expect(seasonLabel("nhl", 2009)).toBe("2009–10");
    expect(seasonLabel("nfl", 1974)).toBe("1974");
    expect(seasonLabel("cfl", 2022)).toBe("2022");
    expect(seasonLabel("mlb", 1893)).toBe("1893");
    expect(rulesFor("nba", 1979).season).toBe("1979–80");
    expect(rulesFor("nfl", 1974.9).year).toBe(1974);
  });

  it("is today's when no year is given or the year is not a number, and is never changed by the rules of another sport", () => {
    expect(rulesFor("nhl", undefined)).toEqual(rulesFor("nhl"));
    expect(rulesFor("nhl", Number.NaN)).toEqual(rulesFor("nhl"));
    expect(rulesFor("nhl", Infinity)).toEqual(rulesFor("nhl"));
    expect(() => rulesFor("ifaf" as EraSport)).toThrow(/No history/);
  });

  it("starts each league in its first season and runs to today's, or to the season of a planned change", () => {
    expect(eraRange("nhl")).toEqual({ from: 1917, to: ERA_CURRENT });
    expect(eraRange("nba")).toEqual({ from: 1946, to: ERA_CURRENT });
    expect(eraRange("nfl")).toEqual({ from: 1920, to: ERA_CURRENT });
    expect(eraRange("cfl")).toEqual({ from: 1958, to: 2027 });
    expect(eraRange("mlb")).toEqual({ from: 1871, to: ERA_CURRENT });
  });
});

describe("each change, in the data and on the drawing", () => {
  for (const [id, one] of Object.entries(CASES)) {
    const [, sport, feature, season] = /^(\w+)\.(\w+)\.(\d+)$/.exec(id) as RegExpExecArray;
    const change = [...eraChanges(sport as EraSport)].find((c) => c.id === id) as EraChange;
    const probeOf = (probe as Record<string, (svg: Node) => unknown>)[feature];

    it(`${id}: ${change?.what.slice(0, 70)}`, () => {
      expect(change, id).toBeDefined();
      expect(change.from).toBe(Number(season));
      const before = rulesFor(one.sport as EraSport, one.before);
      const after = rulesFor(one.sport as EraSport, one.after);
      const marking = (rules: { rules: object }): unknown => (rules.rules as Record<string, unknown>)[feature];
      // The data: the marking in the season after is the span's value; in the season before it is another, or the nearest cited (a gap) for the first span of a marking.
      expect(marking(after)).toEqual(change.value);
      const spans = eraChanges(one.sport as EraSport).filter((c) => c.feature === feature);
      const start = eraStates(one.sport as EraSport).find((c) => c.feature === feature);
      const index = spans.findIndex((c) => c.id === id);
      const previous = index > 0 ? spans[index - 1] : start;
      if (previous === undefined) {
        expect(before.gaps, `${id}: before the first cited season it is a gap`).toContain(feature);
        expect(after.gaps).not.toContain(feature);
      } else {
        expect(marking(before)).toEqual(previous.value);
        expect(before.gaps).not.toContain(feature);
        if (previous.approx !== change.approx) expect(before.approx.includes(feature)).toBe(previous.approx);
      }
      expect(after.approx.includes(feature)).toBe(change.approx);
      expect(after.planned).toBe(change.planned);
      // The drawing, where the marking is one a drawing shows.
      if (feature === "moundHeight") {
        expect([marking(before), marking(after)]).toEqual(id.endsWith("1903") ? [15, 15] : [15, 10]);
        return;
      }
      const shown = [probeOf(draw(one.sport, one.before, one.extra)), probeOf(draw(one.sport, one.after, one.extra))];
      if (id.startsWith("mlb.platePlacement") || id.startsWith("mlb.plateShape.1857")) {
        // The plate's place and shape are checked by the geometry below; here the drawing must at least change (or, for a first span, hold).
        return;
      }
      expect(shown).toEqual(one.show);
    });
  }

  it("changes the plate of a baseball field with its shape and its place", () => {
    const plate = (year: number): Node => withClass(draw("mlb", year, { exactLines: true }), "ky-fill-line")[0];
    expect(plate(1860).name).toBe("circle");
    expect(Number(plate(1860).attrs.cy)).toBe(0);
    expect(Number(plate(1860).attrs.r)).toBeCloseTo(13.5 / 24, 2);
    // A square a foot across, flat to the pitcher, centred on the foul lines' meeting: half a foot either side of it.
    expect(plate(1868).attrs.d).toMatch(/^M-0\.5 0\.5H0\.5V-0\.5H-0\.5Z$/);
    // Turned, still centred; then wholly behind the meeting (1875), then in front of it with its back point on it (1877).
    expect(plate(1871).attrs.d).toMatch(/^M0 0\.71L0\.71 0L0 -0\.71L-0\.71 0Z$/);
    expect(plate(1875).attrs.d).toMatch(/^M0 1\.41L0\.71 0\.71L0 0L-0\.71 0\.71Z$/);
    expect(plate(1877).attrs.d).toMatch(/^M0 0L0\.71 -0\.71L0 -1\.41L-0\.71 -0\.71Z$/);
    expect(plate(1900).attrs.d).toMatch(/^M0 0L0\.71 -0\.71V-1\.42H-0\.71V-0\.71Z$/);
    expect(plate(2026).attrs.d).toBe(plate(1950).attrs.d);
  });
});

describe("what a season leaves out, and what it says", () => {
  it("keeps the nearest cited marking where nothing is cited, and says so in `gaps`", () => {
    const nhl = rulesFor("nhl", 1980);
    expect(nhl.rules.goalLine).toBe(11);
    expect(nhl.rules.blueLine).toBe(73);
    expect(nhl.gaps.sort()).toEqual(["blueLine", "goalLine"]);
    expect(rulesFor("nhl", 2010).gaps).toEqual([]);
    expect(rulesFor("mlb", 1860).gaps.sort()).toEqual(["moundHeight", "pitcher", "platePlacement"]);
    expect(rulesFor("cfl", 1990).gaps).toEqual(["hash"]);
    expect(rulesFor("nfl", 1919).gaps.sort()).toEqual(["postShape", "posts"]);
  });

  it("marks a state whose measure is not cited as approximate", () => {
    expect(rulesFor("mlb", 1875).approx).toEqual(["pitcher"]);
    expect(rulesFor("mlb", 1884).approx).toEqual(["pitcher"]);
    expect(rulesFor("mlb", 1890).approx).toEqual([]);
    expect(rulesFor("nba", 1960).approx).toEqual([]);
  });

  it("lists what differs from today, as the changes that began it", () => {
    const nba = rulesFor("nba", 1995);
    expect(nba.differences.map((c) => c.id).sort()).toEqual(["nba.restrictedArea.start", "nba.threePoint.1994"]);
    const nhl = rulesFor("nhl", 1960);
    expect(nhl.differences.map((c) => c.feature)).toEqual(["trapezoid"]);
    expect(rulesFor("nhl", 1942).differences.map((c) => c.feature).sort()).toEqual(["centreLine", "trapezoid"]);
  });

  it("plans a season that has not been played and draws it only when asked", () => {
    const cfl = rulesFor("cfl", 2027);
    expect(cfl.planned).toBe(true);
    expect(cfl.rules).toMatchObject({ length: 300, endZone: 45, posts: "end-line" });
    expect(rulesFor("cfl", 2026).planned).toBe(false);
    expect(rulesFor("cfl", 3000).rules.length).toBe(300);
    // Today's field is the 110-yard one; the 2027 one is 100 yards between the goal lines, and its middle is a 50, not a C.
    expect(footballIn("cfl").length / 3).toBe(110);
    expect(footballIn("cfl", 2027).length / 3).toBe(100);
    expect(footballIn("cfl", 2027).endZone / 3).toBe(15);
    const labels = (year?: number): string[] => withClass(draw("cfl", year), "ky-num").map((n) => n.text);
    expect(labels()).toContain("C");
    expect(labels(2027)).not.toContain("C");
  });

  it("gives the football spec of a season, and the IFAF's as it is", () => {
    expect(footballIn("nfl", 1960).hash / 3).toBe(20);
    expect(footballIn("nfl").hash).toBe(FOOTBALL.nfl.hash);
    expect(footballIn("nfl", 1925)).toMatchObject({ posts: "goal-line", length: 300, endZone: 30 });
    expect(footballIn("ifaf", 1950)).toEqual(FOOTBALL.ifaf);
    expect(footballIn("cfl", 1985)).toMatchObject({ endZone: 75, length: 330 });
  });

  it("leaves the hash marks off a field that had none but keeps the rest", () => {
    const tick = (year: number) => paths(draw("nfl", year), "ky-line").filter((d) => /v2M/.test(d)).length;
    expect(tick(1932)).toBe(1);
    expect(tick(1933)).toBe(2);
  });

  it("says in a drawing's description which season it is, in both languages, and only when a year is given", () => {
    expect(describeDrawing({ sport: "nba", year: 1979 }).description).toContain("1979–80");
    expect(describeDrawing({ sport: "nba", year: 1979, language: "ja" }).description).toContain("1979–80シーズン");
    expect(describeDrawing({ sport: "nfl", year: 1974 }).description).toContain("The markings are those of the 1974 season.");
    expect(describeDrawing({ sport: "nba" }).description).not.toContain("season");
    expect(describeDrawing({ sport: "ifaf", year: 1999 }).description).not.toContain("1999");
    expect(describeDrawing({ sport: "mlb", year: 1915, park: "polo-grounds" }).description).toContain("1915");
  });

  it("ignores the year for the IFAF's field, and draws today's when the year is today", () => {
    expect(drawKyogijo({ sport: "ifaf", year: 1950, id: "x", description: "d" })).toBe(drawKyogijo({ sport: "ifaf", id: "x", description: "d" }));
    for (const sport of ["nfl", "cfl", "nhl", "nba", "mlb"] as const) expect(drawKyogijo({ sport, year: ERA_CURRENT, id: "x", description: "d" }), sport).toBe(drawKyogijo({ sport, id: "x", description: "d" }));
  });

  it("draws every sport in every season of its history as well-formed SVG", () => {
    for (const sport of ERA_SPORTS) {
      const { from, to } = eraRange(sport);
      const changes = [from, to, ...eraChanges(sport).flatMap((c) => [(c.from as number) - 1, c.from as number])];
      for (const year of changes) {
        for (const options of [{ sport, year }, { sport, year, orientation: "portrait" as const }, { sport, year, detail: "simple" as const }]) {
          const svg = parse(drawKyogijo({ ...options, id: "w" }));
          expect(walk(svg).length, `${sport} ${year}`).toBeGreaterThan(20);
        }
      }
    }
  });
});
