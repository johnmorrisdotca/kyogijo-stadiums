// Layouts: many drawings in one SVG (small multiples with a shared title, subtitle, credit line and key, in a size for a social card or a phone) and the grounds behind a drawing or a grid.
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
export { GRID_MAX_CELLS, GRID_PRESETS, drawGrid } from "./layout.ts";
export type { GridCell, GridDrawing, GridLegendItem, GridOptions, GridPreset, GridPresetInfo } from "./layout.ts";
export { KYOGIJO_GRID_STYLE } from "./layout.style.ts";
export { BACKGROUND_OPACITY, BACKGROUND_PATTERNS, KYOGIJO_BACKGROUND_STYLE, backgroundMarkup, laidOn, resolveBackground } from "./background.ts";
export type { Background, BackgroundFit, BackgroundMarkup, BackgroundOptions, BackgroundPattern } from "./background.ts";
