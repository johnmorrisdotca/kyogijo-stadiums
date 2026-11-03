// A simulated race in a page: the circuit flat or in 3D with a dot for each car, the race clock, the controls (play, the speeds 1×, 10× and 60×, and a slider over the whole race) and the timing board, all moving
// together. Each animation frame moves only the dots that moved and writes the board and the clock only where their words changed (the board at most four times a second); no element is made while it plays.
// Nothing runs until the reader plays it, and nothing runs while it is paused, the page is hidden or the race is out of sight. With reduced motion nothing plays by itself: play moves to the leader's next lap.
import { CIRCUIT_MARKER, buildCircuitTurn } from "./circuits.turn.ts";
import { RACE_STYLE, carMarkup, carRadius, lapTime, raceBoard, raceClock, raceDrawing, raceStage, standingGap } from "./circuits.race.draw.ts";
import { raceAt, type RaceMoment } from "./circuits.race.moment.ts";
import { simulateRace, type CircuitRace, type RaceOptions } from "./circuits.race.ts";
import { RACE_WORDS } from "./circuits.race.words.ts";
import type { CircuitOptions } from "./circuits.types.ts";
import type { Pt } from "./crowd.ts";
import { num } from "./format.ts";
import { fill } from "./strings.core.ts";
import { mountTurn, type KyogijoTurn } from "./turn.dom.ts";
import type { Plane } from "./turn.kit.ts";
import type { TurnModel, TurnSettings } from "./turn.model.ts";
import type { TurnInternals } from "./turn.replay.dom.ts";
import type { Language } from "./types.ts";

/** The speeds the controls offer: real time, ten times and sixty times (a minute of the race a second). */
export const RACE_SPEEDS: readonly number[] = Object.freeze([1, 10, 60]);

/** What a race's view is drawn from: the circuit's options and the race's. */
export type RaceViewOptions = CircuitOptions & Omit<RaceOptions, "circuit">;

/** How a race is shown and played. */
export interface RaceViewSettings {
  /** `flat` (the default) or `3d`: the circuit's 3D view, with the cars standing on it as discs that face the eye. */
  view?: "flat" | "3d";
  /** The 3D view's own settings (its viewpoint, its controls). */
  turn?: TurnSettings;
  /** 1 (the default), 10 or 60; any speed from 1 to 600 is allowed. */
  speed?: number;
  /** Seconds from the start to begin at: 0 (the grid) by default. */
  start?: number;
  /** Play at once. Ignored for a reader who prefers reduced motion, and while the page is hidden. */
  autoplay?: boolean;
  /** `auto` (the default) follows `prefers-reduced-motion`; `smooth` and `step` force one. */
  motion?: "auto" | "smooth" | "step";
  /** The timing board under the controls: on by default. */
  board?: boolean;
  /** A race already worked out to play instead of a simulation: one from a feed (`raceFromFeed`). */
  race?: CircuitRace;
  /** Told when the reader plays, pauses, seeks or changes speed, and when the race ends: not at every frame. */
  onChange?: (state: RaceState) => void;
}

/** What a race's view is doing. */
export interface RaceState {
  t: number;
  duration: number;
  playing: boolean;
  ended: boolean;
  speed: number;
  motion: "smooth" | "step";
}

/**
 * Where a race is drawn: the circuit's own drawing and 3D view (`mountCircuitRace`), or another scene the circuit lies in, a district's ground among its venues (`mountDistrictRace`). The cars are placed in the circuit's own plan
 * (`raceAt`); `point` says where such a point is in the scene.
 */
export interface RaceScene<O, V> {
  /** The scene's flat drawing at a moment, its cars as the `.ky-ci-car` groups of `carMarkup`: the race given when it came from a feed, else the simulation the options make. */
  flat(options: O, t: number, given: CircuitRace | undefined): string;
  /** The options the 3D view is mounted and updated with. */
  view(options: O): V;
  /** The 3D view's model. */
  build(options: V, settings: TurnSettings): TurnModel;
  /** Where a point of the circuit's plan lies in the scene: the same point for the circuit's own drawing. */
  point(options: O): (p: Pt) => Pt;
}

/** The circuit's own scene. */
const CIRCUIT_SCENE: RaceScene<RaceViewOptions, CircuitOptions> = {
  flat: (options, t, given) => raceDrawing({ ...options, t }, given).svg,
  view: (options) => options,
  build: buildCircuitTurn,
  point: () => (p) => p,
};

/** What `mountCircuitRace` gives back (and `mountDistrictRace`, with a district's options and 3D view). */
export interface KyogijoRace<O = RaceViewOptions, V = CircuitOptions> {
  /** The race it plays. */
  readonly race: CircuitRace;
  /** The 3D view, when the race is on one. */
  readonly turn: KyogijoTurn<V> | undefined;
  state(): RaceState;
  /** The race at the clock's time: the standings, the lap, the fastest lap. */
  moment(): RaceMoment;
  play(): void;
  pause(): void;
  toggle(): void;
  /** Go to a time, in seconds from the start. */
  seek(t: number): void;
  /** Go to the moment the leader next crosses the line. */
  nextLap(): void;
  setSpeed(speed: number): void;
  /** Draw again with new options (the language, the theme): the clock and the race stay where they are. A new circuit, seed, laps or cars is a new race: mount it again. */
  update(options: O): void;
  /** Play another race in the same view (a feed that came in again while a race is followed): the clock stays where it is, held to the new race's end, and stays playing or paused. */
  replace(race: CircuitRace): void;
  destroy(): void;
}

const ICONS = { play: "M8 5v14l11-7z", pause: "M6 5h4v14H6zM14 5h4v14h-4z", next: "M6 5l8.5 7L6 19zM16 5h2v14h-2z" };
const icon = (d: string): string => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="currentColor"><path d="${d}"/></svg>`;

/** The plane of a car standing in a 3D view: a disc that faces the eye, its lower edge on the floor over its place. */
const carPlane = (id: string, x: number, y: number, d: number, svg: string): Plane => ({ id: `car-${id}`, kind: "player", o: [x - d / 2, y, d], u: [d, 0, 0], v: [0, 0, -d], svg, billboard: true, lean: true });

/**
 * Mount a simulated race on a circuit: the circuit flat (or in 3D) with a dot for each made-up car, the race clock, play and pause, the speeds 1×, 10× and 60×, a slider over the whole race and the timing board, moving
 * together. It does nothing until it is played, and nothing while it is paused, hidden or out of sight.
 * @example
 * ```ts no-run
 * import { mountCircuitRace } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const race = mountCircuitRace(document.querySelector("#race")!, { circuit: "las-vegas" }, { speed: 10 });
 * race.play();
 * ```
 */
export function mountCircuitRace(host: HTMLElement, initial: RaceViewOptions, settings: RaceViewSettings = {}): KyogijoRace {
  return mountRaceIn(host, initial, CIRCUIT_SCENE, settings);
}

/** A race in a page, drawn in a scene: what `mountCircuitRace` does on the circuit's own drawing, and `mountDistrictRace` on a district's ground. */
export function mountRaceIn<O extends RaceOptions & { language?: Language }, V>(host: HTMLElement, initial: O, scene: RaceScene<O, V>, settings: RaceViewSettings = {}): KyogijoRace<O, V> {
  const doc = host.ownerDocument;
  let options: O = { ...initial };
  let place = scene.point(options);
  let language: Language = options.language === "ja" ? "ja" : "en";
  let race = settings.race ?? simulateRace(options);
  let fromFeed = settings.race !== undefined;
  const media = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  const motionNow = (): "smooth" | "step" => (settings.motion === "smooth" ? "smooth" : settings.motion === "step" ? "step" : media?.matches === true ? "step" : "smooth");
  const clampSpeed = (n: number): number => Math.min(600, Math.max(1, n));
  const state: RaceState = { t: Math.min(Math.max(settings.start ?? 0, 0), race.duration), duration: race.duration, playing: false, ended: false, speed: clampSpeed(Number.isFinite(settings.speed) ? (settings.speed as number) : 1), motion: motionNow() };
  const tell = (): void => settings.onChange?.({ ...state });

  // ---- The parts: the stage, the clock, the controls, the note, the live region and the board. ----
  const root = doc.createElement("div");
  root.className = "ky-race";
  const style = doc.createElement("style");
  style.textContent = RACE_STYLE;
  const stage = doc.createElement("div");
  stage.className = "ky-race-view";
  const clock = doc.createElement("div");
  clock.className = "ky-race-clock";
  const time = doc.createElement("span");
  time.className = "ky-race-time";
  const stageLine = doc.createElement("span");
  stageLine.className = "ky-race-stage";
  clock.append(time, stageLine);
  const bar = doc.createElement("div");
  bar.className = "ky-race-bar";
  bar.setAttribute("role", "group");
  const play = doc.createElement("button");
  play.type = "button";
  play.className = "ky-race-play";
  const speeds = doc.createElement("span");
  speeds.className = "ky-race-speeds";
  speeds.setAttribute("role", "group");
  const speedButtons = RACE_SPEEDS.map((n) => {
    const b = doc.createElement("button");
    b.type = "button";
    b.dataset.speed = String(n);
    b.textContent = `${n}×`;
    speeds.append(b);
    return b;
  });
  const range = doc.createElement("input");
  range.type = "range";
  range.className = "ky-race-position";
  range.min = "0";
  range.max = String(race.duration);
  range.step = "1";
  bar.append(play, speeds, range);
  const note = doc.createElement("p");
  note.className = "ky-race-note";
  const live = doc.createElement("div");
  live.className = "ky-race-live";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  const boardWrap = doc.createElement("div");
  boardWrap.className = "ky-race-board-wrap";
  boardWrap.hidden = settings.board === false;
  root.append(style, stage, clock, bar, note, live, boardWrap);
  host.replaceChildren(root);

  // ---- The drawing: flat, or the circuit's 3D view with the cars standing on it. ----
  let turn: KyogijoTurn<V> | undefined;
  let inner: TurnInternals | undefined;
  /** Each car's element (a group in the flat drawing, a plane's element in 3D), the text of its position, and what each was last given. */
  let cars = new Map<string, { el: Element | null; text: Element | null; r: number; at: string; position: number; status: string }>();
  const planes = new Map<string, Plane>();
  let disc = 0;
  let moment = raceAt(race, state.t);

  const bindFlat = (): void => {
    cars = new Map();
    for (const el of stage.querySelectorAll(".ky-ci-car")) {
      const id = el.getAttribute("data-car") ?? "";
      cars.set(id, { el, text: el.querySelector("text"), r: Number(el.querySelector("circle")?.getAttribute("r") ?? 0), at: el.getAttribute("transform") ?? "", position: Number(el.querySelector("text")?.textContent ?? 0), status: el.getAttribute("data-status") ?? "" });
    }
  };
  const drawFlat = (): void => {
    stage.innerHTML = scene.flat(options, state.t, fromFeed ? race : undefined);
    bindFlat();
  };
  /** The model of the 3D view with a disc for each car at the clock's time. */
  const withCars = (model: TurnModel): TurnModel => {
    const area = model.uprights.area ?? { x0: 0, y0: 0, x1: model.viewBox.w, y1: model.viewBox.h };
    const k = Math.max(area.x1 - area.x0, area.y1 - area.y0) / 1000;
    disc = 2 * carRadius(k) * (CIRCUIT_MARKER.size / 30);
    const r = disc / 2;
    planes.clear();
    for (const line of [...moment.standings].sort((a, b) => a.index - b.index)) {
      const svg = carMarkup({ ...line, at: [r, r] }, r * 0.9, language).replace(/ role="img"[^>]*?aria-label="[^"]*"/, "");
      const at = place(line.at);
      planes.set(line.car.id, carPlane(line.car.id, at[0], at[1], disc, svg));
    }
    return { ...model, planes: [...model.planes, ...planes.values()] };
  };
  const bindTurn = (): void => {
    cars = new Map();
    if (inner === undefined) return;
    for (const line of moment.standings) {
      const el = inner.root.querySelector(`.ky-up[data-part="car-${line.car.id}"]`);
      cars.set(line.car.id, { el, text: el?.querySelector("text") ?? null, r: (disc / 2) * 0.9, at: "", position: line.position, status: line.status });
    }
  };
  const mountView = (): void => {
    if (settings.view === "3d") {
      const holder = doc.createElement("div");
      stage.replaceChildren(holder);
      turn = mountTurn(holder, scene.view(options), settings.turn ?? {}, scene.build, false, (lent) => {
        inner = lent;
      });
      if (inner !== undefined) {
        inner.setDecorate(withCars, bindTurn);
        return;
      }
      // Where the browser cannot draw the 3D view, the race is drawn flat.
      turn.destroy();
      turn = undefined;
    }
    drawFlat();
  };

  // ---- Painting a moment: the dots that moved, and (at most four times a second, or at once when asked) the clock and the board. ----
  let boardRows: { row: HTMLTableRowElement; cells: Map<string, HTMLElement>; swatch: HTMLElement | null; code: HTMLElement | null; name: HTMLElement | null }[] = [];
  const buildBoard = (): void => {
    boardWrap.innerHTML = raceBoard(moment, language);
    boardRows = [...boardWrap.querySelectorAll<HTMLTableRowElement>("tbody tr")].map((row) => ({
      row,
      cells: new Map([...row.querySelectorAll<HTMLElement>("[data-col]")].map((cell) => [cell.dataset.col ?? "", cell])),
      swatch: row.querySelector<HTMLElement>(".ky-race-swatch"),
      code: row.querySelector<HTMLElement>(".ky-race-code"),
      name: row.querySelector<HTMLElement>(".ky-race-name"),
    }));
  };
  const setText = (el: Element | null | undefined, text: string): void => {
    if (el !== null && el !== undefined && el.textContent !== text) el.textContent = text;
  };
  const setAttr = (el: Element | null | undefined, name: string, value: string | null): void => {
    if (el === null || el === undefined || el.getAttribute(name) === value) return;
    if (value === null) el.removeAttribute(name);
    else el.setAttribute(name, value);
  };
  const writeBoard = (): void => {
    const w = RACE_WORDS[language];
    setText(time, raceClock(state.t));
    setAttr(time, "aria-label", fill(w.elapsed, { time: raceClock(state.t) }));
    setText(stageLine, raceStage(moment, language));
    const at = String(Math.round(state.t));
    if (range.value !== at) range.value = at;
    setAttr(range, "aria-valuetext", fill(w.positionValue, { time: raceClock(state.t), total: raceClock(race.duration) }));
    moment.standings.forEach((line, i) => {
      const r = boardRows[i];
      if (r === undefined) return;
      setAttr(r.row, "data-car", line.car.id);
      setAttr(r.row, "data-status", line.status);
      setText(r.cells.get("pos"), String(line.position));
      if (r.swatch !== null && r.swatch.style.background !== line.car.team.colour) r.swatch.style.background = line.car.team.colour;
      setText(r.code, line.car.driver.code);
      setText(r.name, line.car.driver.name[language]);
      setText(r.cells.get("team"), line.car.team.name[language]);
      setText(r.cells.get("gap"), line.status === "pit" ? w.board.pit : standingGap(line, language, "gap"));
      setText(r.cells.get("interval"), standingGap(line, language, "interval"));
      setText(r.cells.get("last"), line.last === undefined ? "" : lapTime(line.last));
      setText(r.cells.get("best"), line.best === undefined ? "" : lapTime(line.best));
      const fastest = moment.fastest?.index === line.index;
      setAttr(r.cells.get("best"), "data-fastest", fastest ? "true" : null);
      setAttr(r.cells.get("best"), "title", fastest ? w.board.fastest : null);
      setText(r.cells.get("stops"), String(line.stops));
    });
  };
  let boardAt = -Infinity;
  let leader = moment.standings[0]?.car.id;
  let flagSaid = moment.flag;
  const paint = (now: number | undefined, crossed: boolean): void => {
    moment = raceAt(race, state.t);
    const w = RACE_WORDS[language];
    let moved = false;
    for (const line of moment.standings) {
      const car = cars.get(line.car.id);
      if (car === undefined) continue;
      const p = place(line.at);
      if (inner !== undefined) {
        const plane = planes.get(line.car.id);
        if (plane !== undefined && (plane.o[0] !== p[0] - disc / 2 || plane.o[1] !== p[1])) {
          plane.o = [p[0] - disc / 2, p[1], disc];
          moved = true;
        }
      } else {
        const at = `translate(${num(p[0])} ${num(p[1])})`;
        if (car.at !== at) {
          car.at = at;
          car.el?.setAttribute("transform", at);
        }
      }
      if (car.position !== line.position) {
        car.position = line.position;
        setText(car.text, String(line.position));
        setAttr(car.text, "font-size", num(car.r * (line.position >= 10 ? 1 : 1.15)));
        if (inner === undefined) setAttr(car.el, "aria-label", fill(w.car, { position: line.position, name: line.car.driver.name[language], team: line.car.team.name[language] }));
      }
      if (car.status !== line.status) {
        car.status = line.status;
        setAttr(car.el, "data-status", line.status);
      }
    }
    if (moved) inner?.repaint();
    // What is said aloud: a new leader, and the flag, only as the race plays forward.
    if (crossed) {
      const first = moment.standings[0];
      if (moment.flag && !flagSaid && first !== undefined) setText(live, fill(w.wins, { name: first.car.driver.name[language] }));
      else if (first !== undefined && first.car.id !== leader && state.t > 0) setText(live, fill(w.leads, { name: first.car.driver.name[language], lap: moment.lap }));
    }
    leader = moment.standings[0]?.car.id;
    flagSaid = moment.flag;
    if (now === undefined || now - boardAt >= 250) {
      boardAt = now ?? -Infinity;
      writeBoard();
    }
  };

  // ---- The controls. ----
  const label = (): void => {
    const w = RACE_WORDS[language];
    bar.setAttribute("aria-label", w.group);
    speeds.setAttribute("aria-label", w.speed);
    const step = state.motion === "step";
    const name = step ? w.nextLap : state.playing ? w.pause : w.play;
    if (play.getAttribute("aria-label") !== name) {
      play.setAttribute("aria-label", name);
      play.title = name;
      play.innerHTML = icon(step ? ICONS.next : state.playing ? ICONS.pause : ICONS.play);
    }
    speeds.hidden = step;
    for (const b of speedButtons) {
      const n = Number(b.dataset.speed);
      b.setAttribute("aria-label", `${w.speed} ${fill(w.speedValue, { speed: n })}`);
      b.setAttribute("aria-pressed", String(n === state.speed));
    }
    range.setAttribute("aria-label", w.position);
    setText(note, fromFeed ? w.feedNote : w.simulated);
    root.dataset.state = state.ended ? "ended" : state.playing ? "playing" : "paused";
    root.dataset.motion = state.motion;
  };

  // ---- The clock on the page: animation frames while playing and in sight (the 3D view's own, so that its turn and the race share one), and nothing else. ----
  let frameId = 0;
  let last = 0;
  let onScreen = true;
  const request = (callback: FrameRequestCallback): number => (inner !== undefined ? inner.requestFrame(callback) : requestAnimationFrame(callback));
  const cancel = (id: number): void => (inner !== undefined ? inner.cancelFrame(id) : cancelAnimationFrame(id));
  const stopFrames = (): void => {
    if (frameId !== 0) cancel(frameId);
    frameId = 0;
  };
  const want = (): void => {
    if (frameId !== 0 || !onScreen || !state.playing) return;
    last = performance.now();
    frameId = request(frame);
  };
  function frame(now: number): void {
    frameId = 0;
    if (!state.playing || !onScreen) return;
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    state.t = Math.min(race.duration, state.t + dt * state.speed);
    if (state.t >= race.duration) {
      state.playing = false;
      state.ended = true;
      paint(undefined, true);
      label();
      tell();
      return;
    }
    paint(now, true);
    frameId = request(frame);
  }

  const api: KyogijoRace<O, V> = {
    get race() {
      return race;
    },
    get turn() {
      return turn;
    },
    state: () => ({ ...state }),
    moment: () => moment,
    play() {
      if (state.motion === "step") return api.nextLap();
      if (state.playing) return;
      if (state.t >= race.duration) state.t = 0;
      state.playing = true;
      state.ended = false;
      label();
      tell();
      want();
    },
    pause() {
      if (!state.playing) return;
      state.playing = false;
      stopFrames();
      label();
      paint(undefined, false);
      tell();
    },
    toggle() {
      if (state.playing) api.pause();
      else api.play();
    },
    seek(t) {
      if (!Number.isFinite(t)) return;
      state.t = Math.min(Math.max(t, 0), race.duration);
      state.ended = state.t >= race.duration;
      paint(undefined, false);
      label();
      tell();
    },
    nextLap() {
      const first = moment.standings[0];
      const next = first === undefined ? undefined : race.crossings[first.index].find((at) => at > state.t + 1e-6);
      api.pause();
      api.seek(next ?? race.duration);
    },
    setSpeed(speed) {
      if (!Number.isFinite(speed)) return;
      const next = clampSpeed(speed);
      if (next === state.speed) return;
      state.speed = next;
      label();
      tell();
    },
    update(next) {
      options = { ...next, circuit: options.circuit, seed: options.seed, laps: options.laps, cars: options.cars };
      language = options.language === "ja" ? "ja" : "en";
      place = scene.point(options);
      if (turn !== undefined) turn.update(scene.view(options));
      else drawFlat();
      buildBoard();
      label();
      paint(undefined, false);
    },
    replace(next) {
      const cars = race.cars.length;
      race = next;
      fromFeed = true;
      state.duration = race.duration;
      range.max = String(race.duration);
      if (state.t > race.duration) state.t = race.duration;
      state.ended = !state.playing && state.t >= race.duration;
      moment = raceAt(race, state.t);
      if (inner !== undefined) inner.setDecorate(withCars, bindTurn);
      else drawFlat();
      if (cars !== race.cars.length || boardRows.length !== race.cars.length) buildBoard();
      label();
      paint(undefined, false);
    },
    destroy() {
      stopFrames();
      state.playing = false;
      seen?.disconnect();
      doc.removeEventListener("visibilitychange", hidden);
      if (typeof media?.removeEventListener === "function") media.removeEventListener("change", motionChanged);
      turn?.destroy();
      turn = undefined;
      inner = undefined;
      cars = new Map();
      host.replaceChildren();
    },
  };

  play.addEventListener("click", () => api.toggle());
  for (const b of speedButtons) b.addEventListener("click", () => api.setSpeed(Number(b.dataset.speed)));
  range.addEventListener("input", () => api.seek(Number(range.value)));
  // Scrolled out of sight, the clock holds (no frame is asked for) and goes on when it is back.
  let seen: IntersectionObserver | undefined;
  if (typeof IntersectionObserver === "function") {
    seen = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1]?.isIntersecting !== false;
      if (onScreen) want();
      else stopFrames();
    });
    seen.observe(stage);
  }
  // A page that is hidden does no work: the race stops, and the reader starts it again.
  const hidden = (): void => {
    if (doc.visibilityState === "hidden") api.pause();
  };
  doc.addEventListener("visibilitychange", hidden);
  const motionChanged = (): void => {
    state.motion = motionNow();
    if (state.motion === "step") api.pause();
    label();
  };
  if ((settings.motion === undefined || settings.motion === "auto") && typeof media?.addEventListener === "function") media.addEventListener("change", motionChanged);

  mountView();
  buildBoard();
  label();
  paint(undefined, false);
  if (settings.autoplay === true && state.motion === "smooth" && doc.visibilityState !== "hidden") api.play();
  return api;
}
