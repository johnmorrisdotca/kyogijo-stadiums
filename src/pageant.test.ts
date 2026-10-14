import { describe, expect, it } from "vitest";
import { nation, FLAGS } from "../demo/road-data.js";
import { drawToCanvas, type CanvasContext } from "./canvas.ts";
import { SPORTS, describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { sceneToGeoJSON } from "./geojson.ts";
import { PAGEANT_BORDER, PAGEANT_RATIO, pageantOf, ratioOf } from "./pageant.ts";
import { KYOGIJO_PAGEANT_MOTION, KYOGIJO_PAGEANT_STYLE } from "./pageant.style.ts";
import { sceneOf } from "./scene.ts";
import { sceneToSvg } from "./scene.flat.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import type { PageantOptions, ScoreOptions, Sport } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const away = { ...nation("aurelia"), score: 1 };
const home = { ...nation("calvara"), score: 2 };
/** A made-up emblem, drawn in code: a navy disc with a gold star. */
const CUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#14233f"/><path d="M50 15L58 40H85L63 56L71 82L50 66L29 82L37 56L15 40H42Z" fill="#f2c230"/></svg>`;
const game = (extra: Partial<ScoreOptions> = {}): ScoreOptions => ({ sport: "soccer", home, away, status: "final", id: "p", ...extra });
const parse = (svg: string): Node => parseXml(svg);
const carpets = (svg: string): Node[] => withClass(parse(svg), "ky-pg-carpet");
const stages = (svg: string): Node[] => withClass(parse(svg), "ky-pg-stage");
const rectOf = (group: Node): Node => walk(group).find((n) => (n.attrs.class ?? "").split(/\s+/).includes("ky-pg-border")) as Node;

describe("a drawing without a pageant", () => {
  it("is the same text as before: the option unset, false or null, a bare surface, a badge and a special game have no trace of it", () => {
    const plain = drawKyogijo(game());
    expect(drawKyogijo(game({ pageant: false }))).toBe(plain);
    expect(drawKyogijo(game({ pageant: undefined }))).toBe(plain);
    expect(plain).not.toMatch(/ky-pg|pageant/);
    // A pageant needs a score: a bare surface is drawn as it was, and so is a badge.
    const bare = drawKyogijo({ sport: "soccer", id: "p", pageant: "carpet" });
    expect(bare).toBe(drawKyogijo({ sport: "soccer", id: "p" }));
    expect(drawKyogijo(game({ size: "badge", pageant: "stage" }))).toBe(drawKyogijo(game({ size: "badge" })));
  });

  it("draws the same string for the same options, and a different one for each choice", () => {
    const a = drawKyogijo(game({ pageant: { emblem: CUP, animate: "unfurl" } }));
    expect(drawKyogijo(game({ pageant: { emblem: CUP, animate: "unfurl" } }))).toBe(a);
    const seen = new Set([a, drawKyogijo(game({ pageant: true })), drawKyogijo(game({ pageant: "stage" })), drawKyogijo(game({ pageant: { border: "team" } })), drawKyogijo(game({ pageant: { fabric: false } }))]);
    expect(seen.size).toBe(5);
  });
});

describe("what the options ask for", () => {
  const resolve = (pageant: ScoreOptions["pageant"], extra: Partial<ScoreOptions> = {}) => pageantOf({ ...game({ pageant }), ...extra });

  it("takes a word, `true` or the options, and gives every choice a default", () => {
    expect(resolve(true)).toMatchObject({ style: "carpet", border: "dark", borderWidth: PAGEANT_BORDER.usual, fabric: true, lines: "over", ring: "gold", scale: 1, animate: "none", names: undefined });
    expect(resolve("stage")?.style).toBe("stage");
    expect(resolve("carpet")?.style).toBe("carpet");
    expect(resolve({ style: "stage", ring: "team", border: "team", lines: "through", fabric: false, animate: "fade", names: true })).toMatchObject({ style: "stage", ring: "team", border: "team", lines: "through", fabric: false, animate: "fade", names: true });
    expect(resolve(undefined)).toBeUndefined();
    expect(resolve(false)).toBeUndefined();
  });

  it("holds a wrong value to the default and a number to its range", () => {
    const odd = resolve({ style: "sideways", lines: "behind", animate: "spin", score: "left", emblemShape: "square", borderWidth: 9, scale: 0 } as unknown as PageantOptions);
    expect(odd).toMatchObject({ style: "carpet", lines: "over", animate: "none", score: "auto", borderWidth: PAGEANT_BORDER.max, scale: 0.4 });
    expect(resolve({ borderWidth: -1 })?.borderWidth).toBe(PAGEANT_BORDER.min);
    expect(resolve({ borderWidth: Number.NaN })?.borderWidth).toBe(PAGEANT_BORDER.usual);
    expect(resolve("sideways" as never)?.style).toBe("carpet");
  });

  it("lets only a safe colour and a safe picture through", () => {
    expect(resolve({ border: "red;fill:url(x)", ring: "#c9a24a" })).toMatchObject({ border: "dark", ring: "#c9a24a" });
    expect(resolve({ emblem: "javascript:alert(1)" })?.emblem).toBeUndefined();
    expect(resolve({ emblem: CUP })?.emblem?.href).toMatch(/^data:image\/svg\+xml/);
    const svg = drawKyogijo(game({ pageant: { border: '"><script>', ring: "x;y", emblem: 'https://e.test/a"onload="x', emblemName: "<b>Cup</b>" } }));
    expect(svg).not.toMatch(/<script|onload=/);
    expect(() => parse(svg)).not.toThrow();
  });

  it("sends the score to the strip when there is an emblem or the sport's board is large, and says so when asked", () => {
    expect(resolve({ emblem: CUP })?.score).toBe("strip");
    expect(resolve({}, { sport: "tennis" })?.score).toBe("strip");
    expect(resolve({}, { sport: "cricket" })?.score).toBe("strip");
    expect(resolve({})?.score).toBe("auto");
    expect(resolve({ emblem: CUP, score: "centre" })?.score).toBe("centre");
    expect(resolve({ score: "strip" })?.score).toBe("strip");
  });

  it("is none for a score of the badge size, a special game and a drawing with no teams", () => {
    expect(resolve("carpet", { size: "badge" })).toBeUndefined();
    expect(resolve("carpet", { host: { sport: "mlb" } } as never)).toBeUndefined();
    expect(pageantOf({ sport: "nhl", pageant: "carpet" })).toBeUndefined();
  });
});

describe("a carpet's ratio", () => {
  it("is the team's own, else its SVG logo's viewBox, width and height or data address, else 3 to 2, held between 1 and 3", () => {
    expect(ratioOf({ logo: FLAGS.bands("#000", "#fff") })).toBe(1.5);
    expect(ratioOf({ logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect/></svg>' })).toBe(2);
    expect(ratioOf({ logo: '<svg width="40" height="40"><rect/></svg>' })).toBe(1);
    expect(ratioOf({ logo: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg viewBox="0 0 90 30"/>')}` })).toBe(3);
    expect(ratioOf({ logo: `data:image/svg+xml;base64,${btoa('<svg viewBox="0 0 80 40"/>')}` })).toBe(2);
    expect(ratioOf({ logo: "https://example.com/flag.png" })).toBe(PAGEANT_RATIO.usual);
    expect(ratioOf({})).toBe(PAGEANT_RATIO.usual);
    expect(ratioOf({ logo: '<svg viewBox="0 0 300 20"/>' })).toBe(PAGEANT_RATIO.max);
    expect(ratioOf({ logo: '<svg viewBox="0 0 10 20"/>' })).toBe(PAGEANT_RATIO.min);
    expect(ratioOf({ logo: FLAGS.bands("#000"), logoRatio: 2 })).toBe(2);
    expect(ratioOf({ logoRatio: 9 })).toBe(PAGEANT_RATIO.max);
    expect(ratioOf({ logoRatio: -3 })).toBe(PAGEANT_RATIO.usual);
  });

  it("is the shape of the carpet drawn", () => {
    for (const logoRatio of [1, 1.5, 2, 3]) {
      const svg = drawKyogijo(game({ pageant: "carpet", home: { ...home, logoRatio }, away: { ...away, logoRatio } }));
      for (const group of carpets(svg)) {
        const r = rectOf(group).attrs;
        expect(Number(r.width) / Number(r.height)).toBeCloseTo(logoRatio, 1);
      }
    }
  });
});

describe("a carpet on each half of every surface", () => {
  const FULL = SPORTS.filter((sport) => sport !== "mlb" && sport !== "curling");

  it("is two carpets for each team's flag, each with a border, at the flag's own ratio, upright, wide and tall", () => {
    for (const sport of SPORTS) {
      for (const orientation of ["landscape", "portrait"] as const) {
        const svg = drawKyogijo(game({ sport, orientation, pageant: "carpet", id: "c" }));
        expect(carpets(svg).length, `${sport} ${orientation}`).toBe(2);
        expect(parse(svg).attrs["data-pageant"]).toBe("carpet");
        const scene = sceneOf(svg);
        const pictures = scene.items.filter((i) => i.kind === "image" && i.class.includes("ky-pg-picture"));
        expect(pictures.length).toBe(2);
        for (const picture of pictures) {
          // Upright for the reader: the item's frame has no turn in it, even in a drawing that lies tall.
          const [a, b, c, d] = picture.matrix;
          expect([a, b, c, d].map((v) => Math.abs(Math.round(v * 1000) / 1000)), `${sport} ${orientation}`).toEqual([1, 0, 0, 1]);
          const shape = picture as unknown as { width: number; height: number };
          expect(shape.width / shape.height).toBeGreaterThan(1.3);
        }
      }
    }
  });

  it("lies inside the surface, between the ends and the middle, and the two do not touch", () => {
    for (const sport of FULL) {
      const scene = sceneOf(game({ sport, pageant: { score: "strip" }, id: "c" }));
      const rects = scene.items.filter((i) => i.kind === "rect" && i.class.includes("ky-pg-border"));
      expect(rects.length).toBe(2);
      const boxes = rects.map((r) => {
        const [, , , , e, f] = r.matrix;
        const q = r as { x: number; y: number; width: number; height: number };
        return { x0: e + q.x, x1: e + q.x + q.width, y0: f + q.y, y1: f + q.y + q.height };
      });
      const [left, right] = boxes.sort((a, b) => a.x0 - b.x0);
      expect(left.x1, sport).toBeLessThan(right.x0);
      const view = scene.viewBox;
      for (const box of boxes) {
        expect(box.x0, sport).toBeGreaterThanOrEqual(view.x);
        expect(box.x1, sport).toBeLessThanOrEqual(view.x + view.w);
        expect(box.y0, sport).toBeGreaterThanOrEqual(view.y);
        expect(box.y1, sport).toBeLessThanOrEqual(view.y + view.h);
      }
    }
  });

  it("keeps clear of a rink's rounded corners and of a ballpark's fence", () => {
    // The corners of a carpet are inside the boards: the rink's own outline holds every corner.
    const scene = sceneOf(game({ sport: "nhl", pageant: "carpet", id: "c" }));
    const radius = 28;
    for (const item of scene.items.filter((i) => i.kind === "rect" && i.class.includes("ky-pg-border"))) {
      const q = item as { x: number; y: number; width: number; height: number; matrix: readonly number[] };
      for (const [px, py] of [[q.x, q.y], [q.x + q.width, q.y], [q.x, q.y + q.height], [q.x + q.width, q.y + q.height]]) {
        const x = q.matrix[4] + px;
        const y = q.matrix[5] + py;
        const cx = x < radius ? radius : x > 200 - radius ? 200 - radius : x;
        const cy = y < radius ? radius : y > 85 - radius ? 85 - radius : y;
        expect((x - cx) ** 2 + (y - cy) ** 2).toBeLessThanOrEqual(radius * radius);
      }
    }
  });

  it("puts a diamond's home team on the infield and the visitors in the outfield, whichever side each is on", () => {
    for (const homeSide of ["left", "right"] as const) {
      const svg = drawKyogijo(game({ sport: "mlb", homeSide, pageant: "carpet" }));
      const groups = carpets(svg);
      expect(groups.length).toBe(2);
      const byRole = Object.fromEntries(groups.map((g) => [g.attrs["data-team"], g]));
      const y = (g: Node): number => Number(/translate\([\d.-]+ ([\d.-]+)\)/.exec(g.attrs.transform)?.[1]);
      // Home plate is at 0 and the outfield is further up the page (more negative).
      expect(y(byRole.home)).toBeGreaterThan(y(byRole.away));
      expect(Number(rectOf(byRole.away).attrs.width)).toBeGreaterThan(Number(rectOf(byRole.home).attrs.width));
    }
  });

  it("puts a picture in each house of a curling sheet", () => {
    const svg = drawKyogijo(game({ sport: "curling", pageant: "carpet" }));
    const groups = carpets(svg);
    expect(groups.length).toBe(2);
    const xs = groups.map((g) => Number(/translate\(([\d.-]+) /.exec(g.attrs.transform)?.[1]));
    // The houses are at the two tees, 12 feet either side of the middle of a 146-foot sheet's ends' lines.
    expect(Math.abs(xs[0] - xs[1])).toBeGreaterThan(80);
  });

  it("keeps clear of a cricket pitch", () => {
    const scene = sceneOf(game({ sport: "cricket", pageant: "carpet", id: "c" }));
    const rects = scene.items.filter((i) => i.kind === "rect" && i.class.includes("ky-pg-border")) as unknown as { x: number; width: number; matrix: number[] }[];
    const edges = rects.map((r) => [r.matrix[4] + r.x, r.matrix[4] + r.x + r.width]).sort((a, b) => a[0] - b[0]);
    expect(edges[1][0] - edges[0][1]).toBeGreaterThan(40);
  });
});

describe("a stage", () => {
  it("is a round disc with a ring for each team: gold by default, the team's colour or a colour of the caller's", () => {
    const gold = drawKyogijo(game({ pageant: "stage" }));
    expect(stages(gold).length).toBe(2);
    expect(withClass(parse(gold), "ky-pg-ringband").map((n) => n.attrs.fill)).toEqual(["url(#p-pg-left-g)", "url(#p-pg-right-g)"]);
    expect(gold).toContain("linearGradient");
    const team = withClass(parse(drawKyogijo(game({ pageant: { style: "stage", ring: "team" } }))), "ky-pg-ringband").map((n) => n.attrs.fill);
    expect(team.sort()).toEqual([home.color, away.color].sort());
    expect(withClass(parse(drawKyogijo(game({ pageant: { style: "stage", ring: "#336699" } }))), "ky-pg-ringband").map((n) => n.attrs.fill)).toEqual(["#336699", "#336699"]);
  });

  it("holds the crest in a round mark and writes the mark's rules in, so the stage works with round marks", () => {
    const svg = drawKyogijo(game({ pageant: "stage", markShape: "round", size: "compact" }));
    expect(withClass(parse(svg), "ky-mark").length).toBeGreaterThanOrEqual(4);
    expect(svg).toContain(".ky-mark-bg");
    // A crest shown whole on a plain disc.
    const crest = drawKyogijo(game({ pageant: "stage", home: { ...home, markFit: "contain" } }));
    expect(crest).toContain("ky-mark-light");
  });

  it("is a circle that is wholly inside the surface and as large as the room, upright in a tall drawing", () => {
    for (const orientation of ["landscape", "portrait"] as const) {
      const scene = sceneOf(game({ sport: "nba", orientation, pageant: { style: "stage", score: "strip" }, id: "s" }));
      const rings = scene.items.filter((i) => i.kind === "circle" && i.class.includes("ky-pg-ringband")) as unknown as { r: number; matrix: number[] }[];
      expect(rings.length).toBe(2);
      for (const ring of rings) expect(ring.matrix.slice(0, 4).map((v) => Math.abs(Math.round(v)))).toEqual([1, 0, 0, 1]);
      expect(rings[0].r).toBeGreaterThan(8);
    }
  });
});

describe("the emblem", () => {
  it("is a disc with a ring in the centre circle, and the score goes to the strip", () => {
    const svg = drawKyogijo(game({ pageant: { emblem: CUP, emblemName: "Northern Cup" } }));
    const doc = parse(svg);
    expect(withClass(doc, "ky-pg-emblem").length).toBe(1);
    expect(parse(svg).attrs["data-size"]).toBe("compact");
    expect(withClass(doc, "ky-plate").length).toBe(0);
    expect(withClass(doc, "ky-strip").length).toBe(1);
    expect(walk(withClass(doc, "ky-pg-emblem")[0]).some((n) => n.name === "title" && n.text === "Northern Cup")).toBe(true);
    // In the centre circle: the middle of the pitch.
    const [x, y] = /translate\(([\d.-]+) ([\d.-]+)\)/.exec(withClass(doc, "ky-pg-emblem")[0].attrs.transform)?.slice(1).map(Number) ?? [];
    expect(Math.abs(x - 172.2)).toBeLessThan(1);
    expect(Math.abs(y - 111.5)).toBeLessThan(1);
  });

  it("is the picture as it is, with a shadow, for a trophy with a cut-out outline", () => {
    const svg = drawKyogijo(game({ pageant: { emblem: CUP, emblemShape: "plain" } }));
    expect(withClass(parse(svg), "ky-pg-emblem-image").length).toBe(1);
    expect(withClass(parse(svg), "ky-pg-light").length).toBe(0);
  });

  it("is in the centre of ice, a court, a field and a sheet, wide and tall", () => {
    for (const sport of ["nhl", "nba", "nfl", "tennis", "rugby", "mlb"] as Sport[]) {
      for (const orientation of ["landscape", "portrait"] as const) {
        const svg = drawKyogijo(game({ sport, orientation, pageant: { emblem: CUP } }));
        expect(withClass(parse(svg), "ky-pg-emblem").length, `${sport} ${orientation}`).toBe(1);
      }
    }
    expect(withClass(parse(drawKyogijo(game({ sport: "curling", orientation: "landscape", pageant: { emblem: CUP } }))), "ky-pg-emblem").length).toBe(1);
  });

  it("is left out of a tall curling sheet, whose board stays in the middle", () => {
    const svg = drawKyogijo(game({ sport: "curling", pageant: { emblem: CUP } }));
    expect(withClass(parse(svg), "ky-pg-emblem").length).toBe(0);
    expect(parse(svg).attrs["data-size"]).toBe("full");
    expect(carpets(svg).length).toBe(2);
  });
});

describe("the score", () => {
  it("stays in the middle, a little smaller, when asked, and the pictures keep clear of it", () => {
    const plain = sceneOf(game({ sport: "nhl", id: "q" }));
    const kept = sceneOf(game({ sport: "nhl", pageant: { score: "centre" }, id: "q" }));
    const width = (scene: ReturnType<typeof sceneOf>): number => (scene.items.find((i) => i.kind === "rect" && i.class.includes("ky-plate-bg")) as unknown as { width: number }).width;
    expect(width(kept)).toBeLessThan(width(plain));
    expect(width(kept)).toBeGreaterThan(width(plain) * 0.8);
    expect(parse(drawKyogijo(game({ sport: "nhl", pageant: { score: "centre" } }))).attrs["data-size"]).toBe("full");
    // The panel's backing is there, so the score is legible over whatever lies under it.
    expect(withClass(parse(drawKyogijo(game({ pageant: { score: "centre" } }))), "ky-plate-bg").length).toBe(1);
  });

  it("goes to the strip by `auto` where the plate would cost the pictures their size, and stays by `auto` where it would not", () => {
    const size = (sport: Sport, orientation: "landscape" | "portrait"): string => parse(drawKyogijo(game({ sport, orientation, pageant: true }))).attrs["data-size"];
    expect(size("nfl", "landscape")).toBe("compact");
    expect(size("nba", "landscape")).toBe("compact");
    expect(size("nhl", "landscape")).toBe("full");
    expect(size("soccer", "portrait")).toBe("full");
    expect(size("tennis", "landscape")).toBe("compact");
  });

  it("is the compact strip, with each team's mark in it, when `score` is `strip`, and a compact card keeps its carpets", () => {
    const svg = drawKyogijo(game({ pageant: { score: "strip" }, markShape: "round" }));
    expect(parse(svg).attrs["data-size"]).toBe("compact");
    expect(withClass(parse(svg), "ky-strip").length).toBe(1);
    expect(carpets(drawKyogijo(game({ size: "compact", pageant: "carpet" }))).length).toBe(2);
    expect(withClass(parse(svg), "ky-mark").length).toBe(2);
  });

  it("is in the description, with the carpets and the emblem", () => {
    const text = describeDrawing(game({ pageant: { emblem: CUP, emblemName: "Northern Cup" } })).description;
    expect(text).toMatch(/laid out large over its own part of the surface, as a carpet\. The Northern Cup emblem is in the middle\.$/);
    expect(describeDrawing(game({ pageant: "stage" })).description).toMatch(/round stage/);
    expect(describeDrawing(game({ pageant: { emblem: CUP } })).description).toMatch(/An emblem is in the middle\.$/);
    expect(describeDrawing(game({ pageant: "carpet", language: "ja" })).description).toMatch(/カーペット/);
    expect(describeDrawing(game()).description).not.toMatch(/carpet/);
    expect(drawKyogijo(game({ pageant: "carpet" }))).toContain("as a carpet");
  });
});

describe("a team with no flag or logo", () => {
  const bare = { name: "Harbour City Gulls", abbr: "HCG", color: "#1f5fa8", textColor: "#fff", score: 3 };

  it("is its colours as a carpet of two with its name across a band", () => {
    const svg = drawKyogijo(game({ away: bare, pageant: "carpet" }));
    const doc = parse(svg);
    const group = carpets(svg).find((g) => g.attrs["data-team"] === "away") as Node;
    expect(walk(group).some((n) => (n.attrs.class ?? "").includes("ky-pg-ground"))).toBe(true);
    expect(walk(group).some((n) => (n.attrs.class ?? "").includes("ky-pg-band"))).toBe(true);
    // The name is written over the surface's lines, in a group of its own.
    const words = withClass(doc, "ky-pg-words").find((g) => g.attrs["data-team"] === "away") as Node;
    expect(walk(words).filter((n) => n.name === "text").map((n) => n.text).join("")).toMatch(/HARBOUR|HCG/);
    expect(withClass(doc, "ky-pg-ground")[0].attrs.style).toContain("--c:#1f5fa8");
    expect(walk(group).some((n) => n.name === "image")).toBe(false);
  });

  it("is a disc of its colour with its letters on a stage", () => {
    const svg = drawKyogijo(game({ away: bare, pageant: "stage" }));
    expect(svg).toContain("ky-mark-i");
  });

  it("has no name when `names` is false, and a flag has a name pill when `names` is true", () => {
    expect(walk(parse(drawKyogijo(game({ away: bare, pageant: { names: false } })))).filter((n) => (n.attrs.class ?? "").includes("ky-pg-name"))).toEqual([]);
    expect(withClass(parse(drawKyogijo(game({ pageant: "carpet" }))), "ky-pg-pill").length).toBe(0);
    expect(withClass(parse(drawKyogijo(game({ pageant: { names: true } }))), "ky-pg-pill").length).toBe(2);
  });

  it("works with no colour either", () => {
    const svg = drawKyogijo(game({ away: { name: "Nobody", score: 0 }, home: { name: "Somebody", score: 1 }, pageant: "carpet" }));
    expect(() => parse(svg)).not.toThrow();
    expect(carpets(svg).length).toBe(2);
  });
});

describe("the lines of the surface", () => {
  const order = (svg: string): { lines: number; carpet: number } => ({ lines: svg.indexOf('class="ky-line'), carpet: svg.indexOf("ky-pageant") });

  it("lie over the carpets by default, and under them with `under` and `through`, which also lets them show through", () => {
    const over = drawKyogijo(game({ pageant: { score: "strip" } }));
    expect(order(over).carpet).toBeLessThan(order(over).lines);
    const under = drawKyogijo(game({ pageant: { score: "strip", lines: "under" } }));
    expect(order(under).carpet).toBeGreaterThan(order(under).lines);
    expect(under).not.toContain('opacity=".9"');
    const through = drawKyogijo(game({ pageant: { score: "strip", lines: "through" } }));
    expect(order(through).carpet).toBeGreaterThan(order(through).lines);
    expect(withClass(parse(through), "ky-pageant")[0].attrs.opacity).toBe(".9");
  });
});

describe("the fabric and small sizes", () => {
  it("has two gradients of light and shade on each carpet, by default, and none when it is off", () => {
    const on = parse(drawKyogijo(game({ pageant: "carpet" })));
    expect(withClass(on, "ky-pg-fabric").length).toBe(4);
    expect(walk(on).filter((n) => n.name === "linearGradient").length).toBe(4);
    expect(withClass(parse(drawKyogijo(game({ pageant: { fabric: false } }))), "ky-pg-fabric").length).toBe(0);
  });

  it("leaves out the fabric, the hairlines and the pills at a small size or in simple detail", () => {
    for (const extra of [{ width: 200 }, { width: "240px" }, { detail: "simple" }] as const) {
      const doc = parse(drawKyogijo(game({ ...extra, pageant: { names: true } })));
      expect(withClass(doc, "ky-pg-fabric").length).toBe(0);
      expect(withClass(doc, "ky-pg-edge").length).toBe(0);
      expect(withClass(doc, "ky-pg-pill").length).toBe(0);
      expect(withClass(doc, "ky-pg-carpet").length).toBe(2);
    }
    expect(withClass(parse(drawKyogijo(game({ width: 800, pageant: "carpet" }))), "ky-pg-fabric").length).toBe(4);
  });
});

describe("the entrance", () => {
  it("is off by default: no animation in the drawing, and a reader who asks for less motion has none whatever is set", () => {
    expect(drawKyogijo(game({ pageant: "carpet" }))).not.toContain("@keyframes");
    const svg = drawKyogijo(game({ pageant: { animate: "unfurl", emblem: CUP } }));
    expect(svg).toContain("@keyframes ky-pg-unfurl-x");
    // Every animation is inside the media query for people who have not asked for less motion.
    expect(KYOGIJO_PAGEANT_MOTION.startsWith("@media (prefers-reduced-motion:no-preference){")).toBe(true);
    expect(KYOGIJO_PAGEANT_MOTION.replace(/^@media \(prefers-reduced-motion:no-preference\)\{/, "")).not.toMatch(/@media/);
    expect(KYOGIJO_PAGEANT_STYLE).not.toMatch(/animation|@keyframes/);
  });

  it("marks each picture with its entrance and its way of rolling out, wide and tall", () => {
    const wide = parse(drawKyogijo(game({ pageant: { animate: "unfurl", emblem: CUP } })));
    expect(withClass(wide, "ky-pg-unfurl").length).toBe(3);
    expect(withClass(wide, "ky-pg-tall").length).toBe(0);
    const tall = parse(drawKyogijo(game({ orientation: "portrait", pageant: { animate: "unfurl" } })));
    expect(withClass(tall, "ky-pg-tall").length).toBe(2);
    expect(withClass(parse(drawKyogijo(game({ pageant: { animate: "fade" } }))), "ky-pg-fade").length).toBe(2);
  });

  it("does not change what the renderers draw: a scene is the finished drawing", () => {
    const still = sceneOf(game({ pageant: "carpet", id: "a" }));
    const moving = sceneOf(game({ pageant: { animate: "unfurl" }, id: "a" }));
    const strip = (items: typeof still.items): unknown => items.map((i) => ({ ...i, class: i.class.replace(/ ky-pg-unfurl/g, "") }));
    expect(strip(moving.items)).toEqual(strip(still.items));
  });
});

describe("dark and light", () => {
  it("has the dark theme's own border, hairline and shadow, in the drawing's rules and in the page's", () => {
    for (const css of [drawKyogijo(game({ pageant: "carpet" })), KYOGIJO_STYLE]) {
      expect(css).toContain("--ky-pg-border:#050709");
      expect(css).toContain("prefers-color-scheme:dark");
      expect(css).toContain(".kyogijo .ky-pg-border{fill:var(--ky-pg-border,#14181a)}");
    }
    const border = (theme: "light" | "dark"): unknown => sceneOf(game({ pageant: "carpet", theme, id: "t" })).items.find((i) => i.class.includes("ky-pg-border"))?.style.fill;
    expect(border("light")).toBe("#14181a");
    expect(border("dark")).toBe("#050709");
  });

  it("takes a colour from the page's custom property, and a border from the options", () => {
    expect(withClass(parse(drawKyogijo(game({ pageant: { border: "#8a2d4b" } }))), "ky-pg-border")[0].attrs.style).toBe("fill:#8a2d4b");
    expect(withClass(parse(drawKyogijo(game({ pageant: { border: "team" } }))), "ky-pg-border").map((n) => n.attrs.style).sort()).toEqual([`fill:${home.color}`, `fill:${away.color}`].sort());
    expect(withClass(parse(drawKyogijo(game({ pageant: "carpet" }))), "ky-pg-border")[0].attrs.style).toBeUndefined();
  });

  it("is not in a drawing with `style: none`, which a page styles with KYOGIJO_STYLE", () => {
    const svg = drawKyogijo(game({ pageant: "carpet", style: "none" }));
    expect(svg).not.toContain("<style>");
    expect(KYOGIJO_STYLE).toContain(KYOGIJO_PAGEANT_STYLE);
    expect(KYOGIJO_STYLE).toContain(KYOGIJO_PAGEANT_MOTION);
  });
});

describe("a range", () => {
  it("shows the carpet in the part that is shown, and leaves out an emblem that is not in it", () => {
    const half = drawKyogijo(game({ sport: "soccer", range: { name: "half", end: "left" }, pageant: { score: "strip" } }));
    expect(carpets(half).length).toBe(2);
    expect(withClass(parse(drawKyogijo(game({ sport: "soccer", range: { name: "half", end: "left" }, pageant: { emblem: CUP } }))), "ky-pg-emblem").length).toBe(0);
    expect(withClass(parse(drawKyogijo(game({ sport: "soccer", range: "middle-third", pageant: { emblem: CUP } }))), "ky-pg-emblem").length).toBe(1);
    const box = drawKyogijo(game({ sport: "nhl", range: "offensive-zone", pageant: "carpet", id: "r" }));
    expect(parse(box).attrs["data-range"]).toBe("offensive-zone");
  });

  it("is cut with the surface when the annotations ask for room", () => {
    const svg = drawKyogijo(game({ sport: "nhl", range: "offensive-zone", landmarks: true, pageant: "carpet", id: "r" }));
    expect(svg).toMatch(/clip-path="url\(#r-rg\)"/);
    expect(() => parse(svg)).not.toThrow();
  });
});

describe("the renderers", () => {
  const options = game({ sport: "nhl", pageant: { emblem: CUP, animate: "unfurl" }, id: "r" });

  it("draw every picture on a canvas: each image once, each save restored", () => {
    const scene = sceneOf(options);
    const calls: string[] = [];
    const state: Record<string, unknown> = { filter: "none", letterSpacing: "0px" };
    const names = ["save", "restore", "setTransform", "beginPath", "moveTo", "lineTo", "bezierCurveTo", "quadraticCurveTo", "closePath", "fill", "stroke", "clip", "fillText", "strokeText", "fillRect", "clearRect", "setLineDash", "drawImage"];
    const ctx = new Proxy(state, {
      get: (target, name: string) => (name === "createLinearGradient" ? () => ({ addColorStop: () => undefined }) : names.includes(name) ? (...args: unknown[]) => void calls.push(name + (args.length === 0 ? "" : "")) : target[name]),
      set: (target, name: string, value) => ((target[name] = value), true),
    }) as unknown as CanvasContext;
    drawToCanvas(ctx, scene, { width: 800, images: () => ({ width: 30, height: 20 }) });
    expect(calls.filter((c) => c === "save").length).toBe(calls.filter((c) => c === "restore").length);
    expect(calls.filter((c) => c === "drawImage").length).toBe(scene.items.filter((i) => i.kind === "image").length);
  });

  it("make a scene without a stylesheet (the PNG's source) that still has the carpets' gradients and clips", () => {
    const flat = sceneToSvg(options);
    expect(flat).not.toContain("<style");
    expect(flat).toContain("linearGradient");
    expect(flat).toContain("ky-pg-picture");
  });

  it("leave the pictures out of GeoJSON, which is of the surface", () => {
    const withPageant = sceneToGeoJSON(options);
    const without = sceneToGeoJSON({ ...options, pageant: undefined });
    expect(withPageant.features.length).toBeLessThanOrEqual(without.features.length + 3);
    expect(withPageant.features.some((f) => String(f.properties.class).includes("ky-pg"))).toBe(false);
    expect(withPageant.features.some((f) => String(f.properties.class).includes("ky-mark"))).toBe(false);
  });
});
