// What a judging assignment is: the organiser says how many mat areas there are, which style each is judged in, and who sits in which seat; the drawing puts the names in the seats where they fit and in a chart where they
// do not. Types only: the seats are in judging.data.ts and the working-out in judging.ts. The data stays with the caller: nothing is stored and nothing is fetched.
import type { Language } from "./types.ts";

/** The style a judo area is judged in. `kata` has five judges; `shiai`, the contest, is the next release. */
export type JudgingStyle = "kata";

/** One official: the seat, and who sits in it. The seat is its number (`3`, `"3"`), its key (`"judge-3"`) or `"central"` (the middle seat of a kata area). */
export interface JudgingOfficial {
  seat: string | number;
  /** The name as it is to be read, at most 120 characters; a seat with no name is shown as not assigned. */
  name?: string;
  /** The official's identifier (a licence number, a registry id), shown under the name. At most 64 characters. */
  id?: string | number;
}

/** One mat area: its name and its officials. */
export interface JudgingMat {
  /** The name on the plan: `Mat 1`, `Mat 2` in English and `第1試合場`, `第2試合場` in Japanese when missing. At most 40 characters. */
  label?: string;
  /** Who sits where. A seat that is not named is shown as not assigned. */
  officials?: readonly JudgingOfficial[];
}

/** A judging assignment as the drawing asks for it. */
export interface JudgingOptions {
  /** The style the areas are judged in. */
  style: JudgingStyle;
  /** The mat areas, 1 to 6, in the order they are numbered. */
  mats: readonly JudgingMat[];
  /** Draw only this mat (counting from 1): one tab of a page that has a tab for each. All of them, stacked, when missing. */
  mat?: number;
  /** The chart of mat, seat, name and ID. `auto` (the default) draws it whenever a name or an ID does not fit in its seat, `always` and `never` as they say. */
  chart?: "auto" | "always" | "never";
  /** Where the chart is laid: beside the plan (`landscape`, the default) or under it (`portrait`). */
  orientation?: "landscape" | "portrait";
  /** What the plan shows: the whole `mat` (the default) or the judges' `bench`, close up, so that the names in the seats are as large as they can be. */
  focus?: "mat" | "bench";
  /** The width of the picture's own units, 480 to 2000 (1000 by default); the picture scales to whatever it is shown in, so this only sets how large its type is against its width. */
  width?: number;
  language?: Language;
  theme?: "light" | "dark";
  /** A prefix for the ids. Made from the options when missing. */
  id?: string;
  className?: string;
  title?: string;
  description?: string;
  /** `none` leaves the stylesheet to the page (`KYOGIJO_STYLE` and `KYOGIJO_JUDGING_STYLE`). */
  css?: "embed" | "none";
}

/** A seat of a style: where it is in the order, and what it is called. */
export interface JudgingSeat {
  /** The key: `judge-3`. */
  id: string;
  /** The number, from 1, in the order the seats are drawn (left to right as the plan lies, the shomen at the top). */
  n: number;
  /** `central` for the middle seat of a kata area. */
  role: "judge" | "central";
  label: { en: string; ja: string };
}

/** One seat of one mat with who sits in it. */
export interface JudgingAssignment {
  seat: JudgingSeat;
  /** Empty when nobody is named. */
  name: string;
  id: string;
  assigned: boolean;
}

/** One mat with every seat of the style, in order. */
export interface JudgingResolved {
  /** From 1. */
  n: number;
  label: string;
  seats: JudgingAssignment[];
}
