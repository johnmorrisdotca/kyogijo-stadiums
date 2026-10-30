// What every entry has but the lean district: every arena, park and ground there is data for, and every part of the drawing, held for the drawing. The drawing reads the venue it is asked for from a table that these three modules fill when they are imported (`heldArena`, `heldPark`, `heldGround`): an entry
// that imports this file has them all, which is what every entry has always had. An entry that does not (the lean district, `district-lean`) holds only what `loadVenueDataFor` has read for the venues it shows. A bundler keeps this file
// for its effect: package.json lists it, and the three, in `sideEffects`.
import "./arenas.ts";
import "./parks.ts";
import "./grounds.ts";
// The parts of a drawing that only some drawings use (`draw.parts.ts`): the drawing reads them from a table, and this fills it.
import { providePart } from "./draw.parts.ts";
import { renderLayers } from "./layers.ts";

providePart("layers", renderLayers);
