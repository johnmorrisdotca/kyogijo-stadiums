// A district: several real venues of one city on one plan at their real relative positions and orientations (OpenStreetMap, ODbL 1.0), in 2D and in 3D, tight round neighbours or at the real distances of a city.
export { DISTRICT_IDS, DISTRICT_MARGIN, DISTRICT_MODES, KYOGIJO_DISTRICT_STYLE, describeDistrict, districtId, districtMember, drawDistrict, isDistrictId, metresText, planDistrict, scaleOf, unknownVenues } from "./district.ts";
export type { DistrictMember, DistrictMode, DistrictOptions, DistrictPlaced, DistrictPlan, DistrictVenueInput } from "./district.ts";
export { buildDistrictTurn, districtPresets, districtTurnMarkup, mountDistrictTurn } from "./district.turn.ts";
export type { DistrictTurnSettings } from "./district.turn.ts";
export type { ContextArea } from "./context.ts";
export { KODOKAN, KODOKAN_DOJO, KODOKAN_FLOOR_HEIGHT, KODOKAN_ROOM_HEIGHT, kodokanMember } from "./kodokan.ts";
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
