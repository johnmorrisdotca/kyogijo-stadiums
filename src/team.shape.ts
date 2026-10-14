// The layers that draw the shape of a team from where its players stand: the Voronoi cells (who controls the space), the Delaunay triangulation (who
// is near whom) and the convex hull (how much ground the team covers). Written for this package from the plain geometry of team.geometry.ts;
// the ideas are those of mplsoccer's Voronoi, Delaunay and convex-hull examples (MIT), and no code of it is used.
import { num } from "./format.ts";
import { markAttrs, opacityOf, newMade, toArray, unitOfLayer, type Env, type Made } from "./layers.env.ts";
import type { P } from "./layers.marks.ts";
import { attrs, dots, frameNote, squareWord, unitWord, groupByTeam, paintOf, placeAll, polygonPath, round, teamClass, teamKey, teamLabel, titled, labelOf, type Placed, type TeamTable } from "./team.common.ts";
import { convexHull, delaunay, polygonArea, polygonCentroid, triangulationEdges, voronoiCells } from "./team.geometry.ts";
import type { DelaunayLayer, HullLayer, PlayerDatum, VoronoiLayer } from "./team.types.ts";
import { fill } from "./strings.ts";
import { FEET_PER } from "./units.ts";

type Player = Placed<PlayerDatum>;

const who = (p: Player): string => labelOf(p.d);

/** The share of the surface (0 to 1) nearer each site than any other, counted on a grid of cells laid over the surface and kept where the surface is. A repeated site has nothing. */
export function surfaceShares(sites: readonly P[], env: Env, across = 120): number[] {
  const { box } = env.outline;
  const out = sites.map(() => 0);
  if (sites.length === 0) return out;
  const side = Math.max(box.w, box.h) / across;
  const nx = Math.max(1, Math.ceil(box.w / side));
  const ny = Math.max(1, Math.ceil(box.h / side));
  const first = new Map<string, number>();
  const owner = sites.map((s, i) => {
    const key = `${s[0]},${s[1]}`;
    const was = first.get(key);
    if (was === undefined) first.set(key, i);
    return was ?? i;
  });
  let total = 0;
  for (let j = 0; j < ny; j += 1) {
    const y = box.y + (j + 0.5) * (box.h / ny);
    for (let i = 0; i < nx; i += 1) {
      const x = box.x + (i + 0.5) * (box.w / nx);
      if (!env.outline.contains(x, y)) continue;
      let best = -1;
      let nearest = Infinity;
      for (let k = 0; k < sites.length; k += 1) {
        if (owner[k] !== k) continue;
        const d = (sites[k][0] - x) ** 2 + (sites[k][1] - y) ** 2;
        if (d < nearest) {
          nearest = d;
          best = k;
        }
      }
      out[best] += 1;
      total += 1;
    }
  }
  return total === 0 ? out : out.map((n) => n / total);
}

/** What a Voronoi layer worked out. */
interface VoronoiMade {
  players: Player[];
  cells: P[][];
  shares: number[];
  skipped: number;
  /** Each team's share of the surface, in the order the teams first appear. */
  teams: { team: string; share: number; players: number }[];
  shared: number;
}

function computeVoronoi(layer: VoronoiLayer, env: Env): VoronoiMade {
  const unit = unitOfLayer(layer, env);
  const { items, skipped } = placeAll(layer, env, toArray(layer.data, "a voronoi layer"), unit);
  const sites = items.map((p): P => [p.x, p.y]);
  const cells = voronoiCells(sites, env.outline.box);
  const shares = surfaceShares(sites, env);
  const teams = [...groupByTeam(items, "team").entries()].map(([team, list]) => ({ team, share: list.reduce((sum, p) => sum + shares[items.indexOf(p)], 0), players: list.length }));
  return { players: items, cells, shares, skipped, teams, shared: cells.filter((c) => c.length === 0).length };
}

export function drawVoronoi(layer: VoronoiLayer, env: Env): Made {
  const made = newMade();
  const words = env.words.team;
  const c = computeVoronoi(layer, env);
  made.drawn = c.players.length;
  made.skipped = c.skipped;
  made.cls = "ky-tm";
  made.opacity = opacityOf(layer.opacity);
  made.style = `--w:${num(env.base * 0.12)}`;
  const out: string[] = [];
  c.players.forEach((p, i) => {
    if (c.cells[i].length === 0) return;
    const { cls, css } = paintOf(p.d);
    out.push(titled("path", `${attrs(`ky-sp${cls === "" ? "" : ` ${cls}`}`, css)} d="${polygonPath(c.cells[i])}"${markAttrs(env, (p.d as { id?: unknown }).id, p.index, [p.x, p.y])}`, `${[who(p), teamKey(p.d.team) === "" ? "" : teamLabel(teamKey(p.d.team), env)].filter((t) => t !== "").join(", ")}: ${round(100 * c.shares[i])}%`));
  });
  if (layer.points !== false) out.push(dots(c.players, env.base * 0.55, () => undefined, env));
  made.marks = out.join("");
  made.title = fill(words.voronoiTitle, { n: c.players.length });
  const list = [...c.teams].sort((a, b) => b.share - a.share).map((t) => fill(words.shareItem, { name: teamLabel(t.team, env), pct: round(100 * t.share) })).join(env.words.layers.listSep);
  const parts = [fill(words.voronoiNote, { list })];
  if (c.shared > 0) parts.push(fill(words.voronoiShared, { n: c.shared }));
  if (c.skipped > 0) parts.push(fill(env.words.layers.skipped, { n: c.skipped }));
  made.text = c.players.length === 0 ? "" : parts.join(env.words.said.gap);
  return made;
}

export function voronoiTable(layer: VoronoiLayer, env: Env): TeamTable[] {
  const w = env.words.team;
  const l = env.words.layers;
  const c = computeVoronoi(layer, env);
  const title = typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.voronoiTitle, { n: c.players.length });
  return [
    {
      head: [l.tableNo, w.tablePlayer, l.tableTeam, l.tableX, l.tableY, w.tableShare],
      rows: c.players.map((p, i) => [i + 1, who(p), teamKey(p.d.team), round(p.d.x as number, 2), round(p.d.y as number, 2), round(100 * c.shares[i])]),
      title,
      note: frameNote(layer, env),
    },
  ];
}

/** The groups a layer draws a shape for: the players of each team, or all of them. */
function groupsOf(layer: DelaunayLayer | HullLayer, env: Env): { groups: Map<string, Player[]>; skipped: number; all: Player[] } {
  const unit = unitOfLayer(layer, env);
  const { items, skipped } = placeAll(layer, env, toArray(layer.data, `a ${layer.kind} layer`), unit);
  return { groups: groupByTeam(items, layer.by), skipped, all: items };
}

interface TriMade {
  team: string;
  players: Player[];
  edges: [P, P][];
  triangles: [P, P, P][];
}

function computeDelaunay(layer: DelaunayLayer, env: Env): { groups: TriMade[]; all: Player[]; skipped: number } {
  const { groups, skipped, all } = groupsOf(layer, env);
  const out: TriMade[] = [];
  for (const [team, players] of groups) {
    const t = delaunay(players.map((p): P => [p.x, p.y]));
    const edges = triangulationEdges(t).map(([a, b]): [P, P] => [t.points[a], t.points[b]]);
    const triangles: [P, P, P][] = [];
    for (let i = 0; i < t.triangles.length; i += 3) triangles.push([t.points[t.triangles[i]], t.points[t.triangles[i + 1]], t.points[t.triangles[i + 2]]]);
    out.push({ team, players, edges, triangles });
  }
  return { groups: out, all, skipped };
}

export function drawDelaunay(layer: DelaunayLayer, env: Env): Made {
  const made = newMade();
  const words = env.words.team;
  const c = computeDelaunay(layer, env);
  made.drawn = c.all.length;
  made.skipped = c.skipped;
  made.cls = "ky-tm";
  made.opacity = opacityOf(layer.opacity);
  made.style = `--w:${num(env.base * 0.16)}`;
  const out: string[] = [];
  for (const g of c.groups) {
    const cls = teamClass(g.team);
    const name = teamLabel(g.team, env);
    const tip = `${name}: ${fill(words.delaunayNote, { triangles: g.triangles.length, edges: g.edges.length })}`;
    if (layer.triangles === true && g.triangles.length > 0) out.push(titled("path", `${attrs(`ky-sp${cls === "" ? "" : ` ${cls}`}`, "")} d="${g.triangles.map((t) => polygonPath(t)).join("")}"`, tip));
    else if (g.edges.length > 0) out.push(titled("path", `${attrs(`ky-sp ky-sp-e${cls === "" ? "" : ` ${cls}`}`, "")} d="${g.edges.map(([a, b]) => `M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}`).join("")}"`, tip));
  }
  if (layer.points !== false) out.push(dots(c.all, env.base * 0.55, () => undefined, env));
  made.marks = out.join("");
  made.title = fill(words.delaunayTitle, { n: c.all.length });
  const triangles = c.groups.reduce((s, g) => s + g.triangles.length, 0);
  const edges = c.groups.reduce((s, g) => s + g.edges.length, 0);
  const parts = [fill(words.delaunayNote, { triangles, edges })];
  if (c.skipped > 0) parts.push(fill(env.words.layers.skipped, { n: c.skipped }));
  made.text = c.all.length === 0 ? "" : parts.join(env.words.said.gap);
  return made;
}

export function delaunayTable(layer: DelaunayLayer, env: Env): TeamTable[] {
  const w = env.words.team;
  const l = env.words.layers;
  const c = computeDelaunay(layer, env);
  return [
    {
      head: [l.tableNo, l.tableTeam, w.tablePlayers, w.tableTriangles, w.tableEdges],
      rows: c.groups.map((g, i) => [i + 1, teamLabel(g.team, env), g.players.length, g.triangles.length, g.edges.length]),
      title: typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.delaunayTitle, { n: c.all.length }),
      note: "",
    },
  ];
}

interface HullMade {
  team: string;
  players: Player[];
  corners: P[];
  /** The area in the layer's units squared. */
  area: number;
  centroid: P | undefined;
}

function computeHull(layer: HullLayer, env: Env): { hulls: HullMade[]; all: Player[]; skipped: number; unit: string } {
  const { groups, skipped, all } = groupsOf(layer, env);
  const unit = unitOfLayer(layer, env);
  const k = FEET_PER[unit];
  const hulls = [...groups.entries()].map(([team, players]): HullMade => {
    const corners = convexHull(players.map((p): P => [p.x, p.y]));
    return { team, players, corners, area: polygonArea(corners) / (k * k), centroid: polygonCentroid(corners) };
  });
  return { hulls, all, skipped, unit };
}

export function drawHull(layer: HullLayer, env: Env): Made {
  const made = newMade();
  const words = env.words.team;
  const c = computeHull(layer, env);
  made.drawn = c.all.length;
  made.skipped = c.skipped;
  made.cls = "ky-tm";
  made.opacity = opacityOf(layer.opacity);
  made.style = `--w:${num(env.base * 0.16)}`;
  const out: string[] = [];
  for (const h of c.hulls) {
    const cls = teamClass(h.team);
    const tip = fill(words.hullItem, { name: teamLabel(h.team, env), n: h.players.length, area: Math.round(h.area), unit: squareWord(c.unit, env) });
    if (h.corners.length >= 3) out.push(titled("path", `${attrs(`ky-sp${cls === "" ? "" : ` ${cls}`}`, "")} d="${polygonPath(h.corners)}"`, tip));
    else if (h.corners.length === 2) out.push(titled("path", `${attrs(`ky-sp ky-sp-e${cls === "" ? "" : ` ${cls}`}`, "")} d="M${num(h.corners[0][0])} ${num(h.corners[0][1])}L${num(h.corners[1][0])} ${num(h.corners[1][1])}"`, tip));
  }
  if (layer.points !== false) out.push(dots(c.all, env.base * 0.55, () => undefined, env));
  made.marks = out.join("");
  made.title = fill(words.hullTitle, { n: c.all.length });
  const parts = [c.hulls.map((h) => fill(words.hullItem, { name: teamLabel(h.team, env), n: h.players.length, area: Math.round(h.area), unit: squareWord(c.unit, env) })).join(env.words.layers.listSep) + env.words.said.stop];
  if (c.skipped > 0) parts.push(fill(env.words.layers.skipped, { n: c.skipped }));
  made.text = c.all.length === 0 ? "" : parts.join(env.words.said.gap);
  return made;
}

export function hullTable(layer: HullLayer, env: Env): TeamTable[] {
  const w = env.words.team;
  const l = env.words.layers;
  const c = computeHull(layer, env);
  return [
    {
      head: [l.tableNo, l.tableTeam, w.tablePlayers, w.tableCorners, w.tableArea],
      rows: c.hulls.map((h, i) => [i + 1, teamLabel(h.team, env), h.players.length, h.corners.length, Math.round(h.area)]),
      title: typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.hullTitle, { n: c.all.length }),
      note: fill(w.tableUnit, { unit: unitWord(c.unit, env) }),
    },
  ];
}
