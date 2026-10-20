/** A sample board: the SVG text, the size its maker reports, and a sentence that says what it shows. */
export interface SampleBoard {
  svg: string;
  width: number;
  height: number;
  label: string;
}
export const BOARDS: { swimming: SampleBoard; judo: SampleBoard; athletics: SampleBoard; skating: SampleBoard; medals: SampleBoard };
