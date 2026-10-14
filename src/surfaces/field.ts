import { el, num } from "../format.ts";
import { outlineD, roundedD } from "../fields.kit.ts";
import { mowTurf, oddCells } from "../mow.ts";
import type { Area, Dash, FieldPlan, GoalPlan, Shape } from "../fields.types.ts";
import type { GoalStyle } from "../types.ts";
import { ft, quarterTurn, type BuildOptions, type Surface } from "./surface.ts";

const RAD = Math.PI / 180;

/** The path of one shape that is drawn as a line, or of one filled bar. */
export function pathOf(shape: Shape): string {
  switch (shape.kind) {
    case "line":
      return shape.y0 === shape.y1 ? `M${num(shape.x0)} ${num(shape.y0)}H${num(shape.x1)}` : shape.x0 === shape.x1 ? `M${num(shape.x0)} ${num(shape.y0)}V${num(shape.y1)}` : `M${num(shape.x0)} ${num(shape.y0)}L${num(shape.x1)} ${num(shape.y1)}`;
    case "arc": {
      const p = (a: number): string => `${num(shape.cx + shape.r * Math.cos(a * RAD))} ${num(shape.cy + shape.r * Math.sin(a * RAD))}`;
      const sweep = shape.a1 > shape.a0 ? 1 : 0;
      return `M${p(shape.a0)}A${num(shape.r)} ${num(shape.r)} 0 ${Math.abs(shape.a1 - shape.a0) > 180 ? 1 : 0} ${sweep} ${p(shape.a1)}`;
    }
    case "ring":
      return `M${num(shape.cx - shape.rx)} ${num(shape.cy)}A${num(shape.rx)} ${num(shape.ry)} 0 1 0 ${num(shape.cx + shape.rx)} ${num(shape.cy)}A${num(shape.rx)} ${num(shape.ry)} 0 1 0 ${num(shape.cx - shape.rx)} ${num(shape.cy)}Z`;
    case "box":
      return `M${num(shape.x0)} ${num(shape.y0)}H${num(shape.x1)}V${num(shape.y1)}H${num(shape.x0)}Z`;
    case "poly":
      return `M${shape.points.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}${shape.closed === true ? "Z" : ""}`;
    case "bar":
      return `M${num(shape.x0)} ${num(shape.y0)}H${num(shape.x1)}V${num(shape.y1)}H${num(shape.x0)}Z`;
    case "path":
      return shape.d;
    default:
      return "";
  }
}

export const areaD = (a: Area): string => {
  if (a.d !== undefined) return a.d;
  if (a.frame !== undefined) {
    const f = a.frame;
    return `${roundedD(f.x0 - f.thick, f.y0 - f.thick, f.x1 + f.thick, f.y1 + f.thick, f.radius + f.thick)}${roundedD(f.x0, f.y0, f.x1, f.y1, f.radius)}`;
  }
  if (a.rect !== undefined) {
    const [x0, y0, x1, y1] = a.rect;
    return `M${num(x0)} ${num(y0)}H${num(x1)}V${num(y1)}H${num(x0)}Z`;
  }
  const [cx, cy, rx, ry] = a.ellipse as readonly [number, number, number, number];
  return `M${num(cx - rx)} ${num(cy)}A${num(rx)} ${num(ry)} 0 1 0 ${num(cx + rx)} ${num(cy)}A${num(rx)} ${num(ry)} 0 1 0 ${num(cx - rx)} ${num(cy)}Z`;
};

/** The painted lines of a plan: the shapes drawn with the line's paint, those alike in feature, width and dash put in one path. */
export function strokes(plan: Pick<FieldPlan, "shapes" | "lineWidth" | "drawnLine">, o: Pick<BuildOptions, "exact" | "features">): string {
  const groups = new Map<string, { feature: string; w: number; dash: Dash | undefined; cls: string; d: string[] }>();
  const base = o.exact ? plan.lineWidth : plan.drawnLine;
  for (const shape of plan.shapes) {
    if (shape.kind === "dot" || shape.kind === "bar") continue;
    const w = o.exact ? (shape.w ?? plan.lineWidth) : Math.max(shape.w ?? plan.lineWidth, shape.least ?? plan.drawnLine);
    const key = `${shape.feature}|${num(w)}|${shape.dash?.join(",") ?? ""}|${shape.cls ?? ""}`;
    const group = groups.get(key) ?? { feature: shape.feature, w, dash: shape.dash, cls: shape.cls ?? "ky-line", d: [] };
    group.d.push(pathOf(shape));
    groups.set(key, group);
  }
  let out = "";
  for (const group of groups.values()) {
    out += el("path", { class: ft(o, group.feature, group.cls), d: group.d.join(""), "stroke-width": group.w === base ? base : group.w, "stroke-dasharray": group.dash === undefined ? undefined : `${num(group.dash[0])} ${num(group.dash[1])}`, fill: "none" });
  }
  return out;
}

/** The filled marks of a plan: the bars in one path to a feature, the dots one each. */
export function marks(plan: Pick<FieldPlan, "shapes">, o: Pick<BuildOptions, "exact" | "features">): string {
  const bars = new Map<string, string[]>();
  let dots = "";
  const lift = o.exact ? 1 : 1.6;
  for (const shape of plan.shapes) {
    if (shape.kind === "bar") bars.set(`${shape.feature}|${shape.cls ?? ""}`, [...(bars.get(`${shape.feature}|${shape.cls ?? ""}`) ?? []), pathOf(shape)]);
    else if (shape.kind === "dot") dots += el("circle", { class: ft(o, shape.feature, shape.paint === "post" ? "ky-post-end" : shape.paint === "block" ? "ky-ska-block" : shape.paint === "cone" ? "ky-ska-cone" : "ky-fill-line"), cx: shape.cx, cy: shape.cy, r: shape.r * lift });
  }
  let out = "";
  for (const [key, d] of bars) {
    const [feature, cls] = key.split("|");
    out += el("path", { class: ft(o, feature, cls === "" ? "ky-fill-line" : cls), d: d.join("") });
  }
  return out + dots;
}

/** One goal as the options ask for it: the net behind the goal line as a box, a line across the mouth, a solid strip, or nothing. */
function goalMarkup(goal: GoalPlan, style: GoalStyle, thick: number, o: BuildOptions): string {
  if (style === "none") return "";
  const half = goal.width / 2;
  const x = goal.x;
  const out = goal.out;
  if (style === "line") return el("path", { class: ft(o, "goals", "ky-goal"), d: `M${num(x)} ${num(goal.y - half)}V${num(goal.y + half)}`, "stroke-width": thick * 3, fill: "none" });
  if (style === "strip") return el("path", { class: ft(o, "goals", "ky-goal-strip"), d: `M${num(x)} ${num(goal.y - half)}h${num(out * Math.max(goal.depth, thick * 2))}v${num(2 * half)}h${num(-out * Math.max(goal.depth, thick * 2))}z` });
  const d = `M${num(x)} ${num(goal.y - half)}h${num(out * goal.depth)}v${num(2 * half)}h${num(-out * goal.depth)}`;
  return el("path", { class: ft(o, "goals", "ky-goal"), d, "stroke-width": thick * 1.4, fill: "none", "stroke-linejoin": "round" }) + el("path", { class: ft(o, "goals", "ky-goal"), d: `M${num(x)} ${num(goal.y - half)}V${num(goal.y + half)}`, "stroke-width": thick * 1.4, fill: "none" });
}

/**
 * A field sport's surface lying wide, from the sport's plan: the ground, the mown turf, the painted areas, the lines, the goals, and, on a score, the
 * ends painted in the teams' colours and the place for the board. The markings are the plan's, which are the rulebook's (leagues/*.ts).
 */
export function fieldSurface(o: BuildOptions, plan: FieldPlan, style: { goals?: GoalStyle } = {}): Surface {
  const L = plan.length;
  const W = plan.width;
  const m = o.margin ?? plan.margin;
  const view0 = { x: -m, y: -m, w: L + 2 * m, h: W + 2 * m };
  const shaped = plan.outline.kind !== "rect" || (plan.outline.radius ?? 0) > 0;
  const full = o.detail === "full";
  const edge = outlineD(L, W, plan.outline);

  let defs = "";
  const surfaceShape = shaped ? el("path", { class: ft(o, plan.surfaceFeature ?? "turf", "ky-surface"), d: edge }) : el("rect", { class: ft(o, plan.surfaceFeature ?? "turf", "ky-surface"), x: 0, y: 0, width: L, height: W });
  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h }) + surfaceShape;
  // Mown bands, cut to an oval surface or to the rectangle where the pattern runs past it.
  if (o.stripes && plan.band > 0 && o.mow !== "none") {
    const pattern = o.mow !== undefined && o.mow !== "rings" && o.mow !== "fan" ? o.mow : "bands";
    const cells = oddCells(L, plan.band);
    const mown = mowTurf(pattern, { x: 0, y: 0, w: L, h: W }, L / cells);
    if (mown.path !== "") {
      const clip = shaped || mown.clip;
      if (clip) defs += el("clipPath", { id: `${o.id}-turf` }, shaped ? el("path", { d: edge }) : el("rect", { x: 0, y: 0, width: L, height: W }));
      base += el("path", { class: ft(o, "mowing", "ky-stripe"), d: mown.path, "fill-rule": mown.evenodd ? "evenodd" : undefined, "clip-path": clip ? `url(#${o.id}-turf)` : undefined });
    }
  }
  for (const area of plan.areas) base += el("path", { class: ft(o, area.feature, area.cls), d: areaD(area), "fill-rule": area.frame === undefined && area.evenodd !== true ? undefined : "evenodd" });
  const ends = o.score && o.pageant !== true && plan.ends !== undefined ? plan.ends : undefined;
  if (ends !== undefined) {
    for (const side of ["left", "right"] as const) {
      const b = ends[side];
      base += el("rect", { class: ft(o, `${plan.endFeature ?? "end-zone"}-${side}`, `ky-zone ky-zone-${side}`), x: b.x, y: b.y, width: b.w, height: b.h });
    }
  }

  let lines = strokes(plan, o) + marks(plan, o);
  const thick = o.exact ? plan.lineWidth : plan.drawnLine;
  let goals = "";
  let custom = "";
  for (const goal of plan.goals) {
    if (o.goalMarkup === undefined) goals += goalMarkup(goal, style.goals ?? "box", thick, o);
    else custom += o.goalMarkup({ sport: plan.sport, end: goal.end, x: goal.x, y: goal.y, width: goal.width, depth: goal.depth, out: goal.out, line: thick });
  }
  lines += goals;

  const surface: Surface = {
    sport: plan.sport,
    view: view0,
    base,
    lines: lines + custom,
    defs,
    left: plan.left,
    right: plan.right,
    plate: plan.plate,
    turned: o.portrait,
    onColour: ends !== undefined,
  };
  surface.box = { x: 0, y: 0, w: L, h: W };
  surface.lineRef = { width: thick, feet: 1 };
  surface.ranges = plan.ranges;
  // A pageant's pictures keep clear of a cricket pitch, which runs through the middle.
  const pitch = plan.sport === "cricket" ? plan.ranges?.pitch : undefined;
  if (pitch !== undefined && !("left" in pitch)) surface.pageant = { clear: pitch.w / 2 };
  if (o.landmarks === true) surface.marks = full ? [...plan.marks] : plan.marks.filter((mark) => !mark.id.startsWith("~"));
  if (o.portrait) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
