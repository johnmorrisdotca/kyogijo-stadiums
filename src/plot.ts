// A drawing in an Observable Plot. Nothing is imported from Plot: it takes a function as a mark, and calls it with the scales and a document to make elements in.
import { affineOf, domainOf, type ScaleFunction } from "./scene.fit.ts";
import { bodyOf, defsOf, matrixAttr, type Spec } from "./scene.flat.ts";
import { sceneOf } from "./scene.ts";
import type { SceneOptions, SceneSource } from "./scene.types.ts";

const SVG = "http://www.w3.org/2000/svg";

/** The members of a document that are used. A browser's `document` has them, and so does the one Plot gives its marks in `context.document`. */
export interface PlotDocument {
  createElementNS(namespace: string, name: string): PlotElement;
}
export interface PlotElement {
  setAttribute(name: string, value: string): void;
  appendChild(child: PlotElement): unknown;
  textContent: string | null;
}

/** The scales Plot gives a mark: `x` and `y` are functions. (Plot's scales are also nested in `scales`, which is not read.) */
export interface PlotScales {
  x: ScaleFunction;
  y: ScaleFunction;
}

/** What Plot gives a mark when it draws it. Only `document` of the context is read. */
export interface PlotContext {
  document?: PlotDocument;
}

/** The options that make a plot's x and y scales the surface's: its extent, no axes, no margin and a foot as wide as it is tall. Spread them into `Plot.plot`. */
export interface SurfaceScales {
  x: { domain: [number, number]; axis: null };
  y: { domain: [number, number]; axis: null; reverse: true };
  aspectRatio: 1;
  margin: 0;
  inset: 0;
}

/**
 * The options that give a plot the surface's scales: the drawing's numbers (feet from the surface's left end and its top, see `surfaceDomain`) on both axes with
 * y growing down as in a drawing, the same size for a foot across and down, no axis and no margin. Spread them into `Plot.plot` and put `surfaceMark` first.
 * @example
 * ```ts
 * import { surfaceScales } from "@johnmorrisdotca/kyogijo-stadiums/plot";
 * console.log(surfaceScales({ sport: "nhl", id: "rink" }));
 * // {
 * //   x: { domain: [ -8, 208 ], axis: null },
 * //   y: { domain: [ -8, 93 ], axis: null, reverse: true },
 * //   aspectRatio: 1,
 * //   margin: 0,
 * //   inset: 0
 * // }
 * ```
 */
export function surfaceScales(source: SceneSource, options: SceneOptions = {}): SurfaceScales {
  const { x, y } = domainOf(sceneOf(source, options));
  return { x: { domain: x, axis: null }, y: { domain: y, axis: null, reverse: true }, aspectRatio: 1, margin: 0, inset: 0 };
}

function make(document: PlotDocument, spec: Spec): PlotElement {
  const node = document.createElementNS(SVG, spec.tag);
  for (const [name, value] of Object.entries(spec.attrs)) node.setAttribute(name, value);
  if (spec.text !== undefined) node.textContent = spec.text;
  for (const child of spec.children ?? []) node.appendChild(make(document, child));
  return node;
}

/** A mark for `Plot.plot`: a function that Plot calls with the scales when it renders. */
export type SurfaceMark = (index: unknown, scales: PlotScales, values: unknown, dimensions: unknown, context: PlotContext) => PlotElement;

/**
 * A surface as a mark for Observable Plot, drawn where the plot's `x` and `y` scales put the drawing's numbers, so that the marks after it land on the
 * rink, the court or the field. Plot takes a function as a mark, so there is nothing to import; put it first in `marks`, with `surfaceScales` for the scales.
 * Every colour and width is an attribute of the shape, so the page needs no stylesheet; light or dark by `theme`.
 * @example
 * ```ts
 * import { surfaceMark, surfaceScales } from "@johnmorrisdotca/kyogijo-stadiums/plot";
 * // With Plot: Plot.plot({ ...surfaceScales(options), marks: [surfaceMark(options), Plot.dot(shots, { x: "x", y: "y" })] })
 * const options = { sport: "nhl", id: "rink" } as const;
 * const made: string[] = [];
 * const document = { createElementNS: (_: string, name: string) => { made.push(name); return { setAttribute: () => undefined, appendChild: () => undefined, textContent: null as string | null }; } };
 * const scale = (v: number) => (v + 8) * 4;
 * const node = surfaceMark(options)(0, { x: scale, y: scale }, {}, {}, { document });
 * console.log(made[0], made.length > 30, typeof node);
 * // g true object
 * ```
 */
export function surfaceMark(source: SceneSource, options: SceneOptions & { className?: string } = {}): SurfaceMark {
  const scene = sceneOf(source, options);
  return (_index, scales, _values, _dimensions, context) => {
    const document = context.document ?? (globalThis as { document?: PlotDocument }).document;
    if (document === undefined) throw new Error("A document is needed to make the elements: Plot passes one in context.document");
    const matrix = affineOf(scales.x, scales.y);
    const group = make(document, { tag: "g", attrs: { class: options.className ?? "kyogijo-surface", transform: matrixAttr(matrix) } });
    const defs = defsOf(scene);
    if (defs.length > 0) group.appendChild(make(document, { tag: "defs", attrs: {}, children: defs }));
    for (const spec of bodyOf(scene)) group.appendChild(make(document, spec));
    return group;
  };
}
