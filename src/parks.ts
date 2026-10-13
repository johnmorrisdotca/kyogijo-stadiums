import { FEET_PER_METRE, fenceAt, fencePoints, DEFAULT_FENCE, type FencePoint } from "./geometry.ts";
import { PARK_DATA } from "./parks.data.ts";
import type { Fence } from "./types.ts";
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

/** A ballpark's fence as the figures give it. */
export interface ParkData {
  /** The key: `fenway-park`. */
  id: string;
  /** The Wikidata item of the ground (`Q49136`), the key to join a park to other data. */
  wikidata: string;
  name: string;
  /** The name in Japanese, for the parks of Japan. */
  nameJa?: string;
  team: string;
  teamJa?: string;
  city: string;
  country: "US" | "CA" | "JP";
  league: "MLB" | "NPB";
  /** The unit of `points`: feet for MLB, metres for NPB. */
  unit: "ft" | "m";
  /** `current` is a club's home today, `secondary` a ground a club also uses, `past` one a club has left. */
  status: "current" | "secondary" | "past";
  /** For a past MLB park, the first and the last season an MLB club called it home. */
  from?: number;
  to?: number;
  /** [angle from dead centre, distance in `unit`], from the left field line to the right: the last fence the park had. */
  points: [number, number][];
  /** Earlier fences, where the article dates them. A season in none of the periods has `points`. */
  periods?: ParkPeriodData[];
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
export interface Park extends Omit<ParkData, "points" | "unit" | "periods"> {
  /** [angle from dead centre, distance in feet]. */
  points: FencePoint[];
  periods?: ParkPeriod[];
}

/** The address of the revision of an article that a park's figures were read from. */
export function parkSourceUrl(source: ParkSource, language: "en" | "ja" = "en"): string {
  return `https://${language}.wikipedia.org/w/index.php?title=${encodeURIComponent(source.title.replace(/ /g, "_"))}&oldid=${source.revision}`;
}

const toFeet = (data: ParkData): Park => {
  const { points, unit, periods, ...rest } = data;
  const scale = unit === "m" ? FEET_PER_METRE : 1;
  const feet = (list: [number, number][]): FencePoint[] => list.map(([angle, distance]): FencePoint => [angle, Math.round(distance * scale * 10) / 10]);
  return { ...rest, points: feet(points), ...(periods === undefined ? {} : { periods: periods.map((period) => ({ ...period, points: feet(period.points) })) }) };
};

/** Every park by its key: the thirty current MLB ballparks, forty-three past ones, the twelve NPB home parks, and eight secondary or past NPB grounds. */
export const PARKS: Readonly<Record<string, Park>> = Object.freeze(Object.fromEntries(PARK_DATA.map((data) => [data.id, toFeet(data)])));

/** The keys of `PARKS`: the current MLB parks, then the past ones by their first season, then the NPB's, each in the order of the sources. */
export const PARK_IDS: readonly string[] = Object.freeze(PARK_DATA.map((data) => data.id));

/** The unit a park's figures were published in: metres for the parks of Japan (converted to feet once, in `PARKS`), feet for the rest. `undefined` for a key that is not a park. */
export const parkUnit = (id: string | undefined): Unit | undefined => PARK_DATA.find((data) => data.id === id)?.unit;

/** The park with a key, or `undefined`. */
export const parkById = (id: string | undefined): Park | undefined => (id === undefined ? undefined : PARKS[id]);

/** The park whose Wikidata item is `Q49136`, or `undefined`. */
export const parkByWikidata = (wikidata: string | undefined): Park | undefined => Object.values(PARKS).find((park) => park.wikidata === wikidata);

/** A park's fence in a season: the period that names the season, else the park's last fence. */
export function parkPointsIn(park: Park, year: number | undefined): FencePoint[] {
  if (year === undefined || !Number.isFinite(year)) return park.points;
  return park.periods?.find((period) => period.from <= year && year <= period.to)?.points ?? park.points;
}

/**
 * The fence points a drawing uses: a park's (as it stood in `year`, when the park has dated fences), with any of the
 * five usual distances in `fence` laid over them, or the usual 330, 375, 400, 375 and 330 feet of a generic field.
 */
export function fenceFor(park: Park | undefined, fence: Partial<Fence> | undefined, year?: number): FencePoint[] {
  const base: FencePoint[] = park === undefined ? fencePoints(DEFAULT_FENCE) : parkPointsIn(park, year);
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
