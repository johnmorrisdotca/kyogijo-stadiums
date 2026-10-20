// A judging assignment on paper: one mat to a page on A4 or US letter, the plan-and-chart layout in the light colours, the picture scaled evenly to the page, and a whole document that opens as the pages and prints as they are.
import { describe, expect, it } from "vitest";

import { JUDGING_PAPER, judgingPrint, judgingPrintSheets, judgingPrintStyle } from "./judging.print.ts";
import type { JudgingOptions } from "./judging.types.ts";

const FIVE = [
  { seat: 1, name: "Aiko Mori", id: "J-1042" },
  { seat: 2, name: "Daniel Okafor", id: "J-0377" },
  { seat: 3, name: "Sofia Lindqvist-Hernandez", id: "J-2210" },
  { seat: 4, name: "Kenji Watanabe", id: "J-0918" },
  { seat: 5, name: "Marta Kowalczyk", id: "J-1555" },
] as const;
const two = (rest: Partial<JudgingOptions> = {}): JudgingOptions => ({ style: "kata", mats: [{ label: "Mat 1", officials: FIVE }, { label: "Mat 2", officials: [{ seat: 1, name: "Li Wei", id: "J-3001" }] }], ...rest });

describe("the paper", () => {
  it("is A4 (210 by 297 mm) and US letter (215.9 by 279.4 mm)", () => {
    expect(JUDGING_PAPER.a4).toEqual({ name: "A4", width: 210, height: 297 });
    expect(JUDGING_PAPER.letter).toEqual({ name: "US letter", width: 215.9, height: 279.4 });
    expect(Object.isFrozen(JUDGING_PAPER)).toBe(true);
  });
});

describe("the stylesheet of a printout", () => {
  it("sets the page for A4 and for US letter, portrait or landscape, with a margin, and keeps the colours", () => {
    expect(judgingPrintStyle()).toContain("@page{size:A4 portrait;margin:12mm}");
    expect(judgingPrintStyle({ paper: "letter" })).toContain("@page{size:Letter portrait;margin:12mm}");
    expect(judgingPrintStyle({ paper: "letter", orientation: "landscape", margin: 8 })).toContain("@page{size:Letter landscape;margin:8mm}");
    expect(judgingPrintStyle()).toContain("print-color-adjust:exact");
  });

  it("makes each sheet the printable area less a millimetre (A4: 186 by 272 mm; letter: 191.9 by 254.4 mm) and breaks the page after it, but not after the last", () => {
    expect(judgingPrintStyle()).toContain("width:186mm;height:272mm");
    expect(judgingPrintStyle({ paper: "letter" })).toContain("width:191.9mm;height:254.4mm");
    expect(judgingPrintStyle({ orientation: "landscape" })).toContain("width:273mm;height:185mm");
    expect(judgingPrintStyle()).toContain("break-after:page");
    expect(judgingPrintStyle()).toContain(".ky-ju-sheet:last-child{break-after:auto");
  });

  it("holds the options to what they may be", () => {
    expect(() => judgingPrintStyle({ paper: "legal" as never })).toThrow(TypeError);
    expect(() => judgingPrintStyle({ orientation: "tall" as never })).toThrow(TypeError);
    expect(() => judgingPrintStyle({ margin: 2 })).toThrow(RangeError);
    expect(() => judgingPrintStyle({ margin: 31 })).toThrow(RangeError);
    expect(() => judgingPrintStyle({ margin: Number.NaN })).toThrow(RangeError);
  });
});

describe("the pages of a printout", () => {
  it("are one section for each mat, in order, each holding that mat's plan and chart", () => {
    const html = judgingPrintSheets(two());
    expect([...html.matchAll(/<section class="ky-ju-sheet" data-mat="(\d)">/g)].map((m) => m[1])).toEqual(["1", "2"]);
    expect(html.split("<section").length - 1).toBe(2);
    expect(html).toContain("Aiko Mori");
    expect(html).toContain("Li Wei");
    expect(html).toContain('data-chart="yes"');
    expect(html).toContain('data-paper="a4"');
    expect(judgingPrintSheets(two(), { paper: "letter" })).toContain('data-paper="letter"');
    expect(judgingPrintSheets(two({ mat: 2 })).match(/<section/g)).toHaveLength(1);
  });

  it("are always the plan-and-chart layout in the light colours, whatever view or theme was asked, laid out for the page's shape", () => {
    const html = judgingPrintSheets(two({ view: "broadcast", theme: "dark" }));
    expect(html).not.toContain('data-theme="dark"');
    expect(html).toContain('data-theme="light"');
    expect(html).not.toContain('data-view="broadcast"');
    expect(html).not.toContain(`class="ky-plate ky-ju-board"`);
    // The chart is under the plan on a portrait page and beside it on a landscape one: the picture's shape follows.
    const shape = (svg: string): number => {
      const [w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number);
      return h / w;
    };
    const portrait = shape(judgingPrintSheets(two({ mat: 1 })));
    const landscape = shape(judgingPrintSheets(two({ mat: 1 }), { orientation: "landscape" }));
    expect(portrait).toBeGreaterThan(1);
    expect(landscape).toBeLessThan(portrait);
  });

  it("scale the picture as a whole to the page, from its top, and never stretch it: a viewBox that meets, no text length, no scale of two numbers", () => {
    const html = judgingPrintSheets(two());
    expect(html.match(/preserveAspectRatio="xMidYMin meet"/g)).toHaveLength(2);
    expect(html).not.toMatch(/textLength|lengthAdjust|scaleX|scaleY|preserveAspectRatio="none"/);
    for (const m of html.matchAll(/scale\(([^)]*)\)/g)) expect(m[1].trim().split(/[ ,]+/), m[0]).toHaveLength(1);
    expect(judgingPrintStyle()).toContain(".ky-ju-sheet>svg.kyogijo{display:block;width:100%;height:100%}");
  });

  it("keep ids apart when several mats are on one page, and are the same text for the same options", () => {
    const html = judgingPrintSheets(two({ id: "assign" }));
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(judgingPrintSheets(two())).toBe(judgingPrintSheets(two()));
  });
});

describe("a printout as a document", () => {
  const doc = judgingPrint(two(), { paper: "letter" });

  it("is a whole page that carries its stylesheet, opens as the sheets on a grey desk and prints as they are, and fetches nothing", () => {
    expect(doc.startsWith("<!doctype html><html lang=\"en\"><head>")).toBe(true);
    expect(doc).toContain("@page{size:Letter portrait;margin:12mm}");
    expect(doc).toContain("@media screen{");
    expect(doc).toContain("<title>Judging assignments: Kata, 5 judges, 2 mats</title>");
    expect(doc).not.toMatch(/<script|<link|src="http|href="http|@import/);
    expect(doc.endsWith("</body></html>")).toBe(true);
  });

  it("is in the language asked for, with the title escaped", () => {
    expect(judgingPrint(two({ language: "ja" }))).toContain('<html lang="ja">');
    const escaped = judgingPrint(two({ title: undefined, mats: [{ label: "A & B <x>" }] }));
    expect(escaped).not.toContain("<x>");
  });
});
