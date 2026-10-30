// The page's side of a replay: the controls under the drawing, the keyboard, the live region, and the painting of each frame by moving the
// marks that move and nothing else. The clock (replay.control.ts) and the frame (replay.ts) have no DOM; this file is the one that does. It is
// used by `mountKyogijo` (the `replay` method of a mount) and so by `<kyogijo-field>`.
import { num } from "./format.ts";
import { renderLayers } from "./layers.ts";
import { REPLAY_SPEEDS, createReplay, type ReplayController } from "./replay.control.ts";
import { describeEvent, drawFrame, replayClock, replayGroups, replaySpoken, replayInfo, replayPlacer, replaySnapshot, type ReplayGroup } from "./replay.ts";
import type { ReplayChange, ReplaySettings, ReplayTimeline } from "./replay.types.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.core.ts";
import type { Language, ScoreOptions, SurfaceOptions } from "./types.ts";

type P = [number, number];

const SVG_NS = "http://www.w3.org/2000/svg";
let counter = 0;

/** The controls' stylesheet: written once beside the controls, scoped to them, in the page's own colours. */
export const REPLAY_STYLE = `
.ky-replay{position:relative;display:block;color:inherit}
.ky-replay .ky-stage:focus-visible,.ky-replay .ky-controls button:focus-visible,.ky-replay .ky-controls select:focus-visible,.ky-replay .ky-controls input:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.ky-replay .ky-controls{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin-top:.5rem;font:inherit}
.ky-replay .ky-controls[hidden]{display:none}
.ky-replay .ky-controls button,.ky-replay .ky-controls select{box-sizing:border-box;min-width:44px;min-height:44px;margin:0;padding:0 .6rem;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.ky-replay .ky-controls button[hidden],.ky-replay .ky-controls select[hidden]{display:none}
.ky-replay .ky-controls button[aria-pressed=true]{background:color-mix(in srgb,currentColor 22%,transparent)}
.ky-replay .ky-controls svg{width:22px;height:22px;fill:currentColor;pointer-events:none}
.ky-replay .ky-controls .ky-loop svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ky-replay .ky-controls input[type=range]{flex:1 1 140px;min-width:120px;min-height:44px;margin:0;accent-color:currentColor}
.ky-replay .ky-controls output{min-width:6.5ch;font-variant-numeric:tabular-nums;text-align:end}
.ky-replay .ky-live,.ky-replay .ky-hint{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
`.trim();

const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  back: "M6 5h2v14H6zM9.5 12L19 5v14z",
  forward: "M16 5h2v14h-2zM14.5 12L5 5v14z",
  loop: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
};

const icon = (d: string): string => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

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

/**
 * Attach a replay to a container: the stage with the drawing, the controls under it, the keyboard and the live region. The drawing is written once
 * and then only the marks that move are moved, on `requestAnimationFrame`; a mark that comes or goes (an object that enters, an event that
 * begins) redraws the replay's own layers, never the surface. With `prefers-reduced-motion` nothing plays by itself and play steps instead.
 */
export function createReplayView(host: HTMLElement, timeline: ReplayTimeline, settings: ReplaySettings, initial: SurfaceOptions | ScoreOptions): ReplayView {
  const doc = host.ownerDocument;
  const info = replayInfo(timeline);
  const media = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  const motionNow = (): "smooth" | "step" => (settings.motion === "smooth" ? "smooth" : settings.motion === "step" ? "step" : media?.matches === true ? "step" : "smooth");
  const controller = createReplay(timeline, { ...settings, motion: motionNow() });
  const id = initial.id ?? `ky-r${++counter}`;
  let options: SurfaceOptions | ScoreOptions = { ...initial, id };
  let language: Language = options.language === "ja" ? "ja" : "en";
  const words = (): (typeof KYOGIJO_STRINGS)["en"]["replay"] => KYOGIJO_STRINGS[language].replay;

  const root = doc.createElement("div");
  root.className = "ky-replay";
  const style = doc.createElement("style");
  style.textContent = REPLAY_STYLE;
  const stage = doc.createElement("div");
  stage.className = "ky-stage";
  stage.tabIndex = 0;
  stage.setAttribute("role", "group");
  const hint = doc.createElement("p");
  hint.className = "ky-hint";
  hint.id = `${id}-keys`;
  const bar = doc.createElement("div");
  bar.className = "ky-controls";
  bar.setAttribute("role", "group");
  const live = doc.createElement("div");
  live.className = "ky-live";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  root.append(style, stage, hint, bar, live);
  host.replaceChildren(root);

  // ---- The painter. ----
  let svg: SVGSVGElement | null = null;
  let placer = replayPlacer(options, timeline);
  /** For each group of the replay in the drawing, the marks it holds (their keys): a group whose keys changed is drawn again, the others only move. */
  let shown = new Map<string, string>();
  let bound = new Map<string, Bound>();
  /** The groups whose marks cannot be matched to elements one for one, so that they are drawn again each time. */
  const loose = new Set<string>();
  let painted = Number.NaN;
  const look = settings;

  const groupsAt = (t: number): { groups: ReplayGroup[]; placed: Map<string, P> } => {
    const snap = replaySnapshot(timeline, t, look);
    const groups = replayGroups(timeline, snap, look, language);
    const places = placer(snap.objects.map((o): P => [o.x, o.y]));
    return { groups, placed: new Map(snap.objects.map((o, i) => [o.id, places[i]])) };
  };
  const positions = (g: ReplayGroup, placed: Map<string, P>): P[] | P[][] => (g.kind === "lines" ? g.coords.map((path) => placer(path as P[])) : g.keys.map((k) => placed.get(k) ?? [0, 0]));
  const holderOf = (g: ReplayGroup | string): Element | null => svg?.querySelector(`[id="${id}-${typeof g === "string" ? g : g.id}"]`) ?? null;
  /** Match the elements of a group that was just drawn to its marks, remembering where they are. */
  const bind = (g: ReplayGroup, placed: Map<string, P>): void => {
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
    const container = svg?.querySelector("g.ky-layers") ?? null;
    if (svg === null || container === null) return false;
    for (const gid of gone) {
      holderOf(gid)?.remove();
      shown.delete(gid);
      bound.delete(gid);
      loose.delete(gid);
    }
    for (const g of changed) {
      const scratch = doc.createElementNS(SVG_NS, "g");
      scratch.innerHTML = renderLayers(options, [g.layer]).svg;
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
      bind(g, placed);
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
  const paint = (t: number): void => {
    if (svg === null || t === painted) return;
    painted = t;
    const { groups, placed } = groupsAt(t);
    const changed = groups.filter((g) => loose.has(g.id) || shown.get(g.id) !== g.keys.join(","));
    const gone = [...shown.keys()].filter((gid) => !groups.some((g) => g.id === gid));
    if (changed.length > 0 || gone.length > 0) {
      if (!patch(groups, changed, gone, placed)) {
        drawStage(t);
        return;
      }
    }
    move(groups, placed);
  };
  function drawStage(t: number): void {
    stage.innerHTML = drawFrame(options, timeline, t, look);
    svg = stage.querySelector<SVGSVGElement>("svg.kyogijo");
    placer = replayPlacer(options, timeline);
    const { groups, placed } = groupsAt(t);
    shown = new Map(groups.map((g) => [g.id, g.keys.join(",")]));
    bound = new Map();
    loose.clear();
    painted = t;
    for (const g of groups) bind(g, placed);
  }

  // ---- The controls. ----
  let sync: (change: ReplayChange | undefined) => void = () => {};
  const buildBar = (): void => {
    const w = words();
    const state = controller.state();
    const stepMode = state.motion === "step";
    const button = (cls: string, label: string, d: string, onClick: () => void): HTMLButtonElement => {
      const b = doc.createElement("button");
      b.type = "button";
      b.className = cls;
      b.setAttribute("aria-label", label);
      b.title = label;
      b.innerHTML = icon(d);
      b.addEventListener("click", onClick);
      return b;
    };
    bar.setAttribute("aria-label", w.group);
    bar.replaceChildren();
    const back = button("ky-back", stepMode ? w.stepBack : w.back, ICONS.back, () => controller.step(-1));
    const play = button("ky-play", w.play, ICONS.play, () => controller.toggle());
    const forward = button("ky-forward", stepMode ? w.stepForward : w.forward, ICONS.forward, () => controller.step(1));
    const speed = doc.createElement("select");
    speed.className = "ky-speed";
    speed.setAttribute("aria-label", w.speed);
    speed.title = w.speed;
    for (const value of REPLAY_SPEEDS) {
      const option = doc.createElement("option");
      option.value = String(value);
      option.textContent = `${value}×`;
      speed.append(option);
    }
    speed.addEventListener("change", () => controller.setSpeed(Number(speed.value)));
    const loop = button("ky-loop", w.loop, ICONS.loop, () => controller.setLoop(!controller.state().loop));
    const range = doc.createElement("input");
    range.type = "range";
    range.className = "ky-position";
    range.min = "0";
    range.max = String(info.duration);
    range.step = String(stepMode ? (settings.stepSeconds ?? 1) : info.step > 0 ? Math.round(info.step * 1e6) / 1e6 : "any");
    range.disabled = info.duration === 0;
    range.setAttribute("aria-label", w.position);
    range.addEventListener("input", () => controller.seek(info.start + Number(range.value)));
    const clock = doc.createElement("output");
    clock.className = "ky-clock";
    clock.setAttribute("aria-hidden", "true");
    // Nothing plays by itself in step mode: its controls are the steps and the position.
    play.hidden = stepMode;
    speed.hidden = stepMode;
    loop.hidden = stepMode;
    bar.append(back, play, forward, speed, loop, range, clock);
    hint.textContent = stepMode ? w.keysStep : w.keys;
    stage.setAttribute("aria-label", w.region);
    stage.setAttribute("aria-describedby", hint.id);
    stage.setAttribute("aria-keyshortcuts", "Space ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End");
    let shown = "";
    sync = () => {
      const s = controller.state();
      const total = replayClock(info.duration);
      const text = `${replayClock(s.t - info.start)} / ${total}`;
      if (text !== shown) {
        shown = text;
        clock.textContent = text;
        range.setAttribute("aria-valuetext", fill(w.positionValue, { t: replaySpoken(s.t - info.start, w), total: replaySpoken(info.duration, w) }));
      }
      const at = String(s.t - info.start);
      if (range.value !== at) range.value = at;
      const label = s.playing ? w.pause : w.play;
      if (play.getAttribute("aria-label") !== label) {
        play.setAttribute("aria-label", label);
        play.title = label;
        play.innerHTML = icon(s.playing ? ICONS.pause : ICONS.play);
      }
      if (speed.value !== String(s.speed)) speed.value = String(s.speed);
      loop.setAttribute("aria-pressed", String(s.loop));
      root.dataset.state = s.ended ? "ended" : s.playing ? "playing" : "paused";
      root.dataset.motion = s.motion;
    };
    sync(undefined);
  };
  if (settings.controls === false) bar.hidden = true;

  // ---- The clock on the page: animation frames while playing, and the events said aloud. ----
  let raf = 0;
  let last = 0;
  const frame = (now: number): void => {
    raf = 0;
    if (!controller.state().playing) return;
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    controller.advance(dt);
    if (controller.state().playing && raf === 0) raf = requestAnimationFrame(frame);
  };
  const stop = controller.subscribe((change) => {
    sync(change);
    paint(change.state.t);
    if (settings.announce !== false && change.crossed.length > 0 && (change.reason === "tick" || change.reason === "step")) {
      live.textContent = change.crossed.map((e) => describeEvent(e, language, info.start)).join(". ");
    }
    if (change.reason === "play" && raf === 0) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    if (!change.state.playing && raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });

  const keys = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const tag = (event.target as HTMLElement | null)?.tagName ?? "";
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    switch (event.key) {
      case " ":
      case "Spacebar":
        // A button takes the space itself.
        if (tag === "BUTTON") return;
        controller.toggle();
        break;
      case "ArrowRight":
        if (event.shiftKey) controller.jump(5);
        else controller.step(1);
        break;
      case "ArrowLeft":
        if (event.shiftKey) controller.jump(-5);
        else controller.step(-1);
        break;
      case "Home":
        controller.seek(info.start);
        break;
      case "End":
        controller.seek(info.end);
        break;
      default:
        return;
    }
    event.preventDefault();
  };
  root.addEventListener("keydown", keys);
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
  drawStage(controller.state().t);
  if (settings.autoplay === true && controller.state().motion === "smooth" && doc.visibilityState !== "hidden") controller.play();

  return {
    controller,
    stage,
    draw(next) {
      const before = language;
      options = { ...next, id };
      language = options.language === "ja" ? "ja" : "en";
      // The controls are made again only when the words change: a reader's focus on one of them stays where it is when a score moves.
      if (language !== before) buildBar();
      drawStage(controller.state().t);
    },
    destroy() {
      stop();
      if (raf !== 0) cancelAnimationFrame(raf);
      doc.removeEventListener("visibilitychange", hidden);
      if (typeof media?.removeEventListener === "function") media.removeEventListener("change", motion);
      else if (typeof media?.removeListener === "function") media.removeListener(motion);
      controller.pause();
      host.replaceChildren();
    },
  };
}
