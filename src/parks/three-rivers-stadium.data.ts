// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "three-rivers-stadium",
  "wikidata": "Q1189339",
  "name": "Three Rivers Stadium",
  "nameJa": "スリー・リバース・スタジアム",
  "aliases": [
    { "name": "Three Rivers Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372243664, "source": "en.wikipedia.org" },
    { "name": "スリー・リバース・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1189339 sitelink" },
    { "name": "The Blast Furnace", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372243664" },
    { "name": "The House that Clemente Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372243664" }
  ],
  "team": "Pittsburgh Pirates",
  "city": "Pittsburgh",
  "country": "US",
  "lat": 40.44667,
  "lon": -80.01278,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1970,
  "closed": 2000,
  "from": 1970,
  "to": 2000,
  "points": [
    [-45, 335],
    [-22.5, 375],
    [0, 400],
    [22.5, 375],
    [45, 335]
  ],
  "en": {
    "title": "Three Rivers Stadium",
    "revision": 1372243664
  },
  "walls": [
    {
      "from": -45,
      "to": 45,
      "height": 10,
      "place": "outfield"
    }
  ]
};
