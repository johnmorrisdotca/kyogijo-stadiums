// The pieces the net sports' uprights share: a net hung between a top line and a bottom line, the sag of a net between its posts, and a table lifted on its legs.
import { flat, n, plane, pole, shy, threads, wall, type Plane } from "./turn.kit.ts";
import { convertLength } from "./units.ts";

/** What a net on a court is: where it hangs, between which posts, and the line of its top and of its bottom. */
export interface NetBody {
  id: string;
  x: number;
  y0: number;
  y1: number;
  /** The height of the top edge and of the bottom edge over a place across the court, above the court's own surface. */
  top: (y: number) => number;
  bottom: (y: number) => number;
  /** The mesh's cell, and the tape along the top, in feet. */
  cell: number;
  tape: number;
  /** Vertical white bands across the net at these places across the court (volleyball's side bands), and their width. */
  bands?: { at: readonly number[]; width: number };
}

/** The net: a mesh between a top line and a bottom line, with its tape, on one plane standing over the line x. */
export function netPlane(b: NetBody, lift: number): Plane {
  const { y0, y1 } = b;
  const steps = 24;
  const ys = Array.from({ length: steps + 1 }, (_, i) => y0 + ((y1 - y0) * i) / steps);
  const high = Math.max(...ys.map(b.top));
  const low = Math.min(...ys.map(b.bottom));
  const span = y1 - y0;
  const fromTop = (z: number): number => high - z;
  const edge = (f: (y: number) => number): string => ys.map((y) => `${n(y - y0)} ${n(fromTop(f(y)))}`).join("L");
  const top = ys.map((y) => `${n(y - y0)} ${n(fromTop(b.top(y)))}`);
  const bottom = [...ys].reverse().map((y) => `${n(y - y0)} ${n(fromTop(b.bottom(y)))}`);
  const outline = `M${top.join("L")}L${bottom.join("L")}Z`;
  let lines = "";
  // Upright threads, one every cell, from the top line to the bottom line.
  const across = Math.max(2, Math.round(span / b.cell));
  for (let i = 1; i < across; i += 1) {
    const y = y0 + (span * i) / across;
    lines += `M${n(y - y0)} ${n(fromTop(b.top(y)))}V${n(fromTop(b.bottom(y)))}`;
  }
  // Level threads, wherever the net reaches that height.
  const levels = Math.max(1, Math.round((high - low) / b.cell));
  for (let j = 1; j < levels; j += 1) {
    const z = low + ((high - low) * j) / levels;
    let pen = false;
    for (const y of ys) {
      const inside = z <= b.top(y) && z >= b.bottom(y);
      lines += `${inside ? (pen ? "L" : "M") : ""}${inside ? `${n(y - y0)} ${n(fromTop(z))}` : ""}`;
      pen = inside;
    }
  }
  const tape = `<path d="M${edge(b.top)}" class="u-tapeline" fill="none" stroke-width="${n(b.tape)}"/>`;
  const bands = (b.bands?.at ?? []).map((y) => `<rect x="${n(y - y0 - b.bands!.width / 2)}" y="${n(fromTop(b.top(y)))}" width="${n(b.bands!.width)}" height="${n(b.top(y) - b.bottom(y))}" class="u-tape"/>`).join("");
  return plane(b.id, "net", [b.x, y0, lift + high], [0, span, 0], [0, 0, -(high - low)], `<path d="${outline}" class="u-netfill"/>${threads(lines, b.cell)}${bands}${tape}`);
}

/** A parabola from the centre height to the post height: the sag of a net hung between two posts. */
export const sag = (y0: number, y1: number, centre: number, posts: number) => (y: number): number => {
  const middle = (y0 + y1) / 2;
  const t = (y - middle) / ((y1 - y0) / 2);
  return centre + (posts - centre) * t * t;
};

/**
 * A table: a skirt under its top and four legs set in from its ends, over the rectangle (x0, y0) to (x1, y1), its top `lift` feet over the floor. `top` also draws the top
 * itself (a teqball table stands on a court; a table tennis table is the surface, which the drawing already shows).
 */
export function tableBody(x0: number, y0: number, x1: number, y1: number, lift: number, thin: number, top: boolean): Plane[] {
  const L = x1 - x0;
  const W = y1 - y0;
  const skirt = Math.max(convertLength(0.05, "m", "ft"), thin * 2);
  const rect = (w: number): string => `<rect width="${n(w)}" height="${n(skirt)}" class="u-table"/>`;
  const planes: Plane[] = [
    wall("table-side-a", "table", x0, y0, x1, y0, lift - skirt, lift, rect(L)),
    wall("table-side-b", "table", x0, y1, x1, y1, lift - skirt, lift, rect(L)),
    wall("table-end-a", "table", x0, y0, x0, y1, lift - skirt, lift, rect(W)),
    wall("table-end-b", "table", x1, y0, x1, y1, lift - skirt, lift, rect(W)),
  ];
  if (top) planes.unshift(flat("table-top", "table", x0, y0, x1, y1, lift, `<rect width="${n(L)}" height="${n(W)}" class="u-table"/>`));
  const leg = Math.max(convertLength(0.05, "m", "ft"), thin * 2.2);
  const inset = Math.max(L * 0.07, leg * 2);
  for (const [i, [lx, ly]] of ([[x0 + inset, y0 + inset], [x0 + inset, y1 - inset], [x1 - inset, y0 + inset], [x1 - inset, y1 - inset]] as const).entries()) planes.push(...pole(`leg-${i}`, "leg", lx, ly, 0, lift - skirt, leg, "u-leg"));
  return planes;
}

/** A rectangle on the floor, in feet. */
export type FloorRect = readonly [x0: number, y0: number, x1: number, y1: number];

/**
 * The surrounds that enclose a playing area: four boards of one height standing over the edge of `r`, each in pieces of at most ten feet (so each is sorted among the table and the chairs and not as one slab by its
 * middle), facing out from the area's middle and giving way to a nearly level eye, as the glass of a rink does. Painted in the look's own surround colour.
 */
export function surroundWalls(id: string, r: FloorRect, height: number): Plane[] {
  const [x0, y0, x1, y1] = r;
  const centre: [number, number] = [(x0 + x1) / 2, (y0 + y1) / 2];
  const sides: [number, number, number, number][] = [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
  const rim = Math.min(0.3, height * 0.12);
  const planes: Plane[] = [];
  sides.forEach(([xa, ya, xb, yb], side) => {
    const long = Math.hypot(xb - xa, yb - ya);
    const pieces = Math.max(1, Math.ceil(long / 10));
    const run = long / pieces;
    for (let i = 0; i < pieces; i += 1) {
      const [t0, t1] = [i / pieces, (i + 1) / pieces];
      const svg = `<rect width="${n(run)}" height="${n(height)}" class="ky-wall"/><rect width="${n(run)}" height="${n(rim)}" class="u-surround-rim"/>`;
      const p = wall(`${id}-${side + 1}-${i + 1}`, "surround", xa + (xb - xa) * t0, ya + (yb - ya) * t0, xa + (xb - xa) * t1, ya + (yb - ya) * t1, 0, height, svg);
      planes.push({ ...shy(p, centre), fadeTo: 0.35, fadeAt: 0.85 });
    }
  });
  return planes;
}

/** A solid box on the floor, in feet: four sides up to `top` and a flat top; `cls` paints the top and `cls-side` (a tone darker) the sides. */
export function standingBox(id: string, kind: Plane["kind"], r: FloorRect, top: number, cls: string, side: string = `${cls}-side`): Plane[] {
  const [x0, y0, x1, y1] = r;
  const sides: [number, number, number, number][] = [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
  const planes = sides.map(([a, b, c, d], i) => wall(`${id}-${i + 1}`, kind, a, b, c, d, 0, top, `<rect width="${n(Math.hypot(c - a, d - b))}" height="${n(top)}" class="${side}"/>`));
  planes.push(flat(`${id}-top`, kind, x0, y0, x1, y1, top, `<rect width="${n(x1 - x0)}" height="${n(y1 - y0)}" class="${cls}"/>`));
  return planes;
}
