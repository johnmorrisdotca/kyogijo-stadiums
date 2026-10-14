import type { Ballpark } from "../ballpark.ts";
import { el, num } from "../format.ts";
import type { Hardwood } from "../hardwood.ts";
import type { Box, Detail, GoalInfo, GoalStyle, Sport, StripePattern } from "../types.ts";

/** Where a team's name and logo go, and how its words lie. */
export interface Zone {
  /** The centre, in the surface's own feet (the landscape frame). */
  cx: number;
  cy: number;
  /** The size of the box the words are set in, as the eye sees it. */
  w: number;
  h: number;
  /** How the words are turned in the landscape frame: 0, or -90 and 90 along a football end zone. */
  rot: number;
  /** The box is a coloured panel (a dugout, a bench strip) rather than paint on the surface. */
  panel?: boolean;
}

/** Where the score goes. */
export interface PlateSpot {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** The parts of a surface a drawing can be cropped to, by name: one box, or one at each end (`left` and `right` as the surface lies wide), in feet in the wide frame. */
export type SurfaceRanges = Readonly<Record<string, Box | { left: Box; right: Box }>>;

/** A surface, ready for the teams and the score to be laid on it. */
export interface Surface {
  sport: Sport;
  /** The viewBox of the drawing as it lies. */
  view: { x: number; y: number; w: number; h: number };
  /** When the surface is turned to lie in portrait: the transform of the group that holds it. */
  turn?: string;
  /** Ground, fills, stripes and the end zones: under the teams' paint. */
  base: string;
  /** Painted lines, marks and fixtures: over the teams' paint. */
  lines: string;
  /** Things the markup refers to (clip paths). */
  defs: string;
  left: Zone;
  right: Zone;
  plate: PlateSpot;
  /** True when the whole drawing is turned a quarter, so that the words must be turned back. */
  turned: boolean;
  /** The teams' places are drawn over the lines (panels that must hide them), not under. */
  bannersOver?: boolean;
  /** The teams' places are painted in the teams' colours, so their names are written in the ink that reads on them (a football end zone), not painted over the grass. The sport's default when missing. */
  onColour?: boolean;
  /** The playing surface itself, without the ground round it, in the wide frame and in feet: where the margin starts, and what the axes and the labels are placed against. */
  box?: { x: number; y: number; w: number; h: number };
  /** The parts to label, when the drawing is asked for them (`landmarks`): where each is, in the wide frame, in feet. */
  marks?: Mark[];
  /** The parts the drawing can be cropped to (`range`), by the names of `RANGES`: the builder knows where its own lines are. */
  ranges?: SurfaceRanges;
  /** When the drawing is cropped to a range: the whole playing surface (`box` is then the part of it that is shown). */
  whole?: { x: number; y: number; w: number; h: number };
  /** When the drawing is cropped to a range: the part of the surface the range shows, with its small cut beyond the lines and the surface's own ground at its edges; the view is this and the room the annotations need. */
  cut?: { x: number; y: number; w: number; h: number };
  /** When the drawing is cropped to a range: the margin the whole surface has (what `box` lacks of the view, at the top), and the ground the cut has beyond a line. */
  ground?: number;
  room?: number;
  /** False when the drawing is cropped to a range too small to hold the score's panel, so that the score is drawn as a strip under the drawing instead. */
  plateFits?: boolean;
  /** For a surface set inside another (a special game): the transform that carries the surface's own frame to the drawing's, which data in the surface's frame (`layers`) is put through. */
  frame?: string;
  /** A surface drawn in parts, one of which is shown again larger beside it (a folded curling sheet): for each copy, the transform that carries the surface's frame to it and the id of the clip that cuts it. The data layers are drawn in each. */
  panels?: { transform: string; clip: string }[];
  /** Markup drawn over the data layers: the labels of a surface's panels. */
  over?: string;
  /** True for a surface whose frame has parts the annotations (axes, direction, landmarks) have no margin to stand in. */
  folded?: boolean;
  /** How wide the surface's ordinary line is drawn, in the units of the `lines` markup, and how many feet one of those units is: what `lineWidth` scales. */
  lineRef?: { width: number; feet: number };
}

/** A part of a surface to label: its anchor on the surface in feet and the margin its label stands in (the top or the bottom as the surface lies wide). */
export interface Mark {
  /** The key of its words in `KYOGIJO_STRINGS[language].landmarks`. */
  id: string;
  x: number;
  y: number;
  side: "top" | "bottom";
}

/** What every builder is given. */
export interface BuildOptions {
  portrait: boolean;
  margin: number | undefined;
  exact: boolean;
  detail: Detail;
  stripes: boolean;
  /** A prefix for ids. */
  id: string;
  /** Park and fence for baseball. */
  fence?: readonly (readonly [number, number])[];
  /** Court words and logo. */
  court?: {
    baselineText?: [string, string];
    centreLogo?: string;
    paintThreePoint?: boolean;
    /** The realistic floor, when asked for (`court.hardwood`), its options read. */
    hardwood?: Hardwood;
    /** Words along the sidelines, `[top, bottom]`, on a hardwood floor. */
    sidelineText?: [string, string];
  };
  /** True in a score drawing, so that panels are made room for. */
  score: boolean;
  /** The names of the features that have a colour of their own, so that their elements carry the class that colour is given to. */
  features?: ReadonlySet<string>;
  /** How the grass is mown, when the options say (a football field and a ballpark have their own default). */
  mow?: StripePattern;
  /** How the goals are drawn, when the options say. */
  goals?: GoalStyle;
  /** A function that draws a goal, in place of the built-in one. */
  goalMarkup?: (goal: GoalInfo) => string;
  /** Collect the landmarks (`Surface.marks`). */
  landmarks?: boolean;
  /** For baseball: what the park's article adds to the plain field (the warning track's width, the walls, the quirks). */
  ballpark?: Ballpark;
}

/**
 * The class of an element that is a named feature of the surface: `cls` and, for each feature name that has a colour of its own, `ky-f-<name>`.
 * Without any, the class is just `cls`, so a drawing that colours no feature is the same text as it was.
 */
export function ft(o: Pick<BuildOptions, "features">, names: string | readonly string[], cls: string): string {
  if (o.features === undefined) return cls;
  let out = cls;
  for (const name of typeof names === "string" ? [names] : names) if (o.features.has(name)) out += ` ky-f-${name}`;
  return out;
}

/** How a word is set by a builder. */
export interface TextSpec {
  size: number;
  anchor?: "start" | "middle" | "end";
  cls?: string;
  /** Turn the text this many degrees in the landscape frame (a football end zone's words, the court's baseline words). */
  rot?: number;
  /** Turn the text upside down in landscape (the far side's yard numbers); ignored in portrait, where text is upright. */
  flip?: boolean;
  /** The weight, when not the stylesheet's. */
  weight?: number;
  /** The spacing between letters, in feet. */
  spacing?: number;
}

/**
 * A word on a surface, upright as the eye sees it: turned back when the surface is turned a quarter. The text is
 * pivoted on the middle of its capitals so that a number does not drift when it turns.
 */
export function textOn(turned: boolean, x: number, y: number, text: string, spec: TextSpec): string {
  const px = x;
  const py = y - spec.size * 0.36;
  const angle = turned ? -90 : (spec.rot ?? 0) + (spec.flip ? 180 : 0);
  return el(
    "text",
    {
      class: spec.cls === undefined ? "ky-text" : `ky-text ${spec.cls}`,
      x,
      y,
      "font-size": spec.size,
      "text-anchor": spec.anchor === "start" || spec.anchor === "end" ? spec.anchor : undefined,
      "font-weight": spec.weight,
      "letter-spacing": spec.spacing,
      transform: angle === 0 ? undefined : `rotate(${num(angle)} ${num(px)} ${num(py)})`,
    },
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  );
}

/** The path of a rectangle with rounded corners. */
export function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const k = Math.min(r, w / 2, h / 2);
  return `M${num(x + k)} ${num(y)}H${num(x + w - k)}A${num(k)} ${num(k)} 0 0 1 ${num(x + w)} ${num(y + k)}V${num(y + h - k)}A${num(k)} ${num(k)} 0 0 1 ${num(x + w - k)} ${num(y + h)}H${num(x + k)}A${num(k)} ${num(k)} 0 0 1 ${num(x)} ${num(y + h - k)}V${num(y + k)}A${num(k)} ${num(k)} 0 0 1 ${num(x + k)} ${num(y)}Z`;
}

/** The transform that lays a landscape frame down as a portrait one: a quarter turn clockwise, the left side to the top. */
export function quarterTurn(view: { x: number; y: number; w: number; h: number }): { turn: string; view: { x: number; y: number; w: number; h: number } } {
  return {
    turn: `matrix(0 1 -1 0 ${num(view.h + view.y)} ${num(-view.x)})`,
    view: { x: 0, y: 0, w: view.h, h: view.w },
  };
}

/** A box from its edges: the left, the top, the right and the bottom. */
export const edges = (x0: number, y0: number, x1: number, y1: number): Box => ({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) });

/** A range that has an end: its box at the left end and at the right, made by a function of the end. */
export const atEnds = (box: (end: "left" | "right") => Box): { left: Box; right: Box } => ({ left: box("left"), right: box("right") });
