// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "vantelin-dome-nagoya",
  "wikidata": "Q929524",
  "name": "Vantelin Dome Nagoya",
  "nameJa": "バンテリンドーム ナゴヤ",
  "localName": "バンテリンドーム ナゴヤ",
  "localLanguage": "ja",
  "aliases": [
    { "name": "Vantelin Dome Nagoya", "lang": "en", "kind": "wikipedia", "revision": 1377205624, "source": "en.wikipedia.org" },
    { "name": "ナゴヤドーム", "lang": "ja", "kind": "wikipedia", "revision": 111136533, "source": "ja.wikipedia.org" },
    { "name": "バンテリンドーム ナゴヤ", "lang": "ja", "kind": "sponsor", "from": 2021, "source": "Wikidata Q929524 P1449" },
    { "name": "ナゴヤドーム", "lang": "ja", "kind": "former", "from": 1997, "to": 2020, "source": "ja.wikipedia.org revision 111136533" },
    { "name": "Nagoya Dome", "lang": "en", "kind": "former", "from": 1997, "to": 2020, "source": "en.wikipedia.org revision 1377205624" }
  ],
  "team": "Chunichi Dragons",
  "teamJa": "中日ドラゴンズ",
  "city": "Nagoya",
  "country": "JP",
  "lat": 35.18598,
  "lon": 136.94731,
  "league": "NPB",
  "unit": "m",
  "status": "current",
  "opened": 1997,
  "points": [
    [-45, 100],
    [-22.5, 110],
    [0, 122],
    [22.5, 110],
    [45, 100]
  ],
  "en": {
    "title": "Vantelin Dome Nagoya",
    "revision": 1377205624
  },
  "ja": {
    "title": "ナゴヤドーム",
    "revision": 111136533
  },
  "note": "Left-center and right-center are 110 m from 2026, when the Home Run Wing was added (116 m before).",
  "walls": [
    {
      "from": -45,
      "to": 45,
      "height": 4.8,
      "last": 2025,
      "place": "outfield"
    },
    {
      "from": -45,
      "to": 45,
      "height": 3.6,
      "first": 2026,
      "place": "outfield"
    }
  ]
};
