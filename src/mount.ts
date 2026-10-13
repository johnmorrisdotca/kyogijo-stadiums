import { drawKyogijo, isPortrait } from "./draw.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

/** What `mountKyogijo` gives back. */
export interface KyogijoMount {
  /** Draw again with new options: a score that moved, a theme that changed. */
  update(options: SurfaceOptions | ScoreOptions): void;
  /** The drawing, or `null` after `destroy`. */
  svg(): SVGSVGElement | null;
  /** The orientation the drawing lies in now. */
  orientation(): "landscape" | "portrait";
  /** Stop watching the container and empty it. */
  destroy(): void;
}

/** What `mountKyogijo` can be told. */
export interface MountSettings {
  /** For `orientation: "auto"` on a container whose height follows its content: it is portrait when narrower than this many pixels. 560 by default. */
  breakpoint?: number;
}

/**
 * The container's width over its height, for `orientation: "auto"`. A container with a height of its own (a card of a fixed
 * size, a flex or grid cell) gives its real shape; one whose height follows what is drawn in it gives a tall shape when it is
 * narrower than the breakpoint and a wide one otherwise.
 */
export function containerAspect(host: HTMLElement, breakpoint = 560): number | undefined {
  const width = host.clientWidth;
  if (width === 0) return undefined;
  // Empty, and with no least height of its own, a container has a height only if its style gives it one.
  const nodes = [...host.childNodes];
  const least = host.style.minHeight;
  host.replaceChildren();
  host.style.minHeight = "0";
  const height = host.clientHeight;
  host.style.minHeight = least;
  host.replaceChildren(...nodes);
  if (height >= 40) return width / height;
  return width < breakpoint ? 0.75 : 1.5;
}

/**
 * Draw into a container, and keep it drawn: with `orientation: "auto"` the container is watched, and the drawing is laid
 * out again, tall or wide, when its shape changes.
 * @example
 * ```ts no-run
 * import { mountKyogijo } from "@johnmorrisdotca/kyogijo/mount";
 * const card = mountKyogijo(document.querySelector("#game")!, {
 *   sport: "nhl",
 *   orientation: "auto",
 *   away: { name: "Harbour City Gulls", score: 1 },
 *   home: { name: "Prairie Ridge Bison", score: 0 },
 *   status: "live",
 * });
 * card.update({ sport: "nhl", orientation: "auto", away: { name: "Harbour City Gulls", score: 2 }, home: { name: "Prairie Ridge Bison", score: 0 } });
 * ```
 */
export function mountKyogijo(host: HTMLElement, options: SurfaceOptions | ScoreOptions, settings: MountSettings = {}): KyogijoMount {
  let current = options;
  let portrait = false;
  let alive = true;
  let frame = 0;
  const breakpoint = settings.breakpoint ?? 560;

  const render = (): void => {
    if (!alive) return;
    let aspect = current.aspect;
    if (current.orientation === "auto" && aspect === undefined) aspect = containerAspect(host, breakpoint);
    const next = { ...current, aspect };
    portrait = isPortrait(next);
    host.innerHTML = drawKyogijo(next);
  };
  const watch = (): void => {
    if (!alive || current.orientation !== "auto" || current.aspect !== undefined) return;
    if (frame !== 0) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!alive) return;
      const aspect = containerAspect(host, breakpoint);
      if (aspect === undefined) return;
      if ((aspect < 1) !== portrait) render();
    });
  };

  render();
  let observer: ResizeObserver | undefined;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(watch);
    observer.observe(host);
  }

  return {
    update(next) {
      current = next;
      render();
    },
    svg: () => (alive ? host.querySelector<SVGSVGElement>("svg.kyogijo") : null),
    orientation: () => (portrait ? "portrait" : "landscape"),
    destroy() {
      alive = false;
      observer?.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
      host.replaceChildren();
    },
  };
}

/**
 * The drawing as an `svg` element, made by the browser's own parser, for code that appends nodes rather than sets text.
 * @example
 * ```ts no-run
 * import { kyogijoElement } from "@johnmorrisdotca/kyogijo/mount";
 * document.body.append(kyogijoElement({ sport: "nba" }));
 * ```
 */
export function kyogijoElement(options: SurfaceOptions | ScoreOptions): SVGSVGElement {
  const doc = new DOMParser().parseFromString(drawKyogijo(options), "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.localName !== "svg" || doc.querySelector("parsererror") !== null) throw new Error("kyogijo drew something the browser could not read as SVG");
  return document.importNode(svg, true) as unknown as SVGSVGElement;
}
