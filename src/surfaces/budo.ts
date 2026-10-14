// A budō surface lying wide, from its plan (budo/plan.ts): the floor and the free zone, the mats in their tones with their heri and their seams, the walls, the clay and the straw of a dohyō, the tape,
// the targets. The plan is in metres; the drawing is in feet, as every surface lies, so the whole is drawn inside a group that scales metres to feet and moves the surface's box to the origin.
import { el } from "../format.ts";
import { areaD, marks, strokes } from "./field.ts";
import type { BudoPlan, MBox, MRange } from "../budo/plan.ts";
import { atEnds, edges, ft, quarterTurn, type BuildOptions, type Mark, type Surface, type SurfaceRanges } from "./surface.ts";

/** Feet in a metre. */
export const K = 1 / 0.3048;

const feetBox = (b: MBox, ox: number, oy: number): { x: number; y: number; w: number; h: number } => edges((b.x0 - ox) * K, (b.y0 - oy) * K, (b.x1 - ox) * K, (b.y1 - oy) * K);

/** A plan's named range in feet, as a surface lists them. */
function rangeOf(r: MRange, ox: number, oy: number): SurfaceRanges[string] {
  return "left" in r ? atEnds((end) => feetBox(end === "left" ? r.left : r.right, ox, oy)) : feetBox(r, ox, oy);
}

/** The surface of the plan lying wide. `margin` is the ground round what is drawn, in feet. */
export function budoSurface(o: BuildOptions, plan: BudoPlan, margin: number): Surface {
  const ox = plan.box.x0;
  const oy = plan.box.y0;
  const full = o.detail === "full";
  const view0 = { x: (plan.extent.x0 - ox) * K - margin, y: (plan.extent.y0 - oy) * K - margin, w: (plan.extent.x1 - plan.extent.x0) * K + 2 * margin, h: (plan.extent.y1 - plan.extent.y0) * K + 2 * margin };
  const place = `scale(${K.toFixed(6)}) translate(${(-ox).toFixed(4)} ${(-oy).toFixed(4)})`;
  const group = (inner: string, cls?: string): string => el("g", { class: cls, transform: place }, inner);
  const turned = o.portrait;
  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  let ground = "";
  for (const a of plan.areas) ground += el("path", { class: ft(o, a.feature, a.cls), d: areaD(a), "fill-rule": a.evenodd === true ? "evenodd" : undefined });
  base += group(ground, "ky-bud-ground");
  const thick = o.exact ? plan.lineWidth : plan.drawnLine;
  // The seams are the plan's finest lines: left out of a drawing that asks for the simple detail.
  const shown = full ? plan : { ...plan, shapes: plan.shapes.filter((s) => s.feature !== "seams" && s.feature !== "boards") };
  const lines = group(strokes(shown, o) + marks(shown, o), "ky-bud-lines");
  const W = (plan.box.x1 - plan.box.x0) * K;
  const H = (plan.box.y1 - plan.box.y0) * K;
  const cx = (plan.centre.x - ox) * K;
  const cy = (plan.centre.y - oy) * K;
  // The score's board lies on the middle of the surface; the teams are named on it, not painted on the mats.
  const plateW = Math.min(W * 0.52, 190);
  // The names a score paints (kyūdō's and a dojo's: the others have a board): on the shajō's floor and over the yamichi, or either side of the middle.
  const kyu = plan.kyudo;
  const places = kyu === undefined ? { left: { cx: W * 0.27, cy: H / 2, w: W * 0.2, h: H * 0.11, rot: 0 }, right: { cx: W * 0.73, cy: H / 2, w: W * 0.2, h: H * 0.11, rot: 0 } } : { left: { cx: ((kyu.shajo.x0 + kyu.shajo.x1) / 2 - ox) * K, cy: H * 0.3, w: (kyu.shajo.x1 - kyu.shajo.x0) * K * 0.5, h: H * 0.09, rot: 0 }, right: { cx: ((kyu.yamichi.x0 + kyu.yamichi.x1) / 2 + (kyu.yamichi.x1 - kyu.yamichi.x0) / 4 - ox) * K, cy: (((kyu.yamichi.y0 + kyu.yamichi.y1) / 2) - oy) * K, w: (kyu.yamichi.x1 - kyu.yamichi.x0) * K * 0.3, h: H * 0.09, rot: 0 } };
  const surface: Surface = {
    sport: plan.sport,
    view: view0,
    base,
    lines,
    defs: "",
    left: places.left,
    right: places.right,
    plate: { cx, cy, w: plateW, h: plateW * 0.55 },
    turned,
    bannersOver: true,
    onColour: false,
    centreRadius: plan.centre.r * K,
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
