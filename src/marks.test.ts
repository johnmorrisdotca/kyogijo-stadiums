import { describe, expect, it } from "vitest";
import { nbaShotChart } from "./charts-entry.ts";
import { drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import type { Layer } from "./layers.types.ts";

const attr = /data-mark-id|data-index|data-zone/;
const points = (n: number, id = false): Layer[] => [{ kind: "points", data: Array.from({ length: n }, (_, i) => ({ x: 20 + ((i * 37) % 160), y: 5 + ((i * 53) % 75), ...(id ? { id: `s${i}` } : {}) })) }];
const cells = (marks?: boolean): Layer[] => [{ kind: "heatmap", bins: [50, 30], ...(marks === undefined ? {} : { marks }), data: Array.from({ length: 3000 }, (_, i) => ({ x: ((i * 71) % 2000) / 10, y: ((i * 29) % 850) / 10 })) }];

describe("the marks' data attributes are opt in", () => {
  it("are not written by default, so a drawing stays compact", () => {
    expect(drawKyogijo({ sport: "nhl", layers: points(5) })).not.toMatch(attr);
    expect(drawKyogijo({ sport: "nhl", layers: cells() })).not.toMatch(attr);
  });

  it("are written when the drawing says marks: true, or pointer: true", () => {
    for (const on of [{ marks: true }, { pointer: true }]) {
      const svg = drawKyogijo({ sport: "nhl", ...on, layers: points(3) });
      expect(svg).toContain('data-mark-id="0" data-index="0" data-zone="');
      expect(svg).toContain('data-mark-id="2" data-index="2"');
    }
  });

  it("are written for a layer that has an id on any datum, and for that layer alone", () => {
    const layers: Layer[] = [...points(2, true), { kind: "points", id: "plain", data: [{ x: 50, y: 10 }] }];
    const svg = drawKyogijo({ sport: "nhl", layers });
    expect(svg).toContain('data-mark-id="s0"');
    expect(svg).toContain('data-mark-id="s1"');
    expect(svg.match(/data-mark-id/g)).toHaveLength(2);
  });

  it("is told by a layer's own marks, over the drawing's and the ids'", () => {
    expect(drawKyogijo({ sport: "nhl", marks: true, layers: [{ kind: "points", marks: false, data: [{ x: 50, y: 10 }] }] })).not.toMatch(attr);
    expect(drawKyogijo({ sport: "nhl", layers: [{ kind: "points", marks: true, data: [{ x: 50, y: 10 }] }] })).toContain('data-mark-id="0"');
    expect(drawKyogijo({ sport: "nhl", layers: [{ kind: "points", marks: false, data: [{ x: 50, y: 10, id: "a" }] }] })).not.toMatch(attr);
  });

  it("reach every kind of mark when they are on", () => {
    const svg = drawKyogijo({
      sport: "nhl",
      marks: true,
      layers: [
        { kind: "lines", data: [{ x: 60, y: 10, x2: 120, y2: 40 }] },
        { kind: "arrows", data: [{ x: 60, y: 10, x2: 120, y2: 40 }] },
        { kind: "text", data: [{ x: 100, y: 40, text: "A" }] },
        { kind: "zones", zones: "nhl-slot", data: [{ x: 169, y: 42 }] },
        { kind: "contour", data: Array.from({ length: 60 }, (_, i) => ({ x: 150 + (i % 9), y: 30 + (i % 11) })) },
      ],
    });
    expect(svg).toContain('data-zone-end="');
    expect(svg).toMatch(/<text[^>]*data-mark-id="0"/);
    expect(svg).toMatch(/class="ky-zn"[^>]*data-zone="/);
    expect(svg).toMatch(/class="ky-cf"[^>]*data-mark-id="0" data-index="0"/);
    expect(svg).toMatch(/data-kind="arrows"/);
  });

  it("make a heat map's cells paths of their own, each with its zone, and only then", () => {
    const merged = drawKyogijo({ sport: "nhl", id: "h", layers: cells() });
    const own = drawKyogijo({ sport: "nhl", id: "h", layers: cells(true) });
    expect(own.length).toBeGreaterThan(merged.length * 2);
    expect(own).toMatch(/<g style="fill:[^"]+"><path d="M[^"]+" data-mark-id="\d+" data-index="\d+" data-zone="[a-z-]+"\/>/);
    expect(merged).not.toContain("<g style=");
    expect(drawKyogijo({ sport: "nhl", id: "h", marks: true, layers: cells(false) })).toBe(merged);
  });

  it("have a budget: 1,000 points under 130 kB, a 50 by 30 heat map under 150 kB with every one of its 1,500 cells filled (about 90 bytes a cell)", () => {
    const bare = drawKyogijo({ sport: "nhl", id: "b" }).length;
    expect(drawKyogijo({ sport: "nhl", id: "b", marks: true, layers: points(1000) }).length - bare).toBeLessThan(130_000);
    expect(drawKyogijo({ sport: "nhl", id: "b", layers: cells(true) }).length - bare).toBeLessThan(150_000);
  });

  it("are one fingerprint for the structure of the marked drawing", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "m", marks: true, layers: [...points(8), ...cells(), { kind: "lines", data: [{ x: 60, y: 10, x2: 120, y2: 40 }] }] });
    expect(hash(svg)).toMatchSnapshot();
  });

  it("go through a chart: a shot's id is written on its mark, and a chart with no ids is compact", () => {
    const shots = [{ x: 0, y: 30, made: true, id: "q1" }, { x: 80, y: 120, made: false, id: "q2" }];
    const chart = nbaShotChart(shots).draw();
    expect(chart).toContain('data-mark-id="q1"');
    expect(chart).toContain('data-index="1"');
    expect(nbaShotChart(shots.map(({ x, y, made }) => ({ x, y, made }))).draw()).not.toMatch(attr);
    expect(nbaShotChart(shots.map(({ x, y, made }) => ({ x, y, made })), { surface: { marks: true } }).draw()).toContain('data-mark-id="0"');
  });
});
