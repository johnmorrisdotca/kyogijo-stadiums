// The board of a broadcast picture: the officials of one mat listed like a score panel on a television graphic. It is the package's own score panel drawn for officials (`budo.board.ts`): the same dark rounded plate, the
// mat's name where a score panel has the competition, the column heads, a row for each seat with its number on the round badge the seats on the mat wear and the name on a coloured chip as a team's is, the ID where a
// score would be, and the style under it where the foot is. Same classes, so the same colours, faces and light and dark; a seat with nobody in it is a hollow badge and a dashed chip. Every size is in the picture's own
// units and proportional to its width, and text is only ever set at a size: it is never stretched. Nothing here decides where the board goes.
import { el, esc, hash, num } from "./format.ts";
import { PLAN_CARD, badge } from "./judging.card.ts";
import { fitChart, type CardFit } from "./judging.fit.ts";
import { JUDGING_LEAGUE } from "./judging.data.ts";
import { judgingSetting, type JudgingSetting } from "./judging.ts";
import { KYOGIJO_JUDGING_BOARD_STYLE, KYOGIJO_JUDGING_STYLE } from "./judging.style.ts";
import { judgingText } from "./judging.text.ts";
import type { JudgingOptions, JudgingResolved } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import { fill } from "./strings.ts";
import { metaMarkup, safeClass } from "./common.ts";
import { LINE_HEIGHT, fitLines, textWidth } from "./text.ts";
import { VERSION } from "./version.ts";

/** The width a board is laid out in before it is scaled to the picture: every other figure here is a share of it. */
export const BOARD_BASE = 480;

/** One board as markup at (x, y), `width` wide, and how tall it came out. */
export interface BoardPlace {
  markup: string;
  width: number;
  height: number;
}

/** The line at the board's foot: the mat's own line (`Round 2`) and the style (`Kata, 5 judges`). */
export function boardFoot(mat: JudgingResolved, setting: Pick<JudgingSetting, "language" | "style">): string {
  const style = fill(JUDGING_WORDS[setting.language].styleName[setting.style], { count: mat.seats.length });
  return [mat.line, style].filter((part) => part !== "").join(" · ");
}

/** The text of a board's lines, centred on x: each line `size` tall, the first one's middle at `top`. */
function lines(rows: readonly string[], size: number, x: number, top: number, cls: string): string {
  return rows.map((row, i) => el("text", { class: cls, x, y: top + (i + 0.5) * size * LINE_HEIGHT + size * 0.3, "font-size": size, "text-anchor": "middle" }, esc(row))).join("");
}

/** A name on its chip: on one line where it stays at a size that reads (21 and up on a board 480 wide), else wrapped at its spaces, or broken inside a word, at a size no smaller than 17: the row grows to hold it. */
function nameFit(name: string, room: number, k: number): CardFit {
  const size = Math.min(27 * k, room / Math.max(1, textWidth(name)));
  if (size >= 21 * k) return { name: [name], nameSize: size, id: [], idSize: 0, width: textWidth(name) * size, height: size * LINE_HEIGHT };
  return fitChart({ name, id: "", idLabel: "", width: room, max: 27 * k, min: 17 * k });
}

/** The board of one mat at (x, y), `width` wide. */
export function boardMarkup(mat: JudgingResolved, setting: Pick<JudgingSetting, "language" | "style">, x: number, y: number, width: number): BoardPlace {
  const words = JUDGING_WORDS[setting.language];
  const k = width / BOARD_BASE;
  const pad = 18 * k;
  const badgeR = 21 * k;
  const chipX = pad + 56 * k;
  const chipW = 244 * k;
  const idX = chipX + chipW + 12 * k;
  const idW = width - pad - idX;
  const rowMin = 60 * k;
  const headH = 30 * k;
  let out = "";
  let cursor = 0;

  // The title: the mat's name, where a score panel has the competition.
  const title = fitLines(mat.label, width - 2 * pad, 52 * k, 42 * k);
  const titleH = Math.max(64 * k, title.lines.length * title.size * LINE_HEIGHT + 26 * k);
  out += lines(title.lines, title.size, width / 2, (titleH - title.lines.length * title.size * LINE_HEIGHT) / 2, "ky-text ky-comp ky-ju-board-title");
  cursor += titleH;

  // The column heads.
  const head = (text: string, cx: number, room: number): string => el("text", { class: "ky-text ky-foot", x: cx, y: cursor + headH / 2 + 5 * k, "font-size": Math.max(1, Math.min(15 * k, room / Math.max(1, textWidth(text)))), "text-anchor": "middle" }, esc(text));
  out += head(words.chart.name, chipX + chipW / 2, chipW * 0.9) + head(words.chart.id, idX + idW / 2, idW * 0.9);
  cursor += headH;

  // A row for each seat, as tall as its name and its ID need.
  for (const a of mat.seats) {
    const name = a.assigned && a.name !== "" ? nameFit(a.name, chipW - 22 * k, k) : undefined;
    const id = a.id === "" ? undefined : fitChart({ name: a.id, id: "", idLabel: "", width: idW - 8 * k, max: 25 * k, min: 15 * k });
    const rowH = Math.max(rowMin, (name?.height ?? 0) + 22 * k, (id?.height ?? 0) + 22 * k);
    const cy = cursor + rowH / 2;
    let row = "";
    row += badge(PLAN_CARD, pad + 26 * k, cy, badgeR, a.seat.n, a.assigned);
    const chipH = rowH - 10 * k;
    row += el("rect", { class: a.assigned ? "ky-panel-left ky-ju-chip" : "ky-ju-chip-empty", x: chipX, y: cursor + 5 * k, width: chipW, height: chipH, rx: Math.min(chipH * 0.22, 14 * k) });
    if (name === undefined) {
      row += el("text", { class: "ky-text ky-ju-board-vacant", x: chipX + chipW / 2, y: cy + 19 * k * 0.36, "font-size": 19 * k, "text-anchor": "middle" }, esc(words.chart.vacant));
    } else {
      row += lines(name.name, name.nameSize, chipX + chipW / 2, cy - (name.name.length * name.nameSize * LINE_HEIGHT) / 2, "ky-text ky-ink-left");
    }
    if (id !== undefined) row += lines(id.name, id.nameSize, idX + idW / 2, cy - (id.name.length * id.nameSize * LINE_HEIGHT) / 2, "ky-text ky-score ky-ju-board-id");
    out += el("g", { class: "ky-ju-board-row", "data-mat": mat.n, "data-seat": a.seat.id }, row);
    cursor += rowH;
  }

  // The foot: the line and the style.
  const foot = boardFoot(mat, setting);
  const footSize = Math.max(1, Math.min(21 * k, ((width - 2 * pad) * 0.98) / Math.max(1, textWidth(foot))));
  const footH = 48 * k;
  out += el("text", { class: "ky-text ky-foot", x: width / 2, y: cursor + footH / 2 + footSize * 0.34, "font-size": footSize, "text-anchor": "middle" }, esc(foot));
  cursor += footH;

  const plate = el("rect", { class: "ky-plate-bg", x: 0, y: 0, width, height: cursor, rx: Math.min(30 * k, width * 0.05) });
  return { markup: el("g", { class: "ky-plate ky-ju-board", "data-mat": mat.n, transform: `translate(${num(x)} ${num(y)})` }, plate + out), width, height: cursor };
}

/**
 * The board of an assignment on its own, as an SVG with nothing round it: the plate is the only thing that is drawn, semi-transparent, so that a page can lay it over a picture of the mat (the 3D view's). With several
 * mats and no `mat`, their boards stand one under another.
 * @example
 * ```ts
 * import { judgingBoard } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * const svg = judgingBoard({ style: "kata", mats: [{ label: "Mat 1", officials: [{ seat: 1, name: "Aiko Mori", id: "J-1042" }] }] });
 * console.log(svg.includes("ky-ju-board"), svg.includes("Aiko Mori"));
 * // true true
 * ```
 */
export function judgingBoard(options: JudgingOptions, resolved?: JudgingSetting): string {
  const setting = resolved ?? judgingSetting(options);
  const width = setting.width;
  const gid = safeClass(options.id).replace(/ /g, "-") || `ky-jb-${hash(JSON.stringify([options, VERSION]))}`;
  let y = 0;
  let body = "";
  for (const mat of setting.mats) {
    const placed = boardMarkup(mat, setting, 0, y, width);
    body += placed.markup;
    y += placed.height + 24 * (width / BOARD_BASE);
  }
  const height = Math.ceil(y - 24 * (width / BOARD_BASE));
  const { title, description } = judgingText(setting, options, false, "broadcast");
  const css = options.css === "none" ? "" : `<style>${KYOGIJO_JUDGING_BOARD_STYLE}\n${KYOGIJO_JUDGING_STYLE}</style>`;
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo ky-judging ky-judging-board${safeClass(options.className) === "" ? "" : ` ${safeClass(options.className)}`}`,
      viewBox: `0 0 ${num(width)} ${num(height)}`,
      role: "img",
      "aria-labelledby": `${gid}-t ${gid}-d`,
      "data-judging": setting.style,
      "data-league": JUDGING_LEAGUE[setting.style].league,
      "data-view": "board",
      "data-theme": options.theme === "light" || options.theme === "dark" ? options.theme : undefined,
      "data-version": VERSION,
    },
    metaMarkup(`${gid}-t`, title, `${gid}-d`, description) + css + body,
  );
}
