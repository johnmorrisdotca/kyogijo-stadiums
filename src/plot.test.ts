import { describe, expect, it } from "vitest";
import { surfaceMark, surfaceScales, type PlotDocument, type PlotElement } from "./plot.ts";
import { bodyOf, defsOf, type Spec } from "./scene.flat.ts";
import { GAME } from "./scene.fixture.ts";
import { sceneOf } from "./scene.ts";

interface Made extends PlotElement {
  tag: string;
  ns: string;
  attrs: Record<string, string>;
  children: Made[];
}
function document(): { document: PlotDocument; made: Made[] } {
  const made: Made[] = [];
  return {
    made,
    document: {
      createElementNS(ns, tag) {
        const node: Made = { tag, ns, attrs: {}, children: [], textContent: null, setAttribute: (k, v) => void (node.attrs[k] = v), appendChild: (c) => node.children.push(c as Made) };
        made.push(node);
        return node;
      },
    },
  };
}
const linear = (domain: readonly number[], range: readonly number[]) => (v: number): number => range[0] + ((v - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
const size = (spec: Spec): number => 1 + (spec.children ?? []).reduce((n, c) => n + size(c), 0);

describe("surfaceScales", () => {
  it("are the options that make a plot's scales the surface's", () => {
    expect(surfaceScales({ sport: "nhl", id: "p" })).toEqual({ x: { domain: [-8, 208], axis: null }, y: { domain: [-8, 93], axis: null, reverse: true }, aspectRatio: 1, margin: 0, inset: 0 });
    expect(surfaceScales({ sport: "nfl", id: "p" }).x.domain).toEqual([-12, 372]);
  });
});

describe("surfaceMark", () => {
  const options = { sport: "nba", ...GAME } as const;

  it("is a function of the shape Plot calls a mark with, and makes SVG elements in the document it is given", () => {
    const mark = surfaceMark(options);
    expect(typeof mark).toBe("function");
    const { document: doc, made } = document();
    const node = mark(0, { x: linear([-3, 97], [0, 940]), y: linear([-3, 53], [0, 560]) }, {}, {}, { document: doc }) as Made;
    expect(node.tag).toBe("g");
    expect(node.ns).toBe("http://www.w3.org/2000/svg");
    expect(node.attrs.class).toBe("kyogijo-surface");
    const scene = sceneOf(options);
    const defs = defsOf(scene);
    expect(made.length).toBe(1 + bodyOf(scene).reduce((n, s) => n + size(s), 0) + (defs.length === 0 ? 0 : 1 + defs.reduce((n, s) => n + size(s), 0)));
    const [sx, , , sy] = (/matrix\(([^)]+)\)/.exec(node.attrs.transform)?.[1] ?? "").split(" ").map(Number);
    expect([sx, sy]).toEqual([9.4, 10]);
    expect(made.filter((m) => m.tag === "text").length).toBe(scene.items.filter((i) => i.kind === "text").length);
  });

  it("is made once and drawn for every render, light or dark by its option", () => {
    const dark = surfaceMark({ sport: "nba", id: "d" }, { theme: "dark" });
    const light = surfaceMark({ sport: "nba", id: "d" });
    const scales = { x: linear([-3, 97], [0, 940]), y: linear([-3, 53], [0, 560]) };
    const first = document();
    dark(0, scales, {}, {}, { document: first.document });
    const second = document();
    light(0, scales, {}, {}, { document: second.document });
    expect(first.made[1].attrs.fill).not.toBe(second.made[1].attrs.fill);
    const again = document();
    dark(0, scales, {}, {}, { document: again.document });
    expect(again.made.map((m) => m.attrs)).toEqual(first.made.map((m) => m.attrs));
  });

  it("refuses a scale that bends, and says when there is no document to make elements in", () => {
    const { document: doc } = document();
    expect(() => surfaceMark(options)(0, { x: (v) => Math.sqrt(v + 10), y: (v) => v }, {}, {}, { document: doc })).toThrow(/linear/);
    expect(() => surfaceMark(options)(0, { x: (v) => v, y: (v) => v }, {}, {}, {})).toThrow(/document is needed/);
  });
});
