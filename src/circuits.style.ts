// The rules of a circuit's drawing and of what stands up in its 3D view, light and dark. The colours are custom properties (`--ky-ci-*`) a page can set; `:where` keeps their weight at nothing so that a page's own win. The
// drawing follows the device and the page, and a `data-theme` of light or dark on it or on the page forces one. Nothing here is a team's, a race's or a sponsor's colour: asphalt, paint and paper.

/** The colours in light and in dark. */
export const CIRCUIT_LIGHT =
  "--ky-ci-ground:#eceae3;--ky-ci-area:#dcd7cb;--ky-ci-area-edge:#bdb6a6;--ky-ci-building:#c2bbad;--ky-ci-building-edge:#7f786b;--ky-ci-track:#3a3f46;--ky-ci-edge:#ffffff;--ky-ci-halo:rgba(58,63,70,.16);--ky-ci-pit:#5d636b;--ky-ci-line:#ffffff;--ky-ci-check:#15181c;--ky-ci-arrow:#f2c230;--ky-ci-arrow-edge:#3a3f46;--ky-ci-badge:#14213d;--ky-ci-badge-ink:#ffffff;--ky-ci-leader:#14213d;--ky-ci-ink:#1f2320;--ky-ci-muted:#4b535c";
export const CIRCUIT_DARK =
  "--ky-ci-ground:#10151b;--ky-ci-area:#1b232c;--ky-ci-area-edge:#334150;--ky-ci-building:#3a4756;--ky-ci-building-edge:#6f7f90;--ky-ci-track:#5d646e;--ky-ci-edge:#e6e9ed;--ky-ci-halo:rgba(230,233,237,.1);--ky-ci-pit:#7a838e;--ky-ci-line:#ffffff;--ky-ci-check:#0b0d10;--ky-ci-arrow:#f2c230;--ky-ci-arrow-edge:#10151b;--ky-ci-badge:#e9edf2;--ky-ci-badge-ink:#10151b;--ky-ci-leader:#c4ccd5;--ky-ci-ink:#eef1f4;--ky-ci-muted:#aab3bd";

/** The rules of a circuit's drawing, and of the turn markers and the pit building of its 3D view (`.ky-turn`). */
export const KYOGIJO_CIRCUIT_STYLE = `
:where(.ky-circuit,.ky-turn){${CIRCUIT_LIGHT}}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .ky-circuit:not([data-theme=light]),html:not([data-theme=light]) .ky-turn:not([data-theme=light])){${CIRCUIT_DARK}}}
:where(html[data-theme=dark] .ky-circuit,.ky-circuit[data-theme=dark],html[data-theme=dark] .ky-turn,.ky-turn[data-theme=dark]){${CIRCUIT_DARK}}
:where(.ky-circuit){--ky-font:system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif;display:block;width:100%;height:auto;font-family:var(--ky-font)}
.ky-circuit .ky-ci-ground{fill:var(--ky-ci-ground)}
.ky-circuit .ky-ci-area{fill:var(--ky-ci-area);stroke:var(--ky-ci-area-edge);stroke-linejoin:round}
.ky-circuit .ky-ci-building{fill:var(--ky-ci-building);stroke:var(--ky-ci-building-edge);stroke-linejoin:round}
.ky-circuit .ky-ci-halo{fill:none;stroke:var(--ky-ci-halo);stroke-linejoin:round;stroke-linecap:round}
.ky-circuit .ky-ci-edge{fill:none;stroke:var(--ky-ci-edge);stroke-linejoin:round;stroke-linecap:round}
.ky-circuit .ky-ci-track{fill:none;stroke:var(--ky-ci-track);stroke-linejoin:round;stroke-linecap:round}
.ky-circuit .ky-ci-pit{fill:none;stroke:var(--ky-ci-pit);stroke-linejoin:round;stroke-linecap:round}
.ky-circuit .ky-ci-start{stroke:var(--ky-ci-line);stroke-linecap:butt}
.ky-circuit .ky-ci-check-a{fill:var(--ky-ci-check)}
.ky-circuit .ky-ci-check-b{fill:var(--ky-ci-line)}
.ky-circuit .ky-ci-arrow{fill:var(--ky-ci-arrow);stroke:var(--ky-ci-arrow-edge);stroke-linejoin:round}
.ky-circuit .ky-ci-leader{stroke:var(--ky-ci-leader);fill:none;stroke-linecap:round}
.ky-circuit .ky-ci-badge,.ky-turn .u-ci-badge{fill:var(--ky-ci-badge);stroke:var(--ky-ci-ground)}
.ky-circuit .ky-ci-badge-n,.ky-turn .u-ci-badge-n{fill:var(--ky-ci-badge-ink);font-family:var(--ky-font,system-ui,sans-serif);font-weight:800;text-anchor:middle;font-variant-numeric:tabular-nums}
.ky-circuit .ky-ci-name{fill:var(--ky-ci-ink);font-family:var(--ky-font);font-weight:800}
.ky-circuit .ky-ci-facts{fill:var(--ky-ci-muted);font-family:var(--ky-font);font-weight:700;font-variant-numeric:tabular-nums}
.ky-circuit .ky-ci-north{fill:var(--ky-ci-ink);stroke:var(--ky-ci-ink);stroke-linejoin:round;stroke-linecap:round}
.ky-circuit .ky-ci-north-n{fill:none;stroke:var(--ky-ci-ink);stroke-linejoin:round;stroke-linecap:round}
.ky-circuit .ky-ci-scale{fill:none;stroke:var(--ky-ci-ink);stroke-linecap:butt}
.ky-circuit .ky-ci-scale-fill{fill:var(--ky-ci-ink)}
.ky-circuit .ky-ci-scale-text{fill:var(--ky-ci-ink);font-family:var(--ky-font);font-weight:700;font-variant-numeric:tabular-nums}
.ky-circuit .ky-ci-credit{fill:var(--ky-ci-muted);font-family:var(--ky-font);font-weight:600}
`.trim();
