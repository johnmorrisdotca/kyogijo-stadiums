// The types of the data layers: what a caller gives `layers` in the options of a drawing. Plain data only (numbers, text and
// lists), so that the same options always draw the same drawing and a layer can be saved as JSON.
import type { ScoreOptions, SurfaceOptions } from "./types.ts";
import type { Frame, Attacking, Landmark, SurfaceSize } from "./frames.ts";
import type { ContourLayer, HeatmapLayer, HexbinLayer, LegendLayer, ZonesLayer } from "./heat.types.ts";
import type { DelaunayLayer, FlowLayer, FormationLayer, HullLayer, LineupLayer, NetworkLayer, SonarLayer, VoronoiLayer } from "./team.types.ts";
import type { Unit } from "./units.ts";

/** The shapes a point can be drawn as. A team's logo is `logo`. */
export type MarkShape = "circle" | "square" | "triangle" | "diamond" | "cross" | "x" | "star";

/** Which team a mark belongs to: `home` or `away` take the layer's team colours (`--ky-layer-home`, `--ky-layer-away`); any other text is a mark of no team. */
export type LayerTeam = "home" | "away" | (string & {});

/** A number mapped to another range: `domain` is the values (the data's least and greatest when missing) and `range` what they become. */
export interface Scale {
  domain?: readonly [number, number];
  range: readonly [number, number];
  /** For a size: scale the area and not the width, so that twice the value covers twice the ground. On by default. */
  area?: boolean;
}

/**
 * A colour, or a rule for choosing one. A text is any colour `safeColour` accepts. `by: "team"` uses the home and away colours of the layer,
 * `by: "value"` runs through `stops` as a datum's `value` goes from the least to the greatest of the domain, and `by: "outcome"` looks the
 * datum's outcome up in `colors`. A colour a datum carries itself (`color`) always wins.
 */
export type Paint =
  | string
  | { by: "team"; home?: string; away?: string; other?: string }
  | { by: "value"; stops: readonly string[]; domain?: readonly [number, number]; missing?: string }
  | { by: "outcome"; colors: Readonly<Record<string, string>>; other?: string };

/** How an outcome looks: a hollow mark (or a dashed line) is a miss, a failed pass or a shot that did not score. */
export interface OutcomeStyle {
  /** Draw a point hollow and a line dashed. */
  hollow?: boolean;
  /** A shape for this outcome, over the layer's. */
  shape?: MarkShape;
  /** A multiple of the mark's size: 1.4 makes a goal stand out. */
  scale?: number;
}

/** What every mark can carry. */
export interface MarkDatum {
  /** The tooltip, and what a screen reader reads for the mark. */
  title?: string;
  /** `home`, `away` or another team. */
  team?: LayerTeam;
  /** What happened, as a word of your own (`goal`, `miss`, `complete`). The standard ones are in `OUTCOMES`; the layer's `style.outcomes` adds more. */
  outcome?: string;
  /** A number that sizes and colours the mark when the layer's style asks it to (expected goals, speed, distance). */
  value?: number | null;
  /** A colour for this mark alone. */
  color?: string;
  /** 0 to 1. */
  opacity?: number;
}

/** A point to mark. */
export interface PointDatum extends MarkDatum {
  x: number | null;
  y: number | null;
  /** A shape for this mark alone, or `logo` for the logo of its team (or its own `logo`). */
  shape?: MarkShape | "logo";
  /** The width of the mark, in the layer's units. */
  size?: number;
  /** The address of a logo, for the shape `logo`. */
  logo?: string;
}

/** A line or an arrow: from `(x, y)` to `(x2, y2)`, or through `points`. */
export interface LineDatum extends MarkDatum {
  x?: number | null;
  y?: number | null;
  x2?: number | null;
  y2?: number | null;
  /** A path through several points, `[x, y]` each, in place of `x`, `y`, `x2` and `y2`. */
  points?: readonly (readonly [number, number])[];
  /** How far the line bows, as a fraction of its length. Positive bows to the right of the way it goes as the surface is drawn wide. */
  curve?: number;
  /** Make this one wavy (or straight, with false) whatever the layer's style says. */
  wavy?: boolean;
  /** The width of the stroke, in the layer's units. */
  width?: number;
}

/** A word or a number to write. */
export interface TextDatum extends MarkDatum {
  x: number | null;
  y: number | null;
  text: string | number;
  /** The height of the letters, in the layer's units. */
  size?: number;
  /** Turn the text this many degrees, clockwise, as the eye sees it. The text stays upright when the surface is turned. */
  rotate?: number;
  anchor?: "start" | "middle" | "end";
}

/** How points look. */
export interface PointStyle {
  shape?: MarkShape | "logo";
  /** The width of a mark in the layer's units, or a scale from `value`. A default that follows the size of the surface. */
  size?: number | Scale;
  /** A multiple of the default size. */
  scale?: number;
  /** The colour of the fill. The home and away colours for marks that carry a team, the layer colour for the rest. */
  fill?: Paint;
  /** The colour of the edge. A pale or dark line (`--ky-layer-edge`) that sets the mark off the ground. `none` for no edge. */
  stroke?: string | "none";
  opacity?: number;
  /** Looks of outcomes, over the standard ones in `OUTCOMES`. */
  outcomes?: Readonly<Record<string, OutcomeStyle>>;
  /** Logos by team, for the shape `logo`. In a score drawing the teams' own logos are used when these are missing. */
  logos?: { home?: string; away?: string };
}

/** The look of a comet: a line that fades in along its length, and may also thicken. */
export interface Comet {
  /** The opacity at the start, 0 to 1. 0.05 by default. */
  from?: number;
  /** Draw it as a shape that thickens towards the end, not as a stroke of one width. */
  taper?: boolean;
}

/** How lines and arrows look. */
export interface LineStyle {
  /** The width of the stroke in the layer's units, or a scale from `value`. */
  width?: number | Scale;
  scale?: number;
  color?: Paint;
  opacity?: number;
  /** `auto` (the default) dashes the lines of a hollow outcome. */
  dash?: "auto" | "solid" | "dashed" | "dotted";
  /** How far lines bow, as a fraction of their length. */
  curve?: number;
  /** Draw lines as waves, for a carry: `true` for the usual wave, or its size. */
  wavy?: boolean | { amplitude?: number; wavelength?: number };
  /** The head at the end: a filled triangle, an open chevron or none. Arrows have a triangle by default and lines none. */
  head?: "triangle" | "open" | "none";
  /** The length of the head as a multiple of the width. 3.4 by default. */
  headSize?: number;
  /** Fade a line in along its length (a pass, a run): `true` or its look. Each comet has a gradient of its own, with an id that belongs to the drawing. */
  comet?: boolean | Comet;
  outcomes?: Readonly<Record<string, OutcomeStyle>>;
}

/** How text looks. */
export interface TextStyle {
  /** The height of the letters in the layer's units. A default that follows the size of the surface. */
  size?: number;
  color?: Paint;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  /** Outline the letters in the halo colour (`--ky-halo`) so that they read on any ground. On by default. */
  halo?: boolean;
  opacity?: number;
}

/** What every layer takes. */
export interface LayerBase {
  /** A name for the layer in ids and in the page; letters, digits and hyphens. */
  id?: string;
  /** What the marks are, for the summary: `shots`, `passes`. */
  name?: string;
  /** The accessible title of the layer. Made from the count and `name` when missing, such as "24 shots". */
  title?: string;
  /** The accessible description. Made from the counts by outcome and team when missing. */
  description?: string;
  /** The frame the coordinates are in (a name in `FRAMES`, or a `Frame`). Without it they are the surface's own: feet from the top left of the surface as drawn wide. */
  from?: Frame | string;
  /** The unit of sizes and of `anchors`, and of the coordinates when there is no `from` (a frame's numbers are in the frame's own unit): the drawing's `units`, else feet. `rulebook` is the unit of the sport's rulebook (`SURFACE_UNITS`). */
  units?: Unit | "rulebook";
  /** The end the layer's team attacks in the frame's numbers, for a frame fixed to the surface. */
  attacking?: Attacking;
  /** The surface's size, for a frame that fits any size. */
  surfaceSize?: SurfaceSize;
  /** Landmarks of your own for an axis of the frame. */
  anchors?: { x?: readonly Landmark[]; y?: readonly Landmark[] };
  /** Keep the marks on the surface (`surface`) or in a box, instead of cutting what falls outside. */
  limits?: "surface" | { x?: readonly [number, number]; y?: readonly [number, number] };
  /** `surface` (the default) cuts the layer to the surface's outline (the boards' corners, the fence, the court's lines); `none` lets it run over the ground round it. */
  clip?: "surface" | "none";
  /** Hide the layer. It is still in `layerTable`. */
  hidden?: boolean;
}

export interface PointsLayer extends LayerBase {
  kind: "points";
  data: readonly PointDatum[];
  style?: PointStyle;
}

export interface LinesLayer extends LayerBase {
  kind: "lines";
  data: readonly LineDatum[];
  style?: LineStyle;
}

export interface ArrowsLayer extends LayerBase {
  kind: "arrows";
  data: readonly LineDatum[];
  style?: LineStyle;
}

export interface TextLayer extends LayerBase {
  kind: "text";
  data: readonly TextDatum[];
  style?: TextStyle;
}

/** A layer of data on a surface. */
export type Layer = PointsLayer | LinesLayer | ArrowsLayer | TextLayer | HeatmapLayer | HexbinLayer | ZonesLayer | ContourLayer | LegendLayer | NetworkLayer | FormationLayer | LineupLayer | VoronoiLayer | DelaunayLayer | HullLayer | FlowLayer | SonarLayer;

/** The kinds of layer. */
export type LayerKind = Layer["kind"];

/** What `layerTable` takes. */
export interface TableOptions {
  language?: "en" | "ja";
  /** The most rows to write for one layer. 500 by default; the caption says when rows are left out. */
  maxRows?: number;
  /** A class for each table. `ky-table` by default. */
  className?: string;
  /** The drawing's options (at least `sport`, and `park`, `pitch`, `units` and `language` where they apply): needed for the tables of heat maps, hexagon maps, zone charts and contours, whose cells and zones follow the surface. Without it those layers' marks are listed as points. */
  surface?: SurfaceOptions | ScoreOptions;
}
