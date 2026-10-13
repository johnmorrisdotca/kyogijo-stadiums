import { describe, expect, it } from "vitest";
import { KYOGIJO_ATTRIBUTES, optionsFromAttributes } from "./element-entry.ts";
import { drawKyogijo } from "./draw.ts";
import type { ScoreOptions } from "./types.ts";

const read = (attrs: Record<string, string>) => (name: string): string | null => attrs[name] ?? null;

describe("the custom element's options", () => {
  it("read a score from its attributes", () => {
    const o = optionsFromAttributes(read({ sport: "nhl", home: "Lakeshore Anchors", away: "Northern Owls", "home-score": "2", "away-score": "3", "home-color": "#0f7a7a", status: "final-ot", orientation: "auto", competition: "Cup Final" })) as ScoreOptions;
    expect(o.sport).toBe("nhl");
    expect(o.home).toMatchObject({ name: "Lakeshore Anchors", score: 2, color: "#0f7a7a" });
    expect(o.away).toMatchObject({ name: "Northern Owls", score: 3 });
    expect(o).toMatchObject({ status: "final-ot", orientation: "auto", competition: "Cup Final", parts: true });
  });

  it("read score as home then away", () => {
    const o = optionsFromAttributes(read({ sport: "nba", home: "H", away: "A", score: "112-108" })) as ScoreOptions;
    expect([o.home.score, o.away.score]).toEqual([112, 108]);
    expect((optionsFromAttributes(read({ sport: "nba", home: "H", away: "A", score: "3–2" })) as ScoreOptions).home.score).toBe(3);
  });

  it("read a season for a past park's fence, and ignore anything that is not a year", () => {
    expect(optionsFromAttributes(read({ sport: "mlb", park: "polo-grounds", year: "1915" })).year).toBe(1915);
    expect(optionsFromAttributes(read({ sport: "mlb", year: " 1915 " })).year).toBe(1915);
    for (const bad of ["", "soon", "15", "19150", "-1915", "1915.5"]) expect(optionsFromAttributes(read({ sport: "mlb", year: bad })).year, bad).toBeUndefined();
  });

  it("read a soccer pitch, its frame, its half, its goals and its stripes, and a shoot-out", () => {
    const o = optionsFromAttributes(read({ sport: "soccer", pitch: "futsal", "pitch-type": "opta", half: "left", goals: "line", "stripe-pattern": "checks", "corner-flags": "false", home: "H", away: "A", "home-score": "2", "away-score": "2", "home-penalties": "4", "away-penalties": "3", status: "final-pens" })) as ScoreOptions;
    expect(o).toMatchObject({ sport: "soccer", pitch: "futsal", pitchType: "opta", half: "left", goals: "line", stripePattern: "checks", cornerFlags: false });
    expect([o.home.penalties, o.away.penalties]).toEqual([4, 3]);
    expect(drawKyogijo(o)).toContain("Final · 3-4 pens");
  });

  it("draw a bare surface when a team is missing, and a known sport when the sport is not one", () => {
    expect("home" in optionsFromAttributes(read({ sport: "nfl", home: "H" }))).toBe(false);
    expect(optionsFromAttributes(read({ sport: "curling" })).sport).toBe("nhl");
  });

  it("take any other option as JSON, under the attributes, and ignore JSON that is not JSON", () => {
    const o = optionsFromAttributes(read({ sport: "nba", options: '{"court":{"key":"#123456"},"sport":"nfl"}' }));
    expect(o.court?.key).toBe("#123456");
    expect(o.sport).toBe("nba");
    expect(optionsFromAttributes(read({ sport: "nba", options: "{nope" })).sport).toBe("nba");
  });

  it("draw what a page would write, hostile text and all, without markup of its own", () => {
    const o = optionsFromAttributes(read({ sport: "nhl", home: "<img src=x onerror=alert(1)>", away: "A", "home-color": "red;x:y", "home-logo": "javascript:alert(1)" }));
    const svg = drawKyogijo(o);
    expect(svg).not.toContain("<img");
    expect(svg).not.toContain("javascript:");
    expect(svg).not.toContain("x:y");
  });

  it("list its attributes once each", () => {
    expect(new Set(KYOGIJO_ATTRIBUTES).size).toBe(KYOGIJO_ATTRIBUTES.length);
  });
});
