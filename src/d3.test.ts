import { describe, expect, it } from "vitest";
import { appendSurface, surfaceDomain, type D3Selection } from "./d3.ts";
import { bodyOf, defsOf, type Spec } from "./scene.flat.ts";
import { GAME } from "./scene.fixture.ts";
import { sceneOf } from "./scene.ts";

/** A selection of d3's shape that makes a tree of plain objects: enough to read back what was appended and how it was set. */
interface Node {
  tag: string;
  attrs: Record<string, string>;
  text?: string;
  children: Node[];
}
function fake(): { selection: D3Selection; root: Node } {
  const root: Node = { tag: "svg", attrs: {}, children: [] };
  const wrap = (node: Node): D3Selection => ({
    append(name) {
      const child: Node = { tag: name, attrs: {}, children: [] };
      node.children.push(child);
      return wrap(child);
    },
    attr(name, value) {
      node.attrs[name] = value;
      return wrap(node);
    },
    text(value) {
      node.text = value;
      return wrap(node);
    },
  });
  return { selection: wrap(root), root };
}
const linear = (domain: readonly number[], range: readonly number[]) => (v: number): number => range[0] + ((v - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
const size = (spec: Spec): number => 1 + (spec.children ?? []).reduce((n, c) => n + size(c), 0);
const sizeOf = (node: Node): number => 1 + node.children.reduce((n, c) => n + sizeOf(c), 0);

describe("appendSurface", () => {
  const options = { sport: "nhl", ...GAME } as const;
  const d = surfaceDomain(options);

  it("appends one group holding the whole drawing, placed by the two scales", () => {
    const { selection, root } = fake();
    const group = appendSurface(selection, options, linear(d.x, [0, 800]), linear(d.y, [0, 374]));
    expect(root.children.length).toBe(1);
    const g = root.children[0];
    expect(g.tag).toBe("g");
    expect(g.attrs.class).toBe("kyogijo-surface");
    const [sx, , , sy, tx, ty] = (/matrix\(([^)]+)\)/.exec(g.attrs.transform)?.[1] ?? "").split(" ").map(Number);
    expect(sx).toBeCloseTo(800 / 216);
    expect(sy).toBeCloseTo(374 / 101);
    expect(tx).toBeCloseTo(8 * (800 / 216));
    expect(ty).toBeCloseTo(8 * (374 / 101));
    expect(group).toBeDefined();
    // Every shape of the drawing is in it, with its attributes set one by one, and text set as text.
    const scene = sceneOf(options);
    const body = bodyOf(scene);
    expect(g.children.length).toBe(body.length + (defsOf(scene).length > 0 ? 1 : 0));
    expect(sizeOf(g) - 1).toBe(body.reduce((n, s) => n + size(s), 0) + (defsOf(scene).length > 0 ? 1 + defsOf(scene).reduce((n, s) => n + size(s), 0) : 0));
    const texts = g.children.filter((c) => c.tag === "text");
    expect(texts.map((t) => t.text)).toEqual(scene.items.flatMap((i) => (i.kind === "text" ? [i.text] : [])));
    const apron = g.children[0];
    expect(apron.tag).toBe("rect");
    expect(apron.attrs.fill).toBe("#d3dbe1");
    expect(apron.attrs.class).toBe("ky-apron");
  });

  it("needs no stylesheet: every colour is an attribute, light or dark", () => {
    for (const theme of ["light", "dark"] as const) {
      const { selection, root } = fake();
      appendSurface(selection, options, linear(d.x, [0, 800]), linear(d.y, [0, 374]), { theme });
      const all: Node[] = [];
      const visit = (n: Node): void => void (all.push(n), n.children.forEach(visit));
      visit(root);
      expect(all.some((n) => n.tag === "style")).toBe(false);
      expect(all.every((n) => !Object.values(n.attrs).some((v) => v.includes("var(")))).toBe(true);
      expect(root.children[0].children[0].attrs.fill).toBe(theme === "light" ? "#d3dbe1" : "#1a2025");
    }
  });

  it("makes the clips, gradients and patterns a layer needs", () => {
    const { selection, root } = fake();
    appendSurface(selection, { sport: "nhl", id: "k", layers: [{ kind: "points", data: [{ x: 100, y: 40 }] }] as never }, linear(d.x, [0, 800]), linear(d.y, [0, 374]));
    const defs = root.children[0].children.find((c) => c.tag === "defs");
    expect(defs?.children[0].tag).toBe("clipPath");
    expect(defs?.children[0].attrs.id).toBe("k-clip0");
    expect(root.children[0].children.some((c) => c.tag === "g" && c.attrs["clip-path"] === "url(#k-clip0)")).toBe(true);
  });

  it("says plainly that a scale that bends cannot move the drawing", () => {
    const { selection } = fake();
    expect(() => appendSurface(selection, options, (v) => Math.log(v + 20), linear(d.y, [0, 374]))).toThrow(/x scale must be linear/);
    expect(() => appendSurface(selection, options, linear(d.x, [0, 800]), (v) => v ** 2)).toThrow(/y scale must be linear/);
    expect(() => appendSurface(selection, options, () => Number.NaN, linear(d.y, [0, 374]))).toThrow(/linear/);
  });

  it("gives the numbers that fill the scales, and a drawing that is tall is the other way about", () => {
    expect(surfaceDomain({ sport: "nhl", id: "x" })).toEqual({ x: [-8, 208], y: [-8, 93] });
    expect(surfaceDomain({ sport: "nhl", id: "x", orientation: "portrait" })).toEqual({ x: [0, 101], y: [0, 216] });
    expect(surfaceDomain({ sport: "nhl", id: "x" }, { theme: "dark" })).toEqual({ x: [-8, 208], y: [-8, 93] });
  });
});
