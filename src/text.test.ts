import { describe, expect, it } from "vitest";
import { abbreviate, capitals, fitLines, textWidth } from "./text.ts";

describe("text", () => {
  it("measures wider text wider, narrow letters narrower, and full-width characters as one em", () => {
    expect(textWidth("WW")).toBeGreaterThan(textWidth("ii"));
    expect(textWidth("ABC")).toBeGreaterThan(textWidth("AB"));
    expect(textWidth("日本", false)).toBeGreaterThan(2);
  });

  it("abbreviates a name by its initials, or its first letters, or its first characters", () => {
    expect(abbreviate("Harbour City Gulls")).toBe("HCG");
    expect(abbreviate("Bison")).toBe("BIS");
    expect(abbreviate("読売ジャイアンツ")).toBe("読売");
    expect(abbreviate("メトロボルツ")).toBe("メトロ");
    expect(abbreviate("  ")).toBe("");
  });

  it("writes Latin text in capitals and leaves other text alone", () => {
    expect(capitals("Gulls")).toBe("GULLS");
    expect(capitals("ジャイアンツ")).toBe("ジャイアンツ");
  });

  it("sets a long name on two lines when that is clearly bigger, and a short one on one", () => {
    expect(fitLines("GOLDEN STATE WARRIORS", 40, 20, 8).lines).toEqual(["GOLDEN STATE", "WARRIORS"]);
    expect(fitLines("GULLS", 40, 20, 8).lines).toEqual(["GULLS"]);
  });

  it("never sets a name wider than its box or taller than it", () => {
    for (const name of ["A", "HARBOUR CITY GULLS", "PRAIRIE RIDGE BISON AND SONS", "東北楽天ゴールデンイーグルス"]) {
      const fit = fitLines(name, 30, 12, 9);
      expect(fit.width, name).toBeLessThanOrEqual(30 + 1e-6);
      expect(fit.height, name).toBeLessThanOrEqual(12 + 1e-6);
    }
  });
});
