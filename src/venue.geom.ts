// The plain geometry the 3D venue is cut from: a ring of stands sampled into strips of quads, polygons clipped to the places the stands are left open, and a planar polygon turned into one `Plane`
// whose SVG is drawn in the plane's own feet. Pure arithmetic: no page, no stylesheet. Points are (x, y) in feet in the drawing's frame, as `crowdStands()` gives them.
import type { Outline, Pt } from "./crowd.ts";
import { n, plane, type Plane, type V3 } from "./turn.kit.ts";

/** How finely the curves of a ring are cut: facets to a quarter of a rounded corner, or round an oval. */
export type Cut = "low" | "auto" | "high";

/** A band of the stands as two polylines of one length, the inner edge and the outer: quad `i` is `inner[i]`, `inner[i + 1]`, `outer[i + 1]`, `outer[i]`. */
export interface Strip {
  inner: Pt[];
  outer: Pt[];
}

/** Facets to a quarter circle of a rounded rectangle, and to a whole oval, at each cut. */
export const ARC_STEPS: Readonly<Record<Cut, { corner: number; oval: number; poly: number }>> = { low: { corner: 1, oval: 12, poly: 12 }, auto: { corner: 3, oval: 28, poly: 28 }, high: { corner: 6, oval: 56, poly: 56 } };

/** A rounded rectangle as a closed loop of points: `steps + 1` on each of its four corners, going clockwise as the page shows it from the left end of the top. */
function rrectLoop(o: Extract<Outline, { kind: "rrect" }>, steps: number): Pt[] {
  const r = Math.min(o.r, (o.x1 - o.x0) / 2, (o.y1 - o.y0) / 2);
  const corners: [number, number, number][] = [
    [o.x0 + r, o.y0 + r, 180],
    [o.x1 - r, o.y0 + r, 270],
    [o.x1 - r, o.y1 - r, 0],
    [o.x0 + r, o.y1 - r, 90],
  ];
  const out: Pt[] = [];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= steps; i += 1) {
      const a = ((a0 + (90 * i) / steps) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  out.push(out[0]);
  return out;
}

/** An oval as a closed loop of `count` points and the first again. */
function ovalLoop(o: Extract<Outline, { kind: "ellipse" }>, count: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= count; i += 1) {
    const a = (2 * Math.PI * (i % count)) / count;
    out.push([o.cx + o.rx * Math.cos(a), o.cy + o.ry * Math.sin(a)]);
  }
  return out;
}

/** The points of a polygon made by `band()`: the first half is the inner edge, the second the outer edge back again. Cut to at most `most` quads. */
function polyStrip(points: readonly Pt[], most: number): Strip {
  const m = points.length / 2;
  const inner = points.slice(0, m);
  const outer = points.slice(m).reverse();
  const every = Math.max(1, Math.ceil((m - 1) / most));
  const keep: number[] = [];
  for (let i = 0; i < m - 1; i += every) keep.push(i);
  keep.push(m - 1);
  return { inner: keep.map((i) => inner[i]), outer: keep.map((i) => outer[i]) };
}

/** The strips of one tier of the stands: its band between `hole` and `region`, with the pieces that are apart from it. */
export function stripsOf(region: Outline, hole: Outline | null, more: readonly Outline[], cut: Cut): Strip[] {
  const steps = ARC_STEPS[cut];
  if (region.kind === "poly") return [region, ...more].flatMap((piece) => (piece.kind === "poly" && piece.points.length >= 4 ? [polyStrip(piece.points, steps.poly)] : []));
  if (hole === null) return [];
  if (region.kind === "rrect" && hole.kind === "rrect") return [{ inner: rrectLoop(hole, steps.corner), outer: rrectLoop(region, steps.corner) }];
  if (region.kind === "ellipse" && hole.kind === "ellipse") return [{ inner: ovalLoop(hole, steps.oval), outer: ovalLoop(region, steps.oval) }];
  return [];
}

/** The strip a ring's concourse is: from one outline to another. */
export const stripBetween = (inner: Outline, outer: Outline, cut: Cut): Strip[] => stripsOf(outer, inner, [], cut);

// ---- Polygons. ----

/** A polygon without its repeated neighbours (and its closing point, if given). */
export function tidy(points: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last === undefined || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-6) out.push([p[0], p[1]]);
  }
  while (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) <= 1e-6) out.pop();
  return out;
}

/** The area of a polygon, signed: positive going clockwise on a page with y down. */
export function areaOf(points: readonly Pt[]): number {
  let s = 0;
  points.forEach(([x, y], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    s += x * y2 - x2 * y;
  });
  return s / 2;
}

/** A polygon cut to one side of a line `a x + b y <= c` (Sutherland and Hodgman). */
function halfPlane(poly: readonly Pt[], a: number, b: number, c: number): Pt[] {
  const out: Pt[] = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    const dp = a * p[0] + b * p[1] - c;
    const dq = a * q[0] + b * q[1] - c;
    if (dp <= 0) out.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
      const t = dp / (dp - dq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  });
  return out;
}

/** A polygon cut to the inside of a convex polygon (either way round). */
export function clipConvex(subject: readonly Pt[], clip: readonly Pt[]): Pt[] {
  const sign = areaOf(clip) >= 0 ? 1 : -1;
  let out: Pt[] = [...subject];
  clip.forEach((p, i) => {
    if (out.length === 0) return;
    const q = clip[(i + 1) % clip.length];
    // The inside is to the right of the edge on a page with y down for a clockwise polygon: the half-plane keeps points where the cross product has the polygon's sign.
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    out = halfPlane(out, sign * ey, -sign * ex, sign * (ey * p[0] - ex * p[1]));
  });
  return out;
}

/** A polygon with a box `[x0, y0, x1, y1]` taken out of it: the pieces left (left of it, right of it, and above and below it between), which are convex when the polygon is. */
export function clipOutside(poly: readonly Pt[], box: readonly [number, number, number, number]): Pt[][] {
  const [x0, y0, x1, y1] = box;
  const middle = halfPlane(halfPlane(poly, -1, 0, -x0), 1, 0, x1);
  const pieces = [halfPlane(poly, 1, 0, x0), halfPlane(poly, -1, 0, -x1), halfPlane(middle, 0, 1, y0), halfPlane(middle, 0, -1, -y1)];
  return pieces.map((p) => tidy(p)).filter((p) => p.length >= 3 && Math.abs(areaOf(p)) > 0.05);
}

/** A polygon with every box taken out of it. */
export function clipAround(poly: readonly Pt[], boxes: readonly (readonly [number, number, number, number])[]): Pt[][] {
  let pieces: Pt[][] = [tidy(poly)];
  for (const box of boxes) pieces = pieces.flatMap((p) => clipOutside(p, box));
  return pieces;
}

/** A segment cut to the inside of a convex polygon (Cyrus and Beck), or `undefined` when none of it is. */
export function clipSegment(a: Pt, b: Pt, clip: readonly Pt[]): [Pt, Pt] | undefined {
  const sign = areaOf(clip) >= 0 ? 1 : -1;
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (let i = 0; i < clip.length; i += 1) {
    const p = clip[i];
    const q = clip[(i + 1) % clip.length];
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    // The inside has `sign * (ex * (y - p.y) - ey * (x - p.x)) >= 0`.
    const num = sign * (ex * (a[1] - p[1]) - ey * (a[0] - p[0]));
    const den = sign * (ex * dy - ey * dx);
    if (Math.abs(den) < 1e-12) {
      if (num < -1e-9) return undefined;
      continue;
    }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return undefined;
  }
  return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
}

// ---- Raked planes. ----

/** How the height of a raked plane changes with place: `z = z0 + gx (x - x0) + gy (y - y0)`. */
export interface Slope {
  x0: number;
  y0: number;
  z0: number;
  gx: number;
  gy: number;
}

export const heightAt = (s: Slope, x: number, y: number): number => s.z0 + s.gx * (x - s.x0) + s.gy * (y - s.y0);

/** The slope of a quad of a band: the height `h0` along its inner edge, `h1` along its outer, rising across it. `undefined` for a quad with no width. */
export function slopeOf(q: readonly [Pt, Pt, Pt, Pt], h0: number, h1: number): { slope: Slope; out: Pt; along: Pt } | undefined {
  const [i0, i1, o1, o0] = q;
  // The edge that runs along the band: the inner, or the outer where the inner has shrunk to a point.
  const longIn = Math.hypot(i1[0] - i0[0], i1[1] - i0[1]);
  const longOut = Math.hypot(o1[0] - o0[0], o1[1] - o0[1]);
  if (longIn < 1e-6 && longOut < 1e-6) return undefined;
  const [from, to, far] = longIn >= longOut ? [i0, i1, o0] : [o0, o1, i0];
  const ex = (to[0] - from[0]) / Math.hypot(to[0] - from[0], to[1] - from[1]);
  const ey = (to[1] - from[1]) / Math.hypot(to[0] - from[0], to[1] - from[1]);
  // The way across the band, away from the inner edge.
  let nx = -ey;
  let ny = ex;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const mi = mid(i0, i1);
  const mo = mid(o0, o1);
  if (nx * (mo[0] - mi[0]) + ny * (mo[1] - mi[1]) < 0) {
    nx = -nx;
    ny = -ny;
  }
  const across = Math.abs(nx * (far[0] - from[0]) + ny * (far[1] - from[1]));
  if (across < 1e-6) return undefined;
  // `from` is on the inner edge when it came from there, else on the outer one.
  const z0 = longIn >= longOut ? h0 : h1;
  const slope: Slope = { x0: from[0], y0: from[1], z0, gx: (nx * (h1 - h0)) / across, gy: (ny * (h1 - h0)) / across };
  return { slope, out: [nx, ny], along: [ex, ey] };
}

/**
 * A planar polygon as one plane: its corner and its two sides are in the polygon's own plane, its `u` along the horizontal direction `along` (so that a texture's rows run along a band), its `v` across.
 * `paint` is given the polygon's corners in the plane's own feet (and a function that puts any plan point there) and answers the SVG drawn on it.
 */
export function raked(id: string, kind: Plane["kind"], poly: readonly Pt[], slope: Slope, along: Pt, paint: (corners: Pt[], local: (p: Pt) => Pt) => string): Plane | undefined {
  if (poly.length < 3) return undefined;
  const at = (p: Pt): V3 => [p[0], p[1], heightAt(slope, p[0], p[1])];
  const ud: V3 = [along[0], along[1], slope.gx * along[0] + slope.gy * along[1]];
  const ul = Math.hypot(...ud);
  const uh: V3 = [ud[0] / ul, ud[1] / ul, ud[2] / ul];
  // The way up the slope: perpendicular to `u` in the polygon's plane.
  const across: V3 = [-along[1], along[0], slope.gx * -along[1] + slope.gy * along[0]];
  const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const va = dot(across, uh);
  const vperp: V3 = [across[0] - uh[0] * va, across[1] - uh[1] * va, across[2] - uh[2] * va];
  const vl = Math.hypot(...vperp);
  if (vl < 1e-9) return undefined;
  const vh: V3 = [vperp[0] / vl, vperp[1] / vl, vperp[2] / vl];
  const base = at(poly[0]);
  const loc = (p: Pt): Pt => {
    const q = at(p);
    const d: V3 = [q[0] - base[0], q[1] - base[1], q[2] - base[2]];
    return [dot(d, uh), dot(d, vh)];
  };
  const pts = poly.map(loc);
  const a0 = Math.min(...pts.map((p) => p[0]));
  const a1 = Math.max(...pts.map((p) => p[0]));
  const b0 = Math.min(...pts.map((p) => p[1]));
  const b1 = Math.max(...pts.map((p) => p[1]));
  const o: V3 = [base[0] + uh[0] * a0 + vh[0] * b0, base[1] + uh[1] * a0 + vh[1] * b0, base[2] + uh[2] * a0 + vh[2] * b0];
  const shifted = (p: Pt): Pt => {
    const [a, b] = loc(p);
    return [a - a0, b - b0];
  };
  return plane(id, kind, o, [uh[0] * (a1 - a0), uh[1] * (a1 - a0), uh[2] * (a1 - a0)], [vh[0] * (b1 - b0), vh[1] * (b1 - b0), vh[2] * (b1 - b0)], paint(pts.map(([a, b]): Pt => [a - a0, b - b0]), shifted));
}

/** Points as the `points` attribute of a polygon. */
export const pointList = (pts: readonly Pt[]): string => pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
