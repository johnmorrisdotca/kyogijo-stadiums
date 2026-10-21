// The lighting of a venue. `night` is the first preset: the house goes down, the playing surface stays lit, small lights show along the aisles and stairs, the ribbon boards and the scoreboard glow and the exits and the concourse rim are
// softly lit. It is made of what the venue already has: the colours are custom properties a stylesheet sets on the 3D view's root (`data-lighting="night"`, see turn.style.ts) and on the plan's crowd (`ky-night`), a veil over each
// plane of seats, a pool of light on the floor round the surface and a halo under each lit board panel; nothing is worked out again as the view turns. Later presets (a show's colours and chases) are added to the same option.
// Pure: data in, planes out.
import { flat, n, type Plane } from "./turn.kit.ts";
import type { LightingOptions, LightingPreset } from "./types.ts";

export const LIGHTING_PRESETS: readonly LightingPreset[] = ["night"];

/** The lighting an option asks for: a named preset, `true` for the first (night), `{ preset }`, or `undefined` for none (false, nothing, an unknown name). */
export function resolveLighting(ask: LightingOptions | undefined | null): LightingPreset | undefined {
  if (ask === undefined || ask === null || ask === false) return undefined;
  if (ask === true) return "night";
  const name = typeof ask === "string" ? ask : ask.preset ?? "night";
  return LIGHTING_PRESETS.includes(name) ? name : undefined;
}

/** How far the pool of light round the surface reaches beyond its box, in feet, and the share of the pool that is bright (the surface's own edge). The surface itself stays as drawn: the pool is brightest just outside its markings. */
export const POOL = { reach: 20, edge: 0.7, strength: 0.34 } as const;

/** The pool of light on the floor round the playing surface: a flat plane under the seats with a radial gradient that is clear over the middle (the markings stay as they are) and glows round its edge. */
export function lightPool(id: string, box: { x: number; y: number; w: number; h: number }, z: number): Plane {
  const [w, h] = [box.w + 2 * POOL.reach, box.h + 2 * POOL.reach];
  const gid = `${id}-g`;
  const svg =
    `<defs><radialGradient id="${gid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4dc" stop-opacity="0"/><stop offset="${POOL.edge - 0.12}" stop-color="#fff4dc" stop-opacity="0"/>` +
    `<stop offset="${POOL.edge}" stop-color="#fff4dc" stop-opacity="${POOL.strength}"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/></radialGradient></defs>` +
    `<rect class="u-pool" width="${n(w)}" height="${n(h)}" fill="url(#${gid})"/>`;
  return flat(id, "apron", box.x - POOL.reach, box.y - POOL.reach, box.x + box.w + POOL.reach, box.y + box.h + POOL.reach, z, svg);
}
