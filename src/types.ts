import type { Background } from "./background.ts";
import type { Layer } from "./layers.types.ts";
import type { Unit } from "./units.ts";
import type { SoccerFrame, SoccerProviderId } from "./surfaces/soccer-providers.ts";
import type { SoccerPitchId, SoccerSize } from "./surfaces/soccer-spec.ts";
import type { Frame } from "./frames.ts";

/** The surfaces: three football fields, a rink, a court, a ballpark, a soccer pitch, a curling sheet and five net sports (tennis, volleyball, badminton, pickleball and table tennis). */
export type Sport = "nfl" | "cfl" | "ifaf" | "nhl" | "nba" | "mlb" | "soccer" | "curling" | "tennis" | "volleyball" | "badminton" | "pickleball" | "tabletennis";

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

/** A side of the drawing as the eye sees it. The away team is on the left unless `homeSide` says otherwise. */
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
 * How grass is mown: bands across the surface (the usual), wide ones or narrow ones, along it, in checks, on the diagonal, in rings round the
 * middle (`circles`), or `none`. A ballpark is mown in `rings` by default (arcs about home plate) and may also be mown in a `fan` (wedges out from
 * home plate). A football field and a ballpark take the same options as a soccer pitch; a surface that is not grass ignores them.
 */
export type StripePattern = "bands" | "wide" | "narrow" | "lengthwise" | "checks" | "diagonal" | "circles" | "rings" | "fan" | "none";

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
export type LookName = "grass" | "night" | "chalkboard" | "blueprint" | "print" | "broadcast" | "high-contrast";

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
}

/** How much of a curling sheet is shown: all of it, the half from the hog line to the back line, or just the house. */
export type SheetShow = "sheet" | "half" | "house";

/**
 * The parts of a surface a drawing can be cropped to (`range`). Football: `red-zone`, `between-the-20s`, `end-zone`, `field-of-play`, `own-half`, `opponent-half`.
 * Hockey: `offensive-zone`, `defensive-zone`, `neutral-zone`, `half`. Basketball: `half-court`, `paint`. Soccer: `half`, `final-third`, `defensive-third`, `middle-third`,
 * `penalty-area`. Baseball: `infield`, `outfield`. The net sports: `half-court`. Curling: `sheet`, `half`, `house`. `RANGES` lists them for each sport.
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
  | "house";

/** A named range at the end of your choice: `{ name: "offensive-zone", end: "left" }` is the offensive zone of a team that attacks the left. */
export interface RangeNamed {
  name: RangeName;
  /** The end of the surface the range is at, as the surface is drawn wide: `left` or `right`. Each range has its own default (`RANGES`); a range with no end ignores it. */
  end?: Side;
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
  /** How much of the sheet to show. A bare sheet only; a score always shows all of it. `sheet` by default. `range` says the same (`range: "house"`) and wins. */
  show?: SheetShow;
  /** Which end `show: "half"` and `show: "house"` show: the `left` one (the top house of a tall drawing, the default) or the `right`. */
  end?: "left" | "right";
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

/**
 * The look and the variants of a net sport's court (tennis, volleyball, badminton, pickleball, table tennis). Every part is optional.
 * The lines and the sizes are the rulebook's whatever the look; a look is the colour of the ground and of the surface.
 */
export interface NetStyle {
  /** A named look: for tennis `hard-blue` (the default), `hard-green`, `clay` or `grass`; volleyball `wood` (the default for indoors) or `blue`, and `sand` for the beach; badminton `green` (the default), `blue` or `wood`; pickleball `blue-green` (the default), `green` or `red`; table tennis `blue` (the default) or `green`. An unknown name is an error that lists them. */
  look?: string;
  /**
   * The free zone drawn round the court: `official` (the default: the figure a rulebook gives for its own competitions, where it gives one), `least` (the least it allows
   * or recommends) or `none`. Tennis (Appendix X), volleyball and beach volleyball (Rule 1.1) and pickleball (Rule 3.A.3) give figures; badminton and table tennis do not.
   */
  free?: "official" | "least" | "none";
  /** Tennis: draw the two singles sticks that hold a doubles net up for a singles match, 3 feet outside the singles court (Rule 1). Off by default. */
  sticks?: boolean;
}

/** One team of a score. */
export interface Team {
  /** The name, as it is to be written: "Harbour City Gulls". */
  name: string;
  /** A short form, three letters or so, for the score and the badge. Taken from the name when missing. */
  abbr?: string;
  /** The score. A number, or text such as "–" before the game. */
  score?: number | string;
  /** The logo: an `https:` or relative address, an image `data:` address, or an SVG document as text. */
  logo?: string;
  /** The goals it scored in a penalty shoot-out: shown with the status, and the winner of a level game. */
  penalties?: number | string;
  /** Curling: the points it scored in each end, in order (`null` for an end not played yet; `"X"` for a conceded one). */
  ends?: readonly (number | string | null | undefined)[];
  /** Curling: the team has the hammer, the last stone of the end. A marker is drawn beside its name. */
  hammer?: boolean;
  /** Tennis, volleyball, badminton, pickleball and table tennis: what it scored in each set (tennis: its games; pickleball and table tennis: each game's points), in order; `null` for one not played yet. The set in progress is the last one given. */
  sets?: readonly (number | string | null | undefined)[];
  /** Tennis: the points of a tie-break in each set (the same places as `sets`; `null` where the set had none), written small beside the games. */
  tiebreaks?: readonly (number | string | null | undefined)[];
  /** Tennis: the points of the game in progress: `0`, `15`, `30`, `40`, `Ad`, or the points of a tie-break. */
  points?: number | string;
  /** The team that is serving. A ball is drawn beside its name (and in the corner of its block on the badge). */
  serving?: boolean;
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
  /** The size and look of a curling sheet. */
  sheet?: SheetStyle;
  /** The look and the variants of a tennis, volleyball, badminton, pickleball or table tennis court. */
  net?: NetStyle;
  /** The soccer pitch: a preset (`fifa`, `uefa`, `mls`, `nwsl`, `ncaa`, `law-min`, `law-max`, `9-a-side`, `7-a-side`, `5-a-side`, `futsal`) or a size, `{ length, width, unit }`. The international 105 by 68 m by default. */
  pitch?: SoccerPitchId | SoccerSize;
  /** The soccer ground to draw: a key of `GROUNDS`. The pitch has the size its article publishes (the international 105 by 68 m where none is), and the drawing carries the ground's name for `year`. A `pitch` of your own wins over the ground's size. */
  ground?: string;
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
  /** `embed` (the default) writes the stylesheet into the drawing so that it stands alone; `none` leaves it to the page. */
  style?: "embed" | "none";
  /** An extra class on the `svg`. */
  className?: string;
  /** A `width` attribute for the `svg`. By default none, so that CSS decides. */
  width?: number | string;
  /** A `height` attribute for the `svg`. */
  height?: number | string;
}

/** The standard words of a status. `end-6` (or "End 6") is a curling end, `set-3` a set and `game-2` a game. Any other text is written as it is. */
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
  /** The side the home team is on. Right by default, as in a score line "away at home". */
  homeSide?: Side;
  /** Write names in capitals. On by default. */
  uppercase?: boolean;
}
