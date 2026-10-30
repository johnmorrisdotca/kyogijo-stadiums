// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "sap-center",
  "wikidata": "Q261863",
  "division": "pacific",
  "en": {"title": "SAP Center", "revision": 1380804230},
  "seats": {"hockey": 17435, "source": "wikipedia", "wikidata": 19190, "read": "the article says the hockey capacity changed from 17,562 to 17,435 when the new premium seating was finished (2023); Wikidata's one capacity (19,190) is the concert one"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn; the article speaks of club levels and a penthouse, which are not seating bowls"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
