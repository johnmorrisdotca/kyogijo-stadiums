// What fills the empty places of a real venue's 3D view, so that no big flat sheet is left in it: the suite level between two bowls (a facing wall with a band of windows, not a bare shelf), the apron between the
// playing surface and the first row (a thin dark floor, and for ice hockey the players' benches, the penalty boxes and the timekeeper's table), the back of each bowl (a wall that closes it) and, between that wall and
// the walls of the hall, a darker concourse floor with its lanes. All of it is ours, plausible and no plan of a real building: where a source gives a figure for none of it, the sizes are the usual ones.
// Pure: data in, planes out.
import { rayAt, type CrowdStands, type Outline, type Pt, type StandRing } from "./crowd.ts";
import { NHL } from "./geometry.ts";
import { n, shy, wall, box, type Plane } from "./turn.kit.ts";
import { areaOf, pointList, raked, stripsOf, tidy, type Cut, type Slope, type Strip } from "./venue.geom.ts";
import { firstHit } from "./venue.real.ts";

/** The suite level's windows stand between these shares of the way across the facing wall (the bottom is a parapet, the top a ledge), and a pane is about this wide, in feet (ours). */
export const SUITE = { from: 0.3, to: 0.82, pane: 7 } as const;
/** The thin floor of the apron lies this far over the surface, in feet, so that it shows over the floor's own drawing. */
export const APRON_RISE = 0.06;
/** The bench side's furniture, in feet along the boards from the middle of the rink: the timekeeper's table, the penalty boxes either side of it, and each team's bench beyond (ours: the usual layout of a rink, no plan of a real one). */
export const BENCH_SIDE = { table: 6, penalty: [8, 20], bench: [24, 62], depth: 5, gap: 1.5, height: 3.4 } as const;
/** How much of a bowl's back wall is left where it is between the eye and the surface (the walls of the building take 0.02: the back of a bowl keeps a little of its body). */
export const BACK_FADE = 0.08;
/** How high the coping stands over the top row on the back wall, in feet, and the walks of the concourse floor are this many feet from its two edges (ours). */
const COPING = 3;
/** The joints of the concourse floor: one about every this many feet along it, at most so many to a quad (ours). */
const JOINT = 22;
/** A piece of the concourse floor smaller than this, in square feet, is a sliver a corner leaves (where the hall's rim meets the building's outline): it is left to the floor drawn under it, which has the same dark tone. */
export const SLIVER = 80;
const JOINTS_MOST = 8;

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const flatAt = (z: number): Slope => ({ x0: 0, y0: 0, z0: z, gx: 0, gy: 0 });

/** The suite level seen square on: the facing wall of a quad `[inner a, inner b, outer b, outer a]` (the plane's own corners), with a band of windows and a pane to every `SUITE.pane` feet. */
export function suiteWall(corners: Pt[]): string {
  const base = `<polygon class="u-suite" points="${pointList(corners)}"/>`;
  if (corners.length !== 4) return base;
  const [a, b, c, d] = corners;
  const across = (s: number, t: number): Pt => lerp(lerp(a, b, s), lerp(d, c, s), t);
  const panes = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / SUITE.pane));
  const band = `<polygon class="u-suite-win" points="${pointList([across(0, SUITE.from), across(1, SUITE.from), across(1, SUITE.to), across(0, SUITE.to)])}"/>`;
  let bars = "";
  for (let j = 1; j < panes; j += 1) {
    const [p, q] = [across(j / panes, SUITE.from), across(j / panes, SUITE.to)];
    bars += `M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}`;
  }
  const ledge = `<polygon class="u-suite-ledge" points="${pointList([across(0, SUITE.to), across(1, SUITE.to), across(1, SUITE.to + 0.07), across(0, SUITE.to + 0.07)])}"/>`;
  return `${base}${band}${bars === "" ? "" : `<path class="u-suite-bar" fill="none" d="${bars}"/>`}${ledge}`;
}

/** The floor strips of a ring of quads painted as a floor: a base and the walks along it, at the shares `lanes` of the way across. */
function floorOf(cls: string, lanes: readonly number[]): (corners: Pt[]) => string {
  return (corners) => {
    const base = `<polygon class="${cls}" points="${pointList(corners)}"/>`;
    if (corners.length === 3) {
      // A triangle (where two rays meet at a corner of the building): its outline drawn again, smaller, round its middle.
      const mid: Pt = [(corners[0][0] + corners[1][0] + corners[2][0]) / 3, (corners[0][1] + corners[1][1] + corners[2][1]) / 3];
      const inner = lanes.map((t) => `M${corners.map((p) => `${n(mid[0] + (p[0] - mid[0]) * (1 - t))} ${n(mid[1] + (p[1] - mid[1]) * (1 - t))}`).join("L")}Z`);
      return `${base}<path class="u-clane" fill="none" d="${inner.join("")}"/>`;
    }
    if (corners.length !== 4) return base;
    const [a, b, c, d] = corners;
    const lines = lanes.map((t) => {
      const [p, q] = [lerp(a, d, t), lerp(b, c, t)];
      return `M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}`;
    });
    // Joints across the floor, a paving's worth, so that a wide floor is not one flat sheet.
    const joints = Math.min(JOINTS_MOST, Math.max(0, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / JOINT)));
    for (let j = 1; j < joints; j += 1) {
      const [p, q] = [lerp(a, b, j / joints), lerp(d, c, j / joints)];
      lines.push(`M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}`);
    }
    return `${base}<path class="u-clane" fill="none" d="${lines.join("")}"/>`;
  };
}

/** The quads of a strip, as `[inner i, inner i + 1, outer i + 1, outer i]`, those with a width. */
function* quadsOf(strip: Strip): Generator<[Pt, Pt, Pt, Pt]> {
  for (let i = 0; i + 1 < strip.inner.length; i += 1) {
    const q: [Pt, Pt, Pt, Pt] = [strip.inner[i], strip.inner[i + 1], strip.outer[i + 1], strip.outer[i]];
    if (Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) < 1e-6 && Math.hypot(q[2][0] - q[3][0], q[2][1] - q[3][1]) < 1e-6) continue;
    yield q;
  }
}

/** The direction along a quad's first edge (or its outer edge where the inner has shrunk to a point). */
const alongOf = (q: readonly [Pt, Pt, Pt, Pt]): Pt => {
  const [from, to] = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) >= Math.hypot(q[2][0] - q[3][0], q[2][1] - q[3][1]) ? [q[0], q[1]] : [q[3], q[2]];
  const long = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return long < 1e-9 ? [1, 0] : [(to[0] - from[0]) / long, (to[1] - from[1]) / long];
};

/** A ring of flat quads lying at `z`, between two outlines, painted as `paint` says, with the ids `${id}-${i}`. */
function floorRing(id: string, kind: "apron" | "floor", strips: readonly Strip[], z: number, paint: (corners: Pt[]) => string, least = 0.05): Plane[] {
  const planes: Plane[] = [];
  let count = 0;
  for (const strip of strips) {
    for (const q of quadsOf(strip)) {
      const poly = tidy(q);
      if (poly.length < 3 || Math.abs(areaOf(poly)) < least) continue;
      count += 1;
      const p = raked(`${id}-${count}`, kind, poly, flatAt(z), alongOf(q), (corners) => paint(corners));
      if (p !== undefined) planes.push(p);
    }
  }
  return planes;
}

/** The apron: the floor between the playing surface and the first row, a thin dark floor, and where the bowl is an ice rink's the benches, the penalty boxes and the timekeeper's table on the bench side. */
export function apronPlanes(stands: CrowdStands, first: StandRing, cut: Cut, lift: number): Plane[] {
  const hole = first.hole;
  if (hole === null || hole.kind !== "rrect") return [];
  const b = stands.box;
  const rink: Extract<Outline, { kind: "rrect" }> = { kind: "rrect", x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h, r: stands.sport === "nhl" ? NHL.cornerRadius : 0 };
  const planes = floorRing("apron", "apron", stripsOf(hole, rink, [], cut), lift + APRON_RISE, (corners) => `<polygon class="u-apron" points="${pointList(corners)}"/>`);
  if (stands.sport !== "nhl") return planes;
  // The bench side is the one with the deeper apron (the NHL's first row stands further from that side); the furniture stands in the clear between the boards and the first row.
  const bottom = hole.y1 - (b.y + b.h) >= b.y - hole.y0;
  const depth = bottom ? hole.y1 - (b.y + b.h) : b.y - hole.y0;
  const need = BENCH_SIDE.gap + BENCH_SIDE.depth;
  if (depth < need + 1) return planes;
  const [y0, y1] = bottom ? [b.y + b.h + BENCH_SIDE.gap, b.y + b.h + need] : [b.y - need, b.y - BENCH_SIDE.gap];
  const mid = b.x + b.w / 2;
  const put = (id: string, from: number, to: number, cls: string): Plane[] => box(id, "bench", { x0: mid + from, y0, x1: mid + to, y1 }, BENCH_SIDE.height, cls);
  const furniture: Plane[] = [...put("timekeeper", -BENCH_SIDE.table, BENCH_SIDE.table, "u-timeb")];
  for (const sign of [-1, 1]) {
    const span = (lo: number, hi: number): [number, number] => (sign < 0 ? [-hi, -lo] : [lo, hi]);
    furniture.push(...put(`penalty-${sign < 0 ? "a" : "b"}`, ...span(BENCH_SIDE.penalty[0], BENCH_SIDE.penalty[1]), "u-penb"));
    furniture.push(...put(`bench-${sign < 0 ? "a" : "b"}`, ...span(BENCH_SIDE.bench[0], BENCH_SIDE.bench[1]), "u-teamb"));
  }
  return [...planes, ...furniture];
}

/** The plan of a ring's back: the outer edge of every strip of a tier that no walk leads on from, as the loop of points the wall is raised on. */
export const backEdges = (ring: StandRing, cut: Cut): Pt[][] => stripsOf(ring.region, ring.hole, ring.more ?? [], cut).map((strip) => strip.outer);

/** The back wall of one bowl: from the floor up to the top row and a coping over it, on each stretch of the edge, painted with its ribs. It gives way to the eye as the walls of the building do, but keeps a little of itself. */
export function backWall(id: string, edge: readonly Pt[], top: number, lift: number, centre: readonly [number, number]): Plane[] {
  const planes: Plane[] = [];
  for (let i = 0; i + 1 < edge.length; i += 1) {
    const [a, b] = [edge[i], edge[i + 1]];
    const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (long < 0.5) continue;
    const high = lift + top;
    const ribs = Math.max(1, Math.round(long / 14));
    let lines = "";
    for (let j = 1; j < ribs; j += 1) lines += `M${n((long * j) / ribs)} ${n(COPING)}V${n(high)}`;
    const svg = `<rect class="u-back" width="${n(long)}" height="${n(high)}"/>${lines === "" ? "" : `<path class="u-backrib" fill="none" d="${lines}"/>`}<rect class="u-coping" width="${n(long)}" height="${n(COPING)}"/>`;
    planes.push({ ...shy(wall(`${id}-${i}`, "wall", a[0], a[1], b[0], b[1], 0, high, svg), centre), fadeTo: BACK_FADE });
  }
  return planes;
}

/**
 * The concourse floor behind a bowl: flat quads, painted dark with two lanes, in rays from the middle: from the bowl's outer edge out to the rim of the hall (the nearer of the hall's rounded outline and the
 * building's own), and from there on out to the building's outline, where the building has annexes beyond the hall (the walls and the roof stand on the hall only; the rest is floor too, not a bare sheet).
 * The two rings are cut at the rim, so that a wall standing on it is drawn between them in the right order.
 */
export function concourseFloor(id: string, edge: Outline, middle: Pt, rim: (angle: number) => Pt, far: (angle: number) => Pt | undefined, steps: number, lift: number): Plane[] {
  const dist = (p: Pt): number => Math.hypot(p[0] - middle[0], p[1] - middle[1]);
  const angles = Array.from({ length: steps + 1 }, (_, k) => (2 * Math.PI * k) / steps);
  const inner = angles.map((a) => rayAt(edge, middle[0], middle[1], a));
  const rims = angles.map((a, k): Pt => {
    const r = rim(a);
    return dist(r) > dist(inner[k]) + 0.5 ? r : inner[k];
  });
  const outs = angles.map((a, k): Pt => {
    const f = far(a);
    return f !== undefined && dist(f) > dist(rims[k]) + 0.5 ? f : rims[k];
  });
  const paint = floorOf("u-cfloor", [0.3, 0.62]);
  return [...floorRing(`${id}-in`, "floor", [{ inner, outer: rims }], lift + APRON_RISE, paint, SLIVER), ...floorRing(`${id}-out`, "floor", [{ inner: rims, outer: outs }], lift + APRON_RISE, paint, SLIVER)];
}

/** The rim of a real venue's hall along an angle from `middle`: the nearer of the hall's rounded outline and the building's own outline. */
export const rimAt = (hall: Outline, footprint: readonly Pt[], middle: Pt) => (angle: number): Pt => {
  const cap = rayAt(hall, middle[0], middle[1], angle);
  const out = firstHit(footprint, middle, angle);
  return out !== undefined && Math.hypot(out[0] - middle[0], out[1] - middle[1]) < Math.hypot(cap[0] - middle[0], cap[1] - middle[1]) ? out : cap;
};
