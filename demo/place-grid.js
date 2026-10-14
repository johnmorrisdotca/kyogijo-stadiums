// The Ballparks and Soccer grounds sections of the demo: a short grid of cards, filters above it, a search that reads every name a place has
// (English, Japanese, its sponsors', former names and nicknames: the package's own `placesBy`), a count, and a "show all" that opens the rest.
//
// The default view is short: MLB parks in use today, or the grounds of the World Cup finals. The build (scripts/site.mjs) writes that very view
// into the HTML with `prerender`, so the page is whole before its script and nothing moves when it runs; the script takes over those nodes
// (see `data-first`). Which cards fit before "show all" is the stylesheet's (the `--cap` of `.parks` and the rules beside it): on a phone the
// cards run in one row that scrolls sideways, on a wider screen in two or three rows, and "show all" opens a grid of every card.
//
// The filters live in the address, under names of their own (`parkleague`, `parkstatus`, `parkera`, `parkq`, `parkall`; `groundgroup`,
// `groundcountry`, `groundq`, `groundall`), written only when they differ from the default, so the playground's `park` and `ground` and
// the atlas's `place` are not touched. This file reads nothing of the page when it is loaded: the build imports it to draw the first view.
import { GROUNDS, GROUND_IDS, PARKS, PARK_IDS, drawKyogijo } from "./dist/index.js";
import { placeById, placesBy } from "./dist/atlas-entry.js";

const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sentence = (say, key, values = {}) => say(key).replace(/\{(\w+)\}/g, (_, name) => String(values[name]));

const hasFinal = (ground) => ground.tournaments.some((t) => t.final);
const in2026 = (ground) => ground.tournaments.some((t) => t.competition === "world-cup" && t.year === 2026);
const groupOf = (ground) => (hasFinal(ground) ? "finals" : in2026(ground) ? "2026" : "clubs");

/** The decades in which at least one park was in use, from the first to the last. */
const DECADES = (() => {
  const places = PARK_IDS.map(placeById);
  const years = places.flatMap((p) => [p.from, p.to]).filter((y) => y !== undefined);
  const out = [];
  for (let d = Math.floor(Math.min(...years) / 10) * 10; d <= Math.floor(Math.max(...years, 2026) / 10) * 10; d += 10) out.push(d);
  return out;
})();
/** Whether a place was in use in some year of a decade (a year the data does not give does not shut it out). */
const inDecade = (place, decade) => (place.from === undefined || place.from <= decade + 9) && (place.to === undefined || place.to >= decade);

/** The country names of the grounds, in a language, in order. */
const countryNames = (codes, lang) => {
  let names = null;
  try { names = new Intl.DisplayNames([lang], { type: "region" }); } catch { /* the code stands for its name */ }
  return codes.map((code) => [code, names?.of(code) ?? code]).sort((a, b) => a[1].localeCompare(b[1], lang));
};
const GROUND_COUNTRIES = [...new Set(GROUND_IDS.map((id) => GROUNDS[id].country))];

const cardImage = (options) => drawKyogijo({ orientation: "portrait", margin: 6, detail: "simple", stripes: false, style: "none", ...options });

/**
 * What each section is: the cards (`ids`, in the order shown), the controls above them in order (`seg`: a choice of one among a few, as buttons;
 * `select`), the word for each value, and which place a value keeps. `def` is the value the page opens with.
 */
const KINDS = {
  parks: {
    kind: "park",
    prefix: "park",
    gridId: "park-grid",
    ids: PARK_IDS,
    item: (id) => ({ raw: PARKS[id], place: placeById(id) }),
    controls: [
      { key: "league", type: "seg", label: "atlasLeague", def: "mlb", values: () => ["all", "mlb", "npb"], text: (say, v) => (v === "all" ? say("atlasAll") : v.toUpperCase()), keeps: ({ raw }, v) => raw.league.toLowerCase() === v },
      { key: "status", type: "seg", label: "atlasStatus", def: "current", values: () => ["all", "current", "past"], text: (say, v) => say(v === "all" ? "atlasAll" : `atlasStatus_${v}`), keeps: ({ place }, v) => place.status === v },
      { key: "era", type: "select", label: "parksEra", def: "all", values: () => ["all", ...DECADES.map(String)], text: (say, v) => (v === "all" ? say("parksEraAll") : sentence(say, "parksEraDecade", { d: v })), keeps: ({ place }, v) => inDecade(place, Number(v)), shown: (state) => state.status !== "current" },
    ],
    words: { filter: "parksFilterLabel", search: "parksSearch", placeholder: "parksSearchPlaceholder", count: "parksCount", found: "parksFound", none: "parksNone", more: "parksMore" },
    card: (item, say, lang) => {
      const p = item.raw;
      const name = lang === "ja" && p.nameJa ? p.nameJa : p.name;
      const years = p.status === "past" ? (p.from !== undefined ? `${p.from}–${p.to}` : lang === "ja" ? "過去" : "past") : p.city;
      return { id: p.id, name, sub: `${p.league} · ${years}`, image: cardImage({ sport: "mlb", park: p.id, title: name }) };
    },
  },
  grounds: {
    kind: "ground",
    prefix: "ground",
    gridId: "ground-grid",
    ids: GROUND_IDS,
    item: (id) => ({ raw: GROUNDS[id], place: placeById(id) }),
    controls: [
      { key: "group", type: "seg", label: "groundsGroup", def: "finals", values: () => ["all", "finals", "2026", "clubs"], text: (say, v) => say(v === "all" ? "atlasAll" : `groundsGroup_${v}`), title: (say, v) => (v === "all" ? "" : say({ finals: "groundGroupFinals", 2026: "groundGroup2026", clubs: "groundGroupClubs" }[v])), keeps: ({ raw }, v) => groupOf(raw) === v },
      { key: "country", type: "select", label: "atlasCountry", def: "all", values: () => ["all", ...GROUND_COUNTRIES], text: (say, v, lang) => (v === "all" ? say("atlasCountryAll") : (countryNames([v], lang)[0][1])), sorted: (say, lang) => ["all", ...countryNames(GROUND_COUNTRIES, lang).map(([code]) => code)], keeps: ({ raw }, v) => raw.country === v },
    ],
    words: { filter: "groundsFilterLabel", search: "groundsSearch", placeholder: "groundsSearchPlaceholder", count: "groundsCount", found: "groundsFound", none: "groundsNone", more: "groundsMore" },
    card: (item, say, lang) => {
      const g = item.raw;
      const name = lang === "ja" ? g.nameJa : g.name;
      return { id: g.id, name, sub: g.city, image: cardImage({ sport: "soccer", ground: g.id, title: name }) };
    },
  },
};

const defaults = (cfg) => ({ ...Object.fromEntries(cfg.controls.map((c) => [c.key, c.def])), q: "", open: false });
const paramOf = (cfg, key) => `${cfg.prefix}${key === "open" ? "all" : key}`;

/** The state an address asks for: a value the section does not have is the default. */
export function readState(name, params) {
  const cfg = KINDS[name];
  const state = defaults(cfg);
  for (const c of cfg.controls) {
    const asked = params.get(paramOf(cfg, c.key));
    if (asked !== null && c.values().includes(asked)) state[c.key] = asked;
  }
  state.q = (params.get(paramOf(cfg, "q")) ?? "").slice(0, 60);
  state.open = params.get(paramOf(cfg, "open")) === "1";
  return state;
}

/** The address with this section's filters in it: only the ones that are not the default, and nothing of anything else changed. */
export function writeParams(name, state, params) {
  const cfg = KINDS[name];
  const base = defaults(cfg);
  for (const key of Object.keys(base)) {
    const param = paramOf(cfg, key);
    const value = key === "open" ? (state.open ? "1" : "") : state[key];
    if (value === "" || value === base[key]) params.delete(param);
    else params.set(param, value);
  }
  return params;
}

/** The ids of the cards a state shows. A search reads every park (or ground), whatever the filters say: they are off while it is typed. */
export function matching(name, state) {
  const cfg = KINDS[name];
  const query = state.q.trim();
  if (query !== "") {
    const found = new Set(placesBy({ kind: cfg.kind, text: query }).map((place) => place.id));
    return cfg.ids.filter((id) => found.has(id));
  }
  return cfg.ids.filter((id) => {
    const item = cfg.item(id);
    return cfg.controls.every((c) => state[c.key] === "all" || c.keeps(item, state[c.key]));
  });
}

const cards = new Map();
function cardHtml(name, id, say, lang) {
  const cfg = KINDS[name];
  const key = `${name}|${id}|${lang}`;
  let html = cards.get(key);
  if (html === undefined) {
    const one = cfg.card(cfg.item(id), say, lang);
    html = `<button type="button" class="park" data-${cfg.kind}="${escape(id)}" aria-label="${escape(`${one.name}, ${one.sub}`)}">${one.image}<span class="park-name">${escape(one.name)}</span><span class="park-sub">${escape(one.sub)}</span></button>`;
    cards.set(key, html);
  }
  return html;
}

const gridHtml = (name, ids, say, lang) => (ids.length === 0 ? `<p class="pf-empty">${escape(say(KINDS[name].words.none))}</p>` : ids.map((id) => cardHtml(name, id, say, lang)).join(""));
const total = (name) => KINDS[name].ids.length;
const countText = (name, state, n, say) => sentence(say, KINDS[name].words[state.q.trim() === "" ? "count" : "found"], { n, total: total(name) });
const atDefault = (name, state) => JSON.stringify(state) === JSON.stringify(defaults(KINDS[name]));

function controlHtml(name, c, state, say, lang) {
  const searching = state.q.trim() !== "";
  const label = say(c.label);
  const labelId = `${name}-${c.key}-label`;
  const values = c.sorted === undefined ? c.values() : c.sorted(say, lang);
  const hidden = c.shown !== undefined && !c.shown(state) ? " hidden" : "";
  const inner =
    c.type === "seg"
      ? `<div class="fam-seg" role="group" aria-labelledby="${labelId}" data-control="${c.key}" data-testid="${name}-${c.key}">${values.map((v) => `<button type="button" data-value="${escape(v)}" aria-pressed="${state[c.key] === v}"${searching ? " disabled" : ""}${c.title?.(say, v) ? ` title="${escape(c.title(say, v))}"` : ""}>${escape(c.text(say, v, lang))}</button>`).join("")}</div>`
      : `<select class="fam-field" aria-labelledby="${labelId}" data-control="${c.key}" data-testid="${name}-${c.key}"${searching ? " disabled" : ""}>${values.map((v) => `<option value="${escape(v)}"${state[c.key] === v ? " selected" : ""}>${escape(c.text(say, v, lang))}</option>`).join("")}</select>`;
  return `<div class="pf-field" data-field="${c.key}"${hidden}><span class="fam-label" id="${labelId}">${escape(label)}</span>${inner}</div>`;
}

/** The whole body of a section: the filters, the count, the grid and the button that opens the rest. */
export function bodyHtml(name, state, say, lang) {
  const cfg = KINDS[name];
  const ids = matching(name, state);
  return `<div class="pf" role="search" aria-label="${escape(say(cfg.words.filter))}">
  <div class="pf-bar">
    ${cfg.controls.map((c) => controlHtml(name, c, state, say, lang)).join("\n    ")}
    <label class="pf-field pf-search"><span class="fam-label">${escape(say(cfg.words.search))}</span><input class="fam-field" type="search" data-testid="${name}-search" value="${escape(state.q)}" placeholder="${escape(say(cfg.words.placeholder))}" autocomplete="off" maxlength="60" /></label>
  </div>
  <div class="pf-status"><output class="pf-count" data-testid="${name}-count" aria-live="polite">${escape(countText(name, state, ids.length, say))}</output><button type="button" class="fam-button pf-reset" data-testid="${name}-reset"${atDefault(name, state) ? " hidden" : ""}>${escape(say("gridReset"))}</button></div>
</div>
<div class="parks pf-grid" id="${cfg.gridId}" data-testid="${cfg.gridId}" data-open="${state.open}" data-n="${ids.length}">${gridHtml(name, ids, say, lang)}</div>
<div class="fam-actions pf-more"><button type="button" class="fam-button" data-testid="${name}-more" aria-expanded="${state.open}" aria-controls="${cfg.gridId}">${escape(state.open ? say("gridLess") : sentence(say, cfg.words.more, { n: ids.length }))}</button></div>`;
}

const signature = (state, lang) => JSON.stringify([state, lang]);

/** The section's first view, in English, as the build writes it into the page: the HTML for the inside of the section's `-body` element, and the mark that tells the script it is already there. */
export function prerender(name, say) {
  const state = defaults(KINDS[name]);
  return { attributes: `data-first="${escape(signature(state, "en"))}"`, html: bodyHtml(name, state, say, "en") };
}

/**
 * Bring a section to life. `say(key)` and `lang()` give the page's words and language; `onPick(kind, id)` opens a card in the playground.
 * Returns `relabel()` for a change of language.
 */
export function mountPlaceGrid(name, { say, lang, onPick }) {
  const cfg = KINDS[name];
  const root = document.getElementById(`${name}-body`);
  if (root === null) return { relabel() {} };
  const state = readState(name, new URLSearchParams(location.search));
  let shown = "";
  let ids = [];

  const grid = () => root.querySelector(".pf-grid");
  const cap = () => Number.parseInt(getComputedStyle(grid()).getPropertyValue("--cap"), 10) || 0;

  function syncMore() {
    const more = root.querySelector(".pf-more button");
    more.parentElement.hidden = ids.length <= cap();
  }

  /** Make the controls say what the state is. */
  function syncControls() {
    const searching = state.q.trim() !== "";
    for (const c of cfg.controls) {
      const field = root.querySelector(`[data-field="${c.key}"]`);
      field.hidden = c.shown !== undefined && !c.shown(state);
      if (c.type === "seg") {
        for (const button of field.querySelectorAll("button")) {
          button.setAttribute("aria-pressed", String(button.dataset.value === state[c.key]));
          button.disabled = searching;
        }
      } else {
        const select = field.querySelector("select");
        select.value = state[c.key];
        select.disabled = searching;
      }
    }
    root.querySelector(".pf-reset").hidden = atDefault(name, state);
  }

  /** Make the page say what the state is: the grid (only when its cards changed), the count, the button, and the address. */
  function update() {
    ids = matching(name, state);
    const key = `${ids.join()}|${lang()}`;
    const g = grid();
    if (key !== shown) {
      g.innerHTML = gridHtml(name, ids, say, lang());
      shown = key;
    }
    g.dataset.open = String(state.open);
    g.dataset.n = String(ids.length);
    root.querySelector("[data-testid$='-count']").textContent = countText(name, state, ids.length, say);
    const more = root.querySelector(".pf-more button");
    more.setAttribute("aria-expanded", String(state.open));
    more.textContent = state.open ? say("gridLess") : sentence(say, cfg.words.more, { n: ids.length });
    syncControls();
    syncMore();
    const q = writeParams(name, state, new URLSearchParams(location.search));
    const query = q.toString();
    history.replaceState(history.state, "", `${location.pathname}${query === "" ? "" : `?${query}`}${location.hash}`);
  }

  /** Draw the whole body again (the first time when the page does not hold this view already, and when the language changes). */
  function draw() {
    root.innerHTML = bodyHtml(name, state, say, lang());
    shown = `${matching(name, state).join()}|${lang()}`;
    ids = matching(name, state);
    syncMore();
  }

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target === null) return;
    const card = target.closest(".park");
    if (card !== null && root.contains(card)) return onPick(cfg.kind, card.dataset[cfg.kind]);
    const button = target.closest("[data-control] button");
    if (button !== null) {
      state[button.closest("[data-control]").dataset.control] = button.dataset.value;
      state.open = false;
      return update();
    }
    if (target.closest(".pf-reset") !== null) {
      Object.assign(state, defaults(cfg));
      root.querySelector("input[type=search]").value = "";
      return update();
    }
    if (target.closest(".pf-more button") !== null) {
      state.open = !state.open;
      update();
    }
  });
  root.addEventListener("change", (event) => {
    const select = event.target instanceof Element ? event.target.closest("select[data-control]") : null;
    if (select === null) return;
    state[select.dataset.control] = select.value;
    state.open = false;
    update();
  });
  root.addEventListener("input", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    state.q = event.target.value;
    state.open = false;
    update();
  });
  let frame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(syncMore);
  });

  // The view the build wrote is the one to keep, if it is the one asked for; otherwise draw the one asked for.
  if (root.dataset.first === signature(state, lang())) {
    shown = `${matching(name, state).join()}|${lang()}`;
    ids = matching(name, state);
    syncMore();
  } else draw();
  root.removeAttribute("data-first");
  root.dataset.ready = "true";
  return {
    relabel() {
      draw();
    },
  };
}
