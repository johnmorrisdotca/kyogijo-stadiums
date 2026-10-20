// The broadcast picture of an assignment: the mat large, as a television would show it, 16:9, with the officials on a board at its side like a graphic and the seats' number badges where the officials sit. The board
// is the score panel's own look (`judging.board.ts`) and never lies over the contest area: the mat is fitted into the room the board leaves, so the middle of the contest area is clear whatever the names are. The whole
// picture scales evenly when it is shown, type and all; no text in it is stretched. The same options always give the same string.
import { metaMarkup, safeClass } from "./common.ts";
import { el, hash, num } from "./format.ts";
import { boardMarkup } from "./judging.board.ts";
import type { JudgingDrawing } from "./judging.draw.ts";
import { metricsOf, planMarkup, surfacesOf } from "./judging.plan.ts";
import { judgingPlan, type JudgingSetting } from "./judging.ts";
import { KYOGIJO_JUDGING_STYLE } from "./judging.style.ts";
import { judgingText } from "./judging.text.ts";
import type { JudgingOptions } from "./judging.types.ts";
import { VERSION } from "./version.ts";

/** The picture's shape: a television's. */
export const BROADCAST_RATIO = 16 / 9;

/** The board's share of the picture's width, where it stands (from the right edge) and how far down. */
const BOARD = { width: 0.32, margin: 0.025, top: 0.03 };

export function broadcastDrawing(options: JudgingOptions, setting: JudgingSetting): JudgingDrawing {
  const width = setting.width;
  const frameH = Math.round(width / BROADCAST_RATIO);
  const gap = 0.02 * width;
  const m = metricsOf(width);
  const geom = judgingPlan(setting.style);
  // The camera is close: the tatami and the seats with a little round them, not the whole free zone of the plan, so that the mat fills the picture's height.
  const near = [geom.plan.judo!.tatami, geom.table, ...geom.places.flatMap((p) => [p.card, p.chair])];
  const away = 0.6;
  const region = setting.focus === "bench" ? geom.bench : { x0: Math.min(...near.map((b) => b.x0)) - away, y0: Math.min(...near.map((b) => b.y0)) - away, x1: Math.max(...near.map((b) => b.x1)) + away, y1: Math.max(...near.map((b) => b.y1)) + away };
  const gid = safeClass(options.id).replace(/ /g, "-") || `ky-ju-${hash(JSON.stringify([options, "broadcast", VERSION]))}`;
  const { surfaces, style, look } = surfacesOf(setting, options, gid);
  const cards: JudgingDrawing["cards"] = [];
  const boards: JudgingDrawing["boards"] = [];
  let body = "";
  let y = 0;
  setting.mats.forEach((mat, i) => {
    // The board first: as wide as its share, narrowed when a tall list would not fit the picture's height.
    let bw = BOARD.width * width;
    let placed = boardMarkup(mat, setting, 0, 0, bw);
    for (let tries = 0; tries < 4 && placed.height > 0.94 * frameH; tries += 1) {
      bw *= (0.94 * frameH) / placed.height * 0.99;
      placed = boardMarkup(mat, setting, 0, 0, bw);
    }
    const bx = width - bw - BOARD.margin * width;
    const by = y + Math.min(BOARD.top * width, (frameH - placed.height) / 2);
    const board = boardMarkup(mat, setting, bx, by, bw);
    // The mat in the room to the left of the board, as large as it will go.
    const room = { x: 0, y, w: bx - 0.02 * width, h: frameH };
    const plan = planMarkup(mat, surfaces[i], geom, region, room, m, setting, `${gid}-c${mat.n}`, false);
    const contest = geom.plan.judo!.contests[Math.min(i, geom.plan.judo!.contests.length - 1)];
    const centre = { x: plan.x + (((contest.x0 + contest.x1) / 2) - region.x0) * plan.scale, y: plan.y + (((contest.y0 + contest.y1) / 2) - region.y0) * plan.scale };
    mat.seats.forEach((a, k) => cards.push({ mat: mat.n, seat: a.seat.id, fits: plan.fits[k] }));
    boards.push({ mat: mat.n, x: bx, y: by, width: board.width, height: board.height, plan: { x: plan.x, y: plan.y, width: plan.width, height: plan.height }, centre });
    body += el("g", { class: "ky-ju-panel ky-ju-frame", "data-mat": mat.n }, el("rect", { class: "ky-apron", x: 0, y, width, height: frameH }) + plan.markup + board.markup);
    y += frameH + gap;
  });
  const height = Math.round(y - gap);
  const { title, description } = judgingText(setting, options, false, "broadcast");
  const css = options.css === "none" ? "" : `<style>${style}\n${KYOGIJO_JUDGING_STYLE}</style>`;
  const root = el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo ky-judging ky-judo${safeClass(options.className) === "" ? "" : ` ${safeClass(options.className)}`}`,
      viewBox: `0 0 ${num(width)} ${num(height)}`,
      role: "img",
      "aria-labelledby": `${gid}-t ${gid}-d`,
      "data-sport": "judo",
      "data-judging": setting.style,
      "data-view": "broadcast",
      "data-look": look ?? "yellow-red",
      "data-mats": setting.total,
      "data-chart": "no",
      "data-theme": options.theme === "light" || options.theme === "dark" ? options.theme : undefined,
      "data-version": VERSION,
    },
    metaMarkup(`${gid}-t`, title, `${gid}-d`, description) + css + body,
  );
  return { svg: root, width, height, chart: false, cards, title, description, boards };
}
