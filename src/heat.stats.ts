// The numbers behind the heat maps: binned statistics on a rectangular grid and on hexagons, a Gaussian kernel density estimate and
// its contours (marching squares). Pure functions of numbers; nothing here knows a sport or a drawing. Written for this package from
// the textbook definitions (a histogram, an axial hexagon grid, Scott's rule, marching squares); the plotting packages hockey_rink,
// mplsoccer and seaborn were read for the list of what a heat map offers, and no code of any of them is used.

/** A point to count: where it is, a number it carries (optional) and whether it counts as a success (a goal, a made shot). */
export interface Sample {
  x: number;
  y: number;
  value?: number | null;
  hit?: boolean;
  /** Which input it was, for a caller who wants its tooltip. */
  index?: number;
}

/** The statistics of a bin. `percent` is each bin's share of all the samples (0 to 100); `rate` is the share of a bin's samples that are hits (0 to 100). */
export type StatisticName = "count" | "sum" | "mean" | "median" | "percent" | "max" | "min" | "rate";

/** What a bin holds, and what a custom reducer is told. */
export interface BinInfo {
  /** How many samples fell in the bin. */
  count: number;
  /** How many of them were hits. */
  hits: number;
  /** How many samples were binned in all. */
  total: number;
}

/** A custom statistic: the finite values of a bin's samples (an empty list when none had one), and the bin's counts. Return `null` for a bin that has no value. */
export type Reducer = (values: readonly number[], info: BinInfo) => number | null;

/** One bin's accumulator. */
export interface Bin {
  n: number;
  hits: number;
  sum: number;
  nv: number;
  low: number;
  high: number;
  values: number[] | undefined;
}

export const newBin = (keep: boolean): Bin => ({ n: 0, hits: 0, sum: 0, nv: 0, low: Infinity, high: -Infinity, values: keep ? [] : undefined });

function add(bin: Bin, s: Sample): void {
  bin.n += 1;
  if (s.hit === true) bin.hits += 1;
  if (typeof s.value === "number" && Number.isFinite(s.value)) {
    bin.nv += 1;
    bin.sum += s.value;
    if (s.value < bin.low) bin.low = s.value;
    if (s.value > bin.high) bin.high = s.value;
    bin.values?.push(s.value);
  }
}

/** True for a statistic that needs the list of values (the median and a custom reducer). */
export const needsValues = (statistic: StatisticName | Reducer): boolean => typeof statistic === "function" || statistic === "median";

/** The median of a list that is not empty. */
export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The value of a bin under a statistic, or `null` when it has none (an empty bin; a mean of samples that carry no value). */
export function reduceBin(statistic: StatisticName | Reducer, bin: Bin, total: number): number | null {
  if (typeof statistic === "function") {
    const out = statistic(bin.values ?? [], { count: bin.n, hits: bin.hits, total });
    return typeof out === "number" && Number.isFinite(out) ? out : null;
  }
  if (bin.n === 0) return null;
  switch (statistic) {
    case "count":
      return bin.n;
    case "percent":
      return total === 0 ? null : (100 * bin.n) / total;
    case "rate":
      return (100 * bin.hits) / bin.n;
    case "sum":
      return bin.nv === 0 ? null : bin.sum;
    case "mean":
      return bin.nv === 0 ? null : bin.sum / bin.nv;
    case "max":
      return bin.nv === 0 ? null : bin.high;
    case "min":
      return bin.nv === 0 ? null : bin.low;
    case "median":
      return bin.values === undefined || bin.values.length === 0 ? null : median(bin.values);
    default:
      throw new RangeError(`Unknown statistic "${String(statistic)}": use count, sum, mean, median, percent, max, min, rate or a function`);
  }
}

/** `n` equal steps from `a` to `b`, as the `n + 1` edges that bound them. */
export function uniformEdges(a: number, b: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i += 1) out.push(i === n ? b : a + ((b - a) * i) / n);
  return out;
}

/** The index of the bin an edge list puts `v` in (the last bin includes its upper edge), or -1 when `v` is outside. */
export function binOf(edges: readonly number[], v: number): number {
  const last = edges.length - 1;
  if (!(v >= edges[0] && v <= edges[last])) return -1;
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (v >= edges[mid]) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** A grid of bins. */
export interface Grid {
  xEdges: number[];
  yEdges: number[];
  /** Row by row from the top: `bins[row * nx + column]`. */
  bins: Bin[];
  nx: number;
  ny: number;
  /** Samples that fell inside the grid, and the number that fell outside it. */
  total: number;
  outside: number;
}

/** Count samples into the rectangles between two lists of edges (`binned_statistic_2d`'s job). A sample outside the edges is counted as `outside`. */
export function binGrid(samples: readonly Sample[], xEdges: readonly number[], yEdges: readonly number[], keepValues = false): Grid {
  const nx = xEdges.length - 1;
  const ny = yEdges.length - 1;
  if (nx < 1 || ny < 1) throw new RangeError("a grid needs at least one bin each way");
  const bins: Bin[] = Array.from({ length: nx * ny }, () => newBin(keepValues));
  let total = 0;
  let outside = 0;
  for (const s of samples) {
    const i = binOf(xEdges, s.x);
    const j = binOf(yEdges, s.y);
    if (i < 0 || j < 0) outside += 1;
    else {
      add(bins[j * nx + i], s);
      total += 1;
    }
  }
  return { xEdges: [...xEdges], yEdges: [...yEdges], bins, nx, ny, total, outside };
}

/** The value of every bin of a grid under a statistic. */
export const gridValues = (grid: Grid, statistic: StatisticName | Reducer): (number | null)[] => grid.bins.map((bin) => reduceBin(statistic, bin, grid.total));

/** How a hexagon sits: a corner up (`pointy`) or an edge up (`flat`). */
export type HexOrientation = "pointy" | "flat";

const SQRT3 = Math.sqrt(3);

/** The hexagon (axial `q`, `r`) that holds `(x, y)` on a grid of hexagons of circumradius `size` whose (0, 0) hexagon is centred at `(ox, oy)`. */
export function hexAt(x: number, y: number, size: number, orientation: HexOrientation, ox = 0, oy = 0): [number, number] {
  const px = (x - ox) / size;
  const py = (y - oy) / size;
  const fq = orientation === "pointy" ? ((SQRT3 / 3) * px - (1 / 3) * py) : ((2 / 3) * px);
  const fr = orientation === "pointy" ? ((2 / 3) * py) : (((-1 / 3) * px) + ((SQRT3 / 3) * py));
  // Cube rounding: round all three, then fix the one that was furthest off.
  const fs = -fq - fr;
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return [q + 0, r + 0];
}

/** The centre of hexagon (`q`, `r`). */
export function hexCentre(q: number, r: number, size: number, orientation: HexOrientation, ox = 0, oy = 0): [number, number] {
  return orientation === "pointy" ? [ox + size * SQRT3 * (q + r / 2), oy + size * 1.5 * r] : [ox + size * 1.5 * q, oy + size * SQRT3 * (r + q / 2)];
}

/** The six corners of a hexagon of circumradius `size`, as offsets from its centre, clockwise from the right (flat) or the lower right (pointy), with y down. */
export function hexCorners(size: number, orientation: HexOrientation): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k < 6; k += 1) {
    const a = (Math.PI / 3) * k + (orientation === "pointy" ? Math.PI / 6 : 0);
    out.push([size * Math.cos(a), size * Math.sin(a)]);
  }
  return out;
}

/** A hexagon with the bin it holds. */
export interface HexBin {
  q: number;
  r: number;
  cx: number;
  cy: number;
  bin: Bin;
}

/** Count samples into hexagons. The hexagons that hold at least one sample are returned, in the order of their rows (top to bottom, left to right). */
export function hexBins(samples: readonly Sample[], size: number, orientation: HexOrientation, origin: readonly [number, number], keepValues = false): { cells: HexBin[]; total: number } {
  if (!(size > 0)) throw new RangeError("a hexagon needs a size above zero");
  const found = new Map<string, HexBin>();
  for (const s of samples) {
    const [q, r] = hexAt(s.x, s.y, size, orientation, origin[0], origin[1]);
    const key = `${q},${r}`;
    let cell = found.get(key);
    if (cell === undefined) {
      const [cx, cy] = hexCentre(q, r, size, orientation, origin[0], origin[1]);
      cell = { q, r, cx, cy, bin: newBin(keepValues) };
      found.set(key, cell);
    }
    add(cell.bin, s);
  }
  const cells = [...found.values()].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  return { cells, total: samples.length };
}

/** The standard deviation of a list, with weights when there are any (0 for fewer than two). */
function spread(values: readonly number[], weights: readonly number[] | undefined): number {
  let w = 0;
  let mean = 0;
  values.forEach((v, i) => {
    const wi = weights === undefined ? 1 : weights[i];
    w += wi;
    mean += wi * v;
  });
  if (values.length < 2 || w <= 0) return 0;
  mean /= w;
  let ss = 0;
  values.forEach((v, i) => {
    ss += (weights === undefined ? 1 : weights[i]) * (v - mean) ** 2;
  });
  return Math.sqrt(ss / w);
}

/**
 * Scott's rule for a density in two dimensions: each axis's bandwidth is its standard deviation times `n^(-1/6)`, with `n` the number of
 * samples (the effective number, when they have weights). In the same units as the samples. Silverman's rule is the same number in two dimensions.
 */
export function scottBandwidth(xs: readonly number[], ys: readonly number[], weights?: readonly number[]): [number, number] {
  let n = xs.length;
  if (weights !== undefined && n > 0) {
    const w1 = weights.reduce((a, b) => a + b, 0);
    const w2 = weights.reduce((a, b) => a + b * b, 0);
    n = w2 > 0 ? (w1 * w1) / w2 : n;
  }
  const f = n > 0 ? n ** (-1 / 6) : 1;
  return [spread(xs, weights) * f, spread(ys, weights) * f];
}

/** A density on a grid of nodes, `nx` by `ny`, spaced evenly from the first to the last of `x` and of `y`. */
export interface Density {
  nx: number;
  ny: number;
  x: readonly [number, number];
  y: readonly [number, number];
  /** Row by row from the top: `z[j * nx + i]` at node `i`, `j`. The density integrates to 1 over the plane (per square of the samples' unit). */
  z: Float64Array;
  /** The bandwidths used, in the samples' unit. */
  bandwidth: [number, number];
  max: number;
}

/**
 * A Gaussian kernel density estimate of weighted samples on a grid of nodes. A sample adds a bell of the given bandwidth to every node
 * within four bandwidths of it (the bell's tail beyond is under a thousandth of its height), so the cost is the number of samples times a window
 * of nodes and not the whole grid. The density is not folded back at the edges: what lies beyond the box is lost.
 */
export function densityGrid(samples: readonly Sample[], box: { x: readonly [number, number]; y: readonly [number, number] }, nx: number, ny: number, bandwidth: readonly [number, number], weights?: readonly number[]): Density {
  const [x0, x1] = box.x;
  const [y0, y1] = box.y;
  const dx = (x1 - x0) / (nx - 1);
  const dy = (y1 - y0) / (ny - 1);
  const z = new Float64Array(nx * ny);
  const [hx, hy] = bandwidth;
  const reachX = Math.ceil((4 * hx) / dx);
  const reachY = Math.ceil((4 * hy) / dy);
  // The bell along each axis for a sample is a product, so the sample's window is an outer product of two short lists.
  const wx = new Float64Array(2 * reachX + 1);
  const wy = new Float64Array(2 * reachY + 1);
  let mass = 0;
  samples.forEach((s, k) => {
    const weight = weights === undefined ? 1 : weights[k];
    if (!(weight > 0)) return;
    mass += weight;
    const ci = (s.x - x0) / dx;
    const cj = (s.y - y0) / dy;
    const i0 = Math.max(0, Math.ceil(ci - reachX));
    const i1 = Math.min(nx - 1, Math.floor(ci + reachX));
    const j0 = Math.max(0, Math.ceil(cj - reachY));
    const j1 = Math.min(ny - 1, Math.floor(cj + reachY));
    if (i0 > i1 || j0 > j1) return;
    for (let i = i0; i <= i1; i += 1) wx[i - i0] = Math.exp(-0.5 * (((x0 + i * dx - s.x) / hx) ** 2));
    for (let j = j0; j <= j1; j += 1) wy[j - j0] = weight * Math.exp(-0.5 * (((y0 + j * dy - s.y) / hy) ** 2));
    for (let j = j0; j <= j1; j += 1) {
      const row = j * nx;
      const wj = wy[j - j0];
      for (let i = i0; i <= i1; i += 1) z[row + i] += wx[i - i0] * wj;
    }
  });
  const norm = mass > 0 ? 1 / (2 * Math.PI * hx * hy * mass) : 0;
  let max = 0;
  for (let q = 0; q < z.length; q += 1) {
    z[q] *= norm;
    if (z[q] > max) max = z[q];
  }
  return { nx, ny, x: [x0, x1], y: [y0, y1], z, bandwidth: [hx, hy], max };
}

/** The density's value at `(x, y)`, by bilinear interpolation between the four nodes round it (0 outside the grid). */
export function densityAt(d: Density, x: number, y: number): number {
  const fi = ((x - d.x[0]) / (d.x[1] - d.x[0])) * (d.nx - 1);
  const fj = ((y - d.y[0]) / (d.y[1] - d.y[0])) * (d.ny - 1);
  if (fi < 0 || fj < 0 || fi > d.nx - 1 || fj > d.ny - 1) return 0;
  const i = Math.min(d.nx - 2, Math.floor(fi));
  const j = Math.min(d.ny - 2, Math.floor(fj));
  const a = fi - i;
  const b = fj - j;
  const at = (ii: number, jj: number): number => d.z[jj * d.nx + ii];
  return at(i, j) * (1 - a) * (1 - b) + at(i + 1, j) * a * (1 - b) + at(i, j + 1) * (1 - a) * b + at(i + 1, j + 1) * a * b;
}

/**
 * The densities that bound the smallest regions holding the given shares of the mass (the highest-density regions), for a density on a
 * grid: `masses` of 0.5 gives the density above which half of the mass lies.
 */
export function massThresholds(d: Density, masses: readonly number[]): number[] {
  const cell = ((d.x[1] - d.x[0]) / (d.nx - 1)) * ((d.y[1] - d.y[0]) / (d.ny - 1));
  const sorted = Float64Array.from(d.z).sort().reverse();
  let total = 0;
  for (const v of sorted) total += v * cell;
  return masses.map((share) => {
    if (total <= 0) return 0;
    let run = 0;
    for (const v of sorted) {
      run += v * cell;
      if (run >= share * total) return v;
    }
    return sorted[sorted.length - 1];
  });
}

/** A point on a contour. */
export type Pt = readonly [number, number];

/**
 * The closed rings that bound the part of a density at or above `level`, by marching squares. The grid is padded with a border of
 * nodes below every level, so every ring closes (a region that reaches the box's edge is closed just beyond it). The rings are in the
 * density's own coordinates; a ring that bounds a hole runs the other way, so that an even-odd fill leaves the hole empty.
 */
export function contourRings(d: Density, level: number): Pt[][] {
  const { nx, ny } = d;
  const dx = (d.x[1] - d.x[0]) / (nx - 1);
  const dy = (d.y[1] - d.y[0]) / (ny - 1);
  // The padded grid is (nx + 2) by (ny + 2); its node (i, j) is the density's node (i - 1, j - 1) and the border is -infinity.
  const W = nx + 2;
  const H = ny + 2;
  const f = (i: number, j: number): number => (i <= 0 || j <= 0 || i >= W - 1 || j >= H - 1 ? -Infinity : d.z[(j - 1) * nx + (i - 1)]);
  const px = (i: number): number => d.x[0] + (i - 1) * dx;
  const py = (j: number): number => d.y[0] + (j - 1) * dy;
  // A crossing sits on an edge: key it by the edge so that two cells that share it agree exactly. Horizontal edge (i, j)-(i+1, j) is `h`, vertical (i, j)-(i, j+1) is `v`.
  const crossing = (kind: "h" | "v", i: number, j: number): { key: string; p: Pt } => {
    if (kind === "h") {
      const a = f(i, j);
      const b = f(i + 1, j);
      const t = a === -Infinity ? 1 : b === -Infinity ? 0 : (level - a) / (b - a);
      return { key: `h${i},${j}`, p: [px(i) + t * dx, py(j)] };
    }
    const a = f(i, j);
    const b = f(i, j + 1);
    const t = a === -Infinity ? 1 : b === -Infinity ? 0 : (level - a) / (b - a);
    return { key: `v${i},${j}`, p: [px(i), py(j) + t * dy] };
  };
  const next = new Map<string, string>();
  const where = new Map<string, Pt>();
  const link = (from: { key: string; p: Pt }, to: { key: string; p: Pt }): void => {
    where.set(from.key, from.p);
    where.set(to.key, to.p);
    next.set(from.key, to.key);
  };
  for (let j = 0; j < H - 1; j += 1) {
    for (let i = 0; i < W - 1; i += 1) {
      const tl = f(i, j) >= level;
      const tr = f(i + 1, j) >= level;
      const br = f(i + 1, j + 1) >= level;
      const bl = f(i, j + 1) >= level;
      const code = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const top = (): { key: string; p: Pt } => crossing("h", i, j);
      const bottom = (): { key: string; p: Pt } => crossing("h", i, j + 1);
      const left = (): { key: string; p: Pt } => crossing("v", i, j);
      const right = (): { key: string; p: Pt } => crossing("v", i + 1, j);
      // Segments are directed so that the inside (at or above the level) is on the right of the way they go (y down): a ring round a peak runs clockwise on screen.
      const centreHigh = (f(i, j) + f(i + 1, j) + f(i + 1, j + 1) + f(i, j + 1)) / 4 >= level;
      switch (code) {
        case 1: link(bottom(), left()); break;
        case 2: link(right(), bottom()); break;
        case 3: link(right(), left()); break;
        case 4: link(top(), right()); break;
        case 5:
          if (centreHigh) {
            link(top(), left());
            link(bottom(), right());
          } else {
            link(top(), right());
            link(bottom(), left());
          }
          break;
        case 6: link(top(), bottom()); break;
        case 7: link(top(), left()); break;
        case 8: link(left(), top()); break;
        case 9: link(bottom(), top()); break;
        case 10:
          if (centreHigh) {
            link(left(), bottom());
            link(right(), top());
          } else {
            link(left(), top());
            link(right(), bottom());
          }
          break;
        case 11: link(right(), top()); break;
        case 12: link(left(), right()); break;
        case 13: link(bottom(), right()); break;
        case 14: link(left(), bottom()); break;
        default: break;
      }
    }
  }
  const rings: Pt[][] = [];
  const seen = new Set<string>();
  for (const start of [...next.keys()].sort()) {
    if (seen.has(start)) continue;
    const ring: Pt[] = [];
    let key: string | undefined = start;
    while (key !== undefined && !seen.has(key)) {
      seen.add(key);
      ring.push(where.get(key) as Pt);
      key = next.get(key);
    }
    if (ring.length >= 3) rings.push(ring);
  }
  return rings;
}

/** "Nice" tick values: about `count` of them, at 1, 2, 2.5 or 5 times a power of ten, covering `[low, high]` within it. */
export function niceTicks(low: number, high: number, count = 5): number[] {
  if (!(high > low)) return [low];
  const raw = (high - low) / Math.max(1, count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw * 0.85) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(low / step - 1e-9) * step; v <= high + step * 1e-9; v += step) out.push(Number((Math.round(v / step) * step).toPrecision(12)) + 0);
  return out;
}
