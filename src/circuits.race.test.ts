// The simulated race: the lap's speeds, a full race on every circuit (the same race from the same seed, made-up cars only, believable gaps, stops and overtakes, every dot on the road), its moments, its drawing, its
// board and its words in both languages.
import { describe, expect, it } from "vitest";
import {
  CIRCUIT_IDS,
  RACE_DRIVERS,
  RACE_TEAMS,
  RACE_WORDS,
  circuitById,
  circuitPlan,
  cornerSpeed,
  drawRace,
  gapText,
  lapTime,
  paceProfile,
  raceAt,
  raceBoard,
  raceClock,
  raceLaps,
  racePoint,
  raceStage,
  simulateRace,
} from "./circuits-entry.ts";
import { nearestOn } from "./circuits.geo.ts";

const LV = circuitById("las-vegas")!;

describe("the lap's speeds", () => {
  const pace = paceProfile(circuitPlan(LV));

  it("laps Las Vegas in about a minute and a half, flat out on the Strip and slow in its tightest turns", () => {
    expect(pace.lap).toBeGreaterThan(92);
    expect(pace.lap).toBeLessThan(100);
    const kmh = Array.from(pace.speed, (v) => v * 3.6);
    expect(Math.max(...kmh)).toBeGreaterThan(320);
    expect(Math.min(...kmh)).toBeGreaterThan(65);
    expect(Math.min(...kmh)).toBeLessThan(110);
    expect(pace.time.length).toBe(pace.speed.length + 1);
  });

  it("gives a tighter bend a lower speed, and a straight the top speed", () => {
    expect(cornerSpeed(20)).toBeLessThan(cornerSpeed(60));
    expect(cornerSpeed(60)).toBeLessThan(cornerSpeed(150));
    expect(cornerSpeed(Infinity)).toBe(94);
  });

  it("is the same every time", () => {
    expect(paceProfile(circuitPlan(LV)).lap).toBe(pace.lap);
  });
});

/** Real drivers' surnames, codes and teams of the series the model is like, that no made-up car may carry. */
const REAL = ["Verstappen", "Perez", "Hamilton", "Russell", "Leclerc", "Sainz", "Norris", "Piastri", "Alonso", "Stroll", "Gasly", "Ocon", "Albon", "Sargeant", "Colapinto", "Tsunoda", "Ricciardo", "Lawson", "Hulkenberg", "Magnussen", "Bearman", "Bottas", "Zhou", "Antonelli", "Bortoleto", "Hadjar", "Doohan", "Vettel", "Raikkonen", "Schumacher", "Senna", "Prost", "Button", "Massa", "Kubica", "Grosjean", "Kvyat", "Latifi", "Mazepin", "Giovinazzi", "Ericsson", "Sato", "Kobayashi", "Nakajima"];
const REAL_CODES = ["VER", "PER", "HAM", "RUS", "LEC", "SAI", "NOR", "PIA", "ALO", "STR", "GAS", "OCO", "ALB", "SAR", "COL", "TSU", "RIC", "LAW", "HUL", "MAG", "BEA", "BOT", "ZHO", "ANT", "BOR", "HAD", "DOO", "VET", "RAI", "MSC", "KVY", "LAT", "MAZ", "GIO", "ERI", "SAT", "KOB"];
const REAL_TEAMS = ["Red Bull", "Ferrari", "Mercedes", "McLaren", "Aston Martin", "Alpine", "Williams", "Haas", "Sauber", "Racing Bulls", "AlphaTauri", "Audi", "Cadillac", "Renault", "Lotus", "Toro Rosso"];

describe("the made-up field", () => {
  it("names no real driver, code or team", () => {
    for (const d of RACE_DRIVERS) {
      expect(REAL.some((r) => d.name.en.includes(r)), d.name.en).toBe(false);
      expect(REAL_CODES).not.toContain(d.code);
      expect(d.code).toMatch(/^[A-Z]{3}$/);
    }
    for (const t of RACE_TEAMS) expect(REAL_TEAMS.some((r) => t.name.en.includes(r)), t.name.en).toBe(false);
    expect(new Set(RACE_DRIVERS.map((d) => d.code)).size).toBe(RACE_DRIVERS.length);
    for (const t of RACE_TEAMS) expect(RACE_DRIVERS.filter((d) => d.team === t.id)).toHaveLength(2);
  });
});

describe("a full race on Las Vegas", () => {
  const race = simulateRace({ circuit: "las-vegas" });

  it("runs a full race distance, 50 laps, in about an hour and a half", () => {
    expect(raceLaps(LV)).toBe(50);
    expect(race.laps).toBe(50);
    expect(race.cars).toHaveLength(20);
    expect(race.flag / 60).toBeGreaterThan(75);
    expect(race.flag / 60).toBeLessThan(95);
    expect(race.duration).toBeGreaterThan(race.flag);
  });

  it("is the same race from the same seed, and another from another", () => {
    expect(simulateRace({ circuit: "las-vegas", seed: 1, laps: 8 }).crossings).toEqual(simulateRace({ circuit: "las-vegas", seed: 1, laps: 8 }).crossings);
    expect(simulateRace({ circuit: "las-vegas", seed: 2, laps: 8 }).crossings).not.toEqual(simulateRace({ circuit: "las-vegas", seed: 1, laps: 8 }).crossings);
  });

  it("keeps each car's distance going forward, and finishes every car still running on the lead lap or a lap or two down", () => {
    race.distance.forEach((d, c) => {
      for (let j = 1; j < d.length; j += 1) expect(d[j], `${race.cars[c].id} at ${j}`).toBeGreaterThanOrEqual(d[j - 1] - 1e-6);
      if (race.out[c] === undefined) {
        expect(race.finish[c]).toBeDefined();
        expect(race.crossings[c].length).toBeGreaterThanOrEqual(race.laps - 2);
      }
    });
    const winner = race.finish.indexOf(Math.min(...race.finish.filter((f): f is number => f !== undefined)));
    expect(race.crossings[winner]).toHaveLength(race.laps);
    expect(race.finish[winner]).toBe(race.flag);
  });

  it("laps in believable times: a standing first lap, then within a few seconds of the model's flying lap, the stops apart", () => {
    race.crossings.forEach((cross, c) => {
      const stopLaps = new Set(race.stops[c].flatMap((s) => [s.lap, s.lap + 1]));
      cross.forEach((at, k) => {
        if (k === 0) return expect(at).toBeGreaterThan(race.pace.lap);
        const lap = at - cross[k - 1];
        if (stopLaps.has(k + 1)) return;
        expect(lap, `${race.cars[c].id} lap ${k + 1}`).toBeGreaterThan(race.pace.lap * 0.97);
        expect(lap, `${race.cars[c].id} lap ${k + 1}`).toBeLessThan(race.pace.lap * 1.15);
      });
    });
  });

  it("stops each car once or twice in the pit lane, each stop a couple of seconds standing and about twenty lost", () => {
    race.stops.forEach((stops, c) => {
      if (race.out[c] !== undefined) return;
      expect(stops.length).toBeGreaterThanOrEqual(1);
      expect(stops.length).toBeLessThanOrEqual(2);
      for (const s of stops) {
        expect(s.stop).toBeGreaterThan(2);
        expect(s.out - s.in).toBeGreaterThan(15);
        expect(s.out - s.in).toBeLessThan(40);
      }
    });
  });

  it("spreads the field believably and has cars pass each other on the track", () => {
    const mid = raceAt(race, race.flag / 2).standings.filter((s) => s.status === "running");
    const tenth = mid[9];
    expect(tenth.gap ?? 0).toBeGreaterThan(10);
    const finish = raceAt(race, race.duration).standings;
    expect(finish[1].gap).toBeGreaterThan(0);
    expect(finish[1].gap).toBeLessThan(90);
    expect(finish.some((s) => s.lapsDown >= 1)).toBe(true);
    // Passes on the track: a car running ahead of another a second later that was behind it, neither in the pit lane.
    let passes = 0;
    let before: string[] = [];
    for (let t = 20; t < race.flag; t += 2) {
      const order = raceAt(race, t).standings.filter((s) => s.status === "running").map((s) => s.car.id);
      for (let i = 0; i + 1 < order.length; i += 1) if (before.indexOf(order[i]) > before.indexOf(order[i + 1]) && before.includes(order[i + 1])) passes += 1;
      before = order;
    }
    expect(passes).toBeGreaterThan(20);
  });

  it("starts on the grid in the order of a lap of qualifying, and gives the moments of the race", () => {
    const grid = raceAt(race, 0);
    expect(grid.standings.map((s) => s.car.grid)).toEqual(race.cars.map((_, i) => i + 1));
    expect(grid.standings.every((s) => s.status === "grid" && s.gap === undefined)).toBe(true);
    const later = raceAt(race, 1200);
    expect(later.lap).toBeGreaterThan(10);
    expect(later.flag).toBe(false);
    const p = later.standings.map((s) => s.position);
    expect(p).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(raceAt(race, race.flag).flag).toBe(true);
    expect(raceAt(race, race.duration).over).toBe(true);
    expect(raceAt(race, 3000).fastest?.time).toBeGreaterThan(race.pace.lap * 0.98);
  });
});

describe("on every circuit", () => {
  for (const id of CIRCUIT_IDS) {
    it(`${id}: a short race keeps every dot on the road or in the pit lane`, () => {
      const race = simulateRace({ circuit: id, laps: 4, cars: 8, seed: 3 });
      const plan = race.plan;
      for (let t = 0; t <= race.duration; t += 7) {
        for (let c = 0; c < race.cars.length; c += 1) {
          const at = racePoint(race, c, t);
          const onLap = nearestOn(plan.lap, at, true).d;
          const onPit = nearestOn(plan.pitLane, at, false).d;
          expect(Math.min(onLap, onPit), `${race.cars[c].id} at ${t}`).toBeLessThan(1);
        }
      }
      expect(race.crossings.every((cr, c) => race.out[c] !== undefined || cr.length >= 3)).toBe(true);
    });
  }
});

describe("the drawing, the clock and the board", () => {
  const race = simulateRace({ circuit: "las-vegas", laps: 6, cars: 10, seed: 5 });

  it("draws a dot for each car with its position, and says it is a simulation", () => {
    const svg = drawRace({ circuit: "las-vegas", laps: 6, cars: 10, seed: 5, t: 300 });
    expect(svg.match(/class="ky-ci-car"/g)).toHaveLength(10);
    expect(svg).toContain("simulation");
    expect(svg).toContain('data-turn="17"');
    expect(drawRace({ circuit: "las-vegas", laps: 6, cars: 10, seed: 5, t: 300 })).toBe(svg);
    expect(drawRace({ circuit: "las-vegas", laps: 6, cars: 10, seed: 5, t: 300, language: "ja" })).toContain("シミュレーション");
  });

  it("writes the clock, the lap and the gaps", () => {
    expect(raceClock(83)).toBe("1:23");
    expect(raceClock(5025)).toBe("1:23:45");
    expect(lapTime(96.512)).toBe("1:36.512");
    expect(gapText(1.2345, 0, "en")).toBe("+1.234");
    expect(gapText(75, 0, "en")).toBe("+1:15.000");
    expect(gapText(undefined, 1, "en")).toBe("+1 lap");
    expect(gapText(undefined, 2, "ja")).toBe("+2周");
    expect(raceStage(raceAt(race, 0), "en")).toBe("On the grid");
    expect(raceStage(raceAt(race, 250), "en")).toBe("Lap 3 / 6");
    expect(raceStage(raceAt(race, race.duration), "ja")).toBe("チェッカーフラッグ");
  });

  it("gives the board as a table, a line for each car in order", () => {
    const table = raceBoard(raceAt(race, 400));
    expect(table.match(/<tr data-car/g)).toHaveLength(10);
    expect(table).toContain("Leader");
    expect(raceBoard(raceAt(race, 400), "ja")).toContain("タイミングボード");
  });

  it("has every word in both languages", () => {
    const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v).map((x) => `${k}.${x}`) : [k]));
    expect(keys(RACE_WORDS.ja)).toEqual(keys(RACE_WORDS.en));
    for (const d of RACE_DRIVERS) expect(d.name.ja.length).toBeGreaterThan(0);
  });
});
