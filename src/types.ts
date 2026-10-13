import type { Unit } from "./units.ts";
import type { SoccerFrame, SoccerProviderId } from "./surfaces/soccer-providers.ts";
import type { SoccerPitchId, SoccerSize } from "./surfaces/soccer-spec.ts";

/** The surfaces: three football fields, a rink, a court, a ballpark and a soccer pitch. */
export type Sport = "nfl" | "cfl" | "ifaf" | "nhl" | "nba" | "mlb" | "soccer";

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

/** How much of the surface's markings are drawn. `simple` leaves out the small ones, such as hash marks. */
export type Detail = "full" | "simple";

/** How a soccer pitch is mown: bands across the pitch (the usual 19, or 9 wide, or 39 narrow), along it, in checks, or on the diagonal. */
export type StripePattern = "bands" | "wide" | "narrow" | "lengthwise" | "checks" | "diagonal" | "none";

/** How a soccer goal is drawn, seen from above: the net as a box behind the goal line, a line on it, a solid strip, or not at all. */
export type GoalStyle = "box" | "line" | "strip" | "none";

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
  /** The ballpark of an MLB drawing: a key of `PARKS`, or `generic` (the default) for a typical field. */
  park?: string;
  /** The season of a past park's fence, for a park whose fence moved (`polo-grounds` in 1915): a year in one of its `periods`, else its last fence. */
  year?: number;
  /** Fence distances of an MLB drawing, in `units`, over the park's. */
  fence?: Partial<Fence>;
  /** The look of an NBA court. */
  court?: CourtStyle;
  /** The soccer pitch: a preset (`fifa`, `uefa`, `mls`, `nwsl`, `ncaa`, `law-min`, `law-max`, `9-a-side`, `7-a-side`, `5-a-side`, `futsal`) or a size, `{ length, width, unit }`. The international 105 by 68 m by default. */
  pitch?: SoccerPitchId | SoccerSize;
  /** Draw a soccer pitch in a data provider's own coordinates (`opta`, `statsbomb`, `wyscout`, `tracab`, `metrica`, `skillcorner`, `secondspectrum`, `impect`, `uefa`, `international`), or in a frame of your own: the lines stand where the provider puts them, and an empty `ky-data` group in its units is put in the drawing for raw data. */
  pitchType?: SoccerProviderId | SoccerFrame;
  /** Only half of a soccer pitch: the `left` half or the `right` one. Ignored when the drawing has teams. */
  half?: "left" | "right";
  /** How the grass of a soccer pitch is mown. `bands` (the usual) by default; `stripes: false` turns it off. */
  stripePattern?: StripePattern;
  /** How the goals of a soccer pitch are drawn. `box` by default. */
  goals?: GoalStyle;
  /** Corner flags on a soccer pitch. On by default in the `full` detail. */
  cornerFlags?: boolean;
  /** `embed` (the default) writes the stylesheet into the drawing so that it stands alone; `none` leaves it to the page. */
  style?: "embed" | "none";
  /** An extra class on the `svg`. */
  className?: string;
  /** A `width` attribute for the `svg`. By default none, so that CSS decides. */
  width?: number | string;
  /** A `height` attribute for the `svg`. */
  height?: number | string;
}

/** The standard words of a status. Any other text is written as it is. */
export type StatusWord = "final" | "final-ot" | "final-so" | "final-aet" | "final-pens" | "live" | "half" | "extra-time" | "penalties" | "postponed";

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
