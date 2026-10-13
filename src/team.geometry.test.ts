import { describe, expect, it } from "vitest";
import { clipNearer, convexHull, delaunay, neighbours, polygonArea, polygonCentroid, triangulationEdges, voronoiCells, type Pt } from "./team.geometry.ts";

/** A small seeded generator, so that a test draws the same points every time. */
function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const scatter = (n: number, seed: number, scale = 100): Pt[] => {
  const next = random(seed);
  return Array.from({ length: n }, (): Pt => [next() * scale, next() * scale]);
};

const area = (t: ReturnType<typeof delaunay>): number => {
  let sum = 0;
  for (let k = 0; k < t.triangles.length; k += 3) {
    const [a, b, c] = [t.points[t.triangles[k]], t.points[t.triangles[k + 1]], t.points[t.triangles[k + 2]]];
    sum += ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
  }
  return sum;
};

/** The most any point is inside a triangle's circumcircle, as a share of the circle's squared radius: 0 when the triangulation is Delaunay. */
function worstCircle(t: ReturnType<typeof delaunay>): number {
  let worst = 0;
  for (let k = 0; k < t.triangles.length; k += 3) {
    const [a, b, c] = [t.points[t.triangles[k]], t.points[t.triangles[k + 1]], t.points[t.triangles[k + 2]]];
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    if (d === 0) continue;
    const cx = ((a[0] ** 2 + a[1] ** 2) * (b[1] - c[1]) + (b[0] ** 2 + b[1] ** 2) * (c[1] - a[1]) + (c[0] ** 2 + c[1] ** 2) * (a[1] - b[1])) / d;
    const cy = ((a[0] ** 2 + a[1] ** 2) * (c[0] - b[0]) + (b[0] ** 2 + b[1] ** 2) * (a[0] - c[0]) + (c[0] ** 2 + c[1] ** 2) * (b[0] - a[0])) / d;
    const r2 = (a[0] - cx) ** 2 + (a[1] - cy) ** 2;
    t.points.forEach((p, i) => {
      if (i === t.triangles[k] || i === t.triangles[k + 1] || i === t.triangles[k + 2]) return;
      worst = Math.max(worst, (r2 - ((p[0] - cx) ** 2 + (p[1] - cy) ** 2)) / r2);
    });
  }
  return worst;
};

describe("the convex hull", () => {
  it("is the corners, counter-clockwise, without a point on an edge or inside", () => {
    expect(convexHull([[0, 0], [4, 0], [2, 0], [4, 3], [1, 1], [0, 3]])).toEqual([[0, 0], [4, 0], [4, 3], [0, 3]]);
  });

  it("is empty for no points, the point for one, and the ends for two or for points on a line", () => {
    expect(convexHull([])).toEqual([]);
    expect(convexHull([[3, 4]])).toEqual([[3, 4]]);
    expect(convexHull([[3, 4], [3, 4]])).toEqual([[3, 4]]);
    expect(convexHull([[5, 5], [1, 1]])).toEqual([[1, 1], [5, 5]]);
    expect(convexHull([[0, 0], [1, 1], [2, 2], [3, 3], [1.5, 1.5]])).toEqual([[0, 0], [3, 3]]);
    expect(convexHull([[2, 0], [2, 5], [2, 1]])).toEqual([[2, 0], [2, 5]]);
  });

  it("does not change with the order the points come in, and counts a repeated point once", () => {
    const points = scatter(40, 7);
    const hull = convexHull(points);
    expect(convexHull([...points].reverse())).toEqual(hull);
    expect(convexHull([...points, ...points])).toEqual(hull);
  });

  it("holds every point, and its area is the area the triangulation covers", () => {
    for (const seed of [1, 2, 3]) {
      const points = scatter(60, seed);
      const hull = convexHull(points);
      for (const p of points) {
        let inside = true;
        for (let i = 0; i < hull.length; i += 1) {
          const a = hull[i];
          const b = hull[(i + 1) % hull.length];
          if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) < -1e-9) inside = false;
        }
        expect(inside).toBe(true);
      }
      expect(area(delaunay(points))).toBeCloseTo(polygonArea(hull), 6);
    }
  });

  it("ignores a point that is not a finite number", () => {
    expect(convexHull([[0, 0], [1, 0], [0, 1], [Number.NaN, 3], [Infinity, 1]])).toEqual([[0, 0], [1, 0], [0, 1]]);
  });
});

describe("polygon area and centroid", () => {
  it("are those of a rectangle and a triangle, and the mean of a line", () => {
    expect(polygonArea([[0, 0], [4, 0], [4, 3], [0, 3]])).toBe(12);
    expect(polygonCentroid([[0, 0], [4, 0], [4, 3], [0, 3]])).toEqual([2, 1.5]);
    expect(polygonArea([[0, 0], [6, 0], [0, 6]])).toBe(18);
    expect(polygonCentroid([[0, 0], [6, 0], [0, 6]])?.map((v) => Math.round(v * 1000) / 1000)).toEqual([2, 2]);
    expect(polygonArea([[0, 0], [1, 1]])).toBe(0);
    expect(polygonCentroid([[0, 0], [4, 2]])).toEqual([2, 1]);
    expect(polygonCentroid([])).toBeUndefined();
  });
});

describe("the Delaunay triangulation", () => {
  it("is empty for no points, one, two, three on a line, and many on a line", () => {
    expect(delaunay([]).triangles).toEqual([]);
    expect(delaunay([[1, 1]]).triangles).toEqual([]);
    expect(delaunay([[1, 1], [2, 2]]).triangles).toEqual([]);
    expect(delaunay([[0, 0], [1, 1], [2, 2]]).triangles).toEqual([]);
    expect(delaunay(Array.from({ length: 30 }, (_, i): Pt => [i * 3, i * 3 - 1])).triangles).toEqual([]);
    expect(delaunay(Array.from({ length: 30 }, (_, i): Pt => [7, i])).triangles).toEqual([]);
  });

  it("is one triangle for three points and the right one, counter-clockwise, whatever the order", () => {
    for (const points of [[[0, 0], [4, 0], [0, 3]], [[0, 3], [0, 0], [4, 0]], [[4, 0], [0, 3], [0, 0]]] as Pt[][]) {
      const t = delaunay(points);
      expect(t.triangles).toHaveLength(3);
      expect(area(t)).toBe(6);
    }
  });

  it("counts a repeated point once, and says where each input point went", () => {
    const t = delaunay([[0, 0], [5, 0], [0, 0], [0, 5], [5, 0]]);
    expect(t.points).toHaveLength(3);
    expect(t.of).toEqual([0, 1, 0, 2, 1]);
    expect(t.triangles).toHaveLength(3);
    const all = delaunay([[2, 2], [2, 2], [2, 2]]);
    expect(all.points).toHaveLength(1);
    expect(all.triangles).toEqual([]);
  });

  it("covers the hull exactly and keeps every circumcircle empty, on scattered points of many sizes", () => {
    for (const n of [4, 5, 8, 20, 60, 200]) {
      for (const seed of [11, 12, 13]) {
        const points = scatter(n, seed * n);
        const t = delaunay(points);
        expect(area(t), `n=${n} seed=${seed}`).toBeCloseTo(polygonArea(convexHull(points)), 6);
        expect(worstCircle(t), `n=${n} seed=${seed}`).toBeLessThan(1e-9);
        // Euler: a triangulation of n points with h on the hull has 2n - 2 - h triangles.
        expect(t.triangles.length / 3).toBe(2 * n - 2 - convexHull(points).length);
        // Every point is a corner of some triangle.
        const used = new Set(t.triangles);
        expect(used.size).toBe(n);
      }
    }
  });

  it("copes with a lattice, where four points lie on every circle", () => {
    const points: Pt[] = [];
    for (let i = 0; i < 9; i += 1) for (let j = 0; j < 7; j += 1) points.push([i * 5, j * 5]);
    const t = delaunay(points);
    expect(area(t)).toBeCloseTo(40 * 30, 6);
    expect(t.triangles.length / 3).toBe(2 * 63 - 2 - 28);
    expect(worstCircle(t)).toBeLessThan(1e-9);
  });

  it("copes with points all on one circle", () => {
    const points = Array.from({ length: 24 }, (_, i): Pt => [50 + 40 * Math.cos((i * 2 * Math.PI) / 24), 50 + 40 * Math.sin((i * 2 * Math.PI) / 24)]);
    const t = delaunay(points);
    expect(t.triangles.length / 3).toBe(22);
    expect(area(t)).toBeCloseTo(polygonArea(convexHull(points)), 6);
  });

  it("copes with points on a line and one off it, and with points almost on a line", () => {
    const line = Array.from({ length: 12 }, (_, i): Pt => [i * 10, 20]);
    const t = delaunay([...line, [55, 70]]);
    expect(t.triangles.length / 3).toBe(11);
    expect(area(t)).toBeCloseTo(110 * 50 / 2, 6);
    const nearly = Array.from({ length: 40 }, (_, i): Pt => [i * 2.5, 10 + (i % 2) * 1e-7]);
    const u = delaunay(nearly);
    expect(u.triangles.length).toBeGreaterThan(0);
    expect(area(u)).toBeLessThan(1e-3);
    expect(area(u)).toBeGreaterThanOrEqual(0);
  });

  it("copes with points far from the origin, with tiny sizes and with huge ones", () => {
    for (const [offset, scale] of [[1e6, 1], [-3e5, 100], [0, 1e-6], [0, 1e9]]) {
      const points = scatter(50, 99, scale).map(([x, y]): Pt => [x + offset, y + offset]);
      const t = delaunay(points);
      expect(t.triangles.length / 3).toBe(2 * 50 - 2 - convexHull(points).length);
      const hull = convexHull(points);
      const from = hull[0];
      expect(area(t) / polygonArea(hull.map((p): Pt => [p[0] - from[0], p[1] - from[1]]))).toBeCloseTo(1, 4);
    }
  });

  it("does not depend on the order the points come in", () => {
    const points = scatter(80, 5);
    const edges = (list: readonly Pt[]): string => {
      const t = delaunay(list);
      return triangulationEdges(t).map(([a, b]) => [`${t.points[a]}`, `${t.points[b]}`].sort().join("|")).sort().join(";");
    };
    expect(edges([...points].reverse())).toBe(edges(points));
  });

  it("gives every point of a triangulation its neighbours, and its edges once", () => {
    const t = delaunay([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5]]);
    expect(neighbours(t)).toEqual([[1, 3, 4], [0, 2, 4], [1, 3, 4], [0, 2, 4], [0, 1, 2, 3]]);
    expect(triangulationEdges(t)).toHaveLength(8);
  });

  it("is quick: a thousand points in under 400 ms", () => {
    const points = scatter(1000, 3);
    const t0 = performance.now();
    const t = delaunay(points);
    const took = performance.now() - t0;
    expect(t.triangles.length).toBeGreaterThan(0);
    expect(took, `${Math.round(took)} ms`).toBeLessThan(400);
  });
});

describe("the Voronoi cells", () => {
  const box = { x: 0, y: 0, w: 120, h: 80 };

  it("tile the box: their areas add up to its area", () => {
    for (const n of [2, 3, 4, 11, 22, 90]) {
      const cells = voronoiCells(scatter(n, n, 70).map(([x, y]): Pt => [x + 10, y]), box);
      const total = cells.reduce((sum, cell) => sum + polygonArea(cell), 0);
      expect(total, `n=${n}`).toBeCloseTo(120 * 80, 6);
    }
  });

  it("are what the cuts by every other point would make", () => {
    const points = scatter(30, 21, 70).map(([x, y]): Pt => [x + 10, y]);
    const cells = voronoiCells(points, box);
    points.forEach((p, i) => {
      let cell: Pt[] = [[0, 0], [120, 0], [120, 80], [0, 80]];
      points.forEach((q, j) => {
        if (j !== i) cell = clipNearer(cell, p, q);
      });
      expect(polygonArea(cells[i]), `cell ${i}`).toBeCloseTo(polygonArea(cell), 6);
    });
  });

  it("holds each point, and every point of a cell is nearer its own point than any other", () => {
    const points = scatter(16, 8, 70).map(([x, y]): Pt => [x + 10, y]);
    const cells = voronoiCells(points, box);
    points.forEach((p, i) => {
      expect(polygonArea(cells[i])).toBeGreaterThan(0);
      for (const corner of cells[i]) {
        const own = Math.hypot(corner[0] - p[0], corner[1] - p[1]);
        for (const q of points) expect(own).toBeLessThanOrEqual(Math.hypot(corner[0] - q[0], corner[1] - q[1]) + 1e-9);
      }
    });
  });

  it("is the whole box for one point, nothing for none, and halves for two", () => {
    expect(voronoiCells([], box)).toEqual([]);
    expect(polygonArea(voronoiCells([[30, 30]], box)[0])).toBe(120 * 80);
    const two = voronoiCells([[30, 30], [90, 30]], box);
    expect(polygonArea(two[0])).toBeCloseTo(60 * 80, 9);
    expect(polygonArea(two[1])).toBeCloseTo(60 * 80, 9);
  });

  it("is a strip each for points on a line", () => {
    const cells = voronoiCells([[20, 40], [60, 40], [100, 40], [40, 40]], box);
    expect(cells.reduce((sum, c) => sum + polygonArea(c), 0)).toBeCloseTo(9600, 6);
    expect(polygonArea(cells[0])).toBeCloseTo(30 * 80, 6);
    expect(polygonArea(cells[3])).toBeCloseTo(20 * 80, 6);
  });

  it("gives the second of two points at one place an empty cell, and the first the whole of theirs", () => {
    const cells = voronoiCells([[30, 30], [90, 30], [30, 30]], box);
    expect(cells[2]).toEqual([]);
    expect(polygonArea(cells[0])).toBeCloseTo(60 * 80, 9);
  });

  it("leaves a point outside the box with no cell and the rest still tile the box", () => {
    const cells = voronoiCells([[30, 30], [200, 200], [90, 30]], box);
    expect(cells.reduce((sum, c) => sum + polygonArea(c), 0)).toBeCloseTo(9600, 6);
  });

  it("is quick: 200 points in under 200 ms", () => {
    const points = scatter(200, 17, 100);
    const t0 = performance.now();
    voronoiCells(points, { x: 0, y: 0, w: 100, h: 100 });
    const took = performance.now() - t0;
    expect(took, `${Math.round(took)} ms`).toBeLessThan(200);
  });
});
