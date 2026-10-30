import { JUDGING_DARK, JUDGING_LIGHT } from "./judging.style.ts";
import { KYOGIJO_TURN_BOARD_STYLE } from "./overlay.ts";

/**
 * The 3D view's stylesheet: the colours of what stands on the surface, in light and dark, and the rules that lay the scene out. Like the drawing's own, the
 * defaults are in `:where()`, which has no weight, so a page's own rule always wins; the colours are custom properties (`--ky-up-*`) a page can set.
 */
export const KYOGIJO_TURN_STYLE = `
:where(.ky-turn){--ky-left:#2f6db0;--ky-right:#b5452c;--ky-cr-home:#b5452c;--ky-cr-away:#2f6db0;--ky-cr-bed:#4a525d;--ky-cr-empty:#7d8794;--ky-cr-gap:#14181d;--ky-cr-conc:#8c929b;--ky-cr-dim:1;--ky-up-roof:rgba(214,218,212,.6);--ky-up-roofline:rgba(40,46,42,.55);--ky-up-fascia:#9aa09a;--ky-up-ivy:#5b8a45;--ky-up-door:#8a6a46;--ky-up-window:rgba(150,200,240,.55);--ky-up-sash:#f2f0e6;--ky-up-banner:#26211d;--ky-up-bannerline:#c8b88a;--ky-up-room:#efe8d6;--ky-up-roomback:#d6cdb9;--ky-up-ceiling:#dedcd5;--ky-up-railw:#fbfaf6;--ky-up-wainline:#6b4a2a;--ky-up-riser:#3f342c;--ky-up-slab:#d8cfba;--ky-up-slabedge:#c2b69c;--ky-up-seatc:#46342a;--ky-up-seatb:#2d211b;--ky-up-dais:#a0683a;--ky-up-dais-side:#6a4326;--ky-up-shrine:#c9b48f;--ky-up-shrine-side:#8f7a55;--ky-up-gal:#4d4037;--ky-up-aisle:#dcc196;--ky-up-panel:rgba(95,58,22,.3);--ky-up-alcove:#b58a52;--ky-up-purple:#5b2a6e;--ky-up-clock:#ffffff;--ky-up-rail:#3a2c1f;--ky-up-matedge:#2a2a26;--ky-up-sbframe:#1a1f1c;--ky-up-sbedge:#5b645e;--ky-up-sbline:#59615b;--ky-up-pole:#e9e7de;--ky-up-white:#f6f4ec;--ky-up-yellow:#f2c230;--ky-up-red:#c8372d;--ky-up-orange:#f26a1b;--ky-up-wood:#e3d4b4;--ky-up-leg:#474e49;--ky-up-pad:#2f6db0;--ky-up-cagepad:#2a2d32;--ky-up-table:#18243f;--ky-up-foot:rgba(0,0,0,.25);--ky-up-ground:#d9d5c7;--ky-up-wall:#2f4a36;--ky-up-clay:#a8703f;--ky-up-cap:#1d2a22;--ky-up-board:#ece9df;--ky-up-glass:rgba(138,190,232,.26);--ky-up-backboard:rgba(255,255,255,.88);--ky-up-outline:#f2f0e6;--ky-up-rim:#e8591a;--ky-up-mesh:rgba(24,30,27,.7);--ky-up-netfill:rgba(255,255,255,.2);--ky-up-tape:#fbfaf4;--ky-turn-bg:transparent;--ky-turn-ink:#1f2320;--ky-turn-rule:rgba(31,35,32,.22);--ky-turn-chip:rgba(255,255,255,.86);--ky-turn-chip-on:#1f2320;--ky-turn-chip-on-ink:#fff;${JUDGING_LIGHT};--ky-up-blk-a:#e9ece4;--ky-up-blk-b:#c9cdc3;--ky-up-blk-c:#a4aa9f;--ky-up-blk-roof:#f4f5f0;--ky-up-blk-line:rgba(40,46,42,.38);--ky-up-plate:rgba(47,109,176,.5);--ky-up-plate-line:#2f6db0}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .ky-turn:not([data-theme=light])){--ky-cr-bed:#242a32;--ky-cr-empty:#4a535f;--ky-cr-gap:#050709;--ky-cr-conc:#2a3038;--ky-cr-dim:.82;--ky-up-roof:rgba(60,66,62,.6);--ky-up-roofline:rgba(200,206,200,.5);--ky-up-fascia:#505650;--ky-up-ivy:#3d6633;--ky-up-door:#6a4f33;--ky-up-gal:#2d2621;--ky-up-aisle:#8f7752;--ky-up-alcove:#7d5c36;--ky-up-purple:#43204f;--ky-up-clock:#cfcbc0;--ky-up-room:#6d675a;--ky-up-roomback:#58534a;--ky-up-ceiling:#8c8a82;--ky-up-railw:#d9d6cc;--ky-up-riser:#251f1b;--ky-up-slab:#6b6455;--ky-up-slabedge:#585143;--ky-up-seatc:#2f231c;--ky-up-seatb:#1c1411;--ky-up-dais:#7d5230;--ky-up-dais-side:#52361f;--ky-up-sbframe:#0c0f0d;--ky-up-sbedge:#7a847d;--ky-up-sbline:#8a928c;--ky-up-pole:#d6d4ca;--ky-up-white:#e8e6dc;--ky-up-wood:#a89873;--ky-up-leg:#8a928c;--ky-up-ground:#242823;--ky-up-cagepad:#8f969f;--ky-up-wall:#4d6b55;--ky-up-clay:#7d5231;--ky-up-cap:#c9d2cc;--ky-up-board:#8d928b;--ky-up-glass:rgba(150,200,240,.2);--ky-up-backboard:rgba(255,255,255,.34);--ky-up-outline:#e7e4d8;--ky-up-mesh:rgba(236,236,226,.62);--ky-up-netfill:rgba(255,255,255,.08);--ky-up-tape:#efede2;--ky-turn-ink:#ece8dc;--ky-turn-rule:rgba(236,232,220,.28);--ky-turn-chip:rgba(24,28,25,.82);--ky-turn-chip-on:#ece8dc;--ky-turn-chip-on-ink:#1f2320;${JUDGING_DARK};--ky-up-blk-a:#59626b;--ky-up-blk-b:#444b53;--ky-up-blk-c:#30363c;--ky-up-blk-roof:#69727b;--ky-up-blk-line:rgba(220,226,220,.3);--ky-up-plate:rgba(127,176,232,.45);--ky-up-plate-line:#7fb0e8}}
:where(html[data-theme=dark] .ky-turn,.ky-turn[data-theme=dark]){--ky-cr-bed:#242a32;--ky-cr-empty:#4a535f;--ky-cr-gap:#050709;--ky-cr-conc:#2a3038;--ky-cr-dim:.82;--ky-up-roof:rgba(60,66,62,.6);--ky-up-roofline:rgba(200,206,200,.5);--ky-up-fascia:#505650;--ky-up-ivy:#3d6633;--ky-up-door:#6a4f33;--ky-up-gal:#2d2621;--ky-up-aisle:#8f7752;--ky-up-alcove:#7d5c36;--ky-up-purple:#43204f;--ky-up-clock:#cfcbc0;--ky-up-room:#6d675a;--ky-up-roomback:#58534a;--ky-up-ceiling:#8c8a82;--ky-up-railw:#d9d6cc;--ky-up-riser:#251f1b;--ky-up-slab:#6b6455;--ky-up-slabedge:#585143;--ky-up-seatc:#2f231c;--ky-up-seatb:#1c1411;--ky-up-dais:#7d5230;--ky-up-dais-side:#52361f;--ky-up-sbframe:#0c0f0d;--ky-up-sbedge:#7a847d;--ky-up-sbline:#8a928c;--ky-up-pole:#d6d4ca;--ky-up-white:#e8e6dc;--ky-up-wood:#a89873;--ky-up-leg:#8a928c;--ky-up-ground:#242823;--ky-up-cagepad:#8f969f;--ky-up-wall:#4d6b55;--ky-up-clay:#7d5231;--ky-up-cap:#c9d2cc;--ky-up-board:#8d928b;--ky-up-glass:rgba(150,200,240,.2);--ky-up-backboard:rgba(255,255,255,.34);--ky-up-outline:#e7e4d8;--ky-up-mesh:rgba(236,236,226,.62);--ky-up-netfill:rgba(255,255,255,.08);--ky-up-tape:#efede2;--ky-turn-ink:#ece8dc;--ky-turn-rule:rgba(236,232,220,.28);--ky-turn-chip:rgba(24,28,25,.82);--ky-turn-chip-on:#ece8dc;--ky-turn-chip-on-ink:#1f2320;${JUDGING_DARK};--ky-up-blk-a:#59626b;--ky-up-blk-b:#444b53;--ky-up-blk-c:#30363c;--ky-up-blk-roof:#69727b;--ky-up-blk-line:rgba(220,226,220,.3);--ky-up-plate:rgba(127,176,232,.45);--ky-up-plate-line:#7fb0e8}
.ky-turn{position:relative;display:block;width:100%;color:var(--ky-turn-ink);font-family:var(--ky-font,system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif);background:var(--ky-turn-bg)}
.ky-turn-view{position:relative;isolation:isolate;width:100%;aspect-ratio:var(--ky-turn-ratio,16/10);min-height:260px;overflow:hidden;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;border-radius:12px;outline-offset:2px}
.ky-turn[data-touch=turn] .ky-turn-view{touch-action:none}
.ky-turn[data-dragging] .ky-turn-view{cursor:grabbing}
.ky-turn-view:focus-visible{outline:3px solid var(--ky-turn-ink)}
.ky-turn-world{position:absolute;left:50%;top:50%;width:0;height:0}
.ky-turn-floor,.ky-up{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none}
.ky-turn-floor>svg{display:block;width:100%;height:auto}
.ky-up>svg{display:block;overflow:visible}
.ky-up[data-crop]>svg{width:100%;height:100%;overflow:hidden}
@media (max-width:560px){.ky-turn-view{--ky-turn-ratio:5/4}.ky-turn-controls button{padding:0 10px;font-size:.85rem}}
.ky-turn .u-sbframe{fill:var(--ky-up-sbframe);stroke:var(--ky-up-sbedge);stroke-width:.25}
.ky-turn .u-sbline{stroke:var(--ky-up-sbline)}
.ky-turn .u-pole{fill:var(--ky-up-pole)}
.ky-turn .u-white{fill:var(--ky-up-white)}
.ky-turn .u-yellow{fill:var(--ky-up-yellow)}
.ky-turn .u-red{fill:var(--ky-up-red)}
.ky-turn .u-orange{fill:var(--ky-up-orange)}
.ky-turn .u-wood{fill:var(--ky-up-wood)}
.ky-turn .u-leg{fill:var(--ky-up-leg)}
.ky-turn .u-pad{fill:var(--ky-up-pad)}
.ky-turn .u-table{fill:var(--ky-up-table)}
.ky-turn .u-foot{fill:var(--ky-up-foot)}
.ky-turn .u-ground{fill:var(--ky-up-ground)}
.ky-turn .u-shadow{fill:#000;fill-opacity:.16}
.ky-turn .u-wall{fill:var(--ky-up-wall)}
.ky-turn .u-clay{fill:var(--ky-up-clay)}
.ky-turn .u-cagepad{fill:var(--ky-up-cagepad)}
.ky-turn .u-gateframe{stroke:var(--ky-up-cagepad)}
.ky-turn .u-corner-red{fill:var(--ky-red,#b32a2f)}
.ky-turn .u-corner-blue{fill:var(--ky-blue,#2a5db0)}
.ky-turn .u-corner-white{fill:#f4f1e8}
.ky-turn .u-rope{fill:var(--ky-bud-rope,#f4f1e8)}
.ky-turn .u-rope-tie{fill:color-mix(in srgb,var(--ky-bud-rope,#f4f1e8) 60%,#808080)}
.ky-turn .u-deck-side{fill:color-mix(in srgb,var(--ky-bud-floor,#43484e) 70%,#000)}
.ky-turn .u-step{fill:color-mix(in srgb,var(--ky-bud-floor,#43484e) 76%,#fff)}
.ky-turn .u-step-side{fill:color-mix(in srgb,var(--ky-bud-floor,#43484e) 58%,#000)}
.ky-turn .u-clay-side{fill:color-mix(in srgb,var(--ky-dirt,var(--ky-up-clay)) 74%,#000)}
.ky-turn .u-cap{fill:var(--ky-up-cap)}
.ky-turn .u-board{fill:var(--ky-up-board)}
.ky-turn .u-glass{fill:var(--ky-up-glass)}
.ky-turn .u-backboard{fill:var(--ky-up-backboard)}
.ky-turn .u-outline{stroke:var(--ky-up-outline)}
.ky-turn .u-rimline{stroke:var(--ky-up-rim)}
.ky-turn .u-netfill{fill:var(--ky-up-netfill)}
.ky-turn .u-mesh{stroke:var(--ky-up-mesh);stroke-linecap:round}
.ky-turn .u-tape{fill:var(--ky-up-tape)}
.ky-turn .u-tapeline{stroke:var(--ky-up-tape)}
.ky-turn .u-flag{fill:var(--ky-up-orange)}
.ky-turn .u-frame-white{stroke:var(--ky-up-white)}
.ky-turn .u-frame-red{stroke:var(--ky-up-red)}
.ky-turn-defs{position:absolute;width:0;height:0;overflow:hidden}
.ky-turn .u-bed{fill:var(--ky-cr-bed)}
.ky-turn .u-blk{fill:var(--ky-cr-home)}
.ky-turn .u-blk-a,.ky-turn .u-ta{fill:var(--ky-cr-away)}
.ky-turn .u-th{fill:var(--ky-cr-home)}
.ky-turn .u-conc{fill:var(--ky-cr-conc)}
.ky-turn .u-fascia{fill:var(--ky-up-fascia)}
.ky-turn .u-shell{fill:var(--ky-up-fascia);stroke:var(--ky-up-roofline);stroke-width:.6}
.ky-turn .u-ivy{fill:var(--ky-up-ivy)}
/* The buildings round a district's venues (context.ts): three tones of wall by the way each faces, and a lighter roof. */
.ky-turn .u-block{stroke:var(--ky-up-blk-line);stroke-width:.5}
.ky-turn .u-block-a{fill:var(--ky-up-blk-a)}
.ky-turn .u-block-b{fill:var(--ky-up-blk-b)}
.ky-turn .u-block-c{fill:var(--ky-up-blk-c)}
.ky-turn .u-slab{stroke:var(--ky-up-blk-line);stroke-width:.5}
.ky-turn .u-slab-a{fill:var(--ky-up-blk-a)}
.ky-turn .u-slab-b{fill:var(--ky-up-blk-b)}
.ky-turn .u-slab-c{fill:var(--ky-up-blk-c)}
.ky-turn .u-slab-top{fill:var(--ky-up-blk-roof);stroke:var(--ky-up-blk-line);stroke-width:.5}
.ky-turn .u-floorplate{fill:var(--ky-up-plate);stroke:var(--ky-up-plate-line);stroke-width:1.2;stroke-linejoin:round}
.ky-turn .u-block-roof{fill:var(--ky-up-blk-roof);stroke:var(--ky-up-blk-line);stroke-width:.5;stroke-linejoin:round}
/* A venue drawn as a proxy in the lower tiers (district.turn.ts): the tones of the buildings round it, darker and bluer, as a stadium's concrete and roof read against a city's. */
.ky-turn .u-proxy{stroke:var(--ky-up-blk-line);stroke-width:.6}
.ky-turn .u-proxy-a{fill:color-mix(in srgb,var(--ky-up-blk-a) 52%,#4d6fa0)}
.ky-turn .u-proxy-b{fill:color-mix(in srgb,var(--ky-up-blk-b) 52%,#3f5c88)}
.ky-turn .u-proxy-c{fill:color-mix(in srgb,var(--ky-up-blk-c) 52%,#324b72)}
.ky-turn .u-proxy-roof{fill:color-mix(in srgb,var(--ky-up-blk-roof) 60%,#5f7fae);stroke:var(--ky-up-blk-line);stroke-width:.6;stroke-linejoin:round}
.ky-turn .u-roof{fill:var(--ky-up-roof);stroke:var(--ky-up-roofline);stroke-width:.8;stroke-linejoin:round}
.ky-turn .u-signplate{fill:var(--ky-turn-bg);fill-opacity:.9;stroke:var(--ky-turn-rule);stroke-width:.5}
.ky-turn .u-sign{fill:var(--ky-turn-ink);font-family:var(--ky-font,system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif);font-weight:600}
.ky-turn .u-mast{fill:var(--ky-up-fascia);stroke:var(--ky-up-roofline);stroke-width:.4}
.ky-turn .u-tower{fill:var(--ky-up-fascia);stroke:var(--ky-up-roofline);stroke-width:.4}
.ky-turn .u-tower-slit{fill:var(--ky-up-roofline);fill-opacity:.55}
.ky-turn .u-skylight{fill:var(--ky-up-skylight,#a9c8da);fill-opacity:.9;stroke:var(--ky-up-roofline);stroke-width:.5}
.ky-turn .u-podium{fill:#000;fill-opacity:.16}
.ky-turn .u-ledge{fill:var(--ky-up-roofline)}
.ky-turn .u-glazing{fill:#0b1a24;fill-opacity:.32}
.ky-turn .u-cable{fill:none;stroke:var(--ky-up-roofline);stroke-width:1}
.ky-turn .u-fabric{fill:var(--ky-up-roof);fill-opacity:.55;stroke:none}
.ky-turn .u-pod{fill:var(--ky-up-fascia);stroke:var(--ky-up-roofline);stroke-width:.6}
/* A real venue's empty places, filled: the suite level between two bowls, the apron round the surface, the back of each bowl and the concourse floor behind it. */
.ky-turn .u-suite{fill:color-mix(in srgb,var(--ky-up-fascia) 78%,var(--ky-cr-bed))}
.ky-turn .u-suite-win{fill:color-mix(in srgb,var(--ky-cr-gap) 55%,#6f93b3)}
.ky-turn .u-suite-bar{stroke:var(--ky-up-fascia);stroke-width:.5}
.ky-turn .u-suite-ledge{fill:color-mix(in srgb,var(--ky-up-fascia) 60%,var(--ky-cr-conc))}
.ky-turn .u-apron{fill:color-mix(in srgb,var(--ky-cr-bed) 82%,#000)}
.ky-turn .u-timeb{fill:color-mix(in srgb,var(--ky-cr-conc) 70%,#3a3f46)}
.ky-turn .u-timeb-side{fill:color-mix(in srgb,var(--ky-cr-conc) 70%,#3a3f46);filter:brightness(.7)}
.ky-turn .u-penb{fill:color-mix(in srgb,var(--ky-up-glass,#bcd2e0) 80%,#5d7a8f)}
.ky-turn .u-penb-side{fill:color-mix(in srgb,var(--ky-up-glass,#bcd2e0) 80%,#5d7a8f);filter:brightness(.72)}
.ky-turn .u-teamb{fill:color-mix(in srgb,var(--ky-up-wood,#8a6a47) 80%,#2a2f36)}
.ky-turn .u-teamb-side{fill:color-mix(in srgb,var(--ky-up-wood,#8a6a47) 80%,#2a2f36);filter:brightness(.7)}
/* LED boards: the housing and the screen are dark; the lit parts (class u-led) carry their own colours, and are what a lighting layer makes glow. */
.ky-turn .u-led-bed{fill:#0b0f14}
.ky-turn .u-led-screen{fill:#06121d}
/* Night: the house is down. The venue's own colours go dark in either theme (the page's theme is the page's), the seats under a veil, small lights show along the aisles, the exits are green, and the windows, the coping and the lanes of the concourse are softly lit. */
.ky-turn[data-lighting]{--ky-cr-bed:#11151a;--ky-cr-empty:#2a313a;--ky-cr-gap:#020304;--ky-cr-conc:#171c22;--ky-cr-dim:1;--ky-up-fascia:#272c29;--ky-up-ground:#1d211e;--ky-night-aisle:#ffd9a3;--ky-night-exit:#7dffb0;--ky-night-rim:#ffe0b0}
.ky-turn .u-veil{fill:#04060a;fill-opacity:.62}
.ky-turn .u-veil-down{fill-opacity:.8}
.ky-turn .u-veil-half{fill-opacity:.3}
.ky-turn:is([data-lighting=lightsDown],[data-lighting=intro],[data-lighting=concert]){--ky-cr-bed:#0a0d11;--ky-cr-conc:#101419;--ky-up-fascia:#1b1f1d;--ky-up-ground:#15181a}
.ky-turn[data-lighting=game]{--ky-cr-bed:#2a3039;--ky-cr-empty:#4a535f;--ky-cr-gap:#0a0c0f;--ky-cr-conc:#2a3038;--ky-up-fascia:#3b403c;--ky-up-ground:#242823}
.ky-turn[data-lighting=night] .ky-cr-aisle{stroke:var(--ky-night-aisle);stroke-opacity:.95;stroke-dasharray:1.1 3.4;stroke-linecap:round}
.ky-turn[data-lighting=night] .ky-cr-vom{stroke:var(--ky-night-exit);stroke-opacity:.6;stroke-dasharray:none}
.ky-turn[data-lighting] .u-suite-win{fill:color-mix(in srgb,var(--ky-night-aisle) 50%,#2a2218)}
.ky-turn:is([data-lighting=lightsDown],[data-lighting=intro],[data-lighting=concert]) .u-suite-win{fill:color-mix(in srgb,var(--ky-night-aisle) 10%,#0d1116)}
.ky-turn[data-lighting] .u-coping{fill:color-mix(in srgb,var(--ky-night-rim) 55%,var(--ky-up-fascia))}
.ky-turn[data-lighting] .u-suite-ledge{fill:color-mix(in srgb,var(--ky-night-rim) 45%,var(--ky-up-fascia))}
.ky-turn[data-lighting] .u-clane{stroke:var(--ky-night-rim);stroke-opacity:.4}
.ky-turn[data-lighting] .u-apron{fill:#30363e}
.ky-turn .u-back{fill:color-mix(in srgb,var(--ky-up-fascia) 66%,var(--ky-cr-bed))}
.ky-turn .u-backrib{stroke:var(--ky-cr-bed);stroke-width:.7;stroke-opacity:.7}
.ky-turn .u-coping{fill:color-mix(in srgb,var(--ky-up-fascia) 70%,var(--ky-cr-conc))}
.ky-turn .u-cfloor{fill:color-mix(in srgb,var(--ky-cr-bed) 60%,var(--ky-cr-conc))}
.ky-turn .u-clane{stroke:color-mix(in srgb,var(--ky-cr-conc) 55%,#fff);stroke-opacity:.6;stroke-width:1.1}
.ky-turn .kyogijo .ky-cr-shell:not(.ky-cr-ivy){fill:color-mix(in srgb,var(--ky-cr-bed) 70%,var(--ky-cr-conc));fill-opacity:.9}
.ky-turn .ky-up-seats svg{opacity:var(--ky-cr-dim)}
.ky-turn .ky-cr-seat{fill:none;stroke:var(--ky-cr-empty);stroke-width:1.3;stroke-opacity:.65}
.ky-turn .ky-cr-h{stroke:var(--ky-cr-home)}
.ky-turn .ky-cr-a{stroke:var(--ky-cr-away)}
.ky-turn .ky-cr-h-d{stroke:var(--ky-cr-home);stroke-opacity:.6}
.ky-turn .ky-cr-a-d{stroke:var(--ky-cr-away);stroke-opacity:.6}
.ky-turn .ky-cr-th{fill:var(--ky-cr-home)}
.ky-turn .ky-cr-ta{fill:var(--ky-cr-away)}
.ky-turn .ky-cr-tw{fill:#f2f0ea}
.ky-turn .ky-cr-aisle{fill:none;stroke:var(--ky-cr-gap);stroke-opacity:.8}
.ky-turn .ky-cr-shut-veil{fill:var(--ky-cr-empty);fill-opacity:.42}
.ky-turn .ky-cr-row{fill:none;stroke:var(--ky-cr-gap);stroke-opacity:.5;stroke-width:.5}
.ky-turn .ky-bud-gseat{stroke:var(--ky-up-rail);stroke-opacity:.3}
.ky-turn .u-door{fill:var(--ky-up-door)}
.ky-turn .u-window{fill:var(--ky-up-window)}
.ky-turn .u-sash{stroke:var(--ky-up-sash);stroke-width:.25}
.ky-turn .u-banner{fill:var(--ky-up-banner)}
.ky-turn .u-bannerline{stroke:var(--ky-up-bannerline);stroke-width:.18}
.ky-turn .u-room{fill:var(--ky-up-room)}
.ky-turn .u-room.u-room-back{fill:var(--ky-up-roomback)}
.ky-turn .u-ceiling{fill:var(--ky-up-ceiling);fill-opacity:.9}
.ky-turn .u-wainscot{fill:var(--ky-bud-floor,#b98f5c)}
.ky-turn .u-wainline{stroke:var(--ky-up-wainline);stroke-width:.12}
.ky-turn .u-gbed.u-riser{fill:var(--ky-up-riser)}
.ky-turn .u-aisle{fill:var(--ky-up-aisle)}
.ky-turn .u-panel{stroke:var(--ky-up-panel);stroke-width:.1}
.ky-turn .u-alcove{fill:var(--ky-up-alcove)}
.ky-turn .u-frame{stroke:#f6f3ea;stroke-width:.3}
.ky-turn .u-shrinef{fill:#2b2018;stroke:#f6f3ea;stroke-width:.25}
.ky-turn .u-scroll{fill:#efe6cf;stroke:#8a6f45;stroke-width:.08}
.ky-turn .u-purple{fill:var(--ky-up-purple)}
.ky-turn .u-clockface{fill:var(--ky-up-clock);stroke:#3f3c36;stroke-width:.35}
.ky-turn .u-clockhands{stroke:#2a2a28;stroke-width:.3;stroke-linecap:round}
.ky-turn .u-light{fill:#fffdf3;stroke:#b9b7b0;stroke-width:.08}
.ky-turn .u-dais{fill:var(--ky-up-dais);stroke:#f2e6c8;stroke-width:.12}
.ky-turn .u-dais-side{fill:var(--ky-up-dais-side);stroke:#f2e6c8;stroke-width:.08}
.ky-turn .u-shrine{fill:var(--ky-up-shrine)}
.ky-turn .u-shrine-side{fill:var(--ky-up-shrine-side)}
.ky-turn .u-gbed{fill:var(--ky-up-gal)}
.ky-turn .u-slab{fill:var(--ky-up-slab)}
.ky-turn .u-slabedge{fill:var(--ky-up-slabedge)}
.ky-turn .u-seatcush{fill:var(--ky-up-seatc)}
.ky-turn .u-seatback{fill:var(--ky-up-seatb)}
.ky-turn .u-railline{stroke:var(--ky-up-railw);stroke-width:.3;stroke-linecap:square}
.ky-turn .u-matedge{fill:var(--ky-up-matedge)}
.ky-turn .u-surround{fill:var(--ky-mu-barrier,#161a1f);fill-opacity:.92}
.ky-turn .u-surround-rim{fill:var(--ky-mu-chair,#ece7da);fill-opacity:.55}
.ky-turn .u-chair{fill:var(--ky-mu-chair,#ece7da);stroke:var(--ky-mu-chair-edge,#4a4f56);stroke-width:.06}
.ky-turn .u-chair-side{fill:color-mix(in srgb,var(--ky-mu-chair,#ece7da) 62%,#000);stroke:var(--ky-mu-chair-edge,#4a4f56);stroke-width:.04}
.ky-turn .u-bench{fill:var(--ky-ju-desk);stroke:var(--ky-ju-desk-edge);stroke-width:.05}
.ky-turn .u-bench-side{fill:color-mix(in srgb,var(--ky-ju-desk) 62%,#000);stroke:var(--ky-ju-desk-edge);stroke-width:.04}
.ky-turn .u-card{fill:var(--ky-ju-card);stroke:var(--ky-ju-card-edge);stroke-width:.06}
.ky-turn .u-card-name{fill:var(--ky-ju-card-ink);font-family:var(--ky-font,system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif);font-weight:800;text-anchor:middle}
.ky-turn .u-card-id{fill:var(--ky-ju-muted);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;text-anchor:middle;font-variant-numeric:tabular-nums}
.ky-turn .u-card-badge{fill:var(--ky-ju-badge);stroke:var(--ky-ju-card);stroke-width:.06}
.ky-turn .u-card-badge-empty{fill:var(--ky-ju-card);stroke:var(--ky-ju-vacant);stroke-dasharray:.2 .14}
.ky-turn .u-card-badge-empty+.u-card-n{fill:var(--ky-ju-vacant)}
.ky-turn .u-card-n{fill:var(--ky-ju-badge-ink);font-family:var(--ky-font,system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif);font-weight:800;text-anchor:middle}
.ky-turn .u-sign{fill:var(--ky-ju-badge);stroke:var(--ky-ju-card);stroke-width:.05}
.ky-turn .u-sign-text{fill:var(--ky-ju-badge-ink);font-family:var(--ky-font,system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif);font-weight:800;text-anchor:middle}
.ky-turn-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center}
.ky-turn-group{display:flex;flex-wrap:wrap;gap:6px}
.ky-turn-controls button{font:inherit;font-size:.9rem;font-weight:600;min-width:44px;min-height:44px;padding:0 12px;border-radius:999px;border:1px solid var(--ky-turn-rule);background:var(--ky-turn-chip);color:var(--ky-turn-ink);cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.ky-turn-controls button[aria-pressed=true]{background:var(--ky-turn-chip-on);color:var(--ky-turn-chip-on-ink);border-color:var(--ky-turn-chip-on)}
.ky-turn-controls button[data-act]:not([data-act=reset]):not([data-act=play]):not([data-act=reverse]){font-size:1.2rem}
.ky-turn-controls button[data-act=play]{gap:.45em;padding:0 16px}
.ky-turn-controls button[data-act=play] [data-glyph]{font-size:.8em;letter-spacing:-.1em}
.ky-turn-controls button:focus-visible{outline:3px solid var(--ky-turn-ink);outline-offset:2px}
.ky-turn-controls button:disabled{opacity:.4;cursor:default}
.ky-turn-help,.ky-turn-live{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ky-turn-flat{margin:8px 0 0;font-size:.85rem}
${KYOGIJO_TURN_BOARD_STYLE}
`.trim();
