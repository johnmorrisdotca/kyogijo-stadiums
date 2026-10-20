// The stylesheet of a budō drawing: the rules of its classes (the mats in three tones, the heri, the floor, the walls, the clay, the sand, the straw, the azuchi, the tape) in the sheet's own custom
// properties, so that a named look, the options' `colors` and a page's own rule all win; and the colours of each budō look, in light and dark. See looks.ts for where the colours come from.
import { BUDO_LOOKS, type BudoLook } from "./budo/looks.ts";
import type { BudoKind } from "./budo/types.ts";

const CLASSES = `
.kyogijo .ky-bud-t1{fill:var(--ky-surface)}
.kyogijo .ky-bud-t2{fill:var(--ky-surface-alt,var(--ky-surface))}
.kyogijo .ky-bud-t3{fill:var(--ky-red)}
.kyogijo .ky-bud-heri{fill:var(--ky-bud-heri,var(--ky-ink));fill-opacity:var(--ky-bud-hop,.07)}
.kyogijo .ky-bud-seam{stroke:var(--ky-ink);stroke-opacity:.12;fill:none;stroke-linejoin:round}
.kyogijo .ky-bud-line{stroke:var(--ky-line);fill:none}
.kyogijo .ky-bud-ink{stroke:var(--ky-ink);fill:none}
.kyogijo .ky-bud-floor{fill:var(--ky-bud-floor,var(--ky-boards))}
.kyogijo .ky-bud-wall{fill:var(--ky-boards)}
.kyogijo .ky-bud-window{fill:var(--ky-blue,#2a5db0);fill-opacity:.55}
.kyogijo .ky-bud-door{fill:var(--ky-apron)}
.kyogijo .ky-bud-platform{fill:var(--ky-bud-floor,var(--ky-boards))}
.kyogijo .ky-bud-free{fill:var(--ky-free,var(--ky-apron))}
.kyogijo .ky-bud-desk{fill:var(--ky-ink);fill-opacity:.55}
.kyogijo .ky-bud-seat{fill:var(--ky-ink);fill-opacity:.42}
.kyogijo .ky-bud-shrine{fill:var(--ky-red)}
.kyogijo .ky-bud-edge{stroke:var(--ky-ink);stroke-opacity:.04;stroke-width:.03;fill:none}
.kyogijo .ky-bud-dais{fill:var(--ky-bud-floor,var(--ky-boards));stroke:var(--ky-ink);stroke-opacity:.5;stroke-width:.04}
.kyogijo .ky-bud-banner{fill:var(--ky-ink);fill-opacity:.85}
.kyogijo .ky-bud-clay{fill:var(--ky-dirt)}
.kyogijo .ky-bud-sand{fill:var(--ky-sand,#e8dcc2)}
.kyogijo .ky-bud-tawara{fill:var(--ky-bud-straw,#c8a45c);stroke:var(--ky-ink);stroke-opacity:.45;stroke-width:.03}
.kyogijo .ky-bud-azuchi{fill:var(--ky-dirt)}
.kyogijo .ky-bud-yamichi{fill:var(--ky-surface)}
.kyogijo .ky-bud-lane{fill:var(--ky-surface-alt,var(--ky-surface))}
.kyogijo .ky-bud-mato{fill:var(--ky-line);stroke:var(--ky-ink);stroke-width:.04}
.kyogijo .ky-bud-roof{fill:var(--ky-ink);fill-opacity:.12}
.kyogijo .ky-bud-blue-fill{fill:var(--ky-blue,#2a5db0)}
.kyogijo .ky-bud-white-fill{fill:var(--ky-line)}
.kyogijo .ky-bud-red-fill{fill:var(--ky-red)}
.kyogijo .ky-bud-ink-fill{fill:var(--ky-ink)}
.kyogijo .ky-bud-tassel-e{fill:#2f9e63;stroke:var(--ky-ink);stroke-opacity:.5;stroke-width:.03}
.kyogijo .ky-bud-tassel-s{fill:#d23b32;stroke:var(--ky-ink);stroke-opacity:.5;stroke-width:.03}
.kyogijo .ky-bud-tassel-w{fill:#f4f1e8;stroke:var(--ky-ink);stroke-opacity:.5;stroke-width:.03}
.kyogijo .ky-bud-tassel-n{fill:#232323;stroke:var(--ky-ink);stroke-opacity:.5;stroke-width:.03}`.trim();

/** The rules of the combat sports' classes, added to a combat drawing only, so that the budō drawings are the text they were: the steps up to a platform and the padding of a post. */
const COMBAT_CLASSES = `
.kyogijo .ky-bud-step{fill:color-mix(in srgb,var(--ky-bud-floor,#43484e) 76%,#fff);stroke:var(--ky-ink);stroke-opacity:.35;stroke-width:.03}
.kyogijo .ky-bud-pad{fill:var(--ky-ink);fill-opacity:.82}`.trim();

/** The rules of a ring's own classes: the ropes and the corner pads in the boxers' colours. */
const RING_CLASSES = `
.kyogijo .ky-bud-rope{stroke:var(--ky-bud-rope,#f4f1e8);fill:none;stroke-linecap:round}
.kyogijo .ky-bud-corner-red{fill:var(--ky-red)}
.kyogijo .ky-bud-corner-blue{fill:var(--ky-blue,#2a5db0)}
.kyogijo .ky-bud-corner-white{fill:#f4f1e8;stroke:var(--ky-ink);stroke-opacity:.45;stroke-width:.03}`.trim();

const COMBAT: readonly string[] = ["mma", "boxing"];
const RING: readonly string[] = ["boxing"];

/** The custom properties of a look. */
const vars = (l: BudoLook): string =>
  `--ky-surface:${l.surface};--ky-surface-alt:${l.alt};--ky-red:${l.red};--ky-apron:${l.apron};--ky-free:${l.free};--ky-bud-floor:${l.floor};--ky-boards:${l.boards}${l.dirt === undefined ? "" : `;--ky-dirt:${l.dirt}`}${l.sand === undefined ? "" : `;--ky-sand:${l.sand}`}${l.straw === undefined ? "" : `;--ky-bud-straw:${l.straw}`}${l.rope === undefined ? "" : `;--ky-bud-rope:${l.rope}`}`;

/** The three rules of one look: light, dark by the device's setting, and dark by the page's `data-theme`. */
function lookRules(sport: BudoKind, name: string): string {
  const pair = BUDO_LOOKS[sport][name];
  const at = `[data-sport=${sport}][data-look=${name}]`;
  return [
    `:where(.kyogijo${at}){${vars(pair.light)}}`,
    `@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo${at}:not([data-theme=light])){${vars(pair.dark)}}}`,
    `:where(html[data-theme=dark] .kyogijo${at},.kyogijo[data-theme=dark]${at}){${vars(pair.dark)}}`,
  ].join("\n");
}

/** The rules of a dojo's gallery, the stands of a crowd in a dojo: brown seats and a rail, a few neutral people. */
export const KYOGIJO_BUDO_GALLERY_STYLE = `
.kyogijo .ky-bud-gbed.ky-bud-gbed{fill:var(--ky-bud-gal,#7a5a3c)}
.kyogijo .ky-bud-gblk.ky-bud-gblk{fill:var(--ky-bud-gpeople,#a89a86)}
.kyogijo .ky-bud-gseat.ky-bud-gseat{stroke:var(--ky-bud-grail,#3a2c1f);stroke-opacity:.3}
.kyogijo .ky-bud-grow{stroke:var(--ky-bud-grail,#3a2c1f);stroke-opacity:.42}
.kyogijo .ky-bud-gback{stroke:var(--ky-bud-grail,#3a2c1f);stroke-opacity:.75}
.kyogijo .ky-bud-gaisle{stroke:var(--ky-bud-gaisle,#a98863)}
.kyogijo .ky-bud-rail{stroke:var(--ky-bud-grail,#3a2c1f);stroke-width:1.6;stroke-opacity:.85}
`;

/** The rules of a drawing of a budō sport in a look: the shared rules and the look's colours. Nothing for another sport. */
export function budoStyle(sport: string, look?: string): string {
  const kind = sport as BudoKind;
  if (BUDO_LOOKS[kind] === undefined) return "";
  return `${CLASSES}${COMBAT.includes(sport) ? `\n${COMBAT_CLASSES}` : ""}${RING.includes(sport) ? `\n${RING_CLASSES}` : ""}\n${look === undefined ? lookRules(kind, Object.keys(BUDO_LOOKS[kind])[0]) : lookRules(kind, look)}`;
}

/** Every budō sport's rules and every look, for a page that draws with `style: "none"` and supplies the stylesheet itself. */
export const KYOGIJO_BUDO_STYLE: string = `${CLASSES}\n${COMBAT_CLASSES}\n${RING_CLASSES}${KYOGIJO_BUDO_GALLERY_STYLE}\n${(Object.keys(BUDO_LOOKS) as BudoKind[]).flatMap((sport) => Object.keys(BUDO_LOOKS[sport]).map((name) => lookRules(sport, name))).join("\n")}`;
