// The types of the athletics surfaces: the races and the field events a drawing can mark, and the options that say what is drawn. Plain data only.
import type { SoccerPitchId, SoccerSize } from "../surfaces/soccer-spec.ts";

/** The races a drawing can mark: where each starts, how it is staggered or curved, its hurdles or its exchange zones. A race is named by its distance, in kebab case. */
export type AthleticsRace =
  | "60m"
  | "60m-hurdles"
  | "100m"
  | "100m-hurdles"
  | "110m-hurdles"
  | "200m"
  | "400m"
  | "400m-hurdles"
  | "800m"
  | "1000m"
  | "1500m"
  | "mile"
  | "2000m"
  | "3000m"
  | "5000m"
  | "10000m"
  | "2000m-steeplechase"
  | "3000m-steeplechase"
  | "4x100m"
  | "4x400m";

/** The field events a drawing can mark in the infield, and alone at a large scale (`layout`). */
export type AthleticsFieldEvent = "high-jump" | "pole-vault" | "long-jump" | "triple-jump" | "shot-put" | "discus-throw" | "hammer-throw" | "javelin-throw";

/** What lies inside the track: the soccer pitch the package draws (`pitch`), plain mown grass, or nothing but the track's own surface. */
export type AthleticsInfield = "pitch" | "grass" | "none";

/** The colour of the track: Mondo red (the usual), Berlin's blue (the 2009 World Championships), the terracotta of a club track, or green. A colour of your own is `colors.surface`... or `colors.track`. */
export type AthleticsTrackLook = "red" | "blue" | "terracotta" | "green";

/** Where the steeplechase's water jump is: inside the second bend, outside it, or not drawn. */
export type WaterJump = "inside" | "outside" | "none";

/** The kind of a race's start, which says how its lines are made. */
export type StartKind = "straight" | "stagger" | "curved" | "steeplechase";

/**
 * What an athletics drawing takes beyond a surface: the number of lanes, the colour of the track, what is in the infield, which races and which field events are marked.
 * Every part is optional; the standard 400 m track of World Athletics, with eight lanes, a red track, a soccer pitch inside it and every field event in its usual place, is drawn without any.
 */
export interface AthleticsStyle {
  /** The lanes of the oval: 4 to 9 outdoors (8 by default; the Manual says nine is the most there should be), 4 to 6 on the indoor track (6 by default). */
  lanes?: number;
  /** The lanes of the straight that runs on beyond the oval's, 6 to 10 (the oval's number by default), as the straight of a 10-lane stadium is built (Manual 2.2.2). */
  straightLanes?: number;
  /** The colour of the track: `red` (the default), `blue`, `terracotta` or `green`. */
  track?: AthleticsTrackLook;
  /** What is inside the track: `pitch` (the default outdoors: a soccer pitch laid out as the package draws it), `grass` or `none`. */
  infield?: AthleticsInfield;
  /** The pitch inside the track when `infield` is `pitch`: a preset or a size, as the soccer `pitch` option. 105 by 68 metres by default. */
  pitch?: SoccerPitchId | SoccerSize;
  /** The field events drawn, each in its usual place in the standard stadium: all by default, `false` for none, or a list. */
  events?: boolean | readonly AthleticsFieldEvent[];
  /** The races whose starts and marks are drawn: the finish line and the lane numbers always are. `all` marks every race; a list marks those. None by default. */
  races?: "all" | readonly AthleticsRace[];
  /** The race of a close-up of a start (`range: "start"`): the 400 m by default. The race's start is marked whether or not it is in `races`. */
  start?: AthleticsRace;
  /** One field event alone, drawn at a large scale from the rulebook's own diagram: its runway or circle, its pit or sector, and its landing area. */
  layout?: AthleticsFieldEvent;
  /** The steeplechase's water jump: `inside` the second bend (the default) or `outside` it. Drawn with the steeplechase races. */
  waterJump?: WaterJump;
  /** The lane numbers painted on the track at the start and the finish lines: on by default. */
  numbers?: boolean;
  /** Draw the oval's lanes in the straight's numbers as well as the oval's, on the finish straight: on by default. */
  straightNumbers?: boolean;
}

/** A race, as the package knows it. */
export interface RaceInfo {
  id: AthleticsRace;
  /** The distance in metres (the legs of a relay are in `legs`). */
  distance: number;
  kind: StartKind;
  /** The legs of a relay, in metres. */
  legs?: readonly number[];
  /** The bends run in lanes (a stagger's), for a race that starts staggered. */
  bends?: number;
  /** True for a race with a breakline, which the athletes may leave their lanes after. */
  breakline?: boolean;
  /** True for a race that is run over hurdles. */
  hurdles?: boolean;
  /** True for a race of the covered track only: the 60 m and its hurdles, on the infield straight. */
  indoor?: boolean;
  /** True for a race with a group start, which an outer half of the track may start on a line of its own. */
  group?: boolean;
  /** The words of its name, in English, Japanese and French. */
  name: { en: string; ja: string; fr: string };
}

/** A field event, as the package knows it. */
export interface FieldEventInfo {
  id: AthleticsFieldEvent;
  name: { en: string; ja: string; fr: string };
}
