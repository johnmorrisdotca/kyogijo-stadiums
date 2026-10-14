// The leagues: for each family of surface (basketball, hockey, football, baseball and softball) the variants a rulebook marks
// differently, each with the figures of its own rulebook in its own unit, its name in English and Japanese, the sources that say so
// and, where a source dates it, the markings it had in earlier seasons. `league` in the options picks one; `sport` names the family
// (`nba` for basketball, `nhl` for hockey, `nfl`, `cfl` and `ifaf` for football, `mlb` for baseball and softball).
// Nothing here draws.
import { BASEBALL_LEAGUES, diamondInFeet, type BaseballLeague, type DiamondSpec } from "./leagues/baseball.ts";
import { BASKETBALL_LEAGUES, courtInFeet, type BasketballLeague, type CourtSpec } from "./leagues/basketball.ts";
import { FOOTBALL_LEAGUES, type FootballLeague } from "./leagues/football.ts";
import { HOCKEY_LEAGUES, rinkInFeet, type HockeyLeague, type RinkSpec } from "./leagues/hockey.ts";
import { CURLING_LEAGUES, sheetInFeet, type CurlingLeague, type SheetSpec } from "./leagues/curling.ts";
import { BADMINTON_LEAGUES, NETBALL_LEAGUES, PADEL_LEAGUES, PICKLEBALL_LEAGUES, RACQUETBALL_LEAGUES, ROUNDNET_LEAGUES, SEPAK_TAKRAW_LEAGUES, SQUASH_LEAGUES, TABLE_TENNIS_LEAGUES, TENNIS_LEAGUES, TEQBALL_LEAGUES, VOLLEYBALL_LEAGUES, netInFeet, type NetLeague } from "./leagues/courts.ts";
import { AFL_LEAGUES, aflInFeet, type AflLeague, type AflSpec } from "./leagues/aussie.ts";
import { CRICKET_LEAGUES, cricketInFeet, type CricketLeague, type CricketSpec } from "./leagues/cricket.ts";
import { FIELD_HOCKEY_LEAGUES, fieldHockeyInFeet, type FieldHockeyLeague, type FieldHockeySpec } from "./leagues/fieldhockey.ts";
import { GAELIC_LEAGUES, gaelicInFeet, type GaelicLeague, type GaelicSpec } from "./leagues/gaelic.ts";
import { HANDBALL_LEAGUES, handballInFeet, type HandballLeague, type HandballSpec } from "./leagues/handball.ts";
import { LACROSSE_LEAGUES, lacrosseInFeet, type LacrosseLeague, type LacrosseSpec } from "./leagues/lacrosse.ts";
import { RUGBY_LEAGUES, rugbyInFeet, type RugbyLeague, type RugbySpec } from "./leagues/rugby.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";
import type { Span } from "./leagues/fields.ts";
import type { Family, LeagueSpan } from "./leagues/types.ts";
import { inFeet } from "./leagues/types.ts";
import type { FootballSpec } from "./geometry.ts";
import type { Sport, SurfaceOptions } from "./types.ts";
import { convertLength, type Unit } from "./units.ts";

export { LEAGUE_SOURCES };
export type { LeagueSource } from "./leagues/sources.ts";
export type { BaseballLeague, BasketballLeague, CurlingLeague, FootballLeague, HockeyLeague };
export { AFL_GROUNDS } from "./leagues/aussie.ts";
export type { AflFigures, AflGround, AflLeague } from "./leagues/aussie.ts";
export type { CricketFigures, CricketLeague } from "./leagues/cricket.ts";
export type { FieldHockeyFigures, FieldHockeyLeague } from "./leagues/fieldhockey.ts";
export type { GaelicFigures, GaelicLeague } from "./leagues/gaelic.ts";
export type { HandballFigures, HandballLeague } from "./leagues/handball.ts";
export type { LacrosseFigures, LacrosseLeague } from "./leagues/lacrosse.ts";
export type { RugbyFigures, RugbyLeague } from "./leagues/rugby.ts";
export type { Span } from "./leagues/fields.ts";
export type { BadmintonFigures, BadmintonLeague, FreeZone, FreeZones, NetFigures, NetLeague, NetSport, NetballFigures, NetballLeague, PadelFigures, PadelLeague, PickleballFigures, PickleballLeague, RacquetballFigures, RacquetballLeague, RoundnetFigures, RoundnetLeague, SepakTakrawFigures, SepakTakrawLeague, SquashFigures, SquashLeague, TableTennisFigures, TableTennisLeague, TennisFigures, TennisLeague, TeqballFigures, TeqballLeague, VolleyballFigures, VolleyballLeague } from "./leagues/courts.ts";
export type { CourtFigures, CourtMarks } from "./leagues/basketball.ts";
export type { RinkFigures } from "./leagues/hockey.ts";
export type { SheetFigures } from "./leagues/curling.ts";
export type { DiamondFigures } from "./leagues/baseball.ts";
export type { Family, LeagueSpan, Named } from "./leagues/types.ts";

/** A league: a variant of a family of surface. */
export type League = BasketballLeague | HockeyLeague | FootballLeague | BaseballLeague | CurlingLeague | NetLeague | LacrosseLeague | RugbyLeague | AflLeague | GaelicLeague | CricketLeague | FieldHockeyLeague | HandballLeague;

/** The family of surface each sport draws; soccer's variants are its pitches (`pitch`), not leagues. */
export const FAMILY_OF: Readonly<Record<Sport, Family | undefined>> = Object.freeze({ nfl: "football", cfl: "football", ifaf: "football", nhl: "hockey", nba: "basketball", mlb: "baseball", soccer: undefined, curling: "curling", tennis: "tennis", volleyball: "volleyball", badminton: "badminton", pickleball: "pickleball", tabletennis: "tabletennis", padel: "padel", squash: "squash", racquetball: "racquetball", sepaktakraw: "sepaktakraw", teqball: "teqball", roundnet: "roundnet", netball: "netball", lacrosse: "lacrosse", rugby: "rugby", afl: "afl", gaelic: "gaelic", cricket: "cricket", fieldhockey: "fieldhockey", handball: "handball" });

/**
 * The leagues each sport can draw, in the order a menu lists them, the sport's own first (the three football sports share their
 * list, the football leagues). Soccer has none.
 */
export const LEAGUES: Readonly<Record<Sport, readonly League[]>> = Object.freeze({
  nba: BASKETBALL_LEAGUES,
  nhl: HOCKEY_LEAGUES,
  nfl: FOOTBALL_LEAGUES,
  cfl: FOOTBALL_LEAGUES,
  ifaf: FOOTBALL_LEAGUES,
  mlb: BASEBALL_LEAGUES,
  soccer: [],
  curling: CURLING_LEAGUES,
  tennis: TENNIS_LEAGUES,
  volleyball: VOLLEYBALL_LEAGUES,
  badminton: BADMINTON_LEAGUES,
  pickleball: PICKLEBALL_LEAGUES,
  tabletennis: TABLE_TENNIS_LEAGUES,
  padel: PADEL_LEAGUES,
  squash: SQUASH_LEAGUES,
  racquetball: RACQUETBALL_LEAGUES,
  sepaktakraw: SEPAK_TAKRAW_LEAGUES,
  teqball: TEQBALL_LEAGUES,
  roundnet: ROUNDNET_LEAGUES,
  netball: NETBALL_LEAGUES,
  lacrosse: LACROSSE_LEAGUES,
  rugby: RUGBY_LEAGUES,
  afl: AFL_LEAGUES,
  gaelic: GAELIC_LEAGUES,
  cricket: CRICKET_LEAGUES,
  fieldhockey: FIELD_HOCKEY_LEAGUES,
  handball: HANDBALL_LEAGUES,
});

/** Every league of every family, once each. */
export const VARIANTS: readonly League[] = Object.freeze([...BASKETBALL_LEAGUES, ...HOCKEY_LEAGUES, ...FOOTBALL_LEAGUES, ...BASEBALL_LEAGUES, ...CURLING_LEAGUES, ...TENNIS_LEAGUES, ...VOLLEYBALL_LEAGUES, ...BADMINTON_LEAGUES, ...PICKLEBALL_LEAGUES, ...TABLE_TENNIS_LEAGUES, ...PADEL_LEAGUES, ...SQUASH_LEAGUES, ...RACQUETBALL_LEAGUES, ...SEPAK_TAKRAW_LEAGUES, ...TEQBALL_LEAGUES, ...ROUNDNET_LEAGUES, ...NETBALL_LEAGUES, ...LACROSSE_LEAGUES, ...RUGBY_LEAGUES, ...AFL_LEAGUES, ...GAELIC_LEAGUES, ...CRICKET_LEAGUES, ...FIELD_HOCKEY_LEAGUES, ...HANDBALL_LEAGUES]);

/** The ids of a sport's leagues. */
export const leagueIds = (sport: Sport): string[] => LEAGUES[sport].map((league) => league.id);

/** A league by its sport and id, or `undefined`. */
export function leagueById(sport: Sport, id: string): League | undefined {
  return LEAGUES[sport].find((league) => league.id === id);
}

/** The unit a league's figures are kept in. */
const figuresUnit = (league: League): Unit => league.figuresUnit ?? league.unit;

/**
 * Which league the options ask for: the league, and the sport it is drawn as. No `league` is the sport's own. A league the sport's
 * own (`nba` for `nba`) is the sport as it is drawn without one; one of the football leagues that is a sport of its own (`cfl`) is that
 * sport. A league of another family, or one that does not exist, is an error that says what to use.
 * @example
 * ```ts
 * import { chooseLeague } from "@johnmorrisdotca/kyogijo-stadiums/leagues";
 * console.log(chooseLeague({ sport: "nba", league: "fiba" }).league?.name.en, chooseLeague({ sport: "nfl", league: "cfl" }).sport);
 * // FIBA basketball court cfl
 * ```
 */
export function chooseLeague(o: Pick<SurfaceOptions, "sport" | "league">): { sport: Sport; league: League | undefined } {
  if (o.league === undefined || o.league === "") return { sport: o.sport, league: undefined };
  const id = String(o.league);
  const family = FAMILY_OF[o.sport];
  if (family === undefined) throw new Error(`"${String(o.sport)}" has no leagues: a soccer pitch is chosen with pitch`);
  const found = leagueById(o.sport, id);
  if (found === undefined) {
    const elsewhere = (Object.keys(FAMILY_OF) as Sport[]).find((sport) => FAMILY_OF[sport] !== family && FAMILY_OF[sport] !== undefined && leagueById(sport, id) !== undefined);
    throw new Error(
      elsewhere === undefined ? `Unknown league "${id}" for "${o.sport}": use one of ${leagueIds(o.sport).join(", ")}` : `"${id}" is a ${FAMILY_OF[elsewhere]} league: use sport "${elsewhere}" for it`,
    );
  }
  if (found.builtIn === true) return { sport: found.family === "football" ? (found.id as Sport) : o.sport, league: undefined };
  return { sport: o.sport, league: found };
}

/** One change of a league's markings: a state of one marking from a season on. */
export interface LeagueChange {
  /** `ncaa-men.threePoint.2019`. */
  id: string;
  league: string;
  /** The marking's name: a key of the league's dimensions. */
  feature: string;
  /** The first season, or `null` for the state before the first change that is cited. */
  from: number | null;
  value: unknown;
  what: string;
  ja: string;
  sources: string[];
}

const historyOf = (league: League): [string, LeagueSpan<unknown>[]][] => Object.entries(league.history ?? {}) as [string, LeagueSpan<unknown>[]][];

/**
 * Every change a source dates in a league's markings, in season order, each with a sentence in English and in Japanese and its
 * sources. A league with no cited history has none (a drawing with a `year` is then the league's rulebook as it is now).
 * @example
 * ```ts
 * import { leagueChanges } from "@johnmorrisdotca/kyogijo-stadiums/leagues";
 * console.log(leagueChanges("nba", "ncaa-men").map((change) => change.id));
 * ```
 */
export function leagueChanges(sport: Sport, id: string): LeagueChange[] {
  const league = leagueById(sport, id);
  if (league === undefined) throw new Error(`Unknown league "${id}" for "${String(sport)}"`);
  return historyOf(league)
    .flatMap(([feature, spans]) => spans.map((span): LeagueChange => ({ id: `${league.id}.${feature}.${span.from === null ? "start" : span.from}`, league: league.id, feature, from: span.from, value: span.value, what: span.what, ja: span.ja, sources: span.sources })))
    .sort((a, b) => (a.from ?? -Infinity) - (b.from ?? -Infinity) || a.id.localeCompare(b.id));
}

/** True when a league has markings a source dates, so that `year` changes its drawing. */
export const hasHistory = (league: League | undefined): boolean => league !== undefined && historyOf(league).length > 0;

/** The league's figures in a season: the rulebook's as it is now, with each marking that has a dated history as it stood then. */
export interface LeagueAt<L extends League = League> {
  league: L;
  /** The season asked for, or `undefined` for today's. */
  year: number | undefined;
  /** The figures in the unit the league keeps them in. */
  figures: L["dimensions"];
  /** The markings that differ from today's. */
  differences: LeagueChange[];
  /** Markings whose history starts later than the season asked for (the first cited state is used). */
  gaps: string[];
}

/** The markings that hold in a season: the last span that began by then, else the first (a gap). */
function spanIn<T>(spans: LeagueSpan<T>[], year: number): { span: LeagueSpan<T>; gap: boolean } {
  let found: LeagueSpan<T> | undefined;
  for (const span of spans) if (span.from === null || span.from <= year) found = span;
  return found === undefined ? { span: spans[0], gap: true } : { span: found, gap: false };
}

/**
 * A league's figures as they were in a season. Without a year, or for a league with no dated history, they are the rulebook's as
 * it is now.
 * @example
 * ```ts
 * import { leagueAt } from "@johnmorrisdotca/kyogijo-stadiums/leagues";
 * console.log(leagueAt("nba", "ncaa-men", 2010).differences.map((change) => change.id));
 * // [ 'ncaa-men.restricted.start' ]
 * ```
 */
export function leagueAt(sport: Sport, id: string, year?: number): LeagueAt {
  const league = leagueById(sport, id);
  if (league === undefined) throw new Error(`Unknown league "${id}" for "${String(sport)}"`);
  return leagueAtOf(league, year);
}

/** `leagueAt` for a league already in hand. */
export function leagueAtOf<L extends League>(league: L, year?: number): LeagueAt<L> {
  const asked = typeof year === "number" && Number.isFinite(year) ? Math.floor(year) : undefined;
  const figures: Record<string, unknown> = { ...(league.dimensions as unknown as Record<string, unknown>) };
  const differences: LeagueChange[] = [];
  const gaps: string[] = [];
  if (asked !== undefined) {
    for (const [feature, spans] of historyOf(league)) {
      const { span, gap } = spanIn(spans, asked);
      figures[feature] = span.value;
      if (gap) gaps.push(feature);
      else if (JSON.stringify(span.value) !== JSON.stringify((league.dimensions as unknown as Record<string, unknown>)[feature])) {
        differences.push({ id: `${league.id}.${feature}.${span.from === null ? "start" : span.from}`, league: league.id, feature, from: span.from, value: span.value, what: span.what, ja: span.ja, sources: span.sources });
      }
    }
  }
  return { league, year: asked, figures: figures as unknown as L["dimensions"], differences, gaps };
}

/** The name of a season as the family writes it: `1979–80` for basketball and hockey, which play across the new year, else `1979`. */
export function leagueSeason(family: Family, year: number): string {
  const y = Math.floor(year);
  return family === "basketball" || family === "hockey" ? `${y}–${String((y + 1) % 100).padStart(2, "0")}` : String(y);
}

/** A basketball court of a league in a season, in feet. */
export const courtOf = (league: BasketballLeague, year?: number): CourtSpec => courtInFeet(leagueAtOf(league, year).figures, figuresUnit(league));
/** An ice rink of a league in a season, in feet. */
export const rinkOf = (league: HockeyLeague, year?: number): RinkSpec => rinkInFeet(leagueAtOf(league, year).figures, figuresUnit(league));
/** A curling sheet of a league, in feet. A sheet has no history; a year is ignored. */
export const sheetOf = (league: CurlingLeague = CURLING_LEAGUES[0]): SheetSpec => sheetInFeet(league.dimensions, league.figuresUnit ?? league.unit);
/** A net sport's court of a league (tennis, volleyball, beach and sitting volleyball, badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball, roundnet and netball), in feet. These courts have no history; a year is ignored. */
export const netOf = <L extends NetLeague>(league: L): L["dimensions"] => netInFeet(league.dimensions, figuresUnit(league));
/** A lacrosse surface of a league, in feet (the box floor, or a field). These have no history; a year is ignored. */
export const lacrosseOf = (league: LacrosseLeague): LacrosseSpec => lacrosseInFeet(league.dimensions, figuresUnit(league));
/** A rugby field of a league, in feet. */
export const rugbyOf = (league: RugbyLeague): RugbySpec => rugbyInFeet(league.dimensions, figuresUnit(league));
/** The Australian football ground, in feet. */
export const aflOf = (league: AflLeague): AflSpec => aflInFeet(league.dimensions, figuresUnit(league));
/** A Gaelic games field of a league (football or hurling), in feet. */
export const gaelicOf = (league: GaelicLeague): GaelicSpec => gaelicInFeet(league.dimensions, figuresUnit(league));
/** A cricket ground of a league, in feet. */
export const cricketOf = (league: CricketLeague): CricketSpec => cricketInFeet(league.dimensions, figuresUnit(league));
/** A field hockey pitch, in feet. */
export const fieldHockeyOf = (league: FieldHockeyLeague): FieldHockeySpec => fieldHockeyInFeet(league.dimensions, figuresUnit(league));
/** A handball court, in feet. */
export const handballOf = (league: HandballLeague): HandballSpec => handballInFeet(league.dimensions, figuresUnit(league));
/** A football field of a league in a season: the spec, in feet. */
export const fieldOf = (league: FootballLeague, year?: number): FootballSpec => inFeet(leagueAtOf(league, year).figures, figuresUnit(league)) as unknown as FootballSpec;
/** A diamond of a league in a season, in feet. */
export const diamondOf = (league: BaseballLeague, year?: number): DiamondSpec => diamondInFeet(leagueAtOf(league, year).figures, figuresUnit(league));

/**
 * The length and the width of a league's surface in a unit (the league's own when none is given): a football field with its end
 * zones, end line to end line. A diamond has no fixed size, its fence is its size.
 * @example
 * ```ts
 * import { leagueSize } from "@johnmorrisdotca/kyogijo-stadiums/leagues";
 * console.log(leagueSize("nba", "nba"));
 * // { length: 94, width: 50, unit: 'ft' }
 * ```
 */
export function leagueSize(sport: Sport, id: string, unit?: Unit): { length: number; width: number; unit: Unit } {
  const league = leagueById(sport, id);
  if (league === undefined) throw new Error(`Unknown league "${id}" for "${String(sport)}"`);
  const to = unit ?? league.unit;
  let feet: { length: number; width: number };
  switch (league.family) {
    case "basketball":
      feet = courtOf(league);
      break;
    case "hockey":
      feet = rinkOf(league);
      break;
    case "curling":
      feet = sheetOf(league);
      break;
    case "tennis": {
      const t = netOf(league);
      feet = { length: t.length, width: t.widthDoubles };
      break;
    }
    case "volleyball":
    case "badminton":
    case "pickleball":
    case "tabletennis":
    case "padel":
    case "squash":
    case "racquetball":
    case "sepaktakraw":
    case "teqball":
    case "roundnet":
    case "netball":
      feet = netOf(league);
      break;
    case "football": {
      const field = fieldOf(league);
      feet = { length: field.length + 2 * field.endZone, width: field.width };
      break;
    }
    case "lacrosse": {
      const f = lacrosseOf(league);
      feet = { length: f.length.drawn, width: f.width.drawn };
      break;
    }
    case "rugby": {
      const f = rugbyOf(league);
      feet = { length: f.length.drawn + 2 * f.inGoal.drawn, width: f.width.drawn };
      break;
    }
    case "afl":
    case "gaelic":
    case "fieldhockey":
    case "handball": {
      const f = league.family === "afl" ? aflOf(league) : league.family === "gaelic" ? gaelicOf(league) : league.family === "fieldhockey" ? fieldHockeyOf(league) : handballOf(league);
      feet = { length: f.length.drawn, width: f.width.drawn };
      break;
    }
    case "cricket": {
      const f = cricketOf(league);
      feet = { length: 2 * f.boundary.drawn, width: 2 * f.boundary.drawn };
      break;
    }
    default:
      throw new Error(`No fixed size for the ${league.family} league "${id}": a diamond's size is its fence`);
  }
  return { length: convertLength(feet.length, "ft", to), width: convertLength(feet.width, "ft", to), unit: to };
}

/** A length in feet written in a unit: metres to two places, feet and inches (`22 ft 1.75 in`), yards to two places. */
function written(feet: number, unit: Unit): string {
  const trim = (n: number, places: number): string => String(Math.round(n * 10 ** places) / 10 ** places);
  if (unit === "m") return `${trim(convertLength(feet, "ft", "m"), 3)} m`;
  if (unit === "yd") return `${trim(feet / 3, 2)} yd`;
  const whole = Math.floor(feet + 1e-9);
  const inches = Math.round((feet - whole) * 12 * 100) / 100;
  return inches === 0 ? `${whole} ft` : whole === 0 ? `${trim(inches, 2)} in` : `${whole} ft ${trim(inches, 2)} in`;
}

/**
 * The key figures of a league in words, each in the unit its rulebook uses: for a table of the leagues (docs/variants.md) and for a
 * test that holds the drawing to the rulebook.
 * @example
 * ```ts
 * import { LEAGUES, leagueFigures } from "@johnmorrisdotca/kyogijo-stadiums/leagues";
 * const fiba = LEAGUES.nba.find((league) => league.id === "fiba")!;
 * console.log(leagueFigures(fiba).slice(0, 2).map(([name, value]) => `${name}: ${value}`).join("; "));
 * // court: 28 m by 15 m; lane: 4.9 m wide
 * ```
 */
export function leagueFigures(league: League): [string, string][] {
  const u = league.unit;
  const w = (feet: number): string => written(feet, u);
  switch (league.family) {
    case "basketball": {
      const c = courtOf(league);
      return [
        ["court", `${w(c.length)} by ${w(c.width)}`],
        ["lane", `${w(c.laneWidth)} wide`],
        ["free-throw line", `${w(c.freeThrowLine)} from the baseline`],
        ["three-point line", c.threePoint === null ? "none" : `${w(c.threePoint.radius)} arc, straights ${w(c.threePoint.sideInset)} from the sidelines`],
        ["restricted area", c.restricted === null ? "none" : `${w(c.restricted)} arc`],
      ];
    }
    case "hockey": {
      const r = rinkOf(league);
      return [
        ["rink", `${w(r.length)} by ${w(r.width)}`],
        ["corner radius", w(r.cornerRadius)],
        ["goal line", `${w(r.goalLine)} from the end boards`],
        ["blue line", `${w(r.blueLine)} from the end boards`],
        ["face-off circle", `${w(r.circleRadius)} radius`],
        ["trapezoid", r.trapezoid === null ? "none" : `${w(r.trapezoid.atGoalLine)} at the goal line, ${w(r.trapezoid.atBoards)} at the boards`],
      ];
    }
    case "curling": {
      const s = sheetOf(league);
      const [twelve, eight, four, button] = s.rings;
      return [
        ["sheet", `${w(s.length)} by ${w(s.width)}`],
        ["least sheet", `${w(s.lengthMin)} by ${w(s.widthMin)}`],
        ["tee to tee", `${w(2 * s.teeFromMiddle)}`],
        ["back line", `${w(s.backLine)} from the tee`],
        ["hog line", `${w(s.hogLine)} from the tee`],
        ["house", `circles of ${w(twelve)}, ${w(eight)} and ${w(four)} radius, a button of ${w(button)}`],
        ["courtesy line", s.courtesy === null ? "none" : `${w(s.courtesy.outsideHog)} outside each hog line`],
      ];
    }
    case "tennis": {
      const t = netOf(league);
      return [
        ["court", `${w(t.length)} by ${w(t.widthDoubles)} (singles ${w(t.widthSingles)} wide)`],
        ["service line", `${w(t.serviceLine)} from the net`],
        ["net", `${w(t.net.heightPosts)} at the posts, ${w(t.net.heightCentre)} at the centre`],
        ["net posts", `${w(t.net.postsOutside)} outside the doubles court`],
        ["free zone", t.free.official === null ? "none" : `${w(t.free.official.end)} behind the baselines, ${w(t.free.official.side)} beside the sidelines`],
      ];
    }
    case "volleyball": {
      const v = netOf(league);
      return [
        ["court", `${w(v.length)} by ${w(v.width)}`],
        ["attack line", v.attackLine === null ? "none" : `${w(v.attackLine)} from the centre line`],
        ["net", `${w(v.net.length)} long, ${w(v.net.heightMen)} high (women's ${w(v.net.heightWomen)})`],
        ["posts", `${w(v.net.postsOutside)} outside the side lines`],
        ["free zone", v.free.official === null ? "none" : `${w(v.free.official.end)} behind the end lines, ${w(v.free.official.side)} beside the side lines`],
      ];
    }
    case "badminton": {
      const b = netOf(league);
      return [
        ["court", `${w(b.length)} by ${w(b.width)} (singles ${w(b.width - 2 * b.singlesInset)} wide)`],
        ["short service line", `${w(b.shortServiceLine)} from the net`],
        ["doubles long service line", `${w(b.doublesLongServiceInset)} inside the back boundary`],
        ["net", `${w(b.net.heightCentre)} at the centre, ${w(b.net.heightSides)} over the side lines`],
      ];
    }
    case "pickleball": {
      const p = netOf(league);
      return [
        ["court", `${w(p.length)} by ${w(p.width)}`],
        ["non-volley zone", `${w(p.nonVolley)} from the net`],
        ["net", `${w(p.net.heightSides)} at the sidelines, ${w(p.net.heightCentre)} at the centre`],
        ["playing surface", p.free.least === null ? "none" : `at least ${w(p.width + 2 * p.free.least.side)} by ${w(p.length + 2 * p.free.least.end)}`],
      ];
    }
    case "tabletennis": {
      const t = netOf(league);
      return [
        ["table", `${w(t.length)} by ${w(t.width)}, ${w(t.height)} high`],
        ["net", `${w(t.net.height)} above the playing surface`],
        ["lines", `${w(t.edgeLine)} at the edges, a ${w(t.centreLine)} centre line`],
      ];
    }
    case "padel": {
      const p = netOf(league);
      return [
        ["court", `${w(p.length)} by ${w(p.width)}, inside its walls`],
        ["service line", `${w(p.serviceLine)} from the net`],
        ["net", `${w(p.net.heightCentre)} at the centre, ${w(p.net.heightEnds)} at the ends, ${w(p.net.length)} long`],
        ["walls", `the end walls ${w(p.enclosure.endHeight)} high, the side walls ${w(p.enclosure.sideWall)} long at each end`],
      ];
    }
    case "squash": {
      const q = netOf(league);
      return [
        ["court", `${w(q.length)} by ${w(q.width)}`],
        ["short line", `${w(q.shortLine)} from the back wall to its nearest edge`],
        ["service box", `${w(q.serviceBox)} square inside its lines`],
        ["front wall", `the tin ${w(q.wall.tin)}, the service line ${w(q.wall.serviceLine)} and the front wall line ${w(q.wall.frontWallLine)} up`],
      ];
    }
    case "racquetball": {
      const r = netOf(league);
      return [
        ["court", `${w(r.length)} by ${w(r.width)}, ${w(r.height)} high`],
        ["short line", `${w(r.shortLine)} from the back wall to its back edge`],
        ["service line", `${w(r.serviceLine)} in front of the short line`],
        ["receiving line", `${w(r.receiving.behind)} behind the short line`],
      ];
    }
    case "sepaktakraw": {
      const t = netOf(league);
      return [
        ["court", `${w(t.length)} by ${w(t.width)}`],
        ["quarter circles", `${w(t.quarterCircle)} radius, at the ends of the centre line`],
        ["service circles", `${w(t.serviceCircle.radius)} radius, ${w(t.serviceCircle.fromBack)} from the back line`],
        ["net", `${w(t.net.heightMen)} high at the centre (women's ${w(t.net.heightWomen)})`],
      ];
    }
    case "teqball": {
      const t = netOf(league);
      return [
        ["court", `at least ${w(t.length)} by ${w(t.width)}`],
        ["table", `${w(t.table.length)} by ${w(t.table.width)}`],
        ["service line", `${w(t.serviceLine)} from the middle of the table`],
        ["net", `${w(t.net.width)} wide, ${w(t.net.height)} high`],
      ];
    }
    case "roundnet": {
      const t = netOf(league);
      return [
        ["court", `at least ${w(t.length)} by ${w(t.width)}, with no out of bounds`],
        ["set", `${w(t.set.diameter)} across`],
        ["serving line", `a circle of ${w(t.servingRadius)} radius`],
        ["no hit zone", `a circle of ${w(t.noHitRadius)} radius`],
      ];
    }
    case "netball": {
      const n = netOf(league);
      return [
        ["court", `${w(n.length)} by ${w(n.width)}`],
        ["centre circle", `${w(n.centreCircle)} across`],
        ["goal circles", `semicircles of ${w(n.goalCircle)} radius`],
        ["goalposts", `${w(n.post.height)} high, at the middle of each goal line`],
      ];
    }
    case "football": {
      const f = fieldOf(league);
      return [
        ["goal lines", `${written(f.length, "yd")} apart`],
        ["end zones", written(f.endZone, "yd")],
        ["width", written(f.width, "yd")],
        ["hash marks", `${written(f.hash, "ft")} from each sideline`],
        ["goal posts", `${written(f.postWidth ?? 18.5, "ft")} apart, on the ${f.posts === "end-line" ? "end line" : "goal line"}`],
      ];
    }
    case "rugby": {
      const f = rugbyOf(league);
      const r = (x: Span): string => (x.min === x.max ? w(x.max) : `${w(x.min)} to ${w(x.max)}`);
      return [
        ["field of play", `${r(f.length)} by ${r(f.width)}`],
        ["in-goal", `${r(f.inGoal)} deep`],
        ["goal posts", `${w(f.postsApart)} apart, the crossbar ${w(f.crossbar)} up`],
        f.code === "union" ? ["22-metre line", `${w(f.twentyTwo as number)} from the try line`] : ["lines across", `every ${w(f.step as number)} from each goal line`],
      ];
    }
    case "lacrosse": {
      const f = lacrosseOf(league);
      const r = (x: Span): string => (x.min === x.max ? w(x.max) : `${w(x.min)} to ${w(x.max)}`);
      const out: [string, string][] = [
        [f.kind === "box" ? "floor" : "field", `${r(f.length)} by ${r(f.width)}`],
        ["goal", `${w(f.goalWidth)} wide and ${w(f.goalHeight)} high, its line ${w(f.goalLine)} from the end ${f.kind === "box" ? "boards" : "line"}`],
      ];
      if (f.crease !== null) out.push(["crease", `a circle of ${w(f.crease)} radius`]);
      if (f.goalCircle !== null) out.push(["goal circle", `${w(f.goalCircle)} radius`]);
      if (f.restraining !== null) out.push(["restraining line", `${w(f.restraining)} from the goal line`]);
      if (f.restrainingFromCentre !== null) out.push(["restraining line", `${w(f.restrainingFromCentre)} from the centre line`]);
      if (f.twoPoint !== null) out.push(["two-point arc", `${w(f.twoPoint.gle)} from the goal at the goal line extended, then an arc of ${w(f.twoPoint.radius)}`]);
      return out;
    }
    case "afl": {
      const f = aflOf(league);
      const r = (x: Span): string => `${w(x.min)} to ${w(x.max)}`;
      return [
        ["ground", `an oval ${r(f.length)} long and ${r(f.width)} wide`],
        ["goal posts", `${w(f.goalPosts)} apart, behind posts ${w(f.behindPosts)} either side`],
        ["goal square", `${w(f.goalSquareDepth)} deep`],
        ["centre square", `${w(f.centreSquare)} by ${w(f.centreSquare)}`],
        ["fifty metre arc", `${w(f.fiftyArc)} from the middle of the goal line`],
      ];
    }
    case "gaelic": {
      const f = gaelicOf(league);
      const r = (x: Span): string => `${w(x.min)} to ${w(x.max)}`;
      return [
        ["field", `${r(f.length)} by ${r(f.width)}`],
        ["lines across", f.lines.map((line) => w(line)).join(", ")],
        ["goalposts", `${w(f.postsApart)} apart, the crossbar ${w(f.crossbar)} up`],
        ["rectangles", `${w(f.small.depth)} deep and ${w(f.large.depth)} deep`],
      ];
    }
    case "cricket": {
      const f = cricketOf(league);
      // The Laws print yards for the pitch's length and the boundary and feet and inches for the rest.
      const ft = (feet: number): string => written(feet, "ft");
      return [
        ["pitch", `${w(f.pitchLength)} by ${ft(f.pitchWidth)}`],
        ["bowling crease", `${ft(f.bowlingCrease)} long`],
        ["popping crease", `${ft(f.poppingCrease)} in front of the bowling crease, marked ${ft(f.poppingEach)} either side of the middle stumps at least`],
        ["return creases", `${ft(f.returnOutside)} either side of the middle stumps, marked ${ft(f.returnBehind)} behind the popping crease`],
        ["wickets", `${ft(f.wicket)} wide`],
        ["boundary", Number.isFinite(f.boundary.max) ? `${w(f.boundary.min)} to ${w(f.boundary.max)} from the centre of the pitch` : "no size given"],
        ["circle", f.circle === null ? "none" : `${w(f.circle)} radius about each middle stump`],
      ];
    }
    case "fieldhockey": {
      const f = fieldHockeyOf(league);
      return [
        ["pitch", `${w(f.length.max)} by ${w(f.width.max)}`],
        ["23-metre lines", `${w(f.twentyThree)} from each back-line`],
        ["circle", `${w(f.circleRadius)} from the back-line`],
        ["goal", `${w(f.goalWidth)} wide and ${w(f.goalHeight)} high`],
      ];
    }
    case "handball": {
      const f = handballOf(league);
      return [
        ["court", `${w(f.length.max)} by ${w(f.width.max)}`],
        ["goal area line", `${w(f.areaDistance)} from the goal line`],
        ["free-throw line", `${w(f.areaDistance + f.freeThrowOutside)} from the goal line`],
        ["goal", `${w(f.goalWidth)} wide and ${w(f.goalHeight)} high`],
      ];
    }
    default: {
      const d = diamondOf(league);
      const f = d.fence;
      const fence = [f.left, f.center].filter((n): n is number => n !== undefined);
      return [
        ["bases", `${written(d.base, "ft")} apart`],
        ["pitching distance", written(d.pitcher, "ft")],
        ["fence", f.left === undefined ? "none given" : f.center === undefined || f.center === f.left ? `${written(f.left, "ft")}` : `${written(fence[0], "ft")} at the lines, ${written(fence[1], "ft")} in the middle`],
      ];
    }
  }
}
