// The bar of controls that sits on a 3D view, shared by every demo page that turns something: the venues page and the home page's featured arena (`real-view.js`) and the pages whose choices are controls of their
// own (the stadiums, the district, the halls, the judging, the boards). A page that has its toggles and its few lists as `label` + `input` or `select` hands their ids to `moveToBar`, which puts the labels
// themselves into the bar, over the view: the ids, the listeners, the state and the address stay the page's, a toggle is the pill of `check-pill.css`, and nothing is sent anywhere or stored.
//
// `fitView` then sizes the 3D view so that the bar, the view and the view's own buttons (viewpoints, turn, tilt, zoom, Play) are all in the first screen, on a desk and on a phone.

/** The bar's styles, written once into the page by `installViewBar`: the page asks for `--line`, `--card`, `--ink`, `--tab`, `--tab-ink` and `--accent` (each with a plain fallback). */
export const VIEW_BAR_CSS = `
.rv-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 8px; }
.rv-bar > label.check { align-self: center; min-height: 48px; padding: 0 14px; font-size: .9rem; }
.rv-bar > label:not(.check) { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; font-size: .9rem; font-weight: 700; color: var(--ink, #10151b); }
.rv-bar > label:not(.check) > select { width: auto; max-width: 13rem; height: 48px; box-sizing: border-box; padding: 0 10px; border: 2px solid var(--line, #b9b3a3); border-radius: 999px; background: var(--card, #fff); color: var(--ink, #10151b); font-weight: 600; }
.rv-bar > label:not(.check) > select:focus-visible { outline: 3px solid var(--accent, #1f5fa8); outline-offset: 2px; }
.rv-bar > label { position: relative; }
.rv-bar > label.rv-quiet > span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.rv-bar [hidden] { display: none !important; }
/* The shape comes from the stage (--rv-ratio), also before the view is mounted, so that it is made in the shape it keeps; a phone's own shape of the package is what is left where the page gives none. */
.rv-fit:not(.rv-keep) .ky-turn-view { --ky-turn-ratio: var(--rv-ratio, 16 / 10) !important; }
.rv-fit .kf-stage { aspect-ratio: var(--rv-ratio, 16 / 10); }
@media (max-width: 600px) {
  .rv-bar { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
  .rv-bar > * { flex: none; }
  .rv-fit { --rv-least: 220px; }
  .rv-fit:not(.rv-keep) .ky-turn-view { --ky-turn-ratio: var(--rv-ratio, 5 / 4) !important; }
  .rv-fit .kf-stage { aspect-ratio: var(--rv-ratio, 4 / 5); }
  /* What is above the view on a phone is the page's name, its choices and the bar: the text that explains the page, and the rest of its settings, come under the view and its buttons (what is marked \`data-first\` stays above). */
  .rv-page { display: flex; flex-direction: column; }
  .rv-page > * { order: 20; }
  .rv-page > [data-first] { order: var(--first, 10); }
}`;

/** Write the bar's styles into the page, once. */
export function installViewBar() {
  if (document.getElementById("vb-style") !== null) return;
  const style = document.createElement("style");
  style.id = "vb-style";
  style.textContent = VIEW_BAR_CSS;
  document.head.append(style);
}

/**
 * Put the labels of these controls into `bar`, in this order, as they are: a toggle keeps its `check` pill, a list is a pill with its label in front of it (or only for a screen reader, with `quiet`, where the list says
 * what it is by itself, as "Lighting: off" does). Each is an id, or `[id, { quiet: true }]`; one that the page does not have is skipped. The page's own code goes on reading and hiding the controls by their ids.
 */
export function moveToBar(bar, controls) {
  installViewBar();
  bar.classList.add("rv-bar");
  bar.closest("main")?.classList.add("rv-page");
  const labels = [];
  for (const entry of controls) {
    const [id, { quiet = false } = {}] = Array.isArray(entry) ? entry : [entry];
    const control = document.getElementById(id);
    // The label of a row (`id="roof-row"` on the label itself) is the control's own label, or the control is inside it.
    const label = control?.closest("label") ?? document.getElementById(`${id}-row`);
    if (label === null || label === undefined) continue;
    if (quiet) label.classList.add("rv-quiet");
    labels.push(label);
  }
  bar.append(...labels);
  return bar;
}

/**
 * Size the 3D view in `stage` so that what is above it, the view and its own buttons fit in the screen. The view keeps its way of being drawn (the package frames the scene, the boards and the labels for the shape of its box,
 * which `--ky-turn-ratio` gives, written on the view), so what changes is that shape: the stage's width over the height that is left of the screen, never lower than the stage's `--rv-least` nor higher than its `--rv-most` (a phone's page that has more
 * above it than a screen scrolls to it instead). The height left is the screen's, less the stage's top in the page, the buttons under the view and the stage's own padding, kept up to date as the page changes.
 * With `keepShape` the shape is not changed: the stage gets narrower instead. With `box`, the stage is itself a box of a height the page's own style gives from `--feature-h` (the home page's, which holds the view and its buttons): that height is what is left of the screen, never under `box` pixels.
 * Returns a function that works it out again at once (a page calls it after drawing).
 */
export function fitView(stage, { box = 0, keepShape = false } = {}) {
  installViewBar();
  if (box === 0) stage.classList.add("rv-fit");
  if (keepShape) stage.classList.add("rv-keep");
  /** The height of what is under the view (its buttons), as last measured: a first guess before the view is there, so that it is made in nearly the shape it keeps. */
  let under = window.innerWidth <= 600 ? 230 : 110;
  const work = () => {
    const top = stage.getBoundingClientRect().top + window.scrollY;
    if (box > 0) {
      stage.style.setProperty("--feature-h", `${Math.round(Math.min(890, Math.max(box, window.innerHeight - top - 16)))}px`);
      return;
    }
    if (!stage.classList.contains("rv-fit")) {
      stage.style.removeProperty("--rv-ratio");
      return;
    }
    const view = stage.querySelector(".ky-turn-view, .kf-stage");
    // What is in the stage besides the view itself: its own padding and border, and the buttons under the view (the unit is the view with its buttons).
    const unit = view?.closest(".ky-turn, .kf");
    const style = getComputedStyle(stage);
    const around = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const sides = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    if (view !== null && unit !== null) under = unit.getBoundingClientRect().height - view.getBoundingClientRect().height;
    const least = parseFloat(style.getPropertyValue("--rv-least")) || 240;
    const most = parseFloat(style.getPropertyValue("--rv-most")) || 780;
    const height = Math.min(most, Math.max(least, window.innerHeight - Math.ceil(top + under + around + 24)));
    if (keepShape) {
      // A view whose pictures are made for its shape (the boards over it): the box keeps the shape the package gives it, and it is the box that gets narrower, in the middle of the stage.
      stage.style.removeProperty("--rv-ratio");
      if (view === null) return;
      const [across, down = 1] = getComputedStyle(view).aspectRatio.split("/").map(Number);
      stage.style.maxWidth = `${Math.round((height * across) / down + sides)}px`;
      stage.style.marginInline = "auto";
      return;
    }
    const width = view === null ? stage.getBoundingClientRect().width - sides : view.getBoundingClientRect().width;
    stage.style.setProperty("--rv-ratio", (Math.round((width / height) * 1000) / 1000).toString());
  };
  // A change of the page is answered on the next frame, not inside the observer's own turn (a change of the view's shape changes the page).
  let waiting = 0;
  new ResizeObserver(() => { cancelAnimationFrame(waiting); waiting = requestAnimationFrame(work); }).observe(document.body);
  window.addEventListener("resize", work);
  work();
  return work;
}
