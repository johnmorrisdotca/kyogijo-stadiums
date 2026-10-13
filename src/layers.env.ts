// What every kind of data layer is drawn against: the drawing's id, its unit and outline, the words, and what a layer made. Kept apart
// from layers.ts so that the heat maps, which are written in files of their own, can use it without importing the file that imports them.
import { safeLogo } from "./colour.ts";
import { drawingId, isPortrait, lengthUnit } from "./common.ts";
import { fromSurface, toSurface } from "./frames.ts";
import "./frames.providers.ts";
import type { P } from "./layers.marks.ts";
import type { LayerBase } from "./layers.types.ts";
import { chooseLeague } from "./leagues.ts";
import { outlineOf, type Outline } from "./outline.ts";
import { KYOGIJO_STRINGS, type KyogijoWords } from "./strings.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";
import { FEET_PER, SURFACE_UNITS, isUnit, type Unit } from "./units.ts";

export const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
export const own = (table: object, key: string): boolean => Object.prototype.hasOwnProperty.call(table, key);
export const opacityOf = (value: unknown): number | undefined => (isNum(value) ? clamp01(value) : undefined);

/** What a drawing's layers are drawn against. */
export interface Env {
  o: SurfaceOptions | ScoreOptions;
  id: string;
  turned: boolean;
  unit: Unit;
  outline: Outline;
  /** The width of a mark by default, in feet: a share of the surface's longer side. */
  base: number;
  words: KyogijoWords;
  logos: { home?: string; away?: string };
}

/** What a layer made. */
export interface Made {
  /** The elements of the layer, and its gradients as `defs`. */
  marks: string;
  defs: string;
  /** The attributes of the layer's group beyond the standard ones. */
  style: string;
  /** Attributes for the layer's group. */
  attr: string;
  opacity: number | undefined;
  drawn: number;
  skipped: number;
  outcomes: Map<string, number>;
  teams: Map<string, number>;
  low: number;
  high: number;
  /** For a heat map, a zone chart or a contour chart: the class of the group, the title's noun and the sentences of the description. */
  cls?: string;
  title?: string;
  text?: string;
  /** Styles of the layer that need a rule of their own (the dark set of a colour ramp). */
  css?: string;
  /** Markup that follows the layer's group and is not cut to the surface: a heat layer's legend. */
  after?: string;
}

export const toArray = <T>(value: readonly T[] | undefined, what: string): readonly T[] => {
  if (!Array.isArray(value)) throw new TypeError(`${what} needs data: a list of marks`);
  return value;
};

/** The size a provider's frame is fitted to: the drawn surface's, for a soccer pitch and a league's surface; none for a sport's own fixed one. */
const fittedSize = (env: Env): { length: number; width: number; unit: "ft" } | undefined => (env.o.sport === "soccer" || env.o.sport === "curling" || chooseLeague(env.o).league !== undefined ? { length: env.outline.box.w, width: env.outline.box.h, unit: "ft" as const } : undefined);

export function unitOfLayer(layer: LayerBase, env: Env): Unit {
  if (layer.units === "rulebook") return chooseLeague(env.o).league?.unit ?? SURFACE_UNITS[chooseLeague(env.o).sport] ?? "ft";
  if (layer.units === undefined) return env.unit;
  if (!isUnit(layer.units)) throw new RangeError(`Unknown units "${String(layer.units)}": use one of ft, in, yd, m, cm, mm or rulebook`);
  return layer.units;
}

/** Places in the layer's frame and unit as places in the drawing's frame, in feet: through the layer's frame when it has one, and held to its limits. */
export function place(layer: LayerBase, env: Env, points: readonly P[], unit: Unit): P[] {
  const k = FEET_PER[unit];
  let out: P[];
  if (layer.from === undefined) out = points.map(([x, y]): P => [x * k, y * k]);
  else {
    // A surface of any size has the frame fitted to it unless the layer gives another size: a soccer pitch, and a league's surface (an IIHF rink is not the NHL's).
    const size = layer.surfaceSize ?? fittedSize(env);
    const placed = toSurface(points, { from: layer.from, units: unit, size, attacking: layer.attacking, anchors: layer.anchors });
    out = placed.map(([x, y]): P => [x * k, y * k]);
  }
  const limits = layer.limits;
  if (limits === undefined) return out;
  const { box } = env.outline;
  const range = (given: readonly [number, number] | undefined, least: number, greatest: number): [number, number] =>
    given === undefined ? [least, greatest] : [Math.min(given[0], given[1]) * k, Math.max(given[0], given[1]) * k];
  const rx = limits === "surface" ? range(undefined, box.x, box.x + box.w) : range(limits.x, -Infinity, Infinity);
  const ry = limits === "surface" ? range(undefined, box.y, box.y + box.h) : range(limits.y, -Infinity, Infinity);
  return out.map(([x, y]): P => [Math.min(Math.max(x, rx[0]), rx[1]), Math.min(Math.max(y, ry[0]), ry[1])]);
}

/** The inverse of `place`: places on the surface, in feet, as the layer's own coordinates (its frame and unit). */
export function placeBack(layer: LayerBase, env: Env, points: readonly P[], unit: Unit): P[] {
  const k = FEET_PER[unit];
  if (layer.from === undefined) return points.map(([x, y]): P => [x / k, y / k]);
  const size = layer.surfaceSize ?? fittedSize(env);
  return fromSurface(
    points.map(([x, y]): [number, number] => [x / k, y / k]),
    { to: layer.from, units: unit, size, attacking: layer.attacking, anchors: layer.anchors },
  ).map(([x, y]): P => [x, y]);
}

export function newMade(): Made {
  return { marks: "", defs: "", style: "", attr: "", opacity: undefined, drawn: 0, skipped: 0, outcomes: new Map(), teams: new Map(), low: Infinity, high: -Infinity };
}

export function envFor(o: SurfaceOptions | ScoreOptions, turned: boolean | undefined): Env {
  const language = o.language === "ja" ? "ja" : "en";
  const outline = outlineOf(o);
  const teams = o as Partial<ScoreOptions>;
  return {
    o,
    id: drawingId(o),
    turned: turned ?? (isPortrait(o) && o.sport !== "mlb"),
    unit: lengthUnit(o),
    outline,
    base: Math.max(outline.box.w, outline.box.h) * 0.013,
    words: KYOGIJO_STRINGS[language],
    logos: { home: safeLogo(teams.home?.logo), away: safeLogo(teams.away?.logo) },
  };
}
