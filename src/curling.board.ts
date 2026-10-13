// The curling scoreboard: the score of each end, the total and the hammer, drawn on the sheet between the hog lines. A tall drawing has the
// ends down the page and a team in each column; a wide drawing has the ends across and a team in each row. Words stay upright either way.
import { el, esc, num } from "./format.ts";
import type { TeamView } from "./score.ts";
import type { PlateSpot } from "./surfaces/surface.ts";
import { fitLines, textWidth } from "./text.ts";

/** The label of an end's column or row: 1 to 10, then E for the first extra end, E2, E3... */
export const endLabel = (end: number): string => (end <= 10 ? String(end) : end === 11 ? "E" : `E${end - 10}`);

/** How many ends a scoreboard has: ten, or more when a team's list is longer; none when no team gives its ends. */
export function endCount(left: readonly string[] | undefined, right: readonly string[] | undefined): number {
  const given = Math.max(left?.length ?? 0, right?.length ?? 0);
  return given === 0 ? 0 : Math.max(10, given);
}

/** The score of one end as it is written: a number, `X` for a conceded end, nothing for an end not played. */
export function endText(value: number | string | null | undefined): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "string") return value.trim().slice(0, 2);
  return "";
}

/** The marker of the team that has the hammer: a stone seen from above. */
export function hammerMark(cx: number, cy: number, r: number): string {
  return el("circle", { class: "ky-hammer", cx, cy, r }) + el("circle", { class: "ky-hammer-in", cx, cy, r: r * 0.45 });
}

const text = (x: number, cy: number, value: string, size: number, cls: string, extra: Record<string, string | number | undefined> = {}): string =>
  el("text", { class: `ky-text ${cls}`, x, y: cy + size * 0.36, "font-size": size, "text-anchor": "middle", ...extra }, esc(value));

/** Fit a word in a width: the size, held to a ceiling. */
const fit = (value: string, room: number, ceiling: number): number => Math.max(0.5, Math.min(ceiling, room / Math.max(1, textWidth(value))));

export interface BoardWords {
  competition?: string;
  foot?: string;
  /** The label of the totals' row (a tall board) or the head of their column. */
  total: string;
}

/**
 * The scoreboard as a group centred on the origin, in the frame the eye sees (the caller turns it back when the sheet is turned). `spot` is the
 * room it has; it takes only what its rows and columns need.
 */
export function boardMarkup(spot: PlateSpot, left: TeamView, right: TeamView, words: BoardWords, o: { turned: boolean; parts: boolean }): string {
  const n = endCount(left.ends, right.ends);
  const team = [left, right];
  const extra = (words.competition ? 1 : 0) + (words.foot ? 1 : 0);
  let inner = "";
  const parts = (names: string): string | undefined => (o.parts ? names : undefined);
  const textOf = (t: TeamView, index: number): string => t.ends?.[index] ?? "";
  let w: number;
  let h: number;

  if (o.turned) {
    // Ends down the page, a team to a column: a column for the end, one for each team.
    const rows = 2.9 + n + extra;
    const rowH = Math.min(spot.h / rows, 4.6);
    h = rowH * rows;
    w = spot.w;
    const colW = [w * 0.24, w * 0.38, w * 0.38];
    const x0 = -w / 2;
    const cx = [x0 + colW[0] / 2, x0 + colW[0] + colW[1] / 2, x0 + colW[0] + colW[1] + colW[2] / 2];
    let y = -h / 2;
    inner += el("rect", { class: "ky-plate-bg", x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(rowH * 0.5, 2.4) });
    const band = (value: string, cls: string): void => {
      const size = fit(value, w * 0.92, rowH * 0.58);
      inner += text(0, y + rowH / 2, value, size, cls);
      y += rowH;
    };
    if (words.competition) band(words.competition, "ky-comp");
    // The header: the teams on their colours, each with its abbreviation, its name under it, and the hammer beside the abbreviation of the team that has it.
    const headH = rowH * 1.9;
    for (const [i, t] of team.entries()) {
      inner += el("rect", { class: `ky-panel-${t.side}`, x: cx[i + 1] - colW[i + 1] / 2 + 0.15, y: y + 0.15, width: colW[i + 1] - 0.3, height: headH - 0.3, rx: rowH * 0.2 });
      const hammer = t.hammer === true;
      // With the hammer, its mark takes the left of the cell and the abbreviation the rest.
      const left0 = cx[i + 1] - colW[i + 1] / 2;
      const room = colW[i + 1] * (hammer ? 0.58 : 0.84);
      const size = fit(t.abbr, room, rowH * 0.5);
      inner += text(hammer ? left0 + colW[i + 1] * 0.64 : cx[i + 1], y + rowH * 0.52, t.abbr, size, `ky-ink-${t.side}`);
      if (hammer) inner += hammerMark(left0 + colW[i + 1] * 0.17, y + rowH * 0.52, Math.min(rowH * 0.17, colW[i + 1] * 0.1));
      const name = fitLines(t.name, colW[i + 1] * 0.88, rowH * 0.8, rowH * 0.34);
      name.lines.forEach((line, k) => {
        inner += text(cx[i + 1], y + rowH * 1.18 + (k - (name.lines.length - 1) / 2) * name.size * 1.1, line, name.size, `ky-ink-${t.side}`, { "font-weight": 600 });
      });
    }
    y += headH;
    for (let e = 0; e < n; e += 1) {
      inner += text(cx[0], y + rowH / 2, endLabel(e + 1), rowH * 0.46, "ky-foot");
      for (const [i, t] of team.entries()) {
        const v = textOf(t, e);
        if (v !== "") inner += text(cx[i + 1], y + rowH / 2, v, rowH * 0.58, "ky-score");
      }
      y += rowH;
    }
    inner += el("path", { class: "ky-grid", d: `M${num(x0 + w * 0.04)} ${num(y)}H${num(-x0 - w * 0.04)}`, "stroke-width": 0.12 });
    const totalSize = Math.min(rowH * 0.74, ...team.map((t, i) => fit(t.score, colW[i + 1] * 0.84, rowH * 0.74)));
    for (const [i, t] of team.entries()) {
      inner += el("g", { class: `ky-total ky-${t.state}`, part: parts(`score ${t.role}-score`) }, text(cx[i + 1], y + rowH / 2, t.score, totalSize, "ky-score"));
      if (t.state === "win") inner += el("rect", { class: `ky-winbar ky-winbar-${t.side}`, x: cx[i + 1] - (textWidth(t.score) * totalSize) / 2, y: y + rowH / 2 + totalSize * 0.5, width: textWidth(t.score) * totalSize, height: Math.max(0.2, totalSize * 0.07) });
    }
    inner += text(cx[0], y + rowH / 2, words.total, fit(words.total, colW[0] * 0.94, rowH * 0.4), "ky-foot");
    y += rowH;
    if (words.foot) band(words.foot, "ky-foot");
  } else {
    // Ends across the sheet, a team to a row: a column for the name, one for each end and one for the total.
    const cols = 1.9 + n + 1.4;
    const colU = Math.min(spot.w / cols, 5.4);
    w = colU * cols;
    const rows = 3 + extra;
    const rowH = Math.min(spot.h / rows, 3.4);
    h = rowH * rows;
    const x0 = -w / 2;
    let y = -h / 2;
    inner += el("rect", { class: "ky-plate-bg", x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(rowH * 0.5, 2.4) });
    const band = (value: string, cls: string): void => {
      const size = fit(value, w * 0.92, rowH * 0.62);
      inner += text(0, y + rowH / 2, value, size, cls);
      y += rowH;
    };
    if (words.competition) band(words.competition, "ky-comp");
    const endX = (e: number): number => x0 + colU * (1.9 + e + 0.5);
    const totalX = x0 + colU * (1.9 + n + 0.7);
    for (let e = 0; e < n; e += 1) inner += text(endX(e), y + rowH / 2, endLabel(e + 1), rowH * 0.5, "ky-foot");
    inner += text(totalX, y + rowH / 2, words.total, fit(words.total, colU * 1.3, rowH * 0.46), "ky-foot");
    y += rowH;
    for (const t of team) {
      inner += el("rect", { class: `ky-panel-${t.side}`, x: x0 + 0.2, y: y + 0.15, width: colU * 1.9 - 0.3, height: rowH - 0.3, rx: rowH * 0.2 });
      const hammer = t.hammer === true;
      const room = colU * 1.9 * (hammer ? 0.66 : 0.88);
      const name = fitLines(t.name, room, rowH * 0.86, rowH * 0.5);
      const nameX = x0 + 0.2 + (colU * 1.9 - 0.3) * (hammer ? 0.6 : 0.5);
      name.lines.forEach((line, k) => {
        inner += text(nameX, y + rowH / 2 + (k - (name.lines.length - 1) / 2) * name.size * 1.1, line, name.size, `ky-ink-${t.side}`);
      });
      if (hammer) inner += hammerMark(x0 + 0.2 + rowH * 0.45, y + rowH / 2, rowH * 0.17);
      for (let e = 0; e < n; e += 1) {
        const v = textOf(t, e);
        if (v !== "") inner += text(endX(e), y + rowH / 2, v, rowH * 0.62, "ky-score");
      }
      const totalSize = fit(t.score, colU * 1.2, rowH * 0.78);
      inner += el("g", { class: `ky-total ky-${t.state}`, part: parts(`score ${t.role}-score`) }, text(totalX, y + rowH / 2, t.score, totalSize, "ky-score"));
      if (t.state === "win") inner += el("rect", { class: `ky-winbar ky-winbar-${t.side}`, x: totalX - (textWidth(t.score) * totalSize) / 2, y: y + rowH / 2 + totalSize * 0.5, width: textWidth(t.score) * totalSize, height: Math.max(0.2, totalSize * 0.07) });
      y += rowH;
    }
    if (words.foot) band(words.foot, "ky-foot");
  }
  return el("g", { class: "ky-plate ky-scoreboard", part: parts("plate") }, inner);
}
