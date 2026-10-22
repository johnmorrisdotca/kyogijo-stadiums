// The context of downtown Vancouver held to OpenStreetMap's own answer: each height is the one the answer maps (a `height`, else the levels at 3.2 metres, else the 10 metres that are ours), and the streets are the ones its tags say.
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { describe, expect, it } from "vitest";
import { buildingHeight, classify, streetOf } from "../scripts/walk-rules.mjs";
import { decodeBuilding } from "./context.ts";
import { VANCOUVER_CENTRE } from "./osm.context.data.ts";

const raw = JSON.parse(readFileSync(new URL("../data-sources/walk/2026-10-22/osm-vancouver.json", import.meta.url), "utf8"));
const rings = (e) => (e.type === "way" ? (e.geometry ?? []).length > 3 : (e.members ?? []).some((m) => m.role === "outer"));

describe("downtown Vancouver's context against the raw answer", () => {
  it("has a building for each building of the answer that has a ring, with the height its tags map or ours", () => {
    const wanted = raw.elements
      .filter((e) => e.tags?.building !== undefined && classify(e.tags, true)?.kind === "block-area" && rings(e))
      .map((e) => buildingHeight(e.tags) ?? 10)
      .sort((a, b) => a - b);
    const given = VANCOUVER_CENTRE.layers.buildings.rows.map((row) => decodeBuilding(VANCOUVER_CENTRE, row).height).sort((a, b) => a - b);
    // (A building the simplification collapsed is the only one that may be missing.)
    expect(given.length).toBeGreaterThanOrEqual(wanted.length - 3);
    expect(given.length).toBeLessThanOrEqual(wanted.length);
    expect(Math.max(...given)).toBeCloseTo(Math.max(...wanted), 0);
    expect(given.filter((h) => h > 50).length).toBe(wanted.filter((h) => h > 50).length);
  });

  it("has a street for each way of the answer that is one, of the kind its tags say", () => {
    const counts = [0, 0, 0, 0];
    for (const e of raw.elements) {
      const street = streetOf(e.tags ?? {});
      if (street !== null && (e.geometry ?? []).length >= 2) counts[street.kind] += 1;
    }
    const given = [0, 0, 0, 0];
    for (const row of VANCOUVER_CENTRE.layers.streets.rows) given[row[0]] += 1;
    expect(given).toEqual(counts);
    expect(counts[2], "the SkyTrain's guideways").toBeGreaterThan(0);
    expect(counts[1], "the viaducts").toBeGreaterThan(5);
  });
});
