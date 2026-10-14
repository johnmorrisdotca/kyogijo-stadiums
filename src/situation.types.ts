// What a game's situation is, as the options give it: hockey's skaters and shootout, baseball's bases, outs and count, football's down, distance and drives.
// The types only; `situation.ts` reads them and `situation.draw.ts` draws them.

/** A team of the game: the home team or the visitors. */
export type SituationTeam = "home" | "away";

/** One shootout attempt: `true` a goal (●), `false` a miss or a save (○), `null` or left out one not yet taken. */
export type ShootoutAttempt = boolean | null | undefined;

/** One round of a shootout: the visitors' attempt and then the home team's, as the NHL's shootout is shot (the visitors shoot first). */
export type ShootoutRound = readonly [away: ShootoutAttempt, home: ShootoutAttempt];

/**
 * Hockey's situation. The skaters are the players on the ice without the goalkeeper, 3 to 6 (a goalkeeper pulled for an extra attacker is a team with 6). A strength that is 5 against 5
 * with nothing else to say draws nothing. See `docs/situation.md`.
 */
export interface HockeySituation {
  /** The visitors' skaters on the ice, a whole number from 3 to 6. */
  awaySkaters?: number;
  /** The home team's skaters on the ice. */
  homeSkaters?: number;
  /** The time left on the penalty (or the power play), as `m:ss` or `m:ss.s`, or a whole number of seconds. Written beside the strength. */
  clock?: string | number;
  /** A net with no goalkeeper in it: `"home"` or `"away"` for the team that has pulled its goalkeeper, or `true` for the team with more skaters than the other. */
  emptyNet?: boolean | SituationTeam;
  /** A penalty called and not yet taken (the play goes on until the penalised team touches the puck): the team that will be short, `"home"` or `"away"`. The other team has the puck, and is the one that attacks. */
  delayedPenalty?: SituationTeam;
  /** The shootout: one entry for each round, `[away, home]`. The first three rounds are the regular ones; the rounds after the third are sudden death. */
  shootout?: { rounds: readonly ShootoutRound[] };
  /** The end the attacking team is heading for, as the surface is drawn wide. Without it, read from `direction`, else the end opposite the attacking team's own side. */
  toward?: "left" | "right";
}

/** Baseball's situation (softball and NPB too). */
export interface BaseballSituation {
  /** The runners: `[first, second, third]`, `true` for a base with a runner on it. */
  bases?: readonly [boolean, boolean, boolean] | readonly boolean[];
  /** The outs, 0 to 3. */
  outs?: number;
  /** The inning, 1 or more. */
  inning?: number;
  /** `top` (the visitors bat) or `bottom` (the home team bats). */
  half?: "top" | "bottom";
  /** The count: balls 0 to 3 (four is a walk and is not a count) and strikes 0 to 2. */
  balls?: number;
  strikes?: number;
}

/** How a drive of a football game ended. */
export type DriveResult = "touchdown" | "field-goal" | "missed-field-goal" | "punt" | "turnover" | "interception" | "fumble" | "downs" | "safety" | "end-of-half";

/**
 * One drive of a drive chart: where it started and where it ended, in yards from the team's own goal line (0 the goal line it defends, 100 the one it attacks; 110 on the CFL's field),
 * and how it ended.
 */
export interface DriveLeg {
  /** The team that had the ball. The team in possession when missing. */
  team?: SituationTeam;
  /** Yards from the team's own goal line where it began. */
  from: number;
  /** Yards from the team's own goal line where it ended. */
  to: number;
  /** How it ended. */
  result?: DriveResult;
}

/** Football's situation (NFL, CFL, IFAF and the leagues of other rulebooks). The CFL has three downs and a field of 110 yards with end zones of 20. */
export interface FootballSituation {
  /** The ball, in yards from the offence's own goal line: 35 is its own 35, 88 the opponent's 12. 0 to 100 (0 to 110 on the CFL's field). */
  ballOn?: number;
  /** The yards to a first down, or `"goal"` when the goal line is nearer than the first-down line. */
  toGo?: number | "goal";
  /** The down, 1 to 4 (1 to 3 on the CFL's field). */
  down?: number;
  /** The team with the ball. */
  possession?: SituationTeam;
  /** Tint the red zone, the last 20 yards before the goal line the offence attacks. By default when the ball is in it; `false` leaves it out. */
  redZone?: boolean;
  /** A drive chart: the drives as arrows across the field, one to a lane. */
  drive?: readonly DriveLeg[];
  /** The end zone the offence is heading for, as the surface is drawn wide. Without it, read from `direction`, else the end opposite the offence's own side. */
  toward?: "left" | "right";
}

/** A game's situation: the sport decides which of the three it is. */
export type Situation = HockeySituation | BaseballSituation | FootballSituation;
