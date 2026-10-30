// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "madison-square-garden",
  "wikidata": "Q186125",
  "division": "metropolitan",
  "en": {"title": "Madison Square Garden", "revision": 1380115046},
  "seats": {"hockey": 18006, "source": "wikipedia", "wikidata": 18006, "read": "the infobox's figure for ice hockey, 18,006; Wikidata lists six capacities without a sport, 18,006 among them"},
  "tiers": {"count": 2, "basis": "documented", "read": "the article tells of the lower bowl (rebuilt in 2011) and the upper bowl (built in 2012 on top of the suites), each with a concourse of its own: two seating tiers, the suites between"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
