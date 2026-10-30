// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "truist-park",
  "wikidata": "Q17003430",
  "name": "Truist Park",
  "nameJa": "トゥルーイスト・パーク",
  "aliases": [
    { "name": "Truist Park", "lang": "en", "kind": "wikipedia", "revision": 1372245868, "source": "en.wikipedia.org" },
    { "name": "トゥルーイスト・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q17003430 sitelink" },
    { "name": "サントラスト・パーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q17003430 alias" },
    { "name": "SunTrust Park", "lang": "en", "kind": "sponsor", "from": 2017, "to": 2020, "source": "en.wikipedia.org revision 1372245868" }
  ],
  "team": "Atlanta Braves",
  "city": "Cumberland",
  "country": "US",
  "lat": 33.8912,
  "lon": -84.4683,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2017,
  "points": [
    [-45, 335],
    [-22.5, 385],
    [0, 400],
    [22.5, 375],
    [45, 325]
  ],
  "en": {
    "title": "Truist Park",
    "revision": 1372245868
  }
};
