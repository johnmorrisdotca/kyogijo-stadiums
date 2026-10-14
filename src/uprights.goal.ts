// The parts that more than one sport has: a goal with its net behind it (soccer, hockey, handball, field hockey, lacrosse), a pair of upright posts with a
// crossbar (football, rugby, Gaelic football), the posts of Australian football, a flag on a pole. Every number is in feet, in the drawing's own frame.
import { bar, flat, mesh, n, plane, pole, polygon, threads, wall, type Plane, type Upright } from "./turn.kit.ts";

/** A goal with a net: the mouth on the line x, the net behind it. */
export interface GoalCage {
  id: string;
  /** Where the middle of the mouth stands on its goal line, and which way the net lies behind it: +1 to larger x, -1 to smaller. */
  x: number;
  y: number;
  out: 1 | -1;
  /** The mouth: its width across the surface and its height. */
  width: number;
  height: number;
  /** How far the net reaches behind the line at the ground, and at the top of the back. */
  depth: number;
  top: number;
  /** The frame's thickness, and the mesh's cell, in feet. */
  post: number;
  cell: number;
  /** The frame's paint: white, or red as a hockey goal's. */
  tone: "white" | "red";
}

/** The mesh over the side of a net, a trapezoid: the front edge is straight up, the back leans out from `top` at the head to `depth` at the ground. */
function sideMesh(depth: number, top: number, height: number, cell: number): string {
  const wide = Math.max(1, Math.round(depth / cell));
  const high = Math.max(1, Math.round(height / cell));
  let d = "";
  for (let i = 1; i < wide; i += 1) d += `M${n((top * i) / wide)} 0L${n((depth * i) / wide)} ${n(height)}`;
  for (let j = 1; j < high; j += 1) {
    const b = (height * j) / high;
    d += `M0 ${n(b)}H${n(top + ((depth - top) * j) / high)}`;
  }
  return d;
}

/** A goal: its mouth as three strips (two posts and the crossbar), and its net as four planes, framed. */
export function goalCage(g: GoalCage): Upright {
  const { id, x, y, out, width, height, depth, top, post, cell } = g;
  const half = width / 2;
  const cls = g.tone === "red" ? "u-red" : "u-white";
  const line = `class="u-frame u-frame-${g.tone}" stroke-width="${n(post * 0.7)}" fill="none" stroke-linejoin="round"`;
  const planes: Plane[] = [];
  // The mouth.
  planes.push(...pole(`${id}-post-a`, "post", x, y - half, 0, height, post, cls), ...pole(`${id}-post-b`, "post", x, y + half, 0, height, post, cls));
  planes.push(...bar(`${id}-bar`, "post", [x, y - half, height], [x, y + half, height], post, cls));
  // The two sides: a trapezoid hanging from the head, leaning out to the back.
  for (const [tag, ys] of [["a", y - half], ["b", y + half]] as const) {
    const shape = polygon([[0, 0], [top, 0], [depth, height], [0, height]]);
    planes.push(plane(`${id}-side-${tag}`, "goal", [x, ys, height], [out * depth, 0, 0], [0, 0, -height], `<path d="${shape}" class="u-netfill"/>${threads(sideMesh(depth, top, height, cell), cell)}<path d="${shape}" ${line}/>`));
  }
  // The back leans from the head's depth out to the ground's.
  const lean = out * (depth - top);
  planes.push(plane(`${id}-back`, "goal", [x + out * top, y - half, height], [0, width, 0], [lean, 0, -height], `<rect width="${n(width)}" height="${n(Math.hypot(lean, height))}" class="u-netfill"/>${threads(mesh(width, Math.hypot(lean, height), cell), cell)}<rect width="${n(width)}" height="${n(Math.hypot(lean, height))}" ${line}/>`));
  // The roof.
  planes.push(plane(`${id}-roof`, "goal", [x, y - half, height], [0, width, 0], [out * top, 0, 0], `<rect width="${n(width)}" height="${n(top)}" class="u-netfill"/>${threads(mesh(width, top, cell), cell)}<rect width="${n(width)}" height="${n(top)}" ${line}/>`));
  return { id, kind: "goal", at: [x, y], height, planes };
}

/** A pair of uprights with a crossbar between them, standing on the line x (a rugby, Gaelic football or football post). */
export interface PostPair {
  id: string;
  x: number;
  y: number;
  /** Which way is behind the goal line, for a post's support. */
  out: 1 | -1;
  /** The space between the two uprights, to the middle of each. */
  gap: number;
  /** The crossbar's height, and the uprights' top, above the surface. */
  crossbar: number;
  top: number;
  /** The strips' thickness. */
  post: number;
  /** `slingshot`: one support behind the goal, bent to carry the crossbar (a football post); `centre`: one pole straight under the crossbar's middle; `none`: the uprights alone. */
  support: "slingshot" | "centre" | "none";
  /** How far behind the goal line a slingshot's support stands. */
  stem?: number;
  /** The class of the paint: `u-yellow` for a football post, `u-white` for the others. */
  cls: string;
}

/** A pair of uprights, a crossbar, and the support under them. */
export function postPair(p: PostPair): Upright {
  const { id, x, y, gap, crossbar, top, post, cls } = p;
  const half = gap / 2;
  // A slingshot's uprights begin at the crossbar; the others stand on the ground.
  const from = p.support === "slingshot" ? crossbar : 0;
  const planes: Plane[] = [
    ...pole(`${id}-upright-a`, "post", x, y - half, from, top, post, cls),
    ...pole(`${id}-upright-b`, "post", x, y + half, from, top, post, cls),
    ...bar(`${id}-bar`, "post", [x, y - half, crossbar], [x, y + half, crossbar], post, cls),
  ];
  if (p.support === "slingshot") {
    const sx = x + p.out * (p.stem ?? 4);
    planes.push(...pole(`${id}-stem`, "stanchion", sx, y, 0, crossbar, post * 1.4, cls), ...bar(`${id}-neck`, "stanchion", [sx, y, crossbar], [x, y, crossbar], post, cls));
  } else if (p.support === "centre") planes.push(...pole(`${id}-stem`, "stanchion", x, y, 0, crossbar, post * 1.4, cls));
  return { id, kind: "goalposts", at: [x, y], height: top, low: crossbar, planes };
}

/** A flag on a pole, the flag lying along x. */
export function flagPole(id: string, x: number, y: number, height: number, post: number, cls = "u-white"): Plane[] {
  const flag = Math.max(height * 0.28, post * 3);
  return [
    ...pole(id, "pole", x, y, 0, height, post, cls),
    wall(`${id}-flag`, "flag", x, y, x + flag, y, height - flag * 0.7, height, `<path d="${polygon([[0, 0], [flag, flag * 0.35], [0, flag * 0.7]])}" class="u-flag"/>`),
  ];
}

/** A short rectangle lying flat, such as the foot of a stanchion or the shadow of a table: used where a pole needs a base. */
export function foot(id: string, x: number, y: number, w: number, d: number): Plane {
  return flat(id, "leg", x - w / 2, y - d / 2, x + w / 2, y + d / 2, 0.01, `<rect width="${n(w)}" height="${n(d)}" class="u-foot"/>`);
}
