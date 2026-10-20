// Kyogijo Stadiums 競技場: sports surfaces as SVG, drawn to scale, with the teams and the score on them.
export { COLOR_PROPERTIES, SPORTS, crowdStands, describe, drawBadge, drawKyogijo, drawScore, drawSurface, isPortrait, statusLabel, statusText, winnerOf } from "./draw.ts";
export { HOME_FIRST, HOME_FIRST_LEAGUES, homeSideFor } from "./homeside.ts";
export { inkOn, luminance, rgbOf, safeColour, safePicture } from "./colour.ts";
export { safeLogo } from "./logo.ts";
export { useEmblems } from "./emblems-source.ts";
export type { EmblemDrawOptions, EmblemId, EmblemRef, EmblemRenderer, EmblemStyleName } from "./emblems-source.ts";
export { useFlags } from "./flags-source.ts";
export type { FlagRenderer, FlagRequest, FlagShape } from "./flags-source.ts";
export { OUTCOMES, drawLayers, layerTable } from "./layers.ts";
export { RANGES } from "./ranges.names.ts";
export { BACKGROUND_OPACITY, BACKGROUND_PATTERNS, KYOGIJO_BACKGROUND_STYLE } from "./background.ts";
export type { Background, BackgroundFit, BackgroundOptions, BackgroundPattern } from "./background.ts";
export { BOARD_CLEAR, BOARD_POSITIONS, placeBoard } from "./overlay.ts";
export type { BoardBox, BoardOptions, BoardPoint, BoardPosition } from "./overlay.ts";
export { FIELD_SPORTS, fieldPlan, isFieldSport } from "./fields.ts";
export { POOL_SPORTS, isPoolSport, poolPlan, swimPlan, venueLayout } from "./pool.ts";
export type { ArtisticPlan, Board, DivePlan, LanePlan, PoloPlan, PoolPlan, Rope, RopeColour, SwimPlan, VenueItem, VenueLayout } from "./pool.ts";
export { formatTime, parseTime } from "./pool.race.ts";
export type { DeckLook, DivingPlatform, PaceOptions, PoolKind, PoolLook, PoolRace, PoolSection, RaceShow, Swimmer, SwimmerStatus, VenueOptions, VenuePool } from "./pool.types.ts";
export type { Area as FieldArea, FieldPlan, GoalPlan as FieldGoalPlan, Outline as FieldOutline, Shape as FieldShape } from "./fields.types.ts";
export { KYOGIJO_FIELDS_STYLE } from "./fields.style.ts";
export { KYOGIJO_ATHLETICS_STYLE, KYOGIJO_TRACK_STYLE } from "./athletics.style.ts";
export { KYOGIJO_SKATING_STYLE } from "./skating.style.ts";
export { KYOGIJO_BUDO_STYLE } from "./budo.style.ts";
export { dojo, drawDojo } from "./budo/dojo.api.ts";
export type { Dojo, Tatami } from "./budo/dojo.api.ts";
export type { BudoScore, BudoStyle, DojoSpec } from "./budo/types.ts";
export type { SkatingDiscipline, SkatingFurniture, SkatingInfield, SkatingRace, SkatingStyle } from "./skating/types.ts";
export type { AthleticsFieldEvent, AthleticsInfield, AthleticsRace, AthleticsStyle, AthleticsTrackLook, WaterJump } from "./athletics/types.ts";
export type { RangeInfo } from "./ranges.names.ts";
export { rampColour } from "./layers.marks.ts";
export { HEAT_RAMPS, HEAT_RAMP_NAMES } from "./heat.colour.ts";
export { ZONE_SETS, ZONE_SET_IDS } from "./heat.zones.ts";
export type { Bandwidth, ContourLayer, HeatBase, HeatBins, HeatDatum, HeatLabels, HeatLegend, HeatRamp, HeatRampName, HeatStatistic, HeatmapLayer, HexOrientation, HexbinLayer, LegendLayer, Reducer, StatisticName, ZoneSetId, ZonesLayer } from "./heat.types.ts";
export type { ArrowsLayer, Comet, Layer, LayerBase, LayerKind, LayerTeam, LineDatum, LineStyle, LinesLayer, MarkDatum, MarkShape, OutcomeStyle, Paint, PointDatum, PointStyle, PointsLayer, Scale, TableOptions, TextDatum, TextLayer, TextStyle } from "./layers.types.ts";
export { KYOGIJO_STRINGS } from "./strings.ts";
export type { KyogijoWords } from "./strings.ts";
export { KYOGIJO_COURTS_STYLE } from "./courts.style.ts";
export { HARDWOOD_SMALL, KYOGIJO_HARDWOOD_STYLE } from "./hardwood.ts";
export { KYOGIJO_CROWD_STYLE } from "./crowd.draw.ts";
export { GRIDIRON_GROUNDS, WALL_SEATS, outlinePath, outlinePoints } from "./crowd.ts";
export type { CrowdStands, StandGap, StandRing, StandSector, Outline as StandOutline } from "./crowd.ts";
export { KYOGIJO_MARK_STYLE } from "./mark.ts";
export { DRIVE_CODES, readSituation, situationText } from "./situation.ts";
export type { BaseballSituation, DriveLeg, DriveResult, FootballSituation, HockeySituation, ShootoutAttempt, ShootoutRound, Situation, SituationContext, SituationRead, SituationTeam, HockeyRead, BaseballRead, FootballRead, DriveRead } from "./situation.ts";
export { KYOGIJO_SITUATION_STYLE } from "./situation.style.ts";
export { KYOGIJO_PAGEANT_MOTION, KYOGIJO_PAGEANT_STYLE } from "./pageant.style.ts";
export { KYOGIJO_POOL_STYLE } from "./pool.style.ts";
export { KYOGIJO_CURLING_STYLE, KYOGIJO_HEAT_STYLE, KYOGIJO_NOTE_STYLE, KYOGIJO_STYLE, KYOGIJO_TEAM_STYLE, KYOGIJO_WALLS_STYLE } from "./style.ts";
export { KYOGIJO_LOOK_STYLE, LOOKS, LOOK_NAMES, LOOK_PAIRS, contrastOf, groupOf, lookPalette, lookStyle } from "./look.ts";
export type { Group as LookGroup, Look, Palette as LookPalette, PaletteKey as LookPaletteKey } from "./look.ts";
export { FEATURES, FEATURE_INFO, KYOGIJO_FEATURE_STYLE } from "./features.ts";
export type { Feature } from "./features.ts";
export type { DelaunayLayer, FlowLayer, Formation, FormationLayer, FormationPlayer, FormationPosition, FormationSport, HullLayer, LineupLayer, LineupPlayer, MoveDatum, NetworkLayer, NetworkNode, PassDatum, PlayerDatum, SonarLayer, VoronoiLayer } from "./team.types.ts";
export { COURT_THEMES } from "./themes.ts";
export { abbreviate, capitals, fitLines, textWidth } from "./text.ts";
export type { FittedLines } from "./text.ts";
export { PARKS, PARK_IDS, fenceFor, parkById, parkByName, parkByWikidata, parkNameIn, parkOfficialName, parkPointsIn, parkQuirksIn, parkSourceUrl, parkUnit, parkWallsIn, parksByName } from "./parks.ts";
export { officialName, plainName } from "./names.ts";
export type { PlaceAlias, PlaceNameKind } from "./names.ts";
export type { CoverQuirk, DugoutSide, HillQuirk, OverhangQuirk, Park, ParkData, ParkDugouts, ParkPeriod, ParkPeriodData, ParkQuirk, ParkSource, ParkWall, ParkWallData, PointQuirk, QuirkKind, WallPlace } from "./parks.ts";
export { ERA_CURRENT, ERA_SOURCES, ERA_SPORTS, eraChanges, eraRange, eraStates, footballIn, rulesFor, seasonLabel } from "./eras.ts";
export type { EraChange, EraRules, EraRulesOf, EraSource, EraSpan, EraSport, FootballRules, MlbRules, NbaRules, NhlRules } from "./eras.ts";
export { ARENA_IDS, ARENAS, arenaById, arenaByName, arenaByWikidata, arenaCourtIn, arenaNameIn, arenaOfficialName, arenaRinkIn, arenaSourceUrl, arenasByName } from "./arenas.ts";
export type { Arena, ArenaCapacity, ArenaData, ArenaName, ArenaSize, ArenaSource } from "./arenas.ts";
export { GROUND_IDS, GROUNDS, groundById, groundByName, groundByWikidata, groundNameIn, groundOfficialName, groundSourceUrl, groundsByName, groundsHosting } from "./grounds.ts";
export type { Ground, GroundCompetition, GroundData, GroundName, GroundSource, GroundTournament } from "./grounds.ts";
export { AFL_GROUNDS, FAMILY_OF, LEAGUES, LEAGUE_SOURCES, VARIANTS, chooseLeague, hasHistory, leagueAt, leagueById, leagueChanges, leagueFigures, leagueIds, leagueSeason, leagueSize } from "./leagues.ts";
export type { BaseballLeague, BasketballLeague, CourtFigures, CourtMarks, DiamondFigures, Family, FootballLeague, HockeyLeague, League, LeagueAt, LeagueChange, LeagueSource, LeagueSpan, Named, RinkFigures } from "./leagues.ts";
export { SURFACE_UNITS, UNITS, convertLength, isUnit } from "./units.ts";
export type { Unit } from "./units.ts";
export { SOCCER, SOCCER_PITCHES, SOCCER_PITCH_IDS, soccerPitchClass, soccerSpec } from "./surfaces/soccer-spec.ts";
export type { SoccerPitchClass, SoccerPitchId, SoccerSize, SoccerSpec } from "./surfaces/soccer-spec.ts";
export { SOCCER_PROVIDER_IDS, SOCCER_PROVIDERS, frameMatrix, rescale, soccerFrame, soccerLandmarks } from "./surfaces/soccer-providers.ts";
export type { Rescaler, SoccerFrame, SoccerProvider, SoccerProviderId } from "./surfaces/soccer-providers.ts";
export { VERSION } from "./version.ts";
export type {
  AxesOptions,
  Box,
  Colors,
  CourtStyle,
  CrowdOptions,
  CrowdShape,
  Detail,
  DirectionOptions,
  BudoSport,
  FieldSport,
  FieldStyle,
  Fence,
  GoalInfo,
  GoalStyle,
  HardwoodOptions,
  Language,
  NetStyle,
  LineDash,
  LineWidth,
  LookName,
  Orientation,
  PoolSport,
  PoolStyle,
  QuirkName,
  QuirkOptions,
  RangeBox,
  PageantOptions,
  PageantStyle,
  RangeName,
  RangeNamed,
  ScoreOptions,
  Side,
  Size,
  Sport,
  StatusWord,
  StripePattern,
  SurfaceOptions,
  Team,
  TeamMark,
  Theme,
  WallOptions,
} from "./types.ts";
