// The 3D view as data: the flat drawing that is its floor, what stands on it, and the sizes that put them in one scene. `buildTurn` works it all out from the
// drawing's own options, in Node or in a page; `turn.markup.ts` writes it as markup and `turn.dom.ts` makes it turn.
import { describe, drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { TURN_DEFAULT, clampView, presetView, type TurnPreset, type TurnView } from "./turn.camera.ts";
import type { Plane } from "./turn.kit.ts";
import { describeUprights, planesOf, uprightsFor, type UprightOptions, type Uprights } from "./uprights.ts";
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
  /** What a finger does on the view: `scroll` (the default) lets a vertical swipe scroll the page and a sideways one turn the view; `turn` keeps every touch for the view, which then also tips it. */
  touch?: "scroll" | "turn";
  /** `smooth` glides between viewpoints, `none` jumps; `auto` (the default) glides unless the reader prefers reduced motion. */
  motion?: "auto" | "smooth" | "none";
  /** The drawing the floor is, in place of `drawKyogijo`: a chart's `draw`, for instance. It is given the options with the view's own changes (the whole surface, lying wide). */
  floor?: (options: SurfaceOptions | ScoreOptions) => string;
  /** How long a lens the eye has, as a multiple of the view's longer side: 2.4 by default, and the larger it is the flatter the picture. */
  lens?: number;
  /** The size the first view is worked out for, in pixels, when the markup is made away from a page. 960 by 600 by default. */
  size?: { width: number; height: number };
  /** The prefix of the ids in the view, for a page with more than one. A hash of the options when missing. */
  id?: string;
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
  planes: Plane[];
  /** The whole scene in pixels, from its middle: the floor's rectangle, and the height of the highest thing. */
  box: Box3;
  /** The middle of the floor, in feet. */
  centre: [number, number];
  view: TurnView;
  /** False when there is nothing to turn: a badge is a strip, not a surface. */
  turnable: boolean;
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

/** The view a set of settings opens on. */
export const openingView = (settings: Pick<TurnSettings, "preset" | "view">, sport?: string): TurnView => clampView({ ...(presetView(settings.preset, sport) ?? presetView(TURN_DEFAULT, sport)!), ...settings.view });

/** Work out a 3D view from the options of a drawing. */
export function buildTurn(options: SurfaceOptions | ScoreOptions, settings: TurnSettings = {}): TurnModel {
  const o = floorOptions(options);
  const language: Language = o.language === "ja" ? "ja" : "en";
  const floor = settings.floor === undefined ? drawKyogijo(o) : settings.floor(o);
  const found = VIEWBOX.exec(floor);
  if (found === null) throw new Error("the floor of a 3D view must be an SVG with a viewBox");
  const [vx, vy, vw, vh] = found.slice(1).map(Number);
  const wanted = settings.uprights;
  const badge = (o as Partial<ScoreOptions>).size === "badge";
  const uprights: Uprights = wanted === false || badge ? { items: [], lift: 0, thin: 0.2 } : uprightsFor(o, wanted === true || wanted === undefined ? {} : wanted);
  const planes = planesOf(uprights);
  const scale = WORLD_PX / Math.max(vw, vh);
  const centre: [number, number] = [vx + vw / 2, vy + vh / 2];
  // The scene's extent: the playing surface (the whole floor where it has no uprights), and whatever stands beyond it (a net behind a goal line). The ground
  // round the surface is not counted, so that the view is fitted to what is played on and the ground runs out of the picture.
  const area = uprights.area ?? { x0: vx, y0: vy, x1: vx + vw, y1: vy + vh };
  let [x0, y0, x1, y1] = [area.x0, area.y0, area.x1, area.y1];
  let top = uprights.lift;
  for (const p of planes) {
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
      const point = [p.o[0] + a * p.u[0] + b * p.v[0], p.o[1] + a * p.u[1] + b * p.v[1], p.o[2] + a * p.u[2] + b * p.v[2]];
      if (p.kind !== "ground") {
        x0 = Math.min(x0, point[0]);
        x1 = Math.max(x1, point[0]);
        y0 = Math.min(y0, point[1]);
        y1 = Math.max(y1, point[1]);
      }
      top = Math.max(top, point[2]);
    }
  }
  const box: Box3 = { x0: (x0 - centre[0]) * scale, x1: (x1 - centre[0]) * scale, y0: (y0 - centre[1]) * scale, y1: (y1 - centre[1]) * scale, z0: 0, z1: top * scale };
  const { title, description } = describe(o);
  const standing = describeUprights(o, uprights, language);
  const id = settings.id ?? (typeof options.id === "string" && options.id !== "" ? `${options.id}-turn` : `ky-turn-${hash(JSON.stringify([options, settings.uprights, settings.preset]))}`);
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
    planes,
    box,
    centre,
    view: openingView(settings, (o as SurfaceOptions).sport),
    turnable: !badge,
  };
}

/** The words of the 3D view in the model's language. */
export const turnWords = (model: Pick<TurnModel, "language">): (typeof KYOGIJO_STRINGS)["en"]["turn"] => KYOGIJO_STRINGS[model.language].turn;
