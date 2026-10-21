import type { Background } from "./background.ts";
import type { BoardOptions } from "./overlay.ts";
import type { EmblemRef, EmblemRenderer } from "./emblems-source.ts";
import type { FlagRenderer } from "./flags-source.ts";
import type { Layer } from "./layers.types.ts";
import type { Unit } from "./units.ts";
import type { SoccerFrame, SoccerProviderId } from "./surfaces/soccer-providers.ts";
import type { SoccerPitchId, SoccerSize } from "./surfaces/soccer-spec.ts";
import type { Frame } from "./frames.ts";
import type { PoolSport, PoolStyle } from "./pool.types.ts";
import type { AthleticsStyle } from "./athletics/types.ts";
import type { SkatingStyle } from "./skating/types.ts";
import type { Situation } from "./situation.types.ts";
import type { BudoStyle, DojoSpec, BudoScore } from "./budo/types.ts";

/** The field sports: lacrosse (the field and the box), rugby (union and league), Australian football, Gaelic football and hurling, cricket, field hockey and team handball. */
export type FieldSport = "lacrosse" | "rugby" | "afl" | "gaelic" | "cricket" | "fieldhockey" | "handball";

export type { PoolSport, PoolStyle };

/** The budō: the contest areas of judo and karate, the kendo shiai-jo, the sumo dohyō, the kyūdōjō, and a dojo of tatami. */
export type BudoSport = "judo" | "karate" | "kendo" | "sumo" | "kyudo" | "dojo";

/** The combat sports' rings, cages and mats, drawn by the same engine as the budō: the MMA cage (eight-sided, as a generic cage), and as they are added the boxing ring, the wrestling mats and the professional wrestling ring. */
export type CombatSport = "mma" | "boxing" | "wrestling" | "prowrestling";

export type { BudoStyle, DojoSpec, BudoScore };

/** The surfaces: three football fields, a rink, a court, a ballpark, a soccer pitch, a curling sheet, twelve net, racket and court sports (tennis, volleyball, badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball, roundnet and netball), four pools (swimming, water polo, diving and artistic swimming), seven field sports (lacrosse, rugby, Australian football, Gaelic football and hurling, cricket, field hockey and handball) and the athletics stadium (the 400 m track with its infield, and the covered 200 m track). */
export type Sport = "nfl" | "cfl" | "ifaf" | "nhl" | "nba" | "mlb" | "soccer" | "curling" | "tennis" | "volleyball" | "badminton" | "pickleball" | "tabletennis" | "padel" | "squash" | "racquetball" | "sepaktakraw" | "teqball" | "roundnet" | "netball" | PoolSport | FieldSport | "athletics" | "skating" | BudoSport | CombatSport;

/** `auto` follows the device's light or dark setting (and `data-theme` on the page's root), the others force one. */
export type Theme = "auto" | "light" | "dark";

/** The language of the words the drawing says itself: its title, its description and its status labels. */
export type Language = "en" | "ja";

/**
 * How the surface lies. `landscape` is wide, with the teams left and right; `portrait` is tall, turned a quarter, with
 * the teams top and bottom and every word still upright. `auto` follows `aspect` (the container's width over its
 * height), and the helpers for the browser measure the container and draw again when it changes.
 */
export type Orientation = "landscape" | "portrait" | "auto";

/** A side of the drawing as the eye sees it. Which side the home team is on follows the sport (see `homeSideFor`) unless `homeSide` says otherwise. */
export type Side = "left" | "right";

/**
 * Where a special game is played: the surface the game's own surface is set inside. Give one of `park` (a key of `PARKS`), `ground` or `pitch` (a soccer
 * ground or pitch), `field` (a football field) or `deck` (a plain rectangle, such as a ship's deck). Its markings are those of `year` when it has history.
 */
export interface HostOptions {
  /** A ballpark: a key of `PARKS`. Its frame is the ballpark's: x across the field, y minus the distance out from the back of home plate, in feet. */
  park?: string;
  /** A soccer ground: a key of `GROUNDS`. Its frame is the pitch's, in feet: x along it from the left, y across it from the top. */
  ground?: string;
  /** A soccer pitch of a size or a preset, when no ground names it. */
  pitch?: SoccerPitchId | SoccerSize;
  /** A football field: `nfl`, `cfl` or `ifaf`. Its frame is the field's with its end zones, in feet, from the top left corner. */
  field?: "nfl" | "cfl" | "ifaf";
  /** The league whose rulebook marks a football `field` (`ncaa`). */
  league?: string;
  /** A plain rectangle in `unit` (feet by default), such as the deck of a ship. */
  deck?: { length: number; width: number; unit?: Unit };
  /** The season of the host's markings, when it differs from the drawing's `year` (a ballpark's fence, a field's rules). */
  year?: number;
  /** The words for the host in the title and the description, when it is not a park or a ground that has a name. */
  name?: string;
  nameJa?: string;
}

/**
 * Where the drawing's own surface stands in its host, in the host's frame in feet: `x` and `y` are where the surface's middle is (a ballpark's home plate),
 * and `angle` is the turn in degrees about it, clockwise as the eye sees it (0 leaves the surface as it lies).
 */
export interface Placement {
  x: number;
  y: number;
  angle: number;
}

/** How much of the surface's markings are drawn. `simple` leaves out the small ones, such as hash marks. */
export type Detail = "full" | "simple";

/**
 * How grass is mown: bands across the surface (the usual), wide ones or narrow ones, along it, in checks, on the diagonal, in diamonds (the checks turned 45 degrees: a ballpark outfield's crosshatch, its sides along the foul lines), in rings round the
 * middle (`circles`), or `none`. A ballpark is mown in `rings` by default (arcs about home plate) and may also be mown in a `fan` (wedges out from
 * home plate). A football field and a ballpark take the same options as a soccer pitch; a surface that is not grass ignores them.
 */
export type StripePattern = "bands" | "wide" | "narrow" | "lengthwise" | "checks" | "diagonal" | "diamonds" | "circles" | "rings" | "fan" | "none";

/**
 * How a goal is drawn, seen from above. A soccer goal: the net as a box behind the goal line, a line on it, a solid strip, or not at all.
 * A hockey net: the same four (`box` is the open frame behind the goal line, `strip` a filled net). A basketball basket: `box` is the backboard,
 * its arm and the rim, `line` the backboard only, `strip` a solid backboard and a filled rim, `none` neither. A football field's posts: `box`
 * is the crossbar with its stem, `line` the crossbar alone, `strip` bolder posts, `none` no posts.
 */
export type GoalStyle = "box" | "line" | "strip" | "none";

/**
 * Where a goal stands, for a function of your own that draws it (`goalMarkup`) and for `goalMarkup`'s built-in styles. Every number is in feet, in the
 * drawing's own wide frame (x along the surface from the left, y across it from the top), whatever `units` the options use.
 */
export interface GoalInfo {
  sport: Sport;
  /** The end the goal is at: `left` or `right`, as the surface is drawn wide. */
  end: Side;
  /** The middle of the goal's mouth on the goal line (the base of a basket's backboard). */
  x: number;
  y: number;
  /** The width of the mouth, across the surface. */
  width: number;
  /** How far the goal reaches from `x` (a net's depth behind the goal line, a basket's arm and rim out from its backboard), and which way: +1 to the right, -1 to the left. */
  depth: number;
  out: 1 | -1;
  /** The width at which this drawing draws its ordinary lines, so that a goal of your own can match them. */
  line: number;
}

/** The looks a drawing can have, alongside `court` (a basketball court's own). See `LOOKS`. */
export type LookName = "grass" | "night" | "chalkboard" | "blueprint" | "print" | "broadcast" | "high-contrast" | "line-drawing";

/** The width of the lines: a multiple of the width they are drawn at (`2`, or `{ scale: 2 }`), or an absolute width in `units` (`{ width: 0.5 }`). */
export type LineWidth = number | { scale: number } | { width: number };

/** How lines are dashed: `solid`, `dashed`, `dotted`, `dash-dot`, or dash and gap lengths of your own, in `units`. */
export type LineDash = "solid" | "dashed" | "dotted" | "dash-dot" | readonly number[];

/** Which way a team attacks, and in which period, for the arrow of `direction`. */
export interface DirectionOptions {
  /** The end the home team attacks, as the surface is drawn wide: `left` or `right`. In the first period, unless `period` says another. */
  home?: Side;
  /** The end the away team attacks. */
  away?: Side;
  /**
   * The period the arrows are for. The teams change ends by the sport's rule (hockey after every period, football after the first and the third quarters,
   * basketball at the half), so `home: "right", period: 2` in hockey draws home attacking the left. For a sport with no rule here, or an overtime a rule does not
   * settle, pass `changedAfter`.
   */
  period?: number;
  /** The periods after which the teams change ends, for a sport (or a case) the rules in `attackingIn` do not settle. */
  changedAfter?: readonly number[];
  /** The words by the arrow: one text for both, or one for each team. The teams' names or "Home" and "Away" by default; `false` for none. */
  label?: string | false | { home?: string; away?: string };
}

/** The axes of `axes`: a frame, where the ticks stand and whether they are numbered. */
export interface AxesOptions {
  /** A frame of `FRAMES` (or one of your own) for the sport: the ticks are its numbers. The surface's own (feet, or `units`) when missing. */
  frame?: string | Frame;
  /** The distance between ticks, or the values to put one at, for both axes or for `x` and `y` each. A round step that gives about eight ticks when missing. */
  ticks?: number | readonly number[] | { x?: number | readonly number[]; y?: number | readonly number[] };
  /** `false` for ticks with no numbers; or the titles of the axes, `{ x: "yards", y: "feet" }`. The frame's unit when missing. */
  labels?: boolean | { x?: string; y?: string };
}

/** The size of a score drawing: the surface with the score on it, the surface with a strip under it, or one strip. */
export type Size = "full" | "compact" | "badge";

/** An axis-aligned box, in feet. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The colours of the drawing. Each key is a CSS custom property, `--ky-<key in kebab case>`, set on the `svg`. Any CSS
 * colour that is a hex colour, `rgb()`, `hsl()`, a colour name or `var(--name)` is drawn; anything else is ignored.
 */
export interface Colors {
  /** The ground round the surface. */
  apron?: string;
  /** The playing surface: turf, ice, wood, outfield grass. */
  surface?: string;
  /** The second tone of mown stripes and of a worn floor. */
  surfaceAlt?: string;
  /** Painted lines. */
  line?: string;
  /** Hockey's blue lines and the centre circle. */
  blue?: string;
  /** Hockey's red lines, creases and face-off circles. */
  red?: string;
  /** The boards round a rink, or the border of a court. */
  boards?: string;
  /** A football end zone when no team colours it, and a court's neutral key. */
  zone?: string;
  /** Baseball's infield dirt and warning track. */
  dirt?: string;
  /** Baseball's foul ground. */
  foul?: string;
  /** The words of the drawing. */
  ink?: string;
  /** The outline round a name painted on a surface. */
  halo?: string;
  /** The panel the score sits on. */
  plate?: string;
  /** The words and numbers on the panel. */
  plateInk?: string;
  /** The plain colour of a data layer's marks. */
  layer?: string;
  /** The colour of the home team's marks. In a score drawing the home team's own colour, when it has one. */
  layerHome?: string;
  /** The colour of the away team's marks. */
  layerAway?: string;
  /** The line round a mark that sets it off the ground. */
  layerEdge?: string;
  /** The fill of a hollow mark (a miss). */
  layerHollow?: string;
  /** The letters of a text layer. */
  layerInk?: string;
  /** The outline round those letters. */
  layerHalo?: string;
}

/** The look of a basketball court. Every part is optional, and each falls back to the theme's. */
export interface CourtStyle {
  /** The wood: the floor's main tone. */
  wood?: string;
  /** The second tone of the planks. */
  woodAlt?: string;
  /** The ground outside the court. */
  apron?: string;
  /** The ring between the court's lines and the apron, the out-of-bounds border. */
  border?: string;
  /** The paint of both keys. */
  key?: string;
  /** The paint of the left key, over `key`. */
  keyLeft?: string;
  /** The paint of the right key, over `key`. */
  keyRight?: string;
  /** The colour of the court's lines. */
  line?: string;
  /** The paint inside the centre circle. */
  centreCircle?: string;
  /** A logo for the middle of the court: an address or an SVG document as text. */
  centreLogo?: string;
  /** Words along the baselines: one text for both ends, or `[left, right]`. */
  baselineText?: string | [string, string];
  /** The colour of the baseline words. */
  baselineInk?: string;
  /** Paint the area inside the three-point line in the key's colour. */
  paintThreePoint?: boolean;
  /**
   * A realistic floor: maple boards that run the length of the court with staggered ends, grain and tone, stained keys and centre circle with the wood showing through,
   * a stained border with a baseline in each team's colour, the baskets seen from above with their shadows, and a satin sheen. `true` for the defaults, or the options
   * (`HardwoodOptions`). Off by default, and then the drawing is byte for byte as before. See `docs/hardwood.md`.
   */
  hardwood?: boolean | HardwoodOptions;
  /** The colour of the border behind each baseline (`[left, right]`, or one for both) on a `hardwood` floor: a team's colour by default, else the border's. */
  baselineColor?: string | [string, string];
  /** Words along the sidelines, in the border of a `hardwood` floor: one text for both, or `[top, bottom]`. */
  sidelineText?: string | [string, string];
}

/** The options of a `hardwood` floor. Every part is optional. */
export interface HardwoodOptions {
  /** The seed of the boards' lengths and tones and of the grain: the same seed always gives the same floor. 1 by default. */
  seed?: number;
  /**
   * How much is drawn. `fine`: the boards' seams and ends, the grain, the baskets' soft shadows, the table and the benches. `plain`: broad boards and one shadow, for a
   * thumbnail. `auto` (the default) is `plain` when the drawing has `detail: "simple"` or a `width` under 480 pixels, else `fine`.
   */
  detail?: "auto" | "fine" | "plain";
  /** The width of a board in inches, 1.5 to 6. 2.25 by default, as a maple strip floor is laid. */
  board?: number;
  /** How much of the paint is stain, 0.3 to 1: the lower, the more wood shows through the keys, the circle and the border. 0.82 by default. */
  stain?: number;
  /** The satin sheen, 0 (none) to 1.5. 1 by default. */
  sheen?: number;
  /** Draw the baskets from above, with the stanchion and its shadows (the usual `goals` choices still apply). On by default. */
  hoops?: boolean;
  /** The coaching box's lines, the scorers' table and the two benches along the bottom sideline. On by default in the `fine` detail. */
  bench?: boolean;
}

/**
 * How much of a curling sheet is shown: all of it (`sheet`), the half from the hog line to the back line (`half`), just the house (`house`), or `folded`: the whole sheet as a strip in the
 * middle with its two houses enlarged beside it, so that the drawing fills a roughly square frame (see `SheetStyle.panels`).
 */
export type SheetShow = "sheet" | "half" | "house" | "folded";

/** An end of a curling sheet: `left` or `right` as the sheet lies wide, or `top` (the left end) and `bottom` (the right end), as a tall sheet's ends are read. */
export type SheetEnd = Side | "top" | "bottom";

/** The shape of a venue's stands round the playing surface. */
export type CrowdShape = "bowl" | "sides" | "horseshoe" | "grandstand";

/**
 * The lighting of a venue (`crowd.lighting` in the plan, `venue.lighting` in the 3D view). `"night"` (or `true`, or `{ preset: "night" }`) dims the house, lights the playing surface and shows small lights along the aisles and stairs, the ribbon
 * boards and the scoreboard glowing, the exits and the concourse rim softly lit. `"lightsDown"` is a show's house: nearly black, each stair aisle lit from above as a beam with a soft falloff on the steps either side, the rails and the front of
 * every step edged with light. `wash` colours the playing surface with a light (a CSS colour, or `white`, `amber`, `purple`, `magenta`, `blue`, `cyan`; the markings stay visible) and `aisles` the beams (`lightsDown`). `false` is no lighting. Off by default.
 */
export type LightingPreset = "night" | "lightsDown";
export type LightingOptions = LightingPreset | boolean | { preset?: LightingPreset; aisles?: string; wash?: string };

/** The patterns a ribbon board shows: `bands` (two bands of colour, in panels), `blocks` (a block of colour to a panel), `chevrons` (arrows running along it) or `waves`. */
export type LedBoardPattern = "bands" | "blocks" | "chevrons" | "waves";

/**
 * The LED boards of a venue (`crowd.boards`, or `venue.boards` of the 3D view): the ribbon boards along the fascia between the seating levels, and a scoreboard hung over the playing surface. The content is generic: bands of colour,
 * abstract patterns and a plain score, never a logo, a sponsor or text from a real board. `true` is both, in the package's own colours. Off by default.
 */
export interface LedBoardOptions {
  /** The ribbon boards along the fascia between the levels (the front of the single level of a hall that has one). On by default. */
  ribbon?: boolean;
  /** The scoreboard hung over the middle of the playing surface, four sided, with a ring of display under it. On by default, and left out of a ballpark (whose scoreboard stands behind the outfield). */
  scoreboard?: boolean;
  /** One to three colours of the lights, as CSS colours (`#e03c31`, `rgb(...)`, a name). The crowd's `home` and `away` colours when left out and the crowd has them, else amber, blue and white. */
  colors?: readonly string[];
  /** What the ribbon boards show. `bands` by default. */
  pattern?: LedBoardPattern;
  /** The plain score on the scoreboard: home, then away, whole numbers 0 to 99. 0 and 0 by default. */
  score?: readonly [number, number];
}

/**
 * The stands and the crowd round a surface (`crowd`). Every part is optional. `true` is the sport's usual venue, 85 percent full, with an away end, drawn in detail.
 * See `docs/crowd.md`.
 */
export interface CrowdOptions {
  /**
   * The venue: `bowl` (stands on every side), `sides` (the long sides only), `horseshoe` (three sides, the open end at the right, or at the left with `open: "left"`; a
   * ballpark's outfield with a gap at the batter's eye) or `grandstand` (a ballpark's infield stands only). Each sport has its usual one.
   */
  shape?: CrowdShape;
  /**
   * The stands of the arena's real venue, for an NHL `arena` the package has one of (`VENUES`, `@johnmorrisdotca/kyogijo-stadiums/venues`): the outline of its building from OpenStreetMap, the rink lying along
   * the building as it does in the world (a small arrow says where north is), and a bowl of the number of tiers and the seats the sources give, fitted inside the building, under its kind of roof. An arena with no venue
   * is drawn with the usual stands. Off by default. The drawing needs the credit `VENUE_ATTRIBUTION`. See `docs/venues.md`. The same for a football field (`sport: "cfl"`) or a soccer pitch in a real stadium (`stadium`, or a `ground` that is one;
   * `docs/stadiums.md`): the building, the field lying in it and a bowl of the configuration's seats.
   */
  real?: boolean;
  /** `false` draws no seats: of a real venue (`real`) only its building and the arrow that says where north is, which is what the floor of the 3D view needs under the stands it raises. On by default. */
  stands?: boolean;
  /** The end of a `horseshoe` that is open: `right` (the usual) or `left`. */
  open?: "left" | "right";
  /**
   * What a soccer pitch is inside. `auto` (the default) is a stadium of its own for most grounds and a gridiron stadium for the NFL's and the CFL's, where the stands keep a
   * football field's footprint and the pitch stands inside it; `purpose`, `nfl` and `cfl` choose. The footprint is drawn faintly so that the gap is seen.
   */
  stadium?: "auto" | "purpose" | "nfl" | "cfl";
  /** How full the stands are, 0 to 1: the share of seats with someone in them. 0.85 by default. Over `attendance`. */
  density?: number;
  /** The people in the stands, with `capacity` the seats: the density is their quotient. A ground's `capacity` is the default for soccer; without one, the seats the drawing's stands have. */
  attendance?: number;
  capacity?: number;
  /** The seed of the crowd: the same seed is always the same crowd. 1 by default. */
  seed?: number;
  /** The home fans' colour and the visitors': the teams' colours of a score, else the sides' colours. */
  home?: string;
  away?: string;
  /** Where the visitors sit: `auto` (the sport's usual place), `left`, `right`, `corner` (a block in a corner), or `none`. */
  awayEnd?: "auto" | "left" | "right" | "corner" | "none";
  /** A tifo or card display in the colours of a team, in a block of the lower stands behind a goal: `home`, `away`, `both` or `false`. Off by default. */
  tifo?: boolean | "home" | "away" | "both";
  /** `stripes` (the usual) or `checks`. */
  tifoDesign?: "stripes" | "checks";
  /** Tunnels, the benches' places and the camera platform of the media side. On by default. */
  gaps?: boolean;
  /** The roof's edge throws a shade on the last rows of the upper tier. On by default. */
  roof?: boolean;
  /** A ballpark's seats on top of a wall: `true` for every wall of the park's data that is 25 feet or more (and has a `walls` entry), `false` for none, and by default the walls the package knows have seats (Fenway Park's Green Monster). */
  wallSeats?: boolean;
  /** How much is drawn: `fine` (the crowd as heads and shoulders, empty seats, aisles), `plain` (blocks of colour), or `auto` (`plain` for `detail: "simple"` or a `width` under 480 pixels). */
  detail?: "auto" | "fine" | "plain";
  /**
   * LED boards: ribbon boards along the front of the upper tiers (drawn as a lit line in the flat plan, raised on the fascia of the suite level in the 3D view, where `venue.boards` says the same and wins) and a scoreboard over the
   * middle of the surface. `true` for both in the package's colours, or `{ ribbon, scoreboard, colors, pattern, score }`. Generic content only. Off by default. See `docs/boards.md`.
   */
  boards?: boolean | LedBoardOptions;
  /** The lighting of the venue: `"night"` dims the house and lights the surface, the aisles, the boards and the exits. Off by default. See `docs/venues.md`. */
  lighting?: LightingOptions;
}

/**
 * The parts of a surface a drawing can be cropped to (`range`). Football: `red-zone`, `between-the-20s`, `end-zone`, `field-of-play`, `own-half`, `opponent-half`.
 * Hockey: `offensive-zone`, `defensive-zone`, `neutral-zone`, `half`. Basketball: `half-court`, `paint`. Soccer: `half`, `final-third`, `defensive-third`, `middle-third`,
 * `penalty-area`. Baseball: `infield`, `outfield`. The net sports: `half-court`. Curling: `sheet`, `half`, `house`, `folded`. Rugby: `half`, `twenty-two` (union) or `twenty` (league), `in-goal`. Lacrosse: `half`, `crease`. Australian football: `half`, `forward-fifty`, `centre-square`.
 * Gaelic games: `half`, `large-rectangle`. Cricket: `pitch`, `circle`. Field hockey: `half`, `circle`, `twenty-three`. Handball: `half`, `goal-area`. Swimming: `half`, `pool-end`. Water polo: `half`, `goal-area`. Diving: `springboards`, `platforms`. Artistic swimming: `half`, `centre-stage`. Judo and karate: `contest-area`, `start`. Sumo: `ring`. Kyudo: `shajo`, `yamichi`, `azuchi`. Dojo: `kamiza`, `half`. Athletics: `bend`, `home-straight`, `back-straight`, `finish`, `start`, `infield`, a field event (`high-jump`, `pole-vault`, `long-jump`, `triple-jump`, `shot-put`, `discus-throw`, `hammer-throw`, `javelin-throw`) and `water-jump`. `RANGES` lists them for each sport.
 */
export type RangeName =
  | "red-zone"
  | "between-the-20s"
  | "end-zone"
  | "field-of-play"
  | "own-half"
  | "opponent-half"
  | "offensive-zone"
  | "defensive-zone"
  | "neutral-zone"
  | "half"
  | "half-court"
  | "paint"
  | "final-third"
  | "defensive-third"
  | "middle-third"
  | "penalty-area"
  | "infield"
  | "outfield"
  | "sheet"
  | "house"
  | "folded"
  | "in-goal"
  | "twenty-two"
  | "twenty"
  | "crease"
  | "forward-fifty"
  | "centre-square"
  | "large-rectangle"
  | "pitch"
  | "circle"
  | "twenty-three"
  | "goal-area"
  | "pool-end"
  | "springboards"
  | "platforms"
  | "centre-stage"
  | "bend"
  | "home-straight"
  | "back-straight"
  | "finish"
  | "start"
  | "infield"
  | "high-jump"
  | "pole-vault"
  | "long-jump"
  | "triple-jump"
  | "shot-put"
  | "discus-throw"
  | "hammer-throw"
  | "javelin-throw"
  | "water-jump"
  | "crossing-straight"
  | "first-bend"
  | "second-bend"
  | "judges"
  | "kiss-and-cry"
  | "contest-area"
  | "ring"
  | "shajo"
  | "yamichi"
  | "azuchi"
  | "kamiza"
  | "cage"
  | "gate"
  | "ropes"
  | "corner"
  | "passivity";

/** A named range at the end of your choice: `{ name: "offensive-zone", end: "left" }` is the offensive zone of a team that attacks the left. */
export interface RangeNamed {
  name: RangeName;
  /** The end of the surface the range is at, as the surface is drawn wide: `left` or `right` (a curling sheet's also `top` and `bottom`: the left end and the right). Each range has its own default (`RANGES`); a range with no end ignores it. */
  end?: SheetEnd;
}

/**
 * A box of your own to crop to: the corners `x0, y0` and `x1, y1`, in the drawing's frame (feet, or `units`: x along the surface from the left, y across it from the top;
 * a ballpark's x is across the field and its y minus the distance out from home plate), or, with `frame`, in that frame's own numbers and unit.
 */
export interface RangeBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** A frame of `FRAMES` (or one of your own) the numbers are in. The surface's own when missing. */
  frame?: string | Frame;
  /** The end the box's points are attacking, for a frame whose numbers belong to the team's attack (see `toSurface`). */
  attacking?: Side;
}

/** The colours of a curling house, each a CSS colour. The 12-foot ring is blue and the 4-foot ring red by default. */
export interface HouseRings {
  /** The band between the 12-foot and the 8-foot circles. */
  outer?: string;
  /** The band between the 8-foot and the 4-foot circles. */
  middle?: string;
  /** The band between the 4-foot circle and the button. */
  inner?: string;
  /** The button. */
  button?: string;
}

/** The look and the size of a curling sheet. Every part is optional. */
export interface SheetStyle {
  /** The length of the sheet, backboard to backboard, in `units` (feet by default): within the league's range (146 to 150 feet). 150 feet by default. */
  length?: number;
  /** The width, sideline to sideline, in `units`: within the league's range. 15 feet 7 inches by default. */
  width?: number;
  /** The colours of the house. */
  rings?: HouseRings;
  /** Draw the ice's pebble: a fine texture of dots over the sheet. Off by default. */
  pebble?: boolean;
  /** Shade the free guard zone at both ends: the ground between the hog line and the tee line, outside the house. Off by default. */
  guardZone?: boolean;
  /** How much of the sheet to show. A bare sheet only; a score always shows all of it. `sheet` by default. `range` says the same (`range: "house"`) and wins. `folded` is the whole sheet with both houses enlarged beside it. */
  show?: SheetShow;
  /** Which end `show: "half"` and `show: "house"` show: the `left` one (the top house of a tall drawing, the default) or the `right`; `top` and `bottom` say the same for a tall sheet (`top` is the left end). */
  end?: SheetEnd;
  /** What each enlarged panel of `show: "folded"` holds: the `half` from the hog line to the back line, with the free guard zone (the default), or just the `house`. */
  panels?: "half" | "house";
  /** The shape of the frame `show: "folded"` fills: width over height as the drawing lies, 1 (square) by default; the panels are as large as that allows. */
  fit?: number;
}

/** The named looks of a tennis court: the colour of its surface and of the ground round it. */
export type TennisLook = "hard-blue" | "hard-green" | "clay" | "grass";
/** The named looks of a volleyball court: a wooden floor, a floor painted blue, or the sand of the beach. */
export type VolleyballLook = "wood" | "blue" | "sand";
/** The named looks of a badminton court. */
export type BadmintonLook = "green" | "blue" | "wood";
/** The named looks of a pickleball court. */
export type PickleballLook = "blue-green" | "green" | "red";
/** The named looks of a table tennis table. */
export type TableTennisLook = "blue" | "green";
/** The named looks of a padel court: the colours the FIP's rules prefer for the floor. */
export type PadelLook = "blue" | "green" | "terracotta";
/** The named looks of a squash court. */
export type SquashLook = "wood" | "blue";
/** The named looks of a racquetball court: the lines are the IRF's recommended red, or blue on a convertible court. */
export type RacquetballLook = "wood" | "convertible";
/** The named looks of a sepak takraw court. */
export type SepakTakrawLook = "blue" | "green" | "wood";
/** The named looks of a teqball court. */
export type TeqballLook = "grey" | "blue" | "green";
/** The named looks of a roundnet court. */
export type RoundnetLook = "grass" | "sand" | "indoor";
/** The named looks of a netball court. */
export type NetballLook = "wood" | "blue" | "green";

/**
 * The look and the variants of a net sport's court (tennis, volleyball, badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball, roundnet
 * and netball). Every part is optional.
 * The lines and the sizes are the rulebook's whatever the look; a look is the colour of the ground and of the surface.
 */
export interface NetStyle {
  /** A named look: for tennis `hard-blue` (the default), `hard-green`, `clay` or `grass`; volleyball `wood` (the default for indoors) or `blue`, and `sand` for the beach; badminton `green` (the default), `blue` or `wood`; pickleball `blue-green` (the default), `green` or `red`; table tennis `blue` (the default) or `green`; padel `blue` (the default), `green` or `terracotta`; squash `wood` (the default) or `blue`; racquetball `wood` (the default) or `convertible`; sepak takraw `blue` (the default), `green` or `wood`; teqball `grey` (the default), `blue` or `green`; roundnet `grass` (the default), `sand` or `indoor`; netball `wood` (the default), `blue` or `green`. An unknown name is an error that lists them. */
  look?: string;
  /**
   * The free zone drawn round the court: `official` (the default: the figure a rulebook gives for its own competitions, where it gives one), `least` (the least it allows
   * or recommends) or `none`. Tennis (Appendix X), volleyball, beach volleyball and sitting volleyball (Rule 1.1), pickleball (Rule 3.A.3), sepak takraw (Law 1.5), netball (Rule 1, item 8) table tennis (the ITTF's 3.2.3.1, the playing space) and badminton (the BWF's facilities specification, 5.3.4: 2 m behind the baselines and 1.5 m beside the side lines) give figures; padel, squash, racquetball, teqball and roundnet do not.
   */
  free?: "official" | "least" | "none";
  /**
   * Table tennis: the kind of event the playing area is for (the ITTF's Regulations for International Competitions, 3.2.3.1): `standard` (the default: a space of at least 14 m by 7 m by 5 m, for the Worlds and every international event),
   * `masters` (10 m by 5 m, the least a Masters event allows) or `wheelchair` (8 m by 6 m). It sets the free zone round the table (`free: "none"` still draws none); the standard one is `free: "official"` and the Masters one `free: "least"`.
   */
  area?: "standard" | "masters" | "wheelchair";
  /** Table tennis: draw the surrounds that enclose the playing area, 75 cm high (ours, within the 50 cm to 100 cm of 3.2.3.3), of one dark colour. On by default where a playing area is drawn. */
  surrounds?: boolean;
  /** Table tennis: draw the umpire's chair in line with the net, the assistant umpire's chair facing it across the table, and the umpires' table (3.3.2.2; their sizes are ours). On by default where a playing area is drawn. */
  umpires?: boolean;
  /** Tennis: draw the two singles sticks that hold a doubles net up for a singles match, 3 feet outside the singles court (Rule 1). Off by default. */
  sticks?: boolean;
}

/**
 * The size and the variants of a field sport's surface (lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey, handball): a size within the range the league's rulebook allows (`length`, `width`,
 * in `units`, feet by default), and the sport's own parameters. Every part is optional.
 */
export interface FieldStyle {
  /** The length of the surface (rugby: try line to try line; Australian football: goal line to goal line; Gaelic games, hockey, handball, lacrosse: end line to end line) and its width, in `units`: within the league's range; a size outside it is an error that says the range. The greatest the rules allow by default. */
  length?: number;
  width?: number;
  /** Rugby: how deep each in-goal area is, within the league's range. */
  inGoal?: number;
  /** Australian football: a named ground of `AFL_GROUNDS` (`mcg`, `optus-stadium`...), whose length and width are those its venue page prints. `length` and `width` win over it. */
  ground?: string;
  /** Cricket: the boundary, as its distance from the centre of the pitch (a circle), or `{ straight, square }`, its distances along the pitch and across it (an ellipse), in `units`, within the league's range. */
  boundary?: number | { straight: number; square: number };
  /** Cricket: draw the fielding restriction's circle (the 30-yard circle) where the league has one. On by default. */
  circle?: boolean;
}

/** The shape of a team's mark: its logo as it is (`plain`), or clipped to a circle with a ring (`round`). */
export type TeamMark = "plain" | "round";

/** How a pageant lays out each team's picture: `carpet` is its flag or logo laid flat over its half, as a rectangle with a border; `stage` is its crest on a large round disc with a ring. */
export type PageantStyle = "carpet" | "stage";

/**
 * The pageant: each team's flag or logo laid out large over its own half of the surface, as a stadium lays giant flags and crests on the pitch for a final's
 * ceremony, and an emblem or a trophy in the centre circle. Give `pageant: "carpet"`, `"stage"` or `true` (a carpet), or these options. Off by default, and a drawing without it is
 * the same text as before. It needs a score (`home` and `away`) and the full or compact size.
 */
export interface PageantOptions {
  /** `carpet` (the default) or `stage`. */
  style?: PageantStyle;
  /** A carpet's border band: `dark` (the default), `team` (each team's colour), or a colour. */
  border?: "dark" | "team" | (string & {});
  /** A carpet's border band as a share of its shorter side, 0.02 to 0.15. 0.06 by default. */
  borderWidth?: number;
  /** A carpet's fabric: a gentle, fixed wave of light and shade over it. On by default; left out at small sizes. */
  fabric?: boolean;
  /** Where the surface's lines lie: `over` the pictures (the default), `under` them (the pictures cover the lines), or `through` (under the pictures, which are a little see-through, so that the lines show faintly). */
  lines?: "over" | "under" | "through";
  /** A stage's ring: `gold` (the default), `team` (each team's colour), or a colour. */
  ring?: "gold" | "team" | (string & {});
  /** The picture in the centre circle, centre ice, centre court or at the mound: a competition's emblem or a trophy, as a logo is given (an address, an image `data:` address, an SVG document as text, or, with a renderer of emblems plugged in, the id of one: `"trophy:hockey-cup"`). Yours; none is supplied. */
  emblem?: EmblemRef;
  /** `round` (the default): the emblem on a disc with a ring, as a team's mark. `plain`: the picture as it is, for a trophy with a cut-out outline. */
  emblemShape?: "round" | "plain";
  /** An emblem's fit on its disc: `contain` (the default: shown whole) or `cover` (it fills the disc). */
  emblemFit?: "contain" | "cover";
  /** What the emblem is, for the drawing's description: "World Cup". */
  emblemName?: string;
  /** Where the score goes: `centre` (the plate stays in the middle, a little smaller, and the pictures keep clear of it), `strip` (the compact strip under the drawing) or `auto` (the default: the centre, unless there is an emblem or the sport's board is large, which then go to the strip). */
  score?: "auto" | "centre" | "strip";
  /**
   * How a carpet fills its half: `fill` (the default) takes the room the half gives it with a margin, as a ceremony's flags are made to the size of the half, so its shape may differ from the
   * flag's ratio by up to 2 to 1, and the art is stretched a little and cropped a little (each by the square root of the difference, so stripes stay stripes and a centred emblem stays nearly round);
   * `ratio` keeps the flag's own ratio and leaves the rest of the half bare. A stage is round either way.
   */
  fit?: "fill" | "ratio";
  /** The size of a carpet or a stage, as a share of the room its half gives it. 0.4 to 1; 1 by default (the room less a margin). */
  scale?: number;
  /** Write each team's name on its picture. By default only a team with no flag or logo has its name (or its initials, when they would not fit). */
  names?: boolean;
  /** An entrance, in CSS only and for people who have not asked for less motion: `unfurl` (a carpet rolls out from its end, a stage grows) or `fade`. `none` by default. */
  animate?: "none" | "unfurl" | "fade";
}

/** One team of a score. */
export interface Team {
  /** The name, as it is to be written: "Canada". */
  name: string;
  /** A short form, three letters or so, for the score and the badge. Taken from the name when missing. */
  abbr?: string;
  /** The score. A number, or text such as "–" before the game. */
  score?: number | string;
  /**
   * A country code (`CA`, `jp`, `GB-ENG`) for the team's flag, drawn by the renderer of flags plugged in with `useFlags` (or the drawing's `flags` option): round in a round mark, in its own proportions on a
   * plain mark, a carpet and a banner, round on a stage. It wins over `logo` where the renderer has a flag for the code. With no renderer, or none for the code, the `logo` is drawn, or the initials.
   */
  flag?: string;
  /** The logo: an `https:` or relative address, an image `data:` address, an SVG document as text, or, with a renderer of emblems plugged in (`useEmblems`), the id of a ready-made emblem: `"crest:shield"` takes the team's `color`, `textColor` and `abbr`. */
  logo?: EmblemRef;
  /**
   * How the logo is drawn: `round` clips it to a circle with a thin ring (a flag, or a crest) and, for a team with no logo, draws its initials on its colour; `plain` is the
   * logo as it is, in a box. The score's `markShape` is the default for both teams.
   */
  mark?: TeamMark;
  /** A round mark's fit: `cover` (the default) fills the circle with the picture, as a flag does; `contain` shows a crest whole on a plain disc. */
  markFit?: "cover" | "contain";
  /** The pageant's carpet is as wide as it is tall by this ratio: 1.5 for a flag of 3 to 2. Read from an SVG logo's `viewBox` when missing, else 1.5; held between 1 and 3. */
  logoRatio?: number;
  /** The goals it scored in a penalty shoot-out: shown with the status, and the winner of a level game. */
  penalties?: number | string;
  /** Curling: the points it scored in each end, in order (`null` for an end not played yet; `"X"` for a conceded one). */
  ends?: readonly (number | string | null | undefined)[];
  /** Curling: the team has the hammer, the last stone of the end. A marker is drawn beside its name. */
  hammer?: boolean;
  /** The net and racket sports (not netball): what it scored in each set (tennis and padel: its games; the others: each game's or set's points), in order; `null` for one not played yet. The set in progress is the last one given. */
  sets?: readonly (number | string | null | undefined)[];
  /** Tennis: the points of a tie-break in each set (the same places as `sets`; `null` where the set had none), written small beside the games. */
  tiebreaks?: readonly (number | string | null | undefined)[];
  /** Tennis: the points of the game in progress: `0`, `15`, `30`, `40`, `Ad`, or the points of a tie-break. */
  points?: number | string;
  /** The team that is serving. A ball is drawn beside its name (and in the corner of its block on the badge). */
  serving?: boolean;
  /** Australian football: the goals and the behinds it has scored; Gaelic games: its goals and its points (`points`). The score is written "10.12 (72)" in Australian football (a goal is 6, a behind 1) and "2-14 (20)" in Gaelic games (a goal is 3, a point 1), and the total is worked out when `score` is not given. */
  goals?: number | string;
  behinds?: number | string;
  /** Cricket: the wickets it has lost and the overs it has faced ("38.2"), with `score` its runs; for a match of more than one innings, `innings` is each innings as "245" or "245/6d". */
  wickets?: number | string;
  overs?: number | string;
  innings?: readonly (number | string | null | undefined)[];
  /** Judo, karate, kendo and sumo: what the team has scored, as the sport counts it (see `BudoScore`). */
  budo?: BudoScore;
  /** The team's colour, for its end, key or dugout. */
  color?: string;
  /** The colour of the words on that colour. Black or white by the colour's lightness when missing. */
  textColor?: string;
}

/** The distances to a ballpark's fence in feet, at the foul lines, between and in the middle. */
export interface Fence {
  left: number;
  leftCenter: number;
  center: number;
  rightCenter: number;
  right: number;
}

/** How a ballpark's walls are drawn (`walls`). */
export interface WallOptions {
  /** A key under the drawing for the shades: under 10 feet, 10 to 20, 20 to 30 and 30 and over (the same in metres for a drawing in metres). */
  legend?: boolean;
  /** Write each wall's name or place and its height beside it. */
  labels?: boolean;
}

/** The things in a ballpark that `quirks` draws besides the walls. */
export type QuirkName = "hill" | "overhang" | "pole" | "flagpole" | "bullpen" | "ivy" | "basket" | "backstop" | "dugouts";

/** Which quirks of a ballpark are drawn (`quirks`), and whether they carry their names. */
export interface QuirkOptions {
  /** Only these; all of the park's by default. */
  only?: readonly QuirkName[];
  /** Write each quirk's name beside it. */
  labels?: boolean;
}

/** What every drawing takes. */
export interface SurfaceOptions {
  sport: Sport;
  /** `auto` (the default), `light` or `dark`. */
  theme?: Theme;
  /** `landscape` (the default), `portrait` or `auto`. */
  orientation?: Orientation;
  /** For `orientation: "auto"`: the container's width over its height. Without it `auto` draws landscape. */
  aspect?: number;
  /** Give the parts of the drawing `part` names (`surface`, `plate`, `away`, `home`, `score`), for styling inside a shadow root. */
  parts?: boolean;
  /** The language of the title, the description and the status labels. English by default. */
  language?: Language;
  /** The accessible name of the drawing. Made from the sport and the score when missing. */
  title?: string;
  /** The accessible description. Made from the sport, the dimensions and the score when missing. */
  description?: string;
  /** A prefix for the ids inside the drawing. Made from the options when missing, so that the same call gives the same drawing. */
  id?: string;
  /** A renderer of ready-made emblems for this drawing alone, so that a `logo`, an `emblem` or a mark may be an emblem's id: `emblems: renderEmblem` from `@johnmorrisdotca/dougu-sports/emblems`. Over the one the page plugged in with `useEmblems`. */
  emblems?: EmblemRenderer;
  /**
   * A renderer of country flags for this drawing alone, so that a team's `flag` code is drawn: a synchronous function from a code and `{ shape, size, theme }` to an SVG string, such as a lookup of flags
   * loaded from `@johnmorrisdotca/hata` first. Over the one the page plugged in with `useFlags`. See `docs/flags.md`.
   */
  flags?: FlagRenderer;
  /** The ground to draw round the playing surface, in `units` (feet by default). A default for each sport. */
  margin?: number;
  /**
   * The unit of every length in these options: `margin` and the distances of `fence`, and the coordinates and limits a
   * data layer places. Feet when missing; they are converted to feet once, before anything is drawn.
   */
  units?: Unit;
  /** `simple` leaves out the small markings. */
  detail?: Detail;
  /** Draw lines at their true widths. By default they are drawn thicker, as broadcast graphics do, so they stay in view when small. */
  exactLines?: boolean;
  /** Mown stripes on a football field or a soccer pitch. On by default. */
  stripes?: boolean;
  /** Colours of the drawing, over the theme's. */
  colors?: Colors;
  /** The colour of the left end when no team gives one. */
  leftColor?: string;
  /** The colour of the right end when no team gives one. */
  rightColor?: string;
  /**
   * The league whose rulebook marks the surface: `sport` names the family (`nba` for basketball, `nhl` for hockey, `nfl`, `cfl` or
   * `ifaf` for football, `mlb` for baseball and softball) and `league` the variant (`fiba`, `ncaa-women`, `iihf`, `little-league`,
   * `fastpitch`...). See `LEAGUES`. Without it the sport's own league is drawn. A year draws a league's markings of that season only
   * where the league has a cited history (`leagueChanges`); the sport's own history (`rulesFor`) is that of its own league.
   */
  league?: string;
  /** The ballpark of an MLB drawing: a key of `PARKS`, or `generic` (the default) for a typical field. */
  park?: string;
  /**
   * A special game: the surface the drawing's own (`sport`) is set inside, to scale, such as a hockey rink in a ballpark or a basketball court on a ship's deck.
   * The team banners, the score and the data `layers` are on the inner surface, in its frame. A special game is drawn as the host lies, wide, whatever
   * `orientation` says. See `EVENTS` and `eventOptions` for the games with their sources.
   */
  host?: HostOptions;
  /** Where the surface stands in its `host`. Without it, the middle of the host's field (`midfield`), or of the infield of a ballpark. */
  placement?: Placement;
  /** The key of a special game of `EVENTS`, which `eventOptions` fills in: its name and date are then in the title and the description. */
  event?: string;
  /**
   * The season to draw the surface as it was in: a year names the season that starts in it (`1979` is the NHL's and the NBA's 1979–80,
   * the NFL's, the CFL's and baseball's 1979). The markings are those the rules put on the surface that season (`rulesFor`), and
   * a past ballpark's fence is the one it had then (`polo-grounds` in 1915, from its `periods`, else its last fence). Without a
   * year the surface is today's; the IFAF's has no history. For a soccer `ground`, the year whose name the drawing uses.
   */
  year?: number;
  /** Fence distances of an MLB drawing, in `units`, over the park's. */
  fence?: Partial<Fence>;
  /**
   * The height of a ballpark's walls, from the figures its article publishes: a band outside each stretch of the fence whose width and shade say
   * how high it stands (the Green Monster, the Crawford Boxes, the Baggie), with `legend` for a key and `labels` for the names. For the season
   * `year` names, else today's. A stretch the article gives no height for is left bare. Off by default, and then the drawing is as it was.
   */
  walls?: boolean | WallOptions;
  /**
   * What a ballpark's article describes with figures besides the distances: a hill (Tal's Hill), an overhang, the poles, the bullpens, ivy and the basket,
   * the distance to the backstop and the sides of the dugouts. For the season `year` names. Off by default.
   */
  quirks?: boolean | QuirkOptions;
  /** The look of an NBA court. */
  court?: CourtStyle;
  /**
   * The stands and the crowd round the surface, for a venue that has spectators: a bowl, two sides, a horseshoe or a ballpark's grandstands, with the people as heads and
   * shoulders in the home colours and a visitors' end. `true` for the defaults, or `CrowdOptions`. Off by default, and then the drawing is byte for byte as it was.
   */
  crowd?: boolean | CrowdOptions;
  /** The size and look of a curling sheet. */
  sheet?: SheetStyle;
  /** The look and the variants of a tennis, volleyball, badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball, roundnet or netball court. */
  net?: NetStyle;
  /** The size and the variants of a lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey or handball surface. */
  field?: FieldStyle;
  /** The pool of a swimming, water polo, diving or artistic swimming drawing: the course and the lanes, the look of the water and the deck, a side section, the lanes of a race with its results and splits, and several pools in one hall. */
  pool?: PoolStyle;
  /** The athletics stadium: the number of lanes, the colour of the track, what is in the infield, the races and the field events marked. See `AthleticsStyle`. */
  athletics?: AthleticsStyle;
  /** The skating rink: the long track's radius and lanes, the short track's tracks, the figure skating rink's size and furniture, the races marked. See `SkatingStyle`; the discipline is the `league`. */
  skating?: SkatingStyle;
  /** The budō surfaces (judo, karate, kendo, sumo, kyudo): the size of the area, the marks, the number of areas, the look. See `BudoStyle`; the rulebook is the `league`. */
  budo?: BudoStyle;
  /** A dojo of tatami (`sport: "dojo"`): the mats, the pattern, the walls, the kamiza. See `DojoSpec` and `dojo()`. */
  dojo?: DojoSpec;
  /** The soccer pitch: a preset (`fifa`, `uefa`, `mls`, `nwsl`, `ncaa`, `law-min`, `law-max`, `9-a-side`, `7-a-side`, `5-a-side`, `futsal`) or a size, `{ length, width, unit }`. The international 105 by 68 m by default. */
  pitch?: SoccerPitchId | SoccerSize;
  /** The soccer ground to draw: a key of `GROUNDS`. The pitch has the size its article publishes (the international 105 by 68 m where none is), and the drawing carries the ground's name for `year`. A `pitch` of your own wins over the ground's size. */
  ground?: string;
  /** The stadium to draw a football field (`sport: "cfl"`), a soccer pitch or a boxing ring (`sport: "boxing"`, in a hall) in, for `crowd: { real: true }`: a key of `STADIUMS` (`bc-place`, `korakuen-hall`). A soccer drawing with a `ground` that is a stadium of `STADIUMS` needs no other. */
  stadium?: string;
  /** The arena to draw an NHL rink or an NBA court of: a key of `ARENAS`. The rink or the court has the size its sources publish where that differs from the league's (the league's where none does), the markings are those of `year`, and the drawing carries the arena's name for `year`. A `league` of your own wins over the arena's size. */
  arena?: string;
  /** Draw a soccer pitch in a data provider's own coordinates (`opta`, `statsbomb`, `wyscout`, `tracab`, `metrica`, `skillcorner`, `secondspectrum`, `impect`, `uefa`, `international`), or in a frame of your own: the lines stand where the provider puts them, and an empty `ky-data` group in its units is put in the drawing for raw data. */
  pitchType?: SoccerProviderId | SoccerFrame;
  /** Only half of a soccer pitch: the `left` half or the `right` one. Ignored when the drawing has teams. `range: "half"` does the same for every sport and for a score too. */
  half?: "left" | "right";
  /** How the grass of a soccer pitch is mown. `bands` (the usual) by default; `stripes: false` turns it off. */
  stripePattern?: StripePattern;
  /** How the goals of a soccer pitch are drawn. `box` by default. */
  goals?: GoalStyle;
  /** Corner flags on a soccer pitch. On by default in the `full` detail. */
  cornerFlags?: boolean;
  /**
   * Only part of the surface: a named range of the sport (`"offensive-zone"`, `"half-court"`, `"red-zone"`, `"penalty-area"`, `"infield"`... see `RANGES`), one at the end you choose
   * (`{ name, end }`), or a box of your own (`{ x0, x1, y0, y1 }`, in the drawing's frame or any registered one). The drawing is cropped to it with a small margin; data, heat and
   * annotations follow, and a score's panel stands inside it. Unset, the whole surface is drawn, byte for byte as before.
   */
  range?: RangeName | RangeNamed | RangeBox;
  /**
   * A ground behind the surface, laid on the apron round it: a pattern drawn in SVG (`"felt"`, `"grass"`, `"wood"`, `"ice"`, `"paper"`, `"grid"` or `"dots"`, subtle and in the drawing's ink,
   * so that it follows light and dark), or `{ pattern, color, opacity, scale, image, imageOpacity, imageFit }`, where `image` is a photograph held to the rules of a team's `logo`.
   * Unset, the drawing is byte for byte as before. See `BackgroundOptions`.
   */
  background?: Background;
  /**
   * A board laid over the drawing: a results board, a bout presentation or a medal table that another package drew (Taisen Brackets', say), taken as an SVG string with its width and height, and placed at the top, a side, a corner or a point
   * of your own, kept off the middle of the surface unless you say otherwise. It is written as an image, never changed and never stretched, and in the 3D view it is a layer over the view that does not turn with it. A compact strip and a
   * badge take none. Unset, the drawing is byte for byte as before. See `BoardOptions` and `docs/boards.md`.
   */
  board?: BoardOptions;
  /**
   * The pageant: each team's flag or logo laid large over its half (a `carpet`) or on a round disc (a `stage`), with an emblem in the centre. `"carpet"`, `"stage"`, `true` (a carpet) or `PageantOptions`.
   * Off by default; a score drawing only. See `PageantOptions`.
   */
  pageant?: PageantStyle | boolean | PageantOptions;
  /** A named look: the surface, the lines and the ground round it in one palette, light and dark. See `LOOKS`. Over the theme's colours, under `colors`. */
  look?: LookName;
  /** The width of the lines (see `LineWidth`): a multiple of the width they are drawn at, or an absolute width. */
  lineWidth?: LineWidth;
  /** Dash the painted lines (see `LineDash`). A line that is dashed by its rules (a free-throw circle) keeps its own dashes. */
  lineDash?: LineDash;
  /** The opacity of the painted lines, 0 to 1. */
  lineOpacity?: number;
  /** Colours by the name of a feature of the surface (`FEATURES[sport]`): `{ "blue-lines": "#1d4f91" }`. A name the sport does not have is an error that lists the names. */
  featureColors?: Readonly<Record<string, string>>;
  /** A function of your own that draws a goal: it is given where each goal stands (`GoalInfo`) and returns SVG markup in the drawing's wide frame, in place of the built-in goal. */
  goalMarkup?: (goal: GoalInfo) => string;
  /** An arrow for the end each team attacks, in the margin of the surface, with the teams' names or words of your own. */
  direction?: DirectionOptions;
  /** Axes with ticks along the surface's edges, in its own frame or a provider's. */
  axes?: AxesOptions;
  /** Label the parts of the surface in the margin (the blue lines, the three-point arc, the hog lines, the yard numbers...), for teaching. Words in `language`. */
  landmarks?: boolean;
  /**
   * Data on the surface: points, lines, arrows and text, in the surface's frame or a provider's. They are drawn over the markings (and
   * under a score's panel), cut to the surface's outline, and described in the drawing's description. See `drawLayers` and `layerTable`.
   */
  layers?: readonly Layer[];
  /**
   * Write what `clientPointToField` (the `pointer` entry) needs on the drawing's surface group: the box of the playing surface and the options that decide its rules (the league, the
   * season, the park, the pitch). Off by default, so that a drawing without data is the same text as ever; a page that asks where a click is turns it on.
   */
  pointer?: boolean;
  /** Write `data-mark-id`, `data-index` and `data-zone` on every mark of every data layer, for one listener to link a mark to a table (about 55 bytes a mark). Off by default; a layer whose data has an `id` has them anyway, and `pointer: true` turns them on. */
  marks?: boolean;
  /**
   * The situation of the game, drawn on the surface, in the badge and in the compact card: hockey's skaters (a power play or an empty net as a pill, the attacking zone tinted) and its
   * shootout as a strip of dots across centre ice; baseball's runners (the bases lit), outs, inning and count (a scorebug in the badge); football's down and distance (the line of scrimmage
   * in blue, the first-down line in yellow, the red zone tinted, a tag) and a drive chart. For `nhl`, `mlb`, and the football fields; any other sport, and a special game, draws none.
   * Off by default, and then the drawing is byte for byte as it was. See `docs/situation.md`.
   */
  situation?: Situation;
  /** `embed` (the default) writes the stylesheet into the drawing so that it stands alone; `none` leaves it to the page. */
  style?: "embed" | "none";
  /** An extra class on the `svg`. */
  className?: string;
  /** A `width` attribute for the `svg`. By default none, so that CSS decides. */
  width?: number | string;
  /** A `height` attribute for the `svg`. */
  height?: number | string;
}

/** The standard words of a status. `end-6` (or "End 6") is a curling end, `set-3` a set and `game-2` a game, `innings-2` (or "Innings 2") a cricket innings. Any other text is written as it is. */
export type StatusWord = "final" | "final-ot" | "final-so" | "final-aet" | "final-pens" | "live" | "half" | "extra-time" | "extra-end" | "penalties" | "postponed" | "tiebreak" | "match-tiebreak" | "retired" | "walkover";

/** What a score drawing takes beyond a surface. */
export interface ScoreOptions extends SurfaceOptions {
  home: Team;
  away: Team;
  /** `full` (the default), `compact` or `badge`. */
  size?: Size;
  /** The state of the game: a `StatusWord`, or text such as "2nd period" or "Bottom 9th". */
  status?: StatusWord | (string & {});
  /** The competition and round: "Cup Final, Game 7". */
  competition?: string;
  /** The date, as it is to be written. */
  date?: string;
  /** A line of text for the foot of the score in place of the status and the date. */
  label?: string;
  /** Who is emphasised: `auto` (the default) the leader of a finished game, `leader` the leader of any game, `none` nobody. */
  winner?: "auto" | "leader" | "none" | "home" | "away";
  /**
   * The side the home team is on. By default the sport's convention (`homeSideFor`): `left` (home first, "Home 2-1 Away") for soccer, rugby, Australian football, Gaelic games, field hockey, handball, cricket
   * and the international lacrosse leagues; `right` (away at home) for the North American leagues and the net sports. A value given here always wins.
   */
  homeSide?: Side;
  /** Write names in capitals. On by default. */
  uppercase?: boolean;
  /** The shape of both teams' marks, unless a team's own `mark` says otherwise: `plain` (the default) or `round`, a flag or logo in a circle with a ring. */
  markShape?: TeamMark;
  /**
   * Where the score goes: `centre` (the panel stands on the middle of the surface), `strip` (the compact strip under the drawing, as a pageant's `score: "strip"` does) or `auto` (the default:
   * the centre, unless the drawing has a `lineup` layer, whose players the panel would hide, and then the strip). The strip also carries the situation's pill, scorebug or tag, which a drawing
   * with a lineup then leaves off the surface. A pageant has its own `pageant.score`, which says it for the drawing.
   */
  score?: "auto" | "centre" | "strip";
  /** Draw the score's panel (or board) on the surface. On by default; `false` leaves the teams' names and the rest and no panel, as the 3D view does when it hangs the score up as a scoreboard. */
  plate?: boolean;
}
