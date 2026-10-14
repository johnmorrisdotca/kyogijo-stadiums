// Mats laid out as real units: the tatami of a dojo and the mats of a competition area. A mat is a rectangle whose sides are in the proportion of two to one (a jō), a half of it (a hanjō) is
// a square, and a mat at the edge of a floor may be cut to fit. The lay of a traditional room is the one in which no four corners meet (shūgi-jiki, 祝儀敷き): the columns of mats are set off
// by half a mat from one to the next, so that every joint is a T. In metres. Nothing here draws.
import type { Area, Shape } from "../fields.types.ts";
import { num } from "../format.ts";
import { path } from "../fields.kit.ts";
import type { MBox } from "./parts.ts";

/** A mat's size. */
export interface MatSize {
  length: number;
  width: number;
}

/** What a piece of floor is: a whole mat, half of one (a square), or a mat cut to fit. */
export type PieceKind = "full" | "half" | "cut";

/** One piece of the floor, a mat or part of one. */
export interface Piece extends MBox {
  kind: PieceKind;
  /** The axis of its long side: `x` or `y`. */
  along: "x" | "y";
  /** Which colour it is painted: 1 the first, 2 the second, 3 the third (a danger zone or a border). */
  tone: 1 | 2 | 3;
}

const EPS = 1e-6;
const close = (a: number, b: number, tol = 1e-4): boolean => Math.abs(a - b) <= tol;
const r4 = (v: number): number => Math.round(v * 10000) / 10000;

/** The kind of a piece of a floor laid with mats of a size. */
export function kindOf(w: number, h: number, mat: MatSize, along: "x" | "y"): PieceKind {
  const long = along === "y" ? h : w;
  const short = along === "y" ? w : h;
  if (close(short, mat.width) && close(long, mat.length)) return "full";
  if (close(short, mat.width) && close(long, mat.length / 2)) return "half";
  return "cut";
}

/**
 * Lay a rectangle with mats whose long sides run along `along`, in columns the width of a mat. With `stagger` every second column is set off by half a mat, so that no four
 * corners meet (the traditional lay); without it the mats make a grid. The floor's ends and sides are cut to fit where its size is not a whole number of mats; a column that is
 * set off begins and ends with half a mat.
 */
export function lay(rect: MBox, mat: MatSize, along: "x" | "y", stagger: boolean): Piece[] {
  const out: Piece[] = [];
  const acrossLen = along === "y" ? rect.x1 - rect.x0 : rect.y1 - rect.y0;
  const alongLen = along === "y" ? rect.y1 - rect.y0 : rect.x1 - rect.x0;
  const columns = Math.max(0, Math.ceil(acrossLen / mat.width - EPS));
  for (let c = 0; c < columns; c += 1) {
    const a0 = c * mat.width;
    const a1 = Math.min(a0 + mat.width, acrossLen);
    const offset = stagger && c % 2 === 1 ? mat.length / 2 : 0;
    let b = 0;
    if (offset > 0) {
      const e = Math.min(offset, alongLen);
      push(out, rect, along, a0, a1, 0, e, mat);
      b = e;
    }
    while (b < alongLen - EPS) {
      const e = Math.min(b + mat.length, alongLen);
      push(out, rect, along, a0, a1, b, e, mat);
      b = e;
    }
  }
  return out;
}

function push(out: Piece[], rect: MBox, along: "x" | "y", a0: number, a1: number, b0: number, b1: number, mat: MatSize): void {
  const x0 = along === "y" ? rect.x0 + a0 : rect.x0 + b0;
  const x1 = along === "y" ? rect.x0 + a1 : rect.x0 + b1;
  const y0 = along === "y" ? rect.y0 + b0 : rect.y0 + a0;
  const y1 = along === "y" ? rect.y0 + b1 : rect.y0 + a1;
  out.push({ x0: r4(x0), y0: r4(y0), x1: r4(x1), y1: r4(y1), kind: kindOf(x1 - x0, y1 - y0, mat, along), along, tone: 1 });
}

/** The part of a piece inside a box, and the parts of it outside, each a piece of its own (a mat cut where a colour changes). */
export function cutBy(piece: Piece, box: MBox, mat: MatSize): { inside: Piece | undefined; outside: Piece[] } {
  const ix0 = Math.max(piece.x0, box.x0);
  const iy0 = Math.max(piece.y0, box.y0);
  const ix1 = Math.min(piece.x1, box.x1);
  const iy1 = Math.min(piece.y1, box.y1);
  const mk = (x0: number, y0: number, x1: number, y1: number): Piece => ({ x0: r4(x0), y0: r4(y0), x1: r4(x1), y1: r4(y1), along: piece.along, tone: piece.tone, kind: kindOf(x1 - x0, y1 - y0, mat, piece.along) });
  if (ix1 - ix0 <= EPS || iy1 - iy0 <= EPS) return { inside: undefined, outside: [piece] };
  const outside: Piece[] = [];
  if (iy0 - piece.y0 > EPS) outside.push(mk(piece.x0, piece.y0, piece.x1, iy0));
  if (piece.y1 - iy1 > EPS) outside.push(mk(piece.x0, iy1, piece.x1, piece.y1));
  if (ix0 - piece.x0 > EPS) outside.push(mk(piece.x0, iy0, ix0, iy1));
  if (piece.x1 - ix1 > EPS) outside.push(mk(ix1, iy0, piece.x1, iy1));
  return { inside: mk(ix0, iy0, ix1, iy1), outside };
}

/**
 * Give every piece the tone of the zone it lies in: the first of `zones` that holds it, else `rest`. A mat that a boundary runs through is cut there, each part
 * taking its own zone's tone.
 */
export function tint(pieces: readonly Piece[], zones: readonly { box: MBox; tone: 1 | 2 | 3 }[], rest: 1 | 2 | 3, mat: MatSize): Piece[] {
  let left: Piece[] = pieces.map((p) => ({ ...p, tone: rest }));
  const out: Piece[] = [];
  for (const zone of zones) {
    const next: Piece[] = [];
    for (const p of left) {
      const cut = cutBy(p, zone.box, mat);
      if (cut.inside !== undefined) out.push({ ...cut.inside, tone: zone.tone });
      next.push(...cut.outside);
    }
    left = next;
  }
  return [...out, ...left].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
}

/** The mats of a checker floor: the tone alternates from one mat to the next, as the squares of a chessboard do. */
export function checker(pieces: readonly Piece[], rect: MBox, mat: MatSize): Piece[] {
  return pieces.map((p) => {
    const col = Math.round((p.along === "y" ? p.x0 - rect.x0 : p.y0 - rect.y0) / mat.width);
    const row = Math.round((p.along === "y" ? p.y0 - rect.y0 : p.x0 - rect.x0) / mat.length);
    return { ...p, tone: ((col + row) % 2 === 0 ? 1 : 2) as 1 | 2 };
  });
}

/**
 * How many points are a corner of four pieces or more: where four mats meet. A floor laid in the traditional way has none. Pieces that only touch along a side are not counted (a T is a point
 * where one piece's side runs past the corners of two others, not a corner of three).
 */
export function fourCorners(pieces: readonly Piece[]): number {
  const count = new Map<string, number>();
  const key = (x: number, y: number): string => `${Math.round(x * 1000)},${Math.round(y * 1000)}`;
  for (const p of pieces) {
    for (const [x, y] of [[p.x0, p.y0], [p.x1, p.y0], [p.x0, p.y1], [p.x1, p.y1]] as const) count.set(key(x, y), (count.get(key(x, y)) ?? 0) + 1);
  }
  let meets = 0;
  for (const n of count.values()) if (n >= 4) meets += 1;
  return meets;
}

/** The floor's area in square metres. */
export const areaOf = (pieces: readonly Piece[]): number => pieces.reduce((sum, p) => sum + (p.x1 - p.x0) * (p.y1 - p.y0), 0);

/** The number of mats a floor holds, counted as the mats' own area: a half mat is a half, a cut piece the share of a mat it covers. */
export const matCount = (pieces: readonly Piece[], mat: MatSize): number => areaOf(pieces) / (mat.length * mat.width);

const rectD = (b: MBox): string => `M${num(b.x0)} ${num(b.y0)}H${num(b.x1)}V${num(b.y1)}H${num(b.x0)}Z`;

/** The painted areas of a floor of mats: one path for each tone, in the class the look gives it. */
export function tatamiAreas(id: string, pieces: readonly Piece[], classes: Readonly<Record<1 | 2 | 3, Area["cls"]>>, feature: Readonly<Record<1 | 2 | 3, string>>): Area[] {
  const out: Area[] = [];
  for (const tone of [1, 2, 3] as const) {
    const of = pieces.filter((p) => p.tone === tone);
    if (of.length > 0) out.push({ id: `${id}-t${tone}`, feature: feature[tone], cls: classes[tone], d: of.map(rectD).join("") });
  }
  return out;
}

/** The seams: the outline of every piece, as one line. */
export function seams(id: string, pieces: readonly Piece[], width: number): Shape[] {
  if (pieces.length === 0) return [];
  return [path(`${id}-seams`, "seams", pieces.map(rectD).join(""), { w: width, cls: "ky-bud-seam", least: 0 })];
}

/** The heri (畳縁), the cloth along the two long sides of a traditional mat, as filled strips inside the mat. Cut pieces and the thin ends of a floor have none. */
export function heri(id: string, pieces: readonly Piece[], width: number, mat: MatSize): Area[] {
  const strips: string[] = [];
  for (const p of pieces) {
    if (p.kind === "cut") continue;
    const w = p.x1 - p.x0;
    const h = p.y1 - p.y0;
    if (p.along === "y") {
      if (w < mat.width * 0.9 || h < mat.length * 0.45) continue;
      strips.push(rectD({ x0: p.x0, y0: p.y0, x1: p.x0 + width, y1: p.y1 }), rectD({ x0: p.x1 - width, y0: p.y0, x1: p.x1, y1: p.y1 }));
    } else {
      if (h < mat.width * 0.9 || w < mat.length * 0.45) continue;
      strips.push(rectD({ x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y0 + width }), rectD({ x0: p.x0, y0: p.y1 - width, x1: p.x1, y1: p.y1 }));
    }
  }
  return strips.length === 0 ? [] : [{ id: `${id}-heri`, feature: "heri", cls: "ky-bud-heri", d: strips.join("") }];
}
