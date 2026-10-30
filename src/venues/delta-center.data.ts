// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "delta-center",
  "wikidata": "Q82294",
  "division": "central",
  "en": {"title": "Delta Center", "revision": 1379043310},
  "seats": {"hockey": 16020, "source": "wikipedia", "wikidata": 19911, "read": "the infobox's figure for ice hockey, 16,020, which the article's lede gives as the most for ice hockey; Wikidata's one capacity (19,911) is not for hockey"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn; the article speaks of a lower bowl rebuilt in 2025 and of terrace-style ledges"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
