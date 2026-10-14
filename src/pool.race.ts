// A race read and checked: the lanes the swimmers are in, their times worked out from what the data says, their places, their splits and the pace of each. Pure data: nothing is drawn here.
import type { PaceOptions, PoolRace, RaceShow, Swimmer, SwimmerStatus } from "./pool.types.ts";

/** A time in seconds from a number or from text: `26.12`, `"26.12"`, `"1:46.91"`. `undefined` when it is neither. */
export function parseTime(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : undefined;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  const clock = /^(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/.exec(text);
  if (clock !== null) return Number(clock[1]) * 60 + Number(clock[2]) + (clock[3] === undefined ? 0 : Number(`0.${clock[3]}`));
  const plain = /^(\d{1,4})(?:[.,](\d{1,3}))?$/.exec(text);
  return plain === null ? undefined : Number(plain[1]) + (plain[2] === undefined ? 0 : Number(`0.${plain[2]}`));
}

/**
 * A time in seconds as swimming writes it, to the hundredth: `26.12`, `1:46.91`, `14:31.02`. A time that rounds to the next minute carries into it.
 * @example
 * ```ts
 * import { formatTime } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * console.log(formatTime(26.121), formatTime(106.9), formatTime(59.996));
 * // 26.12 1:46.90 1:00.00
 * ```
 */
export function formatTime(seconds: number): string {
  const hundredths = Math.round(seconds * 100);
  const minutes = Math.floor(hundredths / 6000);
  const rest = hundredths - minutes * 6000;
  const whole = Math.floor(rest / 100);
  const part = String(rest - whole * 100).padStart(2, "0");
  return minutes === 0 ? `${whole}.${part}` : `${minutes}:${String(whole).padStart(2, "0")}.${part}`;
}

const STATUSES: readonly SwimmerStatus[] = ["dq", "dns", "dnf"];

/** One lane of a race as it is drawn. */
export interface RaceRow {
  swimmer: Swimmer;
  lane: number;
  name: string;
  abbr: string;
  flag: string | undefined;
  color: string | undefined;
  seed: string | undefined;
  /** The final time in seconds and as it is written (a time of text that cannot be read is written as it is). */
  time: number | undefined;
  timeText: string | undefined;
  place: number | undefined;
  reaction: number | undefined;
  /** The cumulative times at each split, in seconds; `NaN` for one the data lacks. */
  splits: number[];
  status: SwimmerStatus | undefined;
  record: string | undefined;
}

/** A race, checked, with what is shown and the pace of the field. */
export interface RacePlan {
  event: string | undefined;
  /** The metres of the race. */
  distance: number;
  /** The metres between two splits. */
  splitEvery: number;
  rows: RaceRow[];
  show: Required<RaceShow>;
  pace: Required<PaceOptions> | null;
  /** The seconds per 100 m of the fastest and the slowest split of the field, for the colour of the pace bars. */
  fastest: number | undefined;
  slowest: number | undefined;
  /** True when any swimmer has a time, a status or a place. */
  hasResults: boolean;
  hasSplits: boolean;
  hasReaction: boolean;
}

const clean = (text: unknown, max: number): string | undefined => {
  if (typeof text !== "string") return undefined;
  const one = text.replace(/\s+/g, " ").trim();
  return one === "" ? undefined : one.slice(0, max);
};

const SHOW: Required<RaceShow> = { names: true, flags: true, results: true, reaction: true, splits: true, medals: true, seeds: true };

/** The seconds per 100 m of the split from `from` to `to` seconds over `metres`. */
export const pacePer100 = (from: number, to: number, metres: number): number => ((to - from) * 100) / metres;

/**
 * Read and check a race for a pool whose lanes are numbered `lanes`, `splitEvery` metres apart by default and `length` metres long.
 * `lanes` are the pool's lane numbers in the order they lie down the drawing, which is the order the rows are given in. A swimmer with no `time` whose splits reach the whole race has the last split for it.
 * @throws RangeError for a lane the pool does not have, or two swimmers in one lane. @throws TypeError when `swimmers` is not a list.
 */
export function racePlan(race: PoolRace, lanes: readonly number[], defaults: { splitEvery: number; length: number }): RacePlan {
  if (typeof race !== "object" || race === null || !Array.isArray(race.swimmers)) throw new TypeError("a race needs swimmers: a list of { lane, name, ... }");
  const seen = new Set<number>();
  const rows: RaceRow[] = [];
  for (const swimmer of race.swimmers as readonly Swimmer[]) {
    if (typeof swimmer !== "object" || swimmer === null) throw new TypeError("a swimmer is { lane, name, ... }");
    const lane = swimmer.lane;
    if (!Number.isInteger(lane) || !lanes.includes(lane)) throw new RangeError(`This pool has no lane ${String(lane)}: its lanes are ${Math.min(...lanes)} to ${Math.max(...lanes)}`);
    if (seen.has(lane)) throw new RangeError(`Lane ${lane} has two swimmers`);
    seen.add(lane);
    const timeText = typeof swimmer.time === "number" ? (Number.isFinite(swimmer.time) ? formatTime(swimmer.time) : undefined) : clean(swimmer.time, 12);
    const time = parseTime(swimmer.time);
    const splits = Array.isArray(swimmer.splits) ? swimmer.splits.map((value) => parseTime(value) ?? Number.NaN) : [];
    rows.push({
      swimmer,
      lane,
      name: clean(swimmer.name, 40) ?? "",
      abbr: (clean(swimmer.abbr, 5) ?? "").toLocaleUpperCase("en"),
      flag: typeof swimmer.flag === "string" ? swimmer.flag : undefined,
      color: typeof swimmer.color === "string" ? swimmer.color : undefined,
      seed: typeof swimmer.seed === "number" ? (Number.isFinite(swimmer.seed) ? formatTime(swimmer.seed) : undefined) : clean(swimmer.seed, 12),
      time,
      timeText: time !== undefined ? formatTime(time) : timeText,
      place: Number.isInteger(swimmer.place) && (swimmer.place as number) > 0 ? swimmer.place : undefined,
      reaction: typeof swimmer.reaction === "number" && Number.isFinite(swimmer.reaction) && swimmer.reaction >= 0 ? swimmer.reaction : undefined,
      splits,
      status: STATUSES.includes(swimmer.status as SwimmerStatus) ? swimmer.status : undefined,
      record: clean(swimmer.record, 6)?.toLocaleUpperCase("en"),
    });
  }
  // The rows run down the page in the order of the lanes as the pool is drawn.
  rows.sort((a, b) => lanes.indexOf(a.lane) - lanes.indexOf(b.lane));
  const every = Number.isFinite(race.splitEvery) && (race.splitEvery as number) > 0 ? (race.splitEvery as number) : defaults.splitEvery;
  const most = Math.max(0, ...rows.map((r) => r.splits.length));
  const distance = Number.isFinite(race.distance) && (race.distance as number) > 0 ? (race.distance as number) : most > 0 ? most * every : defaults.length;
  // The last split is the time of a swimmer whose splits reach the end of the race.
  for (const r of rows) {
    if (r.time !== undefined || r.status !== undefined || r.splits.length === 0) continue;
    const last = r.splits[r.splits.length - 1];
    if (Number.isFinite(last) && r.splits.length * every >= distance - 1e-6) {
      r.time = last;
      r.timeText = formatTime(last);
    }
  }
  // Places from the times, when no one has been given one.
  if (rows.every((r) => r.place === undefined)) {
    const timed = rows.filter((r) => r.time !== undefined && r.status === undefined).sort((a, b) => (a.time as number) - (b.time as number));
    let place = 0;
    let last: number | undefined;
    timed.forEach((r, i) => {
      if (r.time !== last) place = i + 1;
      last = r.time;
      r.place = place;
    });
  }
  const hasResults = rows.some((r) => r.timeText !== undefined || r.status !== undefined || r.place !== undefined);
  // The entry times are for a start list: once there are results they are left out, unless the race asks for them.
  const show = { ...SHOW, seeds: !hasResults, ...Object.fromEntries(Object.entries(race.show ?? {}).filter(([, value]) => typeof value === "boolean")) } as Required<RaceShow>;
  const pace = race.pace === undefined || race.pace === false ? null : { labels: race.pace === true || (race.pace as PaceOptions).labels !== false };
  // The pace of each split: from the one before it (0 at the start) over the metres between them, the last split over what is left of the race.
  const paces: number[] = [];
  for (const r of rows) {
    r.splits.forEach((cum, i) => {
      const from = i === 0 ? 0 : r.splits[i - 1];
      if (Number.isFinite(cum) && Number.isFinite(from)) paces.push(pacePer100(from, cum, splitMetres(i, every, distance)));
    });
  }
  return {
    event: clean(race.event, 80),
    distance,
    splitEvery: every,
    rows,
    show,
    pace,
    fastest: paces.length === 0 ? undefined : Math.min(...paces),
    slowest: paces.length === 0 ? undefined : Math.max(...paces),
    hasResults,
    hasSplits: most > 0,
    hasReaction: rows.some((r) => r.reaction !== undefined),
  };
}

/** The metres of the split with this index (from 0): `every`, except the last, which is whatever is left of the race. */
export function splitMetres(index: number, every: number, distance: number): number {
  const start = index * every;
  return Math.max(1e-6, Math.min(every, distance - start));
}

/** The status written in place of a time. */
export const STATUS_TEXT: Readonly<Record<SwimmerStatus, string>> = Object.freeze({ dq: "DQ", dns: "DNS", dnf: "DNF" });
