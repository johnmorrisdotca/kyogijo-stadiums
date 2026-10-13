// What the field sports' tests share: a plan's figures read back in metres (the rulebooks' unit) and a way to find the shapes of a plan by name.
import { fieldPlan } from "./fields.ts";
import type { FieldPlan, Shape } from "./fields.types.ts";
import type { SurfaceOptions } from "./types.ts";

const M = 0.3048;
/** A length in feet as metres. */
export const m = (feet: number): number => feet * M;
/** A length in feet as yards. */
export const yd = (feet: number): number => feet / 3;
/** A length in feet as inches. */
export const inch = (feet: number): number => feet * 12;

/** The plan of a drawing of a sport, a league, and the options. */
export const planOf = (sport: SurfaceOptions["sport"], league?: string, more: Partial<SurfaceOptions> = {}): FieldPlan => fieldPlan({ sport, ...(league === undefined ? {} : { league }), ...more });

/** The shapes of a plan with a name. */
export const named = (plan: FieldPlan, id: string): Shape[] => plan.shapes.filter((shape) => shape.id === id);

/** The lines of a plan with a name, as `[x0, y0, x1, y1]` in metres. */
export function linesIn(plan: FieldPlan, id: string): [number, number, number, number][] {
  return named(plan, id).flatMap((shape) => (shape.kind === "line" ? [[m(shape.x0), m(shape.y0), m(shape.x1), m(shape.y1)] as [number, number, number, number]] : []));
}

/** The distinct places across the field (x of a vertical line, y of a horizontal one) of the lines of a plan with a name, in metres, sorted. */
export function placesOf(plan: FieldPlan, id: string, across: "x" | "y"): number[] {
  const out = linesIn(plan, id).map(([x0, y0, x1, y1]) => (across === "x" ? (x0 === x1 ? x0 : NaN) : y0 === y1 ? y0 : NaN)).filter((value) => !Number.isNaN(value));
  return [...new Set(out.map((value) => Math.round(value * 1000) / 1000))].sort((a, b) => a - b);
}

/** The dots of a plan with a name, as `[x, y]` in metres. */
export const dotsIn = (plan: FieldPlan, id: string): [number, number][] => named(plan, id).flatMap((shape) => (shape.kind === "dot" ? [[m(shape.cx), m(shape.cy)] as [number, number]] : []));
