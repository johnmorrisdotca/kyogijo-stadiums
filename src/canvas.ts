// A scene drawn onto a canvas context: a browser's CanvasRenderingContext2D, an OffscreenCanvas's, or a Node canvas's (@napi-rs/canvas, skia-canvas, node-canvas).
// Nothing is imported from any of them: the context is typed by the few members this file calls, so any object that has them will do.
import { rgbOf } from "./colour.ts";
import { apply, boundsOf, IDENTITY, multiply, shapeCommands } from "./scene.path.ts";
import { sceneOf } from "./scene.ts";
import type { Matrix, Paint, PathCommand, Scene, SceneImage, SceneItem, SceneOptions, SceneShape, SceneSource, SceneStyle, SceneText } from "./scene.types.ts";

/** A gradient the context makes: only `addColorStop` is called on it. */
export interface CanvasGradientLike {
  addColorStop(offset: number, color: string): void;
}

/**
 * The members of a 2D canvas context that are used, with the types of the standard ones. A `CanvasRenderingContext2D`, an `OffscreenCanvasRenderingContext2D`
 * and the contexts of the Node canvas libraries all have them. Members marked optional are used only when the context has them.
 */
export interface CanvasContext {
  save(): void;
  restore(): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  closePath(): void;
  fill(rule?: "nonzero" | "evenodd"): void;
  stroke(): void;
  clip(rule?: "nonzero" | "evenodd"): void;
  fillText(text: string, x: number, y: number): void;
  strokeText(text: string, x: number, y: number): void;
  fillRect?(x: number, y: number, w: number, h: number): void;
  clearRect?(x: number, y: number, w: number, h: number): void;
  setLineDash(segments: number[]): void;
  createLinearGradient?(x0: number, y0: number, x1: number, y1: number): CanvasGradientLike;
  drawImage?(image: never, x: number, y: number, w: number, h: number): void;
  /** A colour, or a gradient (or, on a real context, a pattern, which is never written here). */
  fillStyle: string | CanvasGradientLike | object;
  strokeStyle: string | CanvasGradientLike | object;
  lineWidth: number;
  lineJoin: string;
  lineCap: string;
  globalAlpha: number;
  font: string;
  textAlign: string;
  textBaseline: string;
  /** CSS filters, where the context has them (a browser's). */
  filter?: string;
  letterSpacing?: string;
}

/** Where and how large a scene is drawn, and what is not in the scene. */
export interface CanvasOptions extends SceneOptions {
  /** The width the surface is drawn at, in the context's units (pixels). With a `height` too, the drawing is fitted inside and centred. */
  width?: number;
  height?: number;
  /** Pixels for one unit of the drawing (a foot, for most). Instead of a width or a height. 1 when none of the three is given. */
  scale?: number;
  /** Where the drawing's top left corner goes. 0, 0. */
  x?: number;
  y?: number;
  /** Fill the picture's box with this colour first. */
  background?: string;
  /** Clear the picture's box first (where the context can). */
  clear?: boolean;
  /** The picture for a team's logo: given the address in the drawing, it returns something the context's `drawImage` takes (a loaded `Image`, an `ImageBitmap`, a canvas), or nothing, and then that logo is left out. */
  images?: (href: string) => unknown;
}

/** What `drawToCanvas` drew. */
export interface Drawn {
  /** The box the drawing took, in the context's units. */
  width: number;
  height: number;
  /** Pixels for one unit of the drawing. */
  scale: number;
}

/** The colour with an alpha: `rgb(...)` of a hex or rgb colour, or the colour itself when it cannot be read (and the alpha is 1). */
export function withAlpha(color: string, alpha: number): string {
  if (alpha >= 1) return color;
  const rgba = /^rgba\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,/]+(\d*\.?\d+)\s*\)$/i.exec(color.trim());
  if (rgba !== null) return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${Math.round(Number(rgba[4]) * alpha * 1000) / 1000})`;
  const hex8 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color.trim());
  if (hex8 !== null) return `rgba(${parseInt(hex8[1], 16)},${parseInt(hex8[2], 16)},${parseInt(hex8[3], 16)},${Math.round((parseInt(hex8[4], 16) / 255) * alpha * 1000) / 1000})`;
  const rgb = rgbOf(color);
  return rgb === undefined ? color : `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

const number = (v: number): number => Math.round(v * 1e6) / 1e6;

function trace(ctx: CanvasContext, commands: readonly PathCommand[], matrix: Matrix = IDENTITY): void {
  const at = (x: number, y: number): [number, number] => (matrix === IDENTITY ? [x, y] : apply(matrix, x, y));
  for (const c of commands) {
    if (c[0] === "M") ctx.moveTo(...at(c[1], c[2]));
    else if (c[0] === "L") ctx.lineTo(...at(c[1], c[2]));
    else if (c[0] === "C") ctx.bezierCurveTo(...at(c[1], c[2]), ...at(c[3], c[4]), ...at(c[5], c[6]));
    else if (c[0] === "Q") ctx.quadraticCurveTo(...at(c[1], c[2]), ...at(c[3], c[4]));
    else ctx.closePath();
  }
}

const frame = (ctx: CanvasContext, m: Matrix): void => ctx.setTransform(number(m[0]), number(m[1]), number(m[2]), number(m[3]), number(m[4]), number(m[5]));

/** The width and height the options ask for, and the scale and offset that fit the scene in them. */
function placement(scene: Scene, o: CanvasOptions): { scale: number; width: number; height: number; matrix: Matrix } {
  const { x: vx, y: vy, w, h } = scene.viewBox;
  let scale = 1;
  if (o.scale !== undefined) scale = o.scale;
  else if (o.width !== undefined && o.height !== undefined) scale = Math.min(o.width / w, o.height / h);
  else if (o.width !== undefined) scale = o.width / w;
  else if (o.height !== undefined) scale = o.height / h;
  if (!(scale > 0) || !Number.isFinite(scale)) throw new RangeError("The size of a canvas drawing must be more than nothing");
  const width = o.width !== undefined && o.height !== undefined ? o.width : w * scale;
  const height = o.width !== undefined && o.height !== undefined ? o.height : h * scale;
  const ox = (o.x ?? 0) + (width - w * scale) / 2;
  const oy = (o.y ?? 0) + (height - h * scale) / 2;
  return { scale, width, height, matrix: [scale, 0, 0, scale, ox - vx * scale, oy - vy * scale] };
}

/** Set a fill or stroke style. Returns false when there is nothing to paint. An alpha is written into the colour when it can be, else set on the context. */
function setPaint(ctx: CanvasContext, scene: Scene, target: "fillStyle" | "strokeStyle", paint: Paint, alpha: number): boolean {
  ctx.globalAlpha = 1;
  if (typeof paint === "string") {
    if (paint === "none") return false;
    const colour = withAlpha(paint, alpha);
    ctx[target] = colour;
    if (alpha < 1 && colour === paint) ctx.globalAlpha = alpha;
    return true;
  }
  if ("gradient" in paint) {
    const g = scene.gradients.find((one) => one.id === paint.gradient);
    if (g === undefined || ctx.createLinearGradient === undefined) return false;
    const gradient = ctx.createLinearGradient(g.x1, g.y1, g.x2, g.y2);
    for (const stop of g.stops) gradient.addColorStop(stop.offset, withAlpha(stop.color, stop.opacity * alpha));
    ctx[target] = gradient;
    return true;
  }
  return false;
}

interface Run {
  scene: Scene;
  base: Matrix;
  images: ((href: string) => unknown) | undefined;
}

function paintShape(ctx: CanvasContext, run: Run, shape: SceneShape, matrix: Matrix): void {
  const s = shape.style;
  frame(ctx, matrix);
  const commands = shapeCommands(shape);
  const filling = s.fill !== "none";
  const stroking = s.stroke !== "none" && s.strokeWidth > 0;
  const fill = (): void => {
    if (!filling) return;
    if (typeof s.fill !== "string" && "pattern" in s.fill) {
      patternFill(ctx, run, shape, matrix, s.fill.pattern);
      return;
    }
    if (!setPaint(ctx, run.scene, "fillStyle", s.fill, s.opacity * s.fillOpacity)) return;
    ctx.beginPath();
    trace(ctx, commands);
    ctx.fill(s.fillRule);
  };
  const stroke = (): void => {
    if (!stroking || !setPaint(ctx, run.scene, "strokeStyle", s.stroke, s.opacity * s.strokeOpacity)) return;
    lineStyle(ctx, s);
    ctx.beginPath();
    trace(ctx, commands);
    ctx.stroke();
  };
  if (s.paintOrder === "stroke") {
    stroke();
    fill();
  } else {
    fill();
    stroke();
  }
}

function lineStyle(ctx: CanvasContext, s: SceneStyle): void {
  ctx.lineWidth = s.strokeWidth;
  ctx.lineJoin = s.lineJoin;
  ctx.lineCap = s.lineCap;
  ctx.setLineDash(s.dash === undefined ? [] : [...s.dash]);
}

/** A pattern fill: the shape's outline is the clip and the tile's shapes are drawn over its box, tile after tile. */
function patternFill(ctx: CanvasContext, run: Run, shape: SceneShape, matrix: Matrix, id: string): void {
  const pattern = run.scene.patterns.find((one) => one.id === id);
  const box = boundsOf(shape);
  if (pattern === undefined || box === undefined || !(pattern.width > 0) || !(pattern.height > 0)) return;
  ctx.save();
  frame(ctx, matrix);
  ctx.beginPath();
  trace(ctx, shapeCommands(shape));
  ctx.clip(shape.style.fillRule);
  const [i0, i1] = [Math.floor(box.x / pattern.width), Math.ceil((box.x + box.w) / pattern.width)];
  const [j0, j1] = [Math.floor(box.y / pattern.height), Math.ceil((box.y + box.h) / pattern.height)];
  for (let j = j0; j < j1; j += 1) {
    for (let i = i0; i < i1; i += 1) {
      const tile = multiply(matrix, [1, 0, 0, 1, i * pattern.width, j * pattern.height]);
      for (const part of pattern.shapes) paintShape(ctx, run, { ...part, style: { ...part.style, opacity: part.style.opacity * shape.style.opacity } }, multiply(tile, part.matrix));
    }
  }
  ctx.restore();
}

function paintText(ctx: CanvasContext, run: Run, t: SceneText, matrix: Matrix): void {
  const s = t.style;
  // A small size is drawn larger and the drawing taken down by the same amount, so that the engine rasterises the letters at a size it renders well.
  const k = t.fontSize < 10 ? 10 / t.fontSize : 1;
  frame(ctx, multiply(matrix, [1 / k, 0, 0, 1 / k, 0, 0]));
  ctx.font = `${t.fontWeight} ${number(t.fontSize * k)}px ${t.fontFamily}`;
  ctx.textAlign = t.anchor === "middle" ? "center" : t.anchor === "end" ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  if (t.letterSpacing !== 0 || ctx.letterSpacing !== undefined) ctx.letterSpacing = `${number(t.letterSpacing * k)}px`;
  const x = t.x * k;
  const y = t.y * k;
  const fill = (): void => {
    if (s.fill !== "none" && setPaint(ctx, run.scene, "fillStyle", s.fill, s.opacity * s.fillOpacity)) ctx.fillText(t.text, x, y);
  };
  const stroke = (): void => {
    if (s.stroke === "none" || !(s.strokeWidth > 0) || !setPaint(ctx, run.scene, "strokeStyle", s.stroke, s.opacity * s.strokeOpacity)) return;
    lineStyle(ctx, { ...s, strokeWidth: s.strokeWidth * k });
    ctx.strokeText(t.text, x, y);
  };
  if (s.paintOrder === "stroke") {
    stroke();
    fill();
  } else {
    fill();
    stroke();
  }
}

function paintImage(ctx: CanvasContext, run: Run, image: SceneImage, matrix: Matrix): void {
  if (run.images === undefined || ctx.drawImage === undefined) return;
  const picture = run.images(image.href) as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number } | undefined | null;
  if (picture === undefined || picture === null) return;
  frame(ctx, matrix);
  ctx.globalAlpha = image.style.opacity;
  let { x, y, width, height } = image;
  const pw = picture.naturalWidth ?? picture.width;
  const ph = picture.naturalHeight ?? picture.height;
  // The default `xMidYMid meet`: the whole picture, as large as the box allows, in its middle. `none` stretches it.
  if (image.preserveAspectRatio !== "none" && typeof pw === "number" && typeof ph === "number" && pw > 0 && ph > 0) {
    const fit = Math.min(width / pw, height / ph);
    x += (width - pw * fit) / 2;
    y += (height - ph * fit) / 2;
    width = pw * fit;
    height = ph * fit;
  }
  ctx.drawImage(picture as never, x, y, width, height);
  ctx.globalAlpha = 1;
}

function paintItem(ctx: CanvasContext, run: Run, item: SceneItem): void {
  const matrix = multiply(run.base, item.matrix);
  if (item.style.filter !== undefined && ctx.filter !== undefined) ctx.filter = item.style.filter;
  if (item.kind === "text") paintText(ctx, run, item, matrix);
  else if (item.kind === "image") paintImage(ctx, run, item, matrix);
  else paintShape(ctx, run, item, matrix);
  if (item.style.filter !== undefined && ctx.filter !== undefined) ctx.filter = "none";
}

/**
 * Draw a scene (or the options of `drawKyogijo`, or an SVG the package wrote) onto a canvas context. Give a `width` or a `height` in pixels, or a `scale`; the
 * drawing keeps its shape. Light or dark by `theme`. A team's logo is drawn only if `images` returns a picture for its address.
 * @example
 * ```ts
 * import { drawToCanvas, type CanvasContext } from "@johnmorrisdotca/kyogijo/canvas";
 * // Any object with the context's members will do: this one only counts what is drawn.
 * const counts: Record<string, number> = {};
 * const ctx = new Proxy({} as CanvasContext, { get: (_, name: string) => () => void (counts[name] = (counts[name] ?? 0) + 1), set: () => true });
 * const drawn = drawToCanvas(ctx, { sport: "nhl", id: "rink" }, { width: 800 });
 * console.log(drawn.width, Math.round(drawn.height), counts.fill > 10);
 * // 800 374 true
 * ```
 */
export function drawToCanvas(ctx: CanvasContext, source: SceneSource, options: CanvasOptions = {}): Drawn {
  const scene = sceneOf(source, options);
  const { scale, width, height, matrix } = placement(scene, options);
  const box = { x: options.x ?? 0, y: options.y ?? 0 };
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (options.clear === true && ctx.clearRect !== undefined) ctx.clearRect(box.x, box.y, width, height);
  if (options.background !== undefined && ctx.fillRect !== undefined) {
    ctx.fillStyle = options.background;
    ctx.globalAlpha = 1;
    ctx.fillRect(box.x, box.y, width, height);
  }
  const run: Run = { scene, base: matrix, images: options.images };
  let open = "";
  for (const item of scene.items) {
    const key = item.clips.join(",");
    if (key !== open) {
      if (open !== "") ctx.restore();
      open = key;
      if (key !== "") {
        ctx.save();
        for (const index of item.clips) {
          const clip = scene.clips[index];
          frame(ctx, multiply(matrix, clip.matrix));
          ctx.beginPath();
          for (const shape of clip.shapes) trace(ctx, shapeCommands(shape), shape.matrix);
          ctx.clip();
        }
      }
    }
    paintItem(ctx, run, item);
  }
  if (open !== "") ctx.restore();
  ctx.restore();
  return { width, height, scale };
}
