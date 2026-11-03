// A feed of a game read into a replay: kyogijo's own open timeline (a bare timeline, or a game file with its sides and periods) or a play-by-play of a shape that is common, each read by a pure function of
// its own (an adapter). The answer is the user's: it comes from a file they picked, text they pasted or an address they gave, and nothing in it is trusted. Every number is checked, every list is capped,
// and a name is only ever text. Nothing here fetches: `feeds.fetch.ts` is the page's side.
import { FEED_LIMITS, FeedError, feedText, type FeedFormat, type FeedGame, type FeedPlayer, type FeedSide } from "./feeds.core.ts";
import { nhlPlayByPlay } from "./feeds.nhl.ts";
import type { ReplayEvent, ReplayFrame, ReplayObject, ReplayPeriod, ReplayTeam, ReplayTimeline } from "./replay.types.ts";

export { FEED_FORMATS, FEED_LIMITS, FeedError, feedText } from "./feeds.core.ts";
export type { FeedFormat, FeedGame, FeedPlayer, FeedSide } from "./feeds.core.ts";

const TEAMS: readonly ReplayTeam[] = ["home", "away", "ball", "puck", "official"];
const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isObj = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
/** A side of a feed's game, as a scoreboard writes it: its letters, name and colour as text. */
const sideOf = (value: unknown): FeedSide | undefined => {
  if (!isObj(value)) return undefined;
  const name = isObj(value.name) ? feedText(value.name.en ?? Object.values(value.name)[0]) : feedText(value.name);
  const side: FeedSide = {};
  const abbr = feedText(value.abbr, 8);
  const color = feedText(value.color, 32);
  if (abbr !== undefined) side.abbr = abbr;
  if (name !== undefined) side.name = name;
  if (color !== undefined && /^#[0-9a-f]{3,8}$/i.test(color)) side.color = color;
  return side;
};

/** An object of a frame, checked: an id, a known team and a place, else nothing. */
function objectOf(value: unknown): ReplayObject | undefined {
  if (!isObj(value) || !isNum(value.x) || !isNum(value.y)) return undefined;
  const id = feedText(value.id, 40);
  const team = TEAMS.find((t) => t === value.team);
  if (id === undefined || team === undefined) return undefined;
  const o: ReplayObject = { id, team, x: value.x, y: value.y };
  const label = feedText(value.label);
  if (label !== undefined) o.label = label;
  if (isNum(value.number) || typeof value.number === "string") o.number = typeof value.number === "string" ? (feedText(value.number, 4) ?? "") : value.number;
  return o;
}

/** An event, checked: a time and a kind, and what else it has that is of the right type. */
function eventOf(value: unknown): ReplayEvent | undefined {
  if (!isObj(value) || !isNum(value.t)) return undefined;
  const kind = feedText(value.kind, 24);
  if (kind === undefined) return undefined;
  const e: ReplayEvent = { t: value.t, kind };
  if (value.team === "home" || value.team === "away") e.team = value.team;
  for (const key of ["x", "y", "x2", "y2", "until"] as const) if (isNum(value[key])) e[key] = value[key];
  for (const key of ["by", "to"] as const) {
    const text = feedText(value[key], 40);
    if (text !== undefined) e[key] = text;
  }
  const label = feedText(value.label);
  if (label !== undefined) e.label = label;
  return e;
}

/** A period, checked: a start and an end no earlier than it, and its number and game-clock length when they are numbers. */
function periodOf(value: unknown): ReplayPeriod | undefined {
  if (!isObj(value) || !isNum(value.start) || !isNum(value.end) || value.end < value.start) return undefined;
  return { start: value.start, end: value.end, ...(isNum(value.number) ? { number: value.number } : {}), ...(isNum(value.length) && value.length > 0 ? { length: value.length } : {}) };
}

const FROM = /^[a-z0-9-]{1,32}$/;

/**
 * Read kyogijo's own open timeline: a bare timeline (`{ frames, events?, periods?, teams?, from? }`) or a game file (`{ kind: "kyogijo-game", sport, teams, periods, timeline }`, as `examples/games` has them).
 * Every frame, object, event and period is checked; what is not of the format is left out, and a timeline with no frame is an error.
 */
export function kyogijoFeed(json: unknown): FeedGame {
  if (!isObj(json)) throw new FeedError("format", "not a kyogijo timeline: the answer is not a JSON object");
  const game = json.kind === "kyogijo-game" && isObj(json.timeline);
  const source = game ? (json.timeline as Record<string, unknown>) : json;
  if (!Array.isArray(source.frames)) throw new FeedError("format", "not a kyogijo timeline: it has no list of frames");
  const frames: ReplayFrame[] = [];
  for (const f of source.frames.slice(0, FEED_LIMITS.frames)) {
    if (!isObj(f) || !isNum(f.t) || !Array.isArray(f.objects)) continue;
    const objects = f.objects.slice(0, FEED_LIMITS.objects).map(objectOf).filter((o): o is ReplayObject => o !== undefined);
    const frame: ReplayFrame = { t: f.t, objects };
    if (f.possession === null || typeof f.possession === "string") frame.possession = f.possession === null ? null : feedText(f.possession, 40) ?? null;
    frames.push(frame);
  }
  if (frames.length === 0) throw new FeedError("empty", "the timeline has no frame to play");
  const events = (Array.isArray(source.events) ? source.events.slice(0, FEED_LIMITS.events) : []).map(eventOf).filter((e): e is ReplayEvent => e !== undefined);
  const periodsIn = game ? json.periods : source.periods;
  const periods = (Array.isArray(periodsIn) ? periodsIn.slice(0, FEED_LIMITS.periods) : []).map(periodOf).filter((p): p is ReplayPeriod => p !== undefined);
  const teamsIn = game ? json.teams : source.teams;
  const home = isObj(teamsIn) ? sideOf(teamsIn.home) : undefined;
  const away = isObj(teamsIn) ? sideOf(teamsIn.away) : undefined;
  const timeline: ReplayTimeline = {
    frames,
    events,
    ...(typeof source.from === "string" && FROM.test(source.from) ? { from: source.from } : {}),
    ...(periods.length > 0 ? { periods } : {}),
    ...(source.clock === "up" || source.clock === "down" ? { clock: source.clock } : {}),
  };
  const players: Record<string, FeedPlayer> = {};
  const rosters = game && isObj(json.rosters) ? json.rosters : {};
  for (const side of ["home", "away"] as const) {
    const roster: unknown = rosters[side];
    if (!Array.isArray(roster)) continue;
    for (const p of roster.slice(0, 80) as unknown[]) {
      const id = isObj(p) ? feedText(p.id, 40) : undefined;
      if (id === undefined || !isObj(p)) continue;
      const name = isObj(p.name) ? feedText(p.name.en ?? Object.values(p.name)[0]) : feedText(p.name);
      players[id] = { side, ...(isNum(p.number) ? { number: p.number } : {}), ...(name === undefined ? {} : { name }) };
    }
  }
  const sport = game ? feedText(json.sport, 24) : undefined;
  return { format: "kyogijo", ...(sport === undefined ? {} : { sport }), timeline, teams: { home: home ?? {}, away: away ?? {} }, ended: true, players };
}

/** Which format a feed's answer is in: a timeline or a game file of kyogijo's, or a play-by-play shaped as the NHL's. `undefined` when it is neither. */
export function feedFormatOf(json: unknown): Exclude<FeedFormat, "auto"> | undefined {
  if (!isObj(json)) return undefined;
  if (json.kind === "kyogijo-game" || Array.isArray(json.frames)) return "kyogijo";
  if (Array.isArray(json.plays) && (isObj(json.homeTeam) || isObj(json.awayTeam))) return "nhl";
  return undefined;
}

/**
 * Read a feed's answer into a game: in the format asked, or the one `feedFormatOf` finds. Throws a `FeedError` (`format`, `empty`) that says what was wrong in plain words.
 * @example
 * ```ts
 * import { readFeed } from "@johnmorrisdotca/kyogijo-stadiums/feeds";
 * const answer = { frames: [{ t: 0, objects: [{ id: "puck", team: "puck", x: 0, y: 0 }] }, { t: 30, objects: [{ id: "puck", team: "puck", x: 80, y: 4 }] }], events: [{ t: 30, kind: "goal", team: "home" }], from: "nhl-api" };
 * const game = readFeed(answer);
 * console.log(game.format, game.timeline.frames.length, game.timeline.events?.length);
 * try { readFeed({ hello: "world" }); } catch (error) { console.log((error as Error).name, (error as { kind?: string }).kind); }
 * // kyogijo 2 1
 * // FeedError format
 * ```
 */
export function readFeed(json: unknown, format: FeedFormat = "auto"): FeedGame {
  const as = format === "auto" ? feedFormatOf(json) : format;
  if (as === "kyogijo") return kyogijoFeed(json);
  if (as === "nhl") return nhlPlayByPlay(json);
  throw new FeedError("format", "not a feed this package reads: neither a kyogijo timeline nor an NHL-style play-by-play");
}

/** Read text (a file or what was pasted) as JSON and then as a feed. */
export function readFeedText(text: string, format: FeedFormat = "auto"): FeedGame {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new FeedError("format", "not JSON: the text could not be read");
  }
  return readFeed(json, format);
}
