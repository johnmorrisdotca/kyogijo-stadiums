// What the demo's playground is, apart from the page: the state a web address asks for, the options that state draws, the
// choices every control offers, and which rows are shown. The page's script (demo.js) runs it in the browser; the build
// (scripts/site.mjs) runs the same code to write the first view into the HTML, so what the script finds is what it would draw.
import { COURT_THEMES, ERA_SPORTS, GROUNDS, LEAGUES, PARKS, SOCCER_PITCH_IDS, SOCCER_PROVIDER_IDS, SPORTS, eraRange, hasHistory, leagueChanges } from "./dist/index.js";
import { EMBLEMS, FAMILIES, GAMES, TEAMS, TEAMS_JA } from "./examples.js";

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
export const COURTS = ["default", "maple", "twoTone", "night", "sunburst", "tournament"];

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
    away: {},
    home: {},
    status: "final",
    statusText: "",
    competition: "",
    date: "",
    label: "",
    winner: "auto",
    detail: "full",
    stripes: true,
    exact: false,
    court: pick(params.get("court"), COURTS, "default"),
    pitch: pick(params.get("pitch"), SOCCER_PITCH_IDS, "fifa"),
    ground: params.get("ground") && GROUNDS[params.get("ground")] ? params.get("ground") : "none",
    pitchType: pick(params.get("pitchtype"), SOCCER_PROVIDER_IDS, "none"),
    pattern: pick(params.get("pattern"), PATTERNS, "bands"),
    goals: pick(params.get("goals"), GOALS, "box"),
    half: pick(params.get("half"), HALVES, "none"),
    sheet: pick(params.get("sheet"), SHEETS, "sheet"),
    flags: params.get("flags") !== "0",
    baseline: params.get("baseline") === "1",
    centreLogo: false,
    hardwood: params.get("hardwood") === "1",
    touched: new Set(),
    embed: "module",
  };
}

/** The made-up game for a sport, laid into the state (names in the page's language until a name is typed). */
export function loadGame(state, sport, lang) {
  const family = FAMILIES[sport];
  const game = GAMES[sport];
  for (const role of ["away", "home"]) {
    const base = TEAMS[family][role];
    state[role] = { name: lang === "ja" ? TEAMS_JA[family][role] : base.name, abbr: base.abbr, score: String(game[role]), color: base.color, logo: "emblem", emblem: base.emblem, url: "" };
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
  const names = [s.away.name, s.home.name];
  if (s.sport === "nba" && (s.court !== "default" || s.baseline || s.centreLogo || s.hardwood)) {
    const court = s.court === "default" ? {} : { ...COURT_THEMES[s.court] };
    if (s.hardwood) court.hardwood = true;
    if (s.baseline) court.baselineText = names.map((n) => n.toUpperCase().slice(0, 18));
    if (s.centreLogo) court.centreLogo = forCode ? "/logos/centre.svg" : EMBLEMS[s.home.emblem];
    o.court = court;
  }
  if (s.size !== "surface") {
    const team = (t, placeholder) => {
      const out = { name: t.name, abbr: t.abbr, score: /^-?\d+$/.test(t.score) ? Number(t.score) : t.score, color: t.color };
      if (s.sport === "soccer" && /^\d+$/.test(t.pens ?? "")) out.penalties = Number(t.pens);
      if (s.sport === "curling") Object.assign(out, curlingExtras(t === s.away ? "away" : "home", out.score));
      if (GAMES[s.sport].awaySets !== undefined) Object.assign(out, netExtras(s.sport, t === s.away ? "away" : "home", out.score));
      Object.assign(out, fieldExtras(s.sport, t === s.away ? "away" : "home", out.score));
      if (t.logo === "emblem") out.logo = forCode ? placeholder : EMBLEMS[t.emblem];
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
  }
  return o;
}

/** The words on a segmented choice's buttons: `say(key)` gives the page's word for a key. */
export const labelOf = (say, s) => ({
  sport: (v) => say(`sport_${v}`),
  size: (v) => say(`size_${v}`),
  orientation: (v) => say(`orientation_${v}`),
  theme: (v) => say(`theme_${v}`),
  status: (v) => say(`status_${v.replace(/-/g, "_")}`),
  winner: (v) => (v === "away" && s.sport === "mlb" ? say("awayBaseball") : say(`winner_${v}`)),
  detail: (v) => say(`detail_${v}`),
  court: (v) => say(`court_${v}`),
  pattern: (v) => say(`pattern_${v}`),
  goals: (v) => say(`goals_${v}`),
  half: (v) => say(`half_${v}`),
  sheet: (v) => say(`sheet_${v}`),
  logo: (v) => say(`logo_${v}`),
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
  { id: "theme", kind: "theme", values: THEMES, get: (s) => s.theme },
  { id: "status", kind: "status", values: STATUSES, get: (s) => s.status },
  { id: "winner", kind: "winner", values: WINNERS, get: (s) => s.winner },
  { id: "detail", kind: "detail", values: ["full", "simple"], get: (s) => s.detail },
  { id: "court", kind: "court", values: COURTS, get: (s) => s.court },
  { id: "pattern", kind: "pattern", values: PATTERNS, get: (s) => s.pattern },
  { id: "goals", kind: "goals", values: GOALS, get: (s) => s.goals },
  { id: "half", kind: "half", values: HALVES, get: (s) => s.half },
  { id: "sheet", kind: "sheet", values: SHEETS, get: (s) => s.sheet },
  { id: "away-logo", kind: "logo", values: ["none", "emblem", "url"], get: (s) => s.away.logo },
  { id: "home-logo", kind: "logo", values: ["none", "emblem", "url"], get: (s) => s.home.logo },
];

/** The on/off chips and the state they show. */
export const TOGGLES = [
  { id: "stripes", get: (s) => s.stripes },
  { id: "exact", get: (s) => s.exact },
  { id: "baseline", get: (s) => s.baseline },
  { id: "centre-logo", get: (s) => s.centreLogo },
  { id: "hardwood", get: (s) => s.hardwood },
  { id: "flags", get: (s) => s.flags },
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
    "status-text": s.status !== "custom",
    "away-logo-url": s.away.logo !== "url",
    "home-logo-url": s.home.logo !== "url",
  };
}
