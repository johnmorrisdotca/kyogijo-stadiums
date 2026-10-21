import { el, num } from "../format.ts";
import { FEET_PER_METRE } from "../geometry.ts";
import type { GoalStyle, StripePattern } from "../types.ts";
import { SOCCER, type SoccerLayout, type SoccerSpec } from "./soccer-spec.ts";
import { mowTurf } from "../mow.ts";
import { atEnds, edges, ft, quarterTurn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/** What the soccer builder is given besides the usual. */
export interface SoccerBuild {
  spec: SoccerSpec;
  layout: SoccerLayout;
  /** Show only one half: `left` or `right`. */
  half?: "left" | "right";
  pattern: StripePattern;
  goals: GoalStyle;
  /** Draw corner flags. */
  flags: boolean;
  /** The data frame to put an empty, transformed group for: the matrix that maps the provider's numbers to metres. */
  frame?: { id: string; matrix: [number, number, number, number, number, number] };
}

const K = FEET_PER_METRE;
/** A number for a path in metres: centimetres, no more. */
const n = num;
const matrix = (m: readonly number[]): string => `matrix(${m.map((v) => String(Math.round(v * 1e6) / 1e6)).join(" ")})`;

/** How many bands a pattern cuts the pitch into, along the length and across: odd, so that both ends are alike. */
const BANDS: Record<"bands" | "wide" | "narrow", number> = { bands: 19, wide: 9, narrow: 39 };

/** The stripes of mown grass, as one path of the lighter bands (or the darker, as you see it). */
function stripes(pattern: StripePattern, L: number, W: number, id: string): { path: string; defs: string; evenodd?: boolean } {
  if (pattern === "none") return { path: "", defs: "" };
  if (pattern === "circles" || pattern === "diamonds") {
    // Rings about the middle, or squares turned 45 degrees about it, as wide as a usual band, cut to the pitch.
    const mown = mowTurf(pattern, { x: 0, y: 0, w: L, h: W }, L / BANDS.bands);
    return { path: mown.path, defs: `<clipPath id="${id}-turf"><rect x="0" y="0" width="${n(L)}" height="${n(W)}"/></clipPath>`, evenodd: mown.evenodd };
  }
  const rect = (x: number, y: number, w: number, h: number): string => `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
  const parts: string[] = [];
  if (pattern === "lengthwise") {
    const rows = 11;
    for (let i = 1; i < rows; i += 2) parts.push(rect(0, (W / rows) * i, L, W / rows));
  } else if (pattern === "checks") {
    const cols = 19;
    const rows = 11;
    for (let i = 0; i < cols; i += 1) for (let j = 0; j < rows; j += 1) if ((i + j) % 2 === 1) parts.push(rect((L / cols) * i, (W / rows) * j, L / cols, W / rows));
  } else if (pattern === "diagonal") {
    // Bands at 45 degrees, as wide across as the usual bands, cut to the pitch by a clip path.
    const across = L / BANDS.bands;
    for (let x = -W; x < L; x += 2 * across * Math.SQRT2) parts.push(`M${n(x)} ${n(W)}L${n(x + W)} 0L${n(x + W + across * Math.SQRT2)} 0L${n(x + across * Math.SQRT2)} ${n(W)}z`);
    return { path: parts.join(""), defs: `<clipPath id="${id}-turf"><rect x="0" y="0" width="${n(L)}" height="${n(W)}"/></clipPath>` };
  } else {
    const count = pattern === "wide" || pattern === "narrow" ? BANDS[pattern] : BANDS.bands;
    for (let i = 1; i < count; i += 2) parts.push(rect((L / count) * i, 0, L / count, W));
  }
  return { path: parts.join(""), defs: "" };
}

/** One goal at an end of the pitch, seen from above: the net lies beyond the goal line, at negative x at the left end and past `L` at the right. */
function goal(style: GoalStyle, spec: SoccerSpec, L: number, W: number, end: 0 | 1, thick: number, exact: boolean, o: BuildOptions): string {
  if (style === "none") return "";
  const half = spec.goalWidth / 2;
  const cy = W / 2;
  const x = end === 0 ? 0 : L;
  const out = end === 0 ? -1 : 1;
  const depth = spec.goalDepth;
  if (style === "line") return el("path", { class: ft(o, "goals", "ky-goal"), d: `M${n(x)} ${n(cy - half)}V${n(cy + half)}`, "stroke-width": thick * 3, fill: "none" });
  if (style === "strip") return el("path", { class: ft(o, "goals", "ky-goal-strip"), d: `M${n(x)} ${n(cy - half)}h${n(out * 0.6)}v${n(2 * half)}h${n(-out * 0.6)}z` });
  // The box: the net behind the goal line, with the posts at its mouth.
  const d = `M${n(x)} ${n(cy - half)}h${n(out * depth)}v${n(2 * half)}h${n(-out * depth)}`;
  const grid: string[] = [];
  const cells = Math.max(3, Math.round(half / 0.6));
  for (let i = 1; i < cells; i += 1) grid.push(`M${n(x)} ${n(cy - half + (2 * half * i) / cells)}h${n(out * depth)}`);
  const posts = el("circle", { class: ft(o, "goal-posts", "ky-post-end"), cx: x, cy: cy - half, r: exact ? 0.12 : 0.24 }) + el("circle", { class: ft(o, "goal-posts", "ky-post-end"), cx: x, cy: cy + half, r: exact ? 0.12 : 0.24 });
  return el("path", { class: ft(o, "goals", "ky-goal"), d, "stroke-width": thick * 1.4, fill: "none", "stroke-linejoin": "round" }) + el("path", { class: ft(o, "goals", "ky-goal-net"), d: grid.join(""), "stroke-width": thick * 0.5, fill: "none" }) + el("path", { class: ft(o, "goals", "ky-goal"), d: `M${n(x)} ${n(cy - half)}V${n(cy + half)}`, "stroke-width": thick * 1.4, fill: "none" }) + posts;
}

/** Futsal's penalty area: a quarter circle round each post, joined by a line across the front. */
function arcsArea(spec: SoccerSpec, L: number, W: number, side: 0 | 1): string {
  const cy = W / 2;
  const gx = side === 0 ? 0 : L;
  const r = spec.penaltyDepth;
  const h = spec.areaLine / 2;
  const out = side === 0 ? 1 : -1;
  // From the goal line, a quarter circle to the front line and back: clockwise at the left end, anticlockwise at the right.
  return `M${n(gx)} ${n(cy - h - r)}A${n(r)} ${n(r)} 0 0 ${side === 0 ? 1 : 0} ${n(gx + out * r)} ${n(cy - h)}V${n(cy + h)}A${n(r)} ${n(r)} 0 0 ${side === 0 ? 1 : 0} ${n(gx)} ${n(cy + h + r)}`;
}

/** The penalty area, goal area, mark, arc of one end, for a pitch that has them. */
function end(spec: SoccerSpec, lay: SoccerLayout, L: number, W: number, side: 0 | 1, full: boolean, o: BuildOptions): { path: string; marks: string } {
  const cy = W / 2;
  const sign = side === 0 ? 1 : -1;
  const gx = side === 0 ? 0 : L;
  const at = (dx: number): number => gx + sign * dx;
  let path = "";
  let marks = "";
  if (spec.area === "arcs") path += arcsArea(spec, L, W, side);
  else if (spec.area === "semicircle") path += `M${n(gx)} ${n(cy - spec.penaltyDepth)}A${n(spec.penaltyDepth)} ${n(spec.penaltyDepth)} 0 0 ${side === 0 ? 1 : 0} ${n(gx)} ${n(cy + spec.penaltyDepth)}`;
  else if (lay.penaltyDepth > 0) {
    path += `M${n(gx)} ${n(cy - lay.penaltyHalfWidth)}H${n(at(lay.penaltyDepth))}V${n(cy + lay.penaltyHalfWidth)}H${n(gx)}`;
  }
  if (spec.goalAreaDepth > 0) path += `M${n(gx)} ${n(cy - lay.goalAreaHalfWidth)}H${n(at(lay.goalAreaDepth))}V${n(cy + lay.goalAreaHalfWidth)}H${n(gx)}`;
  if (spec.arcRadius > 0 && lay.spot > 0 && lay.penaltyDepth > lay.spot) {
    // The part of the circle round the mark that lies outside the penalty area.
    const dx = lay.penaltyDepth - lay.spot;
    if (spec.arcRadius > dx) {
      const h = Math.sqrt(spec.arcRadius * spec.arcRadius - dx * dx);
      path += `M${n(at(lay.penaltyDepth))} ${n(cy - h)}A${n(spec.arcRadius)} ${n(spec.arcRadius)} 0 0 1 ${n(at(lay.penaltyDepth))} ${n(cy + h)}`;
    }
  }
  if (lay.spot > 0) marks += el("circle", { class: ft(o, "penalty-marks", "ky-fill-line"), cx: at(lay.spot), cy, r: full ? 0.22 : 0.3 });
  if (spec.secondSpot > 0) marks += el("circle", { class: ft(o, "penalty-marks", "ky-fill-line"), cx: at(spec.secondSpot), cy, r: full ? 0.22 : 0.3 });
  return { path, marks };
}

/**
 * The soccer pitch: the turf and its mown stripes; the touchlines and goal lines; the halfway line, centre circle and
 * mark; both penalty areas, goal areas, marks and arcs; the corner arcs; the goals; and the flags and the corner-kick
 * marks off the field. Drawn in metres inside a group that scales them to feet, as every surface lies in feet.
 */
export function soccer(b: SoccerBuild, o: BuildOptions): Surface {
  const { spec, layout: lay } = b;
  const L = spec.length;
  const W = spec.width;
  const full = o.detail === "full";
  const m = o.margin ?? 15;
  const Lf = L * K;
  const Wf = W * K;
  // The picture: the whole pitch, or one half of it, with ground round it (and none where the half is cut).
  const cut = b.half === undefined ? 0 : 0.35 * K;
  const x0 = b.half === "right" ? Lf / 2 - cut : -m;
  const x1 = b.half === "left" ? Lf / 2 + cut : Lf + m;
  const view0 = { x: x0, y: -m, w: x1 - x0, h: Wf + 2 * m };
  const lw = o.exact ? spec.lineWidth : Math.max(spec.lineWidth, spec.format === "11" ? 0.24 : 0.2);
  const cy = W / 2;
  const turned = o.portrait;
  const group = (inner: string, cls?: string): string => el("g", { class: cls, transform: `scale(${K.toFixed(6)})` }, inner);

  // Ground, turf and stripes.
  const turf = stripes(o.stripes ? b.pattern : "none", L, W, o.id);
  let inside = el("rect", { class: ft(o, "turf", "ky-surface"), x: 0, y: 0, width: L, height: W });
  if (turf.path !== "" && spec.format !== "futsal") inside += el("path", { class: ft(o, "mowing", "ky-stripe"), d: turf.path, "fill-rule": turf.evenodd === true ? "evenodd" : undefined, "clip-path": turf.defs === "" ? undefined : `url(#${o.id}-turf)` });
  // The ends in the team's colour, in a score: the penalty area (or what a small pitch has in its place).
  const zoneDepth = Math.max(spec.penaltyDepth, L * 0.12);
  const zoneWidth = Math.max(spec.area === "arcs" ? spec.areaLine + 2 * spec.penaltyDepth : spec.area === "semicircle" ? 2 * spec.penaltyDepth : lay.penaltyHalfWidth * 2, W * 0.4);
  if (o.score && o.pageant !== true) {
    // A rectangle at each end: the penalty area on a full pitch, a box that holds the name on the others (their areas are curved).
    for (const side of [0, 1] as const) inside += el("rect", { class: `ky-zone ky-zone-${side === 0 ? "left" : "right"}`, x: side === 0 ? 0 : L - zoneDepth, y: cy - zoneWidth / 2, width: zoneDepth, height: zoneWidth });
  }
  const base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h }) + group(inside, `ky-pitch ky-pitch-${spec.format}`);

  // The lines.
  let lines = el("rect", { class: ft(o, "touchlines", "ky-line"), x: 0, y: 0, width: L, height: W, "stroke-width": lw, fill: "none" });
  lines += el("path", { class: ft(o, "halfway-line", "ky-line"), d: `M${n(L / 2)} 0V${n(W)}`, "stroke-width": lw, fill: "none" });
  lines += el("circle", { class: ft(o, "centre-circle", "ky-line"), cx: L / 2, cy, r: spec.centreRadius, "stroke-width": lw, fill: "none" });
  lines += el("circle", { class: ft(o, "centre-mark", "ky-fill-line"), cx: L / 2, cy, r: full ? 0.22 : 0.3 });
  let marks = "";
  for (const side of [0, 1] as const) {
    const e = end(spec, lay, L, W, side, full, o);
    lines += el("path", { class: ft(o, "penalty-areas", "ky-line"), d: e.path, "stroke-width": lw, fill: "none" });
    marks += e.marks;
  }
  lines += marks;
  // Corner arcs.
  const r = spec.cornerRadius;
  if (r > 0) {
    lines += el("path", { class: ft(o, "corner-arcs", "ky-line"), d: `M${n(r)} 0A${n(r)} ${n(r)} 0 0 1 0 ${n(r)}M0 ${n(W - r)}A${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(W)}M${n(L - r)} ${n(W)}A${n(r)} ${n(r)} 0 0 1 ${n(L)} ${n(W - r)}M${n(L)} ${n(r)}A${n(r)} ${n(r)} 0 0 1 ${n(L - r)} 0`, "stroke-width": lw, fill: "none" });
  }
  // The corner-kick marks, outside the field, 9.15 m from the corner arc, at right angles to the lines (Law 1).
  if (full && spec.format === "11") {
    const d = SOCCER.cornerMark + r;
    const tick = 0.4;
    const t: string[] = [];
    for (const cx of [0, L]) {
      for (const ty of [0, W]) {
        const sx = cx === 0 ? 1 : -1;
        const sy = ty === 0 ? 1 : -1;
        // On the goal line (the mark stands off the line, in the direction away from the field) and on the touchline.
        t.push(`M${n(cx)} ${n(ty + sy * d)}h${n(-sx * tick)}`);
        t.push(`M${n(cx + sx * d)} ${n(ty)}v${n(-sy * tick)}`);
      }
    }
    lines += el("path", { class: ft(o, "corner-marks", "ky-line"), d: t.join(""), "stroke-width": lw, fill: "none" });
  }
  // Futsal (Law 1, sub-sections 6 and 2): the substitution zone is 5 m long, 5 m from the halfway line, closed by marks 80 cm long, half of
  // them off the pitch; the marks 5 m from each corner arc off the pitch show the distance of a corner kick, 5 cm from the end line.
  if (full && spec.format === "futsal") {
    const t: string[] = [];
    for (const x of [L / 2 + 5, L / 2 + 10]) t.push(`M${n(x)} ${n(W - 0.4)}v0.8`);
    for (const x of [5 + r, L - 5 - r]) for (const y of [0, W]) t.push(`M${n(x)} ${n(y + (y === 0 ? -0.05 : 0.05))}v${y === 0 ? -0.4 : 0.4}`);
    lines += el("path", { class: ft(o, "corner-marks", "ky-line"), d: t.join(""), "stroke-width": lw, fill: "none" });
  }
  // Goals: the built-in ones, or the caller's, drawn in feet outside the group that scales metres.
  let goals = "";
  let custom = "";
  for (const side of [0, 1] as const) {
    if (o.goalMarkup === undefined) goals += goal(b.goals, spec, L, W, side, lw, o.exact, o);
    else custom += o.goalMarkup({ sport: "soccer", end: side === 0 ? "left" : "right", x: side === 0 ? 0 : Lf, y: (W / 2) * K, width: spec.goalWidth * K, depth: spec.goalDepth * K, out: side === 0 ? -1 : 1, line: lw * K });
  }
  // Corner flags.
  let flags = "";
  if (b.flags) {
    const f: string[] = [];
    for (const [cx, ty] of [[0, 0], [L, 0], [0, W], [L, W]]) {
      const sx = cx === 0 ? 1 : -1;
      const sy = ty === 0 ? 1 : -1;
      f.push(el("path", { class: ft(o, "corner-flags", "ky-flag"), d: `M${n(cx)} ${n(ty)}l${n(sx * 0.9)} ${n(sy * 0.3)}l${n(-sx * 0.3)} ${n(sy * 0.9)}z` }));
      f.push(el("circle", { class: ft(o, "corner-flags", "ky-post-end"), cx, cy: ty, r: 0.2 }));
    }
    flags = f.join("");
  }
  const frame = b.frame === undefined ? "" : el("g", { class: "ky-data", "data-frame": b.frame.id, transform: matrix(b.frame.matrix) });
  const linesGroup = group(lines + goals + flags + frame);

  const long = zoneWidth * K;
  const deep = zoneDepth * K;
  const zoneH = Math.min(deep * 0.86, (long * 0.94) / 2.7);
  const plateW = Math.min(Lf * 0.36, 150);
  const surface: Surface = {
    sport: "soccer",
    view: view0,
    base,
    lines: linesGroup + custom,
    defs: turf.defs,
    left: { cx: deep / 2, cy: Wf / 2, w: long * 0.94, h: zoneH, rot: -90 },
    right: { cx: Lf - deep / 2, cy: Wf / 2, w: long * 0.94, h: zoneH, rot: 90 },
    plate: { cx: Lf / 2, cy: Wf / 2, w: plateW, h: plateW * 0.52 },
    turned,
  };
  surface.lineRef = { width: lw, feet: K };
  surface.box = { x: 0, y: 0, w: Lf, h: Wf };
  surface.centreRadius = spec.centreRadius * K;
  // The penalty area reaches as far as its lines do: the area, the arc beyond it and a small pitch's curved area; and a little more.
  const arcBeyond = spec.arcRadius > 0 && lay.spot > 0 && lay.penaltyDepth > lay.spot ? Math.max(0, spec.arcRadius - (lay.penaltyDepth - lay.spot)) : 0;
  const curved = spec.area === "arcs" || spec.area === "semicircle" ? spec.penaltyDepth : 0;
  const areaDeep = (Math.max(lay.penaltyDepth + arcBeyond, curved, lay.goalAreaDepth, L * 0.1) + 1) * K;
  const areaHalf = Math.min(Wf / 2, (Math.max(lay.penaltyHalfWidth, spec.area === "arcs" ? spec.areaLine / 2 + spec.penaltyDepth : curved, lay.goalAreaHalfWidth, W * 0.18) + 1) * K);
  const third = atEnds((end) => (end === "left" ? edges(0, 0, Lf / 3, Wf) : edges((Lf * 2) / 3, 0, Lf, Wf)));
  surface.ranges = {
    half: atEnds((end) => (end === "left" ? edges(0, 0, Lf / 2, Wf) : edges(Lf / 2, 0, Lf, Wf))),
    "final-third": third,
    "defensive-third": third,
    "middle-third": edges(Lf / 3, 0, (Lf * 2) / 3, Wf),
    "penalty-area": atEnds((end) => (end === "left" ? edges(0, Wf / 2 - areaHalf, areaDeep, Wf / 2 + areaHalf) : edges(Lf - areaDeep, Wf / 2 - areaHalf, Lf, Wf / 2 + areaHalf))),
  };
  if (o.landmarks === true) {
    const at = (x: number, y: number, id: string, side: Mark["side"]): Mark => ({ id, x: x * K, y: y * K, side });
    const marks: Mark[] = [at(0, W * 0.25, "goal-line", "top"), at(L / 2, 0, "halfway-line", "top"), at(L * 0.7, W, "touchline", "bottom"), at(L / 2 + spec.centreRadius * 0.7, cy + spec.centreRadius * 0.7, "centre-circle", "bottom")];
    if (lay.penaltyDepth > 0) marks.push(at(lay.penaltyDepth * 0.5, cy - lay.penaltyHalfWidth, "penalty-area", "top"));
    if (spec.goalAreaDepth > 0) marks.push(at(lay.goalAreaDepth * 0.5, cy + lay.goalAreaHalfWidth, "goal-area", "bottom"));
    if (lay.spot > 0) marks.push(at(lay.spot, cy, "penalty-mark", "bottom"));
    if (spec.arcRadius > 0 && lay.spot > 0 && lay.penaltyDepth > lay.spot) marks.push(at(lay.spot + spec.arcRadius, cy, "penalty-arc", "top"));
    if (r > 0) marks.push(at(r * 0.7071, r * 0.7071, "corner-arc", "top"));
    if (b.goals !== "none" || o.goalMarkup !== undefined) marks.push(at(-spec.goalDepth / 2, cy - spec.goalWidth / 2, "goal", "top"));
    surface.marks = marks;
  }
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
