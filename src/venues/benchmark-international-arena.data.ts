// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "benchmark-international-arena",
  "wikidata": "Q940199",
  "division": "atlantic",
  "en": {"title": "Benchmark International Arena", "revision": 1376541285},
  "seats": {"hockey": 19092, "source": "wikipedia", "wikidata": 19204, "read": "the infobox's figure for ice hockey, 19,092; Wikidata's one capacity (19,204) has no sport"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise; OpenStreetMap maps the building 43.47 metres high"},
};
