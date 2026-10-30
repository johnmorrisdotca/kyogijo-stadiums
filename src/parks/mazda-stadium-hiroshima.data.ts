// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "mazda-stadium-hiroshima",
  "wikidata": "Q1038647",
  "name": "Mazda Stadium",
  "nameJa": "マツダスタジアム",
  "localName": "マツダスタジアム",
  "localLanguage": "ja",
  "aliases": [
    { "name": "Mazda Stadium", "lang": "en", "kind": "wikipedia", "revision": 1358258868, "source": "en.wikipedia.org" },
    { "name": "MAZDA Zoom-Zoom スタジアム広島", "lang": "ja", "kind": "wikipedia", "revision": 110177362, "reading": "マツダ ズーム・ズーム スタジアムひろしま", "source": "ja.wikipedia.org" },
    { "name": "広島市民球場", "lang": "ja", "kind": "official", "reading": "ひろしましみんきゅうじょう", "source": "ja.wikipedia.org revision 110177362" },
    { "name": "Hiroshima Municipal Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1358258868" },
    { "name": "MAZDA Zoom-Zoom スタジアム広島", "lang": "ja", "kind": "sponsor", "reading": "マツダ ズーム・ズーム スタジアムひろしま", "source": "ja.wikipedia.org revision 110177362" },
    { "name": "Mazda Zoom-Zoom Stadium Hiroshima", "lang": "en", "kind": "sponsor", "source": "en.wikipedia.org revision 1358258868" },
    { "name": "新広島市民球場", "lang": "ja", "kind": "former", "reading": "しんひろしましみんきゅうじょう", "source": "ja.wikipedia.org revision 110177362" },
    { "name": "マツダスタジアム", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 110177362" },
    { "name": "ズムスタ", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 110177362" }
  ],
  "team": "Hiroshima Toyo Carp",
  "teamJa": "広島東洋カープ",
  "city": "Hiroshima",
  "country": "JP",
  "lat": 34.3925,
  "lon": 132.484,
  "league": "NPB",
  "unit": "m",
  "status": "current",
  "opened": 2009,
  "points": [
    [-45, 101],
    [-22.5, 116],
    [0, 122],
    [22.5, 116],
    [45, 100]
  ],
  "en": {
    "title": "Mazda Stadium",
    "revision": 1358258868
  },
  "ja": {
    "title": "MAZDA Zoom-Zoom スタジアム広島",
    "revision": 110177362
  },
  "walls": [
    {
      "from": -45,
      "to": -22.5,
      "height": 3.6,
      "place": "left"
    },
    {
      "from": -22.5,
      "to": 22.5,
      "height": 2.5,
      "place": "center"
    },
    {
      "from": 22.5,
      "to": 45,
      "height": 3.4,
      "place": "right"
    }
  ]
};
