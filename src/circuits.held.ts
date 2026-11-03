// Every circuit, held for a district (`district.circuit.ts`): importing this fills the table a district reads a circuit from. The `district` entry imports it; the lean district reads it with `loadCircuits()`. A bundler keeps it for its
// effect: package.json lists it in `sideEffects`.
import { circuitDrawing } from "./circuits.draw.ts";
import { circuitOf, circuitPlan } from "./circuits.ts";
import { circuitUprights } from "./circuits.turn.ts";
import { CIRCUIT_WORDS } from "./circuits.words.ts";
import { holdCircuits } from "./district.circuit.ts";

holdCircuits({ circuitOf, circuitPlan, circuitDrawing, circuitUprights, words: CIRCUIT_WORDS });
