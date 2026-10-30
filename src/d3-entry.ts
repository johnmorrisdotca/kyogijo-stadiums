// A drawing on a d3 selection, in the caller's scales, with d3 not imported.
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
export { appendSurface, surfaceDomain } from "./d3.ts";
export type { AppendOptions, D3Selection } from "./d3.ts";
export type { ScaleFunction, SurfaceDomain } from "./scene.fit.ts";
