// The made-up field of a simulated race: ten teams of two cars, every name, code and colour invented here. None is a real driver's, team's or series' (no real name, three-letter code or car number is used: a car is
// told by its team's colour and the position it holds, written on it), and nothing of a real race's result is in it.

/** A made-up team: its name in both languages, and its colour and the colour of what is written on it. */
export interface RaceTeam {
  id: string;
  name: { en: string; ja: string };
  colour: string;
  ink: string;
}

/** A made-up driver: a three-letter code, as a timing board shows one, the name in both languages, and the team. */
export interface RaceDriver {
  code: string;
  name: { en: string; ja: string };
  team: string;
}

/** The teams, from the quickest car to the slowest (`RACE_FIELD` gives the cars of the first `n / 2`). */
export const RACE_TEAMS: readonly RaceTeam[] = Object.freeze([
  { id: "kestrel", name: { en: "Kestrel Racing", ja: "ケストレル・レーシング" }, colour: "#1d4ed8", ink: "#ffffff" },
  { id: "altair", name: { en: "Altair GP", ja: "アルタイルGP" }, colour: "#0f766e", ink: "#ffffff" },
  { id: "basalt", name: { en: "Basalt Motorsport", ja: "バサルト・モータースポーツ" }, colour: "#db2777", ink: "#ffffff" },
  { id: "marlin", name: { en: "Marlin Speed", ja: "マーリン・スピード" }, colour: "#c026d3", ink: "#ffffff" },
  { id: "juniper", name: { en: "Juniper Racing Team", ja: "ジュニパー・レーシングチーム" }, colour: "#65a30d", ink: "#10151b" },
  { id: "petrel", name: { en: "Petrel Engineering", ja: "ペトレル・エンジニアリング" }, colour: "#0ea5e9", ink: "#10151b" },
  { id: "hanabi", name: { en: "Hanabi Racing", ja: "花火レーシング" }, colour: "#b91c1c", ink: "#ffffff" },
  { id: "northwind", name: { en: "Northwind Motorsport", ja: "ノースウィンド・モータースポーツ" }, colour: "#94a3b8", ink: "#10151b" },
  { id: "orrery", name: { en: "Orrery Racing", ja: "オーラリー・レーシング" }, colour: "#ca8a04", ink: "#10151b" },
  { id: "lumen", name: { en: "Lumen Works", ja: "ルーメン・ワークス" }, colour: "#7c3aed", ink: "#ffffff" },
].map((t) => Object.freeze(t)));

/** The drivers, two to a team in the order of `RACE_TEAMS`. */
export const RACE_DRIVERS: readonly RaceDriver[] = Object.freeze([
  { code: "HLV", name: { en: "Halvorsen", ja: "ハルボルセン" }, team: "kestrel" },
  { code: "OKF", name: { en: "Okafor", ja: "オカフォー" }, team: "kestrel" },
  { code: "ISK", name: { en: "Ishikura", ja: "石倉" }, team: "altair" },
  { code: "RTO", name: { en: "Rautio", ja: "ラウティオ" }, team: "altair" },
  { code: "BRN", name: { en: "Brennan", ja: "ブレナン" }, team: "basalt" },
  { code: "DLX", name: { en: "Delacroix", ja: "ドラクロワ" }, team: "basalt" },
  { code: "LQV", name: { en: "Lindqvist", ja: "リンドクビスト" }, team: "marlin" },
  { code: "CSN", name: { en: "Castellano", ja: "カステラーノ" }, team: "marlin" },
  { code: "TKD", name: { en: "Takeda", ja: "武田" }, team: "juniper" },
  { code: "NVK", name: { en: "Novak", ja: "ノバク" }, team: "juniper" },
  { code: "ACB", name: { en: "Achterberg", ja: "アハテルベルグ" }, team: "petrel" },
  { code: "KWL", name: { en: "Kowal", ja: "コワル" }, team: "petrel" },
  { code: "ARD", name: { en: "Arcadi", ja: "アルカディ" }, team: "hanabi" },
  { code: "ADB", name: { en: "Adebayo", ja: "アデバヨ" }, team: "hanabi" },
  { code: "QTR", name: { en: "Quintero", ja: "キンテロ" }, team: "northwind" },
  { code: "VRG", name: { en: "Varga", ja: "バルガ" }, team: "northwind" },
  { code: "KUR", name: { en: "Kaur", ja: "カウル" }, team: "orrery" },
  { code: "FNW", name: { en: "Fenwick", ja: "フェンウィック" }, team: "orrery" },
  { code: "ESP", name: { en: "Esposito", ja: "エスポジト" }, team: "lumen" },
  { code: "MRU", name: { en: "Moreau", ja: "モロー" }, team: "lumen" },
].map((d) => Object.freeze({ ...d, name: Object.freeze(d.name) })));

/** The most cars a race can have, and the fewest. */
export const RACE_CARS_MAX = RACE_DRIVERS.length;
export const RACE_CARS_MIN = 2;
