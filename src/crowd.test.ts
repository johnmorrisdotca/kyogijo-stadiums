import { describe, expect, it } from "vitest";
import { drawToCanvas, type CanvasContext } from "./canvas.ts";
import { densityOf, generator, GRIDIRON_GROUNDS, layoutOf, outlinePath, outlinePoints, rayAt, resolveCrowd } from "./crowd.ts";
import { drawKyogijo, SPORTS, crowdStands } from "./draw.ts";
import { fenceAt, FOOTBALL } from "./geometry.ts";
import { GROUNDS } from "./grounds.ts";
import { fenceFor, parkById } from "./parks.ts";
import { PNG_PEER_MISSING, toPNG } from "./png.ts";
import { sceneOf } from "./scene.ts";
import { sceneToSvg } from "./scene.flat.ts";
import { GAME } from "./scene.fixture.ts";
import { parseSvg, writeSvg } from "./scene.xml.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import type { SurfaceOptions } from "./types.ts";
import { parseXml } from "./xml.fixture.ts";

const soccer: SurfaceOptions = { sport: "soccer", id: "cr", crowd: true };
const count = (svg: string, re: RegExp): number => (svg.match(re) ?? []).length;

describe("the option", () => {
  it("is off unless asked for: a drawing without it is the same text, and `false` is without it", () => {
    for (const sport of SPORTS) {
      const clean = drawKyogijo({ sport, id: "x" });
      expect(drawKyogijo({ sport, id: "x", crowd: false }), sport).toBe(clean);
      expect(clean, sport).not.toContain("ky-cr-");
      expect(clean, sport).not.toContain("-cr-");
    }
    expect(resolveCrowd(undefined)).toBeUndefined();
    expect(resolveCrowd(false)).toBeUndefined();
  });

  it("is read once: every part has its value and a part out of range is held to it", () => {
    expect(resolveCrowd(true)).toEqual({ shape: undefined, open: "right", stadium: "auto", density: undefined, attendance: undefined, capacity: undefined, seed: 1, home: undefined, away: undefined, awayEnd: "auto", tifo: undefined, tifoDesign: "stripes", gaps: true, roof: true, wallSeats: undefined, real: false, stands: true, detail: "auto" });
    const held = resolveCrowd({ density: 7, seed: 2.9, shape: "oval" as never, awayEnd: "up" as never, tifo: true, tifoDesign: "checks", open: "left", gaps: false, stadium: "nfl", capacity: -3, attendance: -1 });
    expect(held).toMatchObject({ density: 1, seed: 2, shape: undefined, awayEnd: "auto", tifo: "home", tifoDesign: "checks", open: "left", gaps: false, stadium: "nfl", capacity: undefined, attendance: undefined });
    expect(resolveCrowd({ density: -1 })?.density).toBe(0);
    expect(resolveCrowd({ real: true, stands: false })).toMatchObject({ real: true, stands: false });
    expect(resolveCrowd({ real: "yes" as never })?.real).toBe(false);
  });

  it("gets its density from `density`, else attendance over capacity (the ground's, else the model's seats), else 0.85", () => {
    const crowd = (o: object) => resolveCrowd(o) as NonNullable<ReturnType<typeof resolveCrowd>>;
    expect(densityOf(crowd({}), 50_000, undefined)).toBe(0.85);
    expect(densityOf(crowd({ density: 0.4, attendance: 10 }), 50_000, undefined)).toBe(0.4);
    expect(densityOf(crowd({ attendance: 25_000 }), 50_000, undefined)).toBe(0.5);
    expect(densityOf(crowd({ attendance: 25_000 }), 50_000, 100_000)).toBe(0.25);
    expect(densityOf(crowd({ attendance: 25_000, capacity: 40_000 }), 50_000, 100_000)).toBe(0.625);
    expect(densityOf(crowd({ attendance: 90_000, capacity: 40_000 }), 50_000, undefined)).toBe(1);
  });
});

describe("the crowd", () => {
  const svg = drawKyogijo(soccer);

  it("is the same text every time, and a seed makes another crowd", () => {
    expect(drawKyogijo(soccer)).toBe(svg);
    const other = drawKyogijo({ ...soccer, crowd: { seed: 2 } });
    expect(other).not.toBe(svg);
    expect(drawKyogijo({ ...soccer, crowd: { seed: 2 } })).toBe(other);
    expect(Array.from({ length: 3 }, generator(5))).toEqual(Array.from({ length: 3 }, generator(5)));
  });

  it("is a few tiles of a pattern and a few paths, however many seats there are", () => {
    expect(count(svg, /<pattern /g)).toBe(2);
    expect(count(svg, /<path /g) + count(svg, /<rect /g)).toBeLessThan(120);
    expect(sceneOf(soccer).items.length).toBeLessThan(80);
  });

  it("holds its size: the stands and the people add under 14 kB, a thumbnail's under 6", () => {
    const clean = drawKyogijo({ sport: "soccer", id: "cr" });
    const small = drawKyogijo({ ...soccer, width: 320 });
    expect(svg.length - clean.length).toBeLessThan(14_000);
    expect(small.length - clean.length).toBeLessThan(6_000);
    expect(count(small, /<pattern /g)).toBe(0);
    expect(small).toContain("ky-cr-blk");
    expect(drawKyogijo({ ...soccer, detail: "simple" })).not.toContain("<pattern");
    expect(drawKyogijo({ ...soccer, width: "479px" })).not.toContain("<pattern");
    expect(drawKyogijo({ ...soccer, width: 480 })).toContain("<pattern");
    expect(drawKyogijo({ ...soccer, width: "100%" })).toContain("<pattern");
    expect(drawKyogijo({ ...soccer, width: 200, crowd: { detail: "fine" } })).toContain("<pattern");
    expect(drawKyogijo({ ...soccer, crowd: { detail: "plain" } })).not.toContain("<pattern");
  });

  it("shows empty seats in the share the density leaves empty, and none when it is full", () => {
    const seats = (density: number): number => {
      const tile = /<pattern id="cr-cr-h"[^>]*>([\s\S]*?)<\/pattern>/.exec(drawKyogijo({ ...soccer, crowd: { density } }))?.[1] ?? "";
      const dots = /class="ky-cr-seat" d="([^"]*)"/.exec(tile)?.[1] ?? "";
      return count(dots, /M/g);
    };
    expect(seats(1)).toBe(0);
    expect(seats(0)).toBe(36);
    const half = seats(0.5);
    expect(half).toBeGreaterThan(8);
    expect(half).toBeLessThan(28);
    expect(seats(0.9)).toBeLessThan(half);
  });

  it("is in the home colour on most of the bowl, with the visitors in theirs at an end", () => {
    const teams = drawKyogijo({ sport: "soccer", id: "cr", crowd: true, leftColor: "#1d4f91", rightColor: "#b5452c" });
    // Soccer puts the home team on the left: home blue, visitors red.
    expect(teams).toContain("--ky-cr-home:#1d4f91");
    expect(teams).toContain("--ky-cr-away:#b5452c");
    const na = drawKyogijo({ sport: "nhl", id: "cr", crowd: true, leftColor: "#1d4f91", rightColor: "#b5452c" });
    expect(na).toContain("--ky-cr-home:#b5452c");
    expect(na).toContain("--ky-cr-away:#1d4f91");
    const score = drawKyogijo({ sport: "nfl", ...GAME, crowd: true });
    expect(score).toContain("--ky-cr-home:#b5452c");
    expect(score).toContain("--ky-cr-away:#1f5fa8");
    const own = drawKyogijo({ ...soccer, crowd: { home: "#111111", away: "#222222" } });
    expect(own).toContain("--ky-cr-home:#111111");
    expect(own).toContain("--ky-cr-away:#222222");
    expect(drawKyogijo({ ...soccer, crowd: { home: "red;fill:url(x)" } })).toContain("--ky-cr-home:var(--ky-left)");
    expect(count(svg, /fill="url\(#cr-cr-a\)"/g)).toBe(2);
    expect(count(svg, /fill="url\(#cr-cr-h\)"/g)).toBe(2);
    expect(drawKyogijo({ ...soccer, crowd: { awayEnd: "none" } })).not.toContain("cr-cr-a)");
  });

  it("can show a card display in the colours of a team: stripes or checks, for the home end, the visitors' or both", () => {
    const tifo = drawKyogijo({ ...soccer, crowd: { tifo: "both" } });
    expect(count(tifo, /class="ky-cr-tifo"/g)).toBe(2);
    expect(tifo).toContain('id="cr-cr-th"');
    expect(tifo).toContain('id="cr-cr-ta"');
    expect(drawKyogijo({ ...soccer, crowd: { tifo: true } })).not.toContain('id="cr-cr-ta"');
    expect(drawKyogijo({ ...soccer, crowd: { tifo: "away", tifoDesign: "checks" } })).toMatch(/<pattern id="cr-cr-ta"[^>]*><rect class="ky-cr-ta" width="3" height="3"\/>/);
    expect(svg).not.toContain("cr-cr-th");
    expect(drawKyogijo({ ...soccer, width: 300, crowd: { tifo: true } })).toContain('class="ky-cr-th"');
  });

  it("has the places left open: a tunnel, the camera platform, the benches and the media row", () => {
    for (const kind of ["tunnel", "camera", "bench", "media"]) expect(svg).toContain(`class="ky-cr-${kind}"`);
    const bare = drawKyogijo({ ...soccer, crowd: { gaps: false } });
    for (const kind of ["tunnel", "camera", "bench", "media"]) expect(bare).not.toContain(`class="ky-cr-${kind}"`);
  });
});

describe("the stands as data", () => {
  it("are rings of seats for every sport, further from the surface and higher with each tier, with a rake, a reach and seats", () => {
    for (const sport of SPORTS) {
      const stands = crowdStands({ sport, crowd: true });
      expect(stands, sport).toBeDefined();
      expect(stands?.rings.length, sport).toBeGreaterThanOrEqual(sport === "curling" || sport === "pickleball" || sport === "dojo" ? 1 : 2);
      let last = -1;
      for (const ring of stands?.rings ?? []) {
        expect(ring.to, `${sport} ${ring.id}`).toBeGreaterThan(ring.from);
        expect(ring.height[1], `${sport} ${ring.id}`).toBeGreaterThan(ring.height[0]);
        expect(ring.rake, `${sport} ${ring.id}`).toBeGreaterThan(sport === "dojo" ? 1 : 5);
        expect(ring.rake, `${sport} ${ring.id}`).toBeLessThan(60);
        expect(ring.seats, `${sport} ${ring.id}`).toBeGreaterThan(100);
        if (sport !== "mlb") {
          expect(ring.from, `${sport} ${ring.id}`).toBeGreaterThanOrEqual(last);
          last = ring.to;
        }
      }
      // A dojo's gallery is a thin band close to its walls (a few metres), the other stands are tens of feet.
      expect(Math.max(...Object.values(stands?.reach ?? {})), sport).toBeGreaterThan(sport === "dojo" ? 5 : 40);
      expect(stands?.seats, sport).toBe(stands?.rings.reduce((n, r) => n + r.seats, 0));
    }
    expect(crowdStands({ sport: "soccer" })).toBeUndefined();
    expect(crowdStands({ sport: "nba", crowd: true, host: { field: "nfl" } })).toBeUndefined();
  });

  it("are laid round the surface's own box, with the side the benches are on given more ground", () => {
    const stands = crowdStands({ sport: "soccer", crowd: true });
    const lower = stands?.rings[0];
    if (lower?.hole?.kind !== "rrect" || stands === undefined) throw new Error("a bowl is a rounded rectangle");
    const { box } = stands;
    expect(box.w).toBeCloseTo(105 / 0.3048, 0);
    // The run-off: about 8.5 metres behind the goal lines and 6 along the touchlines, with the bench side's 8 feet more.
    expect(box.x - lower.hole.x0).toBeCloseTo(8.5 / 0.3048, 1);
    expect(lower.hole.x1 - (box.x + box.w)).toBeCloseTo(8.5 / 0.3048, 1);
    expect(box.y - lower.hole.y0).toBeCloseTo(6 / 0.3048, 1);
    expect(lower.hole.y1 - (box.y + box.h)).toBeCloseTo(6 / 0.3048 + 8, 1);
    // The points of an outline are for a view that raises the stands.
    const points = outlinePoints(lower.region);
    expect(points.length).toBeGreaterThan(40);
    expect(Math.min(...points.map(([x]) => x))).toBeCloseTo(box.x - 8.5 / 0.3048 - 75, 1);
    expect(outlinePath(lower.region)).toMatch(/^M[\d. -]+H[\d. -]+A/);
    expect(outlinePath(lower.region, true)).toMatch(/A[\d. ]+ 0 0 0 /);
  });

  it("are a bowl, two sides, a horseshoe open at an end, or an oval round an oval ground", () => {
    expect(crowdStands({ sport: "soccer", crowd: true })?.covers).toEqual([]);
    const sides = crowdStands({ sport: "soccer", crowd: { shape: "sides" } });
    expect(sides?.shape).toBe("sides");
    expect(sides?.covers.length).toBe(2);
    const right = crowdStands({ sport: "soccer", crowd: { shape: "horseshoe" } });
    const left = crowdStands({ sport: "soccer", crowd: { shape: "horseshoe", open: "left" } });
    expect(right?.covers.length).toBe(1);
    expect(right?.covers[0][0]).toBeGreaterThan((right?.box.x ?? 0) + (right?.box.w ?? 0) - 40);
    expect(left?.covers[0][2]).toBeLessThan((left?.box.x ?? 0) + 40);
    expect(crowdStands({ sport: "curling", crowd: true })?.shape).toBe("sides");
    expect(crowdStands({ sport: "afl", crowd: true })?.rings[0].region.kind).toBe("ellipse");
    expect(crowdStands({ sport: "cricket", crowd: true })?.rings[0].region.kind).toBe("ellipse");
    // A horseshoe's open end is not drawn over: the cover is the ground's own class.
    const open = drawKyogijo({ sport: "soccer", id: "cr", crowd: { shape: "horseshoe" } });
    expect(open).toMatch(/<rect class="ky-apron" x="[\d.]+" y="-?[\d.]+" width="[\d.]+" height="[\d.]+"\/><rect class="ky-cr-tunnel"/);
  });

  it("have the arena's courtside rows for a court, and a lower and an upper tier for a rink", () => {
    expect(crowdStands({ sport: "nba", crowd: true })?.rings.map((r) => r.id)).toEqual(["courtside", "lower", "upper"]);
    expect(crowdStands({ sport: "nhl", crowd: true })?.rings.map((r) => r.id)).toEqual(["lower", "upper"]);
    expect(crowdStands({ sport: "handball", crowd: true })?.rings.map((r) => r.id)).toEqual(["courtside", "lower", "upper"]);
  });

  it("put the visitors at the end of the side the home team is not on, or where `awayEnd` says", () => {
    const x = (o: SurfaceOptions): number => {
      const s = crowdStands(o);
      const away = s?.sectors.find((k) => k.kind === "away");
      return (away?.points.reduce((n, [px]) => n + px, 0) ?? 0) / (away?.points.length ?? 1) - ((s?.box.x ?? 0) + (s?.box.w ?? 0) / 2);
    };
    expect(x({ sport: "soccer", crowd: true })).toBeGreaterThan(100);
    expect(x({ sport: "soccer", crowd: true, homeSide: "right" } as SurfaceOptions)).toBeLessThan(-100);
    expect(x({ sport: "soccer", crowd: { awayEnd: "left" } })).toBeLessThan(-100);
    expect(x({ sport: "nfl", crowd: true })).toBeLessThan(-100);
    expect(crowdStands({ sport: "soccer", crowd: { awayEnd: "none" } })?.sectors).toEqual([]);
    // In an arena a block in a corner.
    const arena = crowdStands({ sport: "nhl", crowd: true });
    const corner = arena?.sectors.find((k) => k.kind === "away");
    const ys = corner?.points.map(([, y]) => y) ?? [];
    expect(Math.max(...ys)).toBeLessThan((arena?.box.y ?? 0) + (arena?.box.h ?? 0) / 2);
  });
});

describe("rows, aisles and sections", () => {
  const stands = crowdStands({ sport: "soccer", crowd: true });

  it("have aisles across every tier, from its inner edge to its outer, and the sections of visitors begin and end on them", () => {
    for (const ring of stands?.rings ?? []) {
      expect(ring.aisles.length, ring.id).toBeGreaterThan(20);
      for (const [a, b] of ring.aisles) expect(Math.hypot(b[0] - a[0], b[1] - a[1]), ring.id).toBeGreaterThan((ring.to - ring.from) * 0.95);
    }
    const lower = stands?.rings[0];
    const away = stands?.sectors.find((k) => k.kind === "away" && k.ring === "lower");
    const near = (p: [number, number]): boolean => (lower?.aisles ?? []).some(([a, b]) => Math.hypot(a[0] - p[0], a[1] - p[1]) < 0.01 || Math.hypot(b[0] - p[0], b[1] - p[1]) < 0.01);
    // A section is a block cut on the aisles: each of its corners is the end of an aisle, and on the end it is a rectangle, not a wedge.
    const corners = (away?.points ?? []).filter((p, i, all) => i === 0 || i === all.length - 1 || near(p));
    expect(corners.length).toBeGreaterThanOrEqual(4);
    for (const p of [away?.points[0], away?.points[away.points.length / 2 - 1]]) expect(near(p as [number, number])).toBe(true);
    const xs = (away?.points ?? []).map(([x]) => x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(75, 1);
  });

  it("have row lines that follow the bowl's curve, and the walks between the tiers are a thin band", () => {
    const out = drawKyogijo(soccer);
    const rowPath = /class="ky-cr-row" d="([^"]*)"/.exec(out)?.[1] ?? "";
    expect(count(rowPath, /M/g)).toBeGreaterThan(10);
    expect(rowPath).toContain("a");
    expect(stands?.concourses.length).toBe(1);
    const lower = stands?.rings[0];
    const upper = stands?.rings[1];
    expect((upper?.from ?? 0) - (lower?.to ?? 0)).toBeLessThanOrEqual(8);
    expect(out).toContain('class="ky-cr-conc"');
    expect(drawKyogijo({ ...soccer, width: 300 })).not.toContain('class="ky-cr-row"');
  });

  it("have a roof's shade on the upper tier that can be turned off", () => {
    const shade = (markup: string): number => count(markup, /stroke-opacity="0\.16"/g);
    expect(shade(drawKyogijo(soccer))).toBe(1);
    expect(shade(drawKyogijo({ ...soccer, crowd: { roof: false } }))).toBe(0);
  });
});

describe("a soccer pitch in a gridiron stadium", () => {
  it("is chosen for the grounds of the NFL's and the CFL's clubs, and by `stadium`", () => {
    for (const id of Object.keys(GRIDIRON_GROUNDS)) expect(GROUNDS[id], id).toBeDefined();
    expect(crowdStands({ sport: "soccer", ground: "metlife-stadium", crowd: true })?.stadium).toBe("nfl");
    expect(crowdStands({ sport: "soccer", ground: "bc-place", crowd: true })?.stadium).toBe("cfl");
    expect(crowdStands({ sport: "soccer", ground: "wembley", crowd: true })?.stadium).toBe("purpose");
    expect(crowdStands({ sport: "soccer", ground: "metlife-stadium", crowd: { stadium: "purpose" } })?.stadium).toBe("purpose");
    expect(crowdStands({ sport: "soccer", crowd: { stadium: "nfl" } })?.stadium).toBe("nfl");
    expect(crowdStands({ sport: "nba", crowd: true })?.stadium).toBeUndefined();
  });

  it("keeps the football field's footprint, centred under the pitch, and the stands where a gridiron's are", () => {
    const stands = crowdStands({ sport: "soccer", ground: "metlife-stadium", crowd: true });
    const field = stands?.footprint?.field;
    const box = stands?.box;
    if (field === undefined || box === undefined) throw new Error("a gridiron has a footprint");
    // The NFL's 120 yards by 160 feet, with its two end zones, centred on the pitch.
    expect(field.w).toBe(FOOTBALL.nfl.length + 2 * FOOTBALL.nfl.endZone);
    expect(field.h).toBe(FOOTBALL.nfl.width);
    expect(field.x + field.w / 2).toBeCloseTo(box.x + box.w / 2, 6);
    expect(field.y + field.h / 2).toBeCloseTo(box.y + box.h / 2, 6);
    expect(stands?.footprint?.endZones.map((z) => z.w)).toEqual([30, 30]);
    // The pitch is wider than the field (68 m against 160 feet), so its touchlines are close to the stands, and its ends a little farther.
    expect(box.h).toBeGreaterThan(field.h);
    const first = stands?.rings[0];
    if (first?.hole?.kind !== "rrect") throw new Error("a bowl");
    const side = box.y - first.hole.y0;
    const end = box.x - first.hole.x0;
    expect(side).toBeCloseTo(40 + (160 - box.h) / 2, 6);
    expect(end).toBeCloseTo(26 + (360 - box.w) / 2, 6);
    expect(side).toBeLessThan(6 / 0.3048 - 10);
    expect(end).toBeGreaterThan(8.5 / 0.3048 + 5);
    // A purpose-built ground has its own run-off, and no footprint.
    expect(crowdStands({ sport: "soccer", ground: "wembley", crowd: true })?.footprint).toBeUndefined();
  });

  it("draws the field over the pitch, faintly: its end zones, five-yard lines and outline", () => {
    const out = drawKyogijo({ sport: "soccer", id: "cr", ground: "metlife-stadium", crowd: true });
    expect(count(out, /class="ky-cr-ez"/g)).toBe(2);
    expect(out).toContain('class="ky-cr-yard"');
    expect(out.indexOf("ky-cr-footprint")).toBeGreaterThan(out.indexOf('class="ky-surface'));
    expect(drawKyogijo({ sport: "soccer", id: "cr", ground: "wembley", crowd: true })).not.toContain("ky-cr-footprint");
  });

  it("takes the ground's capacity for an attendance", () => {
    const full = drawKyogijo({ sport: "soccer", id: "cr", ground: "metlife-stadium", crowd: { attendance: 82_500 } });
    const half = drawKyogijo({ sport: "soccer", id: "cr", ground: "metlife-stadium", crowd: { attendance: 41_250 } });
    expect(full).not.toBe(half);
    expect(full).not.toContain('class="ky-cr-seat"');
    expect(half).toContain('class="ky-cr-seat"');
  });
});

describe("a ballpark", () => {
  const park = "fenway-park";
  const stands = crowdStands({ sport: "mlb", park, crowd: true });

  it("has grandstands along the foul lines and round behind home plate, and bleachers behind the outfield", () => {
    expect(stands?.rings.map((r) => r.id)).toEqual(["lower", "upper", "bleachers", "wall-seats"]);
    expect(stands?.shape).toBe("horseshoe");
    expect(crowdStands({ sport: "mlb", park, crowd: { shape: "grandstand" } })?.rings.map((r) => r.id)).toEqual(["lower", "upper"]);
    expect(crowdStands({ sport: "mlb", park, crowd: { shape: "bowl" } })?.rings.find((r) => r.id === "bleachers")?.more).toBeUndefined();
    expect(stands?.rings[2].more?.length).toBe(1);
  });

  it("sits behind the park's own wall: every seat of the bleachers is farther from home plate than the fence at its bearing", () => {
    const points = fenceFor(parkById(park), undefined, undefined);
    const bleachers = stands?.rings.find((r) => r.id === "bleachers");
    const pieces = [bleachers?.region, ...(bleachers?.more ?? [])].flatMap((o) => (o?.kind === "poly" ? o.points : []));
    expect(pieces.length).toBeGreaterThan(30);
    for (const [x, y] of pieces) {
      // The drawing's y is minus the distance out, so the bearing from the line up the middle is atan(x / -y).
      const bearing = (Math.atan2(x, -y) * 180) / Math.PI;
      if (Math.abs(bearing) <= 45) expect(Math.hypot(x, y), `${x.toFixed(0)} ${y.toFixed(0)}`).toBeGreaterThan(fenceAt(points, bearing) + 10);
    }
  });

  it("follows another park's fence: Fenway's short left field against the Polo Grounds'", () => {
    const left = (id: string): number => {
      const s = crowdStands({ sport: "mlb", park: id, crowd: true });
      const b = s?.rings.find((r) => r.id === "bleachers");
      return Math.min(...[b?.region, ...(b?.more ?? [])].flatMap((o) => (o?.kind === "poly" ? o.points.map(([x]) => x) : [])));
    };
    expect(left("fenway-park")).not.toBeCloseTo(left("polo-grounds"), 0);
    expect(drawKyogijo({ sport: "mlb", id: "cr", park, crowd: true })).not.toBe(drawKyogijo({ sport: "mlb", id: "cr", park: "polo-grounds", crowd: true }));
  });

  it("leaves a gap at the batter's eye in a horseshoe, and none in a bowl", () => {
    const eye = (shape: "horseshoe" | "bowl"): number => {
      const s = crowdStands({ sport: "mlb", park, crowd: { shape } });
      const b = s?.rings.find((r) => r.id === "bleachers");
      return [b?.region, ...(b?.more ?? [])].filter((o) => o?.kind === "poly").length;
    };
    expect(eye("horseshoe")).toBe(2);
    expect(eye("bowl")).toBe(1);
  });

  it("draws, wide and tall, with a score, on its own plaza, and its seats count", () => {
    const wide = drawKyogijo({ sport: "mlb", id: "cr", park, crowd: true });
    expect(wide).toContain('class="ky-cr-plaza"');
    expect(drawKyogijo({ sport: "mlb", ...GAME, orientation: "portrait", crowd: true })).toContain("ky-cr-people");
    expect(stands?.seats).toBeGreaterThan(25_000);
    expect(stands?.seats).toBeLessThan(60_000);
  });
});

describe("a ballpark's walls", () => {
  const ring = (o: SurfaceOptions, id: string) => crowdStands(o)?.rings.find((r) => r.id === id);

  it("have seats on top of the Green Monster, at the wall's height, where the park's data has the wall, and no other park has them", () => {
    const seats = ring({ sport: "mlb", park: "fenway-park", crowd: true }, "wall-seats");
    expect(seats?.height[0]).toBeCloseTo(37.167, 2);
    expect(seats?.tier).toBe("wall");
    expect(ring({ sport: "mlb", park: "fenway-park", crowd: { wallSeats: false } }, "wall-seats")).toBeUndefined();
    expect(ring({ sport: "mlb", park: "wrigley-field", crowd: true }, "wall-seats")).toBeUndefined();
    // Asked for, every wall of 25 feet or more has them, in the seasons the park had it.
    expect(ring({ sport: "mlb", park: "fenway-park", crowd: { wallSeats: true } }, "wall-seats")).toBeDefined();
    expect(ring({ sport: "mlb", park: "fenway-park", year: 1920, crowd: { wallSeats: true } }, "wall-seats")?.height[0]).toBeCloseTo(25, 1);
  });

  it("have the bleachers close behind the fence, 12 feet back, and the grandstand's edge smooth, with no corner sharper than 35 degrees", () => {
    const points = fenceFor(parkById("fenway-park"), undefined, undefined);
    const bleachers = ring({ sport: "mlb", park: "fenway-park", crowd: true }, "bleachers");
    const first = bleachers?.region.kind === "poly" ? bleachers.region.points : [];
    const near = first.slice(0, first.length / 2);
    const gaps = near.map(([x, y]) => Math.hypot(x, y) - fenceAt(points, (Math.atan2(x, -y) * 180) / Math.PI));
    for (const g of gaps) expect(g).toBeCloseTo(12, 0);
    const lower = ring({ sport: "mlb", park: "fenway-park", crowd: true }, "lower");
    const edge = lower?.region.kind === "poly" ? lower.region.points.slice(0, lower.region.points.length / 2) : [];
    let sharpest = 0;
    for (let i = 1; i < edge.length - 1; i += 1) {
      const a = Math.atan2(edge[i][1] - edge[i - 1][1], edge[i][0] - edge[i - 1][0]);
      const b = Math.atan2(edge[i + 1][1] - edge[i][1], edge[i + 1][0] - edge[i][0]);
      sharpest = Math.max(sharpest, Math.abs(((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI));
    }
    expect((sharpest * 180) / Math.PI).toBeLessThan(35);
  });
});

describe("every sport", () => {
  for (const sport of SPORTS) {
    it(`${sport}: draws with a crowd, wide and tall, light and dark, as a score and as a thumbnail, and the stands are in the picture`, () => {
      const variants: Partial<SurfaceOptions>[] = [{}, { orientation: "portrait" }, { theme: "dark" }, { ...GAME } as Partial<SurfaceOptions>, { width: 300 }, { crowd: { shape: "sides" } }, { crowd: { shape: "horseshoe", open: "left", tifo: "both" } }];
      for (const extra of variants) {
        const out = drawKyogijo({ sport, id: "ev", crowd: true, ...extra });
        expect(() => parseXml(out)).not.toThrow();
        expect(out).toContain('class="ky-crowd"');
        // The view holds the stands: the viewBox is wider than the clean drawing's.
        const box = (markup: string): number[] => (/viewBox="([^"]*)"/.exec(markup)?.[1] ?? "").split(" ").map(Number);
        const bare = box(drawKyogijo({ sport, id: "ev", ...extra, crowd: undefined }));
        const crowded = box(out);
        expect(crowded[2] * crowded[3], `${sport} ${JSON.stringify(extra)}`).toBeGreaterThan(bare[2] * bare[3] * (sport === "dojo" ? 1.05 : 1.3));
      }
    });
  }

  it("is held to its own margin when the caller gives one", () => {
    const out = drawKyogijo({ sport: "nhl", id: "ev", crowd: true, margin: 4 });
    expect(/viewBox="([^"]*)"/.exec(out)?.[1]).toBe("-4 -4 208 93");
  });
});

describe("with the rest of the drawing", () => {
  it("is under the surface and over the ground, and the data layers and a score's panels are over it", () => {
    const out = drawKyogijo({ sport: "nba", ...GAME, crowd: true, layers: [{ kind: "points", data: [{ x: 20, y: 25 }] }] } as SurfaceOptions);
    const at = (needle: string): number => out.indexOf(needle);
    expect(at('class="ky-apron"')).toBeLessThan(at('class="ky-crowd"'));
    expect(at('class="ky-crowd"')).toBeLessThan(at('<rect class="ky-surface"'));
    expect(at('class="ky-crowd"')).toBeLessThan(at('<g class="ky-banner'));
    expect(at('class="ky-crowd"')).toBeLessThan(at('<g class="ky-layers"'));
  });

  it("is crowned by a range: the crop shows the stands it covers and no others", () => {
    const whole = drawKyogijo({ sport: "nhl", id: "rg", crowd: true });
    const zone = drawKyogijo({ sport: "nhl", id: "rg", crowd: true, range: "offensive-zone" });
    expect(zone).toContain('class="ky-crowd"');
    const width = (markup: string): number => Number((/viewBox="[^ ]+ [^ ]+ ([^ ]+)/.exec(markup) ?? [])[1]);
    expect(width(zone)).toBeLessThan(width(whole));
  });

  it("is left out of a special game, which is a surface set inside another", () => {
    const hosted = drawKyogijo({ sport: "nba", id: "hs", crowd: true, host: { field: "nfl" } });
    expect(hosted).toBe(drawKyogijo({ sport: "nba", id: "hs", host: { field: "nfl" } }));
  });

  it("keeps the ids of two drawings apart, and the rules for a page that supplies its own stylesheet", () => {
    const ids = (markup: string): string[] => [...markup.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    const a = ids(drawKyogijo({ ...soccer, id: "one" }));
    const b = ids(drawKyogijo({ ...soccer, id: "two" }));
    expect(a.filter((id) => b.includes(id))).toEqual([]);
    expect(KYOGIJO_STYLE).toContain(".ky-cr-bed{");
    expect(drawKyogijo({ ...soccer, style: "none" })).not.toContain("<style");
    expect(drawKyogijo(soccer)).toContain("--ky-cr-dim:.82");
  });

  it("is dimmed in the dark, by one opacity on the crowd's group", () => {
    const light = sceneOf({ ...soccer, theme: "light" });
    const dark = sceneOf({ ...soccer, theme: "dark" });
    const people = (s: ReturnType<typeof sceneOf>): number => s.items.find((i) => i.class === "ky-cr-people")?.style.opacity ?? -1;
    expect(people(light)).toBe(1);
    expect(people(dark)).toBeCloseTo(0.82, 6);
  });
});

describe("layout helpers", () => {
  it("find where a ray meets a rounded rectangle, an ellipse and its corner", () => {
    const rect = { kind: "rrect" as const, x0: 0, y0: 0, x1: 200, y1: 100, r: 30 };
    expect(rayAt(rect, 100, 50, 0)).toEqual([200, 50]);
    const [cx, cy] = rayAt(rect, 100, 50, Math.atan2(50, 100));
    // Into the corner's round: on the corner circle, inside the square's corner.
    expect(Math.hypot(cx - 170, cy - 70)).toBeCloseTo(30, 5);
    const oval = rayAt({ kind: "ellipse", cx: 0, cy: 0, rx: 10, ry: 4 }, 0, 0, Math.PI / 2);
    expect(oval[1]).toBeCloseTo(4, 6);
    expect(layoutOf({ sport: "soccer", box: { x: 0, y: 0, w: 100, h: 60 }, crowd: resolveCrowd(true) ?? ({} as never), awaySide: "right" }).rings.length).toBe(2);
  });
});

describe("every renderer", () => {
  it("reads in the scene: the patterns, with every paint resolved, and the markup written back as it was", () => {
    const out = drawKyogijo(soccer);
    expect(writeSvg(parseSvg(out))).toBe(out);
    const scene = sceneOf({ ...soccer, crowd: { tifo: "both" } });
    expect(scene.patterns.map((p) => p.id)).toEqual(["cr-cr-h", "cr-cr-a", "cr-cr-th", "cr-cr-ta"]);
    for (const p of scene.patterns) expect(p.width).toBeGreaterThan(5);
    const paints = scene.items.flatMap((i) => [i.style.fill]).filter((p) => typeof p === "object");
    expect(paints.length).toBeGreaterThanOrEqual(6);
    for (const paint of paints) expect("pattern" in paint && scene.patterns.some((p) => p.id === paint.pattern)).toBe(true);
  });

  it("makes an SVG that needs no stylesheet, for d3, Plot and PNG, with the colours worked out", () => {
    const flat = sceneToSvg({ ...soccer, leftColor: "#1d4f91", rightColor: "#b5452c" }, { width: 800 });
    expect(flat).not.toContain("var(");
    expect(flat).not.toContain("<style");
    expect(flat).toContain("#1d4f91");
    expect(count(flat, /<pattern /g)).toBe(2);
  });

  it("is painted by the canvas: tiles of people, in well under a second, and a gradient-free drawing", () => {
    const calls: Record<string, number> = {};
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (t, name: string) => (name in t ? t[name] : (...args: unknown[]) => void (args.length >= 0 && (calls[name] = (calls[name] ?? 0) + 1))),
      set: (t, name: string, v) => ((t[name] = v), true),
    }) as unknown as CanvasContext;
    const t0 = performance.now();
    const box = drawToCanvas(ctx, soccer, { width: 1200 });
    expect(performance.now() - t0).toBeLessThan(1500);
    expect(box.width).toBeGreaterThan(0);
    expect(calls.stroke).toBeGreaterThan(5000);
    expect(calls.fill).toBeGreaterThan(20);
  });

  it("is a PNG when resvg is installed, light and dark, large and small", async () => {
    const png = await toPNG(soccer, { width: 700 }).catch((error: Error) => error);
    if (png instanceof Error) {
      expect(png.message).toBe(PNG_PEER_MISSING);
      return;
    }
    expect([...png.slice(0, 4)]).toEqual([137, 80, 78, 71]);
    expect(Array.from(await toPNG({ ...soccer, theme: "dark" }, { width: 700 }))).not.toEqual(Array.from(png));
    expect(Array.from(await toPNG(soccer, { width: 700 }))).toEqual(Array.from(png));
    expect((await toPNG({ ...soccer, width: 300 }, { width: 300 })).length).toBeGreaterThan(500);
  });
});

describe("a crowd with the other looks", () => {
  it("draws a pageant over a crowd, on a pitch, a rink and a court, each with both", () => {
    for (const sport of ["soccer", "nhl", "nba", "squash", "swimming"] as const) {
      const svg = drawKyogijo({ sport, ...GAME, crowd: true, pageant: "carpet" });
      expect(svg, sport).toContain("ky-crowd");
      expect(svg, sport).toContain("data-pageant");
      expect(svg, sport).not.toMatch(/NaN|undefined/);
    }
  });

  it("draws no stands round a folded curling sheet, whose enlarged houses cover where they would be, and draws them for the same sheet with a score, which shows the whole sheet", () => {
    const folded = { sport: "curling", sheet: { show: "folded" } } as const;
    expect(drawKyogijo({ ...folded, crowd: true })).not.toContain("ky-crowd");
    expect(crowdStands({ ...folded, crowd: true })).toBeUndefined();
    const scored = drawKyogijo({ ...folded, ...GAME, crowd: true, pageant: "carpet" });
    expect(scored).toContain("ky-crowd");
    expect(scored).toContain("data-pageant");
    expect(crowdStands({ sport: "curling", crowd: true })).toBeDefined();
  });
});
