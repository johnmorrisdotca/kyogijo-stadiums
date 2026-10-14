import { describe, expect, it } from "vitest";
import { drawToCanvas, type CanvasContext } from "./canvas.ts";
import { appendSurface, surfaceDomain, type D3Selection } from "./d3.ts";
import { sceneToGeoJSON } from "./geojson.ts";
import { surfaceMark, type PlotDocument, type PlotElement } from "./plot.ts";
import { sceneOf } from "./scene.ts";
import { sceneToSvg } from "./scene-entry.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { GOAL_SPORTS, LENGTH_ZONES, drawGoalMouth, drawStrikeZone, drawStumps, drawTarget, goalSize, goalZoneIds, lengthZoneOf, targetZoneAt, type TargetShot } from "./target-entry.ts";

const FT = 0.3048;
const near = (a: number, b: number, digits = 4): void => expect(a).toBeCloseTo(b, digits);

describe("the goals, to the rulebooks' figures", () => {
  it("are 6 by 4 feet in hockey, 7.32 by 2.44 m in soccer, 3 by 2 m in handball, 3 by 0.9 m in water polo, 6 by 6 feet in lacrosse and 3.66 by 2.14 m in field hockey", () => {
    expect(goalSize("nhl")).toMatchObject({ width: 6, height: 4, unit: "ft" });
    expect(goalSize("soccer")).toMatchObject({ width: 7.32, height: 2.44, unit: "m" });
    expect(goalSize("handball")).toMatchObject({ width: 3, height: 2, unit: "m" });
    expect(goalSize("waterpolo")).toMatchObject({ width: 3, height: 0.9, unit: "m" });
    expect(goalSize("lacrosse")).toMatchObject({ width: 6, height: 6, unit: "ft" });
    expect(goalSize("fieldhockey")).toMatchObject({ width: 3.66, height: 2.14, unit: "m" });
    // 24 by 8 feet is the soccer goal in the units America plays it in: the Laws' 8 yards by 8 feet.
    near(goalSize("soccer").width / FT, 24.02, 1);
    near(goalSize("soccer").height / FT, 8, 1);
  });

  it("holds lacrosse's goal against the box and the field rules: six by six feet in the field game, 4 ft 9 in by 4 ft in the box floor", () => {
    for (const league of ["world-men", "ncaa-men", "ncaa-women", "pll", "world-women"]) {
      const size = goalSize("lacrosse", { league });
      near(size.width, 6, 1);
      near(size.height, 6, 1);
    }
    const box = goalSize("lacrosse", { league: "nll" });
    near(box.width, 4.75, 4);
    near(box.height, 4, 4);
    expect(goalSize("lacrosse", { league: "world-box" }).width).toBeCloseTo(4.75, 4);
  });

  it("takes a small-sided soccer format's goal", () => {
    near(goalSize("soccer", { pitch: "7-a-side" }).width, 12 * FT, 3);
  });
});

describe("the zones across a goal", () => {
  it("are nine cells, with hockey's top shelf and five-hole", () => {
    expect(goalZoneIds("nhl")).toContain("top-shelf");
    expect(goalZoneIds("nhl")).toContain("five-hole");
    expect(goalZoneIds("soccer")).toContain("top-centre");
    expect(goalZoneIds("soccer")).toHaveLength(9);
    expect(targetZoneAt({ sport: "nhl" }, 0, 3.8).zone).toBe("top-shelf");
    expect(targetZoneAt({ sport: "nhl" }, 0, 0.3).zone).toBe("five-hole");
    expect(targetZoneAt({ sport: "nhl" }, -2.8, 3.8).zone).toBe("top-left-corner");
    expect(targetZoneAt({ sport: "nhl" }, 2.8, 0.2).zone).toBe("bottom-right-corner");
    expect(targetZoneAt({ sport: "nhl" }, 0, 2)).toEqual({ zone: "centre", placement: "in" });
    expect(targetZoneAt({ sport: "soccer" }, 3.5, 1.2).zone).toBe("mid-right");
  });

  it("put a shot outside the frame wide or over the bar", () => {
    expect(targetZoneAt({ sport: "nhl" }, 3.1, 2)).toEqual({ zone: "wide-right", placement: "wide" });
    expect(targetZoneAt({ sport: "nhl" }, -3.1, 4.4)).toEqual({ zone: "wide-left", placement: "wide-high" });
    expect(targetZoneAt({ sport: "nhl" }, 1, 4.1)).toEqual({ zone: "over-the-bar", placement: "high" });
    // The same place in metres.
    expect(targetZoneAt({ sport: "nhl", units: "m" }, 0.85, 0.6).zone).toBe("mid-right");
  });
});

describe("a goal mouth", () => {
  const shots: TargetShot[] = [
    { x: -2.4, z: 3.6, outcome: "goal", id: "a" },
    { x: 0, z: 0.4, outcome: "saved" },
    { x: 3.4, z: 2, outcome: "wide" },
    { x: 1, z: 4.6, outcome: "high" },
    { x: -3, z: 2.5, outcome: "post" },
    { x: 1, z: 4, outcome: "crossbar" },
    { x: null, z: null, outcome: "blocked" },
  ];

  it("counts the shots by zone and draws each mark with its id, its index and its zone", () => {
    const view = drawGoalMouth(shots, { sport: "nhl", zones: "labels", id: "hk" });
    expect(view.placed).toBe(6);
    expect(view.skipped).toBe(1);
    expect(view.zones).toMatchObject({ "top-left-corner": 1, "five-hole": 1, "wide-right": 1, "over-the-bar": 1, "mid-left": 1, "top-shelf": 1 });
    expect(view.svg).toContain('data-mark-id="a" data-index="0" data-zone="top-left-corner"');
    expect(view.svg).toContain('data-mark-id="1" data-index="1" data-zone="five-hole"');
    expect(view.svg).toContain('data-zone="wide-right"');
    // A zone cell is a hit target of its own.
    expect(view.svg).toContain('<rect class="ky-tg-cell"');
    expect(view.svg).toContain("<title>Top shelf</title>");
    expect(view.key.map((k) => k.id)).toEqual(["goal", "saved", "post", "crossbar", "wide", "high", "blocked"].filter((id) => id !== "blocked"));
    expect(view.table()).toContain("<table");
  });

  it("is drawn for each of the six sports, each at its own size", () => {
    for (const sport of GOAL_SPORTS) {
      const view = drawGoalMouth([{ x: 0.2, z: 0.3, outcome: "goal" }], { sport, zones: true, id: sport });
      expect(view.target.sport).toBe(sport);
      expect(view.svg.startsWith("<svg")).toBe(true);
      expect(view.svg).toContain(`data-sport="${sport}"`);
      expect(view.placed).toBe(1);
    }
    expect(() => drawGoalMouth([], { sport: "tennis" as never })).toThrow(/goal mouth is for/);
  });

  it("is the same string for the same options, in light and dark and in Japanese", () => {
    for (const options of [{ sport: "soccer" }, { sport: "nhl", theme: "dark" }, { sport: "handball", language: "ja" }] as const) {
      expect(drawGoalMouth(shots, { ...options, id: "x" }).svg).toBe(drawGoalMouth(shots, { ...options, id: "x" }).svg);
    }
    const ja = drawGoalMouth(shots, { sport: "nhl", language: "ja", zones: "labels", id: "j" });
    expect(ja.svg).toContain("トップシェルフ");
    expect(ja.svg).toContain("アイスホッケーのゴール");
    expect(drawGoalMouth(shots, { sport: "nhl", theme: "dark", id: "j" }).svg).toContain('data-theme="dark"');
  });

  it("makes a hostile id, title or colour harmless", () => {
    const view = drawTarget([{ x: 0, z: 1, id: '"><script>x</script>', title: "<img onerror=x>" }, { x: 0, z: 1, type: "FF", outcome: "ball" }], { sport: "mlb", colorBy: "type", className: 'a" onload="x', title: "<b>" });
    expect(view.svg).not.toContain("<script");
    expect(view.svg).not.toContain("<img");
    expect(view.svg).not.toContain('" onload=');
  });

  it("is data in every renderer", () => {
    const svg = drawGoalMouth(shots, { sport: "nhl", zones: true, id: "r" }).svg;
    const scene = sceneOf(svg);
    expect(scene.sport).toBe("nhl");
    expect(scene.items.length).toBeGreaterThan(15);
    const marked = scene.items.filter((i) => i.data?.["mark-id"] !== undefined);
    expect(marked.length).toBeGreaterThanOrEqual(6);
    expect(marked.some((i) => i.data?.zone === "top-shelf")).toBe(true);
    // Light and dark are worked out, and the stylesheet-free SVG has no var().
    const dark = sceneToSvg(svg, { theme: "dark" });
    expect(dark).not.toContain("var(");
    expect(sceneToSvg(svg, { theme: "light" })).not.toBe(dark);
    // GeoJSON, the canvas, d3 and Plot.
    const collection = sceneToGeoJSON(svg);
    expect(collection.features.length).toBeGreaterThan(15);
    const calls: string[] = [];
    const ctx = new Proxy({}, { get: (_t, name: string) => (name === "createLinearGradient" ? () => ({ addColorStop: () => undefined }) : (...args: unknown[]) => void calls.push(`${name}${args.length}`)), set: () => true }) as unknown as CanvasContext;
    drawToCanvas(ctx, svg, { width: 600 });
    expect(calls.filter((c) => c.startsWith("fill")).length).toBeGreaterThan(5);
    const d = surfaceDomain(svg);
    const appended: string[] = [];
    const wrap = (): D3Selection => ({ append: (name) => (appended.push(name), wrap()), attr: () => wrap(), text: () => wrap() });
    appendSurface(wrap(), svg, (v) => v, (v) => v);
    expect(appended.length).toBeGreaterThan(15);
    expect(d.x[1]).toBeGreaterThan(d.x[0]);
    const made: PlotElement[] = [];
    const document: PlotDocument = {
      createElementNS: () => {
        const node: PlotElement = { textContent: null, setAttribute: () => undefined, appendChild: (c) => (made.push(c as PlotElement), c) };
        return node;
      },
    };
    const scale = (v: number): number => v * 4;
    expect(surfaceMark(svg)(0, { x: scale, y: scale }, {}, {}, { document })).toBeDefined();
    expect(made.length).toBeGreaterThan(15);
  });
});

describe("the strike zone", () => {
  const pitches: TargetShot[] = [
    { x: 0.1, z: 2.6, outcome: "called-strike", type: "FF" },
    { x: 1.3, z: 1.1, outcome: "ball", type: "SL" },
    { x: -0.4, z: 2.0, outcome: "swinging-strike", type: "SL" },
    { x: 0.9, z: 3.9, outcome: "foul", type: "CH" },
    { x: -0.2, z: 2.4, outcome: "in-play", type: "FF", order: 12 },
  ];

  it("is the plate's 17 inches across with a zone from the batter's knees to his belt, nine cells and four chase zones", () => {
    const view = drawStrikeZone(pitches);
    near(view.target.width, 17 / 12);
    expect(view.target.floor).toBe(1.5);
    expect(view.target.height).toBe(2);
    expect(view.svg.match(/<rect class="ky-tg-(cell|out)/g)?.length).toBe(13);
    expect(drawStrikeZone(pitches, { chase: false }).svg.match(/<rect class="ky-tg-(cell|out)/g)?.length).toBe(9);
    expect(() => drawStrikeZone([], { top: 1, bottom: 2 })).toThrow(/above its bottom/);
  });

  it("numbers 1 to 9 as the catcher sees them, and 11 to 14 round them", () => {
    const at = (x: number, z: number, o: object = {}) => targetZoneAt({ sport: "mlb", ...o }, x, z).zone;
    expect(at(-0.6, 3.3)).toBe("zone-1");
    expect(at(0, 3.3)).toBe("zone-2");
    expect(at(0.6, 3.3)).toBe("zone-3");
    expect(at(0, 2.5)).toBe("zone-5");
    expect(at(0.6, 1.6)).toBe("zone-9");
    expect(at(-0.9, 3.8)).toBe("zone-11");
    expect(at(0.9, 3.8)).toBe("zone-12");
    expect(at(-0.9, 1.1)).toBe("zone-13");
    expect(at(0.9, 1.1)).toBe("zone-14");
    expect(at(3, 2.5)).toBe("outside");
    // The zone follows the batter: a tall one's top is higher.
    expect(at(0, 4.2, { top: 4.4, bottom: 2 })).toBe("zone-2");
    expect(at(0.1, 4.2)).toBe("zone-12");
  });

  it("numbers the pitches in order, colours them by result or type, and puts the batter's side at his side of the plate", () => {
    const view = drawStrikeZone(pitches, { bats: "R" });
    expect(view.svg).toContain(">1</text>");
    expect(view.svg).toContain(">12</text>");
    expect(view.key.map((k) => k.id)).toEqual(["ball", "called-strike", "swinging-strike", "foul", "in-play"]);
    expect(view.key.find((k) => k.id === "ball")?.hollow).toBe(true);
    expect(view.key.find((k) => k.id === "called-strike")?.shape).toBe("square");
    expect(view.svg).toContain("--c:#4e79a7");
    const byType = drawStrikeZone(pitches, { colorBy: "type" });
    expect(byType.svg).toContain("--c:#e15759");
    expect(byType.svg).not.toBe(view.svg);
    expect(drawStrikeZone(pitches, { numbers: false }).svg).not.toContain(">12</text>");
    const right = drawStrikeZone(pitches, { bats: "R" }).svg;
    const left = drawStrikeZone(pitches, { bats: "L" }).svg;
    expect(/class="ky-tg-mark ky-tg-ink" x="([\d.]+)"[^>]*>R</.exec(right)![1]).not.toBe(/class="ky-tg-mark ky-tg-ink" x="([\d.]+)"[^>]*>L</.exec(left)![1]);
    expect(Number(/class="ky-tg-mark ky-tg-ink" x="([\d.]+)"[^>]*>R</.exec(right)![1])).toBeLessThan(Number(/class="ky-tg-mark ky-tg-ink" x="([\d.]+)"[^>]*>L</.exec(left)![1]));
  });

  it("takes the strike zone from Statcast's numbers: plate_x across, plate_z up, in feet", () => {
    const view = drawStrikeZone([{ x: 0, z: 2.5, outcome: "called-strike" }], { top: 3.4, bottom: 1.6, id: "s" });
    expect(view.zones["zone-5"]).toBe(1);
    expect(view.table()).toContain("called-strike");
  });
});

describe("the stumps", () => {
  it("are three stumps across 9 inches and 28 inches high, with the line zones round them", () => {
    const view = drawStumps([{ x: 0.02, z: 0.4, outcome: "wicket", length: 5.1 }, { x: 0.5, z: 0.9, outcome: "dot", length: 7.4 }, { x: -0.01, z: 0.5, outcome: "runs" }]);
    near(view.target.width, 9 * 0.0254);
    near(view.target.height, 28 * 0.0254);
    expect(view.zones["on-stumps"]).toBe(2);
    expect(view.zones["wide-right"]).toBe(1);
    expect(view.svg.match(/class="ky-tg-solid ky-tg-ink"/g)?.length).toBe(5);
    expect(view.svg).toContain("<title>Good length</title>");
    expect(targetZoneAt({ sport: "cricket" }, 0, 0.9).zone).toBe("over-stumps");
    expect(targetZoneAt({ sport: "cricket" }, 0.2, 0.3).zone).toBe("outside-right");
    expect(targetZoneAt({ sport: "cricket" }, -0.2, 0.3).zone).toBe("outside-left");
    expect(targetZoneAt({ sport: "cricket" }, -0.6, 0.3).zone).toBe("wide-left");
  });

  it("names the length of a delivery by where it pitched", () => {
    expect(LENGTH_ZONES.map((z) => z.id)).toEqual(["yorker", "full", "good-length", "short-of-a-length", "short"]);
    expect(lengthZoneOf(0)).toBe("yorker");
    expect(lengthZoneOf(3)).toBe("full");
    expect(lengthZoneOf(5)).toBe("good-length");
    expect(lengthZoneOf(7)).toBe("short-of-a-length");
    expect(lengthZoneOf(11)).toBe("short");
    expect(() => lengthZoneOf(-1)).toThrow(/distance/);
  });
});

describe("the words", () => {
  it("are in English and Japanese for every zone and outcome", () => {
    const en = KYOGIJO_STRINGS.en.target;
    const ja = KYOGIJO_STRINGS.ja.target;
    expect(Object.keys(ja.zones).sort()).toEqual(Object.keys(en.zones).sort());
    expect(Object.keys(ja.outcomes).sort()).toEqual(Object.keys(en.outcomes).sort());
    expect(Object.keys(ja.lengths).sort()).toEqual(Object.keys(en.lengths).sort());
    for (const sport of GOAL_SPORTS) for (const id of goalZoneIds(sport)) expect(en.zones[id], id).toBeDefined();
    for (let n = 1; n <= 9; n += 1) expect(en.zones[`zone-${n}`]).toBeDefined();
  });
});
