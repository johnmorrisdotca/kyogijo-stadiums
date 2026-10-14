// The demo page's own script: a surface to try (the package's own `mountKyogijo`), the code that draws it in four ways,
// and a page of examples: every sport, wide and tall, badges, compact cards, court looks, a live score, every ballpark,
// and the custom element. The words are in words.js, the made-up teams in examples.js.
import { COURT_THEMES, GROUNDS, GROUND_IDS, KYOGIJO_STYLE, LEAGUES, PARKS, PARK_IDS, SOCCER_PITCH_IDS, SOCCER_PROVIDERS, SOCCER_PROVIDER_IDS, VERSION, drawKyogijo, fenceFor, rescale, layerTable, rulesFor, seasonLabel, leagueAt, leagueSeason } from "./dist/index.js";
import { emblemName, renderEmblem } from "./emblems.js";
import { mountKyogijo } from "./dist/mount-entry.js";
import { clientPointToFrames, fieldPointToClient } from "./dist/pointer-entry.js";
import { KYOGIJO_TURN_STYLE, mountKyogijoTurn } from "./dist/turn-entry.js";
import "./dist/element-define.js";
import { initAtlas } from "./atlas.js";
import { mountPlaceGrid } from "./place-grid.js";
import { toParams } from "./embed-params.js";
import { EMBLEMS, FAMILIES, TEAMS, TEAMS_JA } from "./examples.js";
import { gameOf as gameFor, teamOf } from "./games.js";
import { nbaZones, passMap, shotHeat, shotMap, sprayChart, sprayDensity, touchZones } from "./layers-data.js";
import { mlbBalls, nbaShots, nflPasses, nhlShots, soccerShots } from "./charts-data.js";
import { replayPlay } from "./replay-data.js";
import { poolRace, shortRace } from "./pool-data.js";
import { raceTimeline } from "./dist/replay-entry.js";
import { ROAD_FINAL, SERIES_LABELS, SERIES_LABELS_JA, nation, roadFinalists, roadSeries } from "./road-data.js";
import { roadToFinal } from "./dist/charts-entry.js";
import { mlbSprayChart, nbaShotChart, nflPassChart, nhlShotMap, soccerShotMap } from "./dist/charts-entry.js";
import { fenceAt } from "./dist/geometry-entry.js";
import { FIELDS, MAX_SHOTS, SEGS, applyParams, chosenLeague, hasSeasons, hiddenRows, hiddenStatus, labelOf as labelsFor, loadGame as loadGameInto, makeState, optionsFor as optionsOf, seasonRange, urlPairs, usesEmblems } from "./model.js";
import { WORDS } from "./words.js";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const CANON = "https://johnmorrisdotca.github.io/kyogijo-stadiums/";
const CDN = "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0";
const DOUGU = "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/dougu-sports@0";

const language = familyLanguage({ id: "kyogijo-stadiums", words: WORDS, onChange: () => onLanguage() });
const say = (key) => WORDS[language.lang][key];

// The stylesheet once for the whole page: every drawing here is made with style: "none".
// The build wrote it into the page's head, so that the first view is drawn before this script runs; it is made here only when it is not there.
if (document.getElementById("kyogijo-style") === null) {
  const sheet = document.createElement("style");
  sheet.id = "kyogijo-style";
  sheet.textContent = `${KYOGIJO_STYLE}\n${KYOGIJO_TURN_STYLE}`;
  document.head.append(sheet);
}

const keep = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* A browser that keeps nothing: the choice lasts the visit. */ }
  },
};

const state = makeState(params, keep.get("kyogijo-stadiums.theme"));

/** The made-up game for a sport, laid into the state (names in the page's language until a name is typed). */
const loadGame = (sport) => loadGameInto(state, sport, language.lang);
loadGame(state.sport);
applyParams(state, params);

/** What the state asks the package to draw. */
const optionsFor = (s, forCode = false) => optionsOf(s, language.lang, forCode);

// ----- The controls.
const labelOf = labelsFor(say, state);
/** Show and hide the rows the state asks for (see `hiddenRows`). */
function applyRows() {
  for (const [id, hidden] of Object.entries(hiddenRows(state))) $(id).hidden = hidden;
}

const segs = {};
/**
 * Take over a segmented choice: its buttons are in the page already (the build wrote them), so each keeps its place and gets its press;
 * one that is not there (a page made another way) is made. `get` says which is on and `set` what a press does.
 */
function makeSeg(id, set) {
  const { kind, values, get } = SEGS.find((one) => one.id === id);
  const host = $(id);
  segs[id] = { host, kind, values, get: () => get(state) };
  const have = [...host.children].map((button) => button.dataset.value);
  if (have.join() !== values.join()) {
    host.replaceChildren();
    for (const value of values) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.value = value;
      host.append(button);
    }
  }
  for (const button of host.children) button.addEventListener("click", () => { set(button.dataset.value); refreshSegs(); change(); });
}
function refreshSegs() {
  for (const seg of Object.values(segs)) {
    for (const button of seg.host.children) {
      button.hidden = seg.kind === "status" && hiddenStatus(state.sport, button.dataset.value);
      if (seg.kind === "mark") {
        // A tile is the emblem drawn small, in the style that is on, and named for a screen reader in the page's language.
        const id = button.dataset.value;
        const svg = renderEmblem(state.emblemLine ? `${id}/line` : id, { size: 34 });
        if (button.dataset.drawn !== svg) { button.innerHTML = svg; button.dataset.drawn = svg; }
        const name = emblemName(id, language.lang);
        if (button.getAttribute("aria-label") !== name) { button.setAttribute("aria-label", name); button.title = name; }
        button.setAttribute("aria-pressed", String(seg.get() === id));
        continue;
      }
      const text = labelOf[seg.kind](button.dataset.value);
      if (button.textContent !== text) button.textContent = text;
      button.setAttribute("aria-pressed", String(seg.get() === button.dataset.value));
    }
  }
  // Baseball says ビジター for the away team in Japanese; the other sports say アウェイ.
  document.querySelector('.team[data-role="away"] h3').textContent = say(state.sport === "mlb" ? "awayBaseball" : "away");
  applyRows();
}

makeSeg("sport", (v) => { state.sport = v; state.league = null; loadGame(v); fillFields(); fillLeagues(); });
makeSeg("era", (v) => { state.year = v === "today" ? null : (state.year ?? clampYear(1975)); });
makeSeg("size", (v) => { state.size = v; });
makeSeg("orientation", (v) => { state.orientation = v; });
makeSeg("view", (v) => { state.view = v; });
makeSeg("theme", (v) => { state.theme = v; keep.set("kyogijo-stadiums.theme", v); applyTheme(); });
makeSeg("status", (v) => { state.status = v; });
makeSeg("winner", (v) => { state.winner = v; });
makeSeg("detail", (v) => { state.detail = v; });
makeSeg("pageant", (v) => { state.pageant = v; });
makeSeg("pageant-lines", (v) => { state.pageantLines = v; });
makeSeg("sit-hockey", (v) => { state.sitHockey = v; });
makeSeg("sit-outs", (v) => { state.sitOuts = v; });
makeSeg("sit-count", (v) => { state.sitCount = v; });
makeSeg("sit-down", (v) => { state.sitDown = v; });
makeSeg("sit-togo", (v) => { state.sitToGo = v; });
makeSeg("court", (v) => { state.court = v; });
makeSeg("pool-look", (v) => { state.poolLook = v; });
makeSeg("pool-deck", (v) => { state.poolDeck = v; });
makeSeg("pool-course", (v) => { state.poolCourse = v; });
makeSeg("pool-lanes", (v) => { state.poolLanes = v; });
makeSeg("pool-race", (v) => { state.poolRace = v; });
makeSeg("pattern", (v) => { state.pattern = v; });
makeSeg("goals", (v) => { state.goals = v; });
makeSeg("half", (v) => { state.half = v; });
// A part of the sheet or a folded one is a bare sheet: a score always shows the whole of it, so the choice turns the teams off, and says so in the Show row's help.
makeSeg("sheet", (v) => { state.sheet = v; if (v !== "sheet" && state.size !== "surface") state.size = "surface"; });
makeSeg("track", (v) => { state.track = v; });
makeSeg("infield", (v) => { state.infield = v; });
makeSeg("races", (v) => { state.races = v; });
makeSeg("lineup", (v) => { state.lineup = v; });
for (const role of ["away", "home"]) makeSeg(`${role}-logo`, (v) => { state[role].logo = v; });
// The pickers of a ready-made emblem: a grid of tiles, each the emblem itself, for a team's mark and for the middle of a pageant.
for (const role of ["away", "home"]) makeSeg(`${role}-mark`, (v) => { state[role].mark = v; });
makeSeg("pageant-emblem-id", (v) => { state.pageantEmblemId = v; });

/** A season inside the range the surface's history covers. */
function clampYear(year) {
  if (!hasSeasons(state)) return year;
  const { from, to } = seasonRange(state);
  return Math.min(to, Math.max(from, year));
}
$("era-year").addEventListener("input", (event) => { state.year = Number(event.target.value); change(); });
$("sit-ballon").addEventListener("input", (event) => { state.sitBallOn = Number(event.target.value); $("sit-ballon-out").textContent = String(state.sitBallOn); change(); });
// A base is a character of the runners' string: 1 for a runner on it.
for (const [i, id] of ["sit-b1", "sit-b2", "sit-b3"].entries()) {
  $(id).addEventListener("click", () => {
    const bases = [...state.sitBases];
    bases[i] = bases[i] === "1" ? "0" : "1";
    state.sitBases = bases.join("");
    change();
  });
}
$("crowd-density").addEventListener("input", (event) => { state.crowdDensity = Number(event.target.value); $("crowd-density-out").textContent = `${state.crowdDensity}%`; change(); });

/** The season control's contents: the markings that differed from today's, for the sports that have a history (`hiddenRows` shows the rows). */
function renderEra() {
  if (!hasSeasons(state)) return;
  if (state.year !== null) state.year = clampYear(state.year);
  const past = state.year !== null;
  const notes = $("era-notes");
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
for (const [id, key] of [["stripes", "stripes"], ["exact", "exact"], ["baseline", "baseline"], ["centre-logo", "centreLogo"], ["hardwood", "hardwood"], ["crowd", "crowd"], ["crowd-tifo", "crowdTifo"], ["flags", "flags"], ["pageant-emblem", "pageantEmblem"], ["emblem-line", "emblemLine"], ["pageant-entrance", "pageantEntrance"], ["pool-section", "poolSection"], ["situation", "situation"], ["sit-drive", "sitDrive"], ["place", "place"]]) toggle(id, key);
$("emblem-line").addEventListener("click", () => refreshSegs());
$("pageant-emblem").addEventListener("click", () => refreshSegs());

function fillFields() {
  for (const field of FIELDS) {
    const value = field.get(state);
    if ($(field.id).value !== value) $(field.id).value = value;
  }
}
for (const role of ["away", "home"]) {
  for (const [field, key] of [["name", "name"], ["abbr", "abbr"], ["score", "score"], ["color", "color"], ["logo-url", "url"], ["pens", "pens"]]) {
    $(`${role}-${field}`).addEventListener("input", (event) => { state[role][key] = event.target.value; state.touched.add(`${role}.${key}`); change(); });
  }
}
for (const [id, key] of [["status-text", "statusText"], ["competition", "competition"], ["date", "date"], ["label", "label"]]) $(id).addEventListener("input", (event) => { state[key] = event.target.value; change(); });
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
/** The 3D view, while the playground is on it: it takes the stage over from the flat drawing, and gives it back. */
let turn;
function render() {
  const o = optionsFor(state);
  o.style = "none";
  stage.dataset.view = state.view;
  if (state.view === "3d") {
    if (turn === undefined) {
      mount?.destroy();
      mount = undefined;
      stage.replaceChildren();
      // The page's own light or dark is the stylesheet's to follow; the turn's own rules are written once into the page, like the drawing's.
      turn = mountKyogijoTurn(stage, o, { preset: state.viewpoint, onChange: (_, preset) => { if (preset !== undefined) state.viewpoint = preset; syncUrl(); } });
    } else turn.update(o);
    stage.dataset.orientation = "landscape";
    stage.dataset.sport = state.sport;
    stage.dataset.size = state.size;
    stage.dataset.ready = "true";
    stage.removeAttribute("data-pending");
  } else {
    if (turn !== undefined) {
      turn.destroy();
      turn = undefined;
      mount = undefined;
    }
    if (mount === undefined) {
      // The first drawing is in the page already (the build drew it): when it is the one this state asks for, it stays, node for node.
      const drawn = stage.firstElementChild;
      mount = mountKyogijo(stage, o);
      const again = stage.firstElementChild;
      if (drawn !== null && again !== null && drawn !== again && drawn.outerHTML === again.outerHTML) stage.replaceChildren(drawn);
    } else mount.update(o);
    const svg = stage.querySelector("svg");
    const box = svg.viewBox.baseVal;
    stage.style.setProperty("--r", String(box.width / box.height));
    stage.dataset.orientation = mount.orientation();
    stage.dataset.sport = state.sport;
    stage.dataset.size = state.size;
    stage.dataset.ready = "true";
    stage.removeAttribute("data-pending");
  }
  renderEra();
  applyRows();
  for (const toggleOf of [["flags", "flags"], ["stripes", "stripes"], ["exact", "exact"], ["baseline", "baseline"], ["centre-logo", "centreLogo"], ["hardwood", "hardwood"], ["crowd", "crowd"], ["crowd-tifo", "crowdTifo"], ["pageant-emblem", "pageantEmblem"], ["emblem-line", "emblemLine"], ["pageant-entrance", "pageantEntrance"], ["pool-section", "poolSection"], ["situation", "situation"], ["sit-drive", "sitDrive"], ["place", "place"]]) $(toggleOf[0]).setAttribute("aria-pressed", String(state[toggleOf[1]]));
  for (const [i, id] of ["sit-b1", "sit-b2", "sit-b3"].entries()) $(id).setAttribute("aria-pressed", String(state.sitBases[i] === "1"));
  $("sit-ballon").value = String(state.sitBallOn);
  $("sit-ballon-out").textContent = String(state.sitBallOn);
  $("crowd-density").value = String(state.crowdDensity);
  $("crowd-density-out").textContent = `${state.crowdDensity}%`;
  updateEmbed();
  syncUrl();
}

function syncUrl() {
  const q = new URLSearchParams(location.search);
  for (const [key, value] of urlPairs(state, language.lang)) {
    if (value === null) q.delete(key);
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
  if (kind === "module" && state.view === "3d") {
    return `import { mountKyogijoTurn } from "${CDN}/dist/turn-entry.js";\n// or, from npm: import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";\n\nmountKyogijoTurn(document.querySelector("#game"), ${tidy(o)}, { preset: "${state.viewpoint}" });`;
  }
  if (kind === "module") {
    // An emblem's id is drawn by Dougu Sports, which the page plugs in once.
    const plug = usesEmblems(state) ? `import { renderEmblem } from "${DOUGU}/dist/emblems-entry.js";\n// or, from npm: import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";\n` : "";
    const use = plug === "" ? "" : "\nuseEmblems(renderEmblem);\n";
    return `import { drawKyogijo${plug === "" ? "" : ", useEmblems"} } from "${CDN}/+esm";\n// or, from npm: import { drawKyogijo${plug === "" ? "" : ", useEmblems"} } from "@johnmorrisdotca/kyogijo-stadiums";\n${plug}${use}\ndocument.querySelector("#game").innerHTML = drawKyogijo(${tidy(o)});`;
  }
  if (kind === "element") {
    const attrs = [`sport="${o.sport}"`];
    if (o.league) attrs.push(`league="${o.league}"`);
    if (o.park) attrs.push(`park="${o.park}"`);
    if (o.size && o.size !== "full") attrs.push(`size="${o.size}"`);
    attrs.push(`orientation="${o.orientation}"`);
    if (state.view === "3d") attrs.push("turn", `turn-view="${state.viewpoint}"`);
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
    // What has no attribute of its own goes in the `options` JSON.
    const more = { ...(o.court ? { court: o.court } : {}), ...(o.sheet ? { sheet: o.sheet } : {}), ...(o.crowd ? { crowd: o.crowd } : {}), ...(o.pageant ? { pageant: o.pageant } : {}), ...(o.pool ? { pool: o.pool } : {}), ...(o.athletics ? { athletics: o.athletics } : {}), ...(o.situation ? { situation: o.situation } : {}) };
    if (Object.keys(more).length > 0) attrs.push(`options='${JSON.stringify(more).replace(/'/g, "&#39;")}'`);
    const plug = usesEmblems(state) ? `<script type="module">\n  import { useEmblems } from "${CDN}/dist/element-entry.js";\n  import { renderEmblem } from "${DOUGU}/dist/emblems-entry.js";\n  useEmblems(renderEmblem);\n</script>\n` : "";
    return `<script type="module" src="${CDN}/dist/element-define.js"></script>\n${plug}\n<kyogijo-field\n  ${attrs.join("\n  ")}\n></kyogijo-field>`;
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
      button.addEventListener("click", () => { state.embed = tab; updateEmbed(); syncUrl(); });
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
// The address of this exact view: every control is in it (syncUrl keeps it current), so a reader who opens it sees what this one sees.
$("embed-link").addEventListener("click", async () => {
  syncUrl();
  await copyText(location.href);
  $("embed-status").textContent = say("linkCopied");
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
const team = (sport, role, score) => teamOf(sport, role, score, language.lang);
const gameOf = (sport, extra = {}) => gameFor(sport, extra, language.lang);

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
  sides: () => [
    [gameOf("nhl", { orientation: "landscape" }), `${say("sport_nhl")} · ${say("orientation_landscape")}`],
    [gameOf("nhl", { orientation: "portrait" }), `${say("sport_nhl")} · ${say("orientation_portrait")}`],
    [gameOf("nfl", { orientation: "landscape" }), `${say("sport_nfl")} · ${say("orientation_landscape")}`],
    [gameOf("nfl", { orientation: "portrait" }), `${say("sport_nfl")} · ${say("orientation_portrait")}`],
  ],
  compact: () => ["nba", "nfl", "nhl"].map((sport) => [gameOf(sport, { size: "compact", orientation: "auto" }), say(`sport_${sport}`)]),
  courts: () => {
    const names = TEAMS.basketball;
    const themes = ["maple", "twoTone", "night", "sunburst", "tournament"].map((theme) => [gameOf("nba", { orientation: "auto", court: { ...COURT_THEMES[theme], baselineText: [names.away.name.toUpperCase(), names.home.name.toUpperCase()] } }), say(`court_${theme}`)]);
    // The real floors are bare, so that the boards show: no teams in the way, the teams' colours on the ends and the paint.
    const bare = { orientation: "auto", away: undefined, home: undefined, status: undefined, competition: undefined, date: undefined, leftColor: names.away.color, rightColor: names.home.color };
    const own = { border: "#16263f", key: names.away.color, keyLeft: names.away.color, keyRight: names.home.color, centreCircle: names.home.color, baselineText: [names.away.name.toUpperCase(), names.home.name.toUpperCase()] };
    return [...themes, [gameOf("nba", { ...bare, court: { ...own, hardwood: true } }), say("court_hardwood")], [gameOf("nba", { ...bare, court: { ...own, hardwood: { detail: "plain" } } }), say("court_hardwoodPlain")]];
  },
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

// The Road to the final section: the two finalists of a made-up tournament (nations that do not exist, with flags drawn in code, from road-data.js) in each size, a
// play-off series with no flags, and the round mark on a pitch and in a badge. Each chart has the table that stands for it under it.
function roads() {
  const lang = language.lang;
  const ja = lang === "ja";
  const title = ja ? "ノーザンカップ2030" : "Northern Cup 2030";
  const note = ja ? "架空のチーム・国旗・結果" : "Made-up teams, flags and results";
  const finalists = roadFinalists(lang);
  const card = roadToFinal(finalists, { language: lang, title, final: ROAD_FINAL, endnote: note, id: "road-card" });
  const wide = roadToFinal(finalists, { language: lang, title, size: "wide", id: "road-wide" });
  const phone = roadToFinal(finalists, { language: lang, title, size: "phone", theme: "dark", id: "road-phone" });
  const series = roadToFinal(roadSeries(EMBLEMS), { language: lang, title: ja ? "プレーオフ" : "Cup play-offs", labels: ja ? SERIES_LABELS_JA : SERIES_LABELS, size: "square", id: "road-series" });
  return [["card", card], ["wide", wide], ["phone", phone], ["series", series]];
}
function buildRoad() {
  const host = $("road-cards");
  host.replaceChildren();
  for (const [key, chart] of roads()) {
    const fig = document.createElement("figure");
    fig.className = "card";
    fig.dataset.road = key;
    // A wide card is read across the whole row.
    if (key === "wide") fig.style.gridColumn = "1 / -1";
    const box = document.createElement("div");
    box.className = "card-stage";
    box.innerHTML = chart.draw({ style: "none" });
    const text = document.createElement("figcaption");
    text.textContent = say(`road_${key}`);
    const details = document.createElement("details");
    details.className = "data-table";
    details.dataset.testid = `road-table-${key}`;
    const summary = document.createElement("summary");
    summary.textContent = say("dataTable");
    const holder = document.createElement("div");
    holder.className = "data-table-body";
    holder.innerHTML = chart.table();
    details.append(summary, holder);
    fig.append(box, text, details);
    host.append(fig);
  }
  // The round mark on a pitch and in a badge: a country against a country, each flag in a circle with a ring on its side.
  const lang = language.lang;
  const cup = lang === "ja" ? "ノーザンカップ決勝" : "Northern Cup final";
  const game = { sport: "soccer", markShape: "round", away: { ...nation("aurelia", lang), score: 2, penalties: 4 }, home: { ...nation("calvara", lang), score: 2, penalties: 3 }, status: "final-pens", competition: cup, language: lang, style: "none" };
  for (const [key, extra] of [["mark_wide", { orientation: "landscape" }], ["mark_tall", { orientation: "portrait" }], ["mark_badge", { size: "badge" }]]) {
    const fig = figure(host, { ...game, ...extra, id: `road-${key}` }, say(`road_${key}`));
    fig.dataset.road = key;
  }
}

// The Pools section: the four pools, and a made-up race (swimmers and nations that do not exist, flags drawn in code, from pool-data.js) as results, as pace bars, as a start list and tall.
function pools() {
  const lang = language.lang;
  const race = poolRace(lang);
  const start = shortRace(lang);
  const startList = { ...start, swimmers: start.swimmers.filter((one) => one.lane <= 6).map(({ lane, name, abbr, flag, seed }) => ({ lane, name, abbr, flag, seed })) };
  const swim = (id, pool, extra = {}) => ({ sport: "swimming", orientation: "landscape", language: lang, style: "none", id: `pools-${id}`, pool, ...extra });
  return [
    ["results", swim("results", { look: "water", race })],
    ["pace", swim("pace", { look: "water", race: { ...race, pace: true } })],
    ["start", swim("start", { course: "short", lanes: 6, look: "water", race: startList })],
    ["tall", swim("tall", { race }, { orientation: "portrait" })],
    ["hall", swim("hall", { venue: "natatorium", look: "water" })],
    ["polo", { sport: "waterpolo", orientation: "landscape", language: lang, style: "none", id: "pools-polo", pool: { look: "water" } }],
    ["dive", { sport: "diving", orientation: "landscape", language: lang, style: "none", id: "pools-dive", pool: { look: "water" } }],
    ["art", { sport: "artisticswimming", orientation: "landscape", language: lang, style: "none", id: "pools-art", pool: { look: "water" } }],
  ];
}
function buildPools() {
  const host = $("pool-cards");
  host.replaceChildren();
  for (const [key, options] of pools()) {
    const fig = figure(host, options, say(`pools_${key}`));
    fig.dataset.pool = key;
    // The race and the hall are read across the whole row.
    if (key === "results" || key === "pace" || key === "hall") fig.style.gridColumn = "1 / -1";
  }
}

function buildExamples() {
  for (const m of mounts) m.handle?.destroy();
  mounts.length = 0;
  for (const [id, key] of [["side-cards", "sides"], ["compact-cards", "compact"], ["court-cards", "courts"]]) {
    const host = $(id);
    host.replaceChildren();
    for (const [options, caption] of examples[key]()) figure(host, options, caption);
  }
  buildData();
  buildCharts();
  buildRoad();
  buildPools();
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
  // The race: the splits of a made-up 200 m final played as swimmers going down their lanes and back, with a wake behind each.
  const swum = { look: "water", race: { ...poolRace(lang), show: { results: false, seeds: false, medals: false } } };
  const plays = { hockey: REPLAY_PLAYS.hockey, soccer: REPLAY_PLAYS.soccer, pool: raceTimeline({ pool: swum }, { language: lang }) };
  for (const [id, kind, sport] of [["replay-rink", "hockey", "nhl"], ["replay-pitch", "soccer", "soccer"], ["replay-pool", "pool", "swimming"]]) {
    const before = replays.get(id);
    const at = before?.handle.state();
    before?.mount.destroy();
    const mount = mountKyogijo($(id), { sport, orientation: "landscape", language: lang, style: "none", id: `replay-${kind}`, ...(kind === "pool" ? { pool: swum } : {}) });
    const handle = mount.replay(plays[kind], { ...(kind === "pool" ? { trail: 3, trailOf: ["home"] } : {}), ...(at === undefined ? {} : { start: at.t - at.start, speed: at.speed, loop: at.loop }) });
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

// ----- Point at the field: a click or a drag on a drawing (made with `pointer: true`) is written in every provider's numbers of the sport, with the zone the rules put it in.
const POINT_SPORTS = ["soccer", "nhl", "nba", "mlb", "nfl"];
const point = { sport: params.get("pointsport") && POINT_SPORTS.includes(params.get("pointsport")) ? params.get("pointsport") : "nhl", at: null, down: false };
const pointSvg = () => $("point-stage").querySelector("svg");
const round3 = (n) => Math.round(n * 1000) / 1000;
function pointMarker() {
  const marker = $("point-marker");
  const svg = pointSvg();
  const at = point.at === null || svg === null ? null : fieldPointToClient(svg, [point.at.x, point.at.y]);
  if (at === null) { marker.hidden = true; return; }
  const box = $("point-stage").getBoundingClientRect();
  marker.style.left = `${at.x - box.left}px`;
  marker.style.top = `${at.y - box.top}px`;
  marker.hidden = false;
}
function pointRead(x, y) {
  const svg = pointSvg();
  const out = svg === null ? null : clientPointToFrames(svg, x, y, { language: language.lang });
  if (out === null) return;
  point.at = { x: out.surface.x, y: out.surface.y };
  const rows = [[say("pointSurface"), `${round3(out.surface.x)}, ${round3(out.surface.y)}`], ...out.points.map((p) => [`${p.title} (${p.unit})`, `${round3(p.x)}, ${round3(p.y)}`])];
  $("point-table").tBodies[0].replaceChildren(...rows.map(([name, value]) => {
    const tr = document.createElement("tr");
    for (const text of [name, value]) { const td = document.createElement("td"); td.textContent = text; tr.append(td); }
    return tr;
  }));
  const names = out.names;
  $("point-zone").textContent = !out.inBounds && out.zone === undefined ? say("pointOff") : [out.zone === undefined ? "" : `${say("pointZone")}: ${names[out.zone]}`, out.subzone === undefined ? "" : `${say("pointArea")}: ${names[out.subzone]}`].filter(Boolean).join(" · ");
  $("point-zone").dataset.zone = out.zone ?? "";
  $("point-zone").dataset.subzone = out.subzone ?? "";
  $("point-zone").dataset.inBounds = String(out.inBounds);
  pointMarker();
}
function drawPoint() {
  const stage = $("point-stage");
  stage.innerHTML = drawKyogijo({ sport: point.sport, pointer: true, style: "none", orientation: "landscape", language: language.lang, margin: 4, id: "point" });
  stage.dataset.sport = point.sport;
  if (point.at === null) {
    $("point-zone").textContent = say("pointNone");
    $("point-table").tBodies[0].replaceChildren();
    $("point-marker").hidden = true;
  } else {
    const svg = pointSvg();
    const client = svg === null ? null : fieldPointToClient(svg, [point.at.x, point.at.y]);
    if (client !== null) pointRead(client.x, client.y);
  }
}
function fillPointSports() {
  const select = $("point-sport");
  select.replaceChildren(...POINT_SPORTS.map((id) => opt(id, say(`sport_${id}`))));
  select.value = point.sport;
}
$("point-sport").addEventListener("change", (event) => { point.sport = event.target.value; point.at = null; drawPoint(); });
$("point-stage").addEventListener("pointerdown", (event) => { point.down = true; $("point-stage").setPointerCapture?.(event.pointerId); pointRead(event.clientX, event.clientY); });
$("point-stage").addEventListener("pointermove", (event) => { if (point.down) pointRead(event.clientX, event.clientY); });
for (const name of ["pointerup", "pointercancel"]) $("point-stage").addEventListener(name, () => { point.down = false; });
$("point-stage").addEventListener("keydown", (event) => {
  const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (step === undefined) return;
  event.preventDefault();
  const svg = pointSvg();
  if (svg === null) return;
  const from = point.at ?? { x: 0, y: 0 };
  const start = point.at === null ? svg.querySelector(".ky-surface-group").getAttribute("data-box").split(" ").map(Number) : null;
  const here = start === null ? from : { x: start[0] + start[2] / 2, y: start[1] + start[3] / 2 };
  const k = event.shiftKey ? 10 : 1;
  const next = { x: here.x + step[0] * k, y: here.y + step[1] * k };
  const client = fieldPointToClient(svg, [next.x, next.y]);
  if (client !== null) pointRead(client.x, client.y);
});
window.addEventListener("resize", pointMarker);

// ----- The Every sport, The soccer pitch, Ballparks and Soccer grounds sections (demo/place-grid.js: short, with filters) and the atlas's map of every park and ground. Their places open in the playground above.
function tryPlace(place, surface) {
  // A park's fence and a ground's pitch, or the surface of another sport that a club played in the place (a CFL field, an NFL field, a rugby league field).
  const sport = surface?.sport ?? (place.kind === "park" ? "mlb" : "soccer");
  state.sport = sport;
  state.league = surface?.league ?? null;
  if (sport === "mlb") state.park = place.id;
  else if (sport === "soccer") state.ground = surface?.ground ?? (surface === undefined && place.kind === "ground" ? place.id : "none");
  loadGame(state.sport);
  fillFields();
  fillLeagues();
  $("park").value = state.park;
  $("ground").value = state.ground;
  refreshSegs();
  change();
  $("try").scrollIntoView({ behavior: "smooth", block: "start" });
}
let atlas = { relabel() {} };
const pick = (kind, id) => tryPlace({ kind, id });
const grids = ["gallery", "pitches", "parks", "grounds"].map((name) => mountPlaceGrid(name, { say, lang: () => language.lang, onPick: pick }));

// ----- A change of language redraws the words that were drawn in it.
function onLanguage() {
  atlas.relabel();
  for (const grid of grids) grid.relabel();
  fillParks();
  fillGrounds();
  fillLeagues();
  fillPitches();
  drawProviders();
  fillPointSports();
  drawPoint();
  if (!state.touched.has("away.name") && !state.touched.has("home.name")) {
    const family = FAMILIES[state.sport];
    for (const role of ["away", "home"]) state[role].name = language.lang === "ja" ? TEAMS_JA[family][role] : TEAMS[family][role].name;
    fillFields();
  }
  refreshSegs();
  buildExamples();
  drawLive();
  drawReplays();
  render();
}

// ----- Click to place: with the toggle on, a click on the drawing drops a point there and the readout follows the pointer, in the surface's own feet (from its top left, as drawn wide).
// TODO: take the point from `clientPointToField` of the package's ./pointer entry once work/dx is merged; this is a small local stand-in for it.
/** The surface's feet under a pointer event, or null when the pointer is not over a drawing that has a layer to measure against (the layers lie in the surface's own frame, quarter turn included). */
function pointOnSurface(event) {
  const svg = stage.querySelector("svg");
  const group = stage.querySelector(".ky-layers");
  if (svg === null || group === null || typeof group.getScreenCTM !== "function") return null;
  const matrix = group.getScreenCTM();
  if (matrix === null) return null;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const at = point.matrixTransform(matrix.inverse());
  return [Math.round(at.x * 10) / 10, Math.round(at.y * 10) / 10];
}
const placeText = (at) => say("placeAt").replace("{x}", String(at[0])).replace("{y}", String(at[1])).replace("{xm}", (at[0] * 0.3048).toFixed(1)).replace("{ym}", (at[1] * 0.3048).toFixed(1));
function showPlace(at) {
  $("place-out").textContent = !state.place ? "" : at === null ? say("placeHint") : placeText(at);
}
stage.addEventListener("pointermove", (event) => { if (state.place) showPlace(pointOnSurface(event)); });
stage.addEventListener("pointerleave", () => showPlace(null));
stage.addEventListener("click", (event) => {
  if (!state.place) return;
  const at = pointOnSurface(event);
  if (at === null || state.shots.length >= MAX_SHOTS) return;
  state.shots.push(at);
  change();
  showPlace(at);
});
$("place-clear").addEventListener("click", () => { state.shots = []; change(); });
$("place").addEventListener("click", () => showPlace(null));

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
fillPointSports();
drawPoint();
drawLive();
drawReplays();
render();
document.documentElement.dataset.kyogijoVersion = VERSION;
// The page is its own words and its own drawing now; a page held back for a Japanese reader (see scripts/first-paint.mjs) shows.
document.documentElement.removeAttribute("data-first");
initAtlas({ say, lang: () => language.lang, onTry: tryPlace }).then((started) => { atlas = started; });
