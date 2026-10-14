// The stylesheet of an athletics drawing: the colours of the track (Mondo red, Berlin's blue, a terracotta, a green), of the grass round it, of the sand of a pit, the mat of a jump, the water of the pit
// and the concrete of a throwing circle, and of the coloured marks (the yellow of the 4 x 100 m's zones, the blue of the 4 x 400 m's and the 110 m hurdles, which are red on a blue track, the green of the
// 400 m hurdles and the breakline). In light and in dark, at no weight, so that a look, a page's own rule and the options' `colors` all win. Kept apart so that a drawing of another sport does not
// carry them. These are our colours: the Manual names a colour only for the marks.
import type { AthleticsTrackLook } from "./athletics/types.ts";

interface Colours {
  track: string;
  surface: string;
  alt: string;
  apron: string;
}

const MARKS_LIGHT = "--ky-ath-y:#f2c230;--ky-ath-b:#1d4ed8;--ky-ath-g:#1f9d4c;--ky-ath-k:#1c1f1d;--ky-ath-r:#d6342a;--ky-sand:#e3cf9d;--ky-mat:#3d6fb5;--ky-water:#7cc4ee;--ky-concrete:#a9adb0;--ky-pad:#40454a";
const MARKS_DARK = "--ky-ath-y:#f2c230;--ky-ath-b:#6f95ff;--ky-ath-g:#43c06d;--ky-ath-k:#0f1210;--ky-ath-r:#ef6c60;--ky-sand:#a89568;--ky-mat:#2c528a;--ky-water:#4d8fb8;--ky-concrete:#6e7377;--ky-pad:#1f2326";

/** The colours of each track look, light and dark. */
export const TRACK_COLOURS: Readonly<Record<AthleticsTrackLook, { light: string; dark: string }>> = {
  red: { light: "#c05a46", dark: "#9a4636" },
  blue: { light: "#2f65b4", dark: "#264f8c" },
  terracotta: { light: "#c9744a", dark: "#a45b3a" },
  green: { light: "#3b8a62", dark: "#2d6b4c" },
};

const GROUND: { light: Colours; dark: Colours } = {
  light: { track: TRACK_COLOURS.red.light, surface: "#4c9b56", alt: "#438f4d", apron: "#d9d6c8" },
  dark: { track: TRACK_COLOURS.red.dark, surface: "#2d6c3e", alt: "#276136", apron: "#1b1f1c" },
};

const base = (c: Colours, marks: string): string => `--ky-track:${c.track};--ky-surface:${c.surface};--ky-surface-alt:${c.alt};--ky-apron:${c.apron};${marks}`;

/** The rules of an athletics drawing's colours. A drawing that names its track (`athletics.track`) has its `data-track`, whose rules come after a look's so that the track wins. */
export const KYOGIJO_ATHLETICS_STYLE: string = [
  `:where(.kyogijo[data-sport=athletics]){${base(GROUND.light, MARKS_LIGHT)}}`,
  `@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo[data-sport=athletics]:not([data-theme=light])){${base(GROUND.dark, MARKS_DARK)}}}`,
  `:where(html[data-theme=dark] .kyogijo[data-sport=athletics],.kyogijo[data-theme=dark][data-sport=athletics]){${base(GROUND.dark, MARKS_DARK)}}`,
  ".kyogijo .ky-ath-track{fill:var(--ky-track)}",
  ".kyogijo .ky-ath-grass{fill:var(--ky-surface)}",
  ".kyogijo .ky-ath-sand{fill:var(--ky-sand)}",
  ".kyogijo .ky-ath-mat{fill:var(--ky-mat)}",
  ".kyogijo .ky-ath-water{fill:var(--ky-water)}",
  ".kyogijo .ky-ath-concrete{fill:var(--ky-concrete)}",
  ".kyogijo .ky-ath-pad{fill:var(--ky-pad)}",
  ".kyogijo .ky-ath-board{fill:var(--ky-line)}",
  ".kyogijo .ky-ath-bank{fill:var(--ky-ath-k);fill-opacity:.12}",
  ".kyogijo .ky-ath-y{stroke:var(--ky-ath-y);fill:none}.kyogijo .ky-ath-b{stroke:var(--ky-ath-b);fill:none}.kyogijo .ky-ath-g{stroke:var(--ky-ath-g);fill:none}.kyogijo .ky-ath-k{stroke:var(--ky-ath-k);fill:none}.kyogijo .ky-ath-r{stroke:var(--ky-ath-r);fill:none}.kyogijo .ky-ath-s{stroke:var(--ky-line);stroke-opacity:.8;fill:none}",
  ".kyogijo .ky-ath-y-fill{fill:var(--ky-ath-y)}.kyogijo .ky-ath-b-fill{fill:var(--ky-ath-b)}.kyogijo .ky-ath-g-fill{fill:var(--ky-ath-g)}.kyogijo .ky-ath-k-fill{fill:var(--ky-ath-k)}.kyogijo .ky-ath-r-fill{fill:var(--ky-ath-r)}",
  ".kyogijo .ky-ath-num{fill:none;stroke:var(--ky-line);stroke-linejoin:miter}",
  ".kyogijo .ky-ath-tag{fill:var(--ky-plate)}.kyogijo .ky-ath-tagnum{fill:none;stroke:var(--ky-plate-ink);stroke-linejoin:miter}",
].join("\n");

/** The rules of a named track: its colour in light and dark, and, on a blue track, red where the rules say blue (the 4 x 400 m's marks and the 110 m hurdles). */
export function trackStyle(track: AthleticsTrackLook): string {
  const c = TRACK_COLOURS[track];
  const at = `[data-track=${track}]`;
  const red = track === "blue" ? ";--ky-ath-b:#e0342b" : "";
  const redDark = track === "blue" ? ";--ky-ath-b:#ff7a6e" : "";
  return [
    `:where(.kyogijo${at}){--ky-track:${c.light}${red}}`,
    `@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo${at}:not([data-theme=light])){--ky-track:${c.dark}${redDark}}}`,
    `:where(html[data-theme=dark] .kyogijo${at},.kyogijo[data-theme=dark]${at}){--ky-track:${c.dark}${redDark}}`,
  ].join("\n");
}

/** The rules of every named track, for a page that draws with `style: "none"`. */
export const KYOGIJO_TRACK_STYLE: string = (Object.keys(TRACK_COLOURS) as AthleticsTrackLook[]).map(trackStyle).join("\n");

/** The base rules a drawing of this sport writes into its stylesheet: nothing for another sport. */
export const athleticsStyle = (sport: string): string => (sport === "athletics" ? KYOGIJO_ATHLETICS_STYLE : "");

/** The rules of the track the options name, written after a look's so that the track wins: nothing for another sport or a track not named. */
export const athleticsTrackRules = (sport: string, track: AthleticsTrackLook | undefined): string => (sport === "athletics" && track !== undefined ? trackStyle(track) : "");
