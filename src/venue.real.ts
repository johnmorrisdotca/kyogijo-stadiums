// The building of a real venue, raised: its walls, standing on the outline OpenStreetMap gives, and its roof over the top tier, a lid that rises towards the middle, a saddle that rises at the two ends and falls at the two
// sides, or a cable-supported roof that rises to an opening over the surface which a retractable fabric closes (BC Place's, with the fabric gathered into its pod when `roofOpen` is asked). All are asked for with the roof
// (`venue: { roof: true }`) and give way to the eye as the other walls do. Pure: data in, planes out.
import { rayAt, type Pt, type RealShell, type StandRing } from "./crowd.ts";
import { n, shy, wall, type Plane, type Upright, type V3 } from "./turn.kit.ts";
import { pointList, raked, type Slope } from "./venue.geom.ts";

/** How far a lid rises from its edge towards the middle, and how far a saddle's high ends stand over its low sides, in feet (ours: the sources give a roof's kind, not its height). */
export const LID_RISE = 22;
export const SADDLE_RISE = 30;

/** The saddle's share of its rise at a point (0 at the middle of a side, 1 at the middle of an end): half a saddle's way from one to the other, as a hyperbolic paraboloid (u squared less v squared) lies over the building's box. */
export function saddleAt(real: Pick<RealShell, "footprint">, [x, y]: Pt): number {
  const xs = real.footprint.map((p) => p[0]);
  const ys = real.footprint.map((p) => p[1]);
  const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const [hx, hy] = [(Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2];
  const s = ((x - cx) / hx) ** 2 - ((y - cy) / hy) ** 2;
  return (1 + Math.max(-1, Math.min(1, s))) / 2;
}

/** The height of the roof over a point of the building's edge, above the surface, in feet. */
export const roofAt = (real: RealShell, p: Pt): number => real.edge + (real.roof === "saddle" ? SADDLE_RISE * saddleAt(real, p) : 0);

/** The point where a ray from `from` first meets a polygon, or `undefined`. */
function firstHit(poly: readonly Pt[], from: Pt, angle: number): Pt | undefined {
  const [dx, dy] = [Math.cos(angle), Math.sin(angle)];
  let best: { t: number; p: Pt } | undefined;
  poly.forEach(([ax, ay], i) => {
    const [bx, by] = poly[(i + 1) % poly.length];
    const [ex, ey] = [bx - ax, by - ay];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) return;
    const t = ((ax - from[0]) * ey - (ay - from[1]) * ex) / den;
    const u = ((ax - from[0]) * dy - (ay - from[1]) * dx) / den;
    if (t > 1e-6 && u >= 0 && u <= 1 && (best === undefined || t < best.t)) best = { t, p: [from[0] + dx * t, from[1] + dy * t] };
  });
  return best?.p;
}

/** The plane a quad of points with heights lies nearest to, as a slope: least squares through its corners. */
function slopeThrough(points: readonly V3[]): Slope {
  const m = points.length;
  const [mx, my, mz] = [points.reduce((s, p) => s + p[0], 0) / m, points.reduce((s, p) => s + p[1], 0) / m, points.reduce((s, p) => s + p[2], 0) / m];
  let [sxx, sxy, syy, sxz, syz] = [0, 0, 0, 0, 0];
  for (const [x, y, z] of points) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
    syy += (y - my) ** 2;
    sxz += (x - mx) * (z - mz);
    syz += (y - my) * (z - mz);
  }
  const det = sxx * syy - sxy * sxy;
  const [gx, gy] = Math.abs(det) < 1e-9 ? [0, 0] : [(sxz * syy - syz * sxy) / det, (syz * sxx - sxz * sxy) / det];
  return { x0: mx, y0: my, z0: mz, gx, gy };
}

/**
 * The walls and the roof of a real venue (`parts` says which are made). The hall is the building's outline cut to the bowl's wall and a margin (`RealShell.hall`): its rim is where a ray from the middle meets the one or the other first, in `steps`
 * rays. A wall stands on each stretch of the rim, up to the roof's height over it; the roof is a band from the rim in to the inner edge of the top tier (the middle stays open, as the 3D view's roofs are).
 */
export function realBuilding(real: RealShell, top: StandRing | undefined, centre: readonly [number, number], lift: number, steps: number, open = false, parts: { walls: boolean; roof: boolean } = { walls: true, roof: true }): Items {
  const items: Upright[] = [];
  const c: Pt = [centre[0], centre[1]];
  const rim = Array.from({ length: steps }, (_, k): Pt => {
    const angle = (2 * Math.PI * k) / steps;
    const cap = rayAt(real.hall, c[0], c[1], angle);
    const out = firstHit(real.footprint, c, angle);
    return out !== undefined && Math.hypot(out[0] - c[0], out[1] - c[1]) < Math.hypot(cap[0] - c[0], cap[1] - c[1]) ? out : cap;
  });
  const planes: Plane[] = [];
  rim.forEach((a, i) => {
    const b = rim[(i + 1) % steps];
    const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (long < 1) return;
    const high = lift + roofAt(real, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    planes.push({ ...shy(wall(`shell-${i}`, "wall", a[0], a[1], b[0], b[1], 0, high, `<rect class="u-shell" width="${n(long)}" height="${n(high)}"/>`), centre), fadeTo: 0.02 });
  });
  if (parts.walls && planes.length > 0) items.push({ id: "shell", kind: "walls", at: centre, height: Math.max(...planes.map((p) => p.o[2])), planes });
  const crown = real.roof === "cable" ? real.crown : undefined;
  if (!parts.roof || (top?.hole == null && crown === undefined)) return items;
  const roof: Plane[] = [];
  // A cable roof rises from the rim of the hall to the opening over the surface; any other is a band from the rim in to the inner edge of the top tier.
  const inner = rim.map((_, k) => {
    const angle = (2 * Math.PI * k) / steps;
    return crown === undefined ? rayAt(top!.hole!, c[0], c[1], angle) : firstHit(crown.opening, c, angle) ?? rayAt(top!.hole!, c[0], c[1], angle);
  });
  const rise = real.roof === "saddle" || real.roof === "cable" ? 0 : LID_RISE;
  const zOf = (p: Pt, inward: boolean): number => lift + roofAt(real, p) + (inward ? (crown === undefined ? rise : crown.rise) : 0);
  for (let k = 0; k < steps; k += 1) {
    const [a, b] = [rim[k], rim[(k + 1) % steps]];
    const [ai, bi] = [inner[k], inner[(k + 1) % steps]];
    const quad: Pt[] = [ai, bi, b, a];
    const heights = [zOf(ai, true), zOf(bi, true), zOf(b, false), zOf(a, false)];
    const slope = slopeThrough(quad.map((p, i): V3 => [p[0], p[1], heights[i]]));
    const [ex, ey] = [b[0] - a[0], b[1] - a[1]];
    const el = Math.hypot(ex, ey);
    if (el < 1e-6) continue;
    const mid: Pt = [(a[0] + b[0] + ai[0] + bi[0]) / 4, (a[1] + b[1] + ai[1] + bi[1]) / 4];
    const away = Math.hypot(mid[0] - c[0], mid[1] - c[1]);
    // A cable roof's cables run from the rim to the opening along the edge of each piece (ours: the drawing's cables are as many as its pieces, not the roof's own count).
    const paint = (corners: Pt[]): string => `<polygon class="u-roof" points="${pointList(corners)}"/>${crown === undefined ? "" : `<path class="u-cable" d="M${n(corners[0][0])} ${n(corners[0][1])}L${n(corners[3][0])} ${n(corners[3][1])}"/>`}`;
    const piece = raked(`roof-${k}`, "roof", quad, slope, [ex / el, ey / el], paint);
    if (piece !== undefined) roof.push({ ...piece, shy: [(mid[0] - c[0]) / away, (mid[1] - c[1]) / away] });
  }
  if (crown !== undefined) roof.push(...cablePod(real, crown, inner, c, lift, steps, open));
  if (roof.length > 0) items.push({ id: "roof", kind: "roof", at: centre, height: Math.max(...roof.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]])), planes: roof });
  return items;
}

/** The pod in the middle of a cable roof's opening, as a share of the opening's size, and how thick it is, in feet (ours: the article says the fabric gathers into a pod above the video board, not how large it is). */
export const POD = { share: 0.24, thick: 9 } as const;

/**
 * What lies over the opening of a cable roof: the pod in the middle (a box hung at the crown's height) and, with the roof closed, the fabric between the pod and the opening's edge, drawn thin so that the seats
 * show through it. Open, only the pod is there: the fabric has gathered into it.
 */
function cablePod(real: RealShell, crown: NonNullable<RealShell["crown"]>, edge: readonly Pt[], c: Pt, lift: number, steps: number, open: boolean): Plane[] {
  const planes: Plane[] = [];
  const z = lift + real.edge + crown.rise;
  const pod = edge.map((p): Pt => [c[0] + (p[0] - c[0]) * POD.share, c[1] + (p[1] - c[1]) * POD.share]);
  if (!open) {
    for (let k = 0; k < steps; k += 1) {
      const [a, b] = [edge[k], edge[(k + 1) % steps]];
      const [ai, bi] = [pod[k], pod[(k + 1) % steps]];
      const el = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (el < 1e-6) continue;
      const mid: Pt = [(a[0] + b[0] + ai[0] + bi[0]) / 4, (a[1] + b[1] + ai[1] + bi[1]) / 4];
      const away = Math.hypot(mid[0] - c[0], mid[1] - c[1]);
      const piece = raked(`fabric-${k}`, "roof", [ai, bi, b, a], { x0: c[0], y0: c[1], z0: z, gx: 0, gy: 0 }, [(b[0] - a[0]) / el, (b[1] - a[1]) / el], (corners) => `<polygon class="u-fabric" points="${pointList(corners)}"/>`);
      if (piece !== undefined) planes.push({ ...piece, shy: [(mid[0] - c[0]) / away, (mid[1] - c[1]) / away], fadeTo: 0.04 });
    }
  }
  // The pod: a flat top and the sides of a ring of boxes, one to each piece.
  const top = z + POD.thick;
  const topFace = raked("pod-top", "roof", pod, { x0: c[0], y0: c[1], z0: top, gx: 0, gy: 0 }, [1, 0], (corners) => `<polygon class="u-pod" points="${pointList(corners)}"/>`);
  if (topFace !== undefined) planes.push(topFace);
  for (let k = 0; k < steps; k += 1) {
    const [a, b] = [pod[k], pod[(k + 1) % steps]];
    const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (long < 0.5) continue;
    planes.push({ ...shy(wall(`pod-${k}`, "roof", a[0], a[1], b[0], b[1], z, top, `<rect class="u-pod" width="${n(long)}" height="${n(POD.thick)}"/>`), c), fadeTo: 0.3 });
  }
  return planes;
}

type Items = Upright[];
