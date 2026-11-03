// What a scoreboard shows of a replayed game at a time: the score, the period and the game clock, worked out from the same timeline the replay plays (its goals and its periods). Pure: a timeline and a time
// give the same board every time, so a seek, a step and a period's button all land on the right figures at once, and a replay that goes back finds the score as it was. The 3D view draws it on the scoreboard
// hung over the surface (`turn.replay.ts`); a page that draws its own board reads it the same way.
import { replayEvents, replayInfo } from "./replay.ts";
import type { ReplayPeriod, ReplayTimeline } from "./replay.types.ts";

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

/**
 * The scoreboard of a replay at a time `t`, in seconds on the timeline's clock. The score is the goals at or before it; the period is the last one that has begun (the first, before any has);
 * the clock runs through the period from its full length to nothing, or from nothing up when the timeline counts `up`. A period with a `length` of its own runs its clock through that many
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
  const periods = replayPeriods(timeline);
  let at = periods[0];
  for (const p of periods) if (p.start <= t) at = p;
  const span = at.end - at.start;
  const share = span > 0 ? Math.min(1, Math.max(0, (t - at.start) / span)) : 0;
  const length = isNum(at.length) && at.length > 0 ? at.length : span;
  // Down: the time left, rounded up, so that the full length shows until the period has moved and nothing shows only at its end. Up: the whole seconds gone.
  const clock = timeline.clock === "up" ? boardClock(share * length) : boardClock(Math.ceil((1 - share) * length - 1e-9));
  return at.number === undefined ? { score, clock } : { score, period: at.number, clock };
}
