import { describe, expect, it } from "vitest";
import { seeded } from "../demo/layers-data.js";
import { RETROSHEET_ZONES, zoneAt } from "./frames.providers.ts";
import { ZONE_SETS, ZONE_SET_IDS, buildZoneSet, type ZoneContext, type ZoneSetId } from "./heat.zones.ts";
import { outlineOf } from "./outline.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { soccerSpec } from "./surfaces/soccer-spec.ts";
import type { Sport } from "./types.ts";

const sportOf = (id: ZoneSetId): Sport => ZONE_SETS[id].sports[0];
const contextFor = (sport: Sport, more: Partial<ZoneContext> = {}, o: Partial<ZoneContext["o"]> = {}): ZoneContext => {
  const options = { sport, ...o };
  return { o: options, outline: outlineOf(options), direction: "right", end: "both", los: undefined, bats: undefined, words: KYOGIJO_STRINGS.en.layers.zones, ...more };
};
const set = (id: ZoneSetId, more: Partial<ZoneContext> = {}, o: Partial<ZoneContext["o"]> = {}) => buildZoneSet(id, contextFor(sportOf(id), more, o));
const at = (s: ReturnType<typeof set>, x: number, y: number): string => s.zones[s.which(x, y)]?.id ?? "none";

const points = (id: ZoneSetId, n = 1500, more: Partial<ZoneContext> = {}) => {
  const { box, contains } = outlineOf({ sport: sportOf(id) });
  const random = seeded(77);
  const out: [number, number][] = [];
  while (out.length < n) {
    const p: [number, number] = [box.x + random() * box.w, box.y + random() * box.h];
    if (contains(p[0], p[1])) out.push(p);
  }
  void more;
  return out;
};

describe("every zone set", () => {
  it("is listed with its sports and its source, and the registry matches the ids", () => {
    expect(ZONE_SET_IDS).toHaveLength(17);
    for (const id of ZONE_SET_IDS) {
      expect(ZONE_SETS[id].sports.length).toBeGreaterThan(0);
      expect(ZONE_SETS[id].title).not.toBe("");
      expect(ZONE_SETS[id].source).toMatch(/^(https:\/\/|docs\/sources\.md)/);
    }
  });

  for (const id of ZONE_SET_IDS) {
    for (const sport of ZONE_SETS[id].sports) {
      it(`${id} on ${sport}: zones have ids, names and shapes, no two alike, and a point belongs to the zone that has it`, () => {
        const s = buildZoneSet(id, contextFor(sport, { los: 150 }));
        expect(s.zones.length).toBeGreaterThan(1);
        expect(new Set(s.zones.map((z) => z.id)).size).toBe(s.zones.length);
        expect(new Set(s.zones.map((z) => z.name)).size).toBe(s.zones.length);
        for (const z of s.zones) {
          expect(z.id).toMatch(/^[a-z0-9-]+$/);
          expect(z.name).not.toBe("");
          expect(z.d).toMatch(/^M[\d. -]+/);
          expect(z.d).not.toMatch(/NaN|undefined|Infinity/);
          expect(z.label.every(Number.isFinite)).toBe(true);
        }
        for (const [x, y] of points(id).slice(0, 400)) {
          const i = s.which(x, y);
          if (i >= 0 && id !== "baseball-retrosheet") expect(s.zones[i].has(x, y), `${id} ${x},${y}`).toBe(true);
        }
      });
    }
  }

  it("the zones of a set do not overlap, and the sets that cover the surface leave nothing out", () => {
    for (const id of ZONE_SET_IDS) {
      if (id === "baseball-retrosheet") continue;
      const s = set(id, { los: 150 });
      const covering = id.startsWith("soccer") || id === "football-pass" || id === "nba-shot";
      for (const [x, y] of points(id, 600)) {
        const inside = s.zones.filter((z) => z.has(x, y)).length;
        expect(inside, `${id} ${x},${y}`).toBeLessThanOrEqual(1);
        if (covering) expect(inside, `${id} ${x},${y}`).toBe(1);
      }
    }
  });

  it("refuses a set for another sport, and one that does not exist", () => {
    expect(() => buildZoneSet("nba-shot", contextFor("nhl"))).toThrow(/is for nba, not nhl/);
    expect(() => buildZoneSet("nope" as never, contextFor("nhl"))).toThrow(/Unknown zone set "nope"/);
  });
});

describe("soccer zones", () => {
  it("positional zones are five lanes by six bands, with the wings the width of the penalty area, the half-spaces the goal area and the centre the goal area's", () => {
    const s = set("soccer-positional");
    expect(s.zones).toHaveLength(30);
    const spec = soccerSpec(undefined, "m");
    const { box } = outlineOf({ sport: "soccer" });
    const k = 3.280839895;
    const lanes = [0, 1, 2, 3, 4].map((l) => s.zones.find((z) => z.id === `lane-${l + 1}-band-1`) as (typeof s.zones)[number]);
    const height = (z: (typeof s.zones)[number]): number => z.room![1];
    expect(height(lanes[2])).toBeCloseTo(spec.goalAreaWidth * k, 6);
    expect(height(lanes[0])).toBeCloseTo((box.h - spec.penaltyWidth * k) / 2, 6);
    expect(height(lanes[1])).toBeCloseTo((spec.penaltyWidth - spec.goalAreaWidth) * k / 2, 6);
    expect(lanes.reduce((a, z) => a + height(z), 0)).toBeCloseTo(box.h, 6);
    // The first band is the penalty area's depth, and the middle two bands are half the rest each side of the halfway line.
    const widths = [1, 2, 3, 4, 5, 6].map((b) => (s.zones.find((z) => z.id === `lane-3-band-${b}`) as (typeof s.zones)[number]).room![0]);
    expect(widths[0]).toBeCloseTo(spec.penaltyDepth * k, 6);
    expect(widths[5]).toBeCloseTo(spec.penaltyDepth * k, 6);
    expect(widths.reduce((a, b) => a + b, 0)).toBeCloseTo(box.w, 6);
    expect(widths[2]).toBeCloseTo(widths[3], 6);
  });

  it("names the sides for the way the team attacks, and counts bands from its own end", () => {
    const right = set("soccer-positional", { direction: "right" });
    const left = set("soccer-positional", { direction: "left" });
    const { box } = outlineOf({ sport: "soccer" });
    // Attacking right, the top of the drawing is the team's left and band 1 is at the left end.
    expect(right.zones[right.which(5, 3)].name).toBe("Left wing, band 1");
    expect(right.zones[right.which(box.w - 5, box.h - 3)].name).toBe("Right wing, band 6");
    expect(left.zones[left.which(box.w - 5, 3)].name).toBe("Right wing, band 1");
    expect(left.zones[left.which(5, box.h - 3)].name).toBe("Left wing, band 6");
  });

  it("thirds, channels and the 18 zones", () => {
    const { box } = outlineOf({ sport: "soccer" });
    const thirds = set("soccer-thirds");
    expect(thirds.zones.map((z) => z.name)).toEqual(["Defensive third", "Middle third", "Attacking third"]);
    expect(thirds.zones[thirds.which(box.w * 0.9, 10)].name).toBe("Attacking third");
    expect(set("soccer-thirds", { direction: "left" }).zones[0].name).toBe("Attacking third");
    expect(set("soccer-channels").zones.map((z) => z.name)).toEqual(["Left wing", "Left half-space", "Centre", "Right half-space", "Right wing"]);
    const eighteen = set("soccer-18");
    expect(eighteen.zones).toHaveLength(18);
    expect(eighteen.zones[0].name).toBe("Zone 1");
    expect(eighteen.zones[eighteen.which(2, 2)].id).toBe("zone-1");
    expect(eighteen.zones[eighteen.which(box.w - 2, box.h - 2)].id).toBe("zone-18");
    // Each is a sixth of the length by a third of the width.
    expect(eighteen.zones[7].room![0]).toBeCloseTo(box.w / 6, 6);
    expect(eighteen.zones[7].room![1]).toBeCloseTo(box.h / 3, 6);
  });

  it("follows the pitch that is drawn: a small-sided pitch and a futsal court have their own areas", () => {
    for (const pitch of ["5-a-side", "futsal", "9-a-side"] as const) {
      const s = set("soccer-positional", {}, { pitch });
      const { box } = outlineOf({ sport: "soccer", pitch });
      expect(s.zones).toHaveLength(30);
      expect(s.zones.reduce((a, z) => a + z.room![0] * z.room![1], 0)).toBeCloseTo(box.w * box.h, 4);
    }
  });
});

describe("the NBA's shot zones", () => {
  const hoop = 5.25;
  const mid = 25;
  const right = set("nba-shot", { end: "right" });
  const left = set("nba-shot", { end: "left" });
  const both = set("nba-shot");

  it("has the six zones of the NBA's own shot chart at an end, and twelve at both", () => {
    expect(left.zones.map((z) => z.id)).toEqual(["above-the-break", "corner-top", "corner-bottom", "mid-range", "paint", "restricted-area"]);
    expect(left.zones.map((z) => z.name)).toEqual(["Above the break 3", "Right corner 3", "Left corner 3", "Mid-range", "In the paint (non-RA)", "Restricted area"]);
    expect(both.zones).toHaveLength(12);
    expect(both.zones[0].name).toBe("Above the break 3 (left end)");
  });

  it("puts a shot where the court's lines put it", () => {
    expect(at(left, hoop, mid)).toBe("restricted-area");
    expect(at(left, hoop + 3.9, mid)).toBe("restricted-area");
    expect(at(left, hoop + 4.1, mid)).toBe("paint");
    expect(at(left, 18.9, mid + 7)).toBe("paint");
    expect(at(left, 19.1, mid)).toBe("mid-range");
    expect(at(left, 12, 8)).toBe("mid-range");
    expect(at(left, 3, 1)).toBe("corner-top");
    expect(at(left, 3, 49)).toBe("corner-bottom");
    expect(at(left, 3, 4)).toBe("mid-range");
    // The arc: 23.75 feet from the hoop's centre, in line with it.
    expect(at(left, hoop + 23.7, mid)).toBe("mid-range");
    expect(at(left, hoop + 23.8, mid)).toBe("above-the-break");
    expect(at(left, 40, 10)).toBe("above-the-break");
    // The corner ends where the arc meets the straight line, 14.2 feet from the baseline.
    expect(at(left, 13.9, 1)).toBe("corner-top");
    expect(at(left, 14.6, 1)).toBe("above-the-break");
  });

  it("names the corners as the shooter sees them, facing the basket (LOC_X of stats.nba.com is negative at his left)", () => {
    // At the right basket the top of the drawing is the shooter's left; at the left basket it is his right.
    expect(left.zones[left.which(3, 1)].name).toBe("Right corner 3");
    expect(left.zones[left.which(3, 49)].name).toBe("Left corner 3");
    expect(right.zones[right.which(94 - 3, 1)].name).toBe("Left corner 3");
    expect(right.zones[right.which(94 - 3, 49)].name).toBe("Right corner 3");
  });

  it("mirrors the court: a shot at the right end is where the same shot is at the left", () => {
    const random = seeded(4);
    for (let i = 0; i < 300; i += 1) {
      const x = random() * 47;
      const y = random() * 50;
      expect(at(right, 94 - x, y).replace("-top", "").replace("-bottom", "")).toBe(at(left, x, y).replace("-top", "").replace("-bottom", ""));
      expect(at(both, 94 - x, y)).toBe(`${at(left, x, y)}-right`);
      expect(at(both, x, y)).toBe(`${at(left, x, y)}-left`);
    }
    expect(at(left, 60, 25)).toBe("none");
  });

  it("the zones' areas add up to the half court, each with a hole where another zone lies in it", () => {
    for (const z of left.zones) expect(z.d).toMatch(/^M/);
    // The widest zone holds the others as holes: its path has the half court and the three shapes inside.
    expect((left.zones[0].d.match(/M/g) ?? []).length).toBe(4);
  });
});

describe("the NHL's zones", () => {
  const rink = (id: ZoneSetId, end: "left" | "right" | "both" = "left") => set(id, { end });
  it("the slot is two parts between the circles, from the goal line to the top of the circles, with the rest of the offensive zone and what lies behind the goal line", () => {
    const s = rink("nhl-slot");
    expect(s.zones.map((z) => z.id)).toEqual(["offensive-zone", "behind-goal-line", "outer-slot", "inner-slot"]);
    expect(at(s, 20, 42.5)).toBe("inner-slot");
    expect(at(s, 11.5, 42.5 + 3.05)).toBe("inner-slot");
    // The inner slot widens from the posts (3 feet either side) to the circles' inner edges (7 feet).
    expect(at(s, 11.5, 42.5 + 3.6)).toBe("offensive-zone");
    expect(at(s, 30.9, 42.5 + 6.9)).toBe("inner-slot");
    expect(at(s, 31.1, 42.5 + 6.9)).toBe("outer-slot");
    expect(at(s, 45.9, 42.5)).toBe("outer-slot");
    expect(at(s, 46.5, 42.5)).toBe("offensive-zone");
    expect(at(s, 5, 42.5)).toBe("behind-goal-line");
    expect(at(s, 60, 10)).toBe("offensive-zone");
    expect(at(s, 90, 42.5)).toBe("none");
  });

  it("home plate runs from the goal line between the circles' inner edges, then in to a point at the top of the circles", () => {
    const s = rink("nhl-home-plate");
    expect(s.zones.map((z) => z.name)).toEqual(["Outside home plate", "Home plate"]);
    expect(at(s, 12, 42.5 + 6.5)).toBe("home-plate");
    expect(at(s, 30, 42.5 + 6.9)).toBe("home-plate");
    expect(at(s, 41, 42.5 + 6)).toBe("outside-home-plate");
    expect(at(s, 41, 42.5 + 2)).toBe("home-plate");
    expect(at(s, 45.5, 42.5)).toBe("home-plate");
    expect(at(s, 47, 42.5)).toBe("outside-home-plate");
  });

  it("both ends are the same zones, mirrored, with the end in the name", () => {
    const both = rink("nhl-slot", "both");
    const random = seeded(8);
    expect(both.zones).toHaveLength(8);
    expect(both.zones[0].name).toBe("Offensive zone (left end)");
    for (let i = 0; i < 300; i += 1) {
      const x = random() * 100;
      const y = random() * 85;
      const a = at(both, x, y);
      const b = at(both, 200 - x, 85 - y);
      expect(b.replace("-right", "-left"), `${x},${y}`).toBe(a.replace("-right", "-left"));
    }
  });
});

describe("the baseball field's zones", () => {
  it("cuts fair ground into thirds by angle and into infield and outfield by the arc 95 feet round the pitcher's plate", () => {
    const s = set("baseball-spray", { bats: "R" });
    expect(s.zones.map((z) => z.name)).toEqual(["Pull, infield", "Centre, infield", "Opposite, infield", "Pull, outfield", "Centre, outfield", "Opposite, outfield"]);
    // A right-handed batter pulls to left field, which is the left of the drawing (negative x).
    expect(at(s, -60, -100)).toBe("pull-infield");
    expect(at(s, 0, -150)).toBe("centre-infield");
    expect(at(s, 0, -160)).toBe("centre-outfield");
    expect(at(s, 60, -100)).toBe("opposite-infield");
    expect(at(s, -150, -250)).toBe("pull-outfield");
    // Foul ground and behind home plate are in no zone.
    expect(at(s, -100, -50)).toBe("none");
    expect(at(s, 0, 20)).toBe("none");
    const lefty = set("baseball-spray", { bats: "L" });
    expect(at(lefty, -150, -250)).toBe("opposite-outfield");
    expect(at(lefty, 150, -250)).toBe("pull-outfield");
    const plain = set("baseball-spray");
    expect(plain.zones[0].name).toBe("Left field, infield");
    expect(plain.zones[4].name).toBe("Centre field, outfield");
  });

  it("the infield's edge is the arc's own: the farthest point is 155.5 feet out, and it falls away to the sides", () => {
    const s = set("baseball-spray");
    expect(at(s, 0, -155)).toBe("centre-infield");
    expect(at(s, 0, -156)).toBe("centre-outfield");
    // At 30 degrees the edge is nearer.
    const edge = 60.5 * Math.cos(Math.PI / 6) + Math.sqrt((60.5 * Math.cos(Math.PI / 6)) ** 2 + 95 ** 2 - 60.5 ** 2);
    expect(edge).toBeLessThan(155.5);
    const x = (edge - 1) * Math.sin(Math.PI / 6);
    const y = -(edge - 1) * Math.cos(Math.PI / 6);
    expect(at(s, x, y)).toBe("right-infield");
  });

  it("Retrosheet's sectors are the nearest of the 68 centres, the same as zoneAt in the frames, and their cells tile the box", () => {
    const s = set("baseball-retrosheet");
    expect(s.zones).toHaveLength(Object.keys(RETROSHEET_ZONES).length);
    const random = seeded(12);
    for (let i = 0; i < 300; i += 1) {
      const x = (random() - 0.5) * 460;
      const y = -random() * 400;
      expect(s.zones[s.which(x, y)].name, `${x},${y}`).toBe(zoneAt([x, -y]));
    }
    expect(s.zones.find((z) => z.name === "8D")?.label).toEqual([0, -330]);
    for (const z of s.zones) expect(z.d).toMatch(/^M.*Z$/);
  });
});

describe("the football pass grid", () => {
  const hash = 70 + 9 / 12;
  it("is short and deep by left, middle and right, short being up to 15 yards past the line of scrimmage and a pass thrown behind it", () => {
    const s = set("football-pass", { los: 150 });
    expect(s.zones.map((z) => z.name)).toEqual(["Short, left", "Short, middle", "Short, right", "Deep, left", "Deep, middle", "Deep, right"]);
    expect(at(s, 150 + 44, 80)).toBe("short-middle");
    expect(at(s, 150 + 46, 80)).toBe("deep-middle");
    expect(at(s, 150 - 20, 80)).toBe("short-middle");
    // Attacking right, the top of the drawing is the passer's left. Middle is between the hash marks.
    expect(at(s, 160, hash - 1)).toBe("short-left");
    expect(at(s, 160, hash + 1)).toBe("short-middle");
    expect(at(s, 160, 160 - hash + 1)).toBe("short-right");
    expect(at(s, 250, 10)).toBe("deep-left");
  });

  it("turns round when the offence attacks the other way", () => {
    const s = set("football-pass", { los: 210, direction: "left" });
    expect(at(s, 210 - 44, 80)).toBe("short-middle");
    expect(at(s, 210 - 46, 80)).toBe("deep-middle");
    expect(at(s, 210 + 30, 80)).toBe("short-middle");
    // Attacking left, the top of the drawing is the passer's right.
    expect(at(s, 200, 10)).toBe("short-right");
    expect(at(s, 100, 150)).toBe("deep-left");
  });

  it("follows the field: the CFL's hash marks are wider apart", () => {
    const cfl = buildZoneSet("football-pass", contextFor("cfl", { los: 200 }));
    expect(cfl.zones[cfl.which(210, 83)].id).toBe("short-left");
    expect(cfl.zones[cfl.which(210, 85)].id).toBe("short-middle");
  });
});
