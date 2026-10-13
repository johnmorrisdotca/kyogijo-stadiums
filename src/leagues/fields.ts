// What the field sports' leagues share: a size a rulebook allows as a range, with the size that is drawn. The figures of each sport are in its own file
// (rugby.ts, lacrosse.ts, aussie.ts, gaelic.ts, cricket.ts, fieldhockey.ts, handball.ts), in the unit its rulebook prints first. Nothing here draws.

/** A length the rules allow between a least and a greatest, with the one that is drawn, all in the league's unit. */
export interface Span {
  min: number;
  max: number;
  drawn: number;
}

/** A range of sizes; the drawn size is the greatest the rules allow unless another is said. */
export const span = (min: number, max: number, drawn: number = max): Span => ({ min, max, drawn });

/** A size the rules fix: a range of one. */
export const fixed = (value: number): Span => ({ min: value, max: value, drawn: value });
