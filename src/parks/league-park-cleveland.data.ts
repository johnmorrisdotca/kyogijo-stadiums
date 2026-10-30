// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "league-park-cleveland",
  "wikidata": "Q870897",
  "name": "League Park",
  "nameJa": "リーグ・パーク (クリーブランド)",
  "aliases": [
    { "name": "League Park", "lang": "en", "kind": "wikipedia", "revision": 1373475496, "source": "en.wikipedia.org" },
    { "name": "リーグ・パーク (クリーブランド)", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q870897 sitelink" },
    { "name": "Dunn Field", "lang": "en", "kind": "former", "from": 1921, "to": 1927, "source": "en.wikipedia.org revision 1373475496" }
  ],
  "team": "Cleveland Indians",
  "city": "Cleveland",
  "country": "US",
  "lat": 41.51139,
  "lon": -81.64417,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1891,
  "closed": 1946,
  "from": 1901,
  "to": 1946,
  "points": [
    [-45, 375],
    [-30, 415],
    [-15, 460],
    [0, 420],
    [22.5, 340],
    [45, 290]
  ],
  "en": {
    "title": "League Park",
    "revision": 1373475496
  },
  "note": "Deep center, 460 feet, is listed before center field, 420, and is taken left of it."
};
