// A moment of a simulated race (`circuits.race.ts`): where each car is on the drawing, the order, the gaps to the leader and to the car in front, the last and best laps, the stops, and the lap the leader is on. Pure and
// cheap (a few searches by halving each), so that a page can ask for one every frame at any speed of play.
import type { Pt } from "./crowd.ts";
import { linePoint, ringLengths, ringPoint } from "./circuits.pace.ts";
import type { CircuitRace, RaceCar } from "./circuits.race.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";

/** What a car is doing. */
export type RaceStatus = "grid" | "running" | "pit" | "out" | "finished";

/** One line of the timing board. */
export interface RaceStanding {
  car: RaceCar;
  /** Its place in the race's `cars`. */
  index: number;
  /** 1 for the leader. */
  position: number;
  status: RaceStatus;
  /** Laps done. */
  laps: number;
  /** Seconds behind the leader (undefined for the leader, and for a car a lap or more down), and laps down. */
  gap?: number;
  lapsDown: number;
  /** The same to the car in front. */
  interval?: number;
  intervalLaps: number;
  /** The last lap's time and the car's best, in seconds. */
  last?: number;
  best?: number;
  /** Pit stops made. */
  stops: number;
  /** Where it is on the drawing, in its frame (feet), and its race distance in metres. */
  at: Pt;
  distance: number;
}

/** A moment of the race. */
export interface RaceMoment {
  /** Seconds since the start. */
  t: number;
  /** The lap the leader is on (1 to `laps`), and the laps of the race. */
  lap: number;
  laps: number;
  /** Whether the chequered flag has fallen, and whether the race is over (every car home). */
  flag: boolean;
  over: boolean;
  /** The standings, leader first. */
  standings: RaceStanding[];
  /** The fastest lap so far: the car's place in `cars`, the lap and its time. */
  fastest?: { index: number; lap: number; time: number };
}

/** How many metres clear of the car that holds the leader's mark the first car must be before the mark moves to it. */
export const LEADER_CLEAR = 1.5;

/**
 * The car that wears the leader's mark: the first car, except that two cars within a hair of each other do not hand it back and forth: the car that has it keeps it until the first is clear of it by `LEADER_CLEAR`
 * metres, or it has retired or finished behind. `held` is the car that wore it a moment ago (none after a seek, which takes the first at once).
 */
export function raceLeaderMark(moment: RaceMoment, held?: string): RaceStanding | undefined {
  const first = moment.standings[0];
  if (first === undefined || held === undefined || held === first.car.id) return first;
  const was = moment.standings.find((line) => line.car.id === held);
  if (was === undefined || was.status === "out" || was.status === "finished" || was.status === "grid") return first;
  return first.distance - was.distance > LEADER_CLEAR ? first : was;
}

/** The lengths of the lap and the pit lane on the drawing, worked out once for a race. */
const LENGTHS = new WeakMap<CircuitRace, { lap: Float64Array; pit: Float64Array }>();
const lengthsOf = (race: CircuitRace): { lap: Float64Array; pit: Float64Array } => {
  let kept = LENGTHS.get(race);
  if (kept === undefined) {
    kept = { lap: ringLengths(race.plan.lap), pit: ringLengths(race.plan.pitLane) };
    LENGTHS.set(race, kept);
  }
  return kept;
};

/** A sample's index and the share of the way to the next, at a time. */
const slot = (race: CircuitRace, t: number): [number, number] => {
  const last = race.distance[0].length - 1;
  const x = Math.min(Math.max(t / race.sample, 0), last);
  const j = Math.min(Math.floor(x), Math.max(0, last - 1));
  return [j, x - j];
};

/** A car's race distance at a time (metres from the timing line), and its distance along the pit lane, or NaN on the track. */
export function carAt(race: CircuitRace, index: number, t: number): { distance: number; pit: number } {
  const [j, f] = slot(race, t);
  const d = race.distance[index];
  const p = race.pit[index];
  const k = Math.min(j + 1, d.length - 1);
  const a = p[j];
  const b = p[k];
  const pit = Number.isNaN(a) && Number.isNaN(b) ? Number.NaN : Number.isNaN(a) ? (f >= 0.5 ? b : Number.NaN) : Number.isNaN(b) ? (f < 0.5 ? a : Number.NaN) : a + f * (b - a);
  return { distance: d[j] + f * (d[k] - d[j]), pit };
}

/** Where a car is on the drawing at a time, in the drawing's frame (feet): on the lap, or in the pit lane. */
export function racePoint(race: CircuitRace, index: number, t: number): Pt {
  const { distance, pit } = carAt(race, index, t);
  const lengths = lengthsOf(race);
  if (!Number.isNaN(pit)) return linePoint(race.plan.pitLane, lengths.pit, pit * FT);
  return ringPoint(race.plan.lap, lengths.lap, (race.lineAlong + distance) * FT);
}

/** How many of a sorted list are at or before `t`. */
const countTo = (list: readonly number[], t: number): number => {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

/** The time a car's race distance first reached `distance`, from its samples (they never go back), or undefined if it never did. */
function timeAt(race: CircuitRace, index: number, distance: number): number | undefined {
  const d = race.distance[index];
  if (d[d.length - 1] < distance) return undefined;
  if (d[0] >= distance) return 0;
  let lo = 0;
  let hi = d.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (d[mid] < distance) lo = mid;
    else hi = mid;
  }
  const span = d[hi] - d[lo];
  return (lo + (span > 0 ? (distance - d[lo]) / span : 0)) * race.sample;
}

/** The gap from one car to another ahead of it at a time: seconds, or whole laps when it is a lap or more behind. */
function gapTo(race: CircuitRace, ahead: { index: number; distance: number; finished?: number }, behind: { index: number; distance: number; finished?: number }, t: number): { seconds?: number; laps: number } {
  const L = race.lapLength;
  if (ahead.finished !== undefined && behind.finished !== undefined) {
    const laps = race.crossings[ahead.index].length - race.crossings[behind.index].length;
    return laps > 0 ? { laps } : { seconds: behind.finished - ahead.finished, laps: 0 };
  }
  const laps = Math.floor((ahead.distance - behind.distance) / L);
  if (laps >= 1) return { laps };
  const when = timeAt(race, ahead.index, behind.distance);
  return { seconds: when === undefined ? undefined : Math.max(0, (behind.finished ?? t) - when), laps: 0 };
}

/**
 * A moment of a race: each car's place on the drawing and its line of the timing board (position, laps, the gap to the leader and to the car in front, the last and best laps, the stops), the lap the leader is on and
 * the fastest lap so far.
 * @example
 * ```ts
 * import { raceAt, simulateRace } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const race = simulateRace({ circuit: "las-vegas", laps: 3, cars: 4 });
 * const now = raceAt(race, 150);
 * console.log(now.lap, now.standings.length, now.standings[0].position, now.flag);
 * // 2 4 1 false
 * ```
 */
export function raceAt(race: CircuitRace, time: number): RaceMoment {
  const t = Math.min(Math.max(Number.isFinite(time) ? time : 0, 0), race.duration);
  const lines = race.cars.map((car, index) => {
    const { distance, pit } = carAt(race, index, t);
    const laps = countTo(race.crossings[index], t);
    const finished = race.finish[index] !== undefined && (race.finish[index] as number) <= t ? (race.finish[index] as number) : undefined;
    const outAt = race.out[index];
    const status: RaceStatus = finished !== undefined ? "finished" : outAt !== undefined && outAt <= t ? "out" : !Number.isNaN(pit) ? "pit" : t <= 0 ? "grid" : "running";
    // A car that has finished ranks by the laps it did and when it did them; one that retired ranks after every car still in the race.
    const rank = status === "finished" ? laps * race.lapLength + 1e-3 * (race.duration - finished!) : status === "out" ? distance - 1e9 : distance;
    return { car, index, distance, laps, finished, status, rank, at: racePoint(race, index, t) };
  });
  lines.sort((a, b) => b.rank - a.rank || a.index - b.index);
  const leader = lines[0];
  let fastest: RaceMoment["fastest"];
  const standings = lines.map((line, i): RaceStanding => {
    const crossed = race.crossings[line.index];
    let best: number | undefined;
    for (let k = 0; k < line.laps; k += 1) {
      const lapTime = crossed[k] - (k === 0 ? 0 : crossed[k - 1]);
      // The first lap starts from the grid: it is not a flying lap.
      if (k === 0) continue;
      if (best === undefined || lapTime < best) best = lapTime;
      if (fastest === undefined || lapTime < fastest.time) fastest = { index: line.index, lap: k + 1, time: lapTime };
    }
    // On the grid, and for the leader and a car that retired, there is no gap to give.
    const none = i === 0 || line.status === "out" || line.status === "grid";
    const toLeader = none ? { laps: 0 } : gapTo(race, leader, line, t);
    const toNext = none ? { laps: 0 } : gapTo(race, lines[i - 1], line, t);
    return {
      car: line.car,
      index: line.index,
      position: i + 1,
      status: line.status,
      laps: line.laps,
      ...(toLeader.seconds === undefined ? {} : { gap: toLeader.seconds }),
      lapsDown: toLeader.laps,
      ...(toNext.seconds === undefined ? {} : { interval: toNext.seconds }),
      intervalLaps: toNext.laps,
      ...(line.laps === 0 ? {} : { last: crossed[line.laps - 1] - (line.laps === 1 ? 0 : crossed[line.laps - 2]) }),
      ...(best === undefined ? {} : { best }),
      stops: race.stops[line.index].filter((s) => s.in <= t).length,
      at: line.at,
      distance: line.distance,
    };
  });
  const lap = Math.min(race.laps, Math.max(1, (leader?.laps ?? 0) + 1));
  return { t, lap, laps: race.laps, flag: t >= race.flag, over: t >= race.duration, standings, ...(fastest === undefined ? {} : { fastest }) };
}

/** The times the leader of the race crosses the line to end each lap, and the last is the chequered flag: the first car to complete each lap. Worked out once for a race. */
const MARKS = new WeakMap<CircuitRace, readonly number[]>();
export function raceLapMarks(race: CircuitRace): readonly number[] {
  let marks = MARKS.get(race);
  if (marks === undefined) {
    const found: number[] = [];
    for (let k = 0; k < race.laps; k += 1) {
      let first = Number.POSITIVE_INFINITY;
      for (const crossed of race.crossings) if (crossed[k] !== undefined && crossed[k] < first) first = crossed[k];
      if (Number.isFinite(first)) found.push(first);
    }
    marks = found;
    MARKS.set(race, marks);
  }
  return marks;
}

/**
 * Where one step of a race's bar goes from a time: on (1) to the next time the leader ends a lap, or the end of the race when none is left; back (-1) to the start of the lap in progress, or to the one before when the clock is
 * within a second of it, or the start.
 */
export function raceLapStep(race: CircuitRace, t: number, direction: 1 | -1): number {
  const marks = raceLapMarks(race);
  if (direction > 0) return marks.find((at) => at > t + 1e-6) ?? race.duration;
  let before = 0;
  for (const at of marks) if (at < t - 1) before = at;
  return before;
}
