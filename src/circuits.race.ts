// A simulated race on a circuit: about twenty made-up cars from the grid to the chequered flag over a full race distance, with gaps, overtakes, pit stops and now and then a car that retires, all from one seed. It is a
// model and says so: each car runs the lap's speeds (`circuits.pace.ts`) a little slower or faster by its car, its fuel, its tyres and the lap, is held up behind a slower car until a straight lets it by, and stops in
// the pit lane on the laps its strategy picks. The race is worked out once, a tenth of a second at a time, and kept as each car's distance at every second: `circuits.race.moment.ts` reads any moment of it. Pure: the
// same options always give the same race. No real driver, team, result or time is in it.
import { circuitOf, circuitPlan, type CircuitPlan } from "./circuits.ts";
import { lineLength, nearestOn } from "./circuits.geo.ts";
import { RACE_PACE, paceProfile, pullAt, speedAt, type PaceProfile } from "./circuits.pace.ts";
import { RACE_CARS_MAX, RACE_CARS_MIN, RACE_DRIVERS, RACE_TEAMS, type RaceDriver, type RaceTeam } from "./circuits.race.field.ts";
import type { Circuit } from "./circuits.types.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";

/** What a race is made from: the circuit, and a seed, laps and cars of your own. */
export interface RaceOptions {
  /** The circuit's key: `las-vegas`. */
  circuit: string;
  /** The seed every choice of the race is drawn from: a whole number, 1 by default. Another seed is another race. */
  seed?: number;
  /** How many laps: by default a full race distance, the fewest laps that make 305 km (`raceLaps`). 1 to 200. */
  laps?: number;
  /** How many cars: 2 to 20, 20 by default. */
  cars?: number;
}

/** A car of the race: its driver and team (made up) and where it started. */
export interface RaceCar {
  /** The driver's code in lower case: `hlv`. */
  id: string;
  driver: RaceDriver;
  team: RaceTeam;
  /** Its place on the grid, 1 for pole. */
  grid: number;
}

/** A pit stop: the lap it ends, the time the car left the track and joined it again, and how long it stood still. */
export interface RaceStop {
  lap: number;
  in: number;
  out: number;
  stop: number;
}

/** A race worked out: the cars, and each one's distance at every second, its laps, stops and finish. */
export interface CircuitRace {
  circuit: Circuit;
  plan: CircuitPlan;
  seed: number;
  laps: number;
  cars: readonly RaceCar[];
  /** The lap's length along the drawn line, in metres, and how far round it from the line's first point the timing line (the finish) is. */
  lapLength: number;
  lineAlong: number;
  /** The pit lane: where it leaves the lap and joins it again (metres round the lap from the line's first point), and its length in metres. */
  pitLane: { entry: number; exit: number; length: number };
  /** The lap's speeds the cars run. */
  pace: PaceProfile;
  /** Seconds between two samples, the time the chequered flag fell and the time the race ends (every car home and slowed). */
  sample: number;
  flag: number;
  duration: number;
  /** Each car's race distance at every sample, in metres: 0 at the timing line, a lap is done at each `lapLength`. A car on the grid behind the line starts below 0. */
  distance: readonly Float64Array[];
  /** Each car's distance along the pit lane at every sample, in metres, or NaN while it is on the track. */
  pit: readonly Float32Array[];
  /** The time each car completed each lap, from the start. */
  crossings: readonly (readonly number[])[];
  stops: readonly (readonly RaceStop[])[];
  /** The time a car took the chequered flag, or retired: `undefined` for neither. */
  finish: readonly (number | undefined)[];
  out: readonly (number | undefined)[];
}

/** The distance of a race: the fewest laps that make more than 305 km, as a Grand Prix's is set. */
export const RACE_DISTANCE = 305_000;

/** The laps of a full race distance on a circuit: 50 at Las Vegas. */
export const raceLaps = (circuit: Pick<Circuit, "length">): number => Math.ceil(RACE_DISTANCE / circuit.length.value);

/** A small generator of numbers in [0, 1) from a seed (mulberry32: whole-number arithmetic only, the same in every engine). */
function seeded(seed: number): () => number {
  let a = (Math.trunc(seed) ^ 0x5bd1e995) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What each car brings to the race, drawn from the seed before it starts. */
interface Plan {
  deficit: number;
  reaction: number;
  pits: number[];
  stopFor: number[];
  box: number;
  noise: number[];
  outLap: number;
  outAt: number;
}

/** The model's own figures: a car's pace in shares of a lap, and the gaps it keeps. */
const MODEL = Object.freeze({
  /** A team is this much slower than the one before it, and its cars differ by up to this much. */
  teamStep: 0.0025,
  mateSpread: 0.0016,
  /** A full tank costs this share of a lap, falling to nothing at the flag; a tyre this much more each lap it is used, and faster past `wear` laps. */
  fuel: 0.024,
  tyre: 0.00055,
  wear: 24,
  wornTyre: 0.0016,
  /** A lap's own spread, and the chance of a lap with a mistake in it. */
  lapNoise: 0.0042,
  slip: 0.012,
  slipCost: 0.016,
  /** The tow on a straight within a second of the car in front, and the dirty air in a bend behind it. */
  tow: 1.03,
  dirty: 0.994,
  /** The gap a car keeps behind one it cannot pass: metres, and metres for each metre a second. */
  gap: 10,
  gapPerSpeed: 0.42,
  /** A straight is where the lap's speed is above this share of the top: a car can pass there. */
  straight: 0.86,
  /** The chance a car retires. */
  retire: 0.05,
  /** Seconds in a step of the model. */
  dt: 0.2,
});

const mod = (a: number, n: number): number => ((a % n) + n) % n;

function plansOf(count: number, laps: number, random: () => number): Plan[] {
  return Array.from({ length: count }, (_, i): Plan => {
    const team = Math.floor(i / 2);
    const twoStops = random() < 0.65;
    const pits = twoStops ? [Math.round(laps * (0.26 + random() * 0.1)), Math.round(laps * (0.58 + random() * 0.1))] : [Math.round(laps * (0.42 + random() * 0.16))];
    const stopFor = pits.map(() => 2.2 + random() * 0.9 + (random() < 0.06 ? 2 + random() * 5 : 0));
    const noise = Array.from({ length: laps + 3 }, () => (random() - 0.5) * MODEL.lapNoise + (random() < MODEL.slip ? MODEL.slipCost : 0));
    const outLap = random() < MODEL.retire ? 2 + Math.floor(random() * Math.max(1, laps - 4)) : 0;
    return {
      deficit: team * MODEL.teamStep + random() * MODEL.mateSpread,
      reaction: 0.15 + random() * 0.25,
      pits: laps < 4 ? [] : pits.map((p) => Math.min(laps - 1, Math.max(1, p))),
      stopFor,
      box: 0.3 + team * 0.045,
      noise,
      outLap: laps < 6 ? 0 : outLap,
      outAt: random(),
    };
  });
}

const CACHE = new Map<string, CircuitRace>();

/**
 * A race on a circuit, worked out from a seed: made-up cars from the grid to the flag over a full race distance (50 laps of Las Vegas, about an hour and a half), with the gaps, overtakes, pit stops and retirements
 * the model gives. The same options always give the same race; the last few asked for are kept.
 * @example
 * ```ts
 * import { simulateRace } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const race = simulateRace({ circuit: "las-vegas", laps: 5, cars: 6, seed: 7 });
 * console.log(race.laps, race.cars.length, race.flag > 5 * 90 && race.flag < 5 * 110);
 * // 5 6 true
 * ```
 */
export function simulateRace(options: RaceOptions): CircuitRace {
  const circuit = circuitOf(options.circuit);
  const seed = Number.isFinite(options.seed) ? Math.trunc(options.seed as number) : 1;
  const laps = Number.isFinite(options.laps) ? Math.min(200, Math.max(1, Math.trunc(options.laps as number))) : raceLaps(circuit);
  const count = Number.isFinite(options.cars) ? Math.min(RACE_CARS_MAX, Math.max(RACE_CARS_MIN, Math.trunc(options.cars as number))) : RACE_CARS_MAX;
  const key = `${circuit.id}|${seed}|${laps}|${count}`;
  const kept = CACHE.get(key);
  if (kept !== undefined) return kept;
  const race = run(circuit, seed, laps, count);
  CACHE.set(key, race);
  if (CACHE.size > 4) CACHE.delete(CACHE.keys().next().value as string);
  return race;
}

function run(circuit: Circuit, seed: number, laps: number, count: number): CircuitRace {
  const plan = circuitPlan(circuit);
  const pace = paceProfile(plan);
  const L = pace.length;
  const lineAlong = plan.finish.along / FT;
  const startAlong = plan.start.along / FT;
  const entry = nearestOn(plan.lap, plan.pitLane[0], true).along / FT;
  const exit = nearestOn(plan.lap, plan.pitLane[plan.pitLane.length - 1], true).along / FT;
  const pitLength = lineLength(plan.pitLane, false) / FT;
  const bypass = mod(exit - entry, L);
  const hasPits = pitLength > 20 && bypass > 20;
  const random = seeded(seed);
  const plans = plansOf(count, laps, random);
  // The grid: the order a lap of qualifying gives, each slot eight metres behind the one before it, the first on the start line.
  const order = plans.map((p, i) => ({ i, q: p.deficit + random() * 0.003 })).sort((a, b) => a.q - b.q).map((x) => x.i);
  const gridOf = new Array<number>(count);
  order.forEach((car, place) => (gridOf[car] = place));
  // A lap is done at each multiple of the lap's length; the start line lies `ahead` metres past the timing line (a first lap a little short or long, as a grid makes it).
  let ahead = mod(startAlong - lineAlong, L);
  if (ahead > L / 2) ahead -= L;
  const cars: RaceCar[] = plans.map((_, i) => {
    const driver = RACE_DRIVERS[i];
    return { id: driver.code.toLowerCase(), driver, team: RACE_TEAMS.find((t) => t.id === driver.team) as RaceTeam, grid: gridOf[i] + 1 };
  });
  const dt = MODEL.dt;
  const sample = 1;
  const every = Math.round(sample / dt);
  const cap = laps * pace.lap * 1.7 + 600;
  const size = Math.ceil(cap / sample) + 2;
  const distance = cars.map(() => new Float64Array(size));
  const pit = cars.map(() => new Float32Array(size).fill(Number.NaN));
  const crossings: number[][] = cars.map(() => []);
  const stops: RaceStop[][] = cars.map(() => []);
  const finish: (number | undefined)[] = cars.map(() => undefined);
  const out: (number | undefined)[] = cars.map(() => undefined);
  const s = cars.map((_, i) => ahead - 8 * gridOf[i]);
  const v = cars.map(() => 0);
  type Mode = "track" | "pit" | "stopping" | "out" | "done";
  const mode: Mode[] = cars.map(() => "track");
  const p = cars.map(() => 0);
  const held = cars.map(() => 0);
  const entered = cars.map(() => 0);
  const pitIn = cars.map(() => 0);
  const stopped = cars.map(() => false);
  const age = cars.map(() => 0);
  let flag = Number.NaN;
  let quiet = Number.NaN;
  const record = (j: number): void => {
    for (let c = 0; c < count; c += 1) {
      distance[c][j] = s[c];
      pit[c][j] = mode[c] === "pit" ? p[c] : Number.NaN;
    }
  };
  record(0);
  let steps = 0;
  let t = 0;
  while (t < cap) {
    steps += 1;
    t = steps * dt;
    for (let c = 0; c < count; c += 1) {
      const plan = plans[c];
      const before = s[c];
      const along = lineAlong + s[c];
      if (mode[c] === "out") continue;
      if (mode[c] === "stopping") {
        v[c] = Math.max(0, v[c] - 9 * dt);
        s[c] += v[c] * dt;
        if (v[c] === 0) mode[c] = "out";
        continue;
      }
      if (mode[c] === "pit") {
        if (!stopped[c] && p[c] >= plan.box * pitLength) {
          if (held[c] === 0) held[c] = plan.stopFor[stops[c].length];
          held[c] = Math.max(0, held[c] - dt);
          v[c] = 0;
          if (held[c] === 0) stopped[c] = true;
          else continue;
        }
        v[c] = v[c] > RACE_PACE.pitLimit ? Math.max(RACE_PACE.pitLimit, v[c] - RACE_PACE.brake * dt) : Math.min(RACE_PACE.pitLimit, v[c] + pullAt(v[c]) * dt);
        p[c] += v[c] * dt;
        s[c] = entered[c] + (Math.min(p[c], pitLength) / pitLength) * bypass;
        if (p[c] >= pitLength) {
          mode[c] = "track";
          stops[c].push({ lap: Math.floor(entered[c] / L) + 1, in: pitIn[c], out: t, stop: plan.stopFor[stops[c].length] });
          age[c] = 0;
        }
      } else if (t >= plan.reaction) {
        const done = Math.max(0, Math.floor(s[c] / L));
        const cool = mode[c] === "done";
        let target = speedAt(pace, along);
        if (cool) target *= 0.55;
        else {
          const tyre = MODEL.tyre * age[c] + Math.max(0, age[c] - MODEL.wear) * MODEL.wornTyre;
          const fuel = MODEL.fuel * (1 - Math.min(done, laps) / laps);
          target /= 1 + plan.deficit + fuel + tyre + plan.noise[Math.min(done, plan.noise.length - 1)];
          // The car in front on the track: the tow and the dirty air behind it, and the gap kept when it cannot be passed here.
          let gap = Infinity;
          let other = -1;
          for (let o = 0; o < count; o += 1) {
            if (o === c || mode[o] === "pit" || mode[o] === "out" || mode[o] === "stopping") continue;
            const d = mod(s[o] - s[c], L);
            if (d > 0 && d < gap) [gap, other] = [d, o];
          }
          if (other >= 0) {
            const base = speedAt(pace, along);
            const seconds = gap / Math.max(v[c], 10);
            const straight = base > MODEL.straight * RACE_PACE.top;
            if (seconds < 1 && straight) target *= MODEL.tow;
            else if (seconds < 1.2 && base < 0.6 * RACE_PACE.top) target *= MODEL.dirty;
            // A car a lap or more behind lets the leaders by anywhere; one that is racing is passed on a straight, by a car that is quicker there.
            const lapping = s[c] - s[other] > L / 2;
            const keep = MODEL.gap + MODEL.gapPerSpeed * v[c];
            if (!lapping && mode[other] !== "done" && gap < keep && !(straight && target > v[other] * 1.02)) target = Math.min(target, v[other] + (gap - MODEL.gap) / 1.5);
          }
        }
        target = Math.max(target, 0);
        v[c] = target < v[c] ? Math.max(target, v[c] - RACE_PACE.brake * dt) : Math.min(target, v[c] + pullAt(v[c]) * dt);
        s[c] += v[c] * dt;
        // The pit lane: taken on a lap the strategy picks, where it leaves the lap.
        const nextStop = plans[c].pits[stops[c].length];
        const passedEntry = Math.floor((before - (entry - lineAlong)) / L) < Math.floor((s[c] - (entry - lineAlong)) / L);
        if (!cool && hasPits && passedEntry && nextStop !== undefined && Math.floor(s[c] / L) + 1 >= nextStop) {
          const at = before + mod(entry - lineAlong - before, L);
          mode[c] = "pit";
          entered[c] = at;
          p[c] = s[c] - at;
          stopped[c] = false;
          held[c] = 0;
          pitIn[c] = t;
        }
        // A retirement: on its lap, at its place round it, the car slows to a stop beside the track.
        if (!cool && plan.outLap > 0 && done + 1 === plan.outLap && mod(s[c], L) >= plan.outAt * L && out[c] === undefined && mode[c] === "track") {
          mode[c] = "stopping";
          out[c] = t;
        }
      }
      // The timing line: a lap done, the flag, and the finish.
      const k = Math.floor(s[c] / L);
      if (k >= 1 && k > Math.floor(before / L) && mode[c] !== "done") {
        const at = t - (dt * (s[c] - k * L)) / Math.max(s[c] - before, 1e-9);
        crossings[c].push(at);
        if (mode[c] === "track") age[c] += 1;
        if (Number.isNaN(flag) && k >= laps) flag = at;
        if (!Number.isNaN(flag) && at >= flag) {
          finish[c] = at;
          if (mode[c] === "track") mode[c] = "done";
        }
      }
    }
    if (steps % every === 0) record(steps / every);
    if (Number.isNaN(quiet) && mode.every((m, c) => m === "done" || m === "out" || (finish[c] !== undefined && m !== "pit"))) quiet = t;
    if (!Number.isNaN(quiet) && t >= quiet + 20) break;
  }
  const last = Math.floor(t / sample);
  return Object.freeze({
    circuit,
    plan,
    seed,
    laps,
    cars: Object.freeze(cars),
    lapLength: L,
    lineAlong,
    pitLane: { entry, exit, length: pitLength },
    pace,
    sample,
    flag: Number.isNaN(flag) ? last * sample : flag,
    duration: last * sample,
    distance: distance.map((d) => d.slice(0, last + 1)),
    pit: pit.map((d) => d.slice(0, last + 1)),
    crossings,
    stops,
    finish,
    out,
  });
}
