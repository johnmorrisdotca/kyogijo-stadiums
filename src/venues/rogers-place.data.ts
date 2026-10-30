// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "rogers-place",
  "wikidata": "Q5339036",
  "division": "pacific",
  "en": {"title": "Rogers Place", "revision": 1380110483},
  "seats": {"hockey": 18641, "source": "wikidata", "wikidata": 18641, "read": "Wikidata's capacity for ice hockey (P1083 with the sport P641 ice hockey); the article's own line gives 18,347 for a hockey arena, 1.6 percent fewer, and OpenStreetMap has 18,641"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
