// The cricket scoreboard: each team's runs and wickets, the overs, and, for a match of more than one innings, each innings; drawn on the ground below the pitch. The board is drawn in the frame the eye sees; the caller turns it
// back when the ground is turned.
import { el, esc } from "./format.ts";
import type { TeamView } from "./score.ts";
import type { PlateSpot } from "./surfaces/surface.ts";
import { fitLines, textWidth } from "./text.ts";

export interface CricketWords {
  competition?: string;
  foot?: string;
  /** The heads of the columns: the innings, the total (runs for wickets) and the overs. */
  innings: string;
  total: string;
  overs: string;
}

const text = (x: number, cy: number, value: string, size: number, cls: string, extra: Record<string, string | number | undefined> = {}): string =>
  el("text", { class: `ky-text ${cls}`, x, y: cy + size * 0.36, "font-size": size, "text-anchor": "middle", ...extra }, esc(value));

const fit = (value: string, room: number, ceiling: number): number => Math.max(0.1, Math.min(ceiling, room / Math.max(1, textWidth(value))));

/** The total as a cricket score is written: the runs, a stroke, the wickets lost. Runs alone when no wickets are given. */
export const totalText = (t: Pick<TeamView, "score" | "wickets">): string => (t.wickets === undefined || t.wickets === "" ? t.score : `${t.score}/${t.wickets}`);

/** How many innings columns a board has: the most either team gives; none when neither gives any. */
export const inningsCount = (left: readonly string[] | undefined, right: readonly string[] | undefined): number => Math.max(left?.length ?? 0, right?.length ?? 0);

/** The board as a group centred on the origin. `spot` is the room it has; it takes only what its rows and columns need. */
export function cricketBoardMarkup(spot: PlateSpot, left: TeamView, right: TeamView, words: CricketWords, o: { parts: boolean }): string {
  const n = inningsCount(left.innings, right.innings);
  const team = [left, right];
  const hasOvers = team.some((t) => t.overs !== undefined && t.overs !== "");
  const cols = 3 + n * 1.3 + 1.9 + (hasOvers ? 1.5 : 0);
  const extra = (words.competition ? 0.8 : 0) + (words.foot ? 0.8 : 0);
  const rows = 3 + extra;
  const colU = Math.min(spot.w / cols, spot.h / rows / 0.72);
  const rowH = Math.min(spot.h / rows, colU * 0.72);
  const w = colU * cols;
  const h = rowH * rows;
  const x0 = -w / 2;
  let y = -h / 2;
  const parts = (names: string): string | undefined => (o.parts ? names : undefined);
  let inner = el("rect", { class: "ky-plate-bg", x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(rowH * 0.5, w * 0.04) });
  const band = (value: string, cls: string): void => {
    const bandH = rowH * 0.8;
    inner += text(0, y + bandH / 2, value, fit(value, w * 0.92, bandH * 0.62), cls);
    y += bandH;
  };
  if (words.competition) band(words.competition, "ky-comp");
  const nameW = colU * 3;
  const inX = (k: number): number => x0 + nameW + colU * 1.3 * (k + 0.5);
  const totalX = x0 + nameW + colU * 1.3 * n + colU * 0.95;
  const oversX = totalX + colU * 0.95 + colU * 0.75;
  for (let k = 0; k < n; k += 1) inner += text(inX(k), y + rowH / 2, String(k + 1), rowH * 0.46, "ky-foot");
  inner += text(totalX, y + rowH / 2, words.total, fit(words.total, colU * 1.7, rowH * 0.42), "ky-foot");
  if (hasOvers) inner += text(oversX, y + rowH / 2, words.overs, fit(words.overs, colU * 1.3, rowH * 0.42), "ky-foot");
  y += rowH;
  for (const t of team) {
    inner += el("rect", { class: `ky-panel-${t.side}`, x: x0 + 0.1 * colU, y: y + rowH * 0.06, width: nameW - 0.2 * colU, height: rowH * 0.88, rx: rowH * 0.2 });
    const name = fitLines(t.name, (nameW - 0.3 * colU) * 0.92, rowH * 0.8, rowH * 0.5);
    name.lines.forEach((line, k) => {
      inner += text(x0 + 0.1 * colU + (nameW - 0.2 * colU) / 2, y + rowH / 2 + (k - (name.lines.length - 1) / 2) * name.size * 1.1, line, name.size, `ky-ink-${t.side}`);
    });
    for (let k = 0; k < n; k += 1) {
      const v = t.innings?.[k] ?? "";
      if (v !== "") inner += text(inX(k), y + rowH / 2, v, fit(v, colU * 1.2, rowH * 0.56), "ky-score");
    }
    const total = totalText(t);
    const size = fit(total, colU * 1.8, rowH * 0.76);
    inner += el("g", { class: `ky-total ky-${t.state}`, part: parts(`score ${t.role}-score`) }, text(totalX, y + rowH / 2, total, size, "ky-score"));
    if (t.state === "win") inner += el("rect", { class: `ky-winbar ky-winbar-${t.side}`, x: totalX - (textWidth(total) * size) / 2, y: y + rowH / 2 + size * 0.5, width: textWidth(total) * size, height: Math.max(0.05, size * 0.07) });
    if (hasOvers && t.overs !== undefined && t.overs !== "") inner += text(oversX, y + rowH / 2, t.overs, fit(t.overs, colU * 1.3, rowH * 0.56), "ky-score");
    y += rowH;
  }
  if (words.foot) band(words.foot, "ky-foot");
  return el("g", { class: "ky-plate ky-scoreboard", part: parts("plate") }, inner);
}
