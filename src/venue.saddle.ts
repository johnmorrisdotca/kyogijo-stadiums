// The Scotiabank Saddledome's building, drawn for what it is: a round building under one roof that is a reverse hyperbolic paraboloid, a surface that is high at two opposite points of its rim and low at the two between.
// The roof is a net of quads on that surface (the plan, a circle, is mapped on a square grid so that every cell is a fair quad and the seams run along the roof the way a precast roof's joints do), edged by a thick beam that
// overhangs the wall; the wall leans out from its foot to that beam, in facets with a pier between the panels. Which way the roof lies over the ground, how high its high points and its low rim stand and the building's
// round plan are the data's (`roof.saddle` in scripts/venues.data.json, with what each was read from); the beam, the piers, the lean, the cell counts and the shading are ours. Pure: data in, planes out.
import type { Pt, RealShell } from "./crowd.ts";
import { plane, shy, type Plane, type V3 } from "./turn.kit.ts";

/** The saddle's measure, in the drawing's frame: its middle, the radius of its round plan, the unit direction of the line through its two high points (and the one across it), and the heights of the high points and of the low rim (feet over the surface). */
export type Saddle = NonNullable<RealShell["saddle"]>;

/** The cells to a side of the roof's grid (the plan is 4 times that round the rim), and the rings of the wall, at each detail. */
export const SADDLE_CELLS = { low: 8, auto: 10, high: 16 } as const;
/** How thick the beam round the roof's edge is, how far it overhangs the wall's top, how far the wall leans out over its height (a share of the height of the edge there), in feet or as a share (ours: measured on photographs, a hand's accuracy). */
export const EAVE = { depth: 5, overhang: 7, lean: 0.14 } as const;
/** A pier stands on the wall at every this many facets, and the band of small windows lies between these shares of the wall's height (ours). */
export const PIER_EVERY = 2;
/** The lines of the cladding across a panel, as shares of its height (ours). */
const CLADDING = [0.1, 0.2, 0.3, 0.52, 0.6, 0.68, 0.76, 0.84, 0.92] as const;
export const WINDOWS = { from: 0.4, to: 0.44 } as const;
/** The light the shading is cut from, in the drawing's frame (x along the rink, y down the page, z up): from above, to the upper left (ours). */
const LIGHT: V3 = (() => {
  const l: V3 = [-0.42, -0.5, 0.76];
  const k = Math.hypot(...l);
  return [l[0] / k, l[1] / k, l[2] / k];
})();

/** A length to a tenth of a foot: all a facet's drawing needs. */
const t = (value: number): string => String(Math.round(value * 10) / 10);

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** The height of the roof over a point of the plan, above the surface, in feet: a hyperbolic paraboloid over the round plan, high along `axis` and low across it. */
export function saddleHeight(s: Saddle, [x, y]: Pt): number {
  const [dx, dy] = [(x - s.centre[0]) / s.radius, (y - s.centre[1]) / s.radius];
  const [a, b] = [dx * s.axis[0] + dy * s.axis[1], -dx * s.axis[1] + dy * s.axis[0]];
  return (s.high + s.low) / 2 + ((s.high - s.low) / 2) * (a * a - b * b);
}

/** A point of the unit disk for a point of the square (a fair mapping: a square grid becomes a net of quads that is fine everywhere, with no pole in the middle). */
const diskOf = (s: number, t: number): Pt => [s * Math.sqrt(1 - (t * t) / 2), t * Math.sqrt(1 - (s * s) / 2)];

/** The plan point and height of a point `(a, b)` of the unit disk (`a` along the axis, `b` across it), at `scale` of the radius and `z` over the surface. */
function pointOf(s: Saddle, [a, b]: Pt, scale = 1, z?: number): V3 {
  const x = s.centre[0] + s.radius * scale * (a * s.axis[0] - b * s.axis[1]);
  const y = s.centre[1] + s.radius * scale * (a * s.axis[1] + b * s.axis[0]);
  return [x, y, z ?? saddleHeight(s, [x, y])];
}

/**
 * A quad of four corners (in order round it) as one plane: its first corner, its side to the second and its side to the fourth span the plane; the third corner is put where the plane has it (a quad of a doubly curved surface is not quite
 * flat, and the plane is the nearest flat piece: within a foot or two at every cut). `paint` gets the corners in the plane's own feet, and the plane's own (unit) normal as it lies in the drawing.
 */
export function quadPlane(id: string, kind: Plane["kind"], corners: readonly [V3, V3, V3, V3], paint: (local: [Pt, Pt, Pt, Pt]) => string): Plane | undefined {
  const [a, b, c, d] = corners;
  const u = sub(b, a);
  const v = sub(d, a);
  const [lu, lv] = [Math.hypot(...u), Math.hypot(...v)];
  if (lu < 1e-6 || lv < 1e-6) return undefined;
  // Where the third corner is, in the plane's own feet: the least squares of c - a over u and v.
  const w = sub(c, a);
  const [uu, uv, vv, uw, vw] = [dot(u, u), dot(u, v), dot(v, v), dot(u, w), dot(v, w)];
  const det = uu * vv - uv * uv;
  if (Math.abs(det) < 1e-9) return undefined;
  const [ca, cb] = [(uw * vv - vw * uv) / det, (vw * uu - uw * uv) / det];
  const local: [Pt, Pt, Pt, Pt] = [[0, 0], [lu, 0], [ca * lu, cb * lv], [0, lv]];
  return plane(id, kind, a, u, v, paint(local));
}

/** The shade of a facet from its normal and the light: nothing where it is lit square, a darker veil where it turns away, a lighter one where it faces the light. `up` is the side of the normal that is the facet's outside. */
function veil(corners: readonly [V3, V3, V3, V3], outside: V3): { s: number; dark: number; light: number } {
  let normal = unit(cross(sub(corners[1], corners[0]), sub(corners[3], corners[0])));
  if (dot(normal, outside) < 0) normal = [-normal[0], -normal[1], -normal[2]];
  const s = dot(normal, LIGHT);
  const [dark, light] = [Math.max(0, Math.min(0.3, (0.5 - s) * 0.45)), Math.max(0, Math.min(0.22, (s - 0.68) * 0.8))];
  return { s, dark: Math.round(dark * 100) / 100, light: Math.round(light * 100) / 100 };
}

/** The facet's polygon, then the veil over it (a darker or a lighter wash of the facet's own shape), as one drawing. */
function facet(cls: string, local: readonly Pt[], shade: { dark: number; light: number }, extra = ""): string {
  const pts = local.map(([x, y]) => `${t(x)},${t(y)}`).join(" ");
  const wash = shade.dark > 0 ? `<polygon class="u-shade" fill-opacity="${shade.dark}" points="${pts}"/>` : shade.light > 0 ? `<polygon class="u-lite" fill-opacity="${shade.light}" points="${pts}"/>` : "";
  return `<polygon class="${cls}" points="${pts}"/>${wash}${extra}`;
}

/** The grid of the roof as points of the unit disk: `cells + 1` to a side. */
function gridOf(cells: number): Pt[][] {
  return Array.from({ length: cells + 1 }, (_, i) => Array.from({ length: cells + 1 }, (_, j) => diskOf(-1 + (2 * i) / cells, -1 + (2 * j) / cells)));
}

/** The rim as points of the unit disk, going once round: along the four sides of the grid, `cells` to a side. */
function rimOf(cells: number): Pt[] {
  const g = gridOf(cells);
  const out: Pt[] = [];
  for (let i = 0; i < cells; i += 1) out.push(g[i][0]);
  for (let j = 0; j < cells; j += 1) out.push(g[cells][j]);
  for (let i = cells; i > 0; i -= 1) out.push(g[i][cells]);
  for (let j = cells; j > 0; j -= 1) out.push(g[0][j]);
  return out;
}

/** The roof: the net of quads over the round plan, `cells` to a side, with the beam round its edge. Every plane is a roof's, cut away from above and, by its side, from the eye's; the beam is the edge of the roof's own item. */
export function saddleRoof(s: Saddle, lift: number, cells: number): Plane[] {
  const planes: Plane[] = [];
  const grid = gridOf(cells);
  const at = ([a, b]: Pt): V3 => {
    const p = pointOf(s, [a, b]);
    return [p[0], p[1], lift + p[2]];
  };
  for (let i = 0; i < cells; i += 1) {
    for (let j = 0; j < cells; j += 1) {
      const corners = [at(grid[i][j]), at(grid[i + 1][j]), at(grid[i + 1][j + 1]), at(grid[i][j + 1])] as [V3, V3, V3, V3];
      const [mx, my] = [(corners[0][0] + corners[1][0] + corners[2][0] + corners[3][0]) / 4 - s.centre[0], (corners[0][1] + corners[1][1] + corners[2][1] + corners[3][1]) / 4 - s.centre[1]];
      const shade = veil(corners, [0, 0, 1]);
      const p = quadPlane(`roof-${i}-${j}`, "roof", corners, (local) => facet("u-saddle", local, shade));
      if (p === undefined) continue;
      const away = Math.hypot(mx, my) || 1;
      planes.push({ ...p, shy: [mx / away, my / away], fadeTo: 0.06 });
    }
  }
  // The beam round the roof's edge: from the roof's rim down and in to the top of the wall.
  const rim = rimOf(cells);
  rim.forEach((a, k) => {
    const b = rim[(k + 1) % rim.length];
    const [top0, top1] = [at(a), at(b)];
    const foot = (p: V3, ab: Pt): V3 => {
      const q = pointOf(s, ab, 1 - EAVE.overhang / s.radius, p[2] - EAVE.depth);
      return [q[0], q[1], q[2]];
    };
    const corners = [top0, top1, foot(top1, b), foot(top0, a)] as [V3, V3, V3, V3];
    const mid: V3 = [(top0[0] + top1[0]) / 2 - s.centre[0], (top0[1] + top1[1]) / 2 - s.centre[1], 0];
    const shade = veil(corners, mid);
    const away = Math.hypot(mid[0], mid[1]) || 1;
    const p = quadPlane(`beam-${k}`, "roof", corners, (local) => facet("u-saddle-beam", local, shade));
    if (p !== undefined) planes.push({ ...p, shy: [mid[0] / away, mid[1] / away], fadeTo: 0.02 });
  });
  return planes;
}

/** The wall: a facet between each two points of the rim, leaning out from its foot to the beam, with a pier between every `PIER_EVERY` panels, the fine lines of its cladding and a few windows. Each gives way by the eye's side as a wall does. */
export function saddleWalls(s: Saddle, lift: number, cells: number, centre: Pt): Plane[] {
  const planes: Plane[] = [];
  const rim = rimOf(cells);
  const topOf = (ab: Pt): V3 => {
    const e = pointOf(s, ab);
    const q = pointOf(s, ab, 1 - EAVE.overhang / s.radius, e[2] - EAVE.depth);
    return [q[0], q[1], lift + q[2]];
  };
  const footOf = (ab: Pt): V3 => {
    const e = pointOf(s, ab);
    const q = pointOf(s, ab, 1 - (EAVE.overhang + EAVE.lean * e[2]) / s.radius, lift);
    return [q[0], q[1], q[2]];
  };
  rim.forEach((a, k) => {
    const b = rim[(k + 1) % rim.length];
    const corners = [footOf(a), footOf(b), topOf(b), topOf(a)] as [V3, V3, V3, V3];
    const mid: V3 = [(corners[0][0] + corners[1][0]) / 2 - centre[0], (corners[0][1] + corners[1][1]) / 2 - centre[1], 0];
    const shade = veil(corners, mid);
    const pier = k % PIER_EVERY === 0;
    const plank = quadPlane(`shell-${k}`, "wall", corners, (local) => {
      // A point of the facet by its share along the foot (x) and up the wall (y).
      const at = (x: number, y: number): Pt => {
        const [a0, b0, c0, d0] = local;
        const low: Pt = [a0[0] + (b0[0] - a0[0]) * x, a0[1] + (b0[1] - a0[1]) * x];
        const high: Pt = [d0[0] + (c0[0] - d0[0]) * x, d0[1] + (c0[1] - d0[1]) * x];
        return [low[0] + (high[0] - low[0]) * y, low[1] + (high[1] - low[1]) * y];
      };
      const line = (y: number): string => `M${t(at(0, y)[0])} ${t(at(0, y)[1])}L${t(at(1, y)[0])} ${t(at(1, y)[1])}`;
      // The finer the cut, the more of the wall's detail: the lowest has neither the cladding nor the windows, the next the windows, the finest both.
      const cladding = cells >= SADDLE_CELLS.high ? `<path class="u-clad" fill="none" d="${CLADDING.map(line).join("")}"/>` : "";
      // Three small windows in a row across the middle of the panel, a pane's width apart.
      const panes = [0.2, 0.42, 0.64].map((x) => [at(x, WINDOWS.from), at(x + 0.16, WINDOWS.from), at(x + 0.16, WINDOWS.to), at(x, WINDOWS.to)]);
      const windows = cells < SADDLE_CELLS.auto ? "" : panes.map((q) => `<polygon class="u-glazing" points="${q.map(([x, y]) => `${t(x)},${t(y)}`).join(" ")}"/>`).join("");
      const post = pier ? `<path class="u-pier" d="M${t(local[0][0])} ${t(local[0][1])}L${t(local[3][0])} ${t(local[3][1])}"/>` : "";
      return facet("u-saddle-wall", local, shade, `${cladding}${windows}${post}`);
    });
    if (plank === undefined) return;
    planes.push({ ...shy(plank, centre), fadeTo: 0.02 });
  });
  return planes;
}

/** The two stair towers at each end of the roof's high line, a round one and a square one, on the wall's foot at either side of the end: how tall each stands (a share of the wall there) and how big it is, in feet (ours: photographs show each, not its size). */
export const TOWERS = { round: { turn: -24, radius: 11, share: 0.55 }, square: { turn: 24, half: 17, share: 0.45 } } as const;

/** A prism over a polygon on the plan (`ring`, `height` feet over `lift`), each side a facet shaded by the light and the top a flat cap, as a stair tower is; every piece gives way with the wall it stands against (`out` is the way out of the building there). */
function prism(id: string, cls: string, ring: readonly Pt[], lift: number, height: number, out: Pt): Plane[] {
  const planes: Plane[] = [];
  const mx = ring.reduce((t, p) => t + p[0], 0) / ring.length;
  const my = ring.reduce((t, p) => t + p[1], 0) / ring.length;
  ring.forEach((a, k) => {
    const b = ring[(k + 1) % ring.length];
    const corners: [V3, V3, V3, V3] = [[a[0], a[1], lift], [b[0], b[1], lift], [b[0], b[1], lift + height], [a[0], a[1], lift + height]];
    const shade = veil(corners, [(a[0] + b[0]) / 2 - mx, (a[1] + b[1]) / 2 - my, 0]);
    const p = quadPlane(`${id}-${k}`, "wall", corners, (local) => facet(cls, local, shade));
    if (p !== undefined) planes.push({ ...p, shy: out, fadeTo: 0.02 });
  });
  const [x0, x1, y0, y1] = [Math.min(...ring.map((p) => p[0])), Math.max(...ring.map((p) => p[0])), Math.min(...ring.map((p) => p[1])), Math.max(...ring.map((p) => p[1]))];
  const pts = ring.map(([x, y]) => `${t(x - x0)},${t(y - y0)}`).join(" ");
  planes.push({ ...plane(`${id}-top`, "wall", [x0, y0, lift + height], [x1 - x0, 0, 0], [0, y1 - y0, 0], `<polygon class="${cls}" points="${pts}"/>`), shy: out, fadeTo: 0.02 });
  return planes;
}

/** The stair towers: at each of the roof's two high points, a round tower and a square one against the wall, taller where the wall is. */
export function saddleTowers(s: Saddle, lift: number): Plane[] {
  const planes: Plane[] = [];
  for (const end of [0, 1]) {
    const [round, square] = [TOWERS.round, TOWERS.square];
    for (const [name, spec] of [["round", round], ["square", square]] as const) {
      // Where the tower stands: at `turn` degrees from the high point (round the plan), against the wall's foot, which leans out from the beam's.
      const turn = ((spec.turn + end * 180) * Math.PI) / 180;
      const [ax, ay] = [s.axis[0], s.axis[1]];
      const dir: Pt = [ax * Math.cos(turn) - ay * Math.sin(turn), ay * Math.cos(turn) + ax * Math.sin(turn)];
      const edgeAt = pointOf(s, [Math.cos(turn), Math.sin(turn)]);
      const foot = s.radius - EAVE.overhang - EAVE.lean * edgeAt[2];
      const size = name === "round" ? TOWERS.round.radius : TOWERS.square.half;
      const middle: Pt = [s.centre[0] + dir[0] * (foot + size * 0.55), s.centre[1] + dir[1] * (foot + size * 0.55)];
      const height = (edgeAt[2] - EAVE.depth) * spec.share;
      const ring: Pt[] =
        name === "round"
          ? Array.from({ length: 10 }, (_, k): Pt => [middle[0] + TOWERS.round.radius * Math.cos((2 * Math.PI * k) / 10), middle[1] + TOWERS.round.radius * Math.sin((2 * Math.PI * k) / 10)])
          : [[-1, -0.8], [1, -0.8], [1, 0.8], [-1, 0.8]].map(([a, b]): Pt => [middle[0] + TOWERS.square.half * (a * ax - b * ay), middle[1] + TOWERS.square.half * (a * ay + b * ax)]);
      planes.push(...prism(`tower-${end}-${name}`, name === "round" ? "u-stair-round" : "u-stair-square", ring, lift, height, dir));
    }
  }
  return planes;
}
