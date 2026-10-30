// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "progressive-field",
  "wikidata": "Q1154053",
  "name": "Progressive Field",
  "nameJa": "プログレッシブ・フィールド",
  "aliases": [
    { "name": "Progressive Field", "lang": "en", "kind": "wikipedia", "revision": 1378504146, "source": "en.wikipedia.org" },
    { "name": "プログレッシブ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1154053 sitelink" },
    { "name": "ジェイコブス・フィールド", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1154053 alias" },
    { "name": "Jacobs Field", "lang": "en", "kind": "sponsor", "from": 1994, "to": 2007, "source": "en.wikipedia.org revision 1378504146" },
    { "name": "The Jake", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378504146" }
  ],
  "team": "Cleveland Guardians",
  "city": "Cleveland",
  "country": "US",
  "lat": 41.49583,
  "lon": -81.68528,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1994,
  "points": [
    [-45, 325],
    [-22.5, 370],
    [-9, 410],
    [0, 400],
    [22.5, 375],
    [45, 325]
  ],
  "en": {
    "title": "Progressive Field",
    "revision": 1378504146
  },
  "backstop_ft": 60,
  "dugouts": {
    "home": "third",
    "visitors": "first"
  },
  "walls": [
    {
      "from": -45,
      "to": -22.5,
      "height": 19,
      "label": "Little Green Monster",
      "place": "left"
    },
    {
      "from": -22.5,
      "to": 45,
      "height": 9,
      "place": "centerToRight"
    }
  ]
};
