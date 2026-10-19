// What every kind of data layer is drawn against: the drawing's id, its unit and outline, the words, and what a layer made. Kept apart
// from layers.ts so that the heat maps, which are written in files of their own, can use it without importing the file that imports them.
import { flagPicture, safeLogo } from "./logo.ts";
import { esc } from "./format.ts";
import { drawingId, isPortrait, lengthUnit } from "./common.ts";
import { fromSurface, toSurface } from "./frames.ts";
import { zoneResolver, type ZoneOptions } from "./rules.ts";
import "./frames.providers.ts";
import type { P } from "./layers.marks.ts";
import type { LayerBase } from "./layers.types.ts";
import { chooseLeague } from "./leagues.ts";
import { frameSizeOf, outlineOf, type Outline } from "./outline.ts";
import { KYOGIJO_STRINGS, type KyogijoWords } from "./strings.ts";
import type { Box, ScoreOptions, SurfaceOptions } from "./types.ts";
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
  /** The turn, in degrees, that texts and logos are given to read upright: the quarter back (-90) when the surface is turned a quarter, else 0, or the surface's own (a close-up of an athletics start is turned to any angle). */
  back: number;
  unit: Unit;
  outline: Outline;
  /**
   * The part of the surface that is shown, in feet in the drawing's frame: the outline's box, or, when the drawing is cropped to a range, the box of the range. Marks,
   * heat maps and the legend are sized and laid out against it.
   */
  shown: Box;
  /** True when the drawing is cropped to a range, so that layers are cut to `shown` as well as to the outline. */
  cropped: boolean;
  /** The width of a mark by default, in feet: a share of the longer side of what is shown. */
  base: number;
  words: KyogijoWords;
  logos: { home?: string; away?: string };
  /** Whether the layer being drawn writes `data-mark-id`, `data-index` and `data-zone` on its marks: set for each layer by `renderLayers`. */
  marks: boolean;
  /** The finest zone of the surface a place (feet, the drawing's wide frame) lies in, by id: what a mark carries as `data-zone`. `undefined` where the sport has none there. */
  zone: (x: number, y: number) => string | undefined;
}

/** The zone of a drawing's marks, made when the first mark asks: a surface the rules cannot be made for (a special game) has none. */
function zonesOf(o: SurfaceOptions | ScoreOptions): Env["zone"] {
  let resolver: Env["zone"] | undefined;
  return (x, y) => {
    if (resolver === undefined) {
      try {
        resolver = o.host !== undefined ? () => undefined : zoneResolver(o.sport, o as unknown as ZoneOptions);
      } catch {
        resolver = () => undefined;
      }
    }
    return resolver(x, y);
  };
}

/**
 * The data attributes every mark carries, so that one listener on the drawing can link a mark to a table: `data-mark-id` (the id the caller gave the datum, else its index),
 * `data-index` (its place in the layer's data) and `data-zone` (the zone it lies in, from `zoneAt`'s rules). The place is in feet in the drawing's wide frame.
 */
export function markAttrs(env: Env, id: unknown, index: number, at?: readonly [number, number], name = "data-zone"): string {
  if (!env.marks) return "";
  const given = typeof id === "string" && id !== "" ? id : typeof id === "number" && Number.isFinite(id) ? String(id) : String(index);
  const zone = at === undefined ? undefined : env.zone(at[0], at[1]);
  return ` data-mark-id="${esc(given)}" data-index="${index}"${zone === undefined ? "" : ` ${name}="${esc(zone)}"`}`;
}

/**
 * The tooltip of a mark: the caller's own `title`, else (only when the layer writes `data-mark-id` and friends, for a listener that reads the mark's name)
 * a short one made from what the datum says: its outcome, its team and its place in the data ("goal, home, 3"). Nothing is added when the marks are not
 * written, so a drawing that nobody points at is the same text as ever.
 */
export function markTitle(env: Env, d: { title?: unknown; outcome?: unknown; team?: unknown }, index: number): string | undefined {
  if (typeof d.title === "string" && d.title !== "") return d.title;
  if (!env.marks) return undefined;
  const word = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  return [word(d.outcome), word(d.team), String(index + 1)].filter((part) => part !== "").join(", ");
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
export const fittedSize = (env: Env): { length: number; width: number; unit: "ft" } | undefined => frameSizeOf(env.o, env.outline.box);

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

export function envFor(o: SurfaceOptions | ScoreOptions, turned: boolean | undefined, range?: Box, upright?: number, zone?: Env["zone"]): Env {
  const language = o.language === "ja" ? "ja" : "en";
  const outline = outlineOf(o);
  const teams = o as Partial<ScoreOptions>;
  const quarter = turned ?? (isPortrait(o) && o.sport !== "mlb");
  return {
    o,
    id: drawingId(o),
    turned: quarter,
    back: upright ?? (quarter ? -90 : 0),
    unit: lengthUnit(o),
    outline,
    shown: range ?? outline.box,
    cropped: range !== undefined,
    base: Math.max((range ?? outline.box).w, (range ?? outline.box).h) * 0.013,
    words: KYOGIJO_STRINGS[language],
    logos: {
      home: flagPicture(teams.home?.flag, "rect", 48, o.theme) ?? safeLogo(teams.home?.logo, { color: teams.home?.color, accent: teams.home?.textColor }),
      away: flagPicture(teams.away?.flag, "rect", 48, o.theme) ?? safeLogo(teams.away?.logo, { color: teams.away?.color, accent: teams.away?.textColor }),
    },
    marks: o.marks === true || o.pointer === true,
    zone: zone ?? zonesOf(o),
  };
}
