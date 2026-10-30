// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "grand-casino-arena",
  "wikidata": "Q1421388",
  "division": "central",
  "en": {"title": "Grand Casino Arena", "revision": 1379407082},
  "seats": {"hockey": 17954, "source": "wikidata", "wikidata": 17954, "read": "Wikidata's capacity for ice hockey from 2012 (P1083 with P641 ice hockey and P580 2012), the later of its two (18,064 from 2000); the article's lede and infobox give 17,954 too"},
  "tiers": {"count": 3, "basis": "documented", "read": "the article says the arena has four spectator levels, one of suites and three for general seating: three seating bowls, with the suite level as a walk between them"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
