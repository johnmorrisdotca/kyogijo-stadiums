// An adapter: a play-by-play shaped as the NHL's public one (`plays`, each with `periodDescriptor`, `timeInPeriod`, `typeDescKey` and `details` with `xCoord` and `yCoord` in feet from centre ice; `homeTeam` and
// `awayTeam` with their `id` and `abbrev`; `rosterSpots`; `gameState`) read into a replay. A play-by-play has events and no tracking: the puck goes from one event's place to the next in a straight line (it is
// modelled between the known places), the shots, the goals and the whistles are marked where they were, and the clock is the game's (twenty minutes a period). Pure; every value is checked. The shape was read
// from public descriptions of the answer; tests run on answers we made up.
import { FEED_LIMITS, FeedError, feedText, type FeedGame, type FeedPlayer, type FeedSide } from "./feeds.core.ts";
import type { ReplayEvent, ReplayFrame, ReplayPeriod } from "./replay.types.ts";

const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isObj = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
/** A text field of the NHL's shape: a string, or `{ default: string }`. */
const textOf = (value: unknown, most?: number): string | undefined => feedText(isObj(value) ? value.default : value, most);
/** `mm:ss` as seconds; `undefined` for anything else. */
const secondsOf = (value: unknown): number | undefined => {
  const m = typeof value === "string" ? /^(\d{1,3}):([0-5]\d)$/.exec(value.trim()) : null;
  return m === null ? undefined : Number(m[1]) * 60 + Number(m[2]);
};

/** A regulation period, and an overtime in the regular season (the playoffs play twenty-minute overtimes): seconds. */
export const NHL_PERIOD = 1200;
export const NHL_OVERTIME = 300;

/** What a kind of play is on the replay: the shots, the goal, and a whistle for a stoppage or a penalty. The rest only moves the puck. */
const KINDS: Record<string, string> = { "shot-on-goal": "shot", "missed-shot": "shot", "blocked-shot": "shot", goal: "goal", stoppage: "whistle", penalty: "whistle", "delayed-penalty": "whistle" };

/** The states of a game the NHL's shape says are over. */
const OVER = new Set(["OFF", "FINAL"]);

/**
 * Read a play-by-play shaped as the NHL's public one into a game: the puck's places at the plays that have one (between them it moves in a straight line), a mark for each shot, goal and whistle, the periods with their
 * clocks (a twenty-minute period, the board counting it down, an overtime of five minutes in the regular season and twenty in the playoffs, the shoot-out left out), each side's letters and name from the feed, and the players it names
 * (by `p` and their id). Times are the game's, so the board's clock is the game's: period 2 starts at 1200 s. Throws a `FeedError` when it is not of the shape, or has no play with a place.
 * @example
 * ```ts
 * import { nhlPlayByPlay } from "@johnmorrisdotca/kyogijo-stadiums/feeds";
 * const answer = {
 *   gameState: "LIVE", gameType: 2,
 *   homeTeam: { id: 1, abbrev: "AAA", commonName: { default: "Aardvarks" } }, awayTeam: { id: 2, abbrev: "BBB" },
 *   plays: [
 *     { periodDescriptor: { number: 1, periodType: "REG" }, timeInPeriod: "00:00", typeDescKey: "faceoff", sortOrder: 1, details: { xCoord: 0, yCoord: 0 } },
 *     { periodDescriptor: { number: 1, periodType: "REG" }, timeInPeriod: "01:30", typeDescKey: "goal", sortOrder: 2, details: { xCoord: 80, yCoord: -4, eventOwnerTeamId: 1, scoringPlayerId: 9 } },
 *   ],
 *   rosterSpots: [{ teamId: 1, playerId: 9, sweaterNumber: 19, firstName: { default: "Ada" }, lastName: { default: "Example" } }],
 * };
 * const game = nhlPlayByPlay(answer);
 * console.log(game.timeline.events, game.teams.home, game.ended);
 * console.log(game.players.p9);
 * // [ { t: 90, kind: 'goal', x: 80, y: -4, team: 'home', by: 'p9' } ] { abbr: 'AAA', name: 'Aardvarks' } false
 * // { side: 'home', number: 19, name: 'Ada Example' }
 * ```
 */
export function nhlPlayByPlay(json: unknown): FeedGame {
  if (!isObj(json) || !Array.isArray(json.plays)) throw new FeedError("format", "not an NHL-style play-by-play: it has no list of plays");
  const home = isObj(json.homeTeam) ? json.homeTeam : {};
  const away = isObj(json.awayTeam) ? json.awayTeam : {};
  const sideOf = (teamId: unknown): "home" | "away" | undefined => (teamId !== undefined && teamId === home.id ? "home" : teamId !== undefined && teamId === away.id ? "away" : undefined);
  const playoffs = json.gameType === 3;
  const lengthOf = (number: number, type: unknown): number => (type === "OT" || (type === undefined && number > 3) ? (playoffs ? NHL_PERIOD : NHL_OVERTIME) : NHL_PERIOD);
  // The plays in order, the shoot-out left out (it has no clock, and its goals are not the score's).
  const plays = json.plays
    .slice(0, FEED_LIMITS.events)
    .filter(isObj)
    .map((play, i) => ({ play, order: isNum(play.sortOrder) ? play.sortOrder : i }))
    .sort((a, b) => a.order - b.order)
    .map((one) => one.play);
  const periods = new Map<number, ReplayPeriod>();
  const frames: ReplayFrame[] = [];
  const events: ReplayEvent[] = [];
  /** The time a period starts on the game's clock: the lengths of the periods before it. */
  const startOf = (number: number, type: unknown): number => {
    let start = 0;
    for (let p = 1; p < number; p += 1) start += lengthOf(p, p <= 3 ? "REG" : type);
    return start;
  };
  for (const play of plays) {
    const d = isObj(play.periodDescriptor) ? play.periodDescriptor : {};
    const number = isNum(d.number) && d.number >= 1 && d.number <= FEED_LIMITS.periods ? Math.trunc(d.number) : undefined;
    if (number === undefined || d.periodType === "SO") continue;
    const length = lengthOf(number, d.periodType);
    const start = startOf(number, d.periodType);
    if (!periods.has(number)) periods.set(number, { number, start, end: start + length });
    const into = secondsOf(play.timeInPeriod);
    if (into === undefined) continue;
    const t = start + Math.min(length, into);
    const details = isObj(play.details) ? play.details : {};
    const placed = isNum(details.xCoord) && isNum(details.yCoord);
    const [x, y] = placed ? [Math.max(-100, Math.min(100, details.xCoord as number)), Math.max(-42.5, Math.min(42.5, details.yCoord as number))] : [0, 0];
    const type = typeof play.typeDescKey === "string" ? play.typeDescKey : "";
    // A period starts with the puck at centre ice.
    if (type === "period-start") frames.push({ t, objects: [{ id: "puck", team: "puck", x: 0, y: 0 }] });
    if (placed) frames.push({ t, objects: [{ id: "puck", team: "puck", x, y }] });
    const kind = KINDS[type];
    if (kind === undefined) continue;
    const team = sideOf(details.eventOwnerTeamId);
    const by = isNum(details.scoringPlayerId) ? details.scoringPlayerId : isNum(details.shootingPlayerId) ? details.shootingPlayerId : isNum(details.committedByPlayerId) ? details.committedByPlayerId : undefined;
    events.push({ t, kind, ...(placed ? { x, y } : {}), ...(team === undefined ? {} : { team }), ...(by === undefined ? {} : { by: `p${by}` }) });
  }
  if (frames.length === 0) throw new FeedError("empty", "the play-by-play has no play with a place on the ice yet");
  // Frames at one time keep the last; the timeline is in order.
  const byTime = new Map<number, ReplayFrame>();
  for (const f of frames) byTime.set(f.t, f);
  const ordered = [...byTime.values()].sort((a, b) => a.t - b.t);
  const side = (team: Record<string, unknown>): FeedSide => {
    const abbr = textOf(team.abbrev, 8);
    const name = textOf(team.commonName) ?? textOf(team.name) ?? textOf(team.placeName);
    return { ...(abbr === undefined ? {} : { abbr }), ...(name === undefined ? {} : { name }) };
  };
  const players: Record<string, FeedPlayer> = {};
  if (Array.isArray(json.rosterSpots)) {
    for (const spot of json.rosterSpots.slice(0, 120)) {
      if (!isObj(spot) || !isNum(spot.playerId)) continue;
      const s = sideOf(spot.teamId);
      if (s === undefined) continue;
      const name = [textOf(spot.firstName, 40), textOf(spot.lastName, 40)].filter((part) => part !== undefined).join(" ");
      players[`p${spot.playerId}`] = { side: s, ...(isNum(spot.sweaterNumber) ? { number: spot.sweaterNumber } : {}), ...(name === "" ? {} : { name }) };
    }
  }
  const state = typeof json.gameState === "string" ? json.gameState : "";
  return {
    format: "nhl",
    sport: "nhl",
    timeline: { from: "nhl-api", frames: ordered, events, periods: [...periods.values()].sort((a, b) => a.start - b.start) },
    teams: { home: side(home), away: side(away) },
    ended: OVER.has(state),
    players,
  };
}
