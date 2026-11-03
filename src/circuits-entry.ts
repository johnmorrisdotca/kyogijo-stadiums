// The circuits entry (`@johnmorrisdotca/kyogijo-stadiums/circuits`): famous race tracks as OpenStreetMap maps them, with a few facts each, drawn flat and in 3D.
// The words of the 3D view's controls in both languages (the circuits' own are in circuits.words.ts).
import "./strings.ts";
export { CIRCUITS, CIRCUIT_ATTRIBUTION, CIRCUIT_IDS, circuitById, circuitPlan } from "./circuits.ts";
export type { CircuitPlan, PlanTurn } from "./circuits.ts";
export { circuitDrawing, circuitTable, circuitText, drawCircuit } from "./circuits.draw.ts";
export type { CircuitDrawing } from "./circuits.draw.ts";
export { CIRCUIT_MARKER, CIRCUIT_PLANES_MAX, CIRCUIT_PRESETS, buildCircuitTurn, circuitTurnMarkup, mountCircuitTurn } from "./circuits.turn.ts";
export { KYOGIJO_CIRCUIT_STYLE } from "./circuits.style.ts";
export { CIRCUIT_WORDS } from "./circuits.words.ts";
export type { CircuitWords } from "./circuits.words.ts";
export { lineLength } from "./circuits.geo.ts";
export type { Circuit, CircuitBasis, CircuitData, CircuitFact, CircuitOptions, CircuitOsm, CircuitOsmPoint } from "./circuits.types.ts";
