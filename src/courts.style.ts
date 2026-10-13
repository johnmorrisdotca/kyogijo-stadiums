// The stylesheet of the net sports' courts: the rules of their classes, and the colours of each named look in light and in dark. These are our colours: no
// rulebook prints a colour for a tennis court, a volleyball floor or a pickleball court (the FIVB asks only that the court, the free zone and the lines
// differ). Kept apart so that a drawing of another sport does not carry them: a drawing writes in the rules and its own look.
import type { NetSport } from "./leagues/courts.ts";

/** The colours of a look: the court, the free zone round it, the ground round that, a painted area on the court, and the lines. A look may leave the area and the lines to the theme. */
interface Look {
  surface: string;
  free: string;
  apron: string;
  area?: string;
  line?: string;
}

interface Pair {
  light: Look;
  dark: Look;
}

const NET = { light: "#20262b", dark: "#e6e9ec" };

/** The looks of every sport, each in light and dark. */
export const COURT_LOOKS: Readonly<Record<NetSport, Readonly<Record<string, Pair>>>> = {
  tennis: {
    "hard-blue": { light: { surface: "#3d78bd", free: "#2f5f9a", apron: "#dcd8c9" }, dark: { surface: "#2f5f99", free: "#244a78", apron: "#1b1f1c" } },
    "hard-green": { light: { surface: "#4d9468", free: "#3c7852", apron: "#dcd8c9" }, dark: { surface: "#35704b", free: "#285539", apron: "#1b1f1c" } },
    clay: { light: { surface: "#c86b43", free: "#b45a35", apron: "#d9cdb8" }, dark: { surface: "#8e4a2e", free: "#7a3f27", apron: "#1b1f1c" } },
    grass: { light: { surface: "#68a653", free: "#579544", apron: "#cfd6bd" }, dark: { surface: "#3f6e32", free: "#355c2a", apron: "#1b1f1c" } },
  },
  volleyball: {
    wood: { light: { surface: "#dcae6e", free: "#c99a5c", apron: "#c9c3b4", area: "#d3a362" }, dark: { surface: "#8f6a3c", free: "#7d5d35", apron: "#1a1c1b", area: "#876234" } },
    blue: { light: { surface: "#3b78b8", free: "#2b5d92", apron: "#d3d8df", area: "#5b94cc" }, dark: { surface: "#2e5f95", free: "#234a74", apron: "#1a1c1b", area: "#3e72aa" } },
    sand: { light: { surface: "#ecd7a3", free: "#e0c78b", apron: "#cdbf9c", line: "#2a5db0" }, dark: { surface: "#a89466", free: "#957f55", apron: "#1d1c17", line: "#7aa3e6" } },
  },
  badminton: {
    green: { light: { surface: "#3f8f6b", free: "#2f6f52", apron: "#d3d9d0" }, dark: { surface: "#2d6a4e", free: "#225240", apron: "#1a1c1b" } },
    blue: { light: { surface: "#3b6fb0", free: "#2b5489", apron: "#d3d8df" }, dark: { surface: "#2d5688", free: "#22426a", apron: "#1a1c1b" } },
    wood: { light: { surface: "#dcae6e", free: "#c99a5c", apron: "#c9c3b4" }, dark: { surface: "#8f6a3c", free: "#7d5d35", apron: "#1a1c1b" } },
  },
  pickleball: {
    "blue-green": { light: { surface: "#3f85b8", free: "#3f8f5a", apron: "#cdd6c8", area: "#6fb0d8" }, dark: { surface: "#2f6a95", free: "#2f6f45", apron: "#1a1c1b", area: "#4a88b0" } },
    green: { light: { surface: "#4f9a5c", free: "#3a7a47", apron: "#cdd6c8", area: "#82c28d" }, dark: { surface: "#386f43", free: "#2b5835", apron: "#1a1c1b", area: "#4e8c59" } },
    red: { light: { surface: "#b5503a", free: "#8f3b2b", apron: "#d6cdc4", area: "#d27a62" }, dark: { surface: "#8a3d2c", free: "#6c2e21", apron: "#1a1c1b", area: "#a8523d" } },
  },
  tabletennis: {
    blue: { light: { surface: "#1f4f8f", free: "#1f4f8f", apron: "#cfd6df" }, dark: { surface: "#1a4079", free: "#1a4079", apron: "#1a1d21" } },
    green: { light: { surface: "#2f6f4f", free: "#2f6f4f", apron: "#cdd6c8" }, dark: { surface: "#25583f", free: "#25583f", apron: "#1a1d1b" } },
  },
};

const vars = (look: Look, net: string): string => `--ky-surface:${look.surface};--ky-free:${look.free};--ky-apron:${look.apron};--ky-net:${net}${look.area === undefined ? "" : `;--ky-area:${look.area}`}${look.line === undefined ? "" : `;--ky-line:${look.line}`}`;

/** The three rules of one look: light, dark by the device's setting, and dark by the page's `data-theme`. */
function lookRules(sport: NetSport, name: string): string {
  const pair = COURT_LOOKS[sport][name];
  const at = `[data-sport=${sport}][data-look=${name}]`;
  return [
    `:where(.kyogijo${at}){${vars(pair.light, NET.light)}}`,
    `@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo${at}:not([data-theme=light])){${vars(pair.dark, NET.dark)}}}`,
    `:where(html[data-theme=dark] .kyogijo${at},.kyogijo[data-theme=dark]${at}){${vars(pair.dark, NET.dark)}}`,
  ].join("\n");
}

/** The rules every net sport's court shares. */
const CLASSES = `
.kyogijo .ky-free{fill:var(--ky-free)}
.kyogijo .ky-area{fill:var(--ky-area,var(--ky-surface))}
.kyogijo .ky-nt-line,.kyogijo .ky-nt-post{fill:var(--ky-net)}
.kyogijo .ky-serve{fill:var(--ky-serve,#d8e33b);stroke:rgba(0,0,0,.45);stroke-width:.06}
.kyogijo .ky-serve-seam{fill:none;stroke:rgba(0,0,0,.45)}
.kyogijo .ky-tb{font-weight:700;opacity:.9}`.trim();

/** The rules of a drawing of this sport in this look: the shared rules and the look's colours. */
export function courtStyle(sport: NetSport, look: string): string {
  return `${CLASSES}\n${lookRules(sport, look)}`;
}

/** Every net sport's rules and every look, for a page that draws with `style: "none"` and supplies the stylesheet itself. */
export const KYOGIJO_COURTS_STYLE = `${CLASSES}\n${(Object.keys(COURT_LOOKS) as NetSport[]).flatMap((sport) => Object.keys(COURT_LOOKS[sport]).map((name) => lookRules(sport, name))).join("\n")}`;
