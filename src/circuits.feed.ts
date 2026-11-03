// A race from a feed: kyogijo's open race timeline (`kyogijo-race`, version 1), read strictly, and turned into the same race a simulation gives (`CircuitRace`), so that every moment, drawing, board and page of a
// simulated race plays it unchanged. A feed says when each car completed each lap, and may say when it was in the pit lane, when it retired and where it was (location samples in the feed's own frame); the cars run
// between those moments at the lap's own speeds (`paceProfile`), and location samples are laid on the circuit's own line by how far round the lap they are, so the dots stay on the road. Pure: no request is made here.
import { nearestOn } from "./circuits.geo.ts";
import { circuitOf, circuitPlan } from "./circuits.ts";
import { lineLength } from "./circuits.geo.ts";
import { paceProfile } from "./circuits.pace.ts";
import type { RaceDriver, RaceTeam } from "./circuits.race.field.ts";
import type { CircuitRace, RaceCar, RaceStop } from "./circuits.race.ts";
import type { Pt } from "./crowd.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";

/** A car of a feed: an id the rest of the feed uses, and what the board shows of it. Everything but `id` is optional. */
export interface RaceFeedCar {
  id: string;
  /** A short code, as a timing board shows one: three letters. Missing, the id is used. */
  code?: string;
  name?: string;
  team?: string;
  /** The team's colour, `#rrggbb`. Missing, one of the package's is used. */
  colour?: string;
  /** Its place on the grid, 1 for pole. Missing, the order of `cars`. */
  grid?: number;
}

/** kyogijo's open race timeline: any feed, file or program can write it. Times are seconds from the start (the lights going out). */
export interface RaceFeed {
  kind: "kyogijo-race";
  version: 1;
  /** The circuit's key (`las-vegas`). A page may draw a feed on another circuit; the lap's shape is then the page's. */
  circuit?: string;
  /** The laps of the race, if the feed knows them; else the most any car has done. */
  laps?: number;
  /** A line about where the race comes from, shown with it. */
  title?: string;
  cars: RaceFeedCar[];
  /** When each car completed each lap: lap 1 is the first time it crossed the line after the start. */
  crossings: { car: string; lap: number; t: number }[];
  /** When a car left the track for the pit lane and joined it again, and how long it stood still. */
  pits?: { car: string; in: number; out: number; stop?: number }[];
  /** When a car retired. */
  out?: { car: string; t: number }[];
  /** Where a car was, in the feed's own frame (any unit, any way up): laid on the circuit's line by how far round the lap it is. */
  positions?: { car: string; t: number; x: number; y: number }[];
  /** True while the race is going on: the last lap seen is not the end. */
  live?: boolean;
}

/** What reading a feed gives: the feed, or why it is not one, in words. */
export type FeedResult = { ok: true; feed: RaceFeed } | { ok: false; error: string };

/** The most a feed may hold: cars, and rows of each list. */
export const FEED_LIMITS = Object.freeze({ cars: 40, rows: 200_000, laps: 200 });

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 80;
const COLOUR = /^#[0-9a-f]{6}$/i;
/** The colours a feed's car takes when it gives none, in turn (the made-up teams' own). */
const FALLBACK = ["#1d4ed8", "#0f766e", "#db2777", "#c026d3", "#65a30d", "#0ea5e9", "#b91c1c", "#94a3b8", "#ca8a04", "#7c3aed"];

/**
 * Read a feed strictly: anything that is not the open race timeline is refused with a sentence that says why, and anything a feed carries that the format does not name is left behind. Text is kept as text (never markup).
 * @example
 * ```ts
 * import { readRaceFeed } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const read = readRaceFeed({ kind: "kyogijo-race", version: 1, cars: [{ id: "a" }], crossings: [{ car: "a", lap: 1, t: 101 }] });
 * console.log(read.ok, readRaceFeed({ kind: "something" }).ok);
 * // true false
 * ```
 */
export function readRaceFeed(input: unknown): FeedResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { ok: false, error: "A race feed is a JSON object." };
  const o = input as Record<string, unknown>;
  if (o.kind !== "kyogijo-race") return { ok: false, error: 'This is not a race feed: its "kind" is not "kyogijo-race".' };
  if (o.version !== 1) return { ok: false, error: "This race feed is of a version this package does not read (it reads version 1)." };
  if (!Array.isArray(o.cars) || o.cars.length === 0) return { ok: false, error: "The race feed has no cars." };
  if (o.cars.length > FEED_LIMITS.cars) return { ok: false, error: `The race feed has more than ${FEED_LIMITS.cars} cars.` };
  const cars: RaceFeedCar[] = [];
  const ids = new Set<string>();
  for (const raw of o.cars as unknown[]) {
    const c = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    const id = typeof c.id === "number" ? String(c.id) : c.id;
    if (!isText(id) || ids.has(id)) return { ok: false, error: "Each car of the race feed needs an id of its own." };
    ids.add(id);
    cars.push({
      id,
      ...(isText(c.code) ? { code: c.code.slice(0, 4) } : {}),
      ...(isText(c.name) ? { name: c.name } : {}),
      ...(isText(c.team) ? { team: c.team } : {}),
      ...(typeof c.colour === "string" && COLOUR.test(c.colour) ? { colour: c.colour } : {}),
      ...(isNum(c.grid) && c.grid >= 1 ? { grid: Math.round(c.grid) } : {}),
    });
  }
  const rows = <T>(name: string, keep: (r: Record<string, unknown>) => T | undefined): T[] | string => {
    const list = o[name];
    if (list === undefined) return [];
    if (!Array.isArray(list)) return `The race feed's "${name}" is not a list.`;
    if (list.length > FEED_LIMITS.rows) return `The race feed's "${name}" has more than ${FEED_LIMITS.rows} rows.`;
    const out: T[] = [];
    for (const r of list) {
      if (typeof r !== "object" || r === null) continue;
      const row = r as Record<string, unknown>;
      const car = typeof row.car === "number" ? String(row.car) : row.car;
      if (typeof car !== "string" || !ids.has(car)) continue;
      const kept = keep({ ...row, car });
      if (kept !== undefined) out.push(kept);
    }
    return out;
  };
  const crossings = rows("crossings", (r) => (isNum(r.lap) && r.lap >= 1 && r.lap <= FEED_LIMITS.laps && isNum(r.t) && r.t > 0 ? { car: r.car as string, lap: Math.round(r.lap), t: r.t } : undefined));
  const pits = rows("pits", (r) => (isNum(r.in) && isNum(r.out) && r.out > r.in ? { car: r.car as string, in: r.in, out: r.out, ...(isNum(r.stop) && r.stop >= 0 ? { stop: r.stop } : {}) } : undefined));
  const out = rows("out", (r) => (isNum(r.t) && r.t >= 0 ? { car: r.car as string, t: r.t } : undefined));
  const positions = rows("positions", (r) => (isNum(r.t) && isNum(r.x) && isNum(r.y) ? { car: r.car as string, t: r.t, x: r.x, y: r.y } : undefined));
  for (const list of [crossings, pits, out, positions]) if (typeof list === "string") return { ok: false, error: list };
  if ((crossings as unknown[]).length === 0) return { ok: false, error: "The race feed has no lap times: it needs at least one car's completed lap." };
  return {
    ok: true,
    feed: {
      kind: "kyogijo-race",
      version: 1,
      ...(isText(o.circuit) ? { circuit: o.circuit } : {}),
      ...(isNum(o.laps) && o.laps >= 1 && o.laps <= FEED_LIMITS.laps ? { laps: Math.round(o.laps) } : {}),
      ...(typeof o.title === "string" && o.title.length <= 200 ? { title: o.title } : {}),
      cars,
      crossings: crossings as RaceFeed["crossings"],
      ...((pits as unknown[]).length > 0 ? { pits: pits as NonNullable<RaceFeed["pits"]> } : {}),
      ...((out as unknown[]).length > 0 ? { out: out as NonNullable<RaceFeed["out"]> } : {}),
      ...((positions as unknown[]).length > 0 ? { positions: positions as NonNullable<RaceFeed["positions"]> } : {}),
      ...(o.live === true ? { live: true } : {}),
    },
  };
}

/** The colour of what is written on a colour: dark on a light one, white on a dark one. */
const inkOn = (hex: string): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#10151b" : "#ffffff";
};
const mod = (a: number, n: number): number => ((a % n) + n) % n;

/** Where the location samples of a car lie round the lap, as shares of it from the timing line: the feed's own line is the path of the car with the most samples over its second lap. */
function lapShares(feed: RaceFeed, crossed: Map<string, number[]>): Map<string, { t: number; share: number }[]> {
  const out = new Map<string, { t: number; share: number }[]>();
  const positions = feed.positions ?? [];
  if (positions.length === 0) return out;
  const byCar = new Map<string, { t: number; at: Pt }[]>();
  for (const p of positions) {
    let list = byCar.get(p.car);
    if (list === undefined) byCar.set(p.car, (list = []));
    list.push({ t: p.t, at: [p.x, p.y] });
  }
  for (const list of byCar.values()) list.sort((a, b) => a.t - b.t);
  // The reference: a lap of one car, from one crossing to the next.
  let ref: Pt[] = [];
  let refStart: Pt | undefined;
  for (const [car, list] of byCar) {
    const cr = crossed.get(car) ?? [];
    for (let k = 1; k < cr.length; k += 1) {
      const lap = list.filter((s) => s.t >= cr[k - 1] && s.t <= cr[k]);
      if (lap.length > ref.length) {
        ref = lap.map((s) => s.at);
        refStart = lap[0].at;
      }
    }
  }
  if (ref.length < 20 || refStart === undefined) return out;
  const total = lineLength(ref, true);
  const zero = nearestOn(ref, refStart, true).along;
  for (const [car, list] of byCar) out.set(car, list.map((s) => ({ t: s.t, share: mod(nearestOn(ref, s.at, true).along - zero, total) / total })));
  return out;
}

/**
 * A feed as a race (`CircuitRace`): the same shape a simulation gives, so that `raceAt`, `drawRace`, `raceBoard` and `mountCircuitRace` play it. The circuit is the feed's, or the one named here (a page draws a feed on the
 * circuit it shows). Between the moments a feed gives, the cars run at the lap's own speeds.
 * @example
 * ```ts
 * import { raceAt, raceFromFeed } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const race = raceFromFeed({ kind: "kyogijo-race", version: 1, cars: [{ id: "a", code: "AAA" }, { id: "b", code: "BBB" }], crossings: [{ car: "a", lap: 1, t: 101 }, { car: "b", lap: 1, t: 102.5 }, { car: "a", lap: 2, t: 198 }, { car: "b", lap: 2, t: 200 }] }, "las-vegas");
 * const end = raceAt(race, race.duration);
 * console.log(race.laps, end.standings[0].car.driver.code, end.standings[1].gap);
 * // 2 AAA 2
 * ```
 */
export function raceFromFeed(feed: RaceFeed, circuitId?: string): CircuitRace {
  const circuit = circuitOf(circuitId ?? feed.circuit ?? "las-vegas");
  const plan = circuitPlan(circuit);
  const pace = paceProfile(plan);
  const L = pace.length;
  const lineAlong = plan.finish.along / FT;
  const entry = nearestOn(plan.lap, plan.pitLane[0], true).along / FT;
  const exit = nearestOn(plan.lap, plan.pitLane[plan.pitLane.length - 1], true).along / FT;
  const pitLength = lineLength(plan.pitLane, false) / FT;
  const bypass = mod(exit - entry, L);
  let ahead = mod(plan.start.along / FT - lineAlong, L);
  if (ahead > L / 2) ahead -= L;
  const order = [...feed.cars].map((c, i) => ({ c, i })).sort((a, b) => (a.c.grid ?? a.i + 1) - (b.c.grid ?? b.i + 1));
  const cars: RaceCar[] = order.map(({ c, i }, place) => {
    const colour = c.colour ?? FALLBACK[i % FALLBACK.length];
    const team: RaceTeam = { id: `feed-${c.team ?? c.id}`, name: { en: c.team ?? "", ja: c.team ?? "" }, colour, ink: inkOn(colour) };
    const driver: RaceDriver = { code: c.code ?? c.id.slice(0, 4).toUpperCase(), name: { en: c.name ?? c.code ?? c.id, ja: c.name ?? c.code ?? c.id }, team: team.id };
    return { id: c.id, driver, team, grid: place + 1 };
  });
  const crossed = new Map<string, number[]>(cars.map((c) => [c.id, []]));
  for (const row of [...feed.crossings].sort((a, b) => a.lap - b.lap || a.t - b.t)) {
    const list = crossed.get(row.car)!;
    // Lap n is the n-th crossing: a lap the feed skipped is left as the feed has it, and a crossing that goes back in time is dropped.
    if (list.length < row.lap && (list.length === 0 || row.t > list[list.length - 1])) list.push(row.t);
  }
  const maxLaps = Math.max(...[...crossed.values()].map((l) => l.length));
  const laps = feed.live === true ? Math.max(feed.laps ?? 0, maxLaps) : Math.min(feed.laps ?? maxLaps, Math.max(maxLaps, 1));
  const outAt = new Map((feed.out ?? []).map((o) => [o.car, o.t]));
  const lastSeen = Math.max(...feed.crossings.map((c) => c.t), ...(feed.out ?? []).map((o) => o.t), ...(feed.pits ?? []).map((p) => p.out));
  // The flag: the first car to complete the race's laps, when the feed says the race has its end.
  const leaderAt = [...crossed.values()].map((l) => l[laps - 1]).filter((t): t is number => t !== undefined);
  const flag = feed.live === true || leaderAt.length === 0 ? Number.NaN : Math.min(...leaderAt);
  const duration = Math.ceil(lastSeen + (Number.isNaN(flag) ? 0 : 20));
  const size = duration + 1;
  const shares = lapShares(feed, crossed);
  // The lap's own time to each place round it, from the timing line: the shape of the run between two moments.
  const timeTo = (s: number): number => {
    const whole = Math.floor(s / L);
    const along = mod(lineAlong + s, L);
    const at = (x: number): number => {
      const i = Math.min(Math.floor(x / pace.step), pace.speed.length - 1);
      const f = x / pace.step - i;
      return pace.time[i] + f * (pace.time[i + 1] - pace.time[i]);
    };
    const fromLine = mod(at(along) - at(mod(lineAlong, L)), pace.lap);
    return whole * pace.lap + fromLine;
  };
  /** The race distance between `a` (at `ta`) and `b` (at `tb`) at a time, at the lap's speeds. */
  const between = (a: number, b: number, ta: number, tb: number, t: number): number => {
    if (tb <= ta || b <= a) return a;
    const target = timeTo(a) + ((t - ta) / (tb - ta)) * (timeTo(b) - timeTo(a));
    let lo = a;
    let hi = b;
    for (let i = 0; i < 30; i += 1) {
      const mid = (lo + hi) / 2;
      if (timeTo(mid) < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const distance = cars.map(() => new Float64Array(size));
  const pit = cars.map(() => new Float32Array(size).fill(Number.NaN));
  const stops: RaceStop[][] = cars.map(() => []);
  const finish: (number | undefined)[] = cars.map(() => undefined);
  const out: (number | undefined)[] = cars.map(() => undefined);
  cars.forEach((car, c) => {
    const cr = crossed.get(car.id)!;
    const start = ahead - 8 * (car.grid - 1);
    // The moments of this car: the start, every crossing, every location sample, and the ends of the pit lane.
    const points: { t: number; s: number; pitTo?: number }[] = [{ t: 0, s: start }, ...cr.map((t, k) => ({ t, s: (k + 1) * L }))];
    const lapsAt = (t: number): number => cr.filter((x) => x <= t).length;
    for (const sample of shares.get(car.id) ?? []) {
      const k = lapsAt(sample.t);
      let s = k * L + sample.share * L;
      // A sample just after a crossing whose share is still near the end of the lap belongs to the lap before.
      if (sample.share > 0.9 && k > 0 && sample.t - cr[k - 1] < 10) s -= L;
      if (s > start) points.push({ t: sample.t, s });
    }
    const pits = (feed.pits ?? []).filter((p) => p.car === car.id).sort((a, b) => a.in - b.in);
    for (const p of pits) {
      const k = lapsAt(p.in);
      const sIn = k * L + mod(entry - lineAlong, L);
      points.push({ t: p.in, s: sIn, pitTo: p.out }, { t: p.out, s: sIn + bypass });
      stops[c].push({ lap: k + 1, in: p.in, out: p.out, stop: p.stop ?? 0 });
    }
    // A car still running when the feed ends goes on round at its last lap's pace, so that a race that is going on does not hold its dots on the line.
    const retired0 = outAt.get(car.id);
    const done = !Number.isNaN(flag) && cr.some((t) => t >= flag);
    if (retired0 === undefined && !done && cr.length > 0) {
      const lastLap = cr.length > 1 ? cr[cr.length - 1] - cr[cr.length - 2] : pace.lap;
      points.push({ t: cr[cr.length - 1] + lastLap, s: (cr.length + 1) * L });
    }
    points.sort((a, b) => a.t - b.t);
    // Distance never goes back.
    for (let i = 1; i < points.length; i += 1) if (points[i].s < points[i - 1].s) points[i].s = points[i - 1].s;
    const retired = outAt.get(car.id);
    if (retired !== undefined) out[c] = retired;
    if (!Number.isNaN(flag)) finish[c] = cr.find((t) => t >= flag);
    let j = 0;
    for (let second = 0; second < size; second += 1) {
      const t = second;
      while (j + 1 < points.length && points[j + 1].t <= t) j += 1;
      const a = points[j];
      const b = points[j + 1];
      const pitWindow = a.pitTo !== undefined && t < a.pitTo;
      if (pitWindow) {
        const f = (t - a.t) / (a.pitTo! - a.t);
        pit[c][second] = f * pitLength;
        distance[c][second] = a.s + f * bypass;
      } else if (b === undefined || (retired !== undefined && t >= retired)) {
        distance[c][second] = second === 0 ? a.s : distance[c][second - 1];
      } else distance[c][second] = between(a.s, b.s, a.t, b.t, t);
    }
  });
  return Object.freeze({
    circuit,
    plan,
    seed: 0,
    laps,
    cars: Object.freeze(cars),
    lapLength: L,
    lineAlong,
    pitLane: { entry, exit, length: pitLength },
    pace,
    sample: 1,
    flag: Number.isNaN(flag) ? duration + 1 : flag,
    duration,
    distance,
    pit,
    crossings: cars.map((car) => crossed.get(car.id)!),
    stops,
    finish,
    out,
  });
}

/**
 * A race as the open race timeline: what a simulated race is, written as a feed (the demo's sample feed is one). Lap times are rounded to thousandths.
 * @example
 * ```ts
 * import { raceToFeed, simulateRace } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const feed = raceToFeed(simulateRace({ circuit: "las-vegas", laps: 3, cars: 4 }));
 * console.log(feed.kind, feed.cars.length, feed.crossings.length);
 * // kyogijo-race 4 12
 * ```
 */
export function raceToFeed(race: CircuitRace, title?: string): RaceFeed {
  const r3 = (n: number): number => Math.round(n * 1000) / 1000;
  const feed: RaceFeed = {
    kind: "kyogijo-race",
    version: 1,
    circuit: race.circuit.id,
    laps: race.laps,
    ...(title === undefined ? {} : { title }),
    cars: race.cars.map((c) => ({ id: c.id, code: c.driver.code, name: c.driver.name.en, team: c.team.name.en, colour: c.team.colour, grid: c.grid })),
    crossings: race.cars.flatMap((c, i) => race.crossings[i].map((t, k) => ({ car: c.id, lap: k + 1, t: r3(t) }))),
  };
  const pits = race.cars.flatMap((c, i) => race.stops[i].map((s) => ({ car: c.id, in: r3(s.in), out: r3(s.out), stop: r3(s.stop) })));
  const out = race.cars.flatMap((c, i) => (race.out[i] === undefined ? [] : [{ car: c.id, t: r3(race.out[i] as number) }]));
  return { ...feed, ...(pits.length > 0 ? { pits } : {}), ...(out.length > 0 ? { out } : {}) };
}
