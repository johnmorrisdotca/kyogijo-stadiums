// What stands on an ice rink and on a basketball court: the boards and the glass round the ice and the two goals on it; the two baskets, each with its
// backboard, rim, net and the padded stanchion behind the baseline. Heights are the rulebooks': a basket's rim is 10 feet over the floor, a hockey goal is
// 4 feet high and 6 wide; the boards and the glass are the NHL's usual 42 inches and 5 feet above them (the rules give the glass a range, 5 to 8 feet).
import type { CourtFigures } from "./leagues/basketball.ts";
import type { RinkFigures } from "./leagues/hockey.ts";
import { goalCage } from "./uprights.goal.ts";
import { bar, mesh, n, plane, polygon, pole, threads, wall, type Plane, type Upright } from "./turn.kit.ts";

/** The height of the boards of a rink, in feet (42 inches), and of the glass above them (the NHL's least, 5 feet). */
export const BOARD_HEIGHT = 3.5;
export const GLASS_HEIGHT = 5;
/** The height of a hockey goal, 4 feet. */
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

/** The boards with the glass above them, one plane for each straight stretch of the line. */
export function boardPlanes(length: number, width: number, radius: number, boards: number, glass: number, thin: number): Plane[] {
  const points = rinkOutline(length, width, radius);
  const total = boards + glass;
  const planes: Plane[] = [];
  const cap = Math.max(thin * 0.8, 0.12);
  for (let i = 0; i < points.length; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const run = Math.hypot(x1 - x0, y1 - y0);
    if (run < 1e-6) continue;
    const svg = `<rect y="${n(glass)}" width="${n(run)}" height="${n(boards)}" class="u-board"/><rect width="${n(run)}" height="${n(glass)}" class="u-glass"/><rect y="${n(glass)}" width="${n(run)}" height="${n(cap)}" class="u-cap"/><rect width="${n(run)}" height="${n(cap)}" class="u-cap"/>`;
    planes.push(wall(`board-${i}`, "glass", x0, y0, x1, y1, 0, total, svg));
  }
  return planes;
}

/** A rink's uprights: the boards and glass, and the two goals. `goalLine` is the distance of the goal line from the end boards. */
export function rinkUprights(rink: RinkFigures, goalLine: number, thin: number, boards: boolean): Upright[] {
  const { length: L, width: W } = rink;
  const items: Upright[] = [];
  if (boards) items.push({ id: "boards", kind: "boards", at: [L / 2, W / 2], height: BOARD_HEIGHT, low: GLASS_HEIGHT + BOARD_HEIGHT, planes: boardPlanes(L, W, rink.cornerRadius, BOARD_HEIGHT, GLASS_HEIGHT, thin) });
  const { width, depth } = rink.net;
  for (const end of ["left", "right"] as const) {
    const left = end === "left";
    items.push(goalCage({ id: `goal-${end}`, x: left ? goalLine : L - goalLine, y: W / 2, out: left ? -1 : 1, width, height: HOCKEY_GOAL_HEIGHT, depth, top: depth * 0.55, post: Math.max(thin * 1.2, 0.17), cell: Math.max(thin * 5, 0.35), tone: "red" }));
  }
  return items;
}

/** The height of a basketball rim, in feet; the backboard's lower edge is a foot under it and it is 42 inches tall. */
export const RIM_HEIGHT = 10;
export const BACKBOARD_BOTTOM = 9;
export const BACKBOARD_HEIGHT = 3.5;

/** One basket: the backboard, the rim and its net, and the stanchion behind the baseline that holds them. */
function basket(end: "left" | "right", court: CourtFigures, thin: number): Upright {
  const left = end === "left";
  const sign = left ? 1 : -1;
  const L = court.length;
  const cy = court.width / 2;
  const back = left ? court.backboard.fromBaseline : L - court.backboard.fromBaseline;
  const rimX = left ? court.basket : L - court.basket;
  const r = court.rim;
  const bw = court.backboard.width;
  const top = BACKBOARD_BOTTOM + BACKBOARD_HEIGHT;
  const line = Math.max(thin * 0.9, 0.1);
  const id = `hoop-${end}`;
  const planes: Plane[] = [];
  // The backboard: glass in a frame, with the square over the rim.
  const targetW = 2;
  const targetH = 1.5;
  const svg = `<rect width="${n(bw)}" height="${n(BACKBOARD_HEIGHT)}" class="u-backboard"/><rect x="${n(line / 2)}" y="${n(line / 2)}" width="${n(bw - line)}" height="${n(BACKBOARD_HEIGHT - line)}" class="u-outline" stroke-width="${n(line)}" fill="none"/><rect x="${n((bw - targetW) / 2)}" y="${n(top - (RIM_HEIGHT + targetH))}" width="${n(targetW)}" height="${n(targetH)}" class="u-outline" stroke-width="${n(line * 0.8)}" fill="none"/>`;
  planes.push(wall(`${id}-backboard`, "board", back, cy - bw / 2, back, cy + bw / 2, BACKBOARD_BOTTOM, top, svg));
  // The rim, lying flat, and the net hanging from it: two crossed trapezoids.
  planes.push(plane(`${id}-rim`, "rim", [rimX - r, cy - r, RIM_HEIGHT], [2 * r, 0, 0], [0, 2 * r, 0], `<circle cx="${n(r)}" cy="${n(r)}" r="${n(r - line / 2)}" class="u-rimline" stroke-width="${n(line * 1.3)}" fill="none"/>`));
  const drop = 1.4;
  const foot = r * 0.55;
  const shape = polygon([[0, 0], [2 * r, 0], [r + foot, drop], [r - foot, drop]]);
  const netSvg = `<path d="${shape}" class="u-netfill"/>${threads(mesh(2 * r, drop, 0.3), 0.3)}`;
  planes.push(plane(`${id}-net-a`, "net", [rimX, cy - r, RIM_HEIGHT], [0, 2 * r, 0], [0, 0, -drop], netSvg), plane(`${id}-net-b`, "net", [rimX - r, cy, RIM_HEIGHT], [2 * r, 0, 0], [0, 0, -drop], netSvg));
  // The stanchion: a padded base behind the baseline and an arm out to the back of the board.
  const stand = left ? -3.5 : L + 3.5;
  const arm = top - 1.4;
  planes.push(...pole(`${id}-pad`, "stanchion", stand, cy, 0, 7, Math.max(1.1, thin * 5), "u-pad"));
  planes.push(...pole(`${id}-mast`, "stanchion", stand, cy, 7, arm, Math.max(0.5, thin * 2.5), "u-pole"));
  planes.push(...bar(`${id}-arm`, "stanchion", [stand, cy, arm], [back - sign * line, cy, arm], Math.max(0.4, thin * 2), "u-pole"));
  return { id, kind: "hoop", at: [rimX, cy], height: RIM_HEIGHT, low: top, planes };
}

/** A court's uprights: its two baskets. */
export const courtUprights = (court: CourtFigures, thin: number): Upright[] => [basket("left", court, thin), basket("right", court, thin)];
