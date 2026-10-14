// A karate competition area: the WKF's matted square of 8 m measured from the outside, with the outer 1 m of a kumite area in another colour, the safety area of 2 m round it, the two mats turned over at
// the start, the referee and the judges, from the WKF Kumite and Kata Competition Rules (2026), Article 1. In metres, the origin at the top left of the mats, the officials' table at the top.
// Nothing here draws SVG.
import type { KarateFigures } from "../leagues/budo.ts";
import { rectArea } from "./kit.ts";
import { emptyParts, grow, union, type MBox, type MMark, type Parts } from "./parts.ts";
import { lay, seams, tatamiAreas, tint, type MatSize, type Piece } from "./tatami.ts";

/** The mat of a karate area: 1 m by 1 m, a WKF-approved mat's size (ours: the rules do not give it). */
export const KARATE_MAT: MatSize = { length: 1, width: 1 };

/** What a karate plan is laid out from. */
export interface KarateOptions {
  fig: KarateFigures;
  across: number;
  down: number;
  officials: boolean;
  judges: boolean;
  seams: boolean;
}

/** What a karate plan is. */
export interface KarateLayout {
  parts: Parts;
  /** The mats, the competition areas and the safety area together. */
  mats: MBox;
  extent: MBox;
  /** The competition areas (the matted squares of 8 m), left to right and top to bottom, and the inner square of each (without the outer band). */
  areas: MBox[];
  inner: MBox[];
  gap: number;
  pieces: Piece[];
  marks: MMark[];
}

/** The plan of the karate area the options ask for. */
export function karateParts(o: KarateOptions): KarateLayout {
  const { fig, across, down } = o;
  const a = fig.area;
  const gap = fig.between;
  const width = across * a + (across - 1) * gap + 2 * fig.safety;
  const height = down * a + (down - 1) * gap + 2 * fig.safety;
  const mats: MBox = { x0: 0, y0: 0, x1: width, y1: height };
  const areas: MBox[] = [];
  for (let j = 0; j < down; j += 1) for (let i = 0; i < across; i += 1) areas.push({ x0: fig.safety + i * (a + gap), y0: fig.safety + j * (a + gap), x1: fig.safety + i * (a + gap) + a, y1: fig.safety + j * (a + gap) + a });
  const inner = areas.map((b) => grow(b, -fig.band));
  const parts = emptyParts();
  const zones = [...inner.map((b) => ({ box: b, tone: 1 as const })), ...(fig.band > 0 ? areas.map((b) => ({ box: b, tone: 3 as const })) : [])];
  const pieces = tint(lay(mats, KARATE_MAT, "x", false), zones, 2, KARATE_MAT);
  parts.areas.push(...tatamiAreas("mats", pieces, { 1: "ky-bud-t1", 2: "ky-bud-t2", 3: "ky-bud-t3" }, { 1: "competition-area", 2: "safety-area", 3: "boundary-band" }));
  if (o.seams) parts.shapes.push(...seams("mats", pieces, 0.02));
  // Kumite: the two mats turned over, red side up, 1 m from the centre, where the athletes stand, front and centre, facing each other.
  if (fig.startMats !== null) {
    const s = fig.startMats.size;
    areas.forEach((b, k) => {
      const cx = (b.x0 + b.x1) / 2;
      const cy = (b.y0 + b.y1) / 2;
      for (const [side, dx] of [["left", -1], ["right", 1]] as const) {
        const near = cx + dx * fig.startMats!.fromCentre;
        const far = cx + dx * (fig.startMats!.fromCentre + s);
        parts.areas.push(rectArea(`start-mat-${k + 1}-${side}`, "start-mats", "ky-bud-t3", { x0: Math.min(near, far), y0: cy - s / 2, x1: Math.max(near, far), y1: cy + s / 2 }));
      }
    });
  }
  const desks: MBox[] = [];
  const seats: MBox[] = [];
  if (o.officials) {
    for (const b of areas.filter((_, k) => k < across)) {
      const cx = (b.x0 + b.x1) / 2;
      desks.push({ x0: cx - 1.5, y0: -2.3, x1: cx + 1.5, y1: -1.5 });
    }
    desks.forEach((d, k) => parts.areas.push(rectArea(`table-${k + 1}`, "officials", "ky-bud-desk", d)));
  }
  // The judges sit about 1.5 m off the corners, in the safety area; the referee stands at the middle, 2 m inside the boundary on the near side.
  if (o.judges) {
    areas.forEach((b, k) => {
      const d = fig.judges / Math.SQRT2;
      const at = [[b.x0 - d, b.y0 - d], [b.x1 + d, b.y0 - d], [b.x0 - d, b.y1 + d], [b.x1 + d, b.y1 + d]] as const;
      at.forEach(([x, y], n) => {
        const seat = { x0: x - 0.3, y0: y - 0.3, x1: x + 0.3, y1: y + 0.3 };
        seats.push(seat);
        parts.areas.push(rectArea(`judge-${k + 1}-${n + 1}`, "judges", "ky-bud-seat", seat));
      });
      const cx = (b.x0 + b.x1) / 2;
      const ref = { x0: cx - 0.3, y0: b.y1 - fig.referee - 0.3, x1: cx + 0.3, y1: b.y1 - fig.referee + 0.3 };
      seats.push(ref);
      parts.areas.push({ id: `referee-${k + 1}`, feature: "referee", cls: "ky-bud-seat", ellipse: [cx, b.y1 - fig.referee, 0.3, 0.3] });
    });
  }
  const first = areas[0];
  const fx = (first.x0 + first.x1) / 2;
  const marks: MMark[] = [];
  marks.push({ id: "competition-area", x: fx, y: first.y0 + a * 0.28, side: "top" });
  marks.push({ id: "safety-area", x: fx, y: fig.safety / 2, side: "top" });
  if (fig.band > 0) marks.push({ id: "boundary-band", x: first.x0 + a * 0.22, y: first.y1 - fig.band / 2, side: "bottom" });
  if (fig.startMats !== null) marks.push({ id: "start-mat", x: fx + fig.startMats.fromCentre + fig.startMats.size / 2, y: (first.y0 + first.y1) / 2, side: "bottom" });
  if (o.judges) {
    marks.push({ id: "referee", x: fx, y: first.y1 - fig.referee, side: "bottom" });
    marks.push({ id: "judge", x: first.x1 + fig.judges / Math.SQRT2, y: first.y1 + fig.judges / Math.SQRT2, side: "bottom" });
  }
  if (across > 1) marks.push({ id: "between-areas", x: first.x1 + gap / 2, y: (first.y0 + first.y1) / 2, side: "bottom" });
  const extent = union([mats, ...desks.map((d) => grow(d, 0.3)), ...seats.map((d) => grow(d, 0.2))]);
  return { parts, mats, extent, areas, inner, gap, pieces, marks };
}
