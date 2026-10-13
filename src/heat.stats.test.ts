import { describe, expect, it } from "vitest";
import { seeded } from "../demo/layers-data.js";
import {
  binGrid,
  binOf,
  contourRings,
  densityAt,
  densityGrid,
  gridValues,
  hexAt,
  hexBins,
  hexCentre,
  hexCorners,
  massThresholds,
  median,
  newBin,
  niceTicks,
  reduceBin,
  scottBandwidth,
  uniformEdges,
  type Sample,
} from "./heat.stats.ts";

const normals = (seed: number) => {
  const random = seeded(seed);
  return () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
};

describe("binned statistics on a grid", () => {
  const edges = uniformEdges(0, 10, 5);
  it("makes equal edges that end exactly on the last", () => {
    expect(edges).toEqual([0, 2, 4, 6, 8, 10]);
    expect(uniformEdges(0, 1, 3)[3]).toBe(1);
  });

  it("finds a point's bin, with the last edge inside the last bin and anything beyond outside", () => {
    expect(binOf(edges, 0)).toBe(0);
    expect(binOf(edges, 1.99)).toBe(0);
    expect(binOf(edges, 2)).toBe(1);
    expect(binOf(edges, 10)).toBe(4);
    expect(binOf(edges, 10.01)).toBe(-1);
    expect(binOf(edges, -0.01)).toBe(-1);
    expect(binOf([0, 1, 5, 6], 3)).toBe(1);
  });

  const samples: Sample[] = [
    { x: 1, y: 1, value: 2, hit: true },
    { x: 1.5, y: 1.5, value: 4, hit: false },
    { x: 1.9, y: 0.1, value: 9, hit: true },
    { x: 5, y: 5, value: 10, hit: true },
    { x: 11, y: 5, value: 1 },
    { x: 5, y: 5, value: null },
  ];

  it("counts what falls in and what falls outside, and every bin adds up", () => {
    const grid = binGrid(samples, edges, edges);
    expect(grid.total).toBe(5);
    expect(grid.outside).toBe(1);
    expect(grid.bins.reduce((a, b) => a + b.n, 0)).toBe(5);
    expect(grid.bins[0].n).toBe(3);
    expect(grid.bins[2 * 5 + 2].n).toBe(2);
  });

  it("reduces a bin by every statistic", () => {
    const grid = binGrid(samples, edges, edges, true);
    const first = grid.bins[0];
    expect(reduceBin("count", first, grid.total)).toBe(3);
    expect(reduceBin("sum", first, grid.total)).toBe(15);
    expect(reduceBin("mean", first, grid.total)).toBe(5);
    expect(reduceBin("median", first, grid.total)).toBe(4);
    expect(reduceBin("max", first, grid.total)).toBe(9);
    expect(reduceBin("min", first, grid.total)).toBe(2);
    expect(reduceBin("percent", first, grid.total)).toBe(60);
    expect(reduceBin("rate", first, grid.total)).toBeCloseTo(66.667, 2);
    expect(reduceBin((values, info) => values.length + info.hits + info.total, first, grid.total)).toBe(3 + 2 + 5);
    const mixed = grid.bins[2 * 5 + 2];
    // A bin whose samples carry one value among two: the mean is of the values there are.
    expect(reduceBin("mean", mixed, grid.total)).toBe(10);
    expect(reduceBin("count", mixed, grid.total)).toBe(2);
  });

  it("gives null for an empty bin, and for a statistic of values when none was given", () => {
    const empty = newBin(true);
    for (const statistic of ["count", "sum", "mean", "median", "percent", "max", "min", "rate"] as const) expect(reduceBin(statistic, empty, 5)).toBeNull();
    const noValues = binGrid([{ x: 1, y: 1 }], edges, edges, true).bins[0];
    expect(reduceBin("count", noValues, 1)).toBe(1);
    expect(reduceBin("sum", noValues, 1)).toBeNull();
    expect(reduceBin(() => Number.NaN, noValues, 1)).toBeNull();
  });

  it("refuses an unknown statistic and an empty grid", () => {
    expect(() => reduceBin("mode" as never, { ...newBin(false), n: 1 }, 1)).toThrow(/Unknown statistic "mode"/);
    expect(() => binGrid([], [0], [0, 1])).toThrow(/at least one bin/);
  });

  it("takes the median of an even and an odd list", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("keeps the order of the edges it is given (uneven bins)", () => {
    const grid = binGrid([{ x: 0.5, y: 0.5 }, { x: 7, y: 0.5 }], [0, 1, 10], [0, 1]);
    expect(grid.bins.map((b) => b.n)).toEqual([1, 1]);
  });
});

describe("hexagonal bins", () => {
  const size = 5;
  for (const orientation of ["pointy", "flat"] as const) {
    it(`${orientation}: a point is in the hexagon whose centre is nearest it, and within one circumradius of that centre`, () => {
      const random = seeded(3);
      for (let i = 0; i < 400; i += 1) {
        const x = random() * 100;
        const y = random() * 60;
        const [q, r] = hexAt(x, y, size, orientation, 2, 1);
        const [cx, cy] = hexCentre(q, r, size, orientation, 2, 1);
        expect(Math.hypot(x - cx, y - cy)).toBeLessThanOrEqual(size + 1e-9);
        // No neighbour's centre is nearer.
        for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
          const [nx, ny] = hexCentre(q + dq, r + dr, size, orientation, 2, 1);
          expect(Math.hypot(x - nx, y - ny)).toBeGreaterThanOrEqual(Math.hypot(x - cx, y - cy) - 1e-9);
        }
      }
    });
    it(`${orientation}: the corners are a circumradius from the centre and six apart`, () => {
      const corners = hexCorners(size, orientation);
      expect(corners).toHaveLength(6);
      for (const [x, y] of corners) expect(Math.hypot(x, y)).toBeCloseTo(size, 9);
      expect(Math.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1])).toBeCloseTo(size, 9);
    });
  }

  it("counts every sample once and orders the hexagons top to bottom", () => {
    const normal = normals(5);
    const samples: Sample[] = Array.from({ length: 500 }, () => ({ x: 50 + normal() * 12, y: 30 + normal() * 8, value: 1 }));
    const { cells, total } = hexBins(samples, size, "pointy", [0, 0]);
    expect(total).toBe(500);
    expect(cells.reduce((a, c) => a + c.bin.n, 0)).toBe(500);
    for (let i = 1; i < cells.length; i += 1) expect(cells[i].cy).toBeGreaterThanOrEqual(cells[i - 1].cy);
    expect(() => hexBins(samples, 0, "flat", [0, 0])).toThrow(/size above zero/);
  });

  it("does not make a negative zero", () => {
    expect(Object.is(hexAt(0, 0, 4, "pointy")[0], -0)).toBe(false);
  });
});

describe("the kernel density estimate", () => {
  const normal = normals(9);
  const cloud: Sample[] = Array.from({ length: 800 }, () => ({ x: 60 + normal() * 10, y: 40 + normal() * 6 }));
  const box = { x: [0, 120] as const, y: [0, 80] as const };

  it("follows Scott's rule: the spread of each axis times n to the minus a sixth", () => {
    const xs = cloud.map((s) => s.x);
    const ys = cloud.map((s) => s.y);
    const [hx, hy] = scottBandwidth(xs, ys);
    expect(hx).toBeCloseTo(10 * 800 ** (-1 / 6), 0);
    expect(hy / hx).toBeCloseTo(0.6, 1);
    // Four points, spread 1 each way (x: 0 1 0 1 has a standard deviation of 0.5).
    const [a] = scottBandwidth([0, 1, 0, 1], [0, 0, 1, 1]);
    expect(a).toBeCloseTo(0.5 * 4 ** (-1 / 6), 12);
    expect(scottBandwidth([3], [3])).toEqual([0, 0]);
    expect(scottBandwidth([], [])).toEqual([0, 0]);
  });

  it("with weights, counts the effective number of samples", () => {
    const [equal] = scottBandwidth([0, 1, 2, 3], [0, 1, 2, 3], [1, 1, 1, 1]);
    const [plain] = scottBandwidth([0, 1, 2, 3], [0, 1, 2, 3]);
    expect(equal).toBeCloseTo(plain, 12);
    const [lopsided] = scottBandwidth([0, 1, 2, 3], [0, 1, 2, 3], [100, 1, 1, 1]);
    expect(lopsided).not.toBeCloseTo(plain, 3);
  });

  it("integrates to about one, peaks near the middle of the data and is the same every time", () => {
    const h = scottBandwidth(cloud.map((s) => s.x), cloud.map((s) => s.y));
    const d = densityGrid(cloud, box, 121, 81, h);
    let mass = 0;
    for (const v of d.z) mass += v;
    expect(mass).toBeCloseTo(1, 1);
    const peak = d.z.indexOf(d.max);
    expect(Math.abs((peak % d.nx) - 60)).toBeLessThan(8);
    expect(Math.abs(Math.floor(peak / d.nx) - 40)).toBeLessThan(8);
    expect(Array.from(densityGrid(cloud, box, 121, 81, h).z.slice(0, 2000))).toEqual(Array.from(d.z.slice(0, 2000)));
    expect(densityAt(d, 60, 40)).toBeGreaterThan(densityAt(d, 20, 10));
    expect(densityAt(d, -5, 40)).toBe(0);
    expect(densityAt(d, 60, 40)).toBeCloseTo(d.z[40 * 121 + 60], 12);
  });

  it("a weight counts for that many samples, and a zero weight for none", () => {
    const pair: Sample[] = [{ x: 20, y: 40 }, { x: 100, y: 40 }];
    const d = densityGrid(pair, box, 121, 81, [6, 6], [3, 1]);
    expect(densityAt(d, 20, 40) / densityAt(d, 100, 40)).toBeCloseTo(3, 6);
    const z = densityGrid(pair, box, 121, 81, [6, 6], [0, 1]);
    expect(densityAt(z, 20, 40)).toBe(0);
  });

  it("finds the smallest region that holds a share of the mass", () => {
    const h = scottBandwidth(cloud.map((s) => s.x), cloud.map((s) => s.y));
    const d = densityGrid(cloud, box, 121, 81, h);
    const [half, most] = massThresholds(d, [0.5, 0.9]);
    expect(half).toBeGreaterThan(most);
    let inside = 0;
    let all = 0;
    for (const v of d.z) {
      all += v;
      if (v >= half) inside += v;
    }
    expect(inside / all).toBeGreaterThanOrEqual(0.5);
    expect(inside / all).toBeLessThan(0.56);
  });
});

describe("contours by marching squares", () => {
  const ringArea = (ring: readonly (readonly [number, number])[]): number => {
    let a = 0;
    ring.forEach(([x, y], i) => {
      const [x2, y2] = ring[(i + 1) % ring.length];
      a += x * y2 - x2 * y;
    });
    return a / 2;
  };
  const box = { x: [0, 100] as const, y: [0, 60] as const };

  it("a single bump has one ring round it, smaller at a higher level, and the ring lies inside the box", () => {
    const d = densityGrid([{ x: 50, y: 30 }], box, 101, 61, [8, 8]);
    const low = contourRings(d, d.max * 0.2);
    const high = contourRings(d, d.max * 0.8);
    expect(low).toHaveLength(1);
    expect(high).toHaveLength(1);
    expect(Math.abs(ringArea(low[0]))).toBeGreaterThan(Math.abs(ringArea(high[0])) * 2);
    for (const [x, y] of low[0]) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(100);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(60);
    }
    // At e^(-1/2) of the peak the ring is a circle of one bandwidth.
    const unit = contourRings(d, d.max * Math.exp(-0.5))[0];
    const mean = unit.reduce((a, [x, y]) => a + Math.hypot(x - 50, y - 30), 0) / unit.length;
    expect(mean).toBeCloseTo(8, 0);
  });

  it("two separate bumps have two rings; joined by a lower level they have one", () => {
    const d = densityGrid([{ x: 38, y: 30 }, { x: 62, y: 30 }], box, 101, 61, [7, 7]);
    expect(contourRings(d, d.max * 0.7)).toHaveLength(2);
    expect(contourRings(d, d.max * 0.3)).toHaveLength(1);
  });

  it("a ring round a hole runs the other way, so the even-odd fill leaves the hole empty", () => {
    const ring: { x: number; y: number }[] = [];
    for (let i = 0; i < 16; i += 1) ring.push({ x: 50 + 22 * Math.cos((i * Math.PI) / 8), y: 30 + 22 * Math.sin((i * Math.PI) / 8) });
    const d = densityGrid(ring, box, 101, 61, [5, 5]);
    const rings = contourRings(d, d.max * 0.6);
    expect(rings).toHaveLength(2);
    expect(Math.sign(ringArea(rings[0]))).not.toBe(Math.sign(ringArea(rings[1])));
  });

  it("closes a region that reaches the box's edge, and draws nothing above the peak", () => {
    const d = densityGrid([{ x: 0, y: 0 }], box, 101, 61, [10, 10]);
    const rings = contourRings(d, d.max * 0.3);
    expect(rings).toHaveLength(1);
    expect(contourRings(d, d.max * 2)).toEqual([]);
  });

  it("is the same every time", () => {
    const d = densityGrid([{ x: 30, y: 20 }, { x: 60, y: 40 }], box, 80, 50, [6, 6]);
    expect(JSON.stringify(contourRings(d, d.max * 0.4))).toBe(JSON.stringify(contourRings(d, d.max * 0.4)));
  });
});

describe("nice ticks", () => {
  it("rounds to 1, 2, 2.5 or 5 times a power of ten and stays inside the range", () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(0, 10, 5)).toEqual([0, 2.5, 5, 7.5, 10]);
    expect(niceTicks(1, 22, 5)).toEqual([5, 10, 15, 20]);
    expect(niceTicks(0.1, 0.9, 5)).toEqual([0.2, 0.4, 0.6, 0.8]);
    expect(niceTicks(3, 3)).toEqual([3]);
  });
});

describe("the values of a grid", () => {
  it("lists every bin's value by the statistic", () => {
    const grid = binGrid([{ x: 0.5, y: 0.5 }, { x: 1.5, y: 0.5 }, { x: 1.6, y: 0.5 }], [0, 1, 2], [0, 1]);
    expect(gridValues(grid, "count")).toEqual([1, 2]);
    expect(gridValues(grid, "percent").map((v) => Math.round(v as number))).toEqual([33, 67]);
  });
});
