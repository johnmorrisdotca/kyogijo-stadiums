// The path of the fly-through, as plain numbers: where the camera is at any moment of one smooth run from a map to an arena. The camera is a handful of channels (how far
// in it is, where the arena stands on the screen, how the map is turned, how much of each layer shows, and the 3D view's turn, tip and zoom); the path is a short list of
// keyframes in time, and every channel runs through them as a monotone cubic (Fritsch and Carlson), so that it is smooth where it passes a keyframe (the speed does not jump),
// never overshoots between two (a layer's opacity stays between 0 and 1), and is still at its first keyframe. Nothing here touches a page: the same path can be worked out in
// Node, tested frame by frame, and handed to the mount, which draws it.
import { LONG_PRESETS, presetView } from "./turn.camera.ts";

/** The stages of the fly-through, in order. */
export type StageId = "map" | "city" | "arena";

/** The stages that exist, in the order of the path. */
export const STAGE_IDS: readonly StageId[] = ["map", "city", "arena"];

/** The channels of the camera. */
export const CHANNELS = ["logSpan", "ax", "ay", "north", "map", "site", "arena", "yaw", "pitch", "logZoom"] as const;
export type Channel = (typeof CHANNELS)[number];

/**
 * Where the camera is. `logSpan` is the natural logarithm of the metres the container's width shows (so that a zoom is a straight line); `ax` and `ay` are where the arena stands on the screen, as a
 * share of the width and of the height from the middle; `north` is how far the map and the site plan are turned, in degrees clockwise (the rink's long side lies along the page when it reaches the
 * venue's); `map`, `site` and `arena` are how much of the map, of the site plan and of the 3D arena shows (0 to 1); `yaw`, `pitch` and `logZoom` are the 3D view's turn and tip in degrees and the natural logarithm of its zoom.
 */
export type Camera = Record<Channel, number>;

/** What the path needs to know of the page and the venue. */
export interface FlightInput {
  /** How far the venue's plan is turned from north-up, in degrees clockwise (`venueOrientation(venue).north`). */
  north: number;
  /** The metres the container's width shows when the 3D arena seen from straight above is as large as the site plan is: where the plan hands over to the 3D arena. */
  siteSpan: number;
  /** The metres the width shows at the start, on the map. 9,000 km by default. */
  startSpan?: number;
  /** The metres the width shows when the camera reaches the city. Eight times the site span, and at least 1.5 km, by default. */
  citySpan?: number;
  /** Where the arena stands on the screen at the start and at the 3D arena, as shares of the width and the height from the middle: `[0, 0]` for both by default. */
  anchorStart?: readonly [number, number];
  anchorEnd?: readonly [number, number];
  /** The stages to fly, in the order of the path (the others are left out, and the camera goes from where the stage before them ended): all by default. */
  stages?: readonly StageId[];
  /** The 3D view the arena settles in: the sport's main camera by default. */
  view?: { yaw: number; pitch: number };
  /** Degrees a second the arena turns at, once it is turning: 12 by default. */
  turn?: number;
}

/** A keyframe: the camera at a moment, and where it must be going where that is not what the neighbours say. */
export interface Keyframe {
  t: number;
  camera: Camera;
  /** Channels' speeds (units a second) to pass through this keyframe at, in place of the monotone cubic's own. */
  slope?: Partial<Camera>;
}

/** A path: the keyframes, where each stage starts, and what happens after the last keyframe. */
export interface Flight {
  keys: readonly Keyframe[];
  /** The stages flown and the time each starts at, in order. */
  stages: readonly { id: StageId; start: number }[];
  /** The time of the last keyframe. */
  end: number;
  /** After `end`, the arena goes on turning at this many degrees a second (negative: the near side goes to the right), and nothing else moves. */
  tail: number;
  /** The camera of each stage at rest: what a reader who prefers reduced motion is shown (one layer, nothing half-faded). */
  rest: Readonly<Record<StageId, Camera>>;
  input: Required<Pick<FlightInput, "north" | "siteSpan" | "startSpan" | "citySpan" | "turn">> & { anchorStart: readonly [number, number]; anchorEnd: readonly [number, number]; view: { yaw: number; pitch: number } };
}

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Zero to one with a zero slope at both ends. */
export const smooth = (t: number): number => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};

/** An angle in degrees brought to the range -180 to 180. */
const wrap180 = (angle: number): number => ((((angle + 180) % 360) + 360) % 360) - 180;

/**
 * The speeds a monotone cubic passes the keyframes of one channel at: zero at both ends and where the neighbours' slopes change sign (a plateau or a turning point), else the weighted harmonic mean of the
 * two slopes (Fritsch and Butland), which keeps every piece between its two values.
 */
export function monotoneSlopes(t: readonly number[], y: readonly number[]): number[] {
  const n = t.length;
  const d = new Array<number>(n).fill(0);
  if (n < 3) return d;
  const h = t.slice(1).map((time, i) => time - t[i]);
  const delta = h.map((step, i) => (y[i + 1] - y[i]) / step);
  for (let k = 1; k < n - 1; k += 1) {
    if (delta[k - 1] * delta[k] <= 0) continue;
    const w1 = 2 * h[k] + h[k - 1];
    const w2 = h[k] + 2 * h[k - 1];
    d[k] = (w1 + w2) / (w1 / delta[k - 1] + w2 / delta[k]);
  }
  return d;
}

/** The cubic Hermite of one channel at `time`, through its keyframes with these slopes. Outside the keyframes it is the first or the last value. */
function hermite(times: readonly number[], values: readonly number[], slopes: readonly number[], time: number): number {
  const last = times.length - 1;
  if (time <= times[0]) return values[0];
  if (time >= times[last]) return values[last];
  let i = 0;
  while (i < last - 1 && time >= times[i + 1]) i += 1;
  const h = times[i + 1] - times[i];
  const s = (time - times[i]) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * values[i] + (s3 - 2 * s2 + s) * h * slopes[i] + (-2 * s3 + 3 * s2) * values[i + 1] + (s3 - s2) * h * slopes[i + 1];
}

/** The speeds of every channel at every keyframe, worked out once for a path. */
const SLOPES = new WeakMap<readonly Keyframe[], Record<Channel, number[]>>();
function slopesOf(keys: readonly Keyframe[]): Record<Channel, number[]> {
  const known = SLOPES.get(keys);
  if (known !== undefined) return known;
  const times = keys.map((key) => key.t);
  const made = {} as Record<Channel, number[]>;
  for (const channel of CHANNELS) {
    const slopes = monotoneSlopes(times, keys.map((key) => key.camera[channel]));
    keys.forEach((key, i) => {
      const own = key.slope?.[channel];
      if (own !== undefined) slopes[i] = own;
    });
    made[channel] = slopes;
  }
  SLOPES.set(keys, made);
  return made;
}

/** The camera at a moment of a path. After the last keyframe the arena goes on turning and nothing else moves. Before the first, the first. */
export function cameraAt(flight: Flight, time: number): Camera {
  const { keys } = flight;
  const slopes = slopesOf(keys);
  const times = keys.map((key) => key.t);
  const out = {} as Camera;
  for (const channel of CHANNELS) out[channel] = hermite(times, keys.map((key) => key.camera[channel]), slopes[channel], time);
  if (time > flight.end) out.yaw += flight.tail * (time - flight.end);
  return out;
}

/** The stage a moment is in: the last whose start is not after it. */
export function stageAt(flight: Flight, time: number): StageId {
  let found = flight.stages[0].id;
  for (const stage of flight.stages) if (stage.start <= time + 1e-9) found = stage.id;
  return found;
}

/** When a stage starts, or `undefined` for a stage the path does not fly. */
export const startOf = (flight: Flight, id: StageId): number | undefined => flight.stages.find((stage) => stage.id === id)?.start;

/** The stages a path flies, in order. */
export const stagesOf = (flight: Flight): StageId[] => flight.stages.map((stage) => stage.id);

/** The seconds one turn of the arena takes once it is turning, and so how far a moment after the end can be brought back to without a change of view. */
export const turnPeriod = (flight: Flight): number => (flight.tail === 0 ? Infinity : 360 / Math.abs(flight.tail));

/** A moment after the end brought back by whole turns of the arena to one near the end: the same view, and a time that does not grow without end. */
export function foldTime(flight: Flight, time: number): number {
  if (time <= flight.end + turnPeriod(flight)) return time;
  const period = turnPeriod(flight);
  return flight.end + ((time - flight.end) % period);
}

/** The camera's defaults: the map, from far above, with nothing of the arena showing. */
const BASE: Camera = { logSpan: 0, ax: 0, ay: 0, north: 0, map: 1, site: 0, arena: 0, yaw: 0, pitch: 0, logZoom: 0 };

/** The keyframes of each stage in order. Each stage's first key is where it starts (and is the last key of the stage before it, the one that arrives). `dt` is the seconds from the key before. */
interface Block {
  id: StageId;
  keys: { dt: number; camera: Partial<Camera>; slope?: Partial<Camera> }[];
}

/** How a path is paced: the seconds of each part. */
export const PACE = { dwell: 1.6, step: 1.25, cityDwell: 0.9, approach: 1.6, rise: 0.8, hand: 0.7, tilt: 3.2 } as const;

/**
 * The path from the map to the turning arena, for the stages asked (all by default): the map holds a moment, then the camera falls to the city in four even steps of the logarithm of the distance (the
 * map turning as it comes to the venue's own orientation and giving way to the site plan), holds there, comes in until the plan is as large as the 3D arena seen from above, the arena rises out of it,
 * tips to the sport's main camera and turns.
 */
export function flightPlan(input: FlightInput): Flight {
  const startSpan = input.startSpan ?? 9_000_000;
  const citySpan = input.citySpan ?? Math.max(1500, input.siteSpan * 8);
  const [ax0, ay0] = input.anchorStart ?? [0, 0];
  const [ax1, ay1] = input.anchorEnd ?? [0, 0];
  const north = wrap180(input.north);
  const turn = input.turn ?? 12;
  const view = input.view ?? { yaw: LONG_PRESETS.broadcast.yaw, pitch: LONG_PRESETS.broadcast.pitch };
  const ln = Math.log;
  const L0 = ln(startSpan);
  const L1 = ln(citySpan);
  const L2 = ln(input.siteSpan);
  // The descent, in four equal steps of the logarithm of the distance: where each is, how far the map is turned, how much of the map and of the plan shows.
  const fall = (k: number): Partial<Camera> => {
    const f = k / 4;
    const g = smooth((f - 0.35) / 0.65);
    return {
      logSpan: lerp(L0, L1, f),
      ax: lerp(ax0, ax1, smooth(f)),
      ay: lerp(ay0, ay1, smooth(f)),
      north: north * g,
      map: [1, 1, 1, 0.5, 0][k],
      site: [0, 0, 0, 0.5, 1][k],
    };
  };
  const start: Partial<Camera> = { logSpan: L0, ax: ax0, ay: ay0, north: 0, map: 1, site: 0, arena: 0, yaw: 0, pitch: 0, logZoom: 0 };
  const arrive: Partial<Camera> = { ...fall(4), logSpan: L1, ax: ax1, ay: ay1, north, map: 0, site: 1 };
  const near: Partial<Camera> = { ...arrive, logSpan: L2 };
  const blocks: Block[] = [
    { id: "map", keys: [{ dt: 0, camera: start }, { dt: PACE.dwell, camera: start }, { dt: PACE.step, camera: fall(1) }, { dt: PACE.step, camera: fall(2) }, { dt: PACE.step, camera: fall(3) }] },
    { id: "city", keys: [{ dt: PACE.step, camera: arrive }, { dt: PACE.cityDwell, camera: arrive }, { dt: PACE.approach, camera: near }, { dt: PACE.rise, camera: { ...near, arena: 1 } }] },
    {
      id: "arena",
      keys: [
        { dt: PACE.hand, camera: { ...near, arena: 1, site: 0, yaw: 0, pitch: 0 }, slope: { yaw: 0 } },
        { dt: PACE.tilt, camera: { ...near, arena: 1, site: 0, yaw: -(turn * PACE.tilt) / 2, pitch: view.pitch }, slope: { yaw: -turn } },
      ],
    },
  ];
  const wanted = (input.stages ?? STAGE_IDS).filter((id, i, all) => all.indexOf(id) === i);
  const flown = blocks.filter((block) => wanted.includes(block.id));
  if (flown.length === 0) throw new Error("a fly-through needs at least one stage");
  const keys: Keyframe[] = [];
  const stages: { id: StageId; start: number }[] = [];
  let time = 0;
  let camera: Camera = { ...BASE };
  // A stage left out keeps its seconds: the camera crosses them in one smooth run from where the stage before ended to where the stage after starts, so that it never jumps.
  let carry = 0;
  for (const block of blocks) {
    if (!wanted.includes(block.id)) {
      carry += block.keys.reduce((sum, key) => sum + key.dt, 0);
      continue;
    }
    block.keys.forEach((key, i) => {
      if (keys.length > 0) time += key.dt + (i === 0 ? carry : 0);
      camera = { ...camera, ...key.camera };
      // A stage starts at its first key; the key that arrives from the stage before is the one that stage ended on.
      if (i === 0) stages.push({ id: block.id, start: time });
      keys.push({ t: time, camera, ...(key.slope === undefined ? {} : { slope: key.slope }) });
    });
    carry = 0;
  }
  const rest: Record<StageId, Camera> = {
    map: { ...BASE, ...start },
    city: { ...BASE, ...arrive },
    arena: { ...BASE, ...near, map: 0, site: 0, arena: 1, yaw: view.yaw, pitch: view.pitch, logZoom: 0 },
  };
  return {
    keys,
    stages,
    end: time,
    tail: flown.some((block) => block.id === "arena") ? -turn : 0,
    rest,
    input: { north, siteSpan: input.siteSpan, startSpan, citySpan, turn, anchorStart: [ax0, ay0], anchorEnd: [ax1, ay1], view },
  };
}

/** The 3D view the arena settles in, as the sport's main camera: its yaw and pitch. */
export const mainView = (sport = "nhl"): { yaw: number; pitch: number } => {
  const view = presetView("broadcast", sport) ?? LONG_PRESETS.broadcast;
  return { yaw: view.yaw, pitch: view.pitch };
};

// ---- Time: how the clock of the fly-through moves, so that nothing starts or stops with a jump. ----

/** A glide of the clock from one moment of the path to another: zero to one with a zero slope at both ends, so that a skip starts and ends at rest. */
export const glide = (from: number, to: number, elapsed: number, seconds: number): number => lerp(from, to, smooth(seconds <= 0 ? 1 : elapsed / seconds));

/** How long a skip over `distance` seconds of the path takes: quick, and never so long that a long skip is slow or so short that it is a cut. */
export const glideSeconds = (distance: number): number => clamp(0.55 + 0.14 * Math.abs(distance), 0.6, 1.8);

/** The seconds the clock takes to go from still to the path's pace and back. */
export const RAMP = 0.45;

/** The speed the clock runs at after `dt` seconds: it goes to 1 while playing and to 0 when not, at one steady rate of change, reaching it in `RAMP` seconds and never at once. */
export function nextRate(rate: number, playing: boolean, dt: number): number {
  const target = playing ? 1 : 0;
  return rate + clamp(target - rate, -dt / RAMP, dt / RAMP);
}

// ---- The map's frame: how the viewBox follows the camera. ----

/** The metres in a degree of latitude on the sphere the venues' geometry uses, and its radius. */
export const METRES_PER_DEGREE = (6371008.8 * Math.PI) / 180;

/** How a map's canvas relates to the ground round the arena: the canvas point it stands at and the metres one unit of the canvas is, across and down. */
export interface MapFrame {
  /** The arena on the map's canvas. */
  at: readonly [number, number];
  /** Metres in one canvas unit, along x and along y, at the arena. */
  metresX: number;
  metresY: number;
}

/**
 * The map's frame at an arena, from the map's own projection: the canvas point of the arena and of a point a hundredth of a degree east of it and north of it give the metres a unit is, so that the
 * map can be drawn true to the ground round the arena (the world's projection is not, and a map stretched to be square on the ground there is the same map, stretched). `project` answers `null` where the map has no
 * place for a point, and then there is no frame.
 */
export function mapFrame(project: (lon: number, lat: number) => readonly [number, number] | null, lon: number, lat: number): MapFrame | undefined {
  const step = 0.01;
  const at = project(lon, lat);
  const east = project(lon + step, lat);
  const north = project(lon, lat + step);
  if (at === null || east === null || north === null) return undefined;
  const unitsX = Math.abs(east[0] - at[0]) / step;
  const unitsY = Math.abs(north[1] - at[1]) / step;
  if (!(unitsX > 0) || !(unitsY > 0)) return undefined;
  return { at, metresX: (METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180)) / unitsX, metresY: METRES_PER_DEGREE / unitsY };
}

/**
 * The viewBox of the map layer: a square of `metres` on the ground, centred on the arena, as canvas units (`metres` along x over the metres of a unit, and along y). Drawn into a square box with `preserveAspectRatio="none"`.
 */
export function mapBox(frame: MapFrame, metres: number): { x: number; y: number; w: number; h: number } {
  const w = metres / frame.metresX;
  const h = metres / frame.metresY;
  return { x: frame.at[0] - w / 2, y: frame.at[1] - h / 2, w, h };
}

/** The side, in pixels, of the square the map is drawn in so that it covers a `width` by `height` container whichever way it is turned about the arena, which stands at `(x, y)` in it. */
export const coverSide = (width: number, height: number, x: number, y: number): number => 2 * Math.hypot(Math.max(x, width - x), Math.max(y, height - y));

/** A distance a scale bar can show: 1, 2 or 5 times a power of ten metres, the longest that fits in `maxPixels` at `metresPerPixel`. */
export function niceLength(metresPerPixel: number, maxPixels: number): number {
  const wanted = metresPerPixel * maxPixels;
  const power = 10 ** Math.floor(Math.log10(wanted));
  const steps = [5, 2, 1].map((n) => n * power);
  return steps.find((step) => step <= wanted) ?? power / 2;
}

/** A length in metres as a scale bar says it: `500 m`, `2 km`. */
export const lengthWords = (metres: number): string => (metres >= 1000 ? `${metres / 1000} km` : `${metres} m`);
