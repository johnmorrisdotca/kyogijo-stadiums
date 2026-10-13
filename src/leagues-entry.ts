// The leagues: each variant of a family of surface, with its rulebook's figures, its names and its sources.
export { FAMILY_OF, LEAGUES, LEAGUE_SOURCES, VARIANTS, chooseLeague, courtOf, diamondOf, fieldOf, hasHistory, leagueAt, leagueAtOf, leagueById, leagueChanges, leagueFigures, leagueIds, leagueSeason, leagueSize, rinkOf } from "./leagues.ts";
export type { BaseballLeague, BasketballLeague, CourtFigures, CourtMarks, DiamondFigures, Family, FootballLeague, HockeyLeague, League, LeagueAt, LeagueChange, LeagueSource, LeagueSpan, Named, RinkFigures } from "./leagues.ts";
export { MLB_DIAMOND } from "./leagues/baseball.ts";
export { NBA_COURT } from "./leagues/basketball.ts";
export { NHL_RINK } from "./leagues/hockey.ts";
