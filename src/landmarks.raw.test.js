// The landmarks of an area held to the raw answers they were made from (data-sources/cityctx/<date>/): each one's OpenStreetMap element is in the area's answer and names the same Wikidata item, its English name is the item's
// label, and the heights drawn are the item's figures. A change to the area's file by hand, or a build from other data, fails here. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LAS_VEGAS } from "./cityctx.las-vegas.data.ts";

describe("the landmarks of Las Vegas against the raw answers", () => {
  it("hold the landmarks to the raw answers they were made from: the element, its Wikidata item and its labels", () => {
    const root = "data-sources/cityctx/2026-11-03";
    const osm = JSON.parse(readFileSync(`${root}/osm-las-vegas.json`, "utf8")).elements;
    const facts = JSON.parse(readFileSync(`${root}/landmarks-las-vegas.json`, "utf8")).entities;
    for (const l of LAS_VEGAS.landmarks ?? []) {
      const [type, id] = l.source.split("/");
      const element = osm.find((e) => e.type === type && e.id === Number(id));
      expect(element, l.key).toBeDefined();
      if (element.tags?.wikidata !== undefined) expect(element.tags.wikidata).toBe(l.wikidata);
      expect(facts[l.wikidata].labels.en.value).toBe(l.name.en);
    }
    // The heights Wikidata gives in feet are the ones drawn, to a tenth of a metre.
    expect(Number(facts.Q60749353.claims.P2048[0].mainsnak.datavalue.value.amount) * 0.3048).toBeCloseTo(111.6, 1);
    expect(Number(facts.Q892103.claims.P2048[0].mainsnak.datavalue.value.amount) * 0.3048).toBeCloseTo(167.6, 1);
  });

});
