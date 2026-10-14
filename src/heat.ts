// The heat layers: a binned statistic on a grid over the surface, on hexagons, by named zone, as density contours, and the legend that reads
// them. Each is cut to the surface's outline like every other layer, in a colour ramp that holds in a light and a dark page, with a table of
// its numbers and a summary that names the hottest cells or zones. Written for this package; hockey_rink and mplsoccer were read for the list of
// charts to match (their docs, not their code), and the zone sets are documented in docs/sources.md.
import { esc, num } from "./format.ts";
import { FRAMES } from "./frames.ts";
import { resolveRamp, stepOf, type ResolvedRamp } from "./heat.colour.ts";
import {
  binGrid,
  contourRings,
  densityAt,
  densityGrid,
  gridValues,
  hexBins,
  hexCorners,
  massThresholds,
  needsValues,
  newBin,
  niceTicks,
  reduceBin,
  scottBandwidth,
  uniformEdges,
  type Bin,
  type Density,
  type HexOrientation,
  type Sample,
  type StatisticName,
} from "./heat.stats.ts";
import type { ContourLayer, HeatBase, HeatLabels, HeatLegend, HeatmapLayer, HexbinLayer, LegendLayer, ZonesLayer } from "./heat.types.ts";
import { buildZoneSet, type ZoneSet } from "./heat.zones.ts";
import { clamp01, isNum, markAttrs, newMade, opacityOf, place, placeBack, toArray, unitOfLayer, type Env, type Made } from "./layers.env.ts";
import { rampColour, type P } from "./layers.marks.ts";
import type { LayerBase } from "./layers.types.ts";
import { fill } from "./strings.ts";
import { textWidth } from "./text.ts";
import type { Box } from "./types.ts";
import { FEET_PER, type Unit } from "./units.ts";

/** The layers this file draws, except the legend. */
export type HeatLayer = HeatmapLayer | HexbinLayer | ZonesLayer | ContourLayer;

type Words = Env["words"]["layers"];

/** Outcomes that count as a success for the `rate` statistic, unless the layer says. */
const SUCCESS = Object.freeze(["made", "goal", "scored", "hit", "complete", "success", "won"]);
/** The part of a sequential ramp left unused at its pale end, so that the least value present is still a colour and not the ground. */
const FLOOR = 0.2;
const MAX_LABELS = 600;
const STEPS = 9;

/** One drawn cell, hexagon, zone or contour band. */
interface Item {
  d: string;
  cx: number;
  cy: number;
  value: number | null;
  n: number;
  hits: number;
  name?: string;
  id?: string;
  /** The smaller side of a cell, for the size of its label. */
  side: number;
  /** For a zone: how wide and high a label can be, in feet. */
  room?: P;
}

/** What a heat layer computed from its data, before it is drawn. */
interface Computed {
  items: Item[];
  /** The statistic as it is called to a reader. */
  stat: string;
  /** True when the values are percents (the statistic, or the normalisation, says so). */
  percent: boolean;
  total: number;
  outside: number;
  skipped: number;
  placed: number;
  /** For a contour layer: what the bands are. */
  contour?: { levels: { label: number; threshold: number; d: string; inside: number }[]; peak: P; mass: boolean; filled: boolean };
  /** The names of the things drawn, for the summary: `cells`, `hexagons`, `zones` or `bands`. */
  noun: "cells" | "hexagons" | "zones" | "bands";
  zones?: ZoneSet;
}

/** The statistic of a layer. */
function statisticOf(layer: HeatBase): StatisticName | ((values: readonly number[], info: { count: number; hits: number; total: number }) => number | null) {
  const s = layer.statistic ?? "count";
  if (typeof s !== "function" && !["count", "sum", "mean", "median", "percent", "max", "min", "rate"].includes(s)) throw new RangeError(`Unknown statistic "${String(s)}": use count, sum, mean, median, percent, max, min, rate or a function`);
  return s;
}

function statName(layer: HeatBase, words: Words): string {
  if (typeof layer.statisticName === "string" && layer.statisticName.trim() !== "") return layer.statisticName.trim();
  const s = layer.statistic ?? "count";
  return words.stat[typeof s === "function" ? "custom" : s];
}

const isPercent = (layer: HeatBase): boolean => layer.statistic === "percent" || layer.statistic === "rate" || layer.normalize === "percent";

/** The marks of a layer that have a place, placed on the surface (feet), with the number and the success each carries. */
function samplesOf(layer: HeatBase & { kind: string }, env: Env, unit: Unit, weights?: boolean): { samples: Sample[]; weights: number[] | undefined; skipped: number } {
  const data = toArray(layer.data, `a ${layer.kind} layer`);
  const success = new Set((layer.success ?? SUCCESS).map((word) => String(word).toLowerCase()));
  const keep: number[] = [];
  const raw: P[] = [];
  let skipped = 0;
  data.forEach((d, i) => {
    if (typeof d === "object" && d !== null && isNum(d.x) && isNum(d.y)) {
      keep.push(i);
      raw.push([d.x, d.y]);
    } else skipped += 1;
  });
  const at = place(layer, env, raw, unit);
  const samples = keep.map((i, j): Sample => {
    const d = data[i];
    return { x: at[j][0], y: at[j][1], value: isNum(d.value) ? d.value : null, hit: typeof d.outcome === "string" && success.has(d.outcome.toLowerCase()), index: i };
  });
  return { samples, weights: weights === true ? samples.map((s) => (isNum(s.value) && s.value > 0 ? s.value : 0)) : undefined, skipped };
}

/** Whether any of a shape's reference points is on the surface (a cell at the edge is kept and cut by the clip). */
const touches = (env: Env, points: readonly P[]): boolean => points.some(([x, y]) => env.outline.contains(x, y));

/** Edges a layer gives along one axis (a list in its own coordinates) as edges on the surface. */
function edgesOnSurface(layer: LayerBase, env: Env, unit: Unit, list: readonly number[], axis: 0 | 1): number[] {
  if (!list.every(isNum) || list.length < 2) throw new RangeError("a list of bin edges has at least two numbers");
  const probe: P[] = list.map((v): P => (axis === 0 ? [v, 0] : [0, v]));
  const placed = place({ ...layer, limits: undefined }, env, probe, unit).map((p) => p[axis]);
  return [...new Set(placed)].sort((a, b) => a - b);
}

/** The range of an `extent` on the surface. */
function rangeOnSurface(layer: LayerBase, env: Env, unit: Unit, given: readonly [number, number] | undefined, axis: 0 | 1, whole: readonly [number, number]): [number, number] {
  if (given === undefined) return [whole[0], whole[1]];
  const edges = edgesOnSurface(layer, env, unit, given, axis);
  return [edges[0], edges[edges.length - 1]];
}

function normalised(values: (number | null)[], mode: HeatBase["normalize"]): (number | null)[] {
  if (mode === undefined || mode === "none") return values;
  const present = values.filter((v): v is number => v !== null);
  const top = present.length === 0 ? 0 : Math.max(...present.map(Math.abs));
  const total = present.reduce((a, b) => a + b, 0);
  const divisor = mode === "max" ? top : total;
  if (!(divisor !== 0)) return values.map(() => null);
  return values.map((v) => (v === null ? null : mode === "percent" ? (100 * v) / divisor : v / divisor));
}

const cap = (n: number): number => Math.max(1, Math.min(400, Math.round(n)));

function gridCells(layer: HeatmapLayer, env: Env, unit: Unit): Computed {
  const box = env.shown;
  const { samples, skipped } = samplesOf(layer, env, unit);
  const xr = rangeOnSurface(layer, env, unit, layer.extent?.x, 0, [box.x, box.x + box.w]);
  const yr = rangeOnSurface(layer, env, unit, layer.extent?.y, 1, [box.y, box.y + box.h]);
  const w = xr[1] - xr[0];
  const h = yr[1] - yr[0];
  if (!(w > 0 && h > 0)) throw new RangeError("a heat map's extent has a width and a height");
  const spec = layer.bins ?? 24;
  const along = (v: number | readonly number[] | undefined, fallback: number, axis: 0 | 1): number[] =>
    typeof v === "number" ? uniformEdges(axis === 0 ? xr[0] : yr[0], axis === 0 ? xr[1] : yr[1], cap(v)) : Array.isArray(v) ? edgesOnSurface(layer, env, unit, v as number[], axis) : uniformEdges(axis === 0 ? xr[0] : yr[0], axis === 0 ? xr[1] : yr[1], cap(fallback));
  let xEdges: number[];
  let yEdges: number[];
  const squareX = w >= h ? 1 : w / h;
  const squareY = h >= w ? 1 : h / w;
  if (typeof spec === "number") {
    xEdges = along(spec * squareX, spec, 0);
    yEdges = along(spec * squareY, spec, 1);
  } else if (Array.isArray(spec) && spec.length === 2 && typeof spec[0] === "number") {
    xEdges = along(spec[0], 24, 0);
    yEdges = along(spec[1], 24, 1);
  } else {
    const object = spec as { x?: number | readonly number[]; y?: number | readonly number[] };
    const nx = typeof object.x === "number" ? object.x : 24;
    xEdges = along(object.x, 24 * squareX, 0);
    yEdges = along(object.y, typeof object.x === "number" ? (nx * h) / w : 24 * squareY, 1);
  }
  const statistic = statisticOf(layer);
  const grid = binGrid(samples, xEdges, yEdges, needsValues(statistic));
  const values = normalised(gridValues(grid, statistic), layer.normalize);
  const minCount = isNum(layer.minCount) ? layer.minCount : 1;
  const items: Item[] = [];
  for (let j = 0; j < grid.ny; j += 1) {
    for (let i = 0; i < grid.nx; i += 1) {
      const bin = grid.bins[j * grid.nx + i];
      const value = values[j * grid.nx + i];
      if (value === null || bin.n < minCount) continue;
      const x0 = xEdges[i];
      const x1 = xEdges[i + 1];
      const y0 = yEdges[j];
      const y1 = yEdges[j + 1];
      if (!touches(env, [[(x0 + x1) / 2, (y0 + y1) / 2], [x0, y0], [x1, y0], [x1, y1], [x0, y1]])) continue;
      items.push({ d: `M${num(x0)} ${num(y0)}h${num(x1 - x0)}v${num(y1 - y0)}h${num(x0 - x1)}z`, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, value, n: bin.n, hits: bin.hits, side: Math.min(x1 - x0, y1 - y0) });
    }
  }
  return { items, stat: statName(layer, env.words.layers), percent: isPercent(layer), total: grid.total, outside: grid.outside, skipped, placed: samples.length, noun: "cells" };
}

function hexCells(layer: HexbinLayer, env: Env, unit: Unit): Computed {
  const box = env.shown;
  const k = FEET_PER[unit];
  const { samples, skipped } = samplesOf(layer, env, unit);
  const size = isNum(layer.size) && layer.size > 0 ? layer.size * k : Math.max(box.w, box.h) / 28;
  const orientation: HexOrientation = layer.orientation === "flat" ? "flat" : "pointy";
  const inside = samples.filter((s) => s.x >= box.x && s.x <= box.x + box.w && s.y >= box.y && s.y <= box.y + box.h);
  const statistic = statisticOf(layer);
  const { cells, total } = hexBins(inside, size, orientation, [box.x, box.y], needsValues(statistic));
  const values = normalised(cells.map((c) => reduceBin(statistic, c.bin, total)), layer.normalize);
  const minCount = isNum(layer.minCount) ? layer.minCount : 1;
  const corners = hexCorners(size, orientation);
  // Every hexagon has the same outline, so its path is the first corner and then the same steps.
  const steps = corners.map(([x, y], i) => (i === 0 ? "" : `l${num(x - corners[i - 1][0])} ${num(y - corners[i - 1][1])}`)).join("");
  const items: Item[] = [];
  cells.forEach((cell, i) => {
    const value = values[i];
    if (value === null || cell.bin.n < minCount) return;
    if (!touches(env, [[cell.cx, cell.cy], ...corners.map(([x, y]): P => [cell.cx + x, cell.cy + y])])) return;
    items.push({ d: `M${num(cell.cx + corners[0][0])} ${num(cell.cy + corners[0][1])}${steps}z`, cx: cell.cx, cy: cell.cy, value, n: cell.bin.n, hits: cell.bin.hits, side: size * 1.5 });
  });
  return { items, stat: statName(layer, env.words.layers), percent: isPercent(layer), total, outside: samples.length - inside.length, skipped, placed: samples.length, noun: "hexagons" };
}

function zoneCells(layer: ZonesLayer, env: Env, unit: Unit): Computed {
  const { samples, skipped } = samplesOf(layer, env, unit);
  const los = isNum(layer.los) ? place({ ...layer, limits: undefined }, env, [[layer.los, 0]], unit)[0][0] : undefined;
  const set = buildZoneSet(layer.zones, {
    o: env.o,
    outline: env.outline,
    direction: layer.direction === "left" ? "left" : "right",
    end: layer.end === "left" || layer.end === "right" ? layer.end : "both",
    los,
    bats: layer.bats === "none" ? undefined : layer.bats === "L" ? "L" : "R",
    words: env.words.layers.zones,
  });
  const statistic = statisticOf(layer);
  const keep = needsValues(statistic);
  const bins: Bin[] = set.zones.map(() => newBin(keep));
  let total = 0;
  let outside = 0;
  for (const s of samples) {
    const z = set.which(s.x, s.y);
    if (z < 0) outside += 1;
    else {
      const bin = bins[z];
      bin.n += 1;
      if (s.hit === true) bin.hits += 1;
      if (isNum(s.value)) {
        bin.nv += 1;
        bin.sum += s.value;
        bin.low = Math.min(bin.low, s.value);
        bin.high = Math.max(bin.high, s.value);
        bin.values?.push(s.value);
      }
      total += 1;
    }
  }
  const values = normalised(bins.map((b) => reduceBin(statistic, b, total)), layer.normalize);
  const minCount = isNum(layer.minCount) ? layer.minCount : 1;
  const items: Item[] = set.zones.map((zone, i) => {
    const bin = bins[i];
    return { d: zone.d, cx: zone.label[0], cy: zone.label[1], value: bin.n >= minCount ? values[i] : null, n: bin.n, hits: bin.hits, name: zone.name, id: zone.id, side: env.base * 4, room: zone.room };
  });
  return { items, stat: statName(layer, env.words.layers), percent: isPercent(layer), total, outside, skipped, placed: samples.length, noun: "zones", zones: set };
}

function contourBands(layer: ContourLayer, env: Env, unit: Unit): Computed {
  const box = env.shown;
  const k = FEET_PER[unit];
  const mass = layer.by === "mass";
  const { samples, weights, skipped } = samplesOf(layer, env, unit, layer.weighted);
  const xr = rangeOnSurface(layer, env, unit, layer.extent?.x, 0, [box.x, box.x + box.w]);
  const yr = rangeOnSurface(layer, env, unit, layer.extent?.y, 1, [box.y, box.y + box.h]);
  const w = xr[1] - xr[0];
  const h = yr[1] - yr[0];
  if (!(w > 0 && h > 0)) throw new RangeError("a contour's extent has a width and a height");
  const used = samples.filter((s, i) => s.x >= xr[0] && s.x <= xr[1] && s.y >= yr[0] && s.y <= yr[1] && (weights === undefined || weights[i] > 0));
  const usedWeights = weights === undefined ? undefined : weights.filter((v, i) => samples[i].x >= xr[0] && samples[i].x <= xr[1] && samples[i].y >= yr[0] && samples[i].y <= yr[1] && v > 0);
  const spec = layer.bandwidth;
  const fallback: [number, number] = [w / 50, h / 50];
  let bw: [number, number];
  if (typeof spec === "number" && spec > 0) bw = [spec * k, spec * k];
  else if (Array.isArray(spec) && spec.length === 2 && isNum(spec[0]) && isNum(spec[1]) && spec[0] > 0 && spec[1] > 0) bw = [spec[0] * k, spec[1] * k];
  else bw = scottBandwidth(used.map((s) => s.x), used.map((s) => s.y), usedWeights);
  const smooth = isNum(layer.smooth) && layer.smooth > 0 ? layer.smooth : 1;
  bw = [(bw[0] > 0 ? bw[0] : fallback[0]) * smooth, (bw[1] > 0 ? bw[1] : fallback[1]) * smooth];
  const nx = layer.grid !== undefined && isNum(layer.grid[0]) ? Math.max(8, Math.min(300, Math.round(layer.grid[0]))) : 100;
  const ny = layer.grid !== undefined && isNum(layer.grid[1]) ? Math.max(8, Math.min(300, Math.round(layer.grid[1]))) : Math.max(24, Math.min(100, Math.round((100 * h) / w)));
  const density: Density = densityGrid(used, { x: xr, y: yr }, nx, ny, bw, usedWeights);
  // The levels, from the lowest density to the highest.
  const count = Array.isArray(layer.levels) ? 0 : cap(isNum(layer.levels) ? layer.levels : 6);
  let shares: number[];
  if (Array.isArray(layer.levels)) shares = layer.levels.filter((v) => isNum(v) && v > 0 && v <= 1).sort((a, b) => a - b);
  else if (mass) shares = Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));
  else {
    const low = isNum(layer.threshold) ? clamp01(layer.threshold) : 0.1;
    shares = Array.from({ length: count }, (_, i) => low + ((1 - low) * i) / count);
  }
  if (shares.length === 0) throw new RangeError("a contour needs at least one level");
  const thresholds = mass ? massThresholds(density, shares) : shares.map((f) => f * density.max);
  // A mass level is a share of the data: the smallest share has the highest density, so the bands are listed from the largest share.
  const order = shares.map((_, i) => i).sort((a, b) => thresholds[a] - thresholds[b] || a - b);
  const levels = used.length === 0 ? [] : order.map((i) => {
    const rings = contourRings(density, thresholds[i]);
    const d = rings.map((ring) => `M${ring.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z`).join("");
    const inside = used.filter((s) => densityAt(density, s.x, s.y) >= thresholds[i]).length;
    return { label: shares[i], threshold: thresholds[i], d, inside };
  });
  let peak: P = [(xr[0] + xr[1]) / 2, (yr[0] + yr[1]) / 2];
  let best = -1;
  for (let q = 0; q < density.z.length; q += 1) {
    if (density.z[q] > best) {
      best = density.z[q];
      peak = [xr[0] + ((q % nx) * w) / (nx - 1), yr[0] + (Math.floor(q / nx) * h) / (ny - 1)];
    }
  }
  const items: Item[] = levels.map((level, i) => ({ d: level.d, cx: peak[0], cy: peak[1], value: 100 * level.label, n: level.inside, hits: 0, name: String(i), side: 0 }));
  return {
    items,
    stat: mass ? env.words.layers.stat.mass : env.words.layers.stat.density,
    percent: true,
    total: used.length,
    outside: samples.length - used.length,
    skipped,
    placed: samples.length,
    contour: { levels, peak, mass, filled: layer.filled !== false },
    noun: "bands",
  };
}

// ----- colour: a ramp cut into steps, the values mapped to them, and the rules that give each step its colour in a light and a dark page

/** A ramp cut into steps over a domain. */
interface Colours {
  ramp: ResolvedRamp;
  steps: number;
  domain: [number, number];
  /** True when the ramp's pale end is left unused (a sequential ramp). */
  floor: boolean;
  /** True when the domain is symmetric about a value (so the ramp diverges). */
  centre: number | undefined;
}

function coloursFor(spec: { ramp?: HeatBase["ramp"]; domain?: readonly [number, number]; center?: number; steps?: number }, values: readonly number[], fallbackDomain?: [number, number]): Colours {
  const ramp = resolveRamp(spec.ramp, isNum(spec.center) ? "balance" : "ember");
  const steps = isNum(spec.steps) ? Math.max(2, Math.min(32, Math.round(spec.steps))) : STEPS;
  let domain: [number, number];
  if (spec.domain !== undefined && isNum(spec.domain[0]) && isNum(spec.domain[1])) domain = [spec.domain[0], spec.domain[1]];
  else if (isNum(spec.center)) {
    const reach = values.length === 0 ? 1 : Math.max(...values.map((v) => Math.abs(v - (spec.center as number))));
    domain = [spec.center - (reach || 1), spec.center + (reach || 1)];
  } else if (values.length > 0) domain = [Math.min(...values), Math.max(...values)];
  else domain = fallbackDomain ?? [0, 1];
  return { ramp, steps, domain, floor: ramp.kind === "sequential" && !isNum(spec.center), centre: isNum(spec.center) ? spec.center : undefined };
}

const fractionOf = (c: Colours, k: number): number => {
  const t = c.steps <= 1 ? 1 : k / (c.steps - 1);
  return c.floor ? FLOOR + (1 - FLOOR) * t : t;
};

/** The colour of step `k` for a light page and for a dark one (`undefined` when the ramp has no dark set). */
function stepColours(c: Colours, k: number): { light: string; dark: string | undefined } {
  const f = fractionOf(c, k);
  return { light: rampColour(c.ramp.light, f) ?? c.ramp.light[0], dark: c.ramp.dark === undefined ? undefined : rampColour(c.ramp.dark, f) ?? c.ramp.dark[0] };
}

/** The rule that fills step `k`: a custom property with the light colour as its fallback when the ramp has a dark set, else the colour. */
const fillOf = (c: Colours, k: number): string => {
  const { light } = stepColours(c, k);
  return c.ramp.dark === undefined ? light : `var(--ky-hv${k},${light})`;
};

/** The rules that set the dark page's colours for a layer's steps, scoped to the layer's group. Empty for a ramp with no dark set. */
function darkRules(c: Colours, ids: readonly string[]): string {
  if (c.ramp.dark === undefined) return "";
  const props = Array.from({ length: c.steps }, (_, k) => `--ky-hv${k}:${stepColours(c, k).dark}`).join(";");
  // An attribute selector, because an id that starts with a digit is not a valid `#id`.
  const each = (prefix: string): string => ids.map((id) => `${prefix}[id="${id}"]`).join(",");
  return `@media (prefers-color-scheme:dark){${each("html:not([data-theme=light]) .kyogijo:not([data-theme=light]) ")}{${props}}}${each("html[data-theme=dark] ")},${each(".kyogijo[data-theme=dark] ")}{${props}}`;
}

// ----- numbers as text

/** A value as text for a label or a tick: whole when it is whole, a place or two otherwise, and a percent sign when the layer's numbers are percents. */
function formatter(percent: boolean, decimals: number | undefined): (v: number) => string {
  return (v) => {
    let text: string;
    if (decimals !== undefined) text = v.toFixed(Math.max(0, Math.min(6, Math.round(decimals))));
    else if (Number.isInteger(v) || Math.abs(v) >= 100) text = String(Math.round(v));
    else if (Math.abs(v) >= 1) text = String(Number(v.toFixed(1)));
    else text = String(Number(v.toPrecision(2)));
    return percent ? `${text}%` : text;
  };
}

// ----- the legend

/** What a legend needs. */
interface LegendSpec {
  colours: Colours;
  title: string;
  ticks: number;
  position: NonNullable<HeatLegend["position"]>;
  /** The part of the surface the legend is sized and placed against, in feet in the drawing's frame; what is shown by default. */
  region?: Box;
  format: (v: number) => string;
  /** Tick values, when the caller fixes them (a contour's levels); otherwise nice numbers over the domain. */
  at?: readonly number[];
}

/** The legend's marks: a plate, the heading, the steps as a bar and the ticks. Laid out as the eye sees it, then placed on the surface and turned back when the surface is turned. */
function legendMarks(env: Env, spec: LegendSpec): string {
  const box = spec.region ?? env.shown;
  const b = spec.region === undefined ? env.base : Math.max(box.w, box.h) * 0.013;
  const fs = b * 1.1;
  const barH = b * 1.3;
  const pad = b * 1;
  const screenW = env.turned ? box.h : box.w;
  const barW = Math.min(b * 16, screenW * 0.5);
  const heading = spec.title;
  const [lo, hi] = spec.colours.domain;
  const ticks = spec.at !== undefined ? [...spec.at] : niceTicks(lo, hi, spec.ticks);
  // The ends' labels reach past the bar by half their width, so the plate does too.
  const edge = Math.max(pad, ...ticks.map((v) => (textWidth(spec.format(v)) * fs * 0.9) / 2 + b * 0.5));
  const W = Math.max(barW + 2 * edge, textWidth(heading) * fs + 2 * pad);
  const H = pad + fs * 1.15 + barH + fs * 0.35 + fs * 1.05 + pad * 0.8;
  const x0 = (W - barW) / 2;
  const top = pad + fs * 1.15;
  const body: string[] = [`<rect class="ky-lg-p" width="${num(W)}" height="${num(H)}" rx="${num(b * 0.6)}"/>`, `<text class="ky-lg-t" x="${num(W / 2)}" y="${num(pad + fs * 0.85)}" font-size="${num(fs)}" text-anchor="middle">${esc(heading)}</text>`];
  const c = spec.colours;
  for (let k = 0; k < c.steps; k += 1) body.push(`<rect x="${num(x0 + (barW * k) / c.steps)}" y="${num(top)}" width="${num(barW / c.steps + 0.05)}" height="${num(barH)}" style="fill:${fillOf(c, k)}"/>`);
  for (const v of ticks) {
    const f = hi === lo ? 0.5 : (v - lo) / (hi - lo);
    if (f < -0.001 || f > 1.001) continue;
    const x = x0 + barW * clamp01(f);
    body.push(`<path class="ky-lg-k" d="M${num(x)} ${num(top + barH)}v${num(fs * 0.3)}" stroke-width="${num(b * 0.12)}"/>`, `<text class="ky-lg-t" x="${num(x)}" y="${num(top + barH + fs * 1.2)}" font-size="${num(fs * 0.9)}" text-anchor="middle">${esc(spec.format(v))}</text>`);
  }
  // Where the legend sits on the surface, as the eye sees the surface: a share of the way across and down.
  const inset = b * 1.8;
  const [sx, sy] = ((): [number, number] => {
    switch (spec.position) {
      case "top": return [0.5, 0];
      case "top-left": return [0, 0];
      case "top-right": return [1, 0];
      case "bottom-left": return [0, 1];
      case "bottom-right": return [1, 1];
      default: return [0.5, 1];
    }
  })();
  let tx: number;
  let ty: number;
  if (!env.turned) {
    tx = box.x + inset + (box.w - W - 2 * inset) * sx;
    ty = box.y + inset + (box.h - H - 2 * inset) * sy;
    return `<g class="ky-lg" transform="translate(${num(tx)} ${num(ty)})">${body.join("")}</g>`;
  }
  // A turned surface is laid on its side: the screen's right is the surface's top and the screen's bottom is the surface's right end.
  const cx = box.x + inset + H / 2 + (box.w - H - 2 * inset) * sy;
  const cy = box.y + inset + W / 2 + (box.h - W - 2 * inset) * (1 - sx);
  tx = cx;
  ty = cy;
  return `<g class="ky-lg" transform="translate(${num(tx)} ${num(ty)}) rotate(-90) translate(${num(-W / 2)} ${num(-H / 2)})">${body.join("")}</g>`;
}

function legendOf(option: boolean | HeatLegend | undefined): HeatLegend | undefined {
  return option === true ? {} : typeof option === "object" && option !== null ? option : undefined;
}

// ----- drawing

function labelLines(c: Computed, item: Item, fmt: (v: number) => string, showing: readonly string[]): string[] {
  const lines: string[] = [];
  for (const part of showing) {
    if (part === "name" && item.name !== undefined) lines.push(item.name);
    else if (part === "value" && item.value !== null) lines.push(fmt(item.value));
    else if (part === "count") lines.push(String(item.n));
    else if (part === "share" && c.total > 0) lines.push(`${formatter(false, undefined)((100 * item.n) / c.total)}%`);
    else if (part === "ratio") lines.push(`${item.hits}/${item.n}`);
  }
  return lines;
}

function drawLabels(layer: HeatBase, env: Env, c: Computed, fmt: (v: number) => string): string {
  const option = layer.labels;
  if (option === undefined || option === false) return "";
  const o: HeatLabels = option === true ? {} : option;
  const showing = o.show !== undefined && o.show.length > 0 ? o.show : ["value"];
  const unit = unitOfLayer(layer, env);
  const k = FEET_PER[unit];
  const min = isNum(o.minCount) ? o.minCount : 1;
  const b = env.base;
  const shown = c.items.filter((it) => (it.value !== null || (showing.includes("name") && it.name !== undefined)) && it.n >= (c.noun === "zones" && showing.includes("name") ? 0 : min)).sort((a, z) => (z.value ?? -Infinity) - (a.value ?? -Infinity)).slice(0, MAX_LABELS);
  const out: string[] = [];
  for (const it of shown) {
    const lines = labelLines(c, it, fmt, showing);
    if (lines.length === 0) continue;
    const size = isNum(o.size) && o.size > 0 ? o.size * k : c.noun === "zones" ? b * 1.45 : Math.max(b * 0.7, Math.min(it.side * 0.36, b * 2.3));
    let fit = size;
    if (it.room !== undefined) {
      // A label is made smaller to fit a small zone, and left out when it would be too small to read.
      const wide = Math.max(...lines.map((line) => textWidth(line)));
      fit = Math.min(size, (it.room[0] * 0.94) / wide, (it.room[1] * 0.9) / (lines.length * 1.15));
      if (fit < b * 0.55) continue;
    }
    const lh = fit * 1.15;
    const rotate = env.turned ? ` transform="rotate(-90 ${num(it.cx)} ${num(it.cy)})"` : "";
    const text = lines.map((line, i) => `<tspan x="${num(it.cx)}" y="${num(it.cy + (i - (lines.length - 1) / 2) * lh + fit * 0.36)}">${esc(line)}</tspan>`).join("");
    out.push(`<text class="ky-lt" font-size="${num(fit)}" text-anchor="middle"${rotate}>${text}</text>`);
  }
  return out.length === 0 ? "" : `<g class="ky-hl">${out.join("")}</g>`;
}

/** The hottest few items, as a list for a summary. */
function hottest(c: Computed, env: Env, layer: LayerBase, unit: Unit, fmt: (v: number) => string): string {
  const w = env.words.layers;
  const ranked = c.items.map((it, order) => ({ it, order })).filter(({ it }) => it.value !== null && it.n > 0).sort((a, b) => (b.it.value as number) - (a.it.value as number) || a.order - b.order).slice(0, 3);
  if (ranked.length === 0) return "";
  const where = placeBack(layer, env, ranked.map(({ it }): P => [it.cx, it.cy]), unit);
  const names = ranked.map(({ it }, i) => it.name ?? `${Math.round(where[i][0] * 10) / 10}, ${Math.round(where[i][1] * 10) / 10}`);
  return fill(w.top, { list: ranked.map(({ it }, i) => fill(w.valueItem, { name: names[i], n: fmt(it.value as number) })).join(w.listSep) });
}

const sentence = (words: Words, noun: Computed["noun"]): string => (noun === "cells" ? words.heatNote : noun === "hexagons" ? words.hexNote : noun === "zones" ? words.zoneNote : words.contourNote);

/** Compute a heat layer's numbers. */
function compute(layer: HeatLayer, env: Env): Computed {
  const unit = unitOfLayer(layer, env);
  switch (layer.kind) {
    case "heatmap": return gridCells(layer, env, unit);
    case "hexbin": return hexCells(layer, env, unit);
    case "zones": return zoneCells(layer, env, unit);
    default: return contourBands(layer, env, unit);
  }
}

/** Draw a heat layer. `gid` is the id of its group, which the dark colours of its ramp are scoped to. */
export function drawHeat(layer: HeatLayer, env: Env, gid: string, known?: Map<string, LegendInfo>): Made {
  const made = newMade();
  const words = env.words.layers;
  const unit = unitOfLayer(layer, env);
  const c = compute(layer, env);
  const fmt = formatter(c.percent, (typeof layer.labels === "object" && layer.labels !== null ? layer.labels.decimals : undefined));
  made.drawn = c.placed;
  made.skipped = c.skipped;
  made.opacity = opacityOf(layer.opacity) ?? 0.92;
  made.cls = "ky-hm";
  const present = c.items.map((it) => it.value).filter((v): v is number => v !== null);
  made.low = present.length === 0 ? Infinity : Math.min(...present);
  made.high = present.length === 0 ? -Infinity : Math.max(...present);
  const marks: string[] = [];
  const ground = layer.ground !== "none";
  if (ground) marks.push(`<path class="ky-hg" d="${env.outline.d}"/>`);
  let colours: Colours;
  if (c.contour !== undefined) {
    // The bands are the steps: the lowest density is the first colour.
    const spec = c.contour;
    colours = coloursFor({ ...layer, steps: Math.max(2, spec.levels.length) }, [], [0, 100]);
    colours.domain = spec.levels.length === 0 ? [0, 100] : [100 * spec.levels[0].label, 100 * spec.levels[spec.levels.length - 1].label];
    spec.levels.forEach((level, i) => {
      if (level.d === "") return;
      const mark = ` data-mark-id="${i}" data-index="${i}"`;
      marks.push(spec.filled ? `<path class="ky-cf" style="fill:${fillOf(colours, i)}" fill-rule="evenodd" d="${level.d}"${mark}/>` : `<path class="ky-cl" style="stroke:${fillOf(colours, i)}" d="${level.d}"${mark}/>`);
    });
    made.style = `--w:${num(env.base * (spec.filled ? 0.1 : 0.32))}`;
  } else {
    colours = coloursFor(layer, present);
    const step = (v: number): number => stepOf(v, colours.domain, colours.steps);
    if (c.noun === "zones") {
      c.items.forEach((it, i) => {
        const title = `<title>${esc(`${it.name ?? ""}${it.value === null ? "" : `: ${fmt(it.value)}`} (${it.n})`)}</title>`;
        const zone = it.id === undefined ? "" : ` data-mark-id="${esc(it.id)}" data-index="${i}" data-zone="${esc(it.id)}"`;
        marks.push(`<path class="ky-zn" d="${it.d}" fill-rule="evenodd" style="fill:${it.value === null ? "none" : fillOf(colours, step(it.value))}"${zone}>${title}</path>`);
      });
      made.style = `--w:${num(env.base * 0.12)}`;
    } else {
      // Each cell is a path of its own, so that a listener can tell which one it was on; the cells of a colour share a group that holds the fill.
      const byStep: string[][] = Array.from({ length: colours.steps }, () => []);
      c.items.forEach((it, i) => {
        if (it.value === null) return;
        byStep[step(it.value)].push(`<path d="${it.d}"${markAttrs(env, undefined, i, [it.cx, it.cy])}/>`);
      });
      byStep.forEach((list, k) => {
        if (list.length > 0) marks.push(`<g style="fill:${fillOf(colours, k)}">${list.join("")}</g>`);
      });
    }
  }
  marks.push(drawLabels(layer, env, c, fmt));
  const legend = legendOf(layer.legend);
  const wrapped: string[] = [];
  if (legend !== undefined) {
    const contour = c.contour;
    wrapped.push(
      legendMarks(env, {
        colours,
        title: legend.title ?? c.stat,
        ticks: legend.ticks ?? 5,
        position: legend.position ?? (env.o.sport === "mlb" ? "bottom-right" : "bottom"),
        region: legend.region,
        format: formatter(c.percent, undefined),
        at: contour === undefined || contour.levels.length > 6 ? undefined : contour.levels.map((l) => 100 * l.label),
      }),
    );
  }
  made.marks = marks.join("");
  // The legend is not cut to the surface (it may sit outside a ballpark's fence), so it is a group of its own beside the layer's.
  if (wrapped.length > 0) made.after = `<g id="${gid}-lg" class="ky-lgw" data-kind="legend"><title>${esc(fill(words.legendTitle, { name: legend?.title ?? c.stat }))}</title>${wrapped.join("")}</g>`;
  made.css = darkRules(colours, wrapped.length > 0 ? [gid, `${gid}-lg`] : [gid]);
  if (known !== undefined && typeof layer.id === "string" && layer.id !== "") known.set(layer.id, { colours, stat: c.stat, percent: c.percent });
  const noun = typeof layer.name === "string" && layer.name.trim() !== "" ? layer.name.trim() : words[c.placed === 1 ? "pointOne" : "pointMany"];
  const kindTitle = layer.kind === "heatmap" ? words.heatTitle : layer.kind === "hexbin" ? words.hexTitle : layer.kind === "zones" ? words.zonesTitle : words.contourTitle;
  made.title = fill(kindTitle, { n: c.placed, noun });
  const parts: string[] = [];
  if (c.contour !== undefined) {
    const at = placeBack(layer, env, [c.contour.peak], unit)[0];
    parts.push(fill(words.contourNote, { n: c.contour.levels.length, x: Math.round(at[0] * 10) / 10, y: Math.round(at[1] * 10) / 10 }));
  } else if (present.length > 0) {
    parts.push(fill(sentence(words, c.noun), { stat: c.stat, n: present.length, min: fmt(made.low), max: fmt(made.high) }));
    const top = hottest(c, env, layer, unit, fmt);
    if (top !== "") parts.push(top);
  }
  if (c.outside > 0) parts.push(fill(words.outside, { n: c.outside }));
  if (c.skipped > 0) parts.push(fill(words.skipped, { n: c.skipped }));
  made.text = parts.join(env.words.said.gap);
  return made;
}

/** The marks counted into each zone of a zone chart, without drawing it: for each zone its id, its name (in the drawing's language), the marks in it, those whose outcome is a success and its value. */
export function zoneCounts(layer: ZonesLayer, env: Env): { id: string; name: string; n: number; hits: number; value: number | null }[] {
  return zoneCells(layer, env, unitOfLayer(layer, env)).items.map((it) => ({ id: it.id ?? "", name: it.name ?? "", n: it.n, hits: it.hits, value: it.value }));
}

/** What a legend takes from the layer it is for. */
export interface LegendInfo {
  colours: Colours;
  stat: string;
  percent: boolean;
}

/** A legend layer: a colour bar for another heat layer (`for`) or with a ramp and a domain of its own. `known` holds the colours of the layers drawn. */
export function drawLegend(layer: LegendLayer, env: Env, gid: string, known: ReadonlyMap<string, LegendInfo>): Made {
  const made = newMade();
  const words = env.words.layers;
  const target = layer.for === undefined ? undefined : known.get(layer.for);
  if (layer.for !== undefined && target === undefined) throw new RangeError(`The legend is for "${layer.for}", which is not a heat layer of this drawing`);
  const colours = target?.colours ?? coloursFor(layer, []);
  const percent = target?.percent ?? false;
  const title = typeof layer.name === "string" && layer.name.trim() !== "" ? layer.name.trim() : target?.stat ?? words.stat.custom;
  made.cls = "ky-hm";
  made.opacity = opacityOf(layer.opacity);
  made.marks = legendMarks(env, { colours, title, ticks: layer.ticks ?? 5, position: layer.position ?? (env.o.sport === "mlb" ? "bottom-right" : "bottom"), region: layer.region, format: formatter(percent, undefined) });
  made.css = darkRules(colours, [gid]);
  made.title = fill(words.legendTitle, { name: title });
  made.text = fill(words.range, { min: formatter(percent, undefined)(colours.domain[0]), max: formatter(percent, undefined)(colours.domain[1]) });
  made.drawn = 0;
  return made;
}

/** A table of a heat layer's numbers: the heading cells, the rows, and the note for the caption. */
export interface HeatTable {
  head: string[];
  rows: (string | number | null)[][];
  title: string;
  note: string;
}

/** The numbers a heat layer shows, as table rows: a row for each zone; the cells that hold something, the hottest first; or a row for each contour level. */
export function heatTable(layer: HeatLayer, env: Env): HeatTable {
  const words = env.words.layers;
  const unit = unitOfLayer(layer, env);
  const c = compute(layer, env);
  const round = (v: number): number => Math.round(v * 1000) / 1000;
  const noun = typeof layer.name === "string" && layer.name.trim() !== "" ? layer.name.trim() : words[c.placed === 1 ? "pointOne" : "pointMany"];
  const kindTitle = layer.kind === "heatmap" ? words.heatTitle : layer.kind === "hexbin" ? words.hexTitle : layer.kind === "zones" ? words.zonesTitle : words.contourTitle;
  const title = typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(kindTitle, { n: c.placed, noun });
  if (c.contour !== undefined) {
    return {
      head: [words.tableNo, words.tableLevel, words.tableCount, words.tableShare],
      rows: c.contour.levels.map((level, i) => [i + 1, round(100 * level.label), level.inside, c.total === 0 ? null : round((100 * level.inside) / c.total)]),
      title,
      note: c.stat,
    };
  }
  if (c.noun === "zones") {
    return {
      head: [words.tableNo, words.tableZone, words.tableCount, words.tableValue, words.tableShare],
      rows: c.items.map((it, i) => [i + 1, it.name ?? "", it.n, it.value === null ? null : round(it.value), c.total === 0 ? null : round((100 * it.n) / c.total)]),
      title,
      note: c.stat,
    };
  }
  const ranked = c.items.map((it, order) => ({ it, order })).sort((a, b) => (b.it.value as number) - (a.it.value as number) || a.order - b.order);
  const where = placeBack(layer, env, ranked.map(({ it }): P => [it.cx, it.cy]), unit);
  const frame = layer.from === undefined ? undefined : typeof layer.from === "string" ? layer.from : layer.from.name;
  // A frame's numbers are in the frame's own unit; without one the cells are in the layer's.
  const given = layer.from === undefined ? undefined : typeof layer.from === "string" ? FRAMES[layer.from] : layer.from;
  const unit_ = given?.unit ?? (layer.units === "rulebook" ? "rulebook" : layer.units ?? env.unit);
  const note = frame === undefined ? fill(words.tableCellsPlain, { stat: c.stat, unit: unit_ }) : fill(words.tableCells, { stat: c.stat, frame, unit: unit_ });
  return {
    head: [words.tableNo, words.tableX, words.tableY, words.tableCount, words.tableValue],
    rows: ranked.map(({ it }, i) => [i + 1, round(where[i][0]), round(where[i][1]), it.n, it.value === null ? null : round(it.value)]),
    title,
    note,
  };
}
