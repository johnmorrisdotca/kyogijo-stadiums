import { ARENA_DATA } from "./arenas.data.ts";
import { arenaCourtIn, arenaNameIn, arenaOfficialName, arenaRinkIn, arenaSourceUrl, registerArenas, type Arena } from "./arenas.core.ts";
import { placesNamed } from "./names.ts";

// The arenas, all of them: this module holds every arena's data and registers it for the drawing, so that whoever imports it has every arena. The types and the functions that need no table are in `arenas.core.ts`.
export type { Arena, ArenaCapacity, ArenaData, ArenaName, ArenaSize, ArenaSource } from "./arenas.core.ts";
export { arenaCourtIn, arenaNameIn, arenaOfficialName, arenaRinkIn, arenaSourceUrl };

/**
 * Every arena by its key: the homes of the NHL's, the NBA's, the WNBA's and the PWHL's clubs, today's and the old ones, each with where it stands, when it was in use, its names,
 * its seats for each sport and, where the sources publish one that differs from the league's, the size of its rink or its court.
 * @example
 * ```ts
 * import { ARENAS } from "@johnmorrisdotca/kyogijo-stadiums/arenas";
 * const garden = ARENAS["boston-garden"];
 * console.log(garden.name, garden.city, garden.from, garden.to, garden.capacity?.hockey);
 * // Boston Garden Boston 1928 1995 14448
 * ```
 */
export const ARENAS: Readonly<Record<string, Arena>> = Object.freeze(Object.fromEntries(registerArenas(ARENA_DATA).map((data) => [data.id, data])));

/** The keys of `ARENAS`, in the order of the data: the arenas in use first, then those of the past. */
export const ARENA_IDS: readonly string[] = Object.freeze(ARENA_DATA.map((data) => data.id));

/** The arena with a key, or `undefined`. */
export const arenaById = (id: string | undefined): Arena | undefined => (id !== undefined && Object.prototype.hasOwnProperty.call(ARENAS, id) ? ARENAS[id] : undefined);

/** The arenas that answer to a name, best match first (see `placesByName`): the everyday names, then the official and cited names, then the former names and the nicknames. */
export const arenasByName = (name: string | undefined): Arena[] => placesNamed(Object.values(ARENAS), name);

/** The arena a name belongs to (the best match when several answer to it), or `undefined`. */
export const arenaByName = (name: string | undefined): Arena | undefined => arenasByName(name)[0];

/** The arena whose Wikidata item is `Q894567`, or `undefined`. */
export const arenaByWikidata = (wikidata: string | undefined): Arena | undefined => Object.values(ARENAS).find((arena) => arena.wikidata === wikidata);

