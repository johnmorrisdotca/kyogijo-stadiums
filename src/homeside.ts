// Which side the home team is drawn on when the caller does not say. Sports whose scores are listed "home v away" put the home team first, on the
// left; the North American leagues list the visitor first ("away at home") and keep the home team on the right. See docs/score.md for the reasons.
import type { Side, Sport } from "./types.ts";

/**
 * Whether each sport lists the home team first by default. `true` puts the home team on the left, `false` on the right.
 * A `league` can differ from its sport (see `HOME_FIRST_LEAGUES`); an explicit `homeSide` always wins over both.
 */
export const HOME_FIRST: Readonly<Record<Sport, boolean>> = Object.freeze({
  soccer: true,
  rugby: true,
  afl: true,
  gaelic: true,
  fieldhockey: true,
  handball: true,
  cricket: true,
  // Water polo lists the home team first. A swimming, diving or artistic swimming dual meet follows the North American convention: the visitor is listed first.
  waterpolo: true,
  swimming: false,
  diving: false,
  artisticswimming: false,
  // North American professional and college leagues, and the leagues that follow them: the visitor is listed first.
  lacrosse: false,
  nfl: false,
  cfl: false,
  ifaf: false,
  nhl: false,
  nba: false,
  mlb: false,
  curling: false,
  // The boards of the net sports are rows in draw order, not home against away: the layout they have always had.
  tennis: false,
  volleyball: false,
  badminton: false,
  pickleball: false,
  tabletennis: false,
  padel: false,
  squash: false,
  racquetball: false,
  sepaktakraw: false,
  teqball: false,
  roundnet: false,
  // Netball is scored as a goals sport, not in sets, and is listed "home v away" in the Commonwealth countries where it is played most: the home team is first, on the left.
  netball: true,
});

/** The leagues whose convention is not their sport's: the international federation's lacrosse lists the home team first. */
export const HOME_FIRST_LEAGUES: Readonly<Partial<Record<Sport, Readonly<Record<string, boolean>>>>> = Object.freeze({
  lacrosse: Object.freeze({ "world-men": true, "world-women": true, "world-box": true }),
});

/** The side the home team is on by default for a sport, and a league of it when it has a convention of its own: `left` (home first) or `right` (away first). */
export function homeSideFor(sport: Sport, league?: string): Side {
  const own = league === undefined ? undefined : HOME_FIRST_LEAGUES[sport]?.[league];
  return (own ?? HOME_FIRST[sport] ?? false) ? "left" : "right";
}

/** The side the home team is drawn on: the caller's `homeSide` when it is `left` or `right`, else the default for the sport (and league). */
export function resolveHomeSide(o: { sport?: Sport; league?: string; homeSide?: Side }): Side {
  if (o.homeSide === "left" || o.homeSide === "right") return o.homeSide;
  return o.sport === undefined ? "right" : homeSideFor(o.sport, typeof o.league === "string" ? o.league : undefined);
}
