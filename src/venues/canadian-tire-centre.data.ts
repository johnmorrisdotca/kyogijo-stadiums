// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "canadian-tire-centre",
  "wikidata": "Q1327290",
  "division": "atlantic",
  "en": {"title": "Canadian Tire Centre", "revision": 1378044395},
  "seats": {"hockey": 17010, "source": "wikipedia", "wikidata": 19153, "read": "the infobox's present figure for ice hockey (17,010, from 2026, after the 300 level's upper seats gave way to a standing deck); Wikidata's one capacity (19,153) is the figure of 2005"},
  "tiers": {"count": 3, "basis": "documented", "read": "the article says the arena seating is in three levels, 100, 200 and 300, fixed sections round the floor, with suites in the 100 and 200 levels and a mezzanine level above the 300 level that holds no seating"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
