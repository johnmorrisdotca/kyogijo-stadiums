// Replay: tracking data over time on a surface. The frame, the clock and the pure functions between them; the controls and the animation
// are in the mount (`mountKyogijo(...).replay(...)`) and in `<kyogijo-field>`.
import "./full.ts";
export { activeEvents, describeEvent, drawFrame, eventsBetween, interpolate, possession, replayClock, replayEvents, replayInfo, replayLayers, replaySnapshot, replaySummary, replayTable, replayTimes, trails } from "./replay.ts";
export type { ReplaySnapshot } from "./replay.ts";
export { alongPool, distanceAt, progressOf, raceTimeline } from "./pool.replay.ts";
export type { Progress, RaceReplayOptions } from "./pool.replay.ts";
export { formatTime, parseTime } from "./pool.race.ts";
export { REPLAY_SPEEDS, REPLAY_SPEED_RANGE, createReplay } from "./replay.control.ts";
export type { ReplayController } from "./replay.control.ts";
export type {
  ActiveEvent,
  Possession,
  ReplayChange,
  ReplayEvent,
  ReplayEventKind,
  ReplayFrame,
  ReplayLook,
  ReplayObject,
  ReplayReason,
  ReplaySettings,
  ReplayState,
  ReplayTeam,
  ReplayTimeline,
  ReplayTrail,
} from "./replay.types.ts";
