// A ring in 3D: the platform as a solid block (four sides and a top that is the drawing's own canvas, lifted to the platform's height), the four corner posts with their pads in the corner colours, the ropes (each one a
// thin round bar along a side and, at each corner, its extension to the post), the spacer ties that hold the ropes in line, and the steps. The ropes are thin, so the canvas stays in sight through them. Heights are the
// league's (the posts' and the ropes' by the rules, the pads' and the ties' ours). Pure: plans in metres in, planes in feet out.
import type { BudoPlan } from "./budo/plan.ts";
import type { RingLayout } from "./budo/ring.ts";
import { box, flat, n, pole, bar, wall, type Plane, type Upright } from "./turn.kit.ts";

const K = 1 / 0.3048;

/** The platform of a ring as a solid block: its four sides and its top, which is the drawing's own canvas in the platform's rectangle. */
export function platformPlanes(b: { x0: number; y0: number; x1: number; y1: number }, at: (x: number, y: number) => readonly [number, number], h: number): Plane[] {
  const corners = [at(b.x0, b.y0), at(b.x1, b.y0), at(b.x1, b.y1), at(b.x0, b.y1)];
  const planes: Plane[] = [];
  corners.forEach((a, i) => {
    const c = corners[(i + 1) % 4];
    planes.push(wall(`deck-${i + 1}`, "wall", a[0], a[1], c[0], c[1], 0, h, `<rect width="${n(Math.hypot(c[0] - a[0], c[1] - a[1]))}" height="${n(h)}" class="u-deck-side"/>`));
  });
  planes.push({ ...flat("deck-top", "platform", corners[0][0], corners[0][1], corners[2][0], corners[2][1], h, ""), crop: true });
  return planes;
}

/** What stands on a ring: the platform, its steps, the posts, the ropes and their ties. */
export function ringUprights(plan: BudoPlan, L: RingLayout, at: (x: number, y: number) => readonly [number, number]): Upright[] {
  const fig = plan.figures as { post: { height: number; pad: number }; ropes: { heights: readonly number[]; diameter: { drawn: number } }; platform: { steps: { treads: number; tread: number } } };
  const h0 = L.height * K;
  const centre = at(L.centre[0], L.centre[1]);
  const items: Upright[] = [{ id: "deck", kind: "deck", at: centre, height: h0, planes: platformPlanes(L.platform, at, h0) }];
  if (L.steps.length > 0) {
    const s = fig.platform.steps;
    const planes: Plane[] = [];
    for (const st of L.steps) {
      const north = st.edge === "north";
      for (let t = 0; t < s.treads; t += 1) {
        const y0 = north ? st.box.y0 + t * s.tread : st.box.y0;
        const y1 = north ? st.box.y1 : st.box.y1 - t * s.tread;
        const [x0, ya] = at(st.box.x0, y0);
        const [x1, yb] = at(st.box.x1, y1);
        planes.push(...box(`step-${st.corner}-${t + 1}`, "platform", { x0, y0: ya, x1, y1: yb }, (h0 * (t + 1)) / s.treads, "u-step"));
      }
    }
    items.push({ id: "steps", kind: "deck", at: centre, height: h0, planes });
  }
  // The posts: solid, two crossed strips as wide as the pad, in the corner's colour, from the platform to the height the rules give over the ring floor.
  const top = h0 + fig.post.height * K;
  const padW = fig.post.pad * K;
  const posts: Plane[] = L.corners.flatMap((c) => {
    const [px, py] = at(c.post[0], c.post[1]);
    return pole(`post-${c.index + 1}`, "post", px, py, h0, top, padW, `u-corner-${c.colour}`);
  });
  // The ropes: along each side between the corners of the rope square, and at each corner out to the post by the extension.
  const ropeW = Math.max(fig.ropes.diameter.drawn, 0.03) * K;
  const ropes: Plane[] = [];
  fig.ropes.heights.forEach((rh, level) => {
    const z = h0 + rh * K;
    const sq = L.corners.map((c) => at(c.rope[0], c.rope[1]));
    for (let i = 0; i < 4; i += 1) {
      const a = sq[i];
      const b = sq[(i + 1) % 4];
      ropes.push(...bar(`rope-${level + 1}-${i + 1}`, "rail", [a[0], a[1], z], [b[0], b[1], z], ropeW, "u-rope"));
    }
    L.corners.forEach((c, i) => {
      const a = at(c.rope[0], c.rope[1]);
      const p = at(c.post[0], c.post[1]);
      ropes.push(...bar(`rope-${level + 1}-ext-${i + 1}`, "rail", [a[0], a[1], z], [p[0], p[1], z], ropeW, "u-rope"));
    });
  });
  // Two ties on each side, a strip joining the ropes where they are a third and two thirds along, as the rules ask (spacers).
  const lo = h0 + fig.ropes.heights[0] * K;
  const hi = h0 + fig.ropes.heights[fig.ropes.heights.length - 1] * K;
  const ties: Plane[] = [];
  const sq = L.corners.map((c) => at(c.rope[0], c.rope[1]));
  for (let i = 0; i < 4; i += 1) {
    const a = sq[i];
    const b = sq[(i + 1) % 4];
    for (const t of [1 / 3, 2 / 3]) {
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      ties.push(...pole(`tie-${i + 1}-${t < 0.5 ? 1 : 2}`, "rail", x, y, lo, hi, 0.1 * K, "u-rope-tie"));
    }
  }
  items.push({ id: "posts", kind: "ring-posts", at: centre, height: top - h0, planes: posts });
  items.push({ id: "ropes", kind: "ring-ropes", at: centre, height: hi - h0, planes: [...ropes, ...ties] });
  return items;
}
