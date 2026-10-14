// The dimensions of every surface, in feet, with the rule or the published figure each comes from (docs/sources.md has
// the full citations). Nothing here draws: it is numbers and the few functions that follow from them, so that a test can
// hold a key distance to the rulebook.

import { SURFACE_UNITS, convertLength, lengthsIn, type Scaled, type Unit } from "./units.ts";
import { SOCCER, soccerSpec } from "./surfaces/soccer-spec.ts";
import { BWF_BADMINTON, FIVB_BEACH, FIVB_INDOOR, ITF_TENNIS, ITTF_TABLE, USAP_PICKLEBALL, netInFeet } from "./leagues/courts.ts";
import { AFL_GROUND } from "./leagues/aussie.ts";
import { ICC_MEN_GROUND } from "./leagues/cricket.ts";
import { FIH_PITCH } from "./leagues/fieldhockey.ts";
import { GAA_FOOTBALL_FIELD } from "./leagues/gaelic.ts";
import { IHF_COURT } from "./leagues/handball.ts";
import { WORLD_MEN_FIELD } from "./leagues/lacrosse.ts";
import { WORLD_RUGBY_FIELD } from "./leagues/rugby.ts";
import type { Sport } from "./types.ts";

export const FEET_PER_YARD = 3;
export const FEET_PER_METRE = 3.280839895;
/** Inches as feet. */
export const inch = (n: number): number => n / 12;

/** A football field. Lengths are along the field from end line to end line, widths across it. */
export interface FootballSpec {
  id: "nfl" | "cfl" | "ifaf";
  /** The name written in the title. */
  name: string;
  /** Goal line to goal line. */
  length: number;
  /** The depth of each end zone. */
  endZone: number;
  /** Sideline to sideline. */
  width: number;
  /** Distance of the hash-mark lines from each sideline. */
  hash: number;
  /** The width of the band of the boundary lines, outside the field of play. */
  boundary: number;
  /** The band across the field, measured from a sideline, in which the numbers stand: nearest edge, farthest edge. */
  numbers: [number, number];
  /** Where the goal posts stand: on the end line, or on the goal line. */
  posts: "end-line" | "goal-line";
  /** The text on the centre line when it is not a number. */
  centre: string;
  /** Yard lines are drawn every this many feet. */
  yardLine: number;
  /** The space between the two uprights, inside to inside, when not the usual `GOALPOST_WIDTH`. */
  postWidth?: number;
  /** True for a field whose rules give no yard numbers: none are drawn. */
  noNumbers?: boolean;
  /** False for a field with walls and no pylons (an indoor field). Pylons are drawn by default. */
  pylons?: boolean;
}

/** The space between the two uprights, inside to inside. */
export const GOALPOST_WIDTH = 18.5;
/** Hash marks and sideline ticks are this long (across the field). */
export const HASH_LENGTH = 2;

/** NFL: Rule 1 of the NFL rulebook. CFL: the CFL rulebook, "The Field". IFAF: Appendix D of the IFAF 2021 rules, "Field Diagrams". */
export const FOOTBALL: Record<FootballSpec["id"], FootballSpec> = {
  nfl: { id: "nfl", name: "NFL field", length: 300, endZone: 30, width: 160, hash: 70 + 9 / 12, boundary: 6, numbers: [36, 42], posts: "end-line", centre: "50", yardLine: 15 },
  cfl: { id: "cfl", name: "CFL field", length: 330, endZone: 60, width: 195, hash: 84, boundary: 1, numbers: [36, 42], posts: "goal-line", centre: "C", yardLine: 15 },
  ifaf: { id: "ifaf", name: "IFAF field", length: 300, endZone: 30, width: 160, hash: 60, boundary: 1, numbers: [21, 27], posts: "end-line", centre: "50", yardLine: 15 },
};

/** The length of a football field with its end zones. */
export const footballLength = (spec: FootballSpec): number => spec.length + 2 * spec.endZone;

/** The NHL rink as it is today, from Rule 1 of the NHL rulebook. `rulesFor("nhl", year)` (eras.ts) has it as it was in a season. */
export const NHL = {
  length: 200,
  width: 85,
  cornerRadius: 28,
  goalLine: 11,
  blueLine: 75,
  /** The goal line is 2 inches wide, the blue and red lines 12. */
  goalLineWidth: inch(2),
  lineWidth: 1,
  circleRadius: 15,
  /** The end-zone spots are 20 feet from the goal line and 22 feet either side of the long axis. */
  endSpotFromGoalLine: 20,
  spotOffset: 22,
  spotRadius: 1,
  /** The neutral-zone spots are 5 feet from the blue line. */
  neutralSpotFromBlue: 5,
  centreSpotRadius: 0.5,
  /** The hash marks beside an end-zone circle are 2 feet long and 2 inches wide, 5 feet 7 inches apart (Rule 1.9): the gap between the near ends of the two marks, along the line parallel to the goal line; their width lies across it. */
  hashLength: 2,
  hashApart: 5 + 7 / 12,
  crease: { radius: 6, depth: 4.5, halfWidth: 4 },
  net: { width: 6, depth: 40 / 12 },
  trapezoid: { atBoards: 28, atGoalLine: 22 },
  refereeCrease: 10,
} as const;

/** The NBA court as it is today, from Rule 1 of the NBA rulebook and the court diagram. `rulesFor("nba", year)` has it as it was in a season. */
export const NBA = {
  length: 94,
  width: 50,
  lane: 16,
  /** The free-throw line is 15 feet from the plane of the backboard, which is 4 feet from the baseline. */
  freeThrowLine: 19,
  freeThrowRadius: 6,
  centreRadius: 6,
  centreInnerRadius: 2,
  threePoint: { radius: 23.75, corner: 22, sideInset: 3 },
  /** The centre of the basket, from the baseline. */
  basket: 5.25,
  backboard: { width: 6, fromBaseline: 4 },
  restricted: 4,
  rim: 0.75,
  /** The lower defensive box's marks: 3 feet from the lane, 13 feet from the baseline, 6 inches long. */
  boxMark: { fromLane: 3, fromBaseline: 13, length: 0.5 },
  sidelineMark: { fromBaseline: 28, length: 3 },
  substitution: 4,
  /** The marks that divide the free-throw lane, from the baseline. The first is the block. */
  laneMarks: [7, 11, 14, 17],
} as const;

/** Where the three-point arc meets the straight lines, measured from the baseline. */
export function threePointJoin(): number {
  const { radius, corner } = NBA.threePoint;
  return NBA.basket + Math.sqrt(radius * radius - corner * corner);
}

/**
 * The curling sheet, from R1 of World Curling's Rules of Curling (1 September 2026) and Rule 3 of Curling Canada's Rules of Curling for General
 * Play (September 2022 to August 2026), in feet as the second prints them and the first prints beside its metres. The sheet is drawn at the
 * largest the rules allow: the length is 150 feet (R1(a) of World Curling: "minimum 150 feet"; Curling Canada allows 146 to 150), the width
 * 15 feet 7 inches (4.750 m, the greatest of both). Lengths run along the sheet from the backboard, widths across it.
 */
export const CURLING = {
  length: 150,
  width: 15 + 7 / 12,
  /** The least length and width the rules allow: 146 feet in an existing facility; 14 ft 6 in (World Curling) and 14 ft 2 in (Curling Canada). */
  lengthMin: 146,
  widthMin: { wcf: 14.5, curlingCanada: 14 + 2 / 12 },
  /** Each tee line's centre is 57 feet from the middle of the sheet: 114 feet from tee to tee, 18 feet from the backboard on a 150-foot sheet. */
  teeFromMiddle: 57,
  /** The back line's outside edge is 6 feet from the tee line's centre; the hog line's inside edge is 21 feet from it. */
  backLine: 6,
  hogLine: 21,
  /** The centre line runs 12 feet beyond each tee; the hacks stand there. */
  centreBeyondTee: 12,
  /** The radii of the 12-, 8- and 4-foot circles and the button (at least 6 inches). */
  rings: { twelve: 6, eight: 4, four: 2, button: 0.5 },
  /** The widths: tee, back and centre lines are at most half an inch; the hog line is 4 inches. */
  lineWidth: 1 / 24,
  hogLineWidth: 1 / 3,
  /** A hack is at most 6 inches wide and 8 inches deep, its inside edge 3 inches from the centre line. */
  hack: { insideFromCentre: 0.25, width: 0.5, depth: 8 / 12 },
  /** World Curling's hack line, 1 ft 6 in long, and its courtesy lines, 6 in long and 4 feet outside each hog line. */
  hackLine: 1.5,
  courtesy: { length: 0.5, outsideHog: 4 },
  /** A stone has a circumference of at most 36 inches. It is drawn at that, a little over 11 inches across. */
  stoneCircumference: 3,
} as const;

/** The diameter of a curling stone drawn at the greatest circumference the rules allow (36 inches), in feet. */
export const STONE_DIAMETER = CURLING.stoneCircumference / Math.PI;

/**
 * The net sports' courts, in feet, from the rulebooks' own figures (leagues/courts.ts, docs/sources.md): the ITF's tennis court (Rule 1), the FIVB's indoor and beach
 * volleyball courts (Rules 1 and 2), the BWF's badminton court (Law 1), USA Pickleball's court (Section 3) and the ITTF's table (Laws 2.1 and 2.2). The lengths run
 * along the court from the end line, the widths across it, each to the outside of the lines.
 */
export const TENNIS = netInFeet(ITF_TENNIS, "ft");
export const VOLLEYBALL = netInFeet(FIVB_INDOOR, "m");
export const BEACH_VOLLEYBALL = netInFeet(FIVB_BEACH, "m");
export const BADMINTON = netInFeet(BWF_BADMINTON, "m");
export const PICKLEBALL = netInFeet(USAP_PICKLEBALL, "ft");
export const TABLE_TENNIS = netInFeet(ITTF_TABLE, "m");

/** The baseball field, from rules 2.01 to 2.05 of the Official Baseball Rules. */
export const MLB = {
  base: 90,
  /** The side of first, second and third base: 18 inches since 2023 (Rule 2.03), 15 before. `rulesFor("mlb", year)` (eras.ts) has the size of a season. */
  baseSize: 18 / 12,
  /** The back point of home plate is the origin; the pitcher's plate is this far from it. */
  pitcher: 60.5,
  moundRadius: 9,
  /** The infield's dirt is cut by an arc of this radius round the pitcher's plate. */
  skinRadius: 95,
  homeCircleRadius: 13,
  baseCircleRadius: 10,
  /** The warning track is not set by the rules; fifteen feet is usual. */
  warningTrack: 15,
  /** The least backstop distance. */
  backstop: 60,
  runningLane: { from: 45, width: 3 },
  boxes: { batterWidth: 4, batterLength: 6, gap: 0.5 },
  plate: { width: 17 / 12, side: 8.5 / 12 },
} as const;

/** The distance along the diagonal from home plate to second base. */
export const secondBase = (): number => MLB.base * Math.SQRT2;

/** Where the infield arc meets a foul line, along the line, from the back of home plate. The baseball field's by default; a league's pitching distance and arc if given. */
export function skinJoin(pitcher: number = MLB.pitcher, skinRadius: number = MLB.skinRadius): number {
  // (u, u) on the line, on the circle of radius R round (0, pitcher): u² + (u − p)² = R²
  const p = pitcher;
  const r = skinRadius;
  const u = (p + Math.sqrt(2 * r * r - p * p)) / 2;
  return u * Math.SQRT2;
}

/** The default fence of a ballpark: the usual 330, 375, 400, 375 and 330 feet. */
export const DEFAULT_FENCE = { left: 330, leftCenter: 375, center: 400, rightCenter: 375, right: 330 } as const;

/** A fence point: the angle from dead centre field (negative to the left field line, positive to the right) and the distance in feet. */
export type FencePoint = readonly [angle: number, feet: number];

/** The angles the five usual fence distances are taken at. */
export const FENCE_ANGLES = [-45, -22.5, 0, 22.5, 45] as const;

/** A fence made of the five usual distances. */
export function fencePoints(fence: { left: number; leftCenter: number; center: number; rightCenter: number; right: number }): FencePoint[] {
  return [
    [-45, fence.left],
    [-22.5, fence.leftCenter],
    [0, fence.center],
    [22.5, fence.rightCenter],
    [45, fence.right],
  ];
}

/**
 * The distance to the fence at an angle: a monotone cubic through the points (Fritsch and Carlson), so that the wall is
 * smooth and never swings out past the figures it was made from. Outside the points' angles it holds the end distance.
 * @example
 * ```ts
 * import { fenceAt, fencePoints, DEFAULT_FENCE } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
 * const points = fencePoints(DEFAULT_FENCE);
 * console.log(fenceAt(points, 0), fenceAt(points, -45));
 * // 400 330
 * ```
 */
export function fenceAt(points: readonly FencePoint[], angle: number): number {
  const n = points.length;
  if (n === 0) throw new Error("a fence needs points");
  if (n === 1 || angle <= points[0][0]) return points[0][1];
  if (angle >= points[n - 1][0]) return points[n - 1][1];
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    h.push(points[i + 1][0] - points[i][0]);
    d.push((points[i + 1][1] - points[i][1]) / h[i]);
  }
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  let k = 0;
  while (angle > points[k + 1][0]) k += 1;
  const t = (angle - points[k][0]) / h[k];
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * points[k][1] + (t3 - 2 * t2 + t) * h[k] * m[k] + (-2 * t3 + 3 * t2) * points[k + 1][1] + (t3 - t2) * h[k] * m[k + 1];
}

/** The sports whose surface has one size. A ballpark's size is its fence, which `fenceIn` gives. */
export type SizedSport = Exclude<Sport, "mlb">;

/**
 * The length and the width of a surface, in a unit: the rulebook's own (`SURFACE_UNITS`) when none is given. A football
 * field is measured with its end zones, end line to end line.
 * @example
 * ```ts
 * import { surfaceSize } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
 * console.log(surfaceSize("nfl"), surfaceSize("nhl", "m").length.toFixed(2));
 * // { length: 120, width: 53.333333333333336, unit: 'yd' } 60.96
 * ```
 */
export function surfaceSize(sport: SizedSport, unit: Unit = SURFACE_UNITS[sport]): { length: number; width: number; unit: Unit } {
  let length: number;
  let width: number;
  switch (sport) {
    case "nfl":
    case "cfl":
    case "ifaf":
      length = footballLength(FOOTBALL[sport]);
      width = FOOTBALL[sport].width;
      break;
    case "nhl":
      length = NHL.length;
      width = NHL.width;
      break;
    case "nba":
      length = NBA.length;
      width = NBA.width;
      break;
    case "soccer": {
      // The international pitch, 105 by 68 metres: the size a pitch is drawn at when no other is asked for.
      const pitch = soccerSpec("fifa");
      length = convertLength(pitch.length, "m", "ft");
      width = convertLength(pitch.width, "m", "ft");
      break;
    }
    case "curling":
      length = CURLING.length;
      width = CURLING.width;
      break;
    case "tennis":
      length = TENNIS.length;
      width = TENNIS.widthDoubles;
      break;
    case "volleyball":
      length = VOLLEYBALL.length;
      width = VOLLEYBALL.width;
      break;
    case "badminton":
      length = BADMINTON.length;
      width = BADMINTON.width;
      break;
    case "pickleball":
      length = PICKLEBALL.length;
      width = PICKLEBALL.width;
      break;
    case "tabletennis":
      length = TABLE_TENNIS.length;
      width = TABLE_TENNIS.width;
      break;
    case "lacrosse":
      length = convertLength(WORLD_MEN_FIELD.length.drawn, "m", "ft");
      width = convertLength(WORLD_MEN_FIELD.width.drawn, "m", "ft");
      break;
    case "rugby":
      // The field of play with an in-goal area at each end.
      length = convertLength(WORLD_RUGBY_FIELD.length.drawn + 2 * WORLD_RUGBY_FIELD.inGoal.drawn, "m", "ft");
      width = convertLength(WORLD_RUGBY_FIELD.width.drawn, "m", "ft");
      break;
    case "afl":
      length = convertLength(AFL_GROUND.length.drawn, "m", "ft");
      width = convertLength(AFL_GROUND.width.drawn, "m", "ft");
      break;
    case "gaelic":
      length = convertLength(GAA_FOOTBALL_FIELD.length.drawn, "m", "ft");
      width = convertLength(GAA_FOOTBALL_FIELD.width.drawn, "m", "ft");
      break;
    case "cricket":
      // A ground is as large as its boundary: the drawn one, in a circle.
      length = convertLength(2 * ICC_MEN_GROUND.boundary.drawn, "yd", "ft");
      width = length;
      break;
    case "fieldhockey":
      length = convertLength(FIH_PITCH.length.drawn, "m", "ft");
      width = convertLength(FIH_PITCH.width.drawn, "m", "ft");
      break;
    case "handball":
      length = convertLength(IHF_COURT.length.drawn, "m", "ft");
      width = convertLength(IHF_COURT.width.drawn, "m", "ft");
      break;
    default:
      throw new Error(`No fixed size for "${String(sport)}": a ballpark's size is its fence`);
  }
  return { length: convertLength(length, "ft", unit), width: convertLength(width, "ft", unit), unit };
}

/**
 * Every dimension of a sport's surface in a unit (the rulebook's own when none is given): the football spec, `NHL`, `NBA` or
 * `MLB` with each length converted and every name and flag kept.
 */
export function dimensionsOf(sport: "nhl", unit?: Unit): Scaled<typeof NHL>;
export function dimensionsOf(sport: "nba", unit?: Unit): Scaled<typeof NBA>;
export function dimensionsOf(sport: "mlb", unit?: Unit): Scaled<typeof MLB>;
export function dimensionsOf(sport: "nfl" | "cfl" | "ifaf", unit?: Unit): Scaled<FootballSpec>;
export function dimensionsOf(sport: "soccer", unit?: Unit): Scaled<typeof SOCCER>;
export function dimensionsOf(sport: "curling", unit?: Unit): Scaled<typeof CURLING>;
export function dimensionsOf(sport: "tennis", unit?: Unit): Scaled<typeof TENNIS>;
export function dimensionsOf(sport: "volleyball", unit?: Unit): Scaled<typeof VOLLEYBALL>;
export function dimensionsOf(sport: "badminton", unit?: Unit): Scaled<typeof BADMINTON>;
export function dimensionsOf(sport: "pickleball", unit?: Unit): Scaled<typeof PICKLEBALL>;
export function dimensionsOf(sport: "tabletennis", unit?: Unit): Scaled<typeof TABLE_TENNIS>;
export function dimensionsOf(sport: "lacrosse", unit?: Unit): Scaled<typeof WORLD_MEN_FIELD>;
export function dimensionsOf(sport: "rugby", unit?: Unit): Scaled<typeof WORLD_RUGBY_FIELD>;
export function dimensionsOf(sport: "afl", unit?: Unit): Scaled<typeof AFL_GROUND>;
export function dimensionsOf(sport: "gaelic", unit?: Unit): Scaled<typeof GAA_FOOTBALL_FIELD>;
export function dimensionsOf(sport: "cricket", unit?: Unit): Scaled<typeof ICC_MEN_GROUND>;
export function dimensionsOf(sport: "fieldhockey", unit?: Unit): Scaled<typeof FIH_PITCH>;
export function dimensionsOf(sport: "handball", unit?: Unit): Scaled<typeof IHF_COURT>;
export function dimensionsOf(sport: Sport, unit?: Unit): unknown;
export function dimensionsOf(sport: Sport, unit: Unit = SURFACE_UNITS[sport]): unknown {
  switch (sport) {
    case "nfl":
    case "cfl":
    case "ifaf":
      return lengthsIn(FOOTBALL[sport], unit);
    case "nhl":
      return lengthsIn(NHL, unit);
    case "nba":
      return lengthsIn(NBA, unit);
    case "mlb":
      return lengthsIn(MLB, unit);
    case "soccer":
      // The Laws' figures are kept in metres.
      return lengthsIn(SOCCER, unit, "m");
    case "curling":
      return lengthsIn(CURLING, unit);
    case "tennis":
      return lengthsIn(TENNIS, unit);
    case "volleyball":
      return lengthsIn(VOLLEYBALL, unit);
    case "badminton":
      return lengthsIn(BADMINTON, unit);
    case "pickleball":
      return lengthsIn(PICKLEBALL, unit);
    case "tabletennis":
      return lengthsIn(TABLE_TENNIS, unit);
    // The field sports: the figures of the league a drawing has without a `league` (`LEAGUES` has the others), kept in the unit their rulebook prints them in.
    case "lacrosse":
      return lengthsIn(WORLD_MEN_FIELD, unit, "m");
    case "rugby":
      return lengthsIn(WORLD_RUGBY_FIELD, unit, "m");
    case "afl":
      return lengthsIn(AFL_GROUND, unit, "m");
    case "gaelic":
      return lengthsIn(GAA_FOOTBALL_FIELD, unit, "m");
    case "cricket":
      return lengthsIn(ICC_MEN_GROUND, unit, "yd");
    case "fieldhockey":
      return lengthsIn(FIH_PITCH, unit, "m");
    case "handball":
      return lengthsIn(IHF_COURT, unit, "m");
    default:
      throw new Error(`Unknown sport "${String(sport)}"`);
  }
}

/** A fence's points with each distance in another unit; the angles stay as they are. Feet are the default for `from`. */
export function fenceIn(points: readonly FencePoint[], to: Unit, from: Unit = "ft"): FencePoint[] {
  return points.map(([angle, distance]): FencePoint => [angle, convertLength(distance, from, to)]);
}
