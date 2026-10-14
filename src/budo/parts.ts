// What a part of a budō plan adds, as shapes and areas in painter's order, in metres, and the small boxes the plans are laid out with. Nothing here draws SVG.
import type { Area, Shape } from "../fields.types.ts";

/** What a part of a plan adds. */
export interface Parts {
  areas: Area[];
  shapes: Shape[];
}

export const emptyParts = (): Parts => ({ areas: [], shapes: [] });

/** Add `more` to `into`. */
export function addParts(into: Parts, more: Parts): void {
  into.areas.push(...more.areas);
  into.shapes.push(...more.shapes);
}

/** A box in metres. */
export interface MBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A named part of the plan to crop to, in metres: one box, or one at each end (`left` and `right` as the surface is drawn wide). */
export type MRange = MBox | { left: MBox; right: MBox };

/** A part of the plan to label (`landmarks`): where it is, in metres, and the side of the drawing its label stands on. */
export interface MMark {
  id: string;
  x: number;
  y: number;
  side: "top" | "bottom";
}

export const grow = (b: MBox, m: number): MBox => ({ x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m });
export const union = (boxes: readonly MBox[]): MBox => ({ x0: Math.min(...boxes.map((b) => b.x0)), y0: Math.min(...boxes.map((b) => b.y0)), x1: Math.max(...boxes.map((b) => b.x1)), y1: Math.max(...boxes.map((b) => b.y1)) });
export const boxOf = (cx: number, cy: number, w: number, h: number): MBox => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 });
export const shifted = (b: MBox, dx: number, dy: number): MBox => ({ x0: b.x0 + dx, y0: b.y0 + dy, x1: b.x1 + dx, y1: b.y1 + dy });
