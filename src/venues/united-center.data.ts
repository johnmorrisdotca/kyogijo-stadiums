// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "united-center",
  "wikidata": "Q639975",
  "division": "central",
  "en": {"title": "United Center", "revision": 1380672233},
  "seats": {"hockey": 19717, "source": "wikipedia", "wikidata": 23500, "read": "the article's seating line for ice hockey, 19,717 (22,428 with standing room), which the infobox gives too; Wikidata's one capacity (23,500) is the concert one"},
  "tiers": {"count": 2, "basis": "documented", "read": "the article tells of the 300 level seating bowl and of three levels of suites (down from 216 sky-boxes to 169 executive suites after 2009-10): a lower bowl and the 300 level, with the suites between as walks"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise; the article says the building is 140 feet tall, of concrete and steel"},
};
