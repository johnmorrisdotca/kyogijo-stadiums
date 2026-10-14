// The types of the ice skating surfaces: the three disciplines, the races whose start and finish lines a drawing can mark, the furniture of a figure skating rink and the options that say what is drawn.
// Plain data only.

/** The disciplines a drawing can be of: the standard 400 m speed skating track, the short track oval or the figure skating rink. `league` says it too: `isu-long-track`, `isu-short-track`, `isu-figure`. */
export type SkatingDiscipline = "long-track" | "short-track" | "figure";

/** The races of the long track whose lines are marked: the distances, the mass start and the two team races. A race is named by its distance, in kebab case. */
export type LongTrackRace = "500m" | "1000m" | "1500m" | "3000m" | "5000m" | "10000m" | "mass-start" | "team-pursuit" | "team-sprint";

/** The races of the short track whose lines are marked. */
export type ShortTrackRace = "500m" | "1000m" | "1500m" | "2000m" | "3000m" | "5000m";

/** Every race a drawing can mark. */
export type SkatingRace = LongTrackRace | ShortTrackRace;

/** The things that stand at the rink of a figure skating competition: the judges and the referee at the rinkboard, the technical panel, and the kiss and cry. */
export type SkatingFurniture = "judges" | "referee" | "technical-panel" | "kiss-and-cry";

/** What lies inside the long track: the ice of the warm-up lane carried on to the infield, or the floor of the arena. */
export type SkatingInfield = "floor" | "ice";

/**
 * What a skating drawing takes beyond a surface. Every part is optional: the standard 400 m track with an inner radius of 25 m, two lanes of 4 m, the warm-up lane, the blocks and the padding is drawn
 * without any, and so are the short track's standard oval with its five tracks and the figure skating rink of 60 m by 30 m.
 */
export interface SkatingStyle {
  /** Long track: the radius of the inner edge of the inner lane, 25 m to 26 m (25 m by default). The straight follows, so that a lap is 400 m. */
  innerRadius?: number;
  /** Long track: the width of the outer lane, 4 m or more (4 m by default). */
  laneWidth?: number;
  /** Long track: the warm-up lane inside the competition lanes. On by default. */
  warmUp?: boolean;
  /** Long track: what lies inside the warm-up lane. `floor` by default. */
  infield?: SkatingInfield;
  /** Long and short track: the blocks of the curves. On by default. */
  blocks?: boolean;
  /** Long track: the coaches' area on the crossing straight. On by default. */
  coaches?: boolean;
  /** The padding round the track. On by default. */
  padding?: boolean;
  /** The races whose starting and finishing lines are drawn: none by default, `all` or a list. The finishing line is always drawn. */
  races?: "all" | readonly SkatingRace[];
  /** The race of a close-up of a start (`range: "start"`): the 500 m by default. */
  start?: SkatingRace;
  /** Short track: the number of tracks laid out beside the standard one, 5 or 7 (5 by default). */
  tracks?: 5 | 7;
  /** Short track and figure skating: the size of the rink, within what the Rules allow. */
  rink?: { length?: number; width?: number };
  /** Figure skating: the furniture drawn: all by default, `false` for none or a list. */
  furniture?: boolean | readonly SkatingFurniture[];
}

/** A race, as the package knows it. */
export interface RaceInfo {
  id: SkatingRace;
  /** The distance in metres; the mass start's is its laps (16 laps of 400 m). */
  distance: number;
  /** The words of its name, in English, Japanese and French. */
  name: { en: string; ja: string; fr: string };
}
