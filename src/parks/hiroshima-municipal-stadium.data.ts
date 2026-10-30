// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "hiroshima-municipal-stadium",
  "wikidata": "Q8012748",
  "name": "Hiroshima Municipal Stadium (original)",
  "nameJa": "旧広島市民球場",
  "readingJa": "きゅうひろしましみんきゅうじょう",
  "localName": "旧広島市民球場",
  "localLanguage": "ja",
  "aliases": [
    { "name": "Hiroshima Municipal Stadium (1957)", "lang": "en", "kind": "wikipedia", "source": "en.wikipedia.org title, via Wikidata Q8012748 sitelink" },
    { "name": "広島市民球場 (初代)", "lang": "ja", "kind": "wikipedia", "revision": 111360293, "reading": "ひろしましみんきゅうじょう (しょだい)", "source": "ja.wikipedia.org" },
    { "name": "広島市民球場", "lang": "ja", "kind": "official", "reading": "ひろしましみんきゅうじょう", "source": "ja.wikipedia.org revision 111360293" },
    { "name": "旧広島市民球場", "lang": "ja", "kind": "nickname", "reading": "きゅうひろしましみんきゅうじょう", "source": "ja.wikipedia.org revision 111360293" }
  ],
  "team": "Hiroshima Toyo Carp (1957-2008)",
  "teamJa": "広島東洋カープ（1957〜2008年）",
  "city": "Hiroshima",
  "country": "JP",
  "lat": 34.39698,
  "lon": 132.45496,
  "league": "NPB",
  "unit": "m",
  "status": "past",
  "opened": 1957,
  "closed": 2010,
  "points": [
    [-45, 91.4],
    [-22.5, 109.7],
    [0, 115.8],
    [22.5, 109.7],
    [45, 91.4]
  ],
  "ja": {
    "title": "広島市民球場 (初代)",
    "revision": 111360293
  },
  "walls": [
    {
      "from": -45,
      "to": 45,
      "height": 2.55,
      "place": "outfield"
    }
  ]
};
