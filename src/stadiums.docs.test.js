// What holds the real stadiums and the district to their files: the licence of what OpenStreetMap gave kept apart from the facts, the raw answers kept as they were returned and the outline faithful to them, and the docs
// and the notice that list them. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STADIUMS, STADIUM_IDS, stadiumNames } from "./stadiums.ts";
import { areaOf, edgeDistance, metresFrom, middleOf } from "./venues.geo.ts";

const stadiums = STADIUM_IDS.map((id) => STADIUMS[id]);
const names = (s) => stadiumNames(s).en;
const lonLat = (ring) => ring.map(([lon, lat]) => [lon, lat]);

describe("the real stadiums' files", () => {
  it("keep what OpenStreetMap gave (ODbL, with its credit) in a file of their own, apart from the facts and from every other data file", () => {
    const osmFile = readFileSync("src/stadiums.osm.data.ts", "utf8");
    expect(osmFile.slice(0, 700)).toContain("ODbL 1.0");
    expect(osmFile.slice(0, 700)).toContain("(c) OpenStreetMap contributors");
    const facts = readFileSync("src/stadiums.data.ts", "utf8");
    expect(facts).not.toMatch(/"ring"|"axis"|"osm"|"roof": \{\n? *"source"/);
    expect(osmFile).not.toMatch(/"seats"|"tiers"|"revision"/);
    for (const file of ["src/arenas.data.ts", "src/grounds.data.ts", "src/parks.data.ts", "src/venues.data.ts", "src/tenants.data.ts"]) expect(readFileSync(file, "utf8"), file).not.toContain(String(STADIUMS["bc-place"].osm.ring[3][0]));
  });

  it("keep the raw answers they were made from, dated: the outline is that way simplified to a metre, and the roof is the relation they were given", () => {
    for (const s of stadiums) {
      const raw = JSON.parse(readFileSync(`data-sources/stadiums/${s.osm.read}/osm-${s.id}.json`, "utf8"));
      expect(raw.wikidata).toBe(s.wikidata);
      expect(raw.osmBase).toBe(s.osm.base);
      expect(raw.licence).toContain("ODbL");
      const way = raw.elements.find((e) => `${e.type}/${e.id}` === s.osm.source);
      expect(way, s.id).toBeDefined();
      if (way.tags?.wikidata !== undefined) expect(way.tags.wikidata).toBe(s.wikidata);
      // The outline is a way, or the outer ways of a relation joined end to end.
      const parts = way.type === "way" ? [way.geometry] : way.members.filter((m) => m.role === "outer").map((m) => m.geometry);
      const joined = [];
      const left = parts.map((g) => [...g]);
      let chain = left.shift();
      while (left.length > 0 && !(chain[0].lat === chain.at(-1).lat && chain[0].lon === chain.at(-1).lon)) {
        const at = left.findIndex((g) => g[0].lat === chain.at(-1).lat && g[0].lon === chain.at(-1).lon);
        if (at < 0) break;
        chain = [...chain, ...left.splice(at, 1)[0].slice(1)];
      }
      joined.push(chain);
      const all = chain.slice(0, -1).map((p) => [p.lon, p.lat]);
      const origin = middleOf(all);
      const raws = metresFrom(origin, all);
      const kept = metresFrom(origin, lonLat(s.osm.ring));
      for (const [x, y] of kept) expect(Math.min(...raws.map(([rx, ry]) => Math.hypot(rx - x, ry - y))), s.id).toBeLessThan(0.2);
      for (const p of raws) expect(edgeDistance(kept, p), s.id).toBeLessThan(1.2);
      expect(Math.abs(areaOf(kept) - areaOf(raws)) / areaOf(raws), s.id).toBeLessThan(0.01);
      if (s.osm.roof !== undefined) {
        // BC Place's roof is a relation of a band and the opening in it; Tokyo Dome's is a way, its outline kept with its heights.
        const relation = raw.elements.find((e) => `${e.type}/${e.id}` === s.osm.roof.source);
        expect(relation.tags.height).toBe(String(s.osm.roof.height));
        expect(relation.tags["roof:height"]).toBe(String(s.osm.roof.rise));
        if (s.osm.roof.opening !== undefined) {
          const opening = relation.members.find((m) => m.role === "inner");
          expect(`way/${opening.ref}`).toBe(s.osm.roof.opening.source);
          const first = opening.geometry.slice(0, -1).map((p) => [p.lon, p.lat]);
          const o = metresFrom(origin, first);
          const k = metresFrom(origin, lonLat(s.osm.roof.opening.ring));
          for (const p of o) expect(edgeDistance(k, p), s.id).toBeLessThan(1.2);
        }
        if (s.osm.roof.ring !== undefined) {
          const o = metresFrom(origin, relation.geometry.slice(0, -1).map((p) => [p.lon, p.lat]));
          const k = metresFrom(origin, lonLat(s.osm.roof.ring));
          for (const p of o) expect(edgeDistance(k, p), s.id).toBeLessThan(1.2);
        }
      }
      for (const canopy of s.osm.canopies ?? []) {
        const e = raw.elements.find((x) => `${x.type}/${x.id}` === canopy.source);
        expect(e.tags["building:part"], canopy.source).toBe("roof");
        expect(Number(e.tags.height), canopy.source).toBe(canopy.height);
        expect(Number(e.tags["roof:height"]), canopy.source).toBe(canopy.rise);
      }
      // The facts were read at the revision the archive holds, from the article of the ground, and its infobox's capacities are the figures used.
      const article = JSON.parse(readFileSync(`data-sources/stadiums/${s.osm.read}/wikipedia.json`, "utf8")).articles[s.id];
      expect(article.revision, s.id).toBe(s.en.revision);
      expect(article.title, s.id).toBe(s.en.title);
      // The Japanese article a fact cites is in the archive at the revision the facts name.
      if (s.ja !== undefined) {
        const ja = JSON.parse(readFileSync(`data-sources/stadiums/${s.osm.read}/wikipedia.json`, "utf8")).articlesJa[s.id];
        expect(ja.title, s.id).toBe(s.ja.title);
        expect(ja.revision, s.id).toBe(s.ja.revision);
      }
      for (const config of Object.values(s.configs)) expect(article.infoboxCapacity, `${s.id} ${config.sport}`).toContain(config.seats.toLocaleString("en-US"));
      if (s.tiers.lowerSeats !== undefined) expect(article.infoboxCapacity, s.id).toContain(s.tiers.lowerSeats.toLocaleString("en-US"));
      // A ballpark's tiers by their seats are in the article's sentences.
      for (const seats of Object.values(s.tiers.tierSeats ?? {})) if (seats !== s.tiers.tierSeats.upper) expect(article.sentences.join(" "), `${s.id} ${seats}`).toContain(seats.toLocaleString("en-US"));
    }
  });

  it("have docs pages that list every stadium with its facts, carry the credit and the licence, and are in the docs' lists", () => {
    const page = readFileSync("docs/stadiums.md", "utf8");
    for (const s of stadiums) {
      expect(page, s.id).toContain(`\`${s.id}\``);
      for (const config of Object.values(s.configs)) expect(page, `${s.id} ${config.sport}`).toContain(config.seats.toLocaleString("en-US"));
      expect(page, s.id).toContain(s.wikidata);
    }
    expect(page).toContain("(c) OpenStreetMap contributors");
    expect(page).toContain("ODbL");
    expect(page).toContain("Wikidata");
    const district = readFileSync("docs/district.md", "utf8");
    for (const word of ["neighbours", "city", "VENUE_ATTRIBUTION", "ODbL", "groupRanks", "mountDistrictTurn"]) expect(district, word).toContain(word);
    for (const [file, text] of [["docs/README.md", "./stadiums.md"], ["docs/README.md", "./district.md"], ["docs/gallery.md", "gallery-stadiums.html"], ["docs/entry-points.md", "kyogijo-stadiums/stadiums"], ["docs/entry-points.md", "kyogijo-stadiums/district"], ["docs/architecture.md", "stadiums.osm.data.ts"], ["docs/architecture.md", "district.turn.ts"], ["docs/crowd.md", "STADIUMS"]]) expect(readFileSync(file, "utf8"), `${file} ${text}`).toContain(text);
  });

  it("are in the notice, with the licence of what each file holds and the way, the article and the revision of each stadium", () => {
    const notice = readFileSync("NOTICE.md", "utf8");
    expect(notice).toContain("ODbL");
    expect(notice).toContain("src/stadiums.osm.data.ts");
    expect(notice).toContain("data-sources/stadiums");
    for (const s of stadiums) expect(notice, s.id).toContain(`| ${names(s)} | ${s.wikidata} | ${s.osm.source} | ${s.en.title}, ${s.en.revision} |`);
  });

  it("make the files from the same data again, and the page's table is the one the build writes", () => {
    const data = JSON.parse(readFileSync("scripts/stadiums.data.json", "utf8"));
    expect(data.stadiums.map((v) => v.id)).toEqual([...STADIUM_IDS]);
    const page = readFileSync("docs/stadiums.md", "utf8");
    const table = /<!-- stadiums-table -->\n([\s\S]*?)\n<!-- \/stadiums-table -->/.exec(page)?.[1] ?? "";
    for (const s of stadiums) expect(table).toContain(`| \`${s.id}\` | ${names(s)} |`);
  });

  it("draw no mark of a club, a league, a tournament or a sponsor: the words of the docs name only the plain facts", () => {
    for (const file of ["docs/stadiums.md", "docs/district.md", "demo/stadiums.html", "demo/district.html"]) {
      const text = readFileSync(file, "utf8");
      for (const word of ["Lions", "Whitecaps", "Canucks", "Save-on-Foods", "FIFA"]) expect(text, `${file} ${word}`).not.toContain(word);
    }
  });
});
