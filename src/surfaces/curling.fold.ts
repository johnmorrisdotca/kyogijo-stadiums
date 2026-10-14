// The folded curling sheet: the whole sheet as a strip, and the two houses enlarged beside it, so that a sheet 150 feet long and 15 wide fills a roughly square frame. As a
// tall drawing the top house is enlarged on the left of the strip and the bottom house on the right; as a wide one the left house is above the strip and the right house below it.
// The layout is worked out here, in the sheet's wide frame, and the builder only draws it. Written for this package.
import { el, num } from "../format.ts";
import type { SheetSpec } from "../leagues/curling.ts";
import { textWidth } from "../text.ts";

/** The ground, in feet, between the strip and each panel, across which the panel is joined to the part of the strip it enlarges. */
const GAP = 4;
/** The width of the boards round the ice, as the sheet draws them. */
const BOARD = 0.7;
/** The ice kept beyond the lines of the part of an end that a panel shows. */
const ALONG = 1.5;

/** A box in the sheet's wide frame, in feet. */
interface Wide {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One enlarged end. */
export interface FoldPanel {
  end: "left" | "right";
  /** The part of the sheet it shows, in the sheet's own feet (the boards included across it). */
  crop: Wide;
  /** Where it is drawn, in the wide frame of the whole drawing. */
  box: Wide;
  /** The transform of the part of the sheet that fills it, and the id of the clip that cuts it to `crop`. */
  transform: string;
  clip: string;
  /** Where along the sheet, in the wide frame of the drawing, the blank ice between the house and the hog line is centred: a label stands there. Missing when the panel holds only the house. */
  free?: number;
}

/** The folded layout of a sheet. */
export interface FoldPlan {
  /** How much larger than the strip each panel is drawn. */
  scale: number;
  /** The viewBox of the drawing as it lies wide: the strip is at y = 0 to the sheet's width, and the panels are above and below it. */
  view: Wide;
  /** The left end's panel first and the right end's second. */
  panels: [FoldPanel, FoldPanel];
}

/** What the layout is worked out from. */
export interface FoldOptions {
  /** What each panel holds: the half from the hog line to the back line, or the house. */
  panels: "half" | "house";
  /** The width of the drawing as the eye sees it over its height. */
  fit: number;
  /** The ground round the whole, in feet. */
  margin: number;
  /** True when the drawing lies tall: its panels are then at its left and right, and the left end's is at the left. */
  turned: boolean;
  /** A prefix for the ids of the clips. */
  id: string;
}

/** The part of the sheet an end's panel shows, in the sheet's own feet along it (the boards included across it). */
export function foldCrop(spec: SheetSpec, tee: number, end: "left" | "right", panels: "half" | "house"): Wide {
  const [twelve] = spec.rings;
  const hogW = spec.lineWidths.hog;
  const outer = panels === "half" ? spec.hogLine + hogW : twelve;
  const x0 = end === "left" ? tee - spec.backLine - ALONG : tee - outer - ALONG;
  const x1 = end === "left" ? tee + outer + ALONG : tee + spec.backLine + ALONG;
  return { x: x0, y: -BOARD, w: x1 - x0, h: spec.width + 2 * BOARD };
}

/**
 * Where everything of a folded sheet goes. The strip keeps its own place (x along the sheet from 0 to its length, y across it from 0), so that a data layer's numbers are the same
 * on the strip as on a sheet drawn whole; each panel is the same drawing at a larger scale, which is chosen so that the whole has the shape asked for (`fit`), and which
 * is never less than the strip's own nor wider than the strip.
 */
export function foldPlan(spec: SheetSpec, tees: readonly [number, number], o: FoldOptions): FoldPlan {
  const across = spec.width + 2 * BOARD;
  const crops = [foldCrop(spec, tees[0], "left", o.panels), foldCrop(spec, tees[1], "right", o.panels)] as const;
  const whole = spec.length + 2 * o.margin;
  // The height of the whole as the drawing lies wide: the strip, two panels and the ground round them. The eye's width over height is `fit`, which a tall drawing turns the other way.
  const ratio = o.turned ? o.fit : 1 / o.fit;
  const wanted = (ratio * whole - 2 * o.margin - 2 * GAP - across) / (2 * across);
  const widest = Math.min(spec.length / crops[0].w, spec.length / crops[1].w);
  const scale = Math.max(1, Math.min(wanted, widest));
  const high = across * scale;
  // The left end is at the bottom of a drawing that lies wide when it is to be turned, because the turn sends the bottom to the left.
  const tops: ["left" | "right", "left" | "right"] = o.turned ? ["right", "left"] : ["left", "right"];
  const make = (end: "left" | "right"): FoldPanel => {
    const crop = crops[end === "left" ? 0 : 1];
    const w = crop.w * scale;
    const top = tops[0] === end;
    const x = end === "left" ? -BOARD : spec.length + BOARD - w;
    const y = top ? -BOARD - GAP - high : spec.width + BOARD + GAP;
    // The blank ice of a half: between the outer edge of the house and the hog line, towards the middle of the sheet.
    const toward = end === "left" ? 1 : -1;
    const mid = tees[end === "left" ? 0 : 1] + (toward * (spec.rings[0] + spec.hogLine)) / 2;
    return {
      free: o.panels === "half" ? x + (mid - crop.x) * scale : undefined,
      end,
      crop,
      box: { x, y, w, h: high },
      transform: `matrix(${num(scale)} 0 0 ${num(scale)} ${num(x - crop.x * scale)} ${num(y + BOARD * scale)})`,
      clip: `${o.id}-fold-${end}`,
    };
  };
  const left = make("left");
  const right = make("right");
  const top = Math.min(left.box.y, right.box.y);
  const bottom = Math.max(left.box.y, right.box.y) + high;
  return { scale, view: { x: -o.margin, y: top - o.margin, w: whole, h: bottom - top + 2 * o.margin }, panels: [left, right] };
}

/** The clips of the panels: each cuts the sheet to the part its panel shows. */
export const foldClips = (plan: FoldPlan): string => plan.panels.map((p) => el("clipPath", { id: p.clip }, el("rect", { x: num(p.crop.x), y: num(p.crop.y), width: num(p.crop.w), height: num(p.crop.h) }))).join("");

/** The sheet's own markup laid in each panel, cut to the part the panel shows. */
export const foldCopies = (plan: FoldPlan, markup: string): string => plan.panels.map((p) => el("g", { class: "ky-fold", transform: p.transform, "clip-path": `url(#${p.clip})` }, markup)).join("");

/**
 * What joins each panel to the part of the strip it enlarges: a faint fan from the panel's edge to that part, and a frame round the part, as an inset on a map is joined to what it shows.
 * The panels' own frames are drawn here too.
 */
export function foldLinks(plan: FoldPlan, sheetWidth: number): string {
  let out = "";
  for (const p of plan.panels) {
    const above = p.box.y < 0;
    const edge = above ? p.box.y + p.box.h : p.box.y;
    const meet = above ? -BOARD : sheetWidth + BOARD;
    const { x: a, w } = p.crop;
    out += el("path", { class: "ky-fold-link", d: `M${num(p.box.x)} ${num(edge)}L${num(a)} ${num(meet)}H${num(a + w)}L${num(p.box.x + p.box.w)} ${num(edge)}Z` });
    out += el("path", { class: "ky-fold-edge", fill: "none", d: `M${num(p.box.x)} ${num(edge)}L${num(a)} ${num(meet)}M${num(p.box.x + p.box.w)} ${num(edge)}L${num(a + w)} ${num(meet)}` });
    out += el("rect", { class: "ky-fold-hl", x: num(a), y: num(-BOARD), width: num(w), height: num(sheetWidth + 2 * BOARD) });
    out += el("rect", { class: "ky-fold-frame", x: num(p.box.x), y: num(p.box.y), width: num(p.box.w), height: num(p.box.h) });
  }
  return out;
}

/**
 * The label of each panel, in a small plate that is upright whichever way the drawing lies. It stands in the free ground beyond the panel's far end, in line with the panel's middle (the
 * panels are as long as the strip allows, not as long as the frame, so there is room there); when there is none, over the blank ice of a half between the house and the hog line.
 * `labels` are the words for the left end's panel and the right end's.
 */
export function foldLabels(plan: FoldPlan, labels: readonly [string, string], turned: boolean): string {
  const size = Math.max(1.2, Math.min(5.5, 0.03 * Math.max(plan.view.w, plan.view.h)));
  const inset = size * 0.6;
  const high = size * 1.9;
  return plan.panels
    .map((p, i) => {
      const wide = textWidth(labels[i]) * size + size * 1.6;
      // The plate's length along the sheet is its height when the drawing is turned.
      const extent = turned ? high : wide;
      const room = p.end === "left" ? plan.view.x + plan.view.w - (p.box.x + p.box.w) : p.box.x - plan.view.x;
      const beyond = room >= extent + 2 * inset;
      const cy = p.box.y + p.box.h / 2;
      const cx = beyond ? (p.end === "left" ? p.box.x + p.box.w + inset + extent / 2 : p.box.x - inset - extent / 2) : (p.free ?? p.box.x + p.box.w / 2);
      const plate = el("rect", { class: "ky-fold-pill", x: num(-wide / 2), y: num(-high / 2), width: num(wide), height: num(high), rx: num(size * 0.4) });
      const text = el("text", { class: "ky-text ky-fold-t", x: 0, y: num(size * 0.36), "text-anchor": "middle", "font-size": num(size), "font-weight": 700 }, labels[i].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      return el("g", { class: "ky-fold-label", transform: `translate(${num(cx)} ${num(cy)})${turned ? " rotate(-90)" : ""}` }, plate + text);
    })
    .join("");
}
