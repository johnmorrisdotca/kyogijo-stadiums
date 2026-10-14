import { GROUND_DATA } from "./grounds.data.ts";
import { officialName, placesNamed, type PlaceAlias } from "./names.ts";
import type { Language } from "./types.ts";

/** Where a ground's facts were read: an article of Wikipedia at a revision. */
export interface GroundSource {
  title: string;
  revision: number;
}

/** The competitions a ground can have staged: the men's World Cup and the Women's. */
export type GroundCompetition = "world-cup" | "womens-world-cup";

/** A tournament a ground staged matches of. */
export interface GroundTournament {
  competition: GroundCompetition;
  year: number;
  /** The final was played here. */
  final?: true;
}

/** A name a ground had for some years, first to last. */
export interface GroundName {
  name: string;
  from: number;
  to: number;
}

/** A soccer ground as the data gives it: the pitch is the size the article publishes, in the unit it publishes it in. */
export interface GroundData {
  /** The key: `maracana`. */
  id: string;
  /** The Wikidata item of the ground (`Q155174`), the key to join a ground to other data. */
  wikidata: string;
  /** The everyday name in English, the one English sports media use (`Reliant Stadium`, `San Siro`); the title of the English article is one of the `aliases`. */
  name: string;
  /**
   * Names the ground had for some years, in order of time: where two share a year the later one is the name at the end of it,
   * and an entry further down overrides one above it. A year in none of them has `name`.
   */
  names?: GroundName[];
  /** The everyday name in Japanese (`日産スタジアム`, `マラカナン`), as Japanese media say it. */
  nameJa: string;
  /** The reading of `nameJa` in kana, given wherever `nameJa` has kanji (`にっさんスタジアム`). */
  readingJa?: string;
  /** The everyday name in the language of the place (`San Siro`, `Maracanã`, `日産スタジアム`); the grounds of English-speaking places have none. */
  localName?: string;
  /** The language of `localName`: `es`, `pt`, `de`, `ja`, ... */
  localLanguage?: string;
  /** Every other name, each with where it was read: the cited articles' titles (`wikipedia`, with the revision), the `official` name when it is not the everyday one, `sponsor` and `former` names with their years, `nickname`s. */
  aliases?: PlaceAlias[];
  city: string;
  /** ISO 3166-1 alpha-2: `BR`. */
  country: string;
  /** Wikidata's coordinates of the ground (P625), in degrees. */
  lat: number;
  lon: number;
  /** `current` stands and is open, `past` has been closed or pulled down. */
  status: "current" | "past";
  /** The year it opened, and for a past ground the year it closed. */
  from?: number;
  to?: number;
  /** True where Wikidata lists athletics among the ground's sports (property P641): a running track lies round the pitch, which `drawKyogijo({ sport: "athletics", ground })` draws. Absent for a ground Wikidata says nothing of, which may still have one. */
  track?: boolean;
  /** Where `track` was read. */
  trackSource?: string;
  /** The first capacity the article's infobox gives, when it gives a number. */
  capacity?: number;
  /** `published` when the article gives the pitch's length and width, `default` when it does not: the ground is then drawn at the international 105 by 68 m. */
  pitchSize: "published" | "default";
  /** The published pitch, in the unit it was published in. */
  pitch?: { length: number; width: number; unit: "m" | "yd" };
  /** Why a size the article gives is not used, or what the article gives instead. */
  pitchNote?: string;
  note?: string;
  /** The English article the facts were read from. */
  en: GroundSource;
  /** The Japanese article the name in Japanese was read from. */
  ja: GroundSource;
  /** The World Cups it staged matches of, among the grounds of this list. */
  tournaments: GroundTournament[];
}

/** A ground, with its pitch in metres: the published size, or the international 105 by 68 m of a ground that has none. */
export interface Ground extends Omit<GroundData, "pitch"> {
  /** The pitch, goal line to goal line and touchline to touchline, in metres to the centimetre. */
  pitch: { length: number; width: number };
  /** The unit the article published the size in; `m` for a ground at the default size. */
  pitchUnit: "m" | "yd";
}

const METRES_PER_YARD = 0.9144;
const centimetres = (metres: number): number => Math.round(metres * 100) / 100;

const toGround = (data: GroundData): Ground => {
  const { pitch, ...rest } = data;
  if (pitch === undefined) return { ...rest, pitch: { length: 105, width: 68 }, pitchUnit: "m" };
  const k = pitch.unit === "yd" ? METRES_PER_YARD : 1;
  return { ...rest, pitch: { length: centimetres(pitch.length * k), width: centimetres(pitch.width * k) }, pitchUnit: pitch.unit };
};

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
export const GROUNDS: Readonly<Record<string, Ground>> = Object.freeze(Object.fromEntries(GROUND_DATA.map((data) => [data.id, toGround(data)])));

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

/** The name a ground officially has in a language, when it is not the everyday name (`Parc Olympique Lyonnais` for `Groupama Stadium`), in the year given or today; else `undefined`. */
export function groundOfficialName(ground: Ground, language: Language = "en", year?: number): string | undefined {
  const shown = groundNameIn(ground, year, language);
  // A name the ground had for some years (the one FIFA gave it for a World Cup) is not followed by what it is officially today.
  if (year !== undefined && Number.isFinite(year) && language === "en" && shown !== ground.name) return undefined;
  return officialName(ground, language, shown, Number.isFinite(year) ? year : undefined);
}

/** The ground whose Wikidata item is `Q155174`, or `undefined`. */
export const groundByWikidata = (wikidata: string | undefined): Ground | undefined => Object.values(GROUNDS).find((ground) => ground.wikidata === wikidata);

/**
 * A ground's name in a year: the name it had then, or its everyday name, in English. In Japanese there is one name for every year.
 * @example
 * ```ts
 * import { GROUNDS, groundNameIn } from "@johnmorrisdotca/kyogijo-stadiums/grounds";
 * console.log(groundNameIn(GROUNDS["soccer-city"], 2010), "/", groundNameIn(GROUNDS["soccer-city"], 2012));
 * // Soccer City / FNB Stadium
 * ```
 */
export function groundNameIn(ground: Ground, year?: number, language: Language = "en"): string {
  if (language === "ja") return ground.nameJa;
  if (year === undefined || !Number.isFinite(year)) return ground.name;
  const periods = (ground.names ?? []).filter((period) => period.from <= year && year <= period.to);
  return periods.length === 0 ? ground.name : periods[periods.length - 1].name;
}

/** The grounds of this list that staged matches of a World Cup, in the order of `GROUND_IDS`. */
export const groundsHosting = (competition: GroundCompetition, year: number): Ground[] => Object.values(GROUNDS).filter((ground) => ground.tournaments.some((t) => t.competition === competition && t.year === year));

/** The address of the revision of an article that a ground's facts were read from. */
export function groundSourceUrl(source: GroundSource, language: "en" | "ja" = "en"): string {
  return `https://${language}.wikipedia.org/w/index.php?title=${encodeURIComponent(source.title.replace(/ /g, "_"))}&oldid=${source.revision}`;
}
