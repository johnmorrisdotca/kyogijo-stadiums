// The layers that read movements (passes, carries, runs): a flow field, which draws the average direction of the movements that start in each cell of a
// grid as an arrow (a quiver plot), and a sonar, which draws a rose of how many movements go each way (or how long they are on average), for the whole
// surface, for each player, for each cell of a grid or for each zone. Written for this package from the plain arithmetic of vectors and angles; the
// ideas are those of mplsoccer's pass-flow and pass-sonar examples (MIT), and no code of it is used.
import { esc, num } from "./format.ts";
import { buildZoneSet } from "./heat.zones.ts";
import { isNum, newMade, opacityOf, place, placeBack, toArray, unitOfLayer, type Env, type Made } from "./layers.env.ts";
import { headPath, type P } from "./layers.marks.ts";
import type { LayerBase } from "./layers.types.ts";
import { fill } from "./strings.core.ts";
import { attrs, frameNote, labelOf, round, teamClass, teamKey, teamLabel, titled, unitWord, type TeamTable } from "./team.common.ts";
import type { FlowLayer, MoveDatum, SonarLayer } from "./team.types.ts";
import { FEET_PER, type Unit } from "./units.ts";

/** A movement on the surface: where it starts, and the vector, in feet. */
interface Move {
  d: MoveDatum;
  x: number;
  y: number;
  dx: number;
  dy: number;
  len: number;
}

/** The movements of a layer that have a start and a way to go, put on the surface. A movement with no length is kept (it has no direction, and counts for nothing in a flow or a rose). */
function movesOf(layer: LayerBase & { data: readonly MoveDatum[]; kind: string }, env: Env, unit: Unit): { moves: Move[]; skipped: number } {
  const data = toArray(layer.data, `a ${layer.kind} layer`);
  const keep: MoveDatum[] = [];
  const raw: P[] = [];
  let skipped = 0;
  for (const d of data) {
    if (typeof d !== "object" || d === null || !isNum(d.x) || !isNum(d.y)) {
      skipped += 1;
      continue;
    }
    const end: P | undefined = isNum(d.x2) && isNum(d.y2) ? [d.x2, d.y2] : isNum(d.dx) && isNum(d.dy) ? [d.x + d.dx, d.y + d.dy] : undefined;
    if (end === undefined) {
      skipped += 1;
      continue;
    }
    keep.push(d);
    raw.push([d.x, d.y], end);
  }
  const at = place(layer, env, raw, unit);
  const moves = keep.map((d, i): Move => {
    const dx = at[2 * i + 1][0] - at[2 * i][0];
    const dy = at[2 * i + 1][1] - at[2 * i][1];
    return { d, x: at[2 * i][0], y: at[2 * i][1], dx, dy, len: Math.hypot(dx, dy) };
  });
  return { moves, skipped };
}

/** The team that colours a layer: the one it names, else the one all its movements share. */
function teamOf(layer: { team?: string }, moves: readonly Move[]): string {
  if (typeof layer.team === "string") return layer.team;
  const teams = new Set(moves.map((m) => teamKey(m.d.team)));
  return teams.size === 1 ? [...teams][0] : "";
}

/** The grid of a layer: the cells across and down, laid over the surface's box. */
function gridOf(bins: number | readonly [number, number] | undefined, env: Env, fallback: number): { nx: number; ny: number; w: number; h: number } {
  const { box } = env.outline;
  let nx: number;
  let ny: number;
  if (Array.isArray(bins) && bins.length === 2 && isNum(bins[0]) && isNum(bins[1])) {
    nx = Math.max(1, Math.min(200, Math.floor(bins[0])));
    ny = Math.max(1, Math.min(200, Math.floor(bins[1])));
  } else {
    const across = isNum(bins) && bins >= 1 ? Math.min(200, Math.floor(bins)) : fallback;
    const side = Math.max(box.w, box.h) / across;
    nx = Math.max(1, Math.ceil(box.w / side - 1e-9));
    ny = Math.max(1, Math.ceil(box.h / side - 1e-9));
  }
  return { nx, ny, w: box.w / nx, h: box.h / ny };
}

const cellOf = (g: { nx: number; ny: number; w: number; h: number }, env: Env, x: number, y: number): number => {
  const { box } = env.outline;
  const i = Math.floor((x - box.x) / g.w);
  const j = Math.floor((y - box.y) / g.h);
  return i < 0 || j < 0 || i >= g.nx || j >= g.ny ? -1 : j * g.nx + i;
};

/** One cell of a flow field. */
interface FlowCell {
  cx: number;
  cy: number;
  n: number;
  /** The mean vector, feet. */
  mx: number;
  my: number;
  /** The mean length of the movements. */
  length: number;
  /** The length of the mean vector over the mean length: 1 when every movement goes the same way, 0 when they cancel. */
  steady: number;
}

function computeFlow(layer: FlowLayer, env: Env): { cells: FlowCell[]; moves: Move[]; skipped: number; grid: ReturnType<typeof gridOf>; team: string; longest: number } {
  const unit = unitOfLayer(layer, env);
  const { moves, skipped } = movesOf(layer, env, unit);
  const grid = gridOf(layer.bins, env, 12);
  const minCount = isNum(layer.minCount) && layer.minCount >= 1 ? Math.floor(layer.minCount) : 2;
  const sums: { n: number; sx: number; sy: number; sl: number }[] = Array.from({ length: grid.nx * grid.ny }, () => ({ n: 0, sx: 0, sy: 0, sl: 0 }));
  for (const m of moves) {
    if (m.len === 0) continue;
    const c = cellOf(grid, env, m.x, m.y);
    if (c < 0) continue;
    sums[c].n += 1;
    sums[c].sx += m.dx;
    sums[c].sy += m.dy;
    sums[c].sl += m.len;
  }
  const { box } = env.outline;
  const cells: FlowCell[] = [];
  sums.forEach((s, c) => {
    if (s.n < minCount) return;
    const cx = box.x + ((c % grid.nx) + 0.5) * grid.w;
    const cy = box.y + (Math.floor(c / grid.nx) + 0.5) * grid.h;
    if (!env.outline.contains(cx, cy)) return;
    const mx = s.sx / s.n;
    const my = s.sy / s.n;
    cells.push({ cx, cy, n: s.n, mx, my, length: s.sl / s.n, steady: s.sl === 0 ? 0 : Math.hypot(s.sx, s.sy) / s.sl });
  });
  return { cells, moves, skipped, grid, team: teamOf(layer, moves), longest: Math.max(0, ...cells.map((c) => Math.hypot(c.mx, c.my))) };
}

export function drawFlow(layer: FlowLayer, env: Env): Made {
  const made = newMade();
  const words = env.words.team;
  const c = computeFlow(layer, env);
  const unit = unitOfLayer(layer, env);
  const k = FEET_PER[unit];
  made.drawn = c.moves.length;
  made.skipped = c.skipped;
  made.cls = "ky-tm";
  made.opacity = opacityOf(layer.opacity);
  const fixed = layer.lengths === "fixed";
  const cell = Math.min(c.grid.w, c.grid.h);
  const width = env.base * 0.28;
  made.style = `stroke-width:${num(width)}`;
  // Arrows are written in a path each for shafts and heads, for each level of opacity.
  const levels = new Map<number, { shafts: string[]; heads: string[] }>();
  for (const f of c.cells) {
    const m = Math.hypot(f.mx, f.my);
    if (m === 0) continue;
    const u: P = [f.mx / m, f.my / m];
    const len = fixed ? cell * 0.75 : Math.max(cell * 0.25, cell * 0.9 * (m / c.longest));
    const a: P = [f.cx - (u[0] * len) / 2, f.cy - (u[1] * len) / 2];
    const b: P = [f.cx + (u[0] * len) / 2, f.cy + (u[1] * len) / 2];
    const hl = Math.min(len * 0.5, Math.max(width * 3.2, cell * 0.22));
    const level = fixed ? Math.round((0.35 + 0.65 * f.steady) * 10) / 10 : 0.9;
    const list = levels.get(level) ?? { shafts: [], heads: [] };
    list.shafts.push(`M${num(a[0])} ${num(a[1])}L${num(b[0] - u[0] * hl * 0.8)} ${num(b[1] - u[1] * hl * 0.8)}`);
    list.heads.push(headPath(b, u, hl, hl * 0.45, false));
    levels.set(level, list);
  }
  const cls = teamClass(c.team);
  const out: string[] = [];
  for (const [level, list] of [...levels.entries()].sort((x, y) => x[0] - y[0])) out.push(`<g${attrs(cls, "", level)}><path class="ky-ln" d="${list.shafts.join("")}"/><path class="ky-ah" d="${list.heads.join("")}"/></g>`);
  made.marks = out.join("");
  made.title = fill(words.flowTitle, { n: c.moves.length, cells: c.cells.length });
  const parts: string[] = [];
  if (c.cells.length > 0) parts.push(fill(words.flowNote, { len: round(Math.max(...c.cells.map((f) => f.length)) / k, 1), unit: unitWord(unit, env) }));
  if (c.skipped > 0) parts.push(fill(env.words.layers.skipped, { n: c.skipped }));
  made.text = parts.join(env.words.said.gap);
  return made;
}

/** The direction of a vector on the surface, in degrees: 0 toward the right end as the surface is drawn wide, 90 toward the top edge, from 0 up to 360. */
export const degreesOf = (dx: number, dy: number): number => {
  const d = (Math.atan2(-dy, dx) * 180) / Math.PI;
  return (d + 360) % 360;
};

export function flowTable(layer: FlowLayer, env: Env): TeamTable[] {
  const w = env.words.team;
  const l = env.words.layers;
  const c = computeFlow(layer, env);
  const unit = unitOfLayer(layer, env);
  const k = FEET_PER[unit];
  const back = placeBack(layer, env, c.cells.map((f): P => [f.cx, f.cy]), unit);
  return [
    {
      head: [l.tableNo, l.tableX, l.tableY, l.tableCount, w.tableDirection, w.tableLength, w.tableSteady],
      rows: c.cells.map((f, i) => [i + 1, round(back[i][0], 2), round(back[i][1], 2), f.n, Math.round(degreesOf(f.mx, f.my)), round(f.length / k, 2), Math.round(100 * f.steady)]),
      title: typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.flowTitle, { n: c.moves.length, cells: c.cells.length }),
      note: [frameNote(layer, env), fill(w.tableUnit, { unit: unitWord(unit, env) })].filter((t) => t !== "").join(env.words.said.gap),
    },
  ];
}

/** One rose of a sonar. */
interface Rose {
  name: string;
  /** Where its centre is, on the surface (feet). */
  cx: number;
  cy: number;
  moves: Move[];
  /** The radius the longest bar of all would have, feet. */
  radius: number;
  /** A value for each direction. */
  bars: number[];
  count: number;
  mean: number;
}

function computeSonar(layer: SonarLayer, env: Env): { roses: Rose[]; moves: Move[]; skipped: number; outside: number; angles: number; team: string; peak: number; unit: Unit } {
  const unit = unitOfLayer(layer, env);
  const k = FEET_PER[unit];
  const { moves, skipped: bad } = movesOf(layer, env, unit);
  const by = layer.by === "player" || layer.by === "grid" || layer.by === "zone" ? layer.by : "all";
  const angles = isNum(layer.angles) ? Math.max(3, Math.min(72, Math.floor(layer.angles))) : 12;
  const statistic = layer.statistic === "mean" ? "mean" : "count";
  const minCount = isNum(layer.minCount) && layer.minCount >= 1 ? Math.floor(layer.minCount) : 1;
  const { box } = env.outline;
  let skipped = bad;
  let outside = 0;
  const groups = new Map<string, { name: string; moves: Move[]; at?: P }>();
  const add = (key: string, name: string, move: Move, at?: P): void => {
    const g = groups.get(key) ?? { name, moves: [], at };
    g.moves.push(move);
    groups.set(key, g);
  };
  let radius = Math.min(box.w, box.h) * 0.3;
  if (by === "all") for (const m of moves) add("all", "", m);
  else if (by === "player") {
    radius = Math.min(box.w, box.h) * 0.1;
    for (const m of moves) {
      const id = m.d.id;
      if (typeof id !== "string" && !isNum(id)) skipped += 1;
      else add(String(id), labelOf(m.d), m);
    }
  } else if (by === "grid") {
    const grid = gridOf(layer.bins, env, 6);
    radius = Math.min(grid.w, grid.h) * 0.45;
    for (const m of moves) {
      const c = cellOf(grid, env, m.x, m.y);
      if (c < 0) outside += 1;
      else add(String(c), String(c + 1), m, [box.x + ((c % grid.nx) + 0.5) * grid.w, box.y + (Math.floor(c / grid.nx) + 0.5) * grid.h]);
    }
  } else {
    if (layer.zones === undefined) throw new RangeError("a sonar by zone needs `zones`: the set of zones");
    radius = Math.min(box.w, box.h) * 0.08;
    const los = isNum(layer.los) ? place({ ...layer, limits: undefined }, env, [[layer.los, 0]], unit)[0][0] : undefined;
    const set = buildZoneSet(layer.zones, { o: env.o, outline: env.outline, direction: layer.direction === "left" ? "left" : "right", end: layer.end === "left" || layer.end === "right" ? layer.end : "both", los, bats: layer.bats === "none" ? undefined : layer.bats === "L" ? "L" : "R", words: env.words.layers.zones });
    for (const m of moves) {
      const z = set.which(m.x, m.y);
      if (z < 0) outside += 1;
      else add(String(z), set.zones[z].name, m, [set.zones[z].label[0], set.zones[z].label[1]]);
    }
  }
  if (isNum(layer.radius) && layer.radius > 0) radius = layer.radius * k;
  const step = 360 / angles;
  const roses: Rose[] = [];
  for (const g of groups.values()) {
    const real = g.moves.filter((m) => m.len > 0);
    if (real.length < minCount) continue;
    const bars: number[] = new Array<number>(angles).fill(0);
    const sums: number[] = new Array<number>(angles).fill(0);
    for (const m of real) {
      const bin = Math.floor(((degreesOf(m.dx, m.dy) + step / 2) % 360) / step);
      bars[bin] += 1;
      sums[bin] += m.len / k;
    }
    const values = statistic === "mean" ? bars.map((n, i) => (n === 0 ? 0 : sums[i] / n)) : bars;
    const centre: P = g.at ?? [real.reduce((s, m) => s + m.x, 0) / real.length, real.reduce((s, m) => s + m.y, 0) / real.length];
    roses.push({ name: g.name, cx: centre[0], cy: centre[1], moves: real, radius, bars: values, count: real.length, mean: real.reduce((s, m) => s + m.len, 0) / real.length / k });
  }
  const peak = Math.max(0, ...roses.flatMap((r) => r.bars));
  return { roses, moves, skipped, outside, angles, team: teamOf(layer, moves), peak, unit };
}

const wedge = (cx: number, cy: number, r: number, from: number, to: number): string => {
  const a = (from * Math.PI) / 180;
  const b = (to * Math.PI) / 180;
  const p = (t: number): string => `${num(cx + r * Math.cos(t))} ${num(cy - r * Math.sin(t))}`;
  // The surface's y runs down, so a larger angle is a turn to the left as seen: the arc's sweep flag is 0.
  return `M${num(cx)} ${num(cy)}L${p(a)}A${num(r)} ${num(r)} 0 ${to - from > 180 ? 1 : 0} 0 ${p(b)}Z`;
};

export function drawSonar(layer: SonarLayer, env: Env): Made {
  const made = newMade();
  const words = env.words.team;
  const c = computeSonar(layer, env);
  made.drawn = c.moves.length;
  made.skipped = c.skipped;
  made.cls = "ky-tm";
  made.opacity = opacityOf(layer.opacity);
  made.style = `--w:${num(env.base * 0.1)}`;
  const step = 360 / c.angles;
  const cls = teamClass(c.team);
  const out: string[] = [];
  let commonest = { deg: 0, n: 0 };
  for (const r of c.roses) {
    const bars: string[] = [];
    let best = 0;
    r.bars.forEach((v, i) => {
      if (v > r.bars[best]) best = i;
      if (v <= 0 || c.peak === 0) return;
      const from = i * step - step / 2;
      const to = i * step + step / 2;
      bars.push(titled("path", ` class="ky-ro" d="${wedge(r.cx, r.cy, (v / c.peak) * r.radius, from, to)}"`, fill(words.barTitle, { from: round(((from % 360) + 360) % 360, 0), to: round(to % 360, 0), value: round(v, 1) })));
    });
    const deg = Math.round(best * step);
    if (r.bars[best] > commonest.n) commonest = { deg, n: Math.round(r.bars[best]) };
    const title = fill(words.roseTitle, { name: r.name === "" ? env.words.team.hullAll : r.name, n: r.count, deg });
    out.push(`<g${attrs(cls, "")}><title>${esc(title)}</title><circle class="ky-ro-r" cx="${num(r.cx)}" cy="${num(r.cy)}" r="${num(r.radius)}"/>${bars.join("")}</g>`);
  }
  made.marks = out.join("");
  made.title = fill(words.sonarTitle, { n: c.moves.length, roses: c.roses.length, angles: c.angles });
  const parts: string[] = [];
  if (c.roses.length > 0) parts.push(fill(words.sonarNote, { deg: commonest.deg, n: commonest.n }), words.sonarAngles);
  if (c.skipped > 0) parts.push(fill(env.words.layers.skipped, { n: c.skipped }));
  if (c.outside > 0) parts.push(fill(env.words.layers.outside, { n: c.outside }));
  made.text = parts.join(env.words.said.gap);
  return made;
}

export function sonarTables(layer: SonarLayer, env: Env): TeamTable[] {
  const w = env.words.team;
  const l = env.words.layers;
  const c = computeSonar(layer, env);
  const unit = c.unit;
  const step = 360 / c.angles;
  const back = placeBack(layer, env, c.roses.map((r): P => [r.cx, r.cy]), unit);
  const title = typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.sonarTitle, { n: c.moves.length, roses: c.roses.length, angles: c.angles });
  const named = (r: Rose, i: number): string => (r.name !== "" ? r.name : c.roses.length > 1 ? String(i + 1) : teamLabel(c.team, env));
  const rows: (string | number | null)[][] = [];
  c.roses.forEach((r, i) => {
    r.bars.forEach((v, bin) => {
      if (v > 0) rows.push([named(r, i), round(((bin * step - step / 2 + 360) % 360), 1), round(bin * step + step / 2, 1) % 360, round(v, 2)]);
    });
  });
  return [
    {
      head: [l.tableNo, w.tableRose, w.tableFromAngle, w.tableToAngle, layer.statistic === "mean" ? w.tableLength : l.tableCount],
      rows: rows.map((r, i) => [i + 1, ...r]),
      title,
      note: [frameNote(layer, env), fill(w.tableUnit, { unit: unitWord(unit, env) }), w.sonarAngles].filter((t) => t !== "").join(env.words.said.gap),
    },
    {
      head: [l.tableNo, w.tableRose, l.tableX, l.tableY, l.tableCount, w.tableLength],
      rows: c.roses.map((r, i) => [i + 1, named(r, i), round(back[i][0], 2), round(back[i][1], 2), r.count, round(r.mean, 2)]),
      title: `${title}${env.words.said.colon}${w.tableRose}`,
      note: "",
    },
  ];
}
