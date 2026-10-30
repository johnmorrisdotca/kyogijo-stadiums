// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand. One record of src/grounds.data.ts, for a page that draws this venue alone.
import type { GroundData } from "../grounds.core.ts";

export const GROUND: GroundData = {
    "id": "luzhniki",
    "wikidata": "Q202163",
    "track": true,
    "trackSource": "Wikidata, property P641 (sport) lists athletics",
    "name": "Luzhniki Stadium",
    "names": [
      {"name": "Central Lenin Stadium", "from": 1956, "to": 1992}
    ],
    "nameJa": "ルジニキ・スタジアム",
    "localName": "Лужники",
    "localLanguage": "ru",
    "aliases": [
      {"name": "Luzhniki Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372284143, "source": "en.wikipedia.org"},
      {"name": "ルジニキ・スタジアム", "lang": "ja", "kind": "wikipedia", "revision": 110108346, "source": "ja.wikipedia.org"},
      {"name": "стадион «Лужники»", "lang": "ru", "kind": "official", "source": "en.wikipedia.org revision 1372284143"},
      {"name": "レーニン・スタジアム", "lang": "ja", "kind": "former", "source": "ja.wikipedia.org revision 110108346"},
      {"name": "Лужники", "lang": "ru", "kind": "nickname", "source": "en.wikipedia.org revision 1372284143"}
    ],
    "city": "Moscow",
    "country": "RU",
    "lat": 55.71583,
    "lon": 37.55361,
    "status": "current",
    "from": 1956,
    "capacity": 81000,
    "pitchSize": "published",
    "pitch": {"length": 105, "width": 68, "unit": "m"},
    "en": {"title": "Luzhniki Stadium", "revision": 1372284143},
    "ja": {"title": "ルジニキ・スタジアム", "revision": 110108346},
    "tournaments": [
      {"competition": "world-cup", "year": 2018, "final": true}
    ],
  };
