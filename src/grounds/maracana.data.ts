// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand. One record of src/grounds.data.ts, for a page that draws this venue alone.
import type { GroundData } from "../grounds.core.ts";

export const GROUND: GroundData = {
    "id": "maracana",
    "wikidata": "Q155174",
    "name": "Maracanã Stadium",
    "names": [
      {"name": "Estádio Municipal", "from": 1950, "to": 1966}
    ],
    "nameJa": "マラカナン",
    "localName": "Maracanã",
    "localLanguage": "pt",
    "aliases": [
      {"name": "Maracanã Stadium", "lang": "en", "kind": "wikipedia", "revision": 1378863637, "source": "en.wikipedia.org"},
      {"name": "エスタジオ・ド・マラカナン", "lang": "ja", "kind": "wikipedia", "revision": 110510766, "source": "ja.wikipedia.org"},
      {"name": "Estádio Jornalista Mário Filho", "lang": "pt", "kind": "official", "source": "en.wikipedia.org revision 1378863637"},
      {"name": "マラカナン", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 110510766"},
      {"name": "Estádio do Maracanã", "lang": "pt", "kind": "nickname", "source": "en.wikipedia.org revision 1378863637"}
    ],
    "city": "Rio de Janeiro",
    "country": "BR",
    "lat": -22.91222,
    "lon": -43.23028,
    "status": "current",
    "from": 1950,
    "capacity": 73139,
    "pitchSize": "published",
    "pitch": {"length": 105, "width": 68, "unit": "m"},
    "en": {"title": "Maracanã Stadium", "revision": 1378863637},
    "ja": {"title": "エスタジオ・ド・マラカナン", "revision": 110510766},
    "tournaments": [
      {"competition": "world-cup", "year": 1950},
      {"competition": "world-cup", "year": 2014, "final": true}
    ],
  };
