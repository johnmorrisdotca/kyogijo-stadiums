// The parts of a drawing that only some drawings use, held apart so that a page that never asks for them does not carry them. `drawKyogijo` asks for a part when the options need it (the `layers` option needs the layers) and reads it from
// this table, which `full.ts` fills: every entry but the lean district imports that file, so every entry has every part, as it always had. The lean district (`district-lean`) leaves the table empty, and a drawing that asks for a
// part it does not hold throws and says which part and how to have it. Type imports only: nothing here loads a part.
import type { renderLayers } from "./layers.ts";

/** The parts there are, by name, each with the function the drawing calls. */
export interface DrawParts {
  /** The data laid over a surface (`options.layers`): shots, heat maps, tracks, lineups, legends. */
  layers: typeof renderLayers;
}

const held: Partial<DrawParts> = {};

/** Hold a part for the drawing: what `full.ts` does for each part there is. */
export function providePart<K extends keyof DrawParts>(name: K, feature: DrawParts[K]): void {
  held[name] = feature;
}

/** Whether a part is held. */
export const hasPart = (name: keyof DrawParts): boolean => held[name] !== undefined;

/** A part, for a drawing whose options ask for it (`asked` names the option); throws, saying how to have it, where it is not held. */
export function partOf<K extends keyof DrawParts>(name: K, asked: string): DrawParts[K] {
  const found = held[name];
  if (found === undefined) throw new Error(`${asked} needs the ${name} part of the drawing, which this entry does not carry: use an entry that has every part (the main entry, or any but the lean district's), or import "@johnmorrisdotca/kyogijo-stadiums/full" first`);
  return found as DrawParts[K];
}
