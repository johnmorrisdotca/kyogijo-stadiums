// The demo's countries: real ones, each with its name in English and Japanese, three letters, a colour for its end and its ISO code. Their flags are not here: they are Hata's, drawn through the
// flag plug-in (`useFlags`, plugged in by flags.js), so a team is `{ name, abbr, color, flag: "CA" }`. Only national flags and country names are used: no federation's crest or logo is.
// The same call always gives the same data.

/** The countries of the demo: name, name in Japanese, three letters, colour and the ISO 3166 code of the flag (`GB-ENG` is England's own). */
export const NATIONS = {
  canada: { name: "Canada", ja: "カナダ", abbr: "CAN", color: "#d52b1e", flag: "CA" },
  usa: { name: "USA", ja: "アメリカ", abbr: "USA", color: "#1c3f7a", flag: "US" },
  japan: { name: "Japan", ja: "日本", abbr: "JPN", color: "#bc002d", flag: "JP" },
  mexico: { name: "Mexico", ja: "メキシコ", abbr: "MEX", color: "#006847", flag: "MX" },
  france: { name: "France", ja: "フランス", abbr: "FRA", color: "#0055a4", flag: "FR" },
  brazil: { name: "Brazil", ja: "ブラジル", abbr: "BRA", color: "#009739", flag: "BR" },
  england: { name: "England", ja: "イングランド", abbr: "ENG", color: "#c8102e", flag: "GB-ENG" },
  germany: { name: "Germany", ja: "ドイツ", abbr: "GER", color: "#222222", flag: "DE" },
  italy: { name: "Italy", ja: "イタリア", abbr: "ITA", color: "#0b5cab", flag: "IT" },
  australia: { name: "Australia", ja: "オーストラリア", abbr: "AUS", color: "#00843d", flag: "AU" },
  korea: { name: "Korea", ja: "韓国", abbr: "KOR", color: "#c60c30", flag: "KR" },
};

/** The codes of every flag the demo draws: the build loads each from Hata once, in every shape, into flags.data.js. */
export const FLAG_CODES = [...new Set(Object.values(NATIONS).map((n) => n.flag))];

/** A country as a team, in a language: its name, its three letters, its colour and the code of its flag. */
export function nation(key, language = "en", extra = {}) {
  const n = NATIONS[key];
  return { name: language === "ja" ? n.ja : n.name, abbr: n.abbr, color: n.color, flag: n.flag, ...extra };
}
