// The real stadiums: for a stadium that stages football and soccer, a ballpark, or a hall that stages boxing, the outline of its building and the way its field lies in it (from OpenStreetMap, ODbL 1.0), and a bowl of the seats of each configuration,
// the number of bowls and the kind of roof the sources give (Wikidata, CC0, and the English Wikipedia article each fact cites), fitted inside the outline. It is the stadium's counterpart of `venues.ts`, for a surface that is a
// field and not a rink: level one is the building, level two a plausible bowl, and it stops there (no team's, ticket seller's or federation's seat map is read or copied, no section or row is named, and no mark of a club, a
// league or a tournament is drawn). The drawing is `drawKyogijo({ sport: "cfl", stadium, crowd: { real: true } })` (or `sport: "soccer"` with a `ground` or a `stadium`, `sport: "mlb"` with a `park`) and, in 3D, the same options
// in `buildTurn`.
import { NORTH_ROOM, aislesOf, areaOfOutline, outlinePoints, type Box, type CrowdStands, type Outline, type Pt, type RealBowl, type RealShell, type StandRing } from "./crowd.ts";
import { parkLayout, type ParkInput } from "./crowd.park.ts";
import { FEET_PER_METRE, FOOTBALL } from "./geometry.ts";
import { groundById, type Ground } from "./grounds.ts";
import { PARKS } from "./parks.ts";
import { GAP, HALL, MAX_RAKE, SEAT_AREAS, WALL, VENUE_ATTRIBUTION } from "./venues.ts";
import { boxOf, edgeDistance, inside, metresFrom, middleOf, northOn, turnedTo, type LonLat } from "./venues.geo.ts";
import { clipConvex } from "./venue.geom.ts";
import { STADIUM_DATA } from "./stadiums.data.ts";
import { STADIUM_OSM } from "./stadiums.osm.data.ts";

export { VENUE_ATTRIBUTION };

/** How a fact is known: `documented` is what a source cited with it says; `plausible` is ours, for a bowl no source describes. */
export type StadiumBasis = "documented" | "plausible";

/** The configurations of a stadium: the field the seats are counted for. `cfl` and `nfl` are the football fields of the two leagues, `soccer` a soccer pitch, `mlb` a baseball field, `boxing` a boxing ring in a hall. */
export type StadiumConfigId = "cfl" | "nfl" | "soccer" | "mlb" | "boxing";

/** What a stadium is: a `stadium` has a football field and a soccer pitch lying along its length, a `park` is a baseball park, whose frame is home plate's, a `hall` is a hall with a ring in the middle and the seats round it. */
export type StadiumKind = "stadium" | "park" | "hall";

/**
 * The kinds of roof: `cable` is a cable-supported roof with an opening over the field that a retractable fabric closes (BC Place's); `fixed` a lid over the bowl; `canopy` roofs over some of the stands that leave the field
 * open (Lumen Field's); `panels` a retractable roof of sections high over a ballpark (T-Mobile Park's); `dome` an air-supported roof, a membrane held up by the air inside (Tokyo Dome's); `open` no roof over the
 * field (Koshien Stadium's).
 */
export type StadiumRoof = "cable" | "fixed" | "canopy" | "panels" | "dome" | "open";

/** What one configuration of a stadium is: its sport and its seats, and where the figure was read. */
export interface StadiumConfigData {
  sport: StadiumConfigId;
  /** The seats for this configuration: the infobox's figure for it, or Wikidata's. */
  seats: number;
  source: "wikidata" | "wikipedia";
  /** What was read, in a few words of ours. */
  read: string;
}

/** The facts of a stadium: the seats of each configuration, the number of bowls and the kind of roof, each with what a source says. No text of an article is kept. */
export interface RealStadiumData {
  /** The key: `bc-place`, the key of the stadium's ground in `GROUNDS` (or of its park in `PARKS`). */
  id: string;
  kind?: StadiumKind;
  /** The Wikidata item of the stadium. */
  wikidata: string;
  /** The key of the stadium's ground in `GROUNDS` (its name, its place, its pitch): a stadium has one. */
  ground?: string;
  /** The key of a ballpark in `PARKS` (its name, its place, its fence): a park has one. */
  park?: string;
  /** Whose football field the first row stands round: the CFL's (the default) or the NFL's. */
  gridiron?: "cfl" | "nfl";
  /** The English Wikipedia article the facts that are not Wikidata's were read from, at a revision. */
  en: { title: string; revision: number };
  /** The Japanese Wikipedia article some of the facts were read from, at a revision. */
  ja?: { title: string; revision: number };
  /** The names of a hall, in both languages (a stadium's and a park's are those of its ground and its park): Wikidata's labels. */
  names?: { en: string; ja: string; readingJa?: string };
  /**
   * Plain drawing choices where the sources say so, each with what was read: `ivyWalls` draws the building's walls in green (Koshien Stadium's ivy), `dirtInfield` draws the infield all dirt, with no grass inside the bases
   * (the same stadium's). They are drawn as plain colours, not as a picture of the plants or the soil.
   */
  looks?: { ivyWalls?: string; dirtInfield?: string };
  configs: Partial<Record<StadiumConfigId, StadiumConfigData>>;
  /** The seats of the whole bowl where it holds more than a configuration's (Lumen Field's soccer seats are fewer: the upper sections are closed): the bowl is fitted to these and a configuration opens its seats from the lowest bowl up. */
  bowlSeats?: number;
  /** Wikidata's own capacities (P1083), kept beside the figures used: they are often for another event or another year. */
  wikidataSeats?: number[];
  tiers: {
    /** The seating levels (bowls): a ballpark's four levels are drawn as a lower bowl, an upper bowl and the bleachers. */
    count: 1 | 2 | 3 | 4;
    basis: StadiumBasis;
    /** The seats of the lowest bowl, where a source gives them: the lower tier's band holds this many whatever the configuration (the upper bowl is what is opened or closed for the others). */
    lowerSeats?: number;
    /** A ballpark's seats by band, where the article gives them by level: the lower bowl, the upper bowl (the club, suite and view levels) and the bleachers. */
    tierSeats?: { lower: number; upper: number; bleachers: number };
    read: string;
  };
  roof: {
    kind: StadiumRoof;
    basis: StadiumBasis;
    read: string;
    /** A cable roof's opening over the field, as the article gives it, in metres. */
    opening?: { length: number; width: number; unit: "m" };
    /** A canopy's share of the seats it covers, as the article gives it. */
    cover?: number;
    /** A retractable roof's bottom and top above the field, in feet, as the article gives them (an air-supported roof's height is the building's, from OpenStreetMap). */
    bottom?: number;
    top?: number;
  };
}

/** What OpenStreetMap gave of a stadium: ODbL 1.0 data, "(c) OpenStreetMap contributors". */
export interface StadiumOsm {
  /** The element the outline is: `way/24705904`, `relation/2305831`. */
  source: string;
  read: string;
  base: string;
  licence: "ODbL-1.0";
  attribution: string;
  /** The building's height in metres, where OpenStreetMap maps one. */
  height?: number;
  /** The roof OpenStreetMap maps over the building: its heights in metres (`height` to the top of the roof, `rise` of that the roof's own) and the opening in it as `[longitude, latitude]`. */
  roof?: { source: string; height?: number; rise?: number; outer?: string; opening?: { source: string; ring: [number, number][] }; ring?: [number, number][] };
  /** The canopies OpenStreetMap maps over some of the stands: each one's outline, the height of its top and how far it rises (metres). */
  canopies?: { source: string; height: number; rise: number; ring: [number, number][] }[];
  /** The building's outline as `[longitude, latitude]`, not repeating its first point. */
  ring: [number, number][];
  /**
   * How the field lies, worked out when the data was made: the heading of its long side (degrees clockwise from north, 0 to under 180; for a ballpark, the heading from home plate out to centre field, 0 to under 360), how that
   * is known (`opening`: from the roof's opening, which the article says is the field's size; `pitch`: from the pitches OpenStreetMap maps, and for a ballpark from the grass of the field it maps, fitted to the fence
   * the park publishes (`rms`, in metres, is how far the two lie apart); `infield`: from the mapped infield, with the outline choosing which way is out to centre field; `building`: from the long axis of the
   * building's main hall, an inference; `none`: no direction is known, and the heading is a stand-in (90 for a field with a long side, and for a ballpark the way that keeps its fence and its stands inside the building)),
   * how much of a direction the building has (`strength`) and how much longer than wide the opening, the pitch or the hall is (`elongation`), and the middle of the field as `[longitude, latitude]` (home plate for a ballpark).
   */
  axis: { heading: number; basis: "opening" | "pitch" | "infield" | "building" | "none"; strength: number; elongation: number; centre: [number, number]; rms?: number };
}

/** A stadium: its facts and what OpenStreetMap gave. */
export interface RealStadium extends RealStadiumData {
  osm: StadiumOsm;
}

/** How the field lies in the building: its long side's heading (a ballpark's: home plate to centre field), how that is known, and the way north points on the page (degrees clockwise from the top). */
export interface StadiumOrientation {
  heading: number;
  basis: StadiumOsm["axis"]["basis"];
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

/** The kind of a stadium: a `stadium` unless it is a ballpark. */
export const stadiumKind = (stadium: RealStadium): StadiumKind => stadium.kind ?? "stadium";

/** The configurations a stadium has, in the order of its data. */
export const stadiumConfigs = (stadium: RealStadium): StadiumConfigId[] => Object.keys(stadium.configs) as StadiumConfigId[];

/** The ground a stadium is (its name, place and pitch). Throws for a ballpark, which has a park, and for a hall, which has none. */
export const groundOfStadium = (stadium: RealStadium): Ground => {
  const ground = groundById(stadium.ground);
  if (ground === undefined) throw new Error(`${stadium.id} has no ground ${String(stadium.ground)}`);
  return ground;
};

/** The names a stadium goes by in both languages, of its ground or its park (a hall's own). */
export function stadiumNames(stadium: RealStadium): { en: string; ja: string } {
  if (stadiumKind(stadium) === "hall") {
    if (stadium.names === undefined) throw new Error(`${stadium.id} is a hall with no names`);
    return { en: stadium.names.en, ja: stadium.names.ja };
  }
  if (stadiumKind(stadium) === "park") {
    const park = PARKS[stadium.park ?? ""];
    if (park === undefined) throw new Error(`${stadium.id} has no park ${String(stadium.park)}`);
    return { en: park.name, ja: park.nameJa };
  }
  const ground = groundOfStadium(stadium);
  return { en: ground.name, ja: ground.nameJa };
}

const round = (value: number, places = 1): number => Math.round(value * 10 ** places) / 10 ** places;
const lonLat = (ring: readonly (readonly [number, number])[]): LonLat[] => ring.map(([lon, lat]) => [lon, lat]);

/** The heading the field's frame runs along, degrees clockwise from north: the long side's, and for a ballpark (whose frame has home plate at its origin, x to the right of the way out and y minus the way out) a quarter turn from the way out to centre field. */
export const stadiumFrameHeading = (stadium: RealStadium): number => (stadiumKind(stadium) === "park" ? (stadium.osm.axis.heading + 90) % 360 : stadium.osm.axis.heading);

/** How the field lies in a stadium's building (see `StadiumOsm.axis`). */
export const stadiumOrientation = (stadium: RealStadium): StadiumOrientation => ({ heading: stadium.osm.axis.heading, basis: stadium.osm.axis.basis, north: round(northOn(stadiumFrameHeading(stadium))) });

/** The configuration a sport is: `cfl`, `nfl`, `soccer`, `mlb` or `boxing`, or `undefined` for a sport a stadium has no configuration for. */
export const stadiumConfigOf = (sport: string | undefined): StadiumConfigId | undefined => (sport === "cfl" || sport === "nfl" || sport === "soccer" || sport === "mlb" || sport === "boxing" ? sport : undefined);

/** The seats of a stadium for a configuration (0 for one it has none of). */
export const stadiumSeats = (stadium: RealStadium, config: StadiumConfigId): number => stadium.configs[config]?.seats ?? 0;

// ---- The bowl. ----

/** How far the first row is from a football field's footprint (the league's field and its end zones) along a side and at an end, and the corner's radius: the package's own gridiron profile (`crowd.ts`), so that a real stadium's first row is the usual one. */
const FIRST_ROW = { cfl: { side: 42, end: 28, corner: 60 }, nfl: { side: 40, end: 26, corner: 60 } } as const;
/** How far a hall's first row is from the box of the ring, on every side, in feet (ours: the seats at the ringside are a few feet from the ropes). */
export const HALL_FIRST_ROW = 8;
/** The height of the first row above the field, in feet, the rise of a bowl's rows by the number of bowls (what the lowest, a middle and the upper rise, at most), and the rise of the walk between two bowls (a suite level): ours, no source gives them. */
export const STADIUM_FIRST_HEIGHT = 5;
export const STADIUM_RISES: Readonly<Record<1 | 2 | 3, readonly number[]>> = { 1: [60], 2: [38, 62], 3: [32, 26, 56] };
export const STADIUM_WALK_RISE = 24;
/** The height a roof's rim stands over the top row, at the least, in feet. */
export const STADIUM_CLEARANCE = 22;
/** How far a canopy's low edge stands over the top row at the least, in feet: a bowl under a canopy is lowered to keep it. */
export const CANOPY_CLEARANCE = 6;
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
  /** The seats the bowls hold, by bowl, and in all: equal to the bowl's seats where the building has room (`fit` is `fits`). */
  seats: { tier: string; seats: number }[];
  total: number;
  /** The seats open in this configuration: the configuration's own, counted from the lowest bowl up (the rest of a larger bowl is closed). */
  open: number;
  /** The floor a seat takes in the plan, in square feet (one of `SEAT_AREAS`). */
  seatArea: number;
  fit: "fits" | "tight";
}

/** Plans already made, by stadium, configuration and field: a plan is a pure function of them, and a drawing asks for it more than once. */
const PLANS = new WeakMap<RealStadium, Map<string, StadiumPlan>>();

/**
 * The plan of a stadium's bowl for a configuration: the building's outline turned so that the field lies along x, a first row round a football field's footprint as a gridiron's stands have it, the largest bowl-shaped
 * outline that fits the building round the middle of the field, and between the two the bowls, the outer edge of each placed so that its band holds the share of the seats the sources give it, with a walk
 * between them. The bowl is the same building for every configuration (the seats of the configuration differ, and the field); where a bowl holds more seats than a configuration opens, the rest are closed.
 * @example
 * ```ts
 * import { planStadium, stadiumById } from "@johnmorrisdotca/kyogijo-stadiums/stadiums";
 * const plan = planStadium(stadiumById("bc-place")!, "soccer", { x: 0, y: 0, w: 344.5, h: 223.1 });
 * console.log(plan.orientation.basis, plan.seats.map((t) => `${t.tier} ${t.seats}`).join(", "), plan.total);
 * // opening lower 27695, upper 24802 52497
 * ```
 */
export function planStadium(stadium: RealStadium, config: StadiumConfigId, box: Box): StadiumPlan {
  if (stadiumKind(stadium) === "park") throw new Error(`${stadium.id} is a ballpark: planPark plans it`);
  if (stadium.configs[config] === undefined) throw new Error(`${stadium.id} has no configuration ${config}`);
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
  const kind = stadium.gridiron ?? "cfl";
  const gridiron = FOOTBALL[kind];
  const row = FIRST_ROW[kind];
  const length = gridiron.length + 2 * gridiron.endZone;
  // A hall's first row stands a little way from the ring's box on every side; a stadium's round a football field's footprint.
  const first: RRect =
    stadiumKind(stadium) === "hall"
      ? { kind: "rrect", x0: rink.x - HALL_FIRST_ROW, y0: rink.y - HALL_FIRST_ROW, x1: rink.x + rink.w + HALL_FIRST_ROW, y1: rink.y + rink.h + HALL_FIRST_ROW, r: HALL_FIRST_ROW }
      : { kind: "rrect", x0: at[0] - length / 2 - row.end, y0: at[1] - gridiron.width / 2 - row.side, x1: at[0] + length / 2 + row.end, y1: at[1] + gridiron.width / 2 + row.side, r: row.corner };
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

  const open = stadium.configs[config]?.seats ?? 0;
  const seatsTotal = stadium.bowlSeats ?? open;
  const count = Math.min(3, stadium.tiers.count) as 1 | 2 | 3;
  const lower = stadium.tiers.lowerSeats === undefined ? (count === 1 ? 1 : count === 2 ? LOWER_SHARE : 0.36) : stadium.tiers.lowerSeats / seatsTotal;
  const shares = count === 1 ? [1] : count === 2 ? [lower, 1 - lower] : [lower, (1 - lower) * 0.36, (1 - lower) * 0.64];
  const outlineAt = (t: number): RRect => between(first, outer, t);
  // A canopy's low edge is the least height the top row may reach (less the clearance): a bowl under a canopy is lowered, by the factor `vscale`, if it would not clear.
  const low = stadium.osm.canopies === undefined ? Infinity : Math.min(...stadium.osm.canopies.map((c) => (c.height - c.rise) * FEET_PER_METRE));
  const build = (area: number, vscale: number): { rings: StandRing[]; tight: boolean } => {
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
      const rise = Math.min(STADIUM_RISES[count][k] * vscale, Math.max(6, run * Math.tan((MAX_RAKE * Math.PI) / 180)));
      const h0 = k === 0 ? STADIUM_FIRST_HEIGHT : up + STADIUM_WALK_RISE * vscale;
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
  const heightOf = (made: { rings: StandRing[] }): number => made.rings[made.rings.length - 1].height[1];
  let seatArea: number = SEAT_AREAS[0];
  let made = build(seatArea, 1);
  for (const area of SEAT_AREAS.slice(1)) {
    if (!made.tight) break;
    seatArea = area;
    made = build(area, 1);
  }
  // (A bowl's rise is capped by its rake, so lowering it is not in proportion: a few rounds bring the top row under the canopy.)
  let vscale = 1;
  for (let pass = 0; pass < 10 && heightOf(made) > low - CANOPY_CLEARANCE + 0.5; pass += 1) {
    vscale = Math.max(0.1, vscale * ((low - CANOPY_CLEARANCE - STADIUM_FIRST_HEIGHT) / (heightOf(made) - STADIUM_FIRST_HEIGHT)));
    made = build(seatArea, vscale);
  }
  const { rings, tight } = made;
  // The rounding of each bowl's seats leaves the total a seat or two off the bowl's: the last bowl takes the difference.
  const missing = seatsTotal - rings.reduce((sum, ring) => sum + ring.seats, 0);
  if (!tight && Math.abs(missing) <= 3) rings[rings.length - 1].seats += missing;
  // Where a source gives the seats of the lowest bowl, that bowl holds them to the seat (the rounding of its area leaves it one or two off) and the last bowl the rest.
  if (!tight && stadium.tiers.lowerSeats !== undefined && rings.length > 1) {
    const off = stadium.tiers.lowerSeats - rings[0].seats;
    if (off !== 0 && Math.abs(off) <= 3) {
      rings[0].seats += off;
      rings[rings.length - 1].seats -= off;
    }
  }
  const total = rings.reduce((sum, ring) => sum + ring.seats, 0);
  // A configuration that opens fewer seats than the bowl holds opens them from the lowest bowl up: a bowl's people are its open share of them, and a closed one is empty.
  if (open < seatsTotal) {
    let before = 0;
    for (const ring of rings) {
      ring.fill = round(ring.fill * Math.min(1, Math.max(0, (open - before) / Math.max(1, ring.seats))), 3);
      before += ring.seats;
    }
  }
  const top = rings[rings.length - 1].height[1];
  const roof = stadium.osm.roof;
  const rise = roof?.rise === undefined ? 0 : round(roof.rise * FEET_PER_METRE);
  // The rim of a roof stands where OpenStreetMap maps it (its height less the roof's own rise), and at the least over the top row by a roof's clearance; a canopy's building has walls to the top row and a little over it.
  const mapped = roof?.height === undefined ? 0 : round((roof.height - (roof.rise ?? 0)) * FEET_PER_METRE);
  const edge = stadium.roof.kind === "canopy" ? round(top + CANOPY_CLEARANCE) : Math.max(mapped, top + STADIUM_CLEARANCE);
  const cable = stadium.roof.kind === "cable" && opening !== undefined && rise > 0;
  const canopies = stadium.roof.kind === "canopy" && stadium.osm.canopies !== undefined ? stadium.osm.canopies.map((c) => ({ ring: place(turned(c.ring)), low: round((c.height - c.rise) * FEET_PER_METRE), rise: round(c.rise * FEET_PER_METRE) })) : undefined;
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
      roof: cable ? "cable" : canopies === undefined ? "fixed" : "canopy",
      edge,
      ...(cable ? { crown: { rise, opening } } : {}),
      ...(canopies === undefined ? {} : { canopies }),
    },
  };
  return { stadium, config, orientation, box: rink, footprint, opening, bowl, seats: rings.map((ring) => ({ tier: ring.tier, seats: ring.seats })), total, open, seatArea, fit: tight ? "tight" : "fits" };
}

/** The stands of a stadium for `layoutOf` and the 3D view, round a field: `planStadium`'s bowl. */
export const stadiumBowl = (stadium: RealStadium, config: StadiumConfigId, box: Box): RealBowl => planStadium(stadium, config, box).bowl;

/** Whether the bowl lies inside the building: every corner of every bowl's outer edge is inside the footprint. */
export function stadiumBowlInside(plan: StadiumPlan): boolean {
  return outlinePoints(plan.bowl.rings[plan.bowl.rings.length - 1].region).every((p) => inside(plan.footprint, p));
}

// ---- A ballpark. ----

/** The plan of a ballpark: its usual stands (`parkLayout`), the depth of each band set so that it holds the seats the article gives for its level, and the building, the way home plate faces and the roof round them. */
export interface ParkPlan {
  stadium: RealStadium;
  config: StadiumConfigId;
  orientation: StadiumOrientation;
  /** The building's outline in feet, in the park's frame (home plate at its origin, x to the right of the way out to centre field, y minus the way out). */
  footprint: Pt[];
  /** The stands, with the building and the roof (`real`). */
  stands: CrowdStands;
  /** The depth of each band of stands the seats gave, in feet. */
  depths: { lower: number; upper: number; bleachers: number };
  /** The seats each band holds, and in all, against the configuration's. */
  seats: { tier: string; seats: number }[];
  total: number;
  /** The floor a seat takes in the plan, in square feet: 4.6 as the usual stands have it, less where the building is too small for them and the bowl is steeper. */
  seatArea: number;
  /** Whether the stands hold the configuration's seats to within two percent. */
  fit: "fits" | "tight";
}

const PARK_PLANS = new WeakMap<RealStadium, Map<string, ParkPlan>>();

/** The share of a ballpark's building the closed roof covers, and the share of its width along the east side the open roof's sections rest over (ours: the article says where they rest, not how much). */
const PARK_COVER = 0.92;
/** How far an open-air ballpark's walls stand over its top row, in feet (ours). */
const OPEN_WALL_OVER = 6;
const PARK_PARKED = 0.3;

/**
 * The plan of a ballpark from what its stands are laid from (`input`: the park's fence, the backstop and the crowd): the usual stands with each band as deep as its seats need, the building's outline turned so that home
 * plate faces where OpenStreetMap's infield and the outline say, and the roof: sections far over the field, closed over the stands and the field or resting over the east side where the article says they rest.
 */
export function planPark(stadium: RealStadium, input: ParkInput): ParkPlan {
  if (stadiumKind(stadium) !== "park") throw new Error(`${stadium.id} is not a ballpark`);
  const key = JSON.stringify([input.fence, input.backstop, input.crowd.shape, input.crowd.awayEnd, input.crowd.tifo, input.crowd.gaps, input.seatsOnWalls ?? null]);
  const mine = PARK_PLANS.get(stadium) ?? new Map<string, ParkPlan>();
  PARK_PLANS.set(stadium, mine);
  const known = mine.get(key);
  if (known !== undefined) return known;
  const made = park(stadium, input);
  mine.set(key, made);
  return made;
}

function park(stadium: RealStadium, input: ParkInput): ParkPlan {
  const config: StadiumConfigId = "mlb";
  const seats = stadium.configs.mlb?.seats ?? 0;
  const bands = stadium.tiers.tierSeats ?? { lower: seats * 0.45, upper: seats * 0.47, bleachers: seats * 0.08 };
  const sum = bands.lower + bands.upper + bands.bleachers;
  const wanted = { lower: (bands.lower / sum) * seats, upper: (bands.upper / sum) * seats, bleachers: (bands.bleachers / sum) * seats };
  const orientation = stadiumOrientation(stadium);
  const frameHeading = stadiumFrameHeading(stadium);
  // The building in the park's frame, in feet: home plate at the origin.
  const origin = middleOf(lonLat(stadium.osm.ring));
  const world = metresFrom(origin, lonLat(stadium.osm.ring));
  const [home] = metresFrom(origin, [stadium.osm.axis.centre]);
  const frameOf = (p: Pt): Pt => {
    const [x, y] = turnedTo(frameHeading, [p[0] - home[0], p[1] - home[1]]);
    return [round(x * FEET_PER_METRE, 2), round(y * FEET_PER_METRE, 2)];
  };
  const footprint = world.map(frameOf);
  const fb = boxOf(footprint);
  // Each band is as deep as holds its seats: the usual depths scaled by what the seats of the band are to what the band holds, a few rounds over (a band's seats grow with its depth). The usual depths
  // take a seat to be 4.6 square feet of plan; a building too small for them has a steeper bowl, in which a seat takes less (the factors of `SEAT_AREAS`, as an arena's bowl), until the stands fit inside it.
  let depths = { lower: 60, upper: 56, bleachers: 54 };
  let stands = parkLayout({ ...input, depths });
  let factor = 1;
  for (const f of [1, ...SEAT_AREAS.map((area) => 4.6 / area)]) {
    factor = f;
    depths = { lower: 60, upper: 56, bleachers: 54 };
    stands = parkLayout({ ...input, depths });
    for (let i = 0; i < 12; i += 1) {
      const held = (id: string): number => (stands.rings.find((r) => r.id === id)?.seats ?? 0) * f;
      const next = { lower: depths.lower * (wanted.lower / Math.max(1, held("lower"))), upper: depths.upper * (wanted.upper / Math.max(1, held("upper"))), bleachers: depths.bleachers * (wanted.bleachers / Math.max(1, held("bleachers"))) };
      for (const k of ["lower", "upper", "bleachers"] as const) depths[k] = Math.min(160, Math.max(20, next[k]));
      stands = parkLayout({ ...input, depths });
    }
    if (stands.rings.every((r) => [r.region, ...(r.more ?? [])].every((o) => o.kind !== "poly" || o.points.every((p) => inside(footprint, p))))) break;
  }
  if (factor !== 1) {
    for (const ring of stands.rings) ring.seats = Math.round(ring.seats * factor);
    stands.seats = stands.rings.reduce((n, r) => n + r.seats, 0);
  }
  const total = stands.rings.reduce((n, r) => n + r.seats, 0);
  const box = stands.box;
  const c: Pt = [box.x + box.w / 2, box.y + box.h / 2];
  const north = orientation.basis === "none" ? undefined : orientation.north;
  const room = north === undefined ? 0 : NORTH_ROOM;
  const hall = { kind: "rrect" as const, x0: fb.x0 - 30, y0: fb.y0 - 30, x1: fb.x1 + 30, y1: fb.y1 + 30, r: 0 };
  const top = Math.max(...stands.rings.map((r) => r.height[1]));
  const ivy = stadium.looks?.ivyWalls === undefined ? {} : { ivy: true };
  let shell: RealShell;
  if (stadium.roof.kind === "dome") {
    // An air-supported roof: the membrane over the outline OpenStreetMap maps for it, standing at the height of its rim (the building's height less the roof's own rise) and rising to the building's height.
    const mapped = stadium.osm.roof;
    if (mapped?.ring === undefined || mapped.height === undefined || mapped.rise === undefined) throw new Error(`${stadium.id} has a dome roof and no mapped roof`);
    const rim = metresFrom(origin, lonLat(mapped.ring)).map(frameOf);
    const low = round((mapped.height - mapped.rise) * FEET_PER_METRE);
    shell = { footprint, hall, ...(north === undefined ? {} : { north }), roof: "dome", edge: low, wall: low, dome: { rim, low, crown: round(mapped.height * FEET_PER_METRE) }, ...ivy };
  } else if (stadium.roof.kind === "open") {
    // No roof: the walls stand a little over the top row.
    const wall = round(Math.max(top + OPEN_WALL_OVER, (stadium.osm.height ?? 0) * FEET_PER_METRE));
    shell = { footprint, hall, ...(north === undefined ? {} : { north }), roof: "open", edge: wall, wall, ...ivy };
  } else {
    const cover = footprint.map((p): Pt => [c[0] + (p[0] - c[0]) * PARK_COVER, c[1] + (p[1] - c[1]) * PARK_COVER]);
    // Where the sections rest: the east side of the building, over the railway there (the article says so): the strip of the outline east of a share of its width.
    const [wx0, wx1] = [Math.min(...world.map((p) => p[0])), Math.max(...world.map((p) => p[0]))];
    const [wy0, wy1] = [Math.min(...world.map((p) => p[1])), Math.max(...world.map((p) => p[1]))];
    const strip = clipConvex(world, [[wx1 - (wx1 - wx0) * PARK_PARKED, wy0 - 1], [wx1 + 1, wy0 - 1], [wx1 + 1, wy1 + 1], [wx1 - (wx1 - wx0) * PARK_PARKED, wy1 + 1]]);
    const parked = strip.map(frameOf);
    const wallFeet = round((stadium.osm.height ?? 20) * FEET_PER_METRE);
    shell = { footprint, hall, ...(north === undefined ? {} : { north }), roof: "panels", edge: wallFeet, wall: wallFeet, panels: { cover, bottom: stadium.roof.bottom ?? 217, top: stadium.roof.top ?? 269, parked }, ...ivy };
  }
  const reach = {
    left: Math.max(stands.reach.left, box.x - fb.x0),
    right: Math.max(stands.reach.right, fb.x1 - box.x - box.w),
    top: Math.max(stands.reach.top, box.y - fb.y0) + room,
    bottom: Math.max(stands.reach.bottom, fb.y1 - box.y - box.h),
  };
  const real: CrowdStands = { ...stands, real: shell, reach };
  return { stadium, config, orientation, footprint, stands: real, depths: { lower: round(depths.lower), upper: round(depths.upper), bleachers: round(depths.bleachers) }, seats: stands.rings.map((r) => ({ tier: r.id, seats: r.seats })), total, seatArea: round(4.6 / factor, 1), fit: Math.abs(total - seats) / seats <= 0.02 ? "fits" : "tight" };
}
