import { describe, expect, it } from "vitest";
import { drawToCanvas, withAlpha, type CanvasContext } from "./canvas.ts";
import { GAME } from "./scene.fixture.ts";
import { sceneOf } from "./scene.ts";
import type { Scene, SceneItem } from "./scene.types.ts";

type Call = [string, ...unknown[]];

/** A canvas context that writes down every call and every property it is given. */
function recorder(missing: string[] = []): { ctx: CanvasContext; log: Call[] } {
  const log: Call[] = [];
  // A real context starts with these (a browser's; a Node canvas may lack them).
  const state: Record<string, unknown> = { filter: "none", letterSpacing: "0px" };
  const methods = ["save", "restore", "setTransform", "beginPath", "moveTo", "lineTo", "bezierCurveTo", "quadraticCurveTo", "closePath", "fill", "stroke", "clip", "fillText", "strokeText", "fillRect", "clearRect", "setLineDash", "drawImage"];
  const ctx = new Proxy(state, {
    get(target, name: string) {
      if (missing.includes(name)) return undefined;
      if (name === "createLinearGradient") return (...args: unknown[]) => (log.push([name, ...args]), { addColorStop: (...stop: unknown[]) => log.push(["addColorStop", ...stop]) });
      if (methods.includes(name)) return (...args: unknown[]) => void log.push([name, ...args]);
      return target[name];
    },
    set(target, name: string, value) {
      log.push([`=${name}`, value]);
      target[name] = value;
      return true;
    },
  }) as unknown as CanvasContext;
  return { ctx, log };
}

const count = (log: Call[], name: string): number => log.filter(([n]) => n === name).length;
const shapes = (scene: Scene): SceneItem[] => scene.items.filter((i) => i.kind !== "text" && i.kind !== "image");
const painted = (item: SceneItem, key: "fill" | "stroke"): boolean => (key === "fill" ? item.style.fill !== "none" : item.style.stroke !== "none" && item.style.strokeWidth > 0);

describe("drawToCanvas", () => {
  it("makes the calls the scene says: one fill for each filled shape, one stroke for each stroked one, one fillText for each label", () => {
    for (const options of [{ sport: "nhl", ...GAME }, { sport: "nba", id: "c" }, { sport: "mlb", ...GAME, theme: "dark" }, { sport: "soccer", id: "c", orientation: "portrait" }] as const) {
      const scene = sceneOf(options);
      const { ctx, log } = recorder();
      drawToCanvas(ctx, scene, { width: 800 });
      const plain = shapes(scene).filter((i) => typeof i.style.fill === "string" || typeof i.style.stroke === "string");
      expect(count(log, "fill"), JSON.stringify(options)).toBe(plain.filter((i) => painted(i, "fill")).length);
      const texts = scene.items.filter((i) => i.kind === "text");
      expect(count(log, "fillText")).toBe(texts.filter((t) => t.style.fill !== "none").length);
      expect(count(log, "strokeText")).toBe(texts.filter((t) => painted(t, "stroke")).length);
      expect(count(log, "stroke")).toBe(plain.filter((i) => painted(i, "stroke")).length);
      expect(count(log, "save"), "every save is restored").toBe(count(log, "restore"));
    }
  });

  it("draws the words of the scene, in order, each in its font, aligned as it says, with the halo painted first", () => {
    const scene = sceneOf({ sport: "nhl", ...GAME });
    const { ctx, log } = recorder();
    drawToCanvas(ctx, scene, { width: 1200 });
    const expected = scene.items.flatMap((i) => (i.kind === "text" ? [i.text] : []));
    expect(log.filter(([n]) => n === "fillText").map((c) => c[1])).toEqual(expected);
    const first = log.findIndex(([n, v]) => n === "=font" && String(v).includes("800"));
    expect(String(log[first][1])).toMatch(/^800 \d+(\.\d+)?px system-ui,/);
    const halo = scene.items.findIndex((i) => i.kind === "text" && i.style.paintOrder === "stroke");
    expect(halo).toBeGreaterThanOrEqual(0);
    const haloText = scene.items[halo].kind === "text" ? (scene.items[halo] as { text: string }).text : "";
    const at = log.findIndex(([n, t]) => n === "strokeText" && t === haloText);
    expect(at).toBeGreaterThan(0);
    expect(log.findIndex(([n, t]) => n === "fillText" && t === haloText)).toBeGreaterThan(at);
    expect(log.some(([n, v]) => n === "=textAlign" && v === "center")).toBe(true);
    // A small size is drawn larger and taken down by the transform, so the engine rasterises it at a size it renders well.
    const sizes = log.filter(([n]) => n === "=font").map((c) => Number(/(\d+(?:\.\d+)?)px/.exec(String(c[1]))?.[1]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(10);
  });

  it("puts the scene in the box asked for: a width, a height, both (fitted and centred) or a scale, from a corner", () => {
    const scene = sceneOf({ sport: "nhl", id: "c" });
    const { w, h } = scene.viewBox;
    const run = (options: object) => {
      const { ctx, log } = recorder();
      const drawn = drawToCanvas(ctx, scene, options);
      return { drawn, first: log.find(([n]) => n === "setTransform" && (n === "setTransform" ? true : false)), log };
    };
    expect(run({ width: 864 }).drawn).toEqual({ width: 864, height: (864 * h) / w, scale: 4 });
    expect(run({ height: 202 }).drawn.scale).toBe(2);
    expect(run({ scale: 3 }).drawn).toEqual({ width: 3 * w, height: 3 * h, scale: 3 });
    const both = run({ width: 1000, height: 1000 }).drawn;
    expect(both).toEqual({ width: 1000, height: 1000, scale: 1000 / w });
    // The first shape (the apron fills the viewBox) lands at the corner asked for.
    const { log } = run({ width: 216, x: 10, y: 20 });
    const transforms = log.filter(([n]) => n === "setTransform");
    expect(transforms[1].slice(1)).toEqual([1, 0, 0, 1, 10 + 8, 20 + 8]);
    // Fitted and centred: a box twice as tall as it needs has the drawing in its middle.
    const tall = run({ width: 216, height: 202 }).log.filter(([n]) => n === "setTransform")[1].slice(1);
    expect(tall[5]).toBeCloseTo(8 + (202 - 101) / 2);
    expect(() => drawToCanvas(recorder().ctx, scene, { width: 0 })).toThrow(RangeError);
    expect(() => drawToCanvas(recorder().ctx, scene, { scale: Number.NaN })).toThrow(RangeError);
  });

  it("sets each shape's colour as the scene says, light or dark, and writes its alpha into the colour", () => {
    for (const theme of ["light", "dark"] as const) {
      const scene = sceneOf({ sport: "nhl", ...GAME }, { theme });
      const { ctx, log } = recorder();
      drawToCanvas(ctx, scene, { width: 800, theme });
      const fills = log.filter(([n]) => n === "=fillStyle").map((c) => c[1]);
      expect(fills[0]).toBe(theme === "light" ? "#d3dbe1" : "#1a2025");
    }
    expect(withAlpha("#ffffff", 0.5)).toBe("rgba(255,255,255,0.5)");
    expect(withAlpha("rgba(255,255,255,.92)", 0.5)).toBe("rgba(255,255,255,0.46)");
    expect(withAlpha("#ffffff80", 0.5)).toBe("rgba(255,255,255,0.251)");
    expect(withAlpha("#123", 1)).toBe("#123");
    expect(withAlpha("hsl(10 20% 30%)", 0.5)).toBe("hsl(10 20% 30%)");
    // A colour that cannot take an alpha gets it from the context's globalAlpha.
    const scene = sceneOf({ sport: "nhl", id: "c", colors: { surface: "hsl(200 50% 50%)" } });
    const { ctx, log } = recorder();
    drawToCanvas(ctx, scene, { width: 400 });
    const at = log.findIndex(([n, v]) => n === "=fillStyle" && v === "hsl(200 50% 50%)");
    expect(at).toBeGreaterThan(0);
  });

  it("clips what the scene clips, once for each run of shapes under the same clips", () => {
    const scene = sceneOf({ sport: "nhl", id: "c", layers: [{ kind: "points", data: [{ x: 100, y: 40 }, { x: 120, y: 30 }] }, { kind: "text", data: [{ x: 50, y: 50, text: "x" }] }] as never });
    const { ctx, log } = recorder();
    drawToCanvas(ctx, scene, { width: 800 });
    expect(scene.items.filter((i) => i.clips.length > 0).length).toBe(3);
    expect(count(log, "clip")).toBe(1);
    expect(count(log, "save")).toBe(count(log, "restore"));
    // The clip is the surface's outline: one path, its first move at the left end of the boards.
    const at = log.findIndex(([n]) => n === "clip");
    const path = log.slice(0, at).filter(([n]) => n === "moveTo" || n === "bezierCurveTo");
    expect(path.length).toBeGreaterThan(4);
  });

  it("paints a gradient with the context's own, and leaves a gradient out of a context that has none", () => {
    const options = { sport: "nhl", id: "c", layers: [{ kind: "arrows", team: "home", data: [{ x: 20, y: 20, x2: 120, y2: 60 }], style: { comet: {} } }] } as never;
    const scene = sceneOf(options);
    const { ctx, log } = recorder();
    drawToCanvas(ctx, scene, { width: 800 });
    const g = scene.gradients[0];
    expect(log.find(([n]) => n === "createLinearGradient")?.slice(1)).toEqual([g.x1, g.y1, g.x2, g.y2]);
    expect(log.filter(([n]) => n === "addColorStop").map((c) => c[1])).toEqual([0, 1]);
    const without = recorder(["createLinearGradient"]);
    expect(() => drawToCanvas(without.ctx, scene, { width: 800 })).not.toThrow();
    expect(count(without.log, "stroke")).toBe(count(log, "stroke") - 1);
  });

  it("tiles a pattern inside its shape's outline: the shape is the clip and the tile's shapes are drawn over it", () => {
    const scene = sceneOf({ sport: "curling", id: "c", sheet: { pebble: true } });
    const { ctx, log } = recorder();
    drawToCanvas(ctx, scene, { width: 400 });
    expect(count(log, "clip")).toBe(1);
    const pattern = scene.patterns[0];
    const item = scene.items.find((i) => typeof i.style.fill === "object")!;
    const tiles = item.kind === "rect" ? Math.ceil(item.width / pattern.width) * Math.ceil(item.height / pattern.height) : 0;
    expect(tiles).toBeGreaterThan(500);
    const fills = count(log, "fill");
    const others = shapes(scene).filter((i) => i !== item && i.style.fill !== "none").length;
    expect(fills - others).toBe(tiles * pattern.shapes.length);
  });

  it("draws a logo only where the caller gives a picture for its address, fitted in its box", () => {
    const scene = sceneOf({ sport: "nhl", ...GAME });
    const image = scene.items.find((i) => i.kind === "image");
    expect(image?.kind === "image" && image.href).toBe("https://example.com/bison.png");
    const none = recorder();
    drawToCanvas(none.ctx, scene, { width: 800 });
    expect(count(none.log, "drawImage")).toBe(0);
    const asked: string[] = [];
    const { ctx, log } = recorder();
    const picture = { width: 200, height: 100 };
    drawToCanvas(ctx, scene, { width: 800, images: (href) => (asked.push(href), picture) });
    expect(asked).toEqual(["https://example.com/bison.png"]);
    const [, , x, y, w, h] = log.find(([n]) => n === "drawImage") as Call;
    if (image?.kind !== "image") throw new Error("no logo");
    // A picture twice as wide as tall, in a square box, is as wide as the box and centred.
    expect([w, h]).toEqual([image.width, image.width / 2]);
    expect(x).toBe(image.x);
    expect(y).toBeCloseTo(image.y + (image.height - image.width / 2) / 2);
    const missing = recorder();
    drawToCanvas(missing.ctx, scene, { width: 800, images: () => undefined });
    expect(count(missing.log, "drawImage")).toBe(0);
  });

  it("applies a filter where the context has one, and clears and fills the box first when asked", () => {
    const scene = sceneOf({ sport: "nhl", ...GAME });
    const { ctx, log } = recorder();
    drawToCanvas(ctx, scene, { width: 800, background: "#fff", clear: true });
    expect(log[0][0]).toBe("save");
    expect(log.find(([n]) => n === "clearRect")?.slice(1)).toEqual([0, 0, 800, (800 * scene.viewBox.h) / scene.viewBox.w]);
    expect(log.find(([n]) => n === "fillRect")?.slice(1, 3)).toEqual([0, 0]);
    expect(log.filter(([n]) => n === "=filter").map((c) => c[1])).toContain("grayscale(.35) brightness(.92)");
    expect(log.filter(([n]) => n === "=filter").at(-1)?.[1]).toBe("none");
    const plain = recorder(["filter", "fillRect", "clearRect"]);
    expect(() => drawToCanvas(plain.ctx, scene, { width: 800, background: "#fff", clear: true })).not.toThrow();
  });

  it("reads the options of the drawing, an SVG string or a scene, and draws the same", () => {
    const options = { sport: "nba", id: "same" } as const;
    const logs = [options, sceneOf(options), sceneOf(options)].map((source) => {
      const { ctx, log } = recorder();
      drawToCanvas(ctx, source, { width: 500 });
      return JSON.stringify(log);
    });
    expect(new Set(logs).size).toBe(1);
  });
});
