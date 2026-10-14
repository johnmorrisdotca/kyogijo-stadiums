import { describe, expect, it } from "vitest";
import { ROAD_FINAL, SERIES_LABELS, nation, roadFinalists, roadSeries } from "../demo/road-data.js";
import { ROAD_SIZES, roadToFinal } from "./charts-entry.ts";
import { drawGrid } from "./layout.ts";
import { mergeRounds, scoreText } from "./road.model.ts";
import type { RoadFinalist, RoadMatch, RoadOptions, RoadSize } from "./road.types.ts";
import { sceneFromSvg } from "./scene.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { textWidth } from "./text.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

/** Eight small emblems, one for each club of the demo's series. */
const EMBLEMS: Record<string, string> = Object.fromEntries(["gull", "owl", "bolt", "peak", "star", "pine", "anchor", "bison"].map((key, i) => [key, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><path d="M${10 + i * 5} 56Q32 18 50 50Q68 18 88 56Q68 46 50 72Q32 46 ${10 + i * 5} 56Z" fill="#1f5fa8"/></svg>`]));
const SIZES = Object.keys(ROAD_SIZES) as RoadSize[];
const finalists = (language: "en" | "ja" = "en"): [RoadFinalist, RoadFinalist] => roadFinalists(language);
const parse = (svg: string): Node => parseXml(svg);
const textsOf = (svg: string, cls: string): string[] => withClass(parse(svg), cls).map((n) => n.text);
const markCount = (svg: string): number => withClass(parse(svg), "ky-mark").length;
const viewBox = (svg: string): number[] => parse(svg).attrs.viewBox.split(" ").map(Number);

/** The drawing's structure: how many of each element and class it is made of. */
function structure(svg: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of walk(parse(svg))) {
    const key = node.attrs.class === undefined ? node.name : `${node.name}.${node.attrs.class.split(" ").sort().join(".")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

/** A finalist with a path of `n` rounds taken from the demo's four, repeated and renamed as needed, and its group or none. */
function withRounds(team: RoadFinalist, n: number, group = true): RoadFinalist {
  const base = team.path;
  const path: RoadMatch[] = Array.from({ length: n }, (_, i) => ({ ...base[i % base.length], round: n <= 4 ? base[base.length - n + i].round : `round-${i + 1}` }));
  return { ...team, path, group: group ? team.group : undefined };
}

describe("roadToFinal", () => {
  const chart = roadToFinal(finalists(), { id: "road", title: "Northern Cup 2030", final: ROAD_FINAL });

  it("gives what a chart gives: the options, a title, a summary, the numbers, the drawing and the table", () => {
    expect(Object.keys(chart).sort()).toEqual(["draw", "options", "summary", "table", "title", "totals"]);
    expect(chart.title).toBe("Aurelia and Calvara: Northern Cup 2030, Road to the final");
    expect(chart.summary).toBe("Aurelia played 7 matches on the way to the final and Calvara played 7. The final: Aurelia 2-2 Calvara (4-3 pens). Aurelia won the final.");
    expect(chart.options.title).toBe("Northern Cup 2030");
  });

  it("counts each finalist's record and names the rounds, earliest first, and the champion", () => {
    const t = chart.totals;
    expect(t.rounds).toEqual(["round-of-32", "round-of-16", "quarter-final", "semi-final"]);
    expect(t.played).toBe(true);
    expect(t.champion).toBe("Aurelia");
    expect(t.finalists[0]).toEqual({ name: "Aurelia", matches: 7, won: 6, drawn: 1, lost: 0, scored: 14, conceded: 4 });
    expect(t.finalists[1]).toEqual({ name: "Calvara", matches: 7, won: 5, drawn: 1, lost: 1, scored: 14, conceded: 7 });
    expect(roadToFinal(finalists()).totals).toMatchObject({ played: false, champion: null });
  });

  for (const size of SIZES) {
    for (const language of ["en", "ja"] as const) {
      it(`${size} in ${language}: a well-formed drawing that names itself`, () => {
        const c = roadToFinal(finalists(language), { id: "r", language, size, final: ROAD_FINAL, title: language === "ja" ? "ノーザンカップ" : "Northern Cup" });
        const svg = c.draw();
        const root = parse(svg);
        expect(root.attrs.role).toBe("img");
        expect(root.attrs.class).toBe("kyogijo kyogijo-road");
        expect(root.attrs["data-size"]).toBe(size);
        const [x, y, w, h] = viewBox(svg);
        expect([x, y, w]).toEqual([0, 0, ROAD_SIZES[size].width]);
        if (ROAD_SIZES[size].height !== undefined) expect(h).toBe(ROAD_SIZES[size].height);
        else expect(h).toBeGreaterThan(600);
        const title = walk(root).find((n) => n.name === "title" && n.attrs.id === "r-t");
        const desc = walk(root).find((n) => n.name === "desc" && n.attrs.id === "r-d");
        expect(root.attrs["aria-labelledby"]).toBe("r-t r-d");
        expect(title?.text).toBe(c.title);
        expect(desc?.text).toBe(c.summary);
        if (language === "ja") expect(title?.text).toContain("決勝への道");
      });
    }
  }

  it("is the same text for the same call, and has ids of its own for each chart on a page", () => {
    const a = roadToFinal(finalists(), { final: ROAD_FINAL });
    expect(a.draw()).toBe(roadToFinal(finalists(), { final: ROAD_FINAL }).draw());
    const b = roadToFinal(finalists("ja"));
    const idsOf = (svg: string): string[] => walk(parse(svg)).flatMap((n) => (n.attrs.id === undefined ? [] : [n.attrs.id]));
    expect(idsOf(a.draw())[0]).not.toBe(idsOf(b.draw())[0]);
    const all = idsOf(a.draw());
    expect(new Set(all).size).toBe(all.length);
    expect(all.every((id) => id.startsWith("kr-"))).toBe(true);
    expect(idsOf(chart.draw()).every((id) => id.startsWith("road-"))).toBe(true);
  });

  it("draws the rounds down the middle, the last at the top, each with both finalists' matches", () => {
    const svg = chart.draw({ size: "card" });
    const labels = textsOf(svg, "ky-r-lab");
    expect(labels).toEqual(["Semi-final", "Quarter-final", "Round of 16", "Round of 32", "Group stage"]);
    const ys = withClass(parse(svg), "ky-r-lab").map((n) => Number(n.attrs.y));
    expect([...ys].sort((p, q) => p - q)).toEqual(ys);
    // Two big marks, then two for each of the eight matches, and one for each group match.
    expect(markCount(svg)).toBe(2 + 2 * 8 + 6);
    // The score between the marks: a number either side of a dash.
    expect(textsOf(svg, "ky-r-dash").length).toBe(8 + 1);
  });

  for (const rounds of [2, 3, 4, 5, 6]) {
    for (const group of [true, false]) {
      it(`${rounds} rounds ${group ? "with" : "without"} a group row: every size draws and keeps its words inside the picture`, () => {
        const pair = finalists().map((t) => withRounds(t, rounds, group)) as [RoadFinalist, RoadFinalist];
        for (const size of SIZES) {
          const svg = roadToFinal(pair, { size, labels: { "round-1": "First", "round-2": "Second", "round-3": "Third", "round-4": "Fourth", "round-5": "Fifth", "round-6": "Sixth" } }).draw();
          const [, , W, H] = viewBox(svg);
          expect(textsOf(svg, "ky-r-lab").length, `${size} labels`).toBe(rounds + (group ? 1 : 0));
          expect(markCount(svg), `${size} marks`).toBe(2 + 2 * 2 * rounds + (group ? 6 : 0));
          for (const node of withClass(parse(svg), "ky-r-lab")) expect(Number(node.attrs.y), `${size} label`).toBeLessThan(H);
          // Nothing is written beyond the edge, by the package's own estimate of how wide a text is.
          for (const text of walk(parse(svg)).filter((n) => n.name === "text")) {
            const half = (textWidth(text.text) * Number(text.attrs["font-size"])) / 2;
            const x = Number(text.attrs.x);
            const anchor = text.attrs["text-anchor"];
            const [lo, hi] = anchor === "end" ? [x - 2 * half, x] : anchor === "start" ? [x, x + 2 * half] : [x - half, x + half];
            expect(lo, `${size} text ${text.text}`).toBeGreaterThanOrEqual(0);
            expect(hi, `${size} text ${text.text}`).toBeLessThanOrEqual(W);
          }
        }
      });
    }
  }

  it("writes how a match was decided under its score: FT, AET, or the shoot-out in the order the marks stand", () => {
    const svg = chart.draw({ size: "card" });
    const subs = textsOf(svg, "ky-r-sub");
    // Aurelia is on the left, its mark outermost: its shoot-out number first. Calvara is on the right: its number is last.
    expect(subs).toContain("5-4 pens");
    expect(subs).toContain("2-3 pens");
    expect(subs).toContain("AET");
    expect(subs.filter((s) => s === "FT").length).toBe(5);
    expect(subs).toContain("4-3 pens");
    expect(textsOf(chart.draw({ language: "ja" }), "ky-r-sub")).toEqual(expect.arrayContaining(["延長", "PK 5-4", "PK 2-3", "90分"]));
  });

  it("puts a team first by `homeFirst`, and keeps each number with its own mark", () => {
    const [a, b] = finalists();
    const flip = (team: RoadFinalist, homeFirst: boolean): RoadFinalist => ({ ...team, path: team.path.map((m) => ({ ...m, homeFirst })) });
    const left = textsOf(roadToFinal([flip(a, false), flip(b, true)], { size: "card" }).draw(), "ky-r-n");
    const plain = textsOf(roadToFinal([a, b], { size: "card" }).draw(), "ky-r-n");
    // The finalist's number leads on the left of the pair when homeFirst; the opponent's when not. Aurelia's first match is 2-1 (semi-final), so its 2 trails now.
    expect(plain.slice(0, 3)).toEqual(["2", "1", "1"]);
    expect(left.slice(0, 2)).toEqual(["1", "2"]);
    expect(left.length).toBe(plain.length);
  });

  it("makes the side that won each match brighter: the opponent of a win is dimmed, a lost match dims the finalist", () => {
    const dimmed = (svg: string): number => walk(parse(svg)).filter((n) => (n.attrs.class ?? "").includes("ky-r-dim") && n.name === "g").length;
    // Every knockout match is a win for its finalist, and three group matches are wins (one is a loss and two are draws, which dim no one).
    expect(dimmed(roadToFinal(finalists()).draw())).toBe(8 + 3);
    expect(dimmed(roadToFinal(finalists(), { winner: "none" }).draw())).toBe(0);
    expect(dimmed(chart.draw())).toBe(8 + 3 + 1);
    const lost = roadToFinal([{ ...finalists()[0], path: [{ ...finalists()[0].path[0], score: [0, 1] }] }, { ...finalists()[1], path: [] }]);
    expect(dimmed(lost.draw())).toBe(1 + 3);
  });

  it("has a middle for the final: a v when it is not played, its score when it is, with the loser quiet", () => {
    const open = roadToFinal(finalists(), { id: "o" });
    expect(textsOf(open.draw(), "ky-r-vs")).toEqual(["v"]);
    expect(open.summary.endsWith("The final is still to be played.")).toBe(true);
    expect(textsOf(roadToFinal(finalists("ja")).draw({ language: "ja" }), "ky-r-vs")).toEqual(["対"]);
    const won = roadToFinal(finalists(), { final: { score: [3, 1] } });
    expect(textsOf(won.draw(), "ky-r-sub")).toContain("FT");
    expect(won.totals.champion).toBe("Aurelia");
    const lostFinal = roadToFinal(finalists(), { final: { score: [0, 1], decidedBy: "aet" } });
    expect(lostFinal.totals.champion).toBe("Calvara");
    expect(lostFinal.summary).toContain("Calvara won the final.");
    expect(roadToFinal(finalists(), { final: { score: [1, 1] } }).totals.champion).toBeNull();
    expect(roadToFinal(finalists(), { final: { score: "4-2", note: "Game 6" } }).draw()).toContain(">Game 6<");
  });

  it("names a round the caller names, and writes any other key as it is: a series reads as well as a knockout", () => {
    const series = roadToFinal(roadSeries(EMBLEMS), { labels: SERIES_LABELS, final: { score: "4-2", note: "Game 6" }, id: "s" });
    expect(series.totals.rounds).toEqual(["first-round", "second-round", "conference-final"]);
    const svg = series.draw();
    expect(textsOf(svg, "ky-r-lab")).toEqual(["Conference final", "Second round", "First round"]);
    expect(textsOf(svg, "ky-r-sub")).toEqual(expect.arrayContaining(["Game 5", "Game 7", "Cup final"]));
    // The final first (4-2), then the conference final: the Gulls' 4-2 on the left, and on the right the Owls' 4 with its opponent's 3 before it.
    expect(textsOf(svg, "ky-r-n").slice(0, 6)).toEqual(["4", "2", "4", "2", "3", "4"]);
    expect(textsOf(roadToFinal(roadSeries(EMBLEMS)).draw(), "ky-r-lab")).toEqual(["conference-final", "second-round", "first-round"]);
    expect(series.table()).toContain("<td>Second round</td>");
    expect(series.summary).toContain("The final: Harbour City Gulls 4-2 Northern Owls (Game 6).");
    expect(roadToFinal(finalists(), { groupLabel: "Pool play" }).draw()).toContain(">Pool play<");
  });

  it("reads a score that is text: split at its dash, or written whole when it will not split", () => {
    const [a, b] = finalists();
    const odd = { ...a, path: [{ ...a.path[0], score: "walkover" }, { ...a.path[1], score: "2 – 1" }, { ...a.path[2], score: ["3", "1"] as [string, string] }] };
    const c = roadToFinal([odd, { ...b, path: [] }], { id: "w" });
    // Rows run from the last round down: the third match (3-1), the second (2-1) and the first, which is written whole.
    expect(textsOf(c.draw(), "ky-r-n").slice(0, 5)).toEqual(["3", "1", "2", "1", "walkover"]);
    expect(c.table()).toContain("<td>walkover</td>");
    expect(c.table()).toContain("<td>2-1</td>");
    expect(c.totals.finalists[0]).toMatchObject({ won: 2 + 2, lost: 0, matches: 3 + 3 });
    expect(scoreText({ whole: "walkover" } as never)).toBe("walkover");
  });

  it("draws a team with no logo as its initials on its colour, and never an image", () => {
    const bare = (t: RoadFinalist): RoadFinalist => ({ ...t, logo: undefined, path: t.path.map((m) => ({ ...m, opponent: { name: m.opponent.name } })), group: t.group?.map((m) => ({ ...m, opponent: { name: m.opponent.name } })) });
    const svg = roadToFinal([bare(finalists()[0]), bare(finalists()[1])], { size: "square" }).draw();
    expect(walk(parse(svg)).filter((n) => n.name === "image")).toEqual([]);
    expect(walk(parse(svg)).filter((n) => n.name === "clipPath")).toEqual([]);
    expect(withClass(parse(svg), "ky-mark-i").length).toBe(markCount(svg));
    expect(textsOf(svg, "ky-mark-i").slice(0, 2)).toEqual(["AUR", "CAL"]);
    expect(svg.length).toBeLessThan(26_000);
    // A name with no abbreviation gets its initials: "Kestrel Isles" is KI.
    const ki = roadToFinal([{ name: "Kestrel Isles", path: [] }, { name: "Valdor", path: [] }]);
    expect(textsOf(ki.draw(), "ky-mark-i")).toEqual(["KI", "VAL"]);
  });

  it("clips each picture to a circle of its own, takes a flag as SVG text or an address, and drops an address that could run", () => {
    const svg = chart.draw({ size: "card" });
    const doc = parse(svg);
    const clips = walk(doc).filter((n) => n.name === "clipPath");
    const images = walk(doc).filter((n) => n.name === "image");
    expect(images.length).toBe(markCount(svg));
    expect(clips.length).toBe(images.length);
    expect(new Set(clips.map((c) => c.attrs.id)).size).toBe(clips.length);
    for (const image of images) expect(image.attrs["clip-path"]).toMatch(/^url\(#road-m\d+-c\)$/);
    expect(images[0].attrs.href).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    const [a, b] = finalists();
    const web = roadToFinal([{ ...a, logo: "https://example.com/aurelia.svg" }, { ...b, logo: "javascript:alert(1)" }], { id: "x" }).draw();
    expect(web).toContain('href="https://example.com/aurelia.svg"');
    expect(web).not.toContain("javascript:");
    expect(textsOf(web, "ky-mark-i")).toContain("CAL");
  });

  it("sets a long name on two lines in a smaller size, and wraps a long title", () => {
    const [a, b] = finalists();
    const long = roadToFinal([{ ...a, name: "The Very Long Named Federation of Aurelia" }, b], { title: "An Extremely Long Tournament Name That Should Wrap Over Two Lines", size: "card" });
    const svg = long.draw();
    const names = withClass(parse(svg), "ky-r-name");
    expect(names.map((n) => n.text)).toEqual(["THE VERY LONG NAMED", "FEDERATION OF AURELIA", "CALVARA"]);
    const sizes = names.map((n) => Number(n.attrs["font-size"]));
    expect(sizes[0]).toBeLessThan(sizes[2]);
    expect(withClass(parse(svg), "ky-r-t").length).toBe(2);
    expect(textsOf(roadToFinal([a, b], { title: "Northern Cup" }).draw(), "ky-r-t")).toEqual(["Northern Cup"]);
  });

  it("writes the opponent's three letters under its mark, unless asked not to", () => {
    expect(textsOf(chart.draw(), "ky-r-code").length).toBe(8 + 6);
    expect(textsOf(chart.draw(), "ky-r-code").slice(0, 2)).toEqual(["NRV", "VAL"]);
    expect(textsOf(roadToFinal(finalists(), { codes: false }).draw(), "ky-r-code")).toEqual([]);
  });

  it("writes a foot line, a theme, a class and the stylesheet, or leaves the stylesheet to the page", () => {
    const svg = chart.draw({ endnote: "Made-up results", theme: "dark", className: "mine", id: "road" });
    const root = parse(svg);
    expect(root.attrs["data-theme"]).toBe("dark");
    expect(root.attrs.class).toBe("kyogijo kyogijo-road mine");
    expect(textsOf(svg, "ky-r-e")).toEqual(["Made-up results"]);
    const css = walk(root).find((n) => n.name === "style")?.text ?? "";
    expect(css).toContain(".kyogijo-road .ky-r-bg");
    expect(css).toContain(".kyogijo .ky-mark-ring");
    expect(css).toContain("prefers-color-scheme:dark");
    expect(walk(parse(chart.draw({ style: "none" }))).some((n) => n.name === "style")).toBe(false);
  });

  it("changes under draw's options: the size, the language and the final", () => {
    const wide = chart.draw({ size: "wide" });
    expect(viewBox(wide).slice(2)).toEqual([1200, 675]);
    expect(chart.draw({ language: "ja" })).toContain("準決勝");
    expect(textsOf(chart.draw({ final: undefined }), "ky-r-vs")).toEqual(["v"]);
    expect(chart.draw()).toContain(">Semi-final<");
  });

  it("refuses what it cannot draw", () => {
    expect(() => roadToFinal(undefined as never)).toThrow(TypeError);
    expect(() => roadToFinal([finalists()[0]] as never)).toThrow(/two finalists/);
    expect(() => roadToFinal([{ name: "A" }, { name: "B", path: [] }] as never)).toThrow(/path/);
    expect(() => roadToFinal([{ name: "A", path: [{ round: "final" }] }, { name: "B", path: [] }] as never)).toThrow(/opponent/);
    expect(() => roadToFinal([{ name: "A", path: [{ opponent: { name: "C" }, score: [1, 0] }] }, { name: "B", path: [] }] as never)).toThrow(/round/);
    expect(() => roadToFinal(finalists(), { size: "huge" as never })).toThrow(/Unknown size "huge"/);
    expect(() => roadToFinal(finalists(), { final: {} as never })).toThrow(/final/);
    expect(() => roadToFinal(finalists()).draw({ size: "huge" as never })).toThrow(RangeError);
  });

  it("merges the rounds of two paths: a round one has stays where it falls", () => {
    expect(mergeRounds([["a", "b", "c"], ["a", "b", "c"]])).toEqual(["a", "b", "c"]);
    expect(mergeRounds([["r16", "qf", "sf"], ["r32", "r16", "qf", "sf"]])).toEqual(["r32", "r16", "qf", "sf"]);
    expect(mergeRounds([["a", "c"], ["a", "b", "c"]])).toEqual(["a", "b", "c"]);
    const bye = roadToFinal([{ ...finalists()[0], path: finalists()[0].path.slice(1) }, finalists()[1]]);
    expect(bye.totals.rounds).toEqual(["round-of-32", "round-of-16", "quarter-final", "semi-final"]);
    expect(markCount(bye.draw())).toBe(2 + 2 * 7 + 6);
  });

  it("says each match in a table: one row for every match, the group first, the final last, with names made safe", () => {
    const html = chart.table();
    const doc = parse(html);
    expect(doc.name).toBe("table");
    expect(doc.attrs.class).toBe("ky-table");
    expect(doc.attrs["data-kind"]).toBe("road");
    const rows = walk(doc).filter((n) => n.name === "tr");
    expect(rows.length).toBe(1 + 7 + 7 + 1);
    const cells = (row: Node): string[] => row.children.map((c) => c.text);
    expect(cells(rows[0])).toEqual(["Team", "Round", "Opponent", "Score", "Decided", "Result"]);
    expect(cells(rows[1])).toEqual(["Aurelia", "Group stage", "Isenmark", "2-0", "", "Won"]);
    expect(cells(rows[4])).toEqual(["Aurelia", "Round of 32", "Pellasia", "3-0", "FT", "Won"]);
    expect(cells(rows[6])).toEqual(["Aurelia", "Quarter-final", "Garrovia", "1-1", "5-4 pens", "Won"]);
    expect(cells(rows[8]).slice(0, 3)).toEqual(["Calvara", "Group stage", "Estria"]);
    expect(cells(rows[rows.length - 1])).toEqual(["Aurelia", "Final", "Calvara", "2-2", "4-3 pens", "Won"]);
    expect(rows.slice(1).every((row) => row.children[0].name === "th" && row.children[0].attrs.scope === "row")).toBe(true);
    expect(walk(doc).find((n) => n.name === "caption")?.text).toContain("Aurelia and Calvara: every match");
    const ja = parse(chart.table({ language: "ja", className: "mine" }));
    expect(ja.attrs.class).toBe("mine");
    expect(cells(walk(ja).filter((n) => n.name === "tr")[0])).toEqual(["チーム", "ラウンド", "対戦相手", "スコア", "決着", "結果"]);
    const tricky = roadToFinal([{ name: "A & B <C>", path: [{ round: "final-four", opponent: { name: 'D "E"' }, score: [1, 0] }] }, { name: "F", path: [] }]).table();
    expect(tricky).toContain("A &amp; B &lt;C&gt;");
    expect(tricky).toContain("D &quot;E&quot;");
    expect(() => parse(tricky)).not.toThrow();
  });

  it("stays within its size budget, flags and all", () => {
    expect(chart.draw({ size: "card" }).length).toBeLessThan(40_000);
    expect(chart.draw({ size: "phone" }).length).toBeLessThan(40_000);
    expect(roadToFinal(roadSeries(EMBLEMS), { labels: SERIES_LABELS }).draw().length).toBeLessThan(30_000);
  });

  it("is a drawing the renderers read: the scene has its text, its clipped pictures and its colours worked out", () => {
    const scene = sceneFromSvg(chart.draw({ size: "square" }), { theme: "dark" });
    const kinds = scene.items.reduce<Record<string, number>>((all, item) => ({ ...all, [item.kind]: (all[item.kind] ?? 0) + 1 }), {});
    expect(kinds.image).toBeGreaterThan(20);
    expect(kinds.text).toBeGreaterThan(40);
    expect(scene.items.filter((item) => item.kind === "image").every((item) => item.clips.length === 1)).toBe(true);
    expect(scene.clips.length).toBe(kinds.image);
    expect(scene.clips.every((clip) => clip.shapes.length === 1 && clip.shapes[0].kind === "circle")).toBe(true);
    const bg = scene.items.find((item) => item.kind === "rect");
    expect(bg).toBeDefined();
  });

  it("goes in a grid beside other drawings, with ids of its own", () => {
    const svg = drawGrid([chart, roadToFinal(finalists("ja"), { size: "wide" })], { columns: 2, width: 1200, title: "Two roads" });
    const doc = parse(svg);
    const all = walk(doc).flatMap((n) => (n.attrs.id === undefined ? [] : [n.attrs.id]));
    expect(new Set(all).size).toBe(all.length);
    expect(svg.split(".kyogijo-road .ky-r-bg").length).toBe(2);
  });

  it("holds each size's structure: how many of each element and class a drawing is made of", () => {
    for (const size of SIZES) expect(structure(roadToFinal(finalists(), { size, id: "snap", final: ROAD_FINAL }).draw())).toMatchSnapshot();
    expect(structure(roadToFinal(roadSeries(EMBLEMS), { labels: SERIES_LABELS, id: "snap" }).draw({ size: "card" }))).toMatchSnapshot();
  });

  it("has words for the soccer rounds in English and Japanese, and a word for each use", () => {
    for (const language of ["en", "ja"] as const) {
      const w = KYOGIJO_STRINGS[language].road;
      expect(Object.keys(w.rounds)).toEqual(["round-of-32", "round-of-16", "quarter-final", "semi-final", "final"]);
      for (const text of [w.title, w.vs, w.group, w.ft, w.aet, w.pens, w.won, w.lost, w.drew, w.caption, w.name, w.summary, w.final, w.champion, w.toPlay]) expect(text.length).toBeGreaterThan(0);
    }
    expect(KYOGIJO_STRINGS.en.road.pens).toContain("{a}");
    expect(KYOGIJO_STRINGS.ja.road.pens).toContain("{b}");
  });

  it("uses the nations the demo makes up, which are not real", () => {
    expect(nation("aurelia", "ja").name).toBe("アウレリア");
    const options: RoadOptions = { size: "card" };
    expect(roadToFinal(finalists(), options).draw()).toContain("Aurelia");
  });
});
