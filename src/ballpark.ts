// What a ballpark's article gives beyond the fence's distances, turned into what a drawing is asked for: the walls and their heights (`walls`), the quirks
// (`quirks`), the warning track's width, and the words that name them. The figures are in parks.ts; this file reads the options and says what to draw and what to say.
import { lengthUnit } from "./common.ts";
import { heldPark, parkQuirksIn, parkWallsIn, type ParkDugouts, type ParkQuirk, type ParkWall } from "./parks.core.ts";
import { KYOGIJO_STRINGS, fill, type KyogijoWords } from "./strings.ts";
import type { Language, QuirkName, SurfaceOptions } from "./types.ts";

/** The unit the heights and distances are written in: feet, or metres for a drawing in metres, centimetres or millimetres. */
export type BallparkUnit = "ft" | "m";

/** What a ballpark drawing has been asked to add to the plain field. */
export interface Ballpark {
  /** The warning track's width in feet where the park's article gives it. */
  track?: number;
  /** The stretches of wall to draw, with their heights in feet; none unless `walls` is asked for. */
  walls: readonly ParkWall[];
  legend: boolean;
  wallLabels: boolean;
  /** The quirks to draw. */
  quirks: readonly ParkQuirk[];
  /** The distance to the backstop in feet, when `quirks` asks for it and the article gives it. */
  backstop?: number;
  dugouts?: ParkDugouts;
  quirkLabels: boolean;
  unit: BallparkUnit;
  language: Language;
  words: KyogijoWords["ballpark"];
}

/** True when a drawing has something of a ballpark to add (its stylesheet is then written in). */
export const ballparkDrawn = (b: Ballpark | undefined): boolean => b !== undefined && (b.walls.length > 0 || b.quirks.length > 0 || b.backstop !== undefined || b.dugouts !== undefined);

const QUIRK_NAMES: readonly QuirkName[] = ["hill", "overhang", "pole", "flagpole", "bullpen", "ivy", "basket", "backstop", "dugouts"];

/**
 * The ballpark of a drawing: the park the options name, in the season they name, with the walls and quirks they ask for. `undefined` for a drawing with no park.
 * A request that cannot be read is left out, as the other options' are.
 */
export function ballparkFor(o: SurfaceOptions): Ballpark | undefined {
  const park = heldPark(o.park);
  if (park === undefined) return undefined;
  const language: Language = o.language === "ja" ? "ja" : "en";
  const unit: BallparkUnit = ["m", "cm", "mm"].includes(lengthUnit(o)) ? "m" : "ft";
  const asked = o.walls === true || (typeof o.walls === "object" && o.walls !== null);
  const wall = typeof o.walls === "object" && o.walls !== null ? o.walls : {};
  const quirked = o.quirks === true || (typeof o.quirks === "object" && o.quirks !== null);
  const quirk = typeof o.quirks === "object" && o.quirks !== null ? o.quirks : {};
  const only: ReadonlySet<QuirkName> | undefined = Array.isArray(quirk.only) ? new Set(quirk.only.filter((name): name is QuirkName => QUIRK_NAMES.includes(name))) : undefined;
  const wants = (name: QuirkName): boolean => quirked && (only === undefined || only.has(name));
  const walls = asked ? parkWallsIn(park, o.year) : [];
  return {
    track: park.track_ft,
    walls,
    legend: walls.length > 0 && wall.legend === true,
    wallLabels: wall.labels === true,
    quirks: parkQuirksIn(park, o.year).filter((q) => wants(q.kind)),
    backstop: wants("backstop") ? park.backstop_ft : undefined,
    dugouts: wants("dugouts") ? park.dugouts : undefined,
    quirkLabels: quirk.labels === true,
    unit,
    language,
    words: KYOGIJO_STRINGS[language].ballpark,
  };
}

/** A length in feet as it is written: in feet, or in metres, to a tenth. */
export function lengthText(feet: number, unit: BallparkUnit): string {
  const value = unit === "m" ? feet * 0.3048 : feet;
  return String(Math.round(value * 10) / 10);
}

/** Where a stretch of fence stands, in words: the whole outfield, or the part of the field its middle falls in. */
export function sectionName(from: number, to: number, words: KyogijoWords["ballpark"]): string {
  if (to - from >= 80) return words.sections.outfield;
  const mid = (from + to) / 2;
  const { left, leftCenter, center, rightCenter, right } = words.sections;
  return mid < -27 ? left : mid < -9 ? leftCenter : mid <= 9 ? center : mid <= 27 ? rightCenter : right;
}

/** The name of a wall: the article's, else where the article puts it, else where its middle falls in the field. */
export const wallName = (wall: ParkWall, words: KyogijoWords["ballpark"]): string => wall.label ?? (wall.place === undefined ? sectionName(wall.from, wall.to, words) : words.sections[wall.place]);

/** The wall as one phrase: its name and its height. */
export function wallText(wall: ParkWall, b: Pick<Ballpark, "unit" | "words">): string {
  return fill(b.words.height, { name: wallName(wall, b.words), height: lengthText(wall.height_ft, b.unit), unit: b.words.unit[b.unit] });
}

/** What the tiers of the legend say, from the thresholds of 10, 20 and 30 feet: `under 10 ft`, `10 to 20 ft`, `20 to 30 ft`, `30 ft and over`. */
export function tierTexts(b: Pick<Ballpark, "unit" | "words">): string[] {
  const unit = b.words.unit[b.unit];
  const at = (feet: number): string => lengthText(feet, b.unit);
  const { under, between, over } = b.words.tiers;
  return [fill(under, { a: at(10), unit }), fill(between, { a: at(10), b: at(20), unit }), fill(between, { a: at(20), b: at(30), unit }), fill(over, { a: at(30), unit })];
}

/** The tier a height falls in, 1 to 4. */
export const tierOf = (feet: number): 1 | 2 | 3 | 4 => (feet < 10 ? 1 : feet < 20 ? 2 : feet < 30 ? 3 : 4);

/** What a quirk is called: the article's name for it, else its kind's. */
export function quirkName(q: ParkQuirk, words: KyogijoWords["ballpark"]): string {
  if (q.label !== undefined) return q.label;
  const k = words.kinds;
  switch (q.kind) {
    case "hill":
      return k.hillName;
    case "overhang":
      return k.overhangName;
    case "pole":
      return k.poleName;
    case "flagpole":
      return k.flagpoleName;
    case "bullpen":
      return q.side === "home" ? k.bullpenHome : q.side === "visitors" ? k.bullpenVisitors : k.bullpen;
    case "ivy":
      return k.ivy;
    case "basket":
      return k.basket;
  }
}

/** A quirk in a phrase, with its figures. */
export function quirkText(q: ParkQuirk, b: Pick<Ballpark, "unit" | "words">): string {
  const k = b.words.kinds;
  const unit = b.words.unit[b.unit];
  const name = quirkName(q, b.words);
  const at = (feet: number): string => lengthText(feet, b.unit);
  switch (q.kind) {
    case "hill":
      return fill(q.slope_deg === undefined ? k.hill : k.hillSlope, { name, width: at(q.width_ft), unit, slope: q.slope_deg ?? 0 });
    case "overhang":
      return fill(k.overhang, { name, depth: at(q.depth_ft), unit });
    case "pole":
    case "flagpole":
      return fill(k.pole, { name, feet: at(q.feet), unit });
    case "bullpen":
      return fill(k.bullpenItem, { name, feet: at(q.feet), unit });
    case "ivy":
    case "basket":
      return name;
  }
}

/** The sentences a ballpark adds to a drawing's description: its walls, then its quirks. */
export function ballparkSentences(b: Ballpark): string[] {
  const out: string[] = [];
  const sep = KYOGIJO_STRINGS[b.language].layers.listSep;
  if (b.walls.length > 0) out.push(fill(b.words.walls, { list: b.walls.map((wall) => wallText(wall, b)).join(sep) }));
  const items = b.quirks.map((q) => quirkText(q, b));
  const k = b.words.kinds;
  const unit = b.words.unit[b.unit];
  if (b.backstop !== undefined) items.push(fill(k.backstop, { feet: lengthText(b.backstop, b.unit), unit }));
  if (b.dugouts?.home !== undefined) items.push(fill(k.dugoutHome, { line: k[b.dugouts.home] }));
  if (b.dugouts?.visitors !== undefined) items.push(fill(k.dugoutVisitors, { line: k[b.dugouts.visitors] }));
  if (items.length > 0) out.push(fill(b.words.quirks, { list: items.join(sep) }));
  return out;
}
