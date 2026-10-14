import { el, num } from "../format.ts";
import { feet } from "../pool.ts";
import type { PoloPlan } from "../pool.ts";
import { box, deckMarkup, leastWidth, paintDefs, poolIds, ropeMarkup, waterMarkup, type PoolCtx } from "../pool.kit.ts";
import { WATER_POLO } from "../pool.figures.ts";
import { GUTTER } from "./pool.ts";
import { atEnds, edges, ft, quarterTurn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/** The space behind each goal line where the goal's net hangs, in metres (CR 18.3.5): the pool is the field of play, 25 m between the goal lines (CR 18.1.2), and this behind each of them. */
export const POLO_BEHIND = WATER_POLO.goal.netClear;

/**
 * A water polo field of play lying wide, from World Aquatics' rules: 25 by 20 m between the goal lines; lane ropes along both sides whose floats are white at the goal line and the half distance line, red to
 * the 2 m mark, yellow from 2 to 6 m and green from 6 m to the half distance line, with a red mark at 5 m (CR 18.3.1 and Appendix 4, 20.4.1.5); the 2 m lines from the goal posts that make the goal areas
 * (20.4.1.2); the goals, 3 m between the posts (18.3.3); the re-entry area 2.0 by 1.08 m in each corner on the side away from the official table (18.3.4); the referees' platforms 1 m wide along both sides, coloured
 * as the ropes are (18.3.2); the official table and the area for flying substitutions on the side of the benches (18.1.8).
 */
export function waterPolo(o: BuildOptions, plan: PoloPlan, ctx: PoolCtx = {}): Surface {
  const Lp = plan.length;
  const W = plan.width;
  const b = POLO_BEHIND;
  const ids = ctx.ids ?? poolIds(o.id);
  const full = o.detail === "full";
  const m = ctx.bare === true ? 0 : (o.margin ?? feet(WATER_POLO.deck));
  const platform = WATER_POLO.platform.width;
  const down = plan.table === "bottom";
  // The goal lines stand 0.30 m in from the walls; the marks are measured from them.
  const g0 = b;
  const g1 = Lp - b;
  const at = (d: number, from: "left" | "right"): number => (from === "left" ? g0 + d : g1 - d);
  const deckTop = GUTTER + platform;
  const deckBottom = GUTTER + platform + (down ? WATER_POLO.table.depth + 0.6 : 0);

  let base = box(o, "gutter", "ky-boards", -GUTTER, -GUTTER, Lp + GUTTER, W + GUTTER);
  base += waterMarkup(o, ids, plan.look, 0, 0, Lp, W);

  // The referees' platforms along both sides, in the colours of the ropes by distance from the goal line.
  const bands: [string, number, number][] = [
    ["red", 0, WATER_POLO.twoMetre],
    ["yellow", WATER_POLO.twoMetre, WATER_POLO.sixMetre],
    ["green", WATER_POLO.sixMetre, WATER_POLO.half],
  ];
  let walk = "";
  for (const [y0, y1] of [[-GUTTER - platform, -GUTTER], [W + GUTTER, W + GUTTER + platform]] as const) {
    for (const [colour, a, z] of bands) {
      for (const from of ["left", "right"] as const) {
        const x0 = from === "left" ? at(a, "left") : at(z, "right");
        const x1 = from === "left" ? at(z, "left") : at(a, "right");
        walk += el("rect", { class: ft(o, "referee-platforms", `ky-pl-rp ky-pl-rp-${colour}`), x: feet(x0), y: feet(y0), width: feet(x1 - x0), height: feet(y1 - y0) });
      }
    }
  }
  base += walk;

  let lines = "";
  const thin = leastWidth(o, 0.06, 0.12);
  // The lines across the field: the goal lines and the half distance line white, the 2 m line red, the 5 m line a dashed red one (a red mark at 5 m), the 6 m line yellow.
  const across = (cls: string, colour: string, x: number, dash?: string, w = thin): string => el("path", { class: ft(o, cls, `ky-pl-wl ky-pl-wl-${colour}`), d: `M${num(feet(x))} 0V${num(feet(W))}`, "stroke-width": w, "stroke-dasharray": dash, fill: "none" });
  lines += across("goal-lines", "white", g0, undefined, thin * 1.4) + across("goal-lines", "white", g1, undefined, thin * 1.4) + across("half-distance-line", "white", Lp / 2, undefined, thin * 1.4);
  for (const from of ["left", "right"] as const) {
    lines += across("two-metre-lines", "red", at(WATER_POLO.twoMetre, from));
    lines += across("six-metre-lines", "yellow", at(WATER_POLO.sixMetre, from));
    lines += across("five-metre-marks", "red", at(WATER_POLO.fiveMetre, from), `${num(feet(0.5))} ${num(feet(0.5))}`);
  }
  // The goal areas: red lines 2 m long from the outer faces of the goal posts (Appendix 4, 20.4.1.2).
  const post = WATER_POLO.goal.post;
  const half = WATER_POLO.goal.width / 2;
  for (const from of ["left", "right"] as const) {
    const x0 = at(0, from);
    const x1 = at(WATER_POLO.goalAreaLine, from);
    for (const side of [-1, 1]) {
      const y = W / 2 + side * (half + post);
      lines += el("path", { class: ft(o, "goal-area-lines", "ky-pl-wl ky-pl-wl-red"), d: `M${num(feet(x0))} ${num(feet(y))}H${num(feet(x1))}`, "stroke-width": thin, fill: "none" });
    }
  }
  // The re-entry areas, 2.0 m along the goal line and 1.08 m into the field, in each corner on the side away from the table.
  const away = down ? 0 : W;
  const dirY = down ? 1 : -1;
  for (const from of ["left", "right"] as const) {
    const x0 = at(0, from);
    const x1 = at(WATER_POLO.reEntry.depth, from);
    const xa = Math.min(x0, x1);
    const ya = Math.min(away, away + dirY * WATER_POLO.reEntry.length);
    lines += el("rect", { class: ft(o, "re-entry-areas", "ky-pl-ra"), x: feet(xa), y: feet(ya), width: feet(Math.abs(x1 - x0)), height: feet(WATER_POLO.reEntry.length) });
  }
  // The lane ropes along the sides: white to the goal line, then red, yellow and green, with the red mark at 5 m, and white at the half distance line.
  const runs: [string, number, number, number][] = [];
  const inset = 0.1;
  for (const y of [inset, W - inset]) {
    runs.push(["white", 0, g0, y], ["white", g1, Lp, y]);
    for (const [colour, a, z] of bands) {
      runs.push([colour, at(a, "left"), at(z, "left"), y]);
      runs.push([colour, at(z, "right"), at(a, "right"), y]);
    }
    runs.push(["white", Lp / 2 - 0.45, Lp / 2 + 0.45, y]);
    for (const from of ["left", "right"] as const) {
      runs.push(["white", at(0, from) - 0.3, at(0, from) + 0.3, y]);
      runs.push(["red", at(WATER_POLO.fiveMetre, from) - 0.3, at(WATER_POLO.fiveMetre, from) + 0.3, y]);
    }
  }
  lines += ropeMarkup(o, runs, WATER_POLO.rope, 0.42);
  // The goals: two posts and the crossbar between them on each goal line, white, with the net behind the line. The posts and the bar are drawn thicker than they stand, as the lines are.
  const drawn = o.exact ? post : Math.max(post, 0.32);
  for (const from of ["left", "right"] as const) {
    const x = at(0, from);
    const inward = from === "left" ? 1 : -1;
    lines += el("path", { class: ft(o, "goals", "ky-pl-gn"), d: `M${num(feet(x))} ${num(feet(W / 2 - half))}h${num(feet(-inward * b))}v${num(feet(2 * half))}h${num(feet(inward * b))}`, "stroke-width": feet(0.09), fill: "none" });
    lines += el("path", { class: ft(o, "goals", "ky-pl-gb"), d: `M${num(feet(x))} ${num(feet(W / 2 - half))}V${num(feet(W / 2 + half))}`, "stroke-width": feet(drawn) * 0.8, fill: "none" });
    for (const side of [-1, 1]) {
      const y = W / 2 + side * (half + post / 2);
      lines += el("rect", { class: ft(o, "goal-posts", "ky-pl-gp"), x: feet(x - drawn / 2 - (inward * drawn) / 2 + (inward * drawn) / 2), y: feet(y - drawn / 2), width: feet(drawn), height: feet(drawn), rx: feet(drawn) * 0.12 });
    }
  }
  // The official table and the flying substitution areas on the side of the benches.
  if (down) {
    const t = WATER_POLO.table;
    base += el("rect", { class: ft(o, "official-table", "ky-pl-tb"), x: feet(Lp / 2 - t.length / 2), y: feet(W + GUTTER + platform + 0.5), width: feet(t.length), height: feet(t.depth), rx: feet(0.12) });
  }
  const sub = WATER_POLO.substitution;
  if (full) {
    const y0 = down ? W + GUTTER + platform : -GUTTER - platform - sub;
    base += el("rect", { class: ft(o, "substitution-areas", "ky-pl-sa-l"), x: feet(g0), y: feet(y0), width: feet(Lp / 2 - g0), height: feet(sub) });
    base += el("rect", { class: ft(o, "substitution-areas", "ky-pl-sa-r"), x: feet(Lp / 2), y: feet(y0), width: feet(g1 - Lp / 2), height: feet(sub) });
  }
  // The names of the parts, for a drawing that labels them.
  const marks: Mark[] = [];
  if (o.landmarks === true) {
    marks.push(
      { id: "goal-line", x: feet(g0), y: 0, side: "top" },
      { id: "two-metre-line", x: feet(at(WATER_POLO.twoMetre, "left")), y: feet(W), side: "bottom" },
      { id: "five-metre-mark", x: feet(at(WATER_POLO.fiveMetre, "left")), y: 0, side: "top" },
      { id: "six-metre-line", x: feet(at(WATER_POLO.sixMetre, "left")), y: feet(W), side: "bottom" },
      { id: "half-distance-line", x: feet(Lp / 2), y: 0, side: "top" },
      { id: "goal", x: feet(g1), y: feet(W / 2), side: "bottom" },
      { id: "re-entry-area", x: feet(at(0.5, "right")), y: feet(down ? 0.5 : W - 0.5), side: down ? "top" : "bottom" },
      { id: "referee-platform", x: feet(Lp * 0.3), y: feet(down ? W + GUTTER + platform / 2 : -GUTTER - platform / 2), side: down ? "bottom" : "top" },
    );
    if (down) marks.push({ id: "official-table", x: feet(Lp / 2), y: feet(W + GUTTER + platform + 0.5 + WATER_POLO.table.depth), side: "bottom" });
  }
  const view0 = { x: -m, y: -feet(deckTop) - m, w: feet(Lp) + 2 * m, h: feet(W) + feet(deckTop + deckBottom) + 2 * m };
  // The deck is under everything.
  if (ctx.bare !== true) base = deckMarkup(o, ids, plan.deck, view0.x, view0.y, view0.w, view0.h) + base;
  const L = feet(Lp);
  const Wf = feet(W);
  const cy = Wf / 2;
  const turned = o.portrait;
  const surface: Surface = {
    sport: "waterpolo",
    view: view0,
    base,
    lines,
    defs: ctx.bare === true ? "" : paintDefs(ids, plan.look, plan.deck, plan.seed),
    left: { cx: -m / 2, cy, w: Wf, h: m, rot: -90 },
    right: { cx: L + m / 2, cy, w: Wf, h: m, rot: 90 },
    plate: turned ? { cx: L / 2, cy, w: Wf * 0.9, h: L * 0.3 } : { cx: L / 2, cy, w: L * 0.3, h: Wf * 0.5 },
    turned,
  };
  surface.box = { x: 0, y: 0, w: L, h: Wf };
  surface.lineRef = { width: thin, feet: 1 };
  surface.ranges = {
    half: atEnds((end) => (end === "left" ? edges(0, 0, L / 2, Wf) : edges(L / 2, 0, L, Wf))),
    "goal-area": atEnds((end) => (end === "left" ? edges(0, 0, feet(g0 + WATER_POLO.twoMetre + 0.5), Wf) : edges(L - feet(Lp - g1 + WATER_POLO.twoMetre + 0.5), 0, L, Wf))),
  };
  if (o.landmarks === true) surface.marks = marks;
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
