// The data of the venues a page shows, one file each, read when asked for: `loadVenueDataFor` for the venues of a district, `loadArena`, `loadPark` and `loadGround` for one, `venueName` to list the venues by name without reading any of them.
export { loadArena, loadGround, loadPark, loadVenueDataFor, venueDataKeysFor, venueName } from "./venue-data.ts";
export type { VenueDataKeys } from "./venue-data.ts";
export type { Arena } from "./arenas.core.ts";
export type { Ground } from "./grounds.core.ts";
export type { Park } from "./parks.core.ts";
