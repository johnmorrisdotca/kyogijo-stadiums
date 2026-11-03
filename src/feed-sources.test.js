// The one data file of "Where to find a feed" (examples/feed-sources.json): every source says what it gives, how to find a game, its docs and its terms, in English and Japanese; our own sample comes first for each
// sport and is read by the package itself; and the two docs pages are what the data makes. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { sourcesPages } from "../scripts/feed-sources.mjs";
import { FEED_FORMATS, readFeed } from "./feeds.ts";

const data = JSON.parse(readFileSync("examples/feed-sources.json", "utf8"));
const both = (text) => typeof text?.en === "string" && text.en.trim() !== "" && typeof text?.ja === "string" && text.ja.trim() !== "";

describe("where to find a feed", () => {
  it("is a list of sports, each with its sources, every one complete in both languages", () => {
    expect(data).toMatchObject({ kind: "kyogijo-feed-sources", version: 1 });
    expect(both(data.note)).toBe(true);
    const ids = new Set();
    for (const sport of data.sports) {
      expect(both(sport.name), sport.sport).toBe(true);
      for (const s of sport.sources) {
        expect(ids.has(s.id), s.id).toBe(false);
        ids.add(s.id);
        expect(s.id).toMatch(/^[a-z0-9-]+$/);
        for (const field of ["name", "gives", "gameId"]) expect(both(s[field]), `${s.id} ${field}`).toBe(true);
        expect(FEED_FORMATS.filter((f) => f !== "auto"), s.id).toContain(s.format);
        expect(["yes", "maybe-not", "no"], s.id).toContain(s.browser);
        expect(s.docs.length, s.id).toBeGreaterThan(0);
        for (const link of [...s.docs, s.terms]) {
          expect(both(link.label), s.id).toBe(true);
          expect(link.url, s.id).toMatch(/^(https:\/\/|docs\/)/);
        }
        // An address of someone else's is https; our own sample is beside the page.
        expect(s.url, s.id).toMatch(s.sample === true ? /^examples\// : /^https:\/\//);
      }
    }
  });

  it("lists our own made-up sample first for each sport, as 'Sample feed (made up)', and the package reads it", () => {
    for (const sport of data.sports) {
      const first = sport.sources[0];
      expect(first?.sample, sport.sport).toBe(true);
      expect(first.name.en).toBe("Sample feed (made up)");
      const game = readFeed(JSON.parse(readFileSync(first.url, "utf8")), first.format);
      expect(game.timeline.frames.length, first.url).toBeGreaterThan(0);
    }
  });

  it("is the docs pages, in English and Japanese", () => {
    const pages = sourcesPages(data);
    expect(readFileSync("docs/where-to-find-a-feed.md", "utf8"), "run node scripts/feed-sources.mjs").toBe(pages.en);
    expect(readFileSync("docs/where-to-find-a-feed.ja.md", "utf8"), "run node scripts/feed-sources.mjs").toBe(pages.ja);
  });
});
