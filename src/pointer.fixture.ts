// A drawing in a page that has no page: the `<svg>` of a drawing the package wrote, with the matrix a browser would give its surface group, worked out from the viewBox, the
// box it is fitted into and the group's own transform. The pointer functions (pointer.ts) take it as they take an element.
import { IDENTITY, multiply, parseTransform } from "./scene.path.ts";
import type { SvgLike } from "./pointer.ts";

const attrs = (tag: string): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [, name, value] of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) out.set(name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  return out;
};

/** Where the drawing sits in the page: its box in client pixels. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A drawing as the pointer functions see it, shown in a box of the page (`xMidYMid meet`, as an SVG is by default). `fixture.hide()` makes the browser answer with no matrix. */
export function pageOf(svg: string, box: Box = { left: 0, top: 0, width: 800, height: 400 }): SvgLike & { hidden: boolean } {
  const root = attrs(/<svg[^>]*>/.exec(svg)?.[0] ?? "");
  const groupTag = /<g class="ky-surface-group"[^>]*>/.exec(svg)?.[0];
  const group = groupTag === undefined ? undefined : attrs(groupTag);
  const [vx, vy, vw, vh] = (root.get("viewBox") ?? "0 0 1 1").split(" ").map(Number);
  const s = Math.min(box.width / vw, box.height / vh);
  const fit: [number, number, number, number, number, number] = [s, 0, 0, s, box.left + (box.width - vw * s) / 2 - vx * s, box.top + (box.height - vh * s) / 2 - vy * s];
  const matrix = multiply(fit, group === undefined ? IDENTITY : parseTransform(group.get("transform")));
  const page = {
    hidden: false,
    getAttribute: (name: string): string | null => root.get(name) ?? null,
    closest: (): null => null,
    querySelector: (selectors: string): unknown => {
      if (selectors !== ".ky-surface-group" || group === undefined) return null;
      return {
        getAttribute: (name: string): string | null => group.get(name) ?? null,
        getScreenCTM: () => (page.hidden ? null : { a: matrix[0], b: matrix[1], c: matrix[2], d: matrix[3], e: matrix[4], f: matrix[5] }),
      };
    },
  };
  return page;
}
