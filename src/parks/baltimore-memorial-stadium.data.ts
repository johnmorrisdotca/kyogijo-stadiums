// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "baltimore-memorial-stadium",
  "wikidata": "Q2748739",
  "name": "Memorial Stadium (Baltimore)",
  "nameJa": "メモリアル・スタジアム (ボルチモア)",
  "aliases": [
    { "name": "Baltimore Memorial Stadium", "lang": "en", "kind": "wikipedia", "revision": 1379214788, "source": "en.wikipedia.org" },
    { "name": "メモリアル・スタジアム (ボルチモア)", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q2748739 sitelink" },
    { "name": "The World's Largest Outdoor Insane Asylum", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379214788" },
    { "name": "Memorial Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379214788" }
  ],
  "team": "Baltimore Orioles",
  "city": "Baltimore",
  "country": "US",
  "lat": 39.32944,
  "lon": -76.60139,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1922,
  "closed": 1997,
  "from": 1954,
  "to": 1991,
  "points": [
    [-45, 309],
    [-22.5, 378],
    [0, 405],
    [22.5, 378],
    [45, 309]
  ],
  "en": {
    "title": "Baltimore Memorial Stadium",
    "revision": 1379214788
  },
  "periods": [
    {
      "from": 1954,
      "to": 1979,
      "points": [
        [-45, 309],
        [-22.5, 446],
        [0, 445],
        [22.5, 446],
        [45, 309]
      ]
    },
    {
      "from": 1980,
      "to": 1989,
      "points": [
        [-45, 309],
        [-22.5, 446],
        [0, 405],
        [22.5, 446],
        [45, 309]
      ]
    }
  ],
  "note": "The infobox dates the changes of center field (1980) and of the alleys (1990)."
};
