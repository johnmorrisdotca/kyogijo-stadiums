// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "ubs-arena",
  "wikidata": "Q48742753",
  "division": "metropolitan",
  "en": {"title": "UBS Arena", "revision": 1374271562},
  "seats": {"hockey": 17255, "source": "wikipedia", "wikidata": null, "read": "the infobox's figure for ice hockey, 17,255; the article's first lines say it officially seats 17,250; Wikidata gives no capacity for the item"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
