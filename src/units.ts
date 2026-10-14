// Units of length. Every dimension in this package is kept in feet (geometry.ts), the unit a drawing is made in; this file says
// which unit each surface's rulebook states its figures in, and converts a length, a point or a whole table of dimensions to
// any unit. Nothing here draws and nothing depends on another file but the sport names.
import type { Sport } from "./types.ts";

/** A unit of length: feet, inches, yards, metres, centimetres or millimetres. */
export type Unit = "ft" | "in" | "yd" | "m" | "cm" | "mm";

/** The units, from the largest used for a field to the smallest. */
export const UNITS: readonly Unit[] = ["yd", "m", "ft", "in", "cm", "mm"];

/** How many feet are in one of each unit (the international foot is exactly 0.3048 metres). */
export const FEET_PER: Readonly<Record<Unit, number>> = Object.freeze({
  ft: 1,
  in: 1 / 12,
  yd: 3,
  m: 1 / 0.3048,
  cm: 1 / 30.48,
  mm: 1 / 304.8,
});

/**
 * The unit each surface's rulebook states its dimensions in: the NFL's and the CFL's fields in yards (and the IFAF's, which
 * follows them), the NHL's rink, the NBA's court and the baseball field in feet, a soccer pitch in metres (the Laws'), a tennis court and a pickleball court in feet (the ITF's and USA Pickleball's), a volleyball court, a badminton court and a table in metres (FIVB's, BWF's and ITTF's), a curling sheet in metres (World Curling's rules give metres with feet beside them; Curling Canada's give feet first, and its league `curling-canada` has feet), a rugby field, an Australian football ground, a Gaelic field, a hockey pitch and a handball court in metres (the rulebooks') and a cricket ground in yards (the Laws' and the ICC's; the NLL's box floor and the PLL's and the NCAA men's fields are in the leagues' own feet and yards). A Japanese park's fence is measured in
 * metres and converted once: see `parkUnit`.
 */
export const SURFACE_UNITS: Readonly<Record<Sport, Unit>> = Object.freeze({
  nfl: "yd",
  cfl: "yd",
  ifaf: "yd",
  nhl: "ft",
  nba: "ft",
  mlb: "ft",
  soccer: "m",
  curling: "m",
  tennis: "ft",
  volleyball: "m",
  badminton: "m",
  pickleball: "ft",
  tabletennis: "m",
  lacrosse: "m",
  rugby: "m",
  afl: "m",
  gaelic: "m",
  cricket: "yd",
  fieldhockey: "m",
  handball: "m",
  athletics: "m",
});

/** True when `unit` is one of the six. */
export const isUnit = (unit: unknown): unit is Unit => typeof unit === "string" && Object.prototype.hasOwnProperty.call(FEET_PER, unit);

function factor(unit: Unit): number {
  if (!isUnit(unit)) throw new RangeError(`Unknown unit "${String(unit)}": use one of ${UNITS.join(", ")}`);
  return FEET_PER[unit];
}

/**
 * A length in another unit.
 * @example
 * ```ts
 * import { convertLength } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
 * console.log(convertLength(100, "yd", "ft"), convertLength(200, "ft", "m").toFixed(2));
 * // 300 60.96
 * ```
 */
export function convertLength(value: number, from: Unit, to: Unit): number {
  if (from === to) {
    factor(from);
    return value;
  }
  return (value * factor(from)) / factor(to);
}

/** A point or a vector: `[x, y]`. */
export type Point = readonly [x: number, y: number];

/** A point in another unit. */
export function convertPoint(point: Point, from: Unit, to: Unit): [number, number] {
  return [convertLength(point[0], from, to), convertLength(point[1], from, to)];
}

/** A table of dimensions with every number turned into another unit, keeping its shape. */
export type Scaled<T> = T extends number ? number : T extends string | boolean | undefined | null ? T : T extends readonly (infer U)[] ? Scaled<U>[] : { -readonly [K in keyof T]: Scaled<T[K]> };

/**
 * Every length in a table of dimensions (`NHL`, `MLB`, a `FootballSpec`, nested objects and lists of numbers), in another
 * unit. Text and flags are kept as they are. The table is not changed.
 * @example
 * ```ts
 * import { NHL, lengthsIn } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
 * const rink = lengthsIn(NHL, "m");
 * console.log(rink.length.toFixed(2), rink.width.toFixed(3));
 * // 60.96 25.908
 * ```
 */
export function lengthsIn<T>(table: T, to: Unit, from: Unit = "ft"): Scaled<T> {
  const scale = (value: unknown): unknown => {
    if (typeof value === "number") return convertLength(value, from, to);
    if (Array.isArray(value)) return value.map(scale);
    if (typeof value === "object" && value !== null) return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, scale(inner)]));
    return value;
  };
  factor(to);
  factor(from);
  return scale(table) as Scaled<T>;
}
