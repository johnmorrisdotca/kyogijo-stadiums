// What stands in an athletics stadium and at a skating rink, in 3D: the hurdles of the races drawn and the steeplechase's barriers with the water jump's, the uprights and bars of the high jump and the
// pole vault, the discus and hammer cage; the padding round a long or short track and the boards of a figure skating rink. The plans are in metres in the frame of their own origin, and the drawing's
// frame is feet from the corner of the plan's box, so every point goes through `at`. The heights are cited in docs/sources.md ("Heights in the 3D view"): the cage's from the Track and Field
// Facilities Manual 2019 (2.4.1.3), the hurdles' and the barriers' from the Technical Rules (22, 23), the padding's from the ISU's Rule 228.2; the bars' heights are ours, a bar being set at the height of
// the competition.
import { athleticsPlan, type AthleticsPlan } from "./athletics/plan.ts";
import { outward, ahead } from "./athletics/races.ts";
import { HURDLE, INSIDE, OUTSIDE, scPose } from "./athletics/steeplechase.ts";
import { laneRadius, pose } from "./athletics/track.ts";
import { feet } from "./pool.ts";
import { iceRadius } from "./skating/long.ts";
import { skatingPlan, type SkatingPlan } from "./skating/plan.ts";
import { bar, mesh, n, plane, pole, shy, threads, wall, type Plane, type Upright } from "./turn.kit.ts";
import { BOARD_HEIGHT } from "./uprights.rinks.ts";
import type { SurfaceOptions } from "./types.ts";

type Pt = readonly [number, number];

/** The hurdles' heights: the men's 110 m (and the covered 60 m) 1.067 m, the women's 100 m 0.838 m, the 400 m 0.914 m (Technical Rule 22); a steeplechase barrier 0.914 m (Rule 23.5). */
export const HURDLE_HEIGHT = { "110m-hurdles": 1.067, "60m-hurdles": 1.067, "100m-hurdles": 0.838, "400m-hurdles": 0.914, steeplechase: 0.914 } as const;
/** A hurdle is 1.18 to 1.20 m wide (Rule 22): 1.2 m is drawn. */
const HURDLE_WIDTH = 1.2;
/** The cage's netting is at least 4 m high, and at least 6 m for the 3 m nearest the front of each side (Facilities Manual 2.4.1.3). */
export const CAGE = { low: 4, high: 6, highLength: 3 } as const;
/** The high jump's uprights are 4.02 m apart (Manual 2.3.3.3) and the pole vault's at least 5.20 m (2.3.4.3). The heights of the bars are ours. */
export const JUMPS = { highUprights: 4.02, highBar: 2, highPost: 2.5, vaultUprights: 5.2, vaultBar: 5, vaultPost: 6, vaultBarLength: 4.5 } as const;
/** The padding round a track is at least 0.80 m high and 0.30 m thick (ISU Rule 228.2). */
export const PADDING = { height: 0.8 } as const;

/** A hurdle: a bar across the lane with stripes on its top, and its two uprights. */
function hurdlePlane(id: string, a: Pt, b: Pt, height: number, thin: number): Plane {
  const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const top = Math.max(feet(0.07), thin);
  const stripes = 8;
  let bands = "";
  for (let i = 0; i < stripes; i += 1) bands += `<rect x="${n((run * i) / stripes)}" width="${n(run / stripes)}" height="${n(top)}" class="${i % 2 === 0 ? "u-white" : "u-leg"}"/>`;
  const side = Math.max(feet(0.04), thin * 0.8);
  const sides = `<rect width="${n(side)}" height="${n(height)}" class="u-leg"/><rect x="${n(run - side)}" width="${n(side)}" height="${n(height)}" class="u-leg"/>`;
  return wall(id, "wall", a[0], a[1], b[0], b[1], 0, height, `${sides}${bands}`);
}

/** The hurdles of the races a drawing marks, and the steeplechase's barriers. */
function hurdles(plan: AthleticsPlan, at: (x: number, y: number) => Pt, thin: number): Upright[] {
  const planes: Plane[] = [];
  const o = plan.oval;
  for (const race of plan.races) {
    if (race.hurdles === undefined) continue;
    const height = feet(HURDLE_HEIGHT[race.race.id as keyof typeof HURDLE_HEIGHT] ?? HURDLE_HEIGHT["110m-hurdles"]);
    for (const { lane, at: marks } of race.hurdles) {
      marks.forEach((s, k) => {
        const id = `hurdle-${race.race.id}-${lane}-${k + 1}`;
        if (race.race.kind === "straight") {
          // The lane of the straight: from its top line to the next, the 50 mm line on its right left out.
          const top = plan.straight?.y0 ?? o.radius;
          const sl = plan.straight?.lane ?? o.lane;
          const y = top + (lane - 0.5) * sl - 0.025;
          planes.push(hurdlePlane(id, at(s + 0.1, y - HURDLE_WIDTH / 2), at(s + 0.1, y + HURDLE_WIDTH / 2), height, thin));
        } else {
          // On the oval: the point of the running line at that distance, and the middle of the lane across from it.
          const run = laneRadius(o, lane);
          const p = pose(o, run, s);
          const [nx, ny] = outward(p.heading);
          const rc = o.radius + (lane - 0.5) * o.lane - 0.025;
          const c: Pt = [p.x + (rc - run) * nx, p.y + (rc - run) * ny];
          planes.push(hurdlePlane(id, at(c[0] - (HURDLE_WIDTH / 2) * nx, c[1] - (HURDLE_WIDTH / 2) * ny), at(c[0] + (HURDLE_WIDTH / 2) * nx, c[1] + (HURDLE_WIDTH / 2) * ny), height, thin));
        }
      });
    }
  }
  const items: Upright[] = [];
  if (planes.length > 0) items.push({ id: "hurdles", kind: "hurdles", at: [0, 0], height: Math.max(...planes.map((p) => -p.v[2])), planes });
  if (plan.waterJump !== undefined) {
    const barriers: Plane[] = [];
    const variant = plan.waterJump;
    const h = feet(HURDLE_HEIGHT.steeplechase);
    (variant === "outside" ? OUTSIDE.hurdles : INSIDE.hurdles).forEach((s, i) => {
      const p = scPose(o, variant, s);
      const [nx, ny] = outward(p.heading);
      const width = i === 3 ? HURDLE.pit : HURDLE.width;
      const a = -p.innerOffset - HURDLE.inside;
      const [x0, y0] = at(p.x + a * nx, p.y + a * ny);
      const [x1, y1] = at(p.x + (a + width) * nx, p.y + (a + width) * ny);
      const run = Math.hypot(x1 - x0, y1 - y0);
      const cap = Math.max(feet(HURDLE.bar), thin);
      barriers.push(wall(i === 3 ? "water-jump-barrier" : `steeplechase-barrier-${i + 1}`, "wall", x0, y0, x1, y1, 0, h, `<rect width="${n(run)}" height="${n(h)}" class="u-board"/><rect width="${n(run)}" height="${n(cap)}" class="u-leg"/>`));
      if (i === 3) {
        // The pit, 3.66 m along the run from its barrier and 3.66 m across: the water, level with the track.
        const [fx, fy] = ahead(p.heading);
        const lift = 0.04;
        barriers.push(plane("water-pit", "board", [x0, y0, lift], [fx * feet(HURDLE.pit), fy * feet(HURDLE.pit), 0], [x1 - x0, y1 - y0, 0], `<rect width="${n(feet(HURDLE.pit))}" height="${n(run)}" class="u-pad"/>`));
      }
    });
    items.push({ id: "steeplechase", kind: "steeplechase", at: [0, 0], height: h, planes: barriers });
  }
  return items;
}

/** The high jump's two sets of uprights with their bars, and the pole vault's. */
function jumps(plan: AthleticsPlan, at: (x: number, y: number) => Pt, thin: number): Upright[] {
  const items: Upright[] = [];
  const posts = Math.max(feet(0.05), thin * 1.2);
  const bars = Math.max(feet(0.03), thin * 0.7);
  const high: Plane[] = [];
  const vault: Plane[] = [];
  for (const f of plan.facilities) {
    if (f.event !== "high-jump" && f.event !== "pole-vault") continue;
    const [ux, uy] = ahead(f.heading);
    const [vx, vy] = outward(f.heading);
    const isHigh = f.event === "high-jump";
    const half = (isHigh ? JUMPS.highUprights : JUMPS.vaultUprights) / 2;
    // The pole vault's uprights stand 0.1 m beyond the middle of the stop board (the drawing's); the high jump's on the take-off line.
    const along = isHigh ? 0 : 0.1;
    const a = at(f.x + along * ux - half * vx, f.y + along * uy - half * vy);
    const b = at(f.x + along * ux + half * vx, f.y + along * uy + half * vy);
    const top = feet(isHigh ? JUMPS.highPost : JUMPS.vaultPost);
    const barZ = feet(isHigh ? JUMPS.highBar : JUMPS.vaultBar);
    const out = isHigh ? high : vault;
    out.push(...pole(`${f.id}-upright-a`, "post", a[0], a[1], 0, top, posts, "u-pole"), ...pole(`${f.id}-upright-b`, "post", b[0], b[1], 0, top, posts, "u-pole"));
    // The high jump's bar runs from upright to upright; the vault's rests on supports between them and is 4.5 m long.
    if (isHigh) out.push(...bar(`${f.id}-bar`, "post", [a[0], a[1], barZ], [b[0], b[1], barZ], bars, "u-white"));
    else {
      const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const k = (feet(JUMPS.vaultBarLength) / 2) / d;
      out.push(...bar(`${f.id}-bar`, "post", [m[0] - (b[0] - a[0]) * k, m[1] - (b[1] - a[1]) * k, barZ], [m[0] + (b[0] - a[0]) * k, m[1] + (b[1] - a[1]) * k, barZ], bars, "u-white"));
    }
  }
  if (high.length > 0) items.push({ id: "high-jump", kind: "high-jump", at: [0, 0], height: feet(JUMPS.highBar), planes: high });
  if (vault.length > 0) items.push({ id: "pole-vault", kind: "pole-vault", at: [0, 0], height: feet(JUMPS.vaultBar), planes: vault });
  return items;
}

/** The discus and hammer cage: netting 4 m high, 6 m for the 3 m nearest the front of each side, along the plan's U (the mouth 6 m wide 7 m in front of the circle's centre). */
function cage(plan: AthleticsPlan, at: (x: number, y: number) => Pt, thin: number): Upright[] {
  const seen = new Set<string>();
  const planes: Plane[] = [];
  const cell = Math.max(feet(0.5), thin * 4);
  const netting = (id: string, a: Pt, b: Pt, z: number, h: number): void => {
    const [x0, y0] = at(a[0], a[1]);
    const [x1, y1] = at(b[0], b[1]);
    const run = Math.hypot(x1 - x0, y1 - y0);
    if (run <= 0) return;
    planes.push(wall(id, "wall", x0, y0, x1, y1, z, z + h, `<rect width="${n(run)}" height="${n(h)}" class="u-netfill"/>${threads(mesh(run, h, cell), cell)}<rect width="${n(run)}" height="${n(Math.max(thin * 0.5, 0.1))}" class="u-cap"/>`));
  };
  for (const f of plan.facilities) {
    if (f.event !== "discus-throw" && f.event !== "hammer-throw") continue;
    const key = `${f.x.toFixed(2)},${f.y.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const [ux, uy] = ahead(f.heading);
    const [vx, vy] = outward(f.heading);
    const pt = (u: number, v: number): Pt => [f.x + u * ux + v * vx, f.y + u * uy + v * vy];
    // The sides, from the mouth back to the circle's level: the first 3 m of each at 6 m, the rest at 4 m. The line is the plan's own: (7, ±3) to (0, ±4.4).
    for (const side of [-1, 1]) {
      const mouth = pt(7, side * 3);
      const back = pt(0, side * 4.4);
      const length = Math.hypot(back[0] - mouth[0], back[1] - mouth[1]);
      const t = CAGE.highLength / length;
      const mid: Pt = [mouth[0] + (back[0] - mouth[0]) * t, mouth[1] + (back[1] - mouth[1]) * t];
      netting(`cage-side-${side < 0 ? "a" : "b"}-front`, mouth, mid, 0, feet(CAGE.high));
      netting(`cage-side-${side < 0 ? "a" : "b"}-back`, mid, back, 0, feet(CAGE.low));
    }
    // The rear: the half circle of 4.4 m about the centre, behind it, in eight chords.
    const steps = 8;
    for (let i = 0; i < steps; i += 1) {
      const p0 = (Math.PI * i) / steps;
      const p1 = (Math.PI * (i + 1)) / steps;
      const g = (p: number): Pt => pt(-4.4 * Math.sin(p), -4.4 * Math.cos(p));
      netting(`cage-rear-${i + 1}`, g(p0), g(p1), 0, feet(CAGE.low));
    }
  }
  return planes.length === 0 ? [] : [{ id: "cage", kind: "cage", at: [0, 0], height: feet(CAGE.high), planes }];
}

/** An athletics stadium's uprights, as the plan has its box. */
export function athleticsUprights(o: SurfaceOptions, thin: number): { items: Upright[]; area: { x0: number; y0: number; x1: number; y1: number } } {
  const plan = athleticsPlan({ ...o, detail: o.detail });
  const at = (x: number, y: number): Pt => [feet(x - plan.box.x0), feet(y - plan.box.y0)];
  return {
    items: [...hurdles(plan, at, thin), ...jumps(plan, at, thin), ...cage(plan, at, thin)],
    area: { x0: 0, y0: 0, x1: feet(plan.box.x1 - plan.box.x0), y1: feet(plan.box.y1 - plan.box.y0) },
  };
}

/** The walls of a closed outline of points, as planes of `height`: each segment is a wall whose inner face is drawn, giving way to the eye. */
function walls(id: string, points: readonly Pt[], height: number, side: string, top: string, thin: number, centre: Pt): Plane[] {
  const planes: Plane[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const run = Math.hypot(x1 - x0, y1 - y0);
    if (run < 1e-6) continue;
    const cap = Math.max(thin * 0.8, 0.1);
    planes.push(shy(wall(`${id}-${i}`, "wall", x0, y0, x1, y1, 0, height, `<rect width="${n(run)}" height="${n(height)}" class="${side}"/><rect width="${n(run)}" height="${n(cap)}" class="${top}"/>`), centre));
  }
  return planes;
}

/** A stadium's outline (two straights of `f` between the centres of two half circles of radius `r`) as points about the origin, in metres. */
function stadiumPoints(f: number, r: number, steps = 14): Pt[] {
  const out: Pt[] = [[-f / 2, -r]];
  for (let i = 0; i <= steps; i += 1) {
    const a = (Math.PI * i) / steps;
    out.push([f / 2 + r * Math.sin(a), -r * Math.cos(a)]);
  }
  for (let i = 0; i <= steps; i += 1) {
    const a = (Math.PI * i) / steps;
    out.push([-f / 2 - r * Math.sin(a), r * Math.cos(a)]);
  }
  return out;
}

/** A rounded rectangle's outline, half sizes `hx`, `hy` and corner radius `k`, as points about the origin, in metres. */
function roundedPoints(hx: number, hy: number, k: number, steps = 6): Pt[] {
  const out: Pt[] = [];
  const corners: [number, number, number][] = [[hx - k, -hy + k, -Math.PI / 2], [hx - k, hy - k, 0], [-hx + k, hy - k, Math.PI / 2], [-hx + k, -hy + k, Math.PI]];
  for (const [cx, cy, a0] of corners) for (let i = 0; i <= steps; i += 1) out.push([cx + k * Math.cos(a0 + ((Math.PI / 2) * i) / steps), cy + k * Math.sin(a0 + ((Math.PI / 2) * i) / steps)]);
  return out;
}

/** What stands at a skating rink: the padding round a long or a short track, 0.80 m high (ISU Rule 228.2); the boards of a figure skating rink, as high as a hockey rink's and with no glass over them. */
export function skatingUprights(o: SurfaceOptions, thin: number): { items: Upright[]; area: { x0: number; y0: number; x1: number; y1: number } } {
  const plan: SkatingPlan = skatingPlan({ ...o, detail: o.detail });
  const at = (p: Pt): Pt => [feet(p[0] - plan.box.x0), feet(p[1] - plan.box.y0)];
  const area = { x0: 0, y0: 0, x1: feet(plan.box.x1 - plan.box.x0), y1: feet(plan.box.y1 - plan.box.y0) };
  const centre = at([0, 0]);
  const items: Upright[] = [];
  const style = o.skating;
  const padding = style?.padding !== false;
  if (plan.oval !== undefined && padding) {
    const R = iceRadius(plan.oval);
    const points = stadiumPoints(plan.oval.straight, R).map(at);
    items.push({ id: "padding", kind: "padding", at: centre, height: feet(PADDING.height), planes: walls("padding", points, feet(PADDING.height), "u-pad", "u-cap", thin, centre) });
  } else if (plan.short !== undefined && padding) {
    const points = roundedPoints(plan.short.length / 2, plan.short.width / 2, 8.5).map(at);
    items.push({ id: "padding", kind: "padding", at: centre, height: feet(PADDING.height), planes: walls("padding", points, feet(PADDING.height), "u-pad", "u-cap", thin, centre) });
  } else if (plan.rink !== undefined) {
    const fig = plan.figures as { corner?: number };
    const points = roundedPoints(plan.rink.length / 2, plan.rink.width / 2, fig.corner ?? 8.5).map(at);
    items.push({ id: "rink-boards", kind: "rink-boards", at: centre, height: BOARD_HEIGHT, planes: walls("board", points, BOARD_HEIGHT, "u-board", "u-cap", thin, centre) });
  }
  return { items, area };
}
