// The building of a real venue, raised: its walls, standing on the outline OpenStreetMap gives, and its roof over the top tier, a lid that rises towards the middle, a saddle that rises at the two ends and falls at the two
// sides, a cable-supported roof that rises to an opening over the surface which a retractable fabric closes (BC Place's, with the fabric gathered into its pod when `roofOpen` is asked), canopies over some of the
// stands that leave the field open (Lumen Field's), retractable panels high over a ballpark (T-Mobile Park's, resting over its east side when `roofOpen` is asked), an air-supported dome (Tokyo Dome's: a smooth lens of
// membrane from the rim of the walls to a crown, which never opens), or no roof at all (Koshien Stadium's). All are asked for with the roof (`venue: { roof: true }`) and give way to the eye as the other walls do.
// Pure: data in, planes out.
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
export function firstHit(poly: readonly Pt[], from: Pt, angle: number): Pt | undefined {
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

/** How tall the glazed concourse band over a podium is, in feet (ours). */
export const GLAZING = 14;

/** A wall's two bands: the podium at its foot (a shade darker), a ledge over it and a band of glazing over the ledge, on the wall's own plane (its y runs down from the top). */
function podiumBands(long: number, high: number, podium: number): string {
  const top = Math.min(podium, high * 0.6);
  const glaze = Math.min(GLAZING, Math.max(0, high - top - 4));
  return `<rect class="u-podium" y="${n(high - top)}" width="${n(long)}" height="${n(top)}"/><rect class="u-ledge" y="${n(high - top - 1.2)}" width="${n(long)}" height="1.2"/>${glaze > 2 ? `<rect class="u-glazing" y="${n(high - top - 1.2 - glaze)}" width="${n(long)}" height="${n(glaze)}"/>` : ""}`;
}

/** The point of the hall's rim at an angle from the middle: where a ray meets the hall's outline or the building's, whichever it meets first. */
export function rimPoint(real: Pick<RealShell, "hall" | "footprint">, c: Pt, angle: number): Pt {
  const cap = rayAt(real.hall, c[0], c[1], angle);
  const out = firstHit(real.footprint, c, angle);
  return out !== undefined && Math.hypot(out[0] - c[0], out[1] - c[1]) < Math.hypot(cap[0] - c[0], cap[1] - c[1]) ? out : cap;
}

/** How far a mast leans out from the vertical, in degrees (ours: the sources give the count and the height of BC Place's masts, and the photographs of the building show them leaning out from the rim). */
export const MAST_LEAN = 12;
/** How thick a mast is drawn, in feet (ours). */
export const MAST_WIDTH = 6;

/**
 * The masts of a cable roof: `count` of them round the rim, each rising from the rim at the roof's edge, `height` feet, leaning out from the middle. A mast is two thin strips crossed, one in the plane of the slant and the
 * radius and one in the plane of the slant and the tangent, so that it is seen from every side (as a post is). The count and the height are the sources'; the lean and the thickness are ours.
 */
export function mastPlanes(real: Pick<RealShell, "hall" | "footprint">, c: Pt, z: number, masts: { count: number; height: number }): Plane[] {
  const planes: Plane[] = [];
  const lean = (MAST_LEAN * Math.PI) / 180;
  for (let i = 0; i < masts.count; i += 1) {
    const angle = (2 * Math.PI * (i + 0.5)) / masts.count;
    const [bx, by] = rimPoint(real, c, angle);
    const [rx, ry] = [Math.cos(angle), Math.sin(angle)];
    const [tx, ty] = [-ry, rx];
    const slant: V3 = [rx * masts.height * Math.sin(lean), ry * masts.height * Math.sin(lean), masts.height * Math.cos(lean)];
    const long = Math.hypot(...slant);
    const half = MAST_WIDTH / 2;
    const svg = `<polygon class="u-mast" points="0 ${n(half)} ${n(long)} ${n(half * 0.45)} ${n(long)} ${n(half * 1.55)}"/>`;
    // A strip along the slant, across the tangent; and one along the slant, across the radius.
    planes.push({ id: `mast-${i}-a`, kind: "mast", o: [bx - tx * half, by - ty * half, z], u: slant, v: [tx * MAST_WIDTH, ty * MAST_WIDTH, 0], svg });
    planes.push({ id: `mast-${i}-b`, kind: "mast", o: [bx - rx * half, by - ry * half, z], u: slant, v: [rx * MAST_WIDTH, ry * MAST_WIDTH, 0], svg });
  }
  return planes;
}

/**
 * The walls and the roof of a real venue (`parts` says which are made). The hall is the building's outline cut to the bowl's wall and a margin (`RealShell.hall`): its rim is where a ray from the middle meets the one or the other first, in `steps`
 * rays. A wall stands on each stretch of the rim, up to the roof's height over it; the roof is a band from the rim in to the inner edge of the top tier (the middle stays open, as the 3D view's roofs are).
 */
export function realBuilding(real: RealShell, top: StandRing | undefined, centre: readonly [number, number], lift: number, steps: number, open = false, parts: { walls: boolean; roof: boolean } = { walls: true, roof: true }): Items {
  const items: Upright[] = [];
  const c: Pt = [centre[0], centre[1]];
  const rim = Array.from({ length: steps }, (_, k): Pt => rimPoint(real, c, (2 * Math.PI * k) / steps));
  const planes: Plane[] = [];
  rim.forEach((a, i) => {
    const b = rim[(i + 1) % steps];
    const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (long < 1) return;
    const high = lift + (real.wall ?? roofAt(real, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]));
    planes.push({ ...shy(wall(`shell-${i}`, "wall", a[0], a[1], b[0], b[1], 0, high, `<rect class="${real.ivy === true ? "u-shell u-ivy" : "u-shell"}" width="${n(long)}" height="${n(high)}"/>${real.podium === undefined ? "" : podiumBands(long, high, real.podium)}`), centre), fadeTo: 0.02 });
  });
  if (parts.walls && planes.length > 0) items.push({ id: "shell", kind: "walls", at: centre, height: Math.max(...planes.map((p) => p.o[2])), planes });
  if (parts.roof && real.roof === "canopy" && real.canopies !== undefined) {
    const planes = canopyRoof(real.canopies, c, lift, steps);
    if (planes.length > 0) items.push({ id: "roof", kind: "roof", at: centre, height: heightOf(planes), planes });
    return items;
  }
  if (parts.roof && real.roof === "dome" && real.dome !== undefined) {
    const planes = domeRoof(real.dome, lift, steps);
    if (planes.length > 0) items.push({ id: "roof", kind: "roof", at: centre, height: heightOf(planes), planes });
    return items;
  }
  // An open-air ballpark has walls and no roof.
  if (real.roof === "open") return items;
  if (parts.roof && real.roof === "panels" && real.panels !== undefined) {
    const planes = panelsRoof(real.panels, c, lift, steps, open);
    if (planes.length > 0) items.push({ id: "roof", kind: "roof", at: centre, height: heightOf(planes), planes });
    return items;
  }
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
  if (crown === undefined && real.skylight === true) roof.push(...skylightCap(inner, c, lift + real.edge + rise));
  if (crown !== undefined) roof.push(...cablePod(lift + real.edge + crown.rise, inner, c, steps, open));
  if (crown !== undefined && real.masts !== undefined) roof.push(...mastPlanes(real, c, lift + real.edge, real.masts));
  if (roof.length > 0) items.push({ id: "roof", kind: "roof", at: centre, height: heightOf(roof), planes: roof });
  return items;
}

/** How far a skylight cap stands over the inner edge of the roof's band, and how wide the skylight bar is, in feet (ours: the sources do not say how high the roof closes or how wide the glass is). */
export const CAP_RISE = 7;
export const SKYLIGHT_WIDTH = 14;
/** The share of the opening's length the skylight bar runs over, from the middle each way. */
export const SKYLIGHT_SHARE = 0.78;

/**
 * Close the roof's middle: the opening the band leaves is covered at `z` by a flat cap raised `CAP_RISE` over the band's inner edge, with a short skirt joining the two, and over the middle of the cap along the long axis lies a long
 * skylight bar of glass (the roof of Rogers Arena has one; the surface's long side lies along x in the drawing's frame, so the bar runs along x). The shape and the sizes are ours.
 */
function skylightCap(hole: readonly Pt[], c: Pt, z: number): Plane[] {
  const planes: Plane[] = [];
  const top = z + CAP_RISE;
  const cap = raked("cap", "roof", hole, { x0: c[0], y0: c[1], z0: top, gx: 0, gy: 0 }, [1, 0], (corners) => `<polygon class="u-roof" points="${pointList(corners)}"/>`);
  if (cap !== undefined) planes.push(cap);
  hole.forEach((a, k) => {
    const b = hole[(k + 1) % hole.length];
    const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (long < 0.5) return;
    planes.push({ ...shy(wall(`skirt-${k}`, "roof", a[0], a[1], b[0], b[1], z, top, `<rect class="u-roof" width="${n(long)}" height="${n(CAP_RISE)}"/>`), c), fadeTo: 0.3 });
  });
  const xs = hole.map((p) => p[0]);
  const half = ((Math.max(...xs) - Math.min(...xs)) / 2) * SKYLIGHT_SHARE;
  const bar: Pt[] = [[c[0] - half, c[1] - SKYLIGHT_WIDTH / 2], [c[0] + half, c[1] - SKYLIGHT_WIDTH / 2], [c[0] + half, c[1] + SKYLIGHT_WIDTH / 2], [c[0] - half, c[1] + SKYLIGHT_WIDTH / 2]];
  const glass = raked("skylight", "roof", bar, { x0: c[0], y0: c[1], z0: top + 0.4, gx: 0, gy: 0 }, [1, 0], (corners) => `<polygon class="u-skylight" points="${pointList(corners)}"/>`);
  if (glass !== undefined) planes.push(glass);
  return planes;
}

/** The top of a set of planes. */
const heightOf = (planes: readonly Plane[]): number => Math.max(...planes.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]]));

/** The two points where a ray from `from` first enters a polygon and last leaves it (the polygon is a band round the middle, so a ray crosses it once), or `undefined` where it misses. */
function span(poly: readonly Pt[], from: Pt, angle: number): [Pt, Pt] | undefined {
  const [dx, dy] = [Math.cos(angle), Math.sin(angle)];
  const hits: number[] = [];
  poly.forEach(([ax, ay], i) => {
    const [bx, by] = poly[(i + 1) % poly.length];
    const [ex, ey] = [bx - ax, by - ay];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) return;
    const t = ((ax - from[0]) * ey - (ay - from[1]) * ex) / den;
    const u = ((ax - from[0]) * dy - (ay - from[1]) * dx) / den;
    if (t > 1e-6 && u >= 0 && u < 1) hits.push(t);
  });
  if (hits.length < 2) return undefined;
  const [lo, hi] = [Math.min(...hits), Math.max(...hits)];
  return [[from[0] + dx * lo, from[1] + dy * lo], [from[0] + dx * hi, from[1] + dy * hi]];
}

/**
 * A piece of roof between two rays: the quad `[inner a, inner b, outer b, outer a]` at the heights given, as a plane that gives way to the eye. A quad whose edges are not parallel is not flat at those heights, so
 * with `exact` it is two triangles, each a plane through its corners.
 */
function piece(id: string, quad: Pt[], heights: number[], c: Pt, cables: boolean, exact = false): Plane[] {
  const [ai, bi, b, a] = quad;
  const [ex, ey] = [b[0] - a[0], b[1] - a[1]];
  const el = Math.hypot(ex, ey);
  if (el < 1e-6) return [];
  const make = (name: string, poly: Pt[], hs: number[], cable: boolean): Plane[] => {
    const slope = slopeThrough(poly.map((p, i): V3 => [p[0], p[1], hs[i]]));
    const mid: Pt = [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
    const away = Math.hypot(mid[0] - c[0], mid[1] - c[1]) || 1;
    const paint = (corners: Pt[]): string => `<polygon class="u-roof" points="${pointList(corners)}"/>${cable ? `<path class="u-cable" d="M${n(corners[0][0])} ${n(corners[0][1])}L${n(corners[3][0])} ${n(corners[3][1])}"/>` : ""}`;
    const plane = raked(name, "roof", poly, slope, [ex / el, ey / el], paint);
    return plane === undefined ? [] : [{ ...plane, shy: [(mid[0] - c[0]) / away, (mid[1] - c[1]) / away] }];
  };
  if (!exact) return make(id, quad, heights, cables);
  return [...make(`${id}a`, [ai, bi, b], [heights[0], heights[1], heights[2]], false), ...make(`${id}b`, [ai, b, a], [heights[0], heights[2], heights[3]], false)];
}

/** How far a canopy's low edge, the field's side of it, stands under its high edge: the OpenStreetMap roof's `roof:height` is the rise, and the canopy rises to the back of the stands (ours: the sources do not say which way it slopes). */
export const CANOPY_NOTE = "low over the field, high over the back of the stands";

/**
 * Canopies over some of the stands (Lumen Field's two, one each side of the field): each OpenStreetMap roof outline is cut by the rays from the middle of the field into the strips between them, the edge towards
 * the field low and the edge towards the back of the stands `rise` higher.
 */
function canopyRoof(canopies: NonNullable<RealShell["canopies"]>, c: Pt, lift: number, steps: number): Plane[] {
  const planes: Plane[] = [];
  canopies.forEach((canopy, ci) => {
    const spans = Array.from({ length: steps }, (_, k) => span(canopy.ring, c, (2 * Math.PI * k) / steps));
    for (let k = 0; k < steps; k += 1) {
      const [s, t] = [spans[k], spans[(k + 1) % steps]];
      if (s === undefined || t === undefined) continue;
      const [lo, hi] = [lift + canopy.low, lift + canopy.low + canopy.rise];
      planes.push(...piece(`roof-c${ci}-${k}`, [s[0], t[0], t[1], s[1]], [lo, lo, hi, hi], c, false, true));
    }
  });
  return planes;
}

/** How many rings of pieces an air-supported roof is drawn in, from the rim in to the crown (ours: the roof is smooth, the drawing is faceted). */
export const DOME_RINGS = 4;

/**
 * An air-supported roof: the membrane over the rim of the walls, a lens that stands `low` over the surface at the rim and rises to the `crown` over the middle (a shallow cap: the height falls with the square of the way
 * out to the rim), in rings of pieces between rays from the middle of the rim. Its pieces are drawn as the roof is (a pale skin with a thin line), so that the net of wires it is made on shows.
 */
function domeRoof(dome: NonNullable<RealShell["dome"]>, lift: number, steps: number): Plane[] {
  const planes: Plane[] = [];
  const mid: Pt = [dome.rim.reduce((s, p) => s + p[0], 0) / dome.rim.length, dome.rim.reduce((s, p) => s + p[1], 0) / dome.rim.length];
  const rim = Array.from({ length: steps }, (_, k): Pt => firstHit(dome.rim, mid, (2 * Math.PI * k) / steps) ?? mid);
  // The rings' share of the way out (1 is the rim), the outermost first, and the height there.
  const shares = Array.from({ length: DOME_RINGS + 1 }, (_, j) => 1 - (j * 0.85) / DOME_RINGS);
  // (The innermost ring is the crown itself, the flat cap's height, so that the roof reaches the height OpenStreetMap maps.)
  const at = (share: number): number => lift + (share === shares[DOME_RINGS] ? dome.crown : dome.low + (dome.crown - dome.low) * (1 - share * share));
  const ring = (share: number): Pt[] => rim.map((p): Pt => [mid[0] + (p[0] - mid[0]) * share, mid[1] + (p[1] - mid[1]) * share]);
  for (let j = 0; j < DOME_RINGS; j += 1) {
    const [outer, inner] = [ring(shares[j]), ring(shares[j + 1])];
    const [zo, zi] = [at(shares[j]), at(shares[j + 1])];
    for (let k = 0; k < steps; k += 1) {
      const [a, b] = [outer[k], outer[(k + 1) % steps]];
      const [ai, bi] = [inner[k], inner[(k + 1) % steps]];
      const [ex, ey] = [b[0] - a[0], b[1] - a[1]];
      const el = Math.hypot(ex, ey);
      if (el < 1e-6) continue;
      const slope = slopeThrough([[ai[0], ai[1], zi], [bi[0], bi[1], zi], [b[0], b[1], zo], [a[0], a[1], zo]]);
      const centre: Pt = [(a[0] + b[0] + ai[0] + bi[0]) / 4, (a[1] + b[1] + ai[1] + bi[1]) / 4];
      const away = Math.hypot(centre[0] - mid[0], centre[1] - mid[1]) || 1;
      const plane = raked(`roof-${j}-${k}`, "roof", [ai, bi, b, a], slope, [ex / el, ey / el], (corners) => `<polygon class="u-roof" points="${pointList(corners)}"/>`);
      if (plane !== undefined) planes.push({ ...plane, shy: [(centre[0] - mid[0]) / away, (centre[1] - mid[1]) / away], fadeTo: 0.2 });
    }
  }
  // The crown: a flat cap over the middle.
  const top = ring(shares[DOME_RINGS]);
  const cap = raked("roof-crown", "roof", top, { x0: mid[0], y0: mid[1], z0: at(shares[DOME_RINGS]), gx: 0, gy: 0 }, [1, 0], (corners) => `<polygon class="u-roof" points="${pointList(corners)}"/>`);
  if (cap !== undefined) planes.push({ ...cap, fadeTo: 0.2 });
  return planes;
}

/** The share of a retractable roof's cover that the closed roof's flat crown takes (the sections meet in the middle at the crown's height). */
const PANEL_CROWN = 0.3;
/** How thick a parked section is, in feet (ours). */
const PANEL_THICK = 7;

/**
 * A ballpark's retractable roof: closed, a band from the rim of its cover up to a crown over the middle with the fabric laid over the crown (as the cable roof's); open, only the sections resting over the side of the
 * building they park on, as slabs at the rim's height.
 */
function panelsRoof(panels: NonNullable<RealShell["panels"]>, c: Pt, lift: number, steps: number, open: boolean): Plane[] {
  const planes: Plane[] = [];
  if (!open) {
    const rim = Array.from({ length: steps }, (_, k): Pt => firstHit(panels.cover, c, (2 * Math.PI * k) / steps) ?? c);
    const inner = rim.map((p): Pt => [c[0] + (p[0] - c[0]) * PANEL_CROWN, c[1] + (p[1] - c[1]) * PANEL_CROWN]);
    for (let k = 0; k < steps; k += 1) {
      const [a, b] = [rim[k], rim[(k + 1) % steps]];
      const [ai, bi] = [inner[k], inner[(k + 1) % steps]];
      const [lo, hi] = [lift + panels.bottom, lift + panels.top];
      planes.push(...piece(`roof-${k}`, [ai, bi, b, a], [hi, hi, lo, lo], c, false, true));
    }
    // The crown itself: a flat cap over the middle, in the fabric's drawing.
    planes.push(...cablePod(lift + panels.top, inner, c, steps, false));
    return planes;
  }
  // Open: the parked sections as slabs.
  const z = lift + panels.bottom;
  const top = z + PANEL_THICK;
  const slab = raked("parked-top", "roof", panels.parked, { x0: panels.parked[0][0], y0: panels.parked[0][1], z0: top, gx: 0, gy: 0 }, [1, 0], (corners) => `<polygon class="u-pod" points="${pointList(corners)}"/>`);
  if (slab !== undefined) planes.push({ ...slab, id: "parked-top" });
  panels.parked.forEach((a, i) => {
    const b = panels.parked[(i + 1) % panels.parked.length];
    const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (long < 0.5) return;
    planes.push({ ...shy(wall(`parked-${i}`, "roof", a[0], a[1], b[0], b[1], z, top, `<rect class="u-pod" width="${n(long)}" height="${n(PANEL_THICK)}"/>`), c), fadeTo: 0.3 });
  });
  return planes;
}

/** The pod in the middle of a cable roof's opening, as a share of the opening's size, and how thick it is, in feet (ours: the article says the fabric gathers into a pod above the video board, not how large it is). */
export const POD = { share: 0.24, thick: 9 } as const;

/**
 * What lies over the opening of a cable roof: the pod in the middle (a box hung at the crown's height) and, with the roof closed, the fabric between the pod and the opening's edge, drawn thin so that the seats
 * show through it. Open, only the pod is there: the fabric has gathered into it.
 */
function cablePod(z: number, edge: readonly Pt[], c: Pt, steps: number, open: boolean): Plane[] {
  const planes: Plane[] = [];
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
