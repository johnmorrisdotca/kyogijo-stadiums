// The demo's sound controls, for any view of a surface: a Sound button, a volume slider and the crowd's levels as buttons, each kept in the address under the page's prefix (`sound=on`,
// `volume=40`, `level=loud`). They are built from what the surface's sound set offers: a surface with no set shows none, and a still sport fewer levels. Off, the bar is the Sound button
// alone; the volume and the levels come with the sound. The sound itself is the package's (`createKyogijoSound`), whose code is loaded the first time
// the sound is turned on; the recordings are the demo's own (`sounds/`, CC0 and public domain, docs/sound-credits.md), fetched then too. A browser lets audio start only after a press, so an
// address that says `sound=on` turns it on at the reader's first press anywhere on the page.
// The index of sound sets and the words are the two small modules of the entry the bar needs before then (whether a surface has a sound, and the button's name).
import { SOUND_OF_SPORT } from "./dist/sound.sets.js";
import { SOUND_WORDS } from "./dist/sound.words.js";
import { replaceAddress } from "./address.js";

/** The recordings the demo has, by name. */
export const SOUND_FILES = ["murmur", "applause", "water"];

/** The demo's recordings in the format this browser decodes: Opus where it can, else AAC. */
export function soundFiles(probe = typeof document === "undefined" ? undefined : document.createElement("audio")) {
  const opus = probe?.canPlayType?.('audio/ogg; codecs="opus"') ?? "";
  const ext = opus === "" ? "m4a" : "ogg";
  return Object.fromEntries(SOUND_FILES.map((name) => [name, `sounds/${name}.${ext}`]));
}

const LEVELS = ["quiet", "murmur", "engaged", "loud", "roar"];

/** The controls' own layout: one row, the levels a row of buttons, the slider with its word; a page's buttons keep its own look. */
export const SOUND_CSS = `
.sound-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
.sound-bar[hidden], .sound-bar [hidden] { display: none; }
.sound-volume { display: inline-flex; align-items: center; gap: 6px; font-size: .9rem; font-weight: 700; min-height: 44px; }
.sound-volume input { width: 7rem; min-height: 44px; accent-color: currentColor; }
.sound-levels { display: flex; flex-wrap: wrap; gap: 6px; }
@media (max-width: 600px) { .sound-bar.rv-bar, .sound-bar .sound-levels { flex-wrap: wrap; overflow: visible; } .sound-volume input { width: 5.5rem; } }`;

/** A real NHL venue's sound context (its roof and seats), from the venue's facts and a real view's state: the crowd there when the stands are, and the view. */
export function venueSound(venue, viewState) {
  return { sport: "nhl", venue: { roof: venue.roof.kind, seats: venue.seats.hockey }, crowd: viewState.stands ? 1 : 0, view: viewState.view === "2d" ? "2d" : "3d" };
}

/** The sound's choices in an address, under a prefix: on or off, the volume (0 to 100) and the level. */
export function readSound(params, prefix = "", fallback = "engaged") {
  const volume = Number(params.get(`${prefix}volume`));
  const level = params.get(`${prefix}level`);
  return {
    on: params.get(`${prefix}sound`) === "on",
    volume: params.has(`${prefix}volume`) && Number.isFinite(volume) ? Math.min(100, Math.max(0, Math.round(volume))) : 60,
    level: LEVELS.includes(level) ? level : fallback,
  };
}

/** The sound's choices written into an address, under a prefix: only what differs from the usual. */
export function writeSound(params, choice, prefix = "", fallback = "engaged") {
  const set = (name, value) => (value === null ? params.delete(`${prefix}${name}`) : params.set(`${prefix}${name}`, value));
  set("sound", choice.on ? "on" : null);
  set("volume", choice.volume === 60 ? null : String(choice.volume));
  set("level", choice.level === fallback ? null : choice.level);
  return params;
}

/**
 * Mount the sound controls in `bar` for the surface drawn in `host`.
 * @param {object} options
 * @param {HTMLElement} options.bar where the controls go (hidden when the surface has no sound)
 * @param {HTMLElement} options.host the surface's view: the sound stops while it is out of sight
 * @param {() => "en" | "ja"} options.lang the page's language
 * @param {() => import("./dist/sound-entry.js").SoundContext} options.context the surface, venue, crowd and view now
 * @param {string} [options.prefix] the prefix of the parameters in the address
 * @param {string} [options.id] the prefix of the controls' test ids
 * @param {string} [options.chipClass] the class of the buttons
 * @param {string} [options.level] the level when the address names none: `engaged`
 */
export function mountSoundBar({ bar, host, lang, context, prefix = "", id = "sound", chipClass = "fam-chip", level = "engaged" }) {
  const choice = readSound(new URLSearchParams(location.search), prefix, level);
  /** The package's sound, made the first time the sound is turned on; until then what a page asks of it is kept and given to it then. */
  let sound;
  let loading;
  const words = () => SOUND_WORDS[lang()] ?? SOUND_WORDS.en;
  const has = () => Object.hasOwn(SOUND_OF_SPORT, context().sport);

  /** The sound, loaded and made once. */
  function load() {
    loading ??= import("./dist/sound-entry.js").then(({ createKyogijoSound }) => {
      sound = createKyogijoSound({
        ...context(),
        level: choice.level,
        volume: choice.volume / 100,
        files: soundFiles(),
        host,
      });
      return sound;
    });
    return loading;
  }
  /** Turn the sound on: loaded first, then on (from the press that asked, as a browser wants). */
  function turnOn() {
    if (sound !== undefined) return sound.enable().then(render);
    return load().then((made) => (choice.on ? made.enable() : undefined)).then(render);
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = chipClass;
  toggle.dataset.testid = `${id}-toggle`;
  const volumeLabel = document.createElement("label");
  volumeLabel.className = "sound-volume";
  const volumeWord = document.createElement("span");
  const volume = document.createElement("input");
  volume.type = "range";
  volume.min = "0";
  volume.max = "100";
  volume.step = "5";
  volume.dataset.testid = `${id}-volume`;
  volumeLabel.append(volumeWord, volume);
  const levels = document.createElement("div");
  levels.className = "sound-levels";
  levels.setAttribute("role", "group");
  levels.dataset.testid = `${id}-levels`;
  if (document.getElementById("sound-style") === null) {
    const style = document.createElement("style");
    style.id = "sound-style";
    style.textContent = SOUND_CSS;
    document.head.append(style);
  }
  bar.classList.add("sound-bar");
  bar.replaceChildren(toggle, volumeLabel, levels);

  function sync() {
    const next = writeSound(new URLSearchParams(location.search), choice, prefix, level);
    replaceAddress(next.size === 0 ? `${location.pathname}${location.hash}` : `${location.pathname}?${next}${location.hash}`);
  }

  /** Write the controls as the surface and the choices say: the Sound button, and while the sound is on the volume and the levels the surface offers. */
  function render() {
    const w = words();
    bar.hidden = !has();
    toggle.textContent = w.sound;
    toggle.title = w.soundTip;
    toggle.setAttribute("aria-pressed", String(choice.on));
    volumeWord.textContent = w.volume;
    volume.value = String(choice.volume);
    volume.setAttribute("aria-valuetext", `${choice.volume}%`);
    levels.setAttribute("aria-label", w.crowdLevel);
    const shown = choice.on && sound !== undefined;
    volumeLabel.hidden = !shown;
    // With no crowd (a page's Crowd off) there is only the building's air: no level to choose.
    levels.hidden = !shown || context().crowd === 0;
    bar.dataset.audible = String(sound?.state().audible ?? false);
    if (!shown) return;
    const state = sound.state();
    // A level the surface does not offer shows as the nearest it does (`heard`).
    const pressed = state.levels.includes(choice.level) ? choice.level : state.heard;
    levels.replaceChildren(
      ...state.levels.map((one) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = chipClass;
        button.dataset.level = one;
        button.dataset.testid = `${id}-level-${one}`;
        button.textContent = w.levels[one];
        button.setAttribute("aria-pressed", String(one === pressed));
        return button;
      }),
    );
  }

  toggle.addEventListener("click", () => {
    choice.on = !choice.on;
    if (choice.on) void turnOn();
    else sound?.disable();
    sync();
    render();
  });
  volume.addEventListener("input", () => {
    choice.volume = Number(volume.value);
    sound?.setVolume(choice.volume / 100);
    volume.setAttribute("aria-valuetext", `${choice.volume}%`);
    sync();
  });
  levels.addEventListener("click", (event) => {
    const chosen = event.target.closest("button")?.dataset.level;
    if (chosen === undefined) return;
    choice.level = chosen;
    sound?.setLevel(choice.level);
    sync();
    render();
  });

  // An address that says the sound is on: on at the first press anywhere, as a browser asks.
  if (choice.on) {
    const first = () => {
      document.removeEventListener("pointerdown", first, true);
      document.removeEventListener("keydown", first, true);
      if (choice.on && sound?.state().on !== true) void turnOn();
    };
    document.addEventListener("pointerdown", first, true);
    document.addEventListener("keydown", first, true);
  }
  render();

  return {
    /** The surface, its venue, its crowd or the view changed, or the language: the sound and the controls follow. */
    update() {
      sound?.setContext(context());
      render();
    },
    destroy() {
      sound?.destroy();
      bar.replaceChildren();
    },
  };
}
