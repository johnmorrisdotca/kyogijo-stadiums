// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "bridgestone-arena",
  "wikidata": "Q302869",
  "division": "central",
  "en": {"title": "Bridgestone Arena", "revision": 1380457078},
  "seats": {"hockey": 17510, "source": "wikidata", "wikidata": 17510, "read": "Wikidata's capacity for ice hockey (P1083 with P641 ice hockey); the article's own line gives 17,159, 2.0 percent fewer"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are everywhere in the building: two bowls are drawn; the article speaks of upper-level seats and, at the south end only, of no mid-level seating and one level of suites"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise; the article speaks of two round roof support columns at the south end, which are not drawn"},
};
