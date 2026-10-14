// Curling's statistics and the heat chart of stones: the free guards, the stones in play, the hammer through a game, the shots, and the chart on the heat layers.
import { describe, expect, it } from "vitest";
import { curlingHeat } from "./charts.curling.heat.ts";
import { curlingEndStats, curlingFreeGuards, curlingGuardScores, curlingHammers, curlingInPlay, curlingIsHit, curlingShotStats } from "./curling.stats.ts";
import { drawKyogijo } from "./draw.ts";
import { parseXml, walk } from "./xml.fixture.ts";

describe("curlingFreeGuards", () => {
  it("counts the stones in play between the tee line and the hog line, outside the house", () => {
    const guards = curlingFreeGuards([
      { x: 0.2, y: -11, team: "home" },
      { x: -2, y: -16, team: "away" },
      { x: 0.5, y: 0.5, team: "home" },
      { x: 3, y: -19, team: "away" },
      // Short of the hog line, past the tee line, and out at the side: none of them is a free guard.
      { x: 0, y: -25, team: "home" },
      { x: 0, y: 3, team: "home" },
      { x: 7.7, y: -12, team: "away" },
    ]);
    expect(guards.indices).toEqual([0, 1, 3]);
    expect([guards.home, guards.away]).toEqual([1, 2]);
  });

  it("does not count a stone that touches the house, and takes a unit", () => {
    // A stone is a little over 11 inches across: its centre 6.4 feet from the button touches the 12-foot circle, so it is in the house; 6.6 feet does not.
    expect(curlingFreeGuards([{ x: 0, y: -6.4, team: "home" }]).indices).toEqual([]);
    expect(curlingFreeGuards([{ x: 0, y: -6.6, team: "home" }]).indices).toEqual([0]);
    expect(curlingFreeGuards([{ x: 0, y: -3.5, team: "home" }], { units: "m" }).indices).toEqual([0]);
  });

  it("counts a team that is not home or away by its name", () => {
    expect(curlingFreeGuards([{ x: 0, y: -12, team: "gulls" }]).others).toEqual({ gulls: 1 });
  });
});

describe("curlingInPlay", () => {
  it("counts the stones in play after each throw and finds the most", () => {
    const end = curlingInPlay([[{ x: 0, y: -12 }], [{ x: 0, y: -12 }, { x: 1, y: 0 }], [{ x: 1, y: 0 }, { x: 0, y: 40 }]]);
    expect(end).toEqual({ counts: [1, 2, 1], max: 2, at: 1 });
    expect(curlingInPlay([])).toEqual({ counts: [], max: 0, at: -1 });
    expect(() => curlingInPlay(undefined as never)).toThrow(TypeError);
  });
});

describe("the hammer through a game", () => {
  const ends = [{ home: 2, away: 0 }, { home: 0, away: 1 }, { home: 0, away: 1 }, { home: 1, away: 0 }, { home: 0, away: 2 }, { home: 0, away: 0 }];

  it("goes to the team that did not score, and stays after a blank end", () => {
    expect(curlingHammers(ends, "home")).toEqual(["home", "away", "home", "home", "away", "home"]);
    expect(curlingHammers([{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 1, away: 0 }], "away")).toEqual(["away", "away", "away"]);
    // An end that names its hammer is taken as it says.
    expect(curlingHammers([{ home: 0, away: 0 }, { home: 0, away: 0, hammer: "home" }], "away")).toEqual(["away", "home"]);
  });

  it("works out each end and each team's hammer efficiency, steals and forced ends", () => {
    const game = curlingEndStats(ends, { hammer: "home" });
    expect(game.ends).toBe(6);
    expect(game.blanks).toBe(1);
    expect([game.home.points, game.away.points]).toEqual([3, 4]);
    expect(game.records.map((r) => [r.hammer, r.scoring, r.steal, r.forced])).toEqual([
      ["home", "home", false, false],
      ["away", "away", false, true],
      ["home", "away", true, false],
      ["home", "home", false, true],
      ["away", "away", false, false],
      ["home", null, false, false],
    ]);
    expect(game.records[4]).toMatchObject({ homeTotal: 3, awayTotal: 4 });
    // Home had the hammer in four ends: it scored in two (once forced to one), was stolen from once and blanked once.
    expect(game.home.withHammer).toMatchObject({ ends: 4, scored: 2, points: 3, stolen: 1, forced: 1, multi: 1, blanked: 1, efficiency: 0.75, scoringRate: 50, forceRate: 25, stolenRate: 25, blankRate: 25 });
    expect(game.away.withHammer).toMatchObject({ ends: 2, scored: 2, points: 3, blanked: 0, efficiency: 1.5, scoringRate: 100 });
    expect(game.away.withoutHammer).toMatchObject({ ends: 4, steals: 1, points: 1, stealRate: 25 });
    expect(game.home.withoutHammer).toMatchObject({ ends: 2, steals: 0, stealRate: 0 });
  });

  it("says nothing about the hammer when it does not know who had it", () => {
    const game = curlingEndStats([{ home: 1, away: 0 }, { home: 0, away: 2 }]);
    expect(game.home.withHammer.ends).toBe(0);
    expect(game.home.withHammer.efficiency).toBeNull();
    expect(game.records[0].hammer).toBeNull();
    expect(game.home.points).toBe(1);
    expect(curlingEndStats([{ home: 1, away: 0, hammer: "away" }]).away.withHammer.stolen).toBe(1);
    expect(curlingEndStats([{ home: 1, away: 0, hammer: "away" }]).home.withoutHammer.steals).toBe(1);
  });

  it("refuses an end that is not one team's whole points", () => {
    expect(() => curlingEndStats([{ home: 1, away: 1 }])).toThrow(/both teams/);
    expect(() => curlingEndStats([{ home: -1, away: 0 }])).toThrow(/whole number/);
    expect(() => curlingEndStats([{ home: 1.5, away: 0 }])).toThrow(/whole number/);
    expect(() => curlingEndStats(undefined as never)).toThrow(TypeError);
  });
});

describe("curlingGuardScores", () => {
  const ends = [
    { hammerGuards: 0, otherGuards: 1, hammerPoints: 1, otherPoints: 0 },
    { hammerGuards: 2, otherGuards: 0, hammerPoints: 2, otherPoints: 0 },
    { hammerGuards: 1, otherGuards: 2, hammerPoints: 0, otherPoints: 1 },
    { hammerGuards: 0, otherGuards: 0, hammerPoints: 0, otherPoints: 0 },
    { hammerGuards: 4, otherGuards: 3, hammerPoints: 3, otherPoints: 0 },
  ];

  it("averages each team's points by how many guards it had out, in bands", () => {
    const t = curlingGuardScores(ends);
    expect(t.bands).toEqual(["0", "1-2", "3+"]);
    expect(t.hammer).toEqual([{ band: "0", ends: 2, average: 0.5 }, { band: "1-2", ends: 2, average: 1 }, { band: "3+", ends: 1, average: 3 }]);
    expect(t.other.map((b) => b.average)).toEqual([0, 0.5, 0]);
    expect(t.cells).toHaveLength(9);
    expect(t.cells.find((c) => c.hammer === "1-2" && c.other === "1-2")).toMatchObject({ ends: 1, hammerAverage: 0, otherAverage: 1 });
    expect(t.cells.find((c) => c.hammer === "3+" && c.other === "0")).toMatchObject({ ends: 0, hammerAverage: null, otherAverage: null });
  });

  it("leaves the blank ends out of the hammer team's averages when asked, and takes bands of its own", () => {
    expect(curlingGuardScores(ends, { blanks: false }).hammer[0]).toEqual({ band: "0", ends: 1, average: 1 });
    expect(curlingGuardScores(ends, { bands: [0, 2] }).bands).toEqual(["0-1", "2+"]);
    expect(curlingGuardScores(ends, { bands: [0, 1, 2, 3] }).bands).toEqual(["0", "1", "2", "3+"]);
  });

  it("refuses bands that do not rise from 0, and ends that are not whole numbers", () => {
    expect(() => curlingGuardScores(ends, { bands: [1, 2] })).toThrow(/rise from 0/);
    expect(() => curlingGuardScores(ends, { bands: [0, 2, 2] })).toThrow(/rise from 0/);
    expect(() => curlingGuardScores(ends, { bands: [] })).toThrow(/rise from 0/);
    expect(() => curlingGuardScores([{ hammerGuards: 1.5, otherGuards: 0, hammerPoints: 0, otherPoints: 0 }])).toThrow(/whole number/);
    expect(() => curlingGuardScores(undefined as never)).toThrow(TypeError);
  });
});

describe("curlingShotStats", () => {
  const shots = [
    { team: "home", type: "draw", score: 4 },
    { team: "home", type: "take-out", score: 3 },
    { team: "away", type: "Hit & Roll", score: 2 },
    { team: "away", type: "guard", score: 4 },
    { team: "away", type: "Draw" },
  ];

  it("gives the shot percentage, the hit rate and the types by how often they were played", () => {
    const s = curlingShotStats(shots);
    expect(s).toMatchObject({ shots: 5, scored: 4, points: 13, percent: 81.3, hits: 2, hitRate: 40, unscored: 1 });
    expect(s.teams.home).toMatchObject({ shots: 2, percent: 87.5, hits: 1, hitRate: 50 });
    expect(s.teams.away).toMatchObject({ shots: 3, scored: 2, percent: 75 });
    expect(s.types.map((t) => [t.type, t.shots, t.share])).toEqual([["draw", 2, 40], ["guard", 1, 20], ["hit and roll", 1, 20], ["take out", 1, 20]]);
    expect(s.types[0].percent).toBe(100);
  });

  it("knows the hits by type and lets a shot say", () => {
    expect(curlingIsHit({ type: "Take-Out" })).toBe(true);
    expect(curlingIsHit({ type: "hit and roll" })).toBe(true);
    expect(curlingIsHit({ type: "draw" })).toBe(false);
    expect(curlingIsHit({ type: "draw", hit: true })).toBe(true);
    expect(curlingIsHit({})).toBe(false);
  });

  it("has no percentage with no scored shot, and refuses a score outside 0 to 4", () => {
    expect(curlingShotStats([{ type: "draw" }]).percent).toBeNull();
    expect(curlingShotStats([]).hitRate).toBeNull();
    expect(() => curlingShotStats([{ score: 5 }])).toThrow(/0 to 4/);
    expect(() => curlingShotStats([{ score: -1 }])).toThrow(/0 to 4/);
    expect(() => curlingShotStats(undefined as never)).toThrow(TypeError);
  });
});

describe("curlingHeat", () => {
  const stones = [
    { x: 0.3, y: 0.2, team: "home" },
    { x: -1.1, y: 0.9, team: "away" },
    { x: 0.1, y: -14, team: "away" },
    { x: 2.4, y: -17, team: "home" },
    { x: 0, y: -10, team: "home" },
    { x: 0, y: -30, team: "home" },
  ] as const;

  it("counts the stones in play, the guards and the house for each team, and the share in each zone", () => {
    const chart = curlingHeat(stones as never);
    expect(chart.totals).toMatchObject({ stones: 6, inPlay: 5, drawn: 5, guards: { home: 2, away: 1 }, house: { home: 1, away: 1 }, skipped: 0 });
    const zone = (id: string): number | undefined => chart.totals.zones.find((z) => z.id === id)?.stones;
    expect([zone("guard-zone"), zone("button"), zone("four-foot")]).toEqual([3, 1, 1]);
    expect(chart.totals.zones.find((z) => z.id === "guard-zone")?.share).toBe(60);
    expect(chart.summary).toContain("5 stones in play: 2 in the house and 3 in the free guard zone.");
  });

  it("keeps a team's stones, or only the guards, or only the house", () => {
    expect(curlingHeat(stones as never, { team: "away" }).totals.drawn).toBe(2);
    expect(curlingHeat(stones as never, { only: "guards" }).totals.drawn).toBe(3);
    expect(curlingHeat(stones as never, { only: "house", team: "home" }).totals.drawn).toBe(1);
    expect(curlingHeat(stones as never, { only: "guards", team: "home" }).summary).toContain("Only home's stones. Only the free guards.");
    expect(curlingHeat(stones as never, { only: "guards", language: "ja" }).summary).toContain("フリーガードのみです。");
  });

  it("draws each view, on the sheet's half, house, whole or folded, with a colour bar sized to what is drawn", () => {
    for (const view of ["heatmap", "hexbin", "contour", "zones", "discs"] as const) {
      for (const show of ["half", "house", "sheet", "folded"] as const) {
        const svg = curlingHeat(stones as never, { view, show, id: "h" }).draw();
        const root = parseXml(svg);
        expect(walk(root).some((n) => (n.attrs.class ?? "").startsWith("ky-layer")), `${view} ${show}`).toBe(true);
        const legends = (svg.match(/data-kind="legend"/g) ?? []).length;
        // The colour bar is sized to the part of the sheet that is drawn; on a folded sheet it is in the strip and in each panel's copy, where the house it is against shows it large.
        expect(legends, `${view} ${show}`).toBe(view === "discs" ? 0 : show === "folded" ? 3 : 1);
      }
    }
    expect(curlingHeat(stones as never, { show: "folded", legend: false, id: "h" }).draw()).not.toContain('data-kind="legend"');
    expect(curlingHeat(stones as never, { legend: false }).draw()).not.toContain('data-kind="legend"');
  });

  it("is the same drawing, by the layers it holds, as the heat layer with the same options", () => {
    const chart = curlingHeat(stones as never, { id: "x", view: "heatmap" });
    expect(drawKyogijo(chart.options)).toBe(chart.draw());
    expect(chart.layers[0]).toMatchObject({ kind: "heatmap", from: "curling", attacking: "left", statistic: "count" });
    expect(chart.options.sheet).toMatchObject({ show: "half", guardZone: true });
    expect(chart.table()).toContain("<table");
  });

  it("puts the stones at the right house, in other units, and refuses what it does not know", () => {
    expect(curlingHeat(stones as never, { house: "right" }).layers[0]).not.toHaveProperty("attacking");
    expect(curlingHeat([{ x: 0, y: -3.5, team: "home" }], { units: "m", only: "guards" }).totals.drawn).toBe(1);
    expect(() => curlingHeat(stones as never, { view: "pie" as never })).toThrow(/heatmap, hexbin, contour, zones or discs/);
    expect(() => curlingHeat(stones as never, { only: "back" as never })).toThrow(/all, guards or house/);
    expect(() => curlingHeat(undefined as never)).toThrow(TypeError);
  });

  it("is in Japanese when asked", () => {
    const chart = curlingHeat(stones as never, { language: "ja", show: "folded", id: "j" });
    expect(chart.title).toBe("ストーンが止まった位置");
    expect(chart.draw()).toContain("上のハウス");
  });
});
