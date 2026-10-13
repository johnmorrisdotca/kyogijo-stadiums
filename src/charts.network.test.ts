import { describe, expect, it } from "vitest";
import { passNetwork, type PassNetworkPass } from "./charts.network.ts";
import { hash } from "./format.ts";
import { parseXml, withClass } from "./xml.fixture.ts";

function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 400 passes among 11 players, seeded: the same every time. */
const match = (): PassNetworkPass[] => {
  const next = random(42);
  return Array.from({ length: 400 }, (): PassNetworkPass => {
    const a = 1 + Math.floor(next() * 11);
    const b = 1 + ((a + Math.floor(next() * 3)) % 11);
    return { from: a, to: b === a ? (a % 11) + 1 : b, x: 8 + a * 8 + next() * 5, y: 10 + ((a * 17) % 80) + next() * 5, x2: 8 + b * 8, y2: 10 + ((b * 17) % 80), team: "home", fromNumber: a, toNumber: b };
  });
};

describe("passNetwork", () => {
  const chart = passNetwork(match(), { provider: "opta", id: "pn" });

  it("gives what every chart gives, with the network and the key", () => {
    expect(Object.keys(chart).sort()).toEqual(["draw", "key", "layers", "options", "summary", "table", "title", "totals"]);
    expect(chart.layers.map((layer) => layer.id)).toEqual(["network", "key-marks", "key-text"]);
    expect(chart.options.sport).toBe("soccer");
    expect(chart.options.pitchType).toBe("opta");
    expect(chart.title).toBe("Pass network");
  });

  it("counts the passes, the players and the links of at least three passes, and names the busiest player and the strongest link", () => {
    expect(chart.totals.passes).toBe(400);
    expect(chart.totals.skipped).toBe(0);
    expect(chart.totals.players).toBe(11);
    expect(chart.totals.links).toBeGreaterThan(5);
    expect(chart.totals.busiest?.touches).toBeGreaterThan(60);
    expect(chart.totals.strongest?.passes).toBeGreaterThan(10);
    expect(chart.summary).toBe(`Passes 400, players 11, links ${chart.totals.links}.`);
    const every = passNetwork(match(), { provider: "opta", minPasses: 1 });
    expect(every.totals.links).toBeGreaterThanOrEqual(chart.totals.links);
  });

  it("draws a well-formed pitch with a title and a description for the network, and a key that says what size and width mean", () => {
    const svg = chart.draw();
    const doc = parseXml(svg);
    const layer = withClass(doc, "ky-layer").find((n) => n.attrs["data-kind"] === "network");
    expect(layer?.children[0].text).toMatch(/^Pass network: 11 players, \d+ links from 400 passes$/);
    expect(svg).toContain("Node size: touches");
    expect(svg).toContain("Link width: passes");
    expect(chart.draw()).toBe(svg);
  });

  it("leaves the key out of a tall drawing, and in Japanese is in Japanese", () => {
    expect(chart.draw({ orientation: "portrait" })).not.toContain("Node size: touches");
    const ja = passNetwork(match(), { provider: "opta", language: "ja", id: "pn" });
    expect(ja.title).toBe("パスネットワーク");
    expect(ja.draw()).toContain("円の大きさ：タッチ数");
    expect(ja.summary).toMatch(/^パス400本、選手11人/);
    expect(ja.table()).toContain("タッチ数");
  });

  it("has a table of the players and a table of the links", () => {
    const html = chart.table();
    expect(html.match(/<table /g)).toHaveLength(2);
    expect(html).toContain("<th scope=\"col\">Touches</th>");
    expect(html).toContain("<th scope=\"col\">Passes</th>");
    expect(html.match(/<tr>/g)?.length).toBeGreaterThan(12);
  });

  it("takes any provider's frame, and a team that attacks the left, and the options of the network", () => {
    const left = passNetwork(match(), { provider: "statsbomb", attacking: "left", directed: true, labels: "id", minPasses: 4 });
    expect(left.options.pitchType).toBe("statsbomb");
    expect(left.draw()).toContain('class="ky-ah"');
    expect(left.layers[0]).toMatchObject({ kind: "network", attacking: "left", directed: true, labels: "id", minPasses: 4, from: "statsbomb" });
    expect(passNetwork([], {}).totals).toEqual({ passes: 0, skipped: 0, players: 0, links: 0, busiest: null, strongest: null });
    expect(() => passNetwork(3 as never)).toThrow(/list of passes/);
  });

  it("has the same layers, as plain data that can be saved, every time", () => {
    expect(JSON.parse(JSON.stringify(chart.layers))).toEqual(chart.layers);
    expect(hash(chart.draw())).toBe(hash(passNetwork(match(), { provider: "opta", id: "pn" }).draw()));
    expect(hash(chart.draw())).toMatchSnapshot();
  });

  it("stays within its budget: a match of 400 passes draws under 40 kB, stylesheets and key in, in under 100 ms", () => {
    const start = performance.now();
    const svg = passNetwork(match(), { provider: "opta", id: "pn" }).draw();
    const took = performance.now() - start;
    expect(svg.length, `${svg.length} bytes`).toBeLessThan(40_000);
    expect(took, `${Math.round(took)} ms`).toBeLessThan(100);
  });
});
