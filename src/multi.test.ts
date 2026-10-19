import { describe, expect, it } from "vitest";

import { drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { LEAGUE_SOURCES } from "./leagues.ts";
import { MULTI_PRESETS, MULTI_SOURCES, MULTI_VENUES, multiPreset, multiSource, multiVenueById } from "./multi.data.ts";
import { drawMulti, multiSetting, multiTable } from "./multi.draw.ts";
import { fitSentence, multiFit, multiLayout, multiNumber, needsSentence, specOf } from "./multi.ts";
import { KYOGIJO_MULTI_STYLE } from "./multi.style.ts";
import { MULTI_WORDS } from "./multi.words.ts";
import { outlineOf } from "./outline.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import type { MultiSpec } from "./multi.types.ts";

const FT = 3.280839895;
const keys = (o: object): string[] => Object.keys(o).sort();

describe("the tournament layouts' figures", () => {
  it("add up as the rulebooks say: table tennis 14 m by 7 m to an area, badminton's 4 m and 1.5 m, curling's 4.75 m, judo's 10 + 4 + 4, karate's 8 + 2 + 2", () => {
    expect(multiLayout({ preset: "tabletennis-4" }).needs).toEqual({ length: 28, width: 14, area: 392, surfaces: 4 });
    expect(multiLayout({ preset: "tabletennis-8" }).needs).toMatchObject({ length: 56, width: 14, surfaces: 8 });
    // Four courts side by side: 6.1 m each, three gaps of 4 m (Grade 1 and 2) or 1.5 m, and 1.5 m beside the outer side lines; 2 m behind each baseline.
    expect(multiLayout({ preset: "badminton-1x4" }).needs).toMatchObject({ length: 39.4, width: 17.4 });
    expect(multiLayout({ preset: "badminton-1x4-min" }).needs).toMatchObject({ length: 31.9, width: 17.4 });
    // Four sheets of at most 4.75 m, at least 45.72 m long.
    expect(multiLayout({ preset: "curling-1x4" }).needs).toMatchObject({ length: 19, width: 45.72 });
    // Three areas of 10 m with a safety area of 4 m, 4 m common between them, and a free zone of 0.5 m all round: 3 x 10 + 2 x 4 + 2 x 4 + 1 by 18 + 1.
    expect(multiLayout({ preset: "judo-1x3" }).needs).toMatchObject({ length: 47, width: 19, surfaces: 3 });
    expect(multiLayout({ preset: "judo-1x4" }).needs).toMatchObject({ length: 61, width: 19, surfaces: 4 });
    // Karate: 8 m squares, 2 m of safety area, 2 m between, no free zone: 3 x 8 + 2 x 2 + 2 x 2 by 2 x 8 + 2 + 2 x 2.
    expect(multiLayout({ preset: "karate-2x3" }).needs).toMatchObject({ length: 32, width: 22, surfaces: 6 });
    expect(multiLayout({ preset: "karate-2x4" }).needs).toMatchObject({ length: 42, width: 22, surfaces: 8 });
    // Pickleball: 34 by 64 feet to each court.
    const pb = multiLayout({ preset: "pickleball-2x2" });
    expect(pb.floor.w).toBeCloseTo(2 * 64, 4);
    expect(pb.floor.h).toBeCloseTo(2 * 34, 4);
    // Tennis: 6.40 m behind, 3.66 m beside, 7.32 m between: 23.77 + 12.8 by 3 x 10.97 + 2 x 7.32 + 2 x 3.66.
    expect(multiLayout({ preset: "tennis-1x3" }).needs.length).toBeCloseTo(54.87, 1);
    expect(multiLayout({ preset: "tennis-1x3" }).needs.width).toBeCloseTo(36.57, 1);
  });

  it("keep every surface exactly as large as the package draws it, and inside its bay", () => {
    for (const spec of MULTI_PRESETS.filter((p) => p.kind === "cells")) {
      const box = outlineOf(spec.surface).box;
      const layout = multiLayout({ preset: spec.id });
      for (const cell of layout.cells) {
        // A surface turned a quarter stands across the layout: its width is the drawing's height.
        expect(cell.w, spec.id).toBeCloseTo(spec.turn === 90 ? box.h : box.w, 6);
        expect(cell.h, spec.id).toBeCloseTo(spec.turn === 90 ? box.w : box.h, 6);
        expect(cell.x, spec.id).toBeGreaterThanOrEqual(cell.bay.x - 1e-6);
        expect(cell.x + cell.w, spec.id).toBeLessThanOrEqual(cell.bay.x + cell.bay.w + 1e-6);
        expect(cell.y, spec.id).toBeGreaterThanOrEqual(cell.bay.y - 1e-6);
        expect(cell.y + cell.h, spec.id).toBeLessThanOrEqual(cell.bay.y + cell.bay.h + 1e-6);
        // Inside the floor.
        expect(cell.x + cell.w, spec.id).toBeLessThanOrEqual(layout.floor.w + 1e-6);
        expect(cell.y + cell.h, spec.id).toBeLessThanOrEqual(layout.floor.h + 1e-6);
      }
    }
  });

  it("lay a budō floor's contest areas where the sport's own drawing puts them", () => {
    for (const id of ["judo-1x3", "judo-1x4", "karate-2x3", "karate-2x4"]) {
      const layout = multiLayout({ preset: id });
      const box = outlineOf(layout.spec.surface).box;
      const tatami = layout.tatami as { x: number; y: number; w: number; h: number };
      expect(tatami.w, id).toBeCloseTo(box.w, 4);
      expect(tatami.h, id).toBeCloseTo(box.h, 4);
      // The first contest area is one safety area in from the tatami's corner, and the last ends one safety area short of its far corner.
      const first = layout.cells[0];
      const last = layout.cells[layout.cells.length - 1];
      expect(last.x + last.w + (first.x - tatami.x), id).toBeCloseTo(tatami.x + tatami.w, 4);
      expect(last.y + last.h + (first.y - tatami.y), id).toBeCloseTo(tatami.y + tatami.h, 4);
    }
  });

  it("take a grid and a stagger of the caller's own, and refuse what is not one", () => {
    expect(multiLayout({ preset: "tabletennis-4", rows: 3, columns: 5 }).cells).toHaveLength(15);
    const staggered = multiLayout({ preset: "tabletennis-4", stagger: 0.5 });
    expect(staggered.cells[2].x - staggered.cells[0].x).toBeCloseTo(7 * FT, 4);
    expect(staggered.floor.w).toBeCloseTo((28 + 7) * FT, 4);
    expect(multiLayout({ preset: "judo-1x3", columns: 2, rows: 2 }).cells).toHaveLength(4);
    expect(() => specOf({ preset: "tabletennis-4", rows: 0 })).toThrow(/rows is a whole number/);
    expect(() => specOf({ preset: "tabletennis-4", columns: 2.5 })).toThrow(/columns/);
    expect(() => specOf({ preset: "tabletennis-4", columns: 13 })).toThrow(RangeError);
    expect(() => specOf({ preset: "judo-1x3", columns: 7 })).toThrow(RangeError);
    expect(() => specOf({ preset: "tabletennis-4", stagger: 2 })).toThrow(/share/);
    expect(() => specOf({ preset: "nope" })).toThrow(/Unknown preset "nope"/);
    expect(() => specOf({})).toThrow(TypeError);
  });

  it("count rows and columns the same way everywhere: a row of N areas is 1 x N, and a key that names a grid says rows x columns", () => {
    for (const spec of MULTI_PRESETS) {
      const named = /(\d+)x(\d+)$/.exec(spec.id) ?? /(\d+)x(\d+)-min$/.exec(spec.id);
      if (named !== null) expect([spec.rows, spec.columns], spec.id).toEqual([Number(named[1]), Number(named[2])]);
      const shown = /\((\d+) x (\d+)\)/.exec(spec.name.en);
      if (shown !== null) expect([Number(shown[1]), Number(shown[2])], spec.id).toEqual([spec.rows, spec.columns]);
      const shownJa = /（(\d+)×(\d+)）/.exec(spec.name.ja);
      if (shownJa !== null) expect([Number(shownJa[1]), Number(shownJa[2])], spec.id).toEqual([spec.rows, spec.columns]);
    }
    for (const id of ["curling-1x4", "badminton-1x4", "badminton-1x4-min", "tennis-1x3", "judo-1x3", "judo-1x4"]) {
      const layout = multiLayout({ preset: id });
      expect(layout.spec.rows, id).toBe(1);
      // One row: every surface at the same height, side by side.
      expect(new Set(layout.cells.map((c) => c.y)).size, id).toBe(1);
    }
    // The sheets and the courts stand across the layout, so each is as wide as the drawing is tall.
    expect(multiLayout({ preset: "curling-1x4" }).cells[0]).toMatchObject({ turn: true });
    expect(multiLayout({ preset: "tabletennis-4" }).cells[0]).toMatchObject({ turn: false });
  });

  it("have a layout of the caller's own", () => {
    const own: MultiSpec = { ...(multiPreset("badminton-1x4") as MultiSpec), id: "mine", rows: 2, columns: 2 };
    const layout = multiLayout({ layout: own });
    expect(layout.cells).toHaveLength(4);
    expect(drawMulti({ layout: own })).toContain('data-layout="mine"');
  });
});

describe("the presets", () => {
  it("each name a rule, sources that exist, an event only with its sources, and a basis that says what it is", () => {
    const ids = MULTI_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const spec of MULTI_PRESETS) {
      expect(spec.rule.en.length, spec.id).toBeGreaterThan(30);
      expect(spec.rule.ja, spec.id).toMatch(/[぀-ヿ一-鿿]/u);
      expect(spec.name.ja, spec.id).toMatch(/[぀-ヿ一-鿿]/u);
      expect(spec.sources.length, spec.id).toBeGreaterThan(0);
      for (const id of spec.sources) expect(multiSource(id), `${spec.id} ${id}`).toBeDefined();
      if (spec.event !== undefined) {
        expect(spec.event.sources.length, spec.id).toBeGreaterThan(0);
        for (const id of spec.event.sources) expect(multiSource(id), `${spec.id} ${id}`).toBeDefined();
        if (spec.event.floor !== undefined) expect(multiVenueById(spec.event.floor), spec.id).toBeDefined();
        expect(spec.event.note.ja, spec.id).toMatch(/[぀-ヿ一-鿿]/u);
      }
    }
  });

  it("are the real configurations asked for: table tennis 4 and 8, pickleball 2 x 2, 2 x 4 and larger, curling 1 x 4, judo 1 x 3 and 1 x 4, badminton, karate, tennis", () => {
    const ids = new Set(MULTI_PRESETS.map((p) => p.id));
    for (const id of ["tabletennis-4", "tabletennis-8", "pickleball-2x2", "pickleball-2x4", "pickleball-4x4", "curling-1x4", "judo-1x3", "judo-1x4", "badminton-1x4", "karate-2x3", "karate-2x4", "tennis-1x3"]) expect(ids.has(id), id).toBe(true);
    // Table tennis in London: one floor, one scoreboard for all four, barriers and an umpire's chair at each.
    const london = multiPreset("tabletennis-4") as MultiSpec;
    expect(london.parts).toMatchObject({ barriers: true, officials: true, scoreboard: "shared" });
    expect(london.event).toMatchObject({ year: 2026, venue: "OVO Arena Wembley", city: "London" });
    // Judo prints its branding on the mats themselves.
    expect(multiPreset("judo-1x3")?.parts.brand).toBe("mat");
    expect(multiPreset("karate-2x3")?.parts.brand).toBe("mat");
  });

  it("carry no real brand, sponsor or event name in what they draw: the places are empty", () => {
    const BRANDS = /(ACN|Tibhar|Butterfly|DHS|Liebherr|Li-?Ning|Tata|OVO|Heineken|Yonex|Victor|Joola|Selkirk|Nike|Adidas|Panasonic|Mizuno|Park24|Judo ?TV|Omega|Visa|Coca|Samsung|Toyota|Wimbledon|PPA|Hamburg|Baku|Tokyo)/;
    for (const spec of MULTI_PRESETS) {
      const svg = drawMulti({ preset: spec.id });
      // The page's text: titles, descriptions and the words of the empty places and labels.
      const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
      for (const t of texts) expect(t, spec.id).not.toMatch(BRANDS);
      for (const slot of multiLayout({ preset: spec.id }).slots) expect(slot.id, spec.id).toMatch(/^(text|logo|board)/);
    }
    // The words of an empty place are the same wherever it is: it says what it is for, not what it holds.
    expect(MULTI_WORDS.en.slots).toEqual({ floorText: "Event name, year and city", floorLogo: "Logo", board: "Board" });
  });
});

describe("the halls and the fit", () => {
  it("have the floors their sources give: the Copper Box's 60 by 40 m, an NHL rink's 200 by 85 feet, the Budokan's octagon of 55 m", () => {
    expect(multiVenueById("copper-box-arena")).toMatchObject({ shape: "rectangle", length: 60, width: 40, unit: "m" });
    expect(multiVenueById("nhl-ice-pad")).toMatchObject({ length: 200, width: 85, unit: "ft" });
    expect(multiVenueById("iihf-ice-pad")).toMatchObject({ length: 60, width: 30, unit: "m" });
    expect(multiVenueById("nippon-budokan")).toMatchObject({ shape: "octagon", across: 55 });
    expect(multiVenueById("ovo-arena-wembley")).toMatchObject({ shape: "area", area: 2655 });
    for (const v of MULTI_VENUES) for (const id of v.sources) expect(multiSource(id), `${v.id} ${id}`).toBeDefined();
    expect(multiVenueById("none")).toBeUndefined();
  });

  it("say that four curling sheets fit an NHL ice pad, turned a quarter or not, and six do not", () => {
    const four = multiFit(multiLayout({ preset: "curling-1x4" }), "nhl-ice-pad");
    expect(four.fits).toBe(true);
    // The sheets stand across the layout, 19 m by 45.72 m, and the ice is 60.96 m by 25.91 m: they fit turned.
    expect(four.turned).toBe(true);
    expect(four.by).toBe("size");
    // 200 ft is 60.96 m and 85 ft is 25.91 m: 45.72 by 19 leaves 15.24 by 6.91.
    expect(four.spare).toMatchObject({ length: 15.24, width: 6.91 });
    expect(multiFit(multiLayout({ preset: "curling-1x4", columns: 5 }), "nhl-ice-pad").fits).toBe(true);
    const six = multiFit(multiLayout({ preset: "curling-1x4", columns: 6 }), "nhl-ice-pad");
    expect(six.fits).toBe(false);
    expect((six.spare as { width: number }).width).toBeLessThan(0);
    expect(fitSentence(six)).toMatch(/does not fit: it is short by 0 metres along and 2\.\d+ metres across, turned a quarter/);
  });

  it("turn a layout a quarter when that is the way it fits, and say so", () => {
    const tall = multiFit(multiLayout({ preset: "badminton-1x4" }), { length: 18, width: 40, unit: "m" });
    expect(tall.fits).toBe(true);
    expect(tall.turned).toBe(true);
    expect(fitSentence(tall)).toContain("turned a quarter");
    expect(fitSentence(tall, "ja")).toContain("90度");
    expect(multiFit(multiLayout({ preset: "badminton-1x4" }), { length: 40, width: 18, unit: "m" })).toMatchObject({ fits: true, turned: false });
    expect(multiFit(multiLayout({ preset: "tabletennis-4" }), { length: 80, width: 40, unit: "ft" }).fits).toBe(false);
  });

  it("compare an octagon by its corners and a floor of which only the area is known by that area, and say it may fit", () => {
    expect(multiFit(multiLayout({ preset: "judo-1x3" }), "nippon-budokan")).toMatchObject({ fits: true, by: "size" });
    expect(multiFit(multiLayout({ preset: "judo-1x4", rows: 3 }), "nippon-budokan").fits).toBe(false);
    const wembley = multiFit(multiLayout({ preset: "tabletennis-4" }), "ovo-arena-wembley");
    expect(wembley).toMatchObject({ fits: null, by: "area", floor: { area: 2655 } });
    expect(fitSentence(wembley)).toMatch(/may fit: it needs 392 of its 2,655 square metres/);
    const big = multiFit(multiLayout({ preset: "tabletennis-8", rows: 6, columns: 6 }), "ovo-arena-wembley");
    expect(big.fits).toBe(false);
    expect(fitSentence(big)).toMatch(/does not fit/);
    expect(() => multiFit(multiLayout({ preset: "tabletennis-4" }), "nowhere")).toThrow(/Unknown venue/);
    expect(() => multiFit(multiLayout({ preset: "tabletennis-4" }), { length: 0, width: 5 })).toThrow(RangeError);
    expect(() => multiFit(multiLayout({ preset: "tabletennis-4" }), undefined)).toThrow(TypeError);
  });

  it("agree between the check and the drawing: the picture's data-fit and its description say what the fit says", () => {
    for (const [id, venue] of [["curling-1x4", "nhl-ice-pad"], ["tabletennis-8", "copper-box-arena"], ["pickleball-4x4", "copper-box-arena"], ["judo-1x3", "nippon-budokan"], ["tabletennis-4", "ovo-arena-wembley"]] as const) {
      const { fit } = multiSetting({ preset: id, venue });
      const svg = drawMulti({ preset: id, venue });
      expect(svg, id).toContain(`data-fit="${fit?.fits === null ? "maybe" : String(fit?.fits)}"`);
      expect(svg, id).toContain(fitSentence(fit as NonNullable<typeof fit>).replace(/&/g, "&amp;"));
    }
    // 16 pickleball courts need 78 by 41.5 m: the Copper Box's 60 by 40 m does not hold them, and the drawing shows where it overhangs.
    expect(drawMulti({ preset: "pickleball-4x4", venue: "copper-box-arena" })).toContain('class="ky-mu-over"');
    expect(drawMulti({ preset: "tabletennis-8", venue: "copper-box-arena" })).not.toContain('class="ky-mu-over"');
  });
});

describe("a stadium round the layout", () => {
  it("is off unless asked for, and draws the walls, the stands and the crowd the package draws, to the same scale", () => {
    const plain = drawMulti({ preset: "curling-1x4", venue: "nhl-ice-pad" });
    const stadium = drawMulti({ preset: "curling-1x4", venue: "nhl-ice-pad", stadium: true });
    expect(plain).not.toContain("ky-crowd");
    expect(plain).not.toContain('class="ky-mu-wall"');
    expect(plain).toContain('class="ky-mu-hall"');
    expect(stadium).toContain('class="ky-crowd"');
    expect(stadium).toContain('class="ky-mu-wall"');
    expect(stadium).toContain('data-stadium="on"');
    // The same surfaces: a sheet is 150 by 15.58 feet in both, and the hall is 200 by 85.
    for (const svg of [plain, stadium]) {
      expect(svg).toContain('width="200"');
      expect(svg).toContain('height="85"');
    }
    // The stands are wider than the floor.
    const view = (svg: string): number[] => /viewBox="([^"]+)"/.exec(svg)?.[1].split(" ").map(Number) ?? [];
    expect(view(stadium)[2]).toBeGreaterThan(view(plain)[2] * 2);
  });

  it("is one the package already has: the stands are the crowd model's, and the surfaces are drawKyogijo's own markup", () => {
    const svg = drawMulti({ preset: "tabletennis-4", stadium: { density: 0 }, id: "t" });
    expect(svg).toContain("ky-cr-bed");
    const cell = drawKyogijo({ sport: "tabletennis", id: "t-s1", margin: 0, style: "none" });
    const body = cell.slice(cell.indexOf('<g class="ky-surface-group">'), cell.lastIndexOf("</svg>")).replace(/<rect class="ky-apron"[^>]*\/>/, "");
    expect(svg).toContain(body);
    expect(drawMulti({ preset: "tabletennis-4", stadium: { crowd: false } })).toContain("ky-cr-bed");
    // A stadium with no venue stands round the layout's own floor.
    expect(drawMulti({ preset: "tabletennis-4", stadium: true })).toContain('data-stadium="on"');
    // An octagon hall has an octagonal wall.
    expect(drawMulti({ preset: "judo-1x3", venue: "nippon-budokan", stadium: true })).toMatch(/class="ky-mu-wall" d="M/);
  });
});

describe("the drawing", () => {
  it("is a pure function of its options: the same string every time, with ids that are the caller's or a hash, and no id twice", () => {
    for (const spec of MULTI_PRESETS) {
      const a = drawMulti({ preset: spec.id });
      expect(drawMulti({ preset: spec.id }), spec.id).toBe(a);
      const ids = [...a.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size, spec.id).toBe(ids.length);
    }
    expect(drawMulti({ preset: "tabletennis-4", id: "mine" })).toContain('id="mine-t"');
    expect(drawMulti({ preset: "tabletennis-4" })).not.toBe(drawMulti({ preset: "tabletennis-8" }));
    const staged = drawMulti({ preset: "pickleball-2x2", stadium: true });
    const ids = [...staged.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is an accessible picture with a title and a description that says what it is, and a table that says the same", () => {
    const svg = drawMulti({ preset: "tabletennis-4", id: "a" });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="a-t a-d"');
    expect(svg).toContain("<title");
    expect(svg).toMatch(/<desc id="a-d">Drawn as: Table tennis, four areas \(2 x 2\), 4 playing surfaces to scale on one floor of 28 by 14 metres \(392 square metres\)\./);
    expect(svg).toContain("One scoreboard for all is hung over the middle of the floor.");
    expect(svg).toContain("not a measured plan");
    const table = multiTable({ preset: "tabletennis-4" });
    expect(table).toMatch(/^<table class="ky-table" data-kind="multi"><caption>/);
    expect(table).toContain("28 by 14 metres");
    for (let n = 1; n <= 4; n += 1) expect(table).toContain(`Table ${n}`);
    expect(table).toContain('scope="col"');
    expect(table).toContain("Empty place: Logo");
    expect(table).toContain("Table 1, first end");
    expect(table).toContain("Empty place: Board");
    expect(table).not.toMatch(/logo-1-start|board-top|floor-text|floor-logo/);
    expect((table.match(/<tr>/g) ?? []).length).toBeGreaterThan(4);
    expect(multiTable({ preset: "tabletennis-4", slots: false })).not.toContain("Empty place");
    const ja = multiTable({ preset: "tabletennis-4", language: "ja" });
    expect(ja).toContain("第1台");
    expect(ja).toContain("競技面");
  });

  it("follows light and dark: every colour is a custom property with a dark value, and a forced theme is on the root", () => {
    expect(KYOGIJO_MULTI_STYLE).toContain("prefers-color-scheme:dark");
    expect(KYOGIJO_MULTI_STYLE).toContain("html[data-theme=dark]");
    for (const look of ["blue", "green", "wood", "red", "ice"]) {
      expect(KYOGIJO_MULTI_STYLE).toContain(`[data-floor=${look}]`);
      expect(KYOGIJO_MULTI_STYLE).toContain(`--ky-mu-f-${look}`);
    }
    // No colour is written into a rule outside the property blocks: a rule draws only with var().
    const rules = KYOGIJO_MULTI_STYLE.split("\n").filter((l) => /^\.kyogijo \.ky-mu-/.test(l));
    for (const rule of rules) expect(rule, rule).not.toMatch(/(?:fill|stroke):#/);
    expect(drawMulti({ preset: "judo-1x3", theme: "dark" })).toContain('data-theme="dark"');
    expect(drawMulti({ preset: "judo-1x3" })).not.toMatch(/<svg[^>]* data-theme=/);
    expect(KYOGIJO_STYLE).not.toBe("");
    // The surfaces keep their own colours: the style of the sport's drawing is in the picture once.
    const svg = drawMulti({ preset: "tabletennis-8" });
    expect(svg.match(/<style>/g)).toHaveLength(1);
    expect(drawMulti({ preset: "tabletennis-8", style: "none" })).not.toContain("<style>");
    expect(svg).toContain('data-look="blue"');
  });

  it("is in Japanese when asked, with every word of the English", () => {
    expect(keys(MULTI_WORDS.ja)).toEqual(keys(MULTI_WORDS.en));
    for (const part of ["names", "parts", "slots", "say", "fit", "table"] as const) expect(keys(MULTI_WORDS.ja[part]), part).toEqual(keys(MULTI_WORDS.en[part]));
    const ja = drawMulti({ preset: "judo-1x3", language: "ja" });
    expect(ja).toContain("第1試合場");
    expect(ja).toContain("大会名・年・開催地");
    expect(ja).toContain("縮尺どおりに描いています");
    expect(drawMulti({ preset: "curling-1x4", venue: "nhl-ice-pad", language: "ja" })).toContain("収まります");
  });

  it("writes the events, halls and cities as Japanese writes them, and numbers with thousands separated", () => {
    const judo = drawMulti({ preset: "judo-1x3", language: "ja" });
    for (const name of ["世界柔道選手権", "バクー", "ナショナル・ジムナスティクス・アリーナ"]) expect(judo, name).toContain(name);
    expect(judo).not.toContain("Baku");
    const wembley = drawMulti({ preset: "tabletennis-4", language: "ja", venue: "ovo-arena-wembley" });
    for (const name of ["ロンドン", "OVOアリーナ・ウェンブリー", "世界卓球選手権団体戦ファイナルズ"]) expect(wembley, name).toContain(name);
    expect(drawMulti({ preset: "curling-1x4", language: "ja" })).toContain("北京");
    expect(drawMulti({ preset: "karate-2x3", language: "ja" })).toContain("クアラルンプール");
    // The English keeps the English names.
    expect(drawMulti({ preset: "judo-1x3" })).toContain("Baku");
    expect(multiNumber(3234.5)).toBe("3,234.5");
    expect(multiNumber(3234.5, "ja")).toBe("3,234.5");
    expect(multiNumber(392)).toBe("392");
    expect(needsSentence(multiLayout({ preset: "pickleball-4x4" }).needs)).toBe("78.03 by 41.45 metres (3,234.5 square metres)");
    expect(needsSentence(multiLayout({ preset: "pickleball-4x4" }).needs, "ja")).toBe("横78.03m×縦41.45m（3,234.5平方メートル）");
    expect(multiTable({ preset: "pickleball-4x4" })).toContain("3,234.5 square metres");
  });

  it("says what an empty place is in words, in both languages, and never prints an id", () => {
    for (const language of ["en", "ja"] as const) {
      for (const id of ["judo-1x3", "tabletennis-4", "badminton-1x4"]) {
        const table = multiTable({ preset: id, language });
        expect(table, `${id} ${language}`).not.toMatch(/\b(?:board|logo|text)-[\w-]+|floor-text|floor-logo|\(mat\)/);
      }
    }
    expect(multiTable({ preset: "judo-1x3", language: "ja" })).toContain("マット上");
    expect(multiTable({ preset: "judo-1x3" })).toContain("on the mats");
    expect(multiTable({ preset: "judo-1x3", language: "ja" })).toContain("試合場の間");
  });

  it("makes every value from outside safe: a hostile title, description, id and class cannot break the markup", () => {
    const hostile = '"><script>alert(1)</script>';
    const svg = drawMulti({ preset: "tabletennis-4", title: hostile, description: hostile, id: hostile, className: hostile });
    expect(svg).not.toContain("<script");
    expect(svg).not.toMatch(/<[^>]*alert\(1\)[^>]*>/);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(() => drawMulti({ preset: hostile })).toThrow(/Unknown preset/);
    expect(() => drawMulti({ preset: "tabletennis-4", venue: hostile })).toThrow(/Unknown venue/);
    expect(() => drawMulti({ preset: "tabletennis-4", rows: Number.NaN })).toThrow(RangeError);
  });

  it("draws the empty places dashed, with nothing printed in them but what they are for", () => {
    const svg = drawMulti({ preset: "judo-1x3" });
    expect(svg).toContain('class="ky-mu-slot"');
    expect(svg).toContain("Event name, year and city");
    const off = drawMulti({ preset: "judo-1x3", slots: false });
    expect(off).not.toContain('class="ky-mu-slot"');
    expect(off).not.toContain("Event name");
    expect(drawMulti({ preset: "judo-1x3", labels: false })).not.toContain("Area 1");
    // On a judo floor the places sit on the mats: inside the tatami, and the safety area of its areas.
    const layout = multiLayout({ preset: "judo-1x3" });
    const t = layout.tatami as { x: number; y: number; w: number; h: number };
    for (const slot of layout.slots.filter((s) => s.onMat)) {
      expect(slot.x, slot.id).toBeGreaterThanOrEqual(t.x - 1e-6);
      expect(slot.y, slot.id).toBeGreaterThanOrEqual(t.y - 1e-6);
      expect(slot.x + slot.w, slot.id).toBeLessThanOrEqual(t.x + t.w + 1e-6);
      expect(slot.y + slot.h, slot.id).toBeLessThanOrEqual(t.y + t.h + 1e-6);
      for (const cell of layout.cells) {
        const inside = slot.x < cell.x + cell.w && slot.x + slot.w > cell.x && slot.y < cell.y + cell.h && slot.y + slot.h > cell.y;
        expect(inside, `${slot.id} over ${cell.label}`).toBe(false);
      }
    }
    expect(layout.slots.filter((s) => s.onMat).length).toBeGreaterThan(5);
  });

  it("is held by a fingerprint of every preset, so a change to a figure shows", () => {
    const all = MULTI_PRESETS.map((p) => drawMulti({ preset: p.id })).join("\n");
    expect(all.length).toBeGreaterThan(100_000);
    expect(hash(all)).toMatchSnapshot();
  });
});

describe("the sources", () => {
  it("are named for every figure: a title, an edition, an address and the date read", () => {
    for (const s of Object.values(MULTI_SOURCES)) {
      expect(s.title.length, s.id).toBeGreaterThan(10);
      expect(s.url, s.id).toMatch(/^https:\/\//);
      expect(s.read, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Object.hasOwn(LEAGUE_SOURCES, s.id), s.id).toBe(false);
    }
  });
});
