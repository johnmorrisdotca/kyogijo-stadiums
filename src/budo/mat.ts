// A wrestling mat: the wrestling area's circle with the matted area round it, and on the UWW's mat the orange passivity band, the central circle and the platform it stands on; on a folkstyle mat the line that outlines the
// circle, the circle of 10 feet and the two starting lines closed by a green and a red line. From the UWW's Wrestling Rules (Article 4, January 2026), the NCAA's Wrestling Rules (Rule 1) and the NFHS's (Rule 2-1). In metres,
// the origin at the top left of the mat's square, north at the top. Nothing here draws SVG.
import { ring } from "../fields.kit.ts";
import type { WrestlingFigures } from "../leagues/combat.ts";
import { annulusD, discArea, rectArea, tapeBar, within } from "./kit.ts";
import { emptyParts, grow, type MBox, type MMark, type Parts } from "./parts.ts";

/** What a wrestling plan is. */
export interface MatLayout {
  parts: Parts;
  /** The mat's square: the circle and the matted area round it. The surface's own box. */
  mat: MBox;
  /** The platform under the mat (a square a metre wider each side), when there is one. */
  platform: MBox | undefined;
  extent: MBox;
  centre: [number, number];
  /** The wrestling area's diameter, and the middle part of it inside the passivity band (the UWW's). */
  circle: number;
  inner: number;
  /** The matted area's width round the circle. */
  border: number;
  /** The platform's height over the floor of the building, in metres. */
  height: number;
  /** The starting lines: the rectangle they enclose, when drawn. */
  start: MBox | undefined;
  marks: MMark[];
  ranges: Record<string, MBox>;
}

/** The circle's diameter the options ask for, held to what the league allows. */
export const matCircle = (asked: number | undefined, fig: WrestlingFigures, rule: string): number => (asked === undefined ? fig.circle.drawn : within(asked, fig.circle.min, fig.circle.max, "The wrestling area", rule));

/** The platform's height the options ask for, held to what the league allows. */
export function matHeight(asked: number | undefined, fig: WrestlingFigures, rule: string): number {
  if (asked === undefined) return fig.platform.height.drawn;
  const h = within(asked, fig.platform.height.min, fig.platform.height.max, "The platform", rule);
  // A platform, when there is one, is at least the league's least (the UWW's 0.80 m); none at all is allowed.
  if (h > 0 && h < fig.platform.least - 1e-9) throw new RangeError(`The platform of ${h} m is outside what ${rule} allows: none, or ${fig.platform.least} m to ${fig.platform.height.max} m`);
  return h;
}

/** The plan of the mat the options ask for. */
export function matParts(fig: WrestlingFigures, o: { circle: number; height: number; centre: boolean; lines: boolean }): MatLayout {
  const b = fig.border.drawn;
  const side = o.circle + 2 * b;
  const mat: MBox = { x0: 0, y0: 0, x1: side, y1: side };
  const c = side / 2;
  const r = o.circle / 2;
  const parts = emptyParts();
  const platform = o.height > 0 ? grow(mat, fig.platform.around) : undefined;
  if (platform !== undefined) parts.areas.push(rectArea("platform", "platform", "ky-bud-platform", platform));
  parts.areas.push(rectArea("border", "border", "ky-bud-t2", mat));
  parts.areas.push(discArea("circle", "circle", "ky-bud-t1", c, c, r));
  const inner = fig.passivity > 0 ? o.circle - 2 * fig.passivity : o.circle;
  if (fig.passivity > 0) parts.areas.push({ id: "passivity", feature: "passivity", cls: "ky-bud-t3", d: annulusD(c, c, inner / 2, r), evenodd: true });
  // The line that outlines the circle (folkstyle): part of the wrestling area, in bounds.
  if (fig.rim > 0) parts.shapes.push(ring("rim", "rim", c, c, r - fig.rim / 2, r - fig.rim / 2, { w: fig.rim, cls: "ky-bud-line" }));
  // The circle in the middle: a band round a circle of the stated inside diameter.
  if (fig.centre !== null && o.centre) parts.shapes.push(ring("centre-circle", "centre-circle", c, c, fig.centre.diameter / 2 + fig.centre.band / 2, fig.centre.diameter / 2 + fig.centre.band / 2, { w: fig.centre.band, cls: "ky-bud-line" }));
  // The starting lines: two parallel lines, closed at their ends by a green line (home, left) and a red line (visitors, right).
  let start: MBox | undefined;
  if (fig.lines !== null && o.lines) {
    const L = fig.lines;
    const half = L.apart / 2 + L.width;
    start = { x0: c - L.length / 2, y0: c - half, x1: c + L.length / 2, y1: c + half };
    parts.shapes.push(tapeBar("start-line-1", "starting-lines", "ky-bud-white-fill", { x0: start.x0, y0: c - L.apart / 2 - L.width, x1: start.x1, y1: c - L.apart / 2 }));
    parts.shapes.push(tapeBar("start-line-2", "starting-lines", "ky-bud-white-fill", { x0: start.x0, y0: c + L.apart / 2, x1: start.x1, y1: c + L.apart / 2 + L.width }));
    parts.shapes.push(tapeBar("start-green", "starting-lines", "ky-bud-green-fill", { x0: start.x0, y0: start.y0, x1: start.x0 + L.width, y1: start.y1 }));
    parts.shapes.push(tapeBar("start-red", "starting-lines", "ky-bud-red-fill", { x0: start.x1 - L.width, y0: start.y0, x1: start.x1, y1: start.y1 }));
  }
  const extent = grow(platform ?? mat, 0.6);
  const ranges: Record<string, MBox> = { start: { x0: c - 1.5, y0: c - 1.5, x1: c + 1.5, y1: c + 1.5 } };
  if (fig.passivity > 0) ranges.passivity = { x0: c - r - 0.3, y0: c - r - 0.3, x1: c + r + 0.3, y1: c + r + 0.3 };
  const marks: MMark[] = [
    { id: "mat-circle", x: c - r * 0.72, y: c - r * 0.72, side: "top" },
    { id: "mat-border", x: b / 2, y: c + r * 0.55, side: "bottom" },
  ];
  if (fig.passivity > 0) marks.push({ id: "mat-central", x: c - inner / 2 * Math.SQRT1_2, y: c + inner / 2 * Math.SQRT1_2, side: "bottom" });
  if (fig.passivity > 0) marks.push({ id: "mat-passivity", x: c + (inner / 2 + fig.passivity / 2) * Math.SQRT1_2, y: c - (inner / 2 + fig.passivity / 2) * Math.SQRT1_2, side: "top" });
  if (fig.centre !== null && o.centre) marks.push({ id: "mat-centre-circle", x: c + fig.centre.diameter / 2, y: c + fig.centre.diameter / 2, side: "bottom" });
  if (start !== undefined) marks.push({ id: "mat-starting-lines", x: start.x1, y: c, side: "bottom" });
  if (platform !== undefined) marks.push({ id: "mat-platform", x: platform.x1 - 0.3, y: platform.y0 + 0.3, side: "top" });
  return { parts, mat, platform, extent, centre: [c, c], circle: o.circle, inner, border: b, height: o.height, start, marks, ranges };
}
