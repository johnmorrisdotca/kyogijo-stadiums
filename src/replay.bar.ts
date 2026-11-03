// The one bar of every replay: the games on a flat surface or a 3D view (`replay.dom.ts`) and the race on a circuit (`circuits.race.dom.ts`) both build it from here, so that they look the same, answer the same keys and
// have the same buttons: back to the start, one step back, play or pause, one step on, the speeds as buttons (each replay gives its own set), loop, the position, and the clock line. It has places ("slots") for
// the buttons that other features add (the follow camera, the sound) so that they never need a bar of their own. It knows nothing of a clock: the caller hands it the state and what each button does.
/** The bar's rules, scoped to `.ky-controls` so that a replay and a race write the same ones. */
export const BAR_STYLE = `
.ky-controls{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin-top:.5rem;font:inherit;color:inherit}
.ky-controls[hidden]{display:none}
.ky-controls button,.ky-controls select{box-sizing:border-box;min-width:44px;min-height:44px;margin:0;padding:0 .6rem;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.ky-controls button[hidden],.ky-controls select[hidden],.ky-controls [hidden]{display:none}
.ky-controls button[aria-pressed=true]{background:color-mix(in srgb,currentColor 22%,transparent)}
.ky-controls button:focus-visible,.ky-controls input:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.ky-controls svg{width:22px;height:22px;fill:currentColor;pointer-events:none}
.ky-controls .ky-step svg,.ky-controls .ky-loop svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ky-controls .ky-speeds{display:inline-flex;gap:.25rem}
.ky-controls .ky-speeds button{padding:0 .5rem;font-variant-numeric:tabular-nums}
.ky-controls .ky-slot{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.5rem}
.ky-controls .ky-slot:empty{display:none}
.ky-controls input[type=range]{flex:1 1 140px;min-width:120px;min-height:44px;margin:0;accent-color:currentColor}
.ky-controls .ky-readout{display:inline-flex;flex-direction:column;align-items:flex-end;min-width:6.5ch;font-variant-numeric:tabular-nums}
.ky-controls .ky-readout output{min-width:6.5ch;text-align:end;font-weight:700}
.ky-controls .ky-clock-line{font-size:.85rem;text-align:end}
.ky-controls .ky-clock-line:empty{display:none}
`.trim();

const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  start: "M6 5h2v14H6zM9.5 12L19 5v14z",
  back: "M17 5v14M14 6l-7 6 7 6",
  forward: "M7 5v14M10 6l7 6-7 6",
  loop: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
};

const icon = (d: string): string => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

/** The words of the bar, in one language. */
export interface ReplayBarWords {
  group: string;
  play: string;
  pause: string;
  /** Back to the start. */
  start: string;
  /** One step back and one step on: a frame or an event for a game, a lap for a race. */
  back: string;
  forward: string;
  speed: string;
  loop: string;
  position: string;
}

/** What the bar draws of the clock. */
export interface ReplayBarState {
  playing: boolean;
  speed: number;
  loop: boolean;
  /** `step` for a reader who prefers reduced motion: nothing plays by itself, so play, the speeds and loop are not shown. */
  motion: "smooth" | "step";
}

/** The clock line, the position's spoken value and where the slider is. */
export interface ReplayBarReadout {
  /** The slider's value, in its own units. */
  value: number;
  /** The clock: `0:12 / 3:00` for a game, the time since the start for a race. */
  main: string;
  /** The line under it (a race's lap and flag), or the empty string. */
  line: string;
  /** The slider's value as it is spoken. */
  spoken: string;
}

/** What the bar is made from: how to read the clock, and what each button does. */
export interface ReplayBarSpec {
  doc: Document;
  /** The speeds to offer, as buttons. */
  speeds: readonly number[];
  /** The text on a speed's button (`4×` by default) and what it is called aloud. */
  speedText?(speed: number): string;
  speedName?(speed: number): string;
  words(): ReplayBarWords;
  state(): ReplayBarState;
  /** The slider: its end, its step (`any` for none), and what it says now. */
  range(): { max: number; step: string };
  readout(): ReplayBarReadout;
  /** The slider was moved to a value. */
  seek(value: number): void;
  toggle(): void;
  start(): void;
  step(direction: 1 | -1): void;
  setSpeed(speed: number): void;
  setLoop(loop: boolean): void;
}

/** The places in the bar for buttons that other features add. A slot is an empty element that takes whatever is appended to it, and shows only while it holds something. */
export interface ReplayBarSlots {
  /** The follow camera's buttons: Auto-follow, Action, Puck, Resume. */
  follow: HTMLElement;
  /** The sound: the toggle, the volume and the crowd levels. */
  sound: HTMLElement;
  /** Anything else. */
  extra: HTMLElement;
}

export interface ReplayBar {
  /** The bar (`.ky-controls`): put it in the page. */
  el: HTMLElement;
  slots: ReplayBarSlots;
  /** Make the buttons again, because the words, the speeds or the slider changed. The slots, and what is in them, stay. */
  build(): void;
  /** Show the state and the clock line. Writes only what changed. */
  sync(): void;
}

/** Make the bar of a replay or a race. */
export function createReplayBar(spec: ReplayBarSpec): ReplayBar {
  const { doc } = spec;
  const el = doc.createElement("div");
  el.className = "ky-controls";
  el.setAttribute("role", "group");
  const slot = (name: keyof ReplayBarSlots): HTMLElement => {
    const s = doc.createElement("span");
    s.className = `ky-slot ky-slot-${name}`;
    s.dataset.slot = name;
    return s;
  };
  const slots: ReplayBarSlots = { follow: slot("follow"), sound: slot("sound"), extra: slot("extra") };
  let sync: () => void = () => {};

  const build = (): void => {
    const w = spec.words();
    const stepMode = spec.state().motion === "step";
    const button = (cls: string, label: string, d: string, onClick: () => void): HTMLButtonElement => {
      const b = doc.createElement("button");
      b.type = "button";
      b.className = cls;
      b.setAttribute("aria-label", label);
      b.title = label;
      b.innerHTML = icon(d);
      b.addEventListener("click", onClick);
      return b;
    };
    el.setAttribute("aria-label", w.group);
    el.replaceChildren();
    const start = button("ky-start", w.start, ICONS.start, () => spec.start());
    const back = button("ky-back ky-step", w.back, ICONS.back, () => spec.step(-1));
    const play = button("ky-play", w.play, ICONS.play, () => spec.toggle());
    const forward = button("ky-forward ky-step", w.forward, ICONS.forward, () => spec.step(1));
    const speeds = doc.createElement("span");
    speeds.className = "ky-speeds";
    speeds.setAttribute("role", "group");
    speeds.setAttribute("aria-label", w.speed);
    const speedButtons = spec.speeds.map((n) => {
      const b = doc.createElement("button");
      b.type = "button";
      b.className = "ky-speed";
      b.dataset.speed = String(n);
      b.textContent = spec.speedText?.(n) ?? `${n}×`;
      b.setAttribute("aria-label", spec.speedName?.(n) ?? `${w.speed} ${n}×`);
      b.addEventListener("click", () => spec.setSpeed(n));
      speeds.append(b);
      return b;
    });
    const loop = button("ky-loop", w.loop, ICONS.loop, () => spec.setLoop(!spec.state().loop));
    const range = doc.createElement("input");
    range.type = "range";
    range.className = "ky-position";
    const r = spec.range();
    range.min = "0";
    range.max = String(r.max);
    range.step = r.step;
    range.disabled = r.max === 0;
    range.setAttribute("aria-label", w.position);
    range.addEventListener("input", () => spec.seek(Number(range.value)));
    const readout = doc.createElement("span");
    readout.className = "ky-readout";
    const clock = doc.createElement("output");
    clock.className = "ky-clock";
    clock.setAttribute("aria-hidden", "true");
    const line = doc.createElement("span");
    line.className = "ky-clock-line";
    readout.append(clock, line);
    // Nothing plays by itself in step mode: its controls are the steps and the position.
    play.hidden = stepMode;
    speeds.hidden = stepMode;
    loop.hidden = stepMode;
    el.append(start, back, play, forward, speeds, loop, slots.follow, slots.sound, slots.extra, range, readout);
    let said = "";
    let saidLine = "";
    sync = () => {
      const s = spec.state();
      const o = spec.readout();
      if (o.main !== said) {
        said = o.main;
        clock.textContent = o.main;
        range.setAttribute("aria-valuetext", o.spoken);
      }
      if (o.line !== saidLine) {
        saidLine = o.line;
        line.textContent = o.line;
      }
      const at = String(o.value);
      if (range.value !== at) range.value = at;
      const label = s.playing ? w.pause : w.play;
      if (play.getAttribute("aria-label") !== label) {
        play.setAttribute("aria-label", label);
        play.title = label;
        play.innerHTML = icon(s.playing ? ICONS.pause : ICONS.play);
      }
      for (const b of speedButtons) {
        const on = String(Number(b.dataset.speed) === s.speed);
        if (b.getAttribute("aria-pressed") !== on) b.setAttribute("aria-pressed", on);
      }
      loop.setAttribute("aria-pressed", String(s.loop));
    };
    sync();
  };
  build();
  return { el, slots, build, sync: () => sync() };
}

/** What a key on the bar or on the stage asks for. */
export interface ReplayKeyActions {
  toggle(): void;
  /** One step on (1) or back (-1). */
  step(direction: 1 | -1): void;
  /** Move by a bigger step, with Shift: forward (1) or back (-1). */
  jump(direction: 1 | -1): void;
  start(): void;
  end(): void;
}

/**
 * The keys of every replay. On the bar: Space plays or pauses, the left and right arrow keys step, Shift with them jumps, Home and End go to the ends. Over a 3D view, whose arrow keys turn the view, the same
 * moves are Space, comma and full stop (Shift to jump) and End. Returns whether the key was one of them (and was handled).
 */
export function replayKey(event: KeyboardEvent, scope: "stage" | "bar", act: ReplayKeyActions): boolean {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return false;
  const tag = (event.target as HTMLElement | null)?.tagName ?? "";
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return false;
  const space = event.key === " " || event.key === "Spacebar";
  const key =
    scope === "stage"
      ? event.code === "Comma"
        ? "back"
        : event.code === "Period"
          ? "on"
          : space
            ? "toggle"
            : event.key === "End"
              ? "end"
              : ""
      : space
        ? "toggle"
        : event.key === "ArrowRight"
          ? "on"
          : event.key === "ArrowLeft"
            ? "back"
            : event.key === "Home"
              ? "home"
              : event.key === "End"
                ? "end"
                : "";
  switch (key) {
    case "toggle":
      // A button takes the space itself.
      if (tag === "BUTTON") return false;
      act.toggle();
      break;
    case "on":
      if (event.shiftKey) act.jump(1);
      else act.step(1);
      break;
    case "back":
      if (event.shiftKey) act.jump(-1);
      else act.step(-1);
      break;
    case "home":
      act.start();
      break;
    case "end":
      act.end();
      break;
    default:
      return false;
  }
  event.preventDefault();
  return true;
}
