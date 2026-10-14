// What every pool is painted with: the light on the water (a few seeded curves in a tile, defined once and repeated by a pattern), the tiles of the floor and of the deck, the lane ropes as rows
// of floats, and the small helpers of a drawing made in feet from figures in metres. No random number: the curves come from a small generator that starts from the pool's `seed`, so the same options
// draw the same light. The rules say nothing of how water or a deck looks; these colours and patterns are ours.
import { el, num } from "./format.ts";
import { feet } from "./pool.ts";
import type { DeckLook, PoolLook } from "./pool.types.ts";
import { ft, type BuildOptions } from "./surfaces/surface.ts";

/** A small generator of numbers from 0 up to 1 that starts from a seed (mulberry32): the same seed gives the same list. */
export function seeded(seed: number): () => number {
  let a = (Math.trunc(seed) ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The side of the tile of light, in feet (about 5 m). */
export const CAUSTIC_TILE = 16;

/** A smooth closed curve through points (Catmull-Rom as cubic curves), as a path. */
function loop(points: readonly (readonly [number, number])[]): string {
  const n = points.length;
  let d = `M${num(points[0][0])} ${num(points[0][1])}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${num(c1[0])} ${num(c1[1])} ${num(c2[0])} ${num(c2[1])} ${num(p2[0])} ${num(p2[1])}`;
  }
  return `${d}Z`;
}

/**
 * The light on the water: a tile of closed, softly bent cells like the net of light at the bottom of a pool, from the seed. The cells at the tile's edge are drawn again on the far side, so that the
 * tile repeats without a seam. Returns the path of all of them.
 */
export function causticPath(seed: number, size = CAUSTIC_TILE): string {
  const rand = seeded(seed);
  const cells = 4;
  const step = size / cells;
  const parts: string[] = [];
  for (let i = 0; i < cells; i += 1) {
    for (let j = 0; j < cells; j += 1) {
      const cx = (i + 0.5 + (rand() - 0.5) * 0.45) * step;
      const cy = (j + 0.5 + (rand() - 0.5) * 0.45) * step;
      const sides = 6;
      const turn = rand() * Math.PI;
      const points: [number, number][] = [];
      for (let k = 0; k < sides; k += 1) {
        const angle = turn + (k / sides) * 2 * Math.PI + (rand() - 0.5) * 0.5;
        const r = step * (0.42 + rand() * 0.16);
        points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.9]);
      }
      const reach = step * 0.7;
      for (const dx of [-size, 0, size]) {
        for (const dy of [-size, 0, size]) {
          if (cx + dx + reach < 0 || cx + dx - reach > size || cy + dy + reach < 0 || cy + dy - reach > size) continue;
          parts.push(loop(points.map(([x, y]) => [x + dx, y + dy] as [number, number])));
        }
      }
    }
  }
  return parts.join("");
}

/** The ids of what a pool defines for its paint. */
export interface PoolIds {
  caustic: string;
  floor: string;
  deck: string;
  water: string;
}

/** What a pool is drawn with when it is one of several in a hall: the ids of the paint the hall defines once, and no deck, no defs, no plates and no section of its own. */
export interface PoolCtx {
  ids?: PoolIds;
  bare?: boolean;
}

/** The ids a drawing's pools share: they follow the drawing's own prefix. */
export const poolIds = (id: string): PoolIds => ({ caustic: `${id}-lt`, floor: `${id}-ft`, deck: `${id}-dt`, water: `${id}-wg` });

/** The metres of a tile of the floor (drawn; real tiles are finer) and of the deck. */
export const FLOOR_TILE = 0.5;
export const DECK_TILE = 0.6;

/**
 * The patterns and the gradient a pool's paint needs, for a look and a deck. Each is defined once, however many pools use it. A flat pool with a plain deck needs none.
 */
export function paintDefs(ids: PoolIds, look: PoolLook, deck: DeckLook, seed: number): string {
  let defs = "";
  if (look !== "flat") {
    defs += el(
      "linearGradient",
      { id: ids.water, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, class: "ky-pl-sa" }) + el("stop", { offset: 0.5, class: "ky-pl-sb" }) + el("stop", { offset: 1, class: "ky-pl-sa" }),
    );
    defs += el("pattern", { id: ids.caustic, width: CAUSTIC_TILE, height: CAUSTIC_TILE, patternUnits: "userSpaceOnUse" }, el("path", { class: "ky-pl-lt", d: causticPath(seed) }));
  }
  if (look === "tiled") {
    const t = feet(FLOOR_TILE);
    defs += el("pattern", { id: ids.floor, width: t, height: t, patternUnits: "userSpaceOnUse" }, el("path", { class: "ky-pl-ft", d: `M0 0H${num(t)}M0 0V${num(t)}` }));
  }
  if (deck === "tiled") {
    const t = feet(DECK_TILE);
    defs += el("pattern", { id: ids.deck, width: t * 2, height: t * 2, patternUnits: "userSpaceOnUse" }, el("rect", { class: "ky-pl-da", x: 0, y: 0, width: t, height: t }) + el("rect", { class: "ky-pl-da", x: t, y: t, width: t, height: t }) + el("path", { class: "ky-pl-dt", d: `M0 0H${num(t * 2)}M0 ${num(t)}H${num(t * 2)}M0 0V${num(t * 2)}M${num(t)} 0V${num(t * 2)}` }));
  }
  return defs;
}

/** A rectangle in metres from its corners, as feet. */
export function box(o: Pick<BuildOptions, "features">, names: string | readonly string[], cls: string, x0: number, y0: number, x1: number, y1: number, more: Record<string, string | number | undefined> = {}): string {
  return el("rect", { class: ft(o, names, cls), x: feet(x0), y: feet(y0), width: feet(x1 - x0), height: feet(y1 - y0), ...more });
}

/**
 * The water of a pool, in metres from the corner `(x, y)`: the colour, then, for a look that has it, the gradient across the lanes, the floor's tiles and the light on the water. Tiles and light are
 * laid at the pool's own place, so that two pools side by side show one floor.
 */
export function waterMarkup(o: Pick<BuildOptions, "features">, ids: PoolIds, look: PoolLook, x: number, y: number, length: number, width: number, clip?: string): string {
  const at = { x: feet(x), y: feet(y), width: feet(length), height: feet(width), "clip-path": clip };
  let out = el("rect", { class: ft(o, "water", "ky-surface"), x: at.x, y: at.y, width: at.width, height: at.height });
  if (look !== "flat") out += el("rect", { class: "ky-pl-wg", ...at, fill: `url(#${ids.water})` });
  if (look === "tiled") out += el("rect", { class: "ky-pl-tl", ...at, fill: `url(#${ids.floor})` });
  if (look !== "flat") out += el("rect", { class: "ky-pl-ls", ...at, fill: `url(#${ids.caustic})` });
  return out;
}

/** The deck as a rectangle in feet: the colour, then its tiles. */
export function deckMarkup(o: Pick<BuildOptions, "features">, ids: PoolIds, deck: DeckLook, x: number, y: number, w: number, h: number): string {
  let out = el("rect", { class: ft(o, "apron", "ky-apron"), x, y, width: w, height: h });
  if (deck === "tiled") out += el("rect", { class: "ky-pl-dk", x, y, width: w, height: h, fill: `url(#${ids.deck})` });
  return out;
}

/** The widths a pool draws at: a rope is at least this wide on the page unless the true widths are asked for. */
export function leastWidth(o: Pick<BuildOptions, "exact">, trueMetres: number, drawnMetres: number): number {
  return feet(o.exact ? trueMetres : Math.max(trueMetres, drawnMetres));
}

/** The order ropes' colours are drawn in: the lane's own colour, then the red ends and the distinct marks over it. */
const ROPE_ORDER: readonly string[] = ["green", "blue", "yellow", "red", "white"];

/**
 * A row of lane ropes as one path per colour: each rope's runs of floats as round dots at the pitch of the floats. `runs` are `[colour, x0, x1, y]` in metres. Round caps on a dash of no length make a dot,
 * so a rope of 330 floats is one subpath. A float is `metres` across, drawn at least `drawn` metres across.
 */
export function ropeMarkup(o: Pick<BuildOptions, "features" | "exact">, runs: readonly (readonly [string, number, number, number])[], metres: number, drawn: number): string {
  const by = new Map<string, string[]>();
  for (const [colour, x0, x1, y] of runs) by.set(colour, [...(by.get(colour) ?? []), `M${num(feet(x0))} ${num(feet(y))}H${num(feet(x1))}`]);
  const width = leastWidth(o, metres, drawn);
  let out = "";
  for (const colour of ROPE_ORDER) {
    const d = by.get(colour);
    if (d === undefined) continue;
    out += el("path", { class: ft(o, [`rope-${colour}`, "lane-ropes"], `ky-pl-r ky-pl-r-${colour}`), d: d.join(""), "stroke-width": width, "stroke-dasharray": `0 ${num(width * 0.86)}`, fill: "none" });
  }
  return out;
}
