// Made by scripts/build-venues.mjs from scripts/venues.data.json: do not edit by hand. One venue of src/venues.data.ts, for a page that draws it.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/venues.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in venues.osm.data.ts and venues/<id>.osm.data.ts, apart, because it is ODbL.
import type { RealVenueData } from "../venues.ts";

export const VENUE: RealVenueData = {
  "id": "rogers-arena",
  "wikidata": "Q517318",
  "division": "pacific",
  "en": {"title": "Rogers Arena", "revision": 1379918849},
  "seats": {"hockey": 18871, "source": "wikipedia", "wikidata": 18422, "read": "the infobox's present figure for ice hockey (18,871, from 2018); Wikidata's 18,422 is the 1995 figure and the first the infobox lists"},
  "tiers": {"count": 2, "basis": "plausible", "read": "no source says how many seating levels there are: two bowls are drawn; the article speaks of a lower bowl; OpenStreetMap maps four building levels, which are floors, not seating bowls"},
  "roof": {"kind": "fixed", "basis": "plausible", "read": "an indoor arena: a fixed roof, as nothing says otherwise; the long skylight over the middle of the roof, and the cap that closes the roof round it, are ours (the brief's)", "skylight": true},
  "facade": {"podium": 38, "unit": "ft", "basis": "plausible", "read": "the brief: the stepped facade over the Pat Quinn Way front, a lower podium under the upper levels; its height is ours (the sources do not say)"},
};
