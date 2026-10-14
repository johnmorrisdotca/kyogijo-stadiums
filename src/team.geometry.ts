// The geometry of a team's shape, written for this package from the plain mathematics and no code of any library: the convex hull of
// some points (Andrew's monotone chain), their Delaunay triangulation (Bowyer and Watson's incremental method, with the hull kept by
// "ghost" triangles instead of a super triangle, so that no sliver of the hull is lost), and the cells of their Voronoi diagram, which are
// the surface's box cut by the bisector of each neighbour in the triangulation. Every function is pure, takes `[x, y]` pairs and gives
// the same answer for the same input. Degenerate input is an answer and not an error: no points, one, two, all on a line, and the same
// point twice.

/** A place, `[x, y]`. */
export type Pt = readonly [number, number];

const same = (a: Pt, b: Pt): boolean => a[0] === b[0] && a[1] === b[1];

/** Twice the signed area of the triangle a, b, c: positive when c is to the left of a→b with y up (counter-clockwise), 0 when the three are on a line to within rounding. */
function orient(a: Pt, b: Pt, c: Pt): number {
  const left = (a[0] - c[0]) * (b[1] - c[1]);
  const right = (a[1] - c[1]) * (b[0] - c[0]);
  const det = left - right;
  return Math.abs(det) <= 3.4e-16 * (Math.abs(left) + Math.abs(right)) ? 0 : det;
}

/** Positive when d is inside the circle through a, b, c (counter-clockwise), and not within rounding of its edge. */
function inCircle(a: Pt, b: Pt, c: Pt, d: Pt): number {
  const adx = a[0] - d[0];
  const ady = a[1] - d[1];
  const bdx = b[0] - d[0];
  const bdy = b[1] - d[1];
  const cdx = c[0] - d[0];
  const cdy = c[1] - d[1];
  const alift = adx * adx + ady * ady;
  const blift = bdx * bdx + bdy * bdy;
  const clift = cdx * cdx + cdy * cdy;
  const bc = bdx * cdy;
  const cb = cdx * bdy;
  const ca = cdx * ady;
  const ac = adx * cdy;
  const ab = adx * bdy;
  const ba = bdx * ady;
  const det = alift * (bc - cb) + blift * (ca - ac) + clift * (ab - ba);
  const permanent = (Math.abs(bc) + Math.abs(cb)) * alift + (Math.abs(ca) + Math.abs(ac)) * blift + (Math.abs(ab) + Math.abs(ba)) * clift;
  return det > 1e-12 * permanent ? det : 0;
}

/**
 * The convex hull of some points: its corners in order, counter-clockwise with y up (clockwise on a page, where y is down), starting at the least x. A point on an edge of the hull is
 * not a corner. The same point twice is one. With no points the hull is empty, with one it is that point, and with two or with all on a line it is the two ends.
 * @example
 * ```ts
 * import { convexHull } from "@johnmorrisdotca/kyogijo-stadiums/layers";
 * console.log(convexHull([[0, 0], [4, 0], [2, 0], [4, 3], [1, 1], [0, 3]]));
 * // [ [ 0, 0 ], [ 4, 0 ], [ 4, 3 ], [ 0, 3 ] ]
 * ```
 */
export function convexHull(points: readonly Pt[]): Pt[] {
  const sorted = points.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])).map((p): Pt => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const unique = sorted.filter((p, i) => i === 0 || !same(p, sorted[i - 1]));
  if (unique.length < 3) return unique;
  const build = (list: readonly Pt[]): Pt[] => {
    const chain: Pt[] = [];
    for (const p of list) {
      while (chain.length >= 2 && orient(chain[chain.length - 2], chain[chain.length - 1], p) <= 0) chain.pop();
      chain.push(p);
    }
    chain.pop();
    return chain;
  };
  const lower = build(unique);
  const upper = build([...unique].reverse());
  const hull = [...lower, ...upper];
  // All on a line: both chains are the two ends, which the join has twice.
  return hull.length <= 2 || hull.every((p, i) => i < 2 || orient(hull[0], hull[1], p) === 0) ? [unique[0], unique[unique.length - 1]] : hull;
}

/** The area of a polygon given by its corners (any orientation); 0 for fewer than three. */
export function polygonArea(polygon: readonly Pt[]): number {
  let twice = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    twice += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(twice) / 2;
}

/** The centre of mass of a polygon's area, or the mean of its corners when it has none (a point, a line). `undefined` for no corners. */
export function polygonCentroid(polygon: readonly Pt[]): Pt | undefined {
  if (polygon.length === 0) return undefined;
  let twice = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = a[0] * b[1] - b[0] * a[1];
    twice += cross;
    cx += (a[0] + b[0]) * cross;
    cy += (a[1] + b[1]) * cross;
  }
  if (twice === 0) return [polygon.reduce((s, p) => s + p[0], 0) / polygon.length, polygon.reduce((s, p) => s + p[1], 0) / polygon.length];
  return [cx / (3 * twice), cy / (3 * twice)];
}

/** A triangulation: the distinct points, the triangles as triples of indices into them (counter-clockwise with y up), and where each input point went. */
export interface Triangulation {
  /** The distinct points, in the order they were first given. */
  points: Pt[];
  /** Three indices into `points` for each triangle, flat: `triangles[3 * k]`, `[3 * k + 1]`, `[3 * k + 2]`. Empty for fewer than three points and for points all on a line. */
  triangles: number[];
  /** For each input point, the index in `points` of the point it is (a repeated point is the first one). */
  of: number[];
}

const GHOST = -1;

interface Tri {
  v: [number, number, number];
  /** The circumcircle of a real triangle, for a quick test before the exact one. */
  cx: number;
  cy: number;
  r2: number;
}

function circle(points: readonly Pt[], v: [number, number, number]): Tri {
  if (v[2] === GHOST) return { v, cx: 0, cy: 0, r2: -1 };
  const [a, b, c] = [points[v[0]], points[v[1]], points[v[2]]];
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  if (d === 0) return { v, cx: 0, cy: 0, r2: -1 };
  const a2 = a[0] * a[0] + a[1] * a[1];
  const b2 = b[0] * b[0] + b[1] * b[1];
  const c2 = c[0] * c[0] + c[1] * c[1];
  const cx = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d;
  const cy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
  return { v, cx, cy, r2: (a[0] - cx) ** 2 + (a[1] - cy) ** 2 };
}

/**
 * The Delaunay triangulation of some points: triangles whose circumcircle holds no other point, which cover the points' convex hull. Bowyer and
 * Watson's method: each point is added by removing the triangles whose circumcircle holds it and joining it to the edge of the hole. The hull is
 * kept by "ghost" triangles (an edge and a point at infinity) in place of a big triangle round everything, so that a point on or beyond the hull
 * is handled exactly and no sliver of the hull is lost. Points are added from the least x, so the answer does not depend on the order given
 * (up to which of four points on one circle are joined). Points that are not finite numbers are not allowed; a repeated point is one point.
 * @example
 * ```ts
 * import { delaunay } from "@johnmorrisdotca/kyogijo-stadiums/layers";
 * const t = delaunay([[0, 0], [10, 0], [5, 8], [5, 3]]);
 * console.log(t.points.length, t.triangles.length / 3);
 * // 4 3
 * ```
 */
export function delaunay(input: readonly Pt[]): Triangulation {
  const points: Pt[] = [];
  const of: number[] = [];
  const seen = new Map<string, number>();
  for (const p of input) {
    const key = `${p[0]},${p[1]}`;
    let j = seen.get(key);
    if (j === undefined) {
      j = points.length;
      seen.set(key, j);
      points.push([p[0], p[1]]);
    }
    of.push(j);
  }
  const result: Triangulation = { points, triangles: [], of };
  if (points.length < 3) return result;
  const order = points.map((_, i) => i).sort((i, j) => points[i][0] - points[j][0] || points[i][1] - points[j][1] || i - j);
  const a = order[0];
  const b = order[1];
  let k = 2;
  while (k < order.length && orient(points[a], points[b], points[order[k]]) === 0) k += 1;
  // Every point on one line: there are no triangles.
  if (k === order.length) return result;
  const c = order[k];
  const start: [number, number, number] = orient(points[a], points[b], points[c]) > 0 ? [a, b, c] : [a, c, b];
  let tris: Tri[] = [circle(points, start), circle(points, [start[1], start[0], GHOST]), circle(points, [start[2], start[1], GHOST]), circle(points, [start[0], start[2], GHOST])];
  const width = points.length + 2;
  const key = (u: number, v: number): number => (u + 1) * width + (v + 1);
  const bad = (t: Tri, r: Pt): boolean => {
    const [u, v, w] = t.v;
    if (w === GHOST) {
      const o = orient(points[u], points[v], r);
      if (o > 0) return true;
      // On the hull's edge, strictly between its ends: the edge is split.
      return o === 0 && (r[0] - points[u][0]) * (points[v][0] - points[u][0]) + (r[1] - points[u][1]) * (points[v][1] - points[u][1]) > 0 && (r[0] - points[v][0]) * (points[u][0] - points[v][0]) + (r[1] - points[v][1]) * (points[u][1] - points[v][1]) > 0;
    }
    if (t.r2 >= 0) {
      const d2 = (r[0] - t.cx) ** 2 + (r[1] - t.cy) ** 2;
      if (d2 > t.r2 * (1 + 1e-9)) return false;
      if (d2 < t.r2 * (1 - 1e-9)) return true;
    }
    return inCircle(points[u], points[v], points[w], r) > 0;
  };
  for (let n = 0; n < order.length; n += 1) {
    const i = order[n];
    if (i === a || i === b || i === c) continue;
    const r = points[i];
    const kept: Tri[] = [];
    const edges = new Set<number>();
    const removed: Tri[] = [];
    for (const t of tris) {
      if (bad(t, r)) {
        removed.push(t);
        edges.add(key(t.v[0], t.v[1]));
        edges.add(key(t.v[1], t.v[2]));
        edges.add(key(t.v[2], t.v[0]));
      } else kept.push(t);
    }
    for (const t of removed) {
      for (let e = 0; e < 3; e += 1) {
        const u = t.v[e];
        const v = t.v[(e + 1) % 3];
        // An edge of the hole is one whose reverse is not an edge of a removed triangle.
        if (edges.has(key(v, u))) continue;
        kept.push(circle(points, u === GHOST ? [v, i, GHOST] : v === GHOST ? [i, u, GHOST] : [u, v, i]));
      }
    }
    tris = kept;
  }
  for (const t of tris) if (t.v[2] !== GHOST && t.v[0] !== GHOST && t.v[1] !== GHOST) result.triangles.push(t.v[0], t.v[1], t.v[2]);
  return result;
}

/** For each distinct point of a triangulation, the points it shares a triangle edge with, in increasing order. */
export function neighbours(t: Triangulation): number[][] {
  const sets = t.points.map(() => new Set<number>());
  for (let k = 0; k < t.triangles.length; k += 3) {
    for (let e = 0; e < 3; e += 1) {
      const u = t.triangles[k + e];
      const v = t.triangles[k + ((e + 1) % 3)];
      sets[u].add(v);
      sets[v].add(u);
    }
  }
  return sets.map((s) => [...s].sort((x, y) => x - y));
}

/** The edges of a triangulation, each once, as pairs of indices into its points with the smaller first, in order. */
export function triangulationEdges(t: Triangulation): [number, number][] {
  const out = new Map<number, [number, number]>();
  const width = t.points.length + 1;
  for (let k = 0; k < t.triangles.length; k += 3) {
    for (let e = 0; e < 3; e += 1) {
      const u = t.triangles[k + e];
      const v = t.triangles[k + ((e + 1) % 3)];
      const lo = Math.min(u, v);
      const hi = Math.max(u, v);
      out.set(lo * width + hi, [lo, hi]);
    }
  }
  return [...out.entries()].sort((x, y) => x[0] - y[0]).map(([, pair]) => pair);
}

/** A convex polygon cut to the side of the line that is nearer `a` than `b` (Sutherland and Hodgman's clip against one half plane). */
export function clipNearer(polygon: readonly Pt[], a: Pt, b: Pt): Pt[] {
  // Points p with |p-a|² <= |p-b|²: (b-a)·p <= (|b|²-|a|²)/2.
  const nx = b[0] - a[0];
  const ny = b[1] - a[1];
  const c = (b[0] * b[0] + b[1] * b[1] - a[0] * a[0] - a[1] * a[1]) / 2;
  const f = (p: Pt): number => nx * p[0] + ny * p[1] - c;
  const out: Pt[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const p = polygon[i];
    const q = polygon[(i + 1) % polygon.length];
    const fp = f(p);
    const fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/**
 * The Voronoi cells of some points inside a box: for each input point, the corners of the part of the box nearer to it than to any other point,
 * in order. The cells tile the box. A point given twice has the cell on its first appearance and an empty one on its second. With one point the
 * cell is the box; with points all on a line the cells are strips. The neighbours that cut a cell are the triangulation's, so a cell is made
 * from a handful of cuts and not from every other point.
 * @example
 * ```ts
 * import { voronoiCells } from "@johnmorrisdotca/kyogijo-stadiums/layers";
 * const cells = voronoiCells([[2, 5], [8, 5]], { x: 0, y: 0, w: 10, h: 10 });
 * console.log(cells[0].length, cells[1].map((p) => p.join(",")).join(" "));
 * // 4 5,0 10,0 10,10 5,10
 * ```
 */
export function voronoiCells(points: readonly Pt[], box: { x: number; y: number; w: number; h: number }): Pt[][] {
  const frame: Pt[] = [[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]];
  const t = delaunay(points);
  const near: number[][] = t.triangles.length > 0 ? neighbours(t) : lineNeighbours(t.points);
  const cells: Pt[][] = t.points.map((p, i) => {
    let cell: Pt[] = frame;
    for (const j of near[i]) {
      cell = clipNearer(cell, p, t.points[j]);
      if (cell.length === 0) break;
    }
    return cell;
  });
  const first = new Set<number>();
  return t.of.map((j) => {
    if (first.has(j)) return [];
    first.add(j);
    return cells[j];
  });
}

/** The neighbours of points with no triangles: none for one point; the next and the one before along the line for points on a line. */
function lineNeighbours(points: readonly Pt[]): number[][] {
  const order = points.map((_, i) => i).sort((i, j) => points[i][0] - points[j][0] || points[i][1] - points[j][1]);
  const out: number[][] = points.map(() => []);
  order.forEach((i, rank) => {
    if (rank > 0) out[i].push(order[rank - 1]);
    if (rank < order.length - 1) out[i].push(order[rank + 1]);
  });
  return out;
}
