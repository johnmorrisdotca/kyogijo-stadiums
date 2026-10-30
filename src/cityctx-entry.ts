// The surroundings of the venues of Vancouver and Seattle (streets, buildings, water, green, trees), as data a district takes in its `context` option, from OpenStreetMap (ODbL 1.0) and the Cities' open data, with their credits; `contextFor` says which go with some venues.
// The words in both languages, as this entry has always carried them (the lean district reads one language when it is asked to).
import "./strings.ts";
export { CITYCTX_AREAS, SEATTLE_CENTER, SEATTLE_CITY, SEATTLE_SODO, VANCOUVER_NATURE } from "./cityctx.data.ts";
export { CITYCTX_VENUES, contextFor } from "./cityctx.ts";
export type { ContextArea } from "./context.ts";
