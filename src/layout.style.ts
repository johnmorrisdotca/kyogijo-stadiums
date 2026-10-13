/**
 * The rules of a grid of drawings (`drawGrid`): the ground colour and the quiet ink of the subtitle and the credit line in light and dark, and the classes of the
 * title, the subtitle, a cell's label, the key and the credit line. A grid is a `.kyogijo` as well, so the base rules give it the ink, the font and the colours of the
 * layers; `KYOGIJO_STYLE` has these for a page that draws with `style: "none"`.
 */
export const KYOGIJO_GRID_STYLE = `
:where(.kyogijo-grid){--ky-grid-bg:#f6f4ee;--ky-grid-muted:#566059}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo-grid:not([data-theme=light])){--ky-grid-bg:#131716;--ky-grid-muted:#a9b2ac}}
:where(html[data-theme=dark] .kyogijo-grid,.kyogijo-grid[data-theme=dark]){--ky-grid-bg:#131716;--ky-grid-muted:#a9b2ac}
.kyogijo-grid .ky-g-t,.kyogijo-grid .ky-g-s,.kyogijo-grid .ky-g-c,.kyogijo-grid .ky-g-k,.kyogijo-grid .ky-g-e{font-family:var(--ky-font)}
.kyogijo-grid .ky-g-t{fill:var(--ky-ink);font-weight:800}
.kyogijo-grid .ky-g-s{fill:var(--ky-grid-muted);font-weight:600}
.kyogijo-grid .ky-g-c{fill:var(--ky-ink);font-weight:700;text-anchor:middle}
.kyogijo-grid .ky-g-k{fill:var(--ky-ink);font-weight:600}
.kyogijo-grid .ky-g-e{fill:var(--ky-grid-muted);font-weight:500}
.kyogijo-grid .ky-g-m{fill:var(--c,var(--ky-layer));stroke:var(--ky-layer-edge);stroke-width:.6;stroke-linejoin:round}
.kyogijo-grid .ky-g-m.ky-g-h{fill:var(--ky-layer-hollow);stroke:var(--c,var(--ky-layer));stroke-width:1.6}`.trim();
