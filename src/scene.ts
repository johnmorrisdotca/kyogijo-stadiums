// A drawing as data. The drawing is still written once, by the code that writes the SVG; the scene reads that markup (a tree that gives the same text back,
// see scene.xml.ts), works out what a browser would paint for each shape in light or dark (the stylesheet that is in the drawing, the custom properties,
// the inheritance), and lists the shapes in paint order with their transforms and clips. There is no second drawing of anything.
import { drawKyogijo } from "./draw.ts";
import { evaluate, inlineStyle, lengthOf, matched, parseStylesheet, substitute, type CssNode, type Stylesheet } from "./scene.css.ts";
import { IDENTITY, multiply, parseTransform, pathCommands } from "./scene.path.ts";
import type { Matrix, Paint, Scene, SceneBase, SceneClip, SceneGradient, SceneImage, SceneItem, SceneOptions, ScenePattern, SceneShape, SceneSource, SceneStyle, SceneText } from "./scene.types.ts";
import { decode, elements, parseSvg, textOf, type SvgNode } from "./scene.xml.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

/** What inherits down the tree, already worked out. */
interface Inherited {
  fill: string;
  stroke: string;
  strokeWidth: number;
  lineJoin: SceneStyle["lineJoin"];
  lineCap: SceneStyle["lineCap"];
  dash: readonly number[] | undefined;
  fillRule: SceneStyle["fillRule"];
  fillOpacity: number;
  strokeOpacity: number;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  anchor: SceneText["anchor"];
  letterSpacing: number;
  paintOrder: "stroke" | undefined;
}

/** What a node is computed with. */
interface Ctx {
  css: CssNode;
  vars: Readonly<Record<string, string>>;
  inherited: Inherited;
  /** The product of the opacity of every group above. */
  opacity: number;
  matrix: Matrix;
  clips: readonly number[];
  data: Readonly<Record<string, string>>;
  /** Inside the group that holds the surface. */
  surface: boolean;
  /** The filters of the groups above, which a shape takes for its own (right for the colour filters the package uses, not for a blur). */
  filter: string | undefined;
}

/** What does not inherit, for one node. */
interface Own {
  opacity: number;
  filter: string | undefined;
  stopColor: string | undefined;
  stopOpacity: number;
  hidden: boolean;
}

const START: Inherited = { fill: "#000000", stroke: "none", strokeWidth: 1, lineJoin: "miter", lineCap: "butt", dash: undefined, fillRule: "nonzero", fillOpacity: 1, strokeOpacity: 1, fontSize: 16, fontWeight: 400, fontFamily: "sans-serif", anchor: "start", letterSpacing: 0, paintOrder: undefined };

/** The properties an element may carry as an attribute as well as in CSS. */
const PRESENTATION = ["fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "stroke-dasharray", "fill-rule", "fill-opacity", "stroke-opacity", "font-size", "font-weight", "font-family", "text-anchor", "letter-spacing", "paint-order", "opacity", "filter", "stop-color", "stop-opacity", "display", "visibility"];

const unit = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return value !== undefined && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
};

function decodedAttrs(node: SvgNode): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.attrs)) out[key] = decode(value);
  return out;
}

/** The context of a node inside its parent's. */
function contextOf(parent: Ctx, node: SvgNode, sheet: Stylesheet): { ctx: Ctx; own: Own } {
  const attrs = decodedAttrs(node);
  const css: CssNode = { name: node.name, attrs, parent: parent.css };
  const declarations: [string, string][] = [];
  for (const name of PRESENTATION) if (attrs[name] !== undefined) declarations.push([name, attrs[name]]);
  declarations.push(...matched(sheet, css), ...inlineStyle(attrs.style));
  let vars = parent.vars;
  if (declarations.some(([name]) => name.startsWith("--"))) {
    const own: Record<string, string> = { ...vars };
    for (const [name, value] of declarations) if (name.startsWith("--")) own[name] = value;
    vars = own;
  }
  const inherited: Inherited = { ...parent.inherited };
  const own: Own = { opacity: 1, filter: undefined, stopColor: undefined, stopOpacity: 1, hidden: false };
  // The font size first: a length in em is of the node's own.
  const sized = [...declarations.filter(([name]) => name === "font-size"), ...declarations.filter(([name]) => name !== "font-size" && !name.startsWith("--"))];
  for (const [name, raw] of sized) {
    const value = substitute(raw, vars);
    if (value === undefined) continue;
    const v = value.trim();
    switch (name) {
      case "font-size":
        inherited.fontSize = lengthOf(v, parent.inherited.fontSize) ?? inherited.fontSize;
        break;
      case "fill":
        inherited.fill = v;
        break;
      case "stroke":
        inherited.stroke = v;
        break;
      case "stroke-width":
        inherited.strokeWidth = lengthOf(v, inherited.fontSize) ?? inherited.strokeWidth;
        break;
      case "stroke-linejoin":
        if (v === "miter" || v === "round" || v === "bevel") inherited.lineJoin = v;
        break;
      case "stroke-linecap":
        if (v === "butt" || v === "round" || v === "square") inherited.lineCap = v;
        break;
      case "stroke-dasharray": {
        if (v === "none") inherited.dash = undefined;
        else {
          const list = evaluate(v, inherited.fontSize).split(/[\s,]+/).filter((part) => part !== "").map(Number);
          inherited.dash = list.length > 0 && list.every((n) => Number.isFinite(n) && n >= 0) && list.some((n) => n > 0) ? list : undefined;
        }
        break;
      }
      case "fill-rule":
        if (v === "nonzero" || v === "evenodd") inherited.fillRule = v;
        break;
      case "fill-opacity":
        inherited.fillOpacity = unit(v, inherited.fillOpacity);
        break;
      case "stroke-opacity":
        inherited.strokeOpacity = unit(v, inherited.strokeOpacity);
        break;
      case "font-weight":
        inherited.fontWeight = v === "bold" ? 700 : v === "normal" ? 400 : Number.isFinite(Number(v)) ? Number(v) : inherited.fontWeight;
        break;
      case "font-family":
        inherited.fontFamily = v;
        break;
      case "text-anchor":
        if (v === "start" || v === "middle" || v === "end") inherited.anchor = v;
        break;
      case "letter-spacing":
        inherited.letterSpacing = v === "normal" ? 0 : (lengthOf(v, inherited.fontSize) ?? 0);
        break;
      case "paint-order":
        inherited.paintOrder = v.startsWith("stroke") ? "stroke" : undefined;
        break;
      case "opacity":
        own.opacity = unit(v, 1);
        break;
      case "filter":
        own.filter = v === "none" ? undefined : v;
        break;
      case "stop-color":
        own.stopColor = v;
        break;
      case "stop-opacity":
        own.stopOpacity = unit(v, 1);
        break;
      case "display":
        if (v === "none") own.hidden = true;
        break;
      case "visibility":
        if (v === "hidden" || v === "collapse") own.hidden = true;
        break;
      default:
    }
  }
  const data = { ...parent.data };
  for (const [key, value] of Object.entries(attrs)) if (key.startsWith("data-")) data[key.slice(5)] = value;
  const matrix = attrs.transform === undefined ? parent.matrix : multiply(parent.matrix, parseTransform(attrs.transform));
  const surface = parent.surface || (attrs.class ?? "").split(/\s+/).includes("ky-surface-group");
  return { ctx: { css, vars, inherited, opacity: parent.opacity * own.opacity, matrix, clips: parent.clips, data, surface, filter: own.filter === undefined ? parent.filter : [parent.filter, own.filter].filter((f) => f !== undefined).join(" ") }, own };
}

const SKIPPED = new Set(["defs", "title", "desc", "style", "metadata", "clipPath", "linearGradient", "radialGradient", "pattern", "marker", "mask", "symbol", "filter"]);
const SHAPES = new Set(["rect", "circle", "ellipse", "line", "polygon", "polyline", "path"]);

const n = (node: Record<string, string>, name: string, fallback = 0): number => {
  const v = Number(node[name]);
  return node[name] !== undefined && Number.isFinite(v) ? v : fallback;
};

function* walkAll(node: SvgNode): Generator<SvgNode> {
  yield node;
  for (const child of elements(node)) yield* walkAll(child);
}

const isShape = (item: SceneItem): item is SceneShape => item.kind !== "text" && item.kind !== "image";

const urlId = (value: string): string | undefined => /^url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/.exec(value)?.[1];

/**
 * A drawing the package wrote, as a scene. `theme` works the colours out for light or dark: without it, the drawing's own `data-theme`, else light.
 * A drawing made with `style: "none"` is read with the package's own stylesheet (`KYOGIJO_STYLE`); `css` adds a page's rules after the drawing's.
 * @example
 * ```ts
 * import { drawKyogijo } from "@johnmorrisdotca/kyogijo";
 * import { sceneFromSvg } from "@johnmorrisdotca/kyogijo/scene";
 * const scene = sceneFromSvg(drawKyogijo({ sport: "nhl", id: "rink" }), { theme: "dark" });
 * console.log(scene.theme, scene.items[0].kind, scene.items[0].style.fill);
 * // dark rect #1a2025
 * ```
 */
export function sceneFromSvg(svg: string, options: SceneOptions = {}): Scene {
  const root = parseSvg(svg);
  if (root.name !== "svg") throw new Error(`An <svg> is expected, not <${root.name}>`);
  const rootAttrs = decodedAttrs(root);
  const theme: "light" | "dark" = options.theme ?? (rootAttrs["data-theme"] === "dark" ? "dark" : "light");

  const own: string[] = [];
  const find = (node: SvgNode): void => {
    if (node.name === "style") own.push(textOf(node));
    for (const child of elements(node)) find(child);
  };
  find(root);
  const sheet = parseStylesheet(own.length > 0 ? own.join("\n") : KYOGIJO_STYLE, theme);
  if (options.css !== undefined) parseStylesheet(options.css, theme, sheet);

  const html: CssNode = { name: "html", attrs: { "data-theme": theme } };
  const top: Ctx = { css: html, vars: {}, inherited: START, opacity: 1, matrix: IDENTITY, clips: [], data: {}, surface: false, filter: undefined };

  // Everything with an id that a shape may refer to, with the chain of nodes above it (for the context it is computed in).
  const definitions = new Map<string, { node: SvgNode; chain: SvgNode[] }>();
  const index = (node: SvgNode, chain: SvgNode[]): void => {
    const id = node.attrs.id;
    if (id !== undefined && (node.name === "clipPath" || node.name === "linearGradient" || node.name === "pattern")) definitions.set(decode(id), { node, chain });
    for (const child of elements(node)) index(child, [...chain, node]);
  };
  index(root, []);

  const contexts = new Map<SvgNode, { ctx: Ctx; own: Own }>();
  const contextAt = (chain: SvgNode[], node: SvgNode): { ctx: Ctx; own: Own } => {
    const cached = contexts.get(node);
    if (cached !== undefined) return cached;
    let parent = top;
    for (const above of chain) {
      let known = contexts.get(above);
      if (known === undefined) {
        known = contextOf(parent, above, sheet);
        contexts.set(above, known);
      }
      parent = known.ctx;
    }
    const made = contextOf(parent, node, sheet);
    contexts.set(node, made);
    return made;
  };

  const clips: SceneClip[] = [];
  const clipIndex = new Map<string, number>();
  const gradients: SceneGradient[] = [];
  const gradientDone = new Set<string>();
  const patterns: ScenePattern[] = [];
  const patternDone = new Set<string>();

  const paintOf = (value: string): Paint => {
    const id = urlId(value);
    if (id === undefined) return value;
    const def = definitions.get(id);
    if (def === undefined) return "none";
    if (def.node.name === "linearGradient") {
      if (!gradientDone.has(id)) {
        gradientDone.add(id);
        const a = decodedAttrs(def.node);
        const stops = elements(def.node)
          .filter((stop) => stop.name === "stop")
          .map((stop) => {
            const s = contextAt([...def.chain, def.node], stop);
            const offset = decodedAttrs(stop).offset ?? "0";
            return { offset: unit(offset.endsWith("%") ? String(Number(offset.slice(0, -1)) / 100) : offset, 0), color: s.own.stopColor ?? "#000000", opacity: s.own.stopOpacity };
          });
        gradients.push({ id, x1: n(a, "x1"), y1: n(a, "y1"), x2: n(a, "x2", 1), y2: n(a, "y2"), stops });
      }
      return { gradient: id };
    }
    if (def.node.name === "pattern") {
      if (!patternDone.has(id)) {
        patternDone.add(id);
        const a = decodedAttrs(def.node);
        const at = contextAt(def.chain, def.node).ctx;
        const found: SceneItem[] = [];
        for (const child of elements(def.node)) collect(child, { ...at, matrix: IDENTITY, clips: [] }, found);
        patterns.push({ id, width: n(a, "width"), height: n(a, "height"), shapes: found.filter(isShape) });
      }
      return { pattern: id };
    }
    return "none";
  };

  /** Clip index for a `clip-path` attribute on a node whose frame is `matrix`. */
  const clipFor = (value: string | undefined, matrix: Matrix): number | undefined => {
    const id = value === undefined ? undefined : urlId(value);
    if (id === undefined) return undefined;
    const def = definitions.get(id);
    if (def === undefined || def.node.name !== "clipPath") return undefined;
    const key = `${id}|${matrix.join(",")}`;
    const known = clipIndex.get(key);
    if (known !== undefined) return known;
    const at = contextAt(def.chain, def.node).ctx;
    const found: SceneItem[] = [];
    for (const child of elements(def.node)) collect(child, { ...at, matrix: IDENTITY, clips: [] }, found);
    clips.push({ id, matrix, shapes: found.filter(isShape) });
    clipIndex.set(key, clips.length - 1);
    return clips.length - 1;
  };

  const styleOf = (ctx: Ctx): SceneStyle => ({
    fill: paintOf(ctx.inherited.fill),
    stroke: paintOf(ctx.inherited.stroke),
    strokeWidth: ctx.inherited.strokeWidth,
    opacity: ctx.opacity,
    fillOpacity: ctx.inherited.fillOpacity,
    strokeOpacity: ctx.inherited.strokeOpacity,
    lineJoin: ctx.inherited.lineJoin,
    lineCap: ctx.inherited.lineCap,
    ...(ctx.inherited.dash === undefined ? {} : { dash: ctx.inherited.dash }),
    fillRule: ctx.inherited.fillRule,
    ...(ctx.inherited.paintOrder === undefined ? {} : { paintOrder: ctx.inherited.paintOrder }),
    ...(ctx.filter === undefined ? {} : { filter: ctx.filter }),
  });

  const baseOf = (node: SvgNode, attrs: Record<string, string>, ctx: Ctx): SceneBase => {
    const title = elements(node).find((child) => child.name === "title");
    return {
      class: attrs.class ?? "",
      ...(attrs.id === undefined ? {} : { id: attrs.id }),
      ...(Object.keys(ctx.data).length === 0 ? {} : { data: ctx.data }),
      ...(title === undefined ? {} : { label: textOf(title) }),
      matrix: ctx.matrix,
      clips: ctx.clips,
      ...(ctx.surface ? { surface: true as const } : {}),
      style: styleOf(ctx),
    };
  };

  /** Shapes (and text and images when `out` takes them) of a node and below, in paint order. */
  function collect(node: SvgNode, parent: Ctx, out: SceneItem[]): void {
    if (SKIPPED.has(node.name)) return;
    const { ctx: made, own } = contextOf(parent, node, sheet);
    if (own.hidden) return;
    let ctx = made;
    const attrs = decodedAttrs(node);
    const clip = clipFor(attrs["clip-path"], ctx.matrix);
    if (clip !== undefined) ctx = { ...ctx, clips: [...ctx.clips, clip] };
    if (SHAPES.has(node.name)) {
      const base = baseOf(node, attrs, ctx);
      switch (node.name) {
        case "rect":
          out.push({ ...base, kind: "rect", x: n(attrs, "x"), y: n(attrs, "y"), width: n(attrs, "width"), height: n(attrs, "height"), rx: n(attrs, "rx", n(attrs, "ry")) } as SceneItem);
          break;
        case "circle":
          out.push({ ...base, kind: "circle", cx: n(attrs, "cx"), cy: n(attrs, "cy"), r: n(attrs, "r") } as SceneItem);
          break;
        case "ellipse":
          out.push({ ...base, kind: "ellipse", cx: n(attrs, "cx"), cy: n(attrs, "cy"), rx: n(attrs, "rx"), ry: n(attrs, "ry") } as SceneItem);
          break;
        case "line":
          out.push({ ...base, kind: "line", x1: n(attrs, "x1"), y1: n(attrs, "y1"), x2: n(attrs, "x2"), y2: n(attrs, "y2") } as SceneItem);
          break;
        case "polygon":
        case "polyline": {
          const v = (attrs.points ?? "").split(/[\s,]+/).filter((p) => p !== "").map(Number);
          const points: [number, number][] = [];
          for (let i = 0; i + 1 < v.length; i += 2) points.push([v[i], v[i + 1]]);
          out.push({ ...base, kind: node.name, points } as SceneItem);
          break;
        }
        default:
          out.push({ ...base, kind: "path", d: attrs.d ?? "", commands: pathCommands(attrs.d ?? "") } as SceneItem);
      }
      return;
    }
    if (node.name === "text") {
      // A run of text is one item; a `<tspan>` that sets a place (x or y, dx or dy) is another, at that place, with the style it has.
      let x = n(attrs, "x");
      let y = n(attrs, "y");
      let run = "";
      const flush = (at: Ctx, from: Record<string, string>, source: SvgNode): void => {
        if (run === "") return;
        const i = at.inherited;
        out.push({ ...baseOf(source, from, at), kind: "text", x, y, text: run, fontSize: i.fontSize, fontWeight: i.fontWeight, fontFamily: i.fontFamily, anchor: i.anchor, letterSpacing: i.letterSpacing } as SceneItem);
        run = "";
      };
      const words = (from: SvgNode, at: Ctx, fromAttrs: Record<string, string>): void => {
        for (const child of from.children) {
          if (typeof child === "string") run += decode(child);
          else if (child.name === "tspan") {
            flush(at, fromAttrs, from);
            const sub = contextOf(at, child, sheet);
            const subAttrs = decodedAttrs(child);
            x = subAttrs.x === undefined ? x + n(subAttrs, "dx") : n(subAttrs, "x") + n(subAttrs, "dx");
            y = subAttrs.y === undefined ? y + n(subAttrs, "dy") : n(subAttrs, "y") + n(subAttrs, "dy");
            words(child, sub.ctx, subAttrs);
            flush(sub.ctx, { ...fromAttrs, ...subAttrs, class: [fromAttrs.class, subAttrs.class].filter((c) => c !== undefined && c !== "").join(" ") }, child);
          }
        }
      };
      words(node, ctx, attrs);
      flush(ctx, attrs, node);
      return;
    }
    if (node.name === "image") {
      const item: SceneImage = { ...baseOf(node, attrs, ctx), kind: "image", href: attrs.href ?? attrs["xlink:href"] ?? "", x: n(attrs, "x"), y: n(attrs, "y"), width: n(attrs, "width"), height: n(attrs, "height"), ...(attrs.preserveAspectRatio === undefined ? {} : { preserveAspectRatio: attrs.preserveAspectRatio }) };
      out.push(item);
      return;
    }
    for (const child of elements(node)) collect(child, ctx, out);
  }

  const items: SceneItem[] = [];
  const rootContext = contextOf(top, root, sheet);
  contexts.set(root, rootContext);
  // The root's own `data-*` (the sport, the size, the version) are the scene's; a shape's are those of the groups it is in.
  for (const child of elements(root)) collect(child, { ...rootContext.ctx, data: {} }, items);

  const box = (rootAttrs.viewBox ?? "0 0 0 0").split(/[\s,]+/).map(Number);
  const title = elements(root).find((child) => child.name === "title");
  const desc = elements(root).find((child) => child.name === "desc");
  const group = [...walkAll(root)].find((node) => (node.attrs.class ?? "").split(/\s+/).includes("ky-surface-group"));
  const turn = group?.attrs.transform === undefined ? undefined : parseTransform(decode(group.attrs.transform));
  const label = (rootAttrs["aria-labelledby"] ?? "").split(/\s+/)[0] ?? "";
  return {
    theme,
    ...(rootAttrs["data-sport"] === undefined ? {} : { sport: rootAttrs["data-sport"] }),
    id: label.replace(/-t$/, "") || "ky",
    title: title === undefined ? "" : textOf(title),
    description: desc === undefined ? "" : textOf(desc),
    orientation: rootAttrs["data-orientation"] === "portrait" ? "portrait" : "landscape",
    ...(turn === undefined ? {} : { turn }),
    viewBox: { x: box[0] ?? 0, y: box[1] ?? 0, w: box[2] ?? 0, h: box[3] ?? 0 },
    items,
    clips,
    gradients,
    patterns,
  };
}

const isScene = (source: SceneSource): source is Scene => typeof source === "object" && "items" in source && "viewBox" in source;

/**
 * A drawing as plain data: the options of `drawKyogijo` (or the SVG of a chart or a replay frame, or a scene already made) as the shapes it is painted
 * with, in order, each with its colours worked out for light or dark.
 * @example
 * ```ts
 * import { sceneOf } from "@johnmorrisdotca/kyogijo/scene";
 * const scene = sceneOf({ sport: "nhl", id: "rink" });
 * console.log(scene.viewBox, scene.items.length > 30, scene.items[0].kind);
 * // { x: -8, y: -8, w: 216, h: 101 } true rect
 * ```
 */
export function sceneOf(source: SurfaceOptions | ScoreOptions | string | Scene, options: SceneOptions = {}): Scene {
  if (typeof source !== "string" && isScene(source)) return source;
  const svg = typeof source === "string" ? source : drawKyogijo(source);
  return sceneFromSvg(svg, options);
}
