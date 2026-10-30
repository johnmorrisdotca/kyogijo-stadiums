// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "scotiabank-saddledome",
  "wikidata": "Q1140083",
  "division": "pacific",
  "en": {"title": "Scotiabank Saddledome", "revision": 1377341466},
  "seats": {"hockey": 19289, "source": "wikipedia", "wikidata": 16605, "read": "the infobox's present figure for hockey (19,289, from 1995), which the article's amenities line gives too; Wikidata's 16,605 is the 1983 figure and the first the infobox lists"},
  "tiers": {"count": 2, "basis": "documented", "read": "the article speaks of the lower bowl, a second level and upper loges above it: two seating levels with suites at the top of the lower bowl"},
  "roof": {"kind": "saddle", "basis": "documented", "read": "the article says the roof is a reverse hyperbolic paraboloid, shaped like a horse saddle, the longest spanning hyperbolic paraboloid concrete shell; which way the saddle lies and how high it stands are read from photographs, below", "saddle": {"bearing": 60, "low": 78, "high": 138, "read": "the line through the two high points runs 60 degrees (east-northeast and west-southwest: 60 and 240 from north), from three photographs taken from known places (Commons: Scotiabank Saddledome, southeast view 20240819 1, taken from the southeast looking north-northwest, the roof sagging between its high ends left and right; Scotiabank Saddledome from Calgary Tower 2025-07-14, taken from the northwest looking southeast; Scotiabank Saddledome, southwest view 20240819 1, taken from the west looking east along the line, the roof an arch over its near high end), and from the outline's one bulge, the west entrance annex, which lies at 215 to 270 degrees from the building's middle; the low rim stands about 78 feet over the ice (the event level lies below the plaza) and the high points about 138 feet: ours, measured on those photographs, good to about a sixth"}},
  "bowl": {"round": true, "rises": [20,30], "read": "the arena's bowl is round (the interior photographs on Commons show tiers curving all the way round, and the outline's own shape is a circle of 142 metres across less an annex); the rows' rises are ours, lower than the usual because the roof is low over the sides (the lower tier 20 feet, the upper 30)"},
};
