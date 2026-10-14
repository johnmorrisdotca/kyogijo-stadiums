import { FEET_PER_METRE, fenceAt, fencePoints, DEFAULT_FENCE, type FencePoint } from "./geometry.ts";
import { PARK_DATA } from "./parks.data.ts";
import { officialName, placesNamed, type PlaceAlias } from "./names.ts";
import type { Fence, Language } from "./types.ts";
import type { Unit } from "./units.ts";

/** Where a park's figures were read: an article of Wikipedia at a revision. */
export interface ParkSource {
  title: string;
  revision: number;
}

/** A fence that stood for some seasons of a past park: the figures an article dates, from the first season to the last. */
export interface ParkPeriodData {
  from: number;
  to: number;
  /** [angle from dead centre, distance in the park's unit], from the left field line to the right. */
  points: [number, number][];
}

/** Where a stretch of wall stands, in words: a key of the words of `ballpark.sections` (`left`, `leftCorner`, `deadCenter`, `centerToRight`...). */
export type WallPlace = "outfield" | "left" | "leftCenter" | "center" | "deadCenter" | "rightCenter" | "right" | "leftToCenter" | "centerToRight" | "leftCorner" | "rightCorner";

/** A stretch of the fence and how high it stands, as the figures give it (the height in the park's unit). */
export interface ParkWallData {
  /** The stretch's angles from dead centre: the left field line is -45 and the right field line 45 (our reading of the article's words, see docs/references.md). */
  from: number;
  to: number;
  /** The height of the wall in the park's unit. */
  height: number;
  /** A name the wall has in the article (`Green Monster`); a wall without one is named by its place in the field. */
  label?: string;
  /** Where the article says the wall stands. */
  place?: WallPlace;
  /** The first and the last season the height stood, where the article dates it. A wall with no `last` is the one standing today (or when the park closed). */
  first?: number;
  last?: number;
}

/** A stretch of the fence and how high it stands, in feet. */
export interface ParkWall extends Omit<ParkWallData, "height"> {
  height_ft: number;
}

/** The sides of the field a dugout is on: along the first base line or the third. */
export type DugoutSide = "first" | "third";

/** Which dugout is on which line, where the article says. */
export interface ParkDugouts {
  home?: DugoutSide;
  visitors?: DugoutSide;
}

/** What a quirk of a ballpark is. */
export type QuirkKind = "hill" | "overhang" | "pole" | "flagpole" | "bullpen" | "ivy" | "basket";

interface QuirkBase {
  /** A name the article gives it (`Tal's Hill`, `Pesky's Pole`); a quirk without one is named by its kind. */
  label?: string;
  /** The first and the last season it stood, where the article dates it; with no `last` it is there today (or when the park closed). */
  first?: number;
  last?: number;
}

/** An incline in the field: against the fence at an angle and a distance, as wide as the article says (`width_ft`), and as steep as it says. */
export interface HillQuirk extends QuirkBase {
  kind: "hill";
  angle: number;
  feet: number;
  width_ft: number;
  slope_deg?: number;
}

/** A stand that hangs over the fence into the field by `depth_ft`, along a stretch of it. */
export interface OverhangQuirk extends QuirkBase {
  kind: "overhang";
  from: number;
  to: number;
  depth_ft: number;
}

/** A foul pole, a flagpole or a bullpen at an angle and a distance from home plate. */
export interface PointQuirk extends QuirkBase {
  kind: "pole" | "flagpole" | "bullpen";
  angle: number;
  feet: number;
  /** The height of a pole, where the article gives it. */
  height_ft?: number;
  /** Whose bullpen it is, where the article says. */
  side?: "home" | "visitors";
}

/** Ivy on the wall, or a basket on top of it, along a stretch of the fence. */
export interface CoverQuirk extends QuirkBase {
  kind: "ivy" | "basket";
  from: number;
  to: number;
}

/** A quirk of a ballpark that its article describes with figures. */
export type ParkQuirk = HillQuirk | OverhangQuirk | PointQuirk | CoverQuirk;

/** A ballpark's fence as the figures give it. */
export interface ParkData {
  /** The key: `fenway-park`. */
  id: string;
  /** The Wikidata item of the ground (`Q49136`), the key to join a park to other data. */
  wikidata: string;
  /** The everyday name in English, the one English sports media use (`Koshien Stadium`, `Oracle Park`); the title of the Wikipedia article is one of the `aliases`. */
  name: string;
  /** The everyday name in Japanese (`甲子園球場`, `マツダスタジアム`), as Japanese media say it; for a park of the United States and Canada the title of the Japanese Wikipedia article. */
  nameJa: string;
  /** The reading of `nameJa` in kana, given wherever `nameJa` has kanji (`こうしえんきゅうじょう`). */
  readingJa?: string;
  /** The everyday name in the language of the place (`ja` for the parks of Japan, `fr` for two in Montreal); the parks of English-speaking places have none. */
  localName?: string;
  /** The language of `localName`. */
  localLanguage?: string;
  /** Every other name, each with where it was read: the cited articles' titles (`wikipedia`, with the revision), the `official` name when it is not the everyday one, `sponsor` and `former` names with their years, `nickname`s. */
  aliases?: PlaceAlias[];
  team: string;
  teamJa?: string;
  city: string;
  country: "US" | "CA" | "JP";
  /** Wikidata's coordinates of the ground (P625), in degrees. */
  lat: number;
  lon: number;
  league: "MLB" | "NPB";
  /** The unit of `points`: feet for MLB, metres for NPB. */
  unit: "ft" | "m";
  /** `current` is a club's home today, `secondary` a ground a club also uses, `past` one a club has left. */
  status: "current" | "secondary" | "past";
  /** For a past MLB park, the first and the last season an MLB club called it home. */
  from?: number;
  to?: number;
  /** The year the ground opened and the year it closed, as Wikidata gives them where it does (a current park has no `closed`). */
  opened?: number;
  closed?: number;
  /** [angle from dead centre, distance in `unit`], from the left field line to the right: the last fence the park had. */
  points: [number, number][];
  /** Earlier fences, where the article dates them. A season in none of the periods has `points`. */
  periods?: ParkPeriodData[];
  /** The label the article gives some of the `points`, as [angle, words]: kept for the points beyond the usual five that were read from its text. */
  labels?: [number, string][];
  /** How high the fence stands along stretches of it, where the article gives the figures. */
  walls?: ParkWallData[];
  /** The quirks the article describes with figures: a hill, an overhang, a pole, the bullpens, ivy. */
  quirks?: ParkQuirk[];
  /** The width of the warning track in feet, where the article gives it (the rule of thumb of 15 feet is drawn without it). */
  track_ft?: number;
  /** The distance from home plate to the backstop in feet, where the article gives it. */
  backstop_ft?: number;
  /** Which dugout is on which side, where the article says. */
  dugouts?: ParkDugouts;
  /** The article in English the figures were read from. */
  en?: ParkSource;
  /** The article in Japanese. */
  ja?: ParkSource;
  note?: string;
}

/** A fence of some seasons, in feet. */
export interface ParkPeriod {
  from: number;
  to: number;
  points: FencePoint[];
}

/** A ballpark, with its fence in feet. */
export interface Park extends Omit<ParkData, "points" | "unit" | "periods" | "walls"> {
  /** [angle from dead centre, distance in feet]. */
  points: FencePoint[];
  periods?: ParkPeriod[];
  /** How high the fence stands along stretches of it, in feet. */
  walls?: ParkWall[];
}

/** The address of the revision of an article that a park's figures were read from. */
export function parkSourceUrl(source: ParkSource, language: "en" | "ja" = "en"): string {
  return `https://${language}.wikipedia.org/w/index.php?title=${encodeURIComponent(source.title.replace(/ /g, "_"))}&oldid=${source.revision}`;
}

const toFeet = (data: ParkData): Park => {
  const { points, unit, periods, walls, ...rest } = data;
  const scale = unit === "m" ? FEET_PER_METRE : 1;
  const feet = (list: [number, number][]): FencePoint[] => list.map(([angle, distance]): FencePoint => [angle, Math.round(distance * scale * 10) / 10]);
  const high = (wall: ParkWallData): ParkWall => {
    const { height, ...stretch } = wall;
    return { ...stretch, height_ft: Math.round(height * scale * 1000) / 1000 };
  };
  return {
    ...rest,
    points: feet(points),
    ...(periods === undefined ? {} : { periods: periods.map((period) => ({ ...period, points: feet(period.points) })) }),
    ...(walls === undefined ? {} : { walls: walls.map(high) }),
  };
};

/** Every park by its key: the thirty current MLB ballparks, forty-three past ones, the twelve NPB home parks, and eight secondary or past NPB grounds. */
export const PARKS: Readonly<Record<string, Park>> = Object.freeze(Object.fromEntries(PARK_DATA.map((data) => [data.id, toFeet(data)])));

/** The keys of `PARKS`: the current MLB parks, then the past ones by their first season, then the NPB's, each in the order of the sources. */
export const PARK_IDS: readonly string[] = Object.freeze(PARK_DATA.map((data) => data.id));

/** The unit a park's figures were published in: metres for the parks of Japan (converted to feet once, in `PARKS`), feet for the rest. `undefined` for a key that is not a park. */
export const parkUnit = (id: string | undefined): Unit | undefined => PARK_DATA.find((data) => data.id === id)?.unit;

/**
 * The parks that answer to a name, best match first: the everyday names, then the official and cited names and the sponsors', then the former names and the nicknames. A name is
 * compared without case, accents, spaces or punctuation, in full-width or half-width, and in Japanese with hiragana or katakana and with or without the long vowel mark.
 * @example
 * ```ts
 * import { parksByName } from "@johnmorrisdotca/kyogijo-stadiums/parks";
 * console.log(parksByName("Camden Yards")[0]?.id, parksByName("甲子園")[0]?.id, parksByName("ハマスタ")[0]?.id);
 * // oriole-park-at-camden-yards hanshin-koshien-stadium yokohama-stadium
 * ```
 */
export const parksByName = (name: string | undefined): Park[] => placesNamed(Object.values(PARKS), name);

/** The park a name belongs to (see `parksByName`; the best match when several answer to it), or `undefined`. */
export const parkByName = (name: string | undefined): Park | undefined => parksByName(name)[0];

/** A park's name in a language: the everyday name in English, or in Japanese. */
export const parkNameIn = (park: Park, language: Language = "en"): string => (language === "ja" ? park.nameJa : park.name);

/** The name a park officially has in a language, when it is not the everyday name (`Hanshin Koshien Stadium` for `Koshien Stadium`), in the year given or today; else `undefined`. */
export const parkOfficialName = (park: Park, language: Language = "en", year?: number): string | undefined => officialName(park, language, undefined, Number.isFinite(year) ? year : undefined);

/** The park with a key, or `undefined`. */
export const parkById = (id: string | undefined): Park | undefined => (id === undefined ? undefined : PARKS[id]);

/** The park whose Wikidata item is `Q49136`, or `undefined`. */
export const parkByWikidata = (wikidata: string | undefined): Park | undefined => Object.values(PARKS).find((park) => park.wikidata === wikidata);

/** A park's fence in a season: the period that names the season, else the park's last fence. */
export function parkPointsIn(park: Park, year: number | undefined): FencePoint[] {
  if (year === undefined || !Number.isFinite(year)) return park.points;
  return park.periods?.find((period) => period.from <= year && year <= period.to)?.points ?? park.points;
}

/** True when something dated by its `first` and `last` season stands in `year`; without a year, what stands today (has no `last`). */
const standsIn = (dated: { first?: number; last?: number }, year: number | undefined): boolean => {
  if (year === undefined || !Number.isFinite(year)) return dated.last === undefined;
  return (dated.first === undefined || dated.first <= year) && (dated.last === undefined || year <= dated.last);
};

/** The stretches of fence a park has in a season, with their heights in feet: the heights the article dates for that season, else those of today. */
export function parkWallsIn(park: Park, year?: number): ParkWall[] {
  return (park.walls ?? []).filter((wall) => standsIn(wall, year));
}

/** The quirks a park has in a season: those the article dates for that season, else those of today. */
export function parkQuirksIn(park: Park, year?: number): ParkQuirk[] {
  return (park.quirks ?? []).filter((quirk) => standsIn(quirk, year));
}

/**
 * The fence points a drawing uses: a park's (as it stood in `year`, when the park has dated fences), with any of the
 * five usual distances in `fence` laid over them, or the usual 330, 375, 400, 375 and 330 feet of a generic field (or the
 * `generic` points a league's rules give).
 */
export function fenceFor(park: Park | undefined, fence: Partial<Fence> | undefined, year?: number, generic: readonly FencePoint[] = fencePoints(DEFAULT_FENCE)): FencePoint[] {
  const base: FencePoint[] = park === undefined ? [...generic] : parkPointsIn(park, year);
  if (fence === undefined) return base;
  const keys: [keyof Fence, number][] = [["left", -45], ["leftCenter", -22.5], ["center", 0], ["rightCenter", 22.5], ["right", 45]];
  const given = keys.filter(([key]) => typeof fence[key] === "number" && Number.isFinite(fence[key]) && (fence[key] as number) > 0);
  if (given.length === 0) return base;
  // The caller's distances stand at their angles; the park's own points that fall near one of them give way.
  const mine: FencePoint[] = given.map(([key, angle]) => [angle, fence[key] as number]);
  const kept = base.filter(([angle]) => !mine.some(([chosen]) => Math.abs(chosen - angle) < 11));
  const filled: FencePoint[] = [...kept, ...mine];
  if (!filled.some(([angle]) => angle === -45)) filled.push([-45, fenceAt(base, -45)]);
  if (!filled.some(([angle]) => angle === 45)) filled.push([45, fenceAt(base, 45)]);
  return filled.sort((a, b) => a[0] - b[0]);
}
