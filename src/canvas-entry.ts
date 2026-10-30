// A drawing on a canvas context (a browser's, an OffscreenCanvas's or a Node canvas's), with no canvas library imported.
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
export { drawToCanvas, withAlpha } from "./canvas.ts";
export type { CanvasContext, CanvasGradientLike, CanvasOptions, Drawn } from "./canvas.ts";
