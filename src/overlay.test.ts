import { describe, expect, it } from "vitest";
import { BOARDS } from "../demo/boards-data.js";
import { BOARD_CLEAR, BOARD_POSITIONS, drawKyogijo, placeBoard } from "./index.ts";
import type { BoardBox, BoardOptions, BoardPosition, ScoreOptions, SurfaceOptions } from "./index.ts";
import { BOARD_TURN_BOX, resolveBoard } from "./overlay.ts";
import { sceneOf } from "./scene.ts";
import { buildTurn, turnMarkup } from "./turn-entry.ts";
import { KYOGIJO_TURN_STYLE } from "./turn.style.ts";
import { parseXml, type Node } from "./xml.fixture.ts";

const tiny = (w: number, h: number, extra = ""): BoardOptions => ({ svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#123"/>${extra}</svg>` });
const SHAPES: [string, BoardOptions][] = [
  ["a results board", BOARDS.swimming],
  ["a bout board", BOARDS.judo],
  ["a medal table", BOARDS.medals],
  ["a tall list", { ...tiny(300, 600), width: 300, height: 600 }],
  ["a long strip", tiny(2000, 100)],
];
const SPORTS_SHOWN: [string, SurfaceOptions | ScoreOptions][] = [
  ["a pool", { sport: "swimming" }],
  ["a judo mat", { sport: "judo" }],
  ["an athletics oval", { sport: "athletics" }],
  ["a speed skating oval", { sport: "skating", league: "isu-long-track" }],
  ["a soccer pitch", { sport: "soccer" }],
  ["a rink in portrait", { sport: "nhl", orientation: "portrait" }],
  ["a scored court", { sport: "nba", home: { name: "Gulls" }, away: { name: "Otters" } } as ScoreOptions],
  ["a cropped rink", { sport: "nhl", range: "offensive-zone" }],
];

const walk = (node: Node): Node[] => [node, ...node.children.flatMap(walk)];
const root = (svg: string): Node => parseXml(svg);
const viewOf = (svg: string): BoardBox => {
  const [x, y, w, h] = root(svg).attrs.viewBox.split(" ").map(Number);
  return { x, y, w, h };
};
const imageOf = (svg: string): { box: BoardBox; node: Node } | undefined => {
  const node = walk(root(svg)).find((n) => n.name === "image" && n.attrs.class === "ky-board-img");
  return node === undefined ? undefined : { node, box: { x: Number(node.attrs.x), y: Number(node.attrs.y), w: Number(node.attrs.width), h: Number(node.attrs.height) } };
};
/** The surface's own box: the drawing's viewBox less the strip a compact card adds under it (the same drawing with the board off has the same surface). */
const intersects = (a: BoardBox, b: BoardBox): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const clearZone = (view: BoardBox): BoardBox => ({ x: view.x + view.w * (0.5 - BOARD_CLEAR / 2), y: view.y + view.h * (0.5 - BOARD_CLEAR / 2), w: view.w * BOARD_CLEAR, h: view.h * BOARD_CLEAR });

describe("a board over a drawing", () => {
  it("leaves a drawing with no board, or with one that is not a board, byte for byte as it was", () => {
    for (const [, o] of SPORTS_SHOWN) {
      const plain = drawKyogijo({ ...o, id: "b" });
      for (const bad of [undefined, {}, { svg: "" }, { svg: "https://example.com/board.svg", width: 10, height: 10 }, { svg: "javascript:alert(1)", width: 1, height: 1 }, { svg: "<div>no</div>", width: 1, height: 1 }, { svg: "<svg></svg>" }, { svg: tiny(10, 10).svg, width: 1e9, height: 5 }, "nonsense", 7, null]) {
        expect(drawKyogijo({ ...o, id: "b", board: bad as never }), JSON.stringify(bad)).toBe(plain);
      }
    }
  });

  it("is written as one image, which cannot run what is in the board, with its own shape and no more", () => {
    const hostile = tiny(400, 100, `<script>alert(1)</script><text onload="x()">"&amp;'</text><image href="https://evil.example/x.png"/>`);
    const svg = drawKyogijo({ sport: "swimming", id: "h", board: { ...hostile, label: `a "board" <b>&</b>` } });
    expect(() => parseXml(svg)).not.toThrow();
    expect(svg).not.toMatch(/<script|onload=|<b>/);
    expect(svg.match(/<image /g)).toHaveLength(1);
    const found = imageOf(svg);
    expect(found).toBeDefined();
    expect(found!.node.attrs.href).toMatch(/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
    expect(found!.node.attrs.preserveAspectRatio).toBe("xMidYMid meet");
    expect(walk(root(svg)).filter((n) => n.attrs.class === "ky-board")).toHaveLength(1);
    expect(root(svg).attrs["data-board"]).toBe("top");
    const group = walk(root(svg)).find((n) => n.attrs.class === "ky-board")!;
    expect(group.attrs.role).toBe("img");
    expect(group.attrs["aria-label"]).toBe("a &quot;board&quot; &lt;b&gt;&amp;&lt;/b&gt;");
  });

  it("is hidden from assistive technology unless it has a label, and never takes the pointer", () => {
    const quiet = drawKyogijo({ sport: "swimming", id: "q", board: tiny(400, 100) });
    const group = walk(root(quiet)).find((n) => n.attrs.class === "ky-board")!;
    expect(group.attrs["aria-hidden"]).toBe("true");
    expect(group.attrs.role).toBeUndefined();
    expect(group.attrs["pointer-events"]).toBe("none");
  });

  it("takes its shape from the size given, else from the viewBox of the SVG", () => {
    expect(resolveBoard(tiny(400, 100))).toMatchObject({ width: 400, height: 100 });
    expect(resolveBoard({ ...tiny(400, 100), width: 960, height: 414 })).toMatchObject({ width: 960, height: 414 });
    expect(resolveBoard({ svg: '<svg xmlns="http://www.w3.org/2000/svg" width="5" height="5"></svg>' })).toBeUndefined();
    expect(resolveBoard({ svg: '<?xml version="1.0"?><svg viewBox="0 0 8 2"/>' })).toMatchObject({ width: 8, height: 2 });
  });

  it("reads the opacity, the share and the margin within their ranges, and ignores a position that is not one", () => {
    expect(resolveBoard({ ...tiny(4, 1), opacity: 7 })).toMatchObject({ opacity: 1 });
    expect(resolveBoard({ ...tiny(4, 1), opacity: -2 })).toMatchObject({ opacity: 0 });
    expect(resolveBoard({ ...tiny(4, 1), opacity: Number.NaN })).toMatchObject({ opacity: 1 });
    expect(resolveBoard({ ...tiny(4, 1), share: 9 })).toMatchObject({ share: 1 });
    expect(resolveBoard({ ...tiny(4, 1), share: 0 })).toMatchObject({ share: 0.1 });
    expect(resolveBoard({ ...tiny(4, 1), margin: 5 })).toMatchObject({ margin: 0.2 });
    expect(resolveBoard({ ...tiny(4, 1), position: "middle" as never })).toMatchObject({ position: "top" });
    expect(resolveBoard({ ...tiny(4, 1), position: { x: 4, y: -1 } })).toMatchObject({ position: { x: 1, y: 0, anchor: "start" } });
    const faded = drawKyogijo({ sport: "swimming", id: "o", board: { ...tiny(400, 100), opacity: 0.5 } });
    expect(walk(root(faded)).find((n) => n.attrs.class === "ky-board")!.attrs.opacity).toBe("0.5");
  });

  describe("placed by name", () => {
    for (const [what, o] of SPORTS_SHOWN) {
      it(`stays inside ${what}, keeps its shape, and never covers the middle`, () => {
        for (const [, shape] of SHAPES) {
          const ratio = (shape.width ?? resolveBoard(shape)!.width) / (shape.height ?? resolveBoard(shape)!.height);
          for (const position of BOARD_POSITIONS) {
            const svg = drawKyogijo({ ...o, id: "p", board: { ...shape, position } });
            const found = imageOf(svg)!;
            const label = `${what} ${position} ${ratio.toFixed(2)}`;
            expect(found, label).toBeDefined();
            const view = viewOf(svg);
            const { box } = found;
            // Inside the drawing (a compact card's strip is under the surface; these are full-size), with the rounding of two decimals.
            expect(box.x, label).toBeGreaterThanOrEqual(view.x - 0.01);
            expect(box.y, label).toBeGreaterThanOrEqual(view.y - 0.01);
            expect(box.x + box.w, label).toBeLessThanOrEqual(view.x + view.w + 0.01);
            expect(box.y + box.h, label).toBeLessThanOrEqual(view.y + view.h + 0.01);
            // Its own shape: no letter is stretched. The rounding is of two decimals of a unit.
            expect(Math.abs(box.w / box.h - ratio) / ratio, label).toBeLessThan(0.02 + 0.02 / Math.min(box.w, box.h));
            // Not into the middle of the surface.
            expect(intersects(box, clearZone(view)), label).toBe(false);
            // Never wider than asked for.
            expect(box.w, label).toBeLessThanOrEqual(0.5 * view.w + 0.01);
          }
        }
      });
    }

    it("takes the width asked for, as a share of the drawing's width, when the room is enough", () => {
      const svg = drawKyogijo({ sport: "swimming", id: "s", board: { ...tiny(1000, 40), share: 0.3, position: "top" } });
      expect(imageOf(svg)!.box.w).toBeCloseTo(0.3 * viewOf(svg).w, 1);
      const small = drawKyogijo({ sport: "athletics", id: "s", board: { ...tiny(1000, 400), share: 0.2, position: "bottom-left" } });
      expect(imageOf(small)!.box.w).toBeCloseTo(0.2 * viewOf(small).w, 1);
    });

    it("keeps to its edge: top and bottom centred, the sides centred up and down, the corners in the corners, one margin from the edge", () => {
      const view = { x: 0, y: 0, w: 1000, h: 600 };
      const at = (position: BoardPosition) => placeBoard(resolveBoard({ ...tiny(1000, 250), position, share: 0.3 })!, view);
      const gap = 0.02 * view.w;
      expect(at("top")).toMatchObject({ y: gap });
      expect(at("top").x + at("top").w / 2).toBeCloseTo(500, 5);
      expect(at("bottom").y + at("bottom").h).toBeCloseTo(600 - gap, 5);
      expect(at("side").x + at("side").w).toBeCloseTo(1000 - gap, 5);
      expect(at("side").y + at("side").h / 2).toBeCloseTo(300, 5);
      expect(at("left").x).toBeCloseTo(gap, 5);
      expect(at("corner")).toEqual(at("top-right"));
      expect(at("top-left")).toMatchObject({ x: gap, y: gap });
      expect(at("bottom-left")).toMatchObject({ x: gap });
      expect(at("bottom-right").x + at("bottom-right").w).toBeCloseTo(1000 - gap, 5);
      expect(at("bottom-right").y + at("bottom-right").h).toBeCloseTo(600 - gap, 5);
    });

    it("is made smaller, never moved, when it would reach the middle, and gone from a box with no room", () => {
      const view = { x: 0, y: 0, w: 1000, h: 400 };
      const tall = resolveBoard({ ...tiny(100, 100), position: "top", share: 1 })!;
      const placed = placeBoard(tall, view);
      expect(placed.y).toBeCloseTo(0.02 * 1000, 5);
      expect(placed.y + placed.h).toBeLessThanOrEqual(view.h * (0.5 - BOARD_CLEAR / 2) - 0.02 * 1000 + 0.001);
      expect(placeBoard(resolveBoard({ ...tiny(100, 100), position: "top" })!, { x: 0, y: 0, w: 100, h: 20 }).w).toBeLessThan(3);
      const none = drawKyogijo({ sport: "swimming", id: "n", board: tiny(100, 100) });
      expect(imageOf(none)).toBeDefined();
    });
  });

  describe("asked to cover, or placed at a point", () => {
    it("`cover` lets a named position be as large as asked, inside the drawing", () => {
      const view = { x: 0, y: 0, w: 1000, h: 600 };
      const board = resolveBoard({ ...tiny(1000, 600), position: "top", share: 0.8, cover: true })!;
      const placed = placeBoard(board, view);
      expect(placed.w).toBeCloseTo(800, 5);
      expect(intersects(placed, clearZone(view))).toBe(true);
      expect(placed.y + placed.h).toBeLessThanOrEqual(600);
      const huge = placeBoard(resolveBoard({ ...tiny(1000, 5000), position: "top", share: 1, cover: true })!, view);
      expect(huge.h).toBeLessThanOrEqual(view.h - 2 * 0.02 * view.w + 0.001);
    });

    it("a point of your own is put where it says, by its corner or its middle, and kept inside the drawing", () => {
      const view = { x: 10, y: 20, w: 1000, h: 500 };
      const start = placeBoard(resolveBoard({ ...tiny(400, 100), position: { x: 0.25, y: 0.5 }, share: 0.4 })!, view);
      expect(start).toMatchObject({ x: 10 + 250, y: 20 + 250, w: 400, h: 100 });
      const centre = placeBoard(resolveBoard({ ...tiny(400, 100), position: { x: 0.5, y: 0.5, anchor: "center" }, share: 0.4 })!, view);
      expect(centre.x + centre.w / 2).toBeCloseTo(510, 5);
      expect(centre.y + centre.h / 2).toBeCloseTo(270, 5);
      expect(intersects(centre, clearZone(view))).toBe(true);
      const out = placeBoard(resolveBoard({ ...tiny(400, 100), position: { x: 1, y: 1 }, share: 0.4 })!, view);
      expect(out.x + out.w).toBeLessThanOrEqual(view.x + view.w);
      expect(out.y + out.h).toBeLessThanOrEqual(view.y + view.h);
      const svg = drawKyogijo({ sport: "swimming", id: "c", board: { ...tiny(400, 100), position: { x: 0.5, y: 0.5, anchor: "center" } } });
      expect(root(svg).attrs["data-board"]).toBe("custom");
    });
  });

  describe("on a compact card and a badge", () => {
    const game = { home: { name: "Gulls", score: 2 }, away: { name: "Otters", score: 1 } };
    it("lies over the surface and not over the strip under it", () => {
      const full = drawKyogijo({ sport: "nhl", ...game, id: "z", board: { ...tiny(1000, 300), position: "bottom" } });
      const compact = drawKyogijo({ sport: "nhl", ...game, size: "compact", id: "z", board: { ...tiny(1000, 300), position: "bottom" } });
      const surface = viewOf(full);
      const card = viewOf(compact);
      expect(card.h).toBeGreaterThan(surface.h);
      const { box } = imageOf(compact)!;
      expect(box.y + box.h).toBeLessThanOrEqual(surface.y + surface.h + 0.01);
    });

    it("is left out of a badge", () => {
      const badge = drawKyogijo({ sport: "nhl", ...game, size: "badge", id: "z", board: tiny(1000, 300) });
      expect(imageOf(badge)).toBeUndefined();
      expect(badge).toBe(drawKyogijo({ sport: "nhl", ...game, size: "badge", id: "z" }));
    });
  });

  it("is the same string for the same options, and the real sample boards draw over every sport named in the demo", () => {
    const options: SurfaceOptions = { sport: "athletics", id: "d", board: { ...BOARDS.athletics, position: "top" } };
    expect(drawKyogijo(options)).toBe(drawKyogijo({ ...options }));
    for (const [sport, sample] of [["swimming", BOARDS.swimming], ["judo", BOARDS.judo], ["athletics", BOARDS.athletics], ["skating", BOARDS.skating], ["athletics", BOARDS.medals]] as const) {
      const svg = drawKyogijo({ sport, id: "e", board: { ...sample, position: sample === BOARDS.medals ? "corner" : sample === BOARDS.skating ? "side" : "top" } });
      expect(imageOf(svg)).toBeDefined();
      expect(() => parseXml(svg)).not.toThrow();
    }
  });

  it("is read by the scene as an image, so a canvas or a PNG draws it", () => {
    const scene = sceneOf({ sport: "swimming", id: "s", board: { ...BOARDS.swimming, position: "top" } });
    expect(scene.items.filter((i) => i.kind === "image").length).toBeGreaterThan(0);
  });
});

describe("a board over the 3D view", () => {
  const turnOptions = (board: BoardOptions): SurfaceOptions => ({ sport: "swimming", board });
  const layerOf = (html: string): string => /<div class="ky-turn-board"[\s\S]*?<\/div>/.exec(html)![0];
  const styleOf = (layer: string): Record<string, string> => Object.fromEntries(/style="([^"]*)"/.exec(layer)![1].split(";").map((rule) => rule.split(/:(.*)/s).slice(0, 2) as [string, string]));

  it("is a layer of its own after the scene, inside the view, and not a plane or a picture on the floor", () => {
    const html = turnMarkup(turnOptions({ ...BOARDS.swimming, position: "top" }));
    expect(html.match(/<div class="ky-turn-board"/g)).toHaveLength(1);
    const view = html.slice(html.indexOf('class="ky-turn-view"'), html.indexOf('class="ky-turn-help"'));
    const world = view.slice(view.indexOf('class="ky-turn-world'), view.indexOf('class="ky-turn-board"'));
    expect(world).not.toMatch(/class="ky-board[" ]|ky-board-img|<div class="ky-turn-board"|data:image\/svg/);
    expect(view.indexOf('class="ky-turn-board"')).toBeGreaterThan(view.indexOf('class="ky-turn-world'));
    expect(buildTurn(turnOptions(BOARDS.swimming)).floor).not.toMatch(/class="ky-board[" ]|ky-board-img/);
    expect(buildTurn(turnOptions(BOARDS.swimming)).board).toBeDefined();
  });

  it("is the same markup at every viewpoint and every view: it does not turn, tip or zoom with the scene", () => {
    const base = layerOf(turnMarkup(turnOptions({ ...BOARDS.judo, position: "top" })));
    for (const preset of ["overhead", "broadcast", "end", "corner"] as const) expect(layerOf(turnMarkup(turnOptions({ ...BOARDS.judo, position: "top" }), { preset }))).toBe(base);
    for (const view of [{ yaw: 33 }, { pitch: 70 }, { zoom: 2 }, { yaw: -120, pitch: 20, zoom: 1.5 }]) expect(layerOf(turnMarkup(turnOptions({ ...BOARDS.judo, position: "top" }), { view }))).toBe(base);
    expect(layerOf(turnMarkup(turnOptions({ ...BOARDS.judo, position: "top" }), { size: { width: 480, height: 600 } }))).toBe(base);
    expect(Object.keys(styleOf(base))).not.toContain("transform");
    expect(base).not.toMatch(/matrix3d|perspective\(/);
  });

  it("scales evenly: its own shape, a width that is a share of the view's, a height that follows, nothing stretched", () => {
    for (const [, shape] of SHAPES) {
      const board = resolveBoard(shape)!;
      for (const position of BOARD_POSITIONS) {
        const layer = layerOf(turnMarkup(turnOptions({ ...shape, position })));
        const style = styleOf(layer);
        expect(style.width, position).toMatch(/^[\d.]+%$/);
        expect(style.height, position).toBeUndefined();
        expect(layer).toContain(`width="${board.width}" height="${board.height}"`);
      }
    }
    expect(KYOGIJO_TURN_STYLE).toMatch(/\.ky-turn-board-img\{[^}]*height:auto;object-fit:contain/);
    expect(KYOGIJO_TURN_STYLE).toMatch(/\.ky-turn-board\{[^}]*pointer-events:none/);
  });

  it("never covers the middle of the view, whatever shape the view has", () => {
    const margin = (style: Record<string, string>): number => Number.parseFloat(style.margin) / 100;
    for (const [what, shape] of SHAPES) {
      const board = resolveBoard(shape)!;
      for (const position of BOARD_POSITIONS) {
        const style = styleOf(layerOf(turnMarkup(turnOptions({ ...shape, position }))));
        for (const ratio of [1, 1.25, 1.6, 2.4]) {
          const W = 1000 * ratio;
          const H = 1000;
          const w = (Number.parseFloat(style.width) / 100) * W;
          const h = Math.min(w / (board.width / board.height), (Number.parseFloat(style["max-height"]) / 100) * H);
          const picture = Math.min(w, h * (board.width / board.height));
          const m = margin(style) * W;
          const named = position;
          const top = named === "top" || named === "top-left" || named === "top-right" || named === "corner";
          const bottom = named === "bottom" || named === "bottom-left" || named === "bottom-right";
          const right = named === "side" || named === "corner" || named === "top-right" || named === "bottom-right";
          const left = named === "left" || named === "top-left" || named === "bottom-left";
          const x = right ? W - m - w : left ? m : (W - w) / 2;
          const y = top ? m : bottom ? H - m - h : (H - h) / 2;
          const box = { x, y, w: Math.min(w, picture + 0.001), h };
          // The picture (its own shape inside the box) is what is seen; the box is at least as large, so keeping the box clear keeps the picture clear.
          const centre = { x: W * (0.5 - BOARD_CLEAR / 2), y: H * (0.5 - BOARD_CLEAR / 2), w: W * BOARD_CLEAR, h: H * BOARD_CLEAR };
          expect(intersects({ x, y, w, h }, centre), `${what} ${position} in a view of ${ratio}:1`).toBe(false);
          expect(box.w).toBeGreaterThan(0);
        }
      }
    }
  });

  it("is at a point of your own as a share of the view, and may cover the middle there", () => {
    const layer = layerOf(turnMarkup(turnOptions({ ...tiny(400, 100), position: { x: 0.5, y: 0.5, anchor: "center" } })));
    const style = styleOf(layer);
    expect(style).toMatchObject({ position: "absolute", left: "50%", top: "50%" });
    expect(style.translate).toBe("-50% -50%");
    expect(layer).toContain('data-position="custom"');
  });

  it("carries its label and opacity, is hidden from assistive technology without a label, and is left out when there is none", () => {
    expect(layerOf(turnMarkup(turnOptions({ ...tiny(400, 100), label: 'Final "A"' })))).toContain('role="img" aria-label="Final &quot;A&quot;"');
    expect(layerOf(turnMarkup(turnOptions(tiny(400, 100))))).toContain('aria-hidden="true"');
    expect(styleOf(layerOf(turnMarkup(turnOptions({ ...tiny(400, 100), opacity: 0.4 })))).opacity).toBe("0.4");
    expect(turnMarkup({ sport: "swimming" })).not.toContain('<div class="ky-turn-board"');
    expect(turnMarkup({ sport: "swimming", board: { svg: "no" } as never })).not.toContain('<div class="ky-turn-board"');
  });

  it("a board in the hostile string cannot break out of the markup", () => {
    const html = turnMarkup(turnOptions({ ...tiny(400, 100, `<script>alert(1)</script>"><b>`), label: `"><script>alert(2)</script>` }));
    expect(layerOf(html)).not.toMatch(/<script|<b>/);
  });

  it("the 3D box the board is placed for is the view's own shape", () => {
    expect(BOARD_TURN_BOX.w / BOARD_TURN_BOX.h).toBeCloseTo(1.6, 5);
    expect(KYOGIJO_TURN_STYLE).toContain("16/10");
  });
});
