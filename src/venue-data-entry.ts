// The data of the venues a page shows, one file each, read when asked for (`loadOutside` the walkable ground of a crowd outside them, and `loadStrings` the words of a language, in the same way): `loadVenueDataFor` for the venues of a district, `loadArena`, `loadPark` and `loadGround` for one, `venueName` to list the venues by name without reading any of them.
export { loadArena, loadGround, loadPark, loadVenueDataFor, venueDataKeysFor, venueName } from "./venue-data.ts";
export type { VenueDataKeys } from "./venue-data.ts";
// The walkable ground of the crowd outside some venues (OpenStreetMap, ODbL 1.0), one file for each district, read when the venues have a crowd outside to show.
export { loadOutside } from "./walk.ts";
// The words of a language, one file each, read before the first draw in it.
export { loadStrings } from "./strings.core.ts";
export type { Arena } from "./arenas.core.ts";
export type { Ground } from "./grounds.core.ts";
export type { Park } from "./parks.core.ts";
