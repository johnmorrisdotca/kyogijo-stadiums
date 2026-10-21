// A real NHL venue in a page, flat or in 3D, with its controls on the view: what to show (the stands, the walls, the roof, the building, the markings, the labels), flat or 3D, and the 3D view's own
// turn, tilt, zoom, viewpoints and Play. Shared by the venues page and the home page's featured arena. Nothing here is sent anywhere or stored; what is chosen lives in the address, under a prefix
// the page gives (`""` for the venues page, `"f"` for the home page's: `fstands=0`).
//
// The turn is never touched by a toggle: the stands, the walls and the roof are changed with `turn.update(options, { venue })`, which draws the scene again and goes on turning from where the view is, and the
// building, the markings and the labels are only hidden by a style (a `data-hide` on the stage), so that a button pressed while the view turns neither stops it nor sends it back.
import { drawKyogijo } from "./dist/index.js";
import { mountKyogijoTurn } from "./dist/turn-entry.js";
import { hoverOf, wayOf, writeWay } from "./turn-way.js";

/** The parts a reader can switch, in the order of the bar, with what each is by default: the stands on, the walls, the roof and the LED boards off (the bowl is seen), the building, the markings and the labels on. */
export const PARTS = ["stands", "walls", "roof", "boards", "building", "markings", "labels"];
const DEFAULTS = { stands: true, walls: false, roof: false, boards: false, building: true, markings: true, labels: true };
/** What the boards show when they are on: the package's own colours and a plain score (a demo's choice, not the library's default of 0 and 0). */
const BOARDS = { score: [3, 2] };
/** The viewpoints the 3D view has. */
const VIEWPOINTS = ["overhead", "broadcast", "end", "corner"];

/** The page's styles for the bar and for the parts that are hidden; it asks the page for `--rv-line`, `--rv-card`, `--rv-ink`, `--rv-on`, `--rv-on-ink` and `--rv-accent` (with plain fallbacks). */
export const REAL_VIEW_CSS = `
.rv-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 8px; }
.rv-bar button, .rv-bar select { font: inherit; font-size: .9rem; font-weight: 700; min-height: 44px; padding: 0 12px; border-radius: 999px; border: 2px solid var(--rv-line, #b9b3a3); background: var(--rv-card, #fff); color: var(--rv-ink, #10151b); cursor: pointer; }
.rv-bar select { font-weight: 600; padding: 0 8px; }
.rv-bar button[aria-pressed="true"] { background: var(--rv-on, #10151b); color: var(--rv-on-ink, #fff); border-color: var(--rv-on, #10151b); }
.rv-bar button:focus-visible, .rv-bar select:focus-visible { outline: 3px solid var(--rv-accent, #1f5fa8); outline-offset: 2px; }
.rv-bar [hidden] { display: none !important; }
.rv-bar .rv-sep { width: 1px; align-self: stretch; background: var(--rv-line, #b9b3a3); margin: 4px 2px; }
.rv-stage[data-hide~="building"] .ky-cr-shell { display: none; }
.rv-stage[data-hide~="markings"] .ky-surface-group { display: none; }
.rv-stage[data-hide~="labels"] :is(.ky-cr-north, .ky-cr-north-n) { display: none; }
.rv-stage .ky-turn-view { aspect-ratio: auto; height: clamp(300px, calc(100vh - var(--rv-chrome, 440px)), 760px); }
.rv-stage > svg.kyogijo { display: block; width: 100%; height: auto; max-height: calc(100vh - var(--rv-chrome, 440px) + 110px); }
@media (max-width: 600px) {
  .rv-bar { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
  .rv-bar button, .rv-bar select { flex: none; min-height: 44px; }
  .rv-stage .ky-turn-view { height: clamp(220px, 40vh, 340px); }
}`;

/**
 * Mount a real venue in `stage`, with its controls in `bar`.
 * @param {object} options
 * @param {HTMLElement} options.stage where the drawing or the 3D view goes
 * @param {HTMLElement} options.bar where the buttons go
 * @param {string} options.venue the venue (a key of `VENUES`) when the address names none
 * @param {() => { lang: string, words: Record<string, string>, theme: "light" | "dark" | undefined }} options.page the page's language, the words of the buttons (`p_stands`, `p_walls`, `p_roof`, `p_boards`, `p_building`, `p_markings`, `p_labels`, `view2d`, `view3d`, `group`) and the theme it forces
 * @param {string} [options.prefix] the prefix of this view's parameters in the address
 * @param {boolean} [options.flat] whether the view can be flat (a `view` button); a view that cannot is always 3D
 * @param {string} [options.chipClass] a class for the buttons, for a page that has a style of its own for them
 * @param {boolean} [options.spin] whether the 3D view can be asked to turn by itself when it opens (`spin=on` in the address, which Auto-turn writes; a reader who prefers reduced motion gets it still): it waits still otherwise and turns while the pointer is over it
 * @param {(state: object) => void} [options.onChange] called after anything changed, with the state
 */
export function mountRealView({ stage, bar, venue, page, prefix = "", flat = true, spin = true, chipClass = "", onChange = () => undefined }) {
  const key = (name) => `${prefix}${name}`;
  const params = new URLSearchParams(location.search);
  const flag = (name, normal) => (params.has(key(name)) ? params.get(key(name)) === "1" : normal);
  const state = {
    venue,
    view: flat && params.get(key("view")) !== "3d" ? "2d" : "3d",
    ...Object.fromEntries(PARTS.map((part) => [part, flag(part, DEFAULTS[part])])),
    viewpoint: VIEWPOINTS.includes(params.get(key("viewpoint"))) ? params.get(key("viewpoint")) : "corner",
    spin: spin && params.get(key("spin")) === "on",
  };
  // An old address's `roof=1` was the walls and the roof together.
  if (params.get(key("roof")) === "1" && !params.has(key("walls"))) state.walls = true;
  if (!flat) state.view = "3d";
  stage.classList.add("rv-stage");
  let turn;
  /** Whether the turn running now is the pointer's (so the address does not record it). */
  let hover;
  let styled = document.getElementById("rv-style");
  if (styled === null) {
    styled = document.createElement("style");
    styled.id = "rv-style";
    styled.textContent = REAL_VIEW_CSS;
    document.head.append(styled);
  }

  const optionsNow = () => {
    const { lang, theme } = page();
    return { sport: "nhl", arena: state.venue, crowd: { real: true, stands: state.stands, ...(state.boards ? { boards: BOARDS } : {}) }, language: lang, ...(theme === undefined ? {} : { theme }) };
  };
  const venueNow = () => ({ roof: state.roof, walls: state.walls, boards: state.boards ? BOARDS : false });
  const hidden = () => ["building", "markings", "labels"].filter((part) => !state[part]).join(" ");

  /** Write what differs from the usual into the address, under the prefix, and leave every other parameter as it is. */
  function sync() {
    const next = new URLSearchParams(location.search);
    const set = (name, value) => (value === null ? next.delete(key(name)) : next.set(key(name), value));
    set("view", state.view === "3d" && flat ? "3d" : null);
    for (const part of PARTS) set(part, state[part] === DEFAULTS[part] ? null : state[part] ? "1" : "0");
    // A roof asked for on its own would read back as the old roof-and-walls without its `walls=0`.
    if (state.roof && !state.walls) next.set(key("walls"), "0");
    set("viewpoint", state.viewpoint === "corner" ? null : state.viewpoint);
    set("spin", spin && state.spin ? "on" : null);
    writeWay(next);
    history.replaceState(history.state, "", next.size === 0 ? location.pathname : `${location.pathname}?${next}${location.hash}`);
  }

  function renderBar() {
    const { words } = page();
    const three = state.view === "3d";
    const buttons = [];
    if (flat) {
      for (const [view, label] of [["2d", words.view2d], ["3d", words.view3d]]) buttons.push(chip(`view-${view}`, label, state.view === view, { "data-view": view }));
      buttons.push(Object.assign(document.createElement("span"), { className: "rv-sep" }));
    }
    for (const part of PARTS) {
      const only3d = part === "walls" || part === "roof";
      const button = chip(`part-${part}`, words[`p_${part}`], state[part], { "data-part": part });
      button.hidden = only3d && !three;
      buttons.push(button);
    }
    bar.replaceChildren(...buttons);
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", words.group);
  }

  function chip(id, label, pressed, data) {
    const button = document.createElement("button");
    button.type = "button";
    if (chipClass !== "") button.className = chipClass;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(pressed));
    for (const [name, value] of Object.entries(data)) button.setAttribute(name, value);
    button.dataset.testid = id;
    return button;
  }

  /** Draw the view as the state says: 2D draws again; 3D is mounted once and then only updated, so that it goes on turning. */
  function draw() {
    stage.dataset.hide = hidden();
    if (state.view === "2d") {
      if (turn !== undefined) { turn.destroy(); turn = undefined; }
      stage.innerHTML = drawKyogijo(optionsNow());
      return;
    }
    if (turn === undefined) {
      stage.innerHTML = '<div class="rv-three"></div>';
      turn = mountKyogijoTurn(stage.firstElementChild, optionsNow(), {
        preset: state.viewpoint,
        venue: venueNow(),
        ...wayOf(sync),
        ...(state.spin ? { autoPlay: true } : {}),
        onChange: (_, preset) => { if (preset !== undefined && preset !== state.viewpoint) { state.viewpoint = preset; sync(); } },
        onPlayChange: (playing) => { if (spin && hover?.on !== true && playing !== state.spin) { state.spin = playing; sync(); } },
      });
      hover = hoverOf(stage, turn);
    } else {
      turn.update(optionsNow(), { venue: venueNow() });
    }
  }

  function apply() {
    draw();
    sync();
    onChange(state);
  }

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button === null) return;
    if (button.dataset.view !== undefined) {
      if (state.view === button.dataset.view) return;
      state.view = button.dataset.view;
      renderBar();
      apply();
      return;
    }
    const part = button.dataset.part;
    if (part === undefined) return;
    state[part] = !state[part];
    button.setAttribute("aria-pressed", String(state[part]));
    apply();
  });

  renderBar();
  apply();
  return {
    state,
    /** The 3D view, or `undefined` while the view is flat. */
    turn: () => turn,
    /** Show another venue: the 3D view is kept and goes on turning. */
    setVenue(id) {
      state.venue = id;
      apply();
    },
    /** The page's language or theme changed: draw again, and write the words of the buttons again. */
    refresh() {
      renderBar();
      draw();
    },
  };
}
