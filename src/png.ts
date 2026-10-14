// A drawing as a PNG, in Node, through resvg (the optional peer `@resvg/resvg-js`). The SVG is first written without a stylesheet (see `sceneToSvg`),
// because resvg does not read CSS variables. In a browser, draw to a canvas (`drawToCanvas`) and ask it for a PNG instead.
import { sceneToSvg } from "./scene.flat.ts";
import { boundsOf } from "./scene.path.ts";
import { sceneOf } from "./scene.ts";
import type { Scene, SceneItem, SceneOptions, SceneSource } from "./scene.types.ts";

/** The members of resvg-js that are used. */
interface ResvgModule {
  Resvg: new (svg: string, options?: Record<string, unknown>) => { render(): { asPng(): Uint8Array } };
}

/** What `toPNG` takes besides the drawing. */
export interface PngOptions extends SceneOptions {
  /** The width of the picture in pixels. 1200 when neither a width nor a height is given. */
  width?: number;
  height?: number;
  /** A colour behind the drawing; the picture is transparent where there is none. */
  background?: string;
  /** Options for resvg's font handling, passed as its `font` option (`{ fontFiles: [...], loadSystemFonts: false }`). */
  font?: Record<string, unknown>;
}

/**
 * A shape wholly outside the drawing's frame, stroke included. resvg (the PNG renderer) stops the whole process, with a panic in its geometry code, on a shape with an opacity below 1 that lies wholly outside the
 * viewBox (a goal's net beyond a soccer pitch's penalty area, seen through a range), and such a shape paints nothing, so it is left out of the picture. Text and images are kept.
 */
export function isOutside(item: SceneItem, view: Scene["viewBox"]): boolean {
  if (item.kind === "text" || item.kind === "image") return false;
  const box = boundsOf(item, item.matrix);
  if (box === undefined) return false;
  const [a, b, c, d] = item.matrix;
  const pad = (item.style.stroke === "none" ? 0 : item.style.strokeWidth * Math.sqrt(Math.abs(a * d - b * c)) * 1.5) + 0.5;
  return box.x + box.w + pad < view.x || box.x - pad > view.x + view.w || box.y + box.h + pad < view.y || box.y - pad > view.y + view.h;
}

/** The scene without the shapes that lie wholly outside its frame. */
export function cullOutside(scene: Scene): Scene {
  return { ...scene, items: scene.items.filter((item) => !isOutside(item, scene.viewBox)) };
}

/** The message of the error thrown when the peer is not there. */
export const PNG_PEER_MISSING = "toPNG needs the optional package @resvg/resvg-js: install it with `npm install @resvg/resvg-js`. It runs in Node only; in a browser draw to a canvas with drawToCanvas and call canvas.toBlob.";

/**
 * A drawing as PNG bytes, by resvg-js (an optional peer dependency, loaded when this is called, in Node only). The drawing may be the options of `drawKyogijo`, an
 * SVG the package wrote or a scene; light or dark by `theme`. Without the peer installed this throws an error that says what to install.
 * @example
 * ```ts
 * import { toPNG } from "@johnmorrisdotca/kyogijo-stadiums/png";
 * // Without the peer installed this stays undefined; with it, the bytes start with the PNG signature.
 * const png = await toPNG({ sport: "nhl", id: "rink" }, { width: 800, theme: "dark" }).catch(() => undefined);
 * console.log(png === undefined || (png[1] === 80 && png[2] === 78 && png[3] === 71));
 * // true
 * ```
 */
export async function toPNG(source: SceneSource, options: PngOptions = {}): Promise<Uint8Array> {
  if ((globalThis as { process?: { versions?: { node?: string } } }).process?.versions?.node === undefined) throw new Error(PNG_PEER_MISSING);
  const name = "@resvg/resvg-js";
  let mod: ResvgModule;
  try {
    // The name is in a variable so that a bundler does not look for the peer, and a page that never calls this does not need it.
    mod = (await import(/* @vite-ignore */ name)) as ResvgModule;
  } catch {
    throw new Error(PNG_PEER_MISSING);
  }
  const wide = options.width === undefined && options.height === undefined ? 1200 : options.width;
  const svg = sceneToSvg(cullOutside(sceneOf(source, { theme: options.theme, css: options.css })), { theme: options.theme, css: options.css });
  const resvg = new mod.Resvg(svg, {
    fitTo: wide !== undefined ? { mode: "width", value: wide } : { mode: "height", value: options.height },
    ...(options.background === undefined ? {} : { background: options.background }),
    ...(options.font === undefined ? { font: { loadSystemFonts: true } } : { font: options.font }),
  });
  return resvg.render().asPng();
}
