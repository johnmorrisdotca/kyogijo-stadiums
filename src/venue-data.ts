// The data of the venues a page shows, one file each, read when asked for. The drawing reads an arena, a park or a ground from a table (`heldArena`, `heldPark`, `heldGround`) that the full lists fill (`full.ts`, which every
// entry but the lean district imports); a page that imports the lean district holds none until `loadVenueDataFor` has read the files of the venues it is about to draw. Nothing here holds a record: `arenas.index.ts`, `parks.index.ts`
// and `grounds.index.ts` list every key with its names and the `import()` of its file, and the files are `arenas/<key>.data.ts` and so on, made by `pnpm arenas`, `pnpm parks` and `pnpm grounds`.
import { registerArenas, type Arena } from "./arenas.core.ts";
import { ARENA_INDEX } from "./arenas.index.ts";
import { registerGrounds, type Ground } from "./grounds.core.ts";
import { GROUND_INDEX } from "./grounds.index.ts";
import { registerParks, type Park } from "./parks.core.ts";
import { PARK_INDEX } from "./parks.index.ts";
import { KODOKAN_NAME } from "./kodokan.ts";
import { STADIUMS, stadiumKind } from "./stadiums.ts";
import type { Language } from "./types.ts";

type Index = Readonly<Record<string, { readonly name: string; readonly nameJa: string }>>;

/** The files read, by kind and key, each once: asking again gives the same promise, and one that failed (the network) is asked for again next time. */
const kept = new Map<string, Promise<unknown>>();
function read<T>(kind: string, index: Readonly<Record<string, { readonly load: () => Promise<unknown> }>>, id: string, keep: (module: never) => T): Promise<T> {
  const key = `${kind}:${id}`;
  const found = kept.get(key);
  if (found !== undefined) return found as Promise<T>;
  const entry = Object.hasOwn(index, id) ? index[id] : undefined;
  if (entry === undefined) return Promise.reject(new Error(`no ${kind} ${JSON.stringify(id)}: the ${kind}s are ${Object.keys(index).join(", ")}`));
  const promise = entry.load().then(keep as (module: unknown) => T);
  kept.set(key, promise);
  promise.catch(() => kept.delete(key));
  return promise;
}

/**
 * An arena by its key, read from its own file the first time and held for the drawing after: asking again gives the same promise. A key that is not an arena rejects, naming the keys there are.
 * @example
 * ```ts
 * import { loadArena } from "@johnmorrisdotca/kyogijo-stadiums/venue-data";
 * const arena = await loadArena("rogers-arena");
 * console.log(arena.name, arena.city);
 * // Rogers Arena Vancouver
 * ```
 */
export const loadArena = (id: string): Promise<Arena> => read("arena", ARENA_INDEX, id, (m: { ARENA: Parameters<typeof registerArenas>[0][number] }) => registerArenas([m.ARENA])[0]);

/** A park by its key, read from its own file the first time and held for the drawing after (see `loadArena`). */
export const loadPark = (id: string): Promise<Park> => read("park", PARK_INDEX, id, (m: { PARK: Parameters<typeof registerParks>[0][number] }) => registerParks([m.PARK])[0]);

/** A ground by its key, read from its own file the first time and held for the drawing after (see `loadArena`). */
export const loadGround = (id: string): Promise<Ground> => read("ground", GROUND_INDEX, id, (m: { GROUND: Parameters<typeof registerGrounds>[0][number] }) => registerGrounds([m.GROUND])[0]);

/** The keys of the arenas, parks and grounds whose records the drawing of some venues reads. */
export interface VenueDataKeys {
  arenas: string[];
  parks: string[];
  grounds: string[];
}

/**
 * The records the drawing of some venues of a district reads, by kind: an arena's own, a ballpark's park, a stadium's ground, and nothing for a hall (which carries its own names) or the Kodokan. The keys are a district's (`rogers-arena`,
 * `bc-place:cfl`).
 * @example
 * ```ts
 * import { venueDataKeysFor } from "@johnmorrisdotca/kyogijo-stadiums/venue-data";
 * console.log(venueDataKeysFor(["rogers-arena", "bc-place:cfl", "t-mobile-park:mlb"]));
 * // { arenas: [ 'rogers-arena' ], parks: [ 't-mobile-park' ], grounds: [ 'bc-place' ] }
 * ```
 */
export function venueDataKeysFor(venues: readonly string[]): VenueDataKeys {
  const keys: VenueDataKeys = { arenas: [], parks: [], grounds: [] };
  const add = (list: string[], id: string | undefined): void => {
    if (id !== undefined && !list.includes(id)) list.push(id);
  };
  for (const venue of venues) {
    const id = venue.split(":")[0];
    const stadium = Object.hasOwn(STADIUMS, id) ? STADIUMS[id] : undefined;
    if (stadium !== undefined) {
      const kind = stadiumKind(stadium);
      if (kind === "park") add(keys.parks, stadium.park);
      else if (kind === "stadium") add(keys.grounds, stadium.ground);
    } else if (Object.hasOwn(ARENA_INDEX, id)) add(keys.arenas, id);
  }
  return keys;
}

/**
 * The records of the venues a page is about to draw, each read from its own file and no other, and held for the drawing: what `planDistrict`, `drawDistrict` and `mountDistrictTurn` of the lean district read. Await it before the
 * first call and again when the venues change; a venue whose records are held is not read twice.
 * @example
 * ```ts
 * import { loadVenueDataFor, planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district-lean";
 * const venues = ["bc-place:cfl", "rogers-arena"];
 * await loadVenueDataFor(venues);
 * console.log(planDistrict({ venues }).members.length);
 * // 2
 * ```
 */
export async function loadVenueDataFor(venues: readonly string[]): Promise<void> {
  const keys = venueDataKeysFor(venues);
  await Promise.all([...keys.arenas.map(loadArena), ...keys.parks.map(loadPark), ...keys.grounds.map(loadGround)]);
}

const nameIn = (index: Index, id: string | undefined, language: Language): string | undefined => (id !== undefined && Object.hasOwn(index, id) ? (language === "ja" ? index[id].nameJa : index[id].name) : undefined);

/**
 * The name of a venue of a district in a language, from the lists of names alone: no record is read, so a page can list every venue to choose from and read only the records of those chosen. It is the name `districtMember(key, language).name[language]` gives.
 * `undefined` for a key that is not a venue of a district.
 * @example
 * ```ts
 * import { venueName } from "@johnmorrisdotca/kyogijo-stadiums/venue-data";
 * console.log(venueName("rogers-arena", "en"), venueName("bc-place:cfl", "ja"));
 * // Rogers Arena BCプレイス
 * ```
 */
export function venueName(key: string, language: Language = "en"): string | undefined {
  const id = key.split(":")[0];
  if (id === "kodokan") return KODOKAN_NAME[language];
  const stadium = Object.hasOwn(STADIUMS, id) ? STADIUMS[id] : undefined;
  if (stadium === undefined) return nameIn(ARENA_INDEX, id, language);
  const kind = stadiumKind(stadium);
  if (kind === "hall") return stadium.names === undefined ? undefined : stadium.names[language];
  return kind === "park" ? nameIn(PARK_INDEX, stadium.park, language) : nameIn(GROUND_INDEX, stadium.ground, language);
}
