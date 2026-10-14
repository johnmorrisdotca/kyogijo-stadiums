import { describe, expect, it } from "vitest";
import { SPORTS } from "./draw.ts";
import { KYOGIJO_LOOK_STYLE, LOOKS, LOOK_NAMES, LOOK_PAIRS, contrastOf, groupOf, lookPalette, lookStyle } from "./look.ts";

describe("the looks", () => {
  it("are eight, each with a light and a dark palette", () => {
    expect(LOOK_NAMES).toEqual(["grass", "night", "chalkboard", "blueprint", "print", "broadcast", "high-contrast", "line-drawing"]);
    for (const name of LOOK_NAMES) {
      expect(LOOKS[name].about.length, name).toBeGreaterThan(20);
      expect(Object.keys(LOOKS[name].light.base).length, name).toBeGreaterThan(15);
      expect(Object.keys(LOOKS[name].dark.base).length, name).toBeGreaterThan(15);
    }
  });

  it("read: every line is 3:1 against what it is painted on, in every look, mode and sport, and the words 4.5:1 against the apron", () => {
    const failures: string[] = [];
    for (const name of LOOK_NAMES) {
      for (const mode of ["light", "dark"] as const) {
        for (const sport of SPORTS) {
          const palette = lookPalette(name, mode, sport);
          const group = groupOf(sport);
          for (const [ink, ground, least] of [...LOOK_PAIRS.all, ...(group === undefined ? [] : LOOK_PAIRS[group])]) {
            const ratio = contrastOf(palette[ink], palette[ground]);
            if (ratio === undefined) failures.push(`${name} ${mode} ${sport}: ${ink} or ${ground} cannot be read`);
            else if (ratio < least) failures.push(`${name} ${mode} ${sport}: ${ink} ${palette[ink]} on ${ground} ${palette[ground]} is ${ratio.toFixed(2)}, below ${least}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("have a palette for a sport added later that is no worse than the base", () => {
    for (const name of LOOK_NAMES) for (const mode of ["light", "dark"] as const) expect(lookPalette(name, mode, "a-later-sport")).toEqual(LOOKS[name][mode].base);
  });

  it("write a stylesheet of custom properties at no weight, light, dark by the device and dark by the page", () => {
    for (const name of LOOK_NAMES) {
      const css = lookStyle(name);
      expect(css, name).toContain(`:where(.kyogijo[data-palette=${name}])`);
      expect(css, name).toContain("@media (prefers-color-scheme:dark)");
      expect(css, name).toContain(`:where(html[data-theme=dark] .kyogijo[data-palette=${name}],.kyogijo[data-theme=dark][data-palette=${name}])`);
      expect(css.replace(/\s/g, ""), name).not.toMatch(/\{[^}]*(?:fill|stroke):/);
    }
    expect(KYOGIJO_LOOK_STYLE.length).toBeGreaterThan(8000);
  });
});
