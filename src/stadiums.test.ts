import { describe, expect, it } from "vitest";
import { areaOfOutline } from "./crowd.ts";
import { crowdStands, describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { GROUNDS } from "./grounds.ts";
import { MAX_RAKE } from "./venues.ts";
import { areaOf, coreOf, inside, lonLatFrom, metresFrom, middleOf, smallestBox } from "./venues.geo.ts";
import { STADIUMS, STADIUM_IDS, VENUE_ATTRIBUTION, groundOfStadium, planStadium, stadiumBowlInside, stadiumById, stadiumByWikidata, stadiumConfigOf, stadiumOrientation, stadiumSeats, type StadiumConfigId } from "./stadiums.ts";
import { STADIUM_DATA } from "./stadiums.data.ts";
import { STADIUM_OSM } from "./stadiums.osm.data.ts";
import { buildTurn } from "./turn-entry.ts";

const bc = STADIUMS["bc-place"];
const lonLat = (ring: readonly (readonly [number, number])[]): [number, number][] => ring.map(([lon, lat]) => [lon, lat]);
const options = (sport: "cfl" | "soccer", extra: Record<string, unknown> = {}) => ({ sport, stadium: "bc-place", crowd: { real: true }, ...extra }) as never;
/** The field's box in the drawing's frame, as the stands are laid round it. */
const fieldOf = (sport: "cfl" | "soccer") => crowdStands(options(sport))!.box;

describe("the stadiums: BC Place", () => {
  it("is the one stadium of the data, a ground the package already has, with its Wikidata item and the article its facts were read from", () => {
    expect(STADIUM_IDS).toEqual(["bc-place"]);
    expect(stadiumById("bc-place")).toBe(bc);
    expect(stadiumByWikidata("Q612227")).toBe(bc);
    expect(stadiumById("toString")).toBeUndefined();
    expect(stadiumById("maracana")).toBeUndefined();
    expect(stadiumById(undefined)).toBeUndefined();
    const ground = groundOfStadium(bc);
    expect(ground.wikidata).toBe(bc.wikidata);
    expect(ground.en).toEqual(bc.en);
    expect(GROUNDS[bc.ground]).toBe(ground);
    expect(bc.en.revision).toBeGreaterThan(1_000_000_000);
  });

  it("has the seats of each configuration the sources give: 54,500 for football, 52,497 for the soccer of the 2026 tournament, with the 27,695 of the lower bowl in both", () => {
    expect(stadiumSeats(bc, "cfl")).toBe(54500);
    expect(stadiumSeats(bc, "soccer")).toBe(52497);
    expect(bc.configs.cfl).toMatchObject({ sport: "cfl", source: "wikipedia" });
    expect(bc.configs.soccer).toMatchObject({ sport: "soccer", source: "wikipedia" });
    for (const key of ["cfl", "soccer"] as const) expect(bc.configs[key].read.length).toBeGreaterThan(20);
    expect(bc.tiers).toMatchObject({ count: 2, basis: "documented", lowerSeats: 27695 });
  });

  it("says what a source says and what is ours: the roof is a retractable, cable-supported one with an opening of 100 by 85 metres, documented", () => {
    expect(bc.roof).toMatchObject({ kind: "cable", basis: "documented", opening: { length: 100, width: 85, unit: "m" } });
    expect(bc.roof.read).toContain("cables");
    expect(bc.roof.read.length).toBeGreaterThan(40);
  });

  it("is the generated data files, in step with each other: the facts have no outline and the outline file no fact", () => {
    expect(STADIUM_DATA.map((d) => d.id)).toEqual([...STADIUM_IDS]);
    expect(Object.keys(STADIUM_OSM)).toEqual([...STADIUM_IDS]);
    expect(JSON.stringify(STADIUM_DATA)).not.toMatch(/"ring"|"axis"|"osm"/);
    expect(JSON.stringify(STADIUM_OSM)).not.toMatch(/"seats"|"tiers"|"revision"/);
  });

  it("maps a configuration to a sport and nothing else", () => {
    expect(stadiumConfigOf("cfl")).toBe("cfl");
    expect(stadiumConfigOf("soccer")).toBe("soccer");
    expect(stadiumConfigOf("nhl")).toBeUndefined();
    expect(stadiumConfigOf(undefined)).toBeUndefined();
  });
});

describe("what OpenStreetMap gave of BC Place", () => {
  const osm = bc.osm;

  it("is ODbL 1.0 data with its credit, from the way tagged with the Wikidata item, and a roof of a band and an opening", () => {
    expect(osm.licence).toBe("ODbL-1.0");
    expect(osm.attribution).toBe(VENUE_ATTRIBUTION);
    expect(osm.source).toBe("way/24705904");
    expect(osm.roof).toMatchObject({ source: "relation/5836463", height: 61, rise: 13 });
    expect(osm.roof?.opening?.ring.length).toBeGreaterThan(8);
  });

  it("is a stadium's building: about 38,500 square metres, with a middle within 250 metres of the ground's coordinates", () => {
    const ring = lonLat(osm.ring);
    const area = areaOf(metresFrom(middleOf(ring), ring));
    expect(area).toBeGreaterThan(35000);
    expect(area).toBeLessThan(42000);
    const ground = groundOfStadium(bc);
    expect(Math.hypot(...metresFrom([ground.lon, ground.lat], [middleOf(ring)])[0])).toBeLessThan(250);
  });

  it("maps the roof's opening at the size the article gives: within 5 percent of 100 by 85 metres", () => {
    const ring = lonLat(osm.roof!.opening!.ring);
    const box = smallestBox(metresFrom(middleOf(ring), ring));
    expect(Math.abs(box.length - 100) / 100).toBeLessThan(0.05);
    expect(Math.abs(box.width - 85) / 85).toBeLessThan(0.05);
  });

  it("lays the field along the opening, an orientation the building's own long axis agrees with", () => {
    const ring = lonLat(osm.roof!.opening!.ring);
    const origin = middleOf(lonLat(osm.ring));
    const box = smallestBox(metresFrom(origin, ring));
    expect(osm.axis.basis).toBe("opening");
    expect(osm.axis.heading).toBeCloseTo(box.heading, 0);
    expect(stadiumOrientation(bc)).toEqual({ heading: osm.axis.heading, basis: "opening", north: Math.round((90 - osm.axis.heading) * 10) / 10 });
    // The main hall of the building (the largest rectangle inside it) runs the same way, to a few degrees.
    const core = coreOf(metresFrom(origin, lonLat(osm.ring)));
    const off = Math.abs(((core.heading - osm.axis.heading + 540) % 180) - 90);
    expect(90 - off).toBeLessThan(6);
    // And the middle of the field is the opening's, inside the building and within 30 metres of the building's middle.
    const [east, north] = metresFrom(origin, [osm.axis.centre])[0];
    expect(inside(metresFrom(origin, lonLat(osm.ring)), [east, north])).toBe(true);
    expect(Math.hypot(east, north)).toBeLessThan(30);
    expect(lonLatFrom(origin, [east, north])[0]).toBeCloseTo(osm.axis.centre[0], 5);
  });
});

describe("the bowl of BC Place", () => {
  const configs: [StadiumConfigId, ReturnType<typeof fieldOf>][] = [["cfl", fieldOf("cfl")], ["soccer", fieldOf("soccer")]];
  const plans = configs.map(([config, box]) => ({ config, box, plan: planStadium(bc, config, box) }));

  it("holds the seats of its configuration, to the seat, in two bowls, and fits inside the building", () => {
    for (const { config, plan } of plans) {
      expect(plan.fit, config).toBe("fits");
      expect(plan.total, config).toBe(stadiumSeats(bc, config));
      expect(plan.seats.map((t) => t.tier), config).toEqual(["lower", "upper"]);
      expect(plan.seats.reduce((s, t) => s + t.seats, 0), config).toBe(plan.total);
      expect(plan.bowl.rings.reduce((s, r) => s + r.seats, 0), config).toBe(plan.total);
      expect(stadiumBowlInside(plan), config).toBe(true);
    }
  });

  it("has the lower bowl the infobox gives, 27,695 seats, in football and in soccer, and the upper bowl takes the rest", () => {
    for (const { config, plan } of plans) {
      expect(plan.seats[0].seats, config).toBeGreaterThanOrEqual(27694);
      expect(plan.seats[0].seats, config).toBeLessThanOrEqual(27696);
      expect(plan.seats[1].seats, config).toBe(stadiumSeats(bc, config) - plan.seats[0].seats);
    }
    expect(plans[0].plan.seats[1].seats - plans[1].plan.seats[1].seats).toBe(54500 - 52497);
  });

  it("is the same building for both: the same footprint, the same hall and the same first row, round fields of two sizes", () => {
    const [a, b] = plans;
    expect(a.box.w).toBeCloseTo(450, 0);
    expect(a.box.h).toBeCloseTo(195, 0);
    expect(b.box.w).toBeCloseTo(105 * 3.28084, 0);
    expect(b.box.h).toBeCloseTo(68 * 3.28084, 0);
    const centre = (box: typeof a.box): [number, number] => [box.x + box.w / 2, box.y + box.h / 2];
    // Placed round each field's middle, the building is the same shape: the footprints differ by the shift of the middles alone.
    const [ca, cb] = [centre(a.box), centre(b.box)];
    a.plan.footprint.forEach(([x, y], i) => {
      expect(x - ca[0]).toBeCloseTo(b.plan.footprint[i][0] - cb[0], 1);
      expect(y - ca[1]).toBeCloseTo(b.plan.footprint[i][1] - cb[1], 1);
    });
    expect(a.plan.bowl.rings[0].hole).not.toEqual(undefined);
    const first = (p: typeof a.plan): [number, number] => {
      const hole = p.bowl.rings[0].hole as { x0: number; x1: number };
      return [hole.x0, hole.x1];
    };
    expect(first(a.plan)[1] - first(a.plan)[0]).toBeCloseTo(first(b.plan)[1] - first(b.plan)[0], 1);
  });

  it("is built from the field out: each bowl outside the last with a walk between, higher than the last and no steeper than a bowl is", () => {
    for (const { config, plan } of plans) {
      const [lower, upper] = plan.bowl.rings;
      expect(lower.height[0], config).toBeLessThan(lower.height[1]);
      expect(upper.height[0], config).toBeGreaterThan(lower.height[1]);
      expect(upper.height[1], config).toBeGreaterThan(upper.height[0]);
      expect(upper.from, config).toBeGreaterThan(lower.to);
      for (const ring of plan.bowl.rings) expect(ring.rake, config).toBeLessThanOrEqual(MAX_RAKE + 0.01);
      // The seats take 3.8 square feet or, in a building with less room, down to 3: a building this size needs no more than 3.4.
      expect(plan.seatArea, config).toBeGreaterThanOrEqual(3);
      expect(plan.seatArea, config).toBeLessThanOrEqual(3.8);
      expect(areaOfOutline(upper.region) - areaOfOutline(upper.hole!)).toBeGreaterThan(0);
    }
  });

  it("has a cable roof: its rim where OpenStreetMap maps it (the height less the roof's rise, 48 metres), its crown 13 metres over it, and the opening over the field", () => {
    for (const { config, plan } of plans) {
      const shell = plan.bowl.shell;
      expect(shell.roof, config).toBe("cable");
      expect(shell.edge, config).toBeCloseTo(48 * 3.28084, 0);
      expect(shell.crown?.rise, config).toBeCloseTo(13 * 3.28084, 0);
      // The opening is the field's size and lies round the field's middle.
      const open = shell.crown!.opening;
      const box = smallestBox(open);
      expect(box.length / 3.28084, config).toBeGreaterThan(95);
      expect(box.length / 3.28084, config).toBeLessThan(106);
      expect(inside(open, [plan.box.x + plan.box.w / 2, plan.box.y + plan.box.h / 2]), config).toBe(true);
      expect(plan.opening, config).toBe(open);
    }
  });

  it("is the same every time, a pure function of the stadium, the configuration and the field", () => {
    const [a] = plans;
    expect(planStadium(bc, "cfl", a.box)).toBe(a.plan);
    expect(JSON.stringify(planStadium(bc, "cfl", { ...a.box }))).toBe(JSON.stringify(a.plan));
  });
});

describe("BC Place drawn in 2D", () => {
  it("is the building's outline under the stands, with the arrow that says where north is, for football and for soccer", () => {
    for (const sport of ["cfl", "soccer"] as const) {
      const svg = drawKyogijo(options(sport));
      expect(svg, sport).toContain('class="ky-cr-shell"');
      expect(svg, sport).toContain('class="ky-cr-north"');
      expect(svg, sport).toContain("ky-cr-people");
      expect(svg, sport).toBe(drawKyogijo(options(sport)));
    }
    expect(drawKyogijo(options("cfl"))).not.toBe(drawKyogijo(options("soccer")));
  });

  it("draws a soccer pitch for a ground that is a stadium, with no `stadium` asked for", () => {
    const svg = drawKyogijo({ sport: "soccer", ground: "bc-place", crowd: { real: true } } as never);
    expect(svg).toContain('class="ky-cr-shell"');
    expect(svg).toContain("BC Place");
    expect(crowdStands({ sport: "soccer", ground: "bc-place", crowd: { real: true } } as never)?.seats).toBe(52497);
  });

  it("has the stands of the bowl: a tier per bowl, the seats the configuration has, and no block of visitors, which no source places", () => {
    for (const sport of ["cfl", "soccer"] as const) {
      const stands = crowdStands(options(sport))!;
      expect(stands.rings.map((r) => r.tier), sport).toEqual(["lower", "upper"]);
      expect(stands.seats, sport).toBe(stadiumSeats(bc, sport));
      expect(stands.sectors.filter((s) => s.kind === "away"), sport).toHaveLength(0);
      expect(stands.real?.roof, sport).toBe("cable");
      expect(stands.stadium, sport).toBeUndefined();
    }
  });

  it("is ignored where it does not apply: no real crowd, a sport with no configuration, another stadium's key, a league of the caller's own", () => {
    const plain = drawKyogijo({ sport: "cfl", id: "x" } as never);
    const SHELL = 'class="ky-cr-shell"';
    expect(drawKyogijo({ sport: "cfl", stadium: "bc-place", crowd: { real: false } } as never)).not.toContain(SHELL);
    expect(drawKyogijo({ sport: "cfl", stadium: "bc-place", id: "x" } as never)).toBe(plain);
    expect(drawKyogijo({ sport: "cfl", stadium: "nowhere", crowd: { real: true } } as never)).not.toContain(SHELL);
    expect(drawKyogijo({ sport: "nfl", stadium: "bc-place", crowd: { real: true } } as never)).not.toContain(SHELL);
    expect(drawKyogijo({ sport: "nhl", stadium: "bc-place", crowd: { real: true } } as never)).not.toContain(SHELL);
  });

  it("says what it is in both languages, with the credit and the seats, and no mark of a club, a league or a tournament", () => {
    for (const sport of ["cfl", "soccer"] as const) {
      const en = describeDrawing(options(sport));
      expect(en.description, sport).toContain(`${stadiumSeats(bc, sport)} seats in 2 bowls`);
      expect(en.description, sport).toContain("BC Place");
      expect(en.description, sport).toContain("(c) OpenStreetMap contributors");
      expect(en.description, sport).toContain("the opening in the roof");
      const ja = describeDrawing(options(sport, { language: "ja" }));
      expect(ja.description, sport).toContain("OpenStreetMap");
      expect(ja.description, sport).toContain("BCプレイス");
      expect(ja.description, sport).toContain("2層");
      const all = drawKyogijo(options(sport));
      for (const word of ["FIFA", "World Cup", "Lions", "Whitecaps", "Canadian Football League", "Grey Cup"]) expect(all, `${sport} ${word}`).not.toContain(word);
    }
  });

  it("has a neutral crowd, in no club's colours, and the sides' own colours only where the field has them", () => {
    const svg = drawKyogijo(options("soccer"));
    expect(svg).toContain("--ky-cr-home:");
    expect(svg).not.toMatch(/Vancouver|Lions|Whitecaps/);
  });

  it("keeps the whole building and the arrow inside the drawing at both themes, small and large", () => {
    for (const sport of ["cfl", "soccer"] as const) {
      for (const extra of [{}, { theme: "dark" }, { width: 320 }, { orientation: "portrait" }]) {
        const svg = drawKyogijo(options(sport, extra));
        const view = /viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number);
        const shell = /class="ky-cr-shell" d="([^"]*)"/.exec(svg)![1];
        const points = [...shell.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
        expect(points.length, `${sport} ${JSON.stringify(extra)}`).toBeGreaterThan(10);
        if ((extra as { orientation?: string }).orientation === "portrait") continue;
        for (const [x, y] of points) {
          expect(x, `${sport} ${JSON.stringify(extra)}`).toBeGreaterThanOrEqual(view[0] - 0.5);
          expect(x, `${sport} ${JSON.stringify(extra)}`).toBeLessThanOrEqual(view[0] + view[2] + 0.5);
          expect(y, `${sport} ${JSON.stringify(extra)}`).toBeGreaterThanOrEqual(view[1] - 0.5);
          expect(y, `${sport} ${JSON.stringify(extra)}`).toBeLessThanOrEqual(view[1] + view[3] + 0.5);
        }
      }
    }
  });
});

describe("BC Place in 3D", () => {
  const model = buildTurn(options("cfl"), { venue: { roof: true } });
  const open = buildTurn(options("cfl"), { venue: { roof: true, roofOpen: true } });
  const bare = buildTurn(options("cfl"), {});
  const item = (m: ReturnType<typeof buildTurn>, kind: string) => m.uprights.items.find((i) => i.kind === kind);
  const zs = (planes: readonly { o: readonly number[]; u: readonly number[]; v: readonly number[] }[]): [number, number] => {
    const all = planes.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]]);
    return [Math.min(...all), Math.max(...all)];
  };

  it("raises its walls to the roof's rim and a roof of cable-supported pieces rising 13 metres to the opening, which the retractable fabric closes", () => {
    const walls = item(model, "walls")!;
    const roof = item(model, "roof")!;
    expect(walls.planes.length).toBeGreaterThan(30);
    expect(Math.max(...walls.planes.map((p) => zs([p])[1]))).toBeCloseTo(48 * 3.28084, 0);
    const pieces = roof.planes.filter((p) => p.id.startsWith("roof-"));
    expect(pieces.length).toBeGreaterThanOrEqual(28);
    expect(pieces.every((p) => p.svg.includes('class="u-cable"'))).toBe(true);
    const [low, high] = zs(pieces);
    expect(low).toBeCloseTo(48 * 3.28084, 0);
    expect(Math.abs(high - 61 * 3.28084)).toBeLessThan(1.5);
    const fabric = roof.planes.filter((p) => p.id.startsWith("fabric-"));
    expect(fabric.length).toBeGreaterThanOrEqual(28);
    for (const p of fabric) {
      const [a, b] = zs([p]);
      // The fabric lies flat at the crown's height.
      expect(b - a).toBeLessThan(1e-6);
      expect(Math.abs(a - 61 * 3.28084)).toBeLessThan(1.5);
    }
  });

  it("gathers the fabric into the pod when the roof is open: the pod stays, the fabric goes, the band and the walls are the same", () => {
    const [a, b] = [item(model, "roof")!.planes, item(open, "roof")!.planes];
    expect(a.some((p) => p.id.startsWith("fabric-"))).toBe(true);
    expect(b.some((p) => p.id.startsWith("fabric-"))).toBe(false);
    expect(a.filter((p) => p.id.startsWith("pod-")).length).toBe(b.filter((p) => p.id.startsWith("pod-")).length);
    expect(a.filter((p) => p.id.startsWith("roof-")).length).toBe(b.filter((p) => p.id.startsWith("roof-")).length);
    expect(item(open, "walls")!.planes.length).toBe(item(model, "walls")!.planes.length);
  });

  it("raises a roof and walls only when asked", () => {
    expect(item(bare, "roof")).toBeUndefined();
    expect(item(bare, "walls")).toBeUndefined();
    expect(item(bare, "stands")).toBeDefined();
  });

  it("raises the bowls at the heights the plan gives, solid, and faces every plane of the building away from the field", () => {
    const plan = planStadium(bc, "cfl", fieldOf("cfl"));
    const seats = item(model, "stands")!;
    for (const ring of plan.bowl.rings) {
      const mine = seats.planes.filter((p) => p.id.startsWith(`${ring.id}-`) && p.kind === "seats");
      expect(mine.length).toBeGreaterThanOrEqual(12);
      const [low, high] = zs(mine);
      expect(low).toBeCloseTo(ring.height[0], 3);
      expect(high).toBeCloseTo(ring.height[1], 3);
    }
    for (const p of [...item(model, "walls")!.planes, ...item(model, "roof")!.planes].filter((q) => q.id !== "pod-top")) expect(p.shy, p.id).toBeDefined();
  });

  it("carries the building on the floor with the arrow and no seats, and costs under a thousand elements", () => {
    expect(model.floor).toContain('class="ky-cr-shell"');
    expect(model.floor).toContain('class="ky-cr-north"');
    expect(model.floor).not.toMatch(/class="ky-cr-(people|bed)"/);
    expect(model.planes.length).toBeLessThan(1000);
  });
});
