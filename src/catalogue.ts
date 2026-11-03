// The catalogue: every venue the package draws today (supported), the ones being built (working on) and the ones wanted, with their facts, in one list. The same data is published as a static
// file, `catalogue.json`, in the npm package and on the demo's site (`CATALOGUE_ADDRESS`). There is no server: a reader fetches the file or imports this entry.
import { CATALOGUE_DATA } from "./catalogue.data.ts";
import type { CatalogueCoverage, CatalogueData, CatalogueEntry, CatalogueGroup, CatalogueLeague, CatalogueSport, CatalogueStatus } from "./catalogue.types.ts";

/** Every venue: the supported ones first, then those being built, then the wanted ones, each group in its order. */
export const CATALOGUE: readonly CatalogueEntry[] = CATALOGUE_DATA.venues;

/** The leagues (every venue of the season, NBA, MLB, NFL, CFL and NHL) and the collections of the Working on and Wanted sections, each with its venues in order and its name in both languages. */
export const CATALOGUE_GROUPS: readonly CatalogueGroup[] = CATALOGUE_DATA.groups;

/** The sports, with their names in both languages and the `sport` of `drawKyogijo` that draws each (`null`: not drawn yet). */
export const CATALOGUE_SPORTS: CatalogueData["sports"] = CATALOGUE_DATA.sports;

/** The countries of the catalogue by ISO code, with their names in English and Japanese (Wikidata's labels). */
export const CATALOGUE_COUNTRIES: CatalogueData["countries"] = CATALOGUE_DATA.countries;

/** Where `catalogue.json` is published: the same data as this entry, for a page or a program that does not install the package. */
export const CATALOGUE_ADDRESS: string = CATALOGUE_DATA.address;

/** The demo's address: a supported venue's `demo` is relative to it. */
export const CATALOGUE_SITE: string = CATALOGUE_DATA.site;

/** The counts, the day the sources were read and where they are kept, and the licence of the facts. */
export const CATALOGUE_ABOUT: Pick<CatalogueData, "schemaVersion" | "generatedAt" | "package" | "licence" | "source" | "counts"> = {
  schemaVersion: CATALOGUE_DATA.schemaVersion,
  generatedAt: CATALOGUE_DATA.generatedAt,
  package: CATALOGUE_DATA.package,
  licence: CATALOGUE_DATA.licence,
  source: CATALOGUE_DATA.source,
  counts: CATALOGUE_DATA.counts,
};

const BY_ID = new Map(CATALOGUE.map((entry) => [entry.id, entry]));

/**
 * A venue by its id, or `undefined`.
 * @example
 * ```ts
 * import { catalogueById } from "@johnmorrisdotca/kyogijo-stadiums/catalogue";
 * const ashe = catalogueById("arthur-ashe-stadium")!;
 * console.log(ashe.status, ashe.ticket, ashe.wikidata);
 * // working-on KYOGIJO-STADIUMS-22 Q609551
 * ```
 */
export function catalogueById(id: string): CatalogueEntry | undefined {
  return BY_ID.get(id);
}

/** The venues of a status, in the catalogue's order. */
export function catalogueByStatus(status: CatalogueStatus): CatalogueEntry[] {
  return CATALOGUE.filter((entry) => entry.status === status);
}

/** The venues of a sport (any of a venue's sports), in the catalogue's order. */
export function catalogueBySport(sport: CatalogueSport): CatalogueEntry[] {
  return CATALOGUE.filter((entry) => entry.sports.includes(sport));
}

/** The venues of a group (a league or a collection), in the group's order; empty for a group that does not exist. */
export function catalogueByGroup(group: string): CatalogueEntry[] {
  return (CATALOGUE_GROUPS.find((one) => one.id === group)?.ids ?? []).map((id) => BY_ID.get(id)).filter((entry): entry is CatalogueEntry => entry !== undefined);
}

/** Every venue whose building or whole venue is wanted: the venues of the Wanted section and the supported venues of a league or a collection that are drawn as a surface only. */
export function catalogueWanted(): CatalogueEntry[] {
  return CATALOGUE.filter((entry) => entry.want !== undefined && entry.status !== "working-on");
}

/**
 * How much of a league the package draws: its venues this season, how many in their buildings, how many as a field only, how many not yet.
 * @example
 * ```ts
 * import { catalogueCoverage } from "@johnmorrisdotca/kyogijo-stadiums/catalogue";
 * const nhl = catalogueCoverage("nhl");
 * console.log(nhl.venues, nhl.outline, nhl.notYet);
 * // 32 32 0
 * ```
 */
export function catalogueCoverage(league: CatalogueLeague): CatalogueCoverage {
  const venues = catalogueByGroup(league);
  return {
    league,
    venues: venues.length,
    outline: venues.filter((entry) => entry.drawn === "outline").length,
    surface: venues.filter((entry) => entry.drawn === "surface").length,
    notYet: venues.filter((entry) => entry.status !== "supported").length,
  };
}
