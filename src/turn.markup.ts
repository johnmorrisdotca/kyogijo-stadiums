// The 3D view as markup: a box, and in it the floor (the flat drawing) and every plane that stands on it. Nothing is nested in 3D (no `preserve-3d`, no
// `perspective` on a parent): every element carries its whole place on the screen in one `matrix3d`, worked out here from the way the scene is looked at, and
// the elements are stacked far to near by `z-index`. A browser that cannot keep nested 3D layers (Safari on a phone can lose them) draws it as it is meant.
// The same text is what a page is given from `turnMarkup` and what the mount writes; the mount then makes it turn.
import { TURN_PRESET_NAMES, cameraMatrix, depthOf, eyeDistance, fit, matrix3d, multiply, presetOf, type Placement, type TurnView } from "./turn.camera.ts";
import { cross, facing, fadeOf, n, size, unit, type Plane } from "./turn.kit.ts";
import { buildTurn, turnWords, type TurnModel, type TurnSettings } from "./turn.model.ts";
import { KYOGIJO_TURN_STYLE } from "./turn.style.ts";
import { esc } from "./format.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

const px = (value: number): string => `${Math.round(value * 1000) / 1000}`;

/**
 * The matrix that stands a plane in the scene, before the camera: its x along `u`, its y along `v`, its corner `o`, in pixels from the middle of the scene
 * (`centre`, in feet).
 */
export function planeMatrix(p: Plane, scale: number, centre: readonly [number, number] = [0, 0]): number[] {
  const u = unit(p.u);
  const v = unit(p.v);
  const w = unit(cross(u, v));
  return [u[0], u[1], u[2], 0, v[0], v[1], v[2], 0, w[0], w[1], w[2], 0, (p.o[0] - centre[0]) * scale, (p.o[1] - centre[1]) * scale, p.o[2] * scale, 1];
}

/** Where everything is for a view in a container: the placement, the matrix of each element and its place in the stack. */
export interface Layout {
  at: Placement;
  /** The floor, then the planes in the model's order. */
  transforms: string[];
  /** The stack of each: 0 for the ground of a hall, 1 for the floor, then the planes far to near from 2. */
  stack: number[];
  /** How much of each is left: 1 for all but the walls that are between the eye and the surface, which are cut away as the view is low and on their side (`fadeOf`). */
  fade: number[];
}

/** Work a view out in a container `width` by `height` pixels. */
export function layoutOf(model: TurnModel, view: TurnView, width: number, height: number, lens?: number): Layout {
  const distance = eyeDistance(width, height, lens ?? model.lens);
  const at = fit(model.box, { ...view, zoom: 1 }, width, height, distance);
  const camera = cameraMatrix(view, at, distance);
  const s = model.scale;
  const centre = model.centre;
  const floor: Plane = { id: "floor", kind: "ground", o: [model.viewBox.x, model.viewBox.y, model.uprights.lift], u: [model.viewBox.w, 0, 0], v: [0, model.viewBox.h, 0], svg: "" };
  // A billboard faces the eye at this view.
  const planes = model.planes.map((p) => facing(p, view.yaw, view.pitch));
  const transforms = [floor, ...planes].map((p) => matrix3d(multiply(camera, planeMatrix(p, s, centre))));
  // Far to near: a plane's depth is that of its middle. The ground of a hall is under everything. The floor is next, unless it stands raised on something (a table tennis table's top, on its legs): then it is
  // sorted with the rest, by its middle, so that the legs and the skirt on the far side are drawn under it and the ones on the near side over it, and nothing under the top shows through it.
  const depth = (p: Plane): number => depthOf([(p.o[0] + (p.u[0] + p.v[0]) / 2 - centre[0]) * s, (p.o[1] + (p.u[1] + p.v[1]) / 2 - centre[1]) * s, (p.o[2] + (p.u[2] + p.v[2]) / 2) * s], view, at);
  const raised = model.uprights.lift > 0;
  const order = [...planes.map((p, i) => ({ i: i + 1, ground: p.kind === "ground", depth: depth(p) })), ...(raised ? [{ i: 0, ground: false, depth: depth(floor) }] : [])].filter((one) => !one.ground);
  order.sort((a, b) => a.depth - b.depth);
  const stack = new Array<number>(model.planes.length + 1).fill(0);
  stack[0] = 1;
  order.forEach((one, rank) => {
    stack[one.i] = rank + 2;
  });
  const fade = [1, ...model.planes.map((p) => fadeOf(p, view.yaw, view.pitch))];
  return { at, transforms, stack, fade };
}

/** One plane as an element: its box in pixels and the SVG drawn on it in feet. */
export function planeMarkup(p: Plane, scale: number, transform: string, stack: number, fade = 1): string {
  const [w, h] = size(p);
  return `<div class="ky-up ky-up-${p.kind}" data-part="${esc(p.id)}" style="width:${px(w * scale)}px;height:${px(h * scale)}px;transform:${transform};z-index:${stack}${fade < 1 ? `;opacity:${n(fade)}` : ""}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}" width="${px(w * scale)}" height="${px(h * scale)}" aria-hidden="true" focusable="false">${p.svg}</svg></div>`;
}

/**
 * A plane that is the floor's own drawing seen through its rectangle (`Plane.crop`): the floor's SVG again, its viewBox cut down to the plane's rectangle, in the plane's own box. It is a picture, not a second
 * description: it carries no role, title or description of its own.
 */
export function cropMarkup(model: TurnModel, p: Plane, transform: string, stack: number, fade = 1): string {
  const [w, h] = size(p);
  const box = `${px(p.o[0])} ${px(p.o[1])} ${px(w)} ${px(h)}`;
  const picture = model.floor
    .replace(/^<svg([^>]*?)\sviewBox="[^"]*"/, `<svg$1 viewBox="${box}"`)
    .replace(/^<svg([^>]*?)\swidth="[^"]*"/, "<svg$1")
    .replace(/^<svg([^>]*?)\sheight="[^"]*"/, "<svg$1")
    .replace(/^<svg([^>]*?)\srole="img"/, '<svg$1 aria-hidden="true"')
    .replace(/^<svg([^>]*?)\saria-labelledby="[^"]*"/, "<svg$1")
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>|<desc\b[^>]*>[\s\S]*?<\/desc>/g, "");
  return `<div class="ky-up ky-up-${p.kind}" data-part="${esc(p.id)}" data-crop="floor" style="width:${px(w * model.scale)}px;height:${px(h * model.scale)}px;transform:${transform};z-index:${stack}${fade < 1 ? `;opacity:${n(fade)}` : ""}">${picture}</div>`;
}

/** The floor as an element: the flat drawing, in the pixels of the scene. */
export function floorMarkup(model: TurnModel, transform: string, stack: number): string {
  const vb = model.viewBox;
  return `<div class="ky-turn-floor" style="width:${px(vb.w * model.scale)}px;height:${px(vb.h * model.scale)}px;transform:${transform};z-index:${stack}">${model.floor}</div>`;
}

/** The patterns the venue's planes are drawn with, once, in a box of no size: every plane's SVG reads them by id, and the crowd's colours are on this element. */
export function defsMarkup(model: TurnModel): string {
  return model.defs === "" ? "" : `<svg class="ky-turn-defs" xmlns="http://www.w3.org/2000/svg" width="0" height="0"${model.crowdStyle === "" ? "" : ` style="${esc(model.crowdStyle)}"`} aria-hidden="true" focusable="false"><defs>${model.defs}</defs></svg>`;
}

/**
 * The attributes of the element the planes stand in. A floor painted in a look (a dojo's mats) gets the drawing's own class, sport and look, so that the stylesheet's rules for the look set
 * its custom properties here too, and the walls and the wood of the room are the colours of the floor. A theme the options force goes with them.
 */
export function worldAttributes(model: TurnModel): string {
  const theme = (model.options as SurfaceOptions).theme;
  return model.look === undefined ? 'class="ky-turn-world"' : `class="ky-turn-world kyogijo" data-sport="${esc(model.look.sport)}" data-look="${esc(model.look.look)}"${theme === "light" || theme === "dark" ? ` data-theme="${theme}"` : ""}`;
}

/** The floor and the planes of a model, laid out. */
export function worldMarkup(model: TurnModel, layout: Layout): string {
  return defsMarkup(model) + floorMarkup(model, layout.transforms[0], layout.stack[0]) + model.planes.map((p, i) => (p.crop === true ? cropMarkup(model, p, layout.transforms[i + 1], layout.stack[i + 1], layout.fade[i + 1]) : planeMarkup(p, model.scale, layout.transforms[i + 1], layout.stack[i + 1], layout.fade[i + 1]))).join("");
}

/** The buttons under the view. */
export function controlsMarkup(model: TurnModel, view: TurnView, playing = false): string {
  const words = turnWords(model);
  const here = presetOf(view, model.presets ?? (model.options as SurfaceOptions).sport);
  const presets = TURN_PRESET_NAMES.map((name, i) => `<button type="button" data-preset="${name}" aria-pressed="${here === name}" aria-keyshortcuts="${i + 1}">${esc(words[name])}</button>`).join("");
  const tools: [string, string, string][] = [
    ["turn-left", "↺", words.turnLeft],
    ["turn-right", "↻", words.turnRight],
    ["raise", "↑", words.raise],
    ["lower", "↓", words.lower],
    ["zoom-in", "+", words.zoomIn],
    ["zoom-out", "−", words.zoomOut],
  ];
  const buttons = tools.map(([act, glyph, label]) => `<button type="button" data-act="${act}" aria-label="${esc(label)}" title="${esc(label)}">${glyph}</button>`).join("");
  // The auto-turn: a toggle named for what it is, pressed while the view turns; its glyph and tooltip say what pressing it does.
  const play = `<button type="button" data-act="play" data-wide aria-pressed="${playing}" aria-keyshortcuts="Space" title="${esc(playing ? words.playOff : words.playOn)}"><span data-glyph aria-hidden="true">${playing ? "❚❚" : "▶"}</span>${esc(words.play)}</button>`;
  return `<div class="ky-turn-controls"><div class="ky-turn-group" role="group" aria-label="${esc(words.group)}">${presets}</div><div class="ky-turn-group">${buttons}<button type="button" data-act="reset" aria-keyshortcuts="0 Home">${esc(words.reset)}</button>${play}</div></div>`;
}

/** The size, in pixels, the first view is worked out for. */
export const sizeOf = (settings: TurnSettings): { width: number; height: number } => settings.size ?? { width: 960, height: 600 };

/** The 3D view of a model as markup, laid out for `settings.size`; a page's script then makes it turn. */
export function turnMarkupOf(model: TurnModel, settings: TurnSettings = {}): string {
  const words = turnWords(model);
  const { width, height } = sizeOf(settings);
  const view = model.view;
  const layout = layoutOf(model, view, width, height, settings.lens);
  const keys = `${words.keys}${model.standing === "" ? "" : ` ${model.standing}`}`;
  const sheet = (model.options as SurfaceOptions).style === "none" ? "" : `<style>${KYOGIJO_TURN_STYLE}</style>`;
  const theme = (model.options as SurfaceOptions).theme;
  const sport = (model.options as SurfaceOptions).sport;
  return (
    `<div class="ky-turn" id="${esc(model.id)}" data-sport="${esc(String(sport))}" data-mode="3d" data-touch="${settings.touch === "turn" ? "turn" : "scroll"}" data-preset="${presetOf(view, model.presets ?? sport) ?? "custom"}"${theme === "light" || theme === "dark" ? ` data-theme="${theme}"` : ""} lang="${model.language}">` +
    sheet +
    `<div class="ky-turn-view" tabindex="0" role="group" aria-roledescription="${esc(words.region)}" aria-label="${esc(model.title)}" aria-describedby="${esc(model.id)}-help" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - 0 1 2 3 4 Home Space"><div ${worldAttributes(model)}>${worldMarkup(model, layout)}</div></div>` +
    `<p class="ky-turn-help" id="${esc(model.id)}-help">${esc(keys)}</p>` +
    (settings.controls === false ? "" : controlsMarkup(model, view)) +
    `<div class="ky-turn-live" role="status" aria-live="polite"></div>` +
    `</div>`
  );
}

/**
 * A surface as a 3D view, as markup: the flat drawing for a floor, what stands on it as planes, and the controls under it. Pure, so it can be made on a
 * server; it is a still picture until `mountKyogijoTurn` (or the element) makes it turn in a page.
 * @example
 * ```ts
 * import { turnMarkup } from "@johnmorrisdotca/kyogijo-stadiums/turn";
 * const html = turnMarkup({ sport: "volleyball" }, { preset: "end" });
 * console.log(html.includes("ky-turn"), html.includes('data-part="net"'));
 * // true true
 * ```
 */
export function turnMarkup(options: SurfaceOptions | ScoreOptions, settings: TurnSettings = {}): string {
  return turnMarkupOf(buildTurn(options, settings), settings);
}
