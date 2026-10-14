// The stylesheet of a skating drawing: the ice, the floor of an infield, the warm-up lane, the padding, the furniture of a figure skating rink, and the colours of the lines the ISU names (blue for the
// lanes' demarcation, red for the starting, finishing and coaches' lines) and of the blocks. In light and in dark, at no weight, so that a look, a page's own rule and the options' `colors` all win.
// The colours are ours: the Rules name only the blue and the red of the lines.

const ICE = "--ky-surface:#eef5fa;--ky-surface-alt:#dfeaf3;--ky-apron:#d3dbe1;--ky-boards:#9aa4ab;--ky-red:#c8372d;--ky-blue:#2a5db0;--ky-ink:#1f2320";
const ICE_DARK = "--ky-surface:#34444f;--ky-surface-alt:#2b3943;--ky-apron:#1a2025;--ky-boards:#4b5156;--ky-red:#ff8f84;--ky-blue:#86b4ff;--ky-ink:#ece8dc";

/** The rules of a skating drawing's colours. */
export const KYOGIJO_SKATING_STYLE: string = [
  `:where(.kyogijo[data-sport=skating]){${ICE}}`,
  `@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo[data-sport=skating]:not([data-theme=light])){${ICE_DARK}}}`,
  `:where(html[data-theme=dark] .kyogijo[data-sport=skating],.kyogijo[data-theme=dark][data-sport=skating]){${ICE_DARK}}`,
  ".kyogijo .ky-ska-ice{fill:var(--ky-surface)}",
  ".kyogijo .ky-ska-floor{fill:var(--ky-apron)}",
  ".kyogijo .ky-ska-warm{fill:var(--ky-surface-alt)}",
  ".kyogijo .ky-ska-pad{fill:var(--ky-boards)}",
  ".kyogijo .ky-ska-desk{fill:var(--ky-ink);fill-opacity:.55}",
  ".kyogijo .ky-ska-kiss{fill:var(--ky-red);fill-opacity:.6}",
  ".kyogijo .ky-ska-b{stroke:var(--ky-blue);fill:none}",
  ".kyogijo .ky-ska-r{stroke:var(--ky-red);fill:none}",
  ".kyogijo .ky-ska-k{stroke:var(--ky-ink);fill:none}",
  ".kyogijo .ky-ska-blocks{stroke:var(--ky-ink);fill:none;stroke-linecap:round}",
  ".kyogijo .ky-ska-block{fill:var(--ky-ink)}.kyogijo .ky-ska-cone{fill:var(--ky-red)}",
].join("\n");

/** The base rules a drawing of this sport writes into its stylesheet: nothing for another sport. */
export const skatingStyle = (sport: string): string => (sport === "skating" ? KYOGIJO_SKATING_STYLE : "");
