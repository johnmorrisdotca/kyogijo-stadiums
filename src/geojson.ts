// A scene as GeoJSON: each shape a feature, in the drawing's own units (feet) or a provider's frame, for map engines and GIS tools that take a flat plane.
import { frameByName, fromSurface, type Frame, type SurfaceSize } from "./frames.ts";
import { flatten, invert, multiply, shapeCommands } from "./scene.path.ts";
import { sceneOf } from "./scene.ts";
import type { Matrix, Scene, SceneItem, SceneOptions, SceneShape, SceneSource } from "./scene.types.ts";

/** A position, a ring of them and so on, as GeoJSON has them. */
export type Position = [number, number];
export type Geometry =
  | { type: "Point"; coordinates: Position }
  | { type: "LineString"; coordinates: Position[] }
  | { type: "MultiLineString"; coordinates: Position[][] }
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] };

/** A shape of the drawing, with how it is painted. */
export interface Feature {
  type: "Feature";
  geometry: Geometry;
  properties: {
    /** The shape's place in the paint order, from 0. */
    order: number;
    kind: SceneItem["kind"];
    class: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    label?: string;
    text?: string;
    fontSize?: number;
    href?: string;
    data?: Record<string, string>;
  };
}

/** The drawing: every shape, and what the numbers are. */
export interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
  /** `[west, south, east, north]` of the numbers, which for this collection are `x` and `y`. */
  bbox?: [number, number, number, number];
  /** A foreign member (RFC 7946, 6.1): what the numbers are. */
  kyogijo: { sport?: string; frame: string; unit: string; note: string };
}

/** What `sceneToGeoJSON` takes besides the drawing. */
export interface GeoJsonOptions extends SceneOptions {
  /** A provider's coordinate frame (`"nhl-api"`, `"opta"`, a `Frame` of your own) to write the numbers in. Without one, the surface's own: feet from its left end and its top. */
  frame?: string | Frame;
  /** The surface's size, for a frame that is for a surface of any size (the soccer providers). */
  size?: SurfaceSize;
  /** Leave out the shapes this returns false for (the apron, the teams' names). All by default. */
  filter?: (item: SceneItem) => boolean;
  /** Decimals in a coordinate. 4. */
  precision?: number;
}

const area = (ring: readonly Position[]): number => {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return sum / 2;
};

function inside(ring: readonly Position[], [x, y]: Position): boolean {
  let yes = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) yes = !yes;
  }
  return yes;
}

/** The rings of a filled shape as polygons: a ring inside an odd number of others is a hole of the smallest ring round it. Exterior rings turn counter-clockwise and holes clockwise, as RFC 7946 (3.1.6) says. */
function polygons(rings: Position[][], toOut: (p: Position[]) => Position[]): Position[][][] {
  const depth = rings.map((ring, i) => rings.filter((other, j) => j !== i && inside(other, ring[0])).length);
  const out: { outer: Position[]; holes: Position[][]; at: number }[] = [];
  rings.forEach((ring, i) => {
    if (depth[i] % 2 === 0) out.push({ outer: ring, holes: [], at: i });
  });
  rings.forEach((ring, i) => {
    if (depth[i] % 2 === 0) return;
    const parents = out.filter((p) => inside(p.outer, ring[0]) && depth[p.at] === depth[i] - 1);
    const parent = parents.sort((a, b) => Math.abs(area(a.outer)) - Math.abs(area(b.outer)))[0];
    if (parent !== undefined) parent.holes.push(ring);
  });
  return out.map((p) => {
    const outer = toOut(p.outer);
    const holes = p.holes.map(toOut);
    return [area(outer) >= 0 ? outer : [...outer].reverse(), ...holes.map((h) => (area(h) <= 0 ? h : [...h].reverse()))];
  });
}

const close = (ring: Position[]): Position[] => {
  const [first] = ring;
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];
};

/**
 * A scene as a GeoJSON FeatureCollection (RFC 7946): a filled shape is a Polygon or MultiPolygon (a ring inside another is its hole, the winding as the
 * RFC has it), a line a LineString, a label a Point with its `text`. The numbers are the drawing's own, feet from the surface's left end and its top (a tall
 * drawing is turned back), or those of a provider's `frame`; this is a flat plane and not longitude and latitude, so give it to a tool that takes one (Leaflet's
 * `CRS.Simple`, d3's `geoIdentity`, deck.gl's Cartesian coordinates). The painting of each shape is in its properties.
 * @example
 * ```ts
 * import { sceneToGeoJSON } from "@johnmorrisdotca/kyogijo-stadiums/geojson";
 * const rink = sceneToGeoJSON({ sport: "nhl", id: "rink" }, { filter: (item) => item.class.includes("ky-surface") });
 * console.log(rink.type, rink.features.length, rink.features[0].geometry.type, rink.bbox);
 * // FeatureCollection 1 Polygon [ 0, 0, 200, 85 ]
 * ```
 */
export function sceneToGeoJSON(source: SceneSource, options: GeoJsonOptions = {}): FeatureCollection {
  const scene: Scene = sceneOf(source, options);
  const precision = options.precision ?? 4;
  const round = (v: number): number => {
    const k = 10 ** precision;
    const r = Math.round(v * k) / k;
    return Object.is(r, -0) ? 0 : r;
  };
  const unturn: Matrix | undefined = scene.turn === undefined ? undefined : invert(scene.turn);
  const frame = options.frame === undefined ? undefined : typeof options.frame === "string" ? frameByName(options.frame) : options.frame;
  const mapPoints = (points: Position[]): Position[] => {
    const moved = frame === undefined ? points : fromSurface(points, { to: frame, size: options.size });
    return moved.map(([x, y]): Position => [round(x), round(y)]);
  };
  const matrixOf = (item: SceneItem): Matrix => (item.surface === true && unturn !== undefined ? multiply(unturn, item.matrix) : item.matrix);
  const features: Feature[] = [];
  let box: [number, number, number, number] | undefined;
  const grow = (g: Geometry): void => {
    const visit = (c: unknown): void => {
      if (typeof (c as Position)[0] === "number") {
        const [x, y] = c as Position;
        box = box === undefined ? [x, y, x, y] : [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)];
      } else for (const inner of c as unknown[]) visit(inner);
    };
    visit(g.coordinates);
  };
  scene.items.forEach((item, order) => {
    // A pageant's pictures are a picture laid over the surface, not a part of it: they are left out.
    if (item.data?.pg !== undefined) return;
    if (options.filter !== undefined && !options.filter(item)) return;
    const s = item.style;
    const properties: Feature["properties"] = {
      order,
      kind: item.kind,
      class: item.class,
      ...(typeof s.fill === "string" && s.fill !== "none" ? { fill: s.fill } : {}),
      ...(typeof s.stroke === "string" && s.stroke !== "none" ? { stroke: s.stroke, strokeWidth: round(s.strokeWidth) } : {}),
      ...(s.opacity !== 1 ? { opacity: s.opacity } : {}),
      ...(item.label === undefined ? {} : { label: item.label }),
      ...(item.data === undefined ? {} : { data: { ...item.data } }),
    };
    const m = matrixOf(item);
    let geometry: Geometry | undefined;
    if (item.kind === "text") {
      const [point] = flatten([["M", item.x, item.y]], m).flatMap((r) => r.points);
      geometry = { type: "Point", coordinates: mapPoints([point])[0] };
      properties.text = item.text;
      properties.fontSize = item.fontSize;
    } else {
      const shape: SceneShape =
        item.kind === "image" ? { ...item, kind: "rect", x: item.x, y: item.y, width: item.width, height: item.height, rx: 0 } : item;
      if (item.kind === "image") properties.href = item.href;
      const rings = flatten(shapeCommands(shape), m);
      const filled = item.kind === "image" || s.fill !== "none";
      const areas = rings.filter((r) => r.points.length >= 3);
      if (filled && areas.length > 0) {
        const polys = polygons(areas.map((r) => r.points as Position[]), (ring) => close(mapPoints(ring)));
        geometry = polys.length === 1 ? { type: "Polygon", coordinates: polys[0] } : { type: "MultiPolygon", coordinates: polys };
      } else {
        const lines = rings.filter((r) => r.points.length >= 2).map((r) => mapPoints(r.closed ? close(r.points as Position[]) : (r.points as Position[])));
        if (lines.length === 1) geometry = { type: "LineString", coordinates: lines[0] };
        else if (lines.length > 1) geometry = { type: "MultiLineString", coordinates: lines };
      }
    }
    if (geometry === undefined) return;
    grow(geometry);
    features.push({ type: "Feature", geometry, properties });
  });
  return {
    type: "FeatureCollection",
    features,
    ...(box === undefined ? {} : { bbox: box }),
    kyogijo: {
      ...(scene.sport === undefined ? {} : { sport: scene.sport }),
      frame: frame === undefined ? "surface" : frame.name,
      unit: frame === undefined ? "ft" : String(frame.unit),
      note: "Flat plane coordinates, not longitude and latitude.",
    },
  };
}
