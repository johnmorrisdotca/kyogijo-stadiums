import { el, num } from "../format.ts";
import { rulesFor, type MlbRules } from "../eras.ts";
import { MLB, fenceAt, skinJoin, type FencePoint } from "../geometry.ts";
import { MLB_DIAMOND, type DiamondSpec } from "../leagues/baseball.ts";
import { mowPark } from "../mow.ts";
import { edges, ft, type BuildOptions, type Mark, type Surface } from "./surface.ts";

const SQ = Math.SQRT1_2;
/** The round home plate of 1857 to 1867, "one square foot", about 13½ inches across, in feet. */
const ROUND_PLATE = 13.5 / 12;

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

/** Home plate as the rules of a season had it: its outline, its half width and where its middle lies out from home. */
export interface PlateShape {
  /** An outline as a path in the field's screen coordinates (y is minus the distance out from home), or an empty string for a circle. */
  d: string;
  circle?: { cx: number; cy: number; r: number };
  /** Half the plate's width across the line from home to the pitcher. */
  halfWidth: number;
  /** The distance of the plate's middle from the foul lines' meeting, out towards the pitcher. */
  centre: number;
}

/**
 * Home plate in a season: a round plate, a square, the square turned, or the pentagon, centred on the foul lines' meeting, wholly
 * behind it, or in front of it as now. `grow` draws it larger than life, as the rest of the field's small things are.
 */
export function plateShape(era: Pick<MlbRules, "plateShape" | "platePlacement">, grow: number, plate: { width: number; side: number } = MLB.plate): PlateShape {
  const { plateShape: shape, platePlacement: placement } = era;
  const half = shape === "circle" ? (ROUND_PLATE / 2) * grow : shape === "square" ? 0.5 * grow : shape === "diamond" ? (Math.SQRT2 / 2) * grow : plate.side * grow;
  const depth = shape === "pentagon" ? plate.width * grow : shape === "circle" ? 2 * half : shape === "square" ? grow : Math.SQRT2 * grow;
  // Where its back point lies on the line out from home: centred on the meeting of the foul lines, wholly behind it, or in front of it.
  const back = placement === "centred" ? -depth / 2 : placement === "behind" ? -depth : 0;
  const v = (n: number): number => -(back + n);
  const centre = shape === "pentagon" ? back + plate.side * grow : back + depth / 2;
  switch (shape) {
    case "circle":
      return { d: "", circle: { cx: 0, cy: v(half), r: half }, halfWidth: half, centre };
    case "square":
      return { d: `M${num(-half)} ${num(v(0))}H${num(half)}V${num(v(depth))}H${num(-half)}Z`, halfWidth: half, centre };
    case "diamond":
      return { d: `M0 ${num(v(0))}L${num(half)} ${num(v(half))}L0 ${num(v(depth))}L${num(-half)} ${num(v(half))}Z`, halfWidth: half, centre };
    case "pentagon":
      return { d: `M0 ${num(v(0))}L${num(half)} ${num(v(half))}V${num(v(depth))}H${num(-half)}V${num(v(half))}Z`, halfWidth: half, centre };
  }
}

/**
 * The baseball field: grass, warning track, infield, bases, lines and the fence of a park, with the markings of a season (today's
 * by default). With a `diamond` (leagues.ts) the field of a league, in feet: Little League's, a softball field.
 */
export function baseball(points: readonly FencePoint[], o: BuildOptions, era?: MlbRules, diamond: DiamondSpec = MLB_DIAMOND): Surface {
  const d = diamond;
  // The Official Baseball Rules have a history (eras.ts); a league's field is as its rulebook has it.
  const rules: MlbRules =
    era ??
    (d === MLB_DIAMOND
      ? rulesFor("mlb").rules
      : {
          baseSize: d.baseSize,
          pitcher: { kind: "plate", distance: d.pitcher, width: d.pitchersPlate.width, depth: d.pitchersPlate.depth },
          battersBox: d.boxes === null ? null : { width: d.boxes.batterWidth, length: d.boxes.batterLength, gap: d.boxes.gap },
          plateShape: "pentagon",
          platePlacement: "front",
          moundHeight: null,
        });
  const outline = fenceOutline(points);
  const us = outline.map(([u]) => u);
  const vs = outline.map(([, v]) => v);
  const umin = Math.min(...us);
  const umax = Math.max(...us);
  const vmax = Math.max(...vs);
  const m = o.margin ?? 14;
  const backstop = d.backstop;
  const thin = o.exact ? 1 / 3 : 0.7;
  const full = o.detail === "full";
  // Screen coordinates: x is u, y is -v.
  const pt = ([u, v]: [number, number]): string => `${num(u)} ${num(-v)}`;
  const fenceD = `M${outline.map(pt).join("L")}`;
  const fairD = `M0 0L${outline.map(pt).join("L")}Z`;
  const fairId = `${o.id}-fair`;

  const strip = o.portrait && o.score ? 60 : 0;
  const view = { x: umin - m, y: -(vmax + m) - strip, w: umax - umin + 2 * m, h: vmax + m + backstop + m + 2 * strip };

  let base = el("rect", { class: ft(o, "foul-ground", "ky-foul"), x: view.x, y: view.y, width: view.w, height: view.h });
  base += el("path", { class: ft(o, "outfield", "ky-surface"), d: fairD });
  const clip = `<clipPath id="${fairId}"><path d="${fairD}"/></clipPath>`;
  if (o.stripes && (o.mow === undefined || o.mow === "rings" || o.mow === "circles")) {
    const rings: string[] = [];
    for (let r = 90, k = 0; r < vmax + 60; r += 30, k += 1) {
      if (k % 2 === 1) rings.push(el("circle", { cx: 0, cy: 0, r: r + 15, "stroke-width": 30 }));
    }
    base += el("g", { class: ft(o, "mowing", "ky-ring"), "clip-path": `url(#${fairId})`, fill: "none" }, rings.join(""));
  } else if (o.stripes && o.mow !== "none" && o.mow !== undefined) {
    // Another pattern, cut to the fair ground; `wide` and `narrow` are twice and half the usual 30 feet.
    const mown = mowPark(o.mow, { umin, umax, vmax });
    if (mown.path !== "") base += el("path", { class: ft(o, "mowing", "ky-stripe"), d: mown.path, "clip-path": `url(#${fairId})` });
  }
  // The warning track: a band along the fence inside the field.
  base += el("path", { class: ft(o, "warning-track", "ky-track"), d: fenceD, fill: "none", "stroke-width": MLB.warningTrack * 2, "clip-path": `url(#${fairId})` });
  // The infield's dirt, cut by an arc round the pitcher's plate, and its grass.
  const skin = d.skinRadius ?? d.base + 5;
  const ua = skinJoin(d.pitcher, skin) * SQ;
  base += el("path", { class: ft(o, "infield-dirt", "ky-dirt"), d: `M0 0L${num(ua)} ${num(-ua)}A${num(skin)} ${num(skin)} 0 0 0 ${num(-ua)} ${num(-ua)}Z` });
  const centreV = d.base * SQ;
  const half = centreV - 4.5 * Math.SQRT2;
  base += el("path", { class: ft(o, "infield-grass", "ky-infield"), d: `M0 ${num(-(centreV + half))}L${num(half)} ${num(-centreV)}L0 ${num(-(centreV - half))}L${num(-half)} ${num(-centreV)}Z` });
  const cuts: [number, number, number][] = [
    [0, 0, MLB.homeCircleRadius],
    [centreV, centreV, MLB.baseCircleRadius],
    [0, 2 * centreV, MLB.baseCircleRadius],
    [-centreV, centreV, MLB.baseCircleRadius],
  ];
  // The mound is the plate's: before 1893 the pitcher stood in a chalked box and the sources give no mound.
  if (rules.pitcher.kind === "plate") cuts.push([0, d.moundCentre, d.moundRadius]);
  base += cuts.map(([u, v, r]) => el("circle", { class: ft(o, "infield-dirt", "ky-dirt"), cx: u, cy: -v, r })).join("");

  // Lines: the foul lines, the boxes, the lane, the plates, the bases, the fence.
  const first = outline[0];
  const last = outline[outline.length - 1];
  let lines = el("path", { class: ft(o, "foul-lines", "ky-line"), d: `M0 0L${pt(first)}M0 0L${pt(last)}`, "stroke-width": thin, fill: "none" });
  if (full) {
    // The batter's boxes, from 1874: each beside the plate, centred lengthwise on its middle.
    if (rules.battersBox !== null) {
      const { width: batterWidth, length: batterLength, gap } = rules.battersBox;
      const at = plateShape(rules, 1, d.plate);
      const inner = at.halfWidth + gap;
      const boxes = [-1, 1].map((s) => `M${num(s * inner)} ${num(-(at.centre + batterLength / 2))}h${num(s * batterWidth)}v${batterLength}h${num(-s * batterWidth)}z`).join("");
      lines += el("path", { class: ft(o, "batters-boxes", "ky-line"), d: boxes, "stroke-width": thin * 0.8, fill: "none" });
    }
    if (d.runningLane !== null) {
      const dist = (s: number): [number, number] => [s * SQ * d.base, -SQ * d.base];
      const off = 3;
      const a = dist(1);
      const b: [number, number] = [a[0] / 2, a[1] / 2];
      const lane = `M${num(b[0])} ${num(b[1])}l${num(off * SQ)} ${num(off * SQ)}L${num(a[0] + off * SQ)} ${num(a[1] + off * SQ)}L${num(a[0])} ${num(a[1])}`;
      lines += el("path", { class: ft(o, "running-lane", "ky-line"), d: lane, "stroke-width": thin * 0.7, fill: "none" });
    }
  }
  // Bases and plates are drawn larger than life, as broadcast graphics do, unless exact lines are asked for.
  const grow = o.exact ? 1 : 2.4;
  const plate = plateShape(rules, grow, d.plate);
  lines += plate.circle === undefined ? el("path", { class: ft(o, "home-plate", "ky-fill-line"), d: plate.d }) : el("circle", { class: ft(o, "home-plate", "ky-fill-line"), cx: plate.circle.cx, cy: plate.circle.cy, r: plate.circle.r });
  const pitcher = rules.pitcher;
  if (pitcher.kind === "plate") {
    lines += el("rect", { class: ft(o, "pitchers-plate", "ky-fill-line"), x: -1 * grow, y: -(pitcher.distance + 0.25 * grow), width: 2 * grow, height: 0.5 * grow });
  } else {
    // A chalked box: its front edge the pitching distance from home, its back edge the depth beyond.
    lines += el("rect", { class: ft(o, "pitchers-plate", "ky-line"), x: -pitcher.width / 2, y: -(pitcher.distance + pitcher.depth), width: pitcher.width, height: pitcher.depth, "stroke-width": thin * 0.8, fill: "none" });
  }
  const h = (rules.baseSize * grow * Math.SQRT2) / 2;
  const bases: [number, number][] = [
    [centreV - h, centreV],
    [0, 2 * centreV - h],
    [-centreV + h, centreV],
  ];
  lines += bases.map(([u, v]) => el("path", { class: ft(o, "bases", "ky-fill-line"), d: `M${num(u)} ${num(-(v + h))}L${num(u + h)} ${num(-v)}L${num(u)} ${num(-(v - h))}L${num(u - h)} ${num(-v)}Z` })).join("");
  lines += el("path", { class: ft(o, "fence", "ky-fence"), d: fenceD, fill: "none", "stroke-width": 1.6 });

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
  const surface: Surface = { sport: "mlb", view, base, lines, defs: clip, left, right, plate: { cx: 0, cy: -Math.round(vmax * 0.42), w: 150, h: 62 }, turned: false, lineRef: { width: thin, feet: 1 }, box: { x: umin, y: -vmax, w: umax - umin, h: vmax } };
  // The infield: the dirt out to the arc round the mound, with the ground behind home plate; the outfield: the fence in to just short of second base.
  surface.ranges = {
    infield: edges(-(ua + 15), -(d.pitcher + skin + 12), ua + 15, 0),
    outfield: edges(umin, -vmax, umax, -(2 * centreV - 6)),
  };
  if (o.landmarks === true) {
    const mid = outline[Math.round(outline.length / 2)];
    const aside = outline[Math.round(outline.length * 0.8)];
    const marks: Mark[] = [
      { id: "home-plate", x: 0, y: 0, side: "bottom" },
      { id: "first-base", x: bases[0][0], y: -bases[0][1], side: "bottom" },
      { id: "third-base", x: bases[2][0], y: -bases[2][1], side: "bottom" },
      { id: "second-base", x: bases[1][0], y: -bases[1][1], side: "top" },
      { id: "foul-line", x: first[0] * 0.55, y: -first[1] * 0.55, side: "top" },
      { id: "outfield-fence", x: mid[0], y: -mid[1], side: "top" },
      { id: "warning-track", x: aside[0] * 0.97, y: -aside[1] * 0.97, side: "top" },
    ];
    if (rules.pitcher.kind === "plate") marks.push({ id: "pitchers-plate", x: 0, y: -rules.pitcher.distance, side: "bottom" });
    if (rules.battersBox !== null) {
      const at = plateShape(rules, 1, d.plate);
      marks.push({ id: "batters-box", x: at.halfWidth + rules.battersBox.gap + rules.battersBox.width / 2, y: -at.centre, side: "bottom" });
    }
    surface.marks = marks;
  }
  return surface;
}
