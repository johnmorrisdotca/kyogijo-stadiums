// Coordinate frames: where a data provider puts a point on a surface. A provider's x and y have their own unit, origin, direction
// and range (the NHL's centre-ice feet, HockeyTech's 600 by 300 canvas, the NBA's tenths of a foot from the hoop); a drawing's
// surface is in feet (see `SURFACE_EXTENT`). A `Frame` says how each axis of a provider lies on the surface as a few landmarks
// (a value in the provider's frame, the place it falls on the surface in feet), and the mapping between landmarks is straight
// lines. `toSurface` and `fromSurface` use it, `convert` goes from one provider's frame to another's through the surface.
//
// This file is the machinery and the registry. The providers of the ice, the court, the gridiron and the diamond are in
// frames.providers.ts, each with the page it was read from in docs/sources.md; a provider of another sport registers its own
// frame with `registerFrame`.
import { surfaceSize, type SizedSport } from "./geometry.ts";
import type { Sport } from "./types.ts";
import { convertLength, isUnit, type Point, type Unit } from "./units.ts";

/** A value on one axis of a provider's frame and the place it falls on the surface, in feet. */
export type Landmark = readonly [frame: number, surface: number];

/**
 * How a frame lies on a surface: the landmarks of its x axis and of its y axis. Two landmarks make a straight, scaled
 * mapping; more make one that bends at each (a pitch whose penalty box is drawn at the provider's own figures, whatever
 * the pitch's size). Values beyond the first and last landmark continue on the nearest line.
 */
export interface FrameMap {
  x: readonly Landmark[];
  y: readonly Landmark[];
  /** The frame's x runs across the surface and its y along it (the NBA's `LOC_X` is across the court). The landmarks of x then give the surface's y. */
  swap?: boolean;
}

/** The size of a surface that varies, in a unit (feet by default). `length` runs from end to end, `width` across. */
export interface SurfaceSize {
  length: number;
  width: number;
  unit?: Unit;
}

/** The unit of a frame's numbers: a length, or what a provider's own scale is. */
export type FrameUnit = Unit | "px" | "tenth-ft" | "percent";

/** The ends of a surface and what a frame says about them. */
export type Ends =
  | "fixed" // the numbers are where a point is on the surface: which end a team attacks varies (the NHL's x, nflverse's x)
  | "shooter" // the numbers are measured from the basket or goal being attacked, so a half-court point lies at the attacked end
  | "none"; // a surface with no ends to attack (baseball)

/** A provider's coordinate frame. */
export interface Frame {
  /** The key it is registered under: `nhl-api`. */
  name: string;
  /** What it is called in words: "NHL API play-by-play". */
  title: string;
  /** The surface it is for: one of `SPORTS`, or another sport's name for a frame of a surface made elsewhere. */
  sport: Sport | (string & {});
  /** The unit of its numbers. */
  unit: FrameUnit;
  /** The range of x and of y the provider uses, `[least, greatest]`. */
  x: readonly [number, number];
  y: readonly [number, number];
  /** Where (0, 0) lies, in words: "centre ice", "the back point of home plate", "the top left corner". */
  origin: string;
  /** Which way y grows on the page: `up` (towards the top as the surface is drawn, wide) or `down`. */
  yDirection: "up" | "down";
  /** A fixed frame fits one size of surface; a variable one needs the size of the surface it is placed on. */
  size: "fixed" | "variable";
  /** Whether the numbers belong to the surface or to the end a team is attacking. */
  ends: Ends;
  /** The landmarks, or for a variable frame a function of the surface's size (in feet). */
  landmarks: FrameMap | ((size: { length: number; width: number }) => FrameMap);
  /** The name of the source this frame was read from, in docs/sources.md. */
  source: string;
  /** What a reader should know that the other fields do not say. */
  note?: string;
}

/** A straight mapping between two values and back. */
export interface Mapper {
  /** A value on the provider's axis as a place on the surface. */
  forward(value: number): number;
  /** A place on the surface as a value on the provider's axis. */
  inverse(value: number): number;
}

const finite = (value: number): boolean => Number.isFinite(value);

/**
 * A piecewise-linear mapper through landmarks: between two landmarks a straight line, beyond the ends the line of the
 * nearest pair. The frame values must differ and the surface values must all rise or all fall, or the mapping could not be
 * undone. Reuse it for a frame whose axis bends at its landmarks.
 * @example
 * ```ts
 * import { piecewise } from "@johnmorrisdotca/kyogijo/frames";
 * // A pitch drawn 0 to 100 whose halfway line is at 52.5 metres of a 105-metre pitch.
 * const along = piecewise([[0, 0], [50, 172.2], [100, 344.5]]);
 * console.log(along.forward(25), along.inverse(172.2));
 * // 86.1 50
 * ```
 */
export function piecewise(landmarks: readonly Landmark[]): Mapper {
  if (landmarks.length < 2) throw new RangeError("a mapping needs two landmarks at least");
  for (const [a, b] of landmarks) if (!finite(a) || !finite(b)) throw new RangeError("a landmark's numbers must be finite");
  const points = [...landmarks].sort((p, q) => p[0] - q[0]);
  for (let i = 1; i < points.length; i += 1) if (points[i][0] === points[i - 1][0]) throw new RangeError(`two landmarks stand at ${points[i][0]} in the frame`);
  const rising = points[1][1] > points[0][1];
  for (let i = 1; i < points.length; i += 1) if (points[i][1] === points[i - 1][1] || points[i][1] > points[i - 1][1] !== rising) throw new RangeError("landmarks must all rise or all fall on the surface");
  const along = (list: readonly Landmark[], index: 0 | 1, value: number): number => {
    const other = index === 0 ? 1 : 0;
    let k = 0;
    while (k < list.length - 2 && value > list[k + 1][index]) k += 1;
    const [a0, b0] = [list[k][index], list[k][other]];
    const [a1, b1] = [list[k + 1][index], list[k + 1][other]];
    return b0 + ((value - a0) * (b1 - b0)) / (a1 - a0);
  };
  const bySurface = [...points].sort((p, q) => p[1] - q[1]);
  return { forward: (value) => along(points, 0, value), inverse: (value) => along(bySurface, 1, value) };
}

/** Two landmarks as a straight mapping: `span(0, 600, 0, 200)` puts 0 at 0 feet and 600 at 200 feet. */
export const span = (frameA: number, frameB: number, surfaceA: number, surfaceB: number): Landmark[] => [[frameA, surfaceA], [frameB, surfaceB]];

/** Every frame by its name. `registerFrame` adds to it; the providers in frames.providers.ts are in it from the start. */
export const FRAMES: Record<string, Frame> = {};

/**
 * Add a frame to `FRAMES` so that `toSurface`, `fromSurface` and `convert` take it by name. A name already taken is an
 * error unless `replace` says it is meant. Returns the frame.
 * @example
 * ```ts
 * import { FRAMES, registerFrame, toSurface } from "@johnmorrisdotca/kyogijo/frames";
 * registerFrame({
 *   name: "my-rink-grid", title: "A rink in tenths of a foot", sport: "nhl", unit: "tenth-ft", x: [-1000, 1000], y: [-425, 425],
 *   origin: "centre ice", yDirection: "up", size: "fixed", ends: "fixed", source: "my own data",
 *   landmarks: { x: [[-1000, 0], [1000, 200]], y: [[-425, 85], [425, 0]] },
 * });
 * console.log(toSurface([[0, 0]], { from: "my-rink-grid" })[0], Object.keys(FRAMES).includes("my-rink-grid"));
 * // [ 100, 42.5 ] true
 * ```
 */
export function registerFrame(frame: Frame, replace = false): Frame {
  if (typeof frame.name !== "string" || frame.name === "") throw new RangeError("a frame needs a name");
  if (!replace && Object.prototype.hasOwnProperty.call(FRAMES, frame.name)) throw new RangeError(`a frame named "${frame.name}" is registered already`);
  if (frame.size === "fixed" && typeof frame.landmarks === "function") throw new RangeError(`the fixed frame "${frame.name}" has its landmarks as a function`);
  if (frame.size === "variable" && typeof frame.landmarks !== "function") throw new RangeError(`the variable frame "${frame.name}" needs its landmarks as a function of the surface's size`);
  FRAMES[frame.name] = frame;
  return frame;
}

/** The frame with a name, or an error that lists the names. */
export function frameByName(name: string): Frame {
  if (!Object.prototype.hasOwnProperty.call(FRAMES, name)) throw new RangeError(`Unknown frame "${name}": use one of ${Object.keys(FRAMES).join(", ")}`);
  return FRAMES[name];
}

const resolve = (frame: Frame | string): Frame => (typeof frame === "string" ? frameByName(frame) : frame);

/** The frames of a sport, in the order they were registered. */
export const framesOf = (sport: string): Frame[] => Object.values(FRAMES).filter((frame) => frame.sport === sport);

/** The end a team is attacking: the end to the `right` of the surface as it is drawn wide, or the `left`. */
export type Attacking = "left" | "right";

/** Where points are put, and in what: what every function of this file takes besides the points. */
export interface PlaceOptions {
  /** The surface's size when the frame is variable, or to use another size than the sport's. */
  size?: SurfaceSize;
  /** The end the points' team is attacking, as the surface is drawn wide: `left` turns the points a half turn about the middle so that the team attacks right. */
  attacking?: Attacking;
  /** The unit of the surface's numbers: feet when missing. Anchors and limits are in it too. */
  units?: Unit;
  /** Landmarks of your own for an axis, in place of the frame's: the frame's value and the surface's, which is in `units`. For a venue whose markings the frame's figures do not fit. */
  anchors?: { x?: readonly Landmark[]; y?: readonly Landmark[] };
  /** Keep the points on the surface (`"surface"`), or inside a box of your own, `[least, greatest]` for each of the surface's x and y, in `units`. */
  limits?: "surface" | { x?: readonly [number, number]; y?: readonly [number, number] };
}

const unitOf = (units: Unit | undefined): Unit => {
  if (units === undefined) return "ft";
  if (!isUnit(units)) throw new RangeError(`Unknown units "${String(units)}": use one of yd, m, ft, in, cm, mm`);
  return units;
};

/** The length and the width of the surface a frame is placed on, in feet. */
function extentOf(frame: Frame, size: SurfaceSize | undefined): { length: number; width: number } {
  if (size !== undefined) {
    const unit = unitOf(size.unit);
    if (!(size.length > 0) || !(size.width > 0)) throw new RangeError("a surface's length and width must be more than nothing");
    return { length: convertLength(size.length, unit, "ft"), width: convertLength(size.width, unit, "ft") };
  }
  if (frame.size === "variable") throw new RangeError(`The frame "${frame.name}" is for a surface of any size: give the size`);
  if (frame.sport === "mlb") return { length: 0, width: 0 };
  const known = surfaceSize(frame.sport as SizedSport, "ft");
  return { length: known.length, width: known.width };
}

interface Placed {
  frame: Frame;
  x: Mapper;
  y: Mapper;
  swap: boolean;
  half: ((p: [number, number]) => [number, number]) | undefined;
  unit: Unit;
  limits: ((p: [number, number]) => [number, number]) | undefined;
}

function place(frameOrName: Frame | string, o: PlaceOptions): Placed {
  const frame = resolve(frameOrName);
  const unit = unitOf(o.units);
  const extent = extentOf(frame, o.size);
  const map = typeof frame.landmarks === "function" ? frame.landmarks(extent) : frame.landmarks;
  const inFeet = (list: readonly Landmark[] | undefined, fallback: readonly Landmark[]): readonly Landmark[] => (list === undefined ? fallback : list.map(([a, b]): Landmark => [a, convertLength(b, unit, "ft")]));
  const x = piecewise(inFeet(o.anchors?.x, map.x));
  const y = piecewise(inFeet(o.anchors?.y, map.y));
  let half: Placed["half"];
  if (o.attacking !== undefined && o.attacking !== "left" && o.attacking !== "right") throw new RangeError(`attacking is "left" or "right", not "${String(o.attacking)}"`);
  if (o.attacking === "left") {
    if (frame.ends === "none") throw new RangeError(`The frame "${frame.name}" is for a surface with no ends to attack`);
    half = ([px, py]) => [extent.length - px, extent.width - py];
  }
  let limits: Placed["limits"];
  if (o.limits !== undefined) {
    const feet = (range: readonly [number, number] | undefined): [number, number] | undefined => (range === undefined ? undefined : [convertLength(range[0], unit, "ft"), convertLength(range[1], unit, "ft")]);
    const bx = o.limits === "surface" ? ([0, extent.length] as [number, number]) : feet(o.limits.x);
    const by = o.limits === "surface" ? ([0, extent.width] as [number, number]) : feet(o.limits.y);
    const hold = (value: number, range: [number, number] | undefined): number => (range === undefined ? value : Math.min(Math.max(value, Math.min(...range)), Math.max(...range)));
    limits = ([px, py]) => [hold(px, bx), hold(py, by)];
  }
  return { frame, x, y, swap: map.swap === true, half, unit, limits };
}

/** One point of a frame as a place on the surface, in feet, before any half turn, limit or unit. */
function forward(p: Placed, [fx, fy]: Point): [number, number] {
  return p.swap ? [p.y.forward(fy), p.x.forward(fx)] : [p.x.forward(fx), p.y.forward(fy)];
}

function backward(p: Placed, [sx, sy]: Point): [number, number] {
  return p.swap ? [p.x.inverse(sy), p.y.inverse(sx)] : [p.x.inverse(sx), p.y.inverse(sy)];
}

function checked(points: readonly Point[]): void {
  if (!Array.isArray(points)) throw new TypeError("points are a list of [x, y]");
  for (const point of points) if (!Array.isArray(point) || point.length < 2 || !finite(point[0]) || !finite(point[1])) throw new TypeError("a point is [x, y], two finite numbers");
}

/**
 * Points in a provider's frame as places on the surface: feet in the drawing's own landscape frame (x along the surface from
 * the left, y across it from the top; a ballpark's x is across it, y the distance out from home plate, minus). Pass
 * `units` for another unit, `attacking: "left"` to turn points that attack the left a half turn so that they attack the
 * right, `anchors` for landmarks of your own and `limits` to keep them on the surface.
 * @example
 * ```ts
 * import { toSurface } from "@johnmorrisdotca/kyogijo/frames";
 * // The NHL API's centre ice is the middle of the rink; its (69, 22) is the right end-zone face-off dot.
 * console.log(toSurface([[0, 0], [69, 22]], { from: "nhl-api" }));
 * // [ [ 100, 42.5 ], [ 169, 20.5 ] ]
 * ```
 */
export function toSurface(points: readonly Point[], options: PlaceOptions & { from: Frame | string }): [number, number][] {
  checked(points);
  const p = place(options.from, options);
  return points.map((point) => {
    let q = forward(p, point);
    if (p.half !== undefined) q = p.half(q);
    if (p.limits !== undefined) q = p.limits(q);
    return [convertLength(q[0], "ft", p.unit), convertLength(q[1], "ft", p.unit)];
  });
}

/**
 * Places on the surface as points in a provider's frame: the undoing of `toSurface`, with the same options. The places are in
 * `units` (feet by default).
 * @example
 * ```ts
 * import { fromSurface } from "@johnmorrisdotca/kyogijo/frames";
 * // The right end-zone face-off dot of an NHL rink, as the NHL API writes it.
 * console.log(fromSurface([[169, 20.5]], { to: "nhl-api" }));
 * // [ [ 69, 22 ] ]
 * ```
 */
export function fromSurface(points: readonly Point[], options: PlaceOptions & { to: Frame | string }): [number, number][] {
  checked(points);
  const p = place(options.to, options);
  return points.map((point) => {
    let q: [number, number] = [convertLength(point[0], p.unit, "ft"), convertLength(point[1], p.unit, "ft")];
    if (p.limits !== undefined) q = p.limits(q);
    if (p.half !== undefined) q = p.half(q);
    return backward(p, q);
  });
}

/** What `convert` takes besides the two frames. */
export interface ConvertOptions {
  /** The surface's size when a frame is variable. */
  size?: SurfaceSize;
  /** The end the points' team attacks in the first frame's numbers, and the end it is to attack in the second's. Right for both when missing. */
  attacking?: Attacking;
  toAttacking?: Attacking;
}

/**
 * A function that turns points from one provider's frame into another's through the surface. Both frames are of one sport.
 * @example
 * ```ts
 * import { convert } from "@johnmorrisdotca/kyogijo/frames";
 * // HockeyTech's canvas to the NHL API's feet: its middle, (300, 150), is centre ice.
 * const toNhl = convert("hockeytech", "nhl-api");
 * console.log(toNhl([[300, 150], [600, 0]]));
 * // [ [ 0, 0 ], [ 100, 42.5 ] ]
 * ```
 */
export function convert(from: Frame | string, to: Frame | string, options: ConvertOptions = {}): (points: readonly Point[]) => [number, number][] {
  const a = resolve(from);
  const b = resolve(to);
  if (a.sport !== b.sport) throw new RangeError(`"${a.name}" is a frame of ${a.sport} and "${b.name}" of ${b.sport}: they share no surface`);
  return (points) => {
    const onSurface = toSurface(points, { from: a, size: options.size, attacking: options.attacking });
    return fromSurface(onSurface, { to: b, size: options.size, attacking: options.toAttacking });
  };
}

/** Points converted from one frame to another at once: `convert(from, to, options)(points)`. */
export const convertPoints = (points: readonly Point[], from: Frame | string, to: Frame | string, options: ConvertOptions = {}): [number, number][] => convert(from, to, options)(points);

/**
 * Turn points a half turn about the middle of a surface: where they are when the same play is drawn attacking the other end.
 * @example
 * ```ts
 * import { flipEnds } from "@johnmorrisdotca/kyogijo/frames";
 * console.log(flipEnds([[169, 20.5]], { length: 200, width: 85 }));
 * // [ [ 31, 64.5 ] ]
 * ```
 */
export function flipEnds(points: readonly Point[], size: { length: number; width: number }): [number, number][] {
  checked(points);
  return points.map(([x, y]) => [size.length - x, size.width - y]);
}

/** How many times the teams have changed ends before a period, by the rules of the sport. */
const ENDS_CHANGED: Partial<Record<string, (period: number) => number | undefined>> = {
  // Teams change ends after every period of hockey, overtime included.
  nhl: (period) => period - 1,
  // Teams change goals after the first and the third quarters; an overtime period's ends are not settled by that rule.
  nfl: (period) => [0, 1, 1, 2][period - 1],
  cfl: (period) => [0, 1, 1, 2][period - 1],
  ifaf: (period) => [0, 1, 1, 2][period - 1],
  // Teams change baskets for the second half, and an overtime period is part of it.
  nba: (period) => (period < 1 ? undefined : period <= 2 ? 0 : 1),
};

/**
 * The end a team attacks in a period, given the end it attacked in the first: hockey changes ends every period, football
 * after the first and the third quarters, basketball at the half (overtime keeps the half's ends). For a period a rule does
 * not settle, or a sport with no rule here, pass `changedAfter`: the periods after which the teams change ends.
 * @example
 * ```ts
 * import { attackingIn } from "@johnmorrisdotca/kyogijo/frames";
 * console.log([1, 2, 3].map((period) => attackingIn("nhl", period, "right")));
 * // [ 'right', 'left', 'right' ]
 * ```
 */
export function attackingIn(sport: string, period: number, first: Attacking, changedAfter?: readonly number[]): Attacking {
  if (!Number.isInteger(period) || period < 1) throw new RangeError("a period is a whole number from 1");
  let changes: number | undefined;
  if (changedAfter !== undefined) changes = changedAfter.filter((after) => after < period).length;
  else changes = ENDS_CHANGED[sport]?.(period);
  if (changes === undefined) throw new RangeError(`No rule here says which end is attacked in period ${period} of ${sport}: pass changedAfter`);
  return changes % 2 === 0 ? first : first === "right" ? "left" : "right";
}
