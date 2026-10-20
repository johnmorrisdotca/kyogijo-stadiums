// What the drawing and the data layers both need: the drawing's id, whether it lies tall, and the unit its lengths are in.
// Kept apart from draw.ts so that layers.ts need not import the file that imports it.
import { esc, hash } from "./format.ts";
import type { SurfaceOptions } from "./types.ts";
import { convertLength, isUnit, type Unit } from "./units.ts";
import { VERSION } from "./version.ts";

/** Text made safe for a class name or an id: letters, digits, underscores, spaces and hyphens. */
export const safeClass = (text: string | undefined): string => (text ?? "").replace(/[^\w -]/g, "").trim();

/**
 * The title and the description of a drawing, as the first thing in it: the accessible name (`aria-labelledby` points at them). They sit in a `<defs>` so that they are never a tooltip: a `<title>` that is a direct child of
 * the root makes the browser pop a box with its words up wherever the pointer is over the drawing, which on a mat reads as a label drawn on top of it.
 */
export const metaMarkup = (titleId: string, title: string, descId: string, description: string): string => `<defs><title id="${titleId}">${esc(title)}</title><desc id="${descId}">${esc(description)}</desc></defs>`;

/** The prefix of the ids inside a drawing: the `id` option, or a hash of the options, so that the same call gives the same drawing. */
export const drawingId = (o: SurfaceOptions): string => safeClass(o.id).replace(/ /g, "-") || `ky-${hash(JSON.stringify([o, VERSION]))}`;

/** True when a drawing with these options lies in portrait. */
export function isPortrait(o: Pick<SurfaceOptions, "orientation" | "aspect"> & { sport?: SurfaceOptions["sport"] }): boolean {
  if (o.orientation === "portrait") return true;
  // A curling sheet is 150 feet long and 15 wide: it lies tall unless it is asked to lie wide.
  if (o.orientation === undefined && o.sport === "curling") return true;
  return o.orientation === "auto" && typeof o.aspect === "number" && Number.isFinite(o.aspect) && o.aspect > 0 && o.aspect < 1;
}

/** The unit the options' lengths are in: `units`, or feet when it is missing. A unit that is not one is an error, not feet. */
export function lengthUnit(o: Pick<SurfaceOptions, "units">): Unit {
  if (o.units === undefined) return "ft";
  if (!isUnit(o.units)) throw new Error(`Unknown units "${String(o.units)}": use one of ft, in, yd, m, cm, mm`);
  return o.units;
}

/** The fence the options give, with each distance in feet. */
export function feetFence(fence: SurfaceOptions["fence"], unit: Unit): SurfaceOptions["fence"] {
  if (fence === undefined || unit === "ft") return fence;
  return Object.fromEntries(Object.entries(fence).map(([key, value]) => [key, typeof value === "number" ? convertLength(value, unit, "ft") : value]));
}
