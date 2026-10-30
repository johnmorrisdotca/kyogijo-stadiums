// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "enterprise-center",
  "wikidata": "Q1067700",
  "division": "central",
  "en": {"title": "Enterprise Center", "revision": 1372086380},
  "seats": {"hockey": 18096, "source": "wikipedia", "wikidata": 18400, "read": "the infobox's figure for ice hockey, 18,096, which the article's first sentence gives too; Wikidata's one capacity (18,400) is not for hockey"},
  "tiers": {"count": 2, "basis": "documented", "read": "the article tells of the replacement of all upper-tier seats and of the lower-tier seats in the 2017 to 2019 renovation: two seating tiers"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
