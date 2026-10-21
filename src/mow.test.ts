import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./index.ts";
import { mowPark, mowTurf } from "./mow.ts";

/** The polygons of a path made of `M x y L x y ... z` subpaths: the lists of their corners. */
function polygons(path: string): [number, number][][] {
  return path.split("z").filter((part) => part.trim() !== "").map((part) => {
    expect(part.startsWith("M"), part).toBe(true);
    return part.slice(1).split("L").map((pair): [number, number] => {
      const [x, y] = pair.trim().split(/\s+/).map(Number);
      expect(Number.isFinite(x) && Number.isFinite(y), pair).toBe(true);
      return [x, y];
    });
  });
}

/** Whether a point is inside a polygon (even-odd). */
function inside(poly: readonly [number, number][], [x, y]: [number, number]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
const mown = (shapes: readonly [number, number][][], point: [number, number]): boolean => shapes.some((poly) => inside(poly, point));

describe("the diamonds: the crosshatch of a ballpark's outfield", () => {
  const park = { umin: -300, umax: 300, vmax: 400 };

  it("are squares of a band with their sides along the foul lines, alternating from home plate out, cut to the fair ground by a clip path", () => {
    const made = mowPark("diamonds", park, 30);
    expect(made.clip).toBe(true);
    expect(made.evenodd).toBe(false);
    const shapes = polygons(made.path);
    expect(shapes.length).toBeGreaterThan(40);
    for (const poly of shapes) {
      expect(poly).toHaveLength(4);
      // Four sides of 30 feet, each at 45 degrees to the way out to centre field: parallel to a foul line.
      for (let i = 0; i < 4; i += 1) {
        const [a, b] = [poly[i], poly[(i + 1) % 4]];
        const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
        expect(Math.hypot(dx, dy)).toBeCloseTo(30, 1);
        expect(Math.abs(Math.abs(dx) - Math.abs(dy))).toBeLessThan(0.02);
      }
    }
    // A cell a band along either foul line from home plate is mown, the first cell and its neighbours along the lines are not (the tones alternate), and the cell beyond the neighbour is mown again.
    const along = (a: number, b: number): [number, number] => [((a - b) * Math.SQRT1_2), -((a + b) * Math.SQRT1_2)];
    expect(mown(shapes, along(15, 15))).toBe(false);
    expect(mown(shapes, along(45, 15))).toBe(true);
    expect(mown(shapes, along(15, 45))).toBe(true);
    expect(mown(shapes, along(75, 15))).toBe(false);
    expect(mown(shapes, along(45, 45))).toBe(false);
    expect(mown(shapes, along(75, 45))).toBe(true);
  });

  it("covers the whole fair ground: every point of it is in a cell, mown or not, and the cells reach the fence", () => {
    const shapes = polygons(mowPark("diamonds", park, 30).path);
    // The mown cells are half of the lattice: a point in a mown cell one band from the fence's reach is found.
    const reach = Math.max(...shapes.flat().map((p) => -p[1]));
    expect(reach).toBeGreaterThanOrEqual(park.vmax);
    const left = Math.min(...shapes.flat().map((p) => p[0]));
    expect(left).toBeLessThanOrEqual(park.umin + 30);
  });

  it("is mown the same at both ends of a rectangle of turf, whatever its size, with a diamond centred on it", () => {
    for (const [w, h, band] of [[360, 160, 15], [344.5, 223, 18], [300, 150, 10], [120, 53.3, 5]] as const) {
      const made = mowTurf("diamonds", { x: 0, y: 0, w, h }, band);
      expect(made.clip).toBe(true);
      const shapes = polygons(made.path);
      expect(shapes.length).toBeGreaterThan(10);
      // The lattice is symmetric about the centre, so a point and its mirror image through the centre have the same tone.
      for (const [fx, fy] of [[0.02, 0.5], [0.1, 0.2], [0.3, 0.7], [0.45, 0.45]] as const) {
        expect(mown(shapes, [w * fx, h * fy]), `${w}x${h} ${fx},${fy}`).toBe(mown(shapes, [w * (1 - fx), h * (1 - fy)]));
      }
      // The centre is the middle of an unmown diamond.
      expect(mown(shapes, [w / 2, h / 2])).toBe(false);
    }
  });

  it("is drawn on a football field, a soccer pitch and a ballpark, as the lighter tone cut to the turf or to the fair ground", () => {
    for (const sport of ["nfl", "soccer", "mlb"] as const) {
      const svg = drawKyogijo({ sport, id: "d", stripePattern: "diamonds" });
      expect(svg).toContain("ky-stripe");
      expect(svg).toMatch(sport === "mlb" ? /clip-path="url\(#d-fair\)"/ : /clip-path="url\(#d-turf\)"/);
    }
    expect(drawKyogijo({ sport: "mlb", id: "d", stripePattern: "diamonds" })).not.toBe(drawKyogijo({ sport: "mlb", id: "d", stripePattern: "checks" }));
    // An unknown name is still the usual bands, and a surface with no grass ignores the pattern.
    expect(drawKyogijo({ sport: "nhl", id: "d", stripePattern: "diamonds" })).toBe(drawKyogijo({ sport: "nhl", id: "d" }));
  });
});
