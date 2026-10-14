// The realistic basketball floor (`court.hardwood`): the options read once, and the boards. A maple strip floor is laid in boards of one width that run the length of the
// court, each row's boards ending at different places so that no two neighbours' ends line up; each board has a tone of its own and a little grain. All of it is made here
// from a seed with a small generator of our own (no `Math.random`), so the same options give the same floor, and it is written as two tiles of a pattern (the tones and
// grain under the paint, the seams and ends over it), so that the SVG holds a few shapes however large the court is. Written for this package from the way a strip floor
// is laid; no photograph or other drawing was copied.
import { el, num } from "./format.ts";
import type { CourtStyle, HardwoodOptions } from "./types.ts";

/** The options of a hardwood floor, read: every part has its value. */
export interface Hardwood {
  seed: number;
  /** True for the seams, ends, grain, soft shadows, table and benches; false for broad boards and one shadow. */
  fine: boolean;
  /** The width of a board, in feet. */
  board: number;
  stain: number;
  sheen: number;
  hoops: boolean;
  bench: boolean;
}

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/** The width of a drawing in pixels when the options say it (`480` or `"480px"`), else `undefined` (a percentage or an em says nothing of the screen). */
export function pixelWidth(width: unknown): number | undefined {
  if (finite(width)) return width > 0 ? width : undefined;
  const match = typeof width === "string" ? /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/.exec(width) : null;
  return match === null ? undefined : Number(match[1]);
}

/** The width in pixels under which a drawing is a thumbnail, and its boards a blur: the `auto` detail is `plain` below it. */
export const HARDWOOD_SMALL = 480;

/** The hardwood the options ask for, or `undefined` for the usual clean floor. `simple` is the drawing's `detail: "simple"`; `width` its `width` option. */
export function resolveHardwood(court: CourtStyle | undefined, simple: boolean, width: unknown): Hardwood | undefined {
  const given = court?.hardwood;
  if (given === undefined || given === false) return undefined;
  const o: HardwoodOptions = given === true ? {} : given;
  const px = pixelWidth(width);
  const fine = o.detail === "fine" || (o.detail !== "plain" && !simple && (px === undefined || px >= HARDWOOD_SMALL));
  return {
    seed: finite(o.seed) ? Math.trunc(o.seed) : 1,
    fine,
    board: clamp(finite(o.board) ? o.board : 2.25, 1.5, 6) / 12,
    stain: clamp(finite(o.stain) ? o.stain : 0.82, 0.3, 1),
    sheen: clamp(finite(o.sheen) ? o.sheen : 1, 0, 1.5),
    hoops: o.hoops !== false,
    bench: o.bench !== false && fine,
  };
}

/** A small, fast generator (mulberry32): the same seed gives the same numbers on every machine. */
export function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The width of a tile, in feet: longer than any court of the package, so that the boards do not repeat along it. */
export const TILE = 96;

/** One tone of board: a stroke over the wood, written once as a path of every board of that tone. */
interface Tone {
  colour: string;
  opacity: number;
  /** The share of boards, in thousandths, up to this tone. */
  upTo: number;
}

const WARM = "#fff0c4";
const DEEP = "#4a280b";
const TONES: readonly Tone[] = [
  { colour: WARM, opacity: 0.19, upTo: 90 },
  { colour: WARM, opacity: 0.1, upTo: 310 },
  { colour: DEEP, opacity: 0.1, upTo: 520 },
  { colour: DEEP, opacity: 0.2, upTo: 640 },
];

/** The least two ends of boards in neighbouring rows come to one another, in feet. */
const APART = 1.2;

/** True when an end at `x` is within `APART` of any end of the rows given, going round the tile. */
const near = (x: number, rows: readonly (readonly number[] | undefined)[]): boolean =>
  rows.some((row) => row?.some((end) => {
    const d = Math.abs(x - end) % TILE;
    return Math.min(d, TILE - d) < APART;
  }) === true);

/** An end moved on, a little at a time, until it is clear of the ends of the rows next to it (and of its own row's, `own`). */
function clear(x: number, rows: readonly (readonly number[] | undefined)[], own: readonly number[], least: number): number {
  let at = x;
  for (let tries = 0; tries < 40 && (near(at, rows) || own.some((end) => Math.abs(at - end) < least)); tries += 1) at += 0.6;
  return at;
}

/**
 * The rows of boards of a tile: for each row the places its boards end, going round the tile. A row's ends are at random distances apart, between `lengths`, and are
 * moved on until none is within a foot of an end in the row above or the one above that, as boards are laid so that no joint lines up with a neighbour's.
 */
function rows(count: number, lengths: readonly [number, number], next: () => number): number[][] {
  const [low, high] = lengths;
  const made: number[][] = [];
  for (let r = 0; r < count; r += 1) {
    // The rows next to it: the two above, and for the last rows the first ones, which lie under them when the tile repeats.
    const above = [made[r - 1], made[r - 2], ...(r >= count - 2 ? made.slice(0, r === count - 1 ? 2 : 1) : [])];
    const start = next() * high;
    const ends: number[] = [clear(start, above, [], low)];
    for (let at = ends[0] + low + next() * (high - low); at < start + TILE - low * 0.6; at += low + next() * (high - low)) {
      const placed = clear(at, above, ends, low * 0.6);
      ends.push(placed);
      at = placed;
    }
    made.push(ends.map((end) => end % TILE).sort((x, y) => x - y));
  }
  return made;
}

/** A number for a path: one decimal, no leading zero's loss (`.5`), never `-0`. */
const n1 = (value: number): string => {
  const text = (Math.round(value * 10) / 10).toString();
  return text === "-0" ? "0" : text;
};

/** The pieces of one row's board between two ends, going round the tile: one piece, or two when the board crosses its edge. */
function spans(from: number, to: number): [number, number][] {
  return to > from ? [[from, to]] : [[from, TILE], [0, to]];
}

/** The two tiles of a floor and the size they are laid at: the tones and grain (under the paint) and the seams and ends (over it). */
export function floorTiles(h: Hardwood): { height: number; under: string; over: string } {
  const next = generator(h.seed);
  const pitch = h.fine ? h.board : h.board * 4;
  const count = Math.max(4, Math.round(6 / pitch));
  const height = count * pitch;
  const ends = rows(count, h.fine ? [5, 12] : [10, 26], next);

  // Each board's tone: a stroke across the whole width of its row, so that the rows meet with no gap.
  const byTone: string[][] = TONES.map(() => []);
  ends.forEach((row, r) => {
    const y = num((r + 0.5) * pitch);
    for (let i = 0; i < row.length; i += 1) {
      const pick = next() * 1000;
      const tone = TONES.findIndex((t) => pick < t.upTo);
      if (tone < 0) continue;
      for (const [a, b] of spans(row[i], row[(i + 1) % row.length])) byTone[tone].push(`M${n1(a)} ${y}h${n1(b - a)}`);
    }
  });
  let under = "";
  TONES.forEach((tone, i) => {
    if (byTone[i].length > 0) under += el("path", { d: byTone[i].join(""), stroke: tone.colour, "stroke-opacity": tone.opacity, "stroke-width": num(pitch + 0.004), fill: "none" });
  });
  if (!h.fine) return { height, under, over: "" };

  // The grain: fine streaks along the boards, short and faint, a few of them bowed.
  const grain: string[] = [];
  for (let i = 0; i < 70; i += 1) {
    const x = next() * TILE;
    const y = (Math.floor(next() * count) + 0.15 + next() * 0.7) * pitch;
    const length = 1.2 + next() * 5.5;
    const bow = (next() - 0.5) * pitch * 0.5;
    grain.push(i % 4 === 0 ? `M${n1(x)} ${num(y)}q${n1(length / 2)} ${num(bow)} ${n1(length)} 0` : `M${n1(x)} ${num(y)}h${n1(length)}`);
  }
  under += el("path", { d: grain.join(""), stroke: DEEP, "stroke-opacity": 0.2, "stroke-width": num(pitch * 0.09), fill: "none", "stroke-linecap": "round" });

  // The seams between the boards and the butt joints where they end.
  const seam: string[] = [];
  for (let r = 0; r < count; r += 1) seam.push(`M0 ${num(r * pitch)}H${TILE}`);
  ends.forEach((row, r) => {
    for (const x of row) seam.push(`M${n1(x)} ${num(r * pitch)}v${num(pitch)}`);
  });
  const over = el("path", { d: seam.join(""), stroke: "#2a1506", "stroke-opacity": 0.3, "stroke-width": num(pitch * 0.17), fill: "none" });
  return { height, under, over };
}

/** The rules of the hardwood floor's classes, written into a drawing that has one (and in `KYOGIJO_STYLE`, for a page that supplies the stylesheet). */
export const KYOGIJO_HARDWOOD_STYLE = `
.kyogijo .ky-hw-end-l{fill:var(--ky-hw-end-left,var(--ky-boards))}
.kyogijo .ky-hw-end-r{fill:var(--ky-hw-end-right,var(--ky-boards))}
.kyogijo .ky-hw-pad{fill:var(--ky-hw-pad,#2c333c);stroke:#fff;stroke-opacity:.2;stroke-width:.1}
.kyogijo .ky-hw-arm{fill:var(--ky-hw-arm,#454d58);stroke:#fff;stroke-opacity:.15;stroke-width:.06}
.kyogijo .ky-hw-glass{fill:#eef4f8;stroke:#7d8791;stroke-width:.06}
.kyogijo .ky-hw-net{fill:none;stroke:#fff;stroke-opacity:.7}
.kyogijo .ky-hw-furniture{fill:#7b838c;fill-opacity:.35;stroke:#7b838c;stroke-opacity:.35;stroke-width:.18;stroke-linejoin:round}`.trim();
