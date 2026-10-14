// A click on a drawing, as a place on the field. `clientPointToField(svg, clientX, clientY, { provider })` asks the drawing where the pointer is: the browser's own
// matrix for the surface group (`getScreenCTM`) carries a page coordinate back through the CSS size, the viewBox and its padding, the preserved aspect ratio, a
// tall drawing's quarter turn and a range's crop, to the surface's wide frame in feet; the frame of the provider (frames.ts) turns that into the provider's numbers,
// and the rules engine (rules.ts) names the zone. `fieldPointToClient` is the way back. A drawing writes the box of its surface and the options that decide its rules
// on its surface group (field.data.ts), so the answer needs nothing but the SVG.
import { FRAMES, frameByName, fromSurface, toSurface, type Attacking, type Frame } from "./frames.ts";
import { frameSizeOf } from "./outline.ts";
import { readField } from "./field.data.ts";
import { zoneAtSurface, type PlaceLike, type ZoneOptions } from "./rules.ts";
import { FEET_PER, isUnit, type Unit } from "./units.ts";
import type { Language, Sport } from "./types.ts";

/** The six numbers of a matrix, as an SVG's `DOMMatrix` has them. */
export interface MatrixLike {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/** What the functions need of an element of the drawing: its attributes, and for the surface group its matrix to the page. */
export interface ElementLike {
  getAttribute(name: string): string | null;
  getScreenCTM?(): MatrixLike | null;
}

/** What the functions need of the drawing's `<svg>`: to find the surface group in it. A real `SVGSVGElement` is one. */
export interface SvgLike extends ElementLike {
  querySelector(selectors: string): unknown;
  closest?(selectors: string): unknown;
}

/** What the pointer functions take besides the position. */
export interface PointerOptions {
  /** The frame the answer is written in: the name of a frame of the drawing's sport (`nhl-api`, `opta`, `statsbomb`, `mlbam`), a frame, or `"surface"` for the drawing's own numbers (feet, or `units`). `"surface"` when missing. */
  provider?: Frame | string;
  /** The unit of the `"surface"` numbers: feet when missing. */
  units?: Unit;
  /** The end the provider's team attacks, as in `toSurface`: `left` says the provider's numbers are of a team that attacks the left end of the surface as it is drawn wide. */
  attacking?: Attacking;
  /** The language of the zone names. */
  language?: Language;
  /** The size of the surface when the frame is a variable one, in place of the drawing's own. */
  size?: ZoneOptions["size"];
}

/** Where the pointer is on the field. */
export interface FieldPoint {
  /** The place in the provider's frame (feet in the drawing's wide frame for `"surface"`). */
  x: number;
  y: number;
  /** The frame's name. */
  provider: string;
  /** The place on the surface: feet in the drawing's wide frame (x along the surface from the left, y across it from the top). */
  surface: { x: number; y: number };
  /** True when the pointer is on the surface, or on its edge: not on the apron, the stands or the page round it. */
  inBounds: boolean;
  /** The zone and the finer area, by id (`zoneAt` in the zones entry): `undefined` off the surface. */
  zone: string | undefined;
  subzone: string | undefined;
  /** Every id that holds, with its name. */
  zones: string[];
  names: Record<string, string>;
}

interface Found {
  sport: Sport;
  league: string | undefined;
  box: { x: number; y: number; w: number; h: number };
  rules: Record<string, unknown>;
  group: ElementLike;
}

const invert = (m: MatrixLike): MatrixLike | undefined => {
  const det = m.a * m.d - m.b * m.c;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return undefined;
  return { a: m.d / det, b: -m.b / det, c: -m.c / det, d: m.a / det, e: (m.c * m.f - m.d * m.e) / det, f: (m.b * m.e - m.a * m.f) / det };
};

const apply = (m: MatrixLike, x: number, y: number): [number, number] => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];

/** The surface group of a drawing and what it says of its surface, or `undefined` for one the question does not apply to: a badge, a special game, a 3D view. */
function find(svg: SvgLike | Element): Found | undefined {
  const root = svg as SvgLike;
  // The 3D view lays the floor in CSS 3D, where the browser's matrix for an SVG element is the flat drawing's: it would answer for a place that is not under the pointer.
  if (typeof root.closest === "function" && root.closest(".ky-turn") !== null) return undefined;
  const group = root.querySelector(".ky-surface-group") as ElementLike | null;
  if (group === null || typeof group.getAttribute !== "function") return undefined;
  const field = readField((name) => group.getAttribute(name));
  const sport = root.getAttribute("data-sport");
  if (field === undefined || sport === null) return undefined;
  return { sport: sport as Sport, league: root.getAttribute("data-league") ?? undefined, box: field.box, rules: field.rules, group };
}

const unitOf = (units: Unit | undefined): Unit => (units !== undefined && isUnit(units) ? units : "ft");

function frameOf(found: Found, provider: Frame | string | undefined): Frame | undefined {
  if (provider === undefined || provider === "surface") return undefined;
  const frame = typeof provider === "string" ? frameByName(provider) : provider;
  if (frame.sport !== found.sport) throw new RangeError(`The frame "${frame.name}" is for ${frame.sport}, and this drawing is of ${found.sport}: use one of ${Object.values(FRAMES).filter((f) => f.sport === found.sport).map((f) => f.name).join(", ") || "surface"}`);
  return frame;
}

const sizeOf = (found: Found, options: PointerOptions) => {
  if (options.size !== undefined) return options.size;
  return frameSizeOf({ sport: found.sport, league: found.league }, { w: found.box.w, h: found.box.h });
};

/** The place on the surface, in feet, under a page position; `undefined` where the drawing has no matrix to ask (not in the page, or hidden). */
function toLocal(found: Found, clientX: number, clientY: number): [number, number] | undefined {
  const matrix = found.group.getScreenCTM?.();
  if (matrix === null || matrix === undefined) return undefined;
  const back = invert(matrix);
  return back === undefined ? undefined : apply(back, clientX, clientY);
}

/**
 * Where a page position is on the field of a drawing, in a provider's numbers, with the zone the rules put it in. `svg` is the drawing's `<svg>` element, and
 * the position is a pointer event's `clientX` and `clientY`. It holds whatever the drawing is: wide or tall, any size or padding, a range, a cropped viewBox. It answers `null` for
 * a drawing with no surface to ask (a badge, a special game, or the 3D view, whose floor is laid in CSS 3D). `provider` names a frame of the drawing's sport (`nhl-api`,
 * `opta`, `statsbomb`, `mlbam`...) and a frame of another sport is an error; without one, the numbers are the surface's own in feet.
 * @example
 * ```ts no-run
 * import { clientPointToField } from "@johnmorrisdotca/kyogijo-stadiums/pointer";
 * const svg = document.querySelector("svg.kyogijo")!;
 * svg.addEventListener("click", (event) => {
 *   const at = clientPointToField(svg, event.clientX, event.clientY, { provider: "nhl-api" });
 *   if (at !== null) console.log(at.x, at.y, at.zone, at.inBounds);
 * });
 * ```
 */
export function clientPointToField(svg: SvgLike | Element, clientX: number, clientY: number, options: PointerOptions = {}): FieldPoint | null {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) throw new TypeError("clientX and clientY are numbers");
  const found = find(svg);
  if (found === undefined) return null;
  const local = toLocal(found, clientX, clientY);
  if (local === undefined) return null;
  const frame = frameOf(found, options.provider);
  const unit = unitOf(options.units);
  let x: number;
  let y: number;
  if (frame === undefined) [x, y] = [local[0] / FEET_PER[unit], local[1] / FEET_PER[unit]];
  else [x, y] = fromSurface([local], { to: frame, size: sizeOf(found, options), attacking: options.attacking })[0];
  const rules = { ...found.rules, league: found.league ?? found.rules.league, language: options.language } as ZoneOptions;
  const zone = zoneAtSurface(found.sport, local, rules);
  return { x, y, provider: frame?.name ?? "surface", surface: { x: local[0], y: local[1] }, inBounds: zone.inBounds, zone: zone.zone, subzone: zone.subzone, zones: zone.zones, names: zone.names };
}

/**
 * The page position of a place on the field: the undoing of `clientPointToField`. The place is in a provider's numbers (or the surface's own, in feet or `units`); the answer is
 * `clientX` and `clientY`, to put a marker over the drawing with. `null` for a drawing with no surface to ask.
 * @example
 * ```ts no-run
 * import { fieldPointToClient } from "@johnmorrisdotca/kyogijo-stadiums/pointer";
 * const svg = document.querySelector("svg.kyogijo")!;
 * const at = fieldPointToClient(svg, [69, 22], { provider: "nhl-api" });
 * if (at !== null) marker.style.transform = `translate(${at.x}px, ${at.y}px)`;
 * ```
 */
export function fieldPointToClient(svg: SvgLike | Element, point: PlaceLike, options: PointerOptions = {}): { x: number; y: number } | null {
  const found = find(svg);
  if (found === undefined) return null;
  const matrix = found.group.getScreenCTM?.();
  if (matrix === null || matrix === undefined) return null;
  const xy: unknown[] = Array.isArray(point) ? point : [(point as { x: number }).x, (point as { y: number }).y];
  const [px, py] = xy;
  if (typeof px !== "number" || typeof py !== "number" || !Number.isFinite(px) || !Number.isFinite(py)) throw new TypeError("a point is [x, y] or { x, y }, two finite numbers");
  const frame = frameOf(found, options.provider);
  const unit = unitOf(options.units);
  const local: [number, number] = frame === undefined ? [px * FEET_PER[unit], py * FEET_PER[unit]] : toSurface([[px, py]], { from: frame, size: sizeOf(found, options), attacking: options.attacking })[0];
  const [x, y] = apply(matrix, local[0], local[1]);
  return { x, y };
}

/**
 * The same page position in each of several frames at once, with the zone: what a readout that shows a place in every provider asks (the demo's). `providers` defaults to every
 * frame of the drawing's sport.
 * @example
 * ```ts no-run
 * import { clientPointToFrames } from "@johnmorrisdotca/kyogijo-stadiums/pointer";
 * const all = clientPointToFrames(svg, event.clientX, event.clientY);
 * console.log(all?.points.map((p) => `${p.provider}: ${p.x}, ${p.y}`), all?.zone);
 * ```
 */
export function clientPointToFrames(svg: SvgLike | Element, clientX: number, clientY: number, options: Omit<PointerOptions, "provider"> & { providers?: readonly (Frame | string)[] } = {}): (Omit<FieldPoint, "x" | "y" | "provider"> & { points: { provider: string; title: string; unit: string; x: number; y: number }[] }) | null {
  const found = find(svg);
  if (found === undefined) return null;
  const first = clientPointToField(svg, clientX, clientY, { ...options, provider: "surface" });
  if (first === null) return null;
  const list = options.providers ?? Object.values(FRAMES).filter((frame) => frame.sport === found.sport);
  const points = list.map((entry) => {
    const frame = typeof entry === "string" ? frameByName(entry) : entry;
    const [x, y] = fromSurface([[first.surface.x, first.surface.y]], { to: frame, size: sizeOf(found, options), attacking: options.attacking })[0];
    return { provider: frame.name, title: frame.title, unit: frame.unit, x, y };
  });
  const { x: _x, y: _y, provider: _provider, ...rest } = first;
  void _x;
  void _y;
  void _provider;
  return { ...rest, points };
}
