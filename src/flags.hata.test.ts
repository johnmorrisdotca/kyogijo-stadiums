// The real set: Hata's flags (@johnmorrisdotca/hata, a development dependency, never a runtime one), loaded first as its `flag()` is asynchronous, plugged in as a synchronous lookup, and drawn. This is the adapter
// of docs/flags.md, which Taisen Brackets and Dougu Sports take unchanged.
import { flag } from "@johnmorrisdotca/hata/load";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FLAG_CODES, NATIONS } from "../demo/nations.js";
import { drawKyogijo } from "./draw.ts";
import { useFlags, type FlagRenderer, type FlagShape } from "./flags-source.ts";
import { flagPicture } from "./logo.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

/** How each of the three shapes is asked of Hata. */
const FRAMING: Record<FlagShape, "round" | "1:1" | "flag"> = { round: "round", square: "1:1", rect: "flag" };
const loaded: Record<string, Record<string, string>> = {};
/** The adapter: a synchronous lookup over the flags loaded first. */
const render: FlagRenderer = (code, { shape }) => loaded[shape]?.[code.toUpperCase()];

beforeAll(async () => {
  for (const shape of Object.keys(FRAMING) as FlagShape[]) {
    loaded[shape] = Object.fromEntries(await Promise.all(FLAG_CODES.map(async (code) => [code, (await flag(code, { shape: FRAMING[shape] })) as string])));
  }
  useFlags(render);
});
afterAll(() => useFlags(undefined));

const decode = (href: string): string => decodeURIComponent(href.slice(href.indexOf(",") + 1));
const images = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "image").map((n) => decode(n.attrs.href ?? ""));

describe("Hata's flags plugged in", () => {
  it("has a flag in every shape for every country of the demo", () => {
    for (const shape of Object.keys(FRAMING)) for (const code of FLAG_CODES) expect(loaded[shape][code], `${code} ${shape}`).toMatch(/^<svg\b/);
    expect(FLAG_CODES).toContain("GB-ENG");
  });

  it("draws every country of the demo in a round mark, on a plain mark, on a carpet and on a stage, as an image that holds the flag and nothing that runs", () => {
    for (const [key, n] of Object.entries(NATIONS)) {
      for (const extra of [{ markShape: "round" as const }, {}, { pageant: "carpet" as const }, { pageant: "stage" as const }, { size: "badge" as const }]) {
        const svg = drawKyogijo({ sport: "soccer", away: { name: n.name, abbr: n.abbr, score: 1, color: n.color, flag: n.flag }, home: { name: "Japan", abbr: "JPN", score: 0, color: "#bc002d", flag: "JP" }, status: "final", ...extra });
        const docs = images(svg);
        expect(docs.length, `${key} ${JSON.stringify(extra)}`).toBeGreaterThanOrEqual(2);
        for (const doc of docs) expect(doc).not.toMatch(/<script|<foreignObject|\son[a-z]+\s*=|javascript:/i);
      }
    }
  });

  it("a round flag is Hata's round frame, and a plain one its own proportions: Canada's is twice as wide as it is tall", () => {
    const round = decode(flagPicture("CA", "round", 48) as string);
    expect(round).toContain('viewBox="0 0 512 512"');
    const own = decode(flagPicture("CA", "rect", 48) as string);
    const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(own) ?? [];
    expect(Number(w) / Number(h)).toBeCloseTo(2, 5);
    expect(decode(flagPicture("GB-ENG", "round", 48) as string)).toContain("<svg");
  });

  it("a code Hata has no flag for draws the team as it was, and a lower-case code is the same flag", () => {
    const team = (flag: string) => ({ name: "Atlantis", abbr: "ATL", score: 1, color: "#123456", flag });
    const game = (flag: string) => drawKyogijo({ sport: "nhl", away: team(flag), home: { name: "Japan", abbr: "JPN", score: 0, color: "#bc002d" }, status: "final", id: "h" });
    expect(images(game("ZZ"))).toHaveLength(0);
    expect(images(game("ca"))).toEqual(images(game("CA")));
  });

  it("round flags turn with the team's name on a sideways pitch end: the mark and the name are turned by the same angle (0.6.2)", () => {
    // The turn a node has on the screen: the `rotate` and `matrix` of every group it lies in (a tall drawing turns its surface by a matrix), summed.
    const turnOf = (root: Node, target: Node): number => {
      const path = (node: Node, trail: Node[]): Node[] | undefined => (node === target ? [...trail, node] : node.children.map((c) => path(c, [...trail, node])).find((p) => p !== undefined));
      const angle = (t: string | undefined): number => {
        const m = /matrix\((-?[\d.]+) (-?[\d.]+) /.exec(t ?? "");
        if (m !== null) return (Math.atan2(Number(m[2]), Number(m[1])) * 180) / Math.PI;
        return Number(/rotate\((-?[\d.]+)/.exec(t ?? "")?.[1] ?? 0);
      };
      return (path(root, []) ?? []).reduce((sum, n) => sum + angle(n.attrs.transform), 0);
    };
    // Along a pitch's ends the words read up the left end and down the right one; in a tall drawing they are upright. The flag does the same.
    const wanted = { landscape: [-90, 90], portrait: [0, 0] } as const;
    for (const orientation of ["landscape", "portrait"] as const) {
      const doc = parseXml(drawKyogijo({ sport: "soccer", markShape: "round", orientation, away: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e", flag: "CA" }, home: { name: "Japan", abbr: "JPN", score: 1, color: "#bc002d", flag: "JP" }, status: "final", id: "t" }));
      const banners = withClass(doc, "ky-banner");
      expect(banners).toHaveLength(2);
      const turns = banners.map((banner) => {
        const mark = withClass(banner, "ky-mark")[0];
        const name = withClass(banner, "ky-name")[0];
        expect(mark.attrs.transform).toBeUndefined();
        expect(walk(mark).some((n) => n.name === "image")).toBe(true);
        expect(turnOf(doc, mark)).toBeCloseTo(turnOf(doc, name), 6);
        return Math.round(turnOf(doc, mark));
      });
      expect(turns).toEqual(wanted[orientation]);
    }
  });
});
