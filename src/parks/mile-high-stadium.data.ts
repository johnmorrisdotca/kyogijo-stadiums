// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "mile-high-stadium",
  "wikidata": "Q1934586",
  "name": "Mile High Stadium",
  "nameJa": "マイル・ハイ・スタジアム",
  "aliases": [
    { "name": "Mile High Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372216043, "source": "en.wikipedia.org" },
    { "name": "マイル・ハイ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1934586 sitelink" },
    { "name": "Bears Stadium", "lang": "en", "kind": "former", "from": 1948, "to": 1968, "source": "en.wikipedia.org revision 1372216043" }
  ],
  "team": "Colorado Rockies",
  "city": "Denver",
  "country": "US",
  "lat": 39.74611,
  "lon": -105.02167,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1948,
  "closed": 2000,
  "from": 1993,
  "to": 1994,
  "points": [
    [-45, 333],
    [-22.5, 366],
    [0, 423],
    [22.5, 400],
    [45, 370]
  ],
  "en": {
    "title": "Mile High Stadium",
    "revision": 1372216043
  },
  "walls": [
    {
      "from": -22.5,
      "to": 22.5,
      "height": 30,
      "place": "center"
    }
  ]
};
