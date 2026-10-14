// What a part of a skating plan adds, as shapes and areas in painter's order, in metres, and the small functions the parts are made of. Nothing here draws SVG.
import { path, line, poly } from "../fields.kit.ts";
import type { Area, Shape } from "../fields.types.ts";
import { num } from "../format.ts";

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

/** A named part of the plan to crop to, in metres: one box, or one at each end (`left` and `right` as the rink is drawn wide). */
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

/** The path of a stadium: two semicircles of radius `r` joined by straights of length `s`, about the origin, drawn from the top left, clockwise as the eye sees it. */
export const stadiumD = (s: number, r: number): string => `M${num(-s / 2)} ${num(-r)}H${num(s / 2)}A${num(r)} ${num(r)} 0 0 1 ${num(s / 2)} ${num(r)}H${num(-s / 2)}A${num(r)} ${num(r)} 0 0 1 ${num(-s / 2)} ${num(-r)}Z`;

/** A point of a curve of the oval: `side` is the right-hand curve (centre at x = s/2, entered at the bottom) or the left-hand one (centre at x = -s/2, entered at the top); `t` the angle from the entrance. */
export function curvePoint(s: number, side: "right" | "left", r: number, t: number): [number, number] {
  return side === "right" ? [s / 2 + r * Math.sin(t), r * Math.cos(t)] : [-s / 2 - r * Math.sin(t), -r * Math.cos(t)];
}

/** The path of an arc of a curve of the oval from the angle `t0` to `t1`, in the way the skaters go (counter-clockwise as the eye sees it). */
export function curveD(s: number, side: "right" | "left", r: number, t0: number, t1: number): string {
  const [x0, y0] = curvePoint(s, side, r, t0);
  const [x1, y1] = curvePoint(s, side, r, t1);
  return `M${num(x0)} ${num(y0)}A${num(r)} ${num(r)} 0 ${t1 - t0 > Math.PI ? 1 : 0} 0 ${num(x1)} ${num(y1)}`;
}

/**
 * The blocks of a curve as dots: a dashed path with a zero dash and round caps, so that a dot of the line's width stands every `near` metres for the first `nearLength` metres from the entrance and
 * every `far` metres after, the cone at the entrance a dot of its own (Rule 226).
 */
export function blocksOf(id: string, s: number, side: "right" | "left", r: number, near: number, nearLength: number, far: number, width: number): Shape[] {
  const out: Shape[] = [];
  const tNear = Math.min(Math.PI, nearLength / r);
  out.push(path(`${id}-near`, "blocks", curveD(s, side, r, 0, tNear), { w: width, dash: [0, near], cls: "ky-ska-blocks", least: 0.3 }));
  // The far part starts a step after the near one stops, so that no block stands twice.
  const start = tNear + far / r;
  if (start < Math.PI + 1e-9) out.push(path(`${id}-far`, "blocks", curveD(s, side, r, start, Math.PI), { w: width, dash: [0, far], cls: "ky-ska-blocks", least: 0.3 }));
  const [cx, cy] = curvePoint(s, side, r, 0);
  out.push({ kind: "dot", id: `${id}-cone`, feature: "cones", cx, cy, r: width * 1.3, paint: "cone" });
  return out;
}

export { line, poly, path };
