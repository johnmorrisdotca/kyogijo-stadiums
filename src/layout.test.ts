import { describe, expect, it } from "vitest";
import { BACKGROUND_PATTERNS, backgroundMarkup, resolveBackground } from "./background.ts";
import { drawToCanvas, type CanvasContext } from "./canvas.ts";
import { nbaShotChart } from "./charts.ts";
import { drawKyogijo, SPORTS } from "./draw.ts";
import { sceneToGeoJSON } from "./geojson.ts";
import { GRID_MAX_CELLS, GRID_PRESETS, drawGrid } from "./layout.ts";
import { sceneFromSvg, sceneOf } from "./scene.ts";
import { sceneToSvg } from "./scene.flat.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import type { Sport } from "./types.ts";
import { parseXml, walk, withClass } from "./xml.fixture.ts";

const ids = (svg: string): string[] => walk(parseXml(svg)).flatMap((n) => (n.attrs.id === undefined ? [] : [n.attrs.id]));
const references = (svg: string): string[] => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
const viewBox = (svg: string): number[] => (/viewBox="([^"]+)"/.exec(svg)?.[1] ?? "").split(" ").map(Number);

describe("a background on a drawing", () => {
  it("leaves the drawing byte for byte as it was when there is none", () => {
    for (const sport of SPORTS) {
      const plain = drawKyogijo({ sport, id: "b" });
      expect(drawKyogijo({ sport, id: "b", background: "none" })).toBe(plain);
      expect(drawKyogijo({ sport, id: "b", background: {} })).toBe(plain);
      expect(drawKyogijo({ sport, id: "b", background: "nonsense" as never })).toBe(plain);
    }
  });

  for (const sport of SPORTS) {
    it(`${sport}: every pattern is well-formed, over the apron and under the surface, wide and tall`, () => {
      for (const pattern of BACKGROUND_PATTERNS) {
        for (const orientation of ["landscape", "portrait"] as const) {
          const svg = drawKyogijo({ sport, id: "b", orientation, background: pattern });
          const tree = parseXml(svg);
          const key = walk(tree).find((n) => n.name === "pattern");
          expect(key?.attrs.id, `${sport} ${pattern}`).toBe("b-bg");
          expect(references(svg)).toContain("b-bg");
          expect(new Set(ids(svg)).size, "ids are unique").toBe(ids(svg).length);
          // The apron's rectangle, then the ground over exactly its box, then the surface.
          const at = svg.indexOf('class="ky-bg-pattern"');
          expect(at).toBeGreaterThan(svg.indexOf('class="ky-'));
          const apron = /<rect class="[^"]*ky-(?:apron|foul)[^"]*" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/.exec(svg);
          expect(apron, `${sport}: an apron`).not.toBeNull();
          expect(svg).toContain(`class="ky-bg-pattern" x="${apron?.[1]}" y="${apron?.[2]}" width="${apron?.[3]}" height="${apron?.[4]}"`);
          expect(svg).toContain(".ky-bg-i{");
        }
      }
    });
  }

  it("follows a crop, a score, a compact card and a special game", () => {
    const options = [
      { sport: "nhl", range: "offensive-zone" },
      { sport: "nba", range: "half-court", landmarks: true },
      { sport: "nfl", away: { name: "A", score: 1 }, home: { name: "B", score: 2 }, size: "compact" },
      { sport: "mlb", host: { park: "fenway-park" } },
    ] as const;
    for (const o of options) {
      const svg = drawKyogijo({ ...o, id: "r", background: { pattern: "felt", color: "#223322" } } as never);
      parseXml(svg);
      expect(svg).toContain('class="ky-bg"');
      expect(svg).toContain('fill="#223322"');
    }
  });

  it("draws no ground on a badge, which has no surface", () => {
    const svg = drawKyogijo({ sport: "nhl", size: "badge", away: { name: "A" }, home: { name: "B" }, background: "felt" });
    expect(svg).not.toContain("ky-bg");
  });

  it("holds a photograph to the rules of a logo, at an opacity, over the colour and under the pattern", () => {
    const svg = drawKyogijo({ sport: "nba", id: "p", background: { color: "#102030", image: "https://example.com/arena.jpg", imageOpacity: 0.5, pattern: "dots" } });
    parseXml(svg);
    const image = /<image class="ky-bg-img" href="https:\/\/example.com\/arena.jpg"[^>]*>/.exec(svg)?.[0] ?? "";
    expect(image).toContain('opacity="0.5"');
    expect(image).toContain('preserveAspectRatio="xMidYMid slice"');
    expect(svg.indexOf('class="ky-bg"')).toBeLessThan(svg.indexOf("ky-bg-img"));
    expect(svg.indexOf("ky-bg-img")).toBeLessThan(svg.indexOf('class="ky-bg-pattern"'));
    expect(svg).toContain('<clipPath id="p-bgc">');
    for (const bad of ["javascript:alert(1)", 'x" onload="y', "data:text/html,<b>"]) {
      expect(drawKyogijo({ sport: "nba", id: "p", background: { image: bad } }), bad).toBe(drawKyogijo({ sport: "nba", id: "p" }));
    }
    expect(drawKyogijo({ sport: "nba", id: "p", background: { image: "a.png", imageFit: "contain" } })).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(drawKyogijo({ sport: "nba", id: "p", background: { image: "a.png", imageFit: "stretch" } })).toContain('preserveAspectRatio="none"');
  });

  it("keeps the numbers in range and the colour safe", () => {
    expect(resolveBackground({ pattern: "felt", opacity: 7, scale: 100, color: "red;fill:url(x)" })).toEqual({ pattern: "felt", opacity: 1, scale: 8 });
    expect(resolveBackground({ pattern: "paper", opacity: -1, scale: 0 })).toEqual({ pattern: "paper", opacity: 0, scale: 0.25 });
    expect(resolveBackground("grass")).toEqual({ pattern: "grass" });
    expect(backgroundMarkup(undefined, { x: 0, y: 0, w: 1, h: 1 }, "x")).toEqual({ defs: "", shapes: "" });
  });

  it("is read by the scene as a pattern and an image", () => {
    const scene = sceneFromSvg(drawKyogijo({ sport: "nhl", id: "s", background: "ice" }));
    expect(scene.patterns).toHaveLength(1);
    expect(scene.patterns[0].shapes.length).toBeGreaterThan(2);
    expect(scene.items.some((i) => i.kind === "rect" && typeof i.style.fill !== "string")).toBe(true);
    const photo = sceneOf({ sport: "nhl", id: "s", background: { image: "https://example.com/a.jpg" } });
    expect(photo.items.some((i) => i.kind === "image")).toBe(true);
  });

  it("is in the stylesheet a page supplies", () => {
    expect(KYOGIJO_STYLE).toContain(".ky-bg-i{");
    expect(KYOGIJO_STYLE).toContain("kyogijo-grid");
  });
});

const cellsOf = (sports: readonly Sport[]) => sports.map((sport) => ({ drawing: { sport, id: "same" }, label: sport.toUpperCase() }));

describe("drawGrid", () => {
  it("is one well-formed SVG with a group title and description and a title and description for each drawing", () => {
    const svg = drawGrid(cellsOf(["nhl", "nba", "soccer"]), { title: "Three <surfaces> & more", subtitle: "To scale", endnote: "Source: the rulebooks", id: "g" });
    const tree = parseXml(svg);
    expect(tree.attrs.role).toBe("group");
    expect(tree.attrs["aria-labelledby"]).toBe("g-t g-d");
    expect(walk(tree).find((n) => n.attrs.id === "g-t")?.text).toBe("Three &lt;surfaces&gt; &amp; more");
    const desc = walk(tree).find((n) => n.attrs.id === "g-d")?.text ?? "";
    expect(desc).toContain("To scale.");
    expect(desc).toContain("Drawings (3):");
    expect(desc).toContain("Source: the rulebooks.");
    const cells = withClass(tree, "ky-g-cell");
    expect(cells).toHaveLength(3);
    for (const [i, cell] of cells.entries()) {
      const drawing = cell.children.find((n) => n.name === "g");
      expect(drawing?.attrs.role).toBe("img");
      const [t, d] = (drawing?.attrs["aria-labelledby"] ?? "").split(" ");
      expect(t).toMatch(new RegExp(`^g-${i}-`));
      expect(walk(drawing as never).find((n) => n.attrs.id === t)?.name).toBe("title");
      expect(walk(drawing as never).find((n) => n.attrs.id === d)?.name).toBe("desc");
    }
    expect(withClass(tree, "ky-g-t").map((n) => n.text)).toEqual(["Three &lt;surfaces&gt; &amp; more"]);
    expect(withClass(tree, "ky-g-s").map((n) => n.text)).toEqual(["To scale"]);
    expect(withClass(tree, "ky-g-e").map((n) => n.text)).toEqual(["Source: the rulebooks"]);
  });

  it("gives every cell ids of its own, so that one drawing may appear twice, and every reference lands", () => {
    const one = drawKyogijo({ sport: "nhl", id: "dup", layers: [{ kind: "heatmap", name: "shots", data: [{ x: 160, y: 40 }, { x: 170, y: 45 }], legend: true }] });
    const svg = drawGrid([one, one, { sport: "nba", id: "dup", background: "wood" }], { id: "g" });
    const all = ids(svg);
    expect(new Set(all).size).toBe(all.length);
    for (const ref of references(svg)) expect(all, ref).toContain(ref);
    // The heat layer's dark colours are scoped to the layer's id: the rule follows the id.
    expect(svg).not.toMatch(/#dup-/);
    expect(svg).toMatch(/#g-0-dup-/);
    expect(svg).toMatch(/#g-1-dup-/);
  });

  it("writes the base stylesheet once however many drawings there are", () => {
    const svg = drawGrid(cellsOf(["nhl", "nba", "mlb", "soccer", "curling", "tennis"]));
    expect(svg.split("--ky-surface:#eef5fa;--ky-apron:#d3dbe1").length - 1).toBe(1);
    expect(svg.match(/<style>/g)).toHaveLength(1);
    expect(drawGrid(cellsOf(["nhl"]), { style: "none" })).not.toContain("<style>");
  });

  it("fits a social card, a square post and a phone", () => {
    const four = cellsOf(["nhl", "nba", "soccer", "mlb"]);
    expect(viewBox(drawGrid(four, { preset: "card" }))).toEqual([0, 0, 1200, 675]);
    expect(viewBox(drawGrid(four, { preset: "square" }))).toEqual([0, 0, 1080, 1080]);
    const phone = drawGrid(four, { preset: "phone", title: "Phone" });
    const [, , w, h] = viewBox(phone);
    expect(w).toBe(390);
    expect(h).toBeGreaterThan(390);
    expect(parseXml(phone).attrs["data-columns"]).toBe("1");
    expect(GRID_PRESETS.card).toMatchObject({ width: 1200, height: 675 });
    expect(viewBox(drawGrid(four, { preset: "card", width: 800, height: 400 }))).toEqual([0, 0, 800, 400]);
    expect(parseXml(drawGrid(four, { preset: "phone", columns: 2 })).attrs["data-columns"]).toBe("2");
  });

  it("puts every drawing inside the picture and inside its own cell, with none over another", () => {
    for (const preset of ["card", "square", "phone"] as const) {
      for (const count of [1, 2, 3, 5, 7]) {
        const sports = (["nhl", "nba", "mlb", "soccer", "nfl", "curling", "tennis"] as const).slice(0, count);
        const svg = drawGrid(cellsOf(sports), { preset, title: "T", subtitle: "S", endnote: "E", legend: [{ label: "A" }] });
        const [, , W, H] = viewBox(svg);
        const boxes = withClass(parseXml(svg), "ky-g-cell").map((cell) => {
          const g = cell.children.find((n) => n.name === "g");
          const m = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)/.exec(g?.attrs.transform ?? "") as RegExpExecArray;
          const sport = g?.attrs["data-sport"] as string;
          const [vx, vy, vw, vh] = viewBox(drawKyogijo({ sport: sport as Sport, id: "same" }));
          const s = Number(m[3]);
          return { x0: Number(m[1]) + vx * s, y0: Number(m[2]) + vy * s, x1: Number(m[1]) + (vx + vw) * s, y1: Number(m[2]) + (vy + vh) * s };
        });
        for (const [i, b] of boxes.entries()) {
          expect(b.x0, `${preset} ${count} ${i}`).toBeGreaterThanOrEqual(-0.05);
          expect(b.y0).toBeGreaterThanOrEqual(-0.05);
          expect(b.x1).toBeLessThanOrEqual(W + 0.05);
          expect(b.y1).toBeLessThanOrEqual(H + 0.05);
          for (const c of boxes.slice(i + 1)) expect(b.x1 <= c.x0 + 0.1 || c.x1 <= b.x0 + 0.1 || b.y1 <= c.y0 + 0.1 || c.y1 <= b.y0 + 0.1, `${preset} ${count}: drawings ${i} overlap`).toBe(true);
        }
      }
    }
  });

  it("sets a key, wraps a long title and keeps a long caption on one line", () => {
    const svg = drawGrid(
      [{ drawing: { sport: "nhl" }, label: "A very long caption that cannot possibly fit over one small cell of the grid" }, { sport: "nba" }],
      { width: 400, title: "A very long title that has to wrap onto more than one line of this narrow picture", legend: [{ label: "Goal", color: "#c8102e" }, { label: "Miss", hollow: true, shape: "triangle" }, { label: "Save", shape: "star" }] },
    );
    const tree = parseXml(svg);
    expect(withClass(tree, "ky-g-t").length).toBeGreaterThan(1);
    const legend = withClass(tree, "ky-g-legend")[0];
    expect(legend.children.filter((n) => n.name === "text").map((n) => n.text)).toEqual(["Goal", "Miss", "Save"]);
    expect(svg).toContain("--c:#c8102e");
    expect(legend.children.some((n) => n.name === "path")).toBe(true);
    const caption = withClass(tree, "ky-g-c")[0];
    expect(caption.text.endsWith("…") || Number(caption.attrs["font-size"]) < 14).toBe(true);
    expect(walk(tree).find((n) => n.name === "desc")?.text).toContain("Key: Goal; Miss; Save.");
  });

  it("takes options, an SVG, a chart and a cell with a label alike", () => {
    const chart = nbaShotChart([{ x: 0, y: 100, made: true }, { x: 80, y: 200, made: false }], { id: "chart" });
    const svg = drawGrid([{ sport: "nhl" }, drawKyogijo({ sport: "nba" }), chart, { drawing: chart, label: "Again" }], { id: "m" });
    expect(withClass(parseXml(svg), "ky-g-cell")).toHaveLength(4);
    const all = ids(svg);
    expect(new Set(all).size).toBe(all.length);
    for (const ref of references(svg)) expect(all).toContain(ref);
    expect(() => drawGrid([42 as never])).toThrow(/options of drawKyogijo/);
    expect(() => drawGrid(["<svg"])).toThrow();
    expect(() => drawGrid([`<svg xmlns="http://www.w3.org/2000/svg"></svg>`])).toThrow(/viewBox/);
    expect(() => drawGrid([])).toThrow(/at least one/);
    expect(() => drawGrid(Array.from({ length: GRID_MAX_CELLS + 1 }, () => ({ sport: "nhl" as const })))).toThrow(RangeError);
  });

  it("says its own words in Japanese and gives the drawings it draws the grid's language", () => {
    const svg = drawGrid([{ sport: "nhl" }, { sport: "nba", language: "en" }], { language: "ja", title: "競技場", id: "j" });
    const desc = walk(parseXml(svg)).find((n) => n.attrs.id === "j-d")?.text ?? "";
    expect(desc).toContain("図（2枚）：");
    expect(desc).toContain("アイスホッケー");
    expect(desc).toContain("basketball");
    expect(walk(parseXml(drawGrid([{ sport: "nhl" }], { language: "ja", id: "k" }))).find((n) => n.attrs.id === "k-t")?.text).toBe("図のグリッド（1枚）");
    expect(walk(parseXml(drawGrid([{ sport: "nhl" }], { id: "k" }))).find((n) => n.attrs.id === "k-t")?.text).toBe("A grid of drawings (1)");
    expect(walk(parseXml(drawGrid([drawKyogijo({ sport: "nhl" }).replace(/<title[^>]*>[^<]*<\/title>/, "")], { id: "k" }))).find((n) => n.attrs.id === "k-d")?.text).toContain("Drawing 1 of 1");
  });

  it("forces a theme on the grid and on every drawing that has none of its own", () => {
    const svg = drawGrid([{ sport: "nhl" }, { sport: "nba", theme: "light" }], { theme: "dark" });
    const tree = parseXml(svg);
    expect(tree.attrs["data-theme"]).toBe("dark");
    expect(withClass(tree, "ky-g-cell").map((c) => c.children.find((n) => n.name === "g")?.attrs["data-theme"])).toEqual(["dark", "light"]);
    expect(sceneFromSvg(svg).theme).toBe("dark");
  });

  it("has a plain ground on a card and a square unless it is none, and any ground on request", () => {
    expect(drawGrid([{ sport: "nhl" }], { preset: "card" })).toContain('class="ky-bg"');
    expect(drawGrid([{ sport: "nhl" }], { preset: "card", background: "none" })).not.toContain('class="ky-bg"');
    expect(drawGrid([{ sport: "nhl" }], { preset: "phone" })).not.toContain('class="ky-bg"');
    const felt = drawGrid([{ sport: "nhl" }], { background: "felt", id: "f" });
    expect(felt).toContain('fill="url(#f-bg)"');
    expect(felt).toContain('fill="var(--ky-grid-bg)"');
    const photo = drawGrid([{ sport: "nhl" }], { background: { image: "https://example.com/p.jpg", imageOpacity: 0.2 }, id: "f" });
    expect(photo).toContain('href="https://example.com/p.jpg"');
    expect(drawGrid([{ sport: "nhl" }], { background: { image: "javascript:alert(1)" }, id: "f" })).not.toContain('<image class="ky-bg-img"');
    for (const svg of [felt, photo]) {
      const all = ids(svg);
      expect(new Set(all).size).toBe(all.length);
      for (const ref of references(svg)) expect(all).toContain(ref);
    }
  });

  it("gives the same string for the same cells and options, and another for another", () => {
    const a = drawGrid(cellsOf(["nhl", "nba"]), { preset: "card", title: "T" });
    expect(drawGrid(cellsOf(["nhl", "nba"]), { preset: "card", title: "T" })).toBe(a);
    expect(drawGrid(cellsOf(["nhl", "nba"]), { preset: "card", title: "U" })).not.toBe(a);
  });

  it("works with every sport, wide and tall, scored and charted", () => {
    const score = { away: { name: "Gulls", score: 1, color: "#1f5fa8" }, home: { name: "Bison", score: 2, color: "#b5452c" } };
    const cells = SPORTS.flatMap((sport) => [{ sport, ...score }, { sport, orientation: "portrait" as const }]);
    const svg = drawGrid(cells, { width: 1600, id: "all", title: "Every surface" });
    parseXml(svg);
    expect(withClass(parseXml(svg), "ky-g-cell")).toHaveLength(26);
    const all = ids(svg);
    expect(new Set(all).size).toBe(all.length);
    for (const ref of references(svg)) expect(all).toContain(ref);
  });
});

describe("a grid in every renderer", () => {
  const svg = drawGrid([{ drawing: { sport: "nhl", layers: [{ kind: "points", name: "shots", data: [{ x: 160, y: 40 }] }] }, label: "Rink" }, { drawing: { sport: "nba", background: "wood" } }, { sport: "soccer" }], { preset: "card", title: "Grid", background: "felt", id: "r" });

  it("is a scene with every drawing's shapes in its cell, moved and clipped", () => {
    const scene = sceneFromSvg(svg);
    const alone = sceneOf({ sport: "nhl", layers: [{ kind: "points", name: "shots", data: [{ x: 160, y: 40 }] }] });
    expect(scene.viewBox).toEqual({ x: 0, y: 0, w: 1200, h: 675 });
    expect(scene.id).toBe("r");
    expect(scene.title).toBe("Grid");
    expect(scene.items.length).toBeGreaterThan(alone.items.length * 2);
    expect(scene.clips.length).toBeGreaterThanOrEqual(3);
    expect(scene.patterns.length).toBe(2);
    const rink = scene.items.filter((i) => i.data?.sport === "nhl");
    expect(rink.length).toBeGreaterThanOrEqual(alone.items.length - 2);
    expect(rink.every((i) => i.matrix[0] > 1 && i.clips.length > 0)).toBe(true);
    expect(scene.items.some((i) => i.kind === "text" && i.text === "Grid")).toBe(true);
    expect(sceneFromSvg(svg, { theme: "dark" }).theme).toBe("dark");
  });

  it("is flat SVG that needs no stylesheet, a canvas drawing and GeoJSON", () => {
    const flat = sceneToSvg(svg);
    parseXml(flat);
    expect(flat).not.toContain("var(");
    const calls: string[] = [];
    const ctx = new Proxy({ filter: "none" }, { get: (t: Record<string, unknown>, name: string) => (name in t ? t[name] : (...args: unknown[]) => void calls.push(`${name}${args.length}`)), set: (t: Record<string, unknown>, name: string, v) => ((t[name] = v), true) }) as unknown as CanvasContext;
    const done = drawToCanvas(ctx, svg, { width: 1200 });
    expect(done.width).toBe(1200);
    expect(calls.filter((c) => c.startsWith("fillText")).length).toBeGreaterThanOrEqual(2);
    expect(calls.some((c) => c.startsWith("clip"))).toBe(true);
    const geo = sceneToGeoJSON(svg);
    expect(geo.type).toBe("FeatureCollection");
    expect(geo.features.length).toBeGreaterThan(30);
  });

  it("draws a photograph that fills the ground cut at its edges on a canvas", () => {
    const photo = drawKyogijo({ sport: "nhl", id: "ph", background: { image: "https://example.com/wide.jpg", imageOpacity: 0.5 } });
    const log: unknown[][] = [];
    const ctx = new Proxy({ filter: "none" }, { get: (t: Record<string, unknown>, name: string) => (name in t ? t[name] : (...args: unknown[]) => void log.push([name, ...args])), set: (t: Record<string, unknown>, name: string, v) => ((t[name] = v), true) }) as unknown as CanvasContext;
    drawToCanvas(ctx, photo, { width: 800, images: () => ({ width: 400, height: 100 }) });
    const draw = log.find(([name]) => name === "drawImage") as number[] | undefined;
    expect(draw).toBeDefined();
    // A picture four times as wide as it is tall, in a box about twice as wide: scaled to the box's height, so wider than the box, with a clip before it.
    const [, , , , w, h] = draw as number[];
    expect(w / h).toBeCloseTo(4, 3);
    expect(log.findIndex(([name]) => name === "clip")).toBeLessThan(log.findIndex(([name]) => name === "drawImage"));
  });
});
