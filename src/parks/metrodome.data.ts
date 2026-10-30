// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "metrodome",
  "wikidata": "Q1072186",
  "name": "Hubert H. Humphrey Metrodome",
  "nameJa": "ヒューバート・H・ハンフリー・メトロドーム",
  "aliases": [
    { "name": "Hubert H. Humphrey Metrodome", "lang": "en", "kind": "wikipedia", "revision": 1378988593, "source": "en.wikipedia.org" },
    { "name": "ヒューバート・H・ハンフリー・メトロドーム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1072186 sitelink" },
    { "name": "Mall of America Field at Hubert H. Humphrey Metrodome", "lang": "en", "kind": "sponsor", "source": "en.wikipedia.org revision 1378988593" },
    { "name": "Metrodome", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378988593" },
    { "name": "メトロドーム", "lang": "ja", "kind": "nickname", "source": "Wikidata Q1072186 alias" },
    { "name": "HHHメトロドーム", "lang": "ja", "kind": "nickname", "source": "Wikidata Q1072186 alias" }
  ],
  "team": "Minnesota Twins",
  "city": "Minneapolis",
  "country": "US",
  "lat": 44.97389,
  "lon": -93.25806,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1982,
  "closed": 2014,
  "from": 1982,
  "to": 2009,
  "points": [
    [-45, 343],
    [-22.5, 385],
    [0, 408],
    [22.5, 367],
    [45, 327]
  ],
  "en": {
    "title": "Hubert H. Humphrey Metrodome",
    "revision": 1378988593
  },
  "backstop_ft": 60,
  "walls": [
    {
      "from": -45,
      "to": -22.5,
      "height": 7,
      "last": 1984,
      "place": "left"
    },
    {
      "from": -45,
      "to": -22.5,
      "height": 13,
      "first": 1985,
      "last": 1994,
      "place": "left"
    },
    {
      "from": -45,
      "to": -22.5,
      "height": 7,
      "first": 1995,
      "place": "left"
    },
    {
      "from": -22.5,
      "to": 22.5,
      "height": 7,
      "place": "center"
    },
    {
      "from": 22.5,
      "to": 45,
      "height": 23,
      "label": "Baggie",
      "place": "right"
    }
  ]
};
