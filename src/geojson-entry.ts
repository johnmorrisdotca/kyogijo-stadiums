// A drawing as GeoJSON, in the surface's own units or a provider's frame.
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
export { sceneToGeoJSON } from "./geojson.ts";
export type { Feature, FeatureCollection, GeoJsonOptions, Geometry, Position } from "./geojson.ts";
