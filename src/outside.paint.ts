// The crowd outside as pixels: every person of a level's prefix stamped into one buffer, as a typed array and a loop, never an element, a path or a call to the canvas per person. Pure (no page, no canvas): a crowd and a frame in,
// RGBA bytes out, so that the same bytes come out in Node and in a browser, and a test can hold them to a budget. A person is 0.55 metres across; where that is under a pixel and a fifth (a district seen whole) a person is one
// pixel and the crowd reads as density, where it is more (a venue seen near) each is a small disc. Nothing animates: a crowd is painted when its level, its size or its colour changes, not when the view turns.
import { FEET_PER_METRE } from "./geometry.ts";

/** The crowds outside there are: a share of the venues' seats, in percent. */
export const OUTSIDE_LEVELS = [0, 25, 50, 75, 100] as const;
export type OutsideLevel = (typeof OUTSIDE_LEVELS)[number];

/** The people of one district, in the plan's frame: where each stands (feet, as the plan's drawing has them), which venue's crowd it is, and how many the venues' seats asked for and the walkable ground could hold. */
export interface OutsideCrowd {
  /** The mask the crowd stands on. */
  mask: string;
  venues: { key: string; seats: number; placed: number }[];
  /** The people, in order: venues interleaved, so that a prefix holds each venue's share. */
  x: Float32Array;
  y: Float32Array;
  /** The index in `venues` of each person's venue. */
  venue: Uint8Array;
  /** How many people the list holds. */
  count: number;
}

/** How many people of the list stand outside at a level: the list is ordered, so these are its first. */
export const outsideCount = (crowd: Pick<OutsideCrowd, "count">, level: OutsideLevel): number => Math.round((crowd.count * level) / 100);


/** A person's width in metres. */
export const PERSON_METRES = 0.55;

/** Where the crowd's pixels lie: a buffer `width` by `height`, with `(x0, y0)` the plan's feet at its top left corner and `scale` its pixels to a foot. */
export interface OutsideFrame {
  width: number;
  height: number;
  x0: number;
  y0: number;
  scale: number;
}

/** A person is drawn as a disc where they are wider than this many pixels, and as one pixel of density where they are not. */
export const DOTS_FROM = 1.2;

/** What painting a level cost and drew: for the docs and the tests to quote. */
export interface OutsideStats {
  people: number;
  /** `dots` when a person is wider than a pixel and a fifth, else `density`. */
  mode: "dots" | "density";
  /** Pixels stamped, counting each time a person lands on one. */
  stamps: number;
}

/** The disc a person is, as offsets from its pixel, by radius in pixels (0 is the pixel itself). */
const DISCS = new Map<number, Int16Array>();
function discOf(radius: number): Int16Array {
  const kept = DISCS.get(radius);
  if (kept !== undefined) return kept;
  const offsets: number[] = [];
  for (let dy = -radius; dy <= radius; dy += 1) for (let dx = -radius; dx <= radius; dx += 1) if (dx * dx + dy * dy <= radius * radius + radius * 0.5) offsets.push(dx, dy);
  const disc = Int16Array.from(offsets);
  DISCS.set(radius, disc);
  return disc;
}

/**
 * The people of a crowd at a level (its first `outsideCount`) as RGBA bytes in a frame, in one colour with the alpha that says how many stand on each pixel. `ink` is `[red, green, blue]`.
 * It gives the bytes and what it drew.
 */
export function rasterOutside(crowd: OutsideCrowd, level: OutsideLevel, frame: OutsideFrame, ink: readonly [number, number, number]): { rgba: Uint8ClampedArray; stats: OutsideStats } {
  const { width, height, x0, y0, scale } = frame;
  const people = outsideCount(crowd, level);
  const rgba = new Uint8ClampedArray(width * height * 4);
  const metresPerPixel = 1 / (scale * FEET_PER_METRE);
  const across = PERSON_METRES / metresPerPixel;
  const dots = across > DOTS_FROM;
  const radius = dots ? Math.min(8, Math.max(1, Math.round(across / 2))) : 0;
  const disc = discOf(radius);
  const cover = new Uint8Array(width * height);
  let stamps = 0;
  for (let i = 0; i < people; i += 1) {
    const px = Math.floor((crowd.x[i] - x0) * scale);
    const py = Math.floor((crowd.y[i] - y0) * scale);
    if (radius === 0) {
      if (px >= 0 && py >= 0 && px < width && py < height) {
        const at = py * width + px;
        if (cover[at] < 255) cover[at] += 1;
        stamps += 1;
      }
      continue;
    }
    for (let k = 0; k < disc.length; k += 2) {
      const [sx, sy] = [px + disc[k], py + disc[k + 1]];
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
      const at = sy * width + sx;
      if (cover[at] < 255) cover[at] += 1;
      stamps += 1;
    }
  }
  // The alpha of a pixel with n people on it: one person covers `first` of it, and each more covers the rest by that share again, so that a dense crowd saturates and a sparse one stays light.
  const area = metresPerPixel * metresPerPixel;
  const first = dots ? 0.82 : Math.min(0.7, Math.max(0.16, (Math.PI / 4) * PERSON_METRES * PERSON_METRES / area));
  const alpha = new Uint8Array(256);
  for (let n = 1; n < 256; n += 1) alpha[n] = Math.round(255 * (1 - (1 - first) ** n));
  const [r, g, b] = ink;
  for (let at = 0; at < cover.length; at += 1) {
    const n = cover[at];
    if (n === 0) continue;
    const o = at * 4;
    rgba[o] = r;
    rgba[o + 1] = g;
    rgba[o + 2] = b;
    rgba[o + 3] = alpha[n];
  }
  return { rgba, stats: { people, mode: dots ? "dots" : "density", stamps } };
}

/** The frame of a buffer that covers a view box of the plan (feet) in `width` pixels, as high as the box's shape makes it. */
export function frameOf(view: { x: number; y: number; w: number; h: number }, width: number): OutsideFrame {
  const scale = width / view.w;
  return { width: Math.round(width), height: Math.max(1, Math.round(view.h * scale)), x0: view.x, y0: view.y, scale };
}
