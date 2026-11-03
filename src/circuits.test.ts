// The circuits: the facts and their bases, the plan, the drawing (pure, escaped, every turn numbered and none on the track), the words in both languages, and the 3D view's budget and steadiness.
import { describe, expect, it } from "vitest";
import { CIRCUITS, CIRCUIT_ATTRIBUTION, CIRCUIT_IDS, CIRCUIT_PLANES_MAX, CIRCUIT_PRESETS, CIRCUIT_WORDS, buildCircuitTurn, circuitById, circuitDrawing, circuitPlan, circuitTable, circuitTurnMarkup, drawCircuit, lineLength } from "./circuits-entry.ts";
import { nearestOn, simplifyLine, simplifyLoop } from "./circuits.geo.ts";
import { VENUE_ATTRIBUTION } from "./venues.ts";
import { layoutOf } from "./turn.markup.ts";
import type { Pt } from "./crowd.ts";

const LV = circuitById("las-vegas")!;

describe("the circuits' data", () => {
  it("has Las Vegas with its facts, each documented or ours and said to be", () => {
    expect(CIRCUIT_IDS).toEqual(["las-vegas"]);
    expect(LV.wikidata).toBe("Q113112116");
    expect(LV.names).toEqual({ en: "Las Vegas Strip Circuit", ja: "ラスベガス・ストリップ・サーキット" });
    expect([LV.length.value, LV.length.basis]).toEqual([6201, "documented"]);
    expect([LV.corners.value, LV.corners.basis]).toEqual([17, "documented"]);
    expect([LV.opened.value, LV.direction.value]).toEqual(["2023-11-16", "counterclockwise"]);
    // No source gives the widths: they are ours, and say so.
    expect([LV.width.value, LV.width.basis, LV.pitLaneWidth.basis]).toEqual([12, "plausible", "plausible"]);
    for (const c of CIRCUITS) for (const key of ["opened", "length", "corners", "direction", "width", "pitLaneWidth"] as const) expect(c[key].read.length, `${c.id} ${key}`).toBeGreaterThan(10);
  });

  it("keeps OpenStreetMap's data apart, with its credit, the venues' own words", () => {
    expect(CIRCUIT_ATTRIBUTION).toBe(VENUE_ATTRIBUTION);
    expect(LV.osm.licence).toBe("ODbL-1.0");
    expect(LV.osm.attribution).toBe(CIRCUIT_ATTRIBUTION);
    expect(LV.osm.source).toBe("relation/16696508");
    expect(LV.osm.turns.map((t) => t.n)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    expect(LV.osm.pitBuilding?.height).toBe(19.5);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(CIRCUITS)).toBe(true);
    expect(Object.isFrozen(LV)).toBe(true);
  });
});

describe("the plan", () => {
  const plan = circuitPlan(LV);

  it("measures the drawn lap within 3 percent of the published length (it is 0.15 percent long)", () => {
    expect(Math.abs(plan.measured / LV.length.value - 1)).toBeLessThan(0.03);
    expect(Math.round(plan.measured)).toBe(6210);
    // The frame is feet: the same lap measured in it.
    expect(lineLength(plan.lap, true) / 3.28084).toBeCloseTo(plan.measured, 0);
  });

  it("lies with its long side along the page, north where the arrow says", () => {
    const w = plan.box.x1 - plan.box.x0;
    const h = plan.box.y1 - plan.box.y0;
    expect(w).toBeGreaterThan(h);
    expect(plan.north).toBeCloseTo(90 - plan.heading, 6);
  });

  it("puts every turn on the lap, in the order of the lap from the start", () => {
    const along = plan.turns.map((t) => t.along);
    expect([...along].sort((a, b) => a - b)).toEqual(along);
    for (const t of plan.turns) expect(nearestOn(plan.lap, t.at, true).d).toBeLessThan(0.01);
  });

  it("runs counterclockwise on the page, as the source says (a rotation, never a mirror)", () => {
    let sum = 0;
    plan.lap.forEach((p, i) => {
      const q = plan.lap[(i + 1) % plan.lap.length];
      sum += p[0] * q[1] - q[0] * p[1];
    });
    // y grows down the page, so a ring that runs counterclockwise to the eye has a negative shoelace sum.
    expect(sum).toBeLessThan(0);
  });
});

describe("drawCircuit", () => {
  const svg = drawCircuit({ circuit: "las-vegas" });

  it("is a pure function of its options", () => {
    expect(drawCircuit({ circuit: "las-vegas" })).toBe(svg);
    expect(drawCircuit({ circuit: "las-vegas", language: "ja" })).not.toBe(svg);
  });

  it("draws the lap, the pit lane, the start, the finish, the arrows, the north arrow, the scale and the credit", () => {
    for (const part of ['data-part="lap"', 'data-part="pit-lane"', 'data-part="start"', "ky-ci-finish", "ky-ci-arrows", "ky-ci-compass", "ky-ci-scalebar", "ky-ci-building", CIRCUIT_ATTRIBUTION]) expect(svg, part).toContain(part);
    for (let n = 1; n <= 17; n += 1) expect(svg).toContain(`data-turn="${n}"`);
    expect(svg).toContain('data-direction="counterclockwise"');
    // The track's own width, in feet.
    expect(svg).toMatch(new RegExp(`class="ky-ci-track"[^>]*stroke-width="${(12 * 3.28084).toFixed(2).replace(/0+$/, "")}`));
  });

  it("leaves the turns, the arrows and the name out when asked", () => {
    const bare = drawCircuit({ circuit: "las-vegas", turns: false, arrows: false, label: false });
    expect(bare).not.toContain("data-turn=");
    expect(bare).not.toContain('class="ky-ci-arrow');
    expect(bare).not.toContain('class="ky-ci-name');
  });

  it("places no turn's number on the track or on another's", () => {
    const d = circuitDrawing({ circuit: "las-vegas" });
    for (const b of d.badges) expect(nearestOn(d.plan.lap, b.at, true).d, `turn ${b.n}`).toBeGreaterThanOrEqual(d.plan.width / 2 + b.r);
    for (const a of d.badges) for (const b of d.badges) if (a.n < b.n) expect(Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]), `${a.n} and ${b.n}`).toBeGreaterThanOrEqual(2 * a.r);
  });

  it("says what it is in English and Japanese, with the credit", () => {
    const en = circuitDrawing({ circuit: "las-vegas" });
    expect(en.title).toBe("Las Vegas Strip Circuit");
    expect(en.description).toContain("6.201 km");
    expect(en.description).toContain("counterclockwise");
    expect(en.description).toContain("12 m wide, which is ours");
    expect(en.description).toContain(CIRCUIT_ATTRIBUTION);
    const ja = circuitDrawing({ circuit: "las-vegas", language: "ja" });
    expect(ja.title).toBe("ラスベガス・ストリップ・サーキット");
    expect(ja.description).toContain("反時計回り");
    expect(ja.svg).toContain("全長6.201 km・17コーナー");
  });

  it("follows the page's theme, or the one asked for", () => {
    expect(svg).not.toMatch(/^<svg[^>]*data-theme=/);
    expect(drawCircuit({ circuit: "las-vegas", theme: "dark" })).toMatch(/^<svg[^>]*data-theme="dark"/);
    expect(svg).toContain("prefers-color-scheme:dark");
    expect(drawCircuit({ circuit: "las-vegas", css: "none" })).not.toContain("<style>");
  });

  it("makes safe what comes from outside", () => {
    const hostile = drawCircuit({ circuit: "las-vegas", id: '"><script>x</script>', className: 'a" onload="x' });
    expect(hostile).not.toContain("<script>");
    expect(hostile).not.toContain('onload="');
    expect(() => drawCircuit({ circuit: "<b>nowhere</b>" })).toThrow(/the circuits are las-vegas/);
  });

  it("gives its facts as a table, each with its basis", () => {
    const table = circuitTable({ circuit: "las-vegas" });
    expect(table).toContain("6.201 km");
    expect(table).toContain("6.210 km");
    expect(table).toContain("ours (plausible)");
    expect(circuitTable({ circuit: "las-vegas", language: "ja" })).toContain("反時計回り");
  });
});

describe("the words", () => {
  const keys = (o: object, at = ""): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v as object, `${at}${k}.`) : [`${at}${k}`])).sort();
  it("are the same keys in English and Japanese, and every Japanese one is Japanese", () => {
    expect(keys(CIRCUIT_WORDS.ja)).toEqual(keys(CIRCUIT_WORDS.en));
    for (const text of [CIRCUIT_WORDS.ja.lap, CIRCUIT_WORDS.ja.turns, CIRCUIT_WORDS.ja.standing, CIRCUIT_WORDS.ja.table.caption]) expect(text).toMatch(/[぀-ヿ一-鿿]/u);
  });
});

describe("the line helpers", () => {
  it("make a line simpler without moving its ends, and a loop without moving its start", () => {
    const line: Pt[] = [[0, 0], [1, 0.01], [2, 0], [3, 5], [4, 0]];
    expect(simplifyLine(line, 0.1)).toEqual([[0, 0], [2, 0], [3, 5], [4, 0]]);
    const loop: Pt[] = [[0, 0], [5, 0.01], [10, 0], [10, 10], [0, 10]];
    expect(simplifyLoop(loop, 0.1)).toEqual([[0, 0], [10, 0], [10, 10], [0, 10]]);
  });
});

describe("the 3D view", () => {
  const model = buildCircuitTurn({ circuit: "las-vegas" });

  it("stands the pit building and each turn's number up, within the budget of planes", () => {
    expect(model.planes.length).toBeLessThanOrEqual(CIRCUIT_PLANES_MAX);
    const signs = model.planes.filter((p) => p.kind === "sign");
    expect(signs.map((p) => p.id)).toEqual(Array.from({ length: 17 }, (_, i) => `turn-${i + 1}`));
    expect(signs.every((p) => p.billboard === true && p.lean === true)).toBe(true);
    const building = model.planes.filter((p) => p.kind === "block");
    expect(building.length).toBeGreaterThan(4);
    expect(Math.max(...building.map((p) => p.o[2]))).toBeCloseTo(19.5 * 3.28084, 3);
    expect(model.standing).toContain("19.5 m");
    expect(model.presets).toBe(CIRCUIT_PRESETS);
  });

  it("keeps the floor light: one SVG of a few tens of kilobytes, the turns' numbers off it", () => {
    expect(model.floor.length).toBeLessThan(40_000);
    expect(model.floor).not.toContain("data-turn=");
    expect(model.flat).toContain('data-turn="17"');
  });

  it("stands no turn marker with turns: false, flat or in 3D, and keeps the pit building", () => {
    const off = buildCircuitTurn({ circuit: "las-vegas", turns: false });
    expect(off.planes.filter((p) => p.kind === "sign")).toEqual([]);
    expect(off.planes.filter((p) => p.id.startsWith("turn-"))).toEqual([]);
    expect(off.planes.filter((p) => p.kind === "block").length).toBeGreaterThan(4);
    expect(off.floor).not.toContain("data-turn=");
    expect(off.flat).not.toContain("data-turn=");
    expect(circuitTurnMarkup({ circuit: "las-vegas", turns: false }, { preset: "corner" })).not.toContain('data-part="turn-');
    expect(drawCircuit({ circuit: "las-vegas", turns: false })).not.toContain("data-turn=");
  });

  it("is the floor alone with uprights: false", () => {
    const bare = buildCircuitTurn({ circuit: "las-vegas" }, { uprights: false });
    expect(bare.planes).toEqual([]);
    expect(bare.floor).toContain('data-turn="1"');
  });

  it("is markup a server can make, with nothing nested in 3D", () => {
    const html = circuitTurnMarkup({ circuit: "las-vegas" }, { preset: "corner" });
    expect(html).toContain('data-part="turn-17"');
    expect(html).toContain('data-part="pit-w0"');
    expect(html).not.toContain("preserve-3d");
    expect(circuitTurnMarkup({ circuit: "las-vegas" }, { preset: "corner" })).toBe(html);
  });

  it("keeps its size while it turns: the floor's area is the same at every turn", () => {
    const parse = (t: string): number[] => t.slice("matrix3d(".length, -1).split(",").map(Number);
    const width = model.viewBox.w * model.scale;
    const height = model.viewBox.h * model.scale;
    for (const pitch of [CIRCUIT_PRESETS.broadcast.pitch, CIRCUIT_PRESETS.corner.pitch]) {
      const areas: number[] = [];
      for (let yaw = 0; yaw < 360; yaw += 10) {
        const m = parse(layoutOf(model, { yaw, pitch, zoom: 1 }, 1280, 800).transforms[0]);
        const pts = [[0, 0], [width, 0], [width, height], [0, height]].map(([x, y]) => {
          const q = m[3] * x + m[7] * y + m[15];
          return [(m[0] * x + m[4] * y + m[12]) / q, (m[1] * x + m[5] * y + m[13]) / q];
        });
        areas.push(Math.abs(pts.reduce((s, p, i) => s + p[0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * p[1], 0)) / 2);
      }
      expect(Math.max(...areas) / Math.min(...areas), `pitch ${pitch}`).toBeLessThan(1.02);
    }
  });
});
