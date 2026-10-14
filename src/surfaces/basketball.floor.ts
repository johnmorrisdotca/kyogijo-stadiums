// The layers of a realistic (`hardwood`) basketball floor: the wood and its boards under the paint, the stained border, and over the paint the seams and the satin sheen.
// The paint of the keys and the circle is laid between the two by the court's builder, translucent, so the boards show through it as they do through a stained key.
import { el, num } from "../format.ts";
import { floorTiles, type Hardwood } from "../hardwood.ts";
import { ft, type BuildOptions } from "./surface.ts";

/** Where the floor stands: the court's length and width, the border's width, and the prefix of the ids. */
export interface FloorGeo {
  L: number;
  W: number;
  bw: number;
  /** The ground drawn beyond the court's lines. */
  margin: number;
  id: string;
}

/** The floor in layers: the defs (the tiles and the sheen), what lies under the paint, and what lies over it. */
export interface Floor {
  defs: string;
  under: string;
  over: string;
}

const stop = (offset: number, colour: string, opacity: number, strength: number): string => el("stop", { offset, "stop-color": colour, "stop-opacity": num(Math.min(1, opacity * strength)) });

/** A gradient laid out in the drawing's own feet from `(x1, y1)` to `(x2, y2)`; its stops are `[offset, colour, opacity]`. */
function gradient(id: string, from: [number, number], to: [number, number], stops: readonly (readonly [number, string, number])[], strength: number): string {
  return el("linearGradient", { id, gradientUnits: "userSpaceOnUse", x1: from[0], y1: from[1], x2: to[0], y2: to[1] }, stops.map(([offset, colour, opacity]) => stop(offset, colour, opacity, strength)).join(""));
}

/**
 * The wood, the boards and the border, under the paint, and the seams and the sheen over it. The border is stain over the same wood: its sides in the border's colour,
 * and the strip behind each baseline in the colour of the team that defends it (the `--ky-hw-end-left` and `-right` of the drawing, else the border's).
 */
export function hardwoodFloor(h: Hardwood, g: FloorGeo, o: BuildOptions): Floor {
  const { L, W, bw, id, margin } = g;
  const all = { x: -bw, y: -bw, width: L + 2 * bw, height: W + 2 * bw };
  const tiles = floorTiles(h);
  const pattern = (suffix: string, body: string): string => el("pattern", { id: `${id}-hw-${suffix}`, width: 96, height: num(tiles.height), patternUnits: "userSpaceOnUse" }, body);
  // Where the floor meets the ground round it, a soft shade a few feet deep, as a floor lit from above falls off at its edge.
  const reach = h.fine ? Math.min(2.2, Math.max(0, margin - bw)) : 0;
  const fade = (suffix: string, from: [number, number], to: [number, number]): string => gradient(`${id}-hw-${suffix}`, from, to, [[0, "#000", 0.16], [0.35, "#000", 0.05], [1, "#000", 0]], 1);
  const strip = (suffix: string, x: number, y: number, width: number, height: number): string => el("rect", { class: "ky-hw", x: num(x), y: num(y), width: num(width), height: num(height), fill: `url(#${id}-hw-${suffix})` });
  const wide = L + 2 * margin;
  const defs =
    pattern("a", tiles.under) +
    (tiles.over === "" ? "" : pattern("b", tiles.over)) +
    (reach <= 0 ? "" : fade("e1", [0, -bw], [0, -bw - reach]) + fade("e2", [0, W + bw], [0, W + bw + reach]) + fade("e3", [-bw, 0], [-bw - reach, 0]) + fade("e4", [L + bw, 0], [L + bw + reach, 0]));
  let under = reach <= 0 ? "" : strip("e1", -margin, -bw - reach, wide, reach) + strip("e2", -margin, W + bw, wide, reach) + strip("e3", -bw - reach, -bw, reach, W + 2 * bw) + strip("e4", L + bw, -bw, reach, W + 2 * bw);
  under += el("rect", { class: ft(o, "floor", "ky-surface"), ...all });
  under += el("rect", { class: "ky-hw", ...all, fill: `url(#${id}-hw-a)` });
  // The border: sides, then the strip behind each baseline, stained so that the boards show through.
  const sides = `M0 ${-bw}H${num(L)}V0H0ZM0 ${num(W)}H${num(L)}V${num(W + bw)}H0Z`;
  under += el("path", { class: ft(o, "border", "ky-boards"), d: sides, "fill-opacity": num(h.stain) });
  under += el("path", { class: ft(o, "border", "ky-boards ky-hw-end-l"), d: `M${-bw} ${-bw}H0V${num(W + bw)}H${-bw}Z`, "fill-opacity": num(h.stain) });
  under += el("path", { class: ft(o, "border", "ky-boards ky-hw-end-r"), d: `M${num(L)} ${-bw}H${num(L + bw)}V${num(W + bw)}H${num(L)}Z`, "fill-opacity": num(h.stain) });

  let over = tiles.over === "" ? "" : el("rect", { class: "ky-hw", ...all, fill: `url(#${id}-hw-b)` });
  // The sheen: light along the middle and a darker fall-off at the edges, and a few broad diagonal glints, as a lacquered floor shows under the lights.
  if (h.sheen > 0) {
    const s = h.sheen;
    const names = h.fine ? (["s1", "s2", "s3"] as const) : (["s1", "s2"] as const);
    const defsOf = [
      gradient(`${id}-hw-s1`, [0, -bw], [0, W + bw], [[0, "#000", 0.22], [0.16, "#000", 0.03], [0.3, "#000", 0], [0.5, "#fff", 0.1], [0.7, "#fff", 0], [0.86, "#000", 0.02], [1, "#000", 0.24]], s),
      gradient(`${id}-hw-s2`, [-bw, 0], [L + bw, 0], [[0, "#000", 0.18], [0.1, "#000", 0], [0.5, "#fff", 0.05], [0.9, "#000", 0], [1, "#000", 0.18]], s),
      ...(h.fine ? [gradient(`${id}-hw-s3`, [0, -bw], [L * 0.55, W + bw], [[0, "#fff", 0], [0.17, "#fff", 0], [0.21, "#fff", 0.06], [0.25, "#fff", 0], [0.46, "#fff", 0], [0.5, "#fff", 0.075], [0.54, "#fff", 0], [0.75, "#fff", 0], [0.8, "#fff", 0.05], [0.84, "#fff", 0], [1, "#fff", 0]], s)] : []),
    ];
    over += names.map((n) => el("rect", { class: "ky-hw", ...all, fill: `url(#${id}-hw-${n})` })).join("");
    return { defs: defs + defsOf.join(""), under, over };
  }
  return { defs, under, over };
}

/** A word centred on `(x, y)`, turned `angle` degrees in the court's own frame (the drawing's turn to lie tall comes on top of it). */
function word(o: BuildOptions, x: number, y: number, text: string, size: number, angle: number, weight: number, spacing: number): string {
  return el(
    "text",
    {
      class: `ky-text ${ft(o, "baseline-text", "ky-baseline")}`,
      x: num(x),
      y: num(y + size * 0.36),
      "font-size": size,
      "font-weight": weight,
      "letter-spacing": spacing,
      "text-anchor": "middle",
      transform: angle === 0 ? undefined : `rotate(${num(angle)} ${num(x)} ${num(y)})`,
    },
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  );
}

/**
 * The words of a hardwood floor, each centred in its strip: the baseline words behind each baseline and the sideline words in the border's sides. Where the drawing is
 * turned a quarter to lie tall, the baseline words are turned back to read left to right, and the sideline words run along their strips, the bottom one up the page.
 */
export function hardwoodWords(o: BuildOptions, g: FloorGeo, turned: boolean, sidelines: [string, string] | undefined): string {
  const { L, W, bw } = g;
  const cy = W / 2;
  let out = "";
  const base = o.court?.baselineText;
  if (base !== undefined) {
    // Off the middle, where the stanchion's arm crosses the border: the far side from the arm, each end opposite the other as a painted floor is.
    out += word(o, -bw / 2, cy + W * 0.27, base[0], 1.9, -90, 800, 0.4);
    out += word(o, L + bw / 2, cy - W * 0.27, base[1], 1.9, turned ? -90 : 90, 800, 0.4);
  }
  if (sidelines !== undefined) {
    out += word(o, L / 2, -bw / 2, sidelines[0], 1.5, 0, 700, 0.35);
    out += word(o, L / 2, W + bw / 2, sidelines[1], 1.5, turned ? 180 : 0, 700, 0.35);
  }
  return out;
}
