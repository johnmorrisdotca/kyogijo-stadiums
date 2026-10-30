// The spray chart: balls in play on the ballpark of their season, each hit type in its own mark, with the balls that cleared the fence drawn
// beyond it and, if asked, the spray zones. Written for this package: the spray angle and the Gameday pixels are documented in
// docs/sources.md (the `mlbam` frame); the code of GeomMLBStadiums (GPL), which draws the same kind of chart, was not read.
import { fenceAt } from "./geometry.ts";
import { convert } from "./frames.ts";
import { zoneToPoint } from "./frames.providers.ts";
import type { Layer, PointDatum, PointStyle, PointsLayer } from "./layers.types.ts";
import type { ZoneSetId, ZonesLayer } from "./heat.types.ts";
import { outlineOf } from "./outline.ts";
import { fenceFor, heldPark } from "./parks.core.ts";
import { MLB } from "./geometry.ts";
import { fill } from "./strings.core.ts";
import type { Ball, Chart, KeyItem, MlbSprayOptions, MlbTotals } from "./charts.types.ts";
import { assemble, clean, countOutcomes, describeCounts, drawingOptions, frameOf, fromOf, hasPlace, keyItems, keyLayers, languageOf, placed, wordsOf, zoneTotals, type KeyEntry, type Look } from "./charts.ts";

/** The look of each hit type: a shape and a size as well as a fill, so that a type is never told by colour alone. */
const LOOKS: Record<string, Look> = {
  single: { scale: 0.9 },
  double: { shape: "diamond", scale: 1.15 },
  triple: { shape: "triangle", scale: 1.25 },
  "home run": { shape: "star", scale: 1.55 },
  out: { hollow: true, scale: 0.9 },
};

const ORDER = ["single", "double", "triple", "home run", "out"];
const HITS = ["single", "double", "triple", "home run"];

/** A ball's type as one of the five words of the chart, from the words of Statcast's `events` (`home_run`, `field_out`) and the usual short forms; any other word is kept, in lower case. */
export function ballType(type: string | undefined): string | undefined {
  if (typeof type !== "string" || type.trim() === "") return undefined;
  const key = type.trim().toLowerCase().replace(/[_-]+/g, " ");
  const exact: Record<string, string> = { single: "single", "1b": "single", double: "double", "2b": "double", triple: "triple", "3b": "triple", "home run": "home run", homer: "home run", hr: "home run", out: "out" };
  if (Object.prototype.hasOwnProperty.call(exact, key)) return exact[key];
  // Every way of being put out (a flyout, a groundout, a double play, a fielder's choice, a sacrifice) is an out.
  return /out|play|sac|fielder|choice/.test(key) ? "out" : key;
}

/**
 * A spray chart for baseball from batted-ball data: where each ball came down, on the ballpark of that season (`park` and `year`, past parks
 * included, each with the fence it had then), each hit type in its own mark (a single a small circle, a double a diamond, a triple a triangle,
 * a home run a star, an out an open circle), the balls that came down beyond the fence drawn beyond it, and if asked the spray zones (pull,
 * centre and opposite by infield and outfield, by the side the batter bats from). Balls come as Statcast's `hc_x` and `hc_y` (`mlbam`), as feet
 * from home plate (`retrosheet`) or as Retrosheet's hit-location codes.
 * @example
 * ```ts
 * import { mlbSprayChart } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const chart = mlbSprayChart(
 *   [
 *     { x: 125.4, y: 90, type: "single" },
 *     { x: 60, y: 60, type: "home_run" },
 *     { x: 150, y: 120, type: "field_out" },
 *     { zone: "8D", type: "double" },
 *   ],
 *   { park: "polo-grounds", year: 1915, bats: "R", zones: true },
 * );
 * console.log(chart.totals.balls, chart.totals.types["home run"], chart.options.park, chart.options.year);
 * console.log(chart.draw().includes("Polo Grounds"));
 * // 4 1 polo-grounds 1915
 * // true
 * ```
 */
export function mlbSprayChart(balls: readonly Ball[], options: MlbSprayOptions = {}): Chart<MlbTotals> & { key: KeyItem[] } {
  if (!Array.isArray(balls)) throw new TypeError("balls is a list of balls");
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const frame = frameOf(options.from, "mlbam");
  const park = options.park === undefined ? undefined : heldPark(options.park);
  if (options.park !== undefined && options.park !== "generic" && park === undefined) throw new RangeError(`Unknown park "${options.park}": use a key of PARKS, such as "fenway-park"`);
  const margin = typeof options.margin === "number" && options.margin >= 0 ? options.margin : 40;
  const o = drawingOptions("mlb", options, w.titleMlb, { margin, ...(options.park === undefined ? {} : { park: options.park }), ...(options.year === undefined ? {} : { year: options.year }) });
  const where = { from: fromOf(options.from, frame) };
  // A ball given by its Retrosheet zone is put at the zone's centre, in the frame of the chart.
  const toFrame = frame.name === "retrosheet" ? undefined : convert("retrosheet", frame);
  const rows = balls.map((b) => {
    let { x, y } = b;
    if ((x === undefined || x === null || y === undefined || y === null) && typeof b.zone === "string") {
      const at = zoneToPoint(b.zone);
      if (at !== undefined) [x, y] = toFrame === undefined ? at : toFrame([at])[0];
    }
    return clean({ id: b.id, x: x ?? null, y: y ?? null, outcome: ballType(b.type), value: b.value, team: b.team, title: b.title });
  });
  const { counts, placed: count, skipped } = countOutcomes(rows);
  // The fence of the park in that season, and the balls that came down beyond it: each ball's distance and its angle from dead centre, from the surface's own feet.
  const fence = fenceFor(park, undefined, options.year);
  const at = placed(o, where, rows);
  const beyond = rows.map((row, i) => {
    const p = at[i];
    if (p === undefined) return false;
    const angle = (Math.atan2(p[0], -p[1]) * 180) / Math.PI;
    return Math.abs(angle) <= 45 && p[1] < 0 && Math.hypot(p[0], p[1]) > fenceAt(fence, angle);
  });
  const inside = rows.filter((row, i) => !beyond[i]);
  const outside = rows.filter((row, i) => beyond[i]);
  const known = ORDER.filter((k) => counts.has(k));
  const other = [...counts.keys()].filter((k) => k !== "" && !ORDER.includes(k));
  const labels: Record<string, string> = { single: w.single, double: w.double, triple: w.triple, "home run": w.homeRun, out: w.out };
  const entries: KeyEntry[] = [...known, ...other].map((k) => ({ label: labels[k] ?? k, outcome: k }));
  const layers: Layer[] = [];
  let zonesLayer: ZonesLayer | undefined;
  if (options.zones !== undefined && options.zones !== false) {
    const statistic = options.statistic ?? "share";
    const stat = statistic === "count" ? { statistic: "count" as const } : statistic === "hit-rate" ? { statistic: "rate" as const, statisticName: w.hitRate, success: HITS } : { statistic: "percent" as const };
    zonesLayer = clean({
      kind: "zones" as const,
      id: "zones",
      name: w.balls,
      zones: (options.zones === true ? "baseball-spray" : options.zones) as ZoneSetId,
      ...where,
      bats: options.bats,
      data: rows,
      ...stat,
      success: HITS,
      labels: options.labels === false ? undefined : options.zones === "baseball-retrosheet" ? undefined : { show: ["value"] as "value"[] },
      ramp: options.ramp ?? "ocean",
      legend: options.legend === false ? undefined : true,
    });
    layers.push(zonesLayer);
  }
  const style: PointStyle = { outcomes: LOOKS, scale: 0.8, opacity: 0.9 };
  if (options.marks !== false) {
    const description = describeCounts(entries, counts, all);
    layers.push(clean({ kind: "points" as const, id: "balls", name: w.balls, description: description === "" ? undefined : description, ...where, data: inside, style }) as PointsLayer);
    if (outside.length > 0) {
      // Over the ground round the fence, held on the drawing, with a note of how many.
      const { box } = outlineOf(o);
      const hold = margin - 6;
      layers.push({
        kind: "points",
        id: "beyond",
        name: w.ballsBeyond,
        description: fill(w.beyondNote, { n: outside.length }),
        ...where,
        data: outside as PointDatum[],
        style,
        clip: "none",
        limits: { x: [box.x - hold, box.x + box.w + hold], y: [box.y - hold, box.y + box.h + MLB.backstop] },
      });
    }
  }
  // The key goes behind home plate, where no ball comes down.
  if (options.key !== false) layers.push(...keyLayers(o, entries, LOOKS, all, [], { y: MLB.backstop * 0.5 }));
  const types: Record<string, number> = {};
  for (const k of [...known, ...other]) types[k] = counts.get(k) ?? 0;
  const totals: MlbTotals = { balls: count, types, beyondFence: outside.filter(hasPlace).length, skipped, zones: zonesLayer === undefined ? [] : zoneTotals(o, zonesLayer) };
  const list = entries.filter((e) => counts.has(e.outcome ?? "")).map((e) => fill(all.layers.item, { name: e.label, n: counts.get(e.outcome ?? "") ?? 0 })).join(all.layers.listSep);
  const summary = [fill(w.sumMlb, { balls: count, list }), outside.length > 0 ? fill(w.beyondNote, { n: outside.length }) : ""].filter((s) => s !== "").join(all.said.gap);
  const chart = assemble(o, layers, { title: w.titleMlb, summary, totals });
  chart.key = keyItems(entries, LOOKS);
  return chart;
}
