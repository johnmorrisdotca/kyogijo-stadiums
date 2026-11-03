// What a district needs of the circuits to lay one on its ground (`DistrictOptions.circuit`), held in a table that `circuits.held.ts` fills when it is imported, as the venues' records are (`full.ts`): the `district` entry imports it, so
// it has every circuit as it has every venue; the lean district (`district-lean`) carries none of the circuits' code or data until `loadCircuits()` has read them, so that a page of venues alone does not carry a race track. Types only
// are imported here.
import type { CircuitDrawing } from "./circuits.draw.ts";
import type { carRadius, carsMarkup } from "./circuits.race.draw.ts";
import type { mountRaceIn } from "./circuits.race.dom.ts";
import type { raceAt } from "./circuits.race.moment.ts";
import type { simulateRace } from "./circuits.race.ts";
import type { RaceWords } from "./circuits.race.words.ts";
import type { CircuitPlan } from "./circuits.ts";
import type { Circuit, CircuitOptions } from "./circuits.types.ts";
import type { CircuitWords } from "./circuits.words.ts";
import type { Language } from "./types.ts";
import type { Upright } from "./turn.kit.ts";

/** The circuits' code a district uses. */
export interface CircuitSupport {
  circuitOf: (id: string) => Circuit;
  circuitPlan: (circuit: Circuit) => CircuitPlan;
  circuitDrawing: (options: CircuitOptions) => CircuitDrawing;
  circuitUprights: (drawn: CircuitDrawing, thin: number) => Upright[];
  words: Readonly<Record<Language, CircuitWords>>;
  /** A race on the circuit (`mountDistrictRace`, `drawDistrictRace`): the simulation, its moments, its cars' markup and its view in a page. */
  race: {
    simulateRace: typeof simulateRace;
    raceAt: typeof raceAt;
    carsMarkup: typeof carsMarkup;
    carRadius: typeof carRadius;
    mountRaceIn: typeof mountRaceIn;
    words: Readonly<Record<Language, RaceWords>>;
  };
}

let held: CircuitSupport | undefined;

/** Fill the table: `circuits.held.ts` does it when it is imported. */
export function holdCircuits(support: CircuitSupport): void {
  held = support;
}

/** The circuits' code, or an error that says how to have it. */
export function circuitSupport(): CircuitSupport {
  if (held === undefined) throw new Error("a district with a circuit needs the circuits: the district entry has them, and the lean district reads them with `await loadCircuits()` first");
  return held;
}

/** Whether the circuits are held (the district entry, or the lean district after `loadCircuits()`). */
export const circuitsHeld = (): boolean => held !== undefined;
