// The pageant's rules: the colours of a carpet's border and fabric, of a stage's disc and ring, and the entrance. The colours are custom properties with fallbacks (`--ky-pg-border`,
// `--ky-pg-edge`, `--ky-pg-seam`, `--ky-pg-shadow`, `--ky-pg-disc`, `--ky-pg-groove`, `--ky-pg-light`), so a page can set them; the dark ones are the dark theme's. A drawing with a
// pageant writes these in; `KYOGIJO_STYLE` has them for a page that draws with `style: "none"`.

/** The pageant's colours, light and dark. */
export const KYOGIJO_PAGEANT_STYLE = `
.kyogijo .ky-pg-border{fill:var(--ky-pg-border,#14181a)}
.kyogijo .ky-pg-edge{fill:none;stroke:var(--ky-pg-edge,rgba(255,255,255,.55))}
.kyogijo .ky-pg-seam{fill:none;stroke:var(--ky-pg-seam,rgba(0,0,0,.4))}
.kyogijo .ky-pg-shadow{fill:var(--ky-pg-shadow,rgba(0,0,0,.26))}
.kyogijo .ky-pg-ground{fill:var(--c,#d9dde0)}
.kyogijo .ky-pg-plain{fill:var(--c,var(--ky-mark-plain,#f4f5f6))}
.kyogijo .ky-pg-band{fill:var(--ci,#fff)}
.kyogijo .ky-pg-name{fill:var(--c,#14181a);text-anchor:middle}
.kyogijo .ky-pg-disc{fill:var(--ky-pg-disc,#101417)}
.kyogijo .ky-pg-groove{fill:none;stroke:var(--ky-pg-groove,rgba(0,0,0,.5))}
.kyogijo .ky-pg-light{fill:var(--ky-pg-light,#f7f4ea)}
.kyogijo .ky-pg-pill{fill:var(--ky-plate,rgba(18,24,21,.9))}
.kyogijo .ky-pg-pilltext{fill:var(--ky-plate-ink,#fff);text-anchor:middle}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){--ky-pg-border:#050709;--ky-pg-edge:rgba(255,255,255,.42);--ky-pg-seam:rgba(0,0,0,.6);--ky-pg-shadow:rgba(0,0,0,.45);--ky-pg-disc:#07090b;--ky-pg-light:#e9e5d6}}
:where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){--ky-pg-border:#050709;--ky-pg-edge:rgba(255,255,255,.42);--ky-pg-seam:rgba(0,0,0,.6);--ky-pg-shadow:rgba(0,0,0,.45);--ky-pg-disc:#07090b;--ky-pg-light:#e9e5d6}`.trim();

/**
 * The entrance (`animate: "unfurl"` or `"fade"`), in CSS only, and only for a reader who has not asked for less motion: a carpet rolls out from its own end, a stage and the emblem
 * grow, and `fade` brings each in. The end state is the drawing's own, so a reader who has asked for less sees it at once, and a renderer that reads no CSS animation (the canvas,
 * the PNG) draws it finished. The second team's picture and then the emblem come a little later.
 */
export const KYOGIJO_PAGEANT_MOTION = `
@media (prefers-reduced-motion:no-preference){
.kyogijo .ky-pg-fade .ky-pg-art{animation:ky-pg-fade .8s ease-out both}
.kyogijo .ky-pg-unfurl .ky-pg-art{transform-box:fill-box;animation:ky-pg-unfurl-x .95s cubic-bezier(.22,.8,.28,1) both}
.kyogijo .ky-pg-unfurl.ky-pg-left .ky-pg-art{transform-origin:0 50%}
.kyogijo .ky-pg-unfurl.ky-pg-right .ky-pg-art{transform-origin:100% 50%}
.kyogijo .ky-pg-unfurl.ky-pg-tall .ky-pg-art{animation-name:ky-pg-unfurl-y}
.kyogijo .ky-pg-unfurl.ky-pg-tall.ky-pg-left .ky-pg-art{transform-origin:50% 0}
.kyogijo .ky-pg-unfurl.ky-pg-tall.ky-pg-right .ky-pg-art{transform-origin:50% 100%}
.kyogijo .ky-pg-unfurl.ky-pg-stage .ky-pg-art,.kyogijo .ky-pg-unfurl.ky-pg-emblem .ky-pg-art{animation-name:ky-pg-grow;transform-origin:50% 50%}
.kyogijo .ky-pg-right .ky-pg-art{animation-delay:.16s}
.kyogijo .ky-pg-emblem .ky-pg-art{animation-delay:.34s}
@keyframes ky-pg-fade{from{opacity:0}to{opacity:1}}
@keyframes ky-pg-unfurl-x{from{transform:scaleX(.02);opacity:.3}to{transform:none;opacity:1}}
@keyframes ky-pg-unfurl-y{from{transform:scaleY(.02);opacity:.3}to{transform:none;opacity:1}}
@keyframes ky-pg-grow{from{transform:scale(.55);opacity:0}to{transform:none;opacity:1}}
}`.trim();
