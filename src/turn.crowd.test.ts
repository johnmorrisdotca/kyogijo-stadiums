// The 3D view of a crowd's bowl, for every sport the package draws: the eye stands outside the whole scene (the stands and a roof over them included) at every viewpoint, at the
// least and the most zoom, in a desk's box and a phone's, and nothing of the scene comes near the eye's own plane, where the projection would cut it or turn it inside out. The near
// stands that are drawn faint at a low viewpoint are the walls giving way to the eye (`fadeOf`), not a cut. And the floor is drawn under the whole bowl, a raised one (a table tennis table's top, which
// carries the floor's drawing at the table's height) too: sorted by its middle with the stands, it was drawn over the far stands.
import { describe, expect, it } from "vitest";
import { SPORTS } from "./index.ts";
import { ZOOM_MAX, ZOOM_MIN, buildTurn, eyeDistance, fit, layoutOf, presetsFor, type TurnModel, type TurnView } from "./turn-entry.ts";
import type { SurfaceOptions } from "./types.ts";

const RAD = Math.PI / 180;
const CONTAINERS: readonly (readonly [number, number])[] = [[1280, 900], [390, 700]];

/** Where the eye is in the scene's own pixels (from its middle), and how near the eye's plane the nearest corner of the scene comes, as a share of the eye's distance. */
function eyeOf(model: TurnModel, view: TurnView, [w, h]: readonly [number, number]): { eye: [number, number, number]; nearest: number } {
  const distance = eyeDistance(w, h, model.lens);
  const at = fit(model.box, { ...view, zoom: 1 }, w, h, distance);
  const k = at.k * view.zoom;
  const [yaw, pitch] = [view.yaw * RAD, view.pitch * RAD];
  // The eye is on the screen's middle, `distance` in front of it: undo the shift, the tip and the turn (`project`'s arithmetic backwards).
  const [x2, y3, z3] = [-at.tx, -at.ty, distance];
  const y2 = y3 * Math.cos(pitch) + z3 * Math.sin(pitch);
  const z = -y3 * Math.sin(pitch) + z3 * Math.cos(pitch);
  const x = x2 * Math.cos(yaw) + y2 * Math.sin(yaw);
  const y = -x2 * Math.sin(yaw) + y2 * Math.cos(yaw);
  const b = model.box;
  let nearest = -Infinity;
  for (const cx of [b.x0, b.x1]) for (const cy of [b.y0, b.y1]) for (const cz of [b.z0, b.z1]) {
    const [px, py, pz] = [cx * k, cy * k, cz * k];
    const py2 = px * Math.sin(yaw) + py * Math.cos(yaw);
    nearest = Math.max(nearest, (py2 * Math.sin(pitch) + pz * Math.cos(pitch)) / distance);
  }
  return { eye: [x / k, y / k, z / k], nearest };
}

describe("the 3D view of the stands keeps the eye outside the bowl", () => {
  it.each(SPORTS)("%s", (sport) => {
    for (const roof of [false, true]) {
      const model = buildTurn({ sport, crowd: true } as SurfaceOptions, roof ? { venue: { roof: true } } : {});
      const b = model.box;
      // The scene holds the stands: it reaches beyond the floor's own extent.
      expect(model.venue, sport).toBe(true);
      for (const [name, preset] of Object.entries(presetsFor(model.presets ?? sport))) {
        for (const zoom of [ZOOM_MIN, 1, ZOOM_MAX]) {
          for (const container of CONTAINERS) {
            const where = `${sport}${roof ? " with a roof" : ""} ${name} zoom ${zoom} ${container.join("x")}`;
            const { eye, nearest } = eyeOf(model, { ...preset, zoom }, container);
            const inside = eye[0] > b.x0 && eye[0] < b.x1 && eye[1] > b.y0 && eye[1] < b.y1 && eye[2] > b.z0 && eye[2] < b.z1;
            expect(inside, `${where}: the eye is inside the scene`).toBe(false);
            // The projection pushes a point within a twentieth of the eye's distance to the edge of the world: nothing comes within half of it.
            expect(nearest, `${where}: the nearest corner's depth`).toBeLessThan(0.5);
          }
        }
      }
    }
  });
});

describe("the floor is drawn under the bowl", () => {
  it.each(SPORTS)("%s", (sport) => {
    const model = buildTurn({ sport, crowd: true } as SurfaceOptions, { venue: { roof: true } });
    const bowl = new Set(model.uprights.items.filter((item) => ["stands", "wall-seats", "gallery", "roof", "ribbon-boards", "hung-board"].includes(item.kind)).flatMap((item) => item.planes));
    const indices = model.planes.flatMap((p, i) => (bowl.has(p) ? [i + 1] : []));
    // A dojo's crowd is in the gallery of its room's walls: it has no bowl.
    expect(indices.length > 0, sport).toBe(sport !== "dojo");
    const views = [...Object.values(presetsFor(model.presets ?? sport)), ...Array.from({ length: 12 }, (_, k) => ({ yaw: k * 30, pitch: 63.6, zoom: 1.44 }))];
    for (const view of views) {
      const { stack } = layoutOf(model, view, 1280, 900);
      const under = indices.filter((i) => stack[i] < stack[0]);
      expect(under.length, `${sport} yaw ${view.yaw} pitch ${view.pitch}: ${under.length} planes of the bowl under the floor, ${under.slice(0, 3).map((i) => model.planes[i - 1].id).join(", ")}`).toBe(0);
    }
  });
});
