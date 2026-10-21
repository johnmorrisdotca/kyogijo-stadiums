// The lighting of a venue. `night` is the first preset: the house goes down, the playing surface stays lit, small lights show along the aisles and stairs, the ribbon boards and the scoreboard glow and the exits and the concourse rim are
// softly lit. It is made of what the venue already has: the colours are custom properties a stylesheet sets on the 3D view's root (`data-lighting="night"`, see turn.style.ts) and on the plan's crowd (`ky-night`), a veil over each
// plane of seats, a pool of light on the floor round the surface and a halo under each lit board panel; nothing is worked out again as the view turns. Later presets (a show's colours and chases) are added to the same option.
// Pure: data in, planes out.
import { flat, n, type Plane } from "./turn.kit.ts";
import { safeColor } from "./venue.boards.ts";
import type { LightingOptions, LightingPreset } from "./types.ts";

/** The named colours of light: `wash`, `aisles` and `colors` take these by name (ours, a little saturated, for a light seen on dark). */
export const LIGHT_COLORS = { white: "#fff6e6", amber: "#ffb830", purple: "#9b4dff", magenta: "#ff2bd6", blue: "#2b7bff", cyan: "#27d6ff" } as const;

/** How dark the house is: `half` (a light veil, the game's), `dim` (the night's) or `dark` (a show's). */
export type House = "half" | "dim" | "dark";

/**
 * A named lighting. `house` is how dark the stands are; `aisles` how the aisles are lit (`none`, small `dots`, or a `beam` of light from above down each); `pool` whether a pool of light lies on the floor round the surface; `wash` and `beam` are the colours
 * of the light on the surface and of the beams: a colour (a name of `LIGHT_COLORS`), or `home` and `away`, the teams' colours where the options have them (`crowd.home` and `crowd.away`, the colours of a score's teams), else `fallback`'s.
 */
export interface LightPreset {
  house: House;
  aisles: "none" | "dots" | "beams";
  pool: boolean;
  wash?: keyof typeof LIGHT_COLORS | "home" | "away";
  beam?: keyof typeof LIGHT_COLORS | "home" | "away";
  /** What `home` and `away` are where the options name no team colour. */
  fallback?: { home: keyof typeof LIGHT_COLORS; away: keyof typeof LIGHT_COLORS };
}

/**
 * The named lightings. `night`: the calm dim house with small lights along the aisles. `game`: white light, the house half lit, a pool of light round the surface. `lightsDown`: the house nearly black, a white beam down each aisle. `intro`: the
 * house dark, the home team's colour washed over the surface and the visitors' (the second colour) in the beams. `concert`: warm amber beams and a purple surface. (The `celebration` of the plan, colours chasing round the bowl, is a later one.)
 */
export const LIGHT_PRESETS: Readonly<Record<LightingPreset, LightPreset>> = {
  night: { house: "dim", aisles: "dots", pool: true },
  game: { house: "half", aisles: "none", pool: true },
  lightsDown: { house: "dark", aisles: "beams", pool: false },
  intro: { house: "dark", aisles: "beams", pool: false, wash: "home", beam: "away", fallback: { home: "blue", away: "amber" } },
  concert: { house: "dark", aisles: "beams", pool: false, wash: "purple", beam: "amber" },
};
export const LIGHTING_PRESETS = Object.keys(LIGHT_PRESETS) as readonly LightingPreset[];

/** The lighting as asked, with every part's value. */
export interface Lighting {
  preset: LightingPreset;
  house: House;
  aisles: "none" | "dots" | "beams";
  pool: boolean;
  /** The colour of the beams. */
  beam: string;
  /** The surface's colour of light (none for the surface as it is). */
  wash: string | undefined;
}

const colorOf = (value: unknown): string | undefined => (typeof value === "string" && Object.hasOwn(LIGHT_COLORS, value) ? LIGHT_COLORS[value as keyof typeof LIGHT_COLORS] : safeColor(value));

/** The teams' colours the options have: a score's teams' `color`, over which a crowd's `home` and `away` stand. */
export function teamColors(o: object, crowd?: { home?: string; away?: string }): { home?: string; away?: string } {
  const teams = o as { home?: { color?: unknown }; away?: { color?: unknown } };
  return { home: safeColor(crowd?.home) ?? safeColor(teams.home?.color), away: safeColor(crowd?.away) ?? safeColor(teams.away?.color) };
}

/**
 * The lighting an option asks for: a preset's name, `true` for the first (night), or `{ preset, colors, aisles, wash }`, or `undefined` for none (false, nothing, an unknown name). A colour comes from, in order: `wash` or `aisles`, `colors` (the first
 * is what the preset's `home` is, the second its `away`), the teams' colours (`team`), the preset's own.
 */
export function resolveLighting(ask: LightingOptions | undefined | null, team: { home?: string; away?: string } = {}): Lighting | undefined {
  if (ask === undefined || ask === null || ask === false) return undefined;
  const o = typeof ask === "object" ? ask : {};
  const name = typeof ask === "string" ? ask : ask === true ? "night" : o.preset ?? "night";
  if (!LIGHTING_PRESETS.includes(name as LightingPreset)) return undefined;
  const preset = name as LightingPreset;
  const base = LIGHT_PRESETS[preset];
  const given = (Array.isArray(o.colors) ? o.colors : []).map(colorOf).filter((c): c is string => c !== undefined);
  const side = (which: "home" | "away"): string => (which === "home" ? given[0] ?? team.home : given[1] ?? team.away) ?? LIGHT_COLORS[base.fallback?.[which] ?? (which === "home" ? "blue" : "amber")];
  const pick = (token: LightPreset["wash"]): string | undefined => (token === undefined ? undefined : token === "home" || token === "away" ? side(token) : LIGHT_COLORS[token]);
  return { preset, house: base.house, aisles: base.aisles, pool: base.pool, beam: colorOf(o.aisles) ?? pick(base.beam) ?? LIGHT_COLORS.white, wash: colorOf(o.wash) ?? pick(base.wash) };
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
