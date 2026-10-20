// A judging assignment drawn: for each mat, the package's own judo area with a badge at every judge's seat and, where a name and its ID fit in the seat, a card with both; beside it (or under it) the chart of mat, seat,
// name and ID, whose rows grow to hold every name and ID whole. The surface is not drawn a second way: its markup is the drawing's own, moved and clipped. The same options always give the same string. The text
// alternative is `judgingTable`.
import { drawKyogijo } from "./draw.ts";
import { safeClass } from "./common.ts";
import { el, esc, hash, num } from "./format.ts";
import { PLAN_CARD, badge, card } from "./judging.card.ts";
import { fitChart, fitSeats, type CardFit } from "./judging.fit.ts";
import { JUDGING_LEAGUE } from "./judging.data.ts";
import { judgingPlan, judgingSetting, type JudgingPlan, type JudgingSetting } from "./judging.ts";
import { KYOGIJO_JUDGING_STYLE } from "./judging.style.ts";
import type { JudgingAssignment, JudgingOptions, JudgingResolved } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import { fill } from "./strings.ts";
import { LINE_HEIGHT } from "./text.ts";
import type { MBox } from "./budo/plan.ts";
import { VERSION } from "./version.ts";

/** Feet in a metre: the surface's own drawing is in feet. */
const FT = 1 / 0.3048;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

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
}

/** One mat's surface as markup: the drawing's own, without its title, its stylesheet and its apron. */
function inner(svg: string): { body: string; style: string; look: string | undefined } {
  const look = /^<svg[^>]* data-look="([^"]*)"/.exec(svg)?.[1];
  const style = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? "";
  let body = svg.replace(/<style>[\s\S]*?<\/style>/, "");
  body = body.slice(body.indexOf("</desc>") + "</desc>".length, body.lastIndexOf("</svg>"));
  body = body.replace(/<rect class="ky-apron"[^>]*\/>/g, "");
  return { body, style, look };
}

/** The sentence that names one seat and who sits in it. */
function seatSentence(a: JudgingAssignment, setting: Pick<JudgingSetting, "language">): string {
  const w = JUDGING_WORDS[setting.language].say;
  const seat = a.seat.label[setting.language];
  if (!a.assigned) return fill(w.seatVacant, { seat });
  if (a.id === "") return fill(w.seatNoId, { seat, name: a.name });
  return fill(w.seat, { seat, name: a.name === "" ? "—" : a.name, id: a.id });
}

/** The title and the description of an assignment: each mat with each seat and who is in it. */
export function judgingText(setting: JudgingSetting, options: Pick<JudgingOptions, "title" | "description">, chart: boolean): { title: string; description: string } {
  const words = JUDGING_WORDS[setting.language];
  const style = fill(words.styleName[setting.style], { count: setting.mats[0].seats.length });
  const mats = setting.total === 1 ? words.say.matsOne : fill(words.say.matsMany, { n: setting.total });
  const title = options.title ?? fill(words.say.title, { style, mats });
  const sentences = setting.mats.map((m) => fill(words.say.mat, { label: m.label, seats: m.seats.map((a) => seatSentence(a, setting)).join(words.say.join) }));
  const description = options.description ?? [...sentences, chart ? words.say.names : words.say.chartOnly].join(setting.language === "ja" ? "" : " ");
  return { title, description };
}

/** The numbers a drawing is laid out in, all in the picture's own units and proportional to its width, so that the picture is the same at any width. */
interface Metrics {
  k: number;
  pad: number;
  gap: number;
  titleH: number;
  panelGap: number;
  badge: number;
  rowPad: number;
  role: number;
  nameMax: number;
  nameMin: number;
  cardMin: number;
}
const metricsOf = (width: number): Metrics => {
  const k = width / 1000;
  return { k, pad: 28 * k, gap: 28 * k, titleH: 62 * k, panelGap: 40 * k, badge: 60 * k, rowPad: 14 * k, role: 17 * k, nameMax: 34 * k, nameMin: 22 * k, cardMin: 12 * k };
};

/** One chart row's layout: where its text goes, in its own box from (0, 0). */
interface Row {
  a: JudgingAssignment;
  height: number;
  fit: CardFit | undefined;
}

/** The rows of one mat's chart, each as tall as its name and ID need, set in a chart `width` wide. */
function chartRows(mat: JudgingResolved, width: number, m: Metrics, setting: Pick<JudgingSetting, "language">): Row[] {
  const words = JUDGING_WORDS[setting.language];
  const textW = width - m.rowPad * 1.6 - m.badge - m.gap * 0.6;
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

/** The plan of one mat at (x, y) in a box: the surface moved and clipped to the region shown, with a badge or a card at every seat. */
function planMarkup(
  mat: JudgingResolved,
  surface: { body: string },
  geom: JudgingPlan,
  region: MBox,
  box: { x: number; y: number; w: number; h: number },
  m: Metrics,
  setting: JudgingSetting,
  clip: string,
): { markup: string; width: number; height: number; fits: boolean[] } {
  const rw = region.x1 - region.x0;
  const rh = region.y1 - region.y0;
  const s = Math.min(box.w / rw, box.h / rh);
  const w = rw * s;
  const h = rh * s;
  const x = box.x + (box.w - w) / 2;
  const y = box.y;
  const sf = s / FT;
  const X = (mx: number): number => x + (mx - region.x0) * s;
  const Y = (my: number): number => y + (my - region.y0) * s;
  const words = JUDGING_WORDS[setting.language];
  let markup = el("clipPath", { id: clip }, el("rect", { x: num(region.x0 * FT), y: num(region.y0 * FT), width: num(rw * FT), height: num(rh * FT) }));
  markup += el("rect", { class: "ky-apron", x, y, width: w, height: h });
  markup += el("g", { class: "ky-ju-plan", "clip-path": `url(#${clip})`, transform: `translate(${num(x - region.x0 * FT * sf)} ${num(y - region.y0 * FT * sf)}) scale(${(sf).toFixed(5)})` }, surface.body);
  markup += el("rect", { class: "ky-ju-plan-frame", x, y, width: w, height: h });
  // The card of a seat is its chair and the table in front of it: a seat wide and as deep as both.
  const cardW = (geom.pitch - 0.06) * s;
  const cardH = (geom.table.y1 - (geom.chairs[0].y0 - 0.05)) * s;
  const pad = Math.max(2 * m.k, cardW * 0.05);
  const r = clamp(cardW * 0.2, 6 * m.k, 14 * m.k);
  const innerW = cardW - 2 * pad;
  const innerH = cardH - 2 * pad - r;
  const fitted = fitSeats(mat.seats, { width: innerW, height: innerH, max: Math.min(cardW * 0.3, 26 * m.k), min: m.cardMin, idLabel: words.chart.idLabel });
  const fits = mat.seats.map((a, i) => !a.assigned || fitted[i] !== undefined);
  mat.seats.forEach((a, i) => {
    const chair = geom.chairs[i];
    const cx = X((chair.x0 + chair.x1) / 2);
    const top = Y(chair.y0 - 0.05);
    const fit = fitted[i];
    let g = "";
    if (fit !== undefined) g += card(PLAN_CARD, fit, a.seat.n, cx - cardW / 2, top, cardW, cardH, pad, r, 3 * m.k);
    else {
      const br = clamp(geom.pitch * s * 0.3, 7 * m.k, 16 * m.k);
      g += badge(PLAN_CARD, cx, Y((chair.y0 + chair.y1) / 2), br, a.seat.n, a.assigned);
    }
    markup += el("g", { class: "ky-ju-seat", "data-mat": mat.n, "data-seat": a.seat.id, "data-card": fit === undefined ? "no" : "yes" }, g);
  });
  return { markup, width: w, height: h, fits };
}

/** The picture of an assignment and what was worked out to make it. `mode` `chart` is the chart alone (for beside a 3D view). */
export function judgingDrawing(options: JudgingOptions, mode: "full" | "chart" = "full"): JudgingDrawing {
  const setting = judgingSetting(mode === "chart" && options.width === undefined ? { ...options, width: 600 } : options);
  const language = setting.language;
  const width = setting.width;
  const m = metricsOf(width);
  const geom = judgingPlan(setting.style);
  const region = setting.focus === "bench" ? geom.bench : { x0: geom.extent.x0 - 0.3, y0: geom.extent.y0 - 0.3, x1: geom.extent.x1 + 0.3, y1: geom.extent.y1 + 0.3 };
  const gid = safeClass(options.id).replace(/ /g, "-") || `ky-ju-${hash(JSON.stringify([options, mode, VERSION]))}`;
  const league = JUDGING_LEAGUE[setting.style].league;
  const portrait = setting.orientation === "portrait";

  // The surface, drawn by the package: once for its stylesheet, then once for each mat (its ids differ).
  let style = "";
  let look: string | undefined;
  const surfaces = mode === "chart" ? [] : setting.mats.map((mat, i) => {
    const drawn = inner(drawKyogijo({ sport: "judo", league, budo: { style: setting.style, officials: true }, language, id: `${gid}-s${mat.n}`, style: i === 0 && options.css !== "none" ? "embed" : "none" }));
    if (i === 0) {
      style = drawn.style;
      look = drawn.look;
    }
    return drawn;
  });

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
  if (mode === "full" && setting.chart === "auto") chart = !trial(false).every(Boolean);
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
    `<title id="${titleId}">${esc(title)}</title><desc id="${descId}">${esc(description)}</desc>` + css + el("rect", { class: "ky-ju-ground", x: 0, y: 0, width, height }) + body,
  );
  void cardsFit;
  return { svg: root, width, height, chart, cards, title, description };
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
