// The skating rink's surface lying wide, from its plan (skating/plan.ts): the ice, the floor of the infield, the warm-up lane, the padding, the boards, the furniture, then every painted line and the
// blocks. The plan is in metres; the drawing is in feet, as every surface lies, so the whole is drawn inside a group that scales metres to feet and moves the rink's box to the origin.
import { el } from "../format.ts";
import { areaD, marks, strokes } from "./field.ts";
import type { MBox, MRange, SkatingPlan } from "../skating/plan.ts";
import { atEnds, edges, ft, quarterTurn, type BuildOptions, type Mark, type Surface, type SurfaceRanges } from "./surface.ts";

/** Feet in a metre. */
export const K = 1 / 0.3048;

const feetBox = (b: MBox, ox: number, oy: number): { x: number; y: number; w: number; h: number } => edges((b.x0 - ox) * K, (b.y0 - oy) * K, (b.x1 - ox) * K, (b.y1 - oy) * K);

/** A plan's named range in feet, as a surface lists them. */
function rangeOf(r: MRange, ox: number, oy: number): SurfaceRanges[string] {
  return "left" in r ? atEnds((end) => feetBox(end === "left" ? r.left : r.right, ox, oy)) : feetBox(r, ox, oy);
}

/** The surface of the plan lying wide. `margin` is the ground round what is drawn, in feet. */
export function skatingSurface(o: BuildOptions, plan: SkatingPlan, margin: number): Surface {
  const ox = plan.box.x0;
  const oy = plan.box.y0;
  const full = o.detail === "full";
  const view0 = { x: (plan.extent.x0 - ox) * K - margin, y: (plan.extent.y0 - oy) * K - margin, w: (plan.extent.x1 - plan.extent.x0) * K + 2 * margin, h: (plan.extent.y1 - plan.extent.y0) * K + 2 * margin };
  const place = `scale(${K.toFixed(6)}) translate(${(-ox).toFixed(4)} ${(-oy).toFixed(4)})`;
  const group = (inner: string, cls?: string): string => el("g", { class: cls, transform: place }, inner);
  const turned = o.portrait;
  // Under everything: the apron, then the ice, the floor, the warm-up lane, the padding and the furniture, in the plan's order.
  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  let ground = "";
  for (const a of plan.areas) ground += el("path", { class: ft(o, a.feature, a.cls), d: areaD(a), "fill-rule": a.evenodd === true ? "evenodd" : undefined });
  base += group(ground, "ky-ska-ground");
  const thick = o.exact ? plan.lineWidth : plan.drawnLine;
  const lines = group(strokes(plan, o) + marks(plan, o), "ky-ska-lines");
  const W = (plan.box.x1 - plan.box.x0) * K;
  const H = (plan.box.y1 - plan.box.y0) * K;
  const surface: Surface = {
    sport: "skating",
    view: view0,
    base,
    lines,
    defs: "",
    // A team's name, in a score, is written on the ice either side of the middle.
    left: { cx: W * 0.27, cy: H / 2, w: W * 0.2, h: H * 0.11, rot: 0 },
    right: { cx: W * 0.73, cy: H / 2, w: W * 0.2, h: H * 0.11, rot: 0 },
    plate: { cx: W / 2, cy: H / 2, w: Math.min(W * 0.34, 140), h: Math.min(W * 0.34, 140) * 0.52 },
    turned,
    bannersOver: true,
    onColour: false,
  };
  surface.box = { x: 0, y: 0, w: W, h: H };
  surface.lineRef = { width: thick, feet: K };
  const ranges: Record<string, SurfaceRanges[string]> = {};
  for (const [name, r] of Object.entries(plan.ranges)) ranges[name] = rangeOf(r, ox, oy);
  surface.ranges = ranges;
  if (o.landmarks === true) {
    const m: Mark[] = plan.marks.map((p) => ({ id: p.id, x: (p.x - ox) * K, y: (p.y - oy) * K, side: p.side }));
    surface.marks = full ? m : m.filter((p) => !p.id.startsWith("~"));
  }
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
