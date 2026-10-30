// Every real venue, held for the drawing: `full.ts` imports this, so that every entry but the lean district has the venues' facts and outlines, as it always had. The lean district holds the venues `loadVenueDataFor` has read
// (`venues.ts`). A bundler keeps this file for its effect: package.json lists it in `sideEffects`.
import { VENUE_DATA } from "./venues.data.ts";
import { VENUE_OSM } from "./venues.osm.data.ts";
import { registerVenues } from "./venues.ts";

registerVenues(VENUE_DATA, VENUE_OSM);
