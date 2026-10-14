// A kyūdōjō (弓道場): the shajō (射場), the hall the archers shoot from, with the shooting positions (射位) and the honza (本座); the yamichi (矢道), the open ground between it and the azuchi (安土), the mound
// the targets (的) stand against; and the path beside the yamichi for fetching the arrows. The figures are the All Nippon Kyudo Federation's competition manual (Figures II-1 and II-3) and the National
// Sports Festival's rules for the distances and the targets. In metres: x from the back wall of the shajō towards the targets, y across it from the north side. Nothing here draws SVG.
import type { KyudoFigures } from "../leagues/budo.ts";
import { box, dot, line } from "../fields.kit.ts";
import { discArea, rectArea } from "./kit.ts";
import { emptyParts, grow, type MBox, type MMark, type Parts } from "./parts.ts";

/** The width of the path beside the yamichi, for fetching the arrows (ours). */
const PATH = 1;

/** What a kyūdōjō plan is. */
export interface KyudoLayout {
  parts: Parts;
  /** The whole range: the shajō, the yamichi and the azuchi. */
  range: MBox;
  extent: MBox;
  /** The shajō's floor (with the judges' side), the yamichi, the azuchi's footprint. */
  shajo: MBox;
  yamichi: MBox;
  azuchi: MBox;
  /** The x of the shooting positions, of the honza and of the targets' faces, and the y of each shooter. */
  shooting: number;
  honza: number;
  target: number;
  lanes: number[];
  shooters: number;
  marks: MMark[];
}

/** The number of shooters the options ask for, 1 to 12. @throws RangeError for a number outside it. */
export function shootersOf(asked: number | undefined, fig: KyudoFigures): number {
  if (asked === undefined) return fig.count;
  if (!Number.isInteger(asked) || asked < 1 || asked > 12) throw new RangeError("budo.shooters is a whole number of 1 to 12");
  return asked;
}

/** The plan of the kyūdōjō the options ask for. */
export function kyudoParts(fig: KyudoFigures, o: { shooters: number; targets: boolean; roof: boolean }): KyudoLayout {
  const n = o.shooters;
  const step = fig.step.drawn;
  const h = fig.hall;
  // The frontage is the shooters' line and the side room at each end: 12.6 m for five at 1.8 m, 10.8 m at 1.6 m with 2.2 m to the walls.
  const frontage = (n - 1) * step + 2 * h.side;
  const rearX = 0;
  const frontX = h.rear + h.depth;
  const shooting = frontX - h.front;
  const honza = shooting - fig.honza;
  const target = shooting + fig.distance;
  const lanes = Array.from({ length: n }, (_, i) => h.side + i * step);
  const parts = emptyParts();
  const shajo: MBox = { x0: rearX, y0: 0, x1: frontX, y1: frontage + h.judges };
  const azuchiW = (n - 1) * step + 2 * fig.azuchi.margin;
  const cy = h.side + ((n - 1) * step) / 2;
  const azuchi: MBox = { x0: target - 1, y0: cy - azuchiW / 2, x1: target + fig.azuchi.depth - 1, y1: cy + azuchiW / 2 };
  const yamichi: MBox = { x0: frontX, y0: lanes[0] - fig.yamichi.margin, x1: azuchi.x0, y1: lanes[n - 1] + fig.yamichi.margin };
  // The yamichi lies open to the sky; the path for the arrows runs beside it on the left as the archers face the targets (the north side).
  parts.areas.push(rectArea("yamichi", "yamichi", "ky-bud-yamichi", yamichi));
  parts.areas.push(rectArea("yatori-michi", "yatori-michi", "ky-bud-lane", { x0: yamichi.x0, y0: yamichi.y0 - PATH, x1: yamichi.x1, y1: yamichi.y0 }));
  parts.areas.push(rectArea("shajo", "shajo", "ky-bud-floor", shajo));
  parts.areas.push(rectArea("azuchi", "azuchi", "ky-bud-azuchi", azuchi));
  parts.shapes.push(box("hall", "shajo", shajo.x0, shajo.y0, shajo.x1, shajo.y1, { w: 0.08, cls: "ky-bud-ink", least: 0.08 }));
  // The judges' side: the officials' row at the back of the hall (the figure's dashed line) is not drawn; the judges' room beside the shooters is the floor's last 3.6 m.
  parts.shapes.push(line("judges-line", "shajo", shajo.x0, frontage, shajo.x1, frontage, { w: 0.03, dash: [0.3, 0.25], cls: "ky-bud-ink", least: 0.03 }));
  lanes.forEach((y, i) => {
    parts.shapes.push(dot(`shooting-${i + 1}`, "shooting-positions", shooting, y, 0.1));
    parts.shapes.push(dot(`honza-${i + 1}`, "honza", honza, y, 0.07));
    if (o.targets) parts.areas.push(discArea(`mato-${i + 1}`, "targets", "ky-bud-mato", target, y, fig.target.diameter / 2));
  });
  // The line of the shooting positions and of the honza, drawn faint; and the line of the targets' faces.
  parts.shapes.push(line("shooting-line", "shooting-positions", shooting, 0.4, shooting, frontage - 0.4, { w: 0.03, dash: [0.2, 0.2], cls: "ky-bud-line", least: 0.03 }));
  parts.shapes.push(line("honza-line", "honza", honza, 0.4, honza, frontage - 0.4, { w: 0.03, dash: [0.12, 0.3], cls: "ky-bud-line", least: 0.03 }));
  if (o.roof) {
    parts.shapes.push(box("roof-shajo", "roofs", rearX - 0.4, -0.4, frontX + 0.5, frontage + h.judges + 0.4, { w: 0.05, dash: [0.5, 0.35], cls: "ky-bud-ink", least: 0.05 }));
    parts.shapes.push(box("roof-matoba", "roofs", azuchi.x0 - 2.2, azuchi.y0 - 0.5, azuchi.x1 + 0.4, azuchi.y1 + 0.5, { w: 0.05, dash: [0.5, 0.35], cls: "ky-bud-ink", least: 0.05 }));
  }
  const range: MBox = { x0: 0, y0: Math.min(0, yamichi.y0 - PATH, azuchi.y0), x1: azuchi.x1, y1: Math.max(shajo.y1, azuchi.y1) };
  const marks: MMark[] = [
    { id: "shajo", x: shajo.x0 + 1.5, y: 0.8, side: "top" },
    { id: "shooting-position", x: shooting, y: lanes[0], side: "top" },
    { id: "honza", x: honza, y: lanes[n - 1], side: "bottom" },
    { id: "yamichi", x: (yamichi.x0 + yamichi.x1) / 2, y: yamichi.y1 - 0.4, side: "bottom" },
    { id: "yatori-michi", x: yamichi.x0 + (yamichi.x1 - yamichi.x0) * 0.35, y: yamichi.y0 - PATH / 2, side: "top" },
    { id: "azuchi", x: azuchi.x1 - 0.6, y: azuchi.y1 - 0.8, side: "bottom" },
  ];
  if (o.targets) marks.push({ id: "mato", x: target, y: lanes[0], side: "top" });
  return { parts, range, extent: grow(range, 0.6), shajo, yamichi, azuchi, shooting, honza, target, lanes, shooters: n, marks };
}
