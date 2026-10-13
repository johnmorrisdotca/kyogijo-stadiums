// The dimensions of every surface, in feet, with the rule or the published figure each comes from (docs/sources.md has
// the full citations). Nothing here draws: it is numbers and the few functions that follow from them, so that a test can
// hold a key distance to the rulebook.

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

/** The NHL rink, from Rule 1 of the NHL rulebook. */
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
  hashLength: 2,
  hashApart: 5 + 11 / 12,
  crease: { radius: 6, depth: 4.5, halfWidth: 4 },
  net: { width: 6, depth: 40 / 12 },
  trapezoid: { atBoards: 28, atGoalLine: 18 },
  refereeCrease: 10,
} as const;

/** The NBA court, from Rule 1 of the NBA rulebook and the court diagram. */
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

/** The baseball field, from rules 2.01 to 2.05 of the Official Baseball Rules. */
export const MLB = {
  base: 90,
  baseSize: 15 / 12,
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

/** Where the infield arc meets a foul line, along the line, from the back of home plate. */
export function skinJoin(): number {
  // (u, u) on the line, on the circle of radius R round (0, pitcher): u² + (u − p)² = R²
  const p = MLB.pitcher;
  const r = MLB.skinRadius;
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
 * import { fenceAt, fencePoints, DEFAULT_FENCE } from "@johnmorrisdotca/kyogijo/geometry";
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
