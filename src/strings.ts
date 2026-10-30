// The words of the package in both languages, held for the drawing: importing this file reads `strings.en.ts` and `strings.ja.ts`, which hold their languages, and gives the table, `fill` and the types. Every entry but the lean district
// imports it (`full.ts` does for most), so that `KYOGIJO_STRINGS.en` and `.ja` are there as they always were. The lean district (`district-lean`) imports `strings.core.ts` alone and reads one language with `loadStrings`.
import "./strings.en.ts";
import "./strings.ja.ts";

export { KYOGIJO_STRINGS, fill, hasStrings, loadStrings, provideStrings } from "./strings.core.ts";
export type { AthleticsData, FoldedWords, KyogijoWords, SituationWords, SkatingData } from "./strings.core.ts";
