// A scene as elements that need no stylesheet: every colour, width and font is an attribute, every transform is on the shape, and a clip is a group. The d3,
// Observable Plot and PNG renderers all build from this list, and `sceneToSvg` writes it as text, so a drawing is the same wherever it is put.
import { isIdentity, multiply } from "./scene.path.ts";
import { sceneOf } from "./scene.ts";
import type { Matrix, Paint, Scene, SceneItem, SceneOptions, SceneShape, SceneSource, SceneStyle } from "./scene.types.ts";
import { encode } from "./scene.xml.ts";

/** An element to be made: its tag, attributes, text and children. */
export interface Spec {
  tag: string;
  attrs: Record<string, string>;
  text?: string;
  children?: Spec[];
}

const f = (value: number): string => {
  const rounded = Math.round(value * 10000) / 10000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

/** A transform as an attribute, to six decimals: a scale of a few pixels to the foot, over a rink, must not drift. */
export const matrixAttr = (m: Matrix): string => `matrix(${m.map((v) => (Object.is(Math.round(v * 1e6) / 1e6, -0) ? 0 : Math.round(v * 1e6) / 1e6)).join(" ")})`;

const paintOf = (paint: Paint): string => (typeof paint === "string" ? paint : "gradient" in paint ? `url(#${paint.gradient})` : `url(#${paint.pattern})`);

function paintAttrs(style: SceneStyle, text: boolean): Record<string, string> {
  const out: Record<string, string> = { fill: paintOf(style.fill) };
  if (style.fillOpacity !== 1) out["fill-opacity"] = f(style.fillOpacity);
  if (style.stroke !== "none") {
    out.stroke = paintOf(style.stroke);
    out["stroke-width"] = f(style.strokeWidth);
    if (style.strokeOpacity !== 1) out["stroke-opacity"] = f(style.strokeOpacity);
    if (style.lineJoin !== "miter") out["stroke-linejoin"] = style.lineJoin;
    if (style.lineCap !== "butt") out["stroke-linecap"] = style.lineCap;
    if (style.dash !== undefined) out["stroke-dasharray"] = style.dash.map(f).join(" ");
  }
  if (!text && style.fillRule === "evenodd") out["fill-rule"] = "evenodd";
  if (style.opacity !== 1) out.opacity = f(style.opacity);
  if (style.paintOrder !== undefined) out["paint-order"] = style.paintOrder;
  if (style.filter !== undefined) out.style = `filter:${style.filter}`;
  return out;
}

function geometry(item: SceneShape): { tag: string; attrs: Record<string, string> } {
  switch (item.kind) {
    case "rect":
      return { tag: "rect", attrs: { x: f(item.x), y: f(item.y), width: f(item.width), height: f(item.height), ...(item.rx > 0 ? { rx: f(item.rx) } : {}) } };
    case "circle":
      return { tag: "circle", attrs: { cx: f(item.cx), cy: f(item.cy), r: f(item.r) } };
    case "ellipse":
      return { tag: "ellipse", attrs: { cx: f(item.cx), cy: f(item.cy), rx: f(item.rx), ry: f(item.ry) } };
    case "line":
      return { tag: "line", attrs: { x1: f(item.x1), y1: f(item.y1), x2: f(item.x2), y2: f(item.y2) } };
    case "polygon":
    case "polyline":
      return { tag: item.kind, attrs: { points: item.points.map((p) => `${f(p[0])},${f(p[1])}`).join(" ") } };
    default:
      return { tag: "path", attrs: { d: item.d } };
  }
}

function itemSpec(item: SceneItem, matrix: Matrix, styled: boolean): Spec {
  const attrs: Record<string, string> = {};
  if (item.class !== "") attrs.class = item.class;
  let spec: Spec;
  if (item.kind === "text") {
    Object.assign(attrs, { x: f(item.x), y: f(item.y), "font-size": f(item.fontSize), "font-weight": String(item.fontWeight), "font-family": item.fontFamily });
    if (item.anchor !== "start") attrs["text-anchor"] = item.anchor;
    if (item.letterSpacing !== 0) attrs["letter-spacing"] = f(item.letterSpacing);
    spec = { tag: "text", attrs, text: item.text };
  } else if (item.kind === "image") {
    Object.assign(attrs, { href: item.href, x: f(item.x), y: f(item.y), width: f(item.width), height: f(item.height) });
    if (item.preserveAspectRatio !== undefined) attrs.preserveAspectRatio = item.preserveAspectRatio;
    spec = { tag: "image", attrs };
    if (item.style.opacity !== 1) attrs.opacity = f(item.style.opacity);
  } else {
    const g = geometry(item);
    Object.assign(attrs, g.attrs);
    spec = { tag: g.tag, attrs };
  }
  if (styled && item.kind !== "image") Object.assign(attrs, paintAttrs(item.style, item.kind === "text"));
  if (!isIdentity(matrix)) attrs.transform = matrixAttr(matrix);
  if (item.label !== undefined) spec.children = [{ tag: "title", attrs: {}, text: item.label }];
  return spec;
}

/** The ids of a scene's clips as a renderer writes them. */
export const clipId = (scene: Scene, index: number): string => `${scene.id}-clip${index}`;

/** What goes in `<defs>` for a scene: its clips, gradients and patterns. */
export function defsOf(scene: Scene): Spec[] {
  const defs: Spec[] = [];
  scene.clips.forEach((clip, i) => {
    defs.push({ tag: "clipPath", attrs: { id: clipId(scene, i) }, children: clip.shapes.map((shape) => itemSpec(shape, multiply(clip.matrix, shape.matrix), false)) });
  });
  for (const g of scene.gradients) {
    defs.push({
      tag: "linearGradient",
      attrs: { id: g.id, gradientUnits: "userSpaceOnUse", x1: f(g.x1), y1: f(g.y1), x2: f(g.x2), y2: f(g.y2) },
      children: g.stops.map((stop) => ({ tag: "stop", attrs: { offset: f(stop.offset), "stop-color": stop.color, ...(stop.opacity === 1 ? {} : { "stop-opacity": f(stop.opacity) }) } })),
    });
  }
  for (const p of scene.patterns) {
    defs.push({ tag: "pattern", attrs: { id: p.id, width: f(p.width), height: f(p.height), patternUnits: "userSpaceOnUse" }, children: p.shapes.map((shape) => itemSpec(shape, shape.matrix, true)) });
  }
  return defs;
}

/** The shapes of a scene as elements in paint order, those inside a clip in a group that clips them. */
export function bodyOf(scene: Scene): Spec[] {
  const nest = (items: readonly SceneItem[], depth: number): Spec[] => {
    const out: Spec[] = [];
    let i = 0;
    while (i < items.length) {
      const clip = items[i].clips[depth];
      if (clip === undefined) {
        out.push(itemSpec(items[i], items[i].matrix, true));
        i += 1;
        continue;
      }
      let j = i;
      while (j < items.length && items[j].clips[depth] === clip) j += 1;
      out.push({ tag: "g", attrs: { "clip-path": `url(#${clipId(scene, clip)})` }, children: nest(items.slice(i, j), depth + 1) });
      i = j;
    }
    return out;
  };
  return nest(scene.items, 0);
}

/** An element as text. */
export function specToSvg(spec: Spec): string {
  const attrs = Object.entries(spec.attrs).map(([key, value]) => ` ${key}="${encode(value)}"`).join("");
  const inner = (spec.text === undefined ? "" : encode(spec.text).replace(/&quot;/g, '"')) + (spec.children ?? []).map(specToSvg).join("");
  return inner === "" && spec.text === undefined ? `<${spec.tag}${attrs}/>` : `<${spec.tag}${attrs}>${inner}</${spec.tag}>`;
}

/** What a flat SVG is written with. */
export interface FlatOptions extends SceneOptions {
  /** The width of the picture in pixels. Without a width or a height the SVG has neither and takes the size of its place. */
  width?: number;
  height?: number;
  /** A colour to fill the picture with first (a PNG has no page behind it). */
  background?: string;
}

/**
 * A drawing as an SVG that needs no stylesheet: every colour, width and font worked out for the theme, so that a tool that does not read CSS variables
 * (an image converter, an email, a slide) draws what a browser does. Light by default, or the drawing's own `data-theme`.
 * @example
 * ```ts
 * import { sceneToSvg } from "@johnmorrisdotca/kyogijo/scene";
 * const svg = sceneToSvg({ sport: "nhl", id: "rink" }, { theme: "dark", width: 800 });
 * console.log(svg.includes("var("), svg.includes("<style"), svg.startsWith("<svg"));
 * // false false true
 * ```
 */
export function sceneToSvg(source: SceneSource, options: FlatOptions = {}): string {
  const scene = sceneOf(source, options);
  const { x, y, w, h } = scene.viewBox;
  const size = options.width !== undefined || options.height !== undefined ? { width: options.width ?? Math.round(((options.height as number) * w) / h), height: options.height ?? Math.round((options.width as number) * (h / w)) } : undefined;
  const defs = defsOf(scene);
  const children: Spec[] = [
    { tag: "title", attrs: {}, text: scene.title },
    { tag: "desc", attrs: {}, text: scene.description },
    ...(options.background === undefined ? [] : [{ tag: "rect", attrs: { x: f(x), y: f(y), width: f(w), height: f(h), fill: options.background } }]),
    ...(defs.length === 0 ? [] : [{ tag: "defs", attrs: {}, children: defs }]),
    ...bodyOf(scene),
  ];
  const root: Spec = {
    tag: "svg",
    attrs: { xmlns: "http://www.w3.org/2000/svg", viewBox: `${f(x)} ${f(y)} ${f(w)} ${f(h)}`, ...(size === undefined ? {} : { width: String(size.width), height: String(size.height) }), role: "img" },
    children,
  };
  return specToSvg(root);
}
