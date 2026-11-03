// Dead time: the stoppages of a replay. A stoppage stops the game clock (the board's) while the replay's own clock moves on; in it the ball or the puck is dead (it stays where play stopped,
// then is out of sight until the restart) and the players go to their places for the restart at a speed a player would. The functions here are pure and know no sport: a sport's rule set
// (`replay.hockey.ts` for the rink) says where play starts again, how long each part of the dead time lasts and how fast the players go, and `addDeadTime` writes the stoppages into a timeline.
import { interpolate } from "./replay.ts";
import type { ReplayEvent, ReplayFrame, ReplayObject, ReplayPeriod, ReplayStoppage, ReplayTimeline } from "./replay.types.ts";

const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
type P = readonly [number, number];

const CLEAN = new WeakMap<object, readonly ReplayStoppage[]>();
/**
 * The stoppages of a timeline, in order, each checked: a `start` and an `end` that are numbers, the end not before the start. Ones that overlap are joined. Read once and kept.
 * @example
 * ```ts
 * import { replayStoppages } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const frames = [{ t: 0, objects: [] }];
 * console.log(replayStoppages({ frames, stoppages: [{ start: 9, end: 12 }, { start: 2, end: 5, reason: "goal" }, { start: 4, end: 6 }, { start: 8, end: 7 }] }));
 * // [ { start: 2, end: 6, reason: 'goal' }, { start: 9, end: 12 } ]
 * ```
 */
export function replayStoppages(timeline: ReplayTimeline): readonly ReplayStoppage[] {
  const hit = CLEAN.get(timeline);
  if (hit !== undefined) return hit;
  const given = Array.isArray(timeline.stoppages) ? timeline.stoppages : [];
  const sorted = given
    .filter((s) => typeof s === "object" && s !== null && isNum(s.start) && isNum(s.end) && s.end >= s.start)
    .map((s) => ({ ...s }))
    .sort((a, b) => a.start - b.start);
  const out: ReplayStoppage[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last !== undefined && s.start <= last.end) last.end = Math.max(last.end, s.end);
    else out.push(s);
  }
  CLEAN.set(timeline, out);
  return out;
}

/** The stoppage a time is in (from its start, up to but not at its end, when play starts again), or `undefined` while play is on. */
export function stoppageAt(timeline: ReplayTimeline, t: number): ReplayStoppage | undefined {
  for (const s of replayStoppages(timeline)) {
    if (s.start > t) return undefined;
    if (t < s.end) return s;
  }
  return undefined;
}

/** The seconds of a span of the timeline's clock that were dead: the parts of it in stoppages. */
export function deadSeconds(timeline: ReplayTimeline, from: number, to: number): number {
  let dead = 0;
  for (const s of replayStoppages(timeline)) {
    if (s.start >= to) break;
    dead += Math.max(0, Math.min(to, s.end) - Math.max(from, s.start));
  }
  return dead;
}

/**
 * The restarts that went by while the clock moved from `from` to `to` (`(from, to]`): the stoppages whose end, the drop of the puck, is in it. What a page plays the drop's sound on, as it plays the
 * horn on a goal of `eventsBetween`.
 */
export function restartsBetween(timeline: ReplayTimeline, from: number, to: number): readonly ReplayStoppage[] {
  return replayStoppages(timeline).filter((s) => s.end > from && s.end <= to);
}

/** How a sport's dead time goes: the speed the players go at and how long each part lasts, by the reason for the stoppage. */
export interface DeadTimeRules {
  /** The fastest a player goes to his place, in the timeline's units a second. */
  speed: number;
  /** Seconds after play stops before anyone heads for the restart: a goal is celebrated, a whistle is a moment. */
  pause(reason: string): number;
  /** Seconds after play stops that the dead ball or puck is still seen where it stopped; then it is out of sight until the restart. */
  shown(reason: string): number;
  /** The shortest time the players take to get to their places, and how long they stand in them before the restart. */
  least: number;
  hold: number;
  /** Where a player who comes off goes, and one who comes on comes from (the bench's gate), or `undefined` for none: then they only go and come at the restart. */
  bench?(object: ReplayObject): P | undefined;
  /** Is it the ball or the puck: dead in the stoppage, out of sight until the restart. */
  dead(object: ReplayObject): boolean;
}

/** A stoppage to write into a timeline: play stops at `t`; the timeline's frames from `until` on (the players in their places, the puck on the dot) are the restart. */
export interface DeadStop {
  t: number;
  /** The time on the timeline given of the restart's frame: `t` and `until` are moved apart by the dead time, what was between them is left out, and the instant between them becomes part of the stoppage. 0.04 seconds after `t` by default. */
  until?: number;
  reason: string;
  /** Where play starts again. */
  x?: number;
  y?: number;
  team?: "home" | "away";
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round1 = (n: number): number => Math.round(n * 10) / 10;
const ceil2 = (n: number): number => Math.ceil(n * 100 - 1e-6) / 100;
const dist = (a: P, b: P): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** One object's way through a stoppage: places at times, and where it is not on the surface. */
interface Path {
  object: ReplayObject;
  /** From, to: the places and the times it is between them. */
  legs: { t0: number; t1: number; a: P; b: P }[];
  /** On the surface from, until (exclusive). */
  from: number;
  until: number;
}

const placeOn = (path: Path, t: number): P | undefined => {
  if (t < path.from || t >= path.until) return undefined;
  let at: P = path.legs[0].a;
  for (const leg of path.legs) {
    if (t < leg.t0) break;
    if (t >= leg.t1) at = leg.b;
    else {
      const f = leg.t1 > leg.t0 ? (t - leg.t0) / (leg.t1 - leg.t0) : 1;
      return [leg.a[0] + (leg.b[0] - leg.a[0]) * f, leg.a[1] + (leg.b[1] - leg.a[1]) * f];
    }
  }
  return at;
};

/**
 * Write stoppages into a timeline. The timeline given has each stoppage as an instant: the play up to `t`, then at `until` the restart (the players in their places, the puck on the dot). Each is
 * opened into the dead time the rules give: the puck stays where it stopped for a moment and is then out of sight, the players stand a moment (a goal is celebrated) and then go to their places at the
 * rules' speed or slower (all getting there together, the farthest at the rules' speed), a player going off goes to the bench and the one coming on comes from it, and they stand in their places a
 * moment before the restart. Everything after is moved on by the dead time; the periods with it (each keeps its length on the game clock), the events, and the stoppages already there. Pure.
 */
export function addDeadTime(timeline: ReplayTimeline, stops: readonly DeadStop[], rules: DeadTimeRules): ReplayTimeline {
  // Each period's length on the game clock, before the dead time stretches it: a period that had none keeps the live seconds it had.
  const periods: ReplayPeriod[] | undefined = timeline.periods?.map((p) => ({ ...p, length: isNum(p.length) ? p.length : p.end - p.start - deadSeconds(timeline, p.start, p.end) }));
  let frames: ReplayFrame[] = [...timeline.frames];
  let events: ReplayEvent[] = [...(timeline.events ?? [])];
  let stoppages: ReplayStoppage[] = [...replayStoppages(timeline)];
  // The last first, so that a stoppage does not move the ones before it.
  const order = [...stops].filter((s) => isNum(s.t)).sort((a, b) => b.t - a.t);
  let pers = periods;
  for (const stop of order) {
    const t0 = stop.t;
    const u = isNum(stop.until) && stop.until > t0 ? stop.until : t0 + 0.04;
    const view: ReplayTimeline = { ...timeline, frames, events: [] };
    const at = new Map(interpolate(view, t0).map((o) => [o.id, o]));
    const next = new Map(interpolate(view, u).map((o) => [o.id, o]));
    const pause = round2(Math.max(0, rules.pause(stop.reason)));
    const shown = round2(Math.max(0, rules.shown(stop.reason)));
    // The players: who stays on, who goes off and who comes on, and how far each goes.
    const stay: [ReplayObject, P, P][] = [];
    const off: [ReplayObject, P, P | undefined][] = [];
    const on: [ReplayObject, P | undefined, P][] = [];
    for (const [id, o] of at) {
      if (rules.dead(o)) continue;
      const b = next.get(id);
      if (b !== undefined) stay.push([o, [o.x, o.y], [b.x, b.y]]);
      else off.push([o, [o.x, o.y], rules.bench?.(o)]);
    }
    for (const [id, o] of next) if (!rules.dead(o) && !at.has(id)) on.push([o, rules.bench?.(o), [o.x, o.y]]);
    const leave = Math.max(0, ...off.map(([, a, b]) => (b === undefined ? 0 : dist(a, b) / rules.speed)));
    const swap = off.length > 0 || on.length > 0 ? ceil2(pause + leave) : pause;
    const come = Math.max(0, ...on.map(([, a, b]) => (a === undefined ? 0 : dist(a, b) / rules.speed)));
    const skate = Math.max(...stay.map(([, a, b]) => dist(a, b) / rules.speed), 0);
    const arrive = ceil2(Math.max(pause + Math.max(rules.least, skate), on.length > 0 ? round2(swap + 0.04) + come : 0));
    const total = round2(Math.max(arrive + rules.hold, shown + 1));
    // The paths.
    const paths: Path[] = [];
    for (const [object, a, b] of stay) paths.push({ object, from: 0, until: Infinity, legs: [{ t0: 0, t1: pause, a, b: a }, { t0: pause, t1: arrive, a, b }] });
    for (const [object, a, b] of off) paths.push({ object, from: 0, until: b === undefined ? swap : round2(swap + 0.04), legs: [{ t0: 0, t1: pause, a, b: a }, { t0: pause, t1: swap, a, b: b ?? a }] });
    for (const [object, a, b] of on) paths.push({ object, from: a === undefined ? arrive : round2(swap + 0.04), until: Infinity, legs: [{ t0: round2(swap + 0.04), t1: arrive, a: a ?? b, b }] });
    const deadOnes = [...at.values()].filter((o) => rules.dead(o));
    const changes = off.length > 0 || on.length > 0 ? [swap, round2(swap + 0.04)] : [];
    const moments = [...new Set([0, pause, shown, ...changes, arrive].map(round2))].filter((m) => m >= 0 && m < total).sort((a, b) => a - b);
    const inserted: ReplayFrame[] = moments.map((m) => {
      const objects: ReplayObject[] = [];
      for (const path of paths) {
        const p = placeOn(path, m);
        if (p !== undefined) objects.push({ ...path.object, x: round1(p[0]), y: round1(p[1]) });
      }
      // The dead puck: where it stopped, and out of sight from `shown` on.
      if (m < shown) for (const o of deadOnes) objects.push({ ...o });
      return { t: round2(t0 + m), objects };
    });
    // The restart: the frame given at `until`, and everything after it, moved on.
    const shift = round2(t0 + total - u);
    const move = (t: number): number => (t >= u ? round2(t + shift) : t > t0 ? t0 : t);
    const restart: ReplayFrame = { t: round2(t0 + total), objects: [...next.values()] };
    frames = [...frames.filter((f) => f.t < t0), ...inserted, restart, ...frames.filter((f) => f.t > u).map((f) => ({ ...f, t: move(f.t) }))];
    events = events.map((e) => ({ ...e, t: move(e.t), ...(isNum(e.until) ? { until: move(e.until) } : {}) }));
    stoppages = [
      ...stoppages.map((s) => ({ ...s, start: move(s.start), end: move(s.end) })),
      { start: t0, end: round2(t0 + total), reason: stop.reason, ...(isNum(stop.x) && isNum(stop.y) ? { x: stop.x, y: stop.y } : {}), ...(stop.team === undefined ? {} : { team: stop.team }) },
    ].sort((a, b) => a.start - b.start);
    pers = pers?.map((p) => ({ ...p, start: move(p.start), end: move(p.end) }));
  }
  return { ...timeline, frames, events: events.sort((a, b) => a.t - b.t), stoppages, ...(pers === undefined ? {} : { periods: pers }) };
}
