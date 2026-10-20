// Setting a name and an ID in a box without cutting either: the biggest size that fits, the name wrapped at its spaces (and, for the chart, broken inside a word that is wider than the box), the ID under it. A name
// card in a seat has a floor under its type and says so when it cannot keep it; the chart has a floor too and then grows downwards, so that nothing is ever truncated. Widths are `textWidth`'s estimates, a little generous.
import type { JudgingAssignment } from "./judging.types.ts";
import { LINE_HEIGHT, textWidth } from "./text.ts";

/** What a name and an ID were set as. */
export interface CardFit {
  name: string[];
  nameSize: number;
  /** The ID's lines (with its label), or none. */
  id: string[];
  idSize: number;
  /** The width of the widest line and the height of the whole, in the box's units. */
  width: number;
  height: number;
}

/** What to fit, and how. Sizes and the box are in the same units. */
export interface CardAsk {
  name: string;
  id: string;
  /** The word before an ID (`ID`). */
  idLabel: string;
  width: number;
  height: number;
  /** The biggest and the smallest size of the name; the ID is set at 0.62 of the name's size and no smaller than 0.75 of the least. */
  max: number;
  min: number;
  /** The most lines the name may take. */
  maxLines: number;
  /** Whether a word wider than the box may be broken inside (the chart), or the card does not fit (a seat). */
  breakWords: boolean;
}

/** The gap between the name and the ID, as a share of the name's size. */
const GAP = 0.28;

/** An ID's width in ems: a face with fixed-width digits and letters, a little wider than the proportional one. */
const idWidth = (text: string): number => textWidth(text, false) * 1.12;

/** The lines a text is wrapped in at a size, no line wider than `width`, or undefined when a word is wider and breaking is not allowed. */
export function wrapText(text: string, width: number, size: number, breakWords: boolean, measure: (text: string) => number = (t) => textWidth(t)): string[] | undefined {
  const words = text.trim().split(/\s+/).filter((w) => w !== "");
  const lines: string[] = [];
  let current = "";
  const fits = (t: string): boolean => measure(t) * size <= width + 1e-9;
  for (const word of words) {
    const joined = current === "" ? word : `${current} ${word}`;
    if (fits(joined)) {
      current = joined;
      continue;
    }
    if (current !== "") lines.push(current);
    current = "";
    if (fits(word)) {
      current = word;
      continue;
    }
    if (!breakWords) return undefined;
    // A word wider than the box: broken inside, by characters.
    let piece = "";
    for (const ch of word) {
      if (piece !== "" && !fits(piece + ch)) {
        lines.push(piece);
        piece = ch;
      } else piece += ch;
    }
    current = piece;
  }
  if (current !== "") lines.push(current);
  return lines;
}

/**
 * Set a name, and an ID under it, in the biggest size that fits the box. Returns undefined when nothing from `max` down to `min` fits (for a card in a seat, that is "does not fit"); with `breakWords` and `maxLines` set
 * as large as it takes, it always returns something, which may be taller than the box (the chart grows).
 */
export function fitCard(ask: CardAsk): CardFit | undefined {
  const label = ask.id === "" ? "" : `${ask.idLabel} ${ask.id}`.trim();
  const floor = Math.min(ask.min, ask.max);
  // From the biggest size down to the floor in forty steps (and the floor itself last), in whatever unit the box is in.
  const step = Math.max((ask.max - floor) / 40, 1e-4);
  const sizes: number[] = [];
  for (let size = ask.max; size > floor + 1e-9; size -= step) sizes.push(size);
  sizes.push(floor);
  for (const size of sizes) {
    const lines = ask.name === "" ? [] : wrapText(ask.name, ask.width, size, ask.breakWords);
    if (lines === undefined || lines.length > ask.maxLines) continue;
    const idSize = Math.max(size * 0.62, floor * 0.75);
    const idLines = label === "" ? [] : wrapText(label, ask.width, idSize, ask.breakWords, idWidth);
    if (idLines === undefined || (!ask.breakWords && idLines.length > 1)) continue;
    const height = lines.length * size * LINE_HEIGHT + (idLines.length > 0 ? (lines.length > 0 ? size * GAP : 0) + idLines.length * idSize * LINE_HEIGHT : 0);
    if (height > ask.height + 1e-9) continue;
    const width = Math.max(0, ...lines.map((l) => textWidth(l) * size), ...idLines.map((l) => idWidth(l) * idSize));
    return { name: lines, nameSize: size, id: idLines, idSize, width, height };
  }
  return undefined;
}

/**
 * What the chart does: the biggest size at which the name takes three lines at most with no word broken, shrinking to the floor; then, at the floor, as many lines as it takes and a word wider than the row broken inside.
 * It always fits, whatever the text, because the row grows.
 */
export function fitChart(ask: Omit<CardAsk, "maxLines" | "breakWords" | "height">): CardFit {
  const whole = fitCard({ ...ask, height: Infinity, maxLines: 3, breakWords: false });
  if (whole !== undefined) return whole;
  const fit = fitCard({ ...ask, max: ask.min, height: Infinity, maxLines: Infinity, breakWords: true });
  if (fit === undefined) throw new Error("a chart row always fits");
  return fit;
}

/** The box a card gives a seat's name and ID, and the biggest size its name may be set in. */
export interface SeatBox {
  width: number;
  height: number;
  max: number;
}

/**
 * Fit the name and ID of every seat of a mat into its card, as one size for all of them, so that the row of cards reads evenly: each seat that has a name is fitted alone, the smallest size any of them needs is taken, and
 * each is fitted again at that size. A seat whose name does not fit at the floor, or that has nobody in it, has no card (undefined). `boxes` has the card box of each seat, in order.
 */
export function fitSeats(seats: readonly JudgingAssignment[], boxes: readonly SeatBox[], limits: { min: number; idLabel: string }): (CardFit | undefined)[] {
  const ask = (a: JudgingAssignment, i: number, max: number): CardFit | undefined => (a.assigned ? fitCard({ name: a.name, id: a.id, idLabel: limits.idLabel, width: boxes[i].width, height: boxes[i].height, max, min: limits.min, maxLines: 3, breakWords: false }) : undefined);
  const alone = seats.map((a, i) => ask(a, i, boxes[i].max));
  const sizes = alone.filter((f): f is CardFit => f !== undefined).map((f) => f.nameSize);
  const common = sizes.length === 0 ? Infinity : Math.min(...sizes);
  return seats.map((a, i) => (alone[i] === undefined ? undefined : ask(a, i, Math.min(common, boxes[i].max))));
}
