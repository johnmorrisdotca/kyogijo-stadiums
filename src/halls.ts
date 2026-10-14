// The famous halls of the budō: the Kodokan (講道館), the Nippon Budokan (日本武道館), the Ryōgoku Kokugikan (両国国技館), the old Butokuden of Kyoto (旧武徳殿) and the Budokwai of London, each with only the facts a source
// gives: where, when, how many seats, how many mats, how big a floor. Each hall offers one or more surfaces, drawn from `drawKyogijo`'s own options, and says for each what is documented (its size and its mat
// count) and what is only plausible (the shape of a floor, the number of contest areas laid on it, the colours of the mats), so that nothing here is taken for a plan. The data is facts only: no text, table
// or picture of a page is copied. Nothing here draws.
import type { PlaceAlias } from "./names.ts";
import type { BudoSport, DojoSpec, BudoStyle } from "./types.ts";

/** What is known of a surface's layout. `documented`: the floor, its size and its contest areas are from a source (the dohyō of the Association's rules). `count`: a source gives the number of mats, and the shape is plausible. `generic`: no source gives the size or the layout, and a plausible one is drawn. */
export type HallBasis = "documented" | "count" | "generic";

/** One surface a hall offers: a floor of a sport, with the options that draw it. */
export interface HallSurface {
  /** The key within the hall: `main-dojo`. */
  id: string;
  name: { en: string; ja: string };
  sport: BudoSport;
  /** The options (beyond `sport`) that draw it. */
  options: { league?: string; budo?: BudoStyle; dojo?: DojoSpec };
  basis: HallBasis;
  /** The number of mats (jō) a source gives for the floor, where it gives one. */
  mats?: number;
  /** What is known and what is drawn, in a sentence each. */
  note: { en: string; ja: string };
}

/** A hall as the data gives it. */
export interface Hall {
  id: string;
  name: string;
  nameJa: string;
  readingJa?: string;
  aliases: readonly PlaceAlias[];
  city: string;
  country: string;
  lat: number;
  lon: number;
  wikidata: string;
  /** The first year of the institution or the building (the Kodokan's is its founding, 1882). */
  from: number;
  /** What the first year is, in a phrase. */
  fromWhat: { en: string; ja: string };
  /** The most the hall seats or holds, where a source gives it, and which source. */
  capacity?: { value: number; source: string };
  /** The competitions and events it is known for. */
  leagues: readonly string[];
  surfaces: readonly HallSurface[];
  /** Keys of `LEAGUE_SOURCES` that its facts were read from. */
  sources: readonly string[];
  /** What is known of the hall that no surface says, in a sentence. */
  note: { en: string; ja: string };
}

const wp = (name: string, lang: string, source: string): PlaceAlias => ({ name, lang, kind: "wikipedia", source });
const official = (name: string, lang: string, source: string): PlaceAlias => ({ name, lang, kind: "official", source });

/** The halls, in the order of their surfaces' fame: the Kodokan, the Budokan, the Kokugikan, the Butokuden and the Budokwai. */
export const HALLS: readonly Hall[] = Object.freeze([
  {
    id: "kodokan",
    name: "Kodokan",
    nameJa: "講道館",
    readingJa: "こうどうかん",
    aliases: [official("Kodokan Judo Institute", "en", "kdkjudo.org"), wp("Kōdōkan", "en", "Wikidata Q1165384 label"), official("講道館国際柔道センター", "ja", "kdkjudo.org 施設のご案内")],
    city: "Tokyo",
    country: "JP",
    lat: 35.708,
    lon: 139.75344,
    wikidata: "Q1165384",
    from: 1882,
    fromWhat: { en: "founded by Kanō Jigorō (the International Judo Center, the building the dojos are in, was completed in 1984)", ja: "嘉納治五郎が創設(道場のある講道館国際柔道センターは1984年に完成)" },
    leagues: [],
    surfaces: [
      { id: "main-dojo", name: { en: "Main dojo, 7th floor", ja: "大道場(7階)" }, sport: "dojo", options: { dojo: { jo: 420, look: "green-beige", kamiza: "north", shinzen: true } }, basis: "count", mats: 420, note: { en: "420 jō on the 7th floor, with a gallery on the 8th that seats about 900. The shape of the floor and the colours are not documented: a floor of 24 by 35 mats' widths is drawn.", ja: "7階に420畳、8階に約900人が座れる見学席があります。床の形と色は分からないので、畳の幅24×35の床を描いています。" } },
      { id: "school-dojo", name: { en: "School dojo, 6th floor", ja: "学校道場(6階)" }, sport: "dojo", options: { dojo: { jo: 240, look: "green-beige" } }, basis: "count", mats: 240, note: { en: "240 jō on the 6th floor; the shape is plausible.", ja: "6階に240畳。形は推定です。" } },
      { id: "international-dojo", name: { en: "International department's dojo, 6th floor", ja: "国際部道場(6階)" }, sport: "dojo", options: { dojo: { jo: 192, look: "green-beige" } }, basis: "count", mats: 192, note: { en: "192 jō on the 6th floor; the shape is plausible.", ja: "6階に192畳。形は推定です。" } },
      { id: "womens-dojo", name: { en: "Women's dojo, 5th floor", ja: "女子部道場(5階)" }, sport: "dojo", options: { dojo: { jo: 240, look: "green-beige" } }, basis: "count", mats: 240, note: { en: "240 jō on the 5th floor; the shape is plausible.", ja: "5階に240畳。形は推定です。" } },
      { id: "juniors-dojo", name: { en: "Juniors' dojo, 5th floor", ja: "少年部道場(5階)" }, sport: "dojo", options: { dojo: { jo: 114, look: "green-beige" } }, basis: "count", mats: 114, note: { en: "114 jō on the 5th floor; the shape is plausible.", ja: "5階に114畳。形は推定です。" } },
    ],
    sources: ["kodokan-facilities", "wikipedia-halls"],
    note: { en: "The Kodokan moved to Kasuga, Bunkyō, in 1958. The Bunkyō ward's page counts the main dojo as 510 jō; the Kodokan's own page says 420.", ja: "講道館は1958年に文京区春日に移りました。文京区のページは大道場を510畳としていますが、講道館自身のページは420畳です。" },
  },
  {
    id: "nippon-budokan",
    name: "Nippon Budokan",
    nameJa: "日本武道館",
    readingJa: "にっぽんぶどうかん",
    aliases: [official("Budokan", "en", "Wikidata Q386246"), wp("Nippon Budōkan", "en", "Wikidata Q386246 label")],
    city: "Tokyo",
    country: "JP",
    lat: 35.693333,
    lon: 139.75,
    wikidata: "Q386246",
    from: 1964,
    fromWhat: { en: "opened on 3 October 1964, the venue of the Olympic judo that month", ja: "1964年10月3日に開館、その月の東京オリンピックの柔道会場" },
    capacity: { value: 14501, source: "budokan-overview" },
    leagues: ["Olympic Games 1964", "Olympic Games 2020", "All Japan Judo Championships", "All Japan Karate Championships"],
    surfaces: [
      { id: "judo-games", name: { en: "Judo at the Olympic Games, two contest areas", ja: "オリンピックの柔道(試合場2面)" }, sport: "judo", options: { league: "ijf", budo: { hall: "budokan", areas: 2, platform: true, officials: true } }, basis: "generic", note: { en: "The arena is an octagon 55 m across the flats (2,513 m²). That the Games laid mats on a raised platform is reported; how many contest areas, and their colours, were not found: two areas of 10 m on a platform are drawn.", ja: "アリーナは対辺55mの正八角形(2,513㎡)です。大会で畳を台の上に敷いたことは報じられていますが、試合場の数と色は分かりませんでした。10mの試合場2面を台の上に描いています。" } },
      { id: "judo-championships", name: { en: "All Japan Judo Championships, one contest area", ja: "全日本柔道選手権大会(試合場1面)" }, sport: "judo", options: { league: "ajjf", budo: { hall: "budokan" } }, basis: "generic", note: { en: "The Championships are held at the Budokan on 29 April. The layout of the mats is not documented: one contest area with the AJJF's red danger zone is drawn.", ja: "選手権は4月29日に日本武道館で開かれます。畳の配置は分からないので、全柔連の赤い危険地帯のある試合場1面を描いています。" } },
      { id: "karate", name: { en: "Karate at the Olympic Games", ja: "オリンピックの空手道" }, sport: "karate", options: { league: "wkf-kumite", budo: { hall: "budokan", officials: true } }, basis: "generic", note: { en: "Karate was held at the Budokan at the 2020 Games. The number of competition areas was not found: one WKF kumite area is drawn in the middle of the arena.", ja: "空手道は2020年大会で日本武道館で行われました。試合場の数は分からないので、アリーナの中央にWKFの組手の試合場1面を描いています。" } },
      { id: "kendo", name: { en: "Kendo, one shiai-jo", ja: "剣道(試合場1面)" }, sport: "kendo", options: { budo: { hall: "budokan", size: 11 } }, basis: "generic", note: { en: "Kendo's national championships are held at the Budokan. The size of the shiai-jo used was not found: one of 11 m, the greatest the regulations allow, is drawn in the middle of the arena.", ja: "剣道の全国大会は日本武道館で開かれます。使う試合場の大きさは分からないので、規則が認める最大の11m四方を中央に描いています。" } },
    ],
    sources: ["budokan-overview", "wikipedia-halls"],
    note: { en: "The Budokan's own leaflet gives a maximum of 14,501 people; Wikidata and English Wikipedia give 14,471.", ja: "日本武道館のリーフレットは最大収容数を14,501人とし、WikidataとEnglish Wikipediaは14,471人としています。" },
  },
  {
    id: "ryogoku-kokugikan",
    name: "Ryōgoku Kokugikan",
    nameJa: "両国国技館",
    readingJa: "りょうごくこくぎかん",
    aliases: [wp("Ryōgoku Kokugikan", "en", "Wikidata Q176821 label"), official("Kokugikan", "en", "Wikidata Q176821")],
    city: "Tokyo",
    country: "JP",
    lat: 35.696944,
    lon: 139.793333,
    wikidata: "Q176821",
    from: 1985,
    fromWhat: { en: "opened on 9 January 1985", ja: "1985年1月9日に開館" },
    capacity: { value: 11098, source: "wikipedia-halls" },
    leagues: ["Grand Sumo Tournament"],
    surfaces: [{ id: "dohyo", name: { en: "The dohyō", ja: "土俵" }, sport: "sumo", options: { budo: { tassels: true } }, basis: "documented", note: { en: "The clay square of 6.7 m and the ring of 4.55 m are the Association's own figures (Sumo Rules, Dohyō Regulations, Article 1); the Kokugikan holds the Tokyo tournaments in January, May and September, and its ring is movable.", ja: "一辺6.7mの土の正方形と直径4.55mの円は日本相撲協会の規則(相撲規則 土俵規定 第一条)の数値です。国技館では1月、5月、9月の東京場所が開かれ、土俵は移動式です。" } }],
    sources: ["jsa-dohyo", "jsa-quiz", "wikipedia-halls"],
    note: { en: "The Kokugikan seats 11,098 (Wikidata, English Wikipedia).", ja: "国技館の収容人数は11,098人です(Wikidata、English Wikipedia)。" },
  },
  {
    id: "kyu-butokuden",
    name: "Kyū Butokuden",
    nameJa: "旧武徳殿",
    readingJa: "きゅうぶとくでん",
    aliases: [wp("Butokuden", "en", "Wikidata Q1017987 label"), official("Kyoto Butokuden", "en", "Wikidata Q1017987"), official("京都市武道センター旧武徳殿", "ja", "Wikidata Q1017987")],
    city: "Kyoto",
    country: "JP",
    lat: 35.016389,
    lon: 135.780833,
    wikidata: "Q1017987",
    from: 1899,
    fromWhat: { en: "built as a hall for martial arts by the Dai Nippon Butokukai, designed by Matsumuro Shigemitsu; an Important Cultural Property since 1996", ja: "大日本武徳会が演武場として造営、設計は松室重光、1996年に国の重要文化財に指定" },
    leagues: [],
    surfaces: [{ id: "hall", name: { en: "The hall", ja: "旧武徳殿の床" }, sport: "dojo", options: { dojo: { jo: 100, look: "green-beige", kamiza: "north", shinzen: true } }, basis: "generic", note: { en: "The hall seats 1,200 and is part of the Kyoto Municipal Budo Center. The size of its floor and its mats were not found in a source: a floor of 100 jō is drawn as plausible.", ja: "旧武徳殿は座席1,200席で、京都市武道センターの施設の一つです。床の大きさと畳の数は資料で確認できなかったので、100畳の床を推定して描いています。" } }],
    sources: ["butokuden-ja"],
    note: { en: "The hall was requisitioned after 1946 and used by the city's police school and art college, and is now a facility of the Kyoto Municipal Budo Center.", ja: "1946年以降は接収され、京都市警察学校や京都市立芸術大学が使い、今は京都市武道センターの施設です。" },
  },
  {
    id: "budokwai",
    name: "The Budokwai",
    nameJa: "ブドクワイ",
    aliases: [wp("Budokwai", "en", "Wikidata Q3646473 label")],
    city: "London",
    country: "GB",
    lat: 51.4867,
    lon: -0.180556,
    wikidata: "Q3646473",
    from: 1918,
    fromWhat: { en: "opened on 26 January 1918 by Gunji Koizumi, at 15 Lower Grosvenor Place; at 4 Gilston Road since 1954", ja: "1918年1月26日に小泉軍治が開設(最初はロウアー・グロブナー・プレイス15番地)、1954年から現在のギルストン・ロード4番地" },
    leagues: [],
    surfaces: [{ id: "dojo", name: { en: "The dojo", ja: "道場" }, sport: "dojo", options: { dojo: { jo: 50, look: "green-beige" } }, basis: "generic", note: { en: "The size of the dojo and the number of its mats were not found in a source: a floor of 50 jō is drawn as plausible.", ja: "道場の大きさと畳の数は資料で確認できなかったので、50畳の床を推定して描いています。" } }],
    sources: ["wikipedia-halls"],
    note: { en: "A British martial arts club, read from English Wikipedia and Wikidata.", ja: "英国の武道クラブです。English WikipediaとWikidataによります。" },
  },
] satisfies readonly Hall[]);
