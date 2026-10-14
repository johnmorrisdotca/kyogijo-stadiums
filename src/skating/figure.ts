// The figure skating rink: the skating area, 60 m by 30 m if possible and never less than 56 m by 26 m (Special Regulations and Technical Rules Single and Pair Skating and Ice Dance, Rule 342.1), its
// boards, and the furniture a competition sets round it: the judges and the referee at the rinkboard (Rule 342.1), the technical panel, in an elevated position if possible (Rule 342.1), and the kiss and
// cry. The Rules give no corner, no size of a table and no place for the kiss and cry: these are ours. In metres. Nothing here draws SVG.
import type { Area } from "../fields.types.ts";
import { ISU_FIGURE_RINK, type FigureRinkFigures } from "../leagues/skating.ts";
import { emptyParts, type MBox, type MMark, type Parts } from "./parts.ts";
import type { SkatingFurniture } from "./types.ts";

/** The rink: its length and width. */
export interface FigureRink {
  length: number;
  width: number;
}

/** The furniture of a figure skating rink, in painter's order. */
export const FURNITURE: readonly SkatingFurniture[] = Object.freeze(["judges", "referee", "technical-panel", "kiss-and-cry"]);

/** The seats of a panel of judges, side by side at the rinkboard: nine, as at the Olympic Winter Games (ours: the Rules fix the number elsewhere), 1 m apart. */
export const JUDGES = 9;

/** Where the furniture stands outside the boards of the rink on its long side at the bottom (and the kiss and cry at the end), as boxes in metres. */
export function furnitureBoxes(r: FigureRink, fig: FigureRinkFigures = ISU_FIGURE_RINK): Record<SkatingFurniture, MBox[]> {
  const y = r.width / 2 + fig.boards + 0.6;
  const seat = (x: number): MBox => ({ x0: x - 0.4, y0: y, x1: x + 0.4, y1: y + 0.8 });
  return {
    judges: Array.from({ length: JUDGES }, (_, i) => seat((i - (JUDGES - 1) / 2) * 1)),
    referee: [seat(-(JUDGES - 1) / 2 - 2)],
    "technical-panel": [{ x0: (JUDGES - 1) / 2 + 1.5, y0: y + 1.2, x1: (JUDGES - 1) / 2 + 5.5, y1: y + 2.4 }],
    "kiss-and-cry": [{ x0: -r.length / 2 + 3, y0: y, x1: -r.length / 2 + 6.5, y1: y + 1.6 }],
  };
}

export interface FigureOptions {
  fig: FigureRinkFigures;
  furniture: readonly SkatingFurniture[];
}

/** The parts of the rink. */
export function figureParts(r: FigureRink, opt: FigureOptions): { parts: Parts; box: MBox; marks: MMark[] } {
  const { fig } = opt;
  const parts = emptyParts();
  const Lh = r.length / 2;
  const W = r.width / 2;
  const rd = (n: number): number => Math.round(n * 100) / 100;
  const roundD = (hx: number, hy: number, k: number): string => `M${rd(-hx + k)} ${rd(-hy)}H${rd(hx - k)}A${k} ${k} 0 0 1 ${rd(hx)} ${rd(-hy + k)}V${rd(hy - k)}A${k} ${k} 0 0 1 ${rd(hx - k)} ${rd(hy)}H${rd(-hx + k)}A${k} ${k} 0 0 1 ${rd(-hx)} ${rd(hy - k)}V${rd(-hy + k)}A${k} ${k} 0 0 1 ${rd(-hx + k)} ${rd(-hy)}Z`;
  parts.areas.push({ id: "ice", feature: "ice", cls: "ky-ska-ice", d: roundD(Lh, W, fig.corner) });
  parts.areas.push({ id: "boards", feature: "boards", cls: "ky-boards", d: `${roundD(Lh + fig.boards, W + fig.boards, fig.corner + fig.boards)}${roundD(Lh, W, fig.corner)}`, evenodd: true } as Area);
  const boxes = furnitureBoxes(r, fig);
  const marks: MMark[] = [];
  for (const kind of opt.furniture) {
    boxes[kind].forEach((b, i) => parts.areas.push({ id: `${kind}-${i + 1}`, feature: kind, cls: kind === "kiss-and-cry" ? "ky-ska-kiss" : "ky-ska-desk", rect: [b.x0, b.y0, b.x1, b.y1] }));
    const b = boxes[kind][Math.floor(boxes[kind].length / 2)];
    marks.push({ id: kind, x: (b.x0 + b.x1) / 2, y: b.y1, side: "bottom" });
  }
  const extra = opt.furniture.length === 0 ? 0 : 3.4;
  return { parts, box: { x0: -Lh - fig.boards, y0: -W - fig.boards, x1: Lh + fig.boards, y1: W + fig.boards + extra }, marks };
}
