// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "loandepot-park",
  "wikidata": "Q1368138",
  "name": "loanDepot Park",
  "nameJa": "ローンデポ・パーク",
  "aliases": [
    { "name": "LoanDepot Park", "lang": "en", "kind": "wikipedia", "revision": 1376431410, "source": "en.wikipedia.org" },
    { "name": "ローンデポ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1368138 sitelink" },
    { "name": "マーリンズ・パーク", "lang": "ja", "kind": "former", "source": "Wikidata Q1368138 alias" },
    { "name": "Marlins Park", "lang": "en", "kind": "former", "from": 2012, "to": 2020, "source": "en.wikipedia.org revision 1376431410" }
  ],
  "team": "Miami Marlins",
  "city": "Miami",
  "country": "US",
  "lat": 25.77806,
  "lon": -80.21972,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2012,
  "points": [
    [-45, 344],
    [-22.5, 386],
    [0, 400],
    [22.5, 387],
    [45, 335]
  ],
  "en": {
    "title": "LoanDepot Park",
    "revision": 1376431410
  },
  "backstop_ft": 47,
  "dugouts": {
    "home": "third"
  }
};
