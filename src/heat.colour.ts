// The colour ramps of the heat maps: a few built-in ramps with a light set and a dark set, a ramp run through steps, and a value mapped to a step. The
// ramps were chosen by luminance, so that they read in order without their colour (see heat.colour.test.ts, which checks the contrast of each against the
// ground the layer paints), and they are written here as plain numbers: no palette of any plotting package is copied.
import { safeColour } from "./colour.ts";
import { rampColour } from "./layers.marks.ts";

/** The built-in ramps. The sequential ones go from the least to the most; the diverging ones from the lowest through a neutral middle to the highest. */
export type HeatRampName = "ember" | "ocean" | "mono" | "balance" | "tide";

/** A built-in ramp: nine stops for a light page and nine for a dark one. */
export interface HeatRampDef {
  kind: "sequential" | "diverging";
  light: readonly string[];
  dark: readonly string[];
}

const split = (text: string): string[] => text.split(" ");

/**
 * The built-in ramps. On a light page a sequential ramp runs from a pale colour to a dark one, because the more there is the more ink it takes;
 * on a dark page it runs from near the ground to a bright one, because the more there is the more light it gives. A diverging ramp has its neutral
 * middle at the ground's colour and its two ends at full strength.
 */
export const HEAT_RAMPS: Readonly<Record<HeatRampName, HeatRampDef>> = Object.freeze({
  ember: { kind: "sequential", light: split("#fff3c4 #fddc8a #fbb860 #f58f42 #d9561f #bf3a1f #8f1f1c #5e1219 #3a0b14"), dark: split("#2a1d24 #52263a #82304a #ac3f4a #cf573a #e97a2e #f79e2c #fcc84a #fff08a") },
  ocean: { kind: "sequential", light: split("#e6f3fa #bfe0f0 #8fc6e3 #5fa8d3 #3478b0 #25689f #174c80 #0e3460 #08213f"), dark: split("#14222e #1b3d58 #1f5a82 #2677a8 #3396c8 #5db3dd #8accee #bfe6f8 #eaf8ff") },
  mono: { kind: "sequential", light: split("#f1f1ee #d9d9d4 #bfbfb8 #a4a49c #7e7e76 #6d6d66 #53534d #3a3a36 #22221f"), dark: split("#1f221f #3a3e3a #555a54 #70756e #8d928a #a9ada5 #c3c6bf #dcded8 #f5f6f2") },
  balance: { kind: "diverging", light: split("#0f3f7a #2a6ab0 #5f9bd3 #a9cdea #f2f0eb #f3c9a0 #e69a5b #b85a22 #84340c"), dark: split("#8cc4ff #5a9fe6 #3a78bd #264f80 #1d2220 #6a4326 #a8642f #e08a42 #ffb66e") },
  tide: { kind: "diverging", light: split("#4a1d6e #7b4aa3 #a98bc8 #d3c4e3 #f1f0ec #c3e1cb #86c397 #2a8a52 #0f5f33"), dark: split("#cfa8f0 #a47bd1 #7a53a8 #4d3170 #1d2220 #1f4a30 #2f7d4c #52b277 #8fe0aa") },
});

/** Names of the built-in ramps. */
export const HEAT_RAMP_NAMES = Object.freeze(Object.keys(HEAT_RAMPS) as HeatRampName[]);

/**
 * A ramp for a layer: the name of a built-in one, a list of colour stops (the same on a light and a dark page), or a `light` and a `dark` list.
 * Stops are anything `safeColour` accepts.
 */
export type HeatRamp = HeatRampName | readonly string[] | { light: readonly string[]; dark?: readonly string[] };

/** A ramp, resolved: the stops for a light page, and for a dark one when it differs. */
export interface ResolvedRamp {
  name: HeatRampName | undefined;
  kind: "sequential" | "diverging";
  light: string[];
  dark: string[] | undefined;
}

const clean = (stops: readonly string[] | undefined, what: string): string[] | undefined => {
  if (stops === undefined) return undefined;
  if (!Array.isArray(stops)) throw new TypeError(`${what} is a list of colours`);
  const out = stops.map((stop) => safeColour(stop)).filter((stop): stop is string => stop !== undefined);
  if (out.length === 0) throw new RangeError(`${what} has no colour that can be drawn`);
  return out;
};

/** The ramp a layer asks for; `ember` when it asks for none (`fallback` for a diverging statistic). */
export function resolveRamp(ramp: HeatRamp | undefined, fallback: HeatRampName = "ember"): ResolvedRamp {
  const given = ramp ?? fallback;
  if (typeof given === "string") {
    if (!Object.prototype.hasOwnProperty.call(HEAT_RAMPS, given)) throw new RangeError(`Unknown ramp "${given}": use ${HEAT_RAMP_NAMES.join(", ")}, or a list of colours`);
    const def = HEAT_RAMPS[given];
    return { name: given, kind: def.kind, light: [...def.light], dark: [...def.dark] };
  }
  if (Array.isArray(given)) return { name: undefined, kind: "sequential", light: clean(given, "ramp") as string[], dark: undefined };
  const object = given as { light: readonly string[]; dark?: readonly string[] };
  return { name: undefined, kind: "sequential", light: clean(object.light, "ramp.light") as string[], dark: clean(object.dark, "ramp.dark") };
}

/** The colour of step `k` of `steps` (0 to `steps - 1`) of some stops, as a hex colour (or the nearest stop for a colour that cannot be read without a browser). */
export function stepColour(stops: readonly string[], k: number, steps: number): string {
  return rampColour(stops, steps <= 1 ? 1 : k / (steps - 1)) ?? stops[0];
}

/** The step (0 to `steps - 1`) a value falls in, on a domain: the share of the way through it, to the nearest step. */
export function stepOf(value: number, domain: readonly [number, number], steps: number): number {
  const [a, b] = domain;
  const t = b === a ? 0.5 : (value - a) / (b - a);
  return Math.max(0, Math.min(steps - 1, Math.round(t * (steps - 1))));
}
