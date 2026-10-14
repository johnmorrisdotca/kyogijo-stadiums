// What a pool is for a set of options: the sport's figures from the rules (pool.figures.ts) with the lanes, the ropes, the boards and the look the options ask for, in metres, in the frame of a drawing
// lying wide (x along the pool from the starting wall on the left, y across it from the top side wall). Kept apart from the drawing so that the outline, the description, the replay and the charts agree.
import { ARTISTIC, DIVING, SWIMMING, SWIMMING_WIDTHS, WATER_POLO } from "./pool.figures.ts";
import { racePlan, type RacePlan } from "./pool.race.ts";
import type { DeckLook, DivingPlatform, PoolKind, PoolLook, PoolSport, PoolStyle, VenueOptions, VenuePool } from "./pool.types.ts";
import type { SurfaceOptions } from "./types.ts";
import { FEET_PER_METRE } from "./geometry.ts";

/** The sports of the pool, in the order a menu lists them. */
export const POOL_SPORTS: readonly PoolSport[] = Object.freeze(["swimming", "waterpolo", "diving", "artisticswimming"] as const);

/** True for a sport whose surface is a pool. */
export const isPoolSport = (sport: unknown): sport is PoolSport => typeof sport === "string" && (POOL_SPORTS as readonly string[]).includes(sport);

/** Metres as feet, the unit a drawing is made in. */
export const feet = (metres: number): number => metres * FEET_PER_METRE;

const LOOKS: readonly PoolLook[] = ["flat", "water", "tiled"];
const DECKS: readonly DeckLook[] = ["plain", "tiled"];
const PLATFORMS: readonly DivingPlatform[] = [1, 3, 5, 7.5, 10];

/** The colours of the ropes of a pool, by name. */
export type RopeColour = "green" | "blue" | "yellow";

/** A lane rope: where it lies across the pool (metres from the top wall) and its colour. */
export interface Rope {
  y: number;
  colour: RopeColour;
}

/** A lane: its number, the middle of its marking on the floor, and its two edges, in metres from the top wall. */
export interface LanePlan {
  number: number;
  y: number;
  top: number;
  bottom: number;
}

/** The look and the extras every pool has. */
export interface Common {
  look: PoolLook;
  deck: DeckLook;
  seed: number;
}

/** A swimming pool to draw. */
export interface SwimPlan extends Common {
  sport: "swimming";
  kind: PoolKind;
  course: "long" | "short";
  /** The length between the touch panels and the width across the lanes and the spaces, in metres. */
  length: number;
  width: number;
  /** The lanes from the top of the drawing down: lane 1 (or 0) is at the bottom, on the right when one faces the course from the start (CR 16.1.9). */
  lanes: LanePlan[];
  /** The metres of space outside the first and the last lane. */
  space: number;
  ropes: Rope[];
  blocks: boolean;
  pads: boolean;
  flags: boolean;
  falseStart: boolean;
  depth: number;
  section: { exaggerate: number } | undefined;
  race: RacePlan | undefined;
}

/** A water polo field to draw. */
export interface PoloPlan extends Common {
  sport: "waterpolo";
  length: number;
  width: number;
  /** The side of the official table, as the field lies wide. */
  table: "top" | "bottom";
}

/** One board of a diving well: a springboard or a platform, with its plummet (metres from the wall, then across from the top) and its size. */
export interface Board {
  kind: "springboard" | "platform";
  height: number;
  /** The plummet: x from the pool wall the boards stand at, y across from the top wall. */
  x: number;
  y: number;
  length: number;
  width: number;
}

/** A diving well to draw. */
export interface DivePlan extends Common {
  sport: "diving";
  length: number;
  width: number;
  boards: Board[];
  /** The metres behind the wall that the stands reach, for the view. */
  behind: number;
}

/** An artistic swimming area to draw. */
export interface ArtisticPlan extends Common {
  sport: "artisticswimming";
  area: "olympic" | "minimum";
  length: number;
  width: number;
  /** For the minimum area: the deep part, in metres from the left wall and the top wall, and its size. */
  deep: { x: number; y: number; length: number; width: number } | undefined;
}

export type PoolPlan = SwimPlan | PoloPlan | DivePlan | ArtisticPlan;

/** The size of the water of a pool in metres: `length` along the drawing and `width` across it. */
export const poolSize = (plan: PoolPlan): { length: number; width: number } => ({ length: plan.length, width: plan.width });

const num = (value: unknown, what: string, least: number, most: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < least || value > most) throw new RangeError(`${what} must be a number from ${least} to ${most}: ${String(value)} is not`);
  return value;
};

/** The look the options ask for. @throws Error for a look or a deck the pool does not have. */
export function commonOf(style: PoolStyle): Common {
  const look = style.look ?? "flat";
  if (!LOOKS.includes(look)) throw new Error(`Unknown pool look "${String(style.look)}": use one of ${LOOKS.join(", ")}`);
  const deck = style.deck ?? "plain";
  if (!DECKS.includes(deck)) throw new Error(`Unknown deck "${String(style.deck)}": use one of ${DECKS.join(", ")}`);
  const seed = style.seed === undefined ? 1 : Math.trunc(num(style.seed, "The pool's seed", -1e9, 1e9));
  return { look, deck, seed };
}

/** The colour of rope `i` of `n + 1`: green outside, yellow round the middle, blue between (CR 16.1.7.1 for eight lanes; 16.2.7.1.2 for ten). */
export function ropeColour(i: number, lanes: number): RopeColour {
  if (i === 0 || i === lanes) return "green";
  return Math.abs(i - lanes / 2) <= 1 ? "yellow" : "blue";
}

/** The width of a swimming pool of this length and this many lanes, the space outside the first and the last lane, and the width of those two lanes. */
export function laneWidths(course: "long" | "short", lanes: number, temporary: boolean): { width: number; space: number; edge: number } {
  const lane = SWIMMING.lane;
  if (lanes === 10) return temporary ? { width: SWIMMING_WIDTHS.temporary, space: SWIMMING.spaceTemporaryWorld, edge: lane } : { width: SWIMMING_WIDTHS.permanent, space: SWIMMING.spacePermanentWorld, edge: SWIMMING.edgeLane };
  if (lanes === 8 && course === "long") return { width: SWIMMING_WIDTHS.permanent, space: SWIMMING.spaceOlympic, edge: lane };
  const space = SWIMMING.spaceMinimum;
  return { width: lanes * lane + 2 * space, space, edge: lane };
}

/** The lanes and the ropes of a pool of this width, from the top. */
export function lanesOf(width: number, lanes: number, space: number): { lanes: LanePlan[]; ropes: Rope[] } {
  const lane = SWIMMING.lane;
  // From the bottom wall: the ropes at the edges of the lanes. Ten lanes in the permanent pool: the end ropes 0.1 m from the walls, the others 2.5 m apart from 2.5 m, so that the markings stay 2.5 m apart (CR 16.2.15).
  const fromBottom: number[] = [];
  for (let k = 0; k <= lanes; k += 1) fromBottom.push(lanes === 10 && width === SWIMMING_WIDTHS.permanent ? (k === 0 ? space : k === 10 ? width - space : k * lane) : space + k * lane);
  const first = lanes === 10 ? 0 : 1;
  const list: LanePlan[] = [];
  for (let k = 0; k < lanes; k += 1) {
    const mid = lanes === 10 && width === SWIMMING_WIDTHS.permanent ? lane / 2 + k * lane : space + lane / 2 + k * lane;
    list.push({ number: first + k, y: width - mid, top: width - fromBottom[k + 1], bottom: width - fromBottom[k] });
  }
  const ropes: Rope[] = fromBottom.map((v, i) => ({ y: width - v, colour: ropeColour(i, lanes) }));
  return { lanes: list.reverse(), ropes: ropes.reverse() };
}

/**
 * The swimming pool the options ask for: `pool.course` (`long`, 50 m, or `short`, 25 m) and `pool.lanes` (8 by default). The width is the rules' for that many lanes: 25 m for eight in a 50 m
 * pool (CR 16.2.6.2), 25 m for ten with lanes 0 and 9 of 2.4 m, or 26 m for a temporary pool (CR 16.2.6.3), and lanes of 2.5 m with spaces of 0.5 m for the other pools.
 * @throws RangeError for a lane count that is not 1 to 10, @throws Error for an unknown look.
 */
export function swimPlan(o: Pick<SurfaceOptions, "pool" | "sport">, defaults: Partial<Pick<VenuePool, "course" | "kind" | "lanes">> = {}): SwimPlan {
  const style = o.pool ?? {};
  const kind: PoolKind = (style.kind ?? defaults.kind) === "warm-up" ? "warm-up" : "competition";
  const course = (style.course ?? defaults.course) === "short" ? "short" : "long";
  const count = style.lanes === undefined && defaults.lanes === undefined ? 8 : Math.trunc(num(style.lanes ?? defaults.lanes, "The number of lanes", 1, 10));
  const { width, space } = laneWidths(course, count, style.temporary === true && count === 10);
  const { lanes, ropes } = lanesOf(width, count, space);
  const length = course === "long" ? SWIMMING.longCourse : SWIMMING.shortCourse;
  const competition = kind === "competition";
  const on = (value: boolean | undefined): boolean => (value === undefined ? competition : value);
  const depth = style.section !== undefined && typeof style.section === "object" && style.section.depth !== undefined ? num(style.section.depth, "The section's depth", 0.5, 10) : course === "long" ? SWIMMING.depth.olympic : SWIMMING.depth.shortWorld;
  const section = style.section === undefined || style.section === false ? undefined : { exaggerate: typeof style.section === "object" && style.section.exaggerate !== undefined ? num(style.section.exaggerate, "The section's exaggeration", 1, 8) : 2.5 };
  const plan: SwimPlan = {
    sport: "swimming",
    ...commonOf(style),
    kind,
    course,
    length,
    width,
    lanes,
    space,
    ropes,
    blocks: on(style.blocks),
    pads: on(style.pads),
    flags: on(style.flags),
    falseStart: on(style.falseStart),
    depth,
    section,
    race: undefined,
  };
  if (style.race !== undefined) plan.race = racePlan(style.race, lanes.map((l) => l.number), { splitEvery: course === "long" ? 50 : 25, length });
  return plan;
}

/** The water polo field the options ask for: 25 by 20 m (CR 18.1.2). */
export function poloPlan(o: Pick<SurfaceOptions, "pool">): PoloPlan {
  const style = o.pool ?? {};
  const table = style.table === "top" ? "top" : "bottom";
  return { sport: "waterpolo", ...commonOf(style), length: WATER_POLO.length + 2 * WATER_POLO.goal.netClear, width: WATER_POLO.width, table };
}

/** The measure of a diving table row: the preferred figure. */
const pref = (pair: readonly [number, number]): number => pair[1];

const BOARDS = {
  "1": { b: DIVING.B.platform1, c: DIVING.C.platform1, a: DIVING.A.platform1 },
  "3": { b: DIVING.B.platform3, c: DIVING.C.platform3, a: DIVING.A.platform3 },
  "5": { b: DIVING.B.platform5, c: DIVING.C.platform5, a: DIVING.A.platform5 },
  "7.5": { b: DIVING.B.platform75, c: DIVING.C.platform75, a: DIVING.A.platform75 },
  "10": { b: DIVING.B.platform10, c: DIVING.C.platform10, a: DIVING.A.platform10 },
} as const;

/**
 * The diving well the options ask for. The springboards (1 m and 3 m, `pool.boards` of each, 2 by default so that a synchronised pair stands side by side) stand along the left wall, 3 m boards outside, each the preferred
 * distance (Appendix 2, B and C) from the wall and from the next; the platforms (5, 7.5 and 10 m by default) stand towards the right wall, the tallest the distance B from it and each lower one the distance C of the
 * platform above it from that one. The well is 25 m across, wider if the boards need more room than that.
 * @throws RangeError for a platform the rules do not have or a count of boards that is not 1 to 4.
 */
export function divePlan(o: Pick<SurfaceOptions, "pool">): DivePlan {
  const style = o.pool ?? {};
  const asked: number[] = style.platforms === undefined ? [5, 7.5, 10] : [...style.platforms];
  for (const h of asked) if (!(PLATFORMS as readonly number[]).includes(h)) throw new RangeError(`The rules have no ${String(h)} m platform: use ${PLATFORMS.join(", ")}`);
  const heights = [...new Set(asked)].sort((a, b) => a - b) as DivingPlatform[];
  const count = style.boards === undefined ? 2 : Math.trunc(num(style.boards, "The number of boards of each height", 1, 4));
  const boards: Board[] = [];
  let left = 0;
  if (style.springboards !== false) {
    const sb = DIVING.springboard;
    let y = pref(DIVING.B.springboard3);
    for (let i = 0; i < count; i += 1) {
      boards.push({ kind: "springboard", height: 3, x: pref(DIVING.A.springboard3), y, length: sb.length, width: sb.width });
      left = y;
      y += i < count - 1 ? pref(DIVING.C.springboard3) : pref(DIVING.C.springboard3);
    }
    for (let i = 0; i < count; i += 1) {
      boards.push({ kind: "springboard", height: 1, x: pref(DIVING.A.springboard1), y, length: sb.length, width: sb.width });
      left = y;
      y += pref(DIVING.C.springboard1);
    }
  }
  // The platforms from the tallest, the distance B from the right wall.
  const tops: Board[] = [];
  let width = DIVING.well.width;
  const place = (width0: number): Board[] => {
    const out: Board[] = [];
    let y: number | undefined;
    let above = 0;
    for (const h of [...heights].reverse()) {
      const spec = DIVING.platforms[String(h) as keyof typeof DIVING.platforms];
      const info = BOARDS[String(h) as keyof typeof BOARDS];
      // From the plummet of the platform above, the distance C of that platform.
      y = y === undefined ? width0 - pref(info.b) : y - above;
      above = pref(info.c);
      out.push({ kind: "platform", height: h, x: pref(info.a), y, length: spec.length, width: pref(spec.width) });
    }
    return out;
  };
  let platforms = place(width);
  // Room between the last springboard and the first platform, so that their stands do not touch: widen the well if they would crowd.
  const clear = 2;
  if (platforms.length > 0 && boards.length > 0) {
    const first = platforms[platforms.length - 1];
    const need = left + DIVING.springboard.width / 2 + clear + first.width / 2 - first.y;
    if (need > 0) {
      width += need;
      platforms = place(width);
    }
  }
  tops.push(...platforms);
  const all = [...boards, ...tops];
  const behind = Math.max(0, ...all.map((b) => b.length - b.x));
  return { sport: "diving", ...commonOf(style), length: DIVING.well.length, width, boards: all, behind };
}

/** The artistic swimming area the options ask for: 30 by 20 m for the Olympic Games and the World Championships, or the least, 25 by 15 m with a 12 by 12 m deep part (CR 27.2.2, 27.1.2). */
export function artisticPlan(o: Pick<SurfaceOptions, "pool">): ArtisticPlan {
  const style = o.pool ?? {};
  const area = style.area === "minimum" ? "minimum" : "olympic";
  if (area === "olympic") return { sport: "artisticswimming", ...commonOf(style), area, length: ARTISTIC.olympic.length, width: ARTISTIC.olympic.width, deep: undefined };
  const m = ARTISTIC.minimum;
  return { sport: "artisticswimming", ...commonOf(style), area, length: m.length, width: m.width, deep: { x: (m.length - m.deepLength) / 2, y: (m.width - m.deepWidth) / 2, length: m.deepLength, width: m.deepWidth } };
}

/** The pool the options ask for, of the sport's kind. */
export function poolPlan(o: Pick<SurfaceOptions, "sport" | "pool">): PoolPlan {
  switch (o.sport) {
    case "swimming":
      return swimPlan(o);
    case "waterpolo":
      return poloPlan(o);
    case "diving":
      return divePlan(o);
    case "artisticswimming":
      return artisticPlan(o);
    default:
      throw new Error(`"${String(o.sport)}" is not a pool sport`);
  }
}

/** The hall of a natatorium asked for, with `natatorium` standing for the usual three pools. */
export function venueOf(style: PoolStyle): VenueOptions | undefined {
  if (style.venue === undefined) return undefined;
  if (style.venue === "natatorium") {
    return {
      pools: [
        { sport: "swimming", name: "Competition pool", course: "long" },
        { sport: "diving", name: "Diving well" },
        { sport: "swimming", name: "Warm-up pool", course: "short", kind: "warm-up" },
      ],
    };
  }
  if (typeof style.venue !== "object" || style.venue === null || !Array.isArray(style.venue.pools) || style.venue.pools.length === 0) throw new TypeError(`venue is "natatorium" or { pools: [...] } with at least one pool`);
  return style.venue;
}

/** What each plan reaches beyond its water, in metres on each side: the blocks and flag standards, the platforms and table, the stands behind the diving boards, the judges' platform. */
export function reachOf(plan: PoolPlan): { left: number; right: number; top: number; bottom: number } {
  switch (plan.sport) {
    case "swimming":
      return { left: 1.3, right: 1.3, top: 1.2, bottom: 1.2 };
    case "waterpolo":
      return { left: 0.6, right: 0.6, top: 1.8, bottom: 4.2 };
    case "diving":
      return { left: plan.behind + 4, right: 0.5, top: 0.5, bottom: 0.5 };
    default:
      return { left: 0.5, right: 0.5, top: 2.8, bottom: 2.2 };
  }
}

/** One pool of a hall: its plan and where its water's top left corner is, in metres from the corner of the water of the whole hall. */
export interface VenueItem {
  pool: VenuePool;
  plan: PoolPlan;
  x: number;
  y: number;
}

/** A hall laid out: its pools, and the size of the box round their water, in metres. */
export interface VenueLayout {
  items: VenueItem[];
  width: number;
  height: number;
  apart: number;
  labels: boolean;
  seating: boolean;
  /** How far the pools' fixtures reach beyond the box, in metres. */
  reach: { left: number; right: number; top: number; bottom: number };
}

/** The most a row of pools is laid out to, in metres, when the pools have no places of their own. */
const ROW = 125;

/**
 * The pools of a hall (`pool.venue`) laid out to scale. A pool with an `x` and a `y` stands there; the others are set in rows, left to right, each `apart` metres (10, the distance the rules prefer between
 * a swimming pool and a diving well, CR 16.2.17; never less than the 8 they require) from the one before, and a new row when a row would be longer than 125 m.
 * @throws RangeError when two pools are nearer each other than `apart`, for the pools given places.
 */
export function venueLayout(style: PoolStyle): VenueLayout | undefined {
  const venue = venueOf(style);
  if (venue === undefined) return undefined;
  const apart = venue.apart === undefined ? SWIMMING.poolsApartPreferred : num(venue.apart, "The distance between pools", SWIMMING.poolsApart, 100);
  const common = { look: style.look, deck: style.deck, seed: style.seed };
  const items: VenueItem[] = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  for (const pool of venue.pools) {
    if (typeof pool !== "object" || pool === null || !isPoolSport(pool.sport)) throw new TypeError(`A pool of a venue is { sport: ${POOL_SPORTS.map((s) => `"${s}"`).join(" | ")}, ... }`);
    const pooled = { ...common, ...(pool.sport === "swimming" ? { course: pool.course, lanes: pool.lanes, kind: pool.kind } : {}) } as PoolStyle;
    const plan = poolPlan({ sport: pool.sport, pool: pooled });
    const placed = pool.x !== undefined && pool.y !== undefined;
    if (!placed) {
      if (items.length > 0 && x + plan.length > ROW) {
        x = 0;
        y += rowHeight + apart;
        rowHeight = 0;
      }
      items.push({ pool, plan, x, y });
      x += plan.length + apart;
      rowHeight = Math.max(rowHeight, plan.width);
    } else items.push({ pool, plan, x: num(pool.x, "A pool's x", -1000, 1000), y: num(pool.y, "A pool's y", -1000, 1000) });
  }
  // The box round all the water, moved to the origin.
  const x0 = Math.min(...items.map((i) => i.x));
  const y0 = Math.min(...items.map((i) => i.y));
  for (const item of items) {
    item.x -= x0;
    item.y -= y0;
  }
  for (const [i, a] of items.entries()) {
    for (const b of items.slice(i + 1)) {
      const gapX = Math.max(a.x - (b.x + b.plan.length), b.x - (a.x + a.plan.length));
      const gapY = Math.max(a.y - (b.y + b.plan.width), b.y - (a.y + a.plan.width));
      if (Math.max(gapX, gapY) < apart - 1e-9) throw new RangeError(`Two pools of the venue are nearer than ${apart} m: the rules keep a swimming pool and a diving well at least ${SWIMMING.poolsApart} m apart`);
    }
  }
  const width = Math.max(...items.map((i) => i.x + i.plan.length));
  const height = Math.max(...items.map((i) => i.y + i.plan.width));
  const reach = {
    left: Math.max(...items.map((i) => reachOf(i.plan).left - i.x), 0),
    right: Math.max(...items.map((i) => reachOf(i.plan).right + i.x + i.plan.length - width), 0),
    top: Math.max(...items.map((i) => reachOf(i.plan).top - i.y), 0),
    bottom: Math.max(...items.map((i) => reachOf(i.plan).bottom + i.y + i.plan.width - height), 0),
  };
  return { items, width, height, apart, labels: venue.labels !== false, seating: venue.seating !== false, reach };
}

/** The box round the water the options draw, in feet: the pool's, or the whole hall's. */
export function poolBox(o: Pick<SurfaceOptions, "sport" | "pool">): { w: number; h: number } {
  const hall = o.sport === "swimming" && o.pool?.venue !== undefined ? venueLayout(o.pool) : undefined;
  if (hall !== undefined) return { w: feet(hall.width), h: feet(hall.height) };
  const plan = poolPlan(o);
  return { w: feet(plan.length), h: feet(plan.width) };
}
