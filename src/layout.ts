// Many drawings in one SVG: a grid of small multiples (one per park, per period, per player) with a title, a subtitle, a credit line and a key that they share. Each
// drawing is read as markup, given ids of its own, and set in a group that is moved and scaled into its cell, so that the grid is one picture a screen reader, the scene
// and every renderer read like any other drawing of the package. No drawing is drawn twice, and nothing is measured in a browser: the type is set by estimates (`textWidth`).
import { backgroundMarkup, resolveBackground, KYOGIJO_BACKGROUND_STYLE, type Background } from "./background.ts";
import { safeColour } from "./colour.ts";
import { safeClass } from "./common.ts";
import { drawKyogijo } from "./draw.ts";
import { el, esc, hash, num } from "./format.ts";
import { KYOGIJO_GRID_STYLE } from "./layout.style.ts";
import { KYOGIJO_MARK_STYLE } from "./mark.ts";
import { isPolygon, shapePath } from "./layers.marks.ts";
import type { MarkShape } from "./layers.types.ts";
import { elements, parseSvg, textOf, writeSvg, type SvgNode } from "./scene.xml.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.core.ts";
import { KYOGIJO_BASE_STYLE, KYOGIJO_CURLING_STYLE, KYOGIJO_HEAT_STYLE, KYOGIJO_NOTE_STYLE, KYOGIJO_TEAM_STYLE } from "./style.ts";
import { textWidth } from "./text.ts";
import type { Language, ScoreOptions, SurfaceOptions } from "./types.ts";
import { VERSION } from "./version.ts";

/** The sizes a grid is made for: a social card, a square post and a phone's width. */
export type GridPreset = "card" | "square" | "phone";

/** What a preset fixes: the size in pixels (a height of `undefined` is whatever the drawings need), the columns, and whether the page has a ground of its own. */
export interface GridPresetInfo {
  readonly width: number;
  readonly height: number | undefined;
  readonly columns: number | undefined;
  /** The ground behind the grid when `background` says nothing: a solid one for a picture that will be posted, none for a phone's page. */
  readonly ground: boolean;
  readonly about: string;
}

/**
 * The presets of `drawGrid`: `card` is 1200 by 675 (the 16:9 card that social sites show for a link), `square` is 1080 by 1080, and `phone` is 390 wide in one column with
 * the height the drawings need. A `width`, a `height` or `columns` in the options wins over the preset's.
 */
export const GRID_PRESETS: Readonly<Record<GridPreset, GridPresetInfo>> = Object.freeze({
  card: { width: 1200, height: 675, columns: undefined, ground: true, about: "1200 by 675, a social card" },
  square: { width: 1080, height: 1080, columns: undefined, ground: true, about: "1080 by 1080, a square post" },
  phone: { width: 390, height: undefined, columns: 1, ground: false, about: "390 wide, one column, as tall as the drawings need" },
});

/** One mark of the key: what it means, in what colour and shape. */
export interface GridLegendItem {
  /** What the mark means. */
  label: string;
  /** The mark's colour (`safeColour`); the layers' own when missing. */
  color?: string;
  /** The mark's shape. A circle by default. */
  shape?: MarkShape;
  /** Drawn open, as a miss or a save is. */
  hollow?: boolean;
}

/** What a cell holds: the options of `drawKyogijo`, a drawing's SVG, or a chart (anything with a `draw()` that returns an SVG). */
export type GridDrawing = string | SurfaceOptions | ScoreOptions | { draw(): string };

/** A drawing and the caption written over it. A cell may also be the drawing alone. */
export interface GridCell {
  drawing: GridDrawing;
  /** A caption over the drawing (one line, made smaller to fit). The drawing keeps its own title and description for a screen reader. */
  label?: string;
}

/** What `drawGrid` takes. */
export interface GridOptions {
  /** A size to fit: `card`, `square` or `phone` (see `GRID_PRESETS`). */
  preset?: GridPreset;
  /** The drawings in a row. By default the number that makes the drawings largest in a fixed size, else as many as fit with a cell at least 280 wide. */
  columns?: number;
  /** The space between cells, in the grid's units. About a sixtieth of the width by default. */
  gap?: number;
  /** The width of the picture. The preset's, else 960. */
  width?: number;
  /** The height of the picture. The preset's; without one, the drawings decide. */
  height?: number;
  /** The title, set at the top. It is also the group's accessible title. */
  title?: string;
  /** The line under the title. */
  subtitle?: string;
  /** The line at the foot: a credit, a source, a date. */
  endnote?: string;
  /** The key the drawings share, set under the title. */
  legend?: readonly GridLegendItem[];
  /** The ground behind everything: a pattern, a colour, a photograph. See `BackgroundOptions`. `card` and `square` have a plain one unless it is `"none"`. */
  background?: Background;
  /** The language of the grid's own words: its accessible title and description. Drawings given as options take it too, unless they have their own. */
  language?: Language;
  /** Force light or dark on the grid and on every drawing in it. Without it the grid follows the device and the page, like a drawing does. */
  theme?: "light" | "dark";
  /** A prefix for the ids in the picture. Made from the grid when missing. */
  id?: string;
  /** The group's accessible title in place of `title`, for a grid whose visible title says too little. */
  label?: string;
  /** The group's description, in place of the one made from the drawings' titles. */
  description?: string;
  /** A class for the root, as in `drawKyogijo`. */
  className?: string;
  /** `none` leaves the stylesheet to the page (`KYOGIJO_STYLE` has every rule). */
  style?: "embed" | "none";
}

/** The most drawings a grid takes. */
export const GRID_MAX_CELLS = 200;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const positive = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined);
const fixed = (v: number): string => String(Math.round(v * 100000) / 100000);

/** The lines a text breaks into at spaces, and inside a word that is wider than a line (Japanese has no spaces), the last one cut with an ellipsis when there are too many. */
function wrap(text: string, size: number, maxWidth: number, maxLines: number): string[] {
  const fits = (s: string): boolean => textWidth(s) * size <= maxWidth;
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/).filter((w) => w !== "")) {
    const joined = line === "" ? word : `${line} ${word}`;
    if (fits(joined)) {
      line = joined;
      continue;
    }
    if (line !== "") lines.push(line);
    line = "";
    if (fits(word)) {
      line = word;
      continue;
    }
    for (const ch of word) {
      if (fits(line + ch) || line === "") line += ch;
      else {
        lines.push(line);
        line = ch;
      }
    }
  }
  if (line !== "") lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last.length > 1 && !fits(`${last}…`)) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

/** A caption on one line: made smaller to fit, and cut with an ellipsis when it still does not at 60 percent. */
function caption(text: string, size: number, maxWidth: number): { text: string; size: number } {
  const all = textWidth(text);
  if (all * size <= maxWidth) return { text, size };
  const smaller = maxWidth / all;
  if (smaller >= size * 0.6) return { text, size: smaller };
  const s = size * 0.6;
  let cut = text;
  while (cut.length > 1 && textWidth(`${cut}…`) * s > maxWidth) cut = cut.slice(0, -1);
  return { text: `${cut}…`, size: s };
}

/** A drawing read: its tree, its frame and the title it names itself with. */
interface Parsed {
  root: SvgNode;
  frame: { x: number; y: number; w: number; h: number };
  title: string;
  label: string | undefined;
}

const isCell = (c: unknown): c is GridCell => typeof c === "object" && c !== null && "drawing" in c;

/** The SVG a cell holds, drawn when it is options or a chart. */
function svgOf(cell: unknown, o: GridOptions): { svg: string; label: string | undefined } {
  const label = isCell(cell) ? (typeof cell.label === "string" && cell.label.trim() !== "" ? cell.label.trim() : undefined) : undefined;
  const drawing = isCell(cell) ? cell.drawing : cell;
  if (typeof drawing === "string") return { svg: drawing, label };
  if (typeof drawing === "object" && drawing !== null && typeof (drawing as { draw?: unknown }).draw === "function") return { svg: (drawing as { draw(): string }).draw(), label };
  if (typeof drawing === "object" && drawing !== null) {
    const options = drawing as SurfaceOptions | ScoreOptions;
    return { svg: drawKyogijo({ ...(o.language === undefined ? {} : { language: o.language }), ...(o.style === "none" ? { style: "none" as const } : {}), ...options }), label };
  }
  throw new TypeError("A cell of a grid is the options of drawKyogijo, an SVG string, a chart or { drawing, label }");
}

/** The ids a tree defines, and the tree with each of them (and every reference to it) behind `prefix`. */
function renamed(root: SvgNode, prefix: string): { styles: string[] } {
  const ids = new Set<string>();
  const find = (node: SvgNode): void => {
    if (node.attrs.id !== undefined) ids.add(node.attrs.id);
    for (const child of elements(node)) find(child);
  };
  find(root);
  const styles: string[] = [];
  const reference = (value: string): string =>
    value.replace(/url\(#([^)\s"']+)\)/g, (whole, id: string) => (ids.has(id) ? `url(#${prefix}${id})` : whole));
  const rule = (css: string): string => css.replace(/#([A-Za-z_][\w-]*)/g, (whole, id: string) => (ids.has(id) ? `#${prefix}${id}` : whole));
  const walk = (node: SvgNode): void => {
    for (const [key, value] of Object.entries(node.attrs)) {
      if (key === "id") node.attrs[key] = `${prefix}${value}`;
      else if (key === "href" || key === "xlink:href") node.attrs[key] = value.startsWith("#") && ids.has(value.slice(1)) ? `#${prefix}${value.slice(1)}` : value;
      else if (key === "aria-labelledby" || key === "aria-describedby" || key === "aria-controls") node.attrs[key] = value.split(/\s+/).map((id) => (ids.has(id) ? `${prefix}${id}` : id)).join(" ");
      else if (value.includes("url(#")) node.attrs[key] = reference(value);
    }
    node.children = node.children.filter((child) => {
      if (typeof child !== "string" && child.name === "style") {
        styles.push(rule(child.children.filter((c): c is string => typeof c === "string").join("")));
        return false;
      }
      return true;
    });
    for (const child of elements(node)) walk(child);
  };
  walk(root);
  return { styles };
}

/** The rules the package writes into a drawing, in the order it writes them: peeled off the front of a style so that each is said once however many drawings carry it. */
const KNOWN = [KYOGIJO_BASE_STYLE, KYOGIJO_CURLING_STYLE, KYOGIJO_HEAT_STYLE, KYOGIJO_TEAM_STYLE, KYOGIJO_NOTE_STYLE, KYOGIJO_BACKGROUND_STYLE, KYOGIJO_MARK_STYLE];

/** A drawing's stylesheet as the pieces it is made of. */
function pieces(css: string): string[] {
  const out: string[] = [];
  let rest = css.replace(/^\s+/, "");
  for (let again = true; again && rest !== ""; ) {
    again = false;
    for (const known of KNOWN) {
      if (rest.startsWith(known)) {
        out.push(known);
        rest = rest.slice(known.length).replace(/^\s+/, "");
        again = true;
      }
    }
  }
  if (rest !== "") out.push(rest);
  return out;
}

function parse(svg: string, label: string | undefined, index: number, total: number, words: (typeof KYOGIJO_STRINGS)["en"]): Parsed {
  const root = parseSvg(svg);
  if (root.name !== "svg") throw new TypeError(`Cell ${index + 1} of the grid is not an SVG`);
  const box = (root.attrs.viewBox ?? "").split(/[\s,]+/).map(Number);
  const frame =
    box.length === 4 && box.every(Number.isFinite) ? { x: box[0], y: box[1], w: box[2], h: box[3] } : { x: 0, y: 0, w: Number(root.attrs.width), h: Number(root.attrs.height) };
  if (!(frame.w > 0) || !(frame.h > 0)) throw new RangeError(`Cell ${index + 1} of the grid has no size: it needs a viewBox`);
  const named = elements(root).find((child) => child.name === "title");
  return { root, frame, title: label ?? (named === undefined ? fill(words.grid.cell, { n: index + 1, total }) : textOf(named).trim()), label };
}

/** One mark of the key at `(x, y)` with the size `r`, and the width it takes with its words. */
function legendItem(item: GridLegendItem, x: number, y: number, size: number): string {
  const color = safeColour(item.color);
  const shape = item.shape !== undefined && (item.shape === "circle" || isPolygon(item.shape)) ? item.shape : "circle";
  const attrs = { class: `ky-g-m${item.hollow === true ? " ky-g-h" : ""}`, style: color === undefined ? undefined : `--c:${color}` };
  const r = size * 0.45;
  const mark = shape === "circle" ? el("circle", { ...attrs, cx: num(x + r), cy: num(y), r: num(r) }) : el("path", { ...attrs, d: shapePath(shape, x + r, y, r * 2, false) });
  return mark + el("text", { class: "ky-g-k", x: num(x + size * 1.3), y: num(y + size * 0.33), "font-size": num(size) }, esc(item.label));
}

/**
 * Many drawings in one SVG, as small multiples: one per park, per period or per player, in columns, under a title and a subtitle and over a credit line, with a key they share.
 * A cell is the options of `drawKyogijo`, a drawing's SVG, a chart, or `{ drawing, label }`. Every drawing keeps its own title and description for a screen reader, with ids
 * of its own, so that the same drawing may appear twice; the group has a title and a description made from them. Each is drawn at the largest size its cell allows, the
 * last row centred. `preset` fits a social card (`card`, 1200 by 675; `square`, 1080 by 1080) or a phone (`phone`, 390 wide in one column); without a size the grid is 960
 * wide and as tall as the drawings need. The scene and every renderer read it like any other drawing. The same cells and options always give the same string.
 * @example
 * ```ts
 * import { drawGrid } from "@johnmorrisdotca/kyogijo-stadiums/layouts";
 * const svg = drawGrid(
 *   [{ drawing: { sport: "nhl" }, label: "Rink" }, { drawing: { sport: "nba" }, label: "Court" }],
 *   { columns: 2, title: "Two surfaces", endnote: "Drawn by Kyogijo" },
 * );
 * console.log(svg.startsWith("<svg"), svg.includes("Two surfaces"));
 * // true true
 * ```
 */
export function drawGrid(cells: readonly (GridCell | GridDrawing)[], options: GridOptions = {}): string {
  if (!Array.isArray(cells) || cells.length === 0) throw new TypeError("drawGrid needs a list of at least one drawing");
  if (cells.length > GRID_MAX_CELLS) throw new RangeError(`A grid holds at most ${GRID_MAX_CELLS} drawings`);
  const o = options;
  const language: Language = o.language === "ja" ? "ja" : "en";
  const words = KYOGIJO_STRINGS[language];
  const preset = o.preset !== undefined && Object.prototype.hasOwnProperty.call(GRID_PRESETS, o.preset) ? GRID_PRESETS[o.preset] : undefined;
  const theme = o.theme === "light" || o.theme === "dark" ? o.theme : undefined;

  const drawn = cells.map((cell) => svgOf(cell, o));
  const gid = safeClass(o.id).replace(/ /g, "-") || `kg-${hash(JSON.stringify([drawn.map((d) => [d.svg, d.label]), o, VERSION]))}`;
  const parsed = drawn.map((d, i) => parse(d.svg, d.label, i, drawn.length, words));
  const n = parsed.length;

  // ---- The size, the type and the room round it. ----
  const W = clamp(positive(o.width) ?? preset?.width ?? 960, 120, 8000);
  const fixedHeight = positive(o.height) ?? preset?.height;
  const ts = clamp(W * 0.036, 18, 48);
  const ss = Math.max(11, ts * 0.55);
  const ls = Math.max(10, ts * 0.44);
  const ks = Math.max(10.5, ts * 0.42);
  const es = Math.max(10, ts * 0.38);
  const pad = clamp(W * 0.03, 14, 40);
  const gap = clamp(positive(o.gap) ?? W * 0.0167, 0, 200);
  const room = W - 2 * pad;

  const title = typeof o.title === "string" && o.title.trim() !== "" ? o.title.trim() : undefined;
  const subtitle = typeof o.subtitle === "string" && o.subtitle.trim() !== "" ? o.subtitle.trim() : undefined;
  const endnote = typeof o.endnote === "string" && o.endnote.trim() !== "" ? o.endnote.trim() : undefined;
  const titleLines = title === undefined ? [] : wrap(title, ts, room, 3);
  const subLines = subtitle === undefined ? [] : wrap(subtitle, ss, room, 4);
  const endLines = endnote === undefined ? [] : wrap(endnote, es, room, 3);
  const headH = titleLines.length * ts * 1.18 + (subLines.length > 0 ? (titleLines.length > 0 ? ts * 0.2 : 0) + subLines.length * ss * 1.32 : 0);
  const endH = endLines.length * es * 1.35;

  const legend = (o.legend ?? []).filter((item) => typeof item?.label === "string" && item.label.trim() !== "").map((item) => ({ ...item, label: item.label.trim() }));
  const legendRows: { item: GridLegendItem; x: number; row: number }[] = [];
  let legendRowCount = 0;
  if (legend.length > 0) {
    let x = 0;
    let row = 0;
    for (const item of legend) {
      const w = ks * 1.3 + textWidth(item.label) * ks + ks * 1.6;
      if (x > 0 && x + w - ks * 1.6 > room) {
        row += 1;
        x = 0;
      }
      legendRows.push({ item, x, row });
      x += w;
    }
    legendRowCount = row + 1;
  }
  const legendH = legendRowCount * ks * 1.75;

  const labelled = parsed.some((p) => p.label !== undefined);
  const labelH = labelled ? ls * 1.55 : 0;

  // ---- The columns. ----
  const top = pad + headH + (headH > 0 ? gap * 0.6 : 0) + legendH + (legendH > 0 ? gap * 0.4 : 0);
  const foot = endH > 0 ? endH + gap * 0.6 : 0;
  const asked = positive(o.columns) === undefined ? undefined : Math.min(n, Math.max(1, Math.floor(o.columns as number)));
  const wanted = asked ?? preset?.columns;
  const arrange = (cols: number): { cw: number; ch: number | undefined; rows: number } => {
    const rows = Math.ceil(n / cols);
    const cw = (room - gap * (cols - 1)) / cols;
    const ch = fixedHeight === undefined ? undefined : Math.max(8, (fixedHeight - top - pad - foot - gap * (rows - 1)) / rows);
    return { cw, ch, rows };
  };
  let columns: number;
  if (wanted !== undefined) columns = Math.min(n, Math.max(1, Math.floor(wanted)));
  else if (fixedHeight === undefined) columns = Math.max(1, Math.min(n, Math.floor((room + gap) / (280 + gap))));
  else {
    // The columns that make the drawings largest, taken together: the fewest on a tie.
    let best = -1;
    columns = 1;
    for (let cols = 1; cols <= Math.min(n, 12); cols += 1) {
      const { cw, ch } = arrange(cols);
      const height = (ch ?? 0) - labelH;
      if (!(cw > 0) || !(height > 0)) continue;
      const area = parsed.reduce((sum, p) => sum + (p.frame.w * p.frame.h * Math.min(cw / p.frame.w, height / p.frame.h) ** 2), 0);
      if (area > best * 1.0001) {
        best = area;
        columns = cols;
      }
    }
  }
  const { cw, ch, rows } = arrange(columns);

  // ---- The rows and the height. ----
  const rowHeights: number[] = [];
  for (let r = 0; r < rows; r += 1) {
    const inRow = parsed.slice(r * columns, (r + 1) * columns);
    rowHeights.push(ch !== undefined ? ch : Math.max(...inRow.map((p) => (cw * p.frame.h) / p.frame.w)) + labelH);
  }
  const H = fixedHeight ?? top + rowHeights.reduce((a, b) => a + b, 0) + gap * (rows - 1) + foot + pad;
  const cellsEnd = H - pad - foot;

  // ---- The drawings, each in its cell. ----
  const sheets = new Set<string>();
  const sheetList: string[] = [];
  const addSheet = (css: string): void => {
    for (const piece of pieces(css)) {
      if (piece.trim() !== "" && !sheets.has(piece)) {
        sheets.add(piece);
        sheetList.push(piece);
      }
    }
  };
  let cellDefs = "";
  let cellMarkup = "";
  parsed.forEach((p, i) => {
    const prefix = `${gid}-${i}-`;
    const { styles } = renamed(p.root, prefix);
    for (const css of styles) addSheet(css);
    const r = Math.floor(i / columns);
    const c = i % columns;
    const inRow = Math.min(columns, n - r * columns);
    const rowWidth = inRow * cw + gap * (inRow - 1);
    const x0 = pad + (room - rowWidth) / 2 + c * (cw + gap);
    const y0 = top + rowHeights.slice(0, r).reduce((a, b) => a + b, 0) + gap * r;
    const boxH = rowHeights[r] - labelH;
    const scale = Math.min(cw / p.frame.w, boxH / p.frame.h);
    const w = p.frame.w * scale;
    const h = p.frame.h * scale;
    // The caption and its drawing are one block, in the middle of the cell.
    const off = (rowHeights[r] - labelH - h) / 2;
    const tx = x0 + (cw - w) / 2 - p.frame.x * scale;
    const ty = y0 + off + labelH - p.frame.y * scale;
    const clip = `${prefix}clip`;
    cellDefs += el("clipPath", { id: clip }, el("rect", { x: num(p.frame.x), y: num(p.frame.y), width: num(p.frame.w), height: num(p.frame.h) }));
    const attrs: Record<string, string> = {};
    for (const [key, value] of Object.entries(p.root.attrs)) if (key !== "xmlns" && key !== "viewBox" && key !== "width" && key !== "height") attrs[key] = value;
    if (theme !== undefined && attrs["data-theme"] === undefined) attrs["data-theme"] = theme;
    attrs.transform = `translate(${num(tx)} ${num(ty)}) scale(${fixed(scale)})`;
    attrs["clip-path"] = `url(#${clip})`;
    const group = writeSvg({ name: "g", attrs, children: p.root.children, empty: false });
    let text = "";
    if (p.label !== undefined) {
      const fitted = caption(p.label, ls, cw);
      text = el("text", { class: "ky-g-c", x: num(x0 + cw / 2), y: num(y0 + off + ls * 1.1), "font-size": num(fitted.size), "text-anchor": "middle" }, esc(fitted.text));
    }
    cellMarkup += el("g", { class: "ky-g-cell", "data-cell": i + 1 }, text + group);
  });

  // ---- The words round them. ----
  let head = "";
  let y = pad;
  titleLines.forEach((line, i) => {
    head += el("text", { class: "ky-g-t", x: num(pad), y: num(y + ts * 0.9 + i * ts * 1.18), "font-size": num(ts) }, esc(line));
  });
  y += titleLines.length * ts * 1.18 + (subLines.length > 0 && titleLines.length > 0 ? ts * 0.2 : 0);
  subLines.forEach((line, i) => {
    head += el("text", { class: "ky-g-s", x: num(pad), y: num(y + ss * 0.95 + i * ss * 1.32), "font-size": num(ss) }, esc(line));
  });
  const legendTop = pad + headH + (headH > 0 ? gap * 0.6 : 0);
  const key = legendRows.length === 0 ? "" : el("g", { class: "ky-g-legend" }, legendRows.map(({ item, x, row }) => legendItem(item, pad + x, legendTop + ks * 0.95 + row * ks * 1.75, ks)).join(""));
  const tail = endLines.map((line, i) => el("text", { class: "ky-g-e", x: num(pad), y: num(cellsEnd + gap * 0.6 + es * 1.0 + i * es * 1.35), "font-size": num(es) }, esc(line))).join("");

  // ---- The ground, the style and the group's title and description. ----
  const ground = o.background === undefined ? (preset?.ground === true ? { color: "var(--ky-grid-bg)" } : undefined) : o.background === "none" ? undefined : typeof o.background === "string" ? { pattern: o.background, color: "var(--ky-grid-bg)" } : { color: "var(--ky-grid-bg)", ...o.background };
  const grounded = backgroundMarkup(ground, { x: 0, y: 0, w: W, h: H }, gid);
  const hasGround = resolveBackground(ground) !== undefined;
  const sheet = o.style === "none" ? "" : [KYOGIJO_BASE_STYLE, ...sheetList.filter((css) => css !== KYOGIJO_BASE_STYLE), KYOGIJO_GRID_STYLE, ...(hasGround && !sheets.has(KYOGIJO_BACKGROUND_STYLE) ? [KYOGIJO_BACKGROUND_STYLE] : [])].join("\n");

  const sentence = (text: string): string => (/[.!?。！？…]$/.test(text) ? text : `${text}${words.said.stop}`);
  const heading = (o.label !== undefined && o.label.trim() !== "" ? o.label.trim() : undefined) ?? title ?? fill(words.grid.title, { n });
  const names = parsed.map((p) => p.title);
  const description =
    o.description ??
    [subtitle === undefined ? undefined : sentence(subtitle), fill(words.grid.drawings, { n, list: names.join(words.grid.listSep) }), legend.length === 0 ? undefined : fill(words.grid.key, { list: legend.map((item) => item.label).join(words.grid.listSep) }), endnote === undefined ? undefined : sentence(endnote)]
      .filter((part): part is string => part !== undefined)
      .join(words.said.gap);

  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo kyogijo-grid${safeClass(o.className) === "" ? "" : ` ${safeClass(o.className)}`}`,
      viewBox: `0 0 ${num(W)} ${num(H)}`,
      role: "group",
      "aria-labelledby": `${gid}-t ${gid}-d`,
      "data-grid": n,
      "data-columns": columns,
      "data-preset": o.preset !== undefined && preset !== undefined ? o.preset : undefined,
      "data-theme": theme,
      "data-version": VERSION,
    },
    `<title id="${gid}-t">${esc(heading)}</title><desc id="${gid}-d">${esc(description)}</desc>` +
      (sheet === "" ? "" : `<style>${sheet}</style>`) +
      `<defs>${grounded.defs}${cellDefs}</defs>` +
      grounded.shapes +
      head +
      key +
      cellMarkup +
      tail,
  );
}
