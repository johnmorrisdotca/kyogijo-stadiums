import { describe, expect, it, vi } from "vitest";
import { crowdStands } from "./draw.ts";
import { STADIUMS, STADIUM_IDS, stadiumKind } from "./stadiums.ts";
import { buildTurn, type TurnModel } from "./turn-entry.ts";
import type { Plane } from "./turn.kit.ts";
import { BACK_FADE, BENCH_SIDE, SLIVER, SUITE, suiteWall } from "./venue.fill.ts";
import { VENUE_IDS } from "./venues.ts";
import { areaOf, inside } from "./venues.geo.ts";
import type { Pt } from "./crowd.ts";
import type { SurfaceOptions } from "./types.ts";

// Every real venue is built (the 32 arenas, the stadiums, the hall): on a slow machine that takes longer than the 30 seconds of the config.
vi.setConfig({ testTimeout: 300_000 });

/** The options of each real venue: an arena of the NHL, or a stadium, a ballpark, a hall. */
const REAL: readonly (readonly [string, SurfaceOptions])[] = [
  ...VENUE_IDS.map((id): [string, SurfaceOptions] => [id, { sport: "nhl", arena: id, crowd: { real: true } } as SurfaceOptions]),
  ...STADIUM_IDS.map((id): [string, SurfaceOptions] => {
    const v = STADIUMS[id];
    const kind = stadiumKind(v);
    const sport = kind === "park" ? "mlb" : Object.keys(v.configs)[0];
    return [id, (kind === "park" ? { sport, park: v.park, crowd: { real: true } } : { sport, stadium: id, crowd: { real: true } }) as SurfaceOptions];
  }),
];
const built = new Map<string, TurnModel>();
const modelOf = (id: string, options: SurfaceOptions): TurnModel => {
  let m = built.get(id);
  if (m === undefined) {
    m = buildTurn(options, { venue: { roof: false, walls: false } });
    built.set(id, m);
  }
  return m;
};
const ofKind = (model: TurnModel, kind: string): Plane[] => model.planes.filter((p) => p.kind === kind);

/** The base polygon of a plane's drawing (its first polygon), as points in the plan: the plane's own feet along `u` and `v` put back on the surface. */
function planOf(p: Plane): Pt[] {
  const found = /<polygon class="[^"]*" points="([^"]*)"/.exec(p.svg);
  if (found === null) return [];
  const [lu, lv] = [Math.hypot(...p.u), Math.hypot(...p.v)];
  return found[1].split(" ").map((pair): Pt => {
    const [a, b] = pair.split(",").map(Number);
    return [p.o[0] + (a / lu) * p.u[0] + (b / lv) * p.v[0], p.o[1] + (a / lu) * p.u[1] + (b / lv) * p.v[1]];
  });
}

describe("a real venue's suite level", () => {
  it("is a facing wall with a band of windows and a pane to every few feet, never a bare shelf", () => {
    const svg = suiteWall([[0, 0], [70, 0], [70, 20], [0, 20]]);
    expect(svg).toContain("u-suite-win");
    expect(svg).toContain("u-suite-bar");
    expect((svg.match(/L/g) ?? []).length).toBe(70 / SUITE.pane - 1);
    expect(svg).not.toContain("u-conc");
    // A shape that is not a quad (a piece cut by a cover) is the wall alone.
    expect(suiteWall([[0, 0], [10, 0], [5, 8]])).not.toContain("u-suite-win");
  });

  it("stands between the tiers of every real venue, each walk painted as a wall with windows", () => {
    for (const [id, options] of REAL) {
      const walks = ofKind(modelOf(id, options), "concourse");
      expect(walks.length, id).toBeGreaterThan(0);
      for (const w of walks) {
        expect(w.svg, `${id} ${w.id}`).toContain("u-suite");
        expect(w.svg, `${id} ${w.id}`).not.toContain("u-conc");
        expect(w.svg, `${id} ${w.id}`).toContain("u-suite-win");
      }
    }
  });
});

describe("the apron of a real venue", () => {
  it("is a thin dark floor between the surface and the first row, in every arena, stadium and hall that has a ring to lie in", () => {
    for (const [id, options] of REAL) {
      const model = modelOf(id, options);
      const stands = crowdStands(options)!;
      const first = stands.rings.find((r) => r.tier !== "wall" && r.tier !== "bleachers") ?? stands.rings[0];
      const apron = ofKind(model, "apron");
      // A ballpark's rings are not rounded rectangles round a surface: no apron is made for them.
      if (first.hole?.kind !== "rrect") {
        expect(apron.length, id).toBe(0);
        continue;
      }
      expect(apron.length, id).toBeGreaterThanOrEqual(8);
      for (const p of apron) {
        expect(p.svg, `${id} ${p.id}`).toContain("u-apron");
        expect(p.o[2], `${id} ${p.id}`).toBeGreaterThan(0);
        expect(p.o[2], `${id} ${p.id}`).toBeLessThan(0.5);
      }
    }
  });

  it("holds the players' benches, the penalty boxes and the timekeeper's table of an ice rink, on the bench side, between the boards and the first row", () => {
    for (const id of VENUE_IDS) {
      const model = modelOf(id, REAL.find(([key]) => key === id)![1]);
      const stands = crowdStands(REAL.find(([key]) => key === id)![1])!;
      const benches = ofKind(model, "bench");
      const names = new Set(benches.map((p) => p.id.replace(/-(\d|top)+$/, "")));
      expect([...names].sort(), id).toEqual(["bench-a", "bench-b", "penalty-a", "penalty-b", "timekeeper"]);
      const hole = stands.rings[0].hole!;
      const bottom = hole.kind === "rrect" && hole.y1 - (stands.box.y + stands.box.h) >= stands.box.y - hole.y0;
      for (const p of benches) {
        const ys = [p.o[1], p.o[1] + p.u[1], p.o[1] + p.v[1]];
        for (const y of ys) {
          if (bottom) {
            expect(y, `${id} ${p.id}`).toBeGreaterThan(stands.box.y + stands.box.h);
            expect(y, `${id} ${p.id}`).toBeLessThan(stands.box.y + stands.box.h + BENCH_SIDE.gap + BENCH_SIDE.depth + 0.01);
          }
        }
        // Low furniture: nothing on the apron stands over the boards.
        expect(Math.max(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]), `${id} ${p.id}`).toBeLessThanOrEqual(BENCH_SIDE.height + 0.01);
      }
    }
  });

  it("is made for no other sport: a stadium has the dark apron and no benches of a rink", () => {
    const [id, options] = REAL.find(([key]) => key === "bc-place")!;
    expect(ofKind(modelOf(id, options), "bench")).toHaveLength(0);
    expect(ofKind(modelOf(id, options), "apron").length).toBeGreaterThan(0);
  });
});

describe("the back of a real venue's bowls", () => {
  it("is a wall that closes each tier no walk leads on from, gives way to the eye and keeps a little of itself, and a floor behind it", () => {
    for (const [id, options] of REAL) {
      const model = modelOf(id, options);
      const walls = model.planes.filter((p) => p.id.startsWith("back-"));
      expect(walls.length, id).toBeGreaterThan(0);
      for (const w of walls) {
        expect(w.shy, `${id} ${w.id}`).toBeDefined();
        expect(w.fadeTo, `${id} ${w.id}`).toBe(BACK_FADE);
        expect(w.svg, `${id} ${w.id}`).toContain("u-back");
        expect(w.svg, `${id} ${w.id}`).toContain("u-coping");
      }
      // Every arena and stadium bowl is a round-cornered one: its floor behind the wall is laid, in two rings (to the hall's wall, and on to the building's outline).
      const stands = crowdStands(options)!;
      if (stands.rings.every((r) => r.region.kind !== "poly")) {
        const floor = ofKind(model, "floor");
        expect(floor.length, id).toBeGreaterThan(0);
        expect(floor.some((p) => p.id.includes("-in-")), id).toBe(true);
        // Every piece of the floor has its lanes and joints, and none is a sliver a corner leaves.
        for (const f of floor) {
          expect(f.svg, `${id} ${f.id}`).toContain("u-clane");
          expect(Math.abs(areaOf(planOf(f))), `${id} ${f.id}`).toBeGreaterThanOrEqual(SLIVER);
        }
      }
    }
  });

  it("stands as high as the top row of the tier it closes", () => {
    const [id, options] = REAL[0];
    const stands = crowdStands(options)!;
    const top = stands.rings[stands.rings.length - 1].height[1];
    const walls = modelOf(id, options).planes.filter((p) => p.id.startsWith("back-"));
    expect(Math.max(...walls.map((p) => p.o[2]))).toBeCloseTo(top, 3);
  });
});

describe("no big flat sheet is left in a real arena's 3D view", () => {
  it("covers the hall's floor with the surface, the tiers, the walks, the apron and the concourse floor, all but a few percent of it, in every arena of the NHL", () => {
    for (const id of VENUE_IDS) {
      const options = REAL.find(([key]) => key === id)![1];
      const model = modelOf(id, options);
      const stands = crowdStands(options)!;
      const real = stands.real!;
      const polys = model.planes.filter((p) => ["seats", "concourse", "apron", "floor"].includes(p.kind)).map(planOf).filter((poly) => poly.length >= 3);
      const hall = real.hall;
      const inHall = ([x, y]: Pt): boolean => {
        const [w, h] = [(hall.x1 - hall.x0) / 2, (hall.y1 - hall.y0) / 2];
        const [dx, dy] = [Math.abs(x - (hall.x0 + hall.x1) / 2), Math.abs(y - (hall.y0 + hall.y1) / 2)];
        const [kx, ky] = [dx - (w - hall.r), dy - (h - hall.r)];
        return dx <= w && dy <= h && (kx <= 0 || ky <= 0 || Math.hypot(kx, ky) <= hall.r);
      };
      const b = stands.box;
      const onSurface = ([x, y]: Pt): boolean => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
      let [total, bare] = [0, 0];
      for (let x = hall.x0; x <= hall.x1; x += 6) {
        for (let y = hall.y0; y <= hall.y1; y += 6) {
          const p: Pt = [x, y];
          if (!inHall(p) || !inside(real.footprint, p)) continue;
          total += 1;
          if (!onSurface(p) && !polys.some((poly) => inside(poly, p))) bare += 1;
        }
      }
      expect(total, id).toBeGreaterThan(200);
      expect(bare / total, `${id}: ${bare} of ${total} sampled places of the hall are bare`).toBeLessThan(0.04);
    }
  });
});

describe("the usual stands and a layout's hall", () => {
  it("are left as they were without the fill: the walks are the plain concourse and no apron, back wall or floor is made", () => {
    const model = buildTurn({ sport: "nhl", crowd: true } as SurfaceOptions, { venue: { roof: false } });
    expect(ofKind(model, "apron")).toHaveLength(0);
    expect(ofKind(model, "bench")).toHaveLength(0);
    expect(model.planes.some((p) => p.id.startsWith("back-"))).toBe(false);
    for (const w of ofKind(model, "concourse")) expect(w.svg).toContain("u-conc");
  });

  it("are filled when asked for (a layout's stadium round the hall asks): the suite wall, the apron and the back, but no concourse floor, for there is no building", () => {
    const model = buildTurn({ sport: "nhl", crowd: true } as SurfaceOptions, { venue: { roof: false, fill: true } });
    expect(ofKind(model, "apron").length).toBeGreaterThan(0);
    expect(ofKind(model, "bench").length).toBeGreaterThan(0);
    expect(model.planes.some((p) => p.id.startsWith("back-"))).toBe(true);
    expect(ofKind(model, "floor")).toHaveLength(0);
    for (const w of ofKind(model, "concourse")) expect(w.svg).toContain("u-suite-win");
  });
});
