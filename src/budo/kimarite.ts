// The kimarite (決まり手), the winning techniques of sumo, as the Japan Sumo Association recognises them: 82 techniques in seven groups, the five non-techniques (a win because the opponent lost by his own
// step or touch) and the two other results, a win by default and by foul. Each has its key (the romanisation, lower case, without macrons), its name in Japanese and its English gloss. The list
// is read from English Wikipedia's article "Kimarite" (CC BY-SA 4.0) on 2026-10-14, which says the JSA has recognised 82 since 2001; no text of it is copied, only the names. Nothing here draws.

/** The groups of the kimarite. */
export type KimariteGroup = "kihon" | "kake" | "nage" | "hineri" | "sori" | "tokushu" | "hi";

/** One kimarite. */
export interface Kimarite {
  key: string;
  ja: string;
  en: string;
  group: KimariteGroup;
}

const group = (g: KimariteGroup, rows: readonly (readonly [string, string, string])[]): Kimarite[] => rows.map(([key, ja, en]) => ({ key, ja, en, group: g }));

/** The kimarite, in the order of the groups: basic, leg tripping, throwing, twisting down, backwards body drop, special, and the non-techniques with the two other results. */
export const KIMARITE: readonly Kimarite[] = Object.freeze([
  ...group("kihon", [["abisetaoshi", "浴びせ倒し", "backward force down"], ["oshidashi", "押し出し", "frontal push out"], ["oshitaoshi", "押し倒し", "frontal push down"], ["tsukidashi", "突き出し", "frontal thrust out"], ["tsukitaoshi", "突き倒し", "frontal thrust down"], ["yorikiri", "寄り切り", "frontal force out"], ["yoritaoshi", "寄り倒し", "frontal crush out"]]),
  ...group("kake", [["ashitori", "足取り", "leg pick"], ["chongake", "ちょん掛け", "pulling heel hook"], ["kawazugake", "河津掛け", "hooking backward counter throw"], ["kekaeshi", "蹴返し", "minor inner foot sweep"], ["ketaguri", "蹴手繰り", "pulling inside ankle sweep"], ["kirikaeshi", "切り返し", "twisting backward knee trip"], ["komatasukui", "小股掬い", "over thigh scooping body drop"], ["kozumatori", "小褄取り", "ankle pick"], ["mitokorozeme", "三所攻め", "triple attack force out"], ["nimaigeri", "二枚蹴り", "ankle kicking twist down"], ["omata", "大股", "thigh scooping body drop"], ["sotogake", "外掛け", "outside leg trip"], ["sotokomata", "外小股", "over thigh scooping body drop"], ["susoharai", "裾払い", "rear foot sweep"], ["susotori", "裾取り", "toe pick"], ["tsumatori", "褄取り", "rear ankle pick"], ["uchigake", "内掛け", "inside leg trip"], ["watashikomi", "渡し込み", "thigh grabbing push down"]]),
  ...group("nage", [["ipponzeoi", "一本背負い", "one-armed shoulder throw"], ["kakenage", "掛け投げ", "hooking inner thigh throw"], ["koshinage", "腰投げ", "hip throw"], ["kotenage", "小手投げ", "armlock throw"], ["kubinage", "首投げ", "headlock throw"], ["nichonage", "二丁投げ", "body drop throw"], ["shitatedashinage", "下手出し投げ", "pulling underarm throw"], ["shitatenage", "下手投げ", "underarm throw"], ["sukuinage", "掬い投げ", "beltless arm throw"], ["tsukaminage", "つかみ投げ", "lifting throw"], ["uwatedashinage", "上手出し投げ", "pulling overarm throw"], ["uwatenage", "上手投げ", "overarm throw"], ["yaguranage", "櫓投げ", "inner thigh throw"]]),
  ...group("hineri", [["amiuchi", "網打ち", "the fisherman's throw"], ["gasshohineri", "合掌捻り", "clasped hand twist down"], ["harimanage", "波離間投げ", "backward belt throw"], ["kainahineri", "腕捻り", "two-handed arm twist down"], ["katasukashi", "肩透かし", "under-shoulder swing down"], ["kotehineri", "小手捻り", "arm locking twist down"], ["kubihineri", "首捻り", "head twisting throw"], ["makiotoshi", "巻き落とし", "twist down"], ["osakate", "大逆手", "backward twisting overarm throw"], ["sabaori", "鯖折り", "forward force down"], ["sakatottari", "逆とったり", "arm bar throw counter"], ["shitatehineri", "下手捻り", "twisting underarm throw"], ["sotomuso", "外無双", "outer thigh propping twist down"], ["tokkurinage", "徳利投げ", "two handed head twist down"], ["tottari", "とったり", "arm bar throw"], ["tsukiotoshi", "突き落とし", "thrust down"], ["uchimuso", "内無双", "inner thigh propping twist down"], ["uwatehineri", "上手捻り", "twisting overarm throw"], ["zubuneri", "ずぶねり", "head pivot throw"]]),
  ...group("sori", [["izori", "居反り", "backwards body drop"], ["kakezori", "掛け反り", "hooking backwards body drop"], ["shumokuzori", "撞木反り", "bell hammer backwards body drop"], ["sototasukizori", "外たすき反り", "outer reverse backwards body drop"], ["tasukizori", "たすき反り", "reverse backwards body drop"], ["tsutaezori", "伝え反り", "underarm forward body drop"]]),
  ...group("tokushu", [["hatakikomi", "叩き込み", "slap down"], ["hikiotoshi", "引き落とし", "hand pull down"], ["hikkake", "引っ掛け", "arm grabbing force out"], ["kimedashi", "極め出し", "arm barring force out"], ["kimetaoshi", "極め倒し", "arm barring force down"], ["okuridashi", "送り出し", "rear push out"], ["okurigake", "送り掛け", "rear leg trip"], ["okurihikiotoshi", "送り引き落とし", "rear pull down"], ["okurinage", "送り投げ", "rear throw down"], ["okuritaoshi", "送り倒し", "rear push down"], ["okuritsuridashi", "送り吊り出し", "rear lift out"], ["okuritsuriotoshi", "送り吊り落とし", "rear lifting body slam"], ["sokubiotoshi", "素首落とし", "head chop down"], ["tsuridashi", "吊り出し", "frontal lift out"], ["tsuriotoshi", "吊り落とし", "frontal lifting body slam"], ["ushiromotare", "後ろもたれ", "backward lean out"], ["utchari", "うっちゃり", "backward pivot throw"], ["waridashi", "割り出し", "upper-arm force out"], ["yobimodoshi", "呼び戻し", "pulling body slam"]]),
  ...group("hi", [["fumidashi", "踏み出し", "rear step out"], ["isamiashi", "勇み足", "forward step out"], ["koshikudake", "腰砕け", "inadvertent collapse"], ["tsukihiza", "つきひざ", "knee touch down"], ["tsukite", "つき手", "hand touch down"], ["fusen", "不戦", "default (absence)"], ["hansoku", "反則", "foul"]]),
]);

/** How many techniques there are, as the Association counts them. */
export const KIMARITE_COUNT = KIMARITE.filter((k) => k.group !== "hi").length;

/** The five non-techniques and the two other results. */
export const KIMARITE_OTHERS = KIMARITE.filter((k) => k.group === "hi");

const plain = (s: string): string => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ぁ-んァ-ヶ一-龠]/g, "");

/** The kimarite a key, a Japanese name or an English gloss names, or `undefined`. */
export function kimariteOf(query: string): Kimarite | undefined {
  const q = plain(query);
  if (q === "") return undefined;
  return KIMARITE.find((k) => k.key === q || plain(k.ja) === q || plain(k.en) === q);
}

/** The name of a kimarite in a language: its Japanese name, or its key in capitals-first romanisation; text that is no kimarite is kept as it was written. */
export function kimariteName(query: string, language: "en" | "ja"): string {
  const k = kimariteOf(query);
  if (k === undefined) return query.trim();
  return language === "ja" ? k.ja : k.key.charAt(0).toUpperCase() + k.key.slice(1);
}
