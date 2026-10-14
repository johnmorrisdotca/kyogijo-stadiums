import { GROUNDS, GROUND_IDS } from "./grounds.ts";
import type { Ground } from "./grounds.ts";
import { nameContainsAll, placesNamed, plainName } from "./names.ts";
import type { PlaceAlias } from "./names.ts";
import { PARKS, PARK_IDS } from "./parks.ts";
import type { Park } from "./parks.ts";
import { SURFACE_OF_SPORT, TENANTS, hasSurface, leaguesOf, playedIn } from "./tenants.ts";
import type { Tenant, TenantSport } from "./tenants.ts";

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
  /** The leagues and competitions it is known for: the leagues of the park's club and of every club that has played its home matches there (`CFL` and `MLS` for BC Place, `MLB` and `CFL` for Montreal's Olympic Stadium), then the World Cups it staged (`FIFA World Cup`, `FIFA Women's World Cup`). A ground with no tenant that staged none has none. */
  leagues: readonly string[];
  /** The clubs that play, or played, their home matches there, with the league and the years of each (see `tenantsOf`): the current ones first. A place no club is known to have called home has none. */
  tenants: readonly Tenant[];
  /** ISO 3166-1 alpha-2: `US`. */
  country: string;
  city: string;
  /** The club that plays in a park (`Boston Red Sox`); soccer grounds have none (see `tenants`). */
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
}

/** What `placesBy` keeps: every field given must match. A list matches any of its members. */
export interface PlaceFilter {
  sport?: PlaceSport | readonly PlaceSport[];
  kind?: PlaceKind | readonly PlaceKind[];
  /** A league or competition from `Place.leagues`: a tenant's league (`CFL`) or a tournament. */
  league?: string | readonly string[];
  /** ISO 3166-1 alpha-2. */
  country?: string | readonly string[];
  status?: PlaceStatus | readonly PlaceStatus[];
  /** Keep the places in use in this year. A year that is not known for a place (no `from`, no `to`) does not shut it out. */
  year?: number;
  /** Words to find in any name (the everyday names, the aliases, the readings), the city or the club, or the name of a club that plays or played there (in English or in Japanese), ignoring case, accents, width and, in Japanese, hiragana or katakana; every word must be found. */
  text?: string;
}

const leaguesOfGround = (ground: Ground): string[] => {
  const leagues: string[] = [];
  if (ground.tournaments.some((t) => t.competition === "world-cup")) leagues.push("FIFA World Cup");
  if (ground.tournaments.some((t) => t.competition === "womens-world-cup")) leagues.push("FIFA Women's World Cup");
  return leagues;
};

const withoutRepeats = (...lists: readonly (readonly string[])[]): string[] => [...new Set(lists.flat())];

const fromPark = (park: Park): Place => {
  const tenants = TENANTS[park.id] ?? [];
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
    leagues: withoutRepeats([park.league], leaguesOf(tenants)),
    tenants,
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
  leagues: withoutRepeats(leaguesOf(TENANTS[ground.id] ?? []), leaguesOfGround(ground)),
  tenants: TENANTS[ground.id] ?? [],
  country: ground.country,
  city: ground.city,
  lat: ground.lat,
  lon: ground.lon,
  status: ground.status,
  ...(ground.from === undefined ? {} : { from: ground.from }),
  ...(ground.status === "past" && ground.to !== undefined ? { to: ground.to } : {}),
  wikidata: ground.wikidata,
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
      // A word may be in the name of any one club that played there.
      const clubs = place.tenants.map((tenant) => plain([tenant.club, tenant.clubJa].filter(Boolean).join(" ")));
      if (!words.every((word) => haystack.includes(word) || nameContainsAll(place, [word]) || clubs.some((club) => club.includes(word)))) return false;
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
 * console.log(sports.join(), leagues.length, leagues.includes("CFL"), countries.length, years.min);
 * // baseball,soccer 83 true 23 1877
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

/** The options `drawKyogijo` takes to draw a surface a place offers. */
export type PlaceSurface =
  | { sport: "mlb"; park: string }
  | { sport: "soccer"; ground?: string }
  | { sport: "nfl" | "cfl" | "nba" | "nhl" | "afl" | "cricket" }
  | { sport: "rugby"; league?: "nrl" };

/** The sports `surfaceOf` can be asked for. */
export type SurfaceSport = PlaceSurface["sport"];

/**
 * Every surface a place offers, the place's own first: a park's fence (`mlb` with the park) or a ground's pitch at its size (`soccer` with the ground), then one for each
 * sport a tenant plays that the package draws (a CFL field for BC Place, an NFL field for MetLife Stadium, the rugby league field for Stadium Australia), each once. A ground
 * offers no ballpark, since its fence is not known; a park that a soccer club has played in offers the pitch at the international size, since its length and width are not known.
 * @example
 * ```ts
 * import { placeById, surfacesOf } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
 * console.log(surfacesOf(placeById("bc-place")!).map((surface) => surface.sport).join());
 * // soccer,cfl
 * ```
 */
export function surfacesOf(place: Place): PlaceSurface[] {
  const own: PlaceSurface = place.kind === "park" ? { sport: "mlb", park: place.id } : { sport: "soccer", ground: place.id };
  const out: PlaceSurface[] = [own];
  for (const tenant of place.tenants) {
    const drawn = SURFACE_OF_SPORT[tenant.sport];
    if (drawn === undefined || !hasSurface(tenant)) continue;
    // A baseball club's fence is a park's: a ground has none to draw.
    if (drawn.sport === "mlb") continue;
    const surface: PlaceSurface = drawn.sport === "soccer" ? { sport: "soccer" } : drawn.sport === "rugby" ? { sport: "rugby", ...(drawn.league === undefined ? {} : { league: drawn.league }) } : { sport: drawn.sport };
    if (out.some((have) => have.sport === surface.sport && (have.sport !== "rugby" || (have as { league?: string }).league === (surface as { league?: string }).league))) continue;
    out.push(surface);
  }
  return out;
}

/**
 * The options `drawKyogijo` takes to draw a place's surface. With no sport, the place's own: a park's fence or a ground's pitch at its own size. With a sport (the `sport` of
 * `drawKyogijo`: `cfl`, `nfl`, `mlb`, `soccer`, `nba`, `nhl`, `rugby`, `afl`, `cricket`), the surface the place offers for it (`surfacesOf`), or `undefined` when no club that plays
 * that sport has played there: `surfaceOf(bcPlace, "cfl")` is `{ sport: "cfl" }` and `surfaceOf(fenwayPark, "cfl")` is `undefined`.
 * @example
 * ```ts
 * import { placeById, surfaceOf } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
 * const bcPlace = placeById("bc-place")!;
 * console.log(surfaceOf(bcPlace), surfaceOf(bcPlace, "cfl"), surfaceOf(bcPlace, "mlb"));
 * // { sport: 'soccer', ground: 'bc-place' } { sport: 'cfl' } undefined
 * ```
 */
export function surfaceOf(place: Place): { sport: "mlb"; park: string } | { sport: "soccer"; ground: string };
export function surfaceOf(place: Place, sport: SurfaceSport): PlaceSurface | undefined;
export function surfaceOf(place: Place, sport?: SurfaceSport): PlaceSurface | undefined {
  if (sport === undefined) return place.kind === "park" ? { sport: "mlb", park: place.id } : { sport: "soccer", ground: place.id };
  return surfacesOf(place).find((surface) => surface.sport === sport);
}

/** What `tenantsOf` keeps: every field given must match. */
export interface TenantFilter {
  /** Keep the clubs that played there in this year. A bound the data does not give does not shut a club out. */
  year?: number;
  league?: string | readonly string[];
  sport?: TenantSport | readonly TenantSport[];
  /** `true` keeps the clubs that play there still (no last year), `false` those that have left. */
  current?: boolean;
}

/**
 * The clubs that play, or played, their home matches in a place, the current ones first (by the year they came) and then those that have left (the latest to leave first).
 * Give a place, or its key.
 * @example
 * ```ts
 * import { placeById, tenantsOf } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
 * const expos = tenantsOf("olympic-stadium-montreal").map((t) => `${t.club} (${t.league}) ${t.from}-${t.to ?? ""}`);
 * console.log(expos[0], tenantsOf(placeById("bc-place")!, { current: true }).map((t) => t.club).join(", "));
 * // Montreal Expos (MLB) 1977-2004 BC Lions, Vancouver Whitecaps FC
 * ```
 */
export function tenantsOf(place: Place | string | undefined, filter: TenantFilter = {}): Tenant[] {
  const found = typeof place === "string" ? BY_ID.get(place) : place;
  if (found === undefined) return [];
  const leagues = many(filter.league);
  const sports = many(filter.sport);
  const year = filter.year !== undefined && Number.isFinite(filter.year) ? filter.year : undefined;
  return found.tenants.filter((tenant) => {
    if (leagues !== undefined && !leagues.includes(tenant.league)) return false;
    if (sports !== undefined && !sports.includes(tenant.sport)) return false;
    if (filter.current !== undefined && (tenant.to === undefined) !== filter.current) return false;
    return year === undefined || playedIn(tenant, year);
  });
}

/**
 * The places a club plays, or played, its home matches in, best match first: a club whose name is the one given (ignoring case, accents, spaces and punctuation, width, and in
 * Japanese hiragana or katakana), then a club whose name has every word given in it (`whitecaps`, `lions`, `ライオンズ`); the names are the club's in English and in Japanese.
 * @example
 * ```ts
 * import { placesByClub } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
 * console.log(placesByClub("BC Lions").map((place) => place.id).join(), placesByClub("Montreal Expos").map((place) => place.id).join());
 * // bc-place jarry-park-stadium,olympic-stadium-montreal
 * ```
 */
export function placesByClub(name: string | undefined): Place[] {
  if (name === undefined) return [];
  const wanted = plain(name);
  const words = name.split(/\s+/).map(plain).filter(Boolean);
  if (wanted === "") return [];
  const ranked: [number, number, Place][] = [];
  PLACES.forEach((place, index) => {
    let best: number | undefined;
    for (const tenant of place.tenants) {
      for (const club of [tenant.club, tenant.clubJa]) {
        if (club === undefined) continue;
        const own = plain(club);
        const rank = own === wanted ? 0 : words.every((word) => own.includes(word)) ? 1 : undefined;
        if (rank !== undefined && (best === undefined || rank < best)) best = rank;
      }
    }
    if (best !== undefined) ranked.push([best, index, place]);
  });
  return ranked.sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((row) => row[2]);
}
