// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "crypto-com-arena",
  "wikidata": "Q186080",
  "division": "pacific",
  "en": {"title": "Crypto.com Arena", "revision": 1380458624},
  "seats": {"hockey": 18145, "source": "wikipedia", "wikidata": 19060, "read": "the article's figure for ice hockey, 18,145, which the infobox gives too; Wikidata's one capacity (19,060) is not for hockey"},
  "tiers": {"count": 2, "basis": "documented", "lowerShare": 0.667, "read": "the article says two thirds of the seating, with the club seats, is in the lower bowl, and that three levels of suites lie between the lower and upper bowls"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
