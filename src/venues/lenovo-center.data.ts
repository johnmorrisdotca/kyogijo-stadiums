// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "lenovo-center",
  "wikidata": "Q39177",
  "division": "metropolitan",
  "en": {"title": "Lenovo Center", "revision": 1380055594},
  "seats": {"hockey": 18547, "source": "wikipedia", "wikidata": 19722, "read": "the article's seating for ice hockey, 18,547 (the infobox's present figure, from 2026); Wikidata's one capacity (19,722) has no sport and is nearer the basketball one"},
  "tiers": {"count": 2, "basis": "documented", "read": "the article speaks of the arena's lower bowl and its upper bowl (the seating of the upper bowl replaced in 2018), with 61 suites, 13 luxury boxes and a club level between them: two seating tiers"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise; the article says $7.8 million was budgeted for a new roof in 2022"},
};
