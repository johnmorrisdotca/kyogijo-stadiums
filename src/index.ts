// Kyogijo 競技場: sports surfaces as SVG, drawn to scale, with the teams and the score on them.
export { COLOR_PROPERTIES, SPORTS, describe, drawBadge, drawKyogijo, drawScore, drawSurface, isPortrait, statusLabel, statusText, winnerOf } from "./draw.ts";
export { inkOn, luminance, rgbOf, safeColour, safeLogo } from "./colour.ts";
export { KYOGIJO_STRINGS } from "./strings.ts";
export type { KyogijoWords } from "./strings.ts";
export { KYOGIJO_STYLE } from "./style.ts";
export { COURT_THEMES } from "./themes.ts";
export { abbreviate, capitals, fitLines, textWidth } from "./text.ts";
export type { FittedLines } from "./text.ts";
export { PARKS, PARK_IDS, fenceFor, parkById, parkByWikidata, parkPointsIn, parkSourceUrl, parkUnit } from "./parks.ts";
export type { Park, ParkData, ParkPeriod, ParkPeriodData, ParkSource } from "./parks.ts";
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
