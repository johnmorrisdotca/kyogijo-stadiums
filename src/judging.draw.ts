// A judging assignment drawn: for each mat, the package's own judo area with a badge at every judge's seat and, where a name and its ID fit in the seat, a card with both; beside it (or under it) the chart of mat, seat,
// name and ID, whose rows grow to hold every name and ID whole. The surface is not drawn a second way: its markup is the drawing's own, moved and clipped. The same options always give the same string. The text
// alternative is `judgingTable`.
export { judgingText } from "./judging.text.ts";
import { metaMarkup, safeClass } from "./common.ts";
import { el, esc, hash, num } from "./format.ts";
import { broadcastDrawing } from "./judging.broadcast.ts";
import { fitChart, type CardFit } from "./judging.fit.ts";
import { metricsOf, planMarkup, surfacesOf, type Metrics } from "./judging.plan.ts";
import { judgingPlan, judgingSetting, type JudgingSetting } from "./judging.ts";
import { judgingText } from "./judging.text.ts";
import { KYOGIJO_JUDGING_STYLE } from "./judging.style.ts";
import type { JudgingAssignment, JudgingOptions, JudgingResolved } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import { fill } from "./strings.core.ts";
import { LINE_HEIGHT } from "./text.ts";
import { VERSION } from "./version.ts";

/** What a drawing of an assignment is, and what was worked out to make it. */
export interface JudgingDrawing {
  svg: string;
  /** The picture's width and height in its own units (its viewBox). */
  width: number;
  height: number;
  /** Whether the chart is drawn. */
  chart: boolean;
  /** For every seat of every mat drawn: whether its name and ID are in the seat. A seat with nobody in it fits. */
  cards: { mat: number; seat: string; fits: boolean }[];
  title: string;
  description: string;
  /** The broadcast view: where each mat's board is and where the part of the mat that is shown is and where the middle of its contest area is, in the picture's units (the board lies over neither). Empty for the plan view. */
  boards: { mat: number; x: number; y: number; width: number; height: number; plan: { x: number; y: number; width: number; height: number }; centre: { x: number; y: number } }[];
}

/** One chart row's layout: where its text goes, in its own box from (0, 0). */
interface Row {
  a: JudgingAssignment;
  height: number;
  fit: CardFit | undefined;
}

/** The rows of one mat's chart, each as tall as its name and ID need, set in a chart `width` wide. */
function chartRows(mat: JudgingResolved, width: number, m: Metrics, setting: Pick<JudgingSetting, "language">): Row[] {
  const words = JUDGING_WORDS[setting.language];
  // `textWidth` is an estimate, and a face wider than the one it estimates (the DejaVu and Verdana of a Linux or Windows screen) would put a line across the row's edge: a margin of 6 % keeps every line inside it.
  const textW = (width - m.rowPad * 1.6 - m.badge - m.gap * 0.6) * 0.94;
  return mat.seats.map((a): Row => {
    if (!a.assigned) return { a, fit: undefined, height: Math.max(m.badge + 2 * m.rowPad, m.rowPad * 2 + m.role * LINE_HEIGHT + 6 * m.k + m.nameMin * LINE_HEIGHT) };
    const fit = fitChart({ name: a.name, id: a.id, idLabel: words.chart.idLabel, width: textW, max: m.nameMax, min: m.nameMin });
    const height = m.rowPad * 2 + m.role * LINE_HEIGHT + 6 * m.k + fit.height;
    return { a, fit, height: Math.max(height, m.badge + 2 * m.rowPad) };
  });
}

/** The chart of one mat as markup at (x, y), `width` wide, and its height. */
function chartMarkup(mat: JudgingResolved, x: number, y: number, width: number, m: Metrics, setting: JudgingSetting): { markup: string; height: number } {
  const words = JUDGING_WORDS[setting.language];
  const rows = chartRows(mat, width, m, setting);
  const gap = 8 * m.k;
  let cursor = 0;
  let out = "";
  for (const row of rows) {
    const { a, fit } = row;
    const cx = m.rowPad * 0.8 + m.badge / 2;
    const tx = m.rowPad * 0.8 + m.badge + m.gap * 0.6;
    let inside = el("rect", { class: "ky-ju-row", x: 0, y: cursor, width, height: row.height, rx: 14 * m.k });
    inside += el("circle", { class: a.assigned ? "ky-ju-badge" : "ky-ju-badge ky-ju-badge-empty", cx, cy: cursor + row.height / 2, r: m.badge / 2 });
    inside += el("text", { class: "ky-ju-badge-n", x: cx, y: cursor + row.height / 2 + m.badge * 0.18, "font-size": m.badge * 0.52 }, String(a.seat.n));
    let ty = cursor + m.rowPad + m.role * 0.82;
    inside += el("text", { class: "ky-ju-role", x: tx, y: ty, "font-size": m.role }, esc(a.seat.label[setting.language]));
    ty += m.role * 0.3 + 6 * m.k;
    if (fit === undefined) {
      inside += el("text", { class: "ky-ju-vacant", x: tx, y: ty + m.nameMin * 0.95, "font-size": m.nameMin }, esc(words.chart.vacant));
    } else {
      for (const line of fit.name) {
        inside += el("text", { class: "ky-ju-name", x: tx, y: ty + fit.nameSize * 0.88, "font-size": fit.nameSize }, esc(line));
        ty += fit.nameSize * LINE_HEIGHT;
      }
      if (fit.id.length > 0) {
        ty += fit.name.length > 0 ? fit.nameSize * 0.28 : 0;
        for (const line of fit.id) {
          inside += el("text", { class: "ky-ju-id", x: tx, y: ty + fit.idSize * 0.88, "font-size": fit.idSize }, esc(line));
          ty += fit.idSize * LINE_HEIGHT;
        }
      }
    }
    out += el("g", { class: "ky-ju-chart-row", "data-mat": mat.n, "data-seat": a.seat.id }, inside);
    cursor += row.height + gap;
  }
  const height = Math.max(0, cursor - gap);
  return { markup: el("g", { class: "ky-ju-chart", "data-mat": mat.n, transform: `translate(${num(x)} ${num(y)})` }, out), height };
}

/** The picture of an assignment and what was worked out to make it. `mode` `chart` is the chart alone (for beside a 3D view). */
export function judgingDrawing(options: JudgingOptions, mode: "full" | "chart" = "full"): JudgingDrawing {
  const setting = judgingSetting(mode === "chart" && options.width === undefined ? { ...options, width: 600 } : options);
  if (setting.view === "broadcast" && mode === "full") return broadcastDrawing(options, setting);
  const language = setting.language;
  const width = setting.width;
  const m = metricsOf(width);
  const geom = judgingPlan(setting.style);
  const region = setting.focus === "bench" ? geom.bench : { x0: geom.extent.x0 - 0.3, y0: geom.extent.y0 - 0.3, x1: geom.extent.x1 + 0.3, y1: geom.extent.y1 + 0.3 };
  const gid = safeClass(options.id).replace(/ /g, "-") || `ky-ju-${hash(JSON.stringify([options, mode, VERSION]))}`;
  const portrait = setting.orientation === "portrait";

  // The surface, drawn by the package: once for its stylesheet, then once for each mat (its ids differ).
  const { surfaces, style, look } = surfacesOf(setting, options, gid, mode !== "chart");

  // Whether the chart is drawn: asked for, or every name fits in its seat when the plan has the room that the chart would take.
  const planBox = (withChart: boolean): { w: number; h: number } => {
    if (portrait) return { w: width - 2 * m.pad, h: (withChart ? 0.66 : 0.86) * width };
    return withChart ? { w: 0.48 * (width - 2 * m.pad - m.gap), h: 640 * m.k } : { w: width - 2 * m.pad, h: 0.82 * width };
  };
  const trial = (withChart: boolean): boolean[] => {
    const box = planBox(withChart);
    return setting.mats.flatMap((mat, i) => planMarkup(mat, surfaces[i], geom, region, { x: 0, y: 0, ...box }, m, setting, "t").fits);
  };
  let chart = mode === "chart" || setting.chart === "always";
  // `auto`: the chart is the key to the numbers, so it is drawn unless the names are on the seats and every one fits there.
  if (mode === "full" && setting.chart === "auto") chart = !setting.seatNames || !trial(false).every(Boolean);
  if (mode === "full" && setting.chart === "never") chart = false;
  const cardsFit = mode === "chart" ? [] : trial(chart);

  // The panels, one under another.
  let body = "";
  let y = m.pad;
  const cards: JudgingDrawing["cards"] = [];
  const styleText = fill(JUDGING_WORDS[language].styleName[setting.style], { count: setting.mats[0].seats.length });
  setting.mats.forEach((mat, i) => {
    let panel = el("text", { class: "ky-ju-mat", x: m.pad, y: y + 42 * m.k, "font-size": 38 * m.k }, esc(mat.label));
    panel += el("text", { class: "ky-ju-style", x: width - m.pad, y: y + 40 * m.k, "font-size": 21 * m.k, "text-anchor": "end" }, esc(styleText));
    const top = y + m.titleH;
    let bottom = top;
    if (mode === "full") {
      const box = planBox(chart);
      const plan = planMarkup(mat, surfaces[i], geom, region, { x: m.pad, y: top, ...box }, m, setting, `${gid}-c${mat.n}`);
      panel += plan.markup;
      bottom = top + plan.height;
      mat.seats.forEach((a, k) => cards.push({ mat: mat.n, seat: a.seat.id, fits: plan.fits[k] }));
      if (chart) {
        const cx = portrait ? m.pad : m.pad + box.w + m.gap;
        const cy = portrait ? bottom + m.gap : top;
        const cw = portrait ? width - 2 * m.pad : width - m.pad - cx;
        const c = chartMarkup(mat, cx, cy, cw, m, setting);
        panel += c.markup;
        bottom = Math.max(bottom, cy + c.height);
      }
    } else {
      const c = chartMarkup(mat, m.pad, top, width - 2 * m.pad, m, setting);
      panel += c.markup;
      bottom = top + c.height;
    }
    body += el("g", { class: "ky-ju-panel", "data-mat": mat.n }, panel);
    y = bottom + m.panelGap;
  });
  const height = Math.ceil(y - m.panelGap + m.pad);
  const { title, description } = judgingText(setting, options, chart);
  const titleId = `${gid}-t`;
  const descId = `${gid}-d`;
  const css = options.css === "none" ? "" : `<style>${style}\n${KYOGIJO_JUDGING_STYLE}</style>`;
  const root = el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo ky-judging ky-judo${safeClass(options.className) === "" ? "" : ` ${safeClass(options.className)}`}`,
      viewBox: `0 0 ${num(width)} ${num(height)}`,
      role: "img",
      "aria-labelledby": `${titleId} ${descId}`,
      "data-sport": "judo",
      "data-judging": setting.style,
      "data-look": look ?? "yellow-red",
      "data-mats": setting.total,
      "data-chart": chart ? "yes" : "no",
      "data-theme": options.theme === "light" || options.theme === "dark" ? options.theme : undefined,
      "data-version": VERSION,
    },
    metaMarkup(titleId, title, descId, description) + css + el("rect", { class: "ky-ju-ground", x: 0, y: 0, width, height }) + body,
  );
  void cardsFit;
  return { svg: root, width, height, chart, cards, title, description, boards: [] };
}

/**
 * A judging assignment as one SVG string: for each mat, the judo area with a badge at each judge's seat and, where the name and ID fit in the seat, a card with both, and beside it the chart of seat, name and ID, whose rows
 * grow to hold every name whole. `style` is the style the areas are judged in (`kata`: five judges); `mats` the mat areas, each with its `label` (`Mat 1`, `Mat 2` when missing) and its `officials`, each a `seat`, a `name`
 * and an `id`. `mat` draws one mat alone (a tab); `chart` is `auto`, `always` or `never`; `focus: "bench"` shows the judges' bench close up so that the names in the seats are as large as they can be. Light and dark follow the
 * page; `judgingTable` is the same thing as a table.
 * @example
 * ```ts
 * import { drawJudging } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * const svg = drawJudging({
 *   style: "kata",
 *   mats: [{ label: "Mat 1", officials: [{ seat: 1, name: "Aiko Mori", id: "J-1042" }, { seat: "central", name: "Daniel Okafor", id: "J-0377" }] }],
 * });
 * console.log(svg.startsWith("<svg"), svg.includes("Aiko Mori"), svg.includes("J-1042"));
 * // true true true
 * ```
 */
export function drawJudging(options: JudgingOptions): string {
  return judgingDrawing(options).svg;
}

/**
 * The chart of an assignment alone: for each mat its seats in order, each with its number, its role, its name and, under the name, its ID, in rows that grow so that no name or ID is cut. For a page that draws
 * the 3D view of the mat and puts the chart beside it.
 * @example
 * ```ts
 * import { judgingChart } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * const svg = judgingChart({ style: "kata", mats: [{ officials: [{ seat: 1, name: "Aiko Mori", id: "J-1042" }] }] });
 * console.log(svg.includes("ky-ju-chart-row"), svg.includes("Not assigned"));
 * // true true
 * ```
 */
export function judgingChart(options: JudgingOptions): string {
  return judgingDrawing(options, "chart").svg;
}

/**
 * The same thing as the picture, as a table: each mat, each seat and who sits in it, with the ID. For a reader who cannot see the drawing, and for a page that wants the data.
 * @example
 * ```ts
 * import { judgingTable } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * const table = judgingTable({ style: "kata", mats: [{ officials: [{ seat: 3, name: "Daniel Okafor", id: "J-0377" }] }] });
 * console.log(table.startsWith("<table"), table.includes("Daniel Okafor"));
 * // true true
 * ```
 */
export function judgingTable(options: JudgingOptions): string {
  const setting = judgingSetting(options);
  const words = JUDGING_WORDS[setting.language];
  const { title } = judgingText(setting, options, true);
  const head = `<thead><tr><th scope="col">${esc(words.table.mat)}</th><th scope="col">${esc(words.table.seat)}</th><th scope="col">${esc(words.table.name)}</th><th scope="col">${esc(words.table.id)}</th></tr></thead>`;
  const rows = setting.mats.flatMap((mat) => mat.seats.map((a) => `<tr><th scope="row">${esc(mat.label)}</th><td>${esc(a.seat.label[setting.language])}</td><td>${a.assigned ? esc(a.name) : esc(words.chart.vacant)}</td><td>${esc(a.id)}</td></tr>`)).join("");
  return `<table class="ky-table" data-kind="judging"><caption>${esc(fill(words.table.caption, { title }))}</caption>${head}<tbody>${rows}</tbody></table>`;
}
