// The baseball and softball diamonds: the Official Baseball Rules' (`MLB`, geometry.ts), which the package started with, and each
// league that lays its diamond out differently. Every figure is the rulebook's, in its own unit (always feet here); docs/sources.md
// says which rule.
import { DEFAULT_FENCE, MLB, type FencePoint, fencePoints } from "../geometry.ts";
import type { Fence } from "../types.ts";
import type { Unit } from "../units.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The figures of a diamond. Lengths, in the unit of the table they are in. */
export interface DiamondFigures {
  /** The distance between bases (the side of the square). */
  base: number;
  /** The side of a base. */
  baseSize: number;
  /** The front of the pitcher's plate, from the back point of home plate. */
  pitcher: number;
  /** The pitcher's plate: how long (across) and how deep. */
  pitchersPlate: { width: number; depth: number };
  /** The mound's radius, or a softball pitcher's circle's. */
  moundRadius: number;
  /** The middle of the mound or the circle, from the back point of home plate. */
  moundCentre: number;
  /** The dirt of the infield is cut by an arc of this radius round the pitcher's plate, or the rules give none. */
  skinRadius: number | null;
  /** Home plate: its width, and the length of its two parallel sides. */
  plate: { width: number; side: number };
  /** The batter's boxes, or none given. */
  boxes: { batterWidth: number; batterLength: number; gap: number } | null;
  /** The three-foot lane for the batter-runner: where it begins on the line to first, and how wide; or none given. */
  runningLane: { from: number; width: number } | null;
  /** The least distance from home plate to the backstop. */
  backstop: number;
  /** The fence, at the places the rules give a distance for: what they recommend or require (the least of a range). */
  fence: Partial<Fence>;
}

/** A diamond as the drawing wants it: the figures with every length in feet. */
export type DiamondSpec = DiamondFigures;

/** A diamond's figures in feet, from the unit its rulebook gives them in. */
export const diamondInFeet = (figures: DiamondFigures, unit: Unit): DiamondSpec => inFeet(figures, unit);

/** The baseball field of the Official Baseball Rules, from `MLB` (geometry.ts). */
export const MLB_DIAMOND: DiamondFigures = {
  base: MLB.base,
  baseSize: MLB.baseSize,
  pitcher: MLB.pitcher,
  pitchersPlate: { width: 2, depth: 0.5 },
  moundRadius: MLB.moundRadius,
  moundCentre: MLB.pitcher - 1,
  skinRadius: MLB.skinRadius,
  plate: { width: MLB.plate.width, side: MLB.plate.side },
  boxes: { batterWidth: MLB.boxes.batterWidth, batterLength: MLB.boxes.batterLength, gap: MLB.boxes.gap },
  runningLane: { from: MLB.runningLane.from, width: MLB.runningLane.width },
  backstop: MLB.backstop,
  fence: { ...DEFAULT_FENCE },
};

/** A diamond's default fence as points: through the distances the rules give, and no others. */
export function diamondFence(diamond: DiamondSpec): FencePoint[] {
  const f = diamond.fence;
  const at: [number | undefined, number][] = [[f.left, -45], [f.leftCenter, -22.5], [f.center, 0], [f.rightCenter, 22.5], [f.right, 45]];
  const points = at.filter((entry): entry is [number, number] => entry[0] !== undefined).map(([distance, angle]): FencePoint => [angle, distance]);
  return points.length >= 2 ? points : fencePoints(DEFAULT_FENCE);
}

/** A league with a diamond of its own. */
export type BaseballLeague = LeagueBase<"baseball", DiamondFigures> & { game: "baseball" | "softball" };

/** The Official Baseball Rules' diamond with other distances laid over it. */
const diamond = (over: Partial<DiamondFigures>): DiamondFigures => ({ ...MLB_DIAMOND, ...over });

/** What the amateur rulebooks print for the batter's boxes: 4 by 6 feet, 6 inches from the plate. */
const BOXES = { batterWidth: 4, batterLength: 6, gap: 0.5 };
/** What softball's rulebooks print: 3 by 7 feet, 6 inches from the plate. */
const SOFTBALL_BOXES = { batterWidth: 3, batterLength: 7, gap: 0.5 };
/** A softball pitcher's circle of 8 feet radius, round the front of the plate; the skinned arc 60 feet. */
const SOFTBALL = { pitcher: 43, moundRadius: 8, moundCentre: 43, skinRadius: 60, boxes: SOFTBALL_BOXES, runningLane: { from: 30, width: 3 }, backstop: 25 };

/** The baseball and softball leagues, MLB first. */
export const BASEBALL_LEAGUES: readonly BaseballLeague[] = [
  { id: "mlb", family: "baseball", game: "baseball", name: { en: "Baseball field", ja: "野球場" }, unit: "ft", dimensions: MLB_DIAMOND, sources: ["obr"], builtIn: true },
  {
    id: "milb",
    family: "baseball",
    game: "baseball",
    name: { en: "Minor League Baseball field", ja: "マイナーリーグ（MiLB）の野球場" },
    unit: "ft",
    // Minor League Baseball plays under the Official Baseball Rules (2.01 to 2.04): 90-foot bases, the plate 60 ft 6 in, 18-inch bases, a fence of at least 325 feet at the lines and 400 at the middle. Its own facility standards are not public.
    dimensions: diamond({ baseSize: 1.5, fence: { left: 325, center: 400, right: 325 } }),
    sources: ["obr-2026"],
  },
  {
    id: "ncaa",
    family: "baseball",
    game: "baseball",
    name: { en: "NCAA baseball field", ja: "NCAAの野球場" },
    unit: "ft",
    // Rule 1 of the NCAA Baseball Rules: 90 feet, the plate 60 ft 6 in, boxes 4 by 6 feet, the fence recommended 330, 375 and 400 feet, the backstop 45 feet.
    dimensions: diamond({ baseSize: 1.25, boxes: BOXES, backstop: 45, fence: { left: 330, leftCenter: 375, center: 400, rightCenter: 375, right: 330 } }),
    sources: ["ncaa-baseball"],
  },
  {
    id: "nfhs",
    family: "baseball",
    game: "baseball",
    name: { en: "High school (NFHS) baseball field", ja: "全米高校連盟（NFHS）の野球場" },
    unit: "ft",
    // Rule 1-2 of the NFHS Baseball Rules: 90 feet, the plate 60 ft 6 in, the mound's centre 59 feet, boxes 4 by 6 feet, a new fence at least 300 feet at the lines and 350 at the middle.
    dimensions: diamond({ baseSize: 1.25, moundCentre: 59, boxes: BOXES, fence: { left: 300, center: 350, right: 300 } }),
    sources: ["nfhs-baseball"],
  },
  {
    id: "little-league",
    family: "baseball",
    game: "baseball",
    name: { en: "Little League baseball field (60-foot bases)", ja: "リトルリーグの野球場（塁間60フィート）" },
    unit: "ft",
    // Little League's field specifications for the Major Division and below: 60-foot bases, the pitcher 46 feet, a fence of 200 feet; a 10-foot pitcher's circle.
    dimensions: diamond({ base: 60, baseSize: 1.25, pitcher: 46, pitchersPlate: { width: 1.5, depth: 1 / 3 }, moundRadius: 5, moundCentre: 45, skinRadius: null, boxes: null, runningLane: null, backstop: 25, fence: { left: 200, center: 200, right: 200 } }),
    sources: ["little-league-specs", "little-league-major"],
  },
  {
    id: "little-league-intermediate",
    family: "baseball",
    game: "baseball",
    name: { en: "Little League Intermediate (50/70) baseball field", ja: "リトルリーグ・インターミディエイト（50/70）の野球場" },
    unit: "ft",
    // Little League's Intermediate (50/70) division: 70-foot bases, the pitcher 50 feet, the infield arc 95 feet, a 12-foot pitcher's circle, a fence of 200 feet.
    dimensions: diamond({ base: 70, baseSize: 1.25, pitcher: 50, moundRadius: 6, moundCentre: 49, skinRadius: 95, boxes: null, runningLane: { from: 35, width: 3 }, fence: { left: 200, center: 200, right: 200 } }),
    sources: ["little-league-specs", "little-league-intermediate"],
  },
  {
    id: "pony",
    family: "baseball",
    game: "baseball",
    name: { en: "PONY League (14U) baseball field", ja: "ポニーリーグ（14歳以下）の野球場" },
    unit: "ft",
    // Rule 7 of the PONY Baseball Rule Book, Pony 14U: 80-foot bases, the pitcher 54 feet, recommended home run distances of 275 feet at the lines and 315 to the middle, the backstop 40 feet.
    dimensions: diamond({ base: 80, baseSize: 1.25, pitcher: 54, skinRadius: null, boxes: null, runningLane: null, backstop: 40, fence: { left: 275, center: 315, right: 275 } }),
    sources: ["pony-2026"],
  },
  {
    id: "pony-bronco",
    family: "baseball",
    game: "baseball",
    name: { en: "PONY Bronco (12U) baseball field", ja: "ポニー・ブロンコ（12歳以下）の野球場" },
    unit: "ft",
    // Rule 7 of the PONY Baseball Rule Book, Bronco 12U: 70-foot bases, the pitcher 50 feet, 225 feet at the lines and 275 to the middle, the backstop 30 feet.
    dimensions: diamond({ base: 70, baseSize: 1.25, pitcher: 50, skinRadius: null, boxes: null, runningLane: null, backstop: 30, fence: { left: 225, center: 275, right: 225 } }),
    sources: ["pony-2026"],
  },
  {
    id: "pony-mustang",
    family: "baseball",
    game: "baseball",
    name: { en: "PONY Mustang (10U) baseball field", ja: "ポニー・マスタング（10歳以下）の野球場" },
    unit: "ft",
    // Rule 7 of the PONY Baseball Rule Book, Mustang 10U: 60-foot bases, the pitcher 46 feet, 175 feet at the lines and 225 to the middle.
    dimensions: diamond({ base: 60, baseSize: 1.25, pitcher: 46, skinRadius: null, boxes: null, runningLane: null, fence: { left: 175, center: 225, right: 175 } }),
    sources: ["pony-2026"],
  },
  {
    id: "ncaa-softball",
    family: "baseball",
    game: "softball",
    name: { en: "NCAA softball field", ja: "NCAAのソフトボール場" },
    unit: "ft",
    // Rule 2 of the NCAA Softball Rules: 60-foot base lines, the plate 43 feet, an 8-foot pitcher's circle, the skinned arc 60 feet, boxes 3 by 7 feet, a new fence 200 feet at the lines and 220 to the middle.
    dimensions: diamond({ base: 60, baseSize: 1.25, ...SOFTBALL, fence: { left: 200, center: 220, right: 200 } }),
    sources: ["ncaa-softball"],
  },
  {
    id: "nfhs-softball",
    family: "baseball",
    game: "softball",
    name: { en: "High school (NFHS) softball field", ja: "全米高校連盟（NFHS）のソフトボール場" },
    unit: "ft",
    // Rule 1-1 of the NFHS Softball Rules: 60 feet, the plate 43 feet, a 16-foot circle, the recommended skinned infield 60 feet, a fence arc of 185 to 235 feet (the least is drawn).
    dimensions: diamond({ base: 60, baseSize: 1.25, ...SOFTBALL, fence: { left: 185, center: 185, right: 185 } }),
    sources: ["nfhs-softball"],
  },
  {
    id: "fastpitch",
    family: "baseball",
    game: "softball",
    name: { en: "USA Softball fast-pitch field", ja: "USAソフトボール（ファストピッチ）のソフトボール場" },
    unit: "ft",
    // Rule 2 of the USA Softball Official Rules, adult women's fast pitch: 60 feet, the plate 43 feet, a fence of 200 to 250 feet (the least is drawn).
    dimensions: diamond({ base: 60, baseSize: 1.25, ...SOFTBALL, fence: { left: 200, center: 200, right: 200 } }),
    sources: ["usa-softball-2026"],
  },
  {
    id: "slowpitch",
    family: "baseball",
    game: "softball",
    name: { en: "USA Softball slow-pitch field", ja: "USAソフトボール（スローピッチ）のソフトボール場" },
    unit: "ft",
    // Rule 2 of the USA Softball Official Rules, adult women's slow pitch: 70-foot bases, the plate 50 feet, the skinned arc 70 feet, a fence of 265 to 300 feet (the least is drawn).
    dimensions: diamond({ base: 70, baseSize: 1.25, ...SOFTBALL, pitcher: 50, moundCentre: 50, skinRadius: 70, fence: { left: 265, center: 265, right: 265 } }),
    sources: ["usa-softball-2026"],
  },
  {
    id: "slowpitch-wbsc",
    family: "baseball",
    game: "softball",
    name: { en: "WBSC slow-pitch softball field", ja: "WBSC（スローピッチ）のソフトボール場" },
    unit: "ft",
    // Appendix 1 F of the WBSC Slow Pitch rules: 65-foot bases, the plate 50 feet, the skinned arc 60 feet, a women's fence of at least 275 feet.
    dimensions: diamond({ base: 65, baseSize: 1.25, ...SOFTBALL, pitcher: 50, moundCentre: 50, fence: { left: 275, center: 275, right: 275 } }),
    sources: ["wbsc-slowpitch"],
  },
];
