// The surroundings of the venues of Vancouver and Seattle: which area of `cityctx.data.ts` goes with a choice of venues. Pure: the venues' ids in, the areas to pass as a district's `context` out.
import type { ContextArea } from "./context.ts";
import { SEATTLE_CENTER, SEATTLE_CITY, SEATTLE_SODO, VANCOUVER_NATURE } from "./cityctx.data.ts";
import { VANCOUVER_CENTRE } from "./osm.context.data.ts";

/** The venues each area is drawn round, by their ids (the part of a district's key before the colon). */
export const CITYCTX_VENUES = Object.freeze({
  vancouver: ["bc-place", "rogers-arena"],
  sodo: ["lumen-field", "t-mobile-park"],
  center: ["climate-pledge-arena"],
});

/**
 * The areas of context that go with some venues, for a district's `context` option: downtown Vancouver's buildings and streets (`VANCOUVER_CENTRE`, of `./osm`) with its water, green and trees (`VANCOUVER_NATURE`) for BC Place and
 * Rogers Arena; Seattle's SoDo for Lumen Field and T-Mobile Park, Seattle Center's for Climate Pledge Arena, and the city's own, with streets and the buildings that matter from far, for a district that holds venues of both (they are
 * three kilometres apart, so the detail of either would be a speck). A venue of neither city has none.
 * @example
 * ```ts
 * import { contextFor } from "@johnmorrisdotca/kyogijo-stadiums/cityctx";
 * console.log(contextFor(["bc-place:cfl", "rogers-arena"]).map((area) => area.key));
 * // [ 'vancouver', 'vancouver-nature' ]
 * ```
 */
export function contextFor(venues: readonly string[]): ContextArea[] {
  const ids = new Set(venues.map((key) => key.split(":")[0]));
  const has = (list: readonly string[]): boolean => list.some((id) => ids.has(id));
  const areas: ContextArea[] = [];
  if (has(CITYCTX_VENUES.vancouver)) areas.push(VANCOUVER_CENTRE, VANCOUVER_NATURE);
  const [sodo, center] = [has(CITYCTX_VENUES.sodo), has(CITYCTX_VENUES.center)];
  if (sodo && center) areas.push(SEATTLE_CITY);
  else if (sodo) areas.push(SEATTLE_SODO);
  else if (center) areas.push(SEATTLE_CENTER);
  return areas;
}
