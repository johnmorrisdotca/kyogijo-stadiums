// What a scoreboard shows of a replayed game at a time: the score, the period and the game clock, worked out from the same timeline the replay plays (its goals and its periods). Pure: a timeline and a time
// give the same board every time, so a seek, a step and a period's button all land on the right figures at once, and a replay that goes back finds the score as it was. The 3D view draws it on the scoreboard
// hung over the surface (`turn.replay.ts`); a page that draws its own board reads it the same way.
import { deadSeconds, stoppageAt } from "./replay.deadtime.ts";
import { replayEvents, replayInfo } from "./replay.ts";
import type { ReplayPeriod, ReplayStoppage, ReplayTimeline } from "./replay.types.ts";

/** The board at a time. */
export interface ReplayBoardState {
  /** The goals so far: the events of kind `goal` at or before the time, by `team`. */
  score: [number, number];
  /** The period's number, or `undefined` when the timeline has no periods. */
  period?: number;
  /** The game clock as it is written, `19:20`: the time left in the period, or the time gone when the timeline counts `up`. Whole seconds, so it changes once a second of game time at most. */
  clock: string;
}

const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const two = (n: number): string => String(n).padStart(2, "0");

/** Seconds on a board's clock, `19:20`. A board has two digits of minutes, so more than 99:59 is shown as 99:59. */
export function boardClock(seconds: number): string {
  const whole = Math.min(99 * 60 + 59, Math.max(0, Math.floor(isNum(seconds) ? seconds : 0)));
  return `${Math.floor(whole / 60)}:${two(whole % 60)}`;
}

/** The periods of a timeline in order, each with its number; the whole replay as one period with no number when it gives none. */
export function replayPeriods(timeline: ReplayTimeline): readonly (ReplayPeriod & { number?: number })[] {
  const given = (timeline.periods ?? []).filter((p) => isNum(p?.start) && isNum(p?.end) && p.end >= p.start);
  if (given.length === 0) {
    const info = replayInfo(timeline);
    return [{ start: info.start, end: info.end }];
  }
  return [...given].sort((a, b) => a.start - b.start).map((p, i) => ({ ...p, number: isNum(p.number) ? p.number : i + 1 }));
}

/** The game clock at a time on the replay's clock. */
export interface ReplayGameClock {
  /** The period's number, or `undefined` when the timeline has no periods. */
  period?: number;
  /** Seconds of the period played on the game clock, and seconds left of it. */
  played: number;
  left: number;
  /** `false` in a stoppage (and before a period has begun or after it has ended): the game clock is standing still. */
  running: boolean;
  /** The stoppage the time is in, when it is in one. */
  stoppage?: ReplayStoppage;
}

/**
 * The game clock at a time `t` on the replay's clock: the period it is in (the last that has begun; the first, before any has) and how much of it has been played. The game clock runs only while play is
 * on: it stands still in each of the timeline's `stoppages`, while the replay's clock moves on through it. A period's `length` is spread over the seconds of it that are not in a stoppage, so a game
 * re-timed to minutes reads like the real one. Pure.
 * @example
 * ```ts
 * import { replayGameClock } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const timeline = {
 *   frames: [{ t: 0, objects: [] }, { t: 70, objects: [] }],
 *   periods: [{ start: 0, end: 70, length: 1200 }],
 *   stoppages: [{ start: 30, end: 40, reason: "goal" }],
 * };
 * const at = (t: number) => { const c = replayGameClock(timeline, t); return `${c.played} ${c.running}`; };
 * console.log(at(15), at(30), at(35), at(40), at(55));
 * // 300 true 600 false 600 false 600 true 900 true
 * ```
 */
export function replayGameClock(timeline: ReplayTimeline, t: number): ReplayGameClock {
  const periods = replayPeriods(timeline);
  let at = periods[0];
  for (const p of periods) if (p.start <= t) at = p;
  const live = at.end - at.start - deadSeconds(timeline, at.start, at.end);
  const into = Math.min(at.end, Math.max(at.start, t));
  const gone = into - at.start - deadSeconds(timeline, at.start, into);
  const share = live > 0 ? Math.min(1, Math.max(0, gone / live)) : 0;
  const length = isNum(at.length) && at.length > 0 ? at.length : live;
  const stoppage = stoppageAt(timeline, t);
  const played = share * length;
  const running = stoppage === undefined && t >= at.start && t < at.end;
  return { ...(at.number === undefined ? {} : { period: at.number }), played, left: length - played, running, ...(stoppage === undefined ? {} : { stoppage }) };
}

/**
 * The scoreboard of a replay at a time `t`, in seconds on the timeline's clock. The score is the goals at or before it; the period and the clock are the game clock's (`replayGameClock`): the clock runs
 * through the period from its full length to nothing, or from nothing up when the timeline counts `up`, and stands still in a stoppage. A period with a `length` of its own runs its clock through that many
 * seconds however long it lasts on the timeline, so a game re-timed to minutes can read like the real one.
 * @example
 * ```ts
 * import { replayBoard } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const frames = [0, 60, 120].map((t) => ({ t, objects: [{ id: "puck", team: "puck" as const, x: 0, y: 0 }] }));
 * const timeline = {
 *   frames,
 *   events: [{ t: 30, kind: "goal", team: "home" as const }],
 *   periods: [{ start: 0, end: 60, length: 1200 }, { start: 60, end: 120, length: 1200 }],
 * };
 * const at = (t: number) => JSON.stringify(replayBoard(timeline, t));
 * console.log(at(0));
 * console.log(at(30));
 * console.log(at(90));
 * // {"score":[0,0],"period":1,"clock":"20:00"}
 * // {"score":[1,0],"period":1,"clock":"10:00"}
 * // {"score":[1,0],"period":2,"clock":"10:00"}
 * ```
 */
export function replayBoard(timeline: ReplayTimeline, t: number): ReplayBoardState {
  const score: [number, number] = [0, 0];
  for (const e of replayEvents(timeline)) {
    if (e.t > t) break;
    if (e.kind === "goal" && (e.team === "home" || e.team === "away")) score[e.team === "home" ? 0 : 1] += 1;
  }
  const game = replayGameClock(timeline, t);
  // Down: the time left, rounded up, so that the full length shows until the period has moved and nothing shows only at its end. Up: the whole seconds gone.
  const clock = timeline.clock === "up" ? boardClock(game.played) : boardClock(Math.ceil(game.left - 1e-9));
  return game.period === undefined ? { score, clock } : { score, period: game.period, clock };
}
