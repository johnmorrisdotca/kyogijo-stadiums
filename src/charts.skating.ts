// The skating data: the pairs of a speed skating race on the lines of its start (an inner and an outer lane, the armbands the Rules give them), the starting positions of a short track race, the results
// with their medals, times and splits, a replay of the race (every skater on his own way round the track, the lane changed once a lap), and the elements of a figure skating programme as marks on the ice.
// Written for this package from the ISU's Special Regulations and Technical Rules for speed skating (Rules 203, 227, 253, 254 and 280) and short track speed skating (Rule 280); nothing of any other package
// is used. The flags are the caller's: an SVG document as text, or an address, as a team's logo is.
import { assemble, clean, drawingOptions, languageOf, round, wordsOf } from "./charts.ts";
import type { Chart, ChartOptions, KeyItem } from "./charts.types.ts";
import { esc } from "./format.ts";
import type { Layer, PointDatum, TextDatum } from "./layers.types.ts";
import type { ReplayEvent, ReplayFrame, ReplayLook, ReplayObject, ReplayTimeline } from "./replay.types.ts";
import { fill } from "./strings.ts";
import type { SurfaceOptions } from "./types.ts";
import { ELEMENT_KINDS, ELEMENT_NAMES, type ElementKind, raceById } from "./skating/events.ts";
import { disciplineOf, skatingPlan, type SkatingPlan } from "./skating/plan.ts";
import { raceName } from "./skating/describe.ts";
import { markRace } from "./skating/long.ts";
import { shortPose, startingPositions, startsOnOppositeStraight, type ShortOval } from "./skating/short.ts";
import { finishAt, laneRadius, pose, startOf, type Lane, type LongOval } from "./skating/track.ts";
import type { LongTrackRace, ShortTrackRace, SkatingRace } from "./skating/types.ts";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** A skater in a race or on the ice. */
export interface SkatingEntry {
  name: string;
  /** The country's code or name, for the table. */
  country?: string;
  /** The flag: an SVG document as text, or an `https:` or relative address, as a team's `logo`. */
  flag?: string;
  bib?: string | number;
}

/** A pair of a long track race: two skaters, one in each lane (Rule 254.2). */
export interface SkatingPair {
  /** The pair's number in the race, from 1. */
  pair: number;
  inner?: SkatingEntry;
  outer?: SkatingEntry;
}

/** A starter of a short track race and the starting position he has on the line (Rule 280.2c: five positions of the 500 m and the 1000 m, from 1 on the inner side). */
export interface SkatingStarter extends SkatingEntry {
  position: number;
}

/** One skater's result in a race. Times are in seconds from the gun. */
export interface SkatingResult extends SkatingEntry {
  /** The place, from 1. A skater who did not finish has none. */
  place?: number;
  /** The pair, on the long track. */
  pair?: number;
  /** The lane the skater started in, on the long track: `inner` or `outer`. */
  lane?: "inner" | "outer";
  /** The time in seconds from the gun, or `null` for one who did not finish. */
  time?: number | null;
  /** The times, from the gun, at distances along the way: `{ distance: 200, time: 17.9 }`. */
  splits?: readonly { distance: number; time: number }[];
  /** The lap times in seconds, one for each lap (Rule 252), for the table. */
  laps?: readonly number[];
  /** `DQ`, `DNF`, `DNS` or a note of your own, for the table. */
  note?: string;
}

/** What the race charts take beyond a chart's options. */
export interface SkatingRaceOptions extends ChartOptions {
  /** The race: the 500 m by default. */
  race?: SkatingRace;
}

/** The numbers behind a draw. */
export interface DrawTotals {
  skaters: number;
  /** Long track: the pairs; short track: 1. */
  pairs: number;
}

/** The numbers behind results. */
export interface SkatingResultsTotals {
  skaters: number;
  finished: number;
  winner: { name: string; time: number } | null;
}

const WORDS = (language: "en" | "ja") => wordsOf(language).skating;

/** A time in seconds as it is written: `34.32`, `1:40.91`, `6:01.03`. */
export function formatTime(seconds: number, places = 2): string {
  if (!isNum(seconds) || seconds < 0) return "";
  const r = Math.round(seconds * 10 ** places) / 10 ** places;
  const h = Math.floor(r / 3600);
  const m = Math.floor((r - h * 3600) / 60);
  const s = r - h * 3600 - m * 60;
  const sec = s.toFixed(places).padStart(places > 0 ? places + 3 : 2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : m > 0 ? `${m}:${sec}` : s.toFixed(places);
}

/** The discipline of the options' rink: a chart is for a track, the long one unless the league says the short one. */
function trackOf(options: ChartOptions): "long-track" | "short-track" {
  const d = disciplineOf({ sport: "skating", league: options.surface?.league });
  if (d === "figure") throw new RangeError('A race chart is for a speed skating track: use league "isu-long-track" or "isu-short-track"');
  return d;
}

function raceOf(options: SkatingRaceOptions): SkatingRace {
  const id = options.race ?? "500m";
  if (raceById(id) === undefined) throw new Error(`Unknown race "${String(id)}"`);
  return id;
}

/** The plan of the race's drawing, close up on its start or its finish (or whole), with the race marked. */
function planOf(options: SkatingRaceOptions, race: SkatingRace, range: "start" | "finish" | undefined, title: string, extraStyle: Partial<NonNullable<SurfaceOptions["skating"]>> = {}): { o: SurfaceOptions; plan: SkatingPlan } {
  const surface = options.surface ?? {};
  const style = { races: [race] as SkatingRace[], start: race, ...(surface.skating ?? {}), ...extraStyle };
  const o = drawingOptions("skating", { ...options, surface: { ...(range === undefined ? {} : { range }), ...surface, skating: style } }, title, {});
  const plan = skatingPlan({ sport: "skating", league: surface.league, skating: style, range: o.range });
  return { o, plan };
}

const AT = { from: "skating", units: "m" as const };
const ARMBAND = { inner: "#ffffff", outer: "#d6342a" };

/** The point and the heading of a skater of a long track race who has skated `d` metres. */
function longAt(oval: LongOval, race: LongTrackRace, lane: Lane, d: number): { x: number; y: number; heading: number } {
  const m = markRace(oval, race);
  const nc = m.noChange;
  const dist = raceById(race)?.distance ?? 0;
  const start = startOf(oval, lane, dist, finishAt(oval, m.finish), nc);
  const p = pose(oval, lane, start.v0 + d, nc);
  return { x: p.x, y: p.y, heading: p.heading };
}

/** Where a skater of a short track race is when `d` metres have been skated from the starting position `position` (1 on the inner side). */
function shortAt(oval: ShortOval, race: ShortTrackRace, position: number, d: number): { x: number; y: number; heading: number } {
  const laps = ({ "500m": 4.5, "1000m": 9, "1500m": 13.5, "2000m": 18, "3000m": 27, "5000m": 45 } as const)[race];
  const total = laps * oval.lap;
  // The finishing line is the middle of the bottom straight: S/2 along it. A half-lap race starts at the middle of the top one.
  const finish = oval.straight / 2;
  const v0 = (((finish - total) % oval.lap) + oval.lap) % oval.lap;
  const offset = 0.5 + 1.3 * (position - 1) - 0.5;
  const out = offset * Math.max(0, 1 - d / 25);
  return shortPose(oval, v0 + d, out);
}

// ----- the pairs and the starting positions

/**
 * The pairs of a long track race on the start's close-up: the pair `pair` (the first by default) with each skater's name and flag behind the starting line of his lane, and an armband's colour (white
 * for the inner lane, red for the outer: Rule 253.3.1); a table lists every pair. The starting lines are the ISU's: the 500 m on the finishing straight, the 1000 m, 1500 m, 3000 m and 5000 m on the
 * crossing straight, where each lane's line stands a different distance from the finish.
 * @example
 * ```ts
 * import { skatingPairs } from "@johnmorrisdotca/kyogijo-stadiums/skating";
 * const chart = skatingPairs([{ pair: 1, inner: { name: "A. Skater" }, outer: { name: "B. Skater" } }], { race: "1000m" });
 * console.log(chart.totals, chart.title);
 * // { skaters: 2, pairs: 1 } Pairs, 1000 m
 * ```
 */
export function skatingPairs(pairs: readonly SkatingPair[], options: SkatingRaceOptions & { pair?: number } = {}): Chart<DrawTotals> & { key: KeyItem[] } {
  if (!Array.isArray(pairs)) throw new TypeError("pairs is a list");
  const track = trackOf(options);
  if (track !== "long-track") throw new RangeError("Pairs are for the long track: the short track has starting positions (skatingGrid)");
  const seen = new Set<number>();
  for (const p of pairs) {
    if (typeof p !== "object" || p === null || !Number.isInteger(p.pair) || p.pair < 1) throw new TypeError("each pair has a number, a whole number from 1");
    if (seen.has(p.pair)) throw new RangeError(`pair ${p.pair} is given twice`);
    seen.add(p.pair);
  }
  const race = raceOf(options);
  const language = languageOf(options);
  const w = WORDS(language);
  const title = fill(w.data.draw, { race: raceName(race, language) });
  const { o, plan } = planOf(options, race, "start", title);
  const oval = plan.oval as LongOval;
  const which = options.pair ?? [...pairs].sort((a, b) => a.pair - b.pair)[0]?.pair;
  const shown = pairs.find((p) => p.pair === which);
  const names: TextDatum[] = [];
  const flags: PointDatum[] = [];
  const bands: PointDatum[] = [];
  const m = markRace(oval, race as LongTrackRace);
  for (const [laneName, entry] of [["inner", shown?.inner], ["outer", shown?.outer]] as const) {
    if (entry === undefined) continue;
    const lane: Lane = laneName === "inner" ? 0 : 1;
    const start = m.starts.find((s) => s.lane === lane || s.lane === "both");
    if (start === undefined) continue;
    const fx = Math.cos(start.heading);
    const fy = Math.sin(start.heading);
    // The skater stands in his lane, on the line of its measurement, behind the starting line.
    const sign = start.y >= 0 ? 1 : -1;
    const base = { x: start.x, y: sign * laneRadius(oval, lane) };
    const back = (d: number): [number, number] => [base.x - fx * d, base.y - fy * d];
    const [bx, by] = back(1.6);
    bands.push({ x: bx, y: by, shape: "circle", size: 1.2, color: ARMBAND[laneName], title: laneName === "inner" ? w.data.lanes.inner : w.data.lanes.outer });
    if (entry.flag !== undefined) {
      const [px, py] = back(3.6);
      flags.push(clean({ x: px, y: py, shape: "logo" as const, logo: entry.flag, size: 1.6, title: entry.country }));
    }
    const [nx, ny] = back(entry.flag !== undefined ? 5.4 : 3);
    names.push(clean({ x: nx, y: ny, text: entry.name, anchor: fx < 0 ? ("start" as const) : ("end" as const), size: 1.9, title: entry.country === undefined ? undefined : `${entry.name}, ${entry.country}` }));
  }
  const layers: Layer[] = [];
  layers.push({ kind: "points", id: "armbands", name: w.data.layers.names, ...AT, clip: "none", data: bands, style: { size: 1.2 } });
  if (flags.length > 0) layers.push({ kind: "points", id: "flags", name: w.data.layers.flags, ...AT, clip: "none", data: flags, style: { shape: "logo", size: 1.6 } });
  layers.push({ kind: "text", id: "names", name: w.data.layers.names, ...AT, clip: "none", data: names, style: { size: 1.9, anchor: "end", weight: 800 } });
  const skaters = pairs.reduce((n, p) => n + (p.inner === undefined ? 0 : 1) + (p.outer === undefined ? 0 : 1), 0);
  const totals: DrawTotals = { skaters, pairs: pairs.length };
  const last = pairs.reduce((n, p) => Math.max(n, p.pair), 0);
  const summary = pairs.length === 0 ? "" : fill(w.data.summaryDraw, { n: skaters, race: raceName(race, language), last });
  const chart = assemble(o, layers, { title, summary, totals, tableLayers: ["names"] });
  chart.table = (): string => pairsTable([...pairs].sort((a, b) => a.pair - b.pair), language);
  return chart;
}

function pairsTable(pairs: readonly SkatingPair[], language: "en" | "ja"): string {
  const w = WORDS(language).data;
  const c = w.columns;
  const cell = (e: SkatingEntry | undefined): string => (e === undefined ? "" : `${esc(e.name)}${e.country === undefined ? "" : ` (${esc(e.country)})`}`);
  const rows = pairs.map((p) => `<tr><td>${p.pair}</td><td>${cell(p.inner)}</td><td>${cell(p.outer)}</td></tr>`).join("");
  return `<table class="ky-table"><thead><tr><th>${c.pair}</th><th>${w.lanes.inner}</th><th>${w.lanes.outer}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * The starting positions of a short track race on the start's close-up: the five dots of the 500 m and the 1000 m (every 1.3 m from 50 cm out from the inner side, Rule 280.2c), each with its starter's
 * name and flag. The 500 m and the 1500 m start on the straight opposite the finishing line; the others at the finishing line.
 * @example
 * ```ts
 * import { skatingGrid } from "@johnmorrisdotca/kyogijo-stadiums/skating";
 * const chart = skatingGrid([{ position: 1, name: "A. Skater" }, { position: 2, name: "B. Skater" }], { race: "500m", surface: { league: "isu-short-track" } });
 * console.log(chart.totals.skaters);
 * // 2
 * ```
 */
export function skatingGrid(starters: readonly SkatingStarter[], options: SkatingRaceOptions = {}): Chart<DrawTotals> & { key: KeyItem[] } {
  if (!Array.isArray(starters)) throw new TypeError("starters is a list");
  const surface = { ...(options.surface ?? {}), league: options.surface?.league ?? "isu-short-track" };
  const opts = { ...options, surface };
  if (trackOf(opts) !== "short-track") throw new RangeError("Starting positions are for the short track: the long track has pairs (skatingPairs)");
  const seen = new Set<number>();
  for (const s of starters) {
    if (typeof s !== "object" || s === null || !Number.isInteger(s.position) || s.position < 1 || s.position > 5) throw new RangeError("each starter has a position from 1 to 5 (Rule 280.2c)");
    if (seen.has(s.position)) throw new RangeError(`position ${s.position} is given twice`);
    seen.add(s.position);
  }
  const race = raceOf(opts);
  const language = languageOf(opts);
  const w = WORDS(language);
  const title = fill(w.data.draw, { race: raceName(race, language) });
  const { o, plan } = planOf(opts, race, "start", title);
  const oval = plan.short as ShortOval;
  const top = startsOnOppositeStraight(race as ShortTrackRace);
  const spots = startingPositions(oval, 0, top ? -1 : 1);
  const names: TextDatum[] = [];
  const flags: PointDatum[] = [];
  for (const s of [...starters].sort((a, b) => a.position - b.position)) {
    const spot = spots[s.position - 1];
    // The skaters go left along the top straight and right along the bottom one: the names stand behind the line.
    const dir = top ? -1 : 1;
    names.push(clean({ x: spot.x - dir * (s.flag === undefined ? 1.2 : 2.6), y: spot.y, text: s.name, anchor: top ? ("start" as const) : ("end" as const), size: 0.9, title: s.country === undefined ? undefined : `${s.name}, ${s.country}` }));
    if (s.flag !== undefined) flags.push(clean({ x: spot.x - dir * 1.4, y: spot.y, shape: "logo" as const, logo: s.flag, size: 0.8, title: s.country }));
  }
  const layers: Layer[] = [];
  if (flags.length > 0) layers.push({ kind: "points", id: "flags", name: w.data.layers.flags, ...AT, clip: "none", data: flags, style: { shape: "logo", size: 0.8 } });
  layers.push({ kind: "text", id: "names", name: w.data.layers.names, ...AT, clip: "none", data: names, style: { size: 0.9, anchor: top ? "start" : "end", weight: 800 } });
  const totals: DrawTotals = { skaters: starters.length, pairs: starters.length === 0 ? 0 : 1 };
  const summary = starters.length === 0 ? "" : fill(w.data.summaryGrid, { n: starters.length, race: raceName(race, language) });
  const chart = assemble(o, layers, { title, summary, totals, tableLayers: ["names"] });
  chart.table = (): string => `<table class="ky-table"><thead><tr><th>${w.data.columns.order}</th><th>${w.data.columns.skater}</th><th>${w.data.columns.country}</th></tr></thead><tbody>${[...starters].sort((a, b) => a.position - b.position).map((s) => `<tr><td>${s.position}</td><td>${esc(s.name)}</td><td>${esc(s.country ?? "")}</td></tr>`).join("")}</tbody></table>`;
  return chart;
}

// ----- the results

const MEDAL_COLOURS: Readonly<Record<string, string>> = { gold: "#d4a017", silver: "#b8bec6", bronze: "#b87333" };

/**
 * The results of a race as a leaderboard on the ice inside the track: for each skater with a place, a disc with the place (gold, silver and bronze for the first three), the name and the time; the splits
 * as small marks along the skater's lane on the long track; and a table with the pair, the lane, the time, the splits and the lap times. Times are in seconds from the gun.
 * @example
 * ```ts
 * import { skatingResults } from "@johnmorrisdotca/kyogijo-stadiums/skating";
 * const chart = skatingResults([{ name: "A", place: 1, time: 34.3 }, { name: "B", place: 2, time: 34.5 }], { race: "500m" });
 * console.log(chart.totals.winner?.name, chart.summary);
 * // A A won the 500 m in 34.30.
 * ```
 */
export function skatingResults(results: readonly SkatingResult[], options: SkatingRaceOptions & { splits?: boolean; rows?: number } = {}): Chart<SkatingResultsTotals> & { key: KeyItem[] } {
  if (!Array.isArray(results)) throw new TypeError("results is a list");
  const track = trackOf(options);
  const race = raceOf(options);
  const language = languageOf(options);
  const w = WORDS(language);
  const title = fill(w.data.results, { race: raceName(race, language) });
  const { o, plan } = planOf(options, race, undefined, title);
  const sorted = [...results].sort((a, b) => (a.place ?? 999) - (b.place ?? 999));
  const long = track === "long-track";
  const unit = long ? 4.4 : 1.35;
  const rows = Math.min(options.rows ?? (long ? 8 : 5), sorted.filter((r) => r.place !== undefined).length);
  const discs: PointDatum[] = [];
  const places: TextDatum[] = [];
  const words: TextDatum[] = [];
  const x0 = long ? -28 : -9;
  const top = -((rows - 1) / 2) * unit * 1.25;
  sorted.filter((r) => r.place !== undefined && isNum(r.time)).slice(0, rows).forEach((r, i) => {
    const y = top + i * unit * 1.25;
    const medal = r.place === 1 ? "gold" : r.place === 2 ? "silver" : r.place === 3 ? "bronze" : undefined;
    discs.push(clean({ x: x0, y, shape: "circle" as const, size: unit * 0.9, color: medal === undefined ? "#2f3a44" : MEDAL_COLOURS[medal], title: `${r.name}, ${medal === undefined ? "" : `${w.data.medals[medal]}, `}${formatTime(r.time as number)}` }));
    places.push({ x: x0, y, text: r.place as number, size: unit * 0.55, color: medal === undefined ? "#ffffff" : "#1c1f1d" });
    words.push({ x: x0 + unit * 0.9, y, text: `${r.name}  ${formatTime(r.time as number)}`, anchor: "start", size: unit * 0.55 });
  });
  const marks: PointDatum[] = [];
  if (long && options.splits !== false) {
    const oval = plan.oval as LongOval;
    for (const r of results) {
      if (r.lane === undefined || r.splits === undefined) continue;
      const lane: Lane = r.lane === "inner" ? 0 : 1;
      for (const sp of r.splits) {
        if (!isNum(sp.distance) || !isNum(sp.time)) continue;
        const p = longAt(oval, race as LongTrackRace, lane, sp.distance);
        marks.push({ x: round(p.x, 3), y: round(p.y, 3), shape: "circle", size: 1.1, title: fill(w.data.split, { d: round(sp.distance, 1), t: formatTime(sp.time) }), value: sp.time });
      }
    }
  }
  const layers: Layer[] = [];
  if (marks.length > 0) layers.push({ kind: "points", id: "splits", name: w.data.layers.splits, ...AT, clip: "none", data: marks, style: { size: 1.1, fill: "#f2c230" } });
  layers.push({ kind: "points", id: "places", name: w.data.layers.medals, ...AT, clip: "none", data: discs, style: { size: unit * 0.9 } });
  layers.push({ kind: "text", id: "place-numbers", name: w.data.layers.medals, ...AT, clip: "none", data: places, style: { size: unit * 0.55, weight: 800, halo: false } });
  layers.push({ kind: "text", id: "skaters", name: w.data.layers.names, ...AT, clip: "none", data: words, style: { size: unit * 0.55, anchor: "start", weight: 800 } });
  const winner = sorted.find((r) => r.place === 1 && isNum(r.time));
  const totals: SkatingResultsTotals = { skaters: results.length, finished: results.filter((r) => isNum(r.time) && r.place !== undefined).length, winner: winner === undefined ? null : { name: winner.name, time: winner.time as number } };
  const summary = winner === undefined ? "" : fill(w.data.summaryResults, { winner: winner.name, race: raceName(race, language), time: formatTime(totals.winner?.time ?? 0) });
  const chart = assemble(o, layers, { title, summary, totals, tableLayers: ["places"] });
  chart.table = (): string => resultsTable(sorted, language);
  return chart;
}

function resultsTable(results: readonly SkatingResult[], language: "en" | "ja"): string {
  const w = WORDS(language).data;
  const c = w.columns;
  const rows = results
    .map((r) => {
      const splits = (r.splits ?? []).map((s) => `${round(s.distance, 1)} ${w.metres}: ${formatTime(s.time)}`).join("; ");
      const laps = (r.laps ?? []).map((t, i) => fill(w.lap, { n: i + 1, t: formatTime(t) })).join("; ");
      return `<tr><td>${r.place ?? ""}</td><td>${r.pair ?? ""}</td><td>${r.lane === undefined ? "" : r.lane === "inner" ? w.lanes.inner : w.lanes.outer}</td><td>${esc(r.name)}</td><td>${esc(r.country ?? "")}</td><td>${isNum(r.time) ? formatTime(r.time) : esc(r.note ?? "")}</td><td>${esc(splits)}</td><td>${esc(laps)}</td></tr>`;
    })
    .join("");
  return `<table class="ky-table"><thead><tr><th>${c.place}</th><th>${c.pair}</th><th>${c.lane}</th><th>${c.skater}</th><th>${c.country}</th><th>${c.time}</th><th>${c.splits}</th><th>${c.splits}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// ----- the replay

/** One skater of a replay. */
export interface SkatingRunner extends SkatingEntry {
  /** The time, in seconds from the gun, at which the skater finishes. */
  time: number;
  /** Long track: the lane the skater starts in. `inner` by default. */
  lane?: "inner" | "outer";
  /** Short track: the starting position, from 1 on the inner side. 1 by default. */
  position?: number;
  /** Times, from the gun, at distances along the way, which the skater's pace follows; without them the pace is even. */
  splits?: readonly { distance: number; time: number }[];
}

/** What `skatingReplay` takes. */
export interface SkatingReplayOptions extends SkatingRaceOptions {
  /** Seconds between two frames. 0.25 by default. */
  step?: number;
}

/** What `skatingReplay` gives back. */
export interface SkatingReplay {
  timeline: ReplayTimeline;
  /** The drawing's options: the track with the race marked. */
  options: SurfaceOptions;
  /** A look for the frames: markers sized for the track, no trails, the lane or the position on them. */
  look: ReplayLook;
  title: string;
  summary: string;
  duration: number;
}

/** The distance a skater has skated at a time, by the splits and the finish: straight lines between them, coasting for three seconds after the finish. */
export function distanceSkated(runner: SkatingRunner, total: number, t: number): number {
  if (t <= 0) return 0;
  const pts: [number, number][] = [[0, 0]];
  for (const s of [...(runner.splits ?? [])].sort((a, b) => a.time - b.time)) if (s.time > 0 && s.time < runner.time && s.distance > 0 && s.distance < total) pts.push([s.time, s.distance]);
  pts.push([runner.time, total]);
  for (let i = 1; i < pts.length; i += 1) {
    if (t <= pts[i][0]) {
      const [t0, d0] = pts[i - 1];
      const [t1, d1] = pts[i];
      return d0 + ((t - t0) / (t1 - t0)) * (d1 - d0);
    }
  }
  const [t0, d0] = pts[pts.length - 2];
  const [t1, d1] = pts[pts.length - 1];
  const v = (d1 - d0) / (t1 - t0);
  const u = Math.min(t - t1, 3);
  return d1 + v * (u - (u * u) / 6);
}

/**
 * A replay of a race: every skater, from the gun, on his own way round the track (the long track's lane changed once a lap, on the crossing straight, and the first straight of the 1000 m and the 1500 m
 * kept in the lane; the short track's oval of 111.12 m, the starters coming in from their positions), at the pace of the splits and the finish time. The positions are in the skating frame (metres
 * from the middle of the rink). The team races, the mass start and the relays are not replayed.
 * @example
 * ```ts
 * import { skatingReplay } from "@johnmorrisdotca/kyogijo-stadiums/skating";
 * const replay = skatingReplay([{ name: "A", lane: "inner", time: 34.4 }, { name: "B", lane: "outer", time: 34.6 }], { race: "500m" });
 * console.log(replay.timeline.frames.length > 40, replay.duration);
 * // true 34.6
 * ```
 */
export function skatingReplay(runners: readonly SkatingRunner[], options: SkatingReplayOptions = {}): SkatingReplay {
  if (!Array.isArray(runners)) throw new TypeError("runners is a list");
  trackOf(options);
  const race = raceOf(options);
  const info = raceById(race);
  if (race === "mass-start" || race === "team-pursuit" || race === "team-sprint") throw new RangeError(`The ${race} is not replayed: its skaters are not in lanes`);
  const language = languageOf(options);
  const w = WORDS(language);
  const title = fill(w.data.replay, { race: raceName(race, language) });
  const { o, plan } = planOf(options, race, undefined, title);
  const step = isNum(options.step) && options.step > 0 ? options.step : 0.25;
  for (const r of runners) if (!isNum(r.time) || r.time <= 0) throw new RangeError(`${String(r.name)}: the time is a number of seconds above zero`);
  const total = (info as { distance: number }).distance;
  const shortTotal = plan.short === undefined ? 0 : ({ "500m": 4.5, "1000m": 9, "1500m": 13.5, "2000m": 18, "3000m": 27, "5000m": 45 } as Record<string, number>)[race] * plan.short.lap;
  const duration = Math.max(...runners.map((r) => r.time), 0);
  const frames: ReplayFrame[] = [];
  const at = (r: SkatingRunner, d: number): { x: number; y: number } => {
    if (plan.short !== undefined) return shortAt(plan.short, race as ShortTrackRace, r.position ?? 1, d);
    return longAt(plan.oval as LongOval, race as LongTrackRace, r.lane === "outer" ? 1 : 0, d);
  };
  const distance = plan.short === undefined ? total : shortTotal;
  for (let k = 0; k * step <= duration + 3.2 + 1e-9; k += 1) {
    const t = Math.round(k * step * 1000) / 1000;
    const objects: ReplayObject[] = [];
    runners.forEach((r, i) => {
      const p = at(r, distanceSkated(r, distance, t));
      objects.push(clean({ id: `skater-${i + 1}`, team: r.lane === "outer" ? ("away" as const) : ("home" as const), x: round(p.x, 3), y: round(p.y, 3), label: r.name, number: plan.short === undefined ? (r.lane === "outer" ? 2 : 1) : (r.position ?? i + 1) }));
    });
    frames.push({ t, objects });
  }
  const events: ReplayEvent[] = [{ t: 0, kind: "gun", label: w.data.gun }];
  runners.forEach((r, i) => {
    const p = at(r, distance);
    events.push({ t: r.time, kind: "finish", team: r.lane === "outer" ? "away" : "home", x: round(p.x, 3), y: round(p.y, 3), by: `skater-${i + 1}`, label: fill(w.data.finish, { name: r.name, time: formatTime(r.time) }) });
  });
  events.sort((a, b) => a.t - b.t);
  const timeline: ReplayTimeline = { frames, events, from: "skating", units: "m" };
  const summary = fill(w.data.summaryReplay, { n: runners.length, race: raceName(race, language) });
  return { timeline, options: { ...o, title }, look: { trail: 0, scale: plan.short === undefined ? 0.8 : 0.7, numbers: true, hold: 2 }, title, summary, duration };
}

// ----- the elements of a figure skating programme

/** An element of a figure skating programme as it lies on the ice. */
export interface SkatingElement {
  /** The kind: a jump, a spin, a step sequence, a choreographic sequence, a lift, a spiral, a twizzle, a death spiral or a throw. */
  kind: ElementKind;
  /** The name for the table and the label: `3Lz`, `CCoSp4`, `StSq3`. */
  name?: string;
  /** Where it starts, in metres from the middle of the rink: x along it (positive to the right as the rink lies wide), y across (positive towards the judges). */
  x: number;
  y: number;
  /** Where it ends, for an element that travels (a step sequence, a spiral). */
  x2?: number;
  y2?: number;
  /** The place in the programme, from 1. */
  order?: number;
  /** `home` or `away`: the two layer colours, for a pair's two skaters or two programmes. */
  team?: string;
  /** The tooltip, and what a screen reader reads. */
  title?: string;
}

/** What `figureElements` takes. */
export interface FigureElementsOptions extends ChartOptions {
  /** Write the name beside each mark. On by default. */
  labels?: boolean;
}

/** The numbers behind the elements. */
export interface ElementTotals {
  elements: number;
  /** The count of each kind. */
  kinds: Readonly<Record<string, number>>;
}

const KIND_SHAPE: Readonly<Record<ElementKind, "circle" | "square" | "triangle" | "diamond" | "cross" | "x" | "star">> = { jump: "circle", spin: "star", "step-sequence": "diamond", "choreographic-sequence": "diamond", lift: "triangle", spiral: "square", twizzle: "x", "death-spiral": "star", throw: "cross" };

/**
 * The elements of a programme as marks on the rink: a mark for each element where it starts, its shape for its kind, the track of a step sequence or a spiral as a line to where it ends, and the order
 * and the name beside it. Put them on the rink (`league: "isu-figure"`, the default for this chart).
 * @example
 * ```ts
 * import { figureElements } from "@johnmorrisdotca/kyogijo-stadiums/skating";
 * const chart = figureElements([{ kind: "jump", name: "3Lz", x: -12, y: 4, order: 1 }, { kind: "spin", name: "CCoSp4", x: 6, y: -3, order: 2 }]);
 * console.log(chart.totals.elements, chart.totals.kinds.jump);
 * // 2 1
 * ```
 */
export function figureElements(elements: readonly SkatingElement[], options: FigureElementsOptions = {}): Chart<ElementTotals> & { key: KeyItem[] } {
  if (!Array.isArray(elements)) throw new TypeError("elements is a list");
  for (const e of elements) {
    if (typeof e !== "object" || e === null || !(ELEMENT_KINDS as readonly string[]).includes(e.kind)) throw new Error(`Unknown kind of element "${String((e as { kind?: unknown })?.kind)}": use one of ${ELEMENT_KINDS.join(", ")}`);
    if (!isNum(e.x) || !isNum(e.y)) throw new TypeError("each element has a place: x and y in metres from the middle of the rink");
  }
  const language = languageOf(options);
  const w = WORDS(language);
  const surface = { ...(options.surface ?? {}), league: options.surface?.league ?? "isu-figure" };
  if (disciplineOf({ sport: "skating", league: surface.league }) !== "figure") throw new RangeError('figureElements is for the figure skating rink: use league "isu-figure"');
  const title = w.data.elements;
  const o = drawingOptions("skating", { ...options, surface }, title, {});
  const plan = skatingPlan({ sport: "skating", league: surface.league, skating: surface.skating });
  const half = (plan.rink?.length ?? 60) / 2;
  const wide = (plan.rink?.width ?? 30) / 2;
  const sorted = ([...elements] as SkatingElement[]).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
  const points: PointDatum[] = [];
  const lines: { x: number; y: number; x2: number; y2: number; team?: string }[] = [];
  const labels: TextDatum[] = [];
  const kinds: Record<string, number> = {};
  sorted.forEach((e, i) => {
    kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
    const x = Math.max(-half, Math.min(half, e.x));
    const y = Math.max(-wide, Math.min(wide, e.y));
    const kindName = ELEMENT_NAMES[e.kind][language];
    points.push(clean({ x, y, shape: KIND_SHAPE[e.kind], team: e.team ?? "home", outcome: e.kind, title: e.title ?? `${e.order === undefined ? i + 1 : e.order}. ${e.name ?? kindName}` }));
    if (isNum(e.x2) && isNum(e.y2)) lines.push(clean({ x, y, x2: Math.max(-half, Math.min(half, e.x2)), y2: Math.max(-wide, Math.min(wide, e.y2)), team: e.team }));
    if (options.labels !== false) labels.push({ x: x + 1.1, y: y - 1.1, text: `${e.order === undefined ? i + 1 : e.order}${e.name === undefined ? "" : ` ${e.name}`}`, size: 1.15, anchor: "start" });
  });
  const layers: Layer[] = [];
  if (lines.length > 0) layers.push({ kind: "lines", id: "paths", name: w.data.layers.paths, ...AT, clip: "none", data: lines.map((l) => clean({ x: l.x, y: l.y, x2: l.x2, y2: l.y2, team: l.team ?? "home" })), style: { width: 0.35, dash: "dashed" } });
  layers.push({ kind: "points", id: "elements", name: w.data.layers.elements, ...AT, clip: "none", data: points, style: { size: 1.5 } });
  if (labels.length > 0) layers.push({ kind: "text", id: "labels", name: w.data.layers.elements, ...AT, clip: "none", data: labels, style: { size: 1.15, weight: 800 } });
  const totals: ElementTotals = { elements: elements.length, kinds };
  const who = sorted.map((e) => e.name ?? ELEMENT_NAMES[e.kind][language]).slice(0, 6).join(", ");
  const summary = elements.length === 0 ? "" : fill(w.data.summaryElements, { n: elements.length, who });
  const chart = assemble(o, layers, { title, summary, totals, tableLayers: ["elements"] });
  chart.table = (): string => {
    const c = w.data.columns;
    const rows = sorted.map((e, i) => `<tr><td>${e.order ?? i + 1}</td><td>${esc(e.name ?? "")}</td><td>${esc(ELEMENT_NAMES[e.kind][language])}</td><td>${round(e.x, 1)}, ${round(e.y, 1)}</td></tr>`).join("");
    return `<table class="ky-table"><thead><tr><th>${c.order}</th><th>${c.element}</th><th>${c.kind}</th><th>x, y (m)</th></tr></thead><tbody>${rows}</tbody></table>`;
  };
  return chart;
}
