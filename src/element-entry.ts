// The custom element's class and its registration function; importing this entry registers nothing.
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
export { KYOGIJO_ATTRIBUTES, KYOGIJO_TAG, KyogijoField, defineKyogijoField, optionsFromAttributes, replaySettingsFromAttributes, turnSettingsFromAttributes, turnWanted } from "./element.ts";
export { useEmblems } from "./emblems-source.ts";
export type { EmblemRenderer } from "./emblems-source.ts";
export { useFlags } from "./flags-source.ts";
export type { FlagRenderer, FlagRequest, FlagShape } from "./flags-source.ts";
