// The clock of a replay as a state machine: play, pause, seek, step, speed, loop, and what went by in each move. It knows nothing of the
// browser: the caller feeds it the seconds that passed (`advance`), which a test does with numbers and the page does from
// `requestAnimationFrame`. replay.dom.ts is the page's side.
import { eventsBetween, replayInfo, replayTimes } from "./replay.ts";
import type { ReplayChange, ReplayEvent, ReplayReason, ReplaySettings, ReplayState, ReplayTimeline } from "./replay.types.ts";

/** The speeds the controls offer. Any speed from the least to the greatest is allowed. */
export const REPLAY_SPEEDS: readonly number[] = [0.25, 0.5, 1, 2, 4];

/** The slowest and the fastest speed of play. */
export const REPLAY_SPEED_RANGE: readonly [number, number] = [0.25, 4];

const EPS = 1e-9;
const clamp = (value: number, least: number, greatest: number): number => Math.min(greatest, Math.max(least, value));
const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** What `createReplay` gives back. */
export interface ReplayController {
  /** A copy of the state now. */
  state(): Readonly<ReplayState>;
  /** Start playing, from the start if it stopped at the end. In step mode, play moves one step and never plays by itself. */
  play(): void;
  pause(): void;
  toggle(): void;
  /** Go to a time, in seconds on the timeline's clock; held to the first and last moments. */
  seek(t: number): void;
  /** Pause and go to the next frame (1) or the one before (-1). In step mode, move `stepSeconds`. */
  step(direction: 1 | -1): void;
  /** Move by seconds, backward or forward. */
  jump(seconds: number): void;
  /** 0.25 to 4. */
  setSpeed(speed: number): void;
  setLoop(loop: boolean): void;
  /** `step` for a reader who prefers reduced motion: playing stops, and play steps. */
  setMotion(motion: "smooth" | "step"): void;
  /** Tell the clock that seconds went by: while playing, the time moves by that many seconds times the speed. */
  advance(seconds: number): void;
  /** Be told of every change. Returns a function that stops it. */
  subscribe(listener: (change: ReplayChange) => void): () => void;
}

/**
 * The controller of a replay: a state machine over a timeline's clock. It plays, pauses, seeks, steps by a frame, changes speed, loops, and says which
 * events went by in each move so that they can be announced. It never reads a clock or the page: `advance(seconds)` is how time passes.
 * @example
 * ```ts
 * import { createReplay } from "@johnmorrisdotca/kyogijo/replay";
 * const frames = [0, 1, 2, 3, 4].map((t) => ({ t, objects: [{ id: "ball", team: "ball" as const, x: t * 10, y: 0 }] }));
 * const replay = createReplay({ frames, events: [{ t: 2, kind: "goal" }] }, { speed: 2 });
 * replay.play();
 * replay.advance(1.5);
 * console.log(replay.state().t, replay.state().playing);
 * replay.advance(5);
 * console.log(replay.state().t, replay.state().playing, replay.state().ended);
 * // 3 true
 * // 4 false true
 * ```
 */
export function createReplay(timeline: ReplayTimeline, settings: ReplaySettings = {}): ReplayController {
  const info = replayInfo(timeline);
  const times = replayTimes(timeline);
  const stepSeconds = isNum(settings.stepSeconds) && settings.stepSeconds > 0 ? settings.stepSeconds : 1;
  const state: ReplayState = {
    t: clamp(info.start + (isNum(settings.start) ? settings.start : 0), info.start, info.end),
    start: info.start,
    end: info.end,
    playing: false,
    ended: false,
    speed: isNum(settings.speed) ? clamp(settings.speed, REPLAY_SPEED_RANGE[0], REPLAY_SPEED_RANGE[1]) : 1,
    loop: settings.loop === true,
    motion: settings.motion === "step" ? "step" : "smooth",
  };
  const listeners = new Set<(change: ReplayChange) => void>();
  const tell = (reason: ReplayReason, crossed: readonly ReplayEvent[] = []): void => {
    const change: ReplayChange = { state: { ...state }, reason, crossed };
    for (const listener of [...listeners]) listener(change);
  };
  const over = (from: number, to: number): ReplayEvent[] => (to > from ? eventsBetween(timeline, from, to) : []);

  /** The first frame time after `t`, or the end. */
  const after = (t: number): number => {
    let lo = 0;
    let hi = times.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= t + EPS) lo = mid + 1;
      else hi = mid;
    }
    return lo < times.length ? times[lo] : state.end;
  };
  /** The last frame time before `t`, or the start. */
  const before = (t: number): number => {
    let lo = 0;
    let hi = times.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (times[mid] < t - EPS) lo = mid + 1;
      else hi = mid;
    }
    return lo > 0 ? times[lo - 1] : state.start;
  };

  const controller: ReplayController = {
    state: () => ({ ...state }),
    play() {
      if (state.motion === "step") {
        controller.step(1);
        return;
      }
      if (state.playing) return;
      if (state.t >= state.end - EPS && state.end > state.start) state.t = state.start;
      state.playing = true;
      state.ended = false;
      tell("play");
    },
    pause() {
      if (!state.playing) return;
      state.playing = false;
      tell("pause");
    },
    toggle() {
      if (state.playing) controller.pause();
      else controller.play();
    },
    seek(t) {
      if (!isNum(t)) return;
      state.t = clamp(t, state.start, state.end);
      state.ended = false;
      tell("seek");
    },
    step(direction) {
      const was = state.playing;
      state.playing = false;
      const from = state.t;
      let to: number;
      if (state.motion === "step") to = clamp(from + direction * stepSeconds, state.start, state.end);
      else to = direction > 0 ? after(from) : before(from);
      if (to === from && !was) return;
      state.t = to;
      state.ended = false;
      tell("step", direction > 0 ? over(from, to) : []);
    },
    jump(seconds) {
      if (isNum(seconds)) controller.seek(state.t + seconds);
    },
    setSpeed(speed) {
      if (!isNum(speed)) return;
      const next = clamp(speed, REPLAY_SPEED_RANGE[0], REPLAY_SPEED_RANGE[1]);
      if (next === state.speed) return;
      state.speed = next;
      tell("speed");
    },
    setLoop(loop) {
      if (state.loop === loop) return;
      state.loop = loop;
      tell("loop");
    },
    setMotion(motion) {
      if (state.motion === motion) return;
      state.motion = motion;
      state.playing = false;
      tell("motion");
    },
    advance(seconds) {
      if (!state.playing || state.motion === "step" || !isNum(seconds) || seconds <= 0) return;
      const from = state.t;
      const to = from + seconds * state.speed;
      if (to < state.end - EPS || (state.loop && state.end > state.start && to < state.end + EPS)) {
        state.t = to;
        tell("tick", over(from, to));
        return;
      }
      if (state.loop && state.end > state.start) {
        // Past the end: the rest of the clock goes round from the start, however many times it fits.
        const length = state.end - state.start;
        const wrapped = (to - state.start) % length;
        state.t = state.start + wrapped;
        // Everything from `from` to the end went by, and then everything from the start to where the clock is now.
        const crossed = [...over(from, state.end), ...eventsBetween(timeline, state.start - 1, state.start + wrapped)];
        tell("tick", crossed);
        return;
      }
      state.t = state.end;
      state.playing = false;
      state.ended = true;
      tell("tick", over(from, state.end));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return controller;
}
