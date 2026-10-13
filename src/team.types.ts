// The types of the team layers: pass networks, formations, Voronoi cells, Delaunay triangulations, convex hulls, flow fields and sonars. Plain data
// (numbers and text), so that the same options always draw the same drawing and a layer can be saved as JSON.
import type { ZoneSetId } from "./heat.zones.ts";
import type { LayerBase, LayerTeam, MarkDatum } from "./layers.types.ts";

/** A player at a place. `team` (`home`, `away` or another) is what colours the player's cell, triangles and hull. */
export interface PlayerDatum extends MarkDatum {
  x: number | null;
  y: number | null;
  /** The player's id, name and shirt number, for a label and for the table. */
  id?: string | number;
  name?: string;
  number?: string | number;
}

/** Players, with how their shape is drawn. */
interface PlayersBase extends LayerBase {
  data: readonly PlayerDatum[];
  /** The opacity of the whole layer, 0 to 1. */
  opacity?: number;
  /** Mark each player with a dot. On by default. */
  points?: boolean;
}

/** The part of the surface nearest each player, coloured by team: who controls the space (the Voronoi diagram of the players, clipped to the surface). */
export interface VoronoiLayer extends PlayersBase {
  kind: "voronoi";
}

/** The Delaunay triangulation of the players: triangles whose circle holds no other player, a mesh of near neighbours. */
export interface DelaunayLayer extends PlayersBase {
  kind: "delaunay";
  /** One triangulation for each team (`team`, the default) or one for all the players. */
  by?: "team" | "all";
  /** Fill the triangles, not only draw their edges. */
  triangles?: boolean;
}

/** The convex hull of the players: the smallest convex shape that holds them, for each team. */
export interface HullLayer extends PlayersBase {
  kind: "hull";
  /** One hull for each team (`team`, the default) or one for all the players. */
  by?: "team" | "all";
}

/** A pass: who passed to whom, from where to where. The places are the passer's and, if given, the receiver's. */
export interface PassDatum extends MarkDatum {
  /** The id of the passer and of the receiver (a number or a name; the same id is the same player). */
  from: string | number;
  to: string | number;
  /** Where the pass was made from, and where it was received. */
  x?: number | null;
  y?: number | null;
  x2?: number | null;
  y2?: number | null;
  /** The names for the labels and the table, by id. The last one given for an id is used. */
  fromName?: string;
  toName?: string;
  fromNumber?: string | number;
  toNumber?: string | number;
}

/** A player of a pass network whose place is given and not worked out from the passes. */
export interface NetworkNode {
  id: string | number;
  x: number;
  y: number;
  team?: LayerTeam;
  name?: string;
  number?: string | number;
}

/** A pass network: a node for each player at the average place of the passes he made and received, sized by touches, and a link for each pair sized by passes. */
export interface NetworkLayer extends LayerBase {
  kind: "network";
  data: readonly PassDatum[];
  /** Places of your own for some players, over the averages. */
  nodes?: readonly NetworkNode[];
  /** Leave out links of fewer passes than this. 1 by default. */
  minPasses?: number;
  /** Draw a link for each direction, bowed apart and with a head, and not one for the pair. */
  directed?: boolean;
  /** The width of a node (a share of the surface's longer side by default), from the fewest touches to the most, in the layer's units. */
  nodeSize?: readonly [number, number];
  /** The width of a link, from the fewest passes to the most, in the layer's units. */
  linkWidth?: readonly [number, number];
  /** The opacity of a link, from the fewest passes to the most. [0.3, 0.9] by default. */
  linkOpacity?: readonly [number, number];
  /** What is written in a node: the shirt `number` (the default when there are any), the `name`, the `id` or `none`. */
  labels?: "number" | "name" | "id" | "none";
  /** The opacity of the whole layer, 0 to 1. */
  opacity?: number;
}

/** A movement: from `(x, y)` to `(x2, y2)`, or the vector `(dx, dy)` from `(x, y)`. */
export interface MoveDatum extends MarkDatum {
  x: number | null;
  y: number | null;
  x2?: number | null;
  y2?: number | null;
  dx?: number | null;
  dy?: number | null;
  /** The mover, for a sonar of each player. */
  id?: string | number;
  name?: string;
  number?: string | number;
}

/** The average direction of the movements in each cell of a grid, as an arrow (a quiver plot). */
export interface FlowLayer extends LayerBase {
  kind: "flow";
  data: readonly MoveDatum[];
  /** The grid: a number of cells across the surface's longer side (square cells, 12 by default), `[across, down]`, or `{ x, y }` as for a heat map. */
  bins?: number | readonly [number, number];
  /** Leave out a cell with fewer movements than this. 2 by default. */
  minCount?: number;
  /** The length of an arrow: `mean` (the default: in proportion to the cell's mean movement, the longest filling most of a cell), or `fixed` (all alike; the opacity then shows how steady the direction is). */
  lengths?: "mean" | "fixed";
  /** The team that colours the arrows (`home`, `away`). The movements' own team when they all share one, else the layer's colour. */
  team?: LayerTeam;
  /** The opacity of the whole layer, 0 to 1. */
  opacity?: number;
}

/** A rose for each group of movements: how many go in each direction, or how long they are on average. */
export interface SonarLayer extends LayerBase {
  kind: "sonar";
  data: readonly MoveDatum[];
  /** What a rose is of: `all` (one rose, at the middle of the movements' starts; the default), `player` (one for each `id`, at the average start of his), `grid` (one for each cell of a grid) or `zone` (one for each zone of `zones`). */
  by?: "all" | "player" | "grid" | "zone";
  /** How many directions a rose is cut into. 12 by default. */
  angles?: number;
  /** A bar's length: the number of movements (`count`, the default) or their mean length (`mean`). */
  statistic?: "count" | "mean";
  /** For `by: "grid"`: the cells, as for a flow layer (6 across by default). */
  bins?: number | readonly [number, number];
  /** For `by: "zone"`: the set of zones, and what a zone set takes as in a zone chart. */
  zones?: ZoneSetId;
  direction?: "left" | "right";
  end?: "left" | "right" | "both";
  los?: number;
  bats?: "L" | "R" | "none";
  /** The radius of the longest bar, in the layer's units. A share of the surface by default. */
  radius?: number;
  /** Leave out a group with fewer movements than this. 1 by default. */
  minCount?: number;
  team?: LayerTeam;
  opacity?: number;
}

/** A named place of a formation, in the numbers of the formation's frame (see `Formation`). */
export interface FormationPosition {
  /** The position's id: `GK`, `LB`, `QB`. Unique within a formation. */
  id: string;
  x: number;
  y: number;
}

/** The sports that have formations. */
export type FormationSport = "soccer" | "nhl" | "nba" | "nfl" | "mlb";

/** A formation: where each position stands. Points in the numbers of a registered frame, for a team that attacks the right end of the surface as it is drawn wide (a football formation: the offence going right, with the ball at midfield). */
export interface Formation {
  id: string;
  sport: FormationSport;
  /** The frame the positions are in: `opta` for soccer, `nhl-api`, `nba-stats`, `nfl-tracking`, `retrosheet`. */
  frame: string;
  name: { en: string; ja: string };
  /** What the formation is, in a sentence: the side of the ball, the strategy. */
  about: { en: string; ja: string };
  positions: readonly FormationPosition[];
}

/** A player to stand on a position. */
export interface FormationPlayer extends MarkDatum {
  /** The id of the position the player stands on. */
  position: string;
  number?: string | number;
  name?: string;
}

/** A formation drawn on the surface: a labelled mark for each position, with the players on them when `data` has some. */
export interface FormationLayer extends LayerBase {
  kind: "formation";
  /** The id of a formation in `FORMATIONS` (`4-4-2`), or a formation of your own. */
  formation: string | Formation;
  /** The team that colours the marks (`home`, `away`). */
  team?: LayerTeam;
  /** Players for some or all of the positions. */
  data?: readonly FormationPlayer[];
  /** What is written in a mark: the `position`'s id (the default without players), the `number` (the default with them), the `name` or `none`. */
  labels?: "position" | "number" | "name" | "none";
  /** Write a player's name under his mark. */
  names?: boolean;
  /** The width of a mark, in the layer's units. A share of the surface's longer side by default. */
  size?: number;
  /** The line of scrimmage of a football formation, as the ball lies in the frame `nfl-tracking` (yards from the back of the left end zone). Midfield by default. */
  los?: number;
  opacity?: number;
}
