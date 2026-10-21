// The lighting of a venue. `night` is the first preset: the house goes down, the playing surface stays lit, small lights show along the aisles and stairs, the ribbon boards and the scoreboard glow and the exits and the concourse rim are
// softly lit. It is made of what the venue already has: the colours are custom properties a stylesheet sets on the 3D view's root (`data-lighting="night"`, see turn.style.ts) and on the plan's crowd (`ky-night`), a veil over each
// plane of seats, a pool of light on the floor round the surface and a halo under each lit board panel; nothing is worked out again as the view turns. Later presets (a show's colours and chases) are added to the same option.
// Pure: data in, planes out.
import { flat, n, type Plane } from "./turn.kit.ts";
import { safeColor } from "./venue.boards.ts";
import type { LightingOptions, LightingPreset } from "./types.ts";

export const LIGHTING_PRESETS: readonly LightingPreset[] = ["night", "lightsDown"];

/** The named colours of light: `wash` and `aisles` take these by name (ours, a little saturated, for a light seen on dark). */
export const LIGHT_COLORS = { white: "#fff6e6", amber: "#ffb830", purple: "#9b4dff", magenta: "#ff2bd6", blue: "#2b7bff", cyan: "#27d6ff" } as const;

/** The lighting as asked, with every part's value. `aisles` is the colour of the beams and `wash` the surface's colour of light (none for the surface as it is). */
export interface Lighting {
  preset: LightingPreset;
  aisles: string;
  wash: string | undefined;
}

const colorOf = (value: unknown): string | undefined => (typeof value === "string" && Object.hasOwn(LIGHT_COLORS, value) ? LIGHT_COLORS[value as keyof typeof LIGHT_COLORS] : safeColor(value));

/** The lighting an option asks for: a named preset, `true` for the first (night), `{ preset, aisles, wash }`, or `undefined` for none (false, nothing, an unknown name). */
export function resolveLighting(ask: LightingOptions | undefined | null): Lighting | undefined {
  if (ask === undefined || ask === null || ask === false) return undefined;
  const o = typeof ask === "object" ? ask : {};
  const name = typeof ask === "string" ? ask : ask === true ? "night" : o.preset ?? "night";
  if (!LIGHTING_PRESETS.includes(name as LightingPreset)) return undefined;
  return { preset: name as LightingPreset, aisles: colorOf(o.aisles) ?? LIGHT_COLORS.white, wash: colorOf(o.wash) };
}

/** How far the pool of light round the surface reaches beyond its box, in feet, and the share of the pool that is bright (the surface's own edge). The surface itself stays as drawn: the pool is brightest just outside its markings. */
export const POOL = { reach: 20, edge: 0.7, strength: 0.34 } as const;

/** The pool of light on the floor round the playing surface: a flat plane under the seats with a radial gradient that is clear over the middle (the markings stay as they are) and glows round its edge. */
export function lightPool(id: string, box: { x: number; y: number; w: number; h: number }, z: number, color = "#fff4dc"): Plane {
  const [w, h] = [box.w + 2 * POOL.reach, box.h + 2 * POOL.reach];
  const gid = `${id}-g`;
  const svg =
    `<defs><radialGradient id="${gid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset="${POOL.edge - 0.12}" stop-color="${color}" stop-opacity="0"/>` +
    `<stop offset="${POOL.edge}" stop-color="${color}" stop-opacity="${POOL.strength}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect class="u-pool" width="${n(w)}" height="${n(h)}" fill="url(#${gid})"/>`;
  return flat(id, "apron", box.x - POOL.reach, box.y - POOL.reach, box.x + box.w + POOL.reach, box.y + box.h + POOL.reach, z, svg);
}

/** The beam of a stair aisle, lit from above: the aisle's line drawn three times, wide and faint, narrower, and a bright core, so that the light falls off over the steps either side; a vomitory (`wide`) is a broader beam. Two thin lines beside it are the rails. Feet along the plane. */
export const BEAM = { widths: [7, 3.8, 1.5], opacity: [0.1, 0.22, 0.95], rail: 2.3, railWidth: 0.35, railOpacity: 0.6, wide: 1.6 } as const;
export function beamSvg(from: readonly [number, number], to: readonly [number, number], color: string, cls: string, wide = false): string {
  const d = `M${n(from[0])} ${n(from[1])}L${n(to[0])} ${n(to[1])}`;
  const k = wide ? BEAM.wide : 1;
  const long = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const [nx, ny] = [-(to[1] - from[1]) / long, (to[0] - from[0]) / long];
  const off = BEAM.rail * k;
  const rail = (s: number): string => `M${n(from[0] + nx * off * s)} ${n(from[1] + ny * off * s)}L${n(to[0] + nx * off * s)} ${n(to[1] + ny * off * s)}`;
  const layers = BEAM.widths.map((w, i) => `<path class="${cls}" fill="none" stroke="${color}" stroke-opacity="${BEAM.opacity[i]}" stroke-width="${n(w * k)}" d="${d}"/>`).join("");
  return `${layers}<path class="${cls}" fill="none" stroke="${color}" stroke-opacity="${BEAM.railOpacity}" stroke-width="${BEAM.railWidth}" d="${rail(1)}${rail(-1)}"/>`;
}

/** The lit edge of a step: the front of a piece of a tier, from `from` to `to`, a thin bright line. */
export const edgeSvg = (from: readonly [number, number], to: readonly [number, number], color: string, cls: string): string => `<path class="${cls}" fill="none" stroke="${color}" stroke-opacity=".7" stroke-width=".4" d="M${n(from[0])} ${n(from[1])}L${n(to[0])} ${n(to[1])}"/>`;

/** The wash of light on the playing surface: a flat plane over the surface's box, a colour that is brighter over the middle and weaker at the edge, never so strong that the markings under it are lost (`WASH` says how much). */
export const WASH = { middle: 0.46, edge: 0.26 } as const;
export function lightWash(id: string, box: { x: number; y: number; w: number; h: number }, z: number, color: string, round = 0): Plane {
  const gid = `${id}-g`;
  const svg =
    `<defs><radialGradient id="${gid}" cx=".5" cy=".5" r=".72"><stop offset="0" stop-color="${color}" stop-opacity="${WASH.middle}"/><stop offset="1" stop-color="${color}" stop-opacity="${WASH.edge}"/></radialGradient></defs>` +
    `<rect class="u-wash" width="${n(box.w)}" height="${n(box.h)}" rx="${n(Math.min(round, box.w / 2, box.h / 2))}" fill="url(#${gid})"/>`;
  return flat(id, "apron", box.x, box.y, box.x + box.w, box.y + box.h, z, svg);
}
