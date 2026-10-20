// A district: several real venues of one city on one plan at their real relative positions and orientations (OpenStreetMap, ODbL 1.0), in 2D and in 3D, tight round neighbours or at the real distances of a city.
export { DISTRICT_IDS, DISTRICT_MARGIN, DISTRICT_MODES, KYOGIJO_DISTRICT_STYLE, describeDistrict, districtId, districtMember, drawDistrict, isDistrictId, metresText, planDistrict, scaleOf, unknownVenues } from "./district.ts";
export type { DistrictMember, DistrictMode, DistrictOptions, DistrictPlaced, DistrictPlan, DistrictVenueInput } from "./district.ts";
export { buildDistrictTurn, districtPresets, districtTurnMarkup, mountDistrictTurn } from "./district.turn.ts";
export type { DistrictTurnSettings } from "./district.turn.ts";
export { VENUE_ATTRIBUTION } from "./venues.ts";
