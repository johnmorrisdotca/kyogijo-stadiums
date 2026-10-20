// A judging assignment (IJF Sport and Organisation Rules of 21 January 2026, B1.8 and the judges' article; the Kata Commission's Tournament Handbook 2024): the five judges' seats of a kata area, each with a name and an
// ID, drawn in the seat where they fit and in a chart where they do not, and every name and ID kept whole in the chart whatever its length.
import { describe, expect, it } from "vitest";

import { budoPlan } from "./budo/plan.ts";
import { JUDGING_SEATS, JUDGING_SEAT_COUNT, JUDGING_STYLES } from "./judging.data.ts";
import { drawJudging, judgingChart, judgingDrawing, judgingTable, judgingText } from "./judging.draw.ts";
import { fitCard, fitChart, fitSeats, wrapText } from "./judging.fit.ts";
import { JUDGING_LIMITS, judgingPlan, judgingSetting, matLabel, seatIn, seatOf, seatsOf } from "./judging.ts";
import { KYOGIJO_JUDGING_STYLE } from "./judging.style.ts";
import type { JudgingAssignment, JudgingOptions } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import { textWidth } from "./text.ts";

const FIVE = [
  { seat: 1, name: "Aiko Mori", id: "J-1042" },
  { seat: 2, name: "Daniel Okafor", id: "J-0377" },
  { seat: 3, name: "Sofia Lindqvist-Hernandez", id: "J-2210" },
  { seat: 4, name: "Kenji Watanabe", id: "J-0918" },
  { seat: 5, name: "Marta Kowalczyk", id: "J-1555" },
] as const;
const kata = (mats: JudgingOptions["mats"] = [{ officials: FIVE }], rest: Partial<JudgingOptions> = {}): JudgingOptions => ({ style: "kata", mats, seatNames: true, ...rest });
/** The text of every `<text>` of a drawing, in order. */
const texts = (svg: string, cls: string): string[] => [...svg.matchAll(new RegExp(`<text class="${cls}"[^>]*>([^<]*)</text>`, "g"))].map((m) => m[1]);
const unescape = (s: string): string => s.replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");

describe("the seats of a kata area", () => {
  it("are five, the central judge in the middle, numbered from the left as the plan lies with the shomen at the top", () => {
    expect(JUDGING_STYLES).toEqual(["kata", "shiai"]);
    const seats = seatsOf("kata");
    expect(seats.map((s) => s.id)).toEqual(["judge-1", "judge-2", "judge-3", "judge-4", "judge-5"]);
    expect(JUDGING_SEAT_COUNT.kata).toBe(5);
    expect(seats.filter((s) => s.role === "central").map((s) => s.n)).toEqual([3]);
    expect(seats[2].label).toEqual({ en: "Judge 3, central", ja: "審判員3（中央）" });
    expect(Object.isFrozen(JUDGING_SEATS.kata)).toBe(true);
  });

  it("are the seats the judo plan draws: five chairs 1.25 m apart behind one table, the middle one at the centre of the area", () => {
    const geom = judgingPlan("kata");
    const plan = budoPlan({ sport: "judo", budo: { style: "kata", officials: true } });
    expect(geom.chairs).toEqual(plan.judo!.judges.seats);
    expect(geom.chairs).toHaveLength(5);
    expect(geom.pitch).toBeCloseTo(1.25, 9);
    const centre = (plan.judo!.contests[0].x0 + plan.judo!.contests[0].x1) / 2;
    expect((geom.chairs[2].x0 + geom.chairs[2].x1) / 2).toBeCloseTo(centre, 9);
    // The table is behind the chairs' fronts and the chairs are on its far side from the mat.
    expect(geom.table.x0).toBeLessThan(geom.chairs[0].x0);
    expect(geom.table.x1).toBeGreaterThan(geom.chairs[4].x1);
    expect(geom.chairs.every((c) => c.y1 <= geom.table.y0 + 1e-9)).toBe(true);
    // The bench is the seats and their table with a little round them, and lies inside the whole picture.
    expect(geom.bench.x0).toBeLessThan(geom.chairs[0].x0);
    expect(geom.bench.x1).toBeGreaterThan(geom.chairs[4].x1);
    expect(geom.bench.x0).toBeGreaterThanOrEqual(geom.extent.x0);
    expect(geom.bench.x1).toBeLessThanOrEqual(geom.extent.x1);
  });

  it("are found by their number, their key, a word, or `central`, and nothing else", () => {
    expect(seatOf("kata", 4).id).toBe("judge-4");
    expect(seatOf("kata", "4").id).toBe("judge-4");
    expect(seatOf("kata", " Judge-2 ").id).toBe("judge-2");
    expect(seatOf("kata", "judge 5").id).toBe("judge-5");
    expect(seatOf("kata", "central").id).toBe("judge-3");
    expect(seatOf("kata", "Centre").id).toBe("judge-3");
    for (const bad of [0, 6, 2.5, "referee", "", "judge-", "judge-9", undefined, null, {}]) expect(() => seatOf("kata", bad), String(bad)).toThrow(RangeError);
    expect(() => seatOf("kata", 9)).toThrow(/judge-1, judge-2, judge-3, judge-4, judge-5/);
  });

  it("refuse a style that is not one", () => {
    expect(() => seatsOf("kumite")).toThrow(TypeError);
    expect(() => drawJudging({ style: "kumite" as never, mats: [{}] })).toThrow(TypeError);
  });
});

describe("the options", () => {
  it("put each official in a seat, and every other seat is not assigned", () => {
    const s = judgingSetting(kata([{ officials: [FIVE[2], { seat: "judge-1", name: "  Li   Wei ", id: 7 }] }]));
    expect(s.mats).toHaveLength(1);
    expect(s.mats[0].seats.map((a) => [a.seat.n, a.name, a.id, a.assigned])).toEqual([[1, "Li Wei", "7", true], [2, "", "", false], [3, "Sofia Lindqvist-Hernandez", "J-2210", true], [4, "", "", false], [5, "", "", false]]);
    expect(s.mats[0].label).toBe("Mat 1");
    expect(judgingSetting(kata([{}, { label: "Final" }], { language: "ja" })).mats.map((m) => m.label)).toEqual(["第1試合場", "Final"]);
  });

  it("hold the number of mats to 1 to 6, and `mat` to one of them", () => {
    expect(() => judgingSetting(kata([]))).toThrow(RangeError);
    expect(() => judgingSetting(kata(Array.from({ length: 7 }, () => ({}))))).toThrow(RangeError);
    expect(judgingSetting(kata(Array.from({ length: 6 }, () => ({})))).mats).toHaveLength(6);
    expect(() => judgingSetting(kata([{}, {}], { mat: 3 }))).toThrow(RangeError);
    expect(() => judgingSetting(kata([{}, {}], { mat: 0 }))).toThrow(RangeError);
    const one = judgingSetting(kata([{}, { label: "B" }], { mat: 2 }));
    expect(one.mats.map((m) => m.label)).toEqual(["B"]);
    expect(one.total).toBe(2);
  });

  it("refuse a seat named twice, a text that is too long, and a value of the wrong kind", () => {
    expect(() => judgingSetting(kata([{ officials: [{ seat: 1, name: "A" }, { seat: "judge-1", name: "B" }] }]))).toThrow(/twice/);
    expect(() => judgingSetting(kata([{ officials: [{ seat: 1, name: "x".repeat(JUDGING_LIMITS.name + 1) }] }]))).toThrow(RangeError);
    expect(() => judgingSetting(kata([{ officials: [{ seat: 1, id: "x".repeat(JUDGING_LIMITS.id + 1) }] }]))).toThrow(RangeError);
    expect(() => matLabel({ label: "x".repeat(JUDGING_LIMITS.label + 1) }, 1, "en")).toThrow(RangeError);
    expect(() => judgingSetting(kata([{ officials: [{ seat: 1, name: 5 as never }] }]))).toThrow(TypeError);
    expect(() => judgingSetting(kata([{ officials: [{ seat: 1, id: {} as never }] }]))).toThrow(TypeError);
    expect(() => judgingSetting(kata([{ officials: [null as never] }]))).toThrow(TypeError);
    expect(() => judgingSetting(kata([null as never]))).toThrow(TypeError);
    for (const [key, bad] of [["chart", "sometimes"], ["orientation", "square"], ["focus", "wall"]] as const) expect(() => judgingSetting(kata([{}], { [key]: bad } as never)), key).toThrow(TypeError);
    for (const width of [100, 5000, NaN]) expect(() => judgingSetting(kata([{}], { width })), String(width)).toThrow(RangeError);
  });

  it("make a text safe: control characters and runs of spaces go, and a name of 120 characters is still a name", () => {
    const s = judgingSetting(kata([{ officials: [{ seat: 1, name: "A\u0000B\n\tC", id: " 1\u0007 2 " }, { seat: 2, name: "é".repeat(JUDGING_LIMITS.name) }] }]));
    expect(s.mats[0].seats[0].name).toBe("A B C");
    expect(s.mats[0].seats[0].id).toBe("1 2");
    expect([...s.mats[0].seats[1].name]).toHaveLength(JUDGING_LIMITS.name);
  });
});

describe("setting a name in a box", () => {
  it("wraps at the spaces, and refuses to break a word unless it is told to", () => {
    expect(wrapText("Aiko Mori", 1000, 10, false)).toEqual(["Aiko Mori"]);
    expect(wrapText("Aiko Mori", textWidth("Mori") * 10 + 1, 10, false)).toEqual(["Aiko", "Mori"]);
    expect(wrapText("Lindqvist-Hernandez", 20, 10, false)).toBeUndefined();
    const broken = wrapText("Lindqvist-Hernandez", 40, 10, true)!;
    expect(broken.length).toBeGreaterThan(1);
    expect(broken.join("")).toBe("Lindqvist-Hernandez");
    for (const line of broken) expect(textWidth(line) * 10).toBeLessThanOrEqual(40 + 1e-9);
    expect(wrapText("", 100, 10, false)).toEqual([]);
  });

  it("fits a short name in a card at a big size and a long one not at all, and says so", () => {
    const ask = { idLabel: "ID", width: 70, height: 60, max: 26, min: 12, maxLines: 3, breakWords: false };
    const short = fitCard({ ...ask, name: "Li Wei", id: "J-3001" })!;
    expect(short).toBeDefined();
    expect(short.height).toBeLessThanOrEqual(60);
    expect(short.width).toBeLessThanOrEqual(70 + 1e-9);
    expect(short.nameSize).toBeGreaterThan(12);
    expect(short.id.join(" ")).toBe("ID J-3001");
    expect(fitCard({ ...ask, name: "Sofia Lindqvist-Hernandez", id: "J-2210" })).toBeUndefined();
    // The floor is kept: a name that fits only below it does not fit.
    expect(fitCard({ ...ask, name: "Maximilian", id: "", width: textWidth("Maximilian") * 11 })).toBeUndefined();
  });

  it("never cuts a name or an ID in the chart: whatever the text, every character is there, and the row grows", () => {
    const names = ["", "Li", "Sofia Lindqvist-Hernandez", "x".repeat(120), "山田太郎".repeat(30), "Maximilian Alexander Friedrich von Hohenlohe-Schillingsfürst und Waldenburg zu Bartenstein, Jr.", "a b c d e f g h i j k l m n o p"];
    const ids = ["", "J-1", "0123456789".repeat(6) + "abcd"];
    for (const name of names) {
      for (const id of ids) {
        const fit = fitChart({ name, id, idLabel: "ID", width: 330, max: 34, min: 22 });
        expect(fit.name.join(" ").replace(/\s+/g, ""), `${name} / ${id}`).toBe(name.replace(/\s+/g, ""));
        if (id !== "") expect(fit.id.join("").replace(/\s+/g, ""), `${name} / ${id}`).toBe(`ID${id}`.replace(/\s+/g, ""));
        expect(fit.width, `${name} / ${id}`).toBeLessThanOrEqual(330 + 1e-6);
        expect(fit.nameSize).toBeGreaterThanOrEqual(22);
        expect(fit.nameSize).toBeLessThanOrEqual(34);
      }
    }
    // A name of a few words keeps its size up to three lines before it shrinks, and shrinks before it breaks a word.
    expect(fitChart({ name: "Aiko Mori", id: "", idLabel: "ID", width: 330, max: 34, min: 22 }).nameSize).toBe(34);
    const long = fitChart({ name: "Sofia Lindqvist-Hernandez", id: "J-2210", idLabel: "ID", width: 330, max: 34, min: 22 });
    expect(long.name.length).toBeLessThanOrEqual(3);
    expect(long.name.join(" ")).toBe("Sofia Lindqvist-Hernandez".split(" ").length === long.name.length ? "Sofia Lindqvist-Hernandez" : long.name.join(" "));
  });

  it("gives every card of a mat one size, the smallest any of them needs, and none to a name that does not fit", () => {
    const seat = (n: number, name: string, id = ""): JudgingAssignment => ({ seat: seatsOf("kata")[n - 1], name, id, assigned: name !== "" || id !== "" });
    const seats = [seat(1, "Li Wei", "J-1"), seat(2, "Aiko Mori"), seat(3, "Sofia Lindqvist-Hernandez"), seat(4, ""), seat(5, "Ana Ruiz")];
    const boxes = seats.map(() => ({ width: 70, height: 60, max: 26 }));
    const fits = fitSeats(seats, boxes, { min: 12, idLabel: "ID" });
    expect(fits.map((f) => f !== undefined)).toEqual([true, true, false, false, true]);
    const sizes = new Set(fits.filter((f) => f !== undefined).map((f) => f!.nameSize));
    expect(sizes.size).toBe(1);
    // The one size is the smallest of the sizes each would take alone.
    const alone = seats.map((a) => (a.assigned ? fitCard({ name: a.name, id: a.id, idLabel: "ID", width: 70, height: 60, max: 26, min: 12, maxLines: 3, breakWords: false })?.nameSize : undefined)).filter((n): n is number => n !== undefined);
    expect([...sizes][0]).toBeCloseTo(Math.min(...alone), 9);
  });
});

describe("the drawing", () => {
  const two: JudgingOptions["mats"] = [{ officials: FIVE }, { label: "Final", officials: [{ seat: 1, name: "Li Wei", id: "J-3001" }, { seat: "central", name: "Priya Raman", id: "J-0042" }] }];

  it("is one SVG with a title and a description that name every seat, its name and its ID", () => {
    const svg = drawJudging(kata(two));
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('data-judging="kata"');
    expect(svg).toContain('data-mats="2"');
    const d = judgingDrawing(kata(two));
    expect(d.title).toBe("Judging assignments: Kata, 5 judges, 2 mats");
    expect(d.description).toContain("Mat 1: Judge 1 Aiko Mori, ID J-1042; Judge 2 Daniel Okafor, ID J-0377; Judge 3, central Sofia Lindqvist-Hernandez, ID J-2210;");
    expect(d.description).toContain("Final: Judge 1 Li Wei, ID J-3001; Judge 2 not assigned; Judge 3, central Priya Raman, ID J-0042;");
    expect(svg).toContain(`<title id="${svg.match(/aria-labelledby="(\S+) /)![1]}">${d.title}</title>`);
    expect(judgingText(judgingSetting(kata(two)), {}, true).title).toBe(d.title);
  });

  it("has the chart of mat, seat, name and ID: every seat of every mat, in order, with the name and the ID whole", () => {
    const svg = drawJudging(kata(two));
    expect(svg).toContain('data-chart="yes"');
    const rows = [...svg.matchAll(/<g class="ky-ju-chart-row" data-mat="(\d)" data-seat="(judge-\d)">/g)].map((m) => `${m[1]}:${m[2]}`);
    expect(rows).toEqual([1, 2].flatMap((m) => [1, 2, 3, 4, 5].map((n) => `${m}:judge-${n}`)));
    const names = texts(svg, "ky-ju-name");
    expect(names.join(" ")).toContain("Aiko Mori");
    expect(names.join(" ")).toContain("Priya Raman");
    // The long name is whole in the chart (wrapped, not cut).
    expect(names.filter((t) => ["Sofia", "Lindqvist-Hernandez"].includes(t))).toEqual(["Sofia", "Lindqvist-Hernandez"]);
    expect(texts(svg, "ky-ju-id")).toEqual(expect.arrayContaining(["ID J-1042", "ID J-0377", "ID J-2210", "ID J-3001", "ID J-0042"]));
    expect(texts(svg, "ky-ju-vacant")).toEqual(["Not assigned", "Not assigned", "Not assigned"]);
    expect(texts(svg, "ky-ju-role").slice(0, 5)).toEqual(["Judge 1", "Judge 2", "Judge 3, central", "Judge 4", "Judge 5"]);
  });

  it("puts a name in its seat when it fits there, and only then", () => {
    // A close-up of the bench and short names: every name is in its seat.
    const near = judgingDrawing(kata([{ officials: [{ seat: 1, name: "Li Wei", id: "J-1" }, { seat: 2, name: "Ana Ruiz", id: "J-2" }, { seat: 3, name: "Bo Chen", id: "J-3" }, { seat: 4, name: "Eva Roth", id: "J-4" }, { seat: 5, name: "Jun Ito", id: "J-5" }] }], { focus: "bench", chart: "never" }));
    expect(near.cards.map((c) => c.fits)).toEqual([true, true, true, true, true]);
    expect(near.svg.match(/data-card="yes"/g)).toHaveLength(5);
    expect(texts(near.svg, "ky-ju-card-name").join(" ")).toContain("Li");
    expect(texts(near.svg, "ky-ju-card-id")).toEqual(["ID J-1", "ID J-2", "ID J-3", "ID J-4", "ID J-5"]);
    // The long name does not fit its seat, so that seat has a badge only, and the others still have their cards.
    const far = judgingDrawing(kata(undefined, { focus: "bench" }));
    expect(far.cards.map((c) => [c.seat, c.fits])).toEqual([["judge-1", true], ["judge-2", true], ["judge-3", false], ["judge-4", true], ["judge-5", true]]);
    expect(far.svg.match(/data-card="yes"/g)!.length).toBe(far.cards.filter((c) => c.fits && c.seat !== "judge-3").length);
    expect(far.svg).toMatch(/data-seat="judge-3" data-card="no"/);
    // On the whole mat the seats are too small for any name: badges only, numbered.
    const whole = judgingDrawing(kata());
    expect(whole.cards.every((c) => !c.fits)).toBe(true);
    expect(whole.svg).not.toContain('data-card="yes"');
  });

  it("draws the chart `auto` when a name does not fit, `always` and `never` as it says; and a seat with nobody in it fits", () => {
    const shortNames = kata([{ officials: [{ seat: 1, name: "Li Wei", id: "J-1" }] }], { focus: "bench" });
    expect(judgingDrawing(shortNames).chart).toBe(false);
    expect(judgingDrawing(shortNames).cards.every((c) => c.fits)).toBe(true);
    expect(judgingDrawing({ ...shortNames, chart: "always" }).chart).toBe(true);
    expect(judgingDrawing(kata(undefined, { focus: "bench" })).chart).toBe(true);
    expect(judgingDrawing(kata(undefined, { chart: "never" })).chart).toBe(false);
    expect(drawJudging(kata(undefined, { chart: "never" }))).not.toContain("ky-ju-chart-row");
  });

  it("draws one mat alone with `mat`, and the chart alone with judgingChart", () => {
    const one = drawJudging(kata(two, { mat: 2 }));
    expect(one).toContain('data-mat="2"');
    expect(one).not.toContain('class="ky-ju-panel" data-mat="1"');
    expect(one).toContain("Final");
    expect(one).not.toContain("Aiko Mori");
    const chart = judgingChart(kata(two));
    expect(chart).toContain("ky-ju-chart-row");
    expect(chart).not.toContain("ky-ju-seat");
    expect(chart).not.toContain("ky-bud-t1");
    expect(chart).toContain("Aiko Mori");
  });

  it("lays the chart beside the plan in landscape and under it in portrait, never past the picture's edge", () => {
    const place = (svg: string, cls: string): { x: number; y: number }[] => [...svg.matchAll(new RegExp(`<g class="${cls}"[^>]* transform="translate\\(([\\d.-]+) ([\\d.-]+)\\)"`, "g"))].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
    const land = drawJudging(kata());
    const port = drawJudging(kata(undefined, { orientation: "portrait", width: 768 }));
    const [lc] = place(land, "ky-ju-chart");
    const [pc] = place(port, "ky-ju-chart");
    expect(lc.x).toBeGreaterThan(300);
    expect(pc.x).toBeLessThan(40);
    expect(pc.y).toBeGreaterThan(300);
    const dims = (svg: string): [number, number] => svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!.slice(1).map(Number) as [number, number];
    expect(dims(land)[0]).toBe(1000);
    expect(dims(port)[0]).toBe(768);
    expect(dims(port)[1]).toBeGreaterThan(dims(port)[0]);
    for (const svg of [land, port]) for (const m of svg.matchAll(/<text [^>]*\bx="([\d.]+)"/g)) expect(Number(m[1])).toBeLessThanOrEqual(dims(svg)[0]);
  });

  it("keeps the rows of the chart apart, each tall enough for its lines, and the picture tall enough for the lowest", () => {
    const d = judgingDrawing(kata([{ officials: [{ seat: 1, name: "x".repeat(120), id: "9".repeat(64) }, ...FIVE.slice(1)] }]));
    const rows = [...d.svg.matchAll(/<rect class="ky-ju-row" x="0" y="([\d.]+)" width="[\d.]+" height="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(rows).toHaveLength(5);
    rows.forEach(([y], i) => i > 0 && expect(y).toBeGreaterThanOrEqual(rows[i - 1][0] + rows[i - 1][1]));
    expect(rows[0][1]).toBeGreaterThan(rows[1][1] * 1.5);
    const chart = /<g class="ky-ju-chart" data-mat="1" transform="translate\([\d.]+ ([\d.]+)\)"/.exec(d.svg)!;
    const last = rows[4];
    expect(Number(chart[1]) + last[0] + last[1]).toBeLessThan(d.height);
  });

  it("escapes what it is given: a name that is markup is text", () => {
    const hostile = '<script>alert(1)</script> "&\' <img src=x onerror=1>';
    const svg = drawJudging(kata([{ label: '<b>"Mat"</b>', officials: [{ seat: 1, name: hostile, id: '"><svg onload=1>' }] }]));
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("<img");
    expect(svg).not.toContain("<b>");
    expect(svg).not.toContain("<svg onload");
    expect(svg).toContain("&lt;script&gt;");
    expect(unescape(judgingTable(kata([{ officials: [{ seat: 1, name: hostile }] }])))).toContain(hostile);
    expect(judgingTable(kata([{ officials: [{ seat: 1, name: hostile }] }]))).not.toContain("<script");
  });

  it("is the same string for the same options, and a different one for different names", () => {
    expect(drawJudging(kata(two))).toBe(drawJudging(kata(two)));
    expect(drawJudging(kata(two))).not.toBe(drawJudging(kata([{ officials: [{ seat: 1, name: "Someone Else" }] }])));
    // The ids of two mats' surfaces differ, so that two pictures in one page do not share a clip or a pattern.
    const ids = [...drawJudging(kata(two)).matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(drawJudging({ ...kata(two), id: "ju" })).toContain('id="ju-t"');
    // Pictures that differ only in their theme, their chart or their orientation do not share ids either (a docs page holds many).
    const idOf = (o: JudgingOptions): string => drawJudging(o).match(/aria-labelledby="(\S+) /)![1];
    expect(new Set([idOf(kata()), idOf(kata(undefined, { theme: "dark" })), idOf(kata(undefined, { chart: "never" })), idOf(kata(undefined, { orientation: "portrait" })), idOf({ ...kata(), language: "ja" })]).size).toBe(5);
    expect(judgingChart(kata())).not.toBe(drawJudging(kata()));
    expect(judgingChart(kata()).match(/aria-labelledby="(\S+) /)![1]).not.toBe(idOf(kata()));
  });

  it("follows the page's light and dark, and a theme forces one; `css: none` leaves the stylesheet to the page", () => {
    expect(drawJudging(kata())).toContain("<style>");
    expect(drawJudging(kata())).toContain(".ky-ju-row");
    expect(drawJudging(kata(undefined, { css: "none" }))).not.toContain("<style>");
    expect(drawJudging(kata(undefined, { theme: "dark" }))).toContain('data-theme="dark"');
    expect(drawJudging(kata())).not.toMatch(/<svg[^>]* data-theme=/);
    expect(KYOGIJO_JUDGING_STYLE).toContain("prefers-color-scheme:dark");
    expect(KYOGIJO_JUDGING_STYLE).toContain("[data-theme=dark]");
    // The ink on the ground and the ink on a row are far apart in both: the type is read at arm's length.
    const lum = (hex: string): number => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a: string, b: string): number => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    for (const [ink, row, muted] of [["#10151b", "#ffffff", "#434b54"], ["#f6f3ea", "#18212a", "#bcc3cb"]]) {
      expect(ratio(ink, row)).toBeGreaterThan(12);
      expect(ratio(muted, row)).toBeGreaterThan(7);
    }
    for (const [mark, v] of [["#10151b", "--ky-ju-ink:#10151b"], ["#f6f3ea", "--ky-ju-ink:#f6f3ea"], ["#434b54", "--ky-ju-muted:#434b54"], ["#bcc3cb", "--ky-ju-muted:#bcc3cb"]]) expect(KYOGIJO_JUDGING_STYLE, mark).toContain(v);
  });

  it("speaks Japanese: the mat, the seats, the columns and the sentences, and the names as they are", () => {
    const svg = drawJudging(kata([{ officials: [{ seat: 1, name: "山田 花子", id: "J-9" }] }], { language: "ja" }));
    expect(svg).toContain("第1試合場");
    expect(svg).toContain("審判員1");
    expect(svg).toContain("審判員3（中央）");
    expect(svg).toContain("山田 花子");
    expect(svg).toContain("未定");
    expect(svg).toContain("形（5人制）");
    expect(judgingDrawing(kata([{ officials: [{ seat: 1, name: "山田 花子", id: "J-9" }] }], { language: "ja" })).description).toContain("審判員1は山田 花子（ID J-9）");
    expect(judgingTable(kata([{}], { language: "ja" }))).toContain("<th scope=\"col\">試合場</th>");
  });

  it("has the same words in both languages, key for key", () => {
    const keys = (o: object): string[] => Object.keys(o).sort();
    expect(keys(JUDGING_WORDS.ja)).toEqual(keys(JUDGING_WORDS.en));
    for (const part of ["styleName", "chart", "say", "table", "turn"] as const) expect(keys(JUDGING_WORDS.ja[part]), part).toEqual(keys(JUDGING_WORDS.en[part]));
  });

  it("says the same as the picture as a table, a row for every seat", () => {
    const table = judgingTable(kata(two));
    expect(table.startsWith("<table")).toBe(true);
    expect(table.match(/<tbody>[\s\S]*<\/tbody>/)![0].match(/<tr>/g)).toHaveLength(10);
    expect(table).toContain("<td>Judge 3, central</td><td>Sofia Lindqvist-Hernandez</td><td>J-2210</td>");
    expect(table).toContain("<td>Not assigned</td><td></td>");
    expect(table).toContain("<caption>Judging assignments: Kata, 5 judges, 2 mats</caption>");
  });
});

// ---- Shiai: a contest's referee, its technical table, and the side judges of an event with no CARE system (IJF SOR 21 January 2026: Article 9, the Refereeing Rules' Articles 2 and 3 and 13, 5). ----
const SHIAI = [
  { seat: "referee", name: "Hana Ito", id: "R-204" },
  { seat: "timekeeper", name: "Sam Cole", id: "T-11" },
  { seat: "scorekeeper", name: "Ana Ruiz", id: "T-12" },
  { seat: "supervisor", name: "Peter Lindqvist-Haraldsson", id: "S-3" },
] as const;
const shiai = (mats: JudgingOptions["mats"] = [{ officials: SHIAI }], rest: Partial<JudgingOptions> = {}): JudgingOptions => ({ style: "shiai", mats, seatNames: true, ...rest });

describe("the seats of a contest", () => {
  it("are the referee, the timekeeper, the scorekeeper and the referee supervisor, and two side judges that are drawn only when asked for or named", () => {
    const seats = seatsOf("shiai");
    expect(seats.map((s) => s.id)).toEqual(["referee", "timekeeper", "scorekeeper", "supervisor", "side-judge-1", "side-judge-2"]);
    expect(seats.map((s) => s.where)).toEqual(["mat", "table", "table", "table", "corner", "corner"]);
    expect(seats.filter((s) => s.optional === true).map((s) => s.id)).toEqual(["side-judge-1", "side-judge-2"]);
    expect(seats[0].label).toEqual({ en: "Referee", ja: "主審" });
    expect(seatsOf("shiai", "listed")).toHaveLength(4);
    expect(judgingSetting(shiai()).mats[0].seats.map((a) => a.seat.id)).toEqual(["referee", "timekeeper", "scorekeeper", "supervisor"]);
    expect(judgingSetting(shiai(undefined, { sideJudges: true })).mats[0].seats).toHaveLength(6);
    // A side judge a mat names is drawn without asking, and on every mat, so that the mats read alike.
    const named = judgingSetting(shiai([{ officials: [{ seat: "side-judge-2", name: "Kim Park" }] }, {}]));
    expect(named.mats.map((m) => m.seats.map((a) => a.seat.id))).toEqual(Array.from({ length: 2 }, () => ["referee", "timekeeper", "scorekeeper", "supervisor", "side-judge-2"]));
    expect(() => judgingSetting(shiai(undefined, { sideJudges: 1 as never }))).toThrow(TypeError);
  });

  it("are found by number, key or word", () => {
    expect(seatOf("shiai", 1).id).toBe("referee");
    expect(seatOf("shiai", "Timekeeper").id).toBe("timekeeper");
    expect(seatOf("shiai", "scorer").id).toBe("scorekeeper");
    expect(seatOf("shiai", "referee supervisor").id).toBe("supervisor");
    expect(seatOf("shiai", "judge 1").id).toBe("side-judge-1");
    expect(seatOf("shiai", "side-judge-2").id).toBe("side-judge-2");
    expect(seatOf("shiai", 6).id).toBe("side-judge-2");
    expect(() => seatOf("shiai", "central")).toThrow(RangeError);
    expect(() => seatOf("shiai", 7)).toThrow(/referee, timekeeper/);
    // A kata area's central judge is still the third.
    expect(seatOf("kata", "central").id).toBe("judge-3");
  });

  it("are where the plan and the Rules put them: the referee at the centre 2 m back from the line the athletes start on, three chairs behind the technical table, side judges at opposite corners", () => {
    const g = judgingPlan("shiai");
    const plan = g.plan.judo!;
    const c = plan.contests[0];
    const cx = (c.x0 + c.x1) / 2;
    const cy = (c.y0 + c.y1) / 2;
    const [referee, timekeeper, scorekeeper, supervisor, side1, side2] = g.places;
    expect((referee.chair.x0 + referee.chair.x1) / 2).toBeCloseTo(cx, 9);
    expect((referee.chair.y0 + referee.chair.y1) / 2).toBeCloseTo(cy + 2, 9);
    expect(g.plan.marks.find((m) => m.id === "referee-position")).toMatchObject({ x: cx, y: cy + 2 });
    expect(g.table).toEqual(plan.desks[0]);
    for (const p of [timekeeper, scorekeeper, supervisor]) {
      expect(p.chair.y1).toBeLessThanOrEqual(g.table.y0 + 1e-9);
      expect(p.card.y1).toBeCloseTo(g.table.y1, 9);
      expect(p.chair.x0).toBeGreaterThan(g.table.x0);
      expect(p.chair.x1).toBeLessThan(g.table.x1);
    }
    expect([timekeeper, scorekeeper, supervisor].map((p) => (p.chair.x0 + p.chair.x1) / 2 - cx)).toEqual([-1, 0, 1]);
    expect((side1.chair.x0 + side1.chair.x1) / 2).toBeLessThan(c.x0);
    expect((side2.chair.x0 + side2.chair.x1) / 2).toBeGreaterThan(c.x1);
    expect((side1.chair.y0 + side1.chair.y1) / 2).toBeLessThan(c.y0);
    expect((side2.chair.y0 + side2.chair.y1) / 2).toBeGreaterThan(c.y1);
    // Every seat, with its card, is inside the picture of the whole mat; the bench is the table's seats only.
    for (const p of g.places) {
      expect(p.card.x0).toBeGreaterThanOrEqual(g.extent.x0);
      expect(p.card.x1).toBeLessThanOrEqual(g.extent.x1);
      expect(p.card.y0).toBeGreaterThanOrEqual(g.extent.y0);
      expect(p.card.y1).toBeLessThanOrEqual(g.extent.y1);
    }
    expect(g.places.map((p) => seatIn(p, g.bench))).toEqual([false, true, true, true, false, false]);
    // Several mats: each has its own seats, a mat's width apart.
    const two = judgingPlan("shiai", 2);
    expect(two.mats).toHaveLength(2);
    expect(two.mats[1].places[0].chair.x0 - two.mats[0].places[0].chair.x0).toBeCloseTo(plan.contests[0].x1 - plan.contests[0].x0 + two.plan.judo!.gap, 9);
  });
});

describe("a contest's picture", () => {
  it("has the chart of every seat with its name and ID whole, the referee first, and the title and description say who is where", () => {
    const d = judgingDrawing(shiai());
    expect(d.title).toBe("Judging assignments: Shiai, 4 officials, 1 mat");
    expect(d.description).toContain("Referee Hana Ito, ID R-204; Timekeeper Sam Cole, ID T-11; Scorekeeper Ana Ruiz, ID T-12; Referee supervisor Peter Lindqvist-Haraldsson, ID S-3.");
    expect(texts(d.svg, "ky-ju-role")).toEqual(["Referee", "Timekeeper", "Scorekeeper", "Referee supervisor"]);
    expect(d.svg).toContain('data-judging="shiai"');
    expect(d.cards.map((c) => c.seat)).toEqual(["referee", "timekeeper", "scorekeeper", "supervisor"]);
    expect(d.svg).toContain("ky-bud-white-fill");
  });

  it("puts a name in its seat when it fits, as for a kata judge, and a side judge's card stands in the corner", () => {
    const names = [{ seat: "timekeeper", name: "Sam Cole", id: "T-1" }, { seat: "scorekeeper", name: "Ana Ruiz", id: "T-2" }, { seat: "supervisor", name: "Li Wei", id: "S-3" }, { seat: "side-judge-1", name: "Kim Park", id: "J-7" }];
    const d = judgingDrawing(shiai([{ officials: [{ seat: "referee", name: "Hana Ito", id: "R-2" }, ...names] }], { chart: "never" }));
    expect(d.cards.every((c) => c.fits)).toBe(true);
    expect(d.svg.match(/data-card="yes"/g)).toHaveLength(5);
    expect(d.cards.map((c) => c.seat)).toContain("side-judge-1");
    expect(d.cards.map((c) => c.seat)).not.toContain("side-judge-2");
  });

  it("keeps the referee's and the side judges' names in the chart when the picture is the bench close up, and says so by not fitting them", () => {
    const d = judgingDrawing(shiai([{ officials: [...SHIAI, { seat: "side-judge-1", name: "Kim", id: "J" }] }], { focus: "bench" }));
    expect(d.cards.find((c) => c.seat === "referee")!.fits).toBe(false);
    expect(d.cards.find((c) => c.seat === "side-judge-1")!.fits).toBe(false);
    expect(d.chart).toBe(true);
    expect(d.svg).not.toMatch(/class="ky-ju-seat" data-mat="1" data-seat="referee"/);
    expect(texts(d.svg, "ky-ju-name")).toEqual(expect.arrayContaining(["Hana Ito", "Kim"]));
    // Where nobody is named at the referee, there is nothing to lose: the bench alone, no chart needed when the names fit.
    const quiet = judgingDrawing(shiai([{ officials: [{ seat: "timekeeper", name: "Li Wei", id: "T-1" }] }], { focus: "bench" }));
    expect(quiet.chart).toBe(false);
  });

  it("speaks Japanese: the seats and the style", () => {
    const svg = drawJudging(shiai(undefined, { language: "ja", sideJudges: true }));
    for (const word of ["主審", "計時係", "記録係", "審判委員", "副審1", "副審2", "試合（6人体制）"]) expect(svg, word).toContain(word);
    expect(judgingTable(shiai(undefined, { language: "ja" }))).toContain("<td>主審</td>");
  });

  it("says the same as a table, a row for every seat", () => {
    expect(judgingTable(shiai()).match(/<tbody>[\s\S]*<\/tbody>/)![0].match(/<tr>/g)).toHaveLength(4);
    expect(judgingTable(shiai(undefined, { sideJudges: true })).match(/<tbody>[\s\S]*<\/tbody>/)![0].match(/<tr>/g)).toHaveLength(6);
  });
});

describe("the seats are numbers by default, and a name is on a seat only when asked for", () => {
  const plain = (rest: Partial<JudgingOptions> = {}): JudgingOptions => ({ style: "kata", mats: [{ officials: FIVE }], ...rest });

  it("shows every seat as its number on a round badge, large, with the chart drawn as the key, however short the names", () => {
    const short = judgingDrawing({ style: "kata", mats: [{ officials: [{ seat: 1, name: "Li Wei", id: "J-1" }] }], focus: "bench" });
    expect(short.chart).toBe(true);
    expect(short.svg).not.toContain('data-card="yes"');
    expect(short.svg).not.toContain('class="ky-ju-card"');
    expect(short.cards.map((c) => c.fits)).toEqual([false, true, true, true, true]);
    const badge = (svg: string): number => Number(/<circle class="ky-ju-badge" cx="[\d.]+" cy="[\d.]+" r="([\d.]+)"\/><text class="ky-ju-badge-n"/.exec(svg.slice(svg.indexOf('class="ky-ju-seat"')))![1]);
    expect(badge(short.svg)).toBeGreaterThanOrEqual(10);
    // Larger than the badge of the chart's rows? The chart's is 30; the plan's is as large as the seats allow, at least 10 units and at most 30.
    expect(badge(short.svg)).toBeLessThanOrEqual(30);
    expect(drawJudging(plain())).toContain("The names are in the chart of mat, seat, name and ID.");
    expect(judgingDrawing(plain()).description).not.toContain("in the seats where they fit");
    expect(judgingDrawing(plain({ chart: "never" })).chart).toBe(false);
  });

  it("puts a name on the seat with `seatNames`, in the chart's own face (the same classes' family and weight), and says so", () => {
    const d = judgingDrawing(plain({ seatNames: true, focus: "bench" }));
    expect(d.svg).toContain('data-card="yes"');
    expect(d.description).toContain("in the seats where they fit");
    expect(KYOGIJO_JUDGING_STYLE).toContain(".kyogijo .ky-ju-card-name{fill:var(--ky-ju-card-ink);font-family:var(--ky-font);font-weight:800;text-anchor:middle}");
    expect(KYOGIJO_JUDGING_STYLE).toContain(".kyogijo .ky-ju-name{fill:var(--ky-ju-ink);font-family:var(--ky-font);font-weight:800}");
    expect(() => judgingSetting(plain({ seatNames: "yes" as never }))).toThrow(TypeError);
  });

  it("never stretches or condenses a text: no textLength, no lengthAdjust, no scale of two numbers, in any picture", () => {
    const pictures = [drawJudging(plain()), drawJudging(plain({ seatNames: true, focus: "bench" })), drawJudging(plain({ orientation: "portrait", seatNames: true })), drawJudging(shiai(undefined, { seatNames: true })), judgingChart(plain())];
    for (const svg of pictures) {
      expect(svg).not.toMatch(/textLength|lengthAdjust|scaleX|scaleY/);
      for (const m of svg.matchAll(/scale\(([^)]*)\)/g)) expect(m[1].trim().split(/[ ,]+/), m[0]).toHaveLength(1);
    }
  });
});
