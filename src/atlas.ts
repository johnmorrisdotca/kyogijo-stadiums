import { GROUNDS, GROUND_IDS } from "./grounds.ts";
import type { Ground } from "./grounds.ts";
import { nameContainsAll, placesNamed, plainName } from "./names.ts";
import type { PlaceAlias } from "./names.ts";
import { PARKS, PARK_IDS } from "./parks.ts";
import type { Park } from "./parks.ts";

/** What a place is: a ballpark (of `PARKS`) or a soccer ground (of `GROUNDS`). */
export type PlaceKind = "park" | "ground";

/** The sport a place is drawn for: baseball parks have a fence, soccer grounds a pitch. */
export type PlaceSport = "baseball" | "soccer";

/** `current` is a ground a club or a competition uses today, `past` one it has left, closed or pulled down. */
export type PlaceStatus = "current" | "past";

/** One place on the atlas: a ballpark or a soccer ground, with where it is and when it was in use. */
export interface Place {
  /** The key in `PARKS` or in `GROUNDS` (`fenway-park`, `maracana`): unique across both. */
  id: string;
  kind: PlaceKind;
  /** The everyday name in English. */
  name: string;
  /** The everyday name in Japanese. */
  nameJa: string;
  /** The reading of `nameJa` in kana, where it has kanji. */
  readingJa?: string;
  /** The everyday name in the language of the place, where it is not English. */
  localName?: string;
  localLanguage?: string;
  /** Every other name: the cited titles of Wikipedia, the official, sponsor and former names with their years, the nicknames; `placeByName` and the `text` of `placesBy` read them. */
  aliases: readonly PlaceAlias[];
  /** The names the place had for some years (a ground that was given another name for a World Cup), first to last. */
  names?: readonly { name: string; from: number; to: number }[];
  sport: PlaceSport;
  /** The leagues and competitions it is known for: `MLB`, `NPB`, `FIFA World Cup`, `FIFA Women's World Cup`. A club ground that staged none has none. */
  leagues: readonly string[];
  /** ISO 3166-1 alpha-2: `US`. */
  country: string;
  city: string;
  /** The club that plays in a park (`Boston Red Sox`); soccer grounds have none. */
  team?: string;
  /** Wikidata's coordinates (P625, CC0), in degrees. */
  lat: number;
  lon: number;
  status: PlaceStatus;
  /** The first year it was in use: a past MLB park's first MLB season, else the year it opened. Not given where Wikidata and the article do not give it. */
  from?: number;
  /** The last year it was in use: a past MLB park's last MLB season, else the year it closed. A current place has none. */
  to?: number;
  /** The Wikidata item (`Q49136`): the key to join a place to other data. */
  wikidata: string;
  /** True where Wikidata lists athletics among the sports of a soccer ground: a running track lies round its pitch (`drawKyogijo({ sport: "athletics", ground })`). Absent where Wikidata says nothing of it. */
  track?: boolean;
}

/** What `placesBy` keeps: every field given must match. A list matches any of its members. */
export interface PlaceFilter {
  sport?: PlaceSport | readonly PlaceSport[];
  kind?: PlaceKind | readonly PlaceKind[];
  /** A league or competition from `Place.leagues`. */
  league?: string | readonly string[];
  /** ISO 3166-1 alpha-2. */
  country?: string | readonly string[];
  status?: PlaceStatus | readonly PlaceStatus[];
  /** Keep the places in use in this year. A year that is not known for a place (no `from`, no `to`) does not shut it out. */
  year?: number;
  /** Words to find in any name (the everyday names, the aliases, the readings), the city or the club, ignoring case, accents, width and, in Japanese, hiragana or katakana; every word must be found. */
  text?: string;
}

const leaguesOfGround = (ground: Ground): string[] => {
  const leagues: string[] = [];
  if (ground.tournaments.some((t) => t.competition === "world-cup")) leagues.push("FIFA World Cup");
  if (ground.tournaments.some((t) => t.competition === "womens-world-cup")) leagues.push("FIFA Women's World Cup");
  return leagues;
};

const fromPark = (park: Park): Place => {
  const from = park.from ?? park.opened;
  const to = park.to ?? park.closed;
  return {
    id: park.id,
    kind: "park",
    name: park.name,
    nameJa: park.nameJa,
    ...(park.readingJa === undefined ? {} : { readingJa: park.readingJa }),
    ...(park.localName === undefined ? {} : { localName: park.localName, localLanguage: park.localLanguage }),
    aliases: park.aliases ?? [],
    sport: "baseball",
    leagues: [park.league],
    country: park.country,
    city: park.city,
    team: park.team,
    lat: park.lat,
    lon: park.lon,
    // A ground a club also uses (`secondary`) is in use today.
    status: park.status === "past" ? "past" : "current",
    ...(from === undefined ? {} : { from }),
    ...(park.status === "past" && to !== undefined ? { to } : {}),
    wikidata: park.wikidata,
  };
};

const fromGround = (ground: Ground): Place => ({
  id: ground.id,
  kind: "ground",
  name: ground.name,
  nameJa: ground.nameJa,
  ...(ground.readingJa === undefined ? {} : { readingJa: ground.readingJa }),
  ...(ground.localName === undefined ? {} : { localName: ground.localName, localLanguage: ground.localLanguage }),
  aliases: ground.aliases ?? [],
  ...(ground.names === undefined ? {} : { names: ground.names }),
  sport: "soccer",
  leagues: leaguesOfGround(ground),
  country: ground.country,
  city: ground.city,
  lat: ground.lat,
  lon: ground.lon,
  status: ground.status,
  ...(ground.from === undefined ? {} : { from: ground.from }),
  ...(ground.status === "past" && ground.to !== undefined ? { to: ground.to } : {}),
  wikidata: ground.wikidata,
  ...(ground.track === true ? { track: true } : {}),
});

/**
 * Every place the package draws, parks first and then grounds, each in the order of its own list: the ballparks of
 * `PARKS` and the soccer grounds of `GROUNDS`, with where each stands.
 * @example
 * ```ts
 * import { PLACES } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
 * const fenway = PLACES.find((place) => place.id === "fenway-park");
 * console.log(fenway?.name, fenway?.lat, fenway?.lon, fenway?.country);
 * // Fenway Park 42.34639 -71.0975 US
 * ```
 */
export const PLACES: readonly Place[] = Object.freeze([...PARK_IDS.map((id) => fromPark(PARKS[id])), ...GROUND_IDS.map((id) => fromGround(GROUNDS[id]))]);

const BY_ID: ReadonlyMap<string, Place> = new Map(PLACES.map((place) => [place.id, place]));

/** The place with a key, or `undefined`. */
export const placeById = (id: string | undefined): Place | undefined => (id === undefined ? undefined : BY_ID.get(id));

/**
 * The places that answer to a name, best match first: the everyday names, then the official and cited names and the sponsors', then the former names and the nicknames. The comparison
 * ignores case, accents, spaces and punctuation, width, and in Japanese hiragana or katakana and the long vowel mark.
 * @example
 * ```ts
 * import { placeByName, placesByName } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
 * console.log(placeByName("Koshien Stadium")?.id, placeByName("サン・シーロ")?.id, placeByName("Estadio Jornalista Mario Filho")?.id, placesByName("wrigley field").map((place) => place.id).join());
 * // hanshin-koshien-stadium san-siro maracana wrigley-field,wrigley-field-los-angeles
 * ```
 */
export const placesByName = (name: string | undefined): Place[] => placesNamed(PLACES, name);

/** The place a name belongs to (see `placesByName`; the best match when several answer to it), or `undefined`. */
export const placeByName = (name: string | undefined): Place | undefined => placesByName(name)[0];

const plain = plainName;
const many = <T>(value: T | readonly T[] | undefined): readonly T[] | undefined => (value === undefined ? undefined : Array.isArray(value) ? (value as readonly T[]) : [value as T]);

/**
 * The places that match every field of the filter, in the order of `PLACES`.
 * @example
 * ```ts
 * import { placesBy } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
 * const japan = placesBy({ sport: "baseball", country: "JP", status: "current" });
 * const in1950 = placesBy({ year: 1950, country: "US" });
 * console.log(japan.length, in1950.some((place) => place.id === "ebbets-field"));
 * // 14 true
 * ```
 */
export function placesBy(filter: PlaceFilter = {}): Place[] {
  const sports = many(filter.sport);
  const kinds = many(filter.kind);
  const leagues = many(filter.league);
  const countries = many(filter.country);
  const statuses = many(filter.status);
  const year = filter.year !== undefined && Number.isFinite(filter.year) ? filter.year : undefined;
  const words = filter.text === undefined ? [] : filter.text.split(/\s+/).map(plain).filter(Boolean);
  return PLACES.filter((place) => {
    if (sports !== undefined && !sports.includes(place.sport)) return false;
    if (kinds !== undefined && !kinds.includes(place.kind)) return false;
    if (leagues !== undefined && !place.leagues.some((league) => leagues.includes(league))) return false;
    if (countries !== undefined && !countries.includes(place.country)) return false;
    if (statuses !== undefined && !statuses.includes(place.status)) return false;
    if (year !== undefined && ((place.from !== undefined && year < place.from) || (place.to !== undefined && year > place.to))) return false;
    if (words.length > 0) {
      const haystack = plain([place.city, place.team, place.country].filter(Boolean).join(" "));
      if (!words.every((word) => haystack.includes(word) || nameContainsAll(place, [word]))) return false;
    }
    return true;
  });
}

/** What the places hold, for the controls of a page: each list sorted, the years as far as the data gives them. */
export interface AtlasFacets {
  sports: PlaceSport[];
  leagues: string[];
  countries: string[];
  /** The first and the last year any place gives (`from` or `to`). */
  years: { min: number; max: number };
}

/**
 * The sports, leagues and countries of the places, and the span of years they give.
 * @example
 * ```ts
 * import { atlasFacets } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
 * const { sports, leagues, countries, years } = atlasFacets();
 * console.log(sports.join(), leagues.join(), countries.length, years.min);
 * // baseball,soccer FIFA Women's World Cup,FIFA World Cup,MLB,NPB 23 1877
 * ```
 */
export function atlasFacets(): AtlasFacets {
  const years = PLACES.flatMap((place) => [place.from, place.to]).filter((year): year is number => year !== undefined);
  return {
    sports: [...new Set(PLACES.map((place) => place.sport))].sort(),
    leagues: [...new Set(PLACES.flatMap((place) => place.leagues))].sort(),
    countries: [...new Set(PLACES.map((place) => place.country))].sort(),
    years: { min: Math.min(...years), max: Math.max(...years) },
  };
}

/** The options `drawKyogijo` takes to draw a place's surface: a park's fence or a ground's pitch at its own size. */
export function surfaceOf(place: Place): { sport: "mlb"; park: string } | { sport: "soccer"; ground: string } {
  return place.kind === "park" ? { sport: "mlb", park: place.id } : { sport: "soccer", ground: place.id };
}
