// What the 3D view is built from: planes. A plane is a flat rectangle standing anywhere in space (a net, a backboard, a pane of glass, the two crossed
// strips that make a post), with a little SVG drawn on it. The floor is the drawing itself, flat at the height of the surface; everything that stands on it is a
// few planes, each placed by three vectors, so that the whole scene is a handful of elements and no model. Nothing here touches a page.
//
// The frame is the drawing's own: x along the surface and y across it, both in feet, as the SVG has them (y grows downwards on the page), and z the height
// above the surface, in feet, growing towards the eye of someone looking straight down.

/** A point or a direction: x, y, z in feet. */
export type V3 = readonly [number, number, number];

/** What a plane is a part of: it is the class of its element (`ky-up-<kind>`) and what a test finds it by. */
export type PartKind = "post" | "net" | "tape" | "antenna" | "board" | "glass" | "rim" | "stanchion" | "frame" | "goal" | "flag" | "stump" | "leg" | "table" | "pylon" | "wall" | "screen" | "pole" | "ground" | "target" | "seats" | "concourse" | "fascia" | "roof" | "banner" | "platform" | "rail" | "matedge" | "shrine" | "surround" | "chair" | "desk" | "card" | "sign";

/** One flat rectangle. Its own x runs along `u` (its whole length) and its own y along `v`; `o` is the corner both start from. `svg` is what is drawn on it, in feet along `u` and `v`. */
export interface Plane {
  /** A name that says what it is and where: `net`, `post-left`, `goal-right-back`. */
  id: string;
  kind: PartKind;
  o: V3;
  u: V3;
  v: V3;
  svg: string;
  /**
   * A plane that turns to face the eye, about the vertical through its middle: a scoreboard is read from wherever the view is. `u` and `v` give its size and its
   * place as it lies at a yaw of 0; `v` must be vertical.
   */
  billboard?: boolean;
  /**
   * A wall round the surface that gives way when it is between the eye and what it surrounds: the horizontal direction (x, y, a unit vector) that points from the surface out through the
   * wall. The nearer the eye is to that side, and the lower it is, the more the wall is cut away (see `fadeOf`), so that the court is never hidden behind its own glass.
   */
  shy?: readonly [number, number];
  /**
   * A plane that is the floor's own drawing seen through its rectangle, not a drawing of its own: the top of a raised platform (a dohyō's clay with its bales). The floor lies on the ground, so
   * that the ground round the platform stays low, and this plane lifts the part of it that is the platform's top to the platform's height. Its `u` and `v` must be flat and along x and y.
   */
  crop?: boolean;
  /** How much of a `shy` plane is left when it is cut away altogether: 0.08 when missing. A plane that others lie over on the screen (the steps of a gallery) takes less, so that they do not add up to a veil. */
  fadeTo?: number;
  /** How low the eye must be for a `shy` plane to begin to give way: the share (of the plane's side being towards the eye, times the sine of the pitch) at which the fade starts; 0.1 when missing. A low barrier takes a high one, so that it stays whole until the eye is nearly level with it. */
  fadeAt?: number;
}

/** What stands on the surface as a thing a reader would name: a net, a basket, a goal, a pair of posts. */
export type UprightKind = "scoreboard" | "net" | "antennae" | "goalposts" | "netposts" | "hoop" | "goal" | "boards" | "stumps" | "pylons" | "flags" | "fence" | "backstop" | "foul-poles" | "table-legs" | "walls" | "starting-blocks" | "backstroke-flags" | "false-start-rope" | "springboards" | "platforms" | "judges-stand" | "hurdles" | "steeplechase" | "high-jump" | "pole-vault" | "cage" | "padding" | "rink-boards" | "mound" | "azuchi" | "targets" | "stands" | "wall-seats" | "roof" | "gallery" | "dais" | "banner" | "shrine" | "mat-edge" | "surrounds" | "officials" | "judges";

/** A thing that stands on the surface: where, how high, and the planes it is made of. */
export interface Upright {
  id: string;
  kind: UprightKind;
  /** Where it stands on the surface, in feet. */
  at: readonly [number, number];
  /** The height of its top above the surface, in feet. */
  height: number;
  /** A second height worth saying (a net's height at the centre, a post's crossbar), in feet. */
  low?: number;
  planes: Plane[];
}

/** The four numbers a plane's SVG needs: its length along `u` and along `v`, in feet. */
export const size = (p: Pick<Plane, "u" | "v">): [number, number] => [Math.hypot(...p.u), Math.hypot(...p.v)];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const times = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const length = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: V3): V3 => {
  const n = length(a);
  return n === 0 ? [0, 0, 0] : [a[0] / n, a[1] / n, a[2] / n];
};
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A number for markup: millimetres of a foot, no more. */
export const n = (value: number): string => String(Math.round(value * 1000) / 1000);

/** A billboard turned to face an eye whose view is turned `yaw` degrees: its width runs along the screen's x, which in the scene is (cos yaw, -sin yaw, 0). */
export function facing(p: Plane, yaw: number): Plane {
  if (p.billboard !== true) return p;
  const [w, h] = size(p);
  const a = (yaw * Math.PI) / 180;
  const u: V3 = [w * Math.cos(a), -w * Math.sin(a), 0];
  const middle: V3 = [p.o[0] + (p.u[0] + p.v[0]) / 2, p.o[1] + (p.u[1] + p.v[1]) / 2, p.o[2] + (p.u[2] + p.v[2]) / 2];
  const v: V3 = [0, 0, p.v[2] < 0 ? -h : h];
  return { ...p, o: [middle[0] - (u[0] + v[0]) / 2, middle[1] - (u[1] + v[1]) / 2, middle[2] - (u[2] + v[2]) / 2], u, v };
}

/** A plane. */
export const plane = (id: string, kind: PartKind, o: V3, u: V3, v: V3, svg: string): Plane => ({ id, kind, o, u, v, svg });

/**
 * A rectangle standing upright over a line on the surface, from (x0, y0) to (x1, y1), between the heights z0 and z1. Its own y runs down from z1, so
 * that what is drawn on it hangs from the top as a net does.
 */
export function wall(id: string, kind: PartKind, x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, svg: string): Plane {
  return plane(id, kind, [x0, y0, z1], [x1 - x0, y1 - y0, 0], [0, 0, z0 - z1], svg);
}

/** A rectangle lying flat at the height `z`, from (x0, y0) to (x1, y1). */
export function flat(id: string, kind: PartKind, x0: number, y0: number, x1: number, y1: number, z: number, svg: string): Plane {
  return plane(id, kind, [x0, y0, z], [x1 - x0, 0, 0], [0, y1 - y0, 0], svg);
}

/**
 * A strip of width `w` along the line from `a` to `b`: a post, a crossbar, an arm. A single strip vanishes when the eye is level with it, so it is two,
 * crossed, one the width of the other's thickness. `paint` draws on each (its length along the line and its width), a plain strip in `cls` if it is missing.
 */
export function bar(id: string, kind: PartKind, a: V3, b: V3, w: number, cls: string, paint?: (long: number, wide: number) => string): Plane[] {
  const d = sub(b, a);
  const long = length(d);
  if (long === 0) return [];
  const along = unit(d);
  // A line that is nearly upright is crossed with the x axis; any other with the upright, so that no strip lies edge-on to a cross strip.
  const first = Math.abs(along[2]) > 0.98 ? ([1, 0, 0] as V3) : unit(cross(along, [0, 0, 1]));
  const second = unit(cross(along, first));
  const drawn = paint === undefined ? `<rect width="${n(long)}" height="${n(w)}" class="${cls}"/>` : paint(long, w);
  return [first, second].map((side, i) => plane(`${id}${i === 0 ? "" : "-x"}`, kind, sub(a, times(side, w / 2)), d, times(side, w), drawn));
}

/** An upright strip from the surface up to the height `top`. */
export const pole = (id: string, kind: PartKind, x: number, y: number, z0: number, z1: number, w: number, cls: string, paint?: (long: number, wide: number) => string): Plane[] => bar(id, kind, [x, y, z0], [x, y, z1], w, cls, paint);

/** The lines of a net's mesh over a rectangle w by h feet, one every `cell` feet each way: a path. */
export function mesh(w: number, h: number, cell: number): string {
  const across = Math.max(1, Math.round(w / cell));
  const down = Math.max(1, Math.round(h / cell));
  let d = "";
  for (let i = 1; i < across; i += 1) d += `M${n((w * i) / across)} 0V${n(h)}`;
  for (let j = 1; j < down; j += 1) d += `M0 ${n((h * j) / down)}H${n(w)}`;
  return d;
}

/** The mesh of a net as a path element: threads a tenth of a cell thick. */
export const threads = (d: string, cell: number): string => `<path d="${d}" class="u-mesh" fill="none" stroke-width="${n(Math.max(cell * 0.09, 0.02))}"/>`;

/** A closed outline of points, as a path. */
export const polygon = (points: readonly (readonly [number, number])[]): string => `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`;

/** A point `t` of the way from `a` to `b`. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * The least thickness, in feet, of anything drawn thin on a surface this big: a post of 3 inches on a 500-foot ground would be a hair, so every strip and every
 * line is at least a thousandth of the surface's diagonal.
 */
export const thinnest = (w: number, h: number): number => Math.hypot(w, h) * 0.0012;

/** A wall plane marked to give way: its outward direction is the way the wall faces away from `centre` (x, y in feet), which is where the surface's middle is. */
export function shy(p: Plane, centre: readonly [number, number]): Plane {
  // The plane stands over a line on the surface: the horizontal part of `u` (or of `v` for one lying down) is that line, and its normal in the surface is the way out or the way in.
  const line: readonly [number, number] = Math.hypot(p.u[0], p.u[1]) >= Math.hypot(p.v[0], p.v[1]) ? [p.u[0], p.u[1]] : [p.v[0], p.v[1]];
  const length = Math.hypot(line[0], line[1]);
  if (length === 0) return p;
  let normal: [number, number] = [-line[1] / length, line[0] / length];
  const middle: [number, number] = [p.o[0] + (p.u[0] + p.v[0]) / 2, p.o[1] + (p.u[1] + p.v[1]) / 2];
  if (normal[0] * (middle[0] - centre[0]) + normal[1] * (middle[1] - centre[1]) < 0) normal = [-normal[0], -normal[1]];
  return { ...p, shy: normal };
}

/**
 * How much of a wall is left (1 whole, down to 0.08) at a view: none is cut away unless the wall is on the eye's side of the surface, and then more the lower the eye is, because a wall seen
 * from straight above hides nothing. `yaw` and `pitch` are the view's, in degrees.
 */
export function fadeOf(p: Pick<Plane, "shy" | "fadeTo" | "fadeAt">, yaw: number, pitch: number): number {
  if (p.shy === undefined) return 1;
  const a = (yaw * Math.PI) / 180;
  // The horizontal direction from the surface to the eye (the same sum as the depth of a point).
  const toward = p.shy[0] * Math.sin(a) + p.shy[1] * Math.cos(a);
  const hides = toward * Math.sin((pitch * Math.PI) / 180);
  const from = p.fadeAt ?? 0.1;
  const t = Math.min(1, Math.max(0, (hides - from) / 0.25));
  return Math.round((1 - (1 - (p.fadeTo ?? 0.08)) * t) * 1000) / 1000;
}

/** A rectangle on the surface, in feet: its corners. */
export type Rect = { x0: number; y0: number; x1: number; y1: number };

/** A rectangle from its corner and its size. */
export const rect = (x: number, y: number, w: number, h: number): Rect => ({ x0: x, y0: y, x1: x + w, y1: y + h });

/** A solid box on the floor: four sides up to `z1` and a flat top. `cls` paints the top; the sides are one tone darker (`cls-side`). */
export function box(id: string, kind: Plane["kind"], r: Rect, z1: number, cls: string): Plane[] {
  const sides: [number, number, number, number][] = [[r.x0, r.y0, r.x1, r.y0], [r.x1, r.y0, r.x1, r.y1], [r.x1, r.y1, r.x0, r.y1], [r.x0, r.y1, r.x0, r.y0]];
  const planes = sides.map(([a, b, c, d], i) => wall(`${id}-${i + 1}`, kind, a, b, c, d, 0, z1, `<rect width="${n(Math.hypot(c - a, d - b))}" height="${n(z1)}" class="${cls}-side"/>`));
  planes.push(flat(`${id}-top`, kind, r.x0, r.y0, r.x1, r.y1, z1, `<rect width="${n(r.x1 - r.x0)}" height="${n(r.y1 - r.y0)}" class="${cls}"/>`));
  return planes;
}
