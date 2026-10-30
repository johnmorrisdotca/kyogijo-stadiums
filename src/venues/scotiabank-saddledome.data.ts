// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "scotiabank-saddledome",
  "wikidata": "Q1140083",
  "division": "pacific",
  "en": {"title": "Scotiabank Saddledome", "revision": 1377341466},
  "seats": {"hockey": 19289, "source": "wikipedia", "wikidata": 16605, "read": "the infobox's present figure for hockey (19,289, from 1995), which the article's amenities line gives too; Wikidata's 16,605 is the 1983 figure and the first the infobox lists"},
  "tiers": {"count": 2, "basis": "documented", "read": "the article speaks of the lower bowl, a second level and upper loges above it: two seating levels with suites at the top of the lower bowl"},
  "roof": {"kind": "saddle", "basis": "documented", "read": "the article says the roof is a reverse hyperbolic paraboloid, shaped like a horse saddle; which way the saddle lies over the ice is not given: it is drawn high at the two ends"},
};
