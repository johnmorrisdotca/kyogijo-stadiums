// The eye of the 3D view: where it looks from, and what that does to the scene. The scene is turned by `rotateZ(yaw)` about the vertical through its middle
// and then tipped back by `rotateX(pitch)`; a perspective on the container does the rest. Everything here is arithmetic on numbers, so the same view can be
// worked out in Node, tested, and handed to a stylesheet as one `transform`.
//
// CSS has x to the right, y down and z towards the eye, and the scene is built that way: the floor lies in the x-y plane facing the eye, heights are z.

/** How the scene is looked at: turned about the vertical (degrees, clockwise as the eye sees the floor), tipped back from straight overhead (degrees), and magnified. */
export interface TurnView {
  yaw: number;
  pitch: number;
  zoom: number;
}

/** The named viewpoints. */
export type TurnPreset = "overhead" | "broadcast" | "end" | "corner";

/** The viewpoints, in the order the controls and the number keys list them. */
export const TURN_PRESET_NAMES: readonly TurnPreset[] = ["overhead", "broadcast", "end", "corner"];

/**
 * The four viewpoints. `overhead` looks straight down; `broadcast` is the main camera, high on one side line and turned a little towards the near end so that the boards, the nets and the goals show their faces; `end` stands behind an end line, along the
 * surface, which is where a net, a goal or a basket is best seen; `corner` is low, from a corner, with the nearest net or goal in front.
 */
export const TURN_PRESETS: Readonly<Record<TurnPreset, TurnView>> = {
  overhead: { yaw: 0, pitch: 0, zoom: 1 },
  broadcast: { yaw: -20, pitch: 62, zoom: 1 },
  end: { yaw: -90, pitch: 68, zoom: 1 },
  corner: { yaw: -38, pitch: 70, zoom: 1 },
};

/** The same four for a long, narrow surface (a football field, a hockey rink): turned less, because a diagonal view would shrink it in the box. */
export const LONG_PRESETS: Readonly<Record<TurnPreset, TurnView>> = { ...TURN_PRESETS, broadcast: { yaw: -9, pitch: 62, zoom: 1 } };

/** The sports with surfaces more than twice as long as they are wide, whose viewpoints are `LONG_PRESETS`. */
const LONG_SPORTS: readonly string[] = ["nfl", "cfl", "ifaf", "nhl"];

/**
 * The same four for the net sports, whose net runs across the court: seen from the side line it is a stick, so the broadcast view stands high behind an end line, as a
 * television camera does, and the end-on view is lower behind it. The corner view is the same.
 */
export const NET_PRESETS: Readonly<Record<TurnPreset, TurnView>> = {
  overhead: TURN_PRESETS.overhead,
  broadcast: { yaw: -90, pitch: 54, zoom: 1 },
  end: { yaw: -90, pitch: 74, zoom: 1 },
  corner: TURN_PRESETS.corner,
};

/**
 * The same four for a curling sheet, which is ten times as long as it is wide: from the side it is a strip across the box, so the broadcast and the corner views
 * stay nearly square on to it, and the end view looks along it.
 */
export const CURLING_PRESETS: Readonly<Record<TurnPreset, TurnView>> = {
  overhead: TURN_PRESETS.overhead,
  broadcast: { yaw: 0, pitch: 62, zoom: 1 },
  end: { yaw: -90, pitch: 70, zoom: 1 },
  corner: { yaw: -24, pitch: 62, zoom: 1 },
};

/** The sports whose net runs across the court and whose viewpoints are `NET_PRESETS`. */
const NET_SPORTS: readonly string[] = ["tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "sepaktakraw", "teqball"];

/** The four viewpoints of a sport. */
export const presetsFor = (sport?: string): Readonly<Record<TurnPreset, TurnView>> => (sport === "curling" ? CURLING_PRESETS : sport !== undefined && NET_SPORTS.includes(sport) ? NET_PRESETS : sport !== undefined && LONG_SPORTS.includes(sport) ? LONG_PRESETS : TURN_PRESETS);

/** The view a mount opens on. */
export const TURN_DEFAULT: TurnPreset = "corner";

export const PITCH_MAX = 84;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 4;

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/** An angle in degrees brought to the range -180 to 180. */
export const wrap = (angle: number): number => ((((angle + 180) % 360) + 360) % 360) - 180;

/** A view held to what the controls allow: the pitch from overhead to 84 degrees, the zoom from half to four times. A number that is not one is left as it was. */
export function clampView(view: TurnView, fallback: TurnView = TURN_PRESETS[TURN_DEFAULT]): TurnView {
  const finite = (value: number, otherwise: number): number => (Number.isFinite(value) ? value : otherwise);
  return {
    yaw: wrap(finite(view.yaw, fallback.yaw)),
    pitch: clamp(finite(view.pitch, fallback.pitch), 0, PITCH_MAX),
    zoom: clamp(finite(view.zoom, fallback.zoom), ZOOM_MIN, ZOOM_MAX),
  };
}

/** The angle equal to `to` that is nearest to `from`, so that a change of view turns the short way round. */
export const nearest = (from: number, to: number): number => from + wrap(to - from);

/** The view a viewpoint name stands for in a sport, or `undefined` for a name that is not one. */
export const presetView = (name: string | undefined, sport?: string): TurnView | undefined => (name !== undefined && (TURN_PRESET_NAMES as readonly string[]).includes(name) ? { ...presetsFor(sport)[name as TurnPreset] } : undefined);

/** The name of the viewpoint a view is in a sport, or `undefined` when it is none of them (it has been turned by hand). */
export function presetOf(view: TurnView, sport?: string): TurnPreset | undefined {
  return TURN_PRESET_NAMES.find((name) => {
    const p = presetsFor(sport)[name];
    return Math.abs(wrap(view.yaw - p.yaw)) < 0.5 && Math.abs(view.pitch - p.pitch) < 0.5 && Math.abs(view.zoom - p.zoom) < 0.01;
  });
}

/** The steps of the keys and the buttons, in degrees, and the factor of a zoom step. A held Shift takes the larger. */
export const STEP = { yaw: 6, yawBig: 24, pitch: 4, pitchBig: 12, zoom: 1.2 } as const;

/** The view after a step of a key or a button. */
export function step(view: TurnView, change: { yaw?: number; pitch?: number; zoom?: number }): TurnView {
  return clampView({ yaw: view.yaw + (change.yaw ?? 0), pitch: view.pitch + (change.pitch ?? 0), zoom: view.zoom * (change.zoom ?? 1) });
}

/**
 * The view after a drag of the pointer by (dx, dy) pixels, `degreesPerPixel` apart: the surface is taken hold of, so a drag to the right carries the side nearest the eye to the right (the
 * yaw falls) and a drag down tips the top toward the eye (the pitch falls).
 */
export function drag(view: TurnView, dx: number, dy: number, tilt = true, degreesPerPixel = 0.4): TurnView {
  return clampView({ ...view, yaw: view.yaw - dx * degreesPerPixel, pitch: tilt ? view.pitch - dy * degreesPerPixel * 0.75 : view.pitch });
}

/** A box in the scene, in pixels from the scene's middle, the floor at `z0` and the highest thing at `z1`. */
export interface Box3 {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  z0: number;
  z1: number;
}

/** How a view is placed in a container: the scale (at a zoom of 1) that fits the scene, and where the middle of what is seen falls. */
export interface Placement {
  k: number;
  tx: number;
  ty: number;
}

const RAD = Math.PI / 180;

/** Where a point of the scene falls on the screen, in pixels from the middle of the container, when the scene is placed as given and the eye is `distance` pixels away. */
export function project(point: readonly [number, number, number], view: TurnView, at: Placement, distance: number): [number, number, number] {
  const k = at.k * view.zoom;
  const [x, y, z] = [point[0] * k, point[1] * k, point[2] * k];
  const yaw = view.yaw * RAD;
  const pitch = view.pitch * RAD;
  const x2 = x * Math.cos(yaw) - y * Math.sin(yaw);
  const y2 = x * Math.sin(yaw) + y * Math.cos(yaw);
  const y3 = y2 * Math.cos(pitch) - z * Math.sin(pitch);
  const z3 = y2 * Math.sin(pitch) + z * Math.cos(pitch);
  const X = x2 + at.tx;
  const Y = y3 + at.ty;
  // A point at or behind the eye cannot be seen: it is pushed to the edge of the world instead of flipping.
  const f = distance / Math.max(distance - z3, distance * 0.05);
  return [X * f, Y * f, f];
}

/** The corners of a box. */
const corners = (b: Box3): [number, number, number][] => [b.x0, b.x1].flatMap((x) => [b.y0, b.y1].flatMap((y) => [b.z0, b.z1].map((z): [number, number, number] => [x, y, z])));

/** The rectangle on the screen that a box covers. */
export function covered(b: Box3, view: TurnView, at: Placement, distance: number): { x0: number; y0: number; x1: number; y1: number } {
  const shown = corners(b).map((c) => project(c, view, at, distance));
  return { x0: Math.min(...shown.map((p) => p[0])), x1: Math.max(...shown.map((p) => p[0])), y0: Math.min(...shown.map((p) => p[1])), y1: Math.max(...shown.map((p) => p[1])) };
}

/**
 * The placement that fits the scene in a container of width `w` and height `h` pixels, centred, with `pad` of its width and height left round it. The
 * perspective bends the sum, so it is found by a few rounds of scaling and re-centring; six is plenty.
 */
export function fit(b: Box3, view: TurnView, w: number, h: number, distance: number, pad = 0.03): Placement {
  const at: Placement = { k: 0.5, tx: 0, ty: 0 };
  const flat = { ...view, zoom: 1 };
  for (let i = 0; i < 8; i += 1) {
    const r = covered(b, flat, at, distance);
    const cw = r.x1 - r.x0;
    const ch = r.y1 - r.y0;
    if (cw <= 0 || ch <= 0) break;
    at.k *= Math.min((w * (1 - 2 * pad)) / cw, (h * (1 - 2 * pad)) / ch);
    const c = covered(b, flat, at, distance);
    at.tx -= (c.x0 + c.x1) / 2;
    at.ty -= (c.y0 + c.y1) / 2;
  }
  return at;
}

/** A 4 by 4 matrix, as CSS writes it in `matrix3d`: sixteen numbers, a column after a column. */
export type Mat4 = readonly number[];

/** Two matrices as one: `b` first, then `a`. */
export function multiply(a: Mat4, b: Mat4): number[] {
  const out = new Array<number>(16).fill(0);
  for (let col = 0; col < 4; col += 1) for (let row = 0; row < 4; row += 1) for (let k = 0; k < 4; k += 1) out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
  return out;
}

const translation = (x: number, y: number, z: number): number[] => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];

/**
 * The matrix that puts a point of the scene on the screen for a view in a placement: the scene (whose middle is the origin) is scaled, turned about the vertical,
 * tipped back, shifted to where the fit puts it, and seen with a perspective `distance` pixels deep. This is `project`'s arithmetic as one matrix, so that an
 * element can be given its whole place in one `matrix3d` and need no 3D context of the browser's: a browser that draws nested 3D layers flat still draws it right.
 */
export function cameraMatrix(view: TurnView, at: Placement, distance: number): number[] {
  const k = at.k * view.zoom;
  const [yaw, pitch] = [view.yaw * RAD, view.pitch * RAD];
  const [cy, sy, cp, sp] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];
  const scale = [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1];
  const rotateZ = [cy, sy, 0, 0, -sy, cy, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const rotateX = [1, 0, 0, 0, 0, cp, sp, 0, 0, -sp, cp, 0, 0, 0, 0, 1];
  const eye = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / distance, 0, 0, 0, 1];
  let m = multiply(eye, translation(at.tx, at.ty, 0));
  m = multiply(m, rotateX);
  m = multiply(m, rotateZ);
  return multiply(m, scale);
}

const num = (value: number): string => String(Math.round(value * 10000) / 10000);

/** A matrix as the CSS `transform` that applies it. */
export const matrix3d = (m: Mat4): string => `matrix3d(${m.map(num).join(",")})`;

/** How far a point is from the eye's plane after the scene is turned and tipped, in pixels towards the eye: bigger is nearer. Planes are drawn far first. */
export function depthOf(point: readonly [number, number, number], view: TurnView, at: Placement): number {
  const k = at.k * view.zoom;
  const [x, y, z] = [point[0] * k, point[1] * k, point[2] * k];
  const yaw = view.yaw * RAD;
  const y2 = x * Math.sin(yaw) + y * Math.cos(yaw);
  return y2 * Math.sin(view.pitch * RAD) + z * Math.cos(view.pitch * RAD);
}

/** How far the eye is from the screen, in pixels, for a container: a long lens, so that the floor keeps its shape and the heights lean a little. */
export const eyeDistance = (w: number, h: number, lens = 1.7): number => lens * Math.max(w, h);
