// The fly-through in a page: `mountFlythrough` writes the stage into a container and moves one camera along the path of `flythrough.path.ts`. Three layers are stacked under one set of numbers: the map (chizu's, when
// the page hands it over, else a plain graticule) turned and zoomed in a viewBox that is true to the ground round the arena, the site plan (the building's outline, from OpenStreetMap) in pixels at the same
// scale, and the 3D arena of `mountKyogijoTurn`, driven by its own view. Nothing runs on a timer: a frame is drawn only while the clock moves (playing, or gliding to a stage), and not while the page is hidden
// or the stage is off the screen. A reader who prefers reduced motion gets each stage as a still, and the controls step from one to the next.
import { arenaById, arenaNameIn } from "./arenas.ts";
import {
  STAGE_IDS,
  cameraAt,
  coverSide,
  flightPlan,
  foldTime,
  glide,
  glideSeconds,
  lengthWords,
  mainView,
  mapBox,
  mapFrame,
  nextRate,
  niceLength,
  stageAt,
  startOf,
  stagesOf,
  type Camera,
  type Flight,
  type MapFrame,
  type StageId,
} from "./flythrough.path.ts";
import { flythroughMarkup, graticuleMarkup, gridPath, mapMarkup, stageWords } from "./flythrough.markup.ts";
import { FLYTHROUGH_WORDS, say } from "./flythrough.words.ts";
import { LENS } from "./turn.camera.ts";
import { mountKyogijoTurn, type KyogijoTurn } from "./turn.dom.ts";
import type { TurnSettings } from "./turn.model.ts";
import { arenaOfVenue, planVenue, venueById, venueOrientation, venueRink } from "./venues.ts";
import type { Language } from "./types.ts";

/** A map to start on: chizu's world (or any map of the same shape) with chizu's `drawChizu` and `projectPoint`, which are handed over, not imported, so that the package has no dependency. */
export interface FlythroughStart<M extends { width: number; height: number } = { width: number; height: number }> {
  /** The map: chizu's `WORLD`, for instance. */
  map?: M;
  /** Draws the map as an SVG string: chizu's `drawChizu`. It is called with `{ style: true, language }`. */
  draw?: (map: M, options: { style: boolean; language: Language }) => string;
  /** Puts a longitude and latitude on the map's canvas: chizu's `projectPoint`; `null` where the map has no place for it. */
  project?: (map: M, lon: number, lat: number) => readonly [number, number] | null;
  /** The metres the container's width shows at the start. 9,000 km by default. */
  span?: number;
  /** Where the camera starts looking, `[longitude, latitude]`: the arena stands off the middle of the screen and comes to the middle as the camera falls. The arena itself by default. */
  centre?: readonly [number, number];
}

/** What a fly-through is of. */
export interface FlythroughOptions<M extends { width: number; height: number } = { width: number; height: number }> {
  /** The arena's key in `ARENAS`: an arena that has a real venue (`VENUE_IDS`). */
  arena: string;
  start?: FlythroughStart<M>;
  /** The stages to fly, in the order of the path; all of them by default. */
  stages?: readonly StageId[];
  language?: Language;
  /** `light` or `dark`; the device's setting decides when it is left out. */
  theme?: "light" | "dark";
}

/** How it behaves. */
export interface FlythroughSettings {
  /** `auto` (the default) flies unless the reader prefers reduced motion, and then shows each stage as a still; `smooth` flies anyway and `none` shows stills. */
  motion?: "auto" | "smooth" | "none";
  /** Whether it starts flying when it is mounted (it does by default, unless the reader prefers reduced motion). */
  autoPlay?: boolean;
  /** How many times faster than the path's own pace the clock runs. 1 by default. */
  speed?: number;
  /** Whether the buttons under the stage are drawn. True when left out; the keys work either way. */
  controls?: boolean;
  /** The prefix of the ids in the page, for a page with more than one. */
  id?: string;
  /** Called with the stage when the camera enters one. */
  onStage?: (stage: StageId) => void;
  /** Called with `true` when it starts flying and `false` when it stops. */
  onPlayChange?: (playing: boolean) => void;
}

/** What `mountFlythrough` gives back. */
export interface Flythrough {
  /** `motion` flies; `stages` shows each stage as a still. */
  readonly mode: "motion" | "stages";
  readonly playing: boolean;
  /** The stage the camera is in. */
  readonly stage: StageId;
  /** The stages flown, in order. */
  readonly stages: readonly StageId[];
  /** Seconds along the path now. */
  readonly time: number;
  /** The seconds the path takes from the first stage to the last one's start (and then the arena turns for ever). */
  readonly duration: number;
  /** The camera now. */
  camera(): Camera;
  play(): void;
  pause(): void;
  /** Play when paused, pause when playing; gives whether it plays now. */
  toggle(): boolean;
  /** Go to the stage after this one (the last one stays), and to the one before (the first starts again). */
  next(): void;
  back(): void;
  /** Go to a stage (its name or its place in `stages`): the camera glides there along the path, or shows its still. */
  goTo(stage: StageId | number): void;
  /** Put the camera at a moment of the path at once, whatever the mode (a scrubber, a test). */
  seek(seconds: number): void;
  destroy(): void;
}

/**
 * Mount a fly-through of an arena in a container: a map that falls to the city and the building, which rises into the arena in 3D, turning.
 * @example
 * ```ts no-run
 * import { mountFlythrough } from "@johnmorrisdotca/kyogijo-stadiums/flythrough";
 * import WORLD from "@johnmorrisdotca/chizu/world";
 * import { drawChizu } from "@johnmorrisdotca/chizu/draw";
 * import { projectPoint } from "@johnmorrisdotca/chizu";
 *
 * const trip = mountFlythrough(document.querySelector("#trip")!, { arena: "honda-center", start: { map: WORLD, draw: drawChizu, project: projectPoint } });
 * trip.goTo("city");
 * ```
 */
export function mountFlythrough<M extends { width: number; height: number }>(host: HTMLElement, options: FlythroughOptions<M>, settings: FlythroughSettings = {}): Flythrough {
  const venue = venueById(options.arena);
  if (venue === undefined) throw new Error(`${options.arena} has no real venue: choose one of the keys of VENUES`);
  const arena = arenaById(venue.id) ?? arenaOfVenue(venue);
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const language: Language = options.language === "ja" ? "ja" : "en";
  const words = FLYTHROUGH_WORDS[language];
  const id = settings.id ?? `kf-${venue.id}`;
  const speed = typeof settings.speed === "number" && Number.isFinite(settings.speed) && settings.speed > 0 ? settings.speed : 1;
  const orientation = venueOrientation(venue);
  const name = arenaNameIn(arena, undefined, language);
  const region = (() => {
    try {
      return new Intl.DisplayNames([language], { type: "region" }).of(arena.country) ?? arena.country;
    } catch {
      return arena.country;
    }
  })();
  const place = `${arena.city}, ${region}`;
  const values = { arena: name, place, seats: venue.seats.hockey.toLocaleString(language), tiers: venue.tiers.count };
  const wanted = (options.stages ?? STAGE_IDS).filter((stage, i, all) => STAGE_IDS.includes(stage) && all.indexOf(stage) === i);
  const stageList: StageId[] = STAGE_IDS.filter((stage) => wanted.includes(stage));
  if (stageList.length === 0) throw new Error("a fly-through needs at least one stage: choose from map, city and arena");

  // ---- The map: chizu's where it is handed over and has a place for the arena, else a plain graticule. ----
  const [lon, lat] = venue.osm.axis.centre;
  const start = options.start;
  let frame: MapFrame | undefined;
  let mapSvg: string | undefined;
  let chizu = false;
  if (start?.map !== undefined && start.draw !== undefined && start.project !== undefined) {
    const { map, project } = start;
    frame = mapFrame((a, b) => project(map, a, b), lon, lat);
    if (frame !== undefined) {
      mapSvg = mapMarkup(start.draw(map, { style: true, language }));
      chizu = true;
    }
  }
  if (frame === undefined || mapSvg === undefined) {
    const plain = graticuleMarkup(lat);
    mapSvg = plain.svg;
    frame = { at: [0, 0], metresX: 1, metresY: 1 };
  }
  const mapFrameNow: MapFrame = frame;

  host.innerHTML = flythroughMarkup({ id, language, theme: options.theme, arena: name, place, stages: stageList, map: mapSvg, mapCredit: chizu, controls: settings.controls, seats: values.seats, tiers: values.tiers });
  const root = host.querySelector<HTMLElement>(".kf")!;
  const stage = root.querySelector<HTMLElement>(".kf-stage")!;
  const mapLayer = root.querySelector<HTMLElement>(".kf-map")!;
  const mapBoxEl = root.querySelector<HTMLElement>(".kf-map-box")!;
  const mapSvgEl = mapBoxEl.querySelector<SVGSVGElement>("svg")!;
  const siteEl = root.querySelector<SVGSVGElement>(".kf-site")!;
  const gridEl = siteEl.querySelector<SVGPathElement>(".kf-grid")!;
  const planEl = siteEl.querySelector<SVGGElement>(".kf-plan")!;
  const turnHost = root.querySelector<HTMLElement>(".kf-3d")!;
  const pin = root.querySelector<HTMLElement>(".kf-pin")!;
  const scale = root.querySelector<HTMLElement>(".kf-scale")!;
  const scaleBar = root.querySelector<HTMLElement>(".kf-scale-bar")!;
  const scaleText = root.querySelector<HTMLElement>(".kf-scale-text")!;
  const caption = root.querySelector<HTMLElement>(".kf-caption")!;
  const live = root.querySelector<HTMLElement>(".kf-live")!;
  const media = win?.matchMedia?.("(prefers-reduced-motion: reduce)");
  const calm = (): boolean => settings.motion === "none" || (settings.motion !== "smooth" && media?.matches === true);

  // ---- The 3D arena, from above to begin with: the view the path hands over at. ----
  const drawing = { sport: "nhl" as const, arena: venue.id, crowd: { real: true }, language, ...(options.theme === undefined ? {} : { theme: options.theme }) };
  let turn: KyogijoTurn | undefined;
  // The settings object is kept: the view reads its `lens` at every paint, and the path shortens the lens as the camera comes into the bowl.
  const turnSettings: TurnSettings = { preset: "overhead", controls: false, venue: { roof: true }, motion: "none", id: `${id}-turn`, lens: LENS };
  if (stageList.some((one) => one === "arena" || one === "bowl" || one === "rink")) turn = mountKyogijoTurn(turnHost, drawing, turnSettings);

  // ---- The site plan: the building's outline and the rink, in the drawing's own feet; the sheet under it is the floor's. ----
  const plan = planVenue(venue);
  const rink = venueRink(venue);
  const rinkMiddle: [number, number] = [rink.x + rink.w / 2, rink.y + rink.h / 2];
  const footprint = `M${plan.footprint.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
  let sheet = { x: -200, y: -200, w: 600, h: 490 };
  const drawPlan = (): void => {
    planEl.innerHTML = `<rect class="ky-apron" x="${sheet.x}" y="${sheet.y}" width="${sheet.w}" height="${sheet.h}"/><path class="ky-cr-shell" d="${footprint}"/><rect class="kf-rink" x="${rink.x}" y="${rink.y}" width="${rink.w}" height="${rink.h}" rx="${Math.min(28, rink.h / 3)}"/>`;
  };
  drawPlan();

  // ---- The path, worked out for this container: the plan hands over to the 3D arena where the two are the same size. ----
  let width = 0;
  let height = 0;
  const startCentre = start?.centre;
  const anchorStart = (w: number, h: number, span: number): [number, number] => {
    if (startCentre === undefined || start?.project === undefined || start.map === undefined) return [0, 0];
    const here = start.project(start.map, lon, lat);
    const there = start.project(start.map, startCentre[0], startCentre[1]);
    if (here === null || there === null) return [0, 0];
    // The arena's offset from the middle, in metres on the ground, as a share of what the stage shows.
    const dx = ((here[0] - there[0]) * mapFrameNow.metresX) / span;
    const dy = ((here[1] - there[1]) * mapFrameNow.metresY) / (span * (h / w));
    return [Math.max(-0.4, Math.min(0.4, dx)), Math.max(-0.4, Math.min(0.4, dy))];
  };
  const makeFlight = (): Flight => {
    width = stage.clientWidth || 960;
    height = stage.clientHeight || 600;
    let siteSpan = 400;
    let anchorEnd: [number, number] = [0, 0];
    const floor = turn?.svg() ?? null;
    if (turn !== undefined && floor !== null) {
      // Measure the arena seen from straight above, as the 3D view lays it out in this container: where the rink stands and how big a foot is.
      const was = turn.view();
      const lens = turnSettings.lens;
      // The hand-over is seen from straight above through the usual long lens, whatever the lens is now.
      turnSettings.lens = LENS;
      turn.set({ yaw: 0, pitch: 0, zoom: 1 }, false);
      const box = floor.getBoundingClientRect();
      // The stage's own area, inside its border: the layers are laid out in it.
      const outer = stage.getBoundingClientRect();
      const [left, top] = [outer.left + stage.clientLeft, outer.top + stage.clientTop];
      const vb = floor.viewBox.baseVal;
      if (box.width > 0 && vb.width > 0 && width > 0) {
        const pxPerFoot = box.width / vb.width;
        siteSpan = (0.3048 * width) / pxPerFoot;
        const x = box.left - left + (rinkMiddle[0] - vb.x) * pxPerFoot;
        const y = box.top - top + (rinkMiddle[1] - vb.y) * pxPerFoot;
        anchorEnd = [(x - width / 2) / width, (y - height / 2) / height];
        sheet = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
        drawPlan();
      }
      turnSettings.lens = lens;
      turn.set(was, false);
    }
    const startSpan = start?.span ?? 9_000_000;
    return flightPlan({ north: orientation.north, siteSpan, startSpan, anchorStart: anchorStart(width, height, startSpan), anchorEnd, stages: stageList, view: mainView("nhl") });
  };
  let flight = makeFlight();

  // ---- Drawing a camera. ----
  let current: Camera = cameraAt(flight, 0);
  let shownStage: StageId | undefined;
  let written: Record<string, string> = {};
  const put = (key: string, el: HTMLElement | SVGElement, prop: string, value: string): void => {
    const k = `${key}:${prop}`;
    if (written[k] === value) return;
    written[k] = value;
    if (prop.startsWith("@")) el.setAttribute(prop.slice(1), value);
    else el.style.setProperty(prop, value);
  };
  const num = (value: number, places = 2): string => String(Math.round(value * 10 ** places) / 10 ** places);

  /** Put a camera on the screen. */
  const render = (cam: Camera): void => {
    current = cam;
    const W = width;
    const H = height;
    const ax = W / 2 + cam.ax * W;
    const ay = H / 2 + cam.ay * H;
    const metresPerPixel = Math.exp(cam.logSpan) / W;
    const live3d = cam.arena > 0.003 && turn !== undefined;

    // The map, turned about the arena, in a square that covers the stage.
    const mapOn = cam.map > 0.003;
    put("map", mapLayer, "visibility", mapOn ? "visible" : "hidden");
    if (mapOn) {
      const side = coverSide(W, H, ax, ay);
      const box = mapBox(mapFrameNow, side * metresPerPixel);
      put("map", mapLayer, "opacity", num(cam.map, 3));
      put("map", mapBoxEl, "width", `${num(side, 1)}px`);
      put("map", mapBoxEl, "height", `${num(side, 1)}px`);
      put("map", mapBoxEl, "left", `${num(ax - side / 2, 1)}px`);
      put("map", mapBoxEl, "top", `${num(ay - side / 2, 1)}px`);
      put("map", mapBoxEl, "transform", `rotate(${num(cam.north, 3)}deg)`);
      put("map", mapSvgEl, "@viewBox", `${box.x} ${box.y} ${box.w} ${box.h}`);
    }

    // The site plan, in pixels: the drawing's feet at this scale, turned to the venue's own orientation as the map is, about the arena.
    const siteOn = cam.site > 0.003;
    put("site", siteEl, "visibility", siteOn ? "visible" : "hidden");
    if (siteOn) {
      const pxPerFoot = 0.3048 / metresPerPixel;
      put("site", siteEl, "opacity", num(cam.site, 3));
      put("site", siteEl, "@viewBox", `0 0 ${W} ${H}`);
      put("site", planEl, "@transform", `translate(${num(ax, 2)} ${num(ay, 2)}) rotate(${num(cam.north - flight.input.north, 3)}) scale(${pxPerFoot.toPrecision(7)}) translate(${-rinkMiddle[0]} ${-rinkMiddle[1]})`);
      const spacing = niceLength(metresPerPixel, 170) / metresPerPixel;
      put("site", gridEl, "@d", gridPath(ax, ay, spacing, Math.hypot(W, H)));
      put("site", gridEl, "@transform", `rotate(${num(cam.north, 3)} ${num(ax, 2)} ${num(ay, 2)})`);
    }

    // The 3D arena.
    put("3d", turnHost, "visibility", live3d ? "visible" : "hidden");
    if (live3d && turn !== undefined) {
      put("3d", turnHost, "opacity", num(cam.arena, 3));
      put("3d", turnHost, "--kf-roof", num(cam.roof, 3));
      put("3d", turnHost, "@data-roof", cam.roof > 0.004 ? "1" : "0");
      const view = `${num(cam.yaw, 3)}|${num(cam.pitch, 3)}|${num(cam.logZoom, 4)}|${num(cam.logLens, 4)}`;
      if (written["3d:view"] !== view) {
        written["3d:view"] = view;
        turnSettings.lens = Math.exp(cam.logLens);
        turn.set({ yaw: cam.yaw, pitch: cam.pitch, zoom: Math.exp(cam.logZoom) }, false);
      }
    }

    // The pin, the scale bar (true on the map and the plan, not in perspective) and the stage's words.
    put("pin", pin, "visibility", mapOn ? "visible" : "hidden");
    put("pin", pin, "opacity", num(cam.map, 3));
    put("pin", pin, "transform", `translate(${num(ax, 1)}px, ${num(ay, 1)}px)`);
    const barOpacity = 1 - cam.arena;
    put("scale", scale, "opacity", num(barOpacity, 3));
    put("scale", scale, "visibility", barOpacity > 0.01 ? "visible" : "hidden");
    if (barOpacity > 0.01) {
      const length = niceLength(metresPerPixel, 140);
      put("scale", scaleBar, "width", `${num(length / metresPerPixel, 1)}px`);
      const text = lengthWords(length);
      if (scaleText.textContent !== text) scaleText.textContent = text;
    }
  };

  /** Say where the camera is in words: the caption, the buttons, the live region, the page's callback. */
  const enter = (id2: StageId, announce: boolean): void => {
    if (shownStage === id2) return;
    shownStage = id2;
    const said = stageWords(language, id2, values);
    caption.querySelector(".kf-title")!.textContent = said.name;
    caption.querySelector(".kf-text")!.textContent = said.text;
    root.dataset.stage = id2;
    for (const chip of root.querySelectorAll<HTMLButtonElement>("button[data-stage]")) {
      if (chip.dataset.stage === id2) chip.setAttribute("aria-current", "step");
      else chip.removeAttribute("aria-current");
    }
    if (announce) live.textContent = say(words.announce, { n: stageList.indexOf(id2) + 1, total: stageList.length, name: said.name, text: said.text });
    settings.onStage?.(id2);
  };

  // ---- The clock. ----
  let time = 0;
  let rate = 0;
  let playing = false;
  let journey: { from: number; to: number; elapsed: number; seconds: number } | undefined;
  let frameId: number | undefined;
  let last: number | undefined;
  let alive = true;
  let onScreen = true;
  const hidden = (): boolean => doc.hidden === true;
  const syncPlay = (): void => {
    const button = root.querySelector<HTMLButtonElement>("button[data-act=play]");
    if (button === null) return;
    button.setAttribute("aria-pressed", String(playing));
    const glyph = button.querySelector("[data-glyph]");
    const word = button.querySelector("[data-word]");
    if (glyph !== null) glyph.textContent = playing ? "❚❚" : "▶";
    if (word !== null) word.textContent = playing ? words.pause : words.play;
  };
  const show = (at: number, announce = true): void => {
    time = foldTime(flight, at);
    const cam = cameraAt(flight, time);
    render(cam);
    enter(stageAt(flight, time), announce);
  };
  const stopLoop = (): void => {
    if (frameId !== undefined) win?.cancelAnimationFrame(frameId);
    frameId = undefined;
    last = undefined;
  };
  const busy = (): boolean => journey !== undefined || playing || rate > 0;
  const loop = (): void => {
    if (frameId === undefined && alive && win !== null && busy() && !hidden() && onScreen && !calm()) frameId = win.requestAnimationFrame(tick);
  };
  const tick = (stamp: number): void => {
    frameId = undefined;
    if (!alive) return;
    const dt = last === undefined ? 0 : Math.min(0.1, (stamp - last) / 1000);
    last = stamp;
    if (journey !== undefined) {
      journey.elapsed += dt;
      const done = journey.elapsed >= journey.seconds;
      time = done ? journey.to : glide(journey.from, journey.to, journey.elapsed, journey.seconds);
      if (done) journey = undefined;
    } else {
      rate = nextRate(rate, playing, dt);
      time += rate * dt * speed;
    }
    show(time, true);
    if (busy()) loop();
    else last = undefined;
  };
  const setPlaying = (next: boolean): void => {
    if (playing === next) return;
    playing = next;
    syncPlay();
    settings.onPlayChange?.(next);
    if (calm()) scheduleStill();
    else if (next) loop();
  };

  // Reduced motion: a stage is a still, and playing steps to the next one every few seconds, with no motion between.
  let stillTimer: ReturnType<typeof setTimeout> | undefined;
  const STILL_SECONDS = 5;
  const clearStill = (): void => {
    if (stillTimer !== undefined) clearTimeout(stillTimer);
    stillTimer = undefined;
  };
  const stillStage = (to: StageId, announce = true): void => {
    time = startOf(flight, to) ?? 0;
    render(flight.rest[to]);
    enter(to, announce);
  };
  const scheduleStill = (): void => {
    clearStill();
    if (!playing || !alive) return;
    stillTimer = setTimeout(() => {
      const index = stageList.indexOf(stageAt(flight, time));
      if (index >= stageList.length - 1) return setPlaying(false);
      stillStage(stageList[index + 1]);
      scheduleStill();
    }, STILL_SECONDS * 1000);
  };

  const here = (): StageId => stageAt(flight, time);
  const goTo = (target: StageId | number): void => {
    const to = typeof target === "number" ? stageList[target] : target;
    if (to === undefined || !stageList.includes(to)) return;
    if (calm()) {
      clearStill();
      stillStage(to);
      if (playing) scheduleStill();
      return;
    }
    const from = foldTime(flight, time);
    const goal = startOf(flight, to) ?? 0;
    rate = 0;
    journey = { from, to: goal, elapsed: 0, seconds: glideSeconds(goal - from) };
    time = from;
    last = undefined;
    loop();
  };
  const step = (by: number): void => {
    const index = stageList.indexOf(here());
    // Back from a stage that has run a while goes to its start; from its start, to the stage before; from the first stage's start, it starts again.
    if (by < 0) {
      const into = time - (startOf(flight, stageList[index]) ?? 0);
      return goTo(into > 1.5 && !calm() ? index : Math.max(0, index - 1));
    }
    goTo(Math.min(stageList.length - 1, index + 1));
  };

  // ---- Buttons and keys. ----
  const onClick = (event: Event): void => {
    const target = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
    if (target === null || target === undefined || !root.contains(target)) return;
    const wanted2 = target.dataset.stage as StageId | undefined;
    if (wanted2 !== undefined) return goTo(wanted2);
    if (target.dataset.act === "play") return void toggle();
    if (target.dataset.act === "next") return step(1);
    if (target.dataset.act === "back") return step(-1);
  };
  root.addEventListener("click", onClick);
  const toggle = (): boolean => {
    setPlaying(!playing);
    return playing;
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === " ") {
      event.preventDefault();
      return void toggle();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      return step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      return step(-1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      return goTo(0);
    }
    const number = Number(event.key);
    if (Number.isInteger(number) && number >= 1 && number <= stageList.length) {
      event.preventDefault();
      goTo(number - 1);
    }
  };
  stage.addEventListener("keydown", onKey);

  // ---- The page: a stage off the screen or a hidden page does not fly, and a change of size works the path out again. ----
  let seen: IntersectionObserver | undefined;
  if (typeof IntersectionObserver === "function") {
    seen = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1]?.isIntersecting !== false;
      if (onScreen) loop();
    });
    seen.observe(stage);
  }
  const onVisible = (): void => {
    last = undefined;
    loop();
  };
  doc.addEventListener("visibilitychange", onVisible);
  let observer: ResizeObserver | undefined;
  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(() => {
      if (!alive || (stage.clientWidth === width && stage.clientHeight === height)) return;
      flight = makeFlight();
      written = {};
      if (calm()) stillStage(here(), false);
      else show(time, false);
    });
    observer.observe(stage);
  }
  const onMotion = (): void => {
    if (!alive) return;
    stopLoop();
    journey = undefined;
    rate = 0;
    if (calm()) stillStage(here(), false);
    else show(time, false);
  };
  media?.addEventListener?.("change", onMotion);

  // ---- Start. ----
  if (calm()) {
    stillStage(stageList[0], false);
    root.dataset.mode = "stages";
    const still = doc.createElement("p");
    still.className = "kf-still";
    still.textContent = words.still;
    (root.querySelector(".kf-controls") ?? root.querySelector(".kf-help"))?.after(still);
  } else {
    root.dataset.mode = "motion";
    show(0, false);
  }
  if (settings.autoPlay !== false && !calm()) setPlaying(true);

  return {
    get mode() {
      return calm() ? "stages" : "motion";
    },
    get playing() {
      return playing;
    },
    get stage() {
      return here();
    },
    stages: stagesOf(flight),
    get time() {
      return time;
    },
    get duration() {
      return flight.end;
    },
    camera: () => ({ ...current }),
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle,
    next: () => step(1),
    back: () => step(-1),
    goTo,
    seek(seconds) {
      stopLoop();
      journey = undefined;
      rate = 0;
      show(Math.max(0, seconds), false);
    },
    destroy() {
      if (!alive) return;
      alive = false;
      stopLoop();
      clearStill();
      seen?.disconnect();
      observer?.disconnect();
      doc.removeEventListener("visibilitychange", onVisible);
      media?.removeEventListener?.("change", onMotion);
      turn?.destroy();
      host.replaceChildren();
    },
  };
}
