// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "honda-center",
  "wikidata": "Q774138",
  "division": "pacific",
  "en": {"title": "Honda Center", "revision": 1380000927},
  "seats": {"hockey": 17174, "source": "wikipedia", "wikidata": 17174, "read": "the article's seating line for the Ducks, 17,174, which the infobox gives for ice hockey too; Wikidata's one capacity (P1083) is the same"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls (a lower and an upper) are drawn, the usual for an arena of 17,000 seats; the article speaks of two full levels of ribbon displays, one on each bowl's fascia, which agrees"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
