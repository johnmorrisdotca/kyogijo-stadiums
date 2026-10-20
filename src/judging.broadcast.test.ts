// The broadcast view of a judging assignment: the mat large, 16:9, with the officials on a board at its side like a television graphic, the seats' badges where the officials sit, nothing stretched, the board never over the
// contest area, the title only a name and never a tooltip, light and dark, English and Japanese, and the same string for the same options.
import { describe, expect, it } from "vitest";

import { judgingBoard } from "./judging.board.ts";
import { BROADCAST_RATIO } from "./judging.broadcast.ts";
import { drawJudging, judgingDrawing, judgingTable } from "./judging.draw.ts";
import { KYOGIJO_JUDGING_BROADCAST_STYLE } from "./judging.mount.ts";
import { judgingSetting } from "./judging.ts";
import { KYOGIJO_JUDGING_BOARD_STYLE, KYOGIJO_JUDGING_STYLE } from "./judging.style.ts";
import { buildJudgingTurn } from "./judging.turn.ts";
import type { JudgingOptions } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import { textWidth } from "./text.ts";

const FIVE = [
  { seat: 1, name: "Aiko Mori", id: "J-1042" },
  { seat: 2, name: "Daniel Okafor", id: "J-0377" },
  { seat: 3, name: "Sofia Lindqvist-Hernandez", id: "J-2210" },
  { seat: 4, name: "Kenji Watanabe", id: "J-0918" },
  { seat: 5, name: "Marta Kowalczyk", id: "J-1555" },
] as const;
const OFFICIALS = [
  { seat: "referee", name: "Hana Ito", id: "R-204" },
  { seat: "timekeeper", name: "Sam Cole", id: "T-011" },
  { seat: "scorekeeper", name: "Ana Ruiz", id: "T-012" },
  { seat: "supervisor", name: "Peter Lindqvist-Haraldsson", id: "S-003" },
  { seat: "side-judge-1", name: "Kim Park", id: "J-707" },
] as const;
const kata = (rest: Partial<JudgingOptions> = {}): JudgingOptions => ({ style: "kata", view: "broadcast", mats: [{ label: "Mat 1", line: "Round 2", officials: FIVE }], ...rest });
const shiai = (rest: Partial<JudgingOptions> = {}): JudgingOptions => ({ style: "shiai", view: "broadcast", mats: [{ label: "Mat 1", officials: OFFICIALS }], sideJudges: true, ...rest });
const texts = (svg: string, cls: string): string[] => [...svg.matchAll(new RegExp(`<text class="${cls}"[^>]*>([^<]*)</text>`, "g"))].map((m) => m[1]);
const num = (tag: string, name: string): number => Number(new RegExp(`${name}="(-?[\\d.]+)"`).exec(tag)![1]);

describe("the options of the broadcast view", () => {
  it("take `view` as plan or broadcast (plan by default) and a mat's `line` of at most 60 characters, cleaned", () => {
    expect(judgingSetting({ style: "kata", mats: [{}] }).view).toBe("plan");
    expect(judgingSetting(kata()).view).toBe("broadcast");
    expect(() => judgingSetting(kata({ view: "tv" as never }))).toThrow(TypeError);
    expect(judgingSetting(kata({ mats: [{ line: "  Round\u0007  2 " }] })).mats[0].line).toBe("Round 2");
    expect(judgingSetting(kata({ mats: [{}] })).mats[0].line).toBe("");
    expect(() => judgingSetting(kata({ mats: [{ line: "x".repeat(61) }] }))).toThrow(RangeError);
    expect(judgingSetting(kata({ mats: [{ line: "x".repeat(60) }] })).mats[0].line).toHaveLength(60);
    expect(() => judgingSetting(kata({ mats: [{ line: 4 as never }] }))).toThrow(TypeError);
  });
});

describe("the broadcast picture", () => {
  const d = judgingDrawing(kata());

  it("is 16:9 and says it is the broadcast view, with no chart: the officials are on the board", () => {
    expect(BROADCAST_RATIO).toBeCloseTo(16 / 9, 12);
    expect(d.width).toBe(1000);
    expect(d.height).toBe(Math.round(1000 / BROADCAST_RATIO));
    expect(d.svg).toContain(`viewBox="0 0 1000 ${d.height}"`);
    expect(d.svg).toContain('data-view="broadcast"');
    expect(d.svg).toContain('data-chart="no"');
    expect(d.chart).toBe(false);
    expect(d.svg).not.toContain("ky-ju-chart");
    expect(drawJudging(kata({ width: 1600 }))).toContain('viewBox="0 0 1600 900"');
  });

  it("has the board's title (the mat), a row for each seat with its number badge, its name on a chip and its ID, and the style and the line at its foot, in the score panel's own classes", () => {
    expect(texts(d.svg, "ky-text ky-comp ky-ju-board-title")).toEqual(["Mat 1"]);
    expect(texts(d.svg, "ky-text ky-ink-left")).toEqual(["Aiko Mori", "Daniel Okafor", "Sofia", "Lindqvist-Hernandez", "Kenji Watanabe", "Marta Kowalczyk"]);
    expect(texts(d.svg, "ky-text ky-score ky-ju-board-id")).toEqual(["J-1042", "J-0377", "J-2210", "J-0918", "J-1555"]);
    expect(texts(d.svg, "ky-text ky-foot")).toEqual(["Name", "ID", "Round 2 · Kata, 5 judges"]);
    expect([...d.svg.matchAll(/class="ky-ju-board-row"/g)]).toHaveLength(5);
    expect(d.svg).toContain('class="ky-plate ky-ju-board"');
    expect(d.svg).toContain('class="ky-plate-bg"');
    expect(d.svg).toContain('class="ky-panel-left ky-ju-chip"');
    // The seats' numbers are on the board's badges and on the seats: each number twice.
    const numbers = texts(d.svg, "ky-ju-badge-n");
    expect(numbers.filter((n) => n === "3")).toHaveLength(2);
    expect(numbers).toHaveLength(10);
  });

  it("keeps the seat badges on the seats: one in each seat group, inside the plan, and the board's rows carry the same numbers", () => {
    expect([...d.svg.matchAll(/class="ky-ju-seat" data-mat="1" data-seat="judge-(\d)"/g)].map((m) => m[1])).toEqual(["1", "2", "3", "4", "5"]);
    const plan = d.boards[0].plan;
    for (const m of d.svg.matchAll(/<g class="ky-ju-seat"[^>]*><circle class="ky-ju-badge[^"]*"([^>]*)\/>/g)) {
      const cx = num(m[1], "cx");
      const cy = num(m[1], "cy");
      expect(cx).toBeGreaterThanOrEqual(plan.x);
      expect(cx).toBeLessThanOrEqual(plan.x + plan.width);
      expect(cy).toBeGreaterThanOrEqual(plan.y);
      expect(cy).toBeLessThanOrEqual(plan.y + plan.height);
    }
  });

  it("shows a seat with nobody in it as a hollow badge and a dashed chip that says so, in either language", () => {
    const vacant = drawJudging(kata({ mats: [{ label: "Mat 1", officials: [{ seat: 1, name: "Aiko Mori", id: "J-1042" }] }] }));
    expect(texts(vacant, "ky-text ky-ju-board-vacant")).toEqual(Array(4).fill("Not assigned"));
    expect(vacant).toContain('class="ky-ju-chip-empty"');
    expect(vacant).toContain("ky-ju-badge ky-ju-badge-empty");
    const ja = drawJudging(kata({ language: "ja", mats: [{ officials: [{ seat: 1, name: "森 愛子", id: "J-1042" }] }] }));
    expect(texts(ja, "ky-text ky-comp ky-ju-board-title")).toEqual(["第1試合場"]);
    expect(texts(ja, "ky-text ky-ju-board-vacant")).toEqual(Array(4).fill("未定"));
    expect(texts(ja, "ky-text ky-foot")).toEqual(["氏名", "ID", "形（5人制）"]);
  });

  it("is the same string for the same options, and the second mat's board is the second mat's", () => {
    expect(drawJudging(kata())).toBe(drawJudging(kata()));
    const two = judgingDrawing(kata({ mats: [{ label: "Mat 1", officials: FIVE }, { label: "Final", officials: [{ seat: 1, name: "Li Wei", id: "J-3001" }] }] }));
    expect(two.boards.map((b) => b.mat)).toEqual([1, 2]);
    expect(two.height).toBe(2 * d.height + 20);
    expect(texts(two.svg, "ky-text ky-comp ky-ju-board-title")).toEqual(["Mat 1", "Final"]);
    expect(judgingDrawing(kata({ mats: [{ label: "Mat 1", officials: FIVE }, { label: "Final" }], mat: 2 })).boards.map((b) => b.mat)).toEqual([2]);
  });
});

describe("the board never covers the contest area", () => {
  const cases: [string, JudgingOptions][] = [
    ["a kata area", kata()],
    ["a kata area in Japanese, dark", kata({ language: "ja", theme: "dark" })],
    ["a contest area with the side judges", shiai()],
    ["a contest area with a tall board (six long names)", shiai({ mats: [{ label: "A mat with a rather long name of its own", line: "Round of 16, Pool B, Final block", officials: [...OFFICIALS, { seat: "side-judge-2", name: "Maximilian Alexander Friedrich von Hohenlohe-Schillingsfürst", id: "0123456789-0123456789-0123456789" }] }] })],
    ["the judges' bench close up", kata({ focus: "bench" })],
    ["a small picture", kata({ width: 480 })],
    ["a large picture", kata({ width: 2000 })],
  ];
  for (const [name, options] of cases) {
    it(`${name}: the board is inside the picture, clear of the mat's picture and of the middle of the contest area`, () => {
      const d = judgingDrawing(options);
      const b = d.boards[0];
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(d.width + 1e-6);
      expect(b.y + b.height).toBeLessThanOrEqual(d.height + 1e-6);
      // The mat is fitted into the room the board leaves: they do not overlap.
      expect(b.plan.x + b.plan.width).toBeLessThanOrEqual(b.x + 1e-6);
      const inside = b.centre.x >= b.x && b.centre.x <= b.x + b.width && b.centre.y >= b.y && b.centre.y <= b.y + b.height;
      expect(inside).toBe(false);
      if (options.focus !== "bench") {
        expect(b.centre.x).toBeGreaterThan(b.plan.x);
        expect(b.centre.x).toBeLessThan(b.plan.x + b.plan.width);
        expect(b.centre.y).toBeGreaterThan(b.plan.y);
        expect(b.centre.y).toBeLessThan(b.plan.y + b.plan.height);
      }
    });
  }

  it("holds every name and ID whole inside its chip and column: the estimate of each line's width is no more than its box's", () => {
    const d = judgingDrawing(shiai({ mats: [{ label: "Mat 1", officials: [{ seat: "referee", name: "Maximilian Alexander Friedrich von Hohenlohe-Schillingsfürst", id: "0123456789-0123456789-0123456789" }, { seat: "timekeeper", name: "Li", id: "T-1" }] }] }));
    for (const row of d.svg.split('<g class="ky-ju-board-row"').slice(1)) {
      const chip = /class="ky-panel-left ky-ju-chip" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(row);
      if (chip === null) continue;
      const [cy, ch] = [Number(chip[2]), Number(chip[4])];
      const names = [...row.matchAll(/<text class="ky-text ky-ink-left" x="[\d.]+" y="([\d.]+)" font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)];
      expect(names.length).toBeGreaterThan(0);
      for (const [, y, size, line] of names) {
        expect(textWidth(line) * Number(size)).toBeLessThanOrEqual(Number(chip[3]) + 1e-6);
        expect(Number(y)).toBeGreaterThan(cy);
        expect(Number(y)).toBeLessThan(cy + ch + Number(size));
      }
    }
    const all = (d.svg.match(/<text class="ky-text ky-ink-left"[^>]*>([^<]*)<\/text>/g) ?? []).map((t) => />([^<]*)</.exec(t)![1]).join("");
    expect(all.replace(/\s+/g, "")).toContain("MaximilianAlexanderFriedrichvonHohenlohe-Schillingsfürst");
    expect(d.boards[0].y + d.boards[0].height).toBeLessThanOrEqual(d.height);
  });
});

describe("the broadcast picture is never stretched", () => {
  it("has no textLength, no lengthAdjust and no scale of two numbers; and its type is in proportion: at twice the width every font size is twice as large", () => {
    const small = drawJudging(kata({ width: 800 }));
    const large = drawJudging(kata({ width: 1600 }));
    for (const svg of [small, large, drawJudging(shiai()), drawJudging(kata({ seatNames: true }))]) {
      expect(svg).not.toMatch(/textLength|lengthAdjust|scaleX|scaleY/);
      for (const m of svg.matchAll(/scale\(([^)]*)\)/g)) expect(m[1].trim().split(/[ ,]+/), m[0]).toHaveLength(1);
    }
    const sizes = (svg: string): number[] => [...svg.matchAll(/<text [^>]*font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    const a = sizes(small);
    const b = sizes(large);
    expect(a.length).toBeGreaterThan(20);
    expect(b).toHaveLength(a.length);
    a.forEach((v, i) => expect(b[i] / v, `text ${i}`).toBeCloseTo(2, 1));
  });

  it("sets the board's text in the faces and weights of the score panel (the drawing's own face, no face of its own)", () => {
    expect(KYOGIJO_JUDGING_BOARD_STYLE).toContain(".ky-judging-board .ky-text{fill:var(--ky-ink);font-family:var(--ky-font);font-weight:800");
    expect(KYOGIJO_JUDGING_BOARD_STYLE).toContain(".ky-judging-board .ky-ink-left{fill:var(--ky-left-ink)}");
    expect(KYOGIJO_JUDGING_STYLE).toContain(".kyogijo .ky-ju-board .ky-ju-board-id{font-weight:800");
    expect(KYOGIJO_JUDGING_STYLE).not.toMatch(/font-family:(?!var\(--ky-font\)|ui-monospace)/);
  });
});

describe("the title is a name, never a tooltip", () => {
  it("is in a <defs> in every judging picture, so that no box with its words pops up over the mat, and the picture is still named by it", () => {
    for (const svg of [drawJudging(kata()), drawJudging({ style: "kata", mats: [{ officials: FIVE }] }), judgingBoard(kata())]) {
      expect(svg).toMatch(/^<svg[^>]*><defs><title id="[^"]+">[^<]+<\/title><desc id="[^"]+">[^<]+<\/desc><\/defs>/);
      expect(svg).not.toMatch(/<svg[^>]*><title/);
      const [t, d] = /aria-labelledby="([^ "]+) ([^ "]+)"/.exec(svg)!.slice(1);
      expect(svg).toContain(`<title id="${t}">`);
      expect(svg).toContain(`<desc id="${d}">`);
      expect(svg).toContain('role="img"');
    }
  });

  it("still says what the picture shows, in both languages", () => {
    const en = judgingDrawing(kata());
    expect(en.title).toBe("Judging assignments: Kata, 5 judges, 1 mat");
    expect(en.description).toContain("The officials are listed on a board at the side of the mat");
    expect(en.description).toContain("Judge 1 Aiko Mori, ID J-1042");
    expect(judgingDrawing(kata({ language: "ja" })).description).toContain(JUDGING_WORDS.ja.say.board);
    // The text alternative is the same table whichever view is drawn.
    expect(judgingTable(kata())).toBe(judgingTable({ ...kata(), view: "plan" }));
  });
});

describe("the board on its own, to lie over the 3D view", () => {
  const board = judgingBoard(kata());

  it("is a drawing of the board alone, with a semi-transparent plate, its own scoped rules and nothing that could recolour the surface under it", () => {
    expect(board).toContain('class="kyogijo ky-judging ky-judging-board"');
    expect(board).toContain('data-view="board"');
    expect(texts(board, "ky-text ky-comp ky-ju-board-title")).toEqual(["Mat 1"]);
    expect(board).toContain(KYOGIJO_JUDGING_BOARD_STYLE);
    // A stylesheet is shared by the whole page: the board must not set the surface's colours again.
    expect(board).not.toContain("--ky-surface");
    expect(board).not.toContain(".ky-apron");
    expect(KYOGIJO_JUDGING_BOARD_STYLE).toContain("--ky-plate:rgba(18,24,21,.9)");
    expect(KYOGIJO_JUDGING_BOARD_STYLE).toContain("--ky-plate:rgba(0,0,0,.82)");
    expect(judgingBoard(kata({ theme: "dark" }))).toContain('data-theme="dark"');
    expect(judgingBoard(kata({ css: "none" }))).not.toContain("<style>");
  });

  it("is as wide as the picture's units say, and its height follows its rows", () => {
    expect(board).toContain('viewBox="0 0 1000 ');
    const small = judgingBoard(kata({ width: 480 }));
    expect(small).toContain('viewBox="0 0 480 ');
    const h = (svg: string): number => Number(/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(svg)![1]);
    expect(h(judgingBoard(kata({ width: 960 })))).toBeCloseTo(2 * h(small), -1);
    expect(h(judgingBoard(shiai()))).toBeGreaterThan(h(judgingBoard({ ...kata(), mats: [{ officials: FIVE.slice(0, 1) }] })) - 1);
  });
});

describe("the 3D view of the broadcast", () => {
  it("is the same model as the 3D view of the plan, and its flat picture (for a browser that cannot turn) is the broadcast picture with its own board", () => {
    const model = buildJudgingTurn(kata());
    expect(model.flat).toContain('data-view="broadcast"');
    expect(model.flat).toContain("ky-ju-board");
    expect(model.view.yaw).toBe(0);
    expect(model.description).toContain("The officials are listed on a board");
    const plain = buildJudgingTurn({ style: "kata", mats: [{ officials: FIVE }] });
    expect(plain.planes.map((p) => p.id)).toEqual(model.planes.map((p) => p.id));
  });

  it("lays the board over the view's top right corner as a share of the view's width (so it scales with it), 16:9, and under the view where it is narrow", () => {
    const css = KYOGIJO_JUDGING_BROADCAST_STYLE;
    expect(css).toContain("container-type:inline-size");
    expect(css).toContain("--ky-turn-ratio:16/9");
    expect(css).toMatch(/\.ky-ju-bc-board\{position:absolute;[^}]*top:3cqw;right:2cqw;width:30cqw;pointer-events:none\}/);
    expect(css).toContain("@container (max-width:639px)");
  });
});
