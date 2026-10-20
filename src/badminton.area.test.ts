// The space round a badminton court (the BWF's Specifications for International Standard Facilities, Statutes 5.3.4, 2.1.3 and 2.2.3: at least 2 m clear behind the baselines and 1.5 m from the side lines, and 1.5 m between
// two courts side by side), drawn as the court's free zone, and the tournament layouts' bays, which are that space and the spacing between courts.
import { describe, expect, it } from "vitest";

import { courtFor } from "./court.ts";
import { drawKyogijo } from "./draw.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { BWF_BADMINTON } from "./leagues/courts.ts";
import { MULTI_PRESETS } from "./multi.data.ts";
import { multiLayout } from "./multi-entry.ts";

const metres = (feet: number): number => feet / FEET_PER_METRE;

describe("the space round a badminton court", () => {
  it("is 2 m behind the baselines and 1.5 m from the side lines, the same at every tournament", () => {
    expect(BWF_BADMINTON.free).toEqual({ official: { side: 1.5, end: 2 }, least: { side: 1.5, end: 2 } });
  });

  it("is the free zone of the drawing: 17.4 m by 9.1 m round a court of 13.4 m by 6.1 m", () => {
    const svg = drawKyogijo({ sport: "badminton", style: "none" });
    const zone = /<rect class="ky-free" x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg);
    expect(zone).not.toBeNull();
    expect(metres(Number(zone?.[3]))).toBeCloseTo(17.4, 1);
    expect(metres(Number(zone?.[4]))).toBeCloseTo(9.1, 1);
    expect(metres(-Number(zone?.[1]))).toBeCloseTo(2, 1);
    expect(metres(-Number(zone?.[2]))).toBeCloseTo(1.5, 1);
  });

  it("is left out with `free: none`, and `least` is the same as `official`", () => {
    expect(drawKyogijo({ sport: "badminton", style: "none", net: { free: "none" } })).not.toContain('class="ky-free"');
    expect(courtFor({ sport: "badminton", net: { free: "least" } }).zone).toEqual(courtFor({ sport: "badminton" }).zone);
  });
});

describe("the tournament layouts' badminton bays", () => {
  const presets = MULTI_PRESETS.filter((p) => p.sport === "badminton");

  it("are the court and the space the BWF asks for: 1.5 m between courts at the least, 4 m (recommended) at Grade 1 and 2", () => {
    const bay = (id: string): { length: number; width: number } => {
      const spec = presets.find((p) => p.id === id);
      if (spec?.bay === undefined) throw new Error(id);
      return { length: spec.bay.length, width: spec.bay.width };
    };
    // A court turned across the layout: the bay's width is the court's length and the zone behind both baselines, its length the court's width and the space between courts.
    expect(bay("badminton-1x4-min").width).toBeCloseTo(BWF_BADMINTON.length + 2 * (BWF_BADMINTON.free.official?.end ?? 0), 6);
    expect(bay("badminton-1x4-min").length).toBeCloseTo(BWF_BADMINTON.width + 1.5, 6);
    expect(bay("badminton-1x4").length).toBeCloseTo(BWF_BADMINTON.width + 4, 6);
  });

  it("draw the court alone, as before: the layout has the space", () => {
    for (const p of presets) expect(p.surface).toMatchObject({ sport: "badminton", net: { free: "none" } });
    expect(multiLayout({ preset: "badminton-1x4-min" }).cells).toHaveLength(4);
  });
});
