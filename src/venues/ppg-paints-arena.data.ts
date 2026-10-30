// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "ppg-paints-arena",
  "wikidata": "Q595460",
  "division": "metropolitan",
  "en": {"title": "PPG Paints Arena", "revision": 1378458359},
  "seats": {"hockey": 18187, "source": "wikipedia", "wikidata": 18387, "read": "the infobox's present figure for ice hockey (18,187, from 2023); Wikidata's one capacity (18,387) is the figure of 2011 to 2023"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
