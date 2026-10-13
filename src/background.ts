// The ground behind a drawing: a subtle pattern drawn in SVG (felt, grass, wood, ice, paper, a grid, dots) and, when the caller has one, a photograph at an opacity. It is
// written once here for the drawing (`background` in the options, laid on the apron under the surface) and for a grid of drawings (`drawGrid`, laid under all of them).
// Every pattern is a few shapes in a tile, with no random number, in the ink or the line colour of the drawing at a low opacity, so that it follows light and dark.
import { safeColour, safeLogo } from "./colour.ts";
import { el, num } from "./format.ts";

/** The patterns: a tile of shapes repeated over the ground. */
export type BackgroundPattern = "felt" | "grass" | "wood" | "ice" | "paper" | "grid" | "dots";

/** How a photograph fills the ground: `cover` fills it and cuts what overhangs, `contain` shows all of it, `stretch` fills it out of shape. */
export type BackgroundFit = "cover" | "contain" | "stretch";

/** A ground in full. Every part is optional; with none, there is no ground. */
export interface BackgroundOptions {
  /** A pattern drawn over the ground, in a low opacity. */
  pattern?: BackgroundPattern;
  /** A colour under the pattern and the photograph (a hex colour, `rgb()`, `hsl()`, a name or `var(--name)`). Without it the ground keeps its own colour. */
  color?: string;
  /** The opacity of the pattern, 0 to 1. Each pattern has its own subtle one. */
  opacity?: number;
  /** The size of the pattern's tile, as a multiple of its usual one (a fortyeighth of the drawing's longer side). 1 by default; 0.25 to 8 are kept. */
  scale?: number;
  /** A photograph behind the surface: an address or `data:` image, held to the rules of a team's `logo` (`safeLogo`). Drawn over the ground's colour and under the pattern. */
  image?: string;
  /** The opacity of the photograph, 0 to 1. 0.35 by default. */
  imageOpacity?: number;
  /** How the photograph fills the ground. `cover` by default. */
  imageFit?: BackgroundFit;
}

/** A ground: a pattern's name, `"none"`, or the options in full. */
export type Background = BackgroundPattern | "none" | BackgroundOptions;

/** The patterns, in the order a menu lists them. */
export const BACKGROUND_PATTERNS: readonly BackgroundPattern[] = ["felt", "grass", "wood", "ice", "paper", "grid", "dots"];

/** The opacity each pattern is drawn at when `opacity` says nothing. */
export const BACKGROUND_OPACITY: Readonly<Record<BackgroundPattern, number>> = { felt: 0.8, grass: 0.7, wood: 0.8, ice: 0.9, paper: 0.75, grid: 0.55, dots: 0.7 };

/** The rules of a ground, written into a drawing that has one (and in `KYOGIJO_STYLE`, for a page that supplies the stylesheet): the pattern's ink and light. */
export const KYOGIJO_BACKGROUND_STYLE = `
.kyogijo .ky-bg-i{stroke:var(--ky-ink);fill:none}
.kyogijo .ky-bg-id{fill:var(--ky-ink);stroke:none}
.kyogijo .ky-bg-l{stroke:var(--ky-line);fill:none}
.kyogijo .ky-bg-ld{fill:var(--ky-line);stroke:none}`.trim();

const has = (name: unknown): name is BackgroundPattern => typeof name === "string" && (BACKGROUND_PATTERNS as readonly string[]).includes(name);
const unit = (value: unknown, fallback: number): number => (typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback);

/** The options of a ground, read: a name becomes a pattern, `"none"`, anything that is not a ground and a ground with nothing in it are `undefined`. */
export function resolveBackground(value: unknown): BackgroundOptions | undefined {
  if (value === undefined || value === null || value === "none") return undefined;
  if (typeof value === "string") return has(value) ? { pattern: value } : undefined;
  if (typeof value !== "object") return undefined;
  const o = value as BackgroundOptions;
  const out: BackgroundOptions = {};
  if (has(o.pattern)) out.pattern = o.pattern;
  const color = safeColour(o.color);
  if (color !== undefined) out.color = color;
  if (typeof o.opacity === "number" && Number.isFinite(o.opacity)) out.opacity = unit(o.opacity, BACKGROUND_OPACITY[out.pattern ?? "felt"]);
  if (typeof o.scale === "number" && Number.isFinite(o.scale)) out.scale = Math.min(8, Math.max(0.25, o.scale));
  const image = safeLogo(o.image);
  if (image !== undefined) out.image = image;
  if (typeof o.imageOpacity === "number" && Number.isFinite(o.imageOpacity)) out.imageOpacity = unit(o.imageOpacity, 0.35);
  if (o.imageFit === "cover" || o.imageFit === "contain" || o.imageFit === "stretch") out.imageFit = o.imageFit;
  return out.pattern === undefined && out.color === undefined && out.image === undefined ? undefined : out;
}

/** The tile of a pattern: its width and height and the shapes in it, for a tile of side `t`. */
function tile(pattern: BackgroundPattern, t: number): { w: number; h: number; body: string } {
  const n = (v: number): string => num(Math.round(v * 1000) / 1000);
  const line = (cls: string, x1: number, y1: number, x2: number, y2: number, width: number): string => el("line", { class: cls, x1: n(x1), y1: n(y1), x2: n(x2), y2: n(y2), "stroke-width": n(width), "stroke-linecap": "round" });
  const dot = (cls: string, x: number, y: number, r: number): string => el("circle", { class: cls, cx: n(x), cy: n(y), r: n(r) });
  switch (pattern) {
    case "felt":
      return {
        w: t,
        h: t,
        body: [dot("ky-bg-ld", 0.12 * t, 0.2 * t, 0.045 * t), dot("ky-bg-id", 0.58 * t, 0.12 * t, 0.04 * t), dot("ky-bg-ld", 0.82 * t, 0.46 * t, 0.05 * t), dot("ky-bg-id", 0.3 * t, 0.55 * t, 0.045 * t), dot("ky-bg-ld", 0.66 * t, 0.84 * t, 0.04 * t), dot("ky-bg-id", 0.08 * t, 0.9 * t, 0.05 * t), dot("ky-bg-ld", 0.45 * t, 0.36 * t, 0.03 * t)].join(""),
      };
    case "grass":
      return {
        w: t,
        h: t,
        body: [line("ky-bg-l", 0.1 * t, 0.46 * t, 0.2 * t, 0.2 * t, 0.05 * t), line("ky-bg-l", 0.4 * t, 0.9 * t, 0.46 * t, 0.58 * t, 0.05 * t), line("ky-bg-l", 0.64 * t, 0.4 * t, 0.58 * t, 0.12 * t, 0.05 * t), line("ky-bg-l", 0.86 * t, 0.96 * t, 0.94 * t, 0.7 * t, 0.05 * t), line("ky-bg-i", 0.26 * t, 0.98 * t, 0.2 * t, 0.78 * t, 0.04 * t), line("ky-bg-i", 0.78 * t, 0.5 * t, 0.84 * t, 0.28 * t, 0.04 * t)].join(""),
      };
    case "wood": {
      const w = 2 * t;
      const grain = (y: number, bend: number): string => el("path", { class: "ky-bg-i", d: `M0 ${n(y)}Q${n(0.5 * t)} ${n(y - bend)} ${n(t)} ${n(y)}T${n(w)} ${n(y)}`, "stroke-width": n(0.025 * t) });
      return { w, h: t, body: [grain(0.22 * t, 0.12 * t), grain(0.48 * t, -0.1 * t), grain(0.72 * t, 0.08 * t), line("ky-bg-i", 0, t, w, t, 0.05 * t), line("ky-bg-i", 0.7 * t, 0, 0.7 * t, 0.5 * t, 0.04 * t), line("ky-bg-i", 1.4 * t, 0.5 * t, 1.4 * t, t, 0.04 * t)].join("") };
    }
    case "ice":
      return { w: 2 * t, h: 2 * t, body: [line("ky-bg-l", 0.2 * t, 0.4 * t, 0.9 * t, 0.15 * t, 0.022 * t), line("ky-bg-l", 1.1 * t, 1.5 * t, 1.9 * t, 1.1 * t, 0.022 * t), line("ky-bg-l", 0.3 * t, 1.7 * t, 0.7 * t, 1.9 * t, 0.022 * t), line("ky-bg-l", 1.3 * t, 0.3 * t, 1.6 * t, 0.7 * t, 0.022 * t), line("ky-bg-i", 0.9 * t, 1.0 * t, 1.2 * t, 0.9 * t, 0.014 * t)].join("") };
    case "paper":
      return { w: 2 * t, h: 2 * t, body: [line("ky-bg-i", 0.3 * t, 0.3 * t, 0.42 * t, 0.34 * t, 0.022 * t), line("ky-bg-i", 1.2 * t, 0.2 * t, 1.1 * t, 0.3 * t, 0.022 * t), line("ky-bg-i", 0.8 * t, 0.9 * t, 0.95 * t, 0.88 * t, 0.022 * t), line("ky-bg-i", 1.6 * t, 1.1 * t, 1.72 * t, 1.18 * t, 0.022 * t), line("ky-bg-i", 0.2 * t, 1.5 * t, 0.3 * t, 1.42 * t, 0.022 * t), line("ky-bg-i", 1.0 * t, 1.7 * t, 1.14 * t, 1.76 * t, 0.022 * t), dot("ky-bg-id", 0.6 * t, 0.6 * t, 0.022 * t), dot("ky-bg-id", 1.5 * t, 1.6 * t, 0.022 * t)].join("") };
    case "grid":
      return { w: t, h: t, body: el("path", { class: "ky-bg-i", d: `M0 0H${n(t)}M0 0V${n(t)}`, "stroke-width": n(0.035 * t) }) };
    default:
      return { w: t, h: t, body: dot("ky-bg-id", t / 2, t / 2, 0.05 * t) };
  }
}

/** What a ground is made of: the pieces to write in the drawing's `<defs>` and the shapes to lay over the apron. */
export interface BackgroundMarkup {
  defs: string;
  shapes: string;
}

/**
 * The ground as SVG: a rectangle `box` in the drawing's own numbers, filled with the colour, the photograph and the pattern, in that order, and the definitions they need
 * (a pattern and, for a photograph that overhangs, a clip), with ids that begin with `id`. The tile is a fortyeighth of the box's longer side, times `scale`, so that a ground
 * looks the same on a rink in feet and on a card in pixels. An empty string for each when there is no ground.
 */
export function backgroundMarkup(background: Background | undefined, box: { x: number; y: number; w: number; h: number }, id: string): BackgroundMarkup {
  const b = resolveBackground(background);
  if (b === undefined) return { defs: "", shapes: "" };
  const at = { x: num(box.x), y: num(box.y), width: num(box.w), height: num(box.h) };
  let defs = "";
  let shapes = "";
  if (b.color !== undefined) shapes += el("rect", { class: "ky-bg", ...at, fill: b.color });
  if (b.image !== undefined) {
    const fit = b.imageFit ?? "cover";
    const clip = `${id}-bgc`;
    // A photograph that fills the ground may overhang it, and a canvas has no `slice`: the clip cuts it, as the SVG's own rule would.
    if (fit === "cover") defs += el("clipPath", { id: clip }, el("rect", at));
    const picture = el("image", { class: "ky-bg-img", href: b.image, x: at.x, y: at.y, width: at.width, height: at.height, preserveAspectRatio: fit === "cover" ? "xMidYMid slice" : fit === "contain" ? "xMidYMid meet" : "none", opacity: b.imageOpacity ?? 0.35 });
    shapes += fit === "cover" ? el("g", { "clip-path": `url(#${clip})` }, picture) : picture;
  }
  if (b.pattern !== undefined) {
    const side = (Math.max(box.w, box.h) / 48) * (b.scale ?? 1);
    const { w, h, body } = tile(b.pattern, side);
    const key = `${id}-bg`;
    defs += el("pattern", { id: key, width: num(w), height: num(h), patternUnits: "userSpaceOnUse" }, el("g", { opacity: b.opacity ?? BACKGROUND_OPACITY[b.pattern] }, body));
    shapes += el("rect", { class: "ky-bg-pattern", ...at, fill: `url(#${key})` });
  }
  return { defs, shapes };
}

/**
 * A drawing's `base` with a ground laid on its apron: the base's first shape is the apron's rectangle, and the ground is written right after it, over exactly the same
 * rectangle, so that it lies under the surface and over the apron's colour. `defs` is what the ground needs in the drawing's `<defs>`. A base that does not begin with a
 * rectangle, or a ground with nothing in it, leaves the base as it is.
 */
export function laidOn(base: string, background: Background | undefined, id: string): { base: string; defs: string } {
  if (resolveBackground(background) === undefined || !base.startsWith("<rect ")) return { base, defs: "" };
  const end = base.indexOf("/>") + 2;
  const tag = base.slice(0, end);
  const read = (name: string): number => Number(new RegExp(`\\s${name}="(-?[\\d.]+)"`).exec(tag)?.[1] ?? "NaN");
  const box = { x: read("x"), y: read("y"), w: read("width"), h: read("height") };
  if (![box.x, box.y, box.w, box.h].every(Number.isFinite)) return { base, defs: "" };
  const made = backgroundMarkup(background, box, id);
  return { base: `${tag}${made.shapes}${base.slice(end)}`, defs: made.defs };
}
