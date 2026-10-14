// What stands on an ice rink and on a basketball court: the boards and the glass round the ice and the two goals on it; the two baskets, each with its
// backboard, rim, net and the padded stanchion behind the baseline. The heights are read from the rulebooks (docs/sources.md, "Heights in the 3D view"):
// NHL Official Rules 2025-2026, Rule 1.3 (boards 40 to 48 in, 42 in the ideal; glass 8 ft over the boards at each end and not less than 6 ft along the sides)
// and Rule 2.1 (the goal 4 ft high and 6 ft wide inside the posts); NBA Rule 1 Section II (the board 6 ft by 3 1/2 ft, the ring's upper edge 10 ft over the
// floor, the net 18 in long); FIBA Official Basketball Rules 2026 Equipment 1.1.3, 1.1.5, 1.2.4 and 1.4.3 (the board 1,800 by 1,050 mm, the ring's top 3,050 mm,
// 150 mm over the board's lower edge, the support at least 2,000 mm behind the end line).
import type { CourtFigures } from "./leagues/basketball.ts";
import type { RinkFigures } from "./leagues/hockey.ts";
import { goalCage } from "./uprights.goal.ts";
import { bar, mesh, n, plane, polygon, pole, shy, threads, wall, type Plane, type Upright } from "./turn.kit.ts";

/** The boards of a rink, 42 in (NHL Rule 1.3: 40 to 48 in, 42 the ideal), the glass over them 8 ft at each end and 6 ft along the sides (Rule 1.3: not less than 6 ft). */
export const BOARD_HEIGHT = 3.5;
export const GLASS_END = 8;
export const GLASS_SIDE = 6;
/** The height of a hockey goal, 4 feet (NHL Rule 2.1). */
export const HOCKEY_GOAL_HEIGHT = 4;

/** The line round a rink's ice, as points: the straight sides and the quarter circles of its corners. */
export function rinkOutline(length: number, width: number, radius: number, steps = 6): [number, number][] {
  const r = Math.min(radius, width / 2, length / 2);
  const out: [number, number][] = [];
  const corner = (cx: number, cy: number, from: number): void => {
    for (let i = 0; i <= steps; i += 1) {
      const a = ((from + (90 * i) / steps) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  // Clockwise as the page shows it: the top left corner first.
  corner(r, r, 180);
  corner(length - r, r, 270);
  corner(length - r, width - r, 0);
  corner(r, width - r, 90);
  return out;
}

/** The boards with the glass above them, one plane for each straight stretch of the line: the glass is 8 ft at the ends and in the corners and 6 ft along the sides. */
export function boardPlanes(length: number, width: number, radius: number, boards: number, thin: number): Plane[] {
  const points = rinkOutline(length, width, radius);
  const planes: Plane[] = [];
  const cap = Math.max(thin * 0.8, 0.12);
  for (let i = 0; i < points.length; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const run = Math.hypot(x1 - x0, y1 - y0);
    if (run < 1e-6) continue;
    const along = Math.abs(y1 - y0) < 1e-6 && (Math.abs(y0) < 1e-6 || Math.abs(y0 - width) < 1e-6) && Math.min(x0, x1) >= radius - 1e-6;
    const glass = along ? GLASS_SIDE : GLASS_END;
    const svg = `<rect y="${n(glass)}" width="${n(run)}" height="${n(boards)}" class="u-board"/><rect width="${n(run)}" height="${n(glass)}" class="u-glass"/><rect y="${n(glass)}" width="${n(run)}" height="${n(cap)}" class="u-cap"/><rect width="${n(run)}" height="${n(cap)}" class="u-cap"/>`;
    planes.push(wall(`board-${i}`, "glass", x0, y0, x1, y1, 0, boards + glass, svg));
  }
  return planes;
}

/** A rink's uprights: the boards and glass, and the two goals. `goalLine` is the distance of the goal line from the end boards. */
export function rinkUprights(rink: RinkFigures, goalLine: number, thin: number, boards: boolean): Upright[] {
  const { length: L, width: W } = rink;
  const items: Upright[] = [];
  if (boards) items.push({ id: "boards", kind: "boards", at: [L / 2, W / 2], height: BOARD_HEIGHT, low: BOARD_HEIGHT + GLASS_END, planes: boardPlanes(L, W, rink.cornerRadius, BOARD_HEIGHT, thin).map((p) => shy(p, [L / 2, W / 2])) });
  const { width, depth } = rink.net;
  for (const end of ["left", "right"] as const) {
    const left = end === "left";
    items.push(goalCage({ id: `goal-${end}`, x: left ? goalLine : L - goalLine, y: W / 2, out: left ? -1 : 1, width, height: HOCKEY_GOAL_HEIGHT, depth, top: depth * 0.55, post: Math.max(thin * 1.2, 0.17), cell: Math.max(thin * 5, 0.35), tone: "red" }));
  }
  return items;
}

/** The ring's upper edge is 10 ft over the floor (NBA Rule 1 Section II) and 3,050 mm in FIBA's (1.2.4). */
export const RIM_HEIGHT = 10;
export const FIBA_RIM_HEIGHT = 3.05 * 3.280839895;
/** The board's lower edge is 150 mm under the ring's top (FIBA 1.1.5); NBA Rule 1 gives the board's size and the ring's height but not the lower edge, which is drawn the same. */
export const BOARD_DROP = 0.15 * 3.280839895;
/** The NBA's board is 3 1/2 ft tall, FIBA's 1,050 mm. */
export const BOARD_TALL = 3.5;
export const FIBA_BOARD_TALL = 1.05 * 3.280839895;
/** The least distance of the support's padding behind the end line, FIBA 1.4.3 Level 1: 2,000 mm. */
export const SUPPORT_BEHIND = 2 * 3.280839895;

/** One basket: the backboard, the rim and its net, and the stanchion behind the baseline that holds them. `fiba` draws the board and the net at FIBA's size. */
function basket(end: "left" | "right", court: CourtFigures, thin: number, fiba: boolean): Upright {
  const left = end === "left";
  const sign = left ? 1 : -1;
  const L = court.length;
  const cy = court.width / 2;
  const back = left ? court.backboard.fromBaseline : L - court.backboard.fromBaseline;
  const rimX = left ? court.basket : L - court.basket;
  const r = court.rim;
  const bw = court.backboard.width;
  const tall = fiba ? FIBA_BOARD_TALL : BOARD_TALL;
  const rimTop = fiba ? FIBA_RIM_HEIGHT : RIM_HEIGHT;
  const bottom = rimTop - BOARD_DROP;
  const top = bottom + tall;
  const line = Math.max(thin * 1.8, 0.2);
  const id = `hoop-${end}`;
  const planes: Plane[] = [];
  // The backboard: glass in a frame, with the rectangle behind the ring, its base level with the ring's top (FIBA 1.1.5: 590 by 450 mm; NBA: 24 by 18 in).
  const targetW = fiba ? 0.59 * 3.280839895 : 2;
  const targetH = fiba ? 0.45 * 3.280839895 : 1.5;
  const svg = `<rect width="${n(bw)}" height="${n(tall)}" class="u-backboard"/><rect x="${n(line / 2)}" y="${n(line / 2)}" width="${n(bw - line)}" height="${n(tall - line)}" class="u-outline" stroke-width="${n(line)}" fill="none"/><rect x="${n((bw - targetW) / 2)}" y="${n(top - (rimTop + targetH))}" width="${n(targetW)}" height="${n(targetH)}" class="u-outline" stroke-width="${n(line * 0.8)}" fill="none"/>`;
  planes.push(wall(`${id}-backboard`, "board", back, cy - bw / 2, back, cy + bw / 2, bottom, top, svg));
  // The rim, lying flat, and the net hanging from it: two crossed trapezoids, 18 in long (NBA Rule 1 Section II; FIBA 1.3.1: 400 to 450 mm).
  planes.push(plane(`${id}-rim`, "rim", [rimX - r, cy - r, rimTop], [2 * r, 0, 0], [0, 2 * r, 0], `<circle cx="${n(r)}" cy="${n(r)}" r="${n(r - line / 2)}" class="u-rimline" stroke-width="${n(line * 1.6)}" fill="none"/>`));
  const drop = fiba ? 0.42 * 3.280839895 : 1.5;
  const foot = r * 0.55;
  const shape = polygon([[0, 0], [2 * r, 0], [r + foot, drop], [r - foot, drop]]);
  const netSvg = `<path d="${shape}" class="u-netfill"/>${threads(mesh(2 * r, drop, 0.3), 0.3)}`;
  planes.push(plane(`${id}-net-a`, "net", [rimX, cy - r, rimTop], [0, 2 * r, 0], [0, 0, -drop], netSvg), plane(`${id}-net-b`, "net", [rimX - r, cy, rimTop], [2 * r, 0, 0], [0, 0, -drop], netSvg));
  // The stanchion: a padded base whose front is 2 m behind the end line, and an arm out to the back of the board.
  const padWide = Math.max(1.1, thin * 5);
  const stand = left ? -(SUPPORT_BEHIND + padWide / 2) : L + SUPPORT_BEHIND + padWide / 2;
  const arm = top - 1.4;
  planes.push(...pole(`${id}-pad`, "stanchion", stand, cy, 0, 7, padWide, "u-pad"));
  planes.push(...pole(`${id}-mast`, "stanchion", stand, cy, 7, arm, Math.max(0.5, thin * 2.5), "u-pole"));
  planes.push(...bar(`${id}-arm`, "stanchion", [stand, cy, arm], [back - sign * line, cy, arm], Math.max(0.4, thin * 2), "u-pole"));
  return { id, kind: "hoop", at: [rimX, cy], height: rimTop, low: top, planes };
}

/** A court's uprights: its two baskets. */
export const courtUprights = (court: CourtFigures, thin: number, fiba = false): Upright[] => [basket("left", court, thin, fiba), basket("right", court, thin, fiba)];
