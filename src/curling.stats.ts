// Curling's statistics, as small pure functions beside `curlingScore`: the free guards in play, the stones in play after each throw, the ends of a game (who scored, who had the
// hammer, how often a team with it scored, blanked, was held to one or was stolen from, and how often a team without it stole), and the shots of a game (how each type of shot
// was played, the shot percentage and how many were hits). Written for this package from the rules (the free guard zone is World Curling's R6 and Curling Canada's Rule 12,
// the hammer's passing from their rules of play) and from the definitions that the analyses of curlovision (BSD) and Jordan Myslik's curling analytics describe in words; no code
// of either was read or used.
import { curlingScore } from "./charts.curling.ts";
import type { CurlingOptions, CurlingStone } from "./charts.types.ts";
import { convertLength } from "./units.ts";

const round = (value: number, places = 1): number => Math.round(value * 10 ** places) / 10 ** places;
const percent = (part: number, whole: number): number | null => (whole === 0 ? null : round((100 * part) / whole));
const mean = (sum: number, n: number): number | null => (n === 0 ? null : round(sum / n, 2));

/** A team of a game, as the stones and the board name them. */
export type CurlingSide = "home" | "away";
const other = (side: CurlingSide): CurlingSide => (side === "home" ? "away" : "home");

// ----- the stones of one layout

/** The free guards of a layout: how many each team has, and which stones they are. */
export interface CurlingGuards {
  home: number;
  away: number;
  /** The places in the list given of the stones that are free guards. */
  indices: number[];
  /** A team that is not `home` or `away` is counted under its name. */
  others: Record<string, number>;
}

/**
 * The free guards of a layout. A free guard is a stone in play that is between the tee line and the hog line and is not in the house (the free guard zone, World Curling R6 and
 * Curling Canada Rule 12): its centre is nearer the hog line than the tee line, and no part of it is within the 12-foot circle. Stones out of play are not counted. Places are feet
 * from the button (in `units`), as `curlingScore` takes them.
 * @example
 * ```ts
 * import { curlingFreeGuards } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const guards = curlingFreeGuards([
 *   { x: 0.2, y: -11, team: "home" },
 *   { x: -2, y: -16, team: "away" },
 *   { x: 0.5, y: 0.5, team: "home" },
 *   { x: 3, y: -19, team: "away" },
 * ]);
 * console.log(guards.home, guards.away, guards.indices);
 * // 1 2 [ 0, 1, 3 ]
 * ```
 */
export function curlingFreeGuards(stones: readonly CurlingStone[], options: { units?: CurlingOptions["units"]; width?: number } = {}): CurlingGuards {
  const judged = curlingScore(stones, options);
  const unit = options.units ?? "ft";
  const out: CurlingGuards = { home: 0, away: 0, indices: [], others: {} };
  for (const r of judged.results) {
    if (!r.inPlay || r.inHouse) continue;
    const y = convertLength(stones[r.index].y as number, unit, "ft");
    if (!(y < 0)) continue;
    out.indices.push(r.index);
    const team: string = stones[r.index].team ?? "home";
    if (team === "home" || team === "away") out[team] += 1;
    else out.others[team] = (out.others[team] ?? 0) + 1;
  }
  return out;
}

/** The stones in play in each layout of an end, and the most there were. */
export interface CurlingInPlay {
  /** Stones in play in each layout, in the order given (after each throw). */
  counts: number[];
  /** The most stones in play at any time of the end, and the first layout that had that many. */
  max: number;
  at: number;
}

/**
 * The stones in play after each throw of an end, from the layout after each throw (`curlingScore`'s rules: a stone that touches a sideline, does not come to rest beyond the hog
 * line or has wholly crossed the back line is out). The most stones in play is the measure of how crowded an end got.
 * @example
 * ```ts
 * import { curlingInPlay } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const end = curlingInPlay([
 *   [{ x: 0, y: -12, team: "home" }],
 *   [{ x: 0, y: -12, team: "home" }, { x: 1, y: 0, team: "away" }],
 *   [{ x: 1, y: 0, team: "away" }],
 * ]);
 * console.log(end.counts, end.max, end.at);
 * // [ 1, 2, 1 ] 2 1
 * ```
 */
export function curlingInPlay(layouts: readonly (readonly CurlingStone[])[], options: { units?: CurlingOptions["units"]; width?: number } = {}): CurlingInPlay {
  if (!Array.isArray(layouts)) throw new TypeError("layouts is a list of layouts, each a list of stones");
  const counts = layouts.map((layout) => curlingScore(layout, options).inPlay);
  const max = counts.reduce((m, n) => Math.max(m, n), 0);
  return { counts, max, at: counts.indexOf(max) };
}

// ----- the ends of a game

/** What a team scored in an end: one team scores in an end and the other has nothing, or neither does (a blank end). `hammer` is the team that threw last, when the record says. */
export interface CurlingEndScore {
  home: number;
  away: number;
  hammer?: CurlingSide;
}

/** One end, worked out. */
export interface CurlingEndRecord {
  /** The number of the end, from 1. */
  end: number;
  home: number;
  away: number;
  /** The team with the hammer, and the team that scored (`null` for a blank end). */
  hammer: CurlingSide | null;
  scoring: CurlingSide | null;
  points: number;
  blank: boolean;
  /** The team without the hammer scored. */
  steal: boolean;
  /** The team with the hammer scored exactly one point (it was forced to take one). */
  forced: boolean;
  /** The score after the end. */
  homeTotal: number;
  awayTotal: number;
}

/** How a team did in the ends it had the hammer. */
export interface CurlingHammerStats {
  /** Ends with the hammer. */
  ends: number;
  /** Ends in which the team scored, and its points in them. */
  scored: number;
  points: number;
  /** Ends it blanked (to keep the hammer), ends it was stolen from, ends it scored exactly one, two or more, and three or more. */
  blanked: number;
  stolen: number;
  forced: number;
  multi: number;
  big: number;
  /** Points per end with the hammer, the measure of hammer efficiency. */
  efficiency: number | null;
  /** Percent of its hammer ends in which it scored, blanked, was held to one, and was stolen from. */
  scoringRate: number | null;
  blankRate: number | null;
  forceRate: number | null;
  stolenRate: number | null;
}

/** How a team did in the ends it had no hammer. */
export interface CurlingStealStats {
  ends: number;
  /** Ends in which it scored (stole), and its points in them. */
  steals: number;
  points: number;
  /** Percent of its ends without the hammer in which it stole. */
  stealRate: number | null;
}

/** One team's ends. */
export interface CurlingTeamEnds {
  points: number;
  /** Ends in which the team scored. */
  endsScored: number;
  withHammer: CurlingHammerStats;
  withoutHammer: CurlingStealStats;
}

/** What `curlingEndStats` gives back. */
export interface CurlingEndStats {
  ends: number;
  /** Ends in which neither team scored. */
  blanks: number;
  records: CurlingEndRecord[];
  home: CurlingTeamEnds;
  away: CurlingTeamEnds;
}

/**
 * The team with the hammer in each end. The team that scored in an end gives up the hammer: the other team has it in the next end. After a blank end the same team keeps it. An end
 * that names its own `hammer` is taken as it says, and the rule goes on from there. `first` is the team with the hammer in the first end.
 * @example
 * ```ts
 * import { curlingHammers } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * console.log(curlingHammers([{ home: 2, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 1 }, { home: 1, away: 0 }], "home"));
 * // [ 'home', 'away', 'away', 'home' ]
 * ```
 */
export function curlingHammers(ends: readonly CurlingEndScore[], first: CurlingSide): CurlingSide[] {
  const out: CurlingSide[] = [];
  let hammer = first;
  for (const e of ends) {
    if (e.hammer === "home" || e.hammer === "away") hammer = e.hammer;
    out.push(hammer);
    const scoring = e.home > 0 ? "home" : e.away > 0 ? "away" : null;
    if (scoring !== null) hammer = other(scoring);
  }
  return out;
}

const emptyHammer = (): CurlingHammerStats => ({ ends: 0, scored: 0, points: 0, blanked: 0, stolen: 0, forced: 0, multi: 0, big: 0, efficiency: null, scoringRate: null, blankRate: null, forceRate: null, stolenRate: null });

/**
 * The ends of a game: for each end who scored and how many, who had the hammer, whether it was a blank end, a steal or a forced one; and for each team its hammer efficiency (points
 * per end with the hammer), how often it scored, blanked, was held to one or was stolen from with the hammer, and how often it stole without it. Each end is what each team scored in it
 * (one of them nothing: an end is scored by one team, so two scores in an end are an error), as a score board's `ends` give it; `hammer` is the team that threw last in the first end, or
 * each end names its own.
 * @throws TypeError when `ends` is not a list; RangeError when an end is not a whole number of points for each team, or both teams scored in it.
 * @example
 * ```ts
 * import { curlingEndStats } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const game = curlingEndStats(
 *   [{ home: 2, away: 0 }, { home: 0, away: 1 }, { home: 0, away: 1 }, { home: 1, away: 0 }, { home: 0, away: 2 }],
 *   { hammer: "home" },
 * );
 * console.log(game.home.points, game.away.points, game.home.withHammer.efficiency, game.away.withoutHammer.steals);
 * // 3 4 1 1
 * ```
 */
export function curlingEndStats(ends: readonly CurlingEndScore[], options: { hammer?: CurlingSide } = {}): CurlingEndStats {
  if (!Array.isArray(ends)) throw new TypeError("ends is a list of ends, each { home, away }");
  const whole = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
  ends.forEach((e, i) => {
    if (typeof e !== "object" || e === null || !whole(e.home) || !whole(e.away)) throw new RangeError(`end ${i + 1} is not a whole number of points for each team`);
    if (e.home > 0 && e.away > 0) throw new RangeError(`end ${i + 1} has a score for both teams: one team scores in an end`);
  });
  const first = options.hammer ?? ends.find((e) => e.hammer === "home" || e.hammer === "away")?.hammer;
  const hammers = first === undefined ? undefined : curlingHammers(ends, first);
  const teams: Record<CurlingSide, CurlingTeamEnds> = {
    home: { points: 0, endsScored: 0, withHammer: emptyHammer(), withoutHammer: { ends: 0, steals: 0, points: 0, stealRate: null } },
    away: { points: 0, endsScored: 0, withHammer: emptyHammer(), withoutHammer: { ends: 0, steals: 0, points: 0, stealRate: null } },
  };
  const records: CurlingEndRecord[] = [];
  let homeTotal = 0;
  let awayTotal = 0;
  let blanks = 0;
  ends.forEach((e, i) => {
    const hammer = hammers === undefined ? null : hammers[i];
    const scoring: CurlingSide | null = e.home > 0 ? "home" : e.away > 0 ? "away" : null;
    const points = e.home + e.away;
    homeTotal += e.home;
    awayTotal += e.away;
    const blank = scoring === null;
    if (blank) blanks += 1;
    const steal = hammer !== null && scoring !== null && scoring !== hammer;
    const forced = hammer !== null && scoring === hammer && points === 1;
    records.push({ end: i + 1, home: e.home, away: e.away, hammer, scoring, points, blank, steal, forced, homeTotal, awayTotal });
    if (scoring !== null) {
      teams[scoring].points += points;
      teams[scoring].endsScored += 1;
    }
    if (hammer === null) return;
    const h = teams[hammer].withHammer;
    h.ends += 1;
    if (scoring === hammer) {
      h.scored += 1;
      h.points += points;
      if (points === 1) h.forced += 1;
      else h.multi += 1;
      if (points >= 3) h.big += 1;
    } else if (blank) h.blanked += 1;
    else h.stolen += 1;
    const n = teams[other(hammer)].withoutHammer;
    n.ends += 1;
    if (steal) {
      n.steals += 1;
      n.points += points;
    }
  });
  for (const side of ["home", "away"] as const) {
    const h = teams[side].withHammer;
    h.efficiency = mean(h.points, h.ends);
    h.scoringRate = percent(h.scored, h.ends);
    h.blankRate = percent(h.blanked, h.ends);
    h.forceRate = percent(h.forced, h.ends);
    h.stolenRate = percent(h.stolen, h.ends);
    const n = teams[side].withoutHammer;
    n.stealRate = percent(n.steals, n.ends);
  }
  return { ends: ends.length, blanks, records, home: teams.home, away: teams.away };
}

/** One end for the free guard analysis: the free guards each team had after the first four stones of the end (or whenever the caller counts them), and the points each scored. */
export interface CurlingGuardEnd {
  hammerGuards: number;
  otherGuards: number;
  hammerPoints: number;
  otherPoints: number;
}

/** What `curlingGuardScores` gives back. */
export interface CurlingGuardScores {
  /** The names of the bands of guards: `0`, `1-2` and `3+` by default. */
  bands: string[];
  /** For each band of guards the hammer team had: the ends, and the average points the hammer team scored in them. */
  hammer: { band: string; ends: number; average: number | null }[];
  /** The same for the guards the team without the hammer had and the points it scored. */
  other: { band: string; ends: number; average: number | null }[];
  /** Every pair of bands, the hammer team's first: the ends, and the average points each team scored. */
  cells: { hammer: string; other: string; ends: number; hammerAverage: number | null; otherAverage: number | null }[];
}

/**
 * How many points each team scored against how many free guards each had out: the free guard analysis (does the team with the hammer score more when it has put guards out, does the
 * team without it score more when it has?). The guards are put in bands, `0`, `1-2` and `3+` by default (`bands` are the lowest number of each band). `blanks: false` leaves the
 * blank ends out of the hammer team's averages, as a team that blanks an end has chosen to score nothing.
 * @throws TypeError when `ends` is not a list; RangeError for a number of guards or points that is not a whole number, or bands that do not rise from 0.
 * @example
 * ```ts
 * import { curlingGuardScores } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const table = curlingGuardScores([
 *   { hammerGuards: 0, otherGuards: 1, hammerPoints: 1, otherPoints: 0 },
 *   { hammerGuards: 2, otherGuards: 0, hammerPoints: 2, otherPoints: 0 },
 *   { hammerGuards: 1, otherGuards: 2, hammerPoints: 0, otherPoints: 1 },
 * ]);
 * console.log(table.bands.join(" "), table.hammer.map((b) => b.average ?? "-").join(" "));
 * // 0 1-2 3+ 1 1 -
 * ```
 */
export function curlingGuardScores(ends: readonly CurlingGuardEnd[], options: { bands?: readonly number[]; blanks?: boolean } = {}): CurlingGuardScores {
  if (!Array.isArray(ends)) throw new TypeError("ends is a list of ends, each { hammerGuards, otherGuards, hammerPoints, otherPoints }");
  const edges = options.bands ?? [0, 1, 3];
  if (edges.length === 0 || edges[0] !== 0 || !edges.every((e, i) => Number.isInteger(e) && (i === 0 || e > edges[i - 1]))) throw new RangeError("bands are whole numbers that rise from 0: the lowest number of guards of each band");
  const names = edges.map((e, i) => (i === edges.length - 1 ? `${e}+` : edges[i + 1] - 1 === e ? String(e) : `${e}-${edges[i + 1] - 1}`));
  const bandOf = (n: number): number => edges.reduce((at, e, i) => (n >= e ? i : at), 0);
  const whole = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
  ends.forEach((e, i) => {
    if (typeof e !== "object" || e === null || ![e.hammerGuards, e.otherGuards, e.hammerPoints, e.otherPoints].every(whole)) throw new RangeError(`end ${i + 1} needs a whole number for each of hammerGuards, otherGuards, hammerPoints and otherPoints`);
  });
  const blanks = options.blanks !== false;
  const average = (sum: number, n: number): number | null => mean(sum, n);
  const sums = (pick: (e: CurlingGuardEnd) => number, points: (e: CurlingGuardEnd) => number, keep: (e: CurlingGuardEnd) => boolean): { band: string; ends: number; average: number | null }[] =>
    names.map((band, i) => {
      const list = ends.filter((e) => bandOf(pick(e)) === i && keep(e));
      return { band, ends: list.length, average: average(list.reduce((sum, e) => sum + points(e), 0), list.length) };
    });
  const cells = names.flatMap((hammer, h) =>
    names.map((other, o) => {
      const list = ends.filter((e) => bandOf(e.hammerGuards) === h && bandOf(e.otherGuards) === o);
      const kept = list.filter((e) => blanks || e.hammerPoints > 0 || e.otherPoints > 0);
      return { hammer, other, ends: list.length, hammerAverage: average(kept.reduce((sum, e) => sum + e.hammerPoints, 0), kept.length), otherAverage: average(list.reduce((sum, e) => sum + e.otherPoints, 0), list.length) };
    }),
  );
  return {
    bands: names,
    hammer: sums((e) => e.hammerGuards, (e) => e.hammerPoints, (e) => blanks || e.hammerPoints > 0 || e.otherPoints > 0),
    other: sums((e) => e.otherGuards, (e) => e.otherPoints, () => true),
    cells,
  };
}

// ----- the shots of a game

/** One shot, as a shot-by-shot summary gives it: who threw it, what kind it was, and how it was scored from 0 to 4 (4 is the perfect shot). `hit` says whether it was a hit, when the type does not. */
export interface CurlingShot {
  team?: CurlingSide | (string & {});
  /** The kind of shot, as the summary names it: `draw`, `take-out`, `guard`, `clearing`, `hit and roll`... */
  type?: string;
  /** How well it was played, 0 to 4 (World Curling's scale). A shot without a score is counted in the types and left out of the percentage. */
  score?: number | null;
  hit?: boolean;
}

/** The shot types that are hits: a stone thrown to take out another. Any other type is not a hit, unless the shot says `hit`. */
export const CURLING_HIT_TYPES: readonly string[] = Object.freeze(["take-out", "double take-out", "raise take-out", "hit and roll", "peel", "clearing", "runback"]);

/** A shot type as it is compared and named: lower case, one space between words (`Hit-and-Roll` and `Hit & Roll` are `hit and roll`). */
const typeKey = (type: string): string => type.toLowerCase().replace(/&/g, " and ").replace(/[\s_-]+/g, " ").trim();

/** True for a shot that is a hit: it says so, or its type is one of `CURLING_HIT_TYPES`. */
export function curlingIsHit(shot: CurlingShot): boolean {
  if (typeof shot.hit === "boolean") return shot.hit;
  if (typeof shot.type !== "string") return false;
  const key = typeKey(shot.type);
  return CURLING_HIT_TYPES.some((t) => typeKey(t) === key);
}

/** A group of shots: how many, how many were scored, and the shot percentage. */
export interface CurlingShotLine {
  shots: number;
  /** Shots with a score, and the points they earned out of 4 each. */
  scored: number;
  points: number;
  /** The shot percentage: the points as a percent of the most they could earn, 4 for each scored shot. */
  percent: number | null;
  hits: number;
  /** Percent of the shots that were hits. */
  hitRate: number | null;
}

/** What `curlingShotStats` gives back. */
export interface CurlingShotStats extends CurlingShotLine {
  /** For each team (as the shots name it). */
  teams: Record<string, CurlingShotLine>;
  /** For each type of shot, most played first: the line, and its share of all the shots as a percent. */
  types: (CurlingShotLine & { type: string; share: number | null })[];
  /** Shots that were not scored, and shots with no place in `teams` or `types` because they name none. */
  unscored: number;
}

const tally = (shots: readonly CurlingShot[]): CurlingShotLine => {
  let scored = 0;
  let points = 0;
  let hits = 0;
  for (const s of shots) {
    if (typeof s.score === "number" && Number.isFinite(s.score)) {
      scored += 1;
      points += s.score;
    }
    if (curlingIsHit(s)) hits += 1;
  }
  return { shots: shots.length, scored, points, percent: percent(points, 4 * scored), hits, hitRate: percent(hits, shots.length) };
};

/**
 * The shots of a game, by team and by type: the shot percentage (the points earned, 0 to 4 for each shot, as a percent of 4 for each scored shot, the way World Curling's shot-by-shot
 * summaries and broadcasts count it), the hit rate, and how often each type of shot was played. A score outside 0 to 4 is an error.
 * @throws TypeError when `shots` is not a list; RangeError for a score that is not between 0 and 4.
 * @example
 * ```ts
 * import { curlingShotStats } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const shots = curlingShotStats([
 *   { team: "home", type: "draw", score: 4 },
 *   { team: "home", type: "take-out", score: 3 },
 *   { team: "away", type: "Hit and Roll", score: 2 },
 *   { team: "away", type: "guard", score: 4 },
 * ]);
 * console.log(shots.percent, shots.teams.home.percent, shots.hitRate, shots.types[0].type);
 * // 81.3 87.5 50 draw
 * ```
 */
export function curlingShotStats(shots: readonly CurlingShot[]): CurlingShotStats {
  if (!Array.isArray(shots)) throw new TypeError("shots is a list of shots");
  shots.forEach((s, i) => {
    if (typeof s !== "object" || s === null) throw new TypeError(`shot ${i + 1} is not a shot`);
    if (s.score !== undefined && s.score !== null && !(typeof s.score === "number" && s.score >= 0 && s.score <= 4)) throw new RangeError(`shot ${i + 1} has the score ${String(s.score)}: a shot is scored 0 to 4`);
  });
  const byTeam = new Map<string, CurlingShot[]>();
  const byType = new Map<string, { name: string; shots: CurlingShot[] }>();
  for (const s of shots) {
    if (typeof s.team === "string" && s.team !== "") byTeam.set(s.team, [...(byTeam.get(s.team) ?? []), s]);
    if (typeof s.type === "string" && s.type.trim() !== "") {
      const key = typeKey(s.type);
      const held = byType.get(key) ?? { name: key, shots: [] };
      held.shots.push(s);
      byType.set(key, held);
    }
  }
  const types = [...byType.values()]
    .map((t) => ({ type: t.name, ...tally(t.shots), share: percent(t.shots.length, shots.length) }))
    .sort((a, b) => b.shots - a.shots || a.type.localeCompare(b.type));
  return { ...tally(shots), teams: Object.fromEntries([...byTeam].map(([team, list]) => [team, tally(list)])), types, unscored: shots.filter((s) => typeof s.score !== "number").length };
}
