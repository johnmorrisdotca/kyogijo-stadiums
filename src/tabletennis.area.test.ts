// The table tennis playing area (the ITTF's Regulations for International Competitions, 3.2.3, chapter 3 of the ITTF Statutes 2026): the space of each kind of event, the surrounds that enclose it, the umpires'
// chairs and table inside it, in 2D and 3D, and the tournament layouts that take that space for their unit.
import { describe, expect, it } from "vitest";

import { courtFor, courtGeometry, type CourtPlan } from "./court.ts";
import { drawKyogijo } from "./draw.ts";
import { FEATURE_INFO } from "./features.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { ITTF_TABLE } from "./leagues/courts.ts";
import { MULTI_PRESETS } from "./multi.data.ts";
import { multiLayout } from "./multi-entry.ts";
import { buildTurn } from "./turn-entry.ts";

const ft = (m: number): number => m * FEET_PER_METRE;
/** The plan of a table tennis surface (the plan of a net sport is a union of twelve). */
function ttPlan(net?: object): Extract<CourtPlan, { sport: "tabletennis" }> {
  const plan = courtFor({ sport: "tabletennis", ...(net === undefined ? {} : { net }) } as Parameters<typeof courtFor>[0]);
  if (plan.sport !== "tabletennis") throw new Error("not table tennis");
  return plan;
}
const rectOf = (s: { kind: string; rect?: readonly number[] }): number[] => [...(s.rect ?? [])];
const metres = (feet: number): number => feet / FEET_PER_METRE;
const close = (a: number, b: number, places = 6): void => expect(a).toBeCloseTo(b, places);

describe("the playing space of each kind of event", () => {
  it("is 14 m by 7 m by 5 m, 10 m by 5 m for Masters events and 8 m by 6 m for wheelchair events", () => {
    expect(ITTF_TABLE.space).toEqual({ standard: { length: 14, width: 7, height: 5 }, masters: { length: 10, width: 5, height: 5 }, wheelchair: { length: 8, width: 6, height: 5 } });
  });

  it("has surrounds 50 cm to 100 cm high, and the free zones are the table centred in the standard and in the Masters space", () => {
    expect(ITTF_TABLE.surround).toMatchObject({ least: 0.5, greatest: 1 });
    expect(ITTF_TABLE.surround.drawn).toBeGreaterThanOrEqual(0.5);
    expect(ITTF_TABLE.surround.drawn).toBeLessThanOrEqual(1);
    close(ITTF_TABLE.free.official?.end ?? 0, (14 - 2.74) / 2);
    close(ITTF_TABLE.free.official?.side ?? 0, (7 - 1.525) / 2);
    close(ITTF_TABLE.free.least?.end ?? 0, (10 - 2.74) / 2);
    close(ITTF_TABLE.free.least?.side ?? 0, (5 - 1.525) / 2);
  });
});

describe("the area a surface asks for", () => {
  const space = (net?: object): { length: number; width: number } => {
    const plan = ttPlan(net);
    const zone = plan.zone;
    if (zone === null) throw new Error("no zone");
    return { length: metres(plan.figures.length + 2 * zone.end), width: metres(plan.figures.width + 2 * zone.side) };
  };

  it("is the standard space by default, the Masters one for `free: least` or `area: masters`, the wheelchair one for `area: wheelchair`", () => {
    for (const [net, want] of [[undefined, [14, 7]], [{ free: "least" }, [10, 5]], [{ area: "masters" }, [10, 5]], [{ area: "wheelchair" }, [8, 6]], [{ area: "standard", free: "official" }, [14, 7]]] as const) {
      const got = space(net);
      close(got.length, want[0]);
      close(got.width, want[1]);
    }
  });

  it("draws no area at all with `free: none`, and then no surrounds and no chairs", () => {
    const plan = ttPlan({ free: "none" });
    expect(plan.zone).toBeNull();
    const geometry = courtGeometry(plan);
    expect(geometry.bands).toHaveLength(0);
    expect(geometry.solids).toHaveLength(0);
  });

  it("leaves out the surrounds, or the umpires, when asked", () => {
    expect(courtGeometry(ttPlan({ surrounds: false })).bands).toHaveLength(0);
    expect(courtGeometry(ttPlan({ surrounds: false })).solids).toHaveLength(3);
    expect(courtGeometry(ttPlan({ umpires: false })).solids).toHaveLength(0);
    expect(courtGeometry(ttPlan({ umpires: false })).bands).toHaveLength(4);
  });

  it("refuses an area that is not a kind of event, and `area` on another sport", () => {
    expect(() => courtFor({ sport: "tabletennis", net: { area: "club" as never } })).toThrow(/standard, masters, wheelchair/);
    expect(() => courtFor({ sport: "badminton", net: { area: "masters" } })).toThrow(/table tennis/);
  });
});

describe("what stands in the area", () => {
  const plan = ttPlan();
  const geometry = courtGeometry(plan);
  const L = plan.figures.length;
  const W = plan.figures.width;
  const zone = plan.zone as { side: number; end: number };

  it("has four surrounds that enclose the space, inside its edge and one board thick", () => {
    const t = plan.figures.surround.thickness;
    expect(geometry.bands).toHaveLength(4);
    const xs = geometry.bands.flatMap((b) => [b.rect[0], b.rect[2]]);
    const ys = geometry.bands.flatMap((b) => [b.rect[1], b.rect[3]]);
    close(Math.min(...xs), -zone.end);
    close(Math.max(...xs), L + zone.end);
    close(Math.min(...ys), -zone.side);
    close(Math.max(...ys), W + zone.side);
    const thin = geometry.bands.map((b) => Math.min(b.rect[2] - b.rect[0], b.rect[3] - b.rect[1]));
    for (const v of thin) close(v, t);
  });

  it("has the umpire's chair in line with the net, the assistant umpire's directly facing it across the table, and the umpires' table beside the first", () => {
    const [umpire, assistant] = geometry.solids.filter((s) => s.kind === "chair").map((s) => rectOf(s));
    const [desk] = geometry.solids.filter((s) => s.kind === "desk").map((s) => rectOf(s));
    const net = geometry.net?.x ?? L / 2;
    // In line with the net: its middle is the net's x.
    close((umpire[0] + umpire[2]) / 2, net);
    close((assistant[0] + assistant[2]) / 2, net);
    // On the two sides of the table, at the same distance from it.
    expect(umpire[3]).toBeLessThan(0);
    expect(assistant[1]).toBeGreaterThan(W);
    close(-umpire[3], assistant[1] - W);
    // The table is beside the umpire's chair, not in front of it.
    expect(desk[0]).toBeGreaterThanOrEqual(umpire[2]);
    // Everything is inside the surrounds.
    const t = plan.figures.surround.thickness;
    for (const r of [umpire, assistant, desk]) {
      expect(r[0]).toBeGreaterThan(-zone.end + t);
      expect(r[2]).toBeLessThan(L + zone.end - t);
      expect(r[1]).toBeGreaterThan(-zone.side + t);
      expect(r[3]).toBeLessThan(W + zone.side - t);
    }
  });

  it("fits the smallest space too: the chairs and the table are inside the surrounds of the Masters and the wheelchair areas", () => {
    for (const area of ["masters", "wheelchair"] as const) {
      const p = ttPlan({ area });
      const z = p.zone as { side: number; end: number };
      for (const s of courtGeometry(p).solids) {
        const r = rectOf(s);
        expect(r[1], area).toBeGreaterThan(-z.side + p.figures.surround.thickness);
        expect(r[3], area).toBeLessThan(p.figures.width + z.side - p.figures.surround.thickness);
      }
    }
  });
});

describe("the picture", () => {
  /** The boxes of the paths of a class: `M x0 y0 H x1 V y1 H x0 Z`, in the drawing's feet. */
  function boxes(svg: string, cls: string): number[][] {
    return [...svg.matchAll(new RegExp(`<path class="${cls}" d="M(-?[\\d.]+) (-?[\\d.]+)H(-?[\\d.]+)V(-?[\\d.]+)H`, "g"))].map((m) => [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]);
  }
  const svg = drawKyogijo({ sport: "tabletennis", style: "none" });

  it("draws a free zone of 14 m by 7 m round a table of 2.74 m by 1.525 m, enclosed by four surrounds of one dark class, with two chairs and a table", () => {
    const zone = /<rect class="ky-free" x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg);
    expect(zone).not.toBeNull();
    expect(metres(Number(zone?.[3]))).toBeCloseTo(14, 1);
    expect(metres(Number(zone?.[4]))).toBeCloseTo(7, 1);
    expect(boxes(svg, "ky-wall")).toHaveLength(4);
    expect(boxes(svg, "ky-chair")).toHaveLength(2);
    expect(boxes(svg, "ky-table")).toHaveLength(1);
  });

  it("carries the dark colour of the surrounds, and not a light one: the floor and the surrounds are dark in both themes", () => {
    const styled = drawKyogijo({ sport: "tabletennis" });
    expect(styled).toMatch(/--ky-wall:#161a1f/);
    expect(styled).toMatch(/--ky-wall:#05070a/);
    const luminance = (hex: string): number => {
      const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    for (const hex of ["#161a1f", "#05070a", "#1f4f8f", "#2f6f4f", "#1a4079", "#25583f"]) expect(luminance(hex), hex).toBeLessThan(0.4);
  });

  it("is what it was with `free: none`: a table and its net on the ground", () => {
    const bare = drawKyogijo({ sport: "tabletennis", style: "none", net: { free: "none" } });
    expect(bare).not.toContain('class="ky-wall"');
    expect(bare).not.toContain('class="ky-chair"');
    expect(bare).not.toContain('class="ky-free"');
  });

  it("names the new parts in the features a page can restyle", () => {
    const names = (FEATURE_INFO.tabletennis ?? []).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(["walls", "umpires-table", "chairs"]));
  });
});

describe("in 3D", () => {
  const model = buildTurn({ sport: "tabletennis" }, {});
  const surrounds = model.planes.filter((p) => p.kind === "surround");

  it("has the surrounds standing on the edge of the space, 75 cm high, in short pieces", () => {
    expect(surrounds.length).toBeGreaterThanOrEqual(4);
    for (const p of surrounds) {
      expect(p.o[2] === 0 || p.o[2] + p.v[2] === 0 || p.o[2] + p.u[2] === 0).toBe(true);
      const top = Math.max(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]);
      expect(metres(top)).toBeCloseTo(ITTF_TABLE.surround.drawn, 2);
      expect(Math.hypot(p.u[0], p.u[1]) <= 10.01 || Math.hypot(p.v[0], p.v[1]) <= 10.01).toBe(true);
    }
  });

  it("has the umpires' chairs and table as solid boxes on the floor, a top and four sides each", () => {
    const chairs = model.planes.filter((p) => p.kind === "chair");
    const desks = model.planes.filter((p) => p.kind === "desk");
    expect(chairs).toHaveLength(10);
    expect(desks).toHaveLength(5);
    // Each box has four sides that stand on the floor and a top over them.
    for (const kind of [chairs, desks]) {
      const feet = kind.map((p) => Math.min(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2]));
      expect(feet.filter((z) => Math.abs(z) < 1e-6)).toHaveLength((kind.length / 5) * 4);
    }
  });

  it("lays the area's floor over the hall's ground, under the table's shadow", () => {
    const floor = model.planes.find((p) => p.id === "area-floor");
    const shadow = model.planes.find((p) => p.id === "table-shadow");
    if (floor === undefined || shadow === undefined) throw new Error("the floor and the shadow are planes");
    expect(floor.o[2]).toBeGreaterThan(0);
    expect(floor.o[2]).toBeLessThan(shadow.o[2]);
    close(metres(Math.hypot(...floor.u)), 14, 2);
    close(metres(Math.hypot(...floor.v)), 7, 2);
  });

  it("has none of it with `free: none`", () => {
    const bare = buildTurn({ sport: "tabletennis", net: { free: "none" } }, {});
    expect(bare.planes.some((p) => p.kind === "surround" || p.kind === "chair" || p.kind === "desk" || p.id === "area-floor")).toBe(false);
  });
});

describe("the tournament layouts take the space for their unit", () => {
  const presets = MULTI_PRESETS.filter((p) => p.sport === "tabletennis");

  it("give each area the standard space: the bay is 14 m by 7 m, the table stands in its middle", () => {
    expect(presets.map((p) => p.id)).toEqual(["tabletennis-4", "tabletennis-8"]);
    for (const p of presets) {
      expect(p.bay).toEqual({ length: ITTF_TABLE.space.standard.length, width: ITTF_TABLE.space.standard.width, unit: "m" });
      const layout = multiLayout({ preset: p.id });
      for (const cell of layout.cells) {
        close(metres(cell.bay.w), 14, 2);
        close(metres(cell.bay.h), 7, 2);
        close(cell.x + cell.w / 2, cell.bay.x + cell.bay.w / 2, 4);
        close(cell.y + cell.h / 2, cell.bay.y + cell.bay.h / 2, 4);
      }
    }
  });

  it("tile the floor with whole areas: four need 28 m by 14 m and eight need 56 m by 14 m", () => {
    expect(multiLayout({ preset: "tabletennis-4" }).needs).toMatchObject({ length: 28, width: 14 });
    expect(multiLayout({ preset: "tabletennis-8" }).needs).toMatchObject({ length: 56, width: 14 });
    expect(ft(14)).toBeCloseTo(45.93, 1);
  });

  it("draw the table of each area only: the layout itself has the surrounds and the chairs of its bays", () => {
    for (const p of presets) expect(p.surface).toMatchObject({ sport: "tabletennis", net: { free: "none" } });
  });

  it("cite the 2026 Statutes: surrounds 50 cm to 100 cm, not the old 'about 75 cm'", () => {
    for (const p of presets) {
      expect(p.sources).toContain("ittf-statutes-2026");
      expect(p.rule.en).not.toMatch(/about 75 cm/);
    }
    expect(presets[0].rule.en).toMatch(/50 cm to 100 cm/);
  });
});
