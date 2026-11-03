// Every circuit, and the race on one, held for a district (`district.circuit.ts`): importing this fills the table a district reads a circuit from. The `district` entry imports it; the lean district reads it with `loadCircuits()`. A bundler keeps it for its
// effect: package.json lists it in `sideEffects`.
import { circuitDrawing } from "./circuits.draw.ts";
import { carRadius, carsMarkup } from "./circuits.race.draw.ts";
import { mountRaceIn } from "./circuits.race.dom.ts";
import { raceAt } from "./circuits.race.moment.ts";
import { simulateRace } from "./circuits.race.ts";
import { RACE_WORDS } from "./circuits.race.words.ts";
import { circuitOf, circuitPlan } from "./circuits.ts";
import { circuitUprights } from "./circuits.turn.ts";
import { CIRCUIT_WORDS } from "./circuits.words.ts";
import { holdCircuits } from "./district.circuit.ts";

holdCircuits({ circuitOf, circuitPlan, circuitDrawing, circuitUprights, words: CIRCUIT_WORDS, race: { simulateRace, raceAt, carsMarkup, carRadius, mountRaceIn, words: RACE_WORDS } });
