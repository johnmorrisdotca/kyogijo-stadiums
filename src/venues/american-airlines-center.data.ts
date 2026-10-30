// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "american-airlines-center",
  "wikidata": "Q463345",
  "division": "central",
  "en": {"title": "American Airlines Center", "revision": 1379833787},
  "seats": {"hockey": 18532, "source": "wikipedia", "wikidata": 19200, "read": "the infobox's figure for ice hockey, 18,532 (19,323 with standing room); Wikidata's one capacity (19,200) is the basketball one"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn; the article speaks of retractable seating, which the bowl does not draw"},
  "roof": {"kind": "barrel", "basis": "documented", "read": "the article says the roof looks like a Quonset hut, which is a barrel vault: drawn as a round arch over the rink's short axis, highest over its middle line and falling to the walls at the two long sides; the height of the crown (34 feet over the springing) is ours (the article gives none)"},
};
