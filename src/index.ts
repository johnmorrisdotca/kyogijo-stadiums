// Kyogijo 競技場: sports surfaces as SVG, drawn to scale, with the teams and the score on them.
export { COLOR_PROPERTIES, SPORTS, describe, drawBadge, drawKyogijo, drawScore, drawSurface, isPortrait, statusLabel, statusText, winnerOf } from "./draw.ts";
export { inkOn, luminance, rgbOf, safeColour, safeLogo } from "./colour.ts";
export { OUTCOMES, drawLayers, layerTable } from "./layers.ts";
export { rampColour } from "./layers.marks.ts";
export { HEAT_RAMPS, HEAT_RAMP_NAMES } from "./heat.colour.ts";
export { ZONE_SETS, ZONE_SET_IDS } from "./heat.zones.ts";
export type { Bandwidth, ContourLayer, HeatBase, HeatBins, HeatDatum, HeatLabels, HeatLegend, HeatRamp, HeatRampName, HeatStatistic, HeatmapLayer, HexOrientation, HexbinLayer, LegendLayer, Reducer, StatisticName, ZoneSetId, ZonesLayer } from "./heat.types.ts";
export type { ArrowsLayer, Comet, Layer, LayerBase, LayerKind, LayerTeam, LineDatum, LineStyle, LinesLayer, MarkDatum, MarkShape, OutcomeStyle, Paint, PointDatum, PointStyle, PointsLayer, Scale, TableOptions, TextDatum, TextLayer, TextStyle } from "./layers.types.ts";
export { KYOGIJO_STRINGS } from "./strings.ts";
export type { KyogijoWords } from "./strings.ts";
export { KYOGIJO_HEAT_STYLE, KYOGIJO_STYLE } from "./style.ts";
export { COURT_THEMES } from "./themes.ts";
export { abbreviate, capitals, fitLines, textWidth } from "./text.ts";
export type { FittedLines } from "./text.ts";
export { PARKS, PARK_IDS, fenceFor, parkById, parkByWikidata, parkPointsIn, parkSourceUrl, parkUnit } from "./parks.ts";
export type { Park, ParkData, ParkPeriod, ParkPeriodData, ParkSource } from "./parks.ts";
export { ERA_CURRENT, ERA_SOURCES, ERA_SPORTS, eraChanges, eraRange, eraStates, footballIn, rulesFor, seasonLabel } from "./eras.ts";
export type { EraChange, EraRules, EraRulesOf, EraSource, EraSpan, EraSport, FootballRules, MlbRules, NbaRules, NhlRules } from "./eras.ts";
export { GROUND_IDS, GROUNDS, groundById, groundByWikidata, groundNameIn, groundSourceUrl, groundsHosting } from "./grounds.ts";
export type { Ground, GroundCompetition, GroundData, GroundName, GroundSource, GroundTournament } from "./grounds.ts";
export { SURFACE_UNITS, UNITS, convertLength, isUnit } from "./units.ts";
export type { Unit } from "./units.ts";
export { SOCCER, SOCCER_PITCHES, SOCCER_PITCH_IDS, soccerPitchClass, soccerSpec } from "./surfaces/soccer-spec.ts";
export type { SoccerPitchClass, SoccerPitchId, SoccerSize, SoccerSpec } from "./surfaces/soccer-spec.ts";
export { SOCCER_PROVIDER_IDS, SOCCER_PROVIDERS, frameMatrix, rescale, soccerFrame, soccerLandmarks } from "./surfaces/soccer-providers.ts";
export type { Rescaler, SoccerFrame, SoccerProvider, SoccerProviderId } from "./surfaces/soccer-providers.ts";
export { VERSION } from "./version.ts";
export type {
  Box,
  Colors,
  CourtStyle,
  Detail,
  Fence,
  GoalStyle,
  Language,
  Orientation,
  ScoreOptions,
  Side,
  Size,
  Sport,
  StatusWord,
  StripePattern,
  SurfaceOptions,
  Team,
  Theme,
} from "./types.ts";
