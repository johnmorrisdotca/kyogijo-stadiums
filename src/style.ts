import { KYOGIJO_BACKGROUND_STYLE } from "./background.ts";
import { KYOGIJO_COURTS_STYLE } from "./courts.style.ts";
import { KYOGIJO_FIELDS_STYLE } from "./fields.style.ts";
import { KYOGIJO_FEATURE_STYLE } from "./features.ts";
import { KYOGIJO_GRID_STYLE } from "./layout.style.ts";
import { KYOGIJO_LOOK_STYLE } from "./look.ts";
import { KYOGIJO_SPECIAL_STYLE } from "./special.style.ts";

/**
 * The drawing's stylesheet, without the heat layers' rules: custom properties for every colour, in light and dark, and the rule of each class. It is
 * written into every drawing (so that one saved as a file stands alone) unless `style: "none"` is passed, and the
 * defaults are in `:where()`, which has no weight, so that a page's own rule always wins.
 */
export const KYOGIJO_BASE_STYLE = `
:where(.kyogijo){--ky-ink:#1f2320;--ky-line:#fff;--ky-halo:rgba(255,255,255,.92);--ky-plate:rgba(18,24,21,.9);--ky-plate-ink:#fff;--ky-left:#2f6db0;--ky-right:#b5452c;--ky-left-ink:#fff;--ky-right-ink:#fff;--ky-apron:#dcd8c9;--ky-surface:#3f8f55;--ky-surface-alt:#3a864f;--ky-zone:#2d6a40;--ky-boards:#c8c1b0;--ky-red:#c8372d;--ky-blue:#2a5db0;--ky-dirt:#c28e5c;--ky-foul:#3a8148;--ky-infield:#58a05d;--ky-crease:#bfd3ec;--ky-key:#c25b3c;--ky-centre:transparent;--ky-post:#f2c230;--ky-pylon:#f26a1b;--ky-layer:#14213d;--ky-layer-home:#1f5fa8;--ky-layer-away:#d9480f;--ky-layer-edge:rgba(255,255,255,.92);--ky-layer-hollow:rgba(255,255,255,.32);--ky-layer-ink:#14213d;--ky-layer-halo:rgba(255,255,255,.9);--ky-font:system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif;display:block;width:100%;height:auto;font-family:var(--ky-font)}
:where(.kyogijo[data-sport=nhl]){--ky-surface:#eef5fa;--ky-apron:#d3dbe1;--ky-boards:#9aa4ab;--ky-halo:rgba(255,255,255,.92)}
:where(.kyogijo[data-sport=nba]){--ky-surface:#d9a766;--ky-surface-alt:#cf9c5b;--ky-apron:#c9c3b4;--ky-boards:#a97d46;--ky-baseline:#fff}
:where(.kyogijo[data-sport=mlb]){--ky-surface:#4f9a55;--ky-surface-alt:#478f4e;--ky-apron:#bdb59f;--ky-boards:#2f4a36}
:where(.kyogijo[data-sport=soccer]){--ky-surface:#4c9b56;--ky-surface-alt:#438f4d;--ky-apron:#c9d2bd;--ky-court:#3b79ad}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){--ky-ink:#ece8dc;--ky-line:#e9ece6;--ky-plate:rgba(0,0,0,.82);--ky-apron:#1b1f1c;--ky-surface:#2c6a3f;--ky-surface-alt:#296239;--ky-zone:#1f4a2d;--ky-boards:#4d5450;--ky-red:#d4574d;--ky-blue:#5584d4;--ky-dirt:#8a6040;--ky-foul:#275a31;--ky-infield:#367a42;--ky-crease:#8ea9cc;--ky-key:#8a3f2b;--ky-layer:#f1f5f9;--ky-layer-home:#6aa9f0;--ky-layer-away:#f59a5b;--ky-layer-edge:rgba(0,0,0,.6);--ky-layer-hollow:rgba(255,255,255,.18);--ky-layer-ink:#f1f5f9;--ky-layer-halo:rgba(0,0,0,.7)}
:where(html:not([data-theme=light]) .kyogijo[data-sport=nhl]:not([data-theme=light])){--ky-surface:#a9bccb;--ky-apron:#1a2025;--ky-boards:#4b5156}
:where(html:not([data-theme=light]) .kyogijo[data-sport=nba]:not([data-theme=light])){--ky-surface:#8f6a3c;--ky-surface-alt:#876234;--ky-apron:#1a1c1b;--ky-boards:#5e4426}
:where(html:not([data-theme=light]) .kyogijo[data-sport=mlb]:not([data-theme=light])){--ky-surface:#2f6b3a;--ky-surface-alt:#2b6336;--ky-apron:#1b1f1c;--ky-boards:#1c2b20}
:where(html:not([data-theme=light]) .kyogijo[data-sport=soccer]:not([data-theme=light])){--ky-surface:#2d6c3e;--ky-surface-alt:#276136;--ky-apron:#1b1f1c;--ky-court:#2a5478}}
:where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){--ky-ink:#ece8dc;--ky-line:#e9ece6;--ky-plate:rgba(0,0,0,.82);--ky-apron:#1b1f1c;--ky-surface:#2c6a3f;--ky-surface-alt:#296239;--ky-zone:#1f4a2d;--ky-boards:#4d5450;--ky-red:#d4574d;--ky-blue:#5584d4;--ky-dirt:#8a6040;--ky-foul:#275a31;--ky-infield:#367a42;--ky-crease:#8ea9cc;--ky-key:#8a3f2b;--ky-layer:#f1f5f9;--ky-layer-home:#6aa9f0;--ky-layer-away:#f59a5b;--ky-layer-edge:rgba(0,0,0,.6);--ky-layer-hollow:rgba(255,255,255,.18);--ky-layer-ink:#f1f5f9;--ky-layer-halo:rgba(0,0,0,.7)}
:where(html[data-theme=dark] .kyogijo[data-sport=nhl],.kyogijo[data-theme=dark][data-sport=nhl]){--ky-surface:#a9bccb;--ky-apron:#1a2025;--ky-boards:#4b5156}
:where(html[data-theme=dark] .kyogijo[data-sport=nba],.kyogijo[data-theme=dark][data-sport=nba]){--ky-surface:#8f6a3c;--ky-surface-alt:#876234;--ky-apron:#1a1c1b;--ky-boards:#5e4426}
:where(html[data-theme=dark] .kyogijo[data-sport=mlb],.kyogijo[data-theme=dark][data-sport=mlb]){--ky-surface:#2f6b3a;--ky-surface-alt:#2b6336;--ky-apron:#1b1f1c;--ky-boards:#1c2b20}
:where(html[data-theme=dark] .kyogijo[data-sport=soccer],.kyogijo[data-theme=dark][data-sport=soccer]){--ky-surface:#2d6c3e;--ky-surface-alt:#276136;--ky-apron:#1b1f1c;--ky-court:#2a5478}
.kyogijo .ky-apron{fill:var(--ky-apron)}
.kyogijo .ky-text{fill:var(--ky-ink);font-family:var(--ky-font);font-weight:800;letter-spacing:0;font-variant-numeric:tabular-nums}
.kyogijo .ky-surface{fill:var(--ky-surface)}
.kyogijo .ky-stripe{fill:var(--ky-surface-alt)}
.kyogijo .ky-ring circle{stroke:var(--ky-surface-alt)}
.kyogijo .ky-zone{fill:var(--ky-zone)}
.kyogijo .ky-zone-left{fill:var(--ky-left)}
.kyogijo .ky-zone-right{fill:var(--ky-right)}
.kyogijo .ky-boards{fill:var(--ky-boards)}
.kyogijo .ky-line{stroke:var(--ky-line);fill:none}
.kyogijo .ky-fill-line{fill:var(--ky-line)}
.kyogijo .ky-band{stroke:var(--ky-line)}
.kyogijo .ky-num{fill:var(--ky-line);font-family:var(--ky-font);font-weight:700}
.kyogijo .ky-pitch-futsal .ky-surface{fill:var(--ky-court)}
.kyogijo .ky-goal{stroke:var(--ky-line);fill:none}
.kyogijo .ky-goal-net{stroke:var(--ky-line);opacity:.55}
.kyogijo .ky-goal-strip{fill:var(--ky-line)}
.kyogijo .ky-flag{fill:var(--ky-pylon)}
.kyogijo .ky-post{stroke:var(--ky-post)}
.kyogijo .ky-post-end{fill:var(--ky-post)}
.kyogijo .ky-pylon{fill:var(--ky-pylon)}
.kyogijo .ky-red{stroke:var(--ky-red)}
.kyogijo .ky-red-fill{fill:var(--ky-red)}
.kyogijo .ky-blue{stroke:var(--ky-blue)}
.kyogijo .ky-blue-fill{fill:var(--ky-blue)}
.kyogijo .ky-dash{stroke:var(--ky-surface)}
.kyogijo .ky-crease{fill:var(--ky-crease);stroke:var(--ky-red)}
.kyogijo .ky-net{stroke:var(--ky-red)}
.kyogijo .ky-key{fill:var(--ky-key)}
.kyogijo .ky-key-left{fill:var(--ky-key-left,var(--ky-key))}
.kyogijo .ky-key-right{fill:var(--ky-key-right,var(--ky-key))}
.kyogijo .ky-centre{fill:var(--ky-centre)}
.kyogijo .ky-board{stroke:var(--ky-line)}
.kyogijo .ky-rim{stroke:#e8591a}
.kyogijo .ky-baseline{fill:var(--ky-baseline,var(--ky-line))}
.kyogijo .ky-foul{fill:var(--ky-foul)}
.kyogijo .ky-track{fill:none;stroke:var(--ky-dirt)}
.kyogijo .ky-dirt{fill:var(--ky-dirt)}
.kyogijo .ky-infield{fill:var(--ky-infield)}
.kyogijo .ky-fence{stroke:var(--ky-boards);stroke-linejoin:round}
.kyogijo .ky-ink-left{fill:var(--ky-left-ink)}
.kyogijo .ky-ink-right{fill:var(--ky-right-ink)}
.kyogijo .ky-paint-left{fill:var(--ky-left);stroke:var(--ky-halo);stroke-width:.14em;paint-order:stroke;stroke-linejoin:round}
.kyogijo .ky-paint-right{fill:var(--ky-right);stroke:var(--ky-halo);stroke-width:.14em;paint-order:stroke;stroke-linejoin:round}
.kyogijo .ky-panel-left,.kyogijo .ky-block-left{fill:var(--ky-left)}
.kyogijo .ky-panel-right,.kyogijo .ky-block-right{fill:var(--ky-right)}
.kyogijo .ky-lose{opacity:.78}
.kyogijo .ky-banner.ky-lose{opacity:1;filter:grayscale(.35) brightness(.92)}
.kyogijo .ky-score.ky-lose{opacity:.62}
.kyogijo .ky-plate-bg,.kyogijo .ky-badge-bg{fill:var(--ky-plate)}
.kyogijo .ky-score{fill:var(--ky-plate-ink)}
.kyogijo .ky-comp,.kyogijo .ky-foot,.kyogijo .ky-abbr,.kyogijo .ky-dash-text,.kyogijo .ky-badge-status{fill:var(--ky-plate-ink);text-anchor:middle}
.kyogijo .ky-score{font-weight:800}
.kyogijo .ky-abbr,.kyogijo .ky-comp,.kyogijo .ky-foot,.kyogijo .ky-badge-status{opacity:.82;font-weight:700}
.kyogijo .ky-dash-text{opacity:.55;font-weight:600}
.kyogijo .ky-winbar-left{fill:var(--ky-left)}
.kyogijo .ky-winbar-right{fill:var(--ky-right)}
.kyogijo .ky-glyph{stroke:var(--ky-plate-ink);stroke-width:1.4;opacity:.7;stroke-linejoin:round}
.kyogijo .ky-badge-left .ky-score{fill:var(--ky-left-ink)}
.kyogijo .ky-badge-right .ky-score{fill:var(--ky-right-ink)}
.kyogijo .ky-badge-left .ky-name{fill:var(--ky-left-ink)}
.kyogijo .ky-badge-right .ky-name{fill:var(--ky-right-ink)}
.kyogijo .ky-pts>*{fill:var(--c,var(--ky-layer));stroke:var(--ky-layer-edge);stroke-width:calc(var(--w,.3)*1px);stroke-linejoin:round}
.kyogijo .ky-pts>.ky-hol{fill:var(--ky-layer-hollow);stroke:var(--c,var(--ky-layer));stroke-width:calc(var(--w,.3)*2.2px)}
.kyogijo .ky-h{--c:var(--ky-layer-home)}
.kyogijo .ky-a{--c:var(--ky-layer-away)}
.kyogijo .ky-ln{fill:none;stroke:var(--c,var(--ky-layer));stroke-linecap:round;stroke-linejoin:round}
.kyogijo .ky-ah{fill:var(--c,var(--ky-layer));stroke:none}
.kyogijo .ky-cm{stroke:none}
.kyogijo .ky-lt{fill:var(--c,var(--ky-layer-ink));stroke:var(--ky-layer-halo);stroke-width:.18em;paint-order:stroke;stroke-linejoin:round;font-family:var(--ky-font);font-weight:700;font-variant-numeric:tabular-nums}
.kyogijo .ky-lt.ky-nh{stroke:none}
`.trim();

/**
 * The rules of the heat layers (the ground under a heat map, its zones' and bands' outlines and the legend), kept apart so that a drawing
 * without one does not carry them: a drawing that has a heat layer writes them in beside the layer, and `KYOGIJO_STYLE` has them for a page.
 */
export const KYOGIJO_HEAT_STYLE = `
:where(.kyogijo){--ky-heat-ground:rgba(255,255,255,.72)}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){--ky-heat-ground:rgba(14,18,16,.82)}}
:where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){--ky-heat-ground:rgba(14,18,16,.82)}
.kyogijo .ky-hg{fill:var(--ky-heat-ground)}
.kyogijo .ky-zn,.kyogijo .ky-cf{stroke:var(--ky-layer-edge);stroke-width:calc(var(--w,.2)*1px);stroke-linejoin:round}
.kyogijo .ky-cl{fill:none;stroke-width:calc(var(--w,.4)*1px);stroke-linejoin:round}
.kyogijo .ky-lg-p{fill:var(--ky-plate)}
.kyogijo .ky-lg-t{fill:var(--ky-plate-ink);font-family:var(--ky-font);font-weight:700}
.kyogijo .ky-lg-k{stroke:var(--ky-plate-ink);fill:none}`.trim();


/**
 * The rules of a curling sheet and its board: the ice and the lines, the house in its colours (`--ky-rg-o`, `-m`, `-i` and `-b` for the 12-foot band, the 8-foot,
 * the 4-foot and the button), the hacks, the free guard zone, the pebble, the hammer and the board's grid. Kept apart so that a drawing of another sport does not carry
 * them: a curling drawing writes them in after the base rules, and `KYOGIJO_STYLE` has them for a page.
 */
export const KYOGIJO_CURLING_STYLE = `
:where(.kyogijo[data-sport=curling]){--ky-surface:#eaf3f9;--ky-apron:#cfd8de;--ky-boards:#8d98a0;--ky-line:#23292d;--ky-rg-o:#2a5db0;--ky-rg-m:#fff;--ky-rg-i:#c8372d;--ky-rg-b:#fff;--ky-hog:#c8372d;--ky-hack:#3a4046;--ky-pebble:rgba(110,140,165,.4);--ky-fgz:rgba(42,93,176,.1)}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo[data-sport=curling]:not([data-theme=light])){--ky-surface:#8fa6b7;--ky-apron:#1a2025;--ky-boards:#4b5156;--ky-line:#11171b;--ky-rg-o:#3f6cc0;--ky-rg-m:#dfe8ef;--ky-rg-i:#c9473e;--ky-rg-b:#dfe8ef;--ky-hog:#c9473e;--ky-hack:#161b1f;--ky-fgz:rgba(20,40,90,.18)}}
:where(html[data-theme=dark] .kyogijo[data-sport=curling],.kyogijo[data-theme=dark][data-sport=curling]){--ky-surface:#8fa6b7;--ky-apron:#1a2025;--ky-boards:#4b5156;--ky-line:#11171b;--ky-rg-o:#3f6cc0;--ky-rg-m:#dfe8ef;--ky-rg-i:#c9473e;--ky-rg-b:#dfe8ef;--ky-hog:#c9473e;--ky-hack:#161b1f;--ky-fgz:rgba(20,40,90,.18)}
.kyogijo .ky-rg-o{fill:var(--ky-rg-o)}.kyogijo .ky-rg-m{fill:var(--ky-rg-m)}.kyogijo .ky-rg-i{fill:var(--ky-rg-i)}.kyogijo .ky-rg-b{fill:var(--ky-rg-b)}
.kyogijo .ky-hog{fill:var(--ky-hog)}.kyogijo .ky-hack{fill:var(--ky-hack)}.kyogijo .ky-fgz{fill:var(--ky-fgz)}.kyogijo pattern circle{fill:var(--ky-pebble)}
.kyogijo .ky-hammer{fill:var(--ky-plate-ink)}.kyogijo .ky-hammer-in{fill:var(--ky-plate)}.kyogijo .ky-grid{stroke:var(--ky-plate-ink);opacity:.22}
.kyogijo .ky-badge-hammer-left .ky-hammer{fill:var(--ky-left-ink)}.kyogijo .ky-badge-hammer-left .ky-hammer-in{fill:var(--ky-left)}.kyogijo .ky-badge-hammer-right .ky-hammer{fill:var(--ky-right-ink)}.kyogijo .ky-badge-hammer-right .ky-hammer-in{fill:var(--ky-right)}`.trim();

/**
 * The rules of a ballpark's walls and quirks (`walls` and `quirks`): the four shades of the wall bands (`--ky-wall-1` to `-4`, from under 10 feet to 30 and over), the hill, the
 * overhang, the ivy, the poles and bullpens, the backstop's bar, the dugouts, the names and the legend. Kept apart so that a drawing without them does not carry them: a drawing
 * that has them writes them in after the base rules, and `KYOGIJO_STYLE` has them for a page.
 */
export const KYOGIJO_WALLS_STYLE = `
:where(.kyogijo){--ky-wall-1:#f2e6c2;--ky-wall-2:#e6bd62;--ky-wall-3:#d9742e;--ky-wall-4:#8e2f1c;--ky-hill:#2a5f35;--ky-ivy:#1c6b2f;--ky-over:#101612;--ky-pen:#d9dce0}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){--ky-wall-1:#e9dcb4;--ky-wall-2:#d9ae55;--ky-wall-3:#cc6a2a;--ky-wall-4:#c24a32;--ky-hill:#68a574;--ky-ivy:#4f9a63}}
:where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){--ky-wall-1:#e9dcb4;--ky-wall-2:#d9ae55;--ky-wall-3:#cc6a2a;--ky-wall-4:#c24a32;--ky-hill:#68a574;--ky-ivy:#4f9a63}
.kyogijo .ky-wall{stroke:var(--ky-layer-edge);stroke-width:.35;stroke-linejoin:round}
.kyogijo .ky-wall-1{fill:var(--ky-wall-1)}.kyogijo .ky-wall-2{fill:var(--ky-wall-2)}.kyogijo .ky-wall-3{fill:var(--ky-wall-3)}.kyogijo .ky-wall-4{fill:var(--ky-wall-4)}
.kyogijo .ky-hill{fill:var(--ky-hill);fill-opacity:.6;stroke:var(--ky-line);stroke-width:.5;stroke-dasharray:2 1.5}
.kyogijo .ky-overhang{fill:var(--ky-over);fill-opacity:.32;stroke:var(--ky-line);stroke-width:.5;stroke-dasharray:3 2}
.kyogijo .ky-ivy{fill:none;stroke:var(--ky-ivy);stroke-width:3;stroke-dasharray:2.2 1.3;stroke-linecap:round}
.kyogijo .ky-basket{fill:none;stroke:var(--ky-line);stroke-width:.9;stroke-dasharray:3 1.6}
.kyogijo .ky-pole{fill:var(--ky-post);stroke:var(--ky-ink);stroke-width:.5}
.kyogijo .ky-bullpen{fill:var(--ky-pen);stroke:var(--ky-ink);stroke-width:.5}
.kyogijo .ky-backstop{fill:none;stroke:var(--ky-line);stroke-width:.8}
.kyogijo .ky-dugout{fill:var(--ky-plate);stroke:var(--ky-line);stroke-width:.6}
.kyogijo .ky-dugout-away{fill:none}
.kyogijo .ky-wl{fill:var(--ky-ink);stroke:var(--ky-halo);stroke-width:.14em;paint-order:stroke;stroke-linejoin:round;font-weight:700}
.kyogijo .ky-wl-p{fill:var(--ky-plate)}
.kyogijo .ky-wl-k{fill:var(--ky-plate-ink);font-weight:700}`.trim();

/**
 * The rules of the team layers (the cells, triangles and hulls, the roses of a sonar, the arrows of a flow field and the marks of a formation), kept apart
 * like the heat layers' so that a drawing without one does not carry them: a drawing that has one writes them in beside the layer, and `KYOGIJO_STYLE` has them for a page.
 */
export const KYOGIJO_TEAM_STYLE = `
.kyogijo .ky-sp{fill:var(--c,var(--ky-layer));fill-opacity:.22;stroke:var(--c,var(--ky-layer));stroke-width:calc(var(--w,.3)*1px);stroke-linejoin:round}
.kyogijo .ky-sp-e{fill:none;stroke-opacity:.8}
.kyogijo .ky-ro{fill:var(--c,var(--ky-layer));fill-opacity:.7;stroke:var(--ky-layer-edge);stroke-width:calc(var(--w,.3)*1px);stroke-linejoin:round}
.kyogijo .ky-ro-r{fill:none;stroke:var(--c,var(--ky-layer));stroke-opacity:.45;stroke-dasharray:calc(var(--w,.3)*3px) calc(var(--w,.3)*3px);stroke-width:calc(var(--w,.3)*1px)}
.kyogijo .ky-fm>*{fill:var(--c,var(--ky-layer));stroke:var(--ky-layer-edge);stroke-width:calc(var(--w,.3)*1px)}
.kyogijo .ky-fm>.ky-e{fill:var(--ky-layer-hollow);stroke:var(--c,var(--ky-layer));stroke-width:calc(var(--w,.3)*2.2px)}`.trim();

/**
 * The rules of the annotations (the arrows of `direction`, the axes of `axes` and the labels and leaders of `landmarks`): words in the ink of the page with an outline in the
 * apron's colour, thin leaders, and the arrows in the home and away colours. A drawing that has an annotation writes them in; `KYOGIJO_STYLE` has them for a page.
 */
export const KYOGIJO_NOTE_STYLE = `
.kyogijo .ky-an-t{fill:var(--ky-ink);stroke:var(--ky-apron);stroke-width:.2em;paint-order:stroke;stroke-linejoin:round}
.kyogijo .ky-an-l{stroke:var(--ky-ink);stroke-opacity:.75}
.kyogijo .ky-an-d circle{fill:var(--ky-ink);stroke:var(--ky-apron)}
.kyogijo .ky-an-h{--c:var(--ky-layer-home)}
.kyogijo .ky-an-a{--c:var(--ky-layer-away)}
.kyogijo .ky-an-ar{stroke:var(--c);fill:none}
.kyogijo .ky-an-hd{fill:var(--c)}`.trim();

/** Every rule of the package, for a page that draws with `style: "none"` and supplies the stylesheet itself. */
export const KYOGIJO_STYLE = `${KYOGIJO_BASE_STYLE}\n${KYOGIJO_HEAT_STYLE}\n${KYOGIJO_TEAM_STYLE}\n${KYOGIJO_CURLING_STYLE}\n${KYOGIJO_WALLS_STYLE}\n${KYOGIJO_COURTS_STYLE}\n${KYOGIJO_FIELDS_STYLE}\n${KYOGIJO_LOOK_STYLE}\n${KYOGIJO_FEATURE_STYLE}\n${KYOGIJO_NOTE_STYLE}\n${KYOGIJO_SPECIAL_STYLE}\n${KYOGIJO_BACKGROUND_STYLE}\n${KYOGIJO_GRID_STYLE}`;
