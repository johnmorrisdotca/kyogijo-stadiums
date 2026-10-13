// The basketball courts: the NBA's, which the package started with, and each league that marks its court differently. Every figure
// is the rulebook's, in its own unit; docs/sources.md says which rule.
import { NBA } from "../geometry.ts";
import type { Unit } from "../units.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The small marks the NBA's court diagram has along the lane and the sidelines, drawn in the full detail. Lengths. */
export interface CourtMarks {
  /** The marks that divide the free-throw lane, from the baseline. The first is the block. */
  lane: number[];
  /** The lower defensive box's marks: from the lane, from the baseline, and how long; or none. */
  box: { fromLane: number; fromBaseline: number; length: number } | null;
  /** The marks 28 feet from the baseline on the sidelines: where, and how long. */
  sideline: { fromBaseline: number; length: number };
  /** The substitution marks, either side of the half-court line, or none. */
  substitution: number | null;
}

/** The figures of a basketball court. Lengths, in the unit of the table they are in. */
export interface CourtFigures {
  /** Baseline to baseline, inside the lines. */
  length: number;
  /** Sideline to sideline, inside the lines. */
  width: number;
  /** The free-throw lane (restricted area), side to side. */
  laneWidth: number;
  /** A lane that is wider at the baseline than at the free-throw line (a trapezoid): its width at the baseline. */
  laneEndWidth?: number;
  /** The free-throw line, from the baseline. */
  freeThrowLine: number;
  freeThrowRadius: number;
  centreRadius: number;
  /** The inner circle at centre court, or none. */
  centreInnerRadius: number | null;
  /**
   * The three-point line: the arc's radius from the middle of the basket, to the outside of the line, and how far from each
   * sideline the straight lines stand. `null` for no line.
   */
  threePoint: { radius: number; sideInset: number } | null;
  /** The middle of the basket, from the baseline. */
  basket: number;
  backboard: { width: number; fromBaseline: number };
  /** The ring's radius. */
  rim: number;
  /** The restricted (no-charge) area's radius from the middle of the basket, or none. */
  restricted: number | null;
  /** The small marks of the NBA's diagram, or none. */
  marks: CourtMarks | null;
}

/** A basketball court, as the drawing wants it: the figures with every length in feet. */
export type CourtSpec = CourtFigures;

/** A court's figures in feet, from the unit its rulebook gives them in. */
export const courtInFeet = (figures: CourtFigures, unit: Unit): CourtSpec => inFeet(figures, unit);

/** The NBA court today, from `NBA` (geometry.ts). Rule 1 of the NBA rulebook. */
export const NBA_COURT: CourtFigures = {
  length: NBA.length,
  width: NBA.width,
  laneWidth: NBA.lane,
  freeThrowLine: NBA.freeThrowLine,
  freeThrowRadius: NBA.freeThrowRadius,
  centreRadius: NBA.centreRadius,
  centreInnerRadius: NBA.centreInnerRadius,
  threePoint: { radius: NBA.threePoint.radius, sideInset: NBA.threePoint.sideInset },
  basket: NBA.basket,
  backboard: { width: NBA.backboard.width, fromBaseline: NBA.backboard.fromBaseline },
  rim: NBA.rim,
  restricted: NBA.restricted,
  marks: { lane: [...NBA.laneMarks], box: { ...NBA.boxMark }, sideline: { ...NBA.sidelineMark }, substitution: NBA.substitution },
};

/** A league with a basketball court of its own. */
export type BasketballLeague = LeagueBase<"basketball", CourtFigures>;

const ft = (feet: number, inches = 0): number => feet + inches / 12;

/** The NBA's court with another three-point line: the WNBA's, 22 ft 1¾ in from the basket and 3 ft in from the sidelines. */
const WNBA_COURT: CourtFigures = { ...NBA_COURT, threePoint: { radius: ft(22, 1.75), sideInset: 3 } };

/** The small marks of the NCAA's diagram: the lane's space marks (the same 3, 1, 3, 3 and 3 feet apart as the NBA's) and the sideline marks, with no lower defensive box and no substitution marks. */
const NCAA_MARKS: CourtMarks = { lane: [...NBA_COURT.marks!.lane], box: null, sideline: { fromBaseline: 28, length: 3 }, substitution: null };

/** The NCAA court, men's and women's: 12-foot lane and the three-point line of 22 ft 1¾ in with the straights 40⅛ in from the sidelines (21 ft 7⅞ in in the corners). */
const NCAA_COURT: CourtFigures = {
  ...NBA_COURT,
  laneWidth: 12,
  threePoint: { radius: ft(22, 1.75), sideInset: 25 - ft(21, 7.875) },
  restricted: 4,
  marks: NCAA_MARKS,
};

/** The basketball leagues, the NBA first. */
export const BASKETBALL_LEAGUES: readonly BasketballLeague[] = [
  { id: "nba", family: "basketball", name: { en: "NBA basketball court", ja: "NBAのバスケットボールコート" }, unit: "ft", dimensions: NBA_COURT, sources: ["nba-rules"], builtIn: true },
  {
    id: "wnba",
    family: "basketball",
    name: { en: "WNBA basketball court", ja: "WNBAのバスケットボールコート" },
    unit: "ft",
    dimensions: WNBA_COURT,
    sources: ["wnba-rules"],
    // The lane was widened from 12 to 16 feet for the 2004 season.
    history: {
      laneWidth: [
        { from: null, value: 12, what: "The free-throw lane is 12 feet wide.", ja: "フリースローレーン（ペイントエリア）の幅は12フィート（約3.7m）です。", sources: ["seattle-times-2003"] },
        { from: 2004, value: 16, what: "The free-throw lane is widened to 16 feet, the NBA's size.", ja: "フリースローレーンの幅が、NBAと同じ16フィート（約4.9m）に広がります。", sources: ["seattle-times-2003"] },
      ],
    },
  },
  {
    id: "fiba",
    family: "basketball",
    name: { en: "FIBA basketball court", ja: "FIBAのバスケットボールコート" },
    unit: "m",
    // Article 2 of Rule Two and the equipment rules of the FIBA Official Basketball Rules 2026, in metres, every arc measured to its outer edge.
    dimensions: {
      length: 28,
      width: 15,
      laneWidth: 4.9,
      freeThrowLine: 5.8,
      freeThrowRadius: 1.8,
      centreRadius: 1.8,
      centreInnerRadius: null,
      threePoint: { radius: 6.75, sideInset: 0.9 },
      basket: 1.575,
      backboard: { width: 1.8, fromBaseline: 1.2 },
      rim: 0.225,
      restricted: 1.3,
      marks: null,
    },
    sources: ["fiba-rules"],
  },
  {
    id: "ncaa-men",
    family: "basketball",
    name: { en: "NCAA men's basketball court", ja: "NCAA男子のバスケットボールコート" },
    unit: "ft",
    dimensions: NCAA_COURT,
    sources: ["ncaa-men-basketball", "ncaa-news-2015"],
    // The restricted-area arc: none, then 3 feet in Division I from 2011-12, then 4 feet from 2015-16.
    history: {
      restricted: [
        { from: null, value: null, what: "No restricted-area arc under the baskets.", ja: "バスケットの下にリストリクテッドエリア（半円）はありません。", sources: ["ncaa-news-2011"] },
        { from: 2011, value: 3, what: "A restricted-area arc of 3 feet from the middle of the basket is marked.", ja: "バスケットの中心から半径3フィート（約0.9m）のリストリクテッドエリア（半円）が描かれます。", sources: ["ncaa-news-2011"] },
        { from: 2015, value: 4, what: "The restricted-area arc grows to 4 feet.", ja: "リストリクテッドエリアの半径が4フィート（約1.2m）に広がります。", sources: ["ncaa-news-2015"] },
      ],
    },
  },
  {
    id: "ncaa-women",
    family: "basketball",
    name: { en: "NCAA women's basketball court", ja: "NCAA女子のバスケットボールコート" },
    unit: "ft",
    // The same court, except that the rules since 2023-24 give the restricted area no required arc.
    dimensions: { ...NCAA_COURT, restricted: null },
    sources: ["ncaa-women-basketball", "ncaa-women-history"],
    history: {
      restricted: [
        { from: null, value: null, what: "No restricted-area arc under the baskets.", ja: "バスケットの下にリストリクテッドエリア（半円）はありません。", sources: ["ncaa-news-2011"] },
        { from: 2011, value: 3, what: "A restricted-area arc of 3 feet from the middle of the basket is marked.", ja: "バスケットの中心から半径3フィート（約0.9m）のリストリクテッドエリア（半円）が描かれます。", sources: ["ncaa-news-2011"] },
        { from: 2017, value: 4, what: "The restricted-area arc grows to 4 feet.", ja: "リストリクテッドエリアの半径が4フィート（約1.2m）に広がります。", sources: ["ncaa-women-history"] },
        { from: 2023, value: null, what: "The restricted area is only the area under the basket: no arc is required.", ja: "リストリクテッドエリアはバスケット直下の区域だけとなり、半円のラインは必須ではなくなります。", sources: ["ncaa-women-history"] },
      ],
    },
  },
  {
    id: "nfhs",
    family: "basketball",
    name: { en: "High school (NFHS) basketball court", ja: "全米高校連盟（NFHS）のバスケットボールコート" },
    unit: "ft",
    // Rule 1 of the NFHS Basketball Rules and its court diagram: the ideal high-school court 84 by 50 feet, a 12-foot lane, the three-point semicircle 19 ft 9 in from the basket extended by straight lines to the end line, no restricted-area arc.
    dimensions: { ...NBA_COURT, length: 84, laneWidth: 12, threePoint: { radius: ft(19, 9), sideInset: 25 - ft(19, 9) }, restricted: null, marks: null },
    sources: ["nfhs-basketball"],
  },
  {
    id: "gleague",
    family: "basketball",
    name: { en: "NBA G League basketball court", ja: "NBA Gリーグのバスケットボールコート" },
    unit: "ft",
    // The G League plays on the NBA's court: its rules are "in addition to the standard NBA game rules".
    dimensions: NBA_COURT,
    sources: ["gleague-faq", "gleague-rules"],
  },
];
