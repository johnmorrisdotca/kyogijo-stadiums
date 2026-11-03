// The demo's sample race feed and the list of where to find a feed: files of the repository, not of the package. The sample is what the script makes from the package's own simulated race.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { feedFromText, raceFromFeed, raceToFeed, simulateRace } from "./circuits-entry.ts";

describe("the demo's sample feed and where to find a feed", () => {
  it("serves the simulated race as a sample feed of over ten minutes, as the script makes it", () => {
    const read = feedFromText(readFileSync("examples/races/las-vegas-sample.json", "utf8"));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const made = raceToFeed(simulateRace({ circuit: "las-vegas" }), read.feed.title);
    expect(read.feed).toEqual(JSON.parse(JSON.stringify(made)));
    expect(raceFromFeed(read.feed).duration).toBeGreaterThan(600);
  });

  it("lists the sample feed first, then the public sources, each with what it gives, a sample address, how to find an id, its docs and terms, in both languages", () => {
    const data = JSON.parse(readFileSync("examples/feeds/where-to-find.json", "utf8"));
    const racing = data.sports.racing;
    expect(racing[0].id).toBe("sample");
    expect(racing[0].name.en).toBe("Sample feed (made up)");
    for (const entry of racing) {
      for (const key of ["name", "gives", "id_help", "licence"]) {
        expect(entry[key].en.length, `${entry.id} ${key}`).toBeGreaterThan(3);
        expect(entry[key].ja.length, `${entry.id} ${key}`).toBeGreaterThan(1);
      }
      expect(entry.url).toMatch(/^(https:\/\/|examples\/)/);
      expect(entry.docs).toBeTruthy();
      if (entry.id !== "sample") expect(entry.terms).toMatch(/^https:\/\//);
    }
    expect(racing.map((e) => e.id)).toContain("openf1");
  });
});

describe("the Where to find a feed page", () => {
  it("names every source of the data file, in English and Japanese", () => {
    const data = JSON.parse(readFileSync("examples/feeds/where-to-find.json", "utf8"));
    const en = readFileSync("docs/where-to-find-a-feed.md", "utf8");
    const ja = readFileSync("docs/where-to-find-a-feed.ja.md", "utf8");
    for (const entry of data.sports.racing) {
      expect(en, entry.id).toContain(entry.name.en);
      expect(ja, entry.id).toContain(entry.name.ja);
      expect(en, entry.id).toContain(entry.url);
      expect(en, entry.id).toContain(entry.gives.en);
      expect(ja, entry.id).toContain(entry.gives.ja);
    }
  });
});
