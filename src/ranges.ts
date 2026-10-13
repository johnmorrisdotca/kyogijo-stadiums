// Ranges: the part of a surface a drawing is cropped to, as sportypy's `display_range` and hockey_rink's partial rinks do it, for every sport: a named part (the offensive zone
// of a rink, a half court, the red zone, the penalty area, the infield, a curling house), or a box of your own in the drawing's frame or any registered one. The viewBox is cut to the
// range with a small margin, the data and the heat of the layers are cut to it, the annotations stand against what is shown, and a score's panel is put inside it (or under it, as a strip,
// when the range is too small to hold one). The names, and where each part of a surface lies, are the builders' own (`Surface.ranges`): the code here only chooses, crops and fits.
// Written for this package; sportypy and hockey_rink were read for the idea and nothing of either is used.
import { wideView } from "./annotate.ts";
import { lengthUnit } from "./common.ts";
import { el, num } from "./format.ts";
import { toSurface } from "./frames.ts";
import "./frames.providers.ts";
import { parseRange, type ParsedRange } from "./ranges.names.ts";
import { frameSizeOf } from "./outline.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.ts";
import { quarterTurn, type Surface } from "./surfaces/surface.ts";
import type { Box, Language, Side, SurfaceOptions } from "./types.ts";
import { convertLength } from "./units.ts";

const round = (value: number): string => String(Math.round(value * 100) / 100);

/**
 * The sentences a range adds to a drawing's description: what is shown, and, when the drawing has data, that data outside it is not drawn. Empty without a range.
 */
export function describeRange(o: Pick<SurfaceOptions, "sport" | "league" | "range">, language: Language, hasData: boolean): string {
  const parsed = parseRange(o);
  if (parsed === undefined) return "";
  const words = KYOGIJO_STRINGS[language].ranges;
  const side = (end: Side): string => KYOGIJO_STRINGS[language].notes[end];
  let text: string;
  if (parsed.kind === "name") {
    const name = words.names[parsed.name];
    text = parsed.end === undefined ? fill(words.shows, { name }) : fill(words.showsEnd, { name, side: side(parsed.end) });
  } else {
    const { x0, x1, y0, y1, frame } = parsed.box;
    const numbers = { x0: round(Math.min(x0, x1)), x1: round(Math.max(x0, x1)), y0: round(Math.min(y0, y1)), y1: round(Math.max(y0, y1)) };
    text = frame === undefined ? fill(words.box, numbers) : fill(words.boxFrame, { ...numbers, frame: typeof frame === "string" ? frame : frame.name });
  }
  const gap = KYOGIJO_STRINGS[language].said.gap;
  return `${gap}${text}${hasData ? `${gap}${words.cut}` : ""}`;
}

/** The part of a drawing's `range` that is a name or "custom", for the root's `data-range`. */
export function rangeLabel(o: Pick<SurfaceOptions, "sport" | "league" | "range">): string | undefined {
  const parsed = parseRange(o);
  return parsed === undefined ? undefined : parsed.kind === "name" ? parsed.name : "custom";
}

/** How much of the surface's ground the cut of a range leaves beyond a line it passes through, so that the line is whole, in feet. */
const CUT = 0.8;
/** A range's edge this close to the surface's is the surface's. */
const NEAR = 0.01;

type Wide = { x: number; y: number; w: number; h: number };

const intersect = (a: Wide, b: Wide): Wide => {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

/** The box of a range in the surface's wide frame, in feet. */
function boxOf(parsed: ParsedRange, surface: Surface, whole: Wide, o: Pick<SurfaceOptions, "sport" | "league" | "units">): Wide | undefined {
  if (parsed.kind === "name") {
    const found = surface.ranges?.[parsed.name];
    if (found === undefined) return undefined;
    return "left" in found ? found[parsed.end ?? "left"] : found;
  }
  const { x0, x1, y0, y1, frame, attacking } = parsed.box;
  let corners: [number, number][];
  if (frame === undefined) {
    const unit = lengthUnit(o);
    corners = [[x0, y0], [x1, y1]].map(([x, y]): [number, number] => [convertLength(x, unit, "ft"), convertLength(y, unit, "ft")]);
  } else {
    // The frame's numbers, placed on the surface as a layer's are (the frame fitted to a surface of any size), and the box round the corners, which a frame that swaps or turns the axes may have moved.
    corners = toSurface([[x0, y0], [x1, y0], [x0, y1], [x1, y1]], { from: frame, units: "ft", size: frameSizeOf(o, whole), attacking });
  }
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/** What the margin and the panel of a score ask of the crop. */
export interface CropOptions {
  /** A prefix for ids. */
  id: string;
  /** The ground the annotations need all round the part that is shown, in feet; the cut's own when missing. */
  margin?: number;
  /** True when the drawing has its score's panel on the surface, which must then fit in what is shown. */
  panel: boolean;
}

/** The least share of its size a score's panel is shrunk to before the score goes to the strip under the drawing. */
const PANEL_LEAST = 0.55;

/**
 * Crop a surface to the range the options ask for. The surface's view becomes the range with a small margin (the surface's own ground where the range reaches its edge, a little
 * beyond the line where it is cut), `box` the part of the playing surface that is shown (`whole` the playing surface), and, when the annotations ask for room, the ground beyond the cut
 * is the apron's and the surface is clipped to the range. A score's panel is moved into what is shown and made smaller if it needs to be; when it would be too small, `plateFits` says
 * false and the caller draws the score as a strip. A curling sheet is cropped by its own builder (`sheet.show`), and its named ranges are that.
 * @throws RangeError when the range lies wholly outside the drawing.
 */
export function cropToRange(surface: Surface, o: Pick<SurfaceOptions, "sport" | "league" | "range" | "units">, crop: CropOptions): Surface {
  const parsed = parseRange(o);
  const whole = surface.box;
  if (parsed === undefined || whole === undefined) return surface;
  const wide = boxOf(parsed, surface, whole, o);
  // The named ranges of a curling sheet are the builder's own (`show`).
  if (wide === undefined) return surface;
  const full = wideView(surface);
  const visible = intersect(wide, full);
  if (!(visible.w > 0 && visible.h > 0)) throw new RangeError("The range lies outside the surface");
  const shown = ((): Wide => {
    const inside = intersect(wide, whole);
    return inside.w > 0 && inside.h > 0 ? inside : visible;
  })();
  // The cut: the surface's own ground on a side where the range reaches the surface's edge, a little beyond the line on a side where it does not.
  const want = crop.margin !== undefined && crop.margin > CUT ? crop.margin : CUT;
  const x0 = wide.x <= whole.x + NEAR;
  const y0 = wide.y <= whole.y + NEAR;
  const x1 = wide.x + wide.w >= whole.x + whole.w - NEAR;
  const y1 = wide.y + wide.h >= whole.y + whole.h - NEAR;
  const cutX0 = x0 ? full.x : Math.max(full.x, visible.x - CUT);
  const cutY0 = y0 ? full.y : Math.max(full.y, visible.y - CUT);
  const cutX1 = x1 ? full.x + full.w : Math.min(full.x + full.w, visible.x + visible.w + CUT);
  const cutY1 = y1 ? full.y + full.h : Math.min(full.y + full.h, visible.y + visible.h + CUT);
  const room = want - CUT;
  const view: Wide = {
    x: x0 ? cutX0 : Math.max(full.x, cutX0 - room),
    y: y0 ? cutY0 : Math.max(full.y, cutY0 - room),
    w: 0,
    h: 0,
  };
  view.w = (x1 ? cutX1 : Math.min(full.x + full.w, cutX1 + room)) - view.x;
  view.h = (y1 ? cutY1 : Math.min(full.y + full.h, cutY1 + room)) - view.y;
  surface.whole = whole;
  surface.ground = whole.y - full.y;
  surface.room = want;
  surface.cut = { x: cutX0, y: cutY0, w: cutX1 - cutX0, h: cutY1 - cutY0 };
  surface.box = shown;
  if (surface.turned) {
    const turned = quarterTurn(view);
    surface.view = turned.view;
    surface.turn = turned.turn;
  } else surface.view = view;
  // Room beyond the cut for the annotations shows more of the surface than the range: paint the apron there and clip the surface to the cut.
  if (room > 0.01) {
    const clip = `${crop.id}-rg`;
    const cut = el("clipPath", { id: clip }, el("rect", { x: num(cutX0), y: num(cutY0), width: num(cutX1 - cutX0), height: num(cutY1 - cutY0) }));
    const ground = el("rect", { class: surface.sport === "mlb" ? "ky-foul" : "ky-apron", x: num(view.x), y: num(view.y), width: num(view.w), height: num(view.h) });
    surface.defs += cut;
    surface.base = `${ground}${el("g", { "clip-path": `url(#${clip})` }, surface.base)}`;
    surface.lines = el("g", { "clip-path": `url(#${clip})` }, surface.lines);
  }
  if (crop.panel) fitPanel(surface, shown);
  return surface;
}

/** Put a score's panel inside the part of the surface that is shown, smaller if it needs to be; `plateFits` says false when it would have to be smaller than `PANEL_LEAST`. */
function fitPanel(surface: Surface, shown: Wide): void {
  const spot = surface.plate;
  // The panel's width and height are the eye's; when the drawing is turned a quarter they are the surface's height and width.
  const sw = surface.turned ? spot.h : spot.w;
  const sh = surface.turned ? spot.w : spot.h;
  const scale = Math.min(1, (0.8 * shown.w) / sw, (0.8 * shown.h) / sh, Math.sqrt((0.35 * shown.w * shown.h) / (sw * sh)));
  if (!(scale >= PANEL_LEAST)) {
    surface.plateFits = false;
    return;
  }
  const w = sw * scale;
  const h = sh * scale;
  const pad = 0.04 * Math.min(shown.w, shown.h);
  const cx = Math.min(Math.max(spot.cx, shown.x + w / 2 + pad), shown.x + shown.w - w / 2 - pad);
  const cy = Math.min(Math.max(spot.cy, shown.y + h / 2 + pad), shown.y + shown.h - h / 2 - pad);
  surface.plate = { cx, cy, w: spot.w * scale, h: spot.h * scale };
}

/** True when a team's place (a banner's) is in the part of the drawing that is shown: always without a range. */
export function shows(surface: Surface, zone: { cx: number; cy: number }): boolean {
  if (surface.whole === undefined) return true;
  const v = wideView(surface);
  return zone.cx >= v.x && zone.cx <= v.x + v.w && zone.cy >= v.y && zone.cy <= v.y + v.h;
}

/** The part of the playing surface that is shown, in feet in the drawing's frame, when the drawing is cropped to a range; `undefined` when it is not. */
export function shownBox(surface: Surface): Box | undefined {
  return surface.whole === undefined ? undefined : surface.box;
}
