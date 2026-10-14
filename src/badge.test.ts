import { describe, expect, it } from "vitest";
import { nation } from "../demo/road-data.js";
import { drawKyogijo } from "./draw.ts";
import { textWidth } from "./text.ts";
import type { ScoreOptions, Sport } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const away = nation("aurelia");
const home = nation("calvara");

interface Extent {
  from: number;
  to: number;
}
/** Where a text of the badge lies along the strip, by the package's own measure of its width. */
function extent(node: Node, widen: number): Extent {
  const x = Number(node.attrs.x);
  const size = Number(node.attrs["font-size"]);
  // What a bold face draws is wider than the package's estimate: by a tenth for digits and a fifth for capitals.
  const w = textWidth(node.text.replace(/&amp;/g, "&")) * size * widen;
  const anchor = node.attrs["text-anchor"];
  return anchor === "end" ? { from: x - w, to: x } : anchor === "middle" ? { from: x - w / 2, to: x + w / 2 } : { from: x, to: x + w };
}

/** The gaps in the badge of a team, in strip units: between its code and its score, and between its flag and what is next to it. */
function gaps(svg: string, side: "left" | "right"): { codeToScore: number; flagToCode: number | undefined; scoreSize: number; codeSize: number; flag: boolean } {
  const team = withClass(parseXml(svg), `ky-badge-${side}`)[0];
  const texts = walk(team).filter((n) => n.name === "text");
  const code = texts.find((n) => (n.attrs.class ?? "").includes("ky-name")) as Node;
  const score = texts.find((n) => (n.attrs.class ?? "").includes("ky-score")) as Node;
  const c = extent(code, 1.2);
  const s = extent(score, 1.12);
  const image = walk(team).find((n) => n.name === "image" || (n.attrs.class ?? "").includes("ky-mark"));
  let flagToCode: number | undefined;
  if (image !== undefined) {
    const picture = walk(image).find((n) => n.name === "image") ?? image;
    const ix = Number(picture.attrs.x ?? 0);
    const iw = Number(picture.attrs.width ?? 40);
    flagToCode = side === "left" ? c.from - (ix + iw) : ix - c.to;
  }
  return { codeToScore: side === "left" ? s.from - c.to : c.from - s.to, flagToCode, scoreSize: Number(score.attrs["font-size"]), codeSize: Number(code.attrs["font-size"]), flag: image !== undefined };
}

const badge = (a: number | string, h: number | string, extra: Partial<ScoreOptions> = {}): string => drawKyogijo({ sport: "nba", away: { ...away, score: a }, home: { ...home, score: h }, status: "final", size: "badge", id: "b", ...extra });

describe("the badge's code and score", () => {
  it("keep a gap between them whatever the score, 1, 2 or 3 digits, on either side", () => {
    for (const [a, h] of [[1, 2], [99, 24], [99, 101], [108, 112], [100, 100], [245, 187]] as const) {
      const svg = badge(a, h);
      for (const side of ["left", "right"] as const) {
        const g = gaps(svg, side);
        expect(g.codeToScore, `${a}-${h} ${side}`).toBeGreaterThanOrEqual(9.9);
        if (g.flagToCode !== undefined) expect(g.flagToCode, `${a}-${h} ${side}`).toBeGreaterThanOrEqual(7);
        expect(g.codeSize).toBeGreaterThanOrEqual(8);
        expect(g.scoreSize).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it("lays a short score out as it always was: the score as large as it goes and the code at its largest", () => {
    const g = gaps(badge(2, 1), "left");
    expect(g.scoreSize).toBe(32);
    expect(g.codeSize).toBe(22);
    expect(g.flag).toBe(true);
  });

  it("shrinks the code before the score, and the score before the flag goes", () => {
    const three = gaps(badge(101, 99), "left");
    expect(three.scoreSize).toBeGreaterThanOrEqual(28);
    expect(three.codeSize).toBeLessThan(22);
    expect(three.codeSize).toBeGreaterThanOrEqual(12);
    // A long score (Australian football's `10.12 (72)`) shrinks the score, and the flag goes when the room runs out.
    const long = drawKyogijo({ sport: "afl", away: { ...away, goals: 10, behinds: 12 }, home: { ...home, goals: 9, behinds: 14 }, status: "final", size: "badge", id: "b" });
    for (const side of ["left", "right"] as const) {
      const g = gaps(long, side);
      expect(g.codeToScore, side).toBeGreaterThanOrEqual(9.9);
      expect(g.scoreSize, side).toBeGreaterThanOrEqual(8);
    }
  });

  it("holds for every sport, with round marks, in Japanese, and in the strip of a compact card", () => {
    for (const sport of ["nfl", "nhl", "nba", "mlb", "soccer", "cricket", "rugby", "afl"] as Sport[]) {
      for (const extra of [{}, { markShape: "round" }, { language: "ja" }, { size: "compact" }] as Partial<ScoreOptions>[]) {
        const svg = drawKyogijo({ sport, away: { ...away, score: 108 }, home: { ...home, score: 112 }, status: "final", size: "badge", id: "b", ...extra });
        for (const side of ["left", "right"] as const) expect(gaps(svg, side).codeToScore, `${sport} ${JSON.stringify(extra)} ${side}`).toBeGreaterThanOrEqual(9.9);
      }
    }
    const jaNames = drawKyogijo({ sport: "nba", away: { name: "山頂ピークス", abbr: "山頂", score: 108, logo: away.logo }, home: { name: "メトロボルツ", abbr: "メトロ", score: 112, logo: home.logo }, status: "final", size: "badge", language: "ja", id: "b" });
    for (const side of ["left", "right"] as const) expect(gaps(jaNames, side).codeToScore, side).toBeGreaterThanOrEqual(9.9);
  });
});
