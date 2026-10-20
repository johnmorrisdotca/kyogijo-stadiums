// What a judging assignment is: the organiser says how many mat areas there are, which style each is judged in, and who sits in which seat; the drawing puts the names in the seats where they fit and in a chart where they
// do not. Types only: the seats are in judging.data.ts and the working-out in judging.ts. The data stays with the caller: nothing is stored and nothing is fetched.
import type { Language } from "./types.ts";

/** The style a judo area is officiated in: `kata` has five judges; `shiai`, the contest, a referee on the mat and the officials at the technical table. */
export type JudgingStyle = "kata" | "shiai";

/** One official: the seat, and who sits in it. The seat is its number (`3`, `"3"`), its key (`"judge-3"`, `"referee"`, `"timekeeper"`) or a word (`"central"` for the middle seat of a kata area). */
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
  /** A line for the broadcast board's foot, before the style: `Round 2`, `Pool B`, `Final block`. At most 60 characters. */
  line?: string;
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
  /** Shiai: draw the two side judges' seats too (the IJF's rules for an event with no CARE system use them; its other events have none), as not assigned where nobody is named. A seat a mat names is drawn whatever this says. Off by default. */
  sideJudges?: boolean;
  /**
   * Put the names on the seats as well as in the chart. Off by default: a seat then shows its number alone, on the round badge the chart's rows have, and the chart is the key. On, a name is set in the chart's own face, scaled
   * evenly (never stretched or condensed), in the biggest size that fits its card and no smaller than a readable one; a seat whose name does not fit shows its number alone.
   */
  seatNames?: boolean;
  /**
   * What is drawn: the `plan` with its chart (the default, the layout to print) or the `broadcast` picture: the mat large, as a television would show it, with the officials on a board at its side like a graphic, the seats' number
   * badges where the officials sit, and no chart. The picture is 16:9 and scales as a whole, type and all, so it is as sharp on a tablet as on a television.
   */
  view?: "plan" | "broadcast";
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
  /** The number, from 1, in the order the seats are listed (a kata area's from the left as the plan lies, the shomen at the top). */
  n: number;
  /** What the seat is: a kata area's judges (`central` the middle one), or a contest's referee, side judges, timekeeper, scorekeeper and referee supervisor. */
  role: "judge" | "central" | "referee" | "side-judge" | "timekeeper" | "scorekeeper" | "supervisor";
  /** Where it is: at the judges' table of a kata area or the technical table of a contest (`table`), on the mat (`mat`: the referee) or at a corner of the area (`corner`: a side judge). */
  where: "table" | "mat" | "corner";
  /** True for a seat that is drawn only when asked for or named (the side judges). */
  optional?: true;
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
  /** The line for the broadcast board's foot; empty when there is none. */
  line: string;
  seats: JudgingAssignment[];
}
