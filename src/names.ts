// The names of places: the everyday name, the name in Japanese with its reading, the name in the place's own language, every other name a place has had or is
// called by (with where each was read), and the lookup that finds a place by any of them. Ballparks, soccer grounds and the atlas share it.
import type { Language } from "./types.ts";

/** What an alias is. `official` is the name the owner or operator gives it (when it is not the everyday one), `wikipedia` the title of an article that is cited, `sponsor` a naming-rights name, `former` an earlier name and `nickname` a short form or a name people use. */
export type PlaceNameKind = "official" | "wikipedia" | "sponsor" | "former" | "nickname";

/** Another name of a place: a title, an earlier or a sponsor's name, a nickname. */
export interface PlaceAlias {
  name: string;
  /** The language of the name: `en`, `ja`, `es`, `de`... */
  lang: string;
  kind: PlaceNameKind;
  /** The first and the last year the name was in use, where a source dates it. */
  from?: number;
  to?: number;
  /** Where the name was read: an article and its revision, or a Wikidata item and property (`Wikidata Q49136 P1448`). */
  source?: string;
  /** For a `wikipedia` alias, the revision of the article that is cited. */
  revision?: number;
  /** The reading of a name in Japanese that has kanji, in kana (`よこはまこくさいそうごうきょうぎじょう`); given for the cited and official names of the places of Japan. */
  reading?: string;
}

/** The names a place carries. */
export interface PlaceNames {
  /** The everyday name in English, the one English sports media use. */
  name: string;
  /** The everyday name in Japanese. */
  nameJa?: string;
  /** The reading of `nameJa` in hiragana and katakana, given wherever `nameJa` has kanji. */
  readingJa?: string;
  /** The everyday name in the language of the place. */
  localName?: string;
  /** The language of `localName`: `es`, `pt`, `de`, `ja`, ... */
  localLanguage?: string;
  /** Every other name: the cited titles of Wikipedia, the official, sponsor and former names with their years, the nicknames. */
  aliases?: readonly PlaceAlias[];
  /** Names the place had for some years, first to last: where two share a year the later one is the name at the end of it. */
  names?: readonly { name: string; from: number; to: number }[];
}

/**
 * A name made fit to compare: width, case, accents, kana (hiragana is katakana), the old and new forms of the same sound (ヂ, ヅ, ヴ), the long vowel mark and every space, dot
 * and mark of punctuation put aside, so that `Estádio Maracanã` and `estadio maracana` are one name, as are `ヤンキー・スタジアム` and `ヤンキースタジアム`.
 */
export function plainName(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/ヴァ/g, "バ")
    .replace(/ヴィ/g, "ビ")
    .replace(/ヴェ/g, "ベ")
    .replace(/ヴォ/g, "ボ")
    .replace(/ヴ/g, "ブ")
    .replace(/ヂ/g, "ジ")
    .replace(/ヅ/g, "ズ")
    .replace(/ー/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Every name a place answers to, with how close to the everyday name it is: 0 the everyday names, 1 the official, cited and sponsor names, 2 the former names and nicknames. */
export interface NameEntry {
  name: string;
  lang: string;
  rank: 0 | 1 | 2;
  from?: number;
  to?: number;
}

/** The names of a place, in order of rank: its everyday names, its dated names, then its aliases. */
export function nameEntries(place: PlaceNames): NameEntry[] {
  const out: NameEntry[] = [{ name: place.name, lang: "en", rank: 0 }];
  if (place.nameJa !== undefined) out.push({ name: place.nameJa, lang: "ja", rank: 0 });
  if (place.localName !== undefined) out.push({ name: place.localName, lang: place.localLanguage ?? "", rank: 0 });
  for (const period of place.names ?? []) out.push({ name: period.name, lang: "en", rank: 1, from: period.from, to: period.to });
  for (const alias of place.aliases ?? []) {
    const rank = alias.kind === "former" || alias.kind === "nickname" ? 2 : 1;
    const years = { ...(alias.from === undefined ? {} : { from: alias.from }), ...(alias.to === undefined ? {} : { to: alias.to }) };
    out.push({ name: alias.name, lang: alias.lang, rank, ...years });
    if (alias.reading !== undefined) out.push({ name: alias.reading, lang: "ja", rank, ...years });
  }
  if (place.readingJa !== undefined) out.push({ name: place.readingJa, lang: "ja", rank: 1 });
  return out;
}

/** The same name without its article in English (`The Big Egg` is `Big Egg`), as both are said. */
const withoutThe = (text: string): string => text.replace(/^the\s+/i, "");

/** How well a query matches a place: the lowest rank of any of its names that is the query once made plain (with or without a leading `The`), or `undefined` for no name. */
export function nameRank(place: PlaceNames, query: string): 0 | 1 | 2 | undefined {
  const wanted = plainName(withoutThe(query));
  if (wanted === "") return undefined;
  let best: 0 | 1 | 2 | undefined;
  for (const entry of nameEntries(place)) if ((best === undefined || entry.rank < best) && plainName(withoutThe(entry.name)) === wanted) best = entry.rank;
  return best;
}

/** Whether every word of a text is found in some name of the place (made plain), for a search box. */
export function nameContainsAll(place: PlaceNames, words: readonly string[]): boolean {
  const haystack = nameEntries(place).map((entry) => plainName(entry.name)).join(" ");
  return words.every((word) => haystack.includes(plainName(word)));
}

/**
 * The places that answer to a name, best match first: the everyday names, then the official, cited and sponsor names and the dated names, then the former names and the
 * nicknames; places of the same rank keep the order of the list given.
 */
export function placesNamed<T extends PlaceNames>(places: readonly T[], query: string | undefined): T[] {
  if (query === undefined) return [];
  const ranked: [number, number, T][] = [];
  places.forEach((place, index) => {
    const rank = nameRank(place, query);
    if (rank !== undefined) ranked.push([rank, index, place]);
  });
  return ranked.sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((row) => row[2]);
}

const covers = (alias: PlaceAlias, year: number | undefined): boolean => (year === undefined ? alias.to === undefined : (alias.from === undefined || alias.from <= year) && (alias.to === undefined || year <= alias.to));

/**
 * The name a place officially has, in a language, when it is not the everyday name: the `official` alias in that language that stands in `year` (without a year, the one that
 * stands today). In English, where there is none in English, a name in the place's own language that is written in Latin letters stands for it (`Estadio Banorte`). `undefined` when
 * there is none or when it is the name shown.
 * @example
 * ```ts
 * import { PARKS, officialName } from "@johnmorrisdotca/kyogijo/parks";
 * const koshien = PARKS["hanshin-koshien-stadium"];
 * console.log(officialName(koshien, "en"), "/", officialName(koshien, "ja"));
 * // Hanshin Koshien Stadium / 阪神甲子園球場
 * ```
 */
export function officialName(place: PlaceNames, language: Language, shown?: string, year?: number): string | undefined {
  const current = shown ?? (language === "ja" ? place.nameJa : place.name);
  const fits = (alias: PlaceAlias): boolean => alias.kind === "official" && covers(alias, year) && (current === undefined || plainName(alias.name) !== plainName(current));
  const aliases = place.aliases ?? [];
  const own = aliases.find((alias) => fits(alias) && alias.lang === language);
  if (own !== undefined || language !== "en") return own?.name;
  return aliases.find((alias) => fits(alias) && alias.lang === place.localLanguage && /^[\p{Script=Latin}\d\s.,'’()&–-]+$/u.test(alias.name))?.name;
}
