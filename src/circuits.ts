// The circuits: each one's facts and what OpenStreetMap maps of it, and its plan, the drawing's own frame worked out from them. The lap is laid flat in metres round its middle, turned so that its long side lies
// along the page (north is wherever that puts it, and an arrow says where), and given in feet, the frame every drawing and 3D view of the package is in. Pure: data in, numbers out.
import type { Pt } from "./crowd.ts";
import { CIRCUIT_DATA } from "./circuits.data.ts";
import { CIRCUIT_OSM } from "./circuits.osm.data.ts";
import { bendAt, lineLength, nearestOn } from "./circuits.geo.ts";
import type { Circuit, CircuitOsm } from "./circuits.types.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";
import { metresFrom, northOn, smallestBox, turnedTo, type LonLat } from "./venues.geo.ts";

/** The credit a drawing made from OpenStreetMap's data carries (the same words as the venues'). */
export const CIRCUIT_ATTRIBUTION = "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright";

/** Every circuit, in the order of the data. */
export const CIRCUITS: readonly Circuit[] = Object.freeze(
  CIRCUIT_DATA.map((c): Circuit => {
    const osm = CIRCUIT_OSM[c.id];
    if (osm === undefined) throw new Error(`the circuit ${c.id} has no OpenStreetMap record`);
    return Object.freeze({ ...c, osm });
  }),
);

/** The keys of the circuits. */
export const CIRCUIT_IDS: readonly string[] = Object.freeze(CIRCUITS.map((c) => c.id));

/** A circuit by its key, or `undefined`. */
export const circuitById = (id: string): Circuit | undefined => CIRCUITS.find((c) => c.id === id);

/** A turn as the plan places it: its number, its point on the lap, how far round the lap it is, which way the lap runs there and the side the bend turns to (1 left, -1 right, 0 straight). */
export interface PlanTurn {
  n: number;
  at: Pt;
  along: number;
  dir: Pt;
  side: -1 | 0 | 1;
}

/** A circuit's plan in the drawing's frame: feet, the long side of the lap along x, y down the page. */
export interface CircuitPlan {
  circuit: Circuit;
  /** The point of the map the frame is measured from (the middle of the lap's box), `[longitude, latitude]`. */
  origin: LonLat;
  /** The heading of the lap's long side, degrees clockwise from north, and the way north points on the page, degrees clockwise from its top. */
  heading: number;
  north: number;
  lap: Pt[];
  /** The length of the lap measured along the drawn line, in metres. */
  measured: number;
  pitLane: Pt[];
  area: Pt[];
  building?: { ring: Pt[]; height: number };
  turns: PlanTurn[];
  start: { at: Pt; dir: Pt; along: number };
  finish: { at: Pt; dir: Pt; along: number };
  /** The track's width and the pit lane's, in feet. */
  width: number;
  pitWidth: number;
  /** The box of everything drawn on the ground, in feet. */
  box: { x0: number; y0: number; x1: number; y1: number };
}

const points = (osm: CircuitOsm): LonLat[] => [...osm.lap, ...osm.pitLane.line, ...osm.area.ring, ...(osm.pitBuilding?.ring ?? [])];

/** A circuit's plan: its lap, pit lane, ground, pit building, turns, start and finish in the drawing's frame. */
export function circuitPlan(circuit: Circuit): CircuitPlan {
  const osm = circuit.osm;
  const all = points(osm);
  const lons = all.map((p) => p[0]);
  const lats = all.map((p) => p[1]);
  const origin: LonLat = [(Math.min(...lons) + Math.max(...lons)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
  const lapMetres = metresFrom(origin, osm.lap);
  const heading = smallestBox(lapMetres).heading;
  const frame = (ring: readonly LonLat[]): Pt[] => metresFrom(origin, ring).map((p) => {
    const [x, y] = turnedTo(heading, p);
    return [x * FT, y * FT];
  });
  const lap = frame(osm.lap);
  const place = (at: LonLat): { at: Pt; dir: Pt; along: number } => {
    const near = nearestOn(lap, frame([at])[0], true);
    const bend = bendAt(lap, near.along, 30 * FT);
    return { at: near.at, dir: bend.dir, along: near.along };
  };
  const turns = osm.turns.map((t): PlanTurn => {
    const near = nearestOn(lap, frame([t.at])[0], true);
    const bend = bendAt(lap, near.along, 40 * FT);
    return { n: t.n, at: near.at, along: near.along, dir: bend.dir, side: bend.side };
  });
  const pitLane = frame(osm.pitLane.line);
  const area = frame(osm.area.ring);
  const building = osm.pitBuilding === undefined ? undefined : { ring: frame(osm.pitBuilding.ring), height: osm.pitBuilding.height * FT };
  const xs = [...lap, ...pitLane, ...area, ...(building?.ring ?? [])].map((p) => p[0]);
  const ys = [...lap, ...pitLane, ...area, ...(building?.ring ?? [])].map((p) => p[1]);
  return {
    circuit,
    origin,
    heading,
    north: northOn(heading),
    lap,
    measured: lineLength(lapMetres, true),
    pitLane,
    area,
    ...(building === undefined ? {} : { building }),
    turns,
    start: place(osm.start.at),
    finish: place(osm.finish.at),
    width: circuit.width.value * FT,
    pitWidth: circuit.pitLaneWidth.value * FT,
    box: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
  };
}

/** The circuit a set of options names, or an error that lists the keys. */
export function circuitOf(id: string): Circuit {
  const found = circuitById(id);
  if (found === undefined) throw new Error(`no circuit "${String(id)}": the circuits are ${CIRCUIT_IDS.join(", ")}`);
  return found;
}
