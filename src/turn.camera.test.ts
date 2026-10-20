// The camera's fit is steady: turning the view about the vertical never changes the scale or the place the scene is fitted to, so the surface does not zoom in and out while it is dragged or turns
// by itself, and at no angle is any of it outside the container. (It used to fit each angle alone: a long floor was drawn up to 1.8 times as large side-on as end-on.)
import { describe, expect, it } from "vitest";
import { SPORTS } from "./index.ts";
import { buildMultiTurn } from "./multi-entry.ts";
import { MULTI_PRESET_IDS } from "./multi.data.ts";
import { PITCH_MAX, buildTurn, eyeDistance, fit, layoutOf, project } from "./turn-entry.ts";
import { covered, type Box3 } from "./turn.camera.ts";

const CONTAINERS: readonly (readonly [number, number])[] = [[960, 600], [390, 300], [500, 800]];
const PITCHES = [0, 15, 30, 45, 60, 70, PITCH_MAX];
const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);

/** The boxes of every sport's scene, of every tournament layout (with and without its stadium), and three that stand for their shapes: a long floor, a square one with a tall thing on it, and a strip. */
const BOXES: readonly (readonly [string, Box3])[] = [
  ...SPORTS.map((sport): [string, Box3] => [sport, buildTurn({ sport }, {}).box]),
  ...MULTI_PRESET_IDS.flatMap((preset): [string, Box3][] => [[`layout ${preset}`, buildMultiTurn({ preset }).box], [`layout ${preset} in a stadium`, buildMultiTurn({ preset, stadium: true }).box]]),
  ["long", { x0: -400, x1: 400, y0: -150, y1: 150, z0: 0, z1: 60 }],
  ["tall", { x0: -200, x1: 200, y0: -200, y1: 200, z0: 0, z1: 500 }],
  ["strip", { x0: -670, x1: 670, y0: -70, y1: 70, z0: 0, z1: 0 }],
];

describe("the camera's fit over a turn", () => {
  it("is one scale and one place at every yaw, at every pitch, in every container, for every surface", () => {
    for (const [name, box] of BOXES) {
      for (const [w, h] of CONTAINERS) {
        const d = eyeDistance(w, h);
        for (const pitch of PITCHES) {
          const first = fit(box, { yaw: 0, pitch, zoom: 1 }, w, h, d);
          for (const yaw of range(-180, 175, 15)) expect(fit(box, { yaw, pitch, zoom: 1 }, w, h, d), `${name} ${w}x${h} pitch ${pitch} yaw ${yaw}`).toEqual(first);
        }
      }
    }
  });

  it("is the same through the whole pipeline: the placement of a laid-out view does not change with the yaw, and a zoom is laid on top of it", () => {
    for (const sport of ["nba", "nhl", "volleyball", "curling", "soccer"] as const) {
      const model = buildTurn({ sport }, {});
      const flat = layoutOf(model, { yaw: 0, pitch: 60, zoom: 1 }, 960, 600).at;
      for (const yaw of range(0, 350, 10)) expect(layoutOf(model, { yaw, pitch: 60, zoom: 1 }, 960, 600).at, `${sport} ${yaw}`).toEqual(flat);
      // Zoom does not change the fit; it multiplies what is drawn (at least by the zoom: the eye is a fixed distance away, so a magnified scene also comes nearer it), and nothing is refitted.
      const d = eyeDistance(960, 600);
      const one = covered(model.box, { yaw: 30, pitch: 60, zoom: 1 }, flat, d);
      for (const zoom of [0.5, 1.2, 2, 4]) {
        const view = { yaw: 30, pitch: 60, zoom };
        expect(layoutOf(model, view, 960, 600).at).toEqual(flat);
        const now = covered(model.box, view, flat, d);
        expect((now.x1 - now.x0) / (one.x1 - one.x0), `${sport} zoom ${zoom}`).toBeGreaterThan(zoom * 0.8);
      }
    }
  });

  it("cuts nothing off at any angle (every degree of the circle), and is no smaller than it has to be", () => {
    for (const [name, box] of BOXES) {
      for (const [w, h] of CONTAINERS.slice(0, 2)) {
        const d = eyeDistance(w, h);
        for (const pitch of [0, 30, 60, PITCH_MAX]) {
          const at = fit(box, { yaw: 0, pitch, zoom: 1 }, w, h, d);
          let x0 = Infinity;
          let x1 = -Infinity;
          let y0 = Infinity;
          let y1 = -Infinity;
          for (const yaw of range(0, 359, 1)) {
            const r = covered(box, { yaw, pitch, zoom: 1 }, at, d);
            x0 = Math.min(x0, r.x0);
            x1 = Math.max(x1, r.x1);
            y0 = Math.min(y0, r.y0);
            y1 = Math.max(y1, r.y1);
          }
          const where = `${name} ${w}x${h} pitch ${pitch}`;
          expect(x0, where).toBeGreaterThanOrEqual(-w / 2);
          expect(x1, where).toBeLessThanOrEqual(w / 2);
          expect(y0, where).toBeGreaterThanOrEqual(-h / 2);
          expect(y1, where).toBeLessThanOrEqual(h / 2);
          // Over the whole turn the scene fills the container up to its 3 percent margin on the side that limits it, and is centred.
          expect(Math.max((x1 - x0) / w, (y1 - y0) / h), where).toBeGreaterThan(0.935);
          expect(Math.abs(x0 + x1) / w, where).toBeLessThan(0.01);
          expect(Math.abs(y0 + y1) / h, where).toBeLessThan(0.01);
        }
      }
    }
  });

  it("still rescales with the tip, since the extent of a surface on the screen depends on the pitch", () => {
    const box = { x0: -400, x1: 400, y0: -150, y1: 150, z0: 0, z1: 60 };
    const d = eyeDistance(960, 600);
    const overhead = fit(box, { yaw: 0, pitch: 0, zoom: 1 }, 960, 600, d).k;
    const tipped = fit(box, { yaw: 0, pitch: 60, zoom: 1 }, 960, 600, d).k;
    expect(Math.abs(tipped / overhead - 1)).toBeGreaterThan(0.05);
  });

  it("keeps a point's place on the screen what project() says, so the placement is the one the matrix uses", () => {
    const box = { x0: -400, x1: 400, y0: -150, y1: 150, z0: 0, z1: 60 };
    const d = eyeDistance(960, 600);
    const at = fit(box, { yaw: 0, pitch: 62, zoom: 1 }, 960, 600, d);
    // The middle of the floor is where the placement put the middle of what is seen, whatever the yaw: the scene turns about its own middle without swaying.
    const ys = range(0, 330, 30).map((yaw) => project([0, 0, 0], { yaw, pitch: 62, zoom: 1 }, at, d)[1]);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(1e-6);
  });
});
