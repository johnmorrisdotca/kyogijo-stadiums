// What stands on a realistic (`hardwood`) basketball floor, seen from above: each basket with its stanchion and its soft shadow, and along the bottom sideline the
// coaching box's lines, the scorers' table and the two benches. The shadows are stacked translucent shapes (a blur is not in every renderer), laid as if the light came
// from the top left: a thing 10 feet up throws its shadow farther than one on the floor. The stanchion's and the benches' places are drawn to look right, not measured
// from a rulebook: only the court's own figures (the board's width and place, the rim) are.
import { el, num } from "../format.ts";
import type { Hardwood } from "../hardwood.ts";
import type { CourtSpec } from "../leagues/basketball.ts";
import { ft, type BuildOptions } from "./surface.ts";

/** The shadow of a thing that stands this high (feet): how far it falls to the right and down the drawing. */
const fall = (height: number): [number, number] => [height * 0.14, height * 0.1];

/** A box in the drawing's feet. */
type Box = [x0: number, y0: number, x1: number, y1: number];

/** A shadow to cast: the box of a thing and how high it stands. */
type Cast = [box: Box, height: number];

/** The soft shadow of a set of things: a few layers, each one path of every shadow grown by a few inches, so that its edge fades; one layer in the plain detail. */
function shadows(things: readonly Cast[], h: Hardwood): string {
  const layers: readonly (readonly [grow: number, opacity: number])[] = h.fine ? [[0.7, 0.025], [0.55, 0.03], [0.4, 0.03], [0.25, 0.035], [0.1, 0.04], [0, 0.04]] : [[0.15, 0.14]];
  return layers
    .map(([grow, opacity]) => {
      const d = things.map(([[x0, y0, x1, y1], height]) => {
        const [dx, dy] = fall(height);
        return `M${num(x0 + dx - grow)} ${num(y0 + dy - grow)}H${num(x1 + dx + grow)}V${num(y1 + dy + grow)}H${num(x0 + dx - grow)}Z`;
      });
      return el("path", { class: "ky-hw-shade", d: d.join(""), fill: "#000", "fill-opacity": opacity });
    })
    .join("");
}

/** What `basket` needs of the court, in feet. */
export interface HoopGeo {
  L: number;
  W: number;
  /** The border's width. */
  bw: number;
}

/**
 * Both baskets from above, with their shadows. The backboard is where the court's figures put it (`court.backboard`), the rim in its place and size; the stanchion
 * stands behind the baseline in the border and the ground beyond, with its padded base on the floor.
 */
export function hoops(o: BuildOptions, h: Hardwood, court: CourtSpec, g: HoopGeo): string {
  const { L, W } = g;
  const cy = W / 2;
  const half = court.backboard.width / 2;
  const back = court.backboard.fromBaseline;
  const pole = -(g.bw + 1.1);
  const cast: Cast[] = [];
  let rims = "";
  let solid = "";
  for (const end of [0, 1] as const) {
    // A box in the left end's own feet, as the world's: mirrored about the court's middle at the right end.
    const at = (x0: number, y0: number, x1: number, y1: number): Box => (end === 0 ? [x0, y0, x1, y1] : [L - x1, y0, L - x0, y1]);
    const x = (v: number): number => (end === 0 ? v : L - v);
    const pad = at(pole - 1.2, cy - 2.6, pole + 1.2, cy + 2.6);
    const arm = at(pole, cy - 0.38, back, cy + 0.38);
    const top = at(pole - 0.7, cy - 0.7, pole + 0.7, cy + 0.7);
    const board = at(back - 0.19, cy - half, back + 0.19, cy + half);
    const bracket = at(back + 0.19, cy - 0.17, court.basket - court.rim, cy + 0.17);
    const by = fall(10);
    cast.push([pad, 0.6], [arm, 10], [top, 10], [board, 10]);
    rims += el("circle", { class: "ky-hw-shade", cx: num(x(court.basket) + by[0]), cy: num(cy + by[1]), r: num(court.rim + 0.1), fill: "none", stroke: "#000", "stroke-opacity": h.fine ? 0.1 : 0.16, "stroke-width": num(h.fine ? 0.42 : 0.3) });
    if (h.fine) rims += el("circle", { class: "ky-hw-shade", cx: num(x(court.basket) + by[0]), cy: num(cy + by[1]), r: num(court.rim * 0.8), fill: "#000", "fill-opacity": 0.05 });
    const rect = (cls: string, b: Box, round: number): string => el("rect", { class: cls, x: num(b[0]), y: num(b[1]), width: num(b[2] - b[0]), height: num(b[3] - b[1]), rx: num(round) || undefined });
    solid += rect("ky-hw-pad", pad, 0.5) + rect("ky-hw-arm", arm, 0.1) + rect("ky-hw-arm", top, 0.25) + rect("ky-hw-arm", bracket, 0.05) + rect("ky-hw-glass", board, 0.06);
    if (h.fine) {
      solid += el("circle", { class: "ky-hw-net", cx: num(x(court.basket)), cy, r: num(court.rim * 0.8), "stroke-width": 0.04, "fill-opacity": 0, fill: "#fff" });
      solid += el("circle", { class: "ky-hw-net", cx: num(x(court.basket)), cy, r: num(court.rim * 0.5), "stroke-width": 0.04, "stroke-opacity": 0.5 });
    }
    solid += el("circle", { class: ft(o, "rims", "ky-rim"), cx: num(x(court.basket)), cy, r: court.rim, "stroke-width": h.fine ? 0.17 : 0.2, fill: "none" });
  }
  return shadows(cast, h) + rims + solid;
}

/** What the bench side needs of the court. */
export interface BenchGeo extends HoopGeo {
  /** Where the coaching box ends along the sideline, from the baseline. */
  box: number;
  /** The thickness of a line. */
  thin: number;
}

/**
 * The coaching box's two lines across the border of the bottom sideline, the scorers' table in the middle of it, and a bench either side. They are drawn only when the
 * ground beyond the border is deep enough to hold them.
 */
export function bench(o: BuildOptions, g: BenchGeo, room: number): string {
  const { L, W, bw } = g;
  if (room < bw + 3.7) return "";
  let out = "";
  const lines = [g.box, L - g.box].map((x) => `M${num(x)} ${num(W)}V${num(W + bw + 1.3)}`).join("");
  out += el("path", { class: ft(o, "court-marks", "ky-line"), d: lines, "stroke-width": num(g.thin * 0.8), fill: "none" });
  // The table is a long low box with a row of chairs behind it; each bench is a row of seats facing the court. All of it is one path.
  const table = 8;
  const parts: string[] = [];
  const box = (x0: number, x1: number, y0: number, y1: number): void => {
    parts.push(`M${num(x0)} ${num(y0)}H${num(x1)}V${num(y1)}H${num(x0)}Z`);
  };
  const seats = (x0: number, x1: number, y: number, size: number): void => {
    const count = Math.max(1, Math.floor((x1 - x0) / (size * 1.45)));
    const step = (x1 - x0) / count;
    for (let i = 0; i < count; i += 1) box(x0 + i * step + (step - size) / 2, x0 + i * step + (step + size) / 2, y, y + size);
  };
  const front = W + bw + 0.7;
  box(L / 2 - table, L / 2 + table, front, front + 1.5);
  seats(L / 2 - table + 0.5, L / 2 + table - 0.5, front + 1.9, 0.9);
  for (const [a, b] of [[g.box + 1, L / 2 - table - 1], [L / 2 + table + 1, L - g.box - 1]]) if (b - a > 3) seats(a, b, front + 0.2, 1.3);
  out += el("path", { class: "ky-hw-furniture", d: parts.join("") });
  return out;
}
