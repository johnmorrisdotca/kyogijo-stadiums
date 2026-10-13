// Data layers: points, lines, arrows and text laid on a surface in the surface's own frame (feet, or any unit, or a provider's
// frame), cut to the surface's outline, upright when the surface is turned, with a title and a description for each layer and a
// table that stands for the drawing. Every mark is a plain SVG element in the drawing's own frame, so the same options always give
// the same string. Written for this package; mplsoccer and hockey_rink were read for the list of charts to match, and nothing of
// either is used.
import { safeColour, safeLogo } from "./colour.ts";
import { FRAMES } from "./frames.ts";
import { KYOGIJO_HEAT_STYLE } from "./style.ts";
import { drawHeat, drawLegend, heatTable, type LegendInfo } from "./heat.ts";
import { clamp01, envFor, isNum, newMade, opacityOf, own, place, toArray, unitOfLayer, type Env, type Made } from "./layers.env.ts";
import { safeClass } from "./common.ts";
import { esc, num } from "./format.ts";
import {
  curveBetween,
  curvePath,
  headPath,
  isPolygon,
  polylinePath,
  rampColour,
  shapePath,
  taperPath,
  wavePath,
  type P,
} from "./layers.marks.ts";
import type {
  Comet,
  Layer,
  LayerBase,
  LineDatum,
  LineStyle,
  MarkDatum,
  MarkShape,
  OutcomeStyle,
  Paint,
  PointDatum,
  PointStyle,
  Scale,
  TableOptions,
  TextDatum,
  TextStyle,
} from "./layers.types.ts";
import { KYOGIJO_STRINGS, fill, type KyogijoWords } from "./strings.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";
import { FEET_PER } from "./units.ts";

type Words = KyogijoWords["layers"];

/**
 * How the standard outcomes look. A word that is not here draws as a filled mark; `style.outcomes` of a layer adds words and changes these.
 * A hollow point is drawn open and a hollow line is dashed, so that an outcome is never told by colour alone.
 */
export const OUTCOMES: Readonly<Record<string, OutcomeStyle>> = Object.freeze({
  goal: { scale: 1.3 },
  scored: { scale: 1.3 },
  made: {},
  hit: {},
  complete: {},
  success: {},
  won: {},
  shot: { hollow: true },
  missed: { hollow: true },
  miss: { hollow: true },
  saved: { hollow: true },
  blocked: { hollow: true },
  incomplete: { hollow: true },
  failed: { hollow: true },
  out: { hollow: true },
  lost: { hollow: true },
});

const NEUTRAL = "var(--ky-layer)";
const HOME = "var(--ky-layer-home)";
const AWAY = "var(--ky-layer-away)";
const INK = "var(--ky-layer-ink)";


/** The layers, drawn, and a sentence for each. */
export interface RenderedLayers {
  svg: string;
  summaries: string[];
}

/** A scale from a datum's value to a number. */
function scaleOf(scale: Scale, values: readonly number[], area: boolean): (value: number | null | undefined) => number {
  const finite = values.filter(isNum);
  const [d0, d1] = scale.domain ?? (finite.length === 0 ? [0, 1] : [Math.min(...finite), Math.max(...finite)]);
  const [r0, r1] = scale.range;
  const useArea = scale.area ?? area;
  return (value) => {
    const t = isNum(value) ? clamp01(d1 === d0 ? 0.5 : (value - d0) / (d1 - d0)) : 0;
    return useArea ? Math.sqrt(r0 * r0 + (r1 * r1 - r0 * r0) * t) : r0 + (r1 - r0) * t;
  };
}

const outcomeOf = (word: string | undefined, own_: Readonly<Record<string, OutcomeStyle>> | undefined): OutcomeStyle => {
  if (typeof word !== "string" || word === "") return {};
  const key = word.toLowerCase();
  return { ...(own(OUTCOMES, key) ? OUTCOMES[key] : {}), ...(own_ !== undefined && own(own_, key) ? own_[key] : own_ !== undefined && own(own_, word) ? own_[word] : {}) };
};

/** The colour of a mark, as a CSS colour: its own, the layer's rule, the team's, or the layer's plain one. */
function colourFor(paint: Paint | undefined, d: MarkDatum, neutral: string, domain: (value: number | null | undefined) => number): string {
  const mine = safeColour(d.color);
  if (mine !== undefined) return mine;
  const team = d.team === "home" ? HOME : d.team === "away" ? AWAY : undefined;
  if (paint === undefined) return team ?? neutral;
  if (typeof paint === "string") return safeColour(paint) ?? neutral;
  if (paint.by === "team") return (d.team === "home" ? safeColour(paint.home) ?? HOME : d.team === "away" ? safeColour(paint.away) ?? AWAY : safeColour(paint.other)) ?? neutral;
  if (paint.by === "value") return isNum(d.value) ? rampColour(paint.stops, domain(d.value)) ?? neutral : safeColour(paint.missing) ?? neutral;
  const key = typeof d.outcome === "string" ? d.outcome : "";
  return (own(paint.colors, key) ? safeColour(paint.colors[key]) : undefined) ?? safeColour(paint.other) ?? neutral;
}

/** The class and the custom property that give a mark its colour, when the layer's own does not already. */
function colourAttrs(expr: string, layerExpr: string | undefined, neutral: string): { cls: string; css: string } {
  if (expr === HOME) return { cls: "ky-h", css: "" };
  if (expr === AWAY) return { cls: "ky-a", css: "" };
  if (expr === neutral || expr === layerExpr) return { cls: "", css: "" };
  return { cls: "", css: `--c:${expr}` };
}

const attrs = (cls: string, css: string, opacity: number | undefined): string => `${cls === "" ? "" : ` class="${cls}"`}${css === "" ? "" : ` style="${css}"`}${opacity === undefined ? "" : ` opacity="${num(opacity)}"`}`;
const titled = (tag: string, open: string, title: string | undefined): string => (typeof title === "string" && title !== "" ? `<${tag}${open}><title>${esc(title)}</title></${tag}>` : `<${tag}${open}/>`);
const fixedPaint = (paint: Paint | undefined): string | undefined => (typeof paint === "string" ? safeColour(paint) : undefined);

/** Count a mark that is drawn: its outcome, its team and its value. */
function tally(made: Made, d: MarkDatum): void {
  made.drawn += 1;
  if (typeof d.outcome === "string" && d.outcome !== "") made.outcomes.set(d.outcome, (made.outcomes.get(d.outcome) ?? 0) + 1);
  if (typeof d.team === "string" && d.team !== "") made.teams.set(d.team, (made.teams.get(d.team) ?? 0) + 1);
  if (isNum(d.value)) {
    made.low = Math.min(made.low, d.value);
    made.high = Math.max(made.high, d.value);
  }
}

/** Points. */
function drawPoints(layer: { data: readonly PointDatum[]; style?: PointStyle } & LayerBase, env: Env): Made {
  const made = newMade();
  const style: PointStyle = layer.style ?? {};
  const unit = unitOfLayer(layer, env);
  const k = FEET_PER[unit];
  const data = toArray(layer.data, "a points layer");
  const keep: number[] = [];
  const raw: P[] = [];
  data.forEach((d, i) => {
    if (typeof d === "object" && d !== null && isNum(d.x) && isNum(d.y)) {
      keep.push(i);
      raw.push([d.x, d.y]);
    } else made.skipped += 1;
  });
  const at = place(layer, env, raw, unit);
  const values = keep.map((i) => data[i].value).filter(isNum);
  const sizeFn = typeof style.size === "object" && style.size !== null ? scaleOf(style.size, values, true) : undefined;
  const fixed = typeof style.size === "number" && style.size > 0 ? style.size * k : env.base * (isNum(style.scale) && style.scale > 0 ? style.scale : 1);
  const domain = typeof style.fill === "object" && style.fill.by === "value" ? scaleOf({ domain: style.fill.domain, range: [0, 1] }, values, false) : () => 0;
  const layerExpr = fixedPaint(style.fill);
  const edge = style.stroke === "none" ? "none" : safeColour(style.stroke);
  const width = Math.max(0.05, fixed * 0.12);
  made.style = `--w:${num(width)}${layerExpr === undefined ? "" : `;--c:${layerExpr}`}${edge === "none" ? ";--ky-layer-edge:none" : edge === undefined ? "" : `;--ky-layer-edge:${edge}`}`;
  made.opacity = opacityOf(style.opacity);
  const out: string[] = [];
  keep.forEach((i, j) => {
    const d = data[i];
    tally(made, d);
    const [x, y] = at[j];
    const outcome = outcomeOf(d.outcome, style.outcomes);
    const shape: MarkShape | "logo" = d.shape ?? outcome.shape ?? style.shape ?? "circle";
    const w = (isNum(d.size) && d.size > 0 ? d.size * k : sizeFn === undefined ? fixed : Math.max(0.05, sizeFn(d.value) * k)) * (outcome.scale ?? 1);
    const { cls, css } = colourAttrs(colourFor(style.fill, d, NEUTRAL, domain), layerExpr, NEUTRAL);
    const classes = `${cls}${outcome.hollow === true ? `${cls === "" ? "" : " "}ky-hol` : ""}`;
    const open = attrs(classes, css, opacityOf(d.opacity));
    const role = d.team === "home" ? "home" : d.team === "away" ? "away" : undefined;
    const logo = shape === "logo" ? safeLogo(d.logo) ?? (role === undefined ? undefined : safeLogo(style.logos?.[role]) ?? env.logos[role]) : undefined;
    if (logo !== undefined) {
      const side = w * 1.8;
      out.push(titled("image", `${open} href="${esc(logo)}" x="${num(x - side / 2)}" y="${num(y - side / 2)}" width="${num(side)}" height="${num(side)}" preserveAspectRatio="xMidYMid meet"${env.turned ? ` transform="rotate(-90 ${num(x)} ${num(y)})"` : ""}`, d.title));
    } else if (shape !== "logo" && isPolygon(shape)) out.push(titled("path", `${open} d="${shapePath(shape, x, y, w, env.turned)}"`, d.title));
    else out.push(titled("circle", `${open} cx="${num(x)}" cy="${num(y)}" r="${num(w / 2)}"`, d.title));
  });
  made.marks = out.join("");
  return made;
}

/** Lines and arrows. */
function drawLines(layer: { kind: "lines" | "arrows"; data: readonly LineDatum[]; style?: LineStyle } & LayerBase, env: Env, index: string): Made {
  const made = newMade();
  const style: LineStyle = layer.style ?? {};
  const unit = unitOfLayer(layer, env);
  const k = FEET_PER[unit];
  const data = toArray(layer.data, `a ${layer.kind} layer`);
  const keep: number[] = [];
  const counts: number[] = [];
  const raw: P[] = [];
  data.forEach((d, i) => {
    let path: P[] | undefined;
    if (typeof d === "object" && d !== null) {
      if (Array.isArray(d.points) && d.points.length >= 2 && d.points.every((p) => Array.isArray(p) && isNum(p[0]) && isNum(p[1]))) path = d.points.map((p): P => [p[0], p[1]]);
      else if (isNum(d.x) && isNum(d.y) && isNum(d.x2) && isNum(d.y2)) path = [[d.x, d.y], [d.x2, d.y2]];
    }
    if (path === undefined) made.skipped += 1;
    else {
      keep.push(i);
      counts.push(path.length);
      raw.push(...path);
    }
  });
  const at = place(layer, env, raw, unit);
  const values = keep.map((i) => data[i].value).filter(isNum);
  const widthFn = typeof style.width === "object" && style.width !== null ? scaleOf(style.width, values, false) : undefined;
  const fixed = typeof style.width === "number" && style.width > 0 ? style.width * k : env.base * 0.28 * (isNum(style.scale) && style.scale > 0 ? style.scale : 1);
  const domain = typeof style.color === "object" && style.color.by === "value" ? scaleOf({ domain: style.color.domain, range: [0, 1] }, values, false) : () => 0;
  const layerExpr = fixedPaint(style.color);
  const headKind = style.head ?? (layer.kind === "arrows" ? "triangle" : "none");
  const comet: Comet | undefined = style.comet === true ? {} : typeof style.comet === "object" && style.comet !== null ? style.comet : undefined;
  made.style = `${widthFn === undefined ? `stroke-width:${num(fixed)}` : ""}${layerExpr === undefined ? "" : `${widthFn === undefined ? ";" : ""}--c:${layerExpr}`}`;
  made.opacity = opacityOf(style.opacity);
  const out: string[] = [];
  const defs: string[] = [];
  let cursor = 0;
  keep.forEach((i, j) => {
    const d = data[i];
    const pts = at.slice(cursor, cursor + counts[j]);
    cursor += counts[j];
    const first = pts[0];
    const last = pts[pts.length - 1];
    const w = isNum(d.width) && d.width > 0 ? d.width * k : widthFn === undefined ? fixed : Math.max(0.05, widthFn(d.value) * k);
    const bow = isNum(d.curve) ? d.curve : isNum(style.curve) ? style.curve : 0;
    const wavy = d.wavy ?? (style.wavy !== undefined && style.wavy !== false);
    const wave = typeof style.wavy === "object" && style.wavy !== null ? style.wavy : {};
    const outcome = outcomeOf(d.outcome, style.outcomes);
    const expr = colourFor(style.color, d, NEUTRAL, domain);
    const { cls, css } = colourAttrs(expr, layerExpr, NEUTRAL);
    const dash = style.dash === undefined || style.dash === "auto" ? (outcome.hollow === true ? "dashed" : "solid") : style.dash;
    const dashes = dash === "dashed" ? ` stroke-dasharray="${num(w * 3)} ${num(w * 2.2)}"` : dash === "dotted" ? ` stroke-dasharray="0.01 ${num(w * 2.2)}"` : "";
    const strokeWidth = widthFn === undefined && !(isNum(d.width) && d.width > 0) ? "" : ` stroke-width="${num(w)}"`;
    const headLength = headKind === "none" ? 0 : (isNum(style.headSize) && style.headSize > 0 ? style.headSize : 3.4) * w;
    let shaft: string;
    let head = "";
    let tapered: string | undefined;
    let curveLength: number;
    if (pts.length === 2) {
      const curve = curveBetween(first, last, bow);
      curveLength = curve.length;
      const hl = Math.min(headLength, curveLength * 0.5);
      if (headKind !== "none" && hl > 0) head = headPath(last, curve.tangent(curve.length), hl, hl * 0.5, headKind === "open");
      const shortened = headKind === "triangle" && hl > 0 ? curve.trim(hl * 0.9) : curve;
      if (comet?.taper === true && !wavy) tapered = taperPath(shortened, w * 1.7);
      shaft = wavy ? wavePath(shortened, wave.amplitude ?? w * 1.2, wave.wavelength ?? w * 8) : curvePath(shortened);
    } else {
      let run = 0;
      for (let m = 1; m < pts.length; m += 1) run += Math.hypot(pts[m][0] - pts[m - 1][0], pts[m][1] - pts[m - 1][1]);
      curveLength = run;
      const before = pts[pts.length - 2];
      const seg = Math.hypot(last[0] - before[0], last[1] - before[1]);
      const u: P = seg === 0 ? [1, 0] : [(last[0] - before[0]) / seg, (last[1] - before[1]) / seg];
      const hl = Math.min(headLength, seg * 0.9);
      if (headKind !== "none" && hl > 0) head = headPath(last, u, hl, hl * 0.5, headKind === "open");
      const cut: P | undefined = headKind === "triangle" && hl > 0 ? [last[0] - u[0] * hl * 0.9, last[1] - u[1] * hl * 0.9] : undefined;
      shaft = polylinePath(pts, cut);
    }
    if (curveLength === 0) {
      made.skipped += 1;
      return;
    }
    tally(made, d);
    let gradient = "";
    let shaftClass = "ky-ln";
    if (comet !== undefined) {
      const gid = `${index}-g${j}`;
      const from = isNum(comet.from) ? clamp01(comet.from) : 0.05;
      defs.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${num(first[0])}" y1="${num(first[1])}" x2="${num(last[0])}" y2="${num(last[1])}"><stop offset="0" style="stop-color:${expr};stop-opacity:${num(from)}"/><stop offset="1" style="stop-color:${expr}"/></linearGradient>`);
      if (tapered !== undefined) {
        shaft = tapered;
        shaftClass = "ky-cm";
        gradient = `fill:url(#${gid})`;
      } else gradient = `stroke:url(#${gid})`;
    }
    const headEl = head === "" ? "" : `<path class="${headKind === "open" ? "ky-ln" : "ky-ah"}" d="${head}"${headKind === "open" ? ` stroke-width="${num(w)}"` : ""}/>`;
    const title = typeof d.title === "string" && d.title !== "" ? `<title>${esc(d.title)}</title>` : "";
    const opacity = opacityOf(d.opacity);
    // A line with a head is a group (its colour and opacity on the group); a line alone carries them itself.
    const wrap = headEl !== "";
    const pathClass = [shaftClass, wrap ? "" : cls].filter((c) => c !== "").join(" ");
    const pathStyle = [wrap ? "" : css, gradient].filter((c) => c !== "").join(";");
    const pathOpen = `${attrs(pathClass, pathStyle, wrap ? undefined : opacity)} d="${shaft}"${tapered === undefined ? strokeWidth + dashes : ""}`;
    if (wrap) out.push(`<g${attrs(cls, css, opacity)}>${title}<path${pathOpen}/>${headEl}</g>`);
    else out.push(title === "" ? `<path${pathOpen}/>` : `<path${pathOpen}>${title}</path>`);
  });
  made.marks = out.join("");
  made.defs = defs.join("");
  return made;
}

/** Text. */
function drawText(layer: { data: readonly TextDatum[]; style?: TextStyle } & LayerBase, env: Env): Made {
  const made = newMade();
  const style: TextStyle = layer.style ?? {};
  const unit = unitOfLayer(layer, env);
  const k = FEET_PER[unit];
  const data = toArray(layer.data, "a text layer");
  const keep: number[] = [];
  const raw: P[] = [];
  data.forEach((d, i) => {
    if (typeof d === "object" && d !== null && isNum(d.x) && isNum(d.y) && (typeof d.text === "string" || isNum(d.text)) && String(d.text) !== "") {
      keep.push(i);
      raw.push([d.x, d.y]);
    } else made.skipped += 1;
  });
  const at = place(layer, env, raw, unit);
  const size = isNum(style.size) && style.size > 0 ? style.size * k : env.base * 1.5;
  const layerExpr = fixedPaint(style.color);
  const values = keep.map((i) => data[i].value).filter(isNum);
  const domain = typeof style.color === "object" && style.color.by === "value" ? scaleOf({ domain: style.color.domain, range: [0, 1] }, values, false) : () => 0;
  made.style = `font-size:${num(size)}px${layerExpr === undefined ? "" : `;--c:${layerExpr}`}${isNum(style.weight) ? `;font-weight:${Math.round(style.weight)}` : ""}`;
  const base = style.anchor === "start" || style.anchor === "end" ? style.anchor : "middle";
  made.attr = ` text-anchor="${base}"`;
  made.opacity = opacityOf(style.opacity);
  const out: string[] = [];
  keep.forEach((i, j) => {
    const d = data[i];
    tally(made, d);
    const [x, y] = at[j];
    const s = isNum(d.size) && d.size > 0 ? d.size * k : size;
    const { cls, css } = colourAttrs(colourFor(style.color, d, INK, domain), layerExpr, INK);
    const anchor = d.anchor === "start" || d.anchor === "middle" || d.anchor === "end" ? d.anchor : base;
    // The letters are turned back by the quarter the surface was turned, so that they read upright, and by the caller's own turn on top.
    const angle = (env.turned ? -90 : 0) + (isNum(d.rotate) ? d.rotate : 0);
    const classes = ["ky-lt", style.halo === false ? "ky-nh" : "", cls].filter((c) => c !== "").join(" ");
    const open = `${attrs(classes, `${s === size ? "" : `font-size:${num(s)}px`}${s !== size && css !== "" ? ";" : ""}${css}`, opacityOf(d.opacity))}${anchor === base ? "" : ` text-anchor="${anchor}"`} x="${num(x)}" y="${num(y + s * 0.36)}"${angle === 0 ? "" : ` transform="rotate(${num(angle)} ${num(x)} ${num(y)})"`}`;
    out.push(`<text${open}>${esc(String(d.text))}${typeof d.title === "string" && d.title !== "" ? `<title>${esc(d.title)}</title>` : ""}</text>`);
  });
  made.marks = out.join("");
  return made;
}

const plural = (words: Words, kind: Layer["kind"], n: number): string => words[`${kind === "lines" ? "line" : kind === "arrows" ? "arrow" : kind === "text" ? "text" : "point"}${n === 1 ? "One" : "Many"}` as "pointOne"];

const tidy = (text: string): string => text.replace(/[.。]\s*$/, "");

/** A list of counts, `goal 3, shot 21`, the most first. */
function listOf(counts: Map<string, number>, words: Words): string {
  return [...counts.entries()]
    .map(([name, n], order) => ({ name, n, order }))
    .sort((a, b) => b.n - a.n || a.order - b.order)
    .map(({ name, n }) => fill(words.item, { name, n }))
    .join(words.listSep);
}

function summarise(layer: Layer, made: Made, words: Words, stop: string, gap: string): { title: string; description: string } {
  // A heat layer wrote its own title and sentences.
  if (made.title !== undefined) {
    const title = typeof layer.title === "string" && layer.title !== "" ? layer.title : made.title;
    return { title, description: typeof layer.description === "string" && layer.description !== "" ? layer.description : made.text ?? "" };
  }
  const noun = typeof layer.name === "string" && layer.name.trim() !== "" ? layer.name.trim() : plural(words, layer.kind, made.drawn);
  const title = typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(words.count, { n: made.drawn, noun });
  if (typeof layer.description === "string" && layer.description !== "") return { title, description: layer.description };
  const parts: string[] = [];
  if (made.outcomes.size > 0) parts.push(fill(words.outcomes, { list: listOf(made.outcomes, words) }));
  if (made.teams.size > 0) parts.push(fill(words.teams, { list: listOf(made.teams, words) }));
  if (made.high >= made.low) parts.push(fill(words.values, { min: Math.round(made.low * 1000) / 1000, max: Math.round(made.high * 1000) / 1000 }));
  if (made.skipped > 0) parts.push(fill(words.skipped, { n: made.skipped }));
  void stop;
  return { title, description: parts.join(gap) };
}

/** The layers of a drawing as markup, and a sentence for each. `turned` says whether the surface group is turned a quarter. */
export function renderLayers(o: SurfaceOptions | ScoreOptions, layers: readonly Layer[] | undefined, turned?: boolean): RenderedLayers {
  if (layers === undefined || layers.length === 0) return { svg: "", summaries: [] };
  if (!Array.isArray(layers)) throw new TypeError("layers is a list of layers");
  const env = envFor(o, turned);
  const clipId = `${env.id}-lc`;
  const { stop, gap } = env.words.said;
  const said: string[] = [];
  const groups: string[] = [];
  const rules: string[] = [];
  const known = new Map<string, LegendInfo>();
  let clipped = false;
  /** The layers made so far, kept in order so that a legend for a layer drawn after it can be filled in last. */
  const slots: ((() => void) | undefined)[] = [];
  layers.forEach((layer, index) => {
    if (typeof layer !== "object" || layer === null) throw new TypeError(`layer ${index} is not a layer`);
    const name = safeClass(layer.id).replace(/ /g, "-");
    const gid = name === "" ? `${env.id}-l${index}` : `${env.id}-${name}`;
    const finish = (made: Made): void => {
      if (made.css !== undefined && made.css !== "") rules.push(made.css);
      if (layer.hidden === true) return;
      const { title, description } = summarise(layer, made, env.words.layers, stop, gap);
      said[index] = description === "" ? `${tidy(title)}${stop}` : `${tidy(title)}${stop}${gap}${description}`;
      const clip = layer.clip !== "none" && layer.kind !== "legend";
      clipped = clipped || clip;
      const cls = made.cls ?? (layer.kind === "points" ? "ky-pts" : layer.kind === "text" ? "ky-txt" : "ky-lns");
      groups[index] =
        `<g id="${gid}" class="ky-layer ${cls}" data-kind="${layer.kind}"${clip ? ` clip-path="url(#${clipId})"` : ""}${made.attr}${made.style === "" ? "" : ` style="${made.style}"`}${made.opacity === undefined ? "" : ` opacity="${num(made.opacity)}"`}>` +
        `<title id="${gid}-t">${esc(title)}</title>${description === "" ? "" : `<desc id="${gid}-d">${esc(description)}</desc>`}${made.defs === "" ? "" : `<defs>${made.defs}</defs>`}${made.marks}</g>${made.after ?? ""}`;
    };
    switch (layer.kind) {
      case "points":
        finish(drawPoints(layer, env));
        return;
      case "lines":
      case "arrows":
        finish(drawLines(layer, env, gid));
        return;
      case "text":
        finish(drawText(layer, env));
        return;
      case "heatmap":
      case "hexbin":
      case "zones":
      case "contour":
        finish(drawHeat(layer, env, gid, known));
        return;
      case "legend":
        // A legend may be for a layer drawn after it, so it is drawn once the others are.
        slots[index] = () => finish(drawLegend(layer, env, gid, known));
        return;
      default:
        throw new TypeError(`layer ${index} has the kind "${String((layer as { kind?: unknown }).kind)}": use points, lines, arrows, text, heatmap, hexbin, zones, contour or legend`);
    }
  });
  slots.forEach((later) => later?.());
  // The summaries and the groups are in the order of the layers, whichever order they were made in.
  const summaries = said.filter((text) => text !== undefined);
  const placed = groups.filter((g) => g !== undefined);
  groups.length = 0;
  groups.push(...placed);
  if (groups.length === 0) return { svg: "", summaries };
  const defs = clipped ? `<defs><clipPath id="${clipId}"><path d="${env.outline.d}"/></clipPath></defs>` : "";
  // The heat layers' rules go beside them, unless the page supplies the stylesheet (KYOGIJO_STYLE has them); the dark set of a ramp is the layer's own and always comes.
  const heated = groups.some((g) => g.includes('class="ky-layer ky-hm') || g.includes('class="ky-lgw"'));
  const sheet = `${env.o.style === "none" || !heated ? "" : KYOGIJO_HEAT_STYLE}${rules.join("")}`;
  const style = sheet === "" ? "" : `<style>${sheet}</style>`;
  return { svg: `<g class="ky-layers" data-layers="${groups.length}">${defs}${style}${groups.join("")}</g>`, summaries };
}

/**
 * The layers of a drawing as one SVG group, in the surface's own frame, for a caller who composes the drawing's parts. Put it inside the
 * surface's group (the one with the quarter turn, when the drawing is tall) and the marks lie on the surface, cut to its outline, with
 * the text still upright. The same options and layers always give the same string; `drawKyogijo` draws exactly this when it is given `layers`.
 * @example
 * ```ts
 * import { drawLayers } from "@johnmorrisdotca/kyogijo";
 * const group = drawLayers({ sport: "nhl", id: "rink" }, [
 *   { kind: "points", name: "shots", data: [{ x: 169, y: 20.5, outcome: "goal", team: "home" }, { x: 150, y: 40, outcome: "shot", team: "home" }] },
 * ]);
 * console.log(group.startsWith('<g class="ky-layers"'), group.includes("2 shots"));
 * // true true
 * ```
 */
export function drawLayers(options: SurfaceOptions | ScoreOptions, layers: readonly Layer[]): string {
  return renderLayers(options, layers).svg;
}

/** The unit of a frame's numbers, for a layer's `from` that names or is a frame. */
const frameUnit = (from: LayerBase["from"]): string | undefined => (from === undefined ? undefined : typeof from === "string" ? FRAMES[from]?.unit : from.unit);

const cell = (value: unknown): string => (isNum(value) ? String(Math.round(value * 1000) / 1000) : typeof value === "string" ? esc(value) : "");

/**
 * An HTML table for each layer: the data the drawing shows, as text, for a screen reader or for a page that wants its numbers. The
 * coordinates are the ones given (in the layer's frame and unit), and a caption says which. Hidden layers are in it too. Every cell is escaped.
 * @example
 * ```ts
 * import { layerTable } from "@johnmorrisdotca/kyogijo";
 * const html = layerTable([{ kind: "points", name: "shots", from: "nhl-api", data: [{ x: 69, y: 22, outcome: "goal", title: "Goal, 2nd period" }] }]);
 * console.log(html.includes("<th scope=\"col\">Outcome</th>"), html.includes("Goal, 2nd period"));
 * // true true
 * ```
 */
export function layerTable(layers: readonly Layer[], options: TableOptions = {}): string {
  const words = KYOGIJO_STRINGS[options.language === "ja" ? "ja" : "en"];
  const w = words.layers;
  const maxRows = isNum(options.maxRows) && options.maxRows >= 0 ? Math.floor(options.maxRows) : 500;
  const cls = safeClass(options.className) || "ky-table";
  if (!Array.isArray(layers)) throw new TypeError("layers is a list of layers");
  const surfaceEnv = options.surface === undefined ? undefined : envFor({ ...options.surface, language: options.language ?? options.surface.language }, false);
  return layers
    .map((layer, index) => {
      if (layer.kind === "legend") return "";
      if (surfaceEnv !== undefined && (layer.kind === "heatmap" || layer.kind === "hexbin" || layer.kind === "zones" || layer.kind === "contour")) {
        const t = heatTable(layer, surfaceEnv);
        const shown = t.rows.slice(0, maxRows);
        const more = t.rows.length > shown.length ? fill(w.tableMore, { shown: shown.length, total: t.rows.length }) : "";
        const note = [t.note, more].filter((part) => part !== "").join(words.said.gap);
        const body = shown.map((row) => `<tr><th scope="row">${cell(row[0])}</th>${row.slice(1).map((value) => `<td>${cell(value)}</td>`).join("")}</tr>`).join("");
        return `<table class="${cls}" data-kind="${layer.kind}"><caption>${esc(t.title)}${note === "" ? "" : ` <small>${esc(note)}</small>`}</caption><thead><tr>${t.head.map((name, i) => `<th scope="col">${esc(i === 0 ? w.tableNo : name)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`;
      }
      const data = toArray(layer.data as readonly Record<string, unknown>[], `layer ${index}`);
      const columns: [string, string, (d: Record<string, unknown>) => unknown][] = [];
      const has = (key: string): boolean => data.some((d) => typeof d === "object" && d !== null && d[key] !== undefined && d[key] !== null);
      if (layer.kind === "text") columns.push([w.tableText, "text", (d) => d.text]);
      columns.push([w.tableX, "x", (d) => d.x]);
      columns.push([w.tableY, "y", (d) => d.y]);
      if (layer.kind === "lines" || layer.kind === "arrows") {
        columns.push([w.tableToX, "x2", (d) => d.x2]);
        columns.push([w.tableToY, "y2", (d) => d.y2]);
        if (has("points")) columns.push([w.tablePath, "points", (d) => (Array.isArray(d.points) ? d.points.map((p: unknown) => (Array.isArray(p) ? `(${cell(p[0])}, ${cell(p[1])})` : "")).join(" ") : "")]);
      }
      for (const [head, key] of [[w.tableValue, "value"], [w.tableTeam, "team"], [w.tableOutcome, "outcome"], [w.tableNote, "title"]] as const) if (has(key)) columns.push([head, key, (d) => d[key]]);
      const rows = data.slice(0, maxRows);
      const names = typeof layer.name === "string" && layer.name.trim() !== "" ? layer.name.trim() : plural(w, layer.kind, data.length);
      const title = typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.count, { n: data.length, noun: names });
      const frame = layer.from === undefined ? undefined : typeof layer.from === "string" ? layer.from : layer.from.name;
      // A frame's numbers are in the frame's own unit (tenths of a foot for the NBA's); without one they are in the layer's.
      const unit = frameUnit(layer.from) ?? (layer.units === "rulebook" ? "rulebook" : layer.units ?? "ft");
      const note = [frame === undefined ? undefined : fill(w.tableFrame, { frame, unit }), data.length > rows.length ? fill(w.tableMore, { shown: rows.length, total: data.length }) : undefined].filter((part) => part !== undefined).join(words.said.gap);
      const head = `<tr><th scope="col">${esc(w.tableNo)}</th>${columns.map(([name]) => `<th scope="col">${esc(name)}</th>`).join("")}</tr>`;
      const body = rows.map((d, n) => `<tr><th scope="row">${n + 1}</th>${columns.map(([, , read]) => `<td>${typeof d === "object" && d !== null ? cell(read(d)) : ""}</td>`).join("")}</tr>`).join("");
      return `<table class="${cls}" data-kind="${layer.kind}"><caption>${esc(title)}${note === "" ? "" : ` <small>${esc(note)}</small>`}</caption><thead>${head}</thead><tbody>${body}</tbody></table>`;
    })
    .join("");
}
