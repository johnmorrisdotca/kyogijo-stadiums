// The stands round a surface, raised: `crowdStands()` says where each tier of seats is (its outline, the height of its first and last row, its aisles, the blocks of visitors and the places left
// open), and this makes of it what the 3D view stands on the floor: every tier a strip of raked planes (a quad to every straight side and a few to every corner, so that a whole bowl is a few dozen
// elements, however many seats it has), textured with the crowd's own pattern and the lines of its rows, the concourses between the tiers, the low wall under the first row, the seats on top of a
// ballpark's wall, and, when asked, the roof or canopy over the top tier. Pure: data in, planes out.
import { densityOf, resolveCrowd, type Crowd, type CrowdStands, type Pt, type StandRing } from "./crowd.ts";
import { patterns } from "./crowd.draw.ts";
import { crowdStands } from "./draw.ts";
import { groundById } from "./grounds.ts";
import { ARC_STEPS, clipAround, clipConvex, clipSegment, areaOf, pointList, raked, slopeOf, stripsOf, tidy, type Cut, type Strip } from "./venue.geom.ts";
import { realBuilding } from "./venue.real.ts";
import { n, shy, wall, type Plane, type Upright } from "./turn.kit.ts";
import type { SurfaceOptions } from "./types.ts";

/** What can be asked of the venue. */
export interface VenueSettings {
  /** Roofs and canopies over the top tier of the stands: a canopy over the back of the top tier in the open, a lid over a hall. They give way to the eye as the walls do. Off by default. */
  roof?: boolean;
  /** A retractable roof (a real venue's: BC Place's) drawn open, the fabric gathered into its pod, instead of closed over the opening. Closed by default. */
  roofOpen?: boolean;
  /** The walls of a real venue's building (`crowd: { real: true }`), raised on its outline: they follow `roof` where left out (a roof and walls together, as before), and `walls: true` with `roof` off raises the walls alone, `roof: true` with `walls: false` the roof alone. */
  walls?: boolean;
  /** How finely the curves are cut: `low` a facet to each corner, `auto` (the default) three, `high` six; an oval is 12, 28 or 56 facets round. */
  detail?: Cut;
}

/** The settings a venue is built from: the asker's, and the prefix of the ids of what it draws, which the view gives. */
export interface VenueBuild extends VenueSettings {
  id: string;
}

/** What the venue is made of: the things that stand, and the patterns they are drawn with (the contents of a `defs`). */
export interface Venue {
  items: Upright[];
  defs: string;
  /** How far the venue reaches beyond the surface's box on its widest side, in feet: the ground the floor needs for it to stand on. 0 for none. */
  reach: number;
}

export const NO_VENUE: Venue = { items: [], defs: "", reach: 0 };

/** The sports played under a roof: their stands have a lid and not a canopy. */
const INDOOR: readonly string[] = ["nhl", "nba", "volleyball", "badminton", "tabletennis", "handball", "judo", "karate", "kendo", "sumo", "dojo", "curling", "squash", "racquetball", "pickleball", "netball", "skating", "swimming", "waterpolo", "diving", "artisticswimming", "teqball", "roundnet", "sepaktakraw"];

/** How far the roof stands over the top row at its edge, in feet (ours: no rule gives it), and how far it reaches over the seats. */
export const ROOF = { clearance: 26, canopyReach: 0.62, canopyDrop: 6, lidRise: 26 } as const;

const round = (v: number): number => Math.round(v * 1000) / 1000;

/** The top of a set of planes. */
const topOf = (planes: readonly Plane[]): number => Math.max(0, ...planes.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]]));

/** The tiers a roof covers: the highest of those that are not a ballpark's wall seats or bleachers. */
function topRing(stands: CrowdStands): StandRing | undefined {
  const rings = stands.rings.filter((r) => r.tier !== "wall" && r.tier !== "bleachers");
  return rings.reduce<StandRing | undefined>((best, r) => (best === undefined || r.height[1] > best.height[1] ? r : best), undefined);
}

/** The quads of the strips of a ring, with their slopes. */
function* quadsOf(strips: readonly Strip[]): Generator<[Pt, Pt, Pt, Pt]> {
  for (const strip of strips) for (let i = 0; i + 1 < strip.inner.length; i += 1) yield [strip.inner[i], strip.inner[i + 1], strip.outer[i + 1], strip.outer[i]];
}

/** The stands of a surface as planes: `undefined`-free, an empty venue when the options have no crowd (or the crowd is a hall's gallery, which `venue.room.ts` raises). */
export function standsVenue(o: SurfaceOptions, v: VenueBuild, lift: number): Venue {
  const stands = crowdStands(o);
  const crowd = resolveCrowd(o.crowd);
  if (stands === undefined || crowd === undefined || stands.gallery === true) return NO_VENUE;
  return standsVenueOf(stands, crowd, { sport: o.sport, detail: o.detail, ground: o.ground }, v, lift);
}

/**
 * The stands the model says (`crowdStands`, or the stands of a tournament layout's hall) as planes: what `standsVenue` makes of a surface's, for stands that were worked out some other way. `o` is the little of the
 * drawing's options it reads: the sport (whether a roof is a lid), the detail (`simple` is the plain crowd) and the ground (whose capacity sets the density).
 */
export function standsVenueOf(stands: CrowdStands, crowd: Crowd, o: Pick<SurfaceOptions, "sport" | "detail" | "ground">, v: VenueBuild, lift: number): Venue {
  const cut: Cut = v.detail ?? "auto";
  const fine = crowd.detail !== "plain" && o.detail !== "simple";
  const density = densityOf(crowd, stands.seats, groundById(o.ground)?.capacity);
  const tifo = { home: stands.sectors.some((s) => s.kind === "tifo-home"), away: stands.sectors.some((s) => s.kind === "tifo-away") };
  const pid = `${v.id}-v`;
  const defs = fine ? patterns(pid, crowd, density, tifo.home || tifo.away ? tifo : undefined, stands.real !== undefined, true) : "";
  const centre: [number, number] = [stands.box.x + stands.box.w / 2, stands.box.y + stands.box.h / 2];
  const covers = stands.covers;
  const inCover = (p: Pt): boolean => covers.some(([x0, y0, x1, y1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1);
  const pieces = (poly: Pt[]): Pt[][] => (covers.length === 0 ? [poly] : clipAround(poly, covers));

  const seatPlanes: Plane[] = [];
  const wallSeats: Plane[] = [];
  let count = 0;

  const paint = (ring: StandRing, piece: Pt[]) => (corners: Pt[], local: (p: Pt) => Pt): string => {
    let svg = `<polygon class="u-bed" points="${pointList(corners)}"/>`;
    const people = ring.fill < 0.95 ? ` fill-opacity="${round(1 - Math.min(0.5, (1 - ring.fill) * 1.6))}"` : "";
    svg += fine ? `<polygon fill="url(#${pid}-cr-h)"${people} points="${pointList(corners)}"/>` : `<polygon class="u-blk" fill-opacity="${round(0.28 + 0.6 * density * ring.fill)}" points="${pointList(corners)}"/>`;
    for (const s of stands.sectors) {
      if (s.ring !== ring.id) continue;
      const part = tidy(clipConvex(s.points, piece));
      if (part.length < 3 || Math.abs(areaOf(part)) < 0.05) continue;
      const points = pointList(part.map(local));
      if (s.kind === "away") svg += fine ? `<polygon fill="url(#${pid}-cr-a)" points="${points}"/>` : `<polygon class="u-blk-a" fill-opacity="${round(0.3 + 0.6 * density)}" points="${points}"/>`;
      else svg += fine ? `<polygon fill="url(#${pid}-cr-${s.kind === "tifo-home" ? "th" : "ta"})" points="${points}"/>` : `<polygon class="${s.kind === "tifo-home" ? "u-th" : "u-ta"}" points="${points}"/>`;
    }
    if (fine) {
      let plain = "";
      let vomitory = "";
      ring.aisles.forEach(([a, b], i) => {
        const seg = clipSegment(a, b, piece);
        if (seg === undefined || Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]) < 0.5) return;
        const [p, q] = [local(seg[0]), local(seg[1])];
        const d = `M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}`;
        if (i % 4 === 0) vomitory += d;
        else plain += d;
      });
      if (plain !== "") svg += `<path class="ky-cr-aisle" fill="none" stroke-width="1.1" d="${plain}"/>`;
      if (vomitory !== "") svg += `<path class="ky-cr-aisle" fill="none" stroke-width="2.4" d="${vomitory}"/>`;
    }
    return svg;
  };

  // The tiers. A ring that no concourse leads to is the first of its chain: a low wall stands under its first row.
  const chained = new Set<StandRing>();
  const links = stands.concourses.map((c, ci) => {
    let at = stands.rings.findIndex((r) => r.hole === c.region);
    if (at < 1) at = Math.min(ci + 1, stands.rings.length - 1);
    chained.add(stands.rings[at]);
    return { c, before: stands.rings[at - 1], after: stands.rings[at] };
  });

  for (const ring of stands.rings) {
    const strips = stripsOf(ring.region, ring.hole, ring.more ?? [], cut);
    const into = ring.tier === "wall" ? wallSeats : seatPlanes;
    for (const q of quadsOf(strips)) {
      const slope = slopeOf(q, lift + ring.height[0], lift + ring.height[1]);
      if (slope === undefined) continue;
      for (const piece of pieces(tidy(q))) {
        count += 1;
        const p = raked(`${ring.id}-${count}`, "seats", piece, slope.slope, slope.along, paint(ring, piece));
        if (p !== undefined) into.push({ ...p, shy: slope.out });
      }
    }
    // The low wall under the first row of a tier the walks do not lead to (a ballpark's wall seats stand on the fence, which the fence's own planes make).
    if (ring.tier !== "wall" && !chained.has(ring) && ring.height[0] > 0.5) {
      strips.forEach((strip, si) => {
        for (let i = 0; i + 1 < strip.inner.length; i += 1) {
          const [a, b] = [strip.inner[i], strip.inner[i + 1]];
          if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.5 || inCover([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])) continue;
          const h = lift + ring.height[0];
          const w = wall(`${ring.id}-front-${si === 0 ? "" : `s${si}-`}${i}`, "fascia", a[0], a[1], b[0], b[1], 0, h, `<rect class="u-fascia" width="${n(Math.hypot(b[0] - a[0], b[1] - a[1]))}" height="${n(h)}"/>`);
          seatPlanes.push(shy(w, centre));
        }
      });
    }
  }

  // The walks between the tiers: a plane from the outer edge of one tier up to the first row of the next.
  for (const { c, before, after } of links) {
    if (before === undefined || after === undefined) continue;
    for (const q of quadsOf(stripsOf(c.region, c.hole, [], cut))) {
      const slope = slopeOf(q, lift + before.height[1], lift + after.height[0]);
      if (slope === undefined) continue;
      for (const piece of pieces(tidy(q))) {
        count += 1;
        const p = raked(`walk-${count}`, "concourse", piece, slope.slope, slope.along, (corners) => `<polygon class="u-conc" points="${pointList(corners)}"/>`);
        if (p !== undefined) seatPlanes.push({ ...p, shy: slope.out });
      }
    }
  }

  const items: Upright[] = [];
  if (seatPlanes.length > 0) items.push({ id: "stands", kind: "stands", at: centre, height: topOf(seatPlanes), planes: seatPlanes });
  if (wallSeats.length > 0) items.push({ id: "wall-seats", kind: "wall-seats", at: centre, height: topOf(wallSeats), planes: wallSeats });

  // The roof: a canopy over the back of the top tier, or a lid over it in a hall. A real venue has its own: the walls of its building and a roof of its kind over them.
  const [walls, roof] = [v.walls ?? v.roof === true, v.roof === true];
  if (stands.real !== undefined && (walls || roof)) items.push(...realBuilding(stands.real, topRing(stands), centre, lift, ARC_STEPS[cut].oval * 2, v.roofOpen === true, { walls, roof }));
  const top = v.roof === true && crowd.roof && stands.real === undefined ? topRing(stands) : undefined;
  if (top !== undefined) {
    const lid = INDOOR.includes(String(o.sport));
    const reach = lid ? 1 : ROOF.canopyReach;
    const zOut = lift + top.height[1] + ROOF.clearance;
    const zIn = lid ? zOut + ROOF.lidRise : zOut - ROOF.canopyDrop;
    const planes: Plane[] = [];
    for (const strip of stripsOf(top.region, top.hole, top.more ?? [], cut)) {
      // The roof's inner edge is part of the way in from the tier's outer edge to its inner.
      const inner = strip.outer.map((p, i): Pt => [p[0] + (strip.inner[i][0] - p[0]) * reach, p[1] + (strip.inner[i][1] - p[1]) * reach]);
      for (const q of quadsOf([{ inner, outer: strip.outer }])) {
        const slope = slopeOf(q, zIn, zOut);
        if (slope === undefined) continue;
        for (const piece of pieces(tidy(q))) {
          count += 1;
          const p = raked(`roof-${count}`, "roof", piece, slope.slope, slope.along, (corners) => `<polygon class="u-roof" points="${pointList(corners)}"/>`);
          if (p !== undefined) planes.push({ ...p, shy: slope.out });
        }
      }
    }
    if (planes.length > 0) items.push({ id: "roof", kind: "roof", at: centre, height: topOf(planes), planes });
  }
  const r = stands.reach;
  return { items, defs, reach: Math.max(r.left, r.right, r.top, r.bottom) + 6 };
}
