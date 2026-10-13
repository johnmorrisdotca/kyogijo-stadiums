import { describe, expect, it } from "vitest";
import { sceneToGeoJSON, type FeatureCollection, type Geometry, type Position } from "./geojson.ts";
import { corpus, GAME } from "./scene.fixture.ts";
import { sceneOf } from "./scene.ts";

/** What RFC 7946 asks of the shape of a GeoJSON text, checked as the RFC is written (sections 3.1 and 3.2). Returns the problems. */
function problems(collection: FeatureCollection): string[] {
  const bad: string[] = [];
  const position = (p: unknown, where: string): void => {
    if (!Array.isArray(p) || p.length < 2 || p.length > 3 || !p.every((n) => typeof n === "number" && Number.isFinite(n))) bad.push(`${where}: not a position`);
  };
  const ring = (r: Position[], where: string): void => {
    if (r.length < 4) bad.push(`${where}: a linear ring has four positions at least`);
    r.forEach((p, i) => position(p, `${where}[${i}]`));
    if (r.length > 0 && (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1])) bad.push(`${where}: a linear ring is closed`);
  };
  const signed = (r: Position[]): number => {
    let sum = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i, i += 1) sum += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
    return sum / 2;
  };
  const polygon = (rings: Position[][], where: string): void => {
    if (rings.length === 0) bad.push(`${where}: a polygon has a ring`);
    rings.forEach((r, i) => {
      ring(r, `${where}[${i}]`);
      if (r.length >= 4) {
        const area = signed(r);
        if (i === 0 && area <= 0) bad.push(`${where}[0]: the exterior ring runs counter-clockwise`);
        if (i > 0 && area >= 0) bad.push(`${where}[${i}]: a hole runs clockwise`);
      }
    });
  };
  const geometry = (g: Geometry, where: string): void => {
    switch (g.type) {
      case "Point":
        position(g.coordinates, where);
        break;
      case "LineString":
        if (g.coordinates.length < 2) bad.push(`${where}: a line has two positions at least`);
        g.coordinates.forEach((p, i) => position(p, `${where}[${i}]`));
        break;
      case "MultiLineString":
        g.coordinates.forEach((line, i) => {
          if (line.length < 2) bad.push(`${where}[${i}]: a line has two positions at least`);
          line.forEach((p, k) => position(p, `${where}[${i}][${k}]`));
        });
        break;
      case "Polygon":
        polygon(g.coordinates, where);
        break;
      case "MultiPolygon":
        g.coordinates.forEach((p, i) => polygon(p, `${where}[${i}]`));
        break;
      default:
        bad.push(`${where}: unknown type`);
    }
  };
  if (collection.type !== "FeatureCollection") bad.push("not a FeatureCollection");
  collection.features.forEach((f, i) => {
    if (f.type !== "Feature") bad.push(`#${i}: not a Feature`);
    if (typeof f.properties !== "object" || f.properties === null) bad.push(`#${i}: properties is an object`);
    geometry(f.geometry, `#${i}`);
  });
  const all: Position[] = [];
  const gather = (c: unknown): void => (typeof (c as Position)[0] === "number" ? void all.push(c as Position) : (c as unknown[]).forEach(gather));
  for (const f of collection.features) gather(f.geometry.coordinates);
  if (all.length > 0) {
    const want = [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))];
    if (JSON.stringify(collection.bbox) !== JSON.stringify(want)) bad.push(`bbox ${JSON.stringify(collection.bbox)} is not ${JSON.stringify(want)}`);
  }
  return bad;
}

describe("sceneToGeoJSON", () => {
  it("is a valid FeatureCollection (RFC 7946) for every drawing of the package, and survives JSON", () => {
    for (const d of corpus()) {
      const collection = sceneToGeoJSON(d.svg);
      expect(problems(collection), d.name).toEqual([]);
      expect(JSON.parse(JSON.stringify(collection))).toEqual(collection);
    }
  });

  it("has a feature for each shape, in paint order, with how it is painted in its properties", () => {
    const scene = sceneOf({ sport: "nhl", ...GAME });
    const collection = sceneToGeoJSON(scene);
    expect(collection.features.length).toBe(scene.items.length);
    const orders = collection.features.map((f) => f.properties.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    const surface = collection.features.find((f) => f.properties.class === "ky-surface");
    expect(surface?.geometry.type).toBe("Polygon");
    expect(surface?.properties).toMatchObject({ kind: "path", fill: "#eef5fa" });
    const line = collection.features.find((f) => f.properties.class === "ky-red");
    expect(line?.geometry.type).toBe("LineString");
    expect(line?.properties.stroke).toBe("#c8372d");
    expect(typeof line?.properties.strokeWidth).toBe("number");
    const word = collection.features.find((f) => f.properties.text === "HCG");
    expect(word?.geometry.type).toBe("Point");
    expect(word?.properties.kind).toBe("text");
    const image = collection.features.find((f) => f.properties.href !== undefined);
    expect(image?.geometry.type).toBe("Polygon");
    expect(collection.kyogijo).toMatchObject({ sport: "nhl", frame: "surface", unit: "ft" });
  });

  it("puts a ring inside another as a hole of it, wound the other way", () => {
    const collection = sceneToGeoJSON({ sport: "nhl", id: "h" });
    const boards = collection.features.find((f) => f.properties.class === "ky-boards");
    expect(boards?.geometry.type).toBe("Polygon");
    const rings = (boards?.geometry as { coordinates: Position[][] }).coordinates;
    expect(rings.length).toBe(2);
    // The boards are the ring between two outlines: the hole is the playing surface.
    const x = (r: Position[]): number[] => r.map((p) => p[0]);
    expect(Math.min(...x(rings[0]))).toBeCloseTo(-2.4, 3);
    expect(Math.min(...x(rings[1]))).toBeCloseTo(0, 3);
    expect(collection.bbox).toEqual([-8, -8, 208, 93]);
  });

  it("is in the surface's own feet from its left end and its top, and a tall drawing is turned back", () => {
    const wide = sceneToGeoJSON({ sport: "nhl", id: "t" }, { filter: (i) => i.class === "ky-surface" });
    expect(wide.bbox).toEqual([0, 0, 200, 85]);
    const tall = sceneToGeoJSON({ sport: "nhl", id: "t", orientation: "portrait" }, { filter: (i) => i.class === "ky-surface" });
    expect(tall.bbox).toEqual([0, 0, 200, 85]);
    expect(tall.features[0].geometry).toEqual(wide.features[0].geometry);
    // A curling sheet lies tall by default; its numbers are still the sheet's own: 150 feet long.
    const sheet = sceneToGeoJSON({ sport: "curling", id: "t" }, { filter: (i) => i.class === "ky-surface" });
    expect(sheet.bbox).toEqual([0, 0, 150, 15.58]);
  });

  it("writes the numbers in a provider's frame when asked: the NHL API's centre ice is (0, 0)", () => {
    const centre = (frame: string | undefined): Position => {
      const c = sceneToGeoJSON({ sport: "nhl", id: "f" }, { frame, filter: (i) => i.class === "ky-blue-fill" });
      const ring = (c.features[0].geometry as { coordinates: Position[][] }).coordinates[0];
      const xs = ring.map((p) => p[0]);
      const ys = ring.map((p) => p[1]);
      return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2].map((v) => Math.round(v * 100) / 100) as Position;
    };
    expect(centre(undefined)).toEqual([100, 42.5]);
    expect(centre("nhl-api")).toEqual([0, 0]);
    const hockeytech = centre("hockeytech");
    expect(hockeytech[0]).toBeCloseTo(300, 0);
    expect(hockeytech[1]).toBeCloseTo(150, 0);
    expect(sceneToGeoJSON({ sport: "nhl", id: "f" }, { frame: "nhl-api" }).kyogijo).toMatchObject({ frame: "nhl-api", unit: "ft" });
    expect(problems(sceneToGeoJSON({ sport: "nhl", id: "f" }, { frame: "nhl-api" }))).toEqual([]);
    expect(() => sceneToGeoJSON({ sport: "nhl", id: "f" }, { frame: "no-such" })).toThrow(/Unknown frame/);
    // A frame for a pitch of any size needs the pitch's size.
    expect(() => sceneToGeoJSON({ sport: "soccer", id: "f" }, { frame: "opta" })).toThrow(/give the size/);
    const opta = sceneToGeoJSON({ sport: "soccer", id: "f" }, { frame: "opta", size: { length: 105, width: 68, unit: "m" }, filter: (i) => i.class === "ky-surface" });
    expect(opta.bbox?.map((v) => Math.round(v))).toEqual([0, 0, 100, 100]);
  });

  it("filters shapes, rounds the numbers and keeps the data of a layer", () => {
    const only = sceneToGeoJSON({ sport: "nhl", id: "f" }, { filter: (i) => i.kind === "circle" });
    expect(only.features.every((f) => f.properties.kind === "circle")).toBe(true);
    const rounded = sceneToGeoJSON({ sport: "nhl", id: "f" }, { precision: 1 });
    for (const f of rounded.features) JSON.stringify(f.geometry.coordinates).match(/-?\d+\.\d+/g)?.forEach((n) => expect(n.split(".")[1].length).toBeLessThanOrEqual(1));
    const layered = sceneToGeoJSON({ sport: "nhl", id: "f", layers: [{ kind: "points", data: [{ x: 100, y: 40, title: "Shot" }] }] as never });
    const mark = layered.features.find((f) => f.properties.data?.kind === "points");
    expect(mark?.geometry.type).toBe("Polygon");
  });
});
