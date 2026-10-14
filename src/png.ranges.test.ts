// A drawing cropped to any named range of any sport, as a PNG. resvg (the PNG renderer) used to stop the whole process on a shape with an opacity below 1 that lies wholly outside the viewBox, as the net of a
// soccer pitch's goal does in a penalty-area range: `toPNG` now leaves such shapes out, and this test renders every named range of every sport and every league, wide and tall.
import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { cullOutside, isOutside, toPNG } from "./png.ts";
import { LEAGUES } from "./leagues.ts";
import { RANGES } from "./ranges.names.ts";
import { sceneOf } from "./scene.ts";
import type { Sport, SurfaceOptions } from "./types.ts";

const name = "@resvg/resvg-js";
const installed = await import(/* @vite-ignore */ name).then(
  () => true,
  () => false,
);

describe("a shape outside the frame", () => {
  it("is left out of the scene, and what is inside or touches the frame stays", () => {
    const scene = sceneOf(drawKyogijo({ sport: "soccer", range: "penalty-area" }));
    const culled = cullOutside(scene);
    // The goal's net beyond the penalty area is translucent and wholly outside the frame.
    const nets = scene.items.filter((i) => i.class.includes("ky-goal-net"));
    expect(nets.length).toBeGreaterThan(0);
    const out = nets.filter((i) => isOutside(i, scene.viewBox));
    expect(out.length).toBeGreaterThan(0);
    expect(culled.items.length).toBe(scene.items.length - scene.items.filter((i) => isOutside(i, scene.viewBox)).length);
    for (const item of culled.items) expect(isOutside(item, scene.viewBox)).toBe(false);
    // A drawing that is not cropped loses nothing.
    const whole = sceneOf(drawKyogijo({ sport: "soccer" }));
    expect(cullOutside(whole).items.length).toBe(whole.items.length);
  });
});

describe.skipIf(!installed)("every named range of every sport, as a PNG (skipped without @resvg/resvg-js)", () => {
  it("renders", async () => {
    let drawn = 0;
    const refused: string[] = [];
    for (const [sport, list] of Object.entries(RANGES) as [Sport, (typeof RANGES)[Sport]][]) {
      const leagues = ["", ...LEAGUES[sport].filter((l) => !l.builtIn).map((l) => l.id)];
      for (const info of list) {
        for (const league of leagues) {
          if (info.leagues !== undefined && !info.leagues.includes(league === "" ? LEAGUES[sport][0].id : league)) continue;
          for (const orientation of ["landscape", "portrait"] as const) {
            const options = { sport, range: info.id, orientation, ...(league === "" ? {} : { league }) } as SurfaceOptions;
            let svg: string;
            try {
              svg = drawKyogijo(options);
            } catch (error) {
              // The covered athletics track has no field events: a range it lacks is an error that says so.
              expect(error).toBeInstanceOf(RangeError);
              refused.push(`${sport} ${info.id} ${league}`);
              continue;
            }
            const png = await toPNG(svg, { width: 160, font: { loadSystemFonts: false } });
            expect([...png.slice(0, 4)], `${sport} ${info.id} ${league} ${orientation}`).toEqual([137, 80, 78, 71]);
            drawn += 1;
          }
        }
      }
    }
    expect(drawn).toBeGreaterThan(600);
    expect(new Set(refused.map((r) => r.split(" ").slice(0, 3).join(" ")))).toEqual(new Set(["athletics high-jump world-athletics-short", "athletics pole-vault world-athletics-short", "athletics long-jump world-athletics-short", "athletics triple-jump world-athletics-short", "athletics shot-put world-athletics-short", "athletics discus-throw world-athletics-short", "athletics hammer-throw world-athletics-short", "athletics javelin-throw world-athletics-short"]));
  }, 300000);
});
