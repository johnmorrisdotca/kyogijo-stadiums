import { el, num } from "../format.ts";
import { feet } from "../pool.ts";
import type { SwimPlan } from "../pool.ts";
import { box, deckMarkup, leastWidth, paintDefs, poolIds, ropeMarkup, waterMarkup, type PoolCtx, type PoolIds } from "../pool.kit.ts";
import { raceArt } from "../pool.labels.ts";
import { sectionOf } from "../pool.section.ts";
import { SWIMMING } from "../pool.figures.ts";
import { atEnds, edges, ft, quarterTurn, textOn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/** The swimming pool lying wide, before its deck and view: the water and the gutter, and the lines, ropes and fixtures over them, in feet from the pool's top left corner. */
export interface SwimBody {
  /** The gutter and the water. */
  base: string;
  /** The markings on the floor, the ropes and the fixtures. */
  lines: string;
  /** The labels of the parts to name, in feet. */
  marks: Mark[];
  /** Where the lane markings end: kept for the lineRef. */
  line: number;
}

/** The gutter round the water, in metres: the width of the coping the pool is drawn with. */
export const GUTTER = 0.4;

/**
 * The body of a swimming pool: every figure is the rules' (`SWIMMING`, pool.figures.ts). The lane markings on the floor are 46 m (21 m in a 25 m pool) long and end 2 m from the walls in a cross line 1 m long (CR 16.2.15); a
 * cross line 0.5 m long at 15 m from each end; the touch panels 2.4 m wide at the walls with the target lines; the ropes in the rules' colours with red floats within 5 m of the walls and a mark at 15 m and 25 m;
 * the starting blocks with their lane numbers; the backstroke flags 5 m from each end, and the false start rope 15 m from the starting end.
 */
export function swimBody(o: BuildOptions, plan: SwimPlan, ids: PoolIds): SwimBody {
  const L = plan.length;
  const W = plan.width;
  const full = o.detail === "full";
  // Small fixtures are drawn a little larger than they stand, as lines are, unless the true sizes are asked for.
  const s = o.exact ? 1 : 1.5;
  let base = box(o, "gutter", "ky-boards", -GUTTER, -GUTTER, L + GUTTER, W + GUTTER);
  base += waterMarkup(o, ids, plan.look, 0, 0, L, W);

  let lines = "";
  const lw = leastWidth(o, SWIMMING.laneLine.width, 0.32);
  const marks: Mark[] = [];
  // Under pace bars the lanes are the whole race laid flat, not one length of the pool: the furniture that belongs to a length (floor lines and crosses, the marks at 15 m and 25 m, the red ends of the ropes,
  // flags, the false start rope, blocks and panels) is left off and the ropes are plain, so that the picture reads as a chart.
  const neutral = plan.race?.pace !== null && plan.race?.pace !== undefined;
  // The lane markings and their cross lines on the floor: a line along the middle of each lane, 2 m short of each wall, ending in a cross line 1 m long.
  const gap = SWIMMING.laneLine.endGap;
  const half = SWIMMING.laneLine.cross / 2;
  let d = "";
  let crosses = "";
  for (const lane of plan.lanes) {
    d += `M${num(feet(gap))} ${num(feet(lane.y))}H${num(feet(L - gap))}`;
    d += `M${num(feet(gap))} ${num(feet(lane.y - half))}V${num(feet(lane.y + half))}M${num(feet(L - gap))} ${num(feet(lane.y - half))}V${num(feet(lane.y + half))}`;
    if (full) for (const x of [SWIMMING.markAt15, L - SWIMMING.markAt15]) crosses += `M${num(feet(x))} ${num(feet(lane.y - SWIMMING.target.crossAt15 / 2))}V${num(feet(lane.y + SWIMMING.target.crossAt15 / 2))}`;
  }
  if (!neutral) lines += el("path", { class: ft(o, "lane-lines", "ky-line"), d: d + crosses, "stroke-width": lw, fill: "none" });
  // The touch panels on the end walls, 2.4 m wide in each lane, with the target line down the middle and its cross line.
  if (plan.pads && !neutral) {
    const depth = o.exact ? 0.05 : 0.3;
    const pad = SWIMMING.pad.width;
    let pads = "";
    let targets = "";
    for (const lane of plan.lanes) {
      for (const end of [0, 1]) {
        const x0 = end === 0 ? 0 : L - depth;
        pads += `M${num(feet(x0))} ${num(feet(lane.y - pad / 2))}h${num(feet(depth))}v${num(feet(pad))}h${num(feet(-depth))}Z`;
        const wall = end === 0 ? 0 : L;
        const inward = end === 0 ? 1 : -1;
        targets += `M${num(feet(wall))} ${num(feet(lane.y))}h${num(feet(inward * depth))}`;
        if (full) targets += `M${num(feet(wall + inward * depth * 0.5))} ${num(feet(lane.y - SWIMMING.target.cross / 2))}v${num(feet(SWIMMING.target.cross))}`;
      }
    }
    lines += el("path", { class: ft(o, "touch-pads", "ky-pl-pad"), d: pads });
    lines += el("path", { class: ft(o, "lane-lines", "ky-line"), d: targets, "stroke-width": lw * 0.85, fill: "none" });
  }
  // The ropes: floats in the lane's colour, red within 5 m of each wall, and a distinct run at 15 m and 25 m from the walls.
  const runs: [string, number, number, number][] = [];
  const red = SWIMMING.redEnds;
  const run = SWIMMING.markRun / 2;
  for (const rope of plan.ropes) {
    if (neutral) {
      runs.push(["white", 0, L, rope.y]);
      continue;
    }
    runs.push([rope.colour, red, L - red, rope.y]);
    runs.push(["red", 0, red, rope.y], ["red", L - red, L, rope.y]);
    const at = [SWIMMING.markAt15, L - SWIMMING.markAt15, ...(plan.course === "long" ? [SWIMMING.markAt25] : [])];
    for (const x of at) runs.push(["white", Math.max(0, x - run), Math.min(L, x + run), rope.y]);
  }
  lines += ropeMarkup(o, runs, SWIMMING.floatDiameter, 0.45);
  // The marks on the deck at 15 m (and 25 m) from the walls, and the standards of the flags: on both sides of the pool (CR 16.1.10).
  if (full && !neutral) {
    let ticks = "";
    for (const x of [SWIMMING.markAt15, L - SWIMMING.markAt15, ...(plan.course === "long" ? [SWIMMING.markAt25] : [])]) {
      for (const [y0, y1] of [[-GUTTER, 0], [W, W + GUTTER]] as const) ticks += `M${num(feet(x))} ${num(feet(y0))}V${num(feet(y1))}`;
    }
    lines += el("path", { class: ft(o, "lane-lines", "ky-line"), d: ticks, "stroke-width": feet(0.22), fill: "none" });
  }
  // The false start rope, 15 m from the starting end, on its standards.
  if (plan.falseStart && !neutral) {
    const x = SWIMMING.falseStart.at;
    lines += el("path", { class: ft(o, "false-start-rope", "ky-pl-fs"), d: `M${num(feet(x))} ${num(feet(-0.7))}V${num(feet(W + 0.7))}`, "stroke-width": feet(0.1) * s, fill: "none", "stroke-dasharray": `${num(feet(0.5))} ${num(feet(0.3))}` });
    if (full) for (const y of [-0.7, W + 0.7]) lines += el("circle", { class: "ky-pl-st", cx: feet(x), cy: feet(y), r: feet(0.22) * s });
  }
  // The backstroke flags: a rope across the pool 5 m from each wall, flags of two colours hanging from it.
  if (plan.flags && !neutral) {
    for (const x of [SWIMMING.flags.at, L - SWIMMING.flags.at]) {
      const fx = feet(x);
      lines += el("path", { class: ft(o, "backstroke-flags", "ky-pl-fa"), d: `M${num(fx)} ${num(feet(-0.6))}V${num(feet(W + 0.6))}`, "stroke-width": feet(0.26) * s, fill: "none", "stroke-dasharray": `${num(feet(0.4))} ${num(feet(0.4))}` });
      lines += el("path", { class: ft(o, "backstroke-flags", "ky-pl-fb2"), d: `M${num(fx)} ${num(feet(-0.6))}V${num(feet(W + 0.6))}`, "stroke-width": feet(0.26) * s, fill: "none", "stroke-dasharray": `0 ${num(feet(0.4))} ${num(feet(0.4))} 0` });
      if (full) for (const y of [-0.6, W + 0.6]) lines += el("circle", { class: "ky-pl-st", cx: fx, cy: feet(y), r: feet(0.22) * s });
    }
  }
  // The starting blocks, 0.5 by 0.6 m, one in each lane at each end, numbered on the top (CR 16.2.8 and 16.2.9).
  if (plan.blocks && !neutral) {
    const bw = SWIMMING.block.width * s;
    const bl = SWIMMING.block.length * s;
    let blocks = "";
    let numbers = "";
    for (const lane of plan.lanes) {
      for (const end of [0, 1]) {
        const x0 = end === 0 ? -0.08 - bl : L + 0.08;
        blocks += `M${num(feet(x0))} ${num(feet(lane.y - bw / 2))}h${num(feet(bl))}v${num(feet(bw))}h${num(feet(-bl))}Z`;
        if (full) numbers += textOn(o.portrait, feet(x0 + bl / 2), feet(lane.y) + feet(bw) * 0.32, String(lane.number), { size: feet(bw) * 0.72, anchor: "middle", cls: "ky-pl-bn", weight: 800 });
      }
    }
    lines += el("path", { class: ft(o, "starting-blocks", "ky-pl-bk"), d: blocks });
    lines += numbers;
  }
  if (o.landmarks === true) {
    const top = plan.lanes[0];
    const mid = plan.lanes[Math.floor(plan.lanes.length / 2)];
    const ropeY = plan.ropes[1]?.y ?? plan.ropes[0].y;
    marks.push({ id: "lane-rope", x: feet(L * 0.62), y: feet(ropeY), side: "top" });
    if (!neutral) {
      marks.push(
        { id: "lane-line", x: feet(L * 0.35), y: feet(mid.y), side: "bottom" },
        { id: "lane-end-cross", x: feet(SWIMMING.laneLine.endGap), y: feet(top.y), side: "top" },
        { id: "fifteen-metre-mark", x: feet(SWIMMING.markAt15), y: 0, side: "top" },
      );
    }
    if (plan.pads && !neutral) marks.push({ id: "touch-pad", x: feet(0.15), y: feet(plan.lanes[plan.lanes.length - 1].y), side: "bottom" });
    if (plan.blocks && !neutral) marks.push({ id: "starting-block", x: feet(-0.6), y: feet(plan.lanes[plan.lanes.length - 1].y), side: "bottom" });
    if (plan.flags && !neutral) marks.push({ id: "backstroke-flags", x: feet(SWIMMING.flags.at), y: feet(W), side: "bottom" });
    if (plan.falseStart && !neutral) marks.push({ id: "false-start-rope", x: feet(SWIMMING.falseStart.at), y: feet(W), side: "bottom" });
    marks.push({ id: "gutter", x: feet(L * 0.8), y: feet(W + GUTTER / 2), side: "bottom" });
  }
  return { base, lines, marks, line: lw };
}

/**
 * A swimming pool lying wide with its deck: the body, the deck round it in the colour or the tiles asked for, the data of a race at the walls and over the water, and a side section under the plan if
 * it is asked for. The pool's water is the surface's `box`; the deck is the margin.
 */
export function swimming(o: BuildOptions, plan: SwimPlan, ctx: PoolCtx = {}): Surface {
  const L = feet(plan.length);
  const W = feet(plan.width);
  const ids = ctx.ids ?? poolIds(o.id);
  const m = ctx.bare === true ? 0 : (o.margin ?? feet(SWIMMING.deck));
  const body = swimBody(o, plan, ids);
  const art = ctx.bare === true ? raceArt({ ...plan, race: undefined }, o) : raceArt(plan, o);
  const section = ctx.bare === true ? sectionOf({ ...plan, section: undefined }, o, 0) : sectionOf(plan, o, W + feet(GUTTER) + m);
  // The view: the deck all round, the plates at the walls, the title or the distances above, the section below.
  // The depth of a section is written to the left of it.
  const left = m + Math.max(art.reachLeft, section.height > 0 ? feet(4) : 0);
  const right = m + art.reachRight;
  const topExtra = Math.max(0, art.reachTop, plan.race?.event === undefined ? 0 : feet(1.6));
  const view0 = { x: -left, y: -m - topExtra, w: L + left + right, h: W + 2 * m + topExtra + (section.height > 0 ? section.height + feet(0.6) : 0) };
  const defs = ctx.bare === true ? "" : paintDefs(ids, plan.look, plan.deck, plan.seed) + section.defs;
  const basis = (ctx.bare === true ? "" : deckMarkup(o, ids, plan.deck, view0.x, view0.y, view0.w, view0.h)) + body.base;
  let lines = body.lines + art.pace + art.left + art.right + art.top;
  if (section.markup !== "") lines += section.markup;
  const turned = o.portrait;
  const cy = W / 2;
  // How far the blocks reach beyond the walls, in feet.
  const blockReach = feet(0.08 + SWIMMING.block.length * (o.exact ? 1 : 1.5));
  const plate = turned ? { cx: L / 2, cy, w: W * 0.9, h: L * 0.34 } : { cx: L / 2, cy, w: L * 0.34, h: W * 0.62 };
  const surface: Surface = {
    sport: "swimming",
    view: view0,
    base: basis,
    lines,
    defs,
    // The teams' names stand on the deck beyond the blocks.
    left: { cx: -(blockReach + (m - blockReach) / 2), cy, w: W, h: Math.max(1, m - blockReach), rot: -90 },
    right: { cx: L + blockReach + (m - blockReach) / 2, cy, w: W, h: Math.max(1, m - blockReach), rot: 90 },
    plate,
    turned,
  };
  surface.box = { x: 0, y: 0, w: L, h: W };
  surface.lineRef = { width: body.line, feet: 1 };
  surface.ranges = {
    half: atEnds((end) => (end === "left" ? edges(0, 0, L / 2, W) : edges(L / 2, 0, L, W))),
    "pool-end": atEnds((end) => (end === "left" ? edges(0, 0, feet(15), W) : edges(L - feet(15), 0, L, W))),
  };
  if (o.landmarks === true) surface.marks = o.detail === "full" ? body.marks : body.marks.filter((mark) => !["lane-end-cross", "fifteen-metre-mark"].includes(mark.id));
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
