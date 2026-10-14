import { describe, expect, it } from "vitest";
import { mlbBalls, nbaShots, nflPasses, nhlShots, soccerShots } from "../demo/charts-data.js";
import { ballType, mlbSprayChart } from "./charts.baseball.ts";
import { clean, foldToRight } from "./charts.ts";
import { nbaShotChart, nflPassChart, nhlShotMap, soccerGoalMouth, soccerShotMap } from "./charts-entry.ts";
import type { Chart } from "./charts.types.ts";
import { hash } from "./format.ts";
import { frameByName } from "./frames.ts";
import { fenceAt } from "./geometry.ts";
import { fenceFor, parkById } from "./parks.ts";
import type { Layer, PointsLayer } from "./layers.types.ts";
import { renderLayers } from "./layers.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const parse = (svg: string): Node => parseXml(svg);

/** The drawing's structure: how many of each element and class it is made of, which a drawing's look is made of. */
function structure(svg: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of walk(parse(svg))) {
    const key = node.attrs.class === undefined ? node.name : `${node.name}.${node.attrs.class.split(" ").sort().join(".")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}
const ids = (svg: string): string[] => walk(parse(svg)).flatMap((n) => (n.attrs.id === undefined ? [] : [n.attrs.id]));
const layerOf = <T = Layer>(chart: Chart<unknown>, id: string): T => {
  const layer = chart.layers.find((l) => l.id === id);
  if (layer === undefined) throw new Error(`no layer ${id}`);
  return layer as unknown as T;
};
/** The counts of each zone, by id, as `[made, taken]`. */
const byZone = (zones: { id: string; made: number; taken: number }[]): Record<string, [number, number]> => Object.fromEntries(zones.map((z) => [z.id, [z.made, z.taken]]));

// The same made-up data as the demo's, from fixed seeds.
const fence1915 = fenceFor(parkById("polo-grounds"), undefined, 1915);
const demo = {
  nba: () => nbaShotChart(nbaShots(420), { league: 46, id: "t-nba" }),
  nhl: () => nhlShotMap(nhlShots(), { fold: true, zones: true, statistic: "goals", id: "t-nhl" }),
  mlb: () => mlbSprayChart(mlbBalls((angle: number) => fenceAt(fence1915, angle)), { park: "polo-grounds", year: 1915, bats: "R", zones: true, id: "t-mlb" }),
  nfl: () => nflPassChart(nflPasses(), { los: 62, id: "t-nfl" }),
  soccer: () => soccerShotMap(soccerShots(), { provider: "statsbomb", half: true, goalUnit: "yd", id: "t-soccer" }),
};

describe("every chart", () => {
  for (const [name, make] of Object.entries(demo)) {
    for (const language of ["en", "ja"] as const) {
      it(`${name}: a well-formed drawing in ${language}, with a title, a description, unique ids, and a title and description for each layer`, () => {
        const chart = name === "nba" ? nbaShotChart(nbaShots(60), { league: 46, language, id: "w" }) : make();
        const svg = parse(chart.draw({ language }));
        const root = walk(svg).find((n) => n.name === "title");
        expect(root?.text.length).toBeGreaterThan(3);
        const desc = walk(svg).find((n) => n.name === "desc");
        expect(desc?.text).toContain(KYOGIJO_STRINGS[language].layers.data);
        const all = ids(chart.draw({ language }));
        expect(new Set(all).size).toBe(all.length);
        const groups = withClass(svg, "ky-layer");
        expect(groups.length).toBe(chart.layers.length);
        for (const group of groups) {
          expect(group.children[0].name).toBe("title");
          expect(group.children[0].text.length).toBeGreaterThan(0);
        }
      });
    }

    it(`${name}: the same input draws the same drawing, and a fingerprint of the chart's own marks holds it`, () => {
      const a = make().draw();
      expect(make().draw()).toBe(a);
      // The layers alone, so that a change to a surface's markings (which the surface's own tests hold) does not change the chart's fingerprint.
      const chart = make();
      expect(hash(renderLayers(chart.options, chart.layers).svg)).toMatchSnapshot();
    });

    it(`${name}: what the chart's marks are made of`, () => {
      const chart = make();
      expect(structure(renderLayers(chart.options, chart.layers).svg)).toMatchSnapshot();
    });

    it(`${name}: the layers are plain data (they survive JSON), and the options hold them`, () => {
      const chart = make();
      expect(JSON.parse(JSON.stringify(chart.layers))).toEqual(JSON.parse(JSON.stringify(chart.options.layers)));
      expect(chart.options.layers).toBe(chart.layers);
      expect(chart.draw({ style: "none" })).not.toContain("<style>:where");
    });

    it(`${name}: the table leaves out the key and has a row for each zone`, () => {
      const chart = make();
      const html = chart.table();
      expect(html).not.toContain("<caption>Key");
      expect((html.match(/<table /g) ?? []).length).toBe(chart.layers.filter((l) => !String(l.id).startsWith("key")).length);
      if (chart.layers.some((l) => l.kind === "zones")) expect(html).toContain('data-kind="zones"');
    });

    it(`${name}: a tall drawing leaves the key out, a wide one has it`, () => {
      const chart = make();
      expect(withClass(parse(chart.draw()), "ky-layer").some((n) => n.attrs.id?.endsWith("key-marks"))).toBe(true);
      expect(withClass(parse(chart.draw({ orientation: "portrait" })), "ky-layer").some((n) => n.attrs.id?.endsWith("key-marks"))).toBe(false);
    });
  }

  it("the drawings stay within their size budgets, stylesheet and key and legend in", () => {
    expect(demo.nba().draw().length).toBeLessThan(70_000);
    expect(demo.nhl().draw().length).toBeLessThan(40_000);
    expect(demo.mlb().draw().length).toBeLessThan(45_000);
    expect(demo.nfl().draw().length).toBeLessThan(35_000);
    expect(demo.soccer().draw().length).toBeLessThan(25_000);
    expect(demo.soccer().goalMouth().svg.length).toBeLessThan(16_000);
  });

  it("refuse what is not a list", () => {
    for (const make of [nbaShotChart, nhlShotMap, mlbSprayChart, nflPassChart, soccerShotMap]) expect(() => make(undefined as never)).toThrow(TypeError);
    expect(() => soccerGoalMouth(undefined as never)).toThrow(TypeError);
  });

  it("two charts of one page have ids of their own when no id is given", () => {
    const a = nbaShotChart(nbaShots(30, 1));
    const b = nbaShotChart(nbaShots(30, 2));
    expect(ids(a.draw())[0]).not.toBe(ids(b.draw())[0]);
    expect(a.options.id).toBeUndefined();
  });

  it("have a key as data, with the shape of each mark and whether it is open", () => {
    expect(demo.nba().key).toEqual([{ outcome: "made", label: "Made", shape: "circle", hollow: false }, { outcome: "missed", label: "Missed", shape: "x", hollow: true }]);
    expect(demo.nhl().key[0]).toEqual({ outcome: "goal", label: "Goal", shape: "star", hollow: false });
  });
});

describe("clean", () => {
  it("drops what is undefined and keeps the rest, falsy values included", () => {
    expect(clean({ a: 1, b: undefined, c: 0, d: "", e: null, f: false })).toEqual({ a: 1, c: 0, d: "", e: null, f: false });
  });
});

describe("nbaShotChart", () => {
  const shots = [
    { x: 0, y: 12, made: true },
    { x: 10, y: 20, made: true },
    { x: -30, y: 35, made: false },
    { x: -231, y: 18, made: true },
    { x: 231, y: 18, made: false },
    { x: 120, y: 140, made: false },
    { x: 0, y: 270, outcome: "made" },
    { x: null, y: 5, made: true },
  ];

  it("counts each shot into the zone it is in, the shooter's left being LOC_X below zero", () => {
    const chart = nbaShotChart(shots, { minShots: 1 });
    expect(chart.totals).toMatchObject({ shots: 7, made: 4, percent: 57.1, skipped: 1 });
    expect(byZone(chart.totals.zones)).toEqual({
      "above-the-break": [1, 1],
      "corner-top": [1, 1],
      "corner-bottom": [0, 1],
      "mid-range": [0, 1],
      paint: [0, 1],
      "restricted-area": [2, 2],
    });
    // At the right basket the top of the drawing is the shooter's left: LOC_X -231 is the left corner three, and it went in.
    const names = Object.fromEntries(chart.totals.zones.map((z) => [z.id, z.name]));
    expect(names["corner-top"]).toBe("Left corner 3");
    expect(names["corner-bottom"]).toBe("Right corner 3");
  });

  it("puts the shots at the other basket with end: left, and the zones with them", () => {
    const right = nbaShotChart(shots, { minShots: 1 });
    const left = nbaShotChart(shots, { minShots: 1, end: "left" });
    expect(layerOf<PointsLayer>(left, "shots").attacking).toBe("left");
    expect(layerOf<PointsLayer>(right, "shots").attacking).toBeUndefined();
    // The same zones with the same shots in them, by their names (the corners swap places on the drawing, not their names).
    const byName = (chart: Chart<{ zones: { name: string; made: number; taken: number }[] }>): Record<string, number[]> => Object.fromEntries(chart.totals.zones.map((z) => [z.name, [z.made, z.taken]]));
    expect(byName(left)).toEqual(byName(right));
    expect(left.draw()).not.toBe(right.draw());
  });

  it("with the league's percentage the zones diverge from it, and without it they do not", () => {
    expect(layerOf<{ center?: number; ramp?: unknown }>(nbaShotChart(shots, { league: 46 }), "zones").center).toBe(46);
    const plain = layerOf<{ center?: number }>(nbaShotChart(shots), "zones");
    expect(plain.center).toBeUndefined();
    expect(nbaShotChart(shots, { league: 46 }).summary).toContain("league figure of 46 percent");
  });

  it("can leave out the zones, the marks, the key and the legend", () => {
    expect(nbaShotChart(shots, { zones: false }).layers.map((l) => l.id)).toEqual(["shots", "key-marks", "key-text"]);
    expect(nbaShotChart(shots, { marks: false, key: false }).layers.map((l) => l.id)).toEqual(["zones"]);
    expect(nbaShotChart(shots, { legend: false }).draw()).not.toContain('class="ky-lgw"');
    expect(nbaShotChart(shots).draw()).toContain('class="ky-lgw"');
  });

  it("has the zone chart's table with the zones as rows, and its words in Japanese", () => {
    const html = nbaShotChart(shots, { language: "ja", minShots: 1 }).table();
    expect(html).toContain("<td>リストリクテッドエリア</td>");
    expect(html).toContain("ゾーン");
    expect(nbaShotChart(shots, { language: "ja" }).title).toBe("NBAのショットチャート");
    expect(nbaShotChart(shots, { language: "ja" }).summary).toContain("シュート7本");
  });

  it("names the unit of the frame's numbers in the table: tenths of a foot", () => {
    expect(nbaShotChart(shots, { zones: false }).table()).toContain("Coordinates in nba-stats, in tenth-ft.");
  });

  it("refuses a frame it does not know", () => {
    expect(() => nbaShotChart(shots, { from: "no-such-frame" })).toThrow(/Unknown frame/);
  });

  it("the demo's shots count to the same total in the zones as in the chart", () => {
    const chart = demo.nba();
    expect(chart.totals.shots).toBe(420);
    expect(chart.totals.zones.reduce((n, z) => n + z.taken, 0)).toBe(420);
    expect(chart.totals.zones.reduce((n, z) => n + z.made, 0)).toBe(chart.totals.made);
  });
});

describe("nhlShotMap", () => {
  const shots = [
    { x: 78, y: 3, outcome: "goal", xg: 0.28, team: "home" },
    { x: -62, y: -10, outcome: "saved", xg: 0.07, team: "away" },
    { x: 48, y: 22, goal: false, xg: 0.03, team: "home" },
    { x: -70, y: 6, outcome: "blocked", xg: 0.05, team: "away" },
    { x: 10, y: null, outcome: "missed" },
  ];

  it("totals the shots, the goals, the chances and each team", () => {
    const chart = nhlShotMap(shots);
    expect(chart.totals).toMatchObject({ shots: 4, goals: 1, xg: 0.43, skipped: 1 });
    expect(chart.totals.teams).toEqual({ home: { shots: 2, goals: 1, xg: 0.31 }, away: { shots: 2, goals: 0, xg: 0.12 } });
    expect(chart.summary).toBe("Shots 4, goals 1, expected goals (xG) 0.43.");
  });

  it("folds the shots at the left end a half turn about the rink's middle, in the frame's own numbers", () => {
    const data = (nhlShotMap(shots, { fold: true }).layers.find((l) => l.id === "shots") as PointsLayer).data;
    expect(data.slice(0, 4).map((d) => [d.x, d.y])).toEqual([[78, 3], [62, 10], [48, 22], [70, -6]]);
    // Folding what is folded changes nothing.
    const again = nhlShotMap(data.map((d) => ({ x: d.x, y: d.y })), { fold: true }).layers.find((l) => l.id === "shots") as PointsLayer;
    expect(again.data.map((d) => [d.x, d.y])).toEqual(data.map((d) => [d.x, d.y]));
  });

  it("folds HockeyTech's canvas too, about its middle", () => {
    const rows = foldToRight([{ x: 100, y: 100 }, { x: 500, y: 40 }, { x: null, y: 3 }], frameByName("hockeytech"), { sport: "nhl" });
    expect(rows).toEqual([{ x: 500, y: 200 }, { x: 500, y: 40 }, { x: null, y: 3 }]);
  });

  it("sizes the marks by the chance, unless asked not to or none has one", () => {
    const size = (chart: Chart<unknown>): unknown => (layerOf<PointsLayer>(chart, "shots").style as { size?: unknown }).size;
    expect(size(nhlShotMap(shots))).toEqual({ domain: [0, 0.5], range: [1.5, 5.2] });
    expect(size(nhlShotMap(shots, { sizeBy: "none" }))).toBeUndefined();
    expect(size(nhlShotMap(shots.map((s) => ({ ...s, xg: undefined }))))).toBeUndefined();
    expect(size(nhlShotMap(shots, { xgMax: 0.8 }))).toEqual({ domain: [0, 0.8], range: [1.5, 5.2] });
  });

  it("counts into the slot zones, home plate or hexagons, and the statistic is the one asked for", () => {
    expect(nhlShotMap(shots, { zones: true, fold: true }).totals.zones.map((z) => z.id)).toEqual(["offensive-zone", "behind-goal-line", "outer-slot", "inner-slot"]);
    expect(nhlShotMap(shots, { zones: "nhl-home-plate", fold: true }).totals.zones.map((z) => z.id)).toEqual(["outside-home-plate", "home-plate"]);
    const hex = nhlShotMap(shots, { hexbin: { size: 6 } });
    expect(layerOf<{ kind: string; size?: number }>(hex, "hexagons")).toMatchObject({ kind: "hexbin", size: 6 });
    const stat = (statistic: "shots" | "xg" | "goals"): unknown => layerOf<{ statistic: unknown }>(nhlShotMap(shots, { zones: true, statistic }), "zones").statistic;
    expect([stat("shots"), stat("xg"), stat("goals")]).toEqual(["count", "sum", "rate"]);
  });

  it("zones are at one end when the shots are folded, and at both when they are not", () => {
    expect(layerOf<{ end?: string }>(nhlShotMap(shots, { zones: true, fold: true }), "zones").end).toBe("right");
    expect(layerOf<{ end?: string }>(nhlShotMap(shots, { zones: true }), "zones").end).toBeUndefined();
    expect(nhlShotMap(shots, { zones: true }).totals.zones.map((z) => z.id)).toContain("inner-slot-left");
  });

  it("has a mark for each outcome: a goal a star, a miss an x, a block a triangle, a save open", () => {
    const style = (layerOf<PointsLayer>(nhlShotMap(shots), "shots").style as { outcomes: Record<string, { shape?: string; hollow?: boolean }> }).outcomes;
    expect(style.goal.shape).toBe("star");
    expect(style.missed.shape).toBe("x");
    expect(style.blocked.shape).toBe("triangle");
    expect(style.saved.hollow).toBe(true);
  });

  it("the key says the size and the total", () => {
    const text = layerOf<{ data: { text: string }[] }>(nhlShotMap(shots), "key-text").data.map((d) => d.text);
    expect(text).toContain("Size: xG");
    expect(text).toContain("xG 0.43");
    expect(nhlShotMap(shots, { language: "ja" }).draw()).toContain("xG合計 0.43");
  });
});

describe("nflPassChart", () => {
  const passes = [
    { x: 70, y: 20, outcome: "complete" },
    { x: 78, y: 30, outcome: "incomplete" },
    { x: 95, y: 26, outcome: "complete" },
    { x: 112, y: 12, outcome: "touchdown" },
    { x: 66, y: 40, outcome: "interception" },
    { x: 55, y: 26, outcome: "complete" },
  ];
  const airOf = (chart: Chart<unknown>): (number | null | undefined)[] => layerOf<PointsLayer>(chart, "passes").data.map((d) => d.value);

  it("works out the air yards from the line of scrimmage: 8 yards when it came down 8 yards past it", () => {
    expect(airOf(nflPassChart(passes, { los: 62 }))).toEqual([8, 16, 33, 50, 4, -7]);
    expect(airOf(nflPassChart([{ x: 70, y: 20, airYards: 9 }], { los: 62 }))).toEqual([9]);
  });

  it("goes the other way when the offence did: the same chart, turned", () => {
    // A half turn of the field: the way along and the way across both reversed.
    const left = passes.map((p) => ({ ...p, x: 120 - p.x, y: 160 / 3 - p.y }));
    const a = nflPassChart(passes, { los: 62 });
    const b = nflPassChart(left, { los: 58, direction: "left" });
    expect(airOf(b)).toEqual(airOf(a));
    expect(b.totals.zones).toEqual(a.totals.zones);
    expect(layerOf<PointsLayer>(b, "passes").attacking).toBe("left");
  });

  it("counts a touchdown as a completion, in the totals and in the grid", () => {
    const chart = nflPassChart(passes, { los: 62, minPasses: 1 });
    expect(chart.totals).toMatchObject({ passes: 6, complete: 4, touchdowns: 1, interceptions: 1, percent: 66.7, airYards: 17.3 });
    // The passer's left is the top of the drawing when the offence goes right, and the middle is between the hash marks (70 feet 9 inches from each sideline).
    expect(byZone(chart.totals.zones)).toEqual({
      "short-left": [0, 1],
      "short-middle": [1, 1],
      "short-right": [1, 1],
      "deep-left": [0, 1],
      "deep-middle": [1, 1],
      "deep-right": [1, 1],
    });
  });

  it("draws the line of scrimmage at the line, arrows only when asked for and only for passes with a passer", () => {
    const chart = nflPassChart([{ x: 70, y: 20, fromX: 55, fromY: 26, outcome: "complete" }, { x: 80, y: 30 }], { los: 62, arrows: true });
    const line = layerOf<{ data: { x: number }[] }>(chart, "los");
    expect(line.data[0].x).toBe(186);
    expect(layerOf<{ data: unknown[] }>(chart, "arrows").data).toHaveLength(1);
    expect(nflPassChart(passes).layers.some((l) => l.id === "arrows")).toBe(false);
    expect(nflPassChart(passes, { line: false }).layers.some((l) => l.id === "los")).toBe(false);
  });

  it("has a key with only the outcomes it has, completions and incompletions always", () => {
    expect(nflPassChart([{ x: 70, y: 20, outcome: "complete" }]).key.map((k) => k.outcome)).toEqual(["complete", "incomplete"]);
    expect(nflPassChart(passes).key.map((k) => k.outcome)).toEqual(["complete", "incomplete", "touchdown", "interception"]);
  });
});

describe("mlbSprayChart", () => {
  it("reads the words of Statcast and the usual short forms", () => {
    expect(["home_run", "HR", "Homer", "single", "1B", "field_out", "grounded_into_double_play", "double_play", "sac_fly", "fielders_choice", "double", "triple", "force_out", "error", "walk"].map((t) => ballType(t))).toEqual([
      "home run", "home run", "home run", "single", "single", "out", "out", "out", "out", "out", "double", "triple", "out", "error", "walk",
    ]);
    expect(ballType(undefined)).toBeUndefined();
    expect(ballType("  ")).toBeUndefined();
  });

  it("draws the park of the season, with the fence it had, and a ball beyond it is beyond in that season only", () => {
    const deep = [{ x: 125.42, y: 198.27 - 450 / 2.5, type: "home_run" }];
    const in1915 = mlbSprayChart(deep, { park: "polo-grounds", year: 1915 });
    const in1950 = mlbSprayChart(deep, { park: "polo-grounds", year: 1950 });
    expect([in1915.totals.beyondFence, in1950.totals.beyondFence]).toEqual([1, 0]);
    expect(in1915.options).toMatchObject({ sport: "mlb", park: "polo-grounds", year: 1915 });
    expect(in1915.layers.map((l) => l.id)).toEqual(["balls", "beyond", "key-marks", "key-text"]);
    expect(in1950.layers.map((l) => l.id)).toEqual(["balls", "key-marks", "key-text"]);
    expect(in1915.summary).toContain("Beyond the fence: 1.");
    expect(in1915.draw()).not.toBe(in1950.draw());
  });

  it("holds a ball beyond the fence on the drawing, over the ground round the fence", () => {
    const beyond = layerOf<{ clip?: string; limits?: { x: number[]; y: number[] } }>(mlbSprayChart([{ x: 125.42, y: -300, type: "home_run" }], { park: "fenway-park", margin: 30 }), "beyond");
    expect(beyond.clip).toBe("none");
    expect(beyond.limits?.y[0]).toBeGreaterThan(-450);
    expect(mlbSprayChart([], { margin: 30 }).options.margin).toBe(30);
    expect(mlbSprayChart([]).options.margin).toBe(40);
  });

  it("puts a Retrosheet zone at the centre of its sector, in whichever frame the chart is in", () => {
    const feet = layerOf<PointsLayer>(mlbSprayChart([{ zone: "8D", type: "single" }], { from: "retrosheet" }), "balls").data[0];
    expect([feet.x, feet.y]).toEqual([0, 330]);
    const px = layerOf<PointsLayer>(mlbSprayChart([{ zone: "8D", type: "single" }]), "balls").data[0];
    expect(px.x).toBeCloseTo(125.42, 1);
    expect(px.y).toBeCloseTo(198.27 - 330 / 2.5, 1);
    expect(mlbSprayChart([{ zone: "nowhere", type: "single" }]).totals).toMatchObject({ balls: 0, skipped: 1 });
  });

  it("counts by type, in the order of the key, and into the spray zones by the side the batter bats from", () => {
    const balls = [{ x: 125.4, y: 100, type: "single" }, { x: 90, y: 120, type: "double" }, { x: 140, y: 120, type: "field_out" }, { x: 100, y: 90, type: "out" }];
    const right = mlbSprayChart(balls, { zones: true });
    expect(right.totals.types).toEqual({ single: 1, double: 1, out: 2 });
    expect(right.key.map((k) => k.outcome)).toEqual(["single", "double", "out"]);
    expect(right.totals.zones.map((z) => z.id)).toEqual(["pull-infield", "centre-infield", "opposite-infield", "pull-outfield", "centre-outfield", "opposite-outfield"]);
    const left = mlbSprayChart(balls, { zones: true, bats: "L" });
    expect(left.totals.zones.map((z) => z.id)).toEqual(["opposite-infield", "centre-infield", "pull-infield", "opposite-outfield", "centre-outfield", "pull-outfield"]);
    expect(mlbSprayChart(balls, { zones: true, bats: "none" }).totals.zones.map((z) => z.id)).toEqual(["left-infield", "centre-infield", "right-infield", "left-outfield", "centre-outfield", "right-outfield"]);
    expect(mlbSprayChart(balls, { zones: "baseball-retrosheet" }).totals.zones.length).toBe(68);
  });

  it("a hit rate counts the singles, doubles, triples and home runs", () => {
    const balls = [{ x: 125.4, y: 100, type: "single" }, { x: 125.4, y: 110, type: "out" }];
    const chart = mlbSprayChart(balls, { zones: true, statistic: "hit-rate" });
    const zone = chart.totals.zones.find((z) => z.taken > 0);
    expect(zone).toMatchObject({ taken: 2, made: 1, percent: 50 });
  });

  it("gives each hit type its own shape as well as its fill", () => {
    const style = (layerOf<PointsLayer>(mlbSprayChart([{ x: 125, y: 100, type: "single" }]), "balls").style as { outcomes: Record<string, { shape?: string; hollow?: boolean }> }).outcomes;
    expect([style.single.shape, style.double.shape, style.triple.shape, style["home run"].shape, style.out.hollow]).toEqual([undefined, "diamond", "triangle", "star", true]);
  });

  it("refuses a park it does not know, and takes the generic one", () => {
    expect(() => mlbSprayChart([], { park: "nowhere-park" })).toThrow(/Unknown park/);
    expect(mlbSprayChart([], { park: "generic" }).options.park).toBe("generic");
  });
});

describe("soccerShotMap", () => {
  const shots = [
    { x: 104, y: 36, outcome: "goal", xg: 0.31, goalY: -1.2, goalZ: 0.6, team: "home" },
    { x: 98, y: 50, outcome: "saved", xg: 0.08, goalY: 2.4, goalZ: 1.1, team: "home" },
    { x: 90, y: 30, outcome: "missed", xg: 0.04, goalY: 5, goalZ: 0.5, team: "away" },
    { x: 84, y: 40, goal: false, xg: 0.05 },
  ];

  it("draws the provider's pitch, the half the shots attack when asked, and says so in the options", () => {
    const chart = soccerShotMap(shots, { provider: "statsbomb", half: true });
    expect(chart.options).toMatchObject({ sport: "soccer", pitchType: "statsbomb", half: "right" });
    expect(soccerShotMap(shots, { half: "left" }).options.half).toBe("left");
    expect(soccerShotMap(shots).options.half).toBeUndefined();
    expect(soccerShotMap(shots).options.pitchType).toBe("international");
    expect(chart.draw()).toContain('data-sport="soccer"');
  });

  it("totals the shots, the goals, the chances and each team's", () => {
    const chart = soccerShotMap(shots, { provider: "statsbomb" });
    expect(chart.totals).toMatchObject({ shots: 4, goals: 1, xg: 0.48 });
    expect(chart.totals.teams).toEqual({ home: { shots: 2, goals: 1, xg: 0.39 }, away: { shots: 1, goals: 0, xg: 0.04 } });
    expect(chart.summary).toBe("Shots 4, goals 1, expected goals (xG) 0.48.");
  });

  it("sizes the marks by the chance, and without one draws them alike", () => {
    expect((layerOf<PointsLayer>(soccerShotMap(shots), "shots").style as { size?: unknown }).size).toEqual({ domain: [0, 0.8], range: [3.2, 13] });
    expect((layerOf<PointsLayer>(soccerShotMap(shots, { xg: false }), "shots").style as { size?: unknown }).size).toBeUndefined();
    expect(soccerShotMap(shots.map((s) => ({ ...s, xg: undefined })), {}).totals.xg).toBeNull();
  });

  it("centres the key on the half that is shown", () => {
    const marks = layerOf<PointsLayer>(soccerShotMap(shots, { provider: "statsbomb", half: true }), "key-marks").data.map((d) => d.x as number);
    expect(Math.min(...marks)).toBeGreaterThan(344 / 2);
    const whole = layerOf<PointsLayer>(soccerShotMap(shots, { provider: "statsbomb" }), "key-marks").data.map((d) => d.x as number);
    expect(Math.min(...whole)).toBeLessThan(344 / 2);
  });

  it("turns shots that attack the left, as every layer does", () => {
    expect(layerOf<PointsLayer>(soccerShotMap(shots, { attacking: "left" }), "shots").attacking).toBe("left");
  });

  it("takes a frame of its own for the marks and draws the pitch as usual", () => {
    const own = { ...frameByName("statsbomb"), name: "my-frame" };
    const chart = soccerShotMap(shots, { provider: own });
    expect(chart.options.pitchType).toBeUndefined();
    expect(layerOf<PointsLayer>(chart, "shots").from).toBe(own);
  });
});

describe("the goal-mouth view", () => {
  const shots = [
    { x: 104, y: 36, outcome: "goal", xg: 0.31, goalY: -1.2, goalZ: 0.6 },
    { x: 98, y: 50, outcome: "saved", goalY: 2.4, goalZ: 1.1 },
    { x: 90, y: 30, outcome: "missed", goalY: 5, goalZ: 0.5 },
    { x: 84, y: 40, outcome: "blocked" },
  ];

  it("places the shots across the goal and counts the ones with no place, a block among them", () => {
    const view = soccerGoalMouth(shots);
    expect([view.placed, view.skipped]).toEqual([3, 1]);
    expect(view.svg).toContain("Goal mouth: where the shots crossed the goal line");
    expect(view.svg.startsWith("<svg")).toBe(true);
    expect(parse(view.svg).attrs["data-sport"]).toBe("soccer");
  });

  it("reads the unit it is given: yards become metres in the layer, and the table says the frame's unit", () => {
    const yards = soccerGoalMouth(shots, { unit: "yd" });
    const metres = soccerGoalMouth(shots);
    const first = (v: typeof metres): { x?: number | null; y?: number | null } => (v.layers[0] as PointsLayer).data[0];
    expect(first(yards).x).toBeCloseTo(-1.2 * 0.9144, 3);
    expect(first(metres).x).toBe(-1.2);
    expect(metres.table()).toContain("Coordinates in goal-mouth, in m.");
  });

  it("is the shooter's view: positive goalY is to the right, and the frame of the goal is drawn at the Laws' size", () => {
    const view = soccerGoalMouth([{ x: 1, y: 1, goalY: 3, goalZ: 1 }, { x: 1, y: 1, goalY: -3, goalZ: 1 }]);
    const [right, left] = (view.layers[0] as PointsLayer).data;
    expect((right.x as number) > 0 && (left.x as number) < 0).toBe(true);
    const doc = parse(view.svg);
    const post = withClass(doc, "ky-goal")[0];
    // 7.32 metres between the posts, in feet.
    const d = post.attrs.d.match(/^M([\d.]+) ([\d.]+)V([\d.]+)H([\d.]+)V/);
    expect(Number(d?.[4]) - Number(d?.[1])).toBeCloseTo(7.32 * 3.2808, 1);
    expect(soccerGoalMouth([], { goal: { width: 3, height: 2 } }).svg).toContain("The goal frame, 3 by 2 metres");
  });

  it("is in Japanese too, and takes the page's stylesheet when asked", () => {
    expect(soccerGoalMouth(shots, { language: "ja" }).svg).toContain("ゴールマウス");
    expect(soccerGoalMouth(shots, { style: "none" }).svg).not.toContain("<style>");
    expect(soccerGoalMouth(shots).svg).toContain("<style>");
  });

  it("is the same view whether it comes from the map or by itself, and the map names its unit", () => {
    const map = soccerShotMap(shots, { goalUnit: "yd", id: "m" });
    expect(map.goalMouth().svg).toBe(soccerGoalMouth(shots, { unit: "yd", id: "m-goal", xg: true }).svg);
  });

  it("is a well-formed drawing with a title, a description and ids of its own", () => {
    const doc = parse(soccerGoalMouth(shots, { id: "g" }).svg);
    expect(walk(doc).find((n) => n.name === "desc")?.text).toContain("seen from the front");
    expect(withClass(doc, "ky-layer")).toHaveLength(1);
    expect(soccerGoalMouth(shots, { id: "g" }).svg).toBe(soccerGoalMouth(shots, { id: "g" }).svg);
  });

  it("the table of the view is not the table of the map", () => {
    const map = soccerShotMap(shots, { provider: "statsbomb" });
    expect(map.table()).not.toContain("goal-mouth");
  });
});
