// The stylesheet of the pools: the colours of the water, the deck, the lane ropes and the fixtures, in light and in dark, at no weight (`:where()`) so that a look, a page's rule and the options' `colors` all win,
// and the rule of each class a pool is drawn with. The rules of the sports do not set a colour for a deck or the water (they do for the lane ropes: green, blue, yellow, and red floats near the walls, which are
// kept in every look). These are our colours. A drawing carries only the rules its pool uses: the sport's, the light on the water if it has it, the labels of a race if there is one; a page that draws with
// `style: "none"` takes `KYOGIJO_POOL_STYLE`, which has them all.
import { POOL_SPORTS } from "./pool.ts";
import type { DeckLook, PoolLook, PoolSport } from "./pool.types.ts";

/** The colours that change between light and dark, by custom property; the rest do not change. */
const LIGHT: Record<string, string> = {
  "--ky-surface": "#3fb4e6",
  "--ky-surface-alt": "#2a9bd2",
  "--ky-apron": "#e3e1d9",
  "--ky-boards": "#f7f6f1",
  "--ky-line": "#0c3a5c",
  "--ky-plate": "rgba(14,24,32,.88)",
  "--ky-pd": "#f3d32c",
  "--ky-pk": "#454f59",
  "--ky-pe": "#16212a",
  "--ky-ps": "#39424a",
  "--ky-pc": "#cdd2d7",
  "--ky-pw": "#fbfcfd",
};

const DARK: Record<string, string> = {
  "--ky-surface": "#1d7aa8",
  "--ky-surface-alt": "#176b97",
  "--ky-apron": "#1f252a",
  "--ky-boards": "#3a434b",
  "--ky-line": "#031118",
  "--ky-plate": "rgba(0,0,0,.84)",
  "--ky-pd": "#dcc23a",
  "--ky-pk": "#6a7683",
  "--ky-pe": "#05090c",
  "--ky-ps": "#8793a0",
  "--ky-pc": "#66727d",
  "--ky-pw": "#e9eef2",
};

/** The colours that are the same in both modes: the lane ropes and the fixtures' accents (the rules fix the ropes' colours, and a look may change them). */
const SAME: Record<string, string> = {
  "--ky-pg": "#1fa35a",
  "--ky-pb": "#1b66d3",
  "--ky-py": "#f4c514",
  "--ky-pr": "#e0392f",
  "--ky-pf": "#ff7a1a",
  "--ky-fa": "#e0392f",
  "--ky-fb": "#fff",
  "--ky-pbd": "#e8691d",
  "--ky-layer-home": "#ffd23f",
  "--ky-layer-away": "#ff7a59",
  "--ky-layer-ink": "#071a2b",
};

/** The light on the water and the tiles, which a pool has only in the looks that draw them. */
const LIGHT_PAINT: Record<string, string> = { "--ky-pla": "rgba(255,255,255,.34)", "--ky-ptl": "rgba(255,255,255,.2)", "--ky-pda": "rgba(120,112,98,.06)", "--ky-pdj": "rgba(90,84,72,.16)" };
const DARK_PAINT: Record<string, string> = { "--ky-pla": "rgba(190,235,255,.3)", "--ky-ptl": "rgba(190,235,255,.14)", "--ky-pda": "rgba(255,255,255,.04)", "--ky-pdj": "rgba(255,255,255,.1)" };

const declarations = (table: Record<string, string>): string =>
  Object.entries(table)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");

/** What a drawing of a pool has in it, so that its stylesheet carries only what it needs. */
export interface PoolStyleUse {
  sport: PoolSport;
  look: PoolLook;
  deck: DeckLook;
  /** The lanes of a race are drawn: the plates, the medals, the pace bars. */
  race: boolean;
  /** A side section is drawn. */
  section: boolean;
  /** Several pools in one hall: the names of the pools. */
  hall?: boolean;
}

const RULES = {
  common: [
    ".kyogijo .ky-pl-r{fill:none;stroke-linecap:round}",
    ".kyogijo .ky-pl-r-green{stroke:var(--ky-pg)}",
    ".kyogijo .ky-pl-r-blue{stroke:var(--ky-pb)}",
    ".kyogijo .ky-pl-r-yellow{stroke:var(--ky-py)}",
    ".kyogijo .ky-pl-r-red{stroke:var(--ky-pr)}",
    ".kyogijo .ky-pl-r-white{stroke:var(--ky-pw)}",
  ],
  light: [".kyogijo .ky-pl-sa{stop-color:var(--ky-surface)}", ".kyogijo .ky-pl-sb,.kyogijo .ky-pl-sc{stop-color:var(--ky-surface-alt)}", ".kyogijo .ky-pl-lt{fill:var(--ky-pla);fill-opacity:.08;stroke:var(--ky-pla);stroke-width:.2;stroke-linejoin:round}"],
  floor: [".kyogijo .ky-pl-ft{fill:none;stroke:var(--ky-ptl);stroke-width:.14}"],
  deck: [".kyogijo .ky-pl-da{fill:var(--ky-pda)}", ".kyogijo .ky-pl-dt{fill:none;stroke:var(--ky-pdj);stroke-width:.12}"],
  swimming: [
    ".kyogijo .ky-pl-pad{fill:var(--ky-pd);stroke:var(--ky-pe);stroke-width:.14;stroke-linejoin:round}",
    ".kyogijo .ky-pl-bk{fill:var(--ky-pk);stroke:var(--ky-pe);stroke-width:.12;stroke-linejoin:round}",
    ".kyogijo .ky-pl-bn{fill:#fff}",
    ".kyogijo .ky-pl-fa{stroke:var(--ky-fa);fill:none}",
    ".kyogijo .ky-pl-fb2{stroke:var(--ky-fb);fill:none}",
    ".kyogijo .ky-pl-fs{stroke:var(--ky-pf);fill:none}",
    ".kyogijo .ky-pl-st{fill:var(--ky-ps);stroke:var(--ky-pe);stroke-width:.1}",
  ],
  race: [
    ".kyogijo .ky-pl-pl{fill:var(--ky-plate)}",
    ".kyogijo .ky-pl-nm,.kyogijo .ky-pl-tm{fill:var(--ky-plate-ink);font-weight:800}",
    ".kyogijo .ky-pl-ab,.kyogijo .ky-pl-sp,.kyogijo .ky-pl-rc{fill:var(--ky-plate-ink);opacity:.78;font-weight:700}",
    ".kyogijo .ky-pl-ld{fill:var(--ky-plate-ink)}",
    ".kyogijo .ky-pl-dn{fill:#10161c;text-anchor:middle}",
    ".kyogijo .ky-pl-mm{stroke:rgba(0,0,0,.35);stroke-width:.2}",
    ".kyogijo .ky-pl-mr{fill:none;stroke:rgba(255,255,255,.55);stroke-width:.25}",
    ".kyogijo .ky-pl-fb{stroke:rgba(255,255,255,.55);stroke-width:.18}",
    ".kyogijo .ky-pl-pb{stroke:rgba(0,0,0,.35);stroke-width:.18}",
    ".kyogijo .ky-pl-pt-d{fill:#10161c}",
    ".kyogijo .ky-pl-pt-l{fill:#fff}",
    ".kyogijo .ky-pl-ev{font-weight:800}",
    ".kyogijo .ky-pl-ax{opacity:.85;font-weight:700}",
    ".kyogijo .ky-pl-tick{opacity:.7}",
  ],
  section: [
    ".kyogijo .ky-pl-sw{fill:var(--ky-boards);stroke:var(--ky-pe);stroke-width:.2;stroke-linejoin:round}",
    ".kyogijo .ky-pl-lm,.kyogijo .ky-pl-dm{stroke:var(--ky-ink)}",
    ".kyogijo .ky-pl-sx{font-weight:700}",
    ".kyogijo .ky-pl-pole{stroke:var(--ky-ps)}",
    ".kyogijo .ky-pl-fp{fill:var(--ky-fa);stroke:var(--ky-pe);stroke-width:.12;stroke-linejoin:round}",
  ],
  waterpolo: [
    ".kyogijo .ky-pl-rp{stroke:var(--ky-pe);stroke-width:.1}",
    ".kyogijo .ky-pl-rp-red{fill:var(--ky-pr)}",
    ".kyogijo .ky-pl-rp-yellow{fill:var(--ky-py)}",
    ".kyogijo .ky-pl-rp-green{fill:var(--ky-pg)}",
    ".kyogijo .ky-pl-wl{fill:none}",
    ".kyogijo .ky-pl-wl-white{stroke:var(--ky-pw)}",
    ".kyogijo .ky-pl-wl-red{stroke:var(--ky-pr)}",
    ".kyogijo .ky-pl-wl-yellow{stroke:var(--ky-py)}",
    ".kyogijo .ky-pl-ra{fill:var(--ky-pr);fill-opacity:.4;stroke:var(--ky-pr);stroke-width:.2}",
    ".kyogijo .ky-pl-gn{stroke:var(--ky-pw);opacity:.85}",
    ".kyogijo .ky-pl-gb{stroke:var(--ky-pw)}",
    ".kyogijo .ky-pl-gp{fill:var(--ky-pw);stroke:var(--ky-pe);stroke-width:.12}",
    ".kyogijo .ky-pl-tb{fill:var(--ky-pk);stroke:var(--ky-pe);stroke-width:.14}",
    ".kyogijo .ky-pl-sa-l{fill:var(--ky-left)}",
    ".kyogijo .ky-pl-sa-r{fill:var(--ky-right)}",
  ],
  diving: [
    ".kyogijo .ky-pl-sd{fill:var(--ky-boards);stroke:var(--ky-pe);stroke-width:.14}",
    ".kyogijo .ky-pl-pf{fill:var(--ky-pc);stroke:var(--ky-pe);stroke-width:.14}",
    ".kyogijo .ky-pl-spb{fill:var(--ky-pbd);stroke:var(--ky-pe);stroke-width:.12}",
    ".kyogijo .ky-pl-fe{stroke:var(--ky-pe)}",
    ".kyogijo .ky-pl-pm{fill:var(--ky-pr);stroke:var(--ky-pe);stroke-width:.08}",
    ".kyogijo .ky-pl-bt{fill:var(--ky-pe);text-anchor:middle}",
    ".kyogijo .ky-pl-bu{fill:var(--ky-ink)}",
  ],
  artisticswimming: [
    ".kyogijo .ky-pl-dp{fill:#06223c;fill-opacity:.22}",
    ".kyogijo .ky-pl-dpl{stroke:var(--ky-line)}",
    ".kyogijo .ky-pl-jp,.kyogijo .ky-pl-sp2{fill:var(--ky-pk);stroke:var(--ky-pe);stroke-width:.14}",
    ".kyogijo .ky-pl-ch{fill:var(--ky-pw)}",
  ],
  hall: [".kyogijo .ky-pl-vn{fill:var(--ky-ink)}", ".kyogijo .ky-pl-hw{fill:none;stroke:var(--ky-pe);stroke-width:.7;stroke-opacity:.55}", ".kyogijo .ky-pl-seat{fill:var(--ky-pk);fill-opacity:.2;stroke:var(--ky-pe);stroke-width:.3;stroke-opacity:.5}", ".kyogijo .ky-pl-rows{fill:none;stroke:var(--ky-pe);stroke-width:.25;stroke-opacity:.35}"],
} as const;

/** The palette's rules for one or more sports (`.kyogijo[data-sport=...]`): in light, in dark by the device's setting, and in dark by the page's or the drawing's own. */
function palette(sports: readonly PoolSport[], paint: boolean): string {
  const light = { ...LIGHT, ...SAME, ...(paint ? LIGHT_PAINT : {}) };
  const dark = { ...DARK, ...(paint ? DARK_PAINT : {}) };
  return [
    `:where(${sports.map((s) => `.kyogijo[data-sport=${s}]`).join(",")}){${declarations(light)}}`,
    `@media (prefers-color-scheme:dark){:where(${sports.map((s) => `html:not([data-theme=light]) .kyogijo[data-sport=${s}]:not([data-theme=light])`).join(",")}){${declarations(dark)}}}`,
    `:where(${sports.flatMap((s) => [`html[data-theme=dark] .kyogijo[data-sport=${s}]`, `.kyogijo[data-theme=dark][data-sport=${s}]`]).join(",")}){${declarations(dark)}}`,
  ].join("\n");
}

/**
 * The stylesheet of a pool drawing, with only what it uses: the palette for its sport, the rules of the ropes, its sport's own, and, if it has them, the light on the water, the tiles, the labels of a race and a
 * section.
 */
export function poolStyle(use: PoolStyleUse): string {
  const lit = use.look !== "flat";
  const parts: string[] = [palette([use.sport], lit || use.deck === "tiled"), ...RULES.common];
  if (lit) parts.push(...RULES.light);
  if (use.look === "tiled") parts.push(...RULES.floor);
  if (use.deck === "tiled") parts.push(...RULES.deck);
  if (use.sport === "swimming") parts.push(...RULES.swimming);
  if (use.race) parts.push(...RULES.race);
  if (use.section) parts.push(...RULES.section);
  if (use.hall === true) parts.push(...RULES.hall);
  if (use.sport === "waterpolo" || use.sport === "diving" || use.sport === "artisticswimming") parts.push(...RULES[use.sport]);
  return parts.join("\n");
}

/** The rules of every pool, for a page that draws with `style: "none"` and supplies the stylesheet itself. */
export const KYOGIJO_POOL_STYLE = [palette(POOL_SPORTS, true), ...RULES.common, ...RULES.light, ...RULES.floor, ...RULES.deck, ...RULES.swimming, ...RULES.race, ...RULES.section, ...RULES.waterpolo, ...RULES.diving, ...RULES.artisticswimming, ...RULES.hall].join("\n");
