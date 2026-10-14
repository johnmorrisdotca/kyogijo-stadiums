import { describe, expect, it } from "vitest";
import { SPORTS, drawKyogijo } from "./index.ts";
import type { ScoreOptions } from "./types.ts";

const game = { home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#a8452c" }, away: { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" }, status: "final" } as const;

describe("plate: false", () => {
  it("draws a score with no panel on the surface, for every sport", () => {
    for (const sport of SPORTS) {
      const o: ScoreOptions = { sport, ...game };
      const withPlate = drawKyogijo(o);
      const without = drawKyogijo({ ...o, plate: false });
      // The panel (or the board of curling, cricket and the net sports) is in the first and not in the second: the shorter drawing has nothing else taken out.
      expect(without.length, sport).toBeLessThan(withPlate.length);
      expect(without, sport).not.toMatch(/<g class="ky-plate/);
      expect(without, sport).not.toContain("3–2");
    }
  });

  it("keeps the teams' names on the surface, and is the same text as before when it is true or left out", () => {
    const o: ScoreOptions = { sport: "nhl", id: "p", ...game };
    expect(drawKyogijo({ ...o, plate: false })).toContain("NORTHERN");
    expect(drawKyogijo({ ...o, plate: true })).toBe(drawKyogijo(o));
    expect(drawKyogijo(o)).toMatch(/<g class="ky-plate/);
  });
});
