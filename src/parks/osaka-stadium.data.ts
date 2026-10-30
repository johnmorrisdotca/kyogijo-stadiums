// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "osaka-stadium",
  "wikidata": "Q861117",
  "name": "Osaka Stadium",
  "nameJa": "大阪球場",
  "readingJa": "おおさかきゅうじょう",
  "localName": "大阪球場",
  "localLanguage": "ja",
  "aliases": [
    { "name": "Osaka Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372223620, "source": "en.wikipedia.org" },
    { "name": "大阪スタヂアム", "lang": "ja", "kind": "wikipedia", "revision": 111155388, "reading": "おおさかスタヂアム", "source": "ja.wikipedia.org" },
    { "name": "大阪スタヂアム", "lang": "ja", "kind": "official", "reading": "おおさかスタヂアム", "source": "ja.wikipedia.org revision 111155388" },
    { "name": "大阪球場", "lang": "ja", "kind": "nickname", "reading": "おおさかきゅうじょう", "source": "ja.wikipedia.org revision 111155388" },
    { "name": "ナンバ球場", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 111155388" }
  ],
  "team": "Nankai Hawks (1950-1988)",
  "teamJa": "南海ホークス（1950〜1988年）",
  "city": "Osaka",
  "country": "JP",
  "lat": 34.66147,
  "lon": 135.5018,
  "league": "NPB",
  "unit": "m",
  "status": "past",
  "opened": 1950,
  "closed": 1998,
  "points": [
    [-45, 91.5],
    [-22.5, 109.7],
    [0, 115.8],
    [22.5, 109.7],
    [45, 91.5]
  ],
  "en": {
    "title": "Osaka Stadium",
    "revision": 1372223620
  },
  "ja": {
    "title": "大阪スタヂアム",
    "revision": 111155388
  },
  "walls": [
    {
      "from": -45,
      "to": -33.75,
      "height": 5.5,
      "place": "left"
    },
    {
      "from": -33.75,
      "to": -11.25,
      "height": 3.8,
      "place": "leftCenter"
    },
    {
      "from": -11.25,
      "to": 11.25,
      "height": 3,
      "place": "center"
    },
    {
      "from": 11.25,
      "to": 33.75,
      "height": 3.8,
      "place": "rightCenter"
    },
    {
      "from": 33.75,
      "to": 45,
      "height": 5.5,
      "place": "right"
    }
  ]
};
