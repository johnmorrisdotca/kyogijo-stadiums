// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "capital-one-arena",
  "wikidata": "Q223240",
  "division": "metropolitan",
  "en": {"title": "Capital One Arena", "revision": 1375927841},
  "seats": {"hockey": 18573, "source": "wikipedia", "wikidata": 20674, "read": "the infobox's figure for ice hockey, 18,573; Wikidata's one capacity (20,674) has no sport and is nearer the basketball one (20,356)"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn; the article says the seats are built vertically rather than out, with limited leg room in the upper levels"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise"},
};
