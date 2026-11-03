// The catalogue's types: what `catalogue.json` holds and what `@johnmorrisdotca/kyogijo-stadiums/catalogue` exports. The data is made by `pnpm catalogue` (scripts/build-catalogue.mjs).
import type { PlaceSurface } from "./atlas.ts";

/** Where a venue stands with the package: drawn today, being built (an open ticket), or wanted. */
export type CatalogueStatus = "supported" | "working-on" | "wanted";

/**
 * How a supported venue is drawn: `outline`, inside the outline of its real building with a bowl of its seats (`STADIUMS` and the NHL's `VENUES`), or `surface`, its field, court, rink, park or
 * floor only, at the venue's own size where the data gives one (a key of `PARKS`, `GROUNDS`, `ARENAS` or `HALLS`), or `circuit`, the lap as OpenStreetMap maps it with its pit lane and no stands
 * (a key of `CIRCUITS`, drawn by `drawCircuit` of the `circuits` entry).
 */
export type CatalogueDrawn = "outline" | "surface" | "circuit";

/** What is wanted of a venue: its building's `outline` (a venue drawn today as a surface only), or the `venue` itself (one the package does not draw at all). */
export type CatalogueWant = "outline" | "venue";

/** What has to exist before a wanted venue can be drawn: a `circuit-surface` for motor racing, which the package does not draw yet. */
export type CatalogueNeed = "circuit-surface";

/** The sports of the catalogue, in kebab case. Every one but `motor-racing` names a surface the package draws (`CATALOGUE_SPORTS[sport].surface`). */
export type CatalogueSport =
  | "baseball"
  | "basketball"
  | "hockey"
  | "american-football"
  | "canadian-football"
  | "soccer"
  | "cricket"
  | "rugby"
  | "australian-football"
  | "gaelic-games"
  | "tennis"
  | "budo"
  | "athletics"
  | "swimming"
  | "skating"
  | "curling"
  | "volleyball"
  | "badminton"
  | "handball"
  | "boxing"
  | "motor-racing";

/** The leagues whose every venue of the season is in the catalogue. */
export type CatalogueLeague = "nba" | "mlb" | "nfl" | "cfl" | "nhl";

/** A club that plays its home games at a venue this season. */
export interface CatalogueTeam {
  name: string;
  nameJa?: string;
  league: CatalogueLeague;
}

/** The options that draw a supported venue with `drawKyogijo`: its surface (a park, a ground, an arena or a hall), or its real building (`stadium` or `arena` with `crowd: { real: true }`). */
export type CatalogueDraw = PlaceSurface | { sport: "nfl" | "cfl" | "soccer" | "mlb" | "boxing" | "nba" | "nhl"; stadium?: string; park?: string; arena?: string; crowd: { real: true } };

/** One venue of the catalogue. */
export interface CatalogueEntry {
  /** Kebab case, unique: the package's own key for a venue it draws (`fenway-park`, `bc-place`), else one made from the venue's English name. */
  id: string;
  status: CatalogueStatus;
  /** How a supported venue is drawn. */
  drawn?: CatalogueDrawn;
  /** What is wanted: the building's outline of a venue drawn as a surface that a league or a group lists, or the venue itself. */
  want?: CatalogueWant;
  /** What must be built first. */
  needs?: CatalogueNeed;
  /** Which of the package's lists a supported venue comes from: a real stadium or NHL venue (`stadium`, `venue`), or a `park`, `ground`, `arena` or `hall`. */
  kind?: "stadium" | "venue" | "park" | "ground" | "arena" | "hall" | "circuit";
  /** The everyday name in English. */
  name: string;
  /** The name in Japanese; absent where no source gives one (`missing.nameJa` says so). */
  nameJa?: string;
  /** Where the Japanese name was read: the package's own data, Wikidata's label, the title of the Japanese Wikipedia's article, or a name a reviewer checked. */
  nameJaFrom?: "package" | "wikidata" | "jawiki" | "reviewed";
  city?: string;
  cityJa?: string;
  /** ISO 3166-1 alpha-2. */
  country?: string;
  /** Wikidata's coordinates (P625), in degrees. */
  lat?: number;
  lon?: number;
  sports: CatalogueSport[];
  /** The Wikidata item. */
  wikidata: string;
  /** The seats, where Wikidata gives one figure (P1083), for a venue that is not drawn yet. */
  capacity?: number;
  /** `current` or `past`, for a supported venue. */
  era?: "current" | "past";
  /** The leagues that play there this season, and their clubs. */
  leagues?: CatalogueLeague[];
  teams?: CatalogueTeam[];
  /** The groups the venue is listed in (a league, a collection of the Wanted section). */
  groups: string[];
  /** The ticket of a venue being built. */
  ticket?: string;
  /** The options that draw a supported venue with `drawKyogijo` (a circuit has none: `drawCircuit({ circuit: id })` of the `circuits` entry draws it). */
  draw?: CatalogueDraw;
  /** The demo page that shows a supported venue, relative to the demo's address (`CATALOGUE_SITE`). */
  demo?: string;
  /** The facts left out, each with why. */
  missing?: Partial<Record<"nameJa" | "city" | "country" | "coordinates", string>>;
}

/** A group: a league (every venue of its season) or a collection of the Wanted or Working on section, in its order. */
export interface CatalogueGroup {
  id: string;
  kind: "league" | "collection";
  en: string;
  ja: string;
  /** For a league: its sport and its season. */
  sport?: CatalogueSport;
  season?: string;
  /** For a collection that is being built. */
  status?: "working-on";
  needs?: CatalogueNeed;
  ids: string[];
}

/** The whole catalogue, as `catalogue.json` holds it. */
export interface CatalogueData {
  /** The shape's version: a change that breaks a reader raises it. */
  schemaVersion: 1;
  /** The day the sources were read (not the day the file was written). */
  generatedAt: string;
  package: { name: string; version: string };
  /** Where the JSON is published. */
  address: string;
  /** The demo's address, which `demo` is relative to. */
  site: string;
  licence: string;
  source: { read: string; rawAnswers: string; articles: Record<string, number> };
  counts: { supported: number; outline: number; surface: number; circuit: number; workingOn: number; wanted: number; outlineWanted: number };
  sports: Record<CatalogueSport, { en: string; ja: string; surface: string | null }>;
  groups: CatalogueGroup[];
  countries: Record<string, { en: string; ja?: string }>;
  venues: CatalogueEntry[];
}

/** How many venues of a league the package draws in their buildings, as a surface only, or not at all. */
export interface CatalogueCoverage {
  league: CatalogueLeague;
  venues: number;
  outline: number;
  surface: number;
  notYet: number;
}
