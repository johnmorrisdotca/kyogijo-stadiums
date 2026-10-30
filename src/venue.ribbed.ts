// A stadium whose shell is a row of concrete ribs with glazed panels between them and a low roof of white panels rising to a ring, closed by a faceted membrane (the Olympic Stadium's: 38 consoles, 34 of them anchored to the
// ground, the roof 52 metres over the field). Pure: the building's outline in, planes out. The ribs, the panels between them and the roof are built the same way: a plane through two points of the outline and the same two
// scaled in towards the middle, so that every piece is a flat trapezoid whose edges meet its neighbours' edges.
import type { Pt, RealShell } from "./crowd.ts";
import { n, plane, type Plane, type V3 } from "./turn.kit.ts";

/** How far the ring's outer edge stands in from the outline, as a share of the way to the middle (ours: the sources give the roof's kind and its height, not its profile; the profile is drawn from photographs). */
const RING = 0.775;
/** How wide a rib is at its foot and at its top (the width of its outer face), how deep (how far it stands proud of the wall between two ribs) at its foot and at its top, in feet (ours). */
const RIB = { wide: [48, 24], deep: [34, 14], flare: 0.225, bend: 2.63, side: 12 } as const;
/** How much of a wall is left where it stands between the eye and the field: the glazed bays give way almost entirely, the ribs stay as a ghost, so that the shell is still known from the near side (ours). */
const BAY_FADE = 0.12;
const RIB_FADE = 0.3;
/** How far the bays are set back from the ribs' outer face at the foot and at the ring, as a share of the way to the middle (ours). */
const SET_BACK = [0.075, 0.028] as const;
/** The height of the podium, of the glazed stack's top and of the ring's top, as shares of the ring's height, and of the ring's lip over it (ours, from photographs). */
const LEVELS = { podium: 0.13, glass: 0.46, ring: 1, lip: 1.05 } as const;
/** The membrane's ring, from the ring in to the crown's edge, as shares of the way to the middle (ours: one ring of long pieces, a shallow cone, to keep the planes few). */
const MEMBRANE = [RING, 0.16] as const;

const scaled = (c: Pt, p: Pt, s: number): Pt => [c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s];
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The rib's outer face's share of the way to the middle at a share `t` of the ring's height: a wing that stands out at the foot and sweeps in as it rises. */
export const ribShare = (t: number): number => 1 - RIB.flare * Math.min(1, Math.max(0, t)) ** RIB.bend;

/** `count` points equally spaced along a closed outline, the first at the point nearest `near` (the tower's side, so that the ribs there begin at the tower). */
export function spaced(outline: readonly Pt[], count: number, near?: Pt): Pt[] {
  const edges = outline.map((p, i) => [p, outline[(i + 1) % outline.length]] as const);
  const lengths = edges.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lengths.reduce((s, l) => s + l, 0);
  const at = (distance: number): Pt => {
    let d = ((distance % total) + total) % total;
    for (let i = 0; i < edges.length; i += 1) {
      if (d <= lengths[i] || i === edges.length - 1) {
        const t = lengths[i] === 0 ? 0 : Math.min(1, d / lengths[i]);
        return [lerp(edges[i][0][0], edges[i][1][0], t), lerp(edges[i][0][1], edges[i][1][1], t)];
      }
      d -= lengths[i];
    }
    return outline[0];
  };
  let start = 0;
  if (near !== undefined) {
    let best = Infinity;
    let run = 0;
    edges.forEach(([a], i) => {
      const gap = Math.hypot(a[0] - near[0], a[1] - near[1]);
      if (gap < best) [best, start] = [gap, run];
      run += lengths[i];
    });
  }
  return Array.from({ length: count }, (_, k) => at(start + (total * k) / count));
}

/** What a ribbed shell is cut into: the points of its outline the ribs stand at, the middle, and the height of the ring (feet, over the surface), and the share of the way to the middle the ring stands at. */
interface Cut {
  points: Pt[];
  c: Pt;
  ring: number;
  crown: number;
}

function cutOf(real: RealShell, c: Pt, steps: number): Cut {
  const dome = real.dome!;
  const count = steps >= 56 ? dome.ribs!.count : Math.round(dome.ribs!.count / 2);
  // The tower stands on the side its axis comes from: the ribs begin there.
  return { points: spaced(real.footprint, count, real.tower?.base), c, ring: dome.low, crown: dome.crown };
}

/**
 * One trapezoid of the shell: between the outline's points `a` and `b`, from the share `s0` of the way to the middle at the height `z0` to the share `s1` at `z1`, drawn in from the rib at each end by `m0` feet at its foot and `m1` at its top
 * (the two chords stay parallel, so it is flat). `paint` draws on it, given its length up the slope, its width at the foot and its top's share of that.
 */
function band(id: string, kind: Plane["kind"], c: Pt, a: Pt, b: Pt, [s0, z0]: [number, number], [s1, z1]: [number, number], paint: (up: number, wide: number, r: number) => string, [m0, m1]: [number, number] = [0, 0]): Plane {
  const long = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const e: Pt = [(b[0] - a[0]) / long, (b[1] - a[1]) / long];
  const [a0, a1] = [scaled(c, a, s0), scaled(c, a, s1)];
  const o: V3 = [a0[0] + e[0] * m0, a0[1] + e[1] * m0, z0];
  const top: V3 = [a1[0] + e[0] * m1, a1[1] + e[1] * m1, z1];
  const [w0, w1] = [Math.max(1, long * s0 - 2 * m0), Math.max(1, long * s1 - 2 * m1)];
  const v: V3 = [e[0] * w0, e[1] * w0, 0];
  const u: V3 = [top[0] - o[0], top[1] - o[1], z1 - z0];
  return plane(id, kind, o, u, v, paint(Math.hypot(...u), w0, w1 / w0));
}

/** How far a piece between two ribs stands back from the rib's middle, in feet: the rib's side planes stand `RIB.side` out from it, and the piece meets them. */
const ribMargin = (): number => RIB.side + 0.4;

const shape = (cls: string) => (up: number, wide: number, r: number): string => `<polygon class="${cls}" points="0 0 ${n(up)} 0 ${n(up)} ${n(wide * r)} 0 ${n(wide)}"/>`;

/** The bay's facade: the podium at its foot (a low dark band of openings, up to the share `low` of the plane's height) and over it the glazed stack, three bands of glass between thin ledges. */
const facade = (low: number) => (up: number, wide: number, r: number): string => {
  const edge = (x: number): number => wide * (1 - (1 - r) * (x / up));
  const band = (f0: number, f1: number, m: number): string => {
    const [x0, x1] = [f0 * up, f1 * up];
    return `<polygon class="u-glass" points="${n(x0)} ${n(m * edge(x0))} ${n(x1)} ${n(m * edge(x1))} ${n(x1)} ${n((1 - m) * edge(x1))} ${n(x0)} ${n((1 - m) * edge(x0))}"/>`;
  };
  const stack = [[0.06, 0.30], [0.38, 0.62], [0.70, 0.94]].map(([f0, f1]) => band(low + (1 - low) * f0, low + (1 - low) * f1, 0.03));
  return `${shape("u-bay")(up, wide, r)}${band(0.35 * low, 0.8 * low, 0.04)}${stack.join("")}`;
};

/** The share of the way to the middle of the wall between two ribs at a share `t` of the ring's height: the ribs' outer face, set back. */
const bayShare = (t: number): number => ribShare(t) - lerp(SET_BACK[0], SET_BACK[1], Math.min(1, t));

/** The height of the roof panels over a point that stands the share `s` of the way from the middle to the outline (above the surface, in feet), for a ring at `ring` feet: the panels' surface, which the stands under them must stay below. 0 where the point is outside the wall's sweep. */
export function ribbedSurfaceAt(s: number, ring: number): number {
  let [lo, hi] = [0, 1];
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (bayShare(mid) > s) lo = mid;
    else hi = mid;
  }
  return ring * LEVELS.lip * lo;
}

/** The outward unit direction at a point of the outline, for the planes that give way to the eye. */
const outward = (c: Pt, p: Pt): [number, number] => {
  const d = Math.hypot(p[0] - c[0], p[1] - c[1]) || 1;
  return [(p[0] - c[0]) / d, (p[1] - c[1]) / d];
};

/**
 * The shell's walls: the podium and the glazed stack of each bay (one plane), and the ribs between them that rise from the ground and sweep in to the ring. Each rib is its profile on a plane each side of its middle (a curved wing) and its outer
 * face, one trapezoid, which is a small part (`fascia`) that the lower tiers leave out, as they leave out the ring's lip.
 */
export function ribbedWalls(real: RealShell, c: Pt, lift: number, steps: number): Plane[] {
  const cut = cutOf(real, c, steps);
  const planes: Plane[] = [];
  const Z = cut.ring;
  const { points } = cut;
  const t1 = LEVELS.glass;
  const t0 = LEVELS.podium;
  points.forEach((a, k) => {
    const b = points[(k + 1) % points.length];
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const shy = outward(c, mid);
    const [sp0, sg] = [bayShare(0), bayShare(t1 / LEVELS.lip)];
    planes.push({ ...band(`bay-${k}`, "wall", c, a, b, [sp0, lift], [sg, lift + Z * t1], facade(t0 / t1), [ribMargin(), ribMargin()]), shy, fadeTo: BAY_FADE });
    planes.push(...rib(`rib-${k}`, c, a, Z, lift, shy));
  });
  return planes;
}

/** One rib at the outline's point `a`: its curved profile on the plane over its radius, and its outer face in two pieces. */
function rib(id: string, c: Pt, a: Pt, Z: number, lift: number, shy: [number, number]): Plane[] {
  const lip = LEVELS.lip;
  const R = Math.hypot(a[0] - c[0], a[1] - c[1]) || 1;
  const [dx, dy] = [(a[0] - c[0]) / R, (a[1] - c[1]) / R];
  // The plane stands over the radius from the ring's share to the foot's, its x running outwards and its y down from the top.
  const [s0, top] = [RING - 0.02, Z * lip];
  const o: V3 = [c[0] + dx * R * s0, c[1] + dy * R * s0, lift + top];
  const wide = R * (1 - s0);
  const steps = 8;
  const t = (i: number): number => i / steps;
  const out = Array.from({ length: steps + 1 }, (_, i): Pt => [R * (ribShare(t(i)) - s0), top - Z * lip * t(i)]);
  const inner = out.map(([x, y], i): Pt => [x - lerp(RIB.deep[0], RIB.deep[1], t(i)), y]);
  const outline = [...out, ...inner.reverse()];
  // The two sides of the rib: the same curved profile on a plane each side of its middle, so that the rib is closed from every side and the pieces between ribs meet it.
  const [tx, ty] = [-dy, dx];
  const outlineText = outline.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
  const planes: Plane[] = [-1, 1].map((side): Plane => {
    const at: V3 = [o[0] + tx * RIB.side * side, o[1] + ty * RIB.side * side, o[2]];
    return { ...plane(`${id}${side < 0 ? "-l" : "-r"}`, "wall", at, [dx * wide, dy * wide, 0], [0, 0, -top], `<polygon class="u-rib" points="${outlineText}"/>`), shy, fadeTo: RIB_FADE };
  });
  // The outer face: one trapezoid along the wing's outer edge, from its foot to the ring, as wide as the rib is at each end.
  const at = (tt: number, side: number): V3 => {
    const half = lerp(RIB.wide[0], RIB.wide[1], tt) / 2;
    const share = ribShare(tt);
    return [c[0] + dx * R * share + tx * half * side, c[1] + dy * R * share + ty * half * side, lift + Z * lip * tt];
  };
  {
    const [p0, p1, p2] = [at(0, -1), at(1, -1), at(0, 1)];
    const [u, v]: [V3, V3] = [[p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]]];
    const [lu, lv] = [Math.hypot(...u), Math.hypot(...v)];
    const r = RIB.wide[1] / RIB.wide[0];
    planes.push({ ...plane(`${id}-f`, "fascia", p0, u, v, `<polygon class="u-rib" points="0 0 ${n(lu)} 0 ${n(lu)} ${n(lv * r)} 0 ${n(lv)}"/>`), shy, fadeTo: RIB_FADE });
  }
  return planes;
}

/**
 * The shell's roof: over each bay two pieces of the white roof panels, rising from the glazed stack to the ring, the ring's lip, and over the ring the membrane in two rings and a flat crown, its pieces crossed by the line of the
 * cable net it is stretched on.
 */
export function ribbedRoof(real: RealShell, c: Pt, lift: number, steps: number): Plane[] {
  const cut = cutOf(real, c, steps);
  const planes: Plane[] = [];
  const { points, ring: Z, crown } = cut;
  const lip = LEVELS.lip;
  const roofAt = (s: number): number => lift + Z * lip + (crown - Z * lip) * (1 - (s / RING) ** 2);
  const across = (id: string, a: Pt, b: Pt, from: [number, number], to: [number, number], cls: string, net: boolean, margin: [number, number], kind: Plane["kind"] = "roof"): Plane => {
    const paint = (up: number, wide: number, r: number): string => `${shape(cls)(up, wide, r)}${net ? `<path class="u-cable" d="M0 0L${n(up)} ${n(wide * r)}"/>` : ""}`;
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return { ...band(id, kind, c, a, b, from, to, paint, margin), shy: outward(c, mid), fadeTo: 0.2 };
  };
  points.forEach((a, k) => {
    const b = points[(k + 1) % points.length];
    const s = (t: number): number => bayShare(t / lip);
    // The roof panels climb from the glazed stack's top to the ring's outer edge in two pieces; the ring's lip stands over it.
    const mids: [number, number][] = [[s(LEVELS.glass), lift + Z * LEVELS.glass], [s(LEVELS.ring), lift + Z * LEVELS.ring], [RING, lift + Z * lip]];
    for (let j = 0; j < 2; j += 1) planes.push(across(`roof-p${j}-${k}`, a, b, mids[j], mids[j + 1], j === 1 ? "u-rib" : "u-dome", false, [ribMargin(), ribMargin()], j === 1 ? "fascia" : "roof"));
    // The membrane: rings in from the ring to the crown.
    for (let j = 0; j < MEMBRANE.length - 1; j += 1) planes.push(across(`roof-${j}-${k}`, a, b, [MEMBRANE[j], roofAt(MEMBRANE[j])], [MEMBRANE[j + 1], roofAt(MEMBRANE[j + 1])], "u-dome", j === 0, [0, 0]));
  });
  // The crown: a flat cap over the middle.
  const top = points.map((p): [number, number] => scaled(c, p, MEMBRANE[MEMBRANE.length - 1]));
  const cap = capOver(top, lift + crown);
  if (cap !== undefined) planes.push(cap);
  return planes;
}

/** A flat polygon at the height `z`, as one plane over its bounding box (the crown). */
function capOver(poly: readonly Pt[], z: number): Plane | undefined {
  if (poly.length < 3) return undefined;
  const [x0, x1] = [Math.min(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[0]))];
  const [y0, y1] = [Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[1]))];
  const svg = `<polygon class="u-dome" points="${poly.map(([x, y]) => `${n(x - x0)},${n(y - y0)}`).join(" ")}"/>`;
  return { ...plane("roof-crown", "roof", [x0, y0, z], [x1 - x0, 0, 0], [0, y1 - y0, 0], svg), fadeTo: 0.2 };
}
