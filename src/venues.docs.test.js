// What holds the real venues to their files: the licence of what OpenStreetMap gave kept apart from the facts, the raw answers kept as they were returned and the outline faithful to them, and the docs and the notice
// that list them. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ARENAS } from "./arenas.ts";
import { VENUES, VENUE_CONFERENCES, VENUE_IDS } from "./venues.ts";
import { areaOf, edgeDistance, metresFrom, middleOf, outerRingOf } from "./venues.geo.ts";

const venues = VENUE_IDS.map((id) => VENUES[id]);
const lonLat = (ring) => ring.map(([lon, lat]) => [lon, lat]);

describe("the real venues' files", () => {
  it("keep what OpenStreetMap gave (ODbL, with its credit) in a file of its own, apart from the facts and from every other data file", () => {
    const osmFile = readFileSync("src/venues.osm.data.ts", "utf8");
    expect(osmFile.slice(0, 700)).toContain("ODbL 1.0");
    expect(osmFile.slice(0, 700)).toContain("(c) OpenStreetMap contributors");
    // The facts file holds no outline and no axis, and the outline file no fact.
    const facts = readFileSync("src/venues.data.ts", "utf8");
    expect(facts).not.toMatch(/"ring"|"axis"|"osm"/);
    expect(osmFile).not.toMatch(/"seats"|"tiers"|"roof"|"revision"/);
    // No other data file of the package carries a venue's outline.
    for (const file of ["src/arenas.data.ts", "src/grounds.data.ts", "src/parks.data.ts", "src/venues.data.ts", "src/tenants.data.ts"]) expect(readFileSync(file, "utf8"), file).not.toContain(String(VENUES["honda-center"].osm.ring[3][0]));
  });

  it("keep the raw answers they were made from, dated, and the outline is that way simplified to a metre", () => {
    for (const v of venues) {
      const raw = JSON.parse(readFileSync(`data-sources/venues/${v.osm.read}/osm-${v.id}.json`, "utf8"));
      expect(raw.query, v.id).toContain(v.wikidata);
      expect(raw.wikidata).toBe(v.wikidata);
      expect(raw.osmBase).toBe(v.osm.base);
      expect(raw.licence).toContain("ODbL");
      const way = raw.elements.find((e) => `${e.type}/${e.id}` === v.osm.source);
      expect(way, v.id).toBeDefined();
      expect(way.tags.wikidata).toBe(v.wikidata);
      // A way's own points, or the outer ways of a building's relation joined into its ring.
      const all = outerRingOf(way).slice(0, -1).map((p) => [p.lon, p.lat]);
      const origin = middleOf(all);
      const raws = metresFrom(origin, all);
      const kept = metresFrom(origin, lonLat(v.osm.ring));
      // Every point kept is a point of the way (to the six decimals kept) and every point of the way is within a metre of what is kept.
      for (const [x, y] of kept) expect(Math.min(...raws.map(([rx, ry]) => Math.hypot(rx - x, ry - y))), v.id).toBeLessThan(0.2);
      for (const p of raws) expect(edgeDistance(kept, p), v.id).toBeLessThan(1.2);
      expect(Math.abs(areaOf(kept) - areaOf(raws)) / areaOf(raws), v.id).toBeLessThan(0.01);
      expect(v.osm.ring.length, v.id).toBeLessThan(all.length + 1);
      // The facts were read at the revision the archive holds, from the article the arena names.
      const articles = JSON.parse(readFileSync(`data-sources/venues/${v.osm.read}/wikipedia-${v.division}.json`, "utf8")).articles;
      expect(articles[v.id].revision, v.id).toBe(v.en.revision);
      expect(articles[v.id].title, v.id).toBe(ARENAS[v.id].en.title);
    }
  });

  it("keep what was looked at to show how each rink lies: a sweep of OpenStreetMap for every arena, dated, with the ice it finds the one the venue holds, and a line for each arena in the docs", () => {
    const rink = JSON.parse(readFileSync("scripts/venues.rink.json", "utf8"));
    expect(rink.read).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(rink.venues).sort()).toEqual([...VENUE_IDS].sort());
    const page = readFileSync("docs/venues.md", "utf8");
    const table = page.slice(page.indexOf("<!-- rink-table -->"), page.indexOf("<!-- /rink-table -->"));
    for (const v of venues) {
      const raw = JSON.parse(readFileSync(`data-sources/venues/${rink.read}/osm-evidence-${v.id}.json`, "utf8"));
      expect(raw.wikidata, v.id).toBe(v.wikidata);
      expect(raw.licence, v.id).toContain("ODbL");
      expect(raw.query, v.id).toContain("around:260");
      expect(rink.venues[v.id].commons.files, v.id).toBeGreaterThan(-1);
      expect(table, v.id).toContain(`\`${v.id}\``);
      // A rink OpenStreetMap maps is one the sweep finds again, and no sweep finds one the venue does not hold.
      const ice = raw.elements.filter((e) => `${e.type}/${e.id}` === v.osm.ice?.source);
      expect(ice.length, v.id).toBe(v.osm.ice === undefined ? 0 : 1);
      expect(table.split("\n").find((line) => line.startsWith(`| \`${v.id}\``)), v.id).toContain(v.osm.ice === undefined ? "no ice" : `ice ${v.osm.ice.source}`);
    }
    // Three are mapped, and the page says what the reading changed: nothing about any rink's direction.
    expect(venues.filter((v) => v.osm.axis.basis === "mapped").map((v) => v.id)).toEqual(["td-garden", "xfinity-mobile-arena", "ppg-paints-arena"]);
    expect(page).toContain("**no arena changed its basis.**");
  });

  it("have a docs page that lists every venue with its facts, carries the credit and the licence, and is in the docs' lists", () => {
    const page = readFileSync("docs/venues.md", "utf8");
    for (const v of venues) {
      expect(page, v.id).toContain(`\`${v.id}\``);
      expect(page, v.id).toContain(v.seats.hockey.toLocaleString("en-US"));
      expect(page, v.id).toContain(v.wikidata);
    }
    expect(page).toContain("(c) OpenStreetMap contributors");
    expect(page).toContain("ODbL");
    expect(page).toContain("Wikidata");
    for (const [file, text] of [["docs/README.md", "./venues.md"], ["docs/gallery.md", "gallery-venues.html"], ["docs/entry-points.md", "kyogijo-stadiums/venues"], ["docs/architecture.md", "venues.osm.data.ts"], ["docs/crowd.md", "`real`"]]) expect(readFileSync(file, "utf8"), file).toContain(text);
  });

  it("are in the notice, with the licence of what each file holds and the way, the article and the revision of each venue", () => {
    const notice = readFileSync("NOTICE.md", "utf8");
    expect(notice).toContain("ODbL");
    expect(notice).toContain("src/venues.osm.data.ts");
    expect(notice).toContain("data-sources/venues");
    for (const v of venues) {
      expect(notice, v.id).toContain(`| ${ARENAS[v.id].name} | ${v.wikidata} | ${v.osm.source} | ${v.en.title}, ${v.en.revision} |`);
    }
  });

  it("make the files from the same data again: the generated tables are the ones the build writes", () => {
    const data = JSON.parse(readFileSync("scripts/venues.data.json", "utf8"));
    expect(data.venues.map((v) => v.id)).toEqual([...VENUE_IDS]);
    // Each division lists its venues in the order of the data, and sits in the conference the league has it in.
    expect(Object.keys(data.divisions)).toEqual(["pacific", "central", "atlantic", "metropolitan"]);
    for (const [division, entry] of Object.entries(data.divisions)) {
      expect(entry.venues, division).toEqual(venues.filter((v) => v.division === division).map((v) => v.id));
      expect(VENUE_CONFERENCES[entry.conference], division).toContain(division);
      expect(readFileSync(`data-sources/venues/2026-10-20/wikidata-${division}.json`, "utf8")).toContain("Wikidata, CC0");
    }
    // Every venue names the day it was read, and the files of that day are there.
    for (const v of data.venues) expect(v.read, v.id).toBe(VENUES[v.id].osm.read);
  });
});
