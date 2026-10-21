// A tournament layout drawn: the package's own surfaces, each drawn by `drawKyogijo` and set where the layout puts it, on one floor, to scale, with the barriers, the officials' chairs, the scoreboard, the
// boards and the empty places for the event's own words and marks; and, when asked, the hall's floor and a real stadium round it at the same scale. A surface is not drawn a second way here: its markup is
// the drawing's own, moved. The same options always give the same string. The text alternative is `multiTable`.
import { octagonD } from "./budo/plan.ts";
import { drawKyogijo } from "./draw.ts";
import { safeClass } from "./common.ts";
import { densityOf, layoutOf, resolveCrowd, type Crowd, type CrowdStands } from "./crowd.ts";
import { drawCrowd, KYOGIJO_CROWD_STYLE } from "./crowd.draw.ts";
import { el, esc, hash, num } from "./format.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { fitSentence, multiFit, multiLayout, multiNumber, needsSentence, venueOf } from "./multi.ts";
import { KYOGIJO_MULTI_STYLE } from "./multi.style.ts";
import { MULTI_WORDS } from "./multi.words.ts";
import type { MultiCell, MultiFit, MultiLayout, MultiOptions, MultiSample, MultiSlot, MultiVenue } from "./multi.types.ts";
import { outlineOf } from "./outline.ts";
import { fill } from "./strings.ts";
import { textWidth } from "./text.ts";
import type { Language, SurfaceOptions } from "./types.ts";
import { uprightsFor } from "./uprights.ts";
import { hallBoards } from "./venue.boards.ts";
import { VERSION } from "./version.ts";

const metres = (ft: number): number => ft / FEET_PER_METRE;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** One of the layout's surfaces as markup: the drawing's own, without its title, its stylesheet, its apron and its free zone (the layout draws the floor). */
function inner(svg: string): { body: string; style: string; look: string | undefined } {
  const look = /^<svg[^>]* data-look="([^"]*)"/.exec(svg)?.[1];
  const style = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? "";
  let body = svg.replace(/<style>[\s\S]*?<\/style>/, "");
  body = body.slice(body.indexOf("</desc>") + "</desc>".length, body.lastIndexOf("</svg>"));
  body = body.replace(/<rect class="ky-(?:apron|free)(?: [^"]*)?"[^>]*\/>/g, "");
  return { body, style, look };
}

/** The invented event of a layout's sample content: the options' own, or the package's (`Kyogijo Open 2026, Osaka`). */
function sampleOf(o: MultiOptions, words: (typeof MULTI_WORDS)["en"]): { event: string; year: string; city: string } | undefined {
  if (o.sample === undefined || o.sample === false) return undefined;
  const given: MultiSample = o.sample === true ? {} : o.sample;
  return { event: given.event ?? words.sample.event, year: String(given.year ?? words.sample.year), city: given.city ?? words.sample.city };
}

/** The line of a sample event: its name, year and city. */
const sampleLine = (e: { event: string; year: string; city: string }): string => `${e.event} ${e.year} · ${e.city}`;

/**
 * A simple emblem of the package's own, in a square of `size` feet centred on (cx, cy): a ring with a star, a diamond or waves, by `kind`. Plain geometry: no real mark, brand, federation or sponsor is drawn, and no one's logo is
 * imitated.
 */
function emblem(cx: number, cy: number, size: number, kind: number): string {
  const r = size / 2;
  const ring = el("circle", { class: "ky-mu-emblem", cx: num(cx), cy: num(cy), r: num(r * 0.92) });
  const k = ((kind % 3) + 3) % 3;
  if (k === 0) {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r * 0.6 : r * 0.26;
      return `${num(cx + rr * Math.cos(a))} ${num(cy + rr * Math.sin(a))}`;
    });
    return ring + el("path", { class: "ky-mu-emblem-fill", d: `M${pts.join("L")}Z` });
  }
  if (k === 1) {
    const d = r * 0.5;
    return ring + el("path", { class: "ky-mu-emblem-fill", d: `M${num(cx)} ${num(cy - d)}L${num(cx + d)} ${num(cy)}L${num(cx)} ${num(cy + d)}L${num(cx - d)} ${num(cy)}Z` });
  }
  let waves = "";
  for (const dy of [-0.28, 0, 0.28]) {
    const y = cy + r * dy;
    waves += `M${num(cx - r * 0.55)} ${num(y)}Q${num(cx - r * 0.275)} ${num(y - r * 0.2)} ${num(cx)} ${num(y)}T${num(cx + r * 0.55)} ${num(y)}`;
  }
  return ring + el("path", { class: "ky-mu-emblem", d: waves, fill: "none" });
}

/** The text of an empty place, sized to fit it. */
function slotText(slot: MultiSlot, words: (typeof MULTI_WORDS)["en"]): string {
  return slot.kind === "floor-text" ? words.slots.floorText : slot.kind === "floor-logo" ? words.slots.floorLogo : words.slots.board;
}

/** The tag of a layout's floor in the drawing: the colour looks of `data-floor`, a budō floor wearing the mats'. */
const floorClass = (layout: MultiLayout): string => (layout.spec.kind === "budo" ? "ky-bud-t2" : "ky-mu-floor");

/**
 * A tournament layout as one SVG string: several of the package's surfaces laid out together for one large event, to scale, on one floor. `preset` is one of `MULTI_PRESETS` (`tabletennis-4`, `pickleball-2x4`,
 * `curling-1x4`, `judo-1x3`, `karate-2x3`, `badminton-1x4`, ...), or `layout` is your own; `rows`, `columns` and `stagger` change the grid. The empty places for the event's words and marks are drawn dashed and hold nothing.
 * `venue` sets the layout in a hall's floor (a key of `MULTI_VENUES` or a size of your own) and the description says whether it fits; `stadium` draws a real stadium round the floor at the same scale, with the
 * walls, the stands and the crowd the package draws for the sport. Light and dark follow the page; `multiTable` is the same thing as a table.
 * @example
 * ```ts
 * import { drawMulti } from "@johnmorrisdotca/kyogijo-stadiums/multi";
 * const svg = drawMulti({ preset: "tabletennis-4", stadium: true, venue: "ovo-arena-wembley" });
 * console.log(svg.startsWith("<svg"), svg.includes("Table 4"));
 * // true true
 * ```
 */
export function drawMulti(options: MultiOptions = {}): string {
  return multiDrawing(options, false).svg;
}

/** Where the layout stands in the picture, so that something else can be put in the same frame (the 3D view's planes): the hall's size, where the layout is set in it, and the map from the layout's own frame to the picture's. */
export interface MultiFrame {
  layout: MultiLayout;
  /** The hall's size and the layout's size as set in it (turned a quarter when the hall asks), in feet; the layout's top left corner is at (`ox`, `oy`). */
  hall: { w: number; h: number };
  lw: number;
  lh: number;
  ox: number;
  oy: number;
  turned: boolean;
  /** A point of the layout's own frame (feet from the top left of its floor) in the picture's frame. */
  to(x: number, y: number): [number, number];
}

/** A layout's drawing, and what was worked out to make it. */
export interface MultiDrawing {
  svg: string;
  frame: MultiFrame;
  fit: MultiFit | undefined;
  /** The stands of the stadium round the hall, when it is on (in the picture's frame), and the crowd they are of. */
  stands?: { stands: CrowdStands; crowd: Crowd; standsLike: string };
  /** For a drawing made to be raised (`raise`): the surfaces that stand over the floor (a table tennis table), each with its cell and its own drawing, which the floor does not carry. */
  lifted: { cell: MultiCell; body: string; box: { x: number; y: number; w: number; h: number }; lift: number }[];
  /** The width and height of the picture and where it starts, in feet (its viewBox). */
  view: { x: number; y: number; w: number; h: number };
  title: string;
  description: string;
}

/**
 * The drawing of a layout, with what it was worked out from. `raise` makes the floor of a 3D view instead of the flat picture: the barriers, the officials' chairs, the scoreboard and the stands are left out (the 3D
 * view stands them up), and a surface that stands over the floor (a table tennis table) is left off it too, with a soft shadow in its place. Everything else is the same string. With `uprights` false the 3D view stands
 * nothing but the stands up, so the barriers and the rest stay on the floor.
 */
export function multiDrawing(options: MultiOptions, raise: boolean, uprights = true): MultiDrawing {
  const o = options;
  const language: Language = o.language === "ja" ? "ja" : "en";
  const words = MULTI_WORDS[language];
  const layout = multiLayout(o);
  const spec = layout.spec;
  const venue = venueOf(o.venue);
  const fit: MultiFit | undefined = venue === undefined ? undefined : multiFit(layout, venue);
  const stadium = o.stadium === undefined || o.stadium === false ? undefined : o.stadium === true ? {} : o.stadium;
  const gid = safeClass(o.id).replace(/ /g, "-") || `ky-mu-${hash(JSON.stringify([spec, o, VERSION]))}`;
  const withSlots = o.slots !== false;
  const withLabels = o.labels !== false;

  // ---- The hall: the venue's floor, or the layout's own, and where the layout stands in it. ----
  const turned = fit?.turned === true && fit.fits === true;
  const lw = turned ? layout.floor.h : layout.floor.w;
  const lh = turned ? layout.floor.w : layout.floor.h;
  let hall = { w: lw, h: lh };
  if (venue !== undefined && venue.shape === "rectangle") {
    const L = venue.unit === "m" ? (venue.length as number) * FEET_PER_METRE : (venue.length as number);
    const W = venue.unit === "m" ? (venue.width as number) * FEET_PER_METRE : (venue.width as number);
    hall = { w: L, h: W };
  } else if (venue !== undefined && venue.shape === "octagon") {
    const across = (venue.across as number) * FEET_PER_METRE;
    hall = { w: across, h: across };
  }
  // The layout is set in the middle of the hall; one that does not fit still is, and hangs over.
  const ox = (hall.w - lw) / 2;
  const oy = (hall.h - lh) / 2;
  const move = turned ? `translate(${num(ox + lw)} ${num(oy)}) rotate(90)` : `translate(${num(ox)} ${num(oy)})`;
  const to = (x: number, y: number): [number, number] => (turned ? [ox + lw - y, oy + x] : [ox + x, oy + y]);

  // ---- The surfaces, each drawn by the package. ----
  let style = "";
  let look: string | undefined;
  let cellsMarkup = "";
  const lifted: MultiDrawing["lifted"] = [];
  const surfaceBox = outlineOf(spec.surface).box;
  const common = { ...spec.surface, margin: 0, language } as const;
  // A surface that stands over the floor (a table tennis table's top, 76 cm up) is raised by the 3D view as a plane of its own.
  const up = raise && uprights;
  const lift = up && spec.kind === "cells" ? uprightsFor(common as SurfaceOptions).lift : 0;
  const raised = lift > 0;
  if (spec.kind === "budo") {
    const drawn = inner(drawKyogijo({ ...common, id: `${gid}-s`, ...(o.style === "none" ? { style: "none" as const } : {}) }));
    style = drawn.style;
    look = drawn.look;
    // The mats stand where the layout puts them: the drawing's own origin is the tatami's top left.
    const t = layout.tatami as { x: number; y: number };
    cellsMarkup = el("g", { class: "ky-mu-cell", transform: `translate(${num(t.x - surfaceBox.x)} ${num(t.y - surfaceBox.y)})` }, drawn.body);
  } else {
    layout.cells.forEach((cell, i) => {
      const drawn = inner(drawKyogijo({ ...common, id: `${gid}-s${i + 1}`, style: i === 0 && o.style !== "none" ? "embed" : "none" }));
      if (i === 0) {
        style = drawn.style;
        look = drawn.look;
      }
      if (raised) {
        // The floor has its shadow, soft and a little larger; the top is a plane of the 3D view.
        const grow = 0.8;
        cellsMarkup += el("rect", { class: "ky-mu-shadow", x: num(cell.x - grow / 2), y: num(cell.y - grow / 2), width: num(cell.w + grow), height: num(cell.h + grow), rx: num(grow) });
        lifted.push({ cell, body: drawn.body, box: { x: surfaceBox.x, y: surfaceBox.y, w: surfaceBox.w, h: surfaceBox.h }, lift });
        return;
      }
      // A surface turned a quarter stands across the layout: the drawing's own top left goes to the cell's top right, and the drawing is turned.
      const place = cell.turn ? `translate(${num(cell.x + cell.w)} ${num(cell.y)}) rotate(90) translate(${num(-surfaceBox.x)} ${num(-surfaceBox.y)})` : `translate(${num(cell.x - surfaceBox.x)} ${num(cell.y - surfaceBox.y)})`;
      cellsMarkup += el("g", { class: "ky-mu-cell", "data-cell": cell.n, transform: place }, drawn.body);
    });
  }

  // ---- What stands on and round the floor. ----
  let floorMarkup = "";
  floorMarkup += el("rect", { class: floorClass(layout), x: 0, y: 0, width: num(layout.floor.w), height: num(layout.floor.h) });
  let over = "";
  if (!up && spec.parts.barriers === true) for (const c of layout.cells) over += el("rect", { class: "ky-mu-barrier", x: num(c.bay.x + 0.5), y: num(c.bay.y + 0.5), width: num(c.bay.w - 1), height: num(c.bay.h - 1), rx: 0.4 });
  if (!up && spec.parts.officials === true) {
    for (const c of layout.cells) {
      if (c.turn) {
        // Beside the net, on the right of a surface that stands across the layout.
        const cy = c.y + c.h / 2;
        over += el("rect", { class: "ky-mu-chair", x: num(c.x + c.w + 1.8), y: num(cy - 3.2), width: 1.6, height: 1.6, rx: 0.3 });
        over += el("rect", { class: "ky-mu-desk", x: num(c.x + c.w + 1.5), y: num(cy - 0.8), width: 1.1, height: 3.6, rx: 0.2 });
        continue;
      }
      const cx = c.x + c.w / 2;
      over += el("rect", { class: "ky-mu-chair", x: num(cx + 1.6), y: num(c.y - 3.4), width: 1.6, height: 1.6, rx: 0.3 });
      over += el("rect", { class: "ky-mu-desk", x: num(cx - 5), y: num(c.y - 3.1), width: 3.6, height: 1.1, rx: 0.2 });
    }
  }
  if (!up && spec.parts.scoreboard === "each") for (const c of layout.cells) over += el("rect", { class: "ky-mu-sb", x: num(c.x + c.w / 2 - 2), y: num(c.y + c.h + 1.2), width: 4, height: 1.4, rx: 0.2 });
  const sb = up ? undefined : layout.shared;
  if (sb !== undefined) {
    over += el("rect", { class: "ky-mu-sb", x: num(sb.x), y: num(sb.y), width: num(sb.w), height: num(sb.h), rx: 0.5 });
    // One scoreboard for all: a quarter of it for each of four areas, or one panel for each when they are fewer or more.
    const n = layout.cells.length;
    const cols = n <= 4 ? Math.min(2, n) : n;
    const rows = n <= 4 && n > 2 ? 2 : 1;
    let cuts = "";
    for (let i = 1; i < cols; i += 1) cuts += `M${num(sb.x + (sb.w * i) / cols)} ${num(sb.y)}v${num(sb.h)}`;
    for (let j = 1; j < rows; j += 1) cuts += `M${num(sb.x)} ${num(sb.y + (sb.h * j) / rows)}h${num(sb.w)}`;
    if (cuts !== "") over += el("path", { class: "ky-mu-sb-cut", d: cuts, fill: "none" });
  }
  let slotsMarkup = "";
  let slotTexts = "";
  const sample = sampleOf(o, words);
  if (withSlots) {
    layout.slots.forEach((slot, index) => {
      const board = slot.kind === "board";
      // With sample content a floor's places carry an invented event's words and emblems and are not drawn dashed; the boards keep their dark panels.
      if (sample === undefined || board) slotsMarkup += el("rect", { class: board ? "ky-mu-board" : "ky-mu-slot", x: num(slot.x), y: num(slot.y), width: num(slot.w), height: num(slot.h), "data-slot": slot.id });
      if (board && sample === undefined) slotsMarkup += el("rect", { class: "ky-mu-slot ky-mu-slot-board", x: num(slot.x + 0.3), y: num(slot.y + 0.3), width: num(slot.w - 0.6), height: num(slot.h - 0.6) });
      if (sample !== undefined && slot.kind === "floor-logo") {
        const [ex, ey] = to(slot.x + slot.w / 2, slot.y + slot.h / 2);
        slotsMarkup += el("g", { class: "ky-mu-emblems", "data-slot": slot.id }, emblem(ex, ey, Math.min(slot.w, slot.h) * 0.9, index));
        return;
      }
      const text = sample === undefined ? slotText(slot, words) : board ? sampleLine(sample).toUpperCase() : sampleLine(sample);
      const horizontal = slot.w >= slot.h;
      const long = horizontal ? slot.w : slot.h;
      const short = horizontal ? slot.h : slot.w;
      const size = clamp(Math.min(short * 0.5, (long * 0.9) / Math.max(1, textWidth(text))), 0.5, 4);
      const [tx, ty] = to(slot.x + slot.w / 2, slot.y + slot.h / 2);
      // The words of a slot on a long side are laid along it; in a turned layout they turn back to read from the left.
      const rot = (horizontal ? 0 : -90) + 0;
      const cls = sample === undefined ? "ky-mu-slot-text" : "ky-mu-sample-text";
      slotTexts += el("text", { class: `${cls}${board ? ` ${cls}-board` : ""}`, x: num(tx), y: num(ty + size * 0.34), "font-size": num(size), transform: rot === 0 ? undefined : `rotate(${rot} ${num(tx)} ${num(ty)})` }, esc(text));
    });
  }
  let labelsMarkup = "";
  if (withLabels) {
    for (const c of layout.cells) {
      const size = clamp(Math.min(c.bay.w, c.bay.h) * 0.075, 1.1, 3.4);
      let lx: number;
      let ly: number;
      let anchor = "start";
      if (spec.kind === "budo") {
        [lx, ly] = to(c.x + c.w / 2, c.y + c.h * 0.16);
        anchor = "middle";
      } else {
        // At the outer corner of its bay, so that the labels stay clear of what hangs over the middle of the floor.
        const right = spec.columns > 1 && c.column >= spec.columns / 2;
        const below = spec.rows > 1 && spec.columns > 1 && c.row >= spec.rows / 2;
        [lx, ly] = to(right ? c.bay.x + c.bay.w - 1.4 : c.bay.x + 1.4, below ? c.bay.y + c.bay.h - size * 0.5 : c.bay.y + size * 1.3);
        anchor = right !== turned ? "end" : "start";
      }
      labelsMarkup += el("text", { class: "ky-mu-label", x: num(lx), y: num(ly), "font-size": num(size), "text-anchor": anchor }, esc(c.label));
    }
  }

  // ---- The hall and the stadium round it. ----
  let hallMarkup = "";
  let reach = { left: 0, right: 0, top: 0, bottom: 0 };
  let defs = "";
  let crowdStyle = "";
  let standing: MultiDrawing["stands"];
  const wide = { x: 0, y: 0, w: hall.w, h: hall.h };
  const boards = layout.slots.filter((s) => s.kind === "board");
  const boardsMargin = withSlots && boards.length > 0 ? 5 : 0;
  if (venue !== undefined || stadium !== undefined) {
    const look = venue?.floor !== undefined && venue.floor !== "neutral" ? ` ky-mu-hf-${venue.floor}` : "";
    if (venue?.shape === "octagon") {
      const a = hall.w / 2;
      hallMarkup += el("path", { class: `ky-mu-hallfloor${look}`, d: octagonD(a, a, a) });
    } else hallMarkup += el("rect", { class: `ky-mu-hallfloor${look}`, x: 0, y: 0, width: num(hall.w), height: num(hall.h) });
  }
  if (stadium !== undefined) {
    const standsLike = venue?.standsLike ?? spec.sport;
    const crowd: Crowd = resolveCrowd({ gaps: false, awayEnd: "none", roof: stadium.roof, shape: stadium.shape, density: stadium.density, detail: stadium.detail === "plain" ? "plain" : "fine", boards: hallBoards(stadium.boards) }) as Crowd;
    const stands = layoutOf({ sport: standsLike, box: wide, crowd, awaySide: "right", arena: venue?.shape === "octagon" });
    const wall = venue?.shape === "octagon" ? el("path", { class: "ky-mu-wall", d: octagonD(hall.w / 2, hall.w / 2, hall.w / 2) }) : el("rect", { class: "ky-mu-wall", x: 0, y: 0, width: num(hall.w), height: num(hall.h), rx: 0.5 });
    if (raise) hallMarkup += wall;
    else {
      const density = stadium.crowd === false ? 0 : densityOf(crowd, stands.seats, undefined);
      const drawn = drawCrowd(stands, { id: `${gid}-cr`, crowd, density, fine: crowd.detail !== "plain", ground: "ky-mu-apron" });
      defs += drawn.defs;
      hallMarkup = drawn.markup + hallMarkup + wall;
      crowdStyle = KYOGIJO_CROWD_STYLE;
    }
    reach = stands.reach;
    standing = { stands, crowd, standsLike };
  } else if (venue !== undefined) {
    hallMarkup += el("rect", { class: "ky-mu-hall", x: 0, y: 0, width: num(hall.w), height: num(hall.h) });
  }
  const bad = fit !== undefined && fit.fits === false;
  const overhang = bad ? el("rect", { class: "ky-mu-over", x: num(ox), y: num(oy), width: num(lw), height: num(lh) }) : "";

  // ---- The picture. ----
  const room = Math.max(4, Math.min(hall.w, hall.h) * 0.03);
  const view = {
    x: Math.min(wide.x - reach.left, ox) - room - boardsMargin,
    y: Math.min(wide.y - reach.top, oy) - room - boardsMargin,
    x1: Math.max(wide.x + wide.w + reach.right, ox + lw) + room + boardsMargin,
    y1: Math.max(wide.y + wide.h + reach.bottom, oy + lh) + room + boardsMargin,
  };
  const vw = view.x1 - view.x;
  const vh = view.y1 - view.y;
  const sentences: string[] = [
    fill(words.say.drawn, { name: spec.name[language], surfaces: layout.needs.surfaces, length: multiNumber(layout.needs.length, language), width: multiNumber(layout.needs.width, language), area: multiNumber(layout.needs.area, language) }),
    fill(words.say.grid, { rows: spec.rows, columns: spec.columns }),
  ];
  if (spec.stagger !== undefined && spec.stagger > 0) sentences.push(fill(words.say.stagger, { share: `${Math.round(spec.stagger * 100)}%` }));
  if (layout.shared !== undefined) sentences.push(words.say.shared);
  if (withSlots && layout.slots.some((s) => s.kind !== "board")) {
    const filled = sampleOf(o, words);
    sentences.push(filled === undefined ? fill(words.say.slots, { n: layout.slots.filter((s) => s.kind !== "board").length }) : fill(words.say.sample, filled));
  }
  if (spec.event !== undefined) {
    const named = language === "ja" ? spec.event.ja : undefined;
    sentences.push(fill(words.say.event, { event: named?.name ?? spec.event.name, year: spec.event.year, venue: named?.venue ?? spec.event.venue, city: named?.city ?? spec.event.city }));
  }
  sentences.push(spec.basis === "event" ? words.say.basisEvent : words.say.basisRulebook);
  if (venue !== undefined && fit !== undefined) sentences.push(fill(words.say.venue, { venue: venue.name[language], fit: fitSentence(fit, language) }));
  if (stadium !== undefined) sentences.push(words.say.stadium);
  const title = o.title ?? fill(words.say.title, { name: spec.name[language] });
  const description = o.description ?? sentences.join(language === "ja" ? "" : " ");
  const titleId = `${gid}-t`;
  const descId = `${gid}-d`;
  const css = o.style === "none" ? "" : `<style>${style}\n${KYOGIJO_MULTI_STYLE}${crowdStyle === "" ? "" : `\n${crowdStyle}`}</style>`;
  const hallLayer = hallMarkup === "" ? "" : hallMarkup;
  const group = el("g", { class: "ky-mu-layout", transform: move }, floorMarkup + cellsMarkup + over + slotsMarkup);
  const root = el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo ky-multi ky-${spec.sport}${safeClass(o.className) === "" ? "" : ` ${safeClass(o.className)}`}`,
      viewBox: `${num(view.x)} ${num(view.y)} ${num(vw)} ${num(vh)}`,
      role: "img",
      "aria-labelledby": `${titleId} ${descId}`,
      "data-sport": spec.sport,
      "data-layout": spec.id,
      "data-grid": `${spec.rows}x${spec.columns}`,
      "data-look": look,
      "data-floor": spec.floor,
      "data-fit": fit === undefined ? undefined : fit.fits === null ? "maybe" : String(fit.fits),
      "data-stadium": stadium === undefined ? undefined : "on",
      "data-theme": o.theme === "light" || o.theme === "dark" ? o.theme : undefined,
      "data-version": VERSION,
    },
    `<title id="${titleId}">${esc(title)}</title><desc id="${descId}">${esc(description)}</desc>` + css + (defs === "" ? "" : `<defs>${defs}</defs>`) + el("rect", { class: "ky-mu-apron", x: num(view.x), y: num(view.y), width: num(vw), height: num(vh) }) + hallLayer + group + overhang + slotTexts + labelsMarkup,
  );
  const frame: MultiFrame = { layout, hall, lw, lh, ox, oy, turned, to };
  return { svg: root, frame, fit, ...(standing === undefined ? {} : { stands: standing }), lifted, view: { x: view.x, y: view.y, w: vw, h: vh }, title, description };
}

/** Where an empty place is, in words: the surface it belongs to, the side or end it is at, and whether it is on the mats. */
function slotWhere(slot: MultiSlot, layout: MultiLayout, words: (typeof MULTI_WORDS)["en"]): string {
  const where = words.table.where;
  const parts: string[] = [];
  const cell = /^(?:text|logo)-(\d+)(?:-(top|bottom|start|end))?$/.exec(slot.id);
  const common = /^logo-common-(\d+)$/.exec(slot.id);
  const side = /^(?:board|text)-(top|bottom|left|right)$/.exec(slot.id) ?? /^text-(\d+)-(top|bottom)$/.exec(slot.id);
  if (common !== null) parts.push(layout.cells[Number(common[1]) - 1].label, where.common);
  else if (cell !== null) {
    parts.push(layout.cells[Number(cell[1]) - 1].label);
    if (cell[2] !== undefined) parts.push(where[cell[2] as "top" | "bottom" | "start" | "end"]);
  } else if (side !== null) parts.push(where[side[side.length - 1] as "top" | "bottom" | "left" | "right"]);
  else if (slot.id === "logo-start") parts.push(where.start);
  else if (slot.id === "logo-end") parts.push(where.end);
  if (slot.onMat) parts.push(words.table.onMat);
  return parts.join(words === MULTI_WORDS.ja ? "、" : ", ");
}

/**
 * The same thing as the picture, as a table: each playing surface with its row, column, place and size in metres, and each empty place for the event's words and marks, under a caption that gives
 * what the layout needs. For a reader who cannot see the drawing, and for a page that wants the figures.
 * @example
 * ```ts
 * import { multiTable } from "@johnmorrisdotca/kyogijo-stadiums/multi";
 * const table = multiTable({ preset: "tabletennis-4" });
 * console.log(table.startsWith("<table"), table.includes("Table 4"));
 * // true true
 * ```
 */
export function multiTable(options: MultiOptions = {}): string {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const words = MULTI_WORDS[language];
  const layout = multiLayout(options);
  const t = words.table;
  const m = (ft: number): string => multiNumber(metres(ft), language);
  const head = `<thead><tr><th scope="col">${esc(t.surface)}</th><th scope="col">${esc(t.row)}</th><th scope="col">${esc(t.column)}</th><th scope="col">${esc(t.x)}</th><th scope="col">${esc(t.y)}</th><th scope="col">${esc(t.size)}</th></tr></thead>`;
  const rows = layout.cells.map((c) => `<tr><th scope="row">${esc(c.label)}</th><td>${c.row + 1}</td><td>${c.column + 1}</td><td>${m(c.x)}</td><td>${m(c.y)}</td><td>${m(c.w)} × ${m(c.h)}</td></tr>`).join("");
  const slotRows = options.slots === false ? "" : layout.slots.map((s) => `<tr><th scope="row">${esc(t.slot)}: ${esc(slotText(s, words))}</th><td colspan="2">${esc(slotWhere(s, layout, words))}</td><td>${m(s.x)}</td><td>${m(s.y)}</td><td>${m(s.w)} × ${m(s.h)}</td></tr>`).join("");
  const caption = language === "ja" ? `${fill(t.caption, { name: layout.spec.name[language] })}。必要な床：${needsSentence(layout.needs, language)}` : `${fill(t.caption, { name: layout.spec.name[language] })} ${needsSentence(layout.needs, language)}`;
  return `<table class="ky-table" data-kind="multi"><caption>${esc(caption)}</caption>${head}<tbody>${rows}${slotRows}</tbody></table>`;
}

/** The hall of a layout as the drawing sets it, for a page that wants to say so: the venue, its fit, and the floor the layout needs. */
export function multiSetting(options: MultiOptions): { venue: MultiVenue | undefined; fit: MultiFit | undefined; layout: MultiLayout } {
  const layout = multiLayout(options);
  const venue = venueOf(options.venue);
  return { venue, fit: venue === undefined ? undefined : multiFit(layout, venue), layout };
}
