// The crowd outside a district's venues: people standing where people may stand (`walk.ts`: sidewalks, plazas, parks, platforms and the venues' own ground, never a carriageway, a railway, water or a building), at 0, 25, 50, 75
// or 100 percent of the venues' seats. One ordered list of people: a level is a prefix of it, so that moving the level up only adds people and moving it down only takes some away, and the same options always give the same
// list (a seeded generator, integer arithmetic and no clock). The crowd is thickest by the venues and thins with distance, never more than `OUTSIDE_DENSITY` people to a square metre. Pure: a plan in, typed arrays out; `outside.paint.ts`
// turns them into pixels and `outside.dom.ts` puts the pixels on a page. Roads are never drawn: the crowd's shape is what shows them.
import { districtMember, turnBy, type DistrictPlan } from "./district.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { metresFrom, type LonLat } from "./venues.geo.ts";
import { WALK_DATA } from "./walk.data.ts";
import { WALK_IDS, walkIdFor, walkMask, type WalkMask } from "./walk.ts";
import { OUTSIDE_LEVELS, outsideCount, type OutsideCrowd, type OutsideLevel } from "./outside.paint.ts";
import type { Pt } from "./crowd.ts";

export { OUTSIDE_LEVELS, outsideCount };
export type { OutsideCrowd, OutsideLevel };

/** What can be asked of the crowd outside a district (`DistrictOptions.outside`). Off by default. */
export interface OutsideOptions {
  /** The share of the venues' seats standing outside, in percent: 0 (the default, nobody), 25, 50, 75 or 100. */
  level?: OutsideLevel;
}

/** The most people to a square metre of walkable ground in the list at 100 percent: a crowd standing close, short of a crush. */
export const OUTSIDE_DENSITY = 3;
/** The distance from a venue's building at which the crowd has thinned to half what it is at the wall, in metres. */
export const OUTSIDE_REACH = 60;

/** Whether a number is one of the levels. */
export const isOutsideLevel = (level: unknown): level is OutsideLevel => (OUTSIDE_LEVELS as readonly unknown[]).includes(level);

/** The level an options object asks for: 0 when it asks for none. Throws for a level that is not one of `OUTSIDE_LEVELS`. */
export function outsideLevelOf(options: { outside?: OutsideOptions } | undefined): OutsideLevel {
  const level = options?.outside?.level;
  if (level === undefined) return 0;
  if (!isOutsideLevel(level)) throw new Error(`outside level ${String(level)}: the levels are ${OUTSIDE_LEVELS.join(", ")}`);
  return level;
}

/** A small, fast generator of numbers in [0, 1) from a whole seed (mulberry32): only integer arithmetic, so it gives the same numbers in every engine. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (text: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
};

/** The distance from a point to a ring's outline, in metres. */
function edgeDistance(ring: readonly Pt[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [ax, ay] = ring[j];
    const [dx, dy] = [ring[i][0] - ax, ring[i][1] - ay];
    const len2 = dx * dx + dy * dy;
    const t = len2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
    const [ex, ey] = [x - ax - t * dx, y - ay - t * dy];
    best = Math.min(best, ex * ex + ey * ey);
  }
  return Math.sqrt(best);
}

/** The side of a block of cells a crowd's weight is worked out for, in cells. */
const BLOCK = 8;

/** What a venue is to the crowd: its key, its seats and its building, in metres from the mask's origin. */
interface Wanted {
  key: string;
  seats: number;
  ring: readonly Pt[];
}

interface Population {
  venues: { key: string; seats: number; placed: number }[];
  x: Float32Array;
  y: Float32Array;
  venue: Uint8Array;
  count: number;
}

const populations = new Map<string, Population>();

/**
 * The people of every venue on a mask: for each venue in turn, its seats' worth, placed on the cells nobody has filled, thick by its building and thinning with the distance (a weight 1 / (1 + (d / reach)^2), scaled until the
 * seats are placed without a cell going past the density), then every venue's people mixed in one list so that any prefix is a random share of each. A venue the ground cannot hold has `placed` below `seats`.
 */
function populate(mask: WalkMask, wanted: readonly Wanted[], id: string): Population {
  const { cell, width, height, cells } = mask;
  const perCell = OUTSIDE_DENSITY * cell * cell;
  const room = new Float32Array(width * height);
  const standing: number[] = [];
  for (let i = 0; i < cells.length; i += 1) if (cells[i] === 1) {
    room[i] = perCell;
    standing.push(i);
  }
  const bw = Math.ceil(width / BLOCK);
  // The blocks with any ground to stand on: the only ones a weight is worked out for.
  const used = new Uint8Array(bw * Math.ceil(height / BLOCK));
  for (const i of standing) used[Math.floor(Math.floor(i / width) / BLOCK) * bw + Math.floor((i % width) / BLOCK)] = 1;
  const lists: { x: number[]; y: number[] }[] = [];
  const venues: Population["venues"] = [];
  for (const venue of wanted) {
    // The weight of each block: a function of the distance of its middle from the venue's building.
    const weight = new Float32Array(bw * Math.ceil(height / BLOCK));
    for (let br = 0; br < Math.ceil(height / BLOCK); br += 1) {
      for (let bc = 0; bc < bw; bc += 1) {
        if (!used[br * bw + bc]) continue;
        const d = edgeDistance(venue.ring, mask.x0 + (bc + 0.5) * BLOCK * cell, mask.y0 + (br + 0.5) * BLOCK * cell);
        weight[br * bw + bc] = 1 / (1 + (d / OUTSIDE_REACH) ** 2);
      }
    }
    const w = new Float32Array(standing.length);
    standing.forEach((i, k) => {
      w[k] = weight[Math.floor(Math.floor(i / width) / BLOCK) * bw + Math.floor((i % width) / BLOCK)];
    });
    // The scale that places the seats (and a little over, which the shuffle's cut takes off again): found by bisection on the sum of what each cell takes.
    const target = venue.seats * 1.02;
    const taken = (lambda: number): number => {
      let sum = 0;
      for (let k = 0; k < standing.length; k += 1) sum += Math.min(room[standing[k]], lambda * w[k]);
      return sum;
    };
    let [lo, hi] = [0, 200];
    if (taken(hi) < target) lo = hi;
    else for (let n = 0; n < 24; n += 1) {
      const mid = (lo + hi) / 2;
      if (taken(mid) < target) lo = mid;
      else hi = mid;
    }
    const lambda = taken(hi) < target ? hi : (lo + hi) / 2;
    const random = seeded(seedOf(`${id}|${venue.key}`));
    const px: number[] = [];
    const py: number[] = [];
    for (let k = 0; k < standing.length; k += 1) {
      const i = standing[k];
      const want = Math.min(room[i], lambda * w[k]);
      const n = Math.floor(want + random());
      if (n === 0) continue;
      room[i] = Math.max(0, room[i] - n);
      const [col, row] = [i % width, Math.floor(i / width)];
      for (let m = 0; m < n; m += 1) {
        // Inside the middle of the cell, so that a person is never on its edge.
        px.push(mask.x0 + (col + 0.15 + 0.7 * random()) * cell);
        py.push(mask.y0 + (row + 0.15 + 0.7 * random()) * cell);
      }
    }
    // A random order, so that any prefix is a random share of the venue's people; the cut at the seats takes off the few over.
    for (let i = px.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [px[i], px[j]] = [px[j], px[i]];
      [py[i], py[j]] = [py[j], py[i]];
    }
    const placed = Math.min(venue.seats, px.length);
    lists.push({ x: px.slice(0, placed), y: py.slice(0, placed) });
    venues.push({ key: venue.key, seats: venue.seats, placed });
  }
  // The venues mixed in one list: the next person is the venue's whose share is the smallest so far.
  const total = lists.reduce((s, l) => s + l.x.length, 0);
  const x = new Float32Array(total);
  const y = new Float32Array(total);
  const venue = new Uint8Array(total);
  const given = new Array<number>(lists.length).fill(0);
  for (let k = 0; k < total; k += 1) {
    let pick = -1;
    lists.forEach((l, v) => {
      if (given[v] >= l.x.length) return;
      if (pick < 0 || given[v] * lists[pick].x.length < given[pick] * l.x.length) pick = v;
    });
    x[k] = lists[pick].x[given[pick]];
    y[k] = lists[pick].y[given[pick]];
    venue[k] = pick;
    given[pick] += 1;
  }
  return { venues, x, y, venue, count: total };
}

/** The mask a plan's venues stand on, if there is one: the first mask that names one of its venues. */
export const maskIdOf = (plan: Pick<DistrictPlan, "members">): string | undefined => walkIdFor(plan.members.map((m) => m.member.id));

/** Whether a plan has a crowd to show: some venue of it stands on a mask. */
export const hasOutside = (plan: Pick<DistrictPlan, "members">): boolean => maskIdOf(plan) !== undefined;

/** The ids of the venues there is a walkable mask round. */
export const OUTSIDE_VENUES: readonly string[] = Object.freeze([...new Set(WALK_IDS.flatMap((id) => WALK_DATA[id].venues.map((key) => key.split(":")[0])))]);

const placedCache = new WeakMap<DistrictPlan, OutsideCrowd | null>();

/**
 * The crowd outside a plan's venues, in the plan's frame: the people of every venue of the plan that stands on a mask (each with its seats as the plan has them), worked out once and kept. `undefined` where no venue of the plan
 * has a mask. The crowd is the same list whatever level is shown: `outsideCount` says how many of its first people stand at a level.
 * @example
 * ```ts
 * import { planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * import { outsideCount, outsideCrowd } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const crowd = outsideCrowd(planDistrict({ venues: ["bc-place", "rogers-arena"] }))!;
 * console.log(crowd.venues.map((v) => `${v.key} ${v.placed}`).join(", "), outsideCount(crowd, 50));
 * // bc-place:cfl 54500, rogers-arena 18871 36686
 * ```
 */
export function outsideCrowd(plan: DistrictPlan): OutsideCrowd | undefined {
  const cached = placedCache.get(plan);
  if (cached !== undefined) return cached ?? undefined;
  const maskId = maskIdOf(plan);
  if (maskId === undefined) {
    placedCache.set(plan, null);
    return undefined;
  }
  const data = WALK_DATA[maskId];
  const ids = data.venues.map((key) => key.split(":")[0]);
  const present = ids.map((id) => plan.members.find((m) => m.member.id === id)).filter((m) => m !== undefined);
  const extras = { buildings: data.venues.map((key) => metresFrom(data.origin, districtMember(key).ring as LonLat[])), apron: 5 };
  const mask = walkMask(maskId, extras);
  const wanted: Wanted[] = present.map((m) => ({ key: m.member.key, seats: m.member.seats, ring: extras.buildings[ids.indexOf(m.member.id)] }));
  const kept = `${maskId}|${wanted.map((w) => `${w.key}:${w.seats}`).join(",")}`;
  let population = populations.get(kept);
  if (population === undefined) {
    population = populate(mask, wanted, maskId);
    populations.set(kept, population);
  }
  // Into the plan's frame: the mask's metres from its origin, to the plan's origin, to feet with the page's y going down, turned with the map.
  const [shiftX, shiftY] = metresFrom(plan.origin as LonLat, [data.origin as LonLat])[0];
  const x = new Float32Array(population.count);
  const y = new Float32Array(population.count);
  for (let i = 0; i < population.count; i += 1) {
    const [px, py] = turnBy([(shiftX + population.x[i]) * FEET_PER_METRE, -(shiftY + population.y[i]) * FEET_PER_METRE], plan.turn);
    x[i] = px;
    y[i] = py;
  }
  const crowd: OutsideCrowd = { mask: maskId, venues: population.venues, x, y, venue: population.venue, count: population.count };
  placedCache.set(plan, crowd);
  return crowd;
}

/** Whether a point of the plan's frame (feet) is on the mask's walkable ground: the inverse of what `outsideCrowd` does to a person, for a test to hold the crowd to the mask. */
export function standsOnWalkable(plan: DistrictPlan, maskId: string, [fx, fy]: Pt): boolean {
  const data = WALK_DATA[maskId];
  const [shiftX, shiftY] = metresFrom(plan.origin as LonLat, [data.origin as LonLat])[0];
  const [ux, uy] = turnBy([fx, fy], -plan.turn);
  const mask = walkMask(maskId, { buildings: data.venues.map((key) => metresFrom(data.origin, districtMember(key).ring as LonLat[])), apron: 5 });
  const [mx, my] = [ux / FEET_PER_METRE - shiftX, -uy / FEET_PER_METRE - shiftY];
  const col = Math.floor((mx - mask.x0) / mask.cell);
  const row = Math.floor((my - mask.y0) / mask.cell);
  return col >= 0 && row >= 0 && col < mask.width && row < mask.height && mask.cells[row * mask.width + col] === 1;
}
