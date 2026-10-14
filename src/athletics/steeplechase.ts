// The steeplechase's lap and its water jump, inside the second bend of the 400 m Standard Track or outside it (Track and Field Facilities Manual 2019, 2.2.4 and Figures 2.2.4.1a, 2.2.4.1b, 2.2.4.1e,
// with its comments on Figure 2.2.4.1a; Technical Rule 23 of Book C2.1). The lap with the jump inside is 396.0849 m (3.916 m shorter than the oval's), made of the first bend, the back straight, a
// diverted bend (two arcs of the oval's own radius, two transitions of 16.20 m radius and a 30.2020 m straight) and the finish straight; the lap with the jump outside is 419.407 m (19.406 m longer): a
// transitional straight of 9.86 m, a semicircle of 36.70 m and another straight of 9.86 m in place of the oval's bend. Five hurdles stand in a lap, the fourth the water jump. Metres.
import { line, path, poly } from "../fields.kit.ts";
import type { Area, Shape } from "../fields.types.ts";
import { num } from "../format.ts";
import { emptyParts, outerRadius, type Parts } from "./oval.ts";
import { curveAcross, curveOrigin, outward, type RaceContext } from "./races.ts";
import { laneEdge, laneRadius, lap, pose, breaklineStagger, type Oval, type Pose } from "./track.ts";
import type { RaceInfo, WaterJump } from "./types.ts";

type Pt = [number, number];

/** The figures of the diverted bend with the jump inside (Manual 2.2.4.1, comments on Figure 2.2.4.1a): the arcs of the oval's radius, the transitions and the straight between them. */
export const INSIDE = {
  /** The length of the lap, from A to A. */
  lap: 396.0849,
  /** The angle of the arc on the oval's own circle before the transition: 42.5525 degrees, 27.3307 m on the 36.80 m running line. */
  b2: 27.3307,
  /** The transition: 13.41545 m on a 16.20 m radius, 47.4475 degrees. */
  b1: 13.41545,
  radius: 16.2,
  /** The straight between the transitions. */
  middle: 30.202,
  /** The distance of the centres of the transition arcs from the second semicircle's centre, along the axis and across it. */
  centre: { out: 13.863, across: 15.101 },
  /** The distance of each of the five hurdles from the finish line along the lap. */
  hurdles: [21.997, 101.214, 180.431, 259.648, 338.865],
  start3000: 172.594,
  start2000: 376.504,
} as const;

/** The figures of the lap with the jump outside (Manual 2.2.4.1, Figure 2.2.4.1b and 2.2.4.1e). */
export const OUTSIDE = {
  lap: 419.407,
  straight: 9.86,
  radius: 36.7,
  hurdles: [17.866, 101.747, 185.628, 269.509, 353.39],
  start3000: 355.256,
  start2000: 97.035,
} as const;

/** The steeplechase hurdle's figures (Rule 23.5 and 23.6; Figure 2.2.4.1c): at least 3.94 m wide and 0.127 m square at the top; the water jump's hurdle and pit are 3.66 m. */
export const HURDLE = { width: 3.94, bar: 0.127, inside: 0.3, pit: 3.66 } as const;

/** The pose of the steeplechase's running line `s` metres from the finish line, with the diverted part of the lap and the oval's offset inside. */
export interface ScPose extends Pose {
  /** How far the track's inside edge is inside the running line: 0.30 m on the oval, 0.20 m where the lap is diverted from it. */
  innerOffset: number;
  /** True where the lap is off the oval's own line. */
  diverted: boolean;
}

/** The oval's lane 1 distance that a distance along the steeplechase lap comes to where the two are the same line, and `undefined` where the lap is diverted. */
export function standardDistance(o: Oval, variant: WaterJump, s: number): number | undefined {
  const a = laneRadius(o, 1);
  const L = lap(o, 1);
  const t = ((s % scLap(o, variant)) + scLap(o, variant)) % scLap(o, variant);
  if (variant === "outside") {
    const first = Math.PI * a + o.straight;
    if (t <= first) return t;
    if (t >= first + 2 * OUTSIDE.straight + Math.PI * OUTSIDE.radius) return t - (OUTSIDE.lap - L);
    return undefined;
  }
  const first = Math.PI * a + o.straight + INSIDE.b2;
  if (t <= first) return t;
  if (t >= first + 2 * INSIDE.b1 + INSIDE.middle) return t + (L - INSIDE.lap);
  return undefined;
}

/** The length of the lap with the jump where it is. */
export const scLap = (_o: Oval, variant: WaterJump): number => (variant === "outside" ? OUTSIDE.lap : INSIDE.lap);

/** A point of the steeplechase's running line. */
export function scPose(o: Oval, variant: WaterJump, s: number): ScPose {
  const a = laneRadius(o, 1);
  const L = scLap(o, variant);
  const t = ((s % L) + L) % L;
  const std = standardDistance(o, variant, t);
  if (std !== undefined) return { ...pose(o, a, std), innerOffset: 0.3, diverted: false };
  const S = o.straight;
  const cp1x = -S / 2;
  if (variant === "outside") {
    const first = Math.PI * a + S;
    const x0 = cp1x - OUTSIDE.straight;
    const r = OUTSIDE.radius;
    const d = t - first;
    if (d <= OUTSIDE.straight) return { x: cp1x - d, y: -r, heading: Math.PI, innerOffset: 0.2, diverted: true };
    if (d <= OUTSIDE.straight + Math.PI * r) {
      const f = (d - OUTSIDE.straight) / r;
      return { x: x0 - r * Math.sin(f), y: -r * Math.cos(f), heading: Math.PI - f, innerOffset: 0.2, diverted: true };
    }
    const e = d - OUTSIDE.straight - Math.PI * r;
    return { x: x0 + e, y: r, heading: 0, innerOffset: 0.2, diverted: true };
  }
  // The jump inside: the upper transition about the centre above the axis, the straight, the lower transition.
  const first = Math.PI * a + S + INSIDE.b2;
  const R = INSIDE.radius;
  const cu: Pt = [cp1x - INSIDE.centre.out, -INSIDE.centre.across];
  const cl: Pt = [cp1x - INSIDE.centre.out, INSIDE.centre.across];
  // The angle of the ray from the centre of a transition to the oval's circle: 227.55 degrees for the upper one.
  const phi0 = Math.atan2(-INSIDE.centre.across, -INSIDE.centre.out);
  const d = t - first;
  if (d <= INSIDE.b1) {
    const phi = phi0 - d / R;
    return { x: cu[0] + R * Math.cos(phi), y: cu[1] + R * Math.sin(phi), heading: Math.atan2(-Math.cos(phi), Math.sin(phi)) + 0, innerOffset: 0.2, diverted: true };
  }
  if (d <= INSIDE.b1 + INSIDE.middle) return { x: cu[0] - R, y: cu[1] + (d - INSIDE.b1), heading: Math.PI / 2, innerOffset: 0.2, diverted: true };
  const e = d - INSIDE.b1 - INSIDE.middle;
  // The lower transition: from the leftmost point (180 degrees) round to the ray towards the oval's circle at 132.45 degrees.
  const lower = Math.PI - e / R;
  return { x: cl[0] + R * Math.cos(lower), y: cl[1] + R * Math.sin(lower), heading: Math.atan2(-Math.cos(lower), Math.sin(lower)), innerOffset: 0.2, diverted: true };
}

/** The line of the diverted inner border and, for the jump outside, the band the diverted track lies on. */
function divertedLines(o: Oval, variant: WaterJump): { shapes: Shape[]; areas: Area[] } {
  const S = o.straight;
  const R = o.radius;
  const cp1x = -S / 2;
  if (variant === "outside") {
    const c = cp1x - OUTSIDE.straight;
    const inner = `M${num(cp1x)} ${num(-R)}H${num(c)}A${num(R)} ${num(R)} 0 0 0 ${num(c)} ${num(R)}H${num(cp1x)}`;
    const wide = 5;
    const band = `M${num(cp1x)} ${num(-R)}H${num(c)}A${num(R)} ${num(R)} 0 0 0 ${num(c)} ${num(R)}H${num(cp1x)}V${num(R + wide)}H${num(c)}A${num(R + wide)} ${num(R + wide)} 0 0 1 ${num(c)} ${num(-R - wide)}H${num(cp1x)}Z`;
    return { shapes: [path("water-jump-border", "water-jump", inner, { w: 0.05 })], areas: [{ id: "water-jump-track", feature: "water-jump", cls: "ky-ath-track", d: band }] };
  }
  const k = Math.hypot(INSIDE.centre.out, INSIDE.centre.across);
  const ux = -INSIDE.centre.out / k;
  const uy = INSIDE.centre.across / k;
  // The oval's circle is touched, from inside, by the transition's circle on the ray from the semicircle's centre through its centre: at 36.5 m from the centre.
  const upper: Pt = [cp1x + R * ux, -R * uy];
  const lower: Pt = [cp1x + R * ux, R * uy];
  const x = cp1x - INSIDE.centre.out - INSIDE.radius;
  const yc = INSIDE.centre.across;
  const d = `M${num(upper[0])} ${num(upper[1])}A${num(INSIDE.radius)} ${num(INSIDE.radius)} 0 0 0 ${num(x)} ${num(-yc)}V${num(yc)}A${num(INSIDE.radius)} ${num(INSIDE.radius)} 0 0 0 ${num(lower[0])} ${num(lower[1])}`;
  return { shapes: [path("water-jump-border", "water-jump", d, { w: 0.05 })], areas: [] };
}

/** One hurdle: a bar across the lane at distance `s` of the lap, from `inner - 0.30` outwards `width`. */
function hurdle(o: Oval, variant: WaterJump, s: number, width: number, id: string, feature: string): Shape {
  const p = scPose(o, variant, s);
  const [nx, ny] = outward(p.heading);
  const a = -p.innerOffset - HURDLE.inside;
  const b = a + width;
  return line(id, feature, p.x + a * nx, p.y + a * ny, p.x + b * nx, p.y + b * ny, { w: HURDLE.bar, cls: "ky-ath-k", least: 0.2 });
}

/** The water jump's pit: 3.66 m along the run and 3.66 m across, from its hurdle forward, as a filled area with its border. */
function waterPit(o: Oval, variant: WaterJump, s: number): { area: Area; edge: Shape } {
  const p = scPose(o, variant, s);
  const [nx, ny] = outward(p.heading);
  const fx = Math.cos(p.heading);
  const fy = Math.sin(p.heading);
  const a = -p.innerOffset - HURDLE.inside;
  const b = a + HURDLE.pit;
  const corner = (along: number, off: number): Pt => [p.x + along * fx + off * nx, p.y + along * fy + off * ny];
  const pts = [corner(0, a), corner(0, b), corner(HURDLE.pit, b), corner(HURDLE.pit, a)];
  const d = `M${pts.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z`;
  return { area: { id: "water-pit", feature: "water-jump", cls: "ky-ath-water", d }, edge: poly("water-pit-edge", "water-jump", pts, { closed: true, w: 0.05 }) };
}

/** The box round the water jump's pit, in metres. */
export function waterPitBox(o: Oval, variant: WaterJump): { x0: number; y0: number; x1: number; y1: number } {
  const hurdleAt = variant === "outside" ? OUTSIDE.hurdles[3] : INSIDE.hurdles[3];
  const p = scPose(o, variant, hurdleAt);
  const [nx, ny] = outward(p.heading);
  const fx = Math.cos(p.heading);
  const fy = Math.sin(p.heading);
  const a = -p.innerOffset - HURDLE.inside;
  const b = a + HURDLE.pit;
  const pts = [[0, a], [0, b], [HURDLE.pit, b], [HURDLE.pit, a]].map(([along, off]) => [p.x + along * fx + off * nx, p.y + along * fy + off * ny]);
  return { x0: Math.min(...pts.map((q) => q[0])), y0: Math.min(...pts.map((q) => q[1])), x1: Math.max(...pts.map((q) => q[0])), y1: Math.max(...pts.map((q) => q[1])) };
}

/** The steeplechase's marks: the diverted border, the five hurdles, the water jump, and the start of the race (curved, with the outer group's line for the 3000 m). */
export function steeplechaseParts(ctx: RaceContext, variant: WaterJump, race: RaceInfo | undefined, drawLap: boolean): { parts: Parts; start?: { s: number; curve: Pt[]; group?: Pt[] } } {
  const o = ctx.oval;
  const parts = emptyParts();
  if (drawLap) {
    const lines = divertedLines(o, variant);
    parts.shapes.push(...lines.shapes);
    parts.areas.push(...lines.areas);
    const at = variant === "outside" ? OUTSIDE.hurdles : INSIDE.hurdles;
    at.forEach((s, i) => {
      if (i === 3) {
        const pit = waterPit(o, variant, s);
        parts.areas.push(pit.area);
        parts.shapes.push(pit.edge, hurdle(o, variant, s, HURDLE.pit, "water-jump-hurdle", "water-jump"));
      } else parts.shapes.push(hurdle(o, variant, s, HURDLE.width, `steeplechase-hurdle-${i + 1}`, "steeplechase-hurdles"));
    });
  }
  if (race === undefined) return { parts };
  const sc = race.id === "2000m-steeplechase" ? (variant === "outside" ? OUTSIDE.start2000 : INSIDE.start2000) : variant === "outside" ? OUTSIDE.start3000 : INSIDE.start3000;
  const std = standardDistance(o, variant, sc) ?? sc;
  const a = laneRadius(o, 1);
  const Rout = outerRadius(o);
  const curve = curveAcross(o, curveOrigin(o, a, std), a, o.radius, Rout);
  parts.shapes.push(poly("start-line", "start-lines", curve, { w: 0.05 }));
  const out: { s: number; curve: Pt[]; group?: Pt[] } = { s: sc, curve };
  if (race.group === true) {
    const gl = ctx.lanes <= 6 ? 4 : 5;
    const ag = laneRadius(o, gl);
    const group = curveAcross(o, curveOrigin(o, ag, std + breaklineStagger(o, gl)), ag, laneEdge(o, gl - 1), Rout);
    parts.shapes.push(poly("group-start-line", "start-lines", group, { w: 0.05 }));
    out.group = group;
  }
  return { parts, start: out };
}

