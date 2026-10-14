// The stylesheet of the net sports' courts: the rules of their classes, and the colours of each named look in light and in dark. These are our colours: no
// rulebook prints a colour for a tennis court, a volleyball floor or a pickleball court (the FIVB asks only that the court, the free zone and the lines
// differ; the FIP prefers a green, blue or terracotta floor for padel, and the IRF recommends red lines for racquetball). Kept apart so that a drawing of another sport does not carry them: a drawing writes in the rules and its own look.
import type { NetSport } from "./leagues/courts.ts";

/**
 * The colours of a look: the court, the free zone round it, the ground round that, a painted area on the court, and the lines. A look may leave the area and the lines to the
 * theme. The walls of a padel, squash or racquetball court and the surrounds of a teqball court, a padel court's fence (`mesh`), a squash court's front wall laid flat
 * (`face`, with its `tin`), a teqball table and a roundnet set's net are for the sports that have them.
 */
interface Look {
  surface: string;
  free: string;
  apron: string;
  area?: string;
  line?: string;
  /** The lines on a squash court's front wall, which the specification lets differ from the floor's (clause 10.13). */
  wallLine?: string;
  wall?: string;
  mesh?: string;
  face?: string;
  tin?: string;
  table?: string;
  setnet?: string;
}

const WALL = { light: { wall: "#4f575f", mesh: "#98a1a9" }, dark: { wall: "#8b949c", mesh: "#59626a" } };
// World Squash's specification asks that court markings contrast with the surfaces beside them (5.01.01) and lets them be any colour that does (10.13), the walls' lines
// differing from the floor's if need be. Red is the colour squash lines are painted in: ours, a red dark enough on the light floor and pale enough on the dark one to read at 3:1.
const FACE = { light: { face: "#efeadf", tin: "#c3c8cd", wallLine: "#a8201a" }, dark: { face: "#454b52", tin: "#34393f", wallLine: "#ffb3a8" } };

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
  padel: {
    blue: { light: { surface: "#2f6fb5", free: "#2f6fb5", apron: "#d3d9d0", ...WALL.light }, dark: { surface: "#2a5a93", free: "#2a5a93", apron: "#1a1c1b", ...WALL.dark } },
    green: { light: { surface: "#3f8f5f", free: "#3f8f5f", apron: "#d3d9d0", ...WALL.light }, dark: { surface: "#2e6c47", free: "#2e6c47", apron: "#1a1c1b", ...WALL.dark } },
    terracotta: { light: { surface: "#c0623f", free: "#c0623f", apron: "#d9cdb8", ...WALL.light }, dark: { surface: "#8f4630", free: "#8f4630", apron: "#1b1f1c", ...WALL.dark } },
  },
  squash: {
    wood: { light: { surface: "#d7a766", free: "#d7a766", apron: "#c9c3b4", line: "#a8201a", ...WALL.light, ...FACE.light }, dark: { surface: "#8a6638", free: "#8a6638", apron: "#1a1c1b", line: "#ffb3a8", ...WALL.dark, ...FACE.dark } },
    blue: { light: { surface: "#4a7fb8", free: "#4a7fb8", apron: "#d3d8df", ...WALL.light, ...FACE.light }, dark: { surface: "#35608f", free: "#35608f", apron: "#1a1c1b", ...WALL.dark, ...FACE.dark } },
  },
  racquetball: {
    wood: { light: { surface: "#efd9ae", free: "#efd9ae", apron: "#c9c3b4", line: "#c8372d", ...WALL.light }, dark: { surface: "#55401f", free: "#55401f", apron: "#1a1c1b", line: "#ff6b5e", ...WALL.dark } },
    convertible: { light: { surface: "#efd9ae", free: "#efd9ae", apron: "#c9c3b4", line: "#2a5db0", ...WALL.light }, dark: { surface: "#55401f", free: "#55401f", apron: "#1a1c1b", line: "#7aa3e6", ...WALL.dark } },
  },
  sepaktakraw: {
    blue: { light: { surface: "#3a73b5", free: "#2c5a91", apron: "#d3d8df" }, dark: { surface: "#2e5c92", free: "#234875", apron: "#1a1c1b" } },
    green: { light: { surface: "#3f8f66", free: "#2f7050", apron: "#d3d9d0" }, dark: { surface: "#2d6b4c", free: "#235539", apron: "#1a1c1b" } },
    wood: { light: { surface: "#dcae6e", free: "#c99a5c", apron: "#c9c3b4" }, dark: { surface: "#8f6a3c", free: "#7d5d35", apron: "#1a1c1b" } },
  },
  teqball: {
    grey: { light: { surface: "#8d949b", free: "#8d949b", apron: "#d6d8da", table: "#2a5db0", ...WALL.light }, dark: { surface: "#5f666d", free: "#5f666d", apron: "#1a1c1d", table: "#4a78c4", ...WALL.dark } },
    blue: { light: { surface: "#3b78b8", free: "#3b78b8", apron: "#d3d8df", table: "#e4eaef", ...WALL.light }, dark: { surface: "#2e5f95", free: "#2e5f95", apron: "#1a1c1b", table: "#aeb8c2", ...WALL.dark } },
    green: { light: { surface: "#4d9468", free: "#4d9468", apron: "#d3d9d0", table: "#27323b", ...WALL.light }, dark: { surface: "#35704b", free: "#35704b", apron: "#1a1c1b", table: "#8696a4", ...WALL.dark } },
  },
  roundnet: {
    grass: { light: { surface: "#68a653", free: "#68a653", apron: "#cfd6bd", setnet: "#e9efe4" }, dark: { surface: "#3f6e32", free: "#3f6e32", apron: "#1b1f1c", setnet: "#a9b8a2" } },
    sand: { light: { surface: "#e3cf9a", free: "#e3cf9a", apron: "#cdbf9c", line: "#2a5db0", setnet: "#f6efd9" }, dark: { surface: "#8a784d", free: "#8a784d", apron: "#1d1c17", setnet: "#c9bd9a" } },
    indoor: { light: { surface: "#b9b2a2", free: "#b9b2a2", apron: "#d3d0c8", setnet: "#ece9e1" }, dark: { surface: "#6f6a5f", free: "#6f6a5f", apron: "#1b1b19", setnet: "#a9a597" } },
  },
  netball: {
    wood: { light: { surface: "#d9a96a", free: "#c4955a", apron: "#c9c3b4" }, dark: { surface: "#8f6a3c", free: "#7d5d35", apron: "#1a1c1b" } },
    blue: { light: { surface: "#3d78bd", free: "#2f5f9a", apron: "#dcd8c9" }, dark: { surface: "#2f5f99", free: "#244a78", apron: "#1b1f1c" } },
    green: { light: { surface: "#4d9468", free: "#3c7852", apron: "#dcd8c9" }, dark: { surface: "#35704b", free: "#285539", apron: "#1b1f1c" } },
  },
};

const OPTIONAL: readonly (readonly [keyof Look, string])[] = [["area", "--ky-area"], ["line", "--ky-line"], ["wallLine", "--ky-wall-line"], ["wall", "--ky-wall"], ["mesh", "--ky-mesh"], ["face", "--ky-face"], ["tin", "--ky-tin"], ["table", "--ky-table"], ["setnet", "--ky-setnet"]];

const vars = (look: Look, net: string): string => `--ky-surface:${look.surface};--ky-free:${look.free};--ky-apron:${look.apron};--ky-net:${net}${OPTIONAL.map(([key, name]) => (look[key] === undefined ? "" : `;${name}:${look[key]}`)).join("")}`;

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

/** The rules of the classes only some courts have: walls and fences, the front wall of a squash court and its lines, a teqball table and a roundnet set's net. */
const FIXTURES = `
.kyogijo .ky-wall{fill:var(--ky-wall)}
.kyogijo .ky-mesh{fill:var(--ky-mesh)}
.kyogijo .ky-face{fill:var(--ky-face)}
.kyogijo .ky-tin{fill:var(--ky-tin)}
.kyogijo .ky-wall-line{fill:var(--ky-wall-line,var(--ky-line))}
.kyogijo .ky-table{fill:var(--ky-table)}
.kyogijo .ky-set-net{fill:var(--ky-setnet)}`.trim();

/** The rules of a drawing of this sport in this look: the shared rules, the rules of the fixtures its sport has, and the look's colours. */
export function courtStyle(sport: NetSport, look: string): string {
  return `${CLASSES}\n${COURT_LOOKS[sport][look].light.wall !== undefined || COURT_LOOKS[sport][look].light.table !== undefined || COURT_LOOKS[sport][look].light.setnet !== undefined ? `${FIXTURES}\n` : ""}${lookRules(sport, look)}`;
}

/** Every net sport's rules and every look, for a page that draws with `style: "none"` and supplies the stylesheet itself. */
export const KYOGIJO_COURTS_STYLE = `${CLASSES}\n${FIXTURES}\n${(Object.keys(COURT_LOOKS) as NetSport[]).flatMap((sport) => Object.keys(COURT_LOOKS[sport]).map((name) => lookRules(sport, name))).join("\n")}`;
