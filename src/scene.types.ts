import type { ScoreOptions, SurfaceOptions } from "./types.ts";

// The scene: a drawing as plain data. Every shape of the SVG, in the order it is painted, with its colours, widths and fonts worked out for light or dark
// (the stylesheet, the custom properties and the inheritance already applied), its transform, its clip and its class. The canvas, d3, Observable Plot,
// GeoJSON and PNG renderers all read it, so none of them draws anything of its own.

/** An affine transform as the six numbers of an SVG `matrix(a b c d e f)`: x' = a x + c y + e, y' = b x + d y + f. */
export type Matrix = readonly [number, number, number, number, number, number];

/** A path segment in absolute coordinates. An arc has been turned into cubic curves, so a renderer needs only these five. */
export type PathCommand = readonly ["M", number, number] | readonly ["L", number, number] | readonly ["C", number, number, number, number, number, number] | readonly ["Q", number, number, number, number] | readonly ["Z"];

/** A colour in CSS (`#3f8f55`, `rgba(255,255,255,.92)`, a name), `none`, or a reference to a gradient or a pattern of the scene. */
export type Paint = string | { readonly gradient: string } | { readonly pattern: string };

/** What a shape is painted with. Every field is a number, a colour or a keyword: nothing is left to a stylesheet. */
export interface SceneStyle {
  fill: Paint;
  stroke: Paint;
  strokeWidth: number;
  /** The shape's own opacity multiplied by those of the groups it is in (so overlapping parts of one group are not blended as a group would be). */
  opacity: number;
  fillOpacity: number;
  strokeOpacity: number;
  lineJoin: "miter" | "round" | "bevel";
  lineCap: "butt" | "round" | "square";
  /** The dash lengths, or none for a solid line. */
  dash?: readonly number[];
  fillRule: "nonzero" | "evenodd";
  /** `stroke` when the outline is painted under the fill (a halo round a label). */
  paintOrder?: "stroke";
  /** A CSS filter such as `grayscale(.35) brightness(.92)`, when the stylesheet gives one. */
  filter?: string;
}

/** What every shape has. */
export interface SceneBase {
  /** The element's class, as written. */
  class: string;
  /** The element's id, when it has one. */
  id?: string;
  /** The `data-*` attributes of the element and the groups it is in, without the `data-` (the nearest wins). */
  data?: Readonly<Record<string, string>>;
  /** The element's `<title>`, a tooltip. */
  label?: string;
  /** The drawing's frame to the shape's: everything above it, and its own `transform`, multiplied. */
  matrix: Matrix;
  /** The clips the shape is cut by, outermost first: indexes into `Scene.clips`. */
  clips: readonly number[];
  /** True for what is drawn on the surface itself (its markings, the teams' paint, the data), false for what lies beside it (the compact strip). Only such a shape is in the surface's frame, once `Scene.turn` is undone. */
  surface?: true;
  style: SceneStyle;
}

/** A rectangle, with rounded corners when `rx` is more than 0. */
export interface SceneRect extends SceneBase {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}
export interface SceneCircle extends SceneBase {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
}
export interface SceneEllipse extends SceneBase {
  kind: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}
export interface SceneLine extends SceneBase {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
/** A closed (`polygon`) or open (`polyline`) run of points. */
export interface ScenePoly extends SceneBase {
  kind: "polygon" | "polyline";
  points: readonly (readonly [number, number])[];
}
/** A path: `d` as written, and the same as absolute segments (lines, curves, arcs as curves). */
export interface ScenePath extends SceneBase {
  kind: "path";
  d: string;
  commands: readonly PathCommand[];
}
export interface SceneText extends SceneBase {
  kind: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  anchor: "start" | "middle" | "end";
  letterSpacing: number;
}
export interface SceneImage extends SceneBase {
  kind: "image";
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
  preserveAspectRatio?: string;
}

/** A shape that is outlined and filled: everything but text and images. */
export type SceneShape = SceneRect | SceneCircle | SceneEllipse | SceneLine | ScenePoly | ScenePath;
export type SceneItem = SceneShape | SceneText | SceneImage;

/** A region shapes are cut to: the shapes of a `<clipPath>`, in the frame of the group that was clipped. */
export interface SceneClip {
  id: string;
  /** The frame of the group the clip was set on, to the drawing's. */
  matrix: Matrix;
  shapes: readonly SceneShape[];
}

export interface SceneGradient {
  id: string;
  /** In the frame of the shape painted with it. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: readonly { offset: number; color: string; opacity: number }[];
}

/** A tile of shapes, repeated over `width` by `height` in the frame of the shape painted with it. */
export interface ScenePattern {
  id: string;
  width: number;
  height: number;
  shapes: readonly SceneShape[];
}

/** A drawing as data. */
export interface Scene {
  /** The theme the colours were worked out for. */
  theme: "light" | "dark";
  /** The sport the drawing is of, when it says. */
  sport?: string;
  /** The drawing's id: the prefix of the ids a renderer writes, so two scenes on one page do not share one. */
  id: string;
  title: string;
  description: string;
  /** `portrait` when the surface lies tall: `turn` is then the quarter turn that laid it down, in the frame of `viewBox`. */
  orientation: "landscape" | "portrait";
  turn?: Matrix;
  /** The frame of the drawing (feet; x along the surface from its left end, y across it from the top; a portrait drawing is already turned). */
  viewBox: { x: number; y: number; w: number; h: number };
  items: readonly SceneItem[];
  clips: readonly SceneClip[];
  gradients: readonly SceneGradient[];
  patterns: readonly ScenePattern[];
}

/** A scene's source: the options of `drawKyogijo`, an SVG the package wrote, or a scene. */
export type SceneSource = SurfaceOptions | ScoreOptions | string | Scene;

/** What a scene is made with. */
export interface SceneOptions {
  /** The theme to work the colours out for. Without one, the drawing's own `data-theme`, else light. */
  theme?: "light" | "dark";
  /** More rules, read after the drawing's own: a page's stylesheet for the classes you add. */
  css?: string;
}
