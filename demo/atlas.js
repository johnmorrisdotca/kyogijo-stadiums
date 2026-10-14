// The demo's Atlas: a world map (chizu) with a marker on every ballpark and soccer ground, filters, a list that does everything the
// markers do (so a keyboard or a screen reader needs no marker), and the chosen place's surface drawn beside it by kyogijo.
// The map's modules are chizu's own (copied into ./chizu by `pnpm site`) and the places are the package's `atlas` entry.
import { GROUNDS, drawKyogijo } from "./dist/index.js";
import { PLACES, atlasFacets, hallSurfaces, officialName, placeById, placesBy, plainName, surfaceOf, surfacesOf } from "./dist/atlas-entry.js";
import { ATLAS_MARK_STYLE, markIcon, markSvg } from "./atlas-marks.js";

const $ = (id) => document.getElementById(id);
// The words of the leagues that have a name in Japanese other than the one they go by in English; any other league is shown by its name as the data gives it.
const LEAGUES = {
  MLB: "atlasLeague_mlb", NPB: "atlasLeague_npb", "FIFA World Cup": "atlasLeague_wc", "FIFA Women's World Cup": "atlasLeague_wwc",
  "Premier League": "atlasLeague_pl", "La Liga": "atlasLeague_laliga", "Serie A": "atlasLeague_seriea", Bundesliga: "atlasLeague_bundesliga", "Ligue 1": "atlasLeague_ligue1",
  "J1 League": "atlasLeague_j1", "J2 League": "atlasLeague_j2", "Liga MX": "atlasLeague_ligamx", "K League 1": "atlasLeague_k1", "Chinese Super League": "atlasLeague_csl",
  Eredivisie: "atlasLeague_eredivisie", "Primeira Liga": "atlasLeague_primeira", "Scottish Premiership": "atlasLeague_scottish", "Negro leagues": "atlasLeague_negro",
};
/** The leagues and tournaments a visitor looks for first: the rest follow, past and present. */
const MAIN_LEAGUES = ["MLB", "NPB", "NFL", "CFL", "NBA", "NHL", "MLS", "FIFA World Cup", "FIFA Women's World Cup"];
/** The words that name a surface a place offers, by the key `surfaceKey` gives it. */
const SURFACE_WORDS = { mlb: "atlasSurface_mlb", soccer: "atlasSurface_soccer", nfl: "atlasSurface_nfl", cfl: "atlasSurface_cfl", nba: "atlasSurface_nba", nhl: "atlasSurface_nhl", rugby: "atlasSurface_rugby", "rugby-nrl": "atlasSurface_nrl", afl: "atlasSurface_afl", cricket: "atlasSurface_cricket" };
const surfaceKey = (surface) => (surface.league === undefined ? surface.sport : `${surface.sport}-${surface.league}`);
const DEFAULT_YEAR = 1950;
const FIRST = "fenway-park";

/** Set up the atlas. `say(key)` and `lang()` give the page's words and language; `onTry(place, surface)` opens a place's surface in the playground. */
export async function initAtlas({ say, lang, onTry }) {
  const host = $("atlas-map");
  if (host === null) return { relabel() {} };
  const style = document.createElement("style");
  style.textContent = ATLAS_MARK_STYLE;
  document.head.append(style);

  const [{ default: WORLD }, { mountChizu }, { projectPoint, wrapOffsets }] = await Promise.all([import("./chizu/world-entry.js"), import("./chizu/mount-entry.js"), import("./chizu/index.js")]);
  const facets = atlasFacets();
  const lastYear = Math.max(facets.years.max, 2026);
  const params = new URLSearchParams(location.search);
  const asked = placeById(params.get("place") ?? undefined);
  const state = { sport: "all", status: "all", league: "all", country: "all", text: "", yearOn: false, year: DEFAULT_YEAR, selected: asked?.id ?? FIRST };

  const sentence = (key, values) => say(key).replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
  const regionNames = () => { try { return new Intl.DisplayNames([lang()], { type: "region" }); } catch { return null; } };
  const countryName = (code) => regionNames()?.of(code) ?? code;
  const nameOf = (place) => (lang() === "ja" && place.nameJa ? place.nameJa : place.name);
  /** The other names of a place in the page's language: the official name, then the sponsors', former and nicknames, without repeating the one that is shown. */
  const otherNames = (place) => {
    const language = lang() === "ja" ? "ja" : "en";
    const shown = nameOf(place);
    const official = officialName(place, language) ?? null;
    const seen = new Set([plainName(shown), ...(official === null ? [] : [plainName(official)])]);
    const also = [];
    for (const alias of place.aliases) {
      if (alias.lang !== language || alias.kind === "wikipedia" || alias.kind === "official") continue;
      const key = plainName(alias.name);
      if (!seen.has(key)) {
        seen.add(key);
        also.push(alias.name);
      }
    }
    return { official, also: also.slice(0, 6) };
  };
  const yearsOf = (place) => {
    if (place.from !== undefined && place.to !== undefined) return place.from === place.to ? sentence("atlasYearOne", { from: place.from }) : sentence("atlasYears", { from: place.from, to: place.to });
    if (place.from !== undefined) return sentence("atlasSince", { from: place.from });
    if (place.to !== undefined) return sentence("atlasUntil", { to: place.to });
    return "";
  };
  const leagueName = (name) => (LEAGUES[name] === undefined ? name : say(LEAGUES[name]));

  // ----- The map.
  const mount = mountChizu(host, { map: WORLD, language: lang(), selectable: false });
  const stage = host.querySelector(".czm-stage");
  // The map names itself for a screen reader (chizu does, in the page's language); the hint says what the list is for.
  stage.setAttribute("aria-describedby", "atlas-hint");
  const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.setAttribute("class", "atlas-overlay");
  overlay.setAttribute("preserveAspectRatio", "none");
  overlay.setAttribute("aria-hidden", "true");
  const tip = document.createElement("div");
  tip.className = "atlas-tip";
  tip.hidden = true;
  tip.setAttribute("aria-hidden", "true");
  host.append(tip);

  let shown = [];
  let box = { x: 0, y: 0, width: WORLD.width, height: WORLD.height };
  let lastKey = "";
  const at = new Map();
  for (const place of PLACES) {
    const xy = projectPoint(WORLD, place.lon, place.lat);
    if (xy !== null) at.set(place.id, xy);
  }
  const coarse = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

  /** Put the markers where the map is looking now. */
  function syncOverlay(force = false) {
    const svg = stage.querySelector("svg:not(.atlas-overlay)");
    if (svg === null) return;
    if (overlay.parentNode !== stage) stage.append(overlay);
    const view = svg.viewBox.baseVal;
    box = { x: view.x, y: view.y, width: view.width, height: view.height };
    overlay.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
    const unit = box.width / (stage.clientWidth || 640);
    const offsets = wrapOffsets(box, WORLD.width);
    const key = [unit.toFixed(4), offsets.join(","), shown.map((p) => p.id).join(","), state.selected].join("|");
    if (force || key !== lastKey) {
      lastKey = key;
      const r = coarse() ? 6.5 : 5;
      const marks = [];
      // What is in use today is drawn over what is past, and the chosen place last.
      const ordered = [...shown].sort((a, b) => (a.status === b.status ? 0 : a.status === "past" ? -1 : 1));
      const chosen = ordered.find((p) => p.id === state.selected);
      for (const place of chosen ? [...ordered.filter((p) => p !== chosen), chosen] : ordered) {
        const xy = at.get(place.id);
        if (xy === undefined) continue;
        for (const offset of offsets) marks.push(markSvg(place, xy[0] + offset, xy[1], { r, unit, selected: place === chosen }));
      }
      overlay.innerHTML = marks.join("");
    }
    observer.takeRecords();
  }
  // The map redraws itself on a zoom (replacing what is in the stage) and moves by its viewBox on a drag: follow both.
  const observer = new MutationObserver((records) => {
    if (records.every((r) => overlay.contains(r.target) || r.target === overlay)) return;
    syncOverlay();
  });
  observer.observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ["viewBox"] });
  new ResizeObserver(() => syncOverlay()).observe(stage);

  /** The shown place nearest a point of the stage, within reach of a finger or a pointer. */
  function nearest(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0) return null;
    const reach = coarse() ? 22 : 12;
    let best = null;
    let bestDistance = reach;
    for (const place of shown) {
      const xy = at.get(place.id);
      if (xy === undefined) continue;
      for (const offset of wrapOffsets(box, WORLD.width)) {
        const dx = ((xy[0] + offset - box.x) / box.width) * rect.width + rect.left - clientX;
        const dy = ((xy[1] - box.y) / box.height) * rect.height + rect.top - clientY;
        const distance = Math.hypot(dx, dy);
        if (distance < bestDistance) { best = place; bestDistance = distance; }
      }
    }
    return best;
  }
  let down = null;
  stage.addEventListener("pointerdown", (event) => { down = { x: event.clientX, y: event.clientY }; }, true);
  stage.addEventListener("click", (event) => {
    if (event.target.closest(".czm-controls")) return;
    if (down !== null && Math.abs(event.clientX - down.x) + Math.abs(event.clientY - down.y) > 8) return;
    const place = nearest(event.clientX, event.clientY);
    if (place !== null) choose(place.id, { frame: false });
  });
  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || event.buttons !== 0) { tip.hidden = true; return; }
    const place = nearest(event.clientX, event.clientY);
    stage.style.cursor = place === null ? "" : "pointer";
    if (place === null) { tip.hidden = true; return; }
    const rect = host.getBoundingClientRect();
    tip.textContent = nameOf(place);
    tip.hidden = false;
    tip.style.left = `${Math.min(event.clientX - rect.left + 12, rect.width - tip.offsetWidth - 4)}px`;
    tip.style.top = `${Math.max(event.clientY - rect.top - 30, 4)}px`;
  });
  stage.addEventListener("pointerleave", () => { tip.hidden = true; });

  // ----- The controls.
  const segs = {};
  /** A choice of one among a few, as buttons that say which is on. */
  function makeSeg(id, values, labelOf, get, set) {
    const group = $(id);
    segs[id] = { group, values, labelOf, get };
    group.replaceChildren();
    for (const value of values) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.value = value;
      button.addEventListener("click", () => { set(value); refresh(); });
      group.append(button);
    }
  }
  makeSeg("atlas-sport", ["all", "baseball", "soccer", "budo"], (v) => say(v === "all" ? "atlasAll" : `atlasSport_${v}`), () => state.sport, (v) => { state.sport = v; });
  makeSeg("atlas-status", ["all", "current", "past"], (v) => say(v === "all" ? "atlasAll" : `atlasStatus_${v}`), () => state.status, (v) => { state.status = v; });

  function fillSelects() {
    const league = $("atlas-league");
    league.replaceChildren(new Option(say("atlasLeagueAll"), "all"));
    const main = facets.leagues.filter((name) => MAIN_LEAGUES.includes(name)).sort((a, b) => MAIN_LEAGUES.indexOf(a) - MAIN_LEAGUES.indexOf(b));
    const rest = facets.leagues.filter((name) => !MAIN_LEAGUES.includes(name)).sort((a, b) => leagueName(a).localeCompare(leagueName(b), lang()));
    for (const [label, names] of [["atlasLeagueMain", main], ["atlasLeagueOther", rest]]) {
      if (names.length === 0) continue;
      const group = document.createElement("optgroup");
      group.label = say(label);
      for (const name of names) group.append(new Option(leagueName(name), name));
      league.append(group);
    }
    league.value = state.league;
    const country = $("atlas-country");
    country.replaceChildren(new Option(say("atlasCountryAll"), "all"));
    const names = facets.countries.map((code) => [code, countryName(code)]).sort((a, b) => a[1].localeCompare(b[1], lang()));
    for (const [code, name] of names) country.append(new Option(name, code));
    country.value = state.country;
  }
  $("atlas-league").addEventListener("change", (event) => { state.league = event.target.value; refresh(); });
  $("atlas-country").addEventListener("change", (event) => {
    const before = state.country;
    state.country = event.target.value;
    refresh();
    if (state.country !== "all") mount.show([state.country]);
    else if (before !== "all") mount.reset();
  });
  $("atlas-search").addEventListener("input", (event) => { state.text = event.target.value; refresh(); });
  const slider = $("atlas-year");
  slider.min = String(facets.years.min);
  slider.max = String(lastYear);
  $("atlas-year-on").addEventListener("click", () => { state.yearOn = !state.yearOn; refresh(); });
  slider.addEventListener("input", (event) => { state.year = Number(event.target.value); refresh(); });
  $("atlas-reset").addEventListener("click", () => {
    const framed = state.country !== "all";
    Object.assign(state, { sport: "all", status: "all", league: "all", country: "all", text: "", yearOn: false, year: DEFAULT_YEAR });
    $("atlas-search").value = "";
    refresh();
    if (framed) mount.reset();
  });

  function labels() {
    for (const seg of Object.values(segs)) {
      for (const button of seg.group.children) {
        button.textContent = seg.labelOf(button.dataset.value);
        button.setAttribute("aria-pressed", String(seg.get() === button.dataset.value));
      }
    }
    $("atlas-year-on").setAttribute("aria-pressed", String(state.yearOn));
    $("atlas-year-on").textContent = say(state.yearOn ? "atlasYearOn" : "atlasYearOff");
    slider.disabled = !state.yearOn;
    slider.value = String(state.year);
    $("atlas-year-out").textContent = state.yearOn ? String(state.year) : "";
    $("atlas-search").placeholder = say("atlasSearchPlaceholder");
    $("atlas-list").setAttribute("aria-label", say("atlasListLabel"));
    // The key: the sport by colour and by the dot, the status by shape.
    $("atlas-key").replaceChildren(...[["baseball", "current", "atlasKeyBaseball"], ["soccer", "current", "atlasKeySoccer"], ["budo", "current", "atlasKeyBudo"], ["baseball", "current", "atlasKeyCurrent"], ["baseball", "past", "atlasKeyPast"]].map(([sport, status, key]) => {
      const item = document.createElement("li");
      item.innerHTML = markIcon({ id: "", sport, status }, 16);
      item.append(document.createTextNode(` ${say(key)}`));
      return item;
    }));
    $("atlas-hint").textContent = say("atlasHint");
  }

  // ----- The list and the detail.
  const filter = () => ({
    ...(state.sport === "all" ? {} : { sport: state.sport }),
    ...(state.status === "all" ? {} : { status: state.status }),
    ...(state.league === "all" ? {} : { league: state.league }),
    ...(state.country === "all" ? {} : { country: state.country }),
    ...(state.text.trim() === "" ? {} : { text: state.text }),
    ...(state.yearOn ? { year: state.year } : {}),
  });

  function renderList() {
    const list = $("atlas-list");
    const focused = list.contains(document.activeElement) ? document.activeElement.dataset.id : null;
    const sorted = [...shown].sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang()));
    const tab = sorted.some((p) => p.id === state.selected) ? state.selected : sorted[0]?.id;
    list.replaceChildren(...sorted.map((place) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "atlas-item";
      button.dataset.id = place.id;
      button.setAttribute("aria-pressed", String(place.id === state.selected));
      button.tabIndex = place.id === tab ? 0 : -1;
      const years = yearsOf(place);
      button.innerHTML = `${markIcon(place, 18)}<span class="atlas-item-text"><span class="atlas-item-name"></span><span class="atlas-item-sub"></span></span>`;
      button.querySelector(".atlas-item-name").textContent = nameOf(place);
      button.querySelector(".atlas-item-sub").textContent = [`${place.city}, ${countryName(place.country)}`, years].filter(Boolean).join(" · ");
      button.addEventListener("click", () => choose(place.id, { frame: true, scroll: true }));
      item.append(button);
      return item;
    }));
    if (sorted.length === 0) list.append(Object.assign(document.createElement("li"), { className: "atlas-empty", textContent: say("atlasNone") }));
    if (focused !== null) list.querySelector(`[data-id="${CSS.escape(focused)}"]`)?.focus();
  }
  $("atlas-list").addEventListener("keydown", (event) => {
    const keys = { ArrowDown: 1, ArrowUp: -1, Home: -Infinity, End: Infinity };
    if (!(event.key in keys) || !(event.target instanceof HTMLButtonElement)) return;
    const buttons = [...$("atlas-list").querySelectorAll("button")];
    const next = Math.max(0, Math.min(buttons.length - 1, Number.isFinite(keys[event.key]) ? buttons.indexOf(event.target) + keys[event.key] : keys[event.key] < 0 ? 0 : buttons.length));
    event.preventDefault();
    for (const button of buttons) button.tabIndex = button === buttons[next] ? 0 : -1;
    buttons[next].focus();
  });

  const coordinate = (degrees, plus, minus) => `${Math.abs(degrees).toFixed(4)}° ${degrees >= 0 ? plus : minus}`;
  function renderDetail() {
    const place = placeById(state.selected);
    const box_ = $("atlas-detail");
    if (place === undefined) {
      box_.replaceChildren(Object.assign(document.createElement("p"), { className: "atlas-pick", textContent: say("atlasPick") }));
      return;
    }
    const options = { ...surfaceOf(place), size: "surface", orientation: "landscape", style: "none", language: lang() };
    if (place.kind === "park" && state.yearOn) options.year = state.year;
    const ground = place.kind === "ground" ? GROUNDS[place.id] : undefined;
    const others = otherNames(place);
    const rows = [
      ["atlasPlace", `${place.city}, ${countryName(place.country)}`],
      others.official === null ? null : ["atlasOfficial", others.official],
      others.also.length === 0 ? null : ["atlasAlso", others.also.join(lang() === "ja" ? "、" : ", ")],
      ["atlasInUse", [say(`atlasStatus_${place.status}`), yearsOf(place)].filter(Boolean).join(" · ")],
      place.team === undefined ? null : ["atlasTeam", place.team],
      place.leagues.length === 0 ? null : ["atlasLeagues", place.leagues.map(leagueName).join(lang() === "ja" ? "、" : ", ")],
      ground === undefined ? null : ["atlasPitch", `${ground.pitch.length} × ${ground.pitch.width} m${ground.pitchSize === "default" ? (lang() === "ja" ? `（${say("atlasPitchDefault")}）` : ` (${say("atlasPitchDefault")})`) : ""}`],
      ["atlasCoordinates", `${coordinate(place.lat, "N", "S")}, ${coordinate(place.lon, "E", "W")}`],
    ].filter(Boolean);
    const surfaces = surfacesOf(place);
    // A hall (the Kodokan, the Budokan) has several floors, each with a name and a note of what a source gives and what is drawn as plausible.
    const floors = place.kind === "hall" ? hallSurfaces(place) : [];
    box_.innerHTML = `<div class="fam-felt atlas-surface" data-testid="atlas-surface">${drawKyogijo(options)}</div>
      <h3 class="atlas-name"></h3>
      <dl class="atlas-facts">${rows.map(([key]) => `<div><dt>${key}</dt><dd></dd></div>`).join("")}</dl>
      ${floors.length === 0 ? "" : '<ul class="atlas-tenants atlas-floors" data-testid="atlas-floors"></ul>'}
      ${place.tenants.length === 0 ? "" : '<h4 class="atlas-tenants-title"></h4><ul class="atlas-tenants" data-testid="atlas-tenants"></ul>'}
      <div class="fam-actions"><button type="button" class="fam-button" data-primary="true" id="atlas-try" data-testid="atlas-try"></button><a class="atlas-link" target="_blank" rel="noopener"></a></div>
      ${surfaces.length < 2 ? "" : '<div class="fam-actions atlas-also" data-testid="atlas-also"><span class="atlas-also-label"></span></div>'}`;
    box_.querySelector(".atlas-name").textContent = nameOf(place);
    box_.querySelectorAll(".atlas-facts > div").forEach((row, i) => {
      row.querySelector("dt").textContent = say(rows[i][0]);
      row.querySelector("dd").textContent = rows[i][1];
    });
    if (floors.length > 0) {
      box_.querySelector(".atlas-floors").replaceChildren(...floors.map((floor) => {
        const item = document.createElement("li");
        item.dataset.basis = floor.basis;
        const name = document.createElement("span");
        name.className = "atlas-tenant-name";
        name.textContent = floor.name[lang() === "ja" ? "ja" : "en"];
        const meta = document.createElement("span");
        meta.className = "atlas-tenant-meta";
        meta.textContent = floor.note[lang() === "ja" ? "ja" : "en"];
        item.append(name, " ", meta);
        return item;
      }));
    }
    // The clubs that played there, the current ones first, each with its league and the years it was there.
    if (place.tenants.length > 0) {
      box_.querySelector(".atlas-tenants-title").textContent = say("atlasTenants");
      box_.querySelector(".atlas-tenants").replaceChildren(...place.tenants.map((tenant) => {
        const item = document.createElement("li");
        item.dataset.current = String(tenant.to === undefined);
        const name = document.createElement("span");
        name.className = "atlas-tenant-name";
        name.textContent = lang() === "ja" && tenant.clubJa ? tenant.clubJa : tenant.club;
        const meta = document.createElement("span");
        meta.className = "atlas-tenant-meta";
        meta.textContent = [leagueName(tenant.league), yearsOf(tenant)].filter(Boolean).join(" · ");
        item.append(name, " ", meta);
        return item;
      }));
    }
    const link = box_.querySelector(".atlas-link");
    link.href = `https://www.wikidata.org/wiki/${place.wikidata}`;
    link.textContent = `Wikidata ${place.wikidata}`;
    box_.querySelector("#atlas-try").textContent = say("atlasTry");
    box_.querySelector("#atlas-try").addEventListener("click", () => onTry(place, surfaces[0]));
    // A place that more than one sport played in offers the others' surfaces too.
    const also = box_.querySelector(".atlas-also");
    if (also !== null) {
      also.querySelector(".atlas-also-label").textContent = say("atlasTryAlso");
      surfaces.forEach((surface, k) => {
        if (k === 0) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "fam-button";
        button.dataset.testid = `atlas-try-${floors.length > 0 ? floors[k].id : surfaceKey(surface)}`;
        button.textContent = floors.length > 0 ? floors[k].name[lang() === "ja" ? "ja" : "en"] : say(SURFACE_WORDS[surfaceKey(surface)]);
        button.addEventListener("click", () => onTry(place, surface));
        also.append(button);
      });
    }
  }

  /** Choose a place; from the list the map goes to its country, from the map it stays where it is. */
  function choose(id, { frame = false, scroll = false } = {}) {
    const place = placeById(id);
    if (place === undefined) return;
    state.selected = id;
    const q = new URLSearchParams(location.search);
    q.set("place", id);
    history.replaceState(history.state, "", `${location.pathname}?${q.toString()}${location.hash}`);
    for (const button of $("atlas-list").querySelectorAll(".atlas-item")) {
      button.setAttribute("aria-pressed", String(button.dataset.id === id));
      button.tabIndex = button.dataset.id === id ? 0 : -1;
    }
    renderDetail();
    syncOverlay(true);
    if (frame) mount.show([place.country]);
    if (scroll) $("atlas-detail").scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function refresh() {
    shown = placesBy(filter());
    labels();
    $("atlas-count").textContent = sentence("atlasCount", { n: shown.length, total: PLACES.length });
    renderList();
    syncOverlay(true);
  }

  function relabel() {
    mount.set({ language: lang() });
    fillSelects();
    refresh();
    renderDetail();
  }

  fillSelects();
  refresh();
  renderDetail();
  syncOverlay(true);
  if (asked !== undefined) mount.show([asked.country]);
  host.dataset.atlas = "ready";
  return { relabel, choose, state };
}
