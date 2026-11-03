// The one data file of "Where to find a feed" (examples/feeds/where-to-find.json), for every sport: each source says what it gives, how to find an id, its docs and its terms, in English and Japanese; our
// own sample comes first for each sport; and a game's feed is in a format the package's `/feeds` reads, its sample read by the package itself. The racing entries' own checks, and the page's, are in
// circuits.feed.files.test.js. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { FEED_FORMATS, readFeed } from "./feeds.ts";

const data = JSON.parse(readFileSync("examples/feeds/where-to-find.json", "utf8"));
const both = (text) => typeof text?.en === "string" && text.en.trim() !== "" && typeof text?.ja === "string" && text.ja.trim() !== "";

describe("where to find a feed, for every sport", () => {
  it("is the sports by their key, each a list of sources complete in both languages", () => {
    expect(data).toMatchObject({ kind: "kyogijo-feed-sources", version: 1 });
    expect(both(data.note)).toBe(true);
    expect(Object.keys(data.sports)).toEqual(expect.arrayContaining(["racing", "nhl"]));
    const ids = new Set();
    for (const [sport, sources] of Object.entries(data.sports)) {
      expect(sport).toMatch(/^[a-z0-9-]+$/);
      expect(sources.length, sport).toBeGreaterThan(0);
      for (const s of sources) {
        expect(ids.has(s.id), s.id).toBe(false);
        ids.add(s.id);
        expect(s.id).toMatch(/^[a-z0-9-]+$/);
        for (const field of ["name", "gives", "id_help", "licence"]) expect(both(s[field]), `${s.id} ${field}`).toBe(true);
        if (s.docs_name !== undefined) expect(both(s.docs_name), s.id).toBe(true);
        expect(s.docs, s.id).toMatch(/^(https:\/\/|docs\/[a-z0-9-]+\.md$)/);
        if (s.terms !== null) expect(s.terms, s.id).toMatch(/^https:\/\//);
        if (s.browser !== undefined) expect(["yes", "maybe-not", "no"], s.id).toContain(s.browser);
        // An address of someone else's is https; our own sample is beside the page.
        expect(s.url, s.id).toMatch(/^(https:\/\/|examples\/)/);
      }
    }
  });

  it("lists our own made-up sample first for each sport, as 'Sample feed (made up)', served beside the page", () => {
    for (const [sport, sources] of Object.entries(data.sports)) {
      expect(sources[0].name.en, sport).toBe("Sample feed (made up)");
      expect(sources[0].url, sport).toMatch(/^examples\//);
      for (const s of sources.slice(1)) expect(s.url, s.id).toMatch(/^https:\/\//);
    }
  });

  it("names a format of `/feeds` for every game's source, and the package reads the hockey sample", () => {
    for (const s of data.sports.nhl) expect(FEED_FORMATS.filter((f) => f !== "auto"), s.id).toContain(s.adapter);
    const sample = data.sports.nhl[0];
    const game = readFeed(JSON.parse(readFileSync(sample.url, "utf8")), sample.adapter);
    expect(game.timeline.frames.length, sample.url).toBeGreaterThan(0);
  });
});
