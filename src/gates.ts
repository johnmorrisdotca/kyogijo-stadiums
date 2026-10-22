// The gates of a real venue: where the crowd goes in. A gate is a point on the building's outline (OpenStreetMap's, ODbL 1.0) with the way it faces (the bearing of its outward normal, degrees clockwise from north), a name in English
// and Japanese, and how it is known: `documented` where a source cited with it says it, `plausible` where it is ours (a gate on each street side, put where a ray from the middle of the surface at the bearing meets the outline).
// The data is the gates' list of facts (`GATE_FACTS`, with what each cites); the positions are worked out from the outline, so a venue whose outline changes keeps its gates on it. This is the data the crowd's timelapse will use
// for queues and entrances: where people stand in a line, which way the line runs (away from the gate along its bearing) and where the walkable ground starts. Pure: ids in, gates out.
import { stadiumById } from "./stadiums.ts";
import { venueById } from "./venues.ts";
import { lonLatFrom, metresFrom, type LonLat } from "./venues.geo.ts";
import type { Pt } from "./crowd.ts";

/** How a gate is known: `documented` is what a source cited with it says; `plausible` is ours. */
export type GateBasis = "documented" | "plausible";

/** What is said of a venue's gate: the way it faces, and what is read from where. */
export interface GateFact {
  /** A key that is the same on every run: `south`, `south-west-corner`. */
  id: string;
  /** The bearing of the gate's outward normal, degrees clockwise from north, 0 to under 360. */
  bearing: number;
  /** The name where a source gives one (`Gate G`); a plain description of where it is otherwise. */
  name?: { en: string; ja: string };
  basis: GateBasis;
  read: string;
}

/** A gate, placed on a venue's outline. */
export interface Gate {
  /** `bc-place:south`: the venue's id and the gate's. */
  key: string;
  venue: string;
  id: string;
  name: { en: string; ja: string };
  /** Where it stands on the outline, `[longitude, latitude]`. */
  at: LonLat;
  /** The bearing of its outward normal, degrees clockwise from north: the way a queue at it runs. */
  bearing: number;
  basis: GateBasis;
  read: string;
}

const WIND = [
  { en: "north", ja: "北" },
  { en: "north-east", ja: "北東" },
  { en: "east", ja: "東" },
  { en: "south-east", ja: "南東" },
  { en: "south", ja: "南" },
  { en: "south-west", ja: "南西" },
  { en: "west", ja: "西" },
  { en: "north-west", ja: "北西" },
] as const;
const ours = (reason: string): string => `ours: ${reason}`;
/** A gate on each of the eight sides of a building: ours, the sources say that a stadium has gates and not where each is. */
const SIDES = (venue: string): GateFact[] => WIND.map((_, i) => ({ id: WIND[i].en, bearing: i * 45, basis: "plausible", read: ours(`one gate on each of the eight sides of ${venue}'s building: the sources say that it has gates round the bowl and not where each is`) }));

/**
 * The facts of each venue's gates. BC Place: the English Wikipedia article (revision 1372065649) says a tear in the old roof was "close to Gate G on the south side where the roof meets the top of the concrete bowl", so there is a
 * Gate G on the south side (documented); the other seven are ours, one to each side of the building, on the street sides the brief names (Pacific Boulevard to the south, Robson and Beatty Streets). Rogers Arena: the brief's corner
 * entrance plazas on the Pat Quinn Way side, the south front and the two south corners, and one at the north-west, all ours.
 */
export const GATE_FACTS: Readonly<Record<string, readonly GateFact[]>> = Object.freeze({
  "bc-place": SIDES("BC Place").map((g): GateFact => (g.id === "south" ? { ...g, name: { en: "Gate G", ja: "ゲートG" }, basis: "documented", read: "the English Wikipedia article on BC Place, revision 1372065649: a tear in the old roof 'close to Gate G on the south side'; where on the south side is ours" } : g)),
  "rogers-arena": [
    { id: "south", bearing: 180, basis: "plausible", read: ours("the main front of the building faces Pat Quinn Way to the south, as the brief says") },
    { id: "south-west", bearing: 225, basis: "plausible", read: ours("a corner entrance plaza on the Pat Quinn Way side, as the brief says") },
    { id: "south-east", bearing: 135, basis: "plausible", read: ours("a corner entrance plaza on the Pat Quinn Way side, as the brief says") },
    { id: "north-west", bearing: 315, basis: "plausible", read: ours("a gate on the side of the Georgia Viaduct and the towers, one of those the brief asks for at the corners") },
  ],
});

/** The ids of the venues that have gates. */
export const GATE_VENUES: readonly string[] = Object.freeze(Object.keys(GATE_FACTS));

/** The point where a ray from the origin at a compass bearing first meets a ring (both in metres east and north of the origin), or `undefined`. */
function hit(ring: readonly Pt[], bearing: number): Pt | undefined {
  const a = (bearing * Math.PI) / 180;
  const [dx, dy] = [Math.sin(a), Math.cos(a)];
  let best: number | undefined;
  ring.forEach(([ax, ay], i) => {
    const [bx, by] = ring[(i + 1) % ring.length];
    const [ex, ey] = [bx - ax, by - ay];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) return;
    const t = (ax * ey - ay * ex) / den;
    const u = (ax * dy - ay * dx) / den;
    if (t > 1e-6 && u >= 0 && u <= 1 && (best === undefined || t < best)) best = t;
  });
  return best === undefined ? undefined : [dx * best, dy * best];
}

/** The outline and the middle of a venue's surface that its gates are placed from, `[longitude, latitude]`: an arena's, or a stadium's. */
function outlineOf(id: string): { ring: readonly (readonly [number, number])[]; centre: LonLat } | undefined {
  const venue = venueById(id);
  if (venue !== undefined) return { ring: venue.osm.ring, centre: venue.osm.axis.centre as LonLat };
  const stadium = stadiumById(id);
  return stadium === undefined ? undefined : { ring: stadium.osm.ring, centre: stadium.osm.axis.centre as LonLat };
}

/** The name of a gate in a language: the source's where there is one, else its side (`South-west gate`). */
export function gateName(fact: GateFact, language: "en" | "ja"): string {
  if (fact.name !== undefined) return fact.name[language];
  const side = WIND.find((w) => w.en === fact.id.replace(/-corner$/, ""));
  return language === "ja" ? `${side?.ja ?? fact.id}ゲート` : `${(side?.en ?? fact.id).replace(/^./, (c) => c.toUpperCase())} gate`;
}

/**
 * The gates of a venue (`bc-place`, `rogers-arena`), each on the building's outline where a ray from the middle of the surface at its bearing meets it; empty for a venue with none. A gate whose ray misses the outline is left out
 * (none does for the venues here: a test holds it).
 * @example
 * ```ts
 * import { venueGates } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const gates = venueGates("bc-place");
 * console.log(gates.length, gates.filter((g) => g.basis === "documented").map((g) => g.name.en).join(", "));
 * // 8 Gate G
 * ```
 */
export function venueGates(id: string): Gate[] {
  const facts = GATE_FACTS[id];
  const outline = outlineOf(id);
  if (facts === undefined || outline === undefined) return [];
  const ring = metresFrom(outline.centre, outline.ring as LonLat[]);
  const gates: Gate[] = [];
  for (const fact of facts) {
    const p = hit(ring, fact.bearing);
    if (p === undefined) continue;
    gates.push({ key: `${id}:${fact.id}`, venue: id, id: fact.id, name: { en: gateName(fact, "en"), ja: gateName(fact, "ja") }, at: lonLatFrom(outline.centre, p).map((x) => Math.round(x * 1e6) / 1e6) as unknown as LonLat, bearing: fact.bearing, basis: fact.basis, read: fact.read });
  }
  return gates;
}
