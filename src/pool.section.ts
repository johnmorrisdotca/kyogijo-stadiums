// A side section of a swimming pool, drawn under its plan on the same scale along the pool: the water and its depth, the starting blocks and touch panels at the walls, the backstroke flags 5 m from each end, the
// false start rope 15 m from the starting end, a lane rope at the surface, and the least depth the rules ask for (1.35 m from 1 to 6 m from a wall with blocks, then the pool's own). Its height is exaggerated
// (`section.exaggerate`, 2.5 by default): a pool 50 m long and 2.5 m deep would be a sliver otherwise. Written in feet; the words are upright whatever the pool does.
import { el, num } from "./format.ts";
import { feet } from "./pool.ts";
import type { SwimPlan } from "./pool.ts";
import { SWIMMING } from "./pool.figures.ts";
import { textOn, ft, type BuildOptions } from "./surfaces/surface.ts";

/** The section: its markup and how far it reaches below `y0` (feet). */
export interface Section {
  markup: string;
  height: number;
  /** The id of the gradient its water uses, to define in the drawing's defs. */
  defs: string;
}

/**
 * The section of a pool whose water's surface is at `top` feet (in the drawing's frame, below the plan), for a pool that is `plan.length` long, aligned with the plan along x.
 */
export function sectionOf(plan: SwimPlan, o: Pick<BuildOptions, "portrait" | "features" | "exact" | "detail" | "id">, top: number): Section {
  const sec = plan.section;
  if (sec === undefined) return { markup: "", height: 0, defs: "" };
  const E = sec.exaggerate;
  const L = feet(plan.length);
  const v = (metres: number): number => feet(metres) * E;
  const depth = plan.depth;
  const surfaceY = top + v(SWIMMING.flags.height) + 4;
  const floorY = surfaceY + v(depth);
  const full = o.detail === "full";
  const turned = o.portrait;
  const gradient = `${o.id}-wd`;
  let out = "";
  const defs = plan.look === "flat" ? "" : el("linearGradient", { id: gradient, x1: 0, y1: 0, x2: 0, y2: 1 }, el("stop", { offset: 0, class: "ky-pl-sa" }) + el("stop", { offset: 1, class: "ky-pl-sc" }));
  // The ground under the section is the deck's colour; the water body between the walls.
  out += el("rect", { class: ft(o, "water", "ky-surface"), x: 0, y: surfaceY, width: L, height: floorY - surfaceY });
  if (plan.look !== "flat") out += el("rect", { class: "ky-pl-wg", x: 0, y: surfaceY, width: L, height: floorY - surfaceY, fill: `url(#${gradient})` });
  // The walls and the floor of the pool as a section: a thick line, with the deck level at the surface.
  const wall = 1.1;
  out += el("path", { class: ft(o, "gutter", "ky-pl-sw"), d: `M${num(-wall)} ${num(surfaceY - 0.6)}H0V${num(floorY)}H${num(L)}V${num(surfaceY - 0.6)}H${num(L + wall)}V${num(floorY + wall)}H${num(-wall)}Z` });
  // The least depth the rules ask for.
  const least = feet(SWIMMING.depth.atBlocks) * E;
  const blocksFrom = feet(SWIMMING.depth.blocksFrom);
  const blocksTo = feet(SWIMMING.depth.blocksTo);
  if (full) {
    const y = surfaceY + least;
    const d = `M${num(blocksFrom)} ${num(y)}H${num(blocksTo)}M${num(L - blocksTo)} ${num(y)}H${num(L - blocksFrom)}`;
    out += el("path", { class: "ky-line ky-pl-lm", d, "stroke-width": 0.35, "stroke-dasharray": "1.4 1", fill: "none" });
    out += textOn(turned, (blocksFrom + blocksTo) / 2, y - 0.9, `${SWIMMING.depth.atBlocks} m`, { size: 2, anchor: "middle", cls: "ky-pl-sx" });
  }
  // Blocks (0.5 to 0.75 m above the water) and touch panels (0.3 m above, 0.6 m below).
  const blockH = v(SWIMMING.block.height);
  const blockL = feet(SWIMMING.block.length) * 1.4;
  if (plan.blocks) {
    out += el("path", { class: "ky-pl-bk", d: `M${num(-blockL)} ${num(surfaceY)}V${num(surfaceY - blockH)}H${num(-blockL * 0.15)}L0 ${num(surfaceY - blockH * 0.8)}V${num(surfaceY)}ZM${num(L + blockL)} ${num(surfaceY)}V${num(surfaceY - blockH)}H${num(L + blockL * 0.15)}L${num(L)} ${num(surfaceY - blockH * 0.8)}V${num(surfaceY)}Z` });
  }
  if (plan.pads) {
    const above = v(SWIMMING.pad.above);
    const below = v(SWIMMING.pad.below);
    const w = 0.9;
    out += el("path", { class: "ky-pl-pad", d: `M0 ${num(surfaceY - above)}h${num(w)}V${num(surfaceY + below)}H0ZM${num(L)} ${num(surfaceY - above)}h${num(-w)}V${num(surfaceY + below)}H${num(L)}Z`, stroke: "none" });
  }
  // The backstroke flags: a rope 1.8 m up between two standards, with its flags, 5 m from each wall.
  if (plan.flags) {
    for (const x of [SWIMMING.flags.at, plan.length - SWIMMING.flags.at]) {
      const px = feet(x);
      const h = v(SWIMMING.flags.height);
      out += el("path", { class: "ky-line ky-pl-pole", d: `M${num(px)} ${num(surfaceY)}V${num(surfaceY - h)}`, "stroke-width": 0.4, fill: "none" });
      // Seen along the pool the rope is a point, and the flags hang from it in a row: one pennant is what is seen.
      if (full) out += el("path", { class: "ky-pl-fp", d: `M${num(px - 1.3)} ${num(surfaceY - h)}h2.6l${num(-1.3)} 3.1Z` });
      out += textOn(turned, px, surfaceY - h - 1.4, `${SWIMMING.flags.at} m`, { size: 2, anchor: "middle", cls: "ky-pl-sx" });
    }
  }
  // The false start rope: 1.2 m or more above the water, 15 m from the starting end.
  if (plan.falseStart) {
    const px = feet(SWIMMING.falseStart.at);
    const h = v(SWIMMING.falseStart.height);
    out += el("path", { class: "ky-line ky-pl-pole", d: `M${num(px)} ${num(surfaceY)}V${num(surfaceY - h)}`, "stroke-width": 0.4, fill: "none" });
    out += el("circle", { class: "ky-pl-fs", cx: px, cy: surfaceY - h, r: 0.8 });
    out += textOn(turned, px, surfaceY - h - 1.4, `${SWIMMING.falseStart.at} m`, { size: 2, anchor: "middle", cls: "ky-pl-sx" });
  }
  // A lane rope at the surface: its floats half under the water.
  out += el("path", { class: ft(o, ["lane-ropes", "rope-blue"], "ky-pl-r ky-pl-r-blue"), d: `M0 ${num(surfaceY)}H${num(L)}`, "stroke-width": 1.7, "stroke-dasharray": "0 1.45", fill: "none" });
  // The lane marking on the floor, and the depth.
  out += el("path", { class: "ky-line", d: `M${num(feet(SWIMMING.laneLine.endGap))} ${num(floorY - 0.3)}H${num(L - feet(SWIMMING.laneLine.endGap))}`, "stroke-width": 0.5, fill: "none" });
  const dx = -wall - 2.2;
  out += el("path", { class: "ky-line ky-pl-dm", d: `M${num(dx)} ${num(surfaceY)}V${num(floorY)}M${num(dx - 0.9)} ${num(surfaceY)}H${num(dx + 0.9)}M${num(dx - 0.9)} ${num(floorY)}H${num(dx + 0.9)}`, "stroke-width": 0.3, fill: "none" });
  out += textOn(turned, dx - 1.4, (surfaceY + floorY) / 2 + 0.7, `${num(depth)} m`, { size: 2.2, anchor: "end", cls: "ky-pl-sx" });
  return { markup: el("g", { class: "ky-pl-section" }, out), height: floorY + wall - top, defs };
}
