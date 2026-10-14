import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { evaluate, lengthOf, matched, parseStylesheet, substitute, type CssNode } from "./scene.css.ts";
import { sceneToSvg } from "./scene.flat.ts";
import { corpus, GAME } from "./scene.fixture.ts";
import { boundsOf, flatten, multiply, parseTransform, pathCommands, shapeCommands } from "./scene.path.ts";
import { sceneFromSvg, sceneOf } from "./scene.ts";
import type { SceneItem } from "./scene.types.ts";
import { elements, parseSvg, textOf, writeSvg, type SvgNode } from "./scene.xml.ts";
import { parseXml } from "./xml.fixture.ts";

const all = corpus();

describe("the SVG tree", () => {
  it("writes every drawing of the package back byte for byte", () => {
    expect(all.length).toBeGreaterThan(100);
    for (const d of all) expect(writeSvg(parseSvg(d.svg)) === d.svg, d.name).toBe(true);
  });

  it("is the same text for a drawing with the same options, which is what the existing snapshots hold: the drawing is written by one piece of code and a scene is only read from it", () => {
    const before = hash(all.map((d) => d.svg).join("\n"));
    for (const d of all) sceneFromSvg(d.svg);
    for (const d of all) sceneFromSvg(d.svg, { theme: "dark" });
    expect(hash(corpus().map((d) => d.svg).join("\n"))).toBe(before);
    expect(drawKyogijo({ sport: "nhl", ...GAME })).toBe(all.find((d) => d.name === "nhl score")?.svg);
  }, 30_000);

  it("reads entities, empty and non-empty elements, and says where a drawing is not well formed", () => {
    const tree = parseSvg('<svg a="1 &amp; 2"><g/><text>a &lt; b</text><title></title></svg>');
    expect(tree.attrs.a).toBe("1 &amp; 2");
    expect(elements(tree).map((n) => [n.name, n.empty])).toEqual([["g", true], ["text", false], ["title", false]]);
    expect(textOf(elements(tree)[1])).toBe("a < b");
    expect(() => parseSvg("<svg><g></svg>")).toThrow(/closes <g>/);
    expect(() => parseSvg("<svg><g>")).toThrow(/not closed/);
    expect(() => parseSvg('<svg a=1/>')).toThrow(/not well-formed/);
    expect(() => parseSvg("<a/><b/>")).toThrow(/One root/);
  });
});

describe("the stylesheet reader", () => {
  const node = (name: string, attrs: Record<string, string>, parent?: CssNode): CssNode => ({ name, attrs, parent });
  const html = (theme: string): CssNode => node("html", { "data-theme": theme });

  it("matches classes, attributes, tags, descendants and children, and weighs :where() as nothing", () => {
    const sheet = parseStylesheet(".a .b{fill:red}.a>.c{fill:blue}.b{fill:green}:where(.b){fill:pink}.x[data-k=v]{stroke:1}pattern circle{fill:black}", "light");
    const a = node("g", { class: "a" });
    const b = node("path", { class: "b" }, node("g", {}, a));
    expect(matched(sheet, b).map(([, v]) => v)).toEqual(["pink", "green", "red"]);
    expect(matched(sheet, node("path", { class: "c" }, node("g", {}, a))).length).toBe(0);
    expect(matched(sheet, node("path", { class: "c" }, a)).map(([, v]) => v)).toEqual(["blue"]);
    expect(matched(sheet, node("rect", { class: "x", "data-k": "v" })).map(([n]) => n)).toEqual(["stroke"]);
    expect(matched(sheet, node("circle", {}, node("pattern", {}))).map(([, v]) => v)).toEqual(["black"]);
  });

  it("takes the dark rules in dark and not in light, and `data-theme` on the drawing over the page's", () => {
    const media = ":where(.k){--c:white}@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .k:not([data-theme=light])){--c:black}}";
    const forced = ":where(html[data-theme=dark] .k,.k[data-theme=dark]){--c:black}";
    const value = (css: string, theme: "light" | "dark", own: Record<string, string>): string | undefined => matched(parseStylesheet(css, theme), node("svg", { class: "k", ...own }, html(theme))).at(-1)?.[1];
    expect(value(media + forced, "light", {})).toBe("white");
    expect(value(media + forced, "dark", {})).toBe("black");
    expect(value(media + forced, "light", { "data-theme": "dark" })).toBe("black");
    // The media rule leaves out a drawing that says it is light.
    expect(value(media, "dark", { "data-theme": "light" })).toBe("white");
    expect(value(media, "dark", { "data-theme": "dark" })).toBe("black");
    expect(value(media, "light", {})).toBe("white");
  });

  it("works out var() with a fallback, em, px and calc()", () => {
    expect(substitute("var(--a)", { "--a": "red" })).toBe("red");
    expect(substitute("var(--a,var(--b,blue))", { "--b": "green" })).toBe("green");
    expect(substitute("var(--missing)", {})).toBeUndefined();
    expect(substitute("var(--a)", { "--a": "var(--a)" })).toBeUndefined();
    expect(substitute("calc(var(--w,.3)*1px)", {})).toBe("calc(.3*1px)");
    expect(lengthOf("calc(.3*2.2px)", 10)).toBeCloseTo(0.66);
    expect(lengthOf(".14em", 10)).toBeCloseTo(1.4);
    expect(lengthOf("3px", 10)).toBe(3);
    expect(lengthOf("big", 10)).toBeUndefined();
    expect(evaluate("calc(.3*3px) calc(2+1)", 16)).toBe("0.8999999999999999 3");
  });
});

describe("path data and transforms", () => {
  it("reads relative commands, implicit line-tos, H and V, and closes back to the start", () => {
    expect(pathCommands("M1 1h2v3H0ZM5 5 6 6l1 1").map((c) => c.join(" "))).toEqual(["M 1 1", "L 3 1", "L 3 4", "L 0 4", "Z", "M 5 5", "L 6 6", "L 7 7"]);
    expect(pathCommands("M0 0C1 1 2 2 3 3S5 5 6 6Q1 1 2 2T4 4").map((c) => c.join(" "))).toEqual(["M 0 0", "C 1 1 2 2 3 3", "C 4 4 5 5 6 6", "Q 1 1 2 2", "Q 3 3 4 4"]);
    expect(() => pathCommands("M0")).toThrow(/Cannot read/);
    expect(() => pathCommands("M0 0X1")).toThrow(/Cannot read|Unknown/);
  });

  it("turns an arc into curves that end where it ends and stay on the circle, even with its flags written without spaces", () => {
    const quarter = pathCommands("M10 0A10 10 0 0 1 0 10");
    expect(quarter.map((c) => c[0])).toEqual(["M", "C"]);
    const [, , , , , ex, ey] = quarter[1] as readonly ["C", number, number, number, number, number, number];
    expect([ex, ey]).toEqual([0, 10]);
    for (const [x, y] of flatten(quarter, undefined, 0.01).flatMap((r) => r.points)) expect(Math.hypot(x, y)).toBeCloseTo(10, 1);
    // The same arc with its flags run together with the next number, and relative.
    expect(pathCommands("M10 0a10 10 0 01-10 10")).toEqual(quarter);
    // A large arc takes the long way round: it has more curves than the quarter, and still ends where it should.
    const large = pathCommands("M10 0A10 10 0 1 1 0 10");
    expect(large.length).toBeGreaterThan(quarter.length);
    expect(large.at(-1)?.slice(-2)).toEqual([0, 10]);
    // Its circle is the other one through the two ends, centred on (10, 10).
    for (const [x, y] of flatten(large, undefined, 0.01).flatMap((r) => r.points)) expect(Math.hypot(x - 10, y - 10)).toBeCloseTo(10, 1);
    // Radii too small to reach are made larger, as the specification says.
    const stretched = pathCommands("M0 0A1 1 0 0 1 10 0");
    expect(stretched.at(-1)?.slice(-2)).toEqual([10, 0]);
  });

  it("reads transforms and multiplies them in the order a browser does", () => {
    expect(parseTransform("translate(10 20) scale(2)")).toEqual([2, 0, 0, 2, 10, 20]);
    const [a, b, c, d, e, f] = parseTransform("rotate(90 5 5)");
    expect([a, b, c, d].map((v) => Math.round(v))).toEqual([0, 1, -1, 0]);
    expect([e, f].map((v) => Math.round(v))).toEqual([10, 0]);
    expect(parseTransform("matrix(0 1 -1 0 18.58 3)")).toEqual([0, 1, -1, 0, 18.58, 3]);
    expect(multiply([2, 0, 0, 2, 0, 0], [1, 0, 0, 1, 3, 4])).toEqual([2, 0, 0, 2, 6, 8]);
    expect(parseTransform(undefined)).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it("gives every shape as segments, and a rounded rectangle's box is its own", () => {
    const scene = sceneOf({ sport: "nhl", ...GAME, id: "p" });
    for (const item of scene.items) if (item.kind !== "text" && item.kind !== "image") expect(shapeCommands(item).length, item.class).toBeGreaterThan(1);
    const rounded = scene.items.find((i) => i.kind === "rect" && i.rx > 0);
    expect(rounded?.kind === "rect" && boundsOf(rounded)?.w).toBeCloseTo(rounded?.kind === "rect" ? rounded.width : 0, 1);
  });
});

describe("a scene", () => {
  const paintedElements = (svg: string): SvgNode[] => walk2(parseSvg(svg));
  function walk2(root: SvgNode): SvgNode[] {
    const out: SvgNode[] = [];
    const visit = (n: SvgNode, hidden: boolean): void => {
      const skip = hidden || ["defs", "clipPath", "pattern", "linearGradient", "title", "desc", "style"].includes(n.name);
      if (!skip && ["rect", "circle", "ellipse", "line", "polygon", "polyline", "path", "image"].includes(n.name)) out.push(n);
      if (!skip && n.name === "text") {
        const spans = elements(n).filter((c) => c.name === "tspan");
        if (spans.length === 0) out.push(n);
        else out.push(...spans);
      }
      for (const c of elements(n)) visit(c, skip);
    };
    visit(root, false);
    return out;
  }

  it("has one item for each painted element of the drawing, in order, for every drawing of the package", () => {
    for (const d of all) {
      const scene = sceneFromSvg(d.svg);
      const painted = paintedElements(d.svg);
      expect(scene.items.length, d.name).toBe(painted.length);
      scene.items.forEach((item, i) => expect(item.kind === "path" ? "path" : item.kind === "text" ? painted[i].name === "tspan" ? "tspan" : "text" : item.kind, `${d.name} #${i}`).toBe(painted[i].name === "tspan" ? "tspan" : painted[i].name));
    }
  });

  it("works the colours out for light and for dark, as the stylesheet says them", () => {
    const light = sceneOf({ sport: "nhl", id: "t" }, { theme: "light" });
    const dark = sceneOf({ sport: "nhl", id: "t" }, { theme: "dark" });
    expect([light.items[0].style.fill, dark.items[0].style.fill]).toEqual(["#d3dbe1", "#1a2025"]);
    expect(light.theme).toBe("light");
    // A drawing made for dark is read as dark without being asked.
    expect(sceneOf({ sport: "nhl", id: "t", theme: "dark" }).items[0].style.fill).toBe("#1a2025");
    expect(sceneOf({ sport: "nhl", id: "t", theme: "dark" }).theme).toBe("dark");
    // The drawing's own colours (custom properties on its root) win over the stylesheet's.
    const team = sceneOf({ sport: "nhl", ...GAME });
    const paint = team.items.find((i) => i.class.includes("ky-paint-left"));
    expect(paint?.style.fill).toBe("#1f5fa8");
    expect(paint?.style.paintOrder).toBe("stroke");
    expect(paint?.style.stroke).toBe("rgba(255,255,255,.92)");
  });

  it("reads a drawing made without its stylesheet with the package's own, and a page's rules after it", () => {
    const bare = drawKyogijo({ sport: "nhl", id: "t", style: "none" });
    expect(bare.includes("<style")).toBe(false);
    expect(sceneFromSvg(bare).items[0].style.fill).toBe("#d3dbe1");
    expect(sceneFromSvg(bare, { css: ".kyogijo .ky-apron{fill:#123456}" }).items[0].style.fill).toBe("#123456");
  });

  it("carries the transform of every group and the quarter turn of a tall drawing", () => {
    const tall = sceneOf({ sport: "nhl", id: "t", orientation: "portrait" });
    expect(tall.orientation).toBe("portrait");
    expect(tall.turn?.slice(0, 4)).toEqual([0, 1, -1, 0]);
    expect(tall.viewBox.w).toBeLessThan(tall.viewBox.h);
    expect(tall.items.every((i) => i.surface === true)).toBe(true);
    expect(sceneOf({ sport: "nhl", id: "t" }).turn).toBeUndefined();
    const rotated = tall.items.find((i) => i.kind === "text" && i.matrix[0] !== 0) ?? tall.items[0];
    expect(rotated.matrix.length).toBe(6);
  });

  it("lists a text of several lines as one text for each line, at its own place", () => {
    const heat = all.find((d) => d.name === "chart nfl");
    const texts = sceneFromSvg(heat?.svg ?? "").items.filter((i) => i.kind === "text");
    expect(texts.some((t) => t.kind === "text" && t.text === "11/15")).toBe(true);
    const lines = texts.filter((t) => t.kind === "text" && (t.text === "73.3%" || t.text === "11/15"));
    expect(lines.length).toBe(2);
    expect(lines[0].kind === "text" && lines[1].kind === "text" && lines[0].x === lines[1].x && lines[0].y !== lines[1].y).toBe(true);
  });

  it("keeps clips, a gradient and a pattern, and resolves the colour of a gradient's stops", () => {
    const layers = sceneOf({ sport: "nhl", id: "t", layers: [{ kind: "arrows", team: "home", data: [{ x: 20, y: 20, x2: 120, y2: 60 }], style: { comet: {} } }] as never });
    expect(layers.clips.length).toBe(1);
    expect(layers.clips[0].shapes[0].kind).toBe("path");
    const clipped = layers.items.filter((i) => i.clips.length > 0);
    expect(clipped.length).toBeGreaterThan(0);
    expect(layers.gradients.length).toBe(1);
    expect(layers.gradients[0].stops.map((s) => s.offset)).toEqual([0, 1]);
    expect(layers.gradients[0].stops[0].opacity).toBeCloseTo(0.05);
    expect(layers.gradients[0].stops[0].color).toBe(layers.gradients[0].stops[1].color);
    expect(clipped.some((i) => typeof i.style.stroke === "object" && "gradient" in i.style.stroke)).toBe(true);
    const curling = sceneOf({ sport: "curling", id: "t", sheet: { pebble: true } });
    expect(curling.patterns.length).toBe(1);
    expect(curling.patterns[0].shapes.length).toBe(5);
    expect(curling.items.some((i) => typeof i.style.fill === "object" && "pattern" in i.style.fill)).toBe(true);
  });

  it("applies a group's filter to the shapes in it, and its opacity multiplied", () => {
    const scene = sceneOf({ sport: "nhl", ...GAME });
    const banner = scene.items.find((i) => i.style.filter !== undefined);
    expect(banner?.style.filter).toBe("grayscale(.35) brightness(.92)");
    expect(scene.items.some((i) => i.style.opacity < 1 && i.style.opacity > 0)).toBe(true);
  });

  it("reads the options of drawKyogijo, an SVG string, or a scene already made", () => {
    const options = { sport: "nba", id: "same" } as const;
    const a = sceneOf(options);
    expect(sceneOf(drawKyogijo(options))).toEqual(a);
    expect(sceneOf(a)).toBe(a);
    expect(() => sceneFromSvg("<g/>")).toThrow(/<svg> is expected/);
    expect(a.title).toBe("NBA basketball court");
    expect(a.sport).toBe("nba");
    expect(a.id).toBe("same");
  });

  it("is plain data: it survives JSON and holds no function", () => {
    for (const d of all.slice(0, 60)) {
      const scene = sceneFromSvg(d.svg);
      expect(JSON.parse(JSON.stringify(scene))).toEqual(scene);
    }
  });
});

describe("the SVG without a stylesheet", () => {
  const strict = (svg: string): SvgNode => {
    parseXml(svg);
    return parseSvg(svg);
  };

  it("is well formed for every drawing, in light and dark, with no variable, no style element and no class rule left to read", () => {
    for (const d of all) {
      for (const theme of ["light", "dark"] as const) {
        const svg = sceneToSvg(d.svg, { theme });
        const root = strict(svg);
        expect(svg.includes("var("), d.name).toBe(false);
        expect(svg.includes("<style"), d.name).toBe(false);
        expect(root.name).toBe("svg");
      }
    }
  });

  it("has as many shapes as the scene has items, and a group for each run of clipped shapes", () => {
    const d = all.find((one) => one.name === "comet arrows and halo text");
    const scene = sceneFromSvg(d?.svg ?? "");
    const svg = sceneToSvg(scene);
    const shapes = walkAll(parseSvg(svg)).filter((n) => ["rect", "circle", "ellipse", "line", "polygon", "polyline", "path", "text", "image"].includes(n.name) && !n.attrs["data-def"]);
    const inDefs = walkAll(parseSvg(svg)).filter((n) => n.name === "defs").flatMap((n) => walkAll(n)).filter((n) => ["rect", "circle", "path", "text"].includes(n.name)).length;
    expect(shapes.length - inDefs).toBe(scene.items.length);
    expect(svg.match(/clip-path="url\(#snap-clip0\)"/g)?.length ?? svg.match(/clip-path="url\(#[^)]+\)"/g)?.length).toBe(1);
    expect(svg).toContain("<linearGradient");
  });

  it("is sized by the width or the height, keeping its shape, and can have a background", () => {
    const svg = sceneToSvg({ sport: "nhl", id: "s" }, { width: 800, background: "#fff" });
    expect(svg).toMatch(/width="800" height="374"/);
    expect(sceneToSvg({ sport: "nhl", id: "s" }, { height: 101 })).toMatch(/width="216" height="101"/);
    const bare = sceneToSvg({ sport: "nhl", id: "s" });
    expect(bare.slice(0, bare.indexOf(">"))).not.toMatch(/ width=/);
    expect(svg).toContain('fill="#fff"');
  });

  it("writes text with its quotes and ampersands safe, and a halo as a stroke painted first", () => {
    const svg = sceneToSvg({ sport: "nhl", ...GAME });
    expect(svg).toMatch(/paint-order="stroke"/);
    expect(svg).toMatch(/font-family="system-ui,-apple-system,&quot;Segoe UI&quot;/);
    const text = sceneToSvg({ sport: "nhl", id: "q", layers: [{ kind: "text", data: [{ x: 50, y: 50, text: 'A & "B" <c>' }] }] as never });
    expect(parseSvg(text)).toBeTruthy();
    expect(text).toContain('A &amp; "B" &lt;c&gt;');
  });
});

function walkAll(node: SvgNode): SvgNode[] {
  return [node, ...elements(node).flatMap(walkAll)];
}

describe("every item", () => {
  it("has finite numbers, a matrix of six, a style with a colour or a reference, and clips that exist", () => {
    for (const d of all) {
      const scene = sceneFromSvg(d.svg);
      const finite = (v: unknown, where: string): void => {
        if (typeof v === "number") expect(Number.isFinite(v), where).toBe(true);
        else if (Array.isArray(v)) v.forEach((x, i) => finite(x, `${where}[${i}]`));
        else if (v !== null && typeof v === "object") for (const [k, x] of Object.entries(v)) finite(x, `${where}.${k}`);
      };
      scene.items.forEach((item: SceneItem, i) => {
        finite(item, `${d.name} #${i}`);
        expect(item.matrix.length).toBe(6);
        for (const clip of item.clips) expect(scene.clips[clip], d.name).toBeDefined();
        for (const paint of [item.style.fill, item.style.stroke]) if (typeof paint === "object") expect("gradient" in paint ? scene.gradients.some((g) => g.id === paint.gradient) : scene.patterns.some((p) => p.id === paint.pattern), d.name).toBe(true);
      });
    }
  });
});
