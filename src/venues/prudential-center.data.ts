// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "prudential-center",
  "wikidata": "Q849027",
  "division": "metropolitan",
  "en": {"title": "Prudential Center", "revision": 1380112777},
  "seats": {"hockey": 16514, "source": "wikipedia", "wikidata": 17625, "read": "the infobox's present figure for ice hockey (16,514, from 2015); Wikidata's one capacity (17,625) is the first figure of 2007"},
  "tiers": {"count": 2, "basis": "documented", "read": "the article says the arena has separate concourses for its lower and upper levels (and the lower bowl's middle sections hold 2,330 club seats) with suite levels between: two seating tiers"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise; the article speaks of a high roof of steel"},
};
