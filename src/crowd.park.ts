// A ballpark's stands: the grandstands along the foul lines and round behind home plate, and the bleachers behind the outfield fence, laid from the park's own wall outline
// (`fenceOutline`, the points of the fence the drawing has), so that the seats sit behind the real walls. The distances are conventions for a drawing: a ballpark's stands
// are as unlike one another as its fences, and no figure is the park's own.
import type { Crowd, CrowdStands, Pt, StandGap, StandRing, StandSector } from "./crowd.ts";
import { seatsIn } from "./crowd.ts";
import type { CrowdShape } from "./types.ts";

/** What a ballpark's stands are laid from. */
export interface ParkInput {
  /** The fence as points on the field: u across (negative to the left), v out from the back of home plate. */
  fence: readonly Pt[];
  /** How far behind home plate the backstop stands, in feet. */
  backstop: number;
  crowd: Crowd;
}

const dist = ([x, y]: Pt): number => Math.hypot(x, y);

/** The unit normals of a polyline pointing away from home, averaged at each vertex, with the length the offset grows by at a corner (limited to 1.8). */
function normals(points: readonly Pt[]): { n: Pt; k: number }[] {
  const segments = points.slice(1).map(([x, y], i): Pt => {
    const [px, py] = points[i];
    const dx = x - px;
    const dy = y - py;
    const len = Math.hypot(dx, dy) || 1;
    let nx = dy / len;
    let ny = -dx / len;
    // The normal that points away from home plate.
    const mx = (x + px) / 2;
    const my = (y + py) / 2;
    if (nx * mx + ny * my < 0) {
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
    const cos = Math.max(0.55, (a[0] * n[0] + a[1] * n[1]));
    return { n, k: 1 / cos };
  });
}

/** The polygon of a band along a polyline between two offsets (one value each, or a function of the vertex), over a range of vertices. */
function band(points: readonly Pt[], nrm: readonly { n: Pt; k: number }[], inner: (i: number) => number, outer: (i: number) => number, i0 = 0, i1 = points.length - 1): Pt[] {
  const side = (offset: (i: number) => number): Pt[] => {
    const out: Pt[] = [];
    for (let i = i0; i <= i1; i += 1) out.push([points[i][0] + nrm[i].n[0] * offset(i) * nrm[i].k, points[i][1] + nrm[i].n[1] * offset(i) * nrm[i].k]);
    return out;
  };
  return [...side(inner), ...side(outer).reverse()];
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The stands of a ballpark, as data. */
export function parkLayout(input: ParkInput): CrowdStands {
  const { crowd } = input;
  const shape: CrowdShape = crowd.shape ?? "horseshoe";
  // The fence in the drawing's own frame (y is minus the distance out), every second point.
  const fence: Pt[] = input.fence.filter((_, i) => i % 2 === 0 || i === input.fence.length - 1).map(([u, v]) => [u, -v]);
  const left = fence[0];
  const right = fence[fence.length - 1];
  const pole = (dist(left) + dist(right)) / 2;
  const R = input.backstop + 22;
  const S = pole + (shape === "grandstand" ? 0 : 25);
  const direction = Math.SQRT1_2;

  // The infield's inner edge, from the left pole round behind home plate to the right pole: the foul lines' side, then an arc.
  const inner: Pt[] = [];
  const steps = 7;
  const gap = (s: number): number => lerp(R, 14, Math.min(1, s / pole) ** 1.2);
  for (let i = steps; i >= 0; i -= 1) {
    const s = (S * i) / steps;
    inner.push([-direction * s - direction * gap(s), -direction * s + direction * gap(s)]);
  }
  for (let a = 135; a >= 45; a -= 15) inner.push([R * Math.cos((a * Math.PI) / 180), R * Math.sin((a * Math.PI) / 180)]);
  for (let i = 0; i <= steps; i += 1) {
    const s = (S * i) / steps;
    inner.push([direction * s + direction * gap(s), -direction * s + direction * gap(s)]);
  }
  const nI = normals(inner);

  const rings: StandRing[] = [];
  const add = (id: StandRing["tier"] | string, tier: StandRing["tier"], points: Pt[], from: number, to: number, height: [number, number], fill: number): StandRing => {
    const region = { kind: "poly" as const, points };
    const ring: StandRing = { id, tier, region, hole: null, from, to, height, rake: Math.round((Math.atan2(height[1] - height[0], Math.max(1, to - from)) * 180) / Math.PI * 10) / 10, fill, seats: seatsIn(region, null) };
    rings.push(ring);
    return ring;
  };
  const lowerDepth = 62;
  const lowerRing = add("lower", "lower", band(inner, nI, () => 0, () => lowerDepth), 0, lowerDepth, [4, 42], 1);
  add("upper", "upper", band(inner, nI, () => lowerDepth + 12, () => lowerDepth + 70), lowerDepth + 12, lowerDepth + 70, [54, 108], 0.88);

  // The outfield: bleachers behind the fence, radially from home plate, but for a gap at the batter's eye in the horseshoe.
  if (shape !== "grandstand") {
    const eye = (i: number): boolean => Math.abs(fence[i][0]) < pole * 0.07 && shape === "horseshoe";
    const runs: [number, number][] = [];
    let start = 0;
    for (let i = 0; i <= fence.length; i += 1) {
      if (i === fence.length || eye(i)) {
        if (i - 1 > start) runs.push([start, i - 1]);
        start = i + 1;
      }
    }
    const nF = fence.map((p): { n: Pt; k: number } => {
      const d = dist(p) || 1;
      return { n: [p[0] / d, p[1] / d], k: 1 };
    });
    const wall = 30;
    const depth = 54;
    const polys = runs.map(([a, b]) => band(fence, nF, () => wall, () => wall + depth, a, b));
    // One ring for the whole outfield: the pieces on either side of the batter's eye are parts of the one band.
    if (polys.length > 0) {
      const [first, ...rest] = polys;
      rings.push({ id: "bleachers", tier: "bleachers", region: { kind: "poly", points: first }, ...(rest.length > 0 ? { more: rest.map((points): { kind: "poly"; points: Pt[] } => ({ kind: "poly", points })) } : {}), hole: null, from: wall, to: wall + depth, height: [4, 30], rake: Math.round((Math.atan2(26, depth) * 180) / Math.PI * 10) / 10, fill: 0.9, seats: polys.reduce((n, p) => n + seatsIn({ kind: "poly", points: p }, null), 0) });
    }
  }

  // The visitors: a block behind the third-base dugout, along the left foul line's lower stands (and a card display behind home plate).
  const sectors: StandSector[] = [];
  const awayLeft = input.crowd.awayEnd === "left" || (input.crowd.awayEnd !== "right" && input.crowd.awayEnd !== "none");
  if (input.crowd.awayEnd !== "none") {
    const a0 = awayLeft ? 1 : steps + 9 + 2;
    const a1 = awayLeft ? 5 : steps + 9 + 6;
    const ring = lowerRing;
    sectors.push({ ring: ring.id, kind: "away", points: band(inner, nI, () => 0, () => lowerDepth, a0, a1) });
    sectors.push({ ring: "upper", kind: "away", points: band(inner, nI, () => lowerDepth + 12, () => lowerDepth + 70, a0, a1) });
  }
  if (crowd.tifo !== undefined) {
    const a0 = steps + 2;
    const a1 = steps + 8;
    sectors.push({ ring: lowerRing.id, kind: crowd.tifo === "away" ? "tifo-away" : "tifo-home", points: band(inner, nI, () => 0, () => lowerDepth, a0, a1) });
  }

  const gaps: StandGap[] = [];
  if (crowd.gaps) {
    gaps.push({ kind: "tunnel", box: [-9, R - 1, 9, R + lowerDepth + 1] });
    gaps.push({ kind: "camera", box: [-20, R + lowerDepth + 15, 20, R + lowerDepth + 25] });
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
  return { sport: "mlb", shape, box, rings, covers: [], sectors, gaps, reach, seats: rings.reduce((n, r) => n + r.seats, 0) };
}
