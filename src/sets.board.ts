// The scoreboard of the net sports: each team's score in each set (tennis: its games; pickleball and table tennis: each game's points), the points of the game
// in progress in tennis, the sets or games won, and a ball beside the team that is serving. The board is drawn in the frame the eye sees; the caller turns it back
// when the court is turned. A tie-break's points are written small beside the games of the set that had one.
import { el, esc, num } from "./format.ts";
import type { TeamView } from "./score.ts";
import type { PlateSpot } from "./surfaces/surface.ts";
import { fitLines, textWidth } from "./text.ts";

export interface SetsWords {
  competition?: string;
  foot?: string;
  /** The head of the totals' column: "Sets" or "Games". */
  head: string;
  /** The head of the column of the game in progress. */
  points: string;
}

/** The ball that marks the server, centred on a place. */
export function serveMark(cx: number, cy: number, r: number): string {
  return el("circle", { class: "ky-serve", cx, cy, r }) + el("path", { class: "ky-serve-seam", d: `M${num(cx - r * 0.78)} ${num(cy - r * 0.3)}Q${num(cx)} ${num(cy + r * 0.3)} ${num(cx + r * 0.78)} ${num(cy - r * 0.3)}`, "stroke-width": r * 0.14 });
}

const text = (x: number, cy: number, value: string, size: number, cls: string, extra: Record<string, string | number | undefined> = {}): string =>
  el("text", { class: `ky-text ${cls}`, x, y: cy + size * 0.36, "font-size": size, "text-anchor": "middle", ...extra }, esc(value));

const fit = (value: string, room: number, ceiling: number): number => Math.max(0.1, Math.min(ceiling, room / Math.max(1, textWidth(value))));

/** How many set columns a board has: the most either team gives, and at least `least`. */
export function setCount(left: readonly string[] | undefined, right: readonly string[] | undefined, least: number): number {
  return Math.max(least, left?.length ?? 0, right?.length ?? 0);
}

/**
 * The board as a group centred on the origin. `spot` is the room it has; it takes only what its rows and columns need. `least` is the number of set columns it
 * always has (the sets a match can run to), more when a team gives more.
 */
export function setsBoardMarkup(spot: PlateSpot, left: TeamView, right: TeamView, words: SetsWords, o: { parts: boolean; least: number }): string {
  const n = setCount(left.sets, right.sets, o.least);
  const team = [left, right];
  const hasPoints = team.some((t) => t.points !== undefined && t.points !== "");
  const cols = 2.9 + n + (hasPoints ? 1.3 : 0) + 1.4;
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
    const size = fit(value, w * 0.92, bandH * 0.62);
    inner += text(0, y + bandH / 2, value, size, cls);
    y += bandH;
  };
  if (words.competition) band(words.competition, "ky-comp");
  const nameW = colU * 2.9;
  const setX = (k: number): number => x0 + nameW + colU * (k + 0.5);
  const pointsX = x0 + nameW + colU * (n + 0.65);
  const totalX = x0 + nameW + colU * (n + (hasPoints ? 1.3 : 0) + 0.7);
  for (let k = 0; k < n; k += 1) inner += text(setX(k), y + rowH / 2, String(k + 1), rowH * 0.46, "ky-foot");
  if (hasPoints) inner += text(pointsX, y + rowH / 2, words.points, fit(words.points, colU * 1.2, rowH * 0.42), "ky-foot");
  inner += text(totalX, y + rowH / 2, words.head, fit(words.head, colU * 1.3, rowH * 0.42), "ky-foot");
  y += rowH;
  for (const [i, t] of team.entries()) {
    const other = team[1 - i];
    inner += el("rect", { class: `ky-panel-${t.side}`, x: x0 + 0.1 * colU, y: y + rowH * 0.06, width: nameW - 0.2 * colU, height: rowH * 0.88, rx: rowH * 0.2 });
    const serving = t.serving === true;
    const room = (nameW - 0.3 * colU) * (serving ? 0.74 : 0.92);
    const name = fitLines(t.name, room, rowH * 0.8, rowH * 0.5);
    const nameX = x0 + 0.1 * colU + (nameW - 0.2 * colU) * (serving ? 0.6 : 0.5);
    name.lines.forEach((line, k) => {
      inner += text(nameX, y + rowH / 2 + (k - (name.lines.length - 1) / 2) * name.size * 1.1, line, name.size, `ky-ink-${t.side}`);
    });
    if (serving) inner += serveMark(x0 + 0.1 * colU + rowH * 0.45, y + rowH / 2, rowH * 0.17);
    for (let k = 0; k < n; k += 1) {
      const v = t.sets?.[k] ?? "";
      if (v === "") continue;
      const a = Number(v);
      const b = Number(other.sets?.[k]);
      const behind = Number.isFinite(a) && Number.isFinite(b) && a < b;
      const size = rowH * 0.62;
      inner += text(setX(k), y + rowH / 2, v, size, behind ? "ky-score ky-lose" : "ky-score");
      const tb = t.tiebreaks?.[k] ?? "";
      if (tb !== "") inner += text(setX(k) + (textWidth(v) * size) / 2 + rowH * 0.16, y + rowH * 0.3, tb, rowH * 0.3, "ky-score ky-tb", { "text-anchor": "start" });
    }
    if (hasPoints && t.points !== undefined && t.points !== "") inner += text(pointsX, y + rowH / 2, t.points, fit(t.points, colU * 1.15, rowH * 0.62), "ky-score");
    const totalSize = fit(t.score, colU * 1.2, rowH * 0.76);
    inner += el("g", { class: `ky-total ky-${t.state}`, part: parts(`score ${t.role}-score`) }, text(totalX, y + rowH / 2, t.score, totalSize, "ky-score"));
    if (t.state === "win") inner += el("rect", { class: `ky-winbar ky-winbar-${t.side}`, x: totalX - (textWidth(t.score) * totalSize) / 2, y: y + rowH / 2 + totalSize * 0.5, width: textWidth(t.score) * totalSize, height: Math.max(0.05, totalSize * 0.07) });
    y += rowH;
  }
  if (words.foot) band(words.foot, "ky-foot");
  return el("g", { class: "ky-plate ky-scoreboard", part: parts("plate") }, inner);
}
