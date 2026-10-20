import { describe, expect, it } from "vitest";
import { areaOfOutline, resolveCrowd } from "./crowd.ts";
import { MLB_DIAMOND } from "./leagues/baseball.ts";
import { fenceFor, parkById } from "./parks.ts";
import { fenceOutline } from "./surfaces/baseball.ts";
import { crowdStands, describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { GROUNDS } from "./grounds.ts";
import { MAX_RAKE } from "./venues.ts";
import { areaOf, coreOf, inside, lonLatFrom, metresFrom, middleOf, smallestBox } from "./venues.geo.ts";
import { STADIUMS, STADIUM_IDS, VENUE_ATTRIBUTION, groundOfStadium, planPark, planStadium, stadiumBowlInside, stadiumById, stadiumByWikidata, stadiumConfigOf, stadiumFrameHeading, stadiumKind, stadiumNames, stadiumOrientation, stadiumSeats, type StadiumConfigId } from "./stadiums.ts";
import { STADIUM_DATA } from "./stadiums.data.ts";
import { STADIUM_OSM } from "./stadiums.osm.data.ts";
import { buildTurn } from "./turn-entry.ts";

const bc = STADIUMS["bc-place"];
const lonLat = (ring: readonly (readonly [number, number])[]): [number, number][] => ring.map(([lon, lat]) => [lon, lat]);
const options = (sport: "cfl" | "nfl" | "soccer", extra: Record<string, unknown> = {}) => ({ sport, stadium: "bc-place", crowd: { real: true }, ...extra }) as never;
/** The field's box in the drawing's frame, as the stands are laid round it. */
const fieldOf = (sport: "cfl" | "nfl" | "soccer") => crowdStands(options(sport))!.box;

describe("the stadiums: BC Place", () => {
  it("is the one stadium of the data, a ground the package already has, with its Wikidata item and the article its facts were read from", () => {
    expect(STADIUM_IDS).toEqual(["bc-place", "lumen-field", "t-mobile-park"]);
    expect(stadiumById("bc-place")).toBe(bc);
    expect(stadiumByWikidata("Q612227")).toBe(bc);
    expect(stadiumById("toString")).toBeUndefined();
    expect(stadiumById("maracana")).toBeUndefined();
    expect(stadiumById(undefined)).toBeUndefined();
    const ground = groundOfStadium(bc);
    expect(ground.wikidata).toBe(bc.wikidata);
    expect(ground.en).toEqual(bc.en);
    expect(GROUNDS[bc.ground!]).toBe(ground);
    expect(bc.en.revision).toBeGreaterThan(1_000_000_000);
  });

  it("has the seats of each configuration the sources give: 54,500 for football, 52,497 for the soccer of the 2026 tournament, with the 27,695 of the lower bowl in both", () => {
    expect(stadiumSeats(bc, "cfl")).toBe(54500);
    expect(stadiumSeats(bc, "soccer")).toBe(52497);
    expect(bc.configs.cfl).toMatchObject({ sport: "cfl", source: "wikipedia" });
    expect(bc.configs.soccer).toMatchObject({ sport: "soccer", source: "wikipedia" });
    for (const key of ["cfl", "soccer"] as const) expect(bc.configs[key]!.read.length).toBeGreaterThan(20);
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

/** The corners of the polygon a roof plane draws, in the scene: the plane's own corner and sides, and the points of its first polygon in its own feet. */
const cornersOf = (p: { o: readonly number[]; u: readonly number[]; v: readonly number[]; svg: string }): [number, number, number][] => {
  const points = /<polygon[^>]* points="([^"]*)"/.exec(p.svg)![1].trim().split(/\s+/).map((pair) => pair.split(",").map(Number));
  const [lu, lv] = [Math.hypot(...p.u), Math.hypot(...p.v)];
  return points.map(([x, y]): [number, number, number] => [0, 1, 2].map((i) => p.o[i] + (x / lu) * p.u[i] + (y / lv) * p.v[i]) as [number, number, number]);
};
const lumen = STADIUMS["lumen-field"];
const tmobile = STADIUMS["t-mobile-park"];
const FEET = 3.28084;

describe("Lumen Field", () => {
  it("is a stadium of football and soccer with the seats the article gives for each, one bowl fitted to the larger, and a canopy over 70 percent of its seats", () => {
    expect(stadiumKind(lumen)).toBe("stadium");
    expect(lumen.gridiron).toBe("nfl");
    expect(stadiumSeats(lumen, "nfl")).toBe(68740);
    expect(stadiumSeats(lumen, "soccer")).toBe(37722);
    expect(stadiumSeats(lumen, "cfl")).toBe(0);
    expect(lumen.bowlSeats).toBe(68740);
    expect(lumen.wikidataSeats).toEqual([67000, 72000]);
    expect(lumen.tiers).toMatchObject({ count: 3, basis: "documented" });
    expect(lumen.roof).toMatchObject({ kind: "canopy", basis: "documented", cover: 0.7 });
    expect(stadiumByWikidata("Q612736")).toBe(lumen);
    expect(stadiumNames(lumen)).toEqual({ en: "Lumen Field", ja: "ルーメン・フィールド" });
  });

  it("is OpenStreetMap's relation of its building, the field lying along the pitches it maps (north and south), and two canopies one each side of the field", () => {
    expect(lumen.osm.source).toBe("relation/2305831");
    expect(lumen.osm.axis).toMatchObject({ heading: 0, basis: "pitch" });
    expect(lumen.osm.canopies).toHaveLength(2);
    for (const c of lumen.osm.canopies!) expect(c).toMatchObject({ height: 36, rise: 10 });
    const centres = lumen.osm.canopies!.map((c) => middleOf(lonLat(c.ring))[0] - lumen.osm.axis.centre[0]);
    // East and west of the middle of the field, 70 to 90 metres.
    expect(Math.min(...centres)).toBeLessThan(0);
    expect(Math.max(...centres)).toBeGreaterThan(0);
    const ring = lonLat(lumen.osm.ring);
    const area = areaOf(metresFrom(middleOf(ring), ring));
    expect(area).toBeGreaterThan(45000);
    expect(area).toBeLessThan(55000);
  });

  it("holds the bowl's seats in three bowls and opens a configuration's from the lowest bowl up: the soccer pitch closes the upper bowl and part of the middle one, drawn empty", () => {
    const nfl = planStadium(lumen, "nfl", fieldOf("nfl"));
    const soccer = planStadium(lumen, "soccer", fieldOf("soccer"));
    for (const p of [nfl, soccer]) {
      expect(p.fit).toBe("fits");
      expect(p.total).toBe(68740);
      expect(p.seats.map((t) => t.tier)).toEqual(["lower", "middle", "upper"]);
      expect(stadiumBowlInside(p)).toBe(true);
    }
    expect(nfl.open).toBe(68740);
    expect(soccer.open).toBe(37722);
    expect(nfl.bowl.rings.map((r) => r.fill)).toEqual([1, 0.94, 0.88]);
    const [lower, middle, upper] = soccer.bowl.rings;
    expect(lower.fill).toBe(1);
    expect(middle.fill).toBeGreaterThan(0);
    expect(middle.fill).toBeLessThan(0.94);
    expect(upper.fill).toBe(0);
    // The seats open are the soccer configuration's, to a seat of rounding.
    const openSeats = lower.seats + middle.seats * (middle.fill / 0.94);
    expect(Math.abs(openSeats - 37722)).toBeLessThan(40);
  });

  it("is lowered under its canopy: the top row stands under the canopy's low edge by at least a clearance", () => {
    const p = planStadium(lumen, "nfl", fieldOf("nfl"));
    const low = Math.min(...p.bowl.shell.canopies!.map((c) => c.low));
    expect(low).toBeCloseTo(26 * FEET, 0);
    expect(p.bowl.rings[2].height[1]).toBeLessThanOrEqual(low - 5.4);
    expect(p.bowl.rings[2].height[1]).toBeGreaterThan(40);
    expect(p.bowl.shell.roof).toBe("canopy");
    for (const ring of p.bowl.rings) expect(ring.rake).toBeLessThanOrEqual(36.01);
  });

  it("draws the football field and the soccer pitch in the same building, in the NFL's first row, and is ignored for the league it has no field for", () => {
    for (const sport of ["nfl", "soccer"] as const) {
      const svg = drawKyogijo(options(sport, { stadium: "lumen-field" }));
      expect(svg, sport).toContain('class="ky-cr-shell"');
      expect(svg, sport).toContain('class="ky-cr-north"');
      const stands = crowdStands(options(sport, { stadium: "lumen-field" }))!;
      expect(stands.seats, sport).toBe(68740);
      expect(stands.real?.roof, sport).toBe("canopy");
    }
    expect(drawKyogijo({ sport: "soccer", ground: "lumen-field", crowd: { real: true } } as never)).toContain('class="ky-cr-shell"');
    expect(drawKyogijo(options("cfl", { stadium: "lumen-field", id: "x" }))).toBe(drawKyogijo({ sport: "cfl", crowd: { real: true }, id: "x" } as never));
    const en = describeDrawing(options("nfl", { stadium: "lumen-field" }));
    expect(en.description).toContain("68740 seats in 3 bowls");
    expect(en.description).toContain("The field lies as OpenStreetMap maps the pitch");
    const ja = describeDrawing(options("soccer", { stadium: "lumen-field", language: "ja" }));
    expect(ja.description).toContain("ルーメン・フィールド");
    expect(ja.description).toContain("ピッチ");
  });

  it("raises its walls to just over the top row and canopies over the sides, high at the back of the stands, and leaves the field and the ends open", () => {
    const model = buildTurn(options("nfl", { stadium: "lumen-field" }), { venue: { roof: true } });
    const roof = model.uprights.items.find((i) => i.kind === "roof")!;
    const planes = roof.planes;
    expect(planes.length).toBeGreaterThan(20);
    expect(planes.every((p) => p.id.startsWith("roof-c"))).toBe(true);
    expect(new Set(planes.map((p) => p.id.split("-")[1])).size).toBe(2);
    // Each piece is a triangle through its corners: they stand between the canopy's low edge (26 metres) and its high one (36).
    const zs = planes.flatMap((p) => cornersOf(p).map((c) => c[2]));
    expect(Math.min(...zs)).toBeCloseTo(26 * FEET, 0);
    expect(Math.max(...zs)).toBeCloseTo(36 * FEET, 0);
    // Over the middle of the field there is nothing: no plane of the roof has its middle over the field's box.
    const plan = planStadium(lumen, "nfl", fieldOf("nfl"));
    const field = plan.box;
    for (const p of planes) {
      const mx = p.o[0] + (p.u[0] + p.v[0]) / 2;
      const my = p.o[1] + (p.u[1] + p.v[1]) / 2;
      expect(mx > field.x && mx < field.x + field.w && my > field.y && my < field.y + field.h, p.id).toBe(false);
    }
    expect(model.uprights.items.find((i) => i.kind === "walls")).toBeDefined();
  });
});

describe("T-Mobile Park", () => {
  // What the drawing lays the park's stands from: its fence, the backstop and the crowd with no visitors' block.
  const parkInput = () => ({ fence: fenceOutline(fenceFor(parkById("t-mobile-park"), undefined)), backstop: MLB_DIAMOND.backstop, crowd: { ...resolveCrowd({ real: true })!, awayEnd: "none" as const }, seatsOnWalls: [] });
  const parkPlan = () => planPark(tmobile, parkInput());

  it("is a ballpark with the seats of baseball, its levels by their seats, and a retractable roof in sections 217 to 269 feet over the field", () => {
    expect(stadiumKind(tmobile)).toBe("park");
    expect(tmobile.park).toBe("t-mobile-park");
    expect(stadiumSeats(tmobile, "mlb")).toBe(47368);
    expect(tmobile.wikidataSeats).toEqual([47476]);
    expect(tmobile.tiers).toMatchObject({ count: 4, basis: "documented", tierSeats: { lower: 20521, upper: 4123 + 2050 + 15902, bleachers: 3666 } });
    expect(tmobile.roof).toMatchObject({ kind: "panels", basis: "documented", bottom: 217, top: 269 });
    expect(stadiumNames(tmobile)).toEqual({ en: "T-Mobile Park", ja: "T-モバイル・パーク" });
  });

  it("lies as the infield OpenStreetMap maps and the outline say: home plate faces north-east, the baselines 4.4 degrees from north, and the fence and the stands behind it fit the building", () => {
    expect(tmobile.osm.axis).toMatchObject({ heading: 49.4, basis: "infield", elongation: 1 });
    expect(stadiumFrameHeading(tmobile)).toBeCloseTo(139.4, 5);
    expect(stadiumOrientation(tmobile)).toEqual({ heading: 49.4, basis: "infield", north: Math.round((90 - 139.4) * 10) / 10 });
    expect(tmobile.osm.source).toBe("relation/3008332");
    expect(tmobile.osm.height).toBe(21);
  });

  it("holds the seats of baseball to within two percent, each band as deep as the seats of its levels need, in the proportions the article gives", () => {
    const plan = parkPlan();
    expect(plan.fit).toBe("fits");
    expect(Math.abs(plan.total - 47368) / 47368).toBeLessThan(0.02);
    const share = (id: string) => plan.seats.find((s) => s.tier === id)!.seats / plan.total;
    expect(share("lower")).toBeCloseTo(20521 / 46262, 1);
    expect(share("upper")).toBeCloseTo(22075 / 46262, 1);
    expect(share("bleachers")).toBeCloseTo(3666 / 46262, 1);
    expect(plan.depths.lower).toBeGreaterThan(20);
    expect(plan.depths.upper).toBeLessThan(160);
    expect(planPark(tmobile, parkInput())).toBe(plan);
  });

  it("has the park's fence inside the building and the stands too, and the building's walls as high as OpenStreetMap maps them (21 metres)", () => {
    const plan = parkPlan();
    const fence = parkInput().fence.map(([u, v]): [number, number] => [u, -v]);
    for (const p of fence) expect(inside(plan.footprint, p), `${p}`).toBe(true);
    expect(plan.stands.real?.wall).toBeCloseTo(21 * FEET, 0);
    expect(plan.stands.real?.roof).toBe("panels");
    expect(plan.stands.real?.panels?.bottom).toBe(217);
    expect(plan.stands.real?.panels?.top).toBe(269);
    // The sections rest over the east side: the parked outline is in the east third of the building.
    expect(plan.stands.real!.panels!.parked.length).toBeGreaterThan(3);
  });

  it("draws in 2D with its building and arrow, says what it is in both languages, and is ignored for a park that has no real one", () => {
    const o = { sport: "mlb", park: "t-mobile-park", crowd: { real: true } } as never;
    const svg = drawKyogijo(o);
    expect(svg).toContain('class="ky-cr-shell"');
    expect(svg).toContain('class="ky-cr-north"');
    const en = describeDrawing(o);
    expect(en.description).toContain("The outfield fence follows the figures published for T-Mobile Park.");
    expect(en.description).toContain("for 47368 seats");
    expect(en.description).toContain("The way home plate faces is worked out from the infield OpenStreetMap maps");
    const ja = describeDrawing({ ...(o as object), language: "ja" } as never);
    expect(ja.description).toContain("T-モバイル・パーク");
    expect(ja.description).toContain("47368席");
    expect(drawKyogijo({ sport: "mlb", park: "fenway-park", crowd: { real: true }, id: "x" } as never)).toBe(drawKyogijo({ sport: "mlb", park: "fenway-park", crowd: true, id: "x" } as never));
    expect(drawKyogijo({ sport: "mlb", park: "t-mobile-park", crowd: true, id: "x" } as never)).not.toContain('class="ky-cr-shell"');
  });

  it("raises walls at 21 metres and a roof far over the field: closed, sections between 217 and 269 feet over a crown; open, only the sections resting over the east side", () => {
    const closed = buildTurn({ sport: "mlb", park: "t-mobile-park", crowd: { real: true } } as never, { venue: { roof: true } });
    const open = buildTurn({ sport: "mlb", park: "t-mobile-park", crowd: { real: true } } as never, { venue: { roof: true, roofOpen: true } });
    const walls = closed.uprights.items.find((i) => i.kind === "walls")!;
    expect(Math.max(...walls.planes.flatMap((p) => [p.o[2], p.o[2] + p.v[2]]))).toBeCloseTo(21 * FEET, 0);
    const roof = (m: typeof closed) => m.uprights.items.find((i) => i.kind === "roof")!.planes;
    const z = (planes: ReturnType<typeof roof>): [number, number] => {
      const all = planes.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]]);
      return [Math.min(...all), Math.max(...all)];
    };
    // Each piece of the closed roof is a pair of triangles, from the rim at 217 feet up to the crown at 269.
    const pieces = roof(closed).filter((p) => /^roof-\d+[ab]$/.test(p.id));
    expect(pieces.length).toBeGreaterThanOrEqual(56);
    const zs = pieces.flatMap((p) => cornersOf(p).map((c) => c[2]));
    expect(Math.min(...zs)).toBeCloseTo(217, 0);
    expect(Math.max(...zs)).toBeCloseTo(269, 0);
    expect(roof(closed).some((p) => p.id.startsWith("fabric-"))).toBe(true);
    expect(roof(closed).some((p) => p.id.startsWith("parked-"))).toBe(false);
    expect(roof(open).some((p) => p.id.startsWith("fabric-"))).toBe(false);
    const parked = roof(open).filter((p) => p.id.startsWith("parked-"));
    expect(parked.length).toBeGreaterThan(3);
    const [pl, ph] = z(parked);
    expect(pl).toBeCloseTo(217, 0);
    expect(ph).toBeCloseTo(224, 0);
  });
});
