// The 3D view as data: the flat drawing that is its floor, what stands on it, and the sizes that put them in one scene. `buildTurn` works it all out from the
// drawing's own options, in Node or in a page; `turn.markup.ts` writes it as markup and `turn.dom.ts` makes it turn.
import { describe, drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { lengthUnit } from "./common.ts";
import { convertLength } from "./units.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { TURN_DEFAULT, clampView, presetView, type PresetTable, type TurnPreset, type TurnView } from "./turn.camera.ts";
import type { Plane } from "./turn.kit.ts";
import { describeUprights, planesOf, uprightsFor, type UprightOptions, type Uprights } from "./uprights.ts";
import { resolveCrowd } from "./crowd.ts";
import type { VenueBuild, VenueSettings } from "./venue.ts";
import type { UprightKind } from "./turn.kit.ts";
import type { Box3 } from "./turn.camera.ts";
import type { Language, ScoreOptions, SurfaceOptions } from "./types.ts";

/** What can be asked of a 3D view. */
export interface TurnSettings {
  /** The viewpoint it opens on: `overhead`, `broadcast`, `end` or `corner` (the default). */
  preset?: TurnPreset;
  /** An exact opening view, laid over the preset's. */
  view?: Partial<TurnView>;
  /** Whether the buttons under the view are drawn (a row of viewpoints, turn, raise, zoom and reset). True when left out; the keys and the pointer work either way. */
  controls?: boolean;
  /** What stands on the surface: `false` for the floor alone, or which kinds, whether the boards and the glass are drawn, the height of a volleyball net. True when left out. */
  uprights?: boolean | UprightOptions;
  /**
   * The venue round the surface, raised in 3D from the data the package already has: the stands of a drawing's `crowd` (every tier a strip of raked planes with the crowd on it, the walks between the tiers, a
   * ballpark's grandstands and the seats on top of its wall) and a dojo's room (its walls with their doors and windows, the dais, the banner, the balconies and the edge of the mats). `true` or `false`, or
   * `{ roof, detail }`. On when the drawing has a crowd or is a dojo, and off with `uprights: false`. The stands and the walls give way to the eye as the boards do, so that the surface is never hidden.
   */
  venue?: boolean | VenueSettings;
  /** Where the score of a score drawing goes: `board` (the default) hangs it up as a scoreboard that faces the eye (over the middle of a court or a rink, behind an end of a field, behind centre field in a ballpark) and takes the panel off the floor; `floor` leaves the panel on the floor. */
  score?: "board" | "floor";
  /** What a finger does on the view: `scroll` (the default) lets a vertical swipe scroll the page and a sideways one turn the view; `turn` keeps every touch for the view, which then also tips it. */
  touch?: "scroll" | "turn";
  /** `smooth` glides between viewpoints, `none` jumps; `auto` (the default) glides unless the reader prefers reduced motion. */
  motion?: "auto" | "smooth" | "none";
  /** The drawing the floor is, in place of `drawKyogijo`: a chart's `draw`, for instance. It is given the options with the view's own changes (the whole surface, lying wide). */
  floor?: (options: SurfaceOptions | ScoreOptions) => string;
  /** How long a lens the eye has, as a multiple of the view's longer side: 8 by default (`LENS`), and the larger it is the flatter the picture; a short lens makes the near end of a turning floor swell. */
  lens?: number;
  /** The size the first view is worked out for, in pixels, when the markup is made away from a page. 960 by 600 by default. */
  size?: { width: number; height: number };
  /** The prefix of the ids in the view, for a page with more than one. A hash of the options when missing. */
  id?: string;
  /**
   * The auto-turn, a trophy case's slow turn of the whole view: `true` starts it when the view is mounted (paused, if the reader prefers reduced motion), `"force"` starts it even then; left out, nothing moves until
   * the reader presses Play (or Space). It stops while the pointer holds the view and while the page is hidden, and the keys, the viewpoints and the reset stop it.
   */
  autoPlay?: boolean | "force";
  /** Degrees of yaw a second the auto-turn goes by: 12 by default, positive turning the near side to the right as a drag to the right does, negative the other way. */
  speed?: number;
  /** Called with `true` when the auto-turn starts and `false` when it stops, whatever stopped it. */
  onPlayChange?: (playing: boolean) => void;
  /** Called after the view has changed by a key, a button or the pointer, with the view and the viewpoint it is (`undefined` when it has been turned by hand). */
  onChange?: (view: TurnView, preset: TurnPreset | undefined) => void;
}

/** The pixels in one foot of the scene at a zoom of 1: the floor is drawn this big, and scaled down to fit. A larger floor is sharper. */
export const WORLD_PX = 1400;

/** Everything a 3D view is made of. */
export interface TurnModel {
  id: string;
  language: Language;
  /** The options the floor is drawn from: the whole surface, lying wide. */
  options: SurfaceOptions | ScoreOptions;
  title: string;
  /** What the drawing says, and then what stands on it. */
  description: string;
  /** The sentence about what stands on the surface, or an empty string. */
  standing: string;
  /** The floor: the markup of the flat drawing. */
  floor: string;
  /** The floor's viewBox in feet. */
  viewBox: { x: number; y: number; w: number; h: number };
  /** Pixels in a foot. */
  scale: number;
  uprights: Uprights;
  /** The patterns the venue's planes are drawn with, and the crowd's colours (custom properties) they read: both empty when the view has no venue. */
  defs: string;
  crowdStyle: string;
  /** Whether the venue is raised. */
  venue: boolean;
  /** The sport and look the floor is painted in, when it has one (a budō surface's mats): the planes of its room are painted in the same look. */
  look: { sport: string; look: string } | undefined;
  planes: Plane[];
  /** The whole scene in pixels, from its middle: the floor's rectangle, and the height of the highest thing. */
  box: Box3;
  /** The middle of the floor, in feet. */
  centre: [number, number];
  view: TurnView;
  /** False when there is nothing to turn: a badge is a strip, not a surface. */
  turnable: boolean;
  /** The four viewpoints, when the model has its own (a tournament layout's); the sport's when missing. */
  presets?: PresetTable;
  /** A lens of the model's own, as a multiple of the view's longer side, used when the settings give none: a scene that turns about a point far from some of what it shows wants a longer one, so that what swings toward the eye does not swell. */
  lens?: number;
  /** The flat drawing to show where the 3D view cannot be drawn, when it is not `drawKyogijo`'s of `options` (a tournament layout's). */
  flat?: string;
}

/** The options with what makes the floor of a 3D view: the whole surface, lying wide, at its full size. */
export function floorOptions(options: SurfaceOptions | ScoreOptions): SurfaceOptions | ScoreOptions {
  const rest: SurfaceOptions | ScoreOptions = { ...options, orientation: "landscape" };
  delete rest.range;
  delete rest.half;
  delete rest.aspect;
  return rest;
}

const VIEWBOX = /viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/;

/** The kinds of thing the venue makes. */
const VENUE_KINDS: readonly UprightKind[] = ["stands", "wall-seats", "roof", "gallery", "dais", "banner", "shrine", "mat-edge", "walls"];

/** The sport and look a floor drawing says it is painted in (`data-sport` and `data-look` on its root), for the planes round it to be painted in the same. */
function lookOf(floor: string): { sport: string; look: string } | undefined {
  const found = /^<svg[^>]*\sdata-sport="([\w-]+)" data-look="([\w-]+)"/.exec(floor);
  return found === null ? undefined : { sport: found[1], look: found[2] };
}

/** The crowd's colours and the sides' that the floor drawing sets on its root, for the venue's patterns (which stand outside that SVG) to read. */
function crowdVars(floor: string): string {
  const style = /^<svg[^>]*\sstyle="([^"]*)"/.exec(floor)?.[1];
  return style === undefined ? "" : style.split(";").filter((rule) => /^--ky-(cr-home|cr-away|left|right):/.test(rule)).join(";");
}

/** The view a set of settings opens on. */
export const openingView = (settings: Pick<TurnSettings, "preset" | "view">, sport?: string | PresetTable): TurnView => clampView({ ...(presetView(settings.preset, sport) ?? presetView(TURN_DEFAULT, sport)!), ...settings.view });

/**
 * The scene's extent in pixels from its middle: the area it is fitted to (in feet, in the drawing's frame) widened to take in every plane that is not the ground, and as high as the highest of them (or of `lift`, the height
 * of the floor itself).
 */
export function sceneBox(planes: readonly Plane[], area: { x0: number; y0: number; x1: number; y1: number }, lift: number, centre: readonly [number, number], scale: number): Box3 {
  let [x0, y0, x1, y1] = [area.x0, area.y0, area.x1, area.y1];
  let top = lift;
  for (const p of planes) {
    // A billboard turns about its middle: whichever way it faces, it lies within a circle as wide as it is.
    const reach = p.billboard === true ? (p.lean === true ? Math.hypot(...p.u, ...p.v) / 2 : Math.hypot(...p.u) / 2) : 0;
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
      const point = [p.o[0] + a * p.u[0] + b * p.v[0], p.o[1] + a * p.u[1] + b * p.v[1], p.o[2] + a * p.u[2] + b * p.v[2]];
      if (reach > 0) {
        const middle = [p.o[0] + (p.u[0] + p.v[0]) / 2, p.o[1] + (p.u[1] + p.v[1]) / 2];
        x0 = Math.min(x0, middle[0] - reach);
        x1 = Math.max(x1, middle[0] + reach);
        y0 = Math.min(y0, middle[1] - reach);
        y1 = Math.max(y1, middle[1] + reach);
        top = Math.max(top, point[2]);
        continue;
      }
      if (p.kind !== "ground") {
        x0 = Math.min(x0, point[0]);
        x1 = Math.max(x1, point[0]);
        y0 = Math.min(y0, point[1]);
        y1 = Math.max(y1, point[1]);
      }
      top = Math.max(top, point[2]);
    }
  }
  return { x0: (x0 - centre[0]) * scale, x1: (x1 - centre[0]) * scale, y0: (y0 - centre[1]) * scale, y1: (y1 - centre[1]) * scale, z0: 0, z1: top * scale };
}

/** Work out a 3D view from the options of a drawing. */
export function buildTurn(options: SurfaceOptions | ScoreOptions, settings: TurnSettings = {}): TurnModel {
  const asked = floorOptions(options);
  const language: Language = asked.language === "ja" ? "ja" : "en";
  const wanted = settings.uprights;
  const badge = (asked as Partial<ScoreOptions>).size === "badge";
  const upOptions: UprightOptions = wanted === false || wanted === true || wanted === undefined ? {} : wanted;
  const id = settings.id ?? (typeof options.id === "string" && options.id !== "" ? `${options.id}-turn` : `ky-turn-${hash(JSON.stringify([options, settings.uprights, settings.preset, settings.venue]))}`);
  // The venue is on when the drawing has a crowd or is a dojo (and when `uprights` has not asked for the floor alone), unless it is turned off; `venue: true` raises it whatever else is asked.
  const asks = settings.venue;
  const venueOn = asks === false || badge ? false : asks === undefined ? wanted !== false && (resolveCrowd((asked as SurfaceOptions).crowd) !== undefined || (asked as SurfaceOptions).sport === "dojo") : true;
  const venue: VenueBuild | undefined = venueOn ? { ...(typeof asks === "object" ? asks : {}), id } : undefined;
  const score = settings.score ?? upOptions.score;
  const uprights: Uprights = badge ? { items: [], lift: 0, thin: 0.2 } : wanted === false ? (venue === undefined ? { items: [], lift: 0, thin: 0.2 } : uprightsFor(asked, { only: VENUE_KINDS, venue })) : uprightsFor(asked, { ...upOptions, score, venue });
  // The score hung up as a scoreboard is not on the floor too.
  const boarded = uprights.items.some((item) => item.kind === "scoreboard");
  // The stands are raised, so the floor draws no crowd: it is the surface with ground enough round it for the stands to stand on.
  const crowdOpt = (asked as SurfaceOptions).crowd;
  const reach = uprights.reach;
  const margin = reach === undefined ? undefined : convertLength(reach, "ft", lengthUnit(asked as SurfaceOptions));
  const own = (asked as SurfaceOptions).margin;
  const base: SurfaceOptions | ScoreOptions = reach !== undefined && crowdOpt !== undefined && crowdOpt !== false ? { ...asked, crowd: undefined, margin: Math.max(margin ?? 0, typeof own === "number" && Number.isFinite(own) ? own : 0) } : asked;
  const o: SurfaceOptions | ScoreOptions = boarded ? { ...base, plate: false, size: (asked as Partial<ScoreOptions>).size === "compact" ? "full" : (asked as Partial<ScoreOptions>).size } : base;
  const floor = settings.floor === undefined ? drawKyogijo(o) : settings.floor(o);
  const found = VIEWBOX.exec(floor);
  if (found === null) throw new Error("the floor of a 3D view must be an SVG with a viewBox");
  const [vx, vy, vw, vh] = found.slice(1).map(Number);
  const planes = planesOf(uprights);
  const scale = WORLD_PX / Math.max(vw, vh);
  const centre: [number, number] = [vx + vw / 2, vy + vh / 2];
  // The scene's extent: the playing surface (the whole floor where it has no uprights), and whatever stands beyond it (a net behind a goal line). The ground
  // round the surface is not counted, so that the view is fitted to what is played on and the ground runs out of the picture.
  const area = uprights.whole === true || uprights.area === undefined ? { x0: vx, y0: vy, x1: vx + vw, y1: vy + vh } : uprights.area;
  const box = sceneBox(planes, area, uprights.lift, centre, scale);
  const { title, description } = describe(o);
  const standing = describeUprights(o, uprights, language);
  return {
    id,
    language,
    options: o,
    title,
    description: standing === "" ? description : `${description} ${standing}`,
    standing,
    floor,
    viewBox: { x: vx, y: vy, w: vw, h: vh },
    scale,
    uprights,
    defs: uprights.defs ?? "",
    // The colours the crowd has in the flat drawing (which the floor no longer carries) are read from a small drawing of the same options.
    crowdStyle: uprights.defs === undefined ? "" : crowdVars(drawKyogijo({ ...asked, size: "badge", style: "none" } as unknown as SurfaceOptions)),
    venue: venue !== undefined,
    look: lookOf(floor),
    planes,
    box,
    centre,
    view: openingView(settings, (o as SurfaceOptions).sport),
    turnable: !badge,
  };
}

/** The words of the 3D view in the model's language. */
export const turnWords = (model: Pick<TurnModel, "language">): (typeof KYOGIJO_STRINGS)["en"]["turn"] => KYOGIJO_STRINGS[model.language].turn;
