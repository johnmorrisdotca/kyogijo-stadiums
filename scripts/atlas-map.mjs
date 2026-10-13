// The static map of every place (docs/atlas-map.svg, site/atlas-map.svg): the world drawn by chizu, a marker on every
// place, and a key. `pnpm site` writes it; a test holds the copy in docs/ to what this makes. It takes the places and chizu's
// functions as arguments so that the test (from src/) and the build (from dist/) can each give their own.
import { ATLAS_MARK_STYLE, markSvg } from "../demo/atlas-marks.js";

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/**
 * @param {{ places: readonly { id: string; sport: string; status: string; lat: number; lon: number; name: string }[]; world: object; drawChizu: Function; projectPoint: Function }} input
 * @returns {string} an SVG document
 */
export function atlasMapSvg({ places, world, drawChizu, projectPoint }) {
  const drawn = drawChizu(world, { style: true, language: "en" });
  const marks = places
    .map((place) => [place, projectPoint(world, place.lon, place.lat)])
    .filter(([, at]) => at !== null)
    // Soccer's under baseball's, and the past under the present, so that what is in use today is always on top.
    .sort(([a], [b]) => (a.status === b.status ? (a.sport === b.sport ? 0 : a.sport === "soccer" ? -1 : 1) : a.status === "past" ? -1 : 1))
    .map(([place, [x, y]]) => markSvg(place, x, y, { r: 4.2, unit: 1 }))
    .join("");
  const counts = (status, sport) => places.filter((p) => p.status === status && p.sport === sport).length;
  const key = [
    [{ sport: "baseball", status: "current" }, `Baseball park, today (${counts("current", "baseball")})`],
    [{ sport: "baseball", status: "past" }, `Baseball park, of the past (${counts("past", "baseball")})`],
    [{ sport: "soccer", status: "current" }, `Soccer ground, today (${counts("current", "soccer")})`],
    [{ sport: "soccer", status: "past" }, `Soccer ground, of the past (${counts("past", "soccer")})`],
  ];
  const rows = key.map(([place, text], i) => `${markSvg({ id: "", ...place }, 18, 462 - (key.length - 1 - i) * 14, { r: 4.2 })}<text x="30" y="${465.6 - (key.length - 1 - i) * 14}">${text}</text>`).join("");
  const legend = `<g class="atlas-key"><rect x="6" y="${462 - (key.length - 1) * 14 - 12}" width="212" height="${(key.length - 1) * 14 + 22}" rx="4"/>${rows}</g>`;
  const style = `${ATLAS_MARK_STYLE}
.atlas-key rect { fill: var(--cz-sea); opacity: .92; stroke: var(--cz-line); stroke-width: .5px; }
.atlas-key text { fill: var(--cz-ink); font: 9px ${FONT}; }`;
  const title = `<title>A map of ${places.length} ballparks and soccer grounds</title><desc>The world with a marker on each of ${places.length} places: a circle for a place in use today and a diamond for one of the past, baseball parks solid and soccer grounds with a dot in the middle.</desc>`;
  // Chizu's SVG is one element: the title and the markers go inside it, at its end.
  const open = drawn.indexOf(">") + 1;
  const head = drawn.slice(0, open).replace(/ aria-label="[^"]*"/, ` aria-label="A map of ${places.length} ballparks and soccer grounds"`);
  return `${head}${title}<style>${style}</style>${drawn.slice(open, drawn.lastIndexOf("</svg>"))}<g class="atlas-marks">${marks}</g>${legend}</svg>\n`;
}
