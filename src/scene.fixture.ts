// A wide run of drawings for the renderers' tests: every sport in every size and orientation, the leagues and seasons, every kind of layer, the charts and a
// frame of a replay. Each is an SVG the package wrote.
import { mlbBalls, nbaShots, nflPasses, nhlShots, soccerShots } from "../demo/charts-data.js";
import { passMap, shotHeat, shotMap, sprayChart } from "../demo/layers-data.js";
import { replayPlay, REPLAY_SURFACES } from "../demo/replay-data.js";
import { mlbSprayChart } from "./charts.baseball.ts";
import { nbaShotChart, nflPassChart, nhlShotMap, soccerShotMap } from "./charts-entry.ts";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { fenceAt } from "./geometry.ts";
import { fenceFor, parkById } from "./parks.ts";
import type { Layer } from "./layers.types.ts";
import { drawFrame } from "./replay.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

export const GAME: Omit<ScoreOptions, "sport"> = {
  away: { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" },
  home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c", logo: "https://example.com/bison.png" },
  status: "final-ot",
  competition: "Cup Final, Game 7",
  date: "June 24",
  id: "snap",
};

export interface Drawing {
  name: string;
  svg: string;
  options?: SurfaceOptions | ScoreOptions;
}

const grid = (n: number, seed: number): { x: number; y: number; value: number }[] =>
  Array.from({ length: n }, (_, i) => ({ x: 10 + ((i * 37 + seed) % 80), y: 10 + ((i * 53 + seed * 3) % 80), value: ((i * 7) % 10) / 2 }));

/** Every drawing, by name. */
export function corpus(): Drawing[] {
  const out: Drawing[] = [];
  const add = (name: string, options: SurfaceOptions | ScoreOptions): void => {
    out.push({ name, svg: drawKyogijo(options), options });
  };
  for (const sport of SPORTS) {
    add(`${sport} score`, { sport, ...GAME });
    add(`${sport} score, dark`, { sport, ...GAME, theme: "dark" });
    add(`${sport} tall and bare`, { sport, orientation: "portrait", id: "snap" });
    add(`${sport} badge`, { sport, ...GAME, size: "badge" });
    add(`${sport} compact`, { sport, ...GAME, size: "compact" });
    add(`${sport} Japanese, no stylesheet`, { sport, ...GAME, language: "ja", style: "none" });
    add(`${sport} parts`, { sport, ...GAME, parts: true, homeSide: "left" });
  }
  add("curling with pebble", { sport: "curling", id: "snap", sheet: { pebble: true } });
  for (const [sport, extra] of [
    ["nba", { league: "wnba" }],
    ["nba", { league: "fiba" }],
    ["nhl", { year: 1985 }],
    ["nfl", { year: 1975 }],
    ["mlb", { park: "fenway-park" }],
    ["mlb", { park: "polo-grounds", year: 1915 }],
    ["soccer", { pitch: "futsal" }],
    ["soccer", { pitchType: "opta" }],
    ["soccer", { half: "left" }],
    ["soccer", { stripePattern: "checks", goals: "strip" }],
    ["tennis", { court: { look: "clay" } }],
    ["tennis", { league: "itf", theme: "dark" }],
  ] as const) add(`${sport} ${JSON.stringify(extra)}`, { sport, id: "snap", ...extra } as SurfaceOptions);
  // What the styling adds: named looks, line styles, goal styles, mowing, the direction of play, axes and landmarks.
  add("styled: a look, direction, axes and landmarks", { sport: "soccer", id: "snap", look: "night", direction: {}, axes: { frame: "opta", size: { length: 105, width: 68, unit: "m" } }, landmarks: true } as never);
  add("styled: football with axes and mowing", { sport: "nfl", id: "snap", direction: {}, landmarks: true, ...GAME } as never);
  add("an unusual unit and a text label", { sport: "nba", id: "snap", units: "m", court: { baselineText: ["North", "South"] } });
  // The realistic floor: boards, stain, shadows and sheen; tall with a score and in the plain detail; and with a data layer over it.
  add("a hardwood floor", { sport: "nba", id: "snap", court: { hardwood: true, baselineText: ["North", "South"], sidelineText: "League", baselineColor: ["#1d4f91", "#8a2432"] } });
  add("a hardwood floor, tall and plain, with a score", { sport: "nba", ...GAME, orientation: "portrait", theme: "dark", court: { hardwood: { detail: "plain", seed: 5 }, sidelineText: ["Top", "Bottom"] } });
  add("a hardwood floor with shots", { sport: "nba", id: "snap", league: "fiba", court: { hardwood: true }, layers: [{ kind: "points", data: [{ x: 20, y: 25 }, { x: 70, y: 10 }] } as Layer] });

  const layer = (l: object): Layer => l as Layer;
  add("rink with shots, arrows, text and a key", { sport: "nhl", id: "snap", layers: shotMap().map(layer) });
  add("field with a pass map", { sport: "nfl", id: "snap", layers: passMap().map(layer) } as SurfaceOptions);
  add("spray chart", { sport: "mlb", id: "snap", layers: sprayChart().map(layer) });
  add("comet arrows and halo text", {
    sport: "nhl",
    id: "snap",
    layers: [
      layer({ kind: "arrows", team: "home", data: [{ x: 20, y: 20, x2: 120, y2: 60 }, { x: 40, y: 70, x2: 90, y2: 10 }], style: { comet: { taper: true } } }),
      layer({ kind: "arrows", data: [{ x: 20, y: 30, x2: 100, y2: 70 }], style: { comet: {}, dash: "dashed" } }),
      layer({ kind: "text", data: [{ x: 50, y: 50, text: "A & B <c>" }] }),
    ],
  });
  const cloud = Array.from({ length: 300 }, (_, i) => ({ x: 20 + ((i * 37) % 160), y: 8 + ((i * 53) % 70), value: (i % 9) / 2 }));
  for (const kind of ["heatmap", "hexbin", "contour"] as const) add(`nhl ${kind}`, { sport: "nhl", id: "snap", layers: [layer({ kind, data: cloud }), layer({ kind: "legend" })] });
  add("nhl zones", { sport: "nhl", id: "snap", layers: [layer({ kind: "zones", zones: "nhl-slot", data: cloud }), layer({ kind: "legend" })] });
  add("nba zones", { sport: "nba", id: "snap", layers: [layer({ kind: "zones", zones: "nba-shot", data: grid(60, 3) })] });
  add("a demo heat map", { sport: "nhl", id: "snap", layers: shotHeat(400) });
  const players = (team: string): object[] => Array.from({ length: 11 }, (_, i) => ({ x: 5 + ((i * 29) % 90), y: 5 + ((i * 41 + (team === "home" ? 0 : 17)) % 90), team, number: i + 1, id: `${team}${i + 1}` }));
  const both = [...players("home"), ...players("away")];
  for (const kind of ["voronoi", "delaunay", "hull"]) add(`soccer ${kind}`, { sport: "soccer", id: "snap", layers: [layer({ kind, data: both, from: "opta" })] });
  add("soccer formation", { sport: "soccer", id: "snap", layers: [layer({ kind: "formation", formation: "4-4-2", team: "home" })] });
  add("soccer network", { sport: "soccer", id: "snap", layers: [layer({ kind: "network", from: "opta", data: Array.from({ length: 80 }, (_, i) => ({ from: 1 + (i % 11), to: 1 + ((i * 3 + 2) % 11), x: 10 + ((i * 13) % 70), y: 10 + ((i * 17) % 70), x2: 20 + ((i * 11) % 70), y2: 15 + ((i * 7) % 70), team: "home", fromNumber: 1 + (i % 11), toNumber: 1 + ((i * 3 + 2) % 11) })) })] });

  const fence = fenceFor(parkById("polo-grounds"), undefined, 1915);
  const charts = [
    nbaShotChart(nbaShots(120), { league: 46, id: "c-nba" }),
    nhlShotMap(nhlShots(), { fold: true, zones: true, statistic: "goals", id: "c-nhl" }),
    mlbSprayChart(mlbBalls((angle: number) => fenceAt(fence, angle)), { park: "polo-grounds", year: 1915, bats: "R", zones: true, id: "c-mlb" }),
    nflPassChart(nflPasses(), { los: 62, id: "c-nfl" }),
    soccerShotMap(soccerShots(), { provider: "statsbomb", half: true, goalUnit: "yd", id: "c-soccer" }),
  ];
  for (const chart of charts) out.push({ name: `chart ${chart.options.sport}`, svg: chart.draw(), options: chart.options });
  for (const kind of ["soccer", "hockey"] as const) {
    const timeline = replayPlay(kind);
    out.push({ name: `replay ${kind}`, svg: drawFrame(REPLAY_SURFACES[kind] as SurfaceOptions, timeline, 5) });
  }
  return out;
}
