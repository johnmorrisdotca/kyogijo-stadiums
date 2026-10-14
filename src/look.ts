// Named looks: the colours of a whole drawing (the surface, its lines, the ground round it and the words on that ground) as one palette, in a light and a
// dark set, for every sport. A look is a set of the stylesheet's own custom properties on `.kyogijo[data-palette=...]`, at no weight (`:where()`), so
// that a page's own rule and the options' `colors` always win; the sports differ where their surfaces do (ice is not grass). Written for this package.
// sportypy's `update_colors` and ggsoccer's `theme` were the ideas; none of their code or palettes is used.
import { luminance, rgbOf } from "./colour.ts";
import type { LookName, Sport } from "./types.ts";

/** The parts of a palette, each a custom property of the stylesheet. */
export type PaletteKey =
  | "ink" | "line" | "apron" | "surface" | "alt" | "zone" | "boards" | "red" | "blue" | "dirt" | "foul" | "infield" | "crease" | "key" | "court"
  | "post" | "pylon" | "rgo" | "rgm" | "rgi" | "rgb" | "hog" | "hack" | "fgz" | "pebble" | "free" | "net" | "area"
  | "track" | "sand" | "mat" | "water" | "concrete" | "pad" | "markY" | "markB" | "markG" | "markR";

/** Colours by part. */
export type Palette = Partial<Record<PaletteKey, string>>;

/** The surfaces that are painted alike: football's three fields are one. */
export type Group = "football" | "nhl" | "nba" | "mlb" | "soccer" | "curling" | "net" | "athletics";

/** One mode of a look: a palette for every sport, and what a group of sports changes in it. */
export interface Mode {
  base: Palette;
  groups?: Partial<Record<Group, Palette>>;
}

/** A named look. */
export interface Look {
  /** What it is for, in a sentence. */
  about: string;
  light: Mode;
  dark: Mode;
}

const PROPERTY: Readonly<Record<PaletteKey, string>> = {
  ink: "--ky-ink", line: "--ky-line", apron: "--ky-apron", surface: "--ky-surface", alt: "--ky-surface-alt", zone: "--ky-zone", boards: "--ky-boards",
  red: "--ky-red", blue: "--ky-blue", dirt: "--ky-dirt", foul: "--ky-foul", infield: "--ky-infield", crease: "--ky-crease", key: "--ky-key", court: "--ky-court",
  post: "--ky-post", pylon: "--ky-pylon", rgo: "--ky-rg-o", rgm: "--ky-rg-m", rgi: "--ky-rg-i", rgb: "--ky-rg-b", hog: "--ky-hog", hack: "--ky-hack",
  fgz: "--ky-fgz", pebble: "--ky-pebble", free: "--ky-free", net: "--ky-net", area: "--ky-area",
  track: "--ky-track", sand: "--ky-sand", mat: "--ky-mat", water: "--ky-water", concrete: "--ky-concrete", pad: "--ky-pad",
  markY: "--ky-ath-y", markB: "--ky-ath-b", markG: "--ky-ath-g", markR: "--ky-ath-r",
};

/** The sports of each group. */
const GROUP_SPORTS: Readonly<Record<Group, readonly string[]>> = { football: ["nfl", "cfl", "ifaf"], nhl: ["nhl", "skating"], nba: ["nba"], mlb: ["mlb"], soccer: ["soccer"], curling: ["curling"], net: ["tennis", "volleyball", "badminton", "pickleball", "tabletennis"], athletics: ["athletics"] };

/** The group a sport is painted with, or `undefined` for a surface with no palette of its own (it takes the look's base). */
export const groupOf = (sport: Sport | string): Group | undefined => (Object.keys(GROUP_SPORTS) as Group[]).find((group) => GROUP_SPORTS[group].includes(sport));

// ---- The looks. ----

const GRASS: Look = {
  about: "The natural colours of each sport (grass, ice, maple), tuned so that every painted line reads against what it is painted on.",
  light: {
    base: { ink: "#1f2320", line: "#ffffff", apron: "#dcd8c9", surface: "#3f8f55", alt: "#3a864f", zone: "#2d6a40", boards: "#c8c1b0", red: "#c8372d", blue: "#2a5db0", dirt: "#a8744a", foul: "#3a8148", infield: "#58a05d", crease: "#bfd3ec", key: "#c25b3c", court: "#3b79ad", post: "#f2c230", pylon: "#f26a1b" },
    groups: {
      nhl: { surface: "#eef5fa", alt: "#e6eff6", apron: "#d3dbe1", boards: "#9aa4ab" },
      nba: { surface: "#b8864d", alt: "#ae7d44", apron: "#c9c3b4", boards: "#8a5f30" },
      mlb: { surface: "#4f9a55", alt: "#478f4e", apron: "#bdb59f", boards: "#2f4a36" },
      soccer: { surface: "#4c9b56", alt: "#438f4d", apron: "#c9d2bd" },
      curling: { surface: "#eaf3f9", apron: "#cfd8de", boards: "#8d98a0", line: "#23292d", rgo: "#2a5db0", rgm: "#ffffff", rgi: "#c8372d", rgb: "#ffffff", hog: "#c8372d", hack: "#3a4046", fgz: "rgba(42,93,176,.1)", pebble: "rgba(110,140,165,.4)" },
      net: { surface: "#3d78bd", alt: "#3d78bd", free: "#2f5f9a", apron: "#dcd8c9", area: "#4a86c8", net: "#20262b" },
      athletics: { surface: "#4c9b56", alt: "#438f4d", apron: "#d9d6c8", track: "#c05a46", sand: "#e3cf9d", mat: "#3d6fb5", water: "#7cc4ee", concrete: "#a9adb0", pad: "#40454a" },
    },
  },
  dark: {
    base: { ink: "#ece8dc", line: "#e9ece6", apron: "#1b1f1c", surface: "#2c6a3f", alt: "#296239", zone: "#1f4a2d", boards: "#4d5450", red: "#d4574d", blue: "#5584d4", dirt: "#8a6040", foul: "#275a31", infield: "#367a42", crease: "#8ea9cc", key: "#8a3f2b", court: "#2a5478", post: "#f2c230", pylon: "#f26a1b" },
    groups: {
      nhl: { surface: "#34444f", alt: "#2f3e48", apron: "#1a2025", boards: "#4b5156", red: "#ff8f84", blue: "#86b4ff", crease: "#4f6f8c" },
      nba: { surface: "#8f6a3c", alt: "#876234", apron: "#1a1c1b", boards: "#5e4426" },
      mlb: { surface: "#2f6b3a", alt: "#2b6336", apron: "#1b1f1c", boards: "#1c2b20" },
      soccer: { surface: "#2d6c3e", alt: "#276136", apron: "#1b1f1c" },
      curling: { surface: "#8fa6b7", apron: "#1a2025", boards: "#4b5156", line: "#11171b", rgo: "#3f6cc0", rgm: "#dfe8ef", rgi: "#c9473e", rgb: "#dfe8ef", hog: "#8a1f19", hack: "#161b1f", fgz: "rgba(20,40,90,.18)", pebble: "rgba(80,105,125,.4)" },
      net: { surface: "#2f5f99", alt: "#2f5f99", free: "#244a78", apron: "#1b1f1c", area: "#3a6fae", net: "#e6e9ec" },
      athletics: { surface: "#2d6c3e", alt: "#276136", apron: "#1b1f1c", track: "#9a4636", sand: "#a89568", mat: "#2c528a", water: "#4d8fb8", concrete: "#6e7377", pad: "#1f2326" },
    },
  },
};

const NIGHT_DARK: Mode = {
  base: { ink: "#e8ecf2", line: "#f3f5ef", apron: "#070a10", surface: "#1d4a2c", alt: "#1a4328", zone: "#163a22", boards: "#2a3140", red: "#ff6b5e", blue: "#6ea2ff", dirt: "#6b4a30", foul: "#153d22", infield: "#276a37", crease: "#2e4a66", key: "#7a3524", court: "#1d4468", post: "#ffd23f", pylon: "#ff8a3d" },
  groups: {
    nhl: { surface: "#26343f", alt: "#222f39", boards: "#3a4652", crease: "#3b5873" },
    nba: { surface: "#5a4128", alt: "#533b24", boards: "#1c1410", key: "#16263f", line: "#f3f0e6" },
    mlb: { surface: "#1d4a2c" },
    soccer: { surface: "#1d4a2c" },
    curling: { surface: "#2a3a47", boards: "#3a4652", line: "#e6eef5", rgo: "#6a97ff", rgm: "#dfe8ef", rgi: "#ff6b5e", rgb: "#dfe8ef", hog: "#ff7a6e", hack: "#c9d3da", fgz: "rgba(120,160,255,.12)", pebble: "rgba(190,210,225,.35)" },
  },
};

const NIGHT: Look = {
  about: "A floodlit evening: a deep ground, a dark apron and pale lines.",
  light: { ...NIGHT_DARK, base: { ...NIGHT_DARK.base, apron: "#10151f" } },
  dark: NIGHT_DARK,
};

const chalkboard = (surface: string, alt: string, apron: string): Mode => ({
  base: { ink: "#eef0e6", line: "#f4f1e6", apron, surface, alt, zone: "#26332d", boards: "#4a5a52", red: "#f1a8a0", blue: "#a5c8ee", dirt: "#3e4a42", foul: "#26312b", infield: "#34423a", crease: "#3b4d58", key: "#3a463f", court: "#2e4655", post: "#f2e6a8", pylon: "#f1b98a", rgo: "#a5c8ee", rgm: "#f4f1e6", rgi: "#f1a8a0", rgb: "#f4f1e6", hog: "#f1a8a0", hack: "#d8d4c4", fgz: "rgba(165,200,238,.12)", pebble: "rgba(244,241,230,.25)" },
});

const CHALKBOARD: Look = {
  about: "Chalk on a slate board: white lines, pink and blue chalk for the red and blue ones, for a teaching diagram.",
  light: chalkboard("#2e3b35", "#2a362f", "#1c2622"),
  dark: chalkboard("#232d28", "#202923", "#151c19"),
};

const blueprint = (surface: string, alt: string, apron: string, boards: string): Mode => ({
  base: { ink: "#e6f1ff", line: "#e6f1ff", apron, surface, alt, zone: alt, boards, red: "#ffd1c9", blue: "#bfe0ff", dirt: "#2a64a8", foul: alt, infield: "#2358a0", crease: "#2f6aae", key: "#164277", court: surface, post: "#ffe08a", pylon: "#ffb86b", rgo: "#8ec1ff", rgm: "#e6f1ff", rgi: "#ffd1c9", rgb: "#e6f1ff", hog: "#ffd1c9", hack: "#cfe3fb", fgz: "rgba(190,224,255,.14)", pebble: "rgba(230,241,255,.25)" },
});

const BLUEPRINT: Look = {
  about: "White lines on blueprint blue, as a drawing office would print the rulebook's plan.",
  light: blueprint("#1d4f8f", "#1a4983", "#123a6b", "#2c63a6"),
  dark: blueprint("#153e72", "#123864", "#0c2c54", "#21528c"),
};

const PRINT: Look = {
  about: "Black on white with greys for the parts a colour would tell apart: for a printer that has no colour (dark: the same as white on black).",
  light: {
    base: { ink: "#111111", line: "#111111", apron: "#ffffff", surface: "#ffffff", alt: "#f0f0f0", zone: "#d9d9d9", boards: "#888888", red: "#444444", blue: "#111111", dirt: "#d6d6d6", foul: "#fafafa", infield: "#ececec", crease: "#e4e4e4", key: "#d4d4d4", court: "#e8e8e8", post: "#333333", pylon: "#333333", rgo: "#666666", rgm: "#eeeeee", rgi: "#999999", rgb: "#ffffff", hog: "#444444", hack: "#222222", fgz: "rgba(0,0,0,.08)", pebble: "rgba(0,0,0,.18)" },
  },
  dark: {
    base: { ink: "#f2f2f2", line: "#f2f2f2", apron: "#000000", surface: "#111111", alt: "#1a1a1a", zone: "#2a2a2a", boards: "#777777", red: "#cfcfcf", blue: "#ffffff", dirt: "#333333", foul: "#0a0a0a", infield: "#1e1e1e", crease: "#262626", key: "#2e2e2e", court: "#1c1c1c", post: "#dddddd", pylon: "#dddddd", rgo: "#aaaaaa", rgm: "#222222", rgi: "#777777", rgb: "#000000", hog: "#cfcfcf", hack: "#eeeeee", fgz: "rgba(255,255,255,.1)", pebble: "rgba(255,255,255,.2)" },
  },
};

const BROADCAST_LIGHT: Mode = {
  base: { ink: "#f2f6fb", line: "#ffffff", apron: "#0d1b2e", surface: "#1f8a3a", alt: "#1b7d34", zone: "#14602a", boards: "#1a2a40", red: "#e0342b", blue: "#1f56d6", dirt: "#b0753f", foul: "#1a7733", infield: "#2f9d49", crease: "#bcd6f5", key: "#d1491f", court: "#1f5fb0", post: "#ffd21f", pylon: "#ff6a1a" },
  groups: {
    nhl: { surface: "#f4f9ff", alt: "#ecf3fb", boards: "#3b4d66", red: "#d11f17", blue: "#1a49c4" },
    nba: { surface: "#b97a2e", alt: "#af7228", key: "#1d4ed8", boards: "#6b4318" },
    curling: { surface: "#f4f9ff", boards: "#3b4d66", line: "#0d1b2e", rgo: "#1a49c4", rgm: "#ffffff", rgi: "#d11f17", rgb: "#ffffff", hog: "#d11f17", hack: "#1a2a40", fgz: "rgba(26,73,196,.12)", pebble: "rgba(80,110,150,.4)" },
  },
};

const BROADCAST: Look = {
  about: "Television graphics: saturated turf and wood, a deep navy apron, bright red and blue lines.",
  light: BROADCAST_LIGHT,
  dark: {
    base: { ...BROADCAST_LIGHT.base, apron: "#060d18", surface: "#176a2d", alt: "#146027", zone: "#0f4a20", foul: "#135a27", infield: "#237b39" },
    groups: {
      nhl: { surface: "#2f4e6e", alt: "#2a4766", boards: "#223047", red: "#ff8a80", blue: "#8db6ff" },
      nba: { surface: "#8f5b1f", alt: "#865418", key: "#1d4ed8", boards: "#4a2f10" },
      curling: { surface: "#7f9db8", boards: "#223047", line: "#0d1b2e", rgo: "#1a49c4", rgm: "#e6eef5", rgi: "#b3140d", rgb: "#e6eef5", hog: "#8f0f09", hack: "#0d1b2e", fgz: "rgba(26,73,196,.15)", pebble: "rgba(40,70,100,.35)" },
    },
  },
};

const HIGH_CONTRAST: Look = {
  about: "Black on white, or white on black: every line at the highest contrast the colours allow (WCAG AAA), for low vision and for projectors.",
  light: {
    base: { ink: "#000000", line: "#000000", apron: "#ffffff", surface: "#ffffff", alt: "#e6e6e6", zone: "#e6e6e6", boards: "#000000", red: "#b00020", blue: "#0030c0", dirt: "#d0d0d0", foul: "#f2f2f2", infield: "#e0e0e0", crease: "#dcdcdc", key: "#cfcfcf", court: "#e6e6e6", post: "#000000", pylon: "#000000", rgo: "#0030c0", rgm: "#ffffff", rgi: "#b00020", rgb: "#ffffff", hog: "#b00020", hack: "#000000", fgz: "rgba(0,48,192,.12)", pebble: "rgba(0,0,0,.25)" },
  },
  dark: {
    base: { ink: "#ffffff", line: "#ffffff", apron: "#000000", surface: "#000000", alt: "#141414", zone: "#141414", boards: "#ffffff", red: "#ff6b6b", blue: "#7fb2ff", dirt: "#3a3a3a", foul: "#0a0a0a", infield: "#222222", crease: "#1a2a40", key: "#333333", court: "#0a0a0a", post: "#ffeb3b", pylon: "#ffeb3b", rgo: "#7fb2ff", rgm: "#000000", rgi: "#ff6b6b", rgb: "#000000", hog: "#ff6b6b", hack: "#ffffff", fgz: "rgba(127,178,255,.18)", pebble: "rgba(255,255,255,.3)" },
  },
};

const LINE_DRAWING: Look = {
  about: "Ink only: black lines on white and nothing filled, for a plan that prints on any printer and copies cleanly (dark: white lines on black).",
  light: {
    base: { ink: "#000000", line: "#000000", apron: "#ffffff", surface: "#ffffff", alt: "#ffffff", zone: "#ffffff", boards: "#000000", red: "#000000", blue: "#000000", dirt: "#ffffff", foul: "#ffffff", infield: "#ffffff", crease: "#ffffff", key: "#ffffff", court: "#ffffff", post: "#000000", pylon: "#000000", rgo: "#ffffff", rgm: "#ffffff", rgi: "#ffffff", rgb: "#ffffff", hog: "#000000", hack: "#000000", fgz: "rgba(0,0,0,0)", pebble: "rgba(0,0,0,0)", markY: "#000000", markB: "#000000", markG: "#000000", markR: "#000000" },
    // An athletics stadium in ink: nothing filled but the pads of a pole vault box, so that a pit, a mat, a circle and the track are their outlines.
    groups: { athletics: { track: "#ffffff", sand: "#ffffff", mat: "#ffffff", water: "#ffffff", concrete: "#ffffff", pad: "#000000" } },
  },
  dark: {
    base: { ink: "#ffffff", line: "#ffffff", apron: "#000000", surface: "#000000", alt: "#000000", zone: "#000000", boards: "#ffffff", red: "#ffffff", blue: "#ffffff", dirt: "#000000", foul: "#000000", infield: "#000000", crease: "#000000", key: "#000000", court: "#000000", post: "#ffffff", pylon: "#ffffff", rgo: "#000000", rgm: "#000000", rgi: "#000000", rgb: "#000000", hog: "#ffffff", hack: "#ffffff", fgz: "rgba(0,0,0,0)", pebble: "rgba(0,0,0,0)", markY: "#ffffff", markB: "#ffffff", markG: "#ffffff", markR: "#ffffff" },
    groups: { athletics: { track: "#000000", sand: "#000000", mat: "#000000", water: "#000000", concrete: "#000000", pad: "#ffffff" } },
  },
};

/**
 * The named looks. Each is a light and a dark palette for every sport, as custom properties on `.kyogijo[data-palette="<name>"]`; pass one as `look`.
 * @example
 * ```ts
 * import { LOOKS, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
 * const svg = drawKyogijo({ sport: "nhl", look: "chalkboard" });
 * console.log(Object.keys(LOOKS).length, svg.includes('data-palette="chalkboard"'));
 * // 7 true
 * ```
 */
export const LOOKS: Readonly<Record<LookName, Look>> = { grass: GRASS, night: NIGHT, chalkboard: CHALKBOARD, blueprint: BLUEPRINT, print: PRINT, broadcast: BROADCAST, "high-contrast": HIGH_CONTRAST, "line-drawing": LINE_DRAWING };

/** The names of the looks, in the order a menu lists them. */
export const LOOK_NAMES = Object.freeze(Object.keys(LOOKS) as LookName[]);

/** True when a value names a look. */
export const isLook = (value: unknown): value is LookName => typeof value === "string" && Object.prototype.hasOwnProperty.call(LOOKS, value);

/** What the net sports' courts paint besides the surface and the apron, when a look does not say: the free zone in the second tone, a painted area in the key's, the net in the line's. */
const withNet = (palette: Palette): Palette => ({ free: palette.alt, area: palette.key, net: palette.line, ...palette });

/** What an athletics stadium paints besides the surface and the apron, when a look does not say: the track in the dirt's colour, the sand and the concrete in the boards', the mat in the court's, the water in the crease's, the pads in the ink. */
const withTrack = (palette: Palette): Palette => ({ track: palette.dirt, sand: palette.boards, mat: palette.court, water: palette.crease, concrete: palette.boards, pad: palette.ink, ...palette });

/** A look's palette for a sport in one mode: the look's base with what the sport's group changes. */
export function lookPalette(look: LookName, mode: "light" | "dark", sport: Sport | string): Palette {
  const m = LOOKS[look][mode];
  const group = groupOf(sport);
  const merged = { ...m.base, ...(group === undefined ? {} : m.groups?.[group]) };
  return group === "net" ? withNet(merged) : group === "athletics" ? withTrack(merged) : merged;
}

/**
 * The pairs of a palette that must read: what is painted on what, as `[ink, ground, least contrast]` (WCAG 2.2's 3:1 for a line, 4.5:1 for text). The words
 * of the drawing are on the apron; a line is on the surface and, where its sport paints them under it, on the second tone of the mowing or planks, the key,
 * the dirt, the infield and the foul ground.
 */
export const LOOK_PAIRS: Readonly<Record<Group | "all", readonly (readonly [PaletteKey, PaletteKey, number])[]>> = {
  all: [["ink", "apron", 4.5]],
  football: [["line", "surface", 3], ["line", "alt", 3]],
  nhl: [["red", "surface", 3], ["blue", "surface", 3]],
  nba: [["line", "surface", 3], ["line", "alt", 3], ["line", "key", 3]],
  mlb: [["line", "surface", 3], ["line", "alt", 3], ["line", "infield", 3], ["line", "dirt", 3], ["line", "foul", 3]],
  soccer: [["line", "surface", 3], ["line", "alt", 3], ["line", "court", 3]],
  curling: [["line", "surface", 3], ["hog", "surface", 3], ["hack", "surface", 3]],
  net: [["line", "surface", 3], ["line", "free", 3], ["line", "area", 3]],
  athletics: [["line", "surface", 3], ["line", "track", 3]],
};

/** The contrast ratio of two colours (WCAG 2.2): 1 to 21, or `undefined` when a colour cannot be read without a browser. */
export function contrastOf(a: string | undefined, b: string | undefined): number | undefined {
  const x = rgbOf(a);
  const y = rgbOf(b);
  if (x === undefined || y === undefined) return undefined;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

// ---- The stylesheet. ----

const declarations = (palette: Palette): string =>
  (Object.keys(palette) as PaletteKey[])
    .map((key) => `${PROPERTY[key]}:${palette[key]}`)
    .join(";");

/** The rules of one mode of one look, for the base and each group, behind a selector that says which mode it is. */
function modeRules(name: LookName, mode: Mode, wrap: (selector: string) => string): string[] {
  const out: string[] = [`${wrap(`.kyogijo[data-palette=${name}]`)}{${declarations(mode.base)}}`];
  const groups = new Set<Group>([...(Object.keys(mode.groups ?? {}) as Group[]), "net", "athletics"]);
  for (const group of groups) {
    const palette = mode.groups?.[group] ?? {};
    // A net sport's court has three colours the other surfaces have not: the group's rule carries them, made from the base where the look gives none.
    const net = group === "net" ? withNet({ ...mode.base, ...palette }) : {};
    const track = group === "athletics" ? withTrack({ ...mode.base, ...palette }) : {};
    const written = group === "net" ? { ...palette, free: net.free, area: net.area, net: net.net } : group === "athletics" ? { ...palette, track: track.track, sand: track.sand, mat: track.mat, water: track.water, concrete: track.concrete, pad: track.pad } : palette;
    out.push(`${wrap(GROUP_SPORTS[group].map((sport) => `.kyogijo[data-palette=${name}][data-sport=${sport}]`).join(","))}{${declarations(written)}}`);
  }
  return out;
}

/** The stylesheet of one look, light and dark, at no weight. A drawing with a `look` carries its look's. */
export function lookStyle(name: LookName): string {
  const look = LOOKS[name];
  const light = modeRules(name, look.light, (s) => `:where(${s})`);
  // The device's setting (unless the page says light), then the page's or the drawing's own `data-theme="dark"`.
  const auto = modeRules(name, look.dark, (s) => `:where(${s.split(",").map((one) => `html:not([data-theme=light]) ${one}:not([data-theme=light])`).join(",")})`);
  const forced = modeRules(name, look.dark, (s) => `:where(${s.split(",").flatMap((one) => [`html[data-theme=dark] ${one}`, one.replace(/^\.kyogijo/, ".kyogijo[data-theme=dark]")]).join(",")})`);
  return [...light, `@media (prefers-color-scheme:dark){${auto.join("\n")}}`, ...forced].join("\n");
}

/** The stylesheet of every look, for a page that draws with `style: "none"`. */
export const KYOGIJO_LOOK_STYLE: string = LOOK_NAMES.map(lookStyle).join("\n");
