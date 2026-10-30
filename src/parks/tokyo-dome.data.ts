// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "tokyo-dome",
  "wikidata": "Q733748",
  "name": "Tokyo Dome",
  "nameJa": "東京ドーム",
  "readingJa": "とうきょうドーム",
  "localName": "東京ドーム",
  "localLanguage": "ja",
  "aliases": [
    { "name": "Tokyo Dome", "lang": "en", "kind": "wikipedia", "revision": 1379232526, "source": "en.wikipedia.org" },
    { "name": "東京ドーム", "lang": "ja", "kind": "wikipedia", "revision": 111353030, "reading": "とうきょうドーム", "source": "ja.wikipedia.org" },
    { "name": "The Big Egg", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379232526" },
    { "name": "Tokyo Big Egg", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379232526" },
    { "name": "ビッグエッグ", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 111353030" }
  ],
  "team": "Yomiuri Giants",
  "teamJa": "読売ジャイアンツ",
  "city": "Tokyo",
  "country": "JP",
  "lat": 35.70556,
  "lon": 139.75194,
  "league": "NPB",
  "unit": "m",
  "status": "current",
  "opened": 1988,
  "points": [
    [-45, 100],
    [-22.5, 110],
    [0, 122],
    [22.5, 110],
    [45, 100]
  ],
  "en": {
    "title": "Tokyo Dome",
    "revision": 1379232526
  },
  "ja": {
    "title": "東京ドーム",
    "revision": 111353030
  },
  "walls": [
    {
      "from": -45,
      "to": 45,
      "height": 4,
      "last": 2009,
      "place": "outfield"
    },
    {
      "from": -45,
      "to": 45,
      "height": 4.24,
      "first": 2010,
      "place": "outfield"
    }
  ]
};
