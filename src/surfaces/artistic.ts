import { el, num } from "../format.ts";
import { feet } from "../pool.ts";
import type { ArtisticPlan } from "../pool.ts";
import { box, deckMarkup, leastWidth, paintDefs, poolIds, waterMarkup, type PoolCtx } from "../pool.kit.ts";
import { ARTISTIC, SWIMMING } from "../pool.figures.ts";
import { GUTTER } from "./pool.ts";
import { atEnds, edges, ft, quarterTurn, textOn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/**
 * An artistic swimming area lying wide, from World Aquatics' rules (Part Seven, Article 12): 30 by 20 m for the Olympic Games and the World Championships (12.2.2), or the least, 25 by 15 m of which 12 by 12 m is the
 * deep part (12.1.1), the floor marked with contrasting lines in one direction along its length (12.1.3), the judges' (Technical Officials') platform not more than 2 m from the pool's edge (12.2.5) and the starting platform at centre
 * stage (12.1.7). The sizes of the two platforms are ours: the rules give their heights.
 */
export function artistic(o: BuildOptions, plan: ArtisticPlan, ctx: PoolCtx = {}): Surface {
  const L = plan.length;
  const W = plan.width;
  const ids = ctx.ids ?? poolIds(o.id);
  const full = o.detail === "full";
  const m = ctx.bare === true ? 0 : (o.margin ?? feet(ARTISTIC.drawn.deck));
  const judges = ARTISTIC.drawn.judges;
  const start = ARTISTIC.drawn.start;
  let base = box(o, "gutter", "ky-boards", -GUTTER, -GUTTER, L + GUTTER, W + GUTTER);
  base += waterMarkup(o, ids, plan.look, 0, 0, L, W);
  if (plan.deep !== undefined) {
    const d = plan.deep;
    base += el("rect", { class: ft(o, "deep-part", "ky-pl-dp"), x: feet(d.x), y: feet(d.y), width: feet(d.length), height: feet(d.width) });
  }
  // Lines in one direction along the pool, 2.5 m apart, ending 2 m short of the walls in a cross line, as the lane markings of a swimming pool do.
  const lw = leastWidth(o, ARTISTIC.line, 0.32);
  const count = Math.floor(W / SWIMMING.lane);
  const gap = SWIMMING.laneLine.endGap;
  const half = SWIMMING.laneLine.cross / 2;
  let d = "";
  for (let k = 0; k < count; k += 1) {
    const y = (W - (count - 1) * SWIMMING.lane) / 2 + k * SWIMMING.lane;
    d += `M${num(feet(gap))} ${num(feet(y))}H${num(feet(L - gap))}M${num(feet(gap))} ${num(feet(y - half))}V${num(feet(y + half))}M${num(feet(L - gap))} ${num(feet(y - half))}V${num(feet(y + half))}`;
  }
  let lines = el("path", { class: ft(o, "floor-lines", "ky-line"), d, "stroke-width": lw, fill: "none" });
  if (plan.deep !== undefined) {
    const dp = plan.deep;
    lines += el("rect", { class: "ky-line ky-pl-dpl", x: feet(dp.x), y: feet(dp.y), width: feet(dp.length), height: feet(dp.width), "stroke-width": lw * 0.6, "stroke-dasharray": `${num(feet(0.8))} ${num(feet(0.5))}`, fill: "none" });
    lines += textOn(o.portrait, feet(dp.x + dp.length / 2), feet(dp.y + dp.width / 2) + 1, `${ARTISTIC.minimum.deepDepth} m`, { size: feet(1.1), anchor: "middle", cls: "ky-pl-sx", weight: 800 });
  }
  // The judges' platform along the top side, close to the pool's edge, with its chairs; the starting platform at centre stage on the other side.
  let deck = "";
  const jy = -GUTTER - 1 - judges.depth;
  deck += el("rect", { class: ft(o, "judges-platform", "ky-pl-jp"), x: feet(L / 2 - judges.length / 2), y: feet(jy), width: feet(judges.length), height: feet(judges.depth), rx: feet(0.12) });
  if (full) {
    const chairs = 7;
    for (let i = 0; i < chairs; i += 1) deck += el("rect", { class: "ky-pl-ch", x: feet(L / 2 - judges.length / 2 + 0.5 + i * ((judges.length - 1) / chairs)), y: feet(jy + 0.3), width: feet(0.75), height: feet(0.75), rx: feet(0.1) });
  }
  const sx = L / 2 - start.length / 2;
  const sy = W + GUTTER + 0.4;
  deck += el("rect", { class: ft(o, "starting-platform", "ky-pl-sp2"), x: feet(sx), y: feet(sy), width: feet(start.length), height: feet(start.depth), rx: feet(0.12) });
  const marks: Mark[] = [];
  if (o.landmarks === true) {
    marks.push(
      { id: "floor-lines", x: feet(L * 0.3), y: feet(W / 2), side: "bottom" },
      { id: "floor-lines", x: feet(L * 0.7), y: feet(W / 2), side: "top" },
      { id: "judges-platform", x: feet(L / 2), y: feet(jy), side: "top" },
      { id: "starting-platform", x: feet(L / 2), y: feet(sy + start.depth), side: "bottom" },
      { id: "gutter", x: feet(L * 0.8), y: feet(-GUTTER / 2), side: "top" },
      { id: "gutter", x: feet(L * 0.2), y: feet(W + GUTTER / 2), side: "bottom" },
    );
    if (plan.deep !== undefined) marks.push({ id: "deep-part", x: feet(plan.deep.x + 1), y: feet(plan.deep.y), side: "top" });
  }
  const top = -jy + 0.4;
  const bottom = sy + start.depth + 0.4 - W;
  const view0 = { x: -m, y: -feet(top) - m * 0.4, w: feet(L) + 2 * m, h: feet(W) + feet(top + bottom) + m * 0.8 };
  base = (ctx.bare === true ? "" : deckMarkup(o, ids, plan.deck, view0.x, view0.y, view0.w, view0.h)) + base + deck;
  const Lf = feet(L);
  const Wf = feet(W);
  const cy = Wf / 2;
  const turned = o.portrait;
  const surface: Surface = {
    sport: "artisticswimming",
    view: view0,
    base,
    lines,
    defs: ctx.bare === true ? "" : paintDefs(ids, plan.look, plan.deck, plan.seed),
    left: { cx: -m / 2, cy, w: Wf, h: m, rot: -90 },
    right: { cx: Lf + m / 2, cy, w: Wf, h: m, rot: 90 },
    plate: turned ? { cx: Lf / 2, cy, w: Wf * 0.9, h: Lf * 0.34 } : { cx: Lf / 2, cy, w: Lf * 0.34, h: Wf * 0.55 },
    turned,
  };
  surface.box = { x: 0, y: 0, w: Lf, h: Wf };
  surface.lineRef = { width: lw, feet: 1 };
  surface.ranges = {
    half: atEnds((end) => (end === "left" ? edges(0, 0, Lf / 2, Wf) : edges(Lf / 2, 0, Lf, Wf))),
    // The middle third of the pool, where the athletes enter at centre stage and the routine is usually swum.
    "centre-stage": edges(Lf / 3, 0, (2 * Lf) / 3, Wf),
  };
  if (o.landmarks === true) surface.marks = marks;
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
