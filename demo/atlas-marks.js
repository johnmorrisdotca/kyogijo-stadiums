// The atlas's markers, drawn the same on the demo's map and on the static map of docs/atlas.md: a circle for a place in use today,
// a diamond for one of the past, so that the two are told apart by shape and not by colour alone; a baseball park is solid, a
// soccer ground has a dot at its centre and a hall of the budō a small square, and the colours are the sport's. Sizes are in px, scaled by `unit` (map units per px).

/** The marker styles, with the page's light and dark (the device's, and either one forced by data-theme on the page). */
export const ATLAS_MARK_STYLE = `
.atlas-mark { --am-baseball: #b8470d; --am-soccer: #0b6e8a; --am-budo: #8f2437; --am-edge: #fff; --am-dot: #fff; --am-ring: #1f2320; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .atlas-mark { --am-baseball: #ff9a57; --am-soccer: #5cc8e6; --am-budo: #ff8a9c; --am-edge: #141614; --am-dot: #141614; --am-ring: #ece8dc; } }
:root[data-theme="dark"] .atlas-mark { --am-baseball: #ff9a57; --am-soccer: #5cc8e6; --am-budo: #ff8a9c; --am-edge: #141614; --am-dot: #141614; --am-ring: #ece8dc; }
.atlas-mark .am-body { stroke: var(--am-edge); stroke-width: 1.5px; vector-effect: non-scaling-stroke; }
.atlas-mark.am-baseball .am-body { fill: var(--am-baseball); }
.atlas-mark.am-soccer .am-body { fill: var(--am-soccer); }
.atlas-mark.am-budo .am-body { fill: var(--am-budo); }
.atlas-mark .am-dot { fill: var(--am-dot); }
.atlas-mark .am-halo { fill: none; stroke: var(--am-ring); stroke-width: 2.5px; vector-effect: non-scaling-stroke; }
`;

const num = (n) => Math.round(n * 100) / 100;

/**
 * One marker as SVG text, centred on (x, y) in the map's units. `r` is its radius in px and `unit` the map units one px is.
 * A place of the past is a diamond (a square turned a quarter, a little bigger so that it weighs the same as the circle).
 */
export function markSvg(place, x, y, { r = 5, unit = 1, selected = false } = {}) {
  const R = r * unit;
  const body = place.status === "past"
    ? `<path class="am-body" d="M${num(x)} ${num(y - 1.3 * R)}L${num(x + 1.3 * R)} ${num(y)}L${num(x)} ${num(y + 1.3 * R)}L${num(x - 1.3 * R)} ${num(y)}Z"/>`
    : `<circle class="am-body" cx="${num(x)}" cy="${num(y)}" r="${num(R)}"/>`;
  const dot = place.sport === "soccer" ? `<circle class="am-dot" cx="${num(x)}" cy="${num(y)}" r="${num(R * 0.32)}"/>` : place.sport === "budo" ? `<rect class="am-dot" x="${num(x - R * 0.3)}" y="${num(y - R * 0.3)}" width="${num(R * 0.6)}" height="${num(R * 0.6)}"/>` : "";
  const halo = selected ? `<circle class="am-halo" cx="${num(x)}" cy="${num(y)}" r="${num(R * 2)}"/>` : "";
  return `<g class="atlas-mark am-${place.sport} am-${place.status}${selected ? " am-selected" : ""}" data-id="${place.id}">${halo}${body}${dot}</g>`;
}

/** The marker alone as a small image, for a list or a legend. */
export function markIcon(place, size = 16) {
  return `<svg class="atlas-icon" width="${size}" height="${size}" viewBox="-8 -8 16 16" aria-hidden="true" focusable="false">${markSvg(place, 0, 0, { r: 5 })}</svg>`;
}
