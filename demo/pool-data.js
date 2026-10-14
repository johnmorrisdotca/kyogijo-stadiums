// Made-up data for the demo's "Pools" section, and for the tests and the docs of the aquatic sports: a final of eight swimmers who do not exist, from the nations that do not exist of nations.js with the
// flags drawn there in code, with their splits, reaction times and places. No real swimmer, race, time or national flag is behind it. The same call always gives the same data.
import { NATIONS } from "./nations.js";

/** The eight lanes of a 200 m freestyle final: lane, nation, name, name in Japanese, the reaction time and the cumulative time at 50, 100, 150 and 200 m. */
const FINAL = [
  [4, "aurelia", "Ivo Lindqvist", "イヴォ・リンドクヴィスト", 0.64, [25.31, 52.28, 79.6, 106.12]],
  [5, "calvara", "Mateo Varga", "マテオ・ヴァルガ", 0.67, [25.55, 52.6, 79.95, 106.48]],
  [3, "borea", "Oskar Dahl", "オスカル・ダール", 0.61, [25.12, 52.3, 79.98, 106.92]],
  [6, "dornmark", "Ren Takahashi", "高橋 蓮", 0.7, [25.8, 53.02, 80.4, 107.15]],
  [2, "estria", "Callum Rhodes", "カラム・ロッズ", 0.66, [25.7, 52.95, 80.66, 107.8]],
  [7, "fenlund", "Pavel Novak", "パヴェル・ノヴァーク", 0.69, [26.01, 53.4, 81.02, 108.21]],
  [8, "helmara", "Jonas Berg", "ヨナス・ベルグ", 0.72, [26.1, 53.55, 81.38, 108.77]],
  [1, "garrovia", "Daniel Okoro", "ダニエル・オコロ", 0.74, [26.2, 53.71, 81.45, 108.9]],
];

/**
 * A 200 m freestyle final of a made-up meet, in a language: eight swimmers with flag, name, three letters, colour, entry time (a little slower than the swim), splits and the reaction time. The last split is the time.
 * The race's `event` is its title.
 */
export function poolRace(language = "en", extra = {}) {
  const swimmers = FINAL.map(([lane, key, name, ja, reaction, splits], i) => {
    const n = NATIONS[key];
    return { lane, name: language === "ja" ? ja : name, abbr: n.abbr, flag: n.flag, color: n.color, seed: splits[3] + 0.4 + i * 0.05, reaction, splits, time: splits[3], ...(i === 0 ? { record: "CR" } : {}) };
  });
  return { event: language === "ja" ? "男子200m自由形 決勝（架空）" : "Men's 200 m freestyle, final (made up)", distance: 200, swimmers, ...extra };
}

/** The cumulative times at 25, 50, 75 and 100 m of the 100 m freestyle in a short course pool, in the lanes of `FINAL`. */
const SHORT = [
  [11.5, 23.74, 35.8, 47.9],
  [11.62, 23.9, 36.1, 48.21],
  [11.3, 23.65, 36.0, 48.4],
  [11.75, 24.1, 36.45, 48.66],
  [11.7, 24.15, 36.6, 48.93],
  [11.85, 24.3, 36.78, 49.17],
  [11.9, 24.4, 36.9, 49.4],
  [11.95, 24.5, 37.1, 49.7],
];

/** A 100 m final in a short course pool, in a language: the same eight swimmers, a split every 25 m. */
export function shortRace(language = "en") {
  const base = poolRace(language);
  return {
    ...base,
    event: language === "ja" ? "男子100m自由形（短水路・架空）" : "Men's 100 m freestyle, short course (made up)",
    distance: 100,
    swimmers: base.swimmers.map((s, i) => ({ ...s, seed: SHORT[i][3] + 0.35, splits: SHORT[i], time: SHORT[i][3] })),
  };
}
