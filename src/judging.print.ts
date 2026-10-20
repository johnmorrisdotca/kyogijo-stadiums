// A judging assignment on paper: one mat to a page, on A4 or US letter, in the plan-and-chart layout (the one that prints well), always in the light colours, with the picture scaled evenly to fill the page's printable
// area and nothing else on it. `judgingPrintStyle` is the stylesheet (the `@page` size and margins and the page breaks), `judgingPrintSheets` the pages as markup for a page that already has the style, and `judgingPrint`
// a whole HTML document that opens on screen as the pages laid one under another and prints as they are. Pure: the same options give the same text.
import { esc } from "./format.ts";
import { drawJudging } from "./judging.draw.ts";
import { judgingSetting } from "./judging.ts";
import { judgingText } from "./judging.text.ts";
import type { JudgingOptions } from "./judging.types.ts";

/** The paper sizes, in millimetres (ISO 216 for A4, ANSI for US letter), portrait. */
export const JUDGING_PAPER = Object.freeze({ a4: Object.freeze({ name: "A4", width: 210, height: 297 }), letter: Object.freeze({ name: "US letter", width: 215.9, height: 279.4 }) });

/** What a printout is asked for: the paper, how it lies and the margin all round, in millimetres. */
export interface JudgingPrintOptions {
  /** `a4` (the default) or `letter`. */
  paper?: keyof typeof JUDGING_PAPER;
  /** `portrait` (the default: the plan above the chart) or `landscape` (the chart beside the plan). */
  orientation?: "portrait" | "landscape";
  /** The margin on all four sides, 5 to 30 mm (12 by default). */
  margin?: number;
}

interface PrintAsk {
  paper: keyof typeof JUDGING_PAPER;
  orientation: "portrait" | "landscape";
  margin: number;
  /** The printable area, in millimetres. */
  width: number;
  height: number;
}

function ask(print: JudgingPrintOptions | undefined): PrintAsk {
  const paper = print?.paper ?? "a4";
  if (!(paper in JUDGING_PAPER)) throw new TypeError(`paper is ${Object.keys(JUDGING_PAPER).map((p) => `"${p}"`).join(" or ")}`);
  const orientation = print?.orientation ?? "portrait";
  if (orientation !== "portrait" && orientation !== "landscape") throw new TypeError('orientation is "portrait" or "landscape"');
  const margin = print?.margin ?? 12;
  if (typeof margin !== "number" || !Number.isFinite(margin) || margin < 5 || margin > 30) throw new RangeError("margin is a number of millimetres from 5 to 30");
  const size = JUDGING_PAPER[paper];
  const [w, h] = orientation === "portrait" ? [size.width, size.height] : [size.height, size.width];
  return { paper, orientation, margin, width: w - 2 * margin, height: h - 2 * margin };
}

/** A length in millimetres as CSS, trimmed of the noise of a float. */
const mm = (value: number): string => `${Math.round(value * 100) / 100}mm`;

/**
 * The stylesheet of a printout: the `@page` rule (the paper's name, how it lies and the margin), a page break after every sheet but the last, and each sheet as tall as the printable area less a millimetre (a sheet exactly as
 * tall as the page makes some browsers print a blank page after it). The colours are kept as they are on paper (`print-color-adjust`).
 * @example
 * ```ts
 * import { judgingPrintStyle } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * console.log(judgingPrintStyle({ paper: "letter" }).includes("size:Letter portrait"));
 * // true
 * ```
 */
export function judgingPrintStyle(print?: JudgingPrintOptions): string {
  const a = ask(print);
  const name = a.paper === "a4" ? "A4" : "Letter";
  return [
    `@page{size:${name} ${a.orientation};margin:${mm(a.margin)}}`,
    `.ky-ju-sheets{margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}`,
    `.ky-ju-sheet{box-sizing:border-box;display:block;width:${mm(a.width)};height:${mm(a.height - 1)};margin:0;padding:0;overflow:hidden;break-after:page;page-break-after:always;break-inside:avoid}`,
    `.ky-ju-sheet:last-child{break-after:auto;page-break-after:auto}`,
    `.ky-ju-sheet>svg.kyogijo{display:block;width:100%;height:100%}`,
    `.ky-ju-sheet .ky-ju-ground{fill:#fff}`,
  ].join("\n");
}

/**
 * The pages of a printout as markup: one `<section class="ky-ju-sheet">` for each mat (all of them, or the one `mat` names), each holding that mat's picture in the plan-and-chart layout, light, and held to the page's
 * shape (portrait or landscape). The picture is anchored at the top of its page and scaled as a whole, so no type in it is stretched. Add `judgingPrintStyle` for the pages to be what is printed.
 * @example
 * ```ts
 * import { judgingPrintSheets } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * const html = judgingPrintSheets({ style: "kata", mats: [{ officials: [{ seat: 1, name: "Aiko Mori", id: "J-1042" }] }, {}] });
 * console.log(html.split("ky-ju-sheet\"").length - 1);
 * // 2
 * ```
 */
export function judgingPrintSheets(options: JudgingOptions, print?: JudgingPrintOptions): string {
  const a = ask(print);
  const setting = judgingSetting(options);
  const sheets = setting.mats.map((mat) => {
    const svg = drawJudging({ ...options, mat: mat.n, view: "plan", theme: "light", orientation: a.orientation, ...(options.id === undefined ? {} : { id: `${options.id}-m${mat.n}` }) });
    return `<section class="ky-ju-sheet" data-mat="${mat.n}">${svg.replace("<svg ", '<svg preserveAspectRatio="xMidYMin meet" ')}</section>`;
  });
  return `<div class="ky-ju-sheets" data-paper="${a.paper}" data-orientation="${a.orientation}">${sheets.join("")}</div>`;
}

/**
 * A whole HTML document to print or save as a PDF: the pages (`judgingPrintSheets`) under the printout's stylesheet, which on a screen shows each sheet as a page of the paper laid on a grey desk. Open it in a browser and
 * print; choose "Save as PDF" for a file. Nothing in it is fetched.
 * @example
 * ```ts
 * import { judgingPrint } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * const html = judgingPrint({ style: "kata", mats: [{ label: "Mat 1", officials: [{ seat: 1, name: "Aiko Mori", id: "J-1042" }] }] }, { paper: "letter" });
 * console.log(html.startsWith("<!doctype html>"), html.includes("size:Letter portrait"));
 * // true true
 * ```
 */
export function judgingPrint(options: JudgingOptions, print?: JudgingPrintOptions): string {
  const a = ask(print);
  const setting = judgingSetting(options);
  const { title } = judgingText(setting, options, true, "plan");
  const screen = `@media screen{body{background:#cfd3d6}.ky-ju-sheet{background:#fff;margin:8mm auto;padding:${mm(a.margin)};width:${mm(a.width + 2 * a.margin)};height:${mm(a.height + 2 * a.margin)};box-shadow:0 2px 12px rgba(0,0,0,.3)}}`;
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>body{margin:0;color:#10151b;font:16px system-ui,sans-serif}\n${judgingPrintStyle(print)}\n${screen}</style>`;
  return `<!doctype html><html lang="${setting.language}"><head>${head}</head><body>${judgingPrintSheets(options, print)}</body></html>`;
}
