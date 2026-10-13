// The leagues: each variant of a family of surface, with its rulebook's figures, its names and its sources.
export { FAMILY_OF, LEAGUES, LEAGUE_SOURCES, VARIANTS, chooseLeague, courtOf, diamondOf, fieldOf, hasHistory, leagueAt, leagueAtOf, leagueById, leagueChanges, leagueFigures, leagueIds, leagueSeason, leagueSize, netOf, rinkOf, sheetOf } from "./leagues.ts";
export type { BaseballLeague, BasketballLeague, CourtFigures, CurlingLeague, SheetFigures, BadmintonFigures, BadmintonLeague, FreeZone, FreeZones, NetFigures, NetLeague, NetSport, PickleballFigures, PickleballLeague, TableTennisFigures, TableTennisLeague, TennisFigures, TennisLeague, VolleyballFigures, VolleyballLeague, CourtMarks, DiamondFigures, Family, FootballLeague, HockeyLeague, League, LeagueAt, LeagueChange, LeagueSource, LeagueSpan, Named, RinkFigures } from "./leagues.ts";
export { MLB_DIAMOND } from "./leagues/baseball.ts";
export { NBA_COURT } from "./leagues/basketball.ts";
export { NHL_RINK } from "./leagues/hockey.ts";
export { CURLING_CANADA_SHEET, CURLING_LEAGUES, WCF_SHEET } from "./leagues/curling.ts";
export { BADMINTON_LEAGUES, BWF_BADMINTON, FIVB_BEACH, FIVB_INDOOR, ITF_TENNIS, ITTF_TABLE, PICKLEBALL_LEAGUES, TABLE_TENNIS_LEAGUES, TENNIS_LEAGUES, USAP_PICKLEBALL, VOLLEYBALL_LEAGUES } from "./leagues/courts.ts";
