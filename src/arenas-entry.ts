// The arenas of the NHL, the NBA, the WNBA and the PWHL: where each stands, when it was in use, its names, its seats for each sport and the size of its rink or court where the sources publish one.
// The words in both languages, as this entry has always carried them (the lean district reads one language when it is asked to).
import "./strings.ts";
export { ARENA_IDS, ARENAS, arenaById, arenaByName, arenaByWikidata, arenaCourtIn, arenaNameIn, arenaOfficialName, arenaRinkIn, arenaSourceUrl, arenasByName } from "./arenas.ts";
export { officialName, plainName } from "./names.ts";
export type { PlaceAlias, PlaceNameKind } from "./names.ts";
export type { Arena, ArenaCapacity, ArenaData, ArenaName, ArenaSize, ArenaSource } from "./arenas.ts";
