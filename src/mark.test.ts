import { describe, expect, it } from "vitest";
import { nation } from "../demo/road-data.js";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import { KYOGIJO_MARK_STYLE, roundMarkup } from "./mark.ts";
import { sceneFromSvg } from "./scene.ts";
import type { ScoreOptions, Sport } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const away = { ...nation("aurelia"), score: 2, penalties: 4 };
const home = { ...nation("calvara"), score: 2, penalties: 3 };
const game = (extra: Partial<ScoreOptions> = {}): ScoreOptions => ({ sport: "soccer", home, away, status: "final-pens", competition: "Northern Cup final", id: "m", ...extra });
const parse = (svg: string): Node => parseXml(svg);
const count = (svg: string, name: string): number => walk(parse(svg)).filter((n) => n.name === name).length;
const marks = (svg: string): Node[] => withClass(parse(svg), "ky-mark");

describe("the round team mark in a score", () => {
  it("is off unless asked for: a score with logos is the same text with `markShape: plain` as without, and has no mark", () => {
    const svg = drawKyogijo(game());
    expect(drawKyogijo(game({ markShape: "plain" }))).toBe(svg);
    expect(marks(svg)).toEqual([]);
    expect(svg).not.toContain("ky-mark");
    expect(count(svg, "image")).toBe(2);
  });

  it("is asked for by the score (`markShape`) or by a team (`mark`), and a team's own word wins", () => {
    expect(marks(drawKyogijo(game({ markShape: "round" }))).length).toBe(2);
    expect(marks(drawKyogijo(game({ home: { ...home, mark: "round" } }))).length).toBe(1);
    expect(marks(drawKyogijo(game({ markShape: "round", home: { ...home, mark: "plain" } }))).length).toBe(1);
    expect(marks(drawKyogijo(game({ markShape: "round", away: { ...away, mark: "plain" }, home: { ...home, mark: "plain" } }))).length).toBe(0);
    expect(marks(drawKyogijo(game({ markShape: "sideways" as never }))).length).toBe(0);
  });

  it("clips each flag to a circle of its own and rings it, on each side of the pitch, wide and tall", () => {
    for (const orientation of ["landscape", "portrait"] as const) {
      const svg = drawKyogijo(game({ markShape: "round", orientation }));
      const doc = parse(svg);
      const clips = walk(doc).filter((n) => n.name === "clipPath");
      expect(clips.map((c) => c.attrs.id)).toEqual(["m-mk-home-c", "m-mk-away-c"]);
      const images = walk(doc).filter((n) => n.name === "image");
      expect(images.map((i) => i.attrs["clip-path"])).toEqual(["url(#m-mk-home-c)", "url(#m-mk-away-c)"]);
      expect(images.every((i) => i.attrs.preserveAspectRatio === "xMidYMid slice")).toBe(true);
      expect(withClass(doc, "ky-mark-ring").length).toBe(2);
      expect(withClass(doc, "ky-mark-edge").length).toBe(2);
      expect(withClass(doc, "ky-banner").length).toBe(2);
      // The teams' names are still written.
      expect(withClass(doc, "ky-name").map((n) => n.text).join(" ")).toMatch(/AURELIA/);
    }
  });

  it("keeps a flag upright where the words are turned: along a pitch's ends, and in a tall drawing", () => {
    const wide = marks(drawKyogijo(game({ markShape: "round", orientation: "landscape" })));
    expect(wide.map((m) => m.attrs.transform?.replace(/[\d.-]+ [\d.-]+\)$/, ")"))).toEqual(["rotate(90 )", "rotate(-90 )"]);
    const tall = marks(drawKyogijo(game({ markShape: "round", orientation: "portrait" })));
    expect(tall.every((m) => m.attrs.transform?.startsWith("rotate(90 "))).toBe(true);
    // A rink's names lie flat: nothing to turn back.
    expect(marks(drawKyogijo(game({ sport: "nhl", markShape: "round", orientation: "landscape" }))).every((m) => m.attrs.transform === undefined)).toBe(true);
  });

  it("draws a team with no logo as its initials on its colour in the banner, and a bad address the same way", () => {
    const svg = drawKyogijo(game({ markShape: "round", home: { name: "Calvara", color: "#6b2d5c", score: 1 }, away: { name: "Aurelia", logo: "javascript:alert(1)", color: "#0f7a7a", score: 0 } }));
    expect(count(svg, "image")).toBe(0);
    expect(count(svg, "clipPath")).toBe(0);
    expect(withClass(parse(svg), "ky-mark-i").map((n) => n.text)).toEqual(["CAL", "AUR"]);
    expect(svg).not.toContain("javascript:");
    expect(marks(svg).map((m) => m.attrs.style)).toEqual(["--c:#6b2d5c;--ci:#ffffff", "--c:#0f7a7a;--ci:#ffffff"]);
    // The ink follows the colour.
    expect(marks(drawKyogijo(game({ markShape: "round", home: { name: "Calvara", color: "#f2c230" } })))[0].attrs.style).toContain("--ci:#161a18");
  });

  it("shows a crest whole on a plain disc when asked to `contain`", () => {
    const svg = drawKyogijo(game({ markShape: "round", home: { ...home, markFit: "contain" } }));
    const images = walk(parse(svg)).filter((n) => n.name === "image");
    expect(images.map((i) => i.attrs.preserveAspectRatio)).toEqual(["xMidYMid meet", "xMidYMid slice"]);
    expect(withClass(parse(svg), "ky-mark-light").length).toBe(1);
  });

  it("works in the badge and in the strip of a compact card: a round logo, and nothing where there is none", () => {
    for (const size of ["badge", "compact"] as const) {
      const svg = drawKyogijo(game({ markShape: "round", size }));
      expect(marks(svg).length, size).toBe(2);
      expect(count(svg, "clipPath"), size).toBe(2);
      const bare = drawKyogijo(game({ markShape: "round", size, home: { ...home, logo: undefined }, away: { ...away, logo: undefined } }));
      expect(marks(bare).length, size).toBe(0);
    }
  });

  it("writes the mark's rules only into a drawing that has a mark, and into the page's stylesheet", () => {
    expect(walk(parse(drawKyogijo(game({ markShape: "round" })))).find((n) => n.name === "style")?.text).toContain(KYOGIJO_MARK_STYLE);
    expect(walk(parse(drawKyogijo(game()))).find((n) => n.name === "style")?.text).not.toContain(".ky-mark-ring");
    expect(walk(parse(drawKyogijo(game({ markShape: "round", style: "none" })))).some((n) => n.name === "style")).toBe(false);
    expect(KYOGIJO_STYLE).toContain(KYOGIJO_MARK_STYLE);
  });

  it("draws on every surface that has a place for the teams, well formed, with ids that are unique; curling, the net sports (netball excepted: its score is the usual one) and cricket have the board, so no mark", () => {
    const boards = new Set(["curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "cricket"]);
    for (const sport of SPORTS as readonly Sport[]) {
      const svg = drawKyogijo(game({ sport, markShape: "round", status: "final" }));
      const doc = parse(svg);
      const ids = walk(doc).flatMap((n) => (n.attrs.id === undefined ? [] : [n.attrs.id]));
      expect(new Set(ids).size, sport).toBe(ids.length);
      expect(marks(svg).length, sport).toBe(boards.has(sport) ? 0 : 2);
    }
  });

  it("stays within a budget on a soccer pitch", () => {
    expect(drawKyogijo(game({ markShape: "round" })).length).toBeLessThan(17_500);
    expect(drawKyogijo(game({ markShape: "round", size: "badge" })).length).toBeLessThan(14_500);
  });

  it("is read by the renderers as a clipped picture and rings", () => {
    const scene = sceneFromSvg(drawKyogijo(game({ markShape: "round", orientation: "landscape" })));
    const images = scene.items.filter((item) => item.kind === "image");
    expect(images.length).toBe(2);
    expect(images.every((item) => item.clips.length === 1)).toBe(true);
    expect(scene.clips.every((clip) => clip.shapes.length === 1 && clip.shapes[0].kind === "circle")).toBe(true);
  });
});

describe("roundMarkup", () => {
  it("is a disc, the picture clipped to it, a ring inside the edge and a hairline outside it", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${roundMarkup({ id: "t", cx: 10, cy: 20, r: 5, href: "https://example.com/a.svg", title: "A & B" })}</svg>`;
    const doc = parse(svg);
    const ring = withClass(doc, "ky-mark-ring")[0];
    expect(Number(ring.attrs.r)).toBeLessThan(5);
    expect(Number(withClass(doc, "ky-mark-edge")[0].attrs.r)).toBe(5);
    expect(walk(doc).find((n) => n.name === "title")?.text).toBe("A &amp; B");
    expect(walk(doc).find((n) => n.name === "clipPath")?.children[0].attrs).toEqual({ cx: "10", cy: "20", r: "5" });
  });

  it("makes the letters fit the circle and takes only a safe colour", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${roundMarkup({ id: "t", cx: 0, cy: 0, r: 10, initials: "WWW", color: "red;fill:url(x)" })}</svg>`;
    const doc = parse(svg);
    const letters = withClass(doc, "ky-mark-i")[0];
    expect(Number(letters.attrs["font-size"])).toBeLessThanOrEqual(8);
    expect(withClass(doc, "ky-mark")[0].attrs.style).toBe("--ci:#ffffff");
  });
});
