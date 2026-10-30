// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "little-caesars-arena",
  "wikidata": "Q18154984",
  "division": "atlantic",
  "en": {"title": "Little Caesars Arena", "revision": 1380799342},
  "seats": {"hockey": 19515, "source": "wikipedia", "wikidata": null, "read": "the article's figure for ice hockey, 19,515, which the infobox gives too; Wikidata gives no capacity for the item"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn; the article says the arena is built as a bowl with its floor 40 feet below street level and a gondola seating level suspended above the stands, which is not a bowl"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise; the glass roof the article speaks of is over the concourse between the arena and its neighbours"},
};
