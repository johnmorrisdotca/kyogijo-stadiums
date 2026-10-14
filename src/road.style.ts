/**
 * The rules of the road-to-the-final chart (`roadToFinal`): the ground, the ink and the quiet ink in light and dark, the panel behind a round's name, the road down the
 * middle, and the classes of the title, the names, the scores and the small words under them. The colours are custom properties on the chart (`--ky-road-bg`,
 * `--ky-road-ink`, `--ky-road-muted`, `--ky-road-panel`, `--ky-road-spine`, `--ky-road-left`, `--ky-road-right`), so a page can set them. A chart writes these rules in,
 * with the round mark's (`KYOGIJO_MARK_STYLE`); `KYOGIJO_STYLE` has them for a page that draws with `style: "none"`.
 */
export const KYOGIJO_ROAD_STYLE = `
:where(.kyogijo-road){--ky-road-bg:#f6f4ee;--ky-road-ink:#1d2421;--ky-road-muted:#5a655f;--ky-road-panel:#e7e3d6;--ky-road-spine:#c4bfae;--ky-road-left:#2f6db0;--ky-road-right:#b5452c;--ky-road-plain:#8b948f;--ky-mark-ring:#fff;--ky-mark-edge:rgba(0,0,0,.3);--ky-mark-plain:#fff;--ky-font:system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif;display:block;width:100%;height:auto;font-family:var(--ky-font)}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo-road:not([data-theme=light])){--ky-road-bg:#131716;--ky-road-ink:#ece8dc;--ky-road-muted:#a9b2ac;--ky-road-panel:#252b28;--ky-road-spine:#3d4541;--ky-road-left:#6aa9f0;--ky-road-right:#f59a5b;--ky-mark-ring:#e9ece6;--ky-mark-edge:rgba(0,0,0,.6);--ky-mark-plain:#2a302d}}
:where(html[data-theme=dark] .kyogijo-road,.kyogijo-road[data-theme=dark]){--ky-road-bg:#131716;--ky-road-ink:#ece8dc;--ky-road-muted:#a9b2ac;--ky-road-panel:#252b28;--ky-road-spine:#3d4541;--ky-road-left:#6aa9f0;--ky-road-right:#f59a5b;--ky-mark-ring:#e9ece6;--ky-mark-edge:rgba(0,0,0,.6);--ky-mark-plain:#2a302d}
.kyogijo-road .ky-r-bg{fill:var(--ky-road-bg)}
.kyogijo-road text{font-family:var(--ky-font);font-variant-numeric:tabular-nums}
.kyogijo-road .ky-r-t{fill:var(--ky-road-ink);font-weight:800}
.kyogijo-road .ky-r-s,.kyogijo-road .ky-r-e{fill:var(--ky-road-muted);font-weight:600}
.kyogijo-road .ky-r-name{fill:var(--ky-road-ink);font-weight:800}
.kyogijo-road .ky-r-panel{fill:var(--ky-road-panel)}
.kyogijo-road .ky-r-lab{fill:var(--ky-road-ink);font-weight:700}
.kyogijo-road .ky-r-spine{stroke:var(--ky-road-spine);fill:none;stroke-linecap:round}
.kyogijo-road .ky-r-n{fill:var(--ky-road-ink);font-weight:800}
.kyogijo-road .ky-r-n.ky-r-low,.kyogijo-road .ky-r-dash{fill:var(--ky-road-muted);font-weight:700}
.kyogijo-road .ky-r-sub,.kyogijo-road .ky-r-code{fill:var(--ky-road-muted);font-weight:700}
.kyogijo-road .ky-r-vs{fill:var(--ky-road-muted);font-weight:700}
.kyogijo-road .ky-r-dim{opacity:.5}
.kyogijo-road .ky-r-left{--c:var(--ky-road-left)}
.kyogijo-road .ky-r-right{--c:var(--ky-road-right)}
.kyogijo-road .ky-r-plain{--c:var(--ky-road-plain)}`.trim();
