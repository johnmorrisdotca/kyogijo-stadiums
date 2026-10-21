// The lighting the demo's choices say, for the `lighting` option: a preset (off, night, game, lightsDown, intro, concert) and a wash colour over the preset's own. The intro is shown with sample team colours (a red and a blue that are
// nobody's), so that the teams' colours in the wash and the beams can be seen; with a score that has teams' colours the package takes those. Beams under Lights down take a colour that goes with a wash chosen, as in a show's pairs.
export const LIGHTINGS = ["off", "night", "game", "lightsDown", "intro", "concert"];
export const WASHES = ["none", "purple", "magenta", "blue", "white"];
const PAIRS = { purple: "amber", magenta: "blue", blue: "white", white: "white" };
const SAMPLE_TEAMS = ["#d6402c", "#2d6fd1"];

/** The `lighting` option for a preset and a wash: `false` for none. `wash: "none"` is the preset's own. */
export function lightingFor({ lighting, wash }) {
  if (!LIGHTINGS.includes(lighting) || lighting === "off") return false;
  const colour = WASHES.includes(wash) && wash !== "none" ? wash : undefined;
  const options = { preset: lighting, ...(lighting === "intro" ? { colors: SAMPLE_TEAMS } : {}), ...(colour === undefined ? {} : { wash: colour, ...(lighting === "lightsDown" ? { aisles: PAIRS[colour] } : {}) }) };
  return Object.keys(options).length === 1 ? lighting : options;
}

/** The lighting an address says, under a prefix: `lighting=intro`, or an old address's `night=1` and `lights=1`. */
export function lightingOfAddress(params, prefix = "") {
  const named = params.get(`${prefix}lighting`);
  if (LIGHTINGS.includes(named)) return named;
  if (params.get(`${prefix}lights`) === "1") return "lightsDown";
  return params.get(`${prefix}night`) === "1" ? "night" : "off";
}
