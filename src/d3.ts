// A drawing put on a d3 selection. Nothing is imported from d3: the selection and the scales are the caller's, typed by the three members used.
import { affineOf, domainOf, type ScaleFunction, type SurfaceDomain } from "./scene.fit.ts";
import { bodyOf, defsOf, matrixAttr, type Spec } from "./scene.flat.ts";
import { sceneOf } from "./scene.ts";
import type { SceneOptions, SceneSource } from "./scene.types.ts";

/** The members of a d3 selection that are used: `append`, `attr` and `text`. Every selection of d3 has them. */
export interface D3Selection {
  append(name: string): D3Selection;
  attr(name: string, value: string): D3Selection;
  text(value: string): D3Selection;
}

/** What `appendSurface` takes besides the drawing. */
export interface AppendOptions extends SceneOptions {
  /** A class to put on the group. `kyogijo-surface`. */
  className?: string;
}

function build(parent: D3Selection, spec: Spec): void {
  let node = parent.append(spec.tag);
  for (const [name, value] of Object.entries(spec.attrs)) node = node.attr(name, value);
  if (spec.text !== undefined) node = node.text(spec.text);
  for (const child of spec.children ?? []) build(node, child);
}

/**
 * The numbers to give two scales so that the drawing fills them: `scaleLinear().domain(d.x).range([0, width])` and `scaleLinear().domain(d.y).range([0, height])`.
 * The numbers are the drawing's own, feet from the surface's left end and its top (a tall drawing, as the curling sheet is by default, is turned: ask for
 * `orientation: "landscape"` to have the surface's own).
 * @example
 * ```ts
 * import { surfaceDomain } from "@johnmorrisdotca/kyogijo-stadiums/d3";
 * console.log(surfaceDomain({ sport: "nhl", id: "rink" }));
 * // { x: [ -8, 208 ], y: [ -8, 93 ] }
 * ```
 */
export function surfaceDomain(source: SceneSource, options: SceneOptions = {}): SurfaceDomain {
  return domainOf(sceneOf(source, options));
}

/**
 * Draw a surface into a d3 selection, where the caller's scales put it: the drawing's numbers go through `x` and `y` (linear scales), so a mark you add
 * with the same scales lands on the right spot of the rink. Every colour, width and font is an attribute of the shape, so the page needs no stylesheet and
 * the drawing is light or dark by `theme`. Returns the group it made, with a class on each shape for selecting.
 * @example
 * ```ts
 * import { appendSurface, surfaceDomain } from "@johnmorrisdotca/kyogijo-stadiums/d3";
 * // With d3: appendSurface(d3.select("svg"), options, d3.scaleLinear().domain(d.x).range([0, 800]), d3.scaleLinear().domain(d.y).range([0, 374]))
 * const options = { sport: "nhl", id: "rink" } as const;
 * const made: string[] = [];
 * const selection = { append: (name: string) => (made.push(name), selection), attr: () => selection, text: () => selection };
 * const d = surfaceDomain(options);
 * const scale = (domain: number[], size: number) => (v: number) => ((v - domain[0]) / (domain[1] - domain[0])) * size;
 * appendSurface(selection, options, scale(d.x, 800), scale(d.y, 374));
 * console.log(made[0], made.includes("path"), made.includes("clipPath"));
 * // g true false
 * ```
 */
export function appendSurface(selection: D3Selection, source: SceneSource, x: ScaleFunction, y: ScaleFunction, options: AppendOptions = {}): D3Selection {
  const scene = sceneOf(source, options);
  const matrix = affineOf(x, y);
  const group = selection.append("g").attr("class", options.className ?? "kyogijo-surface").attr("transform", matrixAttr(matrix));
  const defs = defsOf(scene);
  if (defs.length > 0) build(group, { tag: "defs", attrs: {}, children: defs });
  for (const spec of bodyOf(scene)) build(group, spec);
  return group;
}

export type { ScaleFunction, SurfaceDomain };
