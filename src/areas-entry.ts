// The areas of context one file each, read when asked for: which go with a choice of venues (`areaKeysFor`) and the data of one or of those (`loadArea`, `loadAreasFor`), as data a district takes in its `context` option. The entries `osm`, `cityctx` and `plateau` export the same data all at once.
export { AREA_KEYS, CITYCTX_VENUES, TOKYO_VENUES, areaKeysFor, loadArea, loadAreasFor } from "./areas.ts";
export type { ContextArea } from "./context.ts";
