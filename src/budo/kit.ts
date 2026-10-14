// The small pieces the budō plans are made of: a filled box, a tape, a desk, a ring, in metres. Nothing here draws SVG.
import type { Area, BarShape, Shape } from "../fields.types.ts";
import { num } from "../format.ts";
import type { MBox } from "./parts.ts";

/** The path of a box. */
export const boxD = (b: MBox): string => `M${num(b.x0)} ${num(b.y0)}H${num(b.x1)}V${num(b.y1)}H${num(b.x0)}Z`;

/** A painted rectangle. */
export const rectArea = (id: string, feature: string, cls: Area["cls"], b: MBox): Area => ({ id, feature, cls, rect: [b.x0, b.y0, b.x1, b.y1] });

/** A painted ellipse. */
export const discArea = (id: string, feature: string, cls: Area["cls"], cx: number, cy: number, rx: number, ry: number = rx): Area => ({ id, feature, cls, ellipse: [cx, cy, rx, ry] });

/** A piece of tape: a filled rectangle in a colour of the budō marks. */
export const tapeBar = (id: string, feature: string, cls: NonNullable<BarShape["cls"]>, b: MBox): Shape => ({ kind: "bar", id, feature, cls, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });

/** The path of a ring (a circle between two radii), filled by the even-odd rule. */
export const annulusD = (cx: number, cy: number, r0: number, r1: number): string => {
  const c = (r: number): string => `M${num(cx - r)} ${num(cy)}A${num(r)} ${num(r)} 0 1 0 ${num(cx + r)} ${num(cy)}A${num(r)} ${num(r)} 0 1 0 ${num(cx - r)} ${num(cy)}Z`;
  return `${c(r1)}${r0 > 0 ? c(r0) : ""}`;
};

/** A value held between two bounds. */
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The number of a size option held to the range a rule allows. @throws TypeError for a value that is not a number, RangeError for one outside the range. */
export function within(value: unknown, lo: number, hi: number, label: string, rule: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${label} is a number of metres`);
  if (value < lo - 1e-9 || value > hi + 1e-9) throw new RangeError(`${label} of ${value} m is outside what ${rule} allows: ${lo} m to ${hi} m`);
  return value;
}
