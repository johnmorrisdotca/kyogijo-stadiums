// The famous landmarks of an area of context, each drawn by a shape of its own over what the area's other layers draw: a dome (the Sphere), a big wheel (the High Roller), the jets of a fountain over its water (the
// Fountains of Bellagio), or a name over buildings the area already has (Caesars Palace). The outline of each is OpenStreetMap's, its names are Wikidata's labels and its sizes are published figures, each with where it was
// read; nothing of a brand is drawn, no logo and no lettering on a building. Pure: an area's data in, a plan's shapes, a floor's markup and a 3D view's planes out. The areas carry them in `ContextArea.landmarks`.
import type { Pt } from "./crowd.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { bar, n, plane, type Plane, type Upright, type V3 } from "./turn.kit.ts";
import { hullOf, inside, metresFrom, smallestBox, type LonLat } from "./venues.geo.ts";

/** How a landmark is drawn. */
export type LandmarkShape = "dome" | "wheel" | "fountains" | "named";

export const LANDMARK_SHAPES: readonly LandmarkShape[] = ["dome", "wheel", "fountains", "named"];

/**
 * A landmark of an area, as its data holds it:
 * - `dome`: a sphere cut by the ground (the Sphere), `width` across at its widest and `height` tall; its outline is its footprint, and the building the area has there is the dome's own.
 * - `wheel`: a big wheel standing upright along the long way of its outline (OpenStreetMap maps the High Roller's footprint), `width` across, its top `height` over the ground.
 * - `fountains`: a row of jets along the long way of the water its outline is, reaching up to `height` (the most a published figure says they reach); the water is the area's land cover.
 * - `named`: a name over the buildings inside its outline (they are the area's own, standing at their own heights), at `height`, the top of the tallest.
 */
export interface ContextLandmark {
  key: string;
  /** The Wikidata item its names come from. */
  wikidata: string;
  name: { en: string; ja: string };
  shape: LandmarkShape;
  /** The OpenStreetMap element its outline is, `way/<id>`. */
  source: string;
  /** Its outline, metres east and north of the area's origin. */
  ring: readonly (readonly [number, number])[];
  /** Its height over the ground, in metres. */
  height: number;
  /** A dome's or a wheel's diameter, in metres. */
  width?: number;
  /** A named landmark's tallest building, where its name stands: metres east and north of the area's origin. */
  top?: readonly [number, number];
  /** Where the figures were read, in our own words. */
  read: string;
}

/** A landmark placed in a district's frame: its outline in feet (x to the right, y down the page), its middle, its height and width in feet, and for a wheel or fountains the unit direction its long way runs. */
export interface PlacedLandmark {
  key: string;
  name: { en: string; ja: string };
  shape: LandmarkShape;
  ring: Pt[];
  at: Pt;
  /** Where its name stands: over its middle, or a named landmark's tallest building. */
  label: Pt;
  height: number;
  width?: number;
  along: Pt;
}

const RAD = Math.PI / 180;
const rotate = ([x, y]: Pt, degrees: number): Pt => [x * Math.cos(degrees * RAD) - y * Math.sin(degrees * RAD), x * Math.sin(degrees * RAD) + y * Math.cos(degrees * RAD)];
const middleOf = (ring: readonly Pt[]): Pt => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];

/** The landmarks of some areas placed in a district: turned as the plan is and kept where they stand in the frame (`frame` is the plan's box in feet). */
export function placeLandmarks(areas: readonly { origin: readonly [number, number]; landmarks?: readonly ContextLandmark[] }[], origin: LonLat, turn: number, frame: { x: number; y: number; w: number; h: number }): PlacedLandmark[] {
  const placed: PlacedLandmark[] = [];
  for (const area of areas) {
    const [east, north] = metresFrom(origin, [area.origin as LonLat])[0];
    for (const l of area.landmarks ?? []) {
      const ring = l.ring.map(([e, nn]): Pt => rotate([(e + east) * FEET_PER_METRE, -(nn + north) * FEET_PER_METRE], turn));
      const at = middleOf(ring);
      if (at[0] < frame.x || at[0] > frame.x + frame.w || at[1] < frame.y || at[1] > frame.y + frame.h) continue;
      // The long way of the outline, on the page: `smallestBox` reads east and north, and the page's y runs down.
      const heading = smallestBox(ring.map(([x, y]): Pt => [x, -y])).heading;
      const along: Pt = [Math.sin(heading * RAD), -Math.cos(heading * RAD)];
      const label = l.top === undefined ? at : rotate([(l.top[0] + east) * FEET_PER_METRE, -(l.top[1] + north) * FEET_PER_METRE], turn);
      placed.push({ key: l.key, name: l.name, shape: l.shape, ring, at, label, height: l.height * FEET_PER_METRE, ...(l.width === undefined ? {} : { width: l.width * FEET_PER_METRE }), along });
    }
  }
  return placed;
}

/** Whether a building's outline is a landmark's own (most of it inside a dome's footprint): the dome draws it, and the block is left out. */
export const ownedByLandmark = (landmarks: readonly PlacedLandmark[], ring: readonly Pt[]): boolean =>
  landmarks.some((l) => l.shape === "dome" && (inside(hullOf([...l.ring]), middleOf(ring)) || ring.filter((p) => inside(l.ring, p)).length * 10 >= ring.length * 7));

/** Whether a building stands under a named landmark (its middle inside the landmark's outline): it is raised in the 3D view whatever the count of blocks. */
export const underLandmark = (landmarks: readonly PlacedLandmark[], ring: readonly Pt[]): boolean => landmarks.some((l) => l.shape === "named" && inside(l.ring, middleOf(ring)));

const num = (value: number): string => String(Math.round(value * 10) / 10);

/** The jets of fountains, in feet: where each stands along the long way of the water (from its middle) and how high it reaches, as a share of the most. Ours: the published figure is the most they reach, the row is a pattern. */
export const FOUNTAIN_JETS: readonly (readonly [number, number])[] = [[-0.36, 0.3], [-0.27, 0.48], [-0.18, 0.66], [-0.09, 0.84], [0, 1], [0.09, 0.84], [0.18, 0.66], [0.27, 0.48], [0.36, 0.3]];

/** The extent of an outline along a unit direction from its middle: the least and the most. */
const extent = (ring: readonly Pt[], at: Pt, along: Pt): [number, number] => {
  const t = ring.map((p) => (p[0] - at[0]) * along[0] + (p[1] - at[1]) * along[1]);
  return [Math.min(...t), Math.max(...t)];
};

/** What the floor has of the landmarks: a dome's footprint and a wheel's line on the ground, in the tone of the tallest buildings, and the jets' feet as dots on the water. Empty for none. */
export function landmarksFloor(landmarks: readonly PlacedLandmark[]): string {
  const parts: string[] = [];
  for (const l of landmarks) {
    if (l.shape === "dome") parts.push(`<path class="ky-dist-block ky-dist-b3 ky-dist-landmark" data-landmark="${l.key}" d="M${l.ring.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z"/>`);
    if (l.shape === "wheel") {
      const r = (l.width ?? 0) / 2;
      parts.push(`<path class="ky-dist-ink ky-dist-landmark" data-landmark="${l.key}" stroke-width="${num(Math.max(r * 0.06, 3))}" d="M${num(l.at[0] - l.along[0] * r)} ${num(l.at[1] - l.along[1] * r)}L${num(l.at[0] + l.along[0] * r)} ${num(l.at[1] + l.along[1] * r)}"/>`);
    }
    if (l.shape === "fountains") {
      // The water the jets stand in, as the land cover draws water (an area's lake mapped as the fountains' own outline is not in its land cover).
      parts.push(`<path class="ky-dist-land ky-dist-water" data-landmark="${l.key}" d="M${l.ring.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z"/>`);
      const [t0, t1] = extent(l.ring, l.at, l.along);
      const long = t1 - t0;
      const d = FOUNTAIN_JETS.map(([s]) => `M${num(l.at[0] + l.along[0] * (t0 + long * (0.5 + s)))} ${num(l.at[1] + l.along[1] * (t0 + long * (0.5 + s)))}h0`).join("");
      parts.push(`<path class="ky-dist-jet ky-dist-landmark" data-landmark="${l.key}" stroke-width="${num(Math.max(long * 0.02, 6))}" d="${d}"/>`);
    }
  }
  return parts.length === 0 ? "" : `<g class="ky-dist-landmarks" aria-hidden="true">${parts.join("")}</g>`;
}

/** A plane through three or more points of one flat polygon in 3D, painted with `cls`, and `cull` set so that its face away from `inward` is the one drawn (it is hidden from inside). */
function facet(id: string, points: readonly V3[], cls: string, inward: V3): Plane | undefined {
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a: V3): V3 => {
    const l = Math.hypot(...a);
    return l < 1e-9 ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l];
  };
  const [p0, p1] = points;
  const u = unit(sub(p1, p0));
  const normal = unit(cross(sub(p1, p0), sub(points[points.length - 1], p0)));
  if (Math.hypot(...normal) < 0.5) return undefined;
  const v = unit(cross(normal, u));
  const local = points.map((p): Pt => [dot(sub(p, p0), u), dot(sub(p, p0), v)]);
  const [a0, a1] = [Math.min(...local.map((p) => p[0])), Math.max(...local.map((p) => p[0]))];
  const [b0, b1] = [Math.min(...local.map((p) => p[1])), Math.max(...local.map((p) => p[1]))];
  const o: V3 = [p0[0] + u[0] * a0 + v[0] * b0, p0[1] + u[1] * a0 + v[1] * b0, p0[2] + u[2] * a0 + v[2] * b0];
  const svg = `<polygon class="${cls}" points="${local.map(([a, b]) => `${n(a - a0)},${n(b - b0)}`).join(" ")}"/>`;
  const out = sub(points[0], inward);
  // `u` x `v` is the normal; the face that is drawn is the one the normal points out of.
  return { ...plane(id, "block", o, [u[0] * (a1 - a0), u[1] * (a1 - a0), u[2] * (a1 - a0)], [v[0] * (b1 - b0), v[1] * (b1 - b0), v[2] * (b1 - b0)], svg), cull: dot(normal, out) >= 0 ? 1 : -1 };
}

/** The tone of a facet by the way it faces the light (from up the page, to the left, and above): three tones, as a building's walls have. */
const toneOf = (normal: V3): string => {
  const lit = normal[0] * -0.4 + normal[1] * -0.5 + normal[2] * 0.75;
  return lit > 0.45 ? "u-block-a" : lit > 0 ? "u-block-b" : "u-block-c";
};

/** How finely a dome is cut: sides round it and bands up it. Fewer in the lower tiers. */
export const DOME_CUT = Object.freeze({ high: { sides: 16, bands: 6 }, simple: { sides: 10, bands: 4 } });

/** The planes of a dome: a sphere `width` across whose top is `height` over the ground, cut by the ground, as bands of flat facets, each lit by the way it faces. */
export function domePlanes(prefix: string, at: Pt, height: number, width: number, cut: { sides: number; bands: number }): Plane[] {
  const r = width / 2;
  const zc = height - r;
  const low = Math.asin(Math.max(-1, Math.min(1, -zc / r)));
  const centre: V3 = [at[0], at[1], zc];
  const point = (side: number, band: number): V3 => {
    const lat = low + ((Math.PI / 2 - low) * band) / cut.bands;
    const lon = (2 * Math.PI * side) / cut.sides;
    return [at[0] + r * Math.cos(lat) * Math.cos(lon), at[1] + r * Math.cos(lat) * Math.sin(lon), zc + r * Math.sin(lat)];
  };
  const planes: Plane[] = [];
  for (let band = 0; band < cut.bands; band += 1) {
    for (let side = 0; side < cut.sides; side += 1) {
      const top = band + 1 === cut.bands;
      const pts: V3[] = top ? [point(side, band), point(side + 1, band), point(side, band + 1)] : [point(side, band), point(side + 1, band), point(side + 1, band + 1), point(side, band + 1)];
      const mid: V3 = [pts.reduce((s, p) => s + p[0], 0) / pts.length - centre[0], pts.reduce((s, p) => s + p[1], 0) / pts.length - centre[1], pts.reduce((s, p) => s + p[2], 0) / pts.length - centre[2]];
      const l = Math.hypot(...mid);
      const f = facet(`${prefix}d${band}-${side}`, pts, `u-block ${toneOf([mid[0] / l, mid[1] / l, mid[2] / l])}`, centre);
      if (f !== undefined) planes.push(f);
    }
  }
  return planes;
}

/** How a wheel is drawn: segments round its rim and spokes to its hub. */
export const WHEEL_CUT = Object.freeze({ high: { rim: 24, spokes: 12 }, simple: { rim: 12, spokes: 6 } });

/** The planes of a big wheel standing upright along `along`: its rim, its spokes and the two legs from its hub to the ground, each a thin bar seen from every side. */
export function wheelPlanes(prefix: string, at: Pt, along: Pt, height: number, width: number, cut: { rim: number; spokes: number }): Plane[] {
  const r = width / 2;
  const hub: V3 = [at[0], at[1], height - r];
  const on = (angle: number, radius = r): V3 => [at[0] + along[0] * radius * Math.cos(angle), at[1] + along[1] * radius * Math.cos(angle), hub[2] + radius * Math.sin(angle)];
  const thick = Math.max(width * 0.025, 2);
  const planes: Plane[] = [];
  for (let i = 0; i < cut.rim; i += 1) planes.push(...bar(`${prefix}rim${i}`, "pole", on((2 * Math.PI * i) / cut.rim), on((2 * Math.PI * (i + 1)) / cut.rim), thick, "u-leg"));
  for (let i = 0; i < cut.spokes; i += 1) planes.push(...bar(`${prefix}spoke${i}`, "pole", hub, on((2 * Math.PI * i) / cut.spokes), thick * 0.35, "u-leg"));
  // Two legs, leaning out across the wheel's plane to the ground.
  const across: Pt = [-along[1], along[0]];
  for (const [i, side] of [[0, 1], [1, -1]] as const) planes.push(...bar(`${prefix}leg${i}`, "pole", hub, [at[0] + across[0] * side * r * 0.3, at[1] + across[1] * side * r * 0.3, 0], thick * 1.4, "u-leg"));
  return planes;
}

/** The planes of fountains: a row of jets along the long way of the water, each a thin upright strip reaching to its share of `height`. */
export function fountainPlanes(prefix: string, l: Pick<PlacedLandmark, "ring" | "at" | "along" | "height">): Plane[] {
  const [t0, t1] = extent(l.ring, l.at, l.along);
  const long = t1 - t0;
  const planes: Plane[] = [];
  FOUNTAIN_JETS.forEach(([s, share], i) => {
    const t = t0 + long * (0.5 + s);
    const [x, y] = [l.at[0] + l.along[0] * t, l.at[1] + l.along[1] * t];
    planes.push(...bar(`${prefix}jet${i}`, "pole", [x, y, 0], [x, y, l.height * share], Math.max(long * 0.012, 3), "u-jet"));
  });
  return planes;
}

/** The 3D view's landmarks: each one's shape standing where it is, cut more coarsely in a simple tier. A named landmark has no shape of its own: its buildings are the area's. */
export function landmarkUprights(landmarks: readonly PlacedLandmark[], simple: boolean): Upright[] {
  const items: Upright[] = [];
  for (const l of landmarks) {
    const prefix = `lm-${l.key}-`;
    if (l.shape === "dome" && l.width !== undefined) items.push({ id: `lm-${l.key}`, kind: "blocks", at: l.at, height: l.height, planes: domePlanes(prefix, l.at, l.height, l.width, simple ? DOME_CUT.simple : DOME_CUT.high) });
    if (l.shape === "wheel" && l.width !== undefined) items.push({ id: `lm-${l.key}`, kind: "flags", at: l.at, height: l.height, planes: wheelPlanes(prefix, l.at, l.along, l.height, l.width, simple ? WHEEL_CUT.simple : WHEEL_CUT.high) });
    if (l.shape === "fountains" && !simple) items.push({ id: `lm-${l.key}`, kind: "flags", at: l.at, height: l.height, planes: fountainPlanes(prefix, l) });
  }
  return items;
}
