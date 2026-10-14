// What the demo's playground is, apart from the page: the state a web address asks for, the options that state draws, the
// choices every control offers, and which rows are shown. The page's script (demo.js) runs it in the browser; the build
// (scripts/site.mjs) runs the same code to write the first view into the HTML, so what the script finds is what it would draw.
import { COURT_THEMES, ERA_SPORTS, GROUNDS, LEAGUES, PARKS, SOCCER_PITCH_IDS, SOCCER_PROVIDER_IDS, SPORTS, eraRange, hasHistory, leagueChanges } from "./dist/index.js";
import { EMBLEM_GROUPS } from "./emblems.js";
import { EMBLEMS, FAMILIES, GAMES, TEAMS, TEAMS_JA } from "./examples.js";
import { poolRace, shortRace } from "./pool-data.js";

export const SIZES = ["full", "compact", "badge", "surface"];
export const ORIENTATIONS = ["landscape", "portrait", "auto"];
export const THEMES = ["auto", "light", "dark"];
export const STATUSES = ["final", "final-ot", "final-so", "final-aet", "final-pens", "live", "half", "custom"];
export const PATTERNS = ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal", "none"];
export const GOALS = ["box", "line", "strip", "none"];
export const HALVES = ["none", "left", "right"];
/** How much of a curling sheet: all of it, only the top end, only the bottom end, or the whole sheet folded with both houses enlarged beside it. */
export const SHEETS = ["sheet", "top", "bottom", "folded"];
export const WINNERS = ["auto", "leader", "none", "home", "away"];
export const VIEWS = ["flat", "3d"];
export const VIEWPOINTS = ["overhead", "broadcast", "end", "corner"];
export const PAGEANTS = ["off", "carpet", "stage"];
/** The sports a game's situation is drawn for, and what each control of it offers. */
export const SITUATION_SPORTS = ["nhl", "mlb", "nfl", "cfl", "ifaf"];
export const SIT_HOCKEY = ["pp", "en", "delayed", "shootout"];
export const SIT_OUTS = ["0", "1", "2"];
export const SIT_COUNTS = ["0-0", "1-1", "3-2"];
export const SIT_DOWNS = ["1", "2", "3", "4"];
export const SIT_TOGO = ["1", "7", "10", "goal"];
export const PAGEANT_LINES = ["over", "under", "through"];
export const TRACKS = ["red", "blue", "terracotta", "green"];
export const INFIELDS = ["pitch", "grass", "none"];
export const RACE_MARKS = ["none", "all"];
export const COURTS = ["default", "maple", "twoTone", "night", "sunburst", "tournament"];
export const POOL_LOOKS = ["flat", "water", "tiled"];
export const POOL_DECKS = ["plain", "tiled"];
export const POOL_COURSES = ["long", "short"];
export const POOL_LANES = ["6", "8", "10"];
export const POOL_RACES = ["none", "results", "pace"];
/** The ready-made emblems (Dougu Sports) a team's mark can be: the crests first (they take the team's colours), then the sports, the trophies, the medals, the awards, the balls and the gear. */
export const MARK_IDS = [...EMBLEM_GROUPS.crest, ...EMBLEM_GROUPS.sport, ...EMBLEM_GROUPS.trophy, ...EMBLEM_GROUPS.medal, ...EMBLEM_GROUPS.award, ...EMBLEM_GROUPS.ball, ...EMBLEM_GROUPS.gear];
/** The ready-made emblems that go in the centre of a pageant: the trophies, the medals, the awards and the balls. */
export const CENTRE_IDS = [...EMBLEM_GROUPS.trophy, ...EMBLEM_GROUPS.medal, ...EMBLEM_GROUPS.award, ...EMBLEM_GROUPS.ball];
/** The marks a team starts with: its crest. */
const MARKS = { away: "crest:shield", home: "crest:roundel" };
/** The sports whose surface is a pool. */
export const isPool = (sport) => sport === "swimming" || sport === "waterpolo" || sport === "diving" || sport === "artisticswimming";

const pick = (value, list, fallback) => (list.includes(value) ? value : fallback);

/** The state a web address asks for (`params`), with the page theme the reader kept (`kept`) when the address names none. */
export function makeState(params, kept = null) {
  return {
    sport: pick(params.get("sport"), SPORTS, "nhl"),
    // The league whose rulebook marks the surface: the sport's own (its first) unless the address names another.
    league: params.get("league") || null,
    park: params.get("park") && (PARKS[params.get("park")] || params.get("park") === "generic") ? params.get("park") : "generic",
    // The season to draw the surface in, or null for today's (a year in the address turns it on).
    year: /^\d{4}$/.test(params.get("year") || "") ? Number(params.get("year")) : null,
    size: pick(params.get("size"), SIZES, "full"),
    orientation: pick(params.get("orientation"), ORIENTATIONS, "auto"),
    theme: pick(params.get("theme") ?? kept, THEMES, "auto"),
    // How the surface is looked at: the flat drawing, or the 3D view that turns, and the viewpoint it is on.
    view: pick(params.get("view"), VIEWS, "flat"),
    viewpoint: pick(params.get("viewpoint"), VIEWPOINTS, "corner"),
    away: {},
    home: {},
    status: "final",
    statusText: "",
    competition: "",
    date: "",
    label: "",
    winner: "auto",
    detail: "full",
    // The pageant: each team's flag laid over its half (carpets) or on a round stage, with a cup in the centre and an entrance, if asked.
    pageant: pick(params.get("pageant"), PAGEANTS, "off"),
    pageantLines: pick(params.get("pageantlines"), PAGEANT_LINES, "over"),
    pageantEmblem: params.get("emblem") === "1",
    pageantEmblemId: CENTRE_IDS.includes(params.get("emblemid")) ? params.get("emblemid") : "trophy:soccer-globe",
    emblemLine: params.get("emblemline") === "1",
    pageantEntrance: false,
    stripes: true,
    exact: false,
    court: pick(params.get("court"), COURTS, "default"),
    poolLook: pick(params.get("poollook"), POOL_LOOKS, "flat"),
    poolDeck: pick(params.get("pooldeck"), POOL_DECKS, "plain"),
    poolCourse: pick(params.get("poolcourse"), POOL_COURSES, "long"),
    poolLanes: pick(params.get("poollanes"), POOL_LANES, "8"),
    poolRace: pick(params.get("poolrace"), POOL_RACES, "none"),
    poolSection: params.get("poolsection") === "1",
    pitch: pick(params.get("pitch"), SOCCER_PITCH_IDS, "fifa"),
    ground: params.get("ground") && GROUNDS[params.get("ground")] ? params.get("ground") : "none",
    pitchType: pick(params.get("pitchtype"), SOCCER_PROVIDER_IDS, "none"),
    pattern: pick(params.get("pattern"), PATTERNS, "bands"),
    goals: pick(params.get("goals"), GOALS, "box"),
    half: pick(params.get("half"), HALVES, "none"),
    sheet: pick(params.get("sheet"), SHEETS, "sheet"),
    track: pick(params.get("track"), TRACKS, "red"),
    infield: pick(params.get("infield"), INFIELDS, "pitch"),
    races: pick(params.get("races"), RACE_MARKS, "none"),
    flags: params.get("flags") !== "0",
    baseline: params.get("baseline") === "1",
    centreLogo: false,
    hardwood: params.get("hardwood") === "1",
    crowd: params.get("crowd") === "1",
    crowdDensity: /^\d{1,3}$/.test(params.get("crowddensity") || "") ? Math.min(100, Number(params.get("crowddensity"))) : 85,
    crowdTifo: params.get("crowdtifo") === "1",
    // The situation of the game: hockey's strength, baseball's runners, outs and count, football's down, distance and ball.
    situation: params.get("situation") === "1",
    sitHockey: pick(params.get("sithockey"), SIT_HOCKEY, "pp"),
    sitBases: /^[01]{3}$/.test(params.get("sitbases") || "") ? params.get("sitbases") : "101",
    sitOuts: pick(params.get("sitouts"), SIT_OUTS, "2"),
    sitCount: pick(params.get("sitcount"), SIT_COUNTS, "3-2"),
    sitDown: pick(params.get("sitdown"), SIT_DOWNS, "3"),
    sitToGo: pick(params.get("sittogo"), SIT_TOGO, "7"),
    sitBallOn: /^\d{1,3}$/.test(params.get("sitballon") || "") ? Math.min(100, Number(params.get("sitballon"))) : 88,
    sitDrive: params.get("sitdrive") === "1",
    touched: new Set(),
    embed: "module",
  };
}

/** Whether the options this state draws hold the id of a ready-made emblem, so that the code the page shows must plug Dougu Sports in. */
export const usesEmblems = (s) => (s.away.logo === "ready" || s.home.logo === "ready") && s.size !== "surface" || (s.pageant !== "off" && s.pageantEmblem && s.size !== "surface");

/** An emblem's id as a logo is given: with `/line` after it when the outline style is on. The code the page shows is this same string. */
export const emblemRef = (id, s) => (s.emblemLine ? `${id}/line` : id);

/** The made-up game for a sport, laid into the state (names in the page's language until a name is typed). */
export function loadGame(state, sport, lang) {
  const family = FAMILIES[sport];
  const game = GAMES[sport];
  for (const role of ["away", "home"]) {
    const base = TEAMS[family][role];
    state[role] = { name: lang === "ja" ? TEAMS_JA[family][role] : base.name, abbr: base.abbr, score: String(game[role]), color: base.color, logo: "emblem", emblem: base.emblem, mark: state[role]?.mark ?? MARKS[role], url: "" };
  }
  state.away.pens = game.awayPens === undefined ? "" : String(game.awayPens);
  state.home.pens = game.homePens === undefined ? "" : String(game.homePens);
  state.status = STATUSES.includes(game.status) ? game.status : "custom";
  state.statusText = STATUSES.includes(game.status) ? "" : game.status;
  state.competition = game.competition;
  state.date = game.date;
  state.label = "";
  state.touched.clear();
}

/** A curling team's score in each end and the hammer, while the total is still the made-up game's: an edited score has no ends to show. */
export function curlingExtras(role, score) {
  const game = GAMES.curling;
  const ends = role === "away" ? game.awayEnds : game.homeEnds;
  const total = ends.reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);
  return score === total ? { ends, ...(game.hammer === role ? { hammer: true } : {}) } : {};
}

/** A net sport's team's score in each set and the server, while the total is still the made-up game's: an edited score has no sets to show. */
export function netExtras(sport, role, score) {
  const game = GAMES[sport];
  if (score !== game[role]) return {};
  const out = { sets: game[`${role}Sets`] };
  if (game[`${role}Tiebreaks`] !== undefined) out.tiebreaks = game[`${role}Tiebreaks`];
  if (game[`${role}Points`] !== undefined) out.points = game[`${role}Points`];
  if (game.serving === role) out.serving = true;
  return out;
}

/** What a field sport writes beside the score (goals and behinds, goals and points, wickets and overs), while the total is still the made-up game's: an edited score has none. */
export function fieldExtras(sport, role, score) {
  const game = GAMES[sport];
  return game[`${role}Extra`] !== undefined && score === game[role] ? game[`${role}Extra`] : {};
}

/** True when a league is the sport's own (the first of its list: the NBA for `nba`), which has the sport's history. */
export const isOwnLeague = (sport, league) => LEAGUES[sport].length === 0 || league === LEAGUES[sport].find((l) => l.builtIn && (l.family !== "football" || l.id === sport))?.id;
/** The league chosen, when it is not the sport's own. */
export const chosenLeague = (s) => (s.league === null || isOwnLeague(s.sport, s.league) ? undefined : LEAGUES[s.sport].find((l) => l.id === s.league));
/** True when the surface chosen has a history to slide through: the sport's own league's, or a league's cited one. */
export const hasSeasons = (s) => (chosenLeague(s) === undefined ? ERA_SPORTS.includes(s.sport) : hasHistory(chosenLeague(s)));
/** The seasons the surface chosen has a history for. */
export function seasonRange(s) {
  const league = chosenLeague(s);
  if (league === undefined) return eraRange(s.sport);
  const years = leagueChanges(s.sport, league.id).map((c) => c.from).filter((y) => y !== null);
  return { from: Math.min(...years) - 1, to: 2026 };
}

/** A made-up race for the swimming playground: the lanes the pool has, and, for the code a reader copies, flags as addresses (the picture's are SVG in code). */
function poolRaceFor(s, lang, forCode) {
  const lanes = Number(s.poolLanes);
  const base = s.poolCourse === "short" ? shortRace(lang) : poolRace(lang);
  const swimmers = base.swimmers.filter((one) => lanes === 10 || one.lane <= lanes).map((one) => (forCode ? { ...one, flag: `/flags/${one.abbr}.svg` } : one));
  return { ...base, swimmers, ...(s.poolRace === "pace" ? { pace: true } : {}) };
}

/** The pool the state asks for, or nothing when it asks for none of it. */
function poolOptions(s, lang, forCode) {
  const pool = {};
  if (s.poolLook !== "flat") pool.look = s.poolLook;
  if (s.poolDeck !== "plain") pool.deck = s.poolDeck;
  if (s.sport === "swimming") {
    if (s.poolCourse === "short") pool.course = "short";
    if (s.poolLanes !== "8") pool.lanes = Number(s.poolLanes);
    if (s.poolSection) pool.section = true;
    if (s.poolRace !== "none") pool.race = poolRaceFor(s, lang, forCode);
  }
  return Object.keys(pool).length === 0 ? undefined : pool;
}

/** The situation the state asks for, in the options' own words, for a sport that has one. */
export function situationFor(s) {
  if (s.sport === "nhl") {
    if (s.sitHockey === "pp") return { awaySkaters: 5, homeSkaters: 4, clock: "1:42" };
    if (s.sitHockey === "en") return { awaySkaters: 6, homeSkaters: 5, emptyNet: "away" };
    if (s.sitHockey === "delayed") return { delayedPenalty: "home" };
    return { shootout: { rounds: [[true, false], [true, true], [false, true], [false, false], [true, false]] } };
  }
  if (s.sport === "mlb") {
    const [balls, strikes] = s.sitCount.split("-").map(Number);
    return { bases: [...s.sitBases].map((c) => c === "1"), outs: Number(s.sitOuts), inning: 7, half: "top", balls, strikes };
  }
  const drive = [{ from: 25, to: 48, result: "punt" }, { from: 30, to: 100, result: "touchdown" }, { team: "home", from: 25, to: 40, result: "interception" }];
  return { ballOn: s.sitBallOn, down: Number(s.sitDown), toGo: s.sitToGo === "goal" ? "goal" : Number(s.sitToGo), possession: "away", ...(s.sitDrive ? { drive } : {}) };
}

/** What the state asks the package to draw. */
export function optionsFor(s, lang, forCode = false) {
  const o = { sport: s.sport, orientation: s.orientation, language: lang };
  if (s.detail !== "full") o.detail = s.detail;
  if (!s.stripes) o.stripes = false;
  if (s.exact) o.exactLines = true;
  if (s.sport === "mlb" && s.park !== "generic") o.park = s.park;
  if (s.league !== null && !isOwnLeague(s.sport, s.league)) o.league = s.league;
  if (s.year !== null && hasSeasons(s)) o.year = s.year;
  if (s.sport === "soccer") {
    if (s.pitch !== "fifa") o.pitch = s.pitch;
    if (s.ground !== "none") o.ground = s.ground;
    if (s.pitchType !== "none") o.pitchType = s.pitchType;
    if (s.pattern !== "bands") o.stripePattern = s.pattern;
    if (s.goals !== "box") o.goals = s.goals;
    if (s.half !== "none" && s.size === "surface") o.half = s.half;
    if (!s.flags) o.cornerFlags = false;
  }
  // A curling sheet: a part of it, or folded. A drawing with teams always shows the whole sheet.
  if (s.sport === "curling" && s.sheet !== "sheet" && s.size === "surface") o.sheet = s.sheet === "folded" ? { show: "folded" } : { show: "half", end: s.sheet };
  if (s.situation && SITUATION_SPORTS.includes(s.sport)) o.situation = situationFor(s);
  if (s.crowd) {
    // The stands and the people: every surface that has spectators; the share of seats taken from the slider, and a card display behind a goal on request.
    const crowd = {};
    if (s.crowdDensity !== 85) crowd.density = s.crowdDensity / 100;
    if (s.crowdTifo) crowd.tifo = "home";
    o.crowd = Object.keys(crowd).length === 0 ? true : crowd;
  }
  const pool = isPool(s.sport) ? poolOptions(s, lang, forCode) : undefined;
  if (pool !== undefined) o.pool = pool;
  if (s.sport === "skating" && s.races !== "none") o.skating = { races: s.races };
  if (s.sport === "athletics" && (s.track !== "red" || s.infield !== "pitch" || s.races !== "none")) {
    o.athletics = {};
    if (s.track !== "red") o.athletics.track = s.track;
    if (s.infield !== "pitch") o.athletics.infield = s.infield;
    if (s.races !== "none") o.athletics.races = s.races;
  }
  const names = [s.away.name, s.home.name];
  if (s.sport === "nba" && (s.court !== "default" || s.baseline || s.centreLogo || s.hardwood)) {
    const court = s.court === "default" ? {} : { ...COURT_THEMES[s.court] };
    if (s.hardwood) court.hardwood = true;
    if (s.baseline) court.baselineText = names.map((n) => n.toUpperCase().slice(0, 18));
    if (s.centreLogo) court.centreLogo = forCode ? "/logos/centre.svg" : EMBLEMS[s.home.emblem];
    o.court = court;
  }
  if (s.size !== "surface" && !(pool?.race !== undefined)) {
    const team = (t, placeholder) => {
      const out = { name: t.name, abbr: t.abbr, score: /^-?\d+$/.test(t.score) ? Number(t.score) : t.score, color: t.color };
      if (s.sport === "soccer" && /^\d+$/.test(t.pens ?? "")) out.penalties = Number(t.pens);
      if (s.sport === "curling") Object.assign(out, curlingExtras(t === s.away ? "away" : "home", out.score));
      if (GAMES[s.sport].awaySets !== undefined) Object.assign(out, netExtras(s.sport, t === s.away ? "away" : "home", out.score));
      Object.assign(out, fieldExtras(s.sport, t === s.away ? "away" : "home", out.score));
      if (t.logo === "ready") out.logo = emblemRef(t.mark, s);
      else if (t.logo === "emblem") out.logo = forCode ? placeholder : EMBLEMS[t.emblem];
      else if (t.logo === "url" && t.url) out.logo = t.url;
      return out;
    };
    o.away = team(s.away, "/logos/away.svg");
    o.home = team(s.home, "/logos/home.svg");
    o.size = s.size;
    const status = s.status === "custom" ? s.statusText : s.status;
    if (status) o.status = status;
    if (s.competition) o.competition = s.competition;
    if (s.date) o.date = s.date;
    if (s.label) o.label = s.label;
    if (s.winner !== "auto") o.winner = s.winner;
    if (s.pageant !== "off") {
      o.pageant = { style: s.pageant };
      if (s.pageantLines !== "over") o.pageant.lines = s.pageantLines;
      if (s.pageantEmblem) o.pageant.emblem = emblemRef(s.pageantEmblemId, s);
      if (s.pageantEntrance) o.pageant.animate = "unfurl";
    }
  }
  return o;
}

/** The words on a segmented choice's buttons: `say(key)` gives the page's word for a key. */
export const labelOf = (say, s) => ({
  sport: (v) => say(`sport_${v}`),
  size: (v) => say(`size_${v}`),
  orientation: (v) => say(`orientation_${v}`),
  theme: (v) => say(`theme_${v}`),
  view: (v) => say(`view_${v}`),
  status: (v) => say(`status_${v.replace(/-/g, "_")}`),
  winner: (v) => (v === "away" && s.sport === "mlb" ? say("awayBaseball") : say(`winner_${v}`)),
  detail: (v) => say(`detail_${v}`),
  pageant: (v) => say(`pageant_${v}`),
  pageantLines: (v) => say(`pageantLines_${v}`),
  sithockey: (v) => say(`sithockey_${v}`),
  sitplain: (v) => v,
  sittogo: (v) => (v === "goal" ? say("sitGoal") : v),
  court: (v) => say(`court_${v}`),
  poollook: (v) => say(`poollook_${v}`),
  pooldeck: (v) => say(`pooldeck_${v}`),
  poolcourse: (v) => say(`poolcourse_${v}`),
  poollanes: (v) => v,
  poolrace: (v) => say(`poolrace_${v}`),
  pattern: (v) => say(`pattern_${v}`),
  goals: (v) => say(`goals_${v}`),
  half: (v) => say(`half_${v}`),
  sheet: (v) => say(`sheet_${v}`),
  track: (v) => say(`track_${v}`),
  infield: (v) => say(`infield_${v}`),
  races: (v) => say(`races_${v}`),
  logo: (v) => say(`logo_${v}`),
  mark: (v) => v,
  era: (v) => say(`era_${v}`),
});

/** Statuses that belong to one sport: after extra time and on penalties are soccer's, the overtime and the shoot-out the others'. */
export const hiddenStatus = (sport, value) => (sport === "soccer" ? value === "final-ot" || value === "final-so" : value === "final-aet" || value === "final-pens");

/** Every segmented choice: its element, the kind of words it takes, its values, and the one that is on. */
export const SEGS = [
  { id: "sport", kind: "sport", values: SPORTS, get: (s) => s.sport },
  { id: "era", kind: "era", values: ["today", "past"], get: (s) => (s.year === null ? "today" : "past") },
  { id: "size", kind: "size", values: SIZES, get: (s) => s.size },
  { id: "orientation", kind: "orientation", values: ORIENTATIONS, get: (s) => s.orientation },
  { id: "view", kind: "view", values: VIEWS, get: (s) => s.view },
  { id: "theme", kind: "theme", values: THEMES, get: (s) => s.theme },
  { id: "status", kind: "status", values: STATUSES, get: (s) => s.status },
  { id: "winner", kind: "winner", values: WINNERS, get: (s) => s.winner },
  { id: "detail", kind: "detail", values: ["full", "simple"], get: (s) => s.detail },
  { id: "pageant", kind: "pageant", values: PAGEANTS, get: (s) => s.pageant },
  { id: "pageant-lines", kind: "pageantLines", values: PAGEANT_LINES, get: (s) => s.pageantLines },
  { id: "sit-hockey", kind: "sithockey", values: SIT_HOCKEY, get: (s) => s.sitHockey },
  { id: "sit-outs", kind: "sitplain", values: SIT_OUTS, get: (s) => s.sitOuts },
  { id: "sit-count", kind: "sitplain", values: SIT_COUNTS, get: (s) => s.sitCount },
  { id: "sit-down", kind: "sitplain", values: SIT_DOWNS, get: (s) => s.sitDown },
  { id: "sit-togo", kind: "sittogo", values: SIT_TOGO, get: (s) => s.sitToGo },
  { id: "court", kind: "court", values: COURTS, get: (s) => s.court },
  { id: "pool-look", kind: "poollook", values: POOL_LOOKS, get: (s) => s.poolLook },
  { id: "pool-deck", kind: "pooldeck", values: POOL_DECKS, get: (s) => s.poolDeck },
  { id: "pool-course", kind: "poolcourse", values: POOL_COURSES, get: (s) => s.poolCourse },
  { id: "pool-lanes", kind: "poollanes", values: POOL_LANES, get: (s) => s.poolLanes },
  { id: "pool-race", kind: "poolrace", values: POOL_RACES, get: (s) => s.poolRace },
  { id: "pattern", kind: "pattern", values: PATTERNS, get: (s) => s.pattern },
  { id: "goals", kind: "goals", values: GOALS, get: (s) => s.goals },
  { id: "half", kind: "half", values: HALVES, get: (s) => s.half },
  { id: "sheet", kind: "sheet", values: SHEETS, get: (s) => s.sheet },
  { id: "track", kind: "track", values: TRACKS, get: (s) => s.track },
  { id: "infield", kind: "infield", values: INFIELDS, get: (s) => s.infield },
  { id: "races", kind: "races", values: RACE_MARKS, get: (s) => s.races },
  { id: "away-logo", kind: "logo", values: ["none", "emblem", "ready", "url"], get: (s) => s.away.logo },
  { id: "home-logo", kind: "logo", values: ["none", "emblem", "ready", "url"], get: (s) => s.home.logo },
  { id: "away-mark", kind: "mark", values: MARK_IDS, get: (s) => s.away.mark },
  { id: "home-mark", kind: "mark", values: MARK_IDS, get: (s) => s.home.mark },
  { id: "pageant-emblem-id", kind: "mark", values: CENTRE_IDS, get: (s) => s.pageantEmblemId },
];

/** The on/off chips and the state they show. */
export const TOGGLES = [
  { id: "stripes", get: (s) => s.stripes },
  { id: "exact", get: (s) => s.exact },
  { id: "baseline", get: (s) => s.baseline },
  { id: "centre-logo", get: (s) => s.centreLogo },
  { id: "hardwood", get: (s) => s.hardwood },
  { id: "crowd", get: (s) => s.crowd },
  { id: "crowd-tifo", get: (s) => s.crowdTifo },
  { id: "flags", get: (s) => s.flags },
  { id: "pageant-emblem", get: (s) => s.pageantEmblem },
  { id: "emblem-line", get: (s) => s.emblemLine },
  { id: "pageant-entrance", get: (s) => s.pageantEntrance },
  { id: "pool-section", get: (s) => s.poolSection },
  { id: "situation", get: (s) => s.situation },
  { id: "sit-b1", get: (s) => s.sitBases[0] === "1" },
  { id: "sit-b2", get: (s) => s.sitBases[1] === "1" },
  { id: "sit-b3", get: (s) => s.sitBases[2] === "1" },
  { id: "sit-drive", get: (s) => s.sitDrive },
];

/** The text fields and what each holds. */
export const FIELDS = [
  ...["away", "home"].flatMap((role) => [
    { id: `${role}-name`, get: (s) => s[role].name },
    { id: `${role}-abbr`, get: (s) => s[role].abbr },
    { id: `${role}-score`, get: (s) => s[role].score },
    { id: `${role}-color`, get: (s) => s[role].color },
    { id: `${role}-logo-url`, get: (s) => s[role].url },
    { id: `${role}-pens`, get: (s) => s[role].pens ?? "" },
  ]),
  { id: "status-text", get: (s) => s.statusText },
  { id: "competition", get: (s) => s.competition },
  { id: "date", get: (s) => s.date },
  { id: "label", get: (s) => s.label },
];

/**
 * Which rows are hidden for a state: `true` for hidden. A row appears for the sports it belongs to (the ballpark for baseball,
 * the pitch rows for soccer, the court's looks for basketball), the league row when the sport has more than one league, the
 * season rows when the surface has a history, and the text of a status of your own when that status is chosen.
 */
export function hiddenRows(s) {
  const soccer = s.sport === "soccer";
  const seasons = hasSeasons(s);
  const past = s.year !== null;
  return {
    "park-row": s.sport !== "mlb",
    "league-row": LEAGUES[s.sport].length < 2,
    "pitch-row": !soccer,
    "ground-row": !soccer,
    "pitch-type-row": !soccer,
    "soccer-group": !soccer,
    "curling-group": s.sport !== "curling",
    "away-pens-row": !soccer,
    "home-pens-row": !soccer,
    "era-group": !seasons,
    "era-year-row": !(seasons && past),
    "era-notes": !(seasons && past),
    "court-group": s.sport !== "nba",
    "crowd-row": !s.crowd,
    "situation-group": !SITUATION_SPORTS.includes(s.sport),
    "sit-hockey-row": !(s.situation && s.sport === "nhl"),
    "sit-baseball-row": !(s.situation && s.sport === "mlb"),
    "sit-football-row": !(s.situation && (s.sport === "nfl" || s.sport === "cfl" || s.sport === "ifaf")),
    "pageant-group": s.pageant === "off" || s.size === "surface",
    "pool-group": !isPool(s.sport),
    "swim-group": s.sport !== "swimming",
    "athletics-group": s.sport !== "athletics",
    "races-group": s.sport !== "athletics" && s.sport !== "skating",
    "status-text": s.status !== "custom",
    "away-mark-row": s.away.logo !== "ready",
    "home-mark-row": s.home.logo !== "ready",
    "pageant-emblem-row": s.pageant === "off" || s.size === "surface" || !s.pageantEmblem,
    "emblem-line-row": !(s.away.logo === "ready" || s.home.logo === "ready" || (s.pageant !== "off" && s.size !== "surface" && s.pageantEmblem)),
    "away-logo-url": s.away.logo !== "url",
    "home-logo-url": s.home.logo !== "url",
  };
}
