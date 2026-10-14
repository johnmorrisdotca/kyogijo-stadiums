// The 3D view in a page: `mountKyogijoTurn` writes the scene (`turn.markup.ts`) into a container and makes it turn, as the cube of kyuubu turns: a drag turns and
// tips it, a pinch or Ctrl and the wheel zoom, the arrow keys step it, four viewpoints and a reset are a button or a number key away, a reader who prefers
// reduced motion gets jumps for glides, and where the browser cannot draw in 3D the flat drawing stays. Nothing is polled and nothing runs while the view is
// still: the elements' `transform`s are written when the view changes, and a glide between viewpoints is a short run of animation frames.
import { drawKyogijo } from "./draw.ts";
import { STEP, TURN_PRESET_NAMES, clampView, drag, nearest, presetOf, presetView, step, type TurnPreset, type TurnView } from "./turn.camera.ts";
import { buildTurn, floorOptions, openingView, turnWords, type TurnModel, type TurnSettings } from "./turn.model.ts";
import { controlsMarkup, layoutOf, turnMarkupOf, worldMarkup, type Layout } from "./turn.markup.ts";
import { KYOGIJO_TURN_STYLE } from "./turn.style.ts";
import { esc } from "./format.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

/** What `mountKyogijoTurn` gives back. */
export interface KyogijoTurn {
  /** `3d`, or `flat` where the browser cannot draw the 3D view (or there is nothing to turn): the flat drawing is shown and the rest of this does nothing. */
  readonly mode: "3d" | "flat";
  /** The view now: where it is going if it is gliding. */
  view(): TurnView;
  /** Turn to a view (the parts of it given): it glides there unless `glide` is false or the reader prefers reduced motion. */
  set(view: Partial<TurnView>, glide?: boolean): void;
  /** Go to one of the four viewpoints: `overhead`, `broadcast`, `end` or `corner`. */
  preset(name: TurnPreset): void;
  /** Back to the opening view. */
  reset(): void;
  /** Draw again with new options (a score that moved, a look that changed), keeping the view. */
  update(options: SurfaceOptions | ScoreOptions): void;
  /** The flat drawing that is the floor, or `null` after `destroy`. */
  svg(): SVGSVGElement | null;
  /** Stop listening and empty the container. */
  destroy(): void;
}

/** True where the page can draw a plane in 3D by one `matrix3d`: that is, nearly everywhere with a stylesheet. */
export function turnSupported(win: { CSS?: { supports?: (property: string, value: string) => boolean } | null } | undefined = typeof window === "undefined" ? undefined : window): boolean {
  const css = win?.CSS;
  if (css === undefined || css === null || typeof css.supports !== "function") return false;
  return css.supports("transform", "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)");
}

const KEYS: Record<string, true> = { ArrowLeft: true, ArrowRight: true, ArrowUp: true, ArrowDown: true, "+": true, "=": true, "-": true, _: true, "0": true, Home: true, "1": true, "2": true, "3": true, "4": true };

/** The view part of the way from one to another, `t` from 0 to 1, the turn taken the short way round. */
const between = (from: TurnView, to: TurnView, t: number): TurnView => ({ yaw: from.yaw + (nearest(from.yaw, to.yaw) - from.yaw) * t, pitch: from.pitch + (to.pitch - from.pitch) * t, zoom: from.zoom * Math.pow(to.zoom / from.zoom, t) });

/**
 * Mount a surface as a 3D view in a container, over the static drawing it would otherwise hold: the drawing is the floor, tilted and turned by the pointer, the
 * touch, the wheel and the keys, with what stands on the surface (a net and its posts, a basket, a goal, the posts of a football field) standing on it.
 * @example
 * ```ts no-run
 * import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";
 * const view = mountKyogijoTurn(document.querySelector("#court")!, { sport: "volleyball", home: { name: "Harbour City Gulls", score: 3 }, away: { name: "Prairie Ridge Bison", score: 2 } }, { preset: "end" });
 * view.preset("corner");
 * view.set({ yaw: 60, pitch: 40 });
 * ```
 */
export function mountKyogijoTurn(host: HTMLElement, options: SurfaceOptions | ScoreOptions, settings: TurnSettings = {}): KyogijoTurn {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  let model: TurnModel = buildTurn(options, settings);
  const sport = (): string | undefined => (model.options as SurfaceOptions).sport;
  const supported = turnSupported(win ?? undefined) && model.turnable;
  let alive = true;

  if (!supported) {
    // The flat drawing, with a sentence that says why it does not turn when the browser is the reason.
    const flat = (next: SurfaceOptions | ScoreOptions): void => {
      host.innerHTML = `<div class="ky-turn" data-mode="flat"><style>${KYOGIJO_TURN_STYLE}</style>${drawKyogijo(floorOptions(next))}${model.turnable ? `<p class="ky-turn-flat">${esc(turnWords(model).flat)}</p>` : ""}</div>`;
    };
    flat(options);
    return {
      mode: "flat",
      view: () => model.view,
      set: () => undefined,
      preset: () => undefined,
      reset: () => undefined,
      update: (next) => {
        model = buildTurn(next, settings);
        flat(next);
      },
      svg: () => (alive ? host.querySelector<SVGSVGElement>("svg.kyogijo") : null),
      destroy: () => {
        alive = false;
        host.replaceChildren();
      },
    };
  }

  host.innerHTML = turnMarkupOf(model, settings);
  const root = host.querySelector<HTMLElement>(".ky-turn")!;
  const stage = root.querySelector<HTMLElement>(".ky-turn-view")!;
  const live = root.querySelector<HTMLElement>(".ky-turn-live")!;
  const media = win?.matchMedia?.("(prefers-reduced-motion: reduce)");

  /** Where the view is going, and where it is on the screen now (the two differ while it glides). */
  let view = model.view;
  let shown = view;
  let opening = model.view;
  let flight: { from: TurnView; to: TurnView; start: number; ms: number; frame: number } | undefined;
  let spoken: ReturnType<typeof setTimeout> | undefined;

  const calm = (): boolean => settings.motion === "none" || (settings.motion !== "smooth" && media?.matches === true);

  // The elements, floor first, and what was written to each, so that only a change is written.
  let elements: HTMLElement[] = [];
  let written: string[] = [];
  let stacked: string[] = [];
  const gather = (): void => {
    elements = [...stage.querySelectorAll<HTMLElement>(".ky-turn-floor, .ky-up")];
    written = elements.map((one) => one.style.transform);
    stacked = elements.map((one) => one.style.zIndex);
  };
  gather();

  const buttons = (): NodeListOf<HTMLButtonElement> => root.querySelectorAll<HTMLButtonElement>("button[data-preset]");
  /** Put a view on the screen. */
  const paint = (now: TurnView): void => {
    const width = stage.clientWidth || 960;
    const height = stage.clientHeight || 600;
    const layout: Layout = layoutOf(model, now, width, height, settings.lens);
    elements.forEach((one, i) => {
      if (written[i] !== layout.transforms[i]) one.style.transform = written[i] = layout.transforms[i];
      const z = String(layout.stack[i]);
      if (stacked[i] !== z) one.style.zIndex = stacked[i] = z;
    });
  };
  const label = (): void => {
    const here = presetOf(view, sport());
    root.dataset.preset = here ?? "custom";
    for (const button of buttons()) button.setAttribute("aria-pressed", String(button.dataset.preset === here));
  };
  paint(shown);
  label();

  const stop = (): void => {
    if (flight !== undefined) win?.cancelAnimationFrame(flight.frame);
    flight = undefined;
  };
  /** Go to a view: by a glide of `ms` milliseconds, or at once. */
  const show = (to: TurnView, ms: number): void => {
    stop();
    view = to;
    label();
    if (ms <= 0 || calm() || win === null) {
      shown = to;
      paint(shown);
      return;
    }
    const from = shown;
    const run = (stamp: number): void => {
      if (flight === undefined) return;
      const t = Math.min(1, (stamp - flight.start) / flight.ms);
      const eased = 1 - Math.pow(1 - t, 3);
      shown = t >= 1 ? flight.to : between(flight.from, flight.to, eased);
      paint(shown);
      if (t < 1) flight.frame = win.requestAnimationFrame(run);
      else flight = undefined;
    };
    flight = { from, to, start: win.performance.now(), ms, frame: 0 };
    flight.frame = win.requestAnimationFrame(run);
  };

  const say = (text: string, wait = 0): void => {
    clearTimeout(spoken);
    const write = (): void => {
      // A repeated sentence is cleared first, so that a screen reader says it again.
      if (live.textContent === text) live.textContent = "";
      live.textContent = text;
    };
    if (wait === 0) write();
    else spoken = setTimeout(write, wait);
  };
  const angles = (): string => turnWords(model).announceAngle.replace("{yaw}", String(Math.round(((view.yaw % 360) + 360) % 360))).replace("{pitch}", String(Math.round(90 - view.pitch)));

  const changed = (): void => settings.onChange?.(view, presetOf(view, sport()));
  /** Move to a view the controls asked for: glide, say where it is, tell the page. */
  const go = (next: TurnView, ms: number, speak: "preset" | "angle" | "none" = "angle"): void => {
    // A turn takes the short way round, even from 170 degrees to -170.
    show(clampView({ ...next, yaw: nearest(view.yaw, next.yaw) }), ms);
    if (speak === "preset") {
      const here = presetOf(view, sport());
      if (here !== undefined) say(turnWords(model).announce.replace("{name}", turnWords(model)[here]));
    } else if (speak === "angle") say(angles(), 450);
    changed();
  };
  const toPreset = (name: TurnPreset): void => go(presetView(name, sport()) ?? opening, 560, "preset");
  const toOpening = (): void => {
    go(opening, 560, "none");
    say(turnWords(model).reset);
  };

  // ---- Buttons. ----
  const onClick = (event: Event): void => {
    const target = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
    if (target === null || target === undefined || !root.contains(target)) return;
    const name = target.dataset.preset as TurnPreset | undefined;
    if (name !== undefined) return toPreset(name);
    const big = (event as MouseEvent).shiftKey === true;
    switch (target.dataset.act) {
      case "turn-left": return go(step(view, { yaw: -(big ? STEP.yawBig : STEP.yaw * 2) }), 180);
      case "turn-right": return go(step(view, { yaw: big ? STEP.yawBig : STEP.yaw * 2 }), 180);
      case "raise": return go(step(view, { pitch: -(big ? STEP.pitchBig : STEP.pitch * 2) }), 180);
      case "lower": return go(step(view, { pitch: big ? STEP.pitchBig : STEP.pitch * 2 }), 180);
      case "zoom-in": return go(step(view, { zoom: STEP.zoom }), 180, "none");
      case "zoom-out": return go(step(view, { zoom: 1 / STEP.zoom }), 180, "none");
      case "reset": return toOpening();
      default:
    }
  };
  root.addEventListener("click", onClick);

  // ---- Keys. ----
  const onKey = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey || KEYS[event.key] !== true) return;
    const big = event.shiftKey;
    const yaw = big ? STEP.yawBig : STEP.yaw;
    const pitch = big ? STEP.pitchBig : STEP.pitch;
    event.preventDefault();
    switch (event.key) {
      case "ArrowLeft": return go(step(view, { yaw: -yaw }), 120);
      case "ArrowRight": return go(step(view, { yaw }), 120);
      case "ArrowUp": return go(step(view, { pitch: -pitch }), 120);
      case "ArrowDown": return go(step(view, { pitch }), 120);
      case "+":
      case "=": return go(step(view, { zoom: STEP.zoom }), 120, "none");
      case "-":
      case "_": return go(step(view, { zoom: 1 / STEP.zoom }), 120, "none");
      case "0":
      case "Home": return toOpening();
      default: toPreset(TURN_PRESET_NAMES[Number(event.key) - 1]);
    }
  };
  stage.addEventListener("keydown", onKey);

  // ---- The pointer: one finger or the mouse turns and tips; two fingers pinch. ----
  const down = new Map<number, { x: number; y: number }>();
  let pinch: { distance: number; zoom: number } | undefined;
  let moved = false;
  const tilts = (type: string): boolean => type !== "touch" || settings.touch === "turn";
  /** The pointer takes the view over from a glide: from where it is on the screen. */
  const grab = (): void => {
    stop();
    view = shown;
  };
  const onDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    down.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try {
      stage.setPointerCapture(event.pointerId);
    } catch {
      /* A pointer that is already gone. */
    }
    moved = false;
    grab();
    if (down.size === 1) root.setAttribute("data-dragging", "");
    if (down.size === 2) {
      const [a, b] = [...down.values()];
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: view.zoom };
    }
  };
  const onMove = (event: PointerEvent): void => {
    const before = down.get(event.pointerId);
    if (before === undefined) return;
    const here = { x: event.clientX, y: event.clientY };
    down.set(event.pointerId, here);
    if (down.size >= 2 && pinch !== undefined) {
      const [a, b] = [...down.values()];
      view = clampView({ ...view, zoom: pinch.zoom * ((Math.hypot(a.x - b.x, a.y - b.y) || 1) / pinch.distance) });
    } else {
      view = drag(view, here.x - before.x, here.y - before.y, tilts(event.pointerType));
      if (Math.abs(here.x - before.x) + Math.abs(here.y - before.y) > 0) moved = true;
    }
    shown = view;
    paint(shown);
  };
  const onUp = (event: PointerEvent): void => {
    if (!down.delete(event.pointerId)) return;
    if (down.size < 2) pinch = undefined;
    if (down.size === 0) {
      root.removeAttribute("data-dragging");
      label();
      if (moved) {
        say(angles(), 450);
        changed();
      }
    }
  };
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  stage.addEventListener("dblclick", toOpening);

  // ---- The wheel: Ctrl and the wheel (a pinch on a trackpad) zoom; with the view focused the wheel tips and turns it; otherwise the page scrolls as ever. ----
  const onWheel = (event: WheelEvent): void => {
    if (event.ctrlKey) {
      event.preventDefault();
      grab();
      view = clampView({ ...view, zoom: view.zoom * Math.exp(-event.deltaY * 0.01) });
    } else if (doc.activeElement === stage) {
      event.preventDefault();
      grab();
      view = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) ? clampView({ ...view, yaw: view.yaw + (event.deltaX || event.deltaY) * 0.25 }) : clampView({ ...view, pitch: view.pitch + event.deltaY * 0.15 });
    } else return;
    shown = view;
    paint(shown);
    label();
  };
  stage.addEventListener("wheel", onWheel, { passive: false });

  // ---- The size of the box. ----
  let observer: ResizeObserver | undefined;
  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(() => alive && paint(shown));
    observer.observe(stage);
  }

  return {
    mode: "3d",
    view: () => ({ ...view }),
    set(next, glide = true) {
      go({ ...view, ...next }, glide ? 560 : 0, "angle");
    },
    preset: toPreset,
    reset: toOpening,
    update(next) {
      if (!alive) return;
      model = buildTurn(next, { ...settings, preset: undefined, view });
      view = clampView(view);
      opening = openingView(settings, sport());
      const layout = layoutOf(model, shown, stage.clientWidth || 960, stage.clientHeight || 600, settings.lens);
      root.querySelector(".ky-turn-world")!.innerHTML = worldMarkup(model, layout);
      gather();
      stage.setAttribute("aria-label", model.title);
      root.querySelector(".ky-turn-help")!.textContent = `${turnWords(model).keys}${model.standing === "" ? "" : ` ${model.standing}`}`;
      const theme = (model.options as SurfaceOptions).theme;
      if (theme === "light" || theme === "dark") root.dataset.theme = theme;
      else root.removeAttribute("data-theme");
      const controls = root.querySelector(".ky-turn-controls");
      if (controls !== null) controls.outerHTML = controlsMarkup(model, view);
      paint(shown);
      label();
    },
    svg: () => (alive ? root.querySelector<SVGSVGElement>(".ky-turn-floor svg.kyogijo") : null),
    destroy() {
      if (!alive) return;
      alive = false;
      stop();
      clearTimeout(spoken);
      observer?.disconnect();
      host.replaceChildren();
    },
  };
}
