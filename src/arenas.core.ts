import { officialName, type PlaceAlias } from "./names.ts";
import type { Language } from "./types.ts";

/** Where an arena's facts were read: an article of Wikipedia at a revision. */
export interface ArenaSource {
  title: string;
  revision: number;
}

/** A name an arena had for some years, first to last. */
export interface ArenaName {
  name: string;
  from: number;
  to: number;
}

/** A published size of an ice rink or a basketball court, in the unit it was published in, with where it was read and, if the source dates it, the years it had that size. */
export interface ArenaSize {
  length: number;
  width: number;
  unit: "ft" | "m";
  /** The first and the last year it had this size, where the source gives them. */
  from?: number;
  to?: number;
  /** Where it was read: the article and its revision, and in a few words what it says (not a copied passage). */
  source: string;
}

/** The seats an arena holds for each sport, as the infobox of its article gives them (the first number it gives for the sport). */
export interface ArenaCapacity {
  hockey?: number;
  basketball?: number;
}

/** An arena as the data gives it: the rink and the court are the sizes published where they differ from the league's. */
export interface ArenaData {
  /** The key: `boston-garden`. */
  id: string;
  /** The Wikidata item of the arena (`Q894567`), the key to join an arena to other data. */
  wikidata: string;
  /** The everyday name in English (`Boston Garden`, `TD Garden`); the title of the English article is one of the `aliases`. */
  name: string;
  /** Names the arena had for some years, in order of time: where two share a year the later one is the name at the end of it. */
  names?: ArenaName[];
  /** The everyday name in Japanese, as Japanese media say it. */
  nameJa: string;
  /** The reading of `nameJa` in kana, given wherever `nameJa` has kanji. */
  readingJa?: string;
  /** The everyday name in the language of the place, where it is not English (`Colisée de Québec`). */
  localName?: string;
  localLanguage?: string;
  /** Every other name, each with where it was read. */
  aliases?: PlaceAlias[];
  city: string;
  /** ISO 3166-1 alpha-2: `US`, `CA`. */
  country: string;
  /** Wikidata's coordinates of the arena (P625), in degrees. */
  lat: number;
  lon: number;
  /** `current` stands and is in use for a team of the leagues, `past` has been left, closed or pulled down. */
  status: "current" | "past";
  /** The year it opened, and for a past arena the year it closed or was pulled down. */
  from?: number;
  to?: number;
  /** The years the article gives for the building itself: when it closed and when it was pulled down. */
  closed?: number;
  demolished?: number;
  capacity?: ArenaCapacity;
  /** The ice, end boards to end boards and side boards to side boards, where the sources give a size other than the NHL's 200 by 85 feet: one for each time it was a different size. */
  rink?: ArenaSize[];
  /** The court, where the sources give a size other than the NBA's 94 by 50 feet. */
  court?: ArenaSize[];
  /** True where the article says the rink was shorter than the NHL's and gives no size: the drawing says so. */
  rinkUnknown?: true;
  /** Why a size is not given, or what the sources say instead. */
  note?: string;
  /** The English article the facts were read from. */
  en: ArenaSource;
  /** The Japanese article the name in Japanese was read from. */
  ja?: ArenaSource;
}

/** An arena as the package holds it: the data, with the sizes in the unit they were published in (see `arenaRinkIn` and `arenaCourtIn` for them in feet). */
export type Arena = ArenaData;

const FEET_PER_METRE = 1 / 0.3048;
const tenth = (feet: number): number => Math.round(feet * 10) / 10;
const inFeet = (size: ArenaSize): { length: number; width: number } => {
  const k = size.unit === "m" ? FEET_PER_METRE : 1;
  return { length: tenth(size.length * k), width: tenth(size.width * k) };
};
/** The size that held in a year: the one whose years cover it, else (with no year) the latest. */
const sizeIn = (sizes: readonly ArenaSize[] | undefined, year: number | undefined): { length: number; width: number } | undefined => {
  if (sizes === undefined || sizes.length === 0) return undefined;
  if (year === undefined || !Number.isFinite(year)) return inFeet(sizes.find((size) => size.to === undefined) ?? sizes[sizes.length - 1]);
  const found = sizes.find((size) => (size.from === undefined || size.from <= year) && (size.to === undefined || year <= size.to));
  return found === undefined ? undefined : inFeet(found);
};

/**
 * The size of an arena's rink in feet, in a year or today (the latest), when the sources publish one that differs from the NHL's; else `undefined` and the NHL's 200 by 85 feet
 * is the rink.
 * @example
 * ```ts
 * import { arenaById, arenaRinkIn } from "@johnmorrisdotca/kyogijo-stadiums/arenas";
 * console.log(arenaRinkIn(arenaById("boston-garden")!), arenaRinkIn(arenaById("matthews-arena")!, 1926), arenaRinkIn(arenaById("td-garden")!));
 * // { length: 190.9, width: 83 } { length: 220, width: 90 } undefined
 * ```
 */
export const arenaRinkIn = (arena: Arena | undefined, year?: number): { length: number; width: number } | undefined => sizeIn(arena?.rink, year);

/** The size of an arena's court in feet, in a year or today, when the sources publish one that differs from the NBA's 94 by 50 feet; else `undefined`. */
export const arenaCourtIn = (arena: Arena | undefined, year?: number): { length: number; width: number } | undefined => sizeIn(arena?.court, year);

/** The arenas held for the drawing: the ones registered, by key. The full list (`arenas.ts`) registers every arena; `loadArena` (`venue-data.ts`) registers one. */
const HELD = new Map<string, Arena>();

/** Hold arenas for the drawing, under their keys: a later one with a key replaces the earlier. Returns the arenas as held. */
export function registerArenas(list: readonly ArenaData[]): Arena[] {
  for (const data of list) HELD.set(data.id, data);
  return list.map((data) => HELD.get(data.id) as Arena);
}

/** The arena held under a key, or `undefined`: what the drawing reads when it is given an arena. */
export const heldArena = (id: string | undefined): Arena | undefined => (id === undefined ? undefined : HELD.get(id));

/** The name an arena had in a year (the name of the time in English; in Japanese there is one name for every year). */
export function arenaNameIn(arena: Arena, year?: number, language: Language = "en"): string {
  if (language === "ja") return arena.nameJa;
  if (year === undefined || !Number.isFinite(year)) return arena.name;
  const periods = (arena.names ?? []).filter((period) => period.from <= year && year <= period.to);
  return periods.length === 0 ? arena.name : periods[periods.length - 1].name;
}

/** The name an arena officially has in a language, when it is not the everyday name; else `undefined`. */
export function arenaOfficialName(arena: Arena, language: Language = "en", year?: number): string | undefined {
  const shown = arenaNameIn(arena, year, language);
  if (year !== undefined && Number.isFinite(year) && language === "en" && shown !== arena.name) return undefined;
  return officialName(arena, language, shown, Number.isFinite(year) ? year : undefined);
}

/** The address of the revision of an article that an arena's facts were read from. */
export function arenaSourceUrl(source: ArenaSource, language: "en" | "ja" = "en"): string {
  return `https://${language}.wikipedia.org/w/index.php?title=${encodeURIComponent(source.title.replace(/ /g, "_"))}&oldid=${source.revision}`;
}
