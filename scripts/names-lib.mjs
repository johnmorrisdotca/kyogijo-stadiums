// What a ballpark or a ground must say of its names, held by `pnpm parks` and `pnpm grounds` (see docs/ballparks.md and docs/grounds.md, "Names").
export const KINDS = ["official", "wikipedia", "sponsor", "former", "nickname"];
const KANJI = /[一-鿿々]/u;
const KANA = /^[ぁ-ゖァ-ヺー・\u3000 0-9A-Za-z()（）.!&-]+$/u;
const isYear = (value) => Number.isInteger(value) && value >= 1500 && value <= 2200;
const plain = (text) => text.normalize("NFKC").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC").replace(/ー/g, "").replace(/[^\p{L}\p{N}]/gu, "");

/** Throws, naming the place, for any name the data does not stand behind. */
export function checkNames(place, fail) {
  const id = place.id;
  for (const key of ["name", "nameJa"]) if (typeof place[key] !== "string" || place[key].trim() === "") fail(`${id} needs ${key}`);
  if (KANJI.test(place.nameJa)) {
    if (typeof place.readingJa !== "string" || !KANA.test(place.readingJa)) fail(`${id}: ${place.nameJa} has kanji, so it needs its reading in kana (readingJa)`);
  } else if (place.readingJa !== undefined) fail(`${id}: readingJa is for a name with kanji`);
  if ((place.localName === undefined) !== (place.localLanguage === undefined)) fail(`${id}: localName and localLanguage go together`);
  if (place.localLanguage === "ja" && place.localName !== place.nameJa) fail(`${id}: a place in Japan has the same name in Japanese and in its own language`);
  const seen = new Set();
  for (const alias of place.aliases ?? []) {
    const label = `${id}: alias ${JSON.stringify(alias.name)}`;
    if (typeof alias.name !== "string" || alias.name.trim() === "") fail(`${label} has no name`);
    if (!/^[a-z]{2,3}$/.test(alias.lang ?? "")) fail(`${label}: lang is a language code`);
    if (!KINDS.includes(alias.kind)) fail(`${label}: kind ${alias.kind}`);
    for (const key of ["from", "to"]) if (alias[key] !== undefined && !isYear(alias[key])) fail(`${label}: ${key} is a year`);
    if (alias.from !== undefined && alias.to !== undefined && alias.from > alias.to) fail(`${label}: it ends before it starts`);
    if (typeof alias.source !== "string" || alias.source === "") fail(`${label} says where it was read (source)`);
    if (alias.kind === "wikipedia" && alias.revision !== undefined && !(alias.revision > 1000)) fail(`${label}: revision`);
    if (alias.kind !== "wikipedia" && alias.revision !== undefined) fail(`${label}: only a cited article has a revision`);
    if (alias.reading !== undefined && (alias.lang !== "ja" || !KANJI.test(alias.name) || !KANA.test(alias.reading))) fail(`${label}: a reading is kana, for a name in Japanese with kanji`);
    // The cited and official names in Japanese of a place of Japan come with their reading.
    if (place.country === "JP" && alias.lang === "ja" && ["wikipedia", "official"].includes(alias.kind) && KANJI.test(alias.name) && alias.reading === undefined) fail(`${label} has kanji and no reading`);
    const key = [plain(alias.name), alias.lang, alias.kind, alias.from ?? "", alias.to ?? ""].join("|");
    if (seen.has(key)) fail(`${label} is listed twice`);
    seen.add(key);
  }
  // Every cited article's title stays a name, so that no citation is lost.
  for (const [lang, source] of [["en", place.en], ["ja", place.ja]]) {
    if (source === undefined) continue;
    const found = (place.aliases ?? []).some((alias) => alias.kind === "wikipedia" && alias.lang === lang && alias.name === source.title && alias.revision === source.revision);
    if (!found) fail(`${id}: the ${lang} article ${JSON.stringify(source.title)} at revision ${source.revision} is not among the aliases`);
  }
}

/** Whether a Wikidata entity (read with labels, aliases and claims) holds a name as a label, an alias, or the value of the properties official name, nickname, name and short name. */
export function wikidataHas(entity, name) {
  const wanted = plain(name);
  const labels = Object.values(entity.labels ?? {}).map((l) => l.value);
  const aliases = Object.values(entity.aliases ?? {}).flat().map((a) => a.value);
  const claims = ["P1448", "P1449", "P2561", "P1813"].flatMap((property) => (entity.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.text));
  return [...labels, ...aliases, ...claims].filter((value) => typeof value === "string").some((value) => plain(value) === wanted);
}

/** Reports the aliases that say they were read from Wikidata and that the item no longer holds. */
export function checkWikidataAliases(entity, place, report) {
  for (const alias of place.aliases ?? []) {
    if (/^Wikidata Q\d+ /.test(alias.source ?? "") && !alias.source.includes("sitelink") && !wikidataHas(entity, alias.name)) report(place, `alias ${JSON.stringify(alias.name)} (${alias.source}) is no longer on the item`);
  }
}
