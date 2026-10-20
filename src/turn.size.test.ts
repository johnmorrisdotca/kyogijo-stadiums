// A turning surface keeps its size: while the view goes once round the vertical, the floor's projected area stays the same (a flat rectangle seen at a fixed tip has the same area at every turn, up to
// the little the perspective adds), and it changes smoothly, in no step. Measured the way a browser draws it, from the `matrix3d` text written to the floor, not from the camera's own numbers: it used to
// swell and shrink rhythmically, in jumps, because the perspective terms of that text were rounded to four decimals (they are a few ten-thousandths) and the lens was short.
import { describe, expect, it } from "vitest";
import { SPORTS } from "./index.ts";
import { buildMultiTurn } from "./multi-entry.ts";
import { MULTI_PRESET_IDS } from "./multi.data.ts";
import { PITCH_MAX, buildTurn, layoutOf, presetsFor, type TurnModel } from "./turn-entry.ts";
import type { SurfaceOptions } from "./types.ts";

/** How much the floor's area may differ between the largest and the smallest over a whole turn. A short lens (1.7) gave a quarter. */
const TURN_TOLERANCE = 1.02;
/** How much it may differ between two views three degrees apart. */
const STEP_TOLERANCE = 1.004;
const CONTAINERS: readonly (readonly [number, number])[] = [[1280, 900], [390, 700]];

/** The `matrix3d(...)` text of an element as sixteen numbers. */
const parse = (transform: string): number[] => transform.slice("matrix3d(".length, -1).split(",").map(Number);
const shoelace = (points: readonly (readonly number[])[]): number => Math.abs(points.reduce((sum, p, i) => sum + p[0] * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * p[1], 0)) / 2;

/** The areas of the floor on the screen, a view every `by` degrees round the whole circle, as the browser would draw the written matrix. */
function areas(model: TurnModel, pitch: number, [w, h]: readonly [number, number], by: number): number[] {
  const width = model.viewBox.w * model.scale;
  const height = model.viewBox.h * model.scale;
  const out: number[] = [];
  for (let yaw = 0; yaw < 360; yaw += by) {
    const m = parse(layoutOf(model, { yaw, pitch, zoom: 1 }, w, h).transforms[0]);
    out.push(shoelace([[0, 0], [width, 0], [width, height], [0, height]].map(([x, y]) => {
      const q = m[3] * x + m[7] * y + m[15];
      return [(m[0] * x + m[4] * y + m[12]) / q, (m[1] * x + m[5] * y + m[13]) / q];
    })));
  }
  return out;
}

const spread = (list: readonly number[]): number => Math.max(...list) / Math.min(...list);
/** The largest ratio between neighbours, the circle closed. */
const jump = (list: readonly number[]): number => Math.max(...list.map((a, i) => Math.max(a, list[(i + 1) % list.length]) / Math.min(a, list[(i + 1) % list.length])));

/** Every sport's surface (the whole floor, the stands and walls raised where it has them), and every tournament layout in 3D (its surfaces, surrounds and scoreboards standing on the floor, and with the stadium round it). */
const MODELS: readonly (readonly [string, TurnModel])[] = [
  ...SPORTS.flatMap((sport): [string, TurnModel][] => [
    [sport, buildTurn({ sport }, {})],
    [`${sport} with a crowd`, buildTurn({ sport, crowd: true } as SurfaceOptions, {})],
  ]),
  ...MULTI_PRESET_IDS.flatMap((preset): [string, TurnModel][] => [[`layout ${preset}`, buildMultiTurn({ preset })], [`layout ${preset} in a stadium`, buildMultiTurn({ preset, stadium: true })]]),
];

describe("a turning surface keeps its size", () => {
  it("has one area at every turn, for every sport and surface, at every tip, in desk and phone boxes", () => {
    for (const [name, model] of MODELS) {
      const sport = (model.options as SurfaceOptions).sport;
      const pitches = [...new Set([...Object.values(presetsFor(model.presets ?? sport)).map((view) => view.pitch), 45, PITCH_MAX])].filter((pitch) => pitch > 0);
      for (const container of CONTAINERS) for (const pitch of pitches) {
        expect(spread(areas(model, pitch, container, 10)), `${name} ${container.join("x")} pitch ${pitch}`).toBeLessThan(TURN_TOLERANCE);
      }
    }
  });

  it("changes smoothly: no step between two views three degrees apart", () => {
    for (const [name, model] of MODELS.filter(([label]) => !label.endsWith("crowd") && !label.endsWith("stadium"))) {
      for (const container of CONTAINERS) for (const pitch of [62, PITCH_MAX]) {
        expect(jump(areas(model, pitch, container, 3)), `${name} ${container.join("x")} pitch ${pitch}`).toBeLessThan(STEP_TOLERANCE);
      }
    }
  });

  it("is the same area overhead, where a turn is only an angle", () => {
    for (const [name, model] of MODELS.slice(0, 12)) expect(spread(areas(model, 0, [960, 600], 10)), name).toBeLessThan(1.0005);
  });
});
