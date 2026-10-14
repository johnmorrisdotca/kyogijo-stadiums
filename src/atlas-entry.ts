// The atlas: every ballpark and soccer ground with where it stands, when it was in use and the clubs that played there, and the filters over them.
export { PLACES, atlasFacets, placeById, placeByName, placesBy, placesByClub, placesByName, surfaceOf, surfacesOf, tenantsOf } from "./atlas.ts";
export { officialName, plainName } from "./names.ts";
export { TENANTS } from "./tenants.ts";
export type { PlaceAlias, PlaceNameKind } from "./names.ts";
export type { AtlasFacets, Place, PlaceFilter, PlaceKind, PlaceSport, PlaceStatus, PlaceSurface, SurfaceSport, TenantFilter } from "./atlas.ts";
export type { Tenant, TenantArticle, TenantSource, TenantSport } from "./tenants.ts";
