// The 3D view in a page: `mountKyogijoTurn` writes the scene (`turn.markup.ts`) into a container and makes it turn, as the cube of kyuubu turns: a drag turns and
// tips it, a pinch or Ctrl and the wheel zoom, the arrow keys step it, four viewpoints and a reset are a button or a number key away, a reader who prefers
// reduced motion gets jumps for glides, and where the browser cannot draw in 3D the flat drawing stays. Nothing is polled and nothing runs while the view is
// still: the elements' `transform`s are written when the view changes, and a glide between viewpoints is a short run of animation frames.
import { drawKyogijo } from "./draw.ts";
import { STEP, TURN_PRESET_NAMES, clampView, drag, nearest, nudge, presetOf, presetView, step, turnDirection, type PresetTable, type TurnDirection, type TurnPreset, type TurnView } from "./turn.camera.ts";
import { buildTurn, floorOptions, openingView, turnWords, type TurnModel, type TurnSettings } from "./turn.model.ts";
import { controlsMarkup, layoutOf, turnMarkupOf, worldMarkup, type Layout } from "./turn.markup.ts";
import { KYOGIJO_TURN_STYLE } from "./turn.style.ts";
import { esc } from "./format.ts";
import { turnBoardMarkup } from "./overlay.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";
import type { VenueSettings } from "./venue.ts";

/** What `mountKyogijoTurn` gives back. `O` is what `update` takes: the options of a drawing, or (for `mountMultiTurn`) of a tournament layout. */
export interface KyogijoTurn<O = SurfaceOptions | ScoreOptions> {
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
  /**
   * Draw again with new options (a score that moved, a look that changed), keeping the view and the auto-turn: the view goes on turning. `change` alters what the venue's walls and roof stand on (the settings `venue` was
   * mounted with, the parts given), so that a page can switch them on and off without mounting the view again.
   */
  update(options: O, change?: { venue?: VenueSettings }): void;
  /** Whether the auto-turn is running. */
  readonly playing: boolean;
  /** Start the auto-turn, a slow turn of the whole view. It gives whether it is running (a surface that cannot turn gives `false`). Nothing turns by itself until this, the Play button or Space starts it, unless `autoPlay` asked. */
  play(): boolean;
  /** Stop the auto-turn. */
  pause(): void;
  /** Which way the auto-turn goes. */
  direction(): TurnDirection;
  /** Change which way the auto-turn goes, at once and without stopping it (the Reverse button does). */
  setDirection(direction: TurnDirection): void;
  /** Start the auto-turn if it is stopped and stop it if it is running; it gives whether it is running now. */
  togglePlay(): boolean;
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

const KEYS: Record<string, true> = { " ": true, ArrowLeft: true, ArrowRight: true, ArrowUp: true, ArrowDown: true, "+": true, "=": true, "-": true, _: true, "0": true, Home: true, "1": true, "2": true, "3": true, "4": true };

/** The view part of the way from one to another, `t` from 0 to 1, the turn taken the short way round. */
const between = (from: TurnView, to: TurnView, t: number): TurnView => ({ yaw: from.yaw + (nearest(from.yaw, to.yaw) - from.yaw) * t, pitch: from.pitch + (to.pitch - from.pitch) * t, zoom: from.zoom * Math.pow(to.zoom / from.zoom, t) });

/**
 * Mount a surface as a 3D view in a container, over the static drawing it would otherwise hold: the drawing is the floor, tilted and turned by the pointer, the
 * touch, the wheel and the keys, with what stands on the surface (a net and its posts, a basket, a goal, the posts of a football field) standing on it.
 * @example
 * ```ts no-run
 * import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";
 * const view = mountKyogijoTurn(document.querySelector("#court")!, { sport: "volleyball", home: { name: "Japan", score: 3 }, away: { name: "USA", score: 2 } }, { preset: "end" });
 * view.preset("corner");
 * view.set({ yaw: 60, pitch: 40 });
 * ```
 */
export function mountKyogijoTurn(host: HTMLElement, options: SurfaceOptions | ScoreOptions, settings: TurnSettings = {}): KyogijoTurn {
  return mountTurn(host, options, settings, buildTurn);
}

/**
 * Mount any 3D model (`mountKyogijoTurn` is this with the model of one surface; `mountMultiTurn` with a tournament layout's): `build` makes the model from what `update` is given, and the rest, the controls, the pointer, the keys
 * and the auto-turn, is the same.
 */
export function mountTurn<O>(host: HTMLElement, options: O, settings: TurnSettings, build: (options: O, settings: TurnSettings) => TurnModel): KyogijoTurn<O> {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  /** The venue's settings as they are now: the mounted ones, altered by `update`. */
  let venue: boolean | VenueSettings | undefined = settings.venue;
  let model: TurnModel = build(options, settings);
  /** What names the four viewpoints: the model's own table (a tournament layout has one), else the sport's. */
  const sport = (): string | PresetTable | undefined => model.presets ?? (model.options as SurfaceOptions).sport;
  const supported = turnSupported(win ?? undefined) && model.turnable;
  let alive = true;

  if (!supported) {
    // The flat drawing, with a sentence that says why it does not turn when the browser is the reason.
    const flat = (next: O): void => {
      host.innerHTML = `<div class="ky-turn" data-mode="flat"><style>${KYOGIJO_TURN_STYLE}</style>${model.flat ?? drawKyogijo({ ...floorOptions(next as SurfaceOptions | ScoreOptions), board: (next as SurfaceOptions).board })}${model.turnable ? `<p class="ky-turn-flat">${esc(turnWords(model).flat)}</p>` : ""}</div>`;
    };
    flat(options);
    return {
      mode: "flat",
      view: () => model.view,
      set: () => undefined,
      preset: () => undefined,
      reset: () => undefined,
      playing: false,
      play: () => false,
      pause: () => undefined,
      direction: () => turnDirection(settings.direction),
      setDirection: () => undefined,
      togglePlay: () => false,
      update: (next, change) => {
        if (change?.venue !== undefined) venue = { ...(typeof venue === "object" ? venue : {}), ...change.venue };
        model = build(next, { ...settings, id: settings.id ?? model.id, venue });
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
  // The auto-turn: whether it is on, the frame that will advance it, the time of the last one, and whether it has moved the view since the page was last told.
  let playing = false;
  let tickFrame: number | undefined;
  let lastTick: number | undefined;
  let advanced = false;
  const speed = typeof settings.speed === "number" && Number.isFinite(settings.speed) ? settings.speed : 12;
  let way: TurnDirection = turnDirection(settings.direction);

  const calm = (): boolean => settings.motion === "none" || (settings.motion !== "smooth" && media?.matches === true);

  // The elements, floor first, and what was written to each, so that only a change is written.
  let elements: HTMLElement[] = [];
  let written: string[] = [];
  let stacked: string[] = [];
  let faded: string[] = [];
  const gather = (): void => {
    elements = [...stage.querySelectorAll<HTMLElement>(".ky-turn-floor, .ky-up")];
    written = elements.map((one) => one.style.transform);
    stacked = elements.map((one) => one.style.zIndex);
    faded = elements.map((one) => one.style.opacity);
  };
  gather();

  const buttons = (): NodeListOf<HTMLButtonElement> => root.querySelectorAll<HTMLButtonElement>("button[data-preset]");
  /** The Play button says what it is and what it does: pressed while the view turns. */
  const syncPlay = (): void => {
    const button = root.querySelector<HTMLButtonElement>("button[data-act=play]");
    if (button === null) return;
    const words = turnWords(model);
    button.setAttribute("aria-pressed", String(playing));
    button.title = playing ? words.playOff : words.playOn;
    const glyph = button.querySelector("[data-glyph]");
    if (glyph !== null) glyph.textContent = playing ? "❚❚" : "▶";
  };
  /** Put a view on the screen. */
  const paint = (now: TurnView): void => {
    const width = stage.clientWidth || 960;
    const height = stage.clientHeight || 600;
    const layout: Layout = layoutOf(model, now, width, height, settings.lens);
    elements.forEach((one, i) => {
      if (written[i] !== layout.transforms[i]) one.style.transform = written[i] = layout.transforms[i];
      const z = String(layout.stack[i]);
      if (stacked[i] !== z) one.style.zIndex = stacked[i] = z;
      const o = layout.fade[i] < 1 ? String(layout.fade[i]) : "";
      if (faded[i] !== o) one.style.opacity = faded[i] = o;
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
  const go = (next: TurnView, ms: number, speak: "preset" | "angle" | "none" = "angle", keepPlaying = false): void => {
    // Anything the reader (or the page) asks of the view takes it over from the auto-turn, but a zoom, which does not turn it.
    if (!keepPlaying) setPlaying(false, true);
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

  // ---- The auto-turn: a trophy case's slow turn. It runs only when asked, holds while the pointer holds the view, and does nothing while the page is hidden. ----
  const hidden = (): boolean => doc.hidden === true;
  const stopTick = (): void => {
    if (tickFrame !== undefined) win?.cancelAnimationFrame(tickFrame);
    tickFrame = undefined;
    lastTick = undefined;
  };
  const tick = (stamp: number): void => {
    tickFrame = undefined;
    if (!playing || !alive) return;
    // Hidden, off the screen or held: the loop ends here, and the visibility change, the scroll back or the pointer's release starts it again.
    if (hidden() || !onScreen || down.size > 0) {
      lastTick = undefined;
      return;
    }
    // About thirty frames a second are plenty for a slow turn, and every plane is written at each.
    if (lastTick !== undefined && stamp - lastTick < 30) {
      loop();
      return;
    }
    const dt = lastTick === undefined ? 0 : Math.min(0.1, (stamp - lastTick) / 1000);
    lastTick = stamp;
    if (dt > 0) {
      stop();
      view = clampView({ ...view, yaw: view.yaw - (way === "clockwise" ? -1 : 1) * speed * dt });
      shown = view;
      advanced = true;
      paint(shown);
      label();
    }
    loop();
  };
  const loop = (): void => {
    if (tickFrame === undefined && playing && alive && win !== null) tickFrame = win.requestAnimationFrame(tick);
  };
  /** Start or stop the auto-turn. `quiet` leaves the live region alone (a key or a drag stopped it, and says its own thing). */
  const setPlaying = (next: boolean, quiet = false): void => {
    if (playing === next) return;
    playing = next;
    stopTick();
    syncPlay();
    if (next) loop();
    else if (advanced) {
      // The page is told where the view ended up, once, not at every frame.
      advanced = false;
      changed();
    }
    if (!quiet) say(next ? turnWords(model).announcePlay : turnWords(model).announcePause);
    settings.onPlayChange?.(next);
  };
  /** Change the direction; the Reverse button says which it is, and the page is told. */
  const setWay = (next: TurnDirection, quiet = false): void => {
    if (next === way) return;
    way = next;
    root.querySelector<HTMLButtonElement>("button[data-act=reverse]")?.setAttribute("aria-pressed", String(way === "clockwise"));
    if (!quiet) say(way === "clockwise" ? turnWords(model).announceClockwise : turnWords(model).announceCounterclockwise);
    settings.onDirectionChange?.(way);
  };
  // A view scrolled out of sight does not turn.
  let onScreen = true;
  let seen: IntersectionObserver | undefined;
  if (typeof IntersectionObserver === "function") {
    seen = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1]?.isIntersecting !== false;
      if (onScreen && playing) {
        lastTick = undefined;
        loop();
      }
    });
    seen.observe(stage);
  }
  const onVisible = (): void => {
    if (playing && !hidden()) {
      lastTick = undefined;
      loop();
    }
  };
  doc.addEventListener("visibilitychange", onVisible);

  // ---- Buttons. ----
  const onClick = (event: Event): void => {
    const target = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
    if (target === null || target === undefined || !root.contains(target)) return;
    const name = target.dataset.preset as TurnPreset | undefined;
    if (name !== undefined) return toPreset(name);
    const big = (event as MouseEvent).shiftKey === true;
    switch (target.dataset.act) {
      // The buttons take the surface toward their side as a drag and the arrow keys do.
      case "turn-left": return go(nudge(view, "left", big ? STEP.yawBig : STEP.yaw * 2), 180);
      case "turn-right": return go(nudge(view, "right", big ? STEP.yawBig : STEP.yaw * 2), 180);
      case "raise": return go(nudge(view, "up", big ? STEP.pitchBig : STEP.pitch * 2), 180);
      case "lower": return go(nudge(view, "down", big ? STEP.pitchBig : STEP.pitch * 2), 180);
      case "zoom-in": return go(step(view, { zoom: STEP.zoom }), 180, "none", true);
      case "zoom-out": return go(step(view, { zoom: 1 / STEP.zoom }), 180, "none", true);
      case "play": return void setPlaying(!playing);
      case "reverse": return setWay(way === "clockwise" ? "counterclockwise" : "clockwise");
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
      // A key takes the surface toward its side as a drag toward that side does: the side nearest the eye goes to the right on ArrowRight, and ArrowUp tips it as a drag up does.
      case "ArrowLeft": return go(nudge(view, "left", yaw), 120);
      case "ArrowRight": return go(nudge(view, "right", yaw), 120);
      case "ArrowUp": return go(nudge(view, "up", pitch), 120);
      case "ArrowDown": return go(nudge(view, "down", pitch), 120);
      case "+":
      case "=": return go(step(view, { zoom: STEP.zoom }), 120, "none", true);
      case "-":
      case "_": return go(step(view, { zoom: 1 / STEP.zoom }), 120, "none", true);
      case " ": return void setPlaying(!playing);
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
    // The auto-turn holds while the pointer does.
    stopTick();
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
      if (playing) loop();
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

  // Nothing moves until the reader asks, unless the page did: `autoPlay` starts it, but not for a reader who prefers reduced motion (`"force"` does).
  if (settings.autoPlay === "force" || (settings.autoPlay === true && !calm())) setPlaying(true, true);

  return {
    mode: "3d",
    view: () => ({ ...view }),
    set(next, glide = true) {
      go({ ...view, ...next }, glide ? 560 : 0, "angle");
    },
    preset: toPreset,
    reset: toOpening,
    update(next, change) {
      if (!alive) return;
      if (change?.venue !== undefined) venue = { ...(typeof venue === "object" ? venue : {}), ...change.venue };
      model = build(next, { ...settings, id: settings.id ?? model.id, venue, preset: undefined, view });
      view = clampView(view);
      opening = openingView(settings, sport());
      const layout = layoutOf(model, shown, stage.clientWidth || 960, stage.clientHeight || 600, settings.lens);
      const world = root.querySelector<HTMLElement>(".ky-turn-world")!;
      world.innerHTML = worldMarkup(model, layout);
      // The look the floor is painted in (and the theme) are attributes of the world.
      for (const name of ["data-sport", "data-look", "data-theme"]) world.removeAttribute(name);
      world.className = model.look === undefined ? "ky-turn-world" : "ky-turn-world kyogijo";
      if (model.look !== undefined) {
        world.setAttribute("data-sport", model.look.sport);
        world.setAttribute("data-look", model.look.look);
        const forced = (model.options as SurfaceOptions).theme;
        if (forced === "light" || forced === "dark") world.setAttribute("data-theme", forced);
      }
      gather();
      // The board is a layer of its own over the view, after the scene: it is written again, and the view's turn is not touched.
      stage.querySelector(".ky-turn-board")?.remove();
      if (model.board !== undefined) stage.insertAdjacentHTML("beforeend", turnBoardMarkup(model.board));
      stage.setAttribute("aria-label", model.title);
      root.querySelector(".ky-turn-help")!.textContent = `${turnWords(model).keys}${model.standing === "" ? "" : ` ${model.standing}`}`;
      const theme = (model.options as SurfaceOptions).theme;
      if (theme === "light" || theme === "dark") root.dataset.theme = theme;
      else root.removeAttribute("data-theme");
      const controls = root.querySelector(".ky-turn-controls");
      if (controls !== null) controls.outerHTML = controlsMarkup(model, view, playing, way);
      paint(shown);
      label();
    },
    get playing() {
      return playing;
    },
    play() {
      setPlaying(true);
      return playing;
    },
    pause() {
      setPlaying(false);
    },
    direction: () => way,
    setDirection(next) {
      setWay(turnDirection(next));
    },
    togglePlay() {
      setPlaying(!playing);
      return playing;
    },
    svg: () => (alive ? root.querySelector<SVGSVGElement>(".ky-turn-floor svg.kyogijo") : null),
    destroy() {
      if (!alive) return;
      alive = false;
      stop();
      stopTick();
      seen?.disconnect();
      doc.removeEventListener("visibilitychange", onVisible);
      clearTimeout(spoken);
      observer?.disconnect();
      host.replaceChildren();
    },
  };
}
