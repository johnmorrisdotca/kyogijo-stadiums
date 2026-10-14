// A situation's rules: the pill, the scorebug and the tag on the score panel's colours, the lit bases and the attacking zone in amber (or the attacking team's colour), football's blue
// line of scrimmage, yellow first-down line and red zone, and the colours of a drive's arrows. The custom properties (`--ky-sit-on`, `--ky-sit-los`, `--ky-sit-fd`, `--ky-sit-red`) are
// the ones a page can set; the dark ones are the dark theme's. A drawing with a situation writes these in; `KYOGIJO_STYLE` has them for a page that draws with `style: "none"`.

/** The situation's colours and shapes. */
export const KYOGIJO_SITUATION_STYLE = `
:where(.kyogijo){--ky-sit-on:#f2b705;--ky-sit-los:#1f6fe0;--ky-sit-fd:#f5d90a;--ky-sit-red:#d6322a;--ky-sit-halo:rgba(8,12,16,.72);--ky-sit-td:#2f9e5b;--ky-sit-fg:#7bbf3a;--ky-sit-lose:#d6453d;--ky-sit-neutral:#9aa4ab}
.kyogijo .ky-sit-bg{fill:var(--ky-plate)}
.kyogijo .ky-badge .ky-sit-bg{stroke:var(--ky-plate-ink);stroke-opacity:.35;stroke-width:1}
.kyogijo .ky-sit-t,.kyogijo .ky-sit-lab,.kyogijo .ky-sit-sdw{fill:var(--ky-plate-ink)}
.kyogijo .ky-sit-sub,.kyogijo .ky-sit-sdw{opacity:.82}
.kyogijo .ky-sit-lab{font-weight:700;opacity:.9}
.kyogijo .ky-sit-dot-left{fill:var(--ky-left)}
.kyogijo .ky-sit-dot-right{fill:var(--ky-right)}
.kyogijo .ky-sit-dot{stroke:var(--ky-plate-ink);stroke-opacity:.8}
.kyogijo .ky-sit-zone{fill:var(--ky-sit-on);fill-opacity:.2}
.kyogijo .ky-sit-zone-left{fill:var(--ky-left);fill-opacity:.2}
.kyogijo .ky-sit-zone-right{fill:var(--ky-right);fill-opacity:.2}
.kyogijo .ky-sit-net{fill:none;stroke:var(--ky-sit-lose);stroke-width:.7;stroke-dasharray:1.6 1}
.kyogijo .ky-sit-goal{fill:var(--ky-sit-on)}
.kyogijo .ky-sit-miss{fill:none;stroke:var(--ky-plate-ink);stroke-opacity:.85}
.kyogijo .ky-sit-wait{fill:var(--ky-plate-ink);fill-opacity:.35}
.kyogijo .ky-sit-sd{stroke-opacity:1}
.kyogijo .ky-sit-goal.ky-sit-sd{stroke:var(--ky-plate-ink)}
.kyogijo .ky-sit-split{stroke:var(--ky-plate-ink);stroke-opacity:.4;stroke-dasharray:.5 .5}
.kyogijo .ky-sit-dia{stroke:var(--ky-plate-ink);stroke-opacity:.55}
.kyogijo .ky-sit-base{fill:var(--ky-plate-ink);fill-opacity:.24}
.kyogijo .ky-sit-base.ky-sit-on{fill:var(--ky-sit-on);fill-opacity:1;stroke:var(--ky-plate-ink)}
.kyogijo .ky-sit-out{fill:var(--ky-plate-ink);fill-opacity:.24}
.kyogijo .ky-sit-out.ky-sit-on{fill:var(--ky-sit-lose);fill-opacity:1}
.kyogijo .ky-sit-arrow{fill:var(--ky-plate-ink)}
.kyogijo .ky-sit-lit{fill:var(--ky-sit-on);stroke:var(--ky-line);stroke-width:.7;stroke-linejoin:round;fill-opacity:.95}
.kyogijo .ky-sit-red{fill:var(--ky-sit-red);fill-opacity:.24}
.kyogijo .ky-sit-los-halo,.kyogijo .ky-sit-fd-halo,.kyogijo .ky-sit-dr-halo{stroke:var(--ky-sit-halo);stroke-width:3;stroke-linecap:round}
.kyogijo .ky-sit-dr-halo{stroke-width:2.8}
.kyogijo .ky-sit-los{stroke:var(--ky-sit-los);stroke-width:1.5}
.kyogijo .ky-sit-fd{stroke:var(--ky-sit-fd);stroke-width:1.5}
.kyogijo .ky-sit-dr{stroke:var(--ky-sit-neutral);stroke-width:1.3;stroke-linecap:round}
.kyogijo .ky-sit-dot-s,.kyogijo .ky-sit-dh{fill:var(--ky-sit-neutral);stroke:var(--ky-sit-halo);stroke-width:.4}
.kyogijo .ky-sit-d-touchdown{stroke:var(--ky-sit-td);fill:var(--ky-sit-td)}
.kyogijo .ky-sit-d-field-goal{stroke:var(--ky-sit-fg);fill:var(--ky-sit-fg)}
.kyogijo .ky-sit-d-missed-field-goal,.kyogijo .ky-sit-d-downs{stroke:#e8862a;fill:#e8862a}
.kyogijo .ky-sit-d-turnover,.kyogijo .ky-sit-d-interception,.kyogijo .ky-sit-d-fumble{stroke:var(--ky-sit-lose);fill:var(--ky-sit-lose)}
.kyogijo .ky-sit-dl{fill:var(--ky-line);stroke:var(--ky-sit-halo);stroke-width:.3em;paint-order:stroke;stroke-linejoin:round}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){--ky-sit-on:#ffc933;--ky-sit-los:#4b95ff;--ky-sit-red:#ff6a5e}}
:where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){--ky-sit-on:#ffc933;--ky-sit-los:#4b95ff;--ky-sit-red:#ff6a5e}`.trim();
