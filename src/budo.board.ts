// The budō scoreboards: judo's (the waza-ari, the yuko and the shido of each side beside its score), karate's (the points, the senshu and the warnings), kendo's (the techniques of its points, as the
// letters of their targets) and sumo's (the result and the kimarite). Drawn on the surface, in the frame the eye sees; the caller turns it back when the surface is turned.
import { el, esc } from "./format.ts";
import type { BudoView } from "./budo.score.ts";
import type { TeamView } from "./score.ts";
import type { PlateSpot } from "./surfaces/surface.ts";
import { fitLines, textWidth } from "./text.ts";

/** The words of a board. */
export interface BudoBoardWords {
  competition?: string;
  foot?: string;
  wazaari: string;
  yuko: string;
  shido: string;
  senshu: string;
  chui: string;
  kimarite: string;
  /** The first letter or character of each technique's name, for a kendo point. */
  techniques: Record<string, string>;
  /** What the winner's kimarite is called, already in the language. */
  kimariteName: (key: string) => string;
}

type Sport = "judo" | "karate" | "kendo" | "sumo";

/** A team as the board reads it. */
export type BoardTeam = TeamView & { budo?: BudoView };

const text = (x: number, cy: number, value: string, size: number, cls: string, extra: Record<string, string | number | undefined> = {}): string =>
  el("text", { class: `ky-text ${cls}`, x, y: cy + size * 0.36, "font-size": size, "text-anchor": "middle", ...extra }, esc(value));

const fit = (value: string, room: number, ceiling: number): number => Math.max(0.1, Math.min(ceiling, room / Math.max(1, textWidth(value))));

interface Col {
  head: string;
  width: number;
  cell: (t: BoardTeam) => string;
}

const num = (v: number | undefined): string => (v === undefined ? "" : String(v));

/** The columns of a sport's board, between the name and the total. */
function columns(sport: Sport, w: BudoBoardWords): Col[] {
  switch (sport) {
    case "judo":
      return [
        { head: w.wazaari, width: 1.7, cell: (t) => num(t.budo?.wazaari) },
        { head: w.yuko, width: 1.3, cell: (t) => num(t.budo?.yuko) },
        { head: w.shido, width: 1.3, cell: (t) => num(t.budo?.shido) },
      ];
    case "karate":
      return [
        { head: w.chui, width: 1.3, cell: (t) => num(t.budo?.shido) },
        { head: w.senshu, width: 1.5, cell: (t) => (t.budo?.senshu === true ? "●" : "") },
      ];
    case "kendo":
      return [0, 1].map((k) => ({ head: String(k + 1), width: 1.2, cell: (t: BoardTeam) => { const v = t.budo?.techniques?.[k]; return v === undefined ? "" : (w.techniques[v] ?? v).slice(0, 1).toUpperCase(); } }));
    case "sumo":
      return [{ head: w.kimarite, width: 4.2, cell: (t) => (t.budo?.kimarite === undefined || t.state !== "win" ? "" : w.kimariteName(t.budo.kimarite)) }];
  }
}

/** The board as a group centred on the origin. `spot` is the room it has; it takes only what its rows and columns need. */
export function budoBoardMarkup(sport: Sport, spot: PlateSpot, left: BoardTeam, right: BoardTeam, words: BudoBoardWords, o: { parts: boolean }): string {
  const cols = columns(sport, words);
  const team = [left, right];
  const total = cols.reduce((sum, c) => sum + c.width, 0);
  const units = 3 + total + 1.9;
  const extra = (words.competition ? 0.8 : 0) + (words.foot ? 0.8 : 0);
  const rows = 3 + extra;
  const colU = Math.min(spot.w / units, spot.h / rows / 0.72);
  const rowH = Math.min(spot.h / rows, colU * 0.72);
  const w = colU * units;
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
  let cx = x0 + nameW;
  const centres: number[] = [];
  for (const c of cols) {
    centres.push(cx + (c.width * colU) / 2);
    inner += text(centres[centres.length - 1], y + rowH / 2, c.head, fit(c.head, c.width * colU * 0.9, rowH * 0.42), "ky-foot");
    cx += c.width * colU;
  }
  const totalX = cx + colU * 0.95;
  y += rowH;
  for (const t of team) {
    inner += el("rect", { class: `ky-panel-${t.side}`, x: x0 + 0.1 * colU, y: y + rowH * 0.06, width: nameW - 0.2 * colU, height: rowH * 0.88, rx: rowH * 0.2 });
    const name = fitLines(t.name, (nameW - 0.3 * colU) * 0.92, rowH * 0.8, rowH * 0.5);
    name.lines.forEach((line, k) => {
      inner += text(x0 + 0.1 * colU + (nameW - 0.2 * colU) / 2, y + rowH / 2 + (k - (name.lines.length - 1) / 2) * name.size * 1.1, line, name.size, `ky-ink-${t.side}`);
    });
    cols.forEach((c, k) => {
      const v = c.cell(t);
      if (v !== "") inner += text(centres[k], y + rowH / 2, v, fit(v, c.width * colU * 0.92, rowH * 0.56), "ky-score");
    });
    const size = fit(t.score, colU * 1.8, rowH * 0.76);
    inner += el("g", { class: `ky-total ky-${t.state}`, part: parts(`score ${t.role}-score`) }, text(totalX, y + rowH / 2, t.score, size, "ky-score"));
    if (t.state === "win") inner += el("rect", { class: `ky-winbar ky-winbar-${t.side}`, x: totalX - (textWidth(t.score) * size) / 2, y: y + rowH / 2 + size * 0.5, width: textWidth(t.score) * size, height: Math.max(0.05, size * 0.06) });
    y += rowH;
  }
  if (words.foot) band(words.foot, "ky-foot");
  return el("g", { class: "ky-plate ky-scoreboard", part: parts("plate") }, inner);
}
