// The field events' facilities, each at the size the World Athletics Track and Field Facilities Manual (2019 edition, 2.3 and 2.4, Figures 2.3.1.1a, 2.3.2.1, 2.3.3.1, 2.3.4.1, 2.4.1.1 to 2.4.4.2)
// and Technical Rules 25 to 38 of Book C2.1 give, in metres, and each made about its own origin and the direction of its throw or its run: a circle, a runway, a pit, a mat, a sector. The standard
// stadium's places for them (Figure 2.5a and the Marking Plan) are in infield.ts. Nothing here draws SVG.
import { arc, line, path, poly, ring } from "../fields.kit.ts";
import type { Area, Shape } from "../fields.types.ts";
import { num } from "../format.ts";
import { arcD } from "./track.ts";
import type { Parts } from "./oval.ts";
import { emptyParts } from "./oval.ts";
import type { AthleticsFieldEvent } from "./types.ts";

/** A point in the plan. */
type Pt = readonly [number, number];

/** What a facility is, as data: where it stands, which way it throws or jumps, and the figures that say how big it is. */
export interface Facility {
  id: string;
  event: AthleticsFieldEvent;
  /** The throw's circle centre, the javelin arc's centre point, the high jump's bar centre, the pole vault's box, the jump's take-off board. */
  x: number;
  y: number;
  /** The direction of the throw or the jump, in radians clockwise from the right as the eye sees it. */
  heading: number;
  /** A box round all of it, for the ranges. */
  box: { x0: number; y0: number; x1: number; y1: number };
  /** The length of the sector, or the runway, or the run-up. */
  reach?: number;
}

/** What every throw's sector needs. The angle is 34.92 degrees (Rule 32; Manual 2.4.1.4): 12 m apart at 20 m from the centre, so 0.6 m for each metre. */
export const SECTOR_ANGLE = 2 * Math.atan(0.3);

/** The javelin sector's half angle: the arc's radius is 8 m and the runway 4 m wide, so the lines through the arc's ends make 28.96 degrees (Rule 32.12.2; Figure 2.4.3.2). */
export const JAVELIN_HALF = Math.asin(2 / 8);

const f = (n: number): string => num(n);
const at = (c: Pt, theta: number, k: number, side = 0): Pt => [c[0] + k * Math.cos(theta) - side * Math.sin(theta), c[1] + k * Math.sin(theta) + side * Math.cos(theta)];

/** The path of a closed polygon filled as an area. */
const polyArea = (id: string, cls: Area["cls"], feature: string, points: readonly Pt[]): Area => ({ id, feature, cls, d: `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z` });

/** A rectangle in the plan, `w` along `heading` and `h` across it, centred at `c`, as an area. */
export function rectArea(id: string, cls: Area["cls"], feature: string, c: Pt, heading: number, w: number, h: number): Area {
  return polyArea(id, cls, feature, [at(c, heading, -w / 2, -h / 2), at(c, heading, w / 2, -h / 2), at(c, heading, w / 2, h / 2), at(c, heading, -w / 2, h / 2)]);
}

/** The outline of the same rectangle as a line. */
export function rectLine(id: string, feature: string, c: Pt, heading: number, w: number, h: number, wLine: number): Shape {
  return poly(id, feature, [at(c, heading, -w / 2, -h / 2), at(c, heading, w / 2, -h / 2), at(c, heading, w / 2, h / 2), at(c, heading, -w / 2, h / 2)], { closed: true, w: wLine });
}

/** The sector of a throw: its two lines from the circle's rim to the arc, and the arc, 50 mm wide, the inner edges through the circle's centre (Rule 32.12.1). */
export function sectorShapes(id: string, feature: string, c: Pt, heading: number, rim: number, reach: number, half = SECTOR_ANGLE / 2): Shape[] {
  const a = heading - half;
  const b = heading + half;
  const p0 = at(c, a, rim);
  const p1 = at(c, a, reach);
  const q0 = at(c, b, rim);
  const q1 = at(c, b, reach);
  const thin = { cls: "ky-ath-s", least: 0.07 } as const;
  return [poly(`${id}-sector-line`, feature, [p0, p1], thin), poly(`${id}-sector-line`, feature, [q0, q1], thin), path(`${id}-sector-arc`, feature, arcD(c[0], c[1], reach, a, b), thin)];
}

/** A throwing circle (Rule 32.6 to 32.8; Manual 2.4.1.2): the concrete inside the rim, the rim, the 0.75 m lines at right angles to the sector's axis, the centre. `d` is the inside diameter. */
export function circleParts(id: string, event: AthleticsFieldEvent, c: Pt, heading: number, d: number, rim = 0.06): Parts {
  const parts = emptyParts();
  const r = d / 2;
  parts.areas.push({ id: `${id}-circle`, feature: event, cls: "ky-ath-concrete", d: `M${f(c[0] - r)} ${f(c[1])}A${f(r)} ${f(r)} 0 1 0 ${f(c[0] + r)} ${f(c[1])}A${f(r)} ${f(r)} 0 1 0 ${f(c[0] - r)} ${f(c[1])}Z` });
  parts.shapes.push(ring(`${id}-rim`, event, c[0], c[1], r + rim / 2, r + rim / 2, { w: rim }));
  for (const side of [-1, 1]) {
    const p = at(c, heading, 0, side * (r + rim));
    const q = at(c, heading, 0, side * (r + rim + 0.75));
    parts.shapes.push(line(`${id}-circle-line`, event, p[0], p[1], q[0], q[1], { w: 0.05 }));
  }
  return parts;
}

/** The shot put's stop board (Rule 33.2; Manual 2.4.4.3): an arc on the circle's inside edge, 1.21 m long (the chord), 0.112 m wide, centred on the sector's axis. */
export function stopBoard(id: string, c: Pt, heading: number, d: number): Area {
  const r = d / 2;
  const half = Math.asin(1.21 / 2 / r);
  const inner = r;
  const outer = r + 0.112;
  const p = (k: number, th: number): Pt => at(c, th, k);
  const a = heading - half;
  const b = heading + half;
  const [i0, i1, o0, o1] = [p(inner, a), p(inner, b), p(outer, a), p(outer, b)];
  return { id: `${id}-stop-board`, feature: "shot-put", cls: "ky-ath-board", d: `M${f(i0[0])} ${f(i0[1])}A${f(inner)} ${f(inner)} 0 0 1 ${f(i1[0])} ${f(i1[1])}L${f(o1[0])} ${f(o1[1])}A${f(outer)} ${f(outer)} 0 0 0 ${f(o0[0])} ${f(o0[1])}Z` };
}

/**
 * A discus or hammer cage in plan (Rules 35 and 37; Manual 2.4.1.3, Figure 2.4.1.2): U-shaped, its mouth 6 m wide and 7 m in front of the circle's centre, the netting no nearer than 3 m behind it. The
 * mouth and the line the sides take to it are the rules'; the rear is drawn as an arc about the centre, which is ours.
 */
export function cageShapes(id: string, c: Pt, heading: number): Shape[] {
  const mouth: Pt = [7, 3];
  const wide = 4.4;
  const pts = (u: number, v: number): Pt => at(c, heading, u, v);
  const back = 4.4;
  const left = [pts(mouth[0], -mouth[1]), pts(0, -wide)];
  const right = [pts(mouth[0], mouth[1]), pts(0, wide)];
  const a0 = heading - Math.PI / 2;
  const a1 = heading + Math.PI / 2;
  const rear = arcD(c[0], c[1], back, a0 + Math.PI, a1 + Math.PI);
  return [poly(`${id}-cage`, "cage", [left[0], left[1]], { w: 0.12, cls: "ky-ath-k" }), poly(`${id}-cage`, "cage", [right[0], right[1]], { w: 0.12, cls: "ky-ath-k" }), path(`${id}-cage`, "cage", rear, { w: 0.12, cls: "ky-ath-k" })];
}

/** The javelin's runway and arc (Rule 32.9 to 32.12; Manual 2.4.3.2 and 2.4.3.3), about the centre point of the arc and the throwing direction `heading` (0 throws right). */
export function javelinParts(id: string, c: Pt, heading: number, runway = 36.5): { parts: Parts; facility: Facility } {
  const parts = emptyParts();
  const xe = 8 * Math.cos(JAVELIN_HALF);
  const w = 2;
  // The runway: two lines 4 m apart from the ends of the arc back `runway` metres, the arc, and the 0.75 m lines at right angles to the runway at the arc's ends.
  for (const side of [-1, 1]) {
    const p = at(c, heading, xe, side * w);
    const q = at(c, heading, xe - runway, side * w);
    parts.shapes.push(line(`${id}-runway-line`, "javelin-throw", p[0], p[1], q[0], q[1], { w: 0.05 }));
    const m0 = at(c, heading, xe, side * w);
    const m1 = at(c, heading, xe, side * (w + 0.75));
    parts.shapes.push(line(`${id}-arc-mark`, "javelin-throw", m0[0], m0[1], m1[0], m1[1], { w: 0.07 }));
    // Two white squares of 0.05 m beside the runway, 4 m back from the ends of the arc.
    const sq = at(c, heading, xe - 4, side * (w + 0.12));
    parts.shapes.push(line(`${id}-square`, "javelin-throw", sq[0], sq[1], sq[0], sq[1], { w: 0.05 }));
  }
  parts.shapes.push(arc(`${id}-arc`, "javelin-throw", c[0], c[1], 8, (heading - JAVELIN_HALF) * (180 / Math.PI), (heading + JAVELIN_HALF) * (180 / Math.PI), { w: 0.07 }));
  parts.shapes.push(...sectorShapes(id, "javelin-throw", c, heading, 8, 100, JAVELIN_HALF));
  const end = at(c, heading, xe - runway, 0);
  const box = bounds([end, at(c, heading, 100, -25), at(c, heading, 100, 25), at(c, heading, 0, 0), at(c, heading, 100, 0)]);
  return { parts, facility: { id, event: "javelin-throw", x: c[0], y: c[1], heading, box, reach: 100 } };
}

/** The box round some points. */
export function bounds(points: readonly Pt[]): { x0: number; y0: number; x1: number; y1: number } {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}


/**
 * A high jump facility (Rule 27; Manual 2.3.3): the uprights 4.02 m apart (Rule 27.6: 4.00 to 4.04 m), the crossbar, the landing mat of 6 m by 4 m at the least (Rule 27.7; Manual 2.3.3.4) with the bar's
 * plane 0.5 m inside its front edge, the 50 mm line 3 m outside each upright (Rule 27.1, note) and the run-up: a 16 m wide area, 15 m long (Rule 27.3: 25 m for the major competitions), drawn
 * as a dashed outline cut by the arc of the 15 m radius. `heading` is the way the athlete jumps; the facility is about the bar's middle.
 */
export function highJumpParts(id: string, c: Pt, heading: number, runup = 15): { parts: Parts; facility: Facility } {
  const parts = emptyParts();
  parts.areas.push(rectArea(`${id}-mat`, "ky-ath-mat", "high-jump", at(c, heading, 1.5), heading, 4, 6));
  parts.shapes.push(rectLine(`${id}-mat-edge`, "high-jump", at(c, heading, 1.5), heading, 4, 6, 0.05));
  const a = at(c, heading, 0, -5.01);
  const b = at(c, heading, 0, 5.01);
  parts.shapes.push(line(`${id}-take-off-line`, "high-jump", a[0], a[1], b[0], b[1], { w: 0.05 }));
  const bar0 = at(c, heading, 0, -2.01);
  const bar1 = at(c, heading, 0, 2.01);
  parts.shapes.push(line(`${id}-crossbar`, "high-jump", bar0[0], bar0[1], bar1[0], bar1[1], { w: 0.04, cls: "ky-ath-k" }));
  for (const side of [-1, 1]) {
    const p = at(c, heading, 0, side * 2.01);
    parts.shapes.push({ kind: "dot", id: `${id}-upright`, feature: "high-jump", cx: p[0], cy: p[1], r: 0.1, paint: "post" });
  }
  // The run-up: 8 m either side of the middle of the bar, to 15 m back, rounded by the arc of 15 m about the bar's middle.
  const half = 8;
  const x = Math.sqrt(runup * runup - half * half);
  const [p0, p1] = [at(c, heading, 0, -half), at(c, heading, -x, -half)];
  const [q0, q1] = [at(c, heading, -x, half), at(c, heading, 0, half)];
  const sweep = 0;
  const d = `M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}A${f(runup)} ${f(runup)} 0 0 ${sweep} ${f(q0[0])} ${f(q0[1])}L${f(q1[0])} ${f(q1[1])}`;
  parts.shapes.push(path(`${id}-run-up`, "high-jump", d, { w: 0.04, dash: [0.6, 0.6], least: 0.04 }));
  const box = bounds([at(c, heading, 4.5, -3.2), at(c, heading, 4.5, 3.2), at(c, heading, -runup, -half), at(c, heading, -runup, half)]);
  return { parts, facility: { id, event: "high-jump", x: c[0], y: c[1], heading, box, reach: runup } };
}

/**
 * A pole vault's box and 0-line at the end of a runway (Rule 28.3 and 28.4; Manual 2.3.4.2): the box 1.00 m long, 0.60 m wide at the front and 0.15 m at the stop board, set so that the top inside
 * edge of the stop board is on the 0-line, which is 10 mm wide and runs on past the uprights (5.20 m apart at the least). `c` is the middle of the stop board and `heading` the way the athlete
 * runs; the landing mat of 6.00 m by 6.00 m at the least with front pieces 2 m long (Rule 28.5; Manual 2.3.4.4) lies beyond, its front 0.10 to 0.15 m from the box.
 */
export function poleVaultEnd(id: string, c: Pt, heading: number): { parts: Parts; facility: Facility } {
  const parts = emptyParts();
  parts.areas.push(polyArea(`${id}-box`, "ky-ath-pad", "pole-vault", [at(c, heading, -1, -0.3), at(c, heading, 0, -0.075), at(c, heading, 0, 0.075), at(c, heading, -1, 0.3)]));
  parts.areas.push(rectArea(`${id}-mat`, "ky-ath-mat", "pole-vault", at(c, heading, 0.15 + 4), heading, 8, 6));
  parts.shapes.push(rectLine(`${id}-mat-edge`, "pole-vault", at(c, heading, 0.15 + 4), heading, 8, 6, 0.05));
  const a = at(c, heading, 0, -2.8);
  const b = at(c, heading, 0, 2.8);
  parts.shapes.push(line(`${id}-zero-line`, "pole-vault", a[0], a[1], b[0], b[1], { w: 0.03, least: 0.08, cls: "ky-ath-r" }));
  for (const side of [-1, 1]) {
    const p = at(c, heading, 0.1, side * 2.6);
    parts.shapes.push({ kind: "dot", id: `${id}-upright`, feature: "pole-vault", cx: p[0], cy: p[1], r: 0.1, paint: "post" });
  }
  const box = bounds([at(c, heading, -45, -0.7), at(c, heading, -45, 0.7), at(c, heading, 8.2, -3), at(c, heading, 8.2, 3)]);
  return { parts, facility: { id, event: "pole-vault", x: c[0], y: c[1], heading, box, reach: 45 } };
}

/** The runway of a jump: two lines 1.22 m apart (Rule 29.1; Manual 2.3.1.2) from `from` to `to` along `heading`, as lines. */
export function runwayLines(id: string, event: AthleticsFieldEvent, from: Pt, to: Pt, width = 1.22): Shape[] {
  const heading = Math.atan2(to[1] - from[1], to[0] - from[0]);
  return [-1, 1].map((side) => {
    const a = at(from, heading, 0, (side * width) / 2);
    const b = at(to, heading, 0, (side * width) / 2);
    return line(`${id}-runway-line`, event, a[0], a[1], b[0], b[1], { w: 0.05 });
  });
}

/** A landing pit (Rule 30; Manual 2.3.1.4): the sand with its white border, `length` long along the jump and `width` across it, centred at `c`. */
export function pitParts(id: string, event: AthleticsFieldEvent, c: Pt, heading: number, length: number, width: number): Parts {
  const parts = emptyParts();
  parts.areas.push(rectArea(`${id}-pit`, "ky-ath-sand", event, c, heading, length, width));
  parts.shapes.push(rectLine(`${id}-pit-border`, event, c, heading, length, width, 0.05));
  return parts;
}

/** A take-off board (Rule 29.2; Manual 2.3.1.3): 1.22 m by 0.20 m, white, whose edge nearer the pit is the take-off line, `d` metres from the pit's near end. `pitEdge` is that end's middle. */
export function takeOffBoard(id: string, event: AthleticsFieldEvent, pitEdge: Pt, heading: number, d: number): Area {
  // The board lies behind the take-off line, away from the pit: along the run, `d` from the pit's near end is the line and the board is the 0.20 m before it.
  const line0 = at(pitEdge, heading, -d);
  return rectArea(id, "ky-ath-board", event, at(line0, heading, -0.1), heading, 0.2, 1.22);
}
