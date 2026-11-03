// A race on a district's ground (`drawDistrictRace`): the circuits' own race, its cars on the lap where the district lays the circuit, among the venues. The same race and moment as on the circuit's own drawing, only placed.
import { describe, expect, it } from "vitest";
import { simulateRace } from "./circuits.race.ts";
import { raceAt as momentAt } from "./circuits.race.moment.ts";
import { raceFromFeed, raceToFeed } from "./circuits.feed.ts";
import { circuitPointIn, drawDistrict, drawDistrictRace, planDistrict } from "./district-entry.ts";

const LV = { venues: ["t-mobile-arena"], circuit: "las-vegas", labels: true } as const;
const cars = (svg: string): { id: string; x: number; y: number }[] =>
  [...svg.matchAll(/<g class="ky-ci-car" data-car="([^"]+)"[^>]*transform="translate\(([-\d.]+) ([-\d.]+)\)"/g)].map((m) => ({ id: m[1], x: Number(m[2]), y: Number(m[3]) }));

describe("a race on a district's ground", () => {
  it("draws the district with a dot for each car, on the lap where the district lays the circuit", () => {
    const options = { ...LV, laps: 3, cars: 6, t: 200 };
    const svg = drawDistrictRace(options);
    const drawn = cars(svg);
    expect(drawn).toHaveLength(6);
    // The district is all there under the cars: its venue, and the circuit on its ground.
    expect(svg).toContain('data-venue="t-mobile-arena"');
    expect(svg).toContain('data-circuit="las-vegas"');
    expect(svg.startsWith(drawDistrict(options).replace(/<desc[^]*$/, ""))).toBe(true);
    // Each car is where the circuit's own race has it at that moment, put through the district's placing.
    const plan = planDistrict(options);
    const moment = momentAt(simulateRace(options), 200);
    for (const line of moment.standings) {
      const at = circuitPointIn(plan.circuit!, line.at);
      const car = drawn.find((c) => c.id === line.car.id)!;
      expect(Math.hypot(car.x - at[0], car.y - at[1])).toBeLessThan(0.5);
    }
  });

  it("says in its description that the race is made up, in either language, and is the same string every time", () => {
    const en = drawDistrictRace({ ...LV, laps: 2, cars: 4 });
    expect(en).toMatch(/<desc id="[^"]+">[^<]*made-up cars race 2 laps[^<]*<\/desc>/);
    expect(drawDistrictRace({ ...LV, laps: 2, cars: 4 })).toBe(en);
    const ja = drawDistrictRace({ ...LV, laps: 2, cars: 4, language: "ja" });
    expect(ja).toMatch(/<desc id="[^"]+">[^<]*架空のマシン4台[^<]*<\/desc>/);
    // On the grid, every car is on the ground of the circuit, none off the page.
    const plan = planDistrict(LV);
    for (const car of cars(en)) {
      expect(car.x).toBeGreaterThan(plan.view.x);
      expect(car.x).toBeLessThan(plan.view.x + plan.view.w);
      expect(car.y).toBeGreaterThan(plan.view.y);
      expect(car.y).toBeLessThan(plan.view.y + plan.view.h);
    }
  });

  it("plays a race given from a feed instead of the simulation, and says so", () => {
    const race = raceFromFeed(raceToFeed(simulateRace({ circuit: "las-vegas", laps: 2, cars: 3, seed: 7 })), "las-vegas");
    const svg = drawDistrictRace({ ...LV, t: 100 }, race);
    expect(cars(svg)).toHaveLength(3);
    expect(svg).toMatch(/from a feed the reader chose/);
  });

  it("asks for the district's circuit", () => {
    expect(() => drawDistrictRace({ venues: ["t-mobile-arena"] } as never)).toThrow();
  });
});
