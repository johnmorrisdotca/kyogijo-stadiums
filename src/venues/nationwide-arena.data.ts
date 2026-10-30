// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "nationwide-arena",
  "wikidata": "Q166503",
  "division": "metropolitan",
  "en": {"title": "Nationwide Arena", "revision": 1379010656},
  "seats": {"hockey": 18500, "source": "wikipedia", "wikidata": 18144, "read": "the article's seating capacity for hockey, 18,500, which the infobox gives too (19,500 with standing room); Wikidata's one capacity (18,144) has no sport"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn; OpenStreetMap maps five building levels, which are floors, not seating bowls"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
