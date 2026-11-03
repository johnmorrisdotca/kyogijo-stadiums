// A timeline's events in time order, apart from the replay's frames and its drawing: the follow camera reads them (the stoppages and their face-offs) without loading the rest of the replay.
import type { ReplayEvent, ReplayTimeline } from "./replay.types.ts";

const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** Each timeline's events, read once. */
const CACHE = new WeakMap<ReplayTimeline, ReplayEvent[]>();

/** The events of a timeline, in time order: each one a copy, those without a time or a kind left out. */
export function replayEvents(timeline: ReplayTimeline): readonly ReplayEvent[] {
  const known = CACHE.get(timeline);
  if (known !== undefined) return known;
  const events = Array.isArray(timeline.events) ? timeline.events.filter((e) => typeof e === "object" && e !== null && isNum(e.t) && typeof e.kind === "string").map((e) => ({ ...e })).sort((a, b) => a.t - b.t) : [];
  CACHE.set(timeline, events);
  return events;
}
