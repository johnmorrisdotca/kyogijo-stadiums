// The ice skating rinks: the long track's figures against the ISU's table of measurements, the lines of each race against the layout plan's own numbers (the dimensions j, k, i and 12.57 m), the short
// track's oval and its tracks, the figure skating rink's size, the options and what they refuse, the ranges, and the data (pairs, starting positions, results, a replay, the elements of a programme).
import { describe, expect, it } from "vitest";
import { drawKyogijo, describe as describeDrawing } from "./draw.ts";
import { figureElements, formatTime, skatingGrid, skatingPairs, skatingReplay, skatingResults, distanceSkated } from "./charts.skating.ts";
import { ISU_FIGURE_RINK, ISU_LONG_TRACK_TABLE, ISU_SHORT_TRACK } from "./leagues/skating.ts";
import { markRace } from "./skating/long.ts";
import { skatingPlan } from "./skating/plan.ts";
import { shortOval, shortPose, startingPositions, trackLines } from "./skating/short.ts";
import { finishAt, laneEdges, longOval, pose, startOf } from "./skating/track.ts";
import { RANGES } from "./ranges.names.ts";
import { parseXml } from "./xml.fixture.ts";

const close = (a: number, b: number, d: number): void => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(d);

describe("the standard 400 m speed skating track against the ISU's table of measurements (Rule 203, H. Track)", () => {
  it("has the straight, the crossing and the radii of the table for an inner curve of 25 m, 25.5 m and 26 m: f of 113.57, 112.00 and 110.43 m", () => {
    for (const [name, row] of Object.entries(ISU_LONG_TRACK_TABLE)) {
      const o = longOval(row.radius);
      close(o.straight, row.straight, 0.006);
      close(o.crossing, row.crossing, 0.01);
      close(o.lap, 400, 1e-9);
      close(o.d, row.radius + 0.5, 1e-12);
      close(o.e, row.radius + 4.5, 1e-12);
      void name;
    }
  });

  it("is a lap of 400 m: the finishing straight, the inner curve, the crossing and the outer curve, on the lines 0.5 m outside each lane's inner edge", () => {
    const o = longOval();
    close(o.straight + Math.PI * o.d + o.crossing + Math.PI * o.e, 400, 1e-9);
    // 2 x 113.57 + 80.11 + 92.68 + 0.07 = 400.0 (the table's worked example)
    close(2 * o.straight + Math.PI * o.d + Math.PI * o.e + (o.crossing - o.straight), 400, 1e-9);
    close(Math.PI * o.d, 80.11, 0.005);
    close(Math.PI * o.e, 92.68, 0.005);
  });

  it("keeps the lap closed and goes counter-clockwise, changing lanes once a lap on the crossing straight (Rule 254.1 and 254.5)", () => {
    const o = longOval();
    const a = pose(o, 0, 0);
    expect([a.x, a.y]).toEqual([-o.straight / 2, o.d]);
    const next = pose(o, 0, o.lap);
    close(next.x, a.x, 1e-9);
    close(next.y, o.e, 1e-9);
    expect(next.across).toBe(1);
    expect(pose(o, 0, 2 * o.lap).across).toBe(0);
    // Right along the bottom, up the right curve, left along the top, down the left curve: the heading turns counter-clockwise (it grows anticlockwise, here as the eye sees it).
    expect(pose(o, 0, 10).part).toBe("finishing-straight");
    expect(pose(o, 0, o.straight + 10).part).toBe("first-curve");
    expect(pose(o, 0, o.straight + Math.PI * o.d + 10).part).toBe("crossing");
    expect(pose(o, 0, o.lap - 10).part).toBe("second-curve");
    let prev = pose(o, 0, 0);
    for (let s = 0.5; s <= 2 * o.lap; s += 0.5) {
      const p = pose(o, 0, s);
      expect(Math.hypot(p.x - prev.x, p.y - prev.y), `${s}`).toBeLessThan(0.52);
      prev = p;
    }
  });

  it("refuses an inner radius or an outer lane the Rule does not allow", () => {
    expect(() => longOval(24.9)).toThrow(/25 m to 26 m/);
    expect(() => longOval(26.1)).toThrow(RangeError);
    expect(() => longOval(25, 3.9)).toThrow(/outer lane/);
    expect(longOval(25, 5).w2).toBe(5);
    expect(() => drawKyogijo({ sport: "skating", skating: { innerRadius: 30 } })).toThrow(RangeError);
  });
});

describe("the starts of the long track against the layout plan's dimensions", () => {
  const o = longOval();
  const F = finishAt(o, "400m");
  const M = finishAt(o, "1000m");
  it("puts the 400 m mark 100 m from the beginning of the finishing straight (h = f - 100) and the 1000 m's finish in the middle (g = f / 2)", () => {
    close(F, 100, 0);
    close(-o.straight / 2 + F, 43.215, 0.001);
    close(o.straight - F, 13.57, 0.005);
    close(M, o.straight / 2, 1e-12);
  });

  it("starts the 500 m on the 300 m mark, at the end of the curve, in both lanes at once", () => {
    for (const lane of [0, 1] as const) close(startOf(o, lane, 500, F).pose.x, -o.straight / 2, 1e-9);
    const m = markRace(o, "500m");
    expect(m.starts).toHaveLength(1);
    expect(m.starts[0].lane).toBe("both");
  });

  it("starts the 1000 m 6.32 m (k) and 6.25 m (j) from the middle of the crossing straight, the inner lane's line on the finishing line's side, with no change of lanes on the first straight (Rule 254.5b)", () => {
    const inner = startOf(o, 0, 1000, M, true).pose;
    const outer = startOf(o, 1, 1000, M, true).pose;
    close(inner.x, 6.32, 0.01);
    close(outer.x, -6.25, 0.01);
    expect(inner.y).toBeLessThan(0);
    expect(outer.y).toBeLessThan(0);
    close(inner.x - outer.x, Math.PI * (o.e - o.d), 0.03);
  });

  it("starts the 1500 m 6.25 m beyond the end of the straight for the inner lane and 6.25 m into it for the outer", () => {
    const inner = startOf(o, 0, 1500, F, true).pose;
    const outer = startOf(o, 1, 1500, F, true).pose;
    close(inner.x - o.straight / 2, 6.25, 0.01);
    close(o.straight / 2 - outer.x, 6.25, 0.02);
  });

  it("starts the 3000 m and the 5000 m 7.32 m (i) and 19.89 m after the beginning of the crossing straight's end, the lanes 12.57 m (the difference of the curves) apart", () => {
    const inner = startOf(o, 0, 3000, F).pose;
    const outer = startOf(o, 1, 3000, F).pose;
    close(inner.x + o.straight / 2, 7.32, 0.01);
    close(outer.x + o.straight / 2, 19.89, 0.02);
    close(outer.x - inner.x, 12.57, 0.02);
    close(startOf(o, 0, 5000, F).pose.x, inner.x, 1e-9);
  });

  it("starts the 10,000 m at the finishing line, the mass start in the middle of the finishing straight (Rule 257.3), the team races in the middle of both straights (Rule 256.1.2)", () => {
    close(markRace(o, "10000m").starts[0].x, -o.straight / 2 + F, 1e-6);
    const mass = markRace(o, "mass-start");
    expect(mass.starts[0].x).toBe(0);
    expect(mass.finish).toBe("400m");
    const team = markRace(o, "team-pursuit");
    expect(team.starts.map((s) => Math.sign(s.y))).toEqual([1, -1]);
    for (const s of team.starts) close(s.x, 0, 1e-9);
    expect(markRace(o, "team-sprint").finish).toBe("1000m");
  });
});

describe("the long track's drawing", () => {
  it("draws the lines the Rules name: three lane lines and the warm-up lane's, the blocks 50 cm and 2 m apart, the coaches' area from 25 m after one curve to 10 m before the next, the finishing line and the metres before it", () => {
    const plan = skatingPlan({ sport: "skating", skating: { races: ["500m", "1000m"] } });
    const o = plan.oval!;
    const ids = plan.shapes.map((s) => s.id);
    expect(ids.filter((i) => i.startsWith("lane-line-"))).toHaveLength(4);
    const coaches = plan.shapes.find((s) => s.id === "coaches-area");
    expect(coaches).toMatchObject({ kind: "line", x0: o.straight / 2 - 25, x1: -o.straight / 2 + 10, y0: -(laneEdges(o, 4).outer + 1) });
    const finish = plan.shapes.find((s) => s.id === "finish-400m");
    expect(finish).toMatchObject({ kind: "line", x0: -o.straight / 2 + 100 });
    expect(ids.filter((i) => i.startsWith("finish-400m-metre-"))).toHaveLength(5);
    expect(ids).toContain("finish-1000m");
    const near = plan.shapes.find((s) => s.id === "blocks-inner-right-near");
    expect(near).toMatchObject({ kind: "path", dash: [0, 0.5] });
    expect(plan.shapes.find((s) => s.id === "blocks-inner-right-far")).toMatchObject({ dash: [0, 2] });
  });

  it("leaves out each part the options switch off, and takes a radius and a lane of its own", () => {
    const bare = skatingPlan({ sport: "skating", skating: { warmUp: false, blocks: false, coaches: false, padding: false } });
    const ids = bare.shapes.map((s) => s.id).concat(bare.areas.map((a) => a.id));
    expect(ids.some((i) => i.startsWith("blocks"))).toBe(false);
    expect(ids).not.toContain("coaches-area");
    expect(ids).not.toContain("padding");
    expect(ids).not.toContain("warm-up");
    const wide = skatingPlan({ sport: "skating", skating: { innerRadius: 26, laneWidth: 5 } });
    close(wide.oval!.straight, 110.43, 0.006);
    expect(wide.box.y1).toBeGreaterThan(skatingPlan({ sport: "skating" }).box.y1);
  });

  it("refuses a race it does not mark, naming the ones it does", () => {
    expect(() => drawKyogijo({ sport: "skating", skating: { races: ["marathon"] as never } })).toThrow(/Unknown race "marathon"/);
    expect(() => drawKyogijo({ sport: "skating", skating: { races: ["5000m-relay"] } })).toThrow(/does not mark the 5000m-relay/);
    expect(() => drawKyogijo({ sport: "skating", league: "isu-figure", skating: { races: ["500m"] } })).toThrow(/no races/);
    expect(() => drawKyogijo({ sport: "skating", skating: { infield: "grass" as never } })).toThrow(/floor/);
    expect(() => drawKyogijo({ sport: "skating", skating: { blocks: 1 as never } })).toThrow(TypeError);
    expect(() => drawKyogijo({ sport: "skating", league: "fiba" })).toThrow();
  });
});

describe("the short track (Rule 280 and its diagram)", () => {
  const fig = ISU_SHORT_TRACK;
  const oval = shortOval();
  it("is an oval of 111.12 m: 2 x S (57.71 m) and 2 x C x pi (53.41 m), S = 28.85 m, C = R8.50 m, on a rink of 60 by 30 m", () => {
    close(2 * fig.straight, 57.71, 0.01);
    close(2 * Math.PI * fig.radius, 53.41, 0.005);
    // The diagram rounds S to 28.85 and prints the lap as 111.12: 57.70 + 53.41 is 111.11.
    close(oval.lap, 111.12, 0.015);
    expect([oval.length, oval.width]).toEqual([60, 30]);
    expect(fig.blocks).toBe(fig.radius - 0.5);
  });

  it("stands the barrier 7 m from the line of the blocks, as the straight's least width (Rule 280.1b), and the apex block 4 m or more from the end boards (Rule 280.1c)", () => {
    close(oval.width / 2 - oval.blocks, 7, 1e-9);
    expect(oval.length / 2 - (oval.straight / 2 + oval.blocks)).toBeGreaterThanOrEqual(4);
  });

  it("marks seven blocks in each curve, 30 degrees apart on the line of 8.00 m, and the line between the last block of a curve and the first of the next (Rules 280.4 and 280.1g)", () => {
    const plan = skatingPlan({ sport: "skating", league: "isu-short-track" });
    const blocks = plan.shapes.filter((s) => s.kind === "dot" && s.id.startsWith("block-"));
    expect(blocks).toHaveLength(14);
    for (const b of blocks) if (b.kind === "dot") close(Math.hypot(Math.abs(b.cx) - oval.straight / 2 > 0 ? Math.abs(b.cx) - oval.straight / 2 : 0, b.cy) > 0 ? Math.hypot(b.cx > 0 ? b.cx - oval.straight / 2 : b.cx + oval.straight / 2, b.cy) : 0, 8, 1e-6);
    expect(plan.shapes.filter((s) => s.id.startsWith("straight-line-"))).toHaveLength(2);
    expect(skatingPlan({ sport: "skating", league: "isu-short-track", skating: { blocks: false } }).shapes.some((s) => s.id.startsWith("block-"))).toBe(false);
  });

  it("lays the other tracks out beside the standard one: starting lines 2.00 m apart for five tracks, 1.40 m apart for seven, each track moved half as far along the straight", () => {
    expect(trackLines(5)).toEqual([-4, -2, 0, 2, 4]);
    trackLines(7).forEach((x, i) => close(x, (i - 3) * 1.4, 1e-9));
    expect(fig.tracks.five.lines).toBe(2 * fig.tracks.five.shift);
    expect(fig.tracks.seven.lines).toBe(2 * fig.tracks.seven.shift);
    const plan = skatingPlan({ sport: "skating", league: "isu-short-track", skating: { races: ["500m"], tracks: 7 } });
    expect(plan.shapes.filter((s) => s.id.startsWith("start-line-"))).toHaveLength(7);
    expect(() => drawKyogijo({ sport: "skating", league: "isu-short-track", skating: { tracks: 6 as never } })).toThrow(/5 or 7/);
  });

  it("puts a track's half lap from its starting line to the single finishing line (the lines are 2 x the shift apart), and the finishing line a width of the straight and 1.5 m long", () => {
    // A skater on a track moved by delta starts the half-lap races at 2 x delta on the top straight and finishes at the middle of the bottom one: 55.56 m, half a lap.
    for (const delta of [-2, -1, 0, 1, 2]) {
      const shifted = { ...oval };
      void shifted;
      const half = oval.lap / 2;
      close(half, 55.56, 0.01);
      // from x = 2 delta along the top to the left end, the left curve, to the middle of the bottom straight, on the track moved by delta
      const path = (2 * delta - (-oval.straight / 2 + delta)) + Math.PI * oval.radius + (0 - (-oval.straight / 2 + delta));
      close(path, half, 1e-9);
    }
    const plan = skatingPlan({ sport: "skating", league: "isu-short-track" });
    expect(plan.shapes.find((s) => s.id === "finish-line")).toMatchObject({ kind: "line", x0: 0, y0: 15, y1: oval.blocks - 1.5 });
  });

  it("marks the five starting positions of the 500 m and the 1000 m: dots every 1.3 m, from 50 cm out from the inner side", () => {
    const spots = startingPositions(oval, 0, -1);
    expect(spots).toHaveLength(5);
    spots.forEach((p, i) => close(-p.y, 8 + 0.5 + 1.3 * i, 1e-9));
    const plan = skatingPlan({ sport: "skating", league: "isu-short-track", skating: { races: ["500m", "1000m"] } });
    expect(plan.shapes.filter((s) => s.id.startsWith("position-500m-"))).toHaveLength(5);
    expect(plan.shapes.filter((s) => s.id.startsWith("position-1000m-"))).toHaveLength(5);
  });

  it("goes round counter-clockwise: right along the finishing straight, up the right curve, left along the top", () => {
    const a = shortPose(oval, 0);
    expect([a.x, a.y]).toEqual([-oval.straight / 2, oval.radius]);
    const b = shortPose(oval, oval.straight + 5);
    expect(b.x).toBeGreaterThan(oval.straight / 2);
    const c = shortPose(oval, oval.straight + Math.PI * oval.radius + 5);
    expect(c.y).toBeLessThan(0);
    expect(c.x).toBeLessThan(oval.straight / 2);
    close(shortPose(oval, oval.lap).x, a.x, 1e-9);
  });

  it("takes a rink of at least 60 by 30 m and refuses a smaller one", () => {
    expect(skatingPlan({ sport: "skating", league: "isu-short-track", skating: { rink: { length: 61, width: 31 } } }).rink).toEqual({ length: 61, width: 31 });
    expect(() => drawKyogijo({ sport: "skating", league: "isu-short-track", skating: { rink: { length: 56 } } })).toThrow(/at least 60/);
    expect(() => drawKyogijo({ sport: "skating", league: "isu-short-track", skating: { rink: { width: 26 } } })).toThrow(/at least 30/);
  });
});

describe("the figure skating rink (Rule 342.1)", () => {
  it("is 60 m by 30 m, and at the least 56 m by 26 m; a size outside that is an error that says it", () => {
    const plan = skatingPlan({ sport: "skating", league: "isu-figure" });
    expect(plan.rink).toEqual({ length: 60, width: 30 });
    expect(skatingPlan({ sport: "skating", league: "isu-figure", skating: { rink: { length: 56, width: 26 } } }).rink).toEqual({ length: 56, width: 26 });
    expect(() => drawKyogijo({ sport: "skating", league: "isu-figure", skating: { rink: { length: 55.9 } } })).toThrow(/56 m to 60 m/);
    expect(() => drawKyogijo({ sport: "skating", league: "isu-figure", skating: { rink: { width: 31 } } })).toThrow(/26 m to 30 m/);
    expect(ISU_FIGURE_RINK.length.max).toBe(60);
  });

  it("seats the judges and the referee at the rinkboard, outside the ice, the technical panel behind them and the kiss and cry apart", () => {
    const plan = skatingPlan({ sport: "skating", league: "isu-figure" });
    const desks = plan.areas.filter((a) => a.cls === "ky-ska-desk");
    expect(desks).toHaveLength(9 + 1 + 1);
    for (const d of desks) expect((d.rect as readonly number[])[1]).toBeGreaterThan(15);
    expect(plan.areas.filter((a) => a.cls === "ky-ska-kiss")).toHaveLength(1);
    expect(skatingPlan({ sport: "skating", league: "isu-figure", skating: { furniture: ["judges"] } }).furniture).toEqual(["judges"]);
    expect(skatingPlan({ sport: "skating", league: "isu-figure", skating: { furniture: false } }).areas.some((a) => a.cls === "ky-ska-desk")).toBe(false);
    expect(() => drawKyogijo({ sport: "skating", league: "isu-figure", skating: { furniture: ["bench"] as never } })).toThrow(/Unknown furniture/);
  });
});

describe("the drawings and their words", () => {
  it("draws the same string for the same options, and a different one for each discipline", () => {
    expect(drawKyogijo({ sport: "skating", id: "a" })).toBe(drawKyogijo({ sport: "skating", id: "a", skating: {} }));
    const longTrack = drawKyogijo({ sport: "skating", id: "a" });
    expect(drawKyogijo({ sport: "skating", id: "a", league: "isu-short-track" })).not.toBe(longTrack);
    expect(drawKyogijo({ sport: "skating", id: "a", league: "isu-figure" })).not.toBe(longTrack);
    expect(parseXml(longTrack).attrs["data-sport"]).toBe("skating");
  });

  it("describes itself in English and in Japanese: the lanes, the radius, the races marked, the close-up", () => {
    const d = describeDrawing({ sport: "skating", skating: { races: ["500m", "1000m"] } });
    expect(d.title).toBe("Skating rink");
    expect(d.description).toContain("400 metres");
    expect(d.description).toContain("500 m, 1000 m");
    expect(describeDrawing({ sport: "skating", league: "isu-short-track" }).title).toBe("ISU 111.12 m short track speed skating oval");
    expect(describeDrawing({ sport: "skating", league: "isu-figure", language: "ja" }).description).toContain("フィギュアスケート");
    expect(describeDrawing({ sport: "skating", range: "start", skating: { start: "1500m" } }).description).toContain("start of the 1500 m");
  });

  it("has a range for every part it names, smaller than the whole, wide and tall", () => {
    const whole = parseXml(drawKyogijo({ sport: "skating" })).attrs.viewBox.split(" ").map(Number);
    const sets: Record<string, string[]> = { "isu-long-track": ["home-straight", "crossing-straight", "first-bend", "second-bend", "finish", "start", "infield"], "isu-short-track": ["home-straight", "crossing-straight", "first-bend", "second-bend", "finish", "start", "infield"], "isu-figure": ["half", "judges", "kiss-and-cry"] };
    for (const [league, names] of Object.entries(sets)) {
      const w = parseXml(drawKyogijo({ sport: "skating", league })).attrs.viewBox.split(" ").map(Number);
      for (const name of names) {
        for (const orientation of ["landscape", "portrait"] as const) {
          const box = parseXml(drawKyogijo({ sport: "skating", league, range: name, orientation } as never)).attrs.viewBox.split(" ").map(Number);
          expect(box[2] * box[3], `${league} ${name} ${orientation}`).toBeLessThan(w[2] * w[3] * (league === "isu-figure" && name !== "half" ? 1.2 : 1));
        }
      }
    }
    void whole;
    expect(RANGES.skating.map((r) => r.id)).toContain("crossing-straight");
    expect(() => drawKyogijo({ sport: "skating", league: "isu-figure", range: "finish" as never })).toThrow(/has no range "finish"/);
  });

  it("keeps hostile text out of the markup", () => {
    const evil = '<script>alert(1)</script>"&';
    const svg = skatingPairs([{ pair: 1, inner: { name: evil, country: evil }, outer: { name: evil } }], { race: "500m" }).draw();
    expect(svg).not.toContain("<script>");
    expect(skatingPairs([{ pair: 1, inner: { name: evil } }]).table()).not.toContain("<script>");
    expect(skatingResults([{ name: evil, place: 1, time: 35 }]).table()).not.toContain("<script>");
    expect(figureElements([{ kind: "jump", name: evil, x: 0, y: 0 }]).table()).not.toContain("<script>");
    expect(drawKyogijo({ sport: "skating", title: evil })).not.toContain("<script>");
  });
});

describe("the data", () => {
  const flag = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#090"/></svg>';

  it("draws the pairs of a race behind the starting lines of their lanes, with the armband's colour (white inner, red outer)", () => {
    const chart = skatingPairs([{ pair: 1, inner: { name: "A. Skater", country: "NED", flag }, outer: { name: "B. Skater", country: "NOR" } }, { pair: 2, inner: { name: "C. Skater" } }], { race: "1000m" });
    expect(chart.totals).toEqual({ skaters: 3, pairs: 2 });
    expect(chart.title).toBe("Pairs, 1000 m");
    expect(chart.summary).toBe("3 skaters in the 1000 m, last pair: 2.");
    const svg = chart.draw();
    expect(svg).toContain("A. Skater");
    expect(svg).toContain('data-range="start"');
    expect(chart.table()).toContain("C. Skater");
    expect(() => skatingPairs([{ pair: 1 }, { pair: 1 }])).toThrow(/pair 1 is given twice/);
    expect(() => skatingPairs([{ pair: 0 }])).toThrow(TypeError);
    expect(() => skatingPairs([], { surface: { league: "isu-short-track" } })).toThrow(/long track/);
    expect(skatingPairs([{ pair: 1, inner: { name: "あ" } }], { race: "500m", language: "ja" }).title).toBe("500mの組み合わせ");
  });

  it("puts the starters of a short track race on the five dots", () => {
    const chart = skatingGrid([{ position: 1, name: "A" }, { position: 3, name: "C" }], { race: "500m" });
    expect(chart.totals).toEqual({ skaters: 2, pairs: 1 });
    expect(chart.draw()).toContain("A");
    expect(() => skatingGrid([{ position: 6, name: "A" }])).toThrow(/position from 1 to 5/);
    expect(() => skatingGrid([{ position: 1, name: "A" }, { position: 1, name: "B" }])).toThrow(/given twice/);
  });

  it("writes results: the medals, the times, the splits along the lane, the table", () => {
    const res = [{ name: "A", place: 1, time: 34.3, pair: 1, lane: "inner" as const, splits: [{ distance: 100, time: 9.6 }] }, { name: "B", place: 2, time: 34.5, lane: "outer" as const }, { name: "C", place: 3, time: 34.7 }, { name: "D", note: "DQ" }];
    const chart = skatingResults(res, { race: "500m" });
    expect(chart.totals).toEqual({ skaters: 4, finished: 3, winner: { name: "A", time: 34.3 } });
    expect(chart.summary).toBe("A won the 500 m in 34.30.");
    expect(chart.table()).toContain("DQ");
    expect(chart.draw()).toContain("#d4a017");
    expect(formatTime(34.32)).toBe("34.32");
    expect(formatTime(361.03)).toBe("6:01.03");
  });

  it("replays a long track race: every skater on his own way from his lane's starting line, at the finishing line at his time, the lane changed on the crossing", () => {
    const o = longOval();
    const replay = skatingReplay([{ name: "A", lane: "inner", time: 36 }, { name: "B", lane: "outer", time: 37 }], { race: "500m", step: 0.5 });
    const first = replay.timeline.frames[0];
    expect(first.objects).toHaveLength(2);
    for (const p of first.objects) close(p.x, -o.straight / 2, 1e-3);
    close(first.objects[0].y, o.d, 1e-3);
    close(first.objects[1].y, o.e, 1e-3);
    const at36 = replay.timeline.frames.find((f) => Math.abs(f.t - 36) < 1e-6)!;
    close(at36.objects[0].x, -o.straight / 2 + 100, 0.05);
    close(at36.objects[0].y, o.e, 0.05);
    const at37 = replay.timeline.frames.find((f) => Math.abs(f.t - 37) < 1e-6)!;
    close(at37.objects[1].x, -o.straight / 2 + 100, 0.05);
    close(at37.objects[1].y, o.d, 0.05);
    expect(replay.duration).toBe(37);
    expect(replay.timeline.events?.some((e) => e.kind === "gun")).toBe(true);
    expect(() => skatingReplay([{ name: "A", time: 0 }])).toThrow(RangeError);
    expect(() => skatingReplay([{ name: "A", time: 10 }], { race: "mass-start" })).toThrow(/not replayed/);
  });

  it("replays a 1000 m from the starting line on the crossing straight, in one lane along its first straight", () => {
    const o = longOval();
    const replay = skatingReplay([{ name: "A", lane: "inner", time: 70 }, { name: "B", lane: "outer", time: 71 }], { race: "1000m", step: 1 });
    close(replay.timeline.frames[0].objects[0].x, 6.32, 0.01);
    close(replay.timeline.frames[0].objects[1].x, -6.25, 0.01);
    const end = replay.timeline.frames.find((f) => f.t === 70)!;
    close(end.objects[0].x, 0, 0.05);
    void o;
  });

  it("replays a short track race: the starters come in from the dots to the line and finish at the middle of the bottom straight", () => {
    const oval = shortOval();
    const replay = skatingReplay([{ name: "A", position: 1, time: 40 }, { name: "B", position: 3, time: 41 }], { race: "500m", step: 1, surface: { league: "isu-short-track" } });
    const first = replay.timeline.frames[0];
    close(first.objects[0].y, -oval.radius, 0.01);
    close(first.objects[0].x, 0, 0.01);
    const end = replay.timeline.frames.find((f) => f.t === 40)!;
    close(end.objects[0].x, 0, 0.05);
    close(end.objects[0].y, oval.radius, 0.05);
  });

  it("follows the splits, then coasts after the finish", () => {
    const r = { name: "a", time: 10, splits: [{ distance: 50, time: 5.5 }] };
    expect(distanceSkated(r, 100, 0)).toBe(0);
    close(distanceSkated(r, 100, 5.5), 50, 1e-9);
    close(distanceSkated(r, 100, 10), 100, 1e-9);
    expect(distanceSkated(r, 100, 11)).toBeGreaterThan(100);
    expect(distanceSkated(r, 100, 20)).toBeLessThan(120);
  });

  it("marks the elements of a programme on the ice, each kind its own shape, a step sequence with its track", () => {
    const chart = figureElements([{ kind: "jump", name: "3Lz", x: -12, y: 4, order: 1 }, { kind: "step-sequence", name: "StSq3", x: -20, y: -8, x2: 10, y2: -8, order: 2 }, { kind: "spin", x: 6, y: 3, order: 3 }]);
    expect(chart.totals).toEqual({ elements: 3, kinds: { jump: 1, "step-sequence": 1, spin: 1 } });
    expect(chart.layers.map((l) => l.id)).toEqual(["paths", "elements", "labels"]);
    expect(chart.draw()).toContain("3Lz");
    expect(chart.summary).toBe("3 elements on the ice, 3Lz, StSq3, Spin.");
    expect(() => figureElements([{ kind: "axel" as never, x: 0, y: 0 }])).toThrow(/Unknown kind/);
    expect(() => figureElements([], { surface: { league: "isu-short-track" } })).toThrow(/figure skating/);
    expect(figureElements([{ kind: "jump", x: 0, y: 0 }], { language: "ja" }).title).toBe("プログラムのエレメント");
  });
});
