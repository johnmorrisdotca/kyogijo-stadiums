// The lighting the demo's switches say, for the `lighting` option: Night, Lights down and a wash. Lights down wins over Night (the two buttons turn each other off). The beams take a colour that goes with the wash, as in a show's pairs of colours.
export const WASHES = ["none", "purple", "magenta", "blue", "white"];
const AISLES = { none: "white", purple: "amber", magenta: "blue", blue: "white", white: "white" };

/** The `lighting` option for the switches (`night`, `lights`, `wash`): `false` for none. */
export function lightingFor({ night, lights, wash }) {
  const preset = lights ? "lightsDown" : night ? "night" : undefined;
  if (preset === undefined) return false;
  const colour = WASHES.includes(wash) ? wash : "none";
  return colour === "none" ? preset : { preset, wash: colour, ...(preset === "lightsDown" ? { aisles: AISLES[colour] } : {}) };
}
