// A district: several real venues of one city on one plan at their real relative positions and orientations (OpenStreetMap, ODbL 1.0), in 2D and in 3D, tight round neighbours or at the real distances of a city.
export { DISTRICT_IDS, DISTRICT_MARGIN, DISTRICT_MODES, KYOGIJO_DISTRICT_STYLE, circuitPointIn, describeDistrict, districtId, districtMember, districtRing, drawDistrict, isDistrictId, metresText, planDistrict, scaleOf, unknownVenues } from "./district.ts";
export type { DistrictCircuit, DistrictMember, DistrictMode, DistrictOptions, DistrictPart, DistrictPlaced, DistrictPlan, DistrictVenueInput, PlacedPart } from "./district.ts";
export { buildDistrictTurn, districtPresets, districtTurnMarkup, mountDistrictTurn } from "./district.turn.ts";
export type { DistrictTurnSettings } from "./district.turn.ts";
export type { ContextArea } from "./context.ts";
// A race circuit on the same ground (`circuit`: the district entry has every circuit, the lean district reads them with `loadCircuits`), and the famous landmarks an area of context has round it.
export { CIRCUIT_INDEX, loadCircuits } from "./circuits.index.ts";
export { circuitsHeld } from "./district.circuit.ts";
// A race on that circuit, among the venues and the city (the circuits' race, made-up cars or a feed's): drawn at a moment, or played in a page flat or in 3D.
export { drawDistrictRace, mountDistrictRace } from "./district.race.ts";
export type { DistrictRaceDrawOptions, DistrictRaceOptions, DistrictRaceSettings } from "./district.race.ts";
export type { KyogijoRace, RaceState } from "./circuits.race.dom.ts";
export { LANDMARK_SHAPES } from "./landmarks.ts";
export type { ContextLandmark, LandmarkShape, PlacedLandmark } from "./landmarks.ts";
export { KODOKAN, KODOKAN_DOJO, KODOKAN_FLOOR_HEIGHT, KODOKAN_FLOOR_IDS, KODOKAN_FLOORS, KODOKAN_ROOM_HEIGHT, kodokanLevel, kodokanMember } from "./kodokan.ts";
export type { KodokanFloor, KodokanRoom } from "./kodokan.ts";
export { VENUE_ATTRIBUTION } from "./venues.ts";
export { mountDistrict } from "./district.dom.ts";
export type { KyogijoDistrict } from "./district.dom.ts";
// The crowd outside the venues, on ground people may stand on (OpenStreetMap, ODbL 1.0), at 0, 25, 50, 75 or 100 percent of the seats.
export { OUTSIDE_DENSITY, OUTSIDE_LEVELS, OUTSIDE_REACH, OUTSIDE_VENUES, hasOutside, isOutsideLevel, outsideCount, outsideCrowd, outsideLevelOf } from "./outside.ts";
export type { OutsideCrowd, OutsideLevel, OutsideOptions } from "./outside.ts";
export { PERSON_METRES, frameOf, rasterOutside } from "./outside.paint.ts";
export type { OutsideFrame, OutsideStats } from "./outside.paint.ts";
export { OUTSIDE_ROOM } from "./district.ts";
export { WALK_CELL, WALK_IDS, walkMask, walkable } from "./walk.ts";
export type { WalkData, WalkMask } from "./walk.ts";
// The gates of a venue: where the crowd goes in, on the building's outline, with the way each faces and how it is known.
export { GATE_FACTS, GATE_VENUES, gateName, venueGates } from "./gates.ts";
export type { Gate, GateBasis, GateFact } from "./gates.ts";
export type { DistrictGate } from "./district.ts";
