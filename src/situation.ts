// A game's situation read from the options: hockey's skaters and shootout, baseball's bases, outs and count, football's down, distance and drives. Everything is decided here (which
// team attacks, which end, what the words say), so that the drawing (`situation.draw.ts`, `situation.badge.ts`) and the description do not decide it twice. A value that is not what
// it should be (a fourth down on the CFL's field, 7 skaters, a clock that is not a time) is left out, as a value from a page's markup is anywhere else; nothing here throws.
import { attackingIn } from "./frames.ts";
import { KYOGIJO_STRINGS, fill, type SituationWords } from "./strings.ts";
import type { DirectionOptions, Language, Side, Sport } from "./types.ts";
import type { BaseballSituation, DriveLeg, DriveResult, FootballSituation, HockeySituation, Situation, SituationTeam } from "./situation.types.ts";

export type { BaseballSituation, DriveLeg, DriveResult, FootballSituation, HockeySituation, ShootoutAttempt, ShootoutRound, Situation, SituationTeam } from "./situation.types.ts";

/** The most rounds of a shootout that are drawn. */
export const SHOOTOUT_MAX = 12;
/** The rounds that are regular: the rounds after them are sudden death. */
export const SHOOTOUT_REGULAR = 3;
/** The most drives drawn in a drive chart. */
export const DRIVES_MAX = 24;
/** The red zone: the yards before the goal line the offence attacks. */
export const RED_ZONE_YARDS = 20;
/** The yards to a first down. */
export const FIRST_DOWN_YARDS = 10;

/** The short code each drive result is written with at the head of its arrow. */
export const DRIVE_CODES: Readonly<Record<DriveResult, string>> = Object.freeze({
  touchdown: "TD",
  "field-goal": "FG",
  "missed-field-goal": "MFG",
  punt: "PUNT",
  turnover: "TO",
  interception: "INT",
  fumble: "FUM",
  downs: "DOWNS",
  safety: "SAF",
  "end-of-half": "END",
});

const RESULTS = Object.keys(DRIVE_CODES) as DriveResult[];

/** What a reading needs to know of the drawing it is for. */
export interface SituationContext {
  /** The sport as drawn (`chooseLeague(o).sport`): `nhl`, `mlb`, `nfl`, `cfl` or `ifaf`; a situation is for these only. */
  sport: Sport;
  /** The side the home team's banner is on. */
  homeSide: Side;
  /** The attack arrows' options, which say which end each team attacks. */
  direction?: DirectionOptions;
  /** The football field: the yards between the goal lines and the downs a team has. */
  football?: { yards: number; downs: number };
  /** The teams' names, when the drawing has teams. */
  names?: { home: string; away: string };
}

/** Hockey, read. */
export interface HockeyRead {
  kind: "hockey";
  /** The skaters, when known. */
  away?: number;
  home?: number;
  /** The team that is attacking (more skaters, or the goalkeeper pulled, or the other team of a delayed penalty), and the end it heads for. */
  attacker?: SituationTeam;
  toward?: "left" | "right";
  /** The attacker's skaters and the other team's, in that order, when both are known. */
  strength?: [number, number];
  /** More skaters than the other team. */
  powerPlay: boolean;
  emptyNet?: SituationTeam;
  delayed?: SituationTeam;
  clock?: string;
  shootout?: { rounds: [boolean | null, boolean | null][]; goals: [number, number]; sudden: number };
}

/** Baseball, read. */
export interface BaseballRead {
  kind: "baseball";
  bases?: [boolean, boolean, boolean];
  outs?: number;
  inning?: number;
  half?: "top" | "bottom";
  balls?: number;
  strikes?: number;
}

/** A drive, read: in yards from the team's own goal line, and the end it heads for. */
export interface DriveRead {
  team: SituationTeam;
  from: number;
  to: number;
  result?: DriveResult;
  toward: "left" | "right";
}

/** Football, read. */
export interface FootballRead {
  kind: "football";
  yards: number;
  downs: number;
  ballOn?: number;
  toGo?: number | "goal";
  down?: number;
  possession?: SituationTeam;
  /** The end zone the offence heads for. */
  toward: "left" | "right";
  redZone: boolean;
  drive: DriveRead[];
}

/** A situation, read. */
export type SituationRead = HockeyRead | BaseballRead | FootballRead;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const flip = (side: Side): Side => (side === "left" ? "right" : "left");
const other = (team: SituationTeam): SituationTeam => (team === "home" ? "away" : "home");

/** A whole number from `lo` to `hi`, else `undefined`. */
function whole(value: unknown, lo: number, hi: number): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= lo && value <= hi ? value : undefined;
}

const team = (value: unknown): SituationTeam | undefined => (value === "home" || value === "away" ? value : undefined);

/** The end a team attacks: the one the `direction` options say (in the period asked for), else the one opposite the team's own side. */
function headingOf(role: SituationTeam, ctx: SituationContext): Side {
  const own: Side = (role === "home") === (ctx.homeSide === "left") ? "left" : "right";
  const d = ctx.direction;
  if (d === undefined) return flip(own);
  const named = d[role] === "left" || d[role] === "right" ? d[role] : d[other(role)] === "left" || d[other(role)] === "right" ? flip(d[other(role)] as Side) : undefined;
  if (named === undefined) return flip(own);
  if (d.period === undefined) return named;
  try {
    return attackingIn(ctx.sport, d.period, named, d.changedAfter);
  } catch {
    return named;
  }
}

/** `m:ss`, `m:ss.s`, or a whole number of seconds written as `m:ss`; anything else is left out. */
export function clockText(value: unknown): string | undefined {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || value >= 6000) return undefined;
    const s = Math.floor(value);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  return typeof value === "string" && /^\d{1,2}:[0-5]\d(?:\.\d)?$/.test(value.trim()) ? value.trim() : undefined;
}

function readHockey(s: HockeySituation, ctx: SituationContext): HockeyRead | undefined {
  const away = whole(s.awaySkaters, 3, 6);
  const home = whole(s.homeSkaters, 3, 6);
  const clock = clockText(s.clock);
  const more: SituationTeam | undefined = away !== undefined && home !== undefined && away !== home ? (away > home ? "away" : "home") : undefined;
  const pulled: SituationTeam | undefined = s.emptyNet === true ? more : team(s.emptyNet);
  const delayed = team(s.delayedPenalty);
  const rounds = isObject(s.shootout) && Array.isArray((s.shootout as { rounds?: unknown }).rounds) ? ((s.shootout as { rounds: unknown[] }).rounds) : undefined;
  const base: HockeyRead = { kind: "hockey", away, home, powerPlay: false };
  if (rounds !== undefined) {
    const read: [boolean | null, boolean | null][] = rounds.slice(0, SHOOTOUT_MAX).map((round) => {
      const pair = Array.isArray(round) ? round : [];
      return [typeof pair[0] === "boolean" ? pair[0] : null, typeof pair[1] === "boolean" ? pair[1] : null];
    });
    while (read.length > 0 && read[read.length - 1][0] === null && read[read.length - 1][1] === null) read.pop();
    if (read.length === 0) return undefined;
    const goals: [number, number] = [read.filter((r) => r[0] === true).length, read.filter((r) => r[1] === true).length];
    return { ...base, shootout: { rounds: read, goals, sudden: Math.max(0, read.length - SHOOTOUT_REGULAR) } };
  }
  // The team that attacks: the one with the goalkeeper pulled, else the one with more skaters, else the one that has the puck in a delayed penalty.
  const attacker = pulled ?? more ?? (delayed === undefined ? undefined : other(delayed));
  if (away === undefined && home === undefined && pulled === undefined && delayed === undefined && clock === undefined) return undefined;
  const toward = s.toward === "left" || s.toward === "right" ? s.toward : attacker === undefined ? undefined : headingOf(attacker, ctx);
  const strength: [number, number] | undefined =
    away !== undefined && home !== undefined ? (attacker === "home" ? [home, away] : attacker === "away" ? [away, home] : [away, home]) : undefined;
  return { ...base, attacker, toward, strength, powerPlay: more !== undefined, emptyNet: pulled, delayed, clock };
}

function readBaseball(s: BaseballSituation): BaseballRead | undefined {
  const runners = Array.isArray(s.bases) && s.bases.length >= 3 ? ([Boolean(s.bases[0]), Boolean(s.bases[1]), Boolean(s.bases[2])] as [boolean, boolean, boolean]) : undefined;
  const read: BaseballRead = {
    kind: "baseball",
    bases: runners,
    outs: whole(s.outs, 0, 3),
    inning: whole(s.inning, 1, 99),
    half: s.half === "top" || s.half === "bottom" ? s.half : undefined,
    balls: whole(s.balls, 0, 3),
    strikes: whole(s.strikes, 0, 2),
  };
  return Object.values(read).some((value, i) => i > 0 && value !== undefined) ? read : undefined;
}

function readFootball(s: FootballSituation, ctx: SituationContext): FootballRead | undefined {
  const yards = ctx.football?.yards ?? 100;
  const downs = ctx.football?.downs ?? 4;
  const number = (value: unknown, lo: number, hi: number): number | undefined => (typeof value === "number" && Number.isFinite(value) && value >= lo && value <= hi ? Math.round(value * 10) / 10 : undefined);
  const possession = team(s.possession);
  const ballOn = number(s.ballOn, 0, yards);
  const toGo = s.toGo === "goal" ? "goal" : number(s.toGo, 0.1, yards);
  const down = whole(s.down, 1, downs);
  const offence: SituationTeam = possession ?? "home";
  const toward: Side = s.toward === "left" || s.toward === "right" ? s.toward : headingOf(offence, ctx);
  // The red zone: the ball is in it unless the options say it is not; `redZone: true` marks it with no ball.
  const inZone = ballOn !== undefined && ballOn >= yards - RED_ZONE_YARDS;
  const redZone = s.redZone === true || (s.redZone !== false && inZone);
  const drive: DriveRead[] = [];
  if (Array.isArray(s.drive)) {
    for (const leg of s.drive.slice(0, DRIVES_MAX) as unknown[]) {
      if (!isObject(leg)) continue;
      const from = number(leg.from, 0, yards);
      const to = number(leg.to, 0, yards);
      if (from === undefined || to === undefined) continue;
      const who = team(leg.team) ?? offence;
      // A team heads for the end the offence heads for, or for the other.
      drive.push({ team: who, from, to, result: RESULTS.includes(leg.result as DriveResult) ? (leg.result as DriveResult) : undefined, toward: who === offence ? toward : flip(toward) });
    }
  }
  const read: FootballRead = { kind: "football", yards, downs, ballOn, toGo, down, possession, toward, redZone, drive };
  return ballOn === undefined && toGo === undefined && down === undefined && possession === undefined && !redZone && drive.length === 0 ? undefined : read;
}

/**
 * The situation a drawing's options ask for, decided: which team attacks and which end, what is lit. `undefined` when the options have none, when the sport has no situation (only
 * hockey, baseball and football do), or when nothing in it is a value the sport can have.
 */
export function readSituation(situation: unknown, ctx: SituationContext): SituationRead | undefined {
  if (!isObject(situation)) return undefined;
  const s = situation as Situation;
  switch (ctx.sport) {
    case "nhl":
      return readHockey(s as HockeySituation, ctx);
    case "mlb":
      return readBaseball(s as BaseballSituation);
    case "nfl":
    case "cfl":
    case "ifaf":
      return readFootball(s as FootballSituation, ctx);
    default:
      return undefined;
  }
}

// ---- Words. ----

const words = (language: Language): SituationWords => KYOGIJO_STRINGS[language].situation;

/** The ordinal of an inning in English (1st, 2nd, 3rd, 11th); in Japanese the number. */
function nth(n: number, language: Language): string {
  if (language === "ja") return String(n);
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 < 4 ? n % 10 : 0]}`;
}

/** A yard line as the tag writes it: `OWN 35`, `OPP 12`, or the middle of the field. */
export function yardLineText(ballOn: number, yards: number, language: Language): string {
  const w = words(language);
  const n = Math.round(ballOn);
  const mid = yards / 2;
  if (ballOn === mid) return String(mid);
  return ballOn < mid ? fill(w.tagOwn, { n }) : fill(w.tagOpp, { n: Math.round(yards - ballOn) });
}

/** A yard line as a sentence writes it: `own 35`, `opponent's 12`, `midfield`. */
function yardPlace(ballOn: number, yards: number, language: Language): string {
  const w = words(language);
  const mid = yards / 2;
  if (ballOn === mid) return w.placeMid;
  return ballOn < mid ? fill(w.placeOwn, { n: Math.round(ballOn) }) : fill(w.placeOpp, { n: Math.round(yards - ballOn) });
}

/** The down and distance as the tag writes it (`3rd & 7`, `1st & Goal`), or `undefined` when there is no down. */
export function downTag(read: FootballRead, language: Language): string | undefined {
  if (read.down === undefined) return undefined;
  const w = words(language);
  const ord = w.downs[read.down - 1];
  // The goal is nearer than the first-down line: asked for, or the distance reaches the goal line.
  const goal = read.toGo === "goal" || (read.ballOn !== undefined && typeof read.toGo === "number" && read.ballOn + read.toGo >= read.yards);
  if (goal) return fill(w.tagGoal, { ord });
  return typeof read.toGo === "number" ? fill(w.tag, { ord, n: formatYards(read.toGo) }) : ord;
}

const formatYards = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** The baseball situation as a short label: `Top 7 · 2 out · 3-2`. */
function baseballTag(read: BaseballRead, language: Language): string {
  const w = words(language);
  const parts: string[] = [];
  if (read.inning !== undefined) parts.push(language === "ja" ? `${read.inning}回${read.half === undefined ? "" : w[read.half]}` : `${read.half === undefined ? "" : `${w[read.half]} `}${read.inning}`);
  else if (read.half !== undefined) parts.push(w[read.half]);
  if (read.outs !== undefined) parts.push(language === "ja" ? `${read.outs}アウト` : `${read.outs} out`);
  if (read.balls !== undefined && read.strikes !== undefined) parts.push(`${read.balls}-${read.strikes}`);
  return parts.join(" · ");
}

/** The strength of a hockey situation on the pill: `5v4 PP`, `6v5 EN`, `4v4`, `DEL PEN`, with the clock after it; `undefined` when there is nothing to say (5 against 5). */
export function hockeyPill(read: HockeyRead, language: Language): string | undefined {
  const w = words(language);
  if (read.shootout !== undefined) return `${w.shootout} ${read.shootout.goals[0]}–${read.shootout.goals[1]}`;
  const parts: string[] = [];
  const strength = read.strength;
  const plain = strength !== undefined && strength[0] === 5 && strength[1] === 5;
  if (strength !== undefined && !(plain && read.emptyNet === undefined && read.delayed === undefined && read.clock === undefined)) parts.push(`${strength[0]}v${strength[1]}`);
  if (read.powerPlay) parts.push(w.pp);
  if (read.emptyNet !== undefined) parts.push(w.en);
  if (read.delayed !== undefined) parts.push(w.delayed);
  if (read.clock !== undefined) parts.push(read.clock);
  return parts.length === 0 ? undefined : parts.join(" ");
}

/**
 * The short label of a situation as the drawing writes it: hockey's `5v4 PP 1:42`, baseball's `Top 7 · 2 out · 3-2`, football's `3rd & 7`. `undefined` when there is none to write.
 * @example
 * ```ts
 * import { situationText } from "@johnmorrisdotca/kyogijo-stadiums";
 * console.log(situationText({ sport: "nhl", situation: { awaySkaters: 5, homeSkaters: 4, clock: "1:42" } }));
 * console.log(situationText({ sport: "mlb", situation: { inning: 7, half: "top", outs: 2, balls: 3, strikes: 2 } }));
 * console.log(situationText({ sport: "nfl", situation: { ballOn: 88, down: 3, toGo: 7 } }));
 * // 5v4 PP 1:42
 * // Top 7 · 2 out · 3-2
 * // 3rd & 7
 * ```
 */
export function situationText(options: { sport: Sport; league?: string; homeSide?: Side; direction?: DirectionOptions; language?: Language; situation?: Situation }, language: Language = options.language === "ja" ? "ja" : "en"): string | undefined {
  const read = readSituation(options.situation, contextOf(options));
  return read === undefined ? undefined : tagOf(read, language);
}

/** The reading context of options that name no teams: the sport's own football field, the side the home team stands on by default. */
function contextOf(options: { sport: Sport; homeSide?: Side; direction?: DirectionOptions }): SituationContext {
  const football = options.sport === "cfl" ? { yards: 110, downs: 3 } : options.sport === "nfl" || options.sport === "ifaf" ? { yards: 100, downs: 4 } : undefined;
  return { sport: options.sport, homeSide: options.homeSide ?? "right", direction: options.direction, football };
}

/** The short label of a reading, in a language. */
export function tagOf(read: SituationRead, language: Language): string | undefined {
  if (read.kind === "hockey") return hockeyPill(read, language);
  if (read.kind === "baseball") {
    const tag = baseballTag(read, language);
    return tag === "" ? undefined : tag;
  }
  const down = downTag(read, language);
  const where = read.ballOn === undefined ? undefined : yardLineText(read.ballOn, read.yards, language);
  const parts = [down, where].filter((part): part is string => part !== undefined);
  return parts.length === 0 ? undefined : parts.join(" · ");
}

/** The sentences a description adds for a situation. */
export function situationSentences(read: SituationRead, language: Language, names?: { home: string; away: string }): string[] {
  const w = words(language);
  const out: string[] = [];
  const name = (t: SituationTeam): string => names?.[t] ?? w[t];
  if (read.kind === "hockey") {
    if (read.shootout !== undefined) {
      const { rounds, goals, sudden } = read.shootout;
      out.push(fill(w.shootoutScore, { n: rounds.length, away: name("away"), awayGoals: goals[0], home: name("home"), homeGoals: goals[1] }));
      if (sudden > 0) out.push(w.suddenDeath);
      return out;
    }
    const [a, b] = read.strength ?? [0, 0];
    if (read.strength !== undefined && read.powerPlay && read.attacker !== undefined) out.push(fill(w.powerPlay, { team: name(read.attacker), a, b }));
    else if (read.strength !== undefined && !(a === 5 && b === 5)) out.push(fill(w.strength, { a, b }));
    if (read.clock !== undefined) out.push(fill(w.penaltyTime, { clock: read.clock }));
    if (read.emptyNet !== undefined) out.push(fill(w.emptyNet, { team: name(read.emptyNet) }));
    if (read.delayed !== undefined) out.push(fill(w.delayedPenalty, { team: name(read.delayed) }));
    return out;
  }
  if (read.kind === "baseball") {
    const half = read.half === undefined ? undefined : w[read.half];
    if (read.inning !== undefined && half !== undefined) out.push(fill(w.inning, { half, n: read.inning, nth: nth(read.inning, language) }));
    else if (read.inning !== undefined) out.push(fill(w.inningOnly, { n: read.inning, nth: nth(read.inning, language) }));
    else if (half !== undefined) out.push(fill(w.halfOnly, { half }));
    if (read.outs !== undefined) out.push(read.outs === 0 ? w.noOuts : read.outs === 1 ? w.oneOut : fill(w.outs, { n: read.outs }));
    if (read.bases !== undefined) {
      const on = read.bases.flatMap((runner, i) => (runner ? [w.bases[i]] : []));
      out.push(on.length === 0 ? w.basesEmpty : on.length === 3 ? w.basesLoaded : fill(w.runnersOn, { list: on.join(w.and) }));
    }
    if (read.balls !== undefined && read.strikes !== undefined) out.push(fill(w.count, { b: read.balls, s: read.strikes }));
    return out;
  }
  if (read.possession !== undefined) out.push(fill(w.possession, { team: name(read.possession) }));
  if (read.down !== undefined) {
    const ord = w.downs[read.down - 1];
    const goal = read.toGo === "goal" || (read.ballOn !== undefined && typeof read.toGo === "number" && read.ballOn + read.toGo >= read.yards);
    out.push(goal ? fill(w.downGoal, { ord }) : typeof read.toGo === "number" ? fill(w.downDistance, { ord, n: formatYards(read.toGo) }) : fill(w.down, { ord }));
  }
  if (read.ballOn !== undefined) out.push(read.ballOn === read.yards / 2 ? w.ballMid : read.ballOn < read.yards / 2 ? fill(w.ballOwn, { n: Math.round(read.ballOn) }) : fill(w.ballOpp, { n: Math.round(read.yards - read.ballOn) }));
  if (read.redZone) out.push(w.redZone);
  for (const leg of read.drive) {
    const at = { team: name(leg.team), from: yardPlace(leg.from, read.yards, language), to: yardPlace(leg.to, read.yards, language) };
    out.push(leg.result === undefined ? fill(w.driveNoResult, at) : fill(w.driveLine, { ...at, result: w.results[leg.result] }));
  }
  return out;
}
