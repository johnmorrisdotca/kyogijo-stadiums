// A lineup's players stand where the score's panel would hide them: the score goes to the strip under the drawing unless `score: "centre"` asks for it, and the situation's pill goes there too.
import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";

const game = { home: { name: "Rovers", abbr: "ROV", score: 1 }, away: { name: "Harbour", abbr: "HAR", score: 2 } };
const lineup = (side: "home" | "away") => ({ kind: "lineup" as const, side, players: [{ pos: "GK", number: 1, name: "Okafor" }] });
const layers = [lineup("home"), lineup("away")];
const power = { awaySkaters: 5, homeSkaters: 4, clock: "1:42" };

describe("score and situation over a lineup", () => {
  it("sends the score to the strip below the surface by default", () => {
    const svg = drawKyogijo({ sport: "soccer", ...game, layers });
    expect(svg).toContain('data-size="compact"');
    expect(svg).toContain('class="ky-strip"');
    expect(svg).not.toMatch(/<g class="ky-plate/);
  });

  it("keeps the panel in the middle when `score: \"centre\"` says so", () => {
    const svg = drawKyogijo({ sport: "soccer", ...game, layers, score: "centre" });
    expect(svg).toContain('data-size="full"');
    expect(svg).toMatch(/<g class="ky-plate/);
    expect(svg).not.toContain('class="ky-strip"');
  });

  it("changes nothing for a drawing with no lineup, and `score: \"strip\"` asks for the strip", () => {
    expect(drawKyogijo({ sport: "soccer", ...game })).toContain('data-size="full"');
    expect(drawKyogijo({ sport: "soccer", ...game, score: "strip" })).toContain('class="ky-strip"');
  });

  it("puts the hockey pill in the strip, not on the ice among the players", () => {
    const strip = drawKyogijo({ sport: "nhl", ...game, layers, situation: power });
    expect((strip.match(/class="ky-sit-pill"/g) ?? []).length).toBe(1);
    expect(strip.indexOf('class="ky-sit-pill"')).toBeGreaterThan(strip.indexOf('class="ky-strip"'));
    const centre = drawKyogijo({ sport: "nhl", ...game, layers, situation: power, score: "centre" });
    expect(centre.indexOf('class="ky-sit-pill"')).toBeGreaterThan(-1);
    expect(centre).not.toContain('class="ky-strip"');
  });

  it("leaves a pageant's own `score` to the pageant, and sends an `auto` one to the strip", () => {
    expect(drawKyogijo({ sport: "soccer", ...game, layers, pageant: {} })).toContain('class="ky-strip"');
    expect(drawKyogijo({ sport: "soccer", ...game, layers, pageant: { score: "centre" } })).not.toContain('class="ky-strip"');
  });
});
