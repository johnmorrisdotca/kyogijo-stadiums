// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand. One record of src/grounds.data.ts, for a page that draws this venue alone.
import type { GroundData } from "../grounds.core.ts";

export const GROUND: GroundData = {
    "id": "stadio-olimpico-rome",
    "wikidata": "Q159884",
    "track": true,
    "trackSource": "Wikidata, property P641 (sport) lists athletics",
    "name": "Stadio Olimpico",
    "names": [
      {"name": "Stadio dei Cipressi", "from": 1928, "to": 1953},
      {"name": "Stadio dei Centomila", "from": 1953, "to": 1960}
    ],
    "nameJa": "スタディオ・オリンピコ・ディ・ローマ",
    "localName": "Stadio Olimpico",
    "localLanguage": "it",
    "aliases": [
      {"name": "Stadio Olimpico", "lang": "en", "kind": "wikipedia", "revision": 1376210332, "source": "en.wikipedia.org"},
      {"name": "スタディオ・オリンピコ・ディ・ローマ", "lang": "ja", "kind": "wikipedia", "revision": 109745762, "source": "ja.wikipedia.org"},
      {"name": "The Olimpico", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376210332"},
      {"name": "スタディオ・オリンピコ", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 109745762"}
    ],
    "city": "Rome",
    "country": "IT",
    "lat": 41.93389,
    "lon": 12.45472,
    "status": "current",
    "from": 1953,
    "capacity": 70634,
    "pitchSize": "published",
    "pitch": {"length": 105, "width": 68, "unit": "m"},
    "en": {"title": "Stadio Olimpico", "revision": 1376210332},
    "ja": {"title": "スタディオ・オリンピコ・ディ・ローマ", "revision": 109745762},
    "tournaments": [
      {"competition": "world-cup", "year": 1990, "final": true}
    ],
  };
