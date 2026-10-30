// The walls and quirks of a ballpark, drawn on its field: a band outside each stretch of the fence whose width and shade say how high it stands, the hill,
// the overhang, the ivy, the poles and bullpens, the distance to the backstop and the dugouts. The figures are the park's article's (parks.ts); where it gives
// none nothing is drawn. Everything is in the field's own frame, in feet: x across (negative to the left), y minus the distance out from home plate.
import { el, num } from "../format.ts";
import { fenceAt, type FencePoint } from "../geometry.ts";
import { lengthText, quirkName, tierOf, tierTexts, wallText, type Ballpark } from "../ballpark.ts";
import type { HillQuirk, ParkQuirk } from "../parks.core.ts";
import type { DugoutSide } from "../parks.core.ts";
import { textOn } from "./surface.ts";

const RAD = Math.PI / 180;
const SQ = Math.SQRT1_2;
/** The size of the words on the field and in the legend, in feet. */
const TEXT = 6.5;

/** How wide the band of a wall is drawn, in feet, from its height in feet: a taller wall has a wider band. */
export const bandWidth = (feet: number): number => 2 + 0.22 * feet;

const at = (angle: number, distance: number): [number, number] => [distance * Math.sin(angle * RAD), -distance * Math.cos(angle * RAD)];
const pt = ([x, y]: [number, number]): string => `${num(x)} ${num(y)}`;

/** The angles from `from` to `to`, a step of 1.5 degrees apart and ending on `to`. */
function angles(from: number, to: number): number[] {
  const out: number[] = [];
  for (let a = from; a < to - 1e-9; a += 1.5) out.push(a);
  out.push(to);
  return out;
}

/** A closed shape between two offsets of the fence over a stretch of it: `inner` and `outer` are distances to add to the fence's. */
function strip(points: readonly FencePoint[], from: number, to: number, inner: number, outer: number): string {
  const as = angles(from, to);
  const near = as.map((a): [number, number] => at(a, fenceAt(points, a) + inner));
  const far = as.map((a): [number, number] => at(a, fenceAt(points, a) + outer)).reverse();
  return `M${[...near, ...far].map(pt).join("L")}Z`;
}

/** An open line along the fence over a stretch of it, offset from it. */
function along(points: readonly FencePoint[], from: number, to: number, offset: number): string {
  return `M${angles(from, to).map((a) => pt(at(a, fenceAt(points, a) + offset))).join("L")}`;
}

/** How far a hill reaches in from the fence: as far as it is wide (the article gives its width and no depth, so it is drawn square). */
const hillSpan = (q: HillQuirk): { from: number; to: number } => {
  const half = Math.atan(q.width_ft / 2 / q.feet) / RAD;
  return { from: Math.max(-45, q.angle - half), to: Math.min(45, q.angle + half) };
};

/** The room a ballpark's additions need: beyond the fence at the sides and top, below home plate for the backstop's bar, and under the drawing for the legend. */
export function ballparkRoom(b: Ballpark): { side: number; below: number; legend: number } {
  const bands = b.walls.reduce((most, wall) => Math.max(most, bandWidth(wall.height_ft)), 0);
  const quirks = b.quirks.some((q) => q.kind === "basket") ? 4 : 0;
  return {
    side: b.walls.length > 0 ? Math.max(bands + 2, quirks) : quirks,
    below: b.backstop === undefined ? 0 : b.backstop + (b.quirkLabels ? 12 : 8),
    legend: b.legend ? 40 : 0,
  };
}

/** A word on the field, upright, set inside the fence and anchored so that it runs into the field and not out of the drawing. */
function label(x: number, y: number, text: string): string {
  return textOn(false, x, y, text, { size: TEXT, anchor: x > 40 ? "end" : x < -40 ? "start" : "middle", cls: "ky-wl" });
}

function dugout(side: DugoutSide, home: boolean): string {
  const s = side === "first" ? 1 : -1;
  const corner = (t: number, o: number): [number, number] => [s * SQ * (t + o), -SQ * (t - o)];
  const d = `M${[corner(30, 7), corner(70, 7), corner(70, 15), corner(30, 15)].map(pt).join("L")}Z`;
  return el("path", { class: home ? "ky-dugout" : "ky-dugout ky-dugout-away", d });
}

/** What is drawn under the lines: the hill and the overhang on the grass, the bands of the walls outside the fence, and the dugouts. */
export function ballparkUnder(b: Ballpark, points: readonly FencePoint[]): string {
  let out = "";
  for (const q of b.quirks) {
    if (q.kind === "hill") {
      const { from, to } = hillSpan(q);
      out += el("path", { class: "ky-hill", d: strip(points, from, to, -q.width_ft, 0) });
    } else if (q.kind === "overhang") out += el("path", { class: "ky-overhang", d: strip(points, q.from, q.to, -q.depth_ft, 0) });
  }
  for (const wall of b.walls) out += el("path", { class: `ky-wall ky-wall-${tierOf(wall.height_ft)}`, d: strip(points, wall.from, wall.to, 0, bandWidth(wall.height_ft)) });
  if (b.dugouts?.home !== undefined) out += dugout(b.dugouts.home, true);
  if (b.dugouts?.visitors !== undefined) out += dugout(b.dugouts.visitors, false);
  return out;
}

const markOf = (q: ParkQuirk, points: readonly FencePoint[]): [number, number] | undefined => {
  switch (q.kind) {
    case "pole":
      return at(q.angle, q.feet - 8);
    case "flagpole":
    case "bullpen": {
      const [x, y] = at(q.angle, q.feet);
      return [x, y + 11];
    }
    case "hill":
      return at(q.angle, fenceAt(points, q.angle) - q.width_ft - 5);
    case "overhang": {
      const mid = (q.from + q.to) / 2;
      return at(mid, fenceAt(points, mid) - q.depth_ft - 5);
    }
    default:
      return undefined;
  }
};

/** What is drawn over the lines: the ivy and the basket, the poles and the bullpens, the backstop's bar, and the names. */
export function ballparkOver(b: Ballpark, points: readonly FencePoint[]): string {
  let out = "";
  for (const q of b.quirks) {
    if (q.kind === "ivy") out += el("path", { class: "ky-ivy", d: along(points, q.from, q.to, 0) });
    else if (q.kind === "basket") out += el("path", { class: "ky-basket", d: along(points, q.from, q.to, 2.5) });
    else if (q.kind === "pole" || q.kind === "flagpole") {
      const [x, y] = at(q.angle, q.feet);
      out += el("circle", { class: "ky-pole", cx: x, cy: y, r: q.kind === "pole" ? 2.4 : 2 });
    } else if (q.kind === "bullpen") {
      const [x, y] = at(q.angle, q.feet);
      out += el("rect", { class: "ky-bullpen", x: x - 5, y: y - 3.5, width: 10, height: 7 });
    }
  }
  if (b.backstop !== undefined) {
    out += el("path", { class: "ky-backstop", d: `M0 4V${num(b.backstop)}M-9 ${num(b.backstop)}H9`, fill: "none" });
    if (b.quirkLabels) out += textOn(false, 12, b.backstop + 2, `${lengthText(b.backstop, b.unit)} ${b.words.unit[b.unit]}`, { size: TEXT, anchor: "start", cls: "ky-wl" });
  }
  if (b.quirkLabels) {
    for (const q of b.quirks) {
      const mark = markOf(q, points);
      if (mark === undefined) continue;
      out += label(mark[0], mark[1], quirkName(q, b.words));
    }
  }
  if (b.wallLabels) {
    for (const wall of b.walls) {
      const mid = (wall.from + wall.to) / 2;
      const [x, y] = at(mid, fenceAt(points, mid) - 10);
      out += label(x, y, wallText(wall, b));
    }
  }
  return out;
}

/** The key to the shades: a panel with its heading and the four tiers, centred under the field, its top at `y`. */
export function ballparkLegend(b: Ballpark, y: number): string {
  const cell = 78;
  const texts = tierTexts(b);
  let out = el("rect", { class: "ky-wl-p", x: -(cell + 5), y, width: 2 * cell + 10, height: 37, rx: 3 });
  out += textOn(false, -cell, y + 10, b.words.heading, { size: TEXT, anchor: "start", cls: "ky-wl-k" });
  texts.forEach((text, i) => {
    const x = -cell + (i % 2) * cell;
    const row = y + 15 + Math.floor(i / 2) * 11;
    out += el("rect", { class: `ky-wall ky-wall-${i + 1}`, x, y: row, width: 11, height: 6 });
    out += textOn(false, x + 15, row + 5.2, text, { size: TEXT, anchor: "start", cls: "ky-wl-k" });
  });
  return out;
}
