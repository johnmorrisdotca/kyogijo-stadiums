// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "keybank-center",
  "wikidata": "Q1110789",
  "division": "atlantic",
  "en": {"title": "KeyBank Center", "revision": 1381057909},
  "seats": {"hockey": 19070, "source": "wikipedia", "wikidata": 19070, "read": "the infobox's present figure for ice hockey and lacrosse (19,070, from 2013), which the article's first sentence gives too; Wikidata's one capacity (19,070) has no sport and is the same"},
  "tiers": {"count": 3, "basis": "documented", "read": "the article speaks of seats in the 200 level and the 300 level (95 were added behind the last row of the 300 level, 380 mainly as a row in the 200 level) and of the second bowl: three seating levels, 100, 200 and 300"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise; the article says the main scoreboard and roof were replaced in 2024"},
};
