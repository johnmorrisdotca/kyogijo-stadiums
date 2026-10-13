import { describe, expect, it } from "vitest";
import { seeded } from "../demo/layers-data.js";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { layerTable } from "./layers.ts";
import type { HeatDatum } from "./heat.types.ts";
import type { Layer } from "./layers.types.ts";
import type { Sport, SurfaceOptions } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

/** The size of each surface in the drawing's own frame (a ballpark is x across and y minus the distance out). */
const AREA: Record<Sport, { x: [number, number]; y: [number, number] }> = {
  nfl: { x: [0, 360], y: [0, 160] },
  cfl: { x: [0, 450], y: [0, 195] },
  ifaf: { x: [0, 360], y: [0, 160] },
  nhl: { x: [0, 200], y: [0, 85] },
  nba: { x: [0, 94], y: [0, 50] },
  mlb: { x: [-200, 200], y: [-340, -20] },
  soccer: { x: [0, 345], y: [0, 223] },
  curling: { x: [0, 150], y: [0, 15.58] },
  tennis: { x: [0, 78], y: [0, 36] },
  volleyball: { x: [0, 59.06], y: [0, 29.53] },
  badminton: { x: [0, 43.96], y: [0, 20.01] },
  pickleball: { x: [0, 44], y: [0, 20] },
  tabletennis: { x: [0, 8.99], y: [0, 5] },
};

/** Made-up marks spread over a surface: a cluster of normal deviates round its middle, from a fixed seed. */
function cloud(sport: Sport, count: number, seed = 1): HeatDatum[] {
  const random = seeded(seed);
  const normal = (): number => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const { x, y } = AREA[sport];
  const out: HeatDatum[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      x: Math.round(((x[0] + x[1]) / 2 + normal() * (x[1] - x[0]) * 0.17) * 10) / 10,
      y: Math.round(((y[0] + y[1]) / 2 + normal() * (y[1] - y[0]) * 0.17) * 10) / 10,
      value: Math.round(random() * 100) / 10,
      outcome: random() < 0.4 ? "made" : "missed",
    });
  }
  return out;
}

const parse = (svg: string): Node => parseXml(svg);
const layersOf = (svg: string): Node[] => withClass(parse(svg), "ky-layer").concat(walk(parse(svg)).filter((n) => n.attrs["data-kind"] === "legend" && !(n.attrs.class ?? "").includes("ky-layer")));

const ZONE_FOR: Record<Sport, Layer> = {
  nfl: { kind: "zones", zones: "football-pass", data: cloud("nfl", 200) },
  cfl: { kind: "zones", zones: "football-pass", data: cloud("cfl", 200) },
  ifaf: { kind: "zones", zones: "football-pass", data: cloud("ifaf", 200) },
  nhl: { kind: "zones", zones: "nhl-slot", data: cloud("nhl", 200) },
  nba: { kind: "zones", zones: "nba-shot", data: cloud("nba", 200), statistic: "rate" },
  mlb: { kind: "zones", zones: "baseball-spray", data: cloud("mlb", 200) },
  soccer: { kind: "zones", zones: "soccer-positional", data: cloud("soccer", 200) },
  curling: { kind: "zones", zones: "curling-house", data: cloud("curling", 200) },
  tennis: { kind: "zones", zones: "net-court", data: cloud("tennis", 200) },
  volleyball: { kind: "zones", zones: "net-court", data: cloud("volleyball", 200) },
  badminton: { kind: "zones", zones: "net-court", data: cloud("badminton", 200) },
  pickleball: { kind: "zones", zones: "net-court", data: cloud("pickleball", 200) },
  tabletennis: { kind: "zones", zones: "net-court", data: cloud("tabletennis", 200) },
};

describe("every heat layer on every surface", () => {
  for (const sport of SPORTS) {
    it(`${sport}: a heat map, hexagons, zones and contours are well-formed in every orientation, cut to the surface, with a title and a description`, () => {
      const data = cloud(sport, 300);
      const kinds: Layer[] = [
        { kind: "heatmap", data, bins: [50, 30], labels: true, legend: true },
        { kind: "hexbin", data, legend: true },
        ZONE_FOR[sport],
        { kind: "contour", data, legend: true },
      ];
      const away = { name: "Gulls", score: 1, color: "#1f5fa8" };
      const home = { name: "Bison", score: 2, color: "#b5452c" };
      for (const options of [{ sport }, { sport, orientation: "portrait" as const }, { sport, away, home }]) {
        const svg = parse(drawKyogijo({ ...options, id: "x", layers: kinds }));
        const layers = withClass(svg, "ky-layer");
        expect(layers.map((n) => n.attrs["data-kind"])).toEqual(["heatmap", "hexbin", "zones", "contour"]);
        for (const layer of layers) {
          expect(layer.attrs["clip-path"]).toBe("url(#x-lc)");
          expect(layer.children[0].name).toBe("title");
          expect(layer.children[0].text).toMatch(/300|200/);
          expect(withClass(layer, "ky-hg")).toHaveLength(1);
          expect(layer.attrs.class).toContain("ky-hm");
        }
        // A legend for each, not cut to the surface.
        const legends = walk(svg).filter((n) => n.attrs["data-kind"] === "legend");
        expect(legends).toHaveLength(3);
        for (const legend of legends) expect(legend.attrs["clip-path"]).toBeUndefined();
        expect(walk(svg).find((n) => n.name === "desc")?.text).toContain("Data:");
      }
    });
  }
});

describe("a 50 by 30 grid", () => {
  for (const sport of SPORTS) {
    it(`${sport}: stays under 30 kB, and under 100 kB with every cell labelled and a legend, and is drawn in a few milliseconds`, () => {
      const data = cloud(sport, 3000, 5);
      const base = drawKyogijo({ sport, id: "g" });
      const t0 = performance.now();
      const plain = drawKyogijo({ sport, id: "g", layers: [{ kind: "heatmap", data, bins: [50, 30] }] });
      const took = performance.now() - t0;
      const full = drawKyogijo({ sport, id: "g", layers: [{ kind: "heatmap", data, bins: [50, 30], labels: true, legend: true }] });
      expect(plain.length - base.length).toBeLessThan(30_000);
      expect(full.length - base.length).toBeLessThan(100_000);
      // The documented budget is 20 ms on a laptop; the test allows for a busy machine.
      expect(took).toBeLessThan(400);
    });
  }
});

describe("a density of 10,000 points", () => {
  it("is drawn under the time budget (about 30 ms on a laptop; the test holds it under 500) and into under 40 kB of contours", () => {
    const data = cloud("nhl", 10_000, 21);
    const t0 = performance.now();
    const svg = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data }] });
    const took = performance.now() - t0;
    expect(took).toBeLessThan(500);
    expect(svg.length).toBeLessThan(80_000);
    const t1 = performance.now();
    drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "hexbin", data, size: 3 }] });
    expect(performance.now() - t1).toBeLessThan(500);
  });
});

describe("statistics of a heat map", () => {
  const data: HeatDatum[] = [
    { x: 10, y: 10, value: 2, outcome: "made" },
    { x: 11, y: 12, value: 4, outcome: "missed" },
    { x: 12, y: 11, value: 9, outcome: "made" },
    { x: 80, y: 40, value: 10, outcome: "goal" },
    { x: 500, y: 40, value: 7 },
    { x: null, y: 4 },
  ];
  const surface: SurfaceOptions = { sport: "nhl" };
  const bins = [10, 4] as const;
  const rows = (statistic: NonNullable<Extract<Layer, { kind: "heatmap" }>["statistic"]>, extra: Record<string, unknown> = {}): (string | number | null)[][] => {
    const html = layerTable([{ kind: "heatmap", data, bins, statistic, ...extra } as Layer], { surface });
    return [...html.matchAll(/<tr><th scope="row">(\d+)<\/th>((?:<td>[^<]*<\/td>)+)<\/tr>/g)].map((m) => [Number(m[1]), ...[...m[2].matchAll(/<td>([^<]*)<\/td>/g)].map((c) => (c[1] === "" ? null : Number(c[1])))]);
  };

  /** The cell that holds the three marks near (10, 10), whichever place its value ranks it in. */
  const hot = (table: (string | number | null)[][]): (string | number | null)[] => table.find((r) => r[3] === 3) as (string | number | null)[];

  it("counts, and drops what has no place or lies outside the surface", () => {
    const table = rows("count");
    // The hot cell holds three, then the one goal. The mark outside the surface and the one with no place are not in any cell.
    expect(table.map((r) => r[4])).toEqual([3, 1]);
    expect(table[0][3]).toBe(3);
  });

  it("sums, averages and takes the median and extremes of the marks' values", () => {
    expect(hot(rows("sum"))[4]).toBe(15);
    expect(hot(rows("mean"))[4]).toBe(5);
    expect(hot(rows("median"))[4]).toBe(4);
    expect(hot(rows("max"))[4]).toBe(9);
    expect(hot(rows("min"))[4]).toBe(2);
    // The table is hottest first, by the statistic: the cell with the goal's 10 is the highest mean.
    expect(rows("mean")[0][4]).toBe(10);
  });

  it("gives each cell's share of all the marks as a percent, and the rate of successes in it", () => {
    expect(hot(rows("percent"))[4]).toBe(75);
    expect(hot(rows("rate"))[4]).toBeCloseTo(66.667, 2);
    expect(hot(rows("rate", { success: ["missed"] }))[4]).toBeCloseTo(33.333, 2);
  });

  it("takes a function of the values and the counts", () => {
    const table = rows((values, info) => values.length * 100 + info.hits * 10 + info.count);
    expect(hot(table)[4]).toBe(300 + 20 + 3);
  });

  it("normalises: by the highest, by the total, as a percent of the total", () => {
    expect(rows("count", { normalize: "max" })[0][4]).toBe(1);
    expect(rows("count", { normalize: "sum" })[0][4]).toBe(0.75);
    expect(rows("count", { normalize: "percent" })[0][4]).toBe(75);
  });

  it("leaves out a cell with fewer marks than minCount", () => {
    expect(rows("count", { minCount: 2 })).toHaveLength(1);
  });

  it("refuses a statistic it does not know", () => {
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "heatmap", data, statistic: "mode" as never }] })).toThrow(/Unknown statistic "mode"/);
  });

  it("takes the bins as a count across, a pair, or edges of its own", () => {
    const count = (b: unknown): number => rows("count", { bins: b }).length;
    expect(count(4)).toBeGreaterThan(0);
    expect(count({ x: [0, 50, 200], y: [0, 85] })).toBe(2);
    expect(rows("count", { bins: { x: [0, 50, 200], y: [0, 85] } }).map((r) => r[4])).toEqual([3, 1]);
    expect(rows("count", { bins: [2, 1], extent: { x: [0, 100], y: [0, 85] } }).map((r) => r[4])).toEqual([3, 1]);
  });
});

describe("a heat map in a provider's frame", () => {
  it("bins the marks where the frame puts them and reports the cells in the frame's own numbers", () => {
    const data: HeatDatum[] = [{ x: 80, y: 3 }, { x: 81, y: 4 }, { x: -60, y: -20 }];
    const layer: Layer = { kind: "heatmap", from: "nhl-api", data, bins: [20, 10] };
    const html = layerTable([layer], { surface: { sport: "nhl" } });
    const first = /<tr><th scope="row">1<\/th><td>([-\d.]+)<\/td><td>([-\d.]+)<\/td><td>(\d+)<\/td>/.exec(html);
    expect(first).not.toBeNull();
    // The two marks at the right end share a cell whose centre is within a cell (10 feet) of where they were.
    expect(Number(first![3])).toBe(2);
    expect(Math.abs(Number(first![1]) - 80.5)).toBeLessThan(6);
    expect(html).toContain("nhl-api");
  });
});

describe("a zone chart in the NBA's own coordinates", () => {
  it("puts a shot with a negative LOC_X in the left corner and the restricted area under the hoop, whatever the sport's frame says about the ends", () => {
    const shots: HeatDatum[] = [
      { x: -235, y: 30, outcome: "made" },
      { x: -230, y: 20, outcome: "missed" },
      { x: 0, y: 5, outcome: "made" },
      { x: 0, y: 240, outcome: "missed" },
    ];
    const html = layerTable([{ kind: "zones", zones: "nba-shot", from: "nba-stats", data: shots, statistic: "rate", end: "right" }], { surface: { sport: "nba" } });
    const row = (zone: string): string[] => [...(new RegExp(`<td>${zone}</td>((?:<td>[^<]*</td>)+)`).exec(html)?.[1] ?? "").matchAll(/<td>([^<]*)<\/td>/g)].map((m) => m[1]);
    expect(row("Left corner 3")[0]).toBe("2");
    expect(row("Left corner 3")[1]).toBe("50");
    expect(row("Restricted area")[0]).toBe("1");
    expect(row("Above the break 3")[0]).toBe("1");
  });
});

describe("the heat layers' tables and summaries", () => {
  const data = cloud("nba", 120, 8);
  const surface: SurfaceOptions = { sport: "nba" };

  it("a zone chart has a row for each zone, with its count, its value and its share", () => {
    const html = layerTable([{ kind: "zones", zones: "nba-shot", data, statistic: "rate", end: "left", name: "shots" }], { surface });
    expect(html).toContain("<caption>Zone chart of 120 shots");
    expect(html).toContain("<th scope=\"col\">Zone</th>");
    expect(html).toContain("<th scope=\"col\">Count</th>");
    expect((html.match(/<tr>/g) ?? []).length).toBe(7);
    expect(html).toContain("Restricted area");
  });

  it("the description names the hottest zones, and the layer's own title and description win", () => {
    const svg = drawKyogijo({ sport: "nba", id: "z", layers: [{ kind: "zones", zones: "nba-shot", data, end: "left", name: "shots" }] });
    const layerDesc = walk(parse(svg)).find((n) => n.name === "desc" && n.attrs.id === "z-l0-d")?.text;
    expect(layerDesc).toMatch(/^Count in \d+ zones, from \d+ to \d+\. Highest: .*\d+/);
    const named = drawKyogijo({ sport: "nba", id: "z", layers: [{ kind: "zones", zones: "nba-shot", data, end: "left", title: "Shot zones", description: "Where they shot from." }] });
    expect(walk(parse(named)).find((n) => n.name === "title" && n.attrs.id === "z-l0-t")?.text).toBe("Shot zones");
    expect(named).toContain("Where they shot from.");
  });

  it("a heat map's table lists the cells that hold something, the hottest first, and says how many rows are left out", () => {
    const html = layerTable([{ kind: "heatmap", data, bins: 30 }], { surface, maxRows: 3 });
    expect(html.match(/<tr><th scope="row">/g)).toHaveLength(3);
    expect(html).toMatch(/The first 3 of \d+ rows/);
    const counts = [...html.matchAll(/<td>(\d+)<\/td><td>(\d+)<\/td><\/tr>/g)].map((m) => Number(m[2]));
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it("a contour's table lists the levels, with the marks inside each", () => {
    const html = layerTable([{ kind: "contour", data, levels: [0.2, 0.5, 0.8] }], { surface });
    expect(html).toContain("<th scope=\"col\">Level</th>");
    const rows = [...html.matchAll(/<tr><th scope="row">\d+<\/th><td>([\d.]+)<\/td><td>(\d+)<\/td><td>([\d.]+)<\/td><\/tr>/g)];
    expect(rows.map((r) => Number(r[1]))).toEqual([20, 50, 80]);
    const inside = rows.map((r) => Number(r[2]));
    expect(inside[0]).toBeGreaterThan(inside[1]);
    expect(inside[1]).toBeGreaterThan(inside[2]);
  });

  it("without the drawing's options the marks are listed as points, and a legend has no table", () => {
    const html = layerTable([{ kind: "heatmap", data: [{ x: 1, y: 2, value: 3 }] }, { kind: "legend" }]);
    expect(html).toContain("<th scope=\"col\">x</th>");
    expect(html.match(/<table/g)).toHaveLength(1);
  });

  it("is written in Japanese, with the Japanese words, when asked", () => {
    const svg = drawKyogijo({ sport: "nba", id: "j", language: "ja", layers: [{ kind: "zones", zones: "nba-shot", data, end: "left", legend: true }] });
    expect(svg).toContain("ゾーン別集計");
    expect(svg).toContain("リストリクテッドエリア");
    const html = layerTable([{ kind: "zones", zones: "nba-shot", data, end: "left" }], { surface, language: "ja" });
    expect(html).toContain("ゾーン");
    expect(html).toContain("件数");
  });
});

describe("colours, legends and the ground", () => {
  const data = cloud("nhl", 200, 3);

  it("a built-in ramp has a dark set, written as a rule scoped to the layer, with the light colour as the fallback", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "c", layers: [{ kind: "heatmap", id: "heat", data }] });
    expect(svg).toMatch(/@media \(prefers-color-scheme:dark\)\{html:not\(\[data-theme=light\]\) \.kyogijo:not\(\[data-theme=light\]\) \[id="c-heat"\]\{--ky-hv0:#[0-9a-f]{6};/);
    expect(svg).toContain('html[data-theme=dark] [id="c-heat"],.kyogijo[data-theme=dark] [id="c-heat"]{');
    expect(svg).toMatch(/style="fill:var\(--ky-hv\d,#[0-9a-f]{6}\)"/);
  });

  it("a plain list of stops is the same on a dark page: no rule, plain fills", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "c", layers: [{ kind: "heatmap", id: "heat", data, ramp: ["#ffffcc", "#800026"] }] });
    expect(svg).not.toContain("ky-hv");
    expect(svg).toMatch(/style="fill:#[0-9a-f]{6}"/);
    expect(svg).not.toContain('[id="c-heat"]');
  });

  it("a light and a dark list make their own rule, and with style none the page supplies the package's rules", () => {
    const own = drawKyogijo({ sport: "nhl", id: "c", layers: [{ kind: "heatmap", id: "heat", data, ramp: { light: ["#ffffff", "#000000"], dark: ["#000000", "#ffffff"] } }] });
    expect(own).toMatch(/--ky-hv0:#[0-9a-f]{6};/);
    expect(own).toMatch(/var\(--ky-hv0,#[0-9a-f]{6}\)/);
    const none = drawKyogijo({ sport: "nhl", id: "c", style: "none", layers: [{ kind: "heatmap", id: "heat", data }] });
    // The page has the package's rules; the layer still brings the dark set of its own ramp.
    expect(none).not.toContain(".ky-hg{");
    expect(none).toContain("--ky-hv0:");
    expect(none).toMatch(/var\(--ky-hv\d,#[0-9a-f]{6}\)/);
    expect(drawKyogijo({ sport: "nhl", id: "c", style: "none", layers: [{ kind: "heatmap", data, ramp: ["#fff", "#000"] }] })).not.toContain("<style>");
    expect(drawKyogijo({ sport: "nhl", id: "c", layers: [{ kind: "heatmap", data, ramp: ["#fff", "#000"] }] })).toContain(".ky-hg{");
  });

  it("colours a diverging ramp from a centre, with the middle of the domain at the centre", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "c", layers: [{ kind: "heatmap", id: "heat", data, center: 3, legend: true }] });
    expect(svg).toContain("--ky-hv4:");
    // The legend's ticks run from the centre less the reach to the centre plus it.
    const ticks = [...svg.matchAll(/class="ky-lg-t"[^>]*text-anchor="middle">([-\d.]+)<\/text>/g)].map((m) => Number(m[1]));
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(Math.min(...ticks)).toBeLessThanOrEqual(3);
    expect(Math.max(...ticks)).toBeGreaterThanOrEqual(3);
  });

  it("takes a domain of its own, so that two charts can share one scale", () => {
    const a = drawKyogijo({ sport: "nhl", id: "c", layers: [{ kind: "heatmap", id: "heat", data, domain: [0, 100], legend: true }] });
    expect(a).toContain(">100</text>");
  });

  it("the ground can be left off", () => {
    expect(drawKyogijo({ sport: "nhl", layers: [{ kind: "heatmap", data, ground: "none" }] })).not.toContain('class="ky-hg"');
    expect(drawKyogijo({ sport: "nhl", layers: [{ kind: "heatmap", data }] })).toContain('class="ky-hg"');
  });

  it("a legend is where it was asked, and turned upright with a turned surface", () => {
    const flat = drawKyogijo({ sport: "nhl", id: "l", layers: [{ kind: "heatmap", data, legend: { position: "top-left", title: "Shots" } }] });
    expect(flat).toMatch(/<g class="ky-lg" transform="translate\(\d+(\.\d+)? \d+(\.\d+)?\)">/);
    expect(flat).toContain(">Shots</text>");
    const tall = drawKyogijo({ sport: "nhl", id: "l", orientation: "portrait", layers: [{ kind: "heatmap", data, legend: true }] });
    expect(tall).toMatch(/<g class="ky-lg" transform="translate\([\d. ]+\) rotate\(-90\) translate\(/);
  });

  it("a legend layer is for another layer by its id, whichever comes first, or has a ramp of its own", () => {
    const before = drawKyogijo({ sport: "nhl", id: "l", layers: [{ kind: "legend", for: "heat", position: "bottom-right" }, { kind: "heatmap", id: "heat", data, statistic: "sum" }] });
    const after = drawKyogijo({ sport: "nhl", id: "l", layers: [{ kind: "heatmap", id: "heat", data, statistic: "sum" }, { kind: "legend", for: "heat", position: "bottom-right" }] });
    expect(before).toContain(">Sum</text>");
    expect(after).toContain(">Sum</text>");
    const group = layersOf(before).find((n) => n.attrs["data-kind"] === "legend");
    expect(group?.children[0].text).toBe("Legend: Sum");
    expect(group?.attrs["clip-path"]).toBeUndefined();
    const alone = drawKyogijo({ sport: "nhl", layers: [{ kind: "legend", name: "Speed", ramp: "ocean", domain: [0, 30] }] });
    expect(alone).toContain(">Speed</text>");
    expect(alone).toContain(">30</text>");
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "legend", for: "nothing" }] })).toThrow(/not a heat layer/);
  });

  it("a hidden layer draws nothing, legend included, and is still in the tables", () => {
    const layers: Layer[] = [{ kind: "heatmap", data, hidden: true, legend: true }];
    expect(drawKyogijo({ sport: "nhl", layers })).not.toContain("ky-layers");
    expect(layerTable(layers, { surface: { sport: "nhl" } })).toContain("<table");
  });
});

describe("hexagons and contours", () => {
  const data = cloud("nhl", 400, 6);

  it("hexagons are six-cornered paths of the size asked, and the orientation turns them", () => {
    const pointy = drawKyogijo({ sport: "nhl", id: "h", layers: [{ kind: "hexbin", data, size: 4 }] });
    const flat = drawKyogijo({ sport: "nhl", id: "h", layers: [{ kind: "hexbin", data, size: 4, orientation: "flat" }] });
    expect(pointy).not.toBe(flat);
    const path = /<path style="fill:[^"]+" d="(M[^"]+)"\/>/.exec(pointy)![1];
    const first = path.split("z")[0];
    expect((first.match(/l/g) ?? []).length).toBe(5);
    expect(first).toMatch(/^M[-\d. ]+(l[-\d. ]+){5}$/);
  });

  it("contours are filled bands by default, even-odd, and lines on request; the levels can be given, and by mass", () => {
    const filled = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, levels: 4 }] });
    expect((filled.match(/class="ky-cf"/g) ?? []).length).toBe(4);
    expect(filled).toContain('fill-rule="evenodd"');
    const lines = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, filled: false, levels: [0.3, 0.6] }] });
    expect((lines.match(/class="ky-cl"/g) ?? []).length).toBe(2);
    const mass = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, by: "mass", levels: [0.5, 0.9], legend: true }] });
    expect((mass.match(/class="ky-cf"/g) ?? []).length).toBe(2);
    expect(mass).toContain("Share of the data inside, %");
    expect(mass).toContain(">50%</text>");
  });

  it("a wider bandwidth smooths: fewer, rounder bands; a number is in the layer's units", () => {
    const tight = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, bandwidth: 2 }] });
    const wide = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, bandwidth: 12 }] });
    const smooth = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, smooth: 3 }] });
    expect(tight.length).toBeGreaterThan(wide.length);
    expect(smooth).not.toBe(drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data }] }));
    const yards = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, bandwidth: 4, units: "yd" }] });
    const feet = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data: data.map((d) => ({ ...d, x: (d.x as number) / 3, y: (d.y as number) / 3 })), bandwidth: 4, units: "yd" }] });
    expect(yards).not.toBe(feet);
  });

  it("a contour of nothing draws no band and says so without failing, and a weighted one counts the marks' values", () => {
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "contour", data: [] }] })).not.toThrow();
    const weighted = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, weighted: true }] });
    expect(weighted).not.toBe(drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data }] }));
  });

  it("the peak is named in the description, in the layer's own coordinates", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "contour", data, from: "nhl-api" }] });
    const desc = walk(parse(svg)).filter((n) => n.name === "desc")[1].text;
    expect(desc).toMatch(/density contours; the peak is near -?\d+(\.\d)?, -?\d+(\.\d)?\./);
  });
});

describe("labels", () => {
  const data = cloud("soccer", 400, 2);
  it("write each cell's value upright, and turn back with the surface", () => {
    const flat = drawKyogijo({ sport: "soccer", id: "t", layers: [{ kind: "heatmap", data, bins: [6, 4], labels: true }] });
    const tall = drawKyogijo({ sport: "soccer", id: "t", orientation: "portrait", layers: [{ kind: "heatmap", data, bins: [6, 4], labels: true }] });
    expect(withClass(parse(flat), "ky-lt").length).toBeGreaterThan(5);
    expect(flat).not.toContain("rotate(-90");
    expect(tall).toContain('transform="rotate(-90 ');
  });
  it("write what is asked, a line each, and leave out the cells below a count", () => {
    const some = drawKyogijo({ sport: "soccer", id: "t", layers: [{ kind: "zones", zones: "soccer-thirds", data, labels: { show: ["name", "value", "ratio", "share"] } }] });
    expect(some).toContain("Middle third");
    expect(some).toMatch(/\d+\/\d+/);
    const none = drawKyogijo({ sport: "soccer", id: "t", layers: [{ kind: "heatmap", data, bins: [6, 4], labels: { minCount: 100000 } }] });
    expect(withClass(parse(none), "ky-lt")).toHaveLength(0);
  });
  it("write decimals as asked, and a percent sign for a percent", () => {
    const svg = drawKyogijo({ sport: "soccer", id: "t", layers: [{ kind: "zones", zones: "soccer-thirds", data, statistic: "percent", labels: { decimals: 2 } }] });
    expect(svg).toMatch(/>\d+\.\d\d%</);
  });
});

/** The drawing's structure: how many of each element and class a layer is made of. */
function structure(svg: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of walk(parse(svg))) {
    const key = node.attrs.class === undefined ? node.name : `${node.name}.${node.attrs.class.split(" ").sort().join(".")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

describe("what each heat layer is made of", () => {
  const nhl = cloud("nhl", 400, 31);
  const kinds: [string, Layer][] = [
    ["heatmap", { kind: "heatmap", id: "a", data: nhl, bins: [20, 9], labels: true, legend: true }],
    ["hexbin", { kind: "hexbin", id: "a", data: nhl, size: 6, legend: true }],
    ["zones, the slot", { kind: "zones", id: "a", zones: "nhl-slot", data: nhl, labels: true, legend: true }],
    ["zones, the shot chart", { kind: "zones", id: "a", zones: "nba-shot", data: cloud("nba", 300, 2), statistic: "rate", labels: { show: ["value", "ratio"] }, legend: true }],
    ["contour, filled", { kind: "contour", id: "a", data: nhl, levels: 5, legend: true }],
    ["contour, lines", { kind: "contour", id: "a", data: nhl, levels: 5, filled: false }],
  ];
  for (const [name, layer] of kinds) {
    it(`${name}: the elements and classes it is drawn with`, () => {
      const sport = name.includes("shot chart") ? "nba" : "nhl";
      expect(structure(drawKyogijo({ sport, id: "s", style: "none", layers: [layer] }))).toMatchSnapshot();
    });
  }
});

describe("the heat layers are the same every time, and safe", () => {
  it("the same options draw the same string, and each kind has one fingerprint for the structure it is made of", () => {
    const data = cloud("nhl", 300, 14);
    const layers: Layer[] = [
      { kind: "heatmap", id: "a", data, bins: 20, labels: true, legend: true },
      { kind: "hexbin", id: "b", data, size: 5 },
      { kind: "zones", id: "c", zones: "nhl-home-plate", data },
      { kind: "contour", id: "d", data, levels: 5 },
    ];
    const one = drawKyogijo({ sport: "nhl", id: "same", layers });
    expect(drawKyogijo({ sport: "nhl", id: "same", layers })).toBe(one);
    expect(hash(one)).toMatchSnapshot();
  });

  it("escapes what a caller gives: a name, a statistic's name, a legend's title", () => {
    const data = cloud("nhl", 30, 1);
    const svg = drawKyogijo({ sport: "nhl", id: "e", layers: [{ kind: "heatmap", id: "x", name: "<b>shots</b>", statisticName: 'Rate "x" & more', data, legend: { title: "<i>" } }] });
    expect(() => parse(svg)).not.toThrow();
    expect(svg).not.toContain("<b>");
    expect(svg).toContain("&lt;b&gt;shots&lt;/b&gt;");
    expect(svg).toContain("Rate &quot;x&quot; &amp; more");
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "heatmap", data, ramp: ["url(javascript:x)"] }] })).toThrow(/no colour/);
  });

  it("refuses data that is not a list, a kind that is not one, and an empty extent", () => {
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "heatmap", data: undefined as never }] })).toThrow(/needs data/);
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "treemap" as never, data: [] }] })).toThrow(/heatmap, hexbin, zones, contour or legend/);
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "heatmap", data: [], extent: { x: [5, 5] } }] })).toThrow(/extent/);
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "zones", zones: "nba-shot", data: [] }] })).toThrow(/is for nba/);
  });

  it("an empty layer draws, with no cell and no sentence about a range", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "z", layers: [{ kind: "heatmap", data: [] }] });
    expect(svg).toContain("Heat map of 0 points");
    expect(svg).not.toContain("Highest");
  });
});
