import { el, num } from "./format.ts";
import { roundMarkup } from "./mark.ts";
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
  /** The team's mark is round: its logo in a circle with a ring, or, with no logo, its initials on its colour (`color`). */
  round?: boolean;
  fit?: "cover" | "contain";
  color?: string;
  ink?: string;
  state: "win" | "lose" | "none";
  /** The role in the game, for part names. */
  role: "home" | "away";
  /** Curling: the score of each end, written; and whether the team has the hammer. */
  ends?: string[];
  hammer?: boolean;
  /** The net sports: the score in each set, the tie-break points of each set, the points of the game in progress, and whether the team is serving. */
  sets?: string[];
  tiebreaks?: string[];
  points?: string;
  serving?: boolean;
  /** Cricket: the wickets lost, the overs faced and the score of each innings, written. */
  wickets?: string;
  overs?: string;
  innings?: string[];
}

const part = (on: boolean, names: string): string | undefined => (on ? names : undefined);

/**
 * A team's name and logo in its place. The place is a box in the surface's own frame; the words are set as the eye
 * sees them, turned by `rot` (or a quarter back when the whole surface is turned).
 */
export function bannerMarkup(zone: Zone, team: TeamView, o: { turned: boolean; onColour: boolean; parts: boolean; id?: string }): string {
  const rot = o.turned ? -90 : zone.rot;
  const { w, h } = zone;
  let inner = "";
  if (zone.panel) inner += el("rect", { class: `ky-panel ky-panel-${team.side}`, x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(h * 0.16, 8) });
  const ink = `ky-${o.onColour || zone.panel ? "ink" : "paint"}-${team.side}`;
  const logo = team.logo;
  // A round mark is a picture even where the team has no logo (its initials on its colour), and stays upright in a zone that is turned.
  const mark = (size: number, x: number, y: number): string =>
    team.round === true
      ? roundMarkup({ id: `${o.id ?? "ky"}-mk-${team.role}`, cx: x + size / 2, cy: y + size / 2, r: size / 2, href: logo, fit: team.fit, initials: team.abbr, color: team.color, ink: team.ink, upright: rot })
      : el("image", { class: "ky-logo", href: logo, x, y, width: size, height: size, preserveAspectRatio: "xMidYMid meet" });
  const pictured = logo !== undefined || team.round === true;
  const row = pictured && w / h >= 2.6;
  const stack = pictured && !row;
  if (row) {
    const size = Math.min(h * 0.9, w * 0.3);
    const gap = size * 0.22;
    const fit = fitLines(team.name, w - size - gap - h * 0.1, h * 0.92, h * 0.5);
    const total = size + gap + fit.width;
    const x0 = -total / 2;
    inner += mark(size, x0, -size / 2);
    inner += lines(fit.lines, fit.size, x0 + size + gap, 0, "start", ink);
  } else if (stack) {
    const size = Math.min(h * 0.56, w * 0.8);
    const gap = h * 0.05;
    const fit = fitLines(team.name, w * 0.96, h - size - gap - h * 0.06, h * 0.22);
    const total = size + gap + fit.height;
    const top = -total / 2;
    inner += mark(size, -size / 2, top);
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
    case "soccer":
      return "M-18 -10H18V10H-18ZM0 -10V10M-5 0A5 5 0 1 0 5 0A5 5 0 1 0 -5 0M-18 -5H-12V5H-18M18 -5H12V5H18";
    case "curling":
      // A house: the 12-, 8- and 4-foot circles round the button, with the centre line through it.
      return "M-10 0A10 10 0 1 0 10 0A10 10 0 1 0 -10 0M-6.7 0A6.7 6.7 0 1 0 6.7 0A6.7 6.7 0 1 0 -6.7 0M-3.3 0A3.3 3.3 0 1 0 3.3 0A3.3 3.3 0 1 0 -3.3 0M-18 0H18";
    case "tennis":
      // A court: the net, the singles sidelines, the service lines and the centre service line.
      return "M-18 -10H18V10H-18ZM0 -10V10M-18 -7.5H18M-18 7.5H18M-9.7 -7.5V7.5M9.7 -7.5V7.5M-9.7 0H9.7";
    case "volleyball":
      // A court: the centre line and the attack lines.
      return "M-18 -10H18V10H-18ZM0 -10V10M-6 -10V10M6 -10V10";
    case "badminton":
      // A court: the net, the short service lines, the centre lines and the singles sidelines.
      return "M-18 -10H18V10H-18ZM0 -10V10M-5.3 -10V10M5.3 -10V10M-18 0H-5.3M5.3 0H18M-18 -8.5H18M-18 8.5H18";
    case "pickleball":
      // A court: the net, the non-volley zone lines and the centrelines.
      return "M-18 -10H18V10H-18ZM0 -10V10M-5.7 -10V10M5.7 -10V10M-18 0H-5.7M5.7 0H18";
    case "tabletennis":
      // A table: the net across it and the centre line.
      return "M-16 -8H16V8H-16ZM0 -10V10M-16 0H16";
    case "lacrosse":
      // A field: the centre line, the goal circles and the restraining lines.
      return "M-18 -10H18V10H-18ZM0 -10V10M-12 0A3 3 0 1 0 -6 0A3 3 0 1 0 -12 0M12 0A3 3 0 1 0 6 0A3 3 0 1 0 12 0M-7 -10V10M7 -10V10";
    case "rugby":
      // A field: the try lines and in-goal, the 22-metre lines and the half-way line, and the posts.
      return "M-18 -10H18V10H-18ZM-14 -10V10M14 -10V10M-8 -10V10M8 -10V10M0 -10V10M-14 -2H-17M-14 2H-17M14 -2H17M14 2H17";
    case "afl":
      // An oval, with the centre square and the goal squares.
      return "M-14 -7A18 10 0 0 1 14 -7V7A18 10 0 0 1 -14 7ZM-4 -4H4V4H-4ZM-14 -2H-9V2H-14M14 -2H9V2H14";
    case "gaelic":
      // A field: the lines across and the two rectangles at each end.
      return "M-18 -10H18V10H-18ZM-18 -6H-12V6H-18M-18 -3H-15V3H-18M18 -6H12V6H18M18 -3H15V3H18M-9 -10V10M9 -10V10";
    case "cricket":
      // A ground: the boundary, the circle and the pitch with its creases.
      return "M-17 0A17 10 0 1 0 17 0A17 10 0 1 0 -17 0M-9 -4H9A4 4 0 0 1 9 4H-9A4 4 0 0 1 -9 -4M-5 -1H5V1H-5M-5 -2V2M5 -2V2";
    case "fieldhockey":
      // A pitch: the centre line, the 23-metre lines and the circles.
      return "M-18 -10H18V10H-18ZM0 -10V10M-7 -10V10M7 -10V10M-18 -5A5 5 0 0 1 -13 0A5 5 0 0 1 -18 5M18 -5A5 5 0 0 0 13 0A5 5 0 0 0 18 5";
    case "handball":
      // A court: the centre line, and the goal areas with their arcs.
      return "M-18 -10H18V10H-18ZM0 -10V10M-18 -6A6 6 0 0 1 -12 0A6 6 0 0 1 -18 6M18 -6A6 6 0 0 0 12 0A6 6 0 0 0 18 6";
    case "skating":
      // A rink: the oval of a track inside the boards, and the finishing line.
      return "M-18 -10H18V10H-18ZM-9 -6H9A6 6 0 0 1 9 6H-9A6 6 0 0 1 -9 -6ZM-9 -3.5H9A3.5 3.5 0 0 1 9 3.5H-9A3.5 3.5 0 0 1 -9 -3.5ZM4 3.5V10";
    case "athletics":
      // A track: the oval's outer edge, a lane line and the kerb, and the finish line across the straight.
      return "M-9 -10H9A10 10 0 0 1 9 10H-9A10 10 0 0 1 -9 -10ZM-9 -8.2H9A8.2 8.2 0 0 1 9 8.2H-9A8.2 8.2 0 0 1 -9 -8.2ZM-9 -6.4H9A6.4 6.4 0 0 1 9 6.4H-9A6.4 6.4 0 0 1 -9 -6.4ZM9 6.4V10";
  }
}

/** The state each of two scores puts its team in. */
export function stateOf(winner: "home" | "away" | "none", role: "home" | "away"): "win" | "lose" | "none" {
  if (winner === "none") return "none";
  return winner === role ? "win" : "lose";
}

/** The badge: one strip, [logo abbreviation score] [picture and status] [score abbreviation logo]. */
export function badgeMarkup(left: TeamView, right: TeamView, o: { sport: Sport; status: string | undefined; turned?: boolean; parts: boolean; id?: string }): { w: number; h: number; markup: string } {
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
    // The hammer: a small stone in the corner of the team's block.
    if (team.hammer === true) out += el("g", { class: `ky-badge-hammer ky-badge-hammer-${team.side}`, transform: `translate(${isLeft ? block - 11 : W - block + 11} 11)` }, el("circle", { class: "ky-hammer", r: 6 }) + el("circle", { class: "ky-hammer-in", r: 2.6 }));
    // The ball of the team that is serving, in the same corner.
    if (team.serving === true) out += el("g", { transform: `translate(${isLeft ? block - 11 : W - block + 11} 11)` }, el("circle", { class: "ky-serve", r: 6 }) + el("path", { class: "ky-serve-seam", d: "M-4.7 -1.8Q0 1.8 4.7 -1.8", "stroke-width": 0.9 }));
    out += el("g", { class: `ky-badge-team ky-badge-${team.side} ky-${team.state}`, part: part(o.parts, `team ${team.role}`) },
      (team.logo === undefined
        ? ""
        : team.round === true
          ? roundMarkup({ id: `${o.id ?? "ky"}-mk-${team.role}`, cx: logoX + logoSize / 2, cy: 12 + logoSize / 2, r: logoSize / 2, href: team.logo, fit: team.fit, ring: 2 })
          : el("image", { class: "ky-logo", href: team.logo, x: logoX, y: 12, width: logoSize, height: logoSize, preserveAspectRatio: "xMidYMid meet" })) +
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
