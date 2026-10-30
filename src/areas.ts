// The areas of context, one file of data each, and which ones go with a choice of venues. Nothing here holds a row of data: an area's file is read with a dynamic `import()` when the area is asked for, so a page that
// shows Vancouver carries Vancouver's buildings and none of Seattle's or Tokyo's, and the package's entries that do not ask for an area carry none. The data itself is in `osm.context.data.ts`, `cityctx.<area>.data.ts`
// and `plateau.data.ts`, and the entries `osm`, `cityctx` and `plateau` still export it, all at once, for a caller that wants it so.
import type { ContextArea } from "./context.ts";

/** The venues each area of Vancouver and Seattle is drawn round, by their ids (the part of a district's key before the colon). */
export const CITYCTX_VENUES = Object.freeze({
  vancouver: ["bc-place", "rogers-arena"],
  sodo: ["lumen-field", "t-mobile-park"],
  center: ["climate-pledge-arena"],
});

/** The venues of Tokyo Dome City, round which Project PLATEAU's buildings are drawn (the Kodokan stands a little way off, inside the area). */
export const TOKYO_VENUES: readonly string[] = Object.freeze(["tokyo-dome", "korakuen-hall", "kodokan"]);

/** The key of every area there is data for, in the order a district draws them: each is one file. */
export const AREA_KEYS: readonly string[] = Object.freeze(["vancouver", "vancouver-nature", "seattle-sodo", "seattle-center", "seattle-city", "tokyo-dome-city"]);

/** Each area's loader: the one `import()` of the one file that holds it. */
const LOADERS: Readonly<Record<string, () => Promise<ContextArea>>> = {
  "vancouver": async () => (await import("./osm.context.data.ts")).VANCOUVER_CENTRE,
  "vancouver-nature": async () => (await import("./cityctx.vancouver-nature.data.ts")).VANCOUVER_NATURE,
  "seattle-sodo": async () => (await import("./cityctx.seattle-sodo.data.ts")).SEATTLE_SODO,
  "seattle-center": async () => (await import("./cityctx.seattle-center.data.ts")).SEATTLE_CENTER,
  "seattle-city": async () => (await import("./cityctx.seattle-city.data.ts")).SEATTLE_CITY,
  "tokyo-dome-city": async () => (await import("./plateau.data.ts")).TOKYO_DOME_CITY,
};

/**
 * The keys of the areas that go with some venues, in the order to draw them: downtown Vancouver's buildings and streets and its water, green and trees for BC Place and Rogers Arena; Seattle's SoDo for Lumen Field and
 * T-Mobile Park, Seattle Center's for Climate Pledge Arena, and the city's own for a district that holds venues of both (they are three kilometres apart, so the detail of either would be a speck); Tokyo Dome City's for
 * Tokyo Dome, Korakuen Hall and the Kodokan, which take it before any other. A venue of none of these has no area.
 * @example
 * ```ts
 * import { areaKeysFor } from "@johnmorrisdotca/kyogijo-stadiums/areas";
 * console.log(areaKeysFor(["bc-place:cfl", "rogers-arena"]));
 * // [ 'vancouver', 'vancouver-nature' ]
 * ```
 */
export function areaKeysFor(venues: readonly string[]): string[] {
  const ids = new Set(venues.map((key) => key.split(":")[0]));
  const has = (list: readonly string[]): boolean => list.some((id) => ids.has(id));
  if (has(TOKYO_VENUES)) return ["tokyo-dome-city"];
  const keys: string[] = [];
  if (has(CITYCTX_VENUES.vancouver)) keys.push("vancouver", "vancouver-nature");
  const [sodo, center] = [has(CITYCTX_VENUES.sodo), has(CITYCTX_VENUES.center)];
  if (sodo && center) keys.push("seattle-city");
  else if (sodo) keys.push("seattle-sodo");
  else if (center) keys.push("seattle-center");
  return keys;
}

const loaded = new Map<string, Promise<ContextArea>>();

/**
 * One area by its key (`AREA_KEYS`), read from its own file the first time and kept after: asking again gives the same promise. A key that is not an area rejects, naming the keys there are.
 * @example
 * ```ts
 * import { loadArea } from "@johnmorrisdotca/kyogijo-stadiums/areas";
 * const area = await loadArea("seattle-sodo");
 * console.log(area.key, area.radius);
 * ```
 */
export function loadArea(key: string): Promise<ContextArea> {
  const kept = loaded.get(key);
  if (kept !== undefined) return kept;
  const load = Object.hasOwn(LOADERS, key) ? LOADERS[key] : undefined;
  if (load === undefined) return Promise.reject(new Error(`no area of context ${JSON.stringify(key)}: the areas are ${AREA_KEYS.join(", ")}`));
  const promise = load().catch((error: unknown) => {
    // A file that did not come (the network) is asked for again next time, not remembered as failed.
    loaded.delete(key);
    throw error;
  });
  loaded.set(key, promise);
  return promise;
}

/**
 * The areas that go with some venues, for a district's `context` option, each read from its own file and no other: what `contextFor` of the `cityctx` entry gives, and Tokyo Dome City's too, without carrying every area's data to
 * get them.
 * @example
 * ```ts
 * import { loadAreasFor } from "@johnmorrisdotca/kyogijo-stadiums/areas";
 * import { planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const venues = ["bc-place:cfl", "rogers-arena"];
 * const plan = planDistrict({ venues, context: await loadAreasFor(venues) });
 * console.log(plan.context?.attribution.en.length);
 * ```
 */
export function loadAreasFor(venues: readonly string[]): Promise<ContextArea[]> {
  return Promise.all(areaKeysFor(venues).map(loadArea));
}
