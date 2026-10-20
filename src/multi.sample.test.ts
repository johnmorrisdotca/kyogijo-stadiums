// A layout dressed as an event would dress it: `sample` fills the places for the event's words and marks with an invented event's name, year and city and with simple emblems of the package's own, in place of the dashed
// empty places. Nothing real is printed: no event, brand, federation, sponsor or league.
import { describe, expect, it } from "vitest";

import { buildMultiTurn, drawMulti, multiLayout, MULTI_PRESETS } from "./multi-entry.ts";

const count = (svg: string, needle: string | RegExp): number => (typeof needle === "string" ? svg.split(needle).length - 1 : [...svg.matchAll(needle)].length);
const BRANDS = /(ACN|Tibhar|Butterfly|DHS|Liebherr|Li-?Ning|Tata|OVO|Heineken|Yonex|Victor|Joola|Selkirk|Nike|Adidas|Panasonic|Mizuno|Park24|Judo ?TV|Omega|Visa|Coca|Samsung|Toyota|Wimbledon|PPA|Hamburg|Baku|Tokyo|ITTF|IJF|WKF|BWF|FIVB|NHL|NBA|FIFA|SPX|SPXN|SPXIS)/;

describe("sample content", () => {
  it("is off by default: the places are the dashed empty ones", () => {
    const svg = drawMulti({ preset: "judo-1x3" });
    expect(svg).not.toContain('class="ky-mu-sample-text');
    expect(svg).not.toContain('class="ky-mu-emblem');
    expect(count(svg, 'class="ky-mu-slot"')).toBeGreaterThan(0);
  });

  it("fills each place: the event's line in every floor text and board, an emblem in every logo place, and no dashed place left on the floor", () => {
    const layout = multiLayout({ preset: "judo-1x3" });
    const svg = drawMulti({ preset: "judo-1x3", sample: true });
    const texts = layout.slots.filter((s) => s.kind === "floor-text").length;
    const boards = layout.slots.filter((s) => s.kind === "board").length;
    const logos = layout.slots.filter((s) => s.kind === "floor-logo").length;
    expect(count(svg, "Kyogijo Open 2026 · Osaka")).toBe(texts);
    expect(count(svg, "KYOGIJO OPEN 2026 · OSAKA")).toBe(boards);
    expect(count(svg, 'class="ky-mu-emblems"')).toBe(logos);
    expect(count(svg, 'class="ky-mu-slot"')).toBe(0);
    expect(count(svg, 'class="ky-mu-slot ky-mu-slot-board"')).toBe(0);
  });

  it("takes an event of your own, and escapes what it is given", () => {
    const svg = drawMulti({ preset: "tabletennis-4", sample: { event: "Harbour Cup", year: 2031, city: "Port <b>City</b>" } });
    expect(svg).toContain("Harbour Cup 2031 · Port &lt;b&gt;City&lt;/b&gt;");
    expect(svg).not.toContain("<b>");
    expect(svg).not.toContain("Kyogijo Open");
  });

  it("speaks Japanese with an invented Japanese event", () => {
    const svg = drawMulti({ preset: "judo-1x3", sample: true, language: "ja" });
    expect(svg).toContain("競技場杯 2026 · 大阪");
    expect(svg).not.toContain("Kyogijo Open");
  });

  it("is drawn nowhere when the places are switched off, and says so in its description when it is on", () => {
    const off = drawMulti({ preset: "pickleball-2x2", sample: true, slots: false });
    expect(off).not.toContain('class="ky-mu-sample-text');
    expect(off).not.toContain('class="ky-mu-emblem');
    const on = drawMulti({ preset: "pickleball-2x2", sample: true });
    expect(on).toContain("carry sample content");
    expect(on).not.toContain("are drawn dashed");
  });

  it("is the same string every time, and the emblems differ from place to place", () => {
    const a = drawMulti({ preset: "judo-1x3", sample: true, id: "s" });
    expect(drawMulti({ preset: "judo-1x3", sample: true, id: "s" })).toBe(a);
    const kinds = new Set([...a.matchAll(/<g class="ky-mu-emblems"[^>]*>(<circle[^>]*\/>)(<path class="ky-mu-emblem(?:-fill)?")/g)].map((m) => m[2]));
    expect(kinds.size).toBeGreaterThan(1);
  });

  it("names no real brand, federation or event, for any preset, in either language", () => {
    for (const p of MULTI_PRESETS) {
      for (const language of ["en", "ja"] as const) {
        const svg = drawMulti({ preset: p.id, sample: true, language, style: "none" });
        const texts = [...svg.matchAll(/<text class="ky-mu-sample-text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
        expect(texts.length, p.id).toBeGreaterThan(0);
        for (const t of texts) expect(t, `${p.id} ${language}`).not.toMatch(BRANDS);
      }
    }
  });

  it("is in the 3D view's floor too", () => {
    const model = buildMultiTurn({ preset: "tabletennis-4", sample: true });
    expect(model.floor).toContain("Kyogijo Open 2026 · Osaka");
    expect(model.floor).toContain('class="ky-mu-emblem');
  });
});
