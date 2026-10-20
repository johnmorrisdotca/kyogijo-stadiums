// A board laid over a drawing: a results board, a bout presentation, a medal table, drawn by anything else as an SVG (Taisen Brackets', say) and placed here, over the surface, in 2D (`board` in the drawing's
// options) and in 3D (`board` in the options of the 3D view, where it is a screen-space overlay over the view and never a plane that turns). The package takes the board as a string and draws no board of its own and
// reads nothing from the one it is given but its size: it is written as an image, which cannot run scripts, scaled evenly (its own shape is kept, so no letter is ever stretched), and placed by a named position
// that keeps the middle of the surface clear, or by a point of the caller's choosing. Pure: the same options always give the same string.
import { safePicture } from "./colour.ts";
import { el, esc, num } from "./format.ts";

/** Where a board goes. `top` and `bottom` are centred on the drawing's top and bottom edge, `side` is at the right edge, centred, `left` the same at the left, `corner` is the top right corner, and the four corners by their names. */
export type BoardPosition = "top" | "bottom" | "side" | "left" | "corner" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** A place of your own: the board's top left corner (or, with `anchor: "center"`, its middle) at this share of the drawing's width (`x`) and height (`y`), 0 to 1. The board may then cover the middle of the surface: you asked for it. */
export interface BoardPoint {
  x: number;
  y: number;
  anchor?: "start" | "center";
}

/** A board over a drawing. */
export interface BoardOptions {
  /** The board, as SVG text (`<svg …>…</svg>`): the string `resultsBoard`, `boutBoard` or `broadcastMedalTable` of Taisen Brackets gives. It is written as an image, so nothing in it can run and its styles stay in it. Anything else is ignored. */
  svg: string;
  /** The board's own width and height, the numbers its maker gives (`resultsBoardSize`, `boutBoardSize`, `broadcastMedalSize`): they give its shape. Left out, the `viewBox` of the SVG is read. A board with no size is ignored. */
  width?: number;
  height?: number;
  /** Where it goes: a name (`BOARD_POSITIONS`) or a point of your own. `top` by default. */
  position?: BoardPosition | BoardPoint;
  /** How opaque it is, 0 to 1. 1 by default. */
  opacity?: number;
  /** Its width as a share of the drawing's width, 0.1 to 1. By default 0.5 at the top and the bottom, 0.3 at a side and 0.36 in a corner, and 0.4 at a point; a board is never made larger than the room that keeps the middle of the surface clear. */
  share?: number;
  /** The gap between the board and the edge of the drawing, as a share of the drawing's width, 0 to 0.2. 0.02 by default. */
  margin?: number;
  /** Let a named position cover the middle of the surface, so that the board may be as large as `share` says (it is still kept inside the drawing). Off by default. */
  cover?: boolean;
  /** What the board says, in a sentence, for a reader who cannot see it: its title and who leads, say. Without it the board is hidden from assistive technology (it is a picture of what the page says elsewhere). */
  label?: string;
}

/** A board that has been read: sizes and places that can be used, and the picture as an address. */
export interface ResolvedBoard {
  href: string;
  width: number;
  height: number;
  position: BoardPosition | { x: number; y: number; anchor: "start" | "center" };
  opacity: number;
  share: number;
  margin: number;
  cover: boolean;
  label: string | undefined;
}

/** A box: a drawing's viewBox, or the place a board takes in it. */
export interface BoardBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The positions, in the order a menu lists them. */
export const BOARD_POSITIONS: readonly BoardPosition[] = ["top", "bottom", "side", "left", "corner", "top-left", "top-right", "bottom-left", "bottom-right"];

/** The share of a drawing's width and of its height that is kept clear round its middle: a board placed by name does not reach into it, so the middle of the playing area, where the score's panel stands, is never covered. */
export const BOARD_CLEAR = 0.34;

/** The shape of the box a 3D view is placed for (16 by 10, the view's own) and the units of it: a board in 3D is placed for this box and keeps its place, as a share of the box, when the box is another shape. */
export const BOARD_TURN_BOX: BoardBox = { x: 0, y: 0, w: 1600, h: 1000 };

const MAX_SIZE = 100_000;
const isPosition = (value: unknown): value is BoardPosition => typeof value === "string" && (BOARD_POSITIONS as readonly string[]).includes(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const between = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/** The width and height of an SVG document's root, from its `viewBox`. */
function viewBoxOf(svg: string): { width: number; height: number } | undefined {
  const root = /^\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg\b[^>]*>/i.exec(svg)?.[0];
  const box = root === undefined ? undefined : /\sviewBox\s*=\s*"\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/i.exec(root);
  if (box === undefined || box === null) return undefined;
  const [width, height] = [Number(box[3]), Number(box[4])];
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? { width, height } : undefined;
}

const defaultShare = (position: ResolvedBoard["position"]): number => {
  if (typeof position === "object") return 0.4;
  if (position === "top" || position === "bottom") return 0.5;
  if (position === "side" || position === "left") return 0.3;
  return 0.36;
};

/** The board an option asks for, read: a bad one is `undefined` and the drawing is as it was without it, as a bad `background` image is. */
export function resolveBoard(value: unknown): ResolvedBoard | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const o = value as Partial<BoardOptions>;
  if (typeof o.svg !== "string" || !/^\s*(?:<\?xml|<svg)\b/i.test(o.svg)) return undefined;
  const href = safePicture(o.svg);
  if (href === undefined) return undefined;
  const own = viewBoxOf(o.svg);
  const width = finite(o.width) && o.width > 0 ? o.width : own?.width;
  const height = finite(o.height) && o.height > 0 ? o.height : own?.height;
  if (width === undefined || height === undefined || width > MAX_SIZE || height > MAX_SIZE) return undefined;
  let position: ResolvedBoard["position"] = "top";
  const asked: unknown = o.position;
  if (isPosition(asked)) position = asked;
  else if (typeof asked === "object" && asked !== null && finite((asked as BoardPoint).x) && finite((asked as BoardPoint).y)) {
    const point = asked as BoardPoint;
    position = { x: between(point.x, 0, 1), y: between(point.y, 0, 1), anchor: point.anchor === "center" ? "center" : "start" };
  }
  const label = typeof o.label === "string" && o.label.trim() !== "" ? o.label.trim().slice(0, 300) : undefined;
  return {
    href,
    width,
    height,
    position,
    opacity: finite(o.opacity) ? between(o.opacity, 0, 1) : 1,
    share: finite(o.share) ? between(o.share, 0.1, 1) : defaultShare(position),
    margin: finite(o.margin) ? between(o.margin, 0, 0.2) : 0.02,
    cover: o.cover === true,
    label,
  };
}

/** Where a named position stands: which edge it keeps to on each axis. */
function edges(position: BoardPosition): { v: "top" | "bottom" | "middle"; h: "left" | "right" | "centre" } {
  switch (position) {
    case "top":
      return { v: "top", h: "centre" };
    case "bottom":
      return { v: "bottom", h: "centre" };
    case "side":
      return { v: "middle", h: "right" };
    case "left":
      return { v: "middle", h: "left" };
    case "corner":
    case "top-right":
      return { v: "top", h: "right" };
    case "top-left":
      return { v: "top", h: "left" };
    case "bottom-left":
      return { v: "bottom", h: "left" };
    case "bottom-right":
      return { v: "bottom", h: "right" };
  }
}

/**
 * The place a board takes in a box. A named position keeps to its edge and takes the share asked for, unless that would reach into the middle (`BOARD_CLEAR` of the box's width and height, centred): then the board is made smaller, down
 * to nothing in a box too small to hold one, and never moved. `cover` lifts that, and a point of your own is never held to it. The board keeps its own shape, and stays inside the box.
 */
export function placeBoard(board: ResolvedBoard, view: BoardBox): BoardBox {
  const ratio = board.width / board.height;
  const gap = board.margin * view.w;
  const inner = { x0: view.x + gap, y0: view.y + gap, x1: view.x + view.w - gap, y1: view.y + view.h - gap };
  const innerW = Math.max(0, inner.x1 - inner.x0);
  const innerH = Math.max(0, inner.y1 - inner.y0);
  const wanted = board.share * view.w;
  const point = board.position;
  if (typeof point === "object") {
    const w = Math.max(0, Math.min(wanted, view.w, view.h * ratio));
    const h = w / ratio;
    const x = view.x + point.x * view.w - (point.anchor === "center" ? w / 2 : 0);
    const y = view.y + point.y * view.h - (point.anchor === "center" ? h / 2 : 0);
    return { x: between(x, view.x, view.x + view.w - w), y: between(y, view.y, view.y + view.h - h), w, h };
  }
  const { v, h: side } = edges(point);
  const clear = { x0: view.x + view.w * (0.5 - BOARD_CLEAR / 2), x1: view.x + view.w * (0.5 + BOARD_CLEAR / 2), y0: view.y + view.h * (0.5 - BOARD_CLEAR / 2), y1: view.y + view.h * (0.5 + BOARD_CLEAR / 2) };
  let room = Math.min(innerW, innerH * ratio);
  if (!board.cover) {
    // Beside the middle (to its right, or to its left) and above or below it: how wide the board may be in each.
    const beside = side === "right" ? inner.x1 - (clear.x1 + gap) : side === "left" ? clear.x0 - gap - inner.x0 : 0;
    const above = v === "top" ? clear.y0 - gap - inner.y0 : v === "bottom" ? inner.y1 - (clear.y1 + gap) : 0;
    if (v === "middle") room = Math.min(beside, innerH * ratio);
    else if (side === "centre") room = Math.min(above * ratio, innerW);
    else room = Math.max(Math.min(beside, innerH * ratio), Math.min(above * ratio, innerW));
  }
  const w = Math.max(0, Math.min(wanted, room));
  const h = w / ratio;
  const x = side === "left" ? inner.x0 : side === "right" ? inner.x1 - w : view.x + (view.w - w) / 2;
  const y = v === "top" ? inner.y0 : v === "bottom" ? inner.y1 - h : view.y + (view.h - h) / 2;
  return { x, y, w, h };
}

/** The name a position goes by in the markup. */
const positionName = (board: ResolvedBoard): string => (typeof board.position === "object" ? "custom" : board.position);

/** The board as markup in a drawing: an image in the box `placeBoard` gave, in the drawing's own units, over everything else. Nothing for a box with no room. */
export function overlayMarkup(board: ResolvedBoard, box: BoardBox): string {
  if (!(box.w > 0) || !(box.h > 0)) return "";
  return el(
    "g",
    {
      class: "ky-board",
      "data-position": positionName(board),
      opacity: board.opacity < 1 ? board.opacity : undefined,
      "pointer-events": "none",
      role: board.label === undefined ? undefined : "img",
      "aria-label": board.label,
      "aria-hidden": board.label === undefined ? "true" : undefined,
    },
    el("image", { class: "ky-board-img", href: board.href, x: box.x, y: box.y, width: box.w, height: box.h, preserveAspectRatio: "xMidYMid meet" }),
  );
}

/**
 * The 3D view's board: a layer over the whole view (not in the scene, so it never turns, tips or zooms with it), and in it the picture at its size as a share of the view's width, its own shape kept (`height:auto`, `object-fit:contain`),
 * placed by flex alignment on the view's edges. Its largest height is what the box `BOARD_TURN_BOX` gives it, so that on a wider view than that it still does not reach into the middle. It never takes the pointer: a drag on it turns the view.
 */
export function turnBoardMarkup(board: ResolvedBoard): string {
  const box = placeBoard(board, BOARD_TURN_BOX);
  if (!(box.w > 0)) return "";
  const percent = (n: number): string => `${num(Math.round(n * 1000) / 10)}%`;
  const style = [`width:${percent(box.w / BOARD_TURN_BOX.w)}`, `max-height:${percent(box.h / BOARD_TURN_BOX.h)}`];
  if (typeof board.position === "object") {
    style.push("position:absolute", `left:${percent(board.position.x)}`, `top:${percent(board.position.y)}`, "margin:0");
    if (board.position.anchor === "center") style.push("translate:-50% -50%");
  } else style.push(`margin:${percent(board.margin)}`);
  if (board.opacity < 1) style.push(`opacity:${num(board.opacity)}`);
  const attributes = `class="ky-turn-board" data-position="${positionName(board)}"${board.label === undefined ? ' aria-hidden="true"' : ` role="img" aria-label="${esc(board.label)}"`}`;
  return `<div ${attributes}><img class="ky-turn-board-img" src="${esc(board.href)}" alt="" width="${num(board.width)}" height="${num(board.height)}" style="${style.join(";")}"></div>`;
}

/** The rules of the 3D view's board layer, written into `KYOGIJO_TURN_STYLE`. */
export const KYOGIJO_TURN_BOARD_STYLE = `
.ky-turn-board{position:absolute;inset:0;z-index:var(--ky-turn-board-z,9999);display:flex;pointer-events:none;overflow:hidden}
.ky-turn-board-img{display:block;height:auto;object-fit:contain;flex:none;min-width:0}
.ky-turn-board[data-position=top]{justify-content:center;align-items:flex-start}
.ky-turn-board[data-position=bottom]{justify-content:center;align-items:flex-end}
.ky-turn-board[data-position=side]{justify-content:flex-end;align-items:center}
.ky-turn-board[data-position=left]{justify-content:flex-start;align-items:center}
.ky-turn-board[data-position=corner],.ky-turn-board[data-position=top-right]{justify-content:flex-end;align-items:flex-start}
.ky-turn-board[data-position=top-left]{justify-content:flex-start;align-items:flex-start}
.ky-turn-board[data-position=bottom-left]{justify-content:flex-start;align-items:flex-end}
.ky-turn-board[data-position=bottom-right]{justify-content:flex-end;align-items:flex-end}
.ky-turn-board[data-position=custom]{display:block}`.trim();
