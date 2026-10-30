// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "oracle-park",
  "wikidata": "Q298585",
  "name": "Oracle Park",
  "nameJa": "オラクル・パーク",
  "aliases": [
    { "name": "Oracle Park", "lang": "en", "kind": "wikipedia", "revision": 1372223272, "source": "en.wikipedia.org" },
    { "name": "オラクル・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q298585 sitelink" },
    { "name": "SBCパーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q298585 alias" },
    { "name": "パシフィック・ベル・パーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q298585 alias" },
    { "name": "AT&Tパーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q298585 alias" },
    { "name": "Pacific Bell Park", "lang": "en", "kind": "sponsor", "from": 2000, "to": 2003, "source": "en.wikipedia.org revision 1372223272" },
    { "name": "SBC Park", "lang": "en", "kind": "sponsor", "from": 2004, "to": 2005, "source": "en.wikipedia.org revision 1372223272" },
    { "name": "AT&T Park", "lang": "en", "kind": "sponsor", "from": 2006, "to": 2018, "source": "en.wikipedia.org revision 1372223272" }
  ],
  "team": "San Francisco Giants",
  "city": "San Francisco",
  "country": "US",
  "lat": 37.77833,
  "lon": -122.38944,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2000,
  "points": [
    [-45, 339],
    [-33, 354],
    [-20, 399],
    [0, 391],
    [20, 415],
    [33, 365],
    [45, 309]
  ],
  "en": {
    "title": "Oracle Park",
    "revision": 1372223272
  },
  "backstop_ft": 48,
  "walls": [
    {
      "from": -45,
      "to": -20,
      "height": 8,
      "place": "left"
    },
    {
      "from": -20,
      "to": -6,
      "height": 7,
      "place": "center"
    },
    {
      "from": -6,
      "to": 6,
      "height": 10,
      "place": "deadCenter"
    },
    {
      "from": 6,
      "to": 27,
      "height": 20,
      "place": "rightCenter"
    },
    {
      "from": 27,
      "to": 45,
      "height": 24,
      "place": "right"
    }
  ]
};
