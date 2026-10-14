import { TENANT_ARTICLES, TENANT_DATA, TENANT_NO_SURFACE } from "./tenants.data.ts";

/** The sport a tenant plays: what decides the surface a place offers for it (`surfaceOf`). */
export type TenantSport = "baseball" | "soccer" | "american-football" | "canadian-football" | "basketball" | "ice-hockey" | "rugby-union" | "rugby-league" | "australian-football" | "lacrosse" | "cricket";

/** The article of English Wikipedia, at a revision, that a place's tenants were read from. */
export interface TenantArticle {
  title: string;
  revision: number;
}

/** Where a tenant was read. */
export interface TenantSource {
  /** The Wikidata statement that names the club as a tenant (CC0): `P466` (the place lists the club as an occupant), `P115` (the club lists the place as its home venue), or both. Absent where only the article names it. */
  wikidata?: "P466" | "P115" | "P466 P115";
  /** The article and revision of English Wikipedia (CC BY-SA 4.0) whose `tenants` line in the place's infobox lists the club. Absent where only Wikidata names it. */
  wikipedia?: TenantArticle;
  /** Where the years were read: Wikidata's qualifiers (start time P580, end time P582), or the article. Absent when neither gives any. */
  years?: "wikidata" | "wikipedia";
}

/** A tenant as the data gives it. */
export interface TenantData {
  club: string;
  clubJa?: string;
  league: string;
  sport: TenantSport;
  from?: number;
  to?: number;
  wikidata: string;
  statements?: "P466" | "P115" | "P466 P115";
  /** The place's article lists the club in its tenants line. */
  listed?: true;
  years?: "wikidata" | "wikipedia";
}

/** A club that plays, or played, its home matches in a place, and when. */
export interface Tenant {
  /** The club's name in English: the one the place's article gives it (`Montreal Expos`, `Boston Braves` for a club named differently then), else Wikidata's label. */
  club: string;
  /** The club's name in Japanese, where Wikidata has one for this name of the club (`ブリティッシュ・コロンビア・ライオンズ`). */
  clubJa?: string;
  /** The league it played in there: `MLB`, `CFL`, `MLS`, `NPB`, `Premier League`... A league that has had several names or several seasons of the same name has one (`NASL` is the league of 1968 to 1984). */
  league: string;
  sport: TenantSport;
  /** The first year it played there. Not given where neither source gives it. */
  from?: number;
  /** The last year it played there: a club still there has none. */
  to?: number;
  /** The club's Wikidata item (`Q919062`), the key to join a tenant to other data. */
  wikidata: string;
  source: TenantSource;
}

const toTenant = (placeId: string, data: TenantData): Tenant => {
  const article = TENANT_ARTICLES[placeId];
  const source: TenantSource = {
    ...(data.statements === undefined ? {} : { wikidata: data.statements }),
    ...(data.listed === true && article !== undefined ? { wikipedia: article } : {}),
    ...(data.years === undefined ? {} : { years: data.years }),
  };
  return {
    club: data.club,
    ...(data.clubJa === undefined ? {} : { clubJa: data.clubJa }),
    league: data.league,
    sport: data.sport,
    ...(data.from === undefined ? {} : { from: data.from }),
    ...(data.to === undefined ? {} : { to: data.to }),
    wikidata: data.wikidata,
    source,
  };
};

/** The tenants of every place that has any, by the place's key: the current ones first, by the year they came, then those that have left, the latest to leave first. */
export const TENANTS: Readonly<Record<string, readonly Tenant[]>> = Object.freeze(Object.fromEntries(Object.entries(TENANT_DATA).map(([id, list]) => [id, Object.freeze(list.map((data) => toTenant(id, data)))])));

/** The leagues of a list of tenants, each once, in the order they first come. */
export const leaguesOf = (tenants: readonly Tenant[]): string[] => [...new Set(tenants.map((tenant) => tenant.league))];

/** True when a tenant played there in `year`; a year the data does not give for a bound does not shut it out. */
export const playedIn = (tenant: Tenant, year: number): boolean => (tenant.from === undefined || tenant.from <= year) && (tenant.to === undefined || year <= tenant.to);

/** The draw sport a tenant's sport is drawn as, and any league of its rulebook: the field of play a club's sport asks for. `undefined` where the package draws none. */
export const SURFACE_OF_SPORT: Readonly<Record<TenantSport, { sport: "mlb" | "soccer" | "nfl" | "cfl" | "nba" | "nhl" | "rugby" | "afl" | "cricket"; league?: "nrl" } | undefined>> = Object.freeze({
  baseball: { sport: "mlb" },
  soccer: { sport: "soccer" },
  "american-football": { sport: "nfl" },
  "canadian-football": { sport: "cfl" },
  basketball: { sport: "nba" },
  "ice-hockey": { sport: "nhl" },
  "rugby-union": { sport: "rugby" },
  "rugby-league": { sport: "rugby", league: "nrl" },
  "australian-football": { sport: "afl" },
  lacrosse: undefined,
  cricket: { sport: "cricket" },
});

/** True when the package draws a surface for the tenant's sport and league. */
export const hasSurface = (tenant: Tenant): boolean => SURFACE_OF_SPORT[tenant.sport] !== undefined && !TENANT_NO_SURFACE.includes(tenant.league);
