// The rules of a tournament layout, light and dark: the floor's colour for each look, the barriers, the boards, the scoreboard, the umpires' chairs, the empty places for the event's words (dashed, so that
// they read as places and not as printing), the hall's walls and the colour of a layout that does not fit. The surfaces themselves keep their own rules, which a drawing carries as it always does.
import type { MultiFloor } from "./multi.types.ts";

/** The floor of each look and the ink an empty place is drawn in on it, in light and in dark. */
const FLOORS: Readonly<Record<MultiFloor, { light: readonly [string, string]; dark: readonly [string, string] }>> = {
  blue: { light: ["#2e5f9b", "#f4f7fb"], dark: ["#1d3d63", "#dbe6f3"] },
  green: { light: ["#2f7a4c", "#f2f8f3"], dark: ["#1f5234", "#d6e8dc"] },
  wood: { light: ["#c99a5b", "#3a2813"], dark: ["#8a6638", "#f0e0c8"] },
  red: { light: ["#b3362b", "#fdf3f1"], dark: ["#7a241d", "#f3d8d4"] },
  ice: { light: ["#e4eef5", "#1d2b36"], dark: ["#a9bccb", "#10181f"] },
};

const COMMON_LIGHT = "--ky-mu-neutral:#bdb9ad;--ky-mu-barrier:#161a1f;--ky-mu-board:#1d2430;--ky-mu-board-ink:#f4f1ea;--ky-mu-chair:#ece7da;--ky-mu-chair-edge:#4a4f56;--ky-mu-sb:#10151b;--ky-mu-sb-ink:#f6f6f6;--ky-mu-wall:#3a4048;--ky-mu-hall:#d9d5c8;--ky-mu-over:#c0392b";
const COMMON_DARK = "--ky-mu-neutral:#2b2f2c;--ky-mu-barrier:#05070a;--ky-mu-board:#0d1218;--ky-mu-board-ink:#e8e4da;--ky-mu-chair:#b9b4a6;--ky-mu-chair-edge:#050607;--ky-mu-sb:#05080b;--ky-mu-sb-ink:#e9e9e9;--ky-mu-wall:#0a0c0f;--ky-mu-hall:#1b1f1c;--ky-mu-over:#e0614f";

const hallVars = (which: "light" | "dark"): string => Object.entries(FLOORS).map(([name, f]) => `--ky-mu-f-${name}:${f[which][0]}`).join(";");
const looks = (which: "light" | "dark"): string => Object.entries(FLOORS).map(([name, f]) => `.kyogijo.ky-multi[data-floor=${name}]{--ky-mu-floor:${f[which][0]};--ky-mu-slot:${f[which][1]}}`).join("");

/**
 * The rules of a tournament layout. `:where` keeps the specificity at nothing so that a page's own custom properties win; the layout's group follows the device and the page like a drawing does, and a
 * `data-theme` of light or dark forces it.
 */
export const KYOGIJO_MULTI_STYLE = `
:where(.kyogijo){${COMMON_LIGHT};${hallVars("light")}}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){${COMMON_DARK};${hallVars("dark")}}}
:where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){${COMMON_DARK};${hallVars("dark")}}
${looks("light")}
@media (prefers-color-scheme:dark){${Object.entries(FLOORS).map(([name, f]) => `html:not([data-theme=light]) .kyogijo.ky-multi:not([data-theme=light])[data-floor=${name}]{--ky-mu-floor:${f.dark[0]};--ky-mu-slot:${f.dark[1]}}`).join("")}}
${Object.entries(FLOORS).map(([name, f]) => `html[data-theme=dark] .kyogijo.ky-multi[data-floor=${name}],.kyogijo.ky-multi[data-theme=dark][data-floor=${name}]{--ky-mu-floor:${f.dark[0]};--ky-mu-slot:${f.dark[1]}}`).join("")}
.kyogijo .ky-mu-apron{fill:var(--ky-mu-hall)}
.kyogijo .ky-mu-floor{fill:var(--ky-mu-floor)}
.kyogijo .ky-mu-hall{fill:var(--ky-mu-floor);fill-opacity:.0;stroke:var(--ky-mu-wall);stroke-width:.8;stroke-dasharray:4 2.5}
.kyogijo .ky-mu-hallfloor{fill:var(--ky-mu-neutral);stroke:var(--ky-mu-wall);stroke-width:.8}
${Object.keys(FLOORS).map((name) => `.kyogijo .ky-mu-hf-${name}{fill:var(--ky-mu-f-${name})}`).join("\n")}
.kyogijo .ky-mu-wall{fill:none;stroke:var(--ky-mu-wall);stroke-width:2.2;stroke-linejoin:round}
.kyogijo .ky-mu-over{fill:none;stroke:var(--ky-mu-over);stroke-width:1.4;stroke-dasharray:5 3}
.kyogijo .ky-mu-barrier{fill:none;stroke:var(--ky-mu-barrier);stroke-width:1;stroke-opacity:.9}
.kyogijo .ky-mu-board{fill:var(--ky-mu-board)}
.kyogijo .ky-mu-board-cut{stroke:var(--ky-mu-board-ink);stroke-opacity:.35;stroke-width:.25}
.kyogijo .ky-mu-chair{fill:var(--ky-mu-chair);stroke:var(--ky-mu-chair-edge);stroke-width:.25}
.kyogijo .ky-mu-desk{fill:var(--ky-mu-chair);fill-opacity:.7;stroke:var(--ky-mu-chair-edge);stroke-width:.2}
.kyogijo .ky-mu-sb{fill:var(--ky-mu-sb);fill-opacity:.82;stroke:var(--ky-mu-sb-ink);stroke-width:.3;stroke-dasharray:1.4 .8}
.kyogijo .ky-mu-sb-cut{stroke:var(--ky-mu-sb-ink);stroke-opacity:.5;stroke-width:.2}
.kyogijo .ky-mu-slot{fill:none;stroke:var(--ky-mu-slot);stroke-width:.3;stroke-dasharray:1.2 .8;stroke-opacity:.85}
.kyogijo .ky-mu-slot-board{stroke:var(--ky-mu-board-ink)}
.kyogijo .ky-mu-slot-text{fill:var(--ky-mu-slot);fill-opacity:.8;font-family:var(--ky-font);font-weight:700;text-anchor:middle}
.kyogijo .ky-mu-slot-text-board{fill:var(--ky-mu-board-ink)}
.kyogijo .ky-mu-label{fill:var(--ky-ink);font-family:var(--ky-font);font-weight:800;paint-order:stroke;stroke:var(--ky-halo);stroke-width:.5;stroke-linejoin:round}
.kyogijo .ky-mu-caption{fill:var(--ky-mu-sb-ink);font-family:var(--ky-font);font-weight:700;text-anchor:middle}
.kyogijo.ky-multi{--ky-cr-home:#8b94a3;--ky-cr-away:#8b94a3}
`.trim();
