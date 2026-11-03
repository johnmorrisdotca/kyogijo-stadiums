// The page's side of a replay: the controls under the drawing, the keyboard, the live region, and the painting of each frame by moving the
// marks that move and nothing else. The clock (replay.control.ts) and the frame (replay.ts) have no DOM; this file is the one that does. It is
// used by `mountKyogijo` (the `replay` method of a mount) and so by `<kyogijo-field>`.
import { num } from "./format.ts";
import { renderLayers } from "./layers.ts";
import { BAR_STYLE, createReplayBar, replayKey, type ReplayBarSlots, type ReplayBarWords } from "./replay.bar.ts";
import { REPLAY_SPEEDS, createReplay, type ReplayController } from "./replay.control.ts";
import { FOLLOW_STYLE, flatFollow, followControls, type FollowControls } from "./replay.follow.dom.ts";
import { describeEvent, drawFrame, replayClock, replayGroups, replaySpoken, replayInfo, replayPlacer, replaySnapshot, type ReplayGroup } from "./replay.ts";
import type { ReplayChange, ReplayLook, ReplaySettings, ReplayTimeline } from "./replay.types.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.core.ts";
import type { Language, ScoreOptions, SurfaceOptions } from "./types.ts";

type P = [number, number];

const SVG_NS = "http://www.w3.org/2000/svg";
let counter = 0;

/** The controls' stylesheet: written once beside the controls, scoped to them, in the page's own colours. */
export const REPLAY_STYLE = `
.ky-replay{position:relative;display:block;color:inherit}
.ky-replay .ky-stage:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.ky-replay .ky-live,.ky-replay .ky-hint{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
${BAR_STYLE}
`.trim();

/** A replay attached to a container: the controller, the stage the drawing goes in, and how to draw it again. */
export interface ReplayView {
  controller: ReplayController;
  /** The element the drawing is written into. */
  stage: HTMLElement;
  /** Draw the surface and the frame the clock is at, with new options (a theme that changed, a score that moved). */
  draw(options: SurfaceOptions | ScoreOptions): void;
  /** Stop the clock and the listeners, and empty the container. */
  destroy(): void;
}

/** What the painter keeps of a group of marks it moves. */
interface Bound {
  elements: Element[];
  base: P[];
  /** What each element was last given, so that a mark that did not move is not written again. */
  last: string[];
  /** The transform each element was drawn with, which a move goes in front of (a number turned back upright in a tall drawing). */
  own: (string | null)[];
}

const pathOf = (points: readonly P[]): string => points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${num(x)} ${num(y)}`).join("");

/** What a painter is given: where the drawing is, what it was drawn from, and how to draw it whole again. */
export interface PainterSource {
  doc: Document;
  timeline: ReplayTimeline;
  look: ReplayLook;
  /** The drawing the replay's groups are in (`svg.kyogijo`), or `null` before it is written. */
  svg(): SVGSVGElement | null;
  /** The options it was drawn with, its `id` among them. */
  options(): SurfaceOptions | ScoreOptions;
  language(): Language;
  /** Which groups of the replay are in this drawing: all when missing (a 3D view stands the players up and leaves the rest on the floor). */
  keep?: (group: ReplayGroup) => boolean;
  /** Write the drawing whole again at a time; the painter binds itself to it afterwards. */
  redraw(t: number): void;
}

/** The painter of a replay's drawing: `paint` moves the marks to a time; `bind` matches the elements of a drawing just written at `t`. */
export interface ReplayPainter {
  paint(t: number): void;
  bind(t: number): void;
}

/**
 * The painter of a replay: it moves the marks that move and nothing else. A mark that comes or goes (an object that enters, an event that begins) draws the replay's own group
 * again, never the surface; a group whose marks cannot be matched to elements one for one is drawn again each time.
 */
export function replayPainter(source: PainterSource): ReplayPainter {
  const { doc, timeline, look } = source;
  let placer = replayPlacer(source.options(), timeline);
  /** For each group of the replay in the drawing, the marks it holds (their keys): a group whose keys changed is drawn again, the others only move. */
  let shown = new Map<string, string>();
  let bound = new Map<string, Bound>();
  /** The groups whose marks cannot be matched to elements one for one, so that they are drawn again each time. */
  const loose = new Set<string>();
  let painted = Number.NaN;
  const keep = source.keep ?? (() => true);
  const idOf = (): string => source.options().id ?? "";

  const groupsAt = (t: number): { groups: ReplayGroup[]; placed: Map<string, P> } => {
    const snap = replaySnapshot(timeline, t, look);
    const groups = replayGroups(timeline, snap, look, source.language()).filter(keep);
    const places = placer(snap.objects.map((o): P => [o.x, o.y]));
    return { groups, placed: new Map(snap.objects.map((o, i) => [o.id, places[i]])) };
  };
  const positions = (g: ReplayGroup, placed: Map<string, P>): P[] | P[][] => (g.kind === "lines" ? g.coords.map((path) => placer(path as P[])) : g.keys.map((k) => placed.get(k) ?? [0, 0]));
  const holderOf = (g: ReplayGroup | string): Element | null => source.svg()?.querySelector(`[id="${idOf()}-${typeof g === "string" ? g : g.id}"]`) ?? null;
  /** Match the elements of a group that was just drawn to its marks, remembering where they are. */
  const bindGroup = (g: ReplayGroup, placed: Map<string, P>): void => {
    bound.delete(g.id);
    loose.delete(g.id);
    if (!g.moving) return;
    const holder = holderOf(g);
    const elements = holder === null ? [] : [...holder.children].filter((c) => c.localName !== "title" && c.localName !== "desc" && c.localName !== "defs");
    if (elements.length !== g.keys.length) {
      loose.add(g.id);
      return;
    }
    const at = positions(g, placed);
    const base = g.kind === "lines" ? (at as P[][]).map((path) => path[0]) : (at as P[]);
    const own = elements.map((el) => el.getAttribute("transform"));
    bound.set(g.id, { elements, base, last: elements.map((_, i) => (g.kind === "lines" ? "" : `translate(0 0)${own[i] === null ? "" : ` ${own[i]}`}`)), own });
  };
  /** Draw the groups that changed again, in their place among the others, and take away the ones that are gone. The surface and the groups that only move are left. */
  const patch = (groups: readonly ReplayGroup[], changed: readonly ReplayGroup[], gone: readonly string[], placed: Map<string, P>): boolean => {
    const svg = source.svg();
    const container = svg?.querySelector("g.ky-layers") ?? null;
    if (svg === null || svg === undefined || container === null) return false;
    for (const gid of gone) {
      holderOf(gid)?.remove();
      shown.delete(gid);
      bound.delete(gid);
      loose.delete(gid);
    }
    for (const g of changed) {
      const scratch = doc.createElementNS(SVG_NS, "g");
      scratch.innerHTML = renderLayers(source.options(), [g.layer]).svg;
      const made = scratch.querySelector("g.ky-layers > g.ky-layer");
      if (made === null) return false;
      const old = holderOf(g);
      if (old !== null) old.replaceWith(made);
      else {
        // Among the others in the order they are drawn: before the first later group that is there.
        let before: Element | null = null;
        for (let j = groups.indexOf(g) + 1; j < groups.length && before === null; j += 1) before = holderOf(groups[j]);
        if (before === null) container.append(made);
        else before.before(made);
      }
      shown.set(g.id, g.keys.join(","));
      bindGroup(g, placed);
    }
    container.setAttribute("data-layers", String(container.querySelectorAll(":scope > g.ky-layer").length));
    return true;
  };
  const move = (groups: readonly ReplayGroup[], placed: Map<string, P>): void => {
    for (const g of groups) {
      const b = bound.get(g.id);
      if (b === undefined) continue;
      const at = positions(g, placed);
      if (g.kind === "lines") {
        (at as P[][]).forEach((path, i) => {
          const d = pathOf(path);
          if (b.last[i] !== d) {
            b.elements[i].setAttribute("d", d);
            b.last[i] = d;
          }
        });
      } else {
        (at as P[]).forEach(([x, y], i) => {
          const value = `translate(${num(x - b.base[i][0])} ${num(y - b.base[i][1])})${b.own[i] === null ? "" : ` ${b.own[i]}`}`;
          if (b.last[i] !== value) {
            b.elements[i].setAttribute("transform", value);
            b.last[i] = value;
          }
        });
      }
    }
  };
  const bind = (t: number): void => {
    placer = replayPlacer(source.options(), timeline);
    const { groups, placed } = groupsAt(t);
    shown = new Map(groups.map((g) => [g.id, g.keys.join(",")]));
    bound = new Map();
    loose.clear();
    painted = t;
    for (const g of groups) bindGroup(g, placed);
  };
  return {
    bind,
    paint(t) {
      if (source.svg() === null || t === painted) return;
      painted = t;
      const { groups, placed } = groupsAt(t);
      const changed = groups.filter((g) => loose.has(g.id) || shown.get(g.id) !== g.keys.join(","));
      const gone = [...shown.keys()].filter((gid) => !groups.some((g) => g.id === gid));
      if (changed.length > 0 || gone.length > 0) {
        if (!patch(groups, changed, gone, placed)) {
          source.redraw(t);
          bind(t);
          return;
        }
      }
      move(groups, placed);
    },
  };
}

/** What a driver is given: how to paint a time, where its keys are heard, and what it labels. */
export interface DriverSource {
  /** Move the drawing to a time. Called on every change of the clock, with the change (what moved it, and the state after). */
  paint(t: number, change?: ReplayChange): void;
  language: Language;
  /** The element whose keys play, step and seek (its descendants too): the stage and the bar in a flat replay, the bar alone over a 3D view. */
  keysOn: HTMLElement;
  /** The element that says what the replay is doing (`data-state`, `data-motion`). */
  holder: HTMLElement;
  /** The element that names the replay and points at its key help (the flat drawing's stage), if any. */
  labelled?: HTMLElement;
  /** The element whose being in sight lets the clock run: no frame is asked for while it is scrolled out of sight. */
  seen?: Element;
  /** The key help: `keys` and `keysStep` by default, `keysTurn` and `keysTurnStep` over a 3D view. */
  help?: "flat" | "turn";
  /** Where frames are asked for: the page's `requestAnimationFrame` by default; a 3D view lends its own, so that a turning view and its replay share one frame. */
  frames?: { request(callback: FrameRequestCallback): number; cancel(id: number): void };
}

/** The page's side of a replay without its drawing: the clock on animation frames, the controls, the keys, the live region, a hidden page and reduced motion. */
export interface ReplayDriver {
  controller: ReplayController;
  /** The style, the key help, the bar and the live region, in that order, for the caller to put in the page. */
  parts: { style: HTMLStyleElement; hint: HTMLElement; bar: HTMLElement; live: HTMLElement; slots: ReplayBarSlots };
  /** The words changed: the controls are made again. */
  setLanguage(language: Language): void;
  /** The play, pause or step the keys of a 3D view's stage ask for, by the names of the keys: the same moves as the bar's keys. */
  key(event: KeyboardEvent, scope: "stage" | "bar"): boolean;
  destroy(): void;
}

/** Make the clock, the controls and the keys of a replay. Nothing runs until the reader (or `autoplay`) plays it, and nothing runs while it is paused, hidden or out of sight. */
export function replayDriver(doc: Document, timeline: ReplayTimeline, settings: ReplaySettings, source: DriverSource): ReplayDriver {
  const info = replayInfo(timeline);
  const media = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  const motionNow = (): "smooth" | "step" => (settings.motion === "smooth" ? "smooth" : settings.motion === "step" ? "step" : media?.matches === true ? "step" : "smooth");
  const controller = createReplay(timeline, { ...settings, motion: motionNow() });
  const id = `ky-rd${++counter}`;
  let language = source.language;
  const words = (): (typeof KYOGIJO_STRINGS)["en"]["replay"] => KYOGIJO_STRINGS[language].replay;

  const style = doc.createElement("style");
  style.textContent = REPLAY_STYLE + FOLLOW_STYLE;
  const hint = doc.createElement("p");
  hint.className = "ky-hint";
  hint.id = `${id}-keys`;
  const live = doc.createElement("div");
  live.className = "ky-live";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");

  // The bar is the package's one replay bar (replay.bar.ts), the same as a race's: this says what its buttons do to this replay's clock.
  const barWords = (): ReplayBarWords => {
    const w = words();
    const stepMode = controller.state().motion === "step";
    return { group: w.group, play: w.play, pause: w.pause, start: w.start, back: stepMode ? w.stepBack : w.back, forward: stepMode ? w.stepForward : w.forward, speed: w.speed, loop: w.loop, position: w.position };
  };
  const barBox = createReplayBar({
    doc,
    speeds: REPLAY_SPEEDS,
    speedName: (n) => `${words().speed} ${fill(words().speedValue, { speed: n })}`,
    words: barWords,
    state: () => controller.state(),
    range: () => ({ max: info.duration, step: String(controller.state().motion === "step" ? (settings.stepSeconds ?? 1) : info.step > 0 ? Math.round(info.step * 1e6) / 1e6 : "any") }),
    readout: () => {
      const s = controller.state();
      const w = words();
      return {
        value: s.t - info.start,
        main: `${replayClock(s.t - info.start)} / ${replayClock(info.duration)}`,
        line: "",
        spoken: fill(w.positionValue, { t: replaySpoken(s.t - info.start, w), total: replaySpoken(info.duration, w) }),
      };
    },
    seek: (value) => controller.seek(info.start + value),
    toggle: () => controller.toggle(),
    start: () => controller.seek(info.start),
    step: (direction) => controller.step(direction),
    setSpeed: (speed) => controller.setSpeed(speed),
    setLoop: (loop) => controller.setLoop(loop),
  });
  const bar = barBox.el;
  if (settings.controls === false) bar.hidden = true;

  let sync: (change: ReplayChange | undefined) => void = () => {};
  let follow: FollowControls;
  const buildBar = (): void => {
    const w = words();
    const stepMode = controller.state().motion === "step";
    barBox.build();
    // The follow camera's buttons go in the bar's follow slot (the bar's own buttons are the one bar's: replay.bar.ts).
    follow = followControls(doc, w, controller, timeline);
    barBox.slots.follow.replaceChildren(...follow.parts);
    hint.textContent = source.help === "turn" ? (stepMode ? w.keysTurnStep : w.keysTurn) : stepMode ? w.keysStep : w.keys;
    if (source.labelled !== undefined) {
      source.labelled.setAttribute("aria-label", w.region);
      source.labelled.setAttribute("aria-describedby", hint.id);
      source.labelled.setAttribute("aria-keyshortcuts", "Space ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End");
    }
    sync = () => {
      const s = controller.state();
      barBox.sync();
      source.holder.dataset.state = s.ended ? "ended" : s.playing ? "playing" : "paused";
      source.holder.dataset.motion = s.motion;
      follow.sync(s);
    };
    sync(undefined);
  };

  // ---- The clock on the page: animation frames while playing and in sight, and the events said aloud. ----
  let raf = 0;
  let last = 0;
  let onScreen = true;
  const request = source.frames?.request ?? ((callback: FrameRequestCallback): number => requestAnimationFrame(callback));
  const cancel = source.frames?.cancel ?? ((id: number): void => cancelAnimationFrame(id));
  const want = (): void => {
    if (raf !== 0 || !onScreen || !controller.state().playing) return;
    last = performance.now();
    raf = request(frame);
  };
  function frame(now: number): void {
    raf = 0;
    if (!controller.state().playing || !onScreen) return;
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    controller.advance(dt);
    if (controller.state().playing && raf === 0 && onScreen) raf = request(frame);
  }
  const stop = controller.subscribe((change) => {
    sync(change);
    source.paint(change.state.t, change);
    if (settings.announce !== false && change.crossed.length > 0 && (change.reason === "tick" || change.reason === "step")) {
      live.textContent = change.crossed.map((e) => describeEvent(e, language, info.start)).join(". ");
    }
    if (change.reason === "play") want();
    if (!change.state.playing && raf !== 0) {
      cancel(raf);
      raf = 0;
    }
  });
  // Scrolled out of sight, the clock holds (no frame is asked for) and goes on when it is back.
  let seen: IntersectionObserver | undefined;
  if (source.seen !== undefined && typeof IntersectionObserver === "function") {
    seen = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1]?.isIntersecting !== false;
      if (onScreen) want();
      else if (raf !== 0) {
        cancel(raf);
        raf = 0;
      }
    });
    seen.observe(source.seen);
  }

  const act = (event: KeyboardEvent, scope: "stage" | "bar"): boolean =>
    replayKey(event, scope, {
      toggle: () => controller.toggle(),
      step: (direction) => controller.step(direction),
      jump: (direction) => controller.jump(direction * 5),
      start: () => controller.seek(info.start),
      end: () => controller.seek(info.end),
    });
  const keys = (event: KeyboardEvent): void => void act(event, "bar");
  source.keysOn.addEventListener("keydown", keys);
  // A page that is hidden does no work: the clock stops, and the reader starts it again.
  const hidden = (): void => {
    if (doc.visibilityState === "hidden") controller.pause();
  };
  doc.addEventListener("visibilitychange", hidden);
  const motion = (): void => {
    controller.setMotion(motionNow());
    buildBar();
  };
  if (settings.motion === undefined || settings.motion === "auto") {
    if (typeof media?.addEventListener === "function") media.addEventListener("change", motion);
    else if (typeof media?.addListener === "function") media.addListener(motion);
  }
  buildBar();

  return {
    controller,
    parts: { style, hint, bar, live, slots: barBox.slots },
    setLanguage(next) {
      if (next === language) return;
      language = next;
      buildBar();
    },
    key: act,
    destroy() {
      stop();
      if (raf !== 0) cancel(raf);
      raf = 0;
      seen?.disconnect();
      source.keysOn.removeEventListener("keydown", keys);
      doc.removeEventListener("visibilitychange", hidden);
      if (typeof media?.removeEventListener === "function") media.removeEventListener("change", motion);
      else if (typeof media?.removeListener === "function") media.removeListener(motion);
      controller.pause();
    },
  };
}

/**
 * Attach a replay to a container: the stage with the drawing, the controls under it, the keyboard and the live region. The drawing is written once
 * and then only the marks that move are moved, on `requestAnimationFrame`; a mark that comes or goes (an object that enters, an event that
 * begins) redraws the replay's own layers, never the surface. With `prefers-reduced-motion` nothing plays by itself and play steps instead.
 */
export function createReplayView(host: HTMLElement, timeline: ReplayTimeline, settings: ReplaySettings, initial: SurfaceOptions | ScoreOptions): ReplayView {
  const doc = host.ownerDocument;
  const id = initial.id ?? `ky-r${++counter}`;
  let options: SurfaceOptions | ScoreOptions = { ...initial, id };
  let language: Language = options.language === "ja" ? "ja" : "en";

  const root = doc.createElement("div");
  root.className = "ky-replay";
  const stage = doc.createElement("div");
  stage.className = "ky-stage";
  stage.tabIndex = 0;
  stage.setAttribute("role", "group");
  let svg: SVGSVGElement | null = null;
  const painter = replayPainter({
    doc,
    timeline,
    look: settings,
    svg: () => svg,
    options: () => options,
    language: () => language,
    redraw: (t) => drawStage(t),
  });
  function drawStage(t: number): void {
    stage.innerHTML = drawFrame(options, timeline, t, settings);
    svg = stage.querySelector<SVGSVGElement>("svg.kyogijo");
    // (A drawing written again is shown at the camera's shot.)
    camera.again();
  }
  const camera = flatFollow({ svg: () => svg, options: () => options, timeline, look: settings, now: () => performance.now() });
  const driver = replayDriver(doc, timeline, settings, {
    paint: (t, change) => {
      painter.paint(t);
      if (change !== undefined) camera.paint(change);
    },
    language,
    keysOn: root,
    holder: root,
    labelled: stage,
  });
  const { style, hint, bar, live } = driver.parts;
  root.append(style, stage, hint, bar, live);
  host.replaceChildren(root);

  drawStage(driver.controller.state().t);
  painter.bind(driver.controller.state().t);
  camera.paint({ state: driver.controller.state(), reason: "follow", crossed: [] });
  if (settings.autoplay === true && driver.controller.state().motion === "smooth" && doc.visibilityState !== "hidden") driver.controller.play();

  return {
    controller: driver.controller,
    stage,
    draw(next) {
      options = { ...next, id };
      language = options.language === "ja" ? "ja" : "en";
      // The controls are made again only when the words change: a reader's focus on one of them stays where it is when a score moves.
      driver.setLanguage(language);
      const t = driver.controller.state().t;
      drawStage(t);
      painter.bind(t);
    },
    destroy() {
      driver.destroy();
      host.replaceChildren();
    },
  };
}
