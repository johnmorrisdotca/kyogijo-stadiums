// Replay: tracking data over time on a surface. The frame, the clock and the pure functions between them; the controls and the animation
// are in the mount (`mountKyogijo(...).replay(...)`) and in `<kyogijo-field>`.
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
export { activeEvents, describeEvent, drawFrame, eventsBetween, interpolate, possession, replayClock, replayEvents, replayInfo, replayLayers, replaySnapshot, replaySummary, replayTable, replayTimes, trails } from "./replay.ts";
export type { ReplaySnapshot } from "./replay.ts";
export { boardClock, replayBoard, replayGameClock, replayPeriods } from "./replay.board.ts";
export type { ReplayBoardState, ReplayGameClock } from "./replay.board.ts";
export { addDeadTime, deadSeconds, replayStoppages, restartsBetween, stoppageAt } from "./replay.deadtime.ts";
export type { DeadStop, DeadTimeRules } from "./replay.deadtime.ts";
export { HOCKEY_BLUE_LINE, HOCKEY_DEAD_TIME, HOCKEY_DOTS, HOCKEY_RULES, hockeyFaceoffDot, hockeyFormation, hockeyStopOf, isHockeyDot } from "./replay.hockey.ts";
export type { HockeyRole, HockeyStop, HockeyStopAt } from "./replay.hockey.ts";
export { alongPool, distanceAt, progressOf, raceTimeline } from "./pool.replay.ts";
export type { Progress, RaceReplayOptions } from "./pool.replay.ts";
export { formatTime, parseTime } from "./pool.race.ts";
export { REPLAY_SPEEDS, REPLAY_SPEED_RANGE, createReplay } from "./replay.control.ts";
export { FOLLOW_LIMITS, FOLLOW_MODES, clampShot, followCamera, followMode, followShot, followStop, followWindow, frameOf, springStep, zoomFor } from "./replay.follow.ts";
export type { FollowBox, FollowCamera, FollowInput, FollowLimits, FollowMode, FollowShot } from "./replay.follow.ts";
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
  ReplayPeriod,
  ReplayReason,
  ReplaySettings,
  ReplayState,
  ReplayStoppage,
  ReplayTeam,
  ReplayTimeline,
  ReplayTrail,
} from "./replay.types.ts";
