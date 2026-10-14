// What stands on the pools, in 3D: a swimming pool's starting blocks, its backstroke flag lines and its false start rope; a diving well's springboards and platforms on their stands; a water
// polo field's two floating goals; an artistic swimming area's judges' stand and starting platform. The heights are World Aquatics' (the Competition Regulations in force from 25 June 2025):
// docs/sources.md, "Heights in the 3D view", says which rule each comes from, and `pool.figures.ts` holds the figures. A plan is in metres and the drawing's frame in feet, with the pool's
// top left corner for the origin and the water level for the floor, so every length goes through `feet`. What the rules leave to the maker (the thickness of a stand, a rope, the sides of a
// box) is ours and is said so there.
import { ARTISTIC, DIVING, SWIMMING, WATER_POLO } from "./pool.figures.ts";
import { feet, poolPlan, type ArtisticPlan, type DivePlan, type PoloPlan, type PoolPlan, type SwimPlan } from "./pool.ts";
import { GUTTER } from "./surfaces/pool.ts";
import { goalCage } from "./uprights.goal.ts";
import { flat, n, pole, polygon, wall, type Plane, type Upright } from "./turn.kit.ts";
import type { SurfaceOptions } from "./types.ts";

/** A box over the rectangle (x0, y0) to (x1, y1) between the heights z0 and z1: its top and the sides named, the top in `top` and the sides in `side`. */
function box(id: string, x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, top: string, side: string, sides: readonly ("x0" | "x1" | "y0" | "y1")[], withTop = true): Plane[] {
  const planes: Plane[] = [];
  if (withTop) planes.push(flat(`${id}-top`, "board", x0, y0, x1, y1, z1, `<rect width="${n(x1 - x0)}" height="${n(y1 - y0)}" class="${top}"/>`));
  const face = (tag: string, ax: number, ay: number, bx: number, by: number): Plane => wall(`${id}-${tag}`, "wall", ax, ay, bx, by, z0, z1, `<rect width="${n(Math.hypot(bx - ax, by - ay))}" height="${n(z1 - z0)}" class="${side}"/>`);
  if (sides.includes("x0")) planes.push(face("x0", x0, y0, x0, y1));
  if (sides.includes("x1")) planes.push(face("x1", x1, y0, x1, y1));
  if (sides.includes("y0")) planes.push(face("y0", x0, y0, x1, y0));
  if (sides.includes("y1")) planes.push(face("y1", x0, y1, x1, y1));
  return planes;
}

/** The swimming pool: a block in each lane at each end, a flagged rope 5 m from each wall, the false start rope 15 m from the starting end, each rope on a standard at either side. */
function swimmingUprights(plan: SwimPlan, thin: number): Upright[] {
  const items: Upright[] = [];
  const L = plan.length;
  const W = plan.width;
  const standard = Math.max(feet(0.05), thin * 1.4);
  const standards = (id: string, x: number, height: number, outside: number): Plane[] =>
    [-outside, W + outside].flatMap((y, i) => pole(`${id}-standard-${i === 0 ? "a" : "b"}`, "post", feet(x), feet(y), 0, height, standard, "u-pole"));
  if (plan.blocks) {
    const { width, length, height } = SWIMMING.block;
    const planes: Plane[] = [];
    for (const lane of plan.lanes) {
      for (const end of [0, 1] as const) {
        // 0.08 m of deck between the wall and the block, as the drawing has it (the drawing stands them 0.08 m behind the wall).
        const x0 = end === 0 ? -0.08 - length : L + 0.08;
        const id = `block-${lane.number}-${end === 0 ? "start" : "turn"}`;
        const bx0 = feet(x0);
        const bx1 = feet(x0 + length);
        const by0 = feet(lane.y - width / 2);
        const by1 = feet(lane.y + width / 2);
        const number = `<text x="${n((bx1 - bx0) / 2)}" y="${n((by1 - by0) * 0.74)}" text-anchor="middle" font-size="${n((by1 - by0) * 0.66)}" font-weight="800" font-family="system-ui,sans-serif" fill="#1f2320">${lane.number}</text>`;
        planes.push(flat(`${id}-top`, "board", bx0, by0, bx1, by1, feet(height), `<rect width="${n(bx1 - bx0)}" height="${n(by1 - by0)}" class="u-board"/>${number}`));
        // The face towards the water.
        const fx = end === 0 ? bx1 : bx0;
        planes.push(wall(`${id}-front`, "wall", fx, by0, fx, by1, 0, feet(height), `<rect width="${n(by1 - by0)}" height="${n(feet(height))}" class="u-leg"/>`));
      }
    }
    items.push({ id: "starting-blocks", kind: "starting-blocks", at: [feet(L) / 2, feet(W) / 2], height: feet(height), planes });
  }
  if (plan.flags) {
    const { at, height, side } = SWIMMING.flags;
    const hang = side * 0.87;
    const planes: Plane[] = [];
    for (const [i, x] of [at, L - at].entries()) {
      const outside = 0.6;
      const run = feet(W + 2 * outside);
      const tri = feet(side);
      const gap = feet(SWIMMING.flags.apart);
      let flags = "";
      for (let k = 0, a = gap / 2; a + tri <= run; k += 1, a += tri + gap) flags += `<path d="${polygon([[a, 0], [a + tri, 0], [a + tri / 2, feet(hang)]])}" class="${k % 2 === 0 ? "u-red" : "u-white"}"/>`;
      const rope = `<path d="M0 0H${n(run)}" class="u-tapeline" fill="none" stroke-width="${n(Math.max(feet(0.02), thin * 0.5))}"/>`;
      planes.push(wall(`flags-${i === 0 ? "start" : "turn"}`, "tape", feet(x), -feet(outside), feet(x), feet(W + outside), feet(height - hang), feet(height), flags + rope), ...standards(`flags-${i === 0 ? "start" : "turn"}`, x, feet(height), outside));
    }
    items.push({ id: "backstroke-flags", kind: "backstroke-flags", at: [feet(L) / 2, feet(W) / 2], height: feet(height), planes });
  }
  if (plan.falseStart) {
    const { at, height } = SWIMMING.falseStart;
    const outside = 0.7;
    const run = feet(W + 2 * outside);
    const thick = Math.max(feet(0.06), thin * 1.1);
    const rope = wall("false-start-rope", "tape", feet(at), -feet(outside), feet(at), feet(W + outside), feet(height) - thick, feet(height), `<rect width="${n(run)}" height="${n(thick)}" class="u-red"/>`);
    items.push({ id: "false-start-rope", kind: "false-start-rope", at: [feet(at), feet(W) / 2], height: feet(height), planes: [rope, ...standards("false-start", at, feet(height), outside)] });
  }
  return items;
}

/** The two goals of a water polo field, floating on the goal lines: 3 m between the posts, the crossbar's underside 0.9 m over the water (CR 18.3.3), a net 0.30 m deep behind the line. */
function poloUprights(plan: PoloPlan, thin: number): Upright[] {
  const { goal } = WATER_POLO;
  const g0 = goal.netClear;
  const g1 = plan.length - goal.netClear;
  const posts = Math.max(feet(goal.post), thin * 1.2);
  const items: Upright[] = [];
  for (const [i, from] of (["left", "right"] as const).entries()) {
    const cage = goalCage({
      id: `goal-${from}`,
      x: feet(i === 0 ? g0 : g1),
      y: feet(plan.width) / 2,
      out: i === 0 ? -1 : 1,
      width: feet(goal.width + goal.post),
      height: feet(goal.crossbarHeight + goal.post),
      depth: feet(goal.netClear),
      top: feet(goal.netClear) * 0.5,
      post: posts,
      cell: Math.max(feet(0.1), thin * 3),
      tone: "white",
    });
    // The height said is the clear one, to the underside of the bar.
    items.push({ ...cage, height: feet(goal.crossbarHeight) });
  }
  return items;
}

/**
 * A diving well: each springboard 4.88 m long and 0.50 m wide at 1 m or 3 m, its plummet over the water, on a stand behind the wall (Appendix 2); each platform at its height of 1, 3, 5, 7.5 or 10 m with
 * the length and width of the table, on a tower behind the wall. The stands and towers are ours: the rules give where the plummet is and not what holds the board up.
 */
function diveUprights(plan: DivePlan): Upright[] {
  const springPlanes: Plane[] = [];
  const platformPlanes: Plane[] = [];
  let lowest = Infinity;
  const stand = DIVING.springboard.width + 0.5;
  for (const [i, b] of plan.boards.entries()) {
    const x0 = feet(b.x - b.length);
    const x1 = feet(b.x);
    const y0 = feet(b.y - b.width / 2);
    const y1 = feet(b.y + b.width / 2);
    const h = feet(b.height);
    const id = `${b.kind === "springboard" ? "springboard" : "platform"}-${String(b.height).replace(".", "-")}m-${i}`;
    lowest = Math.min(lowest, b.height);
    if (b.kind === "springboard") {
      // The board, a stand under its rear half (from the rear end to the wall) as wide as the board and a little more.
      const sy0 = feet(b.y - stand / 2);
      const sy1 = feet(b.y + stand / 2);
      springPlanes.push(...box(id, x0, y0, x1, y1, h - feet(0.1), h, "u-pad", "u-pad", ["y0", "y1"]));
      springPlanes.push(...box(`${id}-stand`, x0 + feet(0.4), sy0, 0, sy1, 0, h - feet(0.1), "u-leg", "u-leg", ["x1", "y0", "y1"], false));
    } else {
      // The table, with its front lip over the water, and a tower 2.5 m deep behind the wall under its rear part, as wide as the table up to 2.2 m.
      platformPlanes.push(...box(id, x0, y0, x1, y1, h - feet(0.25), h, "u-board", "u-board", ["x1"]));
      const half = Math.min(b.width / 2, 1.1);
      platformPlanes.push(...box(`${id}-tower`, Math.max(x0, -feet(2.5)), feet(b.y - half), 0, feet(b.y + half), 0, h - feet(0.25), "u-leg", "u-leg", ["x1", "y0", "y1"], false));
    }
  }
  const items: Upright[] = [];
  const tall = (kind: "springboard" | "platform"): number => Math.max(0, ...plan.boards.filter((b) => b.kind === kind).map((b) => b.height));
  if (springPlanes.length > 0) items.push({ id: "springboards", kind: "springboards", at: [0, feet(plan.width) / 2], height: feet(tall("springboard")), planes: springPlanes });
  if (platformPlanes.length > 0) items.push({ id: "platforms", kind: "platforms", at: [0, feet(plan.width) / 2], height: feet(tall("platform")), planes: platformPlanes });
  return items;
}

/** An artistic swimming area: the judges' platform along the top side, 0.6 m high (CR 27.2.8: at least 0.6 m, not more than 2 m from the edge), and the starting platform 0.7 m high (CR 27.2.7). */
function artisticUprights(plan: ArtisticPlan): Upright[] {
  const { judges, start } = ARTISTIC.drawn;
  const L = plan.length;
  const W = plan.width;
  const jy = -GUTTER - 1 - judges.depth;
  const jx0 = L / 2 - judges.length / 2;
  const jh = feet(ARTISTIC.judges.height);
  const sx = L / 2 - start.length / 2;
  const sy = W + GUTTER + 0.4;
  const sh = feet(ARTISTIC.start.heightOlympic);
  return [
    {
      id: "judges-stand",
      kind: "judges-stand",
      at: [feet(L / 2), feet(jy + judges.depth / 2)],
      height: jh,
      planes: box("judges", feet(jx0), feet(jy), feet(jx0 + judges.length), feet(jy + judges.depth), 0, jh, "u-board", "u-leg", ["x0", "x1", "y1"]),
    },
    {
      id: "starting-platform",
      kind: "starting-blocks",
      at: [feet(L / 2), feet(sy + start.depth / 2)],
      height: sh,
      planes: box("start", feet(sx), feet(sy), feet(sx + start.length), feet(sy + start.depth), 0, sh, "u-board", "u-leg", ["x0", "x1", "y0"]),
    },
  ];
}

/** What stands on a pool of the options' sport, as the drawing has it, with the plan's metres put into the drawing's feet. A natatorium of several pools has none. */
export function poolUprights(o: SurfaceOptions, thin: number): { items: Upright[]; plan: PoolPlan } {
  const plan = poolPlan(o as Pick<SurfaceOptions, "sport" | "pool">);
  if (o.pool?.venue !== undefined) return { items: [], plan };
  switch (plan.sport) {
    case "swimming":
      return { items: swimmingUprights(plan, thin), plan };
    case "waterpolo":
      return { items: poloUprights(plan, thin), plan };
    case "diving":
      return { items: diveUprights(plan), plan };
    default:
      return { items: artisticUprights(plan), plan };
  }
}
