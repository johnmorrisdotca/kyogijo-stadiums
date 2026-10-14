// The types of the budō (武道) surfaces: judo and karate contest areas, the kendo shiai-jo, the sumo dohyō, the kyūdōjō, and a dojo of tatami, and the options that say what is drawn. Plain data only.

/** The sports of the budō family. */
export type BudoKind = "judo" | "karate" | "kendo" | "sumo" | "kyudo" | "dojo";

/** The sides of a hall, as a plan has them: north is the top of the drawing. `top`, `bottom`, `left` and `right` say the same. */
export type Compass = "north" | "south" | "east" | "west";
export type Side4 = Compass | "top" | "bottom" | "left" | "right";

/**
 * What a budō drawing takes beyond a surface. Every part is optional: a judo contest area is the IJF's of 10 m with a safety area of 4 m, a karate area the WKF's kumite square, a kendo
 * shiai-jo of 10 m, a dohyō of the Japan Sumo Association and a kyūdōjō of 28 m with five shooters, drawn without any.
 */
export interface BudoStyle {
  /** A named look: the colours of the mats and of the floor. Judo: `yellow-red` (the IJF's own, the default), `yellow-blue`, `blue-grey`, `green-beige` (the traditional tatami), `green-red` (green mats with a red danger zone) and `black-red`. Karate: `blue-red` (the default), `blue-black`, `green-beige`. Kendo: `wood` (the default), `blond`. Sumo: `clay`. Kyūdō: `wood`. Dojo: `green-beige` (the default), `yellow-red`, `blue-grey`, `blue-yellow`, `black-red`, `green-red`. */
  look?: string;
  /** Judo and karate: how many competition areas lie side by side, 1 to 6 (1 by default), or `{ across, down }` for a block of them. They are as far apart as the rules ask, the common safety area. */
  areas?: number | { across: number; down: number };
  /** Judo, karate and kendo: the arena floor under the surface. `budokan` is the Nippon Budokan's, an octagon 55 m across the flats (the Budokan's leaflet), with the surface in the middle; it must fit. */
  hall?: "budokan";
  /** Judo: the contest area's side, 8 m to 10 m. Kendo: the shiai-jo's side, 9 m to 11 m. In metres. */
  size?: number;
  /** Judo: the width of the safety area, 3 m or more (4 m by default). In metres. */
  safety?: number;
  /** Judo: the tatami's size. `2x1` (the IJF's, 2 m by 1 m, the default of an IJF area), `1x1` (the half tatami) or `182x91` (the AJJF's own, the default of an AJJF area). */
  tatami?: "2x1" | "1x1" | "182x91";
  /** Judo: the tape that marks where the contestants start. On by default for the AJJF's area and the kata area, and for the IJF's (the 2020 rules' blue and white tape). */
  start?: boolean;
  /** Judo: a solid platform under the tatami, one metre wider and longer than it. Off by default. */
  platform?: boolean;
  /** Judo and karate: the technical table, the officials' seats and the judges, outside the safety area. Off by default. */
  officials?: boolean;
  /** Judo: draw the lines of the mats (the seams between them). On by default. */
  seams?: boolean;
  /** Karate: the referee's and the judges' places. On by default. */
  judges?: boolean;
  /** Sumo: the height of the clay square in metres, 0.34 to 0.60. 0.55 by default. Seen in 3D. */
  height?: number;
  /** Sumo: the four tassels of the roof, in the colours of the four quarters (green east, red south, white west, black north). Off by default. */
  tassels?: boolean;
  /** Sumo: the tawara, the shikiri-sen and the sand of the jano-me. On by default. */
  tawara?: boolean;
  /** Kyūdō: the number of shooters in a line, 1 to 12 (5 by default). */
  shooters?: number;
  /** Kyūdō: the kind of range, `kinteki` (28 m, the default) or `enteki` (60 m); `league` says it too. */
  range?: "kinteki" | "enteki";
  /** Kyūdō: the target of each shooter at the azuchi. On by default. */
  targets?: boolean;
  /** Kyūdō: the roof of the shajō. On by default. */
  roof?: boolean;
}

/** What each team has scored, as the sport counts it. Every part is optional; what is not given is left out of the board. */
export interface BudoScore {
  /** Judo, karate: the number of ippon (judo: 1 ends the contest; the IJF's scoreboard writes 100). */
  ippon?: number;
  /** Judo (10 on the scoreboard), karate (2 points). Two waza-ari are ippon in judo. */
  wazaari?: number;
  /** Judo (1 on the scoreboard), karate (1 point). */
  yuko?: number;
  /** Judo: the shido, three of which are hansoku-make. Karate: the warnings (chui), up to three. */
  shido?: number;
  /** Karate: the first unopposed score, senshu (先取). */
  senshu?: boolean;
  /** Kendo: the points of the match, each by the target struck: `men`, `kote`, `do` or `tsuki`, or `hansoku` for the point a foul gave the other side. */
  techniques?: readonly string[];
  /** Sumo: the kimarite that decided the bout, by its key (`yorikiri`) or its name (寄り切り). Only the winner's. */
  kimarite?: string;
}

/** A door of a dojo: the wall it is in, where along it (0 to 1, the middle by default) and how wide (1.8 m by default). */
export interface Entrance {
  wall: Side4;
  at?: number;
  width?: number;
}

/** A window of a dojo: the wall, where along it (0 to 1, the middle by default) and how wide (1.8 m by default). */
export interface DojoWindow {
  wall: Side4;
  at?: number;
  width?: number;
}

/** The size of a dojo's floor: the mats across and along, or a size with a unit, or the area in jō. */
export type DojoSize = number | readonly [number, number] | { width?: number; length?: number; unit?: "m" | "ft" | "mat" | "jo"; jo?: number };

/** The ways a dojo's mats are laid. */
export type DojoPattern = "traditional" | "competition" | "checker" | "border";

/** The colours a dojo may be given, each a CSS colour. */
export interface DojoColours {
  /** The mats. */
  mat?: string;
  /** The second tone: the other mats of a `checker` floor, the worn side of a mat, the border of a `border` floor. */
  alt?: string;
  /** The border of a `border` floor (a danger zone). */
  border?: string;
  /** The heri (畳縁), the cloth edge along a traditional mat's long sides. */
  heri?: string;
  /** The wood of the floor outside the mats, and of the walls' base. */
  floor?: string;
  /** The walls. */
  wall?: string;
}

/**
 * A dojo (道場): the floor in mats, laid out as real tatami units, and what stands round it. Every part is optional: 20 jō of traditional mats with the kamiza at the north, no walls.
 * `dojo()` makes its plan, and `drawKyogijo({ sport: "dojo", dojo })` draws it.
 */
export interface DojoSpec {
  /**
   * The floor. A number is its area in jō (畳): 8, 12, 20, 50, 100 or 200 give the usual shapes. `[across, along]` is the number of whole mats across the floor and along it
   * (`[5, 4]` is 20 jō). `{ width, length, unit }` is a size in metres (the default), feet, `mat` (as the array) or `jo`. 20 jō by default.
   */
  mats?: DojoSize;
  /** The area in jō, as `mats: 20` says it. */
  jo?: number;
  /** `traditional` (the default): mats laid so that no four corners meet, with a heri along the long sides. `competition`: the same lay, with the contest areas' colours. `checker`: the mats' tones alternate. `border`: a band of another colour round the floor. */
  pattern?: DojoPattern;
  /** The colours. A named look in `look` sets all of them. */
  colours?: DojoColours;
  colors?: DojoColours;
  /** A named look: `green-beige` (the default), `yellow-red`, `blue-grey`, `blue-yellow`, `black-red`, `green-red`. */
  look?: string;
  /** The wall the kamiza (上座), the seat of honour, is at. North (the top of the drawing) by default. The shōmen is that wall. */
  kamiza?: Side4;
  /** The doors. One in the middle of the wall opposite the kamiza by default. */
  entrances?: readonly Entrance[];
  /** The walls round the floor. On by default; `false` for the floor alone. */
  walls?: boolean | { thickness?: number };
  /** The windows: a list, or a number of them spread along the long walls. None by default. */
  windows?: readonly DojoWindow[] | number;
  /** The shinzen (神前), a shrine at the middle of the kamiza wall. Off by default. */
  shinzen?: boolean;
  /** The dojo's name, for the title and the description. */
  label?: string;
  labelJa?: string;
  /** Judo contest areas laid on the floor, 1 to 6 (none by default), of 8 m with a safety area where they fit. */
  areas?: number;
  /** The mat standard: a league of the `dojo` sport: `chukyoma` (the default), `kyoma`, `edoma`, `danchima` or `judo-2x1`; `league` says it too. */
  standard?: string;
}
