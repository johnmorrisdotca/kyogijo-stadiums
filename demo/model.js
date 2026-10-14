// What the demo's playground is, apart from the page: the state a web address asks for, the options that state draws, the
// choices every control offers, and which rows are shown. The page's script (demo.js) runs it in the browser; the build
// (scripts/site.mjs) runs the same code to write the first view into the HTML, so what the script finds is what it would draw.
import { COURT_THEMES, ERA_SPORTS, GROUNDS, LEAGUES, PARKS, SOCCER_PITCH_IDS, SOCCER_PROVIDER_IDS, SPORTS, eraRange, hasHistory, leagueChanges } from "./dist/index.js";
import { EMBLEM_GROUPS } from "./emblems.js";
import { EMBLEMS, FAMILIES, GAMES, TEAMS, TEAMS_JA } from "./examples.js";
import { LINEUP_SPORTS, sampleLayers } from "./lineup-data.js";
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
export const PAGEANT_LINES = ["over", "under", "through"];
export const TRACKS = ["red", "blue", "terracotta", "green"];
export const INFIELDS = ["pitch", "grass", "none"];
export const RACE_MARKS = ["none", "all"];
/** A made-up lineup on the surface: none, discs or jerseys. */
export const LINEUPS = ["off", "disc", "jersey"];
/** The tabs of the code box. */
export const EMBEDS = ["module", "element", "iframe", "svg"];
/** The most points a reader can drop on the drawing. */
export const MAX_SHOTS = 60;

/** The points in an address (`shots=12.5,40~100,20`): numbers in feet from the surface's top left, as many as the page keeps. */
export function parseShots(text) {
  if (typeof text !== "string" || text === "") return [];
  const out = [];
  for (const pair of text.split("~")) {
    const m = /^(-?\d{1,4}(?:\.\d{1,2})?),(-?\d{1,4}(?:\.\d{1,2})?)$/.exec(pair);
    if (m !== null && out.length < MAX_SHOTS) out.push([Number(m[1]), Number(m[2])]);
  }
  return out;
}
/** The points as an address writes them. */
export const shotsParam = (shots) => shots.map(([x, y]) => `${x},${y}`).join("~");
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
    lineup: pick(params.get("lineup"), LINEUPS, "off"),
    place: params.get("drop") === "1",
    shots: parseShots(params.get("shots")),
    touched: new Set(),
    embed: pick(params.get("code"), EMBEDS, "module"),
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

/** The data layers the state asks for: a made-up lineup for each side, and, with Click to place on, the points a reader dropped. Neither is drawn in the 3D view or on a badge. */
export function layersFor(s) {
  if (s.view === "3d" || s.size === "badge") return [];
  const layers = s.lineup === "off" ? [] : sampleLayers(s.sport, s.lineup);
  if (s.place) layers.push({ kind: "points", name: "points", team: "home", data: s.shots.map(([x, y]) => ({ x, y, title: `${x}, ${y}` })) });
  return layers;
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
  if (s.crowd) {
    // The stands and the people: every surface that has spectators; the share of seats taken from the slider, and a card display behind a goal on request.
    const crowd = {};
    if (s.crowdDensity !== 85) crowd.density = s.crowdDensity / 100;
    if (s.crowdTifo) crowd.tifo = "home";
    o.crowd = Object.keys(crowd).length === 0 ? true : crowd;
  }
  const layers = layersFor(s);
  if (layers.length > 0) o.layers = layers;
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
  lineup: (v) => say(`lineup_${v}`),
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
  { id: "lineup", kind: "lineup", values: LINEUPS, get: (s) => s.lineup },
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
  { id: "place", get: (s) => s.place },
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
    "lineup-group": !LINEUP_SPORTS.includes(s.sport) || s.view === "3d" || s.size === "badge",
    "place-group": s.view === "3d" || s.size === "badge",
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

// ----- The address: every control is in it, and what it names is restored from it.

/** The team fields of the address: the key's letter (`a` for the away team, `h` for the home) and the state's field. */
const TEAM_PARAMS = [["name", "name"], ["abbr", "abbr"], ["score", "score"], ["color", "color"], ["pens", "pens"], ["url", "url"]];
const ROLE_LETTER = { away: "a", home: "h" };
const text = (value, max) => (typeof value === "string" ? value.slice(0, max) : "");

/** The game as the address names it, laid over the made-up game that `loadGame` put in the state (the address names only what differs from it). Call it right after `loadGame`. */
export function applyParams(s, params) {
  for (const role of ["away", "home"]) {
    const letter = ROLE_LETTER[role];
    for (const [field, key] of TEAM_PARAMS) {
      const value = params.get(`${letter}${field}`);
      if (value === null) continue;
      if (field === "color" && !/^#[0-9a-f]{3,8}$/i.test(value)) continue;
      s[role][key] = text(value, field === "url" ? 300 : field === "name" ? 40 : 20);
      s.touched.add(`${role}.${key}`);
    }
    s[role].logo = pick(params.get(`${letter}logo`), ["none", "emblem", "ready", "url"], s[role].logo);
    s[role].mark = pick(params.get(`${letter}mark`), MARK_IDS, s[role].mark);
  }
  s.status = pick(params.get("status"), STATUSES, s.status);
  if (params.get("statustext") !== null) s.statusText = text(params.get("statustext"), 30);
  s.winner = pick(params.get("winner"), WINNERS, "auto");
  s.detail = pick(params.get("detail"), ["full", "simple"], "full");
  for (const [key, param] of [["competition", "competition"], ["date", "date"], ["label", "label"]]) if (params.get(param) !== null) s[key] = text(params.get(param), key === "label" ? 60 : key === "date" ? 24 : 50);
  s.stripes = params.get("stripes") !== "0";
  s.exact = params.get("exact") === "1";
  s.centreLogo = params.get("centrelogo") === "1";
  s.pageantEntrance = params.get("entrance") === "1";
}

/**
 * Every address parameter the page owns, with the value to write: `null` deletes it, because the state is at the control's start. A page reads these with `makeState` and `applyParams`,
 * so the address a reader copies reproduces the view. The first block is the parameters the page has always had, with the same names and values.
 */
export function urlPairs(s, lang) {
  const base = makeState(new URLSearchParams(""), null);
  base.sport = s.sport;
  loadGame(base, s.sport, lang);
  const out = [["sport", s.sport]];
  const put = (key, value, start) => out.push([key, value === start ? null : String(value)]);
  out.push(["year", s.year !== null && hasSeasons(s) ? String(s.year) : null]);
  out.push(["league", s.league !== null && !isOwnLeague(s.sport, s.league) ? s.league : null]);
  for (const [key, value, start] of [["pitch", s.pitch, "fifa"], ["ground", s.ground, "none"], ["pitchtype", s.pitchType, "none"], ["park", s.park, "generic"], ["sheet", s.sport === "curling" ? s.sheet : "sheet", "sheet"], ["size", s.size, "full"], ["orientation", s.orientation, "auto"], ["view", s.view, "flat"], ["viewpoint", s.view === "3d" ? s.viewpoint : "corner", "corner"], ["theme", s.theme, "auto"], ["pageant", s.pageant, "off"], ["pageantlines", s.pageantLines, "over"], ["poollook", s.poolLook, "flat"], ["pooldeck", s.poolDeck, "plain"], ["poolcourse", s.poolCourse, "long"], ["poollanes", s.poolLanes, "8"], ["poolrace", s.poolRace, "none"], ["poolsection", s.poolSection ? "1" : "0", "0"], ["track", s.track, "red"], ["infield", s.infield, "pitch"], ["races", s.races, "none"]]) put(key, value, start);
  out.push(["emblem", s.pageant !== "off" && s.pageantEmblem ? "1" : null]);
  out.push(["emblemid", s.pageant !== "off" && s.pageantEmblem && s.pageantEmblemId !== "trophy:soccer-globe" ? s.pageantEmblemId : null]);
  out.push(["emblemline", s.emblemLine ? "1" : null]);
  // The looks of a surface, the stands, the lineup and the points.
  for (const [key, value, start] of [["court", s.court, "default"], ["pattern", s.pattern, "bands"], ["goals", s.goals, "box"], ["half", s.half, "none"], ["flags", s.flags ? "1" : "0", "1"], ["baseline", s.baseline ? "1" : "0", "0"], ["hardwood", s.hardwood ? "1" : "0", "0"], ["crowd", s.crowd ? "1" : "0", "0"], ["crowddensity", s.crowdDensity, 85], ["crowdtifo", s.crowdTifo ? "1" : "0", "0"], ["lineup", s.lineup, "off"], ["drop", s.place ? "1" : "0", "0"], ["code", s.embed, "module"]]) put(key, value, start);
  out.push(["shots", s.place && s.shots.length > 0 ? shotsParam(s.shots) : null]);
  // The game: only what differs from the made-up one.
  for (const role of ["away", "home"]) {
    const letter = ROLE_LETTER[role];
    for (const [field, key] of TEAM_PARAMS) out.push([`${letter}${field}`, (s[role][key] ?? "") === (base[role][key] ?? "") ? null : String(s[role][key])]);
    put(`${letter}logo`, s[role].logo, base[role].logo);
    put(`${letter}mark`, s[role].mark, base[role].mark);
  }
  for (const [key, value, start] of [["status", s.status, base.status], ["statustext", s.statusText, base.statusText], ["winner", s.winner, "auto"], ["detail", s.detail, "full"], ["competition", s.competition, base.competition], ["date", s.date, base.date], ["label", s.label, base.label], ["stripes", s.stripes ? "1" : "0", "1"], ["exact", s.exact ? "1" : "0", "0"], ["centrelogo", s.centreLogo ? "1" : "0", "0"], ["entrance", s.pageantEntrance ? "1" : "0", "0"]]) put(key, value, start);
  // The made-up game's own names are in the page's language, so a name the reader did not type is never in the address; a field the reader emptied is `key=`.
  return out;
}
