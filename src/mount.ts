import { drawKyogijo, isPortrait } from "./draw.ts";
import type { ReplayController } from "./replay.control.ts";
import { createReplayView, type ReplayView } from "./replay.dom.ts";
import type { ReplaySettings, ReplayTimeline } from "./replay.types.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

/** A replay on a mount: the controller of its clock, and `destroy` to take the replay away and leave the surface. */
export type KyogijoReplay = ReplayController & { destroy(): void };

/** What `mountKyogijo` gives back. */
export interface KyogijoMount {
  /** Draw again with new options: a score that moved, a theme that changed. */
  update(options: SurfaceOptions | ScoreOptions): void;
  /** The drawing, or `null` after `destroy`. */
  svg(): SVGSVGElement | null;
  /** The orientation the drawing lies in now. */
  orientation(): "landscape" | "portrait";
  /**
   * Play tracking data on the surface: the players, the ball and the events of a timeline, with controls under the drawing (play, pause, step,
   * speed, loop, position), the keyboard (space, the arrow keys, Home and End) and a live region for goals and shots. Only the marks that move are
   * moved, on animation frames. A reader who prefers reduced motion gets steps, and nothing plays by itself; a hidden page pauses. `update` keeps the replay.
   */
  replay(timeline: ReplayTimeline, settings?: ReplaySettings): KyogijoReplay;
  /** Stop watching the container and empty it. */
  destroy(): void;
}

/** What `mountKyogijo` can be told. */
export interface MountSettings {
  /** For `orientation: "auto"` on a container whose height follows its content: it is portrait when narrower than this many pixels. 560 by default. */
  breakpoint?: number;
  /** Highlight a score that changes in `update`: a short pulse of the number, or a fade for a reader who prefers reduced motion. On by default. */
  highlight?: boolean;
}

const isScored = (o: SurfaceOptions | ScoreOptions): o is ScoreOptions => (o as Partial<ScoreOptions>).home !== undefined && (o as Partial<ScoreOptions>).away !== undefined;
const scoreText = (team: ScoreOptions["home"]): string => (team.score === undefined || team.score === null ? "" : String(team.score));

/**
 * Pulse the number of each team whose score is not what it was: it swells a little and settles (a fade only, for a reader who prefers
 * reduced motion). Done with the Web Animations API, so no rule is added to the page and nothing is left on the element.
 */
function highlightScores(host: HTMLElement, before: SurfaceOptions | ScoreOptions, after: SurfaceOptions | ScoreOptions): void {
  if (!isScored(before) || !isScored(after)) return;
  const order = after.homeSide === "left" ? (["home", "away"] as const) : (["away", "home"] as const);
  const numbers = host.querySelectorAll<SVGElement>(".ky-score");
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  order.forEach((role, index) => {
    const el = numbers[index];
    if (el === undefined || typeof el.animate !== "function" || scoreText(before[role]) === scoreText(after[role])) return;
    if (reduced) el.animate([{ opacity: 0.3 }], { duration: 900, easing: "ease-out" });
    else {
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "center";
      el.animate([{ transform: "scale(1)" }, { transform: "scale(1.28)", offset: 0.35 }, { transform: "scale(1)" }], { duration: 800, easing: "ease-out" });
    }
  });
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
  let view: ReplayView | undefined;
  const breakpoint = settings.breakpoint ?? 560;

  const resolved = (): SurfaceOptions | ScoreOptions => {
    let aspect = current.aspect;
    if (current.orientation === "auto" && aspect === undefined) aspect = containerAspect(host, breakpoint);
    const next = { ...current, aspect };
    portrait = isPortrait(next);
    return next;
  };
  const render = (): void => {
    if (!alive) return;
    const next = resolved();
    if (view === undefined) host.innerHTML = drawKyogijo(next);
    else view.draw(next);
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
      const before = current;
      current = next;
      render();
      if (settings.highlight !== false) highlightScores(host, before, next);
    },
    replay(timeline, replaySettings = {}) {
      if (!alive) throw new Error("this mount was destroyed");
      view?.destroy();
      const mine = createReplayView(host, timeline, replaySettings, resolved());
      view = mine;
      return {
        ...mine.controller,
        destroy() {
          if (view !== mine) return;
          mine.destroy();
          view = undefined;
          render();
        },
      };
    },
    svg: () => (alive ? host.querySelector<SVGSVGElement>("svg.kyogijo") : null),
    orientation: () => (portrait ? "portrait" : "landscape"),
    destroy() {
      alive = false;
      view?.destroy();
      view = undefined;
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
