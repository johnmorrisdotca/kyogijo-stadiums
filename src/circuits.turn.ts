// A circuit in 3D: the 3D view of `turn.ts` over the circuit's own drawing (`circuitDrawing`, its turns' badges left off the floor), with the pit building stood up at the height OpenStreetMap maps for it and each
// turn's number on a post over its bend, turned to face the eye so that it is read from wherever the view is. Nothing is drawn a second way, and nothing moves by itself: the camera, the controls, the pointer, the
// auto-turn (which waits for the reader and stops while the page is hidden or the view is out of sight) are every 3D view's. The model is a `TurnModel` of a few dozen planes; the floor is one SVG.
import { circuitDrawing, circuitText, type CircuitDrawing } from "./circuits.draw.ts";
import { circuitOf } from "./circuits.ts";
import type { CircuitOptions } from "./circuits.types.ts";
import { CIRCUIT_WORDS } from "./circuits.words.ts";
import { blockPlanes, shellBlock } from "./context.ts";
import { hash, num } from "./format.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";
import { fill } from "./strings.core.ts";
import { TURN_PRESETS, type PresetTable } from "./turn.camera.ts";
import { mountTurn, type KyogijoTurn } from "./turn.dom.ts";
import { plane, pole, thinnest, type Plane, type Upright } from "./turn.kit.ts";
import { turnMarkupOf } from "./turn.markup.ts";
import { WORLD_PX, openingView, sceneBox, type TurnModel, type TurnSettings } from "./turn.model.ts";
import { planesOf, type Uprights } from "./uprights.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/**
 * The four viewpoints of a circuit: straight down, the main camera high over the long side of the lap, the end-on view along it and the low corner. A lap is kilometres across and flat, so the eye is kept higher than
 * a single surface's.
 */
export const CIRCUIT_PRESETS: PresetTable = { overhead: TURN_PRESETS.overhead, broadcast: { yaw: 0, pitch: 58, zoom: 1 }, end: { yaw: -90, pitch: 62, zoom: 1 }, corner: { yaw: -35, pitch: 64, zoom: 1 } };

/** The size of a turn's marker and the height of its post, in thousandths of the drawing's longer side (a marker, sized to be read: nothing of this size stands at a corner). */
export const CIRCUIT_MARKER = Object.freeze({ size: 30, post: 22 });

/** The most planes a circuit's 3D view may have: its markers (three planes each), its pit building and nothing else. A test holds every circuit to it. */
export const CIRCUIT_PLANES_MAX = 120;

/**
 * What stands up on a circuit's floor, in its plan's frame (feet): the pit building at its mapped height and each turn's number on a post over its badge's place beside the bend, the marker turned to face the eye and leaning
 * back to be read square on. `drawn` is the circuit's drawing (its badges are where the markers stand), `thin` the width of a post and `turns: false` leaves the markers out (the pit building stays). The 3D view of the
 * circuit stands these, and a district with the circuit stands them where it puts the circuit.
 */
export function circuitUprights(drawn: CircuitDrawing, thin: number, turns = true): Upright[] {
  const plan = drawn.plan;
  const k = drawn.k;
  const items: Upright[] = [];
  if (plan.building !== undefined) {
    const planes = blockPlanes(shellBlock("pit", plan.building.ring, plan.building.height, undefined), "pit-");
    const [cx, cy] = plan.building.ring.reduce((s, p) => [s[0] + p[0] / plan.building!.ring.length, s[1] + p[1] / plan.building!.ring.length], [0, 0]);
    items.push({ id: "pit-building", kind: "blocks", at: [cx, cy], height: plan.building.height, planes });
  }
  const size = CIRCUIT_MARKER.size * k;
  const top = CIRCUIT_MARKER.post * k;
  const marks: Plane[] = [];
  for (const b of turns ? drawn.badges : []) {
    const [x, y] = b.at;
    const r = size / 2;
    const svg = `<circle class="u-ci-badge" cx="${num(r)}" cy="${num(r)}" r="${num(r * 0.94)}" stroke-width="${num(r * 0.1)}"/><text class="u-ci-badge-n" x="${num(r)}" y="${num(r + r * 0.4)}" font-size="${num(r * (b.n >= 10 ? 1.05 : 1.25))}">${b.n}</text>`;
    marks.push({ ...plane(`turn-${b.n}`, "sign", [x - r, y, top + size], [size, 0, 0], [0, 0, -size], svg), billboard: true, lean: true });
    marks.push(...pole(`turn-${b.n}-post`, "pole", x, y, 0, top, thin, "u-pole"));
  }
  if (marks.length > 0) items.push({ id: "turns", kind: "flags", at: [(plan.box.x0 + plan.box.x1) / 2, (plan.box.y0 + plan.box.y1) / 2], height: top + size, planes: marks });
  return items;
}

/**
 * A circuit as a 3D model: its drawing as the floor, the pit building standing on it at its mapped height, and a marker with each turn's number on a post over its bend. `settings.uprights: false` is the floor alone.
 * A `TurnModel` like any other: `turnMarkupOf` and `mountCircuitTurn` make a view of it.
 */
export function buildCircuitTurn(options: CircuitOptions, settings: TurnSettings = {}): TurnModel {
  const language: Language = options.language === "ja" ? "ja" : "en";
  // An unknown circuit throws here, naming the keys, before anything is drawn.
  circuitOf(options.circuit);
  const id = settings.id ?? (typeof options.id === "string" && options.id !== "" ? `${options.id}-turn` : `ky-turn-${hash(JSON.stringify([options, settings.preset]))}`);
  const standUp = settings.uprights !== false;
  // The floor: the drawing, its name left to the page and its turns' numbers standing up instead (on the floor too when nothing stands).
  const showTurns = options.turns !== false;
  const drawn = circuitDrawing({ ...options, id: `${id}-floor`, label: false, turns: !standUp && showTurns });
  const plan = drawn.plan;
  const { x: vx, y: vy, w: vw, h: vh } = drawn.viewBox;
  const items: Upright[] = standUp ? circuitUprights(drawn, thinnest(vw, vh), showTurns) : [];
  const area = plan.box;
  const uprights: Uprights = { items, lift: 0, thin: thinnest(vw, vh), area };
  const planes = planesOf(uprights);
  const scale = WORLD_PX / Math.max(vw, vh);
  const centre: [number, number] = [(area.x0 + area.x1) / 2, (area.y0 + area.y1) / 2];
  const w = CIRCUIT_WORDS[language];
  const standing = !standUp ? "" : plan.building === undefined ? w.standingNoBuilding : fill(w.standing, { height: num(Math.round((plan.building.height / FT) * 10) / 10) });
  const { title, description } = circuitText(plan, language, standing);
  const surfaceLike = { sport: "circuit", language, ...(options.theme === undefined ? {} : { theme: options.theme }) } as unknown as SurfaceOptions;
  return {
    id,
    language,
    options: surfaceLike,
    title,
    description,
    standing,
    floor: drawn.svg,
    viewBox: { x: vx, y: vy, w: vw, h: vh },
    scale,
    uprights,
    defs: "",
    crowdStyle: "",
    venue: false,
    look: undefined,
    planes,
    box: sceneBox(planes, area, 0, centre, scale),
    centre,
    view: openingView({ preset: "broadcast", ...settings }, CIRCUIT_PRESETS),
    turnable: true,
    presets: CIRCUIT_PRESETS,
    flat: circuitDrawing(options).svg,
  };
}

/**
 * Mount a circuit as a 3D view in a container: the same view as `mountKyogijoTurn`'s, with the controls, the pointer, the keys and the auto-turn of every 3D view, over the circuit's drawing with its pit building and
 * the turns' numbers standing up. Where the browser cannot turn it, the flat drawing is shown.
 * @example
 * ```ts no-run
 * import { mountCircuitTurn } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const view = mountCircuitTurn(document.querySelector("#lap")!, { circuit: "las-vegas" }, { preset: "corner" });
 * view.set({ yaw: 40 });
 * ```
 */
export function mountCircuitTurn(host: HTMLElement, options: CircuitOptions, settings: TurnSettings = {}): KyogijoTurn<CircuitOptions> {
  return mountTurn(host, options, settings, buildCircuitTurn);
}

/**
 * A circuit as the markup of a 3D view, still until a page's script makes it turn: pure, so a server can make it.
 * @example
 * ```ts
 * import { circuitTurnMarkup } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const html = circuitTurnMarkup({ circuit: "las-vegas" }, { preset: "broadcast" });
 * console.log(html.includes('data-part="turn-17"'), html.includes("preserve-3d"));
 * // true false
 * ```
 */
export function circuitTurnMarkup(options: CircuitOptions, settings: TurnSettings = {}): string {
  return turnMarkupOf(buildCircuitTurn(options, settings), settings);
}
