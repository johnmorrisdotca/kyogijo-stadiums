// Made-up data for the demo, the tests and the docs of the round mark: sixteen nations that do not exist, each with a simple geometric flag drawn here in code (bands, a diamond,
// a disc, a chevron: no real national flag, emblem or colour scheme is copied). The same call always gives the same data.

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20">${inner}</svg>`;
const bands = (colours, across) => colours.map((c, i) => (across ? `<rect y="${(i * 20) / colours.length}" width="30" height="${20 / colours.length + 0.1}" fill="${c}"/>` : `<rect x="${(i * 30) / colours.length}" width="${30 / colours.length + 0.1}" height="20" fill="${c}"/>`)).join("");

/** A flag made of shapes in plain colours: `bands` across or `columns`, a `diamond` with a dot, a `disc`, a `diagonal` split, `quarters` and a `chevron`. */
export const FLAGS = {
  bands: (...colours) => svg(bands(colours, true)),
  columns: (...colours) => svg(bands(colours, false)),
  diamond: (ground, shape, dot) => svg(`<rect width="30" height="20" fill="${ground}"/><path d="M15 2L27 10L15 18L3 10Z" fill="${shape}"/><circle cx="15" cy="10" r="3.4" fill="${dot}"/>`),
  disc: (ground, dot) => svg(`<rect width="30" height="20" fill="${ground}"/><circle cx="15" cy="10" r="5.5" fill="${dot}"/>`),
  diagonal: (a, b) => svg(`<rect width="30" height="20" fill="${a}"/><path d="M0 20L30 0V20Z" fill="${b}"/>`),
  quarters: (a, b) => svg(`<rect width="30" height="20" fill="${a}"/><rect width="15" height="10" fill="${b}"/><rect x="15" y="10" width="15" height="10" fill="${b}"/>`),
  chevron: (ground, shape) => svg(`<rect width="30" height="20" fill="${ground}"/><path d="M0 0L16 10L0 20Z" fill="${shape}"/>`),
};

/** Sixteen nations that do not exist: name, name in Japanese, three letters, colour and flag. */
export const NATIONS = {
  aurelia: { name: "Aurelia", ja: "アウレリア", abbr: "AUR", color: "#0f7a7a", flag: FLAGS.diamond("#0f7a7a", "#f4f0e4", "#e07a1f") },
  calvara: { name: "Calvara", ja: "カルヴァラ", abbr: "CAL", color: "#6b2d5c", flag: FLAGS.columns("#6b2d5c", "#f2c230", "#14233f") },
  borea: { name: "Borea", ja: "ボレア", abbr: "BOR", color: "#8a2d4b", flag: FLAGS.bands("#8a2d4b", "#e8e2cf", "#2f7a67") },
  dornmark: { name: "Dornmark", ja: "ドルンマルク", abbr: "DOR", color: "#c2410c", flag: FLAGS.diagonal("#c2410c", "#14233f") },
  estria: { name: "Estria", ja: "エストリア", abbr: "EST", color: "#3a2d6b", flag: FLAGS.disc("#e8e2cf", "#3a2d6b") },
  fenlund: { name: "Fenlund", ja: "フェンルンド", abbr: "FEN", color: "#1f6b3c", flag: FLAGS.quarters("#1f6b3c", "#f2c230") },
  garrovia: { name: "Garrovia", ja: "ガロビア", abbr: "GAR", color: "#14233f", flag: FLAGS.chevron("#14233f", "#f2a900") },
  helmara: { name: "Helmara", ja: "ヘルマラ", abbr: "HEL", color: "#7a2a8c", flag: FLAGS.bands("#f2c230", "#7a2a8c", "#f2c230") },
  isenmark: { name: "Isenmark", ja: "イーゼンマルク", abbr: "ISE", color: "#3a2d6b", flag: FLAGS.columns("#3a2d6b", "#f4f0e4", "#3a2d6b") },
  kestrel: { name: "Kestrel Isles", ja: "ケストレル諸島", abbr: "KES", color: "#14233f", flag: FLAGS.diamond("#14233f", "#e8e2cf", "#c2410c") },
  lumeria: { name: "Lumeria", ja: "ルメリア", abbr: "LUM", color: "#14233f", flag: FLAGS.disc("#14233f", "#f2c230") },
  norvane: { name: "Norvane", ja: "ノルバーン", abbr: "NRV", color: "#1f6b3c", flag: FLAGS.diagonal("#1f6b3c", "#f4f0e4") },
  ostvale: { name: "Ostvale", ja: "オストベイル", abbr: "OST", color: "#c8102e", flag: FLAGS.bands("#c8102e", "#14233f", "#c8102e") },
  pellasia: { name: "Pellasia", ja: "ペラシア", abbr: "PEL", color: "#1f5fa8", flag: FLAGS.quarters("#1f5fa8", "#f4f0e4") },
  rovana: { name: "Rovana", ja: "ロバナ", abbr: "ROV", color: "#1f6b3c", flag: FLAGS.chevron("#f2c230", "#1f6b3c") },
  valdor: { name: "Valdor", ja: "バルドール", abbr: "VAL", color: "#c2410c", flag: FLAGS.columns("#c2410c", "#f4f0e4", "#c2410c") },
};

/** A nation as a team, in a language: its name, its three letters, its colour, and its flag as the logo. */
export function nation(key, language = "en", extra = {}) {
  const n = NATIONS[key];
  return { name: language === "ja" ? n.ja : n.name, abbr: n.abbr, color: n.color, logo: n.flag, ...extra };
}
