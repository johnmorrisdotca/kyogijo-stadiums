// The crowd outside on a page: one canvas per view, painted from the typed arrays of `outside.paint.ts` with a single `putImageData`. In the 3D view the canvas is a child of the floor, so the floor's own `matrix3d` carries it
// round with the turn and no frame of the turn spends anything on it; in the 2D plan it lies over the drawing's own box. It is painted when its level, its size, its zoom's detail or its colour changes, and never because a view
// turned or a pointer moved: nothing here animates, nothing is polled, and a reader who prefers reduced motion sees the same. The crowd (a quarter of a second of work, once) is asked for only when a level above 0 is shown or,
// when a page asked for one, in an idle moment after the mount, so that the first press of a level is not slow.
import { frameOf, rasterOutside, type OutsideCrowd, type OutsideLevel, type OutsideStats } from "./outside.paint.ts";

/** What a view tells its crowd layer. `crowd` makes (or fetches) the crowd and is called only when one is to be shown. */
export interface OutsideSpec {
  level: OutsideLevel;
  crowd: () => OutsideCrowd | undefined;
  /** The plan's view box in feet: what the canvas covers. */
  viewBox: { x: number; y: number; w: number; h: number };
}

/** What a mounted crowd layer lets a page do and read. */
export interface OutsideLayer {
  /** The level shown. */
  readonly level: OutsideLevel;
  setLevel(level: OutsideLevel): void;
  /** The 3D view's zoom: a near view is painted finer (its people discs, not density). The paint is redone only when the zoom crosses `NEAR`. */
  zoom(zoom: number): void;
  /** What the last paint cost, in milliseconds, and drew: `undefined` before the first. */
  readonly last: { ms: number; pixels: number; stats: OutsideStats } | undefined;
  destroy(): void;
}

/** The zoom above which the 3D view paints the crowd finer. */
export const NEAR = 1.5;
/** The widest a canvas is made, in pixels: a district seen whole at 1.4 times the floor's own size, near at 2.4 times, never past this. */
export const MAX_WIDE = 3072;

/** The colour the crowd is painted in: the page's `--ky-dist-people` (as the district's drawing sets it, light and dark) read as red, green and blue. */
export function inkOf(from: Element): [number, number, number] {
  const doc = from.ownerDocument;
  const value = doc.defaultView?.getComputedStyle(from).getPropertyValue("--ky-dist-people").trim() || "#c2410c";
  const probe = doc.createElement("canvas");
  probe.width = probe.height = 1;
  const g = probe.getContext("2d", { willReadFrequently: true });
  if (g === null) return [194, 65, 12];
  g.fillStyle = "#c2410c";
  g.fillStyle = value;
  g.fillRect(0, 0, 1, 1);
  const d = g.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

/** Call `change` when the page's theme may have changed (its `data-theme`, its class, or the system's colour scheme); gives the function that stops. */
function watchTheme(doc: Document, change: () => void): () => void {
  const media = doc.defaultView?.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener?.("change", change);
  const seen = typeof MutationObserver === "function" ? new MutationObserver(change) : undefined;
  seen?.observe(doc.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  return () => {
    media?.removeEventListener?.("change", change);
    seen?.disconnect();
  };
}

/** The shared body of both layers: a canvas, what to paint on it and where. */
function layerOf(canvas: HTMLCanvasElement, spec: OutsideSpec, colourFrom: () => Element, size: () => number): OutsideLayer & { repaint(force?: boolean): void; zoomTier: number } {
  const doc = canvas.ownerDocument;
  let level = spec.level;
  let ink = inkOf(colourFrom());
  let drawn = "";
  let alive = true;
  let last: OutsideLayer["last"];
  const layer = {
    zoomTier: 0,
    get level() {
      return level;
    },
    get last() {
      return last;
    },
    setLevel(next: OutsideLevel) {
      if (next === level) return;
      level = next;
      layer.repaint();
    },
    zoom(zoom: number) {
      const tier = zoom > NEAR ? 1 : 0;
      if (tier === layer.zoomTier) return;
      layer.zoomTier = tier;
      layer.repaint();
    },
    repaint(force = false) {
      if (!alive) return;
      const width = Math.min(MAX_WIDE, Math.max(1, Math.round(size())));
      if (level === 0) {
        // Nobody: the canvas is made one pixel, so that it holds no memory.
        if (canvas.width !== 1 || canvas.height !== 1) {
          canvas.width = 1;
          canvas.height = 1;
        }
        canvas.hidden = true;
        drawn = "";
        return;
      }
      const crowd = spec.crowd();
      if (crowd === undefined) return;
      canvas.hidden = false;
      const frame = frameOf(spec.viewBox, width);
      const key = `${level}|${frame.width}x${frame.height}|${ink.join(",")}`;
      if (!force && key === drawn) return;
      const started = performance.now();
      const { rgba, stats } = rasterOutside(crowd, level, frame, ink);
      if (canvas.width !== frame.width || canvas.height !== frame.height) {
        canvas.width = frame.width;
        canvas.height = frame.height;
      }
      const g = canvas.getContext("2d");
      if (g === null) return;
      g.putImageData(new ImageData(rgba as unknown as Uint8ClampedArray<ArrayBuffer>, frame.width, frame.height), 0, 0);
      drawn = key;
      last = { ms: performance.now() - started, pixels: frame.width * frame.height, stats };
    },
    destroy() {
      if (!alive) return;
      alive = false;
      stopTheme();
      canvas.remove();
    },
  };
  const stopTheme = watchTheme(doc, () => {
    const next = inkOf(colourFrom());
    if (next.join() !== ink.join()) {
      ink = next;
      layer.repaint();
    }
  });
  return layer;
}

/** Ask for the crowd in an idle moment, so that the first press of a level has nothing to wait for. */
function prefetch(win: Window | null, crowd: () => unknown): void {
  const idle = (win as (Window & { requestIdleCallback?: (run: () => void, options?: { timeout: number }) => number }) | null)?.requestIdleCallback;
  if (typeof idle === "function") idle.call(win, () => void crowd(), { timeout: 2000 });
  else win?.setTimeout(() => void crowd(), 300);
}

/**
 * The crowd on the floor of a 3D view: a canvas as the last child of the floor element (which the view's matrices already move), as wide in pixels as the floor is, 1.4 times (2.4 times when the view is near; `layer.zoom`).
 * `floor` is the `.ky-turn-floor` element. It is painted once now and again only when something it shows changes.
 */
export function attachOutside3d(floor: HTMLElement, spec: OutsideSpec, prefetchCrowd = true): OutsideLayer {
  const doc = floor.ownerDocument;
  const canvas = doc.createElement("canvas");
  canvas.className = "ky-turn-outside";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("data-outside", String(spec.level));
  canvas.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none";
  floor.append(canvas);
  const layer = layerOf(canvas, spec, () => floor.querySelector(".ky-district") ?? floor, () => (parseFloat(floor.style.width) || floor.clientWidth || 1400) * (layer.zoomTier === 1 ? 2.4 : 1.4));
  const set = layer.setLevel;
  layer.setLevel = (next) => {
    canvas.setAttribute("data-outside", String(next));
    set(next);
  };
  layer.repaint();
  if (prefetchCrowd) prefetch(doc.defaultView, spec.crowd);
  return layer;
}

/**
 * The crowd over a 2D plan: a canvas in `wrap` (a positioned element the plan's SVG is the child of), laid exactly over the box the SVG draws its view in (it keeps its shape inside a box of another, as `meet` does), as many pixels
 * as the box has device pixels, and made again when the box changes size.
 */
export function attachOutsidePlan(wrap: HTMLElement, svg: SVGSVGElement, spec: OutsideSpec, prefetchCrowd = true): OutsideLayer {
  const doc = wrap.ownerDocument;
  const win = doc.defaultView;
  const canvas = doc.createElement("canvas");
  canvas.className = "ky-district-outside";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("data-outside", String(spec.level));
  canvas.style.cssText = "position:absolute;pointer-events:none";
  wrap.append(canvas);
  /** The box the drawing's view fills inside the SVG's own box, in CSS pixels, relative to the wrap. */
  const place = (): { w: number } => {
    const box = svg.getBoundingClientRect();
    const home = wrap.getBoundingClientRect();
    const k = Math.min(box.width / spec.viewBox.w, box.height / spec.viewBox.h);
    const [w, h] = [spec.viewBox.w * k, spec.viewBox.h * k];
    canvas.style.left = `${box.left - home.left + (box.width - w) / 2}px`;
    canvas.style.top = `${box.top - home.top + (box.height - h) / 2}px`;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    return { w };
  };
  const layer = layerOf(canvas, spec, () => svg, () => place().w * Math.min(3, win?.devicePixelRatio ?? 1));
  const set = layer.setLevel;
  layer.setLevel = (next) => {
    canvas.setAttribute("data-outside", String(next));
    set(next);
  };
  let frame = 0;
  let observer: ResizeObserver | undefined;
  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(() => {
      if (frame !== 0 || win === null) return;
      frame = win.requestAnimationFrame(() => {
        frame = 0;
        layer.repaint();
      });
    });
    observer.observe(svg);
  }
  const destroy = layer.destroy;
  layer.destroy = () => {
    observer?.disconnect();
    if (frame !== 0) win?.cancelAnimationFrame(frame);
    destroy();
  };
  layer.repaint();
  if (prefetchCrowd) prefetch(win, spec.crowd);
  return layer;
}
