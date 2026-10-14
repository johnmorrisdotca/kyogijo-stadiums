// The swimming chart: the splits of a race as pace bars in the lanes of the pool, with the table that stands for it. A race of 200 m in a 50 m pool is swum along its lane and back; the chart lays it out
// flat, so that each lane is the whole race from the start (left) to the finish (right), each split a bar whose length is its share of the race and whose colour is its pace against the field's, written
// in seconds per 100 m. Written for this package; nothing of any other package is used.
import { drawKyogijo } from "./draw.ts";
import { esc } from "./format.ts";
import { swimPlan } from "./pool.ts";
import { formatTime, pacePer100, splitMetres } from "./pool.race.ts";
import type { PoolRace, PoolStyle } from "./pool.types.ts";
import type { Chart, ChartOptions } from "./charts.types.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/** One split of a swimmer: the metres it covers, the seconds it took, and its pace. */
export interface SplitRow {
  /** The distance at which the split ends, in metres of the race. */
  distance: number;
  /** The seconds of the split itself, and the cumulative time at its end. */
  seconds: number;
  cumulative: number;
  /** Seconds per 100 m. */
  pace: number;
}

/** What a swimmer's splits come to. */
export interface SwimmerSplits {
  lane: number;
  name: string;
  splits: SplitRow[];
}

/** The numbers behind a splits chart. */
export interface SplitsTotals {
  swimmers: number;
  /** The metres of the race and the metres between splits. */
  distance: number;
  splitEvery: number;
  /** The swimmers' splits, in the order down the pool. */
  rows: SwimmerSplits[];
  /** The fastest split of the field: whose it is, which one (from 1) and its pace; undefined with no splits. */
  fastest: { lane: number; name: string; split: number; seconds: number; pace: number } | undefined;
  slowest: { lane: number; name: string; split: number; seconds: number; pace: number } | undefined;
}

/** What a splits chart takes beyond a chart's own options. */
export interface SplitsOptions extends ChartOptions {
  /** The pool: the course (`short` for 25 m), the lanes, the look of the water and the deck. */
  pool?: Omit<PoolStyle, "race">;
  /** Write each bar's time on it. On by default. */
  labels?: boolean;
}

/**
 * The splits of a race as a chart: pace bars in the lanes of a pool (`pool.race.pace`), a title, a sentence that sums it up, the numbers (`totals`) and an HTML table of every split for a reader who cannot see the
 * drawing. The splits are cumulative times, one every 50 m (every 25 m in a short course pool) unless the race says another distance.
 * @example
 * ```ts
 * import { splitsChart } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const chart = splitsChart({
 *   distance: 100,
 *   swimmers: [
 *     { lane: 4, name: "A. Swimmer", splits: [25.1, 52.4] },
 *     { lane: 5, name: "B. Swimmer", splits: [25.6, 52.9] },
 *   ],
 * });
 * console.log(chart.totals.fastest?.name, chart.totals.fastest?.pace, chart.draw().startsWith("<svg"));
 * // A. Swimmer 50.2 true
 * ```
 */
export function splitsChart(race: PoolRace, options: SplitsOptions = {}): Chart<SplitsTotals> {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const w = KYOGIJO_STRINGS[language].pool.chart;
  const pool: PoolStyle = { ...(options.pool ?? {}), race: { ...race, pace: { labels: options.labels !== false } } };
  const plan = swimPlan({ sport: "swimming", pool });
  const planRace = plan.race;
  if (planRace === undefined) throw new TypeError("a splits chart needs a race: { swimmers: [...] }");
  const rows: SwimmerSplits[] = planRace.rows.map((row) => ({
    lane: row.lane,
    name: row.name,
    splits: row.splits
      .map((cum, i): SplitRow | undefined => {
        const from = i === 0 ? 0 : row.splits[i - 1];
        if (!Number.isFinite(cum) || !Number.isFinite(from)) return undefined;
        const metres = splitMetres(i, planRace.splitEvery, planRace.distance);
        return { distance: Math.min(planRace.distance, (i + 1) * planRace.splitEvery), seconds: Math.round((cum - from) * 100) / 100, cumulative: cum, pace: Math.round(pacePer100(from, cum, metres) * 100) / 100 };
      })
      .filter((split): split is SplitRow => split !== undefined),
  }));
  const all = rows.flatMap((row) => row.splits.map((split, i) => ({ lane: row.lane, name: row.name, split: i + 1, seconds: split.seconds, pace: split.pace })));
  const fastest = all.length === 0 ? undefined : all.reduce((a, b) => (b.pace < a.pace ? b : a));
  const slowest = all.length === 0 ? undefined : all.reduce((a, b) => (b.pace > a.pace ? b : a));
  const title = planRace.event === undefined ? w.title : `${w.title}${KYOGIJO_STRINGS[language].said.sep}${planRace.event}`;
  const totals: SplitsTotals = { swimmers: rows.length, distance: planRace.distance, splitEvery: planRace.splitEvery, rows, fastest, slowest };
  const summary = fastest === undefined ? "" : fill(w.summary, { n: rows.length, name: fastest.name, time: formatTime(fastest.seconds) });
  const merged: SurfaceOptions = { sport: "swimming", language, ...(options.id === undefined ? {} : { id: options.id }), title, pool, ...(options.surface ?? {}) };
  const columns = Math.max(0, ...rows.map((row) => row.splits.length));
  return {
    options: merged,
    layers: [],
    title,
    summary,
    totals,
    draw(extra: Partial<SurfaceOptions> = {}): string {
      return drawKyogijo({ ...merged, ...extra });
    },
    table(): string {
      const head = [w.headLane, w.headName, ...Array.from({ length: columns }, (_, i) => `${w.headSplit} ${i + 1}`), w.headPace].map((text, i) => `<th scope="col"${i === 0 ? "" : ""}>${esc(text)}</th>`).join("");
      const body = rows
        .map((row) => {
          const cells = Array.from({ length: columns }, (_, i) => `<td>${row.splits[i] === undefined ? "" : `${formatTime(row.splits[i].seconds)} (${row.splits[i].pace.toFixed(2)})`}</td>`).join("");
          const mean = row.splits.length === 0 ? "" : (row.splits.reduce((sum, s) => sum + s.pace, 0) / row.splits.length).toFixed(2);
          return `<tr><th scope="row">${row.lane}</th><td>${esc(row.name)}</td>${cells}<td>${mean}</td></tr>`;
        })
        .join("");
      return `<table class="ky-table" data-kind="splits"><caption>${esc(fill(w.caption, { event: planRace.event ?? w.title }))}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    },
  };
}
