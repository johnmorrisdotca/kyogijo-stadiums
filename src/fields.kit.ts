// The small functions the field sports' plans are made of: a shape in one call, a size held to the range a rulebook allows, and the places of the names and the score.
// Nothing here draws.
import type { ArcShape, BarShape, BoxShape, Dash, DotShape, LineShape, Outline, PathShape, PolyShape, RingShape } from "./fields.types.ts";
import { num } from "./format.ts";
import type { Span } from "./leagues/fields.ts";
import { edges, type PlateSpot, type Zone } from "./surfaces/surface.ts";
import type { Box } from "./types.ts";
import { FEET_PER, type Unit } from "./units.ts";

interface Style {
  w?: number;
  dash?: Dash;
  /** The least this shape is drawn at, in feet, when the drawing is not at the true widths (a crease on a pitch has to stay thin beside a ground). */
  least?: number;
  cls?: "ky-line" | "ky-red";
}

/** A line from one point to another. */
export const line = (id: string, feature: string, x0: number, y0: number, x1: number, y1: number, style: Style = {}): LineShape => ({ kind: "line", id, feature, x0, y0, x1, y1, ...style });

/** The outline of a rectangle from its corners. */
export const box = (id: string, feature: string, x0: number, y0: number, x1: number, y1: number, style: Style = {}): BoxShape => ({ kind: "box", id, feature, x0, y0, x1, y1, ...style });

/** A circle or an ellipse as a line. */
export const ring = (id: string, feature: string, cx: number, cy: number, rx: number, ry: number = rx, style: Style = {}): RingShape => ({ kind: "ring", id, feature, cx, cy, rx, ry, ...style });

/** An arc of a circle, the angles in degrees from the right, growing clockwise as the eye sees it. */
export const arc = (id: string, feature: string, cx: number, cy: number, r: number, a0: number, a1: number, style: Style = {}): ArcShape => ({ kind: "arc", id, feature, cx, cy, r, a0, a1, ...style });

/** A straight-sided line through points. */
export const poly = (id: string, feature: string, points: readonly (readonly [number, number])[], style: Style & { closed?: boolean } = {}): PolyShape => ({ kind: "poly", id, feature, points, ...style });

/** A line along a path of your own. */
export const path = (id: string, feature: string, d: string, style: Style = {}): PathShape => ({ kind: "path", id, feature, d, ...style });

/** A small filled mark. */
export const dot = (id: string, feature: string, cx: number, cy: number, r: number, paint: DotShape["paint"] = "line"): DotShape => ({ kind: "dot", id, feature, cx, cy, r, paint });

/** A filled rectangle in the line's colour. */
export const bar = (id: string, feature: string, x0: number, y0: number, x1: number, y1: number): BarShape => ({ kind: "bar", id, feature, x0, y0, x1, y1 });

/** Dashes along a line from `from` to `to` (a line along x, at height `y`), each `on` long, starting with a dash at `from`, the pattern repeating every `on + off`. */
export function dashesAlongX(id: string, feature: string, y: number, from: number, to: number, on: number, off: number, style: Style = {}): LineShape[] {
  const out: LineShape[] = [];
  for (let x = from; x < to - 1e-6; x += on + off) out.push(line(id, feature, x, y, Math.min(x + on, to), y, style));
  return out;
}

/** Dashes along a line from `from` to `to` (a line along y, at `x`), each `on` long, starting with a dash at `from`, the pattern repeating every `on + off`. */
export function dashesAlongY(id: string, feature: string, x: number, from: number, to: number, on: number, off: number, style: Style = {}): LineShape[] {
  const out: LineShape[] = [];
  for (let y = from; y < to - 1e-6; y += on + off) out.push(line(id, feature, x, y, x, Math.min(y + on, to), style));
  return out;
}

/** The path of a rounded rectangle from its corners. */
export function roundedD(x0: number, y0: number, x1: number, y1: number, r: number): string {
  const k = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  if (k <= 0) return `M${num(x0)} ${num(y0)}H${num(x1)}V${num(y1)}H${num(x0)}Z`;
  return `M${num(x0 + k)} ${num(y0)}H${num(x1 - k)}A${num(k)} ${num(k)} 0 0 1 ${num(x1)} ${num(y0 + k)}V${num(y1 - k)}A${num(k)} ${num(k)} 0 0 1 ${num(x1 - k)} ${num(y1)}H${num(x0 + k)}A${num(k)} ${num(k)} 0 0 1 ${num(x0)} ${num(y1 - k)}V${num(y0 + k)}A${num(k)} ${num(k)} 0 0 1 ${num(x0 + k)} ${num(y0)}Z`;
}

/** The path of the playing surface's edge, in a box of `length` by `width` feet. */
export function outlineD(length: number, width: number, outline: Outline): string {
  const cx = length / 2;
  const cy = width / 2;
  if (outline.kind === "ellipse") return `M${num(0)} ${num(cy)}A${num(cx)} ${num(cy)} 0 1 1 ${num(length)} ${num(cy)}A${num(cx)} ${num(cy)} 0 1 1 0 ${num(cy)}Z`;
  if (outline.kind === "oval") return `M0 ${num(cy - outline.half)}A${num(outline.a)} ${num(cy)} 0 0 1 ${num(length)} ${num(cy - outline.half)}V${num(cy + outline.half)}A${num(outline.a)} ${num(cy)} 0 0 1 0 ${num(cy + outline.half)}Z`;
  return roundedD(0, 0, length, width, outline.radius ?? 0);
}

/** True when a point is on the playing surface or on its edge. */
export function inOutline(length: number, width: number, outline: Outline, x: number, y: number): boolean {
  if (x < -1e-9 || x > length + 1e-9 || y < -1e-9 || y > width + 1e-9) return false;
  const cx = length / 2;
  const cy = width / 2;
  if (outline.kind === "ellipse") return ((x - cx) / cx) ** 2 + ((y - cy) / cy) ** 2 <= 1 + 1e-9;
  if (outline.kind === "oval") return ((x - cx) / outline.a) ** 2 + ((y - cy) / cy) ** 2 <= 1 + 1e-9;
  const r = outline.radius ?? 0;
  if (r <= 0) return true;
  const qx = x < r ? r : x > length - r ? length - r : x;
  const qy = y < r ? r : y > width - r ? width - r : y;
  return (x - qx) ** 2 + (y - qy) ** 2 <= r * r + 1e-9;
}

/** A metre, in feet. */
export const METRE = 1 / 0.3048;
/** A yard, in feet. */
export const YARD = 3;
/** An inch, in feet. */
export const INCH = 1 / 12;

/** A length in feet to the unit asked for (for a test, and for a sentence). */
export const inUnit = (feet: number, unit: Unit): number => feet / FEET_PER[unit];

/**
 * A size asked for in `askedUnit`, held to the range the rules allow. The range is in feet, as a plan's figures are; the answer is in feet, and without a size asked for it is the one drawn.
 * @throws RangeError with the range in `reportUnit` (the league's own) when the size is outside it.
 */
export function sizeIn(range: Span, asked: number | undefined, askedUnit: Unit, reportUnit: Unit, label: string): number {
  if (asked === undefined) return range.drawn;
  if (typeof asked !== "number" || !Number.isFinite(asked) || asked <= 0) throw new RangeError(`${label} must be a number above zero, in ${askedUnit}`);
  const feet = asked * FEET_PER[askedUnit];
  if (feet < range.min - 1e-6 || feet > range.max + 1e-6) {
    const round = (value: number): string => String(Math.round(value * 100) / 100);
    const least = round(range.min / FEET_PER[reportUnit]);
    const most = Number.isFinite(range.max) ? round(range.max / FEET_PER[reportUnit]) : undefined;
    throw new RangeError(`${label} of ${round(asked)} ${askedUnit} is outside what the rules allow: ${most === undefined ? `more than ${least}` : `${least} to ${most}`} ${reportUnit}`);
  }
  return feet;
}

/** The zones that hold the teams' names at each end, lying along the end (the words run up the left end and down the right, as a football end zone's do). */
export function endZones(length: number, width: number, depth: number, across: number): { left: Zone; right: Zone } {
  const long = across;
  const h = Math.min(depth * 0.86, (long * 0.94) / 2.7);
  return {
    left: { cx: depth / 2, cy: width / 2, w: long * 0.94, h, rot: -90 },
    right: { cx: length - depth / 2, cy: width / 2, w: long * 0.94, h, rot: 90 },
  };
}

/** The place of the score's panel: the middle of the surface, of a size that follows the surface's. */
export function middlePlate(length: number, width: number, w: number, h: number): PlateSpot {
  return { cx: length / 2, cy: width / 2, w: Math.min(w, length * 0.5), h: Math.min(h, width * 0.55) };
}

/** A box from two corners. */
export const at = (x0: number, y0: number, x1: number, y1: number): Box => edges(x0, y0, x1, y1);
