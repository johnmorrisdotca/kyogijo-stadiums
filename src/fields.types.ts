// What a field sport's surface is, as plain data: the shapes of its markings in feet, in the frame of a drawing lying wide (x along the surface from the left
// end, y across it from the top, both in feet), and the places the teams, the score, the ranges and the landmarks go. Kept apart from the drawing so that the
// outline, the description, the tests and the drawing agree: a test reads a figure from the plan, not from the markup. Nothing here draws.
import type { Box, FieldSport } from "./types.ts";
import type { Mark, PlateSpot, SurfaceRanges, Zone } from "./surfaces/surface.ts";

/** A dashed line's dash and gap, in feet. */
export type Dash = readonly [on: number, off: number];

/** What every shape has: the name a test finds it by, and the feature a caller can colour it by (`featureColors`). */
interface Named {
  id: string;
  feature: string;
}

/** A shape drawn with the line's paint. A width missing is the drawing's ordinary line. */
interface Stroked extends Named {
  w?: number;
  dash?: Dash;
  /** The least this shape is drawn at, in feet, when the drawing is not at true widths: the plan's `drawnLine` when missing. */
  least?: number;
  /** The class it is painted with: the ordinary line (`ky-line`, white) unless it is a red line (`ky-red`), or one of athletics' coloured marks (yellow, blue, green, black or red). */
  cls?: "ky-line" | "ky-red" | AthleticsMark | SkatingMark | BudoMark;
}

/** The coloured marks of an athletics track: the yellow of the 4 x 100 m's takeover zones, the blue of the 4 x 400 m's and the 110 m hurdles (red on a blue track), the green of the 400 m hurdles and the breakline, black marks and red ones. */
/** The fills of an athletics track's coloured marks (a bar of yellow, blue, green, black or red). */
export type AthleticsFill = "ky-ath-y-fill" | "ky-ath-b-fill" | "ky-ath-g-fill" | "ky-ath-k-fill" | "ky-ath-r-fill";

export type AthleticsMark = "ky-ath-y" | "ky-ath-b" | "ky-ath-g" | "ky-ath-k" | "ky-ath-r" | "ky-ath-s";

/** The coloured marks of a skating rink: the blue lines that demarcate the lanes, the red starting, finishing and coaches' lines, black lines, the dotted blocks of a curve. */
export type SkatingMark = "ky-ska-b" | "ky-ska-r" | "ky-ska-k" | "ky-ska-blocks";

/** The coloured marks of a budō surface: the white line, the blue, white and red tape, the seam between mats. */
/** The fills of a budō surface's tape: blue, white, red and ink. */
export type BudoFill = "ky-bud-blue-fill" | "ky-bud-white-fill" | "ky-bud-red-fill" | "ky-bud-ink-fill";

export type BudoMark = "ky-bud-line" | "ky-bud-blue" | "ky-bud-white" | "ky-bud-red" | "ky-bud-seam" | "ky-bud-ink";

/** A line from one point to another. */
export interface LineShape extends Stroked {
  kind: "line";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** An arc of a circle: the angles in degrees from the point to the right, growing clockwise as the eye sees it (down is 90), drawn from `a0` to `a1`. */
export interface ArcShape extends Stroked {
  kind: "arc";
  cx: number;
  cy: number;
  r: number;
  a0: number;
  a1: number;
}

/** A ring: a circle or an ellipse as a line. */
export interface RingShape extends Stroked {
  kind: "ring";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** The outline of a rectangle as a line. */
export interface BoxShape extends Stroked {
  kind: "box";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A straight-sided shape as a line, closed or open: a list of points. */
export interface PolyShape extends Stroked {
  kind: "poly";
  points: readonly (readonly [number, number])[];
  closed?: boolean;
}

/** A small filled mark in the line's colour: a spot, or a post seen from above. */
export interface DotShape extends Named {
  kind: "dot";
  cx: number;
  cy: number;
  r: number;
  /** The paint: the line's (`line`, the default), or the post's. */
  paint?: "line" | "post" | "block" | "cone";
}

/** A rectangle filled in the line's colour: a short thick mark. */
export interface BarShape extends Named {
  kind: "bar";
  /** The class it is filled with, when it is not the line's colour. */
  cls?: "ky-fill-line" | AthleticsFill | BudoFill;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A line drawn along a path of your own (`d`, in feet): a curve a line, an arc and a ring cannot make, such as a dashed line that runs on through a corner. */
export interface PathShape extends Stroked {
  kind: "path";
  d: string;
}

/** Every shape that is a marking. */
export type Shape = LineShape | ArcShape | RingShape | BoxShape | PolyShape | DotShape | BarShape | PathShape;

/** The areas of an athletics stadium: the track, the grass, the sand of a pit, the mat of a jump, the water of a pit, the concrete of a circle and a runway's cover. */
/** The areas of a skating rink: the ice, the floor of the infield, the warm-up lane, the padding and the furniture. */
export type SkatingArea = "ky-ska-ice" | "ky-ska-floor" | "ky-ska-warm" | "ky-ska-pad" | "ky-ska-desk" | "ky-ska-kiss";

/** The areas of a budō surface: the mats in three tones, the heri of a mat, the floor, the walls, the platform and the furniture, the clay and the sand and the straw of a dohyō, the azuchi and the yamichi. */
export type BudoArea = "ky-bud-t1" | "ky-bud-t2" | "ky-bud-t3" | "ky-bud-heri" | "ky-bud-floor" | "ky-bud-wall" | "ky-bud-window" | "ky-bud-door" | "ky-bud-platform" | "ky-bud-free" | "ky-bud-desk" | "ky-bud-clay" | "ky-bud-sand" | "ky-bud-tawara" | "ky-bud-azuchi" | "ky-bud-roof" | "ky-bud-yamichi" | "ky-bud-shrine" | "ky-bud-dais" | "ky-bud-banner" | "ky-bud-lane" | "ky-bud-mato" | "ky-bud-tassel-e" | "ky-bud-tassel-s" | "ky-bud-tassel-w" | "ky-bud-tassel-n" | "ky-bud-seat";

export type AthleticsArea = "ky-ath-track" | "ky-ath-grass" | "ky-ath-sand" | "ky-ath-mat" | "ky-ath-water" | "ky-ath-concrete" | "ky-ath-pad" | "ky-ath-board" | "ky-ath-bank";

/** A painted area, under the lines: a rectangle or an ellipse filled with a class of the stylesheet (`ky-area`, the tint of a goal area, or `ky-zone`). */
export interface Area extends Named {
  cls: "ky-area" | "ky-zone" | "ky-dirt" | "ky-key" | "ky-boards" | AthleticsArea | SkatingArea | BudoArea;
  /** Fill the path's insides by the even-odd rule: a ring (the track between its kerb and its outer edge). */
  evenodd?: boolean;
  /** A rectangle `[x0, y0, x1, y1]`, an ellipse's centre and radii, a path of your own, or a frame: the ring between a rounded rectangle and the one `thick` outside it (boards). */
  rect?: readonly [x0: number, y0: number, x1: number, y1: number];
  ellipse?: readonly [cx: number, cy: number, rx: number, ry: number];
  d?: string;
  frame?: { x0: number; y0: number; x1: number; y1: number; radius: number; thick: number };
}

/** One goal: where the middle of its mouth stands on the goal line, how wide it is, how deep, and which way it opens' back is (`out`: -1 behind a left goal line). */
export interface GoalPlan {
  end: "left" | "right";
  x: number;
  y: number;
  width: number;
  depth: number;
  out: 1 | -1;
}

/**
 * The shape of the playing surface itself: a rectangle (its corners rounded, as a floor's are), an ellipse (a cricket ground), or an oval cut at each end by a straight line, as an Australian football ground is:
 * the ellipse of semi-axes `a` along the ground and half the width across, cut where it is `half` either side of the middle.
 */
export type Outline = { kind: "rect"; radius?: number } | { kind: "ellipse" } | { kind: "oval"; a: number; half: number };

/** What a builder of a sport knows of its surface. */
export interface FieldPlan {
  sport: FieldSport;
  /** The id of the league (rulebook) it follows. */
  league: string;
  /** The length and the width of the playing surface in feet, as the box the drawing is laid out in (a rugby field's includes the in-goal areas). */
  length: number;
  width: number;
  outline: Outline;
  /** The ground round the surface by default, in feet. */
  margin: number;
  /** The width the ordinary line is painted at by the rules, in feet, and the width it is drawn at unless `exactLines` says otherwise. */
  lineWidth: number;
  drawnLine: number;
  /** Mown stripes: how wide a band is, in feet, or 0 for a surface that is not mown (indoors). */
  band: number;
  areas: readonly Area[];
  shapes: readonly Shape[];
  goals: readonly GoalPlan[];
  /** The places for the names, the score's plate, and the end areas painted in a team's colour when there is a score. */
  left: Zone;
  right: Zone;
  plate: PlateSpot;
  /** The areas at each end to paint in the team's colour in a score, and the names go on them; `endFeature` names them for `featureColors` (`in-goal`: `in-goal-left` and `in-goal-right`). */
  ends?: { left: Box; right: Box };
  endFeature?: string;
  /** What the surface is called as a feature: `turf` (grass) unless it is a floor. */
  surfaceFeature?: string;
  ranges: SurfaceRanges;
  marks: readonly Mark[];
}
