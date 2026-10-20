// What the demo's playground is, apart from the page: the state a web address asks for, the options that state draws, the
// choices every control offers, and which rows are shown. The page's script (demo.js) runs it in the browser; the build
// (scripts/site.mjs) runs the same code to write the first view into the HTML, so what the script finds is what it would draw.
import { ARENAS, COURT_THEMES, ERA_SPORTS, GROUNDS, LEAGUES, PARKS, SOCCER_PITCH_IDS, SOCCER_PROVIDER_IDS, SPORTS, eraRange, hasHistory, leagueChanges } from "./dist/index.js";
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
/** The budo: how the mats look (the sport's own, the traditional green and beige, a blue one or a black one), how many contest areas, and the size of a dojo in jo. */
export const BUDO_LOOKS = ["default", "traditional", "blue", "black"];
export const BUDO_AREAS = ["1", "2", "4"];
export const DOJO_SIZES = ["8", "12", "20", "50", "100", "200"];
/** The MMA cage's width across the flats in feet: the larger cage of 30 feet and the smaller of 25 (the rules allow 20 to 32). */
export const CAGE_SIZES = ["30", "25"];
/** The look of the package a choice means in a sport (judo, karate or a dojo), or nothing for the sport's own. */
const BUDO_LOOK_OF = { traditional: { judo: "green-beige", karate: "green-beige", dojo: "green-beige" }, blue: { judo: "yellow-blue", karate: "blue-black", dojo: "yellow-blue", mma: "blue" }, black: { judo: "black-red", dojo: "black-red", mma: "black" } };
/** The sports of the budo family, the ones that have a contest area, a hall and a look. */
export const isBudo = (sport) => ["judo", "karate", "kendo", "sumo", "kyudo", "dojo", "mma"].includes(sport);
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
    // A background behind the stage, for the page only (one of the family's, named in the address; the page checks the name, which it reads from its menu): none by default.
    background: params.get("background") ?? "",
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
    budoLook: pick(params.get("budolook"), BUDO_LOOKS, "default"),
    budoAreas: pick(params.get("budoareas"), BUDO_AREAS, "1"),
    cageSize: pick(params.get("cagesize"), CAGE_SIZES, "30"),
    dojoJo: /^\d{1,3}$/.test(params.get("dojojo") || "") && Number(params.get("dojojo")) >= 2 ? params.get("dojojo") : "20",
    budoHall: params.get("budohall") === "1",
    budoOfficials: params.get("budoofficials") === "1",
    budoTassels: params.get("budotassels") === "1",
    budoShinzen: params.get("dojoshinzen") === "1",
    // What a place in the atlas draws that the choices do not say (a platform, a size, the seat of honour): kept while the sport stays.
    budoBase: null,
    pitch: pick(params.get("pitch"), SOCCER_PITCH_IDS, "fifa"),
    ground: params.get("ground") && GROUNDS[params.get("ground")] ? params.get("ground") : "none",
    // The arena whose rink or court an atlas place asked for (NHL and NBA only): `none` draws the league's.
    arena: params.get("arena") && ARENAS[params.get("arena")] ? params.get("arena") : "none",
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
    // The roof over the stands, in the 3D view.
    venueRoof: params.get("roof") === "1",
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
    lineup: pick(params.get("lineup"), LINEUPS, "off"),
    place: params.get("drop") === "1",
    shots: parseShots(params.get("shots")),
    touched: new Set(),
    embed: pick(params.get("code"), EMBEDS, "module"),
  };
}

/** Whether the options this state draws hold the id of a ready-made emblem, so that the code the page shows must plug Dougu Sports in. */
export const usesEmblems = (s) => (s.away.logo === "ready" || s.home.logo === "ready") && s.size !== "surface" || (s.pageant !== "off" && s.pageantEmblem && s.size !== "surface");

/** Whether the options this state draws hold a country's flag code, so that the code the page shows must plug Hata in. */
export const usesFlags = (s) => flagCodes(s).length > 0;

/** The codes of the flags the options of this state draw: the teams' (a race on a pool draws its swimmers instead of the teams) or the swimmers'. */
export function flagCodes(s) {
  if (s.sport === "swimming" && s.poolRace !== "none") return [...new Set((s.poolCourse === "short" ? shortRace("en") : poolRace("en")).swimmers.filter((one) => Number(s.poolLanes) === 10 || one.lane <= Number(s.poolLanes)).map((one) => one.country))];
  if (s.size === "surface" || isPool(s.sport)) return [];
  return [s.away, s.home].filter((t) => t.logo === "flag").map((t) => t.flag);
}

/** An emblem's id as a logo is given: with `/line` after it when the outline style is on. The code the page shows is this same string. */
export const emblemRef = (id, s) => (s.emblemLine ? `${id}/line` : id);

/** The made-up game for a sport, laid into the state (names in the page's language until a name is typed). */
export function loadGame(state, sport, lang) {
  const family = FAMILIES[sport];
  const game = GAMES[sport];
  for (const role of ["away", "home"]) {
    const base = TEAMS[family][role];
    state[role] = { name: lang === "ja" ? TEAMS_JA[family][role] : base.name, abbr: base.abbr, score: String(game[role]), color: base.color, logo: "flag", flag: base.flag, emblem: base.emblem, mark: state[role]?.mark ?? MARKS[role], url: "" };
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

/** A made-up race for the swimming playground: the lanes the pool has, each swimmer for a country whose flag is drawn from its code. */
function poolRaceFor(s, lang) {
  const lanes = Number(s.poolLanes);
  const base = s.poolCourse === "short" ? shortRace(lang) : poolRace(lang);
  const swimmers = base.swimmers.filter((one) => lanes === 10 || one.lane <= lanes);
  return { ...base, swimmers, ...(s.poolRace === "pace" ? { pace: true } : {}) };
}

/** The pool the state asks for, or nothing when it asks for none of it. */
function poolOptions(s, lang) {
  const pool = {};
  if (s.poolLook !== "flat") pool.look = s.poolLook;
  if (s.poolDeck !== "plain") pool.deck = s.poolDeck;
  if (s.sport === "swimming") {
    if (s.poolCourse === "short") pool.course = "short";
    if (s.poolLanes !== "8") pool.lanes = Number(s.poolLanes);
    if (s.poolSection) pool.section = true;
    if (s.poolRace !== "none") pool.race = poolRaceFor(s, lang);
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

/** The data layers the state asks for: a made-up lineup for each side, and, with Click to place on, the points a reader dropped. Neither is drawn in the 3D view or on a badge. */
export function layersFor(s) {
  if (s.view === "3d" || s.size === "badge") return [];
  const layers = s.lineup === "off" ? [] : sampleLayers(s.sport, s.lineup);
  if (s.place) layers.push({ kind: "points", name: "points", team: "home", data: s.shots.map(([x, y]) => ({ x, y, title: `${x}, ${y}` })) });
  return layers;
}

/** The state a place's surface in the atlas asks for, in the budo's choices; what no choice says is kept in `budoBase`. */
export function budoFromSurface(s, surface) {
  s.budoLook = "default";
  s.budoAreas = "1";
  s.cageSize = "30";
  s.dojoJo = "20";
  s.budoHall = false;
  s.budoOfficials = false;
  s.budoTassels = false;
  s.budoShinzen = false;
  s.budoBase = null;
  if (!isBudo(surface?.sport)) return;
  const { budo = {}, dojo = {} } = surface;
  const look = budo.look ?? dojo.look;
  for (const [choice, map] of Object.entries(BUDO_LOOK_OF)) if (look !== undefined && map[surface.sport] === look) s.budoLook = choice;
  if (budo.hall === "budokan") s.budoHall = true;
  const areas = typeof budo.areas === "number" ? String(budo.areas) : "1";
  if (BUDO_AREAS.includes(areas)) s.budoAreas = areas;
  if (budo.officials === true) s.budoOfficials = true;
  if (budo.tassels === true) s.budoTassels = true;
  if (dojo.shinzen === true) s.budoShinzen = true;
  if (typeof dojo.jo === "number") s.dojoJo = String(dojo.jo);
  const without = (o, keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
  const rest = without(budo, ["hall", "areas", "officials", "tassels", "look"]);
  const restDojo = without(dojo, ["jo", "shinzen", "look"]);
  s.budoBase = Object.keys(rest).length + Object.keys(restDojo).length === 0 ? null : { budo: rest, dojo: restDojo };
}

/** What the budo choices ask the package to draw: the `budo` options and, for a dojo, its `dojo`. */
function budoOptions(s, o) {
  const look = s.budoLook === "default" ? undefined : BUDO_LOOK_OF[s.budoLook]?.[s.sport];
  const base = s.budoBase ?? { budo: {}, dojo: {} };
  if (s.sport === "dojo") {
    const dojo = { jo: Number(s.dojoJo), ...base.dojo };
    if (look !== undefined) dojo.look = look;
    if (s.budoShinzen) dojo.shinzen = true;
    o.dojo = dojo;
    return;
  }
  const budo = { ...base.budo };
  if (look !== undefined) budo.look = look;
  if (s.sport === "judo" || s.sport === "karate") {
    if (s.budoAreas !== "1") budo.areas = Number(s.budoAreas);
    if (s.budoOfficials) budo.officials = true;
  }
  if (s.sport === "judo" || s.sport === "karate" || s.sport === "kendo") if (s.budoHall) budo.hall = "budokan";
  if (s.sport === "sumo" && s.budoTassels) budo.tassels = true;
  if (s.sport === "mma" && s.cageSize !== "30") budo.size = Number(s.cageSize) * 0.3048;
  if (Object.keys(budo).length > 0) o.budo = budo;
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
    if (s.arena !== "none" && (s.sport === "nhl" || s.sport === "nba")) o.arena = s.arena;
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
  const layers = layersFor(s);
  if (layers.length > 0) o.layers = layers;
  // Click to place asks the drawing where the pointer is (`clientPointToField`), which a drawing answers when it is made with `pointer: true`; the code on show does not need it.
  if (s.place && !forCode) o.pointer = true;
  if (isBudo(s.sport)) budoOptions(s, o);
  const pool = isPool(s.sport) ? poolOptions(s, lang) : undefined;
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
      else if (t.logo === "flag") out.flag = t.flag;
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
  budolook: (v) => say(`budoLook_${v}`),
  budoareas: (v) => v,
  cagesize: (v) => say(`cageSize_${v}`),
  dojojo: (v) => v,
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
  { id: "lineup", kind: "lineup", values: LINEUPS, get: (s) => s.lineup },
  { id: "budo-look", kind: "budolook", values: BUDO_LOOKS, get: (s) => s.budoLook },
  { id: "budo-areas", kind: "budoareas", values: BUDO_AREAS, get: (s) => s.budoAreas },
  { id: "cage-size", kind: "cagesize", values: CAGE_SIZES, get: (s) => s.cageSize },
  { id: "dojo-jo", kind: "dojojo", values: DOJO_SIZES, get: (s) => s.dojoJo },
  { id: "away-logo", kind: "logo", values: ["none", "flag", "emblem", "ready", "url"], get: (s) => s.away.logo },
  { id: "home-logo", kind: "logo", values: ["none", "flag", "emblem", "ready", "url"], get: (s) => s.home.logo },
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
  { id: "venue-roof", get: (s) => s.venueRoof },
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
  { id: "place", get: (s) => s.place },
  { id: "budo-hall", get: (s) => s.budoHall },
  { id: "budo-officials", get: (s) => s.budoOfficials },
  { id: "budo-tassels", get: (s) => s.budoTassels },
  { id: "dojo-shinzen", get: (s) => s.budoShinzen },
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
    "lineup-group": !LINEUP_SPORTS.includes(s.sport) || s.view === "3d" || s.size === "badge",
    "place-group": s.view === "3d" || s.size === "badge",
    "pageant-group": s.pageant === "off" || s.size === "surface",
    "pool-group": !isPool(s.sport),
    "swim-group": s.sport !== "swimming",
    "athletics-group": s.sport !== "athletics",
    "races-group": s.sport !== "athletics" && s.sport !== "skating",
    "budo-group": !isBudo(s.sport),
    "budo-look-row": !["judo", "karate", "dojo", "mma"].includes(s.sport),
    "cage-size-row": s.sport !== "mma",
    "budo-areas-row": s.sport !== "judo" && s.sport !== "karate",
    "budo-chips": s.sport === "kyudo" || s.sport === "mma",
    "budo-hall": !["judo", "karate", "kendo"].includes(s.sport),
    "budo-officials": s.sport !== "judo" && s.sport !== "karate",
    "budo-tassels": s.sport !== "sumo",
    "dojo-row": s.sport !== "dojo",
    "dojo-shinzen": s.sport !== "dojo",
    "status-text": s.status !== "custom",
    "away-mark-row": s.away.logo !== "ready",
    "home-mark-row": s.home.logo !== "ready",
    "pageant-emblem-row": s.pageant === "off" || s.size === "surface" || !s.pageantEmblem,
    // The roof is a setting of the 3D view, over the stands of a crowd.
    "venue-row": !(s.view === "3d" && s.crowd),
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
    s[role].logo = pick(params.get(`${letter}logo`), ["none", "flag", "emblem", "ready", "url"], s[role].logo);
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
  out.push(["background", s.background === "" ? null : s.background]);
  const put = (key, value, start) => out.push([key, value === start ? null : String(value)]);
  out.push(["year", s.year !== null && hasSeasons(s) ? String(s.year) : null]);
  out.push(["league", s.league !== null && !isOwnLeague(s.sport, s.league) ? s.league : null]);
  for (const [key, value, start] of [["pitch", s.pitch, "fifa"], ["ground", s.ground, "none"], ["arena", s.sport === "nhl" || s.sport === "nba" ? s.arena : "none", "none"], ["pitchtype", s.pitchType, "none"], ["park", s.park, "generic"], ["sheet", s.sport === "curling" ? s.sheet : "sheet", "sheet"], ["size", s.size, "full"], ["orientation", s.orientation, "auto"], ["view", s.view, "flat"], ["viewpoint", s.view === "3d" ? s.viewpoint : "corner", "corner"], ["theme", s.theme, "auto"], ["pageant", s.pageant, "off"], ["pageantlines", s.pageantLines, "over"], ["poollook", s.poolLook, "flat"], ["pooldeck", s.poolDeck, "plain"], ["poolcourse", s.poolCourse, "long"], ["poollanes", s.poolLanes, "8"], ["poolrace", s.poolRace, "none"], ["poolsection", s.poolSection ? "1" : "0", "0"], ["track", s.track, "red"], ["infield", s.infield, "pitch"], ["races", s.races, "none"]]) put(key, value, start);
  out.push(["emblem", s.pageant !== "off" && s.pageantEmblem ? "1" : null]);
  out.push(["emblemid", s.pageant !== "off" && s.pageantEmblem && s.pageantEmblemId !== "trophy:soccer-globe" ? s.pageantEmblemId : null]);
  out.push(["emblemline", s.emblemLine ? "1" : null]);
  // The situation: only what the sport on show uses is written.
  const sit = s.situation && SITUATION_SPORTS.includes(s.sport);
  const football = !(s.sport === "nhl" || s.sport === "mlb");
  out.push(["situation", sit ? "1" : null]);
  for (const [key, value, start, used] of [["sithockey", s.sitHockey, "pp", s.sport === "nhl"], ["sitbases", s.sitBases, "101", s.sport === "mlb"], ["sitouts", s.sitOuts, "2", s.sport === "mlb"], ["sitcount", s.sitCount, "3-2", s.sport === "mlb"], ["sitdown", s.sitDown, "3", football], ["sittogo", s.sitToGo, "7", football], ["sitballon", String(s.sitBallOn), "88", football]]) out.push([key, sit && used && value !== start ? value : null]);
  out.push(["sitdrive", sit && s.sitDrive && football ? "1" : null]);
  // The budo: how the mats look, the contest areas, the size of a dojo and the hall, officials, tassels and shrine of the sport on show.
  for (const [key, value, start] of [["budolook", s.budoLook, "default"], ["budoareas", s.budoAreas, "1"], ["cagesize", s.sport === "mma" ? s.cageSize : "30", "30"], ["dojojo", s.dojoJo, "20"], ["budohall", s.budoHall ? "1" : "0", "0"], ["budoofficials", s.budoOfficials ? "1" : "0", "0"], ["budotassels", s.budoTassels ? "1" : "0", "0"], ["dojoshinzen", s.budoShinzen ? "1" : "0", "0"]]) put(key, value, start);
  // The looks of a surface, the stands, the lineup and the points.
  for (const [key, value, start] of [["court", s.court, "default"], ["pattern", s.pattern, "bands"], ["goals", s.goals, "box"], ["half", s.half, "none"], ["flags", s.flags ? "1" : "0", "1"], ["baseline", s.baseline ? "1" : "0", "0"], ["hardwood", s.hardwood ? "1" : "0", "0"], ["crowd", s.crowd ? "1" : "0", "0"], ["crowddensity", s.crowdDensity, 85], ["crowdtifo", s.crowdTifo ? "1" : "0", "0"], ["roof", s.venueRoof ? "1" : "0", "0"], ["lineup", s.lineup, "off"], ["drop", s.place ? "1" : "0", "0"], ["code", s.embed, "module"]]) put(key, value, start);
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
