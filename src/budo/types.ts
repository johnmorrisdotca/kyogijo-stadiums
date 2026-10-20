// The types of the budō (武道) surfaces: judo and karate contest areas, the kendo shiai-jo, the sumo dohyō, the kyūdōjō, and a dojo of tatami, and the options that say what is drawn. Plain data only.

/** The sports of the budō family. */
export type BudoKind = "judo" | "karate" | "kendo" | "sumo" | "kyudo" | "dojo" | CombatKind;

/** The combat sports the engine of the budō also draws: the MMA cage. */
export type CombatKind = "mma";

/** The sides of a hall, as a plan has them: north is the top of the drawing. `top`, `bottom`, `left` and `right` say the same. */
export type Compass = "north" | "south" | "east" | "west";
export type Side4 = Compass | "top" | "bottom" | "left" | "right";

/**
 * What a budō drawing takes beyond a surface. Every part is optional: a judo contest area is the IJF's of 10 m with a safety area of 4 m, a karate area the WKF's kumite square, a kendo
 * shiai-jo of 10 m, a dohyō of the Japan Sumo Association and a kyūdōjō of 28 m with five shooters, drawn without any.
 */
export interface BudoStyle {
  /** A named look: the colours of the mats and of the floor. Judo: `yellow-red` (the IJF's own, the default), `yellow-blue`, `blue-grey`, `green-beige` (the traditional tatami), `green-red` (green mats with a red danger zone) and `black-red`. Karate: `blue-red` (the default), `blue-black`, `green-beige`. Kendo: `wood` (the default), `blond`. Sumo: `clay`. Kyūdō: `wood`. Dojo: `green-beige` (the default), `yellow-red`, `yellow-blue`, `blue-grey`, `black-red`, `green-red`. */
  look?: string;
  /** Judo and karate: how many competition areas lie side by side, 1 to 6 (1 by default), or `{ across, down }` for a block of them. They are as far apart as the rules ask, the common safety area. */
  areas?: number | { across: number; down: number };
  /** Judo, karate and kendo: the arena floor under the surface. `budokan` is the Nippon Budokan's, an octagon 55 m across the flats (the Budokan's leaflet), with the surface in the middle; it must fit. */
  hall?: "budokan";
  /** Judo: `shiai` (the contest area, the default) or `kata` (the IJF's kata area, `league: "ijf-kata"`: a centre tape, two white tapes 3 m from it either side, a safety area of 2 m; with `officials`, the five judges' seats on the shomen side and the coach's chair opposite). */
  style?: "shiai" | "kata";
  /** Judo: the contest area's side, 8 m to 10 m. Kendo: the shiai-jo's side, 9 m to 11 m. MMA cage: the width across the flats, 6.096 m to 9.754 m (20 to 32 feet), 9.144 m (30 feet) by default; 7.62 m is the smaller cage of 25 feet. In metres. */
  size?: number;
  /** Judo: the width of the safety area, 3 m or more (4 m by default). In metres. */
  safety?: number;
  /** Judo: the tatami's size. `2x1` (the IJF's, 2 m by 1 m, the default of an IJF area), `1x1` (the half tatami) or `182x91` (the AJJF's own, the default of an AJJF area). */
  tatami?: "2x1" | "1x1" | "182x91";
  /** Judo: the tape that marks where the contestants start. On by default for the AJJF's area and the kata area, and for the IJF's (the 2020 rules' blue and white tape). */
  start?: boolean;
  /** Judo: a solid platform under the tatami, one metre wider and longer than it. Off by default. */
  platform?: boolean;
  /** Judo and karate: the technical table, the officials' seats and the judges, outside the safety area (a judo kata area: the judges' table with the five judges' seats, and the coach's chair). Off by default. */
  officials?: boolean;
  /** Judo: draw the lines of the mats (the seams between them). On by default. */
  seams?: boolean;
  /** Judo and dojo: `weave` draws the rice-straw weave of a mat as fine ridges along each mat's long side (they turn a quarter where a mat does), with a faint highlight on the mat edges; `none` leaves the mats plain. A traditional dojo has it by default, a judo area has none. It drops away at the simple detail. */
  texture?: "weave" | "none";
  /** Karate: the referee's and the judges' places. On by default. */
  judges?: boolean;
  /** Sumo: the height of the clay square in metres, 0.34 to 0.60. 0.55 by default. MMA cage: the platform's height over the floor of the building, 0 to 1.219 m (4 feet), 1.219 m by default. Seen in 3D. */
  height?: number;
  /** Sumo: the four tassels of the roof, in the colours of the four quarters (green east, red south, white west, black north). Off by default. */
  tassels?: boolean;
  /** Sumo: the tawara, the shikiri-sen and the sand of the jano-me. On by default. */
  tawara?: boolean;
  /** MMA cage: the fence's height over the canvas, 1.524 m to 2.134 m (5 to 7 feet), 1.829 m (6 feet) by default. Seen in 3D. */
  fence?: number;
  /** MMA cage: the two gates, opposite each other (the fence is whole without them). On by default. */
  gates?: boolean;
  /** MMA cage: the steps up to the platform at each gate, three treads. On by default. */
  steps?: boolean;
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

/** One look of a dojo's floor in its history. */
export interface DojoEra {
  /** The era's name, as `era` asks for it (`earlier`, `current`). */
  name: string;
  nameJa?: string;
  /** The first and the last year it lasted, `null` where no source gives the year (an era with no years is picked by name, or as the last). */
  from?: number | null;
  to?: number | null;
  look?: string;
  colours?: DojoColours;
  pattern?: DojoPattern;
  areas?: number | { across: number; down: number };
  areaSize?: number;
  outline?: boolean;
}

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
  /** A named look: `green-beige` (the default), `yellow-red`, `yellow-blue`, `blue-grey`, `black-red`, `green-red`. */
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
  /** Judo contest areas laid on the floor: 1 to 6 in a row (none by default), or `{ across, down }` for a block (`{ across: 2, down: 2 }` is four), of 8 m with a safety area where they fit. */
  areas?: number | { across: number; down: number };
  /** The side of a contest area laid on the floor, 8 m to 10 m (the IJF's, 8 m by default). In metres. */
  areaSize?: number;
  /** A band one mat wide round each contest area in the third colour (the border mats that outline an area on a floor of one colour). Off by default. */
  outline?: boolean;
  /** `weave` or `none`: the rice-straw weave of the mats (on by default for the traditional and border lays). */
  texture?: "weave" | "none";
  /** The wood round the mats, between them and the walls, in metres (none by default; the Kodokan's main dojo has a polished wood surround). */
  surround?: number;
  /**
   * A spectators' balcony above the floor, a storey up, as `dojoRoom()` gives it (it is not part of the plan's drawing; `crowd` draws the stands): `true` for all four sides, or the sides, depth in metres (2.4 by
   * default), seat rows (3) and height above the mats (4.5 m). `sections` is the number of seats in each block of a row, from one end of a side to the other, with an aisle between blocks (the same on every side): `[5, 8, 8, 8, 5]`
   * is the Kodokan's, 34 to a row; without it a side is cut into blocks of about 9 m. The seats are spread over the side's length, so a seat is as wide as that makes it.
   */
  balcony?: boolean | { sides?: readonly Side4[]; depth?: number; rows?: number; height?: number; sections?: readonly number[] };
  /** The seat of honour's platform: a raised wooden dais at the middle of the kamiza wall (a chair stands on it in the Kodokan's main dojo). Off by default. */
  dais?: boolean;
  /** A plain dark vertical banner on the kamiza wall, over the dais or the shrine (a drawing of a banner, never any emblem). Off by default. */
  banner?: boolean;
  /**
   * The history of the floor: the looks it has had, oldest first. Each era names itself and may say the years it lasted (`from` and `to`, both inclusive, `null` where the years are not known),
   * and any of `look`, `colours`, `pattern`, `areas`, `areaSize` and `outline` it changes. `era` picks one by name; `year` picks the one that holds the year (the first whose years hold it);
   * with neither, the last (the floor as it is now) is drawn.
   */
  eras?: readonly DojoEra[];
  era?: string;
  year?: number;
  /** The mat standard: a league of the `dojo` sport: `chukyoma` (the default), `kyoma`, `edoma`, `danchima` or `judo-2x1`; `league` says it too. */
  standard?: string;
}
