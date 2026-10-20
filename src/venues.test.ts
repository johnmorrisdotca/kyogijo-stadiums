import { describe, expect, it } from "vitest";
import { ARENAS, arenaById } from "./arenas.ts";
import { areaOfOutline, type Pt } from "./crowd.ts";
import { crowdStands, describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { PITCH_MAX, buildTurn, eyeDistance, layoutOf, presetsFor, project, type TurnModel } from "./turn-entry.ts";
import { MAX_RAKE, SEAT_AREAS, VENUES, VENUE_ATTRIBUTION, VENUE_IDS, arenaOfVenue, bowlInside, planVenue, venueById, venueByWikidata, venueOrientation, venuesIn, type RealVenue } from "./venues.ts";
import { areaOf, boxOf, coreOf, edgeDistance, inside, lonLatFrom, metresFrom, middleOf, northOn, simplified, smallestBox, turnedTo } from "./venues.geo.ts";
import { VENUE_DATA } from "./venues.data.ts";
import { VENUE_OSM } from "./venues.osm.data.ts";

const PACIFIC = ["honda-center", "scotiabank-saddledome", "rogers-place", "crypto-com-arena", "sap-center", "climate-pledge-arena", "rogers-arena", "t-mobile-arena"];
const venues = VENUE_IDS.map((id) => VENUES[id]);
const lonLat = (ring: readonly (readonly [number, number])[]): [number, number][] => ring.map(([lon, lat]) => [lon, lat]);
const outlineOf = (v: RealVenue): Pt[] => {
  const ring = lonLat(v.osm.ring);
  return metresFrom(middleOf(ring), ring);
};
const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);

describe("the venues: the Pacific division", () => {
  it("are the eight arenas of the Pacific division of the NHL, each an arena in use that the package already has", () => {
    expect(VENUE_IDS).toEqual(PACIFIC);
    expect(venuesIn("pacific")).toHaveLength(8);
    for (const v of venues) {
      const arena = arenaOfVenue(v);
      expect(arena.status, v.id).toBe("current");
      expect(arena.wikidata, v.id).toBe(v.wikidata);
      expect(v.division).toBe("pacific");
      expect(venueById(v.id)).toBe(v);
      expect(venueByWikidata(v.wikidata)).toBe(v);
    }
    expect(venueById("boston-garden")).toBeUndefined();
    expect(venueById(undefined)).toBeUndefined();
    expect(venueById("toString")).toBeUndefined();
  });

  it("have the facts the sources give: seats, tiers and a roof, each with what was read and whether a source says it", () => {
    for (const v of venues) {
      expect(v.seats.hockey, v.id).toBeGreaterThan(15000);
      expect(v.seats.hockey, v.id).toBeLessThan(21000);
      expect(["wikidata", "wikipedia"], v.id).toContain(v.seats.source);
      expect(v.seats.wikidata, v.id).toBeGreaterThan(15000);
      expect([1, 2, 3], v.id).toContain(v.tiers.count);
      expect(["documented", "plausible"], v.id).toContain(v.tiers.basis);
      expect(["documented", "plausible"], v.id).toContain(v.roof.basis);
      expect(["fixed", "saddle"], v.id).toContain(v.roof.kind);
      for (const read of [v.seats.read, v.tiers.read, v.roof.read]) expect(read.length, v.id).toBeGreaterThan(20);
      expect(v.en.revision, v.id).toBeGreaterThan(1_000_000_000);
      expect(v.en.title, v.id).toBe(arenaOfVenue(v).en.title);
    }
  });

  it("have seats that are the present ones: where an infobox lists years, the last, not the first the arena data takes", () => {
    // The arena data's seats are the first figure of an infobox; the venue's are the present one (the Saddledome's 16,605 were its 1983 seats).
    expect(VENUES["scotiabank-saddledome"].seats.hockey).toBe(19289);
    expect(arenaById("scotiabank-saddledome")?.capacity?.hockey).toBe(16605);
    expect(VENUES["rogers-arena"].seats.hockey).toBe(18871);
    expect(VENUES["sap-center"].seats.hockey).toBe(17435);
    // Wikidata's own figure for ice hockey wins where its item has one.
    expect(VENUES["rogers-place"].seats).toMatchObject({ hockey: 18641, source: "wikidata", wikidata: 18641 });
    expect(venues.filter((v) => v.seats.source === "wikidata").map((v) => v.id)).toEqual(["rogers-place"]);
  });

  it("say what a source says and what is ours: the Saddledome's roof and the number of tiers are documented where an article says them", () => {
    expect(VENUES["scotiabank-saddledome"].roof).toMatchObject({ kind: "saddle", basis: "documented" });
    expect(VENUES["climate-pledge-arena"].roof).toMatchObject({ kind: "fixed", basis: "documented" });
    expect(VENUES["crypto-com-arena"].tiers).toMatchObject({ count: 2, basis: "documented", lowerShare: 0.667 });
    expect(VENUES["honda-center"].tiers.basis).toBe("plausible");
    expect(venues.filter((v) => v.roof.kind === "saddle")).toHaveLength(1);
  });

  it("are the generated data files, in step with the sources' dates and with each other", () => {
    expect(VENUE_DATA.map((d) => d.id)).toEqual(PACIFIC);
    expect(Object.keys(VENUE_OSM)).toEqual(PACIFIC);
    for (const v of venues) expect(v.osm).toBe(VENUE_OSM[v.id]);
  });
});

describe("what OpenStreetMap gave", () => {
  it("is ODbL 1.0 data with its credit on every entry", () => {
    expect(VENUE_ATTRIBUTION).toBe("(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright");
    for (const v of venues) {
      expect(v.osm.licence, v.id).toBe("ODbL-1.0");
      expect(v.osm.attribution, v.id).toBe(VENUE_ATTRIBUTION);
      expect(v.osm.source, v.id).toMatch(/^way\/\d+$/);
      expect(v.osm.read, v.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("is a building where the arena is: its middle is within 250 metres of the arena's coordinates and its area is a building's", () => {
    for (const v of venues) {
      const arena = ARENAS[v.id];
      const ring = lonLat(v.osm.ring);
      const [x, y] = metresFrom([arena.lon, arena.lat], [middleOf(ring)])[0];
      expect(Math.hypot(x, y), v.id).toBeLessThan(250);
      const area = areaOf(outlineOf(v));
      expect(area, v.id).toBeGreaterThan(10_000);
      expect(area, v.id).toBeLessThan(35_000);
      expect(v.osm.ring.length, v.id).toBeGreaterThan(8);
    }
  });
});

describe("the geometry of a building's outline", () => {
  it("lays degrees flat in metres: a degree of latitude is 111 km, of longitude less by the cosine, and it comes back", () => {
    const [[x, y]] = metresFrom([-114, 51], [[-113, 52]]);
    expect(y).toBeCloseTo(111_195, -2);
    expect(x).toBeCloseTo(111_195 * Math.cos((51 * Math.PI) / 180), -2);
    const back = lonLatFrom([-114, 51], [x, y]);
    expect(back[0]).toBeCloseTo(-113, 9);
    expect(back[1]).toBeCloseTo(52, 9);
  });

  it("finds the long axis of a rectangle turned to any heading, and the main hall of an L, and none in a circle", () => {
    for (const heading of [0, 20, 45, 90, 137, 170]) {
      const a = (heading * Math.PI) / 180;
      // A hall 120 by 70 metres whose long side runs along `heading` (clockwise from north).
      const along: Pt = [Math.sin(a), Math.cos(a)];
      const across: Pt = [Math.cos(a), -Math.sin(a)];
      const rect: Pt[] = [[-60, -35], [60, -35], [60, 35], [-60, 35]].map(([u, v]): Pt => [u * along[0] + v * across[0], u * along[1] + v * across[1]]);
      const box = smallestBox(rect);
      expect(box.length).toBeCloseTo(120, 6);
      expect(box.width).toBeCloseTo(70, 6);
      expect(Math.abs(box.heading - (heading % 180)) < 1e-6 || Math.abs(Math.abs(box.heading - (heading % 180)) - 180) < 1e-6, `${heading}: ${box.heading}`).toBe(true);
      const core = coreOf(rect);
      const off = Math.min(Math.abs(core.heading - heading), 180 - Math.abs(core.heading - heading));
      expect(off, `${heading}: ${core.heading}`).toBeLessThanOrEqual(3);
      expect(core.length / core.width).toBeGreaterThan(1.5);
      expect(core.strength).toBeGreaterThan(1.5);
    }
    // An L: a main hall 100 by 80 with a wing 30 wide and 90 long. The hall is found, not the wing.
    const L: Pt[] = [[0, 0], [100, 0], [100, 80], [30, 80], [30, 170], [0, 170]];
    const hall = coreOf(L);
    expect(hall.length * hall.width).toBeGreaterThan(8000 * 0.9);
    expect(Math.abs(hall.centre[0] - 50) + Math.abs(hall.centre[1] - 40)).toBeLessThan(25);
    const circle = Array.from({ length: 72 }, (_, i): Pt => [70 * Math.cos((i * Math.PI) / 36), 70 * Math.sin((i * Math.PI) / 36)]);
    expect(coreOf(circle).strength).toBeLessThan(1.1);
  });

  it("turns a point into the drawing's frame so that the rink's heading runs along x, and north lies 90 degrees less the heading from the top of the page", () => {
    for (const heading of [0, 30, 90, 102, 175]) {
      const a = (heading * Math.PI) / 180;
      // 100 metres along the heading is 100 along x and none across.
      const [x, y] = turnedTo(heading, [100 * Math.sin(a), 100 * Math.cos(a)]);
      expect(x, `${heading}`).toBeCloseTo(100, 9);
      expect(y, `${heading}`).toBeCloseTo(0, 9);
      // North, a unit, in the frame: the page's top is -y, and the angle is clockwise from it.
      const [nx, ny] = turnedTo(heading, [0, 1]);
      const angle = (Math.atan2(nx, -ny) * 180) / Math.PI;
      expect((angle - northOn(heading) + 540) % 360 - 180, `${heading}`).toBeCloseTo(0, 6);
    }
    // Not mirrored: east is to the right of north, as the map has it (the turn has a determinant of minus one, because the page's y runs down).
    const [ex, ey] = turnedTo(90, [1, 0]);
    const [nx, ny] = turnedTo(90, [0, 1]);
    expect([ex, ey]).toEqual([expect.closeTo(1, 9), expect.closeTo(0, 9)]);
    expect(ny).toBeCloseTo(-1, 9);
    expect(nx).toBeCloseTo(0, 9);
  });

  it("simplifies a ring to a tolerance and keeps its corners; a square with a bump of half a metre loses the bump", () => {
    const ring: Pt[] = [[0, 0], [5, 0.3], [10, 0], [10, 10], [0, 10]];
    expect(simplified(ring, 1)).toHaveLength(4);
    expect(simplified(ring, 0.1)).toHaveLength(5);
    expect(areaOf(simplified(ring, 1))).toBeCloseTo(100, 0);
  });

  it("holds the axis stored for each venue to what the outline gives, for the venues whose axis is said", () => {
    for (const id of ["honda-center", "climate-pledge-arena", "scotiabank-saddledome"]) {
      const v = VENUES[id];
      const core = coreOf(outlineOf(v));
      expect(core.strength, id).toBeCloseTo(v.osm.axis.strength, 1);
      expect(core.length / core.width, id).toBeCloseTo(v.osm.axis.elongation, 1);
      if (v.osm.axis.basis !== "none") {
        const off = Math.min(Math.abs(core.heading - v.osm.axis.heading), 180 - Math.abs(core.heading - v.osm.axis.heading));
        expect(off, id).toBeLessThan(1.5);
      }
    }
  });
});

describe("how the rink lies", () => {
  it("is mapped nowhere in the Pacific division (no ice in the data), inferred from the main hall where the building has a direction and a longer side, and not known for a round one", () => {
    const basis = Object.fromEntries(venues.map((v) => [v.id, v.osm.axis.basis]));
    expect(basis).toEqual({ "honda-center": "building", "scotiabank-saddledome": "none", "rogers-place": "building", "crypto-com-arena": "none", "sap-center": "none", "climate-pledge-arena": "building", "rogers-arena": "building", "t-mobile-arena": "building" });
    for (const v of venues) {
      expect(v.osm.ice, v.id).toBeUndefined();
      const o = venueOrientation(v);
      expect(o.basis).toBe(v.osm.axis.basis);
      expect(o.heading).toBeGreaterThanOrEqual(0);
      expect(o.heading).toBeLessThan(180);
      expect(o.north).toBeCloseTo(90 - o.heading, 6);
      // A round one is drawn east-west with north at the top, and says so.
      if (o.basis === "none") expect([o.heading, o.north]).toEqual([90, 0]);
      else expect(v.osm.axis.strength).toBeGreaterThanOrEqual(1.25);
      expect(v.osm.axis.elongation, v.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("puts the building's main hall along x in the drawing: the footprint's long direction is the rink's, for the buildings with a direction", () => {
    for (const v of venues.filter((x) => x.osm.axis.basis === "building")) {
      const plan = planVenue(v);
      const core = coreOf(plan.footprint);
      // In the drawing's frame the hall's long side is along x (heading 90 in a frame whose north is up).
      const off = Math.min(Math.abs(core.heading - 90), 180 - Math.abs(core.heading - 90));
      expect(off, `${v.id}: ${core.heading}`).toBeLessThan(6);
    }
  });

  it("turns a drawing to the building and not the building to the drawing: the outline's area and shape are the map's, in feet", () => {
    for (const v of venues) {
      const plan = planVenue(v);
      expect(areaOf(plan.footprint) / areaOf(outlineOf(v)), v.id).toBeCloseTo(10.7639, 1);
      // The same distance across the building in metres and in feet.
      const m = boxOf(outlineOf(v));
      const f = boxOf(plan.footprint);
      expect(Math.max(f.x1 - f.x0, f.y1 - f.y0), v.id).toBeGreaterThanOrEqual(Math.min(m.x1 - m.x0, m.y1 - m.y0) * 3.28);
    }
  });
});

describe("the bowl", () => {
  it("holds the seats the venue has, to the seat, in the number of tiers the sources say, and fits inside the building", () => {
    for (const v of venues) {
      const plan = planVenue(v);
      expect(plan.fit, v.id).toBe("fits");
      expect(plan.bowl.rings, v.id).toHaveLength(v.tiers.count);
      expect(plan.total, `${v.id}: ${plan.total} of ${v.seats.hockey}`).toBe(v.seats.hockey);
      expect(plan.seats.reduce((s, t) => s + t.seats, 0)).toBe(plan.total);
      expect(SEAT_AREAS).toContain(plan.seatArea);
      expect(bowlInside(plan), v.id).toBe(true);
    }
  });

  it("maps the seats to the tiers by their shares: a lower bowl of a little over half, or the share a source gives (two thirds in Crypto.com Arena)", () => {
    for (const v of venues) {
      const plan = planVenue(v);
      const share = plan.seats[0].seats / plan.total;
      expect(share, v.id).toBeCloseTo(v.tiers.lowerShare ?? 0.56, 2);
    }
    expect(planVenue(VENUES["crypto-com-arena"]).seats[0].seats / VENUES["crypto-com-arena"].seats.hockey).toBeCloseTo(0.667, 2);
  });

  it("scales with the facts: more seats give a larger bowl, more tiers give more rings and a taller one, the shares still add up", () => {
    const base = VENUES["t-mobile-arena"];
    const make = (seats: number, count: 1 | 2 | 3, lowerShare?: number): RealVenue => ({ ...base, id: base.id, seats: { ...base.seats, hockey: seats }, tiers: { ...base.tiers, count, ...(lowerShare === undefined ? {} : { lowerShare }) } });
    const area = (v: RealVenue): number => areaOfOutline(planVenue(v).bowl.rings.at(-1)!.region);
    expect(area(make(20000, 2))).toBeGreaterThan(area(make(15000, 2)));
    for (const count of [1, 2, 3] as const) {
      const plan = planVenue(make(17500, count));
      expect(plan.bowl.rings.map((r) => r.id)).toEqual(count === 1 ? ["lower"] : count === 2 ? ["lower", "upper"] : ["lower", "middle", "upper"]);
      expect(plan.total).toBe(17500);
      expect(plan.fit).toBe("fits");
    }
    const [one, two, three] = ([1, 2, 3] as const).map((n) => planVenue(make(17500, n)).bowl.rings.at(-1)!.height[1]);
    expect(two).toBeGreaterThan(one - 1);
    expect(three).toBeGreaterThan(two - 1);
    expect(planVenue(make(17500, 2, 0.4)).seats[0].seats / 17500).toBeCloseTo(0.4, 2);
  });

  it("is built from the rink out: a first row at the NHL's distances, each tier outside the last with a walk between, each higher than the last and no steeper than a bowl is", () => {
    for (const v of venues) {
      const plan = planVenue(v);
      const { rings, off } = plan.bowl;
      expect(off).toEqual({ left: 8, right: 8, top: 8, bottom: 14 });
      let previous = rings[0].hole as Extract<(typeof rings)[number]["hole"] & object, { kind: "rrect" }>;
      expect(previous.x0, v.id).toBeCloseTo(plan.box.x - 8, 6);
      expect(previous.y1, v.id).toBeCloseTo(plan.box.y + plan.box.h + 14, 6);
      rings.forEach((ring, k) => {
        const [hole, region] = [ring.hole, ring.region];
        if (hole === null || hole.kind !== "rrect" || region.kind !== "rrect") throw new Error("a rounded rectangle");
        // A band: its region lies outside its hole; the next tier starts outside this one, over a walk.
        expect(region.x1 - region.x0, `${v.id} ${ring.id}`).toBeGreaterThan(hole.x1 - hole.x0);
        expect(region.y1 - region.y0, `${v.id} ${ring.id}`).toBeGreaterThan(hole.y1 - hole.y0);
        if (k > 0) {
          expect(hole.x0, `${v.id} ${ring.id}`).toBeLessThan(previous.x0);
          expect(ring.height[0], `${v.id} ${ring.id}`).toBeGreaterThan(rings[k - 1].height[1]);
        }
        expect(ring.height[1], `${v.id} ${ring.id}`).toBeGreaterThan(ring.height[0]);
        expect(ring.rake, `${v.id} ${ring.id}`).toBeLessThanOrEqual(MAX_RAKE + 0.5);
        expect(ring.rake, `${v.id} ${ring.id}`).toBeGreaterThan(8);
        expect(ring.aisles.length).toBeGreaterThan(8);
        previous = region;
      });
      const edge = plan.bowl.shell.edge;
      expect(edge, v.id).toBeGreaterThanOrEqual(rings.at(-1)!.height[1] + 22);
    }
  });

  it("is a bowl round the rink, in the middle of the building's hall: the rink lies at the middle of the first row and well inside the building", () => {
    for (const v of venues) {
      const plan = planVenue(v);
      const middle: Pt = [plan.box.x + plan.box.w / 2, plan.box.y + plan.box.h / 2];
      expect(inside(plan.footprint, middle), v.id).toBe(true);
      for (const [x, y] of [[plan.box.x, plan.box.y], [plan.box.x + plan.box.w, plan.box.y], [plan.box.x, plan.box.y + plan.box.h], [plan.box.x + plan.box.w, plan.box.y + plan.box.h]]) {
        expect(edgeDistance(plan.footprint, [x, y]), v.id).toBeGreaterThan(40);
      }
    }
  });

  it("says when the building is too small for the seats: a bowl with less room is `tight`, steeper first and then short of seats", () => {
    const base = VENUES["rogers-arena"];
    const small: RealVenue = { ...base, osm: { ...base.osm, ring: base.osm.ring.map(([lon, lat]) => [-114 + (lon - middleOf(lonLat(base.osm.ring))[0]) * 0.6, 51 + (lat - middleOf(lonLat(base.osm.ring))[1]) * 0.6] as [number, number]), axis: { ...base.osm.axis, centre: [-114, 51] } } };
    const plan = planVenue(small);
    expect(plan.fit).toBe("tight");
    expect(plan.total).toBeLessThan(base.seats.hockey);
    expect(plan.seatArea).toBe(SEAT_AREAS.at(-1));
  });

  it("is the same every time, a pure function of the venue and the rink", () => {
    const a = planVenue(VENUES["honda-center"]);
    const b = planVenue(VENUES["honda-center"], { x: 0, y: 0, w: 200, h: 85 });
    expect(b).toBe(a);
    // Moved on the page, the same bowl (to the hundredth of a foot the footprint is rounded to).
    const moved = planVenue(VENUES["honda-center"], { x: 10, y: 5, w: 200, h: 85 });
    moved.bowl.rings.forEach((r, i) => expect(Math.abs(r.seats - a.bowl.rings[i].seats)).toBeLessThanOrEqual(2));
  });
});

describe("a real venue drawn in 2D", () => {
  const draw = (id: string, extra: object = {}): string => drawKyogijo({ sport: "nhl", arena: id, crowd: { real: true }, ...extra });
  const viewBox = (svg: string): number[] => /viewBox="([^"]+)"/.exec(svg)![1].split(" ").map(Number);

  it("is the building's outline under the stands, with the arrow that says where north is where the rink's orientation is known", () => {
    for (const v of venues) {
      const svg = draw(v.id);
      expect(svg, v.id).toContain('class="ky-cr-shell"');
      expect(svg.includes('class="ky-cr-north"'), v.id).toBe(v.osm.axis.basis !== "none");
      expect(svg, v.id).toContain("ky-crowd");
    }
  });

  it("is the same text every time, differs from the usual crowd, and is a different drawing for each venue", () => {
    const honda = draw("honda-center");
    expect(draw("honda-center")).toBe(honda);
    expect(honda).not.toBe(drawKyogijo({ sport: "nhl", arena: "honda-center", crowd: true }));
    expect(new Set(VENUE_IDS.map((id) => draw(id))).size).toBe(8);
  });

  it("keeps the whole building and the arrow inside the drawing, at every theme and language and size, light and dark", () => {
    for (const v of venues) {
      const plan = planVenue(v);
      for (const extra of [{}, { theme: "dark" }, { language: "ja" }, { width: 320 }, { detail: "simple" }, { orientation: "portrait" }]) {
        const svg = draw(v.id, extra);
        const [x, y, w, h] = viewBox(svg);
        // (A drawing that lies tall is turned: the frame is the wide one's turned a quarter.)
        if ((extra as { orientation?: string }).orientation === "portrait") continue;
        for (const p of plan.footprint) {
          expect(p[0], `${v.id} ${JSON.stringify(extra)}`).toBeGreaterThanOrEqual(x);
          expect(p[0], `${v.id} ${JSON.stringify(extra)}`).toBeLessThanOrEqual(x + w);
          expect(p[1], `${v.id} ${JSON.stringify(extra)}`).toBeGreaterThanOrEqual(y);
          expect(p[1], `${v.id} ${JSON.stringify(extra)}`).toBeLessThanOrEqual(y + h);
        }
      }
      if (plan.bowl.shell.north !== undefined) {
        const [, y] = viewBox(draw(v.id));
        expect(y, v.id).toBeLessThanOrEqual(boxOf(plan.footprint).y0 - 55);
      }
    }
  });

  it("has the stands of the bowl: a tier per ring, the seats the stands data says, and no block of visitors, which no source places", () => {
    for (const v of venues) {
      const stands = crowdStands({ sport: "nhl", arena: v.id, crowd: { real: true } })!;
      expect(stands.rings.map((r) => r.id), v.id).toEqual(["lower", "upper"]);
      expect(stands.real, v.id).toBeDefined();
      expect(stands.sectors, v.id).toEqual([]);
      expect(stands.seats, v.id).toBe(v.seats.hockey);
      expect(stands.shape).toBe("bowl");
      expect(stands.concourses.length, v.id).toBe(1);
      expect(stands.covers).toEqual([]);
    }
    // A block of visitors can still be asked for.
    expect(crowdStands({ sport: "nhl", arena: "honda-center", crowd: { real: true, awayEnd: "right" } })!.sectors.length).toBeGreaterThan(0);
  });

  it("has a neutral crowd, in no team's colours, and no mark of a team or a league", () => {
    const svg = draw("honda-center");
    expect(svg).not.toMatch(/-cr-a\)|<image/);
    expect(svg).toContain("ky-cr-shell");
  });

  it("is ignored where the arena has no venue, where a league of the caller's own sets the surface, and for another sport", () => {
    const same = (a: object, b: object): void => expect(drawKyogijo({ id: "t", ...a } as never)).toBe(drawKyogijo({ id: "t", ...b } as never));
    same({ sport: "nhl", arena: "boston-garden", crowd: { real: true } }, { sport: "nhl", arena: "boston-garden", crowd: {} });
    same({ sport: "nhl", arena: "honda-center", league: "iihf", crowd: { real: true } }, { sport: "nhl", arena: "honda-center", league: "iihf", crowd: {} });
    same({ sport: "nba", arena: "crypto-com-arena", crowd: { real: true } }, { sport: "nba", arena: "crypto-com-arena", crowd: {} });
    same({ sport: "nhl", arena: "honda-center", crowd: { real: false } }, { sport: "nhl", arena: "honda-center", crowd: {} });
  });

  it("draws the rink at the arena's own size and says what it is in both languages, with the credit and the seats", () => {
    const en = describeDrawing({ sport: "nhl", arena: "crypto-com-arena", crowd: { real: true } });
    expect(en.description).toContain("plausible bowl of 18145 seats in 2 tiers");
    expect(en.description).toContain("(c) OpenStreetMap contributors");
    expect(en.description).toContain("not the arena's plan");
    expect(en.description).toContain("orientation is not known");
    const ja = describeDrawing({ sport: "nhl", arena: "honda-center", crowd: { real: true }, language: "ja" });
    expect(ja.description).toContain("17174席・2層");
    expect(ja.description).toContain("OpenStreetMap");
    expect(describeDrawing({ sport: "nhl", arena: "honda-center", crowd: { real: true } }).description).toContain("long axis");
    expect(describeDrawing({ sport: "nhl", arena: "honda-center", crowd: true }).description).not.toContain("OpenStreetMap");
  });

  it("is dark and light by the page's properties, with no colour of its own", () => {
    const svg = draw("sap-center");
    const style = /<style>([\s\S]*?)<\/style>/.exec(svg)![1];
    for (const rule of [".ky-cr-shell{", ".ky-cr-north{", ".ky-cr-north-n{"]) expect(style).toContain(rule);
    expect(style).toMatch(/\.ky-cr-shell\{[^}]*var\(--ky-cr-conc\)/);
    expect(draw("sap-center", { theme: "dark" })).toContain('data-theme="dark"');
  });
});

/** The area of the floor on the screen over a turn, as the browser draws the matrix written for it (see turn.size.test.ts). */
function floorAreas(model: TurnModel, pitch: number, [w, h]: readonly [number, number], by: number): number[] {
  const width = model.viewBox.w * model.scale;
  const height = model.viewBox.h * model.scale;
  const shoelace = (points: readonly (readonly number[])[]): number => Math.abs(points.reduce((sum, p, i) => sum + p[0] * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * p[1], 0)) / 2;
  return range(0, 359, by).map((yaw) => {
    const t = layoutOf(model, { yaw, pitch, zoom: 1 }, w, h).transforms[0];
    const m = t.slice("matrix3d(".length, -1).split(",").map(Number);
    return shoelace([[0, 0], [width, 0], [width, height], [0, height]].map(([x, y]) => {
      const q = m[3] * x + m[7] * y + m[15];
      return [(m[0] * x + m[4] * y + m[12]) / q, (m[1] * x + m[5] * y + m[13]) / q];
    }));
  });
}

describe("a real venue in 3D", () => {
  const models = venues.map((v): [RealVenue, TurnModel] => [v, buildTurn({ sport: "nhl", arena: v.id, crowd: { real: true } }, {})]);
  const roofed = venues.map((v): [RealVenue, TurnModel] => [v, buildTurn({ sport: "nhl", arena: v.id, crowd: { real: true } }, { venue: { roof: true } })]);
  const item = (model: TurnModel, kind: string) => model.uprights.items.find((i) => i.kind === kind);
  const zs = (planes: readonly { o: readonly number[]; u: readonly number[]; v: readonly number[] }[]): [number, number] => {
    const all = planes.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]]);
    return [Math.min(...all), Math.max(...all)];
  };

  it("raises the tiers as solid raked planes at the heights the bowl gives, with a walk between them from the lower tier's top to the upper's first row", () => {
    for (const [v, model] of models) {
      const plan = planVenue(v);
      const seats = item(model, "stands")!;
      for (const ring of plan.bowl.rings) {
        const mine = seats.planes.filter((p) => p.id.startsWith(`${ring.id}-`) && p.kind === "seats");
        expect(mine.length, `${v.id} ${ring.id}`).toBeGreaterThanOrEqual(12);
        const [low, high] = zs(mine);
        expect(low, `${v.id} ${ring.id}`).toBeCloseTo(ring.height[0], 3);
        expect(high, `${v.id} ${ring.id}`).toBeCloseTo(ring.height[1], 3);
      }
      const walk = seats.planes.filter((p) => p.kind === "concourse");
      expect(walk.length, v.id).toBeGreaterThanOrEqual(12);
      const [low, high] = zs(walk);
      expect(low, v.id).toBeCloseTo(plan.bowl.rings[0].height[1], 3);
      expect(high, v.id).toBeCloseTo(plan.bowl.rings[1].height[0], 3);
    }
  });

  it("is solid: the quads of a tier cover its band, their areas in plan adding up to the band's to the facets' error, and none of them lies over another", () => {
    for (const [v] of models) {
      const plan = planVenue(v);
      const seats = item(buildTurn({ sport: "nhl", arena: v.id, crowd: { real: true } }, {}), "stands")!;
      for (const ring of plan.bowl.rings) {
        const band = areaOfOutline(ring.region) - areaOfOutline(ring.hole!);
        const planArea = seats.planes
          .filter((p) => p.id.startsWith(`${ring.id}-`) && p.kind === "seats")
          .reduce((sum, p) => sum + Math.abs(p.u[0] * p.v[1] - p.u[1] * p.v[0]) * (1) , 0);
        // A plane's bounding parallelogram in plan is at least the polygon drawn on it, and the sum of them is within a few quarters of the band.
        expect(planArea, `${v.id} ${ring.id}`).toBeGreaterThan(band * 0.9);
        expect(planArea, `${v.id} ${ring.id}`).toBeLessThan(band * 1.6);
      }
    }
  });

  it("faces every plane of the stands away from the surface, so that the near ones give way to the eye, and every wall and roof plane too", () => {
    for (const [v, model] of roofed) {
      const centre = planVenue(v);
      const middle = [centre.box.x + centre.box.w / 2, centre.box.y + centre.box.h / 2];
      for (const p of model.planes.filter((q) => ["seats", "concourse", "roof", "wall"].includes(q.kind) && q.shy !== undefined)) {
        const mid = [p.o[0] + (p.u[0] + p.v[0]) / 2, p.o[1] + (p.u[1] + p.v[1]) / 2];
        const out = [mid[0] - middle[0], mid[1] - middle[1]];
        const len = Math.hypot(out[0], out[1]);
        if (len < 30) continue;
        expect(((out[0] * p.shy![0] + out[1] * p.shy![1]) / len), `${v.id} ${p.id}`).toBeGreaterThan(-0.2);
      }
    }
  });

  it("raises a roof and walls only when asked, a lid over a fixed roof and a saddle over the Saddledome's", () => {
    for (const [v, model] of models) {
      expect(item(model, "roof"), v.id).toBeUndefined();
      expect(item(model, "walls"), v.id).toBeUndefined();
    }
    for (const [v, model] of roofed) {
      const roof = item(model, "roof")!;
      const walls = item(model, "walls")!;
      expect(roof.planes.length, v.id).toBeGreaterThanOrEqual(40);
      expect(walls.planes.length, v.id).toBeGreaterThanOrEqual(40);
      const plan = planVenue(v);
      const [low, high] = zs(roof.planes);
      // (A quad of the roof is a plane fitted through its corners, a foot or two off where the corners are.)
      expect(low, v.id).toBeGreaterThanOrEqual(plan.bowl.shell.edge - 3);
      if (v.roof.kind === "saddle") {
        // High at the two ends of the rink and low at the two sides: the saddle's rise (30 feet) is the roof's range over its edge.
        expect(high - low, v.id).toBeGreaterThan(20);
      } else {
        expect(high - low, v.id).toBeLessThanOrEqual(30);
      }
    }
  });

  it("keeps the floor's size steady as the view turns: one area at every turn, in desk and phone boxes, at every tip, with the roof and without", () => {
    for (const [name, group] of [["without", models], ["with a roof", roofed]] as const) {
      for (const [v, model] of group) {
        const pitches = [...new Set([...Object.values(presetsFor("nhl")).map((view) => view.pitch), 45, PITCH_MAX])].filter((pitch) => pitch > 0);
        for (const container of [[1280, 900], [390, 700]] as const) {
          for (const pitch of pitches) {
            const a = floorAreas(model, pitch, container, 10);
            expect(Math.max(...a) / Math.min(...a), `${v.id} ${name} ${container.join("x")} pitch ${pitch}`).toBeLessThan(1.02);
          }
        }
        const step = floorAreas(model, 62, [1280, 900], 3);
        expect(Math.max(...step.map((x, i) => Math.max(x, step[(i + 1) % step.length]) / Math.min(x, step[(i + 1) % step.length]))), `${v.id} ${name} steps`).toBeLessThan(1.004);
      }
    }
  });

  it("keeps the whole building inside the container at every angle: the scene is fitted to the venue", () => {
    for (const [v, model] of roofed.slice(0, 4)) {
      const [w, h] = [960, 600];
      const d = eyeDistance(w, h);
      const plan = planVenue(v);
      const corners: [number, number, number][] = [];
      for (const [x, y] of plan.footprint) for (const z of [0, plan.bowl.shell.edge + 30]) corners.push([(x - model.centre[0]) * model.scale, (y - model.centre[1]) * model.scale, z * model.scale]);
      for (const pitch of [0, 30, 62, 84]) {
        for (const yaw of range(0, 355, 15)) {
          const view = { yaw, pitch, zoom: 1 };
          const at = layoutOf(model, view, w, h).at;
          // The walls and the roof stay in the box when asked; the footprint's ground may run out of the picture, as every floor's does, but its hall does not.
          const hall = roofed.find(([x]) => x === v)![1];
          for (const p of hall.planes.filter((q) => q.kind === "wall" || q.kind === "roof")) {
            for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
              const pt: [number, number, number] = [(p.o[0] + a * p.u[0] + b * p.v[0] - model.centre[0]) * model.scale, (p.o[1] + a * p.u[1] + b * p.v[1] - model.centre[1]) * model.scale, (p.o[2] + a * p.u[2] + b * p.v[2]) * model.scale];
              const [x, y] = project(pt, view, at, d);
              expect(Math.abs(x), `${v.id} x yaw ${yaw} pitch ${pitch}`).toBeLessThanOrEqual(w / 2 + 1);
              expect(Math.abs(y), `${v.id} y yaw ${yaw} pitch ${pitch}`).toBeLessThanOrEqual(h / 2 + 1);
            }
          }
        }
      }
      expect(corners.length).toBeGreaterThan(0);
    }
  });

  it("draws the far planes before the near ones: every plane of the bowl is stacked by the depth of its middle, from every side", () => {
    for (const [v, model] of models.slice(0, 3)) {
      for (const pitch of [30, 62, 84]) {
        for (const yaw of range(0, 345, 15)) {
          const layout = layoutOf(model, { yaw, pitch, zoom: 1 }, 960, 600);
          // One rank each, in order of depth: no two planes share a place in the stack.
          const ranks = layout.stack.slice(1).filter((s, i) => model.planes[i].kind !== "ground");
          expect(new Set(ranks).size, `${v.id} yaw ${yaw} pitch ${pitch}`).toBe(ranks.length);
          expect(Math.min(...ranks), `${v.id} yaw ${yaw}`).toBeGreaterThan(layout.stack[0]);
        }
      }
    }
  });

  it("carries the building on the floor, with the arrow, and no seats on it: the stands are the planes", () => {
    for (const [v, model] of models) {
      expect(model.floor, v.id).toContain('class="ky-cr-shell"');
      expect(model.floor.includes('class="ky-cr-north"'), v.id).toBe(v.osm.axis.basis !== "none");
      expect(model.floor, v.id).not.toMatch(/class="ky-cr-(people|bed)"/);
    }
  });

  it("says what stands in it, in the words of the 3D view, and costs a few hundred elements", () => {
    for (const [v, model] of models) {
      expect(model.standing, v.id).toContain("stands");
      expect(model.planes.length, v.id).toBeLessThan(900);
    }
    for (const [v, model] of roofed) expect(model.planes.length, v.id).toBeLessThan(1100);
  });
});
