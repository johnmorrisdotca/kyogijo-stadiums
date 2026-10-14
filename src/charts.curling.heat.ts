// The curling heat chart: where the stones of many ends came to rest, counted into square cells, hexagons, a density or the zones of the house (the button, the rings and the
// free guard zone), or drawn as translucent discs in each team's colour so that stones that fall on each other build up colour. The idea of the chart is the heat map of the
// stones' resting places and the map of the free guards that the analyses of curlovision (BSD) and Jordan Myslik's curling analytics show; the code is written for this package on
// the heat layers, with the rules of `curlingScore` for which stones are in play and in the house and `curlingFreeGuards` for the guards.
import { curlingFreeGuards } from "./curling.stats.ts";
import { curlingScore, CURLING_COLORS } from "./charts.curling.ts";
import { assemble, clean, drawingOptions, languageOf, percentOf, wordsOf } from "./charts.ts";
import type { Chart, CurlingHeatOptions, CurlingHeatTotals, CurlingStone, KeyItem } from "./charts.types.ts";
import { STONE_DIAMETER } from "./geometry.ts";
import { sheetFor } from "./sheet.ts";
import { shownIce, teesOf } from "./surfaces/curling.ts";
import { foldCrop } from "./surfaces/curling.fold.ts";
import { zoneCounts } from "./heat.ts";
import type { ZonesLayer } from "./heat.types.ts";
import { envFor } from "./layers.env.ts";
import type { Layer, PointDatum } from "./layers.types.ts";
import { fill } from "./strings.ts";
import type { SheetStyle } from "./types.ts";
import { convertLength, isUnit } from "./units.ts";

const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/**
 * A heat chart of the stones of many ends on a house: where they came to rest, counted into cells (`heatmap`, `hexbin`), a density (`contour`), the zones of the house (`zones`) or
 * drawn as translucent discs in their team's colours (`discs`). Only stones in play are drawn, as `curlingScore` judges them. `team` keeps one team's stones, and `only` the free
 * guards or the stones in the house, so that "where do the guards of the team with the hammer end up" is one call. Places are feet from the button, as for `curlingStones`; give
 * the stones of every end together. The totals say how many stones were drawn, the free guards and the stones in the house for each team, and the share in each zone.
 * @example
 * ```ts
 * import { curlingHeat } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const stones = [
 *   { x: 0.3, y: 0.2, team: "home" },
 *   { x: -1.1, y: 0.9, team: "away" },
 *   { x: 0.1, y: -14, team: "away" },
 *   { x: 2.4, y: -17, team: "home" },
 *   { x: 0, y: -10, team: "home" },
 * ];
 * const chart = curlingHeat(stones, { only: "guards", view: "discs" });
 * console.log(chart.totals.drawn, chart.totals.guards, chart.totals.house);
 * // 3 { home: 2, away: 1 } { home: 1, away: 1 }
 * ```
 */
export function curlingHeat(stones: readonly CurlingStone[], options: CurlingHeatOptions = {}): Chart<CurlingHeatTotals> & { key: KeyItem[] } {
  if (!Array.isArray(stones)) throw new TypeError("stones is a list of stones");
  const view = options.view ?? "heatmap";
  if (!["heatmap", "hexbin", "contour", "zones", "discs"].includes(view)) throw new RangeError(`Unknown view "${String(view)}": use heatmap, hexbin, contour, zones or discs`);
  const only = options.only ?? "all";
  if (!["all", "guards", "house"].includes(only)) throw new RangeError(`Unknown only "${String(only)}": use all, guards or house`);
  const unit = options.units ?? "ft";
  if (!isUnit(unit)) throw new RangeError(`Unknown units "${String(unit)}": use one of ft, in, yd, m, cm, mm`);
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const house = options.house === "right" ? "right" : "left";
  const surface = options.surface ?? {};
  const sheet: SheetStyle = { show: options.show ?? "half", end: house, guardZone: true, ...(surface.sheet ?? {}) };
  const o = drawingOptions("curling", { ...options, surface: { ...surface, sheet, colors: { layerHome: CURLING_COLORS.home, layerAway: CURLING_COLORS.away, ...(surface.colors ?? {}) } } }, w.titleCurlingHeat, { margin: 4.5 });
  const feet = (value: number): number => convertLength(value, unit, "ft");
  const judged = curlingScore(stones, { units: unit });
  const guards = curlingFreeGuards(stones, { units: unit });
  const guardSet = new Set(guards.indices);
  const teamOf = (s: CurlingStone): string => (typeof s.team === "string" && s.team !== "" ? s.team : "home");
  const count = { guards: { home: 0, away: 0 }, house: { home: 0, away: 0 } };
  const kept: PointDatum[] = [];
  let inPlay = 0;
  for (const r of judged.results) {
    if (!r.inPlay) continue;
    inPlay += 1;
    const s = stones[r.index];
    const team = teamOf(s);
    if (guardSet.has(r.index) && (team === "home" || team === "away")) count.guards[team] += 1;
    if (r.inHouse && (team === "home" || team === "away")) count.house[team] += 1;
    if (options.team !== undefined && team !== options.team) continue;
    if (only === "guards" && !guardSet.has(r.index)) continue;
    if (only === "house" && !r.inHouse) continue;
    kept.push(clean({ x: feet(s.x as number), y: feet(s.y as number), team, title: s.title }));
  }
  const at = { from: "curling", units: "ft" as const, ...(house === "left" ? { attacking: "left" as const } : {}) };
  // The cells are a foot square by default: the bins are counted across the sheet's length, and a cell that holds no stone is not drawn.
  const cell = isNum(options.cell) && options.cell > 0 ? options.cell : 1;
  const plan = sheetFor(o);
  const bins = Math.min(400, Math.max(1, Math.round(plan.spec.length / cell)));
  // The colour bar is sized and placed against the part of the sheet that is drawn: the half or the house, or on a folded sheet the house end the stones are at, where its panel shows it large.
  const region = plan.show === "folded" ? ((crop) => ({ x: crop.x, y: 0, w: crop.w, h: plan.spec.width }))(foldCrop(plan.spec, teesOf(plan.spec)[house === "left" ? 0 : 1], house, plan.panels)) : shownIce(plan.spec, plan.show, plan.end);
  const heat = { name: w.curlingHeatStat, statistic: "count" as const, statisticName: w.curlingHeatStat, ramp: options.ramp, legend: options.legend === false ? undefined : { position: "bottom" as const, region }, labels: options.labels === true ? true : undefined, ground: "none" as const, minCount: 1 };
  const layers: Layer[] = [];
  if (view === "heatmap") layers.push(clean({ kind: "heatmap" as const, id: "heat", ...at, data: kept, bins, ...heat }));
  else if (view === "hexbin") layers.push(clean({ kind: "hexbin" as const, id: "heat", ...at, data: kept, size: cell, ...heat }));
  else if (view === "contour") layers.push(clean({ kind: "contour" as const, id: "heat", ...at, data: kept, ...heat }));
  else if (view === "zones") layers.push(clean({ kind: "zones" as const, id: "heat", ...at, zones: "curling-house" as const, end: house, data: kept, ...heat, labels: options.labels === false ? undefined : true }));
  else layers.push({ kind: "points", id: "discs", name: w.curlingStone, ...at, data: kept, style: { size: STONE_DIAMETER, opacity: 0.35 } });
  // The zones of the house, counted for the totals whichever way the stones are drawn.
  const counter: ZonesLayer = { kind: "zones", id: "zones", ...at, zones: "curling-house", end: house, data: kept };
  const zones = zoneCounts(counter, envFor(o, false)).map((z) => ({ id: z.id, name: z.name, stones: z.n, share: percentOf(z.n, kept.length) }));
  const kinds: string[] = [];
  if (options.team !== undefined) kinds.push(fill(w.curlingHeatTeam, { name: options.team === "away" ? options.names?.away ?? all.said.away : options.names?.home ?? all.said.home }));
  if (only === "guards") kinds.push(w.curlingHeatGuards);
  if (only === "house") kinds.push(w.curlingHeatHouse);
  const parts = [fill(w.sumCurlingHeat, { n: inPlay, house: count.house.home + count.house.away, guards: count.guards.home + count.guards.away }), ...kinds];
  const totals: CurlingHeatTotals = { stones: judged.stones, inPlay, drawn: kept.length, guards: count.guards, house: count.house, zones, skipped: judged.skipped };
  const chart = assemble(o, layers, { title: w.titleCurlingHeat, summary: parts.join(all.said.gap), totals });
  chart.key = [];
  return chart;
}
