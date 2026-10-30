// A district: several real venues of one city on one plan at their real relative positions and orientations (OpenStreetMap, ODbL 1.0), in 2D and in 3D, tight round neighbours or at the real distances of a city.
// This entry has every arena, park and ground, as it always had (the lean district, `district-lean`, has none until `loadVenueDataFor` has read the ones it shows).
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
// The walkable ground of every district, for the crowd outside, as the district has always had it (the lean district reads one when `loadOutside` is asked to).
import "./walk.full.ts";
export * from "./district.api.ts";
