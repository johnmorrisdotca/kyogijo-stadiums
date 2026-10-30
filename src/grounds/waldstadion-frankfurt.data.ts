// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand. One record of src/grounds.data.ts, for a page that draws this venue alone.
import type { GroundData } from "../grounds.core.ts";

export const GROUND: GroundData = {
    "id": "waldstadion-frankfurt",
    "wikidata": "Q157273",
    "name": "Deutsche Bank Park",
    "names": [
      {"name": "Waldstadion", "from": 1925, "to": 2005},
      {"name": "Commerzbank-Arena", "from": 2005, "to": 2020},
      {"name": "Neues Waldstadion", "from": 2005, "to": 2006},
      {"name": "FIFA World Cup Stadium Frankfurt", "from": 2006, "to": 2006},
      {"name": "FIFA Women's World Cup Stadium Frankfurt", "from": 2011, "to": 2011}
    ],
    "nameJa": "ドイチェ・バンク・パルク",
    "localName": "Deutsche Bank Park",
    "localLanguage": "de",
    "aliases": [
      {"name": "Waldstadion (Frankfurt)", "lang": "en", "kind": "wikipedia", "revision": 1375755144, "source": "en.wikipedia.org"},
      {"name": "ヴァルトシュタディオン", "lang": "ja", "kind": "wikipedia", "revision": 101381780, "source": "ja.wikipedia.org"},
      {"name": "ドイチェ・バンク・パルク", "lang": "ja", "kind": "official", "source": "ja.wikipedia.org revision 101381780"},
      {"name": "Waldstadion", "lang": "de", "kind": "nickname", "source": "Wikidata Q157273 P1448"},
      {"name": "ヴァルトシュタディオン", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 101381780"}
    ],
    "city": "Frankfurt",
    "country": "DE",
    "lat": 50.06861,
    "lon": 8.64528,
    "status": "current",
    "from": 1925,
    "capacity": 60100,
    "pitchSize": "published",
    "pitch": {"length": 105, "width": 68, "unit": "m"},
    "en": {"title": "Waldstadion (Frankfurt)", "revision": 1375755144},
    "ja": {"title": "ヴァルトシュタディオン", "revision": 101381780},
    "tournaments": [
      {"competition": "world-cup", "year": 1974},
      {"competition": "world-cup", "year": 2006},
      {"competition": "womens-world-cup", "year": 2011, "final": true}
    ],
  };
