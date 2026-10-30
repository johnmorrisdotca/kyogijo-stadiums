// The surroundings of the venues of Vancouver and Seattle: which area of `cityctx.data.ts` goes with a choice of venues. Pure: the venues' ids in, the areas to pass as a district's `context` out.
import type { ContextArea } from "./context.ts";
import { SEATTLE_CENTER, SEATTLE_CITY, SEATTLE_SODO, VANCOUVER_NATURE } from "./cityctx.data.ts";
import { VANCOUVER_CENTRE } from "./osm.context.data.ts";
import { CITYCTX_DETAIL, CITYCTX_VENUES, MOST_DETAIL_AREAS } from "./areas.ts";
import { BELMONT_PARK } from "./cityctx.belmont-park.data.ts";
import { MEADOWLANDS } from "./cityctx.meadowlands.data.ts";
import { MONTREAL_CITY } from "./cityctx.montreal-city.data.ts";
import { MONTREAL_DOWNTOWN } from "./cityctx.montreal-downtown.data.ts";
import { MONTREAL_OLYMPIC } from "./cityctx.montreal-olympic.data.ts";
import { NYC_BRONX } from "./cityctx.nyc-bronx.data.ts";
import { NYC_BROOKLYN } from "./cityctx.nyc-brooklyn.data.ts";
import { NYC_FLUSHING } from "./cityctx.nyc-flushing.data.ts";
import { NYC_MIDTOWN } from "./cityctx.nyc-midtown.data.ts";

/** The venues each area is drawn round, by their ids (the part of a district's key before the colon). */
export { CITYCTX_VENUES };

/**
 * The areas of context that go with some venues, for a district's `context` option: downtown Vancouver's buildings and streets (`VANCOUVER_CENTRE`, of `./osm`) with its water, green and trees (`VANCOUVER_NATURE`) for BC Place and
 * Rogers Arena; Seattle's SoDo for Lumen Field and T-Mobile Park, Seattle Center's for Climate Pledge Arena, and the city's own, with streets and the buildings that matter from far, for a district that holds venues of both (they are
 * three kilometres apart, so the detail of either would be a speck). A venue of neither city has none. This one carries every area's data; `loadAreasFor` of the `areas` entry reads only the ones asked for.
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
  const detail: Record<string, ContextArea> = { "nyc-midtown": NYC_MIDTOWN, "nyc-bronx": NYC_BRONX, "nyc-flushing": NYC_FLUSHING, "nyc-brooklyn": NYC_BROOKLYN, "meadowlands": MEADOWLANDS, "belmont-park": BELMONT_PARK, "montreal-downtown": MONTREAL_DOWNTOWN, "montreal-olympic": MONTREAL_OLYMPIC };
  const montreal = ["montreal-downtown", "montreal-olympic"].filter((key) => has(CITYCTX_DETAIL[key]));
  if (montreal.length === 2) areas.push(MONTREAL_CITY);
  else areas.push(...montreal.map((key) => detail[key]));
  const york = Object.entries(CITYCTX_DETAIL).filter(([key, list]) => !key.startsWith("montreal") && has(list)).map(([key]) => key);
  if (york.length <= MOST_DETAIL_AREAS) areas.push(...york.map((key) => detail[key]));
  return areas;
}
