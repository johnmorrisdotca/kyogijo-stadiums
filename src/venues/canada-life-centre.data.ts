// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "canada-life-centre",
  "wikidata": "Q656928",
  "division": "central",
  "en": {"title": "Canada Life Centre", "revision": 1379717047},
  "seats": {"hockey": 15225, "source": "wikipedia", "wikidata": 15004, "read": "the article's seating capacity for hockey games, 15,225, which the infobox gives as the top of 8,812 to 15,225; Wikidata's one capacity (15,004) is older, before 278 premium seats were added to the upper level in 2015"},
  "tiers": {"count": 2, "basis": "documented", "lowerShare": 0.579, "read": "the article says the lower bowl holds 8,812 and that premium seats were added to the upper level: two seating levels, the lower with 8,812 of the 15,225"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
