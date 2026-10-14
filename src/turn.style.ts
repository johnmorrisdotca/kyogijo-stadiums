/**
 * The 3D view's stylesheet: the colours of what stands on the surface, in light and dark, and the rules that lay the scene out. Like the drawing's own, the
 * defaults are in `:where()`, which has no weight, so a page's own rule always wins; the colours are custom properties (`--ky-up-*`) a page can set.
 */
export const KYOGIJO_TURN_STYLE = `
:where(.ky-turn){--ky-up-pole:#e9e7de;--ky-up-white:#f6f4ec;--ky-up-yellow:#f2c230;--ky-up-red:#c8372d;--ky-up-orange:#f26a1b;--ky-up-wood:#e3d4b4;--ky-up-leg:#474e49;--ky-up-pad:#2f6db0;--ky-up-table:#18243f;--ky-up-foot:rgba(0,0,0,.25);--ky-up-ground:#d9d5c7;--ky-up-wall:#2f4a36;--ky-up-cap:#1d2a22;--ky-up-board:#ece9df;--ky-up-glass:rgba(138,190,232,.26);--ky-up-backboard:rgba(255,255,255,.62);--ky-up-outline:#f2f0e6;--ky-up-rim:#e8591a;--ky-up-mesh:rgba(24,30,27,.7);--ky-up-netfill:rgba(255,255,255,.2);--ky-up-tape:#fbfaf4;--ky-turn-bg:transparent;--ky-turn-ink:#1f2320;--ky-turn-rule:rgba(31,35,32,.22);--ky-turn-chip:rgba(255,255,255,.86);--ky-turn-chip-on:#1f2320;--ky-turn-chip-on-ink:#fff}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .ky-turn:not([data-theme=light])){--ky-up-pole:#d6d4ca;--ky-up-white:#e8e6dc;--ky-up-wood:#a89873;--ky-up-leg:#8a928c;--ky-up-ground:#242823;--ky-up-wall:#4d6b55;--ky-up-cap:#c9d2cc;--ky-up-board:#8d928b;--ky-up-glass:rgba(150,200,240,.2);--ky-up-backboard:rgba(255,255,255,.34);--ky-up-outline:#e7e4d8;--ky-up-mesh:rgba(236,236,226,.62);--ky-up-netfill:rgba(255,255,255,.08);--ky-up-tape:#efede2;--ky-turn-ink:#ece8dc;--ky-turn-rule:rgba(236,232,220,.28);--ky-turn-chip:rgba(24,28,25,.82);--ky-turn-chip-on:#ece8dc;--ky-turn-chip-on-ink:#1f2320}}
:where(html[data-theme=dark] .ky-turn,.ky-turn[data-theme=dark]){--ky-up-pole:#d6d4ca;--ky-up-white:#e8e6dc;--ky-up-wood:#a89873;--ky-up-leg:#8a928c;--ky-up-ground:#242823;--ky-up-wall:#4d6b55;--ky-up-cap:#c9d2cc;--ky-up-board:#8d928b;--ky-up-glass:rgba(150,200,240,.2);--ky-up-backboard:rgba(255,255,255,.34);--ky-up-outline:#e7e4d8;--ky-up-mesh:rgba(236,236,226,.62);--ky-up-netfill:rgba(255,255,255,.08);--ky-up-tape:#efede2;--ky-turn-ink:#ece8dc;--ky-turn-rule:rgba(236,232,220,.28);--ky-turn-chip:rgba(24,28,25,.82);--ky-turn-chip-on:#ece8dc;--ky-turn-chip-on-ink:#1f2320}
.ky-turn{position:relative;display:block;width:100%;color:var(--ky-turn-ink);font-family:var(--ky-font,system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif);background:var(--ky-turn-bg)}
.ky-turn-view{position:relative;isolation:isolate;width:100%;aspect-ratio:var(--ky-turn-ratio,16/10);min-height:260px;overflow:hidden;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;border-radius:12px;outline-offset:2px}
.ky-turn[data-touch=turn] .ky-turn-view{touch-action:none}
.ky-turn[data-dragging] .ky-turn-view{cursor:grabbing}
.ky-turn-view:focus-visible{outline:3px solid var(--ky-turn-ink)}
.ky-turn-world{position:absolute;left:50%;top:50%;width:0;height:0}
.ky-turn-floor,.ky-up{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none}
.ky-turn-floor>svg{display:block;width:100%;height:auto}
.ky-up>svg{display:block;overflow:visible}
@media (max-width:560px){.ky-turn-view{--ky-turn-ratio:5/4}.ky-turn-controls button{padding:0 10px;font-size:.85rem}}
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
.ky-turn .u-wall{fill:var(--ky-up-wall)}
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
.ky-turn-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center}
.ky-turn-group{display:flex;flex-wrap:wrap;gap:6px}
.ky-turn-controls button{font:inherit;font-size:.9rem;font-weight:600;min-width:44px;min-height:44px;padding:0 12px;border-radius:999px;border:1px solid var(--ky-turn-rule);background:var(--ky-turn-chip);color:var(--ky-turn-ink);cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.ky-turn-controls button[aria-pressed=true]{background:var(--ky-turn-chip-on);color:var(--ky-turn-chip-on-ink);border-color:var(--ky-turn-chip-on)}
.ky-turn-controls button[data-act]:not([data-act=reset]){font-size:1.2rem}
.ky-turn-controls button:focus-visible{outline:3px solid var(--ky-turn-ink);outline-offset:2px}
.ky-turn-controls button:disabled{opacity:.4;cursor:default}
.ky-turn-help,.ky-turn-live{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ky-turn-flat{margin:8px 0 0;font-size:.85rem}
`.trim();
