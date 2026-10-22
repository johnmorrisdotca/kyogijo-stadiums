import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** The buildings of a district are data a caller passes in: the package's size, and the file that holds them, are held here. */
describe("the PLATEAU data", () => {
  it("is small, and a district that asks for none carries none of it", () => {
    expect(readFileSync("src/plateau.data.ts", "utf8").length).toBeLessThan(50_000);
    for (const file of ["src/district.ts", "src/district.turn.ts", "src/context.ts", "src/district-entry.ts"]) expect(readFileSync(file, "utf8"), file).not.toMatch(/from "\.\/plateau\.data\.ts"/);
  });

  it("is made by scripts/build-plateau.mjs from the dated extract of data-sources/plateau, which names its licence", () => {
    const head = readFileSync("src/plateau.data.ts", "utf8").slice(0, 1800);
    expect(head).toContain("Made by scripts/build-plateau.mjs");
    expect(head).toContain("PLATEAU Site Policy");
    expect(head).toContain("not MLIT's own data as published");
    const extract = JSON.parse(readFileSync("data-sources/plateau/2026-10-22/tokyo-dome-city.json", "utf8"));
    expect(extract.licence).toContain("PLATEAU Site Policy");
    expect(extract.count).toBe(813);
    expect(extract.buildings.length).toBe(813);
  });
});
