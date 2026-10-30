// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "bell-centre",
  "wikidata": "Q522282",
  "division": "atlantic",
  "en": {"title": "Bell Centre", "revision": 1380110375},
  "seats": {"hockey": 20962, "source": "wikipedia", "wikidata": 21273, "read": "the article's seating capacity for hockey, 20,962 (the infobox's present figure, from 2025); Wikidata's one capacity (21,273) is the first figure of 1996"},
  "tiers": {"count": 3, "basis": "documented", "read": "the article says the Bell Centre is arranged in a three-tier layout: the lower 100 section, the 200 section between two levels of boxes, and the upper 300 section"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
