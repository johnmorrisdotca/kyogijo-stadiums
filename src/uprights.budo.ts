// What stands on a budō surface, in 3D: the dohyō's clay mound (the clay square stands 34 cm to 60 cm over the floor of the hall, Sumo Rules, Dohyō Regulations, Article 1), the azuchi of a kyūdōjō with the
// targets on it (36 cm across and 27 cm over the mound's base, tilted 5 degrees; 100 cm, 97 cm and 15 degrees for enteki), and the walls of a dojo. A judo, karate or kendo surface lies flat: nothing stands on it
// (a judo platform's height is not in the rules: "it depends on the sightlines"). The plans are in metres in the frame of their own origin, and the drawing's frame is feet from the corner of the plan's
// box, so every point goes through `at`. The mound's height is the option's; the azuchi's (1.5 m or 1.8 m) and a dojo wall's (3 m) are ours: no rule gives them.
import { budoPlan, type BudoPlan } from "./budo/plan.ts";
import { flat, n, plane, shy, wall, type Plane, type Upright } from "./turn.kit.ts";
import { cageUprights } from "./uprights.cage.ts";
import type { SurfaceOptions } from "./types.ts";

const K = 1 / 0.3048;

/** What the 3D view makes of a budō surface: the things that stand, how high the surface itself stands, and the box the view is fitted to. */
export interface BudoUprights {
  items: Upright[];
  lift: number;
  area: { x0: number; y0: number; x1: number; y1: number };
  /** The view is fitted to the whole floor (a platform stands in it), not to `area`. */
  whole: boolean;
}

/** The walls of a dojo, 3 m high (ours). */
export const DOJO_WALL = 3;

/**
 * The planes of the dohyō's clay mound, a solid block: its four sides, from the floor of the hall up to the clay, and its flat top, which is the drawing's own clay with the ring of straw bales on it, lifted to the
 * mound's height (the floor itself lies on the hall's floor, so that the ground round the mound stays low). The sides are one tone darker than the top, so that top and sides are lit the same way; whichever way
 * the view is turned, the sides on the far side are drawn first and the top over them (see `layoutOf`), so the mound never looks hollow.
 */
function moundPlanes(plan: BudoPlan, at: (x: number, y: number) => readonly [number, number], height: number): Plane[] {
  const L = plan.sumo;
  if (L === undefined) return [];
  const b = L.platform;
  const corners = [at(b.x0, b.y0), at(b.x1, b.y0), at(b.x1, b.y1), at(b.x0, b.y1)];
  const planes: Plane[] = [];
  corners.forEach((a, i) => {
    const c = corners[(i + 1) % 4];
    planes.push(wall(`mound-${i + 1}`, "wall", a[0], a[1], c[0], c[1], 0, height, `<rect width="${n(Math.hypot(c[0] - a[0], c[1] - a[1]))}" height="${n(height)}" class="u-clay u-clay-side"/>`));
  });
  const [a, c] = [corners[0], corners[2]];
  planes.push({ ...flat("mound-top", "platform", a[0], a[1], c[0], c[1], height, ""), crop: true });
  return planes;
}

/** The azuchi's face, a slope from the foot of the mound up to its top, and the target of each shooter standing against it. */
function azuchiPlanes(plan: BudoPlan, at: (x: number, y: number) => readonly [number, number]): { mound: Plane[]; targets: Plane[]; height: number } {
  const L = plan.kyudo;
  if (L === undefined) return { mound: [], targets: [], height: 0 };
  const fig = plan.figures as { target: { diameter: number; centre: number; tilt: number }; azuchi: { height: number } };
  const h = fig.azuchi.height * K;
  const a = L.azuchi;
  // The face runs from the foot, in front of the target's line, up to the top at the target's line: a slope of about 50 degrees reaches 1.5 m in 1.26 m.
  const run = (fig.azuchi.height / Math.tan((50 * Math.PI) / 180)) * K;
  const [fx, fy0] = at(a.x0, a.y0);
  const [, fy1] = at(a.x0, a.y1);
  const topX = fx + run;
  const mound = plane("azuchi-face", "wall", [topX, fy0, h], [0, fy1 - fy0, 0], [-run, 0, -h], `<rect width="${n(fy1 - fy0)}" height="${n(Math.hypot(run, h))}" class="u-clay"/>`);
  const d = fig.target.diameter * K;
  const tilt = (fig.target.tilt * Math.PI) / 180;
  const centre = fig.target.centre * K;
  const targets: Plane[] = L.lanes.map((y, i) => {
    const [tx, ty] = at(L.target, y);
    // The face leans back at the top: its top is further from the shooters than its bottom.
    const top: [number, number, number] = [tx + (d / 2) * Math.sin(tilt), ty - d / 2, centre + (d / 2) * Math.cos(tilt)];
    return plane(`target-${i + 1}`, "target", top, [0, d, 0], [-d * Math.sin(tilt), 0, -d * Math.cos(tilt)], `<circle cx="${n(d / 2)}" cy="${n(d / 2)}" r="${n(d / 2)}" class="u-white"/><circle cx="${n(d / 2)}" cy="${n(d / 2)}" r="${n(d * 0.33)}" class="u-outline" fill="none"/><circle cx="${n(d / 2)}" cy="${n(d / 2)}" r="${n(d * 0.16)}" class="u-outline" fill="none"/>`);
  });
  return { mound: [mound], targets, height: h };
}

/** What stands on the budō surface the options draw. */
export function budoUprights(o: Pick<SurfaceOptions, "sport" | "league" | "budo" | "dojo" | "detail">, thin: number): BudoUprights {
  const plan = budoPlan(o);
  const ox = plan.box.x0;
  const oy = plan.box.y0;
  const at = (x: number, y: number): readonly [number, number] => [(x - ox) * K, (y - oy) * K];
  const area = { x0: 0, y0: 0, x1: (plan.box.x1 - ox) * K, y1: (plan.box.y1 - oy) * K };
  const items: Upright[] = [];
  // The floor lies on the hall's floor (`lift` is 0): the mound is a block standing on it, with its own top.
  const lift = 0;
  if (plan.sumo !== undefined) {
    const height = plan.sumo.height * K;
    items.push({ id: "mound", kind: "mound", at: at(plan.sumo.centre[0], plan.sumo.centre[1]), height, planes: moundPlanes(plan, at, height) });
  }
  if (plan.mma !== undefined) items.push(...cageUprights(plan, at, thin));
  if (plan.kyudo !== undefined) {
    const built = azuchiPlanes(plan, at);
    items.push({ id: "azuchi", kind: "azuchi", at: at(plan.kyudo.target, plan.kyudo.lanes[0]), height: built.height, planes: built.mound });
    if (built.targets.length > 0) items.push({ id: "targets", kind: "targets", at: at(plan.kyudo.target, plan.kyudo.lanes[0]), height: Math.max(...built.targets.map((p) => p.o[2])), planes: built.targets });
  }
  if (plan.dojo !== undefined && plan.dojo.wall > 0) {
    const f = plan.dojo.room;
    const h = DOJO_WALL * K;
    const w = plan.dojo.wall;
    const centre: readonly [number, number] = [area.x1 / 2, area.y1 / 2];
    const planes = [
      [f.x0 - w / 2, f.y0 - w / 2, f.x1 + w / 2, f.y0 - w / 2],
      [f.x1 + w / 2, f.y0 - w / 2, f.x1 + w / 2, f.y1 + w / 2],
      [f.x1 + w / 2, f.y1 + w / 2, f.x0 - w / 2, f.y1 + w / 2],
      [f.x0 - w / 2, f.y1 + w / 2, f.x0 - w / 2, f.y0 - w / 2],
    ].map(([x0, y0, x1, y1], i) => {
      const [a, b] = [at(x0, y0), at(x1, y1)];
      const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return shy(wall(`wall-${i + 1}`, "wall", a[0], a[1], b[0], b[1], 0, h, `<rect width="${n(run)}" height="${n(h)}" class="u-wall"/>`), centre);
    });
    items.push({ id: "walls", kind: "walls", at: centre, height: h, planes });
  }
  return { items, lift, area, whole: plan.sumo !== undefined || plan.mma !== undefined };
}
