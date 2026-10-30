// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "oriole-park-at-camden-yards",
  "wikidata": "Q1141174",
  "name": "Oriole Park at Camden Yards",
  "nameJa": "オリオール・パーク・アット・カムデン・ヤーズ",
  "aliases": [
    { "name": "Oriole Park at Camden Yards", "lang": "en", "kind": "wikipedia", "revision": 1377140400, "source": "en.wikipedia.org" },
    { "name": "オリオール・パーク・アット・カムデン・ヤーズ", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1141174 sitelink" },
    { "name": "Camden Yards", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377140400" },
    { "name": "カムデン・ヤーズ", "lang": "ja", "kind": "nickname", "source": "Wikidata Q1141174 alias" }
  ],
  "team": "Baltimore Orioles",
  "city": "Baltimore",
  "country": "US",
  "lat": 39.28389,
  "lon": -76.62167,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1992,
  "points": [
    [-45, 333],
    [-33, 373],
    [-22, 376],
    [-12, 410],
    [0, 400],
    [22.5, 373],
    [45, 318]
  ],
  "en": {
    "title": "Oriole Park at Camden Yards",
    "revision": 1377140400
  },
  "walls": [
    {
      "from": -45,
      "to": -22,
      "height": 7,
      "last": 2021,
      "place": "left"
    },
    {
      "from": -45,
      "to": -22,
      "height": 13,
      "first": 2022,
      "place": "left"
    },
    {
      "from": 22.5,
      "to": 45,
      "height": 21,
      "place": "right"
    }
  ]
};
