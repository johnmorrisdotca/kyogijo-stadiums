// The athletics stadium: the races and the field events, the plan of the track and what is marked on it, the oval's geometry (a point of a lane, the stagger of each lane's start), and the data: lane draws, results, a replay and the marks of throws and jumps.
export { laneDraw, raceResults, raceReplay, fieldMarks, formatTime, distanceRun } from "./charts.athletics.ts";
export type { AthleticsEntry, AthleticsResult, AthleticsRaceOptions, AthleticsRunner, FieldAttempt, FieldMarksOptions, FieldTotals, LaneDrawTotals, RaceReplay, RaceReplayOptions, ResultsTotals } from "./charts.athletics.ts";
export { FIELD_EVENTS, FIELD_EVENT_IDS, RACES, RACE_IDS, fieldEventById, raceById } from "./athletics/events.ts";
export { athleticsLeague, athleticsPlan, eventsOf, racesOf, INDOOR_RACES } from "./athletics/plan.ts";
export type { AthleticsPlan, MBox, MMark, MRange } from "./athletics/plan.ts";
export { breaklineStagger, distanceOn, laneEdge, laneRadius, lap, pose, stagger } from "./athletics/track.ts";
export type { Oval, Pose } from "./athletics/track.ts";
export { firstStart, markRace, staggerOf } from "./athletics/races.ts";
export type { RaceMarks, StartPlacement } from "./athletics/races.ts";
export { ARENA, SECTOR_REACH } from "./athletics/infield.ts";
export { JAVELIN_HALF, SECTOR_ANGLE } from "./athletics/facilities.ts";
export type { Facility } from "./athletics/facilities.ts";
export { HURDLE as STEEPLECHASE_HURDLE, INSIDE as STEEPLECHASE_INSIDE, OUTSIDE as STEEPLECHASE_OUTSIDE, scPose } from "./athletics/steeplechase.ts";
export { ATHLETICS_LEAGUES, WA_SHORT_STAGGER_TABLE, WA_SHORT_TRACK, WA_STAGGER_TABLE, WA_STANDARD_TRACK } from "./leagues/athletics.ts";
export type { AthleticsFigures, AthleticsLeague } from "./leagues/athletics.ts";
export { KYOGIJO_ATHLETICS_STYLE, KYOGIJO_TRACK_STYLE, TRACK_COLOURS } from "./athletics.style.ts";
export type { AthleticsFieldEvent, AthleticsInfield, AthleticsRace, AthleticsStyle, AthleticsTrackLook, FieldEventInfo, RaceInfo, WaterJump } from "./athletics/types.ts";
