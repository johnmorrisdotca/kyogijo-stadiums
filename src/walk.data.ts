// Made by scripts/build-walk.mjs from the files of data-sources/walk/ (read 2026-10-22): do not edit by hand.
//
// Every district's data in one table, for the entries that have always had it (the lean district reads one district's file when it is asked to: `loadOutside`). The data is in `walk/<district>.data.ts`, one file each.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds, for each district, what a crowd outside its venues is stopped by or can stand on, as
// OpenStreetMap maps it within 350 metres of the venues: lines with a width (the paths and sidewalks people walk on; the carriageways, cycle tracks and railways that stop a crowd) and areas (the plazas, squares, parks
// and platforms people stand on; the buildings and the water that stop it), laid flat in metres from the district's origin, simplified to 30 centimetres and written in whole quarter-metres: a feature is its
// first point and then the step to each next one. The package is MIT; this file is a derived database under the ODbL, offered under it with the credit above. The crowds and drawings made from it are produced works
// and need only the credit (`VENUE_ATTRIBUTION`). Nothing in a CC0 or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/walk/.
import { WALK_UNIT } from "./walk.ts";
import type { WalkData } from "./walk.ts";
import { WALK as walk_vancouver } from "./walk/vancouver.data.ts";

export { WALK_UNIT };

export const WALK_DATA: Record<string, WalkData> = {
  "vancouver": walk_vancouver,
};
