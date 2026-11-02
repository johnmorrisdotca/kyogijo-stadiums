import { describe, expect, it, vi } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { fingerprint, withoutVersion } from "./fingerprint.fixture.ts";
import { hash } from "./format.ts";
import { VERSION } from "./version.ts";
import type { ScoreOptions } from "./types.ts";

const game: Omit<ScoreOptions, "sport"> = {
  away: { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" },
  home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" },
};

describe("the fingerprints the drawing tests hold", () => {
  const svg = drawKyogijo({ sport: "nhl", ...game });

  it("a drawing carries the version, and a default id made from it, so the raw text is no fingerprint that survives a release", () => {
    expect(svg).toContain(`data-version="${VERSION}"`);
    expect(svg).toMatch(/aria-labelledby="ky-[0-9a-z]{7}-t ky-[0-9a-z]{7}-d"/);
    expect(withoutVersion(svg)).not.toContain("data-version");
    expect(withoutVersion(svg)).toContain('aria-labelledby="ky-ID-t ky-ID-d"');
  });

  it("bumping the version changes no fingerprint: the same drawing made as version 999.0.0 has the same one, and not the same raw hash", async () => {
    vi.resetModules();
    vi.doMock("./version.ts", () => ({ VERSION: "999.0.0" }));
    await (await import("./strings.core.ts")).loadStrings("en");
    const later = (await import("./draw.ts")).drawKyogijo({ sport: "nhl", ...game });
    vi.doUnmock("./version.ts");
    vi.resetModules();
    expect(later).toContain('data-version="999.0.0"');
    expect(hash(later)).not.toBe(hash(svg));
    expect(fingerprint(later)).toBe(fingerprint(svg));
    // A page's own id is left alone: it is not made from the version.
    expect(withoutVersion(drawKyogijo({ sport: "nhl", id: "mine", ...game }))).toContain('aria-labelledby="mine-t mine-d"');
  });

  it("a drawing that really changed still changes its fingerprint", () => {
    const other = drawKyogijo({ sport: "nhl", ...game, away: { ...game.away, score: 4 } });
    expect(fingerprint(other)).not.toBe(fingerprint(svg));
  });
});
