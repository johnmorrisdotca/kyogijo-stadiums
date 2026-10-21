// What a tournament layout is: several of the package's own surfaces (tables, courts, sheets, a judo floor's contest areas) laid out together on one floor for one large event, to scale, and the
// hall floor that layout needs. Types only; the figures are in multi.data.ts and the working-out in multi.ts.
import type { LedBoardOptions, LightingOptions, Sport, SurfaceOptions } from "./types.ts";

/** The unit a layout's lengths are written in: the one its rulebook prints. */
export type MultiUnit = "m" | "ft";

/** A length along the layout (`x`, left to right) and across it (`y`, top to bottom). */
export interface MultiSize {
  length: number;
  width: number;
  unit: MultiUnit;
}

/**
 * How sure the arrangement is. `rulebook`: the spacing is what a rulebook or a federation's specification asks for (the least, or the recommendation it names), laid out in the grid it allows;
 * no event's plan is drawn. `event`: the numbers are a rulebook's, and the arrangement (how many areas, one floor, one scoreboard) is what an event used, read from reports and from photographs; the
 * event's own plan was not seen, so it is not drawn as measured.
 */
export type MultiBasis = "rulebook" | "event";

/** The event a layout is tied to, where one is named: what was held, when, in which hall. */
export interface MultiEvent {
  name: string;
  year: number;
  venue: string;
  city: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** The event, the hall and the city as Japanese writes them, for the Japanese output (the English names are used where this is missing). */
  ja?: { name: string; venue: string; city: string };
  /** A key of `MULTI_VENUES`, when the hall's floor is published. */
  floor?: string;
  /** What is known of the arrangement, and what is only read from a picture. */
  note: { en: string; ja: string };
  /** Keys of `MULTI_SOURCES`. */
  sources: readonly string[];
}

/** The words of a sample event: any part left out is the package's own. */
export interface MultiSample {
  event?: string;
  year?: string | number;
  city?: string;
}

/** What stands on or beside each playing surface, and over the floor. */
export interface MultiParts {
  /** The barriers (surrounds) that enclose each playing area, drawn round the area's bay. */
  barriers?: boolean;
  /** An umpire's chair and a score table beside each surface. */
  officials?: boolean;
  /** A scoreboard for each surface (`each`), one hung over the middle of the floor for all (`shared`), or none. */
  scoreboard?: "each" | "shared" | "none";
  /** Boards along the edges of the floor, empty, to carry whatever the event puts there. */
  boards?: boolean;
  /** Empty places for the event's own words and marks: printed on the floor (`floor`), or on the mats of a budō floor (`mat`, which sit on the surface itself, as a judo floor is printed). */
  brand?: "floor" | "mat" | "none";
}

/** The floors a layout can be set on: the colour of the hall's floor and the words for what each surface is called. */
export type MultiFloor = "blue" | "green" | "wood" | "red" | "ice";

/** What each surface of a layout is called. */
export type MultiWord = "table" | "court" | "sheet" | "area";

/** The surface of each cell: the options of `drawKyogijo` for one of them. */
export type MultiSurface = Omit<SurfaceOptions, "id" | "style" | "margin" | "theme" | "language" | "title" | "description" | "className" | "width" | "height" | "score">;

/** A layout as data: the surface, the grid, the space each surface is given, and what is on and round it. */
export interface MultiSpec {
  /** The key: `tabletennis-4`. */
  id: string;
  name: { en: string; ja: string };
  /** The sport of the surfaces: the stands a stadium draws round the floor follow it. */
  sport: Sport;
  /** The surface of every cell. A `budo` layout is one drawing of the sport's own several areas, and `surface` says how many. */
  surface: MultiSurface;
  /** The cells are the surfaces laid in a grid; `budo` (judo and karate) has the sport's own areas in one floor of mats. */
  kind: "cells" | "budo";
  rows: number;
  columns: number;
  /** The space each surface is given, along it and across it, centre to centre, in the unit its rulebook prints. Not for a `budo` layout, whose spacing is the sport's own. */
  bay?: MultiSize;
  /** The space from the outermost surface's edge to the edge of the floor: along the layout at each end (`length`) and across it at each side (`width`). Half of what the bay has beyond the surface, when missing. */
  edge?: MultiSize;
  /** Each surface is turned a quarter: the surfaces stand across the layout instead of along it (curling sheets and badminton courts side by side), so a row of N is `rows: 1, columns: N`. `bay` and `edge` are then in the layout's own frame (along it, across it). */
  turn?: 90;
  /** Every other row moved along the layout by this share of the bay's length (0 to 1): a staggered grid. */
  stagger?: number;
  /** What each surface is called on the plan. */
  word: MultiWord;
  parts: MultiParts;
  /** The colour of the hall's floor round the surfaces (a `budo` layout's is the mats'). */
  floor: MultiFloor;
  basis: MultiBasis;
  event?: MultiEvent;
  /** What the spacing is, in a sentence of each language, and the rule it is from. */
  rule: { en: string; ja: string };
  /** Keys of `MULTI_SOURCES` (or `LEAGUE_SOURCES`) the figures are read from. */
  sources: readonly string[];
}

/** One surface of a laid-out floor, in feet, in the layout's frame (x along, y across, from the top left of the floor). */
export interface MultiCell {
  /** `1`, `2`, ... in reading order. */
  n: number;
  /** The name on the plan: `Table 1`. */
  label: string;
  row: number;
  column: number;
  /** The playing surface: where its top left is, and its size. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** True when the surface is turned a quarter in the layout (see `MultiSpec.turn`): `w` and `h` are then the turned size. */
  turn: boolean;
  /** The space the surface is given: the bay. */
  bay: { x: number; y: number; w: number; h: number };
}

/** An empty place for the event's own words or a mark: nothing is printed in it. */
export interface MultiSlot {
  id: string;
  kind: "floor-text" | "floor-logo" | "board";
  /** True when the slot is on a budō floor's mats (printed on the surface itself). */
  onMat: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What a layout is, laid out. */
export interface MultiLayout {
  spec: MultiSpec;
  cells: MultiCell[];
  slots: MultiSlot[];
  /** The floor the layout needs, in feet: the union of the bays (a budō floor's: the tatami and the free zone round it), from the top left corner at 0, 0. */
  floor: { w: number; h: number };
  /** For a budō floor: the tatami (the contest areas with their safety areas), where it stands on the floor, in feet. */
  tatami?: { x: number; y: number; w: number; h: number };
  /** Where the scoreboard hangs, when there is one for all (the middle of the floor), and its size. */
  shared?: { x: number; y: number; w: number; h: number };
  needs: MultiNeeds;
}

/** The floor a layout needs, in metres and square metres: what a hall has to give. */
export interface MultiNeeds {
  /** Along the layout, then across it. */
  length: number;
  width: number;
  area: number;
  /** How many playing surfaces. */
  surfaces: number;
}

/** A hall's floor as the data gives it. */
export interface MultiVenue {
  /** The key: `copper-box-arena`. */
  id: string;
  name: { en: string; ja: string };
  /** Where it stands, for a hall (an ice pad of a given size is anywhere). */
  city?: string;
  country?: string;
  /** `rectangle`: a floor of `length` by `width`; `octagon`: a regular octagon `across` the flats; `area`: only an area is published, so a shape is not known. */
  shape: "rectangle" | "octagon" | "area";
  length?: number;
  width?: number;
  across?: number;
  /** In square metres, when the source gives it (and for a shape that is only an area, the whole of what it gives). */
  area?: number;
  unit: MultiUnit;
  /** What the figure is a figure of, in a sentence of each language. */
  what: { en: string; ja: string };
  /** What the hall's floor is, for the drawing: ice for an ice pad, wood for a sports hall, neutral when the source says nothing of it. */
  floor?: MultiFloor | "neutral";
  /** The sports whose stands the hall's are like, for a stadium drawn round it. */
  standsLike: Sport;
  sources: readonly string[];
}

/** Whether a layout fits a floor, and how. */
export interface MultiFit {
  /** `true` when it fits, `false` when it does not, `null` when the floor's shape is not known (only its area) and the area is enough, so that it may. */
  fits: boolean | null;
  /** How the layout sits: as drawn, or turned a quarter. */
  turned: boolean;
  /** `size`: the shape was held to a rectangle or an octagon; `area`: only the areas were compared. */
  by: "size" | "area";
  needs: MultiNeeds;
  /** What is left of the floor, in metres, along it and across it (negative when short), for a floor with a shape; in square metres for the area. */
  spare: { length: number; width: number } | { area: number };
  floor: { length?: number; width?: number; across?: number; area: number };
}

/** A layout as the options of `drawMulti` ask for it. */
export interface MultiOptions {
  /** A preset of `MULTI_PRESETS`, by key. */
  preset?: string;
  /** A layout of your own, in place of a preset. */
  layout?: MultiSpec;
  /** The grid, when it is not the preset's. A `budo` layout takes `columns` as its areas in a row and `rows` as its rows. */
  rows?: number;
  columns?: number;
  /** A staggered grid: every other row moved along by this share of the bay (0 to 1). */
  stagger?: number;
  /** The hall's floor: a key of `MULTI_VENUES`, a hall of `MULTI_VENUES` itself, or a floor of your own. The layout is set in it, and the drawing says whether it fits. */
  venue?: string | MultiVenue | { length: number; width: number; unit?: MultiUnit };
  /** A real stadium round the floor, to the same scale: the walls, the stands and the crowd the package draws for the sport. Off by default. */
  stadium?: boolean | { crowd?: boolean; density?: number; roof?: boolean; shape?: "bowl" | "sides"; detail?: "fine" | "plain"; boards?: boolean | LedBoardOptions; lighting?: LightingOptions };
  /** The empty places for the event's words and marks, and the boards: on by default; `false` draws neither. */
  slots?: boolean;
  /**
   * Fill the places for the event's words and marks with sample content, to show a layout as an event would dress it: an invented event name, year and city on the floor and the boards, and simple emblems of the package's own
   * (a ring with a star, a diamond or waves) in the logo places, in place of the dashed empty places. `true` for "Kyogijo Open 2026, Osaka" (in Japanese, 競技場杯 2026, 大阪), or the event's name, year and city of
   * your own. It names no real event, brand, federation or sponsor. Off by default: the places are drawn empty, as a layout is configured.
   */
  sample?: boolean | MultiSample;
  /** The names of the surfaces over them. On by default. */
  labels?: boolean;
  language?: "en" | "ja";
  theme?: "light" | "dark";
  /** A prefix for the ids. Made from the options when missing. */
  id?: string;
  className?: string;
  title?: string;
  description?: string;
  /** `none` leaves the stylesheet to the page (`KYOGIJO_STYLE` and `KYOGIJO_MULTI_STYLE`). */
  style?: "embed" | "none";
}
