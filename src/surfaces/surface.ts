import { el, num } from "../format.ts";
import type { Detail, Sport } from "../types.ts";

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
  };
  /** True in a score drawing, so that panels are made room for. */
  score: boolean;
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
