// The rules of a judging assignment, light and dark: the picture's ground and ink, the chart's rows, the badge of a seat's number and the name card in a seat. Everything is high contrast on purpose: it is read live, on a tablet,
// at arm's length. The surface keeps its own rules, which the drawing carries as it always does.

/** The colours of a judging picture in light and in dark, as custom properties (the 3D view's stylesheet carries them too, for its name cards). */
export const JUDGING_LIGHT = "--ky-ju-bg:#f7f5ef;--ky-ju-ink:#10151b;--ky-ju-muted:#434b54;--ky-ju-row:#ffffff;--ky-ju-rule:#b9b3a3;--ky-ju-badge:#10151b;--ky-ju-badge-ink:#ffffff;--ky-ju-card:#ffffff;--ky-ju-card-ink:#10151b;--ky-ju-card-edge:#10151b;--ky-ju-vacant:#6a717a;--ky-ju-desk:#e9e2d0;--ky-ju-desk-edge:#4a4f56";
export const JUDGING_DARK = "--ky-ju-bg:#0d1218;--ky-ju-ink:#f6f3ea;--ky-ju-muted:#bcc3cb;--ky-ju-row:#18212a;--ky-ju-rule:#475463;--ky-ju-badge:#f6f3ea;--ky-ju-badge-ink:#0d1218;--ky-ju-card:#18212a;--ky-ju-card-ink:#f6f3ea;--ky-ju-card-edge:#f6f3ea;--ky-ju-vacant:#98a1ab;--ky-ju-desk:#6f6859;--ky-ju-desk-edge:#05070a";

/**
 * The rules of a judging assignment. `:where` keeps the specificity at nothing so that a page's own custom properties win; the picture follows the device and the page like a drawing does, and a `data-theme` of light or
 * dark forces it. The colours are custom properties (`--ky-ju-*`) a page can set.
 */
export const KYOGIJO_JUDGING_STYLE = `
:where(.kyogijo){${JUDGING_LIGHT}}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){${JUDGING_DARK}}}
:where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){${JUDGING_DARK}}
.kyogijo .ky-ju-ground{fill:var(--ky-ju-bg)}
.kyogijo .ky-ju-mat{fill:var(--ky-ju-ink);font-family:var(--ky-font);font-weight:800}
.kyogijo .ky-ju-style{fill:var(--ky-ju-muted);font-family:var(--ky-font);font-weight:700}
.kyogijo .ky-ju-row{fill:var(--ky-ju-row);stroke:var(--ky-ju-rule);stroke-width:1.5}
.kyogijo .ky-ju-role{fill:var(--ky-ju-muted);font-family:var(--ky-font);font-weight:700}
.kyogijo .ky-ju-name{fill:var(--ky-ju-ink);font-family:var(--ky-font);font-weight:800}
.kyogijo .ky-ju-id{fill:var(--ky-ju-muted);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;font-variant-numeric:tabular-nums}
.kyogijo .ky-ju-vacant{fill:var(--ky-ju-vacant);font-family:var(--ky-font);font-weight:700;font-style:italic}
.kyogijo .ky-ju-badge{fill:var(--ky-ju-badge);stroke:var(--ky-ju-bg);stroke-width:2}
.kyogijo .ky-ju-badge-empty{fill:var(--ky-ju-bg);stroke:var(--ky-ju-vacant);stroke-width:2;stroke-dasharray:4 3}
.kyogijo .ky-ju-badge-n{fill:var(--ky-ju-badge-ink);font-family:var(--ky-font);font-weight:800;text-anchor:middle}
.kyogijo .ky-ju-badge-empty+.ky-ju-badge-n{fill:var(--ky-ju-vacant)}
.kyogijo .ky-ju-card{fill:var(--ky-ju-card);stroke:var(--ky-ju-card-edge);stroke-width:1.4}
.kyogijo .ky-ju-card-name{fill:var(--ky-ju-card-ink);font-family:var(--ky-font);font-weight:800;text-anchor:middle}
.kyogijo .ky-ju-card-id{fill:var(--ky-ju-muted);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;text-anchor:middle;font-variant-numeric:tabular-nums}
.kyogijo .ky-ju-plan-frame{fill:none;stroke:var(--ky-ju-rule);stroke-width:1.5}
.kyogijo .ky-ju-board .ky-plate-bg{stroke:var(--ky-plate-ink);stroke-opacity:.16;stroke-width:1.5}
.kyogijo .ky-ju-board .ky-comp.ky-ju-board-title{opacity:1;font-weight:800}
.kyogijo .ky-ju-board .ky-ju-board-id{font-weight:800;font-variant-numeric:tabular-nums}
.kyogijo .ky-ju-chip-empty{fill:none;stroke:var(--ky-plate-ink);stroke-opacity:.5;stroke-width:1.5;stroke-dasharray:5 4}
.kyogijo .ky-ju-board-vacant{fill:var(--ky-plate-ink);opacity:.72;font-family:var(--ky-font);font-weight:700;font-style:italic}
.kyogijo .ky-ju-board .ky-ju-badge-empty{fill:none;stroke:var(--ky-plate-ink)}
.kyogijo .ky-ju-board .ky-ju-badge-empty+.ky-ju-badge-n{fill:var(--ky-plate-ink)}
`.trim();


/**
 * What a board needs of the drawing's own rules, for a board drawn on its own (`judgingBoard`, laid over the 3D view): the plate, the chips, the ink and the face, scoped to the board so that they cannot change the
 * surface it lies over (the stylesheet of a page is shared by every drawing in it, and the drawing's whole stylesheet would set the surface's colours again). The values are the drawing's.
 */
export const KYOGIJO_JUDGING_BOARD_STYLE = `
:where(.ky-judging-board){--ky-ink:#1f2320;--ky-plate:rgba(18,24,21,.9);--ky-plate-ink:#fff;--ky-left:#2f6db0;--ky-left-ink:#fff;--ky-font:system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif;display:block;width:100%;height:auto;font-family:var(--ky-font)}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .ky-judging-board:not([data-theme=light])){--ky-ink:#ece8dc;--ky-plate:rgba(0,0,0,.82)}}
:where(html[data-theme=dark] .ky-judging-board,.ky-judging-board[data-theme=dark]){--ky-ink:#ece8dc;--ky-plate:rgba(0,0,0,.82)}
.ky-judging-board .ky-text{fill:var(--ky-ink);font-family:var(--ky-font);font-weight:800;letter-spacing:0;font-variant-numeric:tabular-nums}
.ky-judging-board .ky-ink-left{fill:var(--ky-left-ink)}
.ky-judging-board .ky-panel-left{fill:var(--ky-left)}
.ky-judging-board .ky-plate-bg{fill:var(--ky-plate)}
.ky-judging-board .ky-score{fill:var(--ky-plate-ink);font-weight:800}
.ky-judging-board .ky-comp,.ky-judging-board .ky-foot{fill:var(--ky-plate-ink);text-anchor:middle;opacity:.82;font-weight:700}
`.trim();
