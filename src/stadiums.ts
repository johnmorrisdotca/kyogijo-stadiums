// The real stadiums: for a stadium that stages football and soccer, the outline of its building and the way its field lies in it (from OpenStreetMap, ODbL 1.0), and a bowl of the seats of each configuration, the
// number of bowls and the kind of roof the sources give (Wikidata, CC0, and the English Wikipedia article each fact cites), fitted inside the outline. It is the stadium's counterpart of `venues.ts`, for a surface that is a
// field and not a rink: level one is the building, level two a plausible bowl, and it stops there (no team's, ticket seller's or federation's seat map is read or copied, no section or row is named, and no mark of a club, a
// league or a tournament is drawn). The drawing is `drawKyogijo({ sport: "cfl", stadium, crowd: { real: true } })` (or `sport: "soccer"` with a `ground` or a `stadium`) and, in 3D, the same options in `buildTurn`.
import { NORTH_ROOM, aislesOf, areaOfOutline, outlinePoints, type Box, type Outline, type Pt, type RealBowl, type StandRing } from "./crowd.ts";
import { FEET_PER_METRE, FOOTBALL } from "./geometry.ts";
import { groundById, type Ground } from "./grounds.ts";
import { GAP, HALL, MAX_RAKE, SEAT_AREAS, WALL, VENUE_ATTRIBUTION } from "./venues.ts";
import { boxOf, edgeDistance, inside, metresFrom, middleOf, northOn, turnedTo, type LonLat } from "./venues.geo.ts";
import { STADIUM_DATA } from "./stadiums.data.ts";
import { STADIUM_OSM } from "./stadiums.osm.data.ts";

export { VENUE_ATTRIBUTION };

/** How a fact is known: `documented` is what a source cited with it says; `plausible` is ours, for a bowl no source describes. */
export type StadiumBasis = "documented" | "plausible";

/** The configurations of a stadium: the field the seats are counted for. `cfl` is the football field of the Canadian league, `soccer` a soccer pitch. */
export type StadiumConfigId = "cfl" | "soccer";

/** The kinds of roof the stadiums have: `cable` is a cable-supported roof with an opening over the field that a retractable fabric closes; `fixed` a lid over the bowl. */
export type StadiumRoof = "cable" | "fixed";

/** What one configuration of a stadium is: its sport and its seats, and where the figure was read. */
export interface StadiumConfigData {
  sport: "cfl" | "soccer";
  /** The seats for this configuration: the infobox's figure for it, or Wikidata's. */
  seats: number;
  source: "wikidata" | "wikipedia";
  /** What was read, in a few words of ours. */
  read: string;
}

/** The facts of a stadium: the seats of each configuration, the number of bowls and the kind of roof, each with what a source says. No text of an article is kept. */
export interface RealStadiumData {
  /** The key: `bc-place`, the key of the stadium's ground in `GROUNDS`. */
  id: string;
  /** The Wikidata item of the stadium. */
  wikidata: string;
  /** The key of the stadium's ground in `GROUNDS` (its name, its place, its pitch). */
  ground: string;
  /** The English Wikipedia article the facts that are not Wikidata's were read from, at a revision. */
  en: { title: string; revision: number };
  configs: Record<StadiumConfigId, StadiumConfigData>;
  tiers: {
    /** The seating levels (bowls). */
    count: 1 | 2 | 3;
    basis: StadiumBasis;
    /** The seats of the lowest bowl, where a source gives them: the lower tier's band holds this many whatever the configuration (the upper bowl is what is opened or closed for the others). */
    lowerSeats?: number;
    read: string;
  };
  roof: { kind: StadiumRoof; basis: StadiumBasis; read: string; /** A cable roof's opening over the field, as the article gives it, in metres. */ opening?: { length: number; width: number; unit: "m" } };
}

/** What OpenStreetMap gave of a stadium: ODbL 1.0 data, "(c) OpenStreetMap contributors". */
export interface StadiumOsm {
  /** The element the outline is: `way/24705904`. */
  source: string;
  read: string;
  base: string;
  licence: "ODbL-1.0";
  attribution: string;
  /** The roof OpenStreetMap maps over the building: its heights in metres (`height` to the top of the roof, `rise` of that the roof's own) and the opening in it as `[longitude, latitude]`. */
  roof?: { source: string; height?: number; rise?: number; outer?: string; opening?: { source: string; ring: [number, number][] } };
  /** The building's outline as `[longitude, latitude]`, not repeating its first point. */
  ring: [number, number][];
  /**
   * How the field lies, worked out when the data was made: the heading of its long side (degrees clockwise from north, 0 to under 180), how that is known (`opening`: from the roof's opening, which the article says is
   * the field's size; `building`: from the long axis of the building's main hall, an inference; `none`: no direction, 90 is stood in), how much of a direction the building has (`strength`) and how much longer than
   * wide the opening or the hall is (`elongation`), and the middle of the field as `[longitude, latitude]`.
   */
  axis: { heading: number; basis: "opening" | "building" | "none"; strength: number; elongation: number; centre: [number, number] };
}

/** A stadium: its facts and what OpenStreetMap gave. */
export interface RealStadium extends RealStadiumData {
  osm: StadiumOsm;
}

/** How the field lies in the building: its long side's heading, how that is known, and the way north points on the page (degrees clockwise from the top). */
export interface StadiumOrientation {
  heading: number;
  basis: "opening" | "building" | "none";
  north: number;
}

/** The stadiums by key. */
export const STADIUMS: Readonly<Record<string, RealStadium>> = Object.freeze(Object.fromEntries(STADIUM_DATA.map((data) => [data.id, Object.freeze({ ...data, osm: STADIUM_OSM[data.id] })])));

/** The keys of `STADIUMS`, in the order of the data. */
export const STADIUM_IDS: readonly string[] = Object.freeze(STADIUM_DATA.map((data) => data.id));

/** The stadium with a key, or `undefined`. */
export const stadiumById = (id: string | undefined): RealStadium | undefined => (id !== undefined && Object.prototype.hasOwnProperty.call(STADIUMS, id) ? STADIUMS[id] : undefined);

/** The stadium whose Wikidata item is `Q612227`, or `undefined`. */
export const stadiumByWikidata = (wikidata: string | undefined): RealStadium | undefined => Object.values(STADIUMS).find((s) => s.wikidata === wikidata);

/** The ground a stadium is (its name, place and pitch). */
export const groundOfStadium = (stadium: RealStadium): Ground => {
  const ground = groundById(stadium.ground);
  if (ground === undefined) throw new Error(`${stadium.id} has no ground ${stadium.ground}`);
  return ground;
};

const round = (value: number, places = 1): number => Math.round(value * 10 ** places) / 10 ** places;
const lonLat = (ring: readonly (readonly [number, number])[]): LonLat[] => ring.map(([lon, lat]) => [lon, lat]);

/** How the field lies in a stadium's building (see `StadiumOsm.axis`). */
export const stadiumOrientation = (stadium: RealStadium): StadiumOrientation => ({ heading: stadium.osm.axis.heading, basis: stadium.osm.axis.basis, north: round(northOn(stadium.osm.axis.heading)) });

/** The configuration a sport is: `cfl` or `soccer`, or `undefined` for a sport a stadium has no configuration for. */
export const stadiumConfigOf = (sport: string | undefined): StadiumConfigId | undefined => (sport === "cfl" || sport === "soccer" ? sport : undefined);

/** The seats of a stadium for a configuration. */
export const stadiumSeats = (stadium: RealStadium, config: StadiumConfigId): number => stadium.configs[config].seats;

// ---- The bowl. ----

/** How far the first row is from a football field's footprint (the CFL's, the field and its end zones) along a side and at an end, and the corner's radius: the package's own gridiron profile (`crowd.ts`), so that a real stadium's first row is the usual one. */
const FIRST_ROW = { side: 42, end: 28, corner: 60 } as const;
/** The height of the first row above the field, in feet, the rise of a bowl's rows by the number of bowls (what the lowest, a middle and the upper rise, at most), and the rise of the walk between two bowls (a suite level): ours, no source gives them. */
export const STADIUM_FIRST_HEIGHT = 5;
export const STADIUM_RISES: Readonly<Record<1 | 2 | 3, readonly number[]>> = { 1: [60], 2: [38, 62], 3: [32, 26, 56] };
export const STADIUM_WALK_RISE = 24;
/** The height a roof's rim stands over the top row, at the least, in feet. */
export const STADIUM_CLEARANCE = 22;
/** The share of the seats in the lowest bowl where no source says. */
const LOWER_SHARE = 0.5;
const CORNER = 0.7;
/** How many of a bowl's seats are taken, relative to the stands', as `crowd.ts` has them. */
const FILL: Readonly<Record<"lower" | "middle" | "upper", number>> = { lower: 1, middle: 0.94, upper: 0.88 };
const TIER_IDS: Readonly<Record<1 | 2 | 3, readonly ("lower" | "middle" | "upper")[]>> = { 1: ["lower"], 2: ["lower", "upper"], 3: ["lower", "middle", "upper"] };

type RRect = Extract<Outline, { kind: "rrect" }>;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const between = (a: RRect, b: RRect, t: number): RRect => ({ kind: "rrect", x0: lerp(a.x0, b.x0, t), y0: lerp(a.y0, b.y0, t), x1: lerp(a.x1, b.x1, t), y1: lerp(a.y1, b.y1, t), r: lerp(a.r, b.r, t) });

/** The parameter in `[lo, hi]` at which an increasing function reaches `target` (bisection), or `hi` where it does not. */
function solveFor(f: (t: number) => number, lo: number, hi: number, target: number): number {
  if (f(hi) <= target) return hi;
  let [a, b] = [lo, hi];
  for (let i = 0; i < 48; i += 1) {
    const m = (a + b) / 2;
    if (f(m) < target) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/** The plan of a stadium for a configuration: its building in the drawing's frame, the bowl fitted inside, and how it lies. */
export interface StadiumPlan {
  stadium: RealStadium;
  config: StadiumConfigId;
  orientation: StadiumOrientation;
  /** The field, in the drawing's frame. */
  box: Box;
  /** The building's outline in feet, in the drawing's frame (the field's long side along x, in the middle of the building's hall). */
  footprint: Pt[];
  /** The roof's opening in feet, in the drawing's frame, where OpenStreetMap maps it. */
  opening: Pt[] | undefined;
  /** The stands for `layoutOf`: bowls, first row, ground, and the building and roof. */
  bowl: RealBowl;
  /** The seats the bowls hold, by bowl, and in all: equal to the configuration's seats where the building has room (`fit` is `fits`). */
  seats: { tier: string; seats: number }[];
  total: number;
  /** The floor a seat takes in the plan, in square feet (one of `SEAT_AREAS`). */
  seatArea: number;
  fit: "fits" | "tight";
}

/** Plans already made, by stadium, configuration and field: a plan is a pure function of them, and a drawing asks for it more than once. */
const PLANS = new WeakMap<RealStadium, Map<string, StadiumPlan>>();

/**
 * The plan of a stadium's bowl for a configuration: the building's outline turned so that the field lies along x, a first row round a football field's footprint as a gridiron's stands have it, the largest bowl-shaped
 * outline that fits the building round the middle of the field, and between the two the bowls, the outer edge of each placed so that its band holds the share of the configuration's seats the sources give it, with a walk
 * between them. The bowl is the same building for football and soccer (the seats of the configuration differ, and the field).
 * @example
 * ```ts
 * import { planStadium, stadiumById } from "@johnmorrisdotca/kyogijo-stadiums/stadiums";
 * const plan = planStadium(stadiumById("bc-place")!, "soccer", { x: 0, y: 0, w: 344.5, h: 223.1 });
 * console.log(plan.orientation.basis, plan.seats.map((t) => t.tier).join(" "), plan.total);
 * // opening lower upper 52497
 * ```
 */
export function planStadium(stadium: RealStadium, config: StadiumConfigId, box: Box): StadiumPlan {
  const key = `${config}|${box.x}|${box.y}|${box.w}|${box.h}`;
  const mine = PLANS.get(stadium) ?? new Map<string, StadiumPlan>();
  PLANS.set(stadium, mine);
  const known = mine.get(key);
  if (known !== undefined) return known;
  const made = plan(stadium, config, box);
  mine.set(key, made);
  return made;
}

function plan(stadium: RealStadium, config: StadiumConfigId, rink: Box): StadiumPlan {
  const orientation = stadiumOrientation(stadium);
  const origin = middleOf(lonLat(stadium.osm.ring));
  const turned = (ring: readonly (readonly [number, number])[]): Pt[] => metresFrom(origin, lonLat(ring)).map((p) => turnedTo(orientation.heading, p));
  const outline = turned(stadium.osm.ring);
  const [middle] = turned([stadium.osm.axis.centre]);
  const at: Pt = [rink.x + rink.w / 2, rink.y + rink.h / 2];
  const place = (ring: readonly Pt[]): Pt[] => ring.map(([x, y]): Pt => [round((x - middle[0]) * FEET_PER_METRE + at[0], 2), round((y - middle[1]) * FEET_PER_METRE + at[1], 2)]);
  const footprint = place(outline);
  const fb = boxOf(footprint);
  const openingRing = stadium.osm.roof?.opening?.ring;
  const opening = openingRing === undefined ? undefined : place(turned(openingRing));

  // The first row round a football field's footprint, and the largest bowl-shaped outline that fits inside the building round the middle of the field.
  const gridiron = FOOTBALL.cfl;
  const length = gridiron.length + 2 * gridiron.endZone;
  const first: RRect = { kind: "rrect", x0: at[0] - length / 2 - FIRST_ROW.end, y0: at[1] - gridiron.width / 2 - FIRST_ROW.side, x1: at[0] + length / 2 + FIRST_ROW.end, y1: at[1] + gridiron.width / 2 + FIRST_ROW.side, r: FIRST_ROW.corner };
  const shapedAs = (long: number, s: number): RRect => ({ kind: "rrect", x0: at[0] - long * s, y0: at[1] - s, x1: at[0] + long * s, y1: at[1] + s, r: CORNER * s });
  const largest = (long: number): number => {
    let [lo, hi] = [60, Math.max(fb.x1 - fb.x0, fb.y1 - fb.y0)];
    for (let i = 0; i < 24; i += 1) {
      const m = (lo + hi) / 2;
      if (outlinePoints(shapedAs(long, m)).every((p) => inside(footprint, p) && edgeDistance(footprint, p) >= WALL)) lo = m;
      else hi = m;
    }
    return lo;
  };
  const tries = [1.15, 1.25, 1.35, 1.45, 1.6].map((long) => ({ long, s: largest(long) }));
  const best = tries.reduce((a, b) => (a.long * a.s * a.s >= b.long * b.s * b.s ? a : b));
  const wall = shapedAs(best.long, best.s);
  const outer: RRect = { ...wall, x0: Math.min(wall.x0, first.x0 - 40), y0: Math.min(wall.y0, first.y0 - 40), x1: Math.max(wall.x1, first.x1 + 40), y1: Math.max(wall.y1, first.y1 + 40) };
  const depth = (first.x0 - outer.x0) + (first.y0 - outer.y0) + (outer.x1 - first.x1) + (outer.y1 - first.y1);
  const gap = GAP / Math.max(20, depth / 4);

  const seatsTotal = stadium.configs[config].seats;
  const count = stadium.tiers.count;
  const lower = stadium.tiers.lowerSeats === undefined ? (count === 1 ? 1 : count === 2 ? LOWER_SHARE : 0.36) : stadium.tiers.lowerSeats / seatsTotal;
  const shares = count === 1 ? [1] : count === 2 ? [lower, 1 - lower] : [lower, (1 - lower) * 0.36, (1 - lower) * 0.64];
  const outlineAt = (t: number): RRect => between(first, outer, t);
  const build = (area: number): { rings: StandRing[]; tight: boolean } => {
    const seatsOf = (region: Outline, hole: Outline): number => Math.round((areaOfOutline(region) - areaOfOutline(hole)) / area);
    const rings: StandRing[] = [];
    let t0 = 0;
    let tight = false;
    let up = STADIUM_FIRST_HEIGHT;
    shares.forEach((share, k) => {
      const wanted = seatsTotal * share;
      const t1 = solveFor((t) => seatsOf(outlineAt(t), outlineAt(t0)), t0, 1, wanted);
      if (seatsOf(outlineAt(t1), outlineAt(t0)) < wanted - 1) tight = true;
      const region = outlineAt(t1);
      const hole = outlineAt(t0);
      const tier = TIER_IDS[count][k];
      const run = (region.y1 - hole.y1 + (hole.y0 - region.y0)) / 2;
      const rise = Math.min(STADIUM_RISES[count][k], Math.max(6, run * Math.tan((MAX_RAKE * Math.PI) / 180)));
      const h0 = k === 0 ? STADIUM_FIRST_HEIGHT : up + STADIUM_WALK_RISE;
      const h1 = h0 + rise;
      up = h1;
      rings.push({
        id: tier,
        tier,
        region,
        hole,
        from: round(hole.y1 - first.y1, 2),
        to: round(region.y1 - first.y1, 2),
        height: [round(h0), round(h1)],
        rake: round((Math.atan2(h1 - h0, Math.max(1, run)) * 180) / Math.PI),
        fill: FILL[tier],
        seats: seatsOf(region, hole),
        aisles: aislesOf(region, hole),
      });
      t0 = Math.min(1, t1 + gap);
    });
    return { rings, tight };
  };
  let seatArea: number = SEAT_AREAS[0];
  let made = build(seatArea);
  for (const area of SEAT_AREAS.slice(1)) {
    if (!made.tight) break;
    seatArea = area;
    made = build(area);
  }
  const { rings, tight } = made;
  // The rounding of each bowl's seats leaves the total a seat or two off the configuration's: the last bowl takes the difference.
  const missing = seatsTotal - rings.reduce((sum, ring) => sum + ring.seats, 0);
  if (!tight && Math.abs(missing) <= 3) rings[rings.length - 1].seats += missing;
  const total = rings.reduce((sum, ring) => sum + ring.seats, 0);
  const top = rings[rings.length - 1].height[1];
  const roof = stadium.osm.roof;
  const rise = roof?.rise === undefined ? 0 : round(roof.rise * FEET_PER_METRE);
  // The rim of the roof stands where OpenStreetMap maps it (its height less the roof's own rise), and at the least over the top row by a roof's clearance.
  const mapped = roof?.height === undefined ? 0 : round((roof.height - (roof.rise ?? 0)) * FEET_PER_METRE);
  const edge = Math.max(mapped, top + STADIUM_CLEARANCE);
  const cable = stadium.roof.kind === "cable" && opening !== undefined && rise > 0;
  const north = orientation.basis === "none" ? undefined : orientation.north;
  const room = north === undefined ? 0 : NORTH_ROOM;
  const bowl: RealBowl = {
    rings,
    off: { left: rink.x - first.x0, right: first.x1 - rink.x - rink.w, top: rink.y - first.y0, bottom: first.y1 - rink.y - rink.h },
    reach: { left: Math.max(0, rink.x - fb.x0), right: Math.max(0, fb.x1 - rink.x - rink.w), top: Math.max(0, rink.y - fb.y0) + room, bottom: Math.max(0, fb.y1 - rink.y - rink.h) },
    shell: {
      footprint,
      hall: { ...outer, x0: outer.x0 - HALL, y0: outer.y0 - HALL, x1: outer.x1 + HALL, y1: outer.y1 + HALL, r: outer.r + HALL },
      ...(north === undefined ? {} : { north }),
      roof: cable ? "cable" : "fixed",
      edge,
      ...(cable ? { crown: { rise, opening } } : {}),
    },
  };
  return { stadium, config, orientation, box: rink, footprint, opening, bowl, seats: rings.map((ring) => ({ tier: ring.tier, seats: ring.seats })), total, seatArea, fit: tight ? "tight" : "fits" };
}

/** The stands of a stadium for `layoutOf` and the 3D view, round a field: `planStadium`'s bowl. */
export const stadiumBowl = (stadium: RealStadium, config: StadiumConfigId, box: Box): RealBowl => planStadium(stadium, config, box).bowl;

/** Whether the bowl lies inside the building: every corner of every bowl's outer edge is inside the footprint. */
export function stadiumBowlInside(plan: StadiumPlan): boolean {
  return outlinePoints(plan.bowl.rings[plan.bowl.rings.length - 1].region).every((p) => inside(plan.footprint, p));
}
