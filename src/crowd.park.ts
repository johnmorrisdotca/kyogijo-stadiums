// A ballpark's stands: the grandstands along the foul lines and round behind home plate, and the bleachers behind the outfield fence, laid from the park's own wall outline
// (`fenceOutline`, the points of the fence the drawing has), so that the seats sit behind the real walls, close behind them, and on top of a wall where the park has seats
// there (Fenway Park's Green Monster). The distances are conventions for a drawing: a ballpark's stands are as unlike one another as its fences, and no figure is the park's own.
import type { Crowd, CrowdStands, Pt, StandGap, StandRing, StandSector } from "./crowd.ts";
import { seatsIn } from "./crowd.ts";
import type { CrowdShape } from "./types.ts";

/** A stretch of wall with seats on top of it: its bearings from dead centre (the left field line is -45) and its height in feet. */
export interface WallSeats {
  from: number;
  to: number;
  height: number;
}

/** What a ballpark's stands are laid from. */
export interface ParkInput {
  /** The fence as points on the field: u across (negative to the left), v out from the back of home plate. */
  fence: readonly Pt[];
  /** How far behind home plate the backstop stands, in feet. */
  backstop: number;
  crowd: Crowd;
  /** The walls that have seats on top of them. */
  seatsOnWalls?: readonly WallSeats[];
  /** How deep each band of stands is, in feet: the conventions of a drawing (60, 56 and 54) unless a real ballpark's seats set them (`planPark`). */
  depths?: { lower: number; upper: number; bleachers: number };
}

const dist = ([x, y]: Pt): number => Math.hypot(x, y);

type Normals = { n: Pt; k: number }[];

/** The unit normals of a polyline pointing away from home, averaged at each vertex, with the length the offset grows by at a corner (limited to 1.6). */
function normals(points: readonly Pt[]): Normals {
  const segments = points.slice(1).map(([x, y], i): Pt => {
    const [px, py] = points[i];
    const dx = x - px;
    const dy = y - py;
    const len = Math.hypot(dx, dy) || 1;
    let nx = dy / len;
    let ny = -dx / len;
    if (nx * (x + px) + ny * (y + py) < 0) {
      nx = -nx;
      ny = -ny;
    }
    return [nx, ny];
  });
  return points.map((_, i) => {
    const a = segments[Math.max(0, i - 1)];
    const b = segments[Math.min(segments.length - 1, i)];
    const sx = a[0] + b[0];
    const sy = a[1] + b[1];
    const len = Math.hypot(sx, sy) || 1;
    const n: Pt = [sx / len, sy / len];
    return { n, k: 1 / Math.max(0.62, a[0] * n[0] + a[1] * n[1]) };
  });
}

/** The polygon of a band along a polyline between two offsets, over a range of vertices. */
function band(points: readonly Pt[], nrm: Normals, inner: number, outer: number, i0 = 0, i1 = points.length - 1): Pt[] {
  const side = (offset: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = i0; i <= i1; i += 1) out.push([points[i][0] + nrm[i].n[0] * offset * nrm[i].k, points[i][1] + nrm[i].n[1] * offset * nrm[i].k]);
    return out;
  };
  return [...side(inner), ...side(outer).reverse()];
}

/** The aisles of a band polygon made by `band`: lines from every third vertex of its inner edge to the matching one of its outer, so that blocks begin and end on them. */
function aislesOf(polygon: readonly Pt[]): [Pt, Pt][] {
  const n = polygon.length;
  const out: [Pt, Pt][] = [];
  for (let i = 2; i < n / 2 - 1; i += 3) out.push([polygon[i], polygon[n - 1 - i]]);
  return out;
}

/** The stands of a ballpark, as data. */
export function parkLayout(input: ParkInput): CrowdStands {
  const { crowd } = input;
  const shape: CrowdShape = crowd.shape ?? "horseshoe";
  // The fence in the drawing's own frame (y is minus the distance out), every second point, with its bearing from dead centre.
  const fence: Pt[] = input.fence.filter((_, i) => i % 2 === 0 || i === input.fence.length - 1).map(([u, v]) => [u, -v]);
  const bearing = ([x, y]: Pt): number => (Math.atan2(x, -y) * 180) / Math.PI;
  const pole = (dist(fence[0]) + dist(fence[fence.length - 1])) / 2;
  const R = input.backstop + 22;
  const S = pole + (shape === "grandstand" ? 0 : 25);
  const q = Math.SQRT1_2;

  // The infield's inner edge from the left pole in to home plate and out to the right pole: along each foul line at a distance that eases from the pole's 14 feet to the curve's
  // radius behind home plate (a smooth step, so that it meets the curve with no corner), round behind home plate on a circle about it.
  const gap = (s: number): number => 14 + (R - 14) * (0.5 + 0.5 * Math.cos(Math.PI * Math.min(1, s / pole)));
  const inner: Pt[] = [];
  const lineSteps = 8;
  for (let i = lineSteps; i >= 0; i -= 1) {
    const s = (S * i) / lineSteps;
    inner.push([-q * s - q * gap(s), -q * s + q * gap(s)]);
  }
  const arcSteps = 8;
  for (let k = 1; k < arcSteps; k += 1) {
    const a = ((135 - (90 * k) / arcSteps) * Math.PI) / 180;
    inner.push([R * Math.cos(a), R * Math.sin(a)]);
  }
  for (let i = 0; i <= lineSteps; i += 1) {
    const s = (S * i) / lineSteps;
    inner.push([q * s + q * gap(s), -q * s + q * gap(s)]);
  }
  const nI = normals(inner);

  const rings: StandRing[] = [];
  const add = (id: string, tier: StandRing["tier"], pieces: Pt[][], from: number, to: number, height: [number, number], fill: number): void => {
    const [first, ...rest] = pieces;
    rings.push({
      id,
      tier,
      region: { kind: "poly", points: first },
      ...(rest.length > 0 ? { more: rest.map((points): { kind: "poly"; points: Pt[] } => ({ kind: "poly", points })) } : {}),
      hole: null,
      from,
      to,
      height,
      rake: Math.round((Math.atan2(height[1] - height[0], Math.max(1, to - from)) * 180) / Math.PI * 10) / 10,
      fill,
      seats: pieces.reduce((n, points) => n + seatsIn({ kind: "poly", points }, null), 0),
      aisles: pieces.flatMap((points) => aislesOf(points)),
    });
  };
  const lowerDepth = input.depths?.lower ?? 60;
  const walk = 7;
  const upperDepth = input.depths?.upper ?? 56;
  add("lower", "lower", [band(inner, nI, 0, lowerDepth)], 0, lowerDepth, [4, 40], 1);
  add("upper", "upper", [band(inner, nI, lowerDepth + walk, lowerDepth + walk + upperDepth)], lowerDepth + walk, lowerDepth + walk + upperDepth, [52, 104], 0.88);
  const concourses: CrowdStands["concourses"] = [{ region: { kind: "poly", points: band(inner, nI, lowerDepth - 0.5, lowerDepth + walk + 0.5) }, hole: null }];

  // The outfield: bleachers right behind the fence, radially from home plate, but for a gap at the batter's eye in the horseshoe; and, where the park has seats on top of a wall,
  // a band of them along the wall at its height.
  const wall = 12;
  const depth = input.depths?.bleachers ?? 54;
  if (shape !== "grandstand") {
    const nF: Normals = fence.map((p) => ({ n: [p[0] / (dist(p) || 1), p[1] / (dist(p) || 1)], k: 1 }));
    const eye = (i: number): boolean => Math.abs(fence[i][0]) < pole * 0.07 && shape === "horseshoe";
    const runs: [number, number][] = [];
    let start = 0;
    for (let i = 0; i <= fence.length; i += 1) {
      if (i === fence.length || eye(i)) {
        if (i - 1 > start) runs.push([start, i - 1]);
        start = i + 1;
      }
    }
    const pieces = runs.map(([a, b]) => band(fence, nF, wall, wall + depth, a, b));
    if (pieces.length > 0) add("bleachers", "bleachers", pieces, wall, wall + depth, [4, 30], 0.9);
    for (const w of input.seatsOnWalls ?? []) {
      const on = fence.map((p, i) => ({ i, b: bearing(p) })).filter(({ i, b }) => b >= w.from - 0.01 && b <= w.to + 0.01 && !eye(i));
      if (on.length > 2) add("wall-seats", "wall", [band(fence, nF, 0, 8, on[0].i, on[on.length - 1].i)], 0, 8, [w.height, w.height + 5], 0.95);
    }
  }

  // The visitors: a block along the third-base line, from aisle to aisle, in the two tiers; and a card display round behind home plate.
  const sectors: StandSector[] = [];
  if (crowd.awayEnd !== "none") {
    const awayLeft = crowd.awayEnd !== "right";
    const a0 = awayLeft ? 2 : 17;
    const a1 = awayLeft ? 8 : 23;
    sectors.push({ ring: "lower", kind: "away", points: band(inner, nI, 0, lowerDepth, a0, a1) });
    sectors.push({ ring: "upper", kind: "away", points: band(inner, nI, lowerDepth + walk, lowerDepth + walk + upperDepth, a0, a1) });
  }
  if (crowd.tifo !== undefined) sectors.push({ ring: "lower", kind: crowd.tifo === "away" ? "tifo-away" : "tifo-home", points: band(inner, nI, 0, lowerDepth, 11, 14) });

  const gaps: StandGap[] = [];
  if (crowd.gaps) {
    gaps.push({ kind: "tunnel", box: [-8, R - 1, 8, R + lowerDepth + 1] });
    gaps.push({ kind: "camera", box: [-20, R + lowerDepth + walk + 8, 20, R + lowerDepth + walk + 18] });
  }

  // The field's box and how far the stands reach beyond it.
  const us = input.fence.map(([u]) => u);
  const vs = input.fence.map(([, v]) => v);
  const box = { x: Math.min(...us), y: -Math.max(...vs), w: Math.max(...us) - Math.min(...us), h: Math.max(...vs) + input.backstop };
  const all = rings.flatMap((r) => [r.region, ...(r.more ?? [])].flatMap((o) => (o.kind === "poly" ? o.points : [])));
  const reach = {
    left: Math.max(0, box.x - Math.min(...all.map(([x]) => x))),
    right: Math.max(0, Math.max(...all.map(([x]) => x)) - (box.x + box.w)),
    top: Math.max(0, box.y - Math.min(...all.map(([, y]) => y))),
    bottom: Math.max(0, Math.max(...all.map(([, y]) => y)) - (box.y + box.h)),
  };
  return { sport: "mlb", shape, box, rings, covers: [], concourses, sectors, gaps, reach, seats: rings.reduce((n, r) => n + r.seats, 0) };
}
