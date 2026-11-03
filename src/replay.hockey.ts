// Hockey's dead time, the rule set the replay, its scoreboard, the example game's generator, the sound and a play-by-play feed share. In the `nhl-api` frame: feet from centre ice, x along the
// rink (the goal lines at ±89), y across it (±42.5, the players' benches on the side of negative y). From the NHL's rulebook: the nine face-off spots (Rule 1.9), where play starts again after each
// kind of stoppage (Rule 76, with Rule 81 for icing and Rule 83 for offside), and the face-off's line-up (Rule 76: the centres on the dot, nobody else inside the circle, the wingers on the hash marks,
// the goaltenders in their crease). The speeds and the seconds are ours: a stoppage of half a minute in a real game is a few seconds in a replay re-timed to minutes, and a player glides to his place
// at the pace a player does, never faster than `HOCKEY_DEAD_TIME.speed`.
import type { DeadTimeRules } from "./replay.deadtime.ts";
import type { ReplayObject } from "./replay.types.ts";

/** Why play stopped, in hockey: each says where it starts again. */
export type HockeyStop = "goal" | "save" | "frozen" | "icing" | "offside" | "penalty" | "whistle" | "period-start" | "period-end";

/** The nine face-off spots, feet from centre ice (NHL Rule 1.9): centre, the four in the neutral zone (5 feet outside the blue lines, 44 feet apart) and the four in the end zones (20 feet out from the goal lines, 44 feet apart). */
export const HOCKEY_DOTS: readonly (readonly [number, number])[] = [
  [0, 0],
  [20, 22],
  [20, -22],
  [-20, 22],
  [-20, -22],
  [69, 22],
  [69, -22],
  [-69, 22],
  [-69, -22],
];

/** The blue lines are 25 feet either side of centre: past one, play is in an end zone. */
export const HOCKEY_BLUE_LINE = 25;

/** Is a place one of the nine face-off spots (to a tenth of a foot)? */
export const isHockeyDot = (x: number, y: number): boolean => HOCKEY_DOTS.some(([dx, dy]) => Math.abs(dx - x) < 0.05 && Math.abs(dy - y) < 0.05);

const side = (n: number | undefined): 1 | -1 => ((n ?? 0) >= 0 ? 1 : -1);

/** Where play stopped and why, to say where it starts again. */
export interface HockeyStopAt {
  reason: HockeyStop | string;
  /** Where play stopped: the puck's place, or for a save the place the shot came from. Centre ice when not given. */
  x?: number;
  y?: number;
  /** For icing, offside and a penalty: the end the side it was called against defends, as the sign of its goal line's x (-1 for the left end, 1 for the right). */
  defends?: 1 | -1;
}

/**
 * The face-off spot play starts again at after a stoppage, by NHL rule: centre ice after a goal and at the start of a period; after a save or a frozen puck, the end-zone spot of that end on the side
 * the puck was (the nearest spot in the zone); after icing and after a penalty, an end-zone spot of the end the offending side defends (Rules 81 and 76); after offside, the
 * neutral-zone spot just outside the zone the offending side attacks (Rule 83); after any other whistle, the nearest spot in the zone where play stopped (an end-zone spot in an end, a neutral-zone
 * spot between the blue lines, never centre ice). An end-zone spot's side is the side of the rink the puck was on.
 * @example
 * ```ts
 * import { hockeyFaceoffDot } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * console.log(hockeyFaceoffDot({ reason: "goal", x: 88, y: 2 }).join(), hockeyFaceoffDot({ reason: "save", x: 60, y: -18 }).join());
 * console.log(hockeyFaceoffDot({ reason: "icing", x: 80, y: 30, defends: -1 }).join(), hockeyFaceoffDot({ reason: "offside", x: 26, y: 5, defends: -1 }).join());
 * // 0,0 69,-22
 * // -69,22 20,22
 * ```
 */
export function hockeyFaceoffDot(stop: HockeyStopAt): readonly [number, number] {
  const x = Number.isFinite(stop.x) ? (stop.x as number) : 0;
  const y = Number.isFinite(stop.y) ? (stop.y as number) : 0;
  const across = 22 * side(y);
  switch (stop.reason) {
    case "goal":
    case "period-start":
    case "period-end":
      return [0, 0];
    case "save":
    case "frozen":
      return [69 * side(x), across];
    case "icing":
    case "penalty":
      return stop.defends === undefined ? hockeyFaceoffDot({ reason: "whistle", x, y }) : [69 * stop.defends, across];
    case "offside":
      return stop.defends === undefined ? hockeyFaceoffDot({ reason: "whistle", x: 20 * side(x), y }) : [-20 * stop.defends, across];
    default:
      return Math.abs(x) > HOCKEY_BLUE_LINE ? [69 * side(x), across] : [20 * side(x), across];
  }
}

/** The places of a face-off's line-up. */
export type HockeyRole = "C" | "LW" | "RW" | "LD" | "RD" | "G";

/**
 * Where a side lines up for a face-off at a spot (NHL Rule 76), as `[x, y]` in feet from centre ice: `attacks` is the end it attacks (1 for the right). The centre stands on the dot a step back on his
 * own side; the wingers on their own side of the circle's hash marks, outside it; the defence behind them (at the blue line when the spot is in the end the side attacks, in front of its own net when it
 * is in its own end, a stride back from the wingers at centre and in the neutral zone); the goaltender in the crease. A left winger is on the left of a player facing the end his side attacks.
 * @example
 * ```ts
 * import { hockeyFormation } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * const at = hockeyFormation([0, 0], 1);
 * console.log(at.C.join(), at.LW.join(), at.G.join());
 * // -2.5,0 -5,17 -85,0
 * ```
 */
export function hockeyFormation(dot: readonly [number, number], attacks: 1 | -1): Record<HockeyRole, [number, number]> {
  const [dx, dy] = dot;
  const back = -attacks;
  const left = attacks;
  const G: [number, number] = [85 * back, 0];
  const C: [number, number] = [dx + 2.5 * back, dy];
  if (Math.abs(dx) < 50) {
    // Centre ice and the neutral zone: the wingers wide of the circle, the defence a stride back.
    const LW: [number, number] = [dx + 5 * back, clampY(dy + 17 * left)];
    const RW: [number, number] = [dx + 5 * back, clampY(dy - 17 * left)];
    const d = Math.abs(dx) < 1 ? 30 : 22;
    return { C, LW, RW, LD: [dx + d * back, clampY(dy + 12 * left)], RD: [dx + d * back, clampY(dy - 12 * left)], G };
  }
  // An end-zone spot: the wingers on the hash marks either side of the circle, the defence at the points or in front of their own net.
  const LW: [number, number] = [dx + 3.5 * back, clampY(dy + 17 * left)];
  const RW: [number, number] = [dx + 3.5 * back, clampY(dy - 17 * left)];
  const own = Math.sign(dx) === back;
  if (own) {
    const toward = -Math.sign(dy) || 1;
    return { C, LW, RW, LD: [78 * back, clampY(dy * 0.4)], RD: [80 * back, 8 * toward], G };
  }
  return { C, LW, RW, LD: [(HOCKEY_BLUE_LINE + 3) * attacks, clampY(18 * left)], RD: [(HOCKEY_BLUE_LINE + 3) * attacks, clampY(-18 * left)], G };
}
const clampY = (y: number): number => Math.max(-39, Math.min(39, y));

/** The speeds and seconds of hockey's dead time in a replay, and where each side's bench is. */
export const HOCKEY_DEAD_TIME = {
  /** The fastest a player glides to his place, feet a second (about 12 miles an hour: a glide, not a sprint). */
  speed: 18,
  /** Seconds before the players head for the face-off: a goal is celebrated. */
  pause: { goal: 2.5, other: 0.6 },
  /** Seconds the dead puck is seen where it stopped (in the net after a goal), then out of sight until the drop. */
  shown: { goal: 2.5, other: 1.2 },
  /** The least time the players take to their places, and the seconds they stand in them before the puck is dropped. */
  least: 2,
  hold: 1,
  /** The line-up before the opening face-off of a period, seconds: the clock reads the period's full time until the drop. */
  lineUp: 1.5,
  /** The players' benches' gates, on the side of negative y (the side the benches are on, as the arenas draw them): the home side's nearer the left end, the away side's the right. */
  bench: { home: [-36, -41], away: [36, -41] } as Record<"home" | "away", readonly [number, number]>,
} as const;

/** Hockey's dead time as `addDeadTime` reads it: the puck is the dead one, and a player going off or coming on goes by his side's bench. */
export const HOCKEY_RULES: DeadTimeRules = {
  speed: HOCKEY_DEAD_TIME.speed,
  pause: (reason) => (reason === "goal" ? HOCKEY_DEAD_TIME.pause.goal : HOCKEY_DEAD_TIME.pause.other),
  shown: (reason) => (reason === "goal" ? HOCKEY_DEAD_TIME.shown.goal : HOCKEY_DEAD_TIME.shown.other),
  least: HOCKEY_DEAD_TIME.least,
  hold: HOCKEY_DEAD_TIME.hold,
  bench: (o: ReplayObject) => (o.team === "home" || o.team === "away" ? HOCKEY_DEAD_TIME.bench[o.team] : undefined),
  dead: (o: ReplayObject) => o.team === "puck" || o.team === "ball",
};

/** The words of the NHL's public play-by-play for why play stopped (`details.reason` of a `stoppage`), as the rule set's. Any other word is a plain whistle. */
const NHL_REASONS: Record<string, HockeyStop> = {
  "goalie-stopped-after-sog": "save",
  "puck-frozen": "frozen",
  icing: "icing",
  offside: "offside",
};

/**
 * The stoppage a play of an NHL-style play-by-play is (`typeDescKey` and, for a `stoppage`, `details.reason`): `goal`, `penalty`, the rule set's word for the stoppage's reason, or `undefined` for a
 * play that does not stop play (a shot, a hit, a delayed penalty, which play goes on through until the side it is against touches the puck).
 * @example
 * ```ts
 * import { hockeyStopOf } from "@johnmorrisdotca/kyogijo-stadiums/replay";
 * console.log(hockeyStopOf("stoppage", "icing"), hockeyStopOf("stoppage", "puck-in-netting"), hockeyStopOf("goal"), hockeyStopOf("delayed-penalty"));
 * // icing whistle goal undefined
 * ```
 */
export function hockeyStopOf(typeDescKey: string, reason?: string): HockeyStop | undefined {
  if (typeDescKey === "goal") return "goal";
  if (typeDescKey === "penalty") return "penalty";
  if (typeDescKey === "period-end") return "period-end";
  if (typeDescKey !== "stoppage") return undefined;
  return NHL_REASONS[reason ?? ""] ?? "whistle";
}
