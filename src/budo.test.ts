// The budō surfaces' builders: the dojo's eras, blocks of contest areas, outline, surround, dais and banner, the weave of the mats, the colours that paint, and the room as data.
import { describe, expect, it } from "vitest";

import { dojo } from "./budo/dojo.api.ts";
import { resolveEra } from "./budo/dojo.ts";
import { dojoRoom } from "./budo/room.ts";
import { fourCorners } from "./budo/tatami.ts";
import { crowdStands, drawKyogijo } from "./draw.ts";
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
    expect(gallery?.rows).toBe(4);
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
