// An MMA cage in 3D: the platform as a solid block (four sides and a top that is the drawing's own canvas, lifted to the platform's height, as the dohyō's mound is), the eight padded posts, the fence as
// wire mesh on each of its eight flats with a pad along its top and its foot, the two gates with their frames, and the steps up to the platform at each gate. The fence is mesh, so the canvas stays in
// sight through it, and it gives way when it lies between the eye and the cage, as a wall of glass does; the posts are solid. The platform's height and the fence's are the options' (the rules set the
// most and the least); the pad's width and depth and the steps' are ours. Pure: plans in metres in, planes in feet out.
import type { BudoPlan } from "./budo/plan.ts";
import { box, flat, mesh, n, pole, shy, threads, wall, type Plane, type Upright } from "./turn.kit.ts";

const K = 1 / 0.3048;

/** The mesh of the fence: a cell of 5 cm (a diamond of chain link, drawn as a square grid, ours). */
const CELL = 0.05 * K;

/** The planes of the platform: its four sides from the floor of the building up to the canvas, and a top that is the floor's own drawing in the platform's rectangle. */
function deckPlanes(plan: BudoPlan, at: (x: number, y: number) => readonly [number, number], h: number): Plane[] {
  const b = plan.mma!.platform;
  const corners = [at(b.x0, b.y0), at(b.x1, b.y0), at(b.x1, b.y1), at(b.x0, b.y1)];
  const planes: Plane[] = [];
  corners.forEach((a, i) => {
    const c = corners[(i + 1) % 4];
    planes.push(wall(`deck-${i + 1}`, "wall", a[0], a[1], c[0], c[1], 0, h, `<rect width="${n(Math.hypot(c[0] - a[0], c[1] - a[1]))}" height="${n(h)}" class="u-deck-side"/>`));
  });
  planes.push({ ...flat("deck-top", "platform", corners[0][0], corners[0][1], corners[2][0], corners[2][1], h, ""), crop: true });
  return planes;
}

/** The mesh of a fence panel w by h feet. */
const meshOf = (w: number, h: number): string => `<rect width="${n(w)}" height="${n(h)}" class="u-netfill"/>${threads(mesh(w, h, CELL), CELL)}`;

/** What stands on a cage: the platform, the posts, the fence with its gates, and the steps. */
export function cageUprights(plan: BudoPlan, at: (x: number, y: number) => readonly [number, number], thin: number): Upright[] {
  const L = plan.mma;
  if (L === undefined) return [];
  const fig = plan.figures as { post: { pad: number; rail: number }; gates: { height: number }; platform: { steps: { treads: number; tread: number; width: number } } };
  const h0 = L.height * K;
  const top = h0 + L.fence * K;
  const centre = at(L.centre[0], L.centre[1]);
  const items: Upright[] = [];
  items.push({ id: "deck", kind: "deck", at: centre, height: h0, planes: deckPlanes(plan, at, h0) });
  // The steps: each tread a block as high as the treads below it and itself, the lowest the farthest from the platform.
  if (L.steps.length > 0) {
    const s = fig.platform.steps;
    const planes: Plane[] = [];
    for (const b of L.steps) {
      const north = b.y1 <= 0.0001;
      for (let t = 0; t < s.treads; t += 1) {
        // The tread t from the ground: its depth lies further in as t grows.
        const y0 = north ? b.y0 + t * s.tread : b.y0;
        const y1 = north ? b.y1 : b.y1 - t * s.tread;
        const [x0, ya] = at(b.x0, y0);
        const [x1, yb] = at(b.x1, y1);
        planes.push(...box(`step-${north ? "north" : "south"}-${t + 1}`, "platform", { x0, y0: ya, x1, y1: yb }, (h0 * (t + 1)) / s.treads, "u-step"));
      }
    }
    items.push({ id: "steps", kind: "deck", at: centre, height: h0, planes });
  }
  // The posts: padded, from the platform up a hand's breadth over the fence; solid, so two crossed strips as wide as the pad.
  const padW = fig.post.pad * K;
  const postTop = top + 0.15 * K;
  const posts: Plane[] = L.posts.flatMap(([x, y], i) => {
    const [px, py] = at(x, y);
    return pole(`post-${i + 1}`, "post", px, py, h0, postTop, padW, "u-cagepad");
  });
  // The fence: one panel on each flat, in mesh, with a pad along the top and one along the foot. The panels give way to an eye that has them between it and the cage.
  const rail = fig.post.rail * K;
  const planes: Plane[] = [];
  const doorH = fig.gates.height * K;
  L.posts.forEach((p, i) => {
    const q = L.posts[(i + 1) % L.posts.length];
    const [ax, ay] = at(p[0], p[1]);
    const [bx, by] = at(q[0], q[1]);
    const len = Math.hypot(bx - ax, by - ay);
    const gate = L.gates.find((g) => g.flat === i);
    const wallOf = (id: string, x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, svg: string, kind: Plane["kind"] = "wall"): Plane => ({ ...shy(wall(id, kind, x0, y0, x1, y1, z0, z1, svg), centre), fadeTo: 0.3, fadeAt: 0.2 });
    if (gate === undefined) {
      planes.push(wallOf(`fence-${i + 1}`, ax, ay, bx, by, h0 + rail, top - rail, meshOf(len, top - rail - (h0 + rail)), "net"));
    } else {
      const [fx, fy] = at(gate.from[0], gate.from[1]);
      const [tx, ty] = at(gate.to[0], gate.to[1]);
      const left = Math.hypot(fx - ax, fy - ay);
      const open = Math.hypot(tx - fx, ty - fy);
      const right = Math.hypot(bx - tx, by - ty);
      planes.push(wallOf(`fence-${i + 1}a`, ax, ay, fx, fy, h0 + rail, top - rail, meshOf(left, top - rail - (h0 + rail)), "net"));
      planes.push(wallOf(`fence-${i + 1}b`, tx, ty, bx, by, h0 + rail, top - rail, meshOf(right, top - rail - (h0 + rail)), "net"));
      // Over the door: mesh from the door's head to the top pad. The door itself is a frame of padded rails round mesh, closed.
      planes.push(wallOf(`fence-${i + 1}-over`, fx, fy, tx, ty, h0 + doorH, top - rail, meshOf(open, top - rail - (h0 + doorH)), "net"));
      const leafH = doorH - rail;
      const frame = `<rect x="${n(rail / 2)}" y="${n(rail / 2)}" width="${n(open - rail)}" height="${n(leafH - rail)}" class="u-gateframe" fill="none" stroke-width="${n(rail)}"/>`;
      planes.push(wallOf(`gate-${gate.side}`, fx, fy, tx, ty, h0 + rail, h0 + doorH, `<rect width="${n(open)}" height="${n(doorH - rail)}" class="u-netfill"/>${threads(mesh(open, doorH - rail, CELL), CELL)}${frame}`, "wall"));
    }
    // The pads: along the top (the whole flat), and along the foot (except across a gate).
    planes.push(wallOf(`fence-top-${i + 1}`, ax, ay, bx, by, top - rail, top, `<rect width="${n(len)}" height="${n(rail)}" class="u-cagepad"/>`, "rail"));
    if (gate === undefined) planes.push(wallOf(`fence-foot-${i + 1}`, ax, ay, bx, by, h0, h0 + rail, `<rect width="${n(len)}" height="${n(rail)}" class="u-cagepad"/>`, "rail"));
  });
  items.push({ id: "fence", kind: "cage-fence", at: centre, height: top - h0, planes });
  items.push({ id: "posts", kind: "cage-posts", at: centre, height: postTop - h0, planes: posts });
  void thin;
  return items;
}
