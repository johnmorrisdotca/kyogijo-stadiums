// The athletics stadium's surface lying wide, from its plan (athletics/plan.ts): the track between its kerb and its edge, the segments' synthetic surface, the mown turf and the soccer pitch inside, the
// field events' areas, every painted line, the coloured marks and the lane numbers. The plan is in metres; the drawing is in feet, as every surface lies, so the whole is drawn inside a group
// that scales metres to feet and moves the stadium's box to the origin.
import { el, num } from "../format.ts";
import { areaD, marks, strokes } from "./field.ts";
import { strokeWidth, digitsD } from "../athletics/stencil.ts";
import type { AthleticsPlan, MBox, MRange } from "../athletics/plan.ts";
import { atEnds, edges, ft, quarterTurn, type BuildOptions, type Mark, type Surface, type SurfaceRanges } from "./surface.ts";

/** Feet in a metre. */
export const K = 1 / 0.3048;

/** The embedded soccer pitch's markup, as the soccer builder wrote it: the ground and the lines, in a group that scales metres to feet. */
export interface Embedded {
  base: string;
  lines: string;
  defs: string;
}

/** The part of a soccer builder's `base` that is the pitch: what follows its apron. */
export function pitchGroup(base: string): string {
  const i = base.indexOf('<g class="ky-pitch');
  return i < 0 ? "" : base.slice(i);
}

const feetBox = (b: MBox, ox: number, oy: number): { x: number; y: number; w: number; h: number } => edges((b.x0 - ox) * K, (b.y0 - oy) * K, (b.x1 - ox) * K, (b.y1 - oy) * K);

/** A plan's named range in feet, as a surface lists them. */
function rangeOf(r: MRange, ox: number, oy: number): SurfaceRanges[string] {
  return "left" in r ? atEnds((end) => feetBox(end === "left" ? r.left : r.right, ox, oy)) : feetBox(r, ox, oy);
}

/**
 * The surface of the plan lying wide. `margin` is the ground round what is drawn, in feet. The soccer pitch `embedded` is laid inside the track where the plan has one.
 */
export function athleticsSurface(o: BuildOptions, plan: AthleticsPlan, embedded: Embedded | undefined, margin: number): Surface {
  const ox = plan.box.x0;
  const oy = plan.box.y0;
  const full = o.detail === "full";
  // A close-up of a start is turned so that the athletes run to the right (or, in portrait, up the page): the whole drawing is moved and turned about the start's pivot, and data in the stadium's own frame
  // is carried there by `frame`. Every other view is the stadium as it lies, wide, and turned a quarter in portrait.
  const sv = plan.startView;
  const turn = sv === undefined ? 0 : (o.portrait ? -Math.PI / 2 : 0) - sv.pivot.heading;
  const deg = (turn * 180) / Math.PI;
  let view0 = { x: (plan.extent.x0 - ox) * K - margin, y: (plan.extent.y0 - oy) * K - margin, w: (plan.extent.x1 - plan.extent.x0) * K + 2 * margin, h: (plan.extent.y1 - plan.extent.y0) * K + 2 * margin };
  if (sv !== undefined) {
    const w = sv.window;
    const quarter = o.portrait;
    const [x0, x1, y0, y1] = quarter ? [w.y0, w.y1, -w.x1, -w.x0] : [w.x0, w.x1, w.y0, w.y1];
    view0 = { x: x0 * K, y: y0 * K, w: (x1 - x0) * K, h: (y1 - y0) * K };
  }
  const place = sv === undefined ? `scale(${K.toFixed(6)}) translate(${num(-ox)} ${num(-oy)})` : `scale(${K.toFixed(6)}) rotate(${num(deg)}) translate(${num(-sv.pivot.x)} ${num(-sv.pivot.y)})`;
  const group = (inner: string, cls?: string): string => el("g", { class: cls, transform: place }, inner);
  const turned = sv === undefined && o.portrait;
  const upright = sv === undefined ? (o.portrait ? -90 : 0) : -deg;
  const toK = (v: number): string => (v * K).toFixed(4);
  void toK;
  let defs = embedded?.defs ?? "";

  // Under everything: the apron, the track's surfaces, the turf and its bands, the pitch, then the field events' areas.
  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  let ground = "";
  for (const a of plan.areas) if (a.cls === "ky-ath-track") ground += el("path", { class: ft(o, a.feature, a.cls), d: areaD(a), "fill-rule": a.evenodd === true ? "evenodd" : undefined });
  if (plan.turf !== undefined) {
    ground += el("path", { class: ft(o, "infield", "ky-ath-grass"), d: plan.turf.d });
    if (o.stripes && o.mow !== "none" && plan.turf.stripes !== "") {
      defs += el("clipPath", { id: `${o.id}-ath-turf` }, el("path", { d: plan.turf.d }));
      ground += el("path", { class: ft(o, "mowing", "ky-stripe"), d: plan.turf.stripes, "clip-path": `url(#${o.id}-ath-turf)` });
    }
  }
  const pitchAt = plan.pitch === undefined || embedded === undefined ? undefined : `translate(${num(plan.pitch.x)} ${num(plan.pitch.y)}) scale(${(1 / K).toFixed(6)})`;
  if (pitchAt !== undefined && embedded !== undefined) ground += el("g", { transform: pitchAt }, embedded.base);
  for (const a of plan.areas) if (a.cls !== "ky-ath-track") ground += el("path", { class: ft(o, a.feature, a.cls), d: areaD(a), "fill-rule": a.evenodd === true ? "evenodd" : undefined });
  base += group(ground, "ky-ath-ground");

  // The lines: the painted lines and marks of the plan, the lane numbers, the pitch's lines.
  const thick = o.exact ? plan.lineWidth : plan.drawnLine;
  let lines = strokes(plan, o) + marks(plan, o);
  if (pitchAt !== undefined && embedded !== undefined) lines += el("g", { transform: pitchAt }, embedded.lines);
  for (const d of plan.digits) {
    const h = d.h;
    if (d.tag === true) lines += el("circle", { class: "ky-ath-tag", cx: d.x, cy: d.y, r: h * 0.78 });
    lines += el("path", {
      class: ft(o, d.feature, d.tag === true ? "ky-ath-tagnum" : "ky-ath-num"),
      d: digitsD(d.text, h, d.x, d.y),
      "stroke-width": num(strokeWidth(h)),
      transform: upright === 0 ? undefined : `rotate(${num(upright)} ${num(d.x)} ${num(d.y)})`,
    });
  }
  const linesGroup = group(lines, "ky-ath-lines");

  const W = (plan.box.x1 - plan.box.x0) * K;
  const H = (plan.box.y1 - plan.box.y0) * K;
  const surface: Surface = {
    sport: "athletics",
    view: view0,
    base,
    lines: linesGroup,
    defs,
    // A team's name, in a score, is written on the grass either side of the middle: a track meeting between teams.
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
  if (sv !== undefined) {
    // The stadium's own frame (feet from its box's corner) to the close-up's: moved so that the pivot is the origin, then turned.
    const qx = (sv.pivot.x - ox) * K;
    const qy = (sv.pivot.y - oy) * K;
    surface.frame = `rotate(${num(deg)}) translate(${num(-qx)} ${num(-qy)})`;
    surface.upright = -deg;
    // In the stadium's own frame the part shown is the box round the close-up's window, and the whole is the stadium: data is cut to the first, as it is for any range.
    const c = Math.cos(sv.pivot.heading);
    const sn = Math.sin(sv.pivot.heading);
    const own = [[sv.window.x0, sv.window.y0], [sv.window.x1, sv.window.y0], [sv.window.x1, sv.window.y1], [sv.window.x0, sv.window.y1]].map(([x, y]) => [(sv.pivot.x + x * c - y * sn - ox) * K, (sv.pivot.y + x * sn + y * c - oy) * K]);
    const bx0 = Math.min(...own.map((p) => p[0]));
    const by0 = Math.min(...own.map((p) => p[1]));
    surface.whole = { x: 0, y: 0, w: W, h: H };
    surface.box = { x: bx0, y: by0, w: Math.max(...own.map((p) => p[0])) - bx0, h: Math.max(...own.map((p) => p[1])) - by0 };
    surface.ranges = {};
    surface.marks = undefined;
  }
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
