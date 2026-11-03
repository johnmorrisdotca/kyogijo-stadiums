// Following the play: where the camera looks while a replay plays, as arithmetic on numbers. `followShot` is the shot the play asks for at a moment (the skaters near the puck, padded, or the
// puck itself, or the faceoff dot in a stoppage); `followCamera` eases toward it with a critically damped spring, a dead zone and a leash that keeps the puck in the frame; `followRunner` is
// what a page's replay calls on each change of its clock. Nothing here reads the page or a clock: the caller says how many seconds went by, and a test does it with numbers.
import { replayEvents } from "./replay.events.ts";
import type { ReplayChange, ReplayObject, ReplayTimeline } from "./replay.types.ts";

/** What the camera follows: nothing (the whole surface), the action (the players near the puck or ball, and it), or the puck or ball alone. */
export type FollowMode = "off" | "action" | "puck";

/** The modes, in the order the controls list them after "off". */
export const FOLLOW_MODES: readonly FollowMode[] = ["off", "action", "puck"];

/** A mode from anything: `action` and `puck` are themselves, everything else is `off`. */
export const followMode = (value: unknown): FollowMode => (value === "action" || value === "puck" ? value : "off");

/** A rectangle in the drawing's own feet. */
export interface FollowBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where the camera looks: the middle of the frame, in the drawing's feet, and how much it magnifies the surface (1 is the whole of it: the frame is the surface's size over `zoom`). */
export interface FollowShot {
  x: number;
  y: number;
  zoom: number;
}

/** How the camera frames and moves. Shares are of the surface's length (its longer side). */
export interface FollowLimits {
  /** The closest the camera comes: the frame is never smaller than the surface over this. */
  maxZoom: number;
  /** The zoom of `puck`. */
  puckZoom: number;
  /** How many of the players nearest the puck the action is framed round. */
  near: number;
  /** The room left round the action, a share of the surface's length on each side. */
  pad: number;
  /** A move of the shot smaller than this share of the frame does not move the camera, and a zoom that changes by less than this share does not zoom it. */
  dead: number;
  /** How quickly the spring follows, in radians a second: about 4.7 over this many seconds settles it. */
  omega: number;
  /** The room kept between the puck and the edge of the frame, a share of the frame. */
  leash: number;
}

/** The camera's limits by default: no closer than two and a half times, the puck followed at twice, the five nearest players, settling in about a second and a half. */
export const FOLLOW_LIMITS: Readonly<FollowLimits> = { maxZoom: 2.5, puckZoom: 2, near: 5, pad: 0.06, dead: 0.08, omega: 3.2, leash: 0.06 };

/** What the shot is worked out from at a moment: the objects in the drawing's feet, the surface, and the faceoff dot when the play is stopped. */
export interface FollowInput {
  objects: readonly Pick<ReplayObject, "team" | "x" | "y">[];
  box: FollowBox;
  /** The faceoff dot while the play is stopped (see `followStop`): the camera goes there. */
  stop?: readonly [number, number];
}

const clamp = (value: number, least: number, most: number): number => Math.min(most, Math.max(least, value));
const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** The whole surface: the shot of `off`. */
export const wholeShot = (box: FollowBox): FollowShot => ({ x: box.x + box.w / 2, y: box.y + box.h / 2, zoom: 1 });

/** A shot held to the limits: its zoom from 1 to `maxZoom`, and its frame on the surface (the middle moved in until no side of the frame is off it). */
export function clampShot(shot: FollowShot, box: FollowBox, maxZoom = FOLLOW_LIMITS.maxZoom): FollowShot {
  const zoom = clamp(isNum(shot.zoom) ? shot.zoom : 1, 1, Math.max(1, maxZoom));
  const [hw, hh] = [box.w / zoom / 2, box.h / zoom / 2];
  const middle = wholeShot(box);
  return { x: clamp(isNum(shot.x) ? shot.x : middle.x, box.x + hw, box.x + box.w - hw), y: clamp(isNum(shot.y) ? shot.y : middle.y, box.y + hh, box.y + box.h - hh), zoom };
}

/** The frame a shot shows: the surface's size over the zoom, round the middle. */
export const frameOf = (shot: FollowShot, box: FollowBox): FollowBox => ({ x: shot.x - box.w / shot.zoom / 2, y: shot.y - box.h / shot.zoom / 2, w: box.w / shot.zoom, h: box.h / shot.zoom });

const onSurface = (p: readonly [number, number], box: FollowBox): [number, number] => [clamp(p[0], box.x, box.x + box.w), clamp(p[1], box.y, box.y + box.h)];

/** The puck or the ball, on the surface, or `undefined` when there is none. */
function puckOf(input: FollowInput): [number, number] | undefined {
  const puck = input.objects.find((o) => (o.team === "puck" || o.team === "ball") && isNum(o.x) && isNum(o.y));
  return puck === undefined ? undefined : onSurface([puck.x, puck.y], input.box);
}

/**
 * The shot the play asks for at a moment. `action` frames the puck (or the ball) and the `near` players nearest it, with `pad` round them, never closer than `maxZoom`: when they bunch at one end
 * it closes in, and when they spread it pulls back. `puck` puts the puck in the middle at `puckZoom`. A stopped play (`stop`) frames the faceoff dot as closely as the limits allow. The frame is
 * always on the surface and always holds the puck. Without a puck the action is the players' middle; with nothing at all it is the whole surface.
 * @example
 * ```ts
 * import { followShot } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const box = { x: 0, y: 0, w: 200, h: 85 };
 * const objects = [{ team: "puck" as const, x: 170, y: 40 }, { team: "home" as const, x: 165, y: 30 }, { team: "away" as const, x: 175, y: 50 }];
 * const action = followShot("action", { objects, box });
 * console.log(Math.round(action.x), action.y, Math.round(action.zoom * 100) / 100);
 * console.log(followShot("puck", { objects, box }));
 * // 148 40 1.93
 * // { x: 150, y: 40, zoom: 2 }
 * ```
 */
export function followShot(mode: FollowMode, input: FollowInput, limits: Partial<FollowLimits> = {}): FollowShot {
  const { box } = input;
  const at = { ...FOLLOW_LIMITS, ...limits };
  if (mode === "off" || !(box.w > 0 && box.h > 0)) return wholeShot(box);
  if (input.stop !== undefined) {
    const [x, y] = onSurface(input.stop, box);
    return clampShot({ x, y, zoom: Math.min(at.maxZoom, mode === "puck" ? at.puckZoom : at.maxZoom) }, box, at.maxZoom);
  }
  const puck = puckOf(input);
  const players = input.objects.filter((o) => (o.team === "home" || o.team === "away") && isNum(o.x) && isNum(o.y)).map((o) => onSurface([o.x, o.y], box));
  if (mode === "puck") return puck === undefined ? followShot("action", input, limits) : clampShot({ x: puck[0], y: puck[1], zoom: at.puckZoom }, box, at.maxZoom);
  if (puck === undefined && players.length === 0) return wholeShot(box);
  const anchor = puck ?? [players.reduce((s, p) => s + p[0], 0) / players.length, players.reduce((s, p) => s + p[1], 0) / players.length];
  const nearest = [...players].sort((a, b) => Math.hypot(a[0] - anchor[0], a[1] - anchor[1]) - Math.hypot(b[0] - anchor[0], b[1] - anchor[1])).slice(0, Math.max(0, Math.round(at.near)));
  const held = [anchor, ...nearest];
  const xs = held.map((p) => p[0]);
  const ys = held.map((p) => p[1]);
  const pad = Math.max(box.w, box.h) * at.pad;
  const [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
  const zoom = Math.min(box.w / (x1 - x0), box.h / (y1 - y0), at.maxZoom);
  return clampShot({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, zoom }, box, at.maxZoom);
}

/**
 * One step of a critically damped spring toward `goal`: where it is and how fast it goes after `dt` seconds. It never overshoots and never rings, and a long step lands nearer, never past.
 * @example
 * ```ts
 * import { springStep } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * let [x, v] = [0, 0];
 * for (let i = 0; i < 60; i += 1) [x, v] = springStep(x, v, 10, 1 / 60, 4);
 * console.log(Math.round(x * 100) / 100, x < 10);
 * // 9.08 true
 * ```
 */
export function springStep(at: number, speed: number, goal: number, dt: number, omega: number): [number, number] {
  if (!(dt > 0)) return [at, speed];
  const off = at - goal;
  const pull = speed + omega * off;
  const fade = Math.exp(-omega * dt);
  return [goal + (off + pull * dt) * fade, (speed - omega * pull * dt) * fade];
}

/** What `followCamera` gives back. */
export interface FollowCamera {
  /** Move toward the shot the play asks for: by `dt` seconds of the spring, or at once (`dt` undefined). Gives where it is now. */
  update(mode: FollowMode, input: FollowInput, dt?: number): FollowShot;
  /** Where it is now. */
  shot(): FollowShot | undefined;
  /** Whether it is at rest on the whole surface: `off`, and nothing left to ease back. */
  resting(): boolean;
  /** Forget where it was: the next update starts from the whole surface. */
  reset(): void;
}

/**
 * The camera that follows the play: it eases toward `followShot` with a critically damped spring on the middle and on the zoom (the zoom eased as its logarithm, so a zoom in and a zoom out
 * take the same time), holds still while the shot moves less than a dead zone, and is kept on the surface, never closer than the limit, with the puck inside the frame. When the play is still
 * it comes to rest and stays exactly there.
 * @example
 * ```ts
 * import { followCamera } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const camera = followCamera();
 * const input = { box: { x: 0, y: 0, w: 200, h: 85 }, objects: [{ team: "puck" as const, x: 180, y: 40 }] };
 * const first = camera.update("puck", input, 1 / 60);
 * let shot = first;
 * for (let i = 0; i < 600; i += 1) shot = camera.update("puck", input, 1 / 60);
 * console.log(first.zoom < 1.01, shot);
 * // true { x: 150, y: 40, zoom: 2 }
 * ```
 */
export function followCamera(limits: Partial<FollowLimits> = {}): FollowCamera {
  const at = { ...FOLLOW_LIMITS, ...limits };
  let now: FollowShot | undefined;
  let goal: FollowShot | undefined;
  let speed = [0, 0, 0];
  const settle = (shot: FollowShot): void => {
    now = shot;
    goal = shot;
    speed = [0, 0, 0];
  };
  return {
    update(mode, input, dt) {
      const { box } = input;
      const asked = followShot(mode, input, at);
      const from = now ?? wholeShot(box);
      // The dead zone: a shot that moved little from the one the camera is going to is not a new goal.
      if (goal === undefined || mode === "off" || dt === undefined) goal = asked;
      else {
        const frame = frameOf(goal, box);
        const moved = Math.abs(asked.x - goal.x) > frame.w * at.dead || Math.abs(asked.y - goal.y) > frame.h * at.dead;
        const zoomed = Math.abs(Math.log(asked.zoom / goal.zoom)) > Math.log(1 + at.dead);
        goal = { x: moved ? asked.x : goal.x, y: moved ? asked.y : goal.y, zoom: zoomed ? asked.zoom : goal.zoom };
      }
      if (dt === undefined) {
        settle(goal);
        return { ...goal };
      }
      const [x, vx] = springStep(from.x, speed[0], goal.x, dt, at.omega);
      const [y, vy] = springStep(from.y, speed[1], goal.y, dt, at.omega);
      const [z, vz] = springStep(Math.log(from.zoom), speed[2], Math.log(goal.zoom), dt, at.omega);
      speed = [vx, vy, vz];
      let next = clampShot({ x, y, zoom: Math.exp(z) }, box, at.maxZoom);
      // The leash: a puck that runs ahead of the easing carries the frame with it, so that it never leaves it; the frame moves as the puck does, never by a jump.
      const puck = mode === "off" ? undefined : puckOf(input);
      if (puck !== undefined) {
        const frame = frameOf(next, box);
        const [mx, my] = [Math.min(frame.w * at.leash, frame.w / 2), Math.min(frame.h * at.leash, frame.h / 2)];
        const pull = (p: number, middle: number, half: number, margin: number): number => (p > middle + half - margin ? p - half + margin : p < middle - half + margin ? p + half - margin : middle);
        next = clampShot({ x: pull(puck[0], next.x, frame.w / 2, mx), y: pull(puck[1], next.y, frame.h / 2, my), zoom: next.zoom }, box, at.maxZoom);
      }
      // At rest: close enough to the goal and slow enough is the goal itself, so that a still play writes nothing more.
      const near = Math.abs(next.x - goal.x) + Math.abs(next.y - goal.y) < Math.max(box.w, box.h) * 1e-4 && Math.abs(Math.log(next.zoom / goal.zoom)) < 1e-4;
      if (near && Math.abs(speed[0]) + Math.abs(speed[1]) < Math.max(box.w, box.h) * 1e-3 && Math.abs(speed[2]) < 1e-3) settle(goal);
      else now = next;
      return { ...now! };
    },
    shot: () => (now === undefined ? undefined : { ...now }),
    resting: () => now === undefined || (now.zoom === 1 && goal !== undefined && goal.zoom === 1 && now.x === goal.x && now.y === goal.y && speed.every((v) => v === 0)),
    reset() {
      now = undefined;
      goal = undefined;
      speed = [0, 0, 0];
    },
  };
}

/**
 * How much a view magnifies for a shot's zoom, when the view at 1 shows more than the surface (`room` times it: the margin round a flat drawing, the stands round a 3D one). At a zoom of 1 the
 * view is as it was; at `maxZoom` the frame fills it; in between the two are joined smoothly, and the view never shows less than the frame.
 */
export function zoomFor(zoom: number, room: number, maxZoom = FOLLOW_LIMITS.maxZoom): number {
  if (!(zoom > 1) || !(maxZoom > 1)) return 1;
  return Math.pow(Math.max(1, room) * maxZoom, Math.log(Math.min(zoom, maxZoom)) / Math.log(maxZoom));
}

/**
 * The part of a flat drawing to show for a shot: a rectangle in the drawing's `viewBox` units, of the viewBox's shape, round the shot's middle, inside the viewBox, and never smaller than the
 * shot's frame. `map` takes a point of the surface's frame to the viewBox's (a surface laid tall is turned a quarter in its drawing).
 * @example
 * ```ts
 * import { followWindow } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const box = { x: 0, y: 0, w: 200, h: 85 };
 * const view = { x: -8, y: -8, w: 216, h: 101 };
 * console.log(followWindow({ x: 100, y: 42.5, zoom: 1 }, box, view));
 * console.log(followWindow({ x: 160, y: 42.5, zoom: 2.5 }, box, view));
 * // { x: -8, y: -8, w: 216, h: 101 }
 * // { x: 120, y: 23.8, w: 80, h: 37.41 }
 * ```
 */
export function followWindow(shot: FollowShot, box: FollowBox, view: FollowBox, map: (p: [number, number]) => [number, number] = (p) => p, maxZoom = FOLLOW_LIMITS.maxZoom): FollowBox {
  const span = (points: [number, number][]): FollowBox => {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  const corners = (b: FollowBox): [number, number][] => [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map((p) => map(p as [number, number]));
  const surface = span(corners(box));
  const by = zoomFor(shot.zoom, surface.w > 0 && surface.h > 0 ? Math.min(view.w / surface.w, view.h / surface.h) : 1, maxZoom);
  const [w, h] = [view.w / by, view.h / by];
  const [cx, cy] = map([shot.x, shot.y]);
  const round = (n: number): number => Math.round(n * 100) / 100;
  return { x: round(clamp(cx - w / 2, view.x, view.x + view.w - w)), y: round(clamp(cy - h / 2, view.y, view.y + view.h - h)), w: round(w), h: round(h) };
}

/** The kinds of event that stop the play, and the one that starts it again. */
const STOPS: readonly string[] = ["whistle", "goal"];

/**
 * The faceoff dot, in the timeline's frame, while the play is stopped at `t`: from a whistle or a goal until the next `faceoff` event that has a place (`x` and `y`), the place of that faceoff.
 * `undefined` while the play goes on, and always for a timeline with no `faceoff` events: the camera then follows the puck through the stoppage as at any other time.
 * @example
 * ```ts
 * import { followStop } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const timeline = { frames: [{ t: 0, objects: [] }, { t: 30, objects: [] }], events: [{ t: 10, kind: "whistle" }, { t: 20, kind: "faceoff", x: 69, y: 22 }] };
 * console.log(followStop(timeline, 5), followStop(timeline, 15), followStop(timeline, 25));
 * // undefined [ 69, 22 ] undefined
 * ```
 */
export function followStop(timeline: ReplayTimeline, t: number): [number, number] | undefined {
  const events = replayEvents(timeline);
  let stopped = false;
  for (const e of events) {
    if (e.t > t) {
      if (stopped && e.kind === "faceoff" && isNum(e.x) && isNum(e.y)) return [e.x, e.y];
      if (stopped && e.kind === "faceoff") return undefined;
      continue;
    }
    if (STOPS.includes(e.kind)) stopped = true;
    else if (e.kind === "faceoff") stopped = false;
  }
  return undefined;
}

/** What a runner is given: the timeline, where its objects are in the drawing at a time, the surface, a clock in milliseconds, and how to show a shot (`undefined` gives back the whole drawing). */
export interface FollowSource {
  timeline: ReplayTimeline;
  /** The objects at a time and the faceoff dot of a stoppage, in the drawing's feet. */
  at(t: number, stop: readonly [number, number] | undefined): FollowInput;
  now(): number;
  show(shot: FollowShot | undefined): void;
  limits?: Partial<FollowLimits>;
}

/** What `followRunner` gives back. */
export interface FollowRunner {
  /** The replay's clock changed: move the camera for it. */
  paint(change: ReplayChange): void;
  /** Show the shot again (the drawing was written again). */
  again(): void;
  /** Forget the shot: the camera starts from the whole surface. */
  reset(): void;
}

/**
 * The camera of a replay in a page: on each tick of the clock the spring moves by the seconds that went by; a seek, a step, or a change of mode while paused puts the camera where it should be at
 * once (a reader who prefers reduced motion gets only steps); a play, a pause, a change of speed or loop moves nothing. Nothing runs between changes, and off and at rest it does nothing at all.
 */
export function followRunner(source: FollowSource): FollowRunner {
  const camera = followCamera(source.limits);
  let last: number | undefined;
  let shown: FollowShot | undefined;
  const show = (shot: FollowShot | undefined): void => {
    const same = shot === undefined ? shown === undefined : shown !== undefined && shot.x === shown.x && shot.y === shown.y && shot.zoom === shown.zoom;
    shown = shot;
    if (!same) source.show(shot);
  };
  return {
    paint({ state, reason }) {
      const mode = state.followHeld === true ? "held" : (state.follow ?? "off");
      const tick = reason === "tick";
      if (!tick) last = undefined;
      if (mode === "held" || (mode === "off" && camera.resting())) return;
      if (!tick && !["seek", "step", "motion", "follow"].includes(reason)) return;
      // Turned on or off, or resumed, while playing: the ticks ease it there.
      if (reason === "follow" && state.playing) return;
      const stamp = source.now();
      const dt = tick ? (last === undefined ? 0 : Math.min(0.1, Math.max(0, (stamp - last) / 1000))) : undefined;
      if (tick) last = stamp;
      if (dt === 0) return;
      const input = source.at(state.t, mode === "off" ? undefined : followStop(source.timeline, state.t));
      const shot = camera.update(mode, input, dt);
      show(mode === "off" && camera.resting() ? undefined : shot);
    },
    again() {
      if (shown !== undefined) source.show(shown);
    },
    reset() {
      camera.reset();
      last = undefined;
      shown = undefined;
    },
  };
}
