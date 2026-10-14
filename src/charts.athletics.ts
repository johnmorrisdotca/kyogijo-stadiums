// The athletics data: the lane draw of a race (names and flags on the lanes of its start), its results (places, medals, times, reaction times and splits at the finish and along the lanes), a replay of the
// race (every runner on the curve of the lane, the stagger as the rules put it), and the attempts of a field event as marks in the sector or the pit with the best mark picked out. Written for this
// package from the Track and Field Facilities Manual (2019, 2.2.1.6) and Book C2.1's Technical Rules (14, 17, 25 to 38); nothing of any other package is used. The flags are the caller's: an SVG
// document as text, or an address, as a team's logo is.
import { assemble, clean, drawingOptions, languageOf, round, wordsOf, type KeyEntry } from "./charts.ts";
import type { Chart, ChartOptions, KeyItem } from "./charts.types.ts";
import { athleticsPlan, type AthleticsPlan } from "./athletics/plan.ts";
import { raceById, fieldEventById } from "./athletics/events.ts";
import { fieldEventName } from "./athletics/describe.ts";
import { curveAcross, type RaceMarks } from "./athletics/races.ts";
import { distanceOn, laneRadius, lap, pose } from "./athletics/track.ts";
import type { AthleticsFieldEvent, AthleticsRace } from "./athletics/types.ts";
import { esc } from "./format.ts";
import type { Layer, PointDatum, TextDatum } from "./layers.types.ts";
import type { ReplayEvent, ReplayFrame, ReplayLook, ReplayObject, ReplayTimeline } from "./replay.types.ts";
import { fill } from "./strings.ts";
import type { SurfaceOptions } from "./types.ts";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const K = 1 / 0.3048;

/** An athlete in a lane. */
export interface AthleticsEntry {
  /** The lane, from 1. */
  lane: number;
  name: string;
  /** The country's code or name, for the table. */
  country?: string;
  /** The flag: an SVG document as text, or an `https:` or relative address, as a team's `logo`. */
  flag?: string;
  bib?: string | number;
}

/** One athlete's result in a race. Times are in seconds from the gun. */
export interface AthleticsResult extends AthleticsEntry {
  /** The place, from 1. A runner who did not finish has none. */
  place?: number;
  /** The time in seconds from the gun, or `null` for one who did not finish. */
  time?: number | null;
  /** The reaction time in seconds (the time from the gun to the athlete's feet leaving the blocks), for a race with blocks. */
  reaction?: number;
  /** The times, from the gun, at distances along the way: `{ distance: 100, time: 10.4 }` is the time at 100 m. */
  splits?: readonly { distance: number; time: number }[];
  /** `DQ`, `DNF`, `DNS` or a note of your own, for the table. */
  note?: string;
}

/** What `laneDraw`, `raceResults` and `raceReplay` take beyond a chart's options. */
export interface AthleticsRaceOptions extends ChartOptions {
  /** The race. The 400 m by default. */
  race?: AthleticsRace;
}

/** The numbers behind a lane draw. */
export interface LaneDrawTotals {
  athletes: number;
  /** The first and the last lane drawn. */
  firstLane: number;
  lastLane: number;
}

/** The numbers behind results. */
export interface ResultsTotals {
  athletes: number;
  finished: number;
  /** The winner's name and time, or null when nobody has a place. */
  winner: { name: string; time: number } | null;
  /** The quickest reaction, in seconds. */
  quickestReaction: number | null;
}

/** An attempt in a jump or a throw. */
export interface FieldAttempt {
  athlete?: string;
  /** The mark in metres: from the inside edge of the circle (or the javelin's arc) for a throw, from the take-off line for a jump. A foul has none. */
  distance?: number | null;
  /** A throw's direction, in degrees from the sector's axis (positive to the right of the throw as the athlete faces it), or a jump's sideways place in metres from the runway's middle line. 0 by default. */
  across?: number;
  /** False for a foul. True by default when there is a distance. */
  valid?: boolean;
  /** The round of the trial, from 1. */
  round?: number;
  /** `home` or `away`, which take the layer's two colours, or any other text. */
  team?: string;
  /** The tooltip, and what a screen reader reads. */
  title?: string;
}

/** What `fieldMarks` takes. */
export interface FieldMarksOptions extends ChartOptions {
  /** The facility of the event that the marks are on, by its id (`javelin-west`, `jump-0-west`): the event's first by default. */
  facility?: string;
  /** Write each mark's distance beside it, not only the best's. Off by default. */
  labels?: boolean;
  /** For the triple jump: the take-off line is the women's (11 m from the pit) and not the men's (13 m). */
  women?: boolean;
}

/** The numbers behind a field event's marks. */
export interface FieldTotals {
  attempts: number;
  valid: number;
  fouls: number;
  best: { distance: number; athlete: string | undefined } | null;
}

const WORDS = (language: "en" | "ja") => wordsOf(language).athletics;

/** A time in seconds as it is written: `9.58`, `1:40.91`, `2:03:59.40`. */
export function formatTime(seconds: number, places = 2): string {
  if (!isNum(seconds) || seconds < 0) return "";
  const r = Math.round(seconds * 10 ** places) / 10 ** places;
  const h = Math.floor(r / 3600);
  const m = Math.floor((r - h * 3600) / 60);
  const s = r - h * 3600 - m * 60;
  const sec = s.toFixed(places).padStart(places > 0 ? places + 3 : 2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : m > 0 ? `${m}:${sec}` : s.toFixed(places);
}

function raceOf(options: AthleticsRaceOptions): AthleticsRace {
  const id = options.race ?? "400m";
  if (raceById(id) === undefined) throw new Error(`Unknown race "${String(id)}"`);
  return id;
}

/** The plan of the race's drawing, with its marks, and the marks of the race. */
function planOf(options: AthleticsRaceOptions, race: AthleticsRace, surface: Partial<SurfaceOptions> | undefined): { plan: AthleticsPlan; marks: RaceMarks } {
  const style = { ...(surface?.athletics ?? {}), races: [race] as AthleticsRace[], start: race };
  const plan = athleticsPlan({ sport: "athletics", league: surface?.league, athletics: style, units: surface?.units, pitch: surface?.pitch, detail: surface?.detail, range: surface?.range });
  void options;
  const marks = plan.races.find((r) => r.race.id === race) as RaceMarks;
  return { plan, marks };
}

const isPortraitSurface = (surface: Partial<SurfaceOptions> | undefined): boolean => surface?.orientation === "portrait";

function checkEntries(entries: readonly AthleticsEntry[], label: string): void {
  if (!Array.isArray(entries)) throw new TypeError(`${label} is a list`);
  const seen = new Set<number>();
  for (const e of entries) {
    if (typeof e !== "object" || e === null || !Number.isInteger(e.lane) || e.lane < 1) throw new TypeError(`${label}: each athlete has a lane, a whole number from 1`);
    if (seen.has(e.lane)) throw new RangeError(`${label}: lane ${e.lane} is given twice`);
    seen.add(e.lane);
  }
}

/** The drawing's options for an athletics chart: the stadium close up on the start (or the finish), the race marked, whatever the caller laid over it. */
function surfaceFor(options: AthleticsRaceOptions, title: string, race: AthleticsRace, range: "start" | "finish" | undefined): SurfaceOptions {
  const surface = options.surface ?? {};
  const style = { races: [race] as AthleticsRace[], start: race, ...(surface.athletics ?? {}) };
  return drawingOptions("athletics", { ...options, surface: { ...(range === undefined ? {} : { range }), ...surface, athletics: style } }, title, {});
}

/**
 * The lane draw of a race: each athlete's name and flag on the lane of the start, behind the lane's number, for the close-up of the start (`range: "start"`, the drawing's default). The positions are the
 * start lines' as the Manual marks them: the stagger of the 200, 400 and 800 m and the 4 x 400 m, the straight line of the sprints, the curved line of a race run without lanes.
 * @example
 * ```ts
 * import { laneDraw } from "@johnmorrisdotca/kyogijo-stadiums/athletics";
 * const chart = laneDraw([{ lane: 4, name: "M. Jacobs", country: "ITA" }, { lane: 5, name: "F. Kerley", country: "USA" }], { race: "100m" });
 * console.log(chart.totals.athletes, chart.title);
 * // 2 Lane draw, 100 m
 * ```
 */
export function laneDraw(entries: readonly AthleticsEntry[], options: AthleticsRaceOptions = {}): Chart<LaneDrawTotals> & { key: KeyItem[] } {
  checkEntries(entries, "entries");
  const race = raceOf(options);
  const language = languageOf(options);
  const w = WORDS(language);
  const info = raceById(race);
  const raceName = (info?.name[language] ?? race) as string;
  const title = fill(w.data.draw, { race: raceName });
  const o = surfaceFor(options, title, race, "start");
  const { plan, marks } = planOf(options, race, o);
  const portrait = isPortraitSurface(o);
  const names: TextDatum[] = [];
  const flags: PointDatum[] = [];
  const sorted = [...entries].sort((a, b) => a.lane - b.lane);
  // The number behind each line is a tag, sized to the view, on a bend; on a straight it is painted, 0.85 m tall. The flag and the name follow it back along the lane.
  const number = plan.digits.find((d) => d.id === "start-number");
  const tag = number?.tag === true;
  const unit = number === undefined ? 0.85 : number.h;
  const numberBack = tag ? unit * 0.78 + 0.35 : unit * 1.2;
  const numberHalf = tag ? unit * 0.78 : unit * 0.45;
  const flagSide = 0.9 * (unit / 0.85);
  const flagAt = numberBack + numberHalf + flagSide / 2 + 0.2;
  const nameAt = flagAt + flagSide / 2 + 0.3;
  const nameSize = Math.max(0.45, unit * (tag ? 0.42 : 0.6));
  for (const e of sorted) {
    const start = marks.starts.find((s) => s.lane === e.lane);
    if (start === undefined) continue;
    const fx = Math.cos(start.heading);
    const fy = Math.sin(start.heading);
    const back = (d: number): [number, number] => [start.x - fx * d, start.y - fy * d];
    const [nx, ny] = back(nameAt);
    names.push(clean({ x: nx, y: ny, text: e.name, anchor: "end" as const, size: nameSize, rotate: portrait ? -90 : 0, title: e.country === undefined ? undefined : `${e.name}, ${e.country}` }));
    if (e.flag !== undefined) {
      const [px, py] = back(flagAt);
      flags.push(clean({ x: px, y: py, shape: "logo" as const, logo: e.flag, size: flagSide / 1.8, title: e.country }));
    }
  }
  const at = { from: "athletics", units: "m" as const };
  const layers: Layer[] = [];
  if (flags.length > 0) layers.push({ kind: "points", id: "flags", name: w.data.layers.flags, ...at, clip: "none", data: flags, style: { shape: "logo", size: flagSide / 1.8 } });
  layers.push({ kind: "text", id: "names", name: w.data.layers.names, ...at, clip: "none", data: names, style: { size: nameSize, anchor: "end", weight: 800 } });
  const lanes = sorted.map((e) => e.lane);
  const totals: LaneDrawTotals = { athletes: sorted.length, firstLane: lanes[0] ?? 0, lastLane: lanes[lanes.length - 1] ?? 0 };
  const summary = sorted.length === 0 ? "" : fill(w.data.summaryDraw, { n: totals.athletes, race: raceName, first: totals.firstLane, last: totals.lastLane });
  const chart = assemble(o, layers, { title, summary, totals, tableLayers: ["names"] });
  chart.table = (): string => entriesTable(sorted, language);
  return chart;
}

/** The lane draw as an HTML table: lane, athlete, country. Every cell is escaped. */
function entriesTable(entries: readonly AthleticsEntry[], language: "en" | "ja"): string {
  const c = WORDS(language).data.columns;
  const rows = entries.map((e) => `<tr><td>${e.lane}</td><td>${esc(e.name)}</td><td>${esc(e.country ?? "")}</td></tr>`).join("");
  return `<table class="ky-table"><thead><tr><th>${c.lane}</th><th>${c.athlete}</th><th>${c.country}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const MEDAL_COLOURS: Readonly<Record<string, string>> = { gold: "#d4a017", silver: "#b8bec6", bronze: "#b87333" };

/**
 * The results of a race on the finish line's close-up: after the line, in each lane, a disc with the place (gold, silver and bronze for the first three), the athlete's name and time; the reaction time
 * behind the start line and the splits along the lane as small marks with their times; and a table of all of it. Times are in seconds from the gun.
 * @example
 * ```ts
 * import { raceResults } from "@johnmorrisdotca/kyogijo-stadiums/athletics";
 * const chart = raceResults([{ lane: 4, name: "M. Jacobs", place: 1, time: 9.8 }, { lane: 5, name: "F. Kerley", place: 2, time: 9.84 }], { race: "100m" });
 * console.log(chart.totals.winner?.name, chart.summary);
 * // M. Jacobs M. Jacobs won the 100 m in 9.80.
 * ```
 */
export function raceResults(results: readonly AthleticsResult[], options: AthleticsRaceOptions & { splits?: boolean; reactions?: boolean } = {}): Chart<ResultsTotals> & { key: KeyItem[] } {
  checkEntries(results, "results");
  const race = raceOf(options);
  const language = languageOf(options);
  const w = WORDS(language);
  const info = raceById(race);
  const raceName = (info?.name[language] ?? race) as string;
  const title = fill(w.data.results, { race: raceName });
  const o = surfaceFor(options, title, race, "finish");
  const { plan, marks } = planOf(options, race, o);
  const oval = plan.oval;
  const S = oval.straight;
  const finishX = S / 2;
  const sorted = [...results].sort((a, b) => (a.place ?? 99) - (b.place ?? 99) || a.lane - b.lane);
  const lanes = plan.straight?.lane ?? oval.lane;
  const top = plan.straight?.y0 ?? oval.radius;
  const at = { from: "athletics", units: "m" as const };
  const discs: PointDatum[] = [];
  const places: TextDatum[] = [];
  const words: TextDatum[] = [];
  const reactions: TextDatum[] = [];
  const splits: PointDatum[] = [];
  for (const r of sorted) {
    const y = top + (r.lane - 0.5) * lanes;
    const medal = r.place === 1 ? "gold" : r.place === 2 ? "silver" : r.place === 3 ? "bronze" : undefined;
    const done = isNum(r.time) && r.place !== undefined;
    if (done) {
      discs.push(clean({ x: finishX + 1.15, y, shape: "circle" as const, size: 0.95, color: medal === undefined ? "#2f3a44" : MEDAL_COLOURS[medal], title: `${r.name}, ${medal === undefined ? "" : `${w.data.medals[medal]}, `}${formatTime(r.time as number)}` }));
      places.push({ x: finishX + 1.15, y, text: r.place as number, size: 0.55, color: medal === undefined ? "#ffffff" : "#1c1f1d" });
      words.push({ x: finishX + 2.05, y, text: `${r.name}  ${formatTime(r.time as number)}`, anchor: "start", size: 0.5 });
    } else if (r.note !== undefined) {
      words.push({ x: finishX + 2.05, y, text: `${r.name}  ${r.note}`, anchor: "start", size: 0.5 });
    }
    if (options.reactions !== false && isNum(r.reaction)) {
      const start = marks.starts.find((s) => s.lane === r.lane);
      if (start !== undefined) reactions.push({ x: start.x + Math.cos(start.heading) * 2.1 - Math.cos(start.heading + Math.PI / 2) * 0, y: start.y + Math.sin(start.heading) * 2.1, text: `${r.reaction.toFixed(3)}`, size: 0.4, anchor: "middle", title: fill(w.data.reaction, { t: r.reaction.toFixed(3) }) });
    }
    if (options.splits !== false && r.splits !== undefined) {
      const start = marks.starts.find((s) => s.lane === r.lane);
      if (start !== undefined) {
        for (const sp of r.splits) {
          if (!isNum(sp.distance) || !isNum(sp.time)) continue;
          const p = alongLane(plan, marks, start.lane, sp.distance);
          splits.push({ x: p[0], y: p[1], shape: "circle", size: 0.5, title: fill(w.data.split, { d: round(sp.distance, 1), t: formatTime(sp.time) }), value: sp.time });
        }
      }
    }
  }
  const layers: Layer[] = [];
  if (splits.length > 0) layers.push({ kind: "points", id: "splits", name: w.data.layers.splits, ...at, clip: "none", data: splits, style: { size: 0.5, fill: "#f2c230" } });
  layers.push({ kind: "points", id: "places", name: w.data.layers.medals, ...at, clip: "none", data: discs, style: { size: 0.95 } });
  layers.push({ kind: "text", id: "place-numbers", name: w.data.layers.medals, ...at, clip: "none", data: places, style: { size: 0.55, weight: 800, halo: false } });
  layers.push({ kind: "text", id: "athletes", name: w.data.layers.names, ...at, clip: "none", data: words, style: { size: 0.5, anchor: "start", weight: 800 } });
  if (reactions.length > 0) layers.push({ kind: "text", id: "reactions", name: w.data.layers.reactions, ...at, clip: "none", data: reactions, style: { size: 0.4 } });
  const winner = sorted.find((r) => r.place === 1 && isNum(r.time));
  const react = results.filter((r) => isNum(r.reaction)).map((r) => r.reaction as number);
  const totals: ResultsTotals = {
    athletes: results.length,
    finished: results.filter((r) => isNum(r.time) && r.place !== undefined).length,
    winner: winner === undefined ? null : { name: winner.name, time: winner.time as number },
    quickestReaction: react.length === 0 ? null : Math.min(...react),
  };
  const summary = winner === undefined ? "" : fill(w.data.summaryResults, { winner: winner.name, race: raceName, time: formatTime(totals.winner?.time ?? 0) });
  const chart = assemble(o, layers, { title, summary, totals, tableLayers: ["places"] });
  chart.table = (): string => resultsTable(sorted, language);
  const entries: KeyEntry[] = [];
  chart.key = [];
  void entries;
  return chart;
}

/** The point `distance` metres along the lane of a race from its start line, for a splits mark: on the lane's own line, and in a race that leaves its lanes, drawn in towards the inside. */
function alongLane(plan: AthleticsPlan, marks: RaceMarks, lane: number, distance: number): [number, number] {
  const start = marks.starts.find((s) => s.lane === lane);
  if (start === undefined) return [0, 0];
  return runnerAt(plan, marks, lane, distance);
}

/** The results as an HTML table: place, lane, athlete, country, time, reaction, the splits. Every cell is escaped. */
function resultsTable(results: readonly AthleticsResult[], language: "en" | "ja"): string {
  const w = WORDS(language).data;
  const c = w.columns;
  const rows = results
    .map((r) => {
      const splits = (r.splits ?? []).map((s) => `${round(s.distance, 1)} ${w.metres}: ${formatTime(s.time)}`).join("; ");
      return `<tr><td>${r.place ?? ""}</td><td>${r.lane}</td><td>${esc(r.name)}</td><td>${esc(r.country ?? "")}</td><td>${isNum(r.time) ? formatTime(r.time) : esc(r.note ?? "")}</td><td>${isNum(r.reaction) ? r.reaction.toFixed(3) : ""}</td><td>${esc(splits)}</td></tr>`;
    })
    .join("");
  return `<table class="ky-table"><thead><tr><th>${c.place}</th><th>${c.lane}</th><th>${c.athlete}</th><th>${c.country}</th><th>${c.time}</th><th>${c.reaction}</th><th>${c.splits}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// ----- the replay

/** One runner of a replay. */
export interface AthleticsRunner extends AthleticsEntry {
  /** The time, in seconds from the gun, at which the runner finishes. */
  time: number;
  /** The reaction time, in seconds; the runner stays on the blocks until then. 0.15 by default. */
  reaction?: number;
  /** Times, from the gun, at distances along the way, which the runner's pace follows; without them the pace is even. */
  splits?: readonly { distance: number; time: number }[];
}

/** What `raceReplay` takes. */
export interface RaceReplayOptions extends AthleticsRaceOptions {
  /** Seconds between two frames. 0.2 by default. */
  step?: number;
  /** How far past the finish line the runners go on, in metres. 8 by default. */
  runOut?: number;
}

/** What `raceReplay` gives back: the timeline, the drawing's options to lay it on, a look for it and a sentence. */
export interface RaceReplay {
  timeline: ReplayTimeline;
  /** The drawing's options: the stadium with the race marked. Pass them with the timeline to `drawFrame`, `createReplay` or `replayElement`. */
  options: SurfaceOptions;
  /** A look for the frames: the runners drawn larger, no trails, the lane numbers on them. */
  look: ReplayLook;
  title: string;
  summary: string;
  /** The time of the last runner to finish, in seconds. */
  duration: number;
}

const smooth = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** The distance a runner has run at a time, by the reaction time, the splits and the finish: straight lines between them, standing until the reaction. */
export function distanceRun(runner: AthleticsRunner, total: number, t: number): number {
  const rt = isNum(runner.reaction) ? runner.reaction : 0.15;
  if (t <= rt) return 0;
  const pts: [number, number][] = [[rt, 0]];
  for (const s of [...(runner.splits ?? [])].sort((a, b) => a.time - b.time)) if (s.time > rt && s.time < runner.time && s.distance > 0 && s.distance < total) pts.push([s.time, s.distance]);
  pts.push([runner.time, total]);
  for (let i = 1; i < pts.length; i += 1) {
    if (t <= pts[i][0]) {
      const [t0, d0] = pts[i - 1];
      const [t1, d1] = pts[i];
      return d0 + ((t - t0) / (t1 - t0)) * (d1 - d0);
    }
  }
  // After the finish: carry on at the pace of the last stretch, slowing to a stop over three seconds.
  const [t0, d0] = pts[pts.length - 2];
  const [t1, d1] = pts[pts.length - 1];
  const v = (d1 - d0) / (t1 - t0);
  const u = Math.min(t - t1, 3);
  return d1 + v * (u - (u * u) / 6);
}

/** The running line's distance mapped from one radius to another by the part of the track it is on (its bend's angle, its straight's length): where a runner who has cut in to another lane is. */
function mapDistance(plan: AthleticsPlan, from: number, to: number, s: number): number {
  const S = plan.oval.straight;
  const L = 2 * S + 2 * Math.PI * from;
  const d = ((s % L) + L) % L;
  const turns = Math.floor(s / L);
  const bend = Math.PI * from;
  const Lto = 2 * S + 2 * Math.PI * to;
  let out: number;
  if (d <= bend) out = (d / from) * to;
  else if (d <= bend + S) out = Math.PI * to + (d - bend);
  else if (d <= 2 * bend + S) out = Math.PI * to + S + ((d - bend - S) / from) * to;
  else out = 2 * Math.PI * to + S + (d - 2 * bend - S);
  return out + turns * Lto;
}

/**
 * Where a runner is when `d` metres have been run from the start line of the lane: in the lane, on the lane's own curve, for a race run in lanes; and, for a race that leaves them, in the lane as far as
 * the breakline (or, with none, the start) and then moving in to lane 1's line over the next 40 m, as a runner does once free.
 */
function runnerAt(plan: AthleticsPlan, marks: RaceMarks, lane: number, d: number): [number, number] {
  const o = plan.oval;
  const start = marks.starts.find((s) => s.lane === lane);
  if (start === undefined) return [0, 0];
  const race = marks.race;
  const total = race.distance;
  if (race.kind === "straight") {
    const x = Math.min(start.x + d, start.x + total + 100);
    return [x, start.y];
  }
  const r = laneRadius(o, lane);
  const r1 = laneRadius(o, 1);
  const s = start.s + d;
  // Where the runner leaves the lane: the breakline's crossing of the lane, or the start for a race run without lanes.
  let free = Infinity;
  if (race.kind === "curved" || race.kind === "steeplechase") free = 0;
  else if (race.breakline === true && marks.breakline !== undefined) {
    const a = r1;
    const [px, py] = curveAcross(o, { side: plan.indoor ? "right" : "left", f0: 0, wire: o.straight }, a, r, r, 1)[0];
    const sBreak = distanceOn(o, r, px, py);
    const L = lap(o, lane);
    free = (((sBreak - start.s) % L) + L) % L;
  }
  const w = free === Infinity ? 0 : smooth((d - free) / 40);
  const p = pose(o, r, s);
  if (w === 0) return [p.x, p.y];
  const q = pose(o, r1, mapDistance(plan, r, r1, s));
  return [p.x + (q.x - p.x) * w, p.y + (q.y - p.y) * w];
}

/**
 * A replay of a race: every runner, from the gun, on the curve of the lane (the stagger of the start as the Manual's table has it), in the pace of the reaction time, the splits and the finish time,
 * to the line and on to a stop. A race that leaves its lanes (the 800 m after its breakline, the long races from the start) is drawn with the runners moving in to the inside. The positions are in
 * the athletics frame (metres from the middle of the track), so the timeline is for the stadium drawn whole or close up. The relays are not replayed.
 * @example
 * ```ts
 * import { raceReplay } from "@johnmorrisdotca/kyogijo-stadiums/athletics";
 * const replay = raceReplay([{ lane: 1, name: "A", time: 10.1 }, { lane: 2, name: "B", time: 10.3 }], { race: "100m" });
 * console.log(replay.timeline.frames.length > 40, replay.duration);
 * // true 10.3
 * ```
 */
export function raceReplay(runners: readonly AthleticsRunner[], options: RaceReplayOptions = {}): RaceReplay {
  checkEntries(runners, "runners");
  const race = raceOf(options);
  const info = raceById(race);
  if (info?.legs !== undefined) throw new RangeError(`The ${race} is a relay: a replay of a relay is not made`);
  const language = languageOf(options);
  const w = WORDS(language);
  const raceName = (info?.name[language] ?? race) as string;
  const title = fill(w.data.replay, { race: raceName });
  const o = surfaceFor(options, title, race, undefined);
  const { plan, marks } = planOf(options, race, o);
  const step = isNum(options.step) && options.step > 0 ? options.step : 0.2;
  const runOut = isNum(options.runOut) && options.runOut >= 0 ? options.runOut : 8;
  for (const r of runners) if (!isNum(r.time) || r.time <= 0) throw new RangeError(`runner in lane ${r.lane}: the time is a number of seconds above zero`);
  const total = (info as { distance: number }).distance;
  const duration = Math.max(...runners.map((r) => r.time), 0);
  const end = duration + 3.2;
  const frames: ReplayFrame[] = [];
  const finishX = plan.oval.straight / 2;
  for (let k = 0; k * step <= end + 1e-9; k += 1) {
    const t = Math.round(k * step * 1000) / 1000;
    const objects: ReplayObject[] = [];
    for (const r of [...runners].sort((a, b) => a.lane - b.lane)) {
      const d = distanceRun(r, total, t);
      const run = Math.min(d, total + runOut);
      // The runner reaches the line at `total`; beyond it the run-out is straight along the finish straight.
      const [x, y] = d <= total ? runnerAt(plan, marks, r.lane, d) : (() => { const [fx, fy] = runnerAt(plan, marks, r.lane, total); return [Math.max(fx, finishX) + (run - total), fy] as [number, number]; })();
      objects.push(clean({ id: `lane-${r.lane}`, team: "home" as const, x: round(x, 3), y: round(y, 3), label: r.name, number: r.lane }));
    }
    frames.push({ t, objects });
  }
  const events: ReplayEvent[] = [{ t: 0, kind: "gun", label: w.data.gun }];
  for (const r of runners) {
    const [x, y] = runnerAt(plan, marks, r.lane, total);
    events.push({ t: r.time, kind: "finish", team: "home", x: round(x, 3), y: round(y, 3), by: `lane-${r.lane}`, label: fill(w.data.finish, { name: r.name, time: formatTime(r.time) }) });
  }
  events.sort((a, b) => a.t - b.t);
  const timeline: ReplayTimeline = { frames, events, from: "athletics", units: "m" };
  const summary = fill(w.data.summaryReplay, { n: runners.length, race: raceName });
  return { timeline, options: { ...o, title }, look: { trail: 0, scale: 0.8, numbers: true, hold: 2 }, title, summary, duration };
}

// ----- field events

/** The distance from the facility's centre to where a mark is measured from: the circle's inside edge (Rule 32), or the javelin's arc (8 m, Rule 32.9). */
const MEASURED_FROM: Readonly<Partial<Record<AthleticsFieldEvent, number>>> = { "shot-put": 1.0675, "discus-throw": 1.25, "hammer-throw": 1.0675, "javelin-throw": 8 };

/**
 * The attempts of a field event as marks: each valid throw in its sector at its distance and direction, each jump in its pit at its distance from the take-off line, the best of them picked out with
 * a ring and its distance written beside it. A foul has no mark and is in the table. Put them on the stadium (`athletics: { events: [event] }`) or on the event alone (`athletics: { layout: event }`).
 * @example
 * ```ts
 * import { fieldMarks } from "@johnmorrisdotca/kyogijo-stadiums/athletics";
 * const chart = fieldMarks("javelin-throw", [{ athlete: "A", distance: 84.2 }, { athlete: "A", distance: 88.1, across: -3 }, { athlete: "A", valid: false }]);
 * console.log(chart.totals.best?.distance, chart.totals.fouls);
 * // 88.1 1
 * ```
 */
export function fieldMarks(event: AthleticsFieldEvent, attempts: readonly FieldAttempt[], options: FieldMarksOptions = {}): Chart<FieldTotals> & { key: KeyItem[] } {
  if (fieldEventById(event) === undefined) throw new Error(`Unknown field event "${String(event)}"`);
  if (!Array.isArray(attempts)) throw new TypeError("attempts is a list of attempts");
  const language = languageOf(options);
  const w = WORDS(language);
  const surface = options.surface ?? {};
  const layout = surface.athletics?.layout === event;
  const title = fill(w.data.marks, { event: fieldEventName(event, language) });
  const style = { events: [event] as AthleticsFieldEvent[], ...(surface.athletics ?? {}) };
  const o = drawingOptions("athletics", { ...options, surface: { ...surface, athletics: style } }, title, {});
  const plan = athleticsPlan({ sport: "athletics", league: surface.league, athletics: style, pitch: surface.pitch });
  const facility = plan.facilities.find((f) => f.event === event && (options.facility === undefined || f.id === options.facility));
  if (facility === undefined) throw new Error(options.facility === undefined ? `The stadium has no ${event} facility: put the event in athletics.events` : `The ${event} has no facility "${options.facility}": use one of ${plan.facilities.filter((f) => f.event === event).map((f) => f.id).join(", ")}`);
  const jump = event === "long-jump" || event === "triple-jump";
  const heading = facility.heading;
  const from = (x: number, y: number): [number, number] => (layout ? [(x - plan.box.x0) * K, (y - plan.box.y0) * K] : [x, y]);
  const at = layout ? { units: "ft" as const } : { from: "athletics", units: "m" as const };
  // A layer's sizes are in its own units: feet for the event alone, metres in the athletics frame.
  const u = layout ? K : 1;
  const takeoff = event === "long-jump" ? 3 : options.women === true ? 11 : 13;
  const place = (a: FieldAttempt): [number, number] => {
    const d = a.distance as number;
    const across = isNum(a.across) ? a.across : 0;
    if (jump) {
      // The pit's near end is the facility; the take-off line is `takeoff` m before it, and the mark is `d` m from the line.
      const along = d - takeoff;
      return [facility.x + Math.cos(heading) * along - Math.sin(heading) * across, facility.y + Math.sin(heading) * along + Math.cos(heading) * across];
    }
    const th = heading + (across * Math.PI) / 180;
    const r = d + (MEASURED_FROM[event] ?? 0);
    return [facility.x + r * Math.cos(th), facility.y + r * Math.sin(th)];
  };
  const valid = attempts.filter((a) => isNum(a.distance) && a.valid !== false);
  const fouls = attempts.length - valid.length;
  const bestOne = valid.reduce<FieldAttempt | undefined>((b, a) => (b === undefined || (a.distance as number) > (b.distance as number) ? a : b), undefined);
  const marks: PointDatum[] = [];
  const labels: TextDatum[] = [];
  valid.forEach((a, i) => {
    const [x, y] = from(...place(a));
    const isBest = a === bestOne;
    const text = `${(a.distance as number).toFixed(2)}`;
    marks.push(clean({ x, y, team: a.team ?? "home", outcome: isBest ? "best" : "attempt", value: a.distance as number, title: a.title ?? `${a.athlete === undefined ? "" : `${a.athlete}, `}${text} ${w.data.metres}${isBest ? `, ${w.data.best}` : ""}` }));
    if (isBest || options.labels === true) labels.push({ x: x + 1.4 * u, y: y - 1.4 * u, text, size: (isBest ? 0.9 : 0.6) * u, anchor: "start" });
    void i;
  });
  const layers: Layer[] = [];
  const size = 1.1 * u;
  layers.push({ kind: "points", id: "attempts", name: w.data.layers.attempts, ...at, clip: "none", data: marks, style: { size, outcomes: { best: { shape: "star", scale: 1.7 }, attempt: {} } } });
  if (labels.length > 0) layers.push({ kind: "text", id: "marks", name: w.data.layers.best, ...at, clip: "none", data: labels, style: { size: 0.8 * u, weight: 800 } });
  const totals: FieldTotals = { attempts: attempts.length, valid: valid.length, fouls, best: bestOne === undefined ? null : { distance: bestOne.distance as number, athlete: bestOne.athlete } };
  const summary = bestOne === undefined ? "" : fill(w.data.summaryMarks, { n: attempts.length, best: `${(bestOne.distance as number).toFixed(2)} ${w.data.metres}`, who: bestOne.athlete ?? "" });
  const chart = assemble(o, layers, { title, summary, totals, tableLayers: ["attempts"] });
  chart.table = (): string => attemptsTable(attempts, bestOne, language);
  return chart;
}

/** The attempts as an HTML table: the round, the athlete, the mark, whether it was valid. The best is in bold. Every cell is escaped. */
function attemptsTable(attempts: readonly FieldAttempt[], best: FieldAttempt | undefined, language: "en" | "ja"): string {
  const w = WORDS(language).data;
  const c = w.columns;
  const rows = attempts
    .map((a, i) => {
      const mark = isNum(a.distance) && a.valid !== false ? `${(a.distance).toFixed(2)}` : w.foul;
      const cell = a === best ? `<strong>${mark}</strong>` : mark;
      return `<tr><td>${a.round ?? i + 1}</td><td>${esc(a.athlete ?? "")}</td><td>${cell}</td><td>${isNum(a.distance) && a.valid !== false ? w.yes : w.no}</td></tr>`;
    })
    .join("");
  return `<table class="ky-table"><thead><tr><th>${c.round}</th><th>${c.athlete}</th><th>${c.distance}</th><th>${c.valid}</th></tr></thead><tbody>${rows}</tbody></table>`;
}
