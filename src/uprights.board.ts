// The score, stood up: in the 3D view the score is not a panel lying on the floor but a scoreboard. A court or a rink has one hung over its middle on cables; a
// field has one standing behind an end (a ballpark's behind centre field). It is the score's badge (the compact strip `size: "badge"` draws) on a dark board that
// turns to face the eye, so that it can be read from wherever the view is. Nothing here is a rule: the sizes and the heights are ours.
import { plane, n, type Upright } from "./turn.kit.ts";

/** The sports that hang their board over the middle: the indoor ones with a floor in the middle of a hall. */
const HUNG: readonly string[] = ["nba", "nhl", "volleyball", "badminton", "handball", "tennis", "pickleball", "sepaktakraw", "netball"];

/** Where the board goes: `hung` over the middle, or `standing` behind an end (behind centre field in a ballpark). */
export const boardKind = (sport: string): "hung" | "standing" => (HUNG.includes(sport) ? "hung" : "standing");

/** What a badge drawing is, taken apart: its size, the attributes of its root (the colours and the look, which its rules read) and what is drawn in it. */
export function badgeParts(svg: string): { w: number; h: number; attrs: string; inner: string } | undefined {
  const root = /^<svg\s([^>]*)>/.exec(svg);
  if (root === null) return undefined;
  const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(root[1]);
  if (box === null) return undefined;
  const keep = [...root[1].matchAll(/([\w:-]+)="([^"]*)"/g)]
    .filter(([, name]) => !/^(xmlns|viewBox|width|height|role|aria-labelledby|class|part|data-version)$/.test(name))
    .map(([, name, value]) => `${name}="${value}"`)
    .join(" ");
  const inner = svg
    .slice(root[0].length, svg.lastIndexOf("</svg>"))
    .replace(/<title[\s\S]*?<\/title>/, "")
    .replace(/<desc[\s\S]*?<\/desc>/, "")
    .replace(/<style[\s\S]*?<\/style>/, "");
  return { w: Number(box[1]), h: Number(box[2]), attrs: keep, inner };
}

/** The scoreboard of a surface: its badge on a board, hung or standing, as one plane that faces the eye. */
export function scoreboard(badge: string, sport: string, area: { x0: number; y0: number; x1: number; y1: number }, thin: number): Upright | undefined {
  const parts = badgeParts(badge);
  if (parts === undefined) return undefined;
  const L = area.x1 - area.x0;
  const W = area.y1 - area.y0;
  const kind = boardKind(sport);
  // The board: as wide as a third of a court's length or nearly half a field's width, and a third as tall, with the badge inside a margin.
  const wide = kind === "hung" ? Math.min(0.3 * L, 44) : sport === "tabletennis" ? 0.6 * L : sport === "mlb" ? 0.24 * L : Math.min(0.36 * W, 80);
  const tall = wide * 0.32;
  const margin = wide * 0.025;
  const scale = (wide - 2 * margin) / parts.w;
  const lift = kind === "hung" ? Math.min(30, 12 + 0.1 * L) : tall * 0.9;
  // Hung: cables from the board's top corners up; standing: legs from its bottom corners down to the ground.
  const extra = kind === "hung" ? tall * 0.9 : lift;
  const total = tall + extra;
  const line = Math.max(thin * 2.5, wide * 0.008);
  const board = `<rect x="0" y="${n(kind === "hung" ? extra : 0)}" width="${n(wide)}" height="${n(tall)}" rx="${n(wide * 0.02)}" class="u-sbframe"/>`;
  const top = kind === "hung" ? extra : 0;
  const badgeAt = `<g class="kyogijo" ${parts.attrs} transform="translate(${n(margin)} ${n(top + (tall - parts.h * scale) / 2)}) scale(${n(scale)})">${parts.inner}</g>`;
  const holds =
    kind === "hung"
      ? `<path d="M${n(wide * 0.12)} 0V${n(extra)}M${n(wide * 0.88)} 0V${n(extra)}" class="u-sbline" fill="none" stroke-width="${n(line)}"/>`
      : `<path d="M${n(wide * 0.14)} ${n(tall)}V${n(total)}M${n(wide * 0.86)} ${n(tall)}V${n(total)}" class="u-sbline" fill="none" stroke-width="${n(line * 1.6)}"/>`;
  // Where it is: over the middle of the surface, or behind an end (behind the centre-field fence in a ballpark, where the surface's top edge is the far side).
  const cx = sport === "mlb" ? (area.x0 + area.x1) / 2 : kind === "hung" ? (area.x0 + area.x1) / 2 : area.x1 + 10 + 0.04 * L;
  const cy = sport === "mlb" ? area.y0 - 14 : (area.y0 + area.y1) / 2;
  const bottom = kind === "hung" ? lift : 0;
  const high = bottom + total;
  const planes = [{ ...plane("scoreboard", "screen", [cx - wide / 2, cy, high], [wide, 0, 0], [0, 0, -total], `${holds}${board}${badgeAt}`), billboard: true }];
  return { id: "scoreboard", kind: "scoreboard", at: [cx, cy], height: kind === "hung" ? lift : lift, planes };
}
