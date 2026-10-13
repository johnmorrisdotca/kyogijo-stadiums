// The demo page's own script: a surface to try (the package's own `mountKyogijo`), the code that draws it in four ways,
// and a page of examples: every sport, wide and tall, badges, compact cards, court looks, a live score, every ballpark,
// and the custom element. The words are in words.js, the made-up teams in examples.js.
import { COURT_THEMES, ERA_SPORTS, GROUNDS, GROUND_IDS, KYOGIJO_STYLE, LEAGUES, PARKS, PARK_IDS, SOCCER_PITCH_IDS, SOCCER_PROVIDERS, SOCCER_PROVIDER_IDS, SPORTS, VERSION, drawKyogijo, fenceFor, rescale, layerTable, eraRange, rulesFor, seasonLabel, hasHistory, leagueAt, leagueChanges, leagueSeason } from "./dist/index.js";
import { mountKyogijo } from "./dist/mount-entry.js";
import "./dist/element-define.js";
import { initAtlas } from "./atlas.js";
import { toParams } from "./embed-params.js";
import { EMBLEMS, FAMILIES, GAMES, TEAMS, TEAMS_JA } from "./examples.js";
import { nbaZones, passMap, shotHeat, shotMap, sprayChart, sprayDensity, touchZones } from "./layers-data.js";
import { mlbBalls, nbaShots, nflPasses, nhlShots, soccerShots } from "./charts-data.js";
import { replayPlay } from "./replay-data.js";
import { mlbSprayChart, nbaShotChart, nflPassChart, nhlShotMap, soccerShotMap } from "./dist/charts-entry.js";
import { fenceAt } from "./dist/geometry-entry.js";
import { WORDS } from "./words.js";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const CANON = "https://johnmorrisdotca.github.io/kyogijo/";
const CDN = "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo@0";

const language = familyLanguage({ id: "kyogijo", words: WORDS, onChange: () => onLanguage() });
const say = (key) => WORDS[language.lang][key];

// The stylesheet once for the whole page: every drawing here is made with style: "none".
const sheet = document.createElement("style");
sheet.id = "kyogijo-style";
sheet.textContent = KYOGIJO_STYLE;
document.head.append(sheet);

const keep = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* A browser that keeps nothing: the choice lasts the visit. */ }
  },
};

const pick = (value, list, fallback) => (list.includes(value) ? value : fallback);
const SIZES = ["full", "compact", "badge", "surface"];
const ORIENTATIONS = ["landscape", "portrait", "auto"];
const THEMES = ["auto", "light", "dark"];
const STATUSES = ["final", "final-ot", "final-so", "final-aet", "final-pens", "live", "half", "custom"];
const PATTERNS = ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal", "none"];
const GOALS = ["box", "line", "strip", "none"];
const HALVES = ["none", "left", "right"];
const WINNERS = ["auto", "leader", "none", "home", "away"];
const COURTS = ["default", "maple", "twoTone", "night", "sunburst", "tournament"];

const state = {
  sport: pick(params.get("sport"), SPORTS, "nhl"),
  // The league whose rulebook marks the surface: the sport's own (its first) unless the address names another.
  league: params.get("league") || null,
  park: params.get("park") && (PARKS[params.get("park")] || params.get("park") === "generic") ? params.get("park") : "generic",
  // The season to draw the surface in, or null for today's (a year in the address turns it on).
  year: /^\d{4}$/.test(params.get("year") || "") ? Number(params.get("year")) : null,
  size: pick(params.get("size"), SIZES, "full"),
  orientation: pick(params.get("orientation"), ORIENTATIONS, "auto"),
  theme: pick(params.get("theme") ?? keep.get("kyogijo.theme"), THEMES, "auto"),
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
  flags: params.get("flags") !== "0",
  baseline: params.get("baseline") === "1",
  centreLogo: false,
  touched: new Set(),
  embed: "module",
};

/** The made-up game for a sport, laid into the state (names in the page's language until a name is typed). */
function loadGame(sport) {
  const family = FAMILIES[sport];
  const game = GAMES[sport];
  for (const role of ["away", "home"]) {
    const base = TEAMS[family][role];
    state[role] = { name: language.lang === "ja" ? TEAMS_JA[family][role] : base.name, abbr: base.abbr, score: String(game[role]), color: base.color, logo: "emblem", emblem: base.emblem, url: "" };
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
loadGame(state.sport);

/** A curling team's score in each end and the hammer, while the total is still the made-up game's: an edited score has no ends to show. */
function curlingExtras(role, score) {
  const game = GAMES.curling;
  const ends = role === "away" ? game.awayEnds : game.homeEnds;
  const total = ends.reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);
  return score === total ? { ends, ...(game.hammer === role ? { hammer: true } : {}) } : {};
}

/** What the state asks the package to draw. */
function optionsFor(s, forCode = false) {
  const o = { sport: s.sport, orientation: s.orientation, language: language.lang };
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
  const names = [s.away.name, s.home.name];
  if (s.sport === "nba" && (s.court !== "default" || s.baseline || s.centreLogo)) {
    const court = s.court === "default" ? {} : { ...COURT_THEMES[s.court] };
    if (s.baseline) court.baselineText = names.map((n) => n.toUpperCase().slice(0, 18));
    if (s.centreLogo) court.centreLogo = forCode ? "/logos/centre.svg" : EMBLEMS[s.home.emblem];
    o.court = court;
  }
  if (s.size !== "surface") {
    const team = (t, placeholder) => {
      const out = { name: t.name, abbr: t.abbr, score: /^-?\d+$/.test(t.score) ? Number(t.score) : t.score, color: t.color };
      if (s.sport === "soccer" && /^\d+$/.test(t.pens ?? "")) out.penalties = Number(t.pens);
      if (s.sport === "curling") Object.assign(out, curlingExtras(t === s.away ? "away" : "home", out.score));
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

// ----- The controls.
const labelOf = {
  sport: (v) => say(`sport_${v}`),
  size: (v) => say(`size_${v}`),
  orientation: (v) => say(`orientation_${v}`),
  theme: (v) => say(`theme_${v}`),
  status: (v) => say(`status_${v.replace(/-/g, "_")}`),
  winner: (v) => (v === "away" && state.sport === "mlb" ? say("awayBaseball") : say(`winner_${v}`)),
  detail: (v) => say(`detail_${v}`),
  court: (v) => say(`court_${v}`),
  pattern: (v) => say(`pattern_${v}`),
  goals: (v) => say(`goals_${v}`),
  half: (v) => say(`half_${v}`),
  logo: (v) => say(`logo_${v}`),
  era: (v) => say(`era_${v}`),
};

const segs = {};
/** Fill a segmented choice with buttons; `get` says which is on and `set` what a press does. */
function makeSeg(id, kind, values, get, set) {
  const host = $(id);
  segs[id] = { host, kind, values, get };
  host.replaceChildren();
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = value;
    button.addEventListener("click", () => { set(value); refreshSegs(); change(); });
    host.append(button);
  }
}
/** Statuses that belong to one sport: after extra time and on penalties are soccer's, the overtime and the shoot-out the others'. */
const hiddenStatus = (value) => (state.sport === "soccer" ? value === "final-ot" || value === "final-so" : value === "final-aet" || value === "final-pens");
function refreshSegs() {
  for (const seg of Object.values(segs)) {
    for (const button of seg.host.children) {
      button.hidden = seg.kind === "status" && hiddenStatus(button.dataset.value);
      button.textContent = labelOf[seg.kind](button.dataset.value);
      button.setAttribute("aria-pressed", String(seg.get() === button.dataset.value));
    }
  }
  // Baseball says ビジター for the away team in Japanese; the other sports say アウェイ.
  document.querySelector('.team[data-role="away"] h3').textContent = say(state.sport === "mlb" ? "awayBaseball" : "away");
  for (const role of ["away", "home"]) $(`${role}-logo-url`).hidden = state[role].logo !== "url";
  $("status-text").hidden = state.status !== "custom";
}

makeSeg("sport", "sport", SPORTS, () => state.sport, (v) => { state.sport = v; state.league = null; loadGame(v); fillFields(); fillLeagues(); });
makeSeg("era", "era", ["today", "past"], () => (state.year === null ? "today" : "past"), (v) => { state.year = v === "today" ? null : (state.year ?? clampYear(1975)); });
makeSeg("size", "size", SIZES, () => state.size, (v) => { state.size = v; });
makeSeg("orientation", "orientation", ORIENTATIONS, () => state.orientation, (v) => { state.orientation = v; });
makeSeg("theme", "theme", THEMES, () => state.theme, (v) => { state.theme = v; keep.set("kyogijo.theme", v); applyTheme(); });
makeSeg("status", "status", STATUSES, () => state.status, (v) => { state.status = v; });
makeSeg("winner", "winner", WINNERS, () => state.winner, (v) => { state.winner = v; });
makeSeg("detail", "detail", ["full", "simple"], () => state.detail, (v) => { state.detail = v; });
makeSeg("court", "court", COURTS, () => state.court, (v) => { state.court = v; });
makeSeg("pattern", "pattern", PATTERNS, () => state.pattern, (v) => { state.pattern = v; });
makeSeg("goals", "goals", GOALS, () => state.goals, (v) => { state.goals = v; });
makeSeg("half", "half", HALVES, () => state.half, (v) => { state.half = v; });
for (const role of ["away", "home"]) makeSeg(`${role}-logo`, "logo", ["none", "emblem", "url"], () => state[role].logo, (v) => { state[role].logo = v; });

/** True when a league is the sport's own (the first of its list: the NBA for `nba`), which has the sport's history. */
const isOwnLeague = (sport, league) => LEAGUES[sport].length === 0 || league === LEAGUES[sport].find((l) => l.builtIn && (l.family !== "football" || l.id === sport))?.id;
/** The league chosen, when it is not the sport's own. */
const chosenLeague = (s) => (s.league === null || isOwnLeague(s.sport, s.league) ? undefined : LEAGUES[s.sport].find((l) => l.id === s.league));
/** True when the surface chosen has a history to slide through: the sport's own league's, or a league's cited one. */
const hasSeasons = (s) => (chosenLeague(s) === undefined ? ERA_SPORTS.includes(s.sport) : hasHistory(chosenLeague(s)));
/** The seasons the surface chosen has a history for. */
function seasonRange(s) {
  const league = chosenLeague(s);
  if (league === undefined) return eraRange(s.sport);
  const years = leagueChanges(s.sport, league.id).map((c) => c.from).filter((y) => y !== null);
  return { from: Math.min(...years) - 1, to: 2026 };
}
/** A season inside the range the surface's history covers. */
function clampYear(year) {
  if (!hasSeasons(state)) return year;
  const { from, to } = seasonRange(state);
  return Math.min(to, Math.max(from, year));
}
$("era-year").addEventListener("input", (event) => { state.year = Number(event.target.value); change(); });

/** The season control: shown for the sports that have a history, with the markings that differed from today's. */
function renderEra() {
  const has = hasSeasons(state);
  $("era-group").hidden = !has;
  if (!has) return;
  if (state.year !== null) state.year = clampYear(state.year);
  const past = state.year !== null;
  $("era-year-row").hidden = !past;
  const notes = $("era-notes");
  notes.hidden = !past;
  if (!past) return;
  const { from, to } = seasonRange(state);
  const slider = $("era-year");
  slider.min = String(from);
  slider.max = String(to);
  slider.value = String(state.year);
  const league = chosenLeague(state);
  $("era-season").textContent = league === undefined ? seasonLabel(state.sport, state.year) : leagueSeason(league.family, state.year);
  const found = league === undefined ? rulesFor(state.sport, state.year) : leagueAt(state.sport, league.id, state.year);
  const items = found.differences.map((change) => (language.lang === "ja" ? change.ja : change.what));
  if (found.planned) items.push(say("eraPlanned"));
  if (items.length === 0) items.push(say("eraNone"));
  notes.replaceChildren(...items.map((text) => Object.assign(document.createElement("li"), { textContent: text })));
  notes.setAttribute("aria-label", say("eraNotes"));
}

function toggle(id, key) {
  $(id).addEventListener("click", () => { state[key] = !state[key]; $(id).setAttribute("aria-pressed", String(state[key])); change(); });
}
toggle("stripes", "stripes");
toggle("exact", "exact");
toggle("baseline", "baseline");
toggle("centre-logo", "centreLogo");
toggle("flags", "flags");

function fillFields() {
  for (const role of ["away", "home"]) {
    $(`${role}-name`).value = state[role].name;
    $(`${role}-abbr`).value = state[role].abbr;
    $(`${role}-score`).value = state[role].score;
    $(`${role}-color`).value = state[role].color;
    $(`${role}-logo-url`).value = state[role].url;
    $(`${role}-pens`).value = state[role].pens ?? "";
  }
  $("status-text").value = state.statusText;
  $("competition").value = state.competition;
  $("date").value = state.date;
  $("label").value = state.label;
}
for (const role of ["away", "home"]) {
  for (const [field, key] of [["name", "name"], ["abbr", "abbr"], ["score", "score"], ["color", "color"], ["logo-url", "url"], ["pens", "pens"]]) {
    $(`${role}-${field}`).addEventListener("input", (event) => { state[role][key] = event.target.value; state.touched.add(`${role}.${key}`); change(); });
  }
}
for (const [id, key] of [["status-text", "statusText"], ["competition", "competition"], ["date", "date"], ["label", "label"]]) $(id).addEventListener("input", (event) => { state[key] = event.target.value; change(); });
for (const role of ["away", "home"]) $(`${role}-pens-row`).hidden = true;
$("swap").addEventListener("click", () => {
  [state.away, state.home] = [state.home, state.away];
  fillFields();
  change();
});

// The league picker: the sport's own league first, then every variant, in the page's language.
function fillLeagues() {
  const select = $("league");
  select.replaceChildren();
  for (const league of LEAGUES[state.sport]) select.append(opt(league.id, league.name[language.lang]));
  const own = LEAGUES[state.sport].find((l) => l.builtIn && (l.family !== "football" || l.id === state.sport));
  if (state.league !== null && !LEAGUES[state.sport].some((l) => l.id === state.league)) state.league = null;
  select.value = state.league ?? own?.id ?? "";
}
$("league").addEventListener("change", (event) => { state.league = event.target.value; clampYearNow(); change(); });
function clampYearNow() { if (state.year !== null) state.year = hasSeasons(state) ? clampYear(state.year) : null; }

// The ballpark picker: every park by league, in the page's language.
function fillParks() {
  const select = $("park");
  select.replaceChildren();
  const add = (parent, value, text) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    parent.append(option);
  };
  add(select, "generic", say("parkGeneric"));
  const name = (p) => (language.lang === "ja" && p.nameJa ? p.nameJa : p.name);
  const groups = [
    ["parkGroupMlb", (p) => p.league === "MLB" && p.status === "current"],
    ["parkGroupMlbPast", (p) => p.league === "MLB" && p.status === "past"],
    ["parkGroupNpb", (p) => p.league === "NPB" && p.status === "current"],
    ["parkGroupOther", (p) => p.league === "NPB" && p.status !== "current"],
  ];
  for (const [group, keep_] of groups) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = say(group);
    for (const id of PARK_IDS) if (keep_(PARKS[id])) add(optgroup, id, name(PARKS[id]));
    select.append(optgroup);
  }
  select.value = state.park;
}
$("park").addEventListener("change", (event) => { state.park = event.target.value; change(); });

/** An option of a select. */
function opt(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

// The pitch pickers: the presets, and the data providers' frames.
function fillPitches() {
  const pitch = $("pitch");
  pitch.replaceChildren();
  for (const id of SOCCER_PITCH_IDS) pitch.append(opt(id, say(`pitch_${id.replace(/-/g, "_")}`)));
  pitch.value = state.pitch;
  const type = $("pitch-type");
  type.replaceChildren();
  type.append(opt("none", say("pitchTypeNone")));
  for (const id of SOCCER_PROVIDER_IDS) type.append(opt(id, SOCCER_PROVIDERS[id].name));
  type.value = state.pitchType;
}
$("pitch").addEventListener("change", (event) => { state.pitch = event.target.value; change(); });

// The ground picker: the grounds in three groups, in the page's language. A ground sets the pitch's size unless a preset other than the international one is chosen.
function fillGrounds() {
  const select = $("ground");
  select.replaceChildren(opt("none", say("groundNone")));
  const name = (g) => (language.lang === "ja" ? g.nameJa : g.name);
  const finals = (g) => g.tournaments.some((t) => t.final);
  const in2026 = (g) => g.tournaments.some((t) => t.competition === "world-cup" && t.year === 2026);
  const groups = [
    ["groundGroupFinals", finals],
    ["groundGroup2026", (g) => !finals(g) && in2026(g)],
    ["groundGroupClubs", (g) => !finals(g) && !in2026(g)],
  ];
  for (const [label, keep_] of groups) {
    const group = document.createElement("optgroup");
    group.label = say(label);
    for (const id of GROUND_IDS) if (keep_(GROUNDS[id])) group.append(opt(id, name(GROUNDS[id])));
    select.append(group);
  }
  select.value = state.ground;
}
$("ground").addEventListener("change", (event) => { state.ground = event.target.value; change(); });
$("pitch-type").addEventListener("change", (event) => { state.pitchType = event.target.value; change(); });

function applyTheme() {
  if (state.theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", state.theme);
}

// ----- The stage.
const stage = $("stage");
let mount;
function render() {
  const o = optionsFor(state);
  o.style = "none";
  if (mount === undefined) mount = mountKyogijo(stage, o);
  else mount.update(o);
  const svg = stage.querySelector("svg");
  const box = svg.viewBox.baseVal;
  stage.style.setProperty("--r", String(box.width / box.height));
  stage.dataset.orientation = mount.orientation();
  stage.dataset.sport = state.sport;
  stage.dataset.size = state.size;
  stage.dataset.ready = "true";
  $("park-row").hidden = state.sport !== "mlb";
  $("league-row").hidden = LEAGUES[state.sport].length < 2;
  const soccer = state.sport === "soccer";
  $("pitch-row").hidden = !soccer;
  $("ground-row").hidden = !soccer;
  $("pitch-type-row").hidden = !soccer;
  $("soccer-group").hidden = !soccer;
  for (const role of ["away", "home"]) $(`${role}-pens-row`).hidden = !soccer;
  $("flags").setAttribute("aria-pressed", String(state.flags));
  renderEra();
  $("court-group").hidden = state.sport !== "nba";
  $("stripes").setAttribute("aria-pressed", String(state.stripes));
  $("exact").setAttribute("aria-pressed", String(state.exact));
  $("baseline").setAttribute("aria-pressed", String(state.baseline));
  $("centre-logo").setAttribute("aria-pressed", String(state.centreLogo));
  updateEmbed();
  syncUrl();
}

function syncUrl() {
  const q = new URLSearchParams(location.search);
  q.set("sport", state.sport);
  if (state.year !== null && hasSeasons(state)) q.set("year", String(state.year));
  else q.delete("year");
  if (state.league !== null && !isOwnLeague(state.sport, state.league)) q.set("league", state.league);
  else q.delete("league");
  for (const [key, value, base] of [["pitch", state.pitch, "fifa"], ["ground", state.ground, "none"], ["pitchtype", state.pitchType, "none"], ["park", state.park, "generic"], ["size", state.size, "full"], ["orientation", state.orientation, "auto"], ["theme", state.theme, "auto"]]) {
    if (value === base) q.delete(key);
    else q.set(key, value);
  }
  history.replaceState(history.state, "", `${location.pathname}?${q.toString()}${location.hash}`);
}

function change() {
  render();
}

// ----- The code.
const TABS = ["module", "element", "iframe", "svg"];
const escapeAttr = (text) => String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const tidy = (value) => JSON.stringify(value, null, 2);

function code(kind) {
  const o = optionsFor(state, true);
  if (kind === "module") {
    return `import { drawKyogijo } from "${CDN}/+esm";\n// or, from npm: import { drawKyogijo } from "@johnmorrisdotca/kyogijo";\n\ndocument.querySelector("#game").innerHTML = drawKyogijo(${tidy(o)});`;
  }
  if (kind === "element") {
    const attrs = [`sport="${o.sport}"`];
    if (o.league) attrs.push(`league="${o.league}"`);
    if (o.park) attrs.push(`park="${o.park}"`);
    if (o.size && o.size !== "full") attrs.push(`size="${o.size}"`);
    attrs.push(`orientation="${o.orientation}"`);
    if (o.language !== "en") attrs.push(`language="${o.language}"`);
    if (o.detail) attrs.push(`detail="${o.detail}"`);
    for (const [key, attr] of [["pitch", "pitch"], ["ground", "ground"], ["pitchType", "pitch-type"], ["half", "half"], ["goals", "goals"], ["stripePattern", "stripe-pattern"]]) if (o[key]) attrs.push(`${attr}="${o[key]}"`);
    if (o.cornerFlags === false) attrs.push('corner-flags="false"');
    if (o.away) {
      for (const [role, t] of [["away", o.away], ["home", o.home]]) {
        attrs.push(`${role}="${escapeAttr(t.name)}"`, `${role}-abbr="${escapeAttr(t.abbr)}"`, `${role}-score="${escapeAttr(t.score)}"`, `${role}-color="${t.color}"`);
        if (t.logo) attrs.push(`${role}-logo="${escapeAttr(t.logo)}"`);
        if (t.penalties !== undefined) attrs.push(`${role}-penalties="${t.penalties}"`);
      }
      for (const [key, attr] of [["status", "status"], ["competition", "competition"], ["date", "date"], ["label", "label"], ["winner", "winner"]]) if (o[key]) attrs.push(`${attr}="${escapeAttr(o[key])}"`);
    }
    if (o.court) attrs.push(`options='${JSON.stringify({ court: o.court }).replace(/'/g, "&#39;")}'`);
    return `<script type="module" src="${CDN}/dist/element-define.js"></script>\n\n<kyogijo-field\n  ${attrs.join("\n  ")}\n></kyogijo-field>`;
  }
  if (kind === "iframe") {
    const box = stage.querySelector("svg").viewBox.baseVal;
    const src = `${CANON}embed.html?${toParams({ ...o, orientation: state.orientation === "auto" ? "auto" : state.orientation }).toString()}`;
    const ratio = `${Math.round(box.width)} / ${Math.round(box.height)}`;
    return `<iframe\n  src="${escapeAttr(src)}"\n  title="${escapeAttr(stage.querySelector("title").textContent)}"\n  loading="lazy"\n  style="width:100%;aspect-ratio:${ratio};border:0"\n></iframe>`;
  }
  const withStyle = { ...optionsFor(state) };
  return drawKyogijo(withStyle);
}

function updateEmbed() {
  const tabs = $("embed-tabs");
  if (tabs.children.length === 0) {
    for (const tab of TABS) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.dataset.tab = tab;
      button.addEventListener("click", () => { state.embed = tab; updateEmbed(); });
      tabs.append(button);
    }
  }
  for (const button of tabs.children) {
    button.textContent = say(`embed_${button.dataset.tab}`);
    button.setAttribute("aria-selected", String(button.dataset.tab === state.embed));
  }
  $("embed-note").textContent = say(`embed${state.embed[0].toUpperCase()}${state.embed.slice(1)}Note`);
  const text = code(state.embed);
  const element = $("embed-code");
  element.textContent = text;
  element.parentElement.dataset.kind = state.embed;
  $("embed-download").hidden = state.embed !== "svg";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}
$("embed-copy").addEventListener("click", async () => {
  await copyText($("embed-code").textContent);
  $("embed-status").textContent = say("copiedLine");
  setTimeout(() => { $("embed-status").textContent = ""; }, 2400);
});
$("embed-download").addEventListener("click", () => {
  const blob = new Blob([code("svg")], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `kyogijo-${state.sport}.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

// ----- The examples.
const team = (sport, role, score) => {
  const base = TEAMS[FAMILIES[sport]][role];
  return { name: language.lang === "ja" ? TEAMS_JA[FAMILIES[sport]][role] : base.name, abbr: base.abbr, color: base.color, logo: EMBLEMS[base.emblem], score, ...(sport === "curling" ? curlingExtras(role, score) : {}) };
};
const withPens = (t, pens) => (pens === undefined ? t : { ...t, penalties: pens });
const gameOf = (sport, extra = {}) => ({ sport, away: withPens(team(sport, "away", GAMES[sport].away), GAMES[sport].awayPens), home: withPens(team(sport, "home", GAMES[sport].home), GAMES[sport].homePens), status: GAMES[sport].status, competition: GAMES[sport].competition, date: GAMES[sport].date, language: language.lang, style: "none", ...extra });

const mounts = [];
function figure(host, options, caption) {
  const fig = document.createElement("figure");
  fig.className = "card";
  const box = document.createElement("div");
  box.className = "card-stage";
  const text = document.createElement("figcaption");
  text.textContent = caption;
  fig.append(box, text);
  host.append(fig);
  mounts.push({ box, options, make: () => mountKyogijo(box, options), caption: text });
  return fig;
}

const examples = {
  gallery: () => SPORTS.map((sport) => [gameOf(sport, { orientation: "auto", ...(sport === "mlb" ? { park: "fenway-park" } : {}) }), say(`sport_${sport}`)]),
  sides: () => [
    [gameOf("nhl", { orientation: "landscape" }), `${say("sport_nhl")} · ${say("orientation_landscape")}`],
    [gameOf("nhl", { orientation: "portrait" }), `${say("sport_nhl")} · ${say("orientation_portrait")}`],
    [gameOf("nfl", { orientation: "landscape" }), `${say("sport_nfl")} · ${say("orientation_landscape")}`],
    [gameOf("nfl", { orientation: "portrait" }), `${say("sport_nfl")} · ${say("orientation_portrait")}`],
  ],
  compact: () => ["nba", "nfl", "nhl"].map((sport) => [gameOf(sport, { size: "compact", orientation: "auto" }), say(`sport_${sport}`)]),
  pitches: () => {
    const named = (id, extra = {}) => [gameOf("soccer", { orientation: "auto", pitch: id, ...extra }), say(`pitch_${id.replace(/-/g, "_")}`)];
    return [
      named("fifa"),
      named("ncaa"),
      named("7-a-side"),
      named("futsal"),
      ...["anfield", "maracana"].map((id) => {
        const g = GROUNDS[id];
        return [gameOf("soccer", { orientation: "auto", ground: id }), `${language.lang === "ja" ? g.nameJa : g.name} · ${g.pitch.length} × ${g.pitch.width} m`];
      }),
      [gameOf("soccer", { orientation: "auto", size: "compact", status: "final-aet", away: team("soccer", "away", 1), home: team("soccer", "home", 2) }), say("pitchCompact")],
      [{ sport: "soccer", language: language.lang, style: "none", orientation: "auto", half: "left", stripePattern: "checks", goals: "strip", title: say("pitchHalf") }, say("pitchHalf")],
    ];
  },
  patterns: () => ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal"].map((pattern) => [{ sport: "soccer", language: language.lang, style: "none", orientation: "auto", stripePattern: pattern, goals: pattern === "checks" ? "line" : pattern === "diagonal" ? "strip" : "box", title: say(`pattern_${pattern}`) }, say(`pattern_${pattern}`)]),
  courts: () =>
    ["maple", "twoTone", "night", "sunburst", "tournament"].map((theme) => {
      const names = TEAMS.basketball;
      return [gameOf("nba", { orientation: "auto", court: { ...COURT_THEMES[theme], baselineText: [names.away.name.toUpperCase(), names.home.name.toUpperCase()] } }), say(`court_${theme}`)];
    }),
};

// The Data section: made-up shots, passes and balls in play (layers-data.js, from fixed seeds) on a bare surface each, with the
// table that stands for each drawing under it.
const DATA = [
  ["shots", () => ({ sport: "nhl", layers: shotMap() })],
  ["passes", () => ({ sport: "nfl", layers: passMap() })],
  ["spray", () => ({ sport: "mlb", layers: sprayChart() })],
  ["heat", () => ({ sport: "nhl", layers: shotHeat() })],
  ["zones", () => ({ sport: "nba", layers: nbaZones() })],
  ["positional", () => ({ sport: "soccer", layers: touchZones() })],
  ["density", () => ({ sport: "mlb", layers: sprayDensity() })],
];
function buildData() {
  const host = $("data-cards");
  host.replaceChildren();
  for (const [key, make] of DATA) {
    const options = { ...make(), orientation: "auto", language: language.lang, style: "none" };
    const fig = figure(host, options, say(`data_${key}`));
    const details = document.createElement("details");
    details.className = "data-table";
    details.dataset.testid = `data-table-${key}`;
    const summary = document.createElement("summary");
    summary.textContent = say("dataTable");
    const holder = document.createElement("div");
    holder.className = "data-table-body";
    holder.innerHTML = layerTable(options.layers, { language: language.lang, maxRows: 60, surface: options });
    details.append(summary, holder);
    fig.append(details);
  }
}

// The Charts section: a ready-made chart for each sport, from the made-up data of charts-data.js. A chart is drawn wide (its key runs along the top
// edge), with the table that stands for it under it.
const CHART_PARK = { park: "polo-grounds", year: 1915 };
function charts() {
  const lang = language.lang;
  const fence = fenceFor(PARKS[CHART_PARK.park], undefined, CHART_PARK.year);
  const soccer = soccerShotMap(soccerShots(), { provider: "statsbomb", half: true, goalUnit: "yd", language: lang });
  return [
    ["nba", nbaShotChart(nbaShots(260), { league: 46, language: lang })],
    ["nhl", nhlShotMap(nhlShots(), { fold: true, zones: true, statistic: "goals", language: lang })],
    ["mlb", mlbSprayChart(mlbBalls((angle) => fenceAt(fence, angle)), { ...CHART_PARK, bats: "R", zones: true, language: lang })],
    ["nfl", nflPassChart(nflPasses(), { los: 62, language: lang })],
    ["soccer", soccer],
    ["goal", soccer.goalMouth({ style: "none" })],
  ];
}
function buildCharts() {
  const host = $("chart-cards");
  host.replaceChildren();
  for (const [key, chart] of charts()) {
    let fig;
    if (key === "goal") {
      // The goal-mouth view is a drawing of its own, not a surface: written into its card as it is.
      fig = document.createElement("figure");
      fig.className = "card";
      const box = document.createElement("div");
      box.className = "card-stage";
      box.innerHTML = chart.svg;
      const text = document.createElement("figcaption");
      text.textContent = say(`chart_${key}`);
      fig.append(box, text);
      host.append(fig);
    } else fig = figure(host, { ...chart.options, orientation: "landscape", language: language.lang, style: "none" }, say(`chart_${key}`));
    fig.dataset.chart = key;
    const details = document.createElement("details");
    details.className = "data-table";
    details.dataset.testid = `chart-table-${key}`;
    const summary = document.createElement("summary");
    summary.textContent = say("dataTable");
    const holder = document.createElement("div");
    holder.className = "data-table-body";
    holder.innerHTML = chart.table({ maxRows: 40 });
    details.append(summary, holder);
    fig.append(details);
  }
}

function buildExamples() {
  for (const m of mounts) m.handle?.destroy();
  mounts.length = 0;
  for (const [id, key] of [["gallery-cards", "gallery"], ["side-cards", "sides"], ["compact-cards", "compact"], ["court-cards", "courts"], ["pitch-cards", "pitches"], ["pattern-cards", "patterns"]]) {
    const host = $(id);
    host.replaceChildren();
    for (const [options, caption] of examples[key]()) figure(host, options, caption);
  }
  buildData();
  buildCharts();
  for (const m of mounts) m.handle = m.make();
  buildBadges();
}

const BADGES = [["nfl", 27, 24, "final"], ["nhl", 3, 2, "final-ot"], ["nba", 98, 104, "Q4 2:31"], ["mlb", 2, 2, "Top 7th"], ["cfl", 31, 34, "final-ot"], ["nba", 112, 108, "final"], ["nhl", 1, 4, "2nd period"], ["ifaf", 14, 17, "final"]];
function buildBadges() {
  const list = $("badge-list");
  list.replaceChildren();
  for (const [sport, away, home, status] of BADGES) {
    const li = document.createElement("li");
    li.innerHTML = drawKyogijo({ ...gameOf(sport, { size: "badge", status, winner: "leader" }), away: team(sport, "away", away), home: team(sport, "home", home) });
    list.append(li);
  }
}

// ----- A live score: a made-up game that moves when asked, or by itself every few seconds while the page is in view.
const PLAYS = [["away", 1], ["home", 1], ["home", 1], ["away", 1], ["away", 1], ["home", 1], ["away", 1], ["home", 1], ["home", 1]];
const live = { step: 0, timer: undefined, mount: undefined };
function liveOptions() {
  const done = live.step >= PLAYS.length;
  const scores = { away: 0, home: 0 };
  for (const [role, n] of PLAYS.slice(0, live.step)) scores[role] += n;
  const period = Math.min(3, Math.floor(live.step / 3) + 1);
  const status = done ? "final" : live.step === 0 ? "live" : language.lang === "ja" ? `第${period}ピリオド` : `${["1st", "2nd", "3rd"][period - 1]} period`;
  return gameOf("nhl", { orientation: "auto", away: team("nhl", "away", scores.away), home: team("nhl", "home", scores.home), status, competition: say("liveTitle"), date: "", winner: done ? "auto" : "none" });
}
function drawLive() {
  const o = liveOptions();
  if (live.mount === undefined) live.mount = mountKyogijo($("live-stage"), o);
  else live.mount.update(o);
  $("live-stage").dataset.step = String(live.step);
  $("live-step").disabled = live.step >= PLAYS.length;
  const playing = live.timer !== undefined;
  $("live-play").setAttribute("aria-pressed", String(playing));
  $("live-play").textContent = playing ? say("livePause") : say("livePlay");
}
function liveStop() {
  clearInterval(live.timer);
  live.timer = undefined;
}
$("live-step").addEventListener("click", () => { if (live.step < PLAYS.length) live.step += 1; drawLive(); });
$("live-new").addEventListener("click", () => { liveStop(); live.step = 0; drawLive(); });
$("live-play").addEventListener("click", () => {
  if (live.timer !== undefined) liveStop();
  else {
    if (live.step >= PLAYS.length) live.step = 0;
    live.timer = setInterval(() => {
      // Only while the page is on screen: a hidden tab does no work.
      if (document.visibilityState !== "visible") return;
      live.step += 1;
      if (live.step >= PLAYS.length) liveStop();
      drawLive();
    }, 4000);
  }
  drawLive();
});

// ----- Replay: a made-up play on the rink and on the pitch, from seeded tracking data. Nothing plays by itself; the language changes the words and the clock goes on from where it was.
const REPLAY_PLAYS = { hockey: replayPlay("hockey", { seconds: 14 }), soccer: replayPlay("soccer", { seconds: 24 }) };
const replays = new Map();
function drawReplays() {
  const lang = language.lang;
  for (const [id, kind, sport] of [["replay-rink", "hockey", "nhl"], ["replay-pitch", "soccer", "soccer"]]) {
    const before = replays.get(id);
    const at = before?.handle.state();
    before?.mount.destroy();
    const mount = mountKyogijo($(id), { sport, orientation: "landscape", language: lang, style: "none", id: `replay-${kind}` });
    const handle = mount.replay(REPLAY_PLAYS[kind], at === undefined ? {} : { start: at.t - at.start, speed: at.speed, loop: at.loop });
    replays.set(id, { mount, handle });
  }
  const element = $("replay-element");
  element.setAttribute("language", lang);
  element.timeline = REPLAY_PLAYS.hockey;
}

// ----- The soccer providers: each pitch in its own frame, and a converter between any two.
const NUMBER = /^\s*-?\d+(?:\.\d+)?\s*$/;
function drawProviders() {
  const grid = $("provider-grid");
  grid.replaceChildren();
  for (const id of SOCCER_PROVIDER_IDS) {
    const p = SOCCER_PROVIDERS[id];
    const tile = document.createElement("figure");
    tile.className = "card provider";
    tile.dataset.provider = id;
    tile.innerHTML = `<div class="card-stage">${drawKyogijo({ sport: "soccer", pitchType: id, margin: 6, detail: "simple", style: "none", language: language.lang, title: p.name })}</div><figcaption><strong></strong> <span></span></figcaption>`;
    tile.querySelector("strong").textContent = p.name;
    tile.querySelector("span").textContent = `${p.unit} · ${say(p.sized ? "providerSized" : "providerFixed")}`;
    grid.append(tile);
  }
  for (const id of ["conv-from", "conv-to"]) {
    const select = $(id);
    const keep_ = select.value || (id === "conv-from" ? "opta" : "statsbomb");
    select.replaceChildren();
    for (const key of SOCCER_PROVIDER_IDS) select.append(opt(key, SOCCER_PROVIDERS[key].name));
    select.value = keep_;
  }
  convert();
}
function convert() {
  const out = $("conv-out");
  const x = $("conv-x").value;
  const y = $("conv-y").value;
  if (!NUMBER.test(x) || !NUMBER.test(y)) { out.textContent = say("convBad"); return; }
  const [a, b] = rescale($("conv-from").value, $("conv-to").value)(Number(x), Number(y));
  out.textContent = `${Math.round(a * 1000) / 1000}, ${Math.round(b * 1000) / 1000}`;
}
for (const id of ["conv-from", "conv-to", "conv-x", "conv-y"]) $(id).addEventListener(id.startsWith("conv-x") || id.startsWith("conv-y") ? "input" : "change", convert);
$("conv-spot").addEventListener("click", () => {
  // The penalty mark of the right end, in the first system's own numbers.
  const from = SOCCER_PROVIDERS[$("conv-from").value].frame(105, 68);
  const sx = from.xRight > from.xLeft ? 1 : -1;
  $("conv-x").value = String(Math.round((from.xRight - sx * from.spot) * 1000) / 1000);
  $("conv-y").value = String(Math.round(((from.yTop + from.yBottom) / 2) * 1000) / 1000);
  convert();
});

// ----- Every ballpark, drawn when asked for or when the section comes into view.
let parksDrawn = false;
function drawParks() {
  const grid = $("park-grid");
  grid.replaceChildren();
  for (const id of PARK_IDS) {
    const p = PARKS[id];
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "park";
    tile.dataset.park = id;
    const name = language.lang === "ja" && p.nameJa ? p.nameJa : p.name;
    tile.innerHTML = `${drawKyogijo({ sport: "mlb", park: id, orientation: "portrait", margin: 6, detail: "simple", stripes: false, style: "none", title: name })}<span class="park-name">${name.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span><span class="park-sub">${p.league} · ${p.status === "past" ? (p.from !== undefined ? `${p.from}–${p.to}` : language.lang === "ja" ? "過去" : "past") : p.city}</span>`;
    tile.addEventListener("click", () => {
      state.sport = "mlb";
      state.park = id;
      loadGame("mlb");
      fillFields();
      $("park").value = id;
      refreshSegs();
      change();
      $("try").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    grid.append(tile);
  }
  parksDrawn = true;
}
$("parks-show").addEventListener("click", () => { drawParks(); $("parks-show").hidden = true; });
if (typeof IntersectionObserver !== "undefined") {
  new IntersectionObserver((entries, observer) => {
    if (entries.some((e) => e.isIntersecting) && !parksDrawn) { drawParks(); $("parks-show").hidden = true; observer.disconnect(); }
  }, { rootMargin: "300px" }).observe($("park-grid"));
}

// ----- The atlas: a map of every park and ground. Its places open in the playground above.
function tryPlace(place) {
  if (place.kind === "park") {
    state.sport = "mlb";
    state.park = place.id;
  } else {
    state.sport = "soccer";
    state.ground = place.id;
  }
  loadGame(state.sport);
  fillFields();
  $("park").value = state.park;
  $("ground").value = state.ground;
  refreshSegs();
  change();
  $("try").scrollIntoView({ behavior: "smooth", block: "start" });
}
let atlas = { relabel() {} };

// ----- A change of language redraws the words that were drawn in it.
function onLanguage() {
  atlas.relabel();
  fillParks();
  fillGrounds();
  fillLeagues();
  fillPitches();
  drawProviders();
  if (!state.touched.has("away.name") && !state.touched.has("home.name")) {
    const family = FAMILIES[state.sport];
    for (const role of ["away", "home"]) state[role].name = language.lang === "ja" ? TEAMS_JA[family][role] : TEAMS[family][role].name;
    fillFields();
  }
  refreshSegs();
  buildExamples();
  drawLive();
  drawReplays();
  if (parksDrawn) drawParks();
  render();
}

// ----- Start.
applyTheme();
fillFields();
fillParks();
fillLeagues();
fillPitches();
fillGrounds();
refreshSegs();
buildExamples();
drawProviders();
drawLive();
drawReplays();
render();
document.documentElement.dataset.kyogijoVersion = VERSION;
initAtlas({ say, lang: () => language.lang, onTry: tryPlace }).then((started) => { atlas = started; });
