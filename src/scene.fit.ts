// How a scene is put on a page that has scales of its own (d3, Observable Plot): the extent of the drawing in its own numbers, and the transform that
// takes those numbers to the pixels two scales give.
import type { Matrix, Scene } from "./scene.types.ts";

/** A scale as a function of a number, which is all of d3's and Plot's `scaleLinear` that is used here. */
export type ScaleFunction = (value: number) => number;

/** The least and the greatest of x and of y in the drawing's own numbers (feet), the domains to give two scales. */
export interface SurfaceDomain {
  x: [number, number];
  y: [number, number];
}

/** The extent of a scene: its `viewBox`, the margin round the surface included. */
export function domainOf(scene: Scene): SurfaceDomain {
  const { x, y, w, h } = scene.viewBox;
  return { x: [x, x + w], y: [y, y + h] };
}

/** The matrix that takes the drawing's numbers to pixels through two scales. Only a scale that is a straight line (linear) will do; any other is an error. */
export function affineOf(x: ScaleFunction, y: ScaleFunction): Matrix {
  const line = (scale: ScaleFunction, name: string): [number, number] => {
    const at0 = scale(0);
    const step = scale(1) - at0;
    if (![at0, step].every(Number.isFinite) || Math.abs(scale(100) - (at0 + 100 * step)) > 1e-6 * Math.max(1, Math.abs(at0 + 100 * step))) throw new TypeError(`The ${name} scale must be linear: the drawing is moved and stretched, not bent`);
    return [step, at0];
  };
  const [sx, tx] = line(x, "x");
  const [sy, ty] = line(y, "y");
  return [sx, 0, 0, sy, tx, ty];
}
