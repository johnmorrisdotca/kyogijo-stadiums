// The pass network: a node for each player at the average place of the passes he made and received, sized by touches, and a link for each pair of
// players sized and shaded by the passes between them. Written for this package from the plain arithmetic of counting and averaging; the idea
// is that of mplsoccer's pass-network example (MIT), and no code of it is used.
import { esc, num } from "./format.ts";
import { isNum, markAttrs, newMade, opacityOf, place, toArray, unitOfLayer, type Env, type Made } from "./layers.env.ts";
import { curveBetween, curvePath, headPath, type P } from "./layers.marks.ts";
import { fill } from "./strings.ts";
import { attrs, frameNote, round, teamClass, teamKey, titled, type TeamTable } from "./team.common.ts";
import type { NetworkLayer, PassDatum } from "./team.types.ts";
import { FEET_PER } from "./units.ts";

/** A player of the network. */
export interface Node {
  key: string;
  id: string | number;
  team: string;
  name: string;
  number: string;
  made: number;
  received: number;
  touches: number;
  /** Where he is, on the surface (feet), or undefined with no place to average. */
  at: P | undefined;
  /** Where he is, in the layer's own numbers. */
  given: P | undefined;
}

/** A link between two players. */
export interface Link {
  a: Node;
  b: Node;
  n: number;
  team: string;
}

/** What a network worked out from its passes. */
export interface Network {
  nodes: Node[];
  links: Link[];
  passes: number;
  skipped: number;
  /** Passes between players with no place, which no link can be drawn for. */
  unplaced: number;
  minPasses: number;
  directed: boolean;
}

const idText = (id: string | number): string => String(id);

/** Count the passes into nodes and links, average the places and put them on the surface. */
export function computeNetwork(layer: NetworkLayer, env: Env): Network {
  const unit = unitOfLayer(layer, env);
  const data = toArray(layer.data, "a network layer");
  const directed = layer.directed === true;
  const minPasses = isNum(layer.minPasses) && layer.minPasses > 1 ? Math.floor(layer.minPasses) : 1;
  const nodes = new Map<string, Node>();
  const nodeFor = (team: string, id: string | number): Node => {
    const key = `${team}\u0000${idText(id)}`;
    let n = nodes.get(key);
    if (n === undefined) {
      n = { key, id, team, name: "", number: "", made: 0, received: 0, touches: 0, at: undefined, given: undefined };
      nodes.set(key, n);
    }
    return n;
  };
  const counts = new Map<string, Link>();
  const raw: P[] = [];
  const owner: Node[] = [];
  let passes = 0;
  let skipped = 0;
  for (const d of data as readonly PassDatum[]) {
    const ok = typeof d === "object" && d !== null && (typeof d.from === "string" || isNum(d.from)) && (typeof d.to === "string" || isNum(d.to)) && idText(d.from) !== idText(d.to);
    if (!ok) {
      skipped += 1;
      continue;
    }
    const team = teamKey(d.team);
    const a = nodeFor(team, d.from);
    const b = nodeFor(team, d.to);
    passes += 1;
    a.made += 1;
    b.received += 1;
    if (typeof d.fromName === "string" && d.fromName !== "") a.name = d.fromName;
    if (typeof d.toName === "string" && d.toName !== "") b.name = d.toName;
    if (d.fromNumber !== undefined) a.number = String(d.fromNumber);
    if (d.toNumber !== undefined) b.number = String(d.toNumber);
    if (isNum(d.x) && isNum(d.y)) {
      raw.push([d.x, d.y]);
      owner.push(a);
    }
    if (isNum(d.x2) && isNum(d.y2)) {
      raw.push([d.x2, d.y2]);
      owner.push(b);
    }
    const [lo, hi] = directed || idText(d.from) <= idText(d.to) ? [a, b] : [b, a];
    const key = `${lo.key}\u0001${hi.key}`;
    const link = counts.get(key);
    if (link === undefined) counts.set(key, { a: lo, b: hi, n: 1, team });
    else link.n += 1;
  }
  const at = place(layer, env, raw, unit);
  const sums = new Map<Node, { x: number; y: number; n: number; gx: number; gy: number }>();
  raw.forEach((r, i) => {
    const s = sums.get(owner[i]) ?? { x: 0, y: 0, n: 0, gx: 0, gy: 0 };
    s.x += at[i][0];
    s.y += at[i][1];
    s.gx += r[0];
    s.gy += r[1];
    s.n += 1;
    sums.set(owner[i], s);
  });
  for (const [node, s] of sums) {
    node.at = [s.x / s.n, s.y / s.n];
    node.given = [s.gx / s.n, s.gy / s.n];
  }
  // Places given for some players win over the averages.
  const given = (layer.nodes ?? []).filter((n) => typeof n === "object" && n !== null && isNum(n.x) && isNum(n.y) && (typeof n.id === "string" || isNum(n.id)));
  if (given.length > 0) {
    const placed = place(layer, env, given.map((n): P => [n.x, n.y]), unit);
    given.forEach((n, i) => {
      const node = nodes.get(`${teamKey(n.team)}\u0000${idText(n.id)}`);
      if (node === undefined) return;
      node.at = placed[i];
      node.given = [n.x, n.y];
      if (typeof n.name === "string" && n.name !== "") node.name = n.name;
      if (n.number !== undefined) node.number = String(n.number);
    });
  }
  for (const n of nodes.values()) n.touches = n.made + n.received;
  const all = [...counts.values()];
  const unplaced = all.filter((l) => l.a.at === undefined || l.b.at === undefined).reduce((s, l) => s + l.n, 0);
  const links = all.filter((l) => l.n >= minPasses && l.a.at !== undefined && l.b.at !== undefined);
  const placedNodes = [...nodes.values()].filter((n) => n.at !== undefined);
  return { nodes: placedNodes, links, passes, skipped, unplaced, minPasses, directed };
}

/** What a player is called in a sentence: his name, else his number, else his id. */
export const nodeName = (n: Node): string => (n.name !== "" ? n.name : n.number !== "" ? n.number : idText(n.id));

/** The most touches of any node, and the strongest link. */
function leaders(net: Network): { busiest: Node | undefined; strongest: Link | undefined } {
  let busiest: Node | undefined;
  for (const n of net.nodes) if (busiest === undefined || n.touches > busiest.touches) busiest = n;
  let strongest: Link | undefined;
  for (const l of net.links) if (strongest === undefined || l.n > strongest.n) strongest = l;
  return { busiest, strongest };
}

/** A value of `[low, high]` the given fraction of the way through, by area (the square root of the squares) for a width. */
const between = (range: readonly [number, number], t: number, byArea: boolean): number => (byArea ? Math.sqrt(range[0] ** 2 + (range[1] ** 2 - range[0] ** 2) * t) : range[0] + (range[1] - range[0]) * t);

const rangeOf = (given: readonly [number, number] | undefined, fallback: readonly [number, number], k: number): [number, number] =>
  Array.isArray(given) && given.length === 2 && isNum(given[0]) && isNum(given[1]) && given[0] > 0 && given[1] > 0 ? [Math.min(given[0], given[1]) * k, Math.max(given[0], given[1]) * k] : [fallback[0], fallback[1]];

export function drawNetwork(layer: NetworkLayer, env: Env): Made {
  const made = newMade();
  const words = env.words.team;
  const net = computeNetwork(layer, env);
  const k = FEET_PER[unitOfLayer(layer, env)];
  const base = env.base;
  const size = rangeOf(layer.nodeSize, [base * 1.3, base * 3.2], k);
  const width = rangeOf(layer.linkWidth, [base * 0.1, base * 0.5], k);
  const alpha: [number, number] = Array.isArray(layer.linkOpacity) && layer.linkOpacity.length === 2 && isNum(layer.linkOpacity[0]) && isNum(layer.linkOpacity[1]) ? [Math.max(0, Math.min(1, layer.linkOpacity[0])), Math.max(0, Math.min(1, layer.linkOpacity[1]))] : [0.3, 0.9];
  const touchLo = Math.min(...net.nodes.map((n) => n.touches));
  const touchHi = Math.max(...net.nodes.map((n) => n.touches));
  const passLo = Math.min(...net.links.map((l) => l.n));
  const passHi = Math.max(...net.links.map((l) => l.n));
  const nodeWidth = (n: Node): number => between(size, touchHi === touchLo ? 0.5 : (n.touches - touchLo) / (touchHi - touchLo), true);
  const linkT = (l: Link): number => (passHi === passLo ? 0.5 : (l.n - passLo) / (passHi - passLo));
  made.drawn = net.passes;
  made.skipped = net.skipped;
  made.cls = "ky-tm";
  made.opacity = opacityOf(layer.opacity);
  made.style = `--w:${num(base * 0.12)}`;
  const links: string[] = [];
  for (const l of net.links) {
    const a = l.a.at as P;
    const b = l.b.at as P;
    if (a[0] === b[0] && a[1] === b[1]) continue;
    const w = between(width, linkT(l), false);
    const cls = teamClass(l.team);
    const o = between(alpha, linkT(l), false);
    const names = { a: nodeName(l.a), b: nodeName(l.b), n: l.n };
    const link = ` data-mark-id="${esc(`${idText(l.a.id)}-${idText(l.b.id)}`)}" data-index="${links.length}" data-from="${esc(idText(l.a.id))}" data-to="${esc(idText(l.b.id))}"`;
    if (net.directed) {
      const curve = curveBetween(a, b, 0.14);
      const hl = Math.max(w * 3.4, base * 0.9);
      const stop = nodeWidth(l.b) / 2;
      const shaft = curve.trim(stop + hl * 0.9);
      const head = headPath(curve.at(Math.max(0, curve.length - stop)), curve.tangent(Math.max(0, curve.length - stop)), hl, hl * 0.5, false);
      links.push(`<g${attrs(cls, "", o)}${link}><title>${esc(fill(words.linkTitleDirected, names))}</title><path class="ky-ln" stroke-width="${num(w)}" d="${curvePath(shaft)}"/><path class="ky-ah" d="${head}"/></g>`);
    } else links.push(titled("path", `${attrs(`ky-ln${cls === "" ? "" : ` ${cls}`}`, "", o)}${link} stroke-width="${num(w)}" d="M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}"`, fill(words.linkTitle, names)));
  }
  const nodes = net.nodes.map((n, index) => {
    const at = n.at as P;
    const cls = teamClass(n.team);
    return titled("circle", `${attrs(cls, "")} cx="${num(at[0])}" cy="${num(at[1])}" r="${num(nodeWidth(n) / 2)}"${markAttrs(env, idText(n.id), index, [at[0], at[1]])}`, fill(words.nodeTitle, { name: nodeName(n), touches: n.touches, made: n.made, received: n.received }));
  });
  const mode = layer.labels === "name" || layer.labels === "id" || layer.labels === "none" || layer.labels === "number" ? layer.labels : "number";
  const text: string[] = [];
  if (mode !== "none") {
    for (const n of net.nodes) {
      const at = n.at as P;
      const label = mode === "name" ? (n.name !== "" ? n.name : idText(n.id)) : mode === "id" ? idText(n.id) : n.number !== "" ? n.number : idText(n.id);
      const r = nodeWidth(n) / 2;
      const fs = Math.min(r * 1.15, (r * 2 * 0.9) / Math.max(1.2, label.length * 0.62));
      const angle = env.turned ? ` transform="rotate(-90 ${num(at[0])} ${num(at[1])})"` : "";
      text.push(`<text class="ky-lt" style="font-size:${num(fs)}px" x="${num(at[0])}" y="${num(at[1] + fs * 0.36)}"${angle}>${esc(label)}</text>`);
    }
  }
  made.marks = `<g class="ky-nl">${links.join("")}</g>${nodes.length === 0 ? "" : `<g class="ky-pts">${nodes.join("")}</g>`}${text.length === 0 ? "" : `<g text-anchor="middle">${text.join("")}</g>`}`;
  made.title = fill(words.networkTitle, { players: net.nodes.length, links: net.links.length, passes: net.passes });
  const { busiest, strongest } = leaders(net);
  const parts: string[] = [];
  if (busiest !== undefined && strongest !== undefined) parts.push(fill(net.directed ? words.networkNoteDirected : words.networkNote, { name: nodeName(busiest), touches: busiest.touches, a: nodeName(strongest.a), b: nodeName(strongest.b), n: strongest.n }));
  if (net.minPasses > 1) parts.push(fill(words.networkMin, { n: net.minPasses }));
  if (net.skipped > 0) parts.push(fill(env.words.layers.skipped, { n: net.skipped }));
  made.text = parts.join(env.words.said.gap);
  return made;
}

export function networkTables(layer: NetworkLayer, env: Env): TeamTable[] {
  const w = env.words.team;
  const l = env.words.layers;
  const net = computeNetwork(layer, env);
  const title = typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.networkTitle, { players: net.nodes.length, links: net.links.length, passes: net.passes });
  const ranked = [...net.nodes].sort((a, b) => b.touches - a.touches);
  return [
    {
      head: [l.tableNo, w.tablePlayer, l.tableTeam, w.tableTouches, w.tableMade, w.tableReceived, l.tableX, l.tableY],
      rows: ranked.map((n, i) => [i + 1, nodeName(n), n.team, n.touches, n.made, n.received, n.given === undefined ? null : round(n.given[0], 2), n.given === undefined ? null : round(n.given[1], 2)]),
      title,
      note: [frameNote(layer, env), net.minPasses > 1 ? fill(w.networkMin, { n: net.minPasses }) : ""].filter((t) => t !== "").join(env.words.said.gap),
    },
    {
      head: [l.tableNo, w.tableFrom, w.tableTo, l.tableTeam, w.tablePasses],
      rows: [...net.links].sort((a, b) => b.n - a.n).map((link, i) => [i + 1, nodeName(link.a), nodeName(link.b), link.team, link.n]),
      title: `${title}${env.words.said.colon}${w.tablePasses}`,
      note: "",
    },
  ];
}
