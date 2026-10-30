// The stands round a surface and the crowd in them (`crowd`): where the seating bowls stand, as data (rings with their outlines, heights and rake, the places that are left
// open for tunnels and benches, the blocks of visitors and of a card display), before any of it is drawn (crowd.draw.ts). Written for this package: each sport has a plain
// profile of the distances a venue of its kind keeps between the surface and its first row and how deep its tiers are; they are conventions for a drawing, not a rulebook's
// figures (no rulebook gives them), except the footprint of the gridiron a soccer pitch can stand inside, which is the field's own.
import { FOOTBALL } from "./geometry.ts";
import type { CrowdOptions, CrowdShape, LedBoardOptions, LightingOptions, Side, Sport, SurfaceOptions } from "./types.ts";

export type Pt = [number, number];
export type Box = { x: number; y: number; w: number; h: number };

/** The outline of a part of the stands, in feet in the surface's wide frame: a rectangle with rounded corners, an ellipse, or a polygon. */
export type Outline =
  | { kind: "rrect"; x0: number; y0: number; x1: number; y1: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "poly"; points: Pt[] };

/** A tier of the stands: a band of seats between two outlines. */
export interface StandRing {
  /** `lower`, `middle`, `upper`, `courtside`, `grandstand` or `bleachers`, with the tier's number where a ring has parts. */
  id: string;
  tier: "courtside" | "gallery" | "lower" | "middle" | "upper" | "grandstand" | "bleachers" | "wall";
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
  /** A hall's gallery: the rows of seats the band holds. */
  rows?: number;
  /** The seats the band holds, at a seat's 2 by 2.3 feet. */
  seats: number;
  /** The aisles and vomitories across the band, each from a point on its inner edge to its outer: across the sides, fanning round the corners. */
  aisles: [Pt, Pt][];
  /** The band is closed in this configuration (a real stadium's seats a configuration does not open): drawn as empty seats, with no people, in the same place every time. */
  closed?: boolean;
}

/** A block of the stands that is not the home fans': the visitors', or a card display. A polygon in the wide frame. */
export interface StandSector {
  ring: string;
  kind: "away" | "tifo-home" | "tifo-away" | "closed";
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
  /** The walks between the tiers: a band between one tier's outer edge and the next one's inner. */
  concourses: { region: Outline; hole: Outline | null }[];
  /** A gridiron stadium's field under a soccer pitch: its outline and its two end zones, in the wide frame, so that the gap is seen. */
  footprint?: { field: Box; endZones: [Box, Box] };
  /** The ground the stands need beyond the surface on each side, in feet. */
  reach: { left: number; right: number; top: number; bottom: number };
  /** The seats of all the stands, from the model: what a density is a share of when no capacity is given. */
  seats: number;
  /** The stands are a hall's gallery (a dojo's balcony): a thin band close to the walls, plain seats, a few neutral people and no sides. */
  gallery?: boolean;
  /** The stands are a real venue's (see `src/venues.ts`): the outline of its building, the way north lies on the page and the roof. */
  real?: RealShell;
  /**
   * A real stadium of more than one configuration is laid out in its own frame, the venue's, with the middle of its field at the origin whichever field it is: `shift` is where that middle is in the drawing's own
   * frame (the surface's), so that what belongs to the field is drawn there and the building, the bowl and the crowd are the same numbers for every configuration.
   */
  shift?: [number, number];
}

/** The room above a real venue's building that the arrow saying where north is takes, in feet, and how far above the building's box the middle of the arrow stands. */
export const NORTH_ROOM = 60;
export const NORTH_AT = 32;

/** What a real venue adds to the stands round a surface: the building they stand in, in feet in the wide frame, and the roof over them. */
export interface RealShell {
  /** The outline of the building, a polygon (OpenStreetMap's, turned so that the rink lies along x). */
  footprint: Pt[];
  /** The hall the stands are in: the bowl's outer wall, a rounded rectangle inside the building, and what the 3D view raises walls and a roof on (the building's annexes, which the outline has, are left as ground). */
  hall: Extract<Outline, { kind: "rrect" }>;
  /** The way north points on the page, in degrees clockwise from the top; absent where the rink's real orientation is not known. */
  north?: number;
  /**
   * `fixed` is a lid; `saddle` a roof that rises at the two ends and falls at the two sides; `barrel` a barrel vault, a round arch along the surface that stands highest over its middle line and falls to the walls at the two sides; `cable` a cable-supported roof with an opening over the surface, which a retractable fabric closes (BC Place's);
   * `canopy` roofs over some of the stands and leaves the field open (Lumen Field's, `canopies`); `panels` a retractable roof of sections over a ballpark's field and stands, far above its walls (T-Mobile Park's, `panels`);
   * `dome` an air-supported roof, a membrane that rises from the rim of the walls to a crown over the middle of the field (Tokyo Dome's, `dome`); `open` no roof: the walls only (Koshien Stadium's).
   */
  roof: "fixed" | "saddle" | "barrel" | "cable" | "canopy" | "panels" | "dome" | "open";
  /** The height of the walls, in feet, where it is not the roof's rim (a ballpark's walls stand far below its roof). */
  wall?: number;
  /** A `canopy` roof's pieces: the outline of each in the drawing's frame, the height of its low edge (over the field's side) and how far it rises to its high edge (over the back of the stands), in feet. */
  canopies?: { ring: Pt[]; low: number; rise: number; shape?: string }[];
  /** A `panels` roof: the outline it covers when closed, its bottom and its top above the field in feet (rim and crown), and where its sections rest when it is open. */
  panels?: { cover: Pt[]; bottom: number; top: number; parked: Pt[] };
  /** A `dome` roof: the outline of its rim in the drawing's frame, and the heights of the rim (`low`) and of the crown above the surface, in feet. It is held up by the air inside, so it is a smooth lens, with no struts. */
  dome?: { rim: Pt[]; low: number; crown: number };
  /** Draw the walls as brick (a ballpark's facade, T-Mobile Park's: from the brief; a plain drawing choice, a wall in a brick tone, no courses). */
  brick?: boolean;
  /** Draw the walls as ivy-covered (a plain drawing choice: the wall in green). */
  ivy?: boolean;
  /** A `cable` roof: how far its crown (the edge of the opening) stands over its rim, in feet, and the opening, a polygon in the drawing's frame over the surface. */
  crown?: { rise: number; opening: Pt[] };
  /** The height of the building's podium, a lower band of its walls under the concourse levels, in feet; the walls are drawn in two bands where a venue has one (ours where the sources do not say). */
  podium?: number;
  /** A `fixed` roof closed in the middle by a cap with a long skylight along the surface's long side (Rogers Arena's): ours, from the brief. */
  skylight?: boolean;
  /** A `cable` roof's masts round its rim: how many, and how high they rise over the rim, in feet. */
  masts?: { count: number; height: number };
  /**
   * A tower that leans over the building (the Olympic Stadium's Montreal Tower): the middle of its base and of its top in the drawing's frame, the height of its top above the surface in feet, and the width of its shaft at the
   * base and at the top in feet (a plain tapering square shaft: its width is ours).
   */
  tower?: { base: Pt; top: Pt; height: number; width: [number, number] };
  /** The height of the roof's lowest edge above the surface, in feet. */
  edge: number;
  /** Towers that stand apart from the bowl (Lumen Field's, at the open end), each a box on its outline in the drawing's frame, `height` feet high; `face` is the unit direction its scoreboard looks, towards the field. */
  towers?: { ring: Pt[]; height: number; face: Pt }[];
}

/** The stands of a real venue, worked out from its building (`venueBowl`): what `layoutOf` takes in place of a sport's usual tiers. */
export interface RealBowl {
  rings: StandRing[];
  /** Blocks of a band a configuration closes (its seats beyond the configuration's own): drawn over the band as empty seats, in the same place every time. */
  closedSectors?: StandSector[];
  /** How far the first row stands from the surface's edge at each side, in feet (the bench side has more). */
  off: { left: number; right: number; top: number; bottom: number };
  /** The ground the venue needs beyond the surface on each side, in feet: the building's, and room for the arrow that says where north is. */
  reach: { left: number; right: number; top: number; bottom: number };
  shell: RealShell;
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
  roof: boolean;
  wallSeats: boolean | undefined;
  /** The stands of the arena's real venue, where the package has one for the `arena` asked for. */
  real: boolean;
  /** Whether the seats are drawn (a real venue's building is, without them, when this is false). */
  stands: boolean;
  detail: "auto" | "fine" | "plain";
  /** The LED boards as asked (`resolveBoards` reads them), or `undefined` for none. */
  boards: boolean | LedBoardOptions | undefined;
  /** The lighting as asked (`resolveLighting` reads it), or `undefined`. */
  lighting: LightingOptions | undefined;
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
    roof: o.roof !== false,
    wallSeats: typeof o.wallSeats === "boolean" ? o.wallSeats : undefined,
    real: o.real === true,
    stands: o.stands !== false,
    detail: o.detail === "fine" || o.detail === "plain" ? o.detail : "auto",
    boards: o.boards === true || (typeof o.boards === "object" && o.boards !== null) ? o.boards : undefined,
    lighting: o.lighting,
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
  id: "courtside" | "lower" | "upper" | "gallery";
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
  /** The distances when the surface lies on an arena floor that already fills most of the hall (the Nippon Budokan's octagon): the stands close in and the corners are cut. */
  arena?: { side: number; end: number; bench: number; corner: number; tiers?: readonly Tier[] };
}

const lower = (to: number, h0 = 5, h1 = 45): Tier => ({ id: "lower", from: 0, to, height: [h0, h1], fill: 1 });
const upper = (from: number, to: number, h0 = 62, h1 = 118): Tier => ({ id: "upper", from, to, height: [h0, h1], fill: 0.88 });
const courtside = (to = 7): Tier => ({ id: "courtside", from: 0, to, height: [1, 4], fill: 1 });

/** The venues, by sport, in feet. */
const PROFILES: Readonly<Record<Sport, Profile>> = {
  nfl: { shape: "bowl", side: 40, end: 26, bench: 0, corner: 60, tiers: [lower(85), upper(92, 165)], away: "end" },
  cfl: { shape: "bowl", side: 42, end: 28, bench: 0, corner: 60, tiers: [lower(85), upper(92, 165)], away: "end" },
  ifaf: { shape: "bowl", side: 40, end: 26, bench: 0, corner: 55, tiers: [lower(75), upper(82, 144)], away: "end" },
  soccer: { shape: "bowl", side: 19.7, end: 27.9, bench: 8, corner: 40, tiers: [lower(75), upper(82, 144)], away: "end" },
  nhl: { shape: "bowl", side: 8, end: 8, bench: 6, corner: 40, tiers: [lower(58, 3, 28), upper(65, 121, 38, 74)], away: "corner" },
  nba: { shape: "bowl", side: 5, end: 10, bench: 9, corner: 30, tiers: [courtside(7), { id: "lower", from: 13, to: 70, height: [3, 32], fill: 1 }, upper(77, 131, 42, 80)], away: "corner" },
  mlb: { shape: "horseshoe", side: 0, end: 0, bench: 0, corner: 0, tiers: [], away: "corner" },
  curling: { shape: "sides", side: 14, end: 10, bench: 0, corner: 6, tiers: [lower(30, 2, 12)], away: "corner" },
  tennis: { shape: "bowl", side: 22, end: 32, bench: 4, corner: 24, tiers: [lower(44, 3, 24), upper(51, 95, 32, 62)], away: "corner" },
  volleyball: { shape: "bowl", side: 20, end: 24, bench: 4, corner: 22, tiers: [lower(40, 3, 22), upper(47, 87, 30, 58)], away: "corner" },
  badminton: { shape: "bowl", side: 16, end: 22, bench: 4, corner: 20, tiers: [lower(40, 3, 22), upper(47, 87, 30, 58)], away: "corner" },
  pickleball: { shape: "sides", side: 18, end: 16, bench: 0, corner: 8, tiers: [lower(32, 2, 12)], away: "corner" },
  tabletennis: { shape: "bowl", side: 16, end: 16, bench: 2, corner: 14, tiers: [lower(34, 2, 16), upper(41, 73, 22, 40)], away: "corner" },
  // The court sports after those: indoor halls and show courts, ours (no rulebook gives the stands), the size of the stands following the size of the court.
  padel: { shape: "bowl", side: 20, end: 22, bench: 4, corner: 20, tiers: [lower(40, 3, 22), upper(47, 87, 30, 58)], away: "corner" },
  squash: { shape: "sides", side: 12, end: 10, bench: 0, corner: 8, tiers: [lower(26, 2, 12), upper(32, 56, 18, 32)], away: "corner" },
  racquetball: { shape: "sides", side: 12, end: 10, bench: 0, corner: 8, tiers: [lower(26, 2, 12), upper(32, 56, 18, 32)], away: "corner" },
  sepaktakraw: { shape: "bowl", side: 18, end: 22, bench: 4, corner: 20, tiers: [lower(40, 3, 22), upper(47, 87, 30, 58)], away: "corner" },
  teqball: { shape: "bowl", side: 18, end: 20, bench: 3, corner: 18, tiers: [lower(38, 3, 20), upper(45, 79, 28, 52)], away: "corner" },
  roundnet: { shape: "sides", side: 16, end: 12, bench: 0, corner: 8, tiers: [lower(26, 2, 12), upper(32, 56, 18, 32)], away: "corner" },
  netball: { shape: "bowl", side: 20, end: 22, bench: 4, corner: 20, tiers: [lower(44, 3, 24), upper(51, 95, 32, 62)], away: "corner" },
  // The pools: a natatorium has its stands along the long sides, a deck's width back from the water (ours: no rulebook gives the stands).
  swimming: { shape: "sides", side: 26, end: 20, bench: 0, corner: 10, tiers: [lower(40, 3, 20), upper(47, 87, 28, 52)], away: "corner" },
  waterpolo: { shape: "sides", side: 22, end: 18, bench: 0, corner: 10, tiers: [lower(36, 3, 18), upper(43, 79, 26, 48)], away: "corner" },
  diving: { shape: "sides", side: 26, end: 20, bench: 0, corner: 10, tiers: [lower(40, 3, 20), upper(47, 87, 28, 52)], away: "corner" },
  artisticswimming: { shape: "sides", side: 26, end: 20, bench: 0, corner: 10, tiers: [lower(40, 3, 20), upper(47, 87, 28, 52)], away: "corner" },
  // Athletics: an oval bowl round the track, a stadium's two tiers (ours); skating: an arena's, close to the ice as a hockey rink is, rounded at the corners.
  athletics: { shape: "bowl", side: 30, end: 30, bench: 0, corner: 0, tiers: [lower(70), upper(77, 135)], oval: true, away: "end" },
  skating: { shape: "bowl", side: 12, end: 14, bench: 0, corner: 60, tiers: [lower(58, 3, 28), upper(65, 121, 38, 74)], away: "corner" },
  lacrosse: { shape: "bowl", side: 24, end: 30, bench: 6, corner: 40, tiers: [lower(70), upper(77, 125, 58, 100)], away: "end" },
  rugby: { shape: "bowl", side: 26, end: 36, bench: 6, corner: 48, tiers: [lower(78), upper(85, 145)], away: "end" },
  afl: { shape: "bowl", side: 30, end: 30, bench: 0, corner: 0, tiers: [lower(70), upper(77, 135)], oval: true, away: "end" },
  gaelic: { shape: "bowl", side: 34, end: 40, bench: 6, corner: 50, tiers: [lower(80), upper(87, 151)], away: "end" },
  cricket: { shape: "bowl", side: 30, end: 30, bench: 0, corner: 0, tiers: [lower(66), upper(73, 125)], oval: true, away: "end" },
  fieldhockey: { shape: "bowl", side: 20, end: 26, bench: 5, corner: 30, tiers: [lower(46, 3, 24), upper(53, 87, 32, 54)], away: "end" },
  handball: { shape: "bowl", side: 14, end: 18, bench: 4, corner: 16, tiers: [courtside(6), { id: "lower", from: 10, to: 46, height: [3, 22], fill: 1 }, upper(53, 97, 30, 56)], away: "corner" },
  // The budō (ours: no rule gives the stands). The competition areas of judo, karate and kendo stand in an arena's bowl, as the Nippon Budokan's does round its octagonal floor (the Budokan's leaflet: 2,946 temporary
  // seats on the arena, 2,959 to 3,199 on the first floor, 7,876 on the second and third); sumo's dohyō stands in the middle of a hall of box seats and a gallery (the Ryōgoku Kokugikan's); a kyūdōjō's
  // spectators stand along the yamichi; a dojo's gallery looks down on the mats from above, as the Kodokan's does from the eighth floor.
  judo: { shape: "bowl", side: 36, end: 36, bench: 6, corner: 50, tiers: [lower(60, 3, 24), upper(67, 120, 32, 60)], away: "corner", arena: { side: 8, end: 8, bench: 0, corner: 56, tiers: [lower(34, 3, 24), upper(40, 74, 32, 62)] } },
  karate: { shape: "bowl", side: 36, end: 36, bench: 6, corner: 50, tiers: [lower(60, 3, 24), upper(67, 120, 32, 60)], away: "corner", arena: { side: 8, end: 8, bench: 0, corner: 56, tiers: [lower(34, 3, 24), upper(40, 74, 32, 62)] } },
  kendo: { shape: "bowl", side: 36, end: 36, bench: 6, corner: 50, tiers: [lower(60, 3, 24), upper(67, 120, 32, 60)], away: "corner", arena: { side: 8, end: 8, bench: 0, corner: 56, tiers: [lower(34, 3, 24), upper(40, 74, 32, 62)] } },
  sumo: { shape: "bowl", side: 58, end: 58, bench: 0, corner: 56, tiers: [{ id: "lower", from: 0, to: 54, height: [1, 8], fill: 1 }, upper(62, 128, 26, 62)], away: "corner" },
  kyudo: { shape: "sides", side: 10, end: 8, bench: 0, corner: 6, tiers: [lower(24, 2, 8), upper(30, 52, 12, 22)], away: "corner" },
  dojo: { shape: "bowl", side: 5, end: 5, bench: 0, corner: 8, tiers: [lower(26, 2, 14), upper(32, 58, 20, 36)], away: "corner" },
  // An MMA cage stands in the middle of an arena, with the seats rising from the ring of the floor.
  mma: { shape: "bowl", side: 40, end: 40, bench: 0, corner: 56, tiers: [lower(60, 3, 24), upper(67, 120, 32, 60)], away: "corner" },
  // A boxing ring stands in the middle of an arena in the same way.
  boxing: { shape: "bowl", side: 40, end: 40, bench: 0, corner: 56, tiers: [lower(60, 3, 24), upper(67, 120, 32, 60)], away: "corner" },
  // A wrestling mat stands in the middle of a hall in the same way.
  wrestling: { shape: "bowl", side: 36, end: 36, bench: 6, corner: 50, tiers: [lower(60, 3, 24), upper(67, 120, 32, 60)], away: "corner" },
  // A wrestling ring stands in the middle of an arena as a boxing ring does.
  prowrestling: { shape: "bowl", side: 40, end: 40, bench: 0, corner: 56, tiers: [lower(60, 3, 24), upper(67, 120, 32, 60)], away: "corner" },
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

/** The walls the package knows have seats on top of them, by park and the wall's label: Fenway Park's Green Monster (the Monster seats, 2003). */
export const WALL_SEATS: Readonly<Record<string, string>> = Object.freeze({ "fenway-park": "Green Monster" });

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
    return `M${pts.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join("L")}Z`;
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

/** The area of an outline, in square feet. */
export const areaOfOutline = (o: Outline): number => {
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
export const seatsIn = (region: Outline, hole: Outline | null): number => Math.round((areaOfOutline(region) - (hole === null ? 0 : areaOfOutline(hole))) / 4.6);


/** A point of a rounded rectangle and the outward normal there, by its parameter `u` (any real number, taken modulo 8): the four straight sides are the even whole numbers (the top from left to right, the right from top to bottom and so on round) and the four corners the odd ones. Concentric outlines (the same corners' centres) have the same parameter at the points an aisle joins. */
export function rrectAt(o: Extract<Outline, { kind: "rrect" }>, u: number): { p: Pt; n: Pt } {
  const m = ((u % 8) + 8) % 8;
  const k = Math.floor(m);
  const f = m - k;
  const w = o.x1 - o.x0;
  const h = o.y1 - o.y0;
  const r = Math.min(o.r, w / 2, h / 2);
  const lh = w - 2 * r;
  const lv = h - 2 * r;
  const arc = (cx: number, cy: number, a0: number): { p: Pt; n: Pt } => {
    const a = ((a0 + 90 * f) * Math.PI) / 180;
    return { p: [cx + r * Math.cos(a), cy + r * Math.sin(a)], n: [Math.cos(a), Math.sin(a)] };
  };
  switch (k) {
    case 0:
      return { p: [o.x0 + r + f * lh, o.y0], n: [0, -1] };
    case 1:
      return arc(o.x1 - r, o.y0 + r, -90);
    case 2:
      return { p: [o.x1, o.y0 + r + f * lv], n: [1, 0] };
    case 3:
      return arc(o.x1 - r, o.y1 - r, 0);
    case 4:
      return { p: [o.x1 - r - f * lh, o.y1], n: [0, 1] };
    case 5:
      return arc(o.x0 + r, o.y1 - r, 90);
    case 6:
      return { p: [o.x0, o.y1 - r - f * lv], n: [-1, 0] };
    default:
      return arc(o.x0 + r, o.y0 + r, 180);
  }
}

/** The aisles a band has, as parameters of its inner outline: one at each end of every straight side (about every 30 feet along it) and one in the middle of every corner. */
export function aisleParameters(hole: Extract<Outline, { kind: "rrect" }>): { us: number[]; nh: number; nv: number } {
  const r = Math.min(hole.r, (hole.x1 - hole.x0) / 2, (hole.y1 - hole.y0) / 2);
  const nh = Math.max(2, Math.round((hole.x1 - hole.x0 - 2 * r) / 30));
  const nv = Math.max(2, Math.round((hole.y1 - hole.y0 - 2 * r) / 30));
  const us: number[] = [];
  for (let k = 0; k < 8; k += 1) {
    if (k % 2 === 1) us.push(k + 0.5);
    else for (let i = 0; i < (k % 4 === 0 ? nh : nv); i += 1) us.push(k + i / (k % 4 === 0 ? nh : nv));
  }
  return { us, nh, nv };
}

/** The aisles of a band as lines from its inner edge to its outer. */
export function aislesOf(region: Outline, hole: Outline | null): [Pt, Pt][] {
  if (region.kind === "rrect" && hole !== null && hole.kind === "rrect") return aisleParameters(hole).us.map((u): [Pt, Pt] => [rrectAt(hole, u).p, rrectAt(region, u).p]);
  if (region.kind === "ellipse" && hole !== null && hole.kind === "ellipse") {
    return Array.from({ length: 48 }, (_, i): [Pt, Pt] => {
      const t = (i * Math.PI) / 24;
      return [[hole.cx + hole.rx * Math.cos(t), hole.cy + hole.ry * Math.sin(t)], [region.cx + region.rx * Math.cos(t), region.cy + region.ry * Math.sin(t)]];
    });
  }
  return [];
}

/** The aisles of a hall's gallery: on each straight side, one across the band at each of the `shares` (0 to 1) of the side's length, from the first side's left end. */
function galleryAisles(region: Extract<Outline, { kind: "rrect" }>, hole: Extract<Outline, { kind: "rrect" }>, shares: readonly number[]): [Pt, Pt][] {
  return [0, 2, 4, 6].flatMap((side) => shares.map((f): [Pt, Pt] => [rrectAt(hole, side + f).p, rrectAt(region, side + f).p]));
}

/** The polygon of a band between two parameters, cut finely (a thirty-second of a side at a time) so that a block at a corner follows its curve as the band does. */
export function sectorPolygon(region: Extract<Outline, { kind: "rrect" }>, hole: Extract<Outline, { kind: "rrect" }>, u0: number, u1: number): Pt[] {
  const steps = Math.max(2, Math.ceil((u1 - u0) * 32));
  const us = Array.from({ length: steps + 1 }, (_, i) => u0 + ((u1 - u0) * i) / steps);
  return [...us.map((u) => rrectAt(region, u).p), ...us.map((u) => rrectAt(hole, u).p).reverse()];
}

/** The polygon of a band between two aisle parameters: along the outer edge, then back along the inner. */
function sectionBetween(region: Extract<Outline, { kind: "rrect" }>, hole: Extract<Outline, { kind: "rrect" }>, u0: number, u1: number): Pt[] {
  const us: number[] = [u0];
  for (let u = Math.floor(u0 * 4) / 4 + 0.25; u < u1 - 1e-9; u += 0.25) if (u > u0 + 1e-9) us.push(u);
  us.push(u1);
  return [...us.map((u) => rrectAt(region, u).p), ...us.map((u) => rrectAt(hole, u).p).reverse()];
}

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
  /** The surface lies on an arena floor that fills most of the hall: the sport's closer stands, where it has them. */
  arena?: boolean;
  /** A hall's gallery instead of the sport's stands (a dojo's balcony, from `dojoRoom`): the distance of its first row from the surface, its depth and the heights of its first and last rows, in feet. */
  gallery?: { offset: number; depth: number; height: [number, number]; rows?: number; aisles?: readonly number[] };
  /** A real venue's stands in place of the sport's usual tiers (see `venueBowl`). */
  real?: RealBowl;
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
  const { sport, box } = input;
  const gal = input.gallery;
  // A gallery has no home and no visitors, no card display and no tunnel, camera or benches.
  const crowd: Crowd = gal === undefined ? input.crowd : { ...input.crowd, awayEnd: "none", tifo: undefined, gaps: false, shape: input.crowd.shape === "sides" ? "sides" : "bowl" };
  const base0: Profile = gal === undefined ? PROFILES[sport] : { shape: "bowl", side: gal.offset, end: gal.offset, bench: 0, corner: 0, tiers: [{ id: "gallery", from: 0, to: gal.depth, height: gal.height, fill: 1 }], away: "corner" };
  const base: Profile = input.arena === true && base0.arena !== undefined ? { ...base0, ...base0.arena, tiers: base0.arena.tiers ?? base0.tiers } : base0;
  const host = sport === "soccer" ? (crowd.stadium === "nfl" || crowd.stadium === "cfl" ? crowd.stadium : crowd.stadium === "auto" && input.ground !== undefined ? GRIDIRON_GROUNDS[input.ground] : undefined) : undefined;
  const stadium: "purpose" | "nfl" | "cfl" | undefined = sport === "soccer" && input.real === undefined ? host ?? "purpose" : undefined;
  const p = stadium === "nfl" || stadium === "cfl" ? { ...PROFILES[stadium], shape: base.shape, away: base.away } : base;
  const shape = input.real !== undefined ? "bowl" : crowd.shape ?? p.shape;
  const off = input.real?.off ?? offsets(base, box, stadium ?? "purpose");
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const rings: StandRing[] = input.real === undefined ? [] : input.real.rings.map((ring) => ({ ...ring }));
  const reachOf = input.real === undefined ? { left: 0, right: 0, top: 0, bottom: 0 } : { ...input.real.reach };
  for (const t of input.real === undefined ? p.tiers : []) {
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
      aisles: gal?.aisles !== undefined && region.kind === "rrect" && hole.kind === "rrect" ? galleryAisles(region, hole, gal.aisles) : aislesOf(region, hole),
      ...(gal?.rows === undefined ? {} : { rows: gal.rows }),
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
  const concourses: CrowdStands["concourses"] = [];
  rings.forEach((ring, i) => {
    const before = rings[i - 1];
    if (before !== undefined && ring.hole !== null && ring.from > before.to) concourses.push({ region: ring.hole, hole: before.region });
  });
  const stands: CrowdStands = { sport, shape, box, rings, covers, concourses, sectors: [], gaps: [], reach: reachOf, seats: rings.reduce((n, r) => n + r.seats, 0) };
  if (input.real !== undefined) stands.real = input.real.shell;
  if (input.real?.closedSectors !== undefined) stands.sectors.push(...input.real.closedSectors);
  if (stadium !== undefined) stands.stadium = stadium;
  if (gal !== undefined) stands.gallery = true;
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
    const side = crowd.awayEnd === "left" || crowd.awayEnd === "right" ? crowd.awayEnd : input.awaySide;
    const sign = side === "right" ? 1 : -1;
    const mode = crowd.awayEnd === "auto" ? (p.away === "end" ? "end" : "corner") : crowd.awayEnd === "corner" ? "corner" : "end";
    const tiers = rings.filter((r) => r.tier === "lower" || r.tier === "middle" || r.tier === "upper");
    const hole = lowerRing.hole;
    if (lowerRing.region.kind === "rrect" && hole !== null && hole.kind === "rrect") {
      // Round a rectangle a block is whole sections: it starts and ends on aisles, so that it is a section of the stands and not a wedge.
      const { nh, nv } = aisleParameters(hole);
      const clear = (u: number): boolean => {
        const [px, py] = rrectAt(lowerRing.region as Extract<Outline, { kind: "rrect" }>, u).p;
        return !covers.some(([bx0, by0, bx1, by1]) => px >= bx0 && px <= bx1 && py >= by0 && py <= by1);
      };
      const section = (kind: StandSector["kind"], u0: number, u1: number, only?: StandRing): void => {
        if (!clear((u0 + u1) / 2) || !clear(u0) || !clear(u1)) return;
        for (const ring of only === undefined ? tiers : [only]) if (ring.region.kind === "rrect" && ring.hole?.kind === "rrect") stands.sectors.push({ ring: ring.id, kind, points: sectionBetween(ring.region, ring.hole, u0, u1) });
      };
      // An end's side is the right (segment 2) or the left (segment 6); a block on it is from one aisle to another near its middle.
      const along = (seg: number, from: number, to: number): [number, number] => [seg + Math.max(0, Math.min(nv - 1, Math.round(nv * from))) / nv, seg + Math.max(1, Math.min(nv, Math.round(nv * to))) / nv];
      if (crowd.awayEnd !== "none") {
        if (mode === "end") section("away", ...along(sign > 0 ? 2 : 6, 0.28, 0.72));
        else if (sign > 0) section("away", (nh - 2) / nh, 1.5);
        else section("away", 7.5, 8 + 2 / nh);
      }
      if (crowd.tifo !== undefined) {
        const homeSideIsLeft = input.awaySide === "right";
        const mk = (team: "home" | "away"): void => {
          const left = (team === "home") === homeSideIsLeft;
          section(team === "home" ? "tifo-home" : "tifo-away", ...along(left ? 6 : 2, 0.32, 0.68), lowerRing);
        };
        if (crowd.tifo === "home" || crowd.tifo === "both") mk("home");
        if (crowd.tifo === "away" || crowd.tifo === "both") mk("away");
      }
    } else {
      // Round an oval a block is a wedge of the ring, between two rays.
      const corner = Math.atan2(box.h / 2 + off.top + lowerRing.to / 2, box.w / 2 + off.left + lowerRing.to / 2);
      const wedge = (ring: StandRing, from: number, to: number): Pt[] => {
        const outer: Pt[] = [];
        const inner: Pt[] = [];
        for (let i = 0; i <= 8; i += 1) {
          const a = from + ((to - from) * i) / 8;
          outer.push(rayAt(ring.region, cx, cy, a));
          inner.push(rayAt(ring.hole ?? ring.region, cx, cy, a));
        }
        return [...outer, ...inner.reverse()];
      };
      const place = (kind: StandSector["kind"], a0: number, a1: number, only?: StandRing): void => {
        for (const ring of only === undefined ? tiers : [only]) stands.sectors.push({ ring: ring.id, kind, points: wedge(ring, a0, a1) });
      };
      const centre = side === "right" ? 0 : Math.PI;
      if (crowd.awayEnd !== "none") place("away", centre - corner * 0.5, centre + corner * 0.5);
      if (crowd.tifo !== undefined) {
        const homeSideIsLeft = input.awaySide === "right";
        const mk = (team: "home" | "away"): void => place(team === "home" ? "tifo-home" : "tifo-away", ((team === "home") === homeSideIsLeft ? Math.PI : 0) - corner * 0.42, ((team === "home") === homeSideIsLeft ? Math.PI : 0) + corner * 0.42, lowerRing);
        if (crowd.tifo === "home" || crowd.tifo === "both") mk("home");
        if (crowd.tifo === "away" || crowd.tifo === "both") mk("away");
      }
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
