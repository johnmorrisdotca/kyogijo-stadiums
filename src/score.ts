import { el, num } from "./format.ts";
import { LINE_HEIGHT, fitLines, textWidth } from "./text.ts";
import type { Side, Sport } from "./types.ts";
import type { PlateSpot, Zone } from "./surfaces/surface.ts";

/** A team as it is drawn: everything decided, nothing left to look up. */
export interface TeamView {
  side: Side;
  /** The name, in capitals if asked. */
  name: string;
  abbr: string;
  score: string;
  /** The logo as an image address, or `undefined`. */
  logo: string | undefined;
  state: "win" | "lose" | "none";
  /** The role in the game, for part names. */
  role: "home" | "away";
}

const part = (on: boolean, names: string): string | undefined => (on ? names : undefined);

/**
 * A team's name and logo in its place. The place is a box in the surface's own frame; the words are set as the eye
 * sees them, turned by `rot` (or a quarter back when the whole surface is turned).
 */
export function bannerMarkup(zone: Zone, team: TeamView, o: { turned: boolean; onColour: boolean; parts: boolean }): string {
  const rot = o.turned ? -90 : zone.rot;
  const { w, h } = zone;
  let inner = "";
  if (zone.panel) inner += el("rect", { class: `ky-panel ky-panel-${team.side}`, x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(h * 0.16, 8) });
  const ink = `ky-${o.onColour || zone.panel ? "ink" : "paint"}-${team.side}`;
  const logo = team.logo;
  const row = logo !== undefined && w / h >= 2.6;
  const stack = logo !== undefined && !row;
  if (row) {
    const size = Math.min(h * 0.9, w * 0.3);
    const gap = size * 0.22;
    const fit = fitLines(team.name, w - size - gap - h * 0.1, h * 0.92, h * 0.5);
    const total = size + gap + fit.width;
    const x0 = -total / 2;
    inner += el("image", { class: "ky-logo", href: logo, x: x0, y: -size / 2, width: size, height: size, preserveAspectRatio: "xMidYMid meet" });
    inner += lines(fit.lines, fit.size, x0 + size + gap, 0, "start", ink);
  } else if (stack) {
    const size = Math.min(h * 0.56, w * 0.8);
    const gap = h * 0.05;
    const fit = fitLines(team.name, w * 0.96, h - size - gap - h * 0.06, h * 0.22);
    const total = size + gap + fit.height;
    const top = -total / 2;
    inner += el("image", { class: "ky-logo", href: logo, x: -size / 2, y: top, width: size, height: size, preserveAspectRatio: "xMidYMid meet" });
    inner += lines(fit.lines, fit.size, 0, top + size + gap + fit.height / 2, "middle", ink);
  } else {
    const fit = fitLines(team.name, w * 0.96, h * 0.92, h * 0.5);
    inner += lines(fit.lines, fit.size, 0, 0, "middle", ink);
  }
  return el(
    "g",
    {
      class: `ky-banner ky-banner-${team.side} ky-${team.state}`,
      transform: `translate(${num(zone.cx)} ${num(zone.cy)})${rot === 0 ? "" : ` rotate(${num(rot)})`}`,
      part: part(o.parts, `team ${team.role}`),
      "data-team": team.role,
    },
    inner,
  );
}

/** Lines of a name centred on a vertical position. */
function lines(rows: string[], size: number, x: number, cy: number, anchor: "start" | "middle", ink: string): string {
  const step = size * LINE_HEIGHT;
  return rows
    .map((row, i) => {
      const y = cy + (i - (rows.length - 1) / 2) * step + size * 0.36;
      return el("text", { class: `ky-text ky-name ${ink}`, x, y, "font-size": size, "text-anchor": anchor }, esc(row));
    })
    .join("");
}

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The words under or over the score. */
export interface PlateWords {
  competition?: string;
  /** The foot of the plate: the status and the date, or the label that replaces them. */
  foot?: string;
}

/** The score, large, on a panel in the middle of the surface. */
export function plateMarkup(spot: PlateSpot, left: TeamView, right: TeamView, words: PlateWords, o: { turned: boolean; parts: boolean; surfaceSport: Sport }): string {
  const { w, h } = spot;
  const rows: { kind: "comp" | "main" | "foot"; height: number }[] = [];
  if (words.competition) rows.push({ kind: "comp", height: 0.15 });
  rows.push({ kind: "main", height: 0.58 });
  if (words.foot) rows.push({ kind: "foot", height: 0.15 });
  const gap = 0.03;
  const total = rows.reduce((sum, row) => sum + row.height, 0) + gap * (rows.length - 1);
  let y = (-total / 2) * h;
  let inner = el("rect", { class: "ky-plate-bg", x: -w / 2, y: -h / 2, width: w, height: h, rx: h * 0.14 });
  for (const row of rows) {
    const rowH = row.height * h;
    if (row.kind === "main") inner += mainRow(y, rowH, w, h, left, right, o.parts);
    else {
      const text = (row.kind === "comp" ? words.competition : words.foot) ?? "";
      const size = Math.min(rowH * 0.66, (w * 0.92) / Math.max(0.1, textWidth(text, false)));
      inner += el("text", { class: `ky-text ky-${row.kind}`, x: 0, y: y + rowH / 2 + size * 0.36, "font-size": size }, esc(text));
    }
    y += rowH + gap * h;
  }
  return el(
    "g",
    { class: "ky-plate", transform: `translate(${num(spot.cx)} ${num(spot.cy)})${o.turned ? " rotate(-90)" : ""}`, part: part(o.parts, "plate") },
    inner,
  );
}

function mainRow(top: number, rowH: number, w: number, h: number, left: TeamView, right: TeamView, parts: boolean): string {
  const abbrSize = rowH * 0.26;
  const dash = h * 0.13;
  const widest = Math.max(textWidth(left.score), textWidth(right.score), 1);
  const scoreSize = Math.min(rowH * 0.7, (w / 2 - dash - w * 0.05) / widest);
  const base = top + rowH * 0.3 + (rowH * 0.7) / 2 + scoreSize * 0.36;
  const abbrY = top + abbrSize * 0.9;
  let out = "";
  for (const team of [left, right]) {
    const sign = team.side === "left" ? -1 : 1;
    const sw = textWidth(team.score) * scoreSize;
    const centre = sign * (dash + sw / 2);
    out += el("text", { class: `ky-text ky-abbr ky-abbr-${team.side}`, x: centre, y: abbrY, "font-size": abbrSize * 0.78 }, esc(team.abbr));
    out += el("text", { class: `ky-text ky-score ky-${team.state}`, x: sign * dash, y: base, "font-size": scoreSize, "text-anchor": sign < 0 ? "end" : "start", part: part(parts, `score ${team.role}-score`) }, esc(team.score));
    if (team.state === "win") out += el("rect", { class: `ky-winbar ky-winbar-${team.side}`, x: sign < 0 ? -dash - sw : dash, y: base + scoreSize * 0.1, width: sw, height: Math.max(0.5, scoreSize * 0.07) });
  }
  out += el("text", { class: "ky-text ky-dash-text", x: 0, y: base, "font-size": scoreSize * 0.8 }, "–");
  return out;
}

/** A small picture of each sport's surface, for the badge: strokes in a box 36 wide and 20 tall, centred on the origin. */
export function glyph(sport: Sport): string {
  switch (sport) {
    case "nfl":
    case "cfl":
    case "ifaf":
      return "M-18 -10H18V10H-18ZM-12 -10V10M12 -10V10M0 -10V10M-6 -10V10M6 -10V10";
    case "nhl":
      return "M-14 -10H14A4 4 0 0 1 18 -6V6A4 4 0 0 1 14 10H-14A4 4 0 0 1 -18 6V-6A4 4 0 0 1 -14 -10ZM0 -10V10M-5 0A5 5 0 1 0 5 0A5 5 0 1 0 -5 0M-9 -10V10M9 -10V10";
    case "nba":
      return "M-18 -10H18V10H-18ZM0 -10V10M-5 0A5 5 0 1 0 5 0A5 5 0 1 0 -5 0M-18 -4H-10V4H-18M18 -4H10V4H18";
    case "mlb":
      return "M0 9L9 0L0 -9L-9 0ZM-18 10L0 9L18 10M0 -9A12 12 0 0 1 12 0";
  }
}

/** The state each of two scores puts its team in. */
export function stateOf(winner: "home" | "away" | "none", role: "home" | "away"): "win" | "lose" | "none" {
  if (winner === "none") return "none";
  return winner === role ? "win" : "lose";
}

/** The badge: one strip, [logo abbreviation score] [picture and status] [score abbreviation logo]. */
export function badgeMarkup(left: TeamView, right: TeamView, o: { sport: Sport; status: string | undefined; turned?: boolean; parts: boolean }): { w: number; h: number; markup: string } {
  const W = 440;
  const H = 64;
  const block = 182;
  let out = el("rect", { class: "ky-badge-bg", x: 0, y: 0, width: W, height: H, rx: 12 });
  out += el("path", { class: "ky-block ky-block-left", d: `M12 0H${block}V${H}H12A12 12 0 0 1 0 ${H - 12}V12A12 12 0 0 1 12 0Z` });
  out += el("path", { class: "ky-block ky-block-right", d: `M${W - block} 0H${W - 12}A12 12 0 0 1 ${W} 12V${H - 12}A12 12 0 0 1 ${W - 12} ${H}H${W - block}Z` });
  for (const team of [left, right]) {
    const isLeft = team.side === "left";
    const logoSize = 40;
    const logoX = isLeft ? 12 : W - 12 - logoSize;
    const textStart = isLeft ? (team.logo === undefined ? 14 : 60) : W - (team.logo === undefined ? 14 : 60);
    const scoreEdge = isLeft ? block - 14 : W - block + 14;
    const scoreSize = Math.min(32, (block * 0.42) / Math.max(1, textWidth(team.score)));
    const room = Math.abs(scoreEdge - textStart) - textWidth(team.score) * scoreSize - 8;
    const abbrSize = Math.max(8, Math.min(22, room / Math.max(1, textWidth(team.abbr))));
    out += el("g", { class: `ky-badge-team ky-badge-${team.side} ky-${team.state}`, part: part(o.parts, `team ${team.role}`) },
      (team.logo === undefined ? "" : el("image", { class: "ky-logo", href: team.logo, x: logoX, y: 12, width: logoSize, height: logoSize, preserveAspectRatio: "xMidYMid meet" })) +
        el("text", { class: `ky-text ky-name ky-ink-${team.side}`, x: textStart, y: H / 2 + abbrSize * 0.36, "font-size": abbrSize, "text-anchor": isLeft ? undefined : "end" }, esc(team.abbr)) +
        el("text", { class: `ky-text ky-score ky-ink-${team.side} ky-${team.state}`, x: scoreEdge, y: H / 2 + scoreSize * 0.36, "font-size": scoreSize, "text-anchor": isLeft ? "end" : "start", part: part(o.parts, `score ${team.role}-score`) }, esc(team.score)),
    );
  }
  const mid = W / 2;
  out += el("path", { class: "ky-glyph", d: glyph(o.sport), transform: `translate(${mid} ${o.status ? 22 : 32}) scale(0.9)`, fill: "none" });
  if (o.status) {
    const size = Math.min(11.5, 76 / Math.max(1, textWidth(o.status, false)));
    out += el("text", { class: "ky-text ky-badge-status", x: mid, y: 52 + size * 0.2, "font-size": size }, esc(o.status));
  }
  return { w: W, h: H, markup: el("g", { class: "ky-badge", part: part(o.parts, "badge") }, out) };
}
