// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "amerant-bank-arena",
  "wikidata": "Q795526",
  "division": "atlantic",
  "en": {"title": "Amerant Bank Arena", "revision": 1379821144},
  "seats": {"hockey": 19250, "source": "wikipedia", "wikidata": 20737, "read": "the infobox's figure for ice hockey, 19,250 (at least 20,000 with standing room); Wikidata's one capacity (20,737) has no sport and is the basketball one"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn; the article speaks of 70 suites and 2,623 club seats, which are not seating bowls"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
