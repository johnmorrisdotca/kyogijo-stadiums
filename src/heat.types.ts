// The types of the heat layers: heat maps on a grid, hexagon maps, zone charts, density contours and legends. Plain data, except that a custom
// statistic is a function (the one thing in a layer that cannot be saved as JSON).
import type { HeatRamp } from "./heat.colour.ts";
import type { HexOrientation, Reducer, StatisticName } from "./heat.stats.ts";
import type { ZoneSetId } from "./heat.zones.ts";
import type { LayerBase, MarkDatum } from "./layers.types.ts";
import type { Box } from "./types.ts";

export type { HeatRamp, HeatRampName } from "./heat.colour.ts";
export type { HexOrientation, Reducer, StatisticName } from "./heat.stats.ts";
export type { ZoneSetId } from "./heat.zones.ts";

/** A statistic: a name, or a function of a bin's values (the median is the median of them; a function gets them all). */
export type HeatStatistic = StatisticName | Reducer;

/** A point to count: where it is, and optionally a number it carries (`value`: a distance, an expected-goals figure, a speed) and an outcome (`made`, `goal`) for the `rate` statistic. */
export interface HeatDatum extends MarkDatum {
  x: number | null;
  y: number | null;
}

/** Where to write the number of a cell or zone, and which. */
export interface HeatLabels {
  /** What to write, a line each: the `value`, the `name` of a zone, the `count` of marks in it, its `share` of all of them (a percent) or the `ratio` of hits to marks (`13/31`). The value by default. */
  show?: readonly ("value" | "name" | "count" | "share" | "ratio")[];
  /** Decimal places of the value. A whole number for a count, and one place for a percent below 10, by default. */
  decimals?: number;
  /** The height of the letters in the layer's units. Follows the cell or the zone by default. */
  size?: number;
  /** Write nothing for a cell or zone with fewer marks than this. */
  minCount?: number;
}

/** A colour bar with ticks, drawn on the surface. */
export interface HeatLegend {
  /** Where it sits on the surface: `bottom` (the middle of the lower edge) by default, or a corner. A ballpark's default is its lower right, outside the foul lines. */
  position?: "bottom" | "top" | "bottom-left" | "bottom-right" | "top-left" | "top-right";
  /** The legend's heading. The name of the statistic by default. */
  title?: string;
  /** About how many ticks. 5 by default. */
  ticks?: number;
  /** The opacity of the legend, 0 to 1. */
  opacity?: number;
  /** Size and place the legend against this part of the surface, in feet in the drawing's frame (x along the surface, y across it), instead of the whole of what is shown: the half of a curling sheet that is drawn, say. */
  region?: Box;
}

/** What the heat layers take beyond a layer's places. */
export interface HeatBase extends LayerBase {
  data: readonly HeatDatum[];
  /**
   * Draw each cell or hexagon as a path of its own, with `data-mark-id`, `data-index` and `data-zone`, so that a listener can tell which one a pointer is on (the default). `false` merges the cells of one colour
   * into a single path, about a third of the size, for a big grid nobody points at. A zone chart always has a path for each zone.
   */
  marks?: boolean;
  /** What each cell or zone shows: `count` (the default), `sum`, `mean`, `median`, `max` or `min` of the marks' `value`, `percent` (a share of all the marks, 0 to 100), `rate` (the percent of the marks whose `outcome` is a success; see `success`) or a function `(values, { count, hits, total }) => number | null`. */
  statistic?: HeatStatistic;
  /** The statistic's name in the legend and the summary, when it is a function of your own. */
  statisticName?: string;
  /** Rescale the values after the statistic: `max` (each divided by the greatest, 0 to 1), `sum` (each as a share of the total, 0 to 1) or `percent` (as `sum`, 0 to 100). `none` by default. */
  normalize?: "none" | "max" | "sum" | "percent";
  /** The colour ramp: a built-in name (`ember`, `ocean`, `mono`, `balance`, `tide`), a list of stops, or `{ light, dark }` lists. `ember`, or `balance` when `center` is given, by default. */
  ramp?: HeatRamp;
  /** The values the ramp spans, from its first colour to its last. The data's own range (from zero for a count, a sum or a percent) by default. */
  domain?: readonly [number, number];
  /** Make the ramp diverge from this value: the domain becomes symmetric about it and the middle of the ramp is the value. */
  center?: number;
  /** How many shades the ramp is cut into. 9 by default. */
  steps?: number;
  /** Write the numbers on the cells or zones. */
  labels?: boolean | HeatLabels;
  /** Draw a legend on the surface. */
  legend?: boolean | HeatLegend;
  /** Paint a pale (light page) or dark (dark page) ground under the cells so that the ramp is read against one colour whatever the surface. `plate` by default, `none` to see the surface as it is. */
  ground?: "plate" | "none";
  /** The opacity of the whole layer, 0 to 1. 0.92 by default. */
  opacity?: number;
  /** Outcomes that count as a success for the `rate` statistic. `made`, `goal`, `scored`, `hit`, `complete`, `success` and `won` by default. */
  success?: readonly string[];
  /** Leave out a cell or zone that holds fewer marks than this (a rate from two shots is not worth a colour). 1 by default. */
  minCount?: number;
}

/** Bins on a grid: a number of bins, or the edges between them. */
export interface HeatBins {
  /** A number of bins across, or a list of edges in the layer's coordinates. */
  x?: number | readonly number[];
  y?: number | readonly number[];
}

/** A binned statistic on a grid laid over the surface (hockey_rink's `heatmap`, mplsoccer's `bin_statistic` with `heatmap`). */
export interface HeatmapLayer extends HeatBase {
  kind: "heatmap";
  /** The bins. A number is how many across the surface's longer side, with square cells; `[across, down]` for both; or `{ x, y }` each a count or edges. About 24 across by default. */
  bins?: number | readonly [number, number] | HeatBins;
  /** Grid only part of the surface, in the layer's coordinates: the attacking half, say. The whole surface by default. */
  extent?: { x?: readonly [number, number]; y?: readonly [number, number] };
}

/** A binned statistic on hexagons (hockey_rink's and mplsoccer's `hexbin`). */
export interface HexbinLayer extends HeatBase {
  kind: "hexbin";
  /** The distance from a hexagon's centre to its corner, in the layer's units. A twenty-eighth of the surface's length by default. */
  size?: number;
  /** A corner up (`pointy`, the default) or an edge up (`flat`). */
  orientation?: HexOrientation;
}

/** A statistic by named zone of the surface. */
export interface ZonesLayer extends HeatBase {
  kind: "zones";
  /** The set of zones: `soccer-positional`, `soccer-thirds`, `soccer-channels`, `soccer-18`, `nba-shot`, `nhl-slot`, `nhl-home-plate`, `baseball-spray`, `baseball-retrosheet` or `football-pass`. */
  zones: ZoneSetId;
  /** The way the team attacks as the surface is drawn wide: names the sides and counts the soccer bands from the team's own end. `right` by default. */
  direction?: "left" | "right";
  /** For a surface with a zone chart at each end (the court, the rink): `left`, `right` or `both` (the default). */
  end?: "left" | "right" | "both";
  /** For `football-pass`: the line of scrimmage, in the layer's coordinates along the field. Midfield by default. */
  los?: number;
  /** For `baseball-spray`: the side the batter bats from, `R` (the default) or `L`; `pull` is then left or right field. `"none"` names the thirds left, centre and right field instead. */
  bats?: "L" | "R" | "none";
}

/** The shape of a density's bandwidth. */
export type Bandwidth = number | readonly [number, number] | "scott";

/** A kernel density estimate of the marks, drawn as filled bands or lines (hockey_rink's `contour` and `contourf`, mplsoccer's `kdeplot`). */
export interface ContourLayer extends HeatBase {
  kind: "contour";
  /** The kernel's width, in the layer's units (one number, or one for each axis), or `scott` (the default: Scott's rule, each axis's spread times n^(-1/6)). */
  bandwidth?: Bandwidth;
  /** A multiple of the bandwidth: under 1 follows the data more closely, over 1 smooths it. 1 by default. */
  smooth?: number;
  /** The grid the density is computed on, nodes across and down. About 100 across by default. */
  grid?: readonly [number, number];
  /** How many contour levels (6 by default), or the levels themselves. */
  levels?: number | readonly number[];
  /** What the levels are: shares of the peak density (`peak`, the default; the lowest is `threshold`) or the shares of the data they enclose (`mass`, so that 0.5 is the smallest region holding half of it). */
  by?: "peak" | "mass";
  /** The lowest level as a share of the peak. 0.1 by default. */
  threshold?: number;
  /** Fill the bands (the default) or draw lines only. */
  filled?: boolean;
  /** Weight each mark by its `value`. */
  weighted?: boolean;
  /** Estimate only over part of the surface, in the layer's coordinates. The whole surface by default. */
  extent?: { x?: readonly [number, number]; y?: readonly [number, number] };
}

/** A colour bar on its own: for another layer (`for`, the `id` of an earlier or later heat layer) or with a ramp and a domain of its own. */
export interface LegendLayer extends Omit<LayerBase, "from" | "attacking" | "surfaceSize" | "anchors" | "limits"> {
  kind: "legend";
  for?: string;
  ramp?: HeatRamp;
  domain?: readonly [number, number];
  center?: number;
  steps?: number;
  position?: HeatLegend["position"];
  ticks?: number;
  /** The opacity of the legend, 0 to 1. */
  opacity?: number;
  /** Size and place the legend against this part of the surface, as `HeatLegend.region` does. */
  region?: Box;
}
