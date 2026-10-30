// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "kauffman-stadium",
  "wikidata": "Q1737017",
  "name": "Kauffman Stadium",
  "nameJa": "カウフマン・スタジアム",
  "aliases": [
    { "name": "Kauffman Stadium", "lang": "en", "kind": "wikipedia", "revision": 1376240550, "source": "en.wikipedia.org" },
    { "name": "カウフマン・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1737017 sitelink" },
    { "name": "ロイヤルズ・スタジアム", "lang": "ja", "kind": "former", "source": "Wikidata Q1737017 alias" },
    { "name": "Royals Stadium", "lang": "en", "kind": "former", "from": 1973, "to": 1993, "source": "en.wikipedia.org revision 1376240550" },
    { "name": "The K", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376240550" }
  ],
  "team": "Kansas City Royals",
  "city": "Kansas City",
  "country": "US",
  "lat": 39.05139,
  "lon": -94.48056,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1973,
  "points": [
    [-45, 330],
    [-22.5, 379],
    [0, 410],
    [22.5, 379],
    [45, 330]
  ],
  "en": {
    "title": "Kauffman Stadium",
    "revision": 1376240550
  },
  "note": "Alleys as posted from 2026.",
  "backstop_ft": 60,
  "walls": [
    {
      "from": -45,
      "to": 45,
      "height": 12,
      "last": 1994,
      "place": "outfield"
    },
    {
      "from": -45,
      "to": 45,
      "height": 9,
      "first": 1995,
      "place": "outfield"
    }
  ]
};
