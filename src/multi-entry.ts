// Tournament layouts: several of the package's surfaces laid out together for one large event, to scale, on one floor (tables, courts, sheets, a judo floor's contest areas in a row), with the barriers, the
// officials' chairs, a scoreboard hung over the middle, the boards and the empty places for the event's own words and marks; the real configurations of events as presets, each with its rule; the halls whose
// floors are published, and whether a layout fits one; and a real stadium round the floor at the same scale. `multiTable` is the text alternative.
export { drawMulti, multiSetting, multiTable } from "./multi.draw.ts";
export { MULTI_MAX, fitSentence, multiFit, multiLayout, needsSentence, specOf, venueOf } from "./multi.ts";
export { MULTI_PRESETS, MULTI_PRESET_IDS, MULTI_SOURCES, MULTI_VENUES, multiPreset, multiSource, multiVenueById } from "./multi.data.ts";
export { KYOGIJO_MULTI_STYLE } from "./multi.style.ts";
export { MULTI_WORDS } from "./multi.words.ts";
export type { MultiWords } from "./multi.words.ts";
export type { MultiBasis, MultiCell, MultiEvent, MultiFit, MultiFloor, MultiLayout, MultiNeeds, MultiOptions, MultiParts, MultiSize, MultiSlot, MultiSpec, MultiSurface, MultiUnit, MultiVenue, MultiWord } from "./multi.types.ts";
