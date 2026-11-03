// The circuits entry (`@johnmorrisdotca/kyogijo-stadiums/circuits`): famous race tracks as OpenStreetMap maps them, with a few facts each, drawn flat and in 3D.
// The words of the 3D view's controls in both languages (the circuits' own are in circuits.words.ts).
import "./strings.ts";
export { CIRCUITS, CIRCUIT_ATTRIBUTION, CIRCUIT_IDS, circuitById, circuitPlan } from "./circuits.ts";
export type { CircuitPlan, PlanTurn } from "./circuits.ts";
export { circuitDrawing, circuitTable, circuitText, drawCircuit } from "./circuits.draw.ts";
export type { CircuitDrawing } from "./circuits.draw.ts";
export { CIRCUIT_MARKER, CIRCUIT_PLANES_MAX, CIRCUIT_PRESETS, buildCircuitTurn, circuitTurnMarkup, circuitUprights, mountCircuitTurn } from "./circuits.turn.ts";
export { KYOGIJO_CIRCUIT_STYLE } from "./circuits.style.ts";
export { CIRCUIT_WORDS } from "./circuits.words.ts";
export type { CircuitWords } from "./circuits.words.ts";
export { lineLength } from "./circuits.geo.ts";
export type { Circuit, CircuitBasis, CircuitData, CircuitFact, CircuitOptions, CircuitOsm, CircuitOsmPoint } from "./circuits.types.ts";
// A simulated race on any circuit: made-up cars from the grid to the flag, its moments, its drawing and board, and its view in a page.
export { RACE_PACE, cornerSpeed, paceProfile, speedAt } from "./circuits.pace.ts";
export type { PaceProfile } from "./circuits.pace.ts";
export { RACE_DISTANCE, raceLaps, simulateRace } from "./circuits.race.ts";
export type { CircuitRace, RaceCar, RaceOptions, RaceStop } from "./circuits.race.ts";
export { carAt, raceAt, racePoint } from "./circuits.race.moment.ts";
export type { RaceMoment, RaceStanding, RaceStatus } from "./circuits.race.moment.ts";
export { RACE_STYLE, drawRace, gapText, lapTime, raceBoard, raceClock, raceDrawing, raceStage } from "./circuits.race.draw.ts";
export type { RaceDrawOptions, RaceDrawing } from "./circuits.race.draw.ts";
export { RACE_SPEEDS, mountCircuitRace } from "./circuits.race.dom.ts";
export type { KyogijoRace, RaceState, RaceViewOptions, RaceViewSettings } from "./circuits.race.dom.ts";
export { RACE_CARS_MAX, RACE_DRIVERS, RACE_TEAMS } from "./circuits.race.field.ts";
export type { RaceDriver, RaceTeam } from "./circuits.race.field.ts";
export { RACE_WORDS } from "./circuits.race.words.ts";
export type { RaceWords } from "./circuits.race.words.ts";
// A race from a feed: the open race timeline, an adapter for OpenF1-style rows, and reading a feed the user names (a URL, pasted text, a file), once or while a race goes on.
export { FEED_LIMITS, raceFromFeed, raceToFeed, readRaceFeed } from "./circuits.feed.ts";
export type { FeedResult, RaceFeed, RaceFeedCar } from "./circuits.feed.ts";
export { looksLikeOpenF1Laps, openF1Feed } from "./circuits.feed.openf1.ts";
export type { OpenF1Driver, OpenF1Lap, OpenF1Location, OpenF1Pit, OpenF1Rows } from "./circuits.feed.openf1.ts";
export { FEED_MAX_BYTES, FOLLOW_EVERY, RaceFeedError, feedAddress, feedFromText, followRaceFeed, loadRaceFeed, openF1Siblings } from "./circuits.feed.fetch.ts";
export type { FeedFollower, FeedProblemKind } from "./circuits.feed.fetch.ts";
