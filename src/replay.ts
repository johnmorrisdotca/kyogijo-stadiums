// A replay: tracking data over time, played on any surface. The functions here are pure: a timeline and a time give the positions
// (`interpolate`), the trails behind them (`trails`), who has the ball (`possession`), the events that are on the surface
// (`activeEvents`), and one frame as the same SVG string every time (`drawFrame`), made from the data layers. The clock, the controls and
// the browser are in replay.control.ts and replay.dom.ts. Written for this package; hockey_rink's and mplsoccer's animations were
// read about, for the idea of a timeline of positions played on a surface, and no code of either is used.
import { drawKyogijo, describe } from "./draw.ts";
import { esc, hash } from "./format.ts";
import { envFor, place, unitOfLayer } from "./layers.env.ts";
import { renderLayers } from "./layers.ts";
import type { Layer, LayerBase } from "./layers.types.ts";
import type {
  ActiveEvent,
  Possession,
  ReplayEvent,
  ReplayFrame,
  ReplayLook,
  ReplayObject,
  ReplayTeam,
  ReplayTimeline,
  ReplayTrail,
} from "./replay.types.ts";
import { KYOGIJO_STRINGS, fill, type KyogijoWords } from "./strings.ts";
import type { Language, ScoreOptions, SurfaceOptions } from "./types.ts";
import { VERSION } from "./version.ts";

type P = [number, number];

const TEAMS: readonly ReplayTeam[] = ["home", "away", "ball", "puck", "official"];
const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** Seconds as a clock, `0:12` or `1:05:09`. */
export function replayClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(isNum(seconds) ? seconds : 0));
  const s = String(whole % 60).padStart(2, "0");
  const m = Math.floor(whole / 60);
  return m < 60 ? `${m}:${s}` : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${s}`;
}

/** Seconds as it is said aloud, in the words of the language: `0:12` in English and `12秒` in Japanese, where a clock would be read as a time of day. */
export function replaySpoken(seconds: number, w: KyogijoWords["replay"]): string {
  const whole = Math.max(0, Math.floor(isNum(seconds) ? seconds : 0));
  const h = Math.floor(whole / 3600);
  const m = Math.floor(whole / 60) % 60;
  const s = whole % 60;
  const two = (n: number): string => String(n).padStart(2, "0");
  const values = { h, m, s, mm: two(m), ss: two(s) };
  return fill(h > 0 ? w.spokenHours : whole >= 60 ? w.spokenMinutes : w.spokenSeconds, values);
}

/** What a timeline is, checked once and kept for the next call. */
interface Prepared {
  timeline: ReplayTimeline;
  frames: ReplayFrame[];
  times: number[];
  /** The objects of each frame by id, made when first wanted. */
  maps: (Map<string, ReplayObject> | undefined)[];
  /** Every id, in the order it first appears. */
  ids: string[];
  /** The first time each id appears: its team, label and number. */
  first: Map<string, ReplayObject>;
  start: number;
  end: number;
  /** The usual gap between frames, in seconds. */
  step: number;
  /** For each frame, the index of the last frame at or before it that says who has the ball (or -1). */
  said: number[];
  events: ReplayEvent[];
}

const CACHE = new WeakMap<object, Prepared>();

const teamOf = (value: unknown): ReplayTeam => (TEAMS as readonly unknown[]).includes(value) ? (value as ReplayTeam) : "official";

function prepare(timeline: ReplayTimeline): Prepared {
  if (typeof timeline !== "object" || timeline === null) throw new TypeError("a timeline is an object with frames");
  const hit = CACHE.get(timeline);
  if (hit !== undefined) return hit;
  if (!Array.isArray(timeline.frames) || timeline.frames.length === 0) throw new TypeError("a timeline needs frames: a list of { t, objects }");
  const frames: ReplayFrame[] = [];
  timeline.frames.forEach((frame, index) => {
    if (typeof frame !== "object" || frame === null || !isNum(frame.t)) throw new RangeError(`frame ${index} has no time: t is a number of seconds`);
    if (!Array.isArray(frame.objects)) throw new TypeError(`frame ${index} needs objects: a list of { id, team, x, y }`);
    const objects = frame.objects
      .filter((o: ReplayObject) => typeof o === "object" && o !== null && (typeof o.id === "string" || isNum(o.id)) && isNum(o.x) && isNum(o.y))
      .map((o: ReplayObject): ReplayObject => ({ ...o, id: String(o.id), team: teamOf(o.team) }));
    frames.push({ ...frame, objects });
  });
  // Frames run forward in time; the sort is stable, so frames with one time keep their order.
  if (frames.some((frame, i) => i > 0 && frame.t < frames[i - 1].t)) frames.sort((a, b) => a.t - b.t);
  const times = frames.map((frame) => frame.t);
  const ids: string[] = [];
  const first = new Map<string, ReplayObject>();
  for (const frame of frames) {
    for (const o of frame.objects) {
      if (!first.has(o.id)) {
        first.set(o.id, o);
        ids.push(o.id);
      }
    }
  }
  const gaps = times.slice(1).map((t, i) => t - times[i]).filter((gap) => gap > 0).sort((a, b) => a - b);
  let said = -1;
  const saidAt = frames.map((frame, i) => {
    if (frame.possession !== undefined) said = i;
    return said;
  });
  const events = Array.isArray(timeline.events) ? timeline.events.filter((e) => typeof e === "object" && e !== null && isNum(e.t) && typeof e.kind === "string").map((e) => ({ ...e })).sort((a, b) => a.t - b.t) : [];
  const prepared: Prepared = {
    timeline,
    frames,
    times,
    maps: frames.map(() => undefined),
    ids,
    first,
    start: times[0],
    end: times[times.length - 1],
    step: gaps.length === 0 ? 0 : gaps[Math.floor(gaps.length / 2)],
    said: saidAt,
    events,
  };
  CACHE.set(timeline, prepared);
  return prepared;
}

const mapOf = (p: Prepared, index: number): Map<string, ReplayObject> | undefined => {
  if (index < 0 || index >= p.frames.length) return undefined;
  let m = p.maps[index];
  if (m === undefined) {
    m = new Map(p.frames[index].objects.map((o) => [o.id, o]));
    p.maps[index] = m;
  }
  return m;
};

/** The index of the last frame at or before `t`, and how far from it to the next as a fraction. */
function locate(p: Prepared, t: number): { i: number; f: number } {
  const at = isNum(t) ? Math.min(Math.max(t, p.start), p.end) : p.start;
  let lo = 0;
  let hi = p.times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (p.times[mid] <= at) lo = mid;
    else hi = mid - 1;
  }
  const next = p.times[lo + 1];
  return { i: lo, f: next === undefined || next === p.times[lo] ? 0 : (at - p.times[lo]) / (next - p.times[lo]) };
}

const share = (smooth: boolean | number | undefined): number => (smooth === true ? 1 : isNum(smooth) ? Math.max(0, Math.min(1, smooth)) : 0);

/** Where an object is between frame `i` and the next: a straight line, or bent towards a Catmull-Rom curve through the frames by `smooth`. */
function between(p: Prepared, i: number, f: number, a: ReplayObject, b: ReplayObject, smooth: number): P {
  const lx = a.x + (b.x - a.x) * f;
  const ly = a.y + (b.y - a.y) * f;
  if (smooth === 0 || f === 0) return [lx, ly];
  const tA = p.times[i];
  const tB = p.times[i + 1];
  const h = tB - tA;
  if (h <= 0) return [lx, ly];
  const before = mapOf(p, i - 1)?.get(a.id);
  const after = mapOf(p, i + 2)?.get(a.id);
  const tBefore = p.times[i - 1];
  const tAfter = p.times[i + 2];
  const slope = (axis: "x" | "y"): [number, number] => {
    const chord = (b[axis] - a[axis]) / h;
    const mA = before !== undefined && tB > tBefore ? (b[axis] - before[axis]) / (tB - tBefore) : chord;
    const mB = after !== undefined && tAfter > tA ? (after[axis] - a[axis]) / (tAfter - tA) : chord;
    return [mA, mB];
  };
  const f2 = f * f;
  const f3 = f2 * f;
  const h00 = 2 * f3 - 3 * f2 + 1;
  const h10 = f3 - 2 * f2 + f;
  const h01 = -2 * f3 + 3 * f2;
  const h11 = f3 - f2;
  const [ax, bx] = slope("x");
  const [ay, by] = slope("y");
  const cx = h00 * a.x + h10 * h * ax + h01 * b.x + h11 * h * bx;
  const cy = h00 * a.y + h10 * h * ay + h01 * b.y + h11 * h * by;
  return [lx + (cx - lx) * smooth, ly + (cy - ly) * smooth];
}

/** One object's place at a time, or `undefined` if it is not there. */
function positionAt(p: Prepared, id: string, t: number, smooth: number): P | undefined {
  const { i, f } = locate(p, t);
  const a = mapOf(p, i)?.get(id);
  if (a === undefined) return undefined;
  const b = f > 0 ? mapOf(p, i + 1)?.get(id) : undefined;
  return b === undefined ? [a.x, a.y] : between(p, i, f, a, b, smooth);
}

/** The first and last moments of a timeline, how long it is, how many frames and objects it has, and the usual gap between frames, all in seconds. */
export function replayInfo(timeline: ReplayTimeline): { start: number; end: number; duration: number; frames: number; objects: number; events: number; step: number } {
  const p = prepare(timeline);
  return { start: p.start, end: p.end, duration: p.end - p.start, frames: p.frames.length, objects: p.ids.length, events: p.events.length, step: p.step };
}

/** The times of the frames, and of the events, in order: the moments a step can land on. */
export function replayTimes(timeline: ReplayTimeline): readonly number[] {
  return prepare(timeline).times;
}

/** The events of a timeline, in time order. */
export function replayEvents(timeline: ReplayTimeline): readonly ReplayEvent[] {
  return prepare(timeline).events;
}

/**
 * Where everything is at a time: each object of the frame at or before `t` placed between that frame and the next, in a straight line or, with
 * `smooth`, along a curve through the frames. An object in both frames moves; one only in the earlier frame stays put until the next; one only in
 * the later frame appears when its frame comes. `t` is held to the first and last moments. The objects keep the order of their first appearance.
 * @example
 * ```ts
 * import { interpolate } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * import type { ReplayTimeline } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const timeline: ReplayTimeline = { frames: [
 *   { t: 0, objects: [{ id: "ball", team: "ball", x: 100, y: 40 }] },
 *   { t: 2, objects: [{ id: "ball", team: "ball", x: 140, y: 20 }] },
 * ] };
 * console.log(interpolate(timeline, 0.5).map((o) => `${o.id} ${o.x} ${o.y}`).join());
 * // ball 110 35
 * ```
 */
export function interpolate(timeline: ReplayTimeline, t: number, options: { smooth?: boolean | number } = {}): ReplayObject[] {
  const p = prepare(timeline);
  const smooth = share(options.smooth);
  const { i, f } = locate(p, t);
  const here = mapOf(p, i);
  if (here === undefined) return [];
  const next = f > 0 ? mapOf(p, i + 1) : undefined;
  const out: ReplayObject[] = [];
  for (const o of p.frames[i].objects) {
    // The last of an id in a frame is the one the map holds.
    const a = here.get(o.id);
    if (a !== o && a !== undefined) continue;
    const b = next?.get(o.id);
    if (b === undefined) out.push({ ...o });
    else {
      const [x, y] = between(p, i, f, o, b, smooth);
      out.push({ ...o, x, y });
    }
  }
  // The order of first appearance, whichever order a frame lists its objects in.
  const order = new Map(p.ids.map((id, n) => [id, n]));
  return out.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

/**
 * The path each object took over the last `seconds` before `t`, oldest place first and ending at its place at `t`: the frames in between, and the places at the two ends.
 * Only objects that are there at `t` have a trail. `teams` and `ids` choose whose; all by default.
 * @example
 * ```ts
 * import { trails } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * import type { ReplayTimeline } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const timeline: ReplayTimeline = { frames: [0, 1, 2, 3].map((t) => ({ t, objects: [{ id: "puck", team: "puck", x: t * 10, y: 0 }] })) };
 * console.log(trails(timeline, 3, 2)[0].points.map((point) => point[0]).join());
 * // 10,20,30
 * ```
 */
export function trails(timeline: ReplayTimeline, t: number, seconds: number, options: { teams?: readonly ReplayTeam[]; ids?: readonly string[]; smooth?: boolean | number } = {}): ReplayTrail[] {
  const p = prepare(timeline);
  const smooth = share(options.smooth);
  const now = Math.min(Math.max(t, p.start), p.end);
  const from = Math.max(p.start, now - (isNum(seconds) && seconds > 0 ? seconds : 0));
  const { i: lastFrame } = locate(p, now);
  const { i: firstFrame } = locate(p, from);
  const out: ReplayTrail[] = [];
  for (const id of p.ids) {
    const info = p.first.get(id);
    if (info === undefined) continue;
    if (options.teams !== undefined && !options.teams.includes(info.team)) continue;
    if (options.ids !== undefined && !options.ids.includes(id)) continue;
    const end = positionAt(p, id, now, smooth);
    if (end === undefined) continue;
    const points: P[] = [];
    const start = positionAt(p, id, from, smooth);
    if (start !== undefined) points.push(start);
    for (let k = firstFrame; k <= lastFrame; k += 1) {
      if (p.times[k] <= from || p.times[k] >= now) continue;
      const o = mapOf(p, k)?.get(id);
      if (o !== undefined) points.push([o.x, o.y]);
    }
    const last = points[points.length - 1];
    if (last === undefined || last[0] !== end[0] || last[1] !== end[1]) points.push(end);
    out.push({ id, team: info.team, points });
  }
  return out;
}

/**
 * Who has the ball at a time, when the data says: the `possession` of the latest frame at or before `t` that has one. `undefined` when no frame
 * says, or when the latest says nobody does (`null`).
 * @example
 * ```ts
 * import { possession } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * import type { ReplayTimeline } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const timeline: ReplayTimeline = { frames: [
 *   { t: 0, possession: "h7", objects: [{ id: "h7", team: "home", x: 1, y: 1 }, { id: "ball", team: "ball", x: 1, y: 1 }] },
 *   { t: 1, possession: null, objects: [{ id: "h7", team: "home", x: 2, y: 1 }, { id: "ball", team: "ball", x: 5, y: 1 }] },
 * ] };
 * console.log(possession(timeline, 0.5), possession(timeline, 1));
 * // { holder: 'h7', team: 'home' } undefined
 * ```
 */
export function possession(timeline: ReplayTimeline, t: number): Possession | undefined {
  const p = prepare(timeline);
  const { i } = locate(p, t);
  const at = p.said[i];
  if (at < 0) return undefined;
  const value = p.frames[at].possession;
  if (value === null || value === undefined) return undefined;
  if (value === "home" || value === "away") return { team: value };
  const holder = mapOf(p, at)?.get(value) ?? p.first.get(value);
  const team = holder?.team === "home" || holder?.team === "away" ? holder.team : undefined;
  return team === undefined ? { holder: value } : { holder: value, team };
}

/** The place of an event: its own, else the object that made it at its time, else the ball's or the puck's. */
function placeEvent(p: Prepared, index: number, smooth: number): ActiveEvent {
  const e = p.events[index];
  const out: ActiveEvent = { index, event: e };
  let start: P | undefined = isNum(e.x) && isNum(e.y) ? [e.x, e.y] : undefined;
  if (start === undefined && typeof e.by === "string") start = positionAt(p, e.by, e.t, smooth);
  if (start === undefined) {
    const loose = p.ids.find((id) => p.first.get(id)?.team === "ball" || p.first.get(id)?.team === "puck");
    if (loose !== undefined) start = positionAt(p, loose, e.t, smooth);
  }
  const ends = isNum(e.until) ? Math.max(e.until, e.t) : e.t;
  let end: P | undefined = isNum(e.x2) && isNum(e.y2) ? [e.x2, e.y2] : undefined;
  if (end === undefined && typeof e.to === "string") end = positionAt(p, e.to, ends, smooth);
  if (start !== undefined) [out.x, out.y] = start;
  if (end !== undefined) [out.x2, out.y2] = end;
  return out;
}

/**
 * The events that are on the surface at a time: from the moment of each until `hold` seconds after it ends (3 by default), with their places worked out.
 * @example
 * ```ts
 * import { activeEvents } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const ball = { id: "ball", team: "ball" as const, x: 10, y: 10 };
 * const timeline = { frames: [{ t: 0, objects: [ball] }, { t: 10, objects: [ball] }], events: [{ t: 4, kind: "goal", team: "home" as const }] };
 * console.log(activeEvents(timeline, 3).length, activeEvents(timeline, 5).map((a) => a.event.kind).join(), activeEvents(timeline, 9).length);
 * // 0 goal 0
 * ```
 */
export function activeEvents(timeline: ReplayTimeline, t: number, hold = 3, smooth?: boolean | number): ActiveEvent[] {
  const p = prepare(timeline);
  const keep = isNum(hold) && hold >= 0 ? hold : 3;
  const out: ActiveEvent[] = [];
  p.events.forEach((e, index) => {
    const until = (isNum(e.until) ? Math.max(e.until, e.t) : e.t) + keep;
    if (t >= e.t && t < until) out.push(placeEvent(p, index, share(smooth)));
  });
  return out;
}

/** The events with a time in `(from, to]`, for the live region: what went by while the clock moved from `from` to `to`. */
export function eventsBetween(timeline: ReplayTimeline, from: number, to: number): ReplayEvent[] {
  return prepare(timeline).events.filter((e) => e.t > from && e.t <= to);
}

const wordsOf = (language: Language | undefined): KyogijoWords["replay"] => KYOGIJO_STRINGS[language === "ja" ? "ja" : "en"].replay;

const KINDS = ["pass", "shot", "goal", "whistle"] as const;
const kindWord = (w: KyogijoWords["replay"], kind: string): string => ((KINDS as readonly string[]).includes(kind) ? w[kind as (typeof KINDS)[number]] : kind);

/**
 * What is said of an event, for a live region and a tooltip: its `label`, else the word for its kind and its team, then the time.
 * @example
 * ```ts
 * import { describeEvent } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * console.log(describeEvent({ t: 72, kind: "goal", team: "home" }));
 * console.log(describeEvent({ t: 72, kind: "goal", team: "home" }, "ja"));
 * // Goal, home, 1:12
 * // ホームのゴール、1分12秒
 * ```
 */
export function describeEvent(event: ReplayEvent, language: Language = "en", start = 0): string {
  const w = wordsOf(language);
  const what = typeof event.label === "string" && event.label !== "" ? event.label : kindWord(w, event.kind);
  const time = replaySpoken(event.t - start, w);
  return event.team === "home" || event.team === "away" ? fill(w.announceTeam, { what, team: w[event.team], time }) : fill(w.announce, { what, time });
}

/** The same frame of a timeline always draws the same layers: this is what a frame is, before it is drawn. */
export interface ReplaySnapshot {
  t: number;
  objects: ReplayObject[];
  trails: ReplayTrail[];
  events: ActiveEvent[];
}

const TRAILED: readonly ReplayTeam[] = ["ball", "puck"];

/** What is on the surface at a time: the objects, the trails behind the ones `look.trailOf` names, and the events. */
export function replaySnapshot(timeline: ReplayTimeline, t: number, look: ReplayLook = {}): ReplaySnapshot {
  const p = prepare(timeline);
  const at = Math.min(Math.max(t, p.start), p.end);
  const objects = interpolate(timeline, at, { smooth: look.smooth });
  const seconds = isNum(look.trail) ? Math.max(0, look.trail) : 2;
  const lines = seconds === 0 ? [] : trails(timeline, at, seconds, { teams: look.trailOf ?? TRAILED, smooth: look.smooth });
  // A trail of one place, or of places that do not differ, is not a line.
  const moving = lines.filter((line) => line.points.length >= 2 && line.points.some(([x, y]) => x !== line.points[0][0] || y !== line.points[0][1]));
  return { t: at, objects, trails: moving, events: activeEvents(timeline, at, look.hold, look.smooth) };
}

// ---- The layers of a frame. ----

/** What a layer of the frame holds: for each mark its key, and where it is in the timeline's frame, so that the browser can move it without drawing again. */
export interface ReplayGroup {
  /** The layer's id, `replay-players`. */
  id: string;
  layer: Layer;
  /** Whether the marks move with the clock (the objects, their numbers and trails); an event's marks stay where they are put. */
  moving: boolean;
  kind: "points" | "text" | "lines";
  keys: string[];
  /** Where each mark is, in the timeline's frame: a place for a point or a text, the places of a path for a line. */
  coords: (P | P[])[];
}

function layerBase(timeline: ReplayTimeline): Partial<LayerBase> {
  const base: Partial<LayerBase> = { clip: "none" };
  if (timeline.from !== undefined) base.from = timeline.from;
  if (timeline.units !== undefined) base.units = timeline.units;
  if (timeline.attacking !== undefined) base.attacking = timeline.attacking;
  if (timeline.surfaceSize !== undefined) base.surfaceSize = timeline.surfaceSize;
  if (timeline.anchors !== undefined) base.anchors = timeline.anchors;
  return base;
}

const INK = "var(--ky-layer-ink)";
const ROLE = (team: ReplayTeam): "home" | "away" | undefined => (team === "home" || team === "away" ? team : undefined);

/** The groups of a frame, in the order they are drawn: trails, event lines, event marks, officials, players, their numbers, then the ball and the puck on top. */
export function replayGroups(timeline: ReplayTimeline, snap: ReplaySnapshot, look: ReplayLook = {}, language: Language = "en"): ReplayGroup[] {
  const w = wordsOf(language);
  const base = layerBase(timeline);
  const out: ReplayGroup[] = [];
  const start = prepare(timeline).start;
  const size = isNum(look.scale) && look.scale > 0 ? look.scale : 1;
  const nameOf = (o: ReplayObject): string => {
    const name = typeof o.label === "string" && o.label !== "" ? o.label : w[o.team];
    return o.number === undefined || o.number === "" ? name : `${name} ${o.number}`;
  };
  if (snap.trails.length > 0) {
    out.push({
      id: "replay-trails",
      kind: "lines",
      moving: true,
      keys: snap.trails.map((line) => line.id),
      coords: snap.trails.map((line) => line.points),
      layer: {
        ...base,
        kind: "lines",
        id: "replay-trails",
        title: fill(w.trail, { s: isNum(look.trail) ? look.trail : 2 }),
        data: snap.trails.map((line) => ({ points: line.points, team: ROLE(line.team), color: ROLE(line.team) === undefined ? INK : undefined })),
        style: { scale: 0.7, opacity: 0.6 },
      } as Layer,
    });
  }
  // Events: lines for the ones that went from one place to another, marks for the ones that happened at one.
  const lines: { x: number; y: number; x2: number; y2: number; team?: "home" | "away"; outcome: string; title: string }[] = [];
  const marks: { x: number; y: number; team?: "home" | "away"; shape: string; outcome?: string; title: string }[] = [];
  const lineKeys: string[] = [];
  const markKeys: string[] = [];
  for (const a of snap.events) {
    const e = a.event;
    const title = describeEvent(e, language, start);
    const team = e.team === "home" || e.team === "away" ? e.team : undefined;
    if (!isNum(a.x) || !isNum(a.y)) continue;
    const ended = isNum(a.x2) && isNum(a.y2) && (a.x2 !== a.x || a.y2 !== a.y);
    if (ended && (e.kind === "pass" || e.kind === "shot" || e.kind === "goal")) {
      lines.push({ x: a.x, y: a.y, x2: a.x2 as number, y2: a.y2 as number, team, outcome: e.kind === "pass" ? "complete" : e.kind === "shot" ? "shot" : "goal", title });
      lineKeys.push(`e${a.index}`);
    }
    if (e.kind === "goal") {
      marks.push({ x: ended ? (a.x2 as number) : a.x, y: ended ? (a.y2 as number) : a.y, team, shape: "star", outcome: "goal", title });
      markKeys.push(`e${a.index}`);
    } else if (!ended || (e.kind !== "pass" && e.kind !== "shot")) {
      marks.push({ x: a.x, y: a.y, team, shape: e.kind === "pass" ? "circle" : e.kind === "shot" ? "x" : e.kind === "whistle" ? "cross" : "diamond", outcome: e.kind === "pass" ? "complete" : e.kind === "shot" ? "shot" : undefined, title });
      markKeys.push(`e${a.index}`);
    }
  }
  if (lines.length > 0) {
    out.push({ id: "replay-event-lines", kind: "lines", moving: false, keys: lineKeys, coords: [], layer: { ...base, kind: "arrows", id: "replay-event-lines", title: w.eventLines, data: lines, style: { scale: 1.4 } } as Layer });
  }
  if (marks.length > 0) {
    out.push({ id: "replay-events", kind: "points", moving: false, keys: markKeys, coords: [], layer: { ...base, kind: "points", id: "replay-events", title: fill(marks.length === 1 ? w.eventsOne : w.events, { n: marks.length }), data: marks, style: { scale: 1.5 } } as Layer });
  }
  const pick = (teams: readonly ReplayTeam[]): ReplayObject[] => snap.objects.filter((o) => teams.includes(o.team));
  const officials = pick(["official"]);
  if (officials.length > 0) {
    out.push({
      id: "replay-officials",
      kind: "points",
      moving: true,
      keys: officials.map((o) => o.id),
      coords: officials.map((o): P => [o.x, o.y]),
      layer: { ...base, kind: "points", id: "replay-officials", title: w.official, data: officials.map((o) => ({ x: o.x, y: o.y, shape: "triangle" as const, title: nameOf(o) })), style: { scale: 1.5 * size, fill: "var(--ky-layer)" } } as Layer,
    });
  }
  const players = pick(["home", "away"]);
  // The players' layer is always there, so that a frame is never without one.
  out.push({
    id: "replay-players",
    kind: "points",
    moving: true,
    keys: players.map((o) => o.id),
    coords: players.map((o): P => [o.x, o.y]),
    layer: { ...base, kind: "points", id: "replay-players", title: w.players, data: players.map((o) => ({ x: o.x, y: o.y, team: ROLE(o.team), shape: o.team === "home" ? ("circle" as const) : ("square" as const), title: nameOf(o) })), style: { scale: 2.3 * size } } as Layer,
  });
  const numbered = look.numbers === false ? [] : players.filter((o) => o.number !== undefined && o.number !== "");
  if (numbered.length > 0) {
    out.push({
      id: "replay-numbers",
      kind: "text",
      moving: true,
      keys: numbered.map((o) => o.id),
      coords: numbered.map((o): P => [o.x, o.y]),
      layer: { ...base, kind: "text", id: "replay-numbers", title: w.numbers, data: numbered.map((o) => ({ x: o.x, y: o.y, text: o.number as string | number })) } as Layer,
    });
  }
  const balls = pick(["ball", "puck"]);
  if (balls.length > 0) {
    out.push({
      id: "replay-ball",
      kind: "points",
      moving: true,
      keys: balls.map((o) => o.id),
      coords: balls.map((o): P => [o.x, o.y]),
      layer: { ...base, kind: "points", id: "replay-ball", title: `${w.ball}, ${w.puck}`, data: balls.map((o) => ({ x: o.x, y: o.y, title: nameOf(o) })), style: { scale: 1.2 * size, fill: INK } } as Layer,
    });
  }
  return out;
}

/** The data layers of one frame, to put in a drawing's `layers` (after your own): the trails, the events' marks, the players with their numbers, the ball. */
export function replayLayers(timeline: ReplayTimeline, t: number, look: ReplayLook = {}, language: Language = "en"): Layer[] {
  return replayGroups(timeline, replaySnapshot(timeline, t, look), look, language).map((group) => group.layer);
}

/** The sentence a replay adds to the drawing's description: its length, what it tracks and how many events it holds. It does not change with the time. */
export function replaySummary(timeline: ReplayTimeline, language: Language = "en"): string {
  const p = prepare(timeline);
  const words = KYOGIJO_STRINGS[language === "ja" ? "ja" : "en"];
  const w = words.replay;
  const counts = new Map<string, number>();
  for (const o of p.first.values()) counts.set(o.team, (counts.get(o.team) ?? 0) + 1);
  const list = TEAMS.filter((team) => counts.has(team))
    .map((team) => fill(words.layers.item, { name: w[team], n: counts.get(team) as number }))
    .join(words.layers.listSep);
  const { stop, gap } = words.said;
  const parts = [`${fill(w.title, { time: replaySpoken(p.end - p.start, w) })}${stop}`, `${fill(p.ids.length === 1 ? w.objectsOne : w.objects, { n: p.ids.length })}${stop}`, fill(words.layers.teams, { list })];
  if (p.events.length > 0) parts.push(`${fill(p.events.length === 1 ? w.eventsOne : w.events, { n: p.events.length })}${stop}`);
  return parts.join(gap);
}

/** A function that puts places in a timeline's frame on the surface of a drawing, in feet. */
export function replayPlacer(options: SurfaceOptions | ScoreOptions, timeline: ReplayTimeline): (points: readonly P[]) => P[] {
  const env = envFor(options, undefined);
  const base = layerBase(timeline) as LayerBase;
  const unit = unitOfLayer(base, env);
  return (points) => place(base, env, points, unit).map(([x, y]): P => [x, y]);
}

/**
 * One frame of a replay as an SVG string: the drawing `drawKyogijo` makes of `options`, with the players, their numbers, the ball and its trail, and
 * the events that are on the surface at `t`, laid on it as data layers. The same options, timeline and time always give the same string. Without
 * an `id` the drawing's ids come from the options and the timeline, not from the time, so that every frame of a replay has the same ids.
 * @example
 * ```ts
 * import { drawFrame } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * import type { ReplayTimeline } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const timeline: ReplayTimeline = {
 *   from: "nhl-api",
 *   frames: [0, 1, 2].map((t) => ({ t, objects: [
 *     { id: "h1", team: "home", number: 9, x: 10 + t * 12, y: 5 },
 *     { id: "a1", team: "away", number: 4, x: 40 - t * 5, y: -8 },
 *     { id: "puck", team: "puck", x: 10 + t * 12, y: 5 },
 *   ] })),
 *   events: [{ t: 2, kind: "goal", team: "home", x: 34, y: 5 }],
 * };
 * const svg = drawFrame({ sport: "nhl" }, timeline, 1.5);
 * console.log(svg.startsWith("<svg"), svg === drawFrame({ sport: "nhl" }, timeline, 1.5), svg.includes("Shirt numbers"));
 * // true true true
 * ```
 */
export function drawFrame(options: SurfaceOptions | ScoreOptions, timeline: ReplayTimeline, t: number, look: ReplayLook = {}): string {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const id = options.id ?? replayId(options, timeline);
  const withId = { ...options, id } as SurfaceOptions | ScoreOptions;
  const layers = replayLayers(timeline, t, look, language);
  let description = options.description;
  if (description === undefined) {
    // The drawing's own description is made from its layers' summaries; a replay's layers change with the time, so its sentence is fixed.
    const own = options.layers === undefined || options.layers.length === 0 ? [] : renderLayers(withId, options.layers).summaries;
    const { colon, gap } = KYOGIJO_STRINGS[language].said;
    description = `${describe(options).description}${gap}${KYOGIJO_STRINGS[language].layers.data}${colon}${[...own, replaySummary(timeline, language)].join(gap)}`;
  }
  return drawKyogijo({ ...withId, description, layers: [...(options.layers ?? []), ...layers] });
}

/** The prefix of the ids in a replay's drawing when the options give none: a hash of the options and of the timeline's size, not of the time. */
export const replayId = (options: SurfaceOptions | ScoreOptions, timeline: ReplayTimeline): string => `ky-${hash(JSON.stringify([options, replayInfo(timeline), VERSION]))}`;

/**
 * The events of a timeline as an HTML table, for a reader who cannot see the drawing: the time, the kind, the team and what is said of it. Every cell is escaped.
 * @example
 * ```ts
 * import { replayTable } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const html = replayTable({ frames: [{ t: 0, objects: [] }], events: [{ t: 12, kind: "goal", team: "home", label: "Goal, Rivera" }] });
 * console.log(html.includes("<td>0:12</td>"), html.includes("Goal, Rivera"));
 * // true true
 * ```
 */
export function replayTable(timeline: ReplayTimeline, options: { language?: Language; className?: string } = {}): string {
  const p = prepare(timeline);
  const language: Language = options.language === "ja" ? "ja" : "en";
  const words = KYOGIJO_STRINGS[language];
  const w = words.replay;
  const cls = (options.className ?? "ky-table").replace(/[^\w -]/g, "");
  const rows = p.events
    .map((e, n) => `<tr><th scope="row">${n + 1}</th><td>${esc(replayClock(e.t - p.start))}</td><td>${esc(kindWord(w, e.kind))}</td><td>${e.team === "home" || e.team === "away" ? esc(w[e.team]) : ""}</td><td>${esc(describeEvent(e, language, p.start))}</td></tr>`)
    .join("");
  return `<table class="${cls}" data-kind="replay"><caption>${esc(fill(p.events.length === 1 ? w.eventsOne : w.events, { n: p.events.length }))}</caption><thead><tr><th scope="col">${esc(words.layers.tableNo)}</th><th scope="col">${esc(w.time)}</th><th scope="col">${esc(w.event)}</th><th scope="col">${esc(words.layers.tableTeam)}</th><th scope="col">${esc(words.layers.tableNote)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}
