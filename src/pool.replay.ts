// A race replay by lane: the swimmers of a race move down their lanes and back as their splits say, as a timeline of the package's replay (`drawFrame`, `mountKyogijo(...).replay`, `<kyogijo-field>`). Each
// swimmer is a mark with the lane's number on it, in the frame of the pool (`swimming`: metres from the middle of the water, x towards the turning end, y towards the top of the drawing, so that lane 1 is below
// lane 8). Between two splits a swimmer goes at the speed of the split, in a straight line; before the reaction time the swimmer is on the block. The wall is touched at the turns, and the field's order is the order
// of the marks. Nothing here is a model of swimming: it is the splits the caller has, played back.
import { swimPlan, type LanePlan, type SwimPlan } from "./pool.ts";
import { formatTime, type RaceRow } from "./pool.race.ts";
import type { ReplayEvent, ReplayFrame, ReplayObject, ReplayTimeline } from "./replay.types.ts";
import { KYOGIJO_STRINGS } from "./strings.core.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/** What a race replay is made with. */
export interface RaceReplayOptions {
  /** Frames a second. 10 by default. */
  fps?: number;
  /** Seconds of waiting before the start signal and of staying on after the last touch. 1.5 and 3 by default. */
  lead?: number;
  tail?: number;
  /** The language of the events' words. English by default. */
  language?: Language;
  /** The reaction time of a swimmer that has none, in seconds. 0.7 by default. */
  reaction?: number;
  /** How far behind the wall a swimmer on the block stands, in metres. 0.4 by default. */
  block?: number;
}

const finite = (value: number): boolean => Number.isFinite(value);

/** The marks of a swimmer's progress: the seconds after the start signal at which the swimmer has swum each distance, from the splits (and the final time). */
export interface Progress {
  /** Distance in metres against the seconds after the signal; the first point is the reaction time at 0 m. */
  points: [number, number][];
  /** Whether the swimmer is a swimmer in the water at all (a swimmer who did not start stays on the block). */
  swims: boolean;
}

/** The progress of one row over a race of `distance` metres with a split every `every` metres. */
export function progressOf(row: RaceRow, distance: number, every: number, reaction: number): Progress {
  const start = row.reaction ?? reaction;
  if (row.status === "dns") return { points: [[0, 0]], swims: false };
  const points: [number, number][] = [[start, 0]];
  let last = start;
  row.splits.forEach((cum, i) => {
    if (!finite(cum)) return;
    const at = Math.min(distance, (i + 1) * every);
    if (cum <= last) return;
    // A split is the distance the swimmer has swum when the clock reads it: the last one is the whole race.
    points.push([cum, i === row.splits.length - 1 && row.time !== undefined && Math.abs(cum - row.time) < 1e-6 ? distance : at]);
    last = cum;
  });
  const end = points[points.length - 1];
  // A time without all its splits: the rest is swum at one speed up to it.
  if (row.time !== undefined && row.time > end[0] && row.status !== "dnf" && end[1] < distance) points.push([row.time, distance]);
  return { points, swims: points.length > 1 };
}

/** The metres a swimmer has swum `t` seconds after the signal, by straight lines between the points of progress; before the reaction it is 0, after the last it stays. */
export function distanceAt(progress: Progress, t: number): number {
  const p = progress.points;
  if (t <= p[0][0]) return 0;
  for (let i = 1; i < p.length; i += 1) {
    if (t <= p[i][0]) {
      const [t0, d0] = p[i - 1];
      const [t1, d1] = p[i];
      return d0 + ((t - t0) / (t1 - t0)) * (d1 - d0);
    }
  }
  return p[p.length - 1][1];
}

/** The place along the pool, in metres from the starting wall, of a swimmer who has swum `d` metres in a pool of `length`: down the first length, back the next. */
export function alongPool(d: number, length: number): number {
  const lap = Math.floor(d / length + 1e-9);
  const rest = d - lap * length;
  return lap % 2 === 0 ? rest : length - rest;
}

/**
 * The seconds after the signal at which a swimmer has swum `d` metres: the inverse of `distanceAt` over the progress, for the turns.
 */
function timeAt(progress: Progress, d: number): number | undefined {
  const p = progress.points;
  for (let i = 1; i < p.length; i += 1) {
    if (d <= p[i][1] + 1e-9 && p[i][1] > p[i - 1][1]) {
      const [t0, d0] = p[i - 1];
      const [t1, d1] = p[i];
      return t0 + ((d - d0) / (d1 - d0)) * (t1 - t0);
    }
  }
  return undefined;
}

/**
 * The replay of a race by lane. Give the options of a swimming drawing (`{ pool: { race } }`, with a `course` and `lanes` if they are not the 50 m pool's of eight): each swimmer with splits is played back from them.
 * The timeline is in the pool's frame (`from: "swimming"`) in metres; its events are the turns at the walls and the finish, each with the swimmer's name and, at the finish, the time.
 * @throws TypeError when the options have no race, RangeError for a race with no swimmer that has splits or a time.
 * @example
 * ```ts
 * import { raceTimeline, drawFrame } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const pool = { race: { distance: 100, swimmers: [{ lane: 4, name: "A. Swimmer", splits: [26, 54.2] }, { lane: 5, name: "B. Swimmer", splits: [26.4, 55] }] } };
 * const timeline = raceTimeline({ pool });
 * console.log(timeline.frames.length > 100, timeline.events.map((e) => e.kind).join(), drawFrame({ sport: "swimming", pool }, timeline, 20).startsWith("<svg"));
 * // true start,turn,turn,finish,finish true
 * ```
 */
export function raceTimeline(options: Pick<SurfaceOptions, "pool">, replay: RaceReplayOptions = {}): ReplayTimeline & { events: ReplayEvent[] } {
  const plan: SwimPlan = swimPlan({ sport: "swimming", pool: options.pool });
  const race = plan.race;
  if (race === undefined) throw new TypeError("a race replay needs a race: { pool: { race: { swimmers: [...] } } }");
  const fps = typeof replay.fps === "number" && replay.fps >= 1 && replay.fps <= 60 ? replay.fps : 10;
  const lead = typeof replay.lead === "number" && replay.lead >= 0 ? replay.lead : 1.5;
  const tail = typeof replay.tail === "number" && replay.tail >= 0 ? replay.tail : 3;
  const reaction = typeof replay.reaction === "number" && replay.reaction >= 0 ? replay.reaction : 0.7;
  const block = typeof replay.block === "number" && replay.block >= 0 ? replay.block : 0.4;
  const words = KYOGIJO_STRINGS[replay.language === "ja" ? "ja" : "en"].pool.chart;
  const lanes = new Map<number, LanePlan>(plan.lanes.map((lane) => [lane.number, lane]));
  const L = plan.length;
  const rows = race.rows.map((row) => ({ row, progress: progressOf(row, race.distance, race.splitEvery, reaction) }));
  if (!rows.some((r) => r.progress.swims)) throw new RangeError("a race replay needs a swimmer with splits or a time");
  const end = Math.max(...rows.map((r) => r.progress.points[r.progress.points.length - 1][0]));
  const total = lead + end + tail;
  const count = Math.ceil(total * fps);
  const objectAt = (r: (typeof rows)[number], t: number): ReplayObject => {
    const lane = lanes.get(r.row.lane) as LanePlan;
    const d = distanceAt(r.progress, t - lead);
    const onBlock = t - lead < r.progress.points[0][0];
    const x = onBlock ? -block : alongPool(d, L);
    return { id: `lane-${r.row.lane}`, team: "home", x: Math.round((x - L / 2) * 1000) / 1000, y: Math.round((plan.width / 2 - lane.y) * 1000) / 1000, label: r.row.name, number: r.row.lane };
  };
  const frames: ReplayFrame[] = [];
  for (let i = 0; i <= count; i += 1) {
    const t = Math.round((i / fps) * 1000) / 1000;
    frames.push({ t, objects: rows.map((r) => objectAt(r, t)) });
  }
  const events: ReplayEvent[] = [{ t: lead, kind: "start", label: words.start }];
  for (const r of rows) {
    if (!r.progress.swims) continue;
    const id = `lane-${r.row.lane}`;
    // A turn at each wall the swimmer touches before the finish.
    for (let wall = 1; wall * L < race.distance - 1e-6; wall += 1) {
      const at = timeAt(r.progress, wall * L);
      if (at !== undefined) events.push({ t: Math.round((lead + at) * 1000) / 1000, kind: "turn", by: id, label: `${r.row.name}, ${words.turn.toLowerCase()}` });
    }
    const last = r.progress.points[r.progress.points.length - 1];
    if (last[1] >= race.distance - 1e-6) events.push({ t: Math.round((lead + last[0]) * 1000) / 1000, kind: "finish", by: id, label: `${r.row.name}, ${words.finish.toLowerCase()} ${r.row.timeText ?? formatTime(last[0])}` });
  }
  events.sort((a, b) => a.t - b.t);
  return { frames, events, from: "swimming", units: "m" };
}
