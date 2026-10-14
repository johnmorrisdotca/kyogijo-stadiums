import { el, num } from "../format.ts";
import { feet } from "../pool.ts";
import type { Board, DivePlan } from "../pool.ts";
import { box, deckMarkup, leastWidth, paintDefs, poolIds, waterMarkup, type PoolCtx } from "../pool.kit.ts";
import { DIVING, DIVING_LINES } from "../pool.figures.ts";
import { textWidth } from "../text.ts";
import { GUTTER } from "./pool.ts";
import { edges, ft, quarterTurn, textOn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/** The name a board goes by in the words of the landmarks. */
const markId = (b: Board): string => (b.kind === "springboard" ? `springboard-${b.height}m` : `platform-${String(b.height).replace(".", "-")}m`);

/**
 * A diving well seen from above, from World Aquatics' rules (Part Four, Article 15 and Appendix 2): the pool wall the boards stand at on the left, the diving direction towards the right. Every springboard is 4.88 m
 * long and 0.50 m wide with its front edge, the plummet, 2.22 m beyond the wall; each platform has the length and width of the table, its front edge 0.75 to 1.50 m beyond the wall (15.4.9); the boards stand the preferred
 * distance (Appendix 2, B and C) from the side wall and from each other. The three lines across the well (15.6.3.1) are 21 m long, 2.5 m apart, the first under the plummet of the 3 m springboard.
 */
export function diving(o: BuildOptions, plan: DivePlan, ctx: PoolCtx = {}): Surface {
  const L = plan.length;
  const W = plan.width;
  const ids = ctx.ids ?? poolIds(o.id);
  const full = o.detail === "full";
  const m = ctx.bare === true ? 0 : (o.margin ?? feet(2.5));
  // The stands, and the names of the springboards on the deck behind them, stand in the room behind the wall.
  const behind = plan.behind + 4;
  let base = box(o, "gutter", "ky-boards", -GUTTER, -GUTTER, L + GUTTER, W + GUTTER);
  base += waterMarkup(o, ids, plan.look, 0, 0, L, W);
  // The three lines across the well, under the plummet of the 3 m springboard and 2.5 m apart.
  const three = plan.boards.find((b) => b.kind === "springboard" && b.height === 3);
  const first = three?.x ?? DIVING.A.springboard3[1];
  const lw = leastWidth(o, DIVING.lines.width, 0.32);
  let lines = "";
  let floor = "";
  const y0 = (W - DIVING.lines.length) / 2;
  for (let k = 0; k < DIVING_LINES; k += 1) floor += `M${num(feet(first + k * DIVING.lines.apart))} ${num(feet(y0))}V${num(feet(y0 + DIVING.lines.length))}`;
  lines += el("path", { class: ft(o, "lane-lines", "ky-line"), d: floor, "stroke-width": lw, fill: "none" });
  // The stands behind the wall: one block under the platforms, a pedestal under each springboard.
  const platforms = plan.boards.filter((b) => b.kind === "platform");
  let stands = "";
  if (platforms.length > 0) {
    const ya = Math.min(...platforms.map((b) => b.y - b.width / 2)) - 0.5;
    const yb = Math.max(...platforms.map((b) => b.y + b.width / 2)) + 0.5;
    const xa = -Math.max(...platforms.map((b) => b.length - b.x)) - 0.4;
    stands += el("rect", { class: ft(o, "stands", "ky-pl-sd"), x: feet(xa), y: feet(ya), width: feet(-xa), height: feet(yb - ya), rx: feet(0.2) });
  }
  const springboards = plan.boards.filter((one) => one.kind === "springboard");
  const springStand = springboards.length === 0 ? 0 : Math.min(...springboards.map((b) => b.x - b.length)) - 0.4;
  if (springboards.length > 0) {
    const ya = Math.min(...springboards.map((b) => b.y)) - 1.1;
    const yb = Math.max(...springboards.map((b) => b.y)) + 1.1;
    stands += el("rect", { class: ft(o, "stands", "ky-pl-sd"), x: feet(springStand), y: feet(ya), width: feet(-springStand), height: feet(yb - ya), rx: feet(0.2) });
  }
  base += stands;
  // The boards: a platform is a rectangle with its front edge over the water; a springboard is a bar reaching out from its stand. Tall ones over the low.
  let boards = "";
  let labels = "";
  const size = feet(0.95);
  const ordered = [...plan.boards].sort((a, b) => (a.kind === b.kind ? a.height - b.height : a.kind === "platform" ? -1 : 1));
  for (const b of ordered) {
    const x0 = b.x - b.length;
    if (b.kind === "platform") {
      boards += el("rect", { class: ft(o, "platforms", "ky-pl-pf"), x: feet(x0), y: feet(b.y - b.width / 2), width: feet(b.length), height: feet(b.width), rx: feet(0.1) });
      if (full) boards += el("path", { class: "ky-line ky-pl-fe", d: `M${num(feet(b.x))} ${num(feet(b.y - b.width / 2))}V${num(feet(b.y + b.width / 2))}`, "stroke-width": feet(0.12), fill: "none" });
      // Turned back upright on a tall drawing, the word lies across the platform's width: it is made to fit.
      const text = `${String(b.height)} m`;
      const fit = o.portrait ? Math.min(size, (feet(b.width) * 0.9) / textWidth(text)) : size;
      labels += textOn(o.portrait, feet(b.x - Math.min(2.2, b.length * 0.4)), feet(b.y) + fit * 0.36, text, { size: fit, anchor: "middle", cls: "ky-pl-bt", weight: 800 });
    } else {
      boards += el("rect", { class: ft(o, "springboards", "ky-pl-spb"), x: feet(x0), y: feet(b.y - b.width / 2), width: feet(b.length), height: feet(b.width), rx: feet(0.12) });
      // The name stands on the deck behind the springboards' stand, level with the board; turned upright on a tall drawing it is made to fit between two boards.
      const word = `${b.height} m`;
      const fit = o.portrait ? Math.min(size * 0.9, (feet(DIVING.C.springboard1[0]) * 0.92) / textWidth(word)) : size * 0.9;
      labels += textOn(o.portrait, feet(springStand - 0.4), feet(b.y) + fit * 0.36, word, { size: fit, anchor: o.portrait ? "middle" : "end", cls: "ky-pl-bu", weight: 800 });
    }
    // The plummet: the vertical line through the middle of the front edge.
    if (full) boards += el("circle", { class: "ky-pl-pm", cx: feet(b.x), cy: feet(b.y), r: feet(0.14) });
  }
  lines += boards + labels;
  const marks: Mark[] = [];
  if (o.landmarks === true) {
    const seen = new Set<string>();
    for (const b of plan.boards) {
      const id = markId(b);
      if (seen.has(id)) continue;
      seen.add(id);
      marks.push({ id, x: feet(b.x), y: feet(b.y - (b.kind === "platform" ? b.width / 2 : b.width)), side: "top" });
    }
    marks.push({ id: "diving-line", x: feet(first + DIVING.lines.apart), y: feet(y0 + DIVING.lines.length), side: "bottom" });
  }
  const view0 = { x: -feet(behind) - m, y: -m - feet(GUTTER), w: feet(L + behind) + 2 * m, h: feet(W) + 2 * m + 2 * feet(GUTTER) };
  if (ctx.bare !== true) base = deckMarkup(o, ids, plan.deck, view0.x, view0.y, view0.w, view0.h) + base;
  const Lf = feet(L);
  const Wf = feet(W);
  const cy = Wf / 2;
  const turned = o.portrait;
  const surface: Surface = {
    sport: "diving",
    view: view0,
    base,
    lines,
    defs: ctx.bare === true ? "" : paintDefs(ids, plan.look, plan.deck, plan.seed),
    left: { cx: -feet(behind) - m / 2, cy, w: Wf, h: m, rot: -90 },
    right: { cx: Lf + m / 2, cy, w: Wf, h: m, rot: 90 },
    plate: turned ? { cx: Lf * 0.62, cy, w: Wf * 0.9, h: Lf * 0.3 } : { cx: Lf * 0.62, cy, w: Lf * 0.34, h: Wf * 0.5 },
    turned,
  };
  surface.box = { x: 0, y: 0, w: Lf, h: Wf };
  surface.lineRef = { width: lw, feet: 1 };
  // Where the springboards stand and where the platforms: split between the last springboard and the first platform.
  const sb = plan.boards.filter((b) => b.kind === "springboard");
  const pf = plan.boards.filter((b) => b.kind === "platform");
  const split = sb.length > 0 && pf.length > 0 ? (Math.max(...sb.map((b) => b.y)) + Math.min(...pf.map((b) => b.y - b.width / 2))) / 2 : W / 2;
  surface.ranges = {
    springboards: edges(0, 0, Lf * 0.55, feet(split)),
    platforms: edges(0, feet(split), Lf * 0.55, Wf),
  };
  if (o.landmarks === true) surface.marks = marks;
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
