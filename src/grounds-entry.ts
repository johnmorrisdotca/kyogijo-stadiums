// The soccer grounds: their pitches at their own size, names, places and the World Cups they staged, with the article each was read from.
// The words in both languages, as this entry has always carried them (the lean district reads one language when it is asked to).
import "./strings.ts";
export { GROUND_IDS, GROUNDS, groundById, groundByName, groundByWikidata, groundNameIn, groundOfficialName, groundSourceUrl, groundsByName, groundsHosting } from "./grounds.ts";
export { officialName, plainName } from "./names.ts";
export type { PlaceAlias, PlaceNameKind } from "./names.ts";
export type { Ground, GroundCompetition, GroundData, GroundName, GroundSource, GroundTournament } from "./grounds.ts";
