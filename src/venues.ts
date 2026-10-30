// The real venues: for an arena of the NHL, the outline of its building and the way its rink lies in it (from OpenStreetMap, ODbL 1.0), and a bowl of the seats, the number of seating levels and the kind of roof
// the sources give (Wikidata, CC0, and the English Wikipedia article each fact cites), fitted inside the outline. Level one is the building: its outline and orientation, as OpenStreetMap maps them. Level two is a plausible
// bowl: a number of seats in the number of tiers the sources say, between the rink's boards and the building's wall, under the roof's kind. It stops there: no team's or ticket seller's seat map is read or copied, no
// section or row is named, and no mark of a team or a league is drawn. The drawing is `drawKyogijo({ sport: "nhl", arena, crowd: { real: true } })` and, in 3D, the same options in `buildTurn` or `mountTurn`.
import { heldArena, arenaRinkIn, type Arena, type ArenaSource } from "./arenas.core.ts";
import { NORTH_ROOM, aislesOf, areaOfOutline, outlinePoints, type Box, type Outline, type Pt, type RealBowl, type StandRing } from "./crowd.ts";
import { NHL, FEET_PER_METRE } from "./geometry.ts";
import { boxOf, edgeDistance, inside, metresFrom, middleOf, northOn, turnedTo, type LonLat } from "./venues.geo.ts";
import { VENUE_INDEX } from "./venues.index.ts";

/** The credit the ODbL asks for, wherever a drawing made from OpenStreetMap's data is shown. */
export const VENUE_ATTRIBUTION = "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright";

/** How a fact is known: `documented` is what a source cited with it says; `plausible` is ours, for a bowl no source describes. */
export type VenueBasis = "documented" | "plausible";

/** The kinds of roof the venues have: `fixed` is a lid over the bowl, `saddle` a roof that rises at the two ends and falls at the two sides (the Scotiabank Saddledome's), `barrel` a barrel vault along the rink, a round arch over its short axis (the American Airlines Center's). */
export type VenueRoof = "fixed" | "saddle" | "barrel";

/** The NHL's divisions, in the order of the league's own listing: the Western Conference's two, then the Eastern's. A division none of whose arenas has a venue yet has no venues in `venuesIn`. */
export const VENUE_DIVISIONS = ["pacific", "central", "atlantic", "metropolitan"] as const;
export type VenueDivision = (typeof VENUE_DIVISIONS)[number];

/** The NHL's two conferences, and the divisions of each. */
export const VENUE_CONFERENCES = { western: ["pacific", "central"], eastern: ["atlantic", "metropolitan"] } as const satisfies Record<string, readonly VenueDivision[]>;
export type VenueConference = keyof typeof VENUE_CONFERENCES;

/** The facts of a venue: the seats and the number of seating levels and the kind of roof, each with what a source says. No text of an article is kept. */
export interface RealVenueData {
  /** The key of the arena in `ARENAS`: `honda-center`. */
  id: string;
  /** The Wikidata item of the arena. */
  wikidata: string;
  division: VenueDivision;
  /** The English Wikipedia article the facts that are not Wikidata's were read from, at a revision. */
  en: ArenaSource;
  seats: {
    /** The seats for ice hockey: Wikidata's where its item gives a figure for ice hockey (`wikidata`), else the article's (`wikipedia`). */
    hockey: number;
    source: "wikidata" | "wikipedia";
    /** Wikidata's own capacity (P1083), kept beside it: it is often for another event, or an older year; `null` where the item gives none (the Little Caesars Arena's, the UBS Arena's). */
    wikidata: number | null;
    /** What was read, in a few words of ours. */
    read: string;
  };
  tiers: {
    /** The seating levels (bowls), with the suites and the clubs that lie between them counted as walks, not tiers. */
    count: 1 | 2 | 3;
    basis: VenueBasis;
    /** The share of the seats that are in the lowest tier, where a source gives it. */
    lowerShare?: number;
    read: string;
  };
  /** The building's lower band, a podium under the upper levels: its height in feet and how it is known (ours where the sources do not say). */
  facade?: { podium: number; unit: "ft"; basis: VenueBasis; read: string };
  roof: { kind: VenueRoof; basis: VenueBasis; read: string; /** A long skylight over the middle of the roof, closed in round it: drawn where the venue says so (ours). */ skylight?: boolean };
}

/** What OpenStreetMap gave of a venue: ODbL 1.0 data, "(c) OpenStreetMap contributors". */
export interface VenueOsm {
  /** The element the outline is: `way/120623151`. */
  source: string;
  /** The day it was read and the time of the OpenStreetMap data the answer was made from. */
  read: string;
  base: string;
  licence: "ODbL-1.0";
  attribution: string;
  /** The building's height in metres, where OpenStreetMap maps one. */
  height?: number;
  /** The building's outline as `[longitude, latitude]`, not repeating its first point. */
  ring: [number, number][];
  /** The ice, where OpenStreetMap maps it inside the building: the element and its outline. */
  ice?: { source: string; ring: [number, number][] };
  /**
   * How the rink lies, worked out when the data was made: the heading of its long side (degrees clockwise from north, 0 to under 180), how that is known (`mapped`: from the ice OpenStreetMap maps; `building`: from the long
   * axis of the building's main hall, the largest rectangle that fits its outline, which a rink usually follows, an inference; `none`: the building has no direction, 90 is stood in), how much of a direction the building has
   * (`strength`, 1 for a round one) and how much longer than wide its main hall is (`elongation`), and the middle of the ice or of the main hall as `[longitude, latitude]`.
   */
  axis: { heading: number; basis: "mapped" | "building" | "none"; strength: number; elongation: number; centre: [number, number] };
}

/** A venue: its facts and what OpenStreetMap gave. */
export interface RealVenue extends RealVenueData {
  osm: VenueOsm;
}

/** How the rink lies in the building: its long side's heading (degrees clockwise from north, 0 to under 180), how that is known, and the way north points on the page (degrees clockwise from the top). */
export interface VenueOrientation {
  heading: number;
  /** `mapped`: from the ice OpenStreetMap maps in the building. `building`: from the building's long axis, which a rink usually follows (an inference). `none`: the building is near round, nothing is known, the plan has north at the top. */
  basis: "mapped" | "building" | "none";
  north: number;
}

const HELD: Record<string, RealVenue> = {};

/**
 * The real venues held for the drawing, by key: every venue in the entries that have always had them (the full table, `venues.all.ts`, fills it), and in the lean district the venues `loadVenueDataFor` has read. Do not write to it.
 * @example
 * ```ts
 * import { VENUES } from "@johnmorrisdotca/kyogijo-stadiums/venues";
 * console.log(VENUES["honda-center"].seats.hockey);
 * // 17174
 * ```
 */
export const VENUES: Readonly<Record<string, RealVenue>> = HELD;

/** Hold venues for the drawing, from their facts and what OpenStreetMap gave (the same key in each): a later one with a key replaces the earlier. Returns the venues as held. */
export function registerVenues(data: readonly RealVenueData[], osm: Readonly<Record<string, VenueOsm>>): RealVenue[] {
  return data.map((one) => (HELD[one.id] = Object.freeze({ ...one, osm: osm[one.id] })));
}

/** The keys of `VENUES`, in the order of the data. */
export const VENUE_IDS: readonly string[] = Object.freeze(Object.keys(VENUE_INDEX));

const reading = new Map<string, Promise<RealVenue>>();

/** A venue by its key, read from its two files (the facts, and what OpenStreetMap gave) the first time and held for the drawing after: asking again gives the same promise. A key that is not a venue rejects, naming the keys there are. */
export function loadVenue(id: string): Promise<RealVenue> {
  const held = Object.hasOwn(HELD, id) ? HELD[id] : undefined;
  if (held !== undefined) return Promise.resolve(held);
  const found = reading.get(id);
  if (found !== undefined) return found;
  if (!Object.hasOwn(VENUE_INDEX, id)) return Promise.reject(new Error(`no venue ${JSON.stringify(id)}: the venues are ${VENUE_IDS.join(", ")}`));
  const promise = VENUE_INDEX[id].load().then(([facts, outline]) => registerVenues([facts.VENUE], { [id]: outline.OSM })[0]);
  reading.set(id, promise);
  promise.catch(() => reading.delete(id));
  return promise;
}

/** The venue of an arena (by its key in `ARENAS`), or `undefined` for an arena that has none. A venue that has not been read yet (the lean district reads them with `loadVenueDataFor`) throws, saying so. */
export const venueById = (id: string | undefined): RealVenue | undefined => {
  if (id === undefined) return undefined;
  if (Object.hasOwn(HELD, id)) return HELD[id];
  if (Object.hasOwn(VENUE_INDEX, id)) throw new Error(`the venue ${id} is not read yet: await loadVenueDataFor([${JSON.stringify(id)}]) before the first call of the lean district that draws it, or use an entry that holds every venue (the main entry, or any but the lean district's)`);
  return undefined;
};

/** The venue whose arena is the Wikidata item `Q774138`, or `undefined`. */
export const venueByWikidata = (wikidata: string | undefined): RealVenue | undefined => Object.values(VENUES).find((venue) => venue.wikidata === wikidata);

/** The venues of a division of the NHL, in the order of the data. */
export const venuesIn = (division: VenueDivision): RealVenue[] => Object.values(VENUES).filter((venue) => venue.division === division);

/** The conference a division of the NHL is in. */
export const conferenceOf = (division: VenueDivision): VenueConference => (VENUE_CONFERENCES.western as readonly VenueDivision[]).includes(division) ? "western" : "eastern";

/** The venues of a conference of the NHL, division by division, in the order of the data. */
export const venuesInConference = (conference: VenueConference): RealVenue[] => VENUE_CONFERENCES[conference].flatMap((division) => venuesIn(division));

/** The arena a venue is of. */
export const arenaOfVenue = (venue: RealVenue): Arena => {
  const arena = heldArena(venue.id);
  if (arena === undefined) throw new Error(`${venue.id} is not an arena`);
  return arena;
};

const round = (value: number, places = 1): number => Math.round(value * 10 ** places) / 10 ** places;
const lonLat = (ring: readonly (readonly [number, number])[]): LonLat[] => ring.map(([lon, lat]) => [lon, lat]);

/** How the rink lies in a venue's building (see `VenueOsm.axis`). */
export const venueOrientation = (venue: RealVenue): VenueOrientation => ({ heading: venue.osm.axis.heading, basis: venue.osm.axis.basis, north: round(northOn(venue.osm.axis.heading)) });

// ---- The bowl. ----

/** The rink's box as the drawing has it: the arena's own where its sources publish a size, else the NHL's. */
export function venueRink(venue: RealVenue): Box {
  const sized = arenaRinkIn(heldArena(venue.id));
  return { x: 0, y: 0, w: sized?.length ?? NHL.length, h: sized?.width ?? NHL.width };
}

/** How far the first row is from the boards at the sides and at the ends, and the bench side's extra, and the corner's radius: the NHL profile of `crowd.ts`, so that a real venue's first row is the usual one. */
const FIRST_ROW = { side: 8, end: 8, bench: 6, corner: 40 } as const;
/** The floor a seat takes in plan, in square feet (ours): a bowl of today's arenas is steeper than the usual drawing's, whose seat is 2 by 2.3 feet (4.6), so that a seat takes less of the floor's area. Tried in turn: a building
 * with room for the seats at the first has the first; one with less has a steeper bowl, to the last, which is the least a seat takes. */
export const SEAT_AREAS: readonly number[] = [3.8, 3.4, 3];
/** How far the bowl's outer edge keeps from the building's wall, in feet (ours: the wall and the walk round the bowl). */
export const WALL = 10;
/** How far the hall's wall stands beyond the bowl's outer edge, in feet, where the building's outline allows: the concourse and the wall, ours. */
export const HALL = 30;
/** The walk between two tiers, in feet (ours: a suite level or a club between two bowls). */
export const GAP = 10;
/** The share of the seats in the lowest tier where no source says: a lower bowl is a little more than half. */
const LOWER_SHARE = 0.56;
/** A bowl's outer corners, as a share of its half-depth (ours). */
const CORNER = 0.75;
/** The height of the first row above the ice, in feet, the rise of a tier's rows by the number of tiers (what the lowest, a middle and the upper bowl rise, at most), the rise of the walk between two tiers (a suite level), and the steepest a bowl is raked, in degrees (ours: no source gives them). */
export const FIRST_HEIGHT = 4;
export const RISES: Readonly<Record<1 | 2 | 3, readonly number[]>> = { 1: [40], 2: [26, 40], 3: [24, 20, 36] };
export const WALK_RISE = 16;
export const MAX_RAKE = 36;
const TIER_IDS: Readonly<Record<1 | 2 | 3, readonly ("lower" | "middle" | "upper")[]>> = { 1: ["lower"], 2: ["lower", "upper"], 3: ["lower", "middle", "upper"] };
/** How many of a tier's seats are taken, relative to the stands' (the upper tiers are emptier), as `crowd.ts` has them. */
const FILL: Readonly<Record<"lower" | "middle" | "upper", number>> = { lower: 1, middle: 0.94, upper: 0.88 };
/** The height a roof's edge stands over the top row, at the least, in feet. */
export const CLEARANCE = 22;

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

/** The plan of a venue: its building in the drawing's frame, the bowl fitted inside, and how it lies. */
export interface VenuePlan {
  venue: RealVenue;
  orientation: VenueOrientation;
  /** The rink, in the drawing's frame. */
  box: Box;
  /** The building's outline in feet, in the drawing's frame (the rink along x, in the middle of the building's box). */
  footprint: Pt[];
  /** The stands for `layoutOf`: tiers, first row, ground, and the building and roof. */
  bowl: RealBowl;
  /** The seats the bowl's tiers hold, by tier, and in all: equal to the venue's seats where the building has room (`fit` is `fits`) and fewer where it has not (`tight`). */
  seats: { tier: string; seats: number }[];
  total: number;
  /** The floor a seat takes in the plan, in square feet (one of `SEAT_AREAS`). */
  seatArea: number;
  fit: "fits" | "tight";
}

/**
 * The plan of a venue's bowl: the building's outline turned so that the rink lies along x, a first row round the rink as an NHL arena has it, the largest bowl-shaped outline that fits the building round the middle of its main
 * hall, and between the two the tiers, the outer edge of each placed so that its band holds the share of the venue's seats the sources give it (at `SEAT_AREAS` square feet a seat), with a walk between the tiers. The
 * bowl is as long and wide as the building lets it be and as round at the corners as a bowl is; the rest is the building's.
 * @example
 * ```ts
 * import { planVenue, venueById } from "@johnmorrisdotca/kyogijo-stadiums/venues";
 * const plan = planVenue(venueById("honda-center")!);
 * console.log(plan.orientation.basis, plan.seats.map((t) => t.tier).join(" "), plan.total);
 * // building lower upper 17174
 * ```
 */
export function planVenue(venue: RealVenue, rink: Box = venueRink(venue)): VenuePlan {
  const key = `${rink.x}|${rink.y}|${rink.w}|${rink.h}`;
  const mine = PLANS.get(venue) ?? new Map<string, VenuePlan>();
  PLANS.set(venue, mine);
  const known = mine.get(key);
  if (known !== undefined) return known;
  const made = plan(venue, rink);
  mine.set(key, made);
  return made;
}

/** Plans already made, by venue and rink: a plan is a pure function of a venue and a rink, and a drawing asks for it more than once. */
const PLANS = new WeakMap<RealVenue, Map<string, VenuePlan>>();

function plan(venue: RealVenue, rink: Box): VenuePlan {
  const orientation = venueOrientation(venue);
  const origin = middleOf(lonLat(venue.osm.ring));
  const turned = (ring: readonly (readonly [number, number])[]): Pt[] => metresFrom(origin, lonLat(ring)).map((p) => turnedTo(orientation.heading, p));
  const outline = turned(venue.osm.ring);
  // The rink stands in the middle of the ice where OpenStreetMap maps it, else in the middle of the building's main hall.
  const [middle] = turned([venue.osm.axis.centre]);
  const at: Pt = [rink.x + rink.w / 2, rink.y + rink.h / 2];
  const footprint = outline.map(([x, y]): Pt => [round((x - middle[0]) * FEET_PER_METRE + at[0], 2), round((y - middle[1]) * FEET_PER_METRE + at[1], 2)]);
  const fb = boxOf(footprint);

  // The first row round the rink, and the largest bowl-shaped outline that fits inside the building round the middle of the hall: as much longer than wide as the hall is, and as round at the corners as a bowl is.
  const first: RRect = { kind: "rrect", x0: rink.x - FIRST_ROW.end, y0: rink.y - FIRST_ROW.side, x1: rink.x + rink.w + FIRST_ROW.end, y1: rink.y + rink.h + FIRST_ROW.side + FIRST_ROW.bench, r: FIRST_ROW.corner };
  // The aspect that holds the most: a bowl is between 1.15 and 1.6 times as long as it is wide, as much as the hall allows.
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
  const lo = best.s;
  const shaped = (s: number): RRect => shapedAs(best.long, s);
  const wall = shaped(lo);
  // A building too small for the first row and a tier's depth is given the room: the bowl then lies beyond its walls (`fit` says so).
  const outer: RRect = { ...wall, x0: Math.min(wall.x0, first.x0 - 40), y0: Math.min(wall.y0, first.y0 - 40), x1: Math.max(wall.x1, first.x1 + 40), y1: Math.max(wall.y1, first.y1 + 40) };
  const depth = (first.x0 - outer.x0) + (first.y0 - outer.y0) + (outer.x1 - first.x1) + (outer.y1 - first.y1);
  const gap = GAP / Math.max(20, depth / 4);

  // The tiers, from the rink out: each takes its share of the seats, then the walk. A building with less room than the seats need at the first of `SEAT_AREAS` a seat gets a bowl that is steeper (a seat takes less of the floor), down
  // to the least a seat can take; where even that is too little the bowl holds fewer seats than the venue and `fit` says `tight`.
  const count = venue.tiers.count;
  const lower = venue.tiers.lowerShare ?? (count === 1 ? 1 : count === 2 ? LOWER_SHARE : 0.4);
  const shares = count === 1 ? [1] : count === 2 ? [lower, 1 - lower] : [lower, (1 - lower) * 0.36, (1 - lower) * 0.64];
  const outlineAt = (t: number): RRect => between(first, outer, t);
  const build = (area: number): { rings: StandRing[]; tight: boolean } => {
    const seatsOf = (region: Outline, hole: Outline): number => Math.round((areaOfOutline(region) - areaOfOutline(hole)) / area);
    const rings: StandRing[] = [];
    let t0 = 0;
    let tight = false;
    let up = FIRST_HEIGHT;
    shares.forEach((share, k) => {
      const wanted = venue.seats.hockey * share;
      const t1 = solveFor((t) => seatsOf(outlineAt(t), outlineAt(t0)), t0, 1, wanted);
      if (seatsOf(outlineAt(t1), outlineAt(t0)) < wanted - 1) tight = true;
      const region = outlineAt(t1);
      const hole = outlineAt(t0);
      const tier = TIER_IDS[count][k];
      // The band's depth along the two long sides on average, where the bowl is the shallowest and the rake the steepest: the rise is what a rake of at most `MAX_RAKE` degrees gives over it, up to the usual rise of a tier of its place.
      const run = (region.y1 - hole.y1 + (hole.y0 - region.y0)) / 2;
      const rise = Math.min(RISES[count][k], Math.max(6, run * Math.tan((MAX_RAKE * Math.PI) / 180)));
      const [h0, h1] = [k === 0 ? FIRST_HEIGHT : up + WALK_RISE, (k === 0 ? FIRST_HEIGHT : up + WALK_RISE) + rise];
      up = h1;
      rings.push({
        id: tier,
        tier,
        region,
        hole,
        // Its depth at the bench side, from the first row, as the tunnel and the camera are placed.
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
  // The rounding of each tier's seats leaves the total a seat or two off the venue's: the last tier takes the difference, so that a bowl that fits holds exactly the seats the sources give.
  const missing = venue.seats.hockey - rings.reduce((sum, ring) => sum + ring.seats, 0);
  if (!tight && Math.abs(missing) <= 3) rings[rings.length - 1].seats += missing;
  const total = rings.reduce((sum, ring) => sum + ring.seats, 0);
  const top = rings[rings.length - 1].height[1];
  const edge = Math.max(round((venue.osm.height ?? 0) * FEET_PER_METRE), top + CLEARANCE);
  const north = orientation.basis === "none" ? undefined : orientation.north;
  const room = north === undefined ? 0 : NORTH_ROOM;
  const bowl: RealBowl = {
    rings,
    off: { left: FIRST_ROW.end, right: FIRST_ROW.end, top: FIRST_ROW.side, bottom: FIRST_ROW.side + FIRST_ROW.bench },
    reach: { left: Math.max(0, rink.x - fb.x0), right: Math.max(0, fb.x1 - rink.x - rink.w), top: Math.max(0, rink.y - fb.y0) + room, bottom: Math.max(0, fb.y1 - rink.y - rink.h) },
    shell: { footprint, hall: { ...outer, x0: outer.x0 - HALL, y0: outer.y0 - HALL, x1: outer.x1 + HALL, y1: outer.y1 + HALL, r: outer.r + HALL }, ...(north === undefined ? {} : { north }), roof: venue.roof.kind, edge, ...(venue.facade === undefined ? {} : { podium: venue.facade.podium }), ...(venue.roof.skylight === true ? { skylight: true } : {}) },
  };
  return { venue, orientation, box: rink, footprint, bowl, seats: rings.map((ring) => ({ tier: ring.tier, seats: ring.seats })), total, seatArea, fit: tight ? "tight" : "fits" };
}

/** The stands of a venue for `layoutOf` and the 3D view, round a rink: `planVenue`'s bowl. */
export const venueBowl = (venue: RealVenue, rink?: Box): RealBowl => planVenue(venue, rink).bowl;

/** Whether the bowl lies inside the building: every corner of every tier's outer edge is inside the footprint. */
export function bowlInside(plan: VenuePlan): boolean {
  return outlinePoints(plan.bowl.rings[plan.bowl.rings.length - 1].region).every((p) => inside(plan.footprint, p));
}
