// The ice skating rinks: the standard 400 m speed skating track, the short track oval and the figure skating rink, with the plan of each, the track's geometry (a point of a lane, the start of a race, the
// lap of the crossing), the races and the elements, and the data: the pairs of a race, the starting positions of a short track race, the results, a replay and the elements of a programme as marks.
export { skatingPairs, skatingGrid, skatingResults, skatingReplay, figureElements, formatTime, distanceSkated } from "./charts.skating.ts";
export type { DrawTotals, ElementTotals, FigureElementsOptions, SkatingElement, SkatingEntry, SkatingPair, SkatingRaceOptions, SkatingReplay, SkatingReplayOptions, SkatingResult, SkatingResultsTotals, SkatingRunner, SkatingStarter } from "./charts.skating.ts";
export { ELEMENT_KINDS, ELEMENT_NAMES, LONG_TRACK_RACES, LONG_TRACK_RACE_IDS, RACES, RACE_IDS, SHORT_TRACK_RACES, SHORT_TRACK_RACE_IDS, raceById } from "./skating/events.ts";
export type { ElementKind } from "./skating/events.ts";
export { disciplineOf, furnitureOf, racesOf, skatingLeague, skatingPlan } from "./skating/plan.ts";
export type { MBox, MMark, MRange, SkatingPlan } from "./skating/plan.ts";
export { finishAt, laneEdges, laneRadius, longOval, outerEdge, pose, startOf } from "./skating/track.ts";
export type { Lane, LongOval, Pose } from "./skating/track.ts";
export { markRace } from "./skating/long.ts";
export type { RaceMarks, StartPlacement } from "./skating/long.ts";
export { shortOval, shortPose, startingPositions, startsOnOppositeStraight, trackLines } from "./skating/short.ts";
export type { ShortOval } from "./skating/short.ts";
export { FURNITURE, JUDGES, furnitureBoxes } from "./skating/figure.ts";
export { ISU_FIGURE_RINK, ISU_LONG_TRACK, ISU_LONG_TRACK_TABLE, ISU_SHORT_TRACK, SKATING_LEAGUES } from "./leagues/skating.ts";
export type { FigureRinkFigures, LongTrackFigures, ShortTrackFigures, SkatingFigures, SkatingLeague } from "./leagues/skating.ts";
export { KYOGIJO_SKATING_STYLE } from "./skating.style.ts";
export type { LongTrackRace, RaceInfo, ShortTrackRace, SkatingDiscipline, SkatingFurniture, SkatingInfield, SkatingRace, SkatingStyle } from "./skating/types.ts";
