// What holds the catalogue to its sources: a supported venue is one the package draws (its facts are the package's own), a new venue's item and facts are in the raw answers kept in
// data-sources/catalogue/, the JSON and the entry are the same data, and the docs' tables are made from it. Plain JavaScript, so that reading files needs no Node types.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogueTables } from "../scripts/catalogue-docs.mjs";
import { placeById } from "./atlas.ts";
import { CATALOGUE, CATALOGUE_GROUPS, CATALOGUE_SPORTS, catalogueByGroup, catalogueById, catalogueBySport, catalogueByStatus, catalogueCoverage, catalogueWanted } from "./catalogue.ts";
import { CATALOGUE_DATA } from "./catalogue.data.ts";
import { drawKyogijo } from "./draw.ts";
import { STADIUMS, STADIUM_IDS, stadiumNames } from "./stadiums.ts";
import { VENUES, VENUE_IDS } from "./venues.ts";
import { VERSION } from "./version.ts";

const day = readdirSync("data-sources/catalogue").filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().at(-1);
const raw = (name) => JSON.parse(readFileSync(`data-sources/catalogue/${day}/${name}`, "utf8"));
const items = raw("wikidata.json").entities;
const source = JSON.parse(readFileSync("scripts/catalogue.data.json", "utf8"));
const json = JSON.parse(readFileSync("catalogue.json", "utf8"));

describe("the catalogue", () => {
  it("has every venue once, under a kebab-case id, and every Wikidata item once", () => {
    const ids = CATALOGUE.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const qids = CATALOGUE.map((entry) => entry.wikidata);
    expect(new Set(qids).size).toBe(qids.length);
  });

  it("lists as supported every real venue the package draws, and nothing else: each id is the package's own key, with its own name and item", () => {
    const supported = catalogueByStatus("supported");
    for (const entry of supported) {
      const place = placeById(entry.id);
      const stadium = STADIUM_IDS.includes(entry.id) ? STADIUMS[entry.id] : undefined;
      const venue = VENUE_IDS.includes(entry.id) ? VENUES[entry.id] : undefined;
      expect(place !== undefined || stadium !== undefined, entry.id).toBe(true);
      expect(entry.wikidata, entry.id).toBe(place?.wikidata ?? stadium.wikidata);
      expect(entry.name, entry.id).toBe(place?.name ?? stadiumNames(stadium).en);
      expect(entry.drawn, entry.id).toBe(stadium !== undefined || venue !== undefined ? "outline" : "surface");
    }
    // Every real stadium and NHL venue, and every place of the atlas, is there.
    for (const id of [...STADIUM_IDS, ...VENUE_IDS]) expect(catalogueById(id)?.drawn, id).toBe("outline");
    expect(supported.length).toBe(new Set([...STADIUM_IDS, ...VENUE_IDS, ...CATALOGUE.filter((entry) => placeById(entry.id) !== undefined).map((entry) => entry.id)]).size);
  });

  it("draws every supported venue it gives the options of, and links each to a page of the demo", () => {
    const sample = ["fenway-park", "maracana", "td-garden", "boston-garden", "nippon-budokan", "bc-place", "korakuen-hall", "honda-center"];
    for (const id of sample) {
      const entry = catalogueById(id);
      expect(drawKyogijo({ ...entry.draw, style: "none" }).startsWith("<svg"), id).toBe(true);
    }
    for (const entry of catalogueByStatus("supported")) expect(entry.demo, entry.id).toMatch(/^(stadiums\.html\?stadium=|venues\.html\?venue=|\?place=)[a-z0-9-]+(#atlas)?$/);
  });

  it("never invents an item: every Wikidata item is in the raw answers kept for it, and a new venue's coordinates, country and capacity are the item's", () => {
    for (const entry of CATALOGUE) expect(items[entry.wikidata], `${entry.id} ${entry.wikidata}`).toBeDefined();
    for (const entry of CATALOGUE.filter((one) => one.status !== "supported")) {
      const one = items[entry.wikidata];
      const point = one.claims.P625?.find((claim) => claim.rank !== "deprecated")?.mainsnak.datavalue.value;
      if (entry.lat === undefined) expect(entry.missing?.coordinates, entry.id).toBeDefined();
      else {
        expect(Math.abs(entry.lat - point.latitude), entry.id).toBeLessThan(1e-4);
        expect(Math.abs(entry.lon - point.longitude), entry.id).toBeLessThan(1e-4);
      }
      if (entry.capacity !== undefined) expect(one.claims.P1083.map((claim) => Number(claim.mainsnak.datavalue.value.amount)), entry.id).toContain(entry.capacity);
      expect(entry.country !== undefined || entry.missing?.country !== undefined, entry.id).toBe(true);
      expect(entry.city !== undefined || entry.missing?.city !== undefined, entry.id).toBe(true);
    }
  });

  it("names every venue in English and in Japanese, or says why the Japanese is missing", () => {
    for (const entry of CATALOGUE) {
      expect(entry.name.length, entry.id).toBeGreaterThan(0);
      if (entry.nameJa === undefined) expect(entry.missing?.nameJa, entry.id).toBeDefined();
      else expect(entry.nameJa, entry.id).toMatch(/[぀-ヿ㐀-鿿]/);
    }
    for (const sport of Object.values(CATALOGUE_SPORTS)) expect(sport.ja).toMatch(/[぀-ヿ㐀-鿿]/);
    for (const group of CATALOGUE_GROUPS) expect(group.ja, group.id).toMatch(/[぀-ヿ㐀-鿿]/);
  });

  it("is the same data in catalogue.json and in the entry, for this version of the package", () => {
    expect(json).toEqual(CATALOGUE_DATA);
    expect(json.package.version).toBe(VERSION);
    expect(json.schemaVersion).toBe(1);
    expect(json.generatedAt).toBe(day);
    expect(json.counts.supported + json.counts.workingOn + json.counts.wanted).toBe(CATALOGUE.length);
  });

  it("covers every venue of each league's season, and every group names venues that exist", () => {
    expect(["nba", "mlb", "nfl", "cfl", "nhl"].map((league) => catalogueCoverage(league).venues)).toEqual([30, 30, 30, 9, 32]);
    expect(catalogueCoverage("nhl").outline).toBe(32);
    // A stadium two clubs share is listed once, with both.
    expect(catalogueById("metlife-stadium").teams.filter((team) => team.league === "nfl").map((team) => team.name).sort()).toEqual(["New York Giants", "New York Jets"]);
    for (const group of CATALOGUE_GROUPS) expect(catalogueByGroup(group.id).length, group.id).toBe(group.ids.length);
    // The working-on courts are the ticket's ten, and a circuit waits for its surface.
    expect(catalogueByStatus("working-on").map((entry) => entry.id)).toEqual(source.groups.find((group) => group.id === "tennis").ids);
    for (const entry of catalogueBySport("motor-racing")) expect(entry.needs, entry.id).toBe("circuit-surface");
    for (const entry of catalogueWanted()) expect(entry.status === "wanted" || (entry.status === "supported" && entry.drawn === "surface" && entry.want === "outline"), entry.id).toBe(true);
  });
});

describe("the catalogue's docs", () => {
  it("are made, not written: each table of docs/catalogue.md and docs/catalogue.ja.md is the one the catalogue makes", () => {
    for (const [file, language] of [["docs/catalogue.md", "en"], ["docs/catalogue.ja.md", "ja"]]) {
      const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
      for (const [name, body] of Object.entries(catalogueTables(CATALOGUE_DATA, language))) expect(text, `${file} ${name}`).toContain(`<!-- ${name} -->\n${body}\n<!-- /${name} -->`);
    }
  });
});
