import { describe, expect, it } from "vitest";
import { seeded, shotMap, passMap, sprayChart } from "../demo/layers-data.js";
import { SPORTS, drawKyogijo, drawSurface } from "./draw.ts";
import { hash } from "./format.ts";
import { OUTCOMES, drawLayers, layerTable } from "./layers.ts";
import { curveBetween, rampColour, shapePath, wavePath } from "./layers.marks.ts";
import type { Layer, PointDatum } from "./layers.types.ts";
import { outlineOf } from "./outline.ts";
import type { Sport } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const parse = (svg: string): Node => parseXml(svg);
const sample = (sport: Sport): Layer[] => {
  const mid = sport === "mlb" ? [0, -150] : [60, 30];
  return [
    { kind: "points", name: "shots", data: [{ x: mid[0], y: mid[1], team: "home", outcome: "goal", title: "A goal" }, { x: mid[0] + 10, y: mid[1] + 5, team: "away", outcome: "shot", shape: "triangle" }] },
    { kind: "arrows", name: "passes", data: [{ x: mid[0], y: mid[1], x2: mid[0] + 30, y2: mid[1] - 10, outcome: "incomplete" }] },
    { kind: "lines", data: [{ points: [[mid[0], mid[1]], [mid[0] + 5, mid[1] + 9], [mid[0] + 20, mid[1] + 9]] }] },
    { kind: "text", data: [{ x: mid[0], y: mid[1] + 12, text: 7 }] },
  ];
};

describe("layers on every surface", () => {
  for (const sport of SPORTS) {
    it(`${sport}: well-formed in every orientation, in a score, with a clip, a title and a description for each layer`, () => {
      const away = { name: "Gulls", score: 1, color: "#1f5fa8" };
      const home = { name: "Bison", score: 2, color: "#b5452c" };
      for (const options of [{ sport }, { sport, orientation: "portrait" as const }, { sport, away, home }, { sport, away, home, size: "compact" as const }]) {
        const svg = parse(drawKyogijo({ ...options, id: "x", layers: sample(sport) }));
        const group = withClass(svg, "ky-layers")[0];
        expect(group, "the layers' group").toBeDefined();
        const clip = walk(svg).find((n) => n.name === "clipPath" && n.attrs.id === "x-lc");
        expect(clip?.attrs.id).toBe("x-lc");
        const layers = withClass(svg, "ky-layer");
        expect(layers).toHaveLength(4);
        for (const layer of layers) {
          expect(layer.attrs["clip-path"]).toBe("url(#x-lc)");
          expect(layer.children[0].name).toBe("title");
        }
        expect(layers[0].children[0].text).toBe("2 shots");
        expect(layers[0].children[1].text).toBe("By outcome: goal 1, shot 1. By team: home 1, away 1.");
        expect(walk(svg).find((n) => n.name === "desc")?.text).toContain("Data: 2 shots.");
      }
    });
  }

  it("badges draw no data, because there is no surface", () => {
    const svg = drawKyogijo({ sport: "nhl", size: "badge", away: { name: "A" }, home: { name: "B" }, layers: sample("nhl") });
    expect(svg).not.toContain("ky-layers");
  });

  it("are drawn over the lines and under the score's plate", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "p", away: { name: "A", score: 1 }, home: { name: "B", score: 2 }, layers: sample("nhl") });
    const at = svg.indexOf('<g class="ky-layers"');
    expect(at).toBeGreaterThan(svg.lastIndexOf('class="ky-red"'));
    expect(at).toBeLessThan(svg.indexOf('class="ky-plate-bg"'));
  });
});

describe("where marks go", () => {
  it("surface coordinates are drawn as they are, in feet", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", id: "c", layers: [{ kind: "points", data: [{ x: 100, y: 42.5 }] }] }));
    const circle = withClass(svg, "ky-pts")[0].children.find((n) => n.name === "circle");
    expect([circle?.attrs.cx, circle?.attrs.cy]).toEqual(["100", "42.5"]);
  });

  it("a frame's numbers are put on the surface by toSurface", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", id: "f", layers: [{ kind: "points", from: "nhl-api", data: [{ x: 69, y: 22 }] }] }));
    const circle = withClass(svg, "ky-pts")[0].children.find((n) => n.name === "circle");
    expect([circle?.attrs.cx, circle?.attrs.cy]).toEqual(["169", "20.5"]);
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "points", from: "no-such-frame", data: [{ x: 1, y: 1 }] }] })).toThrow(/Unknown frame/);
  });

  it("a team that attacks the left is turned to the right", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", id: "a", layers: [{ kind: "points", from: "nhl-api", attacking: "left", data: [{ x: 69, y: 22 }] }] }));
    const circle = withClass(svg, "ky-pts")[0].children.find((n) => n.name === "circle");
    expect([circle?.attrs.cx, circle?.attrs.cy]).toEqual(["31", "64.5"]);
  });

  it("the layer's units, and the drawing's, say what its numbers are", () => {
    const at = (o: object): string[] => {
      const svg = parse(drawKyogijo({ sport: "nhl", id: "u", ...o }));
      const c = withClass(svg, "ky-pts")[0].children.find((n) => n.name === "circle");
      return [c?.attrs.cx ?? "", c?.attrs.r ?? ""];
    };
    const feet = at({ layers: [{ kind: "points", data: [{ x: 60, y: 30, size: 3 }] }] });
    expect(at({ layers: [{ kind: "points", units: "yd", data: [{ x: 20, y: 10, size: 1 }] }] })).toEqual(feet);
    expect(at({ units: "yd", layers: [{ kind: "points", data: [{ x: 20, y: 10, size: 1 }] }] })).toEqual(feet);
    expect(at({ layers: [{ kind: "points", units: "rulebook", data: [{ x: 60, y: 30, size: 3 }] }] })).toEqual(feet);
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "points", units: "furlong" as never, data: [] }] })).toThrow(/Unknown units/);
  });

  it("limits hold a mark on the surface instead of cutting it", () => {
    const svg = parse(drawKyogijo({ sport: "nba", id: "l", layers: [{ kind: "points", limits: "surface", data: [{ x: 500, y: -40 }] }] }));
    const c = withClass(svg, "ky-pts")[0].children.find((n) => n.name === "circle");
    expect([c?.attrs.cx, c?.attrs.cy]).toEqual(["94", "0"]);
  });

  it("clip: none leaves a layer uncut", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", layers: [{ kind: "points", clip: "none", data: [{ x: 1, y: 1 }] }] }));
    expect(withClass(svg, "ky-layer")[0].attrs["clip-path"]).toBeUndefined();
    expect(walk(svg).some((n) => n.name === "clipPath")).toBe(false);
  });

  it("the clip is the surface's outline: the rink's rounded corners, a ballpark's fence, a court's lines", () => {
    expect(outlineOf({ sport: "nhl" }).d).toContain("A28 28");
    expect(outlineOf({ sport: "nba" }).box).toEqual({ x: 0, y: 0, w: 94, h: 50 });
    expect(outlineOf({ sport: "nfl" }).box).toEqual({ x: 0, y: 0, w: 360, h: 160 });
    const fence = outlineOf({ sport: "mlb", park: "fenway-park" });
    expect(fence.d.startsWith("M0 0L")).toBe(true);
    expect(fence.box.h).toBeGreaterThan(300);
    expect(outlineOf({ sport: "mlb", fence: { center: 500 } }).box.h).toBeGreaterThan(outlineOf({ sport: "mlb" }).box.h);
  });
});

describe("a tall surface", () => {
  it("keeps the text and the shapes upright by turning them back a quarter", () => {
    const layers: Layer[] = [{ kind: "text", data: [{ x: 50, y: 20, text: "Hi", rotate: 10 }] }, { kind: "points", data: [{ x: 50, y: 20, shape: "triangle", size: 4 }] }];
    const wide = parse(drawKyogijo({ sport: "nhl", id: "w", layers }));
    const tall = parse(drawKyogijo({ sport: "nhl", id: "w", orientation: "portrait", layers }));
    expect(withClass(wide, "ky-lt")[0].attrs.transform).toBe("rotate(10 50 20)");
    expect(withClass(tall, "ky-lt")[0].attrs.transform).toBe("rotate(-80 50 20)");
    const up = withClass(wide, "ky-pts")[0].children.find((n) => n.name === "path")?.attrs.d;
    const turned = withClass(tall, "ky-pts")[0].children.find((n) => n.name === "path")?.attrs.d;
    expect(up).not.toBe(turned);
    // The triangle's tip is above its centre as the eye sees it: in the turned frame (turned a quarter clockwise) that is to the left of the centre's x... which `shapePath` computes.
    expect(shapePath("triangle", 0, 0, 2, false).startsWith("M0 -1.2")).toBe(true);
    expect(shapePath("triangle", 0, 0, 2, true).startsWith("M-1.2 0")).toBe(true);
  });

  it("a ballpark's text is not turned (the field is not)", () => {
    const svg = parse(drawKyogijo({ sport: "mlb", id: "b", orientation: "portrait", layers: [{ kind: "text", data: [{ x: 0, y: -100, text: "9" }] }] }));
    expect(withClass(svg, "ky-lt")[0].attrs.transform).toBeUndefined();
  });
});

describe("marks", () => {
  const first = (svg: Node, cls: string): Node => withClass(svg, cls)[0];
  const points = (data: PointDatum[], style = {}): Node => withClass(parse(drawKyogijo({ sport: "nhl", id: "m", layers: [{ kind: "points", data, style }] })), "ky-pts")[0];

  it("have every shape, and a logo", () => {
    for (const shape of ["circle", "square", "triangle", "diamond", "cross", "x", "star"] as const) {
      const mark = points([{ x: 10, y: 10, shape }]).children.at(-1);
      expect(mark?.name).toBe(shape === "circle" ? "circle" : "path");
    }
    const logo = points([{ x: 10, y: 10, shape: "logo", logo: "https://example.com/a.svg" }]).children.at(-1);
    expect(logo?.name).toBe("image");
    expect(logo?.attrs.href).toBe("https://example.com/a.svg");
    expect(points([{ x: 10, y: 10, shape: "logo", logo: "javascript:alert(1)" }]).children.at(-1)?.name).toBe("circle");
  });

  it("take a team's logo from a score", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", id: "t", away: { name: "A" }, home: { name: "H", logo: "https://example.com/h.png" }, layers: [{ kind: "points", style: { shape: "logo" }, data: [{ x: 5, y: 5, team: "home" }, { x: 9, y: 9, team: "away" }] }] }));
    const marks = withClass(svg, "ky-pts")[0].children.filter((n) => n.name === "image" || n.name === "circle");
    expect(marks.map((n) => n.name)).toEqual(["image", "circle"]);
  });

  it("are filled for a goal and hollow for a shot, by the standard words and your own", () => {
    expect(Object.keys(OUTCOMES)).toEqual(expect.arrayContaining(["goal", "made", "missed", "shot"]));
    const group = points([{ x: 1, y: 1, outcome: "goal" }, { x: 2, y: 2, outcome: "shot" }, { x: 3, y: 3, outcome: "whiff" }, { x: 4, y: 4, outcome: "Missed" }], { outcomes: { whiff: { hollow: true } } });
    const marks = group.children.filter((n) => n.name === "circle");
    expect(marks.map((n) => (n.attrs.class ?? "").includes("ky-hol"))).toEqual([false, true, true, true]);
    expect(Number(marks[0].attrs.r)).toBeGreaterThan(Number(marks[1].attrs.r));
  });

  it("are sized by value, in area, between the range", () => {
    const group = points([{ x: 1, y: 1, value: 0 }, { x: 2, y: 2, value: 0.5 }, { x: 3, y: 3, value: 1 }], { size: { range: [2, 6] } });
    const r = group.children.filter((n) => n.name === "circle").map((n) => Number(n.attrs.r));
    expect(r[0]).toBeCloseTo(1, 1);
    expect(r[2]).toBeCloseTo(3, 1);
    expect(r[1]).toBeGreaterThan(r[0]);
    expect(r[1]).toBeLessThan(r[2]);
  });

  it("are coloured by value, by team, by outcome, or by their own colour", () => {
    const value = points([{ x: 1, y: 1, value: 0 }, { x: 2, y: 2, value: 1 }], { fill: { by: "value", stops: ["#000000", "#ffffff"] } });
    expect(value.children.filter((n) => n.name === "circle").map((n) => n.attrs.style)).toEqual(["--c:#000000", "--c:#ffffff"]);
    const team = points([{ x: 1, y: 1, team: "home" }, { x: 2, y: 2, team: "away" }, { x: 3, y: 3 }]);
    expect(team.children.filter((n) => n.name === "circle").map((n) => n.attrs.class ?? "")).toEqual(["ky-h", "ky-a", ""]);
    const outcome = points([{ x: 1, y: 1, outcome: "goal" }], { fill: { by: "outcome", colors: { goal: "gold" } } });
    expect(outcome.children.at(-1)?.attrs.style).toBe("--c:gold");
    const own = points([{ x: 1, y: 1, color: "#123456" }]);
    expect(own.children.at(-1)?.attrs.style).toBe("--c:#123456");
    expect(points([{ x: 1, y: 1 }], { fill: "#abcdef" }).attrs.style).toContain("--c:#abcdef");
  });

  it("skip a point with no place, and say so", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", id: "s", layers: [{ kind: "points", data: [{ x: 1, y: 1 }, { x: null, y: 2 }, { x: Number.NaN, y: 2 }, { x: 3, y: 3 }] }] }));
    const layer = first(svg, "ky-pts");
    expect(layer.children.filter((n) => n.name === "circle")).toHaveLength(2);
    expect(layer.children[0].text).toBe("2 points");
    expect(layer.children[1].text).toContain("2 left out");
  });

  it("have a tooltip when they carry a title", () => {
    expect(points([{ x: 1, y: 1, title: "A <b> & \"c\"" }]).children.at(-1)?.children[0].text).toBe("A &lt;b&gt; &amp; &quot;c&quot;");
  });
});

describe("lines and arrows", () => {
  const lines = (layer: Layer): Node => withClass(parse(drawKyogijo({ sport: "nhl", id: "n", layers: [layer] })), "ky-lns")[0];

  it("lines are plain paths and arrows are a shaft with a head", () => {
    const line = lines({ kind: "lines", data: [{ x: 10, y: 10, x2: 50, y2: 30 }] });
    expect(line.children.at(-1)?.name).toBe("path");
    expect(line.children.at(-1)?.attrs.d).toBe("M10 10L50 30");
    const arrow = lines({ kind: "arrows", data: [{ x: 10, y: 10, x2: 50, y2: 10 }] }).children.at(-1);
    expect(arrow?.name).toBe("g");
    expect(arrow?.children.map((n) => n.attrs.class)).toEqual(["ky-ln", "ky-ah"]);
    // The shaft stops short of the tip, which is where the head's point stands.
    expect(arrow?.children[1].attrs.d.startsWith("M50 10L")).toBe(true);
    expect(Number(/L([\d.]+) 10$/.exec(arrow?.children[0].attrs.d ?? "")?.[1])).toBeLessThan(50);
  });

  it("curve, wave, open heads and a path through points", () => {
    const bowed = lines({ kind: "arrows", data: [{ x: 10, y: 10, x2: 50, y2: 10, curve: 0.2 }] }).children.at(-1);
    expect(bowed?.children[0].attrs.d).toMatch(/Q/);
    const wavy = lines({ kind: "arrows", style: { wavy: true }, data: [{ x: 10, y: 10, x2: 90, y2: 10 }] }).children.at(-1);
    expect(wavy?.children[0].attrs.d).toMatch(/Q.*T/);
    const open = lines({ kind: "arrows", style: { head: "open" }, data: [{ x: 10, y: 10, x2: 50, y2: 10 }] }).children.at(-1);
    expect(open?.children[1].attrs.class).toBe("ky-ln");
    const path = lines({ kind: "lines", data: [{ points: [[1, 1], [10, 5], [20, 5]] }] }).children.at(-1);
    expect(path?.attrs.d).toBe("M1 1L10 5L20 5");
  });

  it("dash a failed pass, and not a complete one", () => {
    const group = lines({ kind: "lines", data: [{ x: 1, y: 1, x2: 40, y2: 1, outcome: "complete" }, { x: 1, y: 2, x2: 40, y2: 2, outcome: "incomplete" }] });
    const paths = group.children.filter((n) => n.name === "path");
    expect(paths[0].attrs["stroke-dasharray"]).toBeUndefined();
    expect(paths[1].attrs["stroke-dasharray"]).toMatch(/^[\d.]+ [\d.]+$/);
  });

  it("comets fade in along their length with a gradient of their own, ids kept to the drawing", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", id: "k", layers: [{ kind: "lines", style: { comet: true }, data: [{ x: 1, y: 1, x2: 60, y2: 1 }, { x: 1, y: 9, x2: 60, y2: 20 }] }, { kind: "arrows", style: { comet: { taper: true } }, data: [{ x: 1, y: 30, x2: 60, y2: 30 }] }] }));
    const gradients = walk(svg).filter((n) => n.name === "linearGradient");
    expect(gradients.map((g) => g.attrs.id)).toEqual(["k-l0-g0", "k-l0-g1", "k-l1-g0"]);
    expect(gradients[0].attrs.gradientUnits).toBe("userSpaceOnUse");
    const ids = walk(svg).map((n) => n.attrs.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    const tapered = withClass(svg, "ky-cm")[0];
    expect(tapered.attrs.style).toBe("fill:url(#k-l1-g0)");
  });

  it("two drawings that differ do not share an id", () => {
    const a = drawKyogijo({ sport: "nhl", layers: [{ kind: "lines", style: { comet: true }, data: [{ x: 1, y: 1, x2: 60, y2: 1 }] }] });
    const b = drawKyogijo({ sport: "nhl", layers: [{ kind: "lines", style: { comet: true }, data: [{ x: 2, y: 1, x2: 60, y2: 1 }] }] });
    const id = (svg: string): string => /linearGradient id="([^"]+)"/.exec(svg)?.[1] ?? "";
    expect(id(a)).not.toBe(id(b));
  });

  it("skip a line that goes nowhere", () => {
    const group = lines({ kind: "lines", data: [{ x: 1, y: 1, x2: 1, y2: 1 }, { x: 1, y: 1, x2: 9, y2: 9 }] });
    expect(group.children.filter((n) => n.name === "path")).toHaveLength(1);
  });
});

describe("text", () => {
  it("is escaped, haloed, anchored, and may be a number", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", id: "t", layers: [{ kind: "text", data: [{ x: 1, y: 1, text: "<script>&" }, { x: 2, y: 2, text: 12, anchor: "start" }, { x: 3, y: 3, text: "" }] }] }));
    const texts = withClass(svg, "ky-lt");
    expect(texts.map((t) => t.text)).toEqual(["&lt;script&gt;&amp;", "12"]);
    expect(texts[1].attrs["text-anchor"]).toBe("start");
    expect(withClass(svg, "ky-txt")[0].attrs["text-anchor"]).toBe("middle");
    const bare = parse(drawKyogijo({ sport: "nhl", id: "t", layers: [{ kind: "text", style: { halo: false }, data: [{ x: 1, y: 1, text: "a" }] }] }));
    expect(withClass(bare, "ky-lt")[0].attrs.class).toBe("ky-lt ky-nh");
  });
});

describe("safety", () => {
  const hostile = "\"><script>alert(1)</script><x a=\"";
  it("every text and colour from the caller is escaped or refused", () => {
    const svg = drawKyogijo({
      sport: "nhl",
      id: "h",
      layers: [
        { kind: "points", name: hostile, title: hostile, description: hostile, data: [{ x: 1, y: 1, title: hostile, team: hostile, outcome: hostile, color: "red;fill:url(javascript:1)", shape: hostile as never, logo: hostile }], style: { fill: { by: "outcome", colors: { [hostile]: "red\"onload=\"x" } }, stroke: "x;y" } },
        { kind: "lines", id: hostile, data: [{ x: 1, y: 1, x2: 9, y2: 9, title: hostile, color: "url(#x)" }], style: { color: "blue;x:y" } },
        { kind: "text", data: [{ x: 1, y: 1, text: hostile, color: "#12" }] },
      ],
    });
    expect(() => parse(svg)).not.toThrow();
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("javascript");
    expect(svg).not.toMatch(/onload/);
    expect(withClass(parse(svg), "ky-layer").length).toBe(3);
  });

  it("refuses what is not a layer", () => {
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "heat" } as never] })).toThrow(/kind "heat"/);
    expect(() => drawKyogijo({ sport: "nhl", layers: [{ kind: "points" } as never] })).toThrow(/needs data/);
    expect(() => drawKyogijo({ sport: "nhl", layers: [null as never] })).toThrow(/not a layer/);
  });
});

describe("theming", () => {
  it("is by custom properties in the stylesheet, which style: none leaves out", () => {
    const layers: Layer[] = [{ kind: "points", data: [{ x: 1, y: 1 }] }];
    const styled = drawKyogijo({ sport: "nhl", layers });
    expect(styled).toContain("--ky-layer-home:#1f5fa8");
    expect(styled).toContain(".kyogijo .ky-pts>*");
    expect(drawKyogijo({ sport: "nhl", layers, style: "none" })).not.toContain("--ky-layer-home");
  });

  it("takes colours from `colors`, and the teams' own in a score", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "c", colors: { layerAway: "#00ff00", layer: "black" }, away: { name: "A", color: "#111111" }, home: { name: "H", color: "#222222" }, layers: [{ kind: "points", data: [{ x: 1, y: 1 }] }] });
    const style = parse(svg).attrs.style;
    expect(style).toContain("--ky-layer-away:#00ff00");
    expect(style).not.toContain("--ky-layer-away:#111111");
    expect(style).toContain("--ky-layer-home:#222222");
    expect(style).toContain("--ky-layer:black");
  });
});

describe("accessibility", () => {
  it("a layer's own title and description win, and the drawing's description says them unless it was given", () => {
    const layers: Layer[] = [{ kind: "points", title: "Shots on goal", description: "Mostly from the slot.", data: [{ x: 1, y: 1 }] }];
    const svg = parse(drawKyogijo({ sport: "nhl", id: "a", layers }));
    expect(withClass(svg, "ky-layer")[0].children[0].text).toBe("Shots on goal");
    expect(walk(svg).find((n) => n.name === "desc")?.text).toContain("Data: Shots on goal. Mostly from the slot.");
    const own = parse(drawKyogijo({ sport: "nhl", id: "a", description: "Mine.", layers }));
    expect(walk(own).find((n) => n.name === "desc")?.text).toBe("Mine.");
  });

  it("speaks Japanese when asked", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", id: "j", language: "ja", layers: [{ kind: "points", name: "シュート", data: [{ x: 1, y: 1, outcome: "goal" }] }] }));
    expect(withClass(svg, "ky-layer")[0].children[0].text).toBe("シュート 1件");
  });

  it("layerTable is a table for each layer, with its numbers as text, escaped", () => {
    const html = layerTable([
      { kind: "points", name: "shots", from: "nhl-api", data: [{ x: 69, y: 22, outcome: "goal", team: "home", value: 0.31, title: "<b>Goal</b>" }, { x: -40, y: 3, outcome: "shot", team: "away" }] },
      { kind: "arrows", name: "passes", data: [{ x: 1, y: 2, x2: 3, y2: 4 }] },
      { kind: "text", data: [{ x: 1, y: 2, text: "a & b" }] },
    ]);
    expect((html.match(/<table /g) ?? []).length).toBe(3);
    const doc = html.split("</table>").filter(Boolean);
    expect(doc[0]).toContain("<caption>2 shots <small>Coordinates in nhl-api, in ft.</small></caption>");
    expect(doc[0]).toContain('<th scope="col">Outcome</th>');
    expect(doc[0]).toContain("<td>0.31</td>");
    expect(doc[0]).toContain("&lt;b&gt;Goal&lt;/b&gt;");
    expect(doc[1]).toContain('<th scope="col">to x</th>');
    expect(doc[2]).toContain("<td>a &amp; b</td>");
    expect(html).not.toContain("<b>");
    expect(layerTable([{ kind: "points", data: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }] }], { maxRows: 2 })).toContain("The first 2 of 3 rows.");
    expect(layerTable([{ kind: "points", data: [{ x: 1, y: 1 }] }], { language: "ja" })).toContain("番号");
  });
});

describe("a soccer pitch of any size", () => {
  it("is cut to the pitch drawn, and a provider's frame is fitted to it", () => {
    const at = (o: object): string[] => {
      const svg = parse(drawKyogijo({ sport: "soccer", id: "s", layers: [{ kind: "points", from: "opta", data: [{ x: 50, y: 50 }] }], ...o }));
      const c = withClass(svg, "ky-pts")[0].children.find((n) => n.name === "circle");
      return [c?.attrs.cx ?? "", c?.attrs.cy ?? ""];
    };
    expect(at({})).toEqual(["172.24", "111.55"]);
    expect(at({ pitch: "law-min" })).not.toEqual(at({}));
    expect(outlineOf({ sport: "soccer" }).box.w).toBeCloseTo(105 * 3.280839895, 2);
  });
});

describe("a hidden layer", () => {
  it("is not drawn or described, but is in the table, and a layer's id names its group", () => {
    const layers: Layer[] = [{ kind: "points", id: "mine", data: [{ x: 1, y: 1 }] }, { kind: "points", hidden: true, data: [{ x: 2, y: 2 }] }];
    const svg = parse(drawKyogijo({ sport: "nhl", id: "h", layers }));
    expect(withClass(svg, "ky-layer").map((n) => n.attrs.id)).toEqual(["h-mine"]);
    expect((layerTable(layers).match(/<table /g) ?? []).length).toBe(2);
  });
});

describe("drawLayers", () => {
  it("is the group the drawing holds, with the same ids", () => {
    const layers = sample("nhl");
    const group = drawLayers({ sport: "nhl", id: "g" }, layers);
    expect(drawKyogijo({ sport: "nhl", id: "g", layers })).toContain(group);
    expect(drawLayers({ sport: "nhl" }, [])).toBe("");
    expect(drawSurface({ sport: "nhl", id: "g", layers })).toContain(group);
  });

  it("draws the same for the same options, and not for other data", () => {
    const a = drawKyogijo({ sport: "nhl", layers: shotMap() });
    expect(a).toBe(drawKyogijo({ sport: "nhl", layers: shotMap() }));
    expect(a).not.toBe(drawKyogijo({ sport: "nhl", layers: shotMap(44, 7) }));
    expect(drawKyogijo({ sport: "nhl" })).not.toContain("ky-layers");
  });
});

describe("the marks' geometry", () => {
  it("a bowed curve has the length of its arc, and a cut one is shorter", () => {
    const c = curveBetween([0, 0], [100, 0], 0.3);
    expect(c.length).toBeGreaterThan(100);
    expect(c.trim(10).length).toBeCloseTo(c.length - 10, 0);
    expect(curveBetween([0, 0], [100, 0], 0).trim(10).to[0]).toBe(90);
  });

  it("a wave starts and ends on the line", () => {
    const d = wavePath(curveBetween([0, 0], [80, 0], 0), 2, 8);
    expect(d.startsWith("M0 0Q")).toBe(true);
    expect(d.endsWith("80 0")).toBe(true);
  });

  it("a ramp runs between its stops, and keeps what it cannot blend", () => {
    expect(rampColour(["#000000", "#ffffff"], 0.5)).toBe("#808080");
    expect(rampColour(["var(--a)", "var(--b)"], 0.9)).toBe("var(--b)");
    expect(rampColour(["nonsense;"], 0.5)).toBeUndefined();
  });
});

describe("the demo's made-up data", () => {
  it("is the same every time from its seed", () => {
    expect(seeded(5)()).toBe(seeded(5)());
    expect(shotMap()).toEqual(shotMap());
    expect(passMap()).toEqual(passMap());
    expect(sprayChart()).toEqual(sprayChart());
  });

  it("draws as the same structure, held by a snapshot", () => {
    const fingerprint = (sport: Sport, layers: Layer[], extra = {}): string => {
      const svg = drawKyogijo({ sport, id: "snap", layers, ...extra });
      const group = svg.slice(svg.indexOf('<g class="ky-layers"'));
      return `${group.length} ${hash(group)}`;
    };
    expect({
      shots: fingerprint("nhl", shotMap()),
      passes: fingerprint("nfl", passMap()),
      spray: fingerprint("mlb", sprayChart()),
    }).toMatchSnapshot();
    const svg = parse(drawKyogijo({ sport: "nhl", id: "snap", layers: shotMap() }));
    expect(withClass(svg, "ky-pts")[0].children.filter((n) => n.name !== "title" && n.name !== "desc")).toHaveLength(44);
  });
});

describe("the budgets", () => {
  const cloud = (n: number): Layer[] => {
    const random = seeded(1);
    const data: PointDatum[] = Array.from({ length: n }, (_, i) => ({ x: random() * 200, y: random() * 85, team: i % 2 === 0 ? "home" : "away", outcome: i % 7 === 0 ? "goal" : "shot", value: random() }));
    return [{ kind: "points", name: "shots", data, style: { size: { range: [1, 3] } } }];
  };

  it("1,000 points add under 70 kB to a drawing, about 60 bytes each", () => {
    const bare = drawKyogijo({ sport: "nhl", id: "b" }).length;
    const withPoints = drawKyogijo({ sport: "nhl", id: "b", layers: cloud(1000) }).length;
    expect(withPoints - bare).toBeLessThan(70_000);
  });

  it("10,000 points are drawn in under 250 ms (about 20 ms on a laptop), and 1,000 arrows with comets in under 250", () => {
    const start = performance.now();
    const svg = drawKyogijo({ sport: "nhl", id: "b", layers: cloud(10_000) });
    const took = performance.now() - start;
    expect(svg.length).toBeGreaterThan(300_000);
    expect(took, `${Math.round(took)} ms`).toBeLessThan(250);
    const random = seeded(2);
    const data = Array.from({ length: 1000 }, () => ({ x: random() * 200, y: random() * 85, x2: random() * 200, y2: random() * 85 }));
    const t2 = performance.now();
    drawKyogijo({ sport: "nhl", id: "b", layers: [{ kind: "arrows", data, style: { comet: true, curve: 0.1 } }] });
    expect(performance.now() - t2).toBeLessThan(250);
  });
});
