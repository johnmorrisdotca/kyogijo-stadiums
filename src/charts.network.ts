// The pass network chart: who passed to whom on a pitch, each player a node at the average place of his passes, sized by touches, and each pair of players a link
// sized by their passes, with a key and a table. The idea is that of mplsoccer's pass-network example (MIT); no code of it, nor of sportypy or sportyR (GPL), is used.
import { envFor } from "./layers.env.ts";
import { fill } from "./strings.ts";
import { assemble, clean, drawingOptions, frameOf, fromOf, keyLayers, languageOf, wordsOf } from "./charts.ts";
import type { Chart, ChartOptions, KeyItem } from "./charts.types.ts";
import type { Frame } from "./frames.ts";
import type { Layer } from "./layers.types.ts";
import type { SoccerProviderId } from "./surfaces/soccer-providers.ts";
import { computeNetwork, nodeName } from "./team.network.ts";
import type { NetworkLayer, PassDatum } from "./team.types.ts";
import type { SurfaceOptions } from "./types.ts";

/** A pass of a pass network: who made it and who received it, from where to where. */
export type PassNetworkPass = PassDatum;

/** What `passNetwork` takes. */
export interface PassNetworkOptions extends ChartOptions {
  /** The provider the passes are in (`opta`, `statsbomb`, `wyscout`, ...): the pitch is drawn in its numbers. Or a `Frame` of your own. `international` (metres) by default. */
  provider?: SoccerProviderId | Frame;
  /** The end the passes attack, in the provider's numbers: `right` (the default) or `left`. */
  attacking?: "left" | "right";
  /** Leave out links of fewer passes than this. 3 by default, so that a network of a match is readable; 1 draws every link. */
  minPasses?: number;
  /** Draw a link for each direction, with a head. */
  directed?: boolean;
  /** What is written in a node: the shirt `number` (the default), the `name`, the `id` or `none`. */
  labels?: "number" | "name" | "id" | "none";
  /** The pitch: a preset or a size, as `pitch` of a drawing. */
  pitch?: SurfaceOptions["pitch"];
  /** The ground, as `ground` of a drawing. */
  ground?: string;
}

/** The numbers behind a pass network. */
export interface PassNetworkTotals {
  /** Passes counted, and rows left out for want of a passer or a receiver. */
  passes: number;
  skipped: number;
  /** Players with a place, and links drawn (those of at least `minPasses` passes). */
  players: number;
  links: number;
  /** The player with most touches, or null with none. */
  busiest: { id: string | number; name: string; touches: number } | null;
  /** The link with most passes, or null with none. */
  strongest: { from: string; to: string; passes: number } | null;
}

/**
 * A pass network for soccer: a node for each player at the average place of the passes he made and received, sized by touches, and a link for each pair of
 * players, wider and darker the more passes there were between them. Links of fewer than `minPasses` passes (3) are left out. The numbers behind it are in `totals`,
 * and `table()` lists the players and the links as text.
 * @example
 * ```ts
 * import { passNetwork } from "@johnmorrisdotca/kyogijo/charts";
 * const passes = [
 *   { from: 4, to: 8, x: 30, y: 40, x2: 45, y2: 55, team: "home" },
 *   { from: 8, to: 4, x: 45, y: 55, x2: 32, y2: 42, team: "home" },
 *   { from: 4, to: 8, x: 31, y: 41, x2: 46, y2: 54, team: "home" },
 *   { from: 8, to: 9, x: 46, y: 54, x2: 70, y2: 50, team: "home" },
 * ];
 * const chart = passNetwork(passes, { provider: "opta", minPasses: 2 });
 * console.log(chart.totals.passes, chart.totals.players, chart.totals.links, chart.totals.strongest);
 * // 4 3 1 { from: '4', to: '8', passes: 3 }
 * ```
 */
export function passNetwork(passes: readonly PassNetworkPass[], options: PassNetworkOptions = {}): Chart<PassNetworkTotals> & { key: KeyItem[] } {
  if (!Array.isArray(passes)) throw new TypeError("passes is a list of passes");
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const provider = options.provider ?? "international";
  const frame = frameOf(provider, "international");
  const o = drawingOptions("soccer", options, w.titlePassNetwork, {
    ...(typeof provider === "string" ? { pitchType: provider } : {}),
    ...(options.pitch === undefined ? {} : { pitch: options.pitch }),
    ...(options.ground === undefined ? {} : { ground: options.ground }),
  });
  const attacking = options.attacking === "left" ? ("left" as const) : undefined;
  const layer: NetworkLayer = clean({
    kind: "network" as const,
    id: "network",
    name: w.passes,
    ...clean({ from: fromOf(typeof provider === "object" ? provider : undefined, frame), attacking }),
    data: passes,
    minPasses: typeof options.minPasses === "number" ? options.minPasses : 3,
    directed: options.directed,
    labels: options.labels,
  });
  const layers: Layer[] = [layer];
  if (options.key !== false) layers.push(...keyLayers(o, [], {}, all, [w.sizeTouches, w.widthPasses]));
  const net = computeNetwork(layer, envFor(o, false));
  let busiest: PassNetworkTotals["busiest"] = null;
  for (const n of net.nodes) if (busiest === null || n.touches > busiest.touches) busiest = { id: n.id, name: nodeName(n), touches: n.touches };
  let strongest: PassNetworkTotals["strongest"] = null;
  for (const l of net.links) if (strongest === null || l.n > strongest.passes) strongest = { from: nodeName(l.a), to: nodeName(l.b), passes: l.n };
  const totals: PassNetworkTotals = { passes: net.passes, skipped: net.skipped, players: net.nodes.length, links: net.links.length, busiest, strongest };
  const summary = fill(w.sumNetwork, { passes: totals.passes, players: totals.players, links: totals.links });
  return assemble(o, layers, { title: w.titlePassNetwork, summary, totals });
}
