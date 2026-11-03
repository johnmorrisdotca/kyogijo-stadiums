// A simulated race in a page: the circuit flat or in 3D with a dot for each car, the package's one replay bar (replay.bar.ts: to the start, a lap back and on, play, the speeds 1×, 10× and 60×, loop, a slider over the whole race and the clock line) and the timing board, all moving
// together. Each animation frame moves only the dots that moved and writes the board and the clock only where their words changed (the board at most four times a second); no element is made while it plays.
// Nothing runs until the reader plays it, and nothing runs while it is paused, the page is hidden or the race is out of sight. With reduced motion nothing plays by itself: play moves to the leader's next lap.
import { CIRCUIT_MARKER, buildCircuitTurn } from "./circuits.turn.ts";
import { RACE_STYLE, carMarkup, carRadius, chequerSquares, lapTime, raceBoard, raceClock, raceDrawing, raceStage, standingGap } from "./circuits.race.draw.ts";
import { raceAt, raceLapStep, raceLeaderMark, type RaceMoment } from "./circuits.race.moment.ts";
import { TOWER_W, TOWER_ROWS, bindTower, podiumData, towerData, towerFrame, towerHeight, towerMarkup, writeTower, type TowerView } from "./circuits.race.tower.ts";
import { createReplayBar, replayKey, type ReplayBarSlots } from "./replay.bar.ts";
import { simulateRace, type CircuitRace, type RaceOptions } from "./circuits.race.ts";
import { RACE_WORDS } from "./circuits.race.words.ts";
import type { CircuitOptions } from "./circuits.types.ts";
import type { Pt } from "./crowd.ts";
import { num } from "./format.ts";
import { fill } from "./strings.core.ts";
import { mountTurn, type KyogijoTurn } from "./turn.dom.ts";
import { pole, type Plane } from "./turn.kit.ts";
import type { TurnModel, TurnSettings } from "./turn.model.ts";
import type { TurnInternals } from "./turn.replay.dom.ts";
import type { Language } from "./types.ts";

let counter = 0;

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
  /** The turn numbers standing over the track (flat and in 3D): off by default, because a race is about the cars and the pins stand over them; `setMarkers` changes it. The scale bar, the north arrow and the credit stay. */
  markers?: boolean;
  /** The position numbers on the cars' dots: on by default; `setLabels` changes it. The leader's mark stays either way. */
  labels?: boolean;
  /** The timing tower standing beside the start and finish straight, in the plan view and in 3D: on by default; `setTower` changes it. */
  tower?: boolean;
  /** The broadcast-style tower over the left of the view: off by default; `setOverlay` changes it. */
  overlay?: boolean;
  /** Go round again from the start when the race ends, as a game's replay does: off by default. */
  loop?: boolean;
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
  loop: boolean;
  markers: boolean;
  labels: boolean;
  tower: boolean;
  overlay: boolean;
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
  /** Whether the timing tower stands in the scene (`flat` draws it when its options say `tower: true`, and the 3D view stands it): the circuit's own scene does; another has the tower over the view alone. */
  tower?: boolean;
}

/** The circuit's own scene. */
const CIRCUIT_SCENE: RaceScene<RaceViewOptions, CircuitOptions> = {
  flat: (options, t, given) => raceDrawing({ ...options, t }, given).svg,
  view: (options) => options,
  build: buildCircuitTurn,
  point: () => (p) => p,
  tower: true,
};

/** What `mountCircuitRace` gives back (and `mountDistrictRace`, with a district's options and 3D view). */
export interface KyogijoRace<O = RaceViewOptions, V = CircuitOptions> {
  /** The race it plays. */
  readonly race: CircuitRace;
  /** The 3D view, when the race is on one. */
  readonly turn: KyogijoTurn<V> | undefined;
  /** The places in the bar for the buttons of other features (the follow camera, the sound): empty elements that show only while they hold something. */
  readonly slots: ReplayBarSlots;
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
  /** Go back to the start of the lap the leader is on, or the one before when the clock is within a second of it. */
  prevLap(): void;
  /** One lap on (1) or back (-1), pausing. */
  step(direction: 1 | -1): void;
  setLoop(loop: boolean): void;
  /** Show or hide the turn numbers standing over the track, flat and in 3D. */
  setMarkers(markers: boolean): void;
  /** Show or hide the position numbers on the cars' dots. The leader's mark (a ring and a P1 tag) is always there. */
  setLabels(labels: boolean): void;
  /** Show or hide the timing tower in the scene. */
  setTower(tower: boolean): void;
  /** Show or hide the tower over the view. */
  setOverlay(overlay: boolean): void;
  /** Show or hide the podium card (it comes by itself at the chequered flag; closing it keeps it away until the race is taken back before the flag). */
  setPodium(shown: boolean): void;
  setSpeed(speed: number): void;
  /** Draw again with new options (the language, the theme): the clock and the race stay where they are. A new circuit, seed, laps or cars is a new race: mount it again. */
  update(options: O): void;
  /** Play another race in the same view (a feed that came in again while a race is followed): the clock stays where it is, held to the new race's end, and stays playing or paused. */
  replace(race: CircuitRace): void;
  destroy(): void;
}

/** The plane of a car standing in a 3D view: a disc that faces the eye, its lower edge on the floor over its place. */
const carPlane = (id: string, x: number, y: number, d: number, svg: string): Plane => ({ id: `car-${id}`, kind: "player", o: [x - d / 2, y, d], u: [d, 0, 0], v: [0, 0, -d], svg, billboard: true, lean: true });

/** A plane of the leader's mark standing in a 3D view: `w` wide and `h` high, centred over (x, y) with its top at height `top`, facing the eye. */
const markPlane = (id: string, x: number, y: number, w: number, h: number, top: number, svg: string): Plane => ({ id, kind: "sign", o: [x - w / 2, y, top], u: [w, 0, 0], v: [0, 0, -h], svg, billboard: true, lean: true });

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
  const state: RaceState = { t: Math.min(Math.max(settings.start ?? 0, 0), race.duration), duration: race.duration, playing: false, ended: false, speed: clampSpeed(Number.isFinite(settings.speed) ? (settings.speed as number) : 1), loop: settings.loop === true, markers: settings.markers === true, labels: settings.labels !== false, tower: settings.tower !== false, overlay: settings.overlay === true, motion: motionNow() };
  const tell = (): void => settings.onChange?.({ ...state });

  // ---- The parts: the stage, the clock, the controls, the note, the live region and the board. ----
  const root = doc.createElement("div");
  root.className = "ky-race";
  root.dataset.labels = state.labels ? "on" : "off";
  root.dataset.markers = state.markers ? "on" : "off";
  const style = doc.createElement("style");
  style.textContent = RACE_STYLE;
  const view = doc.createElement("div");
  view.className = "ky-race-frame";
  const stage = doc.createElement("div");
  stage.className = "ky-race-view";
  /** The tower over the left of the view, and the podium card over its middle: both made once, and only written into after. */
  const overlay = doc.createElement("div");
  overlay.className = "ky-race-overlay";
  overlay.hidden = !state.overlay;
  const podium = doc.createElement("div");
  podium.className = "ky-race-podium";
  podium.setAttribute("role", "group");
  podium.hidden = true;
  view.append(stage, overlay, podium);
  const hint = doc.createElement("p");
  hint.className = "ky-race-hint";
  hint.id = `ky-race-keys-${++counter}`;
  const note = doc.createElement("p");
  note.className = "ky-race-note";
  const live = doc.createElement("div");
  live.className = "ky-race-live";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  const boardWrap = doc.createElement("div");
  boardWrap.className = "ky-race-board-wrap";
  boardWrap.hidden = settings.board === false;
  root.append(style, view, hint, note, live, boardWrap);
  host.replaceChildren(root);

  // ---- The drawing: flat, or the circuit's 3D view with the cars standing on it. ----
  let turn: KyogijoTurn<V> | undefined;
  let inner: TurnInternals | undefined;
  /** Each car's element (a group in the flat drawing, a plane's element in 3D), the text of its position, and what each was last given. */
  let cars = new Map<string, { el: Element | null; text: Element | null; r: number; at: string; position: number; status: string }>();
  const planes = new Map<string, Plane>();
  /** The leader's mark: the flat drawing's group (and the car it is on, and where it was last put), and in 3D the ring and the tag as planes. */
  let lead: { el: Element | null; at: string; car: string } = { el: null, at: "", car: "" };
  const leadPlanes: { ring?: Plane; tag?: Plane } = {};
  /** The car that wears the mark now: it is handed on only when the first is clear of it (`raceLeaderMark`). */
  let marked: string | undefined;
  /** The timing tower where it is in the page (the plan view's group, the 3D view's plane, the overlay), the tag of the leader's mark in 3D, and the podium card's state. */
  let flatTower: TowerView | undefined;
  let turnTower: TowerView | undefined;
  let overlayTower: TowerView | undefined;
  let leadTag: Element | null = null;
  let podiumDismissed = false;
  let podiumKey = "";
  let disc = 0;
  // The leader's mark in 3D, in the disc's own size: a ring round it (1.4 discs across, its lower edge a little under the floor) and a tag of 1.0 by 0.5 discs over the ring.
  const ringSize = (): number => 1.4 * disc;
  const ringTop = (): number => 0.5 * disc + 0.7 * disc;
  const tagWidth = (): number => 1.0 * disc;
  const tagHeight = (): number => 0.5 * disc;
  const tagTop = (): number => 1.75 * disc;
  const ringSvg = (): string => {
    const c = ringSize() / 2;
    return `<circle class="ky-ci-lead-halo" cx="${num(c)}" cy="${num(c)}" r="${num(0.58 * disc)}" stroke-width="${num(0.15 * disc)}"/><circle class="ky-ci-lead-ring" cx="${num(c)}" cy="${num(c)}" r="${num(0.58 * disc)}" stroke-width="${num(0.09 * disc)}"/>`;
  };
  const tagSvg = (): string => `<rect class="ky-ci-lead-tag" x="${num(0.03 * disc)}" y="${num(0.03 * disc)}" width="${num(0.94 * disc)}" height="${num(0.44 * disc)}" rx="${num(0.12 * disc)}" stroke-width="${num(0.04 * disc)}"/><text class="ky-ci-lead-p" x="${num(0.5 * disc)}" y="${num(0.34 * disc)}" font-size="${num(0.32 * disc)}">P1</text><g class="ky-ci-lead-chq">${chequerSquares(0.2 * disc, 0.14 * disc, 0.12 * disc, 5)}</g>`;
  let moment = raceAt(race, state.t);

  // ---- The bar: the package's one replay bar, told what each button does to this race. ----
  const barWords = () => {
    const w = RACE_WORDS[language];
    return { group: w.group, play: w.play, pause: w.pause, start: w.start, back: w.prevLap, forward: w.nextLap, speed: w.speed, loop: w.loop, position: w.position };
  };
  const barBox = createReplayBar({
    doc,
    speeds: RACE_SPEEDS,
    speedName: (n) => `${RACE_WORDS[language].speed} ${fill(RACE_WORDS[language].speedValue, { speed: n })}`,
    words: barWords,
    state: () => ({ playing: state.playing, speed: state.speed, loop: state.loop, motion: state.motion }),
    range: () => ({ max: race.duration, step: "1" }),
    readout: () => {
      const w = RACE_WORDS[language];
      return {
        value: Math.round(state.t),
        main: raceClock(state.t),
        line: raceStage(moment, language),
        spoken: fill(w.positionValue, { time: raceClock(state.t), total: raceClock(race.duration) }),
      };
    },
    seek: (value) => api.seek(value),
    toggle: () => api.toggle(),
    start: () => api.seek(0),
    step: (direction) => api.step(direction),
    setSpeed: (speed) => api.setSpeed(speed),
    setLoop: (loop) => api.setLoop(loop),
  });
  const bar = barBox.el;
  view.after(bar);

  /** The circuit as it is drawn now: the turn numbers stand only while Markers is on. */
  const shown = (): O => ({ ...options, turns: state.markers });

  const bindFlat = (): void => {
    cars = new Map();
    for (const el of stage.querySelectorAll(".ky-ci-car")) {
      const id = el.getAttribute("data-car") ?? "";
      cars.set(id, { el, text: el.querySelector("text"), r: Number(el.querySelector("circle")?.getAttribute("r") ?? 0), at: el.getAttribute("transform") ?? "", position: Number(el.querySelector("text")?.textContent ?? 0), status: el.getAttribute("data-status") ?? "" });
    }
    lead = { el: stage.querySelector(".ky-ci-lead"), at: stage.querySelector(".ky-ci-lead")?.getAttribute("transform") ?? "", car: stage.querySelector(".ky-ci-lead")?.getAttribute("data-car") ?? "" };
    const tower = stage.querySelector(".ky-ci-tower");
    flatTower = tower === null ? undefined : bindTower(tower);
  };
  const drawFlat = (): void => {
    stage.innerHTML = scene.flat({ ...shown(), tower: state.tower }, state.t, fromFeed ? race : undefined);
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
    // The leader's mark stands over its car: a ring round the disc and a tag above it, whose only change is their place.
    const first = raceLeaderMark(moment, marked);
    marked = first?.car.id;
    leadPlanes.ring = undefined;
    leadPlanes.tag = undefined;
    const extra: Plane[] = [];
    if (first !== undefined) {
      const at = place(first.at);
      const ring = markPlane("lead-ring", at[0], at[1], ringSize(), ringSize(), ringTop(), ringSvg());
      const tag = markPlane("lead-tag", at[0], at[1], tagWidth(), tagHeight(), tagTop(), tagSvg());
      leadPlanes.ring = ring;
      leadPlanes.tag = tag;
      extra.push(ring, tag);
    }
    // The timing tower stands on a post beside the start and finish straight, a screen that turns to face the eye.
    if (state.tower && scene.tower === true) {
      const t = towerFrame(race.plan, k, race.cars.length);
      const post = 0.3 * t.h;
      const at = place(t.at);
      const svg = `<g transform="scale(${num(t.s)})">${towerMarkup(towerData(race, moment, language), t.rows, language)}</g>`;
      extra.push({ ...markPlane("tower", at[0], at[1], t.w, t.h, post + t.h, svg), kind: "screen" });
      extra.push(...pole("tower-post", "pole", at[0], at[1], 0, post, Math.max(model.uprights.thin * 3, 2 * k), "u-pole"));
    }
    return { ...model, planes: [...model.planes, ...planes.values(), ...extra] };
  };
  const bindTurn = (): void => {
    cars = new Map();
    if (inner === undefined) return;
    for (const line of moment.standings) {
      const el = inner.root.querySelector(`.ky-up[data-part="car-${line.car.id}"]`);
      cars.set(line.car.id, { el, text: el?.querySelector("text") ?? null, r: (disc / 2) * 0.9, at: "", position: line.position, status: line.status });
    }
    leadTag = inner.root.querySelector('.ky-up[data-part="lead-tag"]');
    const tower = inner.root.querySelector('.ky-up[data-part="tower"] svg');
    turnTower = tower === null ? undefined : bindTower(tower);
  };
  const mountView = (): void => {
    if (settings.view === "3d") {
      const holder = doc.createElement("div");
      stage.replaceChildren(holder);
      turn = mountTurn(holder, scene.view(shown()), settings.turn ?? {}, scene.build, false, (lent) => {
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
    barBox.sync();
    // The towers are written with the board, at most four times a second: what they say is the board's.
    if (flatTower !== undefined || turnTower !== undefined || (state.overlay && overlayTower !== undefined)) {
      const data = towerData(race, moment, language);
      if (flatTower !== undefined) writeTower(flatTower, data);
      if (turnTower !== undefined) writeTower(turnTower, data);
      if (state.overlay && overlayTower !== undefined) writeTower(overlayTower, data);
    }
    writePodium();
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
    // The leader's mark goes with the first car, and is handed on only when the next is clear of it (a seek takes the first at once).
    const mark = raceLeaderMark(moment, crossed ? marked : undefined);
    marked = mark?.car.id;
    if (mark !== undefined) {
      const m = place(mark.at);
      if (inner !== undefined) {
        const { ring, tag } = leadPlanes;
        if (ring !== undefined && (ring.o[0] !== m[0] - ringSize() / 2 || ring.o[1] !== m[1])) {
          ring.o = [m[0] - ringSize() / 2, m[1], ringTop()];
          moved = true;
        }
        if (tag !== undefined && (tag.o[0] !== m[0] - tagWidth() / 2 || tag.o[1] !== m[1])) {
          tag.o = [m[0] - tagWidth() / 2, m[1], tagTop()];
          moved = true;
        }
      } else if (lead.el !== null) {
        const at = `translate(${num(m[0])} ${num(m[1])})`;
        if (lead.at !== at) {
          lead.at = at;
          lead.el.setAttribute("transform", at);
        }
        if (lead.car !== mark.car.id) {
          lead.car = mark.car.id;
          lead.el.setAttribute("data-car", mark.car.id);
        }
      }
    }
    if (moved) inner?.repaint();
    // At the flag the leader's tag turns into the chequered flag, the podium card comes (unless it was closed), and its button is there.
    const flag = String(moment.flag);
    if (inner !== undefined) setAttr(leadTag, "data-flag", flag);
    else setAttr(lead.el, "data-flag", flag);
    if (!moment.flag) podiumDismissed = false;
    podiumButton.hidden = !moment.flag;
    showPodium(moment.flag && !podiumDismissed);
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

  // ---- The tower over the view and the podium card: made once (and again for a new language or field), and only written into after. ----
  const buildOverlay = (): void => {
    const rows = Math.min(TOWER_ROWS, race.cars.length);
    overlay.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TOWER_W} ${towerHeight(rows)}" aria-hidden="true" focusable="false">${towerMarkup(towerData(race, moment, language), rows, language)}</svg>`;
    const svg = overlay.querySelector("svg");
    overlayTower = svg === null ? undefined : bindTower(svg);
  };
  const podiumButton = doc.createElement("button");
  podiumButton.type = "button";
  podiumButton.className = "ky-race-podium-button";
  podiumButton.hidden = true;
  barBox.slots.extra.append(podiumButton);
  /** The podium card's elements: a line for each of the first three, the fastest lap. */
  let podiumParts: { lines: { li: HTMLElement; swatch: HTMLElement; name: Element | null; team: Element | null; time: Element | null }[]; fast: HTMLElement } | undefined;
  const buildPodium = (): void => {
    const w = RACE_WORDS[language].podium;
    podium.setAttribute("aria-label", w.label);
    podium.innerHTML = `<div class="ky-podium-head"><strong class="ky-podium-title">${w.title}</strong><button type="button" class="ky-podium-close" aria-label="${w.close}" title="${w.close}">×</button></div><ol class="ky-podium-list">${[1, 2, 3].map((i) => `<li data-pos="${i}"><span class="ky-podium-pos">${i}</span><span class="ky-podium-swatch"></span><span class="ky-podium-who"><b></b><small></small></span><span class="ky-podium-time"></span></li>`).join("")}</ol><p class="ky-podium-fast"></p>`;
    podiumParts = {
      lines: [...podium.querySelectorAll<HTMLElement>("li")].map((li) => ({ li, swatch: li.querySelector<HTMLElement>(".ky-podium-swatch")!, name: li.querySelector("b"), team: li.querySelector("small"), time: li.querySelector(".ky-podium-time") })),
      fast: podium.querySelector<HTMLElement>(".ky-podium-fast")!,
    };
    podium.querySelector(".ky-podium-close")?.addEventListener("click", () => api.setPodium(false));
    podiumButton.textContent = w.show;
    podiumButton.setAttribute("aria-label", w.show);
    podiumKey = "";
  };
  const writePodium = (): void => {
    if (podium.hidden || podiumParts === undefined) return;
    const data = podiumData(race, moment, language);
    const key = JSON.stringify(data);
    if (key === podiumKey) return;
    podiumKey = key;
    podiumParts.lines.forEach((part, i) => {
      const line = data.lines[i];
      part.li.hidden = line === undefined;
      if (line === undefined) return;
      setText(part.name, line.name);
      setText(part.team, line.team);
      setText(part.time, line.time);
      if (part.swatch.style.background !== line.colour) part.swatch.style.background = line.colour;
      part.li.dataset.finished = String(line.finished);
    });
    setText(podiumParts.fast, data.fastest);
    podium.dataset.final = String(data.final);
  };
  /** The card shows from the flag on, unless it was closed; closing it keeps it away until the race is taken back from before the flag. */
  const showPodium = (on: boolean): void => {
    if (podium.hidden === !on) return;
    podium.hidden = !on;
    podiumButton.setAttribute("aria-pressed", String(on));
    if (on) writePodium();
  };

  // ---- The bar and the note: made again when the words or the motion change, and shown the state as it moves. ----
  const label = (): void => {
    barBox.sync();
    setText(note, fromFeed ? RACE_WORDS[language].feedNote : RACE_WORDS[language].simulated);
    root.dataset.state = state.ended ? "ended" : state.playing ? "playing" : "paused";
    root.dataset.motion = state.motion;
  };
  const words = (): void => {
    barBox.build();
    hint.textContent = inner !== undefined ? RACE_WORDS[language].keysTurn : RACE_WORDS[language].keys;
    buildOverlay();
    buildPodium();
    label();
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
    const next = state.t + dt * state.speed;
    state.t = Math.min(race.duration, next);
    if (next >= race.duration && state.loop && race.duration > 0) {
      // Past the flag with Loop on: what is left of the frame goes round from the grid.
      state.t = next % race.duration;
      paint(now, true);
      tell();
      frameId = request(frame);
      return;
    }
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
    slots: barBox.slots,
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
      api.step(1);
    },
    prevLap() {
      api.step(-1);
    },
    step(direction) {
      const to = raceLapStep(race, state.t, direction);
      api.pause();
      api.seek(to);
    },
    setLoop(loop) {
      if (state.loop === loop) return;
      state.loop = loop;
      label();
      tell();
    },
    setMarkers(markers) {
      if (state.markers === markers) return;
      state.markers = markers;
      root.dataset.markers = markers ? "on" : "off";
      // The pins are in the drawing (flat) or stand in the view (3D): the circuit is drawn again with or without them, the clock and the cars where they are.
      if (turn !== undefined) turn.update(scene.view(shown()));
      else drawFlat();
      paint(undefined, false);
      tell();
    },
    setLabels(labels) {
      if (state.labels === labels) return;
      state.labels = labels;
      root.dataset.labels = labels ? "on" : "off";
      tell();
    },
    setTower(tower) {
      if (state.tower === tower) return;
      state.tower = tower;
      // The tower is in the drawing (plan) or stands in the view (3D): drawn again, the clock and the cars where they are.
      if (turn !== undefined) turn.update(scene.view(shown()));
      else drawFlat();
      paint(undefined, false);
      tell();
    },
    setOverlay(on) {
      if (state.overlay === on) return;
      state.overlay = on;
      overlay.hidden = !on;
      if (overlayTower !== undefined) overlayTower.last = "";
      if (on) writeBoard();
      tell();
    },
    setPodium(on) {
      podiumDismissed = !on;
      showPodium(on && moment.flag);
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
      if (turn !== undefined) turn.update(scene.view(shown()));
      else drawFlat();
      buildBoard();
      words();
      paint(undefined, false);
    },
    replace(next) {
      const cars = race.cars.length;
      race = next;
      fromFeed = true;
      const longer = state.duration !== race.duration;
      state.duration = race.duration;
      if (state.t > race.duration) state.t = race.duration;
      state.ended = !state.playing && state.t >= race.duration;
      moment = raceAt(race, state.t);
      if (inner !== undefined) inner.setDecorate(withCars, bindTurn);
      else drawFlat();
      if (cars !== race.cars.length || boardRows.length !== race.cars.length) {
        buildBoard();
        buildOverlay();
      }
      if (longer) barBox.build();
      label();
      paint(undefined, false);
    },
    destroy() {
      stopFrames();
      state.playing = false;
      seen?.disconnect();
      doc.removeEventListener("visibilitychange", hidden);
      if (typeof media?.removeEventListener === "function") media.removeEventListener("change", motionChanged);
      bar.removeEventListener("keydown", onBarKey);
      inner?.root.removeEventListener("keydown", onStageKey, true);
      turn?.destroy();
      turn = undefined;
      inner = undefined;
      cars = new Map();
      host.replaceChildren();
    },
  };

  // The keys are a game replay's: on the bar the arrows step by a lap, over a 3D view (whose arrows turn the view) comma and full stop do, Space plays and pauses, End goes to the end.
  const keyActions = {
    toggle: () => api.toggle(),
    step: (direction: 1 | -1) => api.step(direction),
    jump: (direction: 1 | -1) => api.seek(state.t + direction * 60),
    start: () => api.seek(0),
    end: () => api.seek(race.duration),
  };
  const onBarKey = (event: KeyboardEvent): void => void replayKey(event, "bar", keyActions);
  const onStageKey = (event: KeyboardEvent): void => void replayKey(event, "stage", keyActions);
  bar.addEventListener("keydown", onBarKey);
  podiumButton.addEventListener("click", () => api.setPodium(podium.hidden));
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
    words();
  };
  if ((settings.motion === undefined || settings.motion === "auto") && typeof media?.addEventListener === "function") media.addEventListener("change", motionChanged);

  mountView();
  // Over a 3D view the arrow keys turn the view, so the race's keys there are the stage keys (the view's own Space is the auto-turn's, and this goes first).
  inner?.root.addEventListener("keydown", onStageKey, true);
  buildBoard();
  words();
  paint(undefined, false);
  if (settings.autoplay === true && state.motion === "smooth" && doc.visibilityState !== "hidden") api.play();
  return api;
}
