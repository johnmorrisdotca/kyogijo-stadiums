import { describe, expect, it } from "vitest";
import { luminance, rgbOf } from "./colour.ts";
import { HEAT_RAMPS, HEAT_RAMP_NAMES, resolveRamp, stepOf } from "./heat.colour.ts";
import { KYOGIJO_BASE_STYLE as CORE, KYOGIJO_HEAT_STYLE as HEAT } from "./style.ts";

type Rgb = [number, number, number];
const contrast = (a: Rgb, b: Rgb): number => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const rgb = (text: string): Rgb => {
  const out = rgbOf(text);
  if (out === undefined) throw new Error(`cannot read ${text}`);
  return out;
};
const over = (top: Rgb, alpha: number, under: Rgb): Rgb => [0, 1, 2].map((i) => top[i] * alpha + under[i] * (1 - alpha)) as Rgb;

/** The surface colour of each sport and the ground colour of the heat layers, read out of the stylesheet itself, so that this test cannot drift from it. */
function palette(theme: "light" | "dark"): { ground: { rgb: Rgb; alpha: number }; surfaces: Record<string, Rgb> } {
  const darkAt = CORE.indexOf("@media (prefers-color-scheme:dark)");
  const css = theme === "light" ? CORE.slice(0, darkAt) : CORE.slice(darkAt, CORE.indexOf("html[data-theme=dark] .kyogijo,"));
  const heat = theme === "light" ? HEAT.slice(0, HEAT.indexOf("@media")) : HEAT.slice(HEAT.indexOf("@media"));
  const first = (text: string, name: string): string | undefined => new RegExp(`--${name}:([^;}]+)`).exec(text)?.[1];
  const base = first(css, "ky-surface");
  const surfaces: Record<string, Rgb> = { nfl: rgb(base as string) };
  for (const sport of ["nhl", "nba", "mlb", "soccer"]) {
    const rule = new RegExp(`\\[data-sport=${sport}\\][^{]*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
    surfaces[sport] = rgb(first(rule, "ky-surface") ?? (base as string));
  }
  const g = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(first(heat, "ky-heat-ground") as string) as RegExpExecArray;
  return { ground: { rgb: [Number(g[1]), Number(g[2]), Number(g[3])], alpha: Number(g[4]) }, surfaces };
}

describe("the built-in ramps", () => {
  it("are nine stops of colours that can be read, light and dark", () => {
    expect(HEAT_RAMP_NAMES).toEqual(["ember", "ocean", "mono", "balance", "tide"]);
    for (const name of HEAT_RAMP_NAMES) {
      expect(HEAT_RAMPS[name].light).toHaveLength(9);
      expect(HEAT_RAMPS[name].dark).toHaveLength(9);
      for (const stop of [...HEAT_RAMPS[name].light, ...HEAT_RAMPS[name].dark]) expect(rgbOf(stop), `${name} ${stop}`).toBeDefined();
    }
  });

  for (const theme of ["light", "dark"] as const) {
    const { ground, surfaces } = palette(theme);
    // What a stop is read against: the surface with the layer's ground laid over it, for each sport's surface.
    const grounds = Object.entries(surfaces).map(([sport, surface]) => [sport, over(ground.rgb, ground.alpha, surface)] as const);
    const worst = (stop: string): number => Math.min(...grounds.map(([, g]) => contrast(rgb(stop), g)));

    describe(`on a ${theme} page`, () => {
      for (const name of HEAT_RAMP_NAMES) {
        const def = HEAT_RAMPS[name];
        const stops = def[theme];
        it(`${name}: steps go the right way in luminance, each distinct from the last`, () => {
          const lum = stops.map((s) => luminance(rgb(s)));
          if (def.kind === "sequential") {
            // Light pages: the more, the darker. Dark pages: the more, the lighter.
            for (let i = 1; i < lum.length; i += 1) expect(theme === "light" ? lum[i] < lum[i - 1] : lum[i] > lum[i - 1], `${name} ${theme} step ${i}`).toBe(true);
          } else {
            // Diverging: the middle is the ground's own colour and each side moves away from it, to full strength at the ends.
            const mid = 4;
            for (let i = 1; i <= mid; i += 1) expect(Math.abs(lum[i - 1] - lum[mid])).toBeGreaterThan(Math.abs(lum[i] - lum[mid]));
            for (let i = mid + 1; i < lum.length; i += 1) expect(Math.abs(lum[i] - lum[mid])).toBeGreaterThan(Math.abs(lum[i - 1] - lum[mid]));
          }
          for (let i = 1; i < stops.length; i += 1) expect(contrast(rgb(stops[i]), rgb(stops[i - 1])), `${name} ${theme} ${i}`).toBeGreaterThanOrEqual(1.15);
        });
        it(`${name}: the strong end reads against every sport's surface under the ground (3:1 or more)`, () => {
          const strong = def.kind === "sequential" ? [5, 6, 7, 8] : [0, 1, 7, 8];
          for (const i of strong) expect(worst(stops[i]), `${name} ${theme} stop ${i}`).toBeGreaterThanOrEqual(3);
        });
        if (def.kind === "sequential") {
          it(`${name}: the middle reads at 2:1 and the weakest used step is a tint of the ground, not an invisible one`, () => {
            expect(worst(stops[4])).toBeGreaterThanOrEqual(2);
            // The ramp's first fifth is not used (FLOOR), so the faintest step drawn is stop 2 of 9.
            expect(worst(stops[2])).toBeGreaterThanOrEqual(1.15);
          });
        } else {
          it(`${name}: the neutral middle is the ground's colour, so that no difference draws nothing loud`, () => {
            expect(worst(stops[4])).toBeLessThan(1.4);
          });
        }
      }
    });
  }
});

describe("resolving a ramp", () => {
  it("takes a name, a list of stops, or a light and a dark list", () => {
    expect(resolveRamp("ocean").light).toEqual([...HEAT_RAMPS.ocean.light]);
    expect(resolveRamp(undefined).name).toBe("ember");
    expect(resolveRamp(undefined, "balance").kind).toBe("diverging");
    expect(resolveRamp(["#fff", "#000"])).toEqual({ name: undefined, kind: "sequential", light: ["#fff", "#000"], dark: undefined });
    expect(resolveRamp({ light: ["#eee", "#111"], dark: ["#111", "#eee"] }).dark).toEqual(["#111", "#eee"]);
  });
  it("drops stops that are not colours and refuses a ramp left with none, and an unknown name", () => {
    expect(resolveRamp(["#fff", "red;fill:url(x)", "#000"]).light).toEqual(["#fff", "#000"]);
    expect(() => resolveRamp(["nope;"])).toThrow(/no colour/);
    expect(() => resolveRamp("sunset" as never)).toThrow(/Unknown ramp "sunset"/);
  });
  it("maps a value to a step on a domain, to the nearest, held to the ends", () => {
    expect(stepOf(0, [0, 10], 9)).toBe(0);
    expect(stepOf(10, [0, 10], 9)).toBe(8);
    expect(stepOf(5, [0, 10], 9)).toBe(4);
    expect(stepOf(-3, [0, 10], 9)).toBe(0);
    expect(stepOf(99, [0, 10], 9)).toBe(8);
    expect(stepOf(4, [4, 4], 9)).toBe(4);
  });
});
