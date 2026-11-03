// The playground's surface picker: a row of kinds (field, court, ice, pool, track, the budō, mats and rings), then the sports of the kind chosen,
// A to Z in the page's language, then, for a sport whose rulebooks are surfaces of their own (the NFL's, the CFL's and the IFAF's football fields),
// a small row of those. Kind, then sport, on one screen: no list of every surface, and nothing folds open.
//
// The address still names the surface (`?sport=cfl`): the kind and the sport are worked out from it, and a choice writes it. The first part of
// this file is plain data and pure functions (the tests and the page's build use them); the last part takes the picker over in the page.
import { loadGames } from "./game.js";

/** The kinds, in the order the row shows them. */
export const SURFACE_KINDS = ["field", "court", "ice", "pool", "track", "budo", "ring"];

/**
 * The kind of each surface, by what it is played on. A table tennis table and a teqball table stand on a court's floor, and handball is played on a
 * court, though the gallery lists it with the field sports. The budō (judo, karate, kendo, sumo, kyūdō and the dojo) are one kind, as the package's
 * own page has them (docs/budo.md): a tatami area, a wooden floor, a clay ring, a range and a hall of mats are not fields or courts. The mats and
 * rings are the combat sports' (docs/combat.md): the MMA cage, the boxing ring, the wrestling mat and the professional wrestling ring.
 */
const KIND_OF = {
  nfl: "field", cfl: "field", ifaf: "field", mlb: "field", soccer: "field", lacrosse: "field", rugby: "field", afl: "field", gaelic: "field", cricket: "field", fieldhockey: "field",
  nba: "court", tennis: "court", volleyball: "court", badminton: "court", pickleball: "court", tabletennis: "court", padel: "court", squash: "court", racquetball: "court", sepaktakraw: "court", teqball: "court", roundnet: "court", netball: "court", handball: "court",
  nhl: "ice", curling: "ice", skating: "ice",
  swimming: "pool", waterpolo: "pool", diving: "pool", artisticswimming: "pool",
  athletics: "track",
  judo: "budo", karate: "budo", kendo: "budo", sumo: "budo", kyudo: "budo", dojo: "budo",
  mma: "ring", boxing: "ring", wrestling: "ring", prowrestling: "ring",
};

/** A sport whose rulebooks are surfaces of their own: one chip in the sport row, and its surfaces in a row under it, in the package's order (the sport's own first). */
export const SURFACE_GROUPS = { football: ["nfl", "cfl", "ifaf"] };

/** The word a chip of the sport row says, where it is not the surface's own (`sport_nhl` says NHL, which a list of sports calls ice hockey). */
const CHIP_WORDS = { football: "surfaceSport_football", nhl: "surfaceSport_nhl", nba: "surfaceSport_nba" };

/**
 * How a Japanese name written in kanji is read, so that the sports sort as a Japanese reader looks them up (by sound, in gojūon order); a name
 * in kana is its own reading. A test holds every name in kanji to having one here.
 */
export const READING_JA = {
  mlb: "やきゅう", tabletennis: "たっきゅう", swimming: "きょうえい", waterpolo: "すいきゅう", diving: "とびこみ", athletics: "りくじょうきょうぎ",
  judo: "じゅうどう", karate: "からて", kendo: "けんどう", sumo: "すもう", kyudo: "きゅうどう", dojo: "どうじょう", mma: "そうごうかくとうぎ",
};

/** The kind a surface is in (undefined for one the table does not have). */
export const kindOf = (sport) => KIND_OF[sport];
/** The group a surface is in, or null. */
export const groupOf = (sport) => Object.keys(SURFACE_GROUPS).find((group) => SURFACE_GROUPS[group].includes(sport)) ?? null;

/**
 * The chips of the sport row, in the order of `sports`: one per surface, and one per group in the place of its first surface.
 * @param {readonly string[]} sports
 * @returns {{ id: string, kind: string, surfaces: string[], word: string }[]}
 */
export function sportChips(sports) {
  const out = [];
  for (const sport of sports) {
    const group = groupOf(sport);
    if (group !== null && out.some((chip) => chip.id === group)) continue;
    const id = group ?? sport;
    out.push({ id, kind: KIND_OF[sport], surfaces: group === null ? [sport] : SURFACE_GROUPS[group].filter((one) => sports.includes(one)), word: CHIP_WORDS[id] ?? `sport_${sport}` });
  }
  return out;
}

const collators = {};
const collatorFor = (lang) => (collators[lang] ??= new Intl.Collator(lang === "ja" ? "ja" : "en", { sensitivity: "base", numeric: true }));
/** What a chip is sorted by: its name, or in Japanese the reading of a name in kanji. */
const sortKey = (chip, say, lang) => (lang === "ja" ? (READING_JA[chip.id] ?? say(chip.word)) : say(chip.word));

/**
 * The chips of every kind, kind by kind in the row's order, each kind's A to Z by the name shown in `lang` (`say` gives a word in that language).
 * @param {readonly string[]} sports
 * @param {(key: string) => string} say
 * @param {"en" | "ja"} lang
 */
export function orderedChips(sports, say, lang) {
  const chips = sportChips(sports);
  const collator = collatorFor(lang);
  return SURFACE_KINDS.flatMap((kind) => chips.filter((chip) => chip.kind === kind).sort((a, b) => collator.compare(sortKey(a, say, lang), sortKey(b, say, lang)) || a.id.localeCompare(b.id)));
}

/** What the picker shows for a surface: its kind, its chip in the sport row and, for a group, the surface in the row under it. */
export function choiceOf(sport) {
  const group = groupOf(sport);
  return { kind: KIND_OF[sport], chip: group ?? sport, variant: group === null ? null : sport };
}
/** The surface a choice names: a group's chip is its first surface unless the one asked is in it. */
export function surfaceOf(choice) {
  const surfaces = SURFACE_GROUPS[choice.chip];
  if (surfaces === undefined) return choice.chip;
  return surfaces.includes(choice.variant) ? choice.variant : surfaces[0];
}

// ----- The markup, as the page's build writes it (English) and the page's script keeps it.

const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** The small mark of a surface that has an example game: a play sign for the eye and its words for a screen reader. */
const markHtml = (say, on) => `<span class="sk-game" data-testid="surface-game" data-say-title="surfaceGame" title="${escape(say("surfaceGame"))}"${on ? "" : " hidden"}><svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false"><path d="M2 1.5 8.5 5 2 8.5Z" fill="currentColor"/></svg><span class="fam-sr" data-say="surfaceGame">${escape(say("surfaceGame"))}</span></span>`;
const radio = (attrs, checked, label) => `<button type="button" role="radio" ${attrs} aria-checked="${checked}" tabindex="${checked ? 0 : -1}">${label}</button>`;

/**
 * The picker's markup for a surface: the three rows, every chip of every kind in the page with those of the other kinds hidden, and the mark on the
 * surfaces that `games` (the surface keys of the example games) names.
 * @param {readonly string[]} sports
 * @param {string} sport
 * @param {(key: string) => string} say
 * @param {readonly string[]} games
 */
export function pickerHtml(sports, sport, say, games = []) {
  const { kind, chip: on, variant } = choiceOf(sport);
  const hasGame = (surfaces) => surfaces.some((one) => games.includes(one));
  const kinds = SURFACE_KINDS.map((one) => radio(`data-kind="${one}"`, one === kind, `<span data-say="surfaceKind_${one}">${escape(say(`surfaceKind_${one}`))}</span>`)).join("");
  const chips = orderedChips(sports, say, "en").map((chip) => {
    const attrs = `data-kind="${chip.kind}" data-chip="${chip.id}" data-surfaces="${chip.surfaces.join(" ")}"${chip.surfaces.length === 1 ? ` data-value="${chip.id}"` : ""}${chip.kind === kind ? "" : " hidden"}`;
    return radio(attrs, chip.id === on, `<span data-say="${chip.word}">${escape(say(chip.word))}</span>${markHtml(say, hasGame(chip.surfaces))}`);
  }).join("");
  const variants = Object.entries(SURFACE_GROUPS).flatMap(([group, surfaces]) => surfaces.filter((one) => sports.includes(one)).map((one) => radio(`data-group="${group}" data-value="${one}"${group === on ? "" : " hidden"}`, one === variant, `<span data-say="sport_${one}">${escape(say(`sport_${one}`))}</span>${markHtml(say, games.includes(one))}`))).join("");
  return `<div class="sk-picker" id="sport" data-testid="sport">`
    + `<div class="fam-seg sk-row sk-kinds" role="radiogroup" id="surface-kinds" data-testid="surface-kinds" data-say-label="surfaceKinds" aria-label="${escape(say("surfaceKinds"))}">${kinds}</div>`
    + `<div class="fam-seg sk-row sk-sports" role="radiogroup" id="surface-sports" data-testid="surface-sports" data-say-label="sport" aria-label="${escape(say("sport"))}">${chips}</div>`
    + `<div class="fam-seg sk-row sk-variants" role="radiogroup" id="surface-variants" data-testid="surface-variants" data-say-label="surfaceVariant" aria-label="${escape(say("surfaceVariant"))}"${variant === null ? " hidden" : ""}>${variants}</div>`
    + `</div>`;
}

// ----- The picker in the page.

/** Check one radio of a row, or none, with the tab stop on it (on the first shown when none is checked). */
function checkRow(row, isOn) {
  const shown = [...row.children].filter((button) => !button.hidden);
  let stop = null;
  for (const button of row.children) {
    const on = !button.hidden && isOn(button);
    button.setAttribute("aria-checked", String(on));
    if (on) stop = button;
  }
  for (const button of row.children) button.tabIndex = button === (stop ?? shown[0]) ? 0 : -1;
}

/** Arrow keys, Home and End move along a row's shown radios (round from the end to the start); Space and Enter choose, as a button's press does. */
function roving(row) {
  row.addEventListener("keydown", (event) => {
    const shown = [...row.children].filter((button) => !button.hidden);
    const at = shown.indexOf(document.activeElement);
    if (at < 0) return;
    const next = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: shown.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = shown[(next + shown.length) % shown.length];
    for (const button of shown) button.tabIndex = button === target ? 0 : -1;
    target.focus();
  });
}

/**
 * Take the picker over: `get` says the surface on show, `choose` is called with the surface a press asks for, `say` gives a word in the page's language
 * and `lang` says which language that is. Returns `paint()`, which puts the picker in step with the surface and the language: call it whenever either
 * may have changed. The marks of the surfaces with an example game follow the games' index once it has loaded (the index is fetched once, for the
 * whole page): a surface is marked when the index has a game on it.
 */
export function mountSurfacePicker(host, { get, choose, say, lang }) {
  const kindRow = host.querySelector(".sk-kinds");
  const sportRow = host.querySelector(".sk-sports");
  const variantRow = host.querySelector(".sk-variants");
  const sports = [...sportRow.children].flatMap((button) => button.dataset.surfaces.split(" "));
  // The kind on show: the surface's own, until a reader looks at another (the surface stays until one of that kind is chosen).
  let looking = null;
  let shownFor = null;
  let order = null;

  function paint() {
    const sport = get();
    if (sport !== shownFor) { looking = null; shownFor = sport; }
    const { kind, chip, variant } = choiceOf(sport);
    const view = looking ?? kind;
    // The chips in the language's order, moved only when it changed.
    const wanted = orderedChips(sports, say, lang()).map((one) => one.id).join();
    if (order !== wanted) {
      const byId = new Map([...sportRow.children].map((button) => [button.dataset.chip, button]));
      sportRow.append(...wanted.split(",").map((id) => byId.get(id)));
      order = wanted;
    }
    for (const button of kindRow.children) button.dataset.current = String(button.dataset.kind === kind);
    checkRow(kindRow, (button) => button.dataset.kind === view);
    for (const button of sportRow.children) button.hidden = button.dataset.kind !== view;
    checkRow(sportRow, (button) => button.dataset.chip === chip);
    const group = view === kind ? groupOf(sport) : null;
    for (const button of variantRow.children) button.hidden = button.dataset.group !== group;
    variantRow.hidden = group === null;
    checkRow(variantRow, (button) => button.dataset.value === variant);
  }

  for (const row of [kindRow, sportRow, variantRow]) roving(row);
  kindRow.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button === null) return;
    looking = button.dataset.kind === kindOf(get()) ? null : button.dataset.kind;
    paint();
  });
  sportRow.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button === null) return;
    const sport = surfaceOf({ chip: button.dataset.chip, variant: get() });
    if (sport !== get()) choose(sport);
  });
  variantRow.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button === null || button.dataset.value === get()) return;
    choose(button.dataset.value);
  });

  function marks(games) {
    for (const button of sportRow.children) button.querySelector(".sk-game").hidden = !button.dataset.surfaces.split(" ").some((one) => games.includes(one));
    for (const button of variantRow.children) button.querySelector(".sk-game").hidden = !games.includes(button.dataset.value);
    host.dataset.games = "ready";
  }
  loadGames().then((games) => marks(games.map((game) => game.sport)));
  return { paint };
}
