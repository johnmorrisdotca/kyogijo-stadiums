// A judo competition area: the tatami in a contest area and a safety area of different colours, the common safe zone between areas that adjoin, the free zone and the platform round them, the
// tape where the contestants start and the technical table, from the IJF's Sport and Organisation Rules (8.7, Article 9, B1.8; 2020: 18.1) and the AJJF's tournament guidebook. In metres, with
// the origin at the top left of the tatami: x along the tatami, y across it, the technical table at the top. Nothing here draws SVG.
import type { JudoFigures } from "../leagues/budo.ts";
import { boxD, rectArea, tapeBar, within } from "./kit.ts";
import { emptyParts, grow, union, type MBox, type MMark, type Parts } from "./parts.ts";
import { lay, matCount, seams, tatamiAreas, tint, type MatSize, type Piece } from "./tatami.ts";
import type { BudoStyle } from "./types.ts";

/** The mats a `tatami` option names. */
export const TATAMI: Readonly<Record<NonNullable<BudoStyle["tatami"]>, MatSize>> = Object.freeze({ "2x1": { length: 2, width: 1 }, "1x1": { length: 1, width: 1 }, "182x91": { length: 1.82, width: 0.91 } });

/** What a judo plan is laid out from. */
export interface JudoOptions {
  fig: JudoFigures;
  /** The contest area's side, the safety area's width and the number of areas across and down. */
  contest: number;
  safety: number;
  across: number;
  down: number;
  mat: MatSize;
  platform: boolean;
  officials: boolean;
  start: boolean;
  seams: boolean;
  /** The colours of the tape: the contestant to the referee's right, then to his left (blue and white in the IJF's rules, red and white in the AJJF's). */
  tape: readonly ["blue" | "red" | "white", "white"];
}

/** What a judo plan is. */
export interface JudoLayout {
  parts: Parts;
  /** The tatami (the contest and the safety areas together) and everything that lies beyond it. */
  tatami: MBox;
  extent: MBox;
  /** The contest areas, left to right and top to bottom. */
  contests: MBox[];
  /** The distance between two areas that adjoin. */
  gap: number;
  pieces: Piece[];
  /** The mat the area is laid with. */
  mat: MatSize;
  marks: MMark[];
  /** The width of the red band of a danger zone, or 0. */
  danger: number;
}

/** The mats of a `tatami` option, or the league's own when none. @throws Error for a name that is not a size of mat. */
export function matOf(asked: BudoStyle["tatami"], fig: JudoFigures): MatSize {
  if (asked === undefined) return { length: fig.tatami.length, width: fig.tatami.width };
  const mat = TATAMI[asked];
  if (mat === undefined) throw new Error(`Unknown tatami "${String(asked)}": use one of ${Object.keys(TATAMI).join(", ")}`);
  return mat;
}

/** A size rounded to a whole number of mats' widths, for mats that do not divide the rule's metres (the AJJF's 91 cm). */
export const snapTo = (size: number, width: number): number => (Math.abs(width - 1) < 1e-9 ? size : Math.round(size / width) * width);

/** The areas across and down that the options ask for. @throws RangeError for a number outside 1 to 6. */
export function gridOf(areas: BudoStyle["areas"]): { across: number; down: number } {
  const a = areas === undefined ? { across: 1, down: 1 } : typeof areas === "number" ? { across: areas, down: 1 } : areas;
  for (const n of [a.across, a.down]) if (!Number.isInteger(n) || n < 1 || n > 6) throw new RangeError("budo.areas is a whole number of 1 to 6, or { across, down } of whole numbers of 1 to 6");
  return a;
}

/** The size of a contest area the options ask for, held to what the rules allow. */
export const contestOf = (asked: number | undefined, fig: JudoFigures): number => (asked === undefined ? fig.contest.drawn : within(asked, fig.contest.min, fig.contest.max, "The contest area", "the IJF's Sport and Organisation Rules (8.7)"));

/** The width of the safety area the options ask for. */
export const safetyOf = (asked: number | undefined, fig: JudoFigures): number => (asked === undefined ? fig.safety.drawn : within(asked, fig.safety.min, fig.safety.max, "The safety area", "the IJF's Sport and Organisation Rules (8.7)"));

/** The technical table: 3 m by 0.8 m (ours: the rules give no size), centred on its contest area and set well outside the free zone. */
const TABLE = { length: 3, depth: 0.8, clear: 1.5 };

/** The plan of the competition area the options ask for. */
export function judoParts(o: JudoOptions): JudoLayout {
  const { fig, contest: c, safety: s, across, down, mat } = o;
  const gap = Math.max(fig.common, s);
  const width = across * c + (across - 1) * gap + 2 * s;
  const height = down * c + (down - 1) * gap + 2 * s;
  const tatami: MBox = { x0: 0, y0: 0, x1: width, y1: height };
  const contests: MBox[] = [];
  for (let j = 0; j < down; j += 1) for (let i = 0; i < across; i += 1) contests.push({ x0: s + i * (c + gap), y0: s + j * (c + gap), x1: s + i * (c + gap) + c, y1: s + j * (c + gap) + c });
  const band = fig.danger ? mat.width : 0;
  const parts = emptyParts();
  // The free zone and the platform lie under the tatami: the platform one metre wider and longer than it, the free zone 50 cm beyond whichever is the larger.
  const platform = o.platform ? grow(tatami, fig.platform) : undefined;
  const free = grow(platform ?? tatami, fig.freeZone);
  parts.areas.push(rectArea("free-zone", "free-zone", "ky-bud-free", free));
  if (platform !== undefined) parts.areas.push(rectArea("platform", "platform", "ky-bud-platform", platform));
  // The mats of the whole competition area, then cut where a colour changes: the contest area inside the safety area, and inside it, for the domestic rules, the red band of the danger zone.
  const zones = [...(band > 0 ? contests.map((b) => ({ box: grow(b, -band), tone: 1 as const })) : []), ...contests.map((b) => ({ box: b, tone: (band > 0 ? 3 : 1) as 1 | 3 }))];
  const pieces = tint(lay(tatami, mat, "x", true), zones, 2, mat);
  parts.areas.push(...tatamiAreas("tatami", pieces, { 1: "ky-bud-t1", 2: "ky-bud-t2", 3: "ky-bud-t3" }, { 1: "contest-area", 2: "safety-area", 3: "danger-zone" }));
  if (o.seams) parts.shapes.push(...seams("tatami", pieces, 0.02));
  const marks: MMark[] = [];
  // The tape that marks where the contestants start, in the middle of each contest area, across the line between them: the one to the referee's right, who faces the table at the top, is to the east.
  if (o.start && fig.marks !== null) {
    contests.forEach((b, k) => {
      const cx = (b.x0 + b.x1) / 2;
      const cy = (b.y0 + b.y1) / 2;
      const m = fig.marks as NonNullable<JudoFigures["marks"]>;
      const at = (x: number): MBox => ({ x0: x - m.width / 2, y0: cy - m.length / 2, x1: x + m.width / 2, y1: cy + m.length / 2 });
      parts.shapes.push(tapeBar(`start-${k + 1}-right`, "start-right", `ky-bud-${o.tape[0]}-fill`, at(cx + m.fromCentre)));
      parts.shapes.push(tapeBar(`start-${k + 1}-left`, "start-left", `ky-bud-${o.tape[1]}-fill`, at(cx - m.fromCentre)));
    });
  }
  // The technical table of each area, outside the free zone, at the top.
  const desks: MBox[] = [];
  if (o.officials) {
    for (const b of contests.filter((_, k) => k < across)) {
      const cx = (b.x0 + b.x1) / 2;
      const y1 = free.y0 - TABLE.clear;
      desks.push({ x0: cx - TABLE.length / 2, y0: y1 - TABLE.depth, x1: cx + TABLE.length / 2, y1 });
    }
    desks.forEach((d, k) => parts.areas.push(rectArea(`table-${k + 1}`, "officials", "ky-bud-desk", d)));
  }
  const first = contests[0];
  const fx = (first.x0 + first.x1) / 2;
  marks.push({ id: "contest-area", x: fx, y: first.y0 + c * 0.3, side: "top" });
  marks.push({ id: "safety-area", x: fx, y: s / 2, side: "top" });
  if (band > 0) marks.push({ id: "danger-zone", x: first.x0 + c * 0.22, y: first.y1 - band / 2, side: "bottom" });
  if (o.start && fig.marks !== null) marks.push({ id: "start-mark", x: fx + fig.marks.fromCentre, y: (first.y0 + first.y1) / 2, side: "bottom" });
  if (across > 1) marks.push({ id: "common-safe-zone", x: first.x1 + gap / 2, y: (first.y0 + first.y1) / 2, side: "bottom" });
  marks.push({ id: "free-zone", x: width * 0.12, y: free.y0 + fig.freeZone / 2, side: "top" });
  // The referee stands at the middle of the tatami, 2 m back from the line the contestants start on, facing the table (Article 9).
  marks.push({ id: "referee-position", x: fx, y: (first.y0 + first.y1) / 2 + 2, side: "bottom" });
  marks.push({ id: "tatami", x: first.x0 + 0.5 * c, y: first.y0 + c * 0.7, side: "bottom" });
  if (platform !== undefined) marks.push({ id: "platform", x: width * 0.88, y: platform.y1 - fig.platform / 2, side: "bottom" });
  if (desks.length > 0) marks.push({ id: "technical-table", x: (desks[0].x0 + desks[0].x1) / 2, y: desks[0].y0 + TABLE.depth / 2, side: "top" });
  const extent = union([free, ...desks.map((d) => grow(d, 0.3))]);
  return { parts, tatami, extent, contests, gap, pieces, mat, marks, danger: band };
}

/** The number of mats of the competition area: a half mat counts a half. */
export const mats = (layout: JudoLayout, mat: MatSize): number => Math.round(matCount(layout.pieces, mat) * 100) / 100;

export { boxD };
