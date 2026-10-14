// The stands round a surface and the crowd in them (`crowd`): where the seating bowls stand, as data (rings with their outlines, heights and rake, the places that are left
// open for tunnels and benches, the blocks of visitors and of a card display), before any of it is drawn (crowd.draw.ts). Written for this package: each sport has a plain
// profile of the distances a venue of its kind keeps between the surface and its first row and how deep its tiers are; they are conventions for a drawing, not a rulebook's
// figures (no rulebook gives them), except the footprint of the gridiron a soccer pitch can stand inside, which is the field's own.
import { FOOTBALL } from "./geometry.ts";
import type { CrowdOptions, CrowdShape, Side, Sport, SurfaceOptions } from "./types.ts";

export type Pt = [number, number];
export type Box = { x: number; y: number; w: number; h: number };

/** The outline of a part of the stands, in feet in the surface's wide frame: a rectangle with rounded corners, an ellipse, or a polygon. */
export type Outline =
  | { kind: "rrect"; x0: number; y0: number; x1: number; y1: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "poly"; points: Pt[] };

/** A tier of the stands: a band of seats between two outlines. */
export interface StandRing {
  /** `lower`, `upper`, `courtside`, `grandstand` or `bleachers`, with the tier's number where a ring has parts. */
  id: string;
  tier: "courtside" | "lower" | "upper" | "grandstand" | "bleachers";
  /** The band is `region` less `hole` (nothing for a polygon that is the band itself). */
  region: Outline;
  /** Further pieces of the band that are apart from `region` (a ballpark's bleachers either side of the batter's eye). */
  more?: Outline[];
  hole: Outline | null;
  /** How far the band's inner and outer edges are from the edge of the playing surface, in feet, at the sides (the ends' distances are the same plus the venue's end gap less its side gap). */
  from: number;
  to: number;
  /** The height of the first and of the last row above the playing surface, in feet; `rake` is the slope between them in degrees. For a view that raises the stands. */
  height: [number, number];
  rake: number;
  /** The share of its seats that are taken, relative to the stands' (the upper tier is emptier). */
  fill: number;
  /** The seats the band holds, at a seat's 2 by 2.3 feet. */
  seats: number;
}

/** A block of the stands that is not the home fans': the visitors', or a card display. A polygon in the wide frame. */
export interface StandSector {
  ring: string;
  kind: "away" | "tifo-home" | "tifo-away";
  points: Pt[];
}

/** A place left open or built on: a tunnel through the lower stands, a bench, the camera platform of the media side. A box in the wide frame. */
export interface StandGap {
  kind: "tunnel" | "bench" | "media" | "camera";
  box: [x0: number, y0: number, x1: number, y1: number];
}

/** The stands round a surface as data. */
export interface CrowdStands {
  sport: Sport;
  shape: CrowdShape;
  /** The stadium a soccer pitch stands in: `purpose` (its own), `nfl` or `cfl` (a gridiron's), or nothing for another sport. */
  stadium?: "purpose" | "nfl" | "cfl";
  /** The playing surface, in the wide frame. */
  box: Box;
  rings: StandRing[];
  /** Boxes where the stands are left out (the open end of a horseshoe, the ends of two sides). */
  covers: [x0: number, y0: number, x1: number, y1: number][];
  sectors: StandSector[];
  gaps: StandGap[];
  /** A gridiron stadium's field under a soccer pitch: its outline and its two end zones, in the wide frame, so that the gap is seen. */
  footprint?: { field: Box; endZones: [Box, Box] };
  /** The ground the stands need beyond the surface on each side, in feet. */
  reach: { left: number; right: number; top: number; bottom: number };
  /** The seats of all the stands, from the model: what a density is a share of when no capacity is given. */
  seats: number;
}

// ---- The options. ----

/** The crowd options read: every part has its value. */
export interface Crowd {
  shape: CrowdShape | undefined;
  open: "left" | "right";
  stadium: "auto" | "purpose" | "nfl" | "cfl";
  density: number | undefined;
  attendance: number | undefined;
  capacity: number | undefined;
  seed: number;
  home: string | undefined;
  away: string | undefined;
  awayEnd: "auto" | "left" | "right" | "corner" | "none";
  tifo: "home" | "away" | "both" | undefined;
  tifoDesign: "stripes" | "checks";
  gaps: boolean;
  detail: "auto" | "fine" | "plain";
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The crowd the options ask for, or `undefined` for none. */
export function resolveCrowd(value: SurfaceOptions["crowd"]): Crowd | undefined {
  if (value === undefined || value === false) return undefined;
  const o: CrowdOptions = value === true ? {} : value;
  const shapes = ["bowl", "sides", "horseshoe", "grandstand"];
  const awayEnds = ["auto", "left", "right", "corner", "none"];
  return {
    shape: shapes.includes(o.shape as string) ? o.shape : undefined,
    open: o.open === "left" ? "left" : "right",
    stadium: o.stadium === "purpose" || o.stadium === "nfl" || o.stadium === "cfl" ? o.stadium : "auto",
    density: finite(o.density) ? clamp(o.density, 0, 1) : undefined,
    attendance: finite(o.attendance) && o.attendance >= 0 ? o.attendance : undefined,
    capacity: finite(o.capacity) && o.capacity > 0 ? o.capacity : undefined,
    seed: finite(o.seed) ? Math.trunc(o.seed) : 1,
    home: typeof o.home === "string" ? o.home : undefined,
    away: typeof o.away === "string" ? o.away : undefined,
    awayEnd: awayEnds.includes(o.awayEnd as string) ? (o.awayEnd as Crowd["awayEnd"]) : "auto",
    tifo: o.tifo === true ? "home" : o.tifo === "home" || o.tifo === "away" || o.tifo === "both" ? o.tifo : undefined,
    tifoDesign: o.tifoDesign === "checks" ? "checks" : "stripes",
    gaps: o.gaps !== false,
    detail: o.detail === "fine" || o.detail === "plain" ? o.detail : "auto",
  };
}

/** How full the stands are: a density, else attendance over capacity (the ground's, else the model's seats), else 0.85. */
export function densityOf(crowd: Crowd, seats: number, groundCapacity: number | undefined): number {
  if (crowd.density !== undefined) return crowd.density;
  if (crowd.attendance !== undefined) return clamp(crowd.attendance / (crowd.capacity ?? groundCapacity ?? seats), 0, 1);
  return 0.85;
}

/** A small, fast generator (mulberry32): the same seed gives the same numbers on every machine. */
export function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- The profiles. ----

interface Tier {
  id: "courtside" | "lower" | "upper";
  from: number;
  to: number;
  height: [number, number];
  fill: number;
}

/** A kind of venue: how far its first row is from the surface along a side and at an end, the extra on the bench side, the corner's radius, its tiers and its usual shape. */
interface Profile {
  shape: CrowdShape;
  side: number;
  end: number;
  /** More ground on the bottom side, where the benches and the cameras are. */
  bench: number;
  corner: number;
  tiers: readonly Tier[];
  oval?: boolean;
  /** Where the visitors sit by default. */
  away: "end" | "corner";
}

const lower = (to: number, h0 = 5, h1 = 45): Tier => ({ id: "lower", from: 0, to, height: [h0, h1], fill: 1 });
const upper = (from: number, to: number, h0 = 62, h1 = 118): Tier => ({ id: "upper", from, to, height: [h0, h1], fill: 0.88 });
const courtside = (to = 7): Tier => ({ id: "courtside", from: 0, to, height: [1, 4], fill: 1 });

/** The venues, by sport, in feet. */
const PROFILES: Readonly<Record<Sport, Profile>> = {
  nfl: { shape: "bowl", side: 40, end: 26, bench: 0, corner: 60, tiers: [lower(85), upper(99, 172)], away: "end" },
  cfl: { shape: "bowl", side: 42, end: 28, bench: 0, corner: 60, tiers: [lower(85), upper(99, 172)], away: "end" },
  ifaf: { shape: "bowl", side: 40, end: 26, bench: 0, corner: 55, tiers: [lower(75), upper(88, 150)], away: "end" },
  soccer: { shape: "bowl", side: 28, end: 34, bench: 8, corner: 45, tiers: [lower(75), upper(88, 150)], away: "end" },
  nhl: { shape: "bowl", side: 8, end: 8, bench: 6, corner: 40, tiers: [lower(58, 3, 28), upper(68, 124, 38, 74)], away: "corner" },
  nba: { shape: "bowl", side: 5, end: 10, bench: 9, corner: 30, tiers: [courtside(7), { id: "lower", from: 13, to: 70, height: [3, 32], fill: 1 }, upper(82, 136, 42, 80)], away: "corner" },
  mlb: { shape: "horseshoe", side: 0, end: 0, bench: 0, corner: 0, tiers: [], away: "corner" },
  curling: { shape: "sides", side: 14, end: 10, bench: 0, corner: 6, tiers: [lower(30, 2, 12)], away: "corner" },
  tennis: { shape: "bowl", side: 22, end: 32, bench: 4, corner: 24, tiers: [lower(44, 3, 24), upper(54, 98, 32, 62)], away: "corner" },
  volleyball: { shape: "bowl", side: 20, end: 24, bench: 4, corner: 22, tiers: [lower(40, 3, 22), upper(50, 90, 30, 58)], away: "corner" },
  badminton: { shape: "bowl", side: 16, end: 22, bench: 4, corner: 20, tiers: [lower(40, 3, 22), upper(50, 90, 30, 58)], away: "corner" },
  pickleball: { shape: "sides", side: 18, end: 16, bench: 0, corner: 8, tiers: [lower(32, 2, 12)], away: "corner" },
  tabletennis: { shape: "bowl", side: 16, end: 16, bench: 2, corner: 14, tiers: [lower(34, 2, 16), upper(42, 74, 22, 40)], away: "corner" },
  lacrosse: { shape: "bowl", side: 24, end: 30, bench: 6, corner: 40, tiers: [lower(70), upper(82, 130, 58, 100)], away: "end" },
  rugby: { shape: "bowl", side: 26, end: 36, bench: 6, corner: 48, tiers: [lower(78), upper(90, 150)], away: "end" },
  afl: { shape: "bowl", side: 30, end: 30, bench: 0, corner: 0, tiers: [lower(70), upper(82, 140)], oval: true, away: "end" },
  gaelic: { shape: "bowl", side: 34, end: 40, bench: 6, corner: 50, tiers: [lower(80), upper(92, 156)], away: "end" },
  cricket: { shape: "bowl", side: 30, end: 30, bench: 0, corner: 0, tiers: [lower(66), upper(78, 130)], oval: true, away: "end" },
  fieldhockey: { shape: "bowl", side: 20, end: 26, bench: 5, corner: 30, tiers: [lower(46, 3, 24), upper(56, 90, 32, 54)], away: "end" },
  handball: { shape: "bowl", side: 14, end: 18, bench: 4, corner: 16, tiers: [courtside(6), { id: "lower", from: 10, to: 46, height: [3, 22], fill: 1 }, upper(56, 100, 30, 56)], away: "corner" },
};

/** The grounds of the package that are the home of an NFL or a CFL club, where a soccer pitch stands inside a gridiron's stands. From each ground's article. */
export const GRIDIRON_GROUNDS: Readonly<Record<string, "nfl" | "cfl">> = Object.freeze({
  "metlife-stadium": "nfl",
  "att-stadium": "nfl",
  "arrowhead-stadium": "nfl",
  "nrg-stadium": "nfl",
  "mercedes-benz-stadium": "nfl",
  "hard-rock-stadium": "nfl",
  "sofi-stadium": "nfl",
  "levis-stadium": "nfl",
  "lumen-field": "nfl",
  "gillette-stadium": "nfl",
  "lincoln-financial-field": "nfl",
  "rose-bowl": "nfl",
  "bc-place": "cfl",
});

/** A gridiron's field, with its end zones, in feet, from the rulebook figures of the package: the NFL's 360 by 160, the CFL's 450 by 195. */
function gridiron(kind: "nfl" | "cfl"): { length: number; width: number; endZone: number } {
  const f = FOOTBALL[kind];
  return { length: f.length + 2 * f.endZone, width: f.width, endZone: f.endZone };
}

// ---- Outlines. ----

const sq = (v: number): number => v * v;

/** The point of an outline hit by a ray from `(cx, cy)` at angle `a` (screen angle, y down). */
export function rayAt(o: Outline, cx: number, cy: number, a: number): Pt {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  if (o.kind === "ellipse") {
    const t = 1 / Math.sqrt(sq(dx / o.rx) + sq(dy / o.ry));
    return [cx + dx * t, cy + dy * t];
  }
  if (o.kind === "poly") return o.points[0];
  const w = (o.x1 - o.x0) / 2;
  const h = (o.y1 - o.y0) / 2;
  const mx = (o.x0 + o.x1) / 2;
  const my = (o.y0 + o.y1) / 2;
  // The ray from the middle of the rectangle, to the sides, and the corner circle where it lands in one.
  const t = Math.min(Math.abs(dx) < 1e-9 ? Infinity : w / Math.abs(dx), Math.abs(dy) < 1e-9 ? Infinity : h / Math.abs(dy));
  let px = cx + dx * t;
  let py = cy + dy * t;
  const r = Math.min(o.r, w, h);
  const kx = Math.abs(px - mx) - (w - r);
  const ky = Math.abs(py - my) - (h - r);
  if (r > 0 && kx > 0 && ky > 0) {
    // Solve |(c + d t) - corner centre| = r for the larger t.
    const ccx = mx + Math.sign(px - mx) * (w - r);
    const ccy = my + Math.sign(py - my) * (h - r);
    const fx = cx - ccx;
    const fy = cy - ccy;
    const b = fx * dx + fy * dy;
    const c = fx * fx + fy * fy - r * r;
    const t2 = -b + Math.sqrt(Math.max(0, b * b - c));
    px = cx + dx * t2;
    py = cy + dy * t2;
  }
  return [px, py];
}

const n1 = (v: number): string => {
  const t = (Math.round(v * 10) / 10).toString();
  return t === "-0" ? "0" : t;
};

/** An outline as a path, drawn clockwise, or counter-clockwise when `reverse` (a hole in a band that is filled with the non-zero rule). */
export function outlinePath(o: Outline, reverse = false): string {
  if (o.kind === "poly") {
    const pts = reverse ? [...o.points].reverse() : o.points;
    return `M${pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L")}Z`;
  }
  if (o.kind === "ellipse") {
    const sweep = reverse ? 0 : 1;
    return `M${n1(o.cx + o.rx)} ${n1(o.cy)}A${n1(o.rx)} ${n1(o.ry)} 0 1 ${sweep} ${n1(o.cx - o.rx)} ${n1(o.cy)}A${n1(o.rx)} ${n1(o.ry)} 0 1 ${sweep} ${n1(o.cx + o.rx)} ${n1(o.cy)}Z`;
  }
  const r = Math.min(o.r, (o.x1 - o.x0) / 2, (o.y1 - o.y0) / 2);
  const { x0, y0, x1, y1 } = o;
  const a = (x: number, y: number, s: number): string => (r > 0 ? `A${n1(r)} ${n1(r)} 0 0 ${s} ${n1(x)} ${n1(y)}` : "");
  if (!reverse) return `M${n1(x0 + r)} ${n1(y0)}H${n1(x1 - r)}${a(x1, y0 + r, 1)}V${n1(y1 - r)}${a(x1 - r, y1, 1)}H${n1(x0 + r)}${a(x0, y1 - r, 1)}V${n1(y0 + r)}${a(x0 + r, y0, 1)}Z`;
  return `M${n1(x0 + r)} ${n1(y0)}${a(x0, y0 + r, 0)}V${n1(y1 - r)}${a(x0 + r, y1, 0)}H${n1(x1 - r)}${a(x1, y1 - r, 0)}V${n1(y0 + r)}${a(x1 - r, y0, 0)}Z`;
}

/** An outline as points, for a view that raises the stands: arcs are cut into steps of about 7.5 degrees. */
export function outlinePoints(o: Outline): Pt[] {
  if (o.kind === "poly") return o.points.map(([x, y]) => [x, y]);
  const out: Pt[] = [];
  if (o.kind === "ellipse") {
    for (let i = 0; i < 48; i += 1) out.push([o.cx + o.rx * Math.cos((i * Math.PI) / 24), o.cy + o.ry * Math.sin((i * Math.PI) / 24)]);
    return out;
  }
  const r = Math.min(o.r, (o.x1 - o.x0) / 2, (o.y1 - o.y0) / 2);
  const corners: [number, number, number][] = [
    [o.x1 - r, o.y0 + r, -90],
    [o.x1 - r, o.y1 - r, 0],
    [o.x0 + r, o.y1 - r, 90],
    [o.x0 + r, o.y0 + r, 180],
  ];
  for (const [cx, cy, a0] of corners) {
    const steps = r > 0 ? 12 : 1;
    for (let i = 0; i <= steps; i += 1) {
      const a = ((a0 + (i * 90) / steps) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return out;
}

const area = (o: Outline): number => {
  if (o.kind === "ellipse") return Math.PI * o.rx * o.ry;
  if (o.kind === "rrect") {
    const r = Math.min(o.r, (o.x1 - o.x0) / 2, (o.y1 - o.y0) / 2);
    return (o.x1 - o.x0) * (o.y1 - o.y0) - (4 - Math.PI) * r * r;
  }
  let s = 0;
  o.points.forEach(([x, y], i) => {
    const [x2, y2] = o.points[(i + 1) % o.points.length];
    s += x * y2 - x2 * y;
  });
  return Math.abs(s) / 2;
};

/** The seats of a band of the stands: its area at a seat's 2 by 2.3 feet. */
export const seatsIn = (region: Outline, hole: Outline | null): number => Math.round((area(region) - (hole === null ? 0 : area(hole))) / 4.6);

// ---- The layout round a rectangle or an oval. ----

/** What the layout needs of the options and the surface. */
export interface LayoutInput {
  sport: Sport;
  /** The playing surface in the wide frame. */
  box: Box;
  crowd: Crowd;
  /** The side the visitors sit towards (the opposite of the home team's). */
  awaySide: Side;
  /** A ground's key, for the stadium a soccer pitch stands in. */
  ground?: string;
  /** The ballpark's fence as points on the field, for a ballpark (see `parkLayout`). */
  fence?: readonly Pt[];
  /** The foul lines' length at the poles and the backstop's distance, for a ballpark. */
  backstop?: number;
}


/** The offsets of the first row from the surface's edge at each side, for the venue the sport has (and a gridiron's footprint for a soccer pitch in one). */
function offsets(p: Profile, box: Box, stadium: "purpose" | "nfl" | "cfl"): { left: number; right: number; top: number; bottom: number } {
  if (stadium === "purpose") return { left: p.end, right: p.end, top: p.side, bottom: p.side + p.bench };
  // A gridiron stadium keeps a football field's footprint, with the stands where a football field's stands are: the pitch stands inside it, in the middle.
  const g = PROFILES[stadium];
  const f = gridiron(stadium);
  const end = g.end + (f.length - box.w) / 2;
  const side = g.side + (f.width - box.h) / 2;
  return { left: end, right: end, top: side, bottom: side + g.bench };
}

/** The layout of a sport's stands round its surface: rings, covers, sectors and gaps. For a ballpark see `parkLayout`. */
export function layoutOf(input: LayoutInput): CrowdStands {
  const { sport, box, crowd } = input;
  const base = PROFILES[sport];
  const host = sport === "soccer" ? (crowd.stadium === "nfl" || crowd.stadium === "cfl" ? crowd.stadium : crowd.stadium === "auto" && input.ground !== undefined ? GRIDIRON_GROUNDS[input.ground] : undefined) : undefined;
  const stadium: "purpose" | "nfl" | "cfl" | undefined = sport === "soccer" ? host ?? "purpose" : undefined;
  const p = stadium === "nfl" || stadium === "cfl" ? { ...PROFILES[stadium], shape: base.shape, away: base.away } : base;
  const shape = crowd.shape ?? p.shape;
  const off = offsets(base, box, stadium ?? "purpose");
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const rings: StandRing[] = [];
  const reachOf = { left: 0, right: 0, top: 0, bottom: 0 };
  for (const t of p.tiers) {
    const at = (k: number): Outline => {
      if (base.oval === true) return { kind: "ellipse", cx, cy, rx: box.w / 2 + (off.left + off.right) / 2 + k, ry: box.h / 2 + (off.top + off.bottom) / 2 + k };
      return { kind: "rrect", x0: box.x - off.left - k, y0: box.y - off.top - k, x1: box.x + box.w + off.right + k, y1: box.y + box.h + off.bottom + k, r: p.corner + k };
    };
    const region = at(t.to);
    const hole = at(t.from);
    const rise = t.height[1] - t.height[0];
    rings.push({
      id: t.id,
      tier: t.id,
      region,
      hole,
      from: t.from,
      to: t.to,
      height: [t.height[0], t.height[1]],
      rake: Math.round((Math.atan2(rise, Math.max(1, t.to - t.from)) * 180) / Math.PI * 10) / 10,
      fill: t.fill,
      seats: seatsIn(region, hole),
    });
    reachOf.left = Math.max(reachOf.left, off.left + t.to);
    reachOf.right = Math.max(reachOf.right, off.right + t.to);
    reachOf.top = Math.max(reachOf.top, off.top + t.to);
    reachOf.bottom = Math.max(reachOf.bottom, off.bottom + t.to);
  }
  const last = rings[rings.length - 1];
  const covers: CrowdStands["covers"] = [];
  const x0 = box.x - off.left;
  const x1 = box.x + box.w + off.right;
  const yTop = last === undefined ? box.y : box.y - reachOf.top - 4;
  const yBot = last === undefined ? box.y + box.h : box.y + box.h + reachOf.bottom + 4;
  if (shape === "horseshoe") {
    // The open end: everything beyond the surface's end line and the gap that is kept clear.
    if (crowd.open === "left") covers.push([box.x - reachOf.left - 4, yTop, x0 + p.corner * 0.5, yBot]);
    else covers.push([x1 - p.corner * 0.5, yTop, box.x + box.w + reachOf.right + 4, yBot]);
  } else if (shape === "sides") {
    covers.push([box.x - reachOf.left - 4, yTop, x0 + p.corner * 0.5, yBot], [x1 - p.corner * 0.5, yTop, box.x + box.w + reachOf.right + 4, yBot]);
  }
  const stands: CrowdStands = { sport, shape, box, rings, covers, sectors: [], gaps: [], reach: reachOf, seats: rings.reduce((n, r) => n + r.seats, 0) };
  if (stadium !== undefined) stands.stadium = stadium;
  if (stadium === "nfl" || stadium === "cfl") {
    const f = gridiron(stadium);
    const field: Box = { x: cx - f.length / 2, y: cy - f.width / 2, w: f.length, h: f.width };
    stands.footprint = { field, endZones: [{ x: field.x, y: field.y, w: f.endZone, h: f.width }, { x: field.x + f.length - f.endZone, y: field.y, w: f.endZone, h: f.width }] };
  }
  if (shape === "sides" && last !== undefined) {
    // Two sides: nothing beyond the ends.
    reachOf.left = Math.min(reachOf.left, off.left + 4);
    reachOf.right = Math.min(reachOf.right, off.right + 4);
  }
  // The visitors, a card display, and the places left open.
  const lowerRing = rings.find((r) => r.tier === "lower") ?? rings[0];
  if (lowerRing !== undefined) {
    const corner = Math.atan2(box.h / 2 + off.top + lowerRing.to / 2, box.w / 2 + off.left + lowerRing.to / 2);
    const sectorOf = (ring: StandRing, from: number, to: number): Pt[] => {
      const outer: Pt[] = [];
      const inner: Pt[] = [];
      const steps = 8;
      for (let i = 0; i <= steps; i += 1) {
        const a = from + ((to - from) * i) / steps;
        outer.push(rayAt(ring.region, cx, cy, a));
        inner.push(rayAt(ring.hole ?? ring.region, cx, cy, a));
      }
      return [...outer, ...inner.reverse()];
    };
    const open = (a: number): boolean => !covers.some(([bx0, by0, bx1, by1]) => {
      const [px, py] = rayAt(lowerRing.region, cx, cy, a);
      return px >= bx0 && px <= bx1 && py >= by0 && py <= by1;
    });
    const side = crowd.awayEnd === "left" || crowd.awayEnd === "right" ? crowd.awayEnd : input.awaySide;
    const sign = side === "right" ? 1 : -1;
    const centreA = side === "right" ? 0 : Math.PI;
    const mode = crowd.awayEnd === "auto" ? (p.away === "end" ? "end" : "corner") : crowd.awayEnd === "corner" ? "corner" : "end";
    const place = (kind: StandSector["kind"], a0: number, a1: number): void => {
      const mid = (a0 + a1) / 2;
      if (!open(mid) || !open(a0) || !open(a1)) return;
      for (const ring of rings.filter((r) => r.tier === "lower" || r.tier === "upper")) stands.sectors.push({ ring: ring.id, kind, points: sectorOf(ring, a0, a1) });
    };
    if (crowd.awayEnd !== "none") {
      if (mode === "end") {
        // The middle part of an end, both tiers.
        place("away", centreA - corner * 0.5, centreA + corner * 0.5);
      } else {
        // A block in the corner on the far side from the benches: along the side a little, and round the corner a little.
        const cornerA = sign > 0 ? -corner : corner - Math.PI;
        place("away", sign > 0 ? cornerA - 0.3 : cornerA - 0.12, sign > 0 ? cornerA + 0.12 : cornerA + 0.3);
      }
    }
    if (crowd.tifo !== undefined) {
      const mk = (team: "home" | "away"): void => {
        const homeSideIsLeft = input.awaySide === "right";
        const a = (team === "home") === homeSideIsLeft ? Math.PI : 0;
        const half = corner * 0.42;
        if (open(a)) stands.sectors.push({ ring: lowerRing.id, kind: team === "home" ? "tifo-home" : "tifo-away", points: sectorOf(lowerRing, a - half, a + half) });
      };
      if (crowd.tifo === "home" || crowd.tifo === "both") mk("home");
      if (crowd.tifo === "away" || crowd.tifo === "both") mk("away");
    }
    if (crowd.gaps && shape !== "grandstand") {
      const bottom = box.y + box.h;
      const mid = box.x + box.w / 2;
      // A tunnel through the lower stands at the middle of the bench side, the camera platform above them, and the benches in the gap.
      stands.gaps.push({ kind: "tunnel", box: [mid - 6, bottom + off.bottom - 1, mid + 6, bottom + off.bottom + lowerRing.to + 1] });
      const media = rings[rings.length - 1];
      if (media !== undefined && media.tier === "upper") stands.gaps.push({ kind: "camera", box: [mid - 22, bottom + off.bottom + media.from + 3, mid + 22, bottom + off.bottom + media.from + 13] });
      if (off.bottom - off.top >= 4 || sport === "soccer" || sport === "nfl" || sport === "cfl" || sport === "ifaf" || sport === "rugby" || sport === "gaelic") {
        const benchLen = Math.min(34, box.w * 0.12);
        for (const s of [-1, 1]) {
          const bx = mid + s * (box.w * 0.1 + benchLen / 2 + 4);
          stands.gaps.push({ kind: "bench", box: [bx - benchLen / 2, bottom + 2.5, bx + benchLen / 2, bottom + 2.5 + Math.min(5, off.bottom * 0.3)] });
        }
      }
      stands.gaps.push({ kind: "media", box: [mid - 55, bottom + off.bottom + 2, mid + 55, bottom + off.bottom + 6] });
    }
  }
  return stands;
}
