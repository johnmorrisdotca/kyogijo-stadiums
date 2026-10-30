import { describe, expect, it } from "vitest";
import type { Pt } from "./crowd.ts";
import { buildTurn } from "./turn-entry.ts";
import type { Plane } from "./turn.kit.ts";
import { EAVE, SADDLE_CELLS, TOWERS, quadPlane, saddleHeight, saddleRoof, saddleTowers, saddleWalls } from "./venue.saddle.ts";
import { VENUES, planVenue } from "./venues.ts";
import "./venues.all.ts";

const SADDLEDOME = VENUES["scotiabank-saddledome"];
const plan = planVenue(SADDLEDOME);
const saddle = plan.bowl.shell.saddle!;
const OPTIONS = { sport: "nhl", arena: "scotiabank-saddledome", crowd: { real: true } } as const;

/** The plan points and heights of a plane's three exact corners (its first, its end along u and its end along v). */
const corners = (p: Plane): readonly (readonly [number, number, number])[] => [p.o, [p.o[0] + p.u[0], p.o[1] + p.u[1], p.o[2] + p.u[2]], [p.o[0] + p.v[0], p.o[1] + p.v[1], p.o[2] + p.v[2]]];

describe("the Saddledome's roof is a reverse hyperbolic paraboloid over a round plan", () => {
  it("has the measure the data gives: a round plan about the bowl's middle, the line of its high points turned from the compass bearing by the way the rink lies, 78 feet at the low rim and 138 at the high points", () => {
    const data = SADDLEDOME.roof.saddle!;
    expect(data).toMatchObject({ bearing: 60, low: 78, high: 138 });
    expect(saddle.centre).toEqual([plan.box.x + plan.box.w / 2, plan.box.y + plan.box.h / 2]);
    // The rink is drawn east-west (its direction is not known), so a line 60 degrees clockwise from north lies 30 degrees over the rink's line.
    const turn = ((60 - plan.orientation.heading) * Math.PI) / 180;
    expect(saddle.axis[0]).toBeCloseTo(Math.cos(turn), 3);
    expect(saddle.axis[1]).toBeCloseTo(Math.sin(turn), 3);
    expect(Math.hypot(...saddle.axis)).toBeCloseTo(1, 3);
    // A circle of the building's own size: 142 metres across, less the annex's bulge.
    expect(saddle.radius * 0.3048 * 2).toBeGreaterThan(130);
    expect(saddle.radius * 0.3048 * 2).toBeLessThan(150);
    expect(saddle.low).toBe(plan.bowl.shell.edge);
    expect(saddle.high).toBe(138);
  });

  it("is high at the two ends of its line, low across it and the mean of the two in the middle, and curved both ways", () => {
    const at = (a: number, b: number): Pt => [saddle.centre[0] + saddle.radius * (a * saddle.axis[0] - b * saddle.axis[1]), saddle.centre[1] + saddle.radius * (a * saddle.axis[1] + b * saddle.axis[0])];
    // (The axis is kept to four decimals: a few thousandths of a foot.)
    expect(saddleHeight(saddle, at(1, 0))).toBeCloseTo(138, 1);
    expect(saddleHeight(saddle, at(-1, 0))).toBeCloseTo(138, 1);
    expect(saddleHeight(saddle, at(0, 1))).toBeCloseTo(78, 1);
    expect(saddleHeight(saddle, at(0, -1))).toBeCloseTo(78, 1);
    expect(saddleHeight(saddle, at(0, 0))).toBeCloseTo(108, 6);
    // Concave up along the line, concave down across it: a saddle (a pass between two peaks), not a bowl or a dome.
    const [m, l, r, t, b] = [saddleHeight(saddle, at(0, 0)), saddleHeight(saddle, at(0.5, 0)), saddleHeight(saddle, at(-0.5, 0)), saddleHeight(saddle, at(0, 0.5)), saddleHeight(saddle, at(0, -0.5))];
    expect(l).toBeGreaterThan(m);
    expect(r).toBeGreaterThan(m);
    expect(t).toBeLessThan(m);
    expect(b).toBeLessThan(m);
    // And exactly a paraboloid: the rise is the square of the way along the line less the square of the way across.
    expect(l - m).toBeCloseTo(-(t - m), 2);
    expect(saddleHeight(saddle, at(0.5, 0.5))).toBeCloseTo(m, 2);
  });

  it("is a net of quads, `cells` to a side and a beam round the rim, each corner of a quad on the surface, at every detail", () => {
    for (const cells of Object.values(SADDLE_CELLS)) {
      const roof = saddleRoof(saddle, 0, cells);
      expect(roof.filter((p) => p.id.startsWith("roof-")), `${cells}`).toHaveLength(cells * cells);
      expect(roof.filter((p) => p.id.startsWith("beam-")), `${cells}`).toHaveLength(4 * cells);
      for (const p of roof.filter((q) => q.id.startsWith("roof-"))) {
        // The first three corners of a quad are exact: they lie on the surface the data describes.
        for (const [x, y, z] of corners(p)) {
          expect(Number.isFinite(x + y + z), p.id).toBe(true);
          expect(z, p.id).toBeCloseTo(saddleHeight(saddle, [x, y]), 4);
        }
        expect(p.shy, p.id).toBeDefined();
        expect(p.kind).toBe("roof");
      }
    }
  });

  it("rises to the high points and falls to the low rim: the roof's rim is 78 feet at its lowest and 138 at its highest, the beam hanging its depth beneath", () => {
    const roof = saddleRoof(saddle, 0, SADDLE_CELLS.high);
    const rim = roof.filter((p) => p.id.startsWith("beam-")).flatMap((p) => [p.o[2]]);
    expect(Math.min(...rim)).toBeCloseTo(78, 0);
    expect(Math.max(...rim)).toBeCloseTo(138, 0);
    const under = roof.filter((p) => p.id.startsWith("beam-")).flatMap((p) => [p.o[2] + p.v[2]]);
    expect(Math.min(...under)).toBeCloseTo(78 - EAVE.depth, 0);
  });

  it("stands over the top row by at least its clearance everywhere: the bowl is under the roof", () => {
    const top = plan.bowl.rings.at(-1)!;
    const region = top.region as { x0: number; y0: number; x1: number; y1: number };
    const ring: Pt[] = Array.from({ length: 72 }, (_, k): Pt => {
      const a = (2 * Math.PI * k) / 72;
      return [(region.x0 + region.x1) / 2 + ((region.x1 - region.x0) / 2) * Math.cos(a), (region.y0 + region.y1) / 2 + ((region.y1 - region.y0) / 2) * Math.sin(a)];
    });
    for (const p of ring) expect(saddleHeight(saddle, p)).toBeGreaterThan(top.height[1] + 7);
  });

  it("has a bowl that is round: the outer edge of the top tier is nearly as wide as it is long, a round plan, and the tiers grow from the rink's own shape to it", () => {
    const outer = plan.bowl.rings.at(-1)!.region as { x0: number; y0: number; x1: number; y1: number; r: number };
    // (A little wider than tall: the first row and the walk round a 200-foot rink need the room.)
    const aspect = (outer.x1 - outer.x0) / (outer.y1 - outer.y0);
    expect(aspect).toBeGreaterThan(0.98);
    expect(aspect).toBeLessThan(1.12);
    expect(outer.r).toBeGreaterThan(Math.min(outer.x1 - outer.x0, outer.y1 - outer.y0) / 2 - 25);
    const aspects = plan.bowl.rings.map((ring) => {
      const r = ring.region as { x0: number; y0: number; x1: number; y1: number };
      return (r.x1 - r.x0) / (r.y1 - r.y0);
    });
    expect(aspects).toEqual([...aspects].sort((a, b) => b - a));
    expect(plan.fit).toBe("fits");
    expect(plan.total).toBe(19289);
  });
});

describe("the Saddledome's walls, beam and stair towers", () => {
  it("has a leaning wall of facets under the beam, a pier at every second one, and gives way by the eye's side", () => {
    for (const cells of Object.values(SADDLE_CELLS)) {
      const walls = saddleWalls(saddle, 0, cells, saddle.centre);
      expect(walls, `${cells}`).toHaveLength(4 * cells);
      expect(walls.filter((p) => p.svg.includes("u-pier")), `${cells}`).toHaveLength((4 * cells) / 2);
      for (const p of walls) {
        expect(p.shy, p.id).toBeDefined();
        expect(p.fadeTo, p.id).toBe(0.02);
        // The foot is on the ground, the top at the beam: the wall leans outward as it rises.
        expect(p.o[2], p.id).toBeCloseTo(0, 6);
        const top = [p.o[0] + p.v[0], p.o[1] + p.v[1]];
        const foot = [p.o[0], p.o[1]];
        const [rf, rt] = [Math.hypot(foot[0] - saddle.centre[0], foot[1] - saddle.centre[1]), Math.hypot(top[0] - saddle.centre[0], top[1] - saddle.centre[1])];
        expect(rt, p.id).toBeGreaterThan(rf);
      }
    }
  });

  it("has two stair towers at each of the roof's two high points: a round one and a square one, taller where the wall is", () => {
    const towers = saddleTowers(saddle, 0);
    for (const end of [0, 1]) {
      expect(towers.filter((p) => p.id.startsWith(`tower-${end}-round`)), `end ${end}`).toHaveLength(10 + 1);
      expect(towers.filter((p) => p.id.startsWith(`tower-${end}-square`)), `end ${end}`).toHaveLength(4 + 1);
    }
    const high = Math.max(...towers.map((p) => p.o[2] + Math.max(0, p.v[2])));
    expect(high).toBeLessThan(138 * TOWERS.round.share + 1);
    expect(high).toBeGreaterThan(60);
  });

  it("puts a plane's fourth corner where the plane has it, and drops a quad with no width", () => {
    const flat = quadPlane("q", "roof", [[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], (local) => JSON.stringify(local));
    expect(flat).toBeDefined();
    expect(JSON.parse(flat!.svg)).toEqual([[0, 0], [10, 0], [10, 10], [0, 10]]);
    expect(quadPlane("z", "roof", [[0, 0, 0], [0, 0, 0], [0, 0, 0], [5, 5, 0]], () => "")).toBeUndefined();
  });
});

describe("the Saddledome in 3D, with the roof and the walls on and off", () => {
  for (const detail of ["low", "auto", "high"] as const) {
    it(`at ${detail}: the roof and the walls come together and apart, each cut away as it should be`, () => {
      const both = buildTurn({ ...OPTIONS }, { venue: { roof: true, walls: true, detail } });
      const wallsOnly = buildTurn({ ...OPTIONS }, { venue: { roof: false, walls: true, detail } });
      const roofOnly = buildTurn({ ...OPTIONS }, { venue: { roof: true, walls: false, detail } });
      const neither = buildTurn({ ...OPTIONS }, { venue: { roof: false, walls: false, detail } });
      const kinds = (m: ReturnType<typeof buildTurn>, kind: string): Plane[] => m.planes.filter((p) => p.kind === kind);
      const cells = SADDLE_CELLS[detail];
      expect(kinds(both, "roof")).toHaveLength(cells * cells + 4 * cells);
      expect(kinds(roofOnly, "roof")).toHaveLength(cells * cells + 4 * cells);
      expect(kinds(wallsOnly, "roof")).toHaveLength(0);
      expect(kinds(neither, "roof")).toHaveLength(0);
      expect(kinds(both, "wall").filter((p) => p.id.startsWith("shell-"))).toHaveLength(4 * cells);
      expect(kinds(roofOnly, "wall").filter((p) => p.id.startsWith("shell-"))).toHaveLength(0);
      expect(kinds(wallsOnly, "wall").filter((p) => p.id.startsWith("shell-"))).toHaveLength(4 * cells);
      for (const p of kinds(both, "roof")) expect(p.cut, p.id).toBe(true);
      for (const p of both.planes) for (const v of [...p.o, ...p.u, ...p.v]) expect(Number.isFinite(v), p.id).toBe(true);
    });
  }

  it("stays inside the scene the view fits: every plane of the roof and the walls is under the model's own top", () => {
    const model = buildTurn({ ...OPTIONS }, { venue: { roof: true, walls: true } });
    const tops = model.planes.filter((p) => p.kind === "roof" || p.kind === "wall").map((p) => Math.max(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]));
    expect(Math.max(...tops)).toBeLessThan(145);
    expect(Math.max(...tops)).toBeGreaterThan(130);
  });
});
