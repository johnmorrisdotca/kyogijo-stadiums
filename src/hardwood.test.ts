import { describe, expect, it } from "vitest";
import { drawToCanvas, type CanvasContext } from "./canvas.ts";
import { drawKyogijo } from "./draw.ts";
import { generator, pixelWidth, resolveHardwood, TILE } from "./hardwood.ts";
import { BASKETBALL_LEAGUES, courtInFeet } from "./leagues/basketball.ts";
import { PNG_PEER_MISSING, toPNG } from "./png.ts";
import { sceneOf } from "./scene.ts";
import { parseSvg, writeSvg } from "./scene.xml.ts";
import { sceneToSvg } from "./scene.flat.ts";
import { GAME } from "./scene.fixture.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import type { SurfaceOptions } from "./types.ts";
import { parseXml, walk } from "./xml.fixture.ts";

const wood: SurfaceOptions = { sport: "nba", id: "hw", court: { hardwood: true } };
const count = (svg: string, tag: string): number => (svg.match(new RegExp(`<${tag}[\\s>/]`, "g")) ?? []).length;

describe("the options", () => {
  it("are off unless asked for, and then the drawing is the clean floor, byte for byte", () => {
    const clean = drawKyogijo({ sport: "nba", id: "hw" });
    expect(drawKyogijo({ sport: "nba", id: "hw", court: { hardwood: false } })).toBe(clean);
    expect(drawKyogijo({ sport: "nba", id: "hw", court: {} })).toBe(clean);
    expect(clean).not.toContain("-hw-");
    expect(clean).not.toContain("ky-hw");
    expect(resolveHardwood(undefined, false, undefined)).toBeUndefined();
    expect(resolveHardwood({ hardwood: false }, false, undefined)).toBeUndefined();
  });

  it("are read once: every part has its value, and a part out of range is held to it", () => {
    expect(resolveHardwood({ hardwood: true }, false, undefined)).toEqual({ seed: 1, fine: true, board: 2.25 / 12, stain: 0.82, sheen: 1, hoops: true, bench: true });
    const held = resolveHardwood({ hardwood: { board: 40, stain: 0, sheen: 9, seed: 3.9, hoops: false, bench: false } }, false, undefined);
    expect(held).toMatchObject({ seed: 3, board: 0.5, stain: 0.3, sheen: 1.5, hoops: false, bench: false });
    expect(resolveHardwood({ hardwood: { board: 0.1 } }, false, undefined)?.board).toBeCloseTo(1.5 / 12);
  });

  it("have a detail that follows the size: plain for `detail: simple` and a width under 480 pixels, fine otherwise, and what is asked for when it is asked for", () => {
    const fine = (court: SurfaceOptions["court"], simple = false, width?: unknown): boolean | undefined => resolveHardwood(court, simple, width)?.fine;
    expect(fine({ hardwood: true })).toBe(true);
    expect(fine({ hardwood: true }, true)).toBe(false);
    expect(fine({ hardwood: true }, false, 320)).toBe(false);
    expect(fine({ hardwood: true }, false, "479px")).toBe(false);
    expect(fine({ hardwood: true }, false, 480)).toBe(true);
    expect(fine({ hardwood: true }, false, "100%")).toBe(true);
    expect(fine({ hardwood: { detail: "fine" } }, true, 200)).toBe(true);
    expect(fine({ hardwood: { detail: "plain" } }, false, 2000)).toBe(false);
    expect(pixelWidth("320px")).toBe(320);
    expect(pixelWidth("20em")).toBeUndefined();
    expect(pixelWidth(-3)).toBeUndefined();
    // The bench is only in the fine detail.
    expect(resolveHardwood({ hardwood: { bench: true } }, true, undefined)?.bench).toBe(false);
  });
});

describe("the floor", () => {
  const svg = drawKyogijo(wood);

  it("is the same text every time, and a seed makes another floor", () => {
    expect(drawKyogijo(wood)).toBe(svg);
    const seeded = drawKyogijo({ ...wood, court: { hardwood: { seed: 2 } } });
    expect(seeded).not.toBe(svg);
    expect(drawKyogijo({ ...wood, court: { hardwood: { seed: 2 } } })).toBe(seeded);
    // The generator is the same numbers on every machine.
    expect(Array.from({ length: 3 }, generator(1))).toEqual(Array.from({ length: 3 }, generator(1)));
    expect(generator(1)()).not.toBe(generator(2)());
  });

  it("is two tiles of a pattern and a few shapes, however large the court is", () => {
    const patterns = [...svg.matchAll(/<pattern id="hw-hw-([ab])" width="(\d+)" height="([\d.]+)" patternUnits="userSpaceOnUse">/g)];
    expect(patterns.map((m) => m[1])).toEqual(["a", "b"]);
    for (const m of patterns) {
      expect(Number(m[2])).toBe(TILE);
      expect(Number(m[3])).toBeGreaterThan(3);
    }
    expect(count(svg, "rect") + count(svg, "path") + count(svg, "circle")).toBeLessThan(120);
    // The tile is longer than any court's length, so that the boards do not repeat along it.
    for (const league of BASKETBALL_LEAGUES) expect(courtInFeet(league.dimensions, league.unit).length).toBeLessThan(TILE);
  });

  it("holds its size: well under the budget, and the plain detail less than the fine", () => {
    const plain = drawKyogijo({ ...wood, court: { hardwood: { detail: "plain" } } });
    const clean = drawKyogijo({ sport: "nba", id: "hw" });
    expect(svg.length).toBeLessThan(32_000);
    expect(plain.length).toBeLessThan(18_000);
    expect(plain.length).toBeLessThan(svg.length);
    expect(svg.length - clean.length).toBeLessThan(21_000);
    expect(count(plain, "pattern")).toBe(1);
  });

  it("lays boards the width asked for, ends that never line up in neighbouring rows, and seams of its own", () => {
    const [, height] = /<pattern id="hw-hw-a" width="96" height="([\d.]+)"/.exec(svg) ?? [];
    expect(Number(height)).toBeCloseTo(6, 1);
    const wide = /<pattern id="hw-hw-a" width="96" height="([\d.]+)"/.exec(drawKyogijo({ ...wood, court: { hardwood: { board: 4.5 } } }))?.[1];
    expect(Number(wide)).toBeCloseTo(6, 0);
    // The ends are the seams' short verticals; two rows next to each other never end within a foot of one another.
    const seams = /<pattern id="hw-hw-b"[^>]*><path d="([^"]*)"/.exec(svg)?.[1] ?? "";
    const ends = [...seams.matchAll(/M([\d.]+) ([\d.]+)v/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    expect(ends.length).toBeGreaterThan(200);
    const rowOf = (y: number): number => Math.round(y / (2.25 / 12));
    const byRow = new Map<number, number[]>();
    for (const [x, y] of ends) byRow.set(rowOf(y), [...(byRow.get(rowOf(y)) ?? []), x]);
    let near = 0;
    for (const [row, xs] of byRow) for (const other of byRow.get(row + 1) ?? []) for (const x of xs) if (Math.abs(x - other) < 0.9) near += 1;
    expect(near).toBe(0);
  });

  it("is stained, not painted over: the keys, the circle and the border let the wood through", () => {
    const stained = svg.match(/<(?:rect|path|circle)[^>]*fill-opacity="0\.82"[^>]*>/g) ?? [];
    expect(stained.some((tag) => tag.includes("ky-key-left"))).toBe(true);
    expect(stained.some((tag) => tag.includes("ky-key-right"))).toBe(true);
    expect(stained.some((tag) => tag.includes("ky-centre"))).toBe(true);
    expect(stained.some((tag) => tag.includes("ky-hw-end-l"))).toBe(true);
    expect(stained.some((tag) => tag.includes("ky-hw-end-r"))).toBe(true);
    const lighter = drawKyogijo({ ...wood, court: { hardwood: { stain: 0.5 } } });
    expect(lighter).toContain('fill-opacity="0.5"');
    expect(lighter).not.toContain('fill-opacity="0.82"');
    // The seams are over the paint, the boards under it.
    expect(svg.indexOf('fill="url(#hw-hw-a)"')).toBeLessThan(svg.indexOf('class="ky-key ky-key-left"'));
    expect(svg.indexOf('class="ky-key ky-key-left"')).toBeLessThan(svg.indexOf('fill="url(#hw-hw-b)"'));
  });

  it("has a sheen over the paint and a soft edge, both gradients, and none when asked for none", () => {
    expect(count(svg, "linearGradient")).toBe(7);
    expect(svg.indexOf('class="ky-centre"')).toBeLessThan(svg.indexOf('fill="url(#hw-hw-s1)"'));
    const none = drawKyogijo({ ...wood, court: { hardwood: { sheen: 0 } } });
    expect(none).not.toContain("hw-s1");
    expect(count(drawKyogijo({ ...wood, court: { hardwood: { detail: "plain" } } }), "linearGradient")).toBe(2);
  });

  it("keeps the court's own figures: the lines, the keys and the three-point line are where the rulebook puts them", () => {
    const clean = drawKyogijo({ sport: "nba", id: "hw" });
    const svg = drawKyogijo({ ...wood, court: { hardwood: { bench: false } } });
    const paths = (markup: string, cls: string): string[] => [...markup.matchAll(new RegExp(`<path class="${cls}"[^>]* d="([^"]*)"`, "g"))].map((m) => m[1]);
    expect(paths(svg, "ky-line")).toEqual(paths(clean, "ky-line"));
    expect(svg).toContain('class="ky-key ky-key-left"');
  });
});

describe("the stain's colours", () => {
  it("are a team's colour behind its baseline, the court's own if it has one, else the border's", () => {
    const team = drawKyogijo({ ...wood, leftColor: "#1d4f91", rightColor: "#8a2432" });
    expect(team).toContain("--ky-hw-end-left:#1d4f91");
    expect(team).toContain("--ky-hw-end-right:#8a2432");
    const own = drawKyogijo({ ...wood, leftColor: "#1d4f91", court: { hardwood: true, baselineColor: ["#111111", "#222222"] } });
    expect(own).toContain("--ky-hw-end-left:#111111");
    expect(own).toContain("--ky-hw-end-right:#222222");
    expect(drawKyogijo({ ...wood, court: { hardwood: true, baselineColor: "#333333" } })).toContain("--ky-hw-end-right:#333333");
    // A colour that is not one is left out, and the border's shows.
    expect(drawKyogijo({ ...wood, court: { hardwood: true, baselineColor: "red;fill:url(x)" } })).not.toContain("--ky-hw-end-left:");
    expect(svg()).not.toContain("--ky-hw-end-left:");
    expect(svg()).toContain(".ky-hw-end-l{fill:var(--ky-hw-end-left,var(--ky-boards))}");
    expect(KYOGIJO_STYLE).toContain(".ky-hw-end-r{fill:var(--ky-hw-end-right,var(--ky-boards))}");
  });
  const svg = (): string => drawKyogijo(wood);

  it("follow the court's colours: the wood is the base of the boards and the border is the stain", () => {
    const styled = drawKyogijo({ ...wood, court: { hardwood: true, wood: "#c08a4a", border: "#13233f", key: "#1d4f91" } });
    expect(styled).toContain("--ky-surface:#c08a4a");
    expect(styled).toContain("--ky-boards:#13233f");
    expect(styled).toContain("--ky-key:#1d4f91");
  });
});

describe("the words and the logo", () => {
  it("set the baseline words in the border behind each baseline, centred and turned along it, with the sideline words along the sides", () => {
    const out = drawKyogijo({ ...wood, court: { hardwood: true, baselineText: ["North", "South"], sidelineText: ["Top", "Bottom"] } });
    const texts = [...out.matchAll(/<text class="ky-text ky-baseline"([^>]*)>([^<]*)<\/text>/g)].map((m) => [m[2], m[1]] as const);
    expect(texts.map(([t]) => t)).toEqual(["North", "South", "Top", "Bottom"]);
    for (const [, attrs] of texts) expect(attrs).toContain('text-anchor="middle"');
    expect(texts[0][1]).toContain("rotate(-90 -1.3");
    expect(texts[1][1]).toContain("rotate(90 95.3");
    expect(texts[2][1]).not.toContain("rotate");
    // One text is for both sides, and a clean court's words are where they always were.
    expect(drawKyogijo({ ...wood, court: { hardwood: true, sidelineText: "League" } }).match(/>League</g)?.length).toBe(2);
    expect(drawKyogijo({ sport: "nba", id: "hw", court: { baselineText: ["North", "South"] } })).toContain('x="-4"');
  });

  it("turn with the drawing: upright on the baselines and along the strips of a tall court", () => {
    const tall = drawKyogijo({ ...wood, orientation: "portrait", court: { hardwood: true, baselineText: ["North", "South"], sidelineText: ["Top", "Bottom"] } });
    const turns = [...tall.matchAll(/<text class="ky-text ky-baseline"([^>]*)>([^<]*)</g)].map((m) => [m[2], /rotate\((-?\d+)/.exec(m[1])?.[1]] as const);
    expect(turns).toEqual([["North", "-90"], ["South", "-90"], ["Top", undefined], ["Bottom", "180"]]);
  });

  it("put the caller's logo in the centre circle, larger than the clean floor's", () => {
    const logo = "https://example.com/logo.png";
    const size = (markup: string): number => Number(/<image href="[^"]*" x="[^"]*" y="[^"]*" width="([^"]*)"/.exec(markup)?.[1]);
    const real = drawKyogijo({ ...wood, court: { hardwood: true, centreLogo: logo } });
    const clean = drawKyogijo({ sport: "nba", id: "hw", court: { centreLogo: logo } });
    expect(size(real)).toBeGreaterThan(size(clean));
    expect(real).toContain(`href="${logo}"`);
    // An SVG document as text is a data address, as it is on the clean floor.
    expect(drawKyogijo({ ...wood, court: { hardwood: true, centreLogo: '<svg xmlns="http://www.w3.org/2000/svg"/>' } })).toContain('href="data:image/svg+xml');
  });
});

describe("the baskets from above", () => {
  it("have a stanchion, a board, a rim and soft shadows at each end, in layers that fade", () => {
    const svg = drawKyogijo(wood);
    expect(count(svg, "circle")).toBeGreaterThan(8);
    expect((svg.match(/class="ky-hw-pad"/g) ?? []).length).toBe(2);
    expect((svg.match(/class="ky-hw-glass"/g) ?? []).length).toBe(2);
    expect((svg.match(/class="ky-rim ?[^"]*"/g) ?? []).length).toBe(2);
    expect((svg.match(/class="ky-hw-shade"/g) ?? []).length).toBeGreaterThanOrEqual(6 + 2 * 2);
    const plain = drawKyogijo({ ...wood, court: { hardwood: { detail: "plain" } } });
    expect((plain.match(/class="ky-hw-shade"/g) ?? []).length).toBe(1 + 2);
  });

  it("stand where the court's figures put them, mirrored at the other end", () => {
    const svg = drawKyogijo(wood);
    // The NBA's backboard is 6 feet wide, 4 feet in from the baseline, and the rim is 5.25 feet in.
    expect(svg).toContain('<rect class="ky-hw-glass" x="3.81" y="22" width="0.38" height="6" rx="0.06"/>');
    expect(svg).toContain('<rect class="ky-hw-glass" x="89.81" y="22" width="0.38" height="6" rx="0.06"/>');
    expect(svg).toContain('cx="5.25" cy="25" r="0.75"');
    expect(svg).toContain('cx="88.75" cy="25" r="0.75"');
  });

  it("are the usual ones when the court says `hoops: false`, and follow `goals` when the caller chose another look", () => {
    expect(drawKyogijo({ ...wood, court: { hardwood: { hoops: false } } })).not.toContain('class="ky-hw-pad"');
    expect(drawKyogijo({ ...wood, court: { hardwood: { hoops: false } } })).toContain('<circle class="ky-rim" cx="5.25" cy="25" r="0.75" stroke-width="0.3" fill="none"/>');
    expect(drawKyogijo({ ...wood, goals: "none" })).not.toContain('class="ky-hw-pad"');
    expect(drawKyogijo({ ...wood, goalMarkup: () => "<g/>" })).not.toContain('class="ky-hw-pad"');
  });
});

describe("the bench side", () => {
  it("has the coaching box's lines, the table and the benches in the fine detail, and only when the ground is deep enough", () => {
    const svg = drawKyogijo(wood);
    expect(svg).toContain('class="ky-hw-furniture"');
    expect(drawKyogijo({ ...wood, court: { hardwood: { bench: false } } })).not.toContain('class="ky-hw-furniture"');
    expect(drawKyogijo({ ...wood, court: { hardwood: { detail: "plain" } } })).not.toContain('class="ky-hw-furniture"');
    expect(drawKyogijo({ ...wood, margin: 3 })).not.toContain('class="ky-hw-furniture"');
    // The lines run from the bottom sideline out across the border, at the 28-foot marks.
    expect(svg).toContain('d="M28 50V53.9M66 50V53.9"');
  });
});

describe("every league", () => {
  for (const league of BASKETBALL_LEAGUES) {
    it(`${league.id}: the court is drawn on a hardwood floor, wide and tall, in both modes`, () => {
      for (const o of [{}, { orientation: "portrait" as const }, { theme: "dark" as const }, { court: { hardwood: { detail: "plain" as const } } }]) {
        const out = drawKyogijo({ sport: "nba", id: "lg", league: league.id, ...o, court: { hardwood: true, ...("court" in o ? o.court : {}) } });
        expect(out).toContain("lg-hw-a");
        expect(out.startsWith("<svg")).toBe(true);
        expect(() => parseXml(out)).not.toThrow();
      }
    });
  }

  it("ids of two drawings in one page do not meet", () => {
    const a = drawKyogijo({ ...wood, id: "one" });
    const b = drawKyogijo({ ...wood, id: "two" });
    const ids = (svg: string): string[] => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
  });
});

describe("a score and the data on it", () => {
  it("keeps the teams' panels over the floor and the data layers over everything", () => {
    const out = drawKyogijo({ sport: "nba", ...GAME, court: { hardwood: true }, layers: [{ kind: "points", data: [{ x: 20, y: 25 }] }] } as SurfaceOptions);
    const at = (needle: string): number => out.indexOf(needle);
    expect(at("hw-a)")).toBeLessThan(at('<g class="ky-banner'));
    expect(at("hw-s1)")).toBeLessThan(at('<g class="ky-banner'));
    expect(at('class="ky-hw-shade"')).toBeLessThan(at('<g class="ky-layers"'));
    expect(at("hw-s1)")).toBeLessThan(at('<g class="ky-layers"'));
  });

  it("is crossed by a range, and set inside a host", () => {
    expect(drawKyogijo({ ...wood, range: "half-court" })).toContain("hw-hw-a");
    const hosted = drawKyogijo({ ...wood, host: { field: "nfl" } });
    expect(hosted).toContain("hw-hw-a");
  });
});

describe("every renderer", () => {
  it("reads in the scene: two patterns and the gradients, with every paint resolved, and the markup written back as it was", () => {
    const svg = drawKyogijo({ ...wood, baselineText: undefined } as SurfaceOptions);
    expect(writeSvg(parseSvg(svg))).toBe(svg);
    const scene = sceneOf(wood);
    expect(scene.patterns.map((p) => p.id)).toEqual(["hw-hw-a", "hw-hw-b"]);
    expect(scene.patterns[0].width).toBe(TILE);
    expect(scene.gradients.length).toBe(7);
    const paints = scene.items.flatMap((i) => [i.style.fill, i.style.stroke]).filter((p) => typeof p === "object");
    expect(paints.length).toBeGreaterThanOrEqual(9);
    for (const paint of paints) expect("gradient" in paint ? scene.gradients.some((g) => g.id === paint.gradient) : scene.patterns.some((p) => p.id === paint.pattern)).toBe(true);
  });

  it("makes an SVG that needs no stylesheet, for d3, Plot and PNG, with the patterns and gradients in it", () => {
    const flat = sceneToSvg(wood, { width: 800 });
    expect(flat).not.toContain("var(");
    expect(flat).not.toContain("<style");
    expect(count(flat, "pattern")).toBe(2);
    expect(count(flat, "linearGradient")).toBe(7);
    // Dark is worked out for the same drawing.
    expect(sceneToSvg(wood, { width: 800, theme: "dark" })).not.toBe(flat);
  });

  it("is painted by the canvas: a gradient for each of the sheen and the edge, and tiles for the boards", () => {
    const calls: string[] = [];
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (t, name: string) => (name in t ? t[name] : name === "createLinearGradient" ? () => (calls.push(name), { addColorStop() {} }) : (...args: unknown[]) => void (args.length >= 0 && calls.push(name))),
      set: (t, name: string, v) => ((t[name] = v), true),
    }) as unknown as CanvasContext;
    const box = drawToCanvas(ctx, wood, { width: 1200 });
    expect(box.width).toBeGreaterThan(0);
    expect(calls.filter((c) => c === "createLinearGradient").length).toBe(7);
    expect(calls.filter((c) => c === "stroke").length).toBeGreaterThan(20);
    expect(calls.filter((c) => c === "fill").length).toBeGreaterThan(20);
  });

  it("is a PNG when resvg is installed, light and dark, at a thumbnail and large", async () => {
    const png = await toPNG(wood, { width: 600 }).catch((error: Error) => error);
    if (png instanceof Error) {
      expect(png.message).toBe(PNG_PEER_MISSING);
      return;
    }
    expect([...png.slice(0, 4)]).toEqual([137, 80, 78, 71]);
    const dark = await toPNG({ ...wood, theme: "dark" }, { width: 600 });
    expect(Array.from(dark)).not.toEqual(Array.from(png));
    expect(Array.from(await toPNG(wood, { width: 600 }))).toEqual(Array.from(png));
    const small = await toPNG({ ...wood, width: 300 }, { width: 300 });
    expect(small.length).toBeLessThan(png.length);
  });
});

describe("the structure", () => {
  it("is what a hardwood floor is made of", () => {
    const counts: Record<string, number> = {};
    for (const node of walk(parseXml(drawKyogijo(wood)))) {
      const key = node.attrs.class === undefined ? node.name : `${node.name}.${node.attrs.class.split(" ").sort().join(".")}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    expect(counts["rect.ky-hw"]).toBe(9);
    expect(counts["pattern"]).toBe(2);
    expect(counts["path.ky-hw-furniture"]).toBe(1);
    expect(counts["rect.ky-surface"]).toBe(1);
  });
});
