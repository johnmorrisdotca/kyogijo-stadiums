// The curling sheets: World Curling's, which the package draws by default, and Curling Canada's. Every figure is the rulebook's, in the
// unit it prints first (metres for World Curling, feet for Curling Canada); docs/sources.md says which rule.
import type { Unit } from "../units.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The figures of a curling sheet. Lengths, in the unit of the table they are in. */
export interface SheetFigures {
  /** The sheet as drawn: backboard to backboard (inside edges), and sideline to sideline. The greatest the rules allow. */
  length: number;
  width: number;
  /** The least length and the least width the rules allow. The greatest are `length` and `width`. */
  lengthMin: number;
  widthMin: number;
  /** Each tee line's centre, from the middle of the sheet. */
  teeFromMiddle: number;
  /** The back line's outside edge, from the tee line's centre. */
  backLine: number;
  /** The hog line's inside edge (the circle side), from the tee line's centre. */
  hogLine: number;
  /** How far the centre line runs beyond each tee, which is where the hacks stand. */
  centreBeyondTee: number;
  /** The radii of the 12-, 8- and 4-foot circles and of the button. */
  rings: [twelve: number, eight: number, four: number, button: number];
  /** The widths of the tee, back and centre lines (at most), and of the hog line. */
  lineWidths: { line: number; hog: number };
  /** A hack: how far its inside edge is from the centre line, how wide it is, and how far it reaches in front of its line. */
  hack: { insideFromCentre: number; width: number; depth: number };
  /** The hack line across the centre line, or none (Curling Canada's book has none). */
  hackLine: number | null;
  /** The courtesy lines at the sides, 6 inches long and 4 feet outside the hog lines, or none (Curling Canada's book has none). */
  courtesy: { length: number; outsideHog: number } | null;
}

/** A sheet as the drawing wants it: the figures with every length in feet. */
export type SheetSpec = SheetFigures;

/** A sheet's figures in feet, from the unit its rulebook gives them in. */
export const sheetInFeet = (figures: SheetFigures, unit: Unit): SheetSpec => inFeet(figures, unit) as unknown as SheetSpec;

/** A league with a curling sheet of its own. */
export type CurlingLeague = LeagueBase<"curling", SheetFigures>;

/**
 * World Curling's sheet, from R1 of The Rules of Curling and Rules of Competition (1 September 2026), in metres as it prints them: the sheet is
 * at least 45.720 m long (146 ft, 44.501 m, in an existing facility) and at most 4.750 m wide (at least 4.420 m); each tee line is 17.375 m from
 * the middle; the back line's outside edge is 1.829 m from the tee, the hog line's inside edge 6.401 m; the circles have radii of 1.829,
 * 1.219 and 0.610 m and the button at least 0.152 m; the hog line is 102 mm wide, the others at most 13 mm; the centre line runs 3.658 m beyond
 * each tee; the hack line is 457 mm long; the courtesy lines are 152 mm long and 1.219 m outside the hog lines; each hack's inside edge is 76
 * mm from the middle of the centre line, at most 152 mm wide and 203 mm in front of its line.
 */
export const WCF_SHEET: SheetFigures = {
  length: 45.72,
  width: 4.75,
  lengthMin: 44.501,
  widthMin: 4.42,
  teeFromMiddle: 17.375,
  backLine: 1.829,
  hogLine: 6.401,
  centreBeyondTee: 3.658,
  rings: [1.829, 1.219, 0.61, 0.152],
  lineWidths: { line: 0.013, hog: 0.102 },
  hack: { insideFromCentre: 0.076, width: 0.152, depth: 0.203 },
  hackLine: 0.457,
  courtesy: { length: 0.152, outsideHog: 1.219 },
};

/**
 * Curling Canada's sheet, from Rule 3 of the Rules of Curling for General Play (September 2022 to August 2026), in feet as it prints them: 146 to
 * 150 feet from backboard to backboard and 14 ft 2 in to 15 ft 7 in wide; 114 feet from tee to tee; the back line 6 feet from the tee; the hog
 * line's inside edge 21 feet from it; the circles of 6, 4 and 2 feet and a button of at least 6 inches; the centre line 12 feet beyond each tee
 * and the hacks' back edges there, each at most 8 inches long and its inside edge at most 3 inches from the centre line. The book prints no hack
 * line and no courtesy line. Its hack width is not printed; World Curling's 6 inches is drawn.
 */
export const CURLING_CANADA_SHEET: SheetFigures = {
  length: 150,
  width: 15 + 7 / 12,
  lengthMin: 146,
  widthMin: 14 + 2 / 12,
  teeFromMiddle: 57,
  backLine: 6,
  hogLine: 21,
  centreBeyondTee: 12,
  rings: [6, 4, 2, 0.5],
  lineWidths: { line: 0.5 / 12, hog: 4 / 12 },
  hack: { insideFromCentre: 0.25, width: 0.5, depth: 8 / 12 },
  hackLine: null,
  courtesy: null,
};

/** The curling leagues, World Curling's first. */
export const CURLING_LEAGUES: readonly CurlingLeague[] = [
  { id: "wcf", family: "curling", name: { en: "World Curling sheet", ja: "ワールドカーリングのシート" }, unit: "m", dimensions: WCF_SHEET, sources: ["wcf-rules"], builtIn: true },
  { id: "curling-canada", family: "curling", name: { en: "Curling Canada sheet", ja: "カーリング・カナダのシート" }, unit: "ft", dimensions: CURLING_CANADA_SHEET, sources: ["curling-canada-rules"] },
];
