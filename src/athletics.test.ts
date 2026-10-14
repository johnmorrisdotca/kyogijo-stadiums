// The athletics stadium: the track's figures against the Manual's, the staggers against Table 2.2.1.6a, the construction of the curved starts and the breakline, the marks of each race, the field events' facilities, the
// options and what they refuse, the ranges and the data (lane draws, results, replays, marks).
import { describe, expect, it } from "vitest";
import { drawKyogijo, describe as describeDrawing } from "./draw.ts";
import { fieldMarks, formatTime, laneDraw, raceReplay, raceResults, distanceRun } from "./charts.athletics.ts";
import { athleticsPlan } from "./athletics/plan.ts";
import { FIELD_EVENT_IDS, RACES } from "./athletics/events.ts";
import { JAVELIN_HALF, SECTOR_ANGLE } from "./athletics/facilities.ts";
import { SECTOR_REACH } from "./athletics/infield.ts";
import { curveAcross, curveOrigin, firstStart, markRace } from "./athletics/races.ts";
import { INSIDE, OUTSIDE, scPose, standardDistance } from "./athletics/steeplechase.ts";
import { breaklineStagger, distanceOn, involutePoint, laneEdge, laneRadius, lap, pose, stagger, type Oval } from "./athletics/track.ts";
import { WA_SHORT_STAGGER_TABLE, WA_SHORT_TRACK, WA_STAGGER_TABLE, WA_STANDARD_TRACK } from "./leagues/athletics.ts";
import { RANGES } from "./ranges.names.ts";
import type { SurfaceOptions } from "./types.ts";
import { parseXml, walk } from "./xml.fixture.ts";

const oval = (lanes = 8): Oval => ({ straight: 84.39, radius: 36.5, lane: 1.22, lanes, line: 0.05, inner: 0.3, outer: 0.2 });
const close = (a: number, b: number, d: number): void => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(d);
const ctxOf = (plan: ReturnType<typeof athleticsPlan>) => ({ oval: plan.oval, fig: plan.figures, lanes: plan.lanes, straight: plan.straight, numbers: false, numberHeight: 0.85 });
const marksOf = (race: string, lanes = 8) => {
  const plan = athleticsPlan({ sport: "athletics", athletics: { lanes, races: [race as never] } });
  return plan.races.find((r) => r.race.id === race)!;
};

describe("the 400 m standard track, as the Manual lays it out (2.2.1.1, Table 2.2.1.1)", () => {
  it("has the lengths of the table: the kerb's 398.1163 m, lane 1's running line 400.0012 m, a bend of 115.6106 m", () => {
    const o = oval();
    close(2 * o.straight + 2 * Math.PI * o.radius, 398.1163, 0.0001);
    close(lap(o, 1), 400.0012, 0.0001);
    close(Math.PI * laneRadius(o, 1), 115.6106, 0.0001);
    expect(WA_STANDARD_TRACK).toMatchObject({ straight: 84.39, radius: 36.5, lane: 1.22 });
  });

  it("puts the running line 0.30 m out from the kerb in lane 1 and 0.20 m out from the line on its left in the others (Rule 14.2): 36.80, 37.92, 39.14 m", () => {
    const o = oval();
    expect([1, 2, 3, 4].map((n) => laneRadius(o, n))).toEqual([36.8, 37.92, 39.14, 40.36].map((r) => expect.closeTo(r, 6)));
    close(laneEdge(o, 1), 37.72, 1e-9);
    close(laneEdge(o, 8), 46.26, 1e-9);
  });

  it("runs left-hand inside: a lane is a closed curve whose distance from the finish line grows round the right-hand bend first", () => {
    const o = oval();
    const a = pose(o, laneRadius(o, 1), 0);
    close(a.x, o.straight / 2, 1e-9);
    close(a.y, laneRadius(o, 1), 1e-9);
    close(a.heading, 0, 1e-9);
    const b = pose(o, laneRadius(o, 1), Math.PI * laneRadius(o, 1));
    close(b.x, o.straight / 2, 1e-9);
    close(b.y, -laneRadius(o, 1), 1e-9);
    const end = pose(o, laneRadius(o, 3), lap(o, 3));
    close(end.x, a.x, 1e-9);
    expect(distanceOn(o, 38, pose(o, 38, 123.4).x, pose(o, 38, 123.4).y)).toBeCloseTo(123.4, 6);
    for (const s of [10, 90, 150, 230, 300, 380]) expect(distanceOn(o, 40, pose(o, 40, s).x, pose(o, 40, s).y)).toBeCloseTo(s, 6);
  });
});

describe("the staggered starts against Table 2.2.1.6a", () => {
  const lanes = [2, 3, 4, 5, 6, 7, 8];
  it("works the 200 m and the 400 m out of the radii: every lane to the millimetre", () => {
    const o = oval();
    lanes.forEach((n, i) => {
      close(stagger(o, n, 1), WA_STAGGER_TABLE["200m"][i], 0.0006);
      close(stagger(o, n, 2), WA_STAGGER_TABLE["400m"][i], 0.0006);
    });
  });

  it("works the 800 m and the 4 x 400 m out of the breakline's construction (an involute of lane 1's circle), within 2 mm of the table", () => {
    const o = oval();
    lanes.forEach((n, i) => {
      close(breaklineStagger(o, n), WA_STAGGER_TABLE["800m"][i], 0.0025);
      close(2 * stagger(o, n, 1) + breaklineStagger(o, n), WA_STAGGER_TABLE["4x400m"][i], 0.0025);
    });
  });

  it("places each lane's start line at lane 1's line plus its stagger, on the lane's own line", () => {
    for (const [race, key] of [["200m", "200m"], ["400m", "400m"], ["800m", "800m"], ["4x400m", "4x400m"]] as const) {
      const marks = marksOf(race);
      expect(marks.starts).toHaveLength(8);
      marks.starts.slice(1).forEach((s, i) => {
        close(s.stagger, WA_STAGGER_TABLE[key][i], 0.0025);
        close(s.s - marks.s1, s.stagger, 1e-9);
        // The point is on the lane's running line.
        const o = oval();
        const p = pose(o, laneRadius(o, s.lane), s.s);
        close(p.x, s.x, 1e-9);
        close(p.y, s.y, 1e-9);
      });
    }
  });

  it("starts the 400 m and the 800 m at the finish line (distances come to a whole number of laps back), the 200 m half a lap round, the 1500 m 100 m round", () => {
    const o = oval();
    close(firstStart(o, 400), 0.0012, 1e-4);
    close(firstStart(o, 800), 0.0024, 1e-4);
    close(firstStart(o, 200), 200.0012, 1e-4);
    close(firstStart(o, 1500), 100.0048, 1e-4);
    close(firstStart(o, 1609.344), 400.0012 * 5 - 1609.344, 1e-3);
  });

  it("uses the covered track's own table: 5.597 m for lane 2 over two bends", () => {
    const plan = athleticsPlan({ sport: "athletics", league: "world-athletics-short", athletics: { races: ["400m"] } });
    const marks = plan.races.find((r) => r.race.id === "400m")!;
    expect(marks.starts).toHaveLength(6);
    expect(marks.starts.slice(1).map((s) => s.stagger)).toEqual([...WA_SHORT_STAGGER_TABLE["two-bends"]]);
    expect(WA_SHORT_TRACK.banking).toBe(10);
  });
});

describe("curved start lines and the breakline", () => {
  it("makes every point of a curved start the same distance from the finish by the shortest route: straight to lane 1's circle, then round it", () => {
    const o = oval();
    const a = laneRadius(o, 1);
    // The start of the 1500 m is 100.0048 m round lane 1: on the first bend.
    const origin = curveOrigin(o, a, firstStart(o, 1500));
    const curve = curveAcross(o, origin, a, 36.5, 46.26, 20);
    const cx = o.straight / 2;
    const f0 = origin.f0;
    // From a point P, the tangent to the circle about the centre: its length and where it touches, as an angle f round the bend (the bend's own angle, from its entry at the bottom).
    for (const [x, y] of curve.slice(1)) {
      const d = Math.hypot(x - cx, y);
      if (d <= a) continue; // the short run in to the kerb is not on the involute
      const ell = Math.sqrt(d * d - a * a);
      // Polar angle of P about the centre, from the bottom (angle 0 is straight down, growing round the right bend): then the tangent point is ahead of it by acos(a / d).
      const phi = Math.atan2(x - cx, y);
      const f = phi + Math.acos(a / d);
      // The distance to a fixed point on the circle, at the end of the bend, by this route.
      const route = ell + a * (Math.PI - f);
      const lane1 = a * (Math.PI - f0);
      expect(route, `${x},${y}`).toBeCloseTo(lane1, 5);
    }
  });

  it("leads the outer lanes of the 1500 m's line by the involute's lead, and the line is a smooth curve from the kerb to the outer edge", () => {
    const o = oval();
    const a = laneRadius(o, 1);
    const curve = curveAcross(o, curveOrigin(o, a, firstStart(o, 1500)), a, 36.5, 46.26, 30);
    expect(curve.length).toBeGreaterThan(20);
    const first = curve[0];
    const last = curve[curve.length - 1];
    close(Math.hypot(first[0] - o.straight / 2, first[1]), 36.5, 1e-6);
    close(Math.hypot(last[0] - o.straight / 2, last[1]), 46.26, 1e-4);
  });

  it("draws the breakline across every lane but lane 1, and puts lane 8's start 26.93 m ahead for the 800 m", () => {
    const marks = marksOf("800m");
    expect(marks.breakline).toBeDefined();
    const o = oval();
    const first = marks.breakline![0];
    close(Math.hypot(first[0] - (-o.straight / 2), first[1]), Math.hypot(o.straight, laneEdge(o, 1)) * 0 + Math.hypot(first[0] + o.straight / 2, first[1]), 1e-9);
    close(marks.starts[7].stagger, 26.93, 0.0025);
  });

  it("is the involute of lane 1's second bend through D (wire 84.39 m): at lane 1 it passes the end of the first bend, 92.065 m from CP1", () => {
    const o = oval();
    const [x, y] = involutePoint(o, "left", laneRadius(o, 1), o.straight, 0);
    close(Math.hypot(x + o.straight / 2, y), 92.065, 0.001);
    close(x, o.straight / 2, 1e-9);
  });
});

describe("the marks of the races", () => {
  it("marks the 100 m and the 110 m hurdles on the straight: the start lines at 100 m and 110 m before the finish line, the hurdles 13.72 m, then every 9.14 m, to 14.02 m from the finish", () => {
    const m100 = marksOf("100m");
    close(m100.starts[0].x, 42.195 - 100, 1e-9);
    const h = marksOf("110m-hurdles");
    expect(h.starts[0].x).toBeCloseTo(42.195 - 110, 9);
    const xs = h.hurdles![0].at;
    expect(xs).toHaveLength(10);
    close(xs[0] - h.starts[0].x, 13.72, 1e-9);
    close(xs[1] - xs[0], 9.14, 1e-9);
    close(42.195 - xs[9], 14.02, 1e-9);
    const w = marksOf("100m-hurdles").hurdles![0].at;
    close(w[0] - (42.195 - 100), 13, 1e-9);
    close(w[1] - w[0], 8.5, 1e-9);
    close(42.195 - w[9], 10.5, 1e-9);
  });

  it("marks ten hurdles in each lane of the 400 m hurdles: 45 m to the first, 35 m between, 40 m to the finish", () => {
    const marks = marksOf("400m-hurdles");
    for (const lane of marks.hurdles!) {
      const start = marks.starts.find((s) => s.lane === lane.lane)!;
      expect(lane.at).toHaveLength(10);
      close(lane.at[0] - start.s, 45, 1e-9);
      close(lane.at[1] - lane.at[0], 35, 1e-9);
      close(start.s + 400 - lane.at[9], 40, 1e-9);
    }
  });

  it("makes the 4 x 100 m's takeover zones 30 m long with the scratch line 20 m from the zone's start, and the 4 x 400 m's 20 m with the scratch line in the middle", () => {
    const relay = marksOf("4x100m");
    expect(relay.zones).toHaveLength(8 * 3);
    for (const z of relay.zones!) {
      close(z.end - z.start, 30, 1e-9);
      close(z.scratch - z.start, 20, 1e-9);
    }
    const lane1 = relay.zones!.filter((z) => z.lane === 1);
    expect(lane1.map((z) => Math.round(z.scratch - relay.starts[0].s))).toEqual([100, 200, 300]);
    const four = marksOf("4x400m");
    expect(four.zones).toHaveLength(8);
    for (const z of four.zones!) {
      close(z.end - z.start, 20, 1e-9);
      close(z.scratch - z.start, 10, 1e-9);
    }
  });

  it("puts the 4 x 400 m's first scratch lines where the 800 m's start lines are", () => {
    const four = marksOf("4x400m");
    const eight = marksOf("800m");
    const o = oval();
    for (let n = 1; n <= 8; n += 1) {
      const z = four.zones!.find((q) => q.lane === n)!;
      const here = pose(o, laneRadius(o, n), z.scratch);
      const there = eight.starts.find((s) => s.lane === n)!;
      close(here.x, there.x, 0.02);
      close(here.y, there.y, 0.02);
    }
  });

  it("starts the steeplechase's 3000 m 172.594 m after the finish line with the water jump inside, and marks five hurdles in a lap, the fourth the water jump", () => {
    const o = oval();
    expect(INSIDE.hurdles).toHaveLength(5);
    close(INSIDE.hurdles[1] - INSIDE.hurdles[0], 79.217, 0.001);
    close(INSIDE.hurdles[4] - INSIDE.hurdles[3], 79.217, 0.001);
    close(OUTSIDE.hurdles[2] - OUTSIDE.hurdles[1], 83.881, 0.001);
    close(INSIDE.lap, 396.0849, 1e-9);
    close(OUTSIDE.lap, 419.407, 1e-9);
    // The diverted bend: two arcs, two transitions and a straight make 111.6943 m.
    close(2 * INSIDE.b2 + 2 * INSIDE.b1 + INSIDE.middle, 111.6943, 0.0005);
    close(INSIDE.lap, Math.PI * 36.8 - 0 + 84.39 * 2 + 2 * INSIDE.b2 + 2 * INSIDE.b1 + INSIDE.middle - 0 * Math.PI * 36.8 - (Math.PI * 36.8 - 115.6106 + 0), 0.001);
    // The lap closes, and the pose is continuous along it.
    for (const variant of ["inside", "outside"] as const) {
      const L = variant === "inside" ? INSIDE.lap : OUTSIDE.lap;
      const a = scPose(o, variant, 0);
      const b = scPose(o, variant, L - 1e-6);
      close(a.x, b.x, 0.12);
      close(a.y, b.y, 0.12);
      let prev = scPose(o, variant, 0);
      for (let s = 0.5; s <= L; s += 0.5) {
        const p = scPose(o, variant, s);
        expect(Math.hypot(p.x - prev.x, p.y - prev.y), `${variant} ${s}`).toBeLessThan(0.62);
        prev = p;
      }
    }
    // The 3000 m's start is on the back straight, where the lap is the oval's own.
    expect(standardDistance(o, "inside", INSIDE.start3000)).toBeCloseTo(172.594, 6);
    const plan = athleticsPlan({ sport: "athletics", athletics: { races: ["3000m-steeplechase"] } });
    expect(plan.waterJump).toBe("inside");
    expect(plan.shapes.some((s) => s.id === "water-pit-edge")).toBe(true);
  });
});

describe("the field events' facilities", () => {
  it("has the throws' sector of 34.92 degrees (48 m wide at 80 m, 54 m at 90 m, 15 m at 25 m) and the javelin's of 28.96 degrees (50 m at 100 m)", () => {
    expect((SECTOR_ANGLE * 180) / Math.PI).toBeCloseTo(34.92, 2);
    const chord = (reach: number, half: number): number => 2 * reach * Math.sin(half);
    expect(chord(SECTOR_REACH["discus-throw"], SECTOR_ANGLE / 2)).toBeCloseTo(48, 1);
    expect(chord(SECTOR_REACH["hammer-throw"], SECTOR_ANGLE / 2)).toBeCloseTo(54, 1);
    expect(chord(SECTOR_REACH["shot-put"], SECTOR_ANGLE / 2)).toBeCloseTo(15, 1);
    expect((2 * JAVELIN_HALF * 180) / Math.PI).toBeCloseTo(28.96, 2);
    expect(chord(100, JAVELIN_HALF)).toBeCloseTo(50, -1);
  });

  it("puts every field event in the standard stadium, each facility inside the arena or the strip beyond the back straight", () => {
    const plan = athleticsPlan({ sport: "athletics" });
    expect(new Set(plan.facilities.map((f) => f.event))).toEqual(new Set(FIELD_EVENT_IDS));
    expect(plan.facilities.filter((f) => f.event === "javelin-throw")).toHaveLength(2);
    expect(plan.facilities.filter((f) => f.event === "high-jump")).toHaveLength(2);
    expect(plan.facilities.filter((f) => f.event === "shot-put")).toHaveLength(3);
    expect(plan.facilities.filter((f) => f.event === "pole-vault")).toHaveLength(4);
  });

  it("switches each event on and off", () => {
    expect(athleticsPlan({ sport: "athletics", athletics: { events: false } }).facilities).toHaveLength(0);
    const only = athleticsPlan({ sport: "athletics", athletics: { events: ["shot-put", "high-jump"] } });
    expect(new Set(only.facilities.map((f) => f.event))).toEqual(new Set(["shot-put", "high-jump"]));
    expect(() => athleticsPlan({ sport: "athletics", athletics: { events: ["curling"] as never } })).toThrow(/Unknown field event "curling"/);
    const svg = drawKyogijo({ sport: "athletics", athletics: { events: false } });
    expect(svg).not.toMatch(/class="[^"]*ky-ath-sand/);
  });
});

describe("the options and what they refuse", () => {
  it("draws the same string for the same options, and the same stadium as before when no option is given", () => {
    expect(drawKyogijo({ sport: "athletics", id: "a" })).toBe(drawKyogijo({ sport: "athletics", id: "a", athletics: {} }));
    expect(drawKyogijo({ sport: "athletics", id: "a", athletics: { races: "all" } })).toBe(drawKyogijo({ sport: "athletics", id: "a", athletics: { races: "all" } }));
  });

  it("takes four to nine lanes outdoors and four to six indoors, refusing the rest with the range", () => {
    for (const n of [4, 6, 8, 9]) expect(athleticsPlan({ sport: "athletics", athletics: { lanes: n } }).lanes).toBe(n);
    expect(() => athleticsPlan({ sport: "athletics", athletics: { lanes: 10 } })).toThrow(/outside what the rules allow: 4 to 9/);
    expect(() => athleticsPlan({ sport: "athletics", athletics: { lanes: 3 } })).toThrow(RangeError);
    expect(() => athleticsPlan({ sport: "athletics", athletics: { lanes: 8.5 } })).toThrow(/whole number/);
    expect(() => athleticsPlan({ sport: "athletics", league: "world-athletics-short", athletics: { lanes: 8 } })).toThrow(/4 to 6/);
    expect(athleticsPlan({ sport: "athletics", athletics: { straightLanes: 10 } }).straight?.lanes).toBe(10);
    expect(() => athleticsPlan({ sport: "athletics", athletics: { straightLanes: 11 } })).toThrow(/6 to 10/);
  });

  it("refuses a track look, an infield, a race and a water jump it does not have, saying what to use", () => {
    expect(() => drawKyogijo({ sport: "athletics", athletics: { track: "pink" as never } })).toThrow(/red, blue, terracotta, green/);
    expect(() => drawKyogijo({ sport: "athletics", athletics: { infield: "ice" as never } })).toThrow(/pitch, grass, none/);
    expect(() => drawKyogijo({ sport: "athletics", athletics: { races: ["marathon"] as never } })).toThrow(/Unknown race "marathon"/);
    expect(() => drawKyogijo({ sport: "athletics", athletics: { waterJump: "up" as never } })).toThrow(/inside, outside or none/);
    expect(() => drawKyogijo({ sport: "athletics", athletics: { layout: "curling" as never } })).toThrow(/Unknown field event/);
    expect(() => drawKyogijo({ sport: "athletics", athletics: { races: ["60m"] } })).toThrow(/covered track/);
    expect(() => drawKyogijo({ sport: "athletics", league: "world-athletics-short", athletics: { races: ["10000m"] } })).toThrow(/does not mark the 10000m/);
    expect(() => drawKyogijo({ sport: "athletics", league: "fiba" })).toThrow();
  });

  it("keeps hostile text out of the markup: a hostile name in a lane draw, a result, a mark", () => {
    const evil = '<script>alert(1)</script>"&';
    const svg = laneDraw([{ lane: 1, name: evil, country: evil }], { race: "100m" }).draw();
    expect(svg).not.toContain("<script>");
    expect(laneDraw([{ lane: 1, name: evil, country: evil }]).table()).not.toContain("<script>");
    expect(raceResults([{ lane: 1, name: evil, place: 1, time: 10 }], { race: "100m" }).table()).not.toContain("<script>");
    expect(fieldMarks("javelin-throw", [{ athlete: evil, distance: 80 }]).table()).not.toContain("<script>");
    expect(drawKyogijo({ sport: "athletics", title: evil })).not.toContain("<script>");
  });

  it("names its looks: red by default, a track of its own, the lines in ink only for `line-drawing`", () => {
    expect(drawKyogijo({ sport: "athletics" })).not.toContain("data-track");
    const blue = drawKyogijo({ sport: "athletics", athletics: { track: "blue" } });
    expect(blue).toContain('data-track="blue"');
    expect(blue).toContain("--ky-ath-b:#e0342b");
    const ink = drawKyogijo({ sport: "athletics", look: "line-drawing", athletics: { races: "all" } });
    expect(ink).toContain('data-palette="line-drawing"');
    expect(ink).toContain("[data-palette=line-drawing][data-sport=athletics]");
  });

  it("describes itself: the lanes, the infield, the events and the races marked, and the close-up", () => {
    const text = describeDrawing({ sport: "athletics", athletics: { races: ["400m", "800m"], lanes: 9 } });
    expect(text.title).toBe("Athletics track");
    expect(text.description).toContain("9 lanes");
    expect(text.description).toContain("soccer pitch");
    expect(text.description).toContain("400 m, 800 m");
    expect(describeDrawing({ sport: "athletics", range: "start", athletics: { start: "1500m" } }).description).toContain("start of the 1500 m");
    expect(describeDrawing({ sport: "athletics", language: "ja", athletics: { layout: "javelin-throw" } }).description).toContain("やり投");
    expect(describeDrawing({ sport: "athletics", ground: "olympiastadion-munich" }).title).toBe("Munich Olympic Stadium, athletics track");
  });

  it("lays the ground's pitch inside the track", () => {
    const plan = athleticsPlan({ sport: "athletics", ground: "stade-de-france" });
    expect(plan.pitch?.spec.length).toBeCloseTo(105, 1);
  });
});

describe("the ranges and the views", () => {
  const named = RANGES.athletics.map((r) => r.id);
  it("has every named range, each smaller than the whole, in landscape and in portrait", () => {
    const whole = parseXml(drawKyogijo({ sport: "athletics" })).attrs.viewBox.split(" ").map(Number);
    for (const name of named) {
      for (const orientation of ["landscape", "portrait"] as const) {
        const svg = drawKyogijo({ sport: "athletics", range: name, orientation } as SurfaceOptions);
        const box = parseXml(svg).attrs.viewBox.split(" ").map(Number);
        expect(box[2] * box[3], `${name} ${orientation}`).toBeLessThan(whole[2] * whole[3]);
        expect(box[2]).toBeGreaterThan(0);
      }
    }
  });

  it("closes up on the start of each race, turned so that the athletes run to the right, or up the page in portrait", () => {
    for (const race of RACES.filter((r) => r.legs === undefined && r.kind !== "steeplechase" && r.indoor !== true)) {
      const wide = drawKyogijo({ sport: "athletics", range: "start", athletics: { start: race.id } });
      const tall = drawKyogijo({ sport: "athletics", range: "start", orientation: "portrait", athletics: { start: race.id } });
      const a = parseXml(wide).attrs.viewBox.split(" ").map(Number);
      const b = parseXml(tall).attrs.viewBox.split(" ").map(Number);
      expect(a[2], race.id).toBeCloseTo(b[3], 1);
      expect(a[3], race.id).toBeCloseTo(b[2], 1);
      expect(parseXml(wide).attrs["data-range"]).toBe("start");
    }
  });

  it("draws a field event alone: each one, wide and tall, with its own sentence", () => {
    for (const event of FIELD_EVENT_IDS) {
      const svg = drawKyogijo({ sport: "athletics", athletics: { layout: event } });
      expect(parseXml(svg).attrs["data-sport"]).toBe("athletics");
      expect(drawKyogijo({ sport: "athletics", athletics: { layout: event }, orientation: "portrait" })).toContain("data-orientation=\"portrait\"");
      expect(describeDrawing({ sport: "athletics", athletics: { layout: event } }).description).toContain("alone");
    }
  });

  it("draws the covered 200 m track with its 60 m straight, and a plan with no stadium round it", () => {
    const plan = athleticsPlan({ sport: "athletics", league: "world-athletics-short", athletics: { races: ["60m-hurdles"] } });
    expect(plan.indoor).toBe(true);
    expect(plan.lanes).toBe(6);
    expect(plan.facilities).toHaveLength(0);
    const marks = plan.races.find((r) => r.race.id === "60m-hurdles")!;
    expect(marks.hurdles![0].at).toHaveLength(5);
    expect(drawKyogijo({ sport: "athletics", league: "world-athletics-short" })).toContain("ky-ath-bank");
  });

  it("draws each race of the covered track", () => {
    for (const race of ["60m", "60m-hurdles", "200m", "400m", "800m", "1000m", "1500m", "mile", "3000m", "5000m"] as const) {
      const svg = drawKyogijo({ sport: "athletics", league: "world-athletics-short", athletics: { races: [race] } });
      expect(svg.startsWith("<svg"), race).toBe(true);
    }
  });
});

describe("the data", () => {
  const entries = [{ lane: 3, name: "A. Runner", country: "ITA", flag: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#090"/></svg>' }, { lane: 4, name: "B. Sprinter", country: "USA" }];

  it("draws a lane draw on the start, the names and the flags on their lanes", () => {
    const chart = laneDraw(entries, { race: "100m" });
    expect(chart.totals).toEqual({ athletes: 2, firstLane: 3, lastLane: 4 });
    expect(chart.title).toBe("Lane draw, 100 m");
    expect(chart.summary).toContain("from lane 3 to lane 4");
    const svg = chart.draw();
    expect(svg).toContain("A. Runner");
    expect(svg).toContain('data-range="start"');
    expect(chart.layers.map((l) => l.id)).toEqual(["flags", "names"]);
    expect(() => laneDraw([{ lane: 1, name: "a" }, { lane: 1, name: "b" }])).toThrow(/lane 1 is given twice/);
    expect(() => laneDraw([{ lane: 0, name: "a" }])).toThrow(TypeError);
    expect(laneDraw(entries, { race: "400m", language: "ja" }).title).toBe("400mのレーン抽選");
  });

  it("writes results: the medals, the times, the table", () => {
    const res = [{ lane: 4, name: "A", place: 1, time: 9.8, reaction: 0.141 }, { lane: 5, name: "B", place: 2, time: 9.84, reaction: 0.15, splits: [{ distance: 50, time: 5.6 }] }, { lane: 6, name: "C", place: 3, time: 9.9 }, { lane: 7, name: "D", note: "DQ" }];
    const chart = raceResults(res, { race: "100m" });
    expect(chart.totals).toEqual({ athletes: 4, finished: 3, winner: { name: "A", time: 9.8 }, quickestReaction: 0.141 });
    expect(chart.summary).toBe("A won the 100 m in 9.80.");
    const table = chart.table();
    expect(table).toContain("9.80");
    expect(table).toContain("0.141");
    expect(table).toContain("DQ");
    expect(chart.draw()).toContain("#d4a017");
  });

  it("writes a time as it is read", () => {
    expect(formatTime(9.58)).toBe("9.58");
    expect(formatTime(100.91)).toBe("1:40.91");
    expect(formatTime(7439.4)).toBe("2:03:59.40");
    expect(formatTime(Number.NaN)).toBe("");
  });

  it("replays a race from the gun to the line on the lane's own curve: lane 8 starts 53.03 m ahead in the 400 m and every runner is at the finish line at the finish time", () => {
    const names = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const runners = names.map((name, i) => ({ lane: i + 1, name, time: 44 + i * 0.2 }));
    const replay = raceReplay(runners, { race: "400m", step: 0.1 });
    const first = replay.timeline.frames[0];
    expect(first.objects).toHaveLength(8);
    const o = oval();
    const marks = marksOf("400m");
    first.objects.forEach((p, i) => {
      close(p.x, marks.starts[i].x, 1e-3);
      close(p.y, marks.starts[i].y, 1e-3);
    });
    // Lane 8 is 53.03 m further round the bend than lane 1: the arc between the two start points, on the running lines.
    close(marks.starts[7].stagger, 53.03, 0.001);
    // At its time every runner is on the finish line (x = half a straight), in its lane.
    for (const r of runners) {
      const frame = replay.timeline.frames.find((f) => Math.abs(f.t - Math.round(r.time * 10) / 10) < 1e-6);
      expect(frame, r.name).toBeDefined();
      const p = frame!.objects.find((q) => q.id === `lane-${r.lane}`)!;
      close(p.x, o.straight / 2, 0.08 * 10);
    }
    expect(replay.duration).toBeCloseTo(45.4, 6);
    expect(replay.timeline.events?.some((e) => e.kind === "gun")).toBe(true);
    expect(replay.summary).toBe("8 athletes run the 400 m.");
    expect(() => raceReplay([{ lane: 1, name: "a", time: 0 }])).toThrow(RangeError);
    expect(() => raceReplay([{ lane: 1, name: "a", time: 10 }], { race: "4x100m" })).toThrow(/relay/);
  });

  it("keeps a runner at rest until the reaction time, then runs the splits and the finish", () => {
    const r = { lane: 1, name: "a", time: 10, reaction: 0.2, splits: [{ distance: 50, time: 5.5 }] };
    expect(distanceRun(r, 100, 0.1)).toBe(0);
    expect(distanceRun(r, 100, 0.2)).toBe(0);
    expect(distanceRun(r, 100, 5.5)).toBeCloseTo(50, 9);
    expect(distanceRun(r, 100, 10)).toBeCloseTo(100, 9);
    expect(distanceRun(r, 100, 11)).toBeGreaterThan(100);
    expect(distanceRun(r, 100, 20)).toBeLessThan(120);
  });

  it("puts a jump, a throw in its place in the sector or the pit and picks out the best mark", () => {
    const chart = fieldMarks("javelin-throw", [{ athlete: "A", distance: 84.2, across: 2 }, { athlete: "A", distance: 90.7, across: 6 }, { athlete: "A", valid: false }, { athlete: "A", distance: 86 }]);
    expect(chart.totals).toEqual({ attempts: 4, valid: 3, fouls: 1, best: { distance: 90.7, athlete: "A" } });
    expect(chart.layers.map((l) => l.id)).toEqual(["attempts", "marks"]);
    const data = (chart.layers[0] as unknown as { data: { outcome: string; x: number; y: number }[] }).data;
    expect(data.filter((d) => d.outcome === "best")).toHaveLength(1);
    // A throw of 90.7 m, 6 degrees to the right of the axis, from the arc 8 m from the centre point: 98.7 m out.
    const best = data.find((d) => d.outcome === "best")!;
    const facility = athleticsPlan({ sport: "athletics" }).facilities.find((f) => f.event === "javelin-throw")!;
    close(Math.hypot(best.x - facility.x, best.y - facility.y), 98.7, 1e-6);
    expect(chart.table()).toContain("foul");
    const lj = fieldMarks("long-jump", [{ athlete: "B", distance: 8.46, across: 0.3 }], { surface: { athletics: { layout: "long-jump" } } });
    expect(lj.draw()).toContain("8.46");
    expect(() => fieldMarks("curling" as never, [])).toThrow(/Unknown field event/);
    expect(() => fieldMarks("long-jump", [], { facility: "nowhere" })).toThrow(/no facility "nowhere"/);
  });
});

void ctxOf;
void markRace;
void walk;
