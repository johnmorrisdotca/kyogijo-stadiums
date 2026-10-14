// Ready-made charts on the data layers: a shot chart for the NBA, a shot map for the NHL, a pass chart for the NFL (here), a spray chart for
// baseball (charts.baseball.ts) and a shot map for soccer with a goal-mouth view (charts.soccer.ts). Each is a function of plain data that
// returns the layers and the drawing options to put them on, so that one call gives a good chart and the layers can still be changed.
// Written for this package. The charts match the kinds that mplsoccer (MIT, shot maps and pass maps), hockey_rink (shot maps) and sporty (MIT)
// draw; the code of GeomMLBStadiums (GPL) and of sportypy, sportyR and hockey_rink (GPL) was not read.
import { drawKyogijo } from "./draw.ts";
import { fromSurface, frameByName, toSurface, type Frame } from "./frames.ts";
import { zoneCounts } from "./heat.ts";
import type { ZoneSetId } from "./heat.types.ts";
import { isPortrait } from "./common.ts";
import { envFor, isNum, place, unitOfLayer } from "./layers.env.ts";
import { layerTable } from "./layers.ts";
import type { Layer, LayerBase, LinesLayer, MarkDatum, OutcomeStyle, PointDatum, PointStyle, PointsLayer, TextLayer } from "./layers.types.ts";
import { outlineOf } from "./outline.ts";
import { KYOGIJO_STRINGS, fill, type KyogijoWords } from "./strings.ts";
import { textWidth } from "./text.ts";
import type { Chart, ChartOptions, KeyItem, NbaShot, NbaShotOptions, NbaTotals, NflPass, NflPassOptions, NflTotals, NhlShot, NhlShotOptions, NhlTotals, ZoneTotal } from "./charts.types.ts";
import type { Language, Sport, SurfaceOptions } from "./types.ts";
import type { ZonesLayer } from "./heat.types.ts";

type ChartWords = KyogijoWords["charts"];

// ----- what the charts share

/** The language of a chart's words. */
export const languageOf = (o: ChartOptions): Language => (o.language === "ja" ? "ja" : "en");

/** The words of a chart. */
export const wordsOf = (language: Language): KyogijoWords => KYOGIJO_STRINGS[language];

export { isNum };

/** An object without the properties that are `undefined`, so that a layer is plain data and the same input gives the same JSON. */
export function clean<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/** The ground round each surface that a chart draws, in feet: room above the surface for the key. */
export const MARGIN: Readonly<Partial<Record<Sport, number>>> = Object.freeze({ nba: 9, nhl: 10, nfl: 14, cfl: 14, ifaf: 14, mlb: 40, soccer: 16 });

/** A frame by name, or the frame given. */
export const frameOf = (from: Frame | string | undefined, fallback: string): Frame => (typeof from === "object" && from !== null ? from : frameByName(from ?? fallback));

/** What a layer's `from` is: the frame given, or the name of the one asked for (a name stays a name in the layer's JSON). */
export const fromOf = (given: Frame | string | undefined, frame: Frame): Frame | string => (typeof given === "object" && given !== null ? given : frame.name);

/** The outcome words of a chart and the look of each: the shape, whether it is open, a multiple of the size. */
export type Look = OutcomeStyle;

/** One entry of a key: what it says and the outcome whose mark it shows. */
export interface KeyEntry {
  label: string;
  outcome?: string;
}

/** The drawing's options for a chart: the sport, the language, the title and the ground round the surface, then whatever the caller laid over them. */
export function drawingOptions(sport: Sport, options: ChartOptions, title: string, extra: Partial<SurfaceOptions> = {}): SurfaceOptions {
  return {
    sport,
    language: languageOf(options),
    ...(options.id === undefined ? {} : { id: options.id }),
    title,
    margin: MARGIN[sport],
    ...extra,
    ...(options.surface ?? {}),
  };
}

/**
 * The key of a chart: one row of marks and their names in the margin above the surface (drawn over the ground round it), as two layers:
 * the marks, in the look the chart's own marks have, and their words. `extra` is more words with no mark (the size of a mark, a total).
 */
export function keyLayers(o: SurfaceOptions, entries: readonly KeyEntry[], looks: Readonly<Record<string, Look>>, all: KyogijoWords, extra: readonly string[] = [], at: KeyPlace = {}): Layer[] {
  const words = all.charts;
  const sep = all.layers.listSep;
  const { box } = outlineOf(o);
  const margin = o.margin ?? 8;
  const base = Math.max(box.w, box.h) * 0.013;
  // The row is centred on the part of the surface that is shown: all of it, or the half of a pitch.
  const view = { x: at.x ?? box.x, w: at.w ?? box.w };
  const items: { text: string; mark: boolean }[] = [...entries.map((e) => ({ text: e.label, mark: true })), ...extra.map((text) => ({ text, mark: false }))];
  const widthAt = (size: number): number => items.reduce((sum, item) => sum + (item.mark ? size * 0.9 + size * 0.45 : 0) + textWidth(item.text) * size + size * 1.4, 0) - size * 1.4;
  let size = Math.min(base * 1.25, margin * 0.5);
  const room = view.w * 0.96;
  if (widthAt(size) > room) size *= room / widthAt(size);
  const y = at.y ?? box.y - margin * 0.5;
  let x = view.x + (view.w - widthAt(size)) / 2;
  const marks: PointDatum[] = [];
  const text: { x: number; y: number; text: string }[] = [];
  for (const [i, item] of items.entries()) {
    if (item.mark) {
      marks.push(clean({ x: x + size * 0.45, y, outcome: entries[i].outcome }));
      x += size * 0.9 + size * 0.45;
    }
    text.push({ x, y, text: item.text });
    x += textWidth(item.text) * size + size * 1.4;
  }
  const hollowWords = Object.fromEntries(Object.entries(looks).map(([name, look]) => [name, clean({ hollow: look.hollow, shape: look.shape, scale: look.scale })]));
  const labels = entries.map((e) => e.label).join(sep);
  const keyMarks: PointsLayer = {
    kind: "points",
    id: "key-marks",
    name: words.key,
    title: words.key,
    description: labels,
    units: "ft",
    clip: "none",
    data: marks,
    style: { size: size * 0.9, outcomes: hollowWords },
  };
  const keyText: TextLayer = {
    kind: "text",
    id: "key-text",
    name: words.key,
    title: words.key,
    description: extra.join(sep),
    units: "ft",
    clip: "none",
    data: text,
    style: { size, anchor: "start" },
  };
  return [keyMarks, keyText];
}

/** Where a key is put when it is not centred above the whole surface: the part of the surface it is centred on (`x`, `w`) and the height of the row (`y`), in feet. */
export interface KeyPlace {
  x?: number;
  w?: number;
  y?: number;
}

/** The layers of the key are named `key-marks` and `key-text`. */
export const isKey = (layer: Layer): boolean => layer.id === "key-marks" || layer.id === "key-text";

/** The key of a chart as data, from its entries and looks. */
export function keyItems(entries: readonly KeyEntry[], looks: Readonly<Record<string, Look>>): KeyItem[] {
  return entries.map((e) => ({ outcome: e.outcome ?? "", label: e.label, shape: looks[e.outcome ?? ""]?.shape ?? "circle", hollow: looks[e.outcome ?? ""]?.hollow === true }));
}

/** Put a chart together: the options, the layers and the ways to draw them. */
export function assemble<T>(options: SurfaceOptions, layers: Layer[], parts: { title: string; summary: string; totals: T; tableLayers?: readonly string[] }): Chart<T> & { key: KeyItem[] } {
  const all = { ...options, layers };
  const language = options.language === "ja" ? "ja" : "en";
  const chart = {
    options: all,
    layers,
    title: parts.title,
    summary: parts.summary,
    totals: parts.totals,
    key: [] as KeyItem[],
    draw(extra: Partial<SurfaceOptions> = {}): string {
      const merged = { ...all, ...extra };
      // The key runs along one edge of the surface as the eye sees it wide: a tall drawing leaves it out.
      const shown = extra.layers ?? (isPortrait(merged) ? layers.filter((layer) => !isKey(layer)) : layers);
      return drawKyogijo({ ...merged, layers: shown });
    },
    table(tableOptions: Omit<import("./layers.types.ts").TableOptions, "surface" | "language"> = {}): string {
      return layerTable(layers.filter((layer) => !isKey(layer) && (parts.tableLayers === undefined || parts.tableLayers.includes(layer.id ?? ""))), { ...tableOptions, language, surface: all });
    },
  };
  return chart;
}

/** `shot`s counted by outcome, as the words of the key and in the key's order, for a layer's description: "Made 3, Missed 5." */
export function describeCounts(entries: readonly KeyEntry[], counts: ReadonlyMap<string, number>, words: KyogijoWords): string {
  const list = entries
    .filter((e) => (counts.get(e.outcome ?? "") ?? 0) > 0)
    .map((e) => fill(words.layers.item, { name: e.label, n: counts.get(e.outcome ?? "") ?? 0 }))
    .join(words.layers.listSep);
  return list === "" ? "" : fill(words.layers.outcomes, { list });
}

/** Round to a number of decimal places. */
export const round = (value: number, places = 1): number => Math.round(value * 10 ** places) / 10 ** places;

/** A percent, one decimal, or null with nothing to divide. */
export const percentOf = (part: number, whole: number): number | null => (whole === 0 ? null : round((100 * part) / whole));

/** The marks counted into the zones of a layer, as zone totals. */
export function zoneTotals(o: SurfaceOptions, layer: ZonesLayer): ZoneTotal[] {
  return zoneCounts(layer, envFor(o, false)).map((z) => ({ id: z.id, name: z.name, taken: z.n, made: z.hits, percent: percentOf(z.hits, z.n) }));
}

/** Count marks by outcome, skipping the ones with no place. */
export function countOutcomes(rows: readonly { x?: number | null; y?: number | null; outcome?: string }[]): { counts: Map<string, number>; placed: number; skipped: number } {
  const counts = new Map<string, number>();
  let placed = 0;
  let skipped = 0;
  for (const row of rows) {
    if (isNum(row.x) && isNum(row.y)) {
      placed += 1;
      const key = row.outcome ?? "";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    } else skipped += 1;
  }
  return { counts, placed, skipped };
}

/** True when a mark carries a place. */
export const hasPlace = (d: MarkDatum & { x?: number | null; y?: number | null }): boolean => isNum(d.x) && isNum(d.y);

/**
 * Turn the shots at the left end of a surface a half turn so that every one is at the right end, in the numbers of the frame they are in.
 * Rounded to hundredths of the frame's unit, so that a shot at the right end comes back as it was given.
 */
export function foldToRight<T extends { x: number | null; y: number | null }>(rows: readonly T[], frame: Frame, o: SurfaceOptions): T[] {
  const { box } = outlineOf(o);
  const size = o.sport === "soccer" ? { length: box.w, width: box.h, unit: "ft" as const } : undefined;
  return rows.map((row) => {
    if (!isNum(row.x) || !isNum(row.y)) return row;
    const [sx, sy] = toSurface([[row.x, row.y]], { from: frame, size })[0];
    if (sx >= box.x + box.w / 2) return row;
    const [bx, by] = fromSurface([[box.x + box.w - (sx - box.x), box.y + box.h - (sy - box.y)]], { to: frame, size })[0];
    return { ...row, x: round(bx, 2), y: round(by, 2) };
  });
}

/** The marks' places on the surface, in feet, in the same frame and ends as a layer will draw them. */
export function placed(o: SurfaceOptions, layer: LayerBase, rows: readonly { x?: number | null; y?: number | null }[]): ([number, number] | undefined)[] {
  const env = envFor(o, false);
  const unit = unitOfLayer(layer, env);
  const at = place(layer, env, rows.filter(hasPlace).map((r): [number, number] => [r.x as number, r.y as number]), unit);
  let k = 0;
  return rows.map((r) => (hasPlace(r) ? (at[k++] as [number, number]) : undefined));
}

// ----- basketball

const NBA_LOOKS: Record<string, Look> = { made: {}, missed: { shape: "x", hollow: true } };

/**
 * A shot chart for the NBA from stats.nba.com's shot data: each shot as a mark (filled when it went in, an open x when it missed), and the
 * six shot zones coloured by their field-goal percentage, with the percentage and made over taken written on each, a legend and a table. Give
 * `league` (the league's percentage) and the zones are coloured by how far they are above or below it, on a diverging ramp.
 * @example
 * ```ts
 * import { nbaShotChart } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const chart = nbaShotChart(
 *   [
 *     { x: 0, y: 12, made: true },
 *     { x: -231, y: 18, made: false },
 *     { x: 120, y: 140, made: true },
 *     { x: -30, y: 70, made: true },
 *   ],
 *   { league: 46, minShots: 1 },
 * );
 * console.log(chart.totals.shots, chart.totals.made, chart.layers.map((layer) => layer.kind).join(" "));
 * console.log(chart.draw().startsWith("<svg"), chart.table().includes("Restricted area"));
 * // 4 3 zones points points text
 * // true true
 * ```
 */
export function nbaShotChart(shots: readonly NbaShot[], options: NbaShotOptions = {}): Chart<NbaTotals> & { key: KeyItem[] } {
  if (!Array.isArray(shots)) throw new TypeError("shots is a list of shots");
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const frame = frameOf(options.from, "nba-stats");
  const end: "left" | "right" = options.end === "left" ? "left" : "right";
  // A shot chart puts every shot at the basket it was taken at; a frame fixed to the court says where each one is.
  const shooter = frame.ends === "shooter";
  const data = shots.map((s) => clean({ id: s.id, x: s.x, y: s.y, outcome: s.made === undefined ? s.outcome : s.made ? "made" : "missed", value: s.value, team: s.team, title: s.title }));
  const { counts, placed: count, skipped } = countOutcomes(data);
  const entries: KeyEntry[] = [{ label: w.made, outcome: "made" }, { label: w.missed, outcome: "missed" }];
  const o = drawingOptions("nba", options, w.titleNba);
  const where = clean({ from: fromOf(options.from, frame), attacking: shooter && end === "left" ? ("left" as const) : undefined });
  const layers: Layer[] = [];
  const league = isNum(options.league) ? options.league : undefined;
  const zonesLayer: ZonesLayer | undefined =
    options.zones === false
      ? undefined
      : clean({
          kind: "zones" as const,
          id: "zones",
          name: w.shots,
          zones: "nba-shot" as ZoneSetId,
          ...where,
          end: shooter || options.end !== undefined ? end : undefined,
          data,
          statistic: "rate" as const,
          statisticName: w.fgRate,
          minCount: isNum(options.minShots) ? options.minShots : 3,
          labels: options.labels === false ? undefined : { show: ["value", "ratio"] as ("value" | "ratio")[] },
          ramp: options.ramp,
          center: league,
          legend: options.legend === false ? undefined : { title: w.fgRate, position: end === "right" ? ("bottom-left" as const) : ("bottom-right" as const) },
        });
  if (zonesLayer !== undefined) layers.push(zonesLayer);
  if (options.marks !== false) {
    layers.push(
      clean({
        kind: "points" as const,
        id: "shots",
        name: w.shots,
        description: describeCounts(entries, counts, all),
        ...where,
        data,
        style: { outcomes: NBA_LOOKS, scale: zonesLayer === undefined ? 0.85 : 0.6, opacity: 0.85 },
      }) as PointsLayer,
    );
  }
  if (options.key !== false) layers.push(...keyLayers(o, entries, NBA_LOOKS, all));
  const made = counts.get("made") ?? 0;
  const zones = zonesLayer === undefined ? [] : zoneTotals(o, zonesLayer);
  const totals: NbaTotals = { shots: count, made, percent: percentOf(made, count), skipped, zones };
  const summary = [fill(w.sumNba, { shots: count, made, pct: totals.percent ?? 0 }), league !== undefined && zonesLayer !== undefined ? fill(w.leagueNote, { league }) : ""].filter((s) => s !== "").join(all.said.gap);
  const chart = assemble(o, layers, { title: w.titleNba, summary, totals });
  chart.key = keyItems(entries, NBA_LOOKS);
  return chart;
}

// ----- hockey

const NHL_LOOKS: Record<string, Look> = {
  goal: { shape: "star", scale: 1.4 },
  saved: { hollow: true },
  missed: { shape: "x", hollow: true },
  blocked: { shape: "triangle", hollow: true },
  shot: { hollow: true },
};

/** A shot's outcome word: its own, `goal` for a goal, else `shot`. */
const hockeyOutcome = (s: { outcome?: string; goal?: boolean }): string => (s.goal === true ? "goal" : typeof s.outcome === "string" && s.outcome !== "" ? s.outcome.toLowerCase() : "shot");

/** The key entries a set of outcomes calls for, in the order shots are usually read: goals first. */
function shotEntries(counts: ReadonlyMap<string, number>, w: ChartWords, order: readonly string[]): KeyEntry[] {
  const label: Record<string, string> = { goal: w.goal, saved: w.saved, missed: w.missedNet, blocked: w.blocked, shot: w.shot, post: w.post };
  const present = [...counts.keys()].filter((k) => k !== "");
  const known = order.filter((k) => present.includes(k));
  const other = present.filter((k) => !order.includes(k));
  return [...known, ...other].map((k) => ({ label: label[k] ?? k, outcome: k }));
}

/** Per-team totals of shots, goals and expected goals. */
export function teamTotals(rows: readonly { x?: number | null; y?: number | null; outcome?: string; team?: string; value?: number | null }[]): Record<string, { shots: number; goals: number; xg: number | null }> {
  const out: Record<string, { shots: number; goals: number; xg: number | null }> = {};
  for (const r of rows) {
    if (!hasPlace(r) || typeof r.team !== "string" || r.team === "") continue;
    const t = (out[r.team] ??= { shots: 0, goals: 0, xg: null });
    t.shots += 1;
    if (r.outcome === "goal") t.goals += 1;
    if (isNum(r.value)) t.xg = round((t.xg ?? 0) + r.value, 2);
  }
  return out;
}

/**
 * A shot map for the NHL from play-by-play shots: each shot a mark (a goal a star, a save an open circle, a miss an open x, a block an open
 * triangle) sized by its chance of scoring, with an optional count of the shots into the slot zones or hexagons, a legend, a key and a table.
 * With `fold` the shots at the left end are turned a half turn, so that every shot is at the right end.
 * @example
 * ```ts
 * import { nhlShotMap } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const chart = nhlShotMap(
 *   [
 *     { x: 75, y: 4, outcome: "goal", xg: 0.31 },
 *     { x: -60, y: -12, outcome: "saved", xg: 0.07 },
 *     { x: 40, y: 20, outcome: "missed", xg: 0.03 },
 *   ],
 *   { fold: true, zones: true },
 * );
 * console.log(chart.totals.shots, chart.totals.goals, chart.totals.xg);
 * console.log(chart.layers.map((layer) => layer.id).join(" "));
 * // 3 1 0.41
 * // zones shots key-marks key-text
 * ```
 */
export function nhlShotMap(shots: readonly NhlShot[], options: NhlShotOptions = {}): Chart<NhlTotals> & { key: KeyItem[] } {
  if (!Array.isArray(shots)) throw new TypeError("shots is a list of shots");
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const frame = frameOf(options.from, "nhl-api");
  const o = drawingOptions("nhl", options, w.titleNhl);
  const folded = options.fold === true;
  const given = shots.map((s) => clean({ id: s.id, x: s.x, y: s.y, outcome: hockeyOutcome(s), value: s.xg, team: s.team, title: s.title }));
  const data = folded ? foldToRight(given, frame, o) : given;
  const { counts, placed: count, skipped } = countOutcomes(data);
  const hasXg = data.some((d) => isNum(d.value));
  const sized = options.sizeBy === "none" ? false : options.sizeBy === "xg" || hasXg;
  const entries = shotEntries(counts, w, ["goal", "saved", "missed", "blocked", "shot"]);
  const attacking = folded ? undefined : options.attacking === "left" ? ("left" as const) : undefined;
  const where = clean({ from: fromOf(options.from, frame), attacking });
  const single = folded || options.attacking !== undefined;
  const statistic = options.statistic ?? "shots";
  const stat = statistic === "xg" ? { statistic: "sum" as const, statisticName: w.xgStat } : statistic === "goals" ? { statistic: "rate" as const, statisticName: w.goalRate } : { statistic: "count" as const };
  const legend = options.legend === false ? undefined : { position: single ? ("bottom-left" as const) : ("bottom" as const), ...(statistic === "shots" ? {} : { title: stat.statisticName }) };
  const layers: Layer[] = [];
  let zonesLayer: ZonesLayer | undefined;
  if (options.zones !== undefined && options.zones !== false) {
    zonesLayer = clean({
      kind: "zones" as const,
      id: "zones",
      name: w.shots,
      zones: (options.zones === true ? "nhl-slot" : options.zones) as ZoneSetId,
      ...where,
      end: single ? ("right" as const) : undefined,
      data,
      ...stat,
      labels: options.labels === false ? undefined : true,
      ramp: options.ramp,
      legend,
    });
    layers.push(zonesLayer);
  } else if (options.hexbin !== undefined && options.hexbin !== false) {
    layers.push(
      clean({
        kind: "hexbin" as const,
        id: "hexagons",
        name: w.shots,
        ...where,
        data,
        size: typeof options.hexbin === "object" ? options.hexbin.size : undefined,
        ...stat,
        labels: options.labels === true ? true : undefined,
        ramp: options.ramp,
        legend,
      }),
    );
  }
  const xgMax = isNum(options.xgMax) && options.xgMax > 0 ? options.xgMax : 0.5;
  const style: PointStyle = { outcomes: NHL_LOOKS, ...(sized ? { size: { domain: [0, xgMax] as [number, number], range: [1.5, 5.2] as [number, number] } } : {}) };
  const xg = data.some((d) => isNum(d.value)) ? round(data.reduce((sum, d) => sum + (hasPlace(d) && isNum(d.value) ? d.value : 0), 0), 2) : null;
  if (options.marks !== false) {
    layers.push(clean({ kind: "points" as const, id: "shots", name: w.shots, description: [describeCounts(entries, counts, all), sized ? w.sizeNote : ""].filter(Boolean).join(all.said.gap), ...where, data, style }) as PointsLayer);
  }
  const extras = [...(sized ? [w.sizeXg] : []), ...(xg === null ? [] : [fill(w.xgTotal, { n: xg })])];
  if (options.key !== false) layers.push(...keyLayers(o, entries, NHL_LOOKS, all, extras));
  const goals = counts.get("goal") ?? 0;
  const totals: NhlTotals = { shots: count, goals, xg, skipped, zones: zonesLayer === undefined ? [] : zoneTotals(o, zonesLayer), teams: teamTotals(data) };
  const summary = xg === null ? fill(w.sumShots, { shots: count, goals }) : fill(w.sumShotsXg, { shots: count, goals, xg });
  const chart = assemble(o, layers, { title: w.titleNhl, summary, totals });
  chart.key = keyItems(entries, NHL_LOOKS);
  return chart;
}

// ----- football

const NFL_LOOKS: Record<string, Look> = {
  complete: {},
  incomplete: { hollow: true },
  touchdown: { shape: "star", scale: 1.5 },
  interception: { shape: "x", scale: 1.25 },
};

/**
 * A pass chart for the NFL from tracking data: where each pass came down as a mark (a completion filled, an incompletion open, a touchdown a
 * star, an interception an x), the line of scrimmage, and the pass grid (short and deep by left, middle and right) coloured by completion
 * percentage with the air yards of each pass in its table. The offence goes to the right whichever way `direction` says it went in the data.
 * @example
 * ```ts
 * import { nflPassChart } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const chart = nflPassChart(
 *   [
 *     { x: 72, y: 26, outcome: "complete" },
 *     { x: 88, y: 14, outcome: "incomplete" },
 *     { x: 104, y: 30, outcome: "touchdown" },
 *   ],
 *   { los: 65, minPasses: 1 },
 * );
 * console.log(chart.totals.passes, chart.totals.complete, chart.totals.airYards);
 * // 3 2 23
 * ```
 */
export function nflPassChart(passes: readonly NflPass[], options: NflPassOptions = {}): Chart<NflTotals> & { key: KeyItem[] } {
  if (!Array.isArray(passes)) throw new TypeError("passes is a list of passes");
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const frame = frameOf(options.from, "nfl-tracking");
  const o = drawingOptions("nfl", options, w.titleNfl);
  const left = options.direction === "left";
  const attacking = left ? ("left" as const) : undefined;
  const where = clean({ from: fromOf(options.from, frame), attacking });
  const { box } = outlineOf(o);
  const los = isNum(options.los) ? options.los : undefined;
  // The line of scrimmage on the surface, in feet from the left end line as the offence goes right: the frame's own number, placed.
  const losFeet = los === undefined ? box.w / 2 : (placed(o, where, [{ x: los, y: 0 }])[0] as [number, number])[0];
  const inYards = (feet: number): number => feet / 3;
  const rows = passes.map((p) => {
    const outcome = typeof p.outcome === "string" && p.outcome !== "" ? p.outcome.toLowerCase() : undefined;
    return { p, outcome };
  });
  // Air yards: given, else the yards past the line of scrimmage in the way the offence goes.
  const at = placed(o, where, rows.map(({ p }) => ({ x: p.x, y: p.y })));
  const data = rows.map(({ p, outcome }, i) => {
    const place_ = at[i];
    const air = isNum(p.airYards) ? p.airYards : place_ === undefined ? undefined : round(inYards(place_[0] - losFeet), 1);
    return clean({ id: p.id, x: p.x, y: p.y, outcome, value: air, team: p.team, title: p.title });
  });
  const { counts, placed: count, skipped } = countOutcomes(data);
  const entries: KeyEntry[] = ([["complete", w.complete], ["incomplete", w.incomplete], ["touchdown", w.touchdown], ["interception", w.interception]] as const).filter(([k]) => counts.has(k) || counts.size === 0 || ["complete", "incomplete"].includes(k)).map(([outcome, label]) => ({ label, outcome }));
  const layers: Layer[] = [];
  const success = ["complete", "touchdown"];
  let zonesLayer: ZonesLayer | undefined;
  if (options.zones !== false) {
    zonesLayer = clean({
      kind: "zones" as const,
      id: "zones",
      name: w.passes,
      zones: "football-pass" as ZoneSetId,
      ...where,
      los,
      data,
      statistic: "rate" as const,
      statisticName: w.completionRate,
      success,
      minCount: isNum(options.minPasses) ? options.minPasses : 3,
      labels: options.labels === false ? undefined : { show: ["value", "ratio"] as ("value" | "ratio")[] },
      ramp: options.ramp,
      legend: options.legend === false ? undefined : { title: w.completionRate, position: "bottom-left" as const },
    });
    layers.push(zonesLayer);
  }
  if (options.line !== false) {
    const width = box.h / 3;
    const line: LinesLayer = clean({
      kind: "lines" as const,
      id: "los",
      name: w.lineOfScrimmage,
      units: "ft",
      data: [{ x: losFeet, y: 0, x2: losFeet, y2: width * 3 }],
      style: { width: 0.9, dash: "dashed" as const, color: "var(--ky-layer-ink)" },
    });
    layers.push(line);
  }
  if (options.arrows === true) {
    const arrows = rows.filter(({ p }) => isNum(p.fromX) && isNum(p.fromY) && isNum(p.x) && isNum(p.y)).map(({ p, outcome }) => clean({ id: p.id, x: p.fromX as number, y: p.fromY as number, x2: p.x as number, y2: p.y as number, outcome, team: p.team, title: p.title }));
    layers.push(clean({ kind: "arrows" as const, id: "arrows", name: w.passes, ...where, data: arrows, style: { width: 0.7, opacity: 0.7, curve: 0.08, outcomes: { touchdown: {}, interception: {}, complete: {}, incomplete: { hollow: true } } } }));
  }
  const values = data.map((d) => d.value).filter(isNum);
  if (options.marks !== false) {
    const description = [describeCounts(entries, counts, all), values.length === 0 ? "" : fill(w.airYards, { min: Math.min(...values), max: Math.max(...values) })].filter(Boolean).join(all.said.gap);
    layers.push(clean({ kind: "points" as const, id: "passes", name: w.passes, description, ...where, data, style: { outcomes: NFL_LOOKS } }) as PointsLayer);
  }
  if (options.key !== false) layers.push(...keyLayers(o, entries, NFL_LOOKS, all));
  const complete = (counts.get("complete") ?? 0) + (counts.get("touchdown") ?? 0);
  const totals: NflTotals = {
    passes: count,
    complete,
    touchdowns: counts.get("touchdown") ?? 0,
    interceptions: counts.get("interception") ?? 0,
    percent: percentOf(complete, count),
    airYards: values.length === 0 ? null : round(values.reduce((a, b) => a + b, 0) / values.length, 1),
    skipped,
    zones: zonesLayer === undefined ? [] : zoneTotals(o, zonesLayer),
  };
  const summary = fill(w.sumNfl, { passes: count, complete, pct: totals.percent ?? 0, td: totals.touchdowns, int: totals.interceptions });
  const chart = assemble(o, layers, { title: w.titleNfl, summary, totals });
  chart.key = keyItems(entries, NFL_LOOKS);
  return chart;
}
