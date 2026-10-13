import { el, num } from "../format.ts";
import { MLB, fenceAt, skinJoin, type FencePoint } from "../geometry.ts";
import type { BuildOptions, Surface } from "./surface.ts";

const SQ = Math.SQRT1_2;

/** The fence as points on the field: u across (negative to the left), v out from the back of home plate. */
export function fenceOutline(points: readonly FencePoint[], step = 1.5): [number, number][] {
  const out: [number, number][] = [];
  for (let a = -45; a <= 45 + 1e-9; a += step) {
    const d = fenceAt(points, a);
    const t = (a * Math.PI) / 180;
    out.push([d * Math.sin(t), d * Math.cos(t)]);
  }
  return out;
}

/** The baseball field: grass, warning track, infield, bases, lines and the fence of a park. */
export function baseball(points: readonly FencePoint[], o: BuildOptions): Surface {
  const outline = fenceOutline(points);
  const us = outline.map(([u]) => u);
  const vs = outline.map(([, v]) => v);
  const umin = Math.min(...us);
  const umax = Math.max(...us);
  const vmax = Math.max(...vs);
  const m = o.margin ?? 14;
  const backstop = MLB.backstop;
  const thin = o.exact ? 1 / 3 : 0.7;
  const full = o.detail === "full";
  // Screen coordinates: x is u, y is -v.
  const pt = ([u, v]: [number, number]): string => `${num(u)} ${num(-v)}`;
  const fenceD = `M${outline.map(pt).join("L")}`;
  const fairD = `M0 0L${outline.map(pt).join("L")}Z`;
  const fairId = `${o.id}-fair`;

  const strip = o.portrait && o.score ? 60 : 0;
  const view = { x: umin - m, y: -(vmax + m) - strip, w: umax - umin + 2 * m, h: vmax + m + backstop + m + 2 * strip };

  let base = el("rect", { class: "ky-foul", x: view.x, y: view.y, width: view.w, height: view.h });
  base += el("path", { class: "ky-surface", d: fairD });
  const clip = `<clipPath id="${fairId}"><path d="${fairD}"/></clipPath>`;
  if (o.stripes) {
    const rings: string[] = [];
    for (let r = 90, k = 0; r < vmax + 60; r += 30, k += 1) {
      if (k % 2 === 1) rings.push(el("circle", { cx: 0, cy: 0, r: r + 15, "stroke-width": 30 }));
    }
    base += el("g", { class: "ky-ring", "clip-path": `url(#${fairId})`, fill: "none" }, rings.join(""));
  }
  // The warning track: a band along the fence inside the field.
  base += el("path", { class: "ky-track", d: fenceD, fill: "none", "stroke-width": MLB.warningTrack * 2, "clip-path": `url(#${fairId})` });
  // The infield's dirt, cut by an arc round the pitcher's plate, and its grass.
  const ua = skinJoin() * SQ;
  base += el("path", { class: "ky-dirt", d: `M0 0L${num(ua)} ${num(-ua)}A${MLB.skinRadius} ${MLB.skinRadius} 0 0 0 ${num(-ua)} ${num(-ua)}Z` });
  const centreV = MLB.base * SQ;
  const half = centreV - 4.5 * Math.SQRT2;
  base += el("path", { class: "ky-infield", d: `M0 ${num(-(centreV + half))}L${num(half)} ${num(-centreV)}L0 ${num(-(centreV - half))}L${num(-half)} ${num(-centreV)}Z` });
  const cuts: [number, number, number][] = [
    [0, 0, MLB.homeCircleRadius],
    [centreV, centreV, MLB.baseCircleRadius],
    [0, 2 * centreV, MLB.baseCircleRadius],
    [-centreV, centreV, MLB.baseCircleRadius],
    [0, MLB.pitcher - 1, MLB.moundRadius],
  ];
  base += cuts.map(([u, v, r]) => el("circle", { class: "ky-dirt", cx: u, cy: -v, r })).join("");

  // Lines: the foul lines, the boxes, the lane, the plates, the bases, the fence.
  const first = outline[0];
  const last = outline[outline.length - 1];
  let lines = el("path", { class: "ky-line", d: `M0 0L${pt(first)}M0 0L${pt(last)}`, "stroke-width": thin, fill: "none" });
  if (full) {
    const { batterWidth, batterLength, gap } = MLB.boxes;
    const hw = MLB.plate.side;
    const inner = hw + gap;
    const mid = hw;
    const boxes = [-1, 1].map((s) => `M${num(s * inner)} ${num(-(mid + batterLength / 2))}h${num(s * batterWidth)}v${batterLength}h${num(-s * batterWidth)}z`).join("");
    lines += el("path", { class: "ky-line", d: boxes, "stroke-width": thin * 0.8, fill: "none" });
    const dist = (s: number): [number, number] => [s * SQ * MLB.base, -SQ * MLB.base];
    const off = 3;
    const a = dist(1);
    const b: [number, number] = [a[0] / 2, a[1] / 2];
    const lane = `M${num(b[0])} ${num(b[1])}l${num(off * SQ)} ${num(off * SQ)}L${num(a[0] + off * SQ)} ${num(a[1] + off * SQ)}L${num(a[0])} ${num(a[1])}`;
    lines += el("path", { class: "ky-line", d: lane, "stroke-width": thin * 0.7, fill: "none" });
  }
  // Bases and plates are drawn larger than life, as broadcast graphics do, unless exact lines are asked for.
  const grow = o.exact ? 1 : 2.4;
  const hw = MLB.plate.side * grow;
  const front = MLB.plate.width * grow;
  lines += el("path", { class: "ky-fill-line", d: `M0 0L${num(hw)} ${num(-hw)}V${num(-front)}H${num(-hw)}V${num(-hw)}Z` });
  lines += el("rect", { class: "ky-fill-line", x: -1 * grow, y: -(MLB.pitcher + 0.25 * grow), width: 2 * grow, height: 0.5 * grow });
  const h = (MLB.baseSize * grow * Math.SQRT2) / 2;
  const bases: [number, number][] = [
    [centreV - h, centreV],
    [0, 2 * centreV - h],
    [-centreV + h, centreV],
  ];
  lines += bases.map(([u, v]) => el("path", { class: "ky-fill-line", d: `M${num(u)} ${num(-(v + h))}L${num(u + h)} ${num(-v)}L${num(u)} ${num(-(v - h))}L${num(u - h)} ${num(-v)}Z` })).join("");
  lines += el("path", { class: "ky-fence", d: fenceD, fill: "none", "stroke-width": 1.6 });

  const left: Surface["left"] = { cx: 0, cy: 0, w: 0, h: 0, rot: 0, panel: true };
  const right: Surface["right"] = { ...left };
  if (strip > 0) {
    const w = Math.min(view.w * 0.9, 300);
    Object.assign(left, { cx: (umin + umax) / 2, cy: view.y + strip / 2, w, h: strip - 12 });
    Object.assign(right, { cx: (umin + umax) / 2, cy: view.y + view.h - strip / 2, w, h: strip - 12 });
  } else {
    const w = Math.min(172, -62 - (umin - m + 6));
    const cy = 18;
    Object.assign(left, { cx: (umin - m + 6 + -62) / 2, cy, w, h: 58 });
    Object.assign(right, { cx: (umax + m - 6 + 62) / 2, cy, w, h: 58 });
  }
  return { sport: "mlb", view, base, lines, defs: clip, left, right, plate: { cx: 0, cy: -Math.round(vmax * 0.42), w: 150, h: 62 }, turned: false };
}
