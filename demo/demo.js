// The demo page's own script: a surface to try (the package's own `mountKyogijo`), the code that draws it in four ways,
// and a page of examples: every sport, wide and tall, badges, compact cards, court looks, a live score, every ballpark,
// and the custom element. The words are in words.js, the made-up teams in examples.js.
import { COURT_THEMES, KYOGIJO_STYLE, PARKS, PARK_IDS, SPORTS, VERSION, drawKyogijo } from "./dist/index.js";
import { mountKyogijo } from "./dist/mount-entry.js";
import "./dist/element-define.js";
import { toParams } from "./embed-params.js";
import { EMBLEMS, FAMILIES, GAMES, TEAMS, TEAMS_JA } from "./examples.js";
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
const STATUSES = ["final", "final-ot", "final-so", "live", "half", "custom"];
const WINNERS = ["auto", "leader", "none", "home", "away"];
const COURTS = ["default", "maple", "twoTone", "night", "sunburst", "tournament"];

const state = {
  sport: pick(params.get("sport"), SPORTS, "nhl"),
  park: params.get("park") && (PARKS[params.get("park")] || params.get("park") === "generic") ? params.get("park") : "generic",
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
  state.status = game.status === "final-ot" || game.status === "final" ? game.status : "custom";
  state.statusText = game.status === "final-ot" || game.status === "final" ? "" : game.status;
  state.competition = game.competition;
  state.date = game.date;
  state.label = "";
  state.touched.clear();
}
loadGame(state.sport);

/** What the state asks the package to draw. */
function optionsFor(s, forCode = false) {
  const o = { sport: s.sport, orientation: s.orientation, language: language.lang };
  if (s.detail !== "full") o.detail = s.detail;
  if (!s.stripes) o.stripes = false;
  if (s.exact) o.exactLines = true;
  if (s.sport === "mlb" && s.park !== "generic") o.park = s.park;
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
  logo: (v) => say(`logo_${v}`),
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
function refreshSegs() {
  for (const seg of Object.values(segs)) {
    for (const button of seg.host.children) {
      button.textContent = labelOf[seg.kind](button.dataset.value);
      button.setAttribute("aria-pressed", String(seg.get() === button.dataset.value));
    }
  }
  // Baseball says ビジター for the away team in Japanese; the other sports say アウェイ.
  document.querySelector('.team[data-role="away"] h3').textContent = say(state.sport === "mlb" ? "awayBaseball" : "away");
  for (const role of ["away", "home"]) $(`${role}-logo-url`).hidden = state[role].logo !== "url";
  $("status-text").hidden = state.status !== "custom";
}

makeSeg("sport", "sport", SPORTS, () => state.sport, (v) => { state.sport = v; loadGame(v); fillFields(); });
makeSeg("size", "size", SIZES, () => state.size, (v) => { state.size = v; });
makeSeg("orientation", "orientation", ORIENTATIONS, () => state.orientation, (v) => { state.orientation = v; });
makeSeg("theme", "theme", THEMES, () => state.theme, (v) => { state.theme = v; keep.set("kyogijo.theme", v); applyTheme(); });
makeSeg("status", "status", STATUSES, () => state.status, (v) => { state.status = v; });
makeSeg("winner", "winner", WINNERS, () => state.winner, (v) => { state.winner = v; });
makeSeg("detail", "detail", ["full", "simple"], () => state.detail, (v) => { state.detail = v; });
makeSeg("court", "court", COURTS, () => state.court, (v) => { state.court = v; });
for (const role of ["away", "home"]) makeSeg(`${role}-logo`, "logo", ["none", "emblem", "url"], () => state[role].logo, (v) => { state[role].logo = v; });

function toggle(id, key) {
  $(id).addEventListener("click", () => { state[key] = !state[key]; $(id).setAttribute("aria-pressed", String(state[key])); change(); });
}
toggle("stripes", "stripes");
toggle("exact", "exact");
toggle("baseline", "baseline");
toggle("centre-logo", "centreLogo");

function fillFields() {
  for (const role of ["away", "home"]) {
    $(`${role}-name`).value = state[role].name;
    $(`${role}-abbr`).value = state[role].abbr;
    $(`${role}-score`).value = state[role].score;
    $(`${role}-color`).value = state[role].color;
    $(`${role}-logo-url`).value = state[role].url;
  }
  $("status-text").value = state.statusText;
  $("competition").value = state.competition;
  $("date").value = state.date;
  $("label").value = state.label;
}
for (const role of ["away", "home"]) {
  for (const [field, key] of [["name", "name"], ["abbr", "abbr"], ["score", "score"], ["color", "color"], ["logo-url", "url"]]) {
    $(`${role}-${field}`).addEventListener("input", (event) => { state[role][key] = event.target.value; state.touched.add(`${role}.${key}`); change(); });
  }
}
for (const [id, key] of [["status-text", "statusText"], ["competition", "competition"], ["date", "date"], ["label", "label"]]) $(id).addEventListener("input", (event) => { state[key] = event.target.value; change(); });
$("swap").addEventListener("click", () => {
  [state.away, state.home] = [state.home, state.away];
  fillFields();
  change();
});

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
  for (const [group, keep_] of [["parkGroupMlb", (p) => p.league === "MLB"], ["parkGroupNpb", (p) => p.league === "NPB" && p.status === "current"], ["parkGroupOther", (p) => p.league === "NPB" && p.status !== "current"]]) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = say(group);
    for (const id of PARK_IDS) if (keep_(PARKS[id])) add(optgroup, id, name(PARKS[id]));
    select.append(optgroup);
  }
  select.value = state.park;
}
$("park").addEventListener("change", (event) => { state.park = event.target.value; change(); });

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
  for (const [key, value, base] of [["park", state.park, "generic"], ["size", state.size, "full"], ["orientation", state.orientation, "auto"], ["theme", state.theme, "auto"]]) {
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
    if (o.park) attrs.push(`park="${o.park}"`);
    if (o.size && o.size !== "full") attrs.push(`size="${o.size}"`);
    attrs.push(`orientation="${o.orientation}"`);
    if (o.language !== "en") attrs.push(`language="${o.language}"`);
    if (o.detail) attrs.push(`detail="${o.detail}"`);
    if (o.away) {
      for (const [role, t] of [["away", o.away], ["home", o.home]]) {
        attrs.push(`${role}="${escapeAttr(t.name)}"`, `${role}-abbr="${escapeAttr(t.abbr)}"`, `${role}-score="${escapeAttr(t.score)}"`, `${role}-color="${t.color}"`);
        if (t.logo) attrs.push(`${role}-logo="${escapeAttr(t.logo)}"`);
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
  return { name: language.lang === "ja" ? TEAMS_JA[FAMILIES[sport]][role] : base.name, abbr: base.abbr, color: base.color, logo: EMBLEMS[base.emblem], score };
};
const gameOf = (sport, extra = {}) => ({ sport, away: team(sport, "away", GAMES[sport].away), home: team(sport, "home", GAMES[sport].home), status: GAMES[sport].status, competition: GAMES[sport].competition, date: GAMES[sport].date, language: language.lang, style: "none", ...extra });

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
  courts: () =>
    ["maple", "twoTone", "night", "sunburst", "tournament"].map((theme) => {
      const names = TEAMS.basketball;
      return [gameOf("nba", { orientation: "auto", court: { ...COURT_THEMES[theme], baselineText: [names.away.name.toUpperCase(), names.home.name.toUpperCase()] } }), say(`court_${theme}`)];
    }),
};

function buildExamples() {
  for (const m of mounts) m.handle?.destroy();
  mounts.length = 0;
  for (const [id, key] of [["gallery-cards", "gallery"], ["side-cards", "sides"], ["compact-cards", "compact"], ["court-cards", "courts"]]) {
    const host = $(id);
    host.replaceChildren();
    for (const [options, caption] of examples[key]()) figure(host, options, caption);
  }
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
    tile.innerHTML = `${drawKyogijo({ sport: "mlb", park: id, orientation: "portrait", margin: 6, detail: "simple", stripes: false, style: "none", title: name })}<span class="park-name">${name.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span><span class="park-sub">${p.league} · ${p.status === "historic" ? (language.lang === "ja" ? "過去" : "past") : p.city}</span>`;
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

// ----- A change of language redraws the words that were drawn in it.
function onLanguage() {
  fillParks();
  if (!state.touched.has("away.name") && !state.touched.has("home.name")) {
    const family = FAMILIES[state.sport];
    for (const role of ["away", "home"]) state[role].name = language.lang === "ja" ? TEAMS_JA[family][role] : TEAMS[family][role].name;
    fillFields();
  }
  refreshSegs();
  buildExamples();
  drawLive();
  if (parksDrawn) drawParks();
  render();
}

// ----- Start.
applyTheme();
fillFields();
fillParks();
refreshSegs();
buildExamples();
drawLive();
render();
document.documentElement.dataset.kyogijoVersion = VERSION;
