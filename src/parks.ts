import { PARK_DATA } from "./parks.data.ts";
import { parkNameIn, parkOfficialName, parkPointsIn, parkQuirksIn, parkSourceUrl, parkWallsIn, fenceFor, registerParks, type Park } from "./parks.core.ts";
import { placesNamed } from "./names.ts";
import type { Unit } from "./units.ts";

// The parks, all of them: this module holds every park's data and registers it for the drawing, so that whoever imports it has every park. The types and the functions that need no table are in `parks.core.ts`.
export type { CoverQuirk, DugoutSide, HillQuirk, OverhangQuirk, Park, ParkData, ParkDugouts, ParkPeriod, ParkPeriodData, ParkQuirk, ParkSource, ParkWall, ParkWallData, PointQuirk, QuirkKind, WallPlace } from "./parks.core.ts";
export { fenceFor, parkNameIn, parkOfficialName, parkPointsIn, parkQuirksIn, parkSourceUrl, parkWallsIn };

/** Every park by its key: the thirty current MLB ballparks, forty-three past ones, the twelve NPB home parks, and eight secondary or past NPB grounds. */
export const PARKS: Readonly<Record<string, Park>> = Object.freeze(Object.fromEntries(registerParks(PARK_DATA).map((park) => [park.id, park])));

/** The keys of `PARKS`: the current MLB parks, then the past ones by their first season, then the NPB's, each in the order of the sources. */
export const PARK_IDS: readonly string[] = Object.freeze(PARK_DATA.map((data) => data.id));

/** The unit a park's figures were published in: metres for the parks of Japan (converted to feet once, in `PARKS`), feet for the rest. `undefined` for a key that is not a park. */
export const parkUnit = (id: string | undefined): Unit | undefined => PARK_DATA.find((data) => data.id === id)?.unit;

/**
 * The parks that answer to a name, best match first: the everyday names, then the official and cited names and the sponsors', then the former names and the nicknames. A name is
 * compared without case, accents, spaces or punctuation, in full-width or half-width, and in Japanese with hiragana or katakana and with or without the long vowel mark.
 * @example
 * ```ts
 * import { parksByName } from "@johnmorrisdotca/kyogijo-stadiums/parks";
 * console.log(parksByName("Camden Yards")[0]?.id, parksByName("甲子園")[0]?.id, parksByName("ハマスタ")[0]?.id);
 * // oriole-park-at-camden-yards hanshin-koshien-stadium yokohama-stadium
 * ```
 */
export const parksByName = (name: string | undefined): Park[] => placesNamed(Object.values(PARKS), name);

/** The park a name belongs to (see `parksByName`; the best match when several answer to it), or `undefined`. */
export const parkByName = (name: string | undefined): Park | undefined => parksByName(name)[0];

/** The park with a key, or `undefined`. */
export const parkById = (id: string | undefined): Park | undefined => (id === undefined ? undefined : PARKS[id]);

/** The park whose Wikidata item is `Q49136`, or `undefined`. */
export const parkByWikidata = (wikidata: string | undefined): Park | undefined => Object.values(PARKS).find((park) => park.wikidata === wikidata);

