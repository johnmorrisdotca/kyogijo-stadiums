// The colours of the budō surfaces, each look in light and in dark. Only the IJF names colours (the official tatami of its World Judo Tour are yellow, Pantone 123 C, and red, Pantone 1795 C, and
// any other the organiser proposes the IJF must approve); the WKF asks only that the outer metre of a kumite area be another colour; no rule paints a dojo's tatami, a kendo floor, a dohyō or a
// kyūdōjō. So the looks are ours, chosen to look like what is seen (a judo mat's yellow and red or blue, an igusa green fading to beige, a clay dohyō) and tuned to read at three to one.
import type { BudoKind } from "./types.ts";

/** What a look sets: the properties of the stylesheet its sport's surface is painted with. */
export interface BudoLook {
  /** The first tone of the mats (the contest area, the mats of a dojo), the second (the safety area, the other mats of a checker floor) and the third (a danger zone, a border: the sheet's `--ky-red`). */
  surface: string;
  alt: string;
  red: string;
  /** The ground round the surface, the free zone round the mats, and the floor of the hall: wood, the boards of a kendo floor, the walls. */
  apron: string;
  free: string;
  floor: string;
  boards: string;
  /** The clay of a dohyō, the sand of its jano-me, the straw of its tawara. */
  dirt?: string;
  sand?: string;
  straw?: string;
}

interface Pair {
  light: BudoLook;
  dark: BudoLook;
}

/** A colour darkened by a share, 0 to 1, towards black. */
function dim(hex: string, k: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - k)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** A look made from its light colours: the dark one is the same hues dimmed. */
function pair(light: BudoLook, k = 0.34): Pair {
  const dark: BudoLook = { ...light };
  for (const key of Object.keys(light) as (keyof BudoLook)[]) {
    const v = light[key];
    if (v !== undefined) dark[key] = key === "apron" ? "#1c1e1d" : key === "free" ? dim(v, 0.5) : dim(v, k);
  }
  return { light, dark };
}

const FLOOR = "#c9a26a";
const WALLS = "#7d756a";
const COMMON = { apron: "#d6d3cb", free: "#e8e4d8", floor: FLOOR, boards: WALLS };
const MATS = {
  "yellow-red": pair({ ...COMMON, surface: "#f4c430", alt: "#c9343b", red: "#b32a2f" }),
  "yellow-blue": pair({ ...COMMON, surface: "#f2c230", alt: "#2f6db3", red: "#b32a2f" }),
  "blue-grey": pair({ ...COMMON, surface: "#3a74c2", alt: "#9aa4ad", red: "#b32a2f" }),
  "green-beige": pair({ ...COMMON, surface: "#7da157", alt: "#d6c595", red: "#b32a2f" }),
  "green-red": pair({ ...COMMON, surface: "#8bb561", alt: "#5a8a46", red: "#c0392b" }),
  "black-red": pair({ ...COMMON, surface: "#2d2f33", alt: "#b8323a", red: "#b8323a" }),
};
/** The dojo's own two: pale yellow contest areas on green mats (the Kodokan's main dojo as it is now), and green mats of one tone with red-orange border mats (as it was). Ours, from the owner's photographs. */
const DOJO_ONLY = {
  "yellow-green": pair({ ...COMMON, surface: "#e8d98e", alt: "#5f9a52", red: "#c8462a" }),
  "green-orange": pair({ ...COMMON, surface: "#6fa352", alt: "#69a04f", red: "#d4572a" }),
};

/** The looks of each sport: the names, the default first, and the colours. */
export const BUDO_LOOKS: Readonly<Record<BudoKind, Readonly<Record<string, Pair>>>> = Object.freeze({
  judo: MATS,
  dojo: { "green-beige": MATS["green-beige"], "yellow-red": MATS["yellow-red"], "yellow-blue": MATS["yellow-blue"], "blue-grey": MATS["blue-grey"], "black-red": MATS["black-red"], "green-red": MATS["green-red"], ...DOJO_ONLY },
  karate: {
    "blue-red": pair({ ...COMMON, surface: "#2b66b9", alt: "#1f4a85", red: "#c43a3a" }),
    "blue-black": pair({ ...COMMON, surface: "#2b66b9", alt: "#26282b", red: "#c43a3a" }),
    "green-beige": pair({ ...COMMON, surface: "#7da157", alt: "#d6c595", red: "#c43a3a" }),
  },
  kendo: {
    wood: pair({ ...COMMON, surface: "#c8955a", alt: "#b98650", red: "#b32a2f", floor: "#c8955a", free: "#e6dccb" }),
    blond: pair({ ...COMMON, surface: "#e0bf8a", alt: "#d3b27c", red: "#b32a2f", floor: "#e0bf8a", free: "#ece4d3" }),
  },
  sumo: { clay: pair({ ...COMMON, surface: "#b0794a", alt: "#a06c40", red: "#b32a2f", dirt: "#b0794a", sand: "#e8dcc2", straw: "#c8a45c" }) },
  kyudo: { wood: pair({ ...COMMON, surface: "#9db57d", alt: "#d8cfb0", red: "#b32a2f", floor: "#b98c58", dirt: "#c9ad7a" }) },
});

/** The names of a sport's looks, the default first. */
export const lookNames = (sport: BudoKind): string[] => Object.keys(BUDO_LOOKS[sport]);

/** The look a name asks for, or the sport's first. @throws Error for a name the sport has no look of. */
export function lookOf(sport: BudoKind, name: unknown): string {
  if (name === undefined) return lookNames(sport)[0];
  if (typeof name !== "string" || !Object.prototype.hasOwnProperty.call(BUDO_LOOKS[sport], name)) throw new Error(`Unknown look "${String(name)}" for "${sport}": use one of ${lookNames(sport).join(", ")}`);
  return name;
}
