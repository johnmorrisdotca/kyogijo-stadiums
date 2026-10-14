// The budō surfaces' builders: the dojo's eras, blocks of contest areas, outline, surround, dais and banner, the weave of the mats, the colours that paint, and the room as data.
import { describe, expect, it } from "vitest";

import { dojo } from "./budo/dojo.api.ts";
import { resolveEra } from "./budo/dojo.ts";
import { dojoRoom } from "./budo/room.ts";
import { fourCorners } from "./budo/tatami.ts";
import { crowdStands, drawKyogijo } from "./draw.ts";
import { BUDO_LOOKS } from "./budo/looks.ts";
import { hallSurfaces, placeById } from "./atlas.ts";
import { KYOGIJO_STYLE } from "./index.ts";
import { dojoGallery } from "./budo/room.ts";
import type { DojoSpec } from "./budo/types.ts";

const eras: DojoSpec["eras"] = [
  { name: "earlier", from: 1960, to: 1999, look: "green-orange", outline: true },
  { name: "current", from: 2000, to: null, look: "yellow-green" },
];
const block: DojoSpec = { mats: { width: 26.4, length: 26.4 }, areas: { across: 2, down: 2 }, eras };

describe("a dojo's eras", () => {
  it("picks the last era with no ask, one by name, and one by the year it holds", () => {
    expect(resolveEra({ ...block }).era?.name).toBe("current");
    expect(resolveEra({ ...block, era: "earlier" }).spec.look).toBe("green-orange");
    expect(resolveEra({ ...block, year: 1975 }).era?.name).toBe("earlier");
    expect(resolveEra({ ...block, year: 2020 }).spec.look).toBe("yellow-green");
    expect(resolveEra({ ...block, year: 2020 }).spec.eras).toBeUndefined();
  });

  it("refuses an era no one is named and a year no era holds, and an era with unknown years is only picked by name", () => {
    expect(() => resolveEra({ ...block, era: "later" })).toThrow(/Unknown era/);
    expect(() => resolveEra({ ...block, year: 1900 })).toThrow(/No era/);
    const unknown: DojoSpec = { eras: [{ name: "a", from: null, to: null, look: "black-red" }, { name: "b", from: null, to: null }] };
    expect(() => resolveEra({ ...unknown, year: 2000 })).toThrow(/No era/);
    expect(resolveEra({ ...unknown, era: "a" }).spec.look).toBe("black-red");
  });

  it("changes the drawing: the two eras are different colours", () => {
    const a = drawKyogijo({ sport: "dojo", dojo: { ...block, era: "earlier" } });
    const b = drawKyogijo({ sport: "dojo", dojo: { ...block, era: "current" } });
    expect(a).not.toBe(b);
    expect(a).toContain("ky-bud-t3");
  });
});

describe("a block of contest areas and its outline", () => {
  it("lays four areas of 8 m in two rows, and an outline puts a band of the third colour round each", () => {
    const d = dojo({ ...block, eras: undefined, outline: true });
    expect(d.contests).toHaveLength(4);
    for (const c of d.contests) expect(c.x1 - c.x0).toBeCloseTo(8, 6);
    expect(d.mats.some((m) => m.tone === 3)).toBe(true);
    expect(dojo({ ...block, eras: undefined }).mats.some((m) => m.tone === 3)).toBe(false);
  });

  it("is the IJF's block in the Kodokan's 420 jō: four areas of 8 m, a safety zone of 4 m shared between them and at least 3 m round, the pale areas over a third of the floor", () => {
    const d = dojo({ mats: { width: 26.4, length: 26.4 }, areas: { across: 2, down: 2 } });
    const [a, b, c] = d.contests;
    expect(b.x0 - a.x1).toBeCloseTo(4, 6);
    expect(c.y0 - a.y1).toBeCloseTo(4, 6);
    // 3 m outside by the IJF, a little over where the floor of 420 jō (26.4 m square) is a little larger than the block of 26 m.
    expect(a.x0).toBeGreaterThanOrEqual(3);
    expect(a.x0).toBeCloseTo((26.4 - 20) / 2, 6);
    expect(d.jo).toBeCloseTo(420.8, 0);
    const pale = d.mats.filter((m) => m.tone === 1).reduce((sum, m) => sum + (m.x1 - m.x0) * (m.y1 - m.y0), 0);
    expect(pale).toBeCloseTo(4 * 64, 6);
    expect(pale / (26.4 * 26.4)).toBeGreaterThan(0.36);
  });

  it("refuses a block the floor cannot hold, and an area size outside the IJF's", () => {
    expect(() => dojo({ jo: 20, areas: { across: 2, down: 2 } })).toThrow(/too small/);
    expect(() => dojo({ mats: { width: 30, length: 30 }, areaSize: 12, areas: 1 })).toThrow(RangeError);
  });

  it("keeps the traditional lay: no four corners meet", () => {
    expect(fourCorners(dojo({ jo: 50 }).mats)).toBe(0);
  });
});

describe("the dais, the banner and the surround", () => {
  it("draw their own elements and are in the plan", () => {
    const d = dojo({ jo: 50, dais: true, banner: true, surround: 1 });
    const svg = drawKyogijo(d.options);
    expect(svg).toContain('class="ky-bud-dais"');
    expect(svg).toContain('class="ky-bud-banner"');
    expect(d.options.dojo?.surround).toBe(1);
    expect(drawKyogijo({ sport: "dojo", dojo: { jo: 50 } })).not.toContain('class="ky-bud-dais"');
  });
});

describe("the weave of the mats", () => {
  const weave = (svg: string): number => (svg.match(/linearGradient id="[^"]*-weave"/g) ?? []).length;
  it("is one shared gradient, on a traditional dojo by default and off at the simple detail or with texture none", () => {
    expect(weave(drawKyogijo({ sport: "dojo", dojo: { jo: 20 } }))).toBe(1);
    expect(weave(drawKyogijo({ sport: "dojo", dojo: { jo: 20 }, detail: "simple" }))).toBe(0);
    expect(weave(drawKyogijo({ sport: "dojo", dojo: { jo: 20, texture: "none" } }))).toBe(0);
    expect(weave(drawKyogijo({ sport: "dojo", dojo: { jo: 20, pattern: "checker" } }))).toBe(0);
  });

  it("is asked for on a judo area, and leaves the drawing's one pattern alone", () => {
    expect(weave(drawKyogijo({ sport: "judo" }))).toBe(0);
    const svg = drawKyogijo({ sport: "judo", budo: { texture: "weave" } });
    expect(weave(svg)).toBe(1);
    expect(svg).toContain("ky-bud-edge");
  });
});

describe("a dojo's colours", () => {
  it("paint the mats, the second tone, the border, the heri, the wood and the walls", () => {
    const svg = drawKyogijo({ sport: "dojo", dojo: { jo: 20, colours: { mat: "#112233", alt: "#445566", border: "#778899", heri: "#aabbcc", floor: "#ddeeff", wall: "#010203" } } });
    for (const colour of ["--ky-surface:#112233", "--ky-surface-alt:#445566", "--ky-red:#778899", "--ky-bud-heri:#aabbcc", "--ky-bud-floor:#ddeeff", "--ky-boards:#010203"]) expect(svg).toContain(colour);
  });
});

describe("the room as data", () => {
  it("gives a dojo's walls, dais, banner, doors, windows, surround and balconies", () => {
    const room = dojoRoom({ sport: "dojo", dojo: { jo: 50, dais: true, banner: true, surround: 1, windows: 2, shinzen: true, balcony: true } });
    expect(room?.walls).toHaveLength(4);
    expect(room?.walls.every((w) => typeof w.height === "number")).toBe(true);
    expect(room?.platforms[0]).toMatchObject({ id: "dais", height: 0.3, basis: "ours" });
    expect(room?.banners).toHaveLength(1);
    expect(room?.doors).toHaveLength(1);
    expect(room?.windows).toHaveLength(2);
    expect(room?.surround?.width).toBe(1);
    expect(room?.shrine?.height).toBeGreaterThan(0);
    expect(room?.balconies.map((b) => b.side)).toEqual(["north", "east", "south", "west"]);
    expect(room?.notes.length).toBeGreaterThan(0);
  });

  it("takes the sides a balcony is asked on, and none when none is asked", () => {
    expect(dojoRoom({ sport: "dojo", dojo: { jo: 20, balcony: { sides: ["left", "right"] } } })?.balconies.map((b) => b.side)).toEqual(["west", "east"]);
    expect(dojoRoom({ sport: "dojo", dojo: { jo: 20 } })?.balconies).toEqual([]);
  });

  it("gives the mats' thickness from the rules, the dohyo's height and the Budokan's octagon", () => {
    expect(dojoRoom({ sport: "judo" })?.mats).toMatchObject({ thickness: 0.05, edge: "rounded", basis: "source" });
    expect(dojoRoom({ sport: "judo", league: "ajjf" })?.mats?.thickness).toBe(0.06);
    expect(dojoRoom({ sport: "sumo" })?.platforms[0]).toMatchObject({ id: "dohyo", basis: "source" });
    const hall = dojoRoom({ sport: "judo", budo: { hall: "budokan" } });
    expect(hall?.hall?.corners).toHaveLength(8);
    expect(hall?.walls).toHaveLength(8);
  });

  it("has nothing for a sport that is not a budō", () => {
    expect(dojoRoom({ sport: "nhl" })).toBeUndefined();
  });
});

describe("a dojo's gallery", () => {
  it("is a thin band of plain seats close to the walls, with no sides and no team colours, from the room's balcony data", () => {
    const o = { sport: "dojo" as const, dojo: { jo: 50, surround: 1, balcony: true }, crowd: true as const };
    const stands = crowdStands(o);
    expect(stands?.gallery).toBe(true);
    expect(stands?.rings.map((r) => r.tier)).toEqual(["gallery"]);
    expect(stands?.sectors).toEqual([]);
    expect(stands?.gaps).toEqual([]);
    const gallery = dojoGallery(o);
    expect(gallery?.rows).toBe(3);
    // The first row is just beyond the wood surround and the wall, and the band is as deep as the balcony.
    expect(gallery?.offset).toBeCloseTo(1.3, 6);
    const ring = stands?.rings[0];
    expect(ring?.to).toBeCloseTo((gallery?.depth ?? 0) / 0.3048, 6);
    const svg = drawKyogijo(o);
    expect(svg).toContain("ky-bud-gbed");
    expect(svg).toContain("ky-bud-rail");
    expect(svg).not.toContain("ky-cr-a)");
  });

  it("is the dojo's crowd unless the dojo says balcony false, and the arenas keep their bowls", () => {
    expect(crowdStands({ sport: "dojo", crowd: true })?.gallery).toBe(true);
    expect(crowdStands({ sport: "dojo", dojo: { balcony: false }, crowd: true })?.gallery).toBeUndefined();
    const budokan = crowdStands({ sport: "judo", budo: { hall: "budokan" }, crowd: true });
    expect(budokan?.gallery).toBeUndefined();
    expect(budokan?.rings.map((r) => r.tier)).toEqual(["lower", "upper"]);
    expect(crowdStands({ sport: "sumo", crowd: true })?.gallery).toBeUndefined();
  });
});

describe("the Kodokan's gallery, per the owner", () => {
  const main = hallSurfaces(placeById("kodokan")!).find((surface) => surface.id === "main-dojo")!;
  const o = { sport: "dojo" as const, ...main.options, crowd: true as const };

  it("has 3 rows on each side, in blocks of 5, 8, 8, 8 and 5 seats: 34 to a row, 102 to a side", () => {
    const g = dojoGallery(o)!;
    expect(g.rows).toBe(3);
    expect(g.sections).toEqual([5, 8, 8, 8, 5]);
    expect(g.sections.reduce((a, k) => a + k, 0) * g.rows).toBe(102);
    expect(g.aisles).toHaveLength(4);
    const room = dojoRoom(o)!;
    expect(room.balconies).toHaveLength(4);
    for (const b of room.balconies) expect(b.sectionsBasis).toBe("given");
  });

  it("is drawn in 2D with an aisle across the band at each of them on every side", () => {
    const ring = crowdStands(o)!.rings[0];
    expect(ring.rows).toBe(3);
    // Four aisles on each of four sides.
    expect(ring.aisles).toHaveLength(16);
    const svg = drawKyogijo({ ...o, style: "none" });
    expect(/class="ky-bud-grow" d="([^"]*)"/.exec(svg)![1].match(/M/g)).toHaveLength(3);
    expect(/class="ky-bud-gaisle" d="([^"]*)"/.exec(svg)![1].match(/M/g)).toHaveLength(16);
  });

  it("takes other halls' sections as a parameter of the balcony, whatever they are", () => {
    const other = dojoRoom({ sport: "dojo", dojo: { jo: 50, balcony: { rows: 2, sections: [6, 6] } } })!;
    for (const b of other.balconies) {
      expect(b.rows).toBe(2);
      expect(b.sections).toEqual([6, 6]);
      expect(b.aisles).toHaveLength(1);
    }
  });
});

describe("a gallery seen from above", () => {
  it("is neat rows of seats along its band, 3 rows with aisles between the blocks, empty unless a crowd is asked for", () => {
    const svg = drawKyogijo({ sport: "dojo", dojo: { jo: 20, balcony: true }, crowd: true, style: "none" });
    const rows = /class="ky-bud-grow" d="([^"]*)"/.exec(svg)?.[1] ?? "";
    expect((rows.match(/M/g) ?? []).length).toBe(3);
    expect(svg).toContain("ky-bud-gback");
    expect(svg).toContain("ky-bud-gaisle");
    expect(svg).toContain("stroke-dasharray");
    expect(svg).not.toContain("ky-cr-people");
    expect(svg).not.toContain("-cr-h)");
    expect(svg).toContain("ky-bud-rail");
    // A crowd that is asked for (a density) is laid over the seats.
    const full = drawKyogijo({ sport: "dojo", dojo: { jo: 20, balcony: true }, crowd: { density: 0.6 }, style: "none" });
    expect(full).toContain("ky-cr-people");
    expect(full).toContain("ky-bud-grow");
  });
});

describe("the hardwood of a dojo's surround", () => {
  it("is laid as the basketball floor is, in boards and seams under a warm sheen, at full detail only", () => {
    const wood = drawKyogijo({ sport: "dojo", dojo: { jo: 20, surround: 2 }, style: "none" });
    expect(wood).toContain("-wood-a");
    expect(wood).toContain("-wood-b");
    expect(wood).toContain("-wood-s");
    expect(wood.match(/class="ky-bud-wood"/g)).toHaveLength(3);
    expect(wood).toContain("patternTransform");
    // Subtle: the boards are laid at half strength.
    expect(wood).toMatch(/class="ky-bud-wood"[^>]*opacity="0\.5"/);
    expect(drawKyogijo({ sport: "dojo", dojo: { jo: 20, surround: 2 }, detail: "simple", style: "none" })).not.toContain("-wood-a");
    expect(drawKyogijo({ sport: "dojo", dojo: { jo: 20 }, style: "none" })).not.toContain("-wood-a");
  });
});

describe("the mats are one calm surface", () => {
  const svg = drawKyogijo({ sport: "dojo", dojo: { jo: 20 }, theme: "light" });
  const rule = (name: string): string => new RegExp(`\\.kyogijo \\.${name}\\{([^}]*)\\}`).exec(KYOGIJO_STYLE)?.[1] ?? "";

  it("draws the seams a few per cent darker than the mat, thin, and the cloth edges as faint as a seam", () => {
    expect(rule("ky-bud-seam")).toContain("stroke:var(--ky-ink)");
    expect(Number(/stroke-opacity:([\d.]+)/.exec(rule("ky-bud-seam"))![1])).toBeLessThanOrEqual(0.15);
    expect(rule("ky-bud-heri")).toContain("fill-opacity:var(--ky-bud-hop,.07)");
    expect(Number(/stroke-opacity:([\d.]+)/.exec(rule("ky-bud-edge"))![1])).toBeLessThanOrEqual(0.06);
    expect(rule("ky-bud-edge")).not.toContain("#fff");
    expect(svg).toContain("ky-bud-seam");
  });

  it("weaves the mats very faintly, in dark ridges only, and a heri the colours name is a cloth edge again", () => {
    const stops = [...svg.matchAll(/<stop offset="[^"]*" stop-color="([^"]*)" stop-opacity="([\d.]+)"/g)].filter((m) => m[2] !== "0");
    expect(stops.length).toBeGreaterThan(0);
    for (const [, colour, alpha] of stops) {
      expect(colour).toBe("#000000");
      expect(Number(alpha)).toBeLessThanOrEqual(0.04);
    }
    expect(drawKyogijo({ sport: "dojo", dojo: { jo: 20 }, style: "none" })).not.toContain("--ky-bud-hop");
    expect(drawKyogijo({ sport: "dojo", dojo: { jo: 20, colours: { heri: "#223344" } }, style: "none" })).toContain("--ky-bud-hop:.82");
  });

  it("paints the walls of every look a light cream, not a dark green", () => {
    for (const name of Object.keys(BUDO_LOOKS.dojo)) {
      const hex = BUDO_LOOKS.dojo[name].light.boards;
      const n = Number.parseInt(hex.slice(1), 16);
      expect(((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3, name).toBeGreaterThan(190);
    }
  });
});
