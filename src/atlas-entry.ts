// The atlas: every ballpark, soccer ground and hockey and basketball arena, and the famous halls of the budō, with where it stands, when it was in use and the clubs that played there, and the filters over them.
// The words in both languages, as this entry has always carried them (the lean district reads one language when it is asked to).
import "./strings.ts";
export { PLACES, atlasFacets, hallSurfaces, placeById, placeByName, placesBy, placesByClub, placesByName, surfaceOf, surfacesOf, tenantsOf } from "./atlas.ts";
export { HALLS } from "./halls.ts";
export type { Hall, HallBasis, HallSurface } from "./halls.ts";
export { officialName, plainName } from "./names.ts";
export { TENANTS, TENANT_JAPANESE_NAMES, nameJaOf } from "./tenants.ts";
export type { PlaceAlias, PlaceNameKind } from "./names.ts";
export type { AtlasFacets, Place, PlaceFilter, PlaceKind, PlaceSport, PlaceStatus, PlaceSurface, SurfaceSport, TenantFilter } from "./atlas.ts";
export type { Tenant, TenantArticle, TenantNameJa, TenantNameKind, TenantSource, TenantSport } from "./tenants.ts";
