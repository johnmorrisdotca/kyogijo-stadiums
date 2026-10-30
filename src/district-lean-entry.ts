// The lean district: everything the district entry has, for a page that wants to carry only the venues it shows. This entry holds no arena, park or ground until `loadVenueDataFor(venues)` has read the files of those it is about to draw
// (the same call and the same venues for `planDistrict`, `drawDistrict`, `mountDistrict` and `mountDistrictTurn`; `loadOutside(venues)` likewise for the walkable ground of the crowd outside, which only a district with a mask, Vancouver's, has); with them read, what it draws is what the district entry draws, to the last character. The areas of context are read the same way
// (`loadAreasFor`). `venueName` lists the venues by name without reading any. Nothing here changes the district entry, which has every venue's data as it always had.
export * from "./district.api.ts";
export * from "./areas-entry.ts";
export * from "./venue-data-entry.ts";
export { STADIUMS, STADIUM_IDS, stadiumById } from "./stadiums.ts";
export type { RealStadium, StadiumConfigId } from "./stadiums.ts";
export { QUALITIES, QUALITY_TIERS, isQuality } from "./quality.ts";
export type { Quality, QualityTier } from "./quality.ts";
