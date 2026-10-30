// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "climate-pledge-arena",
  "wikidata": "Q977529",
  "division": "pacific",
  "en": {"title": "Climate Pledge Arena", "revision": 1380851727},
  "seats": {"hockey": 17151, "source": "wikipedia", "wikidata": 18000, "read": "the article's seating capacity for ice hockey, 17,151, which the infobox gives too; Wikidata's one capacity (18,000) is near the basketball one (18,300)"},
  "tiers": {"count": 2, "basis": "documented", "read": "the article tells of the upper level and the lower level, most of the lower level being below street level since the 2021 rebuild: two seating levels"},
  "roof": {"kind": "fixed", "basis": "documented", "read": "the article says the original 1962 roof's shape was kept and carried on a fixed roof of steel trusses (the first, cable-hung, roof being taken down), and that the roof is landmarked"},
};
