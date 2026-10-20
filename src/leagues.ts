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
import { ATHLETICS_LEAGUES, athleticsInFeet, type AthleticsFigures, type AthleticsLeague } from "./leagues/athletics.ts";
import { longOval, outerEdge } from "./skating/track.ts";
import { SKATING_LEAGUES, skatingInFeet, type SkatingFigures, type SkatingLeague } from "./leagues/skating.ts";
import { BOXING_LEAGUES, MMA_LEAGUES, WRESTLING_LEAGUES } from "./leagues/combat.ts";
import { BUDO_LEAGUES, DOJO_LEAGUES, JUDO_LEAGUES, KARATE_LEAGUES, KENDO_LEAGUES, KYUDO_LEAGUES, SUMO_LEAGUES, type BudoLeague } from "./leagues/budo.ts";
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
export type { AthleticsFigures, AthleticsLeague } from "./leagues/athletics.ts";
export { WA_STANDARD_TRACK, WA_SHORT_TRACK, WA_STAGGER_TABLE, WA_SHORT_STAGGER_TABLE } from "./leagues/athletics.ts";
export type { SkatingFigures, SkatingLeague, LongTrackFigures, ShortTrackFigures, FigureRinkFigures } from "./leagues/skating.ts";
export { ISU_LONG_TRACK, ISU_SHORT_TRACK, ISU_FIGURE_RINK, ISU_LONG_TRACK_TABLE } from "./leagues/skating.ts";
export type { BudoFigures, BudoLeague, DojoFigures, DojoLeague, JudoFigures, JudoLeague, KarateFigures, KarateLeague, KendoFigures, KendoLeague, KyudoFigures, KyudoLeague, Mat, SumoFigures, SumoLeague } from "./leagues/budo.ts";
export { BOXING_LEAGUES, IMMAF_CAGE, MMA_LEAGUES, NRUC_CAGE, NCAA_MAT, NFHS_MAT, NRUC_RING, UWW_MAT, WBC_AMATEUR_RING, WISCONSIN_RING, WRESTLING_LEAGUES } from "./leagues/combat.ts";
export { AJJF_CONTEST, BUDO_LEAGUES, ENTEKI, FIK_SHIAI_JO, IJF_CONTEST, IJF_KATA, JSA_DOHYO, KINTEKI, WKF_KATA, WKF_KUMITE } from "./leagues/budo.ts";
export type { BadmintonFigures, BadmintonLeague, FreeZone, FreeZones, NetFigures, NetLeague, NetSport, NetballFigures, NetballLeague, PadelFigures, PadelLeague, PickleballFigures, PickleballLeague, RacquetballFigures, RacquetballLeague, RoundnetFigures, RoundnetLeague, SepakTakrawFigures, SepakTakrawLeague, SquashFigures, SquashLeague, TableTennisFigures, TableTennisLeague, TennisFigures, TennisLeague, TeqballFigures, TeqballLeague, VolleyballFigures, VolleyballLeague } from "./leagues/courts.ts";
export type { CourtFigures, CourtMarks } from "./leagues/basketball.ts";
export type { RinkFigures } from "./leagues/hockey.ts";
export type { SheetFigures } from "./leagues/curling.ts";
export type { DiamondFigures } from "./leagues/baseball.ts";
export type { Family, LeagueSpan, Named } from "./leagues/types.ts";

/** A league: a variant of a family of surface. */
export type League = BasketballLeague | HockeyLeague | FootballLeague | BaseballLeague | CurlingLeague | NetLeague | LacrosseLeague | RugbyLeague | AflLeague | GaelicLeague | CricketLeague | FieldHockeyLeague | HandballLeague | AthleticsLeague | SkatingLeague | BudoLeague;

/** The family of surface each sport draws; soccer's variants are its pitches (`pitch`), not leagues. */
export const FAMILY_OF: Readonly<Record<Sport, Family | undefined>> = Object.freeze({ nfl: "football", cfl: "football", ifaf: "football", nhl: "hockey", nba: "basketball", mlb: "baseball", soccer: undefined, curling: "curling", tennis: "tennis", volleyball: "volleyball", badminton: "badminton", pickleball: "pickleball", tabletennis: "tabletennis", padel: "padel", squash: "squash", racquetball: "racquetball", sepaktakraw: "sepaktakraw", teqball: "teqball", roundnet: "roundnet", netball: "netball", lacrosse: "lacrosse", rugby: "rugby", afl: "afl", gaelic: "gaelic", cricket: "cricket", fieldhockey: "fieldhockey", handball: "handball", swimming: undefined, waterpolo: undefined, diving: undefined, artisticswimming: undefined, athletics: "athletics", skating: "skating", judo: "judo", karate: "karate", kendo: "kendo", sumo: "sumo", kyudo: "kyudo", dojo: "dojo", mma: "mma", boxing: "boxing", wrestling: "wrestling" });

/**
 * The leagues each sport can draw, in the order a menu lists them, the sport's own first (the three football sports share their
 * list, the football leagues). Soccer and the pools have none.
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
  // The pools have one rulebook, World Aquatics', and no leagues.
  swimming: [],
  waterpolo: [],
  diving: [],
  artisticswimming: [],
  athletics: ATHLETICS_LEAGUES,
  skating: SKATING_LEAGUES,
  judo: JUDO_LEAGUES,
  karate: KARATE_LEAGUES,
  kendo: KENDO_LEAGUES,
  sumo: SUMO_LEAGUES,
  kyudo: KYUDO_LEAGUES,
  dojo: DOJO_LEAGUES,
  mma: MMA_LEAGUES,
  boxing: BOXING_LEAGUES,
  wrestling: WRESTLING_LEAGUES,
});

/** Every league of every family, once each. */
export const VARIANTS: readonly League[] = Object.freeze([...BASKETBALL_LEAGUES, ...HOCKEY_LEAGUES, ...FOOTBALL_LEAGUES, ...BASEBALL_LEAGUES, ...CURLING_LEAGUES, ...TENNIS_LEAGUES, ...VOLLEYBALL_LEAGUES, ...BADMINTON_LEAGUES, ...PICKLEBALL_LEAGUES, ...TABLE_TENNIS_LEAGUES, ...PADEL_LEAGUES, ...SQUASH_LEAGUES, ...RACQUETBALL_LEAGUES, ...SEPAK_TAKRAW_LEAGUES, ...TEQBALL_LEAGUES, ...ROUNDNET_LEAGUES, ...NETBALL_LEAGUES, ...LACROSSE_LEAGUES, ...RUGBY_LEAGUES, ...AFL_LEAGUES, ...GAELIC_LEAGUES, ...CRICKET_LEAGUES, ...FIELD_HOCKEY_LEAGUES, ...HANDBALL_LEAGUES, ...ATHLETICS_LEAGUES, ...BUDO_LEAGUES]);

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
export function chooseLeague(o: Pick<SurfaceOptions, "sport" | "league"> & Partial<Pick<SurfaceOptions, "budo">>): { sport: Sport; league: League | undefined } {
  // A judo area asked for in the kata style is the IJF's kata area when no league is named (`budo.style`).
  const asked = (o.league === undefined || o.league === "") && o.sport === "judo" && o.budo?.style === "kata" ? "ijf-kata" : o.league;
  if (asked === undefined || asked === "") return { sport: o.sport, league: undefined };
  const id = String(asked);
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
/** A skating rink of a league, in feet. */
export const skatingOf = (league: SkatingLeague): SkatingFigures => skatingInFeet(league.dimensions, figuresUnit(league));

/** An athletics track of a league, in feet. */
export const athleticsOf = (league: AthleticsLeague): AthleticsFigures => athleticsInFeet(league.dimensions, figuresUnit(league));
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
    case "athletics": {
      // The oval's outer edge with its last lane drawn: two semicircles and a straight long, a diameter wide.
      const f = athleticsOf(league);
      const outer = f.radius + f.lanes.drawn * f.lane;
      feet = { length: f.straight + 2 * outer, width: 2 * outer };
      break;
    }
    case "skating": {
      // The long track: the ice out to the padding; the others: the rink.
      const d = league.dimensions;
      const m = d.kind === "long-track" ? ((): { length: number; width: number } => { const o = longOval(undefined, undefined, d); const R = outerEdge(o) + d.padding.clear; return { length: o.straight + 2 * R, width: 2 * R }; })() : d.kind === "short-track" ? d.rink : { length: d.length.drawn, width: d.width.drawn };
      feet = { length: convertLength(m.length, league.unit, "ft"), width: convertLength(m.width, league.unit, "ft") };
      break;
    }
    case "judo": {
      // The contest area with its safety area all round it, in metres.
      const d = league.dimensions;
      const m = d.contest.drawn + 2 * d.safety.drawn;
      feet = { length: convertLength(m, "m", "ft"), width: convertLength(m, "m", "ft") };
      break;
    }
    case "karate": {
      const d = league.dimensions;
      const m = d.area + 2 * d.safety;
      feet = { length: convertLength(m, "m", "ft"), width: convertLength(m, "m", "ft") };
      break;
    }
    case "kendo": {
      const m = league.dimensions.side.drawn;
      feet = { length: convertLength(m, "m", "ft"), width: convertLength(m, "m", "ft") };
      break;
    }
    case "sumo": {
      const m = league.dimensions.platform;
      feet = { length: convertLength(m, "m", "ft"), width: convertLength(m, "m", "ft") };
      break;
    }
    case "kyudo": {
      // The shajō from its back wall to the back of the azuchi, and the width of its frontage with the judges' side.
      const d = league.dimensions;
      const frontage = (d.count - 1) * d.step.drawn + 2 * d.hall.side + d.hall.judges;
      const length = d.hall.rear + d.hall.depth - d.hall.front + d.distance - 1 + d.azuchi.depth;
      feet = { length: convertLength(length, "m", "ft"), width: convertLength(frontage, "m", "ft") };
      break;
    }
    case "wrestling": {
      // The mat's square: the circle with the matted area round it.
      const d = league.dimensions;
      const m = d.circle.drawn + 2 * d.border.drawn;
      feet = { length: convertLength(m, "m", "ft"), width: convertLength(m, "m", "ft") };
      break;
    }
    case "boxing": {
      // The platform: the ring at the size drawn, with its apron.
      const d = league.dimensions;
      const m = d.size.drawn + 2 * Math.max(d.apron.drawn, d.post.fromRopes + d.post.pad / 2 + 0.02);
      feet = { length: convertLength(m, "m", "ft"), width: convertLength(m, "m", "ft") };
      break;
    }
    case "mma": {
      // The platform: the cage at the size drawn, with its apron.
      const d = league.dimensions;
      const m = d.width.drawn + 2 * d.apron;
      feet = { length: convertLength(m, "m", "ft"), width: convertLength(m, "m", "ft") };
      break;
    }
    case "dojo": {
      // The usual 20 jō: 5 mats' widths across and 8 along.
      const d = league.dimensions;
      feet = { length: convertLength(8 * d.mat.width, "m", "ft"), width: convertLength(5 * d.mat.width, "m", "ft") };
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
    case "skating": {
      const f = skatingOf(league);
      if (f.kind === "long-track") {
        return [
          ["track", `a lap of ${w(f.lap)} measured ${w(f.measure)} outside the inner edge, the inner curve ${w(f.innerRadius.min)} to ${w(f.innerRadius.max)} in radius`],
          ["lanes", `an inner lane of ${w(f.innerLane)} and an outer lane of at least ${w(f.outerLane.min)}, the warm-up lane at least ${w(f.warmUpLane)} wide`],
          ["blocks", `${w(f.blocks.near)} apart for the first ${w(f.blocks.nearLength)} of a curve, ${w(f.blocks.far)} after`],
          ["coaches' area", `a line ${w(f.coaches.offset)} from the outside edge, from ${w(f.coaches.after)} after the end of a curve to ${w(f.coaches.before)} before the next`],
          ["padding", `${w(f.padding.thick)} thick, nothing fixed within ${w(f.padding.clear)} of the edge`],
        ];
      }
      if (f.kind === "short-track") {
        return [
          ["oval", `a lap of ${w(f.lap)}: straights of ${w(f.straight)} between the centres of the curves, a track line of ${w(f.radius)} radius`],
          ["blocks", `${f.blocksPerCurve} in each curve, on a radius of ${w(f.blocks)}`],
          ["rink", `at least ${w(f.rink.length)} by ${w(f.rink.width)}`],
          ["tracks", `5 (${w(f.tracks.five.shift)} apart, starting lines ${w(f.tracks.five.lines)} apart) or 7 (${w(f.tracks.seven.shift)} and ${w(f.tracks.seven.lines)})`],
          ["starting positions", `${f.dots.count} dots every ${w(f.dots.step)}, from ${w(f.dots.from)} out from the inner side`],
        ];
      }
      return [
        ["rink", `${w(f.length.max)} by ${w(f.width.max)} if possible, at least ${w(f.length.min)} by ${w(f.width.min)}`],
      ];
    }
    case "athletics": {
      const f = athleticsOf(league);
      return [
        ["track", `two straights of ${w(f.straight)} and two bends of ${w(f.radius)} radius at the kerb`],
        ["lanes", `${f.lanes.drawn} of ${w(f.lane)} (${f.lanes.min} to ${f.lanes.max})`],
        ["running line", `${w(f.inner)} outside the kerb in lane 1, ${w(f.outer)} outside the line in the others`],
        ["straight", `${f.straightLanes.min} to ${f.straightLanes.max} lanes of ${w(f.straightLane)}, a starting area of ${w(f.startArea)} and a run-out of ${w(f.runOut)}`],
        ["banking", f.banking === null ? "none" : `${f.banking} degrees`],
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
    case "judo": {
      const f = league.dimensions;
      return [
        ["contest area", `${w(convertLength(f.contest.min, "m", "ft"))} to ${w(convertLength(f.contest.max, "m", "ft"))} square (${f.contest.drawn} m drawn)`],
        ["safety area", `at least ${w(convertLength(f.safety.min, "m", "ft"))} wide; at least ${w(convertLength(f.common, "m", "ft"))} between two areas`],
        ["tatami", `${f.tatami.length} m by ${f.tatami.width} m by ${f.tatami.thickness * 100} cm`],
        ["free zone", `at least ${f.freeZone * 100} cm round the competition area`],
        ["platform", `${f.platform} m wider and longer than the tatami`],
        ["start tape", f.marks === null ? "none" : `${f.marks.width * 100} cm by ${f.marks.length * 100} cm, ${f.marks.fromCentre} m from the centre`],
      ];
    }
    case "karate": {
      const f = league.dimensions;
      return [
        ["area", `${f.area} m square, measured from the outside`],
        ["boundary band", f.band === 0 ? "none" : `the outer ${f.band} m in another colour`],
        ["safety area", `${f.safety} m, and ${f.between} m between areas`],
        ["start mats", f.startMats === null ? "none" : `${f.startMats.fromCentre} m from the centre`],
        ["referee", `${f.referee} m from the boundary; each judge ${f.judges} m off a corner`],
      ];
    }
    case "kendo": {
      const f = league.dimensions;
      return [
        ["shiai-jo", `${f.side.min} m to ${f.side.max} m a side, wooden floor`],
        ["lines", `${f.lineWidth.min * 100} cm to ${f.lineWidth.max * 100} cm, white`],
        ["centre cross", `${f.cross.min * 100} cm to ${f.cross.max * 100} cm`],
        ["kaishi-sen", `${f.startLine.length * 100} cm long, ${f.startLine.fromCentre} m from the centre`],
        ["outside", `${f.outside} m kept clear`],
      ];
    }
    case "sumo": {
      const f = league.dimensions;
      return [
        ["platform", `${f.platform} m square, ${f.height.min * 100} cm to ${f.height.max * 100} cm high`],
        ["ring", `${f.circle} m across, ${f.tawara.count} tawara (${f.tawara.tokuda} tokudawara)`],
        ["shikiri-sen", `${f.shikiri.length * 100} cm long, ${f.shikiri.width * 100} cm wide, ${f.shikiri.apart * 100} cm apart`],
      ];
    }
    case "kyudo": {
      const f = league.dimensions;
      return [
        ["distance", `${f.distance} m from the shooting position to the target`],
        ["target", `${f.target.diameter * 100} cm across, its centre ${f.target.centre * 100} cm up, tilted ${f.target.tilt} degrees`],
        ["shooters", `${f.step.drawn} m apart (${f.step.min} m to ${f.step.max} m), ${f.honza} m from the shooting position to the honza`],
        ["shajō", `${f.hall.depth} m deep, ${f.hall.side} m from the end shooters to the walls, ceiling ${f.ceiling} m`],
      ];
    }
    case "wrestling": {
      const f = league.dimensions;
      const ft = (m: number): string => `${Math.round((m / 0.3048) * 100) / 100} ft`;
      const m = (v: number): string => `${Math.round(v * 100) / 100} m`;
      const sized = f.circle.min === f.circle.max ? m(f.circle.min) : `${ft(f.circle.min)} to ${ft(f.circle.max)}`;
      return [
        ["wrestling area", `a circle of ${sized}`],
        ["matted area", `${f.border.min === f.border.max ? m(f.border.min) : `at least ${ft(f.border.min)}`} round the circle`],
        ...(f.passivity > 0 ? [["passivity band", `${m(f.passivity)} wide inside the circle`] as [string, string]] : []),
        ...(f.centre === null ? [] : [["centre circle", `${f.centre.diameter >= 3 ? ft(f.centre.diameter) : m(f.centre.diameter)} across`] as [string, string]]),
        ...(f.lines === null ? [] : [["starting lines", `two of ${Math.round(f.lines.width / 0.0254)} inch, ${ft(f.lines.length)} long, ${Math.round(f.lines.apart / 0.0254)} inches apart`] as [string, string]]),
      ];
    }
    case "boxing": {
      const f = league.dimensions;
      const ft = (m: number): string => `${Math.round((m / 0.3048) * 100) / 100} ft`;
      const sized = f.size.min === f.size.max ? `${ft(f.size.min)} square` : `${ft(f.size.min)} to ${ft(f.size.max)} square`;
      return [
        ["ring", `${sized} within the ropes`],
        ["platform", `at most ${ft(f.platform.height.max)} high, with ${f.platform.steps.sets} sets of steps`],
        ["ropes", `${f.ropes.count} at ${f.ropes.heights.map((h) => `${Math.round((h / 0.0254) * 10) / 10} in`).join(", ")}`],
        ["posts", `${Math.round((f.post.height / 0.0254) * 10) / 10} in over the ring floor, ${Math.round((f.post.fromRopes / 0.0254) * 10) / 10} in from the ropes`],
      ];
    }
    case "mma": {
      const f = league.dimensions;
      const ft = (m: number): string => `${Math.round((m / 0.3048) * 100) / 100} ft`;
      return [
        ["width", `${ft(f.width.min)} to ${ft(f.width.max)} across, ${f.sides} sides drawn`],
        ["platform", `at most ${ft(f.platform.height.max)} high, with steps`],
        ["fence", `posts ${ft(f.fence.min)} to ${ft(f.fence.max)} over the canvas`],
        ["gates", `${f.gates.count}, with secure locks`],
      ];
    }
    case "dojo": {
      const f = league.dimensions;
      return [
        ["tatami", `${f.mat.length} m by ${f.mat.width} m (${f.region.en})`],
        ["area of a mat", `${Math.round(f.mat.length * f.mat.width * 1000) / 1000} square metres`],
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
