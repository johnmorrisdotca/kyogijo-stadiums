import { FEET_PER_METRE, fenceAt, fencePoints, DEFAULT_FENCE, type FencePoint } from "./geometry.ts";
import { PARK_DATA } from "./parks.data.ts";
import type { Fence } from "./types.ts";

/** Where a park's figures were read: an article of Wikipedia at a revision. */
export interface ParkSource {
  title: string;
  revision: number;
}

/** A ballpark's fence as the figures give it. */
export interface ParkData {
  /** The key: `fenway-park`. */
  id: string;
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
  /** `current` is a club's home today, `secondary` a ground a club also uses or used, `historic` one it has left. */
  status: "current" | "secondary" | "historic";
  /** [angle from dead centre, distance in `unit`], from the left field line to the right. */
  points: [number, number][];
  /** The article in English the figures were read from. */
  en?: ParkSource;
  /** The article in Japanese. */
  ja?: ParkSource;
  note?: string;
}

/** A ballpark, with its fence in feet. */
export interface Park extends Omit<ParkData, "points" | "unit"> {
  /** [angle from dead centre, distance in feet]. */
  points: FencePoint[];
}

/** The address of the revision of an article that a park's figures were read from. */
export function parkSourceUrl(source: ParkSource, language: "en" | "ja" = "en"): string {
  return `https://${language}.wikipedia.org/w/index.php?title=${encodeURIComponent(source.title.replace(/ /g, "_"))}&oldid=${source.revision}`;
}

const toFeet = (data: ParkData): Park => {
  const { points, unit, ...rest } = data;
  const scale = unit === "m" ? FEET_PER_METRE : 1;
  return { ...rest, points: points.map(([angle, distance]): FencePoint => [angle, Math.round(distance * scale * 10) / 10]) };
};

/** Every park by its key: the thirty MLB ballparks, the twelve NPB home parks, and eight secondary or historic NPB grounds. */
export const PARKS: Readonly<Record<string, Park>> = Object.freeze(Object.fromEntries(PARK_DATA.map((data) => [data.id, toFeet(data)])));

/** The keys of `PARKS`, MLB first, then NPB, each in the order of the sources. */
export const PARK_IDS: readonly string[] = Object.freeze(PARK_DATA.map((data) => data.id));

/** The park with a key, or `undefined`. */
export const parkById = (id: string | undefined): Park | undefined => (id === undefined ? undefined : PARKS[id]);

/**
 * The fence points a drawing uses: a park's, with any of the five usual distances in `fence` laid over them, or the
 * usual 330, 375, 400, 375 and 330 feet of a generic field.
 */
export function fenceFor(park: Park | undefined, fence: Partial<Fence> | undefined): FencePoint[] {
  const base: FencePoint[] = park === undefined ? fencePoints(DEFAULT_FENCE) : park.points;
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
