// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "metropolitan-stadium",
  "wikidata": "Q1415967",
  "name": "Metropolitan Stadium",
  "nameJa": "メトロポリタン・スタジアム",
  "aliases": [
    { "name": "Metropolitan Stadium", "lang": "en", "kind": "wikipedia", "revision": 1376371728, "source": "en.wikipedia.org" },
    { "name": "メトロポリタン・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1415967 sitelink" },
    { "name": "The Met", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376371728" },
    { "name": "Met Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376371728" },
    { "name": "Old Met", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376371728" }
  ],
  "team": "Minnesota Twins",
  "city": "Bloomington",
  "country": "US",
  "lat": 44.85444,
  "lon": -93.24194,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1956,
  "closed": 1981,
  "from": 1961,
  "to": 1981,
  "points": [
    [-45, 343],
    [-22.5, 365],
    [0, 402],
    [22.5, 370],
    [45, 330]
  ],
  "en": {
    "title": "Metropolitan Stadium",
    "revision": 1376371728
  },
  "backstop_ft": 60,
  "walls": [
    {
      "from": -45,
      "to": 45,
      "height": 8,
      "place": "outfield"
    }
  ]
};
