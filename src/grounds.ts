import { GROUND_DATA } from "./grounds.data.ts";
import { groundNameIn, groundOfficialName, groundSourceUrl, registerGrounds, type Ground, type GroundCompetition } from "./grounds.core.ts";
import { placesNamed } from "./names.ts";

// The grounds, all of them: this module holds every ground's data and registers it for the drawing, so that whoever imports it has every ground. The types and the functions that need no table are in `grounds.core.ts`.
export type { Ground, GroundCompetition, GroundData, GroundName, GroundSource, GroundTournament } from "./grounds.core.ts";
export { groundNameIn, groundOfficialName, groundSourceUrl };

/**
 * Every ground by its key: the venues of the men's World Cup finals and of the 2026 tournament, of the Women's World Cup finals,
 * and well-known club grounds, each with its pitch at its own size where the English article publishes one.
 * @example
 * ```ts
 * import { GROUNDS, GROUND_IDS } from "@johnmorrisdotca/kyogijo-stadiums/grounds";
 * const { name, city, pitch, pitchSize } = GROUNDS["old-trafford"];
 * console.log(name, city, pitch.length, pitch.width, pitchSize, GROUND_IDS.length);
 * // Old Trafford Manchester 105 68 published 64
 * ```
 */
export const GROUNDS: Readonly<Record<string, Ground>> = Object.freeze(Object.fromEntries(registerGrounds(GROUND_DATA).map((ground) => [ground.id, ground])));

/** The keys of `GROUNDS`: the men's World Cup final venues in order of the tournaments, the other venues of 2026, the Women's final venues not among them, then club grounds. */
export const GROUND_IDS: readonly string[] = Object.freeze(GROUND_DATA.map((data) => data.id));

/** The ground with a key, or `undefined`. */
export const groundById = (id: string | undefined): Ground | undefined => (id !== undefined && Object.prototype.hasOwnProperty.call(GROUNDS, id) ? GROUNDS[id] : undefined);

/**
 * The grounds that answer to a name, best match first: the everyday names, then the official and cited names, the sponsors' and the names the ground had in some years, then the
 * former names and the nicknames. A name is compared without case, accents, spaces or punctuation, in full-width or half-width, and in Japanese with hiragana or katakana and with
 * or without the long vowel mark.
 * @example
 * ```ts
 * import { groundByName, groundsByName } from "@johnmorrisdotca/kyogijo-stadiums/grounds";
 * console.log(groundByName("Giuseppe Meazza Stadium")?.id, groundByName("日産スタジアム")?.id, groundByName("Estadio Jornalista Mario Filho")?.id, groundsByName("stadium australia").length);
 * // san-siro nissan-stadium-yokohama maracana 1
 * ```
 */
export const groundsByName = (name: string | undefined): Ground[] => placesNamed(Object.values(GROUNDS), name);

/** The ground a name belongs to (see `groundsByName`; the best match when several answer to it), or `undefined`. */
export const groundByName = (name: string | undefined): Ground | undefined => groundsByName(name)[0];

/** The ground whose Wikidata item is `Q155174`, or `undefined`. */
export const groundByWikidata = (wikidata: string | undefined): Ground | undefined => Object.values(GROUNDS).find((ground) => ground.wikidata === wikidata);

/** The grounds of this list that staged matches of a World Cup, in the order of `GROUND_IDS`. */
export const groundsHosting = (competition: GroundCompetition, year: number): Ground[] => Object.values(GROUNDS).filter((ground) => ground.tournaments.some((t) => t.competition === competition && t.year === year));

