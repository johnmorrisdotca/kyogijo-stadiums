// A kendo shiai-jo: a wooden floor of 9 m to 11 m a side with its boundary lines, the cross at the centre and the two kaishi-sen, and the space kept outside it, from the FIK's Regulations of Kendo Shiai
// and Shinpan (Article 2, the Subsidiary Rules' Article 1 and Figure 1). In metres, the origin at the top left of the floor. Nothing here draws SVG.
import type { Shape } from "../fields.types.ts";
import { box, line } from "../fields.kit.ts";
import type { KendoFigures } from "../leagues/budo.ts";
import { rectArea, within } from "./kit.ts";
import { emptyParts, grow, type MBox, type MMark, type Parts } from "./parts.ts";

/** The width of a floorboard: 18 cm (ours; a sprung floor's boards are laid lengthwise). */
const BOARD = 0.18;

/** What a kendo plan is. */
export interface KendoLayout {
  parts: Parts;
  /** The floor inside the boundary lines, the shiai-jo itself. */
  floor: MBox;
  extent: MBox;
  side: number;
  /** The centre, and the two kaishi-sen as lines. */
  centre: [number, number];
  starts: [MBox, MBox];
  marks: MMark[];
}

/** The side the options ask for, held to 9 m to 11 m. */
export const kendoSide = (asked: number | undefined, fig: KendoFigures): number => (asked === undefined ? fig.side.drawn : within(asked, fig.side.min, fig.side.max, "The shiai-jo", "Article 2 of the FIK's Regulations"));

/** The plan of the shiai-jo the options ask for. */
export function kendoParts(fig: KendoFigures, side: number, seams: boolean): KendoLayout {
  const floor: MBox = { x0: 0, y0: 0, x1: side, y1: side };
  const parts = emptyParts();
  const w = fig.lineWidth.min;
  const outer = grow(floor, fig.outside);
  parts.areas.push(rectArea("outside", "outside", "ky-bud-free", outer));
  parts.areas.push(rectArea("floor", "floor", "ky-bud-floor", floor));
  const shapes: Shape[] = [];
  // The boards run the length of the floor.
  if (seams) for (let y = BOARD; y < side - 1e-6; y += BOARD) shapes.push(line("board", "boards", 0, y, side, y, { w: 0.008, cls: "ky-bud-seam", least: 0 }));
  // The boundary lines, white, 5 cm wide and inside the 9 m to 11 m, so that the floor's size includes them.
  shapes.push(box("boundary", "boundary-lines", w / 2, w / 2, side - w / 2, side - w / 2, { w, cls: "ky-bud-line" }));
  const cx = side / 2;
  const cy = side / 2;
  const c = fig.cross.drawn / 2;
  shapes.push(line("cross-a", "cross", cx - c, cy - c, cx + c, cy + c, { w, cls: "ky-bud-line" }), line("cross-b", "cross", cx - c, cy + c, cx + c, cy - c, { w, cls: "ky-bud-line" }));
  const l = fig.startLine.length / 2;
  const left: MBox = { x0: cx - fig.startLine.fromCentre - w / 2, y0: cy - l, x1: cx - fig.startLine.fromCentre + w / 2, y1: cy + l };
  const right: MBox = { x0: cx + fig.startLine.fromCentre - w / 2, y0: cy - l, x1: cx + fig.startLine.fromCentre + w / 2, y1: cy + l };
  for (const [k, b] of [left, right].entries()) shapes.push(line(`start-${k === 0 ? "left" : "right"}`, "start-lines", (b.x0 + b.x1) / 2, b.y0, (b.x0 + b.x1) / 2, b.y1, { w, cls: "ky-bud-line" }));
  // The outer boundary, 1.5 m outside, as a dashed line (Figure 1).
  shapes.push(box("outer-boundary", "outer-boundary", -fig.outside, -fig.outside, side + fig.outside, side + fig.outside, { w: 0.03, dash: [0.25, 0.2], cls: "ky-bud-ink", least: 0.03 }));
  parts.shapes.push(...shapes);
  const marks: MMark[] = [
    { id: "boundary-line", x: side * 0.2, y: w / 2, side: "top" },
    { id: "centre-cross", x: cx, y: cy - 0.5, side: "top" },
    { id: "kaishi-sen", x: cx + fig.startLine.fromCentre, y: cy + l, side: "bottom" },
    { id: "outer-boundary", x: side * 0.8, y: side + fig.outside, side: "bottom" },
    { id: "shiai-jo", x: side * 0.5, y: side * 0.85, side: "bottom" },
    { id: "floorboard", x: side * 0.2, y: side * 0.35, side: "top" },
  ];
  return { parts, floor, extent: grow(outer, 0.15), side, centre: [cx, cy], starts: [left, right], marks };
}
